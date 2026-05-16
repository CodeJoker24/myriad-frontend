import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { 
  FaTrash, FaSpinner, FaChartLine, FaTachometerAlt, FaLock, FaUnlock, 
  FaClock, FaCalendarAlt, FaSchool, FaLayerGroup, FaPlus, FaChevronDown, FaCheckCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2'; 

export const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [activeCategory, setActiveCategory] = useState('sessions');
  const [expandedSession, setExpandedSession] = useState(null);
  
  const [fullAcademicYear, setFullAcademicYear] = useState({
    sessionName: '', 
    sessionStart: '',
    sessionEnd: '',
    terms: [
      { name: 'First Term', start: '', end: '' },
      { name: 'Second Term', start: '', end: '' },
      { name: 'Third Term', start: '', end: '' }
    ]
  });

  const [newGrade, setNewGrade] = useState({ grade: '', minScore: '', maxScore: '', remark: '' });

  useEffect(() => {
    fetchSettings();
    fetchGradingScales();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('academic_settings').select('*').order('created_at', { ascending: false });
    if (data) setSettings(data);
    setLoading(false);
  };

  const fetchGradingScales = async () => {
    const { data } = await supabase.from('grading_scales').select('*').order('minScore', { ascending: false });
    if (data) setGradingScales(data || []);
  };

  const toggleActive = async (id, type) => {
    setLoading(true);
    try {
      await supabase
        .from('academic_settings')
        .update({ is_active: false })
        .eq('type', type)
        .eq('is_active', true);

      const { error } = await supabase
        .from('academic_settings')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      await fetchSettings();
      Swal.fire({ icon: 'success', title: `${type} Activated`, timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error("Critical Error:", err);
      Swal.fire('Constraint Error', 'Please run the Step 1 SQL script again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFullYear = async () => {
    if (!fullAcademicYear.sessionName) return Swal.fire('Error', 'Enter Session Name', 'error');
    setLoading(true);
    try {
      const sessionRow = { type: 'session', value: fullAcademicYear.sessionName, start_date: fullAcademicYear.sessionStart, end_date: fullAcademicYear.sessionEnd, is_active: false };
      const termRows = fullAcademicYear.terms.map(t => ({
        type: 'term',
        value: `${t.name} (${fullAcademicYear.sessionName})`,
        start_date: t.start,
        end_date: t.end,
        is_active: false
      }));

      const { error } = await supabase.from('academic_settings').insert([sessionRow, ...termRows]);
      if (error) throw error;
      setFullAcademicYear({ sessionName: '', sessionStart: '', sessionEnd: '', terms: [{ name: 'First Term', start: '', end: '' }, { name: 'Second Term', start: '', end: '' }, { name: 'Third Term', start: '', end: '' }] });
      fetchSettings();
      Swal.fire('Success', 'Academic Year Created', 'success');
    } catch (err) { Swal.fire('Error', err.message, 'error'); } 
    finally { setLoading(false); }
  };

  const handleAddGrade = async () => {
    if (!newGrade.grade) return;
    await supabase.from('grading_scales').insert([newGrade]);
    setNewGrade({ grade: '', minScore: '', maxScore: '', remark: '' });
    fetchGradingScales();
  };

  const sessionsOnly = settings.filter(s => s.type === 'session');
  const getTermsForSession = (sessionName) => settings.filter(s => s.type === 'term' && s.value.includes(`(${sessionName})`));

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <FaTachometerAlt className="text-primary text-xl" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">School Control Center</h1>
            </div>
            <p className="text-gray-500 ml-13">Manage academic sessions, terms, and grading rules</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit">
            <button 
              onClick={() => setActiveCategory('sessions')} 
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeCategory === 'sessions' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FaCalendarAlt /> Calendar
            </button>
            <button 
              onClick={() => setActiveCategory('grading')} 
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeCategory === 'grading' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <FaChartLine /> Grading
            </button>
          </div>
        </div>

        {/* SESSIONS SECTION */}
        {activeCategory === 'sessions' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Create Academic Year Form - Left Side */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden sticky top-6">
                <div className="bg-linear-to-r from-primary/10 to-transparent px-6 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                      <FaPlus className="text-white text-xs" />
                    </div>
                    Create Academic Year
                  </h2>
                </div>
                
                <div className="p-6 space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Session Name</label>
                    <input 
                      placeholder="e.g., 2024/2025" 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                      value={fullAcademicYear.sessionName} 
                      onChange={(e) => setFullAcademicYear({...fullAcademicYear, sessionName: e.target.value})} 
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Terms</label>
                    <div className="space-y-3">
                      {fullAcademicYear.terms.map((term, index) => (
                        <div key={index} className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                          <p className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2">
                            <FaClock className="text-blue-500" />
                            {term.name}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-gray-500 block mb-1">Start Date</label>
                              <input 
                                type="date" 
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                onChange={(e) => { const u = [...fullAcademicYear.terms]; u[index].start = e.target.value; setFullAcademicYear({...fullAcademicYear, terms: u}); }} 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 block mb-1">End Date</label>
                              <input 
                                type="date" 
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                onChange={(e) => { const u = [...fullAcademicYear.terms]; u[index].end = e.target.value; setFullAcademicYear({...fullAcademicYear, terms: u}); }} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCreateFullYear} 
                    disabled={loading}
                    className="w-full mt-4 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                    Create Academic Year
                  </button>
                </div>
              </div>
            </div>

            {/* Sessions List - Right Side */}
            <div className="lg:col-span-7 space-y-4">
              {sessionsOnly.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaSchool className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No academic sessions yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first session using the form</p>
                </div>
              ) : (
                sessionsOnly.map((session) => {
                  const terms = getTermsForSession(session.value);
                  const isExpanded = expandedSession === session.id;
                  return (
                    <div key={session.id} className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${session.is_active ? 'border-primary ring-2 ring-primary/10 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                      {/* Session Header */}
                      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.is_active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                            <FaSchool className="text-xl" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{session.value}</h4>
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <FaCalendarAlt size={10} />
                              {session.start_date || 'TBD'} — {session.end_date || 'TBD'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!session.is_active && (
                            <button 
                              onClick={() => toggleActive(session.id, 'session')} 
                              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-primary hover:text-white transition-all"
                            >
                              Set Active
                            </button>
                          )}
                          <button 
                            onClick={() => setExpandedSession(isExpanded ? null : session.id)} 
                            className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-all"
                          >
                            <FaChevronDown className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Terms */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                          <div className="pt-3 space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Terms</p>
                            {terms.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-4">No terms added</p>
                            ) : (
                              terms.map((term) => (
                                <div key={term.id} className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${term.is_active ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
                                  <div>
                                    <p className={`text-sm font-semibold ${term.is_active ? 'text-blue-700' : 'text-gray-700'}`}>
                                      {term.value.split(' (')[0]}
                                    </p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                      <FaCalendarAlt size={9} />
                                      {term.start_date || 'TBD'} — {term.end_date || 'TBD'}
                                    </p>
                                  </div>
                                  {term.is_active ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                      <FaCheckCircle size={10} /> Current
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => toggleActive(term.id, 'term')} 
                                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-all"
                                    >
                                      Start Term
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* GRADING SECTION */}
        {activeCategory === 'grading' && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
            {/* Add Grade Form */}
            <div className="bg-linear-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <FaChartLine className="text-white text-xs" />
                </div>
                Add Grading Rule
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <input 
                  placeholder="Grade (A, B, C)"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                  value={newGrade.grade}
                  onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})}
                />
                <input 
                  placeholder="Min %"
                  type="number"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                  value={newGrade.minScore}
                  onChange={(e) => setNewGrade({...newGrade, minScore: e.target.value})}
                />
                <input 
                  placeholder="Max %"
                  type="number"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                  value={newGrade.maxScore}
                  onChange={(e) => setNewGrade({...newGrade, maxScore: e.target.value})}
                />
                <input 
                  placeholder="Remark (e.g., Excellent)"
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50"
                  value={newGrade.remark}
                  onChange={(e) => setNewGrade({...newGrade, remark: e.target.value})}
                />
                <button 
                  onClick={handleAddGrade}
                  className="bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold py-3 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <FaPlus size={14} /> Add Rule
                </button>
              </div>
            </div>

            {/* Grading Table */}
            <div className="overflow-x-auto border-t border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Range</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Remark</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gradingScales.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-gray-400">
                        <FaChartLine className="text-4xl mx-auto mb-3 text-gray-300" />
                        <p>No grading rules added yet</p>
                        <p className="text-sm mt-1">Add your first grading rule above</p>
                      </td>
                    </tr>
                  ) : (
                    gradingScales.map((g) => (
                      <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center justify-center w-10 h-10 bg-primary/10 text-primary font-bold rounded-xl">
                            {g.grade}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-700">
                          {g.minScore}% - {g.maxScore}%
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {g.remark || '-'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button 
                            onClick={() => {
                              const confirm = async () => {
                                const result = await Swal.fire({
                                  title: 'Delete Grade?',
                                  text: `Remove ${g.grade} from grading system?`,
                                  icon: 'warning',
                                  showCancelButton: true,
                                  confirmButtonText: 'Yes, delete'
                                });
                                if (result.isConfirmed) {
                                  await supabase.from('grading_scales').delete().eq('id', g.id);
                                  fetchGradingScales();
                                  Swal.fire('Deleted', 'Grade removed', 'success');
                                }
                              };
                              confirm();
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grading Info */}
            <div className="bg-blue-50 px-6 py-4 border-t border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <FaChartLine className="text-blue-500 text-sm" />
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Grading Scale Reference</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-600">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> A (70-100) - Excellent</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> B (60-69) - Very Good</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> C (50-59) - Good</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> D (45-49) - Credit</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> E (40-44) - Pass</div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> F (0-39) - Fail</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};