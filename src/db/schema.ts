import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('displayName'),
  photoUrl: text('photo_url'),
  role: text('role').default('guest').notNull(), // 'guest' | 'admin'
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'rooms' table
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  roomNumber: text('room_number').notNull().unique(),
  type: text('type').notNull(), // 'standard' | 'deluxe' | 'executive' | 'family'
  price: integer('price').notNull(), // Price per night in Birr
  status: text('status').default('available').notNull(), // 'available' | 'occupied' | 'dirty' | 'maintenance'
  amenities: text('amenities'), // Comma-separated list
  imageUrl: text('image_url'),
});

// Define the 'bookings' table
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  roomId: integer('room_id')
    .references(() => rooms.id)
    .notNull(),
  checkIn: text('check_in').notNull(), // Format: YYYY-MM-DD
  checkOut: text('check_out').notNull(), // Format: YYYY-MM-DD
  totalPrice: integer('total_price').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
  guestsCount: integer('guests_count').default(1).notNull(),
  guestName: text('guest_name').notNull(),
  guestEmail: text('guest_email').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'service_requests' table
export const serviceRequests = pgTable('service_requests', {
  id: serial('id').primaryKey(),
  bookingId: integer('booking_id')
    .references(() => bookings.id)
    .notNull(),
  type: text('type').notNull(), // 'room_service' | 'housekeeping' | 'maintenance'
  item: text('item').notNull(), // e.g. "Injera Breakfast", "Extra Pillows"
  quantity: integer('quantity').default(1).notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'in_progress' | 'completed'
  cost: integer('cost').default(0).notNull(), // cost in Birr
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
  serviceRequests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  booking: one(bookings, {
    fields: [serviceRequests.bookingId],
    references: [bookings.id],
  }),
}));
