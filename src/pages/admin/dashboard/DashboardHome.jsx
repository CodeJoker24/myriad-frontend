import { FaUsers, FaChalkboardTeacher, FaBook, FaClipboardList, FaClock, FaArrowRight, FaUserPlus, FaUpload, FaPlusCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../db';
import Swal from 'sweetalert2';

export const DashboardHome = () => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    teachers: 0,
    students: 0,
    courses: 0,
    pendingResults: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error("Error fetching activity:", err.message);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const { count: teacherCount, error: tError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (tError) console.error("Error fetching stats:", tError);

      setCounts({
        teachers: teacherCount || 0,
        students: studentCount || 0,
        courses: 0, 
        pendingResults: 0
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Students', value: counts.students, icon: <FaUsers />, bgLight: 'bg-blue-50', textColor: 'text-blue-600' },
    { title: 'Teachers', value: counts.teachers, icon: <FaChalkboardTeacher />, bgLight: 'bg-green-50', textColor: 'text-green-600' },
    { title: 'Courses', value: counts.courses, icon: <FaBook />, bgLight: 'bg-purple-50', textColor: 'text-purple-600' },
    { title: 'Pending Results', value: counts.pendingResults, icon: <FaClipboardList />, bgLight: 'bg-orange-50', textColor: 'text-orange-600' },
  ];

  const quickActions = [
    { 
      title: 'Add New Student', 
      description: 'Register a new student', 
      icon: <FaUserPlus />, 
      color: 'bg-blue-500',
      onClick: () => navigate('/admin/dashboard/school-management/students')
    },
    { 
      title: 'Upload Results', 
      description: 'Publish new results', 
      icon: <FaUpload />, 
      color: 'bg-green-500',
      onClick: () => navigate('/admin/dashboard/results')
    },
    { 
      title: 'Create Class', 
      description: 'Set up new classroom', 
      icon: <FaPlusCircle />, 
      color: 'bg-purple-500',
      onClick: () => navigate('/admin/dashboard/classroom')
    },
  ];

  const getCategoryColor = (category) => {
    switch(category) {
      case 'security': return 'bg-red-100 text-red-700';
      case 'site': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const clearLogs = async () => {
    const { value: confirmed } = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete all recent activity logs!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, clear all'
    });

    if (confirmed) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('activity_logs')
          .delete()
          .not('id', 'is', null); 

        if (error) throw error;

        Swal.fire('Cleared!', 'Activity logs have been wiped.', 'success');
        fetchRecentActivity(); 
      } catch (err) {
        Swal.fire('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Simple Welcome Section - No Gradient */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`${stat.bgLight} ${stat.textColor} w-12 h-12 rounded-xl flex items-center justify-center`}>
                {stat.icon}
              </div>
              <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
            </div>
            <p className="text-gray-500 text-sm mt-3">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaClock className="text-gray-400" /> Recent Activity
            </h2>
            <button 
              onClick={clearLogs}
              className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
            >
              Clear Logs
            </button>
          </div>

          <div className="divide-y divide-gray-50 max-h-45 overflow-y-auto custom-scrollbar">
            {activities.length > 0 ? (
              activities.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800 text-sm font-medium">{log.action_text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${getCategoryColor(log.category)}`}>
                      {log.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FaClock className="text-gray-400 text-lg" />
                </div>
                <p className="text-gray-500 text-sm">No recent activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <div className="p-5 space-y-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center text-white`}>
                  {action.icon}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-gray-800 text-sm">{action.title}</h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
                <FaArrowRight className="text-gray-300 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};