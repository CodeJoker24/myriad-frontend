
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaGraduationCap,
  FaUserShield, 
  FaUserGraduate, 
  FaChalkboardTeacher,
  FaChevronDown,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isSignupDropdownOpen, setIsSignupDropdownOpen] = useState(false);
  const location = useLocation();

 
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsLoginDropdownOpen(false);
    setIsSignupDropdownOpen(false);
  }, [location]);

  
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/#about' },
    { name: 'Academics', path: '/#academics' },
    { name: 'Facilities', path: '/#facilities' },
    { name: 'Admissions', path: '/#admissions' },
    { name: 'Testimonials', path: '/#testimonials' },
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white/95 backdrop-blur-md py-5'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
       
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
          <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center">
            <FaGraduationCap size={24} />
          </div>
          <span className="sm:inline">MYRIAD</span>
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent  sm:inline">
            ACADEMY
          </span>
        </Link>

       
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {navLinks.map(link => (
              <li key={link.name}>
                <a 
                  href={link.path}
                  className="font-semibold hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {link.name}
                </a>
              </li>
            ))}

            
            <li className="relative">
              <button
                onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
              >
                Login <FaChevronDown size={12} className={`transition-transform ${isLoginDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLoginDropdownOpen && (
                <ul className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100 animate-fade-in">
                  <li>
                    <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition-all hover:translate-x-1">
                      <FaUserShield className="text-primary" size={14} /> Admin
                    </Link>
                  </li>
                  <li>
                    <Link to="/student/dashboard" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition-all hover:translate-x-1">
                      <FaUserGraduate className="text-primary" size={14} /> Student
                    </Link>
                  </li>
                  <li>
                    <Link to="/teacher/dashboard" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition-all hover:translate-x-1">
                      <FaChalkboardTeacher className="text-primary" size={14} /> Teacher
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            
            <li className="relative">
              <button
                onClick={() => setIsSignupDropdownOpen(!isSignupDropdownOpen)}
                className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
              >
                Sign Up <FaChevronDown size={12} className={`transition-transform ${isSignupDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSignupDropdownOpen && (
                <ul className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100 animate-fade-in">
                  <li>
                    <Link to="/signup" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 hover:text-primary transition-all hover:translate-x-1">
                      <FaUserGraduate className="text-primary" size={14} /> Student
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          </ul>
        </nav>

       
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden text-gray-800 z-50"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

       
        <div className={`fixed lg:hidden top-0 right-0 h-screen w-[80%] max-w-[400px] bg-white shadow-xl transition-all duration-500 ease-in-out z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <nav className="pt-24 px-6">
            <ul className="flex flex-col gap-4">
              {navLinks.map(link => (
                <li key={link.name}>
                  <a 
                    href={link.path}
                    className="block font-semibold py-2 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              
             
              <li className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray mb-2">Login as:</p>
                <div className="flex flex-col gap-2">
                  <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors">
                    <FaUserShield className="text-primary" size={14} /> Admin
                  </Link>
                  <Link to="/student/dashboard" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors">
                    <FaUserGraduate className="text-primary" size={14} /> Student
                  </Link>
                  <Link to="/teacher/dashboard" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors">
                    <FaChalkboardTeacher className="text-primary" size={14} /> Teacher
                  </Link>
                </div>
              </li>

              
              <li className="pt-4">
                <p className="text-sm text-gray mb-2">Sign up as:</p>
                <Link to="/signup" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg hover:bg-primary/10 transition-colors">
                  <FaUserGraduate className="text-primary" size={14} /> Student
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;