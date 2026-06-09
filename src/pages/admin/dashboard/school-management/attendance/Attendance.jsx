import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaCalendarCheck, 
  FaUsers,
  FaSpinner,
  FaSearch,
  FaSave,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaChevronDown,
  FaClock,
  FaFilter
} from 'react-icons/fa';
import { logActivity } from '../../../../../db';

const StatusBtn = ({ active, color, icon, label, onClick }) => {
  const colors = {
    green: active ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600',
    red: active ? 'bg-rose-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600',
    yellow: active ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 md:px-3 py-1.5 rounded-lg text-[10px] md:text-[11px] font-bold flex items-center gap-1 md:gap-1.5 transition-all outline-none ${colors[color]}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};

export const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [activeTerm, setActiveTerm] = useState('');
  const [activeSession, setActiveSession] = useState('');

  useEffect(() => {
    fetchInitialContext();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchInitialContext = async () => {
    try {
      setLoadingClasses(true);

      const { data: classData, error: classErr } = await supabase
        .from('students')
        .select('class_name')
        .eq('is_active', true);
        
      if (classErr) throw classErr;
      
      const distinctClasses = [...new Set(classData.map(item => item.class_name))].filter(Boolean);
      setClasses(distinctClasses);

      const { data: settingsData, error: settingsErr } = await supabase
        .from('academic_settings')
        .select('*')
        .eq('is_active', true);

      if (settingsErr) throw settingsErr;

      if (settingsData) {
        const activeTermRow = settingsData.find(row => row.type === 'term');
        const activeSessionRow = settingsData.find(row => row.type === 'session');

        if (activeTermRow) setActiveTerm(activeTermRow.value);
        if (activeSessionRow) setActiveSession(activeSessionRow.value);
      }

    } catch (err) {
      console.error("Initialization failed:", err.message);
      Swal.fire('Context Loading Failed', 'Could not sync current active system term configurations.', 'error');
    } finally {
      setLoadingClasses(false);
    }
  };

 const fetchClassAttendance = async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    try {
      const { data: roster, error: rosterErr } = await supabase
        .from('students')
        .select('id, student_id, name')
        .eq('class_name', selectedClass)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rosterErr) throw rosterErr;

      const studentUuidsInClass = roster.map(s => s.id);

      let existingRecords = [];
      if (studentUuidsInClass.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from('attendance')
          .select('*')
          .eq('date', selectedDate)
          .eq('session_context', activeSession)
          .eq('term_id', activeTerm)
          .in('student_id', studentUuidsInClass);

        if (attErr) throw attErr;
        existingRecords = attData || [];
      }

      
      const compiledRecords = roster.map(student => {
        const existing = existingRecords?.find(r => r.student_id === student.id);
        
       
        let dbStatus = existing?.status || 'Present';
        
       
        if (dbStatus.toLowerCase() === 'present') dbStatus = 'Present';
        if (dbStatus.toLowerCase() === 'absent') dbStatus = 'Absent';
        if (dbStatus.toLowerCase() === 'late') dbStatus = 'Late';

        return {
          id: existing?.id || null,
          db_uuid: student.id,
          display_id: student.student_id,
          name: student.name,
          status: dbStatus, 
          remarks: existing?.remarks || ''
        };
      });

      setStudents(roster);
      setAttendanceRecords(compiledRecords);
    } catch (err) {
      Swal.fire('Fetch Failure', err.message, 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (index, statusValue) => {
    const updated = [...attendanceRecords];
    updated[index].status = statusValue;
    setAttendanceRecords(updated);
  };

  const handleRemarkChange = (index, textValue) => {
    const updated = [...attendanceRecords];
    updated[index].remarks = textValue;
    setAttendanceRecords(updated);
  };

  const markAllAs = (statusValue) => {
    setAttendanceRecords(attendanceRecords.map(r => ({ ...r, status: statusValue })));
  };

 const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    setSaveLoading(true);

    try {
     
      const upsertPayload = attendanceRecords.map(record => {
        const payload = {
          student_id: record.db_uuid,
          date: selectedDate,
          status: record.status,
          remarks: record.remarks || '',
          term_context: activeTerm,
          session_context: activeSession,
          term_id: activeTerm
        };

      
        if (record.id) {
          payload.id = record.id;
        }

        return payload;
      });

      if (upsertPayload.length === 0) return;

      
      const { error: saveErr } = await supabase
        .from('attendance')
        .upsert(upsertPayload, { onConflict: 'student_id,date' });

      if (saveErr) throw saveErr;

      await logActivity(`Admin recorded attendance for ${selectedClass} on ${selectedDate}`, 'attendance');

      Swal.fire({
        icon: 'success',
        title: 'Attendance Saved!',
        text: `Successfully processed ${upsertPayload.length} records.`,
        confirmButtonColor: '#3B82F6'
      });

      fetchClassAttendance();

    } catch (err) {
      Swal.fire('Database Error', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredRecords = attendanceRecords.filter(record => 
    record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.display_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: attendanceRecords.filter(r => r.status === 'Present').length,
    absent: attendanceRecords.filter(r => r.status === 'Absent').length,
    late: attendanceRecords.filter(r => r.status === 'Late').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 bg-linear-to-r from-primary to-blue-700 rounded-xl p-5 text-white shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/80 text-xs font-semibold uppercase mb-1">
                <FaCalendarCheck size={12} />
                <span>Attendance Center</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold">Attendance</h1>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <FaClock className="text-amber-300" size={14} />
              <div>
                <p className="text-[9px] text-white/60 font-semibold uppercase">Active Frame</p>
                <p className="text-xs font-bold">
                  {activeTerm ? `${activeTerm} (${activeSession})` : 'No Active Session'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Class</label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loadingClasses}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm font-medium appearance-none"
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-primary text-sm font-medium"
            />
          </div>

          {selectedClass && attendanceRecords.length > 0 && (
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-around">
              <div className="text-center">
                <p className="text-lg font-bold text-emerald-600">{stats.present}</p>
                <p className="text-[9px] font-semibold text-gray-400">Present</p>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-rose-600">{stats.absent}</p>
                <p className="text-[9px] font-semibold text-gray-400">Absent</p>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-500">{stats.late}</p>
                <p className="text-[9px] font-semibold text-gray-400">Late</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {selectedClass && (
            <div className="p-3 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => markAllAs('Present')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-semibold rounded-lg text-xs hover:bg-emerald-100 transition">All Present</button>
                <button onClick={() => markAllAs('Absent')} className="px-3 py-1.5 bg-rose-50 text-rose-600 font-semibold rounded-lg text-xs hover:bg-rose-100 transition">All Absent</button>
              </div>
            </div>
          )}

          <div className="min-h-75">
            {!selectedClass ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FaUsers className="text-4xl text-gray-200 mb-2" />
                <p className="text-gray-400 text-sm">Select a class to load students</p>
              </div>
            ) : loadingStudents ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FaSpinner className="animate-spin text-primary text-3xl mb-2" />
                <p className="text-gray-400 text-xs">Loading attendance records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No students found</div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr className="text-left text-[10px] font-bold text-gray-400 uppercase">
                        <th className="px-5 py-3 w-12">#</th>
                        <th className="px-5 py-3">Student ID</th>
                        <th className="px-5 py-3">Name</th>
                        <th className="px-5 py-3 text-center w-80">Status</th>
                        <th className="px-5 py-3">Remarks</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRecords.map((record, idx) => (
                        <tr key={record.db_uuid} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-5 py-3 text-xs font-mono font-bold text-primary">{record.display_id}</td>
                          <td className="px-5 py-3 font-medium text-gray-800 text-sm">{record.name}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <StatusBtn active={record.status === 'Present'} color="green" icon={<FaUserCheck size={11} />} label="P" onClick={() => handleStatusChange(idx, 'Present')} />
                              <StatusBtn active={record.status === 'Absent'} color="red" icon={<FaUserTimes size={11} />} label="A" onClick={() => handleStatusChange(idx, 'Absent')} />
                              <StatusBtn active={record.status === 'Late'} color="yellow" icon={<FaUserClock size={11} />} label="L" onClick={() => handleStatusChange(idx, 'Late')} />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <input 
                              type="text" 
                              value={record.remarks}
                              onChange={(e) => handleRemarkChange(idx, e.target.value)}
                              className="w-full px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs outline-none focus:border-primary transition"
                              placeholder="Remark"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y">
                  {filteredRecords.map((record, idx) => (
                    <div key={record.db_uuid} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-gray-400 font-mono">{record.display_id}</p>
                          <p className="font-semibold text-gray-800 text-base">{record.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <StatusBtn active={record.status === 'Present'} color="green" icon={<FaUserCheck size={11} />} label="P" onClick={() => handleStatusChange(idx, 'Present')} />
                          <StatusBtn active={record.status === 'Absent'} color="red" icon={<FaUserTimes size={11} />} label="A" onClick={() => handleStatusChange(idx, 'Absent')} />
                          <StatusBtn active={record.status === 'Late'} color="yellow" icon={<FaUserClock size={11} />} label="L" onClick={() => handleStatusChange(idx, 'Late')} />
                        </div>
                      </div>
                      <div className="mt-2">
                        <input 
                          type="text" 
                          value={record.remarks}
                          onChange={(e) => handleRemarkChange(idx, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary transition"
                          placeholder="Add remark..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                  <button 
                    onClick={handleSaveAttendance}
                    disabled={saveLoading}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 text-sm transition disabled:opacity-50 shadow-sm"
                  >
                    {saveLoading ? <FaSpinner className="animate-spin" size={14} /> : <FaSave size={14} />}
                    Save Attendance
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};