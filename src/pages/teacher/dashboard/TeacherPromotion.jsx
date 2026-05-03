import { useState, useEffect } from 'react';
import { supabase, logActivity} from '../../../db';
import Swal from 'sweetalert2';
import { 
  FaGraduationCap, FaSearch, FaPaperPlane, FaHistory, 
  FaSpinner, FaArrowRight, FaStar, FaClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';

export const TeacherPromotion = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [loading, setLoading] = useState(false);
  
  // Teacher & Class State
  const [teacherData, setTeacherData] = useState(null);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Teacher Profile and their Students
  useEffect(() => {
    const fetchTeacherAndStudents = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Fetch teacher details to find which class they lead
        // Note: Assumes your teachers table has 'is_class_teacher_of' column
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', user.email)
          .single();

        if (teacher) {
          setTeacherData(teacher);
          
          // Fetch students belonging to this teacher's class
          const { data: stds } = await supabase
            .from('students')
            .select('*')
            .eq('class_name', teacher.is_class_teacher_of)
            .eq('is_active', true);
          
          if (stds) setStudents(stds);

          // Fetch this teacher's request history
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

  // 2. Handle Submission
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
        student_ids: selectedStudentIds, // Stores as JSONB array
        status: 'pending'
      }]);

      if (!error) {
        Swal.fire('Submitted', 'Request sent to Admin for approval.', 'success');
        setSelectedStudentIds([]);
        setActiveTab('history');
        // Refresh history
        const { data: hist } = await supabase.from('promotion_requests').select('*').eq('teacher_id', teacherData.id);
        setHistory(hist);
      }
      setLoading(false);
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
          <button onClick={() => setActiveTab('request')} className={`pb-2 px-4 ${activeTab === 'request' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}>Request</button>
          <button onClick={() => setActiveTab('history')} className={`pb-2 px-4 ${activeTab === 'history' ? 'border-b-2 border-primary text-primary font-bold' : 'text-gray-400'}`}>History</button>
        </div>

        {activeTab === 'request' && (
          <>
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
              <div className="p-4 border-b flex justify-between gap-4">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-sm outline-none border" 
                    placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={handleSubmitRequest} disabled={loading || selectedStudentIds.length === 0} 
                  className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2">
                  <FaPaperPlane /> {loading ? 'Sending...' : 'Submit Request'}
                </button>
              </div>

              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="p-4 w-10"><input type="checkbox" onChange={e => setSelectedStudentIds(e.target.checked ? students.map(s => s.id) : [])} /></th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStudents.map(s => (
                    <tr key={s.id}>
                      <td className="p-4">
                        <input type="checkbox" checked={selectedStudentIds.includes(s.id)} 
                          onChange={() => setSelectedStudentIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])} />
                      </td>
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Requested Class</th>
                  <th className="p-4">Students</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="p-4 text-sm">{new Date(h.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-primary">{h.requested_class}</td>
                    <td className="p-4 text-sm">{h.student_ids.length} Students</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        h.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        h.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};