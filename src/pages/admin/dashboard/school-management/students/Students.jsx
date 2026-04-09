import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaEdit, FaTrash, FaBan, FaSearch, FaTimes, 
  FaSpinner, FaFilter, FaChevronDown, FaUserGraduate, FaEye,
  FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaVenusMars,
  FaIdCard, FaGraduationCap, FaChevronRight
} from 'react-icons/fa';
import { logActivity } from '../../../../../db';

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
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    class_name: '',
    gender: '',
    dob: '',
    parent_name: '',
    phone: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    address: '',
    state_of_origin: '',
    lga: ''
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

  const handleQuickView = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    
    if (!window.navigator.onLine) {
      return Swal.fire({
        title: 'No Internet',
        text: 'Please check your connection before enrolling a student.',
        icon: 'warning'
      });
    }

    setLoading(true);

    try {
      const studentPayload = {
        name: formData.name,
        class_name: formData.class_name,
        gender: formData.gender,
        dob: formData.dob,
        parent_name: formData.parent_name,
        phone: formData.phone,
        enrollment_date: formData.enrollment_date,
        address: formData.address,
        state_of_origin: formData.state_of_origin,
        lga: formData.lga
      };

      if (editingId) {
        // UPDATE LOGIC
        const { error } = await supabase
          .from('students')
          .update(studentPayload)
          .eq('id', editingId);
        
        if (error) throw error;
        await logActivity(`Updated details for student: ${formData.name}`, 'student');
        Swal.fire('Updated!', 'Student record updated.', 'success');
      } else {
        
        const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
        if (seqErr) throw seqErr;

        const cleanId = nextId.replace(/\//g, '').toLowerCase();
        const internalEmail = `${cleanId}@school.internal`;
        const firstName = formData.name.split(' ')[0].toLowerCase();
        const initialPassword = `${firstName}123`;

      
        const { data: auth, error: authErr } = await supabase.auth.signUp({
          email: internalEmail,
          password: initialPassword,
        });

        if (authErr) {
          if (authErr.message.includes("already registered")) {
            throw new Error(`This Student ID (${nextId}) already has an account. Please contact admin.`);
          }
          throw authErr;
        }

        
        const { error: dbErr } = await supabase.from('students').insert([{
          ...studentPayload,
          id: auth.user.id, 
          student_id: nextId, 
          email: internalEmail,
          is_active: true
        }]);

        if (dbErr) {
     
          console.error("Auth Success / DB Failure:", dbErr);
          throw new Error(`Account created, but database profile failed: ${dbErr.message}`);
        }

        await logActivity(`Newly enrolled student: ${formData.name} (${nextId})`, 'student');
        Swal.fire({
          title: 'Enrollment Successful!',
          html: `
            <div class="text-left bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
              <p class="text-sm"><strong>Student ID:</strong> <code class="text-primary font-bold">${nextId}</code></p>
              <p class="text-sm"><strong>Login Email:</strong> <code class="text-gray-600">${internalEmail}</code></p>
              <p class="text-sm"><strong>Initial Password:</strong> <code class="text-primary font-bold">${initialPassword}</code></p>
            </div>
          `,
          icon: 'success'
        });
      }

      
      setShowAddModal(false);
      setFormData({ 
        name: '', class_name: '', gender: '', dob: '', parent_name: '', phone: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        address: '', state_of_origin: '', lga: ''
      });
      setEditingId(null);
      fetchStudents();

    } catch (err) {
     
      let errorMessage = err.message;
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("network")) {
        errorMessage = "Network error. Please check your signal and try again.";
      }

      Swal.fire({
        title: 'Action Failed',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
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
      confirmButtonText: `Yes, ${action}`
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
      if (!error) { fetchStudents(); Swal.fire('Done!', `Student is now ${action}ed.`, 'success'); }
    }
  };

  const handleDelete = async (id, studentName) => {
    const result = await Swal.fire({
      title: 'Delete Student?',
      text: `Remove ${studentName} permanently?`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete'
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
      {/* Header with Add Button - Visible on all devices */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage enrollment and student profiles</p>
        </div>
        <button
          onClick={() => { 
            setEditingId(null); 
            setFormData({
              name:'', class_name:'', gender:'', dob:'', parent_name:'', phone:'',
              enrollment_date: new Date().toISOString().split('T')[0],
              address: '', state_of_origin: '', lga: ''
            }); 
            setShowAddModal(true); 
          }}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all w-full sm:w-auto"
        >
          <FaPlus size={14} /> Add Student
        </button>
      </div>

      {/* Stats Cards - Mobile Only */}
      <div className="grid grid-cols-2 gap-3 mb-5 md:hidden">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{students.length}</p>
          <p className="text-xs text-gray-600 font-medium">Total Students</p>
        </div>
        <div className="bg-linear-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{students.filter(s => s.is_active).length}</p>
          <p className="text-xs text-gray-600 font-medium">Active</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>
        
        {/* Mobile Filter Dropdown */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2">
              <FaFilter size={12} />
              {filterStatus === 'all' ? 'All Status' : filterStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
            <FaChevronDown size={10} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
          </button>
          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10">
              {['all', 'active', 'inactive'].map(opt => (
                <button
                  key={opt}
                  onClick={() => { setFilterStatus(opt); setShowFilterDropdown(false); }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl ${filterStatus === opt ? 'text-primary font-semibold bg-blue-50' : 'text-gray-600'}`}
                >
                  {opt === 'all' ? 'All Status' : opt === 'active' ? 'Active Only' : 'Inactive Only'}
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
        <div className="flex flex-col items-center justify-center py-20">
          <FaSpinner className="animate-spin text-primary text-4xl mb-3" />
          <p className="text-gray-500">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <FaUserGraduate className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No students found</p>
          <button onClick={() => setShowAddModal(true)} className="mt-3 text-primary font-medium">+ Add your first student</button>
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
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Class</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-6 text-xs font-mono font-bold text-primary">{s.student_id}</td>
                      <td className="py-3 px-6 font-medium text-gray-800">{s.name}</td>
                      <td className="py-3 px-6 text-sm text-gray-600">{s.class_name}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {s.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleQuickView(s)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Quick View">
                            <FaEye size={14} />
                          </button>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                  onClick={() => toggleExpand(student.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{student.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {student.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FaIdCard size={10} />
                      <span className="font-mono">{student.student_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <FaGraduationCap size={10} />
                      <span>{student.class_name}</span>
                    </div>
                  </div>
                  <FaChevronRight className={`text-gray-400 transition-transform ${expandedCard === student.id ? 'rotate-90' : ''}`} />
                </div>

                {expandedCard === student.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Parent/Guardian</p>
                      <p className="font-medium text-gray-800">{student.parent_name || 'N/A'}</p>
                      {student.phone && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <FaPhone size={12} className="text-gray-400" />
                          <span className="text-gray-600">{student.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt size={12} className="text-gray-400" />
                        <span className="text-gray-600">DOB: {student.dob || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaVenusMars size={12} className="text-gray-400" />
                        <span className="text-gray-600">{student.gender || 'N/A'}</span>
                      </div>
                    </div>

                    {student.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <FaMapMarkerAlt size={12} className="text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{student.address}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => handleQuickView(student)} className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                        <FaEye size={12} /> View
                      </button>
                      <button onClick={() => toggleStatus(student.id, student.is_active, student.name)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${student.is_active ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                        <FaBan size={12} /> {student.is_active ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => { setEditingId(student.id); setFormData(student); setShowAddModal(true); }} className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium flex items-center justify-center gap-1">
                        <FaEdit size={12} /> Edit
                      </button>
                      <button onClick={() => handleDelete(student.id, student.name)} className="py-2.5 px-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick View Modal */}
      {showViewModal && viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={18} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="text-center pb-3 border-b">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <FaUserGraduate className="text-primary text-2xl" />
                </div>
                <h3 className="font-bold text-lg">{viewingStudent.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{viewingStudent.student_id}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Class</span>
                  <span className="text-sm font-medium">{viewingStudent.class_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Gender</span>
                  <span className="text-sm font-medium">{viewingStudent.gender || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Date of Birth</span>
                  <span className="text-sm font-medium">{viewingStudent.dob || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Parent</span>
                  <span className="text-sm font-medium">{viewingStudent.parent_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="text-sm font-medium">{viewingStudent.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-gray-500">Login Email</span>
                  <span className="text-sm font-mono text-primary">{viewingStudent.email || 'N/A'}</span>
                </div>
              </div>

              <button onClick={() => setShowViewModal(false)} className="w-full bg-primary text-white py-3 rounded-xl font-semibold mt-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl mx-auto p-5 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-2">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Student' : 'New Enrollment'}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter full name" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Class *</label>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})}>
                    <option value="">Select</option>
                    {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Gender *</label>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Date of Birth *</label>
                  <input required type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Enrollment Date</label>
                  <input type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.enrollment_date} onChange={e => setFormData({...formData, enrollment_date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">State of Origin</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.state_of_origin} onChange={e => setFormData({...formData, state_of_origin: e.target.value})} placeholder="e.g., Lagos" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">L.G.A</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.lga} onChange={e => setFormData({...formData, lga: e.target.value})} placeholder="Local Govt Area" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Address</label>
                <textarea className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" rows="2"
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Home address" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Parent Name *</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} placeholder="Parent/Guardian" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Parent Phone *</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone number" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">
                {loading ? <FaSpinner className="animate-spin" size={18} /> : (editingId ? 'Update Student' : 'Enroll Student')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};