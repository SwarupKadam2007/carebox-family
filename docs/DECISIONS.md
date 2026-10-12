# CareBox Family — Architectural Decision Records (ADRs)

**Date:** October 12, 2026  
**Status:** Living Document  

---

## ADR 001: Separation of Demo Mode and Production Builds
* **Context:** In Phase 0 audit, we discovered that when Supabase keys were missing, the app silently rendered mock data.
* **Decision:**
  - In development mode (`import.meta.env.DEV`), missing keys trigger Demo Mode with a clear amber banner so developers and testers can evaluate the UI without a database backend.
  - In production mode (`import.meta.env.PROD`), missing keys MUST NOT silently render mock data. The app displays a dedicated Setup / Environment Configuration screen instructing administrators to provide valid Supabase credentials.
* **Consequences:** Eliminates the risk of users mistaking mock data for real health adherence logs in production environments.

## ADR 002: Service Worker Cache Strategy & API Isolation
* **Context:** The initial service worker intercepted all `GET` requests, including `*.supabase.co` REST API responses, risking caching of private health information and serving stale dose states.
* **Decision:**
  - Strictly bypass service worker caching for any requests with `supabase.co` or cross-origin backend APIs.
  - Use Cache-First for static assets (images, fonts, scripts, stylesheets).
  - Use Network-First with cache fallback for HTML navigation (`/index.html`).
  - Cache versioning is tied to the build release ID rather than a static string.
* **Consequences:** Offline capability for app shell is preserved while completely preventing health data pollution and stale adherence records.

## ADR 003: Mobile Viewport Accessibility & Zoom
* **Context:** `index.html` contained `maximum-scale=1.0, user-scalable=no`, blocking pinch-to-zoom on mobile devices.
* **Decision:** Replace viewport with `width=device-width, initial-scale=1.0, viewport-fit=cover`.
* **Consequences:** Complies with WCAG AA and Section 508 accessibility guidelines for elderly users with vision impairments.
