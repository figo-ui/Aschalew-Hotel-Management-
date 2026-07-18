import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, BookingWithDetails, ServiceRequest } from '../types.ts';
import { 
  Calendar, Users, Coffee, BedDouble, UtensilsCrossed, Sparkles, 
  Trash2, Plus, ChevronRight, CheckCircle2, RefreshCw, LogOut, ShieldCheck,
  Compass, Heart, MapPin, Send, MessageSquare, Phone, Info, Eye, Image,
  Filter, Check, Star, ShieldAlert, Award, Clock
} from 'lucide-react';
import { useLanguageTheme } from './LanguageThemeContext.tsx';
import FAQSection from './FAQSection.tsx';
import GoogleMapsSection from './GoogleMapsSection.tsx';
import HeroSection from './HeroSection.tsx';

interface GuestViewProps {
  token: string;
  user: any;
  rooms: Room[];
  onLogout: () => void;
  onToggleRole: () => void;
}

type GuestTab = 'home' | 'rooms' | 'reservations' | 'dining' | 'experiences' | 'about' | 'contact' | 'bookings';

export default function GuestView({ token, user, rooms, onLogout, onToggleRole }: GuestViewProps) {
  const { language, theme, t, themeColors } = useLanguageTheme();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<GuestTab>('home');
  
  // Modals & States
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [active360Room, setActive360Room] = useState<Room | null>(null);
  const [panoramicOffset, setPanoramicOffset] = useState<number>(30); // for 360 virtual slider
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  
  // Database bookings
  const [myBookings, setMyBookings] = useState<BookingWithDetails[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guestsCount: 1,
    guestName: user.displayName || 'Chiro Traveler',
    guestEmail: user.email || '',
    notes: '',
  });

  // Services Hub Form State
  const [serviceRequestForm, setServiceRequestForm] = useState({
    bookingId: 0,
    type: 'room_service' as 'room_service' | 'housekeeping' | 'maintenance',
    item: 'Chiro Organic Espresso',
    quantity: 1,
    cost: 150,
  });
  
  const [activeServiceRequests, setActiveServiceRequests] = useState<Record<number, ServiceRequest[]>>({});
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State for Rooms & Suites
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<string>('all');
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  // Simulated WhatsApp chat states
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: '1',
      sender: 'concierge',
      text: 'Salam! Welcome to Aschalew International Concierge. 🌿 How can we assist you with your upcoming journey to Chiro (Asbe Teferi) today?',
      time: '06:06 AM'
    }
  ]);

  // Simulated booking alerts
  const [serviceBookingSuccess, setServiceBookingSuccess] = useState<string | null>(null);

  // Prepopulate form if a room is pre-selected
  useEffect(() => {
    if (selectedRoom) {
      setBookingForm(prev => ({ ...prev, roomId: selectedRoom.id.toString() }));
    }
  }, [selectedRoom]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const response = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMyBookings(data);
        // Fetch service requests for each booking
        data.forEach((b: BookingWithDetails) => {
          fetchServices(b.booking.id);
        });
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchServices = async (bookingId: number) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/services`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActiveServiceRequests(prev => ({ ...prev, [bookingId]: data }));
      }
    } catch (err) {
      console.error(`Error fetching services for booking ${bookingId}:`, err);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRoomId = selectedRoom?.id || parseInt(bookingForm.roomId);
    if (!targetRoomId) {
      setError('Please select a room first');
      return;
    }
    
    setIsSubmittingBooking(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: targetRoomId,
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
          guestsCount: bookingForm.guestsCount,
          guestName: bookingForm.guestName,
          guestEmail: bookingForm.guestEmail,
          notes: bookingForm.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking. This room may be reserved during these dates.');
      }

      await response.json();
      setSelectedRoom(null);
      setActiveTab('bookings');
      fetchBookings();
      // Reset scroll
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingService(true);
    try {
      const response = await fetch(`/api/bookings/${serviceRequestForm.bookingId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: serviceRequestForm.type,
          item: serviceRequestForm.item,
          quantity: serviceRequestForm.quantity,
          cost: serviceRequestForm.cost,
        }),
      });

      if (response.ok) {
        fetchServices(serviceRequestForm.bookingId);
        setServiceRequestForm(prev => ({ ...prev, bookingId: 0 }));
      }
    } catch (err) {
      console.error('Failed to submit service request:', err);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const selectServiceType = (type: 'room_service' | 'housekeeping' | 'maintenance') => {
    let item = 'Chiro Organic Espresso';
    let cost = 120;
    if (type === 'housekeeping') {
      item = 'Fresh Linens & Towels';
      cost = 0;
    } else if (type === 'maintenance') {
      item = 'AC or Hot Water Check';
      cost = 0;
    }
    setServiceRequestForm(prev => ({ ...prev, type, item, cost }));
  };

  // WhatsApp chat handler
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
      let reply = "Thank you for reaching out! Our reception desk has received your note and will prepare everything for your stay.";
      
      if (promptText.includes('coffee') || promptText.includes('buna')) {
        reply = "☕ You are asking about Chiro's world-famous coffee! We source single-origin organic beans directly from farmers in the Chercher hills. We hold live coffee ceremonies every afternoon in our Highlands lounge!";
      } else if (promptText.includes('mountain') || promptText.includes('hike') || promptText.includes('tour')) {
        reply = "⛰️ Chiro sits at the base of the majestic Chercher Mountains! We organize guided hiking tours and mountain safaris complete with transportation, security, and organic refreshments.";
      } else if (promptText.includes('wifi') || promptText.includes('internet')) {
        reply = "📶 Yes! We have dedicated, redundant fiber optic high-speed internet (over 100 Mbps) across the entire resort. Perfect for working or streaming high-definition media.";
      } else if (promptText.includes('food') || promptText.includes('dinner') || promptText.includes('restaurant')) {
        reply = "🍽️ Our signature Gara Restaurant is open 24/7. We serve delicious traditional Hararghe recipes (Doro Wat, Kitfo, fresh Beef Tibs) and high-quality international favorites.";
      } else if (promptText.includes('rate') || promptText.includes('price') || promptText.includes('discount')) {
        reply = "💳 Our rates start at 1,500 ETB per night for standard suites up to 4,200 ETB for luxury executive suites. Full gourmet buffet breakfast, internet, and secure parking are always 100% free.";
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

  // Pre-book table / spa handler
  const handlePreBookService = (serviceName: string) => {
    setServiceBookingSuccess(`Your booking request for ${serviceName} has been received and confirmed under Guest Account: ${user.displayName || user.email}! We will prepare a personalized table/slot for you.`);
    setTimeout(() => setServiceBookingSuccess(null), 6000);
  };

  // Rooms filtering logic
  const filteredRooms = rooms.filter(room => {
    if (filterType !== 'all' && room.type !== filterType) return false;
    
    if (filterPrice !== 'all') {
      if (filterPrice === 'under2000' && room.price >= 2000) return false;
      if (filterPrice === '2000to3000' && (room.price < 2000 || room.price > 3000)) return false;
      if (filterPrice === 'over3000' && room.price <= 3000) return false;
    }

    if (filterAmenities.length > 0) {
      const roomAmenities = (room.amenities || '').toLowerCase();
      const matchAll = filterAmenities.every(amenity => roomAmenities.includes(amenity));
      if (!matchAll) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16 flex flex-col justify-between">
      
      {/* Header bar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/60 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <button 
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3 cursor-pointer text-left focus:outline-none"
          >
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
              <Compass className={`w-6 h-6 ${themeColors.primaryText}`} />
            </div>
            <div>
              <span className={`font-display font-black text-lg sm:text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradientText}`}>
                ASCHALEW HOTEL
              </span>
              <span className="block text-[9px] uppercase tracking-wider font-mono text-zinc-500">West Hararghe Sanctuary</span>
            </div>
          </button>
          
          <div className="flex items-center gap-4">
            {/* Quick role-switch */}
            <button
              onClick={onToggleRole}
              className={`hidden sm:flex px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-xs ${themeColors.primaryText} border ${themeColors.primaryBorder} font-bold items-center gap-1.5 transition cursor-pointer`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('toggle_admin')}
            </button>

            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
              <img 
                src={user.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-zinc-700"
              />
              <span className="hidden md:inline text-xs text-zinc-400 font-semibold">{user.displayName || user.email}</span>
              <button 
                onClick={onLogout}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
                title={t('logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="w-full flex-grow">
        
        {/* Navigation Tabs bar */}
        <div className="border-b border-zinc-900 bg-zinc-950 sticky top-20 z-20 overflow-x-auto scrollbar-hide py-3">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-start gap-1 sm:gap-2 min-w-max">
            {[
              { id: 'home', label: 'Home', icon: Compass },
              { id: 'rooms', label: 'Rooms & Suites', icon: BedDouble },
              { id: 'reservations', label: 'Book Now', icon: Calendar },
              { id: 'dining', label: 'Dining & Wellness', icon: UtensilsCrossed },
              { id: 'experiences', label: 'Local Tours', icon: MapPin },
              { id: 'about', label: 'Our Story', icon: Info },
              { id: 'contact', label: 'Location & Chat', icon: MessageSquare },
              { id: 'bookings', label: 'My Bookings', icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as GuestTab); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                    isActive 
                      ? `${themeColors.primaryBg} text-zinc-950 font-bold shadow-lg ${themeColors.primaryGlow}` 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.id === 'bookings' && myBookings.length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-900 text-amber-400'} font-bold`}>
                      {myBookings.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Alerts */}
        {serviceBookingSuccess && (
          <div className="max-w-7xl mx-auto px-6 mt-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 shadow"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{serviceBookingSuccess}</span>
            </motion.div>
          </div>
        )}

        {/* Tab Contents */}
        <div className="max-w-7xl mx-auto px-6 mt-6 pb-12">
          
          {/* TAB 1: HOME */}
          {activeTab === 'home' && (
            <div className="space-y-12">
              <HeroSection onExploreClick={() => setActiveTab('rooms')} />

              {/* Booking Quick Widget on Top */}
              <div className="relative -mt-16 sm:-mt-20 z-10 max-w-4xl mx-auto">
                <div className="bg-zinc-900/95 border border-zinc-800/80 p-6 rounded-2xl shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs uppercase tracking-widest font-mono text-zinc-400 font-bold">Integrated Instant Booking Engine</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">Check-In</label>
                      <input 
                        type="date" 
                        value={bookingForm.checkIn}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">Check-Out</label>
                      <input 
                        type="date" 
                        value={bookingForm.checkOut}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">Guests Count</label>
                      <select 
                        value={bookingForm.guestsCount}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, guestsCount: parseInt(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">Select Room</label>
                      <select 
                        value={bookingForm.roomId}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, roomId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Choose Suite...</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.type.toUpperCase()} Suite - {r.price} ETB</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button 
                        onClick={() => {
                          if (!bookingForm.roomId) {
                            setActiveTab('rooms');
                          } else {
                            const foundRoom = rooms.find(r => r.id === parseInt(bookingForm.roomId));
                            if (foundRoom) {
                              setSelectedRoom(foundRoom);
                            }
                          }
                        }}
                        className={`w-full py-3.5 rounded-xl ${themeColors.primaryBg} ${themeColors.primaryHover} text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transition`}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Hotel Highlights Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg">Legendary Coffee Tradition</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Enjoy our live coffee roasting ceremonies presenting premium single-origin Arabica beans sourced directly from Hararghe highlands.
                  </p>
                </div>
                <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <BedDouble className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg">Earthy Modern Sanctuary</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Designed with gorgeous natural oak, locally woven linen textiles, and state-of-the-art technological amenities in the mountain valley.
                  </p>
                </div>
                <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-lg">Curated Mountain Treks</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Explore mist-shrouded peaks of Mount Chercher or traditional organic farms with our highly trained local guides.
                  </p>
                </div>
              </div>

              {/* Google Reviews teaser section */}
              <FAQSection />
            </div>
          )}

          {/* TAB 2: ROOMS & SUITES */}
          {activeTab === 'rooms' && (
            <div className="space-y-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <BedDouble className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Our Luxury Accommodations
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Luxurious suites framed by natural wood interiors and spectacular highland views of Mount Chercher.
                </p>
              </div>

              {/* Filters Panel */}
              <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  <Filter className="w-4 h-4 text-amber-500" />
                  Filter Rooms Directory
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Filter Type */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 font-mono">Suite Category</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'standard', 'deluxe', 'executive', 'family'].map(t => (
                        <button
                          key={t}
                          onClick={() => setFilterType(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs capitalize transition ${
                            filterType === t 
                              ? 'bg-amber-500 text-zinc-950 font-bold' 
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Price */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 font-mono">Nightly Price (ETB)</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'all', label: 'All prices' },
                        { code: 'under2000', label: '< 2,000 ETB' },
                        { code: '2000to3000', label: '2k - 3k ETB' },
                        { code: 'over3000', label: '> 3,000 ETB' },
                      ].map(p => (
                        <button
                          key={p.code}
                          onClick={() => setFilterPrice(p.code)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition ${
                            filterPrice === p.code 
                              ? 'bg-amber-500 text-zinc-950 font-bold' 
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Amenities */}
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-bold mb-1.5 font-mono">Specific features</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { code: 'wi-fi', label: 'Fiber Wi-Fi' },
                        { code: 'coffee', label: 'Espresso Maker' },
                        { code: 'view', label: 'Mountain View' },
                        { code: 'double', label: 'Double Bed' },
                      ].map(a => {
                        const isSelected = filterAmenities.includes(a.code);
                        return (
                          <button
                            key={a.code}
                            onClick={() => {
                              setFilterAmenities(prev => 
                                isSelected ? prev.filter(item => item !== a.code) : [...prev, a.code]
                              );
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' 
                                : 'bg-zinc-950 text-zinc-500 border border-zinc-800 hover:text-zinc-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {a.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRooms.map((room) => (
                  <motion.div 
                    key={room.id}
                    layout
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-amber-500/20 transition duration-300 flex flex-col h-full"
                  >
                    <div className="relative h-56 overflow-hidden bg-zinc-950 group">
                      <img 
                        src={room.imageUrl || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800'} 
                        alt={room.type} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-4 right-4 px-3 py-1 bg-zinc-950/90 border border-zinc-800 rounded text-xs font-mono font-bold uppercase text-amber-400">
                        Room {room.roomNumber}
                      </div>
                      <div className="absolute bottom-4 left-4 flex gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur border border-zinc-800/50 text-[10px] text-zinc-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> Free Breakfast
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-display font-black text-xl text-zinc-100 capitalize tracking-tight">
                          {room.type} Suite
                        </h3>
                        <div className="text-right">
                          <span className="text-amber-400 font-extrabold text-xl font-mono">{room.price}</span>
                          <span className="text-zinc-500 text-[10px] block font-semibold uppercase tracking-wider">ETB / Night</span>
                        </div>
                      </div>

                      <p className="text-zinc-400 text-xs leading-relaxed mb-6 flex-grow font-sans">
                        {room.amenities || 'Features complimentary organic coffee maker, climate-control cooling, spacious modern desk, high-definition satellite TV, and customized natural cosmetics.'}
                      </p>

                      <div className="pt-4 border-t border-zinc-800 flex items-center gap-2">
                        {/* 360 virtual button */}
                        <button
                          onClick={() => {
                            setActive360Room(room);
                            setPanoramicOffset(30);
                          }}
                          className="px-3 py-2 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          360° View
                        </button>

                        <button 
                          onClick={() => setSelectedRoom(room)}
                          disabled={room.status !== 'available'}
                          className={`flex-grow px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition ${
                            room.status === 'available' 
                              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 cursor-pointer shadow-md' 
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          }`}
                        >
                          {room.status === 'available' ? 'Book Suite' : 'Reserved'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RESERVATIONS / BOOK NOW WITH REAL-TIME CALENDAR */}
          {activeTab === 'reservations' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <Calendar className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Direct Booking Engine
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Select available check-in/out days on our real-time calendar registry to secure your luxury suite immediately.
                </p>
              </div>

              {/* Real-time calendar grid */}
              <div className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Calendar Matrix */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-display font-extrabold text-base text-zinc-100 uppercase tracking-wider">July 2026</span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Season</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-zinc-500 uppercase font-black mb-2">
                      <span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {/* July 1st is Wednesday, so no padding needed for start */}
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = i + 1;
                        const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
                        
                        // Custom status simulation
                        const isToday = day === 18;
                        const isBooked = [2, 3, 10, 11, 24, 25, 31].includes(day);
                        const isSelectedCheckIn = bookingForm.checkIn === dateStr;
                        const isSelectedCheckOut = bookingForm.checkOut === dateStr;
                        const isInRange = dateStr > bookingForm.checkIn && dateStr < bookingForm.checkOut;

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isBooked}
                            onClick={() => {
                              if (!bookingForm.checkIn || (bookingForm.checkIn && bookingForm.checkOut)) {
                                setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
                              } else if (dateStr > bookingForm.checkIn) {
                                setBookingForm(prev => ({ ...prev, checkOut: dateStr }));
                              } else {
                                setBookingForm(prev => ({ ...prev, checkIn: dateStr, checkOut: '' }));
                              }
                            }}
                            className={`h-11 rounded-lg flex flex-col items-center justify-center relative cursor-pointer font-mono text-xs border transition ${
                              isBooked 
                                ? 'bg-zinc-950/40 border-zinc-900/60 text-zinc-600 cursor-not-allowed' 
                                : isSelectedCheckIn || isSelectedCheckOut
                                ? 'bg-amber-500 border-amber-400 text-zinc-950 font-black scale-105 shadow-md shadow-amber-500/20'
                                : isInRange
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100'
                            }`}
                          >
                            <span className="font-extrabold">{day}</span>
                            
                            {isToday && !isSelectedCheckIn && !isSelectedCheckOut && (
                              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500" />
                            )}
                            
                            <span className="text-[7px] font-semibold mt-0.5 scale-90">
                              {isBooked ? 'SOLD' : isSelectedCheckIn ? 'IN' : isSelectedCheckOut ? 'OUT' : 'OK'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-zinc-850/60 text-[10px] font-mono text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                        <span>Selected Stay</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-zinc-800 inline-block" />
                        <span>Available Night</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded bg-zinc-950/40 border border-zinc-900/60 inline-block" />
                        <span>Booked Out</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  {/* Form Submission parameters */}
                  <form onSubmit={handleBookingSubmit} className="w-full md:w-80 shrink-0 space-y-4 border-t md:border-t-0 md:border-l border-zinc-850/60 pt-6 md:pt-0 md:pl-6">
                    <h3 className="text-xs uppercase tracking-widest font-mono text-zinc-400 font-bold">Reservation Profile</h3>
                    
                    {error && (
                      <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Stay Dates</label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-zinc-950 p-2 border border-zinc-800 rounded">
                          <span className="text-[8px] text-zinc-600 block">Check-In</span>
                          <span className="text-zinc-200 font-semibold">{bookingForm.checkIn || 'YYYY-MM-DD'}</span>
                        </div>
                        <div className="bg-zinc-950 p-2 border border-zinc-800 rounded">
                          <span className="text-[8px] text-zinc-600 block">Check-Out</span>
                          <span className="text-zinc-200 font-semibold">{bookingForm.checkOut || 'YYYY-MM-DD'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Inventory selection</label>
                      <select 
                        value={bookingForm.roomId}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, roomId: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:border-amber-500 focus:outline-none"
                        required
                      >
                        <option value="">-- Choose Vacant Suite --</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.type.toUpperCase()} Suite - RM {r.roomNumber} ({r.price} ETB)</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Guests</label>
                        <select 
                          value={bookingForm.guestsCount}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, guestsCount: parseInt(e.target.value) }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-sm text-zinc-200 focus:outline-none"
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={bookingForm.guestName}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, guestName: e.target.value }))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                          placeholder="Guest Name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Email</label>
                      <input 
                        type="email" 
                        value={bookingForm.guestEmail}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-500"
                        placeholder="guest@mail.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Requests</label>
                      <textarea 
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 h-12 resize-none"
                        placeholder="Early check-in requests, special dietary needs..."
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingBooking || !bookingForm.roomId || !bookingForm.checkIn || !bookingForm.checkOut}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 transition"
                    >
                      {isSubmittingBooking ? 'Reserving...' : 'Instant Secure Booking'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DINING & SERVICES */}
          {activeTab === 'dining' && (
            <div className="space-y-12">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <UtensilsCrossed className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Dining, Wellness &amp; Conveniences
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Savor organic harvests and premium therapeutic rest in our modern hotel amenities.
                </p>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Gara Restaurant */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800" 
                      alt="Gara Restaurant" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-zinc-950 text-[10px] font-bold font-mono rounded">
                      Open 24 Hours
                    </span>
                    <h3 className="absolute bottom-4 left-4 font-display font-bold text-xl text-white">Gara Signature Restaurant</h3>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Savor world-class culinary masterpieces under the starlight! We specialize in premium West Hararghe prime beef cuts, traditional spicy Doro Wat chicken stew, sizzling Tibs, and authentic gourmet Italian selections.
                    </p>
                    
                    {/* Embedded interactive menu */}
                    <div className="border-t border-zinc-850 pt-4">
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-2">Featured Culinary Selection</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-300">
                          <span>🥩 Prime Chercher Beef Tenderloin steak</span>
                          <span className="font-bold text-amber-400">420 ETB</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>🍗 Traditional Spicy Doro Wat with Injera</span>
                          <span className="font-bold text-amber-400">320 ETB</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>🌱 Vegan Habesha Combo Platter</span>
                          <span className="font-bold text-amber-400">220 ETB</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handlePreBookService('Gara Restaurant Table')}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Pre-Book Dinner Table
                    </button>
                  </div>
                </div>

                {/* 2. Highlands Café */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=800" 
                      alt="Highlands Café" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-amber-500 text-zinc-950 text-[10px] font-bold font-mono rounded">
                      Traditional Ceremony
                    </span>
                    <h3 className="absolute bottom-4 left-4 font-display font-bold text-xl text-white">Chercher Highlands Coffee Lounge</h3>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Chiro yields some of Ethiopia's highest quality single-origin highlands coffee. Enjoy professional barista macchiatos, fresh pastries, or join our live aromatic Buna roasting ceremonies on our mountain view terrace.
                    </p>

                    <div className="border-t border-zinc-850 pt-4">
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block mb-2">Our Coffee Rituals</span>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-300">
                          <span>☕ Live-Roasted Buna Ceremony (Traditional)</span>
                          <span className="font-bold text-amber-400">120 ETB</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>🥛 Double Shot Highland Macchiato</span>
                          <span className="font-bold text-amber-400">90 ETB</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>🥐 Fresh Baked Almond Croissant</span>
                          <span className="font-bold text-amber-400">80 ETB</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handlePreBookService('Highlands Coffee Ceremony')}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Pre-Order Ceremony Tray
                    </button>
                  </div>
                </div>

                {/* 3. Executive Spa */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800" 
                      alt="Spa & Wellness" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-blue-500 text-zinc-950 text-[10px] font-bold font-mono rounded">
                      Therapeutic
                    </span>
                    <h3 className="absolute bottom-4 left-4 font-display font-bold text-xl text-white">Chiro Executive Spa &amp; Steam</h3>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Recharge after a mountain trek! Features dedicated herbal-scented steam, deep detox sauna, and expert Swedish or traditional Ethiopian oil massages designed to soothe muscle fatigue.
                    </p>

                    <button 
                      onClick={() => handlePreBookService('Executive Spa & Massage Session')}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Schedule Massage Session
                    </button>
                  </div>
                </div>

                {/* 4. Conference Hall */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col">
                  <div className="h-56 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" 
                      alt="Conference Hall" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 px-3 py-1 bg-purple-500 text-zinc-950 text-[10px] font-bold font-mono rounded">
                      MICE Center
                    </span>
                    <h3 className="absolute bottom-4 left-4 font-display font-bold text-xl text-white">Aschalew Summit &amp; Banquet Hall</h3>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Our modern, fully air-conditioned conference facility seats up to 300 delegates. Equipped with redundant fiber lines, high-intensity laser projectors, and premium translation booths.
                    </p>

                    <button 
                      onClick={() => handlePreBookService('Conference Summit Hall reservation')}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Inquire Corporate Booking
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GALLERY & EXPERIENCES */}
          {activeTab === 'experiences' && (
            <div className="space-y-12">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <MapPin className={`w-7 h-7 ${themeColors.primaryText}`} />
                  West Hararghe Experiences &amp; Tours
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Discover the mist-shrouded beauty of Mount Chercher and local coffee cultures centered around historic Asbe Teferi.
                </p>
              </div>

              {/* Experiences Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: 'tour-chercher',
                    title: 'Chercher Mountains Hiking',
                    category: 'Mountain Trek',
                    duration: '4 - 6 Hours',
                    difficulty: 'Moderate',
                    price: '750 ETB',
                    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600',
                    desc: 'Embark on a guided morning hike beneath the dense evergreen canopy of Chiro valley. Climb to the high ridges of Mount Chercher for unforgettable scenic photography above the clouds.'
                  },
                  {
                    id: 'tour-coffee',
                    title: 'Organic Coffee Plantation Tour',
                    category: 'Agricultural Culture',
                    duration: '3 Hours',
                    difficulty: 'Easy',
                    price: '500 ETB',
                    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&q=80&w=600',
                    desc: 'Visit a certified single-origin highland estate. Walk alongside generations of farmers, harvest coffee cherries directly from trees, and observe the natural washing and sun-drying process.'
                  },
                  {
                    id: 'tour-city',
                    title: 'Asbe Teferi Cultural Bajaj Ride',
                    category: 'City Excursion',
                    duration: '2 Hours',
                    difficulty: 'Easy',
                    price: '300 ETB',
                    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
                    desc: 'Experience Chiro center like a true local! Cruise in a customized three-wheel Bajaj vehicle to historic street corners, local hand-woven clothing markets, and spice vendors.'
                  }
                ].map((tour) => (
                  <div key={tour.id} className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between h-full hover:border-amber-500/10 transition">
                    <div>
                      <div className="h-44 relative overflow-hidden bg-zinc-950">
                        <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-zinc-950/80 backdrop-blur text-amber-400 text-[10px] font-mono rounded font-bold uppercase">
                          {tour.category}
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <h3 className="font-display font-bold text-lg text-zinc-100">{tour.title}</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">{tour.desc}</p>
                        
                        <div className="flex justify-between items-center pt-2 text-[10px] font-mono text-zinc-500">
                          <span>⏱️ {tour.duration}</span>
                          <span>⛰️ {tour.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 pt-0 border-t border-zinc-900/60 mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-zinc-500 block uppercase font-bold">Tour Price</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{tour.price} / person</span>
                      </div>
                      <button
                        onClick={() => handlePreBookService(tour.title)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        Book Adventure
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-12 max-w-4xl mx-auto">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <Info className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Our Story &amp; Vision
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  The history, people, and community pledge behind Chiro's leading hospitality gateway.
                </p>
              </div>

              {/* History Text with image on side */}
              <div className="flex flex-col md:flex-row gap-8 items-center bg-zinc-900/20 border border-zinc-900 p-6 rounded-2xl">
                <div className="flex-grow space-y-4">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">FOUNDED IN WEST HARARGHE</span>
                  <h3 className="font-display font-extrabold text-xl">The Soul of Legendary Warmth</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    Aschalew International was built to bridge majestic local wonders with premium, global resort comfort. Situated in Chiro town (historically called Asbe Teferi), nestled elegantly inside the Chercher mountains, our hotel represents a pledge to celebrate Ethiopian roots.
                  </p>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    We employ 100% local hospitality professionals from the Hararghe community, support local eco-farmers by sourcing our eggs, honey, organic spices, and coffee beans daily, and operate our resort utilizing eco-responsible water heaters.
                  </p>
                </div>
                <div className="w-full md:w-64 shrink-0 h-48 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  <img 
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=500" 
                    alt="Hotel Exterior" 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Our leadership team */}
              <div className="space-y-6">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block text-center">Meet Our Hospitality Family</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      name: 'Ato Aschalew',
                      role: 'Founder & Managing Director',
                      quote: 'Providing Chiro with an absolute sanctuary for tired global travelers is our pride and passion.',
                      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'
                    },
                    {
                      name: 'Wzo Abebech',
                      role: 'General Hotel Manager',
                      quote: 'Every guest is treated like royalty here. Our concierge team is standing by 24/7 to perfect your escape.',
                      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
                    },
                    {
                      name: 'Chef Yohannes',
                      role: 'Executive Chef',
                      quote: 'Blending authentic Ethiopian spice profiles with premium international steaks is my primary culinary mission.',
                      avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=150'
                    }
                  ].map((member, idx) => (
                    <div key={idx} className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl text-center space-y-3 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-950 border border-zinc-800">
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-base text-zinc-100">{member.name}</h4>
                        <span className="text-[10px] text-zinc-500 font-mono font-semibold uppercase">{member.role}</span>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed italic">
                        "{member.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CONTACT & LOCATION WITH GOOGLE MAPS AND WHATSAPP LIVE CHAT */}
          {activeTab === 'contact' && (
            <div className="space-y-12">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <MessageSquare className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Contact &amp; Location Center
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Connect instantly with our hospitality desk over simulated WhatsApp Live Chat or inspect our precise Chiro coordinates.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Simulated WhatsApp Live Chat desk */}
                <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between h-[520px]">
                  {/* Chat header */}
                  <div className="bg-emerald-950/40 border-b border-zinc-850 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" 
                          alt="Concierge Avatar" 
                          className="w-10 h-10 rounded-full border border-emerald-500/20" 
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-zinc-100">Aschalew Concierge</h3>
                        <span className="text-[9px] font-mono text-emerald-400 font-black tracking-wider uppercase">WhatsApp Live Help</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider scale-90">Instant</span>
                    </div>
                  </div>

                  {/* Messages container */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-3 font-sans text-xs bg-zinc-950/30">
                    {chatMessages.map((msg) => {
                      const isMe = msg.sender === 'user';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-2xl p-3 shadow-md ${
                            isMe 
                              ? 'bg-amber-500 text-zinc-950 font-semibold rounded-br-none' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <span className="block text-[8px] text-right mt-1 opacity-60 font-mono">{msg.time}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-bl-none p-3 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-3 bg-zinc-900 border-t border-zinc-850 flex gap-2">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a query (e.g. coffee, hiking, wifi)..."
                      className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      type="submit" 
                      className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl cursor-pointer transition flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Map Display Column */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                      <div>
                        <h4 className="font-display font-bold text-sm text-zinc-200">Aschalew Resort Coordinate Location</h4>
                        <span className="text-[10px] font-mono text-zinc-500 block">Chiro City Entry, West Hararghe, Ethiopia</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-zinc-950 p-2 border border-zinc-800 rounded">
                        <span className="text-[8px] text-zinc-500 block">GPS LATITUDE</span>
                        <span className="text-zinc-200 font-bold">9.0833° N</span>
                      </div>
                      <div className="bg-zinc-950 p-2 border border-zinc-800 rounded">
                        <span className="text-[8px] text-zinc-500 block">GPS LONGITUDE</span>
                        <span className="text-zinc-200 font-bold">40.8667° E</span>
                      </div>
                    </div>
                  </div>

                  {/* Complete embedded map and reviews from original GoogleMapsSection */}
                  <div className="border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl h-[330px]">
                    <GoogleMapsSection />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: EXISTING USER BOOKINGS HUB */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
                    <Award className="w-6 h-6 text-amber-500" />
                    My Active Reservations &amp; Folio
                  </h2>
                  <p className="text-zinc-400 text-sm mt-1">
                    Manage check-ins, cancel stays, and request in-room service directly on your active reservations.
                  </p>
                </div>
                <button 
                  onClick={fetchBookings}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 rounded-lg transition"
                  title="Refresh Bookings"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {isLoadingBookings ? (
                <div className="text-center py-12 text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-sm">Loading your reservations...</span>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/20 border border-zinc-800/80 rounded-2xl">
                  <BedDouble className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="font-display font-bold text-lg text-zinc-300">No Reservations Yet</h3>
                  <p className="text-zinc-500 text-sm mt-1 max-w-sm mx-auto mb-6">
                    You do not have any active or previous room bookings. Start by choosing your room.
                  </p>
                  <button 
                    onClick={() => setActiveTab('rooms')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs"
                  >
                    Browse Available Rooms
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {myBookings.map(({ booking, room }) => (
                    <div 
                      key={booking.id}
                      className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl overflow-hidden p-6 hover:border-zinc-700/80 transition duration-200"
                    >
                      {/* Upper row */}
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-zinc-800/60">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-lg bg-zinc-950 overflow-hidden shrink-0 border border-zinc-800">
                            <img src={room.imageUrl || 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=200'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Room {room.roomNumber}</span>
                              <span className="text-zinc-600">•</span>
                              <span className="text-zinc-100 font-bold capitalize">{room.type} Suite</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-500 text-xs mt-1 font-mono">
                              <Calendar className="w-3.5 h-3.5 text-amber-500/60" />
                              <span>{booking.checkIn}</span>
                              <span>to</span>
                              <span>{booking.checkOut}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badges & Quick Action */}
                        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                          <div className="text-left lg:text-right">
                            <span className="text-xs text-zinc-500 block font-semibold uppercase tracking-wider">Total cost</span>
                            <span className="text-amber-400 font-black text-lg font-mono">{booking.totalPrice} ETB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                              booking.status === 'checked_in' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                              booking.status === 'checked_out' ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' :
                              booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}>
                              {booking.status.replace('_', ' ')}
                            </span>

                            {booking.status === 'confirmed' && (
                              <button 
                                onClick={() => handleCancelBooking(booking.id)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition"
                                title="Cancel Reservation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lower section: Service Request Hub */}
                      {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                        <div className="mt-6">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                              <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                              In-Room Service Hub
                            </h4>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setServiceRequestForm(prev => ({ ...prev, bookingId: booking.id }));
                                  selectServiceType('room_service');
                                }}
                                className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <Plus className="w-3 h-3" />
                                Order Room Service
                              </button>
                              <button 
                                onClick={() => {
                                  setServiceRequestForm(prev => ({ ...prev, bookingId: booking.id }));
                                  selectServiceType('housekeeping');
                                }}
                                className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                              >
                                <Plus className="w-3 h-3" />
                                Request Housekeeping
                              </button>
                            </div>
                          </div>

                          {/* Submitted service requests for this booking */}
                          {activeServiceRequests[booking.id] && activeServiceRequests[booking.id].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {activeServiceRequests[booking.id].map((req) => (
                                <div 
                                  key={req.id}
                                  className="bg-zinc-950/40 border border-zinc-800 p-3 rounded-lg flex items-center justify-between"
                                >
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-500/70 block capitalize">
                                      {req.type.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5">{req.item}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                                      Qty: {req.quantity} {req.cost > 0 && `• ${req.cost} ETB`}
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    req.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  }`}>
                                    {req.status.replace('_', ' ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-zinc-600 text-xs italic font-sans pl-1">
                              No current service requests. Need refreshments, fresh towels, or housekeeping? Use the links above.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Room Booking Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">Room Booking Reservation</span>
                <h3 className="font-display text-xl font-bold capitalize mt-0.5">{selectedRoom.type} Suite (Room {selectedRoom.roomNumber})</h3>
              </div>
              <button 
                onClick={() => setSelectedRoom(null)}
                className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Check-In Date</label>
                  <input 
                    type="date" 
                    value={bookingForm.checkIn}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Check-Out Date</label>
                  <input 
                    type="date" 
                    value={bookingForm.checkOut}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Guests</label>
                  <select 
                    value={bookingForm.guestsCount}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, guestsCount: parseInt(e.target.value) }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Primary Guest Name</label>
                  <input 
                    type="text" 
                    value={bookingForm.guestName}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, guestName: e.target.value }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                    placeholder="Guest Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Contact Email</label>
                <input 
                  type="email" 
                  value={bookingForm.guestEmail}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, guestEmail: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                  placeholder="contact@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Special Notes / Requests</label>
                <textarea 
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none h-16 resize-none"
                  placeholder="E.g., early arrival, extra pillow, organic tea request..."
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Estimated Cost</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{selectedRoom.price} ETB <span className="text-[10px] font-normal text-zinc-400">/ night</span></span>
                </div>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingBooking}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingBooking ? 'Reserving...' : 'Confirm Reservation'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 360° Virtual Tour view simulator Modal */}
      {active360Room && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden shadow-2xl relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  Immersive 360° virtual suite tour
                </span>
                <h3 className="font-display text-xl font-bold capitalize mt-0.5">{active360Room.type} Suite Interactive View</h3>
              </div>
              <button 
                onClick={() => setActive360Room(null)}
                className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Immersive interactive panorama display */}
            <div className="relative h-80 w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-850">
              <div 
                className="absolute inset-y-0 flex transition-transform duration-500 ease-out"
                style={{ 
                  width: '200%', 
                  transform: `translateX(-${panoramicOffset * 0.5}%)` 
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1600" 
                  alt="360 Panorama" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Reflection lighting highlight overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/20 via-transparent to-zinc-950/20 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950/40 pointer-events-none" />

              {/* Guide Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6 bg-zinc-950/10">
                <span className="px-3 py-1 rounded-full bg-zinc-900/95 text-zinc-200 text-[10px] font-mono border border-zinc-800 shadow">
                  Move slider to look around this luxurious room
                </span>
              </div>
            </div>

            {/* Slider controls */}
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                <span>← Panoramic Left</span>
                <span>Camera angle slider</span>
                <span>Panoramic Right →</span>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={panoramicOffset} 
                onChange={(e) => setPanoramicOffset(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none" 
              />

              <div className="flex justify-between items-center pt-2">
                <div className="text-xs text-zinc-400 max-w-md">
                  Experience handcrafted native Ethiopian cedar furniture, world-class orthopedic beds, and private balcony overlooking the beautiful Chercher Mountains.
                </div>
                <button
                  onClick={() => {
                    setSelectedRoom(active360Room);
                    setActive360Room(null);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow cursor-pointer uppercase tracking-wider"
                >
                  Instant Book
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* In-Room Service Request Modal */}
      {serviceRequestForm.bookingId > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-amber-500 font-bold">Submit Service Request</span>
                <h3 className="font-display text-lg font-bold mt-0.5">Room Services Hub</h3>
              </div>
              <button 
                onClick={() => setServiceRequestForm(prev => ({ ...prev, bookingId: 0 }))}
                className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['room_service', 'housekeeping', 'maintenance'] as const).map((t) => (
                  <button 
                    key={t}
                    type="button"
                    onClick={() => selectServiceType(t)}
                    className={`p-2.5 rounded-lg border text-[10px] font-bold uppercase transition text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      serviceRequestForm.type === t ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {t === 'room_service' ? <UtensilsCrossed className="w-4 h-4" /> : t === 'housekeeping' ? <Coffee className="w-4 h-4" /> : <BedDouble className="w-4 h-4" />}
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {serviceRequestForm.type === 'room_service' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Select Refreshment</label>
                  <select 
                    value={serviceRequestForm.item}
                    onChange={(e) => {
                      const item = e.target.value;
                      let cost = 120;
                      if (item === 'Injera with Spicy Doro Wat') cost = 320;
                      else if (item === 'Organic Chiro Macchiato') cost = 90;
                      else if (item === 'Traditional Ethiopian Breakfast (Ful/Chechebsa)') cost = 180;
                      setServiceRequestForm(prev => ({ ...prev, item, cost }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Chiro Organic Espresso">Chiro Organic Espresso (120 ETB)</option>
                    <option value="Organic Chiro Macchiato">Organic Chiro Macchiato (90 ETB)</option>
                    <option value="Injera with Spicy Doro Wat">Injera with Spicy Doro Wat (320 ETB)</option>
                    <option value="Traditional Ethiopian Breakfast (Ful/Chechebsa)">Traditional Ethiopian Breakfast (180 ETB)</option>
                  </select>
                </div>
              ) : serviceRequestForm.type === 'housekeeping' ? (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Housekeeping Item</label>
                  <select 
                    value={serviceRequestForm.item}
                    onChange={(e) => setServiceRequestForm(prev => ({ ...prev, item: e.target.value, cost: 0 }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Fresh Linens & Towels">Fresh Linens &amp; Towels</option>
                    <option value="Extra Pillow and Blanket">Extra Pillow and Blanket</option>
                    <option value="Full Room Turndown Service">Full Room Turndown Service</option>
                    <option value="Complimentary Bottled Highland Water">Complimentary Bottled Water</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Maintenance Support Needed</label>
                  <select 
                    value={serviceRequestForm.item}
                    onChange={(e) => setServiceRequestForm(prev => ({ ...prev, item: e.target.value, cost: 0 }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Hot Water Plumbing Check">Hot Water Plumbing Check</option>
                    <option value="Wi-Fi Connectivity Assistant">Wi-Fi Connectivity Assistant</option>
                    <option value="Room Smart TV / Satellite Setup">Room Smart TV / Satellite Setup</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Quantity</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    value={serviceRequestForm.quantity}
                    onChange={(e) => setServiceRequestForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Cost (ETB)</label>
                  <div className="w-full bg-zinc-950/40 border border-zinc-800/80 rounded-lg px-3 py-2 text-zinc-400 text-sm flex items-center">
                    {serviceRequestForm.cost * serviceRequestForm.quantity} ETB
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setServiceRequestForm(prev => ({ ...prev, bookingId: 0 }))}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingService}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingService ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
