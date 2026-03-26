import { useState, useEffect } from 'react';
import { supabase } from '../db';

const Hero = () => {
  
  const [hero, setHero] = useState({
    title: 'Shaping Future Leaders at Myriad Academy', 
    subtitle: 'Providing world-class education for the next generation.', 
    button_enroll_text: 'Enroll Now',
    button_explore_text: 'Learn More',
    image_url: '/path-to-your-local-image.jpg' 
  });

  useEffect(() => {
    const fetchHero = async () => {
      const { data } = await supabase
        .from('landing_hero')
        .select('*')
        .eq('id', 1)
        .single();
      
      
      if (data) setHero(data);
    };
    fetchHero();
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
  };


  
  return (
    <section className="relative h-screen min-h-[600px] flex items-center">
      <div className="absolute inset-0">
        <img 
          src={hero.image_url} 
          alt="Hero Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/60" /> 
      </div>
      
      <div className="relative z-10 container mx-auto px-4 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            {hero.title}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            {hero.subtitle}
          </p>
          <div className="flex gap-4">
            <button onClick={() => scrollToSection('admissions')} className="bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              {hero.button_enroll_text}
            </button>
            <button onClick={() => scrollToSection('about')} className="border-2 border-white px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition-colors">
              {hero.button_explore_text}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;