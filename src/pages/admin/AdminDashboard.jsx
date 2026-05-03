import { useState, useEffect } from 'react';
import { FaBars, FaBell, FaUserCircle, FaSearch, FaTachometerAlt, FaSchool, FaUsers, FaChalkboardTeacher, FaBook, FaClipboardList, FaSignOutAlt, FaChevronDown, FaGlobe, FaLock, FaGraduationCap} from 'react-icons/fa';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  
  useEffect(() => {
    const handleUserUpdate = () => {
      const updatedData = JSON.parse(localStorage.getItem('user'));
      setUser(updatedData);
    };

    window.addEventListener("userUpdated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
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
        localStorage.removeItem('user');
        localStorage.removeItem('session')
        navigate('/admin/signin');
      }
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === '') {
      setFilteredResults([]);
      return;
    }

    const matches = sidebarLinks.filter(link => 
      link.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredResults(matches);
  };

  const selectSearchResult = (path) => {
    navigate(path);
    setSearchTerm('');
    setFilteredResults([]);
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: <FaTachometerAlt />, path: '/admin/dashboard' },
    { name: 'School Management', icon: <FaSchool />, path: '/admin/dashboard/school-management' }, 
    { name: 'Site Management', icon: <FaGlobe />, path: '/admin/dashboard/site-management' },
    { name: 'My Wards', icon: <FaUsers />, path: '/admin/dashboard/my-wards' },
    { name: 'Profile', icon: <FaUserCircle />, path: '/admin/dashboard/profile' },
    { name: 'Change Password', icon: <FaLock />, path: '/admin/dashboard/change-password' },
    { name: 'Classroom Management', icon: <FaChalkboardTeacher />, path: '/admin/dashboard/classroom' },
    { name: 'Result Management', icon: <FaClipboardList />, path: '/admin/dashboard/results' },
    { name: 'Promotion Management', icon: <FaGraduationCap />, path: '/admin/dashboard/promotion-management' }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl transition-all duration-300 z-30
        ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
      `}>
       
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <span className="text-xl font-bold text-primary">
            MYRIAD ADMIN
          </span>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <FaBars />
          </button>
        </div>

      
        <nav className="mt-6 px-2 h-[calc(100vh-4rem)] overflow-y-auto">
          {sidebarLinks.map((link, index) => (
            <Link
              key={index}
              to={link.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-colors ${
                isActive(link.path)
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="text-sm font-medium">{link.name}</span>
            </Link>
          ))}

          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="text-lg" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </nav>
      </div>

    
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

     
      <div className="transition-all duration-300">
    
        <header className="h-16 bg-white shadow-sm fixed right-0 top-0 z-10 left-0">
          <div className="h-full px-6 flex items-center justify-between">
           
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <FaBars />
            </button>

           <div className="flex-1 max-w-md ml-4 relative">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Jump to page... (e.g. 'Site', 'Results')"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                />
              </div>

              {filteredResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Quick Navigation
                  </div>
                  {filteredResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => selectSearchResult(result.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 text-gray-700 hover:text-primary transition-colors text-left"
                    >
                      <span className="text-primary/60">{result.icon}</span>
                      <span className="font-medium text-sm">{result.name}</span>
                      <span className="ml-auto text-[10px] text-gray-300 italic">Jump to →</span>
                    </button>
                  ))}
                </div>
              )}

              {searchTerm && filteredResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white p-4 rounded-xl shadow-xl border border-gray-100 text-center text-sm text-gray-400 z-50">
                  No page found for "{searchTerm}"
                </div>
              )}
            </div>

           
            <div className="flex items-center gap-4">
         
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FaBell className="text-gray-600 text-lg" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border py-2">
                    <div className="px-4 py-2 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50">
                        <p className="text-sm text-gray-600">No new notifications</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

             
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2"
                >
                  <div className="w-9 h-9 bg-primary/10 rounded-full overflow-hidden flex items-center justify-center border border-gray-200">
                    {user?.profile_image ? (
                      <img 
                        src={user.profile_image} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <FaUserCircle className="text-primary text-2xl" />
                    )}
                  </div>
                  <FaChevronDown className={`text-xs transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border py-2">
                    <Link to="/admin/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link to="/admin/dashboard/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Change Password
                    </Link>
                    <Link to="/admin/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <hr className="my-2" />
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

        
        <main className="p-6 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;