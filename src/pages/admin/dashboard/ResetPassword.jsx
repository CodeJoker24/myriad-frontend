import { useState } from 'react';
import { supabase } from '../../../db'; 
import { useNavigate } from 'react-router-dom';
import {FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

export const ResetPassword = () => {
  const [newp, setNewp] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (newp !== confirm) {
      return Swal.fire({ icon: "error", title: "Oops", text: "Passwords do not match!" });
    }
    if (newp.length < 6) {
      return Swal.fire({ icon: "error", text: "Password must be at least 6 characters" });
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newp 
      });

      if (error) throw error;

      await Swal.fire({
        icon: 'success',
        title: 'Password Updated!',
        text: 'Your new password has been set. You can now log in.',
        confirmButtonColor: "#3B82F6",
      });

      navigate('/admin/signin'); 
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Password</h2>
          <p className="text-gray-500 mt-2">Please enter your new secure password below.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={newp}
                onChange={(e) => setNewp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
            </div>
          </div>

        
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
};