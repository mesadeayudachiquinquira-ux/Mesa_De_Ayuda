const mongoose = require('mongoose');

const accessCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        length: 5
    },
    dependencia: {
        type: String,
        required: true
    },
    seccion: {
        type: String,
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('AccessCode', accessCodeSchema);
