import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { FaPlus, FaEdit, FaTrash, FaBan, FaSearch, FaTimes, FaSpinner, FaFilter, FaChevronDown, FaUserGraduate } from 'react-icons/fa';

export const Students = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    class_name: '',
    gender: '',
    dob: '',
    parent_name: '',
    phone: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsInitialLoading(true);
    try {
      const { data: classes } = await supabase.from('classes').select('name');
      if (classes) setAvailableClasses(classes.map(c => c.name));
      await fetchStudents();
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setStudents(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name,
            class_name: formData.class_name,
            gender: formData.gender,
            dob: formData.dob,
            parent_name: formData.parent_name,
            phone: formData.phone
          })
          .eq('id', editingId);
        if (error) throw error;
        Swal.fire('Updated!', 'Student record updated.', 'success');
      } else {
        const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
        if (seqErr) throw seqErr;

        const internalEmail = `${nextId.toLowerCase()}@school.internal`;
        const initialPassword = formData.name.split(' ')[0].toLowerCase();

        const { data: auth, error: authErr } = await supabase.auth.signUp({
          email: internalEmail,
          password: initialPassword,
        });

        if (authErr) throw authErr;

        const { error: dbErr } = await supabase.from('students').insert([{
          id: auth.user.id,
          student_id: nextId,
          name: formData.name,
          class_name: formData.class_name,
          gender: formData.gender,
          dob: formData.dob,
          parent_name: formData.parent_name,
          phone: formData.phone,
          email: internalEmail,
          is_active: true
        }]);

        if (dbErr) throw dbErr;

        Swal.fire({
          title: 'Enrollment Successful!',
          html: `
            <div class="text-left bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
              <p class="text-sm"><strong>Student ID:</strong> <code class="text-primary font-bold">${nextId}</code></p>
              <p class="text-sm"><strong>Initial Password:</strong> <code class="text-primary font-bold">${initialPassword}</code></p>
            </div>
          `,
          icon: 'success'
        });
      }

      setShowAddModal(false);
      setFormData({ name: '', class_name: '', gender: '', dob: '', parent_name: '', phone: '' });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus, studentName) => {
    const action = currentStatus ? 'suspend' : 'activate';
    const result = await Swal.fire({
      title: 'Confirm Action',
      text: `Are you sure you want to ${action} ${studentName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action} them`
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
      if (!error) { fetchStudents(); Swal.fire('Done!', `Student is now ${action}ed.`, 'success'); }
    }
  };

  const handleDelete = async (id, studentName) => {
    const result = await Swal.fire({
      title: 'Wait! Delete Student?',
      text: `This will permanently remove ${studentName}.`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Permanently'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (!error) { setStudents(students.filter(s => s.id !== id)); Swal.fire('Deleted', 'Record removed.', 'success'); }
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && s.is_active) || 
                          (filterStatus === 'inactive' && !s.is_active);
    return matchesSearch && matchesStatus;
  });

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage enrollment and student profiles</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({name:'', class_name:'', gender:'', dob:'', parent_name:'', phone:''}); setShowAddModal(true); }}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <FaPlus size={14} /> Add Student
        </button>
      </div>

      {/* Stats Summary - Mobile Only */}
      <div className="grid grid-cols-2 gap-3 mb-4 md:hidden">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{students.length}</p>
          <p className="text-xs text-gray-600">Total Students</p>
        </div>
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{students.filter(s => s.is_active).length}</p>
          <p className="text-xs text-gray-600">Active</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </div>
        
        {/* Mobile Filter Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <FaFilter size={12} />
              {filterStatus === 'all' ? 'All' : filterStatus === 'active' ? 'Active' : 'Suspended'}
            </span>
            <FaChevronDown size={12} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
              <button onClick={() => { setFilterStatus('all'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-t-xl">All Status</button>
              <button onClick={() => { setFilterStatus('active'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50">Active</button>
              <button onClick={() => { setFilterStatus('inactive'); setShowFilterDropdown(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-b-xl">Suspended</button>
            </div>
          )}
        </div>

        {/* Desktop Filter */}
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="hidden md:block px-4 py-3 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
      </div>

      {/* Loading State */}
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
          <FaSpinner className="animate-spin text-primary mb-4" size={40} />
          <p className="text-gray-500">Loading students...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-4 px-6">ID</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6">Parent</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">
                        <FaUserGraduate className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No students found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-6 text-xs font-mono font-bold text-primary">{s.student_id}</td>
                        <td className="py-3 px-6 font-medium text-gray-800">{s.name}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{s.class_name}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{s.parent_name || '-'}</td>
                        <td className="py-3 px-6 text-sm text-gray-600">{s.phone || '-'}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => toggleStatus(s.id, s.is_active, s.name)} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg" title="Suspend/Activate">
                              <FaBan size={14} />
                            </button>
                            <button onClick={() => { setEditingId(s.id); setFormData(s); setShowAddModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit">
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => handleDelete(s.id, s.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
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
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <FaUserGraduate className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                    onClick={() => toggleExpand(s.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-800">{s.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{s.student_id}</div>
                      <div className="text-xs text-gray-500 mt-1">Class: {s.class_name}</div>
                    </div>
                    <FaChevronDown className={`text-gray-400 transition-transform ${expandedCard === s.id ? 'rotate-180' : ''}`} />
                  </div>

                  {expandedCard === s.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                      <div className="text-sm text-gray-600">Parent: {s.parent_name || 'Not set'}</div>
                      <div className="text-sm text-gray-600">Phone: {s.phone || 'Not set'}</div>
                      <div className="text-sm text-gray-600">Gender: {s.gender || 'Not set'}</div>
                      <div className="text-sm text-gray-600">DOB: {s.dob || 'Not set'}</div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => toggleStatus(s.id, s.is_active, s.name)} className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-medium">
                          <FaBan size={12} className="inline mr-1" /> {s.is_active ? 'Suspend' : 'Activate'}
                        </button>
                        <button onClick={() => { setEditingId(s.id); setFormData(s); setShowAddModal(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium">
                          <FaEdit size={12} className="inline mr-1" /> Edit
                        </button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
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

      {/* Add/Edit Modal - Mobile Bottom Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl mx-auto p-6 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-2">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter full name" />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Class *</label>
                <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})}>
                  <option value="">Select Class</option>
                  {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Gender *</label>
                <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth *</label>
                <input required type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Parent/Guardian Name *</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} placeholder="Enter parent name" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Parent Phone *</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Enter phone number" />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-semibold mt-4 transition-all">
                {loading ? <FaSpinner className="animate-spin mx-auto" size={18} /> : (editingId ? 'Update Student' : 'Add Student')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};