const sgMail = require('@sendgrid/mail');

// Inicializar SendGrid con la API key (evita el bloqueo de puertos SMTP en Render)
if (process.env.SMTP_PASS) {
    sgMail.setApiKey(process.env.SMTP_PASS);
}

const FROM_EMAIL = process.env.SMTP_FROM || 'mesadeayudachiquinquira@gmail.com';

/**
 * Función auxiliar para capitalizar nombres (ej: juan -> Juan)
 */
const capitalize = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, l => l.toUpperCase());
};

// ─── Estilos base optimizados para compatibilidad con correo ───────────────
const baseStyles = `
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #1e40af; background: linear-gradient(135deg, #1e40af 0%, #17368d 100%); padding: 30px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: bold; }
    .header p { margin: 5px 0 0; color: #dbeafe; font-size: 14px; letter-spacing: 0.5px; }
    .body { padding: 40px; }
    .body h2 { color: #1e3a8a; font-size: 19px; margin-top: 0; margin-bottom: 20px; }
    .body p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
    .code-box { background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 6px; padding: 20px; text-align: center; margin: 25px 0; }
    .code-box span { font-size: 26px; font-weight: bold; letter-spacing: 4px; color: #1e40af; font-family: monospace; }
    
    /* Estilos de tabla para alineación perfecta */
    .info-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .info-table td { padding: 8px 0; vertical-align: top; font-size: 14px; }
    .info-label { width: 110px; color: #6b7280; font-weight: bold; text-transform: uppercase; font-size: 12px; }
    .info-value { color: #111827; font-weight: 500; }
    
    .status-box { background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 0; }
    .status-box p { margin: 0; color: #1e40af; font-size: 15px; }
    .res-box { background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; margin: 20px 0; }
    .res-box p { margin: 0; color: #166534; font-size: 15px; font-style: italic; }
    
    .footer { background-color: #f8fafc; padding: 25px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 12px; color: #94a3b8; }
`;

// ─── Plantilla 1: Recibo de bienvenida ─────────────────────────────────────
const templateBienvenida = ({ nombre, titulo, dependencia, codigoAcceso }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>🏛️ MuniSupport Chiquinquirá</h1>
        <p>Sistema de Gestión de Solicitudes</p>
    </div>
    <div class="body">
        <h2>Hemos recibido su solicitud, ${capitalize(nombre)}.</h2>
        <p>
            Su requerimiento ha sido registrado exitosamente y se encuentra actualmente en revisión por parte del 
            <strong>equipo de soporte</strong>.
        </p>
        <div class="code-box"><span>${codigoAcceso}</span></div>
        <table class="info-table">
            <tr><td class="info-label">Asunto</td><td class="info-value">${titulo}</td></tr>
            <tr><td class="info-label">Dependencia</td><td class="info-value">${dependencia}</td></tr>
        </table>
        <p style="margin-top: 25px;">
            Guarde su código de seguimiento para consultar el estado de su trámite y las respuestas enviadas por nuestro equipo.
        </p>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquirá &bull; Sistema de Gestión de Solicitudes</p></div>
</div></body></html>`;

// ─── Plantilla 2: Cierre y resolución ──────────────────────────────────────
const templateResolucion = ({ nombre, titulo, codigoAcceso, resolucion, atendidoPor }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>🏛️ MuniSupport Chiquinquirá</h1>
        <p>Sistema de Gestión de Solicitudes</p>
    </div>
    <div class="body">
        <h2>✅ Solicitud resuelta, ${capitalize(nombre)}.</h2>
        <p>Su requerimiento con código <strong>${codigoAcceso}</strong> ha sido atendido satisfactoriamente.</p>
        <table class="info-table">
            <tr><td class="info-label">Asunto</td><td class="info-value">${titulo}</td></tr>
            <tr><td class="info-label">Atendido por</td><td class="info-value">${atendidoPor || 'Equipo de Soporte'}</td></tr>
        </table>
        <div class="res-box"><p>"${resolucion}"</p></div>
        <p>Gracias por utilizar nuestro sistema de gestión. Su opinión y seguimiento son fundamentales para nosotros.</p>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquirá &bull; Sistema de Gestión de Solicitudes</p></div>
</div></body></html>`;

// ─── Plantilla 3: Mensaje urgente del funcionario ──────────────────────────
const templateMensajeDirecto = ({ nombre, titulo, codigoAcceso, mensaje }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>🏛️ MuniSupport Chiquinquirá</h1>
        <p>Sistema de Gestión de Solicitudes</p>
    </div>
    <div class="body">
        <h2>📩 Nuevo mensaje soporte, ${capitalize(nombre)}.</h2>
        <p>El equipo encargado de gestionar su solicitud ha enviado el siguiente comunicado:</p>
        <div class="status-box"><p>${mensaje}</p></div>
        <table class="info-table">
            <tr><td class="info-label">Título Caso</td><td class="info-value">${titulo}</td></tr>
            <tr><td class="info-label">Seguimiento</td><td class="info-value"><strong>${codigoAcceso}</strong></td></tr>
        </table>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquirá &bull; Sistema de Gestión de Solicitudes</p></div>
</div></body></html>`;

/**
 * Envía un correo a un ciudadano externo usando una plantilla HTML.
 */
const sendMailToCitizen = async (to, tipo, data) => {
    try {
        let subject, html;
        if (tipo === 'bienvenida') {
            subject = `✅ MuniSupport Chiquinquirá — Solicitud Recibida`;
            html = templateBienvenida(data);
        } else if (tipo === 'resolucion') {
            subject = `🏁 MuniSupport Chiquinquirá — Solicitud Resuelta`;
            html = templateResolucion(data);
        } else if (tipo === 'mensaje') {
            subject = `📩 MuniSupport Chiquinquirá — Mensaje de Soporte`;
            html = templateMensajeDirecto(data);
        } else return null;

        await sgMail.send({
            to,
            from: { email: FROM_EMAIL, name: 'MuniSupport Chiquinquirá' },
            subject,
            html,
        });

        console.log(`✉️ Correo ciudadano [${tipo}] enviado a: ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando correo al ciudadano:', error?.response?.body || error.message);
        return null;
    }
};

/**
 * Envía un correo a funcionarios internos.
 */
const sendMailToInternalUsers = async (to, subject, text, html) => {
    try {
        const recipients = Array.isArray(to) ? to : [to];
        await sgMail.send({
            to: recipients,
            from: { email: FROM_EMAIL, name: 'MuniSupport Chiquinquirá' },
            subject,
            text,
            html: html || text,
        });
        console.log(`✉️ Correo interno enviado a: ${recipients.join(', ')}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando el correo interno:', error?.response?.body || error.message);
        return null;
    }
};

module.exports = {
    sendMailToInternalUsers,
    sendMailToCitizen
};

