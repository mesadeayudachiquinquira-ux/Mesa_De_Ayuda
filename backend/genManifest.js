const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const AccessCode = require('./models/AccessCode');

dotenv.config();

const generateManifest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const codes = await AccessCode.find().sort({ dependencia: 1, seccion: 1 });

        let content = "# CÓDIGOS DE ACCESO (PIN) POR DEPENDENCIA\n\n";
        content += "Usa estos códigos de 5 dígitos en el portal para registrar tickets automáticamente.\n\n";

        let currentDep = "";
        codes.forEach(c => {
            if (c.dependencia !== currentDep) {
                currentDep = c.dependencia;
                content += `\n## ${currentDep}\n`;
            }
            content += `- **${c.code}**: ${c.seccion || "General"}\n`;
        });

        fs.writeFileSync('PIN_CODES.md', content);
        console.log("PIN_CODES.md generado con éxito.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

generateManifest();
