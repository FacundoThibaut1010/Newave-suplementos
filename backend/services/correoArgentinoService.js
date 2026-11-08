import https from 'https';
import dotenv from 'dotenv';
dotenv.config();

// Token cache en memoria (resiliente a reinicios serverless)
let memoryToken = null;
let memoryExpiresAt = 0;

/**
 * Cliente HTTP nativo con https.request para evitar que el WAF de Correo Argentino
 * cierre el socket (problema común con Node undici / fetch)
 */
function httpRequest(urlStr, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const bodyStr = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers,
        timeout: 15000,
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => {
          responseBody += chunk;
        });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: async () => responseBody,
            json: async () => JSON.parse(responseBody || '{}'),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Timeout de 15 segundos al conectar con Correo Argentino.'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

/**
 * Servicio oficial para interactuar con la API MiCorreo de Correo Argentino
 */
class CorreoArgentinoService {
  get baseUrl() {
    return process.env.CORREO_BASE_URL || 'https://api.correoargentino.com.ar/micorreo/v1';
  }

  get user() {
    return process.env.CORREO_USER;
  }

  get pass() {
    return process.env.CORREO_PASS;
  }

  get customerId() {
    return process.env.CORREO_CUSTOMER_ID;
  }

  get originCp() {
    return process.env.CORREO_CP_ORIGEN || '1714';
  }

  get fallbackPrice() {
    return process.env.CORREO_ENVIO_RESPALDO ? Number(process.env.CORREO_ENVIO_RESPALDO) : 6500;
  }

  /**
   * Obtiene o renueva el token JWT mediante HTTP Basic Auth
   * POST /token
   */
  async getAuthToken(forceRefresh = false) {
    const now = Date.now();

    // Reutilizar token si aún no vence (margen de seguridad de 2 minutos)
    if (!forceRefresh && memoryToken && memoryExpiresAt > now + 120000) {
      return memoryToken;
    }

    if (!this.user || !this.pass) {
      throw new Error('CORREO_USER y CORREO_PASS deben estar configurados en las variables de entorno.');
    }

    const authHeader = 'Basic ' + Buffer.from(`${this.user}:${this.pass}`).toString('base64');

    const response = await httpRequest(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
    }, {});

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Credenciales rechazadas (401 Unauthorized) en Correo Argentino. Verifica CORREO_USER y CORREO_PASS.');
      }
      throw new Error(`Error al obtener token de Correo Argentino (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (!data?.token) {
      throw new Error('La respuesta de /token no incluyó el JWT requerido.');
    }

    memoryToken = data.token;
    if (data.expires) {
      memoryExpiresAt = new Date(data.expires).getTime();
    } else {
      // 23 horas por defecto
      memoryExpiresAt = now + 23 * 60 * 60 * 1000;
    }

    return memoryToken;
  }

  /**
   * Realiza una petición autenticada a la API de Correo con manejo de 401 y 429
   */
  async requestWithRetry(endpoint, options = {}, retries429 = 2) {
    const token = await this.getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    };

    const url = `${this.baseUrl}${endpoint}`;
    const response = await httpRequest(url, { ...options, headers }, options.body);

    // Manejo de 401: Renovar token y reintentar UNA vez
    if (response.status === 401) {
      console.warn('⚠️ Token de Correo Argentino expirado o inválido (401). Renovando token...');
      const newToken = await this.getAuthToken(true);
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newToken}`,
      };
      return httpRequest(url, { ...options, headers: retryHeaders }, options.body);
    }

    // Manejo de 429: Too Many Requests con backoff exponencial
    if (response.status === 429 && retries429 > 0) {
      const delayMs = (3 - retries429) * 800;
      console.warn(`⚠️ Rate limit (429) de Correo Argentino. Reintentando en ${delayMs}ms...`);
      await new Promise((r) => setTimeout(r, delayMs));
      return this.requestWithRetry(endpoint, options, retries429 - 1);
    }

    return response;
  }

  /**
   * Valida las dimensiones según la normativa de Correo Argentino:
   * - Peso: 1g a 50.000g
   * - Cada lado: máximo 200cm
   * - Sumatoria de lados: máximo 300cm
   */
  validateDimensions(dimensions) {
    const { weight, height, width, length } = dimensions;

    if (!weight || weight < 1 || weight > 50000) {
      throw new Error(`Peso inválido (${weight}g). Debe estar entre 1g y 50.000g.`);
    }
    if (!height || height < 1 || height > 200) {
      throw new Error(`Alto inválido (${height}cm). Debe estar entre 1cm y 200cm.`);
    }
    if (!width || width < 1 || width > 200) {
      throw new Error(`Ancho inválido (${width}cm). Debe estar entre 1cm y 200cm.`);
    }
    if (!length || length < 1 || length > 200) {
      throw new Error(`Largo inválido (${length}cm). Debe estar entre 1cm y 200cm.`);
    }
    if (height + width + length > 300) {
      throw new Error(`La sumatoria de los lados (${height + width + length}cm) no puede superar 300cm.`);
    }
  }

  /**
   * Cotiza el envío con Correo Argentino
   * - Si hay 1 solo producto con cantidad 1: usa POST /rates
   * - Si hay múltiples productos o cantidades: usa POST /rates/packages
   */
  async quoteRates(destinationCP, itemsWithDimensions) {
    if (!destinationCP) {
      throw new Error('El código postal de destino es requerido.');
    }

    // Extraer formato de CP argentino (4 dígitos)
    const cleanCP = destinationCP.toString().replace(/\D/g, '');
    if (cleanCP.length !== 4) {
      throw new Error('El código postal debe contener 4 dígitos válidos de Argentina (ej: 1425, 1714).');
    }

    if (!itemsWithDimensions || !Array.isArray(itemsWithDimensions) || itemsWithDimensions.length === 0) {
      throw new Error('Se requiere al menos un producto para cotizar.');
    }

    if (!this.customerId) {
      console.warn('⚠️ CORREO_CUSTOMER_ID no está configurado.');
      if (this.fallbackPrice) return this.getFallbackRates();
      throw new Error('Falta configurar CORREO_CUSTOMER_ID en las variables de entorno.');
    }

    // Validar cada ítem
    itemsWithDimensions.forEach((item) => {
      this.validateDimensions(item);
    });

    const totalQuantity = itemsWithDimensions.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

    let endpoint;
    let payload;

    if (itemsWithDimensions.length === 1 && totalQuantity === 1) {
      // POST /rates para un solo producto
      endpoint = '/rates';
      const item = itemsWithDimensions[0];
      payload = {
        customerId: String(this.customerId),
        postalCodeOrigin: String(this.originCp),
        postalCodeDestination: String(cleanCP),
        deliveredType: null, // null devuelve tanto "D" (domicilio) como "S" (sucursal)
        dimensions: {
          weight: Math.round(item.weight),
          height: Math.round(item.height),
          width: Math.round(item.width),
          length: Math.round(item.length),
        },
      };
    } else {
      // POST /rates/packages para múltiples productos (apilamiento automático por Correo)
      endpoint = '/rates/packages';
      payload = {
        customerId: String(this.customerId),
        postalCodeOrigin: String(this.originCp),
        postalCodeDestination: String(cleanCP),
        deliveredType: null,
        dimensions: itemsWithDimensions.map((item) => ({
          quantity: Number(item.quantity) || 1,
          weight: Math.round(item.weight),
          height: Math.round(item.height),
          width: Math.round(item.width),
          length: Math.round(item.length),
        })),
      };
    }

    try {
      const response = await this.requestWithRetry(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Correo Argentino ${endpoint} respondió ${response.status}:`, errorText);

        if (this.fallbackPrice) {
          console.warn(`⚠️ Activando tarifa de respaldo configurada ($${this.fallbackPrice}) tras código ${response.status}`);
          return this.getFallbackRates();
        }

        if (response.status === 400 || response.status === 422) {
          throw new Error('Código postal no válido o fuera de zona de cobertura de Correo Argentino.');
        }

        throw new Error(`Error en el cálculo de tarifas (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data?.rates || !Array.isArray(data.rates) || data.rates.length === 0) {
        if (this.fallbackPrice) return this.getFallbackRates();
        throw new Error('Correo Argentino no devolvió opciones de envío para esta zona.');
      }

      // Normalizar opciones
      return data.rates.map((r) => ({
        deliveredType: r.deliveredType, // 'D' o 'S'
        productType: r.productType || 'CP', // 'CP' o 'EP'
        productName: r.productName || (r.deliveredType === 'D' ? 'Correo Argentino a Domicilio' : 'Correo Argentino a Sucursal'),
        price: Number(r.price),
        deliveryTimeMin: String(r.deliveryTimeMin || '2'),
        deliveryTimeMax: String(r.deliveryTimeMax || '5'),
      }));
    } catch (error) {
      console.error('❌ Excepción al cotizar con Correo Argentino:', error.message, error.cause || error);
      if (this.fallbackPrice) {
        console.warn(`⚠️ Retornando tarifa de respaldo de $${this.fallbackPrice}`);
        return this.getFallbackRates();
      }
      throw error;
    }
  }

  /**
   * Genera opciones de respaldo cuando la API no responde
   */
  getFallbackRates() {
    return [
      {
        deliveredType: 'D',
        productType: 'CP',
        productName: 'Correo Argentino - Envío Estándar a Domicilio',
        price: this.fallbackPrice || 6500,
        deliveryTimeMin: '3',
        deliveryTimeMax: '6',
        isFallback: true,
      },
      {
        deliveredType: 'S',
        productType: 'CP',
        productName: 'Correo Argentino - Retiro en Sucursal',
        price: Math.round((this.fallbackPrice || 6500) * 0.75),
        deliveryTimeMin: '2',
        deliveryTimeMax: '5',
        isFallback: true,
      },
    ];
  }

  // =========================================================================
  // PRÓXIMO PASO: Estructura preparada para importación y tracking
  // =========================================================================

  /**
   * Importa un envío a la plataforma MiCorreo una vez confirmado el pago
   * POST /shipping/import
   */
  async importShipping(orderData) {
    throw new Error('Método importShipping preparado para próxima etapa.');
  }

  /**
   * Consulta el estado de seguimiento de un paquete importado
   * GET /shipping/tracking
   */
  async getTracking(shippingId) {
    throw new Error('Método getTracking preparado para próxima etapa.');
  }
}

export default new CorreoArgentinoService();

