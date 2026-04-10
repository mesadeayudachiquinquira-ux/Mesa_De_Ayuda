import { io } from 'socket.io-client';

// En desarrollo usa el proxy de vite o localhost:5000 directamente
// En producción usa el mismo dominio de la URL actual
const URL = import.meta.env.PROD ? undefined : 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false, // Conectamos manually en los componentes que lo necesiten
});
