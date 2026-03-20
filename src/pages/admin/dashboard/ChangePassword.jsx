import { FaLock, FaArrowLeft } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export const ChangePassword = () => {
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
        
        <form className="p-6">
          <div className="max-w-xl mx-auto space-y-5">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Current Password</label>
              <input
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                name="newPassword"
                type="password"
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Update Password
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};