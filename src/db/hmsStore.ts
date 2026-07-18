import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'hms_store.json');

// Interface for HMS data
export interface HmsGuestProfile {
  guestEmail: string;
  guestName: string;
  contactNumber: string;
  idProof: string; // e.g. Passport, National ID
  loyaltyPoints: number;
  preferences: string; // e.g. High floor, extra pillows
  segment: 'Walk-in' | 'Online' | 'Corporate' | 'Group';
}

export interface HmsBilling {
  bookingId: number;
  ratePlan: 'Standard Rack Rate' | 'Corporate Special' | 'Loyalty Package' | 'Weekend Special';
  discount: number; // in ETB
  serviceCharge: number; // in %
  vat: number; // in %
  payments: Array<{
    amount: number;
    method: 'cash' | 'card' | 'digital_wallet' | 'invoice';
    timestamp: string;
    description: string;
  }>;
  splitDetails?: string;
}

export interface HmsHousekeepingLog {
  roomId: number;
  assignedStaff: string;
  scheduleTime: string;
  taskType: 'deep_clean' | 'routine_clean' | 'maintenance_fix';
  notes: string;
  status: 'pending' | 'completed';
}

export interface HmsWakeUpCall {
  bookingId: number;
  roomNumber: string;
  time: string; // HH:MM
  notes: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface HmsAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  role: string;
  action: string;
  details: string;
}

export interface HmsNightAudit {
  id: string;
  timestamp: string;
  performedBy: string;
  totalRevenuePosted: number;
  occupiedRoomsCount: number;
  occupancyRate: number;
  noShowsProcessed: number;
  status: 'success';
}

export interface HmsCommunication {
  id: string;
  bookingId: number;
  guestName: string;
  guestContact: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered';
}

export interface HmsStoreData {
  guests: HmsGuestProfile[];
  billings: HmsBilling[];
  housekeepingLogs: HmsHousekeepingLog[];
  wakeUpCalls: HmsWakeUpCall[];
  auditLogs: HmsAuditLog[];
  nightAudits: HmsNightAudit[];
  communications: HmsCommunication[];
  extraRooms: Array<{
    roomId: number;
    floor: number;
    outOfOrderNotes?: string;
  }>;
}

// Initial default state
const defaultState: HmsStoreData = {
  guests: [
    {
      guestEmail: 'obsafigo@gmail.com',
      guestName: 'Obsa Figo',
      contactNumber: '+251912345678',
      idProof: 'PP-1294819',
      loyaltyPoints: 120,
      preferences: 'Wants authentic Chiro coffee on check-in, high floor room',
      segment: 'Corporate'
    }
  ],
  billings: [],
  housekeepingLogs: [
    {
      roomId: 1,
      assignedStaff: 'Abebech Housekeeper',
      scheduleTime: '10:00 AM',
      taskType: 'routine_clean',
      notes: 'Sanitize desk and replenish Ethiopian Coffee ceremony cups',
      status: 'pending'
    }
  ],
  wakeUpCalls: [],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      userEmail: 'system-initialization@aschalew.com',
      role: 'admin',
      action: 'SYSTEM_START',
      details: 'Aschalew International PMS Extended Engine Initialized Successfully'
    }
  ],
  nightAudits: [],
  communications: [],
  extraRooms: []
};

// Helper to load/save
export function getHmsStore(): HmsStoreData {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(defaultState, null, 2), 'utf-8');
      return defaultState;
    }
    const data = fs.readFileSync(STORE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read HMS Store file, using defaultState:', err);
    return defaultState;
  }
}

export function saveHmsStore(data: HmsStoreData): boolean {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write HMS Store file:', err);
    return false;
  }
}

// Utility to write an audit log
export function logHmsAction(userEmail: string, role: string, action: string, details: string) {
  const store = getHmsStore();
  const newLog: HmsAuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    userEmail,
    role,
    action,
    details
  };
  store.auditLogs.unshift(newLog); // latest first
  saveHmsStore(store);
}

// Utility to send simulated notification
export function sendSimulatedNotification(bookingId: number, guestName: string, guestContact: string, channel: 'WhatsApp' | 'SMS' | 'Email', message: string) {
  const store = getHmsStore();
  const newComm: HmsCommunication = {
    id: `comm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    bookingId,
    guestName,
    guestContact,
    channel,
    message,
    timestamp: new Date().toISOString(),
    status: 'sent'
  };
  store.communications.unshift(newComm);
  saveHmsStore(store);
}
