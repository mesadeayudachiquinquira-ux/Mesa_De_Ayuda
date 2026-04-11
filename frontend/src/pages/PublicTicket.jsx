import React, { useState } from 'react';
import api from '../api/axios';
import { LifeBuoy, Send, CheckCircle, AlertCircle, Loader2, Upload, User, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublicTicket = () => {
    const [formData, setFormData] = useState({
        nombreContacto: '',
        correoContacto: '',
        telefonoContacto: '',
        titulo: '',
        descripcion: '',
        pin: '',
    });
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [verifiedOffice, setVerifiedOffice] = useState(null);
    const [pinError, setPinError] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [accessInfo, setAccessInfo] = useState({ id: '', code: '' });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        // Auto-verify PIN when it reaches 5 digits
        if (name === 'pin') {
            setPinError(null);
            if (value.length === 5) {
                verifyOfficePin(value);
            } else {
                setVerifiedOffice(null);
            }
        }
    };

    const verifyOfficePin = async (code) => {
        setVerifyingPin(true);
        try {
            const res = await api.post('/tickets/verify-pin', { code });
            setVerifiedOffice(res.data);
            setPinError(null);
        } catch (err) {
            setVerifiedOffice(null);
            setPinError('Código PIN inválido');
        } finally {
            setVerifyingPin(false);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        data.append('nombreContacto', formData.nombreContacto);
        data.append('correoContacto', formData.correoContacto);
        data.append('telefonoContacto', formData.telefonoContacto);
        data.append('titulo', formData.titulo);
        data.append('descripcion', formData.descripcion);
        data.append('pin', formData.pin);
        if (file) {
            data.append('adjunto', file);
        }

        try {
            console.log('Enviando ticket público con datos:', formData);
            const response = await api.post('/tickets/public', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Respuesta exitosa del servidor:', response.data);
            
            if (response.data && response.data._id) {
                setAccessInfo({ 
                    id: response.data._id, 
                    code: response.data.codigoAcceso || 'ERROR' 
                });
                setSuccess(true);
            } else {
                throw new Error('La respuesta del servidor no contiene los datos del ticket');
            }
        } catch (err) {
            console.error('Error al enviar ticket:', err);
            setError(err.response?.data?.message || err.message || 'Error al enviar el ticket. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div key="public-ticket-root" className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" translate="no">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-slate-100">
                <div className="bg-blue-600 p-8 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <LifeBuoy className="w-8 h-8" />
                        <h1 className="text-2xl font-bold italic tracking-tight"><span>MuniSupport Chiquinquirá</span></h1>
                    </div>
                    <p className="text-blue-100"><span>Portal Público de Soporte Técnico</span></p>
                </div>

                <div className="p-8">
                    {success ? (
                        <div key="success-content" className="text-center animate-fade-in" translate="no">
                            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="text-green-600 w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2"><span>¡Nueva Solicitud Enviada!</span></h2>
                            <p className="text-gray-600 mb-6 font-medium">
                                <span>Hemos recibido tu solicitud. Guarda los siguientes datos para seguir el estado de tu ticket y chatear con soporte:</span>
                            </p>

                            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 space-y-4 text-left">
                                <div key="pin-display">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 text-center"><span>Tu Código de Acceso (PIN)</span></p>
                                    <div className="bg-white p-6 rounded-2xl border border-blue-200 text-center shadow-inner">
                                        <span className="text-4xl font-black text-blue-600 tracking-[0.3em]">{accessInfo.code}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 text-center mt-3 uppercase font-bold"><span>Usa este código único para consultar el estado en cualquier momento</span></p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate(`/public-tracking/${accessInfo.code}`)}
                                    className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                                >
                                    <span>Ir al Seguimiento ahora</span>
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                >
                                    <span>Volver al Inicio</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div key="form-content" className="animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Send className="w-5 h-5 text-blue-600" />
                                <span>Registrar Nueva Incidencia</span>
                            </h2>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded">
                                    <AlertCircle className="shrink-0" />
                                    <p className="text-sm font-medium"><span>{error}</span></p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" /> <span>Nombre Completo *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="nombreContacto"
                                            required
                                            value={formData.nombreContacto}
                                            onChange={handleChange}
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" /> <span>Correo Electrónico *</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="correoContacto"
                                            required
                                            value={formData.correoContacto}
                                            onChange={handleChange}
                                            placeholder="correo@ejemplo.com"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" /> <span>Teléfono (Opcional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="telefonoContacto"
                                        value={formData.telefonoContacto}
                                        onChange={handleChange}
                                        placeholder="+57 300 123 4567"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700"><span>Título de la incidencia *</span></label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        required
                                        value={formData.titulo}
                                        onChange={handleChange}
                                        placeholder="Breve descripción del problema"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700"><span>Descripción detallada *</span></label>
                                    <textarea
                                        name="descripcion"
                                        required
                                        rows="4"
                                        value={formData.descripcion}
                                        onChange={handleChange}
                                        placeholder="Explique su problema con detalle..."
                                        className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="space-y-4 col-span-1 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700"><span>Código de Oficina (PIN de 5 dígitos) *</span></label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="pin"
                                                    maxLength="5"
                                                    placeholder="Ej. 12345"
                                                    value={formData.pin}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-2.5 bg-white border ${pinError ? 'border-red-500' : verifiedOffice ? 'border-green-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono tracking-widest text-lg`}
                                                />
                                                {verifyingPin && (
                                                    <div className="absolute right-3 top-3">
                                                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="h-[46px] flex items-center">
                                            {verifiedOffice ? (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 flex-1 animate-pulse-subtle">
                                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                                    <div className="text-xs">
                                                        <p className="font-bold"><span>Oficina Identificada:</span></p>
                                                        <p><span>{verifiedOffice.dependencia} {verifiedOffice.seccion ? `- ${verifiedOffice.seccion}` : ''}</span></p>
                                                    </div>
                                                </div>
                                            ) : pinError ? (
                                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 flex-1">
                                                    <AlertCircle className="w-5 h-5" />
                                                    <span className="text-xs font-semibold"><span>{pinError}</span></span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-3 bg-gray-50 text-gray-500 rounded-xl border border-gray-100 flex-1">
                                                    <LifeBuoy className="w-5 h-5" />
                                                    <span className="text-xs italic"><span>Ingrese el código para validar la oficina</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700"><span>Adjuntar Archivo</span></label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="public-file-upload"
                                        />
                                        <label
                                            htmlFor="public-file-upload"
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border-2 border-dashed border-gray-400 rounded-xl hover:border-blue-600 hover:bg-blue-50 cursor-pointer transition-all group-hover:text-blue-600"
                                        >
                                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                            <span className="text-sm text-gray-500 group-hover:text-blue-600 truncate">
                                                <span>{file ? file.name : 'Subir imagen o doc'}</span>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                                    >
                                        <span>Cancelar</span>
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !verifiedOffice}
                                        className={`flex-2 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 
                                    ${loading || !verifiedOffice ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                    >
                                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        <span>{loading ? 'Enviando...' : 'Enviar Reporte de Oficina'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <p className="text-center text-gray-400 text-sm mt-8">
                <span>&copy; {new Date().getFullYear()} MuniSupport Chiquinquirá. Todos los derechos reservados.</span>
            </p>
        </div>
    );
};

export default PublicTicket;
