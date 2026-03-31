import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChalkboardTeacher } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TeacherSignIn = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaChalkboardTeacher className="text-3xl text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Teacher Login</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to access your dashboard</p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  placeholder="teacher@myriadacademy.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FaEye size={18} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/admin/signin" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Admin Login
            </Link>
            <span className="mx-2 text-gray-300">|</span>
            <Link to="/student/signin" className="text-sm text-gray-500 hover:text-primary transition-colors">
              Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSignIn;