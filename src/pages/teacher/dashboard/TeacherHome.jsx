import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaBook, FaSpinner, FaChalkboardTeacher, FaTrophy, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../../../db';

export const TeacherHome = () => {
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalClasses: 0
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

      setStats({
        totalStudents: studentCount,
        totalSubjects: subjectCount, 
        totalClasses: classCount
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
};

  const statCards = [
    { 
      title: 'My Students', 
      value: stats.totalStudents, 
      icon: <FaUsers />, 
      color: 'from-blue-500 to-blue-600',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      subText: `Class: ${teacher?.is_class_teacher_of || 'Not Assigned'}`
    },
    { 
      title: 'Subjects Taught', 
      value: stats.totalSubjects, 
      icon: <FaBook />, 
      color: 'from-purple-500 to-purple-600',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      subText: `Across ${stats.totalClasses} classes`
    },
    { 
      title: 'My Classes', 
      value: stats.totalClasses, 
      icon: <FaChalkboardTeacher />, 
      color: 'from-green-500 to-green-600',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      subText: 'Active classes'
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hero Welcome Section */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-linear-to-r from-primary via-primary to-blue-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
         
            <span className="text-xs font-semibold uppercase tracking-wider">Teacher Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome back, {teacher?.name?.split(' ')[0] || 'Teacher'}!
          </h1>
          <p className="text-white/80 mt-2">Here's an overview of your teaching activities</p>
        </div>
      </div>

      {/* Stats Grid - 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 ${card.lightColor} rounded-xl flex items-center justify-center ${card.textColor}`}>
                {card.icon}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? <FaSpinner className="animate-spin text-primary" /> : card.value}
                </p>
              </div>
            </div>
            <h3 className="text-gray-700 font-semibold">{card.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{card.subText}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Now with working links */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-linear-to-r from-gray-50 to-white">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <FaTrophy className="text-primary" /> Quick Actions
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* View Students - Navigates to My Class */}
            <Link 
              to="/teacher/dashboard/my-class"
              className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <FaUsers size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">View Students</span>
              </div>
              <FaArrowRight className="text-blue-500 group-hover:translate-x-1 transition-transform" size={14} />
            </Link>

            {/* Upload Results - Navigates to Results */}
            <Link 
              to="/teacher/dashboard/results"
              className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                  <FaBook size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Upload Results</span>
              </div>
              <FaArrowRight className="text-purple-500 group-hover:translate-x-1 transition-transform" size={14} />
            </Link>

            {/* My Classes - Navigates to Attendance or Classes */}
            <Link 
              to="/teacher/dashboard/attendance"
              className="flex items-center justify-between p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white">
                  <FaChalkboardTeacher size={16} />
                </div>
                <span className="text-sm font-semibold text-gray-700">Take Attendance</span>
              </div>
              <FaArrowRight className="text-green-500 group-hover:translate-x-1 transition-transform" size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};