import { Link } from 'react-router-dom';
import { FaGraduationCap, FaHeart, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FaGraduationCap size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Myriad Academy</h3>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Educating future leaders through innovation, excellence, and character development. 
              We nurture not just academic excellence but also creativity, critical thinking, and strong values.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <FaMapMarkerAlt className="text-primary" />
                <span>Omoloye Oke-ore Along, Owode Idiroko Rd, Ogun State</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <FaPhoneAlt className="text-primary" />
                <span>08034791741 | 08038005822</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <FaEnvelope className="text-primary" />
                <span>myriadacademy1022@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-5 relative inline-block">
              Quick Links
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></span>
            </h3>
            <ul className="space-y-3">
              <li><a href="/" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                Home
              </a></li>
              <li><a href="/#about" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                About Us
              </a></li>
              <li><a href="/#academics" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                Academics
              </a></li>
              <li><a href="/#facilities" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                Facilities
              </a></li>
              <li><a href="/#admissions" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                Admissions
              </a></li>
              <li><a href="/#contact" className="text-gray-400 hover:text-primary transition-colors flex items-center gap-2 group">
                <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-primary transition-colors"></span>
                Contact
              </a></li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h3 className="text-xl font-bold mb-5 relative inline-block">
              School Hours
              <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-primary mt-1"></span>
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-300 font-semibold mb-2">Regular School Hours</p>
                <div className="space-y-1 text-gray-400 text-sm">
                  <p>Monday - Thursday: 8:00 AM - 4:00 PM</p>
                  <p>Friday: 9:00 AM - 12:00 PM</p>
                  <p>Weekends: Closed</p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-gray-300 font-semibold mb-2">Office Hours</p>
                <div className="space-y-1 text-gray-400 text-sm">
                  <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                  <p>Saturday: 10:00 AM - 2:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Myriad Academy. All Rights Reserved. 
            Designed with <FaHeart className="inline text-red-500 mx-1" /> by Code Joker
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;