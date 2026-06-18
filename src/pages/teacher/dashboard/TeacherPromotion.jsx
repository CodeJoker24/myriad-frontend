import { useState, useEffect } from 'react';
import { supabase, logActivity} from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaSearch, FaPaperPlane, FaHistory, 
  FaSpinner, FaArrowRight, FaStar, FaClock, FaCheckCircle, FaTimesCircle,
  FaEye, FaComment, FaChevronDown, FaTrashAlt, FaTimes, FaLock, FaUserCheck, FaExclamationTriangle
} from 'react-icons/fa';

export const TeacherPromotion = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [loading, setLoading] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [targetClass, setTargetClass] = useState('');
  const [isPromotionPeriod, setIsPromotionPeriod] = useState(false);
  const [activeTermName, setActiveTermName] = useState('');
  const [activeSessionName, setActiveSessionName] = useState('');

  useEffect(() => {
    const fetchTeacherAndStudents = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch active term and session parameters
        const { data: settingsData } = await supabase
          .from('academic_settings')
          .select('*')
          .eq('is_active', true);

        let currentTerm = '';
        let currentSession = '';

        if (settingsData) {
          const termRow = settingsData.find(s => s.type === 'term');
          const sessionRow = settingsData.find(s => s.type === 'session');

          if (termRow) {
            currentTerm = termRow.value.split(' (')[0];
            setActiveTermName(termRow.value);
            setIsPromotionPeriod(termRow.value.toLowerCase().includes('third') || termRow.value.toLowerCase().includes('3rd'));
          }
          if (sessionRow) {
            currentSession = sessionRow.value;
            setActiveSessionName(sessionRow.value);
          }
        }

        // 2. Fetch all configuration classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('name')
          .order('name', { ascending: true });
      
        if (classesData) {
          setAvailableClasses(classesData.map(c => c.name));
        }

        // 3. Fetch teacher profile
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();
        
        if (teacher) {
          setTeacherData(teacher);

          // 4. Fetch roster students
          const { data: stds } = await supabase
            .from('students')
            .select('*')
            .eq('class_name', teacher.is_class_teacher_of)
            .eq('is_active', true)
            .order('name', { ascending: true });

          // 5. Fetch saved results engine promotion snapshots
          const { data: savedDecisions } = await supabase
            .from('student_promotions')
            .select('*')
            .eq('class_name', teacher.is_class_teacher_of)
            .eq('session', currentSession);

          // 6. Merge decision metrics directly into the active UI state objects
          const enrichedStudents = (stds || []).map(student => {
            const decisionRow = savedDecisions?.find(d => d.student_id === student.id);
            return {
              ...student,
              annual_average: decisionRow ? decisionRow.annual_average : null,
              recommended_decision: decisionRow ? decisionRow.decision : 'Pending Review'
            };
          });

          setStudents(enrichedStudents);

          // 7. Auto-select IDs optimized as eligible ('Promoted' or 'Promoted on Trial')
          const autoSelectedIds = enrichedStudents
            .filter(s => s.recommended_decision === 'Promoted' || s.recommended_decision === 'Promoted on Trial')
            .map(s => s.id);
          setSelectedStudentIds(autoSelectedIds);

          // 8. Fetch request history logs
          const { data: hist } = await supabase
            .from('promotion_requests')
            .select('*')
            .eq('teacher_id', teacher.id)
            .order('created_at', { ascending: false });
          if (hist) setHistory(hist);
        }
      } catch (err) {
        console.error("Error loading teacher portal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacherAndStudents();
  }, []);

  const openClassModal = () => {
    if (selectedStudentIds.length === 0) {
      return Swal.fire('Wait!', 'Select students to promote.', 'warning');
    }
    setTargetClass('');
    setShowClassModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!targetClass) {
      return Swal.fire('Error', 'Please select a target class.', 'error');
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('promotion_requests').insert([{
        teacher_id: teacherData.id,
        teacher_name: teacherData.name,
        from_class: teacherData.is_class_teacher_of,
        requested_class: targetClass,
        student_ids: selectedStudentIds, 
        status: 'pending'
      }]);

      if (!error) {
        Swal.fire('Submitted', 'Request package sent to Admin for approval.', 'success');
        setSelectedStudentIds([]);
        setTargetClass('');
        setShowClassModal(false);
        setActiveTab('history');
        const { data: hist } = await supabase.from('promotion_requests').select('*').eq('teacher_id', teacherData.id).order('created_at', { ascending: false });
        setHistory(hist);
      }
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewRejectionReason = (item) => {
    setSelectedHistoryItem(item);
    setShowReasonModal(true);
  };

  const handleDeleteHistory = async () => {
    if (history.length === 0) {
      return Swal.fire('Info', 'No history to delete.', 'info');
    }

    const result = await Swal.fire({
      title: 'Delete All History?',
      text: 'This action cannot be undone. All your promotion request history will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete all'
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('promotion_requests')
          .delete()
          .eq('teacher_id', teacherData.id);
        if (error) throw error;

        await logActivity(`Teacher ${teacherData.name} cleared promotion history`, 'teacher');
        Swal.fire('Deleted!', 'Your promotion history has been cleared.', 'success');
        
        const { data: hist } = await supabase
          .from('promotion_requests')
          .select('*')
          .eq('teacher_id', teacherData.id)
          .order('created_at', { ascending: false });
        if (hist) setHistory(hist);
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getDecisionBadgeColor = (decision) => {
    switch (decision) {
      case 'Promoted': return 'bg-green-100 text-green-700 border-green-200';
      case 'Promoted on Trial': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Repeat': return 'bg-red-100 text-red-700 border-red-200';
      case 'Withheld': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                <FaGraduationCap className="text-indigo-600 text-2xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Promotion Request Hub</h1>
                <p className="text-sm text-gray-500">Managed by: <span className="font-bold text-gray-700">{teacherData?.name || 'Loading...'}</span></p>
              </div>
            </div>
            <div className="text-right text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-lg border border-indigo-100">
              Session Context: {activeSessionName || 'Unset'}
            </div>
          </div>
        </div>

        {/* Tabs Menu */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-2 px-4 transition-all text-sm font-semibold ${activeTab === 'request' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Create Request Package
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-4 transition-all text-sm font-semibold ${activeTab === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Submission History
          </button>
        </div>

        {/* REQUEST TAB */}
        {activeTab === 'request' && (
          <div>
            {!isPromotionPeriod && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-4 text-orange-700">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <FaLock className="text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">Promotion Requests Locked</p>
                  <p className="text-xs opacity-90">
                    Students can only be promoted during the end-of-year <b>Third Term</b> evaluation window. 
                    Current operational term status: <span className="font-semibold text-orange-800">{activeTermName || 'Not Set'}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 border border-indigo-100 shadow-xs">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Assigned Classroom</p>
                  <h2 className="text-2xl font-black text-slate-800">{teacherData?.is_class_teacher_of || '—'}</h2>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 text-center shadow-xs border border-gray-100">
                  <p className="text-2xl font-black text-indigo-600">{students.length}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Roster</p>
                </div>
              </div>
            </div>

            {/* Smart Automated Preselection Notice */}
            {isPromotionPeriod && students.length > 0 && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
                <FaUserCheck className="text-emerald-500 text-sm" />
                <span><b>Smart Automation Connected:</b> System pre-selected students calculated as eligible based on saved session performance logs.</span>
              </div>
            )}

            {/* Student Table */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
                <div className="relative w-full sm:flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={openClassModal}
                  disabled={loading || selectedStudentIds.length === 0 || !isPromotionPeriod}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    !isPromotionPeriod 
                      ? 'bg-gray-200 cursor-not-allowed text-gray-400 border border-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10'
                  }`}
                >
                  {!isPromotionPeriod ? <FaLock size={12} /> : <FaPaperPlane size={12} />}
                  {loading ? 'Processing...' : !isPromotionPeriod ? 'Locked (3rd Term Only)' : 'Submit Selected Package'}
                </button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                          checked={selectedStudentIds.length === students.length && students.length > 0}
                          onChange={e => setSelectedStudentIds(e.target.checked ? students.map(s => s.id) : [])} 
                        />
                      </th>
                      <th className="p-4">Student Name Particulars</th>
                      <th className="p-4">Student ID</th>
                      <th className="p-4 text-center">Session Average</th>
                      <th className="p-4 text-center">System Ledger Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-gray-400 font-medium">No active student records matched current criteria</td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                              checked={selectedStudentIds.includes(s.id)}
                              onChange={() => setSelectedStudentIds(prev =>
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              )}
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-800">{s.name}</div>
                          </td>
                          <td className="p-4 font-mono text-xs text-blue-600 font-bold">{s.student_id}</td>
                          <td className="p-4 text-center">
                            {s.annual_average !== null ? (
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-black text-xs border ${
                                s.annual_average >= 50 ? 'bg-green-50 text-green-700 border-green-100' :
                                s.annual_average >= 45 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                'bg-red-50 text-red-600 border-red-100'
                              }`}>
                                {s.annual_average}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">No scores data</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 border rounded-full text-[11px] font-black uppercase tracking-wider ${getDecisionBadgeColor(s.recommended_decision)}`}>
                              {s.recommended_decision}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 font-medium">No students found</div>
                ) : (
                  filteredStudents.map(s => (
                    <div key={s.id} className="p-4 hover:bg-gray-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-sm">{s.name}</h3>
                          <p className="text-xs font-mono text-blue-600 font-bold mt-0.5">ID: {s.student_id}</p>
                          
                          <div className="flex flex-wrap gap-2 items-center mt-2">
                            {s.annual_average !== null && (
                              <span className="text-[11px] font-black bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                Avg: {s.annual_average}%
                              </span>
                            )}
                            <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase ${getDecisionBadgeColor(s.recommended_decision)}`}>
                              {s.recommended_decision}
                            </span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer mt-1"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => setSelectedStudentIds(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          )}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Metrics */}
              {filteredStudents.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                  <div>Roster count: {filteredStudents.length}</div>
                  <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold">Selected for transmission: {selectedStudentIds.length} students</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
            {/* Header with Clear Button */}
            <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-sm font-bold text-gray-700">Dispatched Promotion Request History Log</h3>
              <button
                onClick={handleDeleteHistory}
                disabled={history.length === 0 || loading}
                className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <FaTrashAlt size={12} /> Clear Request Log
              </button>
            </div>

            {/* Desktop History Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">From Class</th>
                    <th className="p-4">Target Destination Class</th>
                    <th className="p-4 text-center">Batch Size</th>
                    <th className="p-4 text-center">Admin Status</th>
                    <th className="p-4 text-center">Action / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-400 font-medium">No historic submission packages discovered</td>
                    </tr>
                  ) : (
                    history.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-gray-600 font-medium">{new Date(h.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-gray-600 font-semibold">{h.from_class}</td>
                        <td className="p-4 font-black text-indigo-600">{h.requested_class}</td>
                        <td className="p-4 text-center font-bold text-gray-700 bg-gray-50/30">{h.student_ids?.length || 0} Students</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            h.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                            h.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {h.status === 'rejected' && h.remarks ? (
                            <button onClick={() => viewRejectionReason(h)} className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100 transition-colors">
                              <FaComment size={12} /> View Feedback
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic font-medium">No notes</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile History Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {history.length === 0 ? (
                <div className="p-10 text-center text-gray-400 font-medium">No historic submission packages discovered</div>
              ) : (
                history.map(h => (
                  <div key={h.id} className="p-4 hover:bg-gray-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[11px] text-gray-400 font-bold">{new Date(h.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-gray-500">{h.from_class}</span>
                          <FaArrowRight className="text-gray-400 text-[10px]" />
                          <span className="text-sm font-black text-indigo-600">{h.requested_class}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        h.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                        h.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-3">
                      <span className="text-gray-500 font-medium">Batch size: <b>{h.student_ids?.length || 0} students</b></span>
                      {h.status === 'rejected' && h.remarks && (
                        <button onClick={() => viewRejectionReason(h)} className="text-red-500 font-bold flex items-center gap-1 bg-red-50 px-2 py-0.5 border border-red-100 rounded">
                          <FaComment size={10} /> View Reason
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Target Class Selection Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setShowClassModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-linear-to-r from-indigo-50 to-transparent">
              <div>
                <h2 className="text-lg font-black text-gray-900">Choose Promotion Target</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Packaging <b>{selectedStudentIds.length} student(s)</b> for migration approval.
                </p>
              </div>
              <button onClick={() => setShowClassModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimes size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Class Origin</label>
                <div className="w-full p-3 bg-gray-50 border rounded-xl text-gray-700 font-bold text-sm">
                  {teacherData?.is_class_teacher_of || '—'}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Target Destination Class</label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-semibold text-gray-700 transition-colors"
                >
                  <option value="">Select Target Class</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-start gap-2">
                <FaStar className="text-amber-500 text-xs shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-blue-700 font-medium">
                  Notice: Once submitted, names will remain active in your current class registry until an institutional administrator officially accepts and processes the promotion request.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowClassModal(false)} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button 
                onClick={handleSubmitRequest} 
                disabled={loading || !targetClass}
                className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane size={10} />}
                {loading ? 'Transmitting...' : 'Dispatch to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Feedback Modal */}
      {showReasonModal && selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setShowReasonModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-linear-to-r from-red-50 to-transparent">
              <div>
                <h2 className="text-lg font-black text-gray-900">Admin Feedback Return</h2>
                <p className="text-xs text-gray-500 mt-0.5">Package: {selectedHistoryItem.from_class} → {selectedHistoryItem.requested_class}</p>
              </div>
              <button onClick={() => setShowReasonModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimesCircle size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 border border-red-200">
                    <FaExclamationTriangle className="text-red-500 text-xs" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-red-800 tracking-wide uppercase mb-1">Reason for Return/Rejection:</p>
                    <p className="text-gray-700 text-sm font-medium leading-relaxed">{selectedHistoryItem.remarks || 'No explicit adjustment notes provided.'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-[11px] text-gray-500 font-medium">
                <p>Submission date: {new Date(selectedHistoryItem.created_at).toLocaleString()}</p>
                <p>Affected students in batch: {selectedHistoryItem.student_ids?.length || 0}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setShowReasonModal(false)} className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};