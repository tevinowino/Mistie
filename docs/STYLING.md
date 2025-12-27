# Mistie Styling Guide

## Core Aesthetic
Mistie uses a **"Digital Garden"** aesthetic characterized by:
-   **Glassmorphism:** Heavy use of blurry, semi-transparent backgrounds (`BlurView` or RGBA overlays).
-   **Vibrant Gradients:** Warm, emotional colors (Pink/Purple/Orange) against sleek dark/light backgrounds.
-   **Organic Motion:** Animated rings, floating elements, and breathing effects.

## Typography
We use two primary custom fonts:

### 1. **Outfit** (Headings & Numbers)
Used for high-impact text, stats, and headers.
-   **Bold / ExtraBold:** Scores, Titles, Hero Text.
-   **Medium:** Button labels.

### 2. **Quicksand** (Body & Labels)
Used for readable text, subtitles, and descriptions.
-   **Regular / SemiBold:** Paragraphs, subtitles, hints.
-   **Features:** Rounded terminals give a friendly, approachable feel.

### 3. **Dancing Script** (Accents)
Used sparingly for "handwritten" notes or romantic touches.
-   **Usage:** Nug notes, special empty states.

## Glassmorphism System
To create the signature "Mistie Glass":

| Type | Light Mode | Dark Mode |
| :--- | :--- | :--- |
| **Surface** | `rgba(255,255,255,0.7)` | `rgba(30,30,40,0.7)` |
| **Border** | `rgba(255,255,255,0.4)` | `rgba(255,255,255,0.1)` |
| **Shadow** | `#000` (opacity 0.05) | `#000` (opacity 0.2) |

**Code Example:**
```tsx
<BlurView intensity={20} tint="light" style={styles.glassCard}>
  {/* Content */}
</BlurView>
```

## Icons
Start with **Lucide React Native**.
-   Size: 24 (Standard), 20 (Small), 28 (Large).
-   Colors: Use `colors.primary` for active states, `colors.muted` for inactive.

## Animations
-   **Harmony Ring:** Uses standard `Animated` API for robustness.
-   **Micro-interactions:** Use `LayoutAnimation` for simple layout changes or `Reanimated` for complex gestures (when needed).