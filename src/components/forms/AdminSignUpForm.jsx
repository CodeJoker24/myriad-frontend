  import { useState } from 'react';
  import { FaUser, FaEnvelope, FaLock, FaSpinner, FaEye, FaEyeSlash } from 'react-icons/fa';
  import Swal from "sweetalert2";
  import axios from "axios"
  import { Link, useNavigate } from "react-router-dom"

  const AdminSignUpForm = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [name, setUserName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [adminSecret, setAdminSecret] = useState("");
    const navigate = useNavigate();

      const Signup = async(x)=>{
        x.preventDefault();
        setLoading(true);

        if(!name || !email || !password || !confirmPassword || !adminSecret){
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text : "All fields are required! Please fill them out.",
            confirmButtonColor: "#3B82F6",
            }
          )
          setLoading(false);
          return; 
        }

        if(password !== confirmPassword){
            Swal.fire({
            icon: "warning",
            title: "Mismatch",
            text : "Passwords do not match!",
            confirmButtonColor: "#3B82F6",
            }
          )
          setLoading(false);
          return; 
        }


        try{
          const response = await axios.post("http://127.0.0.1:4000/api/auth_routes/signup", {name, email, password, role:"admin", adminSecret})
          Swal.fire({
            icon:"success",
            title: "success",
            text : response.data.message,
          })
          setLoading(false);
          navigate("/admin/signin")

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
      <form className="w-full max-w-md mx-auto" onSubmit={Signup}>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Admin Sign Up</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="Input Name"
              
                  onChange={(e)=>setUserName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="Input Email"
              
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
                  name="password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="Input Password"
              
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="Confirm Password"
              
                  onChange={(e)=>setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">Registration Secret</label>
          <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaLock className="text-gray-400" />
          </div>
        <input
         type="password"
         className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
        placeholder="Enter Master Secret"
        value={adminSecret}
          onChange={(e) => setAdminSecret(e.target.value)}
            />
        </div>
          </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <FaSpinner className="animate-spin" /> : 'Sign Up'}
            </button>
            <p className="text-center text-gray-600">Already have an account? <Link to="/admin/signin" className="text-primary hover:underline">Login</Link></p>
          </div>
        </div>
      </form>
    );
  };

  export default AdminSignUpForm;