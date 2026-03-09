const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    contraseña: {
        type: String,
        required: true,
    },
    rol: {
        type: String,
        enum: ['admin', 'usuario'],
        default: 'usuario',
    },
    fechaRegistro: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'users' });

module.exports = mongoose.model('User', userSchema);
