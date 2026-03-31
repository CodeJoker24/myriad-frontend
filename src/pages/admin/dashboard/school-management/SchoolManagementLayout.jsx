import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaCalendarCheck,
  FaArrowLeft,
  FaBars,
  FaTimes
} from 'react-icons/fa';

export const SchoolManagementLayout = () => {
  const [nestedSidebarOpen, setNestedSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const nestedLinks = [
    { name: 'Students', icon: <FaUserGraduate />, path: '/admin/dashboard/school-management/students' },
    { name: 'Teachers', icon: <FaChalkboardTeacher />, path: '/admin/dashboard/school-management/teachers' },
    { name: 'Attendance', icon: <FaCalendarCheck />, path: '/admin/dashboard/school-management/attendance' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      {/* Mobile Menu Button - Visible only on mobile */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-700 w-full justify-between"
        >
          <span className="font-medium">School Management</span>
          {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </div>

      {/* Nested Sidebar - Desktop: always visible, Mobile: slides in overlay */}
      <div className={`
        lg:relative lg:block
        ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden'}
        lg:block lg:bg-transparent
      `}>
        {/* Mobile Close Button - Inside sidebar when open */}
        {isMobileMenuOpen && (
          <div className="lg:hidden flex justify-end p-4 border-b">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <FaTimes size={20} />
            </button>
          </div>
        )}

        <div className={`
          bg-white rounded-2xl shadow-sm border border-gray-100 
          ${isMobileMenuOpen ? 'h-full overflow-y-auto' : 'sticky top-24'}
          lg:sticky lg:top-24
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className={`font-semibold text-gray-800 ${!nestedSidebarOpen && 'lg:hidden'}`}>
              School Management
            </h2>
            <h2 className={`font-semibold text-gray-800 hidden ${nestedSidebarOpen && 'lg:block'}`}>
              School Management
            </h2>
            <button
              onClick={() => setNestedSidebarOpen(!nestedSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              {nestedSidebarOpen ? <FaArrowLeft size={14} /> : <FaUserGraduate size={16} />}
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="p-3">
            {nestedLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className={`text-sm font-medium ${!nestedSidebarOpen && 'lg:hidden'}`}>
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};