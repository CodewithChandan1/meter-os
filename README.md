# ⚡ MeterOps - Smart Meter Management & Field Operations

MeterOps is a modern, enterprise-grade mobile & backend application for electric/water meter management, team field assignments, installation workflows, and real-time operations tracking.

---

## ✨ Features

- 📱 **Mobile App (React Native / Expo)**:
  - **Stock & Meter Management**: Add new meters, edit specs (Company, Capacity, Phase/Type), search & filter by status.
  - **Handover & Return Handshake**: Multi-step assignment with real-time finger touch signature canvas.
  - **Installation Workflow**: Field installation tracking with geolocation capture and map pin links.
  - **In-App Team Chat**: Instant team messaging with WebSocket real-time updates (`ws://`).
  - **Production Security**:
    - Hardware-backed **Native Phone Biometric Unlock** (Fingerprint / Face ID / Touch ID).
    - **4-Digit Quick Security PIN Lock**.
    - Post Sign-Up & Sign-In Security Setup.
  - **Modern UI/UX**: Dark mode glassmorphism theme, smooth status pills, top floating toast notifications.

- ⚙️ **Backend API Server (Express + Fastify WebSocket Engine)**:
  - Fastify WebSocket server (`ws://localhost:5001/ws`) broadcasting real-time events.
  - PostgreSQL database connection with Drizzle ORM.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo Router, TypeScript, Vector Icons, Safe Area Context.
- **State & Sync**: Custom React Context with AsyncStorage persistence & WebSockets (`ws`).
- **Backend**: Node.js, Express, Fastify WebSockets (`ws`), Drizzle ORM, PostgreSQL (Neon).
- **Package Manager**: pnpm Workspaces.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (`npm i -g pnpm`)
- Expo Go app on mobile or iOS/Android Simulator

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/meter-management.git
   cd meter-management
   ```

2. **Install workspace dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   PORT=5001
   ```

---

## 🏃 Running the Application

### 1. Start the Backend API & WebSocket Server
```bash
pnpm --filter @workspace/api-server dev
```
*Server starts on `http://localhost:5001` and WebSockets on `ws://localhost:5001/ws`.*

### 2. Start the Mobile App (Expo)
```bash
pnpm --filter @workspace/meter-ops-mobile dev
```
*Scan the QR code with **Expo Go** on Android/iOS.*

---

## 🔒 Security & Authentication

- **Initial Access**: New users complete Sign Up and are directed to the **Security Setup** screen.
- **Lock Screen**: App opens in a locked state, automatically prompting for **Fingerprint / Face ID**.
- **PIN Fallback**: If biometric scan is cancelled or unavailable, users can unlock via a 4-Digit Security PIN (`Default demo PIN: 1234`).

---

## 📁 Project Structure

```
Meter-Management/
├── api-server/             # Backend API & WebSocket Server
│   ├── src/
│   │   └── index.ts        # Express + WebSocket HTTP Server
│   └── package.json
├── meter-ops-mobile/       # Mobile Application (Expo)
│   ├── app/                # Expo Router Screens
│   │   ├── (tabs)/         # Bottom Tab Screens (Home, Meters, Add, Team, Profile)
│   │   ├── auth/           # Auth Screens (Sign In, Sign Up, Security Setup)
│   │   ├── meter/          # Meter Details, Assign & Install Modals
│   │   └── chat.tsx        # Team Chat Screen
│   ├── components/         # MeterUI Reusable Design System & Toast Banners
│   ├── context/            # MeterContext & WebSocket Listener State
│   └── package.json
├── lib/                    # Shared DB & Client Libraries
│   ├── db/                 # Drizzle Schema & PostgreSQL Config
│   └── api-client-react/   # Shared API Hooks
├── .env                    # Environment Variables
├── package.json            # Root Workspace Config
└── README.md               # Project Documentation
```

---

## 🤝 License

Distributed under the MIT License. See `LICENSE` for details.
