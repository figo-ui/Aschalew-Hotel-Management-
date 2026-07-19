import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Room, BookingWithDetails, ServiceRequest } from '../types.ts';
import { 
  Calendar, Users, Coffee, BedDouble, UtensilsCrossed, Sparkles, 
  Trash2, Plus, ChevronRight, CheckCircle2, RefreshCw, LogOut, ShieldCheck,
  Compass, Heart, MapPin, Send, MessageSquare, Phone, Info, Eye, Image,
  Filter, Check, Star, ShieldAlert, Award, Clock, CreditCard, Smartphone, Lock, Receipt,
  Mail, Bell, Settings, QrCode
} from 'lucide-react';
import { useLanguageTheme } from './LanguageThemeContext.tsx';
import FAQSection from './FAQSection.tsx';
import GoogleMapsSection from './GoogleMapsSection.tsx';
import HeroSection from './HeroSection.tsx';
import QRScanner from './QRScanner.tsx';
import DynamicWelcomeHeader from './DynamicWelcomeHeader.tsx';

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

  // QR Scanner State
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters State for Rooms & Suites
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPrice, setFilterPrice] = useState<string>('all');
  const [filterAmenities, setFilterAmenities] = useState<string[]>([]);

  // System Conversation Channel states (Database Synced)
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Load and poll system messages
  useEffect(() => {
    let active = true;
    const fetchSystemMessages = async () => {
      try {
        const res = await fetch('/api/system-messages');
        if (res.ok && active) {
          const data = await res.json();
          setChatMessages(data);
        }
      } catch (err) {
        console.warn('Unable to reach system messages service (server may be restarting):', err);
      }
    };

    fetchSystemMessages();
    const interval = setInterval(fetchSystemMessages, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Simulated booking alerts
  const [serviceBookingSuccess, setServiceBookingSuccess] = useState<string | null>(null);

  // Email Notification Preferences
  const [prefEmailConfirmations, setPrefEmailConfirmations] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_email_confirmations');
    return saved !== null ? saved === 'true' : true;
  });
  const [prefEmailReminders, setPrefEmailReminders] = useState<boolean>(() => {
    const saved = localStorage.getItem('pref_email_reminders');
    return saved !== null ? saved === 'true' : true;
  });
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState<boolean>(false);
  const [prefsSuccessMsg, setPrefsSuccessMsg] = useState<string | null>(null);

  // Sync state reactively when updated elsewhere (e.g. from the three dots menu)
  useEffect(() => {
    const handlePrefsChange = () => {
      const savedConfirmations = localStorage.getItem('pref_email_confirmations');
      if (savedConfirmations !== null) {
        setPrefEmailConfirmations(savedConfirmations === 'true');
      }
      const savedReminders = localStorage.getItem('pref_email_reminders');
      if (savedReminders !== null) {
        setPrefEmailReminders(savedReminders === 'true');
      }
    };
    window.addEventListener('aschalew_prefs_updated', handlePrefsChange);
    return () => window.removeEventListener('aschalew_prefs_updated', handlePrefsChange);
  }, []);

  const handleToggleConfirmations = (checked: boolean) => {
    setPrefEmailConfirmations(checked);
    localStorage.setItem('pref_email_confirmations', String(checked));
    window.dispatchEvent(new Event('aschalew_prefs_updated'));
    triggerPrefsFeedback();
  };

  const handleToggleReminders = (checked: boolean) => {
    setPrefEmailReminders(checked);
    localStorage.setItem('pref_email_reminders', String(checked));
    window.dispatchEvent(new Event('aschalew_prefs_updated'));
    triggerPrefsFeedback();
  };

  const triggerPrefsFeedback = () => {
    setIsUpdatingPrefs(true);
    setTimeout(() => {
      setIsUpdatingPrefs(false);
      setPrefsSuccessMsg('Notification preferences updated successfully!');
      setTimeout(() => setPrefsSuccessMsg(null), 3000);
    }, 600);
  };

  // Simulated Payment Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'method' | 'otp' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<'telebirr' | 'cbe' | 'chapa' | 'cash'>('telebirr');
  const [paymentPhone, setPaymentPhone] = useState('0912345678');
  const [paymentCard, setPaymentCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
  const [paymentOtp, setPaymentOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [checkoutData, setCheckoutData] = useState<{
    room: Room;
    checkIn: string;
    checkOut: string;
    guestsCount: number;
    guestName: string;
    guestEmail: string;
    notes: string;
  } | null>(null);

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

  const handleQRScan = (data: string) => {
    setShowQRScanner(false);
    setScanResult(data);
    
    // Process the QR code data
    try {
      // Examples of expected QR formats:
      // "room-checkin:101"
      // "restaurant:menu"
      if (data.startsWith('room-checkin:')) {
        const roomId = data.split(':')[1];
        setSuccessMessage(`Successfully checked in to room ${roomId}! Your digital key is now active.`);
        setActiveTab('reservations');
      } else if (data === 'restaurant:menu') {
        setActiveTab('dining');
        setSuccessMessage('Welcome to the restaurant! Here is our digital menu.');
      } else {
        setError('Unrecognized QR code format.');
      }
    } catch (err) {
      setError('Failed to process QR code.');
    }
    
    setTimeout(() => {
      setScanResult(null);
      setSuccessMessage(null);
      setError(null);
    }, 5000);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const targetRoomId = selectedRoom?.id || parseInt(bookingForm.roomId);
    const targetRoom = rooms.find(r => r.id === targetRoomId);
    if (!targetRoom) {
      setError('Please select a suite first before proceeding.');
      return;
    }

    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      setError('Please provide valid Check-In and Check-Out dates.');
      return;
    }

    if (new Date(bookingForm.checkIn) >= new Date(bookingForm.checkOut)) {
      setError('Check-Out date must be after Check-In date.');
      return;
    }

    // Set checkout details
    setCheckoutData({
      room: targetRoom,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      guestsCount: bookingForm.guestsCount,
      guestName: bookingForm.guestName || user?.displayName || 'Chiro Traveler',
      guestEmail: bookingForm.guestEmail || user?.email || '',
      notes: bookingForm.notes
    });

    // Reset payment wizard states
    setCheckoutStep('method');
    setPaymentOtp('');
    setOtpError(null);
    setIsProcessingPayment(false);

    // Open Checkout Modal
    setShowCheckout(true);

    // Close room details input modal if open
    setSelectedRoom(null);
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setOtpError(null);

    // Simulate contacting secure gateway
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (selectedMethod === 'cash') {
        // Direct cash/bank transfer options don't require SMS OTP
        const randomTx = 'TXN-CASH-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        setTransactionId(randomTx);
        setCheckoutStep('success');
      } else {
        // Telebirr, CBE Birr, Chapa need SMS authentication
        setCheckoutStep('otp');
      }
    }, 1800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentOtp !== '123456') {
      setOtpError('Invalid verification code. Please enter the simulated PIN "123456" for demonstration.');
      return;
    }

    setIsProcessingPayment(true);
    setOtpError(null);

    // Simulate authorization
    setTimeout(() => {
      setIsProcessingPayment(false);
      const randomTx = 'TXN-' + selectedMethod.toUpperCase() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      setTransactionId(randomTx);
      setCheckoutStep('success');
    }, 1500);
  };

  const handleCompleteBookingAndSave = async () => {
    if (!checkoutData) return;

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
          roomId: checkoutData.room.id,
          checkIn: checkoutData.checkIn,
          checkOut: checkoutData.checkOut,
          guestsCount: checkoutData.guestsCount,
          guestName: checkoutData.guestName,
          guestEmail: checkoutData.guestEmail,
          notes: `${checkoutData.notes ? checkoutData.notes + ' ' : ''}[Paid via ${selectedMethod.toUpperCase()} Ref: ${transactionId}]`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking on server. This room may be reserved during these dates.');
      }

      await response.json();

      // Close checkout
      setShowCheckout(false);
      setCheckoutData(null);

      // Reload bookings and switch tab
      setActiveTab('bookings');
      fetchBookings();

      // Set booking success notification
      setServiceBookingSuccess(`Congratulations! Your payment has been confirmed! Your stay at Aschalew International is secured.`);
      setTimeout(() => setServiceBookingSuccess(null), 8000);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
      setShowCheckout(false);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Helper helper to calculate receipt details
  const calculateTotal = (room: Room, checkIn: string, checkOut: string) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const subtotal = room.price * nights;
    const vat = Math.round(subtotal * 0.15);
    const serviceFee = Math.round(subtotal * 0.10);
    const grandTotal = subtotal + vat + serviceFee;
    return { nights, subtotal, vat, serviceFee, grandTotal };
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

  // WhatsApp/System Chat handler
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const textToSend = chatInput.trim();
    setChatInput('');
    setIsTyping(true);

    try {
      // 1. Post the user's message
      const res = await fetch('/api/system-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, type: 'info' })
      });
      if (!res.ok) throw new Error('Failed to post');

      // Fetch updated messages
      const updatedRes = await fetch('/api/system-messages');
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        setChatMessages(data);
      }

      // 2. Perform Concierge Auto-Responder Logic if matching certain keywords
      const promptText = textToSend.toLowerCase();
      let reply = "";
      
      if (promptText.includes('coffee') || promptText.includes('buna')) {
        reply = "☕ [Aschalew Concierge Bot]: We source single-origin organic coffee beans directly from farmers in the Chercher hills. We hold live traditional coffee ceremonies every afternoon in our Highlands lounge!";
      } else if (promptText.includes('mountain') || promptText.includes('hike') || promptText.includes('tour')) {
        reply = "⛰️ [Aschalew Concierge Bot]: Chiro sits at the base of the Chercher Mountains! We organize guided hiking tours and mountain excursions complete with transportation, security, and refreshments.";
      } else if (promptText.includes('wifi') || promptText.includes('internet')) {
        reply = "📶 [Aschalew Concierge Bot]: Yes! We have dedicated fiber optic high-speed internet (over 100 Mbps) across the entire resort. Perfect for working and streaming.";
      } else if (promptText.includes('food') || promptText.includes('dinner') || promptText.includes('restaurant')) {
        reply = "🍽️ [Aschalew Concierge Bot]: Our signature Gara Restaurant is open 24/7. We serve traditional Hararghe recipes and high-quality international favorites.";
      } else if (promptText.includes('rate') || promptText.includes('price') || promptText.includes('discount')) {
        reply = "💳 [Aschalew Concierge Bot]: Our rates start at 1,500 ETB per night for standard rooms. Buffet breakfast, high-speed Wi-Fi, and parking are always 100% free.";
      }

      if (reply) {
        // Wait a small delay to simulate typing, then post concierge reply as a system announcement
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply, type: 'success' })
        });
      }

      // Fetch final updated messages
      const finalRes = await fetch('/api/system-messages');
      if (finalRes.ok) {
        const data = await finalRes.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Failed to post message to system conversation:', err);
    } finally {
      setIsTyping(false);
    }
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
                src={user.photoUrl || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.email || 'guest'}`} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-zinc-700 shrink-0"
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

        {/* Dynamic Welcome Header */}
        <DynamicWelcomeHeader user={user} myBookings={myBookings} />

        {/* Dynamic Alerts */}
        <div className="max-w-7xl mx-auto px-6 mt-6 space-y-3">
          <AnimatePresence>
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-3 shadow-lg shadow-emerald-500/5"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {successMessage}
              </motion.div>
            )}
            
            {error && !selectedRoom && !showCheckout && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-3 shadow-lg shadow-red-500/5"
              >
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {serviceBookingSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3 shadow"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{serviceBookingSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Proceed to Payment 💳</span>
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

          {/* TAB 7: CONTACT & LOCATION WITH GOOGLE MAPS AND SYSTEM CONVERSATION CHANNEL */}
          {activeTab === 'contact' && (
            <div className="space-y-12">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <MessageSquare className={`w-7 h-7 ${themeColors.primaryText}`} />
                  Contact &amp; Location Center
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Connect instantly with our hospitality desk over the shared System Conversation Channel or inspect our precise Chiro coordinates.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Shared System Conversation Channel */}
                <div className="lg:col-span-5 bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden flex flex-col justify-between h-[520px]">
                  {/* Chat header */}
                  <div className="bg-amber-950/20 border-b border-zinc-850 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" 
                          alt="System Core Avatar" 
                          className="w-10 h-10 rounded-full border border-amber-500/20" 
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-zinc-900 rounded-full" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-zinc-100">System Chat Channel</h3>
                        <span className="text-[9px] font-mono text-amber-500 font-black tracking-wider uppercase">Shared Message Board</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider scale-90">Live</span>
                    </div>
                  </div>

                  {/* Messages container */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-3 font-sans text-xs bg-zinc-950/30">
                    {chatMessages.map((msg) => {
                      const isMe = msg.senderEmail === user?.email;
                      const isSystem = msg.senderRole === 'system';
                      const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && !isSystem && (
                            <span className="text-[9px] font-bold font-mono text-zinc-500 mb-0.5 px-1 uppercase tracking-wider">
                              {msg.senderName} ({msg.senderRole})
                            </span>
                          )}
                          <div className={`max-w-[85%] rounded-2xl p-3 shadow-md leading-relaxed ${
                            isMe 
                              ? 'bg-amber-500 text-zinc-950 font-semibold rounded-br-none font-mono text-[11px]' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none font-mono text-[11px]'
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <span className="block text-[8px] text-right mt-1 opacity-60 font-mono">{timeStr}</span>
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
                      className="flex-grow bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                    <button 
                      type="submit" 
                      className="p-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl cursor-pointer transition flex items-center justify-center shrink-0"
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
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Stays & Bookings */}
                  <div className="lg:col-span-8 space-y-6">
                    {myBookings.length === 0 ? (
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
                            className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl overflow-hidden p-6 hover:border-zinc-700/80 transition duration-200 text-left"
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
                                      className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition text-left"
                                    >
                                      <Plus className="w-3 h-3" />
                                      Order Room Service
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setServiceRequestForm(prev => ({ ...prev, bookingId: booking.id }));
                                        selectServiceType('housekeeping');
                                      }}
                                      className="px-2.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/50 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition text-left"
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
                                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-500/70 block capitalize text-left">
                                            {req.type.replace('_', ' ')}
                                          </span>
                                          <span className="text-xs font-bold text-zinc-200 truncate block mt-0.5 text-left">{req.item}</span>
                                          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5 text-left">
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
                                  <p className="text-zinc-600 text-xs italic font-sans pl-1 text-left">
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

                  {/* Right Column: Preferences Panel */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 space-y-6 text-left">
                      <div className="flex items-center gap-2 pb-4 border-b border-zinc-850">
                        <Settings className="w-5 h-5 text-amber-500" />
                        <div>
                          <h3 className="font-display font-bold text-sm text-zinc-100">Guest Preferences</h3>
                          <p className="text-[10px] uppercase font-mono text-zinc-500">Aschalew Member Folio</p>
                        </div>
                      </div>

                      {prefsSuccessMsg ? (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium"
                        >
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{prefsSuccessMsg}</span>
                        </motion.div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          Configure how you want our reservation system to reach you. Stated preferences apply to all future active and pending room reservations.
                        </p>
                      )}

                      <div className="space-y-5">
                        {/* Option 1: Confirmations */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-zinc-400" />
                              Email Confirmations
                            </span>
                            <p className="text-[10px] text-zinc-500 leading-normal">
                              Receive an immediate automated PDF invoice, secure door passcode, and check-in receipt instantly upon successful payment.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleConfirmations(!prefEmailConfirmations)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              prefEmailConfirmations ? 'bg-amber-500' : 'bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                                prefEmailConfirmations ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Option 2: Reminders */}
                        <div className="flex items-start justify-between gap-4 pt-4 border-t border-zinc-850/60">
                          <div className="space-y-1 text-left">
                            <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 text-zinc-400" />
                              Stay Reminders &amp; Tips
                            </span>
                            <p className="text-[10px] text-zinc-500 leading-normal">
                              Receive helpful mountain weather notices, packing recommendations, and local travel guides 24 hours before check-in.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleReminders(!prefEmailReminders)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              prefEmailReminders ? 'bg-amber-500' : 'bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
                                prefEmailReminders ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {isUpdatingPrefs && (
                        <div className="flex items-center gap-1.5 justify-center text-[10px] font-mono text-amber-500 animate-pulse pt-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Saving choices to guest account...</span>
                        </div>
                      )}

                      <div className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-2 text-xs text-left">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold block">Delivery Destination</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-mono text-zinc-300 font-semibold truncate text-[11px]" title={user.email}>
                            {user.email || 'guest@aschalewhotel.com'}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-500 leading-relaxed font-sans">
                          To change delivery email, update your profile or sign in using your corporate account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Floating QR Scanner Button */}
      <button
        onClick={() => setShowQRScanner(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
          theme === 'dark' 
            ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400' 
            : 'bg-stone-900 text-white hover:bg-stone-800'
        }`}
        title="Scan QR Code"
      >
        <QrCode className="w-6 h-6" />
      </button>

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
                    <span>Proceed to Payment 💳</span>
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
      {/* SIMULATED PAYMENT CHECKOUT MODAL */}
      {showCheckout && checkoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl my-8 flex flex-col md:flex-row text-zinc-200 text-left"
          >
            {/* Left Hand: Receipt & Booking Summary */}
            <div className="w-full md:w-5/12 bg-zinc-950 p-6 border-b md:border-b-0 md:border-r border-zinc-850 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4">
                  <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  Booking Invoice
                </div>
                
                <h4 className="font-display font-bold text-base text-zinc-100 capitalize">
                  {checkoutData.room.type} Suite
                </h4>
                <p className="text-xs text-zinc-500 font-mono mt-0.5 font-bold">Room {checkoutData.room.roomNumber}</p>
                
                <div className="mt-6 space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Stay Duration</span>
                    <span className="text-zinc-300 font-mono font-medium">
                      {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).nights} {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).nights === 1 ? 'Night' : 'Nights'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Check-In</span>
                    <span className="text-zinc-300 font-mono">{checkoutData.checkIn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Check-Out</span>
                    <span className="text-zinc-300 font-mono">{checkoutData.checkOut}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Guests</span>
                    <span className="text-zinc-300">{checkoutData.guestsCount} {checkoutData.guestsCount === 1 ? 'Guest' : 'Guests'}</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-850/60 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Daily Suite Rate</span>
                    <span className="text-zinc-300 font-mono">{checkoutData.room.price.toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Subtotal</span>
                    <span className="text-zinc-300 font-mono">
                      {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).subtotal.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">VAT (15%)</span>
                    <span className="text-zinc-300 font-mono">
                      {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).vat.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Service Fee (10%)</span>
                    <span className="text-zinc-300 font-mono">
                      {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).serviceFee.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-800">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Grand Total</span>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-amber-400">
                      {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).grandTotal.toLocaleString()}
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block mt-0.5">Ethiopian Birr (ETB)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hand: Checkout Process (Wizard) */}
            <div className="flex-grow p-6 flex flex-col justify-between min-h-[460px]">
              
              {/* Header inside checkout */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display font-extrabold text-lg text-zinc-100">Secure Payment</h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono mt-0.5">Aschalew Hotel Gateway</p>
                </div>
                <button 
                  onClick={() => { setShowCheckout(false); setCheckoutData(null); }}
                  className="p-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-100 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              {/* Loader overlay */}
              {isProcessingPayment ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                  <div>
                    <h4 className="font-display font-semibold text-zinc-200">Processing Transaction...</h4>
                    <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
                      {checkoutStep === 'method' 
                        ? 'Contacting encrypted local payment server to issue One-Time Passcode (OTP)...' 
                        : 'Verifying simulated funds and securing room lock inventory ledger...'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 1: SELECT METHOD */}
                  {checkoutStep === 'method' && (
                    <form onSubmit={handleInitiatePayment} className="flex-grow flex flex-col justify-between">
                      <div className="space-y-4">
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                          Select Local Payment Method
                        </label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Telebirr */}
                          <button
                            type="button"
                            onClick={() => setSelectedMethod('telebirr')}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                              selectedMethod === 'telebirr' 
                                ? 'border-emerald-500 bg-emerald-500/10' 
                                : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400">
                              <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-zinc-200 block">Telebirr</span>
                              <span className="text-[9px] text-zinc-500 block">Ethio Telecom Wallet</span>
                            </div>
                          </button>

                          {/* CBE Birr */}
                          <button
                            type="button"
                            onClick={() => setSelectedMethod('cbe')}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                              selectedMethod === 'cbe' 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
                              <Award className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-zinc-200 block">CBE Birr</span>
                              <span className="text-[9px] text-zinc-500 block">Commercial Bank</span>
                            </div>
                          </button>

                          {/* Chapa Pay */}
                          <button
                            type="button"
                            onClick={() => setSelectedMethod('chapa')}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                              selectedMethod === 'chapa' 
                                ? 'border-teal-500 bg-teal-500/10' 
                                : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="p-1.5 rounded bg-teal-500/10 text-teal-400">
                              <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-zinc-200 block">Chapa Pay</span>
                              <span className="text-[9px] text-zinc-500 block">Visa / MasterCard</span>
                            </div>
                          </button>

                          {/* Cash Transfer */}
                          <button
                            type="button"
                            onClick={() => setSelectedMethod('cash')}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                              selectedMethod === 'cash' 
                                ? 'border-zinc-500 bg-zinc-500/10' 
                                : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                            }`}
                          >
                            <div className="p-1.5 rounded bg-zinc-800 text-zinc-400">
                              <Compass className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-black text-zinc-200 block">At Property</span>
                              <span className="text-[9px] text-zinc-500 block">Cash / Direct Bank</span>
                            </div>
                          </button>
                        </div>

                        {/* Payment Credentials Form */}
                        <div className="pt-4 border-t border-zinc-850">
                          {selectedMethod === 'telebirr' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                <span>Telebirr Account Number</span>
                                <span className="text-emerald-400 font-bold">● Secure API Connected</span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 font-bold">+251</span>
                                <input 
                                  type="tel"
                                  pattern="[0-9]{9}"
                                  required
                                  value={paymentPhone}
                                  onChange={(e) => setPaymentPhone(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-14 pr-4 py-3 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/10 font-mono"
                                  placeholder="912345678"
                                />
                              </div>
                              <p className="text-[9px] text-zinc-500">
                                Enter your 9-digit Telebirr wallet phone number (excluding the country prefix).
                              </p>
                            </div>
                          )}

                          {selectedMethod === 'cbe' && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                                <span>CBE Birr Wallet ID / Phone</span>
                                <span className="text-purple-400 font-bold">● CBE Live Sandbox</span>
                              </div>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 font-bold">+251</span>
                                <input 
                                  type="tel"
                                  pattern="[0-9]{9}"
                                  required
                                  value={paymentPhone}
                                  onChange={(e) => setPaymentPhone(e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-14 pr-4 py-3 text-sm text-zinc-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/10 font-mono"
                                  placeholder="912345678"
                                />
                              </div>
                              <p className="text-[9px] text-zinc-500">
                                Enter the Commercial Bank of Ethiopia CBE Birr registered mobile number.
                              </p>
                            </div>
                          )}

                          {selectedMethod === 'chapa' && (
                            <div className="space-y-2.5">
                              <span className="block text-[10px] font-mono text-zinc-400">Chapa Global Card Settlement</span>
                              
                              <div className="space-y-2">
                                <input 
                                  type="text"
                                  required
                                  maxLength={19}
                                  value={paymentCard.number}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ') || '';
                                    setPaymentCard(prev => ({ ...prev, number: val }));
                                  }}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none font-mono"
                                  placeholder="Card Number (4111 2222 3333 4444)"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text"
                                    required
                                    maxLength={5}
                                    value={paymentCard.expiry}
                                    onChange={(e) => {
                                      let val = e.target.value.replace(/\D/g, '');
                                      if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                      setPaymentCard(prev => ({ ...prev, expiry: val }));
                                    }}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none font-mono text-center"
                                    placeholder="MM / YY"
                                  />
                                  <input 
                                    type="password"
                                    required
                                    maxLength={3}
                                    value={paymentCard.cvv}
                                    onChange={(e) => setPaymentCard(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none font-mono text-center"
                                    placeholder="CVV"
                                  />
                                </div>
                                <input 
                                  type="text"
                                  required
                                  value={paymentCard.holder}
                                  onChange={(e) => setPaymentCard(prev => ({ ...prev, holder: e.target.value }))}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none uppercase"
                                  placeholder="Cardholder Full Name"
                                />
                              </div>
                            </div>
                          )}

                          {selectedMethod === 'cash' && (
                            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 text-xs space-y-2 leading-relaxed">
                              <p className="flex items-center gap-1.5 font-semibold text-zinc-300">
                                <Lock className="w-4 h-4 text-amber-500" />
                                Pay at Property / Bank Transfer
                              </p>
                              <p>
                                Skip online settlement and pay with physical Cash (ETB, USD, EUR) or complete a direct Bank Wire (CBE / Awash / Dashen Bank) during your check-in reception.
                              </p>
                              <p className="text-[10px] text-amber-500/70 font-mono">
                                Note: We hold vacant suites up to 6:00 PM on your arrival day unless fully pre-paid.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-zinc-850 flex justify-end gap-3">
                        <button 
                          type="button"
                          onClick={() => { setShowCheckout(false); setCheckoutData(null); }}
                          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Proceed to Authorize
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: SMS PIN / OTP AUTHENTICATION */}
                  {checkoutStep === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="flex-grow flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                          <Lock className="w-4 h-4" />
                          Simulated Security Verification
                        </div>
                        
                        <p className="text-zinc-300 text-xs leading-relaxed">
                          A simulated secure payment request has been sent to your device. We dispatched a dummy 6-digit SMS verification code to check authorization.
                        </p>
                        
                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 leading-relaxed font-mono">
                          <span className="font-bold uppercase text-amber-400">DEMO AUTHORIZATION KEY:</span>
                          <p className="mt-1">
                            Please type PIN <span className="font-black underline text-sm text-zinc-100">123456</span> to simulate a successful payment approval.
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          <label className="block text-[10px] uppercase font-bold text-zinc-500 text-center">
                            Enter 6-Digit SMS Verification PIN
                          </label>
                          <input 
                            type="text"
                            required
                            maxLength={6}
                            autoFocus
                            value={paymentOtp}
                            onChange={(e) => {
                              setPaymentOtp(e.target.value.replace(/\D/g, ''));
                              setOtpError(null);
                            }}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-center text-xl font-bold font-mono tracking-[1em] text-zinc-100 focus:border-amber-500 focus:outline-none"
                            placeholder="••••••"
                          />
                          {otpError && (
                            <p className="text-red-400 text-center text-[11px] font-mono font-semibold">
                              ❌ {otpError}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-zinc-850 flex justify-between items-center">
                        <button 
                          type="button"
                          onClick={() => setCheckoutStep('method')}
                          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer"
                        >
                          Back to Methods
                        </button>
                        <button 
                          type="submit"
                          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify &amp; Authorize
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 3: TRANSACTION RECEIPT & SUCCESS */}
                  {checkoutStep === 'success' && (
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-col items-center text-center py-2 space-y-1">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1 animate-bounce">
                            <Check className="w-6 h-6" />
                          </div>
                          <h4 className="font-display font-bold text-base text-emerald-400">Payment Succeeded</h4>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Funds Secured and Settled</p>
                        </div>

                        {/* Thermal Paper Receipt Design */}
                        <div className="p-4 bg-zinc-950 rounded-xl border border-dashed border-zinc-800 space-y-3 font-mono text-[10px]">
                          <div className="text-center font-bold border-b border-zinc-900 pb-2 text-zinc-400">
                            ASCHALEW INTERNATIONAL RESORT
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">TRANSACTION REF</span>
                            <span className="text-zinc-300 font-semibold">{transactionId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">METHOD</span>
                            <span className="text-zinc-300 uppercase font-semibold">{selectedMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-600">SETTLEMENT TIMESTAMP</span>
                            <span className="text-zinc-300">{new Date().toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between border-t border-zinc-900 pt-2 text-xs font-bold">
                            <span className="text-zinc-400">AMOUNT PAID</span>
                            <span className="text-emerald-400 font-mono font-black">
                              {calculateTotal(checkoutData.room, checkoutData.checkIn, checkoutData.checkOut).grandTotal.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                          Your digital payment has been verified. Click the button below to register the booking permanently in our Hotel PMS and lock your dates!
                        </p>
                      </div>

                      <div className="pt-6 mt-4 border-t border-zinc-850 flex justify-end">
                        <button 
                          onClick={handleCompleteBookingAndSave}
                          disabled={isSubmittingBooking}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 uppercase tracking-wider"
                        >
                          {isSubmittingBooking ? 'Locking Suite Booking...' : 'Complete Booking & Save 🎉'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* QR Scanner Component */}
      {showQRScanner && (
        <QRScanner
          isDarkMode={theme === 'dark'}
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
          title="Hotel QR Scanner"
          description="Scan to Check-in or view Restaurant Menu"
        />
      )}
    </div>
  );
}
