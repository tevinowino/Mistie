# Mistie: Step-by-Step Implementation Guide

> **Status:** Backend & Project Init are COMPLETE.
> **Strategy:** We will build the app layer-by-layer, verifying each component visually before moving to logic.

---

## Phase 1: The Visual Foundation (Glassmorphism)
*Goal: Establish the "feel" of the app. If this part fails, the app fails.*

### 1.1 The Glass Core
- [ ] **Component:** `GlassCard.tsx` (using `expo-blur`).
- [ ] **Component:** `MistButton.tsx` (Primary action button with haptic feedback).
- [ ] **Component:** `ScreenWrapper.tsx` (Handles gradients and safe areas).
- [ ] **Verification:** Create a temporary `TestScreen` to display a card and button over a gradient.

### 1.2 The Mist Overlay (Interaction)
- [ ] **Component:** `MistOverlay.tsx` (Reanimated + Gesture Handler).
- [ ] **Logic:** Implement the "swipe-to-clear" physics.
- [ ] **Verification:** Verify the blur radius changes as you drag your finger.

---

## Phase 2: Authentication & Onboarding
*Goal: Get two users into the system and paired.*

### 2.1 Identity (Auth)
- [ ] **Screen:** `app/(auth)/welcome.tsx` (Splash & Sign In).
- [ ] **Logic:** Implement "Magic Link" / OTP flow using `AuthContext`.
- [ ] **Verification:** User can sign in and sees their `profile` row in Supabase.

### 2.2 The Handshake (Linking)
- [ ] **Screen:** `app/(auth)/link.tsx`.
- [ ] **Logic (Creator):** Generate 6-digit code, create `pending` bond.
- [ ] **Logic (Joiner):** Input code, update bond to `couple`.
- [ ] **Verification:** Simulate two phones. Confirm `bonds` table status updates to `couple`.

---

## Phase 3: The Dashboard ("Digital Garden")
*Goal: The main hub where users check their status.*

### 3.1 The Garden Visuals
- [ ] **Screen:** `app/(tabs)/index.tsx`.
- [ ] **Assets:** Add SVG/Image assets for the garden states (Foggy vs Clear).
- [ ] **Logic:** Fetch `bond.streak_count` to determine fog density.
- [ ] **Verification:** Manually edit DB streak and see the fog change.

### 3.2 The Pulse
- [ ] **Widget:** Circular streak indicator.
- [ ] **Interaction:** Long-press to trigger "Nug Menu".

---

## Phase 4: The Daily Dew (Core Loop)
*Goal: The daily question and answer flow.*

### 4.1 Fetching the Question
- [ ] **Screen:** `app/(tabs)/dew.tsx`.
- [ ] **Logic:** Query `daily_dews` for today. If missing, show "Waiting for mist..."
- [ ] **Edge Case:** Handle "No Question Generated" gracefully.

### 4.2 Answering & Revealing
- [ ] **Logic:** Submit answer (encrypted/hidden).
- [ ] **State:** Show "Waiting for partner" if user answered but partner hasn't.
- [ ] **Reveal:** When `is_revealed=true`, show both answers side-by-side.
- [ ] **Verification:** End-to-end test of the daily flow.

---

## Phase 5: Polish & Interactions
*Goal: Making it feel magical.*

### 5.1 Real-time Nugs
- [ ] **Logic:** Subscribe to `nugs` table changes.
- [ ] **Feedback:** Trigger `Haptics.impactAsync` on new row.

### 5.2 Atmospheres (Games)
- [ ] **Screen:** `app/(tabs)/games.tsx`.
- [ ] **Logic:** Simple list of game types.
- [ ] **Feature:** "Wildfire" generator integration.

### 5.3 Offline Polish
- [ ] **Logic:** Configure `tanstack-query` persistence (AsyncStorage).
- [ ] **UX:** "You are offline" subtle indicator.
