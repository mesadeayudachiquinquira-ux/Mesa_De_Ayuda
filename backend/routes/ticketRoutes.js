const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const rateLimit = require('express-rate-limit');

// Limitador para prevenir fuerza bruta en los PINs (máximo 10 intentos cada 15 min por IP)
const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Demasiados intentos de verificación. Intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rutas Públicas
router.post('/public', upload.single('adjunto'), createPublicTicket);
router.post('/verify-pin', pinLimiter, verifyPin);
router.get('/public/:id/:codigo', getTicketPublicByCode);
router.post('/public/:id/mensajes', addPublicMessage);

// Rutas Privadas (Requieren Auth)
router.get('/', protect, getTickets);
router.post('/bulk-delete', protect, admin, deleteMultipleTickets);
router.get('/:id', protect, getTicketById);
router.post('/', protect, upload.single('adjunto'), createTicket);
router.put('/:id', protect, admin, updateTicket);
router.delete('/:id', protect, admin, deleteTicket);
router.get('/test/alive', (req, res) => res.json({ message: 'Rutas de tickets activas' }));
router.post('/:id/mensajes', protect, addMessage);

module.exports = router;
