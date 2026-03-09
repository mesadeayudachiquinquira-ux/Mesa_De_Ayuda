const express = require('express');
const router = express.Router();
const { getUsers, createUser,
    deleteUser,
    updateUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getUsers)
    .post(protect, admin, createUser);

router.route('/:id')
    .delete(protect, admin, deleteUser)
    .put(protect, admin, updateUser);

module.exports = router;
