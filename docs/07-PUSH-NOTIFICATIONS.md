# Push Notifications (PWA Web Push)

App-like notifications for members — no native app, no app store. Built on the
Web Push standard, delivered by the browser vendors' push services (Apple,
Google, Mozilla), authenticated with a VAPID key pair we own.

Nothing sends until the VAPID environment variables exist. Until then the whole
rail is dormant: members see "not switched on yet", the Push Center shows a
warning banner, and the "Notify members" checkboxes are no-ops. That mirrors how
the Stripe and SMS rails behave.

---

## 1. Go-live steps (Aaron)

1. **Add three environment variables in the Vercel dashboard** (Settings →
   Environment Variables → Production, Preview, Development). Do NOT use the
   Vercel CLI — it corrupts values on Windows.

   | Name | Value |
   |---|---|
   | `VAPID_PUBLIC_KEY` | the public key (see the handoff message) |
   | `VAPID_PRIVATE_KEY` | the private key — **secret**, never commit it |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | same value as `VAPID_PUBLIC_KEY` |
   | `CRON_SECRET` | any long random string — gates the weekly digest |

   Optional: `VAPID_CONTACT_EMAIL` (defaults to
   `mailto:info@thefriendshipbaptist.com`). Push services use it to reach us if
   our sends misbehave.

2. **Redeploy** so the new env vars are picked up.

3. **Verify** at `/admin/push` — the amber "not configured" banner should be
   gone.

4. **Turn it on for yourself**: Member Portal → Account & Security → Church
   Notifications → toggle on → "Send me a test notification".

The key pair is regenerable at any time, but rotating it invalidates every
existing subscription — members would have to re-enable notifications. Rotate
only if the private key leaks.

---

## 2. What sends a notification

| Trigger | Topic | Gated by | Where |
|---|---|---|---|
| Admin creates/updates an **announcement** with "Notify members" ticked | `announcement` | `profiles.notify_newsletter` | `/admin/announcements` |
| Admin creates/updates a **published event** with "Notify members" ticked | `event` | `profiles.notify_events` | `/admin/events` |
| Admin sends from the **Push Center** | `broadcast` | ungated — everyone subscribed | `/admin/push` |
| **Weekly digest**, Saturdays 9:00 a.m. ET | `digest` | `profiles.notify_events` | Vercel cron |
| Member taps **"Send me a test notification"** | — | self only | `/portal/settings` |

Nothing sends automatically on a plain save. The checkbox is deliberate and
resets every time the dialog opens, so fixing a typo can never re-blast the
congregation. An unpublished (draft) event never notifies even if the box is
ticked — the admin gets told so.

Every congregation-wide send also writes an in-app `notifications` row, so a
member who misses the pop-up still finds it at `/portal/notifications`.

---

## 3. How members turn it on

**Member Portal → Account & Security** (`/portal/settings`).

- **Android / desktop** — one toggle, browser permission prompt, done.
- **iPhone / iPad** — iOS only delivers web push to a site added to the Home
  Screen (iOS 16.4+). The component detects an un-installed iPhone and shows the
  Share → Add to Home Screen steps instead of a toggle that could not work.
- **Blocked permission** — if the member previously denied notifications the
  toggle disables itself and explains how to re-allow the site.

Which *kinds* of notifications they get is controlled by the existing
preferences at Profile → Notification Preferences (`notify_events`,
`notify_newsletter`).

---

## 4. Files

| Path | Role |
|---|---|
| `supabase/migrations/20260821_push_subscriptions.sql` | `push_subscriptions` table + owner-only RLS (applied to prod 2026-08-21) |
| `src/lib/push/send.ts` | VAPID config, fan-out, batching, dead-endpoint pruning, audience stats |
| `src/lib/push/notify.ts` | `notifyCongregation()` — in-app notification rows + push, per topic |
| `src/app/api/portal/push/route.ts` | GET public key · POST subscribe · DELETE unsubscribe |
| `src/app/api/portal/push/test/route.ts` | Member self-test send |
| `src/app/api/admin/push/route.ts` | Push Center: audience stats + broadcast |
| `src/app/api/cron/weekly-digest/route.ts` | Saturday "this week at church" digest |
| `src/components/portal/push-toggle.tsx` | Member opt-in UI (incl. iOS install nudge) |
| `src/app/(admin)/admin/push/page.tsx` | Push Center composer with live preview |
| `public/sw.js` | `push`, `notificationclick`, `pushsubscriptionchange` handlers |
| `vercel.json` | Cron schedule |

---

## 5. Design notes & gotchas

- **Dead endpoints are pruned automatically.** A push service answering 404 or
  410 means the subscription is permanently gone (app deleted, permission
  revoked, browser reset); the row is deleted rather than retried forever.
  Everything else counts as a transient failure and is logged.
- **Rotating subscriptions.** Browsers periodically reissue endpoints. The
  service worker's `pushsubscriptionchange` handler re-subscribes and re-posts
  automatically, so members do not silently go dark.
- **Subscriptions are per-device, not per-member.** A member with a phone and a
  laptop has two rows; the Push Center reports both counts.
- **RLS is owner-only.** Members can only ever see their own endpoints. The
  fan-out runs through the service-role client, which is the only thing that
  reads across members.
- **No CSP change was needed** — push traffic never touches the page. `worker-src
  'self'` already covers the service worker.
- **Service worker cache name was bumped to `fbc-v3`** so returning visitors pick
  up the new worker.
- **iOS quirks**: notification permission must be requested from a user gesture
  inside the installed PWA; the toggle satisfies that. iOS also ignores the
  `badge` icon.
- **Weekly digest is silent when the calendar is empty** — an empty digest is
  worse than no digest.
