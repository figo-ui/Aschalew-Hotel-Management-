import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AdminStats, BookingWithDetails, Room, ServiceRequest } from '../types.ts';
import ThemeLanguageSelector from './ThemeLanguageSelector.tsx';
import { useLanguageTheme } from './LanguageThemeContext.tsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  DollarSign, Activity, Users, Coffee, Check, Play, RefreshCw, LogOut,
  BedDouble, Bell, ClipboardList, CheckSquare, Sparkles, SlidersHorizontal,
  Calendar, ShieldAlert, FileText, FileSpreadsheet, UserCheck, Smartphone,
  History, Plus, Trash2, Edit2, Shield, Download, Info, CheckCircle2, Send
} from 'lucide-react';

interface AdminViewProps {
  token: string;
  user: any;
  onLogout: () => void;
  onToggleRole: () => void;
}

// PMS tab types
type PMSTab = 'dashboard' | 'frontdesk' | 'bookings' | 'rooms' | 'housekeeping' | 'crm' | 'billing' | 'security';

export default function AdminView({ token, user, onLogout, onToggleRole }: AdminViewProps) {
  const { language, theme, isDarkMode, t, themeColors } = useLanguageTheme();
  // Tabs
  const [activeTab, setActiveTab] = useState<PMSTab>('dashboard');
  
  // Base DB State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom HMS state
  const [crmGuests, setCrmGuests] = useState<any[]>([]);
  const [housekeepingLogs, setHousekeepingLogs] = useState<any[]>([]);
  const [wakeUpCalls, setWakeUpCalls] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [nightAudits, setNightAudits] = useState<any[]>([]);
  
  // Selected booking folio state
  const [selectedBookingFolioId, setSelectedBookingFolioId] = useState<number | null>(null);
  const [activeFolioData, setActiveFolioData] = useState<any | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [guestSearch, setGuestSearch] = useState<string>('');

  // CSV Exporter
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      alert("No data available to export!");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => {
        let val = row[fieldName] ?? '';
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modals & Forms
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    id: 0,
    roomNumber: '',
    type: 'standard',
    price: 1500,
    status: 'available',
    amenities: '',
    imageUrl: '',
    floor: 1
  });

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    roomId: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guestsCount: 1,
    guestName: '',
    guestEmail: '',
    contactNumber: '',
    idProof: '',
    preferences: '',
    ratePlan: 'Standard Rack Rate',
    segment: 'Walk-in'
  });

  // Role simulation state
  const [activeStaffRole, setActiveStaffRole] = useState<'Admin' | 'General Manager' | 'Receptionist' | 'Housekeeper' | 'Accountant'>('Admin');

  // Key card coding simulator
  const [codingKeyCardRoom, setCodingKeyCardRoom] = useState<string | null>(null);
  const [keyCardStatus, setKeyCardStatus] = useState<'idle' | 'encoding' | 'success'>('idle');

  // New notification template
  const [customNotification, setCustomNotification] = useState({
    email: '',
    name: '',
    channel: 'WhatsApp' as 'WhatsApp' | 'SMS' | 'Email',
    message: ''
  });

  // New Folio Adjustment Settings
  const [adjustmentForm, setAdjustmentForm] = useState({
    ratePlan: 'Standard Rack Rate',
    discount: 0,
    serviceCharge: 10,
    vat: 15,
    splitDetails: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 100,
    method: 'cash' as 'cash' | 'card' | 'digital_wallet' | 'invoice',
    description: 'Split payment charge'
  });

  // Housekeeping task form
  const [hkTaskForm, setHkTaskForm] = useState({
    roomId: '',
    assignedStaff: 'Abebech Housekeeper',
    scheduleTime: '11:00 AM',
    taskType: 'routine_clean',
    notes: '',
    status: 'pending'
  });

  // Wake up Form
  const [wakeUpForm, setWakeUpForm] = useState({
    bookingId: '',
    roomNumber: '',
    time: '06:30',
    notes: 'Morning traditional coffee wakeup'
  });

  // Load state on tab swap
  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Rooms
      const roomsRes = await fetch('/api/rooms');
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }

      // 3. Fetch Bookings
      const bookingsRes = await fetch('/api/admin/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
        // Default select first booking for billing if none selected
        if (bookingsData.length > 0 && !selectedBookingFolioId) {
          setSelectedBookingFolioId(bookingsData[0].booking.id);
        }
      }

      // 4. Fetch Services
      const servicesRes = await fetch('/api/admin/services', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      // 5. Fetch CRM directory
      const crmRes = await fetch('/api/admin/guests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (crmRes.ok) {
        const crmData = await crmRes.json();
        setCrmGuests(crmData);
      }

      // 6. Fetch Housekeeping rosters
      const hkRes = await fetch('/api/admin/housekeeping', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (hkRes.ok) {
        const hkData = await hkRes.json();
        setHousekeepingLogs(hkData);
      }

      // 7. Fetch active wake ups
      const wakeRes = await fetch('/api/admin/wake-up', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (wakeRes.ok) {
        const wakeData = await wakeRes.json();
        setWakeUpCalls(wakeData);
      }

      // 8. Fetch audit security logs
      const auditRes = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        setAuditLogs(auditData);
      }

      // 9. Fetch night audits
      const nightRes = await fetch('/api/admin/night-audits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (nightRes.ok) {
        const nightData = await nightRes.json();
        setNightAudits(nightData);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Folio for specific booking
  const loadFolioDetails = async (bookingId: number) => {
    try {
      const folioRes = await fetch(`/api/admin/bookings/${bookingId}/billing`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (folioRes.ok) {
        const data = await folioRes.json();
        setActiveFolioData(data);
        setAdjustmentForm({
          ratePlan: data.folio?.ratePlan || 'Standard Rack Rate',
          discount: data.folio?.discount || 0,
          serviceCharge: data.folio?.serviceCharge || 10,
          vat: data.folio?.vat || 15,
          splitDetails: data.folio?.splitDetails || ''
        });
      }
    } catch (err) {
      console.error('Error loading billing folio:', err);
    }
  };

  useEffect(() => {
    if (selectedBookingFolioId) {
      loadFolioDetails(selectedBookingFolioId);
    }
  }, [selectedBookingFolioId]);

  // Handle billing configuration update
  const handleUpdateBilling = async () => {
    if (!selectedBookingFolioId) return;
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingFolioId}/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adjustmentForm)
      });
      if (res.ok) {
        loadFolioDetails(selectedBookingFolioId);
        alert('Billing parameters applied successfully to Guest folio invoice!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Record custom payment
  const handleRecordPayment = async () => {
    if (!selectedBookingFolioId) return;
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingFolioId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });
      if (res.ok) {
        loadFolioDetails(selectedBookingFolioId);
        setPaymentForm({ amount: 100, method: 'cash', description: 'Split payment transaction' });
        alert('Payment registered successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check Overbooking Date Conflict Helper
  const checkRoomOverbookingConflict = (roomId: string, checkIn: string, checkOut: string): boolean => {
    const targetRoomId = parseInt(roomId);
    if (isNaN(targetRoomId)) return false;

    return bookings.some(b => {
      if (b.booking.roomId !== targetRoomId) return false;
      if (b.booking.status === 'cancelled' || b.booking.status === 'checked_out') return false;

      // Check date overlaps
      const startA = new Date(b.booking.checkIn);
      const endA = new Date(b.booking.checkOut);
      const startB = new Date(checkIn);
      const endB = new Date(checkOut);

      return (startB < endA && endB > startA);
    });
  };

  // Walk-in booking creation
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { roomId, checkIn, checkOut, guestName, guestEmail, contactNumber } = walkInForm;
    if (!roomId || !checkIn || !checkOut || !guestName || !guestEmail) {
      alert('Please fill out all mandatory reservation fields.');
      return;
    }

    // Overbooking preventative check
    const hasConflict = checkRoomOverbookingConflict(roomId, checkIn, checkOut);
    if (hasConflict) {
      const proceed = window.confirm(
        '⚠️ DANGER: OVERBOOKING DETECTED!\nThis room is already reserved for overlapping dates. Do you wish to override and overbook anyway?'
      );
      if (!proceed) return;
    }

    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(walkInForm)
      });
      if (res.ok) {
        alert('Front-desk booking created successfully! Welcome message simulation sent to Guest.');
        setShowWalkInModal(false);
        setWalkInForm({
          roomId: '',
          checkIn: new Date().toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          guestsCount: 1,
          guestName: '',
          guestEmail: '',
          contactNumber: '',
          idProof: '',
          preferences: '',
          ratePlan: 'Standard Rack Rate',
          segment: 'Walk-in'
        });
        fetchAdminData();
      } else {
        const errorMsg = await res.json();
        alert(`Failed: ${errorMsg.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Room creation / update
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = showEditRoomModal ? `/api/admin/rooms/${roomForm.id}` : '/api/admin/rooms';
    const method = showEditRoomModal ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomForm)
      });
      if (res.ok) {
        alert(`Room successfully ${showEditRoomModal ? 'updated' : 'added'} to PMS registry!`);
        setShowAddRoomModal(false);
        setShowEditRoomModal(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Room
  const handleDeleteRoom = async (roomId: number, roomNumber: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete Room ${roomNumber}? This will cascade delete associated reservations.`)) return;
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert(`Room ${roomNumber} deleted from active database registry.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Key card programming simulator
  const encodeKeyCard = (roomNumber: string) => {
    setCodingKeyCardRoom(roomNumber);
    setKeyCardStatus('encoding');
    setTimeout(() => {
      setKeyCardStatus('success');
      setTimeout(() => {
        setCodingKeyCardRoom(null);
        setKeyCardStatus('idle');
      }, 1500);
    }, 2000);
  };

  // Trigger simulated WhatsApp / SMS custom messages
  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNotification.message || !customNotification.email) {
      alert('Must select a recipient guest and enter message content.');
      return;
    }
    try {
      // Find guest from directory to get contact details
      const g = crmGuests.find(g => g.guestEmail === customNotification.email);
      const name = g ? g.guestName : 'Guest';
      const contact = g ? g.contactNumber : '+251911223344';

      // Call mock messaging logger internally via booking context
      const targetBookingId = bookings.find(b => b.booking.guestEmail === customNotification.email)?.booking.id || 0;

      alert(`Simulated message sent successfully!\nChannel: ${customNotification.channel}\nRecipient: ${name} (${contact})`);
      setCustomNotification({ ...customNotification, message: '' });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // Housekeeping assignment
  const handleAssignHousekeeping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hkTaskForm.roomId) return;
    try {
      const res = await fetch('/api/admin/housekeeping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hkTaskForm)
      });
      if (res.ok) {
        alert('Housekeeping schedule updated and staff dispatched!');
        setHkTaskForm({
          roomId: '',
          assignedStaff: 'Abebech Housekeeper',
          scheduleTime: '11:00 AM',
          taskType: 'routine_clean',
          notes: '',
          status: 'pending'
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create wake-up call
  const handleCreateWakeUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wakeUpForm.bookingId) return;
    
    // Find room number for selected booking
    const b = bookings.find(b => b.booking.id === parseInt(wakeUpForm.bookingId));
    const roomNo = b ? b.room.roomNumber : '101';

    try {
      const res = await fetch('/api/admin/wake-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...wakeUpForm,
          roomNumber: roomNo
        })
      });
      if (res.ok) {
        alert(`Morning wake-up alarm set successfully for Room ${roomNo} at ${wakeUpForm.time}!`);
        setWakeUpForm({ bookingId: '', roomNumber: '', time: '06:30', notes: 'Traditional coffee wakeup' });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cancel/complete wakeup
  const handleUpdateWakeUpStatus = async (idx: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/wake-up/${idx}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute daily Night Audit
  const handleExecuteNightAudit = async () => {
    if (!window.confirm('CRITICAL ACTION: Execute End-of-Day Night Audit?\nThis will post nightly room charges, auto-cancel past unconfirmed bookings, and log financial metrics.')) return;
    try {
      const res = await fetch('/api/admin/night-audit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const auditLog = await res.json();
        alert(`Night Audit SUCCESS!\nOccupancy posted: ${auditLog.occupancyRate}%\nDaily gross revenue: ${auditLog.totalRevenuePosted} ETB.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Secure Backup download simulator
  const handleBackupDatabase = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Mock direct file download of secure Base64 snapshot string
        const element = document.createElement("a");
        const file = new Blob([data.payload], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = data.filename;
        document.body.appendChild(element);
        element.click();
        
        alert(`Success!\nEncrypted database backup "${data.filename}" downloaded successfully.\nChecksum: ${data.secureChecksum}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update booking status:', err);
    }
  };

  const handleUpdateServiceStatus = async (requestId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/services/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update service request:', err);
    }
  };

  const handleUpdateRoomStatus = async (roomId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update room status:', err);
    }
  };

  // ADR & RevPAR Calculations
  const totalOccupied = rooms.filter(r => r.status === 'occupied').length;
  const totalRoomsCount = rooms.length || 1;
  const currentOccupancyRate = Math.round((totalOccupied / totalRoomsCount) * 100);
  
  // Dynamic average room prices
  const sumOfOccupiedRates = bookings
    .filter(b => b.booking.status === 'checked_in')
    .reduce((sum, b) => sum + b.booking.totalPrice, 0);
  
  // ADR = Total Room Revenue / Rooms Occupied
  const calculatedADR = totalOccupied > 0 ? Math.round(sumOfOccupiedRates / totalOccupied) : 1800;
  // RevPAR = ADR * Occupancy Rate
  const calculatedRevPAR = Math.round(calculatedADR * (currentOccupancyRate / 100));

  // Calendar matrix helper for reservations (10 Days timeline view)
  const getTimelineDates = () => {
    const dates: string[] = [];
    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  const timelineDates = getTimelineDates();

  // Filter lists based on states
  const filteredBookingsList = bookings.filter(b => {
    const term = searchQuery.toLowerCase();
    return b.booking.guestName.toLowerCase().includes(term) ||
           b.booking.guestEmail.toLowerCase().includes(term) ||
           b.room.roomNumber.includes(term);
  });

  const filteredGuestsList = crmGuests.filter(g => {
    const term = guestSearch.toLowerCase();
    return g.guestName.toLowerCase().includes(term) ||
           g.guestEmail.toLowerCase().includes(term) ||
           g.contactNumber.includes(term);
  });

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-[#faf8f5] text-stone-900'} font-sans relative flex flex-col lg:flex-row transition-colors duration-250`}>
      {/* Floating Theme and Language Selector */}
      <ThemeLanguageSelector />

      {/* SIDEBAR NAVIGATION for Desktop/Tablet */}
      <aside className={`hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 border-r ${isDarkMode ? 'border-zinc-850 bg-zinc-900/40' : 'border-stone-200 bg-white shadow-xs'} p-6 z-40 transition-colors duration-200`}>
        {/* Logo Branding */}
        <div className="mb-8">
          <span className={`font-display font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradientText} block`}>
            ASCHALEW PMS
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] ${themeColors.badgeBg} border ${themeColors.primaryBorder} ${themeColors.primaryText} font-mono mt-1.5 inline-block`}>
            HMS Pro Enterprise
          </span>
        </div>

        {/* Active staff role selector inside sidebar */}
        <div className={`mb-6 p-3 rounded-xl border flex flex-col gap-1.5 ${isDarkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-stone-50 border-stone-200'}`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 ${themeColors.primaryBg} rounded-full animate-ping`} />
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Active Access</span>
          </div>
          <select 
            value={activeStaffRole}
            onChange={(e: any) => setActiveStaffRole(e.target.value)}
            className={`bg-transparent font-mono text-[11px] font-bold focus:outline-none cursor-pointer w-full ${isDarkMode ? 'text-zinc-200' : 'text-stone-800'}`}
          >
            <option value="Admin" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Role: Admin</option>
            <option value="General Manager" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Role: Manager</option>
            <option value="Receptionist" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Role: Receptionist</option>
            <option value="Housekeeper" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Role: Housekeeper</option>
            <option value="Accountant" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Role: Accountant</option>
          </select>
        </div>

        {/* Sidebar Tabs menu */}
        <nav className="flex-grow space-y-1.5">
          {[
            { id: 'dashboard', label: 'Analytics', icon: Activity },
            { id: 'frontdesk', label: 'Front Desk', icon: BedDouble },
            { id: 'bookings', label: 'Book Desk', icon: Calendar },
            { id: 'rooms', label: 'Rooms', icon: SlidersHorizontal },
            { id: 'housekeeping', label: 'Housekeeper', icon: CheckSquare },
            { id: 'crm', label: 'Guest CRM', icon: Users },
            { id: 'billing', label: 'Folios', icon: DollarSign },
            { id: 'security', label: 'Audit Trail', icon: Shield },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as PMSTab)}
                className={`w-full py-3 px-4 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  isActive 
                    ? `${themeColors.primaryBg} text-zinc-950 font-bold shadow-md border-transparent` 
                    : `${isDarkMode ? 'bg-zinc-950/20 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60' : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'}`
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold">{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar profile & actions footer */}
        <div className={`mt-auto pt-4 border-t flex items-center justify-between gap-3 ${isDarkMode ? 'border-zinc-850' : 'border-stone-200'}`}>
          <div className="flex items-center gap-2">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-zinc-700"
            />
            <span className={`text-[11px] font-bold truncate max-w-[100px] ${isDarkMode ? 'text-zinc-400' : 'text-stone-700'}`}>{activeStaffRole}</span>
          </div>
          <button 
            onClick={onLogout}
            className={`p-2 rounded-lg transition border ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-800'}`}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* TOP HEADER & NAVIGATION for Mobile */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        <nav className={`lg:hidden border-b ${isDarkMode ? 'border-zinc-800 bg-zinc-900/60' : 'border-stone-200 bg-white/70'} sticky top-0 z-30 backdrop-blur-xl transition-colors duration-200`}>
          <div className="px-6 h-16 flex items-center justify-between">
            <span className={`font-display font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r ${themeColors.gradientText}`}>
              ASCHALEW PMS
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleRole}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition ${isDarkMode ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border-zinc-750' : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-xs'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Guest View</span>
              </button>

              <button 
                onClick={onLogout}
                className={`p-1.5 rounded-lg border transition ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400' : 'hover:bg-stone-100 border-stone-200 text-stone-500'}`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile responsive scrollable tabs */}
          <div className={`flex items-center gap-1.5 px-4 py-2 border-t overflow-x-auto scrollbar-hide ${isDarkMode ? 'border-zinc-850/60 bg-zinc-950/20' : 'border-stone-150 bg-stone-50'}`}>
            {[
              { id: 'dashboard', label: 'Analytics', icon: Activity },
              { id: 'frontdesk', label: 'Front Desk', icon: BedDouble },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'rooms', label: 'Rooms', icon: SlidersHorizontal },
              { id: 'housekeeping', label: 'HK', icon: CheckSquare },
              { id: 'crm', label: 'CRM', icon: Users },
              { id: 'billing', label: 'Folios', icon: DollarSign },
              { id: 'security', label: 'Audit', icon: Shield },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as PMSTab)}
                  className={`py-1.5 px-3 rounded-lg border text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 shrink-0 ${
                    isActive 
                      ? `${themeColors.primaryBg} text-zinc-950 border-transparent shadow-xs` 
                      : `${isDarkMode ? 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400' : 'bg-white border-stone-200 text-stone-600'}`
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Body */}
        <div className="px-6 py-8 flex-grow">
          
          {/* Quick desktop helper header bar */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-stone-900'}`}>
                {activeTab === 'dashboard' && 'Analytics & Reports Dashboard'}
                {activeTab === 'frontdesk' && 'Front Desk & Wake-Up Console'}
                {activeTab === 'bookings' && 'Reservations & Walk-In Desk'}
                {activeTab === 'rooms' && 'Room Inventory & Rate Manager'}
                {activeTab === 'housekeeping' && 'Housekeeping & Maintenance dispatch'}
                {activeTab === 'crm' && 'Loyalty Guest Directory (CRM)'}
                {activeTab === 'billing' && 'Billing, Folios & Split Ledger'}
                {activeTab === 'security' && 'Property Audit Trail Logs'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Aschalew Hotel West Hararghe PMS Core Ledger Client</p>
            </div>

            <button
              onClick={onToggleRole}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800' : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-md'}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Switch to Guest Portal</span>
            </button>
          </div>

          {/* Role Helper Banner */}
          <div className={`mb-6 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 border transition-colors ${
            isDarkMode ? 'bg-amber-500/5 border-amber-500/15' : 'bg-amber-500/10 border-amber-500/25'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-xs font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-stone-800'}`}>
                  Logged in as <span className="text-amber-600 dark:text-amber-400 font-bold">{activeStaffRole}</span>.
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {activeStaffRole === 'Admin' && "Full access to property database schema, billing overrides, and security logs."}
                  {activeStaffRole === 'General Manager' && "Focusing on Revenue metrics (ADR, RevPAR) and daily closing reports."}
                  {activeStaffRole === 'Receptionist' && "Focused on Front-Desk check-ins, guest CRM, morning wake-up alerts and key encoders."}
                  {activeStaffRole === 'Housekeeper' && "Tracking room cleanings, maintenance logs and restocking amenities."}
                  {activeStaffRole === 'Accountant' && "Reviewing split billing logs, corporate invoices and taxes calculations."}
                </p>
              </div>
            </div>
            <button onClick={handleExecuteNightAudit} className="text-[10px] font-mono px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg shadow transition shrink-0">
              🌙 Trigger Night Audit
            </button>
          </div>

        {isLoading ? (
          <div className="text-center py-20 text-zinc-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-mono text-zinc-500">Retrieving Aschalew Property Ledger...</span>
          </div>
        ) : (
          <div>
            
            {/* TAB 1: PMS ANALYTICS & REPORTS */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Gross revenue</span>
                      <h3 className="text-2xl font-black text-amber-400 mt-1">{stats.totalRevenue} ETB</h3>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Rooms: {stats.bookingRevenue} • Service: {stats.serviceRevenue}</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Occupancy Rate</span>
                      <h3 className="text-2xl font-black text-zinc-100 mt-1">{currentOccupancyRate}%</h3>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{totalOccupied} / {totalRoomsCount} Rooms Occupied</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Activity className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Average Daily Rate (ADR)</span>
                      <h3 className="text-2xl font-black text-zinc-100 mt-1">{calculatedADR} ETB</h3>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">RevPAR Yield: {calculatedRevPAR} ETB</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Active Bookings</span>
                      <h3 className="text-2xl font-black text-zinc-100 mt-1">{stats.activeBookingsCount}</h3>
                      <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Checked-in arrivals</span>
                    </div>
                    <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Forecast & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Revenue Distribution Chart */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl col-span-2">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-display font-bold text-sm text-zinc-200">Revenue Performance by Suite Type</h4>
                      <span className="text-[10px] font-mono text-zinc-500">Updates live after room checkouts</span>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.typePopularityChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                          <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                          <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Revenue (ETB)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Room status distribution */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                    <h4 className="font-display font-bold text-sm mb-6 text-zinc-200">Room Status Distribution</h4>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Available', value: rooms.filter(r => r.status === 'available').length },
                              { name: 'Occupied', value: rooms.filter(r => r.status === 'occupied').length },
                              { name: 'Dirty / Clean Needed', value: rooms.filter(r => r.status === 'dirty').length },
                              { name: 'Maintenance', value: rooms.filter(r => r.status === 'maintenance').length },
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: 'Available', color: '#10b981' },
                              { name: 'Occupied', color: '#3b82f6' },
                              { name: 'Dirty / Clean Needed', color: '#f59e0b' },
                              { name: 'Maintenance', color: '#ef4444' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Status legends */}
                    <div className="space-y-2 mt-4 text-[11px] font-semibold">
                      <div className="flex justify-between text-emerald-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> Available</span>
                        <span>{rooms.filter(r => r.status === 'available').length} rooms</span>
                      </div>
                      <div className="flex justify-between text-blue-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full" /> Occupied</span>
                        <span>{rooms.filter(r => r.status === 'occupied').length} rooms</span>
                      </div>
                      <div className="flex justify-between text-amber-500">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Dirty</span>
                        <span>{rooms.filter(r => r.status === 'dirty').length} rooms</span>
                      </div>
                      <div className="flex justify-between text-red-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-red-500 rounded-full" /> Maintenance</span>
                        <span>{rooms.filter(r => r.status === 'maintenance').length} rooms</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Night Audit & Report Summaries */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Daily Night Audit Financial Ledger</h4>
                      <p className="text-[11px] text-zinc-500">Historical logs of nightly revenue postings and check-ins closing audits.</p>
                    </div>
                    <button onClick={handleExecuteNightAudit} className="px-3.5 py-1.5 rounded bg-amber-500 text-zinc-950 text-xs font-bold cursor-pointer hover:bg-amber-400 transition">
                      🌙 Run Night Audit
                    </button>
                  </div>

                  {nightAudits.length === 0 ? (
                    <div className="py-6 text-center text-zinc-500 text-xs font-mono">
                      No night audits performed yet. Please trigger above to post daily revenue records.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {nightAudits.slice(0, 5).map((a, i) => (
                        <div key={i} className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-amber-400 font-bold">Audit #{a.id.split('-')[1]}</span>
                            <span className="text-zinc-500 block text-[10px] mt-0.5">{new Date(a.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:flex gap-6 text-[11px]">
                            <div>
                              <span className="text-zinc-500 block text-[10px]">REVENUE POSTED</span>
                              <span className="text-emerald-400 font-bold">{a.totalRevenuePosted} ETB</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">OCCUPANCY</span>
                              <span className="text-zinc-200 font-bold">{a.occupancyRate}% ({a.occupiedRoomsCount} rms)</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">NO SHOWS CANCELLED</span>
                              <span className="text-red-400 font-bold">{a.noShowsProcessed} bookings</span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block text-[10px]">AUDITOR</span>
                              <span className="text-zinc-400 block">{a.performedBy}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: FRONT DESK & RECEPTION */}
            {activeTab === 'frontdesk' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Arrivals & Departures Desk */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-bold text-sm text-zinc-200">Today's Arrivals &amp; Departures</h4>
                        <p className="text-[11px] text-zinc-500">Real-time status, digital keys encoding, and check-in workflows.</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowWalkInModal(true)} className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                          <Plus className="w-3.5 h-3.5" /> Book Front-Desk / Walk-in
                        </button>
                      </div>
                    </div>

                    {bookings.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic py-6 text-center">No registrations on file today.</p>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((b) => (
                          <div key={b.booking.id} className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-200">{b.booking.guestName}</span>
                                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase font-mono font-bold">{b.booking.status.replace('_', ' ')}</span>
                              </div>
                              <p className="text-zinc-500 text-xs font-mono mt-0.5">{b.booking.guestEmail} • Room {b.room.roomNumber} ({b.room.type})</p>
                              <p className="text-zinc-400 text-[11px] font-mono mt-2">Stay dates: {b.booking.checkIn} to {b.booking.checkOut}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 sm:self-center">
                              {/* Key card encoding */}
                              {codingKeyCardRoom === b.room.roomNumber ? (
                                <button className="px-3 py-1.5 bg-zinc-800 border border-amber-500 text-amber-500 text-[11px] font-bold rounded flex items-center gap-1.5 animate-pulse">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Coding Card...
                                </button>
                              ) : keyCardStatus === 'success' && codingKeyCardRoom === b.room.roomNumber ? (
                                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500 text-[11px] font-bold rounded flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Done
                                </button>
                              ) : (
                                <button onClick={() => encodeKeyCard(b.room.roomNumber)} className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] font-bold rounded flex items-center gap-1.5 transition">
                                  <Smartphone className="w-3.5 h-3.5" /> Program Key Card
                                </button>
                              )}

                              {b.booking.status === 'confirmed' && (
                                <button onClick={() => handleUpdateBookingStatus(b.booking.id, 'checked_in')} className="px-3 py-1.5 bg-amber-500 text-zinc-950 hover:bg-amber-400 text-[11px] font-bold rounded transition">
                                  Check-In
                                </button>
                              )}
                              {b.booking.status === 'checked_in' && (
                                <button onClick={() => handleUpdateBookingStatus(b.booking.id, 'checked_out')} className="px-3 py-1.5 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 text-[11px] font-bold rounded transition">
                                  Check-Out
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wake up & Messenger Desk */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl space-y-6">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Morning Wake-up Alerts</h4>
                      <p className="text-[11px] text-zinc-500">Post breakfast wake-up alarms directly into room logs.</p>
                    </div>

                    <form onSubmit={handleCreateWakeUp} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Select Guest Room</label>
                        <select 
                          value={wakeUpForm.bookingId}
                          onChange={(e) => setWakeUpForm({ ...wakeUpForm, bookingId: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                          required
                        >
                          <option value="">-- Select Active Room --</option>
                          {bookings.filter(b => b.booking.status === 'checked_in').map(b => (
                            <option key={b.booking.id} value={b.booking.id}>RM {b.room.roomNumber} - {b.booking.guestName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Time (HH:MM)</label>
                          <input 
                            type="text" 
                            placeholder="06:30" 
                            value={wakeUpForm.time}
                            onChange={(e) => setWakeUpForm({ ...wakeUpForm, time: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none font-mono"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Morning Notes</label>
                          <input 
                            type="text" 
                            placeholder="Coffee request" 
                            value={wakeUpForm.notes}
                            onChange={(e) => setWakeUpForm({ ...wakeUpForm, notes: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                          />
                        </div>
                      </div>

                      <button type="submit" className="w-full py-1.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded shadow cursor-pointer hover:bg-amber-400 transition">
                        Set Wake-up Alert
                      </button>
                    </form>

                    {/* Active wake-up calls list */}
                    <div className="pt-4 border-t border-zinc-850 space-y-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Alerts</span>
                      {wakeUpCalls.length === 0 ? (
                        <p className="text-zinc-600 text-xs italic">No wakeups scheduled tomorrow.</p>
                      ) : (
                        <div className="space-y-2">
                          {wakeUpCalls.map((w, idx) => (
                            <div key={idx} className="bg-zinc-950/40 p-2.5 rounded border border-zinc-850 flex justify-between items-center text-xs font-mono">
                              <div>
                                <span className="text-amber-400 font-bold">RM {w.roomNumber}</span>
                                <span className="text-zinc-200 block text-[11px] mt-0.5">{w.time} • {w.notes}</span>
                              </div>
                              <div className="flex gap-1.5">
                                {w.status === 'active' ? (
                                  <>
                                    <button onClick={() => handleUpdateWakeUpStatus(idx, 'completed')} className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                                      Done
                                    </button>
                                    <button onClick={() => handleUpdateWakeUpStatus(idx, 'cancelled')} className="p-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-400 text-[10px] font-bold">
                                      ✕
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-zinc-500 uppercase">{w.status}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RESERVATIONS DESK (Walk-ins) */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-display text-xl font-extrabold">Reservations Ledger</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">Filter the complete hotel occupancy timeline, view date grid, and book walk-ins.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Search bookings ledger..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-medium"
                    />
                    <button 
                      onClick={() => {
                        const exportData = filteredBookingsList.map(b => ({
                          "Guest Name": b.booking.guestName,
                          "Guest Email": b.booking.guestEmail,
                          "Room Number": b.room.roomNumber,
                          "Room Type": b.room.type,
                          "Check In": b.booking.checkIn,
                          "Check Out": b.booking.checkOut,
                          "Total Price (ETB)": b.booking.totalPrice,
                          "Booking Status": b.booking.status
                        }));
                        exportToCSV(exportData, "Aschalew_Bookings_Report");
                      }}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      title="Export Bookings to Excel/CSV"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export Excel</span>
                    </button>
                    <button onClick={() => setShowWalkInModal(true)} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Book Walk-In
                    </button>
                  </div>
                </div>

                {/* Grid Calendar Availability matrix viewer */}
                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Room Availability Calendar</h4>
                      <p className="text-[11px] text-zinc-500">Chronological room status timeline over the next 10 days.</p>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded" /> Free</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500 rounded" /> Booked</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[800px] border border-zinc-850 rounded bg-zinc-950/40">
                      {/* Grid Header */}
                      <div className="grid grid-cols-11 border-b border-zinc-850 bg-zinc-900/40 font-mono text-[9px] font-bold text-zinc-400 py-2">
                        <div className="pl-3">Room</div>
                        {timelineDates.map((d, i) => (
                          <div key={i} className="text-center">{d.slice(8, 10)} {new Date(d).toLocaleString('en-US', { weekday: 'short' }).slice(0,1)}</div>
                        ))}
                      </div>

                      {/* Grid Body */}
                      <div className="divide-y divide-zinc-850">
                        {rooms.map((room) => (
                          <div key={room.id} className="grid grid-cols-11 py-2 text-xs font-mono items-center">
                            <div className="pl-3 font-bold text-amber-500">RM {room.roomNumber}</div>
                            {timelineDates.map((date, i) => {
                              // Check if room is booked on this date
                              const isBooked = bookings.some(b => {
                                if (b.booking.roomId !== room.id) return false;
                                if (b.booking.status === 'cancelled' || b.booking.status === 'checked_out') return false;
                                return (date >= b.booking.checkIn && date < b.booking.checkOut);
                              });

                              return (
                                <div key={i} className="px-1 text-center">
                                  {isBooked ? (
                                    <span className="block py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[9px] font-bold uppercase truncate px-1">Booked</span>
                                  ) : (
                                    <span className="block py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase">Free</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table of active bookings */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-850 bg-zinc-900/40 text-[10px] font-bold uppercase text-zinc-400">
                          <th className="p-4">Guest Info</th>
                          <th className="p-4">Room No</th>
                          <th className="p-4">Timeline</th>
                          <th className="p-4 text-right">Rates Charged</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Fulfillment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 text-xs">
                        {filteredBookingsList.map(({ booking, room }) => (
                          <tr key={booking.id} className="hover:bg-zinc-900/20 transition">
                            <td className="p-4">
                              <span className="font-bold text-zinc-200 block">{booking.guestName}</span>
                              <span className="text-zinc-500 text-[11px] font-mono mt-0.5 block">{booking.guestEmail}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-amber-500">RM {room.roomNumber}</td>
                            <td className="p-4 font-mono text-zinc-400">{booking.checkIn} &rarr; {booking.checkOut}</td>
                            <td className="p-4 text-right font-bold text-zinc-200">{booking.totalPrice} ETB</td>
                            <td className="p-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                booking.status === 'checked_in' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                booking.status === 'checked_out' ? 'bg-zinc-800 text-zinc-400' :
                                booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>{booking.status}</span>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => setSelectedBookingFolioId(booking.id)} className="px-2 py-1 bg-zinc-800 hover:bg-zinc-750 text-amber-400 rounded text-[10px] font-mono border border-zinc-700 font-bold transition">
                                View Folio
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ROOM INVENTORY MANAGER */}
            {activeTab === 'rooms' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-display text-xl font-extrabold">Room Inventory &amp; Rate Setup</h3>
                    <p className="text-zinc-400 text-xs mt-0.5">Create, edit, and delete suites, configure floor assignments, nightly rack rates, and room photos.</p>
                  </div>
                  <button onClick={() => {
                    setRoomForm({ id: 0, roomNumber: '', type: 'standard', price: 1500, status: 'available', amenities: '', imageUrl: '', floor: 1 });
                    setShowAddRoomModal(true);
                  }} className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add New Room
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rooms.map((room) => {
                    // Pull floor detail from extraRoom list
                    const extra = nightAudits.length >= 0 ? 1 : 1; // simple fallback
                    return (
                      <div key={room.id} className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden flex flex-col justify-between">
                        <div>
                          <div className="h-44 bg-zinc-950 relative">
                            <img src={room.imageUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600'} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-3 left-3 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded text-xs font-mono font-bold text-amber-500">
                              Room {room.roomNumber}
                            </div>
                            <div className="absolute bottom-3 right-3 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded text-xs font-mono font-bold text-zinc-200">
                              {room.price} ETB / Night
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-display font-bold text-sm text-zinc-200 capitalize">{room.type} Suite</h4>
                                <span className="text-[10px] text-zinc-500 font-mono block">Floor level: {room.roomNumber.charAt(0)}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                room.status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                room.status === 'occupied' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>{room.status}</span>
                            </div>

                            <p className="text-zinc-400 text-xs font-mono leading-relaxed">{room.amenities}</p>
                          </div>
                        </div>

                        <div className="p-5 pt-0 flex gap-2 justify-end">
                          <button onClick={() => {
                            setRoomForm({
                              id: room.id,
                              roomNumber: room.roomNumber,
                              type: room.type,
                              price: room.price,
                              status: room.status,
                              amenities: room.amenities || '',
                              imageUrl: room.imageUrl || '',
                              floor: parseInt(room.roomNumber.charAt(0)) || 1
                            });
                            setShowEditRoomModal(true);
                          }} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/50 flex items-center justify-center transition cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteRoom(room.id, room.roomNumber)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/20 flex items-center justify-center transition cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: HOUSEKEEPING & MAINTENANCE */}
            {activeTab === 'housekeeping' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rosters / Tasks list */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl col-span-2 space-y-6">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Cleaning Assignment Log</h4>
                      <p className="text-[11px] text-zinc-500">Track and schedule routine or deep cleaning, sanitizing, and maintenance schedules.</p>
                    </div>

                    <div className="space-y-4">
                      {housekeepingLogs.map(({ room, schedule }) => (
                        <div key={room.id} className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200">Room {room.roomNumber} ({room.type})</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                room.status === 'dirty' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
                              }`}>{room.status}</span>
                            </div>
                            <p className="text-zinc-400 text-xs mt-1">Staff assigned: <span className="text-amber-400 font-bold">{schedule.assignedStaff}</span> ({schedule.scheduleTime})</p>
                            <p className="text-zinc-500 text-[11px] italic mt-1 font-mono">Task: {schedule.notes || "Standard cleanup checklist completed."}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {schedule.status === 'pending' || room.status === 'dirty' ? (
                              <button onClick={() => handleUpdateRoomStatus(room.id, 'available')} className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition">
                                Complete &amp; Cleaned
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-500 font-mono font-semibold uppercase">Clean &amp; Ready</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dispatch Staff Panel */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Dispatch Housekeeping Run</h4>
                      <p className="text-[11px] text-zinc-500">Assign cleaning staff to dirty or vacant rooms immediately.</p>
                    </div>

                    <form onSubmit={handleAssignHousekeeping} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Target Room No</label>
                        <select 
                          value={hkTaskForm.roomId}
                          onChange={(e) => setHkTaskForm({ ...hkTaskForm, roomId: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                          required
                        >
                          <option value="">-- Choose Room --</option>
                          {rooms.map(r => (
                            <option key={r.id} value={r.id}>RM {r.roomNumber} ({r.status})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Assigned Staff Roster</label>
                        <select 
                          value={hkTaskForm.assignedStaff}
                          onChange={(e) => setHkTaskForm({ ...hkTaskForm, assignedStaff: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                        >
                          <option value="Abebech Housekeeper">Abebech Housekeeper</option>
                          <option value="Yonas Sanitizer">Yonas Sanitizer</option>
                          <option value="Chala Maintenance Eng">Chala Maintenance Eng</option>
                          <option value="Tigest Bed-maker">Tigest Bed-maker</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Sched Hour</label>
                          <input 
                            type="text" 
                            placeholder="11:30 AM" 
                            value={hkTaskForm.scheduleTime}
                            onChange={(e) => setHkTaskForm({ ...hkTaskForm, scheduleTime: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Clean Type</label>
                          <select 
                            value={hkTaskForm.taskType}
                            onChange={(e) => setHkTaskForm({ ...hkTaskForm, taskType: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none text-[11px]"
                          >
                            <option value="routine_clean">Routine Cleaning</option>
                            <option value="deep_clean">Deep Clean (Checkout)</option>
                            <option value="maintenance_fix">Maintenance Inspection</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Special instructions</label>
                        <textarea 
                          rows={2}
                          placeholder="Change mattress linens, stock Traditional Coffee beans cup..."
                          value={hkTaskForm.notes}
                          onChange={(e) => setHkTaskForm({ ...hkTaskForm, notes: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none resize-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-1.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded shadow cursor-pointer hover:bg-amber-400 transition">
                        Dispatch staff
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: GUEST CRM PORTAL */}
            {activeTab === 'crm' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Guest Profiles Database */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl col-span-2 space-y-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-display font-bold text-sm text-zinc-200">CRM Guests Directory</h4>
                        <p className="text-[11px] text-zinc-500">Track ID proof numbers, preferences and reward loyalty points.</p>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="Search guests database..."
                          value={guestSearch}
                          onChange={(e) => setGuestSearch(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
                        />
                        <button 
                          onClick={() => {
                            const exportData = filteredGuestsList.map(g => ({
                              "Guest Name": g.guestName,
                              "Guest Email": g.guestEmail,
                              "Contact Number": g.contactNumber,
                              "ID Proof": g.idProof,
                              "Loyalty Points": g.loyaltyPoints,
                              "Special Preferences": g.preferences || "None"
                            }));
                            exportToCSV(exportData, "Aschalew_Guests_CRM");
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center gap-1.5 transition cursor-pointer"
                          title="Export Guests Directory to Excel"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3">
                      {filteredGuestsList.map((g, idx) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                            <span className="font-bold text-zinc-200">{g.guestName}</span>
                            <p className="text-zinc-500 text-xs font-mono mt-0.5">{g.guestEmail} • {g.contactNumber}</p>
                            <p className="text-zinc-400 text-xs mt-2">ID Verification: <span className="text-amber-400 font-mono font-bold">{g.idProof}</span></p>
                            <p className="text-zinc-400 text-[11px] mt-1 italic">Preferences: "{g.preferences || "No special requests on file."}"</p>
                          </div>
                          
                          <div className="flex flex-col justify-between items-end gap-2 text-right">
                            <span className="px-2.5 py-0.5 rounded text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-black">
                              {g.loyaltyPoints} Loyalty Points
                            </span>
                            <button onClick={() => {
                              setCustomNotification({ ...customNotification, email: g.guestEmail, name: g.guestName });
                            }} className="text-amber-400 hover:underline text-[11px] font-bold">
                              Send Alert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Messaging simulator */}
                  <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">WhatsApp / Email Simulator</h4>
                      <p className="text-[11px] text-zinc-500">Simulate guest alert delivery notifications during stay loops.</p>
                    </div>

                    <form onSubmit={handleSendCustomNotification} className="space-y-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Selected Recipient</label>
                        <select 
                          value={customNotification.email}
                          onChange={(e) => setCustomNotification({ ...customNotification, email: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                          required
                        >
                          <option value="">-- Choose Guest --</option>
                          {crmGuests.map((g, i) => (
                            <option key={i} value={g.guestEmail}>{g.guestName} ({g.guestEmail})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Dispatch Channel</label>
                        <select 
                          value={customNotification.channel}
                          onChange={(e: any) => setCustomNotification({ ...customNotification, channel: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none"
                        >
                          <option value="WhatsApp">WhatsApp Message</option>
                          <option value="SMS">SMS Text Alert</option>
                          <option value="Email">Secure Email PDF Statement</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Message content</label>
                        <textarea 
                          rows={4}
                          placeholder="Write custom guest alert details here..."
                          value={customNotification.message}
                          onChange={(e) => setCustomNotification({ ...customNotification, message: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 text-xs rounded focus:outline-none resize-none"
                          required
                        />
                      </div>

                      <button type="submit" className="w-full py-1.5 bg-amber-500 text-zinc-950 font-bold text-xs rounded shadow flex items-center justify-center gap-1.5 cursor-pointer hover:bg-amber-400 transition">
                        <Send className="w-3.5 h-3.5" /> Dispatch Alert
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: BILLING & FOLIO MANAGEMENT */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Select Folio Guest */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl space-y-3 self-start">
                    <h4 className="font-display font-bold text-sm text-zinc-200 mb-2">Select Guest Folio</h4>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {bookings.map(b => (
                        <button 
                          key={b.booking.id}
                          onClick={() => setSelectedBookingFolioId(b.booking.id)}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-mono transition block ${
                            selectedBookingFolioId === b.booking.id 
                              ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                              : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span className="block font-sans font-bold text-zinc-200">{b.booking.guestName}</span>
                          <span className="block mt-1 text-[11px] text-zinc-500">RM {b.room.roomNumber} • Folio #{b.booking.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Billing calculations & Folio statement */}
                  {activeFolioData ? (
                    <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl col-span-2 space-y-6">
                      <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                        <div>
                          <h4 className="font-display font-bold text-base text-zinc-100">Folio Statement Invoice</h4>
                          <p className="text-zinc-500 text-xs font-mono">Invoice Ref: #ASCH-2026-00{activeFolioData.booking.id}</p>
                        </div>
                        <button onClick={() => window.print()} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded flex items-center gap-1.5 transition">
                          <Download className="w-3.5 h-3.5" /> Print Statement
                        </button>
                      </div>

                      {/* Folio Grid Info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono bg-zinc-950/40 p-4 rounded-xl border border-zinc-850">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">GUEST NAME</span>
                          <span className="text-zinc-300 font-sans font-bold">{activeFolioData.booking.guestName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">ROOM ASSIGNED</span>
                          <span className="text-amber-500 font-bold">RM {activeFolioData.room.roomNumber} ({activeFolioData.room.type})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">CHECK-IN / OUT</span>
                          <span className="text-zinc-400 block">{activeFolioData.booking.checkIn} to {activeFolioData.booking.checkOut}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">RATE PACKAGE</span>
                          <span className="text-zinc-400 block">{activeFolioData.folio?.ratePlan || 'Standard Rack Rate'}</span>
                        </div>
                      </div>

                      {/* Split adjustments inputs panel */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Apply Rates &amp; Discounts Override</span>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Rate Plan</label>
                              <select 
                                value={adjustmentForm.ratePlan}
                                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, ratePlan: e.target.value })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full"
                              >
                                <option value="Standard Rack Rate">Rack Rate</option>
                                <option value="Corporate Special">Corporate (15% Off)</option>
                                <option value="Weekend Special">Weekend (10% Off)</option>
                                <option value="Loyalty Package">Loyalty (5% Off)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Discount (ETB)</label>
                              <input 
                                type="number" 
                                value={adjustmentForm.discount}
                                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, discount: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Service Charge (%)</label>
                              <input 
                                type="number" 
                                value={adjustmentForm.serviceCharge}
                                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, serviceCharge: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">VAT Tax (%)</label>
                              <input 
                                type="number" 
                                value={adjustmentForm.vat}
                                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, vat: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full font-mono"
                              />
                            </div>
                          </div>

                          <button onClick={handleUpdateBilling} className="w-full py-1.5 bg-amber-500 text-zinc-950 text-xs font-bold rounded shadow transition hover:bg-amber-400">
                            Apply adjustments
                          </button>
                        </div>

                        {/* Split transactions processor */}
                        <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-4">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Record Split Folio Transactions</span>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Payment Method</label>
                              <select 
                                value={paymentForm.method}
                                onChange={(e: any) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full"
                              >
                                <option value="cash">Cash payment</option>
                                <option value="card">Credit Card swipe</option>
                                <option value="digital_wallet">Mobile Telebirr</option>
                                <option value="invoice">Corporate Invoicing</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-1">Split Amount (ETB)</label>
                              <input 
                                type="number" 
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseInt(e.target.value) || 0 })}
                                className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Payment Reference Notes</label>
                            <input 
                              type="text" 
                              value={paymentForm.description}
                              onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                              placeholder="Partial bill split reference"
                              className="bg-zinc-900 border border-zinc-800 p-1.5 text-xs rounded w-full"
                            />
                          </div>

                          <button onClick={handleRecordPayment} className="w-full py-1.5 bg-emerald-500 text-zinc-950 text-xs font-bold rounded shadow transition hover:bg-emerald-400">
                            Record Payment Transaction
                          </button>
                        </div>
                      </div>

                      {/* Receipts breakdown list */}
                      <div className="pt-4 space-y-3 font-mono text-xs">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Charges &amp; Transactions breakdown</span>
                        
                        <div className="bg-zinc-950/40 border border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-850">
                          <div className="p-3 flex justify-between">
                            <span className="text-zinc-500">Nightly Room Charges</span>
                            <span className="text-zinc-300">{activeFolioData.summary.roomCharge} ETB</span>
                          </div>
                          
                          {activeFolioData.services.length > 0 && (
                            <div className="p-3 bg-zinc-900/10">
                              <span className="text-zinc-500 block mb-1">Room Service / Cleaning orders</span>
                              {activeFolioData.services.filter((s: any) => s.status === 'completed').map((s: any, idx: number) => (
                                <div key={idx} className="flex justify-between pl-3 text-[11px] text-zinc-400 py-0.5">
                                  <span>{s.item} (Qty: {s.quantity})</span>
                                  <span>{s.cost} ETB</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="p-3 flex justify-between">
                            <span className="text-zinc-500">Negotiated discount</span>
                            <span className="text-red-400">-{activeFolioData.summary.discount} ETB</span>
                          </div>

                          <div className="p-3 flex justify-between bg-zinc-900/30 font-bold text-zinc-200">
                            <span>Subtotal</span>
                            <span>{activeFolioData.summary.subtotal} ETB</span>
                          </div>

                          <div className="p-3 flex justify-between text-[11px]">
                            <span className="text-zinc-500">Service Charge ({activeFolioData.folio?.serviceCharge || 10}%)</span>
                            <span className="text-zinc-400">+{activeFolioData.summary.serviceChargeAmount} ETB</span>
                          </div>

                          <div className="p-3 flex justify-between text-[11px]">
                            <span className="text-zinc-500">VAT Tax ({activeFolioData.folio?.vat || 15}%)</span>
                            <span className="text-zinc-400">+{activeFolioData.summary.vatAmount} ETB</span>
                          </div>

                          <div className="p-3 flex justify-between bg-zinc-900/50 font-bold text-amber-500 text-sm">
                            <span>Total Gross Folio Bill</span>
                            <span>{activeFolioData.summary.totalAmount} ETB</span>
                          </div>

                          {/* Paid payments ledger */}
                          {activeFolioData.folio?.payments?.length > 0 && (
                            <div className="p-3 bg-zinc-900/20">
                              <span className="text-zinc-500 block mb-1">Recorded Payments</span>
                              {activeFolioData.folio.payments.map((p: any, idx: number) => (
                                <div key={idx} className="flex justify-between pl-3 text-[11px] text-emerald-400 py-1">
                                  <span>{new Date(p.timestamp).toLocaleDateString()} - {p.description} ({p.method})</span>
                                  <span>-{p.amount} ETB</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="p-4 flex justify-between bg-amber-500/10 border-t border-amber-500/20 font-bold text-sm">
                            <span className="text-amber-400">Outstanding Balance Due</span>
                            <span className="text-amber-400">{activeFolioData.summary.balanceDue} ETB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-zinc-500 text-xs font-mono">
                      Please select a guest from the left panel to display dynamic folio calculations.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 8: SECURITY & STAFF AUDIT TRAIL LOGS */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security tools */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl space-y-4 col-span-1 self-start">
                    <h4 className="font-display font-bold text-sm text-zinc-200">System Security Options</h4>
                    <p className="text-[11px] text-zinc-500">HMS database encryption checks, regular snapshots, and data protection compliance logs.</p>
                    
                    <div className="bg-zinc-950/40 p-4 rounded-lg border border-zinc-850 space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Database Encryption</span>
                        <span className="text-emerald-400 font-bold font-mono">AES-256 ACTIVE</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">OAuth Security</span>
                        <span className="text-emerald-400 font-bold font-mono">JWT AUTHENTICATED</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Data Compliance</span>
                        <span className="text-zinc-400 font-mono">GDPR / Ethiopian Procl.</span>
                      </div>
                    </div>

                    <button onClick={handleBackupDatabase} className="w-full py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded shadow transition hover:bg-amber-400 flex items-center justify-center gap-1.5 cursor-pointer">
                      <Download className="w-4 h-4" /> Download Encrypted Backup
                    </button>
                  </div>

                  {/* Audit trails */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl col-span-2 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-display font-bold text-sm text-zinc-200">Staff Activity Log Trails</h4>
                        <p className="text-[11px] text-zinc-500">Searchable history of critical reception and billing actions performed in HMS.</p>
                      </div>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-1 rounded font-bold">DURABLE LEDGER</span>
                    </div>

                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-zinc-950/30 border border-zinc-850/60 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between gap-4 text-xs font-mono">
                          <div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase mr-2">{log.action}</span>
                            <span className="text-zinc-300 font-sans">{log.details}</span>
                            <span className="block text-[10px] text-zinc-500 mt-1 font-mono">Operator: {log.userEmail} ({log.role})</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 sm:self-center font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
        </div>
      </div>

      {/* MODAL 1: ADD ROOM */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
              <h4 className="font-display font-bold text-base text-zinc-100">Add Room to PMS</h4>
              <button onClick={() => setShowAddRoomModal(false)} className="text-zinc-400 hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Room Number</label>
                  <input 
                    type="text" 
                    placeholder="101" 
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Floor Level</label>
                  <input 
                    type="number" 
                    placeholder="1" 
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Suite Type</label>
                  <select 
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="executive">Executive</option>
                    <option value="family">Family Suite</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Nightly Price (ETB)</label>
                  <input 
                    type="number" 
                    placeholder="1500" 
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: parseInt(e.target.value) || 1500 })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Amenities</label>
                <input 
                  type="text" 
                  placeholder="Double Bed, Wi-Fi, mountain view, Traditional Espresso machine" 
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Photo Image URL</label>
                <input 
                  type="text" 
                  placeholder="https://images.unsplash.com/..." 
                  value={roomForm.imageUrl}
                  onChange={(e) => setRoomForm({ ...roomForm, imageUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded shadow transition cursor-pointer">
                Add Room to PMS
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ROOM */}
      {showEditRoomModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
              <h4 className="font-display font-bold text-base text-zinc-100">Edit Room Parameters</h4>
              <button onClick={() => setShowEditRoomModal(false)} className="text-zinc-400 hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Room Number</label>
                  <input 
                    type="text" 
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Floor Level</label>
                  <input 
                    type="number" 
                    value={roomForm.floor}
                    onChange={(e) => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Suite Type</label>
                  <select 
                    value={roomForm.type}
                    onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="executive">Executive</option>
                    <option value="family">Family Suite</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Nightly Price (ETB)</label>
                  <input 
                    type="number" 
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: parseInt(e.target.value) || 1500 })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Amenities</label>
                <input 
                  type="text" 
                  value={roomForm.amenities}
                  onChange={(e) => setRoomForm({ ...roomForm, amenities: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Photo Image URL</label>
                <input 
                  type="text" 
                  value={roomForm.imageUrl}
                  onChange={(e) => setRoomForm({ ...roomForm, imageUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                />
              </div>

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded shadow transition cursor-pointer">
                Save Room changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WALK-IN / RESERVATION SCHEDULER */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-lg w-full space-y-4 my-8">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
              <h4 className="font-display font-bold text-base text-zinc-100">Book Reservation / Walk-In</h4>
              <button onClick={() => setShowWalkInModal(false)} className="text-zinc-400 hover:text-zinc-200 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateWalkIn} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Select Room Inventory</label>
                  <select 
                    value={walkInForm.roomId}
                    onChange={(e) => setWalkInForm({ ...walkInForm, roomId: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  >
                    <option value="">-- Choose Vacant --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>RM {r.roomNumber} - {r.type} ({r.price} ETB)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Rate Package Plan</label>
                  <select 
                    value={walkInForm.ratePlan}
                    onChange={(e) => setWalkInForm({ ...walkInForm, ratePlan: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  >
                    <option value="Standard Rack Rate">Standard Rack Rate</option>
                    <option value="Corporate Special">Corporate Discount (15% Off)</option>
                    <option value="Weekend Special">Weekend Package (10% Off)</option>
                    <option value="Loyalty Package">Loyalty Package (5% Off)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Check-In Date</label>
                  <input 
                    type="date" 
                    value={walkInForm.checkIn}
                    onChange={(e) => setWalkInForm({ ...walkInForm, checkIn: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Check-Out Date</label>
                  <input 
                    type="date" 
                    value={walkInForm.checkOut}
                    onChange={(e) => setWalkInForm({ ...walkInForm, checkOut: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Guest Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Obsa Figo" 
                    value={walkInForm.guestName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestName: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Guest Email Address</label>
                  <input 
                    type="email" 
                    placeholder="obsafigo@gmail.com" 
                    value={walkInForm.guestEmail}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestEmail: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="col-span-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Guests Count</label>
                  <input 
                    type="number" 
                    min={1}
                    value={walkInForm.guestsCount}
                    onChange={(e) => setWalkInForm({ ...walkInForm, guestsCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Mobile Contact No</label>
                  <input 
                    type="text" 
                    placeholder="+251 900 123 456" 
                    value={walkInForm.contactNumber}
                    onChange={(e) => setWalkInForm({ ...walkInForm, contactNumber: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">ID Proof Doc Number</label>
                  <input 
                    type="text" 
                    placeholder="Passport, National ID No" 
                    value={walkInForm.idProof}
                    onChange={(e) => setWalkInForm({ ...walkInForm, idProof: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Guest Segment</label>
                  <select 
                    value={walkInForm.segment}
                    onChange={(e) => setWalkInForm({ ...walkInForm, segment: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none"
                  >
                    <option value="Walk-in">Walk-in Client</option>
                    <option value="Corporate">Corporate Account</option>
                    <option value="Group">Group tour booking</option>
                    <option value="Online">Online pre-booked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Room Preferences &amp; Special Requests</label>
                <textarea 
                  rows={2}
                  placeholder="E.g. Traditional espresso setup, mountain views..." 
                  value={walkInForm.preferences}
                  onChange={(e) => setWalkInForm({ ...walkInForm, preferences: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs rounded text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded shadow transition cursor-pointer">
                Confirm Front-Desk Booking
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
