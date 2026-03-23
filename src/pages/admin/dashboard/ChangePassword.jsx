import { FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import API from '../../../api'; 
import { supabase } from '../../../db';
import Swal from 'sweetalert2';
export const ChangePassword = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [current, setCurrent] = useState("");
  const [newp, setNewp] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false)
  const user = JSON.parse(localStorage.getItem('user'));
  const change = async (x) =>{
   x.preventDefault();
   setLoading(true);

   if(!current || !newp || !confirm){
     Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "All fields are required! Please fill them out.",
      confirmButtonColor: "#3B82F6",
      });
      setLoading(false);
      return;
   }
   try{

  const {error: signInError} = await supabase.auth.signInWithPassword({
  email: user.email,
  password:current
  });
  
  if(signInError){
    throw new Error("The current Password you entered is incorrect");
  }

  if(newp !== confirm){
    throw new Error("New passwords do not match!");
  }

  if (newp.length < 6) {
      throw new Error("Password must be at least 6 characters.");
  }
  console.log("Sending update for ID:", user.id);
  const response = await API.put(`/api/auth_routes/change-password/${user.id}`, {
  newPassword: newp 
});

  Swal.fire({
    icon:'success',
    title:'Success',
    text:response.data.message
    });
    setConfirm("");
    setCurrent("");
    setNewp("");
   }
   catch(err){
    Swal.fire({ 
        icon: "error", 
        title: "Failed", 
        text: err.response?.data?.error || err.message
      });
   }finally{
    setLoading(false);
   }


  }
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/admin/dashboard/profile" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4">
          <FaArrowLeft size={14} />
          Back to Profile
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Change Password</h1>
        <p className="text-gray-500 mt-1">Update your password to keep your account secure</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FaLock className="text-primary" />
            Change Password
          </h2>
        </div>
        
        <form className="p-6" onSubmit={change}>
          <div className="max-w-xl mx-auto space-y-5">
            
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Current Password</label>
              <div className="relative">
                <input
                  name="currentPassword"
                  onChange={(e)=>setCurrent(e.target.value)}
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrent ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <div className="relative">
                <input
                  name="newPassword"
                  onChange={(e)=>setNewp(e.target.value)}
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNew ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  onChange={(e)=>setConfirm(e.target.value)}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Updating.." : "Update Password"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};