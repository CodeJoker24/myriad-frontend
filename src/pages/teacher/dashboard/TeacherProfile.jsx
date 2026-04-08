import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { FaUser, FaCamera, FaSave, FaSpinner, FaBook,FaChalkboardTeacher} from 'react-icons/fa';
import Swal from 'sweetalert2';
import imageCompression from "browser-image-compression";

const TeacherProfile = () => {
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState(null);  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [state, setState] = useState('');
  const [lga, setLga] = useState('');
  
  const [profileImage, setProfileImage] = useState(null); 
  const [selectedFile, setSelectedFile] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(null);    

  useEffect(() => {
    const fetchProfile = async () => {
      const teacherData = JSON.parse(localStorage.getItem('teacher'));
      if (!teacherData) return;

      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', teacherData.id)
          .single();

        if (error) throw error;

        if (data) {
          setTeacher(data);
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          setGender(data.gender || '');
          setState(data.state_of_origin || '');
          setLga(data.lga || '');
          setProfileImage(data.profile_image || null);
        }
      } catch (err) {
        console.error("Fetch error:", err.message);
      }
    };
    fetchProfile();
  }, []);

  
  const handleImageSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    Swal.fire('Invalid Type', 'Please upload a JPG, PNG, or WebP image.', 'warning');
    return;
  }

  try {
    // 2. Compression Options
    const options = {
      maxSizeMB: 0.6,          
      maxWidthOrHeight: 800,   
      useWebWorker: true,
    };

   
    const compressedFile = await imageCompression(file, options);

    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(compressedFile));
    setSelectedFile(compressedFile); 
    
  } catch (error) {
    console.error("Compression error:", error);
    Swal.fire('Error', 'Failed to process image', 'error');
  }
};

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = profileImage;

     
      if (selectedFile) {
       
        if (profileImage && profileImage.includes('avatars')) {
          const urlParts = profileImage.split('/avatars/');
          if (urlParts.length > 1) {
            const oldFilePath = urlParts[1];
            await supabase.storage.from('avatars').remove([oldFilePath]);
          }
        }

       
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${teacher.id}-${Date.now()}.${fileExt}`;
        const filePath = `teacher-profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

     
      const { error: updateError } = await supabase
        .from('teachers')
        .update({
          name,
          phone,
          address,
          gender,
          state_of_origin: state,
          lga,
          profile_image: finalImageUrl
        })
        .eq('id', teacher.id);

      if (updateError) throw updateError;

      
      const updatedTeacher = { 
        ...teacher, 
        name, phone, address, gender, 
        state_of_origin: state, lga, 
        profile_image: finalImageUrl 
      };

      setTeacher(updatedTeacher);
      setProfileImage(finalImageUrl);
      localStorage.setItem('teacher', JSON.stringify(updatedTeacher));
      
      
      window.dispatchEvent(new Event("userUpdated"));

      // UI Reset
      setSelectedFile(null);
      setPreviewUrl(null);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your information has been saved successfully!',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      Swal.fire('Update Failed', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-primary/5 border-4 border-white shadow-md">
                {previewUrl || profileImage ? (
                  <img src={previewUrl || profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-bold">
                    {name?.charAt(0) || 'T'}
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-2.5 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                <FaCamera size={16} />
                <input type="file" className="hidden" onChange={handleImageSelect} accept="image/*" />
              </label>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{name || 'Teacher Name'}</h2>
            <p className="text-sm text-gray-500 mb-4">{teacher?.email}</p>
            
            {teacher?.is_class_teacher_of && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                <FaChalkboardTeacher />
                FORM TEACHER: {teacher.is_class_teacher_of}
              </div>
            )}
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <FaBook className="text-primary" /> Academic Profile
              </h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Classes</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {teacher?.classes?.length > 0 ? teacher.classes.map(c => (
                    <span key={c} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold border border-blue-100">{c}</span>
                  )) : <span className="text-xs text-gray-400 italic">No classes assigned</span>}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subjects</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {teacher?.subjects?.length > 0 ? teacher.subjects.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-green-50 text-green-600 rounded-md text-[11px] font-bold border border-green-100">{s}</span>
                  )) : <span className="text-xs text-gray-400 italic">No subjects assigned</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaUser className="text-primary" /> Personal Information
              </h3>
              {selectedFile && (
                <span className="text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md animate-pulse">
                  New Image Pending Save
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Residential Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">State of Origin</label>
                <input value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">L.G.A</label>
                <input value={lga} onChange={(e) => setLga(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary outline-none transition" />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white px-10 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;