import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    LifeBuoy,
    Send,
    Clock,
    AlertCircle,
    Paperclip,
    ArrowLeft,
    MessageCircle,
    Loader2,
    Lock
} from 'lucide-react';

const PublicTracking = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialCode = searchParams.get('code') || '';

    const [ticketIdInput, setTicketIdInput] = useState(id || '');
    const [accessCode, setAccessCode] = useState(initialCode);
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const audioRef = useRef(new Audio('/sounds/notification.mp3'));
    const prevMessagesLength = useRef(0);
    const firstLoad = useRef(true);


    useEffect(() => {
        if (initialCode) {
            handleVerify();
        }

        // Configurar polling cada 5 segundos
        const interval = setInterval(() => {
            if (ticket && accessCode) {
                fetchMessages();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [ticket, accessCode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (!firstLoad.current && messages.length > prevMessagesLength.current) {
            const lastMsg = messages[messages.length - 1];
            // En vista pública, si el mensaje tiene usuarioId es de soporte
            if (lastMsg.usuarioId) {
                audioRef.current.play().catch(e => console.log('Audio blocked:', e));
            }
        }
        prevMessagesLength.current = messages.length;
        firstLoad.current = false;
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const currentId = id || ticketIdInput;
            const { data } = await api.get(`/tickets/public/${currentId}/${accessCode}`);
            // Solo actualizar si el número de mensajes cambió para evitar re-renders innecesarios
            if (data.messages.length !== messages.length) {
                setMessages(data.messages);
            }
        } catch (err) {
            console.error('Error polling messages:', err);
        }
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const currentId = id || ticketIdInput;
        
        if (!currentId) {
            setError('Por favor ingresa el ID del ticket.');
            return;
        }
        if (!accessCode) {
            setError('Por favor ingresa el código de acceso.');
            return;
        }

        setIsVerifying(true);
        setError('');
        try {
            const { data } = await api.get(`/tickets/public/${currentId}/${accessCode}`);
            setTicket(data.ticket);
            setMessages(data.messages);
        } catch (err) {
            setError(err.response?.data?.message || 'ID o Código incorrecto.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const currentId = id || ticketIdInput;
            await api.post(`/tickets/public/${currentId}/mensajes`, {
                mensaje: newMessage,
                codigo: accessCode
            });
            setNewMessage('');
            fetchMessages();
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'No se pudo enviar el mensaje.';
            alert(`Error: ${errorMsg}`);
        } finally {
            setSending(false);
        }
    };

    if (!ticket) {
        return (
            <div key="verify-screen" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" translate="no">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in border border-slate-100">
                    <div className="text-center mb-8">
                        <div className="bg-blue-600/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-blue-600 w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900"><span>Seguimiento de Ticket</span></h2>
                        <p className="text-gray-500 mt-2"><span>Ingresa tu código de seguridad para ver el estado y chat.</span></p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle size={16} /> <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        {!id && (
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1"><span>ID del Ticket</span></label>
                                <input
                                    type="text"
                                    value={ticketIdInput}
                                    onChange={(e) => setTicketIdInput(e.target.value)}
                                    placeholder="Ej. 65f123abc..."
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm text-gray-800 shadow-sm"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1"><span>Código de Acceso</span></label>
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                placeholder="EJ. XA5K7"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-center font-mono text-xl tracking-widest text-gray-800 shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
                        >
                            {isVerifying && <Loader2 className="animate-spin" size={20} />}
                            <span>{isVerifying ? 'Verificando...' : 'Consultar Ticket'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700"
                        >
                            <span>Volver al inicio</span>
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div key="tracking-content" className="h-screen flex flex-col overflow-hidden bg-gray-50" translate="no">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 z-10 shrink-0">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2">
                            <LifeBuoy className="w-6 h-6 text-blue-600" />
                            <h1 className="text-lg font-bold text-gray-900 hidden sm:block"><span>Mesa de Ayuda</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-700 uppercase"><span>{ticket.estado.replace('_', ' ')}</span></span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-8">
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Summary */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-gray-900"><span>{ticket.titulo}</span></h2>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${ticket.prioridad === 'alta' ? 'bg-red-50 text-red-600' :
                                ticket.prioridad === 'media' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                <span>{ticket.prioridad}</span>
                            </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap"><span>{ticket.descripcion}</span></p>
                        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={14} /> <span>{new Date(ticket.fechaCreación).toLocaleDateString()}</span></span>
                            <span className="font-mono bg-gray-50 px-2 py-1 rounded"><span>ID: {ticket._id}</span></span>
                        </div>

                        {ticket.adjuntos?.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-50">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-3"><span>Archivos Adjuntos</span></p>
                                <div className="flex flex-wrap gap-2">
                                    {ticket.adjuntos.map((url, i) => (
                                        <a
                                            key={url}
                                            href={`http://${window.location.hostname}:5000${url}`}
                                            target="_blank"
                                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                                        >
                                            <Paperclip size={14} /> <span>Adjunto {i + 1}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px] lg:h-[600px] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                            <MessageCircle className="text-blue-600" size={20} />
                            <h3 className="font-bold text-gray-900"><span>Chat de Soporte</span></h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                            {messages.map((msg) => {
                                const isAdmin = msg.usuarioId?.rol === 'admin';
                                const isOwn = !msg.usuarioId; // Anonymous messages have no user

                                return (
                                    <div key={msg._id || msg.fecha} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] ${isOwn ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-blue-500/10' : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-2xl rounded-tl-none'} p-4`}>
                                            {!isOwn && (
                                                <div className="text-[10px] font-black uppercase tracking-wider mb-1 text-blue-600">
                                                    <span>Soporte Técnico {isAdmin && '✓'}</span>
                                                </div>
                                            )}
                                            <p className="text-sm leading-relaxed"><span>{msg.mensaje}</span></p>
                                            <p className={`text-[10px] mt-2 text-right ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
                                                <span>{new Date(msg.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {ticket.estado !== 'cerrado' ? (
                            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm shadow-sm"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-100 disabled:opacity-50 transition-all active:scale-95"
                                    >
                                        {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 bg-gray-50 text-center text-gray-500 text-sm font-medium">
                                <span>Este ticket ha sido cerrado.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4"><span>Detalles de Contacto</span></h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400"><span>Nombre</span></p>
                                <p className="text-sm font-bold text-gray-900"><span>{ticket.nombreContacto || 'No proporcionado'}</span></p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400"><span>Correo</span></p>
                                <p className="text-sm font-bold text-gray-900"><span>{ticket.correoContacto}</span></p>
                            </div>
                            {ticket.telefonoContacto && (
                                <div>
                                    <p className="text-xs text-gray-400"><span>Teléfono</span></p>
                                    <p className="text-sm font-bold text-gray-900"><span>{ticket.telefonoContacto}</span></p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
                        <h3 className="text-sm font-bold mb-2"><span>¿Necesitas cerrar este ticket?</span></h3>
                        <p className="text-blue-100 text-xs leading-relaxed mb-4">
                            <span>Si tu problema ya fue resuelto, el equipo técnico lo marcará como completado. Recibirás una notificación por correo.</span>
                        </p>
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] uppercase font-bold text-blue-200 mb-1"><span>Tu PIN de Acceso</span></p>
                            <p className="text-2xl font-black tracking-widest bg-white/20 p-2 rounded text-center"><span>{accessCode}</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
);
};

export default PublicTracking;
