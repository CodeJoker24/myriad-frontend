import { useState } from 'react';
import { 
  FaCalendarCheck, 
  FaCheckCircle,
  FaDownload,
  FaUsers
} from 'react-icons/fa';

export const Attendance = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const classes = [];

  const handleLoadStudents = () => {
    setLoading(true);
    setTimeout(() => {
      setAttendanceRecords([]);
      setLoading(false);
    }, 1000);
  };

  const handleSaveAttendance = () => {
    console.log('Save attendance');
  };

  const handleViewReport = (type) => {
    console.log('View report:', type);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 mt-1">Mark student attendance and view reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
          >
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleLoadStudents}
            disabled={!selectedClass || !selectedDate || loading}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all w-full justify-center disabled:opacity-50"
          >
            <FaCalendarCheck size={16} />
            {loading ? 'Loading...' : 'Load Students'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Mark Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">S/N</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Student Name</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Admission No.</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-500">
                    <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>Select a class and date to mark attendance</p>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-6 text-sm text-gray-600">{index + 1}</td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-800">{record.name}</td>
                    <td className="py-3 px-6 text-sm text-gray-600">{record.admissionNo}</td>
                    <td className="py-3 px-6">
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`attendance-${index}`} value="present" className="text-primary" />
                          <span className="text-sm">Present</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`attendance-${index}`} value="absent" className="text-red-500" />
                          <span className="text-sm">Absent</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name={`attendance-${index}`} value="late" className="text-yellow-500" />
                          <span className="text-sm">Late</span>
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <input type="text" placeholder="Optional remarks" className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-40" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {attendanceRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
            <button onClick={handleSaveAttendance} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2">
              <FaCheckCircle size={16} />
              Save Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
};