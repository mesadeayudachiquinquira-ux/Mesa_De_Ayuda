import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
    Clock, 
    User, 
    Tag, 
    AlertCircle, 
    CheckCircle, 
    MessageSquare, 
    ArrowLeft, 
    Send,
    Trash2,
    Paperclip,
    Building2,
    Layout as LayoutIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../socket';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState('');
    const [comentarioResolucion, setComentarioResolucion] = useState('');
    const [atendidoPorNombre, setAtendidoPorNombre] = useState('');
    const [notifyCitizen, setNotifyCitizen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [error, setError] = useState('');

    // Typing indicator
    const [otherPersonTyping, setOtherPersonTyping] = useState(false);
    const typingTimeoutRef = useRef(null);

    // Ref for auto-scrolling to newest message
    const messagesEndRef = useRef(null);
    const audioRef = useRef(new Audio('/sounds/notification.mp3'));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, otherPersonTyping]);

    useEffect(() => {
        const fetchTicketData = async () => {
            try {
                // El endpoint /tickets/:id ahora devuelve { ticket, messages } en una sola llamada
                const { data } = await api.get(`/tickets/${id}`);
                
                if (data && data.ticket) {
                    setTicket(data.ticket);
                    setMessages(data.messages || []);
                    setStatus(data.ticket.estado);
                    setComentarioResolucion(data.ticket.comentarioResolucion || '');
                    setAtendidoPorNombre(data.ticket.atendidoPorNombre || '');
                } else {
                    setError('Estructura de datos inválida');
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching ticket data:', error);
                setLoading(false);
                setError('No se pudo cargar la información del ticket');
            }
        };

        fetchTicketData();

        // Join socket room for this ticket
        socket.connect();
        socket.emit('joinTicket', id);

        const handleNewMessage = (message) => {
            setMessages(prev => [...prev, message]);
            if (message && message.usuarioId && user && message.usuarioId !== user._id) {
                audioRef.current.play().catch(e => console.log('Audio error:', e));
            }
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('userTyping', () => setOtherPersonTyping(true));
        socket.on('userStopTyping', () => setOtherPersonTyping(false));

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.off('userTyping');
            socket.off('userStopTyping');
            socket.disconnect();
        };
    }, [id, user._id]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const { data } = await api.post(`/tickets/${id}/mensajes`, { 
                mensaje: newMessage,
                notificarSolicitante: notifyCitizen 
            });
            // Socket handles UI update via broadcast, no need to manually append here if server emits
            setNewMessage('');
            setNotifyCitizen(false);
            socket.emit('stopTyping', id);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async () => {
        setUpdatingStatus(true);
        try {
            const { data } = await api.put(`/tickets/${id}`, { 
                estado: status,
                comentarioResolucion,
                atendidoPorNombre
            });
            setTicket(data);
            alert('Estado actualizado correctamente');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar el estado');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteTicket = async () => {
        try {
            await api.delete(`/tickets/${id}`);
            navigate('/app/tickets');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('Error al eliminar el ticket');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Solicitud no encontrada</h2>
                <button onClick={() => navigate('/app/tickets')} className="mt-4 btn-primary">Volver a la lista</button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/app/tickets')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors order-first"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-extrabold text-gray-900">{ticket.titulo}</h1>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${ticket.esPúblico ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-blue-100 text-blue-600 border border-blue-200'}`}>
                                {ticket.esPúblico ? 'Solicitante' : 'Soporte'}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">Gestión completa y comunicación con el solicitante.</p>
                    </div>
                </div>

                {user && user.rol === 'admin' && (
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors border border-red-200"
                    >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Solicitud
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details & Chat */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Ticket Description Card */}
                    <div className="card">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                                Descripción del Problema
                            </h3>
                        </div>
                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <p className="text-sm text-red-700 font-bold">{error}</p>
                            </div>
                        )}
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
                                {ticket.atendidoPorNombre && (
                                    <div className="text-xs font-semibold text-green-800 mt-3 pt-3 border-t border-green-200">
                                        Resuelto por: {ticket.atendidoPorNombre}
                                    </div>
                                )}
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
                                    {ticket.adjuntos.map((fileUrl, index) => {
                                        const finalUrl = fileUrl.startsWith('http') 
                                            ? fileUrl 
                                            : `http://${window.location.hostname}:5000${fileUrl}`;
                                        
                                        return (
                                        <a
                                            key={index}
                                            href={finalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                        >
                                            <Paperclip className="h-4 w-4 mr-2" />
                                            Ver archivo {index + 1}
                                        </a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Messages */}
                    <div className="card flex flex-col h-[500px]">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Conversación</h3>
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
                                    const nombreUsuario = msg.usuarioId?.nombre || ticket.nombreContacto || 'Solicitante';

                                    return (
                                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar */}
                                                {!isOwn && (
                                                    <div className={`flex-shrink-0 ${isOwn ? 'ml-3' : 'mr-3'} h-8 w-8 rounded-full flex items-center justify-center text-white ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                        {nombreUsuario.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Bubble */}
                                                <div className={`rounded-2xl px-5 py-3 shadow-sm ${isOwn 
                                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                                    }`}>
                                                    {!isOwn && (
                                                        <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`}>
                                                            {isAdmin ? 'Soporte ✓' : 'Solicitante'}
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.mensaje}</p>
                                                    <div className={`text-[10px] mt-2 text-right ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                    );
                                })
                            )}

                            {/* Indicador de escritura al FINAL para que sea visible */}
                            {otherPersonTyping && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2 shadow-sm border border-gray-200/50">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                                        </div>
                                        <span className="text-xs text-gray-500 ml-1">
                                            <span className="font-bold text-blue-600">
                                                {ticket?.nombreContacto || ticket?.creadoPor?.nombre || 'El solicitante'}
                                            </span> está escribiendo...
                                        </span>
                                    </div>
                                </div>
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
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            socket.emit('typing', { ticketId: id, role: 'soporte' });
                                            clearTimeout(typingTimeoutRef.current);
                                            typingTimeoutRef.current = setTimeout(() => {
                                                socket.emit('stopTyping', id);
                                            }, 2000);
                                        }}
                                        placeholder="Escribe un mensaje al solicitante..."
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
                                {ticket.esPúblico && (
                                    <label className="flex items-center gap-2 mt-2 text-xs text-gray-500 cursor-pointer hover:text-blue-600 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={notifyCitizen}
                                            onChange={(e) => setNotifyCitizen(e.target.checked)}
                                            className="rounded text-blue-600"
                                        />
                                        <span>Notificar al solicitante por correo</span>
                                    </label>
                                )}
                            </form>
                        ) : (
                            <div className="mt-4 pt-4 border-t border-gray-100 text-center text-gray-500 text-sm py-4 italic bg-gray-50 rounded-lg">
                                La conversación está cerrada porque la solicitud ya fue resuelta.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Status & Metadata */}
                <div className="space-y-8">
                    {/* Status Update Card */}
                    <div className="card">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                             Estado de la Solicitud
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-2">Estado Actual</label>
                                <select 
                                    value={status} 
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="input-field"
                                >
                                    <option value="abierto">Abierto</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="cerrado">Resuelto / Cerrado</option>
                                </select>
                            </div>

                            {status === 'cerrado' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Resuelto por</label>
                                        <input 
                                            type="text" 
                                            value={atendidoPorNombre}
                                            onChange={(e) => setAtendidoPorNombre(e.target.value)}
                                            placeholder="Nombre del técnico..."
                                            className="input-field"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-2">Detalle de la solución (público)</label>
                                        <textarea 
                                            value={comentarioResolucion}
                                            onChange={(e) => setComentarioResolucion(e.target.value)}
                                            placeholder="Explique cómo se resolvió..."
                                            className="input-field h-24 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={handleUpdateStatus}
                                disabled={updatingStatus}
                                className="w-full btn-primary"
                            >
                                {updatingStatus ? 'Actualizando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="card space-y-6">
                        <section>
                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Información del Solicitante</p>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        <User className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{ticket.esPúblico ? (ticket.nombreContacto || 'Anónimo') : (ticket.creadoPor?.nombre || 'Usuario')}</p>
                                        <p className="text-[10px] text-gray-500">{ticket.esPúblico ? (ticket.correoContacto || 'Sin correo') : (ticket.creadoPor?.email || 'Interno')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 p-2 rounded-lg">
                                        <Building2 className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{ticket.dependencia || 'N/A'}</p>
                                        <p className="text-[10px] text-gray-500">{ticket.seccion || 'Área General'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="pt-4 border-t border-gray-100">
                            <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">Detalles del Sistema</p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">ID:</span>
                                    <span className="font-mono text-gray-900">{ticket._id}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Código Seguimiento:</span>
                                    <span className="font-bold text-blue-600">{ticket.codigoAcceso || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Fecha:</span>
                                    <span className="text-gray-900">{new Date(ticket.fechaCreación).toLocaleDateString()} {new Date(ticket.fechaCreación).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </section>

                        {ticket.esPúblico && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <p className="text-[10px] font-black uppercase text-orange-700 mb-1">Nota de Seguridad</p>
                                <p className="text-[10px] text-orange-600 leading-tight">Esta solicitud fue registrada mediante código de acceso de oficina (sin cuenta).</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¿Eliminar Solicitud?</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Esta acción es irreversible. Se eliminarán permanentemente el ticket, todos los mensajes del chat y archivos adjuntos.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleDeleteTicket}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketDetail;
