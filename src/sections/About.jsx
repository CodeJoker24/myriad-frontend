import { FaBullseye, FaEye } from 'react-icons/fa';
import aboutImg from '../assets/images/hero_overlay.jpeg'; 

const About = () => {
  return (
    <section id="about" className="section bg-light">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="relative animate-fade-in-up">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 z-10" />
              <img 
                src={aboutImg} 
                alt="Myriad Academy Campus" 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full blur-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -z-10" />
          </div>

         
          <div className="space-y-6 animate-fade-in-up delay-200">
            <h2 className="text-3xl md:text-4xl font-bold">
              About <span className="text-gradient">Myriad Academy</span>
            </h2>
            
            <p className="text-gray-600 leading-relaxed">
              Founded with a vision to revolutionize education, Myriad Academy has been 
              at the forefront of academic innovation since our establishment. We believe 
              in nurturing not just academic excellence but also character, creativity, 
              and critical thinking.
            </p>
            
            <p className="text-gray-600 leading-relaxed">
              Our holistic approach combines rigorous academics with extracurricular 
              activities, ensuring students develop into well-rounded individuals ready 
              to tackle global challenges.
            </p>

           
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              
              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FaBullseye className="text-primary text-xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                <p className="text-gray-600 text-sm">
                  To empower students with knowledge, skills, and values that prepare 
                  them for lifelong success in an ever-changing world.
                </p>
              </div>

              
              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <FaEye className="text-secondary text-xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                <p className="text-gray-600 text-sm">
                  To be recognized as a premier institution that transforms education 
                  through innovation, inclusion, and inspiration.
                </p>
              </div>
            </div>

            
            <div className="pt-4">
              <a 
                href="/#academics" 
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
              >
                Learn more about our programs 
                <span className="text-xl">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;