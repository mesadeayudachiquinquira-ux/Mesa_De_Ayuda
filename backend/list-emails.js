const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({ email: String });
const User = mongoose.model('User', UserSchema);

async function listEmails() {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('EMAILS FOUND:');
    users.forEach(u => console.log(`- ${u.email}`));
    mongoose.connection.close();
}
listEmails();
