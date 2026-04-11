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

// @desc    Solicitar código de recuperación de contraseña
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No existe un usuario con ese correo' });
        }

        // Generar código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar en la DB (expira en 10 minutos)
        user.resetPasswordToken = resetCode;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Enviar correo
        const { sendMailToInternalUsers } = require('../utils/emailService');
        const subject = 'MuniSupport - Código de Recuperación';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
                <h2 style="color: #1a43bf; text-align: center;">Recuperación de Contraseña</h2>
                <p>Usted ha solicitado restablecer su contraseña en MuniSupport Chiquinquira.</p>
                <p>Utilice el siguiente código para validar su identidad:</p>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 5px;">${resetCode}</span>
                </div>
                <p style="font-size: 12px; color: #6b7280;">Este código expirará en 10 minutos por razones de seguridad.</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 11px; color: #9ca3af; text-align: center;">MuniSupport - Gestión Institucional</p>
            </div>
        `;

        await sendMailToInternalUsers(user.email, subject, `Su código es: ${resetCode}`, html);

        res.status(200).json({ message: 'Código enviado al correo electrónico' });
    } catch (error) {
        next(error);
    }
};

// @desc    Verificar código de recuperación
// @route   POST /api/auth/verify-code
// @access  Public
const verifyResetCode = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Código inválido o expirado' });
        }

        res.status(200).json({ message: 'Código verificado correctamente' });
    } catch (error) {
        next(error);
    }
};

// @desc    Restablecer contraseña usando el código validado
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { email, code, nuevaContraseña } = req.body;

        const user = await User.findOne({
            email,
            resetPasswordToken: code,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Sesión de recuperación inválida o expirada' });
        }

        // Actualizar contraseña (el middleware pre-save la encriptará)
        user.contraseña = nuevaContraseña;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Contraseña actualizada correctamente' });
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
    forgotPassword,
    verifyResetCode,
    resetPassword,
};
