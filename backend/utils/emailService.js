const nodemailer = require('nodemailer');

// Para desarrollo, usaremos Ethereal Email si no se proveen credenciales
// Ethereal atrapa los correos y da una URL para previsualizarlos (ideal para probar sin arriesgar enviar reales)
const createTransporter = async () => {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback a Ethereal para testing
        const testAccount = await nodemailer.createTestAccount();
        console.log('⚠️ Usando cuenta de correo de prueba (Ethereal)');
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
};

/**
 * Envía un correo electrónico a uno o más destinatarios.
 * @param {string|string[]} to - Correo(s) destino
 * @param {string} subject - Asunto del correo
 * @param {string} text - Contenido en texto plano
 * @param {string} html - Contenido en HTML (opcional)
 */
const sendMailToInternalUsers = async (to, subject, text, html) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: `"Soporte Municipal" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@mesadeayuda.local'}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✉️ Correo enviado a: ${mailOptions.to} - Asunto: ${subject}`);
        if (!process.env.SMTP_HOST || process.env.SMTP_HOST.includes('ethereal')) {
            console.log(`👀 Previsualiza el correo de prueba aquí: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return info;
    } catch (error) {
        console.error('❌ Error enviando el correo:', error);
        return null;
    }
};

module.exports = {
    sendMailToInternalUsers
};
