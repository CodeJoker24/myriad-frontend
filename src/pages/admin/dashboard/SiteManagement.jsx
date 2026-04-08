import { useState, useEffect} from 'react';
import { FaImage, FaInfoCircle, FaChartBar, FaQuoteRight, FaEnvelope, FaSave, FaPlus, FaTrash, FaCamera, FaClipboardList, FaSpinner} from 'react-icons/fa';
import { supabase } from '../../../db';
import Swal from 'sweetalert2';
import imageCompression from "browser-image-compression";
export const SiteManagement = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [hero, setHero] = useState({ 
    title: '',
    subtitle: '',
    button_enroll_text: '',
    button_explore_text: '',
    image_url: ''
  });

  const menuItems = [
    { id: 'hero', name: 'Hero Header', icon: <FaImage /> },
    { id: 'about', name: 'About Mission', icon: <FaInfoCircle /> },
    { id: 'stats', name: 'School Stats', icon: <FaChartBar /> },
    { id: 'testimonials', name: 'Testimonials', icon: <FaQuoteRight /> },
    { id: 'contact', name: 'Contact & Socials', icon: <FaEnvelope /> },
    { id: 'admissions', name: 'Admissions', icon: <FaClipboardList /> },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50/50 -m-6">
      
      <div className="w-full md:w-72 bg-[#1e293b] text-white p-6 shadow-xl z-20">
        <div className="mb-10 px-2">
          <h2 className="text-xl font-bold tracking-tight">Site Management</h2>
          <p className="text-slate-400 text-xs mt-1">Landing Page Controller</p>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 translate-x-2'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
      </div>

      
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          
          <div className="flex justify-between items-end mb-8 border-b pb-6 border-gray-200">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 capitalize">{activeTab} Section</h1>
              <p className="text-slate-500 mt-1">Live updates for your landing page components.</p>
            </div>
          </div>

         
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'hero' && <HeroUI />}
            {activeTab === 'about' && <AboutUI />}
            {activeTab === 'stats' && <StatsUI />}
            {activeTab === 'testimonials' && <TestimonialsUI />}
            {activeTab === 'contact' && <ContactUI />}
            {activeTab === 'admissions' && <AdmissionsUI />}
          </div>  
        </div>
      </div>
    </div>
  );
};


const HeroUI = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hero, setHero] = useState({
    title: '',
    subtitle: '',
    button_enroll_text: '',
    button_explore_text: '',
    image_url: ''
  });

  
  useEffect(() => {
    const fetchHero = async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from('landing_hero')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data) setHero(data);
      setFetching(false);
    };
    fetchHero();
  }, []);

  
 const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

    
      const options = {
        maxSizeMB: 1,           
        maxWidthOrHeight: 1920, 
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);
      
    
      const filePath = `hero_main_static.png`; 

      const { error: uploadError } = await supabase.storage
        .from('site-content')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('site-content')
        .getPublicUrl(filePath);

      const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      setHero(prev => ({...prev, image_url: finalUrl}));
      Swal.fire('Updated!', 'New image is ready. Save to make it live.', 'success');

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('landing_hero')
      .upsert({ 
        id: 1, 
        ...hero,
        updated_at: new Date() 
      });

    setLoading(false);
    if (!error) {
      Swal.fire('Live!', 'Hero section has been updated.', 'success');
    } else {
      Swal.fire('Error', error.message, 'error');
    }
  };

  if (fetching) return <div className="text-center p-10 font-bold text-slate-400">Loading Hero Data...</div>;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Form Side */}
      <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">Main Headline</label>
            <textarea 
              rows="3" 
              value={hero.title}
              onChange={(e) => setHero({...hero, title: e.target.value})}
              className="w-full mt-2 p-4 bg-gray-50 border-none rounded-2xl text-xl font-semibold focus:ring-2 focus:ring-primary/20 outline-none" 
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">Sub-headline</label>
            <textarea 
              rows="3" 
              value={hero.subtitle}
              onChange={(e) => setHero({...hero, subtitle: e.target.value})}
              className="w-full mt-2 p-4 bg-gray-50 border-none rounded-2xl text-slate-600 focus:ring-2 focus:ring-primary/20 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="text" 
              value={hero.button_enroll_text}
              onChange={(e) => setHero({...hero, button_enroll_text: e.target.value})}
              placeholder="Enroll Button Text"
              className="p-3 bg-gray-50 border-none rounded-xl outline-none" 
            />
            <input 
              type="text" 
              value={hero.button_explore_text}
              onChange={(e) => setHero({...hero, button_explore_text: e.target.value})}
              placeholder="Explore Button Text"
              className="p-3 bg-gray-50 border-none rounded-xl outline-none" 
            />
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
        >
          {loading ? 'Processing...' : <><FaSave /> Save Hero Changes</>}
        </button>
      </div>

    
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit">
        <label className="text-sm font-bold text-slate-700 block mb-4">Hero Image</label>
        <div 
          onClick={() => document.getElementById('hero-upload').click()}
          className="relative group rounded-2xl overflow-hidden aspect-video bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-primary cursor-pointer transition-all"
        >
          {hero.image_url ? (
            <img src={hero.image_url} className="w-full h-full object-cover" alt="Preview" />
          ) : (
            <div className="text-center text-slate-400">
              <FaCamera className="mx-auto text-2xl mb-2" />
              <p className="text-xs">Click to upload image</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
            Change Image
          </div>
        </div>
        <input 
          id="hero-upload"
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageUpload} 
        />
        <p className="mt-4 text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
          Recommended: 1920x1080
        </p>
      </div>
    </div>
  );
};


const StatsUI = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    students_count: 0,
    courses_count: 0,
    teachers_count: 0,
    years_count: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('landing_stats')
        .select('*')
        .eq('id', 1)
        .single();
      if (data) setStats(data);
    };
    fetchStats();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('landing_stats')
      .upsert({ id: 1, ...stats });
    
    setLoading(false);
    if (!error) Swal.fire('Updated!', 'Statistics are now live.', 'success');
    else Swal.fire('Error', error.message, 'error');
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Happy Students', key: 'students_count' },
          { label: 'Courses Offered', key: 'courses_count' },
          { label: 'Qualified Teachers', key: 'teachers_count' },
          { label: 'Years of Excellence', key: 'years_count' }
        ].map((item) => (
          <div key={item.key} className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-100">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              {item.label}
            </label>
            <input 
              type="number" 
              value={stats[item.key]}
              onChange={(e) => setStats({...stats, [item.key]: parseInt(e.target.value) || 0})}
              className="text-3xl font-bold text-primary bg-transparent text-center w-full focus:outline-none" 
            />
          </div>
        ))}
      </div>
      <button 
        onClick={handleSave}
        disabled={loading}
        className="mt-8 flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
      >
        {loading ? 'Saving...' : <><FaSave /> Update Live Counters</>}
      </button>
    </div>
  );
};

const TestimonialsUI = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: '', content: '', rating: 5 });

  const fetchTestimonials = async () => {
    const { data } = await supabase.from('landing_testimonials').select('*').order('created_at', { ascending: false });
    if (data) setList(data);
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('landing_testimonials').insert([formData]);
    setLoading(false);
    if (!error) {
      setFormData({ name: '', role: '', content: '', rating: 5 });
      fetchTestimonials();
      Swal.fire('Added!', 'Testimonial joined the list.', 'success');
    }
  };

 const handleDelete = async (id) => {
  const confirm = await Swal.fire({
    title: 'Delete this testimonial?',
    text: "This action cannot be undone.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it'
  });

  if (!confirm.isConfirmed) return;

  try {
    setLoading(true);

    const { error } = await supabase
      .from('landing_testimonials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchTestimonials();

    Swal.fire('Deleted!', 'Testimonial has been removed.', 'success');

  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="space-y-6">
     
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <input type="text" placeholder="Parent Name" className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          <input type="text" placeholder="Role (e.g. Parent)" className="w-full p-3 bg-gray-50 rounded-xl outline-none" 
            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
        </div>
        <textarea placeholder="Feedback content..." className="w-full p-3 bg-gray-50 rounded-xl outline-none" rows="3"
          value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} required />
        <button type="submit" disabled={loading} className="md:col-span-2 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
          <FaPlus /> {loading ? 'Adding...' : 'Add Testimonial'}
        </button>
      </form>

   
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
            <h4 className="font-bold text-slate-800">{item.name}</h4>
            <p className="text-xs text-primary font-semibold mb-2">{item.role}</p>
            <p className="text-sm text-slate-500 italic">"{item.content}"</p>
            <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <FaTrash size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


const ContactUI = () => {
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState({
    email: '', phone: '', phone_2: '', address: '',
    hours_mon_thu: '', hours_fri: '', hours_sat: '',
    map_embed_url: ''
  });

  useEffect(() => {
    const fetchContact = async () => {
      const { data } = await supabase.from('landing_contact').select('*').eq('id', 1).single();
      if (data) {
        setContact({
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

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('landing_contact').upsert({ id: 1, ...contact });
    setLoading(false);
    if (!error) Swal.fire('Updated!', 'Contact & Hours are now live.', 'success');
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
      <div className="grid md:grid-cols-2 gap-10">
        
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">Communication & Address</h3>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone 1 (Primary)</label>
            <input type="text" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 rounded-xl outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone 2 (Secondary)</label>
            <input type="text" value={contact.phone_2} onChange={e => setContact({...contact, phone_2: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 rounded-xl outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <input type="email" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 rounded-xl outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
            <textarea value={contact.address} onChange={e => setContact({...contact, address: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 rounded-xl outline-none" rows="2" />
          </div>
        </div>

      
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">School Hours</h3>
          <div className="p-4 bg-blue-50/50 rounded-2xl space-y-3">
            <div>
              <label className="text-[10px] font-bold text-primary uppercase">Monday - Thursday</label>
              <input type="text" value={contact.hours_mon_thu} onChange={e => setContact({...contact, hours_mon_thu: e.target.value})} className="w-full mt-1 p-2 bg-white rounded-lg outline-none border border-blue-100" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-primary uppercase">Friday</label>
              <input type="text" value={contact.hours_fri} onChange={e => setContact({...contact, hours_fri: e.target.value})} className="w-full mt-1 p-2 bg-white rounded-lg outline-none border border-blue-100" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-primary uppercase">Saturday</label>
              <input type="text" value={contact.hours_sat} onChange={e => setContact({...contact, hours_sat: e.target.value})} className="w-full mt-1 p-2 bg-white rounded-lg outline-none border border-blue-100" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google Maps Embed URL</label>
            <input type="text" value={contact.map_embed_url} onChange={e => setContact({...contact, map_embed_url: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 rounded-xl outline-none" />
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform">
        {loading ? 'Saving...' : 'Save All Contact Details'}
      </button>
    </div>
  );
};

const AdmissionsUI = () => {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ 
    open: '', 
    early: '', 
    regular: '', 
    begin: '' 
  });

  useEffect(() => {
    fetchCurrentDates();
  }, []);

  const fetchCurrentDates = async () => {
    const { data } = await supabase
      .from('admission_dates')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setDates({
        open: data.applications_open || '',
        early: data.early_deadline || '',
        regular: data.regular_deadline || '',
        begin: data.classes_begin || ''
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('admission_dates')
      .upsert({
        id: 1,
        applications_open: dates.open,
        early_deadline: dates.early,
        regular_deadline: dates.regular,
        classes_begin: dates.begin,
        updated_at: new Date()
      });

    setLoading(false);

    if (!error) {
      Swal.fire({
        title: 'Success!',
        text: 'Admission dates updated on the live site.',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });
    } else {
      Swal.fire('Error', `Update failed: ${error.message}`, 'error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <FaClipboardList className="text-xl" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Admission Deadlines</h3>
          <p className="text-xs text-slate-500">Update the dates shown in the Admissions section.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Applications Open', id: 'open' },
          { label: 'Early Deadline', id: 'early' },
          { label: 'Regular Deadline', id: 'regular' },
          { label: 'Classes Begin', id: 'begin' },
        ].map((date) => (
          <div key={date.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">
              {date.label}
            </label>
            <input 
              type="text" 
              value={dates[date.id]}
              onChange={(e) => setDates({ ...dates, [date.id]: e.target.value })}
              placeholder="TBD"
              className="w-full bg-transparent font-bold text-slate-700 focus:outline-none" 
            />
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleSave}
        disabled={loading}
        className="mt-8 w-full md:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
      >
        {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} 
        Save Important Dates
      </button>
    </div>
  );
};


const AboutUI = () => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState({
    about_text_1: '',
    about_text_2: '',
    mission_text: '',
    vision_text: '',
    image_url: '' 
  });

  useEffect(() => {
    const fetchAbout = async () => {
      const { data } = await supabase.from('about_content').select('*').eq('id', 1).single();
      if (data) setContent(data);
    };
    fetchAbout();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('about_content').upsert({ id: 1, ...content });
    setLoading(false);
    if (!error) Swal.fire('Success', 'About content updated!', 'success');
  };

const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      
      const options = {
        maxSizeMB: 0.8,         
        maxWidthOrHeight: 1200, 
        useWebWorker: true,
      };
      
      const compressedFile = await imageCompression(file, options);

     
      const filePath = `about_section_static.png`; 

      const { error: uploadError } = await supabase.storage
        .from('site-content')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('site-content')
        .getPublicUrl(filePath);

      const finalUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

      setContent(prev => ({ ...prev, image_url: finalUrl }));   
      
      Swal.fire('Optimized!', 'New image compressed and ready.', 'success');

    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <h3 className="text-xl font-bold text-slate-800">Edit About Page</h3>
      
      {/* --- NEW IMAGE SECTION --- */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">About Image</label>
        <div className="mt-2 flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm bg-white shrink-0">
            <img 
              src={content.image_url || "/api/placeholder/400/320"} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <label className="flex-1 cursor-pointer">
            <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-center hover:bg-slate-50 transition-colors">
              <span className="text-sm font-bold text-slate-600">
                {loading ? 'Processing...' : 'Change Photo'}
              </span>
            </div>
            <input 
              type="file" 
              className="hidden" 
              onChange={handleImageUpload} 
              disabled={loading}
              accept="image/*"
            />
          </label>
        </div>
      </div>

      {/* --- TEXT SECTION --- */}
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase">About Paragraph 1</label>
          <textarea 
            value={content.about_text_1} 
            onChange={e => setContent({...content, about_text_1: e.target.value})}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-25"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase">About Paragraph 2</label>
          <textarea 
            value={content.about_text_2} 
            onChange={e => setContent({...content, about_text_2: e.target.value})}
            className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-25"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Our Mission</label>
            <textarea 
              value={content.mission_text} 
              onChange={e => setContent({...content, mission_text: e.target.value})}
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-20"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase">Our Vision</label>
            <textarea 
              value={content.vision_text} 
              onChange={e => setContent({...content, vision_text: e.target.value})}
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-100 rounded-xl min-h-20"
            />
          </div>
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={loading} 
        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
      >
        {loading ? 'Please wait...' : 'Save All Changes'}
      </button>
    </div>
  );
};