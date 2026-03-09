const AccessCode = require('../models/AccessCode');

// @desc    Obtener todas las oficinas/códigos
// @route   GET /api/offices
// @access  Private/Admin
const getOffices = async (req, res) => {
    try {
        const offices = await AccessCode.find({}).sort({ dependencia: 1, seccion: 1 });
        res.json(offices);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener oficinas' });
    }
};

// @desc    Crear una nueva oficina/código
// @route   POST /api/offices
// @access  Private/Admin
const createOffice = async (req, res) => {
    try {
        const { code, dependencia, seccion } = req.body;

        if (!code || !dependencia) {
            return res.status(400).json({ message: 'Código y dependencia son obligatorios' });
        }

        const codeExists = await AccessCode.findOne({ code });
        if (codeExists) {
            return res.status(400).json({ message: 'El código PIN ya está en uso' });
        }

        const office = await AccessCode.create({
            code,
            dependencia,
            seccion: seccion || ''
        });

        res.status(201).json(office);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear oficina' });
    }
};

// @desc    Actualizar una oficina/código
// @route   PUT /api/offices/:id
// @access  Private/Admin
const updateOffice = async (req, res) => {
    try {
        const { code, dependencia, seccion } = req.body;
        const office = await AccessCode.findById(req.params.id);

        if (!office) {
            return res.status(404).json({ message: 'Oficina no encontrada' });
        }

        // Si el código cambia, verificar que no exista ya
        if (code && code !== office.code) {
            const codeExists = await AccessCode.findOne({ code });
            if (codeExists) {
                return res.status(400).json({ message: 'El nuevo código PIN ya está en uso' });
            }
        }

        office.code = code || office.code;
        office.dependencia = dependencia || office.dependencia;
        office.seccion = seccion !== undefined ? seccion : office.seccion;

        const updatedOffice = await office.save();
        res.json(updatedOffice);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar oficina' });
    }
};

// @desc    Eliminar una oficina
// @route   DELETE /api/offices/:id
// @access  Private/Admin
const deleteOffice = async (req, res) => {
    try {
        const office = await AccessCode.findById(req.params.id);

        if (!office) {
            return res.status(404).json({ message: 'Oficina no encontrada' });
        }

        await AccessCode.findByIdAndDelete(req.params.id);
        res.json({ message: 'Oficina eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar oficina' });
    }
};

module.exports = {
    getOffices,
    createOffice,
    updateOffice,
    deleteOffice
};
