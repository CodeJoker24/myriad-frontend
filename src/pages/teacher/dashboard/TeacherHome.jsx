import { useState, useEffect } from 'react';
import { FaUsers, FaBook, FaCalendarCheck, FaClipboardList, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../../db';

export const TeacherHome = () => {
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    attendanceToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
  try {
    setLoading(true);

    const { data: profile } = await supabase
      .from('teachers')
      .select('is_class_teacher_of, classes, subjects') 
      .eq('id', teacher.id)
      .single();

    if (profile) {
      
      let studentCount = 0;
      if (profile.is_class_teacher_of) {
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('class_name', profile.is_class_teacher_of)
          .eq('is_active', true);
        studentCount = count || 0;
      }

     
      const subjectCount = profile.subjects?.length || 0;

     
      const classCount = profile.classes?.length || 0;

      const today = new Date().toISOString().split('T')[0];
      const { count: attCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('marked_by', teacher.id)
        .eq('status', 'present');

      setStats({
        totalStudents: studentCount,
        totalSubjects: subjectCount, 
        attendanceToday: attCount || 0
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-2 md:p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {teacher?.name?.split(' ')[0] || 'Teacher'}!
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your teaching activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Students Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <FaUsers size={24} />
            </div>
            <span className="text-2xl font-bold">
              {loading ? <FaSpinner className="animate-spin text-sm" /> : stats.totalStudents}
            </span>
          </div>
          <h3 className="text-gray-600 font-medium">My Form Students</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
            Class: {teacher?.is_class_teacher_of || 'None'}
          </p>
        </div>

        {/* My Classes Card */}
       {/* Subjects Taught Card */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
      <FaBook size={24} />
    </div>
    <span className="text-2xl font-bold">
      {loading ? <FaSpinner className="animate-spin text-sm" /> : stats.totalSubjects}
    </span>
  </div>
  <h3 className="text-gray-600 font-medium">Subjects Taught</h3>
  {/* Sub-text to show how many classes they cover */}
  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
    Across {teacher?.classes?.length || 0} Different Classes
  </p>
</div>

        {/* Attendance Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <FaCalendarCheck size={24} />
            </div>
            <span className="text-2xl font-bold">
              {loading ? <FaSpinner className="animate-spin text-sm" /> : stats.attendanceToday}
            </span>
          </div>
          <h3 className="text-gray-600 font-medium">Present Today</h3>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
              <FaClipboardList size={24} />
            </div>
            <span className="text-2xl font-bold">0</span>
          </div>
          <h3 className="text-gray-600 font-medium">Pending Results</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h2>
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm italic">You have no lessons scheduled for this time slot.</p>
        </div>
      </div>
    </div>
  );
};