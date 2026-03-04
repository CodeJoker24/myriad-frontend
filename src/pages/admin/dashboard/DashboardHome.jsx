import { FaUsers, FaChalkboardTeacher, FaBook, FaClipboardList } from 'react-icons/fa';

export const DashboardHome = () => {
  return (
    <div>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, Admin</p>
      </div>

     
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FaUsers size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Total Students</h3>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FaChalkboardTeacher size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Teachers</h3>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FaBook size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Courses</h3>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <FaClipboardList size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600">Pending Results</h3>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity</p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-primary text-white p-6 rounded-xl shadow-md hover:bg-primary-dark transition-colors text-left">
          <h3 className="font-bold text-lg mb-2">Add New Student</h3>
          <p className="text-white/80 text-sm">Register a new student</p>
        </button>
        <button className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left">
          <h3 className="font-bold text-gray-800 mb-2">Upload Results</h3>
          <p className="text-gray-600 text-sm">Publish new results</p>
        </button>
        <button className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left">
          <h3 className="font-bold text-gray-800 mb-2">Create Class</h3>
          <p className="text-gray-600 text-sm">Set up new classroom</p>
        </button>
      </div>
    </div>
  );
};