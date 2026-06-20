import { useEffect, useState } from 'react';
import { supabase } from '../../../db';
import { 
  FaUser, FaIdCard, FaSchool, FaVenusMars, FaCheckCircle, 
  FaSpinner, FaCalendarAlt, FaEnvelope, FaExclamationCircle,
  FaUserGraduate, FaPhone, FaMapMarkerAlt, FaBirthdayCake,
  FaGraduationCap, FaBookOpen, FaClock, FaCalendarWeek
} from 'react-icons/fa';
import { format } from 'date-fns';

export const StudentProfile = () => {
  const studentSnapshot = JSON.parse(localStorage.getItem('student')) || {};
  
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeSession, setActiveSession] = useState('');
  const [activeTerm, setActiveTerm] = useState('');

  useEffect(() => {
    const fetchStudentProfileAndSettings = async () => {
      if (!studentSnapshot?.id) return;
      setLoading(true);
      try {
        const { data: settingsRows } = await supabase
          .from('academic_settings')
          .select('*')
          .eq('is_active', true);

        if (settingsRows) {
          const sessionRow = settingsRows.find(row => row.type === 'session');
          const termRow = settingsRows.find(row => row.type === 'term');
          if (sessionRow?.value) setActiveSession(sessionRow.value);
          if (termRow?.value) setActiveTerm(termRow.value);
        }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentSnapshot.id)
          .single();

        if (!studentError && studentData) {
          setProfile(studentData);
          const updatedSnap = { ...studentSnapshot, ...studentData };
          localStorage.setItem('student', JSON.stringify(updatedSnap));
        }
      } catch (err) {
        console.error("Failed compiling student security card profile context:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfileAndSettings();
  }, [studentSnapshot?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-white to-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationCircle className="text-red-500 text-2xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Profile Not Found</h3>
          <p className="text-sm text-gray-500 mt-2">Unable to load your profile. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-20 -translate-y-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-10 translate-y-10 blur-2xl"></div>
          
          <div className="relative px-6 md:px-8 py-6 md:py-8 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white/30">
              <span className="text-4xl md:text-5xl font-black uppercase">
                {profile.name ? profile.name.charAt(0) : <FaUser className="text-3xl" />}
              </span>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{profile.name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5">
                  <FaIdCard className="text-blue-200" size={12} />
                  {profile.student_id || 'N/A'}
                </span>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5">
                  <FaSchool className="text-blue-200" size={12} />
                  {profile.class_name || 'Unassigned'}
                </span>
                <span className="bg-emerald-500/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-emerald-100 flex items-center gap-1.5 border border-emerald-400/30">
                  <FaCheckCircle size={12} /> Active
                </span>
              </div>
            </div>
            
            <div className="flex gap-2 self-start md:self-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/10">
                <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Session</p>
                <p className="text-sm font-bold text-white">{activeSession || '2025/2026'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/10">
                <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Term</p>
                <p className="text-sm font-bold text-white">{activeTerm || 'Third Term'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FaUserGraduate className="text-blue-600" size={16} />
                Personal Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <FaUser className="text-blue-500 text-xs" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Full Name</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{profile.name}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <FaIdCard className="text-blue-500 text-xs" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Student ID</span>
                  </div>
                  <p className="text-sm font-mono font-bold text-blue-600">{profile.student_id || 'Not Assigned'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <FaVenusMars className="text-blue-500 text-xs" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 capitalize">{profile.gender || 'Not Specified'}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <FaEnvelope className="text-blue-500 text-xs" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 truncate">{profile.email || 'No email on file'}</p>
                </div>

                {profile.phone && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <FaPhone className="text-blue-500 text-xs" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{profile.phone}</p>
                  </div>
                )}

                {profile.date_of_birth && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <FaBirthdayCake className="text-blue-500 text-xs" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date of Birth</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      {format(new Date(profile.date_of_birth), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}

                {profile.address && (
                  <div className="sm:col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <FaMapMarkerAlt className="text-blue-500 text-xs" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Address</span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">{profile.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FaGraduationCap className="text-purple-600" size={16} />
                Academic Information
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaSchool className="text-blue-600 text-xs" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Class</span>
                </div>
                <p className="text-lg font-black text-blue-700">{profile.class_name || 'Unallocated'}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarWeek className="text-gray-500 text-xs" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Academic Session</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{activeSession || '2025/2026'}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaClock className="text-gray-500 text-xs" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Term</span>
                </div>
                <p className="text-sm font-bold text-gray-800">{activeTerm || 'Third Term'}</p>
              </div>

              <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-1">
                  <FaBookOpen className="text-purple-600 text-xs" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Account Status</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                    <FaCheckCircle size={12} /> Active
                  </span>
                  <span className="text-xs text-gray-500">• {profile.is_active ? 'Enrolled' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};