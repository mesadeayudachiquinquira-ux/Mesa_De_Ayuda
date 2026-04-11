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
        index: true, // Índice para filtrado rápido por estado
    },
    dependencia: {
        type: String,
        required: true,
        index: true, // Índice para filtrado por dependencia
    },
    seccion: {
        type: String,
        required: false,
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true, // Índice para buscar tickets por técnico
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
        index: true, // Índice para tickets asignados
    },
    fechaCreación: {
        type: Date,
        default: Date.now,
        index: true, // Índice para ordenación por fecha
    },
    adjuntos: [{
        type: String,
    }],
    esPúblico: {
        type: Boolean,
        default: false,
        index: true,
    },
    codigoAcceso: {
        type: String,
        required: false,
        unique: true,
        sparse: true, // Solo indexar los que tienen código (públicos)
        index: true, 
    },
    comentarioResolucion: {
        type: String,
        required: false,
    },
    atendidoPorNombre: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('Ticket', ticketSchema);
