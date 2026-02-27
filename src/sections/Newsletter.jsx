import { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('success');
      setMessage(`Thank you for subscribing with ${email}! You'll receive our next newsletter soon.`);
      setEmail('');
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
      
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
             backgroundSize: '30px 30px'
           }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FaEnvelope className="text-3xl" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Connected with Myriad Academy
          </h3>
          
          {/* Description */}
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest news, events, and educational insights 
            delivered straight to your inbox.
          </p>

          {/* Status Messages */}
          {status === 'success' && (
            <div className="mb-6 bg-green-500/20 border border-green-300/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
              <FaCheckCircle className="text-green-300 text-xl flex-shrink-0" />
              <p className="text-white">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 bg-red-500/20 border border-red-300/30 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
              <FaTimesCircle className="text-red-300 text-xl flex-shrink-0" />
              <p className="text-white">{message}</p>
            </div>
          )}

          {/* Newsletter Form */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/95 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                disabled={status === 'loading'}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 shadow-lg"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  Subscribe <FaPaperPlane />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <p className="text-sm text-white/70 mt-6">
            We respect your privacy. Unsubscribe at any time.
          </p>

          {/* Stats - Optional */}
          <div className="flex justify-center gap-8 mt-12 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full" />
              <span>Weekly updates</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full" />
              <span>No spam</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-300 rounded-full" />
              <span>Unsubscribe anytime</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Avatars - Optional floating elements */}
      <div className="hidden lg:block absolute left-10 bottom-10 opacity-20">
        <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse" />
      </div>
      <div className="hidden lg:block absolute right-10 top-10 opacity-20">
        <div className="w-20 h-20 bg-white/20 rounded-full animate-pulse delay-1000" />
      </div>
    </section>
  );
};

export default Newsletter;