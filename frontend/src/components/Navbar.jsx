import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, User as UserIcon, X, Trash2, LogOut } from 'lucide-react';
import api from '../api/axios';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const dropdownRef = useRef(null);
    const profileRef = useRef(null);
    const audioRef = useRef(new Audio('/sounds/notification.mp3'));
    const prevUnreadCount = useRef(0);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const unread = notifications.filter(n => !n.leido).length;
        if (unread > prevUnreadCount.current) {
            audioRef.current.play().catch(e => console.log('Audio play blocked by browser policy:', e));
        }
        prevUnreadCount.current = unread;
    }, [notifications]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, leido: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, leido: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation(); // Prevenir que se marque como leída al borrar
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const deleteAllNotifications = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar todas las notificaciones?')) return;
        try {
            await api.delete('/notifications');
            setNotifications([]);
        } catch (error) {
            console.error('Error deleting all notifications:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.leido) {
            await markAsRead(notification._id);
        }
        if (notification.link) {
            navigate(notification.link);
            setShowNotifications(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.leido).length;

    return (
        <header className="bg-white/40 backdrop-blur-xl border-b border-white/40 sticky top-0 z-40 flex-shrink-0 transition-all">
            <div className="flex items-center justify-between px-6 sm:px-8 h-20">

                {/* Mobile menu button */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                >
                    <span className="sr-only">Abrir barra lateral</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                <div className="flex-1 flex justify-end items-center">
                    <div className="flex items-center space-x-6">

                        {/* Notifications Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            >
                                <span className="sr-only">Ver notificaciones</span>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 py-3 z-50 animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden">
                                    <div className="px-5 py-3 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/30">
                                        <h3 className="font-black text-slate-800 text-sm">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                                            >
                                                Marcar todo
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="px-6 py-12 text-center">
                                                <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                                    <Bell className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <div className="text-slate-400 text-xs font-bold italic">
                                                    Bandeja vacía
                                                </div>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => handleNotificationClick(n)}
                                                    className={`px-5 py-4 hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 flex gap-4 group ${!n.leido ? 'bg-blue-50/20' : ''}`}
                                                >
                                                    <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${!n.leido ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-slate-200'}`} />
                                                    <div className="flex-1">
                                                        <p className={`text-sm tracking-tight leading-snug ${!n.leido ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                                            {n.mensaje}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-wider uppercase">
                                                            {new Date(n.fecha).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => deleteNotification(e, n._id)}
                                                        className="h-7 w-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Eliminar"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="px-5 py-3 border-t border-slate-100/50 flex justify-end items-center bg-slate-50/50">
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={deleteAllNotifications}
                                                className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest flex items-center gap-2"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Limpiar todo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile dropdown */}
                        <div className="relative pl-4 border-l border-slate-200/50" ref={profileRef}>
                            <button 
                                onClick={() => setShowProfile(!showProfile)}
                                className="flex items-center space-x-3 group text-left w-full focus:outline-none"
                            >
                                <div className="flex flex-col text-right hidden sm:flex">
                                    <span className="text-sm font-black text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                                        {user?.nombre}
                                    </span>
                                    <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">
                                        {user?.rol}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-black text-sm border border-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                                    {user?.nombre?.charAt(0).toUpperCase()}
                                </div>
                            </button>

                            {showProfile && (
                                <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-3xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 p-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
