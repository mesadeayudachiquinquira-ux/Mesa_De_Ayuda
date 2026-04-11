import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, Mail, Lock, Loader2, ChevronLeft, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('Código enviado a su correo.');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al enviar el código');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');
        if (fullCode.length !== 6) return toast.error('Ingrese el código completo');

        setIsLoading(true);
        try {
            await api.post('/auth/verify-code', { email, code: fullCode });
            toast.success('Código verificado.');
            setStep(3);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Código incorrecto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error('Las contraseñas no coinciden');
        if (newPassword.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');

        setIsLoading(true);
        try {
            await api.put('/auth/reset-password', { 
                email, 
                code: code.join(''), 
                nuevaContraseña: newPassword 
            });
            toast.success('Contraseña actualizada con éxito');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al actualizar contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Outfit'] p-6 overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white p-8 md:p-12 overflow-hidden"
                >
                    <Link to="/login" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all mb-8">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Volver al inicio
                    </Link>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar Acceso</h1>
                                    <p className="text-slate-500 font-bold">Ingrese su correo para recibir un código de seguridad.</p>
                                </div>

                                <form onSubmit={handleEmailSubmit} className="space-y-6">
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

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl shadow-blue-600/20 text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Enviar Código'}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="step2"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Verificar Código</h1>
                                    <p className="text-slate-500 font-bold">Hemos enviado un código de 6 dígitos a <span className="text-blue-600">{email}</span></p>
                                </div>

                                <form onSubmit={handleVerifySubmit} className="space-y-8">
                                    <div className="flex justify-between gap-2">
                                        {code.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`code-${index}`}
                                                type="text"
                                                maxLength="1"
                                                value={digit}
                                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                required
                                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-black text-blue-600 shadow-inner focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                            />
                                        ))}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl shadow-blue-600/20 text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Validar Identidad'}
                                    </button>

                                    <div className="text-center">
                                        <button 
                                            type="button" 
                                            onClick={() => setStep(1)}
                                            className="text-xs font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-all"
                                        >
                                            Reenviar código
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="step3"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nueva Clave</h1>
                                    <p className="text-slate-500 font-bold">Defina su nueva clave institucional de acceso.</p>
                                </div>

                                <form onSubmit={handleResetSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nueva Contraseña</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <KeyRound className="h-5 w-5 text-slate-300 group-focus-within:text-blue-600" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pl-12 block w-full input-field !py-4"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors">
                                                <Lock className="h-5 w-5 text-slate-300 group-focus-within:text-blue-600" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="pl-12 block w-full input-field !py-4"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-5 px-4 rounded-2xl shadow-xl shadow-blue-600/20 text-xs font-black uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Actualizar y Entrar'}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <div className="mt-12 flex items-center justify-center gap-4 text-slate-300">
                    <ShieldCheck className="h-5 w-5" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Gestión Segura de Credenciales</p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
