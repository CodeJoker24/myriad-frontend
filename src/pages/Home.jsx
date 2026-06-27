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


const Home = () => {
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
};

export default Home;