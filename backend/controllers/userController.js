const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Obtener todos los usuarios (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-contraseña');
    res.json(users);
};

// @desc    Crear un usuario desde el panel de admin
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    const { nombre, email, contraseña, rol } = req.body;

    if (!nombre || !email || !contraseña) {
        return res.status(400).json({ message: 'Llene los campos obligatorios' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'Usuario ya existente' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contraseña, salt);

    const user = await User.create({
        nombre,
        email,
        contraseña: hashedPassword,
        rol: rol || 'usuario',
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
        });
    } else {
        res.status(400).json({ message: 'Datos inválidos' });
    }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Usuario eliminado' });
    } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
    }
};

// @desc    Actualizar un usuario
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.nombre = req.body.nombre || user.nombre;
            user.email = req.body.email || user.email;
            user.rol = req.body.rol || user.rol;

            if (req.body.contraseña && req.body.contraseña.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                user.contraseña = await bcrypt.hash(req.body.contraseña, salt);
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                nombre: updatedUser.nombre,
                email: updatedUser.email,
                rol: updatedUser.rol,
            });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    deleteUser,
    updateUser
};
