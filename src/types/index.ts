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
  gender?: "male" | "female" | "other";
  date_of_birth?: string;
  about_bio?: string;
  baptism_date?: string;
  birthday?: string;
  anniversary?: string;
  ward_id?: string;
  family_id?: string;
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
  manager_id?: string;
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

/** A single video segment within a worship service */
export interface ServiceVideo {
  type: "prayer" | "scripture" | "sermon" | "special";
  label: string;
  youtube_id?: string;        // YouTube video ID (e.g. "dQw4w9WgXcQ")
  local_filename: string;     // Original file name for reference
  description?: string;       // e.g. "Dea. Oscar Smalls leads us in prayer"
}

/** A complete worship service grouping prayer + scripture + sermon videos */
export interface WorshipService {
  id: string;
  date: string;               // ISO date "2020-04-05"
  title: string;               // Display title for the service
  speaker: string;
  videos: ServiceVideo[];
  is_special?: boolean;        // Pastor Appreciation, Easter, etc.
  scripture?: string;          // e.g. "Ephesians 6:10", "Psalms 23"
  sermon_title?: string;       // Specific sermon title when known
  description?: string;        // Service description/context
  special_notes?: string;      // Additional historical context
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
  email?: string;
  photo_url?: string;
  ward_name?: string;
  title?: string;
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

// ─── Ministry Membership ────────────────────────────────────────────

export type MinistryRole = "member" | "manager";
export type MinistryMemberStatus = "pending" | "approved" | "denied";

export interface MinistryMember {
  id: string;
  ministry_id: string;
  profile_id: string;
  role: MinistryRole;
  status: MinistryMemberStatus;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  // Joined fields for display
  profile_name?: string;
  profile_email?: string;
  profile_photo_url?: string;
  ministry_name?: string;
}

// ─── Family Tree ────────────────────────────────────────────────────

export type FamilyRelationship = "head" | "spouse" | "child" | "parent" | "sibling" | "grandchild" | "grandparent" | "other";

export interface Family {
  id: string;
  family_name: string;
  created_at: string;
  updated_at: string;
  members?: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  family_id: string;
  profile_id: string;
  relationship: FamilyRelationship;
  created_at: string;
  // Joined fields
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  email?: string;
  phone?: string;
}

// ─── Memorial / Loved Ones Gone Home ───────────────────────────────

export interface MemorialComment {
  id: string;
  memorial_id: string;
  profile_id: string;
  author_name: string;
  author_photo_url?: string;
  body: string;
  created_at: string;
}

export interface MemorialPhoto {
  id: string;
  memorial_id: string;
  image_url: string;
  caption?: string;
  uploaded_by: string;
  created_at: string;
}

export interface Memorial {
  id: string;
  created_by: string;           // profile_id of member who created
  first_name: string;
  last_name: string;
  photo_url?: string;           // Main portrait photo
  date_of_birth?: string;       // ISO date
  date_of_passing: string;      // ISO date
  obituary: string;             // Rich text / long-form biography
  scripture?: string;           // Favorite scripture reference
  scripture_text?: string;      // Full scripture text
  favorite_hymn?: string;       // Favorite song/hymn
  church_roles?: string[];      // e.g. ["Deacon", "Choir Member", "Usher"]
  family_message?: string;      // Short message from the family
  is_published: boolean;
  photos: MemorialPhoto[];
  comments: MemorialComment[];
  created_at: string;
  updated_at: string;
}

// ─── Ministry Messages ──────────────────────────────────────────────

export interface MinistryMessage {
  id: string;
  ministry_id: string;
  sent_by: string;
  subject: string;
  body: string;
  sent_at: string;
  // Joined fields
  sender_name?: string;
  ministry_name?: string;
}
