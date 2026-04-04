import { useState } from 'react';
import { FaIdCard, FaLock, FaEye, FaEyeSlash, FaUserGraduate, FaSpinner } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../db'; 
import Swal from 'sweetalert2';

const StudentSignIn = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const internalEmail = `${studentId.trim().toLowerCase()}@school.internal`;

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: internalEmail,
        password: password,
      });

      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('is_active, name, class_name')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw new Error("Could not verify account status.");

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("Your account is suspended. Please contact the school admin.");
      }

      const studentData = {
        id: authData.user.id,
        studentId: studentId,
        name: profile.name,
        className: profile.class_name,
        email: authData.user.email,
      };

      localStorage.setItem('student', JSON.stringify(studentData));
      localStorage.setItem('studentToken', authData.session.access_token);
      localStorage.setItem('userType', 'student');

      Swal.fire({
        icon: 'success',
        title: `Welcome, ${profile.name}!`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });

      navigate('/student/dashboard');

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: err.message || 'Invalid credentials.',
        confirmButtonColor: '#3B82F6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <FaUserGraduate className="text-2xl md:text-3xl text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Student Login</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Enter your Student ID and First Name</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4 md:space-y-5">
            {/* Student ID Field */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <FaIdCard className="text-gray-400 text-sm md:text-base" />
                </div>
                <input
                  required
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-9 md:pl-12 pr-3 md:pr-4 py-3 md:py-3.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white text-sm md:text-base"
                  placeholder="STD001"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                Password (First Name)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 text-sm md:text-base" />
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 md:pl-12 pr-9 md:pr-12 py-3 md:py-3.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white text-sm md:text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 md:py-4 rounded-xl font-semibold md:font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {loading ? <FaSpinner className="animate-spin" size={18} /> : 'Enter Dashboard'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-gray-100 text-center">
            <div className="flex justify-center gap-3 md:gap-4">
              <Link 
                to="/admin/signin" 
                className="text-[10px] md:text-xs font-semibold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors"
              >
                Admin Login
              </Link>
              <span className="text-gray-200">|</span>
              <Link 
                to="/teacher/signin" 
                className="text-[10px] md:text-xs font-semibold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors"
              >
                Teacher Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSignIn;