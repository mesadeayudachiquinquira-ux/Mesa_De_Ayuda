const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    nombre: String,
    email: String,
    rol: String
});
const User = mongoose.model('User', UserSchema);

async function listUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, 'nombre email rol');
    console.log(JSON.stringify(users, null, 2));
    mongoose.connection.close();
}
listUsers();
