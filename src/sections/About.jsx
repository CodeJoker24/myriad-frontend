
import aboutImg from '../assets/images/hero_overlay.jpeg';

const About = () => {
  return (
    <section id="about" className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img 
                src={aboutImg} 
                alt="Myriad Academy" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              About Myriad Academy
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
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-primary mb-3">Our Mission</h3>
                <p className="text-gray-600 text-sm">
                  To empower students with knowledge, skills, and values that prepare 
                  them for lifelong success in an ever-changing world.
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-primary mb-3">Our Vision</h3>
                <p className="text-gray-600 text-sm">
                  To be recognized as a premier institution that transforms education 
                  through innovation, inclusion, and inspiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;