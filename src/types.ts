export interface User {
  id: number;
  uid: string;
  email: string;
  displayName: string | null;
  photoUrl: string | null;
  role: 'guest' | 'admin';
  createdAt: string;
}

export interface Room {
  id: number;
  roomNumber: string;
  type: 'standard' | 'deluxe' | 'executive' | 'family';
  price: number; // Nightly price in ETB
  status: 'available' | 'occupied' | 'dirty' | 'maintenance';
  amenities: string | null;
  imageUrl: string | null;
}

export interface Booking {
  id: number;
  userId: number;
  roomId: number;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  guestsCount: number;
  guestName: string;
  guestEmail: string;
  notes: string | null;
  createdAt: string;
}

export interface BookingWithDetails {
  booking: Booking;
  room: Room;
  user?: User;
}

export interface ServiceRequest {
  id: number;
  bookingId: number;
  type: 'room_service' | 'housekeeping' | 'maintenance';
  item: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
  cost: number;
  createdAt: string;
}

export interface AdminStats {
  totalRevenue: number;
  bookingRevenue: number;
  serviceRevenue: number;
  occupancyRate: number;
  roomStatusSummary: {
    available: number;
    occupied: number;
    dirty: number;
    maintenance: number;
  };
  typePopularityChart: Array<{
    name: string;
    revenue: number;
    bookings: number;
  }>;
  totalRooms: number;
  activeBookingsCount: number;
  pendingRequestsCount: number;
}
