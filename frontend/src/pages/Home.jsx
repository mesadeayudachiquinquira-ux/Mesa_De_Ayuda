import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PlusCircle, 
    Search, 
    UserCircle, 
    ShieldCheck,
    ArrowRight
} from 'lucide-react';

const HubCard = ({ title, description, icon: Icon, onClick, primary = false }) => (
    <button
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl text-center w-full border border-white/50
            ${primary 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700' 
                : 'bg-white/70 backdrop-blur-md text-gray-800 shadow-lg hover:bg-white'
            }`}
    >
        <div className={`mb-6 p-4 rounded-full transition-transform duration-500 group-hover:scale-110
            ${primary ? 'bg-white/20' : 'bg-blue-50'}`}>
            <Icon size={48} className={primary ? 'text-white' : 'text-blue-600'} />
        </div>
        
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className={`text-sm leading-relaxed ${primary ? 'text-blue-50' : 'text-gray-500 font-medium'}`}>
            {description}
        </p>
        
        <div className={`mt-6 flex items-center font-bold text-sm tracking-wide gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0
            ${primary ? 'text-white' : 'text-blue-600'}`}>
            INICIAR <ArrowRight size={16} />
        </div>
    </button>
);

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen py-12 px-6 flex flex-col items-center justify-center relative overflow-hidden bg-slate-100">
            {/* Background Image of Chiquinquirá */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img 
                    src="/chiquinquira_bg.jpg" 
                    alt="Chiquinquirá" 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]"></div>
            </div>

            {/* Background elements for depth */}
            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden mix-blend-multiply">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-300 rounded-full blur-[120px] opacity-40"></div>
            </div>

            <div className="max-w-5xl w-full space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                {/* Header Section */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
                        <ShieldCheck className="text-blue-600" size={18} />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-[0.2em]">Centro de Gestión Institucional</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        MuniSupport <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                            Chiquinquira
                        </span>
                    </h1>
                    
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        Bienvenido al Centro de Gestión de Soporte. Seleccione una de las siguientes opciones para comenzar su trámite de soporte.
                    </p>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <HubCard 
                        title="Nueva Solicitud"
                        description="Reporte incidentes de hardware, software o redes de forma rápida y sencilla."
                        icon={PlusCircle}
                        primary={true}
                        onClick={() => navigate('/public-ticket')}
                    />
                    
                    <HubCard 
                        title="Seguimiento"
                        description="Consulte el estado actual y los avances de su requerimiento con su código."
                        icon={Search}
                        onClick={() => navigate('/public-tracking')}
                    />
                    
                    <HubCard 
                        title="Acceso Soporte"
                        description="Para técnicos y personal de soporte que gestiona las solicitudes diarias."
                        icon={UserCircle}
                        onClick={() => navigate('/login')}
                    />
                </div>

                {/* Footer Info */}
                <footer className="text-center pt-8 border-t border-gray-200/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Alcaldia Municipal de Chiquinquira &copy; 2026
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default Home;
