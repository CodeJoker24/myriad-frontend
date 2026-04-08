import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { 
  FaUser, FaCamera, FaSave, FaSpinner, FaBook, FaUsers, FaChalkboardTeacher 
} from 'react-icons/fa';
import Swal from 'sweetalert2';

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
      if (teacherData) {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', teacherData.id)
          .single();

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
      }
    };
    fetchProfile();
  }, []);

  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

  
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setSelectedFile(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalImageUrl = profileImage;

     
      if (selectedFile) {
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

     
      const { error } = await supabase
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

      if (error) throw error;

     
      const updatedTeacher = { 
        ...teacher, 
        name, phone, address, gender, 
        state_of_origin: state, lga, 
        profile_image: finalImageUrl 
      };

      setProfileImage(finalImageUrl);
      setTeacher(updatedTeacher);
      localStorage.setItem('teacher', JSON.stringify(updatedTeacher));
      
      window.dispatchEvent(new Event("userUpdated"));

     
      setSelectedFile(null);
      setPreviewUrl(null);

      Swal.fire('Success', 'Profile updated successfully!', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-full h-full rounded-2xl overflow-hidden bg-primary/10 border-4 border-white shadow-md">
               
                {previewUrl || profileImage ? (
                  <img src={previewUrl || profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary text-4xl font-bold">
                    {name?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 p-2 bg-primary text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <FaCamera size={14} />
                <input type="file" className="hidden" onChange={handleImageSelect} accept="image/*" />
              </label>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{name}</h2>
            <p className="text-sm text-gray-500">{teacher?.email}</p>
            
            {teacher?.is_class_teacher_of && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                <FaChalkboardTeacher />
                FORM TEACHER: {teacher.is_class_teacher_of}
              </div>
            )}
          </div>

          {/* Academic Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FaBook className="text-primary" /> Academic Assignments
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Class Teacher Role</label>
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {teacher?.is_class_teacher_of || "No Form Class Assigned"}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Classes</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {teacher?.classes?.length > 0 ? (
                    teacher.classes.map(c => (
                      <span key={c} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold border border-blue-100">
                        {c}
                      </span>
                    ))
                  ) : <p className="text-xs text-gray-400 italic">None</p>}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subjects Taught</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {teacher?.subjects?.length > 0 ? (
                    teacher.subjects.map(s => (
                      <span key={s} className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-[11px] font-bold border border-green-100">
                        {s}
                      </span>
                    ))
                  ) : <p className="text-xs text-gray-400 italic">None</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdateProfile} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaUser className="text-primary" /> Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Residential Address</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">State of Origin</label>
                <input value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">L.G.A</label>
                <input value={lga} onChange={(e) => setLga(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary outline-none transition" />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;