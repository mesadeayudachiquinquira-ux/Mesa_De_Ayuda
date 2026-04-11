const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const crypto = require('crypto');
const { sendMailToInternalUsers, sendMailToCitizen } = require('../utils/emailService');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');


// Helper para generar código de seguimiento único (6 caracteres)
const generateTrackingCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @desc    Obtener tickets del usuario u obtener todos si es admin
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
    const tickets = await Ticket.find({}).populate('creadoPor', 'nombre email');
    res.json(tickets);
};

// @desc    Obtener ticket por ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate('creadoPor', 'nombre email')
        .populate('asignadoA', 'nombre');

    if (ticket) {
        // Traer los mensajes del ticket, poblando solo si el usuario existe (para evitar errores con tickets públicos/anónimos)
        const messages = await Message.find({ ticketId: req.params.id }).populate('usuarioId', 'nombre rol');

        res.json({ ticket, messages });
    } else {
        res.status(404).json({ message: 'Ticket no encontrado' });
    }
};

// @desc    Verificar un código PIN de oficina
// @route   POST /api/tickets/verify-pin
// @access  Public
const verifyPin = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Código requerido' });
        }

        const accessCode = await AccessCode.findOne({ code });

        if (!accessCode) {
            return res.status(404).json({ message: 'Código inválido' });
        }

        res.json({
            dependencia: accessCode.dependencia,
            seccion: accessCode.seccion
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al verificar el PIN' });
    }
};

// @desc    Crear nuevo ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res) => {
    try {
        const { titulo, descripcion, dependencia, seccion } = req.body;

        // Archivo adjunto (si lo hay)
        // Subir archivo adjunto a Cloudinary si lo hay
        let adjuntoPath = null;
        if (req.file) {
            try {
                adjuntoPath = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
            } catch (uploadErr) {
                console.error('Error subiendo adjunto a Cloudinary:', uploadErr);
            }
        }

        if (!titulo || !descripcion || !dependencia) {
            return res.status(400).json({ message: 'Por favor, agregue título, descripción y dependencia' });
        }

        const ticket = await Ticket.create({
            titulo,
            descripcion,
            dependencia,
            seccion,
            estado: 'abierto',
            creadoPor: req.user._id,
            adjuntos: adjuntoPath ? [adjuntoPath] : [],
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsChanged');
        }

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error al crear ticket:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el ticket' });
    }
};

// @desc    Crear ticket público (sin login)
// @route   POST /api/tickets/public
// @access  Public
const createPublicTicket = async (req, res) => {
    try {
        console.log('Recibida petición de ticket público:', req.body);
        const { titulo, descripcion, pin, nombreContacto, correoContacto, telefonoContacto } = req.body;

        if (!titulo || !descripcion || !pin) {
            return res.status(400).json({ message: 'El título, la descripción y el PIN de oficina son obligatorios' });
        }

        // Verificar el PIN de nuevo en el servidor
        const accessCode = await AccessCode.findOne({ code: pin });
        if (!accessCode) {
            return res.status(401).json({ message: 'PIN de oficina inválido' });
        }

        // Generar código de acceso único para seguimiento
        let codigoAcceso;
        let codigoExiste = true;
        
        while (codigoExiste) {
            codigoAcceso = generateTrackingCode();
            const existingTicket = await Ticket.findOne({ codigoAcceso });
            if (!existingTicket) {
                codigoExiste = false;
            }
        }

        // Subir archivo adjunto a Cloudinary si lo hay
        let adjuntoPath = null;
        if (req.file) {
            try {
                adjuntoPath = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
            } catch (uploadErr) {
                console.error('Error subiendo adjunto (ticket público) a Cloudinary:', uploadErr);
            }
        }

        const ticket = await Ticket.create({
            titulo,
            descripcion,
            nombreContacto,
            correoContacto,
            telefonoContacto,
            dependencia: accessCode.dependencia,
            seccion: accessCode.seccion,
            estado: 'abierto',
            esPúblico: true,
            codigoAcceso,
            adjuntos: adjuntoPath ? [adjuntoPath] : []
        });

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsChanged');
        }

        res.status(201).json(ticket);

        // Enviar correo de bienvenida/recibo al ciudadano
        if (correoContacto) {
            sendMailToCitizen(correoContacto, 'bienvenida', {
                nombre: nombreContacto,
                titulo,
                dependencia: accessCode.dependencia,
                codigoAcceso
            }).catch(err => console.error('Error enviando bienvenida al ciudadano:', err));
        }

        // Notificar a todos los administradores sobre el nuevo ticket público
        try {
            const admins = await User.find({ rol: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    usuarioId: admin._id,
                    mensaje: `Nuevo ticket externo: ${titulo}`,
                    tipo: 'nuevo_ticket',
                    link: `/tickets/${ticket._id}`
                });
            }

            // Enviar correo electrónico
            const adminEmails = admins.map(a => a.email);
            if (adminEmails.length > 0) {
                const mailText = `Hola,\n\nSe ha recibido un nuevo ticket del público en la plataforma MuniSupport.\n\nTítulo: ${titulo}\nDependencia: ${accessCode.dependencia}\nCódigo Interno: ${ticket._id}\n\nIngresa al panel para revisarlo.`;
                await sendMailToInternalUsers(adminEmails, `Nuevo Ticket: ${titulo}`, mailText);
            }
        } catch (err) {
            console.error('Error al crear notificaciones para admins:', err);
        }
    } catch (error) {
        console.error('Error al crear ticket público:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear el ticket' });
    }
};

// @desc    Actualizar Ticket (Admin)
// @route   PUT /api/tickets/:id
// @access  Private/Admin
const updateTicket = async (req, res) => {
    const { estado, asignadoA, comentarioResolucion, atendidoPorNombre } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
        ticket.estado = estado || ticket.estado;
        if (asignadoA) {
            ticket.asignadoA = asignadoA;
        }
        if (comentarioResolucion) {
            ticket.comentarioResolucion = comentarioResolucion;
        }
        if (atendidoPorNombre) {
            ticket.atendidoPorNombre = atendidoPorNombre;
        }

        const updatedTicket = await ticket.save();
        
        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsChanged');
        }

        res.json(updatedTicket);

        // Correo de resolución al ciudadano si se cierra un ticket público
        if (estado === 'cerrado' && ticket.esPúblico && ticket.correoContacto) {
            sendMailToCitizen(ticket.correoContacto, 'resolucion', {
                nombre: ticket.nombreContacto,
                titulo: ticket.titulo,
                codigoAcceso: ticket.codigoAcceso,
                resolucion: comentarioResolucion || ticket.comentarioResolucion || 'Sin detalles adicionales.',
                atendidoPor: atendidoPorNombre || ticket.atendidoPorNombre
            }).catch(err => console.error('Error enviando resolución al ciudadano:', err));
        }

        // Notificar al creador del ticket sobre el cambio de estado
        try {
            if (ticket.creadoPor && estado) {
                await Notification.create({
                    usuarioId: ticket.creadoPor,
                    mensaje: `Tu ticket "${ticket.titulo}" ahora está: ${estado.replace('_', ' ')}`,
                    tipo: 'estado_cambiado',
                    link: `/tickets/${ticket._id}`
                });
            }
        } catch (err) {
            console.error('Error al notificar cambio de estado:', err);
        }
    } else {
        res.status(404).json({ message: 'Ticket no encontrado' });
    }
};

// @desc    Agregar un mensaje al ticket (chat interno)
// @route   POST /api/tickets/:id/mensajes
// @access  Private
const addMessage = async (req, res) => {
    const { mensaje, notificarCiudadano } = req.body;

    if (!mensaje) {
        return res.status(400).json({ message: 'Mensaje vacío' });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (ticket) {
        const newMessage = await Message.create({
            ticketId: req.params.id,
            usuarioId: req.user._id,
            mensaje,
        });

        // Poblar el usuario para que el frontend reciba el nombre y rol instantáneamente
        const populatedMessage = await Message.findById(newMessage._id).populate('usuarioId', 'nombre rol');

        // Emitir mensaje por WebSockets
        const io = req.app.get('io');
        if (io) {
            io.to(req.params.id).emit('newMessage', populatedMessage);
        }

        res.status(201).json(populatedMessage);

        // Si el funcionario marcó "Notificar al ciudadano", enviar correo de mensaje directo
        if (notificarCiudadano && ticket.esPúblico && ticket.correoContacto) {
            sendMailToCitizen(ticket.correoContacto, 'mensaje', {
                nombre: ticket.nombreContacto,
                titulo: ticket.titulo,
                codigoAcceso: ticket.codigoAcceso,
                mensaje
            }).catch(err => console.error('Error enviando mensaje directo al ciudadano:', err));
        }

        // Notificar a los correspondientes
        try {
            // Si el ticket es interno y quien escribe NO es su creador, notificar al creador
            if (ticket.creadoPor && req.user._id.toString() !== ticket.creadoPor.toString()) {
                await Notification.create({
                    usuarioId: ticket.creadoPor,
                    mensaje: `Soporte ha respondido a tu ticket: ${ticket.titulo}`,
                    tipo: 'nuevo_mensaje',
                    link: `/tickets/${ticket._id}`
                });
            } else {
                // Si quien escribe es el creador del ticket o es un ticket público, notificar a los admins/asignado
                const usersToNotify = ticket.asignadoA ? [ticket.asignadoA] : (await User.find({ rol: 'admin' })).map(u => u._id);
                for (const userId of usersToNotify) {
                    await Notification.create({
                        usuarioId: userId,
                        mensaje: `Nuevo mensaje de ${req.user.nombre} en: ${ticket.titulo}`,
                        tipo: 'nuevo_mensaje',
                        link: `/tickets/${ticket._id}`
                    });
                }
            }
        } catch (err) {
            console.error('Error al notificar mensaje interno:', err);
        }
    } else {
        res.status(404).json({ message: 'Ticket no encontrado' });
    }
};

// @desc    Obtener ticket público solo por código de acceso
// @route   GET /api/tickets/public/track/:codigo
// @access  Public
const getTicketPublicByCode = async (req, res) => {
    try {
        const { codigo } = req.params;
        console.log('[DEBUG-TRACK] === INICIO BUSQUEDA ===');
        console.log('[DEBUG-TRACK] Código recibido:', codigo);

        if (!Ticket) {
            throw new Error('Modelo Ticket no cargado');
        }

        const ticket = await Ticket.findOne({ codigoAcceso: codigo });

        if (!ticket) {
            console.log('[DEBUG-TRACK] Ticket no encontrado para el código:', codigo);
            return res.status(404).json({ message: 'Ticket no encontrado o código inválido' });
        }

        console.log('[DEBUG-TRACK] Ticket encontrado ID:', ticket._id);

        if (!Message) {
            throw new Error('Modelo Message no cargado');
        }

        // Simplificamos omitiendo el populate para descartar errores de esquema/modelo User
        console.log('[DEBUG-TRACK] Buscando mensajes para ticket:', ticket._id);
        const messages = await Message.find({ ticketId: ticket._id });
        
        res.json({ ticket, messages });
    } catch (error) {
        console.error('Error en getTicketPublicByCode:', error);
        res.status(500).json({ message: 'Error al buscar el ticket' });
    }
};

// @desc    Agregar mensaje público (desde el tracking)
// @route   POST /api/tickets/public/:id/mensajes
// @access  Public
const addPublicMessage = async (req, res) => {
    try {
        const { mensaje, codigo } = req.body;
        const { id } = req.params;

        if (!mensaje || !codigo) {
            return res.status(400).json({ message: 'El mensaje y el código son obligatorios' });
        }

        let ticket;
        if (id && id !== 'undefined') {
            ticket = await Ticket.findById(id);
        } else {
            ticket = await Ticket.findOne({ codigoAcceso: codigo });
        }

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado o código inválido' });
        }

        if (ticket.codigoAcceso !== codigo) {
            return res.status(404).json({ message: 'Ticket no encontrado o código inválido' });
        }

        if (ticket.estado === 'cerrado') {
            return res.status(400).json({ message: 'El ticket está cerrado' });
        }

        const newMessage = await Message.create({
            ticketId: ticket._id,
            mensaje,
        });

        // Emitir mensaje por WebSockets
        const io = req.app.get('io');
        if (io) {
            io.to(ticket._id.toString()).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);

        // Notificar al administrador
        try {
            const usersToNotify = ticket.asignadoA ? [ticket.asignadoA] : (await User.find({ rol: 'admin' })).map(u => u._id);

            // ... resto del bloque de notificaciones igual ...

            for (const userId of usersToNotify) {
                await Notification.create({
                    usuarioId: userId,
                    mensaje: `Nuevo mensaje en el ticket: ${ticket.titulo}`,
                    tipo: 'nuevo_mensaje',
                    link: `/tickets/${ticket._id}`
                });
            }

            // Enviar correo electrónico a los encargados
            const assignedUsers = await User.find({ _id: { $in: usersToNotify } });
            const userEmails = assignedUsers.map(u => u.email);
            if (userEmails.length > 0) {
                const mailText = `Hola,\n\nEl ciudadano ha agregado un nuevo mensaje respondiendo al ticket Público.\n\nTicket: ${ticket.titulo}\nMensaje: "${mensaje}"\n\nIngresa al panel administrativo para responder.`;
                await sendMailToInternalUsers(userEmails, `Nuevo mensaje en Ticket: ${ticket.titulo}`, mailText);
            }
        } catch (err) {
            console.error('Error al notificar nuevo mensaje:', err);
        }
    } catch (error) {
        console.error('Error en addPublicMessage:', error);
        res.status(500).json({
            message: 'Error al enviar el mensaje',
            details: error.message
        });
    }
};

// @desc    Borrar ticket y sus mensajes
// @route   DELETE /api/tickets/:id
// @access  Private/Admin
const deleteTicket = async (req, res) => {
    try {
        console.log('Solicitud de borrado para ticket ID:', req.params.id);
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }

        // 1. Borrar todos los mensajes asociados al ticket
        await Message.deleteMany({ ticketId: req.params.id });

        // 2. Borrar el ticket
        await Ticket.findByIdAndDelete(req.params.id);

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsChanged');
        }

        res.json({ message: 'Ticket y mensajes eliminados correctamente' });
    } catch (error) {
        console.error('Error al borrar ticket:', error);
        res.status(500).json({ message: 'Error al eliminar el ticket' });
    }
};

// @desc    Borrar múltiples tickets y sus mensajes
// @route   DELETE /api/tickets/bulk
// @access  Private/Admin
const deleteMultipleTickets = async (req, res) => {
    try {
        console.log('REQ BODY en deleteMultipleTickets:', req.body);
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron IDs válidos' });
        }

        console.log('Solicitud de borrado masivo para IDs:', ids);

        // 1. Borrar todos los mensajes asociados a los tickets
        await Message.deleteMany({ ticketId: { $in: ids } });

        // 2. Borrar los tickets
        await Ticket.deleteMany({ _id: { $in: ids } });

        const io = req.app.get('io');
        if (io) {
            io.emit('ticketsChanged');
        }

        res.json({ message: `${ids.length} tickets y sus mensajes eliminados correctamente` });
    } catch (error) {
        console.error('Error al borrar múltiples tickets:', error);
        res.status(500).json({ message: 'Error al eliminar los tickets seleccionados' });
    }
};

module.exports = {
    getTickets,
    getTicketById,
    createTicket,
    createPublicTicket,
    updateTicket,
    addMessage,
    getTicketPublicByCode,
    addPublicMessage,
    deleteTicket,
    deleteMultipleTickets,
    verifyPin
};
