import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { motion } from 'framer-motion';
import {
    BarChart2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Ticket as TicketIcon,
    ArrowRight,
    TrendingUp,
    MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../socket';

const StatCard = ({ title, count, icon: Icon, gradientClass, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="card group relative overflow-hidden"
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
        <div className="flex items-center space-x-5 relative z-10">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradientClass} text-white shadow-lg`}>
                <Icon className="h-7 w-7" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <motion.p 
                    initial={{ scale: 0.5 }} 
                    animate={{ scale: 1 }} 
                    className="text-3xl font-black text-slate-900 mt-0.5 tracking-tighter"
                >
                    {count}
                </motion.p>
            </div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total: 0,
        abiertos: 0,
        en_progreso: 0,
        cerrados: 0,
        categorias: {}
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const { data } = await api.get('/tickets');

            const abiertos = data.filter(t => t.estado === 'abierto').length;
            const en_progreso = data.filter(t => t.estado === 'en_progreso').length;
            const cerrados = data.filter(t => t.estado === 'cerrado').length;
            
            const categorias = data.reduce((acc, t) => {
                if (t.estado === 'cerrado' && t.categoria) {
                    acc[t.categoria] = (acc[t.categoria] || 0) + 1;
                }
                return acc;
            }, {});

            setStats({
                total: data.length,
                abiertos,
                en_progreso,
                cerrados,
                categorias
            });

            const recent = data.sort((a, b) => new Date(b.fechaCreación) - new Date(a.fechaCreación)).slice(0, 5);
            setRecentTickets(recent);

        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        socket.connect();
        socket.on('ticketsChanged', fetchDashboardData);
        return () => {
            socket.off('ticketsChanged', fetchDashboardData);
        };
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full shadow-lg" 
            />
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 max-w-7xl mx-auto"
        >
            {/* Cabecera Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <motion.h1 
                        initial={{ x: -20 }}
                        animate={{ x: 0 }}
                        className="text-4xl font-black text-slate-900 tracking-tight"
                    >
                        Panel de Control <span className="text-blue-600">.</span>
                    </motion.h1>
                    <p className="text-slate-500 font-bold mt-2 flex items-center">
                        Gestión municipal inteligente para <span className="text-slate-800 ml-1.5">{user?.nombre}</span>
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Link to="/app/tickets" className="btn-primary flex items-center group">
                        Gestionar Solicitudes
                        <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Tickets" count={stats.total} icon={TicketIcon} gradientClass="from-slate-700 to-slate-900" delay={0.1} />
                <StatCard title="Abiertos" count={stats.abiertos} icon={AlertCircle} gradientClass="from-red-500 to-red-600" delay={0.2} />
                <StatCard title="En Proceso" count={stats.en_progreso} icon={Clock} gradientClass="from-amber-400 to-amber-600" delay={0.3} />
                <StatCard title="Cerrados" count={stats.cerrados} icon={CheckCircle2} gradientClass="from-blue-500 to-blue-700" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Análisis de Incidencias */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-1 space-y-6"
                >
                    <h2 className="text-xl font-black text-slate-900 flex items-center underline decoration-blue-500 decoration-4 underline-offset-8">
                        <TrendingUp className="h-5 w-5 mr-3 text-blue-600" />
                        Frecuencia
                    </h2>
                    <div className="card space-y-5">
                        {Object.keys(stats.categorias).length > 0 ? (
                            Object.entries(stats.categorias)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([cat, count], idx) => (
                                    <div key={cat} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="text-slate-600 uppercase tracking-wider">{cat}</span>
                                            <span className="text-blue-600">{count} casos</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(count / stats.cerrados) * 100}%` }}
                                                transition={{ delay: 0.7 + (idx * 0.1), duration: 1 }}
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
                                            />
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 font-bold text-sm italic">Sin datos registrados</div>
                        )}
                    </div>
                </motion.div>

                {/* Tickets Recientes */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <h2 className="text-xl font-black text-slate-900 flex items-center underline decoration-blue-500 decoration-4 underline-offset-8">
                        <MessageSquare className="h-5 w-5 mr-3 text-blue-600" />
                        Actividad Reciente
                    </h2>
                    <div className="card !p-0 overflow-hidden shadow-xl shadow-slate-200/50">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Solicitud</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white/50">
                                    {recentTickets.map((ticket, idx) => (
                                        <motion.tr 
                                            key={ticket._id} 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8 + (idx * 0.05) }}
                                            className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                            onClick={() => navigate(`/app/tickets/${ticket._id}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ticket.titulo}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ticket.dependencia}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest
                                                    ${ticket.estado === 'abierto' ? 'bg-red-50 text-red-600' :
                                                      ticket.estado === 'en_progreso' ? 'bg-amber-50 text-amber-600' :
                                                      'bg-blue-50 text-blue-600'}`}>
                                                    {ticket.estado.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500">
                                                {new Date(ticket.fechaCreación).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default Dashboard;
