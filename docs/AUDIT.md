# CareBox Family — Demo → Production Audit Report

**Date:** October 12, 2026  
**Repository:** SwarupKadam2007/carebox-family (React 18 + Vite 6 + TypeScript 5 + Tailwind 3 + Supabase + Vercel PWA)  
**Author:** Antigravity (AI Coding Agent)  
**Status:** Complete — Phase 0 Audit Milestone  

---

## 1. Demo Mode Decision Points & Faked Data Audit

Demo Mode is primarily governed by whether Supabase environment variables are detected and validated at runtime. When absent, the application gracefully drops into an offline simulated environment.

### 1.1 Decision Architecture
* **[`src/lib/env.ts:71`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/lib/env.ts#L71)**:
  ```typescript
  export const IS_SUPABASE_CONFIGURED = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
  ```
  Evaluates boolean presence of valid Supabase endpoint and key.
* **[`src/context/AuthContext.tsx:57`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/context/AuthContext.tsx#L57)**:
  ```typescript
  const isDemoMode = !IS_SUPABASE_CONFIGURED;
  ```
  If `isDemoMode` is `true`:
  - Automatically synthesizes a mock authenticated user `user = { id: 'usr-1', email: 'demo@carebox.family' }` (lines 61–72).
  - Skips server authentication check and defaults active role to `admin`.
* **[`src/components/layout/AppShell.tsx:59-65`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/components/layout/AppShell.tsx#L59-L65)**:
  If `isDemoMode` is `true`, bypasses authentication gate, allowing navigation to private screens without signing in.

### 1.2 Comprehensive Inventory of Faked / Simulated Data

| File & Line | Component / Module | Nature of Mock Data |
|---|---|---|
| **[`src/mocks/initialData.ts:4-5`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L4-L5)** | Seed Constants | Hardcoded IDs: `MOCK_PARENT_ID = 'parent-1'`, `MOCK_FAMILY_ID = 'family-1'`. |
| **[`src/mocks/initialData.ts:7-17`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L7-L17)** | Parent Profile | Hardcoded `INITIAL_PARENT` profile for "Kalyani Kadam", avatar `/images/mom_avatar.jpg`, device ID `CB-8842-PUNE`. |
| **[`src/mocks/initialData.ts:19-23`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L19-L23)** | Schedule | Hardcoded `INITIAL_SCHEDULES`: Morning (08:00), Afternoon (14:00), Night (21:00). |
| **[`src/mocks/initialData.ts:25-34`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L25-L34)** | Dose Events | Hardcoded `INITIAL_DOSE_EVENTS`: Morning dose taken at 8:05 AM via `box`. |
| **[`src/mocks/initialData.ts:36-81`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L36-L81)** | Medicines | 4 hardcoded medicines: Metformin 500mg, Atorvastatin 10mg, Vitamin D3 1000 IU, Calcium + D3. |
| **[`src/mocks/initialData.ts:83-103`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L83-L103)** | Family Circle | 3 mock family members: "You" (admin), "Sneha" (viewer), "Dad" (viewer). |
| **[`src/mocks/initialData.ts:120-128`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/mocks/initialData.ts#L120-L128)** | Adherence Matrix | Hardcoded 7-day adherence matrix for past week (Oct 6–Oct 12). |
| **[`src/context/AppContext.tsx:107`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/context/AppContext.tsx#L107)** | Simulated Clock | Simulated clock preset to `14 * 60 + 5` (2:05 PM) to artificially trigger "afternoon due" state. |
| **[`src/context/AppContext.tsx:130`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/context/AppContext.tsx#L130)** | App State Refresh | `if (!IS_SUPABASE_CONFIGURED) return;` skips remote fetching; retains mock state. |
| **[`src/components/screens/ConnectBoxScreen.tsx:44-52`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/components/screens/ConnectBoxScreen.tsx#L44-L52)** | Hardware Pairing | Fake QR scan with `setTimeout(() => setScanning(false), 1200)` assigning mock ID `CB-8842-PUNE`. |
| **[`src/components/screens/LoginScreen.tsx:46-56`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/components/screens/LoginScreen.tsx#L46-L56)** | Authentication | Accepts fake OTP `123456` or one-click demo login button. |
| **[`src/components/screens/InviteScreen.tsx:36-47`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/components/screens/InviteScreen.tsx#L36-L47)** | Family Invitation | Appends in-memory member with `id: usr-${Date.now()}` without storing in database. |
| **[`src/components/screens/SimulatorScreen.tsx:1-260`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/components/screens/SimulatorScreen.tsx)** | Device Simulator | Pure local simulation of hardware button presses, chime sounds, and clock manipulation. |
| **[`src/lib/dataService.ts:18-294`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/lib/dataService.ts)** | Supabase Data Service | 10 CRUD functions bypass queries and return mock arrays when Supabase is not configured. |
| **[`src/lib/deviceApi.ts:35-65`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/src/lib/deviceApi.ts#L35-L65)** | Device Communication | Returns mock HTTP 200 payload for `postBoxEvent` and mock hardware status. |

---

## 2. Screen-by-Screen Data Source Audit

Review of all 10 application screens analyzing their current mock implementation against the target production data source:

| # | Screen / View Component | Route / Step | Current Demo / Mock Implementation | Target Production Data Source |
|---|---|---|---|---|
| **1** | **`TodayScreen.tsx`** | `tab === 'today'` | Consumes `parent`, `medicines`, `doseEvents`, and `simulatedMinutes` from `AppContext` (backed by `INITIAL_*` mocks). | Supabase `parents`, `dose_schedules`, `dose_events` (today's date in `Asia/Kolkata`), live Realtime subscription `postgres_changes`. |
| **2** | **`HistoryScreen.tsx`** | `tab === 'history'` | Renders hardcoded `INITIAL_WEEK_MATRIX` (Oct 6–Oct 12) + in-memory `doseEvents`. | Query `dose_events` joined with `dose_schedules` for past 7 & 30 days grouped by `event_date`. Doctor export (PDF / printable layout). |
| **3** | **`RefillsScreen.tsx`** | `tab === 'refills'` | Displays `medicines` array from `AppContext` (`INITIAL_MEDICINES`). No edit or add capability. | Supabase `medicines` table (`pills_left`, `pills_per_dose`). Needs Medicine CRUD dialog/screen (add, edit, refill, delete). |
| **4** | **`PrivacyDignityScreen.tsx`** | `tab === 'privacy'` | Reads `parent.sharingPaused` and `familyMembers` from in-memory state. Account deletion is simulated via toast. | `parents.sharing_paused` (reflected via Postgres RLS), `members` + `profiles`, `consents`, real account deletion edge function with cascading purge. |
| **5** | **`LoginScreen.tsx`** | `authStep === 'auth'` | Accepts mock OTP code `123456` or "Demo Mode" quick login button. | Supabase Auth: Google OAuth (`signInWithOAuth`) + Email Magic Link (`signInWithOtp`). |
| **6** | **`ConsentScreen.tsx`** | `authStep === 'consent'` | Updates local React boolean state; conditionally inserts to `consents` table if configured. | Mandatory DPDP 3-point consent (`terms`, `privacy`, `medicine_data`) stored in `public.consents` with version and timestamp. Blocks app until accepted. |
| **7** | **`OnboardingScreen.tsx`** | `authStep === 'onboarding'` | Static cards switching step to `'connect-box'` or `'main'`. No family creation. | Role path fork: "I take medicines" (creates family, sets role `parent`+`owner`, creates pairing code) vs "I care for someone" (create family or accept invite). |
| **8** | **`ConnectBoxScreen.tsx`** | `step === 'connect-box'` | Mock camera viewfinder with 1.2s timeout; assigns static box ID `CB-8842-PUNE`. | 6-digit `pairing_code` on `public.boxes` (expires in 10 min) or real QR scanner via `html5-qrcode` linking box to family. |
| **9** | **`InviteScreen.tsx`** | `step === 'invite'` | Appends mock object to local `familyMembers` list; logs console message. | `public.invitations` table, edge function `create-invite` returning SHA-256 hashed invite link, WhatsApp share link (`wa.me/?text=...`). |
| **10** | **`SimulatorScreen.tsx`** | `step === 'simulator'` | In-browser hardware simulator manipulating virtual clock and local dose state. | Retained for developer/QA use in dev mode only; real hardware relies on ESP32 calling edge function `/box-event` with hashed device token. |

---

## 3. Database Schema & Row-Level Security (RLS) Review

Review of all 13 tables across `supabase/migrations/`:
- `20261011000001_initial_schema.sql`
- `20261011000002_rls_policies.sql`
- `20261012000003_security_hardening.sql`

| # | Table Name | RLS Enabled? | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | Cross-Family Leakage / Policy Risks |
|---|---|---|---|---|---|---|---|
| **1** | **`profiles`** | **YES** | Self (`id = auth.uid()`) OR co-members of shared family | Self only (`id = auth.uid()`) | Self only (`id = auth.uid()`) | **MISSING** (No user delete policy) | **None.** Properly scoped. Deletion requires service_role cascade. |
| **2** | **`families`** | **YES** | Active family members (`is_family_member(id)`) | Authenticated (`created_by = auth.uid()`) | Family admin (`is_family_admin(id)`) | Family admin (`is_family_admin(id)`) | **None.** Users only see families they belong to. |
| **3** | **`members`** | **YES** | Active members of family | Admin OR self if invited as viewer | Family admin | Admin OR self (leave family) | **CRITICAL LOGIC BLOCKER:** When a user creates a new family in `families`, they cannot insert their initial membership row as `admin` under the current check (`is_family_admin(family_id) OR (user_id = auth.uid() AND role = 'viewer' AND status = 'invited')`). Needs trigger on `families` insert or updated check (`created_by = auth.uid()`). |
| **4** | **`parents`** | **YES** | Active family members | Family admin | Family admin | Family admin | **None.** Scoped to family. |
| **5** | **`boxes`** | **YES** | Family admin only | Family admin only | Family admin only | **MISSING** (Admins cannot unpair/delete boxes via client) | **None.** Viewers cannot inspect device tokens. |
| **6** | **`medicines`** | **YES** | Active family members | Family admin only | Family admin only | Family admin only | **None.** Viewers are strictly read-only. |
| **7** | **`dose_schedules`** | **YES** | Active family members | Family admin only (`FOR ALL`) | Family admin only | Family admin only | **None.** Correctly locked. |
| **8** | **`dose_events`** | **YES** | Admin OR (Viewer if `sharing_paused = false`) | Family admin OR active member | **NONE** (Immutable) | **NONE** (Immutable) | **None.** Dignity toggle strictly enforced at database engine level. |
| **9** | **`reminders`** | **YES** | Admin OR (Viewer if `sharing_paused = false`) | Active family member | **NONE** (Immutable) | **NONE** (Immutable) | **None.** |
| **10** | **`notifications`** | **YES** | Self (`user_id = auth.uid()`) | Self only (`FOR ALL`) | Self only | Self only | **LIMITATION:** Members cannot directly insert notifications for other members; cross-user nudges must be written via edge function / service role or database triggers. |
| **11** | **`push_subscriptions`** | **YES** | Self only | Self only | Self only | Self only | **None.** Private endpoints protected. |
| **12** | **`consents`** | **YES** | Self only | Self only | Self only | Self only | **None.** Audit-safe legal records. |
| **13** | **`audit_log`** | **YES** | Actor only (`actor_id = auth.uid()`) | Actor only (`actor_id = auth.uid()`) | **NONE** (Immutable) | **NONE** (Immutable) | **None.** Platform admin access will require a security definer view. |

---

## 4. Service Worker & PWA Manifest Review

### 4.1 Service Worker (`public/sw.js`)
* **Cache Name Versioning:** Hardcoded string `const CACHE_NAME = 'carebox-cache-v1'` ([`public/sw.js:6`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L6)). Not dynamically stamped with build hash or Vite release ID.
* **Cache Invalidation:** Cleans non-matching keys during `activate` ([`public/sw.js:31-40`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L31-L40)), but because the cache name is static, new deployments risk serving stale cached JavaScript bundles.
* **Missing Assets in Pre-cache:** `STATIC_ASSETS` contains `/favicon.svg` ([`public/sw.js:11`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L11)), which does not exist in `public/`, triggering a cache failure warning on installation.
* **Flawed Caching Strategy (API Caching Risk):**
  Lines 43–57 use a blanket `fetch` interceptor that caches **all** successful `GET` requests:
  ```javascript
  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  });
  ```
  **Critical Bug:** This intercepts and caches calls to `*.supabase.co` REST APIs! In offline conditions, stale health/dose data will be served from cache, and private data may remain stored in unencrypted CacheStorage.
* **Push Notification Handler:** Push listener exists ([`public/sw.js:60-89`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L60-L89)) with calm default wording. Notification click handler opens `/` rather than respecting the notification payload URL ([`public/sw.js:92-106`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L92-L106)).

### 4.2 Web App Manifest (`public/manifest.json`)
* Configured with `display: standalone`, `theme_color: #1F4E4B`, `background_color: #FCF6EE`.
* **Icons:** Only SVG icons (`/logo.svg`, `/favicon.svg`) are declared. Mobile browsers (especially Chromium on Android) require explicit PNG icons (`192x192` and `512x512`) to pass PWA installability criteria.

---

## 5. Edge Functions Review

### 5.1 `/box-event` (`supabase/functions/box-event/index.ts`)
* **Authentication:** Checks `verify_box_token` RPC and Supabase user session.
  * *Vulnerability / Logic Bug ([line 197-199](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/box-event/index.ts#L197-L199)):* When `!isAuthorized`, the function logs a warning to console but proceeds to process the event anyway! In production, unauthenticated device calls must strictly return HTTP `401 Unauthorized`.
* **Input Validation:** Validates `box_id`, `action`, `slot`, and `battery_pct` with manual type guards. (Needs Zod schema).
* **Idempotency:** Implemented correctly: checks Postgres error code `23505` (unique constraint `parent_id, slot, event_date`) and returns `200 { status: 'already_recorded' }` on duplicate button presses ([lines 232–239](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/box-event/index.ts#L232-L239)).
* **Rate Limiting:** Sliding-window rate limiter limits calls to 10 requests per minute per device ID.

### 5.2 `/nudge-evaluator` (`supabase/functions/nudge-evaluator/index.ts`)
* **Authentication:** Checks bearer token against `CRON_SECRET` and service role key.
  * *Security Flaw ([line 85](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/nudge-evaluator/index.ts#L85)):* `!cronSecret` allows requests if the secret is not configured in environment variables.
* **Input Validation & Schedule Logic:** Evaluates all active parents with `sharing_paused = false` against local time in `Asia/Kolkata`.
* **Idempotency:** Checks for existing `nudge_eligible_${slot}_${today}` notification before inserting, preventing duplicate rows ([lines 165–171](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/nudge-evaluator/index.ts#L165-L171)).
* **Missing Integration:** Does not yet trigger Web Push notifications via VAPID; only inserts in-app `notifications` rows.

---

## 6. Build, Test, Type-Check & Lint Verification

All automated verification commands were executed against the codebase:

```bash
# 1. Type Check
npx tsc --noEmit
# Exit Code: 0 (0 TypeScript errors)

# 2. Automated Test Suite
npm test (vitest run)
# Exit Code: 0
# Tests: 66 passed (66 total across 5 test suites)
# ✓ tests/unit/doseLogic.test.ts (9 tests)
# ✓ tests/unit/rls_logic.test.ts (22 tests)
# ✓ tests/unit/security.test.ts (25 tests)
# ✓ tests/component/screens.test.tsx (5 tests)
# ✓ tests/component/phase3_screens.test.tsx (5 tests)

# 3. Production Build
npm run build (tsc && vite build)
# Exit Code: 0
# dist/index.html                 1.58 kB │ gzip:   0.74 kB
# dist/assets/index-C-E_IJTS.css 39.23 kB │ gzip:   7.12 kB
# dist/assets/index-CIhdyp9j.js 493.17 kB │ gzip: 135.23 kB
# ✓ built in 2.90s

# 4. Lint / Development Build
npm run lint (vite build --mode development)
# Exit Code: 0
```

---

## 7. Prioritized Defect & Action Item List

### P0 — Core Flow & Usability Blockers
1. **Viewport Meta Blocks Zoom ([`index.html:7`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/index.html#L7)):** `maximum-scale=1.0, user-scalable=no` prevents pinch-to-zoom, severely impacting elderly accessibility.
2. **First Member Admin Insertion Chicken-and-Egg:** Initial family creator cannot insert themselves as `admin` due to RLS check `is_family_admin(family_id)`. Requires trigger or migration update.
3. **Silent Demo Fallback in Production:** Production builds with missing Supabase keys silently render fake mock data instead of presenting an explicit configuration error / setup screen.
4. **Missing Invitations Flow & Schema:** No `invitations` table exists. Sharing a family between different family members on separate devices cannot function.
5. **Missing Medicine CRUD UI:** Users cannot configure their real medication regimens, dosages, or pill counts from the app interface.
6. **No Real Pairing Mechanism:** QR scan is completely simulated with a static timer and hardcoded device ID.

### P1 — Security & Privacy Defects
1. **Unauthenticated Hardware Event Ingress ([`box-event/index.ts:197`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/box-event/index.ts#L197)):** Hardware endpoint logs warning on unauthenticated requests but still creates records. Must strictly return HTTP 401.
2. **Permissive Cron Secret Fallback ([`nudge-evaluator/index.ts:85`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/supabase/functions/nudge-evaluator/index.ts#L85)):** Evaluator runs without auth if `CRON_SECRET` is unset.
3. **Service Worker Supabase API Caching ([`public/sw.js:46-56`](file:///c:/Users/kadam/Downloads/carebox-app/carebox-app/public/sw.js#L46-L56)):** Service worker blindly caches all GET requests, including Supabase REST API responses, leaking private data to cache storage and serving stale dose statuses.
4. **Account Deletion Cascade Missing:** UI account deletion is a dummy toast. DPDP Act 2023 requires full cascade purge of user data and auth user deletion via Edge Function.

### P2 — Polish & Engineering Health
1. **Missing Global Error Boundary:** Uncaught render errors crash the entire React application with a blank screen.
2. **Missing Unified Loading / Empty / Error Components:** Screens lack standardized empty states (e.g. "Add your first medicine").
3. **Static Service Worker Cache Name:** Cache name is static string `carebox-cache-v1`; requires dynamic build versioning.
4. **Missing CI Pipeline:** No `.github/workflows/ci.yml` exists; README badges are static.
5. **Missing PWA PNG Icons:** PWA manifest lacks 192px and 512px PNG icons required for mobile installability.
