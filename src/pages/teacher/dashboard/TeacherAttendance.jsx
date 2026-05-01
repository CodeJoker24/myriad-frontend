import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { logActivity } from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaUserCheck, FaUserTimes, FaSpinner, 
  FaCalendarAlt, FaChalkboardTeacher, FaSave, FaCheckDouble,
  FaUsers, FaClock, FaChartLine, FaSearch, FaFilter,
  FaUserGraduate, FaVenusMars, FaEye, FaChartBar
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

  useEffect(() => {
    fetchTeacherAndStudents();
  }, [selectedDate]);

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

        const { data: existingAttendance } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate);

        const merged = studentData.map(student => {
          const record = existingAttendance?.find(a => a.student_id === student.id);
          return {
            id: student.id,
            name: student.name,
            student_code: student.student_id,
            gender: student.gender,
            status: record ? record.status : 'present',
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
    const updated = filteredRecords.map(r => ({ ...r, status: 'present' }));
    setFilteredRecords(updated);
    
    const mainUpdated = attendanceRecords.map(r => ({ ...r, status: 'present' }));
    setAttendanceRecords(mainUpdated);
    
    Swal.fire({
      icon: 'info',
      title: 'All Marked Present',
      text: 'All students have been marked present. Click "Save Attendance" to confirm.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const saveAttendance = async () => {
    if (!teacherProfile?.is_class_teacher_of) return;
    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalData = attendanceRecords.map(r => ({
        student_id: r.id,
        date: selectedDate,
        status: r.status,
        recorded_by: user.id
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(finalData, { onConflict: 'student_id, date' });

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
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const presentPercent = attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0;
    return { present, absent, total: attendanceRecords.length, presentPercent };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <FaSpinner className="animate-spin text-primary text-5xl mb-4 mx-auto" />
          <p className="text-gray-600 font-medium">Loading your class register...</p>
          <p className="text-xs text-gray-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (!teacherProfile?.is_class_teacher_of) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaChalkboardTeacher className="text-3xl text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Class Assigned</h2>
          <p className="text-gray-500 text-sm">You haven't been assigned as a class teacher yet.</p>
          <p className="text-gray-400 text-xs mt-4">Please contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-0 shadow-sm">
        <div className="p-5">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaChalkboardTeacher className="text-primary" /> 
                Attendance Register
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Record daily attendance for your students
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 rounded-xl px-4 py-2 inline-flex items-center gap-2">
                  <FaCalendarAlt className="text-primary text-sm" />
                  <span className="text-sm font-semibold text-gray-700">
                    {teacherProfile?.is_class_teacher_of}
                  </span>
                </div>
                <button
                  onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
                  className="bg-gray-100 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  {viewMode === 'grid' ? '📋 Table View' : '📱 Card View'}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-500">Date:</label>
                <input 
                  type="date" 
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm max-w-md">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUsers className="text-4xl text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Students Found</h3>
            <p className="text-gray-500 text-sm">Your class doesn't have any students yet.</p>
            <p className="text-gray-400 text-xs mt-3">Students will appear here once enrolled.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Students</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">Present</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                <p className="text-[10px] text-red-600 font-medium uppercase tracking-wider">Absent</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{stats.presentPercent}%</p>
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider">Attendance Rate</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
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
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present Only</option>
                      <option value="absent">Absent Only</option>
                    </select>
                    {(searchTerm || filterStatus !== 'all') && (
                      <button onClick={clearFilters} className="text-xs text-red-500 font-medium px-3 py-2">
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Result Count */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <FaUsers className="text-gray-400 text-xs" />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Showing {filteredRecords.length} of {stats.total} students
                </span>
              </div>
              <button 
                onClick={markAllPresent}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <FaCheckDouble size={12} /> Mark All Present
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          {viewMode === 'table' && (
            <div className="hidden md:block px-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="py-3 px-4">S/N</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Gender</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
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
                          const originalIndex = attendanceRecords.findIndex(r => r.id === record.id);
                          return (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-gray-500">{idx + 1}</td>
                              <td className="py-3 px-4 font-medium text-gray-800">{record.name}</td>
                              <td className="py-3 px-4 text-xs font-mono text-gray-500">{record.student_code}</td>
                              <td className="py-3 px-4">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${record.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                  {record.gender || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {record.status === 'present' ? <FaUserCheck size={10} /> : <FaUserTimes size={10} />}
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex justify-center gap-2">
                                  <button 
                                    onClick={() => handleStatusChange(idx, 'present')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${record.status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'}`}
                                  >
                                    <FaUserCheck size={10} /> P
                                  </button>
                                  <button 
                                    onClick={() => handleStatusChange(idx, 'absent')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${record.status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'}`}
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

          {/* Mobile/Grid Card View */}
          {(viewMode === 'grid' || window.innerWidth < 768) && (
            <div className="px-5 space-y-3">
              {filteredRecords.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <p className="text-gray-500">No students match your filters</p>
                </div>
              ) : (
                filteredRecords.map((record, index) => {
                  const originalIndex = attendanceRecords.findIndex(r => r.id === record.id);
                  return (
                    <div 
                      key={record.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden active:bg-gray-50 transition-colors"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800 text-base">{record.name}</p>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${record.gender === 'Male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                {record.gender || 'N/A'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono">ID: {record.student_code}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${record.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {record.status === 'present' ? <FaUserCheck size={10} /> : <FaUserTimes size={10} />}
                            {record.status}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleStatusChange(index, 'present')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                              record.status === 'present' 
                              ? 'bg-green-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                            }`}
                          >
                            <FaUserCheck size={14} />
                            <span className="text-sm font-medium">Present</span>
                          </button>
                          <button 
                            onClick={() => handleStatusChange(index, 'absent')}
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                              record.status === 'absent' 
                              ? 'bg-red-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <FaUserTimes size={14} />
                            <span className="text-sm font-medium">Absent</span>
                          </button>
                        </div>

                        {/* Status Indicator */}
                        <div className="mt-3 pt-2 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${record.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] text-gray-400">
                              Currently marked as <span className="font-semibold text-gray-600">{record.status}</span>
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

      {/* Floating Save Button */}
      {attendanceRecords.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-lg">
          <div className="p-4 max-w-md mx-auto">
            <button 
              onClick={saveAttendance}
              disabled={saveLoading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saveLoading ? <FaSpinner className="animate-spin" size={18} /> : <FaSave size={16} />}
              {saveLoading ? 'Saving Attendance...' : 'Save Attendance Record'}
            </button>
            <div className="flex justify-between items-center mt-2 px-2">
              <p className="text-[10px] text-gray-400">
                {selectedDate} • {teacherProfile?.is_class_teacher_of}
              </p>
              <p className="text-[10px] text-gray-400">
                {stats.present} Present • {stats.absent} Absent
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};