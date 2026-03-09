const express = require('express');
const router = express.Router();
const {
    getOffices,
    createOffice,
    updateOffice,
    deleteOffice
} = require('../controllers/officeController');
const { protect, admin } = require('../middleware/authMiddleware');

// Todas las rutas de oficinas requieren ser Admin
router.use(protect);
router.use(admin);

router.route('/')
    .get(getOffices)
    .post(createOffice);

router.route('/:id')
    .put(updateOffice)
    .delete(deleteOffice);

module.exports = router;
