const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testPublicTicket() {
    try {
        const formData = new FormData();
        formData.append('titulo', 'Test Ticket 123');
        formData.append('descripcion', 'This is a test description');
        formData.append('pin', '63A42F');
        formData.append('nombreContacto', 'Test User');
        formData.append('correoContacto', 'test@test.com');
        formData.append('telefonoContacto', '1234567890');

        console.log('Sending request to /api/tickets/public...');
        const response = await axios.post('http://localhost:5000/api/tickets/public', formData, {
            headers: formData.getHeaders(),
        });

        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testPublicTicket();
