import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Mail, Lock, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
            navigate('/app');
        } catch (err) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-['Outfit'] overflow-hidden">
            {/* Left Side: Visual/Branding */}
            <div className="hidden lg:flex lg:w-3/5 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
                <motion.div 
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 z-0"
                >
                    <img 
                        src="/municipal_modern_bg_1775931556857.png" 
                        alt="Municipal Modern" 
                        className="w-full h-full object-cover grayscale-[20%]"
                    />
                    <div className="absolute inset-0 bg-blue-900/20 backdrop-overlay"></div>
                </motion.div>

                <div className="relative z-10 text-white max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex justify-center lg:justify-start mb-8">
                             <div className="bg-white/10 backdrop-blur-xl p-3 rounded-3xl border border-white/20 shadow-2xl inline-flex items-center justify-center">
                                <img src="/munisupport_logo.png" alt="MuniSupport Logo" className="h-14 w-14 object-contain rounded-2xl" />
                             </div>
                        </div>
                        <h1 className="text-6xl font-black tracking-tight leading-none mb-6">
                            Muni<span className="text-blue-400">Support</span>
                        </h1>
                        <p className="text-xl font-bold text-slate-200 leading-relaxed max-w-md">
                            Elevando la eficiencia institucional a través del soporte técnico de clase mundial.
                        </p>
                        
                        <div className="mt-12 flex gap-8">
                            <div>
                                <p className="text-4xl font-black text-white">99.9%</p>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Disponibilidad</p>
                            </div>
                            <div className="w-px h-12 bg-white/10"></div>
                            <div>
                                <p className="text-4xl font-black text-white">+5k</p>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Casos Resueltos</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom glass badge */}
                <div className="absolute bottom-12 left-12 right-12 z-10">
                    <div className="glass-light p-6 rounded-3xl border border-white/20 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <ShieldCheck className="text-emerald-400 h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-white/60">Seguridad Municipal</p>
                                <p className="text-sm font-bold text-white">Conexión Encriptada TLS 1.3</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-2/5 flex flex-col justify-center p-8 sm:p-12 lg:p-20 relative bg-white">
                <div className="max-w-md w-full mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link to="/" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all mb-12">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Volver al portal
                        </Link>

                        <div className="mb-10">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Acceso Institucional</h2>
                            <p className="text-slate-500 font-bold mt-2">Ingrese sus credenciales para gestionar solicitudes.</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl"
                                >
                                    <p className="text-sm text-red-600 font-black tracking-tight">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Identidad Digital (Email)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                        <Mail className="h-5 w-5 text-slate-300 group-focus-within:text-blue-600" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 block w-full input-field !py-4"
                                        placeholder="usuario@municipio.gov.co"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Clave de Acceso</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                        <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-blue-600" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 block w-full input-field !py-4"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="h-5 w-5 border-slate-200 rounded-lg text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                    <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">Siguiente Sesión</span>
                                </label>
                                <Link to="/forgot-password" size={0} className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">Recuperar Clave</Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl shadow-blue-600/20 text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 mt-8"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                ) : (
                                    'Autenticar Identidad'
                                )}
                            </button>
                        </form>

                    </motion.div>
                </div>
                
                {/* Copyright info */}
                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">©{new Date().getFullYear()} Municipalidad de Soporte Técnico</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
