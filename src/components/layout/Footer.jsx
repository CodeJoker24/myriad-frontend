import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaHeart } from 'react-icons/fa';
import { GiGraduateCap } from 'react-icons/gi';

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
         
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GiGraduateCap size={30} className="text-primary" />
              <h3 className="text-xl font-bold">Myriad Academy</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Educating future leaders through innovation, excellence, and character development.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <FaFacebook />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <FaTwitter />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <FaInstagram />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <FaLinkedin />
              </a>
            </div>
          </div>

         
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/" className="text-gray-300 hover:text-primary transition-colors">Home</a></li>
              <li><a href="/#about" className="text-gray-300 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="/#academics" className="text-gray-300 hover:text-primary transition-colors">Academics</a></li>
              <li><a href="/#facilities" className="text-gray-300 hover:text-primary transition-colors">Facilities</a></li>
              <li><a href="/#admissions" className="text-gray-300 hover:text-primary transition-colors">Admissions</a></li>
              <li><a href="/#contact" className="text-gray-300 hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Programs</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Early Childhood</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Elementary School</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Middle School</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">High School</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Summer Programs</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">School Calendar</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Parent Portal</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">School Policies</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">FAQs</a></li>
            </ul>
          </div>
        </div>

       
        <div className="text-center pt-8 border-t border-white/10 text-gray-300">
          <p>
            &copy; {new Date().getFullYear()} Myriad Academy. All Rights Reserved. | Designed with <FaHeart className="inline text-red-500 mx-1" /> by Code Joker
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;  