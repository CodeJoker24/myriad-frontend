import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import earlyChildhoodImg from '../assets/images/Early Childhood.jpeg';
import primaryImg from '../assets/images/Primary Education.jpeg';
import collegeImg from '../assets/images/USCA Academy_ Premier International Private School In Canada.jpeg';

const Academics = () => {
  const programs = [
    {
      id: 1,
      title: 'Early Childhood',
      description: 'Our play-based learning environment fosters curiosity and foundational skills for children ages 1-5.',
      image: earlyChildhoodImg,
      delay: '0'
    },
    {
      id: 2,
      title: 'Primary',
      description: 'Basic 1-6 with a focus on core subjects, creativity, and character development.',
      image: primaryImg,
      delay: '100'
    },
    {
      id: 3,
      title: 'College',
      description: 'College preparatory program with Science, humanities, and arts pathways.',
      image: collegeImg,
      delay: '200'
    }
  ];

  return (
    <section id="academics" className="section bg-light relative overflow-hidden">
     
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
       
        <div className="section-header text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient">Academic Programs</span>
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
              className={`group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up delay-${program.delay}`}
            >
             
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
              </div>

             
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {program.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {program.description}
                </p>
                
                
                <a
                  href={`/programs/${program.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center gap-2 text-primary font-semibold group/link"
                >
                  Learn More 
                  <FaArrowRight className="group-hover/link:translate-x-1 transition-transform" />
                </a>
              </div>

              
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary to-secondary opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-bl-3xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Academics;