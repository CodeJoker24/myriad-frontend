import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../db';
import { 
  FaSpinner, FaDownload, FaSchool, FaCalculator, FaHashtag, FaPrint,
  FaChevronLeft, FaChevronRight, FaSortAmountDown, FaSortAmountUp,
  FaTable, FaThList, FaEye, FaArrowLeft, FaArrowRight, FaSearch,
  FaFilter, FaTrophy, FaChartLine, FaUserGraduate, FaBookOpen,
  FaGraduationCap, FaPercentage, FaDatabase, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import Swal from 'sweetalert2';

export const Broadsheet = () => {
  const printRef = useRef();
  
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [activeSession, setActiveSession] = useState('');
  const [activeTerm, setActiveTerm] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [broadsheetData, setBroadsheetData] = useState([]);
  const [subjectMetrics, setSubjectMetrics] = useState({});
  const [scoreTypeView, setScoreTypeView] = useState('total');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [mobileView, setMobileView] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedGender, setSelectedGender] = useState('all');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setMobileView(isMobile);
      if (isMobile) {
        setItemsPerPage(5);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(10);
      } else {
        setItemsPerPage(15);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initializeBroadsheet();
  }, []);

  const initializeBroadsheet = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('name, is_class_teacher_of')
        .eq('id', user.id)
        .maybeSingle();

      if (tError) throw tError;
      if (!teacher || !teacher.is_class_teacher_of) {
        Swal.fire('Access Denied', 'No active classroom assignment detected for this profile.', 'error');
        return;
      }
      setTeacherProfile(teacher);
      const targetClass = teacher.is_class_teacher_of.trim();

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

      const currentSession = activeSessionRow.value;
      const currentTerm = activeTermRow.value.split(' (')[0];
      setActiveSession(currentSession);
      setActiveTerm(currentTerm);

      const parts = targetClass.split(' ');
      let baseClassName = targetClass;
      if (parts.length > 1) {
        baseClassName = `${parts[0]} ${parts[1]}`;
      }

      const { data: curriculum, error: cError } = await supabase
        .from('school_curriculum')
        .select('subject_name')
        .or(`class_name.eq."${targetClass}",class_name.eq."${baseClassName}"`);

      if (cError) throw cError;
      const subjectsArray = (curriculum || []).map(c => c.subject_name);
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
        .eq('term', currentTerm)
        .eq('session', currentSession);

      if (mError) throw mError;

      computeMatrix(roster || [], subjectsArray, marksData || []);

    } catch (err) {
      console.error("Broadsheet compilation failure:", err.message);
      Swal.fire('System Failure', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const computeMatrix = (roster, subjectsList, marks) => {
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
          cumulativeTotal += total;
          subjectsCount++;
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
      .map(r => r.average)
      .sort((a, b) => b - a);

    calculatedRows = calculatedRows.map(row => {
      const positionIndex = sortedAverages.indexOf(row.average) + 1;
      const suffix = ["th", "st", "nd", "rd"][(positionIndex % 100 > 10 && positionIndex % 100 < 20) ? 0 : Math.min(positionIndex % 10, 3)];
      
      return {
        ...row,
        position: row.subjectsTakenCount > 0 ? `${positionIndex}${suffix}` : '-'
      };
    });

    const metricsMap = {};
    subjectsList.forEach(subj => {
      const validScores = marks
        .filter(m => m.subject_name === subj)
        .map(m => parseFloat(m.total_score) || 0);

      if (validScores.length > 0) {
        const highest = Math.max(...validScores);
        const lowest = Math.min(...validScores);
        const sum = validScores.reduce((acc, curr) => acc + curr, 0);
        const avg = sum / validScores.length;

        metricsMap[subj] = {
          highest,
          lowest,
          average: parseFloat(avg.toFixed(1))
        };
      } else {
        metricsMap[subj] = { highest: '-', lowest: '-', average: '-' };
      }
    });

    setBroadsheetData(calculatedRows);
    setSubjectMetrics(metricsMap);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const getSortedData = () => {
    let filtered = broadsheetData.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           student.student_id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGender = selectedGender === 'all' || student.gender === selectedGender;
      return matchesSearch && matchesGender;
    });

    return filtered.sort((a, b) => {
      let aVal, bVal;
      switch(sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'student_id':
          aVal = a.student_id;
          bVal = b.student_id;
          break;
        case 'average':
          aVal = a.average;
          bVal = b.average;
          break;
        case 'grandTotal':
          aVal = a.grandTotal;
          bVal = b.grandTotal;
          break;
        case 'position':
          aVal = parseInt(a.position) || 0;
          bVal = parseInt(b.position) || 0;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const triggerPrintWindow = () => {
    window.print();
  };

  const exportToCSV = () => {
    const sortedData = getSortedData();
    let csvRows = [];
    
    csvRows.push(['S/N', 'Student ID', 'Name', 'Gender', ...subjects.map(s => `${s} (Total)`), 'Grand Total', 'Average (%)', 'Position']);
    
    sortedData.forEach((student, idx) => {
      const row = [
        idx + 1,
        student.student_id,
        student.name,
        student.gender || '-',
        ...subjects.map(subj => student.subjectScores[subj]?.total || '-'),
        student.grandTotal,
        student.average,
        student.position
      ];
      csvRows.push(row);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `broadsheet_${teacherProfile?.is_class_teacher_of}_${activeTerm}_${activeSession}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    Swal.fire('Exported!', 'Broadsheet data has been exported to CSV.', 'success');
  };

  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const stats = {
    totalStudents: broadsheetData.length,
    passedCount: broadsheetData.filter(s => s.average >= 40).length,
    failedCount: broadsheetData.filter(s => s.average > 0 && s.average < 40).length,
    classAverage: broadsheetData.length > 0 ? (broadsheetData.reduce((sum, s) => sum + s.average, 0) / broadsheetData.length).toFixed(1) : 0,
    highestAvg: broadsheetData.length > 0 ? Math.max(...broadsheetData.map(s => s.average), 0) : 0,
    lowestAvg: broadsheetData.length > 0 ? Math.min(...broadsheetData.map(s => s.average).filter(a => a > 0), 0) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Compiling broadsheet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 pb-24">
        
        <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-2xl shadow-2xl mb-6 overflow-hidden">
          <div className="relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
            <div className="relative px-5 sm:px-7 py-5 sm:py-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500/20 backdrop-blur-sm p-1.5 rounded-lg">
                      <FaGraduationCap className="text-blue-400 text-sm" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Performance Dashboard</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Master Broadsheet</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <div className="bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-medium text-white">📚 {teacherProfile?.is_class_teacher_of}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Session</p>
                    <p className="text-sm font-black text-white">{activeSession || 'Unset'}</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Term</p>
                    <p className="text-sm font-black text-blue-400">{activeTerm || 'Unset'}</p>
                  </div>
                  <button 
                    onClick={triggerPrintWindow}
                    className="bg-white text-slate-900 hover:bg-gray-100 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    <FaPrint /> Print
                  </button>
                  <button 
                    onClick={exportToCSV}
                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-3 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    <FaDownload /> Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showStats && (
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

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6 p-4">
          <div className="flex flex-col gap-3">
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
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedGender}
                  onChange={(e) => {
                    setSelectedGender(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white"
                >
                  <option value="all">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm hover:border-blue-500 transition whitespace-nowrap"
                >
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-lg p-1 bg-gray-100">
                <button 
                  onClick={() => setScoreTypeView('total')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${scoreTypeView === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Totals Only
                </button>
                <button 
                  onClick={() => setScoreTypeView('split')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${scoreTypeView === 'split' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Full Details
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {sortedData.length} students found
              </div>
            </div>
          </div>
        </div>

        <div ref={printRef} className="printable-sheet-container">
          <div className="only-print text-center border-b-2 border-slate-900 pb-4 mb-6">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">MASTER ACADEMIC BROAD SHEET</h2>
            <p className="text-xs font-bold text-slate-700 mt-1">
              CLASS: {teacherProfile?.is_class_teacher_of} | TERM: {activeTerm?.toUpperCase()} | SESSION: {activeSession}
            </p>
          </div>

          {!mobileView ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-linear-to-r from-slate-800 to-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 text-center w-12 cursor-pointer hover:bg-slate-700" onClick={() => handleSort('')}>
                        #
                      </th>
                      <th className="py-3 px-3 text-left cursor-pointer hover:bg-slate-700" onClick={() => handleSort('student_id')}>
                        <div className="flex items-center gap-1">
                          Reg No
                          {sortField === 'student_id' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </div>
                      </th>
                      <th className="py-3 px-4 text-left cursor-pointer hover:bg-slate-700" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">
                          Student Name
                          {sortField === 'name' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center w-12">Sex</th>
                      {subjects.map((subj, idx) => (
                        <th key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-3 px-2 text-center min-w-25">
                          <div className="text-xs font-bold truncate max-w-25" title={subj}>
                            {subj.length > 15 ? subj.substring(0, 12) + '...' : subj}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 min-w-20" onClick={() => handleSort('grandTotal')}>
                        <div className="flex items-center justify-center gap-1">
                          Total
                          {sortField === 'grandTotal' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 min-w-20" onClick={() => handleSort('average')}>
                        <div className="flex items-center justify-center gap-1">
                          Avg %
                          {sortField === 'average' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center cursor-pointer hover:bg-slate-700 w-16" onClick={() => handleSort('position')}>
                        <div className="flex items-center justify-center gap-1">
                          Pos
                          {sortField === 'position' && (sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </div>
                      </th>
                    </tr>
                    {scoreTypeView === 'split' && (
                      <tr className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                        <th colSpan="4"></th>
                        {subjects.map((_, idx) => (
                          <React.Fragment key={idx}>
                            <th className="p-1 text-center w-12">CA</th>
                            <th className="p-1 text-center w-12">Exam</th>
                            <th className="p-1 text-center w-12">Total</th>
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
                          <td className="py-2 px-3 font-mono text-xs font-bold text-blue-600">{row.student_id}</td>
                          <td className="py-2 px-4 font-semibold text-gray-800">{row.name}</td>
                          <td className="py-2 px-3 text-center text-xs font-bold text-gray-500 uppercase">{row.gender?.charAt(0) || '-'}</td>
                          
                          {subjects.map((subj, sIdx) => {
                            const scoreObj = row.subjectScores[subj];
                            if (scoreTypeView === 'split') {
                              return (
                                <React.Fragment key={sIdx}>
                                  <td className="p-1 text-center text-xs text-gray-600 bg-blue-50/30">{scoreObj.ca}</td>
                                  <td className="p-1 text-center text-xs text-gray-600 bg-amber-50/30">{scoreObj.exam}</td>
                                  <td className={`p-1 text-center text-xs font-bold ${scoreObj.grade === 'F9' ? 'text-red-600 bg-red-50/30' : 'text-gray-800'}`}>
                                    {scoreObj.total}
                                  </td>
                                </React.Fragment>
                              );
                            }
                            return (
                              <td key={sIdx} className={`p-2 text-center text-xs font-bold ${scoreObj.grade === 'F9' ? 'text-red-600' : 'text-gray-800'}`}>
                                {scoreObj.total}
                              </td>
                            );
                          })}
                          
                          <td className="py-2 px-3 text-center font-bold text-gray-800">{row.grandTotal}</td>
                          <td className="py-2 px-3 text-center font-black text-blue-600">{row.average}%</td>
                          <td className="py-2 px-3 text-center font-black text-indigo-600">{row.position}</td>
                        </tr>
                      );
                    })}
                    {subjects.length > 0 && (
                      <>
                        <tr className="bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                          <td colSpan="4" className="py-2 px-3 text-right border-t border-emerald-200">Highest</td>
                          {subjects.map((subj, idx) => (
                            <td key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-2 px-1 text-center font-mono font-black border-t border-emerald-200">
                              {subjectMetrics[subj]?.highest}
                            </td>
                          ))}
                          <td colSpan="3" className="border-t border-emerald-200"></td>
                        </tr>
                        <tr className="bg-rose-50 text-rose-800 text-[11px] font-bold">
                          <td colSpan="4" className="py-2 px-3 text-right">Lowest</td>
                          {subjects.map((subj, idx) => (
                            <td key={idx} colSpan={scoreTypeView === 'split' ? 3 : 1} className="py-2 px-1 text-center font-mono font-black">
                              {subjectMetrics[subj]?.lowest}
                            </td>
                          ))}
                          <td colSpan="3"></td>
                        </tr>
                        <tr className="bg-blue-50 text-blue-800 text-[11px] font-bold">
                          <td colSpan="4" className="py-2 px-3 text-right">Average</td>
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
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} students
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    <FaChevronRight />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                  >
                    Last
                  </button>
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border rounded-lg text-xs bg-white"
                >
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
                    <div 
                      className="px-4 py-3 bg-linear-to-r from-gray-50 to-white cursor-pointer flex items-center justify-between"
                      onClick={() => setExpandedStudent(expandedStudent === row.id ? null : row.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{overallPosition}</span>
                          <span className="font-bold text-gray-800 text-sm">{row.name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{row.student_id}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                            {row.position}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600">{row.average}%</div>
                        <div className="text-xs text-gray-500">Total: {row.grandTotal}</div>
                      </div>
                    </div>
                    
                    {expandedStudent === row.id && (
                      <div className="px-4 py-3 bg-white border-t border-gray-100">
                        <div className="mb-3 p-2 bg-gray-50 rounded-xl grid grid-cols-2 gap-2 text-center">
                          <div>
                            <p className="text-xs text-gray-500">Subjects Passed</p>
                            <p className="text-lg font-bold text-green-600">{passedSubjects}/{totalSubjects}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Performance</p>
                            <p className="text-lg font-bold text-blue-600">{row.average}%</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {subjects.map((subj, sIdx) => {
                            const scoreObj = row.subjectScores[subj];
                            const isPass = scoreObj.total !== '-' && parseFloat(scoreObj.total) >= 40;
                            return (
                              <div key={sIdx} className={`border rounded-xl p-3 ${isPass ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                    <FaBookOpen className="text-blue-500 text-xs" />
                                    {subj}
                                  </span>
                                  <span className={`text-sm font-bold px-2 py-0.5 rounded ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                    {scoreObj.total}
                                  </span>
                                </div>
                                {scoreTypeView === 'split' && (
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="p-1.5 bg-white rounded-lg">
                                      <p className="text-gray-500">CA</p>
                                      <p className="font-bold text-gray-700">{scoreObj.ca}</p>
                                    </div>
                                    <div className="p-1.5 bg-white rounded-lg">
                                      <p className="text-gray-500">Exam</p>
                                      <p className="font-bold text-gray-700">{scoreObj.exam}</p>
                                    </div>
                                    <div className="p-1.5 bg-white rounded-lg">
                                      <p className="text-gray-500">Grade</p>
                                      <p className={`font-bold ${scoreObj.grade === 'F9' ? 'text-red-600' : 'text-green-600'}`}>{scoreObj.grade}</p>
                                    </div>
                                  </div>
                                )}
                                {scoreTypeView === 'total' && scoreObj.grade !== '-' && (
                                  <div className="mt-2 text-center">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${scoreObj.grade === 'F9' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                      Grade: {scoreObj.grade}
                                    </span>
                                  </div>
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
                <div className="text-xs text-gray-600 text-center mb-3">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} students
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"
                  >
                    <FaChevronLeft />
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold bg-white border rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"
                  >
                    <FaChevronRight />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-lg text-xs disabled:opacity-50 bg-white"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-linear-to-r from-gray-100 to-white rounded-xl mt-4 p-3 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-gray-600">A-C (Excellent/Good)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">D-P (Pass)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="text-gray-600">F9 (Fail)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaDatabase className="text-gray-400 text-xs" />
              <span className="text-gray-500">Tap on any student to view full details</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          .printable-sheet-container { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #000 !important; padding: 4px 2px !important; font-size: 8px !important; }
          th { background-color: #e2e8f0 !important; }
        }
        .only-print { display: none; }
      `}</style>
    </div>
  );
};

const React = { Fragment: ({ children }) => children };