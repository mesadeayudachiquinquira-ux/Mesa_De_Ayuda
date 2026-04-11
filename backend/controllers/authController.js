const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    try {
        const { nombre, email, contraseña } = req.body;

        if (!nombre || !email || !contraseña) {
            return res.status(400).json({ message: 'Por favor, incluya todos los campos' });
        }

        // Verificar si el usuario ya existe
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Crear el usuario (el hashing se hace en el modelo)
        const user = await User.create({
            nombre,
            email,
            contraseña,
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
    } catch (error) {
        next(error);
    }
};

// @desc    Autenticar un usuario
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, contraseña } = req.body;

        const user = await User.findOne({ email });

        // Verificar contraseña usando el método del modelo
        if (user && (await user.matchPassword(contraseña))) {
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
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener datos del usuario actual
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = {
            id: req.user._id,
            email: req.user.email,
            nombre: req.user.nombre,
            rol: req.user.rol,
        };
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

// Generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '24h',
    });
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
};
