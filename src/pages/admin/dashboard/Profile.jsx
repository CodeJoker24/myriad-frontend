import { useState } from 'react';
import { FaUser,FaSave, FaLock, FaEye, FaEyeSlash, FaCamera,FaChevronDown, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export const Profile = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", 
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", 
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
  ];

  return (
    <div className="max-w-7xl mx-auto">
  
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
       
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <div className="text-center">
             
              <div className="relative inline-block">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg group-hover:border-primary transition-all duration-300">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <FaUser className="text-4xl text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FaCamera size={14} />
                  </div>
                </label>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mt-4">Your Name</h2>
              <p className="text-sm text-gray-500">youremail@example.com</p>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Member since 2024
                </p>
              </div>
            </div>
          </div>
        </div>

      
        <div className="lg:col-span-3 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaUser className="text-primary" />
                Personal Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="08012345678"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* State of Origin */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">State of Origin</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white appearance-none"
                    >
                      <option value="">Select state</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    placeholder="Enter your address"
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none bg-gray-50/50 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card - Split Layout */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaLock className="text-primary" />
                Change Password
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column - Password Inputs */}
                <div className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12 bg-gray-50/50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showCurrentPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12 bg-gray-50/50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition pr-12 bg-gray-50/50 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column - Password Requirements */}
                <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaLock className="text-primary" size={14} />
                    Password Requirements
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-xs text-gray-600">At least 8 characters long</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-xs text-gray-600">Contains uppercase & lowercase letters</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaTimesCircle className="text-gray-300 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-xs text-gray-400">Contains at least one number</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <FaTimesCircle className="text-gray-300 mt-0.5 flex-shrink-0" size={14} />
                      <span className="text-xs text-gray-400">Contains at least one special character</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FaLock className="text-primary" size={12} />
                      Password strength: <span className="text-yellow-600 font-medium">Medium</span>
                    </p>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2">
                      <div className="w-2/3 h-full bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md">
              <FaSave size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};