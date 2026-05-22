export type UserRole =
  | "member"
  | "deacon"
  | "minister"
  | "admin"
  | "super_admin";

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  photo_url?: string;
  role: UserRole;
  birthday?: string;
  anniversary?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  leader_id?: string;
  schedule?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location?: string;
  ministry_id?: string;
  image_url?: string;
  rsvp_enabled: boolean;
  is_published: boolean;
  created_at: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  scripture?: string;
  audio_url?: string;
  video_url?: string;
  transcript?: string;
  topics: string[];
  duration?: number;
  created_at: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  audio_url: string;
  duration: number;
  track_type: "worship" | "hymn" | "choir" | "gospel";
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  start_date: string;
  end_date?: string;
  is_pinned: boolean;
  category?: string;
  ministry_id?: string;
  image_url?: string;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  profile_id?: string;
  name: string;
  request: string;
  is_public: boolean;
  status: "pending" | "praying" | "answered";
  category?: string;
  created_at: string;
}

export interface Donation {
  id: string;
  profile_id?: string;
  amount: number;
  donation_type: "tithe" | "offering" | "building_fund" | "mission" | "other";
  campaign?: string;
  stripe_payment_id?: string;
  is_recurring: boolean;
  date: string;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  description?: string;
  deacon_id?: string;
  families_count?: number;
  created_at: string;
}

export interface Deacon {
  id: string;
  profile_id: string;
  ward_id?: string;
  ordained_date?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
  // Joined fields for display
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  photo_url?: string;
  ward_name?: string;
}

export interface Business {
  id: string;
  name: string;
  owner_name: string;
  description: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  image_url?: string;
  is_approved: boolean;
  created_at: string;
}

export interface Devotional {
  id: string;
  title: string;
  scripture: string;
  scripture_text: string;
  body: string;
  author: string;
  date: string;
  created_at: string;
}

export interface SpiritualGoal {
  id: string;
  profile_id: string;
  type: "bible_reading" | "prayer" | "service_hours" | "giving" | "fasting" | "study";
  title: string;
  target: number;
  current: number;
  period: "weekly" | "monthly" | "yearly";
  is_completed: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  title: string;
  body: string;
  type: "event" | "announcement" | "ministry" | "prayer" | "system";
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  description: string;
  image_url?: string;
  order: number;
}

export interface Testimony {
  id: string;
  author_name: string;
  content: string;
  date: string;
  is_approved: boolean;
  photo_url?: string;
  created_at: string;
}
