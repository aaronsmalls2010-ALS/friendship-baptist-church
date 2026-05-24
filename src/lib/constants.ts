export const CHURCH_INFO = {
  name: "The Friendship Baptist Church",
  tagline: "The Church That Christ Built",
  pastor: "Pastor Isiah Smalls",
  address: {
    street: "36 Friendship Lane",
    city: "Beaufort",
    state: "SC",
    zip: "29907",
  },
  phone: "(843) 525-1509",
  email: "info@thefriendshipbaptist.com",
  serviceTimes: [
    { day: "Sunday", time: "10:00 AM", name: "Morning Worship" },
    { day: "Sunday", time: "9:00 AM", name: "Sunday School" },
    { day: "Wednesday", time: "7:00 PM", name: "Bible Study" },
  ],
} as const;

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const PUBLIC_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Our Story", href: "/about" },
      { label: "Church History", href: "/history" },
      { label: "Pastor Smalls", href: "/pastor" },
      { label: "Deacons", href: "/deacons" },
      { label: "Hall of Angels", href: "/loved-ones" },
    ],
  },
  {
    label: "Worship",
    href: "/events",
    children: [
      { label: "Events", href: "/events" },
      { label: "Prayer Requests", href: "/prayer" },
    ],
  },
  {
    label: "Connect",
    href: "/ministries",
    children: [
      { label: "Ministries", href: "/ministries" },
      { label: "Events", href: "/events" },
      { label: "Calendar", href: "/calendar" },
      { label: "New Here?", href: "/welcome" },
      { label: "Bible Trivia", href: "/trivia" },
      { label: "Business Directory", href: "/business-directory" },
    ],
  },
  {
    label: "Media",
    href: "/media",
    children: [
      { label: "Sermons", href: "/media?tab=services" },
      { label: "Music", href: "/media?tab=music" },
      { label: "Photo Gallery", href: "/media?tab=gallery" },
      { label: "Testimonies", href: "/media?tab=testimonies" },
      { label: "Archives", href: "/media?tab=archives" },
    ],
  },
  { label: "Give", href: "/give" },
];

export const PORTAL_NAV: NavItem[] = [
  { label: "Dashboard", href: "/portal" },
  { label: "Directory", href: "/portal/directory" },
  { label: "My Profile", href: "/portal/profile" },
  { label: "Giving History", href: "/portal/giving" },
  { label: "Events", href: "/portal/events" },
  { label: "Devotionals", href: "/portal/devotionals" },
  { label: "Spiritual Growth", href: "/portal/growth" },
  { label: "Notifications", href: "/portal/notifications" },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Members", href: "/admin/members" },
  { label: "Ministries", href: "/admin/ministries" },
  { label: "Deacons", href: "/admin/deacons" },
  { label: "Wards", href: "/admin/wards" },
  { label: "Events", href: "/admin/events" },
  { label: "Announcements", href: "/admin/announcements" },
  { label: "Media", href: "/admin/media" },
  { label: "SMS Center", href: "/admin/sms" },
  { label: "Donations", href: "/admin/donations" },
  { label: "Content", href: "/admin/content" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Settings", href: "/admin/settings" },
];

export const SCRIPTURES = [
  {
    text: "For where two or three gather in my name, there am I with them.",
    reference: "Matthew 18:20",
  },
  {
    text: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13",
  },
  {
    text: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
  },
  {
    text: "Trust in the Lord with all your heart and lean not on your own understanding.",
    reference: "Proverbs 3:5",
  },
  {
    text: "Be strong and courageous. Do not be afraid; do not be discouraged.",
    reference: "Joshua 1:9",
  },
  {
    text: "And we know that in all things God works for the good of those who love him.",
    reference: "Romans 8:28",
  },
  {
    text: "The Lord is my light and my salvation — whom shall I fear?",
    reference: "Psalm 27:1",
  },
  {
    text: "But those who hope in the Lord will renew their strength.",
    reference: "Isaiah 40:31",
  },
];
