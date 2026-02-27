
import { useState, useEffect } from 'react';
import { 
  FaQuoteLeft, 
  FaQuoteRight, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSpinner,
  FaStar,
  FaRegStar 
} from 'react-icons/fa';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setTestimonials([]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }
    return stars;
  };

  return (
    <section id="testimonials" className="section bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What People Say
          </h2>
          <p className="text-gray-600">
            Hear from our community about their Myriad Academy experience.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FaSpinner className="animate-spin text-primary text-3xl mb-4" />
            <p className="text-gray-500">Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-gray-50 rounded-2xl p-12">
              <FaQuoteLeft className="text-4xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-3">No Testimonials Yet</h3>
              <p className="text-gray-500 mb-6">
                Be the first to share your experience at Myriad Academy! 
                Your story could inspire others to join our community.
              </p>
              <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all">
                Share Your Experience
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-2xl shadow-xl p-8 md:p-12 relative">
              <FaQuoteLeft className="absolute top-6 left-6 text-4xl text-primary/10" />
              <FaQuoteRight className="absolute bottom-6 right-6 text-4xl text-primary/10" />

              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="flex gap-1">
                    {renderStars(testimonials[currentIndex]?.rating || 5)}
                  </div>
                </div>

                <p className="text-gray-700 text-lg md:text-xl italic mb-8 text-center leading-relaxed">
                  "{testimonials[currentIndex]?.content}"
                </p>

                <div className="flex items-center justify-center gap-4">
                  <img
                    src={testimonials[currentIndex]?.image}
                    alt={testimonials[currentIndex]?.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-primary/20"
                  />
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900 text-lg">{testimonials[currentIndex]?.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonials[currentIndex]?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={goToPrevious}
                className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-primary hover:text-primary-dark transition-all"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={goToNext}
                className="w-12 h-12 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-primary hover:text-primary-dark transition-all"
              >
                <FaChevronRight />
              </button>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-6 bg-primary'
                      : 'bg-gray-300 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;