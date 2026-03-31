import { useState } from 'react';
import { FaEnvelope, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../../../db'; 
import Swal from 'sweetalert2';

export const TeacherChangePassword = () => {
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();

  
    const { value: email } = await Swal.fire({
      title: "Reset Password",
      input: "email",
      inputLabel: "Enter your teacher account email",
      inputPlaceholder: "teacher@school.com",
      showCancelButton: true,
      confirmButtonColor: "#3B82F6",
      inputValidator: (value) => {
        if (!value) return "Email is required!";
      }
    });

    
    if (email) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/teacher/setup-password`,
        });

        if (error) throw error;

        Swal.fire({
          icon: 'success',
          title: 'Link Sent!',
          text: `A secure reset link has been sent to ${email}.`,
          confirmButtonColor: "#3B82F6",
        });

      } catch (err) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: err.message 
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link to="/teacher/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-4">
          <FaArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Security</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaEnvelope className="text-primary text-3xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Update Password</h2>
        <p className="text-gray-500 mb-8">Click below to receive a secure password reset link via email.</p>

        <button
          onClick={handleSendResetEmail}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Processing...
            </>
          ) : (
            "Reset via Email"
          )}
        </button>
      </div>
    </div>
  );
};