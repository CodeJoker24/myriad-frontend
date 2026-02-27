import { FaFlask, FaBookOpen, FaLaptopCode, FaBasketballBall } from 'react-icons/fa';

const Facilities = () => {
  const facilities = [
    {
      id: 1,
      icon: <FaFlask className="text-3xl" />,
      title: 'STEM Labs',
      description: 'Cutting-edge laboratories for science, technology, engineering, and mathematics experiments and research.',
      color: 'from-blue-500 to-cyan-500',
      delay: '0'
    },
    {
      id: 2,
      icon: <FaBookOpen className="text-3xl" />,
      title: 'Digital Library',
      description: 'Extensive collection with online resources, e-books, and collaborative study spaces for students.',
      color: 'from-green-500 to-emerald-500',
      delay: '100'
    },
    {
      id: 3,
      icon: <FaLaptopCode className="text-3xl" />,
      title: 'Tech Hub',
      description: 'Well-equipped computer space to provide students with adequate knowledge about modern technology.',
      color: 'from-purple-500 to-pink-500',
      delay: '200'
    },
    {
      id: 4,
      icon: <FaBasketballBall className="text-3xl" />,
      title: 'Sports Complex',
      description: 'Indoor and outdoor courts for basketball, volleyball, and other sporting activities.',
      color: 'from-orange-500 to-red-500',
      delay: '300'
    }
  ];

  return (
    <section id="facilities" className="section bg-white relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        
        <div className="section-header text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our <span className="text-gradient">Facilities</span>
          </h2>
          <p className="text-gray-600">
            We provide modern facilities that enhance learning and promote overall student development 
            in a conducive environment.
          </p>
        </div>

        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {facilities.map((facility) => (
            <div
              key={facility.id}
              className={`group relative bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up delay-${facility.delay}`}
            >
            
              <div className={`absolute inset-0 bg-gradient-to-br ${facility.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`} />
              
           
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${facility.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                {facility.icon}
              </div>

              
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {facility.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {facility.description}
              </p>

              
              <div className={`absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl ${facility.color} opacity-0 group-hover:opacity-20 rounded-tl-2xl transition-opacity duration-500`} />

              
              <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${facility.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
            </div>
          ))}
        </div>

      
        <div className="mt-16 bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-1">3</div>
              <div className="text-sm opacity-90">STEM Labs</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">5K+</div>
              <div className="text-sm opacity-90">Library Books</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">50+</div>
              <div className="text-sm opacity-90">Tech Workstations</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">2</div>
              <div className="text-sm opacity-90">Sports Courts</div>
            </div>
          </div>
        </div>

     
      </div>
    </section>
  );
};

export default Facilities;