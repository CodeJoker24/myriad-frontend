import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  FaBars, FaBell, FaUserCircle, FaSearch, FaTachometerAlt, 
  FaUsers, FaBook, FaClipboardList, FaSignOutAlt, 
  FaChevronDown, FaCalendarCheck, FaChartBar,
  FaTimes, FaUserGraduate, FaLock
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);


  const loadTeacherData = () => {
    const teacherData = localStorage.getItem('teacher');
    if (teacherData) {
      setTeacher(JSON.parse(teacherData));
    }
  };

  useEffect(() => {
    loadTeacherData();

  
    window.addEventListener("userUpdated", loadTeacherData);

    return () => {
      window.removeEventListener("userUpdated", loadTeacherData);
    };
  }, []);

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3B82F6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('teacher');
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('userType');
        navigate('/teacher/signin');
      }
    });
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/teacher/dashboard' },
    { name: 'My Class', icon: <FaUserGraduate />, path: '/teacher/dashboard/my-class' },
    { name: 'My Students', icon: <FaUsers />, path: '/teacher/dashboard/students' },
    { name: 'My Classes', icon: <FaBook />, path: '/teacher/dashboard/classes' },
    { name: 'Attendance', icon: <FaCalendarCheck />, path: '/teacher/dashboard/attendance' },
    { name: 'Results', icon: <FaClipboardList />, path: '/teacher/dashboard/results' },
    { name: 'Reports', icon: <FaChartBar />, path: '/teacher/dashboard/reports' },
    { name: 'Profile', icon: <FaUserCircle />, path: '/teacher/dashboard/profile' },
    { name: 'Change Password', icon: <FaLock />, path: '/teacher/dashboard/change-password' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-30 ${
        sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      }`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
          <div>
            <span className="text-xl font-bold text-primary">TEACHER</span>
            <span className="text-xl font-bold text-gray-800"> PORTAL</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="mt-8 px-4 h-[calc(100vh-5rem)] overflow-y-auto">
          {sidebarLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          ))}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
              <FaSignOutAlt className="text-xl" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        {/* Topbar */}
        <header className="h-20 bg-white shadow-sm fixed top-0 right-0 left-0 z-10">
          <div className="h-full px-6 flex items-center justify-between">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-600"
              >
                <FaBars size={20} />
              </button>
            )}

            <div className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50 focus:bg-white" 
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-xl">
                  <FaBell className="text-gray-600 text-xl" />
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-4">
                      <p className="text-sm text-gray-500">No new notifications</p>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu & Profile Image Replacement */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 hover:bg-gray-100 rounded-xl p-1.5 transition-colors">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-primary/10">
                    {teacher?.profile_image ? (
                      <img 
                        src={teacher.profile_image} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                           e.target.src = "https://ui-avatars.com/api/?name=" + (teacher?.name || "Teacher") + "&background=random";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 text-lg font-bold">
                        {teacher?.name?.charAt(0) || <FaUserCircle />}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-gray-800 leading-tight">{teacher?.name || 'Teacher'}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Teacher Account</p>
                  </div>
                  <FaChevronDown className={`text-[10px] text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{teacher?.email}</p>
                    </div>
                    <Link to="/teacher/dashboard/profile" onClick={() => setShowUserMenu(false)} className="block px-5 py-3 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      My Profile
                    </Link>
                    <Link to="/teacher/dashboard/change-password" onClick={() => setShowUserMenu(false)} className="block px-5 py-3 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors">
                      Security Settings
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-8 px-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboard;