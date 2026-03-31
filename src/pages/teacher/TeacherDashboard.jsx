import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaBars, FaBell, FaUserCircle, FaSearch, FaTachometerAlt, FaUsers, FaBook, FaClipboardList, FaSignOutAlt, FaChevronDown, FaChalkboardTeacher, FaCalendarCheck, FaChartBar, FaLock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { supabase } from '../../db';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);

  useEffect(() => {
    const teacherData = JSON.parse(localStorage.getItem('teacher'));
    setTeacher(teacherData);
  }, []);

  useEffect(() => {
    const handleTeacherUpdate = () => {
      const updatedData = JSON.parse(localStorage.getItem('teacher'));
      setTeacher(updatedData);
    };

    window.addEventListener("teacherUpdated", handleTeacherUpdate);
    window.addEventListener("storage", handleTeacherUpdate);

    return () => {
      window.removeEventListener("teacherUpdated", handleTeacherUpdate);
      window.removeEventListener("storage", handleTeacherUpdate);
    };
  }, []);

const handleLogout = () => {
  Swal.fire({
    title: 'Logout',
    text: 'Are you sure you want to logout?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3B82F6',
    confirmButtonText: 'Yes, logout'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/teacher/signin');
    }
  });
};

  const sidebarLinks = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/teacher/dashboard' },
    { name: 'My Students', icon: <FaUsers />, path: '/teacher/dashboard/students' },
    { name: 'My Classes', icon: <FaBook />, path: '/teacher/dashboard/classes' },
    { name: 'Attendance', icon: <FaCalendarCheck />, path: '/teacher/dashboard/attendance' },
    { name: 'Results', icon: <FaClipboardList />, path: '/teacher/dashboard/results' },
    { name: 'Reports', icon: <FaChartBar />, path: '/teacher/dashboard/reports' },
    { name: 'Profile', icon: <FaUserCircle />, path: '/teacher/dashboard/profile' },
    { name: 'Change Password', icon: <FaLock />, path: '/teacher/dashboard/change-password' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    // Close sidebar when clicking a link (works on all devices)
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-30 ${
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <span className="text-xl font-bold bg-linear-to-r from-primary to-primary-dark bg-clip-text text-transparent">
            TEACHER PORTAL
          </span>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          >
            <FaBars />
          </button>
        </div>

        <nav className="mt-6 px-3 h-[calc(100vh-4rem)] overflow-y-auto">
          {sidebarLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-xl transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all duration-200"
            >
              <FaSignOutAlt className="text-lg" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="transition-all duration-300">
        {/* Navbar */}
        <header className="h-16 bg-white shadow-sm fixed right-0 top-0 z-10 left-0">
          <div className="h-full px-6 flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <FaBars />
            </button>

            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaBell className="text-gray-500 text-lg" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm text-gray-500">No new notifications</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                    {teacher?.profile_image ? (
                      <img src={teacher.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <FaChalkboardTeacher className="text-primary text-xl" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-800">{teacher?.name || 'Teacher'}</p>
                    <p className="text-xs text-gray-500">{teacher?.email || 'teacher@myriad.com'}</p>
                  </div>
                  <FaChevronDown className={`text-xs text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <Link to="/teacher/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link to="/teacher/dashboard/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Change Password
                    </Link>
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;