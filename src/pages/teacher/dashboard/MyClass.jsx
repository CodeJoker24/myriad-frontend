import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import Swal from 'sweetalert2';
import { logActivity } from '../../../db';
import { 
  FaUserGraduate, FaPhone, FaWhatsapp, FaSpinner, 
  FaUsers, FaEdit, FaTimes, FaSave, FaEnvelope, 
  FaMapMarkerAlt, FaGraduationCap, FaPlus,
  FaChevronRight, FaSearch, FaFilter, FaDownload,
  FaVenusMars, FaCalendarAlt, FaIdCard
} from 'react-icons/fa';

const MyClass = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    gender: '',
    dob: '',
    parent_name: '',
    phone: '',
    address: '',
    state_of_origin: '', 
    lga: ''
  });

  useEffect(() => {
    fetchMyClass();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filterGender, students]);

  const filterStudents = () => {
    let filtered = [...students];
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterGender !== 'all') {
      filtered = filtered.filter(s => s.gender === filterGender);
    }
    
    setFilteredStudents(filtered);
  };

  const fetchMyClass = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('name, is_class_teacher_of')
        .eq('id', user.id)
        .maybeSingle(); 

      if (tError) throw tError;

      if (!teacher) {
        setTeacherProfile(null);
        return; 
      }

      setTeacherProfile(teacher);

      if (teacher.is_class_teacher_of) {
        const { data: classList, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('class_name', teacher.is_class_teacher_of)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (sError) throw sError;
        setStudents(classList || []);
        setFilteredStudents(classList || []);
      }
    } catch (err) {
      console.error("Error fetching class:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!teacherProfile?.is_class_teacher_of) {
        return Swal.fire('Error', 'You must be assigned to a class to enroll students.', 'error');
    }

    setUpdateLoading(true);
    try {
      const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
      if (seqErr) throw seqErr;

      const cleanId = nextId.replace(/\//g, '').toLowerCase();
      const internalEmail = `${cleanId}@school.internal`;
      const firstName = newStudentData.name.trim().split(' ')[0].toLowerCase();
      const initialPassword = `${firstName}123`;

      const { data: auth, error: authErr } = await supabase.auth.signUp({
        email: internalEmail,
        password: initialPassword,
        options: { data: { role: 'student' } }
      });

      if (authErr) throw authErr;

      const { error: dbErr } = await supabase.from('students').insert([{
        ...newStudentData,
        id: auth.user.id,
        student_id: nextId,
        email: internalEmail,
        class_name: teacherProfile.is_class_teacher_of, 
        enrollment_date: new Date().toISOString().split('T')[0],
        is_active: true
      }]);

      if (dbErr) throw dbErr;

      await logActivity(`Teacher ${teacherProfile.name} enrolled new student: ${newStudentData.name}`, 'student');

      Swal.fire('Success!', `Student enrolled with ID: ${nextId}`, 'success');
      setNewStudentData({
        name: '', gender: '', dob: '', parent_name: '',
        phone: '', address: '', state_of_origin: '', lga: ''
      });
      setShowAddModal(false);
      fetchMyClass();
    } catch (err) {
      Swal.fire('Enrollment Failed', err.message, 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent.name.trim()) {
      return Swal.fire('Error', 'Student name cannot be empty', 'warning');
    }
    setUpdateLoading(true);
    
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: selectedStudent.name,
          parent_name: selectedStudent.parent_name,
          phone: selectedStudent.phone,
          address: selectedStudent.address,
          state_of_origin: selectedStudent.state_of_origin, 
          lga: selectedStudent.lga,
          gender: selectedStudent.gender,                   
          dob: selectedStudent.dob
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;
      await logActivity(`Teacher ${teacherProfile.name} updated info for ${selectedStudent.name}`, 'student');
      
      Swal.fire({ icon: 'success', title: 'Updated!', text: 'Information saved.', confirmButtonColor: '#3B82F6' });
      setShowEditModal(false);
      fetchMyClass();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3B82F6' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStats = () => {
    const male = filteredStudents.filter(s => s.gender === 'Male').length;
    const female = filteredStudents.filter(s => s.gender === 'Female').length;
    return { male, female, total: filteredStudents.length };
  };

  const stats = getStats();

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-primary text-5xl mb-4" />
        <p className="text-gray-500 font-medium">Loading your class roster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="bg-linear-to-r from-primary to-blue-700 rounded-2xl p-5 md:p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-xl opacity-80" />
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Class Roster</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold">My Classroom</h1>
                <p className="text-white/80 text-sm mt-1">
                  Form Teacher of <span className="font-bold text-white">{teacherProfile?.is_class_teacher_of || 'Unassigned'}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center">
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Students</p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-md active:scale-95 text-sm"
                >
                  <FaPlus size={14} /> Enroll
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-[10px] text-gray-500 font-medium">Total</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-xl font-bold text-blue-600">{stats.male}</p>
            <p className="text-[10px] text-blue-600 font-medium">Male</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-100">
            <p className="text-xl font-bold text-pink-600">{stats.female}</p>
            <p className="text-[10px] text-pink-600 font-medium">Female</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by name, ID, or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
            >
              <FaFilter size={14} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex flex-wrap gap-3">
                <select 
                  className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {(searchTerm || filterGender !== 'all') && (
                  <button onClick={clearFilters} className="text-xs text-red-500 font-medium px-3 py-2">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Students Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">DOB</th>
                  <th className="py-3 px-4">Parent Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-500">
                      <FaUserGraduate className="text-4xl mx-auto mb-2 text-gray-300" />
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono font-bold text-primary">{student.student_id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{student.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${student.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {student.gender || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.dob || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.parent_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{student.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedStudent(student); setShowEditModal(true); }} 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </button>
                          {student.phone && (
                            <>
                              <a href={`tel:${student.phone}`} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Call">
                                <FaPhone size={14} />
                              </a>
                              <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                                <FaWhatsapp size={14} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <FaUserGraduate className="text-4xl text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{student.name}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${student.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                          {student.gender || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">{student.student_id}</p>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => { setSelectedStudent(student); setShowEditModal(true); }} 
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <FaEdit size={14} />
                      </button>
                      {student.phone && (
                        <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                          <FaWhatsapp size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt size={12} className="text-gray-400" />
                      <span className="text-gray-600">{student.dob || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaIdCard size={12} className="text-gray-400" />
                      <span className="text-gray-600">ID: {student.student_id}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Parent</p>
                    <p className="font-medium text-gray-800">{student.parent_name || 'N/A'}</p>
                    {student.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <FaPhone size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-600">{student.phone}</span>
                      </div>
                    )}
                  </div>

                  {student.address && (
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <FaMapMarkerAlt size={10} className="text-gray-400 mt-0.5" />
                      <span className="line-clamp-2">{student.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Result Count */}
        {filteredStudents.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Showing {filteredStudents.length} of {students.length} students
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal (same as before) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Student Info</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Full Name</label>
                <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary" 
                  value={selectedStudent?.name || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">State of Origin</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={selectedStudent?.state_of_origin || ''} 
                    onChange={(e) => setSelectedStudent({...selectedStudent, state_of_origin: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">LGA</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={selectedStudent?.lga || ''} 
                    onChange={(e) => setSelectedStudent({...selectedStudent, lga: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Parent Name</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={selectedStudent?.parent_name || ''} 
                    onChange={(e) => setSelectedStudent({...selectedStudent, parent_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phone</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={selectedStudent?.phone || ''} 
                    onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Address</label>
                <textarea rows="2" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                  value={selectedStudent?.address || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, address: e.target.value})} 
                />
              </div>
              <button type="submit" disabled={updateLoading} className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {updateLoading ? <FaSpinner className="animate-spin" size={18} /> : <><FaSave size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal (same as before) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Enroll New Student</h2>
                <p className="text-xs text-gray-500">Class: {teacherProfile?.is_class_teacher_of || 'N/A'}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handleEnrollStudent} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Full Name *</label>
                <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                  value={newStudentData.name} onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Gender *</label>
                  <select required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.gender} onChange={(e) => setNewStudentData({...newStudentData, gender: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Date of Birth *</label>
                  <input type="date" required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.dob} onChange={(e) => setNewStudentData({...newStudentData, dob: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">State of Origin</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.state_of_origin} onChange={(e) => setNewStudentData({...newStudentData, state_of_origin: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">LGA</label>
                  <input className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.lga} onChange={(e) => setNewStudentData({...newStudentData, lga: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Parent Name *</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.parent_name} onChange={(e) => setNewStudentData({...newStudentData, parent_name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Phone *</label>
                  <input required className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                    value={newStudentData.phone} onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Address</label>
                <textarea rows="2" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                  value={newStudentData.address} onChange={(e) => setNewStudentData({...newStudentData, address: e.target.value})} />
              </div>
              <button type="submit" disabled={updateLoading} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2">
                {updateLoading ? <FaSpinner className="animate-spin" size={18} /> : <><FaPlus size={16} /> Enroll Student</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClass;