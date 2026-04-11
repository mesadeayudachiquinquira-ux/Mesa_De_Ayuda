const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { errorHandler } = require('./middleware/errorMiddleware');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // En producción debes cambiar esto a tu dominio oficial
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});
app.set('io', io);

io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Nuevo cliente Socket.io conectado:', socket.id);
    }
    
    // Al entrar a una URL de ticket, el frontend pedirá unirse a ese canal específico
    socket.on('joinTicket', (ticketId) => {
        socket.join(ticketId);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Socket ${socket.id} unido al ticket ${ticketId}`);
        }
    });

    // Indicador de "está escribiendo..."
    socket.on('typing', ({ ticketId, role }) => {
        socket.to(ticketId).emit('userTyping', { role });
    });

    socket.on('stopTyping', (ticketId) => {
        socket.to(ticketId).emit('userStopTyping');
    });

    socket.on('disconnect', () => {
        if (process.env.NODE_ENV !== 'production') {
            console.log('Cliente desconectado:', socket.id);
        }
    });
});


// Confiar en el proxy de Render (necesario para express-rate-limit)
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
    contentSecurityPolicy: false, // Deshabilitar CSP si da problemas con recursos externos, o configurar adecuadamente
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir la carpeta de subidas de archivos estáticamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/offices', require('./routes/officeRoutes'));

// Endpoint de diagnóstico disponible en todos los entornos
const mongoose = require('mongoose');
app.get('/api/diag', async (req, res) => {
    try {
        const state = mongoose.connection.readyState;
        const Ticket = mongoose.model('Ticket');
        const count = await Ticket.countDocuments();
        
        // No mostrar NODE_ENV en producción por seguridad
        const info = {
            status: 'ok', 
            dbState: state, 
            ticketCount: count,
            timestamp: new Date().toISOString()
        };

        if (process.env.NODE_ENV !== 'production') {
            info.nodeEnv = process.env.NODE_ENV;
        }

        res.json(info);
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Error en diagnóstico' });
    }
});

// Servir el Frontend en producción
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.use((req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    });
} else {
    // Ruta base para comprobación en desarrollo
    app.get('/test-server', (req, res) => {
        res.send('API de Mesa de Ayuda funcionando...');
    });
}

// Manejador de Errores Global (Debe ir después de las rutas)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
