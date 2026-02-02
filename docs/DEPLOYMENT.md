# Mistie Deployment Guide

This guide covers how to deploy all parts of the Mistie application: the mobile app, the backend logic, and managing configurations.

## 1. Mobile App Deployment (Expo & EAS)

### A. Over-The-Air (OTA) Updates ⚡
*Use for: JS changes, styling updates, image asset changes.*
*Does NOT work for: Native module changes, app icon edits, splash screen edits.*

**To Production (Live Users):**
```bash
eas update --channel production --message "Brief description of changes"
```

**To Preview (Internal Testing):**
```bash
eas update --channel preview --message "Description for testers"
```

### B. Native Builds 🏗️
*Use for: First-time store submission, new native permissions, changing app icon/name.*

**Build for Android (APK for testing):**
```bash
eas build --profile preview --platform android
```

**Build for Production (Store Submission):**
```bash
eas build --profile production --platform all
```

---

## 2. Backend Deployment (Supabase)

### Edge Functions ☁️
Your backend logic lives in `supabase/functions`.

**Deploy a specific function:**
```bash
supabase functions deploy <function_name> --no-verify-jwt
# Example:
supabase functions deploy send-push --no-verify-jwt
```

**Deploy ALL functions:**
```bash
supabase functions deploy --no-verify-jwt
```

**Managing Secrets:**
If a function needs a new API key (e.g., OPENAI_API_KEY):
```bash
supabase secrets set OPENAI_API_KEY=your_key_here
```

### Database Migrations 🗄️
*Generally managed via the Supabase Dashboard for this project, but if using CLI:*
```bash
supabase db push
```

---

## 3. Environment Variables 🔐

### Mobile App (`.env`)
Variables starting with `EXPO_PUBLIC_` are embedded in the app at build/update time.
*   **Locally:** stored in `.env`.
*   **EAS Build:** Must be added to your project secrets on [expo.dev](https://expo.dev).

### Backend
*   **Locally:** stored in `supabase/.env` (or default system env).
*   **Production:** Managed via `supabase secrets set`.

---

## Quick Reference Checklist 📝

**Before deploying updates:**
1.  [ ] Did I change `app.json` or add a native library? -> **Run `eas build`**.
2.  [ ] Did I just change code/styles? -> **Run `eas update`**.
3.  [ ] Did I change a Supabase Edge Function? -> **Run `supabase functions deploy`**.
