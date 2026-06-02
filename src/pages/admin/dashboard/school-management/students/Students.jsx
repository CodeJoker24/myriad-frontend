import { useState, useEffect } from 'react';
import { supabase } from '../../../../../db';
import Swal from 'sweetalert2';
import { 
  FaPlus, FaEdit, FaTrash, FaBan, FaSearch, FaTimes, 
  FaSpinner, FaUserGraduate, FaEye,
  FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaVenusMars,
  FaIdCard, FaGraduationCap, FaChevronRight, FaFilter,
  FaBookOpen, FaDownload, FaUpload
} from 'react-icons/fa';
import { logActivity } from '../../../../../db';
import Papa from 'papaparse';

export const Students = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [bulkTargetClass, setBulkTargetClass] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const [formData, setFormData] = useState({
    name: '',
    class_name: '',
    gender: '',
    dob: '',
    parent_name: '',
    phone: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    address: '',
    state_of_origin: '',
    lga: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsInitialLoading(true);
    try {
      const { data: classes } = await supabase.from('classes').select('name');
      if (classes) setAvailableClasses(classes.map(c => c.name));
      await fetchStudents();
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setStudents(data);
  };

  const handleQuickView = (student) => {
    setViewingStudent(student);
    setShowViewModal(true);
  };

  const handleBulkStudentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!bulkTargetClass) {
      e.target.value = null;
      Swal.fire('Class Required', 'Please select a target class before uploading.', 'warning');
      return;
    }

    if (!window.navigator.onLine) {
      e.target.value = null;
      Swal.fire('No Connection', 'Please check your internet connection.', 'warning');
      return;
    }

    setBulkLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        setBulkProgress({ current: 0, total: rows.length });

        let successCount = 0;
        let failureCount = 0;
        let errorLog = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setBulkProgress({ current: i + 1, total: rows.length });

          try {
            const rawName = row.FullName?.trim();
            const rawGender = row.Gender?.trim();
            const rawDob = row.DOB?.trim();
            const rawParentName = row.ParentName?.trim();
            const rawPhone = row.ParentPhone?.trim();
            const rawEnrollmentDate = row.EnrollmentDate?.trim() || new Date().toISOString().split('T')[0];
            const rawStateOfOrigin = row.StateOfOrigin?.trim() || '';
            const rawLga = row.LGA?.trim() || '';
            const rawAddress = row.Address?.trim() || '';

            if (!rawName) throw new Error("Full name missing");
            if (!rawGender) throw new Error("Gender missing");
            if (!rawDob) throw new Error("Date of Birth missing");
            if (!rawParentName) throw new Error("Parent name missing");
            if (!rawPhone) throw new Error("Parent phone missing");

            const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
            if (seqErr) throw seqErr;

            const cleanId = nextId.replace(/\//g, '').toLowerCase();
            const internalEmail = `${cleanId}@school.internal`;
            const firstName = rawName.split(' ')[0].toLowerCase();
            const initialPassword = `${firstName}123`;

            const { data: auth, error: authErr } = await supabase.auth.signUp({
              email: internalEmail,
              password: initialPassword,
            });

            if (authErr) throw authErr;

            const { error: dbErr } = await supabase.from('students').insert([{
              id: auth.user.id,
              student_id: nextId,
              name: rawName,
              class_name: bulkTargetClass, 
              gender: rawGender,
              dob: rawDob,
              parent_name: rawParentName,
              phone: rawPhone,
              email: internalEmail,
              enrollment_date: rawEnrollmentDate, 
              state_of_origin: rawStateOfOrigin,
              lga: rawLga,
              address: rawAddress,
              is_active: true
            }]);

            if (dbErr) throw dbErr;

            await logActivity(`Bulk enrolled student: ${rawName} (${nextId})`, 'student');
            successCount++;

          } catch (err) {
            failureCount++;
            errorLog.push(`Row ${i + 2}: ${err.message}`);
          }
        }

        setBulkLoading(false);
        e.target.value = null;

        Swal.fire({
          title: 'Bulk Upload Complete',
          html: `
            <div class="text-left space-y-2">
              <p class="text-green-600">Success: ${successCount} students</p>
              <p class="text-red-600">Failed: ${failureCount}</p>
              ${errorLog.length > 0 ? `<div class="mt-2 pt-2 border-t max-h-32 overflow-y-auto text-xs text-red-500">${errorLog.map(log => `<p>• ${log}</p>`).join('')}</div>` : ''}
            </div>
          `,
          icon: failureCount === 0 ? 'success' : 'info'
        });

        fetchStudents(); 
      }
    });
  };

  const downloadSampleStudentCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,FullName,Gender,DOB,ParentName,ParentPhone,EnrollmentDate,StateOfOrigin,LGA,Address\nChidi Obi,Male,2015-04-12,Mr. Obi,08012345678,2026-01-15,Anambra,Idemili North,12 Awka Road\nAmara Yusuf,Female,2016-09-22,Mrs. Yusuf,08145678901,,Kano,Fagge,No 4 Sabon Gari Road";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "students_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!window.navigator.onLine) {
      Swal.fire('No Connection', 'Please check your internet connection.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const studentPayload = {
        name: formData.name,
        class_name: formData.class_name,
        gender: formData.gender,
        dob: formData.dob,
        parent_name: formData.parent_name,
        phone: formData.phone,
        enrollment_date: formData.enrollment_date,
        address: formData.address,
        state_of_origin: formData.state_of_origin,
        lga: formData.lga
      };

      if (editingId) {
        const { error } = await supabase
          .from('students')
          .update(studentPayload)
          .eq('id', editingId);
        
        if (error) throw error;
        await logActivity(`Updated student: ${formData.name}`, 'student');
        Swal.fire('Updated!', 'Student record updated.', 'success');
      } else {
        const { data: nextId, error: seqErr } = await supabase.rpc('generate_student_id');
        if (seqErr) throw seqErr;

        const cleanId = nextId.replace(/\//g, '').toLowerCase();
        const internalEmail = `${cleanId}@school.internal`;
        const firstName = formData.name.split(' ')[0].toLowerCase();
        const initialPassword = `${firstName}123`;

        const { data: auth, error: authErr } = await supabase.auth.signUp({
          email: internalEmail,
          password: initialPassword,
        });

        if (authErr) throw authErr;

        const { error: dbErr } = await supabase.from('students').insert([{
          ...studentPayload,
          id: auth.user.id, 
          student_id: nextId, 
          email: internalEmail,
          is_active: true
        }]);

        if (dbErr) throw dbErr;

        await logActivity(`Enrolled student: ${formData.name} (${nextId})`, 'student');
        Swal.fire({
          title: 'Enrollment Successful!',
          html: `
            <div class="text-left bg-gray-50 p-4 rounded-lg mt-2">
              <p><strong>Student ID:</strong> <code class="text-primary">${nextId}</code></p>
              <p><strong>Email:</strong> <code>${internalEmail}</code></p>
              <p><strong>Password:</strong> <code class="text-primary">${initialPassword}</code></p>
            </div>
          `,
          icon: 'success'
        });
      }

      setShowAddModal(false);
      setFormData({ 
        name: '', class_name: '', gender: '', dob: '', parent_name: '', phone: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        address: '', state_of_origin: '', lga: ''
      });
      setEditingId(null);
      fetchStudents();

    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus, studentName) => {
    const action = currentStatus ? 'suspend' : 'activate';
    const result = await Swal.fire({
      title: `Confirm ${action}`,
      text: `${action} ${studentName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').update({ is_active: !currentStatus }).eq('id', id);
      if (!error) { 
        fetchStudents(); 
        Swal.fire('Done!', `Student ${action}ed.`, 'success'); 
      }
    }
  };

  const handleDelete = async (id, studentName) => {
    const result = await Swal.fire({
      title: 'Delete Student?',
      text: `Remove ${studentName} permanently?`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (!error) { 
        setStudents(students.filter(s => s.id !== id)); 
        Swal.fire('Deleted', 'Record removed.', 'success'); 
      }
    }
  };

  const filteredStudents = students.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchLower) || 
      s.student_id?.toLowerCase().includes(searchLower) ||
      s.parent_name?.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && s.is_active) || 
                         (filterStatus === 'inactive' && !s.is_active);
    const matchesClass = filterClass === 'all' || s.class_name === filterClass;
    const matchesGender = filterGender === 'all' || s.gender === filterGender;
    return matchesSearch && matchesStatus && matchesClass && matchesGender;
  });

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterClass('all');
    setFilterGender('all');
  };

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterClass !== 'all' || filterGender !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage enrollment and student profiles</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadSampleStudentCSV}
              className="text-xs text-gray-500 hover:text-primary font-medium transition-colors"
            >
              <FaDownload className="inline mr-1" size={12} /> Template
            </button>

            <select
              value={bulkTargetClass}
              onChange={(e) => setBulkTargetClass(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              disabled={bulkLoading}
            >
              <option value="">Select Class</option>
              {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
            </select>

            <label className={`cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${bulkLoading ? 'opacity-50 cursor-not-allowed' : ''} ${!bulkTargetClass ? 'opacity-40 cursor-not-allowed bg-gray-400' : ''}`}>
              {bulkLoading ? (
                <><FaSpinner className="animate-spin" /> {bulkProgress.current}/{bulkProgress.total}</>
              ) : (
                <><FaUpload size={12} /> Import CSV</>
              )}
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleBulkStudentUpload} 
                disabled={bulkLoading || !bulkTargetClass} 
              />
            </label>

            <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block"></div>

            <button
              onClick={() => { 
                setEditingId(null); 
                setFormData({
                  name: '', class_name: '', gender: '', dob: '', parent_name: '', phone: '',
                  enrollment_date: new Date().toISOString().split('T')[0],
                  address: '', state_of_origin: '', lga: ''
                }); 
                setShowAddModal(true); 
              }}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition shadow-sm"
            >
              <FaPlus size={12} /> Add Student
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-primary">{students.length}</p>
            <p className="text-xs text-gray-500">Total Students</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-green-600">{students.filter(s => s.is_active).length}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-blue-600">{students.filter(s => s.gender === 'Male').length}</p>
            <p className="text-xs text-gray-500">Male</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-pink-600">{students.filter(s => s.gender === 'Female').length}</p>
            <p className="text-xs text-gray-500">Female</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition ${showFilters ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}
            >
              <FaFilter size={14} />
              <span className="text-sm hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select 
                  className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Suspended</option>
                </select>
                <select 
                  className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                >
                  <option value="all">All Classes</option>
                  {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
                <select 
                  className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                >
                  <option value="all">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isInitialLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
            <FaSpinner className="animate-spin text-primary text-4xl mb-3" />
            <p className="text-gray-500">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <FaUserGraduate className="text-5xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students found</p>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="mt-3 text-primary hover:text-primary-dark font-medium"
            >
              + Add your first student
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 text-right">
              <span className="text-xs text-gray-500">{filteredStudents.length} student(s) found</span>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase">
                      <th className="py-4 px-5">ID</th>
                      <th className="py-4 px-5">Name</th>
                      <th className="py-4 px-5">Class</th>
                      <th className="py-4 px-5">Parent</th>
                      <th className="py-4 px-5">Status</th>
                      <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-5 text-xs font-mono font-bold text-primary">{s.student_id}</td>
                        <td className="py-3 px-5 font-medium text-gray-800">{s.name}</td>
                        <td className="py-3 px-5 text-sm text-gray-600">{s.class_name}</td>
                        <td className="py-3 px-5 text-sm text-gray-500">{s.parent_name || '-'}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleQuickView(s)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="View">
                              <FaEye size={14} />
                            </button>
                            <button onClick={() => toggleStatus(s.id, s.is_active, s.name)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Suspend/Activate">
                              <FaBan size={14} />
                            </button>
                            <button onClick={() => { setEditingId(s.id); setFormData(s); setShowAddModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit">
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50"
                    onClick={() => toggleExpand(student.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-base">{student.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {student.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaIdCard size={10} />
                        <span className="font-mono">{student.student_id}</span>
                      </div>
                    </div>
                    <FaChevronRight className={`text-gray-400 transition-transform ${expandedCard === student.id ? 'rotate-90' : ''}`} />
                  </div>

                  {expandedCard === student.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Parent/Guardian</p>
                        <p className="font-medium text-gray-800">{student.parent_name || 'N/A'}</p>
                        {student.phone && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaPhone size={12} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{student.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-gray-500">Class</p>
                          <p className="font-medium">{student.class_name}</p>
                        </div>
                        <div className="bg-pink-50 rounded-lg p-2">
                          <p className="text-gray-500">Gender</p>
                          <p className="font-medium">{student.gender || 'N/A'}</p>
                        </div>
                      </div>

                      {(student.state_of_origin || student.lga) && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">Origin</p>
                          <p className="text-sm">{student.state_of_origin} {student.lga ? `(${student.lga})` : ''}</p>
                        </div>
                      )}

                      {student.address && (
                        <div className="flex items-start gap-2">
                          <FaMapMarkerAlt size={12} className="text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600">{student.address}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleQuickView(student)} className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">View</button>
                        <button onClick={() => { setEditingId(student.id); setFormData(student); setShowAddModal(true); }} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(student.id, student.name)} className="py-2 px-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* View Student Modal */}
        {showViewModal && viewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white px-5 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">Student Details</h2>
                <button onClick={() => setShowViewModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <FaTimes size={18} />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <FaUserGraduate className="text-primary text-2xl" />
                  </div>
                  <h3 className="font-bold text-lg">{viewingStudent.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{viewingStudent.student_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Class</p>
                    <p className="font-medium">{viewingStudent.class_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Gender</p>
                    <p className="font-medium">{viewingStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Parent</p>
                    <p className="font-medium">{viewingStudent.parent_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Phone</p>
                    <p className="font-medium">{viewingStudent.phone || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Origin</p>
                    <p className="font-medium">{viewingStudent.state_of_origin || 'N/A'} {viewingStudent.lga ? `(${viewingStudent.lga})` : ''}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500 text-xs">Address</p>
                    <p className="font-medium text-sm">{viewingStudent.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t bg-gray-50">
                <button onClick={() => setShowViewModal(false)} className="w-full bg-primary text-white py-2.5 rounded-lg font-medium">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white px-5 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold">{editingId ? 'Edit Student' : 'Add Student'}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <FaTimes size={18} />
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
                    <input required className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Class *</label>
                    <select required className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.class_name} onChange={e => setFormData({...formData, class_name: e.target.value})}>
                      <option value="">Select</option>
                      {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Gender *</label>
                    <select required className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth *</label>
                    <input required type="date" className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Enrollment Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.enrollment_date} onChange={e => setFormData({...formData, enrollment_date: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">State of Origin</label>
                    <input className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.state_of_origin} onChange={e => setFormData({...formData, state_of_origin: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">LGA</label>
                    <input className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.lga} onChange={e => setFormData({...formData, lga: e.target.value})} />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                    <textarea className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" rows="2"
                      value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Parent Name *</label>
                    <input required className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Parent Phone *</label>
                    <input required className="w-full px-4 py-2.5 bg-gray-50 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-primary text-white py-3 rounded-lg font-semibold mt-4 transition active:scale-95">
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : (editingId ? 'Update Student' : 'Enroll Student')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};