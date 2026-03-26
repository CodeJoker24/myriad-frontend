import { useState, useEffect } from 'react';
import { supabase } from '../db';
import { FaQuoteLeft} from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data } = await supabase
        .from('landing_testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTestimonials(data);
    };
    fetchTestimonials();
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">What Our Parents Say</h2>
          <p className="text-slate-500">Real stories from the families that make our community special.</p>
        </div>

        <Swiper
          spaceBetween={30}
          centeredSlides={false}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          modules={[Autoplay, Pagination]}
          className="pb-14" 
        >
          {testimonials.map((t) => (
            <SwiperSlide key={t.id}>
              <div className="h-full bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div>
                  <FaQuoteLeft className="text-primary/10 text-5xl mb-4" />
                  <p className="text-slate-600 mb-6 italic leading-relaxed">
                    "{t.content}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-none mb-1">{t.name}</h4>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Testimonials;