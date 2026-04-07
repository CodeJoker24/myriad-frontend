import { useState, useEffect } from 'react';
import { FaUser, FaCamera, FaChevronDown } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { supabase } from '../../../db'; // Ensure this path is correct

export const TeacherProfile = () => {
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [stateOfOrigin, setStateOfOrigin] = useState("");
  const [lga, setLga] = useState("");
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const teacherData = JSON.parse(localStorage.getItem('teacher'));
    if (teacherData) {
      setTeacher(teacherData);
      setName(teacherData.name || "");
      setEmail(teacherData.email || "");
      setPhone(teacherData.phone || "");
      setGender(teacherData.gender || "");
      setReligion(teacherData.religion || "");
      setStateOfOrigin(teacherData.state_of_origin || "");
      setLga(teacherData.lga || "");
    }
  }, []);

  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", 
    "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", 
    "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", 
    "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", 
    "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
  ];

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return Swal.fire("Error", "Image is too large (Max 2MB)", "error");
    }
    
    if (preview) URL.revokeObjectURL(preview);

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = teacher?.profile_image;

     
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `teacher-${teacher.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, selectedFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        finalImageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      }

    
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          name,
          phone,
          gender,
          religion,
          state_of_origin: stateOfOrigin,
          lga,
          profile_image: finalImageUrl
        })
        .eq('id', teacher?.id);

      if (updateError) throw updateError;

    
      const updatedTeacher = { 
        ...teacher, 
        name, phone, gender, religion, 
        state_of_origin: stateOfOrigin, lga, 
        profile_image: finalImageUrl 
      };
      
      localStorage.setItem('teacher', JSON.stringify(updatedTeacher));
      setTeacher(updatedTeacher);
      setPreview(null);
      setSelectedFile(null);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your changes have been saved successfully!',
        timer: 2000,
      });
    } catch (err) {
      console.error("Update Error:", err);
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleUpdate}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teacher Profile</h1>
          <p className="text-gray-500 mt-1">Update your professional and personal details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column: Avatar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="text-center">
                <div className="relative inline-block">
                  <label className="cursor-pointer group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg group-hover:border-primary transition-all duration-300 relative">
                      {preview ? (
                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                      ) : teacher?.profile_image ? (
                        <img src={teacher.profile_image} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                          <FaUser className="text-4xl text-gray-300" />
                        </div>
                      )}
                      {loading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg">
                      <FaCamera size={14} />
                    </div>
                  </label>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mt-4">{teacher?.name}</h2>
                <p className="text-sm text-gray-500">{teacher?.email}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Fields */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email (Fixed)</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Religion */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Religion</label>
                  <select
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  >
                    <option value="">Select Religion</option>
                    <option value="Christianity">Christianity</option>
                    <option value="Islam">Islam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* State of Origin */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">State of Origin</label>
                  <div className="relative">
                    <select
                      value={stateOfOrigin}
                      onChange={(e) => setStateOfOrigin(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl appearance-none outline-none"
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* LGA */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">LGA</label>
                  <input
                    type="text"
                    value={lga}
                    onChange={(e) => setLga(e.target.value)}
                    placeholder="Enter LGA"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-medium transition-all shadow-sm flex items-center gap-2"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};