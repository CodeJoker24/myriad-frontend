import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { 
  FaSpinner, FaSave, FaBook, FaSchool, FaCalculator, FaUserGraduate, 
  FaChartLine, FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaSearch, FaPrint, FaDownload, FaEye, FaEyeSlash
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
  const [isEditableTerm, setIsEditableTerm] = useState(true);

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
      const isThird = termNameLower.includes('3rd') || termNameLower.includes('third');
      setIsEditableTerm(isThird);

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
      console.error("Initialization breakdown:", err.message);
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

      const initialScores = {};
      roster.forEach(student => {
        const matchedRecord = existingMarks?.find(m => m.student_id === student.id);
        initialScores[student.id] = {
          ca_score: matchedRecord ? matchedRecord.ca_score : '',
          exam_score: matchedRecord ? matchedRecord.exam_score : ''
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

  const calculateGradeMetrics = (ca, exam) => {
    const numericCA = parseFloat(ca) || 0;
    const numericExam = parseFloat(exam) || 0;
    const total = numericCA + numericExam;

    if (!ca && !exam) return { total: 0, grade: '-', remark: '-' };

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
          ca_score: parseFloat(studentScores.ca_score) || 0,
          exam_score: parseFloat(studentScores.exam_score) || 0,
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
      Swal.fire('Records Saved!', 'Calculated grades and remarks successfully snapshot directly into student rows.', 'success');
      loadStudentsAndScores();

    } catch (err) {
      Swal.fire('Save Failure', err.message, 'error');
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

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your assessment dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isEditableTerm) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md mx-auto text-center shadow-xl animate-fadeIn">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Result Entry Ledger Locked</h3>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Score collection sheets are restricted. Direct continuous assessment modifications are only permitted during the final evaluation cycle (<b className="text-red-600">3rd Term</b>).
          </p>
          <div className="mt-5 pt-4 border-t border-gray-100 bg-gray-50 -mx-8 -mb-8 p-4 rounded-b-2xl">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
              System Operational State: Read-Only Mode
            </p>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStatistics();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-24">
        
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
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Teacher Assessment Portal</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Grade Entry System</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-white">📚 {teacherProfile?.is_class_teacher_of}</span>
                    </div>
                    <div className="bg-green-500/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-green-300">✓ Active Class</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Session</p>
                    <p className="text-sm font-black text-white">{activeSession || 'Unset'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Term</p>
                    <p className="text-sm font-black text-blue-400">{activeTerm || 'Unset'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 mb-6">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block items-center gap-2">
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
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Live Grading Scale Active</span>
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
                  className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saveLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {saveLoading ? 'Saving...' : 'Save All Records'}
                </button>
              </div>

              {showSummary && stats && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-600 font-medium">Average Score</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.average}%</p>
                  </div>
                  <div className="bg-linear-to-br from-emerald-50 to-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-600 font-medium">Passed</p>
                    <p className="text-2xl font-bold text-emerald-700">{stats.passed}</p>
                  </div>
                  <div className="bg-linear-to-br from-red-50 to-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                  </div>
                  <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-600 font-medium">Total Students</p>
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
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs text-gray-500">
                    Showing {filteredStudents.length} of {students.length} students
                  </span>
                </div>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaExclamationTriangle className="text-2xl text-yellow-600" />
                </div>
                <p className="text-gray-600 font-medium">No Students Found</p>
                <p className="text-sm text-gray-400 mt-1">No active students enrolled in {teacherProfile?.is_class_teacher_of}</p>
              </div>
            ) : !mobileView ? (
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                      <th className="py-3.5 px-4 w-12 text-center text-xs font-bold text-gray-600">#</th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold text-gray-600">Student ID</th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold text-gray-600">Student Name</th>
                      <th className="py-3.5 px-4 text-center text-xs font-bold text-gray-600">CA (40)</th>
                      <th className="py-3.5 px-4 text-center text-xs font-bold text-gray-600">Exam (60)</th>
                      <th className="py-3.5 px-4 text-center text-xs font-bold text-gray-600">Total</th>
                      <th className="py-3.5 px-4 text-center text-xs font-bold text-gray-600">Grade</th>
                      <th className="py-3.5 px-4 text-left text-xs font-bold text-gray-600">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredStudents.map((student, idx) => {
                      const currentCA = scores[student.id]?.ca_score || '';
                      const currentExam = scores[student.id]?.exam_score || '';
                      const metrics = calculateGradeMetrics(currentCA, currentExam);
                      const gradeColor = getGradeColor(metrics.grade);

                      return (
                        <tr key={student.id} className="hover:bg-gray-50/80 transition-all duration-150">
                          <td className="py-3 px-4 text-center text-xs font-semibold text-gray-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                              {student.student_id}
                            </span>
                           </td>
                          <td className="py-3 px-4 font-semibold text-gray-800">{student.name}</td>
                          <td className="py-3 px-4">
                            <input 
                              type="number"
                              placeholder="0"
                              max="40"
                              value={currentCA}
                              onChange={(e) => handleScoreChange(student.id, 'ca_score', e.target.value)}
                              className="w-full text-center p-2 border-2 border-gray-200 rounded-lg font-bold bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="number"
                              placeholder="0"
                              max="60"
                              value={currentExam}
                              onChange={(e) => handleScoreChange(student.id, 'exam_score', e.target.value)}
                              className="w-full text-center p-2 border-2 border-gray-200 rounded-lg font-bold bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-black text-sm bg-linear-to-r ${getTotalScoreColor(metrics.total)} text-white shadow-sm`}>
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
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {metrics.remark !== '-' && (
                                metrics.remark === 'Pass' || metrics.remark === 'Excellent' || metrics.remark === 'Good' ? 
                                  <FaCheckCircle className="text-emerald-500 text-xs" /> :
                                  <FaTimesCircle className="text-red-500 text-xs" />
                              )}
                              <p className={`text-xs font-semibold ${
                                gradeColor === 'danger' ? 'text-red-600' : 'text-gray-600'
                              }`}>{metrics.remark}</p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
                {filteredStudents.map((student, idx) => {
                  const currentCA = scores[student.id]?.ca_score || '';
                  const currentExam = scores[student.id]?.exam_score || '';
                  const metrics = calculateGradeMetrics(currentCA, currentExam);
                  const gradeColor = getGradeColor(metrics.grade);

                  return (
                    <div key={student.id} className="bg-white">
                      <div 
                        className="px-4 py-3 bg-linear-to-r from-gray-50 to-white cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FaUserGraduate className="text-blue-500 text-sm" />
                            <span className="font-bold text-gray-800 text-sm">{student.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{student.student_id}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              gradeColor === 'success' ? 'bg-green-100 text-green-700' :
                              gradeColor === 'danger' ? 'bg-red-100 text-red-600' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {metrics.grade}
                            </span>
                          </div>
                        </div>
                        <div className="text-blue-600 text-sm font-semibold">
                          {expandedStudent === student.id ? '▲' : '▼'}
                        </div>
                      </div>
                      
                      {expandedStudent === student.id && (
                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                          <div className="grid gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-600 block mb-1.5">CA Score (Max 40)</label>
                              <input 
                                type="number"
                                placeholder="0"
                                max="40"
                                value={currentCA}
                                onChange={(e) => handleScoreChange(student.id, 'ca_score', e.target.value)}
                                className="w-full text-center p-3 border-2 border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 block mb-1.5">Exam Score (Max 60)</label>
                              <input 
                                type="number"
                                placeholder="0"
                                max="60"
                                value={currentExam}
                                onChange={(e) => handleScoreChange(student.id, 'exam_score', e.target.value)}
                                className="w-full text-center p-3 border-2 border-gray-200 rounded-xl font-bold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-600 block mb-1.5">Total Score</label>
                                <div className={`text-center p-3 rounded-xl font-black text-sm bg-linear-to-r ${getTotalScoreColor(metrics.total)} text-white shadow-sm`}>
                                  {metrics.total}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-600 block mb-1.5">Remark</label>
                                <div className="flex items-center justify-center gap-1.5 p-3 bg-gray-50 rounded-xl">
                                  {(metrics.remark === 'Pass' || metrics.remark === 'Excellent' || metrics.remark === 'Good') ? 
                                    <FaCheckCircle className="text-emerald-500 text-sm" /> :
                                    <FaTimesCircle className="text-red-500 text-sm" />
                                  }
                                  <p className={`text-sm font-bold ${gradeColor === 'danger' ? 'text-red-600' : 'text-gray-700'}`}>
                                    {metrics.remark}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-linear-to-r from-gray-50 to-white px-4 sm:px-6 py-3 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-600">A-B (Excellent)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600">C (Good)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <span className="text-gray-600">D-P (Pass)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-gray-600">F9 (Fail)</span>
                  </div>
                </div>
                <div className="text-gray-400 italic text-[11px]">
                  CA: 40 max • Exam: 60 max
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};