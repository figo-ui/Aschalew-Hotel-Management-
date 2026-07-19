# 🏨 Aschalew International Hotel — PMS & Guest Portal

A high-fidelity, full-stack enterprise Property Management System (PMS) and interactive guest portal designed for the **Aschalew International Hotel** located in the scenic heights of **Chiro (Asebe Teferi), West Hararghe, Ethiopia**. 

This application offers a modern, fully-integrated suite for both guests seeking an authentic Hararghe highland getaway and staff handling the 24/7 complex operations of a premium hospitality property.

---

## 🌌 Core Visual Themes & Design System

The application boasts a custom, high-contrast user interface styled with professional precision:
* **Hararghe-Inspired Themes**: Custom color palettes featuring **Gold Chercher Accent**, **Hararghe Mountain Green**, and **Slate Obsidian** optimized for eye-safe night usage at reception desks or cozy guest rooms.
* **Fluid Motions**: Dynamic page transitions, micro-interactions, and visual cue states powered by `motion/react`.
* **Universal Localization**: Built-in dual-language translations supporting both English and local context, fully synchronized with regional preferences.

---

## 🚀 Key Capability Modules

### 1. 🛏️ Guest Experience Hub
* **Dynamic Reservations**: Live booking engine allowing room preferences, automatic price computation, and custom arrival arrangements.
* **Aschalew Concierge AI Bot**: An intelligent local concierge assisting guests with real-time inquiries regarding Chiro's legendary highland coffee ceremonies, Chercher Mountains peak excursions, local bajaj/taxi fares, and Wi-Fi configurations.
* **Traditional Dining**: Digital interactive room service menu featuring authentic Hararghe recipes, traditional breakfast options, and fine espresso beverages.
* **QR Hospitality Scanner**: Instant check-in/check-out and service ordering using the built-in, device-camera-gated QR reader.

### 2. 🖥️ Property Management System (PMS) Console
An enterprise-grade administration workspace complete with a robust multi-role Access Control List (ACL) supporting:
* **Super Admin / Owner** & **General Manager**
* **Front Desk / Reception** & **Housekeeping**
* **Restaurant / F&B Staff** & **Accountant / Finance**
* **Marketing / Sales** & **IT / System Admin**

#### Key Admin Workspaces:
* **Interactive Floor Plan**: A real-time, SVG-backed room status mapping tool (Occupied, Available, Dirty, Maintenance) with instant housekeeping assignment updates.
* **Analytical Dashboard**: Dynamic charts powered by D3.js and Recharts detailing occupancy metrics, RevPAR, ADR, and revenue breakdowns.
* **Wake-Up Console**: Automated log sheets for managing guest wake-up reminders.
* **Billing & Folios**: Split ledgers, custom itemized dining/laundry/tour add-ons, and payment processing folios.
* **IT Backups & Night Audit**: Structured system logs, data backup dispatchers, and full financial night audits.
* **Staff Schedules**: Personal shift tracking (punch clock) and assigned housekeeping tasks.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 18 with Vite, designed as a highly responsive Single Page Application (SPA).
* **Backend Runtime**: Express.js server on Node.js.
* **Database & ORM**: PostgreSQL database powered by **Drizzle ORM** with an automated filesystem-persistent JSON store fallback (`hms_store.json`).
* **Authentication**: **Firebase Auth** with an integrated, instant Sandbox Portal for seamless guest and staff developer logins without Firebase project provisioning.
* **Styling & Icons**: Tailwind CSS utility design system with iconography from `lucide-react`.
* **Data Visualization**: Recharts and interactive D3 engines.

---

## 📂 Project Directory Structure

```text
├── metadata.json                 # App configuration and major permissions
├── server.ts                     # Full-stack Express.js server entry point
├── package.json                  # Scripts and dependencies
├── hms_store.json                # Durable filesystem database fallback file
├── src/
│   ├── main.tsx                  # Client entry point
│   ├── App.tsx                   # Main routing wrapper
│   ├── types.ts                  # Shared database & component models
│   ├── index.css                 # Tailwind utility imports & theme setup
│   ├── lib/
│   │   └── firebase.ts           # Firebase client-side initializer
│   ├── middleware/
│   │   └── auth.ts               # Express authentication filters
│   ├── db/
│   │   ├── schema.ts             # Drizzle PostgreSQL tables schema
│   │   ├── drizzle.config.ts     # Drizzle migration profiles
│   │   ├── users.ts              # Local user and profile seed data
│   │   └── hmsStore.ts           # Filesystem storage access drivers
│   └── components/
│       ├── AdminView.tsx         # Complete back-office PMS suite
│       ├── GuestView.tsx         # Front-facing guest engagement page
│       ├── InteractiveFloorPlan.tsx # Real-time SVG Room Inventory Board
│       ├── AdminD3Charts.tsx     # Recharts and D3 data dashboards
│       ├── AuthScreen.tsx        # Firebase gateway with Instant Sandbox
│       ├── QRScanner.tsx         # Camera-based hotel check-in scanning
│       └── LanguageThemeContext.tsx # Central context for themes & translation
```

---

## ⚙️ Setup and Installation

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **Bun** package manager

### 1. Environment Configuration
Create a `.env` file at the root of the project using the structure in `.env.example`:
```env
# Optional Firebase client configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional PostgreSQL Database Connection
DATABASE_URL=postgres://user:password@host:port/database
```
*Note: If no database or Firebase credentials are provided, the system gracefully defaults to the built-in Sandbox Auth and JSON Filesystem storage, enabling fully functional local execution out of the box!*

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
This boots the full-stack Express server on port `3000` with the hot-reloading client:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to preview the system.

### 4. Build and Production Run
Compile the client static bundles and transpile the Express server:
```bash
npm run build
npm run start
```

---

## 🌟 Instant Login Portal Credentials

If utilizing the Sandbox Auth bypass mode, use the following roles directly on the welcome screen to test individual user views:
* **Aschalew Guest Hub**: Access as a luxury tourist staying in Chiro.
* **Staff PMS Console**: Grants instant access as a **Super Admin / Owner** or other specialized roles (Housekeeping, GM, Restaurant Staff) via the dynamic role toggles inside the navigation panel.

---

*Enjoy your stay at the **Aschalew International Hotel** — Your Gateway to the Chercher Mountains!*
