import { useState, useEffect } from 'react';
import { supabase } from '../db';
import { FaClipboardList, FaFileSignature, FaClipboardCheck, FaEnvelopeOpenText, FaArrowRight, FaSpinner } from 'react-icons/fa';

const Admissions = () => {
  const [importantDates, setImportantDates] = useState({
    applicationsOpen: 'TBD',
    earlyDeadline: 'TBD',
    regularDeadline: 'TBD',
    classesBegin: 'TBD'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImportantDates = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('admission_dates')
          .select('*')
          .eq('id', 1)
          .single();

        if (data) {
          setImportantDates({
            applicationsOpen: data.applications_open ?? 'TBD',
            earlyDeadline: data.early_deadline ?? 'TBD',
            regularDeadline: data.regular_deadline ?? 'TBD',
            classesBegin: data.classes_begin ?? 'TBD'
          });
        }
      } catch (error) {
        console.error('Error fetching important dates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImportantDates();
  }, []);

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      const headerOffset = 80;
      const elementPosition = contactSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToAdmissions = () => {
    const admissionsSection = document.getElementById('admissions');
    if (admissionsSection) {
      const headerOffset = 80;
      const elementPosition = admissionsSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const steps = [
    {
      id: 1,
      icon: <FaEnvelopeOpenText className="text-2xl" />,
      title: 'Initial Inquiry',
      description: 'Submit an online inquiry form or schedule a physical tour to experience our environment firsthand.',
    },
    {
      id: 2,
      icon: <FaFileSignature className="text-2xl" />,
      title: 'Application',
      description: 'Complete our online application and submit required documents including academic records.',
    },
    {
      id: 3,
      icon: <FaClipboardCheck className="text-2xl" />,
      title: 'Assessment',
      description: 'Students participate in age-appropriate assessments to ensure proper placement.',
    },
    {
      id: 4,
      icon: <FaClipboardList className="text-2xl" />,
      title: 'Admission Decision',
      description: 'Receive your admission decision and welcome package within hours of assessment.',
    }
  ];

  const formatDate = (date) => {
    if (!date || date === 'null') return 'TBD';
    return date;
  };

  return (
    <section id="admissions" className="section bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Admissions Process
          </h2>
          <p className="text-gray-600">
            Join our community of learners and innovators through our straightforward admissions process. 
            We're here to guide you every step of the way.
          </p>
        </div>

        {/* Desktop Steps */}
        <div className="hidden md:block relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 transform -translate-y-1/2" />
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {step.id}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all mt-8 text-center group">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Steps */}
        <div className="md:hidden space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="flex gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  {step.icon}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {step.id}
                </div>
              </div>
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-md max-w-3xl mx-auto border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin Your Journey?</h3>
            <p className="text-gray-600 mb-6">
              Start your application today or contact our admissions office for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={scrollToContact}
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-md"
              >
                Apply Now <FaArrowRight className="inline ml-2" />
              </button>
              <button 
                onClick={scrollToContact}
                className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all"
              >
                Contact Admissions
              </button>
            </div>
          </div>
        </div>

        {/* Important Dates Section */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Important Dates</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-2 text-gray-600">Loading dates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Applications Open', value: importantDates.applicationsOpen },
                { label: 'Early Deadline', value: importantDates.earlyDeadline },
                { label: 'Regular Deadline', value: importantDates.regularDeadline },
                { label: 'Classes Begin', value: importantDates.classesBegin }
              ].map((date, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-50">
                  <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">{date.label}</div>
                  <div className="font-bold text-primary text-lg">
                    {formatDate(date.value)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Admissions;