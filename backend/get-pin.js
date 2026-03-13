const mongoose = require('mongoose');
require('dotenv').config();
const Ticket = require('./models/Ticket');

async function testQuery() {
    await mongoose.connect(process.env.MONGO_URI);
    const tickets = await Ticket.find({}).sort({ fechaCreación: -1 }).limit(3);
    console.log("Recent tickets:\n" + JSON.stringify(tickets, null, 2));
    mongoose.connection.close();
}

testQuery();
