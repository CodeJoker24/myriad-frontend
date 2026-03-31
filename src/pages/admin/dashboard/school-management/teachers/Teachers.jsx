import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner, FaCircle 
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subjects: '', classes: ''
  });

  // MONITOR: Refresh the list every 5 seconds to see live status changes
  useEffect(() => {
    fetchTeachers();
    const interval = setInterval(fetchTeachers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('last_seen', { ascending: false });

    if (data) setTeachers(data);
    if (error) console.error("Error loading teachers:", error.message);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Auth Account
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: formData.email,
        password: '123456',
      });
      if (authErr) throw authErr;

      // 2. Create Database Profile
      const { error: dbErr } = await supabase.from('teachers').insert([{
        id: auth.user.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
        classes: formData.classes ? formData.classes.split(',').map(c => c.trim()) : [],
        is_first_login: true,
        last_seen: new Date(0).toISOString() // Set as offline initially
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

  // Check if teacher has been active in the last 5 minutes
  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    const lastActive = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return (now - lastActive) < 300000; 
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2">
          <FaPlus /> Add Teacher
        </button>
      </div>

      <div className="mb-6 relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs font-bold text-gray-500 uppercase">
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredTeachers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold text-gray-800">{t.name}</td>
                <td className="p-4 text-sm text-gray-500">{t.email}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${isOnline(t.last_seen) ? 'text-green-500' : 'text-gray-400'}`}>
                    <FaCircle size={8} /> {isOnline(t.last_seen) ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(t.id, t.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Register Teacher</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input required placeholder="Full Name" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required type="email" placeholder="Email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input placeholder="Subjects (e.g. Math, English)" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100" value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                <button disabled={loading} className="flex-2 bg-blue-600 text-white py-3 px-6 rounded-xl font-bold">
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};