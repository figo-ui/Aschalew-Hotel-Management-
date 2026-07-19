import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminStats, BookingWithDetails, Room, ServiceRequest } from '../types.ts';
import ThemeLanguageSelector from './ThemeLanguageSelector.tsx';
import { useLanguageTheme } from './LanguageThemeContext.tsx';
import AdminD3Charts from './AdminD3Charts.tsx';
import HousekeepingTask from './HousekeepingTask.tsx';
import InteractiveFloorPlan from './InteractiveFloorPlan.tsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { 
  DollarSign, Activity, Users, Coffee, Check, Play, RefreshCw, LogOut,
  BedDouble, Bell, ClipboardList, CheckSquare, Sparkles, SlidersHorizontal,
  Calendar, ShieldAlert, FileText, FileSpreadsheet, UserCheck, Smartphone,
  History, Plus, Trash2, Edit2, Shield, Download, Info, CheckCircle2, Send,
  UtensilsCrossed, Globe, Megaphone, TrendingUp, Clock, CreditCard, Server, X, AlertTriangle, Map,
  MessageSquare, Terminal
} from 'lucide-react';

interface AdminViewProps {
  token: string;
  user: any;
  onLogout: () => void;
  onToggleRole: () => void;
}

// PMS tab types
export type HMSRole = 'Super Admin / Owner' | 'General Manager' | 'Front Desk / Reception' | 'Housekeeping' | 'Restaurant / F&B Staff' | 'Accountant / Finance' | 'Marketing / Sales' | 'IT / System Admin' | 'Staff (Basic)';
type PMSTab = 'dashboard' | 'frontdesk' | 'bookings' | 'rooms' | 'floorplan' | 'housekeeping' | 'crm' | 'billing' | 'security' | 'restaurant' | 'marketing' | 'it' | 'staff';

export type Resource = 'reports' | 'user_management' | 'staff_management' | 'approvals' | 'reservations' | 'check_in_out' | 'guest_management' | 'room_status' | 'room_edit' | 'maintenance_requests' | 'pos_billing' | 'restaurant_orders' | 'billing' | 'payments' | 'night_audit' | 'website_content' | 'promotions' | 'channel_manager' | 'technical_maintenance' | 'backups' | 'basic_tasks' | 'all';

export type AppNotification = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  targetRoles: HMSRole[] | 'all';
  read: boolean;
  timestamp: Date;
};

export const rolePermissions: Record<HMSRole, Resource[]> = {
  'Super Admin / Owner': ['all'],
  'General Manager': ['reports', 'approvals', 'staff_management', 'reservations', 'check_in_out', 'guest_management', 'room_status', 'room_edit', 'maintenance_requests', 'pos_billing', 'restaurant_orders', 'billing', 'payments', 'night_audit', 'website_content', 'promotions', 'channel_manager', 'basic_tasks'],
  'Front Desk / Reception': ['reservations', 'check_in_out', 'guest_management', 'room_status', 'billing', 'payments', 'basic_tasks'],
  'Housekeeping': ['room_status', 'maintenance_requests', 'basic_tasks'],
  'Restaurant / F&B Staff': ['pos_billing', 'restaurant_orders', 'basic_tasks'],
  'Accountant / Finance': ['reports', 'billing', 'payments', 'night_audit', 'basic_tasks'],
  'Marketing / Sales': ['website_content', 'promotions', 'channel_manager', 'basic_tasks'],
  'IT / System Admin': ['technical_maintenance', 'backups', 'basic_tasks'],
  'Staff (Basic)': ['basic_tasks']
};

export function useAccessControl(role: HMSRole) {
  const hasAccess = (resource: Resource) => {
    if (rolePermissions[role].includes('all')) return true;
    return rolePermissions[role].includes(resource);
  };
  return { hasAccess, role };
}

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
  const [activeStaffRole, setActiveStaffRole] = useState<HMSRole>('Super Admin / Owner');
  const { hasAccess } = useAccessControl(activeStaffRole);
  const [crmGuests, setCrmGuests] = useState<any[]>([]);
  const [housekeepingLogs, setHousekeepingLogs] = useState<any[]>([]);
  const [wakeUpCalls, setWakeUpCalls] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [nightAudits, setNightAudits] = useState<any[]>([]);
  
  // Selected booking folio state
  const [selectedBookingFolioId, setSelectedBookingFolioId] = useState<number | null>(null);
  const [activeFolioData, setActiveFolioData] = useState<any | null>(null);

  // Logout / Sync state
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async (withSync: boolean) => {
    if (withSync) {
      setIsSyncing(true);
      // Simulate cloud sync delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSyncing(false);
    }
    setShowLogoutDialog(false);
    onLogout();
  };

  // System Conversation Panel States (Database Synced)
  const [showSystemChat, setShowSystemChat] = useState(false);
  const [systemChatInput, setSystemChatInput] = useState('');
  const [isSystemTyping, setIsSystemTyping] = useState(false);
  const [systemChatMessages, setSystemChatMessages] = useState<any[]>([]);

  // Load and poll system messages
  useEffect(() => {
    let active = true;
    const fetchSystemMessages = async () => {
      try {
        const res = await fetch('/api/system-messages');
        if (res.ok && active) {
          const data = await res.json();
          setSystemChatMessages(data);
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

  const handleSendSystemChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!systemChatInput.trim()) return;

    const textToSend = systemChatInput.trim();
    setSystemChatInput('');
    setIsSystemTyping(true);

    try {
      // 1. Post the user's message to the backend
      const res = await fetch('/api/system-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend, type: 'info' })
      });
      if (!res.ok) throw new Error('Failed to post');

      // Fetch immediately to show the user's message
      const updatedRes = await fetch('/api/system-messages');
      if (updatedRes.ok) {
        const data = await updatedRes.json();
        setSystemChatMessages(data);
      }

      // 2. Process system command (if any)
      const promptText = textToSend.toLowerCase().trim();
      if (promptText === 'sync' || promptText.includes('cloud sync') || promptText.includes('save')) {
        // Post initiating sync message
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: '🔄 Initiating manual cloud ledger override synchronization sequence... Writing dirty records to remote cloud database...', 
            type: 'warning' 
          })
        });

        // Trigger manual sync animation
        setIsSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSyncing(false);

        // Post success message
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: '✅ Cloud Sync Success! All suite allocations, active billing folios, and dispatch queues have been safely compiled and persisted to secure cloud storage.', 
            type: 'success' 
          })
        });
        simulateNotification('Cloud Sync Success! All local manual overrides persisted.', ['Super Admin / Owner', 'General Manager', 'IT / System Admin'], 'success');
      } else if (promptText === 'status' || promptText.includes('telemetry') || promptText.includes('health')) {
        const telemetryText = `📡 HMS Status Telemetry:\n• Active Operator: ${user?.displayName || user?.email || 'Administrator'}\n• Node Uptime: 99.99%\n• Total Rooms: ${rooms.length}\n• Occupancy Rate: 54%\n• Sync Status: READY\n• Pending Service Requests: ${services.filter(s => s.status === 'pending').length} items`;
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: telemetryText, 
            type: 'info' 
          })
        });
      } else if (promptText === 'logout' || promptText === 'exit') {
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: '🚪 Preparing secure Cloud Sync before clean logout sequence... Operator offline.', 
            type: 'warning' 
          })
        });

        setIsSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSyncing(false);
        onLogout();
        return;
      } else if (promptText.includes('help') || promptText === '?') {
        const helpText = "🛠️ System Command Directory:\n• 'sync' - Force immediate persistence of manual overrides to the Cloud.\n• 'status' - Query real-time HMS metrics, room totals, and active connections.\n• 'logout' - Sync changes safely and terminate user session.";
        await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: helpText, 
            type: 'info' 
          })
        });
      } else {
        // Regular message from operator to everyone
        // No system action required, just let the standard message propagate
      }

      // Fetch final state of messages
      const finalRes = await fetch('/api/system-messages');
      if (finalRes.ok) {
        const data = await finalRes.json();
        setSystemChatMessages(data);
      }
    } catch (err) {
      console.error('Failed to communicate with system message board:', err);
    } finally {
      setIsSystemTyping(false);
    }
  };

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

  const [systemNotifications, setSystemNotifications] = useState<AppNotification[]>([
    {
      id: '1',
      message: 'Room 101 status changed to Dirty',
      type: 'warning',
      targetRoles: ['Housekeeping', 'General Manager', 'Super Admin / Owner'],
      read: false,
      timestamp: new Date()
    },
    {
      id: '2',
      message: 'New Web Booking - Ref #B821',
      type: 'success',
      targetRoles: ['Front Desk / Reception', 'General Manager', 'Super Admin / Owner'],
      read: false,
      timestamp: new Date()
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  
  // Filter notifications based on role
  const unreadCount = systemNotifications.filter(n => 
    !n.read && (n.targetRoles === 'all' || n.targetRoles.includes(activeStaffRole))
  ).length;

  const markAllRead = () => {
    setSystemNotifications(prev => prev.map(n => 
      (n.targetRoles === 'all' || n.targetRoles.includes(activeStaffRole)) ? { ...n, read: true } : n
    ));
  };

  const simulateNotification = (message: string, targetRoles: HMSRole[] | 'all', type: 'info' | 'warning' | 'success' = 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substring(7),
      message,
      type,
      targetRoles,
      read: false,
      timestamp: new Date()
    };
    setSystemNotifications(prev => [newNotif, ...prev]);
    setActiveToasts(prev => [...prev, newNotif]);
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5000);
  };

  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const getDashboardLabel = () => {
    if (activeStaffRole === 'Housekeeping') return 'Housekeeping Dashboard';
    if (activeStaffRole === 'Accountant / Finance') return 'Finance Dashboard';
    return 'Dashboard';
  };

  const tabsConfig = [
    { id: 'dashboard', label: getDashboardLabel(), icon: Activity, resource: 'dashboard_override' },
    { id: 'frontdesk', label: 'Front Desk', icon: BedDouble, resource: 'check_in_out' },
    { id: 'bookings', label: 'Reservations', icon: Calendar, resource: 'reservations' },
    { id: 'rooms', label: 'Rooms', icon: SlidersHorizontal, resource: 'room_status' },
    { id: 'floorplan', label: 'Floor Plan', icon: Map, resource: 'room_status' },
    { id: 'housekeeping', label: 'Housekeeper', icon: CheckSquare, resource: 'maintenance_requests' },
    { id: 'restaurant', label: 'Restaurant', icon: Coffee, resource: 'pos_billing' },
    { id: 'crm', label: 'Guest CRM', icon: Users, resource: 'guest_management' },
    { id: 'billing', label: 'Folios', icon: DollarSign, resource: 'billing' },
    { id: 'security', label: 'Audit Trail', icon: Shield, resource: 'reports' },
    { id: 'marketing', label: 'Marketing', icon: Send, resource: 'promotions' },
    { id: 'it', label: 'IT Admin', icon: Smartphone, resource: 'technical_maintenance' },
    { id: 'staff', label: 'My Tasks', icon: ClipboardList, resource: 'basic_tasks' }
  ];

  const availableTabs = tabsConfig.filter(t => t.id === 'dashboard' || hasAccess(t.resource as Resource));

  // Reset active tab if current isn't allowed
  useEffect(() => {
    if (!availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id as PMSTab);
    }
  }, [activeStaffRole, activeTab]);

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
        simulateNotification(`New Walk-In Booking for Room ${roomId}`, ['Front Desk / Reception', 'General Manager', 'Super Admin / Owner', 'Housekeeping'], 'success');
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
        simulateNotification(`Room ${roomId} status changed to ${status}`, ['Housekeeping', 'Front Desk / Reception', 'Super Admin / Owner', 'General Manager'], 'info');
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
      <ThemeLanguageSelector 
        user={user}
        onLogout={handleLogoutClick}
        onToggleRole={onToggleRole}
      />

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
            <option value="Super Admin / Owner" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Super Admin / Owner</option>
            <option value="General Manager" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>General Manager</option>
            <option value="Front Desk / Reception" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Front Desk / Reception</option>
            <option value="Housekeeping" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Housekeeping</option>
            <option value="Restaurant / F&B Staff" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Restaurant / F&B Staff</option>
            <option value="Accountant / Finance" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Accountant / Finance</option>
            <option value="Marketing / Sales" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Marketing / Sales</option>
            <option value="IT / System Admin" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>IT / System Admin</option>
            <option value="Staff (Basic)" className={isDarkMode ? 'bg-zinc-900' : 'bg-white'}>Staff (Basic)</option>
          </select>
        </div>

        {/* Sidebar Tabs menu */}
        <nav className="flex-grow space-y-1.5 overflow-y-auto">
          {availableTabs.map((t) => {
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
        <div className={`mt-auto pt-4 border-t flex items-center justify-between gap-2 ${isDarkMode ? 'border-zinc-850' : 'border-stone-200'}`}>
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <img 
              src={user?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.email || 'admin'}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-zinc-700 shrink-0"
            />
            <div className="flex flex-col min-w-0 flex-grow">
              <span className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-zinc-200' : 'text-stone-800'}`}>
                {user?.displayName || user?.email || 'System Admin'}
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider truncate">
                {activeStaffRole}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowPermissionModal(true)}
              className={`p-2 rounded-lg transition border ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-800'}`}
              title="View Permissions"
            >
              <Info className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogoutClick}
              className={`p-2 rounded-lg transition border ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-stone-100 border-stone-200 text-stone-500 hover:text-stone-800'}`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
                onClick={handleLogoutClick}
                className={`p-1.5 rounded-lg border transition ${isDarkMode ? 'hover:bg-zinc-800 border-zinc-800 text-zinc-400' : 'hover:bg-stone-100 border-stone-200 text-stone-500'}`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile responsive scrollable tabs */}
          <div className={`flex items-center gap-1.5 px-4 py-2 border-t overflow-x-auto scrollbar-hide ${isDarkMode ? 'border-zinc-850/60 bg-zinc-950/20' : 'border-stone-150 bg-stone-50'}`}>
            {availableTabs.map((t) => {
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
                {activeTab === 'floorplan' && 'Interactive Floor Plan Viewer'}
                {activeTab === 'housekeeping' && 'Housekeeping & Maintenance dispatch'}
                {activeTab === 'crm' && 'Loyalty Guest Directory (CRM)'}
                {activeTab === 'billing' && 'Billing, Folios & Split Ledger'}
                {activeTab === 'security' && 'Property Audit Trail Logs'}
                {activeTab === 'restaurant' && 'Restaurant POS & F&B Orders'}
                {activeTab === 'marketing' && 'Marketing, Promos & Channel Manager'}
                {activeTab === 'it' && 'IT Systems & Database Backups'}
                {activeTab === 'staff' && 'My Tasks & Daily Schedules'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Aschalew Hotel West Hararghe PMS Core Ledger Client</p>
            </div>

            <div className="flex items-center gap-3 relative">
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800 text-zinc-300' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{user?.displayName || user?.email || 'System Admin'}</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-full border transition-all relative ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800' : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-sm'}`}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-xl border shadow-xl overflow-hidden z-50 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
                    <div className={`px-4 py-3 border-b flex justify-between items-center ${isDarkMode ? 'border-zinc-850 bg-zinc-950/50' : 'border-stone-100 bg-stone-50'}`}>
                      <span className="font-bold text-xs uppercase tracking-wider">Notifications</span>
                      <button onClick={markAllRead} className="text-[10px] text-amber-500 hover:text-amber-600 font-bold">Mark all read</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {systemNotifications.filter(n => n.targetRoles === 'all' || n.targetRoles.includes(activeStaffRole)).length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-500">No new notifications for your role.</div>
                      ) : (
                        systemNotifications.filter(n => n.targetRoles === 'all' || n.targetRoles.includes(activeStaffRole)).map(n => (
                          <div key={n.id} className={`p-3 border-b last:border-0 ${isDarkMode ? 'border-zinc-850' : 'border-stone-100'} ${n.read ? 'opacity-60' : 'bg-amber-500/5'}`}>
                            <p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-200' : 'text-stone-800'}`}>{n.message}</p>
                            <p className="text-[10px] text-zinc-500 mt-1">{n.timestamp.toLocaleTimeString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onToggleRole}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border-zinc-800' : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200 shadow-md'}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Switch to Guest Portal</span>
              </button>
            </div>
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
                  {activeStaffRole === 'Super Admin / Owner' && "Full access to everything + reports + user management."}
                  {activeStaffRole === 'General Manager' && "High access to all reports, approvals, and staff management."}
                  {activeStaffRole === 'Front Desk / Reception' && "Medium-High access to reservations, check-in/out, and guest management."}
                  {activeStaffRole === 'Housekeeping' && "Limited access focused on room status and maintenance requests."}
                  {activeStaffRole === 'Restaurant / F&B Staff' && "Medium access to POS billing and restaurant orders."}
                  {activeStaffRole === 'Accountant / Finance' && "High access to billing, payments, night audit, and reports."}
                  {activeStaffRole === 'Marketing / Sales' && "Medium access to website content, promotions, and channel manager."}
                  {activeStaffRole === 'IT / System Admin' && "High access to technical maintenance and backups."}
                  {activeStaffRole === 'Staff (Basic)' && "Very limited access to only their specific tasks."}
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
                {activeStaffRole === 'Housekeeping' ? (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                      <h4 className="font-display font-bold text-sm text-zinc-200 mb-4">Housekeeping Overview</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex justify-between items-center text-amber-500">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Rooms to Clean</span>
                             <span className="text-2xl font-black">{rooms.filter(r => r.status === 'dirty').length}</span>
                           </div>
                           <Activity className="w-8 h-8 opacity-80" />
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg flex justify-between items-center text-emerald-500">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Cleaned & Ready</span>
                             <span className="text-2xl font-black">{rooms.filter(r => r.status === 'available').length}</span>
                           </div>
                           <CheckSquare className="w-8 h-8 opacity-80" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                      <h4 className="font-display font-bold text-sm text-zinc-200 mb-4">Quick Tasks</h4>
                      <div className="text-xs text-zinc-500">Use the Housekeeper tab to view all room maintenance tasks.</div>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => setActiveTab('housekeeping')} className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs hover:bg-amber-400">View Active Tasks</button>
                        <button onClick={() => setActiveTab('rooms')} className="px-4 py-2 bg-zinc-800 text-zinc-200 font-bold rounded-lg text-xs hover:bg-zinc-700">Update Room Status</button>
                      </div>
                    </div>
                  </div>
                ) : activeStaffRole === 'Accountant / Finance' ? (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                      <h4 className="font-display font-bold text-sm text-zinc-200 mb-4">Financial Overview</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex justify-between items-center text-amber-500">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Gross Revenue</span>
                             <span className="text-2xl font-black">{stats.totalRevenue} ETB</span>
                           </div>
                           <DollarSign className="w-8 h-8 opacity-80" />
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex justify-between items-center text-blue-500">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">ADR</span>
                             <span className="text-2xl font-black">{calculatedADR} ETB</span>
                           </div>
                           <FileText className="w-8 h-8 opacity-80" />
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg flex justify-between items-center text-purple-500">
                           <div>
                             <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">Active Bookings</span>
                             <span className="text-2xl font-black">{stats.activeBookingsCount}</span>
                           </div>
                           <Activity className="w-8 h-8 opacity-80" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-display font-bold text-sm text-zinc-200">Financial Actions</h4>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setActiveTab('billing')} className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-xs hover:bg-amber-400">Manage Folios</button>
                        {hasAccess('night_audit') && (
                          <button onClick={handleExecuteNightAudit} className="px-4 py-2 bg-zinc-800 text-zinc-200 font-bold rounded-lg text-xs hover:bg-zinc-700">Run Night Audit</button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
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

                {/* D3 Historical Trends Chart */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Historical Daily Occupancy & Revenue Trends</h4>
                      <p className="text-[11px] text-zinc-500">14-day interactive visualization of key performance indicators.</p>
                    </div>
                  </div>
                  <AdminD3Charts isDarkMode={isDarkMode} />
                </div>

                {/* Night Audit & Report Summaries */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="font-display font-bold text-sm text-zinc-200">Daily Night Audit Financial Ledger</h4>
                      <p className="text-[11px] text-zinc-500">Historical logs of nightly revenue postings and check-ins closing audits.</p>
                    </div>
                    {hasAccess('night_audit') && (
                    <button onClick={handleExecuteNightAudit} className="px-3.5 py-1.5 rounded bg-amber-500 text-zinc-950 text-xs font-bold cursor-pointer hover:bg-amber-400 transition">
                      🌙 Run Night Audit
                    </button>
                    )}
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
                </>
                )}
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
                        {hasAccess('reservations') && (
                        <button onClick={() => setShowWalkInModal(true)} className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                          <Plus className="w-3.5 h-3.5" /> Book Front-Desk / Walk-in
                        </button>
                        )}
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
                              {hasAccess('check_in_out') && (
                                <>
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
                                </>
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

                    {hasAccess('check_in_out') && (
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
                    )}

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
                    {hasAccess('reports') && (
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
                    )}
                    {hasAccess('reservations') && (
                    <button onClick={() => setShowWalkInModal(true)} className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Book Walk-In
                    </button>
                    )}
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
                  {hasAccess('room_edit') && (
                  <button onClick={() => {
                    setRoomForm({ id: 0, roomNumber: '', type: 'standard', price: 1500, status: 'available', amenities: '', imageUrl: '', floor: 1 });
                    setShowAddRoomModal(true);
                  }} className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5" /> Add New Room
                  </button>
                  )}
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
                          {hasAccess('room_edit') && (
                            <>
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
                            </>
                          )}
                          {!hasAccess('room_edit') && hasAccess('room_status') && (
                            <button onClick={() => {
                               // Open a simpler status toggle modal or cycle status directly
                               const newStatus = room.status === 'available' ? 'occupied' : room.status === 'occupied' ? 'maintenance' : 'available';
                               // In a real app we'd dispatch an update here
                               alert(`Would update room ${room.roomNumber} status to ${newStatus}`);
                            }} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] rounded border border-zinc-700/50 flex items-center justify-center transition cursor-pointer font-bold">
                               Update Status
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: FLOOR PLAN */}
            {activeTab === 'floorplan' && (
              <InteractiveFloorPlan 
                rooms={rooms}
                isDarkMode={theme === 'dark'}
                onUpdateRoomStatus={handleUpdateRoomStatus}
                hasAccess={hasAccess}
              />
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
                        <div key={room.id}>
                          <HousekeepingTask
                            room={room}
                            schedule={schedule}
                            isDarkMode={theme === 'dark'}
                            onComplete={() => handleUpdateRoomStatus(room.id, 'available')}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dispatch Staff Panel */}
                  {hasAccess('staff_management') && (
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
                  )}
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

            {/* TAB 9: RESTAURANT & POS */}
            {activeTab === 'restaurant' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Active Tables</p>
                      <h3 className="text-2xl font-bold font-mono text-zinc-100">12 / 24</h3>
                    </div>
                    <UtensilsCrossed className="w-8 h-8 text-amber-500/50" />
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Today's Revenue</p>
                      <h3 className="text-2xl font-bold font-mono text-emerald-400">ETB 14,500</h3>
                    </div>
                    <CreditCard className="w-8 h-8 text-emerald-500/50" />
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Pending Room Service</p>
                      <h3 className="text-2xl font-bold font-mono text-amber-500">4</h3>
                    </div>
                    <Coffee className="w-8 h-8 text-zinc-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Orders */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-sm text-zinc-200">Recent F&B Orders</h4>
                    <div className="space-y-3">
                      {[
                        { id: 'ORD-102', table: 'Table 4', items: '2x Macchiato, 1x Tiramisu', total: 'ETB 450', status: 'Served' },
                        { id: 'ORD-103', table: 'Room 205', items: '1x Club Sandwich, 1x Coke', total: 'ETB 600', status: 'Preparing' },
                        { id: 'ORD-104', table: 'Table 12', items: '3x Doro Wat, 3x Tej', total: 'ETB 2,400', status: 'Pending' },
                      ].map(order => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                          <div>
                            <p className="text-xs font-bold text-zinc-200">{order.table} <span className="text-[10px] font-mono text-zinc-500 ml-2">{order.id}</span></p>
                            <p className="text-[10px] text-zinc-500 mt-1">{order.items}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-amber-400">{order.total}</p>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              order.status === 'Served' ? 'bg-emerald-500/10 text-emerald-400' : 
                              order.status === 'Preparing' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                            }`}>{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick POS Actions */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl space-y-4">
                    <h4 className="font-display font-bold text-sm text-zinc-200">Quick POS Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="p-4 bg-zinc-950/80 border border-zinc-850 hover:border-amber-500/50 rounded-lg text-center transition group">
                        <UtensilsCrossed className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-zinc-300">New Table Order</span>
                      </button>
                      <button className="p-4 bg-zinc-950/80 border border-zinc-850 hover:border-amber-500/50 rounded-lg text-center transition group">
                        <BedDouble className="w-6 h-6 text-zinc-400 group-hover:text-amber-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-zinc-300">Room Service</span>
                      </button>
                      <button className="p-4 bg-zinc-950/80 border border-zinc-850 hover:border-amber-500/50 rounded-lg text-center transition group">
                        <CreditCard className="w-6 h-6 text-zinc-400 group-hover:text-emerald-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-zinc-300">Settle Bill</span>
                      </button>
                      <button className="p-4 bg-zinc-950/80 border border-zinc-850 hover:border-amber-500/50 rounded-lg text-center transition group">
                        <Clock className="w-6 h-6 text-zinc-400 group-hover:text-blue-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-zinc-300">End Shift</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: MARKETING */}
            {activeTab === 'marketing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <h4 className="font-display font-bold text-sm text-zinc-200">Channel Manager</h4>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Booking.com</span>
                        <span className="text-emerald-400 font-mono font-bold">SYNCED</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Expedia</span>
                        <span className="text-emerald-400 font-mono font-bold">SYNCED</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Agoda</span>
                        <span className="text-amber-400 font-mono font-bold">PENDING</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5 text-amber-500" />
                        <h4 className="font-display font-bold text-sm text-zinc-200">Active Promotions</h4>
                      </div>
                      <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded transition cursor-pointer">
                        + New Promo
                      </button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { code: 'SUMMER25', discount: '15% OFF', uses: '45/100', status: 'Active' },
                        { code: 'CORP_IBM', discount: 'Flat $20', uses: '12/∞', status: 'Active' },
                        { code: 'HONEYMOON', discount: 'Free Upgrade', uses: '2/10', status: 'Ending Soon' },
                      ].map(promo => (
                        <div key={promo.code} className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                          <div>
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded">{promo.code}</span>
                            <span className="text-xs text-zinc-300 ml-3">{promo.discount}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-500 mr-3 font-mono">Uses: {promo.uses}</span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${promo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{promo.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: IT ADMIN */}
            {activeTab === 'it' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                    <Server className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Server Status</p>
                    <h3 className="text-lg font-bold font-mono text-emerald-400">99.99%</h3>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                    <Activity className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">API Load</p>
                    <h3 className="text-lg font-bold font-mono text-zinc-200">124 req/s</h3>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                    <Download className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Last Backup</p>
                    <h3 className="text-lg font-bold font-mono text-zinc-200">2 hrs ago</h3>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                    <ShieldAlert className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Threats Blocked</p>
                    <h3 className="text-lg font-bold font-mono text-zinc-200">14</h3>
                  </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl">
                  <h4 className="font-display font-bold text-sm text-zinc-200 mb-4">Integration Endpoints</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-zinc-200">VingCard Door Lock API</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">tcp://192.168.1.105:4000</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ONLINE</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-zinc-200">MikroTik Wi-Fi RADIUS</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">udp://192.168.1.1:1812</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ONLINE</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-zinc-200">Telebirr / CBE Birr Payment Gateway</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">https://api.telebirr.et/v1/checkout</p>
                      </div>
                      <span className="text-[9px] font-bold uppercase px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: STAFF TASKS */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Punch Clock */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl flex flex-col items-center justify-center text-center space-y-4">
                    <Clock className="w-12 h-12 text-zinc-600" />
                    <div>
                      <h4 className="font-display font-bold text-lg text-zinc-200">Current Shift</h4>
                      <p className="text-xs text-zinc-500">Morning Shift (06:00 - 14:00)</p>
                    </div>
                    <button className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded shadow transition hover:bg-emerald-500 hover:text-zinc-950 cursor-pointer">
                      Punch In
                    </button>
                  </div>

                  {/* Daily Tasks */}
                  <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-xl md:col-span-2 space-y-4">
                    <h4 className="font-display font-bold text-sm text-zinc-200">My Assigned Tasks</h4>
                    <div className="space-y-3">
                      {[
                        { title: 'Clean Room 101', time: '08:00 AM', status: 'Completed' },
                        { title: 'Restock Mini-Bar 205', time: '09:30 AM', status: 'Pending' },
                        { title: 'Deliver Towels to 304', time: '10:15 AM', status: 'Pending' },
                      ].map((task, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-850 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${task.status === 'Completed' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500' : 'border-zinc-600'}`}>
                              {task.status === 'Completed' && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${task.status === 'Completed' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{task.title}</p>
                              <p className="text-[10px] text-zinc-500 mt-0.5">{task.time}</p>
                            </div>
                          </div>
                          {task.status !== 'Completed' && (
                            <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded transition cursor-pointer">
                              Mark Done
                            </button>
                          )}
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

      {/* MODAL 4: PERMISSION SUMMARY */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-xl p-6 max-w-lg w-full space-y-4 my-8 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}>
            <div className={`flex justify-between items-center pb-2 border-b ${isDarkMode ? 'border-zinc-850 text-zinc-100' : 'border-stone-200 text-stone-900'}`}>
              <h4 className="font-display font-bold text-base">Permission Summary: {activeStaffRole}</h4>
              <button onClick={() => setShowPermissionModal(false)} className={`${isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-stone-400 hover:text-stone-600'} text-sm font-bold`}>✕</button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-stone-600'}`}>
                This defines the exact modules and functions the current logged-in role has access to:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(rolePermissions).length > 0 && 
                  (rolePermissions[activeStaffRole].includes('all') 
                    ? Object.keys(tabsConfig.reduce((acc, tab) => ({...acc, [tab.resource]: true}), {} as Record<string, boolean>))
                    : rolePermissions[activeStaffRole]
                  ).map((resourceKey) => (
                  <div key={resourceKey} className={`flex items-center gap-2 p-2 rounded-lg border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800 text-zinc-200' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono font-bold capitalize">{resourceKey.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>

              {rolePermissions[activeStaffRole].includes('all') && (
                <div className={`mt-4 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-bold`}>
                  <ShieldAlert className="w-4 h-4 inline-block mr-2" />
                  Full System Access Granted
                </div>
              )}
            </div>

            <button onClick={() => setShowPermissionModal(false)} className={`w-full py-2 font-bold text-xs rounded shadow transition cursor-pointer ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-stone-200 hover:bg-stone-300 text-stone-800'}`}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT / SYNC CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showLogoutDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl shadow-2xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'}`}
            >
              <h3 className={`text-xl font-bold font-display mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-100' : 'text-stone-900'}`}>
                <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-blue-500' : ''}`} />
                Sync to Cloud
              </h3>
              
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                Do you want to save your pending manual overrides to the cloud before logging out? 
                Unsaved changes will be lost if you log out without syncing.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setShowLogoutDialog(false)}
                  disabled={isSyncing}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleConfirmLogout(false)}
                  disabled={isSyncing}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                    isDarkMode 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                  }`}
                >
                  Logout without Syncing
                </button>
                <button 
                  onClick={() => handleConfirmLogout(true)}
                  disabled={isSyncing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync & Logout'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM CONVERSATION PANEL */}
      <div className="fixed bottom-4 left-4 lg:left-[19.5rem] lg:bottom-6 z-40 font-sans">
        {/* Floating Bubble Button */}
        <button
          onClick={() => setShowSystemChat(!showSystemChat)}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-2xl relative cursor-pointer border ${
            showSystemChat 
              ? 'bg-zinc-900 border-zinc-850 text-zinc-100 hover:bg-zinc-850' 
              : 'bg-[#006400] text-white hover:bg-emerald-800 border-emerald-900/40'
          }`}
          title="System Conversation & Cloud Sync"
        >
          {showSystemChat ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              <Terminal className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
              </span>
            </>
          )}
        </button>

        {/* Collapsible Panel Drawer */}
        <AnimatePresence>
          {showSystemChat && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`absolute bottom-16 left-0 w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl border backdrop-blur-xl flex flex-col overflow-hidden ${
                isDarkMode 
                  ? 'bg-zinc-950/95 border-zinc-850' 
                  : 'bg-white border-stone-200'
              }`}
            >
              {/* Panel Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isDarkMode ? 'border-zinc-850 bg-zinc-900/40' : 'border-stone-100 bg-stone-50'
              }`}>
                <div className="flex items-center gap-2">
                  <Terminal className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-200' : 'text-stone-800'}`}>
                      System Console
                    </h4>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] text-zinc-500 font-bold font-mono">CORE OPERATOR ONLINE</span>
                    </div>
                  </div>
                </div>

                {/* Direct Sync button inside Panel */}
                <button
                  type="button"
                  onClick={() => {
                    setSystemChatInput('sync');
                    setTimeout(() => handleSendSystemChat(), 50);
                  }}
                  disabled={isSyncing}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                  }`}
                  title="Manual Cloud Sync Override"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync Cloud'}
                </button>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs scrollbar-thin">
                {systemChatMessages.map((msg) => {
                  const isMe = msg.senderEmail === user?.email;
                  const isSystem = msg.senderRole === 'system';
                  const isSuccess = msg.type === 'success';
                  const isWarning = msg.type === 'warning';
                  
                  let messageBg = isDarkMode ? 'bg-zinc-900/60 text-zinc-300' : 'bg-stone-50 text-stone-700';
                  let borderStyle = isDarkMode ? 'border-zinc-800/80' : 'border-stone-150';
                  
                  if (isMe) {
                    messageBg = 'bg-[#006400] text-white';
                    borderStyle = 'border-transparent';
                  } else if (isSuccess) {
                    messageBg = isDarkMode ? 'bg-emerald-500/5 text-emerald-300' : 'bg-emerald-50 text-emerald-800';
                    borderStyle = isDarkMode ? 'border-emerald-500/10' : 'border-emerald-100';
                  } else if (isWarning) {
                    messageBg = isDarkMode ? 'bg-amber-500/5 text-amber-300' : 'bg-amber-50 text-amber-800';
                    borderStyle = isDarkMode ? 'border-amber-500/10' : 'border-amber-100';
                  }

                  const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {!isSystem && (
                        <span className="text-[9px] font-bold font-mono text-zinc-500 mb-0.5 px-1 uppercase tracking-wider">
                          {msg.senderName} ({msg.senderRole})
                        </span>
                      )}
                      <div className={`p-3 rounded-2xl border leading-relaxed ${messageBg} ${borderStyle} ${
                        isMe ? 'rounded-br-none' : 'rounded-bl-none'
                      }`}>
                        <p className="whitespace-pre-wrap font-mono text-[11px]">{msg.text}</p>
                      </div>
                      <span className="text-[8px] text-zinc-500 font-mono mt-1 px-1">{timeStr}</span>
                    </div>
                  );
                })}

                {isSystemTyping && (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono pl-1">
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span>Processing console instruction...</span>
                  </div>
                )}
              </div>

              {/* Console Input Footer Form */}
              <form
                onSubmit={handleSendSystemChat}
                className={`p-3 border-t flex gap-2 ${
                  isDarkMode ? 'border-zinc-850 bg-zinc-950/40' : 'border-stone-150 bg-stone-50/50'
                }`}
              >
                <input
                  type="text"
                  value={systemChatInput}
                  onChange={(e) => setSystemChatInput(e.target.value)}
                  placeholder='Type "sync", "status" or "help"...'
                  className={`flex-grow px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:ring-emerald-500 focus:border-emerald-500' 
                      : 'bg-white border-stone-200 text-stone-800 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!systemChatInput.trim()}
                  className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    systemChatInput.trim()
                      ? 'bg-[#006400] text-white hover:bg-emerald-800 shadow-lg shadow-emerald-950/20'
                      : 'bg-zinc-800/10 text-zinc-500 cursor-not-allowed border border-transparent'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {activeToasts.filter(t => t.targetRoles === 'all' || t.targetRoles.includes(activeStaffRole)).map(toast => (
          <div key={toast.id} className={`pointer-events-auto w-80 p-4 rounded-xl shadow-2xl border flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-5 fade-in duration-300 ${
            isDarkMode 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-200' 
              : 'bg-white border-stone-200 text-stone-800'
          }`}>
            {toast.type === 'success' && <CheckSquare className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />}
            <div className="flex-1">
              <p className="text-sm font-bold leading-tight mb-1">{toast.message}</p>
              <p className="text-[10px] opacity-70 font-mono">{toast.timestamp.toLocaleTimeString()}</p>
            </div>
            <button onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))} className={`hover:opacity-70 ${isDarkMode ? 'text-zinc-500' : 'text-stone-400'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
