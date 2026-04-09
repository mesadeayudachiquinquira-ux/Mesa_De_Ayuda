const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');

// Configurar Cloudinary con las variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Guardamos el archivo en memoria (buffer) para después subirlo a Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB máximo
    fileFilter: (req, file, cb) => {
        const allowed = /jpg|jpeg|png|pdf|doc|docx/;
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (allowed.test(ext)) return cb(null, true);
        cb(new Error('Solo se permiten imágenes y documentos (jpg, jpeg, png, pdf, doc, docx)'));
    }
});

/**
 * Sube un buffer de archivo a Cloudinary y retorna la URL pública.
 * Usa base64 para evitar dependencias extra.
 * @param {Buffer} buffer  - Contenido del archivo en memoria
 * @param {string} mimetype - MIME type del archivo
 * @returns {Promise<string>} URL pública en Cloudinary
 */
const uploadToCloudinary = async (buffer, mimetype) => {
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimetype};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'mesa_de_ayuda_adjuntos',
        resource_type: 'auto'
    });
    return result.secure_url;
};

module.exports = { upload, uploadToCloudinary };
