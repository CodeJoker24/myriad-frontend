import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCalendarAlt, FaGlobe, FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import API from '../../../api';
import { supabase } from '../../../db';

export const Profile = () => {

  const [authUser, setAuthUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    stateOfOrigin: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: ''
  });


/* ---------------- FETCH USER ---------------- */

useEffect(() => {

  const fetchUser = async () => {

    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user");

      setAuthUser(user);

      const { data: profile, error } = await supabase
        .from("myriad_users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setFormData({
        name: profile?.name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        dateOfBirth: profile?.dateOfBirth || "",
        stateOfOrigin: profile?.stateOfOrigin || "",
        address: profile?.address || "",
        avatar: profile?.avatar || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (err) {

      console.error("Error fetching user:", err);

    } finally {

      setLoadingUser(false);

    }

  };

  fetchUser();

}, []);



/* ---------------- AUTH LISTENER ---------------- */

useEffect(() => {

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {

      if (session?.user) {

        setAuthUser(session.user);

      }

    }
  );

  return () => {

    listener.subscription.unsubscribe();

  };

}, []);



/* ---------------- HANDLE INPUT ---------------- */

const handleChange = (e) => {

  const { name, value } = e.target;

  setFormData(prev => ({
    ...prev,
    [name]: value
  }));

};



/* ---------------- SAVE PROFILE ---------------- */

const handleSave = async () => {

  if (!authUser) return;

  setLoading(true);

  try {

    let avatarUrl = formData.avatar;



/* -------- IMAGE UPLOAD -------- */

    if (image) {

      const formDataImg = new FormData();

      formDataImg.append('image', image);
      formDataImg.append('id', authUser.id);

      const uploadRes = await API.post(
        '/api/auth_routes/upload_profile_image',
        formDataImg,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (!uploadRes?.data?.imageUrl) {
        throw new Error("Image upload failed");
      }

      avatarUrl = uploadRes.data.imageUrl;

    }



/* -------- PROFILE UPDATE -------- */

    const profilePayload = {

      id: authUser.id,
      name: formData.name || null,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth || null,
      stateOfOrigin: formData.stateOfOrigin || null,
      address: formData.address || null,
      avatar: avatarUrl

    };

    const res = await API.put(
      '/api/auth_routes/update_profile',
      profilePayload
    );

    if (!res.data.success) {
      throw new Error(res.data.error || 'Profile update failed');
    }



/* -------- PASSWORD UPDATE -------- */

    if (formData.newPassword) {

      if (formData.newPassword !== formData.confirmPassword) {

        setLoading(false);

        Swal.fire({
          icon: 'error',
          title: 'Password Mismatch',
          text: 'New password and confirm password do not match'
        });

        return;

      }

      const passRes = await API.put('/api/auth_routes/update_password', {

        email: authUser.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword

      });

      if (!passRes.data.success) {

        throw new Error(passRes.data.error || 'Password update failed');

      }

      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: passRes.data.message
      });

    }



/* -------- UPDATE LOCAL STATE -------- */

    setFormData(prev => ({
      ...prev,
      name: profilePayload.name,
      phone: profilePayload.phone,
      dateOfBirth: profilePayload.dateOfBirth,
      stateOfOrigin: profilePayload.stateOfOrigin,
      address: profilePayload.address,
      avatar: avatarUrl,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));

    setImage(null);

    Swal.fire({
      icon: 'success',
      title: 'Profile Updated',
      text: 'All changes saved successfully'
    });



  } catch (err) {

    console.error("Save failed:", err);

    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err.message
    });

  } finally {

    setLoading(false);

  }

};



/* ---------------- LOADING ---------------- */

if (loadingUser) return <p>Loading profile...</p>;



/* ---------------- UI ---------------- */

return (

  <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {image ? <img src={URL.createObjectURL(image)} className="w-full h-full object-cover" /> :
                formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> :
                <FaUser className="text-4xl text-primary" />}
            </div>
            <div className="mt-3">
              <label className="cursor-pointer inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition">
                Change Photo
                <input type="file" accept="image/*" onChange={e => setImage(e.target.files[0])} className="hidden" />
              </label>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{formData.name}</h2>
            <p className="text-gray-500 text-sm mb-4">{formData.email}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Personal Information</h2>

            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400" />
                </div>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>

            {/* Date of Birth */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            </div>

            {/* State of Origin */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">State of Origin</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGlobe className="text-gray-400" />
                </div>
                <select name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white">
                  <option value="">Select state</option> <option value="Abia">Abia</option> <option value="Adamawa">Adamawa</option> <option value="Akwa Ibom">Akwa Ibom</option> <option value="Anambra">Anambra</option> <option value="Bauchi">Bauchi</option> <option value="Bayelsa">Bayelsa</option> <option value="Benue">Benue</option> <option value="Borno">Borno</option> <option value="Cross River">Cross River</option> <option value="Delta">Delta</option> <option value="Ebonyi">Ebonyi</option> <option value="Edo">Edo</option> <option value="Ekiti">Ekiti</option> <option value="Enugu">Enugu</option> <option value="Gombe">Gombe</option> <option value="Imo">Imo</option> <option value="Jigawa">Jigawa</option> <option value="Kaduna">Kaduna</option> <option value="Kano">Kano</option> <option value="Katsina">Katsina</option> <option value="Kebbi">Kebbi</option> <option value="Kogi">Kogi</option> <option value="Kwara">Kwara</option> <option value="Lagos">Lagos</option> <option value="Nasarawa">Nasarawa</option> <option value="Niger">Niger</option> <option value="Ogun">Ogun</option> <option value="Ondo">Ondo</option> <option value="Osun">Osun</option> <option value="Oyo">Oyo</option> <option value="Plateau">Plateau</option> <option value="Rivers">Rivers</option> <option value="Sokoto">Sokoto</option> <option value="Taraba">Taraba</option> <option value="Yobe">Yobe</option> <option value="Zamfara">Zamfara</option> <option value="FCT">FCT (Abuja)</option> </select>
              </div>
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400" />
                </div>
                <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full pl-10 pr-4 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"></textarea>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Change Password</h2>

            {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
              <div className="mb-4" key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    type={(field === 'currentPassword' ? showCurrentPassword : field === 'newPassword' ? showNewPassword : showConfirmPassword) ? 'text' : 'password'}
                    name={field}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <button type="button"
                    onClick={() => {
                      if (field === 'currentPassword') setShowCurrentPassword(!showCurrentPassword);
                      if (field === 'newPassword') setShowNewPassword(!showNewPassword);
                      if (field === 'confirmPassword') setShowConfirmPassword(!showConfirmPassword);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {(field === 'currentPassword' ? showCurrentPassword : field === 'newPassword' ? showNewPassword : showConfirmPassword) ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            ))}

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

          <div className="flex justify-end">
            <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>

);
};