import { Helmet } from 'react-helmet-async';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import BacktoTop from '../components/layout/BacktoTop';
import Hero from '../sections/Hero'; 
import Stats from '../sections/Stats';
import About from '../sections/About';
import Academics from '../sections/Academics';
import Facilities from '../sections/Facilities';
import Admissions from '../sections/Admissions';
import Testimonials from '../sections/Testimonials';
import Newsletter from '../sections/Newsletter';
import Contact from '../sections/Contact';
import { useState, useEffect } from 'react';
import { supabase } from '../db';

const Home = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('landing_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnnouncements(data);
      }
    };
    fetchAnnouncements();
  }, []);

  const getTypeStyles = (type) => {
    const styles = {
      info: 'bg-gradient-to-r from-blue-500 to-blue-600',
      success: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      warning: 'bg-gradient-to-r from-amber-500 to-amber-600',
      danger: 'bg-gradient-to-r from-red-500 to-red-600',
      primary: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
      pink: 'bg-gradient-to-r from-pink-500 to-pink-600'
    };
    return styles[type] || styles.primary;
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: '📢',
      success: '🎉',
      warning: '⚠️',
      danger: '🚨',
      primary: '📌',
      purple: '✨',
      pink: '💫'
    };
    return icons[type] || icons.info;
  };

  // If no announcements, return normal page without banner
  if (announcements.length === 0) {
    return (
      <>
        <Helmet>
          <title>Myriad Academy | Approved School & Academic Portal in Owode, Ogun State</title>
          <meta 
            name="description" 
            content="Welcome to Myriad Academy along Owode-Idiroko Road, Atan. A government-approved school (Creche to WAEC) featuring an advanced online portal for checking report sheets, continuous assessments, and practical tech education with affordable fees." 
          />
          <meta 
            name="keywords" 
            content="Myriad Academy, school portal, check report sheets online, schools in Owode Ogun State, approved secondary schools in Atan, WAEC center Owode Idiroko, continuous assessment portal, affordable school fees Owode, practical tech education, online school management system Nigeria, schools along Idiroko road" 
          />
          <meta property="og:title" content="Myriad Academy — Government Approved School & Digital Portal" />
          <meta property="og:description" content="Quality, affordable education from Creche to Senior Secondary (WAEC) along Owode-Idiroko Road, Ogun State. Access student report sheets and continuous assessments cleanly online." />
          <meta property="og:type" content="website" />
        </Helmet>
        <Header />
        <main>
          <Hero /> 
          <Stats/>
          <About/>
          <Academics/>
          <Facilities/>
          <Admissions/>
          <Testimonials/>
          <Newsletter/>
          <Contact/>
        </main>
        <Footer />
        <BacktoTop />
      </>
    );
  }

  // Build the marquee content - repeat each message 3 times for seamless scrolling
  const marqueeContent = announcements.flatMap(announcement => 
    Array(3).fill(announcement)
  );

  // Add extra separator between each announcement
  const separator = ' • ';

  return (
    <>
      <Helmet>
        <title>Myriad Academy | Approved School & Academic Portal in Owode, Ogun State</title>
        <meta 
          name="description" 
          content="Welcome to Myriad Academy along Owode-Idiroko Road, Atan. A government-approved school (Creche to WAEC) featuring an advanced online portal for checking report sheets, continuous assessments, and practical tech education with affordable fees." 
        />
        <meta 
          name="keywords" 
          content="Myriad Academy, school portal, check report sheets online, schools in Owode Ogun State, approved secondary schools in Atan, WAEC center Owode Idiroko, continuous assessment portal, affordable school fees Owode, practical tech education, online school management system Nigeria, schools along Idiroko road" 
        />
        <meta property="og:title" content="Myriad Academy — Government Approved School & Digital Portal" />
        <meta property="og:description" content="Quality, affordable education from Creche to Senior Secondary (WAEC) along Owode-Idiroko Road, Ogun State. Access student report sheets and continuous assessments cleanly online." />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />
      
      {/* Continuous Scrolling Marquee Banner */}
      <div className="fixed top-20 left-0 right-0 z-40 overflow-hidden shadow-lg">
        <div className={`relative py-3 ${getTypeStyles(announcements[0]?.type || 'primary')} text-white`}>
          {/* Gradient overlay for fade effect on edges */}
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-current to-transparent opacity-20 z-10"></div>
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-current to-transparent opacity-20 z-10"></div>
          
          <div className="relative overflow-hidden">
            <div 
              className="flex whitespace-nowrap animate-marquee"
              style={{
                animationDuration: `${marqueeContent.length * 3}s`,
                animationIterationCount: 'infinite',
                animationTimingFunction: 'linear',
              }}
            >
              {/* First set of announcements */}
              {marqueeContent.map((announcement, index) => (
                <span key={`first-${index}`} className="inline-flex items-center gap-3 mx-4 text-sm md:text-base font-medium">
                  <span className="text-lg shrink-0">{getTypeIcon(announcement.type)}</span>
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {announcement.type}
                  </span>
                  <span>{announcement.message}</span>
                  <span className="text-white/30 mx-2">{separator}</span>
                </span>
              ))}
              
              {/* Duplicate set for seamless loop */}
              {marqueeContent.map((announcement, index) => (
                <span key={`second-${index}`} className="inline-flex items-center gap-3 mx-4 text-sm md:text-base font-medium">
                  <span className="text-lg shrink-0">{getTypeIcon(announcement.type)}</span>
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
                    {announcement.type}
                  </span>
                  <span>{announcement.message}</span>
                  <span className="text-white/30 mx-2">{separator}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main>
        <Hero /> 
        <Stats/>
        <About/>
        <Academics/>
        <Facilities/>
        <Admissions/>
        <Testimonials/>
        <Newsletter/>
        <Contact/>
      </main>
      <Footer />
      <BacktoTop />

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </>
  );
};

export default Home;