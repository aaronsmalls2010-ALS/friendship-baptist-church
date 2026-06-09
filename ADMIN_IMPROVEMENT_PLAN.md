# FBC Admin & Portal Improvement — Implementation Plan (All Phases)

**Project:** The Friendship Baptist Church (Next.js 16 + Supabase + Vercel, TypeScript)
**Audience for this doc:** the build session (Sonnet) that will implement the work.
**Source of truth:** the live codebase. If anything here contradicts the code, the code
wins — fix the note and flag it.

---

## 0. How to use this plan

- Work **phase by phase, in order**. Do not start a later phase until the current one
  builds clean and is committed.
- **`npm run build` must pass** before ending any phase (SSG prerenders every page and
  catches `next/image`, route, and type errors). Also run `npm run type-check`.
- **Match existing in-repo idioms.** Reuse the components and helpers listed in §1. Do
  not introduce new UI libraries, charting libs, or state libraries.
- **No emojis in UI.** Use `lucide-react` icons (already a dependency).
- **No native `alert()/confirm()/prompt()`.** Use `@/components/ui/alert-dialog` and the
  existing toast pattern.
- **Accessibility:** labels on inputs, `role="alert"` on errors, focus states, WCAG AA
  contrast (per project frontend standard).
- Each item below has **Acceptance criteria** — treat them as the definition of done.
- Branch per phase (e.g. `feat/phase-1-finance-core`). Commit in logical units. Do not
  push unless asked.

---

## 1. Existing building blocks (reuse these — do not reinvent)

**Auth / roles**
- `src/lib/auth/roles.ts` — `ALL_ROLES`, `Role`, `PRECEDENCE`, `rolesFromUser(user)`,
  `primaryRole()`, `hasAnyRole()`, `isAdmin()`, `isSuperAdmin()`. Multi-role aware
  (reads `user_metadata.roles[]`).
- `src/lib/auth/require-admin.ts` — `requireAdmin()`, `requireSuperAdmin()` returning
  `{ ok: true, user } | { ok: false, status, error }`. **Use these in API routes.**
- `src/lib/supabase/server.ts` — `createServerSupabaseClient()` (RLS-respecting).
- `src/lib/supabase/admin.ts` — `createAdminClient()` (service role, bypasses RLS).
- `middleware.ts` — gates `/portal` (auth) and `/admin` (admin role).

**Audit**
- `src/lib/security/audit.ts` — `logAuditEvent()` (currently console-only),
  `getClientInfo(request)`. Extend in Phase 1.

**Admin UI components**
- `src/components/admin/admin-page-header.tsx`
- `src/components/admin/data-table.tsx` (search/sort/pagination — reuse everywhere)
- `src/components/admin/form-dialog.tsx`
- `src/components/admin/stat-card.tsx`
- `src/components/layout/admin-sidebar.tsx` (nav list is a `navItems` array near top)

**UI primitives** (`src/components/ui/*`): `alert-dialog`, `dialog`, `avatar`, `badge`,
`button`, `checkbox`, `input`, `label`, `select`, `switch`, `table`, `tabs`, `textarea`,
`tooltip`, `progress`, `dropdown-menu`, `sheet`, `radio-group`.

**Other**
- `src/lib/constants.ts` — `CHURCH_INFO` (hardcoded org info; becomes the seed/fallback
  for the new Org Profile table).
- `src/lib/email/send.ts`, `welcome.ts`, `password-reset.ts` — email senders.
- `src/lib/sms/send.ts` — SMS sender (Twilio).
- Migrations live in `supabase/migrations/` named `YYYYMMDD_description.sql`. New
  migrations use today's date prefix, e.g. `20260609_*.sql`.

**Known data facts to confirm before coding**
- Donations: the GET route selects column **`type`** while the admin page uses
  `searchKeys={["donation_type"]}`. **Confirm the real column name** in the donations
  migration before writing filters/exports.
- `audit_log` table: the audit helper comment says it should be created. **Confirm
  whether the table already exists**; create it if not (§Phase 1, #47).
- Roles: `ALL_ROLES` = member, deacon, minister, musician, admin, super_admin. **No
  `finance` or `pastor` role yet** — both are added in Phase 1 (#48). `pastor` ranks
  **above** `admin` and is an admin-level role (full admin access + financial access).

---

## 2. Cross-cutting standards applied throughout

1. **API auth:** every `/api/admin/*` route must authorize via the helpers in
   `require-admin.ts` (or the new `requireFinance` in Phase 1). Remove ad-hoc inline
   `user.user_metadata?.role` checks — they are not multi-role aware and are a security
   bug.
2. **Audit:** every state-changing admin route (create/update/delete/export of members,
   donations, roles, memorials, settings) calls `logAuditEvent()` after success.
3. **Errors:** API returns `{ error }` + status; client surfaces it via toast, never
   console-only.
4. **Soft delete:** prefer archive over hard delete for anything with historical/financial
   value (see #50).

---

# PHASE 1 — Finance & Compliance Core

**Goal:** make money handling correct, legal, and access-controlled. This phase contains
every compliance-critical item. **Build order matters** (dependencies noted).

### 1.1 — #2 Organization Profile + Settings persistence  *(keystone — do first)*
- **Migration** `20260609_organization_settings.sql`: create single-row table
  `organization_settings` (id PK default 1 with a check constraint to keep one row):
  `church_name, tagline, pastor_name, address_street, address_city, address_state,
  address_zip, phone, email, ein, updated_at, updated_by`. Seed one row from
  `CHURCH_INFO`. RLS: read = any authenticated; write = `super_admin` only.
- **API** `src/app/api/admin/settings/organization/route.ts`: `GET` (any admin),
  `PUT` (super_admin only via `requireSuperAdmin()`), audit on write.
- **UI** `src/app/(admin)/admin/settings/page.tsx`: add an **Organization** tab/section
  (super-admin only — hide for non-super-admin). Wire the existing General tab fields to
  this API so they actually persist. Add an **EIN** field (used by statements).
- **Read-through helper** `src/lib/org/get-organization.ts`: server util that returns the
  org row, falling back to `CHURCH_INFO`. Statements (#7) and any "church info" display
  read from this.
- **Persist remaining settings:** notification toggles + appearance currently use local
  state only — back them with the table (or a `settings` JSON column) so they survive
  reload. Watch-Live toggle already works; leave it.
- **Acceptance:** super-admin edits church name/EIN/phone → reload → persists; non-super-
  admin cannot see or PUT the Organization section; statements read the saved EIN.

### 1.2 — #48 Add `finance` + `pastor` roles and enforce RBAC  *(gates everything below)*
- **Migration** `20260609_finance_pastor_roles.sql`: `ALTER TYPE user_role ADD VALUE
  'finance'; ADD VALUE 'pastor';` (enum values cannot be removed — confirm names with
  the user before running). Update any role-precedence references in DB if present.
- **roles.ts:** add `finance` and `pastor` to `ALL_ROLES`; add to `PRECEDENCE`
  (**pastor ranks above admin**: super_admin 8, pastor 7, admin 6, finance 5,
  musician 4, minister 3, deacon 2, member 1 — confirm). Add helpers:
  - `FINANCE_ROLES = ["finance", "pastor", "super_admin"]`
  - `canViewFinancials(user)` → `hasAnyRole(rolesFromUser(user), FINANCE_ROLES)`
  - **`pastor` is admin-level:** add `pastor` to `ADMIN_ROLES` and `ADMIN_LEVEL_ROLES`
    so a pastor can reach `/admin` (middleware + `requireAdmin()` then allow pastor).
- **require-admin.ts:** add `requireFinance()` mirroring `requireAdmin()` but using
  `FINANCE_ROLES`.
- **Gate financial routes/pages:** donations API + `/admin/donations`, giving in reports,
  statements — all require `requireFinance()` / `canViewFinancials`. Hide the
  **Donations** and finance Reports nav items in `admin-sidebar.tsx` for users without a
  finance role (pass roles to the sidebar or check client-side via session).
- **Deacon scoping:** a `deacon` (without a finance role) may see **only members assigned
  to his ward** and their data — enforce in member/care-note queries by joining on the
  deacon's `ward_id`. Deacons get **no** access to the donations ledger UI.
- **Standardize all `/api/admin/*` auth** on the helpers (remove inline single-role
  checks, especially in `api/admin/donations/route.ts`).
- **Acceptance:** a `finance` user sees Donations + giving reports but not member-role
  management; a plain `admin` without finance role does **not** see donation amounts; a
  `deacon` sees only his ward's members; secondary-role holders are authorized correctly.

### 1.3 — #47 Activate the audit log
- **Migration** (only if table absent) `20260609_audit_log.sql`: `audit_log(id, user_id,
  action, resource_type, resource_id, metadata jsonb, ip_address, user_agent,
  created_at)`. RLS: read = `admin`/`super_admin`; insert via service role only.
- **audit.ts:** make `logAuditEvent()` actually insert into `audit_log` via
  `createAdminClient()` (keep console in dev). Broaden `AuditEventType` (or accept a free
  `action` string + `resourceType`/`resourceId`) to cover: `donation.*`, `member.*`,
  `role.change`, `memorial.*`, `settings.update`, `export.*`, `auth.*`.
- **Wire it** into all state-changing admin routes (start with donations, members,
  role changes, deletes, exports).
- **Viewer:** new read-only page `src/app/(admin)/admin/audit/page.tsx` + nav item
  (super_admin only) using `DataTable` — filter by user, action, date.
- **Acceptance:** editing a member or recording a donation writes an audit row; the audit
  page lists it; only super_admin can open it.

### 1.4 — #50 Soft-delete / archive
- **Migration** `20260609_soft_delete.sql`: add `archived_at timestamptz` (+ optional
  `archived_by`) to `profiles` and `donations` (and `memorials`). Update list queries to
  exclude archived by default; add an "Archived" filter/toggle.
- **Replace destructive deletes** of members/donations with archive; add a Restore action.
- **Acceptance:** archiving a member with giving history hides them from default lists but
  preserves the row and their donations; restore works; audit logs both.

### 1.5 — #7 + #6 Year-end contribution statements (PDF) + wire portal button
- **Generator** `src/lib/giving/statement.ts`: build a styled HTML statement (church name,
  address, **EIN** from Org Profile, member name/address, per-gift table, total, and the
  IRS line: *"No goods or services were provided in exchange for these contributions."*).
- **PDF route** `src/app/api/portal/giving/statement/route.ts` (member: own year) and
  `src/app/api/admin/donations/statements/route.ts` (finance: any member / bulk for a
  year). Render HTML → PDF via headless Chrome `--print-to-pdf` (per house pattern;
  pass a fresh `--user-data-dir`). No new PDF library.
- **Portal button** (`portal/giving/page.tsx` ~L185): add `onClick` → calls the member
  statement route for the selected year, downloads the PDF. Add a **year selector**.
- **Admin:** in `/admin/donations`, add "Generate statements" (single + bulk for a tax
  year), finance-gated, audited.
- **Acceptance:** a member downloads a correct PDF for 2025 with EIN + IRS language;
  finance can bulk-generate; non-finance admins cannot.

### 1.6 — #8 Donations CSV export
- Remove `disabled` on the export button (`donations/page.tsx` L177). Add
  `src/app/api/admin/donations/export/route.ts` (finance-gated) that streams CSV
  (donor, amount, type, campaign, date, recurring). Respect current filters (#11).
  Write a small CSV util in `src/lib/csv.ts` (reuse for #33/#38/#42). Audit the export.
- **Acceptance:** click Export → downloads CSV matching the on-screen filtered rows.

### 1.6b — Donation types (managed table)  *(new — do before 1.7; finance-managed)*
- Donation types are currently hardcoded (tithe, offering, building_fund, mission,
  other). Replace with a finance-managed table.
- **Migration** `20260609_donation_types.sql`: `donation_types(id, name, slug,
  description, sort_order, is_active, created_at)`. Seed with the existing hardcoded
  values so current data still maps. Add `donation_type_id` (FK → donation_types) to
  `donations`; backfill from the existing text column; keep the old text column
  temporarily for safety, drop in a later migration once verified. RLS: read = any
  authenticated; write = `FINANCE_ROLES` only.
- **API** `src/app/api/admin/donation-types/route.ts` (+ `[id]`): full CRUD,
  **finance-gated** (`requireFinance()`), audited. Deactivate (is_active=false)
  instead of deleting a type that has donations attached.
- **UI** new section/page `src/app/(admin)/admin/donation-types/page.tsx` (or a tab
  under Donations), finance-gated, with a sidebar nav item visible only to finance
  roles. List + create/edit/deactivate via `FormDialog`.
- **Wire dependents:** the manual-entry form (1.7), filters (1.8), export (1.6/#8),
  statements (1.5), and reports (#33/#37) all select/display donation **types** from
  this table — no more hardcoded lists.
- **Acceptance:** a finance user adds a new type ("Benevolence") and it immediately
  appears in the manual-entry dropdown and filters; a type with existing gifts can be
  deactivated but not hard-deleted; non-finance users cannot manage types.

### 1.7 — #9 Manual donation entry (cash/check)
- **API** add `POST /api/admin/donations` (finance-gated, audited): record a gift with
  donor (member lookup or "Anonymous"), amount, **donation_type_id** (from the managed
  types table, 1.6b), campaign, date, method (cash/check/other), optional check #/note.
  (`stripe_payment_id` stays null.)
- **UI** "Record gift" button + `FormDialog` on `/admin/donations`.
- **Acceptance:** recording a check gift appears in the ledger, totals, and a member's
  giving history; audited.

### 1.8 — #11 Donation filters
- Add donor-name search, **date range**, type, and recurring filters to `/admin/donations`
  (server-side query params). Used by export (#8) and statements (#7).
- **Acceptance:** "Jane Smith, 2025, tithes" returns the correct subset; export matches.

### 1.9 — #12 Auditable edit / void
- **API** `PATCH /api/admin/donations/[id]` (finance, audited) requiring a `reason`;
  voids are soft (status flag), never hard delete. Detail view/dialog.
- **Acceptance:** correcting an amount keeps an audit trail with the reason; no row is
  destroyed.

### 1.10 — #49 Admin user management + MFA (if required)
- **User management** page `src/app/(admin)/admin/users/page.tsx` (super_admin only):
  list admin-capable users, grant/revoke roles (writes `user_roles` + mirrors into
  `user_metadata.roles`), audited. This replaces editing roles directly in the DB.
- **MFA:** confirm with the user whether MFA is required. If yes, enable Supabase MFA
  (TOTP) enrollment for finance-capable roles and enforce at login for those roles.
- **Acceptance:** super_admin grants the `finance` role in the UI and it takes effect;
  (if enabled) a finance user is prompted to enrol/verify MFA.

**Phase 1 done when:** all finance data is access-controlled, statements + CSV work,
manual entry works, audit log records changes, deletes are soft, build + type-check pass.

---

# PHASE 2 — Quick trust & UX wins

**Goal:** fast, low-risk fixes that make the portal feel correct and consistent.

- **#29 Send-confirm + recipient count** — before SMS/email send, show an
  `alert-dialog`: "This will message N people. Continue?" Compute N server-side (after the
  opt-in filter). Files: `admin/sms/page.tsx`, the send route.
- **#26 Show consented SMS count** — surface the `sms_opt_in`-filtered count in the SMS
  composer ("412 of 530 members have opted in"). The send route already filters by
  `sms_opt_in` (`api/admin/sms/route.ts` L98) — expose that number; do not change the
  filter.
- **#39 Replace native `confirm()`** — `admin/families/page.tsx` and
  `admin/members/page.tsx` use browser `confirm()`. Replace with `alert-dialog`.
- **#17 Member photos** — show `photo_url` (with `avatar` fallback initials) in the admin
  members table and portal directory cards.
- **#3 Remove Content/CMS admin section** — delete `src/app/(admin)/admin/content/` and
  the `{ label: "Content", href: "/admin/content", icon: FileText }` entry in
  `admin-sidebar.tsx`. (Note: the inline CMS edit system — `components/cms/*`,
  `lib/cms/*` — is separate; confirm with the user whether to also disable
  `edit-mode-toggle`. Default: leave it, only remove the admin Content page.)
- **#45 Dashboard quick-actions** — wire "Create Event / Send Announcement / Add Member"
  to the existing dialogs/routes, or remove if not quickly wireable.
- **#40 Validation + error toasts** — standardize: every admin form validates required
  fields (zod is already a dep) and surfaces API errors via toast (mirror the Members/
  Families pattern). Add `role="alert"`.
- **#43 Consistent search/sort/pagination** — route every admin list through `DataTable`;
  add pagination where missing (Reports lists, ward member expansion).

**Phase 2 done when:** no native dialogs remain in admin, lists are consistent, sends are
confirmed, build passes.

---

# PHASE 3 — Member care & data integrity

**Goal:** make member records complete and durable; give care teams real tools.

- **#14 Member status** — migration: add `status` enum to `profiles`
  (`active|inactive|visitor|deceased`, default `active`). Add status column + filter to
  `/admin/members`; default views exclude `deceased`. (Simple flag now; visitor→member
  pipeline deferred per scope decision.)
- **#15 Visitor / connect-card intake** — public connect-card form → creates a `visitor`-
  status profile (or a `visitors` table) + a follow-up task/notification to staff.
  Confirm with user: standalone table vs. profile status.
- **#16 Pastoral care notes (RESTRICTED)** — migration: `care_notes(id, profile_id,
  author_id, body, created_at)`. RLS + UI gate: visible only to `pastor`, `super_admin`,
  and the **ward deacon for members in his ward**. Never shown to plain admins/finance.
  Add a Notes panel on the member detail (gated).
- **#1 Memorials persistence** — create `api/admin/memorials/` CRUD (GET/POST/PATCH/
  DELETE) backed by the existing `memorials` table; replace the local-state logic in
  `admin/memorials/page.tsx`. Set `created_by` to the real user. Audited.
- **#4 Dashboard real activity feed** — replace hardcoded feed with the latest
  `audit_log` rows (from #47), formatted human-readably; or recent
  members/donations/events if audit is too sparse.
- **#42 CSV member import** — `api/admin/members/import` (super_admin) accepting a CSV
  (name, email, phone, ward, family…), with a preview/validation step before commit,
  dedupe by email, audited. Reuse `lib/csv.ts`.
- **#41 Bulk actions** — multi-select in the members `DataTable` (checkbox column) →
  bulk archive, assign ward, add to ministry, message. Confirm via `alert-dialog`,
  audited.

**Phase 3 done when:** member records carry status + notes (properly gated), memorials
persist, import + bulk actions work, build passes.

---

# PHASE 4 — Communications & reporting

**Goal:** reliable outbound comms and exportable, filterable reports.

- **#28 Email announcements / weekly digest actually send** — back the Settings
  notification toggles with the org settings (#2); implement the digest/announcement send
  via `lib/email/send.ts`. Verify delivery end-to-end (respect `email_notifications`
  pref). Consider a scheduled trigger (cron/edge function) for the weekly digest.
- **#27 SMS templates + merge fields** — `sms_templates` table + management UI; support
  `{first_name}` merge; selectable in the SMS composer.
- **#30 Auto-notify on ministry approve/deny** — on approve/deny in
  `api/admin/ministries/[id]/...`, insert a `notifications` row (+ optional email/SMS per
  prefs) to the applicant.
- **#31 Announcement scheduling + status badge** — derive live/scheduled/expired from
  `start_date`/`end_date`; show a status badge in `/admin/announcements`.
- **#33 Reports CSV/PDF export** — add export to `/admin/reports` (reuse `lib/csv.ts` and
  the PDF approach from #7). Finance-gated where giving is included.
- **#36 Reports date ranges/filters** — real date-range filtering (replace static
  snapshots).
- **#37 Lapsed-giver / at-risk report** — finance-gated report: gave in the prior 12
  months but nothing in the last 90 days. Exportable.
- **#38 Ministry roster export** — per-ministry roster CSV/PDF with contact info.
- **#32 SMS cost/segment estimate** — show segment count (chars/160, rounded up) ×
  recipients in the composer.

**Phase 4 done when:** digest/announcements send, templates + notifications fire, reports
filter + export, build passes.

---

# PHASE 5 — Member portal engagement (backlog)

**Goal:** surface data the model already supports into the member experience.

- **#18 Prayer Requests in portal** — submit/view UI backed by `prayer_requests`
  (respect public/private, status). Admin moderation already exists.
- **#20 Hall of Angels (memorials) in portal** — browse published memorials + leave
  tributes (`memorial_comments`); pairs with #1.
- **#21 Testimonies submission** — member submit/view backed by `testimonies`
  (admin-approval gate already implied by `is_approved`).
- **#22 Event "View Details" + RSVP confirmation** — wire the portal event detail view
  and RSVP confirmation toast/state.
- **#19 Birthday/anniversary widget + greeting cards** — "this week's birthdays" widget;
  member-to-member greetings via the unused `birthday_greetings` table.
- **#23 Directory ministry filter** — wire the stubbed ministry filter (or remove it).
- **#24 Persist saved devotionals** — persist saves (small table or a `saved_devotionals`
  join) instead of UI-only state.
- **#25 New-member onboarding checklist** — dismissible (never a gate): complete profile,
  join a ministry, set giving, opt-in prefs.
- **#44 Audio/file upload for sermons & music** — Supabase Storage upload for sermon/music
  audio; auto-derive duration where feasible (replace manual seconds entry).
- **#46 Event end-time + recurrence** — validate end > start; add simple recurrence
  (weekly/monthly) generation.

**Phase 5 done when:** the prioritized portal features are live, build passes.

---

## 3. Open confirmations to get from the church admin before/while building

1. **Role names/precedence** — confirm `finance` and `pastor` as the new `user_role`
   enum values. **Decided:** pastor ranks above admin and is admin-level (super_admin 8,
   pastor 7, admin 6, finance 5, musician 4, minister 3, deacon 2, member 1). Enum
   values can't be removed later, so confirm the exact spellings before running.
2. **EIN value** — the church admin enters it in the Org Profile UI; not hardcoded.
3. **MFA** — required or not? If yes, enforce for finance-capable roles (Phase 1 #49).
4. **Visitor capture** — standalone `visitors` table vs. `visitor` profile status
   (Phase 3 #15).
5. **CMS inline edit** — only remove the admin Content page, or also disable the inline
   `edit-mode-toggle` (Phase 2 #3)?
6. **Donations column name** — confirm the existing `type`/`donation_type` text column
   before writing the migration that adds `donation_type_id` and backfills from it
   (Phase 1 #1.6b).
7. **Weekly digest scheduling** — is a cron/edge function acceptable for automated sends
   (Phase 4 #28)?

## 4. Ranked backlog reference (ID → rank/score)

See the prioritized table delivered in chat. Phase order here follows **dependency**, not
pure score: #2 and #48 are keystones that unblock the finance/compliance features and must
land first even though a couple of higher-scored quick wins sit in Phase 2.
