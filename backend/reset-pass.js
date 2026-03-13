const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function resetPassword() {
    await mongoose.connect(process.env.MONGO_URI);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const user = await User.findOneAndUpdate(
        { email: 'fferchossavila123@gmail.com' },
        { contraseña: hashedPassword },
        { new: true }
    );

    if (user) {
        console.log('Password reset successfully to admin123 for:', user.email);
    } else {
        console.log('User not found. Password was not reset.');
    }
    
    mongoose.connection.close();
}
resetPassword();
