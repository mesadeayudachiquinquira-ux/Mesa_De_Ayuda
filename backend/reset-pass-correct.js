const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function resetPassword() {
    await mongoose.connect(process.env.MONGO_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.findOneAndUpdate(
        { email: 'admin@mesadeayuda.com' },
        { contraseña: hashedPassword }
    );

    console.log('Password reset for admin@mesadeayuda.com to admin123');
    mongoose.connection.close();
}
resetPassword();
