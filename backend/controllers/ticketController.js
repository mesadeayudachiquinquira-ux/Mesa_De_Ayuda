const Ticket = require('../models/Ticket');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AccessCode = require('../models/AccessCode');
const crypto = require('crypto');
const { sendMailToInternalUsers, sendMailToCitizen } = require('../utils/emailService');
const { uploadToCloudinary } = require('../middleware/uploadMiddleware');
const ExcelJS = require('exceljs');


// Helper para generar código de seguimiento único (6 caracteres)
const generateTrackingCode = () => {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// @desc    Obtener tickets del usuario u obtener todos si es admin
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find({}).populate('creadoPor', 'nombre email');
        res.json(tickets);
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener ticket por ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
};

// @desc    Verificar un código PIN de oficina
// @route   POST /api/tickets/verify-pin
// @access  Public
const verifyPin = async (req, res, next) => {
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
        next(error);
    }
};

// @desc    Crear nuevo ticket
// @route   POST /api/tickets
// @access  Private
const createTicket = async (req, res, next) => {
    try {
        const { titulo, descripcion, dependencia, seccion } = req.body;

        // Archivo adjunto (si lo hay)
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
        next(error);
    }
};

// @desc    Crear ticket público (sin login)
// @route   POST /api/tickets/public
// @access  Public
const createPublicTicket = async (req, res, next) => {
    try {
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

        // Notificar a soporte sobre el nuevo ticket del solicitante
        try {
            const admins = await User.find({ rol: 'admin' });
            for (const admin of admins) {
                await Notification.create({
                    usuarioId: admin._id,
                    mensaje: `Nueva solicitud de: ${titulo}`,
                    tipo: 'nuevo_ticket',
                    link: `/app/tickets/${ticket._id}`
                });
            }

            // Enviar correo electrónico
            const adminEmails = admins.map(a => a.email);
            if (adminEmails.length > 0) {
                const mailText = `Hola,\n\nSe ha recibido una nueva solicitud en la plataforma MuniSupport.\n\nTítulo: ${titulo}\nDependencia: ${accessCode.dependencia}\nCódigo Interno: ${ticket._id}\n\nIngresa al panel para revisarla.`;
                await sendMailToInternalUsers(adminEmails, `Nueva Solicitud: ${titulo}`, mailText);
            }

            // --- ESTA ES LA PARTE QUE FALTABA ---
            // Enviar correo de bienvenida al solicitante
            if (correoContacto) {
                sendMailToCitizen(correoContacto, 'bienvenida', {
                    nombre: nombreContacto,
                    titulo: titulo,
                    dependencia: accessCode.dependencia,
                    codigoAcceso: codigoAcceso
                }).catch(err => console.error('Error enviando bienvenida al solicitante:', err));
            }
        } catch (err) {
            console.error('Error al crear notificaciones y correos:', err);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Actualizar Ticket (Admin)
// @route   PUT /api/tickets/:id
// @access  Private/Admin
const updateTicket = async (req, res, next) => {
    try {
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
            if (req.body.categoria) {
                ticket.categoria = req.body.categoria;
            }

            // Validación: Obligatorio elegir categoría al cerrar
            if (estado === 'cerrado' && !ticket.categoria && !req.body.categoria) {
                return res.status(400).json({ message: 'Debe seleccionar una categoría técnica antes de cerrar el ticket' });
            }

            const updatedTicket = await ticket.save();
            
            const io = req.app.get('io');
            if (io) {
                io.emit('ticketsChanged');
            }

            res.json(updatedTicket);

            // Correo de resolución al solicitante si se cierra un ticket
            if (estado === 'cerrado' && ticket.esPúblico && ticket.correoContacto) {
                sendMailToCitizen(ticket.correoContacto, 'resolucion', {
                    nombre: ticket.nombreContacto,
                    titulo: ticket.titulo,
                    codigoAcceso: ticket.codigoAcceso,
                    resolucion: comentarioResolucion || ticket.comentarioResolucion || 'Sin detalles adicionales.',
                    atendidoPor: atendidoPorNombre || ticket.atendidoPorNombre
                }).catch(err => console.error('Error enviando resolución al solicitante:', err));
            }

            // Notificar al creador del ticket sobre el cambio de estado
            try {
                if (ticket.creadoPor && estado) {
                    await Notification.create({
                        usuarioId: ticket.creadoPor,
                        mensaje: `Tu ticket "${ticket.titulo}" ahora está: ${(estado || '').replace('_', ' ')}`,
                        tipo: 'estado_cambiado',
                        link: `/app/tickets/${ticket._id}`
                    });
                }
            } catch (err) {
                console.error('Error al notificar cambio de estado:', err);
            }
        } else {
            res.status(404).json({ message: 'Ticket no encontrado' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Agregar un mensaje al ticket (chat)
// @route   POST /api/tickets/:id/messages
// @access  Private
const addMessage = async (req, res, next) => {
    try {
        const { mensaje, notificarSolicitante } = req.body;

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

            // Si soporte marcó "Notificar al solicitante", enviar correo de mensaje directo
            if (notificarSolicitante && ticket.esPúblico && ticket.correoContacto) {
                sendMailToCitizen(ticket.correoContacto, 'mensaje', {
                    nombre: ticket.nombreContacto,
                    titulo: ticket.titulo,
                    codigoAcceso: ticket.codigoAcceso,
                    mensaje
                }).catch(err => console.error('Error enviando mensaje directo al solicitante:', err));
            }

            // Notificar a los correspondientes
            try {
                // Si el ticket es de soporte y quien escribe NO es su creador, notificar al creador
                if (ticket.creadoPor && req.user._id.toString() !== ticket.creadoPor.toString()) {
                    await Notification.create({
                        usuarioId: ticket.creadoPor,
                        mensaje: `Soporte ha respondido a su solicitud: ${ticket.titulo}`,
                        tipo: 'nuevo_mensaje',
                        link: `/app/tickets/${ticket._id}`
                    });
                } else {
                    // Si quien escribe es el creador del ticket o es un solicitante, notificar a soporte
                    const usersToNotify = ticket.asignadoA ? [ticket.asignadoA] : (await User.find({ rol: 'admin' })).map(u => u._id);
                    for (const userId of usersToNotify) {
                        await Notification.create({
                            usuarioId: userId,
                            mensaje: `Nuevo mensaje de ${req.user.nombre} en: ${ticket.titulo}`,
                            tipo: 'nuevo_mensaje',
                            link: `/app/tickets/${ticket._id}`
                        });
                    }
                }
            } catch (err) {
                console.error('Error al notificar mensaje de soporte:', err);
            }
        } else {
            res.status(404).json({ message: 'Ticket no encontrado' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Obtener ticket público solo por código de acceso
// @route   GET /api/tickets/public/track/:codigo
// @access  Public
const getTicketPublicByCode = async (req, res, next) => {
    try {
        const { codigo } = req.params;

        const ticket = await Ticket.findOne({ codigoAcceso: codigo });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket no encontrado o código inválido' });
        }

        const messages = await Message.find({ ticketId: ticket._id }).populate('usuarioId', 'nombre rol');
        
        res.json({ ticket, messages });
    } catch (error) {
        next(error);
    }
};

// @desc    Agregar mensaje público (desde el tracking)
// @route   POST /api/tickets/public/:id/mensajes
// @access  Public
const addPublicMessage = async (req, res, next) => {
    try {
        const { mensaje, codigo } = req.body;
        const { id } = req.params;

        if (!mensaje || !codigo) {
            return res.status(400).json({ message: 'El mensaje y el código son obligatorios' });
        }

        let ticket;
        if (id && id !== 'undefined' && id.length === 24) {
            ticket = await Ticket.findById(id);
        } else {
            ticket = await Ticket.findOne({ codigoAcceso: codigo });
        }

        if (!ticket || ticket.codigoAcceso !== codigo) {
            return res.status(404).json({ message: 'Ticket no encontrado o código inválido' });
        }

        if (ticket.estado === 'cerrado') {
            return res.status(400).json({ message: 'La solicitud está cerrada' });
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

        // Notificar a soporte
        try {
            const usersToNotify = ticket.asignadoA ? [ticket.asignadoA] : (await User.find({ rol: 'admin' })).map(u => u._id);

            for (const userId of usersToNotify) {
                await Notification.create({
                    usuarioId: userId,
                    mensaje: `Nuevo mensaje en la solicitud: ${ticket.titulo}`,
                    tipo: 'nuevo_mensaje',
                    link: `/app/tickets/${ticket._id}`
                });
            }

            // Enviar correo electrónico a los encargados
            const assignedUsers = await User.find({ _id: { $in: usersToNotify } });
            const userEmails = assignedUsers.map(u => u.email);
            if (userEmails.length > 0) {
                const mailText = `Hola,\n\nEl solicitante ha agregado un nuevo mensaje respondiendo a la solicitud.\n\nTítulo: ${ticket.titulo}\nMensaje: "${mensaje}"\n\nIngresa al panel de soporte para responder.`;
                await sendMailToInternalUsers(userEmails, `Nuevo mensaje en Solicitud: ${ticket.titulo}`, mailText);
            }
        } catch (err) {
            console.error('Error al notificar nuevo mensaje:', err);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Borrar ticket y sus mensajes
// @route   DELETE /api/tickets/:id
// @access  Private/Admin
const deleteTicket = async (req, res, next) => {
    try {
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
        next(error);
    }
};

// @desc    Borrar múltiples tickets y sus mensajes
// @route   DELETE /api/tickets/bulk
// @access  Private/Admin
const deleteMultipleTickets = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No se proporcionaron IDs válidos' });
        }

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
        next(error);
    }
};

// @desc    Exportar tickets a Excel con analíticas para el jefe
// @route   GET /api/tickets/export/excel
// @access  Private/Admin
const exportTicketsExcel = async (req, res, next) => {
    try {
        // Filtrar solo tickets cerrados por solicitud del usuario para sus reportes mensuales
        const tickets = await Ticket.find({ estado: 'cerrado' }).populate('creadoPor', 'nombre email');
        
        // Configurar zona horaria para los reportes (UTC-5)
        const formatOptions = { 
            timeZone: 'America/Bogota', 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false 
        };
        const formatter = new Intl.DateTimeFormat('es-CO', formatOptions);
        const nowString = formatter.format(new Date());

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'MuniSupport System';
        workbook.lastModifiedBy = 'Admin';
        workbook.created = new Date();

        // --- HOJA 1: LISTADO DETALLADO ---
        const sheet = workbook.addWorksheet('Bitácora Detallada');
        sheet.views = [{ state: 'frozen', ySplit: 1 }]; // Congelar encabezado

        sheet.columns = [
            { header: 'CÓDIGO ID', key: '_id', width: 25 },
            { header: 'ASUNTO / TÍTULO', key: 'titulo', width: 35 },
            { header: 'CATEGORÍA TÉCNICA', key: 'categoria', width: 25 },
            { header: 'SOLICITANTE', key: 'solicitante', width: 30 },
            { header: 'DEPENDENCIA', key: 'dependencia', width: 30 },
            { header: 'ÁREA / SECCIÓN', key: 'seccion', width: 25 },
            { header: 'FECHA REGISTRO', key: 'fecha', width: 22 },
            { header: 'TÉCNICO ASIGNADO', key: 'atendidoPor', width: 25 },
        ];

        // Estilo de Cabecera Listado
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Agregar filas con estilo cebra
        tickets.forEach((t, index) => {
            const row = sheet.addRow({
                _id: t._id.toString(),
                titulo: t.titulo,
                categoria: t.categoria || 'POR CLASIFICAR',
                solicitante: t.esPúblico ? (t.nombreContacto || 'Anónimo') : (t.creadoPor?.nombre || 'Funcionario Interno'),
                dependencia: t.dependencia,
                seccion: t.seccion || 'N/A',
                fecha: formatter.format(new Date(t.fechaCreación)),
                atendidoPor: t.atendidoPorNombre || 'Pendiente / No asig.'
            });

            // Zebra styling
            if (index % 2 !== 0) {
                row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
            }
            row.eachCell(c => {
                c.border = { 
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFF3F4F6' } }
                };
            });
        });

        // Auto-filtro para el listado
        sheet.autoFilter = { from: 'A1', to: 'H1' };

        const statsSheet = workbook.addWorksheet('Resumen de Gestión');
        
        // Estilo General para analíticas
        statsSheet.getRow(1).height = 30;
        statsSheet.getCell('A1').value = 'RESUMEN EJECUTIVO DE GESTIÓN MUNICIPAL';
        statsSheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF1E3A8A' } }; // Azul oscuro profundo
        statsSheet.mergeCells('A1:B1');

        statsSheet.addRow(['Generado el: ' + nowString]);
        statsSheet.addRow([]);

        // --- SECCIÓN 1: DESEMPEÑO ---
        const rowEmp = statsSheet.addRow(['🏆 RANKING DE DESEMPEÑO (TICKETS RESUELTOS)']);
        rowEmp.font = { bold: true, size: 12 };
        rowEmp.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        
        const headerEmp = statsSheet.addRow(['Nombre del Funcionario', 'Casos Cerrados']);
        headerEmp.font = { bold: true };
        headerEmp.eachCell(c => c.border = { bottom: { style: 'thin' } });

        const empStats = {};
        tickets.forEach(t => {
            const name = t.atendidoPorNombre || 'No Registrado';
            empStats[name] = (empStats[name] || 0) + 1;
        });
        
        Object.entries(empStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, count], idx) => {
                const r = statsSheet.addRow([name, count]);
                if (idx === 0) r.getCell(1).font = { bold: true, color: { argb: 'FFB45309' } }; // Oro/Ámbar para el #1
            });

        statsSheet.addRow([]);

        // --- SECCIÓN 2: CARGA POR OFICINA ---
        const rowDep = statsSheet.addRow(['🏢 CARGA DE TRABAJO POR DEPENDENCIA']);
        rowDep.font = { bold: true, size: 12 };
        rowDep.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

        const headerDep = statsSheet.addRow(['Oficina / Área', 'Total Solicitudes']);
        headerDep.font = { bold: true };
        headerDep.eachCell(c => c.border = { bottom: { style: 'thin' } });
        
        const depStats = {};
        tickets.forEach(t => {
            const dep = t.dependencia || 'Otras';
            depStats[dep] = (depStats[dep] || 0) + 1;
        });
        
        Object.entries(depStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([dep, count]) => statsSheet.addRow([dep, count]));

        statsSheet.addRow([]);

        // --- SECCIÓN 3: INCIDENCIAS ---
        const rowInc = statsSheet.addRow(['📉 ANÁLISIS DE INCIDENCIAS MÁS FRECUENTES']);
        rowInc.font = { bold: true, size: 12 };
        rowInc.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

        const headerInc = statsSheet.addRow(['Categoría Técnica', 'Frecuencia de Reporte']);
        headerInc.font = { bold: true };
        headerInc.eachCell(c => c.border = { bottom: { style: 'thin' } });
        
        const catStats = {};
        tickets.forEach(t => {
            const cat = t.categoria || 'Sin Clasificar';
            catStats[cat] = (catStats[cat] || 0) + 1;
        });
        
        Object.entries(catStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => statsSheet.addRow([cat, count]));

        // Diseño Final de la Hoja de Analíticas
        statsSheet.getColumn(1).width = 50;
        statsSheet.getColumn(2).width = 25;
        statsSheet.getColumn(2).alignment = { horizontal: 'center' };

        // Ya configurado arriba

        // Configurar respuesta del archivo
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_MuniSupport_${new Date().toISOString().slice(0,10)}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
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
    verifyPin,
    exportTicketsExcel
};
