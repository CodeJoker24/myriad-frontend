import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const BacktoTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-50 hover:bg-primary-dark hover:-translate-y-1 ${
        isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
    >
      <FaArrowUp size={20} />
    </button>
  );
};

export default BacktoTop;