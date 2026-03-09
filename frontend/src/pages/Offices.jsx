import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Building2, Plus, Edit, Trash2, Key, Search, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

const Offices = () => {
    const [offices, setOffices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentOffice, setCurrentOffice] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        dependencia: '',
        seccion: '',
        code: ''
    });

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        try {
            const { data } = await api.get('/offices');
            setOffices(data);
        } catch (err) {
            console.error('Error cargando oficinas:', err);
            setError('No se pudieron cargar las oficinas.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (office = null) => {
        if (office) {
            setCurrentOffice(office);
            setFormData({
                dependencia: office.dependencia,
                seccion: office.seccion || '',
                code: office.code
            });
        } else {
            setCurrentOffice(null);
            setFormData({
                dependencia: '',
                seccion: '',
                code: ''
            });
        }
        setShowModal(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            if (currentOffice) {
                await api.put(`/offices/${currentOffice._id}`, formData);
            } else {
                await api.post('/offices', formData);
            }
            setShowModal(false);
            fetchOffices();
        } catch (err) {
            setError(err.response?.data?.message || 'Ocurrió un error al guardar.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta oficina?')) return;
        try {
            await api.delete(`/offices/${id}`);
            fetchOffices();
        } catch (err) {
            alert('Error al eliminar oficina');
        }
    };

    const filteredOffices = offices.filter(o =>
        o.dependencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.seccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="text-blue-600" /> Gestor de Oficinas
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los códigos PIN y dependencias municipales.</p>
                </div>

                <button
                    onClick={() => handleOpenModal()}
                    className="btn-primary inline-flex items-center justify-center px-6"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Nueva Oficina
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full md:max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="pl-10 input-field py-2"
                        placeholder="Buscar por nombre o PIN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="card overflow-hidden !p-0">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                    </div>
                ) : filteredOffices.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 italic">
                        No se encontraron oficinas que coincidan con la búsqueda.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Dependencia</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sección / Oficina</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Código PIN</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredOffices.map(office => (
                                    <tr key={office._id} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{office.dependencia}</td>
                                        <td className="px-6 py-4 text-gray-600">{office.seccion || <span className="text-gray-300 italic">General</span>}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold tracking-widest border border-blue-200">
                                                {office.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(office)}
                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(office._id)}
                                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Creación/Edición */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

                        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
                            <div className="bg-blue-600 px-6 py-4 text-white">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    {currentOffice ? <Edit /> : <Plus />}
                                    {currentOffice ? 'Editar Oficina' : 'Nueva Oficina'}
                                </h3>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100">
                                        <AlertTriangle size={18} /> {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Dependencia / Secretaría *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.dependencia}
                                        onChange={e => setFormData({ ...formData, dependencia: e.target.value })}
                                        className="input-field"
                                        placeholder="Ej. Secretaría Hacienda"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Sección / Oficina (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.seccion}
                                        onChange={e => setFormData({ ...formData, seccion: e.target.value })}
                                        className="input-field"
                                        placeholder="Ej. Tesorería"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                                        <Key size={14} className="text-gray-400" /> Código PIN de 5 Dígitos *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength="5"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="input-field font-mono text-xl tracking-widest text-center"
                                        placeholder="12345"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold text-center">Solo números o letras sin espacios</p>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {submitting && <Loader2 className="animate-spin" size={20} />}
                                        {currentOffice ? 'Guardar Cambios' : 'Crear Oficina'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Offices;
