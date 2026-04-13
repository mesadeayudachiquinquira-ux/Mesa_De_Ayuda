const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, { collection: 'users' });

// Hook para encriptar la contraseña antes de guardar
userSchema.pre('save', async function() {
    // Solo si la contraseña fue modificada (o es nueva)
    if (!this.isModified('contraseña')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
});

// Método para comparar contraseñas
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.contraseña);
};

module.exports = mongoose.model('User', userSchema);
