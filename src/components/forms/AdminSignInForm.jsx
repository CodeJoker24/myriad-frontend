import { useState } from 'react';
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API from '../../api';
import { logActivity, supabase } from '../../db'; // Imported supabase here

const AdminSignInForm = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Login Handler
  const Login = async(x)=>{
    x.preventDefault();
    
    if (!window.navigator.onLine) {
      return Swal.fire({
        title: 'No Connection',
        text: 'Your internet appears to be offline. Please reconnect and try again.',
        icon: 'warning'
      });
    }
    setLoading(true);

    if(!email || !password){
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text : "All fields are required! Please fill them out.",
        confirmButtonColor: "#3B82F6",
      });
      setLoading(false);
      return;
    }

    try{
      const response = await API.post("/api/auth_routes/login", {email, password});
      const {user, session} = response.data;
      
      if(user.role !== 'admin'){
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Access Denied",
          text: "This login is for Admins only!",
        });
        return;
      }

      localStorage.setItem("temp_user_id", user.id);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("session", JSON.stringify(response.data.session));
      await logActivity(`${user.email} signed into the admin panel`, 'security');
      
      setLoading(false);
      navigate("/admin/dashboard");
    }
    catch(error){
      let err = "Error connecting to the server!";
      if(error.response?.data?.error){
        Swal.fire({
          icon: "error",
          title: 'Warning',
          text: error.response?.data?.error
        });
        setLoading(false);
        return;
      }
      Swal.fire({
        icon: "error",
        title: 'Warning',
        text: err
      });
      setLoading(false);
      return;
    }
  };

  // Forgot Password Handler (Uses the exact logic from ChangePassword.jsx)
  const handleForgotPassword = async () => {
    const { value: resetEmail } = await Swal.fire({
      title: "Reset Password",
      input: "email",
      inputLabel: "Enter your registered email address",
      inputValue: email || "", // Pre-fills if email input is already typed
      inputPlaceholder: "example@gmail.com",
      showCancelButton: true,
      confirmButtonColor: "#3B82F6",
      inputValidator: (value) => {
        if (!value) return "Email is required!";
      }
    });

    if (resetEmail) {
      try {
        Swal.showLoading();
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/admin/dashboard/reset-password`,
        });

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Link Sent!',
          text: `A secure reset link has been sent to ${resetEmail}.`,
          confirmButtonColor: "#3B82F6",
        });

      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      }
    }
  };

  return (
    <form className="w-full max-w-md mx-auto" onSubmit={Login}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Admin Sign In</h2>

        <div className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Sign In'}
          </button>

          <p className="text-center text-gray-600">
            Don't have an account? <Link to="/admin/signup" className="text-primary hover:underline font-semibold">Signup</Link>
          </p>
        </div>
      </div>
    </form>
  );
};

export default AdminSignInForm;