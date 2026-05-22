-- Friendship Baptist Church — Initial Database Schema
-- Run this in the Supabase SQL editor after creating the project

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Role enum
create type user_role as enum ('member', 'deacon', 'minister', 'admin', 'super_admin');
create type prayer_status as enum ('pending', 'praying', 'answered');
create type donation_type as enum ('tithe', 'offering', 'building_fund', 'mission', 'other');
create type track_type as enum ('worship', 'hymn', 'choir', 'gospel');

-- Profiles (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  address text,
  city text,
  state text,
  zip text,
  photo_url text,
  role user_role not null default 'member',
  birthday date,
  anniversary date,
  emergency_contact_name text,
  emergency_contact_phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wards
create table wards (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  deacon_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Families
create table families (
  id uuid primary key default uuid_generate_v4(),
  family_name text not null,
  created_at timestamptz not null default now()
);

create table family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  relationship text,
  unique(family_id, profile_id)
);

-- Ministries
create table ministries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  leader_id uuid references profiles(id) on delete set null,
  schedule text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table ministry_members (
  id uuid primary key default uuid_generate_v4(),
  ministry_id uuid not null references ministries(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(ministry_id, profile_id)
);

-- Deacons
create table deacons (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade unique,
  ward_id uuid references wards(id) on delete set null,
  ordained_date date,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Events
create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz,
  location text,
  ministry_id uuid references ministries(id) on delete set null,
  image_url text,
  rsvp_enabled boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table event_registrations (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'registered',
  guests integer not null default 0,
  registered_at timestamptz not null default now(),
  unique(event_id, profile_id)
);

-- Sermons
create table sermons (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  speaker text not null default 'Pastor Isiah Smalls',
  date date not null,
  scripture text,
  audio_url text,
  video_url text,
  transcript text,
  topics text[] default '{}',
  duration integer,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Music
create table music_tracks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist text not null,
  album text,
  audio_url text not null,
  duration integer not null default 0,
  track_type track_type not null default 'worship',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Announcements
create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  start_date timestamptz not null default now(),
  end_date timestamptz,
  is_pinned boolean not null default false,
  category text,
  ministry_id uuid references ministries(id) on delete set null,
  image_url text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Donations
create table donations (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  amount numeric(10,2) not null,
  donation_type donation_type not null default 'tithe',
  campaign text,
  stripe_payment_id text,
  is_recurring boolean not null default false,
  is_anonymous boolean not null default false,
  donor_name text,
  donor_email text,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Prayer Requests
create table prayer_requests (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  request text not null,
  is_public boolean not null default false,
  status prayer_status not null default 'pending',
  category text,
  created_at timestamptz not null default now()
);

-- Testimonies
create table testimonies (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  title text not null,
  body text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Devotionals
create table devotionals (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  scripture text,
  author text not null default 'Pastor Isiah Smalls',
  date date not null,
  audio_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- CMS Pages
create table cms_pages (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  body text,
  metadata jsonb default '{}',
  is_published boolean not null default false,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contact Messages
create table contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  message_type text default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Business Directory
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  description text,
  category text,
  phone text,
  email text,
  website text,
  address text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Spiritual Goals
create table spiritual_goals (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  goal_type text not null,
  title text not null,
  target integer,
  progress integer not null default 0,
  period text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_profiles_role on profiles(role);
create index idx_profiles_is_active on profiles(is_active);
create index idx_events_start_date on events(start_date);
create index idx_events_is_published on events(is_published);
create index idx_sermons_date on sermons(date);
create index idx_announcements_dates on announcements(start_date, end_date);
create index idx_donations_profile on donations(profile_id);
create index idx_donations_date on donations(date);
create index idx_prayer_requests_status on prayer_requests(status);
create index idx_devotionals_date on devotionals(date);

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function update_updated_at();

create trigger cms_pages_updated_at before update on cms_pages
  for each row execute function update_updated_at();

create trigger spiritual_goals_updated_at before update on spiritual_goals
  for each row execute function update_updated_at();

-- Create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table wards enable row level security;
alter table families enable row level security;
alter table family_members enable row level security;
alter table ministries enable row level security;
alter table ministry_members enable row level security;
alter table deacons enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table sermons enable row level security;
alter table music_tracks enable row level security;
alter table announcements enable row level security;
alter table donations enable row level security;
alter table prayer_requests enable row level security;
alter table testimonies enable row level security;
alter table devotionals enable row level security;
alter table cms_pages enable row level security;
alter table contact_messages enable row level security;
alter table businesses enable row level security;
alter table spiritual_goals enable row level security;

-- Public read policies (no auth required)
create policy "Public can read published events" on events for select using (is_published = true);
create policy "Public can read published sermons" on sermons for select using (is_published = true);
create policy "Public can read published music" on music_tracks for select using (is_published = true);
create policy "Public can read active announcements" on announcements for select using (start_date <= now() and (end_date is null or end_date >= now()));
create policy "Public can read published devotionals" on devotionals for select using (is_published = true);
create policy "Public can read published CMS pages" on cms_pages for select using (is_published = true);
create policy "Public can read active ministries" on ministries for select using (is_active = true);
create policy "Public can read active deacons" on deacons for select using (is_active = true);
create policy "Public can read wards" on wards for select using (true);
create policy "Public can read approved testimonies" on testimonies for select using (is_approved = true);
create policy "Public can read approved businesses" on businesses for select using (is_approved = true);
create policy "Public can read public prayers" on prayer_requests for select using (is_public = true);

-- Public insert policies
create policy "Anyone can submit contact message" on contact_messages for insert with check (true);
create policy "Anyone can submit prayer request" on prayer_requests for insert with check (true);

-- Authenticated user policies
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Members can read directory" on profiles for select using (auth.uid() is not null and is_active = true);
create policy "Users can read own donations" on donations for select using (auth.uid() = profile_id);
create policy "Users can read own goals" on spiritual_goals for select using (auth.uid() = profile_id);
create policy "Users can manage own goals" on spiritual_goals for all using (auth.uid() = profile_id);
create policy "Users can register for events" on event_registrations for insert with check (auth.uid() = profile_id);
create policy "Users can read own registrations" on event_registrations for select using (auth.uid() = profile_id);
create policy "Users can submit testimony" on testimonies for insert with check (auth.uid() = profile_id);
create policy "Users can submit business" on businesses for insert with check (auth.uid() = profile_id);

-- Admin policies (using a helper function)
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  );
end;
$$ language plpgsql security definer;

create policy "Admins can manage all profiles" on profiles for all using (is_admin());
create policy "Admins can manage events" on events for all using (is_admin());
create policy "Admins can manage sermons" on sermons for all using (is_admin());
create policy "Admins can manage music" on music_tracks for all using (is_admin());
create policy "Admins can manage announcements" on announcements for all using (is_admin());
create policy "Admins can manage donations" on donations for all using (is_admin());
create policy "Admins can manage ministries" on ministries for all using (is_admin());
create policy "Admins can manage deacons" on deacons for all using (is_admin());
create policy "Admins can manage wards" on wards for all using (is_admin());
create policy "Admins can manage prayer requests" on prayer_requests for all using (is_admin());
create policy "Admins can manage testimonies" on testimonies for all using (is_admin());
create policy "Admins can manage devotionals" on devotionals for all using (is_admin());
create policy "Admins can manage CMS pages" on cms_pages for all using (is_admin());
create policy "Admins can read contact messages" on contact_messages for select using (is_admin());
create policy "Admins can manage businesses" on businesses for all using (is_admin());
