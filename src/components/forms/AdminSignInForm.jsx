import { useState } from 'react';
import { FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API from '../../api';
import { logActivity } from '../../db';

const AdminSignInForm = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const Login = async(x)=>{
    x.preventDefault();
    setLoading(true);

    if(!email || !password){
      Swal.fire({
         icon: "error",
          title: "Oops...",
          text : "All fields are required! Please fill them out.",
          confirmButtonColor: "#3B82F6",
      })
      setLoading(false);
      return;
    }

    try{
      const response = await API.post("/api/auth_routes/login", {email, password})
      const {user, session} = response.data;
      if(user.role !=='admin'){
        setLoading(false);
        Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "This login is for Admins only!",
    });
    return;
      }
      localStorage.setItem("user", JSON.stringify(response.data.user))
      localStorage.setItem("session", JSON.stringify(response.data.session))
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
      })
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
  }


  return (
    <form className="w-full max-w-md mx-auto" onSubmit={Login}>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Admin Sign In</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                onChange={(e)=>setEmail(e.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                onChange={(e)=>setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Sign In'}
          </button>
          <p className="text-center text-gray-600">Don't have an account? <Link to="/admin/signup" className="text-primary hover:underline">Signup</Link></p>
        </div>
      </div>
    </form>
  );
};

export default AdminSignInForm;