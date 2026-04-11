import axios from 'axios';

const api = axios.create({
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:5000/api`
        : '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticion: Añadir Token JWT
api.interceptors.request.use(
    (config) => {
        const user = localStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            if (parsedUser.token) {
                config.headers.Authorization = `Bearer ${parsedUser.token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Manejo Global de 401 (Auto-Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Si el servidor responde con 401 (No Autorizado / Token Expirado)
        if (error.response && error.response.status === 401) {
            console.warn('Sesión expirada o inválida. Redirigiendo al login...');
            
            // Solo limpiar si no estamos en una página pública (seguimiento de PIN)
            if (!window.location.pathname.includes('/public-tracking') && 
                !window.location.pathname.includes('/public-ticket') && 
                window.location.pathname !== '/') {
                
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
