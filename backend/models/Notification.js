const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    usuarioId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    mensaje: {
        type: String,
        required: true,
    },
    tipo: {
        type: String,
        enum: ['nuevo_ticket', 'nuevo_mensaje', 'estado_cambiado', 'asignacion'],
        required: true,
    },
    link: {
        type: String, // Para redirigir al ticket específico
    },
    leido: {
        type: Boolean,
        default: false,
    },
    fecha: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);
