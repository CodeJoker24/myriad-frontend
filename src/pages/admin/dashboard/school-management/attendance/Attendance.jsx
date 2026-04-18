import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaCalendarCheck, 
  FaCheckCircle,
  FaUsers,
  FaSpinner,
  FaShieldAlt,
  FaSearch,
  FaSave,
  FaClock,
  FaUserCheck,
  FaUserTimes,
  FaUserClock
} from 'react-icons/fa';

export const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

  useEffect(() => {
    const fetchAllClasses = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('class_name')
        .not('class_name', 'is', null);
      
      if (!error) {
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
        .select(`
          status, 
          remarks, 
          student_id,
          students!inner(class_name)
        `)
        .eq('date', selectedDate)
        .eq('students.class_name', selectedClass);

      if (aError) throw aError;

      const mergedRecords = students.map(student => {
        const record = existingRecords?.find(r => r.student_id === student.id);
        return {
          id: student.id,
          name: student.name,
          student_id: student.student_id,
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

  const handleSaveAttendance = async () => {
    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const finalData = attendanceRecords.map(r => ({
        student_id: r.id,
        date: selectedDate,
        status: r.status,
        remarks: r.remarks,
        recorded_by: user.id
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(finalData, { onConflict: 'student_id, date' });

      if (error) throw error;

      Swal.fire('Success', `Attendance for ${selectedClass} updated`, 'success');
    } catch (err) {
      Swal.fire('Save Failed', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present': return <FaUserCheck size={14} />;
      case 'absent': return <FaUserTimes size={14} />;
      case 'late': return <FaUserClock size={14} />;
      default: return null;
    }
  };

  const getStatusCount = () => {
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    return { present, absent, late, total: attendanceRecords.length };
  };

  const counts = getStatusCount();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <FaCalendarCheck className="text-sm" />
          <span className="text-xs font-semibold uppercase tracking-wider">Attendance Management</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance Control</h1>
        <p className="text-gray-500 mt-1">Manage and monitor student attendance records</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Class</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
            >
              <option value="">Choose class...</option>
              {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Date</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" 
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleLoadStudents}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              Load Students
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {attendanceRecords.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{counts.total}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.present}</p>
            <p className="text-xs text-green-600 font-medium">Present</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.absent}</p>
            <p className="text-xs text-red-600 font-medium">Absent</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{counts.late}</p>
            <p className="text-xs text-yellow-600 font-medium">Late</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-16 text-center text-gray-400">
                    <FaUsers className="text-5xl mx-auto mb-3 text-gray-200" />
                    <p>No records loaded</p>
                    <p className="text-sm mt-1">Select a class and date to view attendance</p>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{record.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{record.student_id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleStatusChange(index, 'present')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            record.status === 'present' 
                              ? 'bg-green-500 text-white shadow-sm' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <FaUserCheck size={12} /> Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(index, 'absent')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            record.status === 'absent' 
                              ? 'bg-red-500 text-white shadow-sm' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <FaUserTimes size={12} /> Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(index, 'late')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            record.status === 'late' 
                              ? 'bg-yellow-500 text-white shadow-sm' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <FaUserClock size={12} /> Late
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={record.remarks}
                        onChange={(e) => handleRemarkChange(index, e.target.value)}
                        placeholder="Add note..." 
                        className="w-full px-3 py-2 bg-transparent border-b border-gray-200 focus:border-primary outline-none text-sm transition"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {attendanceRecords.length > 0 && (
          <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              onClick={handleSaveAttendance}
              disabled={saveLoading}
              className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
              Save Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};