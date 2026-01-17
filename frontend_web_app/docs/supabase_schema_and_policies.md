# Supabase Schema and RLS Policies (Repair Requests)

This document describes a Supabase/Postgres schema and Row Level Security (RLS) configuration for the React app in `frontend_web_app`. It is designed to support the current flows in the codebase:

The customer booking flow inserts a new row into `repair_requests`, and the admin dashboard lists, searches, updates, and deletes rows. The UI expects the columns shown below, including a `notes` field for internal admin notes.

## Target table shape (what the frontend expects)

The frontend Supabase service uses:

- Table name: `repair_requests`
- Columns referenced by the app (snake_case):
  - `id`
  - `created_at`
  - `device_type`
  - `issue_description`
  - `preferred_date`
  - `preferred_time`
  - `contact_name`
  - `contact_email`
  - `contact_phone`
  - `consent`
  - `status`
  - `notes`

The admin UI shows statuses as `New`, `In Progress`, and `Completed`. The booking flow creates rows with `status` defaulting to `New`.

## SQL: Create schema (table, enum, constraints, indexes)

Run the following SQL in the Supabase SQL Editor. You can run it in one go, or in sections.

### 1) Optional extension (for UUIDs)

Supabase usually enables this already, but if you want `uuid` IDs you may need:

```sql
create extension if not exists pgcrypto;
```

### 2) Status enum

The user request mentions: `status enum [new,in_progress,completed,cancelled]`.

The frontend UI currently uses human-readable strings (`New`, `In Progress`, `Completed`). For the enum to work cleanly and still match the UI, you have two options:

You can either store the enum values (`new`, `in_progress`, etc.) and update the UI to use them, or you can store the UI strings as plain text with a check constraint. This document implements the enum as requested and includes a note in the troubleshooting section about aligning UI values.

```sql
do $$
begin
  if not exists (select 1 from pg_type where typname = 'repair_request_status') then
    create type repair_request_status as enum ('new', 'in_progress', 'completed', 'cancelled');
  end if;
end $$;
```

### 3) Create table

```sql
create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  customer_name text not null,
  phone text not null,
  email text not null,

  device_model text not null,
  issue_description text not null,

  preferred_date date,
  status repair_request_status not null default 'new',

  notes text not null default ''
);
```

### 4) Optional check constraints (recommended)

These constraints keep data reasonably clean without being overly strict.

```sql
alter table public.repair_requests
  add constraint repair_requests_customer_name_len
  check (char_length(customer_name) between 2 and 200);

alter table public.repair_requests
  add constraint repair_requests_email_basic_format
  check (position('@' in email) > 1);

alter table public.repair_requests
  add constraint repair_requests_phone_len
  check (char_length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 10);

alter table public.repair_requests
  add constraint repair_requests_issue_description_len
  check (char_length(issue_description) >= 10);
```

### 5) Indexes for admin search and filtering

The admin dashboard searches across multiple fields and filters by status and created time. The requested indexes are below.

```sql
create index if not exists repair_requests_customer_name_idx on public.repair_requests (customer_name);
create index if not exists repair_requests_phone_idx on public.repair_requests (phone);
create index if not exists repair_requests_email_idx on public.repair_requests (email);
create index if not exists repair_requests_status_idx on public.repair_requests (status);
create index if not exists repair_requests_created_at_idx on public.repair_requests (created_at desc);
```

If you later add a single “global search” input that must be fast at scale, consider adding a `tsvector` column and a GIN index, but the current UI uses `ilike` on multiple columns and the above simple indexes are a good starting point.

## Mapping note: schema field names vs current frontend names

The user-requested schema uses:

- `customer_name`, `phone`, `email`, `device_model`, `preferred_date`

The current frontend code uses snake_case columns:

- `contact_name`, `contact_phone`, `contact_email`, `device_type`, `preferred_date`, and it also uses `preferred_time`, `consent`.

If you adopt the exact schema in this document, you will need to adjust `src/services/repairRequestsService.js` to write/read the new column names. If you prefer not to change code, use a schema aligned to the frontend’s current expected columns.

A minimal “frontend-aligned” alternative table definition looks like:

```sql
create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  device_type text not null,
  issue_description text not null,

  preferred_date date,
  preferred_time text,

  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,

  consent boolean not null default false,

  status text not null default 'New',
  notes text not null default ''
);
```

If you use the “frontend-aligned” variant, you can still add a check constraint to enforce allowed status strings, for example:

```sql
alter table public.repair_requests
  add constraint repair_requests_status_allowed
  check (status in ('New', 'In Progress', 'Completed', 'Cancelled'));
```

## RLS policies (admin full access + public insert-only)

This app’s security model is:

- Admin dashboard access should be restricted to authenticated “admin” users.
- Customer bookings may be allowed without authentication (anon insert-only), depending on your product decision.

The simplest and most common Supabase pattern is to use a custom claim in the JWT called `role` (or similar) and set it to `admin` for admin users. Policies can then check that claim.

### 1) Enable RLS

```sql
alter table public.repair_requests enable row level security;
```

### 2) Admin role check helper (JWT claim)

Policies below assume you set `role=admin` in the JWT custom claims and that it is exposed as:

```sql
(auth.jwt() ->> 'role') = 'admin'
```

If you choose a different claim name, update the policy expressions accordingly.

### 3) Policies

#### A) Admin: full read/write/delete (authenticated admin only)

```sql
create policy "admin can select repair_requests"
on public.repair_requests
for select
to authenticated
using ((auth.jwt() ->> 'role') = 'admin');

create policy "admin can insert repair_requests"
on public.repair_requests
for insert
to authenticated
with check ((auth.jwt() ->> 'role') = 'admin');

create policy "admin can update repair_requests"
on public.repair_requests
for update
to authenticated
using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

create policy "admin can delete repair_requests"
on public.repair_requests
for delete
to authenticated
using ((auth.jwt() ->> 'role') = 'admin');
```

This ensures the admin dashboard can list/search/update/delete, but only for users whose JWT indicates they are admin.

#### B) Public booking: anon insert-only (optional)

If you want public bookings without requiring a Supabase Auth user, allow `anon` inserts only. This policy allows inserts but no reads.

```sql
create policy "anon can insert repair_requests"
on public.repair_requests
for insert
to anon
with check (true);
```

To keep anonymous inserts safer, you can restrict what status may be set when inserting. For example, force all anon inserts to be `new` (for the enum-based schema):

```sql
drop policy if exists "anon can insert repair_requests" on public.repair_requests;

create policy "anon can insert repair_requests as new only"
on public.repair_requests
for insert
to anon
with check (status = 'new');
```

If you use the “frontend-aligned” schema with status strings, this would become:

```sql
with check (status = 'New')
```

#### C) Restricted read on admin dashboard (default behavior)

With the admin SELECT policy and no SELECT policy for `anon`, the admin dashboard is restricted by default. Unauthenticated users cannot read rows.

This matches the intended separation of public booking vs admin management.

### Alternative: “authenticated public” instead of anon inserts

If you do not want `anon` to insert into your table, require users to be authenticated and allow insert to `authenticated` (non-admin). This is a more secure default but requires implementing customer auth in the frontend.

For example:

```sql
create policy "authenticated (non-admin) can insert repair_requests"
on public.repair_requests
for insert
to authenticated
with check (true);
```

You would then remove any `anon` insert policy.

## Admin user setup (Supabase Auth + mapping to admin role)

The frontend uses Supabase Auth email/password sign-in (see `supabase.auth.signInWithPassword`) and treats any active session as “admin authenticated” at the UI routing level. RLS is what actually protects the database.

You should configure admin identification so that only admin users can read/update data.

### Recommended approach: custom JWT claim `role=admin`

1. Create a Supabase Auth user for your admin.
   - In Supabase Studio: Authentication → Users → “Add user” (email + password).
2. Add a mechanism to set a custom claim on that user’s JWT, such as `role=admin`.

How you set custom claims depends on your Supabase setup. The typical Supabase approach is to manage roles in a table (for example `public.user_roles`) and use an auth hook (or edge function) to add claims. Another common pattern is to enforce admin access by checking membership in a `public.admin_users` table keyed by `auth.uid()`.

If you prefer a database-table approach (no custom JWT claim), you can implement policies like this instead:

```sql
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "admins can read admin_users"
on public.admin_users
for select
to authenticated
using (true);
```

Then update the `repair_requests` policies to check membership:

```sql
drop policy if exists "admin can select repair_requests" on public.repair_requests;
drop policy if exists "admin can insert repair_requests" on public.repair_requests;
drop policy if exists "admin can update repair_requests" on public.repair_requests;
drop policy if exists "admin can delete repair_requests" on public.repair_requests;

create policy "admin_users can select repair_requests"
on public.repair_requests
for select
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admin_users can insert repair_requests"
on public.repair_requests
for insert
to authenticated
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admin_users can update repair_requests"
on public.repair_requests
for update
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));

create policy "admin_users can delete repair_requests"
on public.repair_requests
for delete
to authenticated
using (exists (select 1 from public.admin_users au where au.user_id = auth.uid()));
```

To grant admin access in this model, insert the admin user’s ID into `admin_users`:

```sql
insert into public.admin_users (user_id) values ('00000000-0000-0000-0000-000000000000');
```

Use the real UUID from Supabase Auth → Users.

## Required frontend environment variables

The frontend Supabase client is created from two Create React App environment variables:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_KEY`

These are read in `src/lib/supabaseClient.js`. If either is missing, the app runs in “demo mode” using in-memory data.

### Where to find these values in Supabase

In Supabase Studio:

1. Go to Project Settings.
2. Find the API section.
3. Copy:
   - Project URL → set as `REACT_APP_SUPABASE_URL`
   - API Keys → use the `anon public` key as `REACT_APP_SUPABASE_KEY`

Important security note: do not put the `service_role` key in the frontend. The service role key bypasses RLS and must only be used in trusted server environments.

## Troubleshooting common errors

### “column repair_requests.notes does not exist”
The admin dashboard reads/writes a `notes` field. Ensure your schema includes:

- A `notes` column of type `text` (recommended `not null default ''`).

If the column is missing, add it:

```sql
alter table public.repair_requests add column if not exists notes text not null default '';
```

### RLS denies access (common)
If you see errors like “new row violates row-level security policy” or “permission denied for relation repair_requests”, check:

- RLS is enabled and you have policies for the operation being attempted (SELECT/INSERT/UPDATE/DELETE).
- Your admin user is actually authenticated in Supabase Auth and has the admin indicator you chose (JWT claim or membership in `admin_users`).
- If bookings are anon, ensure there is an `INSERT` policy for role `anon` (or `authenticated` if you require login for booking).

### Admin dashboard loads but returns 0 rows
If RLS blocks SELECT, Supabase will return empty data and/or an RLS error depending on client configuration. Confirm the “admin can select” policy is present and the admin user matches the policy condition.

### Status values do not match the UI
If you implement the enum `new/in_progress/completed/cancelled` but the frontend sends `New/In Progress/Completed`, updates and filtering will not work correctly.

To fix this you can either:

- Change the frontend to use enum values, or
- Use a text `status` column with a check constraint that matches the UI strings, or
- Add a translation layer in the service (map UI strings to enum values on write and back on read).

The quickest approach without changing code is using a text `status` column.

Task completed: Added Supabase schema/RLS/admin setup documentation with SQL snippets and env var notes for the React frontend.
