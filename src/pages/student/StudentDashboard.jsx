import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  FaBars, FaUserCircle, FaSearch, FaTachometerAlt, 
  FaSignOutAlt, FaChevronDown, FaUserGraduate, FaBook, 
  FaCalendarCheck, FaClipboardList, FaChartBar, FaTimes,
  FaHome
} from 'react-icons/fa';
import Swal from 'sweetalert2';

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const studentData = localStorage.getItem('student');
    if (studentData) {
      setStudent(JSON.parse(studentData));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = sidebarLinks.filter(link =>
        link.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
        localStorage.removeItem('student');
        localStorage.removeItem('studentToken');
        localStorage.removeItem('userType');
        navigate('/student/signin');
      }
    });
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/student/dashboard' },
    { name: 'My Results', icon: <FaClipboardList />, path: '/student/dashboard/results' },
    { name: 'Attendance', icon: <FaCalendarCheck />, path: '/student/dashboard/attendance' },
    { name: 'My Courses', icon: <FaBook />, path: '/student/dashboard/courses' },
    { name: 'Profile', icon: <FaUserCircle />, path: '/student/dashboard/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults([]);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-30 ${
        sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      }`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
          <div>
            <span className="text-xl font-bold text-primary">STUDENT</span>
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
        <header className="h-20 bg-white shadow-sm fixed top-0 right-0 left-0 z-10 border-b border-gray-100">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 shrink-0"
              >
                <FaBars size={20} />
              </button>
            )}

            <div className="flex-1 max-w-md relative">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition focus:bg-white text-sm" 
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 py-1">
                  <div className="px-4 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Quick Navigation
                  </div>
                  {searchResults.map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearchSelect(link.path)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors text-left cursor-pointer font-medium"
                    >
                      <span className="text-gray-400 group-hover:text-white">{link.icon}</span>
                      <span>{link.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-6">
                  <p className="text-sm text-gray-400 text-center font-medium">
                    No results for "<span className="text-gray-600">{searchQuery}</span>"
                  </p>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative shrink-0">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 sm:gap-3 hover:bg-gray-100 rounded-xl p-1.5 transition-colors">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FaUserGraduate className="text-primary text-lg sm:text-xl" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800">{student?.name || 'Student'}</p>
                  <p className="text-xs text-gray-500">{student?.email || 'student@myriad.com'}</p>
                </div>
                <FaChevronDown className={`text-xs text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{student?.email}</p>
                  </div>
                  <Link to="/student/dashboard/profile" onClick={() => setShowUserMenu(false)} className="block px-5 py-3 text-sm text-gray-700 hover:bg-primary hover:text-white transition-colors">
                    <FaUserCircle className="inline mr-2" /> My Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 font-semibold">
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-24 pb-8 px-4 sm:px-6 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;