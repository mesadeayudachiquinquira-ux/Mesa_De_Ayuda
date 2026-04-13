require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Limpiar base previniendo duplicados
        await User.deleteMany({ email: 'admin@chiquinquira.gov.co' });

        const adminUser = new User({
            nombre: 'Administrador Principal',
            email: 'admin@chiquinquira.gov.co',
            contraseña: 'admin',
            rol: 'admin'
        });

        await adminUser.save();
        console.log('✅ Usuario Administrador creado exitosamente en la DB Nueva!');
        process.exit();
    } catch (error) {
        console.error('❌ Error creando admin:', error);
        process.exit(1);
    }
};

seedAdmin();
