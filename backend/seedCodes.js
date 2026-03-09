const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AccessCode = require('./models/AccessCode');

dotenv.config();

const ORGANIGRAM = {
    "Despacho del Alcalde": ["Oficina de Control Interno de Gestión", "Oficina Asesora Jurídica", "Oficina de las TICs y Gobierno Digital", "Dirección de Compras Públicas"],
    "Secretaría de Gobierno y Convivencia Ciudadana": ["Inspección de Policía 1", "Inspección de Policía 2", "Comisaría de Familia 1", "Comisaría de Familia 2", "Comisaría de Familia 3"],
    "Secretaría General": ["Dirección de Talento Humano", "Almacén General"],
    "Secretaría Hacienda": ["Dirección de Tesorería y Presupuesto", "Dirección de Fiscalización", "Dirección Técnica de Contabilidad"],
    "Secretaría de Integración Social, Familia y Educación": ["Dirección Local de Salud", "Programas Sociales"],
    "Secretaría de Competitividad y Economía Territorial": ["Unidad Municipal de Asistencia Técnica Agropecuaria"],
    "Secretaría de Tránsito y Transporte": ["Inspección de Tránsito Municipal", "Cuerpo de Agentes"],
    "Secretaría de Infraestructura y Valorización": ["Dirección Técnica de Infraestructura Física", "Medio Ambiente"],
    "Secretaría de Planeación y Desempeño Institucional": ["Dirección Estratégica de Control Urbanístico"],
    "Secretaría de Turismo, Patrimonio y Comunicación Pública": []
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado para seed de códigos...');
    } catch (err) {
        console.error('Error conectando a MongoDB:', err.message);
        process.exit(1);
    }
};

const generateUniquePin = async (usedPins) => {
    let pin;
    do {
        pin = Math.floor(10000 + Math.random() * 90000).toString();
    } while (usedPins.has(pin));
    usedPins.add(pin);
    return pin;
};

const seedCodes = async () => {
    try {
        await AccessCode.deleteMany(); // Limpiar códigos anteriores
        const usedPins = new Set();
        const codes = [];

        for (const [dep, secciones] of Object.entries(ORGANIGRAM)) {
            // Código para la dependencia general
            codes.push({
                code: await generateUniquePin(usedPins),
                dependencia: dep,
                seccion: ''
            });

            // Códigos para cada sección
            for (const seccion of secciones) {
                codes.push({
                    code: await generateUniquePin(usedPins),
                    dependencia: dep,
                    seccion: seccion
                });
            }
        }

        await AccessCode.insertMany(codes);
        console.log(`✅ ${codes.length} códigos de acceso generados con éxito.`);

        // Mostrar los códigos generados (esto se puede guardar en un log para el usuario)
        console.table(codes);

        process.exit();
    } catch (err) {
        console.error('Error en el seed de códigos:', err);
        process.exit(1);
    }
};

connectDB().then(seedCodes);
