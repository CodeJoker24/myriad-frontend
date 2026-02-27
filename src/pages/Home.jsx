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


const Home = () => {
  return (
    <>
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
};

export default Home;