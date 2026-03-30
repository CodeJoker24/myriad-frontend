import { useState, useEffect } from 'react';
import { supabase } from '../db';
import aboutImg from '../assets/images/hero_overlay.jpeg';

const About = () => {
  const [content, setContent] = useState({
    about_text_1: 'Founded with a vision to revolutionize education...',
    about_text_2: 'Our holistic approach...',
    mission_text: 'To empower students...',
    vision_text: 'To be recognized as...',
    image_url: null 
  });

  useEffect(() => {
    const fetchAboutContent = async () => {
      try {
        const { data, error } = await supabase
          .from('about_content')
          .select('*')
          .eq('id', 1)
          .single();
          
        if (data) {
          setContent({
            about_text_1: data.about_text_1 || '',
            about_text_2: data.about_text_2 || '',
            mission_text: data.mission_text || '',
            vision_text: data.vision_text || '',
            image_url: data.image_url || null
          });
        }
      } catch (err) {
        console.error('Error loading about content:', err);
      }
    };
    fetchAboutContent();
  }, []);

  return (
    <section id="about" className="section bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image Section */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-video lg:aspect-square">
              <img 
                /* Logic: Use DB image if it exists, otherwise use local import */
                src={content.image_url || aboutImg} 
                alt="About Myriad Academy" 
                className="w-full h-full object-cover transition-opacity duration-500" 
              />
            </div>
          </div>

          {/* Text Content Section */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              About Myriad Academy
            </h2>
            
            <p className="text-gray-600 leading-relaxed">
              {content.about_text_1}
            </p>
            
            <p className="text-gray-600 leading-relaxed">
              {content.about_text_2}
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {/* Mission Box */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-xl font-bold text-primary mb-3">Our Mission</h3>
                <p className="text-gray-600 text-sm">
                  {content.mission_text}
                </p>
              </div>

              {/* Vision Box */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-xl font-bold text-primary mb-3">Our Vision</h3>
                <p className="text-gray-600 text-sm">
                  {content.vision_text}
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