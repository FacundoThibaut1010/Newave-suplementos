import crypto from 'crypto';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import StoreConfig from '../models/StoreConfig.js';
import Order from '../models/Order.js';

/**
 * Las imágenes se guardan en Mongo como data URIs (base64). Mandarlas dentro del JSON
 * hacía que /api/products pesara varios MB. Acá las reemplazamos por URLs cortas
 * (/api/images/<tipo>/<id>/<ruta>?v=<hash>) que se sirven como archivos de imagen
 * cacheables, y al guardar desde el admin las volvemos a convertir al valor original.
 */

const MODELS = { product: Product, config: StoreConfig, order: Order };

const isDataImage = (value) => typeof value === 'string' && value.startsWith('data:image/');

const shortHash = (value) => crypto.createHash('md5').update(value).digest('hex').slice(0, 10);

// Cache de hashes para no recalcular md5 de strings enormes en cada request
const hashCache = new Map();
const hashFor = (value) => {
  const key = value.length + ':' + value.slice(-64);
  let h = hashCache.get(key);
  if (!h) {
    h = shortHash(value);
    if (hashCache.size > 5000) hashCache.clear();
    hashCache.set(key, h);
  }
  return h;
};

export const getBaseUrl = (req) => {
  if (process.env.PUBLIC_API_URL) return process.env.PUBLIC_API_URL.replace(/\/+$/, '');
  const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
};

const toPlain = (doc) => (doc && typeof doc.toObject === 'function' ? doc.toObject() : doc);

/**
 * Devuelve una copia del documento con cada imagen base64 reemplazada por su URL.
 * `skip` permite dejar campos afuera (por ejemplo bestSellers, que son productos populados).
 */
export const withImageUrls = (req, doc, kind, { skip = [] } = {}) => {
  const plain = toPlain(doc);
  if (!plain || !plain._id) return plain;
  const base = getBaseUrl(req);
  const id = String(plain._id);

  const walk = (value, path) => {
    if (isDataImage(value)) {
      return `${base}/api/images/${kind}/${id}/${encodeURIComponent(path)}?v=${hashFor(value)}`;
    }
    if (Array.isArray(value)) return value.map((v, i) => walk(v, path ? `${path}.${i}` : String(i)));
    if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof mongoose.Types.ObjectId) && !Buffer.isBuffer(value)) {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        const childPath = path ? `${path}.${k}` : k;
        out[k] = !path && skip.includes(k) ? v : walk(v, childPath);
      }
      return out;
    }
    return value;
  };

  return walk(plain, '');
};

const getAtPath = (obj, path) =>
  path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);

const IMAGE_URL_RE = /\/api\/images\/(product|config|order)\/([a-f0-9]{24})\/([^?#]+)/;

/**
 * Inverso de withImageUrls: si el admin manda de vuelta una URL nuestra, la cambiamos
 * por el base64 original guardado en la base, así nunca se pierde una foto al editar.
 */
export const restoreImageUrls = async (payload) => {
  const docs = new Map();

  const loadDoc = async (kind, id) => {
    const key = `${kind}:${id}`;
    if (!docs.has(key)) {
      docs.set(key, MODELS[kind].findById(id).lean().then((d) => d || null).catch(() => null));
    }
    return docs.get(key);
  };

  const walk = async (value) => {
    if (typeof value === 'string') {
      const match = value.match(IMAGE_URL_RE);
      if (!match) return value;
      const [, kind, id, rawPath] = match;
      const doc = await loadDoc(kind, id);
      const original = doc ? getAtPath(doc, decodeURIComponent(rawPath)) : undefined;
      return isDataImage(original) ? original : value;
    }
    if (Array.isArray(value)) return Promise.all(value.map(walk));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = await walk(v);
      return out;
    }
    return value;
  };

  return walk(payload);
};

// URL de la primera foto de un producto (para guardar en pedidos sin meter base64)
export const firstProductImageUrl = (req, product) => {
  const converted = withImageUrls(req, product, 'product');
  return converted?.images?.[0] || converted?.image || converted?.variants?.find((v) => v.image)?.image || '';
};

// --- Servir la imagen ---

// Cache en memoria de imágenes ya decodificadas (tope ~60MB)
const MAX_CACHE_BYTES = 60 * 1024 * 1024;
const imageCache = new Map();
let cacheBytes = 0;

const cacheSet = (key, entry) => {
  imageCache.set(key, entry);
  cacheBytes += entry.buffer.length;
  while (cacheBytes > MAX_CACHE_BYTES && imageCache.size > 1) {
    const [oldKey, oldEntry] = imageCache.entries().next().value;
    imageCache.delete(oldKey);
    cacheBytes -= oldEntry.buffer.length;
  }
};

export const serveImage = async (req, res) => {
  const { kind, id } = req.params;
  const path = decodeURIComponent(req.params.path || '');
  const Model = MODELS[kind];

  if (!Model || !mongoose.Types.ObjectId.isValid(id) || !/^[\w.\-áéíóúñÁÉÍÓÚÑ ]+$/.test(path)) {
    return res.status(404).end();
  }

  // La versión (?v=hash) va en la clave: cuando se cambia una foto desde el admin, la URL nueva no usa la caché vieja
  const cacheKey = `${kind}/${id}/${path}?${String(req.query.v || '')}`;
  let entry = imageCache.get(cacheKey);

  if (!entry) {
    const rootField = path.split('.')[0];
    const doc = await Model.findById(id).select(rootField).lean();
    const value = doc ? getAtPath(doc, path) : undefined;

    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
      return res.redirect(301, value);
    }
    if (!isDataImage(value)) return res.status(404).end();

    const [meta, data] = value.split(',');
    const contentType = meta.slice(5).split(';')[0] || 'image/jpeg';
    entry = { buffer: Buffer.from(data, 'base64'), contentType, etag: `"${hashFor(value)}"` };
    cacheSet(cacheKey, entry);
  }

  res.set({
    'Content-Type': entry.contentType,
    // La URL lleva ?v=<hash>: si la imagen cambia, cambia la URL, así que se puede cachear para siempre
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: entry.etag,
    'Cross-Origin-Resource-Policy': 'cross-origin',
  });

  if (req.headers['if-none-match'] === entry.etag) return res.status(304).end();
  res.send(entry.buffer);
};
