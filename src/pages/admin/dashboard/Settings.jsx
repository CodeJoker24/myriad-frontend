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

  // --- THE CORE FIX: Independent Toggling ---
  const toggleActive = async (id, type) => {
    setLoading(true);
    try {
      // 1. Turn off ONLY the active item of this TYPE
      await supabase
        .from('academic_settings')
        .update({ is_active: false })
        .eq('type', type)
        .eq('is_active', true);

      // 2. Turn on the new one
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

  // Grouping logic for the UI
  const sessionsOnly = settings.filter(s => s.type === 'session');
  const getTermsForSession = (sessionName) => settings.filter(s => s.type === 'term' && s.value.includes(`(${sessionName})`));

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black text-gray-900">School Control Center</h1>
           <p className="text-gray-500 font-medium">Manage Active Periods & Grading Rules</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button onClick={() => setActiveCategory('sessions')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === 'sessions' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>Calendar</button>
            <button onClick={() => setActiveCategory('grading')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeCategory === 'grading' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>Grading</button>
        </div>
      </div>

      {activeCategory === 'sessions' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* New Session Form */}
          <div className="xl:col-span-5">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl sticky top-6">
                <h2 className="font-black text-gray-800 mb-6 flex items-center gap-2"><FaPlus className="text-primary"/> New Academic Year</h2>
                <input placeholder="Session (e.g. 2024/2025)" className="w-full p-4 bg-gray-50 border rounded-2xl mb-4 font-bold outline-none focus:ring-2 focus:ring-primary/20" value={fullAcademicYear.sessionName} onChange={(e) => setFullAcademicYear({...fullAcademicYear, sessionName: e.target.value})} />
                <div className="space-y-3">
                    {fullAcademicYear.terms.map((term, index) => (
                        <div key={index} className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                            <p className="text-xs font-black text-blue-700 mb-2">{term.name}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" className="p-2 bg-white border rounded-lg text-[10px]" onChange={(e) => { const u = [...fullAcademicYear.terms]; u[index].start = e.target.value; setFullAcademicYear({...fullAcademicYear, terms: u}); }} />
                                <input type="date" className="p-2 bg-white border rounded-lg text-[10px]" onChange={(e) => { const u = [...fullAcademicYear.terms]; u[index].end = e.target.value; setFullAcademicYear({...fullAcademicYear, terms: u}); }} />
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleCreateFullYear} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all">SAVE FULL CYCLE</button>
            </div>
          </div>

          {/* List of Years */}
          <div className="xl:col-span-7 space-y-4">
            {sessionsOnly.map((session) => {
                const terms = getTermsForSession(session.value);
                const isExpanded = expandedSession === session.id;
                return (
                    <div key={session.id} className={`bg-white rounded-3xl border transition-all ${session.is_active ? 'border-primary ring-4 ring-primary/5' : 'border-gray-100'}`}>
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${session.is_active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}><FaSchool /></div>
                                <div>
                                    <h4 className="font-black text-gray-800 text-lg">{session.value}</h4>
                                    {session.is_active && <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">● Active Session</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!session.is_active && <button onClick={() => toggleActive(session.id, 'session')} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-primary hover:text-white">Set Active</button>}
                                <button onClick={() => setExpandedSession(isExpanded ? null : session.id)} className="p-3 bg-gray-50 rounded-xl text-gray-400"><FaChevronDown className={isExpanded ? 'rotate-180' : ''}/></button>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="p-6 pt-0 border-t border-gray-50 space-y-2 animate-fadeIn">
                                {terms.map(t => (
                                    <div key={t.id} className={`p-4 rounded-2xl border flex items-center justify-between ${t.is_active ? 'bg-blue-50 border-blue-100' : 'bg-gray-50/50'}`}>
                                        <div>
                                            <p className={`text-sm font-black ${t.is_active ? 'text-blue-600' : 'text-gray-600'}`}>{t.value.split(' (')[0]}</p>
                                            <p className="text-[10px] text-gray-400">Resumption: {t.start_date || 'N/A'}</p>
                                        </div>
                                        {t.is_active ? <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">● Current Term</span> : <button onClick={() => toggleActive(t.id, 'term')} className="px-3 py-1.5 bg-white border rounded-lg text-[10px] font-black text-gray-500 hover:border-blue-500 hover:text-blue-500">START TERM</button>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
          </div>
        </div>
      )}

      {/* Grading Rule Table (Simplified) */}
      {activeCategory === 'grading' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
             <div className="grid grid-cols-5 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl">
                <input placeholder="Grade" className="p-3 rounded-xl border font-bold" value={newGrade.grade} onChange={(e) => setNewGrade({...newGrade, grade: e.target.value})} />
                <input placeholder="Min %" type="number" className="p-3 rounded-xl border" value={newGrade.minScore} onChange={(e) => setNewGrade({...newGrade, minScore: e.target.value})} />
                <input placeholder="Max %" type="number" className="p-3 rounded-xl border" value={newGrade.maxScore} onChange={(e) => setNewGrade({...newGrade, maxScore: e.target.value})} />
                <input placeholder="Remark" className="p-3 rounded-xl border" value={newGrade.remark} onChange={(e) => setNewGrade({...newGrade, remark: e.target.value})} />
                <button onClick={handleAddGrade} className="bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/20">ADD RULE</button>
             </div>
             <table className="w-full text-left">
                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <tr><th className="p-4">Grade</th><th className="p-4">Range</th><th className="p-4">Remark</th><th className="p-4"></th></tr>
                </thead>
                <tbody>
                    {gradingScales.map(g => (
                        <tr key={g.id} className="border-t border-gray-50">
                            <td className="p-4"><span className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary font-black rounded-xl">{g.grade}</span></td>
                            <td className="p-4 font-bold text-gray-600">{g.minScore}% - {g.maxScore}%</td>
                            <td className="p-4 font-medium text-gray-500">{g.remark}</td>
                            <td className="p-4 text-right"><button className="text-red-200 hover:text-red-500"><FaTrash /></button></td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>
      )}
    </div>
  );
};