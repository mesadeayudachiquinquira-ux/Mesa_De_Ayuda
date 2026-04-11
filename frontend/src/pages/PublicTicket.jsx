import React, { useState } from 'react';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LifeBuoy, 
    Send, 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    Upload, 
    User, 
    Mail, 
    Phone,
    CornerDownLeft,
    ShieldCheck,
    Hash,
    ChevronLeft
} from 'lucide-react';
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

    const handleFileChange = (e) => { setFile(e.target.files[0]); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (file) data.append('adjunto', file);

        try {
            const response = await api.post('/tickets/public', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data && response.data._id) {
                setAccessInfo({ id: response.data._id, code: response.data.codigoAcceso });
                setSuccess(true);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar su solicitud.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit'] relative overflow-hidden py-20 px-4">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600 rounded-b-[100px] z-0"></div>
            <div className="absolute top-20 right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl z-0"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-3xl z-0"></div>

            <div className="max-w-3xl mx-auto relative z-10">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-12 text-white">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/30 shadow-2xl mb-6"
                    >
                        <LifeBuoy className="h-12 w-12" />
                    </motion.div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">MuniSupport</h1>
                    <p className="text-blue-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">Gestión de Requerimientos Institucionales</p>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card !bg-white/90 backdrop-blur-2xl border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 text-center"
                        >
                            <div className="bg-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                                <CheckCircle className="text-white w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Solicitud Radicada!</h2>
                            <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto leading-relaxed">
                                Su caso ha sido asignado. Para el seguimiento inmediato y chat con soporte, utilice este código PIN único.
                            </p>

                            <div className="bg-slate-50 rounded-[32px] p-10 mb-10 border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ShieldCheck className="w-40 h-40" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Credencial de Seguimiento</p>
                                <div className="bg-white py-8 px-4 rounded-2xl border-2 border-dashed border-blue-200 shadow-inner">
                                    <span className="text-6xl font-black text-blue-600 tracking-[0.2em]">{accessInfo.code}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => navigate(`/public-tracking/${accessInfo.code}`)}
                                    className="w-full py-5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-[0.98]"
                                >
                                    Abrir Panel de Seguimiento
                                </button>
                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Finalizar Trámite
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="card !bg-white/95 backdrop-blur-2xl border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-10"
                        >
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                                    <Send className="p-2 bg-blue-50 text-blue-600 rounded-xl h-9 w-9" />
                                    Nuevo Registro de Incidencia
                                </h2>
                                <button onClick={() => navigate('/login')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 flex items-center transition-all">
                                    <ChevronLeft className="h-3 w-3 mr-1" /> Login
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Identidad del Solicitante</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500" />
                                            <input type="text" name="nombreContacto" required value={formData.nombreContacto} onChange={handleChange} placeholder="Nombre completo" className="input-field !pl-12" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Canal de Notificación</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500" />
                                            <input type="email" name="correoContacto" required value={formData.correoContacto} onChange={handleChange} placeholder="email@ejemplo.com" className="input-field !pl-12" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Asunto de Prioridad</label>
                                    <div className="relative group">
                                        <CornerDownLeft className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-blue-500" />
                                        <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} placeholder="Resumen del requerimiento" className="input-field !pl-12" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Descripción de la Situación</label>
                                    <textarea name="descripcion" required rows="4" value={formData.descripcion} onChange={handleChange} placeholder="Detalle los hallazgos o necesidades técnicas con precisión..." className="input-field resize-none"></textarea>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-6 items-end">
                                    <div className="flex-1 w-full">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 flex items-center">
                                            <Hash className="h-3 w-3 mr-1" /> PIN de Oficina
                                        </label>
                                        <input type="text" name="pin" maxLength="5" value={formData.pin} onChange={handleChange} className={`input-field !text-center !text-2xl font-black tracking-[0.5em] transition-all ${pinError ? '!border-red-500 !bg-red-50' : verifiedOffice ? '!border-emerald-500 !bg-emerald-50' : ''}`} placeholder="00000" />
                                    </div>
                                    <div className="flex-1 w-full h-[60px]">
                                        <AnimatePresence mode="wait">
                                            {verifyingPin ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex items-center justify-center text-blue-500 gap-2">
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Validando...</span>
                                                </motion.div>
                                            ) : verifiedOffice ? (
                                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full bg-emerald-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/20">
                                                    <ShieldCheck className="h-6 w-6 shrink-0" />
                                                    <div className="overflow-hidden">
                                                        <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Oficina Autorizada</p>
                                                        <p className="text-xs font-black truncate">{verifiedOffice.dependencia}</p>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl px-4 text-center">
                                                    <p className="text-[9px] font-black uppercase tracking-tight">Requiere PIN para radicar</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Soporte Visual</label>
                                    <div className="relative group">
                                        <input type="file" onChange={handleFileChange} className="hidden" id="file" />
                                        <label htmlFor="file" className="flex items-center justify-between input-field group-hover:bg-slate-50 cursor-pointer">
                                            <span className="truncate opacity-60 italic">{file ? file.name : 'Vicular imagen o documento técnico...'}</span>
                                            <Upload className="h-4 w-4 text-blue-500" />
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading || !verifiedOffice}
                                    className="w-full py-5 btn-primary disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center gap-3"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                    {loading ? 'Transmitiendo...' : 'Emitir Reporte Oficial'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-12 opacity-50 italic">
                    © {new Date().getFullYear()} Municipalidad de Soporte Técnico • Seguridad Nivel 4
                </p>
            </div>
        </div>
    );
};

export default PublicTicket;
