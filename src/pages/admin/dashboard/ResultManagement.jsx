import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { FaSpinner, FaSave, FaExclamationTriangle, FaSearch, FaFilter, FaTable, FaUserGraduate, FaBookOpen, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';

export const ResultManagement = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('General');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [systemSettingLoading, setSystemSettingLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchSystemConfiguration = async () => {
      setSystemSettingLoading(true);
      try {
        const { data: clsData, error: clsError } = await supabase
          .from('classes')
          .select('name')
          .order('name', { ascending: true });
        
        if (clsError) throw clsError;
        if (clsData) {
          setAvailableClasses(clsData.map(c => c.name));
        }

        const { data: configData, error: configError } = await supabase
          .from('settings') 
          .select('current_term, current_session')
          .single();

        if (!configError && configData) {
          setSelectedTerm(configData.current_term || 'First Term');
          setSelectedSession(configData.current_session || '2025/2026');
        } else {
          setSelectedTerm('First Term');
          setSelectedSession('2025/2026');
        }
      } catch (err) {
        console.error("Configuration sync error:", err);
      } finally {
        setSystemSettingLoading(false);
      }
    };

    fetchSystemConfiguration();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedTerm && selectedSession) {
      loadScoreSheetData();
    }
  }, [selectedClass, selectedDepartment, selectedTerm, selectedSession]);

  const loadScoreSheetData = async () => {
    setLoading(true);
    try {
      let lookupClass = selectedClass;
      let lookupDepartment = 'General';

      if (selectedClass.includes('Science')) {
        lookupClass = selectedClass.replace(' Science', '').trim();
        lookupDepartment = 'Science';
      } else if (selectedClass.includes('Business') || selectedClass.includes('Commercial')) {
        lookupClass = selectedClass.replace(' Business', '').replace(' Commercial', '').trim();
        lookupDepartment = 'Business';
      } else if (selectedClass.includes('Arts')) {
        lookupClass = selectedClass.replace(' Arts', '').trim();
        lookupDepartment = 'Arts';
      }

      const { data: subData, error: subError } = await supabase
        .from('school_curriculum')
        .select('subject_name')
        .eq('class_name', lookupClass)
        .eq('department', lookupDepartment);

      if (subError) throw subError;
      setSubjects(subData || []);

      const { data: studData, error: studError } = await supabase
        .from('students')
        .select('id, name, student_id') 
        .eq('class_name', selectedClass)
        .order('name', { ascending: true });

      if (studError) throw studError;
      setStudents(studData || []);

      if (studData && studData.length > 0) {
        const studentIds = studData.map(s => s.id);
        const { data: existingMarks, error: marksError } = await supabase
          .from('student_marks')
          .select('*')
          .in('student_id', studentIds)
          .eq('term', selectedTerm)
          .eq('session', selectedSession);

        if (marksError) throw marksError;

        const initialMatrix = {};
        existingMarks?.forEach(mark => {
          const key = `${mark.student_id}_${mark.subject_name}`;
          initialMatrix[key] = {
            ca_score: mark.ca_score ?? '',
            exam_score: mark.exam_score ?? '',
            total_score: mark.total_score ?? 0
          };
        });
        setMarksMatrix(initialMatrix);
      } else {
        setMarksMatrix({});
      }
    } catch (error) {
      console.error("Error loading scoresheet:", error);
      Swal.fire('Error', 'Could not load score sheet records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (studentId, subjectName, field, value) => {
    if (value !== '' && isNaN(value)) return;
    
    const numValue = value === '' ? '' : parseFloat(value);
    const key = `${studentId}_${subjectName}`;

    setMarksMatrix(prev => {
      const current = prev[key] || { ca_score: '', exam_score: '', total_score: 0 };
      const updated = { ...current, [field]: numValue };
      
      const ca = updated.ca_score === '' ? 0 : updated.ca_score;
      const exam = updated.exam_score === '' ? 0 : updated.exam_score;
      updated.total_score = ca + exam;

      return { ...prev, [key]: updated };
    });
  };

  const handleSaveMarks = async () => {
    if (students.length === 0 || subjects.length === 0) return;

    setSaving(true);
    const recordsToUpsert = [];
    let validationFailed = false;

    for (let student of students) {
      for (let sub of subjects) {
        const key = `${student.id}_${sub.subject_name}`;
        const markData = marksMatrix[key];

        if (markData && (markData.ca_score !== '' || markData.exam_score !== '')) {
          const ca = markData.ca_score === '' ? 0 : parseFloat(markData.ca_score);
          const exam = markData.exam_score === '' ? 0 : parseFloat(markData.exam_score);

          if (ca > 40 || exam > 70 || (ca + exam) > 100) {
            validationFailed = true;
            Swal.fire('Validation Error', `Check marks for ${student.name} in ${sub.subject_name}. CA cannot exceed 40 and Exam cannot exceed 70.`, 'warning');
            break;
          }

          recordsToUpsert.push({
            student_id: student.id,
            student_name: student.name,
            subject_name: sub.subject_name,
            class_name: selectedClass,
            term: selectedTerm,
            session: selectedSession,
            ca_score: markData.ca_score === '' ? 0 : markData.ca_score,
            exam_score: markData.exam_score === '' ? 0 : markData.exam_score,
            total_score: markData.total_score
          });
        }
      }
      if (validationFailed) break;
    }

    if (validationFailed) {
      setSaving(false);
      return;
    }

    if (recordsToUpsert.length === 0) {
      setSaving(false);
      Swal.fire('No Changes', 'There are no score fields filled out to save.', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('student_marks')
        .upsert(recordsToUpsert, { onConflict: 'student_id,subject_name,term,session' });

      if (error) throw error;

      Swal.fire({
        title: 'Saved Successfully',
        text: `Committed grading data sheets for ${recordsToUpsert.length} subject entries.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
      loadScoreSheetData();
    } catch (error) {
      console.error("Save Error:", error);
      Swal.fire('Error', error.message || 'Failed to save scores to database.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600 bg-emerald-50';
    if (score >= 50) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    if (score > 0) return 'text-red-600 bg-red-50';
    return 'text-gray-400 bg-gray-50';
  };

  const getPassStatus = (score) => {
    if (score >= 40) {
      return { icon: FaCheckCircle, color: 'text-emerald-500', text: 'Pass' };
    }
    return { icon: FaTimesCircle, color: 'text-red-500', text: 'Fail' };
  };

  if (systemSettingLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-pulse"></div>
            <FaSpinner className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl text-blue-600 animate-spin" />
          </div>
          <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Result Management</h1>
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-medium text-white">
                    {selectedTerm || 'Term'}
                  </span>
                  <span className="text-white/60 text-sm">•</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md text-xs font-medium text-white">
                    {selectedSession || 'Session'}
                  </span>
                </div>
              </div>
              
              {students.length > 0 && subjects.length > 0 && (
                <button
                  onClick={handleSaveMarks}
                  disabled={saving}
                  className="bg-white text-blue-600 hover:bg-blue-50 text-sm font-bold px-4 sm:px-6 py-2.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Save Results</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Filter Section */}
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer"
                >
                  <option value="">Choose a class</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              
              {selectedClass && (
                <div className="flex items-end">
                  <div className="bg-blue-50 rounded-xl px-4 py-2">
                    <div className="text-xs text-blue-600 font-semibold">Status</div>
                    <div className="text-sm font-bold text-blue-700">
                      {students.length} Students • {subjects.length} Subjects
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {!selectedClass ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaTable className="text-3xl text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Class Selected</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Please select a class to load the grading spreadsheet</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              <span className="font-medium">Loading student records...</span>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-amber-50 rounded-2xl shadow-lg border border-amber-200 p-6">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-amber-600 text-xl mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800">No Subjects Found</h4>
                <p className="text-sm text-amber-700 mt-1">
                  No subjects are configured for <strong>"{selectedClass}"</strong> in the curriculum
                </p>
              </div>
            </div>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-blue-50 rounded-2xl shadow-lg border border-blue-200 p-6 text-center">
            <FaUserGraduate className="text-4xl text-blue-400 mx-auto mb-3" />
            <p className="font-semibold text-blue-800">No Students Enrolled</p>
            <p className="text-sm text-blue-600 mt-1">No students found in class <strong>"{selectedClass}"</strong></p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-4 p-3 sm:p-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by student name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 text-right">
                Showing {filteredStudents.length} of {students.length} students
              </div>
            </div>

            {/* Desktop Table View */}
            {!mobileView ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 min-w-55">
                          Student Details
                        </th>
                        {subjects.map((sub, i) => (
                          <th key={i} className="px-3 py-3 text-center min-w-40">
                            <div className="text-xs font-bold text-gray-700 mb-1">{sub.subject_name}</div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold text-gray-500">
                              <div>CA (40)</div>
                              <div>Exam (70)</div>
                              <div>Total</div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 sticky left-0 bg-white border-r border-gray-100">
                            <div className="font-semibold text-gray-800 text-sm">{student.name}</div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5">{student.student_id || 'No ID'}</div>
                          </td>
                          {subjects.map((sub, subIdx) => {
                            const key = `${student.id}_${sub.subject_name}`;
                            const currentScores = marksMatrix[key] || { ca_score: '', exam_score: '', total_score: 0 };
                            const status = currentScores.total_score > 0 ? getPassStatus(currentScores.total_score) : null;
                            const StatusIcon = status?.icon;

                            return (
                              <td key={subIdx} className="px-3 py-2">
                                <div className="grid grid-cols-3 gap-1">
                                  <input
                                    type="number"
                                    placeholder="-"
                                    value={currentScores.ca_score}
                                    onChange={(e) => handleInputChange(student.id, sub.subject_name, 'ca_score', e.target.value)}
                                    className="w-full text-center py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-xs font-medium"
                                  />
                                  <input
                                    type="number"
                                    placeholder="-"
                                    value={currentScores.exam_score}
                                    onChange={(e) => handleInputChange(student.id, sub.subject_name, 'exam_score', e.target.value)}
                                    className="w-full text-center py-1.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none text-xs font-medium"
                                  />
                                  <div className={`text-center py-1.5 rounded-lg text-xs font-bold ${getTotalScoreColor(currentScores.total_score)}`}>
                                    {currentScores.total_score || 0}
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Mobile Card View */
              <div className="space-y-3">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div 
                      className="p-4 bg-linear-to-r from-blue-50 to-white cursor-pointer"
                      onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800 text-base">{student.name}</h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{student.student_id || 'No ID'}</p>
                        </div>
                        <div className="text-blue-600 text-sm font-semibold">
                          {expandedStudent === student.id ? '▲' : '▼'}
                        </div>
                      </div>
                    </div>
                    
                    {expandedStudent === student.id && (
                      <div className="divide-y divide-gray-100">
                        {subjects.map((sub, idx) => {
                          const key = `${student.id}_${sub.subject_name}`;
                          const currentScores = marksMatrix[key] || { ca_score: '', exam_score: '', total_score: 0 };
                          const status = currentScores.total_score > 0 ? getPassStatus(currentScores.total_score) : null;
                          const StatusIcon = status?.icon;

                          return (
                            <div key={idx} className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <FaBookOpen className="text-blue-500 text-sm" />
                                  <span className="font-semibold text-gray-700 text-sm">{sub.subject_name}</span>
                                </div>
                                {currentScores.total_score > 0 && (
                                  <div className="flex items-center gap-1">
                                    <StatusIcon className={`text-xs ${status?.color}`} />
                                    <span className={`text-xs font-semibold ${status?.color}`}>{status?.text}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">CA Score</label>
                                  <input
                                    type="number"
                                    placeholder="0-40"
                                    value={currentScores.ca_score}
                                    onChange={(e) => handleInputChange(student.id, sub.subject_name, 'ca_score', e.target.value)}
                                    className="w-full text-center py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Exam Score</label>
                                  <input
                                    type="number"
                                    placeholder="0-70"
                                    value={currentScores.exam_score}
                                    onChange={(e) => handleInputChange(student.id, sub.subject_name, 'exam_score', e.target.value)}
                                    className="w-full text-center py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Total</label>
                                  <div className={`text-center py-2 rounded-xl font-bold text-sm ${getTotalScoreColor(currentScores.total_score)}`}>
                                    {currentScores.total_score || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Footer Info */}
            <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span>Not graded</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Pass (≥40)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Fail (&lt;40)</span>
                  </span>
                </div>
                <div className="text-gray-400 italic">
                  CA max: 40 • Exam max: 70
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};