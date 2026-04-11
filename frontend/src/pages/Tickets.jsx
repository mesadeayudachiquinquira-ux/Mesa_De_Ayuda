import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Search, 
    Filter, 
    Trash2, 
    AlertTriangle, 
    Download, 
    Clock, 
    ChevronRight,
    SearchX,
    FolderArchive,
    Activity,
    UserCheck,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';
import { toast } from 'react-hot-toast';

const ORGANIGRAM = {
    "Despacho del Alcalde": ["Oficina de Control Interno de Gestión", "Oficina Asesora Jurídica", "Oficina de las TICs y Gobierno Digital", "Dirección de Compras Públicas"],
    "Secretaría de Gobierno y Convivencia Ciudadana": ["Inspección de Policía 1", "Inspección de Policía 2", "Comisaría de Familia 1", "Comisaría de Familia 2", "Comisaría de Familia 3"],
    "Secretaría General": ["Dirección de Talento Humano", "Almacén General"],
    "Secretaría Hacienda": ["Dirección de Tesorería y Presupuesto", "Dirección de Fiscalización", "Dirección Técnica de Contabilidad"],
    "Secretaría de Integración Social, Familia y Educación": ["Dirección Local de Salud", "Programas Sociales"],
    "Secretaría de Competitividad y Economía Territorial": ["Unidad Municipal de Asistencia Técnica Agropecuaria"],
    "Secretaría de Tránsito y Transporte": ["Inspección de Tránsito Municipal", "Cuerpo de Agentes"],
    "Secretaría de Infraestructura y Valorización": ["Dirección Técnica de Infraestructura Física", "Medio Ambiente"],
    "Secretaría de Planeación y Desempeño Institucional": ["Dirección Estratégica de Control Urbanístico"],
    "Secretaría de Turismo, Patrimonio y Comunicación Pública": []
};

const Tickets = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Modal form states
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [dependencia, setDependencia] = useState('');
    const [seccion, setSeccion] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [filterStatus, setFilterStatus] = useState('active'); // active, closed
    const [selectedResponsable, setSelectedResponsable] = useState('');
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTickets();
        socket.connect();
        socket.on('ticketsChanged', fetchTicketsSilently);
        return () => {
            socket.off('ticketsChanged', fetchTicketsSilently);
        };
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/tickets');
            setTickets(data);
        } catch (error) {
            console.error('Error cargando tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketsSilently = async () => {
        setRefreshing(true);
        try {
            const { data } = await api.get('/tickets');
            setTickets(data);
        } catch (error) {
            console.error('Error en recarga automática:', error);
        } finally {
            setTimeout(() => setRefreshing(false), 2000);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const loadingToast = toast.loading('Creando solicitud...');
        try {
            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            formData.append('dependencia', dependencia);
            formData.append('seccion', seccion);
            if (file) {
                formData.append('adjunto', file);
            }

            await api.post('/tickets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setShowModal(false);
            setTitulo(''); setDescripcion(''); setDependencia(''); setSeccion(''); setFile(null);
            fetchTickets();
            toast.success('Ticket creado correctamente', { id: loadingToast });
        } catch (error) {
            console.error('Error creando ticket:', error);
            toast.error(error.response?.data?.message || 'Error al crear el ticket', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSelectTicket = (id) => {
        if (selectedTickets.includes(id)) {
            setSelectedTickets(selectedTickets.filter(tid => tid !== id));
        } else {
            setSelectedTickets([...selectedTickets, id]);
        }
    };

    const handleSelectAll = (filteredList) => {
        if (selectedTickets.length === filteredList.length) {
            setSelectedTickets([]);
        } else {
            setSelectedTickets(filteredList.map(t => t._id));
        }
    };

    const handleBulkDelete = async () => {
        setSubmitting(true);
        const loadingToast = toast.loading('Eliminando tickets...');
        try {
            await api.delete('/tickets/bulk-delete', { data: { ids: selectedTickets } });
            setSelectedTickets([]);
            setShowDeleteModal(false);
            fetchTickets();
            toast.success('Tickets eliminados con éxito', { id: loadingToast });
        } catch (error) {
            console.error('Error en borrado masivo:', error);
            toast.error('No se pudieron eliminar los tickets seleccionados.', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const getUrgency = (ticket) => {
        if (ticket?.estado === 'cerrado') return null;
        const created = new Date(ticket?.fechaCreación);
        const hoursElapsed = (Date.now() - created) / (1000 * 60 * 60);
        if (hoursElapsed >= 48) return 'critical';
        if (hoursElapsed >= 24) return 'warning';
        return null;
    };

    const activeTickets = Array.isArray(tickets) ? tickets.filter(t => t?.estado !== 'cerrado') : [];
    const closedTickets = Array.isArray(tickets) ? tickets.filter(t => t?.estado === 'cerrado') : [];

    const statsResponsables = closedTickets.reduce((acc, t) => {
        const nombre = t.atendidoPorNombre || 'No Registrado';
        acc[nombre] = (acc[nombre] || 0) + 1;
        return acc;
    }, {});
    
    const topResponsables = Object.entries(statsResponsables)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count);

    const handleExportExcel = async () => {
        try {
            setRefreshing(true);
            toast.loading('Generando reporte Excel...', { duration: 3000 });
            const response = await api.get('/tickets/export/excel', {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reporte_MuniSupport_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Reporte descargado');
        } catch (error) {
            console.error('Error descargando el reporte Excel:', error);
            toast.error('Error al generar el reporte.');
        } finally {
            setRefreshing(false);
        }
    };

    const filteredTickets = (filterStatus === 'active' ? activeTickets : closedTickets).filter(t => {
        try {
            const busqueda = (searchTerm || '').toLowerCase();
            const titulo = (t?.titulo || 'SIN TITULO').toLowerCase();
            const estado = (t?.estado || 'SIN ESTADO').toLowerCase();
            const responsable = (t?.atendidoPorNombre || '').toLowerCase();
            const matchSearch = titulo.includes(busqueda) || estado.includes(busqueda) || responsable.includes(busqueda);
            if (filterStatus === 'closed' && selectedResponsable) {
                return matchSearch && (t.atendidoPorNombre || 'No Registrado') === selectedResponsable;
            }
            return matchSearch;
        } catch (err) {
            return false;
        }
    });

    useEffect(() => {
        if (filterStatus === 'active') setSelectedResponsable('');
    }, [filterStatus]);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
             <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Solicitudes</h1>
                        {refreshing && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center"
                            >
                                <Activity className="h-3 w-3 mr-2 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando</span>
                            </motion.div>
                        )}
                    </div>
                    <p className="text-slate-500 font-bold mt-1">Administre y resuelva los requerimientos municipales.</p>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {filterStatus === 'closed' && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={handleExportExcel}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                Exportar Reporte
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Nuevo Requerimiento
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedTickets.length > 0 && user?.rol === 'admin' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl"
                    >
                        <div className="flex items-center">
                            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mr-4 shadow-lg shadow-blue-600/30">
                                {selectedTickets.length}
                            </div>
                            <p className="font-bold text-sm tracking-tight text-slate-300">Elementos seleccionados para acción masiva</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedTickets([])}
                                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                            >
                                Descartar
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex items-center"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar Selección
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs & Search Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl space-x-1">
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterStatus === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Activity className="h-4 w-4 mr-2" />
                        Activos
                        <span className={`ml-2 px-2 py-0.5 rounded-lg ${filterStatus === 'active' ? 'bg-blue-50' : 'bg-slate-200'}`}>
                            {activeTickets.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilterStatus('closed')}
                        className={`flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${filterStatus === 'closed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <FolderArchive className="h-4 w-4 mr-2" />
                        Archivo
                        <span className={`ml-2 px-2 py-0.5 rounded-lg ${filterStatus === 'closed' ? 'bg-slate-200' : 'bg-slate-200'}`}>
                            {closedTickets.length}
                        </span>
                    </button>
                </div>

                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        className="input-field pl-11 !py-2.5 text-sm"
                        placeholder="Filtrar por asunto o técnico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Ranking de Resolución */}
            {user?.rol === 'admin' && filterStatus === 'closed' && topResponsables.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card !bg-blue-600 text-white"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Elite de Resolución Municipal
                        </h3>
                        {selectedResponsable && (
                            <button onClick={() => setSelectedResponsable('')} className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                Ver todos los técnicos
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {topResponsables.slice(0, 5).map((r, idx) => (
                            <button 
                                key={r.nombre} 
                                onClick={() => setSelectedResponsable(selectedResponsable === r.nombre ? '' : r.nombre)}
                                className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${selectedResponsable === r.nombre ? 'bg-white text-blue-600 scale-105 shadow-xl' : 'bg-white/10 text-white hover:bg-white/15'}`}
                            >
                                <span className="text-lg mb-2">{idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}</span>
                                <p className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center mb-1">{r.nombre}</p>
                                <p className={`text-xs font-black ${selectedResponsable === r.nombre ? 'text-blue-500' : 'text-blue-200'}`}>{r.count} éxitos</p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Table */}
            <div className="card !p-0 overflow-hidden shadow-2xl shadow-slate-200/50">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-5 text-left w-10">
                                    {user?.rol === 'admin' && (
                                        <input
                                            type="checkbox"
                                            className="rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 h-5 w-5 bg-white shadow-sm"
                                            checked={filteredTickets.length > 0 && selectedTickets.length === filteredTickets.length}
                                            onChange={() => handleSelectAll(filteredTickets)}
                                        />
                                    )}
                                </th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Referencia y Solicitante</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Dependencia</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fecha</th>
                                <th className="px-6 py-5 border-l border-slate-50"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white/40">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <SearchX className="h-12 w-12 text-slate-200 mb-4" />
                                            <p className="text-slate-400 font-bold italic text-sm">No se encontraron registros que coincidan con los filtros</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket, idx) => (
                                    <motion.tr 
                                        key={ticket._id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className={`hover:bg-blue-50/30 transition-all cursor-pointer group ${
                                            selectedTickets.includes(ticket._id) ? 'bg-blue-50/50 shadow-inner' : ''
                                        }`}
                                    >
                                        <td className="px-6 py-6" onClick={(e) => e.stopPropagation()}>
                                            {user?.rol === 'admin' && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded-lg border-slate-300 text-blue-600 h-5 w-5 bg-white"
                                                    checked={selectedTickets.includes(ticket._id)}
                                                    onChange={() => handleSelectTicket(ticket._id)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-6" onClick={() => navigate(`/app/tickets/${ticket._id}`)}>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <div className="text-sm font-black text-slate-800 tracking-tight">{ticket.titulo}</div>
                                                {getUrgency(ticket) === 'critical' && (
                                                    <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">Retardado</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${ticket?.esPúblico ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {ticket?.esPúblico ? 'Ciudadano' : 'Soporte'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold italic truncate max-w-[200px]">
                                                    {ticket?.esPúblico ? ticket?.nombreContacto : (ticket?.creadoPor?.nombre || 'Usuario')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm
                                                ${ticket.estado === 'abierto' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                  ticket.estado === 'en_progreso' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                  'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                {ticket.estado.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 hidden md:table-cell">
                                            <div className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{ticket.dependencia || 'N/A'}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ticket.seccion || 'Sin Sección'}</div>
                                        </td>
                                        <td className="px-6 py-6 whitespace-nowrap text-xs font-bold text-slate-500">
                                            {new Date(ticket.fechaCreación).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-6 text-right border-l border-slate-50/50">
                                            <div className="bg-slate-100 p-2 rounded-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all inline-block">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Ticket Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full border border-white"
                        >
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center">
                                    <div className="bg-blue-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-600/20 text-white">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    Nueva Solicitud Municipal
                                </h3>
                            </div>
                            <form onSubmit={handleCreateTicket} className="p-8 space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asunto de la solicitud</label>
                                    <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} className="input-field" placeholder="Describa brevemente el problema" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Descripción técnica</label>
                                    <textarea required value={descripcion} onChange={e => setDescripcion(e.target.value)} rows="3" className="input-field resize-none" placeholder="Proporcione todos los detalles necesarios..."></textarea>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secretaría</label>
                                        <select required value={dependencia} onChange={e => {setDependencia(e.target.value); setSeccion('');}} className="input-field">
                                            <option value="">Seleccione...</option>
                                            {Object.keys(ORGANIGRAM).map(dep => <option key={dep} value={dep}>{dep}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Oficina</label>
                                        <select value={seccion} onChange={e => setSeccion(e.target.value)} className="input-field" disabled={!dependencia || ORGANIGRAM[dependencia].length === 0}>
                                            <option value="">{ORGANIGRAM[dependencia]?.length > 0 ? 'Seleccione...' : 'General'}</option>
                                            {dependencia && ORGANIGRAM[dependencia].map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Evidencia (Adjunto)</label>
                                    <div className="relative group">
                                        <input type="file" onChange={e => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <div className="input-field flex items-center justify-between group-hover:bg-slate-50 transition-colors">
                                            <span className="text-slate-400 truncate">{file ? file.name : 'Vincular documento o imagen...'}</span>
                                            <Download className="h-4 w-4 text-blue-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3">
                                        {submitting ? 'Emitiendo...' : 'Crear Registro'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Multiple Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center"
                        >
                            <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
                                <AlertTriangle className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Eliminar Definitivamente</h3>
                            <p className="text-sm text-slate-500 font-bold leading-relaxed mb-8">
                                Está a punto de borrar <span className="text-red-600 underline font-black">{selectedTickets.length}</span> solicitudes del sistema. Esta acción es irreversible y purgará todos los datos asociados.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={submitting}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/30 transition-all flex items-center justify-center"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {submitting ? 'Purgando...' : 'Confirmar Purgamiento'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Mantener Registros
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Tickets;
