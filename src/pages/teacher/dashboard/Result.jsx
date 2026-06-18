import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { 
  FaSpinner, FaSave, FaBook, FaSchool, FaCalculator, FaUserGraduate, 
  FaChartLine, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaSearch, FaPrint, FaDownload, FaEye, FaEyeSlash, FaUserCheck, FaCommentMedical, FaClipboardCheck,
  FaCalendarCheck
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { logActivity } from '../../../db';

export const Result = () => {
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [activeSession, setActiveSession] = useState('');
  const [activeTerm, setActiveTerm] = useState('');
  const [gradingScales, setGradingScales] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [subView, setSubView] = useState('entry');
  const [promotionData, setPromotionData] = useState([]);
  const [termRemarksData, setTermRemarksData] = useState([]);
  const [isThirdTerm, setIsThirdTerm] = useState(false);
  const [totalTermDays, setTotalTermDays] = useState(60);
  const [scoreViewAttendance, setScoreViewAttendance] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializePortal();
  }, []);

  useEffect(() => {
    if (selectedSubject && teacherProfile?.is_class_teacher_of) {
      loadStudentsAndScores();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (!teacherProfile?.is_class_teacher_of) return;
    
    if (subView === 'promotion') {
      loadCumulativePromotionEngine();
    } else if (subView === 'term_remarks') {
      loadTermRemarksEngine();
    }
  }, [subView, totalTermDays]); 

  const initializePortal = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('name, is_class_teacher_of')
        .eq('id', user.id)
        .maybeSingle();

      if (tError) throw tError;
      if (!teacher || !teacher.is_class_teacher_of) {
        Swal.fire('Access Denied', 'No active classroom assignment detected for this teacher profile.', 'error');
        return;
      }
      setTeacherProfile(teacher);

      const { data: settingsData, error: settingsError } = await supabase
        .from('academic_settings')
        .select('*')
        .eq('is_active', true);

      if (settingsError) throw settingsError;

      const activeSessionRow = settingsData.find(s => s.type === 'session');
      const activeTermRow = settingsData.find(s => s.type === 'term');

      if (!activeSessionRow || !activeTermRow) {
        Swal.fire('Configuration Missing', 'An Admin must set an active Session and Term in the Settings hub first.', 'warning');
        return;
      }

      setActiveSession(activeSessionRow.value);
      
      const termName = activeTermRow.value.split(' (')[0];
      setActiveTerm(termName);
      
      const termNameLower = termName.toLowerCase();
      setIsThirdTerm(termNameLower.includes('3rd') || termNameLower.includes('third'));

     
      if (activeTermRow.start_date && activeTermRow.end_date) {
        let start = new Date(activeTermRow.start_date);
        const end = new Date(activeTermRow.end_date);
        let weekdayCount = 0;

        while (start <= end) {
          const dayOfWeek = start.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
            weekdayCount++;
          }
          start.setDate(start.getDate() + 1);
        }
        setTotalTermDays(weekdayCount || 60);
      } else {
        setTotalTermDays(60); 
      }

      const { data: scales, error: scalesError } = await supabase
        .from('grading_scales')
        .select('*');

      if (scalesError) throw scalesError;
      setGradingScales(scales || []);

      const teacherClass = teacher.is_class_teacher_of.trim();
      let baseClassName = teacherClass;
      
      const classMatch = teacherClass.match(/^(basic\s+\d+|jss\s+\d+|ss\s+\d+|jss\d+|ss\d+|creche|nursery\s+\d+|nursery\d+)/i);
      if (classMatch) {
        baseClassName = classMatch[0].trim();
      }

      let secondaryVariant = baseClassName;
      if (baseClassName.toUpperCase().startsWith('JSS') || baseClassName.toUpperCase().startsWith('SS')) {
        if (baseClassName.includes(' ')) {
          secondaryVariant = baseClassName.replace(/\s+/g, '');
        } else {
          const letters = baseClassName.match(/[a-zA-Z]+/)[0];
          const numbers = baseClassName.match(/\d+/)[0];
          secondaryVariant = `${letters} ${numbers}`;
        }
      }

      const { data: curriculum, error: cError } = await supabase
        .from('school_curriculum')
        .select('subject_name, department')
        .or(`class_name.ilike."${teacherClass}",class_name.ilike."${baseClassName}",class_name.ilike."${secondaryVariant}"`);

      if (cError) throw cError;
      setAvailableSubjects(curriculum || []);

    } catch (err) {
      Swal.fire('System Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsAndScores = async () => {
    try {
      setLoading(true);
      
      const { data: roster, error: rError } = await supabase
        .from('students')
        .select('id, student_id, name')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rError) throw rError;

      const { data: existingMarks, error: mError } = await supabase
        .from('student_marks')
        .select('*')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('subject_name', selectedSubject)
        .eq('term', activeTerm)
        .eq('session', activeSession);

      if (mError) throw mError;

      
      const studentIds = roster.map(s => s.id);
      const { data: liveAttendance, error: attError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('term_context', activeTerm)
        .eq('session_context', activeSession)
        .ilike('status', 'Present');

      const attendanceMap = {};
      roster.forEach(s => { attendanceMap[s.id] = 0; });
      if (!attError && liveAttendance) {
        liveAttendance.forEach(row => {
          if (attendanceMap[row.student_id] !== undefined) {
            attendanceMap[row.student_id] += 1;
          }
        });
      }
      setScoreViewAttendance(attendanceMap);

      const initialScores = {};
      roster.forEach(student => {
        const matchedRecord = existingMarks?.find(m => m.student_id === student.id);
        initialScores[student.id] = {
          ca_score: matchedRecord ? (matchedRecord.ca_score ?? '') : '',
          exam_score: matchedRecord ? (matchedRecord.exam_score ?? '') : ''
        };
      });

      setStudents(roster || []);
      setScores(initialScores);

    } catch (err) {
      Swal.fire('Roster Fetch Failure', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

 
  const loadTermRemarksEngine = async () => {
    try {
      setLoading(true);
      const { data: roster, error: rError } = await supabase
        .from('students')
        .select('id, student_id, name')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rError) throw rError;

      const { data: liveAttendance, error: attError } = await supabase
        .from('attendance')
        .select('student_id, date, status')
        .eq('term_context', activeTerm)
        .eq('session_context', activeSession);

      if (attError) throw attError;

      const { data: savedComments, error: cError } = await supabase
        .from('term_remarks')
        .select('*')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('term', activeTerm)
        .eq('session', activeSession);

      if (cError) throw cError;

      const processedRemarks = roster.map(student => {
        const existingRow = savedComments?.find(c => c.student_id === student.id);
        
       
        const studentPresentDays = liveAttendance?.filter(
          a => a.student_id === student.id && a.status.toLowerCase() === 'present'
        ).length || 0;

        return {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          teacher_remarks: existingRow ? (existingRow.teacher_remarks || '') : '',
          attendance_present: studentPresentDays, 
          attendance_total: totalTermDays 
        };
      });

      setTermRemarksData(processedRemarks);
    } catch (err) {
      Swal.fire('Fetch Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const loadCumulativePromotionEngine = async () => {
    try {
      setLoading(true);
      
      const { data: roster, error: rError } = await supabase
        .from('students')
        .select('id, student_id, name')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rError) throw rError;

      const { data: annualMarks, error: mError } = await supabase
        .from('student_marks')
        .select('*')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('session', activeSession);

      if (mError) throw mError;

      const { data: savedDecisions } = await supabase
        .from('student_promotions')
        .select('*')
        .eq('class_name', teacherProfile.is_class_teacher_of)
        .eq('session', activeSession);

      const processedRoster = roster.map(student => {
        const studentAllScores = annualMarks?.filter(m => m.student_id === student.id) || [];
        
        const subjectsMap = {};
        studentAllScores.forEach(mark => {
          if (!subjectsMap[mark.subject_name]) {
            subjectsMap[mark.subject_name] = { t1: null, t2: null, t3: null };
          }
          const tName = mark.term.toLowerCase();
          if (tName.includes('1st') || tName.includes('first')) subjectsMap[mark.subject_name].t1 = mark.total_score;
          if (tName.includes('2nd') || tName.includes('second')) subjectsMap[mark.subject_name].t2 = mark.total_score;
          if (tName.includes('3rd') || tName.includes('third')) subjectsMap[mark.subject_name].t3 = mark.total_score;
        });

        let totalSubjectsCount = Object.keys(subjectsMap).length;
        let runningCumulativeSum = 0;

        Object.values(subjectsMap).forEach(sub => {
          const termsPresent = [sub.t1, sub.t2, sub.t3].filter(v => v !== null);
          const subAverage = termsPresent.length > 0 ? (termsPresent.reduce((a, b) => a + b, 0) / termsPresent.length) : 0;
          runningCumulativeSum += subAverage;
        });

        const finalAnnualAverage = totalSubjectsCount > 0 ? Math.round(runningCumulativeSum / totalSubjectsCount) : 0;
        const existingRow = savedDecisions?.find(d => d.student_id === student.id);

        let computedDecision = 'Repeat';
        if (finalAnnualAverage >= 50) computedDecision = 'Promoted';
        else if (finalAnnualAverage >= 45) computedDecision = 'Promoted on Trial';

        return {
          id: student.id,
          student_id: student.student_id,
          name: student.name,
          annual_average: finalAnnualAverage,
          decision: existingRow ? existingRow.decision : computedDecision,
          teacher_remarks: existingRow ? existingRow.teacher_remarks : '',
          principal_remarks: existingRow ? existingRow.principal_remarks : ''
        };
      });

      setPromotionData(processedRoster);
    } catch (err) {
      Swal.fire('Engine Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateGradeMetrics = (ca, exam) => {
    const numericCA = parseFloat(ca) || 0;
    const numericExam = parseFloat(exam) || 0;
    const total = numericCA + numericExam;

    if (ca === '' && exam === '') return { total: 0, grade: '-', remark: '-' };

    const matchedRule = gradingScales.find(
      scale => total >= parseFloat(scale.minScore) && total <= parseFloat(scale.maxScore)
    );

    return {
      total,
      grade: matchedRule ? matchedRule.grade : 'F9',
      remark: matchedRule ? matchedRule.remark : 'Fail'
    };
  };

  const handleScoreChange = (studentId, field, value) => {
    if (value !== '' && (parseFloat(value) < 0 || isNaN(value))) return;
    if (field === 'ca_score' && parseFloat(value) > 40) return;
    if (field === 'exam_score' && parseFloat(value) > 60) return;

    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleRemarksValueChange = (idx, field, value) => {
    const updated = [...termRemarksData];
    updated[idx][field] = value;
    setTermRemarksData(updated);
  };

  const handlePromotionValueChange = (idx, field, value) => {
    const updated = [...promotionData];
    updated[idx][field] = value;
    setPromotionData(updated);
  };

  const handleSaveResults = async () => {
    if (!selectedSubject) return;
    setSaveLoading(true);

    try {
      const recordsToUpsert = students.map(student => {
        const studentScores = scores[student.id] || { ca_score: '', exam_score: '' };
        const metrics = calculateGradeMetrics(studentScores.ca_score, studentScores.exam_score);

        return {
          student_id: student.id,
          student_name: student.name,
          class_name: teacherProfile.is_class_teacher_of,
          subject_name: selectedSubject,
          term: activeTerm,
          session: activeSession,
          ca_score: studentScores.ca_score !== '' ? parseFloat(studentScores.ca_score) : 0,
          exam_score: studentScores.exam_score !== '' ? parseFloat(studentScores.exam_score) : 0,
          total_score: metrics.total,
          final_grade: metrics.grade,
          final_remark: metrics.remark
        };
      });

      const { error } = await supabase
        .from('student_marks')
        .upsert(recordsToUpsert, { onConflict: 'student_id,subject_name,term,session' });

      if (error) throw error;

      await logActivity(`Teacher ${teacherProfile.name} saved records for ${selectedSubject} (${teacherProfile.is_class_teacher_of})`, 'results');
      Swal.fire('Records Saved!', 'Calculated grades snapshot updated.', 'success');
      loadStudentsAndScores();

    } catch (err) {
      Swal.fire('Save Failure', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveTermRemarks = async () => {
    setSaveLoading(true);
    try {
      const rowsToUpsert = termRemarksData.map(student => ({
        student_id: student.id,
        class_name: teacherProfile.is_class_teacher_of,
        term: activeTerm,
        session: activeSession,
        teacher_remarks: student.teacher_remarks,
        attendance_present: student.attendance_present,
        attendance_total: student.attendance_total
      }));

      const { error } = await supabase
        .from('term_remarks')
        .upsert(rowsToUpsert, { onConflict: 'student_id,term,session' });

      if (error) throw error;

      await logActivity(`Teacher ${teacherProfile.name} saved automated records for ${activeTerm}`, 'remarks');
      Swal.fire('Comments Logged!', `Terminal remarks and smart attendance loaded flawlessly.`, 'success');
      loadTermRemarksEngine();
    } catch (err) {
      Swal.fire('Save Failed', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSavePromotions = async () => {
    setSaveLoading(true);
    try {
      const upsertRows = promotionData.map(student => ({
        student_id: student.id,
        class_name: teacherProfile.is_class_teacher_of,
        session: activeSession,
        annual_average: student.annual_average,
        decision: student.decision,
        teacher_remarks: student.teacher_remarks,
        principal_remarks: student.principal_remarks
      }));

      const { error } = await supabase
        .from('student_promotions')
        .upsert(upsertRows, { onConflict: 'student_id,session' });

      if (error) throw error;

      await logActivity(`Teacher ${teacherProfile.name} compiled annual decisions for ${teacherProfile.is_class_teacher_of}`, 'promotions');
      Swal.fire('Decisions Locked!', 'Cumulative summaries saved successfully.', 'success');
    } catch (err) {
      Swal.fire('Save Failed', err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalScoreColor = (score) => {
    if (score >= 70) return 'from-emerald-400 to-emerald-600';
    if (score >= 50) return 'from-blue-400 to-blue-600';
    if (score >= 40) return 'from-yellow-400 to-yellow-600';
    if (score > 0) return 'from-red-400 to-red-600';
    return 'from-gray-400 to-gray-600';
  };

  const getGradeColor = (grade) => {
    if (grade.includes('1') || grade.includes('2') || grade.includes('3') || ['A','B','C'].some(g => grade.startsWith(g))) {
      return 'success';
    }
    if (grade.includes('9') || grade.startsWith('F')) {
      return 'danger';
    }
    return 'warning';
  };

  const calculateStatistics = () => {
    if (students.length === 0) return null;
    
    let totalSum = 0;
    let passedCount = 0;
    let failedCount = 0;
    
    students.forEach(student => {
      const ca = parseFloat(scores[student.id]?.ca_score) || 0;
      const exam = parseFloat(scores[student.id]?.exam_score) || 0;
      const total = ca + exam;
      totalSum += total;
      if (total >= 40) passedCount++;
      else if (total > 0) failedCount++;
    });
    
    return {
      average: (totalSum / students.length).toFixed(1),
      passed: passedCount,
      failed: failedCount,
      total: students.length
    };
  };

  if (loading && students.length === 0 && promotionData.length === 0 && termRemarksData.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading assessment ledger...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStatistics();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        
        {/* Banner */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-2xl mb-6 overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
            <div className="relative px-5 sm:px-7 py-5 sm:py-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500/20 backdrop-blur-sm p-1.5 rounded-lg">
                      <FaSchool className="text-blue-400 text-sm" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Class Assessment Hub</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Smart Grade Book Hub</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-white">📚 {teacherProfile?.is_class_teacher_of}</span>
                    </div>
                    <div className="bg-indigo-500/30 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-indigo-200">✨ Active Class Teacher</span>
                    </div>
                    {/* ATTENDANCE TIME MATRIX BADGE */}
                    <div className="bg-purple-500/20 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-purple-500/30">
                      <FaCalendarCheck className="text-purple-300 text-xs" />
                      <span className="text-xs font-semibold text-purple-200">Term Span: {totalTermDays} Days</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Session</p>
                    <p className="text-sm font-black text-white">{activeSession || 'Unset'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Term</p>
                    <p className="text-sm font-black text-blue-400">{activeTerm || 'Unset'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

       
        <div className="flex flex-wrap border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setSubView('entry')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all flex items-center gap-2 ${subView === 'entry' ? 'bg-white border-t-2 border-l border-r border-gray-200 text-blue-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <FaCalculator /> Subject Score Entry
          </button>

          <button
            onClick={() => setSubView('term_remarks')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all flex items-center gap-2 ${subView === 'term_remarks' ? 'bg-white border-t-2 border-l border-r border-gray-200 text-emerald-600 shadow-xs' : 'text-gray-500 hover:text-emerald-800'}`}
          >
            <FaCommentMedical /> {activeTerm} Remarks & Smart Attendance 📝
          </button>

          <button
            onClick={() => setSubView('promotion')}
            className={`px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm rounded-t-xl transition-all flex items-center gap-2 ${subView === 'promotion' ? 'bg-white border-t-2 border-l border-r border-gray-200 text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <FaUserCheck /> End of Year Promotion Sheet {isThirdTerm && <span className="hidden sm:inline bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">3rd Term Only</span>}
          </button>
        </div>

      
        {subView === 'entry' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 mb-6">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2  flex items-center gap-2">
                <FaBook className="text-blue-500" />
                Select Subject
              </label>
              <div className="relative">
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-semibold text-gray-700 cursor-pointer appearance-none transition-all"
                >
                  <option value="">Choose a subject from curriculum</option>
                  {availableSubjects.map((sub, idx) => (
                    <option key={idx} value={sub.subject_name}>
                      {sub.subject_name} {sub.department !== 'General' ? `(${sub.department})` : ''}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <FaBook className="text-gray-400 text-sm" />
                </div>
              </div>
            </div>

            {!selectedSubject ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center">
                <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaCalculator className="text-3xl text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Subject Selected</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">Please select a subject from your curriculum to begin recording scores</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-linear-to-r from-gray-50 to-white px-4 sm:px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-green-100 px-2.5 py-1 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Grading Scale Linked</span>
                        </div>
                      </div>
                      {stats && (
                        <button
                          onClick={() => setShowSummary(!showSummary)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FaChartLine className="text-xs" />
                          {showSummary ? 'Hide' : 'Show'} Summary
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleSaveResults}
                      disabled={saveLoading}
                      className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      {saveLoading ? 'Saving...' : 'Save Roster Scores'}
                    </button>
                  </div>

                  {showSummary && stats && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-blue-50/50 rounded-xl p-3 text-center border border-blue-100">
                        <p className="text-xs text-gray-500 font-medium">Average Score</p>
                        <p className="text-2xl font-bold text-blue-700">{stats.average}%</p>
                      </div>
                      <div className="bg-emerald-50/50 rounded-xl p-3 text-center border border-emerald-100">
                        <p className="text-xs text-gray-500 font-medium">Passed</p>
                        <p className="text-2xl font-bold text-emerald-700">{stats.passed}</p>
                      </div>
                      <div className="bg-red-50/50 rounded-xl p-3 text-center border border-red-100">
                        <p className="text-xs text-gray-500 font-medium">Failed</p>
                        <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                      </div>
                      <div className="bg-purple-50/50 rounded-xl p-3 text-center border border-purple-100">
                        <p className="text-xs text-gray-500 font-medium">Total Students</p>
                        <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
                      </div>
                    </div>
                  )}
                </div>

                {students.length > 0 && (
                  <div className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>
                )}

                {!mobileView ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-12 text-center">#</th>
                          <th className="py-3.5 px-4">ID</th>
                          <th className="py-3.5 px-4">Name</th>
                          <th className="py-3.5 px-4 text-center text-purple-600">Attendance</th>
                          <th className="py-3.5 px-4 text-center w-32">CA (40)</th>
                          <th className="py-3.5 px-4 text-center w-32">Exam (60)</th>
                          <th className="py-3.5 px-4 text-center w-24">Total</th>
                          <th className="py-3.5 px-4 text-center w-24">Grade</th>
                          <th className="py-3.5 px-4">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student, idx) => {
                          const currentCA = scores[student.id]?.ca_score ?? '';
                          const currentExam = scores[student.id]?.exam_score ?? '';
                          const metrics = calculateGradeMetrics(currentCA, currentExam);
                          const gradeColor = getGradeColor(metrics.grade);
                          const scorePresentDays = scoreViewAttendance[student.id] || 0;

                          return (
                            <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3 px-4 text-center text-xs font-semibold text-gray-400">{idx + 1}</td>
                              <td className="py-3 px-4 text-xs font-mono font-bold text-blue-600">{student.student_id}</td>
                              <td className="py-3 px-4 font-semibold text-gray-800">{student.name}</td>
                              
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-100/60">
                                  <span>{scorePresentDays}</span>
                                  <span className="text-purple-300">/</span>
                                  <span className="text-purple-400 font-medium">{totalTermDays}d</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <input 
                                  type="number"
                                  placeholder="0"
                                  max="40"
                                  value={currentCA}
                                  onChange={(e) => handleScoreChange(student.id, 'ca_score', e.target.value)}
                                  className="w-full text-center p-2 border-2 border-gray-200 rounded-lg font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input 
                                  type="number"
                                  placeholder="0"
                                  max="60"
                                  value={currentExam}
                                  onChange={(e) => handleScoreChange(student.id, 'exam_score', e.target.value)}
                                  className="w-full text-center p-2 border-2 border-gray-200 rounded-lg font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-black text-sm bg-linear-to-r ${getTotalScoreColor(metrics.total)} text-white`}>
                                  {metrics.total}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center justify-center font-bold px-2.5 py-1 rounded-md text-xs border ${
                                  gradeColor === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                                  gradeColor === 'danger' ? 'bg-red-50 border-red-200 text-red-600' :
                                  'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                  {metrics.grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-semibold text-gray-600">{metrics.remark}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredStudents.map((student) => {
                      const currentCA = scores[student.id]?.ca_score ?? '';
                      const currentExam = scores[student.id]?.exam_score ?? '';
                      const metrics = calculateGradeMetrics(currentCA, currentExam);
                      const scorePresentDays = scoreViewAttendance[student.id] || 0;

                      return (
                        <div key={student.id} className="p-4">
                          <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}>
                            <div>
                              <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400 font-mono">{student.student_id}</span>
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">🗓️ {scorePresentDays}/{totalTermDays}d</span>
                              </div>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-700">Total: {metrics.total} ({metrics.grade})</span>
                          </div>
                          {expandedStudent === student.id && (
                            <div className="mt-3 grid gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                              <div>
                                <label className="text-[11px] text-purple-700 font-bold block mb-1">Attendance Record</label>
                                <div className="bg-white p-2 rounded border border-gray-200 text-xs font-semibold text-gray-600">
                                  Tracked Present: {scorePresentDays} / {totalTermDays} Term Days
                                </div>
                              </div>
                              <input type="number" placeholder="CA" value={currentCA} onChange={(e) => handleScoreChange(student.id, 'ca_score', e.target.value)} className="w-full p-2 border rounded bg-white font-bold text-center" />
                              <input type="number" placeholder="Exam" value={currentExam} onChange={(e) => handleScoreChange(student.id, 'exam_score', e.target.value)} className="w-full p-2 border rounded bg-white font-bold text-center" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* AUTOMATED TERMLY COMMENTS & ATTENDANCE OPERATION DASHBOARD */}
        {subView === 'term_remarks' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-gray-50 to-white px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <FaCommentMedical className="text-emerald-600" /> Automated Terminal Remarks Ledger
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Attendance aggregates are automatically crunched live from the <b>daily attendance registry</b>.</p>
              </div>
              <button
                onClick={handleSaveTermRemarks}
                disabled={saveLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Save Comments Data
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Student Particulars</th>
                    <th className="py-3.5 px-4 text-center w-36">Attendance Metric</th>
                    <th className="py-3.5 px-4 text-center w-28">Rate %</th>
                    <th className="py-3.5 px-4">Class Teacher's Terminal Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {termRemarksData.map((student, idx) => {
                    const attendanceRate = student.attendance_total > 0 
                      ? Math.round((student.attendance_present / student.attendance_total) * 100) 
                      : 0;

                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4 text-center font-semibold text-gray-400">{idx + 1}</td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-gray-800">{student.name}</p>
                          <p className="text-xs font-mono text-gray-400">{student.student_id}</p>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-gray-600 bg-gray-50/50">
                          {student.attendance_present} <span className="text-xs font-normal text-gray-400">/ {student.attendance_total} days</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${attendanceRate >= 75 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {attendanceRate}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <textarea
                            rows="1"
                            placeholder={`Write terminal report comment for ${student.name}...`}
                            value={student.teacher_remarks}
                            onChange={(e) => handleRemarksValueChange(idx, 'teacher_remarks', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs text-gray-700 font-medium focus:border-emerald-500 outline-none resize-y"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROMOTION STATUS TAB */}
        {subView === 'promotion' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-gray-50 to-white px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-1">
                  <FaClipboardCheck className="text-indigo-600" /> End of Year Review Dashboard
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Calculates continuous scores weighted vertically over all loaded session rows.</p>
              </div>
              <button
                onClick={handleSavePromotions}
                disabled={saveLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
              >
                {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                Lock Reviews & Decisions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4 text-center w-28">Session Avg</th>
                    <th className="py-3.5 px-4 w-44">Promotion Status</th>
                    <th className="py-3.5 px-4">Year-End Remarks (Optional Override)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {promotionData.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-4 text-center font-semibold text-gray-400">{idx + 1}</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-800">{student.name}</p>
                        <p className="text-xs font-mono text-gray-400">{student.student_id}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md font-black text-xs ${student.annual_average >= 50 ? 'bg-green-100 text-green-700' : student.annual_average >= 45 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                          {student.annual_average}%
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={student.decision}
                          onChange={(e) => handlePromotionValueChange(idx, 'decision', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-bold text-xs text-gray-700 focus:bg-white focus:border-indigo-500 outline-none"
                        >
                          <option value="Promoted">🟢 Promoted</option>
                          <option value="Promoted on Trial">🟡 Promoted on Trial</option>
                          <option value="Repeat">🔴 Repeat</option>
                          <option value="Withheld">⚪ Withheld</option>
                        </select>
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          placeholder="Global annual assessment summary remarks..."
                          value={student.teacher_remarks}
                          onChange={(e) => handlePromotionValueChange(idx, 'teacher_remarks', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-700 focus:bg-white focus:border-indigo-500 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};