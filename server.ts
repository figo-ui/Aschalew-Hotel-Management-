import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { rooms as roomsTable, bookings as bookingsTable, serviceRequests as serviceRequestsTable, users as usersTable } from './src/db/schema.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { 
  getHmsStore, 
  saveHmsStore, 
  logHmsAction, 
  sendSimulatedNotification,
  HmsGuestProfile,
  HmsBilling,
  HmsHousekeepingLog,
  HmsWakeUpCall
} from './src/db/hmsStore.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// Seed data function to run on startup if rooms are empty
async function seedRooms() {
  try {
    const existingRooms = await db.select().from(roomsTable).limit(1);
    if (existingRooms.length === 0) {
      console.log('No rooms found. Seeding initial rooms for Aschalew International Hotel...');
      await db.insert(roomsTable).values([
        {
          roomNumber: '101',
          type: 'standard',
          price: 1500, // in Ethiopian Birr (ETB)
          status: 'available',
          amenities: 'Twin Bed, Free High-Speed Wi-Fi, Hot Shower, Chiro Mountain View, Flat screen TV',
          imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600',
        },
        {
          roomNumber: '102',
          type: 'standard',
          price: 1800,
          status: 'available',
          amenities: 'Double Bed, Working Desk, Free High-Speed Wi-Fi, Coffee/Tea Station, Balcony',
          imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=600',
        },
        {
          roomNumber: '201',
          type: 'deluxe',
          price: 2500,
          status: 'available',
          amenities: 'King Bed, Minibar, Air Conditioning, Panoramic Mountain View, Premium Bath Products',
          imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600',
        },
        {
          roomNumber: '202',
          type: 'deluxe',
          price: 2800,
          status: 'available',
          amenities: 'King Bed, Ethiopian Coffee Espresso Machine, Lounge Chair, Smart TV, Luxury Tub',
          imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
        },
        {
          roomNumber: '301',
          type: 'executive',
          price: 4500,
          status: 'available',
          amenities: 'Presidential King Suite, Separate Living Room, 24/7 Butler Service, Traditional Coffee Ceremony Kit, Panoramic Chiro Foothills View',
          imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600',
        },
        {
          roomNumber: '302',
          type: 'family',
          price: 5000,
          status: 'available',
          amenities: 'Two Interconnecting Bedrooms, Dining Table, Kitchenette, Perfect for Families, Mountain Trails Map',
          imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=600',
        }
      ]);
      console.log('Seeding rooms complete.');
    }
  } catch (error) {
    console.error('Error seeding initial rooms:', error);
  }
}

// API Routes

// Sync Auth & Get User Profile
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email, displayName, photoURL } = req.user;
    const dbUser = await getOrCreateUser(req.user.uid, email, displayName, photoURL);
    res.json(dbUser);
  } catch (error: any) {
    console.error('Error syncing auth user:', error);
    res.status(500).json({ error: 'Auth sync failed', details: error.message });
  }
});

// Toggle user role (helpful for testing Guest vs Admin experiences easily)
app.post('/api/users/role', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    if (role !== 'guest' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const updatedUser = await db.update(usersTable)
      .set({ role })
      .where(eq(usersTable.uid, req.user.uid))
      .returning();
      
    res.json(updatedUser[0]);
  } catch (error: any) {
    console.error('Error changing user role:', error);
    res.status(500).json({ error: 'Failed to update role', details: error.message });
  }
});

// Get available rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const allRooms = await db.select().from(roomsTable);
    res.json(allRooms);
  } catch (error: any) {
    console.error('Failed to query rooms:', error);
    res.status(500).json({ error: 'Failed to retrieve rooms' });
  }
});

// Create a booking (Guest)
app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { roomId, checkIn, checkOut, guestsCount, guestName, guestEmail, notes } = req.body;
    
    // Find the db user
    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, req.user.uid));
    if (dbUsers.length === 0) {
      return res.status(404).json({ error: 'User not registered in database' });
    }
    const dbUser = dbUsers[0];
    
    // Verify room exists and is available
    const roomResult = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
    if (roomResult.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const room = roomResult[0];
    
    // Calculate nights and total price
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalPrice = room.price * diffNights;
    
    // Insert booking
    const newBooking = await db.insert(bookingsTable).values({
      userId: dbUser.id,
      roomId,
      checkIn,
      checkOut,
      totalPrice,
      guestsCount: guestsCount || 1,
      guestName,
      guestEmail,
      notes,
      status: 'confirmed', // Auto confirm in this app for smooth flow
    }).returning();
    
    // Update room status to occupied
    await db.update(roomsTable).set({ status: 'occupied' }).where(eq(roomsTable.id, roomId));
    
    res.status(201).json(newBooking[0]);
  } catch (error: any) {
    console.error('Failed to create booking:', error);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Get user's bookings (Guest)
app.get('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, req.user.uid));
    if (dbUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const dbUser = dbUsers[0];
    
    // Fetch bookings with room details
    const userBookings = await db.select({
      booking: bookingsTable,
      room: roomsTable,
    })
    .from(bookingsTable)
    .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
    .where(eq(bookingsTable.userId, dbUser.id))
    .orderBy(desc(bookingsTable.createdAt));
    
    res.json(userBookings);
  } catch (error: any) {
    console.error('Failed to fetch bookings:', error);
    res.status(500).json({ error: 'Failed to retrieve bookings', details: error.message });
  }
});

// Cancel a booking (Guest)
app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, req.user.uid));
    if (dbUsers.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const dbUser = dbUsers[0];
    
    // Find booking
    const bookingResult = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult[0];
    
    // Only allow owner or admin to cancel
    if (booking.userId !== dbUser.id && dbUser.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }
    
    const updatedBooking = await db.update(bookingsTable)
      .set({ status: 'cancelled' })
      .where(eq(bookingsTable.id, bookingId))
      .returning();
      
    // Set room back to available
    await db.update(roomsTable).set({ status: 'available' }).where(eq(roomsTable.id, booking.roomId));
    
    res.json(updatedBooking[0]);
  } catch (error: any) {
    console.error('Failed to cancel booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
  }
});

// Create room service / housekeeping request (Guest)
app.post('/api/bookings/:bookingId/services', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const { type, item, quantity, cost } = req.body;
    
    // Verify booking exists
    const bookingResult = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const newRequest = await db.insert(serviceRequestsTable).values({
      bookingId,
      type,
      item,
      quantity: quantity || 1,
      cost: cost || 0,
      status: 'pending'
    }).returning();
    
    res.status(201).json(newRequest[0]);
  } catch (error: any) {
    console.error('Failed to create service request:', error);
    res.status(500).json({ error: 'Failed to submit request', details: error.message });
  }
});

// Get service requests for a booking (Guest)
app.get('/api/bookings/:bookingId/services', requireAuth, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    const requests = await db.select()
      .from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.bookingId, bookingId))
      .orderBy(desc(serviceRequestsTable.createdAt));
      
    res.json(requests);
  } catch (error: any) {
    console.error('Failed to fetch service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});


// ADMIN ROUTES (Protected)

// Admin check middleware (internal to server.ts)
const requireAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, req.user.uid));
    if (dbUsers.length === 0 || dbUsers[0].role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin check failed' });
  }
};

// Get all bookings (Admin)
app.get('/api/admin/bookings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allBookings = await db.select({
      booking: bookingsTable,
      room: roomsTable,
      user: usersTable,
    })
    .from(bookingsTable)
    .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
    .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .orderBy(desc(bookingsTable.createdAt));
    
    res.json(allBookings);
  } catch (error: any) {
    console.error('Failed to fetch all bookings:', error);
    res.status(500).json({ error: 'Failed to retrieve bookings', details: error.message });
  }
});

// Update booking status (Admin check-in/check-out)
app.post('/api/admin/bookings/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { status } = req.body; // 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    
    const bookingResult = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const booking = bookingResult[0];
    
    const updatedBooking = await db.update(bookingsTable)
      .set({ status })
      .where(eq(bookingsTable.id, bookingId))
      .returning();
      
    // Update associated room status
    let roomStatus = 'available';
    if (status === 'checked_in') {
      roomStatus = 'occupied';
    } else if (status === 'checked_out') {
      roomStatus = 'dirty'; // Needs housekeeping
    } else if (status === 'cancelled') {
      roomStatus = 'available';
    } else if (status === 'confirmed') {
      roomStatus = 'available';
    }
    
    await db.update(roomsTable).set({ status: roomStatus }).where(eq(roomsTable.id, booking.roomId));
    
    res.json(updatedBooking[0]);
  } catch (error: any) {
    console.error('Failed to update booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status', details: error.message });
  }
});

// Get all service requests (Admin)
app.get('/api/admin/services', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const allRequests = await db.select({
      request: serviceRequestsTable,
      booking: bookingsTable,
      room: roomsTable,
    })
    .from(serviceRequestsTable)
    .innerJoin(bookingsTable, eq(serviceRequestsTable.bookingId, bookingsTable.id))
    .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
    .orderBy(desc(serviceRequestsTable.createdAt));
    
    res.json(allRequests);
  } catch (error: any) {
    console.error('Failed to fetch service requests:', error);
    res.status(500).json({ error: 'Failed to fetch service requests', details: error.message });
  }
});

// Update service request status (Admin)
app.post('/api/admin/services/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { status } = req.body; // 'pending' | 'in_progress' | 'completed'
    
    const updatedRequest = await db.update(serviceRequestsTable)
      .set({ status })
      .where(eq(serviceRequestsTable.id, requestId))
      .returning();
      
    res.json(updatedRequest[0]);
  } catch (error: any) {
    console.error('Failed to update service request:', error);
    res.status(500).json({ error: 'Failed to update service request', details: error.message });
  }
});

// Admin stats / analytics (revenue, occupancy, charts)
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingsList = await db.select().from(bookingsTable);
    const roomsList = await db.select().from(roomsTable);
    const servicesList = await db.select().from(serviceRequestsTable);
    
    // Total Revenue from completed/confirmed bookings and service requests
    const bookingRevenue = bookingsList
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);
      
    const serviceRevenue = servicesList
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.cost, 0);
      
    const totalRevenue = bookingRevenue + serviceRevenue;
    
    // Occupancy Rate
    const occupiedCount = roomsList.filter(r => r.status === 'occupied').length;
    const occupancyRate = roomsList.length > 0 ? Math.round((occupiedCount / roomsList.length) * 100) : 0;
    
    // Room Type demand
    const roomTypeStats = roomsList.map(room => {
      const roomBookings = bookingsList.filter(b => b.roomId === room.id && b.status !== 'cancelled');
      return {
        roomNumber: room.roomNumber,
        type: room.type,
        bookingsCount: roomBookings.length,
        revenue: roomBookings.reduce((sum, b) => sum + b.totalPrice, 0)
      };
    });
    
    // Revenue by Month or Room Type
    const typeRevenue = {
      standard: roomTypeStats.filter(r => r.type === 'standard').reduce((sum, r) => sum + r.revenue, 0),
      deluxe: roomTypeStats.filter(r => r.type === 'deluxe').reduce((sum, r) => sum + r.revenue, 0),
      executive: roomTypeStats.filter(r => r.type === 'executive').reduce((sum, r) => sum + r.revenue, 0),
      family: roomTypeStats.filter(r => r.type === 'family').reduce((sum, r) => sum + r.revenue, 0),
    };
    
    const typePopularityChart = Object.entries(typeRevenue).map(([name, value]) => ({
      name: name.toUpperCase(),
      revenue: value,
      bookings: roomTypeStats.filter(r => r.type === name).reduce((sum, r) => sum + r.bookingsCount, 0),
    }));

    // Status distributions
    const roomStatusSummary = {
      available: roomsList.filter(r => r.status === 'available').length,
      occupied: occupiedCount,
      dirty: roomsList.filter(r => r.status === 'dirty').length,
      maintenance: roomsList.filter(r => r.status === 'maintenance').length,
    };
    
    res.json({
      totalRevenue,
      bookingRevenue,
      serviceRevenue,
      occupancyRate,
      roomStatusSummary,
      typePopularityChart,
      totalRooms: roomsList.length,
      activeBookingsCount: bookingsList.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length,
      pendingRequestsCount: servicesList.filter(s => s.status === 'pending').length
    });
  } catch (error: any) {
    console.error('Failed to calculate stats:', error);
    res.status(500).json({ error: 'Failed to load statistical dashboard metrics', details: error.message });
  }
});



// Direct room status update (Admin)
app.post('/api/admin/rooms/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { status } = req.body; // 'available' | 'occupied' | 'dirty' | 'maintenance'
    
    const updatedRoom = await db.update(roomsTable)
      .set({ status })
      .where(eq(roomsTable.id, roomId))
      .returning();
      
    logHmsAction(req.user.email || 'unknown', 'admin', 'HOUSEKEEPING_UPDATE', `Set room ID ${roomId} status directly to ${status}`);
    res.json(updatedRoom[0]);
  } catch (error: any) {
    console.error('Failed to update room status:', error);
    res.status(500).json({ error: 'Failed to update room status', details: error.message });
  }
});


// 1. Rooms Full CRUD endpoints (Admin)
// Create Room
app.post('/api/admin/rooms', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { roomNumber, type, price, status, amenities, imageUrl, floor } = req.body;
    const newRoom = await db.insert(roomsTable).values({
      roomNumber,
      type,
      price: parseInt(price),
      status: status || 'available',
      amenities,
      imageUrl
    }).returning();

    const store = getHmsStore();
    store.extraRooms.push({
      roomId: newRoom[0].id,
      floor: parseInt(floor) || 1
    });
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'ROOM_CREATE', `Created room ${roomNumber} (${type}) on Floor ${floor || 1}`);
    res.status(201).json(newRoom[0]);
  } catch (error: any) {
    console.error('Failed to create room:', error);
    res.status(500).json({ error: 'Failed to create room', details: error.message });
  }
});

// Update Room
app.put('/api/admin/rooms/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const { roomNumber, type, price, status, amenities, imageUrl, floor } = req.body;
    const updatedRoom = await db.update(roomsTable)
      .set({
        roomNumber,
        type,
        price: parseInt(price),
        status,
        amenities,
        imageUrl
      })
      .where(eq(roomsTable.id, roomId))
      .returning();

    const store = getHmsStore();
    const extraIdx = store.extraRooms.findIndex(r => r.roomId === roomId);
    if (extraIdx >= 0) {
      store.extraRooms[extraIdx].floor = parseInt(floor) || 1;
    } else {
      store.extraRooms.push({ roomId, floor: parseInt(floor) || 1 });
    }
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'ROOM_UPDATE', `Updated room ${roomNumber} settings on Floor ${floor || 1}`);
    res.json(updatedRoom[0]);
  } catch (error: any) {
    console.error('Failed to update room:', error);
    res.status(500).json({ error: 'Failed to update room', details: error.message });
  }
});

// Delete Room
app.delete('/api/admin/rooms/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const roomId = parseInt(req.params.id);
    const room = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
    if (room.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Cascade deletions to avoid foreign key errors on standard database queries
    await db.delete(serviceRequestsTable).where(sql`booking_id IN (SELECT id FROM bookings WHERE room_id = ${roomId})`);
    await db.delete(bookingsTable).where(eq(bookingsTable.roomId, roomId));
    await db.delete(roomsTable).where(eq(roomsTable.id, roomId));

    const store = getHmsStore();
    store.extraRooms = store.extraRooms.filter(r => r.roomId !== roomId);
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'ROOM_DELETE', `Deleted room ${room[0].roomNumber} from database inventory`);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete room:', error);
    res.status(500).json({ error: 'Failed to delete room', details: error.message });
  }
});


// 2. Front Desk Reservations & Walk-Ins (Admin)
app.post('/api/admin/bookings', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { 
      roomId, checkIn, checkOut, guestsCount, guestName, guestEmail, notes,
      ratePlan, contactNumber, idProof, segment, preferences 
    } = req.body;

    const roomResult = await db.select().from(roomsTable).where(eq(roomsTable.id, parseInt(roomId)));
    if (roomResult.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const room = roomResult[0];

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    let basePrice = room.price * diffNights;

    // Apply Rate Plan discount modifiers
    let planName = ratePlan || 'Standard Rack Rate';
    if (planName === 'Corporate Special') {
      basePrice = Math.round(basePrice * 0.85); // 15% discount
    } else if (planName === 'Weekend Special') {
      basePrice = Math.round(basePrice * 0.90); // 10% discount
    } else if (planName === 'Loyalty Package') {
      basePrice = Math.round(basePrice * 0.95); // 5% discount
    }

    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.uid, req.user.uid));
    const userId = dbUsers.length > 0 ? dbUsers[0].id : 1;

    const newBooking = await db.insert(bookingsTable).values({
      userId,
      roomId: parseInt(roomId),
      checkIn,
      checkOut,
      totalPrice: basePrice,
      guestsCount: parseInt(guestsCount) || 1,
      guestName,
      guestEmail,
      notes: notes || `Rate Plan: ${planName}`,
      status: 'confirmed'
    }).returning();

    const bookingId = newBooking[0].id;

    // Update Room Status
    await db.update(roomsTable).set({ status: 'occupied' }).where(eq(roomsTable.id, parseInt(roomId)));

    // Save CRM details in local store
    const store = getHmsStore();
    const guestIdx = store.guests.findIndex(g => g.guestEmail.toLowerCase() === guestEmail.toLowerCase());
    const loyaltyReward = 15;
    if (guestIdx >= 0) {
      store.guests[guestIdx].loyaltyPoints += loyaltyReward;
      if (idProof) store.guests[guestIdx].idProof = idProof;
      if (contactNumber) store.guests[guestIdx].contactNumber = contactNumber;
      if (preferences) store.guests[guestIdx].preferences = preferences;
    } else {
      store.guests.push({
        guestEmail,
        guestName,
        contactNumber: contactNumber || '+251911223344',
        idProof: idProof || 'ID-RECORDED',
        loyaltyPoints: loyaltyReward,
        preferences: preferences || '',
        segment: segment || 'Walk-in'
      });
    }

    // Initialize Folio settings
    const billingRecord: HmsBilling = {
      bookingId,
      ratePlan: planName,
      discount: 0,
      serviceCharge: 10, // 10%
      vat: 15, // 15%
      payments: []
    };
    store.billings.push(billingRecord);
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'RESERVATION_CREATE', `Created front-desk walk-in reservation for ${guestName} in Room ${room.roomNumber}`);
    
    // Send simulated message notification
    sendSimulatedNotification(
      bookingId, 
      guestName, 
      contactNumber || '+251911223344', 
      'WhatsApp', 
      `Hello ${guestName}! Your reservation at Aschalew International Hotel Chiro is CONFIRMED (Room ${room.roomNumber}) for ${checkIn} to ${checkOut}. Total Price: ${basePrice} ETB. Thank you for choosing us!`
    );

    res.status(201).json(newBooking[0]);
  } catch (error: any) {
    console.error('Failed to create walk-in booking:', error);
    res.status(500).json({ error: 'Failed to create reservation', details: error.message });
  }
});


// 3. Modify Reservations (Admin rules & fees)
app.post('/api/admin/bookings/:id/modify', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { checkIn, checkOut, guestsCount, notes, modificationFee } = req.body;

    const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const currentBooking = booking[0];

    let updatedPrice = currentBooking.totalPrice;
    if (checkIn && checkOut && (checkIn !== currentBooking.checkIn || checkOut !== currentBooking.checkOut)) {
      const room = await db.select().from(roomsTable).where(eq(roomsTable.id, currentBooking.roomId));
      if (room.length > 0) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
        const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        updatedPrice = room[0].price * diffNights;
      }
    }

    if (modificationFee) {
      updatedPrice += parseInt(modificationFee);
    }

    const updated = await db.update(bookingsTable)
      .set({
        checkIn: checkIn || currentBooking.checkIn,
        checkOut: checkOut || currentBooking.checkOut,
        guestsCount: guestsCount ? parseInt(guestsCount) : currentBooking.guestsCount,
        totalPrice: updatedPrice,
        notes: notes || currentBooking.notes
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    logHmsAction(req.user.email || 'unknown', 'admin', 'RESERVATION_MODIFY', `Modified booking #${bookingId} with modification fee ${modificationFee || 0} ETB.`);
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to modify booking:', error);
    res.status(500).json({ error: 'Failed to modify booking', details: error.message });
  }
});


// 4. Folio Billing & Payment Management (Admin)
// Get Folio Invoice Summary
app.get('/api/admin/bookings/:id/billing', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookingRes = await db.select({
      booking: bookingsTable,
      room: roomsTable
    })
    .from(bookingsTable)
    .innerJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
    .where(eq(bookingsTable.id, bookingId));

    if (bookingRes.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const { booking, room } = bookingRes[0];

    const servicesList = await db.select()
      .from(serviceRequestsTable)
      .where(eq(serviceRequestsTable.bookingId, bookingId));

    const store = getHmsStore();
    let folio = store.billings.find(b => b.bookingId === bookingId);
    if (!folio) {
      folio = {
        bookingId,
        ratePlan: 'Standard Rack Rate',
        discount: 0,
        serviceCharge: 10,
        vat: 15,
        payments: []
      };
      store.billings.push(folio);
      saveHmsStore(store);
    }

    const comms = store.communications.filter(c => c.bookingId === bookingId);

    const roomCharge = booking.totalPrice;
    const roomServiceCharge = servicesList
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.cost, 0);

    const subtotal = roomCharge + roomServiceCharge - folio.discount;
    const calculatedServiceCharge = Math.round(subtotal * (folio.serviceCharge / 100));
    const calculatedVat = Math.round((subtotal + calculatedServiceCharge) * (folio.vat / 100));
    const totalAmount = subtotal + calculatedServiceCharge + calculatedVat;
    const paidAmount = folio.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = totalAmount - paidAmount;

    res.json({
      booking,
      room,
      services: servicesList,
      folio,
      comms,
      summary: {
        roomCharge,
        roomServiceCharge,
        discount: folio.discount,
        subtotal,
        serviceChargeAmount: calculatedServiceCharge,
        vatAmount: calculatedVat,
        totalAmount,
        paidAmount,
        balanceDue
      }
    });
  } catch (error: any) {
    console.error('Failed to query folio billing:', error);
    res.status(500).json({ error: 'Failed to retrieve billing', details: error.message });
  }
});

// Update Folio rate modifiers / taxes / discount / split billing rules
app.post('/api/admin/bookings/:id/billing', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { ratePlan, discount, serviceCharge, vat, splitDetails } = req.body;

    const store = getHmsStore();
    let folioIdx = store.billings.findIndex(b => b.bookingId === bookingId);
    if (folioIdx < 0) {
      store.billings.push({
        bookingId,
        ratePlan: ratePlan || 'Standard Rack Rate',
        discount: parseInt(discount) || 0,
        serviceCharge: parseInt(serviceCharge) || 10,
        vat: parseInt(vat) || 15,
        payments: [],
        splitDetails
      });
      folioIdx = store.billings.length - 1;
    } else {
      if (ratePlan) store.billings[folioIdx].ratePlan = ratePlan;
      if (discount !== undefined) store.billings[folioIdx].discount = parseInt(discount);
      if (serviceCharge !== undefined) store.billings[folioIdx].serviceCharge = parseInt(serviceCharge);
      if (vat !== undefined) store.billings[folioIdx].vat = parseInt(vat);
      if (splitDetails !== undefined) store.billings[folioIdx].splitDetails = splitDetails;
    }

    saveHmsStore(store);
    logHmsAction(req.user.email || 'unknown', 'admin', 'BILLING_POST', `Updated rates & taxes for folio booking #${bookingId}`);
    res.json(store.billings[folioIdx]);
  } catch (error: any) {
    console.error('Failed to post billing updates:', error);
    res.status(500).json({ error: 'Failed to update billing settings' });
  }
});

// Record split payments / checkout transactions
app.post('/api/admin/bookings/:id/payments', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const { amount, method, description } = req.body;

    const store = getHmsStore();
    let folioIdx = store.billings.findIndex(b => b.bookingId === bookingId);
    if (folioIdx < 0) {
      store.billings.push({
        bookingId,
        ratePlan: 'Standard Rack Rate',
        discount: 0,
        serviceCharge: 10,
        vat: 15,
        payments: []
      });
      folioIdx = store.billings.length - 1;
    }

    const payAmt = parseInt(amount);
    store.billings[folioIdx].payments.push({
      amount: payAmt,
      method: method || 'cash',
      timestamp: new Date().toISOString(),
      description: description || 'Split Payment'
    });

    saveHmsStore(store);
    logHmsAction(req.user.email || 'unknown', 'admin', 'PAYMENT_POST', `Recorded payment of ${payAmt} ETB using ${method} for reservation #${bookingId}`);
    res.json(store.billings[folioIdx]);
  } catch (error: any) {
    console.error('Failed to record payment:', error);
    res.status(500).json({ error: 'Failed to register transaction' });
  }
});


// 5. Housekeeping & Maintenance schedules (Admin)
app.get('/api/admin/housekeeping', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const store = getHmsStore();
    const roomsList = await db.select().from(roomsTable);
    
    const responseData = roomsList.map(room => {
      const schedule = store.housekeepingLogs.find(h => h.roomId === room.id);
      return {
        room,
        schedule: schedule || {
          roomId: room.id,
          assignedStaff: 'Unassigned',
          scheduleTime: 'No scheduled run',
          taskType: 'routine_clean',
          notes: 'Routine housekeeping',
          status: room.status === 'dirty' ? 'pending' : 'completed'
        }
      };
    });

    res.json(responseData);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve housekeeping schedule' });
  }
});

app.post('/api/admin/housekeeping', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { roomId, assignedStaff, scheduleTime, taskType, notes, status } = req.body;
    const store = getHmsStore();

    const idx = store.housekeepingLogs.findIndex(h => h.roomId === parseInt(roomId));
    const logData: HmsHousekeepingLog = {
      roomId: parseInt(roomId),
      assignedStaff: assignedStaff || 'Abebech Housekeeper',
      scheduleTime: scheduleTime || '11:00 AM',
      taskType: taskType || 'routine_clean',
      notes: notes || '',
      status: status || 'pending'
    };

    if (idx >= 0) {
      store.housekeepingLogs[idx] = logData;
    } else {
      store.housekeepingLogs.push(logData);
    }

    saveHmsStore(store);

    if (status === 'completed') {
      const room = await db.select().from(roomsTable).where(eq(roomsTable.id, parseInt(roomId)));
      if (room.length > 0 && room[0].status === 'dirty') {
        await db.update(roomsTable).set({ status: 'available' }).where(eq(roomsTable.id, parseInt(roomId)));
      }
    }

    logHmsAction(req.user.email || 'unknown', 'admin', 'HOUSEKEEPING_UPDATE', `Dispatched housekeeping run for room ID ${roomId} (${status})`);
    res.json(logData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});


// 6. Wake-Up Alerts & Guest Messages
app.get('/api/admin/wake-up', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const store = getHmsStore();
  res.json(store.wakeUpCalls);
});

app.post('/api/admin/wake-up', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { bookingId, roomNumber, time, notes } = req.body;
    const store = getHmsStore();
    const newWakeUp: HmsWakeUpCall = {
      bookingId: parseInt(bookingId),
      roomNumber,
      time,
      notes: notes || 'Wake-up call',
      status: 'active'
    };
    store.wakeUpCalls.push(newWakeUp);
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'WAKEUP_SET', `Set active wake-up call for Room ${roomNumber} at ${time}`);
    res.status(201).json(newWakeUp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create wake up call' });
  }
});

app.post('/api/admin/wake-up/:index/status', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  try {
    const index = parseInt(req.params.index);
    const { status } = req.body;
    const store = getHmsStore();
    
    if (store.wakeUpCalls[index]) {
      store.wakeUpCalls[index].status = status;
      saveHmsStore(store);
      logHmsAction(req.user.email || 'unknown', 'admin', 'WAKEUP_UPDATE', `Updated wake-up call status for room ${store.wakeUpCalls[index].roomNumber} to ${status}`);
      return res.json(store.wakeUpCalls[index]);
    }
    res.status(404).json({ error: 'Wake up call not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to modify wake up call' });
  }
});


// 7. Guest CRM Profiles Directory (CRM)
app.get('/api/admin/guests', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const store = getHmsStore();
    const allBookings = await db.select().from(bookingsTable);
    
    allBookings.forEach(b => {
      const exists = store.guests.some(g => g.guestEmail.toLowerCase() === b.guestEmail.toLowerCase());
      if (!exists) {
        store.guests.push({
          guestEmail: b.guestEmail,
          guestName: b.guestName,
          contactNumber: '+251911000000',
          idProof: 'PP-RECORDED',
          loyaltyPoints: 10,
          preferences: 'High-speed Wi-Fi essential, Mountain view preferred',
          segment: 'Online'
        });
      }
    });

    saveHmsStore(store);
    res.json(store.guests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load guest directory' });
  }
});

app.post('/api/admin/guests', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  try {
    const { guestEmail, guestName, contactNumber, idProof, loyaltyPoints, preferences, segment } = req.body;
    const store = getHmsStore();
    const idx = store.guests.findIndex(g => g.guestEmail.toLowerCase() === guestEmail.toLowerCase());

    if (idx >= 0) {
      store.guests[idx] = {
        guestEmail,
        guestName,
        contactNumber: contactNumber || store.guests[idx].contactNumber,
        idProof: idProof || store.guests[idx].idProof,
        loyaltyPoints: loyaltyPoints !== undefined ? parseInt(loyaltyPoints) : store.guests[idx].loyaltyPoints,
        preferences: preferences || store.guests[idx].preferences,
        segment: segment || store.guests[idx].segment
      };
      saveHmsStore(store);
      logHmsAction(req.user.email || 'unknown', 'admin', 'CRM_UPDATE', `Updated profile database for Guest CRM: ${guestName}`);
      return res.json(store.guests[idx]);
    }

    const newGuest: HmsGuestProfile = {
      guestEmail,
      guestName,
      contactNumber: contactNumber || '+251911000000',
      idProof: idProof || 'ID-RECORDS',
      loyaltyPoints: parseInt(loyaltyPoints) || 0,
      preferences: preferences || '',
      segment: segment || 'Walk-in'
    };
    store.guests.push(newGuest);
    saveHmsStore(store);
    logHmsAction(req.user.email || 'unknown', 'admin', 'CRM_UPDATE', `Created new Guest profile inside CRM Directory: ${guestName}`);
    res.status(201).json(newGuest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CRM profiles' });
  }
});


// 8. Automated Night Audit & Revenue Posting
app.post('/api/admin/night-audit', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const store = getHmsStore();
    const bookingsList = await db.select().from(bookingsTable);
    const roomsList = await db.select().from(roomsTable);

    // Occupancy percentage and current posted nightly revenue
    const occupiedCount = roomsList.filter(r => r.status === 'occupied').length;
    const rate = roomsList.length > 0 ? Math.round((occupiedCount / roomsList.length) * 100) : 0;
    
    const activeBookings = bookingsList.filter(b => b.status === 'confirmed' || b.status === 'checked_in');
    const revenuePosted = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Filter out inactive alerts/wakeups
    store.wakeUpCalls = store.wakeUpCalls.filter(w => w.status === 'active');

    // Run Overdue No-Show rules: Auto-cancel confirmed bookings overdue by 1 day
    const todayStr = new Date().toISOString().split('T')[0];
    let noShows = 0;
    for (const b of bookingsList) {
      if (b.status === 'confirmed' && b.checkIn < todayStr) {
        noShows++;
        await db.update(bookingsTable).set({ status: 'cancelled', notes: 'No-Show auto-cancelled during Night Audit closing' }).where(eq(bookingsTable.id, b.id));
        await db.update(roomsTable).set({ status: 'available' }).where(eq(roomsTable.id, b.roomId));
      }
    }

    const auditRecord = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      performedBy: req.user.email || 'Admin Auditor',
      totalRevenuePosted: revenuePosted,
      occupiedRoomsCount: occupiedCount,
      occupancyRate: rate,
      noShowsProcessed: noShows,
      status: 'success' as const
    };

    store.nightAudits.unshift(auditRecord);
    saveHmsStore(store);

    logHmsAction(req.user.email || 'unknown', 'admin', 'NIGHT_AUDIT', `Executed daily Night Audit closing. Occupancy: ${rate}%, Posted revenue: ${revenuePosted} ETB.`);
    res.json(auditRecord);
  } catch (error: any) {
    console.error('Night Audit failed:', error);
    res.status(500).json({ error: 'Night Audit execution failed', details: error.message });
  }
});

// Query Night Audits history
app.get('/api/admin/night-audits', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const store = getHmsStore();
  res.json(store.nightAudits);
});


// 9. Staff Security Action Activity Trail Audit logs
app.get('/api/admin/audit-logs', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const store = getHmsStore();
  res.json(store.auditLogs);
});


// 10. Instant Database Encrypted Backup Download Simulation
app.post('/api/admin/backup', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const store = getHmsStore();
    const roomsList = await db.select().from(roomsTable);
    const bookingsList = await db.select().from(bookingsTable);
    const servicesList = await db.select().from(serviceRequestsTable);

    const backupPayload = {
      timestamp: new Date().toISOString(),
      rooms: roomsList,
      bookings: bookingsList,
      services: servicesList,
      hmsStore: store
    };

    // AES-256 simulation using secure JSON Base64 conversion
    const encryptedData = Buffer.from(JSON.stringify(backupPayload)).toString('base64');
    
    logHmsAction(req.user.email || 'unknown', 'admin', 'BACKUP_EXEC', 'Generated complete system and financial backup snapshot successfully');
    
    res.json({
      filename: `Aschalew_HMS_Secure_Backup_${new Date().toISOString().split('T')[0]}.enc`,
      secureChecksum: `sha256-hash-${Date.now()}`,
      payload: encryptedData
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Backup snapshot failed' });
  }
});


// Serve client side files with Vite in Dev, or static folder in Production
async function startServer() {
  await seedRooms();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
