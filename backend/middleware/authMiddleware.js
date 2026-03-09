const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Obtener el token del encabezado
            token = req.headers.authorization.split(' ')[1];

            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);

            // Obtener el usuario del token (excluyendo la contraseña)
            req.user = await User.findById(decoded.id).select('-contraseña');

            if (!req.user) {
                console.log('Usuario no encontrado en la DB para el ID:', decoded.id);
                return res.status(401).json({ message: 'No autorizado, usuario no existe' });
            }

            console.log('Usuario autenticado:', req.user.nombre, 'Rol:', req.user.rol);
            next();
        } catch (error) {
            console.error('Error en authMiddleware:', error.message);
            res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no hay token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'No autorizado como administrador' });
    }
};

module.exports = { protect, admin };
