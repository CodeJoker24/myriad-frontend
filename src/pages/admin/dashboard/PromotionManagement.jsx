import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaUsers, FaSearch, FaSpinner, FaHistory, 
  FaClock, FaChevronRight, FaUndo, FaCheckCircle, FaFilter,
  FaTimes, FaChevronDown, FaUserGraduate, FaCalendarAlt, FaBookOpen,
  FaHourglassHalf, FaTimesCircle, FaArrowRight, FaEye, FaTrashAlt,
  FaUser, FaSchool, FaList, FaCheckDouble
} from 'react-icons/fa';

export const PromotionManagement = () => {
  const [activeTab, setActiveTab] = useState('promote');
  const [loading, setLoading] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [viewingRequestStudents, setViewingRequestStudents] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [promotionRequests, setPromotionRequests] = useState([]);

  const [filterClass, setFilterClass] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [targetClass, setTargetClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestSearchQuery, setRequestSearchQuery] = useState('');

  const [rejectRequestId, setRejectRequestId] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminName(user.email.split('@')[0]);

      const { data: classData } = await supabase.from('classes').select('name').order('name');
      const { data: sessionData } = await supabase.from('academic_settings').select('value').eq('type', 'session');
      const { data: termData } = await supabase.from('academic_settings').select('value').eq('type', 'term');

      setClasses(classData || []);
      setSessions(sessionData || []);
      setTerms(termData || []);

      if (sessionData && sessionData.length > 0) {
        const activeSess = sessionData[0].value;
        setFilterSession(activeSess);
        await Promise.all([
          fetchStudents('', activeSess),
          fetchRequests()
        ]);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (className, sessionName) => {
    try {
      let query = supabase.from('students').select('*').eq('is_active', true);
      if (className) query = query.eq('class_name', className);
      const { data } = await query.order('name');
      setStudents(data || []);
      setSelectedStudentIds([]);
      setSelectAll(false);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRequests = async () => {
    const { data } = await supabase.from('promotion_requests').select('*').order('created_at', { ascending: false });
    setPromotionRequests(data || []);
  };

  const handleOpenRequestModal = async (request) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .in('id', request.student_ids);
      
      if (!error && data) {
        setViewingRequestStudents({ ...request, students_details: data });
        setShowStudentModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request) => {
    const result = await Swal.fire({
      title: 'Approve Promotion?',
      text: `Are you sure you want to promote these students to ${request.requested_class}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const { error: upErr } = await supabase
        .from('students')
        .update({ class_name: request.requested_class })
        .in('id', request.student_ids);

      if (upErr) throw upErr;

      const { error: reqErr } = await supabase
        .from('promotion_requests')
        .update({ status: 'approved', remarks: 'Approved by Admin' })
        .eq('id', request.id);

      if (reqErr) throw reqErr;

      await logActivity(`Approved promotion from ${request.from_class} to ${request.requested_class}`, 'admin');
      Swal.fire('Success', 'Promotion request approved!', 'success');
      setShowStudentModal(false);
      fetchRequests();
      fetchStudents(filterClass, filterSession);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openRejectModal = (requestId) => {
    setRejectRequestId(requestId);
    setRejectionRemarks('');
    setShowRejectModal(true);
  };

  const handleRejectRequest = async () => {
    if (!rejectionRemarks.trim()) return Swal.fire('Error', 'Please enter a reason.', 'error');
    setLoading(true);
    try {
      const { error } = await supabase
        .from('promotion_requests')
        .update({ status: 'rejected', remarks: rejectionRemarks })
        .eq('id', rejectRequestId);

      if (error) throw error;

      Swal.fire('Rejected', 'Request sent back to teacher.', 'info');
      setShowRejectModal(false);
      setShowStudentModal(false);
      fetchRequests();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    const result = await Swal.fire({
      title: 'Delete Request?',
      text: 'This action cannot be undone. The request will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('promotion_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await logActivity(`Deleted promotion request`, 'admin');
      Swal.fire('Deleted', 'Request has been removed.', 'success');
      fetchRequests();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPromote = async () => {
    if (selectedStudentIds.length === 0) return Swal.fire('Info', 'Select students first.', 'info');
    if (!targetClass) return Swal.fire('Warning', 'Select target class.', 'warning');

    const confirmed = await Swal.fire({
      title: 'Are you sure?',
      text: `Promoting ${selectedStudentIds.length} students to ${targetClass}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Promote'
    });

    if (!confirmed.isConfirmed) return;
    setLoading(true);

    try {
      const { error: upErr } = await supabase.from('students').update({ class_name: targetClass }).in('id', selectedStudentIds);
      if (upErr) throw upErr;

      await logActivity(`Directly promoted ${selectedStudentIds.length} students to ${targetClass}`, 'admin');
      Swal.fire('Successful', 'Students promoted successfully.', 'success');
      fetchStudents(filterClass, filterSession);
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredRequests = promotionRequests.filter(r => 
    r.teacher_name.toLowerCase().includes(requestSearchQuery.toLowerCase()) || 
    r.from_class.toLowerCase().includes(requestSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaGraduationCap className="text-xl text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Promotion Center</h1>
                <p className="text-xs text-gray-500 font-medium">Manage student class migrations and teacher requests</p>
              </div>
            </div>
            <div className="bg-linear-to-r from-gray-100 to-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Operator</span>
              <span className="text-xs font-black text-slate-700">{adminName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap bg-white rounded-t-2xl px-4">
          <button 
            onClick={() => setActiveTab('promote')} 
            className={`px-5 py-3.5 text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'promote' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaUsers /> Direct Migration
          </button>
          <button 
            onClick={() => setActiveTab('requests')} 
            className={`px-5 py-3.5 text-xs md:text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'requests' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaHourglassHalf /> Teacher Requests
            {promotionRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {promotionRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'promote' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Current Class</label>
                  <select 
                    value={filterClass} 
                    onChange={(e) => { 
                      setFilterClass(e.target.value); 
                      fetchStudents(e.target.value, filterSession); 
                    }} 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Target Class</label>
                  <select 
                    value={targetClass} 
                    onChange={(e) => setTargetClass(e.target.value)} 
                    className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">Select Target</option>
                    {classes.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={handleBulkPromote} 
                    disabled={loading || selectedStudentIds.length === 0 || !targetClass} 
                    className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaCheckDouble />}
                    Promote Selected ({selectedStudentIds.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
                <div className="relative max-w-md">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                    placeholder="Search students..." 
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b-2 border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectAll} 
                          onChange={(e) => { 
                            setSelectAll(e.target.checked); 
                            setSelectedStudentIds(e.target.checked ? filteredStudents.map(s => s.id) : []); 
                          }} 
                          className="rounded h-4 w-4 accent-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-4 text-left">Student</th>
                      <th className="p-4 text-left">ID</th>
                      <th className="p-4 text-left">Current Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-gray-400 font-medium">
                          <div className="flex flex-col items-center gap-2">
                            <FaUsers className="text-3xl text-gray-300" />
                            <p>Select a class to view students</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentIds.includes(s.id)} 
                              onChange={() => setSelectedStudentIds(prev => 
                                prev.includes(s.id) 
                                  ? prev.filter(id => id !== s.id) 
                                  : [...prev, s.id]
                              )} 
                              className="rounded h-4 w-4 accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                          <td className="p-4 font-mono font-bold text-blue-600">{s.student_id}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                              {s.class_name}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input 
                  value={requestSearchQuery} 
                  onChange={(e) => setRequestSearchQuery(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  placeholder="Search by teacher or class..." 
                />
              </div>
              {promotionRequests.length > 0 && (
                <button
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: 'Clear All Requests?',
                      text: `This will permanently delete all ${promotionRequests.length} promotion requests. This cannot be undone.`,
                      icon: 'warning',
                      showCancelButton: true,
                      confirmButtonColor: '#ef4444',
                      confirmButtonText: 'Yes, Delete All'
                    });
                    if (result.isConfirmed) {
                      setLoading(true);
                      try {
                        const { error } = await supabase
                          .from('promotion_requests')
                          .delete()
                          .neq('id', '00000000-0000-0000-0000-000000000000');
                        if (error) throw error;
                        await logActivity('Cleared all promotion requests', 'admin');
                        Swal.fire('Cleared', 'All requests have been removed.', 'success');
                        fetchRequests();
                      } catch (err) {
                        Swal.fire('Error', err.message, 'error');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5"
                >
                  <FaTrashAlt size={12} /> Clear All
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b-2 border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4 text-left">Date</th>
                    <th className="p-4 text-left">Teacher</th>
                    <th className="p-4 text-left">From</th>
                    <th className="p-4 text-left">Target</th>
                    <th className="p-4 text-center">Students</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-400 font-medium">
                        <div className="flex flex-col items-center gap-2">
                          <FaHourglassHalf className="text-3xl text-gray-300" />
                          <p>No promotion requests found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(r => (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="p-4 font-semibold text-gray-800">{r.teacher_name}</td>
                        <td className="p-4 text-gray-600">{r.from_class}</td>
                        <td className="p-4 font-bold text-blue-600">{r.requested_class}</td>
                        <td className="p-4 text-center font-semibold">{r.student_ids?.length || 0}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                              : r.status === 'approved' 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleOpenRequestModal(r)} 
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shadow-md hover:shadow-lg"
                            >
                              <FaEye size={11} /> Review
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(r.id)} 
                              className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all border border-red-200"
                              title="Delete request"
                            >
                              <FaTrashAlt size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showStudentModal && viewingRequestStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowStudentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-xl border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b bg-linear-to-r from-gray-50 to-white flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <FaList className="text-blue-600" /> Review Package
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-medium">{viewingRequestStudents.from_class}</span> 
                  <FaArrowRight className="inline mx-2 text-gray-300" size={10} />
                  <span className="font-bold text-blue-600">{viewingRequestStudents.requested_class}</span>
                </p>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <FaTimes className="text-gray-400" />
              </button>
            </div>

            <div className="p-5 max-h-75 overflow-y-auto space-y-2">
              {viewingRequestStudents.students_details?.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 border rounded-xl hover:bg-gray-100 transition">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">ID: {student.student_id}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400 uppercase">Status: {viewingRequestStudents.status}</span>
              {viewingRequestStudents.status === 'pending' ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => openRejectModal(viewingRequestStudents.id)} 
                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                  >
                    <FaTimes className="inline mr-1" /> Reject
                  </button>
                  <button 
                    onClick={() => handleApproveRequest(viewingRequestStudents)} 
                    className="px-5 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-md transition"
                  >
                    <FaCheckCircle className="inline mr-1" /> Approve
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowStudentModal(false)} className="px-5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md border shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-linear-to-r from-red-50 to-red-100">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                <FaTimesCircle className="text-red-600" /> Rejection Feedback
              </h3>
            </div>
            <div className="p-5">
              <textarea 
                rows="4" 
                value={rejectionRemarks} 
                onChange={(e) => setRejectionRemarks(e.target.value)} 
                placeholder="Provide reason for rejection..." 
                className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(false)} className="px-5 py-2 bg-white border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleRejectRequest} className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md transition">
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};