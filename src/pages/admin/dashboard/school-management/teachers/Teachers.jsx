import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner, FaEdit, FaLock, FaUnlock
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null); // NULL = Create, ID = Edit
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });

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

  // OPEN MODAL FOR EDITING
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
        // --- UPDATE LOGIC (Feature #3) ---
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
        // --- CREATE LOGIC ---
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
          is_active: true // Default to active
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

  // --- TOGGLE STATUS LOGIC (Feature #5) ---
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

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Teacher Management</h1>
        <button 
          onClick={() => { setEditingId(null); setFormData({name:'', email:'', phone:'', subjects:'', classes:''}); setShowAddModal(true); }} 
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <FaPlus size={14} /> Add Teacher
        </button>
      </div>

      <div className="mb-6 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs font-bold text-gray-500 uppercase">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Subjects/Classes</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTeachers.map((t) => (
              <tr key={t.id} className={`hover:bg-gray-50 ${!t.is_active ? 'bg-gray-50/50 opacity-75' : ''}`}>
                <td className="p-4 font-bold text-gray-800">{t.name}</td>
                <td className="p-4 text-sm text-gray-500">{t.email}<br/>{t.phone}</td>
                <td className="p-4 text-xs">
                   <div className="flex flex-wrap gap-1">
                    {t.subjects?.map(s => <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>)}
                  </div>
                  <div className="mt-1 text-gray-400">
                    {Array.isArray(t.classes) ? t.classes.join(', ') : t.classes}
                  </div>
                </td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${t.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.is_active ? 'ACTIVE' : 'FROZEN'}
                    </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={() => toggleStatus(t.id, t.is_active, t.name)} title={t.is_active ? "Freeze Account" : "Activate Account"} className={`p-2 rounded-lg transition-colors ${t.is_active ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}>
                    {t.is_active ? <FaLock /> : <FaUnlock />}
                  </button>
                  <button onClick={() => handleEditClick(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal - Handles both Create and Edit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-5 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg md:text-xl font-bold">{editingId ? 'Edit Teacher' : 'Register Teacher'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                <input required disabled={!!editingId} type="email" className={`w-full p-3 bg-gray-50 rounded-xl border border-gray-100 ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                {editingId && <p className="text-[10px] text-orange-500 mt-1">Email cannot be changed for existing accounts.</p>}
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Subjects (Comma separated)</label>
                <input placeholder="Math, Physics" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Classes (Comma separated)</label>
                <input placeholder="SS1, SS2" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:ring-2 focus:ring-primary/20 outline-none" value={formData.classes} onChange={e => setFormData({...formData, classes: e.target.value})} />
              </div>
              
              <button disabled={loading} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold mt-4 hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <FaSpinner className="animate-spin mx-auto" size={20} /> : (editingId ? 'Update Teacher' : 'Create Teacher Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};