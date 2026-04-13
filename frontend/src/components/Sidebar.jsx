import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Ticket,
    Users,
    LogOut,
    X,
    LifeBuoy,
    Building2,
    ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard', to: '/app', icon: LayoutDashboard },
        { name: 'Tickets', to: '/app/tickets', icon: Ticket },
    ];

    if (user?.rol === 'admin') {
        navLinks.push({ name: 'Usuarios', to: '/app/usuarios', icon: Users });
        navLinks.push({ name: 'Oficinas', to: '/app/oficinas', icon: Building2 });
    }

    return (
        <>
            <motion.div
                initial={false}
                animate={{ x: isOpen ? 0 : (window.innerWidth < 1024 ? -256 : 0) }}
                className={`fixed inset-y-0 left-0 z-30 w-64 glass-dark text-white lg:static lg:inset-0 flex flex-col shadow-2xl shadow-blue-900/20`}
            >
                <div className="flex items-center justify-between h-20 px-6 border-b border-white/5">
                    <div className="flex items-center space-x-3">
                        <img 
                            src="/munisupport_logo.png" 
                            alt="MuniSupport Logo" 
                            className="h-10 w-10 object-contain bg-white p-1 rounded-xl shadow-lg shadow-blue-600/20"
                        />
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tighter leading-tight">MuniSupport</span>
                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Portal Oficial</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.name}
                                to={link.to}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'text-white bg-blue-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}`} />
                                        {link.name}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeTab"
                                                className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.8)]" 
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-400 rounded-2xl hover:bg-red-500/10 hover:text-red-300 transition-all group"
                    >
                        <LogOut className="mr-3 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        Cerrar Sesión
                    </button>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
