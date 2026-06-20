import { useEffect, useState } from 'react';
import { supabase } from '../../../db';
import { 
  FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaUserClock, 
  FaSpinner, FaFilter, FaInfoCircle, FaSchool, FaChartLine,
  FaClock, FaCalendarAlt, FaUserGraduate
} from 'react-icons/fa';

export const StudentAttendance = () => {
  const studentSnapshot = JSON.parse(localStorage.getItem('student')) || {};

  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activeSession, setActiveSession] = useState('2025/2026');
  const [activeTerm, setActiveTerm] = useState('Third Term');
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });
  const [totalDays, setTotalDays] = useState(0);

  const normalizeStr = (str) => {
    if (!str) return '';
    return str.replace(/\s+/g, '').toLowerCase().trim();
  };

  useEffect(() => {
    const fetchAttendanceLogData = async () => {
      if (!studentSnapshot?.id) return;
      setLoading(true);

      try {
        const { data: settingsRows } = await supabase
          .from('academic_settings')
          .select('*')
          .eq('is_active', true);

        let currentSessionName = '2025/2026';
        let currentTermName = 'Third Term';

        if (settingsRows) {
          const sessionRow = settingsRows.find(row => row.type === 'session');
          const termRow = settingsRows.find(row => row.type === 'term');
          if (sessionRow?.value) currentSessionName = sessionRow.value;
          if (termRow?.value) currentTermName = termRow.value;
        }

        setActiveSession(currentSessionName);
        setActiveTerm(currentTermName);

        const { data: logRows, error: logError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentSnapshot.id)
          .order('date', { ascending: false });

        if (!logError && logRows) {
          const currentTermLogs = logRows.filter(row => {
            const rowSession = row.session_context || row.session || '';
            const rowTerm = row.term_context || row.term_id || row.term || '';
            
            return (
              normalizeStr(rowSession) === normalizeStr(currentSessionName) &&
              normalizeStr(rowTerm) === normalizeStr(currentTermName)
            );
          });

          setAttendanceRecords(currentTermLogs);
          setTotalDays(currentTermLogs.length);

          const calculatedStats = currentTermLogs.reduce((acc, current) => {
            const statusKey = current.status?.toLowerCase();
            if (statusKey === 'present') acc.present += 1;
            else if (statusKey === 'absent') acc.absent += 1;
            else if (statusKey === 'late') acc.late += 1;
            return acc;
          }, { present: 0, absent: 0, late: 0 });

          setStats(calculatedStats);
        }
      } catch (err) {
        console.error("Critical failure pulling attendance log context matrix:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceLogData();
  }, [studentSnapshot?.id]);

  const getAttendancePercentage = () => {
    if (totalDays === 0) return 0;
    return Math.round((stats.present / totalDays) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 translate-y-10 blur-2xl"></div>
          
          <div className="relative px-6 md:px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white border border-white/20">
                <FaCalendarCheck size={22} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Attendance Record</h1>
                <p className="text-xs text-blue-200 font-medium">Track your classroom presence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
              <FaSchool className="text-blue-300 text-sm" />
              <div className="text-xs">
                <p className="text-blue-200 font-medium">Active Cycle</p>
                <p className="text-white font-bold flex items-center gap-1.5">
                  <span>{activeSession}</span>
                  <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                  <span className="text-blue-300">{activeTerm}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Days</p>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <FaCalendarAlt size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-gray-800">{totalDays}</p>
            <p className="text-xs text-gray-400 mt-1">Recorded entries</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Present</p>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <FaCheckCircle size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600">{stats.present}</p>
            <p className="text-xs text-gray-400 mt-1">{totalDays > 0 ? Math.round((stats.present / totalDays) * 100) : 0}% attendance rate</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Late</p>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FaUserClock size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-600">{stats.late}</p>
            <p className="text-xs text-gray-400 mt-1">Arrived late</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Absent</p>
              <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <FaTimesCircle size={16} />
              </div>
            </div>
            <p className="text-2xl font-black text-rose-600">{stats.absent}</p>
            <p className="text-xs text-gray-400 mt-1">Missed days</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FaChartLine className="text-blue-600 text-sm" />
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Attendance Log</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold text-gray-400">
                {attendanceRecords.length} records
              </span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-gray-500">Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[10px] text-gray-500">Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-[10px] text-gray-500">Absent</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            {attendanceRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaInfoCircle className="text-gray-400 text-3xl" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No attendance records found</p>
                <p className="text-xs text-gray-400 mt-1">Your attendance will appear here once recorded</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b-2 border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Day</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {attendanceRecords.map((record) => {
                    const date = new Date(record.date);
                    const statusColor = record.status?.toLowerCase() === 'present' ? 'emerald' :
                                      record.status?.toLowerCase() === 'late' ? 'amber' : 'rose';
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">
                          {date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-4 text-gray-600">
                          {date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-${statusColor}-50 border-${statusColor}-200 text-${statusColor}-700`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-${statusColor}-500`}></span>
                            {record.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {record.remarks || <span className="text-gray-300 italic">No remarks</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};