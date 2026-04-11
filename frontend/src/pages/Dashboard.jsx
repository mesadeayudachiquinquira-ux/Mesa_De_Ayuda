import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
    BarChart3,
    CheckCircle2,
    Clock,
    AlertCircle,
    Ticket as TicketIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { socket } from '../socket';

const StatCard = ({ title, count, icon: Icon, colorClass, gradientClass }) => (
    <div className={`card relative overflow-hidden group shadow-md border-gray-200 transition-all duration-300`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
        <div className="flex items-center relative z-10">
            <div className={`p-4 rounded-xl ${colorClass.split(' ')[0]} bg-opacity-10 mr-4 border border-current opacity-80`}>
                <Icon className={`h-8 w-8 ${colorClass.split(' ')[1]}`} />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">{count}</p>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        abiertos: 0,
        en_progreso: 0,
        cerrados: 0,
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const { data } = await api.get('/tickets');

            // Calculate stats
            const abiertos = data.filter(t => t.estado === 'abierto').length;
            const en_progreso = data.filter(t => t.estado === 'en_progreso').length;
            const cerrados = data.filter(t => t.estado === 'cerrado').length;

            setStats({
                total: data.length,
                abiertos,
                en_progreso,
                cerrados,
            });

            // Get 5 most recent tickets
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

        // Escuchar actualizaciones globales vía WebSocket
        socket.connect();
        socket.on('ticketsChanged', fetchDashboardData);

        return () => {
            socket.off('ticketsChanged', fetchDashboardData);
        };
    }, []);

    if (loading) return <div className="flex justify-center items-center h-64"><span className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.nombre}! 👋</h1>
                    <p className="text-gray-500 mt-1">Aquí tienes un resumen de la actividad de tus tickets.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link to="/app/tickets" className="btn-primary inline-flex items-center">
                        <TicketIcon className="h-5 w-5 mr-2" />
                        Ver todos los tickets
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tickets"
                    count={stats.total}
                    icon={BarChart3}
                    colorClass="bg-blue-500 text-blue-600"
                    gradientClass="from-blue-400 to-blue-600"
                />
                <StatCard
                    title="Abiertos"
                    count={stats.abiertos}
                    icon={AlertCircle}
                    colorClass="bg-red-500 text-red-600"
                    gradientClass="from-red-400 to-red-600"
                />
                <StatCard
                    title="En Progreso"
                    count={stats.en_progreso}
                    icon={Clock}
                    colorClass="bg-yellow-500 text-yellow-600"
                    gradientClass="from-yellow-400 to-yellow-600"
                />
                <StatCard
                    title="Cerrados"
                    count={stats.cerrados}
                    icon={CheckCircle2}
                    colorClass="bg-green-500 text-green-600"
                    gradientClass="from-green-400 to-green-600"
                />
            </div>

            {/* Recent Tickets Section */}
            <div className="mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets Recientes</h2>
                <div className="card overflow-hidden !p-0">
                    {recentTickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay tickets recientes</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asunto</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Dependencia</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/50 divide-y divide-gray-200">
                                    {recentTickets.map(ticket => (
                                        <tr key={ticket._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{ticket.titulo}</div>
                                                <div className="text-[10px] text-gray-400 italic">
                                                    {ticket.esPúblico ? `Ext: ${ticket.nombreContacto}` : `Int: ${ticket.creadoPor?.nombre || '...'}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${ticket.estado === 'abierto' ? 'bg-red-100 text-red-800' :
                                                        ticket.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'}`}>
                                                    {(ticket.estado || '').replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                <div className="text-sm text-gray-700 font-medium truncate max-w-[160px]">{ticket.dependencia}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(ticket.fechaCreación).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/app/tickets/${ticket._id}`} className="text-blue-600 hover:text-blue-900 font-semibold">
                                                    Ver detalle &rarr;
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
