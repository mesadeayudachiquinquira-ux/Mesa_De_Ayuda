const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    getMe,
    forgotPassword,
    verifyResetCode,
    resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Rutas de recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/verify-code', verifyResetCode);
router.put('/reset-password', resetPassword);

module.exports = router;
