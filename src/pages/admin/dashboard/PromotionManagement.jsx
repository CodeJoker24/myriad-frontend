import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaUsers, FaSearch, FaSpinner, FaHistory, 
  FaClock, FaChevronRight, FaUndo, FaCheckCircle, FaFilter,
  FaTimes, FaChevronDown, FaUserGraduate, FaCalendarAlt, FaBookOpen,
  FaHourglassHalf, FaTimesCircle, FaArrowRight, FaEye, FaTrashAlt
} from 'react-icons/fa';

export const PromotionManagement = () => {
  const [activeTab, setActiveTab] = useState('promote');
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [promotionHistory, setPromotionHistory] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);

  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [toClass, setToClass] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminName(user.email.split('@')[0]);

      const { data: cls } = await supabase.from('classes').select('name').order('name');
      if (cls) setClasses(cls.map(c => c.name));

      const { data: settingsData } = await supabase.from('academic_settings').select('*');
      if (settingsData) {
        const sessionList = settingsData.filter(i => i.type === 'session').map(i => i.value);
        const termList = settingsData.filter(i => i.type === 'term').map(i => i.value);
        
        setSessions(sessionList);
        setTerms(termList);

        const currentSess = settingsData.find(i => i.type === 'session' && i.is_current);
        if (currentSess) setSelectedSession(currentSess.value);
        
        const currentTrm = settingsData.find(i => i.type === 'term' && i.is_current);
        if (currentTrm) setSelectedTerm(currentTrm.value);
      }

      fetchHistory();
      fetchRequests();
    };
    init();
  }, []);

  const fetchHistory = async () => {
    const { data } = await supabase.from('promotion_history').select('*').order('created_at', { ascending: false });
    if (data) setPromotionHistory(data);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('promotion_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPromotionRequests(data);
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!fromClass) { setStudents([]); return; }
      setLoading(true);
      const { data } = await supabase.from('students').select('*').eq('class_name', fromClass).eq('is_active', true);
      if (data) {
        setStudents(data.map(s => ({ ...s, studentId: s.student_id || 'N/A', currentClass: s.class_name })));
      }
      setLoading(false);
    };
    fetchStudents();
  }, [fromClass]);

  useEffect(() => {
    if (selectAll) {
      setSelectedStudentIds(students.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  }, [selectAll, students]);

  const handleProcessPromotion = async () => {
    if (!toClass || selectedStudentIds.length === 0 || !selectedSession) {
      return Swal.fire('Missing Info', 'Please select destination class, session, and students.', 'warning');
    }

    const confirm = await Swal.fire({
      title: 'Confirm Promotion',
      text: `Move ${selectedStudentIds.length} students to ${toClass}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Process'
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      try {
        const { error: upError } = await supabase.from('students').update({ class_name: toClass }).in('id', selectedStudentIds);
        if (upError) throw upError;

        const historyData = students.filter(s => selectedStudentIds.includes(s.id)).map(s => ({
          student_id: s.id,
          student_name: s.name,
          from_class: fromClass,
          to_class: toClass,
          academic_session: selectedSession,
          academic_term: selectedTerm,
          promoted_by: adminName
        }));
        await supabase.from('promotion_history').insert(historyData);
        await logActivity(`Promoted ${selectedStudentIds.length} students to ${toClass}`, 'admin');

        Swal.fire('Success', 'Promotion completed', 'success');
        setSelectedStudentIds([]);
        setSelectAll(false);
        setFromClass('');
        fetchHistory();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReverse = async (record) => {
    const confirm = await Swal.fire({
      title: 'Reverse Promotion?',
      text: `Move ${record.student_name} back to ${record.from_class}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reverse'
    });

    if (confirm.isConfirmed) {
      const { error } = await supabase.from('students').update({ class_name: record.from_class }).eq('id', record.student_id);
      if (!error) {
        await supabase.from('promotion_history').delete().eq('id', record.id);
        Swal.fire('Reversed', 'Student moved back successfully', 'success');
        fetchHistory();
      }
    }
  };

  const handleApproveRequest = async (request) => {
    const confirm = await Swal.fire({
      title: 'Approve Promotion?',
      text: `This will move ${request.student_ids?.length || 0} students to ${request.requested_class}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve & Promote'
    });

    if (confirm.isConfirmed) {
      setLoading(true);
      try {
        const { error: upError } = await supabase
          .from('students')
          .update({ class_name: request.requested_class })
          .in('id', request.student_ids);
        if (upError) throw upError;

        const { data: stdNames } = await supabase.from('students').select('id, name').in('id', request.student_ids);
        
        const historyLogs = stdNames.map(s => ({
          student_id: s.id,
          student_name: s.name,
          from_class: request.from_class,
          to_class: request.requested_class,
          academic_session: selectedSession,
          academic_term: selectedTerm,
          promoted_by: `Admin (via ${request.teacher_name})`
        }));
        await supabase.from('promotion_history').insert(historyLogs);

        await supabase.from('promotion_requests').update({ status: 'approved' }).eq('id', request.id);

        Swal.fire('Success', 'Students promoted successfully', 'success');
        fetchRequests();
        fetchHistory();
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRejectRequest = async (id) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Request',
      input: 'text',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'e.g. Incomplete scores',
      showCancelButton: true
    });

    if (reason) {
      await supabase.from('promotion_requests')
        .update({ status: 'rejected', remarks: reason })
        .eq('id', id);
      fetchRequests();
      Swal.fire('Rejected', 'Teacher will see the reason in their history.', 'info');
    }
  };

  const clearFilters = () => {
    setFromClass('');
    setToClass('');
    setSelectedSession('');
    setSelectedTerm('');
    setSearchTerm('');
    setSelectedStudentIds([]);
    setSelectAll(false);
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const tabs = [
    { id: 'promote', name: 'Promote Students', icon: <FaGraduationCap /> },
    { id: 'requests', name: 'Promotion Requests', icon: <FaClock /> },
    { id: 'history', name: 'Promotion History', icon: <FaHistory /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <FaGraduationCap className="text-primary text-2xl" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Promotion Management</h1>
                <p className="text-sm text-gray-500">Manage student promotions across all classes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
              <FaUserGraduate className="text-primary" />
              <span>Welcome, <span className="font-semibold text-gray-800">{adminName}</span></span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* PROMOTE TAB */}
        {activeTab === 'promote' && (
          <div>
            {/* Filters Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
              <div className="flex justify-between items-center mb-4 md:hidden">
                <h3 className="font-medium text-gray-700">Filters</h3>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1 text-primary text-sm"
                >
                  {showFilters ? 'Hide' : 'Show'} <FaChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Academic Session</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Session</option>
                      {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Term</option>
                      {terms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">From Class</label>
                    <select
                      value={fromClass}
                      onChange={(e) => setFromClass(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">To Class</label>
                    <select
                      value={toClass}
                      onChange={(e) => setToClass(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {(fromClass || toClass || selectedSession || selectedTerm) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                    >
                      <FaTimes size={12} /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Summary */}
            {fromClass && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FaUsers className="text-blue-600 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-5 text-center border border-green-100">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <FaCheckCircle className="text-green-600 text-xl" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{selectedStudentIds.length}</p>
                  <p className="text-xs text-green-600 font-medium">Selected</p>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleProcessPromotion}
                  disabled={loading || !toClass || selectedStudentIds.length === 0}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all hover:shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaGraduationCap size={14} />}
                  {loading ? 'Processing...' : `Promote (${selectedStudentIds.length})`}
                </button>
              </div>

              {!fromClass ? (
                <div className="text-center py-16">
                 <FaBookOpen className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select a class to view students</p>
                </div>
              ) : loading ? (
                <div className="text-center py-16">
                  <FaSpinner className="animate-spin text-primary text-3xl mx-auto mb-3" />
                  <p className="text-gray-500">Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-16">
                  <FaUsers className="text-5xl text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students found in {fromClass}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                          <th className="p-4 w-10">
                            <input
                              type="checkbox"
                              checked={selectAll && students.length > 0}
                              onChange={() => setSelectAll(!selectAll)}
                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4">Student ID</th>
                          <th className="p-4">Current Class</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={() => {
                                  if (selectedStudentIds.includes(student.id)) {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                  } else {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="p-4 font-medium text-gray-800">{student.name}</td>
                            <td className="p-4 text-sm text-gray-500 font-mono">{student.studentId}</td>
                            <td className="p-4 text-sm text-gray-600">{student.currentClass}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-semibold">
                                <FaCheckCircle size={10} /> Eligible
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-gray-100">
                    {filteredStudents.map((student) => (
                      <div key={student.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{student.name}</h3>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">
                                <FaCheckCircle size={8} /> Eligible
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">ID: {student.studentId}</p>
                            <p className="text-xs text-gray-600 mt-1">Class: {student.currentClass}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => {
                              if (selectedStudentIds.includes(student.id)) {
                                setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                              } else {
                                setSelectedStudentIds([...selectedStudentIds, student.id]);
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-right">
                    <p className="text-xs text-gray-500">
                      Showing {filteredStudents.length} of {students.length} students
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* PROMOTION REQUESTS TAB */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200"
                />
              </div>
            </div>

            {promotionRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHourglassHalf className="text-4xl text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No promotion requests</p>
                <p className="text-sm text-gray-400 mt-1">Pending requests from teachers will appear here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="p-4">Teacher</th>
                        <th className="p-4">Class Path</th>
                        <th className="p-4">Students</th>
                        <th className="p-4">Request Date</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {promotionRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-gray-800">{req.teacher_name}</div>
                            <div className="text-xs text-gray-400">ID: {req.teacher_id?.slice(0, 8)}...</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{req.from_class}</span>
                              <FaArrowRight className="text-gray-400 text-xs" />
                              <span className="text-sm font-semibold text-primary">{req.requested_class}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-gray-600">{req.student_ids?.length || 0} students</span>
                          </td>
                          <td className="p-4 text-sm text-gray-500">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold">
                              <FaClock size={10} /> Pending
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleApproveRequest(req)} 
                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" 
                                title="Approve"
                              >
                                <FaCheckCircle size={16} />
                              </button>
                              <button 
                                onClick={() => handleRejectRequest(req.id)} 
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" 
                                title="Reject"
                              >
                                <FaTimesCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {promotionRequests.map((req) => (
                    <div key={req.id} className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-800">{req.teacher_name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="text-gray-500">{req.from_class}</span>
                          <FaArrowRight className="text-gray-400 text-xs" />
                          <span className="text-primary font-medium">{req.requested_class}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-xs">
                        <span className="text-gray-500">{req.student_ids?.length || 0} students</span>
                        <span className="text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-semibold">
                          <FaClock size={10} /> Pending
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveRequest(req)} 
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.id)} 
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative w-full sm:w-72">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search history..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-gray-200"
                />
              </div>
            </div>

            {promotionHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaHistory className="text-4xl text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No promotion history</p>
                <p className="text-sm text-gray-400 mt-1">Promoted students will appear here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                        <th className="p-4">Student</th>
                        <th className="p-4">Class Progress</th>
                        <th className="p-4">Session/Term</th>
                        <th className="p-4">Promoted By</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {promotionHistory.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="font-medium text-gray-800">{record.student_name}</div>
                            <div className="text-xs text-gray-400">ID: {record.student_id?.slice(0, 8)}...</div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{record.from_class}</span>
                              <FaArrowRight className="text-gray-400 text-xs" />
                              <span className="text-sm font-semibold text-primary">{record.to_class}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-600">{record.academic_session}</div>
                            <div className="text-xs text-gray-400">{record.academic_term}</div>
                          </td>
                          <td className="p-4 text-sm text-gray-500">{record.promoted_by}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleReverse(record)}
                              className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reverse Promotion"
                            >
                              <FaUndo size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {promotionHistory.map((record) => (
                    <div key={record.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{record.student_name}</h3>
                          <p className="text-xs text-gray-500 mt-1">ID: {record.student_id?.slice(0, 8)}...</p>
                        </div>
                        <button
                          onClick={() => handleReverse(record)}
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg"
                        >
                          <FaUndo size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="text-gray-500">{record.from_class}</span>
                        <FaArrowRight className="text-gray-400 text-xs" />
                        <span className="text-primary font-semibold">{record.to_class}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{record.academic_session}</span>
                        <span>•</span>
                        <span>{record.academic_term}</span>
                        <span>•</span>
                        <span>By: {record.promoted_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
