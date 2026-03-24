import { FaUser, FaCamera, FaChevronDown } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useState} from 'react';
import API from '../../../api';



export const Profile = () => {
  const [loading, setLoading] = useState(false)
  const user = JSON.parse(localStorage.getItem('user'));
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email ||"");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [stateOfOrigin, setStateOfOrigin] = useState(user?.stateOfOrigin || "");
  const [address, setAddress] = useState(user?.address || "")

 const Update = async (x) => {
    x.preventDefault();
    setLoading(true);


   
    if (!name || !email || !phone || !dateOfBirth || !stateOfOrigin || !address) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "All fields are required! Please fill them out.",
        confirmButtonColor: "#3B82F6",
      });
      setLoading(false);
      return;
    }

    try {
      
      
      const response = await API.put(`/api/auth_routes/update-profile/${user.id}`, {
        name,
        email,
        phone,
        dateOfBirth,
        stateOfOrigin,
        address
      });

  

      
      if (response.data && response.data.user) {
       
        const updatedUser = { ...user, ...response.data.user };
        
        
        localStorage.setItem('user', JSON.stringify(updatedUser));

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Your changes have been saved successfully!',
          timer: 2000,
          showConfirmButton: true
        });
      } else {
        
        Swal.fire({
          icon: 'warning',
          title: 'Saved with issues',
          text: 'Profile updated, but we couldn\'t refresh your local data. Please reload the page.',
        });
      }
    } catch (err) {
      console.error("6. API Error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.error || "Something went wrong",
      });
    } finally {
      setLoading(false);
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
      <form className="max-w-7xl mx-auto" onSubmit={Update}>
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
                    <input type="file" accept="image/*" className="hidden" />
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg group-hover:border-primary transition-all duration-300">
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <FaUser className="text-4xl text-primary/60" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FaCamera size={14} />
                    </div>
                  </label>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mt-4">{user?.name}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
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
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      name="name"
                      type="text"
                      onChange={(e)=>setName(e.target.value)}
                      value={name}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                      placeholder="08012345678"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      name="dob"
                      type="date"
                      onChange={(e)=>setDateOfBirth(e.target.value)}
                      value={dateOfBirth}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-gray-50/50 focus:bg-white"
                    />
                  </div>

                  {/* State of Origin */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">State of Origin</label>
                    <div className="relative">
                      <select
                        name="state"
                        onChange={(e)=>setStateOfOrigin(e.target.value)}
                        value={stateOfOrigin}
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
                      name="address"
                      value={address}
                      onChange={(e)=>setAddress(e.target.value)}
                      placeholder="Enter your address"
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                disabled={loading}
              >
                {loading ? "Saving...." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};