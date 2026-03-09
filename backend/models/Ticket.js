const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
    },
    descripcion: {
        type: String,
        required: true,
    },
    estado: {
        type: String,
        enum: ['abierto', 'en_progreso', 'cerrado'],
        default: 'abierto',
    },
    dependencia: {
        type: String,
        required: true,
    },
    seccion: {
        type: String,
        required: false,
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Ahora es opcional para tickets públicos
    },
    // Campos para usuarios externos (públicos)
    nombreContacto: {
        type: String,
        required: false,
    },
    correoContacto: {
        type: String,
        required: false,
    },
    telefonoContacto: {
        type: String,
        required: false,
    },
    asignadoA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    fechaCreación: {
        type: Date,
        default: Date.now,
    },
    adjuntos: [{
        type: String,
    }],
    esPúblico: {
        type: Boolean,
        default: false,
    },
    codigoAcceso: {
        type: String,
        required: false, // Solo para tickets públicos
    },
    comentarioResolucion: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('Ticket', ticketSchema);
