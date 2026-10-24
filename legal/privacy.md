# CareBox Family — Privacy Policy

**Version 1.0 · Effective date: 1 November 2026**

This Privacy Policy explains how CareBox Technologies ("we", "our", "us") collects, uses, shares, and protects your personal data when you use the CareBox Family app ("Service"). We are committed to the **Digital Personal Data Protection Act, 2023 (DPDP Act)** and applicable international data protection law.

---

## 1. Data We Collect

| Category | Examples | Why |
|----------|----------|-----|
| **Account data** | Email address, display name, profile photo (Google sign-in) | Authentication and personalisation |
| **Medicine data** | Medicine name, strength, dosage, slot (morning / afternoon / night), pills count | Core app function — tracking adherence |
| **Dose events** | Slot, time taken, source (box button / app / manual), date | Showing dose status to Family members |
| **Consent records** | Which version of Terms/Privacy was accepted, timestamp | DPDP Act compliance |
| **Push subscription** | Browser push endpoint URL (no name or email) | Sending gentle dose reminders |
| **Device data** | Box device token, last seen timestamp | Linking physical box to family account |

We do **not** collect location, contacts, camera, microphone, or biometric data.

---

## 2. How We Use Your Data

- Display today's dose status to authorised Family members.
- Send gentle, in-app or push reminder notifications (one per missed dose per day).
- Track medicine inventory and warn when refills may be needed.
- Maintain consent records as required by the DPDP Act.
- Debug and improve the Service.

We do **not** use your data for advertising, profiling, or sell it to third parties.

---

## 3. Legal Basis for Processing (DPDP Act)

| Processing activity | Legal basis |
|--------------------|-------------|
| Providing the core app function | Consent (collected at onboarding; must be explicit, granular, and freely given) |
| Sending reminders | Consent (push notification permission, separate from app consent) |
| Maintaining consent records | Legal obligation (DPDP Act s.6) |
| Data export / deletion | Legitimate interest / legal obligation |

---

## 4. Data Sharing

Your data is stored in **Supabase** (hosted in AWS ap-south-1, Mumbai). We share data with:

- **Supabase Inc.** — database, authentication, realtime, edge functions hosting. Governed by Supabase's [Privacy Policy](https://supabase.com/privacy).
- **Vercel Inc.** — static frontend hosting. No personal data flows to Vercel.
- **Google Inc.** — if you use Google Sign-In. Governed by Google's [Privacy Policy](https://policies.google.com/privacy).

We do not share data with any other third party.

---

## 5. Data Retention

| Data type | Retention |
|-----------|-----------|
| Dose events | 12 months, then anonymised (date/slot kept; parent_id removed) |
| Medicines | Until deleted by user or account deletion |
| Consent records | 7 years (legal obligation) |
| Push subscriptions | Until revoked by browser or account deletion |
| Account data | Until account deletion, then 30-day soft-delete window before hard purge |

---

## 6. Your Rights Under the DPDP Act 2023

As a **Data Principal** you have the right to:

1. **Access** — know what personal data we hold about you.
2. **Correction** — update inaccurate or incomplete data.
3. **Erasure (right to be forgotten)** — request deletion of your personal data. Use **Settings → Delete Account** for self-service deletion, or email **privacy@carebox.app**.
4. **Data portability** — download all your data in JSON format via **Settings → Download My Data**.
5. **Grievance redressal** — lodge a complaint with our Consent Manager (see Section 9).
6. **Nomination** — nominate a person to exercise your rights in the event of your death or incapacity.

To exercise any right, email **privacy@carebox.app** with subject line "DPDP Rights Request". We will respond within 30 days.

---

## 7. Children's Data

The Service is not intended for users under 18. We do not knowingly collect children's personal data. If we become aware of such collection, we will delete it immediately.

---

## 8. Security

- All data is encrypted in transit (TLS 1.3) and at rest (AES-256 via Supabase).
- Row Level Security (RLS) policies ensure no user can access another family's data.
- We perform regular security audits and apply the principle of least privilege to all database access.

---

## 9. Contact / Consent Manager

**Consent Manager:** CareBox Technologies
**Email:** privacy@carebox.app
**Address:** CareBox Technologies, Pune 411 001, Maharashtra, India

If you are unsatisfied with our response, you may lodge a complaint with the **Data Protection Board of India** (once operational under the DPDP Act).

---

## 10. Changes to This Policy

We will notify you by email and in-app banner at least 14 days before material changes. You will be asked to re-accept the policy for any material change that affects your rights.
