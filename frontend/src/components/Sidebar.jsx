import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Ticket,
    Users,
    LogOut,
    X,
    LifeBuoy,
    Building2
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
        { name: 'Tickets', to: '/tickets', icon: Ticket },
    ];

    if (user?.rol === 'admin') {
        navLinks.push({ name: 'Usuarios', to: '/usuarios', icon: Users });
        navLinks.push({ name: 'Oficinas', to: '/oficinas', icon: Building2 });
    }

    return (
        <>
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900/95 backdrop-blur-md text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between h-16 px-6 bg-slate-950/50">
                    <div className="flex items-center space-x-2">
                        <LifeBuoy className="h-8 w-8 text-blue-500" />
                        <span className="text-xl font-bold font-sans tracking-tight">MuniSupport</span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.name}
                                to={link.to}
                                className={({ isActive }) =>
                                    `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                            >
                                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                {link.name}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-400 rounded-xl hover:bg-white/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
