import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner 
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });

  // Load teachers once on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true }); // Ordered by name now instead of last_seen

    if (data) setTeachers(data);
    if (error) console.error("Error loading teachers:", error.message);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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
        is_first_login: true
      }]);
      if (dbErr) throw dbErr;

      Swal.fire('Created!', 'Teacher added with default password 123456', 'success');
      setShowAddModal(false);
      setFormData({ name: '', email: '', phone: '', subjects: '', classes: '' });
      fetchTeachers();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
          <FaPlus /> Add Teacher
        </button>
      </div>

      <div className="mb-6 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs font-bold text-gray-500 uppercase">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Subjects/Classes</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTeachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{t.name}</td>
                <td className="p-4 text-sm text-gray-500">{t.email}<br/>{t.phone}</td>
                <td className="p-4 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {t.subjects?.map(s => <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>)}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-gray-400">
                    {Array.isArray(t.classes) ? t.classes.join(', ') : t.classes}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-4xl p-8 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Register Teacher</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input required type="email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Subjects</label>
                <input placeholder="Math, Physics" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Classes</label>
                <input placeholder="JS1, SS2" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.classes} onChange={e => setFormData({...formData, classes: e.target.value})} />
              </div>
              <button disabled={loading} className="col-span-2 bg-primary text-white py-4 rounded-2xl font-bold mt-4 hover:opacity-90 transition-opacity">
                {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Create Teacher Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};