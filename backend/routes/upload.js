const express = require('express');
const multer  = require('multer');
const { v2: cloudinary } = require('cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
});

function resourceType(mime) {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'video'; // Cloudinary gère audio comme video
  return 'raw';
}

function uploadStream(buffer, opts) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) reject(err); else resolve(result);
    }).end(buffer);
  });
}

router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu' });

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({ error: 'Stockage de fichiers non configuré (Cloudinary manquant)' });
    }

    const result = await uploadStream(req.file.buffer, {
      resource_type: resourceType(req.file.mimetype),
      folder: 'boothub',
      use_filename: true,
      unique_filename: true,
    });

    res.json({
      url:  result.secure_url,
      type: req.file.mimetype,
      name: req.file.originalname,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    res.status(500).json({ error: 'Échec du téléchargement : ' + err.message });
  }
});

module.exports = router;
