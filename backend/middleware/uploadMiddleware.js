const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configurar Cloudinary usando variables de entorno
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'mesa_de_ayuda_adjuntos', // Nombre de la carpeta en tu dashboard de Cloudinary
        resource_type: 'auto',            // Permite imágenes y archivos 'raw' (pdf, docx)
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    },
});

const upload = multer({
    storage,
});

module.exports = upload;
