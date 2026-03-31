import { FaUsers, FaBook, FaCalendarCheck, FaClipboardList } from 'react-icons/fa';

export const TeacherHome = () => {
  const teacher = JSON.parse(localStorage.getItem('teacher'));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {teacher?.name || 'Teacher'}!</h1>
        <p className="text-gray-500 mt-1">Here's an overview of your teaching activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaUsers size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Total Students</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaBook size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">My Classes</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaCalendarCheck size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Today's Attendance</h3>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FaClipboardList size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Pending Results</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No classes scheduled for today</p>
        </div>
      </div>
    </div>
  );
};