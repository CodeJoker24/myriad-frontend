import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner, FaChevronRight, FaEnvelope, FaPhone, FaBook, FaUsers
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Teacher Management</h1>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
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
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <div className="mt-1 text-gray-400 text-xs">
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

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No teachers found</p>
          </div>
        ) : (
          filteredTeachers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                    <FaEnvelope size={12} />
                    <span>{t.email}</span>
                  </div>
                  {t.phone && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <FaPhone size={12} />
                      <span>{t.phone}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete(t.id, t.name)} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaTrash size={16} />
                </button>
              </div>

              {/* Subjects */}
              {t.subjects && t.subjects.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FaBook size={12} className="text-primary" />
                    <span className="text-xs font-semibold text-gray-600">Subjects</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {t.subjects.map(s => (
                      <span key={s} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes */}
              {t.classes && t.classes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaUsers size={12} className="text-primary" />
                    <span className="text-xs font-semibold text-gray-600">Classes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(t.classes) ? t.classes.map(c => (
                      <span key={c} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        {c}
                      </span>
                    )) : (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                        {t.classes}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Teacher Modal - Mobile Responsive */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 p-5 md:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg md:text-xl font-bold">Register Teacher</h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                <input 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
                <input 
                  required 
                  type="email" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="teacher@example.com"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Subjects</label>
                <input 
                  placeholder="Math, Physics, Chemistry" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base" 
                  value={formData.subjects} 
                  onChange={e => setFormData({...formData, subjects: e.target.value})} 
                />
                <p className="text-xs text-gray-400 mt-1">Separate subjects with commas</p>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Classes</label>
                <input 
                  placeholder="SS1, SS2, JS3" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base" 
                  value={formData.classes} 
                  onChange={e => setFormData({...formData, classes: e.target.value})} 
                />
                <p className="text-xs text-gray-400 mt-1">Separate classes with commas</p>
              </div>
              
              <button 
                disabled={loading} 
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold mt-4 hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? <FaSpinner className="animate-spin mx-auto" size={20} /> : 'Create Teacher Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};