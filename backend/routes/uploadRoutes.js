import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('¡Solo se permiten imágenes (JPG, JPEG, PNG, WEBP)!'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private/Admin (we'll keep it simple here, accessible if needed)
router.post('/', upload.single('image'), (req, res) => {
  if (req.file) {
    // Generate the URL based on the server address. For local dev:
    // If FRONTEND_URL is used, we just return the relative path and let the frontend prepend the API URL
    // Or just return the path starting with /uploads/
    res.send({
      message: 'Imagen subida correctamente',
      url: `/uploads/${req.file.filename}`,
    });
  } else {
    res.status(400).send({ message: 'No se subió ninguna imagen' });
  }
});

export default router;
