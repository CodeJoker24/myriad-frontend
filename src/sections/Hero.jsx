
import heroBg from '../assets/images/hero_overlay.jpeg'; 

const Hero = () => {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative h-screen min-h-[600px] flex items-center">
     
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Myriad Academy Campus" 
          className="w-full h-full object-cover"
        />
        
        <div className="absolute inset-0 bg-primary/60" /> 
      </div>
      
=
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-3xl text-white">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 drop-shadow-lg">
            Shaping Future Leaders Through Innovative Education
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/95 max-w-2xl drop-shadow">
            At Myriad Academy, we combine academic excellence with character development 
            to prepare students for the challenges of tomorrow's world.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollToSection('admissions')}
              className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:shadow-lg"
            >
              Enroll Now
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all"
            >
              Explore More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;