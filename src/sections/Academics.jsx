import { useState, useEffect } from 'react';
import { FaArrowRight, FaSpinner } from 'react-icons/fa';
import { supabase } from '../db'; 

const Academics = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const { data, error } = await supabase
          .from('landing_academics')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data) setPrograms(data);
      } catch (err) {
        console.error("Error fetching academic programs:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const headerOffset = 80;
      const elementPosition = contactSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }   
  };

  return (
    <section id="academics" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Academic Programs
          </h2>
          <p className="text-lg text-gray-600">
            We offer a comprehensive curriculum designed to meet the needs of students 
            at every stage of their educational journey.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-3xl text-primary" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            No academic programs available at the moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="h-64 overflow-hidden bg-gray-100">
                  <img
                    src={program.image_url}
                    alt={program.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {program.description}
                  </p>
                  
                  <button
                    onClick={scrollToContact}
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all cursor-pointer"
                  >
                    Learn More <FaArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Academics;