const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const seedAdmin = async () => {
    try {
        await connectDB();

        // Clean old users (optional)
        // await User.deleteMany();

        const adminExists = await User.findOne({ email: 'admin@mesadeayuda.com' });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create({
                nombre: 'Administrador Principal',
                email: 'admin@mesadeayuda.com',
                contraseña: hashedPassword,
                rol: 'admin'
            });
            console.log('Usuario administrador creado exitosamente.');
            console.log('Credenciales: admin@mesadeayuda.com / admin123');
        } else {
            console.log('El usuario administrador ya existe.');
        }

        process.exit();
    } catch (error) {
        console.error('Error al poblar la base de datos:', error);
        process.exit(1);
    }
};

seedAdmin();
