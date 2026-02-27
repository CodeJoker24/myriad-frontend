import { useState } from 'react';
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock,FaPaperPlane,FaCheckCircle,FaTimesCircle,FaSpinner} from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
    

      
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatus('success');
      setMessage(`Thank you, ${formData.name}! Your message has been received. We'll respond within 2 business days.`);
      setFormData({ name: '', email: '', subject: '', message: '' });

      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);

    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-xl" />,
      title: 'Our Location',
      details: ['Omoloye Oke-ore Along', 'Owode Idiroko Rd', 'Ogun State, Nigeria'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FaPhoneAlt className="text-xl" />,
      title: 'Contact Info',
      details: ['08034791741', '08038005822', 'myriadacademy1022@gmail.com'],
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <FaClock className="text-xl" />,
      title: 'School Hours',
      details: ['Monday - Thursday: 8:00 AM - 4:00 PM', 'Friday: 9:00 AM - 12:00 PM', 'Weekends: Closed'],
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section id="contact" className="section bg-white relative overflow-hidden">
    
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
       
        <div className="section-header text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get In <span className="text-gradient">Touch</span>
          </h2>
          <p className="text-gray-600">
            We'd love to hear from you. Reach out with any questions or to schedule a visit.
          </p>
        </div>

        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-fade-in-up delay-${index * 100}`}
            >
            
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${info.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                {info.icon}
              </div>

              
              <h3 className="text-xl font-bold mb-3">{info.title}</h3>

              
              <div className="space-y-2">
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-600 text-sm">
                    {detail}
                  </p>
                ))}
              </div>

            
              <div className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${info.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
            </div>
          ))}
        </div>

       
        <div className="max-w-3xl mx-auto">
          
          {status === 'success' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-xl flex-shrink-0" />
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <FaTimesCircle className="text-red-500 text-xl flex-shrink-0" />
              <p className="text-red-700">{message}</p>
            </div>
          )}

         
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="John Doe"
                  disabled={status === 'loading'}
                />
              </div>

            
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  placeholder="john@example.com"
                  disabled={status === 'loading'}
                />
              </div>
            </div>

           
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                Subject *
              </label>
              <select
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition bg-white"
                disabled={status === 'loading'}
              >
                <option value="">Select a subject</option>
                <option value="admissions">Admissions Inquiry</option>
                <option value="tour">Schedule a Tour</option>
                <option value="employment">Employment Opportunities</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                Your Message *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition resize-none"
                placeholder="Type your message here..."
                disabled={status === 'loading'}
              />
            </div>

          
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg hover:-translate-y-1"
            >
              {status === 'loading' ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message <FaPaperPlane />
                </>
              )}
            </button>

        
            <p className="text-center text-sm text-gray-500 mt-4">
              * Required fields. We'll respond within 2 business days.
            </p>
          </form>

         
          <div className="mt-8 bg-gray-100 rounded-2xl h-64 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FaMapMarkerAlt className="text-4xl text-primary mx-auto mb-2" />
                <p className="text-gray-600">Interactive Map Coming Soon</p>
                <p className="text-sm text-gray-500">Omoloye Oke-ore Along, Owode Idiroko Rd, Ogun State</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;