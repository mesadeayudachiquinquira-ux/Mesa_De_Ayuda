const User = require('../models/User');

// @desc    Obtener todos los usuarios (Admin)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-contraseña');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Crear un usuario desde el panel de admin
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
    try {
        const { nombre, email, contraseña, rol } = req.body;

        if (!nombre || !email || !contraseña) {
            return res.status(400).json({ message: 'Llene los campos obligatorios' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Usuario ya existente' });
        }

        // El hash se hace automáticamente en el modelo User.js
        const user = await User.create({
            nombre,
            email,
            contraseña,
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
    } catch (error) {
        next(error);
    }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: 'Usuario eliminado' });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Actualizar un usuario
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.nombre = req.body.nombre || user.nombre;
            user.email = req.body.email || user.email;
            user.rol = req.body.rol || user.rol;

            // Si se envía una nueva contraseña, el modelo la hashearà al guardar
            if (req.body.contraseña && req.body.contraseña.trim() !== '') {
                user.contraseña = req.body.contraseña;
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
        next(error);
    }
};

module.exports = {
    getUsers,
    createUser,
    deleteUser,
    updateUser
};
