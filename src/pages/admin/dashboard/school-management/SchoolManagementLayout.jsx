import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaCalendarCheck,
  FaArrowLeft
} from 'react-icons/fa';

export const SchoolManagementLayout = () => {
  const [nestedSidebarOpen, setNestedSidebarOpen] = useState(true);
  const location = useLocation();

  const nestedLinks = [
    { name: 'Students', icon: <FaUserGraduate />, path: '/admin/dashboard/school-management/students' },
    { name: 'Teachers', icon: <FaChalkboardTeacher />, path: '/admin/dashboard/school-management/teachers' },
    { name: 'Attendance', icon: <FaCalendarCheck />, path: '/admin/dashboard/school-management/attendance' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex gap-6">
      {/* Nested Sidebar */}
      <div className={`transition-all duration-300 ${nestedSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-24">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className={`font-semibold text-gray-800 ${!nestedSidebarOpen && 'hidden'}`}>
              School Management
            </h2>
            <button
              onClick={() => setNestedSidebarOpen(!nestedSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              {nestedSidebarOpen ? <FaArrowLeft size={14} /> : <FaUserGraduate size={16} />}
            </button>
          </div>
          
          <nav className="p-3">
            {nestedLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {nestedSidebarOpen && (
                  <span className="text-sm font-medium">{link.name}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};