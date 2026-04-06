import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaTrash, FaSearch, FaTimes, FaSpinner, FaEdit, 
  FaLock, FaUnlock, FaPhone, FaBook, FaUsers, FaChevronRight, 
  FaChalkboardTeacher, FaEnvelope, FaUserGraduate, FaFilter,
  FaChevronDown
} from 'react-icons/fa';

export const Teachers = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subjects: [], classes: [], is_class_teacher_of: ''
  });
  const [expandedCard, setExpandedCard] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchTeachers(), fetchMasterData()]);
      setIsInitialLoading(false);
    };
    loadAllData();
  }, []);

  const fetchMasterData = async () => {
    const { data: subData } = await supabase.from('subjects').select('name, category');
    const { data: clsData } = await supabase.from('classes').select('name');
    if (subData) setAvailableSubjects(subData);
    if (clsData) setAvailableClasses(clsData.map(c => c.name));
  };

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });
    if (data) setTeachers(data);
    if (error) console.error("Error loading teachers:", error.message);
  };

  const handleCheckboxChange = (type, value) => {
    setFormData(prev => {
      const currentList = prev[type] || [];
      const newList = currentList.includes(value)
        ? currentList.filter(item => item !== value)
        : [...currentList, value];
      return { ...prev, [type]: newList };
    });
  };

  const handleEditClick = (teacher) => {
    setEditingId(teacher.id);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      subjects: teacher.subjects || [],
      classes: teacher.classes || [],
      is_class_teacher_of: teacher.is_class_teacher_of || ''
    });
    setShowAddModal(true);
  };

 const handleSave = async (e) => {
  e.preventDefault();

 
  if (!window.navigator.onLine) {
    return Swal.fire({
      title: 'No Connection',
      text: 'Your internet appears to be offline. Please reconnect and try again.',
      icon: 'warning'
    });
  }

  setLoading(true);
  try {
    const payload = {
      name: formData.name,
      phone: formData.phone,
      subjects: formData.subjects,
      classes: formData.classes,
      is_class_teacher_of: formData.is_class_teacher_of || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', editingId);
      
      if (error) throw error;
      Swal.fire('Updated!', 'Teacher profile updated successfully.', 'success');
    } else {
      
      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: formData.email,
        password: '123456',
      });

      if (authErr) {
        throw authErr;
      }

      
      const { error: dbErr } = await supabase.from('teachers').insert([{
        ...payload,
        id: auth.user.id,
        email: formData.email,
        is_first_login: true,
        is_active: true
      }]);

      if (dbErr) {
        
        throw new Error(`Auth account created, but profile setup failed: ${dbErr.message}`);
      }

      Swal.fire('Created!', 'Teacher added with default password 123456', 'success');
    }

    // Reset state on success
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', subjects: [], classes: [], is_class_teacher_of: '' });
    fetchTeachers();

  } catch (err) {

    let friendlyMessage = err.message;

   
    if (friendlyMessage.includes("Failed to fetch") || friendlyMessage.includes("network")) {
      friendlyMessage = "Connection lost! Please check your internet and try again.";
    } 
    
    else if (friendlyMessage.includes("already registered")) {
      friendlyMessage = "This email is already registered. If the profile is missing, please contact the DB admin.";
    }

    Swal.fire({
      title: 'Error',
      text: friendlyMessage,
      icon: 'error',
      confirmButtonColor: '#3b82f6'
    });
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
      Swal.fire(!currentStatus ? 'Activated' : 'Frozen', `${name} status updated.`, 'success');
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: `Delete ${name}?`,
      text: "This action is permanent.",
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

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && t.is_active) ||
      (filterStatus === 'inactive' && !t.is_active);
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Staff Registry</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Class Teachers and Subject Specialists</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({name:'', email:'', phone:'', subjects:[], classes:[], is_class_teacher_of:''}); setShowAddModal(true); }} 
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 w-full sm:w-auto justify-center transition-all shadow-md active:scale-95"
        >
          <FaPlus size={14} /> Add Teacher
        </button>
      </div>

      {/* Stats Summary - Mobile Only */}
      <div className="grid grid-cols-2 gap-3 mb-4 md:hidden">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{teachers.length}</p>
          <p className="text-xs text-gray-600">Total Teachers</p>
        </div>
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{teachers.filter(t => t.is_active).length}</p>
          <p className="text-xs text-gray-600">Active</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, email..." 
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Mobile Filter Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              <FaFilter size={12} />
              {filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
            <FaChevronDown size={12} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
              {['all', 'active', 'inactive'].map(option => (
                <button
                  key={option}
                  onClick={() => { setFilterStatus(option); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${filterStatus === option ? 'text-primary font-semibold bg-blue-50' : 'text-gray-600'}`}
                >
                  {option === 'all' ? 'All Status' : option === 'active' ? 'Active Only' : 'Inactive Only'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Filter Select */}
        <select 
          className="hidden md:block px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Loading State */}
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FaSpinner className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500 font-medium">Fetching staff records...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b">
                  <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <th className="p-4">Teacher Info</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Subjects</th>
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
                      <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${!t.is_active ? 'bg-gray-50/50 opacity-60' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{t.name}</div>
                          <div className="text-xs text-gray-400">{t.email}</div>
                        </td>
                        <td className="p-4">
                          {t.is_class_teacher_of ? (
                            <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-2 py-1 rounded-lg w-fit">
                              <FaChalkboardTeacher size={12} />
                              <span className="text-[10px] font-bold uppercase">Form Teacher: {t.is_class_teacher_of}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Subject Specialist</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-50">
                            {t.subjects?.slice(0, 3).map(s => (
                              <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>
                            ))}
                            {t.subjects?.length > 3 && <span className="text-[10px] text-gray-400">+{t.subjects.length - 3}</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => toggleStatus(t.id, t.is_active, t.name)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-orange-500">
                              {t.is_active ? <FaLock size={14} /> : <FaUnlock size={14} />}
                            </button>
                            <button onClick={() => handleEditClick(t)} className="p-2 hover:bg-gray-100 rounded-lg text-blue-500">
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => handleDelete(t.id, t.name)} className="p-2 hover:bg-gray-100 rounded-lg text-red-500">
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
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FaUserGraduate className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No teachers found</p>
              </div>
            ) : (
              filteredTeachers.map((t) => (
                <div key={t.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${!t.is_active ? 'opacity-75' : ''}`}>
                  {/* Card Header - Click to expand */}
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                    onClick={() => toggleExpand(t.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800 text-base">{t.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {t.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FaEnvelope size={10} />
                        <span className="truncate">{t.email}</span>
                      </div>
                      {t.phone && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <FaPhone size={10} />
                          <span>{t.phone}</span>
                        </div>
                      )}
                    </div>
                    <FaChevronRight className={`text-gray-400 transition-transform duration-300 ${expandedCard === t.id ? 'rotate-90' : ''}`} />
                  </div>

                  {/* Card Expanded Content */}
                  {expandedCard === t.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                      {/* Designation */}
                      <div className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FaChalkboardTeacher className="text-purple-600" size={12} />
                          <span className="text-xs font-bold text-purple-600 uppercase">Role</span>
                        </div>
                        {t.is_class_teacher_of ? (
                          <p className="text-sm font-semibold text-purple-700">Form Teacher: {t.is_class_teacher_of}</p>
                        ) : (
                          <p className="text-sm text-gray-600">Subject Specialist</p>
                        )}
                      </div>
                      
                      {/* Subjects */}
                      {t.subjects && t.subjects.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FaBook className="text-primary" size={12} />
                            <span className="text-xs font-bold text-gray-500 uppercase">Subjects</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {t.subjects.map(s => (
                              <span key={s} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-xs font-medium">
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
                            <FaUsers className="text-primary" size={12} />
                            <span className="text-xs font-bold text-gray-500 uppercase">Classes</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {t.classes.map(c => (
                              <span key={c} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-xl text-xs font-medium">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-3">
                        <button 
                          onClick={() => toggleStatus(t.id, t.is_active, t.name)} 
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${t.is_active ? 'bg-orange-50 text-orange-600 active:bg-orange-100' : 'bg-green-50 text-green-600 active:bg-green-100'}`}
                        >
                          {t.is_active ? <><FaLock size={12} className="inline mr-1" /> Freeze</> : <><FaUnlock size={12} className="inline mr-1" /> Activate</>}
                        </button>
                        <button 
                          onClick={() => handleEditClick(t)} 
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 active:bg-blue-100"
                        >
                          <FaEdit size={12} className="inline mr-1" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(t.id, t.name)} 
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 active:bg-red-100"
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
        </>
      )}

      {/* Add/Edit Modal - Mobile Responsive (Bottom Sheet) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl mx-auto p-5 md:p-8 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pt-2 pb-2">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{editingId ? 'Edit Profile' : 'New Teacher Account'}</h2>
                <p className="text-xs text-gray-500 mt-1">Assign subjects and management roles</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name *</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Phone</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone number" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email *</label>
                <input required disabled={!!editingId} type="email" className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none text-sm ${editingId ? 'opacity-50' : ''}`} 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="teacher@school.com" />
              </div>

              {/* Form Teacher */}
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <label className="text-xs font-bold text-purple-600 uppercase block mb-2 tracking-wider">Class Teacher (Form Role)</label>
                <select 
                  className="w-full p-3 bg-white rounded-xl border-none outline-none text-sm font-medium text-purple-900 shadow-sm"
                  value={formData.is_class_teacher_of || ""}
                  onChange={e => setFormData({...formData, is_class_teacher_of: e.target.value})}
                >
                  <option value="">-- No Class Assigned --</option>
                  {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Subjects</label>
                <div className="bg-gray-50 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-4 border border-gray-100">
                  {['Early Years', 'General', 'Science', 'Business', 'Arts', 'Religion', 'Vocational', 'JSS'].map(cat => {
                    const catSubjects = availableSubjects.filter(s => s.category === cat);
                    if (catSubjects.length === 0) return null;
                    return (
                      <div key={cat}>
                        <h4 className="text-xs font-bold text-primary uppercase mb-2 border-b border-primary/10 pb-1">{cat}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {catSubjects.map(sub => (
                            <label key={sub.name} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-100 cursor-pointer active:bg-blue-50">
                              <input type="checkbox" checked={formData.subjects?.includes(sub.name)} onChange={() => handleCheckboxChange('subjects', sub.name)} className="rounded text-primary focus:ring-0" />
                              <span className="text-xs font-medium text-gray-600 truncate">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Classes Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 tracking-wider">Teaching Classes</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pb-1">
                  {availableClasses.map(cls => (
                    <button key={cls} type="button" onClick={() => handleCheckboxChange('classes', cls)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${formData.classes?.includes(cls) ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 active:bg-gray-100'}`}>
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              <button disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold mt-6 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mb-4">
                {loading ? <FaSpinner className="animate-spin" size={16} /> : (editingId ? 'Save Changes' : 'Create Teacher Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};