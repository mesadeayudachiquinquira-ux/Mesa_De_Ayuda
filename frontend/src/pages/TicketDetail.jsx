import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft,
    Paperclip,
    Send,
    User as UserIcon,
    Clock,
    AlertCircle,
    CheckCircle,
    Lock,
    Trash2,
    AlertTriangle
} from 'lucide-react';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    // Recovery/Resolution states
    const [showResolutionModal, setShowResolutionModal] = useState(false);
    const [resolutionComment, setResolutionComment] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Ref for auto-scrolling to newest message
    const messagesEndRef = useRef(null);
    const audioRef = useRef(new Audio('/sounds/notification.mp3'));
    const prevMessagesLength = useRef(0);

    useEffect(() => {
        fetchTicketInfo();

        // Configurar polling cada 5 segundos
        const interval = setInterval(() => {
            if (ticket && ticket.estado !== 'cerrado') {
                fetchMessagesOnly();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [id, ticket?.estado]);

    useEffect(() => {
        // Scroll to bottom whenever messages update
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        // Play sound if new message is from someone else
        if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
            const lastMsg = messages[messages.length - 1];
            const isOwn = lastMsg.usuarioId && (lastMsg.usuarioId._id === user._id || lastMsg.usuarioId === user._id);
            if (!isOwn) {
                audioRef.current.play().catch(e => console.log('Audio blocked:', e));
            }
        }
        prevMessagesLength.current = messages.length;
    }, [messages, user._id]);

    const fetchTicketInfo = async () => {
        try {
            const { data } = await api.get(`/tickets/${id}`);
            setTicket(data.ticket);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Error fetching ticket details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessagesOnly = async () => {
        try {
            const { data } = await api.get(`/tickets/${id}`);
            if (data.messages && data.messages.length !== messages.length) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await api.post(`/tickets/${id}/mensajes`, { mensaje: newMessage });
            setNewMessage('');
            fetchTicketInfo(); // Refresh messages
        } catch (error) {
            console.error('Error sending message:', error);
            alert('No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    const handleChangeStatus = async (newStatus) => {
        if (user.rol !== 'admin') return;

        if (newStatus === 'cerrado') {
            setShowResolutionModal(true);
            return;
        }

        try {
            await api.put(`/tickets/${id}`, { estado: newStatus });
            fetchTicketInfo(); // Refresh ticket status
        } catch (error) {
            console.error('Error al cambiar el estado:', error);
        }
    };

    const handleFinalClose = async () => {
        if (!resolutionComment.trim()) return;
        setUpdatingStatus(true);
        try {
            await api.put(`/tickets/${id}`, {
                estado: 'cerrado',
                comentarioResolucion: resolutionComment
            });
            setShowResolutionModal(false);
            fetchTicketInfo();
        } catch (error) {
            console.error('Error al cerrar ticket:', error);
            alert('No se pudo cerrar el ticket adecuadamente.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        setUpdatingStatus(true);
        try {
            await api.delete(`/tickets/${id}`);
            navigate('/tickets');
        } catch (error) {
            console.error('Error al borrar ticket:', error);
            alert(error.response?.data?.message || 'No se pudo eliminar el ticket.');
        } finally {
            setUpdatingStatus(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><span className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></span></div>;
    if (!ticket) return <div className="text-center p-12 text-gray-500">Ticket no encontrado o sin acceso.</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center">
                    <Link to="/tickets" className="mr-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{ticket.titulo}</h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Creado el {new Date(ticket.fechaCreación).toLocaleString()} por
                            <span className="font-semibold text-gray-700 ml-1">
                                {ticket.esPúblico ? `${ticket.nombreContacto} (Externo)` : ticket.creadoPor?.nombre}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Admin Controls */}
                {user?.rol === 'admin' && (
                    <div className="flex items-center gap-2">
                        <select
                            className="input-field text-sm font-semibold !py-1.5"
                            value={ticket.estado}
                            onChange={(e) => handleChangeStatus(e.target.value)}
                        >
                            <option value="abierto">Abierto</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="cerrado">Cerrado</option>
                        </select>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="p-2 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 rounded-lg transition-all shadow-sm"
                            title="Eliminar Ticket"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chat/Info Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Ticket Description Card */}
                    <div className="card">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                                Descripción del Problema
                            </h3>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.descripcion}</p>

                        {/* Resolution Comment Display */}
                        {ticket.comentarioResolucion && (
                            <div className="mt-6 bg-green-50 border border-green-100 rounded-xl p-5">
                                <h4 className="flex items-center text-green-800 font-bold mb-2">
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Detalle de la Solución
                                </h4>
                                <p className="text-green-900 text-sm whitespace-pre-wrap italic">
                                    "{ticket.comentarioResolucion}"
                                </p>
                            </div>
                        )}

                        {/* Attachments (if any) */}
                        {ticket.adjuntos && ticket.adjuntos.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                                    Archivos Adjuntos
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {ticket.adjuntos.map((fileUrl, index) => (
                                        <a
                                            key={index}
                                            href={`http://${window.location.hostname}:5000${fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Ver archivo {index + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Messages - Solo para tickets externos */}
                    {ticket.esPúblico && (
                        <div className="card flex flex-col h-[500px]">
                            <div className="border-b border-gray-100 pb-4 mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Conversación con el Usuario</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 italic">
                                        No hay mensajes aún. Comienza la conversación abajo.
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isOwn = msg.usuarioId && (msg.usuarioId._id === user._id || msg.usuarioId === user._id);
                                        const isAdmin = msg.usuarioId?.rol === 'admin';
                                        const nombreUsuario = msg.usuarioId?.nombre || 'Portal Público';

                                        return (
                                            <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                                                    {/* Avatar */}
                                                    {!isOwn && (
                                                        <div className={`flex-shrink-0 mr-3 h-8 w-8 rounded-full flex items-center justify-center text-white ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                            {nombreUsuario.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    {/* Bubble */}
                                                    <div className={`rounded-2xl px-5 py-3 shadow-sm ${isOwn
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                                        }`}>
                                                        {!isOwn && (
                                                            <div className={`text-xs font-bold mb-1 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`}>
                                                                {msg.usuarioId?.nombre || 'Usuario'} {isAdmin && '(Admin)'}
                                                            </div>
                                                        )}
                                                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.mensaje}</p>
                                                        <div className={`text-[10px] mt-2 text-right ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            {ticket.estado !== 'cerrado' ? (
                                <form onSubmit={handleSendMessage} className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex space-x-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Escribe un mensaje al usuario externo..."
                                            className="input-field flex-1"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="btn-primary flex items-center px-5"
                                        >
                                            {sending ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <Send className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-4 pt-4 border-t border-gray-100 text-center text-gray-500 font-medium bg-gray-50 p-3 rounded-lg flex items-center justify-center">
                                    <Lock className="h-4 w-4 mr-2" />
                                    Este ticket está cerrado y no admite más mensajes.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Status/Info Panel */}
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="text-sm font-bold tracking-wider text-gray-500 uppercase mb-4">Información del Ticket</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Estado</p>
                                <div className="flex items-center">
                                    <span className={`w-3 h-3 rounded-full mr-2 
                    ${ticket.estado === 'abierto' ? 'bg-red-500' :
                                            ticket.estado === 'en_progreso' ? 'bg-yellow-500' :
                                                'bg-green-500'}`}></span>
                                    <span className="font-semibold text-gray-900 capitalize">{ticket.estado.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 mb-1">Dependencia / Secretaría</p>
                                <span className="font-semibold text-gray-900">{ticket.dependencia}</span>
                            </div>
                            {ticket.seccion && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-500 mb-1">Sección / Oficina</p>
                                    <span className="font-semibold text-gray-900">{ticket.seccion}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 mb-1">ID del Ticket</p>
                                <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{ticket._id}</span>
                            </div>
                            {ticket.esPúblico && (
                                <div className="border-t border-gray-100 pt-4 bg-orange-50 -mx-4 px-4 pb-4">
                                    <p className="text-xs font-bold text-orange-700 mb-2 uppercase tracking-widest mt-2">Contacto Externo</p>
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-700"><strong>Nombre:</strong> {ticket.nombreContacto}</p>
                                        <p className="text-sm text-gray-700"><strong>Email:</strong> {ticket.correoContacto}</p>
                                        {ticket.telefonoContacto && <p className="text-sm text-gray-700"><strong>Tel:</strong> {ticket.telefonoContacto}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Resolución */}
            {showResolutionModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center mb-4">
                                    <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
                                        <CheckCircle className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Finalizar Ticket</h3>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">
                                    Por favor describe qué se hizo para solucionar el problema. Este comentario será visible para el equipo (y para el usuario si es externo).
                                </p>
                                <textarea
                                    className="input-field min-h-[120px] resize-none"
                                    placeholder="Ej. Se reemplazó el cable de red dañado y se configuró la IP estática..."
                                    value={resolutionComment}
                                    onChange={(e) => setResolutionComment(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    disabled={updatingStatus || !resolutionComment.trim()}
                                    onClick={handleFinalClose}
                                    className="btn-primary px-6"
                                >
                                    {updatingStatus ? 'Cerrando...' : 'Cerrar Ticket'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResolutionModal(false)}
                                    className="btn-secondary px-6"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Borrado */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4">
                                <div className="flex items-center mb-4">
                                    <div className="bg-red-100 p-2 rounded-full mr-3 text-red-600">
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">¿Eliminar Ticket?</h3>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Esta acción es permanente y eliminará tanto el ticket como todos sus mensajes. No se puede deshacer.
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    disabled={updatingStatus}
                                    onClick={handleDelete}
                                    className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 px-6"
                                >
                                    {updatingStatus ? 'Eliminando...' : 'Eliminar Permanentemente'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="btn-secondary px-6"
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

export default TicketDetail;
