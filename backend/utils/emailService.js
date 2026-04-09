const axios = require('axios');

const BRIDGE_URL = process.env.GMAIL_BRIDGE_URL;
const FROM_EMAIL = process.env.SMTP_FROM || 'mesadeayudachiquinquira@gmail.com';

/**
 * Función auxiliar para capitalizar nombres
 */
const capitalize = (str) => {
    if (!str || typeof str !== 'string') return 'Ciudadano';
    return str.trim().toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Envía el correo usando el puente de Google Apps Script (HTTP POST)
 */
const sendViaBridge = async (to, subject, html) => {
    if (!BRIDGE_URL) {
        console.error('❌ Error: GMAIL_BRIDGE_URL no está configurada.');
        return false;
    }

    try {
        const response = await axios.post(BRIDGE_URL, {
            to,
            subject,
            html
        });
        
        if (response.data && response.data.status === 'ok') {
            console.log(`✉️ OK: Correo enviado a ${to} vía Gmail Bridge`);
            return true;
        } else {
            console.error('❌ FAIL: Error en el puente:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ FAIL: Error de conexión con Gmail Bridge:', error.message);
        return false;
    }
};

// ─── Estilos base ultra-compatibles ────────────────────────────────────────
// ... (mismos estilos de antes)
const baseStyles = `
    body { margin: 0; padding: 0; background-color: #f4f7f9; font-family: Arial, sans-serif; }
    .wrapper { width: 100%; max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #d1d5db; }
    .header { background-color: #1a43bf; padding: 25px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; }
    .header p { margin: 5px 0 0; color: #cad5f2; font-size: 13px; }
    .body { padding: 30px; color: #374151; }
    .body h2 { color: #1e3a8a; font-size: 18px; margin-bottom: 15px; }
    .body p { font-size: 15px; line-height: 1.5; margin-bottom: 20px; }
    .code-display { background-color: #f1f5f9; border: 1px solid #3b82f6; padding: 15px; text-align: center; margin: 20px 0; }
    .code-display span { font-size: 24px; font-weight: bold; color: #1e40af; font-family: monospace; }
    .info-table { width: 100%; margin: 15px 0; border-top: 1px solid #e5e7eb; }
    .info-table td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .label { font-weight: bold; color: #6b7280; width: 100px; text-transform: uppercase; font-size: 11px; }
    .value { color: #111827; }
    .footer { padding: 20px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
`;

// ─── Plantillas simplificadas ──────────────────────────────────────────────
const templateBienvenida = ({ nombre, titulo, dependencia, codigoAcceso }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>MuniSupport Chiquinquira</h1>
        <p>Sistema de Gestion de Solicitudes</p>
    </div>
    <div class="body">
        <h2>Solicitud Recibida: ${capitalize(nombre)}</h2>
        <p>Se ha registrado su requerimiento exitosamente. El equipo de soporte se encuentra revisando su caso.</p>
        <div class="code-display"><span>${codigoAcceso}</span></div>
        <table class="info-table">
            <tr><td class="label">Asunto</td><td class="value">${titulo}</td></tr>
            <tr><td class="label">Dependencia</td><td class="value">${dependencia}</td></tr>
        </table>
        <p>Conserve este codigo para consultar el estado de su solicitud en nuestra plataforma.</p>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquira - Atencion al Ciudadano</p></div>
</div></body></html>`;

const templateResolucion = ({ nombre, titulo, codigoAcceso, resolucion, atendidoPor }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>MuniSupport Chiquinquira</h1>
        <p>Sistema de Gestion de Solicitudes</p>
    </div>
    <div class="body">
        <h2>Solicitud Resuelta: ${capitalize(nombre)}</h2>
        <p>Su requerimiento con codigo ${codigoAcceso} ha sido atendido satisfactoriamente.</p>
        <table class="info-table">
            <tr><td class="label">Asunto</td><td class="value">${titulo}</td></tr>
            <tr><td class="label">Atendido por</td><td class="value">${atendidoPor || 'Equipo de Soporte'}</td></tr>
        </table>
        <div style="background:#f0fdf4; padding:15px; border-left:4px solid #22c55e; margin:20px 0;">
            <p style="margin:0; font-style:italic;">"${resolucion}"</p>
        </div>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquira - Atencion al Ciudadano</p></div>
</div></body></html>`;

const templateMensajeDirecto = ({ nombre, titulo, codigoAcceso, mensaje }) => `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
    <div class="header">
        <h1>MuniSupport Chiquinquira</h1>
        <p>Sistema de Gestion de Solicitudes</p>
    </div>
    <div class="body">
        <h2>Mensaje de Soporte: ${capitalize(nombre)}</h2>
        <p>El equipo de soporte ha enviado una respuesta a su solicitud:</p>
        <div style="background:#eff6ff; padding:15px; border-left:4px solid #3b82f6; margin:20px 0;">
            <p style="margin:0;">${mensaje}</p>
        </div>
        <table class="info-table">
            <tr><td class="label">Caso</td><td class="value">${titulo}</td></tr>
            <tr><td class="label">Seguimiento</td><td class="value">${codigoAcceso}</td></tr>
        </table>
    </div>
    <div class="footer"><p>MuniSupport Chiquinquira - Atencion al Ciudadano</p></div>
</div></body></html>`;

/**
 * Envío de correos ciudadano vía Bridge
 */
const sendMailToCitizen = async (to, tipo, data) => {
    let subject, html;
    if (tipo === 'bienvenida') {
        subject = 'MuniSupport Chiquinquira - Solicitud Recibida';
        html = templateBienvenida(data);
    } else if (tipo === 'resolucion') {
        subject = 'MuniSupport Chiquinquira - Solicitud Resuelta';
        html = templateResolucion(data);
    } else if (tipo === 'mensaje') {
        subject = 'MuniSupport Chiquinquira - Mensaje de Soporte';
        html = templateMensajeDirecto(data);
    } else return null;

    return await sendViaBridge(to, subject, html);
};

/**
 * Envío de correos internos vía Bridge
 */
const sendMailToInternalUsers = async (to, subject, text, html) => {
    const recipients = Array.isArray(to) ? to : [to];
    // Enviamos a cada destinatario por separado para asegurar la entrega
    for (const recipient of recipients) {
        await sendViaBridge(recipient, subject, html || text);
    }
    return true;
};

module.exports = { sendMailToInternalUsers, sendMailToCitizen };

