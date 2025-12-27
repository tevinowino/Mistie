# Mistie: Product Requirements Document (MVP)

> **Vision:** A minimalist relationship companion that facilitates intimacy through AI-driven daily rituals and real-time micro-interactions.

## 1. Executive Summary
Mistie is a "Anti-Social Media" app designed for exactly two people. It replaces the "feed" with a "garden" and "likes" with "pulses". The core value proposition is **Connected Privacy**—a digital space that feels as intimate as a whisper.

**Core Pillars:**
- **Intimacy First:** Algorithm-free, ad-free, distraction-free.
- **Haptic Language:** Communication through vibration and visual "breath", not just text.
- **Ritualistic:** A daily cadence that encourages consistent, meaningful connection.

---

## 2. Technical Architecture

### 2.1 High-Level Stack
*   **Frontend:** React Native (Expo) + Expo Router
*   **Visuals:** Reanimated 3 + Skia (Glassmorphism & shaders)
*   **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
*   **Intelligence:** Gemini 2.5 Flash (via Edge Functions)
*   **Offline:** TanStack Query + AsyncStorage

### 2.2 System Diagram
```mermaid
graph TD
    UserA[User A (App)] <-->|Realtime (Nugs/Reveals)| Supabase
    UserB[User B (App)] <-->|Realtime (Nugs/Reveals)| Supabase
    
    subgraph "Supabase Backend"
        Auth[Auth]
        DB[(PostgreSQL)]
        Edge[Edge Functions]
    end
    
    subgraph "External AI"
        Gemini[Gemini 2.5 AI]
    end

    UserA -->|Rest/RPC| Edge
    Edge -->|Prompt| Gemini
    Gemini -->|Content| Edge
    Edge -->|Persist| DB
    DB -->|Sync| UserA
    DB -->|Sync| UserB
```

---

## 3. Functional Requirements

### 3.1 Onboarding (The Handshake)
*   **Code-Based Pairing:** Users strictly paired via a 1-time 6-digit code.
*   **Identity:** Minimal profile (Display Name + Avatar). No email/phone requirements beyond auth.

### 3.2 The Daily Dew (Core Loop)
*   **Generation:** A single AI-generated question delivered daily at 5:00 AM local time.
*   **Context Aware:** Questions use "Relationship Anchors" (e.g., anniversary, shared memories) for personalization.
*   **The Reveal:** "Lock-step" revealing—neither partner sees the answer until *both* have answered.

### 3.3 The Digital Garden (Dashboard)
*   **Visual Metaphor:** The home screen is a garden that evolves based on the relationship "Streak".
*   **Atmospheric Fog:** Visualizes the "connection daily health". Fog clears as interactions occur.

### 3.4 Atmospheres (Games)
*   **Intimacy Maps:** A preference system to ensure games (like "Wildfire") respect user boundaries.
*   **Synchronized Play:** Real-time state management for game sessions.

### 3.5 Nugs (Micro-Interactions)
*   **Silent Nug:** Haptic-only signal.
*   **Note Nug:** Ephemeral text (<50 chars).

---

## 4. MVP Scope & Limitations
| Feature | MVP Status | Future |
| :--- | :--- | :--- |
| **Auth** | Email/Magic Link | Apple/Google Sign-In |
| **Media** | Avatars only | Photo/Video Sharing |
| **History** | Last 30 Days | Infinite Scroll / Cloud Export |
| **Network** | Offline-First (Queue) | Fully Real-time only |
| **Games** | 4 Presets | Community Packs |

## 5. Success Metrics
*   **Daily Active Dyads (DAD):** Number of couples where *both* partners open the app.
*   **Completion Rate:** % of Daily Dews where is_revealed = true.
*   **Streak Retention:** Average length of active streaks.