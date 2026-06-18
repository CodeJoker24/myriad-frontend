import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { logActivity } from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaUserCheck, FaUserTimes, FaSpinner, 
  FaCalendarAlt, FaChalkboardTeacher, FaSave, FaCheckDouble,
  FaUsers, FaClock, FaChartLine, FaSearch, FaFilter,
  FaUserGraduate, FaVenusMars, FaEye, FaChartBar,
  FaChevronDown, FaChevronUp, FaThLarge, FaList,
  FaSchool, FaCalendarWeek
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

export const TeacherAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTerm, setActiveTerm] = useState('');
  const [activeSession, setActiveSession] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('grid');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSystemContext = async () => {
      try {
        const { data, error } = await supabase
          .from('academic_settings')
          .select('type, value')
          .eq('is_active', true);
        
        if (error) throw error;
        
        if (data) {
          const currentSessionRow = data.find(item => item.type === 'session');
          const currentTermRow = data.find(item => item.type === 'term');
          
          if (currentSessionRow) setActiveSession(currentSessionRow.value);
          if (currentTermRow) {
            // Clean term text just like Result.jsx (e.g., "First Term (2024)" -> "First Term")
            const termName = currentTermRow.value.split(' (')[0];
            setActiveTerm(termName);
          }
        }
      } catch (err) {
        console.error("Context fetch error:", err.message);
      }
    };
    fetchSystemContext();
  }, []);

  useEffect(() => {
    if (activeTerm && activeSession) {
      fetchTeacherAndStudents();
    }
  }, [selectedDate, activeTerm, activeSession]);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, filterStatus, attendanceRecords]);

  const filterRecords = () => {
    let filtered = [...attendanceRecords];
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    setFilteredRecords(filtered);
  };

  // 🌟 FIXED FETCH ENGINE (Matches exactly with column layouts)
  const fetchTeacherAndStudents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('name, is_class_teacher_of')
        .eq('id', user.id)
        .maybeSingle();

      if (tError) throw tError;
      setTeacherProfile(teacher);

      if (teacher?.is_class_teacher_of) {
        const { data: studentData, error: sError } = await supabase
          .from('students')
          .select('id, name, student_id, gender')
          .eq('class_name', teacher.is_class_teacher_of)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (sError) throw sError;

        // 🌟 FIX: Querying 'term_context' instead of 'term_id' to read historical rows correctly!
        const { data: existingAttendance, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate)
          .eq('session_context', activeSession)
          .eq('term_context', activeTerm);

        if (attError) throw attError;

        const merged = studentData.map(student => {
          const record = existingAttendance?.find(a => a.student_id === student.id);
          let dbStatus = record ? record.status : 'Present';
          
          // Normalize matching string formatting
          if (dbStatus.toLowerCase() === 'present') dbStatus = 'Present';
          if (dbStatus.toLowerCase() === 'absent') dbStatus = 'Absent';
          
          return {
            id: student.id,
            name: student.name,
            student_code: student.student_id,
            gender: student.gender,
            status: dbStatus,
            marked_at: record?.created_at
          };
        });
        setAttendanceRecords(merged);
        setFilteredRecords(merged);
      }
    } catch (err) {
      console.error("Attendance load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (index, status) => {
    const updated = [...filteredRecords];
    updated[index].status = status;
    setFilteredRecords(updated);
    
    const mainIndex = attendanceRecords.findIndex(r => r.id === updated[index].id);
    if (mainIndex !== -1) {
      const mainUpdated = [...attendanceRecords];
      mainUpdated[mainIndex].status = status;
      setAttendanceRecords(mainUpdated);
    }
  };

  const markAllPresent = () => {
    const updated = filteredRecords.map(r => ({ ...r, status: 'Present' }));
    setFilteredRecords(updated);
    
    const mainUpdated = attendanceRecords.map(r => ({ ...r, status: 'Present' }));
    setAttendanceRecords(mainUpdated);
    
    Swal.fire({
      icon: 'info',
      title: 'All Marked Present',
      text: 'All students have been marked present. Click "Save Attendance" to confirm.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  // 🌟 FIXED SAVE ENGINE (Ensures complete context aligns tracking properties)
  const saveAttendance = async () => {
    if (!teacherProfile?.is_class_teacher_of) return;
    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalData = attendanceRecords.map(r => ({
        student_id: r.id,
        date: selectedDate,
        status: r.status,
        recorded_by: user.id,
        term_context: activeTerm,
        session_context: activeSession,
        term_id: activeTerm // Keeping this field populated to protect any legacy DB constraints
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(finalData, { onConflict: 'student_id,date' });

      if (error) throw error;

      await logActivity(
        `Teacher ${teacherProfile.name} marked attendance for ${teacherProfile.is_class_teacher_of}`, 
        'attendance'
      );
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Attendance Saved!', 
        text: `Records for ${selectedDate} updated successfully.`,
        timer: 2000, 
        showConfirmButton: false 
      });

      fetchTeacherAndStudents();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const getStats = () => {
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const presentPercent = attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0;
    return { present, absent, total: attendanceRecords.length, presentPercent };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your class register...</p>
        </div>
      </div>
    );
  }

  if (!teacherProfile?.is_class_teacher_of) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
          <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaChalkboardTeacher className="text-4xl text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Class Assigned</h2>
          <p className="text-gray-500 text-sm">You haven't been assigned as a class teacher yet.</p>
          <p className="text-gray-400 text-xs mt-4">Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 pb-32">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-linear-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FaChalkboardTeacher className="text-white text-sm" />
                </div>
                Attendance Register
              </h1>
              <p className="text-xs text-gray-500 mt-1 ml-10">Record daily attendance for your students</p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl px-3 py-1.5 inline-flex items-center gap-2 border border-blue-100">
                  <FaCalendarAlt className="text-blue-500 text-xs" />
                  <span className="text-xs font-semibold text-gray-700">
                    {teacherProfile?.is_class_teacher_of}
                  </span>
                </div>
                
                {showSessionInfo && (
                  <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl px-3 py-1.5 inline-flex items-center gap-2 border border-purple-100">
                    <FaCalendarWeek className="text-purple-500 text-xs" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-purple-700">{activeTerm}</span>
                      <span className="text-[10px] text-purple-400">•</span>
                      <span className="text-xs font-semibold text-purple-700">{activeSession}</span>
                    </div>
                  </div>
                )}
                
                {!mobileView && (
                  <div className="inline-flex rounded-lg p-1 bg-gray-100">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      <FaThLarge className="text-xs" /> Cards
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      <FaList className="text-xs" /> Table
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">Date:</label>
                <input 
                  type="date" 
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {attendanceRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl max-w-md">
            <div className="w-24 h-24 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Students Found</h3>
            <p className="text-gray-500 text-sm">Your class doesn't have any students yet.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-6 pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] opacity-90 font-medium uppercase tracking-wider">Total Students</p>
              </div>
              <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-lg">
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-[10px] opacity-90 font-medium uppercase tracking-wider">Present</p>
              </div>
              <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-lg">
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-[10px] opacity-90 font-medium uppercase tracking-wider">Absent</p>
              </div>
              <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
                <p className="text-2xl font-bold">{stats.presentPercent}%</p>
                <p className="text-[10px] opacity-90 font-medium uppercase tracking-wider">Attendance Rate</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 mb-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2.5 rounded-xl flex items-center gap-2 transition-all ${showFilters ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 border-2 border-gray-200'}`}
                >
                  <FaFilter size={14} />
                </button>
              </div>

              {showFilters && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-3">
                    <select 
                      className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border-2 border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="Present">Present Only</option>
                      <option value="Absent">Absent Only</option>
                    </select>
                    {(searchTerm || filterStatus !== 'all') && (
                      <button onClick={clearFilters} className="text-xs text-red-500 font-medium px-3 py-2 hover:bg-red-50 rounded-lg transition">
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <FaUsers className="text-gray-400 text-xs" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Showing {filteredRecords.length} of {stats.total} students
                </span>
              </div>
              <button 
                onClick={markAllPresent}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <FaCheckDouble size={12} /> Mark All Present
              </button>
            </div>
          </div>

          {viewMode === 'table' && !mobileView && (
            <div className="px-4 sm:px-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                        <th className="py-3 px-4 text-left text-xs font-bold text-gray-600">#</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-gray-600">Student Name</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-gray-600">ID</th>
                        <th className="py-3 px-4 text-left text-xs font-bold text-gray-600">Gender</th>
                        <th className="py-3 px-4 text-center text-xs font-bold text-gray-600">Status</th>
                        <th className="py-3 px-4 text-center text-xs font-bold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-500">
                            No students match your filters
                           </td>
                        </tr>
                      ) : (
                        filteredRecords.map((record, idx) => {
                          return (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">{record.name}</td>
                              <td className="py-3 px-4 text-xs font-mono text-blue-600 bg-blue-50 rounded-md inline-block">{record.student_code}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${record.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                  {record.gender || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {record.status === 'Present' ? <FaUserCheck size={10} /> : <FaUserTimes size={10} />}
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={() => handleStatusChange(idx, 'Present')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${record.status === 'Present' ? 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}
                                  >
                                    <FaUserCheck size={10} /> P
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(idx, 'Absent')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${record.status === 'Absent' ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`}
                                  >
                                    <FaUserTimes size={10} /> A
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(viewMode === 'grid' || mobileView) && (
            <div className="px-4 sm:px-6 space-y-3 pb-4">
              {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
                  <p className="text-gray-500">No students match your filters</p>
                </div>
              ) : (
                filteredRecords.map((record, index) => {
                  return (
                    <div 
                      key={record.id} 
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-gray-800 text-base">{record.name}</p>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${record.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                {record.gender || 'N/A'}
                              </span>
                            </div>
                            <p className="text-[11px] text-blue-600 font-mono font-semibold">ID: {record.student_code}</p>
                          </div>
                          <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {record.status === 'Present' ? <FaUserCheck size={10} /> : <FaUserTimes size={10} />}
                            {record.status}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button 
                            onClick={() => handleStatusChange(index, 'Present')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold ${
                              record.status === 'Present' 
                              ? 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                            }`}
                          >
                            <FaUserCheck size={14} />
                            <span className="text-sm">Present</span>
                          </button>
                          <button 
                            onClick={() => handleStatusChange(index, 'Absent')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all font-semibold ${
                              record.status === 'Absent' 
                              ? 'bg-linear-to-r from-red-500 to-red-600 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <FaUserTimes size={14} />
                            <span className="text-sm">Absent</span>
                          </button>
                        </div>

                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${record.status === 'Present' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] text-gray-500">
                              Currently marked as <span className="font-semibold text-gray-700">{record.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {attendanceRecords.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
          <div className="p-4 max-w-md mx-auto">
            <div className="mb-2 flex justify-center gap-4 text-[10px] font-mono text-gray-500">
              <span className="flex items-center gap-1">
                <FaCalendarWeek className="text-purple-500 text-xs" />
                {activeTerm}
              </span>
              <span className="flex items-center gap-1">
                <FaSchool className="text-blue-500 text-xs" />
                {activeSession}
              </span>
            </div>
            <button 
              onClick={saveAttendance}
              disabled={saveLoading}
              className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saveLoading ? <FaSpinner className="animate-spin" size={18} /> : <FaSave size={16} />}
              {saveLoading ? 'Saving Attendance...' : 'Save Attendance Record'}
            </button>
            <div className="flex justify-between items-center mt-2 px-2">
              <p className="text-[10px] text-gray-500 font-mono">
                {selectedDate} • {teacherProfile?.is_class_teacher_of}
              </p>
              <p className="text-[10px] font-semibold text-gray-600">
                {stats.present} Present • {stats.absent} Absent
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};