import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Search, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';

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

        // Escuchar actualizaciones globales vía WebSocket
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
            // Un pequeño delay para que el indicador sea perceptible pero no molesto
            setTimeout(() => setRefreshing(false), 2000);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setSubmitting(true);
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
        } catch (error) {
            console.error('Error creando ticket:', error);
            alert(error.response?.data?.message || 'Error al crear el ticket');
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
        try {
            await api.post('/tickets/bulk-delete', { ids: selectedTickets });
            setSelectedTickets([]);
            setShowDeleteModal(false);
            fetchTickets();
        } catch (error) {
            console.error('Error en borrado masivo:', error);
            alert('No se pudieron eliminar los tickets seleccionados.');
        } finally {
            setSubmitting(false);
        }
    };

    const activeTickets = Array.isArray(tickets) ? tickets.filter(t => t?.estado !== 'cerrado') : [];
    const closedTickets = Array.isArray(tickets) ? tickets.filter(t => t?.estado === 'cerrado') : [];

    // Calcular responsables de tickets cerrados
    const statsResponsables = closedTickets.reduce((acc, t) => {
        const nombre = t.atendidoPorNombre || 'No Registrado';
        acc[nombre] = (acc[nombre] || 0) + 1;
        return acc;
    }, {});
    
    // Convertir a array y ordenar por cantidad de tickets (mayor a menor)
    const topResponsables = Object.entries(statsResponsables)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count);

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
            console.error('Error filtrando ticket:', t, err);
            return false;
        }
    });

    // Añadir efecto para limpiar el responsable seleccionado si cambiamos de pestaña
    useEffect(() => {
        if (filterStatus === 'active') {
            setSelectedResponsable('');
        }
    }, [filterStatus]);

    // Debug log para ver qué llega exactamente
    useEffect(() => {
        if (tickets.length > 0) {
            console.log('Tickets cargados:', tickets.length);
            console.log('Ejemplo primer ticket:', tickets[0]);
        }
    }, [tickets]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets</h1>
                        {refreshing && (
                            <div className="flex items-center text-blue-500 animate-pulse">
                                <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">Actualizando...</span>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">Lista completa y estado de todos los requerimientos.</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary inline-flex items-center justify-center whitespace-nowrap px-6"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Nuevo Ticket
                </button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedTickets.length > 0 && user?.rol === 'admin' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center text-blue-800">
                        <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                            {selectedTickets.length}
                        </span>
                        <p className="font-medium text-sm">Tickets seleccionados para eliminar</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedTickets([])}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-red-100 transition-all flex items-center"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar ({selectedTickets.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs & Search Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-0">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`pb-4 text-sm font-bold transition-all relative ${filterStatus === 'active' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Tickets Activos
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${filterStatus === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                            {activeTickets.length}
                        </span>
                        {filterStatus === 'active' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]" />}
                    </button>
                    <button
                        onClick={() => setFilterStatus('closed')}
                        className={`pb-4 text-sm font-bold transition-all relative ${filterStatus === 'closed' ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Archivo (Cerrados)
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${filterStatus === 'closed' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'}`}>
                            {closedTickets.length}
                        </span>
                        {filterStatus === 'closed' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 rounded-t-full" />}
                    </button>
                </div>

                <div className="relative w-full md:max-w-sm mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 input-field py-2"
                        placeholder="Buscar en esta lista..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Estadisticas de Resolución (solo admin en archivo cerrados) */}
            {user?.rol === 'admin' && filterStatus === 'closed' && closedTickets.length > 0 && topResponsables.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider flex items-center">
                            <span className="text-xl mr-2">🏆</span>
                            Ranking de Resolución
                        </h3>
                        {selectedResponsable && (
                            <button onClick={() => setSelectedResponsable('')} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full transition-colors">
                                Quitar filtro: {selectedResponsable}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {topResponsables.slice(0, 5).map((r, idx) => (
                            <div 
                                key={r.nombre} 
                                onClick={() => setSelectedResponsable(selectedResponsable === r.nombre ? '' : r.nombre)}
                                className={`flex items-center bg-white border ${selectedResponsable === r.nombre ? 'border-primary-500 ring-2 ring-primary-100' : 'border-transparent'} rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer min-w-[200px]`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-700 shadow-inner' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                                    #{idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]" title={r.nombre}>{r.nombre}</p>
                                    <p className="text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 mt-1 rounded-md">{r.count} resueltos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tickets Table container with translation isolation */}
            <div className="card overflow-hidden !p-0" translate="no">
                <div key={loading ? 'loading' : (filteredTickets.length > 0 ? 'list' : 'empty')}>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <span className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></span>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No se encontraron tickets con "<b>{searchTerm}</b>" o no hay tickets creados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        {user?.rol === 'admin' && (
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                                checked={filteredTickets.length > 0 && selectedTickets.length === filteredTickets.length}
                                                onChange={() => handleSelectAll(filteredTickets)}
                                            />
                                        )}
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asunto / Solicitante</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Dependencia / Sección</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTickets.map(ticket => (
                                    <tr key={ticket._id} className={`hover:bg-gray-50 transition-colors ${selectedTickets.includes(ticket._id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            {user?.rol === 'admin' && (
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                                                    checked={selectedTickets.includes(ticket._id)}
                                                    onChange={() => handleSelectTicket(ticket._id)}
                                                />
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900 mb-1">{ticket?.titulo || 'Sin Título'}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 truncate max-w-[200px]">{ticket?.descripcion || 'Sin descripción'}</span>
                                                <span className="text-xs font-bold text-gray-400">|</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${ticket?.esPúblico ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                    {ticket?.esPúblico ? 'Externo' : 'Interno'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 italic">
                                                De: {ticket?.esPúblico ? `${ticket?.nombreContacto || 'Anonimo'} (${ticket?.correoContacto || 'N/A'})` : (ticket?.creadoPor?.nombre || 'Usuario Desconocido')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                        ${ticket?.estado === 'abierto' ? 'bg-red-100 text-red-700' :
                                                    ticket?.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-700'}`}>
                                                {(ticket?.estado || 'DESCONOCIDO').replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="text-sm text-gray-700 font-medium">{ticket?.dependencia || 'N/A'}</div>
                                            {ticket?.seccion && <div className="text-xs text-gray-400">{ticket?.seccion}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {ticket?.fechaCreación ? new Date(ticket.fechaCreación).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/app/tickets/${ticket._id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md transition-colors hover:bg-blue-100 font-semibold">
                                                Ver detalles
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

            {/* Create Ticket Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                                    Crear Nuevo Ticket
                                </h3>
                            </div>
                            <form onSubmit={handleCreateTicket}>
                                <div className="p-6 space-y-4 bg-gray-50">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título del problema</label>
                                        <input type="text" required value={titulo} onChange={e => setTitulo(e.target.value)} className="input-field" placeholder="Ej. No funciona la red" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
                                        <textarea required value={descripcion} onChange={e => setDescripcion(e.target.value)} rows="4" className="input-field resize-none" placeholder="Describe el problema que estás experimentando..."></textarea>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia (Secretaría)</label>
                                            <select
                                                required
                                                value={dependencia}
                                                onChange={e => {
                                                    setDependencia(e.target.value);
                                                    setSeccion(''); // Reset seccion when dependencia changes
                                                }}
                                                className="input-field"
                                            >
                                                <option value="">Seleccione Secretaría...</option>
                                                {Object.keys(ORGANIGRAM).map(dep => (
                                                    <option key={dep} value={dep}>{dep}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sección / Oficina</label>
                                            <select
                                                value={seccion}
                                                onChange={e => setSeccion(e.target.value)}
                                                className="input-field"
                                                disabled={!dependencia || ORGANIGRAM[dependencia].length === 0}
                                            >
                                                <option value="">{ORGANIGRAM[dependencia]?.length > 0 ? 'Seleccione Oficina...' : 'General'}</option>
                                                {dependencia && ORGANIGRAM[dependencia].map(sec => (
                                                    <option key={sec} value={sec}>{sec}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Archivo (Opcional)</label>
                                        <input type="file" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer" />
                                    </div>
                                </div>
                                <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100 bg-white">
                                    <button type="submit" disabled={submitting} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                        {submitting ? 'Enviando...' : 'Crear Ticket'}
                                    </button>
                                    <button type="button" onClick={() => setShowModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Multiple Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDeleteModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center mb-4 text-red-600">
                                    <AlertTriangle className="h-6 w-6 mr-3" />
                                    <h3 className="text-xl font-bold text-gray-900">¿Eliminar {selectedTickets.length} tickets?</h3>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Estás a punto de eliminar <b>{selectedTickets.length}</b> tickets de forma permanente. Esto también borrará todos los mensajes y archivos adjuntos asociados. Esta acción no se puede deshacer.
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-row-reverse gap-3">
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={submitting}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Eliminando...' : 'Eliminar Definivamente'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
