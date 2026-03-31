import { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaChalkboardTeacher, FaSpinner } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../db';
import Swal from 'sweetalert2';

const TeacherSignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
     
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

    
      const { data: teacherProfile, error: dbError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !teacherProfile) {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a teacher.');
      }

     
      const teacherData = {
        id: teacherProfile.id,
        name: teacherProfile.name,
        email: authData.user.email,
        phone: teacherProfile.phone,
        department: teacherProfile.department,
        profile_image: teacherProfile.profile_image,
        is_first_login: teacherProfile.is_first_login
      };

      localStorage.setItem('teacher', JSON.stringify(teacherData));
      localStorage.setItem('teacherToken', authData.session.access_token);
      localStorage.setItem('userType', 'teacher');

      
      if (teacherProfile.is_first_login) {
    
        Swal.fire({
          title: 'Welcome!',
          text: 'Since this is your first login, please set a new password.',
          icon: 'info',
          confirmButtonColor: '#3b82f6',
          timer: 2000
        });
        
        
        navigate('/teacher/dashboard/change-password');
      } else {
        
        Swal.fire({
          icon: 'success',
          title: 'Welcome Back!',
          text: `Hello, ${teacherProfile.name}`,
          timer: 1500,
          showConfirmButton: false
        });
        navigate('/teacher/dashboard');
      }

    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

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

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : 'Sign In'}
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