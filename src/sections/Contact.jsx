import { useState, useEffect } from 'react';
import { supabase } from '../db'; 
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaClock, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  
  
  const [liveInfo, setLiveInfo] = useState({
    email: '', phone: '', phone_2: '', address: '',
    hours_mon_thu: '', hours_fri: '', hours_sat: '',
    map_embed_url: ''
  });

  
  useEffect(() => {
    const fetchContact = async () => {
      const { data } = await supabase.from('landing_contact').select('*').eq('id', 1).single();
      if (data) {
        setLiveInfo({
          email: data.email ?? '',
          phone: data.phone ?? '',
          phone_2: data.phone_2 ?? '',
          address: data.address ?? '',
          hours_mon_thu: data.hours_mon_thu ?? '',
          hours_fri: data.hours_fri ?? '',
          hours_sat: data.hours_sat ?? '',
          map_embed_url: data.map_embed_url ?? ''
        });
      }
    };
    fetchContact();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }
    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
      setMessage(`Thank you, ${formData.name}! Your message has been received.`);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000);
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong.');
    }
  };

  
  const contactInfo = [
    {
      icon: <FaMapMarkerAlt className="text-xl" />,
      title: 'Our Location',
      details: [liveInfo.address || 'Loading...'], 
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <FaPhoneAlt className="text-xl" />,
      title: 'Contact Info',
      details: [
        liveInfo.phone, 
        liveInfo.phone_2, 
        liveInfo.email
      ].filter(Boolean), 
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: <FaClock className="text-xl" />,
      title: 'School Hours',
      details: [
        `Mon - Thu: ${liveInfo.hours_mon_thu}`,
        `Friday: ${liveInfo.hours_fri}`,
        `Saturday: ${liveInfo.hours_sat}`
      ],
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <section id="contact" className="section bg-white relative overflow-hidden py-20">
      
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="section-header text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get In <span className="text-blue-600">Touch</span>
          </h2>
          <p className="text-gray-600">We'd love to hear from you. Reach out with any questions.</p>
        </div>

       
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {contactInfo.map((info, index) => (
            <div
              key={index}
              className={`group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden`}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${info.color} text-white flex items-center justify-center mb-4 shadow-lg`}>
                {info.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{info.title}</h3>
              <div className="space-y-2">
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-600 text-sm">{detail}</p>
                ))}
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${info.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          {status === 'success' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-xl" />
              <p className="text-green-700">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-50">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <input type="email" id="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="john@example.com" />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
              <select id="subject" value={formData.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none bg-white">
                <option value="">Select a subject</option>
                <option value="admissions">Admissions Inquiry</option>
                <option value="tour">Schedule a Tour</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Message *</label>
              <textarea id="message" value={formData.message} onChange={handleChange} rows="5" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none resize-none" placeholder="Type here..." />
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg">
              {status === 'loading' ? <FaSpinner className="animate-spin" /> : <>Send Message <FaPaperPlane /></>}
            </button>
          </form>

          
          {liveInfo.map_embed_url && (
            <div className="mt-8 rounded-2xl h-64 overflow-hidden shadow-inner border border-gray-100">
              <iframe 
                src={liveInfo.map_embed_url} 
                className="w-full h-full border-none grayscale hover:grayscale-0 transition-all duration-700"
                loading="lazy"
              ></iframe>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contact;