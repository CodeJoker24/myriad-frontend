import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import Swal from 'sweetalert2';
import { logActivity } from '../../../db';
import { 
  FaUserGraduate, FaPhone, FaWhatsapp, FaSpinner, 
  FaUsers, FaEdit, FaTimes, FaSave, FaEnvelope, 
  FaMapMarkerAlt, FaGraduationCap, FaPlus,
  FaChevronRight
} from 'react-icons/fa';

const MyClass = () => {
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
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
        console.warn("No teacher profile found for this ID.");
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
      await logActivity(
        `Teacher ${teacherProfile.name} updated info for ${selectedStudent.name}`, 
        'student'
      );
      
      Swal.fire({ icon: 'success', title: 'Updated!', text: 'Information saved.', confirmButtonColor: '#3B82F6' });
      setShowEditModal(false);
      fetchMyClass();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#3B82F6' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleExpand = (id) => {
    
    setExpandedCard(expandedCard === id ? null : id);
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-linear-to-r from-primary to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className="text-2xl opacity-80" />
                <span className="text-sm font-semibold uppercase tracking-wider opacity-80">Class Roster</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">My Classroom</h1>
              <p className="text-white/80 mt-2">
                Form Teacher of <span className="font-bold text-white">{teacherProfile?.is_class_teacher_of || 'Unassigned'}</span>
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider">Active Students</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 md:mt-0 bg-white text-primary px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-lg active:scale-95"
            >
              <FaPlus size={14} /> New Enrollment
            </button>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      {students.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <FaUserGraduate className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Yet</h3>
          <p className="text-gray-500">Your class roster is empty. Click "New Enrollment" to add students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {students.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
             
              <div className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleExpand(student.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                    <FaUserGraduate className="text-2xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <FaGraduationCap className="text-gray-400 text-xs" />
                      <span className="text-xs font-mono text-gray-500">{student.student_id}</span>
                    </div>
                  </div>
                  <FaChevronRight className={`text-gray-400 transition-transform duration-300 ${expandedCard === student.id ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded Content - Only shows when this specific card is expanded */}
              {expandedCard === student.id && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parent/Guardian</p>
                    <p className="font-medium text-gray-800">{student.parent_name || 'Not provided'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-blue-50/50 rounded-xl p-4">
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">State of Origin</p>
                      <p className="text-sm font-medium text-gray-800">{student.state_of_origin || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">LGA</p>
                      <p className="text-sm font-medium text-gray-800">{student.lga || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    {student.phone && (
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-400" size={12} />
                        <span className="text-gray-600">{student.phone}</span>
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 mt-0.5" size={12} />
                        <span className="text-gray-600 line-clamp-2">{student.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setSelectedStudent(student); setShowEditModal(true); }} 
                      className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                    {student.phone && (
                      <>
                        <a href={`tel:${student.phone}`} className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-green-100 hover:text-green-600 transition-colors">
                          <FaPhone size={14} />
                        </a>
                        <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-green-500 hover:text-white transition-colors">
                          <FaWhatsapp size={16} />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Student Info</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Full Name</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={selectedStudent?.name || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">State of Origin</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={selectedStudent?.state_of_origin || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, state_of_origin: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">LGA</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={selectedStudent?.lga || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, lga: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Parent Name</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={selectedStudent?.parent_name || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, parent_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Phone</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={selectedStudent?.phone || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})} 
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Address</label>
                <textarea 
                  rows="2" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none" 
                  value={selectedStudent?.address || ''} 
                  onChange={(e) => setSelectedStudent({...selectedStudent, address: e.target.value})} 
                />
              </div>
              <button 
                type="submit" 
                disabled={updateLoading} 
                className="md:col-span-2 w-full bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {updateLoading ? <FaSpinner className="animate-spin" size={18} /> : <><FaSave size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enroll New Student</h2>
                <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">Class: {teacherProfile?.is_class_teacher_of || 'N/A'}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Full Name *</label>
                <input 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  placeholder="First and Last Name" 
                  value={newStudentData.name} 
                  onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Gender *</label>
                <select 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={newStudentData.gender} 
                  onChange={(e) => setNewStudentData({...newStudentData, gender: e.target.value})}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Date of Birth *</label>
                <input 
                  type="date" 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={newStudentData.dob} 
                  onChange={(e) => setNewStudentData({...newStudentData, dob: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">State of Origin</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  placeholder="e.g. Lagos" 
                  value={newStudentData.state_of_origin} 
                  onChange={(e) => setNewStudentData({...newStudentData, state_of_origin: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">LGA</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  placeholder="Local Govt Area" 
                  value={newStudentData.lga} 
                  onChange={(e) => setNewStudentData({...newStudentData, lga: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Parent Name *</label>
                <input 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={newStudentData.parent_name} 
                  onChange={(e) => setNewStudentData({...newStudentData, parent_name: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Phone Number *</label>
                <input 
                  required 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition" 
                  value={newStudentData.phone} 
                  onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})} 
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Home Address</label>
                <textarea 
                  rows="2" 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none" 
                  placeholder="Street address, City" 
                  value={newStudentData.address} 
                  onChange={(e) => setNewStudentData({...newStudentData, address: e.target.value})} 
                />
              </div>

              <button 
                type="submit" 
                disabled={updateLoading} 
                className="md:col-span-2 w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {updateLoading ? <FaSpinner className="animate-spin" size={18} /> : <><FaPlus size={16} /> Complete Enrollment</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClass;