import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner, FaEdit, FaLock, FaUnlock, FaPhone, FaBook, FaUsers, FaChevronRight
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });
  const [expandedCard, setExpandedCard] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });

    if (data) setTeachers(data);
    if (error) console.error("Error loading teachers:", error.message);
  };

  const handleEditClick = (teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects ? teacher.subjects.join(', ') : '',
      classes: teacher.classes ? teacher.classes.join(', ') : ''
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('teachers')
          .update({
            name: formData.name,
            phone: formData.phone,
            subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s !== ""),
            classes: formData.classes.split(',').map(c => c.trim()).filter(c => c !== ""),
          })
          .eq('id', editingId);

        if (error) throw error;
        Swal.fire('Updated!', 'Teacher profile updated successfully.', 'success');
      } else {
        const { data: auth, error: authErr } = await supabase.auth.signUp({
          email: formData.email,
          password: '123456',
        });
        if (authErr) throw authErr;

        const { error: dbErr } = await supabase.from('teachers').insert([{
          id: auth.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
          classes: formData.classes ? formData.classes.split(',').map(c => c.trim()) : [],
          is_first_login: true,
          is_active: true
        }]);
        if (dbErr) throw dbErr;
        Swal.fire('Created!', 'Teacher added with default password 123456', 'success');
      }

      setShowAddModal(false);
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', subjects: '', classes: '' });
      fetchTeachers();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus, name) => {
    const { error } = await supabase
      .from('teachers')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      setTeachers(teachers.map(t => t.id === id ? { ...t, is_active: !currentStatus } : t));
      Swal.fire(
        !currentStatus ? 'Activated' : 'Frozen',
        `${name} has been ${!currentStatus ? 'restored' : 'denied access'}.`,
        'success'
      );
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete ${name}?`,
      text: "This will remove their account and access.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (!error) {
        setTeachers(teachers.filter(t => t.id !== id));
        Swal.fire('Deleted', 'Teacher removed.', 'success');
      }
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all teachers in your school</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({name:'', email:'', phone:'', subjects:'', classes:''}); setShowAddModal(true); }} 
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus size={14} /> Add Teacher
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm md:text-base"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats Summary - Mobile Friendly */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:hidden">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{teachers.length}</p>
          <p className="text-xs text-gray-600">Total Teachers</p>
        </div>
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{teachers.filter(t => t.is_active).length}</p>
          <p className="text-xs text-gray-600">Active Teachers</p>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Subjects/Classes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    No teachers found
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.is_active ? 'bg-gray-50/50 opacity-75' : ''}`}>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{t.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-600">{t.email}</div>
                      <div className="text-xs text-gray-400">{t.phone || 'No phone'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {t.subjects?.slice(0, 2).map(s => (
                          <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{s}</span>
                        ))}
                        {t.subjects?.length > 2 && (
                          <span className="text-xs text-gray-400">+{t.subjects.length - 2}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t.classes?.slice(0, 2).join(', ')}{t.classes?.length > 2 ? ` +${t.classes.length - 2}` : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => toggleStatus(t.id, t.is_active, t.name)} title={t.is_active ? "Freeze Account" : "Activate Account"} className={`p-2 rounded-lg transition-colors ${t.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                          {t.is_active ? <FaLock size={14} /> : <FaUnlock size={14} />}
                        </button>
                        <button onClick={() => handleEditClick(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <FaEdit size={14} />
                        </button>
                        <button onClick={() => handleDelete(t.id, t.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-500">No teachers found</p>
          </div>
        ) : (
          filteredTeachers.map((t) => (
            <div key={t.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all ${!t.is_active ? 'opacity-75' : ''}`}>
              {/* Card Header */}
              <div 
                className="p-4 flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpand(t.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{t.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{t.email}</div>
                </div>
                <FaChevronRight className={`text-gray-400 transition-transform ${expandedCard === t.id ? 'rotate-90' : ''}`} />
              </div>

              {/* Card Expanded Content */}
              {expandedCard === t.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                  {t.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <FaPhone className="text-gray-400" size={12} />
                      <span className="text-gray-600">{t.phone}</span>
                    </div>
                  )}
                  
                  {t.subjects && t.subjects.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaBook className="text-primary" size={12} />
                        <span className="text-xs font-medium text-gray-500">SUBJECTS</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {t.subjects.map(s => (
                          <span key={s} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {t.classes && t.classes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FaUsers className="text-primary" size={12} />
                        <span className="text-xs font-medium text-gray-500">CLASSES</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {t.classes.map(c => (
                          <span key={c} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => toggleStatus(t.id, t.is_active, t.name)} 
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${t.is_active ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                    >
                      {t.is_active ? <><FaLock size={12} className="inline mr-1" /> Freeze</> : <><FaUnlock size={12} className="inline mr-1" /> Activate</>}
                    </button>
                    <button 
                      onClick={() => handleEditClick(t)} 
                      className="flex-1 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <FaEdit size={12} className="inline mr-1" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id, t.name)} 
                      className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <FaTrash size={12} className="inline mr-1" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal - Handles both Create and Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-auto p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
                <input 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
                <input 
                  required 
                  disabled={!!editingId} 
                  type="email" 
                  className={`w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`} 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="teacher@example.com"
                />
                {editingId && <p className="text-xs text-orange-500 mt-1">Email cannot be changed after creation</p>}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Subjects</label>
                <input 
                  placeholder="e.g., Mathematics, Physics, English" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={formData.subjects} 
                  onChange={e => setFormData({...formData, subjects: e.target.value})} 
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple subjects with commas</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Classes</label>
                <input 
                  placeholder="e.g., SS1, SS2, JS3" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
                  value={formData.classes} 
                  onChange={e => setFormData({...formData, classes: e.target.value})} 
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple classes with commas</p>
              </div>
              
              <button 
                disabled={loading} 
                className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold mt-4 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <FaSpinner className="animate-spin" size={18} /> : (editingId ? 'Update Teacher' : 'Create Teacher Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};