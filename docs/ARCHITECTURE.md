# CareBox Family — Architecture

> **Status:** DRAFT — companion to PLAN.md
> **Date:** 2026-10-10

---

## 1. System Overview

CareBox Family is a three-tier system:

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENTS                             │
│                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │  Family App  │   │   CareBox    │   │  Device Mock │ │
│  │  (React PWA) │   │  Simulator   │   │  (Node CLI)  │ │
│  │              │   │  (in-app)    │   │              │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │ Supabase JS SDK  │ Supabase JS SDK  │ HTTPS POST
          │ + Realtime WS    │                  │ (bearer token)
          ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE PLATFORM                     │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │    Auth      │  │   Edge      │  │   Realtime      │  │
│  │  (email OTP, │  │  Functions  │  │  (Postgres      │  │
│  │   Google)    │  │             │  │   Changes →     │  │
│  └─────────────┘  │ ┌─────────┐ │  │   WebSocket)    │  │
│                    │ │box-event│ │  └─────────────────┘  │
│                    │ │send-nudg│ │                        │
│                    │ │check-lat│ │  ┌─────────────────┐  │
│                    │ │export   │ │  │    Storage       │  │
│                    │ └─────────┘ │  │  (avatars,       │  │
│                    └─────────────┘  │   exports)       │  │
│                                     └─────────────────┘  │
│  ┌───────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                   │   │
│  │  (Row Level Security on every table)              │   │
│  │  (pg_cron for scheduled jobs)                     │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
          │ (optional, Phase 7)
          ▼
┌──────────────────────┐
│   ML Service         │
│   (FastAPI + sklearn) │
│   Adherence risk     │
│   prediction         │
└──────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology
- **React 18** with functional components and hooks
- **Vite** for bundling and dev server
- **TypeScript** for type safety
- **Tailwind CSS 3** for styling
- **React Router v6** for client-side routing
- **Supabase JS client** (`@supabase/supabase-js`) for auth, database, realtime

### 2.2 Component Hierarchy

```
App
├── AuthProvider (context)
│   ├── SplashScreen
│   ├── AuthPage (Login / Signup)
│   ├── ConsentScreen (Terms + Privacy checkboxes)
│   └── ProtectedLayout
│       ├── FamilyProvider (context)
│       ├── Header
│       ├── <Outlet> (page content via React Router)
│       │   ├── OnboardingPage
│       │   ├── ConnectBoxPage (3-step wizard)
│       │   ├── TodayPage (Home)
│       │   │   ├── GreetingHeader
│       │   │   ├── StatusSummaryBanner
│       │   │   ├── DoseCard × 3 (Morning, Afternoon, Night)
│       │   │   └── WeekRow (7 day circles)
│       │   ├── HistoryPage
│       │   │   ├── ViewToggle (Weekly / Monthly)
│       │   │   ├── CalendarGrid
│       │   │   ├── InsightCard
│       │   │   └── ShareWithDoctorButton
│       │   ├── RefillsPage
│       │   │   ├── MedicineCard × N
│       │   │   ├── RemindToOrderButton
│       │   │   └── OrderFromPharmacyLink
│       │   ├── SettingsPage
│       │   │   ├── PrivacyDignitySection
│       │   │   │   ├── SharingToggles
│       │   │   │   └── FamilyMembersList
│       │   │   ├── DoseTimesEditor
│       │   │   ├── NudgeDelayPicker
│       │   │   ├── NotificationPreferences
│       │   │   └── AccountSection
│       │   │       ├── ExportMyData
│       │   │       └── DeleteAccount
│       │   ├── SimulatorPage
│       │   │   ├── BoxVisual (3 compartments + LED ring)
│       │   │   ├── BigButton
│       │   │   └── ChimePlayer
│       │   ├── TermsPage
│       │   ├── PrivacyPolicyPage
│       │   └── AboutSafetyPage
│       └── BottomNav (Today | History | Refills | Settings)
└── NudgeModal (overlay, triggered by notification)
```

### 2.3 Routing

| Path | Component | Auth required? |
|------|-----------|---------------|
| `/` | SplashScreen | No |
| `/auth` | AuthPage | No |
| `/consent` | ConsentScreen | Yes (pre-setup) |
| `/onboarding` | OnboardingPage | Yes |
| `/connect-box` | ConnectBoxPage | Yes |
| `/today` | TodayPage | Yes |
| `/history` | HistoryPage | Yes |
| `/refills` | RefillsPage | Yes |
| `/settings` | SettingsPage | Yes |
| `/settings/privacy` | PrivacyDignityPage | Yes |
| `/settings/account` | AccountPage | Yes |
| `/simulator` | SimulatorPage | Yes |
| `/terms` | TermsPage | No |
| `/privacy-policy` | PrivacyPolicyPage | No |
| `/about` | AboutSafetyPage | No |

### 2.4 State Management

```
AuthContext
├── user: User | null
├── session: Session | null
├── loading: boolean
├── signIn(), signOut(), signUp()

FamilyContext
├── family: Family | null
├── parent: Parent | null
├── members: Member[]
├── medicines: Medicine[]
├── doseSchedules: DoseSchedule[]
├── todayEvents: DoseEvent[]
├── role: 'admin' | 'viewer'
├── sharingPaused: boolean
└── refetch()
```

Realtime subscriptions are set up in `FamilyContext` to listen for:
- `dose_events` INSERT → update today's status
- `parents` UPDATE → detect sharing pause
- `notifications` INSERT → show nudge modal / badge

### 2.5 Offline Strategy (PWA)
- **Service worker** caches the app shell (HTML, CSS, JS, fonts, icons).
- **Network-first** for API data, with stale cache as fallback.
- **Pending actions queue:** If offline when the simulator button is pressed, queue the event and sync when back online.

---

## 3. Database Schema

### 3.1 Entity-Relationship Diagram

```
profiles ──1────M── members ──M────1── families
                                         │
                                     1───M
                                         │
                                      parents
                                     /   |   \
                                    /    |    \
                              boxes  medicines  dose_schedules
                                         |
                                    dose_events
                                         |
                                    reminders

profiles ──1────M── notifications
profiles ──1────M── push_subscriptions
profiles ──1────M── consents
profiles ──1────M── audit_log (as actor)
```

### 3.2 Table Definitions

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- A family unit (one per CareBox)
CREATE TABLE families (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_by  UUID REFERENCES profiles(id),
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Family membership with roles
CREATE TABLE members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id   UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role        TEXT CHECK (role IN ('admin', 'viewer')) NOT NULL DEFAULT 'viewer',
    status      TEXT CHECK (status IN ('invited', 'active', 'removed')) NOT NULL DEFAULT 'invited',
    invited_by  UUID REFERENCES profiles(id),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (family_id, user_id)
);

-- The elderly parent (box owner, may not have a user account)
CREATE TABLE parents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id       UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
    name            TEXT NOT NULL,
    photo_url       TEXT,
    sharing_paused  BOOLEAN DEFAULT false,
    timezone        TEXT DEFAULT 'Asia/Kolkata',
    nudge_delay_min INTEGER DEFAULT 60 CHECK (nudge_delay_min >= 15),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Physical or simulated CareBox device
CREATE TABLE boxes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id           UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
    device_token_hash   TEXT NOT NULL,          -- bcrypt hash of the bearer token
    qr_code             TEXT,                    -- QR code data for pairing
    last_seen           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Medicines assigned to a parent
CREATE TABLE medicines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id       UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
    name            TEXT NOT NULL,
    strength        TEXT,                        -- e.g. "500mg"
    form            TEXT DEFAULT 'tablet',       -- tablet, capsule, etc.
    slot            TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    pills_per_dose  INTEGER DEFAULT 1 CHECK (pills_per_dose >= 1),
    pills_left      INTEGER DEFAULT 30 CHECK (pills_left >= 0),
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- When each dose slot is scheduled (local time)
CREATE TABLE dose_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
    slot        TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    time_local  TIME NOT NULL,                   -- e.g. '08:00:00'
    active      BOOLEAN DEFAULT true,
    UNIQUE (parent_id, slot)
);

-- Each confirmed dose event
CREATE TABLE dose_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
    slot        TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    taken_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    source      TEXT CHECK (source IN ('box', 'manual', 'simulator')) DEFAULT 'box',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (parent_id, slot, event_date)          -- one event per slot per day
);

-- Reminders sent (nudges or "I'll call" actions)
CREATE TABLE reminders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID REFERENCES parents(id) ON DELETE CASCADE NOT NULL,
    slot        TEXT CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
    reminder_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type        TEXT CHECK (type IN ('reminder', 'call')) NOT NULL,
    sent_by     UUID REFERENCES profiles(id),
    sent_at     TIMESTAMPTZ DEFAULT now(),
    UNIQUE (parent_id, slot, reminder_date)       -- one reminder per slot per day
);

-- In-app notifications for family members
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type        TEXT NOT NULL,                     -- 'nudge_available', 'dose_taken', 'refill_low', etc.
    title       TEXT NOT NULL,
    body        TEXT,
    payload     JSONB DEFAULT '{}',
    read_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Web Push subscription endpoints
CREATE TABLE push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    endpoint    TEXT NOT NULL,
    keys        JSONB NOT NULL,                    -- {p256dh, auth}
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, endpoint)
);

-- Legal consent records
CREATE TABLE consents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    document    TEXT CHECK (document IN ('terms', 'privacy', 'medicine_data')) NOT NULL,
    version     TEXT NOT NULL,                     -- e.g. '1.0.0'
    accepted_at TIMESTAMPTZ DEFAULT now(),
    ip_hash     TEXT                               -- SHA-256 hash of IP, not the IP itself
);

-- Audit trail for sensitive actions
CREATE TABLE audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    UUID REFERENCES profiles(id),
    action      TEXT NOT NULL,                     -- e.g. 'member.invite', 'sharing.pause', 'account.delete'
    target      TEXT,                              -- e.g. 'parent:uuid', 'member:uuid'
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Row Level Security Strategy

Every table has RLS enabled. The core principle:

```
┌───────────────────────────────────────────────────────┐
│  Can this user see/edit data for this family?         │
│                                                       │
│  1. Is the user an active member of the family?       │
│     → SELECT on members WHERE user_id = auth.uid()    │
│       AND status = 'active'                           │
│                                                       │
│  2. What is their role?                               │
│     → 'admin' can INSERT/UPDATE/DELETE                │
│     → 'viewer' can SELECT only                        │
│                                                       │
│  3. Is sharing paused?                                │
│     → If parents.sharing_paused = true,               │
│       viewers see no dose_events or reminders          │
│       (admins still see everything)                   │
│                                                       │
│  4. Is this their own profile/notification data?      │
│     → profiles, notifications, push_subscriptions,    │
│       consents: user_id = auth.uid()                  │
│                                                       │
│  5. Audit log: INSERT only (no SELECT for users)      │
└───────────────────────────────────────────────────────┘
```

Key RLS helper function:

```sql
-- Returns the family_ids the current user is an active member of
CREATE OR REPLACE FUNCTION get_user_family_ids()
RETURNS UUID[] AS $$
    SELECT array_agg(family_id)
    FROM members
    WHERE user_id = auth.uid() AND status = 'active';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns the role of the current user in a given family
CREATE OR REPLACE FUNCTION get_user_role(fam_id UUID)
RETURNS TEXT AS $$
    SELECT role
    FROM members
    WHERE family_id = fam_id AND user_id = auth.uid() AND status = 'active'
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

---

## 4. Edge Functions

### 4.1 `box-events` — Device → Database

```
POST /functions/v1/box-events
Authorization: Bearer <device_token>
Content-Type: application/json

{
    "box_id": "uuid",
    "slot": "morning" | "afternoon" | "night",
    "taken_at": "2026-10-10T08:05:00+05:30"   // optional, defaults to now()
}

→ 201 Created { "event_id": "uuid" }
→ 400 Bad Request (invalid slot, missing box_id)
→ 401 Unauthorized (invalid or missing token)
→ 409 Conflict (dose already recorded for this slot today)
→ 429 Too Many Requests (rate limit: 10 req/min per box)
```

**Logic:**
1. Validate bearer token against `boxes.device_token_hash` (bcrypt compare).
2. Look up `parent_id` from the box.
3. Check no event exists for this slot + today.
4. INSERT into `dose_events`.
5. Decrement `pills_left` on all `medicines` for this slot.
6. Return 201.

### 4.2 `send-nudge` — Family → Push to Box

```
POST /functions/v1/send-nudge
Authorization: Bearer <supabase_session_token>
Content-Type: application/json

{
    "parent_id": "uuid",
    "slot": "afternoon",
    "type": "reminder" | "call"
}

→ 200 OK { "reminder_id": "uuid" }
→ 400 (dose not late, or reminder already sent)
→ 403 (not a member of this family)
```

**Logic:**
1. Verify the user is an active member of the parent's family.
2. Verify the dose is actually late (past schedule time + nudge_delay).
3. Verify no reminder exists for this slot + today.
4. INSERT into `reminders`.
5. If type = `"reminder"`: send Web Push to all family members + glow the box (via Realtime broadcast).
6. If type = `"call"`: just log it, no push.
7. INSERT into `audit_log`.

### 4.3 `check-late-doses` — Scheduled (pg_cron)

Runs every 5 minutes:

1. For each active parent, for each dose slot with a schedule time:
   - If current local time > schedule time AND no `dose_event` exists for today + this slot:
     - If current local time > schedule time + `nudge_delay`:
       - Status = `late`
       - If no `reminder` exists for today + this slot: create a `notification` for each family member ("Mom hasn't confirmed her afternoon medicine yet. Send a gentle reminder?")
     - Else: status = `due`

### 4.4 `export-data` — User Data Export

Returns a JSON file with all the user's data across all tables, served as a download.

### 4.5 `delete-account` — Account Deletion

Anonymises PII (name → "Deleted User", email → null), removes avatar, deletes push subscriptions, revokes sessions. After 30 days, hard-delete all rows.

---

## 5. Dose Status State Machine

Each dose slot on a given day has exactly one status:

```
                   ┌──────────────┐
                   │              │
                   │    later     │   (slot time is in the future,
                   │   (grey)     │    and a prior slot is still next/due)
                   │              │
                   └──────┬───────┘
                          │ (clock reaches slot time - becomes first upcoming)
                          ▼
                   ┌──────────────┐
                   │              │
                   │    next      │   (first upcoming slot, not yet due)
                   │   (grey,     │
                   │    highlighted│
                   └──────┬───────┘
                          │ (clock passes slot time)
                          ▼
                   ┌──────────────┐
          ┌────────│              │
          │        │    due       │   (time has passed, not yet confirmed)
          │        │   (amber)    │
          │        └──────┬───────┘
          │               │ (clock passes slot time + nudge_delay)
          │               ▼
          │        ┌──────────────┐
          │        │              │
          │        │    late      │   (nudge available, still amber)
          │        │   (amber,    │
          │        │    pulsing)  │
          │        └──────┬───────┘
          │               │
          ├───────────────┤ (button pressed at any point)
          │               │
          ▼               ▼
   ┌──────────────┐
   │              │
   │    taken     │   (confirmed — green ✓)
   │   (green)    │
   │              │
   └──────────────┘
```

**Note:** There is NO "missed" status. If a dose reaches the end of the day without confirmation, it simply stays in its last state (late). The History calendar marks it as "missed" (grey dot) retroactively when rendering past days.

**Status computation function** (pure, no side effects):

```typescript
type DoseStatus = 'taken' | 'due' | 'late' | 'next' | 'later';

function computeDoseStatus(
    slot: Slot,
    scheduleTime: string,       // "08:00"
    nudgeDelayMin: number,      // 60
    nowLocal: Date,
    event: DoseEvent | null,
    allSlots: { slot: Slot; scheduleTime: string }[]
): DoseStatus {
    if (event) return 'taken';

    const scheduleDT = parseTimeToday(scheduleTime, nowLocal);
    const lateDT = addMinutes(scheduleDT, nudgeDelayMin);

    if (nowLocal >= lateDT) return 'late';
    if (nowLocal >= scheduleDT) return 'due';

    // Determine if this is the next upcoming slot
    const upcomingSlots = allSlots
        .filter(s => parseTimeToday(s.scheduleTime, nowLocal) > nowLocal)
        .sort((a, b) => /* by time */);

    if (upcomingSlots[0]?.slot === slot) return 'next';

    return 'later';
}
```

---

## 6. Realtime Data Flow

```
dose_events table change
    │
    ├──▶ Supabase Realtime (postgres_changes)
    │       │
    │       └──▶ Family App (subscribed to parent_id)
    │               │
    │               └──▶ React state update → DoseCard re-renders green
    │
    └──▶ Trigger: decrement medicine pills_left
            │
            └──▶ If pills_left < threshold → insert notification
```

The React app subscribes on mount:

```typescript
supabase
    .channel(`doses:${parentId}`)
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dose_events',
          filter: `parent_id=eq.${parentId}` },
        (payload) => {
            addEvent(payload.new as DoseEvent);
        }
    )
    .subscribe();
```

---

## 7. Security Measures

| Measure | Implementation |
|---------|---------------|
| HTTPS only | Vercel + Supabase enforce HTTPS. HSTS headers. |
| Input validation | Edge Functions validate all inputs with Zod schemas. Frontend validates before submit. |
| Output escaping | React auto-escapes JSX. No `dangerouslySetInnerHTML`. |
| Rate limiting | Edge Functions: 10 req/min per box, 30 req/min per user. Use Supabase rate limiting or in-function counting. |
| RLS | Every table. No `service_role` key in the client. |
| Device tokens | Stored as bcrypt hashes. Raw token shown once during pairing, never stored. |
| No secrets in client | Supabase `anon` key only (designed to be public, gated by RLS). VAPID keys split: public in client, private in Edge Function env. |
| Audit log | All sensitive actions logged with actor, action, target, timestamp. |
| Dependency audit | `npm audit` in CI. Renovate or Dependabot for updates. |
| CSP headers | Content-Security-Policy set in Vercel config. |

---

## 8. Accessibility Plan

| Requirement | Implementation |
|-------------|---------------|
| WCAG AA contrast | All text/background combos checked. Teal #2E7D79 on cream #FCF6EE = 5.2:1 ✓ |
| Text scaling 200% | Use `rem` units. Test with browser zoom. Tailwind's text utilities use rem. |
| Screen reader | All interactive elements have `aria-label`. Status announced with `aria-live="polite"`. Icons have `aria-hidden="true"` + visible text. |
| Keyboard nav | All buttons, links, toggles focusable. Tab order logical. Focus ring visible (Tailwind `focus-visible:ring`). |
| Colour independence | Every status uses colour + icon + text (e.g., green ✓ "Taken 8:05 AM", not just a green dot). |
| Touch targets | Minimum 44×44px on all interactive elements. Tailwind `min-h-[44px] min-w-[44px]`. |
| Motion | Respect `prefers-reduced-motion`. Disable pulse animation on the "late" card. |

---

## 9. Performance Budget

| Metric | Target | How |
|--------|--------|-----|
| First Contentful Paint | < 1.5s on 3G | Code splitting, preload fonts, cached shell |
| Largest Contentful Paint | < 2.5s | Compress images, lazy load non-critical routes |
| Total bundle size | < 200KB gzipped | Tree-shaking, dynamic imports for Simulator + History |
| Time to Interactive | < 3s on low-end device | Minimal JS on first load, defer analytics |

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)
- `computeDoseStatus()` — all state transitions
- `canSendNudge()` — boundary cases
- `computeRefillDaysLeft()` — edge cases (0 pills, fractional days)
- Date/timezone helpers

### 10.2 Component Tests (Vitest + React Testing Library)
- `DoseCard` renders correct status, colour, and text
- `NudgeModal` shows correct wording and disables after send
- `WeekRow` highlights today
- `MedicineCard` shows amber when low

### 10.3 RLS Policy Tests (SQL)
- Viewer cannot INSERT into `medicines`
- Outsider gets zero rows from `dose_events`
- Sharing paused → viewer gets zero rows from `dose_events`
- Admin can always read even when sharing paused

### 10.4 E2E Tests (Playwright)
- **Happy path:** Login → Today shows 3 slots → Simulator → press button → dose turns green
- **Nudge flow:** Set clock ahead → "due" → wait past nudge delay → "late" → send nudge → confirm → green
- **Privacy:** Pause sharing → viewer sees "Sharing paused" → admin still sees data

---

## 11. Deployment Architecture

```
┌─────────────┐         ┌──────────────────────┐
│   Vercel    │ ───────▶│   Supabase (hosted)   │
│  (frontend) │  API     │                      │
│  CDN edge   │  calls   │  - Postgres          │
│  nodes      │         │  - Auth              │
│             │         │  - Edge Functions    │
│  PWA cached │         │  - Realtime          │
│  shell      │         │  - Storage           │
└─────────────┘         └──────────────────────┘
                               │ (optional)
                               ▼
                        ┌──────────────┐
                        │ ML Service   │
                        │ (Cloud Run   │
                        │  or Railway) │
                        └──────────────┘
```

### Environment Variables

```env
# .env.example

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Web Push (VAPID)
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key

# Edge Function secrets (set in Supabase dashboard, not in client)
# VAPID_PRIVATE_KEY=...
# VAPID_SUBJECT=mailto:you@example.com
# BOX_API_RATE_LIMIT=10
```

---

## 12. i18n Readiness

While the initial release is English only, the architecture supports future Hindi and Marathi translations:

- All user-facing strings are extracted to a `locales/` directory structure.
- String keys follow a `namespace.key` pattern (e.g., `today.greeting`, `nudge.prompt`).
- The `<I18nProvider>` wraps the app and provides a `t()` function via context.
- Phase 1 builds with raw strings first; Phase 8 extracts them. This avoids premature abstraction while keeping the path clear.

---

## 13. Monitoring and Observability (Post-Launch)

Not built during the initial phases, but planned:

- **Error tracking:** Sentry (free tier) for frontend errors.
- **Uptime:** Supabase built-in health checks + UptimeRobot (free).
- **Analytics:** Privacy-respecting, self-hosted (Plausible or Umami), only if user consents. No Google Analytics.
- **Supabase dashboard:** Monitor DB size, function invocations, realtime connections.
