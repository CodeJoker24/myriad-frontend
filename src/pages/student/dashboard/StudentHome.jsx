import { FaBook, FaCalendarCheck, FaClipboardList, FaUserGraduate } from 'react-icons/fa';

export const StudentHome = () => {
  const student = JSON.parse(localStorage.getItem('student'));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {student?.name || 'Student'}!</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your academic progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaUserGraduate size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Total Courses</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaBook size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Enrolled Courses</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaCalendarCheck size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Attendance Rate</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaClipboardList size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Average Grade</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent activities</p>
        </div>
      </div>
    </div>
  );
};