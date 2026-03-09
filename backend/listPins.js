const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AccessCode = require('./models/AccessCode');
const fs = require('fs');

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const codes = await AccessCode.find({}).lean();
    if (codes.length === 0) {
        fs.writeFileSync('pins_actuales.txt', 'No hay codigos de acceso en la base de datos.');
    } else {
        let output = codes.length + ' codigos encontrados:\n\n';
        codes.forEach(c => {
            const sec = c.seccion ? ' - ' + c.seccion : ' (General)';
            output += 'PIN: ' + c.code + '  |  ' + c.dependencia + sec + '\n';
        });
        fs.writeFileSync('pins_actuales.txt', output, { encoding: 'utf8' });
    }
    console.log('Listo. Revisa el archivo pins_actuales.txt');
    process.exit();
}).catch(err => {
    fs.writeFileSync('pins_actuales.txt', 'Error: ' + err.message);
    process.exit(1);
});
