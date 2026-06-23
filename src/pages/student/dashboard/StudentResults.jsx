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

      // --- 1. Letterhead Header ---
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // text-slate-900
      doc.text("MYRIAD ACADEMY", 105, 15, { align: "center" });

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // text-gray-600
      doc.text("Omoloye B/Stop Along Owode Idiroko Road Ogun State.", 105, 21, { align: "center" });

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235); // text-blue-600
      doc.text("Motto: Excelling for Life", 80, 26, { align: "center" });
      
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(107, 114, 128); // text-gray-500
      doc.text("  |  08034791741, 08038005822", 125, 26, { align: "center" });

      // Clean divider line
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.line(10, 30, 200, 30);

      // --- 2. Bio Data Block (Grey box layout mirroring web layout) ---
      doc.setDrawColor(243, 244, 246); // border-gray-100
      doc.setFillColor(249, 250, 251); // bg-gray-50/40
      doc.rect(10, 34, 122, 22, 'DF');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // text-gray-400
      doc.text("FULL NAME OF STUDENT", 13, 39);
      doc.setTextColor(15, 23, 42); // text-slate-900
      doc.setFontSize(10);
      doc.text(`${liveProfile?.name || studentSnapshot.name || 'LOADING...'}`.toUpperCase(), 13, 44);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("CLASS CONTEXT", 13, 50);
      doc.setTextColor(29, 78, 216); // text-blue-700
      doc.setFontSize(9.5);
      doc.text(`${selectedClass || 'N/A'}`.toUpperCase(), 13, 54);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("STUDENT ID", 75, 39);
      doc.setTextColor(37, 99, 235); // text-blue-600
      doc.setFontSize(9.5);
      doc.text(`${liveProfile?.student_id || 'LOADING...'}`, 75, 44);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("CURRENT SESSION", 75, 50);
      doc.setTextColor(30, 41, 59); // text-slate-800
      doc.setFontSize(9.5);
      doc.text(`${selectedSession}`, 75, 54);

      // --- 3. Attendance Block (Right side container block) ---
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.setFillColor(248, 250, 252); // bg-slate-50/50
      doc.rect(136, 34, 64, 22, 'DF');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59); // text-slate-800
      doc.text("ATTENDANCE & MARKS", 139, 39);

      // Mini Grid lines matching the web layout viewports exactly
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      
      // Cells
      doc.rect(139, 41, 28, 6, 'DF'); // Opened
      doc.rect(169, 41, 28, 6, 'DF'); // Present
      doc.rect(139, 48, 28, 6, 'DF'); // Obtainable
      doc.rect(169, 48, 28, 6, 'DF'); // Obtained

      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text("Opened:", 140, 45);
      doc.setTextColor(15, 23, 42);
      doc.text(`${attendanceStats.opened}`, 162, 45, { align: "right" });

      doc.setTextColor(156, 163, 175);
      doc.text("Present:", 170, 45);
      doc.setTextColor(5, 150, 105); // text-emerald-600
      doc.text(`${attendanceStats.present}`, 194, 45, { align: "right" });

      doc.setTextColor(156, 163, 175);
      doc.text("Obtainable:", 140, 52);
      doc.setTextColor(15, 23, 42);
      doc.text(`${summaryStats.obtainableMarks}`, 162, 52, { align: "right" });

      doc.setTextColor(156, 163, 175);
      doc.text("Obtained:", 170, 52);
      doc.setTextColor(37, 99, 235); // text-blue-600
      doc.text(`${summaryStats.grandTotal}`, 194, 52, { align: "right" });

      // --- 4. Subject Ledger Table Matrix ---
      const tableHeaders = [["Academic Subject", "CA", "Exam", "Total (/100)", "Grade", "Remarks"]];
      
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
        tableRows.push(["No Academic Subject Entries Recorded", "-", "-", "-", "-", "-"]);
      }

      doc.autoTable({
        startY: 59,
        head: tableHeaders,
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], fontStyle: 'bold' }, 
        columnStyles: {
          0: { cellWidth: 65, textColor: [15, 23, 42] }, // bold subject name accentuation
          1: { halign: 'center', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 22 },
          5: { cellWidth: 38 }
        },
        margin: { left: 10, right: 10 },
        didParseCell: function(data) {
          if (data.section === 'body') {
            const rowData = results[data.row.index];
            if (rowData) {
              const total = parseFloat(rowData.total_score) || 0;
              const isFail = total < 40 || rowData.final_grade === 'F9';
              
              // Column 3: Total column accent coloring
              if (data.column.index === 3) {
                if (isFail) {
                  data.cell.styles.textColor = [220, 38, 38]; // text-red-600
                  data.cell.styles.fillColor = [254, 242, 242]; // bg-red-50/10
                } else {
                  data.cell.styles.textColor = [30, 41, 59];
                  data.cell.styles.fillColor = [248, 250, 252];
                }
              }

              // Column 4: Grade layout coloration box bounds
              if (data.column.index === 4) {
                if (isFail) {
                  data.cell.styles.textColor = [185, 28, 28]; // text-red-700
                  data.cell.styles.fillColor = [254, 242, 242]; // bg-red-50
                } else {
                  data.cell.styles.textColor = [4, 120, 87]; // text-emerald-700
                  data.cell.styles.fillColor = [236, 253, 245]; // bg-emerald-50
                }
              }

              // Column 5: Remarks styling parameters
              if (data.column.index === 5) {
                if (isFail) {
                  data.cell.styles.textColor = [239, 68, 68]; // text-red-500
                } else {
                  data.cell.styles.textColor = [71, 85, 105]; // text-slate-600
                }
              }
            }
          }
        }
      });

      // --- 5. Footers Matric Matrix ---
      let finalY = doc.lastAutoTable.finalY + 6;

      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }

      // Left Frame Box: Summary Statistics (bg-gray-50/50 light look)
      doc.setDrawColor(243, 244, 246); // border-gray-100
      doc.setFillColor(249, 250, 251); // bg-gray-50/50 layout
      doc.rect(10, finalY, 60, 34, 'DF');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // text-gray-400
      doc.text("SUMMARY INFO", 13, finalY + 5);

      doc.setTextColor(71, 85, 105); // text-slate-700
      doc.setFontSize(9);
      doc.text("Total Subjects: ", 13, finalY + 12);
      doc.text("Class Size: ", 13, finalY + 18);

      doc.setTextColor(15, 23, 42); // bold content values
      doc.text(`${summaryStats.totalSubjects}`, 38, finalY + 12);
      doc.text(`${classSize} Students`, 32, finalY + 18);

      // Average section accent separator line
      doc.setDrawColor(226, 232, 240);
      doc.line(13, finalY + 23, 67, finalY + 23);

      doc.setTextColor(30, 41, 59); // text-slate-800
      doc.text("Average:", 13, finalY + 29);
      
      // Draw highlight badge block for total average percentage
      doc.setDrawColor(219, 234, 254); // border-blue-100
      doc.setFillColor(239, 246, 255); // bg-blue-50
      doc.rect(46, finalY + 25, 20, 6, 'DF');
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(37, 99, 235); // text-blue-600
      doc.text(`${summaryStats.average}%`, 56, finalY + 29, { align: "center" });

      // Right Frame Box: Class Teacher Comment (bg-white perfectly matching layout)
      doc.setDrawColor(229, 231, 235); // border-gray-200
      doc.setFillColor(255, 255, 255); // Pure white background
      doc.rect(74, finalY, 126, 34, 'DF');

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // text-gray-400
      doc.text("CLASS TEACHER COMMENT", 78, finalY + 5);

      // Inside value layout string wraps mapping style
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59); // text-slate-800
      
      const splitRemark = doc.splitTextToSize(teacherRemark.toUpperCase(), 118);
      doc.text(splitRemark, 78, finalY + 13);

      // Lower validation metrics inside signature zone
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // text-gray-400
      doc.text("Myriad Academy Seal", 78, finalY + 30);
      
      doc.setTextColor(51, 65, 85); // text-slate-700
      doc.text("FORM MASTER SIG: ___________________", 124, finalY + 30);

      // --- 6. Trigger Save Stream Download ---
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