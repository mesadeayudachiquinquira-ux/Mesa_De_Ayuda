const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { nombre, email, contraseña } = req.body;

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Por favor, incluya todos los campos' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    // Crear el usuario (por defecto rol 'usuario')
    const user = await User.create({
        nombre,
        email,
        contraseña: hashedPassword,
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Datos de usuario inválidos' });
    }
};

// @desc    Autenticar un usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, contraseña } = req.body;

    const user = await User.findOne({ email });

    // Verificar contraseña
    if (user && (await bcrypt.compare(contraseña, user.contraseña))) {
        res.json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
};

// @desc    Obtener datos del usuario actual
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    const user = {
        id: req.user._id,
        email: req.user.email,
        nombre: req.user.nombre,
        rol: req.user.rol,
    };
    res.status(200).json(user);
};

// Generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
