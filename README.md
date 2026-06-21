# ENOCH: Autonomous Guide for Redemption City

### 🚀 Live Deployment: [https://enoch-1.onrender.com/](https://enoch-1.onrender.com/)

---

## 📖 Project Overview
**ENOCH** is an intelligent, offline-first progressive web application (PWA) built to serve as an autonomous guide and emergency routing tool for attendees in Redemption City. 

During high-density religious and cultural events, local cellular towers routinely collapse under the weight of hundreds of thousands of concurrent connections. Standard cloud-reliant maps and AI chatbots become useless. 

ENOCH solves this by bringing **all intelligence and coordinates processing to the edge (on-device)**. It caches all navigation grids, search logs, and classification indices in the browser, ensuring guaranteed uptime even in complete network dead zones (Airplane Mode).

---

## 🛠️ Key Features

* **Survivability/Offline-First Operations:** The application is packaged as a PWA, aggressively caching HTML, CSS, JavaScript, and Map grids. It requires zero active internet connections to function once initial caching is complete.
* **On-Device Custom NLP Chatbot:** Features a custom keyword-weighted natural language processing engine (`chat-engine.ts`) with conversational history tracking and context memory. It resolves follow-ups (e.g., *"any other"*, *"more"*) dynamically based on topic memory.
* **Location-based Map Auto-Redirection:** When you ask location-based questions (e.g., *"Where is the Main Altar?"* or *"tell me about RECTEM"*), the guide replies and **automatically switches views** to center and highlight that specific landmark on the map grid.
* **Native Voice Typing (STT):** Integrates native browser `SpeechRecognition` support so users can speak to dictate messages, complete with real-time pulsing green waveforms and UX listening indicators.
* **Base64 Monolithic Profile Uploads:** Supports custom user picture uploads parsed as buffer streams, converted to base64 Data URLs, and saved to the serverless JSON database, syncing live across parent-child views.
* **Micro-Adjusted Mobile Spacing:** Built with strict vertical safety margins separating floating menus from text bars to prevent mis-clicks.

---

## 📐 System Architecture
ENOCH is designed as a **serverless monolith** inside Next.js to ensure maximum portability, zero CORS latency, and simple serverless deployments:
* **Frontend:** Next.js (App Router), React, Tailwind CSS. Styled in futuristic cyber-grid dark mode with glowing Enoch Green accents (`#c3f400`).
* **Backend:** Next.js Serverless API Route Handlers (`/api/...`) managing JWT authentication, device mesh registries, and chat history.
* **Database:** Local JSON-based offline-safe database (`enoch-db.json`) allowing immediate deployment on serverless platforms without compilation issues or external DB dependency setup.

For detailed sequence diagrams on map routing and picture uploads, view the [ENOCH Architecture Document](ENOCH_Architecture.md).

---

## 💻 Local Quickstart

### Prerequisites
* Node.js (version 20 or higher)

### Setup & Run
1. Clone the repository and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server locally:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3333](http://localhost:3333) in your browser.
