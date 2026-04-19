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
  FaChartLine,
  FaChevronDown
} from 'react-icons/fa';

const StatusBtn = ({ active, color, icon, label, onClick }) => {
  const colors = {
    green: active ? 'bg-emerald-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600',
    red: active ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600',
    yellow: active ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 flex items-center gap-1.5 ${colors[color]}`}
    >
      {icon} {label}
    </button>
  );
};

const StatCard = ({ label, count, color, bgColor }) => (
  <div className={`${bgColor} rounded-2xl p-4 text-center transition-all hover:scale-105 duration-200`}>
    <p className={`text-2xl font-black ${color}`}>{count}</p>
    <p className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
  </div>
);

export const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const identifyUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setAdminId(session.user.id);
      } else {
        const backupId = localStorage.getItem('temp_user_id');
        setAdminId(backupId);
      }
    };
    identifyUser();
  }, []);

  useEffect(() => {
    const fetchAllClasses = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .not('class_name', 'is', null);
      
      if (!error && data) {
        const uniqueClasses = [...new Set(data.map(item => item.class_name))];
        setAvailableClasses(uniqueClasses.sort());
      }
    };
    fetchAllClasses();
  }, []);

  const handleLoadStudents = async () => {
    if (!selectedClass || !selectedDate) {
      return Swal.fire('Info', 'Please select both class and date', 'info');
    }
    
    setLoading(true);
    try {
      const { data: students, error: sError } = await supabase
        .from('students')
        .select('id, name, student_id')
        .eq('class_name', selectedClass)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (sError) throw sError;

      const { data: existingRecords, error: aError } = await supabase
        .from('attendance')
        .select(`status, remarks, student_id, students!inner(class_name)`)
        .eq('date', selectedDate)
        .eq('students.class_name', selectedClass);

      if (aError) throw aError;

      const mergedRecords = students.map(student => {
        const record = existingRecords?.find(r => r.student_id === student.id);
        return {
          id: student.id,
          name: student.name,
          student_code: student.student_id,
          status: record ? record.status : 'present',
          remarks: record ? record.remarks : ''
        };
      });

      setAttendanceRecords(mergedRecords);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!attendanceRecords.length) return;

    if (!adminId) {
      return Swal.fire({
        icon: 'error',
        title: 'Authentication Error',
        text: 'Could not find your Admin ID. Please log out and log back in.'
      });
    }

    setSaveLoading(true);
    try {
      const finalData = attendanceRecords.map(r => ({
        student_id: r.id,
        date: selectedDate,
        status: r.status,
        remarks: r.remarks || '',
        recorded_by: adminId 
      }));

      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(finalData, { onConflict: 'student_id, date' });

      if (upsertError) throw upsertError;

      Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Attendance updated successfully.',
        timer: 1500,
        showConfirmButton: false
      });

    } catch (err) {
      Swal.fire('Save Error', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStatusChange = (index, status) => {
    const updated = [...attendanceRecords];
    updated[index].status = status;
    setAttendanceRecords(updated);
  };

  const handleRemarkChange = (index, val) => {
    const updated = [...attendanceRecords];
    updated[index].remarks = val;
    setAttendanceRecords(updated);
  };

  const counts = {
    present: attendanceRecords.filter(r => r.status === 'present').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    total: attendanceRecords.length
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>

              <div className="flex items-center gap-2 text-primary mb-1">
                <FaCalendarCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Attendance Management</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">Class Register</h1>
              <p className="text-xs text-gray-500 mt-1">Mark and manage student attendance</p>
              <p className="text-[10px] text-gray-400 mt-1">
            Recorder ID: <span className={adminId ? "text-green-500" : "text-red-500"}>{adminId || "NOT FOUND"}</span>
          </p>
            </div>
            {attendanceRecords.length > 0 && (
              <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm">
                <FaChartLine className="text-primary text-sm" />
                <span className="text-xs font-semibold text-gray-600">{counts.total} Students</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section - Collapsible on Mobile */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 mb-3"
          >
            <span className="text-sm font-semibold text-gray-700">Filters</span>
            <FaChevronDown className={`text-gray-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Select Class</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
                  >
                    <option value="">— Choose a class —</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium" 
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLoadStudents}
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {loading ? <FaSpinner className="animate-spin" size={16} /> : <FaSearch size={14} />}
                    Load Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        {attendanceRecords.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total" count={counts.total} color="text-gray-700" bgColor="bg-white border border-gray-100" />
            <StatCard label="Present" count={counts.present} color="text-emerald-600" bgColor="bg-emerald-50 border border-emerald-100" />
            <StatCard label="Absent" count={counts.absent} color="text-rose-600" bgColor="bg-rose-50 border border-rose-100" />
            <StatCard label="Late" count={counts.late} color="text-amber-600" bgColor="bg-amber-50 border border-amber-100" />
          </div>
        )}

        {/* Attendance Table / Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!attendanceRecords.length ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-3xl text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">Ready to take attendance?</p>
              <p className="text-xs text-gray-300 mt-1">Select a class and date to begin</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {attendanceRecords.map((record, index) => (
                  <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-800">{record.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{record.student_code}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <StatusBtn active={record.status === 'present'} color="green" icon={<FaUserCheck size={10}/>} label="P" onClick={() => handleStatusChange(index, 'present')} />
                        <StatusBtn active={record.status === 'absent'} color="red" icon={<FaUserTimes size={10}/>} label="A" onClick={() => handleStatusChange(index, 'absent')} />
                        <StatusBtn active={record.status === 'late'} color="yellow" icon={<FaUserClock size={10}/>} label="L" onClick={() => handleStatusChange(index, 'late')} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <input 
                        type="text" 
                        value={record.remarks}
                        onChange={(e) => handleRemarkChange(index, e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Add remarks..."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">Attendance Status</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attendanceRecords.map((record, index) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{record.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{record.student_code}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <StatusBtn active={record.status === 'present'} color="green" icon={<FaUserCheck size={10}/>} label="Present" onClick={() => handleStatusChange(index, 'present')} />
                            <StatusBtn active={record.status === 'absent'} color="red" icon={<FaUserTimes size={10}/>} label="Absent" onClick={() => handleStatusChange(index, 'absent')} />
                            <StatusBtn active={record.status === 'late'} color="yellow" icon={<FaUserClock size={10}/>} label="Late" onClick={() => handleStatusChange(index, 'late')} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            value={record.remarks}
                            onChange={(e) => handleRemarkChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Add remarks..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={handleSaveAttendance}
                  disabled={saveLoading}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                >
                  {saveLoading ? <FaSpinner className="animate-spin" size={16} /> : <FaSave size={14} />}
                  Save Attendance
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};