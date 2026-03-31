import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaUserShield,  FaUserGraduate, FaChalkboardTeacher, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isSignupDropdownOpen, setIsSignupDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
    { name: 'Contact', path: '/#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 backdrop-blur-sm py-4'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center">
            <FaGraduationCap size={24} />
          </div>
          <span className="sm:inline text-gray-900">MYRIAD</span>
          <span className="sm:inline text-primary">ACADEMY</span>
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-6">
            {navLinks.map(link => (
              <li key={link.name}>
                <a 
                  href={link.path}
                  className="text-gray-700 font-medium hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              </li>
            ))}

            <li className="relative">
              <button
                onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                className="flex items-center gap-1 text-gray-700 font-medium hover:text-primary transition-colors"
              >
                Login <FaChevronDown size={12} className={`transition-transform ${isLoginDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLoginDropdownOpen && (
                <ul className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                  <li>
                    <Link to="/admin/signin" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <FaUserShield className="text-primary" size={14} /> Admin
                    </Link>
                  </li>
                  <li>
                    <Link to="/student/signin" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <FaUserGraduate className="text-primary" size={14} /> Student
                    </Link>
                  </li>
                  <li>
                    <Link to="/teacher/signin" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <FaChalkboardTeacher className="text-primary" size={14} /> Teacher
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            <li className="relative">
              <button
                onClick={() => setIsSignupDropdownOpen(!isSignupDropdownOpen)}
                className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Sign Up <FaChevronDown size={12} className={`transition-transform ${isSignupDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSignupDropdownOpen && (
                <ul className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-100">
                  <li>
                    <Link to="/admin/signup" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                      <FaUserShield className="text-primary" size={14} /> Admin
                    </Link>
                  </li>
                  <li>
                    <Link to="/student/signup" className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
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
          className="lg:hidden text-gray-700 z-50"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>

        <div className={`fixed lg:hidden top-0 right-0 h-screen w-[80%] max-w-100 bg-white shadow-xl transition-all duration-500 ease-in-out z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <nav className="pt-24 px-6">
            <ul className="flex flex-col gap-4">
              {navLinks.map(link => (
                <li key={link.name}>
                  <a 
                    href={link.path}
                    className="block font-medium text-gray-700 py-2 hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
              
              <li className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Login as:</p>
                <div className="flex flex-col gap-2">
                  <Link to="/admin/signin" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors">
                    <FaUserShield className="text-primary" size={14} /> Admin
                  </Link>
                  <Link to="/student/signin" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors">
                    <FaUserGraduate className="text-primary" size={14} /> Student
                  </Link>
                  <Link to="/teacher/signin" className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors">
                    <FaChalkboardTeacher className="text-primary" size={14} /> Teacher
                  </Link>
                </div>
              </li>

              <li className="pt-4">
                <p className="text-sm text-gray-500 mb-2">Sign up as:</p>
                <div className="flex flex-col gap-2">
                  <Link to="/admin/signup" className="flex items-center gap-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mb-2">
                    <FaUserShield size={14} /> Admin
                  </Link>
                  <Link to="/student/signup" className="flex items-center gap-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                    <FaUserGraduate size={14} /> Student
                  </Link>
                </div>
              </li>
            </ul>
          </nav>
        </div>

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