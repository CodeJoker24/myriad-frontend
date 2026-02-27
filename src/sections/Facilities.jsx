import { FaFlask, FaBookOpen, FaLaptopCode, FaBasketballBall } from 'react-icons/fa';

const Facilities = () => {
  const facilities = [
    {
      id: 1,
      icon: <FaFlask className="text-3xl" />,
      title: 'STEM Labs',
      description: 'Cutting-edge laboratories for science, technology, engineering, and mathematics experiments and research.',
    },
    {
      id: 2,
      icon: <FaBookOpen className="text-3xl" />,
      title: 'Digital Library',
      description: 'Extensive collection with online resources, e-books, and collaborative study spaces for students.',
    },
    {
      id: 3,
      icon: <FaLaptopCode className="text-3xl" />,
      title: 'Tech Hub',
      description: 'Well-equipped computer space to provide students with adequate knowledge about modern technology.',
    },
    {
      id: 4,
      icon: <FaBasketballBall className="text-3xl" />,
      title: 'Sports Complex',
      description: 'Indoor and outdoor courts for basketball, volleyball, and other sporting activities.',
    }
  ];

  return (
    <section id="facilities" className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Facilities
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
              className="bg-gray-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                {facility.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {facility.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {facility.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;