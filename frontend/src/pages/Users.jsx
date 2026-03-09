import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Edit, ShieldAlert } from 'lucide-react';

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('usuario');
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUserId) {
                // Editar usuario
                const data = { nombre, email, rol };
                if (password) data.contraseña = password;
                await api.put(`/users/${editingUserId}`, data);
            } else {
                // Crear usuario
                await api.post('/users', { nombre, email, contraseña: password, rol });
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error guardando usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (u) => {
        setEditingUserId(u._id);
        setNombre(u.nombre);
        setEmail(u.email);
        setRol(u.rol || 'usuario');
        setPassword(''); // Al editar, la contraseña no se muestra
        setShowModal(true);
    };

    const resetForm = () => {
        setNombre(''); setEmail(''); setPassword(''); setRol('usuario'); setEditingUserId(null);
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esa acción no se puede deshacer.')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                alert('Error eliminando usuario');
            }
        }
    };

    if (loading) return <div className="flex justify-center p-12"><span className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></span></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">Añade o elimina administradores y usuarios.</p>
                </div>

                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary inline-flex items-center justify-center whitespace-nowrap"
                >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${u.rol === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                {u.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{u.nombre}</div>
                                                <div className="text-sm text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border 
                      ${u.rol === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                            {u.rol === 'admin' && <ShieldAlert className="w-3 h-3 mr-1" />}
                                            {u.rol.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(u.fechaRegistro).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(u)}
                                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-full transition-colors mr-2"
                                            title="Editar usuario"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        {u._id !== currentUser._id && (
                                            <button
                                                onClick={() => handleDeleteUser(u._id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
                                <h3 className="text-lg leading-6 font-semibold text-gray-900" id="modal-title">
                                    {editingUserId ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h3>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 space-y-4 bg-gray-50">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                        <input type="text" required value={nombre} onChange={e => setNombre(e.target.value)} className="input-field" placeholder="Ej. Ana Gomez" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="ana@ejemplo.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {editingUserId ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                                        </label>
                                        <input type="password" required={!editingUserId} value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" minLength="6" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                        <select value={rol} onChange={e => setRol(e.target.value)} className="input-field">
                                            <option value="usuario">Usuario Estándar</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="px-4 py-3 sm:px-6 flex flex-row-reverse border-t border-gray-100 bg-white">
                                    <button type="submit" disabled={submitting} className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                        {submitting ? 'Guardando...' : (editingUserId ? 'Actualizar Usuario' : 'Crear Usuario')}
                                    </button>
                                    <button type="button" onClick={() => { resetForm(); setShowModal(false); }} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cancelar
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

export default Users;
