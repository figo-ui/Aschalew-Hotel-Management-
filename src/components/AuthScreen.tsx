import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { 
  LogIn, Sparkles, User, ShieldAlert, Coffee, Mail, Lock, 
  UserPlus, Eye, EyeOff, ShieldCheck, MapPin, Calendar, 
  Users, Utensils, Award, Info, ChevronRight, X, Phone, 
  Send, Compass, Check, Filter, Image, Star, BedDouble, HelpCircle
} from 'lucide-react';
import GoogleMapsSection from './GoogleMapsSection.tsx';
import ThemeLanguageSelector from './ThemeLanguageSelector.tsx';
import { useLanguageTheme } from './LanguageThemeContext.tsx';
import { Room } from '../types.ts';

const aschalewLogo = "/src/assets/images/aschalew_logo_1784369029928.jpg";

interface AuthScreenProps {
  onAuthSuccess: (token: string, userDetails: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  rooms?: Room[];
}

export default function AuthScreen({ onAuthSuccess, isLoading, setIsLoading, rooms = [] }: AuthScreenProps) {
  const { language, theme, isDarkMode, t, themeColors } = useLanguageTheme();
  
  // Auth Modal Controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState<string | null>(null);
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [registerAsAdmin, setRegisterAsAdmin] = useState(false);

  // Landing Booking State
  const [searchCheckIn, setSearchCheckIn] = useState(new Date().toISOString().split('T')[0]);
  const [searchCheckOut, setSearchCheckOut] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [searchGuests, setSearchGuests] = useState('1');
  const [searchRoomType, setSearchRoomType] = useState('all');
  const [bookingPromptMessage, setBookingPromptMessage] = useState<string | null>(null);

  // Room Grid Filter States
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<string>('all');
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  // Selected Room representation for reservation intent
  const [intentRoom, setIntentRoom] = useState<Room | null>(null);

  // WhatsApp Concierge Chat Widget State
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      sender: 'concierge',
      text: "Salam! Welcome to Aschalew International Guest Service. 🌿 How can we assist you with your upcoming journey to Chiro (Asbe Teferi) or coffee bookings today?",
      time: '08:00 AM'
    }
  ]);

  // Safe fallback list of rooms if database has no records yet
  const fallbackRooms: Room[] = [
    {
      id: 101,
      roomNumber: '101',
      type: 'standard',
      price: 1500,
      status: 'available',
      amenities: 'High-speed Wi-Fi, Fresh Linens, Flat Screen TV, Desk, Shower, Local tea',
      imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 202,
      roomNumber: '202',
      type: 'deluxe',
      price: 2400,
      status: 'available',
      amenities: 'Scenic Balcony, High-speed Wi-Fi, Coffee Maker, Chercher Mountain view, Smart TV, Premium Lounge',
      imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 303,
      roomNumber: '303',
      type: 'executive',
      price: 3500,
      status: 'available',
      amenities: 'Living Room area, Hot Tub, Mini Bar, Fresh Chiro Highland coffee, Private Concierge access, Scenic Balcony',
      imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 404,
      roomNumber: '404',
      type: 'family',
      price: 4500,
      status: 'available',
      amenities: 'Panoramic 360 view balcony, Living Room, Luxury Dining Area, Fully stocked mini-fridge, Steam shower, Free airport shuttle',
      imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600'
    }
  ];

  // Active rooms to display
  const displayRooms = rooms.length > 0 ? rooms : fallbackRooms;

  // Real Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Backend failed to synchronize user session profile');
      }
      
      const dbUser = await response.json();
      onAuthSuccess(token, dbUser);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const isIframe = window.self !== window.top;
      if (err.code === 'auth/popup-closed-by-user') {
        if (isIframe) {
          setError(
            "Google Sign-In popup was closed. Because this app is running in an iframe inside AI Studio, " +
            "browsers block authentication popups by default. Please click 'Open in New Tab' (top right), " +
            "or sign in instantly using the 'Instant Demo Gateways' or 'Email & Password' below."
          );
        } else {
          setError("Google Sign-In popup was closed before completion. Please try again.");
        }
      } else if (err.code === 'auth/popup-blocked') {
        setError("Google Sign-In popup was blocked by your browser. Please allow popups, or use Demo portals.");
      } else {
        setError(err.message || 'Authentication with Google failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign-In
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Backend failed to sync user session');
      }
      
      const dbUser = await response.json();
      onAuthSuccess(token, dbUser);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign-Up
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: fullName });
      const token = await result.user.getIdToken();
      
      const syncResponse = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!syncResponse.ok) {
        throw new Error('Backend database synchronization failed');
      }
      
      let dbUser = await syncResponse.json();

      if (registerAsAdmin) {
        const roleResponse = await fetch('/api/users/role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ role: 'admin' })
        });
        if (roleResponse.ok) {
          dbUser = await roleResponse.json();
        }
      }
      
      onAuthSuccess(token, dbUser);
    } catch (err: any) {
      console.error('Email Sign-Up Error:', err);
      setError(err.code === 'auth/email-already-in-use' ? 'This email address is already in use.' : 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo Sign-In
  const handleDemoSignIn = async (role: 'guest' | 'admin') => {
    setIsLoading(true);
    setError(null);
    try {
      const demoToken = `demo-${role}-token`;
      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${demoToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to start demo session on server.');
      }
      
      const dbUser = await response.json();
      onAuthSuccess(demoToken, dbUser);
    } catch (err: any) {
      console.error('Demo Sign-In Error:', err);
      setError(err.message || 'Demo initialization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // WhatsApp chatbot answer generation
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const promptText = chatInput.toLowerCase();
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Thank you for reaching out! Our reception desk has received your note. Please log in or book directly above to finalize your priority reservation.";
      
      if (promptText.includes('coffee') || promptText.includes('buna')) {
        reply = "☕ You are asking about Chiro's world-famous coffee! We source organic cherries directly from our family farm in the Chercher hills. We hold daily traditional coffee ceremonies at 4:00 PM for all registered guests.";
      } else if (promptText.includes('mountain') || promptText.includes('hike') || promptText.includes('tour')) {
        reply = "⛰️ Chiro is the gateway to the stunning Chercher range. We offer fully escorted hiking tours, coffee estate farm tours, and cultural bajaj excursions around town. All can be booked in our guest hub!";
      } else if (promptText.includes('price') || promptText.includes('rate') || promptText.includes('how much')) {
        reply = "💳 Our rates start at 1,500 ETB per night for standard rooms, up to 4,500 ETB for the Presidential Chercher Suite. All reservations include organic buffet breakfast, fiber Wi-Fi, and secured guarded parking.";
      } else if (promptText.includes('wifi') || promptText.includes('internet')) {
        reply = "📶 Yes! We have dedicated, high-speed fiber internet (100+ Mbps) covering the entire hotel, restaurant, and lobby area.";
      } else if (promptText.includes('contact') || promptText.includes('phone') || promptText.includes('number')) {
        reply = "📞 You can reach our front desk directly at +251 25 551 0122 or email our concierge at info@aschalewhotel.com.";
      }

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'concierge',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1200);
  };

  // Room filtration logic
  const filteredRooms = displayRooms.filter(room => {
    if (filterType !== 'all' && !room.type.toLowerCase().includes(filterType.toLowerCase())) return false;
    
    if (filterPrice !== 'all') {
      if (filterPrice === 'under2000' && room.price >= 2000) return false;
      if (filterPrice === '2000to3000' && (room.price < 2000 || room.price > 3000)) return false;
      if (filterPrice === 'over3000' && room.price <= 3000) return false;
    }

    if (filterAmenities.length > 0) {
      const roomAmenities = (room.amenities || '').toLowerCase();
      const matchAll = filterAmenities.every(amenity => roomAmenities.includes(amenity.toLowerCase()));
      if (!matchAll) return false;
    }

    return true;
  });

  const handleBookingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingPromptMessage(`We have found rooms matching your criteria for ${searchGuests} Guest(s) from ${searchCheckIn} to ${searchCheckOut}! Please Sign In to instantly confirm.`);
    setIsAuthModalOpen(true);
  };

  const triggerReserveIntent = (room: Room) => {
    setIntentRoom(room);
    setBookingPromptMessage(`You have selected Room #${room.roomNumber} (${room.type} - ${room.price} ETB/night). Please sign in to lock in your reservation dates.`);
    setIsAuthModalOpen(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#faf8f5] text-stone-900'} font-sans relative flex flex-col transition-colors duration-200`}>
      {/* Dynamic Selector floating background */}
      <ThemeLanguageSelector />

      {/* LUXURY LANDING NAVBAR */}
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-zinc-950/80 border-zinc-900' : 'bg-[#faf8f5]/80 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className={`w-11 h-11 rounded-xl overflow-hidden border ${themeColors.primaryBorder} p-0.5 bg-zinc-900 transition-transform group-hover:scale-105`}>
              <img 
                src={aschalewLogo} 
                alt="Aschalew Hotel Logo" 
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className={`font-display font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradientText} block`}>
                ASCHALEW INTERNATIONAL
              </span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block -mt-0.5">
                Hotel &amp; Resort • Chiro
              </span>
            </div>
          </a>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#home" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Home</a>
            <a href="#rooms" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Suites</a>
            <a href="#dining" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Dining</a>
            <a href="#experiences" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Experiences</a>
            <a href="#about" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Our Story</a>
            <a href="#contact" className="text-xs font-bold uppercase tracking-wider hover:text-[#D4AF37] transition">Contact</a>
          </nav>

          {/* Action Call */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setBookingPromptMessage(null);
                setIsAuthModalOpen(true);
              }}
              className={`px-4 py-2.5 rounded-xl ${themeColors.primaryBg} ${themeColors.primaryHover} text-zinc-950 font-bold text-xs transition duration-200 shadow-md ${themeColors.primaryGlow} cursor-pointer`}
            >
              Portal Login
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-6 overflow-hidden pt-12">
        {/* Background Image with warm filter */}
        <div 
          className="absolute inset-0 bg-cover bg-center scale-100 transition-transform duration-1000"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1920')`,
            filter: isDarkMode ? 'brightness(0.3) contrast(1.05)' : 'brightness(0.4) contrast(1.02)'
          }} 
        />
        
        {/* Soft Earthy Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006400]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            The Sanctuary of West Hararghe
          </span>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
            Legendary Warmth <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-amber-200">
              Earthy Luxury
            </span>
          </h1>

          <p className="text-zinc-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Experience premium five-star accommodation nestled at the foot of Mount Chercher. Enjoy breathtaking mountain panoramas, handcrafted regional hospitality, and our iconic organic highland coffee.
          </p>

          {/* Integrated Dynamic Booking Widget */}
          <div className="pt-6">
            <form 
              onSubmit={handleBookingSearch}
              className="bg-zinc-900/90 border border-zinc-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-3 text-left"
            >
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#D4AF37]" /> Check In
                </label>
                <input 
                  type="date"
                  value={searchCheckIn}
                  onChange={(e) => setSearchCheckIn(e.target.value)}
                  className="w-full bg-zinc-950 text-xs text-zinc-100 rounded-xl p-2.5 border border-zinc-800 focus:outline-none focus:border-[#D4AF37] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-400 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#D4AF37]" /> Check Out
                </label>
                <input 
                  type="date"
                  value={searchCheckOut}
                  onChange={(e) => setSearchCheckOut(e.target.value)}
                  className="w-full bg-zinc-950 text-xs text-zinc-100 rounded-xl p-2.5 border border-zinc-800 focus:outline-none focus:border-[#D4AF37] transition"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-zinc-400 font-mono flex items-center gap-1">
                  <Users className="w-3 h-3 text-[#D4AF37]" /> Guests
                </label>
                <select
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  className="w-full bg-zinc-950 text-xs text-zinc-100 rounded-xl p-2.5 border border-zinc-800 focus:outline-none focus:border-[#D4AF37] transition"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="3">3 Guests</option>
                  <option value="4">4+ Guests</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#bfa032] text-zinc-950 font-bold text-xs rounded-xl shadow-lg hover:scale-[1.02] transition cursor-pointer flex items-center justify-center gap-1.5 h-[38px]"
                >
                  <Compass className="w-3.5 h-3.5" /> Book Now
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Floating Quick Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 pt-8 border-t border-zinc-850 w-full">
          <div className="flex items-center justify-center gap-2.5">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-300">5-Star Mountain Suites</span>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <Coffee className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-300">Organic Coffee Farms</span>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <Utensils className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-300">Traditional Harar Dining</span>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-[10px] sm:text-xs font-bold text-zinc-300">Guarded 24/7 Security</span>
          </div>
        </div>
      </section>

      {/* ROOMS & SUITES SECTION */}
      <section id="rooms" className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] block mb-2 font-mono">
              Luxury Accommodation
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
              Earthy Modern Rooms &amp; Suites
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1 max-w-xl">
              Impeccably tailored rooms designed with natural textures and modern architectural precision. Select your preferred mountain sanctuary.
            </p>
          </div>

          {/* Interactive Filtering Tabs */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`p-2.5 text-xs font-bold rounded-lg border focus:outline-none transition ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-stone-200 text-stone-700'
              }`}
            >
              <option value="all">All Room Types</option>
              <option value="Standard">Standard Suite</option>
              <option value="Deluxe">Deluxe Mountain View</option>
              <option value="Executive">Executive King</option>
              <option value="Presidential">Presidential</option>
            </select>

            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className={`p-2.5 text-xs font-bold rounded-lg border focus:outline-none transition ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-stone-200 text-stone-700'
              }`}
            >
              <option value="all">All Price Ranges</option>
              <option value="under2000">Under 2,000 ETB</option>
              <option value="2000to3000">2,000 to 3,000 ETB</option>
              <option value="over3000">Over 3,000 ETB</option>
            </select>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRooms.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-500 italic text-xs">
              No rooms matching the selected criteria are available. Please adjust filters.
            </div>
          ) : (
            filteredRooms.map((room) => {
              // Select beautiful custom imagery based on room type
              let imgUrl = "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600";
              if (room.type.toLowerCase().includes('deluxe')) {
                imgUrl = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600";
              } else if (room.type.toLowerCase().includes('executive')) {
                imgUrl = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600";
              } else if (room.type.toLowerCase().includes('presidential')) {
                imgUrl = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600";
              }

              return (
                <div 
                  key={room.id}
                  className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group transition duration-300 ${
                    isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-[#D4AF37]/50' : 'bg-white border-stone-200 hover:border-[#D4AF37]/80'
                  }`}
                >
                  <div>
                    {/* Room Photo */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={imgUrl} 
                        alt={room.type} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-zinc-950/80 text-white border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        Room {room.roomNumber}
                      </span>
                    </div>

                    {/* Room Details */}
                    <div className="p-5 space-y-2">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-sm tracking-tight">{room.type}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono">Max Capacity: 2 Guests</span>
                      </div>
                      
                      {/* Amenities Icons Row */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {room.amenities.split(',').slice(0, 3).map((amenity, i) => (
                          <span 
                            key={i}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                              isDarkMode ? 'bg-zinc-900 text-zinc-400' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {amenity.trim()}
                          </span>
                        ))}
                      </div>

                      <p className={`text-[11px] line-clamp-2 ${isDarkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                        {room.amenities}
                      </p>
                    </div>
                  </div>

                  {/* Pricing and Booking Actions */}
                  <div className={`p-5 pt-0 mt-auto border-t flex justify-between items-center ${
                    isDarkMode ? 'border-zinc-800/60' : 'border-stone-100'
                  }`}>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Per Night</span>
                      <span className="text-sm font-black text-[#D4AF37]">{room.price.toLocaleString()} ETB</span>
                    </div>

                    <button
                      onClick={() => triggerReserveIntent(room)}
                      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isDarkMode ? 'bg-zinc-800 hover:bg-[#D4AF37] hover:text-zinc-950 text-zinc-200' : 'bg-stone-100 hover:bg-[#D4AF37] hover:text-zinc-950 text-stone-800'
                      }`}
                    >
                      <span>Reserve</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* DINING & SERVICES HUB */}
      <section id="dining" className={`py-24 border-t border-b transition-colors ${
        isDarkMode ? 'bg-zinc-900/20 border-zinc-900' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] font-mono">
              Earthy Gourmet &amp; Wellness
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mt-1">
              Dining &amp; Luxury Hospitality Services
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm mt-1">
              Indulge in 24/7 world-class dining, regional coffee tastings, and wellness experiences right on our property.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Bento block 1: Coffee & Cafe (7 Cols) */}
            <div className={`lg:col-span-7 border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between items-center overflow-hidden transition-transform hover:-translate-y-1 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#D4AF37]">
                  <Coffee className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black tracking-tight">The Highlands Organic Café</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We source raw single-origin highland cherries directly from family growers in the Chercher Mountains. Roasted in-house daily, experience authentic Ethiopian coffee ceremonies every afternoon.
                </p>
                <div className="flex gap-2.5">
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[#D4AF37] text-[10px] font-mono font-bold rounded-lg">
                    100% Organic Arabica
                  </span>
                  <span className="px-2.5 py-1 bg-[#006400]/20 border border-[#006400]/30 text-emerald-400 text-[10px] font-mono font-bold rounded-lg">
                    Chercher Single-Origin
                  </span>
                </div>
              </div>
              <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden shrink-0 border border-zinc-800">
                <img 
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600" 
                  alt="Highlands Coffee" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Bento block 2: Gara Restaurant (5 Cols) */}
            <div className={`lg:col-span-5 border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-transform hover:-translate-y-1 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#D4AF37]">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Gara Traditional &amp; Continental Restaurant</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our signature restaurant serves 24/7 gourmet menus featuring premium traditional Hararghe recipes (including local organic Beef Tibs and Doro Wat) alongside curated international classics.
                </p>
              </div>
              <div className="h-32 rounded-2xl overflow-hidden border border-zinc-800 mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600" 
                  alt="Hararghe Culinary" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Bento block 3: Wellness (5 Cols) */}
            <div className={`lg:col-span-5 border rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-transform hover:-translate-y-1 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#D4AF37]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Chercher Wellness Spa &amp; Steam</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Relax after your journey with professional massage therapy, therapeutic steam sessions, and regional herbal treatments.
                </p>
              </div>
              <div className="h-32 rounded-2xl overflow-hidden border border-zinc-800 mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=600" 
                  alt="Wellness Spa" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Bento block 4: Events (7 Cols) */}
            <div className={`lg:col-span-7 border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between items-center overflow-hidden transition-transform hover:-translate-y-1 ${
              isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-white border-stone-200 shadow-sm'
            }`}>
              <div className="space-y-4 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#D4AF37]">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Grand Conference &amp; Banquet Hall</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our high-tech executive hall accommodates up to 350 delegates. Perfect for corporate summits, strategic boards, and premium weddings, equipped with redundant fiber internet and high-fidelity sound.
                </p>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1.5"
                >
                  Request Venue Booking Quote <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full md:w-56 h-48 rounded-2xl overflow-hidden shrink-0 border border-zinc-800">
                <img 
                  src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600" 
                  alt="Conference Hall" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY & EXPERIENCES */}
      <section id="experiences" className="py-24 max-w-7xl mx-auto px-6 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] font-mono">
            Explore Chiro (Asbe Teferi)
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mt-1">
            Curated Local Experiences &amp; Tours
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1">
            Discover the beautiful green canopies of Mount Chercher and explore regional attractions with our vetted local guides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Chercher Peaks Trekking",
              desc: "A fully escorted trek up Mount Chercher. Experience lush rainforest environments, organic local honey harvesting, and breathtaking mountain-top scenic photography.",
              image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600",
              duration: "4 - 6 Hours",
              price: "750 ETB"
            },
            {
              title: "Highland Coffee Farm Harvesting",
              desc: "Walk alongside certified generational growers. Harvest fresh coffee cherries, witness natural drying, and celebrate with a fresh estate coffee ceremony.",
              image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600",
              duration: "3 Hours",
              price: "500 ETB"
            },
            {
              title: "Cultural Bajaj City Excursion",
              desc: "Take a scenic ride to central markets. Discover regional Hararghe spices, meet master local hand-weavers, and learn the history of Asbe Teferi.",
              image: "https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&q=80&w=600",
              duration: "2 Hours",
              price: "300 ETB"
            }
          ].map((tour, index) => (
            <div 
              key={index}
              className={`border rounded-2xl overflow-hidden transition duration-300 flex flex-col justify-between group ${
                isDarkMode ? 'bg-zinc-900/30 border-zinc-800 hover:border-[#D4AF37]/50' : 'bg-white border-stone-200 hover:border-[#D4AF37]/80'
              }`}
            >
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img src={tour.image} alt={tour.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase font-mono">
                    {tour.duration}
                  </span>
                </div>
                <div className="p-6 space-y-2">
                  <h4 className="font-bold text-sm tracking-tight">{tour.title}</h4>
                  <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                    {tour.desc}
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0 border-t border-zinc-850/60 mt-4 flex justify-between items-center">
                <span className="text-xs font-bold text-[#D4AF37]">{tour.price} / person</span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[10px] font-bold text-zinc-400 hover:text-[#D4AF37] transition flex items-center gap-1 cursor-pointer"
                >
                  Book Tour <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT US SECTION */}
      <section id="about" className={`py-24 border-t border-b transition-colors ${
        isDarkMode ? 'bg-zinc-900/10 border-zinc-900' : 'bg-stone-50 border-stone-200'
      }`}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] font-mono block">
              Our Legacy &amp; Heritage
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              The Finest Sanctuary in Eastern Ethiopia
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-stone-600'}`}>
              Aschalew International Hotel was founded with a singular, beautiful mission: to combine high-end contemporary comforts with legendary, deep-seated traditional Ethiopian hospitality.
            </p>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-stone-600'}`}>
              Sitting proudly at the foot of Mount Chercher in Chiro (Asbe Teferi), our resort has served as the prestigious gateway for global researchers, agricultural experts, families, and diplomats exploring West Hararghe's rich coffee estates.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-850">
              <div>
                <span className="text-xl font-black text-[#D4AF37] font-mono block">100%</span>
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Organic Coffee Sourcing</span>
              </div>
              <div>
                <span className="text-xl font-black text-[#D4AF37] font-mono block">24/7</span>
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Secure Butler Concierge</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-60 rounded-3xl overflow-hidden border border-zinc-800">
                <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600" alt="Hotel facade" className="w-full h-full object-cover" />
              </div>
              <div className="h-44 rounded-3xl overflow-hidden border border-zinc-800">
                <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600" alt="Hotel bedroom" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="h-44 rounded-3xl overflow-hidden border border-zinc-800">
                <img src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600" alt="Coffee hills" className="w-full h-full object-cover" />
              </div>
              <div className="h-60 rounded-3xl overflow-hidden border border-zinc-800">
                <img src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600" alt="Lobby event" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAPS & EXPERIENCES VERIFIED LOCAL REVIEWS */}
      <div id="contact" className="relative z-10">
        <GoogleMapsSection />
      </div>

      {/* FLOATING WHATSAPP & CONCIERGE SIMULATOR WIDGET */}
      <div className="max-w-7xl mx-auto px-6 w-full py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] font-mono block">
            Direct Concierge Desk
          </span>
          <h3 className="text-xl font-bold">24/7 Priority Support Desk</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Need localized support or a corporate invoice quote? Connect directly with our on-duty front desk using our simulated WhatsApp concierge desk below for immediate automated answers.
          </p>
          <div className="space-y-2 pt-2 text-xs">
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-zinc-400">Front Desk:</span> +251 25 551 0122
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-zinc-400">Email:</span> reservations@aschalewhotel.com
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold text-zinc-400">Address:</span> National Route 4, Chiro, West Hararghe, Ethiopia
            </p>
          </div>
        </div>

        {/* Live Concierge chatbox */}
        <div className={`lg:col-span-7 border rounded-2xl flex flex-col h-[340px] overflow-hidden ${
          isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-stone-200 shadow-lg'
        }`}>
          {/* Box Header */}
          <div className="bg-[#006400] text-white p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h4 className="text-xs font-bold font-mono">Aschalew WhatsApp Assistant</h4>
                <p className="text-[9px] text-emerald-100 font-mono">On-duty Concierge Desk • Online</p>
              </div>
            </div>
            <Coffee className="w-4 h-4 text-[#D4AF37]" />
          </div>

          {/* Messages Body */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3.5 scrollbar-thin text-xs">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div className={`p-3 rounded-2xl leading-normal ${
                  msg.sender === 'user' 
                    ? 'bg-[#006400] text-white rounded-br-none' 
                    : `${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-stone-100 text-stone-800'} rounded-bl-none`
                }`}>
                  <p>{msg.text}</p>
                </div>
                <span className="text-[8px] text-zinc-500 font-mono mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 bg-zinc-950/40 rounded-xl w-16 mr-auto text-zinc-500">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-150" />
              </div>
            )}
          </div>

          {/* Message Input Footer */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-950/40">
            <input 
              type="text"
              placeholder="Ask about coffee, mountain hikes, wifi, rates..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow bg-zinc-950 text-xs text-zinc-200 rounded-xl px-3 py-2 border border-zinc-800 focus:outline-none focus:border-[#D4AF37]"
            />
            <button 
              type="submit"
              className="p-2 bg-[#006400] hover:bg-emerald-800 text-white rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* LANDING PAGE FOOTER */}
      <footer className={`py-12 border-t mt-auto text-center text-xs ${
        isDarkMode ? 'bg-zinc-950 border-zinc-900 text-zinc-500' : 'bg-[#faf8f5] border-stone-200 text-stone-500'
      }`}>
        <p className="font-bold tracking-wider text-[11px] text-zinc-400 font-mono uppercase">
          Aschalew International Hotel &amp; Resort, Chiro
        </p>
        <p className="mt-1">
          Licensed under Ministry of Tourism &amp; Hospitality Ethiopia • West Hararghe Branch
        </p>
        <p className="mt-4 text-[10px]">
          &copy; {new Date().getFullYear()} Aschalew Hotel Group. All rights reserved.
        </p>
      </footer>

      {/* AUTHENTICATION / SIGN IN GLASSMODAL OVERLAY */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsAuthModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-950/40 hover:bg-zinc-800 transition"
                title="Close Portal Login"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Branding inside modal */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className={`w-14 h-14 rounded-2xl overflow-hidden mb-2.5 border ${themeColors.primaryBorder} p-0.5 bg-zinc-950 shadow-md`}>
                  <img 
                    src={aschalewLogo} 
                    alt="Aschalew Hotel Logo" 
                    className="w-full h-full object-cover rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="font-display text-lg font-black text-zinc-100 tracking-tight">
                  {t('portal_title')}
                </h2>
                <p className={`${themeColors.primaryText} text-[10px] font-extrabold uppercase tracking-widest mt-0.5`}>
                  {t('hotel_branding_subtitle')}
                </p>
              </div>

              {/* Informative Booking Context Banner */}
              {bookingPromptMessage && (
                <div className="p-3.5 mb-5 rounded-lg bg-[#006400]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs flex gap-2 items-start">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                  <p>{bookingPromptMessage}</p>
                </div>
              )}

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/60 mb-5">
                <button
                  onClick={() => {
                    setActiveTab('signin');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition relative ${activeTab === 'signin' ? 'text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {activeTab === 'signin' && (
                    <motion.div 
                      layoutId="activeTabGlow"
                      className={`absolute inset-0 ${themeColors.primaryBg} rounded-md`}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5" /> Sign In
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('signup');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition relative ${activeTab === 'signup' ? 'text-zinc-950 font-black' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {activeTab === 'signup' && (
                    <motion.div 
                      layoutId="activeTabGlow"
                      className={`absolute inset-0 ${themeColors.primaryBg} rounded-md`}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" /> Register
                  </span>
                </button>
              </div>

              {/* Error alerts */}
              {error && (
                <div className="p-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex gap-2 items-start">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Credentials login form */}
              <form onSubmit={activeTab === 'signin' ? handleEmailSignIn : handleEmailSignUp} className="space-y-4">
                {activeTab === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 font-mono block">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aschalew Abebe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 text-xs text-zinc-100 rounded-xl pl-9.5 pr-3 py-2.5 outline-none transition"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 font-mono block">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 text-xs text-zinc-100 rounded-xl pl-9.5 pr-3 py-2.5 outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 font-mono block">Password</label>
                    {activeTab === 'signin' && (
                      <button 
                        type="button"
                        onClick={() => setError('Use demo sandbox portals or create a new account to sync.')}
                        className="text-[9px] text-[#D4AF37] hover:underline transition"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 text-xs text-zinc-100 rounded-xl pl-9.5 pr-10 py-2.5 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {activeTab === 'signup' && (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 select-none cursor-pointer hover:bg-zinc-950 transition mt-2">
                    <input 
                      type="checkbox"
                      checked={registerAsAdmin}
                      onChange={(e) => setRegisterAsAdmin(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-900 text-[#D4AF37] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <div className="text-left">
                      <span className="text-[11px] font-bold text-zinc-200 block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Register as Staff / Administrator
                      </span>
                      <span className="text-[9px] text-zinc-500 block">Immediate access to the Property Management Suite (PMS)</span>
                    </div>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-xl ${themeColors.primaryBg} ${themeColors.primaryHover} text-zinc-950 font-bold text-xs transition duration-200 flex items-center justify-center gap-2 mt-4 shadow-lg ${themeColors.primaryGlow} cursor-pointer disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : activeTab === 'signin' ? (
                    <>
                      <LogIn className="w-4 h-4" /> Sign In to Portal
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Register Guest Account
                    </>
                  )}
                </button>
              </form>

              {/* Social Login Sync */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-800/60"></div>
                <span className="flex-shrink mx-3 text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono">
                  Or Google Sign-In
                </span>
                <div className="flex-grow border-t border-zinc-800/60"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs border border-zinc-800 hover:border-zinc-700 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sync Google Account
              </button>

              {/* Instant sandbox review buttons */}
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-zinc-800/60"></div>
                <span className="flex-shrink mx-3 text-zinc-500 text-[9px] font-bold uppercase tracking-wider font-mono">
                  Instant Sandbox Portals
                </span>
                <div className="flex-grow border-t border-zinc-800/60"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDemoSignIn('guest')}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold transition duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span>Demo Guest Hub</span>
                </button>

                <button
                  onClick={() => handleDemoSignIn('admin')}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold transition duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                  <span>Demo Staff PMS</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
