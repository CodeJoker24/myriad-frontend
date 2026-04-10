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
  address: ''
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
        .single();

      if (tError) throw tError;
      setTeacherProfile(teacher);

      if (teacher.is_class_teacher_of) {
        const { data: classList, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('class_name', teacher.is_class_teacher_of)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (sError) throw sError;
        setStudents(classList);
      }
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

    const handleEnrollStudent = async (e) => {
  e.preventDefault();
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
      name: '',
      gender: '',
      dob: '',
      parent_name: '',
      phone: '',
      address: ''
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
          address: selectedStudent.address
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;
      await logActivity(
        `Teacher ${teacherProfile.name} updated info for ${selectedStudent.name}`, 
        'student'
      );
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Student information updated successfully.',
        confirmButtonColor: '#3B82F6'
      });
      setShowEditModal(false);
      fetchMyClass();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        confirmButtonColor: '#3B82F6'
      });
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
                Form Teacher of <span className="font-bold text-white">{teacherProfile?.is_class_teacher_of}</span>
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
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <FaUserGraduate className="text-5xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Students Yet</h3>
          <p className="text-gray-500">Your class roster is empty. Students will appear here once enrolled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <div 
              key={student.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Card Header */}
              <div 
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(student.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-linear-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-primary">
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

              {/* Expanded Content */}
              {expandedCard === student.id && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4">
                  {/* Parent Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parent/Guardian</p>
                    <p className="font-medium text-gray-800">{student.parent_name || 'Not provided'}</p>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {student.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <FaPhone className="text-gray-400" size={14} />
                        <span className="text-gray-700">{student.phone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <FaEnvelope className="text-gray-400" size={14} />
                        <span className="text-gray-700">{student.email}</span>
                      </div>
                    )}
                    {student.address && (
                      <div className="flex items-center gap-3 text-sm">
                        <FaMapMarkerAlt className="text-gray-400" size={14} />
                        <span className="text-gray-700 line-clamp-1">{student.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => { setSelectedStudent(student); setShowEditModal(true); }}
                      className="flex-1 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
                    >
                      <FaEdit size={14} /> Edit
                    </button>
                    {student.phone && (
                      <a 
                        href={`tel:${student.phone}`} 
                        className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-green-100 hover:text-green-600 transition-colors"
                      >
                        <FaPhone size={14} />
                      </a>
                    )}
                    {student.phone && (
                      <a 
                        href={`https://wa.me/${student.phone}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="py-2.5 px-4 bg-gray-100 text-gray-600 rounded-xl hover:bg-green-100 hover:text-green-500 transition-colors"
                      >
                        <FaWhatsapp size={16} />
                      </a>
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
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Edit Student</h2>
                <p className="text-sm text-gray-500 mt-1">Update student information</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Student Name</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={selectedStudent?.name || ''}
                  onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Parent Name</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={selectedStudent?.parent_name || ''}
                  onChange={(e) => setSelectedStudent({...selectedStudent, parent_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Contact Phone</label>
                <input 
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={selectedStudent?.phone || ''}
                  onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={updateLoading}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {updateLoading ? <FaSpinner className="animate-spin" /> : <><FaSave /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal (Moved outside Edit Modal) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enroll New Student</h2>
                <p className="text-sm text-gray-500 mt-1">Class: <span className="text-primary font-bold">{teacherProfile?.is_class_teacher_of}</span></p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Full Name</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  placeholder="First and Last Name"
                  value={newStudentData.name}
                  onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Gender</label>
                <select 
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={newStudentData.gender}
                  onChange={(e) => setNewStudentData({...newStudentData, gender: e.target.value})}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Date of Birth</label>
                <input 
                  type="date"
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={newStudentData.dob}
                  onChange={(e) => setNewStudentData({...newStudentData, dob: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Parent Name</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={newStudentData.parent_name}
                  onChange={(e) => setNewStudentData({...newStudentData, parent_name: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Phone Number</label>
                <input 
                  required
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary outline-none transition"
                  value={newStudentData.phone}
                  onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={updateLoading}
                className="md:col-span-2 w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
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