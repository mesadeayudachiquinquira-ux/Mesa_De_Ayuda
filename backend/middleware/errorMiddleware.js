/**
 * Middleware para el manejo centralizado de errores
 */
const errorHandler = (err, req, res, next) => {
    // Si la respuesta ya se envió, delegar al manejador por defecto
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log del error para el desarrollador (solo en consola)
    console.error('ERROR CAPTURADO:', {
        mensaje: err.message,
        ruta: req.originalUrl,
        metodo: req.method,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });

    res.status(statusCode).json({
        message: err.message || 'Error interno del servidor',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
