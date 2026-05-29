# 🧠💚 LifeLink

LifeLink is a comprehensive Healthcare Resource Coordination Platform designed to address fragmentation across hospitals. It reduces emergency response delays and improves resource utilization. Built specifically for critical, time-sensitive circumstances (saving lives), this platform is equipped with real-time updates and a smart allocation algorithm.

## ✨ Key Features
- **Authentication System:** JWT-based authentication, user registration with roles (Public, Admin, Ambulance Driver, etc.).
- **Smart Allocation Algorithm:** AI-powered matching system relying on distance, resource availability, and hospital specializations. <100ms decision latency for immediate hospital assignment in emergency SOS scenarios.
- **Emergency Request System:** Send real-time SOS requests prioritizing required resources, recording patient condition and tracking status interactively.
- **Real-time Live Tracking & Mapping:** A powerful Leaflet map dashboard used for real-time tracking of emergencies and ambulance locations.
- **Hospital Management Dashboard:** Complete tracking of incoming patients, ICU bed availability, blood bank stocks, and oxygen cylinders.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18.2 with TypeScript for a robust, type-safe interface.
- **Build Tool:** Vite for lightning-fast builds and HMR.
- **Styling:** Tailwind CSS intertwined with custom CSS gradients and frosted-glass effects to create an emergency-grade, distinct dark UI, paired alongside Material-UI components.
- **Mapping:** using google maps api for the maps and livr routes for the public and ambulance .
- **State Management:** Custom React hooks, standard context states + Redux Toolkit.
- **Networking:** Axios for HTTP REST requests.
- **Routing:** React Router v6.

### Backend
- **Framework:** Node.js (v18+) & Express.js server endpoints fully written in TypeScript.
- **Database:** MySQL 8.0 workbench .
- **ORM:** Sequelize (SQL models properly normalized).
- **Real-Time Communication:** Node Socket.io infrastructure for instant SOS tracking.
- **Security:** bcryptjs (password hashing), JWT (secure tokening), Joi (schema validation), Helmet (headers), and Morgan (HTTPS logging).
- **Architecture Flow:** Follows MVC / Three-tier architecture. 


- **Version Control:** Git.

---

## 🔄 Frontend Application Flow

### 1. User / Public Portal (`/`)
- **Landing State:** The map automatically centers based on the user's browser-provided coordinates.
- **Filtering System:** Users can interact with Quick Filter buttons situated directly on the map (ICU Beds, Oxygen, Blood Bank, Available Ambulance).
- **Live SOS Initiation:** A highly visible **“🚨 SOS EMERGENCY”** action button brings up an interactive modal to immediately dispatch patient condition, severity, and custom requests. The payload posts directly to the backend bypassing mandatory user accounts (anonymous mode) for immediate response.

### 2. Ambulance Driver Dashboard (`/ambulance`)
- **Live Tracking System:** Shows where the current driver is via Leaflet Map pins (`#004643`).
- **Data Rendering:** List of nearby hospitals is aggregated and rendered via the backend matching tool. Distances vs. Bed availability algorithms are calculated and fed into visually styled `<HospitalCard />` objects.
- **Communication Flow:** The driver selects an appropriate hospital card from the side-list. They can hit "Inform Hospital" to push ETA and patient-types ahead of their arrival. 
- **Notification Board:** A responsive inbox section inside the driver’s pane shows live updates on whether the chosen hospital "Accepted" or "Rejected" the incoming alert.

### 3. Hospital Administration Desktop (`/hospital`)
- **Resource Management:** Admins manipulate physical resource counts such as available beds, oxygen stock, and operating theaters directly.
- **Incoming Emergencies:** Renders inbound SOS broadcasts requiring immediate allocation acceptance.

## 🚀 Installation & Quick Start

### Option A: Using Docker (Recommended, <30s)
1. Run `$ docker-compose up --build`
2. Access the Application:
   - Frontend: `http://localhost:3000`
   - Backend:  `http://localhost:5000`

### Option B: Local Setup (Manual via Node & npm)
1. Ensure your local MySQL respects `src/config/database.ts` credentials.
2. Open two separate Terminals.
3. Install dependencies in both folders: 
   - `cd backend` -> `npm install`
   - `cd frontend` -> `npm install`
4. Run both instances using fresh sessions:
   - **Terminal 1:** `cd backend && npm run dev`
   - **Terminal 2:** `cd frontend && npm run dev`
5. Visit the locally hosted URL prompted by Vite (usually `http://localhost:5173` or `3000`).
