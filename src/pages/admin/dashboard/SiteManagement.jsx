import { useState } from 'react';
import { FaImage, FaSave, FaEdit, FaTrash, FaPlus, FaGlobe, FaInfoCircle, FaBullseye, FaEye, FaNewspaper,FaQuoteRight, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';

export const SiteManagement = () => {
const [activeTab, setActiveTab] = useState('homepage');

  // State for homepage carousel
  const [carouselImages, setCarouselImages] = useState([
    { id: 1, url: '/images/hero1.jpg', title: 'Welcome to Myriad Academy', active: true },
    { id: 2, url: '/images/hero2.jpg', title: 'Excellence in Education', active: false },
    { id: 3, url: '/images/hero3.jpg', title: 'Future Leaders', active: false },
  ]);

  // State for about us content
  const [aboutContent, setAboutContent] = useState({
    title: 'About Myriad Academy',
    content: 'Founded with a vision to revolutionize education, Myriad Academy has been at the forefront of academic innovation since our establishment. We believe in nurturing not just academic excellence but also character, creativity, and critical thinking.',
    mission: 'To empower students with knowledge, skills, and values that prepare them for lifelong success in an ever-changing world.',
    vision: 'To be recognized as a premier institution that transforms education through innovation, inclusion, and inspiration.',
    missionIcon: <FaBullseye />,
    visionIcon: <FaEye />
  });

  // State for announcements
  const [announcements, setAnnouncements] = useState([
    { id: 1, title: 'School Resumption Date', content: 'School resumes on September 15th, 2024', date: '2024-08-01', pinned: true },
    { id: 2, title: 'PTA Meeting', content: 'PTA meeting holds on August 20th at 10am', date: '2024-08-05', pinned: false },
  ]);

  // State for testimonials
  const [testimonials, setTestimonials] = useState([
    { id: 1, name: 'Mrs. Adebayo', role: 'Parent', content: 'Myriad Academy has transformed my child\'s approach to learning.', rating: 5, image: '' },
    { id: 2, name: 'Mr. Johnson', role: 'Parent', content: 'The teachers are dedicated and the curriculum is excellent.', rating: 5, image: '' },
  ]);

  // State for contact info
  const [contactInfo, setContactInfo] = useState({
    address: 'Omoloye Oke-ore Along, Owode Idiroko Rd, Ogun State, Nigeria',
    phone1: '08034791741',
    phone2: '08038005822',
    email: 'myriadacademy1022@gmail.com',
    hours: 'Monday - Thursday: 8:00 AM - 4:00 PM, Friday: 9:00 AM - 12:00 PM, Weekends: Closed',
    facebook: 'https://facebook.com/myriadacademy',
    twitter: 'https://twitter.com/myriadacademy',
    instagram: 'https://instagram.com/myriadacademy',
    linkedin: 'https://linkedin.com/school/myriad-academy'
  });

  // State for editing
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState('');

  const tabs = [
    { id: 'homepage', name: 'Homepage Images', icon: <FaImage /> },
    { id: 'about', name: 'About Us', icon: <FaInfoCircle /> },
    { id: 'announcements', name: 'Announcements', icon: <FaNewspaper /> },
    { id: 'testimonials', name: 'Testimonials', icon: <FaQuoteRight /> },
    { id: 'contact', name: 'Contact Info', icon: <FaGlobe /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Site Management</h1>
        <p className="text-gray-600">Manage your website content and appearance</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="border-b overflow-x-auto">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Homepage Images Tab */}
        {activeTab === 'homepage' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Homepage Carousel Images</h2>
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                <FaPlus /> Add Image
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carouselImages.map((image) => (
                <div key={image.id} className="border rounded-lg overflow-hidden">
                  <div className="h-40 bg-gray-200 flex items-center justify-center">
                    {image.url ? (
                      <img src={image.url} alt={image.title} className="w-full h-full object-cover" />
                    ) : (
                      <FaImage className="text-4xl text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <input
                      type="text"
                      value={image.title}
                      className="w-full px-3 py-2 border rounded-lg mb-2"
                      placeholder="Image title"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={image.active} className="text-primary" />
                        <span className="text-sm">Active</span>
                      </label>
                      <div className="flex gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <FaEdit />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About Us Tab */}
        {activeTab === 'about' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-6">About Us Content</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Title</label>
                <input
                  type="text"
                  value={aboutContent.title}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Content</label>
                <textarea
                  value={aboutContent.content}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
                <textarea
                  value={aboutContent.mission}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vision Statement</label>
                <textarea
                  value={aboutContent.vision}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                />
              </div>

              <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Announcements</h2>
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                <FaPlus /> New Announcement
              </button>
            </div>

            <div className="space-y-4">
              {announcements.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.content}</p>
                      <p className="text-xs text-gray-400 mt-2">Posted: {item.date}</p>
                    </div>
                    <div className="flex gap-2">
                      {item.pinned && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Pinned</span>}
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <FaEdit />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials Tab */}
        {activeTab === 'testimonials' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Testimonials</h2>
              <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                <FaPlus /> Add Testimonial
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <FaQuoteRight className="text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">"{item.content}"</p>
                  <div className="flex justify-between items-center">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <FaEdit />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Info Tab */}
        {activeTab === 'contact' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-6">Contact Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute left-3 top-4 text-gray-400" />
                    <textarea
                      value={contactInfo.address}
                      rows="3"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number 1</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={contactInfo.phone1}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number 2</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={contactInfo.phone2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="email"
                      value={contactInfo.email}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Hours</label>
                  <div className="relative">
                    <FaClock className="absolute left-3 top-4 text-gray-400" />
                    <textarea
                      value={contactInfo.hours}
                      rows="3"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                  <input
                    type="text"
                    value={contactInfo.facebook}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
                  <input
                    type="text"
                    value={contactInfo.twitter}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                  <input
                    type="text"
                    value={contactInfo.instagram}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn URL</label>
                  <input
                    type="text"
                    value={contactInfo.linkedin}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors">
                <FaSave /> Save Contact Information
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
