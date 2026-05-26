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
  WorshipService,
  Memorial,
} from "@/types";

// ─── Wards ──────────────────────────────────────────────────────────
export const MOCK_WARDS: Ward[] = [
  { id: "w1", name: "Ward 1 & 2", description: "Church families assigned to Ward 1 & 2", deacon_id: "d1", families_count: 40, created_at: "2024-01-01" },
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
    bio: "After years of working in New York, Deacon Simmons answered God's call to come back home to the Lowcountry and serve his church family. As Chairman of the Deacon Board, he leads with quiet wisdom and steadfast integrity, drawing on his life experiences to guide and encourage ward families through every season.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Edward", last_name: "Simmons", phone: "(646) 201-0833", photo_url: undefined, ward_name: "Ward 1 & Ward 2",
  },
  {
    id: "d2", profile_id: "p2", ward_id: "w3", ordained_date: "2010-03-22",
    bio: "Deacon Moultrie is a man of strong will and deep passion for the work of the Lord. His bold, unwavering spirit inspires those around him to stand firm in their faith. Whether visiting the sick or leading devotion, he brings an intensity and sincerity that uplifts the entire congregation.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Leon", last_name: "Moultrie", photo_url: undefined, ward_name: "Ward 3",
  },
  {
    id: "d3", profile_id: "p3", ward_id: "w4", ordained_date: "2012-09-10",
    bio: "Deacon Grant brings discipline, energy, and structure to everything he does in service to the Lord. His organized approach to ministry and his enthusiastic spirit set a powerful example for the congregation. Whether coordinating ward activities or serving at the altar, he gives his very best with purpose and dedication.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Terry", last_name: "Grant", phone: "(843) 271-4581", photo_url: undefined, ward_name: "Ward 4",
  },
  {
    id: "d4", profile_id: "p4", ward_id: "w4", ordained_date: "2015-01-18",
    title: "Emeritus",
    bio: "Emeritus Deacon Brisbane is a pillar of wisdom and a true prayer warrior whose intercession has carried this church through countless seasons. His deep knowledge of Scripture and unwavering commitment to prayer make him a spiritual anchor for the congregation. When he prays, heaven listens.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Horace", last_name: "Brisbane", photo_url: undefined, ward_name: "Ward 4",
  },
  {
    id: "d5", profile_id: "p5", ward_id: "w5", ordained_date: "2018-05-27",
    title: "Vice Chairman",
    bio: "Vice Chairman Deacon Oscar Smalls is a man of remarkable growth and courage, always striving to put on the full armor of God as described in Ephesians 6. His journey of faith has strengthened his resolve to lead boldly, and he encourages every member to stand firm in the battle against spiritual adversity.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Oscar", last_name: "Smalls", phone: "(843) 263-0027", photo_url: undefined, ward_name: "Ward 5",
  },
  {
    id: "d6", profile_id: "p6", ward_id: "w5", ordained_date: "2020-11-08",
    bio: "Deacon Cecil Gwyn is a passionate and heartfelt servant of God who found a newfound home at Friendship Baptist Church. Since joining the congregation, his love for worship and genuine care for others have made a lasting impact. He pours his whole heart into ministry, and his warmth is felt by everyone he encounters.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Cecil", last_name: "Gwyn", phone: "(912) 344-0500", photo_url: undefined, ward_name: "Ward 5",
  },
  {
    id: "d7", profile_id: "p7", ward_id: "w6", ordained_date: "2019-04-14",
    bio: "Deacon Aaron Smalls is a kindhearted and quiet young man with an eager desire to learn and grow in the Lord. His humble spirit and willingness to serve wherever needed make him a valued member of the deacon board. He represents the next generation of servant leadership at Friendship Baptist Church.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Aaron", last_name: "Smalls", phone: "(843) 263-0072", photo_url: undefined, ward_name: "Ward 6",
  },
  {
    id: "d8", profile_id: "p15", ward_id: "w1", ordained_date: "1990-05-20",
    title: "Emeritus",
    bio: "Emeritus Deacon Seigler is a man of quiet determination and soft-spoken strength. His steady, faithful presence has been a constant source of encouragement for the church family over many years. He leads not with loud words but with consistent action, and his humble devotion to God speaks volumes to all who know him.",
    is_active: true, created_at: "2024-01-01",
    first_name: "Mikell", last_name: "Seigler", phone: "(843) 812-4321", photo_url: undefined, ward_name: "Ward 1 & Ward 2",
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
  // ── Major Holidays & African American Religious / Family Holidays ───
  {
    id: "e-ny", title: "New Year's Day Watch Night Service", description: "Ring in the new year in the presence of the Lord. Join us as we praise God for His faithfulness and step into the new year with prayer and worship.",
    start_date: "2026-01-01T00:00:00", end_date: "2026-01-01T01:30:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-mlk", title: "Dr. Martin Luther King Jr. Day Celebration", description: "Honoring the life and legacy of Dr. Martin Luther King Jr. through worship, reflection, and community service in the spirit of love and justice.",
    start_date: "2026-01-19T10:00:00", end_date: "2026-01-19T13:00:00", location: "Main Sanctuary & Fellowship Hall", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-bhm", title: "Black History Month Celebration", description: "A month-long celebration of African American heritage, faith, and achievement. Special programs, guest speakers, and cultural presentations throughout February.",
    start_date: "2026-02-01T10:00:00", end_date: "2026-02-01T13:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-val", title: "Valentine's Day Couples Fellowship", description: "A special evening for couples to celebrate love and strengthen their bonds through faith, fellowship, dinner, and devotion.",
    start_date: "2026-02-14T18:00:00", end_date: "2026-02-14T21:00:00", location: "Fellowship Hall", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-palm", title: "Palm Sunday Worship", description: "Join us as we celebrate Jesus' triumphant entry into Jerusalem. A joyful service of praise, palms, and proclamation.",
    start_date: "2026-03-29T10:00:00", end_date: "2026-03-29T12:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-gf", title: "Good Friday Service", description: "A solemn service remembering the crucifixion and sacrifice of our Lord Jesus Christ. Join us for Scripture reading, hymns, and reflection.",
    start_date: "2026-04-03T19:00:00", end_date: "2026-04-03T21:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-easter", title: "Easter Sunday Sunrise & Worship Service", description: "Celebrate the resurrection of Jesus Christ! Join us for a glorious sunrise service followed by our main Easter worship celebration with special music and praise.",
    start_date: "2026-04-05T06:30:00", end_date: "2026-04-05T13:00:00", location: "Church Grounds & Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-mom", title: "Mother's Day Celebration", description: "Honoring the mothers, grandmothers, and mother figures of our church family. A special service of love, recognition, and gratitude for their sacrifice and faithfulness.",
    start_date: "2026-05-10T10:00:00", end_date: "2026-05-10T13:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-mem", title: "Memorial Day Remembrance", description: "We honor and remember those who gave their lives in service to our country. A time of reflection, prayer, and patriotic worship.",
    start_date: "2026-05-25T10:00:00", end_date: "2026-05-25T12:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-june", title: "Juneteenth Freedom Celebration", description: "Celebrating the emancipation of enslaved African Americans. A day of worship, Gullah Geechee cultural heritage, food, music, and giving thanks for God's deliverance.",
    start_date: "2026-06-19T10:00:00", end_date: "2026-06-19T16:00:00", location: "Church Grounds", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-dad", title: "Father's Day Celebration", description: "Honoring the fathers, grandfathers, and father figures of Friendship Baptist. A special service of appreciation for the men who lead our families in faith.",
    start_date: "2026-06-21T10:00:00", end_date: "2026-06-21T13:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-labor", title: "Labor Day Family Cookout", description: "A fun-filled day of fellowship, food, and family activities as we close out the summer together. Bring your favorite dish and enjoy the Lowcountry fellowship.",
    start_date: "2026-09-07T11:00:00", end_date: "2026-09-07T16:00:00", location: "Church Grounds", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-grand", title: "Grandparents Day Recognition", description: "A heartfelt service honoring the grandparents of our congregation. Their wisdom, prayers, and love are the foundation of our church family.",
    start_date: "2026-09-13T10:00:00", end_date: "2026-09-13T12:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-harvest", title: "Fall Harvest Festival", description: "A family-friendly harvest celebration with games, food, hayrides, and fellowship. A wholesome alternative for the whole community.",
    start_date: "2026-10-31T15:00:00", end_date: "2026-10-31T19:00:00", location: "Church Grounds", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-vet", title: "Veterans Day Honor Service", description: "We salute and honor all veterans in our church family and community. Thank you for your service and sacrifice.",
    start_date: "2026-11-11T10:00:00", end_date: "2026-11-11T12:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-thanks", title: "Thanksgiving Day Worship & Community Dinner", description: "A special Thanksgiving worship service followed by a community dinner for all. We give thanks to God for His blessings and share a meal with those in need.",
    start_date: "2026-11-26T10:00:00", end_date: "2026-11-26T15:00:00", location: "Main Sanctuary & Fellowship Hall", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-xmas-prog", title: "Christmas Program & Nativity", description: "Our annual Christmas program featuring the youth nativity play, choir performances, and the retelling of the birth of Jesus Christ. A joyful celebration for the whole family.",
    start_date: "2026-12-20T17:00:00", end_date: "2026-12-20T20:00:00", location: "Main Sanctuary", ministry_id: "m3", image_url: undefined,
    rsvp_enabled: true, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-xmas", title: "Christmas Day Worship Service", description: "Celebrate the birth of our Lord and Savior Jesus Christ with a special Christmas morning worship service filled with carols, praise, and the Word of God.",
    start_date: "2026-12-25T10:00:00", end_date: "2026-12-25T12:00:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-watch", title: "Watch Night Service", description: "Close out the year in the house of the Lord. A powerful night of worship, testimony, and prayer as we cross over into the new year together.",
    start_date: "2026-12-31T22:00:00", end_date: "2027-01-01T00:30:00", location: "Main Sanctuary", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
  {
    id: "e-kwanzaa", title: "Kwanzaa Celebration", description: "Celebrating the seven principles of Kwanzaa — unity, self-determination, collective work, cooperative economics, purpose, creativity, and faith. A cultural and spiritual gathering for the community.",
    start_date: "2026-12-26T17:00:00", end_date: "2026-12-26T20:00:00", location: "Fellowship Hall", ministry_id: undefined, image_url: undefined,
    rsvp_enabled: false, is_published: true, created_at: "2024-01-01",
  },
];

// ─── Worship Services (real data from WordPress archive) ────────────
// YouTube IDs will be added after videos are uploaded to the church's YouTube channel.
// Until then, videos show "Coming Soon" placeholder.
// Metadata enriched from cached WordPress pages (scripture refs, deacon names, descriptions).
export const WORSHIP_SERVICES: WorshipService[] = [
  // ── 2021 ──────────────────────────────────────────────────────────
  { id: "ws01", date: "2021-04-11", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-04-11_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-04-11_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-04-11_Sermon.mp4" },
  ]},
  { id: "ws02", date: "2021-04-04", title: "Easter Sunday Worship", speaker: "Pastor Isiah Smalls", is_special: true, videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-04-04_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-04-04_Scripture.mp4" },
    { type: "sermon", label: "Easter Sermon", local_filename: "2021-04-04_Sermon.mp4" },
  ], special_notes: "Easter Sunday 2021" },
  { id: "ws03", date: "2021-03-28", title: "Palm Sunday Worship", speaker: "Pastor Isiah Smalls", is_special: true, videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-03-28_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-03-28_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-03-28_Sermon.mp4" },
    { type: "special", label: "Greeting & Reading", local_filename: "2021-03-28_GreetingAndReading.mp4" },
  ], special_notes: "Includes a separate Greeting and Reading video" },
  { id: "ws04", date: "2021-03-14", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-03-14_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-03-14_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-03-14_Sermon.mp4" },
  ]},
  { id: "ws05", date: "2021-03-07", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-03-07_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-03-07_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-03-07_Sermon.mp4" },
  ]},
  { id: "ws06", date: "2021-02-28", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-02-28_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-02-28_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-02-28_Sermon.mp4" },
  ]},
  { id: "ws07", date: "2021-02-07", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-02-07_Sermon.mp4" },
  ]},
  { id: "ws08", date: "2021-01-31", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-01-31_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-01-31_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-01-31_Sermon.mp4" },
  ]},
  { id: "ws09", date: "2021-01-24", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-01-24_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-01-24_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-01-24_Sermon.mp4" },
  ]},
  { id: "ws10", date: "2021-01-17", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-01-17_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-01-17_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-01-17_Sermon.mp4" },
  ]},
  { id: "ws11", date: "2021-01-10", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-01-10_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-01-10_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-01-10_Sermon.mp4" },
  ]},
  { id: "ws12", date: "2021-01-03", title: "New Year Sunday Worship", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2021-01-03_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2021-01-03_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2021-01-03_Sermon.mp4" },
  ]},

  // ── December 2020 ─────────────────────────────────────────────────
  { id: "ws13", date: "2020-12-27", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-12-27_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-12-27_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-12-27_Sermon.mp4" },
  ]},
  { id: "ws14", date: "2020-12-20", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-12-20_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-12-20_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-12-20_Sermon.mp4" },
  ]},
  { id: "ws15", date: "2020-12-13", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-12-13_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-12-13_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-12-13_Sermon.mp4" },
  ]},
  { id: "ws16", date: "2020-12-07", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-12-07_Prayer.mp4", description: "Prayer by Deacon Oscar Smalls" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-12-07_Scripture.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-12-07_Sermon.mp4" },
  ]},

  // ── November 2020 ─────────────────────────────────────────────────
  { id: "ws17", date: "2020-11-29", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Psalms 27", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-11-29_Prayer.mp4", description: "Prayer by Deacon Leon Moultrie" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-11-29_Scripture.mp4", description: "Deacon Edward Simmons reads Psalms 27" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-11-29_Sermon.mp4" },
  ]},
  { id: "ws18", date: "2020-11-22", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Psalms 23", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-11-22_Prayer.mp4", description: "Prayer by Deacon Oscar Smalls" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-11-22_Scripture.mp4", description: "Deacon Terry Grant reads the 23rd Psalms" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-11-22_Sermon.mp4" },
  ]},
  { id: "ws19", date: "2020-11-15", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "1 John 4:12-21", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-11-15_Prayer.mp4", description: "Word of Prayer by Deacon Leon Moultrie" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-11-15_Scripture.mp4", description: "Deacon Oscar Smalls reads 1 John 4:12-21" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-11-15_Sermon.mp4" },
  ]},
  { id: "ws20", date: "2020-11-08", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Psalms 27", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-11-08_Prayer.mp4", description: "Word of Prayer by Deacon Leon Moultrie" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-11-08_Scripture.mp4", description: "Deacon Edward Simmons reads Psalms 27" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-11-08_Sermon.mp4" },
  ]},
  { id: "ws21", date: "2020-11-01", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Isaiah 12", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-11-01_Prayer.mp4", description: "Word of Prayer by Deacon Oscar Smalls" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-11-01_Scripture.mp4", description: "Deacon Edward Simmons reads Isaiah 12" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-11-01_Sermon.mp4" },
  ]},

  // ── October 2020 ──────────────────────────────────────────────────
  { id: "ws22", date: "2020-10-25", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-10-25_Prayer.mp4", description: "Word of Prayer by Deacon Oscar Smalls" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-10-25_Sermon.mp4" },
  ]},
  { id: "ws23", date: "2020-10-18", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "John 1", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-10-18_Prayer.mp4", description: "Word of Prayer by Deacon Edward Simmons" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-10-18_Scripture.mp4", description: "Deacon Oscar Smalls reads The Gospel of John 1" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-10-18_Sermon.mp4" },
  ]},
  { id: "ws24", date: "2020-10-11", title: "Pastor Appreciation Sunday", speaker: "Pastor Isiah Smalls", is_special: true,
    description: "Pastor Appreciation Day with special presentations from congregation members",
    special_notes: "Participants: Sister Katie Calloway, Deacon Oscar Smalls, Deacon Edward Simmons, Deacon Terry Grant, Deacon Aaron Smalls. Includes intro, appreciation presentations, thank you message, and pastor parade.",
    videos: [
    { type: "special", label: "Introduction", local_filename: "Intro.mp4" },
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-10-11_Prayer.mp4", description: "Word of Prayer from Deacon Edward Simmons" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-10-11_Scripture.mp4", description: "Scripture from Deacon Oscar Smalls" },
    { type: "special", label: "Pastor Appreciation Part 1", local_filename: "2020-10-11_PastorAppreciation1.mp4" },
    { type: "special", label: "Pastor Appreciation Part 2", local_filename: "2020-10-11_PastorAppreciation2.mp4" },
    { type: "special", label: "Pastor Thank You", local_filename: "2020-10-11_PastorThankYou.mp4" },
    { type: "special", label: "Pastor Parade & Outro", local_filename: "2020-10-11_PastorParade_Outro.mp4" },
  ]},
  { id: "ws25", date: "2020-10-04", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Hebrews 13", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-10-04_Prayer.mp4", description: "Word of Prayer by Deacon Oscar Smalls" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-10-04_Scripture.mp4", description: "Deacon Edward Simmons reads Hebrews 13" },
  ]},

  // ── September 2020 ────────────────────────────────────────────────
  { id: "ws26", date: "2020-09-27", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "1 Corinthians 13", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-09-27_Prayer.mp4", description: "Word of Prayer by Deacon Oscar Smalls" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-09-27_Scripture.mp4", description: "Deacon Edward Simmons reads 1 Corinthians 13" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-09-27_Sermon.mp4" },
  ]},
  { id: "ws27", date: "2020-09-20", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-09-20_Prayer.mp4", description: "Prayer by Deacon Edward Simmons" },
    { type: "scripture", label: "Scripture & Testimony", local_filename: "2020-09-20_Scripture-Testimony.mp4", description: "Deacon Oscar Smalls gives a testimony" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-09-20_Sermon.mp4" },
  ], special_notes: "Scripture reading combined with testimony" },
  { id: "ws28", date: "2020-09-13", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Ephesians 6:10", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-09-13_Prayer.mp4", description: "Dea. Terry Grant leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-09-13_Scripture.mp4", description: "Deacon Oscar Smalls reads Ephesians 6:10" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-09-13_Sermon.mp4" },
  ]},
  { id: "ws29", date: "2020-09-06", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-09-06_Sermon.mp4" },
  ]},

  // ── August 2020 ───────────────────────────────────────────────────
  { id: "ws30", date: "2020-08-30", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Psalms 67", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-08-30_Prayer.mp4", description: "Dea. Terry Grant leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-08-30_Scripture.mp4", description: "Deacon Edward Simmons reads Psalms 67" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-08-30_Sermon.mp4" },
  ]},
  { id: "ws31", date: "2020-08-23", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-08-23_Sermon.mp4" },
  ]},
  { id: "ws32", date: "2020-08-16", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Psalms 16", videos: [
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-08-16_Sermon.mp4" },
  ], special_notes: "Prayer by Dea. Oscar Smalls; Scripture read by Deacon Edward Simmons — prayer and scripture videos not available" },
  { id: "ws33", date: "2020-08-09", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-08-09_Prayer.mp4" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-08-09_Scripture-1.mp4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-08-09_Sermon.mp4" },
  ]},
  { id: "ws34", date: "2020-08-02", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Ephesians 6", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-08-02_Prayer.mp4", description: "Dea. Edward Simmons leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-08-02_Scripture.mp4", description: "Deacon Oscar Smalls reads Ephesians 6" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-08-02_Sermon.mp4" },
  ]},

  // ── July 2020 ─────────────────────────────────────────────────────
  { id: "ws35", date: "2020-07-25", title: "Summer Revival", speaker: "Guest Speaker", is_special: true, videos: [
    { type: "sermon", label: "Revival Sermon", local_filename: "2020-07-25_Sermon_Doe.mp4" },
  ], special_notes: "Summer Revival service with guest speaker" },

  // ── May 2020 ──────────────────────────────────────────────────────
  { id: "ws36", date: "2020-05-24", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Romans 14", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-05-24_Prayer.mp4", description: "Dea. Oscar Smalls leads us in prayer" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-05-24_Sermon.mp4" },
  ]},
  { id: "ws37", date: "2020-05-10", title: "Mother's Day Worship", speaker: "Pastor Isiah Smalls", is_special: true, scripture: "Romans 14", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-05-10_Prayer.mp4", description: "Dea. Oscar Smalls leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-05-10_Scripture.mp4", description: "Deacon Edward Simmons reads Romans 14" },
    { type: "sermon", label: "Mother's Day Sermon", local_filename: "2020-05-10_Sermon.mp4" },
  ]},

  // ── April 2020 ────────────────────────────────────────────────────
  { id: "ws38", date: "2020-04-26", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Philippians 4", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-04-26_Prayer.mp4", description: "Dea. Terry Grant leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-04-26_Scripture.mp4", description: "Deacon Edward Simmons reads Philippians 4" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-04-26_Sermon_small.mp4" },
  ]},
  { id: "ws39", date: "2020-04-19", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls", scripture: "Ephesians 6", videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-04-19-Prayer.mp4", description: "Dea. Terry Grant leads us in prayer" },
    { type: "scripture", label: "Scripture Reading", local_filename: "2020-04-19-Scripture.mp4", description: "Deacon Edward Simmons reads Ephesians 6" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-04-19-Sermon.mp4" },
  ]},
  { id: "ws40", date: "2020-04-12", title: "Resurrection Sunday Worship", speaker: "Pastor Isiah Smalls", is_special: true,
    sermon_title: "Resurrection Sunday Sermon",
    special_notes: "Easter / Resurrection Sunday service",
    videos: [
    { type: "sermon", label: "Resurrection Sunday Sermon", local_filename: "ResurrectionSundaySermon.mp4" },
  ]},
  { id: "ws41", date: "2020-04-05", title: "First Parking Lot Service", speaker: "Pastor Isiah Smalls", is_special: true,
    description: "Our First Ever Parking Lot Service",
    special_notes: "Historic first parking lot service during COVID-19 pandemic",
    videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "2020-04-05_FBC-Prayer_OSmalls.mp4", description: "Dea. Oscar Smalls leads us in prayer" },
    { type: "sermon", label: "Sunday Sermon", local_filename: "2020-04-05_FBC-Sermon.mp4" },
  ]},

  // ── March 2020 ────────────────────────────────────────────────────
  { id: "ws42", date: "2020-03-29", title: "Sunday Worship Service", speaker: "Pastor Isiah Smalls",
    sermon_title: "Humbleness, Obedience, and Prayer Gets Results!",
    special_notes: "Earliest recorded service during COVID-19 pandemic",
    videos: [
    { type: "prayer", label: "Opening Prayer", local_filename: "20200329_Prayer_HD.mp4", description: "Join Pastor Isiah Smalls in a word of prayer" },
    { type: "sermon", label: "Humbleness, Obedience, and Prayer Gets Results!", local_filename: "20200329_Sermon_HD.mp4" },
  ]},
];

// Keep MOCK_SERMONS for backward compatibility (derived from real services)
export const MOCK_SERMONS: Sermon[] = WORSHIP_SERVICES
  .filter(ws => ws.videos.some(v => v.type === "sermon"))
  .slice(0, 6)
  .map((ws, i) => ({
    id: `s${i + 1}`,
    title: ws.sermon_title || ws.title,
    speaker: ws.speaker,
    date: ws.date,
    scripture: ws.scripture,
    video_url: ws.videos.find(v => v.type === "sermon")?.youtube_id
      ? `https://www.youtube.com/watch?v=${ws.videos.find(v => v.type === "sermon")?.youtube_id}`
      : undefined,
    topics: ws.is_special ? ["Special Service"] : ws.scripture ? [ws.scripture] : ["Worship"],
    created_at: ws.date,
  }));

// ─── Music Tracks (real worship music from church collection) ───────
export const MOCK_MUSIC_TRACKS: MusicTrack[] = [
  { id: "mt1", title: "Oh Lord I Want You to Help Me", artist: "Shirley Caesar", album: "Gospel Classics", audio_url: "/music/Shirley Caesar 1975 Oh Lord I Want You To Help Me.mp3", duration: 276, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt2", title: "Be Right", artist: "Worship Collection", audio_url: "/music/Be Right.mp3", duration: 490, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt3", title: "Bread of Heaven", artist: "Fred Hammond", audio_url: "/music/Bread of Heaven - Fred Hammond.mp3", duration: 302, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt4", title: "Come See About Me", artist: "Lee Williams & The Spiritual QC's", audio_url: "/music/Come See About Me - Lee Williams & The Spiritual QC's (192  kbps).mp3", duration: 300, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt5", title: "Don't Call The Roll", artist: "Worship Collection", audio_url: "/music/Don't Call The Roll (1).mp3", duration: 327, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt6", title: "Faithful Is Our God", artist: "Hezekiah Walker", audio_url: "/music/Faithful Is Our God - Hezekiah Walker.mp3", duration: 302, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt7", title: "All I Need", artist: "George Dickens & The Gospel Disciples", audio_url: "/music/George Dickens & The Gospel Disciples - All I Need.mp3", duration: 548, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt8", title: "Get Ready", artist: "Worship Collection", audio_url: "/music/Get Ready (1).mp3", duration: 321, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt9", title: "God's Got It", artist: "Trinity Inspirational Choir", audio_url: "/music/God's Got It - Trinity Inspirational Choir.mp3", duration: 281, track_type: "choir", created_at: "2024-01-01" },
  { id: "mt10", title: "God's Got A Blessing With My Name On It", artist: "Worship Collection", audio_url: "/music/Gods Got A Blessing With My Name On It.mp3", duration: 440, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt11", title: "Have Mercy", artist: "Soul Purposed", audio_url: "/music/Have Mercy - Soul_Purposed.mp3", duration: 228, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt12", title: "Hosanna", artist: "Worship Collection", audio_url: "/music/Hosanna.mp3", duration: 308, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt13", title: "I Call Jesus My Rock", artist: "Bishop Dixon", audio_url: "/music/I Call Jesus My Rock - Bishop Dixon.mp3", duration: 708, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt14", title: "I Call You Faithful", artist: "Donnie McClurkin", audio_url: "/music/I Call You Faithful - Donnie McClurkin.mp3", duration: 313, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt15", title: "I Came To Tell You", artist: "Trinity Inspirational Choir", audio_url: "/music/I Came To Tell You - Trinity Inspirational Choir.mp3", duration: 566, track_type: "choir", created_at: "2024-01-01" },
  { id: "mt16", title: "I Give Myself Away / Here I Am to Worship", artist: "William McDowell", audio_url: "/music/I give myself away and Here I am to worship w lyrics - William McDowell.mp3", duration: 548, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt17", title: "I Pray We'll Be Ready", artist: "Chicago Mass Choir", audio_url: "/music/I Pray We'll Be Ready - Chicago Mass Choir.mp3", duration: 730, track_type: "choir", created_at: "2024-01-01" },
  { id: "mt18", title: "I Won't Let You Fall", artist: "Helen Miller", audio_url: "/music/I Wont Let You Fall - Helen Miller.mp3", duration: 1067, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt19", title: "Jesus Be A Fence Around Me", artist: "Fred Hammond", audio_url: "/music/Jesus Be A Fence Around Me - FredHammond.mp3", duration: 715, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt20", title: "Jesus Is Alive And Well", artist: "Lee Williams & The Spiritual QC's", audio_url: "/music/Jesus Is Alive And Well - Lee Williams and Spiritual QCs.mp3", duration: 575, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt21", title: "Jesus Is Real", artist: "Worship Collection", audio_url: "/music/Jesus Is Real.mp3", duration: 324, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt22", title: "Let It Rise", artist: "William Murphy", audio_url: "/music/Let It Rise - William Murphy.mp3", duration: 351, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt23", title: "Prayer Room", artist: "Worship Collection", audio_url: "/music/Prayer Room.mp3", duration: 298, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt24", title: "Put A Praise On It", artist: "Tasha Cobbs", audio_url: "/music/Put A Praise On It - Tasha Cobbs.mp3", duration: 251, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt25", title: "Jesus", artist: "Shekinah Glory Ministry", audio_url: "/music/Shekinah Glory Ministry-Jesus.mp3", duration: 706, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt26", title: "For Your Glory", artist: "Tasha Cobbs", audio_url: "/music/Tasha Cobbs - For Your Glory.mp3", duration: 407, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt27", title: "Trust in You", artist: "Anthony Brown & Group TherAPy", audio_url: "/music/Trust in You - Anthony Brown & Group TherAPy Lyrics.mp3", duration: 285, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt28", title: "You Are My Strength", artist: "William Murphy", audio_url: "/music/You Are My Strength - William Murphy.mp3", duration: 371, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt29", title: "You Fight On", artist: "Worship Collection", audio_url: "/music/You Fight On.mp3", duration: 381, track_type: "gospel", created_at: "2024-01-01" },
  { id: "mt30", title: "You Reign", artist: "William Murphy", audio_url: "/music/You Reign - William Murphy.mp3", duration: 377, track_type: "worship", created_at: "2024-01-01" },
  { id: "mt31", title: "You Don't Know", artist: "Zacardi Cortez", audio_url: "/music/Zacardi Cortez- You Don't know.mp3", duration: 283, track_type: "gospel", created_at: "2024-01-01" },
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
    author: "Pastor Isiah Smalls", date: "2026-05-22", category: "faith", created_at: "2024-01-01",
  },
  {
    id: "dv2", title: "Joy in the Morning", scripture: "Psalm 30:5", scripture_text: "Weeping may endure for a night, but joy cometh in the morning.",
    body: "No matter what you faced yesterday — grief, disappointment, uncertainty — God has prepared a new morning for you. His mercies are new every day. Rise with expectation, knowing that joy is your portion through Christ Jesus.",
    author: "Pastor Isiah Smalls", date: "2026-05-21", category: "emotional_encouragement", created_at: "2024-01-01",
  },
  {
    id: "dv3", title: "Strength for the Weary", scripture: "Isaiah 40:31", scripture_text: "But those who hope in the Lord will renew their strength.",
    body: "Are you tired? Worn down by the demands of daily life? The Lord invites you to wait on Him — not passively, but with active trust. As you place your burdens at His feet, He will lift you up on wings like eagles.",
    author: "Deacon Edward Simmons", date: "2026-05-20", category: "spiritual_growth", created_at: "2024-01-01",
  },
  {
    id: "dv4", title: "Walking in Purpose", scripture: "Jeremiah 29:11", scripture_text: "For I know the plans I have for you, declares the Lord.",
    body: "God has a plan for your life — a plan born of love and filled with hope. Even when the path seems unclear, trust that the Creator of the universe is directing your steps. Walk boldly in the purpose He has given you.",
    author: "Pastor Isiah Smalls", date: "2026-05-19", category: "faith", created_at: "2024-01-01",
  },
  {
    id: "dv5", title: "The Power of Gratitude", scripture: "1 Thessalonians 5:18", scripture_text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    body: "Gratitude transforms our perspective. When we choose to give thanks — even in difficulty — we shift our focus from our problems to God's provision. Start your day with three things you are thankful for, and watch how God opens your heart.",
    author: "Sister Mae Robinson", date: "2026-05-18", category: "worship", created_at: "2024-01-01",
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
  { id: "b7", name: "Gwen's Arts & Crafts", owner_name: "Gwen Williams", description: "Handmade arts and crafts for all occasions. Custom creations, gifts, and decorations made with love and creativity.", category: "Arts & Crafts", phone: "(843) 694-3808", is_approved: true, created_at: "2024-01-01" },
  { id: "b8", name: "Smalls Landscaping & Land Clearing", owner_name: "Alex Smalls", description: "Professional landscaping and land clearing services. From yard maintenance to full property clearing, we handle it all.", category: "Home Services", phone: "(843) 263-6006", is_approved: true, created_at: "2024-01-01" },
  { id: "b9", name: "Sierra's Baked Goods", owner_name: "Sierra Green", description: "Delicious homemade baked goods for every occasion. Cakes, pies, cookies, and specialty desserts baked fresh to order.", category: "Food & Bakery", phone: "(843) 263-7531", is_approved: true, created_at: "2024-01-01" },
  { id: "b10", name: "Smalls Web Design", owner_name: "Dea. Aaron Smalls", description: "Professional website design and development services. Modern, responsive websites for businesses, churches, and organizations.", category: "Technology", phone: "(843) 263-0072", is_approved: true, created_at: "2024-01-01" },
];

// ─── Birthday Events (derived from profiles) ──────────────────────────
// Generates birthday events for the current year from member profiles
export function getBirthdayEvents(): Event[] {
  const currentYear = new Date().getFullYear();
  return MOCK_PROFILES
    .filter((p) => p.date_of_birth)
    .map((p) => {
      const dob = new Date(p.date_of_birth + "T12:00:00");
      const month = String(dob.getMonth() + 1).padStart(2, "0");
      const day = String(dob.getDate()).padStart(2, "0");
      return {
        id: `bday-${p.id}`,
        title: `🎂 Happy Birthday, ${p.first_name} ${p.last_name}!`,
        description: `Let's celebrate ${p.first_name}'s birthday! Send a birthday greeting to show the love of our church family.`,
        start_date: `${currentYear}-${month}-${day}T00:00:00`,
        end_date: `${currentYear}-${month}-${day}T23:59:00`,
        location: undefined,
        ministry_id: undefined,
        image_url: undefined,
        rsvp_enabled: false,
        is_published: true,
        created_at: "2024-01-01",
        _birthday_profile_id: p.id,
        _birthday_phone: p.phone,
        _birthday_email: p.email,
      } as Event & { _birthday_profile_id: string; _birthday_phone?: string; _birthday_email?: string };
    });
}

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
  { id: "mm3", ministry_id: "m1", profile_id: "p13", role: "member", status: "approved", requested_at: "2023-03-15", approved_at: "2023-03-16", approved_by: "p7", profile_name: "Gloria Campbell", ministry_name: "Usher Board" },
  // Choir members
  { id: "mm4", ministry_id: "m2", profile_id: "p8", role: "manager", status: "approved", requested_at: "2020-09-01", approved_at: "2020-09-01", profile_name: "James Singleton", ministry_name: "Choir" },
  { id: "mm5", ministry_id: "m2", profile_id: "p10", role: "member", status: "approved", requested_at: "2020-10-15", approved_at: "2020-10-16", approved_by: "p8", profile_name: "Mae Robinson", ministry_name: "Choir" },
  { id: "mm6", ministry_id: "m2", profile_id: "p13", role: "member", status: "approved", requested_at: "2023-04-01", approved_at: "2023-04-02", approved_by: "p8", profile_name: "Gloria Campbell", ministry_name: "Choir" },
  // Youth Ministry
  { id: "mm7", ministry_id: "m3", profile_id: "p9", role: "manager", status: "approved", requested_at: "2021-02-01", approved_at: "2021-02-01", profile_name: "Crystal Young", ministry_name: "Youth Ministry" },
  { id: "mm8", ministry_id: "m3", profile_id: "p13", role: "member", status: "approved", requested_at: "2023-06-01", approved_at: "2023-06-02", approved_by: "p9", profile_name: "Gloria Campbell", ministry_name: "Youth Ministry" },
  { id: "mm9", ministry_id: "m3", profile_id: "p7", role: "member", status: "approved", requested_at: "2022-01-15", approved_at: "2022-01-16", approved_by: "p9", profile_name: "Martha Washington", ministry_name: "Youth Ministry" },
  // Missionary Society
  { id: "mm10", ministry_id: "m4", profile_id: "p10", role: "manager", status: "approved", requested_at: "2019-07-01", approved_at: "2019-07-01", profile_name: "Mae Robinson", ministry_name: "Missionary Society" },
  { id: "mm11", ministry_id: "m4", profile_id: "p11", role: "member", status: "approved", requested_at: "2019-08-10", approved_at: "2019-08-12", approved_by: "p10", profile_name: "Patricia Grant", ministry_name: "Missionary Society" },
  { id: "mm12", ministry_id: "m4", profile_id: "p7", role: "member", status: "approved", requested_at: "2020-03-01", approved_at: "2020-03-02", approved_by: "p10", profile_name: "Martha Washington", ministry_name: "Missionary Society" },
  // Deaconess Board
  { id: "mm13", ministry_id: "m5", profile_id: "p11", role: "manager", status: "approved", requested_at: "2019-01-01", approved_at: "2019-01-01", profile_name: "Patricia Grant", ministry_name: "Deaconess Board" },
  { id: "mm14", ministry_id: "m5", profile_id: "p10", role: "member", status: "approved", requested_at: "2019-06-01", approved_at: "2019-06-02", approved_by: "p11", profile_name: "Mae Robinson", ministry_name: "Deaconess Board" },
  { id: "mm15", ministry_id: "m5", profile_id: "p7", role: "member", status: "approved", requested_at: "2022-04-15", approved_at: "2022-04-16", approved_by: "p11", profile_name: "Martha Washington", ministry_name: "Deaconess Board" },
  // Sunday School
  { id: "mm16", ministry_id: "m6", profile_id: "p12", role: "manager", status: "approved", requested_at: "2017-05-01", approved_at: "2017-05-01", profile_name: "Henry Baker", ministry_name: "Sunday School" },
  { id: "mm17", ministry_id: "m6", profile_id: "p14", role: "member", status: "approved", requested_at: "2018-01-10", approved_at: "2018-01-11", approved_by: "p12", profile_name: "William Harris", ministry_name: "Sunday School" },
  { id: "mm18", ministry_id: "m6", profile_id: "p9", role: "member", status: "approved", requested_at: "2021-09-01", approved_at: "2021-09-02", approved_by: "p12", profile_name: "Crystal Young", ministry_name: "Sunday School" },
];

// ─── Ministry Messages ─────────────────────────────────────────────
export const MOCK_MINISTRY_MESSAGES: MinistryMessage[] = [
  { id: "msg1", ministry_id: "m1", sent_by: "p7", subject: "Usher Board Meeting Reminder", body: "Reminder: Our monthly usher board meeting is this Saturday at 10 AM in the fellowship hall. Please make every effort to attend as we'll be discussing assignments for the anniversary celebration.", sent_at: "2026-05-20T14:00:00", sender_name: "Martha Washington", ministry_name: "Usher Board" },
  { id: "msg2", ministry_id: "m2", sent_by: "p8", subject: "New Songs for Anniversary", body: "Choir family, we have three new songs to learn for the anniversary celebration. Please come to Thursday rehearsal prepared. Sheet music will be distributed.", sent_at: "2026-05-19T18:00:00", sender_name: "James Singleton", ministry_name: "Choir" },
  { id: "msg3", ministry_id: "m3", sent_by: "p9", subject: "VBS Planning Update", body: "Youth Ministry team, VBS planning is in full swing! We need volunteers for crafts, snacks, and Bible study stations. Please let me know your availability.", sent_at: "2026-05-18T10:00:00", sender_name: "Crystal Young", ministry_name: "Youth Ministry" },
];

// ─── Memorials (Loved Ones Gone Home) ─────────────────────────────
export const MOCK_MEMORIALS: Memorial[] = [
  {
    id: "mem1",
    created_by: "p7",
    first_name: "Reverend James",
    last_name: "Washington Sr.",
    photo_url: undefined,
    date_of_birth: "1938-03-15",
    date_of_passing: "2019-11-22",
    obituary: "Reverend James Washington Sr. was a beloved pillar of Friendship Baptist Church for over fifty years. Born and raised in the Lowcountry, he dedicated his life to serving God and his community. He served as a deacon for twenty years before answering his call to preach, leading Bible study every Wednesday evening and mentoring countless young men in the faith. Known for his booming laugh and his tender heart, Rev. Washington touched the lives of everyone he met. He leaves behind a legacy of love, service, and unwavering devotion to the Lord.",
    scripture: "Psalm 116:15",
    scripture_text: "Precious in the sight of the Lord is the death of his faithful servants.",
    favorite_hymn: "Amazing Grace",
    church_roles: ["Deacon", "Bible Study Leader", "Trustee Board"],
    family_message: "Daddy, your love and wisdom guide us still. Until we meet again at the feet of Jesus.",
    is_published: true,
    photos: [
      { id: "mp1", memorial_id: "mem1", image_url: "/images/placeholder-memorial.jpg", caption: "Rev. Washington at the 2015 Church Anniversary", uploaded_by: "p7", created_at: "2019-12-01" },
      { id: "mp2", memorial_id: "mem1", image_url: "/images/placeholder-memorial.jpg", caption: "Leading Bible Study, 2018", uploaded_by: "p7", created_at: "2019-12-01" },
    ],
    comments: [
      { id: "mc1", memorial_id: "mem1", profile_id: "p10", author_name: "Mae Robinson", body: "Rev. Washington was like a father to so many of us. His prayers could move mountains. We miss you dearly.", created_at: "2019-12-05" },
      { id: "mc2", memorial_id: "mem1", profile_id: "p8", author_name: "James Singleton", body: "He always had a word of encouragement. The church feels different without his presence, but his spirit lives on.", created_at: "2019-12-08" },
    ],
    created_at: "2019-11-28",
    updated_at: "2019-12-08",
  },
  {
    id: "mem2",
    created_by: "p10",
    first_name: "Mother Eloise",
    last_name: "Robinson",
    photo_url: undefined,
    date_of_birth: "1932-07-04",
    date_of_passing: "2023-02-14",
    obituary: "Mother Eloise Robinson was the heartbeat of Friendship Baptist Church. For over sixty years, she graced the pews with her radiant smile and spirit-filled praise. As the oldest member of the Missionary Society, she organized countless outreach programs that fed the hungry and clothed the needy throughout Beaufort County. Her kitchen was always open, her prayers were always fervent, and her love was always unconditional. Mother Robinson raised seven children, all of whom credit her faith as the foundation of their lives.",
    scripture: "Proverbs 31:28-29",
    scripture_text: "Her children arise and call her blessed; her husband also, and he praises her: Many women do noble things, but you surpass them all.",
    favorite_hymn: "His Eye Is on the Sparrow",
    church_roles: ["Missionary Society", "Kitchen Ministry", "Mother Board"],
    family_message: "Mama, you showed us what it means to live for Christ. Your hands fed thousands and your prayers covered us all. Rest well, Queen.",
    is_published: true,
    photos: [
      { id: "mp3", memorial_id: "mem2", image_url: "/images/placeholder-memorial.jpg", caption: "Mother Robinson at the Annual Fish Fry, 2021", uploaded_by: "p10", created_at: "2023-03-01" },
    ],
    comments: [
      { id: "mc3", memorial_id: "mem2", profile_id: "p7", author_name: "Martha Washington", body: "Mother Robinson taught me how to pray. She would grab your hands and you could feel the Holy Spirit moving. What a woman of God.", created_at: "2023-02-20" },
      { id: "mc4", memorial_id: "mem2", profile_id: "p9", author_name: "Crystal Young", body: "She always made sure every child had a plate. The love she showed our youth will never be forgotten.", created_at: "2023-02-22" },
      { id: "mc5", memorial_id: "mem2", profile_id: "p12", author_name: "Henry Baker", body: "A true servant of the Lord. Her legacy of faith and service will inspire generations to come.", created_at: "2023-03-01" },
    ],
    created_at: "2023-02-18",
    updated_at: "2023-03-01",
  },
  {
    id: "mem3",
    created_by: "p9",
    first_name: "Deacon Willie",
    last_name: "Grant",
    photo_url: undefined,
    date_of_birth: "1945-09-30",
    date_of_passing: "2021-08-17",
    obituary: "Deacon Willie Grant served Friendship Baptist Church with quiet strength and deep faithfulness. Ordained as a deacon in 1985, he spent nearly four decades visiting the sick, comforting the bereaved, and being a steady hand of support for every pastor who led the congregation. A retired Marine and proud veteran, Deacon Grant brought the same discipline and dedication to his church service that he brought to his country. He was a man of few words but mighty actions.",
    scripture: "2 Timothy 4:7",
    scripture_text: "I have fought the good fight, I have finished the race, I have kept the faith.",
    favorite_hymn: "Blessed Assurance",
    church_roles: ["Deacon Board", "Usher Board", "Men's Ministry"],
    family_message: "Dad served his Lord, his country, and his family with everything he had. We are proud to be his children.",
    is_published: true,
    photos: [],
    comments: [
      { id: "mc6", memorial_id: "mem3", profile_id: "p7", author_name: "Martha Washington", body: "Deacon Grant was always the first to arrive and the last to leave. His dedication was unmatched.", created_at: "2021-08-25" },
    ],
    created_at: "2021-08-20",
    updated_at: "2021-08-25",
  },
  {
    id: "mem4",
    created_by: "p8",
    first_name: "Sister Carolyn",
    last_name: "Singleton",
    photo_url: undefined,
    date_of_birth: "1950-12-25",
    date_of_passing: "2024-06-03",
    obituary: "Sister Carolyn Singleton blessed Friendship Baptist Church with her golden voice for over thirty years. As a founding member of the Gospel Choir, her soprano could lift the entire congregation to their feet. Born on Christmas Day, she was a gift to everyone who knew her. Beyond her musical talents, Sister Singleton served faithfully in the Deaconess Board and was known throughout the community for her ministry of encouragement — never letting a birthday, anniversary, or achievement pass without a handwritten card and a phone call.",
    scripture: "Psalm 95:1",
    scripture_text: "Come, let us sing for joy to the Lord; let us shout aloud to the Rock of our salvation.",
    favorite_hymn: "Total Praise",
    church_roles: ["Gospel Choir", "Deaconess Board", "Hospitality Ministry"],
    family_message: "Mom sang her way into heaven. We know she’s leading the angel choir now. We love you forever.",
    is_published: true,
    photos: [
      { id: "mp4", memorial_id: "mem4", image_url: "/images/placeholder-memorial.jpg", caption: "Sister Singleton leading the choir, Easter 2022", uploaded_by: "p8", created_at: "2024-06-10" },
      { id: "mp5", memorial_id: "mem4", image_url: "/images/placeholder-memorial.jpg", caption: "Christmas Cantata, 2019", uploaded_by: "p8", created_at: "2024-06-10" },
      { id: "mp6", memorial_id: "mem4", image_url: "/images/placeholder-memorial.jpg", caption: "With the Deaconess Board, Church Anniversary 2023", uploaded_by: "p8", created_at: "2024-06-10" },
    ],
    comments: [
      { id: "mc7", memorial_id: "mem4", profile_id: "p10", author_name: "Mae Robinson", body: "When Carolyn sang, you could feel heaven open up. The choir will never sound the same without her.", created_at: "2024-06-08" },
      { id: "mc8", memorial_id: "mem4", profile_id: "p13", author_name: "Gloria Campbell", body: "She sent me a card for every single birthday since I was born. That kind of love is rare. Rest in peace, Sister Singleton.", created_at: "2024-06-12" },
    ],
    created_at: "2024-06-07",
    updated_at: "2024-06-12",
  },
];
