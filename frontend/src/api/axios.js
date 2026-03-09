import axios from 'axios';

const api = axios.create({
    baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:5000/api`
        : '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the JWT token to headers
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
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
