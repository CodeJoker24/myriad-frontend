import { useState, useEffect, useRef } from 'react';

const Stats = () => {
  const [students, setStudents] = useState(0);
  const [courses, setCourses] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [years, setYears] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  // Target values
  const targets = {
    students: 280,
    courses: 16,
    teachers: 15,
    years: 4
  };

  // Intersection Observer to trigger animation when stats come into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  // Counter animation
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
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
        // Ensure final values are exact
        setStudents(targets.students);
        setCourses(targets.courses);
        setTeachers(targets.teachers);
        setYears(targets.years);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <section ref={statsRef} className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Students */}
          <div className="text-center animate-fade-in-up">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {students}+
            </div>
            <div className="text-gray-600 font-semibold">Happy Students</div>
          </div>

          {/* Courses */}
          <div className="text-center animate-fade-in-up delay-100">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {courses}+
            </div>
            <div className="text-gray-600 font-semibold">Courses Offered</div>
          </div>

          {/* Teachers */}
          <div className="text-center animate-fade-in-up delay-200">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {teachers}+
            </div>
            <div className="text-gray-600 font-semibold">Qualified Teachers</div>
          </div>

          {/* Years */}
          <div className="text-center animate-fade-in-up delay-300">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {years}+
            </div>
            <div className="text-gray-600 font-semibold">Years of Excellence</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;