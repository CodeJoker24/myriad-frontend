import { useState, useEffect } from 'react';
import { 
  FaClipboardList, 
  FaFileSignature, 
  FaClipboardCheck, 
  FaEnvelopeOpenText,
  FaArrowRight,
  FaSpinner
} from 'react-icons/fa';

const Admissions = () => {
  const [importantDates, setImportantDates] = useState({
    applicationsOpen: null,
    earlyDeadline: null,
    regularDeadline: null,
    classesBegin: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImportantDates = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setImportantDates({
            applicationsOpen: null,
            earlyDeadline: null,
            regularDeadline: null,
            classesBegin: null
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching important dates:', error);
        setLoading(false);
      }
    };

    fetchImportantDates();
  }, []);

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
    if (!date) return 'TBD';
    return date;
  };

  return (
    <section id="admissions" className="section bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Admissions Process
          </h2>
          <p className="text-gray-600">
            Join our community of learners and innovators through our straightforward admissions process. 
            We're here to guide you every step of the way.
          </p>
        </div>

        <div className="hidden md:block relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 transform -translate-y-1/2" />
          
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {step.id}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-shadow mt-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
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

        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-md max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Begin Your Journey?</h3>
            <p className="text-gray-600 mb-6">
              Start your application today or contact our admissions office for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-md">
                Apply Now <FaArrowRight className="inline ml-2" />
              </button>
              <button className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all">
                Contact Admissions
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Important Dates</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-2 text-gray-600">Loading dates...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-sm text-gray-500">Applications Open</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.applicationsOpen)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-sm text-gray-500">Early Deadline</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.earlyDeadline)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-sm text-gray-500">Regular Deadline</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.regularDeadline)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-sm text-gray-500">Classes Begin</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.classesBegin)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Admissions;