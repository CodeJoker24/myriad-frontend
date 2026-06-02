import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; 
import { supabase } from '../../../db';
import Swal from 'sweetalert2';
import { logActivity } from '../../../db';
import { 
  FaUserGraduate, FaPhone, FaWhatsapp, FaSpinner, 
  FaUsers, FaEdit, FaTimes, FaSave, FaEnvelope, 
  FaMapMarkerAlt, FaGraduationCap, FaPlus,
  FaChevronRight, FaSearch, FaFilter, FaEye,
  FaVenusMars, FaCalendarAlt, FaIdCard, FaDownload,
  FaAddressCard, FaGlobe, FaMapPin, FaBookOpen
} from 'react-icons/fa';
import Papa from 'papaparse';

const MyClass = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [isMobile, setIsMobile] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const [newStudentData, setNewStudentData] = useState({
    name: '', gender: '', dob: '', parent_name: '', phone: '', address: '', state_of_origin: '', lga: ''
  });
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewMode(mobile ? 'grid' : 'table');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        setFilteredStudents(classList || []);
      }
    } catch (err) {
      console.error("Error fetching class:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStudentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const targetClassName = teacherProfile?.is_class_teacher_of;
    if (!targetClassName) {
      e.target.value = null;
      Swal.fire('Error', 'You must be assigned to a class to run bulk uploads.', 'error');
      return;
    }

    setBulkLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        setBulkProgress({ current: 0, total: rows.length });

        let successCount = 0;
        let failureCount = 0;
        let errorLog = [];

        const tempSupabase = createClient(
          import.meta.env.VITE_SUPABASE_URL, 
          import.meta.env.VITE_SUPABASE_ANON_KEY, 
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          }
        );

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setBulkProgress({ current: i + 1, total: rows.length });

          try {
            const rawName = row.FullName?.trim();
            const rawGender = row.Gender?.trim();
            const rawDob = row.DOB?.trim();
            const rawParentName = row.ParentName?.trim();
            const rawPhone = row.ParentPhone?.trim();
            const rawStateOfOrigin = row.StateOfOrigin?.trim() || '';
            const rawLga = row.LGA?.trim() || '';
            const rawAddress = row.Address?.trim() || '';

            if (!rawName) throw new Error("Full name missing");
            if (!rawGender) throw new Error("Gender missing");
            if (!rawDob) throw new Error("Date of Birth missing");
            if (!rawParentName) throw new Error("Parent name missing");
            if (!rawPhone) throw new Error("Parent phone missing");

            const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
            if (seqErr) throw seqErr;

            const cleanId = nextId.replace(/\//g, '').toLowerCase();
            const internalEmail = `${cleanId}@school.internal`;
            const firstName = rawName.split(' ')[0].toLowerCase();
            const initialPassword = `${firstName}123`;

            const { data: auth, error: authErr } = await tempSupabase.auth.signUp({
              email: internalEmail,
              password: initialPassword,
              options: { data: { role: 'student' } }
            });

            if (authErr) throw authErr;

            const { error: dbErr } = await supabase.from('students').insert([{
              id: auth.user.id,
              student_id: nextId,
              name: rawName,
              gender: rawGender,
              dob: rawDob,
              parent_name: rawParentName,
              phone: rawPhone,
              state_of_origin: rawStateOfOrigin,
              lga: rawLga,
              address: rawAddress,
              email: internalEmail,
              class_name: targetClassName,
              enrollment_date: new Date().toISOString().split('T')[0],
              is_active: true
            }]);

            if (dbErr) throw dbErr;

            await logActivity(`Teacher ${teacherProfile.name} bulk imported student: ${rawName} (${nextId})`, 'student');
            successCount++;

          } catch (err) {
            failureCount++;
            errorLog.push(`Row ${i + 2}: ${err.message}`);
          }
        }

        setBulkLoading(false);
        e.target.value = null;

        Swal.fire({
          title: 'Bulk Upload Complete',
          html: `
            <div class="text-left space-y-2">
              <p class="text-green-600">Success: ${successCount} students</p>
              <p class="text-red-600">Failed: ${failureCount}</p>
              ${errorLog.length > 0 ? `<div class="mt-2 pt-2 border-t max-h-32 overflow-y-auto text-xs text-red-500">${errorLog.map(log => `<p>• ${log}</p>`).join('')}</div>` : ''}
            </div>
          `,
          icon: failureCount === 0 ? 'success' : 'info'
        });

        fetchMyClass();
      }
    });
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,FullName,Gender,DOB,ParentName,ParentPhone,StateOfOrigin,LGA,Address\nTunde Bakare,Male,2014-06-18,Mr. Bakare,09023456789,Ogun,Abeokuta South,45 Pansheke Road\nChinyere Nwachukwu,Female,2015-11-05,Dr. Nwachukwu,08098765432,Enugu,Nsukka,12 University Way";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "classroom_bulk_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!teacherProfile?.is_class_teacher_of) {
      Swal.fire('Error', 'You must be assigned to a class to enroll students.', 'error');
      return;
    }

    setUpdateLoading(true);
    try {
      const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
      if (seqErr) throw seqErr;

      const cleanId = nextId.replace(/\//g, '').toLowerCase();
      const internalEmail = `${cleanId}@school.internal`;
      const firstName = newStudentData.name.trim().split(' ')[0].toLowerCase();
      const initialPassword = `${firstName}123`;

      const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL, 
        import.meta.env.VITE_SUPABASE_ANON_KEY, 
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );

      const { data: auth, error: authErr } = await tempSupabase.auth.signUp({
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
      Swal.fire('Error', 'Student name cannot be empty', 'warning');
      return;
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

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterGender('all');
  };

  const getStats = () => {
    const male = filteredStudents.filter(s => s.gender === 'Male').length;
    const female = filteredStudents.filter(s => s.gender === 'Female').length;
    return { male, female, total: filteredStudents.length };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
        <p className="text-gray-500">Loading your class roster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-linear-to-r from-primary to-blue-700 rounded-2xl p-6 text-white shadow-lg">
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
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-xl font-bold">{students.length}</p>
                  <p className="text-[10px] font-semibold">Active</p>
                </div>
                
                {teacherProfile?.is_class_teacher_of && (
                  <div className="flex items-center gap-2 bg-black/10 rounded-xl px-2 py-1">
                    <button onClick={downloadSampleCSV} className="text-xs text-white/80 hover:text-white px-2 py-1">Template</button>
                    <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${bulkLoading ? 'opacity-50' : ''}`}>
                      {bulkLoading ? <FaSpinner className="animate-spin" /> : <FaBookOpen size={12} />}
                      {bulkLoading ? `${bulkProgress.current}/${bulkProgress.total}` : 'Import CSV'}
                      <input type="file" accept=".csv" className="hidden" onChange={handleBulkStudentUpload} disabled={bulkLoading} />
                    </label>
                  </div>
                )}

                <button onClick={() => setShowAddModal(true)} className="bg-white text-primary px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-gray-100 transition shadow-md">
                  <FaPlus size={12} /> Enroll
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border">
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-xl font-bold text-blue-600">{stats.male}</p>
            <p className="text-[10px] text-blue-600">Male</p>
          </div>
          <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-100">
            <p className="text-xl font-bold text-pink-600">{stats.female}</p>
            <p className="text-[10px] text-pink-600">Female</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search by name, ID, or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2.5 rounded-lg flex items-center gap-2 transition ${showFilters ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 border'}`}>
              <FaFilter size={14} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-wrap gap-3">
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border text-sm">
                  <option value="all">All Genders</option>
                  <option value="Male">Male Only</option>
                  <option value="Female">Female Only</option>
                </select>
                {(searchTerm || filterGender !== 'all') && (
                  <button onClick={clearFilters} className="text-xs text-red-500 font-medium px-3 py-2">Clear</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table */}
        {viewMode === 'table' && !isMobile && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Parent</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-12 text-gray-500">No students found</td></tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-4 text-xs font-mono font-bold text-primary">{student.student_id}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">{student.name}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${student.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                            {student.gender || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{student.parent_name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{student.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => { setSelectedStudent(student); setShowEditModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <FaEdit size={14} />
                            </button>
                            {student.phone && (
                              <>
                                <a href={`tel:${student.phone}`} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><FaPhone size={14} /></a>
                                <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><FaWhatsapp size={14} /></a>
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
            {filteredStudents.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t text-right">
                <p className="text-xs text-gray-500">Showing {filteredStudents.length} of {students.length}</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile Cards */}
        {(viewMode === 'grid' || isMobile) && (
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <FaUserGraduate className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50" onClick={() => toggleExpand(student.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{student.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {student.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaIdCard size={10} />
                        <span className="font-mono">{student.student_id}</span>
                      </div>
                    </div>
                    <FaChevronRight className={`text-gray-400 transition-transform ${expandedCard === student.id ? 'rotate-90' : ''}`} />
                  </div>

                  {expandedCard === student.id && (
                    <div className="px-4 pb-4 pt-2 border-t space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Parent/Guardian</p>
                        <p className="font-medium text-gray-800">{student.parent_name || 'N/A'}</p>
                        {student.phone && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaPhone size={10} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{student.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">DOB</p>
                          <p className="text-sm font-medium">{student.dob || 'N/A'}</p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Gender</p>
                          <p className="text-sm font-medium">{student.gender || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">State</p>
                          <p className="text-xs">{student.state_of_origin || 'N/A'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">LGA</p>
                          <p className="text-xs">{student.lga || 'N/A'}</p>
                        </div>
                      </div>

                      {student.address && (
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt size={10} className="text-gray-400 mt-0.5" />
                          <span className="text-xs text-gray-600">{student.address}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => { setSelectedStudent(student); setShowEditModal(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                          <FaEdit size={12} /> Edit
                        </button>
                        {student.phone && (
                          <>
                            <a href={`tel:${student.phone}`} className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg"><FaPhone size={12} /></a>
                            <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="py-2 px-3 bg-gray-100 text-gray-600 rounded-lg"><FaWhatsapp size={14} /></a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {filteredStudents.length > 0 && (
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-400">{filteredStudents.length} of {students.length} students</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Edit Student</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FaTimes size={18} /></button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Full Name</label>
                <input className="w-full p-2.5 bg-gray-50 rounded-lg border focus:border-primary outline-none" value={selectedStudent?.name || ''} onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">State of Origin</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={selectedStudent?.state_of_origin || ''} onChange={(e) => setSelectedStudent({...selectedStudent, state_of_origin: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">LGA</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={selectedStudent?.lga || ''} onChange={(e) => setSelectedStudent({...selectedStudent, lga: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Parent Name</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={selectedStudent?.parent_name || ''} onChange={(e) => setSelectedStudent({...selectedStudent, parent_name: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={selectedStudent?.phone || ''} onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})} /></div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Address</label>
                <textarea rows="2" className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none resize-none" value={selectedStudent?.address || ''} onChange={(e) => setSelectedStudent({...selectedStudent, address: e.target.value})} />
              </div>
              <button type="submit" disabled={updateLoading} className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold mt-4">
                {updateLoading ? <FaSpinner className="animate-spin" /> : <><FaSave size={14} /> Save</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">Enroll Student</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600"><FaTimes size={18} /></button>
            </div>
            <form onSubmit={handleEnrollStudent} className="p-5 space-y-4">
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Full Name *</label><input required className="w-full p-2.5 bg-gray-50 rounded-lg border focus:border-primary outline-none" value={newStudentData.name} onChange={(e) => setNewStudentData({...newStudentData, name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Gender *</label><select required className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={newStudentData.gender} onChange={(e) => setNewStudentData({...newStudentData, gender: e.target.value})}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Date of Birth *</label><input required type="date" className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={newStudentData.dob} onChange={(e) => setNewStudentData({...newStudentData, dob: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">State of Origin</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" placeholder="e.g. Lagos" value={newStudentData.state_of_origin} onChange={(e) => setNewStudentData({...newStudentData, state_of_origin: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">LGA</label><input className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" placeholder="Local Govt Area" value={newStudentData.lga} onChange={(e) => setNewStudentData({...newStudentData, lga: e.target.value})} /></div>
              </div>
              <div><label className="text-xs font-semibold text-gray-500 block mb-1">Address</label><textarea rows="2" className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none resize-none" placeholder="Home address" value={newStudentData.address} onChange={(e) => setNewStudentData({...newStudentData, address: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Parent Name *</label><input required className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={newStudentData.parent_name} onChange={(e) => setNewStudentData({...newStudentData, parent_name: e.target.value})} /></div>
                <div><label className="text-xs font-semibold text-gray-500 block mb-1">Parent Phone *</label><input required className="w-full p-2.5 bg-gray-50 rounded-lg border outline-none" value={newStudentData.phone} onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})} /></div>
              </div>
              <button type="submit" disabled={updateLoading} className="w-full bg-primary text-white py-2.5 rounded-lg font-semibold mt-4">
                {updateLoading ? <FaSpinner className="animate-spin" /> : <><FaPlus size={12} /> Enroll</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyClass;