import { useState, useEffect, useRef } from 'react';
import { supabase } from '../db';

const Stats = () => {
  const [targets, setTargets] = useState({
    students: 280,
    courses: 16,
    teachers: 15,
    years: 4
  });


  const [students, setStudents] = useState(0);
  const [courses, setCourses] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [years, setYears] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);


  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('landing_stats')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) {
        setTargets({
          students: data.students_count,
          courses: data.courses_count,
          teachers: data.teachers_count,
          years: data.years_count
        });
      }
    };
    fetchStats();
  }, []);

  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => {
      if (statsRef.current) observer.unobserve(statsRef.current);
    };
  }, []);


  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setStudents(Math.min(Math.floor(progress * targets.students), targets.students));
      setCourses(Math.min(Math.floor(progress * targets.courses), targets.courses));
      setTeachers(Math.min(Math.floor(progress * targets.teachers), targets.teachers));
      setYears(Math.min(Math.floor(progress * targets.years), targets.years));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible, targets]); 

  return (
    <section ref={statsRef} className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: students, label: 'Happy Students' },
            { val: courses, label: 'Courses Offered' },
            { val: teachers, label: 'Qualified Teachers' },
            { val: years, label: 'Years of Excellence' }
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {item.val}+
              </div>
              <div className="text-gray-600 font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;