# CareBox Family — Project Plan

> **Status:** DRAFT — awaiting approval before Phase 1 begins.
> **Date:** 2026-10-10
> **Author:** Engineering (Phase 0)

---

## 1. Product Summary

CareBox Family is the companion app for a smart one-touch pillbox.
It lets adult children see at a glance whether their elderly parent took the right medicines — **without nagging, surveillance or scary alarms**.

**Core loop:**

1. At dose time the physical box glows and chimes.
2. The parent presses **one big button**.
3. The family app shows a calm status card (green / amber / grey).
4. If a dose stays unconfirmed past a gentle delay, the family may send **one kind reminder**.

**Tagline:** _"Small button. Big peace of mind."_

---

## 2. Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | **React 18 + Vite + TypeScript** | Fast DX, tree-shaking, strong type safety. |
| Styling | **Tailwind CSS 3** | Utility-first matches the design-token approach; easy to enforce the colour palette. User explicitly requested Tailwind. |
| State | **React Context + Supabase Realtime subscriptions** | Lightweight; no Redux needed at this scale. |
| Backend | **Supabase** (Postgres, Auth, Realtime, Edge Functions, pg_cron) | Free tier covers our needs: 500 MB DB, 2 GB bandwidth, 500 K Edge Function invocations/month, built-in Auth with email OTP + Google. No custom server required. |
| Notifications | **Web Push** via service worker + Supabase Edge Function for push dispatch. | Free, works on Android Chrome / desktop; iOS Safari 16.4+. |
| ML (optional) | **Python 3.11 + scikit-learn + FastAPI** | Separate microservice, non-blocking. Only built in Phase 7. |
| Device mock | **Node.js CLI script** + optional ESP32 Arduino sketch | Simulates the box sending `POST /box/events`. |
| Tests | **Vitest** (unit/component) + **Playwright** (E2E) | Vitest is Vite-native; Playwright covers mobile viewports. |
| Deploy | **Vercel** (frontend) + **Supabase** (hosted) | Both have generous free tiers. |

### Why Supabase instead of a custom server?

- **Auth** (email OTP, Google) is built in — no Passport.js boilerplate.
- **Row Level Security** enforces authorization at the database level, not just in middleware.
- **Realtime** (Postgres changes → WebSocket) gives us live dose updates with zero custom WebSocket code.
- **Edge Functions** (Deno) handle the Box API endpoint and push-notification dispatch.
- **pg_cron** runs the scheduled "check for late doses" job.
- **Cost:** The free tier is sufficient for the initial user base. Scaling costs are predictable.
- **Trade-off:** We're coupled to Supabase's API surface and Edge Function runtime (Deno). For this project size, the trade-off is strongly favourable.

---

## 3. Folder Structure

```
carebox-app/
├── frontend/                 # React + Vite + TypeScript + Tailwind
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   ├── sw.js             # Service worker (push + cache)
│   │   ├── icons/            # App icons (192, 512)
│   │   └── sounds/           # Chime audio files
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/           # Page-level components
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Design-system primitives (Button, Card, Toggle…)
│   │   │   ├── dose/         # DoseCard, DoseStatusBadge, WeekRow…
│   │   │   ├── layout/       # Shell, BottomNav, Header…
│   │   │   └── simulator/    # CareBox simulator widget
│   │   ├── hooks/            # Custom hooks (useAuth, useDoses, useRealtime…)
│   │   ├── contexts/         # AuthContext, FamilyContext
│   │   ├── lib/              # supabaseClient, constants, helpers
│   │   ├── types/            # TypeScript types / interfaces
│   │   ├── mocks/            # Mock data for Phase 1
│   │   └── styles/           # Tailwind config extensions, global CSS
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── supabase/
│   ├── migrations/           # SQL migration files (schema, RLS, indexes)
│   ├── seed.sql              # Demo data
│   └── functions/            # Edge Functions (Deno/TypeScript)
│       ├── box-events/       # POST /box/events
│       ├── send-nudge/       # Push notification dispatch
│       └── check-late-doses/ # Scheduled: mark late, create nudge notifications
│
├── ml/                       # Optional — Phase 7
│   ├── generate_synthetic_data.py
│   ├── train.py
│   ├── serve.py              # FastAPI wrapper
│   ├── requirements.txt
│   └── model_card.md → ../docs/MODEL_CARD.md
│
├── device/
│   ├── mock_box.js           # Node CLI: simulates box button presses
│   ├── esp32_sketch/         # Arduino sketch for real hardware
│   └── README.md
│
├── legal/
│   ├── terms.md
│   ├── privacy.md
│   └── disclaimer.md
│
├── docs/
│   ├── PLAN.md               # ← you are here
│   ├── ARCHITECTURE.md
│   ├── BOX_API.md
│   ├── MODEL_CARD.md
│   ├── DEMO_SCRIPT.md
│   └── LEGAL_REVIEW_NEEDED.md
│
├── tests/
│   ├── unit/                 # Vitest unit tests
│   ├── component/            # Vitest + RTL component tests
│   └── e2e/                  # Playwright E2E tests
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Phased Roadmap

| Phase | Deliverables | Tests | Blocking? |
|-------|-------------|-------|-----------|
| **0** | PLAN.md, ARCHITECTURE.md | — | ✅ Approval gate |
| **1** | All screens with mock data, CareBox simulator, design system | Component snapshot tests | No |
| **2** | Supabase schema, RLS policies, auth, seed data | RLS policy tests (pgTAP / SQL) | No |
| **3** | Frontend ↔ Supabase: auth flow, realtime dose updates, invitations | Integration tests | No |
| **4** | Box API Edge Function, device mock, simulator → real API | API tests, mock script | No |
| **5** | Nudge logic, scheduled functions, Web Push, refill tracking | Unit tests for status + nudge logic | No |
| **6** | Legal documents, consent flow, data export, account deletion | Consent flow tests | No |
| **7** | Rule-based insights, optional ML model + MODEL_CARD.md | Model evaluation metrics | Non-blocking |
| **8** | PWA install, accessibility audit, E2E tests, deploy, DEMO_SCRIPT.md | Playwright E2E | No |

---

## 5. Data Flow

```
┌─────────────┐     HTTPS POST        ┌─────────────────┐
│  CareBox    │ ──────────────────────▶│ Supabase Edge   │
│  (physical  │   /box/events          │ Function         │
│   or sim)   │   {box_id, slot,       │ (validate token, │
│             │    taken_at}           │  insert event)   │
└─────────────┘                        └────────┬────────┘
                                                │ INSERT
                                                ▼
                                       ┌─────────────────┐
                                       │   Postgres       │
                                       │  dose_events     │──── Realtime
                                       │  (+ RLS)         │     broadcast
                                       └────────┬────────┘        │
                                                │                 │
          ┌─────────────────────────────────────┘                 │
          │  pg_cron (every 5 min)                                │
          ▼                                                       ▼
  ┌───────────────┐                                ┌──────────────────┐
  │ check-late-   │                                │  Family App      │
  │ doses fn      │───▶ notifications table        │  (React PWA)     │
  │ (mark late,   │───▶ Web Push via Edge Fn       │  subscribes to   │
  │  create nudge │                                │  Realtime channel │
  │  candidates)  │                                └──────────────────┘
  └───────────────┘
```

---

## 6. Key Design Decisions

### 6.1 No custom server
Supabase Edge Functions (Deno) handle the two API endpoints we need:
- `box-events` (device → DB)
- `send-nudge` (family app → push dispatch)

Everything else is direct Supabase client calls protected by RLS. This eliminates a whole deployment surface.

### 6.2 Timezone handling
- All timestamps stored in UTC.
- The frontend converts to `Asia/Kolkata` for display using `Intl.DateTimeFormat` or `date-fns-tz`.
- Dose schedule times are stored as local times (e.g., `"08:00"`) with an explicit timezone column defaulting to `"Asia/Kolkata"`.
- The scheduled function that checks for late doses converts to local time before comparing.

### 6.3 Privacy-by-design
- **No location, camera, contacts, or microphone** permissions requested — ever.
- **Sharing pause:** A single boolean `parents.sharing_paused`. When `true`, RLS policies on `dose_events`, `reminders`, and `dose_schedules` return zero rows for non-admin family members. The parent (or admin acting on parent's behalf) can toggle this.
- **Consent records:** Every terms/privacy acceptance is logged with version and timestamp. Users can withdraw consent (which triggers account restriction, not deletion — deletion is a separate explicit action).
- **Data export:** A Supabase Edge Function gathers all user data into a JSON file, downloadable from Settings.
- **Account deletion:** Soft-delete (anonymise PII, retain aggregate stats for 30 days for the family), then hard-delete. The user sees immediate removal.

### 6.4 "Never red" policy
The design system has no red tokens. The strongest alert colour is amber `#F2B33D`. Status indicators always pair colour with an icon and text label to meet WCAG requirements for colour-independent information.

### 6.5 Gentle nudge constraints
- Only one reminder per dose per day.
- Only sent after `nudge_delay` (default 60 min) has elapsed since the scheduled time.
- The family member chooses "Send a kind reminder" or "I'll call her" — both are logged, but "I'll call her" suppresses the push to the box.
- Wording is warm: "Mom hasn't confirmed her afternoon medicine yet. Send a gentle reminder?"

### 6.6 Refill tracking
- Each `medicine` row has `pills_left` and `pills_per_dose`.
- When a `dose_event` is created for a slot, the Edge Function decrements `pills_left` for all medicines assigned to that slot.
- When `pills_left / pills_per_dose < 5` (fewer than 5 days), the family sees an amber badge.
- "Order from pharmacy" is a link only — no payment integration.

---

## 7. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase free-tier limits hit | Service degradation | Monitor usage; upgrade is $25/mo. Alert in PLAN if we approach limits. |
| Web Push not supported on older iOS | Some family members miss nudges | Show in-app notification badge; document limitation. |
| Parent has no smartphone | Cannot use the simulator directly | The simulator is for demos/testing. Real use requires only the physical box (no app needed for the parent). |
| Medicine data sensitivity | Legal/compliance risk | Explicit consent, encryption at rest (Supabase default), RLS, data export/deletion, DPDP Act alignment. |
| ML model gives bad predictions | User loses trust or acts on wrong info | Label as "experimental", user toggle, never give medical advice, clear disclaimer. |
| Timezone edge cases (DST, travel) | Dose times shown wrong | India doesn't observe DST. If we expand to other markets, add per-family timezone config. |
| Network failures on box → API | Dose event lost | Box should retry with exponential backoff; the mock script demonstrates this. Real hardware stores events locally and syncs. |

---

## 8. Open Questions for You

Before I proceed to Phase 1, please confirm or decide:

1. **Existing code:** The workspace has a simple HTML/CSS/JS demo. I'll keep those files for reference but build the new app in the `/frontend` directory with the full React + Vite + TypeScript stack. OK?

2. **Tailwind version:** You specified Tailwind CSS. I'll use **Tailwind CSS v3** (stable, widely supported). Is v3 acceptable, or do you want v4?

3. **Font choice:** The brief mentions Inter or Poppins. The attached UI appears to use a rounded sans-serif (likely Poppins). I'll go with **Poppins** for headings and **Inter** for body text. Agree?

4. **Image assets:** For the onboarding illustration (family illustration) and other images, I'll generate them using the image generation tool. For the logo (teal heart + pillbox), I'll generate or build it as an SVG. OK?

5. **Supabase project:** In Phase 2 I'll write the migration SQL and seed files. You'll need to create a Supabase project and add the credentials to `.env`. I'll provide `.env.example`. Sound good?

6. **Deploy target:** Vercel for the frontend, Supabase hosted for the backend. Both free tier. Agreed?

7. **Scope check — Phase 1:** Phase 1 is frontend-only with mock data. I'll build all 7+ screens from the UI image, the bottom tab navigation, and the CareBox simulator. No backend calls yet. Correct?

---

## 9. Success Criteria

The project is successful when:

- [ ] A family member can see today's dose status (morning / afternoon / night) in real time.
- [ ] Pressing the box button (or simulator) marks a dose as taken and turns the card green.
- [ ] A gentle nudge can be sent exactly once for a late dose.
- [ ] The parent can pause sharing, hiding dose details from family members.
- [ ] Refill tracking warns when medicines are running low.
- [ ] Legal documents are displayed, consent is recorded, data can be exported/deleted.
- [ ] The app is installable as a PWA and loads fast on a low-end Android phone.
- [ ] All screens match the approved UI layout closely.
- [ ] No red alarms, no location tracking, no medical advice anywhere in the app.
