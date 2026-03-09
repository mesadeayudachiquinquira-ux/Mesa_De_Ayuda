import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import api from '../api/axios';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef(null);
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

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const unreadCount = notifications.filter(n => !n.leido).length;

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 flex-shrink-0">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">

                {/* Mobile menu button */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                    <span className="sr-only">Abrir barra lateral</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>

                <div className="flex-1 flex justify-end items-center">
                    <div className="flex items-center space-x-4">

                        {/* Notifications Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'}`}
                            >
                                <span className="sr-only">Ver notificaciones</span>
                                <Bell className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                                    <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                            >
                                                Marcar todas como leídas
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-gray-400 text-sm italic">
                                                No tienes notificaciones
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => markAsRead(n._id)}
                                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 flex gap-3 ${!n.leido ? 'bg-blue-50/30' : ''}`}
                                                >
                                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!n.leido ? 'bg-blue-600' : 'bg-transparent'}`} />
                                                    <div className="flex-1">
                                                        <p className={`text-sm ${!n.leido ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                            {n.mensaje}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">
                                                            {new Date(n.fecha).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="px-4 py-2 border-t border-gray-50 text-center">
                                        <button className="text-xs font-bold text-gray-500 hover:text-gray-700">
                                            Ver historial completo
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile dropdown */}
                        <div className="flex items-center space-x-3 cursor-pointer group">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">
                                {user?.nombre?.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:flex flex-col">
                                <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                    {user?.nombre}
                                </span>
                                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">
                                    {user?.rol}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
