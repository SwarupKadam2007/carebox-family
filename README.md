# CareBox Family

A simple working demo of the **CareBox Family** app: the family-side companion for a smart one-touch pillbox that helps adult children feel confident their elderly parents took their medicines, **without nagging or surveillance**.

## The problem
Adult children living away can't tell if the right medicines were taken. Calling to ask "did you take your tablet?" worries the family and makes the parent feel watched.

## The idea
- The physical box has 3 compartments (Morning, Afternoon, Night). At dose time the right one glows and chimes.
- The parent opens it and presses **one big button**.
- The family app shows a calm status: green = taken, amber = due, grey = later.
- If a dose is still not confirmed after a set time, the family gets **one gentle nudge** (never an alarm).
- The family sees status only. No location, no live feed. The parent stays in control.

## Run it (no install needed)
Option A: double-click `index.html`.
Option B: in this folder run `python3 -m http.server 8000` and open http://localhost:8000

Demo tip: open the page in **two browser tabs**. Press a "TAKEN" button in the DEMO panel of one tab and watch the other update. Use "Pretend the time is" to test the nudge without waiting.

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure: Today, History, demo box panel |
| `style.css` | Mobile-first styles (teal, green, amber, grey) |
| `app.js` | All logic: dose status, one-tap taken, gentle nudge, history, localStorage |
| `TASKS.md` | Step-by-step roadmap for the IDE agent |

## Design rules (keep these in every change)
1. Colours: teal `#2E7D79`, green `#27A348` (taken), amber `#F2B33D` (due), grey `#C3CDCC` (later). **Never use red alarms.**
2. Tone is caring, never scary: "Send a kind reminder", not "ALERT".
3. Privacy first: status only. Do not add location tracking or cameras.
4. Large, readable text and tap targets of at least 44px.
5. Keep it simple: plain HTML/CSS/JS until Step 7 in `TASKS.md`.

## How to work with the IDE agent
Open this folder in the IDE, then tell the agent:

> Read README.md and TASKS.md. Do **Step 1 only**, check it against its "Done when" list, update the checkbox in TASKS.md, then stop and summarise what changed. Wait for me before starting the next step.

Repeat with "Do Step 2 only", and so on.
