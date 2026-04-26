import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import earlyChildhoodImg from '../assets/images/Early Childhood.jpeg';
import primaryImg from '../assets/images/Primary Education.jpeg';
import collegeImg from '../assets/images/USCA Academy_ Premier International Private School In Canada.jpeg';

const Academics = () => {
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

  const programs = [
    {
      id: 1,
      title: 'Early Childhood',
      description: 'Our play-based learning environment fosters curiosity and foundational skills for children ages 1-5.',
      image: earlyChildhoodImg,
    },
    {
      id: 2,
      title: 'Primary',
      description: 'Basic 1-6 with a focus on core subjects, creativity, and character development.',
      image: primaryImg,
    },
    {
      id: 3,
      title: 'College',
      description: 'College preparatory program with Science, humanities, and arts pathways.',
      image: collegeImg,
    }
  ];

  return (
    <section id="academics" className="section bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Academic Programs
          </h2>
          <p className="text-gray-600">
            We offer a comprehensive curriculum designed to meet the needs of students 
            at every stage of their educational journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={program.image}
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
      </div>
    </section>
  );
};

export default Academics;