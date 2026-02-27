import heroBg from '../assets/images/hero_overlay.jpeg'; 

const Hero = () => {
  return (
    <section className="relative h-screen min-h-[800px] flex items-center pt-20">
      
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80 z-10" />
        <img 
          src={heroBg} 
          alt="Myriad Academy" 
          className="w-full h-full object-cover"
        />
      </div>
      
      
      <div className="relative z-20 container mx-auto px-4 text-white">
        <div className="max-w-3xl animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Shaping Future Leaders Through Innovative Education
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            At Myriad Academy, we combine academic excellence with character development 
            to prepare students for the challenges of tomorrow's world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="/#admissions" className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all hover:-translate-y-1 shadow-lg text-center">
              Enroll Now
            </a>
            <a href="/#about" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all hover:-translate-y-1 text-center">
              Explore More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;