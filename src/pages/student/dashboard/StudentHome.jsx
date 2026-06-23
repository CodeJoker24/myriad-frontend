import { useEffect, useState } from 'react';
import { supabase } from '../../../db';
import { 
  FaBook, FaCalendarCheck, FaClipboardList, FaUserGraduate, 
  FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaChevronRight,
  FaSchool, FaChartLine, FaTrophy, FaClock, FaTimes
} from 'react-icons/fa';

export const StudentHome = () => {
  const studentSnapshot = JSON.parse(localStorage.getItem('student')) || {};
  
  const [loading, setLoading] = useState(false);
  const [currentClass, setCurrentClass] = useState(studentSnapshot?.class_name || 'Unassigned');
  const [enrolledCount, setEnrolledCount] = useState(0); 
  const [promotionStatus, setPromotionStatus] = useState(null);
  const [dismissedPromotionId, setDismissedPromotionId] = useState(null);
  
  const [activeSession, setActiveSession] = useState('2025/2026');
  const [activeTerm, setActiveTerm] = useState('Third Term');
  const [attendanceCount, setAttendanceCount] = useState(0);

  const normalizeClassName = (str) => {
    if (!str) return '';
    return str.replace(/\s+/g, '').toLowerCase().trim();
  };

  useEffect(() => {
    const savedDismissedId = localStorage.getItem(`dismissed_promotion_${studentSnapshot?.id}`);
    if (savedDismissedId) {
      setDismissedPromotionId(savedDismissedId);
    }
  }, [studentSnapshot?.id]);

  useEffect(() => {
    const fetchLiveDashboardData = async () => {
      if (!studentSnapshot?.id) return;
      setLoading(true);
      try {
        const { data: settingsRows, error: settingsError } = await supabase
          .from('academic_settings')
          .select('*')
          .eq('is_active', true); 

        let currentSessionName = '2025/2026';
        let currentTermName = 'Third Term';

        if (!settingsError && settingsRows) {
          const sessionRow = settingsRows.find(row => row.type === 'session');
          const termRow = settingsRows.find(row => row.type === 'term');

          if (sessionRow?.value) currentSessionName = sessionRow.value;
          if (termRow?.value) currentTermName = termRow.value;
        }
        
        setActiveSession(currentSessionName);
        setActiveTerm(currentTermName);

        const { data: profileData, error: profileError } = await supabase
          .from('students')
          .select('class_name')
          .eq('id', studentSnapshot.id)
          .single();

        let rawClassString = currentClass;

        if (!profileError && profileData) {
          rawClassString = profileData.class_name || 'Unassigned';
          setCurrentClass(rawClassString);
          
          const updatedSnap = { ...studentSnapshot, class_name: rawClassString };
          localStorage.setItem('student', JSON.stringify(updatedSnap));
        }

        let coreClassLookup = rawClassString;
        let extractedDept = 'General';

        const upperRaw = rawClassString.toUpperCase();
        if (upperRaw.includes('SCIENCE')) {
          extractedDept = 'Science';
          coreClassLookup = rawClassString.replace(/science/i, '').trim(); 
        } else if (upperRaw.includes('BUSINESS')) {
          extractedDept = 'Business';
          coreClassLookup = rawClassString.replace(/business/i, '').trim();
        } else if (upperRaw.includes('ARTS') || upperRaw.includes('ART')) {
          extractedDept = 'Arts';
          coreClassLookup = rawClassString.replace(/arts/i, '').replace(/art/i, '').trim();
        } else if (upperRaw.includes('COMMERCE') || upperRaw.includes('COMMERCIAL')) {
          extractedDept = 'Commercial';
          coreClassLookup = rawClassString.replace(/commerce/i, '').replace(/commercial/i, '').trim();
        }

        if (coreClassLookup && coreClassLookup !== 'Unassigned') {
          const { data: curriculumRows, error: curriculumError } = await supabase
            .from('school_curriculum')
            .select('*');

          if (!curriculumError && curriculumRows) {
            const targetNormal = normalizeClassName(coreClassLookup);

            const matchingClassRows = curriculumRows.filter(row => {
              const rowNormal = normalizeClassName(row.class_name);
              return rowNormal === targetNormal;
            });

            const upperClass = coreClassLookup.toUpperCase();
            const isSeniorSecondary = upperClass.includes('SS') || upperClass.includes('SENIOR');

            let finalFilteredSubjects = [];

            if (isSeniorSecondary) {
              finalFilteredSubjects = matchingClassRows.filter(row => 
                (row.department && row.department.toLowerCase() === extractedDept.toLowerCase()) ||
                (row.department && row.department.toLowerCase() === 'general')
              );
            } else {
              finalFilteredSubjects = matchingClassRows.filter(row => 
                !row.department || row.department.toLowerCase() === 'general'
              );
            }

            setEnrolledCount(finalFilteredSubjects.length);
          }
        }

        const { data: attendanceRows, error: attError } = await supabase
          .from('attendance')
          .select('*')
          .eq('student_id', studentSnapshot.id);

        if (!attError && attendanceRows && attendanceRows.length > 0) {
          const currentTermLogs = attendanceRows.filter(row => {
            const rowSession = row.session_context || row.session || '';
            const rowTerm = row.term_context || row.term_id || row.term || '';
            
            return (
              normalizeClassName(rowSession) === normalizeClassName(currentSessionName) &&
              normalizeClassName(rowTerm) === normalizeClassName(currentTermName)
            );
          });

          const daysPresent = currentTermLogs.filter(row => row.status?.toLowerCase() === 'present').length;
          setAttendanceCount(daysPresent);
        } else {
          setAttendanceCount(0);
        }

        const { data: requestData, error: requestError } = await supabase
          .from('promotion_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (!requestError && requestData) {
          const currentBatch = requestData.find(req => 
            Array.isArray(req.student_ids) && req.student_ids.includes(studentSnapshot.id)
          );
          if (currentBatch) {
            setPromotionStatus(currentBatch);
          }
        }
      } catch (err) {
        console.error("Dashboard terminal system core linkage crashed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveDashboardData();
  }, [studentSnapshot?.id]);

  const handleDismissPromotion = () => {
    if (promotionStatus) {
      localStorage.setItem(`dismissed_promotion_${studentSnapshot?.id}`, promotionStatus.id);
      setDismissedPromotionId(promotionStatus.id);
    }
  };

  const shouldShowPromotion = () => {
    if (!promotionStatus) return false;
    if (dismissedPromotionId === promotionStatus.id) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{studentSnapshot?.name || 'Student'}</span>!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's an overview of your academic progress</p>
          </div>
          
          <div className="flex items-center gap-3 bg-linear-to-r from-slate-900 to-slate-800 text-white px-4 py-2.5 rounded-xl shadow-lg self-start md:self-auto">
            <div className="p-2 bg-white/10 rounded-lg text-blue-400">
              <FaSchool className="text-sm" />
            </div>
            <div className="text-xs">
              <p className="text-slate-400 font-medium">Active Academic Cycle</p>
              <p className="font-bold tracking-wide text-white flex items-center gap-1.5 mt-0.5">
                <span>{activeSession}</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-500"></span>
                <span className="text-blue-300 font-semibold">{activeTerm}</span>
              </p>
            </div>
          </div>
        </div>

        {shouldShowPromotion() && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            promotionStatus.status === 'pending' ? 'bg-amber-50 border-amber-200' :
            promotionStatus.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-4 flex-1">
              <div className="shrink-0 text-xl">
                {promotionStatus.status === 'pending' && <FaHourglassHalf className="text-amber-600 animate-pulse" />}
                {promotionStatus.status === 'approved' && <FaCheckCircle className="text-emerald-600" />}
                {promotionStatus.status === 'rejected' && <FaTimesCircle className="text-red-600" />}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-xs uppercase tracking-wider ${
                  promotionStatus.status === 'pending' ? 'text-amber-800' :
                  promotionStatus.status === 'approved' ? 'text-emerald-800' : 
                  'text-red-800'
                }`}>
                  {promotionStatus.status === 'pending' && '⏳ Promotion Request Pending'}
                  {promotionStatus.status === 'approved' && '✅ Promotion Approved!'}
                  {promotionStatus.status === 'rejected' && '❌ Promotion Request Rejected'}
                </p>
                <p className="text-xs opacity-90 mt-0.5 text-gray-600">
                  {promotionStatus.status === 'pending' && `Your teacher has recommended you for promotion to ${promotionStatus.requested_class}. Awaiting admin approval.`}
                  {promotionStatus.status === 'approved' && `Congratulations! You have been promoted from ${promotionStatus.from_class} to ${promotionStatus.requested_class}.`}
                  {promotionStatus.status === 'rejected' && `${promotionStatus.remarks || 'Please consult your teacher for more information.'}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismissPromotion}
              className="shrink-0 p-2 hover:bg-white/50 rounded-xl transition-all text-gray-500 hover:text-gray-700"
              title="Dismiss this notification"
            >
              <FaTimes size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <FaUserGraduate size={20} />
              </div>
              <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                {currentClass}
              </span>
            </div>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Current Class</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{currentClass}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                <FaBook size={20} />
              </div>
              <span className="text-2xl font-bold text-purple-600">{enrolledCount}</span>
            </div>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Enrolled Subjects</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{enrolledCount} Subjects</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <FaCalendarCheck size={20} />
              </div>
              <span className="text-2xl font-bold text-emerald-600">{attendanceCount}</span>
            </div>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Days Present</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">{attendanceCount} Days</p>
          </div>

          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-linear-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
                <FaTrophy size={20} />
              </div>
              <span className="text-2xl font-bold text-amber-600">-</span>
            </div>
            <p className="text-gray-500 font-medium text-xs uppercase tracking-wider">Overall Grade</p>
            <p className="text-lg font-bold text-gray-800 mt-0.5">Not Available</p>
          </div>
        </div>
      </div>
    </div>
  );
};