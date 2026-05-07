import { useState, useEffect } from 'react';
import { supabase, logActivity} from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaSearch, FaPaperPlane, FaHistory, 
  FaSpinner, FaArrowRight, FaStar, FaClock, FaCheckCircle, FaTimesCircle,
  FaEye, FaComment, FaChevronDown, FaTrashAlt
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

  useEffect(() => {
    const fetchTeacherAndStudents = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();

        if (teacher) {
          setTeacherData(teacher);
          const { data: stds } = await supabase
            .from('students')
            .select('*')
            .eq('class_name', teacher.is_class_teacher_of)
            .eq('is_active', true);
          if (stds) setStudents(stds);

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

  const handleSubmitRequest = async () => {
    if (selectedStudentIds.length === 0) {
      return Swal.fire('Wait!', 'Select students to promote.', 'warning');
    }

    const { value: targetClass } = await Swal.fire({
      title: 'Destination Class',
      input: 'text',
      inputLabel: 'Which class are they moving to?',
      placeholder: 'e.g. JSS 2A',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return 'You need to write something!';
      }
    });

    if (targetClass) {
      setLoading(true);
      const { error } = await supabase.from('promotion_requests').insert([{
        teacher_id: teacherData.id,
        teacher_name: teacherData.name,
        from_class: teacherData.is_class_teacher_of,
        requested_class: targetClass,
        student_ids: selectedStudentIds, 
        status: 'pending'
      }]);

      if (!error) {
        Swal.fire('Submitted', 'Request sent to Admin for approval.', 'success');
        setSelectedStudentIds([]);
        setActiveTab('history');
        const { data: hist } = await supabase.from('promotion_requests').select('*').eq('teacher_id', teacherData.id);
        setHistory(hist);
      }
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <FaGraduationCap className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Promotion Request</h1>
              <p className="text-sm text-gray-500">Managed by: <span className="font-bold">{teacherData?.name || 'Loading...'}</span></p>
            </div>
          </div>
        </div>

        {/* Tabs Menu */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('request')}
            className={`pb-2 px-4 ${activeTab === 'request' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}
          >
            Request
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}
          >
            History
          </button>
        </div>

        {/* REQUEST TAB */}
        {activeTab === 'request' && (
          <div>
            {/* Class Info Card */}
            <div className="bg-linear-to-r from-primary/5 to-blue-50 rounded-xl p-5 mb-6 border border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Your Assigned Class</p>
                  <h2 className="text-2xl font-bold text-gray-800">{teacherData?.is_class_teacher_of || '—'}</h2>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 text-center shadow-sm">
                  <p className="text-2xl font-bold text-primary">{students.length}</p>
                  <p className="text-xs text-gray-500">Total Students</p>
                </div>
              </div>
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleSubmitRequest}
                  disabled={loading || selectedStudentIds.length === 0}
                  className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <FaPaperPlane /> {loading ? 'Sending...' : 'Submit Request'}
                </button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                    <tr>
                      <th className="p-4 w-10">
                        <input type="checkbox" onChange={e => setSelectedStudentIds(e.target.checked ? students.map(s => s.id) : [])} />
                      </th>
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Student ID</th>
                      <th className="p-4">Current Class</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500">No students found</td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(s.id)}
                              onChange={() => setSelectedStudentIds(prev =>
                                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                              )}
                            />
                          </td>
                          <td className="p-4 font-medium">{s.name}</td>
                          <td className="p-4 text-sm text-gray-500">{s.student_id}</td>
                          <td className="p-4 text-sm text-gray-600">{s.class_name}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No students found</div>
                ) : (
                  filteredStudents.map(s => (
                    <div key={s.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">{s.name}</h3>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-medium">Active</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">ID: {s.student_id}</p>
                          <p className="text-xs text-gray-600 mt-1">Class: {s.class_name}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s.id)}
                          onChange={() => setSelectedStudentIds(prev =>
                            prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          )}
                          className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {filteredStudents.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-right">
                  <p className="text-xs text-gray-500">Selected: {selectedStudentIds.length} of {filteredStudents.length} students</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header with Delete Button */}
            <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative w-full sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search history..." className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-sm outline-none border border-gray-200" />
              </div>
              <button
                onClick={handleDeleteHistory}
                disabled={history.length === 0 || loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FaTrashAlt size={14} /> Delete History
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">From Class</th>
                    <th className="p-4">Requested Class</th>
                    <th className="p-4">Students</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">No promotion requests yet</td>
                    </tr>
                  ) : (
                    history.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="p-4 text-sm">{new Date(h.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-sm text-gray-600">{h.from_class}</td>
                        <td className="p-4 font-bold text-primary">{h.requested_class}</td>
                        <td className="p-4 text-sm">{h.student_ids?.length || 0} Students</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            h.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            h.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {h.status === 'rejected' && h.remarks ? (
                            <button onClick={() => viewRejectionReason(h)} className="flex items-center gap-1 text-red-500 hover:text-red-600 text-xs font-medium">
                              <FaComment size={12} /> View Reason
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {h.status === 'rejected' && h.remarks && (
                            <button onClick={() => viewRejectionReason(h)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                              <FaEye size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No promotion requests yet</div>
              ) : (
                history.map(h => (
                  <div key={h.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{h.from_class}</span>
                          <FaArrowRight className="text-gray-400 text-xs" />
                          <span className="text-sm font-semibold text-primary">{h.requested_class}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        h.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        h.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{h.student_ids?.length || 0} students</span>
                      {h.status === 'rejected' && h.remarks && (
                        <button onClick={() => viewRejectionReason(h)} className="text-red-500 text-xs font-medium flex items-center gap-1">
                          <FaComment size={12} /> View Reason
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

      {/* Rejection Reason Modal */}
      {showReasonModal && selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowReasonModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-linear-to-r from-red-50 to-transparent">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Rejection Reason</h2>
                <p className="text-sm text-gray-500 mt-1">Promotion request from {selectedHistoryItem.from_class} to {selectedHistoryItem.requested_class}</p>
              </div>
              <button onClick={() => setShowReasonModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                <FaTimesCircle size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <FaTimesCircle className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">Reason for rejection:</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{selectedHistoryItem.remarks || 'No specific reason provided.'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Request submitted on: {new Date(selectedHistoryItem.created_at).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Students affected: {selectedHistoryItem.student_ids?.length || 0}</p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setShowReasonModal(false)} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors">
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};