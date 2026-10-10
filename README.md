# CareBox Family 🌿

> **Small button. Big peace of mind.**
> The calm medicine companion for elderly parents living independently and the adult children who care for them.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/SwarupKadam2007)
[![Tests](https://img.shields.io/badge/tests-30%20passing-brightgreen)](https://github.com/SwarupKadam2007)
[![PWA Ready](https://img.shields.io/badge/PWA-installable-teal)](https://github.com/SwarupKadam2007)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 The Product & Problem

- **The Problem:** Adult children living away from elderly parents constantly worry whether medications were taken on time. Calling repeatedly to ask *"Did you take your tablet?"* induces anxiety, causes parent-child friction, and makes parents feel surveilled.
- **The Solution:** A physical smart 3-compartment pillbox (Morning, Afternoon, Night) that gently glows and chimes at dose time. The parent opens it and presses **ONE big button**.
- **The Family App:** Displays a calm, dignified status:
  - 🟢 **Green** = Taken
  - 🟡 **Amber** = Due / Gentle nudge available (never alarming red)
  - ⚪ **Grey** = Later / Upcoming
- **Privacy by Design (India DPDP Act 2023):** Status only. **Zero cameras, zero GPS/location tracking, zero continuous surveillance**. The parent stays in full control and can pause sharing at any time.

---

## 📱 App Highlights & Approved Screens

| Screen | Description |
|---|---|
| **1. Welcome & Onboarding** | Warm greeting, value proposition, and quick sign-in |
| **2. Connect Box** | Camera QR code scan simulation, pairing with CareBox hardware |
| **3. Today (Dashboard)** | Calm greeting, live dose cards with times, 7-day adherence row |
| **4. Gentle Nudge Modal** | Kindness-first nudge sheet with "I'll call Mom" override |
| **5. History** | 7-day & monthly adherence calendar matrix, doctor summary export |
| **6. Refills** | Pill count tracking, days left indicator, 1-tap Tata 1mg/Apollo pharmacy ordering |
| **7. Privacy & Dignity** | Sharing pause toggle, DPDP Act 2023 data export, family circle manager |
| **8. Interactive Box Simulator** | Realistic physical 3-compartment CareBox hardware with Web Audio chimes |
| **9. Auth & Consent** | Secure OTP/Google sign-in + DPDP Act 3-point consent acceptance |
| **10. Family Invitations** | Invite siblings as Admins or Viewers with magic links |

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **State & Realtime:** React Context API + Supabase Realtime WebSocket subscriptions
- **Sound & Delight:** Web Audio API (soft musical chimes), micro-confetti feedback
- **Backend / DB:** Supabase PostgreSQL with 13 relational tables & Row Level Security (RLS)
- **Edge Computing:** Supabase Edge Functions (`box-event`, `nudge-evaluator`)
- **PWA:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Offline caching
- **Testing:** Vitest + React Testing Library (30 passing tests)
- **Hosting:** Ready for 1-click deployment on **Vercel**

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install
```bash
git clone https://github.com/SwarupKadam2007/carebox-family.git
cd carebox-family
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run the Test Suite
```bash
npm test
```
Runs 30 unit & component tests across dose logic, RLS rules, and screen rendering.

### 4. Build for Production
```bash
npm run build
```

---

## ☁️ Deploying to Vercel (1-Click)

The repository includes a ready-to-use [`vercel.json`](./vercel.json) configured for Single Page Application (SPA) routing, service worker headers, and caching.

### Steps:
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New Project** and select your GitHub repository `SwarupKadam2007/carebox-family`.
3. In **Environment Variables**, optionally add your Supabase credentials:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
4. Click **Deploy**.
5. *Note:* If you haven't set up Supabase yet, the app runs automatically in **Demo Mode** with all 10 screens and full simulation functional!

---

## 🗄️ Supabase Setup & Database Migrations

All SQL schema and security policies are deterministic and located in the `supabase/migrations/` directory:

1. `20261011000001_initial_schema.sql` — 13 tables (`profiles`, `families`, `members`, `parents`, `boxes`, `medicines`, `dose_schedules`, `dose_events`, `reminders`, `notifications`, `push_subscriptions`, `consents`, `audit_log`).
2. `20261011000002_rls_policies.sql` — Strict Row Level Security policies enforcing family tenancy and live sharing-pause privacy masking.

To apply migrations using the Supabase CLI:
```bash
supabase db push
# Or copy and paste the SQL files directly into your Supabase SQL Editor
```

---

## 🔒 Privacy & Compliance (DPDP Act 2023)

- **Purpose Limitation:** Medicine dose timestamp collection solely for family peace of mind.
- **Right to Pause:** The parent can toggle **"Pause Sharing"** directly from the box or app. RLS immediately filters out dose events from family viewers.
- **Right to Data Portability:** 1-tap JSON export of all personal health records.
- **Right to Erasure:** Full account deletion and cascading data scrub.
- **Never Red:** Alarms and warnings avoid harsh red colors; gentle amber is used exclusively.

---

## 📦 Pushing to your GitHub Repository

To push this codebase to your GitHub account:

```bash
# 1. Create a new repository named 'carebox-family' on https://github.com/new
# 2. Push the committed code:
git remote set-url origin https://github.com/SwarupKadam2007/carebox-family.git
git push -u origin main
```

---

*Designed and engineered with care for Indian families and seniors living independently.*
