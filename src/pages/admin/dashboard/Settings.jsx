import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../../db';
import { 
  FaCalendarPlus, FaCheckCircle, FaTrash, FaPlus, FaCog, FaSpinner,
  FaChartLine, FaEdit, FaTimes, FaSave, FaStar, FaTachometerAlt
} from 'react-icons/fa';
import Swal from 'sweetalert2'; 

export const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [newValue, setNewValue] = useState({ type: 'session', value: '' });
  const [newGrade, setNewGrade] = useState({ grade: '', minScore: '', maxScore: '', remark: '', gpa: '' });
  const [editingGrade, setEditingGrade] = useState(null);
  const [activeCategory, setActiveCategory] = useState('sessions');

  useEffect(() => {
    fetchSettings();
    fetchGradingScales();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('academic_settings').select('*').order('created_at', { ascending: true });
    if (data) setSettings(data);
  };

  const fetchGradingScales = async () => {
    const { data } = await supabase.from('grading_scales').select('*').order('minScore', { ascending: true });
    if (data) setGradingScales(data);
  };

  const handleAddSetting = async (e) => {
    e.preventDefault();
    if (!newValue.value) return;

    setLoading(true);
    const { error } = await supabase.from('academic_settings').insert([newValue]);
    
    if (error) {
      Swal.fire('Error', 'This entry already exists', 'error');
    } else {
      setNewValue({ ...newValue, value: '' });
      fetchSettings();
      logActivity(`Added new ${newValue.type}: ${newValue.value}`, 'admin');
    }
    setLoading(false);
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!newGrade.grade || !newGrade.minScore || !newGrade.maxScore) {
      return Swal.fire('Error', 'Please fill all required fields', 'error');
    }

    setLoading(true);
    const gradeData = {
      grade: newGrade.grade,
      minScore: parseInt(newGrade.minScore),
      maxScore: parseInt(newGrade.maxScore),
      remark: newGrade.remark,
      gpa: parseFloat(newGrade.gpa) || 0
    };

    const { error } = await supabase.from('grading_scales').insert([gradeData]);
    
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setNewGrade({ grade: '', minScore: '', maxScore: '', remark: '', gpa: '' });
      fetchGradingScales();
      logActivity(`Added new grade: ${newGrade.grade} (${newGrade.minScore}-${newGrade.maxScore})`, 'admin');
      Swal.fire('Success', 'Grading scale added', 'success');
    }
    setLoading(false);
  };

  const handleUpdateGrade = async () => {
    if (!editingGrade) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('grading_scales')
      .update({
        grade: editingGrade.grade,
        minScore: parseInt(editingGrade.minScore),
        maxScore: parseInt(editingGrade.maxScore),
        remark: editingGrade.remark,
        gpa: parseFloat(editingGrade.gpa) || 0
      })
      .eq('id', editingGrade.id);
    
    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setEditingGrade(null);
      fetchGradingScales();
      logActivity(`Updated grade: ${editingGrade.grade}`, 'admin');
      Swal.fire('Success', 'Grading scale updated', 'success');
    }
    setLoading(false);
  };

  const deleteGrade = async (id, gradeName) => {
    const confirm = await Swal.fire({
      title: 'Delete Grade?',
      text: `Remove ${gradeName} from grading system?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    });

    if (confirm.isConfirmed) {
      await supabase.from('grading_scales').delete().eq('id', id);
      fetchGradingScales();
      logActivity(`Deleted grade: ${gradeName}`, 'admin');
      Swal.fire('Deleted', 'Grade removed', 'success');
    }
  };

  const toggleActive = async (id, type) => {
    await supabase.from('academic_settings').update({ is_current: false }).eq('type', type);
    await supabase.from('academic_settings').update({ is_current: true }).eq('id', id);
    fetchSettings();
    Swal.fire('Updated', `Active ${type} changed`, 'success');
  };

  const deleteSetting = async (id) => {
    const confirm = await Swal.fire({
      title: 'Delete?',
      text: "This might affect historical records!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    });

    if (confirm.isConfirmed) {
      await supabase.from('academic_settings').delete().eq('id', id);
      fetchSettings();
    }
  };

  const categories = [
    { id: 'sessions', name: 'Academic Sessions', icon: <FaCalendarPlus />, color: 'blue' },
    { id: 'terms', name: 'Academic Terms', icon: <FaCheckCircle />, color: 'green' },
    { id: 'grading', name: 'Grading System', icon: <FaChartLine />, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <FaCog className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">School Settings</h1>
              <p className="text-sm text-gray-500">Manage academic sessions, terms, and grading system</p>
            </div>
          </div>
        </div>

        {/* Category Tabs - Mobile Responsive */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                activeCategory === cat.id
                  ? `bg-${cat.color}-50 border-${cat.color}-200 text-${cat.color}-600 shadow-sm`
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-[10px] md:text-xs font-medium text-center">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* ACADEMIC SESSIONS SECTION */}
        {activeCategory === 'sessions' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-linear-to-r from-blue-50 to-white">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaCalendarPlus className="text-blue-500" /> Academic Sessions
              </h2>
              <p className="text-sm text-gray-500 mt-1">Add and manage school academic sessions</p>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleAddSetting} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., 2024/2025"
                  value={newValue.type === 'session' ? newValue.value : ''}
                  onChange={(e) => setNewValue({ type: 'session', value: e.target.value })}
                />
                <button type="submit" disabled={loading} className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
                  {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />} Add Session
                </button>
              </form>

              <div className="space-y-2">
                {settings.filter(s => s.type === 'session').length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCalendarPlus className="text-3xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No academic sessions added yet</p>
                  </div>
                ) : (
                  settings.filter(s => s.type === 'session').map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                      <span className={`font-medium ${s.is_current ? 'text-primary' : 'text-gray-700'}`}>
                        {s.value}
                        {s.is_current && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleActive(s.id, 'session')} 
                          className={`p-2 rounded-lg transition-colors ${s.is_current ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-green-500'}`}
                          title="Set as active"
                        >
                          <FaCheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => deleteSetting(s.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC TERMS SECTION */}
        {activeCategory === 'terms' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-linear-to-r from-green-50 to-white">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" /> Academic Terms
              </h2>
              <p className="text-sm text-gray-500 mt-1">Add and manage school academic terms</p>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleAddSetting} className="flex flex-col sm:flex-row gap-3 mb-6">
                <input 
                  className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g., First Term"
                  value={newValue.type === 'term' ? newValue.value : ''}
                  onChange={(e) => setNewValue({ type: 'term', value: e.target.value })}
                />
                <button type="submit" disabled={loading} className="px-5 py-3 bg-primary text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-dark transition-all">
                  {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />} Add Term
                </button>
              </form>

              <div className="space-y-2">
                {settings.filter(s => s.type === 'term').length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FaCheckCircle className="text-3xl mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No academic terms added yet</p>
                  </div>
                ) : (
                  settings.filter(s => s.type === 'term').map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                      <span className={`font-medium ${s.is_current ? 'text-primary' : 'text-gray-700'}`}>
                        {s.value}
                        {s.is_current && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleActive(s.id, 'term')} 
                          className={`p-2 rounded-lg transition-colors ${s.is_current ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-green-500'}`}
                          title="Set as active"
                        >
                          <FaCheckCircle size={16} />
                        </button>
                        <button 
                          onClick={() => deleteSetting(s.id)} 
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* GRADING SYSTEM SECTION */}
        {activeCategory === 'grading' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-linear-to-r from-purple-50 to-white">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaChartLine className="text-purple-500" /> Grading System
              </h2>
              <p className="text-sm text-gray-500 mt-1">Define grade boundaries, remarks, and GPA points</p>
            </div>
            
            <div className="p-5">
              {/* Add/Edit Grade Form */}
              <form onSubmit={editingGrade ? handleUpdateGrade : handleAddGrade} className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Grade</label>
                    <input
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="A, B, C..."
                      value={editingGrade ? editingGrade.grade : newGrade.grade}
                      onChange={(e) => editingGrade 
                        ? setEditingGrade({...editingGrade, grade: e.target.value})
                        : setNewGrade({...newGrade, grade: e.target.value})
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Min Score</label>
                    <input
                      type="number"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="70"
                      value={editingGrade ? editingGrade.minScore : newGrade.minScore}
                      onChange={(e) => editingGrade 
                        ? setEditingGrade({...editingGrade, minScore: e.target.value})
                        : setNewGrade({...newGrade, minScore: e.target.value})
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Max Score</label>
                    <input
                      type="number"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="100"
                      value={editingGrade ? editingGrade.maxScore : newGrade.maxScore}
                      onChange={(e) => editingGrade 
                        ? setEditingGrade({...editingGrade, maxScore: e.target.value})
                        : setNewGrade({...newGrade, maxScore: e.target.value})
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">GPA</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="4.0"
                      value={editingGrade ? editingGrade.gpa : newGrade.gpa}
                      onChange={(e) => editingGrade 
                        ? setEditingGrade({...editingGrade, gpa: e.target.value})
                        : setNewGrade({...newGrade, gpa: e.target.value})
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Remark</label>
                    <input
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Excellent"
                      value={editingGrade ? editingGrade.remark : newGrade.remark}
                      onChange={(e) => editingGrade 
                        ? setEditingGrade({...editingGrade, remark: e.target.value})
                        : setNewGrade({...newGrade, remark: e.target.value})
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  {editingGrade && (
                    <button
                      type="button"
                      onClick={() => setEditingGrade(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : editingGrade ? <FaSave /> : <FaPlus />}
                    {editingGrade ? 'Update Grade' : 'Add Grade'}
                  </button>
                </div>
              </form>

              {/* Grading Scale Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="p-3">Grade</th>
                      <th className="p-3">Score Range</th>
                      <th className="p-3">GPA</th>
                      <th className="p-3">Remark</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gradingScales.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400">
                          <FaChartLine className="text-3xl mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No grading scales defined yet</p>
                          <p className="text-xs mt-1">Add your first grade above</p>
                        </td>
                      </tr>
                    ) : (
                      gradingScales.map((grade, idx) => (
                        <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-primary text-lg">{grade.grade}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-gray-700">{grade.minScore} - {grade.maxScore}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm font-medium text-gray-700">{grade.gpa || '-'}</span>
                          </td>
                          <td className="p-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              grade.remark === 'Excellent' ? 'bg-green-100 text-green-700' :
                              grade.remark === 'Very Good' ? 'bg-blue-100 text-blue-700' :
                              grade.remark === 'Good' ? 'bg-cyan-100 text-cyan-700' :
                              grade.remark === 'Credit' ? 'bg-teal-100 text-teal-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {grade.remark || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingGrade(grade)} 
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit size={14} />
                              </button>
                              <button 
                                onClick={() => deleteGrade(grade.id, grade.grade)} 
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Grading Scale Info */}
              <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <FaTachometerAlt className="text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700">Grading Scale Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-600">
                  <div>• A (70-100) - Excellent</div>
                                  <div>• B (60-69) - Very Good</div>
                    <div>• C (50-59) - Good</div>
                  <div>• D (45-49) - Credit</div>
                  <div>• E (40-44) - Pass</div>
                  <div>• F (0-39) - Fail</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};