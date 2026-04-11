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
const { upload } = require('../middleware/uploadMiddleware');
const rateLimit = require('express-rate-limit');

// Limitador para prevenir fuerza bruta en los PINs (más permisivo para pruebas: 50 intentos / 15 min)
const pinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { message: 'Demasiados intentos de verificación. Intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rutas Públicas
router.post('/public', upload.single('adjunto'), createPublicTicket);
router.post('/verify-pin', pinLimiter, verifyPin);
router.get('/public/track/:codigo', getTicketPublicByCode);
router.post('/public/mensajes', addPublicMessage);
router.post('/public/:id/mensajes', addPublicMessage); // Mantener para compatibilidad temporal

// Rutas Privadas (Requieren Auth)
router.get('/', protect, getTickets);
router.delete('/bulk-delete', protect, admin, deleteMultipleTickets);
router.get('/:id', protect, getTicketById);
router.post('/', protect, upload.single('adjunto'), createTicket);
router.put('/:id', protect, updateTicket);
router.delete('/:id', protect, admin, deleteTicket);
router.get('/test/alive', (req, res) => res.json({ message: 'Rutas de tickets activas', version: '1.0.1-debug' }));
router.post('/:id/mensajes', protect, addMessage);

module.exports = router;
