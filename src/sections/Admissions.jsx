import { useState, useEffect } from 'react';
import { FaClipboardList, FaFileSignature, FaClipboardCheck, FaEnvelopeOpenText, FaArrowRight,FaSpinner} from 'react-icons/fa';

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
      color: 'from-blue-500 to-cyan-500',
      delay: '0'
    },
    {
      id: 2,
      icon: <FaFileSignature className="text-2xl" />,
      title: 'Application',
      description: 'Complete our online application and submit required documents including academic records.',
      color: 'from-green-500 to-emerald-500',
      delay: '100'
    },
    {
      id: 3,
      icon: <FaClipboardCheck className="text-2xl" />,
      title: 'Assessment',
      description: 'Students participate in age-appropriate assessments to ensure proper placement.',
      color: 'from-orange-500 to-red-500',
      delay: '200'
    },
    {
      id: 4,
      icon: <FaClipboardList className="text-2xl" />,
      title: 'Admission Decision',
      description: 'Receive your admission decision and welcome package within hours of assessment.',
      color: 'from-purple-500 to-pink-500',
      delay: '300'
    }
  ];

  
  const formatDate = (date) => {
    if (!date) return 'TBD';
    return date;
  };

  return (
    <section id="admissions" className="section bg-light relative overflow-hidden">
    
      <div className="absolute inset-0 opacity-20" 
           style={{
             backgroundImage: 'radial-gradient(circle at 1px 1px, #2563eb 1px, transparent 0)',
             backgroundSize: '40px 40px'
           }} 
      />

      <div className="container mx-auto px-4 relative z-10">
      
        <div className="section-header text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Admissions <span className="text-gradient">Process</span>
          </h2>
          <p className="text-gray-600">
            Join our community of learners and innovators through our straightforward admissions process. 
            We're here to guide you every step of the way.
          </p>
        </div>

       
        <div className="hidden md:block relative">
        
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/30 via-primary to-secondary/30 transform -translate-y-1/2" />
          
          
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step) => (
              <div key={step.id} className={`relative animate-fade-in-up delay-${step.delay}`}>
                
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-lg`}>
                    {step.id}
                  </div>
                </div>

               
                <div className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2 mt-8 text-center">
                 
                  <div className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  
               
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>

                  
                  <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br ${step.color} border-4 border-white`} />
                </div>
              </div>
            ))}
          </div>
        </div>

       
        <div className="md:hidden space-y-6">
          {steps.map((step, index) => (
            <div key={step.id} className={`relative animate-fade-in-up delay-${step.delay}`}>
             
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-primary to-secondary" />
              )}
              
              <div className="flex gap-4">
                
                <div className="relative">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center shadow-lg z-10 relative`}>
                    {step.icon}
                  </div>
               
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                    {step.id}
                  </div>
                </div>

               
                <div className="flex-1 bg-white rounded-2xl p-4 shadow-soft">
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-soft max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Begin Your Journey?</h3>
            <p className="text-gray-600 mb-6">
              Start your application today or contact our admissions office for personalized assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/#contact" 
                className="inline-flex items-center gap-2 border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-all"
              >
                Contact Admissions
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-center mb-6">Important Dates</h3>
          
          {loading ? (
            
            <div className="flex justify-center items-center py-8">
              <FaSpinner className="animate-spin text-primary text-2xl" />
              <span className="ml-2 text-gray-600">Loading dates...</span>
            </div>
          ) : (
          
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white transition-colors">
                <div className="text-sm text-gray-500">Applications Open</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.applicationsOpen)}
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white transition-colors">
                <div className="text-sm text-gray-500">Early Deadline</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.earlyDeadline)}
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white transition-colors">
                <div className="text-sm text-gray-500">Regular Deadline</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.regularDeadline)}
                </div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white transition-colors">
                <div className="text-sm text-gray-500">Classes Begin</div>
                <div className="font-bold text-primary text-lg">
                  {formatDate(importantDates.classesBegin)}
                </div>
              </div>
            </div>
          )}

          
          {false && (
            <div className="text-center mt-4 text-sm text-gray-400">
              <FaArrowRight className="inline mr-1" /> 
              Admin can update these dates from dashboard
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Admissions;