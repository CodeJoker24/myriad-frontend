import { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave, FaLock, FaCalendarAlt, FaGlobe, FaEye, FaEyeSlash } from 'react-icons/fa';

export const Profile = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-4xl text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{user.email}</p>
            <p className="text-xs text-gray-400">Member since 2024</p>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    defaultValue={user.name}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    defaultValue={user.email}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    defaultValue={user.phone}
                    placeholder="08012345678"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    defaultValue={user.dateOfBirth}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                </div>
              </div>

              {/* State of Origin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State of Origin</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaGlobe className="text-gray-400" />
                  </div>
                  <select
                    defaultValue={user.stateOfOrigin}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition appearance-none bg-white"
                  >
                    <option value="">Select state</option>
                    <option value="Abia">Abia</option>
                    <option value="Adamawa">Adamawa</option>
                    <option value="Akwa Ibom">Akwa Ibom</option>
                    <option value="Anambra">Anambra</option>
                    <option value="Bauchi">Bauchi</option>
                    <option value="Bayelsa">Bayelsa</option>
                    <option value="Benue">Benue</option>
                    <option value="Borno">Borno</option>
                    <option value="Cross River">Cross River</option>
                    <option value="Delta">Delta</option>
                    <option value="Ebonyi">Ebonyi</option>
                    <option value="Edo">Edo</option>
                    <option value="Ekiti">Ekiti</option>
                    <option value="Enugu">Enugu</option>
                    <option value="Gombe">Gombe</option>
                    <option value="Imo">Imo</option>
                    <option value="Jigawa">Jigawa</option>
                    <option value="Kaduna">Kaduna</option>
                    <option value="Kano">Kano</option>
                    <option value="Katsina">Katsina</option>
                    <option value="Kebbi">Kebbi</option>
                    <option value="Kogi">Kogi</option>
                    <option value="Kwara">Kwara</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Nasarawa">Nasarawa</option>
                    <option value="Niger">Niger</option>
                    <option value="Ogun">Ogun</option>
                    <option value="Ondo">Ondo</option>
                    <option value="Osun">Osun</option>
                    <option value="Oyo">Oyo</option>
                    <option value="Plateau">Plateau</option>
                    <option value="Rivers">Rivers</option>
                    <option value="Sokoto">Sokoto</option>
                    <option value="Taraba">Taraba</option>
                    <option value="Yobe">Yobe</option>
                    <option value="Zamfara">Zamfara</option>
                    <option value="FCT">FCT (Abuja)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <textarea
                    defaultValue={user.address}
                    placeholder="Enter your address"
                    rows="3"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Change Password</h2>

            <div className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
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

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                  <li>At least 8 characters long</li>
                  <li>Contains at least one uppercase letter</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all flex items-center gap-2">
              <FaSave /> Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};