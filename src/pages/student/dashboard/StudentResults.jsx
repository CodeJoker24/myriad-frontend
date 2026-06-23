import { useEffect, useState } from 'react';
import { supabase } from '../../../db';
import { 
  FaClipboardList, FaSpinner, FaBookOpen, FaGraduationCap, 
  FaHistory, FaDownload
} from 'react-icons/fa';

export const StudentResults = () => {
  const studentSnapshot = JSON.parse(localStorage.getItem('student')) || {};

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeSession, setActiveSession] = useState('');
  const [activeTerm, setActiveTerm] = useState('');
  
  // Historical Selector Filters
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(''); 
  
  // Lists for dropdown options
  const [historicalClasses, setHistoricalClasses] = useState([]); 
  
  // Live profile data state
  const [liveProfile, setLiveProfile] = useState(null);
  
  const [results, setResults] = useState([]);
  const [classSize, setClassSize] = useState(0);
  const [teacherRemark, setTeacherRemark] = useState('');

  const [attendanceStats, setAttendanceStats] = useState({
    opened: 0,
    present: 0
  });

  const [summaryStats, setSummaryStats] = useState({
    grandTotal: 0,
    average: 0,
    passedCount: 0,
    totalSubjects: 0,
    obtainableMarks: 0
  });

  // Dynamically load robust, standalone native PDF engines (jsPDF + AutoTable)
  useEffect(() => {
    const jspdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    const autotableUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js";

    if (!document.querySelector(`script[src="${jspdfUrl}"]`)) {
      const script1 = document.createElement('script');
      script1.src = jspdfUrl;
      script1.async = true;
      script1.onload = () => {
        if (!document.querySelector(`script[src="${autotableUrl}"]`)) {
          const script2 = document.createElement('script');
          script2.src = autotableUrl;
          script2.async = true;
          document.body.appendChild(script2);
        }
      };
      document.body.appendChild(script1);
    }
  }, []);

  useEffect(() => {
    fetchInitialSetup();
  }, [studentSnapshot?.id]);

  const fetchInitialSetup = async () => {
    if (!studentSnapshot?.id) return;
    setLoading(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentSnapshot.id)
        .single();

      let currentClass = studentSnapshot.class_name || '';
      if (!studentError && studentData) {
        setLiveProfile(studentData);
        currentClass = studentData.class_name;
        setSelectedClass(studentData.class_name);
      }

      const { data: historicalMarks } = await supabase
        .from('student_marks')
        .select('class_name')
        .eq('student_id', studentSnapshot.id);

      if (historicalMarks) {
        const uniqueClasses = [...new Set(historicalMarks.map(m => m.class_name).filter(Boolean))];
        if (currentClass && !uniqueClasses.includes(currentClass)) {
          uniqueClasses.push(currentClass);
        }
        setHistoricalClasses(uniqueClasses);
      } else {
        setHistoricalClasses(currentClass ? [currentClass] : []);
      }

      const { data: settingsRows } = await supabase
        .from('academic_settings')
        .select('*')
        .eq('is_active', true);

      let currentSessionName = '2025/2026';
      let currentTermName = 'Third Term';

      if (settingsRows) {
        const sessionRow = settingsRows.find(row => row.type === 'session');
        const termRow = settingsRows.find(row => row.type === 'term');
        if (sessionRow?.value) currentSessionName = sessionRow.value;
        if (termRow?.value) currentTermName = termRow.value.split(' (')[0];
      }

      setActiveSession(currentSessionName);
      setActiveTerm(currentTermName);
      setSelectedSession(currentSessionName);
      setSelectedTerm(currentTermName);

      await compileReportCardData(studentSnapshot.id, currentSessionName, currentTermName, currentClass);

    } catch (err) {
      console.error("Failed preparing report document setup:", err);
    } finally {
      setLoading(false);
    }
  };

  const compileReportCardData = async (studentId, targetSession, targetTerm, className) => {
    try {
      if (className) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_name', className);
        setClassSize(count || 0);
      }

      const { data: globalRemarksRow } = await supabase
        .from('term_remarks')
        .select('teacher_remarks, attendance_present, attendance_total')
        .eq('student_id', studentId)
        .eq('class_name', className)
        .eq('term', targetTerm)
        .eq('session', targetSession)
        .maybeSingle();

      if (globalRemarksRow) {
        setTeacherRemark(globalRemarksRow.teacher_remarks || 'No statement written yet.');
        setAttendanceStats({
          opened: globalRemarksRow.attendance_total ?? 0,
          present: globalRemarksRow.attendance_present ?? 0
        });
      } else {
        setTeacherRemark('No official evaluation remark compiled for this cycle yet.');
        setAttendanceStats({ opened: 0, present: 0 });
      }

      const { data: marksRows, error } = await supabase
        .from('student_marks')
        .select('*')
        .eq('student_id', studentId)
        .eq('session', targetSession)
        .eq('term', targetTerm)
        .eq('class_name', className);

      if (error) throw error;

      const records = marksRows || [];
      setResults(records);

      if (records.length > 0) {
        let runningTotal = 0;
        let passes = 0;

        records.forEach(row => {
          const total = parseFloat(row.total_score) || 0;
          runningTotal += total;
          if (total >= 40) passes++;
        });

        const avg = parseFloat((runningTotal / records.length).toFixed(2));

        setSummaryStats({
          grandTotal: runningTotal,
          average: avg,
          passedCount: passes,
          totalSubjects: records.length,
          obtainableMarks: records.length * 100
        });

      } else {
        setSummaryStats({ grandTotal: 0, average: 0, passedCount: 0, totalSubjects: 0, obtainableMarks: 0 });
      }

    } catch (err) {
      console.error("Error aggregating student transcript indices:", err);
    }
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await compileReportCardData(studentSnapshot.id, selectedSession, selectedTerm, selectedClass);
    setLoading(false);
  };

  const triggerPDFDownload = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert("PDF download engine is finishing initialization. Please try again in a brief second.");
      return;
    }

    setDownloading(true);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 1. School Header / Letterhead
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("MYRIAD ACADEMY", 105, 15, { align: "center" });

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // gray-600
      doc.text("Omoloye B/Stop Along Owode Idiroko Road Ogun State.", 105, 21, { align: "center" });

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235); // blue-600
      doc.text("Motto: Excelling for Life  |  08034791741, 08038005822", 105, 26, { align: "center" });

      // Clean divider line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(10, 30, 200, 30);

      // 2. Student Bio Data Block
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // gray-400 heading
      
      doc.text("STUDENT FULL NAME:", 12, 38);
      doc.setTextColor(15, 23, 42);
      doc.text(`${liveProfile?.name || studentSnapshot.name || 'N/A'}`.toUpperCase(), 53, 38);

      doc.setTextColor(100, 116, 139);
      doc.text("STUDENT ID:", 12, 44);
      doc.setTextColor(37, 99, 235);
      doc.text(`${liveProfile?.student_id || 'N/A'}`, 53, 44);

      doc.setTextColor(100, 116, 139);
      doc.text("CLASS CONTEXT:", 12, 50);
      doc.setTextColor(15, 23, 42);
      doc.text(`${selectedClass || 'N/A'}`.toUpperCase(), 53, 50);

      doc.setTextColor(100, 116, 139);
      doc.text("ACADEMIC TERM:", 130, 38);
      doc.setTextColor(15, 23, 42);
      doc.text(`${selectedTerm}`.toUpperCase(), 165, 38);

      doc.setTextColor(100, 116, 139);
      doc.text("CURRENT SESSION:", 130, 44);
      doc.setTextColor(15, 23, 42);
      doc.text(`${selectedSession}`, 165, 44);

      // Attendance Mini Table on data row
      doc.setTextColor(100, 116, 139);
      doc.text("ATTENDANCE:", 130, 50);
      doc.setTextColor(15, 23, 42);
      doc.text(`Present: ${attendanceStats.present} / ${attendanceStats.opened}`, 165, 50);

      // 3. Subject Grades Table Matrix
      const tableHeaders = [["Academic Subject", "CA Score", "Exam Score", "Total (/100)", "Grade", "Remarks"]];
      
      const tableRows = results.map(item => {
        const total = parseFloat(item.total_score) || 0;
        return [
          item.subject_name.toUpperCase(),
          item.ca_score ?? '-',
          item.exam_score ?? '-',
          item.total_score ?? '-',
          item.final_grade || item.grade || '-',
          item.remarks || (total >= 40 ? 'PASS' : 'FAIL')
        ];
      });

      if (tableRows.length === 0) {
        tableRows.push(["No Academic Subject Entries Found For Chosen Term", "-", "-", "-", "-", "-"]);
      }

      // Draw beautiful, robust structural table
      doc.autoTable({
        startY: 56,
        head: tableHeaders,
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], font: 'Helvetica' },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: 10, right: 10 },
        didParseCell: function(data) {
          // Dynamic text coloring for passes and failures inside the PDF rows
          if (data.section === 'body' && data.column.index === 3) {
            const val = parseFloat(data.cell.raw);
            if (!isNaN(val) && val < 40) {
              data.cell.styles.textColor = [220, 38, 38]; // Red
            }
          }
        }
      });

      // 4. Summaries and Evaluations block
      let finalY = doc.lastAutoTable.finalY + 8;

      // Keep everything cleanly within viewport limits
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }

      // Left Frame box: Calculations Summary
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(10, finalY, 60, 32, 'DF');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("SUMMARY STATISTICS", 13, finalY + 5);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.text(`Total Subjects: ${summaryStats.totalSubjects}`, 13, finalY + 12);
      doc.text(`Class Size: ${classSize} Students`, 13, finalY + 18);
      
      doc.setFont("Helvetica", "bold");
      doc.text(`Average Percentage: ${summaryStats.average}%`, 13, finalY + 26);

      // Right Frame box: Teacher remarks and validation line
      doc.rect(74, finalY, 126, 32, 'DF');
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("CLASS TEACHER EVALUATION COMMENT", 78, finalY + 5);

      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      
      // Handle multi-line strings wrap safely inside PDF canvas bounds
      const splitRemark = doc.splitTextToSize(teacherRemark.toUpperCase(), 118);
      doc.text(splitRemark, 78, finalY + 12);

      // Signatures
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("MYRIAD ACADEMY OFFICIAL SEAL", 78, finalY + 28);
      doc.text("FORM MASTER SIGNATURE: ___________________", 124, finalY + 28);

      // 5. Final Download Save
      const studentName = liveProfile?.name || studentSnapshot.name || "Student";
      const cleanSession = selectedSession.replace(/\//g, "-");
      const formattedFileName = `${studentName} - ${selectedTerm} - ${cleanSession}.pdf`;

      doc.save(formattedFileName);
      setDownloading(false);

    } catch (pdfError) {
      console.error("Native PDF build failure:", pdfError);
      alert("Error generating download file: " + pdfError.message);
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <FaSpinner className="animate-spin text-blue-600 text-3xl mx-auto" />
          <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Assembling Official Sheet Context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-2">
      
      {/* Control Filter panel */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shrink-0">
            <FaClipboardList size={18} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Academic Report Sheet</h1>
            <p className="text-[11px] text-gray-400 font-semibold">Switch terms or classes and export directly to your local file manager</p>
          </div>
        </div>

        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-2 bg-gray-50 border p-1 rounded-lg">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className=" text-xs font-bold text-blue-700 outline-none p-1 bg-white cursor-pointer uppercase"
            >
              {historicalClasses.map((cls, idx) => (
                <option key={idx} value={cls}>{cls}</option>
              ))}
            </select>
            <span className="text-gray-300">|</span>
            <select 
              value={selectedSession} 
              onChange={(e) => setSelectedSession(e.target.value)}
              className=" text-xs font-bold text-gray-700 outline-none p-1 bg-white cursor-pointer"
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
            <span className="text-gray-300">|</span>
            <select 
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
              className=" text-xs font-bold text-gray-700 outline-none p-1 bg-white cursor-pointer"
            >
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>
          </div>
          
          <button type="submit" className="bg-gray-900 text-white hover:bg-slate-800 font-bold text-xs px-3 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5">
            <FaHistory size={11} /> Switch
          </button>

          {/* Download button */}
          <button 
            type="button" 
            disabled={downloading}
            onClick={triggerPDFDownload} 
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5 disabled:bg-blue-400"
          >
            {downloading ? (
              <>
                <FaSpinner className="animate-spin" size={11} /> Downloading File...
              </>
            ) : (
              <>
                <FaDownload size={11} /> Download Report PDF
              </>
            )}
          </button>
        </form>
      </div>

      {/* Primary Visual Screen Preview Slip Container */}
      <div 
        className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 relative overflow-hidden mx-auto max-w-[210mm]"
      >
        <div className="absolute top-3 right-3 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border border-white/10 select-none">
          {selectedTerm}
        </div>

        {/* Letterhead Header */}
        <div className="text-center border-b border-slate-900 pb-2 space-y-0.5">
          <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">MYRIAD ACADEMY</h1>
          <p className="text-[11px] font-bold text-gray-600 tracking-wide max-w-xl mx-auto">
            Omoloye B/Stop Along Owode Idiroko Road Ogun State.
          </p>
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 font-semibold">
            <span className="italic text-blue-600 font-bold">Motto: Excelling for Life</span>
            <span className="text-gray-300">|</span>
            <span>08034791741, 08038005822</span>
          </div>
        </div>

        {/* Bio Data and Attendance Rows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 border rounded-lg p-2.5 bg-gray-50/40 grid grid-cols-2 gap-y-2 gap-x-3 text-[11px] font-medium text-gray-700">
            <div>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Full Name of Student</span>
              <span className="font-black text-slate-900">{liveProfile?.name || studentSnapshot.name || 'Loading...'}</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Student ID</span>
              <span className="font-mono font-bold text-blue-600">{liveProfile?.student_id || 'Loading...'}</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Class Context</span>
              <span className="font-bold text-blue-700 uppercase">{selectedClass || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Current Session</span>
              <span className="font-bold text-slate-800">{selectedSession}</span>
            </div>
          </div>

          {/* Attendance block */}
          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50 space-y-1.5 text-[11px] text-gray-600">
            <h3 className="text-[9px] font-black text-slate-800 uppercase tracking-wider border-b pb-0.5">Attendance & Marks</h3>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-white px-1.5 py-0.5 border rounded flex justify-between">
                <span className="text-gray-400 text-[9px]">Opened:</span>
                <span className="font-bold text-slate-900">{attendanceStats.opened}</span>
              </div>
              <div className="bg-white px-1.5 py-0.5 border rounded flex justify-between">
                <span className="text-gray-400 text-[9px]">Present:</span>
                <span className="font-bold text-emerald-600">{attendanceStats.present}</span>
              </div>
              <div className="bg-white px-1.5 py-0.5 border rounded flex justify-between">
                <span className="text-gray-400 text-[9px]">Obtainable:</span>
                <span className="font-bold text-slate-900">{summaryStats.obtainableMarks}</span>
              </div>
              <div className="bg-white px-1.5 py-0.5 border rounded flex justify-between">
                <span className="text-gray-400 text-[9px]">Obtained:</span>
                <span className="font-black text-blue-600">{summaryStats.grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scores Ledger Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider border-b border-slate-900">
                <th className="p-2">Academic Subject</th>
                <th className="p-2 text-center w-20">CA</th>
                <th className="p-2 text-center w-20">Exam</th>
                <th className="p-2 text-center w-24">Total (/100)</th>
                <th className="p-2 text-center w-20">Grade</th>
                <th className="p-2 w-36">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[11px] font-bold text-slate-700">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400 bg-gray-50/50">
                    <div className="max-w-xs mx-auto space-y-1">
                      <FaGraduationCap className="text-gray-300 text-3xl mx-auto" />
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-tight">No Entries Recorded</p>
                    </div>
                  </td>
                </tr>
              ) : (
                results.map((item) => {
                  const total = parseFloat(item.total_score) || 0;
                  const isFail = total < 40 || item.final_grade === 'F9';
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/30">
                      <td className="p-1.5 text-slate-900 font-black uppercase flex items-center gap-1.5">
                        <FaBookOpen className="text-blue-500 shrink-0" size={10} />
                        {item.subject_name}
                      </td>
                      <td className="p-1.5 text-center font-mono text-gray-500 bg-gray-50/20">{item.ca_score ?? '-'}</td>
                      <td className="p-1.5 text-center font-mono text-gray-500 bg-gray-50/20">{item.exam_score ?? '-'}</td>
                      <td className={`p-1.5 text-center font-mono font-black ${isFail ? 'text-red-600 bg-red-50/10' : 'text-slate-800 bg-slate-50/10'}`}>
                        {item.total_score ?? '-'}
                      </td>
                      <td className="p-1.5 text-center">
                        <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border ${
                          isFail ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {item.final_grade || item.grade || '-'}
                        </span>
                      </td>
                      <td className={`p-1.5 text-[10px] tracking-wide uppercase ${isFail ? 'text-red-500' : 'text-slate-600'}`}>
                        {item.remarks || (total >= 40 ? 'PASS' : 'FAIL')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footers matrix */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-gray-500 font-semibold items-end">
            
            <div className="space-y-1.5 border border-gray-100 bg-gray-50/50 p-2.5 rounded-lg self-stretch flex flex-col justify-between">
              <div className="space-y-1 text-slate-700">
                <p className="uppercase text-[8px] text-gray-400 font-bold tracking-wider">Summary Info</p>
                <p>Total Subjects: <span className="font-black">{summaryStats.totalSubjects}</span></p>
                <p>Class Size: <span className="font-black text-slate-900">{classSize} Students</span></p>
              </div>
              <div className="border-t pt-1.5 font-bold flex justify-between items-center text-slate-800">
                <span>Average:</span>
                <span className="font-black text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{summaryStats.average}%</span>
              </div>
            </div>

            <div className="md:col-span-2 border border-gray-200 rounded-lg p-2.5 bg-white space-y-1 self-stretch flex flex-col justify-between">
              <div>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Class Teacher Comment</span>
                <div className="border-b border-dashed border-gray-300 pb-0.5 text-slate-800 uppercase font-bold text-[11px] tracking-wide italic leading-tight min-h-8 flex items-end">
                  {teacherRemark}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 text-[9px] text-gray-400 font-bold">
                <span>Myriad Academy Seal</span>
                <span className="border-t border-slate-300 w-28 text-center pt-0.5 block text-slate-700 uppercase font-bold tracking-wider">Form Master Sig</span>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};