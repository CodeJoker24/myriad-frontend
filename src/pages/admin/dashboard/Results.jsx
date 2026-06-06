import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../db';
import { 
  FaSpinner, FaSchool, FaDownload, FaChevronDown, FaLayerGroup,
  FaSearch, FaUserGraduate, FaBookOpen, FaTrophy,
  FaChartLine, FaPercentage, FaArrowUp, FaArrowDown, FaEye,
  FaTable, FaThList, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export const Results = () => {
  const printRef = useRef();
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeSession, setActiveSession] = useState('');
  const [activeTerm, setActiveTerm] = useState('');
  
  const [classList, setClassList] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [broadsheetData, setBroadsheetData] = useState([]);
  const [subjectMetrics, setSubjectMetrics] = useState({});
  const [scoreTypeView, setScoreTypeView] = useState('total');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [mobileView, setMobileView] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobileView(isMobile);
      setItemsPerPage(isMobile ? 5 : 10);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchAdminContext();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassBroadsheetData(selectedClass);
      setCurrentPage(1);
      setSearchQuery('');
      setSelectedGender('all');
    } else {
      setBroadsheetData([]);
      setSubjects([]);
    }
  }, [selectedClass]);

  const fetchAdminContext = async () => {
    try {
      setInitialLoad(true);

      const { data: settingsData, error: settingsError } = await supabase
        .from('academic_settings')
        .select('*')
        .eq('is_active', true);

      if (settingsError) throw settingsError;

      const activeSessionRow = settingsData.find(s => s.type === 'session');
      const activeTermRow = settingsData.find(s => s.type === 'term');

      if (!activeSessionRow || !activeTermRow) {
        Swal.fire('Configuration Unset', 'Active session and term parameters must be initialized by Admin.', 'warning');
        return;
      }

      setActiveSession(activeSessionRow.value);
      setActiveTerm(activeTermRow.value.split(' (')[0]);

      const { data: classesData, error: classError } = await supabase
        .from('students')
        .select('class_name')
        .eq('is_active', true);

      if (classError) throw classError;

      const uniqueClasses = [...new Set((classesData || []).map(s => s.class_name.trim()))].sort();
      setClassList(uniqueClasses);

    } catch (err) {
      console.error("Admin context load failure:", err.message);
      Swal.fire('System Failure', err.message, 'error');
    } finally {
      setInitialLoad(false);
    }
  };

  const loadClassBroadsheetData = async (targetClass) => {
    try {
      setLoading(true);

      let baseClassName = targetClass;
      const classMatch = targetClass.match(/^(basic\s+\d+|jss\s+\d+|ss\s+\d+|jss\d+|ss\d+|creche|nursery\s+\d+|nursery\d+)/i);
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
        .select('subject_name')
        .or(`class_name.ilike."${targetClass}",class_name.ilike."${baseClassName}",class_name.ilike."${secondaryVariant}"`);

      if (cError) throw cError;
      const subjectsArray = [...new Set((curriculum || []).map(c => c.subject_name))];
      setSubjects(subjectsArray);

      const { data: roster, error: rError } = await supabase
        .from('students')
        .select('id, student_id, name, gender')
        .eq('class_name', targetClass)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (rError) throw rError;

      const { data: marksData, error: mError } = await supabase
        .from('student_marks')
        .select('*')
        .eq('class_name', targetClass)
        .eq('term', activeTerm)
        .eq('session', activeSession);

      if (mError) throw mError;

      computeAdminMatrix(roster || [], subjectsArray, marksData || []);

    } catch (err) {
      console.error("Matrix generation failure:", err.message);
      Swal.fire('Fetch Failure', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const computeAdminMatrix = (roster, subjectsList, marks) => {
    const marksLookup = {};
    marks.forEach(m => {
      if (!marksLookup[m.student_id]) marksLookup[m.student_id] = {};
      marksLookup[m.student_id][m.subject_name] = m;
    });

    let calculatedRows = roster.map(student => {
      let cumulativeTotal = 0;
      let subjectsCount = 0;
      let subjectScoresMap = {};

      subjectsList.forEach(subj => {
        const markRecord = marksLookup[student.id]?.[subj];
        if (markRecord) {
          const total = parseFloat(markRecord.total_score) || 0;
          subjectScoresMap[subj] = {
            ca: markRecord.ca_score,
            exam: markRecord.exam_score,
            total: total,
            grade: markRecord.final_grade || '-'
          };
          if (markRecord.ca_score !== '' || markRecord.exam_score !== '') {
            cumulativeTotal += total;
            subjectsCount++;
          }
        } else {
          subjectScoresMap[subj] = { ca: '-', exam: '-', total: '-', grade: '-' };
        }
      });

      const averageScore = subjectsCount > 0 ? (cumulativeTotal / subjectsCount) : 0;

      return {
        ...student,
        subjectScores: subjectScoresMap,
        grandTotal: cumulativeTotal,
        average: parseFloat(averageScore.toFixed(2)),
        subjectsTakenCount: subjectsCount
      };
    });

    const sortedAverages = [...calculatedRows]
      .filter(r => r.subjectsTakenCount > 0)
      .map(r => r.average)
      .sort((a, b) => b - a);

    calculatedRows = calculatedRows.map(row => {
      if (row.subjectsTakenCount === 0) {
        return { ...row, position: '-' };
      }
      
      const positionIndex = sortedAverages.indexOf(row.average) + 1;
      const suffix = ["th", "st", "nd", "rd"][(positionIndex % 100 > 10 && positionIndex % 100 < 20) ? 0 : Math.min(positionIndex % 10, 3)];
      
      return {
        ...row,
        position: `${positionIndex}${suffix}`
      };
    });

    const metricsMap = {};
    subjectsList.forEach(subj => {
      const validScores = marks
        .filter(m => m.subject_name === subj)
        .map(m => parseFloat(m.total_score) || 0);

      if (validScores.length > 0) {
        metricsMap[subj] = {
          highest: Math.max(...validScores),
          lowest: Math.min(...validScores),
          average: parseFloat((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
        };
      } else {
        metricsMap[subj] = { highest: '-', lowest: '-', average: '-' };
      }
    });

    setBroadsheetData(calculatedRows);
    setSubjectMetrics(metricsMap);
  };

  const exportToCSV = () => {
    if (broadsheetData.length === 0) {
      Swal.fire('No Data', 'No data available to export.', 'warning');
      return;
    }

    let csvRows = [];
    
    const headers = ['S/N', 'Student ID', 'Name', 'Gender'];
    
    if (scoreTypeView === 'split') {
      subjects.forEach(subj => {
        headers.push(`${subj} (CA)`, `${subj} (Exam)`, `${subj} (Total/Grade)`);
      });
    } else {
      subjects.forEach(subj => {
        headers.push(`${subj} (Total/Grade)`);
      });
    }
    
    headers.push('Grand Total', 'Average (%)', 'Position');
    csvRows.push(headers);
    
    broadsheetData.forEach((student, idx) => {
      const row = [idx + 1, student.student_id, student.name, student.gender || '-'];
      
      if (scoreTypeView === 'split') {
        subjects.forEach(subj => {
          const score = student.subjectScores[subj];
          row.push(score?.ca || '-', score?.exam || '-', `${score?.total || '-'} ${score?.grade !== '-' ? `(${score.grade})` : ''}`);
        });
      } else {
        subjects.forEach(subj => {
          const score = student.subjectScores[subj];
          row.push(`${score?.total || '-'} ${score?.grade !== '-' ? `(${score.grade})` : ''}`);
        });
      }
      
      row.push(student.grandTotal, student.average, student.position);
      csvRows.push(row);
    });
    
    csvRows.push([]);
    csvRows.push(['CLASS STATISTICS']);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Students', broadsheetData.length]);
    csvRows.push(['Passed Students', broadsheetData.filter(s => s.average >= 40).length]);
    csvRows.push(['Failed Students', broadsheetData.filter(s => s.average > 0 && s.average < 40).length]);
    csvRows.push(['Class Average', (broadsheetData.reduce((sum, s) => sum + s.average, 0) / broadsheetData.length).toFixed(1) + '%']);
    csvRows.push(['Highest Average', Math.max(...broadsheetData.map(s => s.average), 0) + '%']);
    csvRows.push(['Lowest Average', Math.min(...broadsheetData.map(s => s.average).filter(a => a > 0), 0) + '%']);
    
    csvRows.push([]);
    csvRows.push(['SUBJECT METRICS']);
    const subjectMetricsRow = ['Subject', 'Highest Score', 'Lowest Score', 'Average Score'];
    csvRows.push(subjectMetricsRow);
    
    subjects.forEach(subj => {
      const metrics = subjectMetrics[subj];
      csvRows.push([subj, metrics?.highest || '-', metrics?.lowest || '-', metrics?.average !== '-' ? `${metrics?.average}%` : '-']);
    });
    
    const csvContent = csvRows.map(row => {
      return row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',');
    }).join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `broadsheet_${selectedClass}_${activeTerm}_${activeSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Swal.fire('Exported!', 'Broadsheet data has been exported to CSV.', 'success');
  };

  const filteredData = broadsheetData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
    return matchesSearch && matchesGender;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    totalStudents: broadsheetData.length,
    passedCount: broadsheetData.filter(s => s.average >= 40).length,
    failedCount: broadsheetData.filter(s => s.average > 0 && s.average < 40).length,
    classAverage: broadsheetData.length > 0 ? (broadsheetData.reduce((sum, s) => sum + s.average, 0) / broadsheetData.length).toFixed(1) : 0,
    highestAvg: broadsheetData.length > 0 ? Math.max(...broadsheetData.map(s => s.average), 0) : 0,
    lowestAvg: broadsheetData.length > 0 ? Math.min(...broadsheetData.map(s => s.average).filter(a => a > 0), 0) : 0
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-24">
        
        <div className="bg-linear-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl shadow-2xl mb-6 overflow-hidden">
          <div className="relative px-5 sm:px-7 py-5 sm:py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-indigo-500/20 backdrop-blur-sm p-1.5 rounded-lg">
                    <FaLayerGroup className="text-indigo-400 text-sm" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Administrative Control</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Global Master Broadsheet</h1>
                <p className="text-gray-300 text-sm mt-1">Audit scores across all class cohorts</p>
              </div>
              
              <div className="flex gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                <div className="text-center border-r border-white/10 pr-4">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Session</p>
                  <p className="text-sm font-black text-white">{activeSession}</p>
                </div>
                <div className="text-center pl-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active Term</p>
                  <p className="text-sm font-black text-indigo-400">{activeTerm}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Select Class to Audit</label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-gray-50 text-slate-800 font-semibold text-sm px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none cursor-pointer appearance-none transition-all"
                >
                  <option value="">-- Choose a Classroom --</option>
                  {classList.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
              </div>
            </div>

            {selectedClass && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <div className="inline-flex rounded-lg p-1 bg-gray-100">
                  <button 
                    onClick={() => setScoreTypeView('total')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${scoreTypeView === 'total' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <FaTable className="text-xs" /> Totals
                  </button>
                  <button 
                    onClick={() => setScoreTypeView('split')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${scoreTypeView === 'split' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    <FaThList className="text-xs" /> Detailed
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <span className="text-xs text-gray-600 font-bold bg-gray-100 px-3 py-2 rounded-lg">
                    📚 Enrolled: {broadsheetData.length} Students
                  </span>
                  <button 
                    onClick={exportToCSV}
                    disabled={broadsheetData.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaDownload /> Export CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedClass && showStats && stats.totalStudents > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaUserGraduate className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.totalStudents}</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Total Students</p>
            </div>
            <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaTrophy className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.passedCount}</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Passed</p>
            </div>
            <div className="bg-linear-to-br from-red-500 to-red-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaChartLine className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.failedCount}</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Failed</p>
            </div>
            <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaPercentage className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.classAverage}%</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Class Avg</p>
            </div>
            <div className="bg-linear-to-br from-amber-500 to-amber-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaArrowUp className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.highestAvg}%</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Highest</p>
            </div>
            <div className="bg-linear-to-br from-rose-500 to-rose-600 rounded-xl p-3 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <FaArrowDown className="text-2xl opacity-80" />
                <span className="text-2xl font-black">{stats.lowestAvg}%</span>
              </div>
              <p className="text-xs mt-1 opacity-90">Lowest</p>
            </div>
          </div>
        )}

        {!selectedClass ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaSchool className="text-3xl text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Class Selected</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">Select a class from the dropdown to view the academic broadsheet</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <FaSpinner className="animate-spin text-3xl text-indigo-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading class data...</p>
          </div>
        ) : broadsheetData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaEye className="text-3xl text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">No Data Available</h3>
            <p className="text-sm text-gray-500">No student records or scores found for {selectedClass}</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by name or registration number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <select
                  value={selectedGender}
                  onChange={(e) => {
                    setSelectedGender(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-500 bg-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-indigo-500 transition whitespace-nowrap"
                >
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
              </div>
              <div className="mt-3 text-right">
                <span className="text-xs text-gray-500">
                  Showing {filteredData.length} of {broadsheetData.length} students
                </span>
              </div>
            </div>

            <div ref={printRef} className="printable-sheet-container">
              {!mobileView ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '65vh' }}>
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-linear-to-r from-slate-800 to-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                          <th className="py-3 px-3 text-center w-12">#</th>
                          <th className="py-3 px-3 text-left min-w-25">Reg No</th>
                          <th className="py-3 px-4 text-left min-w-40">Student Name</th>
                          <th className="py-3 px-3 text-center w-12">Sex</th>
                          {subjects.map((subj, idx) => (
                            <th key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-3 px-2 text-center min-w-20">
                              <div className="text-xs font-bold truncate max-w-25" title={subj}>
                                {subj.length > 12 ? subj.substring(0, 10) + '..' : subj}
                              </div>
                            </th>
                          ))}
                          <th className="py-3 px-3 text-center min-w-17.5">Total</th>
                          <th className="py-3 px-3 text-center min-w-17.5">Avg %</th>
                          <th className="py-3 px-3 text-center w-16">Pos</th>
                        </tr>
                        {scoreTypeView === 'split' && (
                          <tr className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                            <th colSpan="4"></th>
                            {subjects.map((_, idx) => (
                              <React.Fragment key={idx}>
                                <th className="p-1 text-center w-12 bg-blue-50/50">CA</th>
                                <th className="p-1 text-center w-12 bg-amber-50/50">Exam</th>
                                <th className="p-1 text-center w-12 bg-gray-200/50">Total</th>
                              </React.Fragment>
                            ))}
                            <th colSpan="3"></th>
                           </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedData.map((row, idx) => {
                          const overallPosition = (currentPage - 1) * itemsPerPage + idx + 1;
                          return (
                            <tr key={row.id} className="hover:bg-gray-50 transition-all">
                              <td className="py-2 px-3 text-center text-xs font-semibold text-gray-500">{overallPosition}</td>
                              <td className="py-2 px-3 font-mono text-xs font-bold text-indigo-600">{row.student_id}</td>
                              <td className="py-2 px-4 font-semibold text-gray-800">{row.name}</td>
                              <td className="py-2 px-3 text-center text-xs font-bold text-gray-500 uppercase">{row.gender?.charAt(0) || '-'}</td>
                              
                              {subjects.map((subj, sIdx) => {
                                const scoreObj = row.subjectScores[subj];
                                if (scoreTypeView === 'split') {
                                  return (
                                    <React.Fragment key={sIdx}>
                                      <td className="p-1 text-center text-xs text-gray-600 bg-blue-50/30">{scoreObj?.ca ?? '-'}</td>
                                      <td className="p-1 text-center text-xs text-gray-600 bg-amber-50/30">{scoreObj?.exam ?? '-'}</td>
                                      <td className={`p-1 text-center text-xs font-bold ${scoreObj?.grade === 'F9' ? 'text-red-600 bg-red-50/30' : 'text-gray-800'}`}>
                                        {scoreObj?.total ?? '-'}
                                      </td>
                                    </React.Fragment>
                                  );
                                }
                                return (
                                  <td key={sIdx} className={`p-2 text-center text-xs font-bold ${scoreObj?.grade === 'F9' ? 'text-red-600' : 'text-gray-800'}`}>
                                    {scoreObj?.total ?? '-'}
                                  </td>
                                );
                              })}
                              
                              <td className="py-2 px-3 text-center font-bold text-gray-800">{row.grandTotal}</td>
                              <td className="py-2 px-3 text-center font-black text-indigo-600">{row.average}%</td>
                              <td className="py-2 px-3 text-center font-black text-indigo-700 bg-indigo-50/50">{row.position}</td>
                            </tr>
                          );
                        })}
                        
                        {subjects.length > 0 && (
                          <>
                            <tr className="bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                              <td colSpan="4" className="py-2 px-3 text-right">Highest →</td>
                              {subjects.map((subj, idx) => (
                                <td key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-2 px-1 text-center font-mono font-black">
                                  {subjectMetrics[subj]?.highest ?? '-'}
                                </td>
                              ))}
                              <td colSpan="3"></td>
                            </tr>
                            <tr className="bg-rose-50 text-rose-800 text-[11px] font-bold">
                              <td colSpan="4" className="py-2 px-3 text-right">Lowest →</td>
                              {subjects.map((subj, idx) => (
                                <td key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-2 px-1 text-center font-mono font-black">
                                  {subjectMetrics[subj]?.lowest ?? '-'}
                                </td>
                              ))}
                              <td colSpan="3"></td>
                            </tr>
                            <tr className="bg-blue-50 text-blue-800 text-[11px] font-bold">
                              <td colSpan="4" className="py-2 px-3 text-right">Average →</td>
                              {subjects.map((subj, idx) => (
                                <td key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-2 px-1 text-center font-mono font-black">
                                  {subjectMetrics[subj]?.average !== '-' ? `${subjectMetrics[subj]?.average}` : '-'}
                                </td>
                              ))}
                              <td colSpan="3"></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="text-xs text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} students
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 hover:bg-gray-100 transition">First</button>
                      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 hover:bg-gray-100 transition"><FaChevronLeft /></button>
                      <span className="px-3 py-1 text-xs font-semibold">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 hover:bg-gray-100 transition"><FaChevronRight /></button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 hover:bg-gray-100 transition">Last</button>
                    </div>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border rounded-lg text-xs bg-white">
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedData.map((row, idx) => {
                    const overallPosition = (currentPage - 1) * itemsPerPage + idx + 1;
                    const passedSubjects = subjects.filter(subj => {
                      const score = row.subjectScores[subj]?.total;
                      return score !== '-' && parseFloat(score) >= 40;
                    }).length;
                    const totalSubjects = subjects.filter(subj => row.subjectScores[subj]?.total !== '-').length;

                    return (
                      <div key={row.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 bg-linear-to-r from-gray-50 to-white cursor-pointer flex items-center justify-between" onClick={() => setExpandedStudent(expandedStudent === row.id ? null : row.id)}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{overallPosition}</span>
                              <span className="font-bold text-gray-800 text-sm">{row.name}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{row.student_id}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">{row.position}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-indigo-600">{row.average}%</div>
                            <div className="text-xs text-gray-500">Total: {row.grandTotal}</div>
                          </div>
                        </div>
                        
                        {expandedStudent === row.id && (
                          <div className="px-4 py-3 bg-white border-t border-gray-100">
                            <div className="mb-3 p-2 bg-gray-50 rounded-xl grid grid-cols-2 gap-2 text-center">
                              <div><p className="text-xs text-gray-500">Passed Subjects</p><p className="text-lg font-bold text-green-600">{passedSubjects}/{totalSubjects}</p></div>
                              <div><p className="text-xs text-gray-500">Performance</p><p className="text-lg font-bold text-indigo-600">{row.average}%</p></div>
                            </div>
                            <div className="space-y-2">
                              {subjects.map((subj, sIdx) => {
                                const scoreObj = row.subjectScores[subj];
                                const isPass = scoreObj?.total !== '-' && parseFloat(scoreObj.total) >= 40;
                                return (
                                  <div key={sIdx} className={`border rounded-xl p-3 ${isPass ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-semibold text-gray-700 text-sm flex items-center gap-1"><FaBookOpen className="text-indigo-500 text-xs" /> {subj}</span>
                                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{scoreObj?.total ?? '-'}</span>
                                    </div>
                                    {scoreTypeView === 'split' && (
                                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="p-1.5 bg-white rounded-lg"><p className="text-gray-500">CA</p><p className="font-bold text-gray-700">{scoreObj?.ca ?? '-'}</p></div>
                                        <div className="p-1.5 bg-white rounded-lg"><p className="text-gray-500">Exam</p><p className="font-bold text-gray-700">{scoreObj?.exam ?? '-'}</p></div>
                                        <div className="p-1.5 bg-white rounded-lg"><p className="text-gray-500">Grade</p><p className={`font-bold ${scoreObj?.grade === 'F9' ? 'text-red-600' : 'text-green-600'}`}>{scoreObj?.grade ?? '-'}</p></div>
                                      </div>
                                    )}
                                    {scoreTypeView === 'total' && scoreObj?.grade && scoreObj.grade !== '-' && (
                                      <div className="mt-2 text-center"><span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreObj.grade === 'F9' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Grade: {scoreObj.grade}</span></div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <div className="bg-gray-50 rounded-xl px-4 py-3">
                    <div className="text-xs text-gray-600 text-center mb-3">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} students</div>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white">First</button>
                      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"><FaChevronLeft /></button>
                      <span className="px-3 py-1 text-xs font-semibold bg-white border rounded-lg">{currentPage} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"><FaChevronRight /></button>
                      <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white">Last</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {selectedClass && broadsheetData.length > 0 && (
          <div className="bg-linear-to-r from-gray-100 to-white rounded-xl mt-4 p-3 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div><span className="text-gray-600">A-C (Excellent/Good)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><span className="text-gray-600">D-P (Pass)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-gray-600">F9 (Fail)</span></div>
              <div className="flex items-center gap-1.5"><FaEye className="text-gray-400 text-xs" /><span className="text-gray-500">Tap student card for details</span></div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
        }
      `}</style>
    </div>
  );
};

const React = { Fragment: ({ children }) => children };