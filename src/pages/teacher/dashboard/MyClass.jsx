import { useState, useEffect } from 'react';
import { supabase } from '../../../db';
import { FaUserGraduate, FaPhone, FaWhatsapp, FaSpinner, FaUsers } from 'react-icons/fa';

const MyClass = () => {
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyClass();
  }, []);

  const fetchMyClass = async () => {
    try {
      setLoading(true);
     
      const { data: { user } } = await supabase.auth.getUser();

    
      const { data: teacher, error: tError } = await supabase
        .from('teachers')
        .select('name, is_class_teacher_of')
        .eq('id', user.id)
        .single();

      if (tError) throw tError;
      setTeacherProfile(teacher);

      if (teacher.is_class_teacher_of) {
        const { data: classList, error: sError } = await supabase
          .from('students')
          .select('*')
          .eq('class_name', teacher.is_class_teacher_of)
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (sError) throw sError;
        setStudents(classList);
      }
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><FaSpinner className="animate-spin text-primary text-4xl" /></div>;

 
  if (!teacherProfile?.is_class_teacher_of) {
    return (
      <div className="p-10 text-center">
        <FaUsers className="mx-auto text-gray-300 text-6xl mb-4" />
        <h2 className="text-xl font-bold text-gray-800">No Assigned Class</h2>
        <p className="text-gray-500">You are currently listed as a Subject Specialist. Please contact the Admin to be assigned as a Form Teacher.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Class Roster</h1>
        <p className="text-primary font-semibold uppercase tracking-widest text-xs">
           Form Teacher: {teacherProfile.is_class_teacher_of} | {students.length} Active Students
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <FaUserGraduate size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{student.name}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase">{student.student_id}</p>
                </div>
             </div>

             <div className="space-y-2 border-t border-gray-50 pt-4">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Parent:</span>
                    <span className="font-semibold text-gray-700">{student.parent_name || 'N/A'}</span>
                </div>
                
                {/* Quick Contact Actions */}
                <div className="flex gap-2 mt-4">
                    <a href={`tel:${student.phone}`} className="flex-1 py-3 bg-gray-50 rounded-xl flex justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                        <FaPhone size={14} />
                    </a>
                    <a href={`https://wa.me/${student.phone}`} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-gray-50 rounded-xl flex justify-center text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors">
                        <FaWhatsapp size={16} />
                    </a>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyClass;