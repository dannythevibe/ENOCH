# ENOCH: System Architecture Document

**Redemption City Autonomous AI Guide**
**Version:** 2.0 (Offline-First Architecture)

---

## 1. Executive Summary
ENOCH is an intelligent, completely offline-first progressive web application (PWA) designed to serve as the autonomous guide for attendees in Redemption City. Born from the need to provide hyper-local, ultra-fast navigation and emergency logistics in a congested environment, ENOCH underwent a major architectural pivot from a cloud-tethered system to a fully decoupled edge-compute paradigm.

By leveraging WebGPU and the WebLLM runtime, the ENOCH AI Engine downloads its neural network directly into the user's mobile browser cache during their first visit. Subsequent usage relies entirely on the user's local hardware—ensuring zero server costs for AI inference, guaranteed uptime in network dead zones, and immediate response times.

---

## 2. High-Level System Topology
The system is cleanly decoupled into two distinct domains:

1. **The Edge Node (Client-Side PWA)**
   - Houses the UI, Map Matrix, and the AI Engine.
   - Operates 100% autonomously for all navigation, chat, and logistics queries once the initial asset sync is complete.

2. **The Command Node (.NET Backend)**
   - Serves purely as an authentication gateway, emergency signal router, and optional mesh-network state manager.
   - Devoid of any AI processing dependencies.

---

## 3. Frontend Architecture (Progressive Web App)
**Tech Stack:** Next.js, React, Tailwind CSS, Vite (PWA Service Worker Integration)

The frontend is built to feel like a native operating system rather than a website.

- **Design System:** Deep neon aesthetics (black, #121314, #1b1c1d) accented with the signature Enoch Green (#CCFF00). Uses heavy glassmorphism (`backdrop-filter: blur()`) to achieve a premium, futuristic UI.
- **Service Worker & Caching:** A Service Worker traps all network requests, aggressively caching the HTML, CSS, JavaScript, and Map Assets. Once added to the user's Home Screen, the app opens instantly regardless of cellular signal.
- **Routing:** Handled via a dynamic React state-driven `AppShell` allowing instantaneous transitions between Dashboard, Chat, Profile, and Map screens without hard reloads.

---

## 4. The Offline AI Engine (WebLLM)
**Tech Stack:** `@mlc-ai/web-llm`, WebWorkers, IndexedDB

The core achievement of the 2.0 architecture is the offline AI. We eliminated the `LLamaSharp` C# dependency and moved the language model entirely into the browser.

### 4.1. Model Selection & Quantization
The engine utilizes `Qwen2-0.5B-Instruct-q4f16_1-MLC`. This model was specifically chosen for its incredible parameter efficiency. Quantized to an INT4 precision, the binary size sits around ~350MB.

### 4.2. Progressive Storage Sync
When a user launches the Chat module for the first time, a background `CreateWebWorkerMLCEngine` job triggers. The 350MB weights are pulled over the network and heavily chunked into the browser's persistent `IndexedDB`.
- **First Run:** Progress bar displayed; takes 1-3 minutes depending on Wi-Fi.
- **Subsequent Runs:** Instant load times (under 500ms) with zero data usage.

### 4.3. Background Threading (Web Workers)
To prevent the mobile UI from stuttering during token generation, the LLM inference is completely isolated in a dedicated `worker.ts` script. The main thread simply receives the streamed text chunks and updates the React state seamlessly.

### 4.4. The Context Injection Layer (Anti-Hallucination)
To constrain the model strictly to Redemption City logic without fine-tuning, a local structured JSON matrix (`campusFaqCache`) is dynamically injected as a `System Role` into the prompt history before every user query. 

```json
{
  "emergency_exits": ["Gate 1 (North Main)", "Gate 3 (South Expressway)"],
  "first_aid_hubs": "Located at Sector B behind the main Auditorium."
}
```
*Architecture Rule:* The LLM temperature is forced to `0.2` to ensure deterministic, highly factual answers strictly derived from this injected matrix.

---

## 5. Backend Architecture (Serverless Next.js API Routes)
**Tech Stack:** Next.js Route Handlers (`app/api`), SQLite (`sqlite3`), JSON Web Tokens (JWT)

To vastly simplify the deployment pipeline and completely eliminate Cross-Origin Resource Sharing (CORS) network issues, ENOCH was refactored into a unified "Serverless Monolith." The standalone C# backend was permanently retired.

### 5.1. Database & Persistence
Data is stored using a local SQLite database (`enoch.db`) accessed directly via Next.js Route Handlers using standard SQL queries. This allows the API routes to be deployed alongside the frontend in Node.js environments (like Render).
- `Users` Table: Handles authentication and credentials.
- `Devices` & `Locations` Tables: Manages device mesh tracking and telemetry.
- `Messages` Table: Logs AI conversational history.

### 5.2. Unified Deployment Model
By keeping the API (`/api/auth`, `/api/devices`, `/api/locations`) inside the Next.js `app/api` directory, the frontend and backend share the exact same domain, cookies, and network lifecycle. This results in zero latency routing between the UI and backend logic.

---

## 6. Authentication & Security
- **JWT Bearer Auth:** The frontend authenticates by posting to `/api/auth/login`. The server verifies the SHA-256 hashed password and issues a signed JSON Web Token.
- **Stateless Validation:** The Next.js API remains stateless. Protected endpoints inspect the `Authorization: Bearer <token>` header to extract the user claims securely.

---

## 7. Data Flow & Execution Pipeline
1. **App Launch:** User taps the PWA icon. The Service Worker intercepts the request and serves the entire UI bundle from Cache.
2. **Dashboard:** The `AppShell` loads. Profile data is pulled from the local React state (or fetched via JWT if online).
3. **AI Chat Invocation:**
   - User navigates to Chat.
   - `worker.ts` is spawned.
   - WebLLM inspects `IndexedDB`. If the Qwen model exists, it mounts instantly. If not, the sync begins.
   - User types: "Where is the exit?"
   - The UI intercepts the string, prefixes it with the Redemption City Context Matrix, and fires a message to the WebWorker.
   - The WebWorker utilizes WebGPU on the phone's SoC to generate a response and streams it back to the UI.

---

## 8. Summary of Architectural Triumphs
By aggressively pushing intelligence to the edge, ENOCH achieves:
- **Infinite Scalability:** 10 users or 100,000 users cost the exact same amount in AI compute power ($0).
- **Absolute Privacy:** User queries regarding their location or medical needs never leave their physical device.
- **Unbreakable Uptime:** Cellular tower failures during major events at Redemption City have zero impact on the core navigation and AI features.
