
import { useState } from 'react';
import { FaEnvelope, FaPaperPlane, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setStatus('success');
      setMessage(`Thank you for subscribing with ${email}! You'll receive our next newsletter soon.`);
      setEmail('');
      
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
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <FaEnvelope className="text-3xl" />
            </div>
          </div>

          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Connected with Myriad Academy
          </h3>
          
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for the latest news, events, and educational insights 
            delivered straight to your inbox.
          </p>

          {status === 'success' && (
            <div className="mb-6 bg-green-500/20 border border-green-300/30 rounded-lg p-4 flex items-center gap-3">
              <FaCheckCircle className="text-green-300 text-xl flex-shrink-0" />
              <p className="text-white">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 bg-red-500/20 border border-red-300/30 rounded-lg p-4 flex items-center gap-3">
              <FaTimesCircle className="text-red-300 text-xl flex-shrink-0" />
              <p className="text-white">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-12 pr-4 py-4 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                disabled={status === 'loading'}
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
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

          <p className="text-sm text-white/70 mt-6">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;