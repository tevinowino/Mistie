# Mistie: UI/UX Specifications

> **Core Principle:** Frictionless gestures over buttons. Every screen should feel like a breathing organism.

## 1. Screen Flow Map

### 1.1 Authentication & Linking
1.  **Welcome:** Minimalist splash. "Start Journey" slides up.
2.  **Role Select:** `[ Create Code ]` vs `[ Enter Code ]`.
3.  **Handshake:** 
    *   **Wait State:** Large 6-digit code on screen. Pulse animation.
    *   **Success:** Screen "shatters" from white into the "Sunset Mist" gradient.

### 1.2 Dashboard (The Digital Garden)
*   **Layout:** Full-screen immersive garden illustration (SVG).
*   **Fog Layer:** Opacity is inverse to `streak_count`. (0 Streak = Heavy Fog).
*   **Interactions:**
    *   **Long Press (Anywhere):** Opens "Nug Menu" (radial or bottom sheet).
    *   **Swipe Up:** Reveals Connection Stats.
    *   **Tap Center:** Opens today's "Daily Dew" (if active).

### 1.3 Daily Dew (The Ritual)
1.  **Locked State:** GlassCard with heavy blur. Text: "A new question has formed."
2.  **Revealing:** Swipe interaction. Text fades in as custom `blurRadius` decreases.
3.  **Answering:** Input field with "Soft Keyboard" (avoid covering UI).
4.  **Waiting:** "Waiting for partner..." (Pulsing state).
5.  **Double Reveal:** Once both answer, card splits: User A (Left) / User B (Right).

### 1.4 Atmosphere Hub (Games)
*   **Grid:** 2x2 Masonry.
*   **Tiles:**
    *   *Morning Dew:* Light conversation.
    *   *Deep Haze:* Radical honesty.
    *   *Aura:* Energy check / Vibe sync.
    *   *Wildfire:* Intimacy & Dares (Requires "Heat Level" selector).

## 2. Component Logic

### 2.1 The Nug Sheet
*   **Trigger:** Long press on Dashboard.
*   **Items:**
    *   ⚡ **Zap:** Instant heavy vibration.
    *   💌 **Note:** Open mini-keyboard (limit 50 chars).
    *   📸 **Snap:** (Future) Quick photo (blurred).

### 2.2 Connection Pulse (Stats)
*   **Visual:** Rings not Bars.
*   **Metrics:**
    *   *Streak:* Days consecutively active.
    *   *Harmony:* % of similar sentiment (AI analysis - Future).
    *   *History:* Scrollable list of past 5 Daily Dews.

## 3. Navigation (Expo Router)
```
/app
 ├── /(auth)
 │    ├── welcome.tsx
 │    └── link.tsx
 ├── /(tabs)
 │    ├── _layout.tsx    # Glass Tab Bar
 │    ├── index.tsx      # Dashboard (Garden)
 │    ├── dew.tsx        # Daily Dew
 │    ├── atmosphere.tsx # Games Hub
 │    └── pulse.tsx      # Stats
 └── /session
      └── [game_id].tsx  # Active Game Screen
```