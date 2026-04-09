const sgMail = require('@sendgrid/mail');

// Inicializar SendGrid con la API key (evita el bloqueo de puertos SMTP en Render)
if (process.env.SMTP_PASS) {
    sgMail.setApiKey(process.env.SMTP_PASS);
}

const FROM_EMAIL = process.env.SMTP_FROM || 'mesadeayudachiquinquira@gmail.com';

// ─── Estilos base compartidos por todas las plantillas ─────────────────────
const baseStyles = `
    body { margin: 0; padding: 0; background-color: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 620px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a56db 0%, #1e429f 100%); padding: 36px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; color: #bfdbfe; font-size: 13px; }
    .body { padding: 36px 40px; }
    .body h2 { color: #1e3a8a; font-size: 18px; margin-top: 0; }
    .body p { color: #374151; font-size: 15px; line-height: 1.7; }
    .code-box { background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 24px 0; }
    .code-box span { font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8; font-family: 'Courier New', monospace; }
    .info-row { display: flex; align-items: flex-start; margin: 12px 0; }
    .info-label { min-width: 120px; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
    .info-value { font-size: 15px; color: #111827; font-weight: 500; }
    .resolution-box { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .resolution-box p { margin: 0; color: #14532d; font-style: italic; font-size: 15px; }
    .message-box { background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0; }
    .message-box p { margin: 0; color: #1e3a8a; font-size: 15px; }
    .btn { display: inline-block; background: #1a56db; color: #ffffff !important; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6; }
    .footer strong { color: #6b7280; }
`;

// ─── Plantilla 1: Recibo de bienvenida ─────────────────────────────────────
const templateBienvenida = ({ nombre, titulo, dependencia, codigoAcceso }) => `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
  <div class="header">
    <h1>🏛️ MuniSupport Chiquinquirá</h1>
    <p>Sistema de Gestión de Solicitudes Ciudadanas</p>
  </div>
  <div class="body">
    <h2>Hemos recibido su solicitud, ${nombre || 'estimado ciudadano'}.</h2>
    <p>
      Nos complace informarle que su requerimiento ha sido registrado exitosamente en nuestra plataforma 
      y se encuentra actualmente en revisión por parte del equipo de <strong>${dependencia}</strong>.
    </p>
    <p>Su código único de seguimiento es:</p>
    <div class="code-box"><span>${codigoAcceso}</span></div>
    <div class="info-row">
      <span class="info-label">Asunto</span>
      <span class="info-value">${titulo}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dependencia</span>
      <span class="info-value">${dependencia}</span>
    </div>
    <p style="margin-top:24px;">
      Guarde este código con cuidado. Con él podrá consultar el estado de su solicitud y 
      revisar las respuestas que nuestro equipo le envíe en cualquier momento.
    </p>
    <p>Le responderemos a la mayor brevedad posible. Gracias por confiar en MuniSupport Chiquinquirá.</p>
  </div>
  <div class="footer">
    <p><strong>MuniSupport Chiquinquirá</strong> &bull; Sistema de Atención al Ciudadano<br>
    Este es un mensaje automático, por favor no responda a este correo.</p>
  </div>
</div></body></html>`;

// ─── Plantilla 2: Cierre y resolución ──────────────────────────────────────
const templateResolucion = ({ nombre, titulo, codigoAcceso, resolucion, atendidoPor }) => `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
  <div class="header">
    <h1>🏛️ MuniSupport Chiquinquirá</h1>
    <p>Sistema de Gestión de Solicitudes Ciudadanas</p>
  </div>
  <div class="body">
    <h2>✅ Su solicitud ha sido atendida, ${nombre || 'estimado ciudadano'}.</h2>
    <p>
      Nos complace comunicarle que su requerimiento registrado bajo el código 
      <strong style="color:#1d4ed8;">${codigoAcceso}</strong> ha sido procesado y 
      marcado como <strong>Resuelto</strong> por nuestro equipo.
    </p>
    <div class="info-row">
      <span class="info-label">Asunto</span>
      <span class="info-value">${titulo}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Atendido por</span>
      <span class="info-value">${atendidoPor || 'Equipo MuniSupport'}</span>
    </div>
    <p style="margin-top: 20px; font-weight: 600; color: #374151;">Detalle de la solución brindada:</p>
    <div class="resolution-box">
      <p>"${resolucion}"</p>
    </div>
    <p>
      Si considera que su solicitud no fue atendida correctamente o si tiene una nueva 
      pregunta, puede registrar un nuevo requerimiento en nuestra plataforma en cualquier momento.
    </p>
    <p>Gracias por su confianza en los servicios de MuniSupport Chiquinquirá.</p>
  </div>
  <div class="footer">
    <p><strong>MuniSupport Chiquinquirá</strong> &bull; Sistema de Atención al Ciudadano<br>
    Este es un mensaje automático, por favor no responda a este correo.</p>
  </div>
</div></body></html>`;

// ─── Plantilla 3: Mensaje urgente del funcionario ──────────────────────────
const templateMensajeDirecto = ({ nombre, titulo, codigoAcceso, mensaje }) => `
<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>${baseStyles}</style></head>
<body><div class="wrapper">
  <div class="header">
    <h1>🏛️ MuniSupport Chiquinquirá</h1>
    <p>Sistema de Gestión de Solicitudes Ciudadanas</p>
  </div>
  <div class="body">
    <h2>📩 Tiene un nuevo mensaje en su solicitud.</h2>
    <p>
      Estimado(a) <strong>${nombre || 'ciudadano(a)'}</strong>, el equipo encargado de 
      gestionar su solicitud <em>"${titulo}"</em> le ha enviado el siguiente comunicado:
    </p>
    <div class="message-box">
      <p>${mensaje}</p>
    </div>
    <p>
      Para responder o conocer más detalles sobre su caso, puede ingresar a nuestra 
      plataforma con su código de seguimiento:
    </p>
    <div class="code-box"><span>${codigoAcceso}</span></div>
    <p>Agradecemos su colaboración y disposición durante este proceso.</p>
  </div>
  <div class="footer">
    <p><strong>MuniSupport Chiquinquirá</strong> &bull; Sistema de Atención al Ciudadano<br>
    Este es un mensaje automático, por favor no responda a este correo.</p>
  </div>
</div></body></html>`;

/**
 * Envía un correo a un ciudadano externo usando una plantilla HTML.
 * @param {string} to - Correo del ciudadano
 * @param {'bienvenida'|'resolucion'|'mensaje'} tipo - Tipo de plantilla
 * @param {object} data - Datos para rellenar la plantilla
 */
const sendMailToCitizen = async (to, tipo, data) => {
    try {
        let subject, html;

        if (tipo === 'bienvenida') {
            subject = `✅ MuniSupport Chiquinquirá — Hemos recibido su solicitud`;
            html = templateBienvenida(data);
        } else if (tipo === 'resolucion') {
            subject = `🏁 MuniSupport Chiquinquirá — Su solicitud ha sido resuelta`;
            html = templateResolucion(data);
        } else if (tipo === 'mensaje') {
            subject = `📩 MuniSupport Chiquinquirá — Tiene un nuevo mensaje de soporte`;
            html = templateMensajeDirecto(data);
        } else {
            return null;
        }

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
