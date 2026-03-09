const Notification = require('../models/Notification');

// @desc    Obtener notificaciones del usuario
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ usuarioId: req.user._id })
            .sort({ fecha: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener notificaciones' });
    }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification && notification.usuarioId.toString() === req.user._id.toString()) {
            notification.leido = true;
            await notification.save();
            res.json({ message: 'Notificación marcada como leída' });
        } else {
            res.status(404).json({ message: 'Notificación no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar notificación' });
    }
};

// @desc    Marcar todas como leídas
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { usuarioId: req.user._id, leido: false },
            { leido: true }
        );
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar notificaciones' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
