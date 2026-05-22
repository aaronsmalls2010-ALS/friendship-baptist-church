import type {
  Profile,
  Ministry,
  Event,
  Sermon,
  MusicTrack,
  Announcement,
  PrayerRequest,
  Donation,
  Deacon,
  Ward,
  Business,
  Devotional,
  SpiritualGoal,
  Notification,
  TimelineEvent,
  Testimony,
  Family,
  FamilyMember,
  MinistryMember,
  MinistryMessage,
} from "@/types";

// ─── Wards ──────────────────────────────────────────────────────────
export const MOCK_WARDS: Ward[] = [
  { id: "w1", name: "Ward 1", description: "Church families assigned to Ward 1", deacon_id: "d1", families_count: 18, created_at: "2024-01-01" },
  { id: "w2", name: "Ward 2", description: "Church families assigned to Ward 2", deacon_id: "d1", families_count: 22, created_at: "2024-01-01" },
  { id: "w3", name: "Ward 3", description: "Church families assigned to Ward 3", deacon_id: "d2", families_count: 15, created_at: "2024-01-01" },
  { id: "w4", name: "Ward 4", description: "Church families assigned to Ward 4", deacon_id: "d3", families_count: 20, created_at: "2024-01-01" },
  { id: "w5", name: "Ward 5", description: "Church families assigned to Ward 5", deacon_id: "d5", families_count: 17, created_at: "2024-01-01" },
  { id: "w6", name: "Ward 6", description: "Church families assigned to Ward 6", deacon_id: "d7", families_count: 14, created_at: "2024-01-01" },
];

// ─── Deacons ────────────────────────────────────────────────────────
export const MOCK_DEACONS: Deacon[] = [
  {
    id: "d1", profile_id: "p1", ward_id: "w1", ordained_date: "2005-06-15",
    title: "Chairman",
    bio: "Chairman Deacon Simmons has faithfully served the church for many years. He leads the deacon board with wisdom and integrity, guiding the spiritual care of multiple ward families with a heart devoted to prayer and service.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Edward", last_name: "Simmons", phone: "(646) 201-0833", photo_url: undefined, ward_name: "Ward 1 & Ward 2",
  },
  {
    id: "d2", profile_id: "p2", ward_id: "w3", ordained_date: "2010-03-22",
    bio: "Deacon Moultrie brings warmth and dedication to his ward families. He is known for his steadfast commitment to visiting the sick and comforting those in need, embodying the servant leadership that defines our deacon ministry.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Leon", last_name: "Moultrie", photo_url: undefined, ward_name: "Ward 3",
  },
  {
    id: "d3", profile_id: "p3", ward_id: "w4", ordained_date: "2012-09-10",
    bio: "Deacon Grant serves alongside Deacon Brisbane to shepherd the families of Ward 4. His compassionate spirit and commitment to outreach make him a pillar of strength in the congregation.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Terry", last_name: "Grant", phone: "(843) 271-4581", photo_url: undefined, ward_name: "Ward 4",
  },
  {
    id: "d4", profile_id: "p4", ward_id: "w4", ordained_date: "2015-01-18",
    bio: "Deacon Brisbane partners with Deacon Grant to care for the families of Ward 4. His faithful presence and generous heart bring encouragement to all who know him.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Horace", last_name: "Brisbane", photo_url: undefined, ward_name: "Ward 4",
  },
  {
    id: "d5", profile_id: "p5", ward_id: "w5", ordained_date: "2018-05-27",
    title: "Vice Chairman",
    bio: "Vice Chairman Deacon Smalls is a lifelong member of Friendship Baptist Church. His energy and dedication inspire both young and old in the congregation, and he serves as a trusted advisor on the deacon board.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Oscar", last_name: "Smalls", phone: "(843) 263-0027", photo_url: undefined, ward_name: "Ward 5",
  },
  {
    id: "d6", profile_id: "p6", ward_id: "w5", ordained_date: "2020-11-08",
    bio: "Deacon Gwyn works alongside Vice Chairman Deacon Smalls to minister to the families of Ward 5. He brings a spirit of fellowship and devotion to every aspect of his service.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Cecil", last_name: "Gwyn", phone: "(912) 344-0500", photo_url: undefined, ward_name: "Ward 5",
  },
  {
    id: "d7", profile_id: "p7", ward_id: "w6", ordained_date: "2019-04-14",
    bio: "Deacon Aaron Smalls faithfully shepherds the families of Ward 6. His quiet strength and unwavering commitment to the church make him a dependable source of spiritual support for his ward families.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Aaron", last_name: "Smalls", phone: "(843) 263-0072", photo_url: undefined, ward_name: "Ward 6",
  },
];

// ─── Ministries ─────────────────────────────────────────────────────
export const MOCK_MINISTRIES: Ministry[] = [
  {
    id: "m1", name: "Usher Board", description: "The Usher Board welcomes and assists all who enter the doors of Friendship Baptist. They serve as the first point of contact for visitors and ensure an orderly, spirit-filled worship experience.",
    leader_id: "p7", manager_id: "p7", schedule: "Meets 1st Saturday at 10:00 AM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
  {
    id: "m2", name: "Choir", description: "The Friendship Baptist Choir lifts voices in praise and worship, carrying on the rich tradition of African American sacred music. From hymns to contemporary gospel, the choir ministers through song every Sunday.",
    leader_id: "p8", manager_id: "p8", schedule: "Rehearsals every Thursday at 7:00 PM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
  {
    id: "m3", name: "Youth Ministry", description: "Our Youth Ministry nurtures the next generation of believers through Bible study, fellowship, community service, and fun. Open to young people ages 12-18.",
    leader_id: "p9", manager_id: "p9", schedule: "Meets every Friday at 6:30 PM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
  {
    id: "m4", name: "Missionary Society", description: "The Missionary Society extends the love of Christ beyond our church walls through local outreach, community support, and global mission partnerships rooted in the Great Commission.",
    leader_id: "p10", manager_id: "p10", schedule: "Meets 2nd Saturday at 11:00 AM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
  {
    id: "m5", name: "Deaconess Board", description: "The Deaconess Board serves alongside the deacons, providing spiritual guidance, visiting the sick, and supporting families during times of need. They are pillars of compassion in our congregation.",
    leader_id: "p11", manager_id: "p11", schedule: "Meets 3rd Saturday at 10:00 AM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
  {
    id: "m6", name: "Sunday School", description: "Sunday School offers Bible-based teaching for all ages. Classes meet before morning worship to deepen understanding of God's Word and strengthen faith foundations.",
    leader_id: "p12", manager_id: "p12", schedule: "Every Sunday at 9:00 AM", image_url: undefined, is_active: true, created_at: "2024-01-01",
  },
];

// ─── Events ─────────────────────────────────────────────────────────
export const MOCK_EVENTS: Event[] = [
  {
    id: "e1", title: "Annual Church Anniversary Celebration", description: "Join us as we celebrate another year of God's faithfulness to Friendship Baptist Church. Special guest speakers, dinner, and fellowship.",
    start_date: "2026-06-14T10:00:00", end_date: "2026-06-14T15:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e2", title: "Vacation Bible School", description: "A week of Bible learning, songs, crafts, and activities for children ages 5-12. Theme: 'Walking in the Light.'",
    start_date: "2026-06-22T09:00:00", end_date: "2026-06-26T12:00:00", location: "Fellowship Hall", ministry_id: "m3", image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e3", title: "Community Fish Fry & Cookout", description: "Our beloved annual fish fry brings the whole community together. Fresh Lowcountry seafood, live music, and Christian fellowship for all.",
    start_date: "2026-07-04T11:00:00", end_date: "2026-07-04T16:00:00", location: "Church Grounds", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e4", title: "Youth Back-to-School Rally", description: "Sending our young people back to school with prayer, school supplies, and encouragement. All families welcome.",
    start_date: "2026-08-10T10:00:00", end_date: "2026-08-10T13:00:00", location: "Fellowship Hall", ministry_id: "m3", image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e5", title: "Women's Prayer Breakfast", description: "A morning of prayer, devotion, and fellowship for the women of Friendship Baptist. Guest speaker Sister Mae Robinson.",
    start_date: "2026-06-07T08:00:00", end_date: "2026-06-07T11:00:00", location: "Fellowship Hall", ministry_id: "m5", image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e6", title: "Choir Musical Workshop", description: "Sharpen your vocal skills and learn new praise songs. Open to all choir members and anyone interested in joining the music ministry.",
    start_date: "2026-06-28T09:00:00", end_date: "2026-06-28T14:00:00", location: "Choir Room", ministry_id: "m2", image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  // Past events
  {
    id: "e7", title: "Easter Sunrise Service", description: "A beautiful morning celebrating the resurrection of our Lord and Savior, Jesus Christ.",
    start_date: "2026-04-05T06:30:00", end_date: "2026-04-05T08:00:00", location: "Church Grounds", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e8", title: "Spring Revival", description: "Three nights of powerful preaching, worship, and spiritual renewal. Guest Evangelist Rev. Dr. Calvin Harris.",
    start_date: "2026-03-18T19:00:00", end_date: "2026-03-20T21:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
];

// ─── Sermons ────────────────────────────────────────────────────────
export const MOCK_SERMONS: Sermon[] = [
  {
    id: "s1", title: "Walking by Faith, Not by Sight", speaker: "Pastor Isiah Smalls", date: "2026-05-18",
    scripture: "2 Corinthians 5:7", topics: ["Faith", "Trust", "Perseverance"], duration: 2640, created_at: "2024-01-01",
  },
  {
    id: "s2", title: "The Power of a Praying Church", speaker: "Pastor Isiah Smalls", date: "2026-05-11",
    scripture: "James 5:16", topics: ["Prayer", "Community", "Healing"], duration: 2880, created_at: "2024-01-01",
  },
  {
    id: "s3", title: "Rooted and Grounded in Love", speaker: "Pastor Isiah Smalls", date: "2026-05-04",
    scripture: "Ephesians 3:17-19", topics: ["Love", "Foundation", "Growth"], duration: 2400, created_at: "2024-01-01",
  },
  {
    id: "s4", title: "God's Purpose for Your Storm", speaker: "Pastor Isiah Smalls", date: "2026-04-27",
    scripture: "Mark 4:35-41", topics: ["Trials", "Faith", "Purpose"], duration: 3000, created_at: "2024-01-01",
  },
  {
    id: "s5", title: "The Heritage of the Faithful", speaker: "Rev. Dr. Calvin Harris", date: "2026-03-18",
    scripture: "Psalm 78:1-7", topics: ["Heritage", "Legacy", "Teaching"], duration: 3120, created_at: "2024-01-01",
  },
  {
    id: "s6", title: "A New Thing in the Land", speaker: "Pastor Isiah Smalls", date: "2026-04-20",
    scripture: "Isaiah 43:19", topics: ["Renewal", "Hope", "Vision"], duration: 2700, created_at: "2024-01-01",
  },
];

// ─── Music Tracks ───────────────────────────────────────────────────
export const MOCK_MUSIC_TRACKS: MusicTrack[] = [
  { id: "mt1", title: "Oh Lord I Want You to Help Me", artist: "Shirley Caesar", album: "Gospel Classics", audio_url: "/music/Shirley Caesar 1975 Oh Lord I Want You To Help Me.mp3", duration: 285, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt2", title: "Amazing Grace", artist: "FBC Mass Choir", album: "Sunday Morning Praise", audio_url: "", duration: 320, track_type: "hymn", created_at: "2024-01-01" },
  { id: "mt3", title: "Total Praise", artist: "FBC Mass Choir", album: "Sunday Morning Praise", audio_url: "", duration: 290, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt4", title: "I Need You to Survive", artist: "FBC Praise Team", album: "Together in Worship", audio_url: "", duration: 345, track_type: "worship", created_at: "2024-01-01" },
];

// ─── Announcements ──────────────────────────────────────────────────
export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1", title: "Church Anniversary Planning Meeting", body: "All ministry leaders are asked to attend the planning meeting for our upcoming church anniversary celebration. Your input is vital.",
    start_date: "2026-05-20", end_date: "2026-06-14", is_pinned: true, category: "church", ministry_id: undefined, created_at: "2024-01-01",
  },
  {
    id: "a2", title: "VBS Volunteer Sign-Up", body: "We need volunteers for Vacation Bible School! Teachers, helpers, kitchen staff, and decorators are all needed. See Sister Thompson to sign up.",
    start_date: "2026-05-15", end_date: "2026-06-20", is_pinned: true, category: "youth", ministry_id: "m3", created_at: "2024-01-01",
  },
  {
    id: "a3", title: "Building Fund Update", body: "Thank you, church family, for your generous contributions to the building fund. We are at 78% of our goal. God is faithful!",
    start_date: "2026-05-18", is_pinned: false, category: "finance", ministry_id: undefined, created_at: "2024-01-01",
  },
  {
    id: "a4", title: "New Choir Members Welcome", body: "The choir is accepting new members. If you love to sing unto the Lord, join us for rehearsal any Thursday evening at 7:00 PM.",
    start_date: "2026-05-01", is_pinned: false, category: "ministry", ministry_id: "m2", created_at: "2024-01-01",
  },
  {
    id: "a5", title: "Food Pantry Donations Needed", body: "Our food pantry is running low. Please bring canned goods, rice, and non-perishable items to support families in need in our community.",
    start_date: "2026-05-10", is_pinned: false, category: "outreach", ministry_id: "m4", created_at: "2024-01-01",
  },
];

// ─── Prayer Requests ────────────────────────────────────────────────
export const MOCK_PRAYER_REQUESTS: PrayerRequest[] = [
  { id: "pr1", profile_id: "p7", name: "Sister Martha", request: "Please pray for my mother's recovery from surgery. She is strong in faith and we believe God will see her through.", is_public: true, status: "praying", category: "health", created_at: "2026-05-20" },
  { id: "pr2", profile_id: "p8", name: "Brother James", request: "Praying for our young people heading to college this fall. May God guide their steps and keep them rooted in faith.", is_public: true, status: "pending", category: "guidance", created_at: "2026-05-19" },
  { id: "pr3", name: "Anonymous", request: "Please keep my family in your prayers during this season of transition. We trust that God is making a way.", is_public: true, status: "praying", category: "family", created_at: "2026-05-17" },
  { id: "pr4", profile_id: "p10", name: "Deaconess Green", request: "Giving God the praise! My grandson has been accepted to the University of South Carolina. Prayer answered!", is_public: true, status: "answered", category: "thanksgiving", created_at: "2026-05-15" },
  { id: "pr5", name: "Sister Johnson", request: "Asking the church to pray for our neighborhood. We need God's peace and protection over our community.", is_public: true, status: "praying", category: "community", created_at: "2026-05-14" },
  { id: "pr6", name: "Private Request", request: "Personal prayer need.", is_public: false, status: "pending", category: "personal", created_at: "2026-05-12" },
];

// ─── Testimonies ────────────────────────────────────────────────────
export const MOCK_TESTIMONIES: Testimony[] = [
  {
    id: "t1", author_name: "Sister Dorothy Mae", content: "When I lost my husband of 42 years, this church family wrapped their arms around me. The deacons visited every week, the Deaconess Board brought meals, and Pastor Smalls prayed with me through my darkest hours. I am standing today because of the love of God shown through Friendship Baptist.",
    date: "2026-04-15", is_approved: true, created_at: "2024-01-01",
  },
  {
    id: "t2", author_name: "Brother Michael", content: "I came to Friendship Baptist as a visitor three years ago and found a home. The genuine warmth of this congregation and the powerful teaching of the Word changed my life. I was baptized here and now serve on the usher board with pride.",
    date: "2026-03-20", is_approved: true, created_at: "2024-01-01",
  },
  {
    id: "t3", author_name: "The Thompson Family", content: "Our children have grown up in this church, and the values they learned in Sunday School and Youth Ministry have shaped who they are. Friendship Baptist is more than a church — it is our family's spiritual foundation.",
    date: "2026-02-10", is_approved: true, created_at: "2024-01-01",
  },
  {
    id: "t4", author_name: "Sister Ruth", content: "After being diagnosed with cancer, the prayer warriors of Friendship Baptist held me up in prayer every single day. Today I am cancer-free and my faith is stronger than ever. To God be the glory!",
    date: "2026-01-28", is_approved: true, created_at: "2024-01-01",
  },
];

// ─── Devotionals ────────────────────────────────────────────────────
export const MOCK_DEVOTIONALS: Devotional[] = [
  {
    id: "dv1", title: "The Anchor of Our Hope", scripture: "Hebrews 6:19", scripture_text: "We have this hope as an anchor for the soul, firm and secure.",
    body: "In the storms of life, our hope in Christ is the anchor that holds us steady. When the winds blow and the waves crash, we can rest in the assurance that God's promises never fail. Today, meditate on the faithfulness of God and let your hope be renewed.",
    author: "Pastor Isiah Smalls", date: "2026-05-22", created_at: "2024-01-01",
  },
  {
    id: "dv2", title: "Joy in the Morning", scripture: "Psalm 30:5", scripture_text: "Weeping may endure for a night, but joy cometh in the morning.",
    body: "No matter what you faced yesterday — grief, disappointment, uncertainty — God has prepared a new morning for you. His mercies are new every day. Rise with expectation, knowing that joy is your portion through Christ Jesus.",
    author: "Pastor Isiah Smalls", date: "2026-05-21", created_at: "2024-01-01",
  },
  {
    id: "dv3", title: "Strength for the Weary", scripture: "Isaiah 40:31", scripture_text: "But those who hope in the Lord will renew their strength.",
    body: "Are you tired? Worn down by the demands of daily life? The Lord invites you to wait on Him — not passively, but with active trust. As you place your burdens at His feet, He will lift you up on wings like eagles.",
    author: "Deacon Edward Simmons", date: "2026-05-20", created_at: "2024-01-01",
  },
  {
    id: "dv4", title: "Walking in Purpose", scripture: "Jeremiah 29:11", scripture_text: "For I know the plans I have for you, declares the Lord.",
    body: "God has a plan for your life — a plan born of love and filled with hope. Even when the path seems unclear, trust that the Creator of the universe is directing your steps. Walk boldly in the purpose He has given you.",
    author: "Pastor Isiah Smalls", date: "2026-05-19", created_at: "2024-01-01",
  },
  {
    id: "dv5", title: "The Power of Gratitude", scripture: "1 Thessalonians 5:18", scripture_text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    body: "Gratitude transforms our perspective. When we choose to give thanks — even in difficulty — we shift our focus from our problems to God's provision. Start your day with three things you are thankful for, and watch how God opens your heart.",
    author: "Sister Mae Robinson", date: "2026-05-18", created_at: "2024-01-01",
  },
];

// ─── Member Profiles ────────────────────────────────────────────────
export const MOCK_PROFILES: Profile[] = [
  { id: "p7", email: "martha.washington@email.com", first_name: "Martha", last_name: "Washington", phone: "(843) 555-0201", role: "member", gender: "female", family_id: "f1", date_of_birth: "1975-03-12", about_bio: "Proud member of Friendship Baptist for over 20 years. Active in the Usher Board and a dedicated servant of the Lord.", photo_url: undefined, created_at: "2022-03-15", updated_at: "2024-01-01" },
  { id: "p8", email: "james.singleton@email.com", first_name: "James", last_name: "Singleton", phone: "(843) 555-0202", role: "member", gender: "male", date_of_birth: "1968-07-22", about_bio: "Choir director and lifelong musician. Using my gifts to glorify God through song.", photo_url: undefined, created_at: "2020-08-22", updated_at: "2024-01-01" },
  { id: "p9", email: "crystal.young@email.com", first_name: "Crystal", last_name: "Young", phone: "(843) 555-0203", role: "member", gender: "female", family_id: "f2", date_of_birth: "1990-11-05", about_bio: "Youth Ministry leader passionate about guiding the next generation in faith.", photo_url: undefined, created_at: "2021-01-10", updated_at: "2024-01-01" },
  { id: "p10", email: "mae.robinson@email.com", first_name: "Mae", last_name: "Robinson", phone: "(843) 555-0204", role: "member", gender: "female", family_id: "f3", date_of_birth: "1955-09-18", about_bio: "Missionary Society leader. Dedicated to community outreach and serving others.", photo_url: undefined, created_at: "2019-06-01", updated_at: "2024-01-01" },
  { id: "p11", email: "patricia.grant@email.com", first_name: "Patricia", last_name: "Grant", phone: "(843) 555-0205", role: "deacon", photo_url: undefined, created_at: "2018-11-15", updated_at: "2024-01-01" },
  { id: "p12", email: "henry.baker@email.com", first_name: "Henry", last_name: "Baker", phone: "(843) 555-0206", role: "minister", photo_url: undefined, created_at: "2017-04-20", updated_at: "2024-01-01" },
  { id: "p13", email: "gloria.campbell@email.com", first_name: "Gloria", last_name: "Campbell", phone: "(843) 555-0207", role: "member", gender: "female", family_id: "f1", date_of_birth: "1998-06-30", photo_url: undefined, created_at: "2023-02-28", updated_at: "2024-01-01" },
  { id: "p14", email: "william.harris@email.com", first_name: "William", last_name: "Harris", phone: "(843) 555-0208", role: "admin", photo_url: undefined, created_at: "2016-09-05", updated_at: "2024-01-01" },
];

// ─── Businesses ─────────────────────────────────────────────────────
export const MOCK_BUSINESSES: Business[] = [
  { id: "b1", name: "Gullah Grub Restaurant", owner_name: "Bill Green", description: "Authentic Gullah Geechee cuisine in the heart of downtown Beaufort. Family recipes passed down through generations.", category: "Restaurant", phone: "(843) 555-0301", website: "https://example.com", is_approved: true, created_at: "2024-01-01" },
  { id: "b2", name: "Beaufort Barber & Style", owner_name: "Marcus Johnson", description: "Full-service barbershop serving men and boys. Haircuts, beard trims, and hot towel shaves in a welcoming atmosphere.", category: "Personal Care", phone: "(843) 555-0302", is_approved: true, created_at: "2024-01-01" },
  { id: "b3", name: "Island Tax & Accounting", owner_name: "Patricia Evans", description: "Professional tax preparation and bookkeeping services for individuals and small businesses. Serving Beaufort since 2005.", category: "Professional Services", phone: "(843) 555-0303", email: "patricia@islandtax.com", is_approved: true, created_at: "2024-01-01" },
  { id: "b4", name: "Grace Home Health Care", owner_name: "Nurse Dorothy Williams", description: "Compassionate home health care services for seniors and those recovering from illness. Licensed and insured.", category: "Healthcare", phone: "(843) 555-0304", is_approved: true, created_at: "2024-01-01" },
  { id: "b5", name: "Lowcountry Lawn & Garden", owner_name: "Tommy Davis", description: "Professional landscaping, lawn care, and garden design. Beautifying Beaufort one yard at a time.", category: "Home Services", phone: "(843) 555-0305", is_approved: true, created_at: "2024-01-01" },
  { id: "b6", name: "Sweet Tea Catering", owner_name: "Sister Alma Reed", description: "Catering for church events, family reunions, weddings, and celebrations. Southern cooking with love.", category: "Restaurant", phone: "(843) 555-0306", is_approved: true, created_at: "2024-01-01" },
];

// ─── Timeline Events (Church History) ───────────────────────────────
export const MOCK_TIMELINE: TimelineEvent[] = [
  { id: "tl1", year: 1865, title: "The Beginning", description: "In the wake of emancipation, formerly enslaved men and women gathered under the oak trees to worship in freedom. From those humble gatherings, the seeds of Friendship Baptist Church were planted.", order: 1 },
  { id: "tl2", year: 1882, title: "A Permanent Home", description: "The congregation, having grown in number and spirit, erected the first permanent church building on Washington Street — a modest wood-frame structure built by the hands of its own members.", order: 2 },
  { id: "tl3", year: 1920, title: "A Community Cornerstone", description: "Friendship Baptist became a central gathering place for the African American community in Beaufort, hosting not only worship services but also community meetings, school programs, and social events.", order: 3 },
  { id: "tl4", year: 1948, title: "The Brick Church", description: "Under visionary pastoral leadership, the congregation raised funds and built the brick sanctuary that would serve as the church home for decades, a testament to faith and perseverance.", order: 4 },
  { id: "tl5", year: 1965, title: "Standing for Justice", description: "During the Civil Rights Movement, Friendship Baptist opened its doors for community organizing, voter registration drives, and strategy meetings, standing firm on the belief that justice is a spiritual calling.", order: 5 },
  { id: "tl6", year: 1985, title: "Growth and Expansion", description: "The church expanded with a new fellowship hall and educational wing, providing space for the growing congregation and its many ministries serving the Beaufort community.", order: 6 },
  { id: "tl7", year: 1998, title: "Preserving Gullah Heritage", description: "Friendship Baptist launched programs to preserve and celebrate the Gullah Geechee cultural heritage of its members, honoring the traditions, language, and customs of the Lowcountry.", order: 7 },
  { id: "tl8", year: 2010, title: "Pastor Smalls Arrives", description: "Pastor Isiah Smalls was called to lead Friendship Baptist Church, bringing a renewed vision for ministry, community outreach, and spiritual growth that energized the congregation.", order: 8 },
  { id: "tl9", year: 2020, title: "Faith Through the Storm", description: "When the pandemic closed doors across the nation, Friendship Baptist found new ways to worship — through online services, parking lot prayer, and doorstep deliveries to the homebound.", order: 9 },
  { id: "tl10", year: 2026, title: "A New Chapter", description: "Friendship Baptist Church launches a new digital platform, embracing technology to reach members and visitors wherever they are, while remaining rooted in the timeless truth of God's Word.", order: 10 },
];

// ─── Donations ──────────────────────────────────────────────────────
export const MOCK_DONATIONS: Donation[] = [
  { id: "dn1", profile_id: "p7", amount: 100, donation_type: "tithe", is_recurring: true, date: "2026-05-18", created_at: "2024-01-01" },
  { id: "dn2", profile_id: "p8", amount: 250, donation_type: "building_fund", campaign: "Building Fund 2026", is_recurring: false, date: "2026-05-11", created_at: "2024-01-01" },
  { id: "dn3", profile_id: "p10", amount: 50, donation_type: "offering", is_recurring: true, date: "2026-05-04", created_at: "2024-01-01" },
  { id: "dn4", profile_id: "p12", amount: 500, donation_type: "mission", campaign: "Global Missions", is_recurring: false, date: "2026-04-27", created_at: "2024-01-01" },
];

// ─── Spiritual Goals ────────────────────────────────────────────────
export const MOCK_SPIRITUAL_GOALS: SpiritualGoal[] = [
  { id: "sg1", profile_id: "p7", type: "bible_reading", title: "Read Through the New Testament", target: 260, current: 182, period: "yearly", is_completed: false, created_at: "2024-01-01" },
  { id: "sg2", profile_id: "p7", type: "prayer", title: "Daily Morning Prayer", target: 30, current: 24, period: "monthly", is_completed: false, created_at: "2024-01-01" },
  { id: "sg3", profile_id: "p7", type: "service_hours", title: "Volunteer 10 Hours Monthly", target: 10, current: 7, period: "monthly", is_completed: false, created_at: "2024-01-01" },
];

// ─── Notifications ──────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", profile_id: "p7", title: "Church Anniversary — June 14", body: "Don't forget to RSVP for the Annual Church Anniversary Celebration.", type: "event", is_read: false, action_url: "/portal/events", created_at: "2026-05-20T10:00:00" },
  { id: "n2", profile_id: "p7", title: "New Devotional Available", body: "Today's devotional 'The Anchor of Our Hope' is now available.", type: "announcement", is_read: false, action_url: "/portal/devotionals", created_at: "2026-05-22T06:00:00" },
  { id: "n3", profile_id: "p7", title: "Prayer Request Update", body: "Your prayer request has received 12 prayers from the congregation.", type: "prayer", is_read: true, action_url: "/prayer", created_at: "2026-05-19T14:30:00" },
  { id: "n4", profile_id: "p7", title: "VBS Volunteers Needed", body: "The Youth Ministry is looking for Vacation Bible School volunteers.", type: "ministry", is_read: true, action_url: "/portal/events", created_at: "2026-05-18T09:00:00" },
  { id: "n5", profile_id: "p7", title: "Giving Receipt Available", body: "Your May giving statement is ready for download.", type: "system", is_read: false, action_url: "/portal/giving", created_at: "2026-05-17T08:00:00" },
];

// ─── Families ──────────────────────────────────────────────────────
export const MOCK_FAMILIES: Family[] = [
  {
    id: "f1", family_name: "The Washington Family", created_at: "2022-03-15", updated_at: "2024-01-01",
  },
  {
    id: "f2", family_name: "The Smalls Family", created_at: "2019-06-01", updated_at: "2024-01-01",
  },
  {
    id: "f3", family_name: "The Robinson Family", created_at: "2018-11-15", updated_at: "2024-01-01",
  },
];

// ─── Family Members ────────────────────────────────────────────────
export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  { id: "fm1", family_id: "f1", profile_id: "p7", relationship: "head", created_at: "2022-03-15", first_name: "Martha", last_name: "Washington", email: "martha.washington@email.com", phone: "(843) 555-0201" },
  { id: "fm2", family_id: "f1", profile_id: "p13", relationship: "child", created_at: "2023-02-28", first_name: "Gloria", last_name: "Campbell", email: "gloria.campbell@email.com", phone: "(843) 555-0207" },
  { id: "fm3", family_id: "f2", profile_id: "p9", relationship: "head", created_at: "2021-01-10", first_name: "Crystal", last_name: "Young", phone: "(843) 555-0203" },
  { id: "fm4", family_id: "f3", profile_id: "p10", relationship: "head", created_at: "2019-06-01", first_name: "Mae", last_name: "Robinson", phone: "(843) 555-0204" },
];

// ─── Ministry Members ──────────────────────────────────────────────
export const MOCK_MINISTRY_MEMBERS: MinistryMember[] = [
  // Usher Board members
  { id: "mm1", ministry_id: "m1", profile_id: "p7", role: "manager", status: "approved", requested_at: "2022-04-01", approved_at: "2022-04-01", profile_name: "Martha Washington", ministry_name: "Usher Board" },
  { id: "mm2", ministry_id: "m1", profile_id: "p8", role: "member", status: "approved", requested_at: "2022-05-10", approved_at: "2022-05-12", approved_by: "p7", profile_name: "James Singleton", ministry_name: "Usher Board" },
  { id: "mm3", ministry_id: "m1", profile_id: "p13", role: "member", status: "pending", requested_at: "2026-05-20", profile_name: "Gloria Campbell", ministry_name: "Usher Board" },
  // Choir members
  { id: "mm4", ministry_id: "m2", profile_id: "p8", role: "manager", status: "approved", requested_at: "2020-09-01", approved_at: "2020-09-01", profile_name: "James Singleton", ministry_name: "Choir" },
  { id: "mm5", ministry_id: "m2", profile_id: "p10", role: "member", status: "approved", requested_at: "2020-10-15", approved_at: "2020-10-16", approved_by: "p8", profile_name: "Mae Robinson", ministry_name: "Choir" },
  // Youth Ministry
  { id: "mm6", ministry_id: "m3", profile_id: "p9", role: "manager", status: "approved", requested_at: "2021-02-01", approved_at: "2021-02-01", profile_name: "Crystal Young", ministry_name: "Youth Ministry" },
  // Missionary Society
  { id: "mm7", ministry_id: "m4", profile_id: "p10", role: "manager", status: "approved", requested_at: "2019-07-01", approved_at: "2019-07-01", profile_name: "Mae Robinson", ministry_name: "Missionary Society" },
  { id: "mm8", ministry_id: "m4", profile_id: "p11", role: "member", status: "approved", requested_at: "2019-08-10", approved_at: "2019-08-12", approved_by: "p10", profile_name: "Patricia Grant", ministry_name: "Missionary Society" },
  // A denied request
  { id: "mm9", ministry_id: "m2", profile_id: "p14", role: "member", status: "denied", requested_at: "2026-04-01", profile_name: "William Harris", ministry_name: "Choir" },
  // Sunday School
  { id: "mm10", ministry_id: "m6", profile_id: "p12", role: "manager", status: "approved", requested_at: "2017-05-01", approved_at: "2017-05-01", profile_name: "Henry Baker", ministry_name: "Sunday School" },
];

// ─── Ministry Messages ─────────────────────────────────────────────
export const MOCK_MINISTRY_MESSAGES: MinistryMessage[] = [
  { id: "msg1", ministry_id: "m1", sent_by: "p7", subject: "Usher Board Meeting Reminder", body: "Reminder: Our monthly usher board meeting is this Saturday at 10 AM in the fellowship hall. Please make every effort to attend as we'll be discussing assignments for the anniversary celebration.", sent_at: "2026-05-20T14:00:00", sender_name: "Martha Washington", ministry_name: "Usher Board" },
  { id: "msg2", ministry_id: "m2", sent_by: "p8", subject: "New Songs for Anniversary", body: "Choir family, we have three new songs to learn for the anniversary celebration. Please come to Thursday rehearsal prepared. Sheet music will be distributed.", sent_at: "2026-05-19T18:00:00", sender_name: "James Singleton", ministry_name: "Choir" },
  { id: "msg3", ministry_id: "m3", sent_by: "p9", subject: "VBS Planning Update", body: "Youth Ministry team, VBS planning is in full swing! We need volunteers for crafts, snacks, and Bible study stations. Please let me know your availability.", sent_at: "2026-05-18T10:00:00", sender_name: "Crystal Young", ministry_name: "Youth Ministry" },
];
