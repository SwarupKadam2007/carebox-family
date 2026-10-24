# CareBox Family — Demo Script

**Version:** 1.0 · **Duration:** ~5 minutes · **Live App:** https://carebox-family.vercel.app

---

## Setup Before the Demo

1. Open **https://carebox-family.vercel.app** on your phone (or share screen to a laptop).
2. The app starts in **Demo Mode** — no Supabase login needed. A yellow banner will confirm this.
3. Enable the toolbar at the top by making sure you're in development mode (or use the dev URL).
4. Optional: Open a second window/tab to simulate a "family member view" alongside the demo.

---

## The Story

> *"Priya lives in Bengaluru. Her mother, Meera, lives alone in Pune and takes three medicines a day — morning, afternoon, and night. Priya can't call every day to check. She installed CareBox Family so she can see at a glance whether Meera took her medicines — without turning it into surveillance."*

---

## Scene 1 — Welcome (30 seconds)

**Say:** "This is the CareBox Family app. When Meera presses the big button on the physical pillbox, Priya sees the green card instantly — anywhere in the world."

**Do:**
- Point to the app header — "CareBox Family · Phases 1–3 Ready"
- Show the **Today** tab with three dose cards: Morning (✓ taken), Afternoon (⏰ due), Night (upcoming)
- Tap the **Morning card** — it flips to show confirmation time

---

## Scene 2 — The Hardware Simulator (60 seconds)

**Say:** "We don't have the physical box here, but we have a simulator. Let me be Meera and press the afternoon button."

**Do:**
1. Click the **"Box Simulator"** button in the header toolbar
2. The Simulator screen shows a 3D pillbox with Morning / Afternoon / Night compartments
3. Select the **Afternoon** compartment (amber = due)
4. Tap the big round **"PRESS"** button
5. Hear the gentle chime 🔔
6. Navigate back to **Today** — the Afternoon card is now green ✅ with confetti burst

**Talking point:** "Meera only had to press one button. Priya sees this update within 1-2 seconds via Supabase Realtime — no polling, just a live WebSocket."

---

## Scene 3 — Gentle Nudge (45 seconds)

**Say:** "What if Meera forgets? Priya gets a gentle, kind reminder option — not an alarm."

**Do:**
1. Click the **"⏰ Nudge"** button in the toolbar (or tap the amber Afternoon card when it's late)
2. The Gentle Nudge bottom sheet appears
3. Show the warm wording: *"Mom hasn't confirmed her afternoon medicine yet. It's been a little while..."*
4. Show the two options: **"Send a gentle reminder 💙"** and **"I'll call her instead 📞"**
5. Tap "Send a gentle reminder" — toast appears: "Reminder sent to Meera"
6. Show the reminder badge on the card: *"Reminder sent · 2:15 PM"*

**Talking point:** "Only one reminder per dose per day. The language is warm, not clinical. No red alarms anywhere — this is by design."

---

## Scene 4 — Privacy & Dignity (45 seconds)

**Say:** "Meera has full control. At any moment, she can pause sharing — which immediately hides her dose details from everyone."

**Do:**
1. Click the **"Live Sharing"** button in the toolbar → it turns amber: *"Sharing Paused"*
2. Switch to the **Admin → Viewer** role toggle in the toolbar
3. Navigate to **Today** — the cards now show *"Sharing paused by Mom · Data hidden"*
4. Switch role back to Admin — data reappears
5. Toggle sharing back to **Live Sharing**

**Talking point:** "This isn't a feature we added reluctantly — it's the core product value. Dignity first."

---

## Scene 5 — Refills & Medicine Management (30 seconds)

**Do:**
1. Tap the **💊 Refills** tab
2. Show the medicine list: Metformin (7 days left), Amlodipine (3 days left 🔶 amber badge)
3. Tap **Amlodipine** — modal opens showing slot, dosage, current stock
4. Tap the **"Order from pharmacy"** button — opens 1mg/Apollo/PharmEasy links

**Talking point:** "When stock drops below 5 days, the amber badge appears. We never add red — the design has no red tokens at all."

---

## Scene 6 — Family Invite & RBAC (30 seconds)

**Do:**
1. Click **"Invite"** in the toolbar
2. Show the Invite screen: existing members (Priya → Admin, Rohan → Viewer)
3. Show the "Invite by email" form
4. Switch to Viewer role and try to visit Simulator → "Admin Access Required" screen

**Talking point:** "Viewers can see dose status. Only admins can manage medicines, invite people, or access hardware features. Privacy is enforced at the database level too — Row Level Security in Postgres."

---

## Scene 7 — Settings & Data Rights (30 seconds)

**Do:**
1. Tap the **⚙️ Settings** tab
2. Show "Export all my data (JSON)" → tap it → JSON downloads
3. Show "Terms of Service" and "Privacy Policy (India DPDP Act 2023)" links
4. Point to the dignity banner at the bottom: *"Mom stays in control. Your privacy, her choice."*

---

## Scene 8 — PWA Installation (15 seconds, if on mobile)

**Do:**
1. Open **https://carebox-family.vercel.app** in Chrome on Android
2. Tap the "Add to Home Screen" banner that appears
3. Show the installed icon on the home screen with the CareBox teal logo
4. Open it — it runs in standalone mode (no browser chrome)

---

## Closing (30 seconds)

**Say:**
> *"CareBox Family gives Priya peace of mind and Meera her dignity. One button. One green card. No nagging, no alarms, no surveillance.*
> *The app is live at carebox-family.vercel.app. The full stack is Supabase + React + Vercel — entirely on free tiers for now.*
> *The physical box connects via a Supabase Edge Function. We have a Node.js simulator CLI that any hardware team can plug into."*

**Show:**
- https://carebox-family.vercel.app (live URL)
- https://github.com/SwarupKadam2007/carebox-family (GitHub repo)

---

## Frequently Asked Questions

**Q: Does the app track location?**
A: Never. No location, camera, contacts, or microphone permissions. The app only knows whether a button was pressed.

**Q: What if Meera doesn't have a smartphone?**
A: Meera only needs the physical box — she never touches the app. The app is for the family.

**Q: How fast is the update?**
A: Under 2 seconds via Supabase Realtime (WebSocket). No polling.

**Q: Is this HIPAA/DPDP compliant?**
A: We follow India's DPDP Act 2023 — explicit consent, data portability, right to erasure. Not a medical device (no HIPAA obligation), but designed with the same principles.

**Q: What does the physical box look like?**
A: Prototype: an ESP32-based device with three compartments and one large glowing button. The Arduino sketch is in `/device/esp32_sketch/` in the repo.

---

*Script prepared by CareBox Engineering · October 2026*
