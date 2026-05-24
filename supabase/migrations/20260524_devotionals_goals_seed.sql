-- ============================================================================
-- Migration: Devotionals Seed (250), Spiritual Goals Schema Fix + Seed,
--            SMS Log Table
--
-- Date: 2026-05-24
-- Description:
--   1. Fix spiritual_goals table schema (rename old columns, add missing ones)
--   2. Seed 20 premade spiritual goals for every existing member
--   3. Add category column to devotionals and seed 250 devotionals
--   4. Create sms_log table for Twilio SMS history
--
-- Idempotent: uses IF NOT EXISTS, DO blocks, WHERE NOT EXISTS guards.
-- ============================================================================


-- ============================================================================
-- 1. FIX SPIRITUAL_GOALS TABLE SCHEMA
-- ============================================================================

-- Create table if it doesn't exist at all (with correct schema)
CREATE TABLE IF NOT EXISTS spiritual_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bible_reading', 'prayer', 'service_hours', 'giving', 'fasting', 'study')),
  title TEXT NOT NULL DEFAULT '',
  target INTEGER NOT NULL DEFAULT 1,
  current INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Handle column renames if table already existed with old schema
DO $$ BEGIN
  -- Rename current_value -> current
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'current_value'
  ) THEN
    ALTER TABLE spiritual_goals RENAME COLUMN current_value TO current;
  END IF;

  -- Rename description -> title
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'description'
  ) THEN
    ALTER TABLE spiritual_goals RENAME COLUMN description TO title;
  END IF;

  -- Rename progress -> current (from 00001 schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'progress'
  ) THEN
    ALTER TABLE spiritual_goals RENAME COLUMN progress TO current;
  END IF;

  -- Rename goal_type -> type (from 00001 schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'goal_type'
  ) THEN
    ALTER TABLE spiritual_goals RENAME COLUMN goal_type TO type;
  END IF;

  -- Add title if still missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'title'
  ) THEN
    ALTER TABLE spiritual_goals ADD COLUMN title TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add current if still missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'current'
  ) THEN
    ALTER TABLE spiritual_goals ADD COLUMN current INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- Add is_completed if still missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'is_completed'
  ) THEN
    ALTER TABLE spiritual_goals ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add period if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'period'
  ) THEN
    ALTER TABLE spiritual_goals ADD COLUMN period TEXT NOT NULL DEFAULT 'monthly';
  END IF;

  -- Add target if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'spiritual_goals' AND column_name = 'target'
  ) THEN
    ALTER TABLE spiritual_goals ADD COLUMN target INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE spiritual_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own goals" ON spiritual_goals;
  DROP POLICY IF EXISTS "Users can create own goals" ON spiritual_goals;
  DROP POLICY IF EXISTS "Users can update own goals" ON spiritual_goals;
  DROP POLICY IF EXISTS "Users can delete own goals" ON spiritual_goals;
  DROP POLICY IF EXISTS "Users can manage own goals" ON spiritual_goals;
  DROP POLICY IF EXISTS "Admins can read all goals" ON spiritual_goals;
END $$;

-- Members can read their own goals
CREATE POLICY "Users can read own goals"
  ON spiritual_goals FOR SELECT
  USING (auth.uid() = profile_id);

-- Members can insert their own goals
CREATE POLICY "Users can create own goals"
  ON spiritual_goals FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Members can update their own goals
CREATE POLICY "Users can update own goals"
  ON spiritual_goals FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Members can delete their own goals
CREATE POLICY "Users can delete own goals"
  ON spiritual_goals FOR DELETE
  USING (auth.uid() = profile_id);

-- Admins can read all goals
CREATE POLICY "Admins can read all goals"
  ON spiritual_goals FOR SELECT
  USING (is_admin());


-- ============================================================================
-- 2. SEED 20 PREMADE SPIRITUAL GOALS FOR EVERY MEMBER
-- ============================================================================

INSERT INTO spiritual_goals (profile_id, type, title, target, current, period, is_completed)
SELECT p.id, g.type::goal_type, g.title, g.target, 0, g.period::goal_period, false
FROM profiles p
CROSS JOIN (VALUES
  ('bible_reading', 'Read the Bible Daily',          30,  'monthly'),
  ('bible_reading', 'Complete the Book of Psalms',   150, 'yearly'),
  ('bible_reading', 'Read a Proverb Each Day',       31,  'monthly'),
  ('bible_reading', 'Study the Gospels',             89,  'yearly'),
  ('prayer',        'Morning Prayer',                 7,  'weekly'),
  ('prayer',        'Pray for Church Leadership',     4,  'monthly'),
  ('prayer',        'Prayer Journal Entries',        30,  'monthly'),
  ('prayer',        'Intercessory Prayer for Others', 5,  'weekly'),
  ('service_hours', 'Volunteer at Church',            4,  'monthly'),
  ('service_hours', 'Community Outreach',            10,  'yearly'),
  ('service_hours', 'Help Elderly Members',           2,  'monthly'),
  ('giving',        'Tithe Faithfully',               4,  'monthly'),
  ('giving',        'Support Building Fund',         12,  'yearly'),
  ('giving',        'Give to Missions',               4,  'yearly'),
  ('fasting',       'Weekly Fast',                    4,  'monthly'),
  ('fasting',       'Three-Day Fast',                 4,  'yearly'),
  ('fasting',       'Daniel Fast',                    1,  'yearly'),
  ('study',         'Attend Bible Study',             4,  'monthly'),
  ('study',         'Complete a Devotional Book',     4,  'yearly'),
  ('study',         'Memorize Scripture Verses',     12,  'yearly')
) AS g(type, title, target, period)
WHERE NOT EXISTS (
  SELECT 1 FROM spiritual_goals sg
  WHERE sg.profile_id = p.id AND sg.title = g.title
);


-- ============================================================================
-- 3. ADD CATEGORY COLUMN TO DEVOTIONALS + SEED 250 DEVOTIONALS
-- ============================================================================

ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'spiritual_growth';
ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS scripture_text TEXT NOT NULL DEFAULT '';
ALTER TABLE devotionals ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

-- Only seed if we have fewer than 50 devotionals (avoid duplicating on re-run)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM devotionals) < 50 THEN

    -- ========================================================================
    -- SPIRITUAL GROWTH (50 devotionals)
    -- ========================================================================

    INSERT INTO devotionals (title, scripture, scripture_text, body, author, date, category, is_published) VALUES

    -- 1
    ('Growing in Grace',
     'II Peter 3:18',
     'But grow in the grace and knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.',
     'Spiritual growth is not an overnight process but a lifelong journey. Each day presents a new opportunity to deepen your relationship with Christ. As you seek Him through prayer and His Word, you will find that His grace is sufficient for every season of your life.',
     'Pastor Isiah Smalls',
     '2025-01-01',
     'spiritual_growth',
     true),

    -- 2
    ('Bearing Fruit for the Kingdom',
     'John 15:5',
     'I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.',
     'When we remain connected to Christ, fruit flows naturally from our lives. Love, joy, peace, and patience are not qualities we manufacture on our own; they are the result of abiding in Him. Stay rooted in the vine and watch what God produces through you.',
     'FBC Devotional Team',
     '2025-01-10',
     'spiritual_growth',
     true),

    -- 3
    ('Transformed by Renewal',
     'Romans 12:2',
     'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
     'The world constantly tries to shape us into its mold. God calls us to a different kind of transformation, one that begins in the mind and works its way outward. Let the Word of God renew your thinking today, and you will discover His perfect will for your life.',
     'FBC Bible Study Ministry',
     '2025-01-20',
     'spiritual_growth',
     true),

    -- 4
    ('Pressing Toward the Mark',
     'Philippians 3:14',
     'I press toward the mark for the prize of the high calling of God in Christ Jesus.',
     'Paul understood that the Christian life requires determination and focus. We must press forward even when the journey feels difficult. The prize that awaits us is worth every sacrifice we make along the way. Keep your eyes fixed on the calling God has placed on your life.',
     'Pastor Isiah Smalls',
     '2025-01-30',
     'spiritual_growth',
     true),

    -- 5
    ('Putting On the New Self',
     'Ephesians 4:24',
     'And that ye put on the new man, which after God is created in righteousness and true holiness.',
     'When Christ saves us, He gives us a brand-new identity. We are no longer defined by our past failures or sinful habits. Each morning is an invitation to walk in the righteousness and holiness that God has already provided for us through His Son.',
     'FBC Devotional Team',
     '2025-02-08',
     'spiritual_growth',
     true),

    -- 6
    ('The Process of Sanctification',
     'I Thessalonians 5:23',
     'And the very God of peace sanctify you wholly; and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ.',
     'Sanctification is the ongoing work of God setting us apart for His purposes. It touches every area of our lives: spirit, soul, and body. Surrender each part of yourself to Him and trust that He who began this work will be faithful to complete it.',
     'FBC Prayer Ministry',
     '2025-02-18',
     'spiritual_growth',
     true),

    -- 7
    ('Discipleship and Following Jesus',
     'Luke 9:23',
     'And he said to them all, If any man will come after me, let him deny himself, and take up his cross daily, and follow me.',
     'True discipleship costs something. It requires us to lay down our own desires and pick up our cross every single day. But in this surrender we find the most abundant life imaginable, because following Jesus leads to places we could never reach on our own.',
     'Pastor Isiah Smalls',
     '2025-02-28',
     'spiritual_growth',
     true),

    -- 8
    ('Rooted and Built Up',
     'Colossians 2:7',
     'Rooted and built up in him, and stablished in the faith, as ye have been taught, abounding therein with thanksgiving.',
     'A tree with deep roots can withstand any storm. When we are rooted in Christ and established in the faith, the winds of life cannot uproot us. Let your roots grow deeper each day through study, prayer, and fellowship with other believers.',
     'FBC Bible Study Ministry',
     '2025-03-10',
     'spiritual_growth',
     true),

    -- 9
    ('Walking in the Spirit',
     'Galatians 5:16',
     'This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh.',
     'Walking in the Spirit is a daily choice to yield to God rather than our fleshly desires. The Spirit leads us into paths of righteousness and peace. When we follow His leading, we find victory over temptation and the strength to live lives that honor God.',
     'FBC Devotional Team',
     '2025-03-20',
     'spiritual_growth',
     true),

    -- 10
    ('Being a Living Sacrifice',
     'Romans 12:1',
     'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.',
     'God does not ask us to merely attend church; He asks for our entire lives. Presenting ourselves as living sacrifices means that every decision, every action, and every word is offered to Him. This is not burdensome but a reasonable response to His incredible mercy toward us.',
     'Pastor Isiah Smalls',
     '2025-03-30',
     'spiritual_growth',
     true),

    -- 11
    ('The Refining Fire',
     'Malachi 3:3',
     'And he shall sit as a refiner and purifier of silver: and he shall purify the sons of Levi, and purge them as gold and silver, that they may offer unto the LORD an offering in righteousness.',
     'God sometimes uses the fire of trials to purify our faith. Just as a silversmith removes impurities through intense heat, the Lord refines our character through difficulties. Trust the process; He is making you into something beautiful for His glory.',
     'FBC Prayer Ministry',
     '2025-04-09',
     'spiritual_growth',
     true),

    -- 12
    ('Maturing in Christ',
     'Hebrews 6:1',
     'Therefore leaving the principles of the doctrine of Christ, let us go on unto perfection; not laying again the foundation of repentance from dead works, and of faith toward God.',
     'God calls us beyond the basics of faith into deeper maturity. We are not meant to stay as spiritual infants forever. Press into the deeper things of God: His character, His purposes, and His mission for your life.',
     'FBC Bible Study Ministry',
     '2025-04-19',
     'spiritual_growth',
     true),

    -- 13
    ('New Creature in Christ',
     'II Corinthians 5:17',
     'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
     'In Christ you are not a repaired version of your old self. You are a completely new creation. The old patterns, the old guilt, and the old identity have been replaced by something fresh and alive. Walk today in the newness that God has given you.',
     'FBC Devotional Team',
     '2025-04-29',
     'spiritual_growth',
     true),

    -- 14
    ('The Mind of Christ',
     'I Corinthians 2:16',
     'For who hath known the mind of the Lord, that he may instruct him? But we have the mind of Christ.',
     'As believers, we have been given access to the very mind of Christ through the Holy Spirit. This means we can think with wisdom, discern with clarity, and make decisions that align with God''s will. Ask the Spirit to guide your thoughts today.',
     'Pastor Isiah Smalls',
     '2025-05-09',
     'spiritual_growth',
     true),

    -- 15
    ('Hunger and Thirst for Righteousness',
     'Matthew 5:6',
     'Blessed are they which do hunger and thirst after righteousness: for they shall be filled.',
     'Jesus promises that those who deeply desire righteousness will be satisfied. When we crave God''s presence more than anything this world offers, we position ourselves to receive His fullness. Let your hunger for Him grow stronger each day.',
     'FBC Devotional Team',
     '2025-05-19',
     'spiritual_growth',
     true),

    -- 16
    ('Pruning for Greater Fruitfulness',
     'John 15:2',
     'Every branch in me that beareth not fruit he taketh away: and every branch that beareth fruit, he purgeth it, that it may bring forth more fruit.',
     'God prunes what He loves. When He removes things from our lives, it is not punishment but preparation for greater fruitfulness. Do not resist the gardener''s hand; trust that He knows exactly what needs to be cut away so you can flourish.',
     'FBC Prayer Ministry',
     '2025-05-29',
     'spiritual_growth',
     true),

    -- 17
    ('The Armor of God',
     'Ephesians 6:11',
     'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.',
     'God has not left us defenseless. The armor He provides covers every area where the enemy might attack. Put on truth, righteousness, the gospel of peace, faith, salvation, and the Word of God daily, and you will stand firm against every scheme of the enemy.',
     'FBC Bible Study Ministry',
     '2025-06-08',
     'spiritual_growth',
     true),

    -- 18
    ('Sowing and Reaping',
     'Galatians 6:9',
     'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
     'Every act of obedience is a seed planted in the soil of God''s kingdom. The harvest may not come immediately, but it will come in due season. Do not grow tired of doing what is right; your faithful sowing will produce an abundant harvest.',
     'Pastor Isiah Smalls',
     '2025-06-18',
     'spiritual_growth',
     true),

    -- 19
    ('Drawing Near to God',
     'James 4:8',
     'Draw nigh to God, and he will draw nigh to you. Cleanse your hands, ye sinners; and purify your hearts, ye double minded.',
     'Intimacy with God is a two-way relationship. When we take one step toward Him, He takes a step toward us. He never hides from those who seek Him with a pure heart. Draw near to Him today and experience His comforting, guiding presence.',
     'FBC Devotional Team',
     '2025-06-28',
     'spiritual_growth',
     true),

    -- 20
    ('Spiritual Disciplines',
     'I Timothy 4:7',
     'But refuse profane and old wives'' fables, and exercise thyself rather unto godliness.',
     'Just as athletes train their bodies, we must train our spirits. Fasting, prayer, solitude, study, and worship are disciplines that strengthen our spiritual muscles. Make time for these practices and watch your faith grow deeper and stronger.',
     'FBC Bible Study Ministry',
     '2025-07-08',
     'spiritual_growth',
     true),

    -- 21
    ('Obedience Over Sacrifice',
     'I Samuel 15:22',
     'And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.',
     'God values our obedience above grand gestures. Sometimes the simplest act of following His instruction carries more weight than elaborate offerings. Listen carefully for His voice today and respond with simple, wholehearted obedience.',
     'Pastor Isiah Smalls',
     '2025-07-18',
     'spiritual_growth',
     true),

    -- 22
    ('The Potter and the Clay',
     'Isaiah 64:8',
     'But now, O LORD, thou art our father; we are the clay, and thou our potter; and we all are the work of thy hand.',
     'God is the master craftsman shaping our lives with purpose and intention. Like clay on the potter''s wheel, we must remain pliable in His hands. Even when the shaping feels uncomfortable, trust that He is creating something beautiful out of your life.',
     'FBC Prayer Ministry',
     '2025-07-28',
     'spiritual_growth',
     true),

    -- 23
    ('Light of the World',
     'Matthew 5:14',
     'Ye are the light of the world. A city that is set on an hill cannot be hid.',
     'Jesus calls us the light of the world. Our lives are meant to shine in dark places, revealing God''s goodness and love to those around us. Do not hide your light under fear or self-doubt; let it shine brightly so that others may see your good works and glorify your Father in heaven.',
     'FBC Devotional Team',
     '2025-08-07',
     'spiritual_growth',
     true),

    -- 24
    ('Counting the Cost',
     'Luke 14:28',
     'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
     'Following Jesus requires counting the cost. But when we weigh what we give up against what we gain, the exchange is always in our favor. The treasures of the kingdom far surpass anything this world could ever offer us.',
     'FBC Bible Study Ministry',
     '2025-08-17',
     'spiritual_growth',
     true),

    -- 25
    ('Enduring to the End',
     'Matthew 24:13',
     'But he that shall endure unto the end, the same shall be saved.',
     'The Christian life is not a sprint; it is a marathon. There will be seasons of difficulty and doubt, but those who persevere will receive the crown of life. Hold fast to your faith and do not let go, for the finish line is closer than you think.',
     'Pastor Isiah Smalls',
     '2025-08-27',
     'spiritual_growth',
     true),

    -- 26
    ('Abiding in the Word',
     'John 8:31',
     'Then said Jesus to those Jews which believed on him, If ye continue in my word, then are ye my disciples indeed.',
     'Being a disciple means more than hearing the Word; it means continuing in it day after day. Let Scripture dwell richly in your heart so that it shapes your decisions, guides your actions, and transforms your character from the inside out.',
     'FBC Devotional Team',
     '2025-09-06',
     'spiritual_growth',
     true),

    -- 27
    ('Running the Race',
     'Hebrews 12:1',
     'Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us.',
     'We are surrounded by a great cloud of witnesses who ran the race before us. Their faithfulness encourages us to shed every weight and sin that slows us down. Run your race with patience and endurance, knowing that the prize is eternal.',
     'FBC Prayer Ministry',
     '2025-09-16',
     'spiritual_growth',
     true),

    -- 28
    ('Salt of the Earth',
     'Matthew 5:13',
     'Ye are the salt of the earth: but if the salt have lost his savour, wherewith shall it be salted? it is thenceforth good for nothing, but to be cast out, and to be trodden under foot of men.',
     'As salt preserves and adds flavor, believers are called to preserve godly values and bring the flavor of Christ to every environment. Do not lose your spiritual distinctiveness; let your faith season every conversation and interaction today.',
     'FBC Bible Study Ministry',
     '2025-09-26',
     'spiritual_growth',
     true),

    -- 29
    ('Growing Through Trials',
     'James 1:3-4',
     'Knowing this, that the trying of your faith worketh patience. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.',
     'Trials are not wasted in God''s economy. Every difficulty tests our faith and produces patience, which leads to spiritual completeness. When you face hardship, remember that God is using it to develop something invaluable within you.',
     'Pastor Isiah Smalls',
     '2025-10-06',
     'spiritual_growth',
     true),

    -- 30
    ('Delight in the Law of the Lord',
     'Psalm 1:2',
     'But his delight is in the law of the LORD; and in his law doth he meditate day and night.',
     'The blessed person is the one who finds joy in meditating on God''s Word. When we delight in Scripture, we are like trees planted by rivers of water, bearing fruit in every season. Make the Word your daily delight and watch your life flourish.',
     'FBC Devotional Team',
     '2025-10-16',
     'spiritual_growth',
     true),

    -- 31
    ('The Narrow Way',
     'Matthew 7:14',
     'Because strait is the gate, and narrow is the way, which leadeth unto life, and few there be that find it.',
     'The path that leads to life is not the easy or popular one. It requires intentional choices and daily commitment. But the narrow way is the one Jesus walks, and following Him on it brings true and lasting life.',
     'FBC Prayer Ministry',
     '2025-10-26',
     'spiritual_growth',
     true),

    -- 32
    ('Storing Treasures in Heaven',
     'Matthew 6:20',
     'But lay up for yourselves treasures in heaven, where neither moth nor rust doth corrupt, and where thieves do not break through nor steal.',
     'Earthly possessions are temporary, but heavenly investments last forever. Every act of generosity, every prayer, and every moment of service is a deposit in an eternal account. Invest your time, energy, and resources in things that will endure.',
     'FBC Bible Study Ministry',
     '2025-11-05',
     'spiritual_growth',
     true),

    -- 33
    ('Walking Worthy',
     'Ephesians 4:1',
     'I therefore, the prisoner of the Lord, beseech you that ye walk worthy of the vocation wherewith ye are called.',
     'God has called us to a high and holy calling. Walking worthy of that calling means living with integrity, humility, and love in every area of our lives. Let your daily walk reflect the greatness of the One who called you.',
     'Pastor Isiah Smalls',
     '2025-11-15',
     'spiritual_growth',
     true),

    -- 34
    ('A Vessel for Honor',
     'II Timothy 2:21',
     'If a man therefore purge himself from these, he shall be a vessel unto honour, sanctified, and meet for the master''s use, and prepared unto every good work.',
     'God desires to use every one of us for His purposes. When we purify ourselves from ungodly influences, we become vessels fit for the Master''s use. Prepare your heart today so that God can use you in ways you never imagined.',
     'FBC Devotional Team',
     '2025-11-25',
     'spiritual_growth',
     true),

    -- 35
    ('Planted by Living Water',
     'Jeremiah 17:8',
     'For he shall be as a tree planted by the waters, and that spreadeth out her roots by the river, and shall not see when heat cometh, but her leaf shall be green; and shall not be careful in the year of drought, neither shall cease from yielding fruit.',
     'When our roots are deep in God''s Word and His presence, we can withstand any drought. The heat of life''s challenges cannot wither those who draw their sustenance from the living water of Christ. Stay planted and you will continue to bear fruit.',
     'FBC Prayer Ministry',
     '2025-12-05',
     'spiritual_growth',
     true),

    -- 36
    ('The Fruit of the Spirit',
     'Galatians 5:22-23',
     'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance: against such there is no law.',
     'The fruit of the Spirit is the evidence of Christ living in us. These qualities do not come from self-effort but from yielding to the Holy Spirit''s work in our hearts. Allow Him to cultivate love, joy, peace, and every other fruit in your daily life.',
     'FBC Bible Study Ministry',
     '2025-12-15',
     'spiritual_growth',
     true),

    -- 37
    ('Faithful in Little Things',
     'Luke 16:10',
     'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.',
     'Faithfulness in small matters reveals the condition of our hearts. God tests us in the little things before entrusting us with greater responsibilities. Be diligent in every task, no matter how small, and watch God open doors to greater opportunities.',
     'Pastor Isiah Smalls',
     '2025-12-25',
     'spiritual_growth',
     true),

    -- 38
    ('The Fear of the Lord',
     'Proverbs 9:10',
     'The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.',
     'Holy reverence for God is the starting point of all true wisdom. When we honor Him above all else and stand in awe of His majesty, we gain access to divine understanding that the world cannot provide. Let the fear of the Lord guide your decisions today.',
     'FBC Devotional Team',
     '2026-01-04',
     'spiritual_growth',
     true),

    -- 39
    ('Seeking First the Kingdom',
     'Matthew 6:33',
     'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
     'When we prioritize God''s kingdom above our own ambitions and worries, He promises to take care of everything else. Seeking Him first does not mean neglecting responsibilities; it means trusting that He orders our steps and provides for every need.',
     'FBC Prayer Ministry',
     '2026-01-14',
     'spiritual_growth',
     true),

    -- 40
    ('Dying to Self',
     'Galatians 2:20',
     'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.',
     'Dying to self is one of the hardest yet most rewarding aspects of the Christian walk. When we surrender our will, Christ''s life flows through us with power and purpose. Let go of what holds you back and let Him live through you today.',
     'Pastor Isiah Smalls',
     '2026-01-24',
     'spiritual_growth',
     true),

    -- 41
    ('A Heart After God',
     'Psalm 63:1',
     'O God, thou art my God; early will I seek thee: my soul thirsteth for thee, my flesh longeth for thee in a dry and thirsty land, where no water is.',
     'David''s heart longed for God more than anything the world could offer. This kind of passionate pursuit of God''s presence is what sets extraordinary believers apart from the ordinary. Let your heart cry out for Him today with genuine longing.',
     'FBC Devotional Team',
     '2026-02-03',
     'spiritual_growth',
     true),

    -- 42
    ('Iron Sharpens Iron',
     'Proverbs 27:17',
     'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
     'We were never meant to walk this journey alone. God places people in our lives who challenge us, encourage us, and sharpen our faith. Invest in godly friendships and allow others to speak truth into your life.',
     'FBC Bible Study Ministry',
     '2026-02-13',
     'spiritual_growth',
     true),

    -- 43
    ('The Good Shepherd',
     'John 10:11',
     'I am the good shepherd: the good shepherd giveth his life for the sheep.',
     'Jesus is not a distant God watching from afar. He is the Good Shepherd who knows us by name, leads us beside still waters, and laid down His life for our protection. Rest in His care today, knowing that you are deeply loved and carefully tended.',
     'FBC Prayer Ministry',
     '2026-02-23',
     'spiritual_growth',
     true),

    -- 44
    ('Hidden in Christ',
     'Colossians 3:3',
     'For ye are dead, and your life is hid with Christ in God.',
     'Your identity is not found in your achievements, failures, or what others think of you. Your true life is hidden securely in Christ. From this place of security, you can face any challenge without fear because nothing can separate you from His love.',
     'Pastor Isiah Smalls',
     '2026-03-05',
     'spiritual_growth',
     true),

    -- 45
    ('The Word Is a Lamp',
     'Psalm 119:105',
     'Thy word is a lamp unto my feet, and a light unto my path.',
     'In a world full of confusion and competing voices, God''s Word provides clear direction. It lights the path one step at a time, giving us exactly the guidance we need for each moment. Trust His Word to lead you through every dark and uncertain season.',
     'FBC Devotional Team',
     '2026-03-15',
     'spiritual_growth',
     true),

    -- 46
    ('Complete in Him',
     'Colossians 2:10',
     'And ye are complete in him, which is the head of all principality and power.',
     'In Christ, we lack nothing essential for spiritual life. We do not need to add the world''s philosophies or human traditions to what God has already provided. You are complete in Him, fully equipped for every good work He has prepared for you.',
     'FBC Bible Study Ministry',
     '2026-03-25',
     'spiritual_growth',
     true),

    -- 47
    ('Watchful and Prayerful',
     'I Peter 4:7',
     'But the end of all things is at hand: be ye therefore sober, and watch unto prayer.',
     'We live in urgent times that demand spiritual alertness. Being watchful means paying attention to the movement of God in our lives and in the world. Combine watchfulness with prayer and you will be ready for whatever the Lord brings your way.',
     'FBC Prayer Ministry',
     '2026-04-04',
     'spiritual_growth',
     true),

    -- 48
    ('God''s Workmanship',
     'Ephesians 2:10',
     'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
     'You are God''s masterpiece, carefully designed and crafted for a specific purpose. The good works He has prepared for you were planned before you were born. Walk confidently in the knowledge that your life has divine purpose and meaning.',
     'Pastor Isiah Smalls',
     '2026-04-14',
     'spiritual_growth',
     true),

    -- 49
    ('Building on the Rock',
     'Matthew 7:24',
     'Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock.',
     'Hearing the Word is important, but doing what it says is what builds an unshakeable foundation. When the storms of life come, those who have built their lives on obedience to Christ will stand firm while everything else crumbles around them.',
     'FBC Devotional Team',
     '2026-04-24',
     'spiritual_growth',
     true),

    -- 50
    ('The Promise of Completion',
     'Philippians 1:6',
     'Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.',
     'God never starts a work He does not intend to finish. Whatever He is doing in your life right now, He will bring it to completion. Rest in this promise and trust that the Author of your faith is also its Finisher.',
     'FBC Bible Study Ministry',
     '2026-05-04',
     'spiritual_growth',
     true);

    -- ========================================================================
    -- EMOTIONAL ENCOURAGEMENT (50 devotionals)
    -- ========================================================================

    INSERT INTO devotionals (title, scripture, scripture_text, body, author, date, category, is_published) VALUES

    -- 1
    ('Comfort in Every Trouble',
     'II Corinthians 1:3-4',
     'Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort; Who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.',
     'God does not waste our pain. The comfort He gives us in our darkest moments becomes a gift we can share with others who are hurting. Your trial is not just about you; it is preparing you to be a vessel of healing and hope for someone else.',
     'Pastor Isiah Smalls',
     '2025-01-05',
     'emotional_encouragement',
     true),

    -- 2
    ('Peace That Surpasses Understanding',
     'Philippians 4:7',
     'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
     'God''s peace does not require perfect circumstances. It is a supernatural calm that guards our hearts and minds even when nothing makes sense. When anxiety knocks at the door of your heart, let the peace of God answer.',
     'FBC Prayer Ministry',
     '2025-01-15',
     'emotional_encouragement',
     true),

    -- 3
    ('Do Not Be Anxious',
     'Philippians 4:6',
     'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
     'Anxiety tries to convince us that we must carry every burden alone. But God invites us to bring every concern to Him through prayer, with thankfulness in our hearts. Release your worries into His capable hands and receive His peace in return.',
     'FBC Devotional Team',
     '2025-01-25',
     'emotional_encouragement',
     true),

    -- 4
    ('Joy Comes in the Morning',
     'Psalm 30:5',
     'For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.',
     'The darkest nights do not last forever. God promises that joy is on the way, even when tears fill our eyes tonight. Hold on through the night season, because the morning light of God''s favor is about to break through.',
     'Pastor Isiah Smalls',
     '2025-02-04',
     'emotional_encouragement',
     true),

    -- 5
    ('Healing the Brokenhearted',
     'Psalm 147:3',
     'He healeth the broken in heart, and bindeth up their wounds.',
     'God specializes in mending what is broken. He sees every crack in your heart and tenderly binds each wound with His love. No hurt is too deep for His healing touch. Bring your brokenness to Him and watch Him make you whole again.',
     'FBC Prayer Ministry',
     '2025-02-14',
     'emotional_encouragement',
     true),

    -- 6
    ('Strength in Weakness',
     'II Corinthians 12:9',
     'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.',
     'Our weakness is not a liability; it is an opportunity for God''s power to be displayed. When we are at the end of our own strength, His grace steps in and carries us. Do not be ashamed of your limitations; they are invitations for God to show up.',
     'FBC Devotional Team',
     '2025-02-24',
     'emotional_encouragement',
     true),

    -- 7
    ('Hope in the Darkness',
     'Psalm 42:11',
     'Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God.',
     'Even the psalmist had moments of deep despair. But he chose to speak hope to his own soul. When darkness tries to overwhelm you, remind yourself of who God is and what He has done. Hope in God, for you will yet praise Him again.',
     'Pastor Isiah Smalls',
     '2025-03-06',
     'emotional_encouragement',
     true),

    -- 8
    ('Fear Not, I Am with You',
     'Isaiah 41:10',
     'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
     'God''s presence is the ultimate antidote to fear. He is with you in the hospital room, in the courtroom, in the job interview, and in every uncertain moment. His righteous right hand holds you securely, and nothing can snatch you away.',
     'FBC Prayer Ministry',
     '2025-03-16',
     'emotional_encouragement',
     true),

    -- 9
    ('A Refuge in the Storm',
     'Psalm 46:1',
     'God is our refuge and strength, a very present help in trouble.',
     'When the storms of life rage around us, God is not far away. He is a very present help, meaning He is immediately available right now, right where you are. Run to Him as your refuge and find the strength you need to weather any storm.',
     'FBC Devotional Team',
     '2025-03-26',
     'emotional_encouragement',
     true),

    -- 10
    ('Courage to Face Tomorrow',
     'Joshua 1:9',
     'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
     'Courage is not the absence of fear; it is moving forward in spite of it because we know God is with us. Whatever tomorrow holds, face it with the bold confidence that the Lord your God goes before you and beside you.',
     'Pastor Isiah Smalls',
     '2025-04-05',
     'emotional_encouragement',
     true),

    -- 11
    ('God Catches Every Tear',
     'Psalm 56:8',
     'Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?',
     'Not a single tear you cry goes unnoticed by God. He collects them, counts them, and remembers every one. Your grief is not invisible to Him. He sees you, He knows you, and He cares deeply about every sorrow you carry.',
     'FBC Prayer Ministry',
     '2025-04-15',
     'emotional_encouragement',
     true),

    -- 12
    ('Rest for the Weary',
     'Matthew 11:28',
     'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
     'Jesus extends an open invitation to the exhausted, the overwhelmed, and the burdened. He does not add to our load; He offers to carry it for us. Come to Him today with your heaviness and receive the soul-deep rest that only He can provide.',
     'FBC Devotional Team',
     '2025-04-25',
     'emotional_encouragement',
     true),

    -- 13
    ('Perseverance in Hard Times',
     'Romans 5:3-4',
     'And not only so, but we glory in tribulations also: knowing that tribulation worketh patience; And patience, experience; and experience, hope.',
     'Hard times produce something valuable in us when we allow God to work through them. Tribulation builds patience, patience builds character, and character builds hope. The very thing that feels like it is breaking you is actually building something eternal within you.',
     'FBC Bible Study Ministry',
     '2025-05-05',
     'emotional_encouragement',
     true),

    -- 14
    ('God Is Near to the Brokenhearted',
     'Psalm 34:18',
     'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
     'When your heart is shattered, God draws even closer. He does not stand at a distance; He comes near to the hurting and the humble. If you are brokenhearted today, know that God is closer to you now than He has ever been.',
     'Pastor Isiah Smalls',
     '2025-05-15',
     'emotional_encouragement',
     true),

    -- 15
    ('A Future and a Hope',
     'Jeremiah 29:11',
     'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
     'God''s plans for you are not plans of harm but of hope and prosperity. Even when life takes unexpected turns, His purposes remain good. Trust that He is weaving together every circumstance for your benefit and His glory.',
     'FBC Devotional Team',
     '2025-05-25',
     'emotional_encouragement',
     true),

    -- 16
    ('Casting Your Cares',
     'I Peter 5:7',
     'Casting all your care upon him; for he careth for you.',
     'You were never designed to carry the weight of your worries alone. God lovingly invites you to cast every burden, every anxiety, and every concern onto Him. He cares for you with a tenderness that is beyond human comprehension.',
     'FBC Prayer Ministry',
     '2025-06-04',
     'emotional_encouragement',
     true),

    -- 17
    ('Beauty for Ashes',
     'Isaiah 61:3',
     'To appoint unto them that mourn in Zion, to give unto them beauty for ashes, the oil of joy for mourning, the garment of praise for the spirit of heaviness.',
     'God is in the business of exchange. He takes our ashes and gives us beauty. He replaces our mourning with joy and our heaviness with praise. Whatever has been destroyed in your life, bring it to Him and let Him create something beautiful from it.',
     'Pastor Isiah Smalls',
     '2025-06-14',
     'emotional_encouragement',
     true),

    -- 18
    ('Walking Through the Valley',
     'Psalm 23:4',
     'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
     'The valley is not a dead end; it is a passage we walk through. God does not leave us stranded in dark places. His rod protects us from danger and His staff guides us safely to the other side. Walk through your valley with confidence in His presence.',
     'FBC Devotional Team',
     '2025-06-24',
     'emotional_encouragement',
     true),

    -- 19
    ('The God Who Sees',
     'Genesis 16:13',
     'And she called the name of the LORD that spake unto her, Thou God seest me: for she said, Have I also here looked after him that seeth me?',
     'Hagar discovered in her deepest loneliness that God saw her. You are never hidden from His sight, never forgotten, never overlooked. When you feel invisible to the world, remember that the God of the universe sees you and knows your name.',
     'FBC Prayer Ministry',
     '2025-07-04',
     'emotional_encouragement',
     true),

    -- 20
    ('Overcoming Grief',
     'Revelation 21:4',
     'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
     'Grief is one of the deepest pains we experience, but it is not the final word. A day is coming when God Himself will wipe every tear from our eyes and sorrow will be no more. Hold onto this promise as you walk through seasons of loss.',
     'Pastor Isiah Smalls',
     '2025-07-14',
     'emotional_encouragement',
     true),

    -- 21
    ('The Lord Is My Shepherd',
     'Psalm 23:1',
     'The LORD is my shepherd; I shall not want.',
     'When the Lord is your shepherd, you lack nothing that is truly essential. He provides for every need, leads you to green pastures, and restores your weary soul. Trust His shepherding care over your life and rest in the assurance that He withholds no good thing.',
     'FBC Devotional Team',
     '2025-07-24',
     'emotional_encouragement',
     true),

    -- 22
    ('Renewed Strength',
     'Isaiah 40:31',
     'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
     'Waiting on God is not passive idleness; it is active trust. Those who wait on Him exchange their exhaustion for His limitless energy. He gives us wings to soar above our circumstances and strength to keep going when the road is long.',
     'FBC Prayer Ministry',
     '2025-08-03',
     'emotional_encouragement',
     true),

    -- 23
    ('Never Forsaken',
     'Hebrews 13:5',
     'Let your conversation be without covetousness; and be content with such things as ye have: for he hath said, I will never leave thee, nor forsake thee.',
     'Human relationships may fail, jobs may disappear, and circumstances may change, but God''s presence is constant. He has made an unbreakable promise: He will never leave you and never forsake you. Rest in this truth when everything around you feels unstable.',
     'FBC Bible Study Ministry',
     '2025-08-13',
     'emotional_encouragement',
     true),

    -- 24
    ('Still Waters',
     'Psalm 23:2',
     'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
     'In the chaos of daily life, God leads us to places of stillness and restoration. He knows when we need to rest, and He provides peaceful moments where our souls can be replenished. Follow His leading to the quiet places and let Him restore you.',
     'Pastor Isiah Smalls',
     '2025-08-23',
     'emotional_encouragement',
     true),

    -- 25
    ('God Is for Us',
     'Romans 8:31',
     'What shall we then say to these things? If God be for us, who can be against us?',
     'When God is on your side, no adversary can ultimately prevail against you. Opposition may come, but it cannot overcome the power of the God who fights for you. Let this truth fill you with confidence and peace as you face every challenge.',
     'FBC Devotional Team',
     '2025-09-02',
     'emotional_encouragement',
     true),

    -- 26
    ('An Anchor for the Soul',
     'Hebrews 6:19',
     'Which hope we have as an anchor of the soul, both sure and stedfast, and which entereth into that within the veil.',
     'Hope in Christ is not wishful thinking; it is a sure and steadfast anchor that holds our souls secure even in the roughest waters. When waves of uncertainty crash around you, your anchor holds because it is fastened to the unchanging character of God.',
     'FBC Prayer Ministry',
     '2025-09-12',
     'emotional_encouragement',
     true),

    -- 27
    ('The Peace of God''s Presence',
     'Psalm 16:11',
     'Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.',
     'There is a fullness of joy found only in God''s presence. The world offers fleeting pleasures, but the joy that flows from being near to Him is deep, lasting, and satisfying. Seek His face today and discover the delight of His companionship.',
     'FBC Bible Study Ministry',
     '2025-09-22',
     'emotional_encouragement',
     true),

    -- 28
    ('God Fights for You',
     'Exodus 14:14',
     'The LORD shall fight for you, and ye shall hold your peace.',
     'Some battles are not ours to fight. God asks us to be still while He goes before us and defeats our enemies. When you are overwhelmed by opposition, step back and let the Lord fight on your behalf. Your job is simply to trust.',
     'Pastor Isiah Smalls',
     '2025-10-02',
     'emotional_encouragement',
     true),

    -- 29
    ('A Garment of Praise',
     'Isaiah 61:3',
     'To appoint unto them that mourn in Zion, to give unto them beauty for ashes, the oil of joy for mourning, the garment of praise for the spirit of heaviness.',
     'When heaviness settles over your spirit, God''s remedy is praise. Worship lifts the weight from our shoulders and replaces it with the lightness of His joy. Put on the garment of praise today, even if it feels like an act of faith, and watch heaviness flee.',
     'FBC Worship Team',
     '2025-10-12',
     'emotional_encouragement',
     true),

    -- 30
    ('The Lord Is My Light',
     'Psalm 27:1',
     'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
     'When God is your light, darkness cannot remain. When He is your salvation, fear has no power over you. When He is the strength of your life, nothing can weaken you beyond recovery. Let Him be all of these things for you today.',
     'FBC Devotional Team',
     '2025-10-22',
     'emotional_encouragement',
     true),

    -- 31
    ('Delivered from Distress',
     'Psalm 107:6',
     'Then they cried unto the LORD in their trouble, and he delivered them out of their distresses.',
     'God responds to the cries of His children. He does not turn a deaf ear when we call out to Him in our distress. Whatever is pressing down on you right now, cry out to Him and trust that He is already working on your deliverance.',
     'FBC Prayer Ministry',
     '2025-11-01',
     'emotional_encouragement',
     true),

    -- 32
    ('Even in the Fire',
     'Isaiah 43:2',
     'When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned; neither shall the flame kindle upon thee.',
     'God does not always remove us from difficult situations, but He promises to be with us in them. The fire will not consume you, and the flood will not drown you because the Lord of heaven and earth walks right beside you through it all.',
     'Pastor Isiah Smalls',
     '2025-11-11',
     'emotional_encouragement',
     true),

    -- 33
    ('A Sound Mind',
     'II Timothy 1:7',
     'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
     'Fear, anxiety, and confusion do not come from God. He gives us power to overcome, love to share, and a sound mind to navigate life''s complexities. When fearful thoughts try to dominate your thinking, remember that God has given you something far greater.',
     'FBC Devotional Team',
     '2025-11-21',
     'emotional_encouragement',
     true),

    -- 34
    ('Mountains Made Low',
     'Isaiah 40:4',
     'Every valley shall be exalted, and every mountain and hill shall be made low: and the crooked shall be made straight, and the rough places plain.',
     'The mountains that stand before you today are not permanent obstacles. God has the power to level every mountain and fill every valley. What seems insurmountable to you is merely a molehill in His hands. Trust Him with your mountains.',
     'FBC Bible Study Ministry',
     '2025-12-01',
     'emotional_encouragement',
     true),

    -- 35
    ('More Than Conquerors',
     'Romans 8:37',
     'Nay, in all these things we are more than conquerors through him that loved us.',
     'We are not merely survivors scraping by; we are more than conquerors through Christ. His love gives us victory that goes beyond simply enduring. We triumph over every circumstance because the One who loves us has already overcome the world.',
     'Pastor Isiah Smalls',
     '2025-12-11',
     'emotional_encouragement',
     true),

    -- 36
    ('A Place of Safety',
     'Proverbs 18:10',
     'The name of the LORD is a strong tower: the righteous runneth into it, and is safe.',
     'The name of the Lord is more than a word; it is a fortress of protection. When danger surrounds you, run to His name and find safety within its walls. He is your hiding place, your shield, and your defender in every situation.',
     'FBC Prayer Ministry',
     '2025-12-21',
     'emotional_encouragement',
     true),

    -- 37
    ('He Will Complete the Work',
     'Philippians 1:6',
     'Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ.',
     'If it feels like your life is still under construction, take heart. God is not finished with you. Every challenge is part of His building process, and He promises to bring His work in you to glorious completion. Trust the Builder.',
     'FBC Devotional Team',
     '2026-01-01',
     'emotional_encouragement',
     true),

    -- 38
    ('Springs in the Desert',
     'Isaiah 35:6-7',
     'Then shall the lame man leap as an hart, and the tongue of the dumb sing: for in the wilderness shall waters break out, and streams in the desert. And the parched ground shall become a pool, and the thirsty land springs of water.',
     'God creates springs of refreshment in the most unlikely places. Even in your driest spiritual season, He can cause living water to burst forth. Hold onto hope because God is able to bring abundance out of your barren places.',
     'FBC Prayer Ministry',
     '2026-01-11',
     'emotional_encouragement',
     true),

    -- 39
    ('A Calm in the Storm',
     'Mark 4:39',
     'And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm.',
     'The same Jesus who calmed the raging sea speaks peace over the storms in your life. He is not troubled by what troubles you. One word from His mouth can change everything. Invite Him into your storm and let Him bring the calm.',
     'FBC Bible Study Ministry',
     '2026-01-21',
     'emotional_encouragement',
     true),

    -- 40
    ('Goodness and Mercy',
     'Psalm 23:6',
     'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
     'Goodness and mercy are not just occasional blessings; they are your constant companions. They follow you every day, in every circumstance, for the rest of your life. No matter where you go or what you face, God''s goodness and mercy are right behind you.',
     'Pastor Isiah Smalls',
     '2026-01-31',
     'emotional_encouragement',
     true),

    -- 41
    ('Precious in His Sight',
     'Isaiah 43:4',
     'Since thou wast precious in my sight, thou hast been honourable, and I have loved thee: therefore will I give men for thee, and people for thy life.',
     'You are precious and honored in God''s sight. This is not based on your performance or achievements but on His unfailing love for you. Let this truth sink deep into your heart today: the Creator of the universe treasures you beyond measure.',
     'FBC Devotional Team',
     '2026-02-10',
     'emotional_encouragement',
     true),

    -- 42
    ('Everlasting Arms',
     'Deuteronomy 33:27',
     'The eternal God is thy refuge, and underneath are the everlasting arms: and he shall thrust out the enemy from before thee; and shall say, Destroy them.',
     'Beneath every fall, beneath every failure, beneath every fear are the everlasting arms of God. You cannot fall beyond His reach. No matter how low you feel, His arms are always underneath you, holding you up and carrying you through.',
     'FBC Prayer Ministry',
     '2026-02-20',
     'emotional_encouragement',
     true),

    -- 43
    ('The Joy of the Lord',
     'Nehemiah 8:10',
     'Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.',
     'The joy of the Lord is not dependent on circumstances. It is a deep, sustaining strength that empowers us to face life with hope and resilience. When sorrow weighs you down, draw from the wellspring of His joy and find renewed strength.',
     'FBC Bible Study Ministry',
     '2026-03-02',
     'emotional_encouragement',
     true),

    -- 44
    ('God Remembers You',
     'Genesis 8:1',
     'And God remembered Noah, and every living thing, and all the cattle that was with him in the ark: and God made a wind to pass over the earth, and the waters asswaged.',
     'In the midst of the flood, God remembered Noah. He has not forgotten you either. Even when it seems like the waters of trouble will never recede, God has you on His mind and He is working behind the scenes to bring you safely through.',
     'Pastor Isiah Smalls',
     '2026-03-12',
     'emotional_encouragement',
     true),

    -- 45
    ('The Sun Will Rise',
     'Lamentations 3:22-23',
     'It is of the LORD''s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
     'God''s mercies are brand new every single morning. Yesterday''s failures are covered by today''s fresh supply of grace. No matter how difficult the night has been, the sun of God''s faithfulness rises without fail. His compassions never run out.',
     'FBC Devotional Team',
     '2026-03-22',
     'emotional_encouragement',
     true),

    -- 46
    ('Carried by Grace',
     'Isaiah 46:4',
     'And even to your old age I am he; and even to hoar hairs will I carry you: I have made, and I will bear; even I will carry, and will deliver you.',
     'From your first breath to your last, God promises to carry you. He made you, He bears you, and He will deliver you. Age, weakness, and weariness do not diminish His commitment to you. He carries you through every stage of life.',
     'FBC Prayer Ministry',
     '2026-04-01',
     'emotional_encouragement',
     true),

    -- 47
    ('You Are Not Alone',
     'Psalm 139:7-8',
     'Whither shall I go from thy spirit? or whither shall I flee from thy presence? If I ascend up into heaven, thou art there: if I make my bed in hell, behold, thou art there.',
     'There is nowhere you can go that God is not already there. In the highest heights of joy and the deepest depths of sorrow, His presence surrounds you. Loneliness is a feeling, but His companionship is a fact. You are never truly alone.',
     'FBC Bible Study Ministry',
     '2026-04-11',
     'emotional_encouragement',
     true),

    -- 48
    ('He Quiets Us with Love',
     'Zephaniah 3:17',
     'The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.',
     'Imagine the God of the universe rejoicing over you with singing and quieting your anxious heart with His love. This is not a distant, indifferent God; this is a Father who delights in His children. Let His song of love calm your spirit today.',
     'Pastor Isiah Smalls',
     '2026-04-21',
     'emotional_encouragement',
     true),

    -- 49
    ('Standing on the Promises',
     'II Corinthians 1:20',
     'For all the promises of God in him are yea, and in him Amen, unto the glory of God by us.',
     'Every promise God has made is guaranteed through Christ. Not one will fail. When doubt creeps in, stand firmly on the promises of His Word. They are your foundation, your assurance, and your reason to keep believing even when circumstances say otherwise.',
     'FBC Devotional Team',
     '2026-05-01',
     'emotional_encouragement',
     true),

    -- 50
    ('Restoration Is Coming',
     'Joel 2:25',
     'And I will restore to you the years that the locust hath eaten, the cankerworm, and the caterpiller, and the palmerworm, my great army which I sent among you.',
     'What the enemy has stolen, God promises to restore. The years of loss, the seasons of pain, and the moments of regret are not beyond His redemptive reach. He is the God of restoration, and He is working right now to make all things new in your life.',
     'FBC Prayer Ministry',
     '2026-05-11',
     'emotional_encouragement',
     true);

    -- ========================================================================
    -- FAITH (50 devotionals)
    -- ========================================================================

    INSERT INTO devotionals (title, scripture, scripture_text, body, author, date, category, is_published) VALUES

    -- 1
    ('The Substance of Things Hoped For',
     'Hebrews 11:1',
     'Now faith is the substance of things hoped for, the evidence of things not seen.',
     'Faith gives substance to our hopes and serves as evidence for what we cannot yet see. It is not blind optimism but confident trust in a God who has proven Himself faithful time and again. Let your faith be the foundation upon which you build your life.',
     'Pastor Isiah Smalls',
     '2025-01-03',
     'faith',
     true),

    -- 2
    ('Walking by Faith',
     'II Corinthians 5:7',
     'For we walk by faith, not by sight.',
     'Faith calls us to trust what God has said even when our eyes tell us something different. Walking by faith means taking steps forward when we cannot see the full path ahead. God honors every step of obedience taken in trust.',
     'FBC Devotional Team',
     '2025-01-13',
     'faith',
     true),

    -- 3
    ('Faith That Moves Mountains',
     'Matthew 17:20',
     'And Jesus said unto them, Because of your unbelief: for verily I say unto you, If ye have faith as a grain of mustard seed, ye shall say unto this mountain, Remove hence to yonder place; and it shall remove; and nothing shall be impossible unto you.',
     'Jesus did not say we need great faith; He said we need genuine faith, even as small as a mustard seed. It is not the size of our faith that matters but the size of the God in whom we place it. Speak to your mountains today with confidence.',
     'FBC Bible Study Ministry',
     '2025-01-23',
     'faith',
     true),

    -- 4
    ('Believing God''s Promises',
     'Romans 4:20-21',
     'He staggered not at the promise of God through unbelief; but was strong in faith, giving glory to God; And being fully persuaded that, what he had promised, he was able also to perform.',
     'Abraham chose to believe God even when everything around him said it was impossible. Like Abraham, we must become fully persuaded that God is able to do what He has promised. Do not stagger at His promises; stand firm in faith and give Him glory.',
     'Pastor Isiah Smalls',
     '2025-02-02',
     'faith',
     true),

    -- 5
    ('Standing Firm in the Faith',
     'I Corinthians 16:13',
     'Watch ye, stand fast in the faith, quit you like men, be strong.',
     'There will be times when everything around you shakes, but your faith must remain unmovable. Standing firm means refusing to abandon what you know to be true about God, regardless of the pressure. Be strong, be courageous, and hold your ground.',
     'FBC Devotional Team',
     '2025-02-12',
     'faith',
     true),

    -- 6
    ('The Shield of Faith',
     'Ephesians 6:16',
     'Above all, taking the shield of faith, wherewith ye shall be able to quench all the fiery darts of the wicked.',
     'Faith is our shield against the enemy''s attacks. Every doubt, every accusation, and every temptation that comes our way can be extinguished by lifting up the shield of faith. Do not go into battle without it; hold your faith high and watch the fiery darts fall harmlessly away.',
     'FBC Prayer Ministry',
     '2025-02-22',
     'faith',
     true),

    -- 7
    ('Faith Without Works',
     'James 2:17',
     'Even so faith, if it hath not works, is dead, being alone.',
     'True faith is not passive; it produces action. When we truly believe God, our lives will reflect it through obedience, service, and love. Let your faith be alive and active, showing the world through your deeds that you trust the living God.',
     'FBC Bible Study Ministry',
     '2025-03-04',
     'faith',
     true),

    -- 8
    ('Mustard Seed Faith',
     'Luke 17:6',
     'And the Lord said, If ye had faith as a grain of mustard seed, ye might say unto this sycamine tree, Be thou plucked up by the root, and be thou planted in the sea; and it should obey you.',
     'A mustard seed is tiny, yet it produces a tree large enough for birds to rest in. Your small faith has the potential to produce enormous results when it is placed in an almighty God. Do not despise the smallness of your faith; nurture it and watch it grow.',
     'Pastor Isiah Smalls',
     '2025-03-14',
     'faith',
     true),

    -- 9
    ('Trusting God in Uncertainty',
     'Proverbs 3:5-6',
     'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
     'Uncertainty is uncomfortable, but it is also where faith thrives. When you cannot figure out the next step, trust the One who sees the entire journey. Lean not on your own limited understanding but acknowledge Him, and He will make your paths straight.',
     'FBC Devotional Team',
     '2025-03-24',
     'faith',
     true),

    -- 10
    ('Faith in the Wilderness',
     'Deuteronomy 8:2',
     'And thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness, to humble thee, and to prove thee, to know what was in thine heart, whether thou wouldest keep his commandments, or no.',
     'The wilderness is not a punishment; it is a proving ground for faith. God led Israel through the desert to test and strengthen their trust in Him. If you are in a wilderness season, know that God is using it to deepen your dependence on Him.',
     'FBC Prayer Ministry',
     '2025-04-03',
     'faith',
     true),

    -- 11
    ('By Grace Through Faith',
     'Ephesians 2:8',
     'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.',
     'Salvation is not something we earn; it is a gift received through faith. This truth should fill us with gratitude and humility. We contribute nothing to our rescue except the willingness to believe. Thank God today for the gift of faith that connects you to His saving grace.',
     'FBC Bible Study Ministry',
     '2025-04-13',
     'faith',
     true),

    -- 12
    ('When Faith Feels Weak',
     'Mark 9:24',
     'And straightway the father of the child cried out, and said with tears, Lord, I believe; help thou mine unbelief.',
     'It is okay to bring your doubts to God. The father in this passage had honest, imperfect faith, and Jesus honored it by healing his son. If your faith feels weak today, cry out to God and ask Him to help you believe. He will not turn you away.',
     'Pastor Isiah Smalls',
     '2025-04-23',
     'faith',
     true),

    -- 13
    ('Faith That Endures',
     'Hebrews 10:36',
     'For ye have need of patience, that, after ye have done the will of God, ye might receive the promise.',
     'Some promises from God require patience before they are fulfilled. Enduring faith does not give up when the answer is delayed. It holds on, trusts the timing, and continues to do God''s will while waiting for His perfect plan to unfold.',
     'FBC Devotional Team',
     '2025-05-03',
     'faith',
     true),

    -- 14
    ('The Assurance of Faith',
     'Hebrews 11:6',
     'But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.',
     'Faith pleases God because it acknowledges who He is and trusts what He does. He rewards those who earnestly seek Him, not with empty promises, but with His very presence. Approach Him today with confident assurance that He hears and answers.',
     'FBC Prayer Ministry',
     '2025-05-13',
     'faith',
     true),

    -- 15
    ('God Is Able',
     'Ephesians 3:20',
     'Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us.',
     'Our God is able to do more than we can ask, think, or imagine. His power at work within us exceeds our wildest expectations. Do not limit God with small prayers; believe that He is able to do exceedingly abundantly beyond your greatest dreams.',
     'FBC Bible Study Ministry',
     '2025-05-23',
     'faith',
     true),

    -- 16
    ('The Author and Finisher of Faith',
     'Hebrews 12:2',
     'Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God.',
     'Jesus is both the originator and the completer of our faith. He starts the work and He finishes it. When you feel like your faith is faltering, look to Jesus. He endured the cross so that we could have a faith that overcomes the world.',
     'Pastor Isiah Smalls',
     '2025-06-02',
     'faith',
     true),

    -- 17
    ('Faith Overcomes the World',
     'I John 5:4',
     'For whatsoever is born of God overcometh the world: and this is the victory that overcometh the world, even our faith.',
     'The victory that overcomes the world is not our strength, our intelligence, or our resources. It is our faith. When we believe God, we tap into a power that transcends every earthly obstacle. Your faith is the weapon that conquers every challenge.',
     'FBC Devotional Team',
     '2025-06-12',
     'faith',
     true),

    -- 18
    ('Trusting God''s Timing',
     'Ecclesiastes 3:11',
     'He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.',
     'God''s timing is perfect even when it does not align with ours. He makes everything beautiful in its time, not a moment too early or too late. Trust His timeline for your life and believe that He is orchestrating every detail for your good.',
     'FBC Prayer Ministry',
     '2025-06-22',
     'faith',
     true),

    -- 19
    ('The Faithful God',
     'Deuteronomy 7:9',
     'Know therefore that the LORD thy God, he is God, the faithful God, which keepeth covenant and mercy with them that love him and keep his commandments to a thousand generations.',
     'God''s faithfulness extends to a thousand generations. He has never broken a covenant or failed to keep a promise. When doubt tries to creep in, remember the track record of God''s faithfulness throughout all of history and in your own life.',
     'FBC Bible Study Ministry',
     '2025-07-02',
     'faith',
     true),

    -- 20
    ('Seek and You Shall Find',
     'Matthew 7:7',
     'Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you.',
     'Jesus invites us to be persistent in our seeking, asking, and knocking. This is not about demanding what we want but about continually drawing near to God with faith and expectation. He promises to respond to every earnest seeker.',
     'Pastor Isiah Smalls',
     '2025-07-12',
     'faith',
     true),

    -- 21
    ('Faith in God''s Character',
     'Nahum 1:7',
     'The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.',
     'Our faith is only as strong as the object in which it is placed. When we place our trust in God''s unchanging character, our faith becomes unshakeable. He is good, He is a stronghold, and He knows every person who trusts in Him.',
     'FBC Devotional Team',
     '2025-07-22',
     'faith',
     true),

    -- 22
    ('The Centurion''s Faith',
     'Matthew 8:10',
     'When Jesus heard it, he marvelled, and said to them that followed, Verily I say unto you, I have not found so great faith, no, not in Israel.',
     'The centurion''s faith amazed Jesus because he understood authority. He knew that if Jesus simply spoke a word, it would be done. This kind of faith believes in God''s power without needing to see the miracle first. Let your faith speak with that same boldness.',
     'FBC Prayer Ministry',
     '2025-08-01',
     'faith',
     true),

    -- 23
    ('Waiting in Faith',
     'Psalm 27:14',
     'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.',
     'Waiting is one of the hardest expressions of faith, yet it is also one of the most powerful. To wait on God is to declare that His timing is better than ours and His plan is wiser than anything we could devise. Wait with courage and let Him strengthen you.',
     'FBC Bible Study Ministry',
     '2025-08-11',
     'faith',
     true),

    -- 24
    ('Blessed Are Those Who Believe',
     'John 20:29',
     'Jesus saith unto him, Thomas, because thou hast seen me, thou hast believed: blessed are they that have not seen, and yet have believed.',
     'We may not have seen Jesus with our physical eyes, but we believe. And Jesus calls us blessed for that. Our faith reaches beyond what our senses can detect and lays hold of eternal realities. This kind of faith receives the highest commendation from our Lord.',
     'Pastor Isiah Smalls',
     '2025-08-21',
     'faith',
     true),

    -- 25
    ('The Tested Faith',
     'I Peter 1:7',
     'That the trial of your faith, being much more precious than of gold that perisheth, though it be tried with fire, might be found unto praise and honour and glory at the appearing of Jesus Christ.',
     'Tested faith is more valuable than gold. Every trial you face refines and purifies your trust in God, producing something of eternal worth. When your faith is in the fire, remember that the result will be praise, honor, and glory when Christ appears.',
     'FBC Devotional Team',
     '2025-08-31',
     'faith',
     true),

    -- 26
    ('Faith and Obedience',
     'Genesis 22:2-3',
     'And he said, Take now thy son, thine only son Isaac, whom thou lovest, and get thee into the land of Moriah; and offer him there for a burnt offering upon one of the mountains which I will tell thee of. And Abraham rose up early in the morning.',
     'Abraham''s faith was demonstrated by his immediate obedience. He did not delay or debate when God spoke. True faith produces swift obedience, even when the command seems impossible to understand. Trust God enough to obey before you fully comprehend His plan.',
     'FBC Prayer Ministry',
     '2025-09-10',
     'faith',
     true),

    -- 27
    ('Unshakeable Faith',
     'Daniel 3:17-18',
     'If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king. But if not, be it known unto thee, O king, that we will not serve thy gods, nor worship the golden image which thou hast set up.',
     'The three Hebrew boys demonstrated faith that did not depend on the outcome. They believed God could save them, but even if He chose not to, they would not compromise. This is the highest form of faith: trusting God regardless of what happens.',
     'FBC Bible Study Ministry',
     '2025-09-20',
     'faith',
     true),

    -- 28
    ('Receiving by Faith',
     'Mark 11:24',
     'Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.',
     'Prayer and faith work hand in hand. When we pray, we must believe that God hears and answers. Faith receives what prayer requests. Do not pray with doubt in your heart; pray with the expectation that God is already at work on your behalf.',
     'Pastor Isiah Smalls',
     '2025-09-30',
     'faith',
     true),

    -- 29
    ('The Fight of Faith',
     'I Timothy 6:12',
     'Fight the good fight of faith, lay hold on eternal life, whereunto thou art also called, and hast professed a good profession before many witnesses.',
     'Faith is described as a fight because it requires determination and perseverance. The enemy constantly attacks our belief, but we must fight to hold onto what we know is true. Lay hold of eternal life and do not let go, no matter how fierce the battle.',
     'FBC Devotional Team',
     '2025-10-10',
     'faith',
     true),

    -- 30
    ('Faith in the Impossible',
     'Luke 1:37',
     'For with God nothing shall be impossible.',
     'When you face situations that seem completely impossible, remember that God specializes in the impossible. He parted the Red Sea, raised the dead, and created the universe from nothing. Nothing is too hard for Him. Bring your impossible situation to Him in faith.',
     'FBC Prayer Ministry',
     '2025-10-20',
     'faith',
     true),

    -- 31
    ('Justified by Faith',
     'Romans 5:1',
     'Therefore being justified by faith, we have peace with God through our Lord Jesus Christ.',
     'Faith in Jesus Christ is what gives us right standing before God. We do not earn our way into His favor; we receive it by faith. This justification brings peace with God, a peace that settles the deepest questions of our souls.',
     'FBC Bible Study Ministry',
     '2025-10-30',
     'faith',
     true),

    -- 32
    ('The Anchor of Our Faith',
     'Hebrews 6:19',
     'Which hope we have as an anchor of the soul, both sure and stedfast, and which entereth into that within the veil.',
     'Our faith is anchored in the unchanging promises of God and the finished work of Christ. No storm can shake this anchor loose. When waves of uncertainty crash against your life, hold fast to the anchor of your faith and remain secure.',
     'Pastor Isiah Smalls',
     '2025-11-09',
     'faith',
     true),

    -- 33
    ('Stepping Out in Faith',
     'Matthew 14:29',
     'And he said, Come. And when Peter was come down out of the ship, he walked on the water, to go to Jesus.',
     'Peter stepped out of the boat and walked on water because Jesus said one word: Come. Sometimes faith requires stepping out of the safety of our comfort zone. When Jesus calls, step out boldly, even when the circumstances look impossible.',
     'FBC Devotional Team',
     '2025-11-19',
     'faith',
     true),

    -- 34
    ('Faith Rewarded',
     'Hebrews 11:39-40',
     'And these all, having obtained a good report through faith, received not the promise: Having provided some better thing for us, that they without us should not be made perfect.',
     'The heroes of faith in Hebrews 11 did not all see the fulfillment of God''s promises in their lifetimes, yet they trusted anyway. Their faith was rewarded with a legacy that inspires generations. Your faithfulness today will impact lives long after you are gone.',
     'FBC Prayer Ministry',
     '2025-11-29',
     'faith',
     true),

    -- 35
    ('The Door of Faith',
     'Acts 14:27',
     'And when they were come, and had gathered the church together, they rehearsed all that God had done with them, and how he had opened the door of faith unto the Gentiles.',
     'God opens doors of faith that no person can shut. When He opens a door for you, walk through it with confidence, knowing that He has prepared the way. Do not hesitate at the threshold; step through the door of faith boldly.',
     'FBC Bible Study Ministry',
     '2025-12-09',
     'faith',
     true),

    -- 36
    ('Faith Sees the Invisible',
     'Hebrews 11:27',
     'By faith he forsook Egypt, not fearing the wrath of the king: for he endured, as seeing him who is invisible.',
     'Moses endured because he saw the invisible God with the eyes of faith. When you feel discouraged by what you can see, let faith open your spiritual eyes to perceive God''s reality. The invisible is more real and more powerful than the visible.',
     'Pastor Isiah Smalls',
     '2025-12-19',
     'faith',
     true),

    -- 37
    ('Trust in the Lord',
     'Psalm 37:5',
     'Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.',
     'Committing your way to the Lord means releasing control and trusting His plan above your own. It is an act of surrender that opens the door for God to work powerfully in your life. Commit, trust, and watch Him bring His purposes to pass.',
     'FBC Devotional Team',
     '2026-01-02',
     'faith',
     true),

    -- 38
    ('A Living Faith',
     'James 2:26',
     'For as the body without the spirit is dead, so faith without works is dead also.',
     'A living faith is one that breathes and moves and acts. It does not sit idle but responds to God''s Word with action. Let your faith come alive today through acts of love, obedience, and service that demonstrate the reality of your belief.',
     'FBC Prayer Ministry',
     '2026-01-12',
     'faith',
     true),

    -- 39
    ('Holding Fast',
     'Hebrews 10:23',
     'Let us hold fast the profession of our faith without wavering; for he is faithful that promised.',
     'Holding fast to our faith means refusing to waver even when the world pressures us to compromise. We can hold fast because the One who made the promises is faithful. His faithfulness secures our faith and gives us reason to persevere.',
     'FBC Bible Study Ministry',
     '2026-01-22',
     'faith',
     true),

    -- 40
    ('The Power of Believing',
     'John 11:40',
     'Jesus saith unto her, Said I not unto thee, that, if thou wouldest believe, thou shouldest see the glory of God?',
     'Jesus told Martha that if she would believe, she would see the glory of God. Belief precedes the miracle. Many want to see before they believe, but God''s kingdom works in the opposite order. Believe first, and then watch His glory unfold before your eyes.',
     'Pastor Isiah Smalls',
     '2026-02-01',
     'faith',
     true),

    -- 41
    ('Faith Like a Child',
     'Matthew 18:3',
     'And said, Verily I say unto you, Except ye be converted, and become as little children, ye shall not enter into the kingdom of heaven.',
     'Children believe simply and trust completely. They do not overthink or overanalyze God''s promises. Jesus calls us to have this same kind of uncomplicated faith that takes God at His word and rests in His loving care.',
     'FBC Devotional Team',
     '2026-02-11',
     'faith',
     true),

    -- 42
    ('The Faithfulness of God',
     'Lamentations 3:23',
     'They are new every morning: great is thy faithfulness.',
     'God''s faithfulness is renewed every single day. He never takes a day off, never breaks a promise, and never abandons His people. Great is His faithfulness, and it is the bedrock upon which our faith securely stands. Let His faithfulness strengthen your trust today.',
     'FBC Prayer Ministry',
     '2026-02-21',
     'faith',
     true),

    -- 43
    ('Bold Access Through Faith',
     'Ephesians 3:12',
     'In whom we have boldness and access with confidence by the faith of him.',
     'Through faith in Christ, we have bold and confident access to the throne of God. We do not have to approach Him timidly or with fear. Faith gives us the right to come before the King of kings with confidence, knowing that He welcomes us warmly.',
     'FBC Bible Study Ministry',
     '2026-03-03',
     'faith',
     true),

    -- 44
    ('Faith and Healing',
     'James 5:15',
     'And the prayer of faith shall save the sick, and the Lord shall raise him up; and if he have committed sins, they shall be forgiven him.',
     'The prayer of faith carries healing power because it connects us to the Great Physician. God still heals today, and He responds to faith-filled prayers. Bring your needs, your pains, and your burdens before Him with believing hearts and watch Him work.',
     'Pastor Isiah Smalls',
     '2026-03-13',
     'faith',
     true),

    -- 45
    ('From Faith to Faith',
     'Romans 1:17',
     'For therein is the righteousness of God revealed from faith to faith: as it is written, The just shall live by faith.',
     'The life of faith is progressive; it moves from one level of trust to the next. Each experience of God''s faithfulness builds upon the last, creating a journey of ever-deepening reliance on Him. Let your faith grow from glory to glory.',
     'FBC Devotional Team',
     '2026-03-23',
     'faith',
     true),

    -- 46
    ('A Tested Foundation',
     'Isaiah 28:16',
     'Therefore thus saith the Lord GOD, Behold, I lay in Zion for a foundation a stone, a tried stone, a precious corner stone, a sure foundation: he that believeth shall not make haste.',
     'Christ is the tested, tried, and precious cornerstone of our faith. Those who build their lives on Him will never be put to shame. When pressure comes, a faith built on this sure foundation will not crumble or crack.',
     'FBC Prayer Ministry',
     '2026-04-02',
     'faith',
     true),

    -- 47
    ('Faith and Patience',
     'Hebrews 6:12',
     'That ye be not slothful, but followers of them who through faith and patience inherit the promises.',
     'Faith and patience are companions on the journey to God''s promises. Faith believes the promise while patience waits for its fulfillment. Together they produce the endurance needed to inherit everything God has prepared for those who love Him.',
     'FBC Bible Study Ministry',
     '2026-04-12',
     'faith',
     true),

    -- 48
    ('Unwavering Trust',
     'James 1:6',
     'But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.',
     'A faith that wavers is tossed about by every change in circumstances. God calls us to an unwavering trust that remains steady regardless of what we see or feel. Plant your faith firmly in His Word and refuse to be moved.',
     'Pastor Isiah Smalls',
     '2026-04-22',
     'faith',
     true),

    -- 49
    ('Delivered by Faith',
     'Daniel 6:23',
     'Then was the king exceedingly glad for him, and commanded that they should take Daniel up out of the den. So Daniel was taken up out of the den, and no manner of hurt was found upon him, because he believed in his God.',
     'Daniel was delivered from the lions'' den because he believed in his God. Faith does not guarantee the absence of trouble, but it does guarantee God''s presence and protection within it. Trust God in your lion''s den and He will bring you out unharmed.',
     'FBC Devotional Team',
     '2026-05-02',
     'faith',
     true),

    -- 50
    ('The Measure of Faith',
     'Romans 12:3',
     'For I say, through the grace given unto me, to every man that is among you, not to think of himself more highly than he ought to think; but to think soberly, according as God hath dealt to every man the measure of faith.',
     'God has given every believer a measure of faith. No one is without it. Your job is not to manufacture faith but to exercise and grow the faith He has already planted within you. Use what He has given you and watch it multiply.',
     'FBC Prayer Ministry',
     '2026-05-12',
     'faith',
     true);

    -- ========================================================================
    -- LOVE (50 devotionals)
    -- ========================================================================

    INSERT INTO devotionals (title, scripture, scripture_text, body, author, date, category, is_published) VALUES

    -- 1
    ('God So Loved the World',
     'John 3:16',
     'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
     'The foundation of our faith rests on the staggering truth that God loved us so much He gave His only Son. This love is not earned or deserved; it is freely given to whosoever will believe. Receive His love afresh today and let it transform your heart.',
     'Pastor Isiah Smalls',
     '2025-01-07',
     'love',
     true),

    -- 2
    ('Love Your Neighbor',
     'Mark 12:31',
     'And the second is like, namely this, Thou shalt love thy neighbour as thyself. There is none other commandment greater than these.',
     'Loving our neighbor is not optional; it is a commandment that ranks alongside loving God. Our neighbors include not just those who live near us but everyone God brings into our path. Show genuine love to someone today through a kind word, a helping hand, or a listening ear.',
     'FBC Devotional Team',
     '2025-01-17',
     'love',
     true),

    -- 3
    ('Love Is Patient',
     'I Corinthians 13:4',
     'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
     'Love is patient when people test our limits. It is kind when others are difficult. It does not envy what others have or boast about what we possess. True love, the kind God gives and asks us to share, is humble, generous, and enduring.',
     'FBC Prayer Ministry',
     '2025-01-27',
     'love',
     true),

    -- 4
    ('Love Covers a Multitude of Sins',
     'I Peter 4:8',
     'And above all things have fervent charity among yourselves: for charity shall cover the multitude of sins.',
     'Love does not keep a record of wrongs or broadcast the failures of others. It covers and forgives, just as Christ has covered our sins with His grace. Let your love be fervent enough to overlook offenses and extend grace generously.',
     'FBC Bible Study Ministry',
     '2025-02-06',
     'love',
     true),

    -- 5
    ('Brotherly Love',
     'Romans 12:10',
     'Be kindly affectioned one to another with brotherly love; in honour preferring one another.',
     'The church is a family, and families are called to love each other with genuine affection. Brotherly love means putting others before ourselves, honoring them above our own interests, and creating a community where everyone feels valued and cared for.',
     'Pastor Isiah Smalls',
     '2025-02-16',
     'love',
     true),

    -- 6
    ('Compassion of Christ',
     'Matthew 9:36',
     'But when he saw the multitudes, he was moved with compassion on them, because they fainted, and were scattered abroad, as sheep having no shepherd.',
     'Jesus looked at the crowds and felt deep compassion for them. He did not see them as nuisances or interruptions; He saw them as lost sheep in need of a shepherd. Ask God to give you the eyes and heart of Christ for the people around you.',
     'FBC Devotional Team',
     '2025-02-26',
     'love',
     true),

    -- 7
    ('Forgiveness and Love',
     'Ephesians 4:32',
     'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ''s sake hath forgiven you.',
     'Forgiveness is love in action. When we forgive others as Christ forgave us, we release both them and ourselves from the prison of bitterness. Be tenderhearted today, extending the same grace that God has so generously extended to you.',
     'FBC Prayer Ministry',
     '2025-03-08',
     'love',
     true),

    -- 8
    ('Unconditional Love',
     'Romans 5:8',
     'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.',
     'God did not wait for us to clean up our lives before He loved us. He loved us at our worst, in the depths of our sin, and sent Christ to die for us. This is unconditional love, love that does not depend on our worthiness but on His character.',
     'FBC Bible Study Ministry',
     '2025-03-18',
     'love',
     true),

    -- 9
    ('Love Never Fails',
     'I Corinthians 13:8',
     'Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.',
     'Prophecies will cease, tongues will stop, and knowledge will pass away, but love endures forever. In a world where everything is temporary, love is the one thing that will never fail. Build your life on love and you build on the only foundation that lasts.',
     'Pastor Isiah Smalls',
     '2025-03-28',
     'love',
     true),

    -- 10
    ('The Greatest Commandment',
     'Matthew 22:37-38',
     'Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. This is the first and great commandment.',
     'Loving God with everything we have is the greatest commandment because it is the foundation for everything else. When we love God fully, love for others flows naturally. Let your whole heart, soul, and mind be consumed with love for your Creator today.',
     'FBC Devotional Team',
     '2025-04-07',
     'love',
     true),

    -- 11
    ('Abounding in Love',
     'Philippians 1:9',
     'And this I pray, that your love may abound yet more and more in knowledge and in all judgment.',
     'Paul prayed that love would abound more and more, not just in feelings but in knowledge and discernment. Mature love is both passionate and wise. Ask God to deepen your love today so that it grows in both warmth and wisdom.',
     'FBC Prayer Ministry',
     '2025-04-17',
     'love',
     true),

    -- 12
    ('Love One Another',
     'John 13:34',
     'A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.',
     'Jesus set the standard for love by laying down His life. When He commands us to love one another as He loved us, He calls us to a sacrificial, selfless kind of love. Look for ways today to love others with the same devotion Christ showed us.',
     'FBC Bible Study Ministry',
     '2025-04-27',
     'love',
     true),

    -- 13
    ('The Love That Casts Out Fear',
     'I John 4:18',
     'There is no fear in love; but perfect love casteth out fear: because fear hath torment. He that feareth is not made perfect in love.',
     'Fear and love cannot coexist. When we are fully rooted in God''s perfect love, fear loses its grip on us. If anxiety or dread has taken hold of your heart, let the love of God flood in and drive every fear out.',
     'Pastor Isiah Smalls',
     '2025-05-07',
     'love',
     true),

    -- 14
    ('A Loving Father',
     'I John 3:1',
     'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.',
     'The love of the Father is lavish and extravagant. He did not merely tolerate us; He called us His own children. This is a love beyond comprehension, that the God of the universe would call you His son or daughter. Marvel at this love today.',
     'FBC Devotional Team',
     '2025-05-17',
     'love',
     true),

    -- 15
    ('Charity Never Envies',
     'I Corinthians 13:4',
     'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.',
     'Envy is the enemy of love. When we rejoice in what others have instead of coveting it, we demonstrate the kind of love that reflects God''s heart. Choose today to celebrate the blessings in others'' lives rather than comparing them to your own.',
     'FBC Prayer Ministry',
     '2025-05-27',
     'love',
     true),

    -- 16
    ('Love Your Enemies',
     'Matthew 5:44',
     'But I say unto you, Love your enemies, bless them that curse you, do good to them that hate you, and pray for them which despitefully use you, and persecute you.',
     'Loving our enemies is perhaps the most radical command Jesus ever gave. It defies human nature and requires supernatural grace. But when we love those who oppose us, we reflect the heart of a God who loved us while we were still His enemies.',
     'FBC Bible Study Ministry',
     '2025-06-06',
     'love',
     true),

    -- 17
    ('Inseparable Love',
     'Romans 8:38-39',
     'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come, Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
     'Nothing in all of creation can separate you from God''s love. Not death, not life, not angels, not demons, not the past, not the future, nothing at all. This love is permanent, unbreakable, and stronger than any force in the universe.',
     'Pastor Isiah Smalls',
     '2025-06-16',
     'love',
     true),

    -- 18
    ('Serving in Love',
     'Galatians 5:13',
     'For, brethren, ye have been called unto liberty; only use not liberty for an occasion to the flesh, but by love serve one another.',
     'True freedom in Christ is not freedom to do whatever we want; it is freedom to love and serve others. When we use our liberty to serve one another in love, we fulfill the very heart of the gospel and reflect the character of Jesus.',
     'FBC Devotional Team',
     '2025-06-26',
     'love',
     true),

    -- 19
    ('God''s Everlasting Love',
     'Jeremiah 31:3',
     'The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.',
     'God''s love for you did not begin at your conversion and will not end at your death. It is everlasting, stretching from eternity past to eternity future. He draws you to Himself with lovingkindness that has no beginning and no end.',
     'FBC Prayer Ministry',
     '2025-07-06',
     'love',
     true),

    -- 20
    ('Love in Truth',
     'I John 3:18',
     'My little children, let us not love in word, neither in tongue; but in deed and in truth.',
     'Love is not just something we say; it is something we do. Words without action ring hollow. True love is demonstrated through genuine deeds of kindness, generosity, and sacrifice. Let your love be expressed in tangible ways that make a real difference in someone''s life.',
     'FBC Bible Study Ministry',
     '2025-07-16',
     'love',
     true),

    -- 21
    ('The Bond of Perfection',
     'Colossians 3:14',
     'And above all these things put on charity, which is the bond of perfectness.',
     'Love is the glue that holds all virtues together. Without love, even the greatest gifts and qualities fall apart. When we put on love above all else, it binds everything together in perfect unity. Make love the defining characteristic of your life.',
     'Pastor Isiah Smalls',
     '2025-07-26',
     'love',
     true),

    -- 22
    ('Lavish Love',
     'I John 3:1',
     'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God.',
     'The Father''s love is not measured or rationed; it is lavished upon us without limit. He gives generously, forgives freely, and blesses abundantly. Receive His lavish love today and let it overflow from your life to everyone around you.',
     'FBC Devotional Team',
     '2025-08-05',
     'love',
     true),

    -- 23
    ('Love Keeps No Record of Wrongs',
     'I Corinthians 13:5',
     'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil.',
     'Love does not keep a mental list of every offense. It chooses to forgive and let go rather than holding grudges. When we release the wrongs others have done to us, we free ourselves to love more deeply and live more joyfully.',
     'FBC Prayer Ministry',
     '2025-08-15',
     'love',
     true),

    -- 24
    ('Rooted in Love',
     'Ephesians 3:17',
     'That Christ may dwell in your hearts by faith; that ye, being rooted and grounded in love.',
     'When our roots go deep into God''s love, we become stable, secure, and fruitful. A life rooted in love does not panic in the storm or wither in the drought. Plant your roots deep in His love and discover an unshakeable foundation for every area of your life.',
     'FBC Bible Study Ministry',
     '2025-08-25',
     'love',
     true),

    -- 25
    ('The Good Samaritan',
     'Luke 10:33-34',
     'But a certain Samaritan, as he journeyed, came where he was: and when he saw him, he had compassion on him, And went to him, and bound up his wounds, pouring in oil and wine, and set him on his own beast, and brought him to an inn, and took care of him.',
     'Love does not walk by on the other side of the road. It crosses boundaries, gets its hands dirty, and meets people right where they are. Look for opportunities today to be a Good Samaritan to someone who needs your help.',
     'Pastor Isiah Smalls',
     '2025-09-04',
     'love',
     true),

    -- 26
    ('A New Heart of Love',
     'Ezekiel 36:26',
     'A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh.',
     'God promises to replace our hard, stony hearts with soft, tender ones that are capable of deep love. If your heart has grown cold or calloused, ask God for a new one. He specializes in heart transplants, turning stone into flesh that beats with His love.',
     'FBC Devotional Team',
     '2025-09-14',
     'love',
     true),

    -- 27
    ('Love Rejoices in Truth',
     'I Corinthians 13:6',
     'Rejoiceth not in iniquity, but rejoiceth in the truth.',
     'True love does not celebrate wrongdoing or take pleasure in seeing others fall. It rejoices when truth prevails. Let your love be anchored in honesty and integrity, celebrating what is right and standing for what is true.',
     'FBC Prayer Ministry',
     '2025-09-24',
     'love',
     true),

    -- 28
    ('Sacrificial Love',
     'John 15:13',
     'Greater love hath no man than this, that a man lay down his life for his friends.',
     'The greatest expression of love is sacrifice. Jesus demonstrated this on the cross, and He calls us to live sacrificially for others. This does not always mean dying physically; it means putting others'' needs before our own comfort and convenience.',
     'FBC Bible Study Ministry',
     '2025-10-04',
     'love',
     true),

    -- 29
    ('Walking in Love',
     'Ephesians 5:2',
     'And walk in love, as Christ also hath loved us, and hath given himself for us an offering and a sacrifice to God for a sweetsmelling savour.',
     'Walking in love is a daily decision to follow Christ''s example of selfless giving. Each step of love we take is a fragrant offering to God. Let your daily walk be marked by love that gives, serves, and blesses everyone you encounter.',
     'Pastor Isiah Smalls',
     '2025-10-14',
     'love',
     true),

    -- 30
    ('Kindness and Tenderness',
     'Ephesians 4:32',
     'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ''s sake hath forgiven you.',
     'Kindness and tenderness are expressions of love that soften even the hardest hearts. A kind word spoken at the right moment can change someone''s entire day. Be intentionally kind and tenderhearted to everyone God places in your path today.',
     'FBC Devotional Team',
     '2025-10-24',
     'love',
     true),

    -- 31
    ('Beloved of God',
     'I John 4:19',
     'We love him, because he first loved us.',
     'Our ability to love flows from one source: God loved us first. Before we ever turned our hearts toward Him, He had already set His love upon us. You are beloved of God, chosen and cherished, and from this place of being loved you can love others freely.',
     'FBC Prayer Ministry',
     '2025-11-03',
     'love',
     true),

    -- 32
    ('Love Builds Up',
     'I Corinthians 8:1',
     'Knowledge puffeth up, but charity edifieth.',
     'Knowledge without love leads to pride, but love builds people up. When we speak truth in love, correct in love, and serve in love, we edify others and strengthen the body of Christ. Let love be the motivation behind everything you say and do.',
     'FBC Bible Study Ministry',
     '2025-11-13',
     'love',
     true),

    -- 33
    ('Embracing Grace',
     'Titus 3:4-5',
     'But after that the kindness and love of God our Saviour toward man appeared, Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost.',
     'God''s love came to us through His kindness, not because of anything we did to deserve it. His mercy washed us clean and gave us new life. Embrace this grace today and share it freely with others who need to know that God loves them too.',
     'Pastor Isiah Smalls',
     '2025-11-23',
     'love',
     true),

    -- 34
    ('The Father''s Discipline',
     'Hebrews 12:6',
     'For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth.',
     'God''s discipline is an expression of His love, not His anger. A parent who does not correct a child does not truly care. When God corrects us, it is because He loves us too much to let us stay in harmful patterns. Receive His discipline as evidence of His love.',
     'FBC Devotional Team',
     '2025-12-03',
     'love',
     true),

    -- 35
    ('Love Bears All Things',
     'I Corinthians 13:7',
     'Beareth all things, believeth all things, hopeth all things, endureth all things.',
     'Love has a remarkable capacity to bear, believe, hope, and endure. It does not quit when things get hard or give up when people are difficult. The love of Christ in us enables us to keep going even when every part of us wants to walk away.',
     'FBC Prayer Ministry',
     '2025-12-13',
     'love',
     true),

    -- 36
    ('Spreading God''s Love',
     'Romans 5:5',
     'And hope maketh not ashamed; because the love of God is shed abroad in our hearts by the Holy Ghost which is given unto us.',
     'The Holy Spirit pours God''s love into our hearts so that we can pour it out to others. We are not merely recipients of His love; we are conduits through which His love flows to a world in desperate need. Let His love flow freely through you today.',
     'FBC Bible Study Ministry',
     '2025-12-23',
     'love',
     true),

    -- 37
    ('Love Is the Fulfillment of the Law',
     'Romans 13:10',
     'Love worketh no ill to his neighbour: therefore love is the fulfilling of the law.',
     'When we truly love our neighbor, we naturally fulfill every commandment. Love does no harm to anyone. It is the summary and fulfillment of everything God requires of us. If we can love well, we will live well.',
     'Pastor Isiah Smalls',
     '2026-01-06',
     'love',
     true),

    -- 38
    ('A Love That Heals',
     'Hosea 14:4',
     'I will heal their backsliding, I will love them freely: for mine anger is turned away from him.',
     'God''s love has healing power. It mends broken relationships, restores wandering hearts, and heals the wounds caused by sin. His love is given freely, without condition or reservation. Let His healing love touch every hurt place in your life today.',
     'FBC Devotional Team',
     '2026-01-16',
     'love',
     true),

    -- 39
    ('Loving with Actions',
     'I John 3:18',
     'My little children, let us not love in word, neither in tongue; but in deed and in truth.',
     'Love shows itself through action. It cooks a meal for a sick neighbor, visits someone in the hospital, sends an encouraging note, or simply listens when someone needs to talk. Find a way today to move your love from words into deeds.',
     'FBC Prayer Ministry',
     '2026-01-26',
     'love',
     true),

    -- 40
    ('The Width and Length of God''s Love',
     'Ephesians 3:18',
     'May be able to comprehend with all saints what is the breadth, and length, and depth, and height.',
     'God''s love is so vast that it takes all the saints together to even begin to grasp its dimensions. It is wider than our worst failure, longer than our longest trial, deeper than our deepest pain, and higher than our highest aspiration. Meditate on this boundless love.',
     'FBC Bible Study Ministry',
     '2026-02-05',
     'love',
     true),

    -- 41
    ('Loving the Unlovable',
     'Luke 6:32',
     'For if ye love them which love you, what thank have ye? for sinners also love those that love them.',
     'It is easy to love people who love us back. The true test of love is how we treat those who are difficult, annoying, or unkind. God calls us to love beyond our comfort zone, reaching out to the unlovable with the same grace He has shown us.',
     'Pastor Isiah Smalls',
     '2026-02-15',
     'love',
     true),

    -- 42
    ('Knit Together in Love',
     'Colossians 2:2',
     'That their hearts might be comforted, being knit together in love, and unto all riches of the full assurance of understanding, to the acknowledgement of the mystery of God, and of the Father, and of Christ.',
     'God''s design for the church is that we would be knit together in love, each thread strengthening the whole fabric. When we love one another deeply, our hearts are comforted and our faith is strengthened. Let us weave our lives together in love.',
     'FBC Devotional Team',
     '2026-02-25',
     'love',
     true),

    -- 43
    ('A Heart of Compassion',
     'Colossians 3:12',
     'Put on therefore, as the elect of God, holy and beloved, bowels of mercies, kindness, humbleness of mind, meekness, longsuffering.',
     'As God''s chosen people, we are called to clothe ourselves in compassion, kindness, humility, gentleness, and patience. These are not optional accessories but essential garments for every believer. Put them on today as deliberately as you put on your clothes.',
     'FBC Prayer Ministry',
     '2026-03-07',
     'love',
     true),

    -- 44
    ('The Prodigal''s Father',
     'Luke 15:20',
     'And he arose, and came to his father. But when he was yet a great way off, his father saw him, and had compassion, and ran, and fell on his neck, and kissed him.',
     'The father in this story represents our heavenly Father who watches and waits for His children to come home. He does not stand with crossed arms and a scowl; He runs to embrace us with open arms and overwhelming love. God''s love welcomes us home no matter how far we have strayed.',
     'FBC Bible Study Ministry',
     '2026-03-17',
     'love',
     true),

    -- 45
    ('Love Hopes All Things',
     'I Corinthians 13:7',
     'Beareth all things, believeth all things, hopeth all things, endureth all things.',
     'Love never gives up hope for people. It believes in their potential even when they have failed repeatedly. When the world writes someone off, love continues to hope and pray for transformation. Keep hoping for the people God has placed on your heart.',
     'Pastor Isiah Smalls',
     '2026-03-27',
     'love',
     true),

    -- 46
    ('United in Love',
     'I Peter 3:8',
     'Finally, be ye all of one mind, having compassion one of another, love as brethren, be pitiful, be courteous.',
     'Unity in the church is built on the foundation of love. When we are compassionate, courteous, and sympathetic toward one another, we create a community that reflects the heart of God. Strive for unity in your relationships and let love be the bond.',
     'FBC Devotional Team',
     '2026-04-06',
     'love',
     true),

    -- 47
    ('Speaking the Truth in Love',
     'Ephesians 4:15',
     'But speaking the truth in love, may grow up into him in all things, which is the head, even Christ.',
     'Truth without love can be harsh, and love without truth can be misleading. God calls us to combine both, speaking truth wrapped in genuine love. This balance helps us grow into maturity and reflect the character of Christ in all our relationships.',
     'FBC Prayer Ministry',
     '2026-04-16',
     'love',
     true),

    -- 48
    ('A Legacy of Love',
     'I John 4:7',
     'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.',
     'Love is the clearest evidence that we know God. A life marked by love leaves a legacy that endures beyond our years on earth. The greatest gift you can leave behind is not wealth or fame but a reputation for loving others well.',
     'FBC Bible Study Ministry',
     '2026-04-26',
     'love',
     true),

    -- 49
    ('Love Is the Greatest',
     'I Corinthians 13:13',
     'And now abideth faith, hope, charity, these three; but the greatest of these is charity.',
     'Faith, hope, and love are the three things that endure, but the greatest is love. Faith will one day give way to sight, and hope will be fulfilled, but love will continue forever. Invest your life in what matters most: loving God and loving people.',
     'Pastor Isiah Smalls',
     '2026-05-06',
     'love',
     true),

    -- 50
    ('The Wellspring of Love',
     'Proverbs 4:23',
     'Keep thy heart with all diligence; for out of it are the issues of life.',
     'The heart is the source from which love flows. Guard it carefully, fill it with God''s Word, and keep it tender before Him. When your heart is right with God, love will flow from it naturally, touching every relationship and every situation you encounter.',
     'FBC Devotional Team',
     '2026-05-16',
     'love',
     true);

    -- ========================================================================
    -- WORSHIP (50 devotionals)
    -- ========================================================================

    INSERT INTO devotionals (title, scripture, scripture_text, body, author, date, category, is_published) VALUES

    -- 1
    ('Praise the Lord at All Times',
     'Psalm 34:1',
     'I will bless the LORD at all times: his praise shall continually be in my mouth.',
     'Praise is not reserved for good times; it is a constant offering from grateful hearts. David declared that he would bless the Lord at all times, in every season and every circumstance. Make praise your first response today, regardless of what you are facing.',
     'FBC Worship Team',
     '2025-01-09',
     'worship',
     true),

    -- 2
    ('Worship in Spirit and Truth',
     'John 4:24',
     'God is a Spirit: and they that worship him must worship him in spirit and in truth.',
     'True worship goes beyond external rituals and reaches the depths of our spirit. God desires worship that is sincere, authentic, and grounded in the truth of who He is. Let your worship today flow from a genuine heart that seeks to honor God in spirit and truth.',
     'Pastor Isiah Smalls',
     '2025-01-19',
     'worship',
     true),

    -- 3
    ('Enter His Gates with Thanksgiving',
     'Psalm 100:4',
     'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.',
     'Thanksgiving is the gateway to God''s presence. When we approach Him with grateful hearts, we position ourselves to experience His glory. Begin every prayer, every worship service, and every day by counting your blessings and thanking God for His goodness.',
     'FBC Worship Team',
     '2025-01-29',
     'worship',
     true),

    -- 4
    ('Lifting Holy Hands',
     'I Timothy 2:8',
     'I will therefore that men pray every where, lifting up holy hands, without wrath and doubting.',
     'Lifting our hands in worship is an outward expression of an inward surrender. It signifies our complete dependence on God and our desire to receive from Him. Lift your hands in worship today, free from anger and doubt, and let your spirit soar.',
     'FBC Prayer Ministry',
     '2025-02-08',
     'worship',
     true),

    -- 5
    ('Make a Joyful Noise',
     'Psalm 100:1',
     'Make a joyful noise unto the LORD, all ye lands.',
     'God does not require perfect pitch or polished performances; He asks for joyful noise. Every voice lifted in praise is beautiful to His ears because it comes from a heart that loves Him. Do not hold back your praise; let it ring out with joy and abandon.',
     'FBC Worship Team',
     '2025-02-18',
     'worship',
     true),

    -- 6
    ('Glorifying God in Everything',
     'I Corinthians 10:31',
     'Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.',
     'Worship is not limited to Sunday mornings. Every meal, every task, and every interaction is an opportunity to glorify God. When we live with this mindset, our entire lives become an act of worship, and every moment carries sacred significance.',
     'FBC Devotional Team',
     '2025-02-28',
     'worship',
     true),

    -- 7
    ('A Heart of Devotion',
     'Psalm 63:3-4',
     'Because thy lovingkindness is better than life, my lips shall praise thee. Thus will I bless thee while I live: I will lift up my hands in thy name.',
     'David valued God''s lovingkindness more than life itself. This level of devotion transforms ordinary worship into extraordinary encounters with the living God. Let your heart be so captivated by His love that praise flows naturally from your lips.',
     'FBC Worship Team',
     '2025-03-10',
     'worship',
     true),

    -- 8
    ('Thanksgiving as a Sacrifice',
     'Psalm 107:22',
     'And let them sacrifice the sacrifices of thanksgiving, and declare his works with rejoicing.',
     'Sometimes praise is a sacrifice because we do not feel like giving it. In those moments, thanksgiving becomes our most powerful offering. When we choose to thank God in difficult times, we demonstrate a faith that moves the heart of heaven.',
     'FBC Prayer Ministry',
     '2025-03-20',
     'worship',
     true),

    -- 9
    ('Exalting the Lord Together',
     'Psalm 34:3',
     'O magnify the LORD with me, and let us exalt his name together.',
     'Corporate worship is a powerful expression of our shared faith. When we come together to magnify the Lord, our collective praise creates an atmosphere where God''s presence is tangibly felt. Invite others to join you in exalting His name.',
     'FBC Worship Team',
     '2025-03-30',
     'worship',
     true),

    -- 10
    ('Reverence and Awe',
     'Hebrews 12:28',
     'Wherefore we receiving a kingdom which cannot be moved, let us have grace, whereby we may serve God acceptably with reverence and godly fear.',
     'Reverence is the recognition of who God is and who we are in comparison. When we approach God with holy awe, our worship deepens beyond casual familiarity into profound intimacy. Serve God today with both reverence and grateful joy.',
     'Pastor Isiah Smalls',
     '2025-04-09',
     'worship',
     true),

    -- 11
    ('Singing a New Song',
     'Psalm 96:1',
     'O sing unto the LORD a new song: sing unto the LORD, all the earth.',
     'God invites us to sing new songs of praise, fresh expressions of worship that spring from current experiences of His faithfulness. Do not let your worship become stale or routine; find new ways to express your love and gratitude to the Lord today.',
     'FBC Worship Team',
     '2025-04-19',
     'worship',
     true),

    -- 12
    ('The Beauty of Holiness',
     'Psalm 29:2',
     'Give unto the LORD the glory due unto his name; worship the LORD in the beauty of holiness.',
     'Worshipping God in the beauty of holiness means coming before Him with pure hearts and clean hands. Holiness is not about perfection but about consecration, setting ourselves apart for His glory. Let your worship today be adorned with the beauty of a holy life.',
     'FBC Devotional Team',
     '2025-04-29',
     'worship',
     true),

    -- 13
    ('Clap Your Hands',
     'Psalm 47:1',
     'O clap your hands, all ye people; shout unto God with the voice of triumph.',
     'Worship is sometimes quiet and reflective, but there are also moments when it calls for exuberant celebration. Clapping, shouting, and dancing before the Lord are all biblical expressions of praise. Let your whole body join in worshipping the God who has given you victory.',
     'FBC Worship Team',
     '2025-05-09',
     'worship',
     true),

    -- 14
    ('The Fragrance of Worship',
     'II Corinthians 2:15',
     'For we are unto God a sweet savour of Christ, in them that are saved, and in them that perish.',
     'Our worship rises to God like a sweet fragrance. Every prayer, every song, and every act of obedience is a pleasing aroma before the throne. Let your life carry the fragrance of worship wherever you go, attracting others to the beauty of Christ.',
     'FBC Prayer Ministry',
     '2025-05-19',
     'worship',
     true),

    -- 15
    ('Wait Upon the Lord',
     'Psalm 27:4',
     'One thing have I desired of the LORD, that will I seek after; that I may dwell in the house of the LORD all the days of my life, to behold the beauty of the LORD, and to enquire in his temple.',
     'David''s single greatest desire was to dwell in God''s presence and behold His beauty. When worship becomes our greatest longing, everything else falls into its proper place. Seek the Lord''s face above all else and discover the beauty of His presence.',
     'FBC Worship Team',
     '2025-05-29',
     'worship',
     true),

    -- 16
    ('Worship Through Giving',
     'II Corinthians 9:7',
     'Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.',
     'Giving is a form of worship that expresses our trust in God''s provision. When we give cheerfully and generously, we declare that God is our source and that we trust Him more than money. Let your giving today be an act of worship from a grateful heart.',
     'FBC Devotional Team',
     '2025-06-08',
     'worship',
     true),

    -- 17
    ('Praising God in the Storm',
     'Acts 16:25',
     'And at midnight Paul and Silas prayed, and sang praises unto God: and the prisoners heard them.',
     'Paul and Silas chose to worship God at midnight from a prison cell. Their praise was so powerful that it shook the foundations of the prison. When you find yourself in a difficult place, let praise be your response and watch God move on your behalf.',
     'FBC Worship Team',
     '2025-06-18',
     'worship',
     true),

    -- 18
    ('Bowing Before the King',
     'Psalm 95:6',
     'O come, let us worship and bow down: let us kneel before the LORD our maker.',
     'Bowing and kneeling before God is an act of humility and reverence. It acknowledges that He is the Creator and we are His creation. Take a moment today to physically bow before the Lord, surrendering your pride and acknowledging His supreme authority.',
     'Pastor Isiah Smalls',
     '2025-06-28',
     'worship',
     true),

    -- 19
    ('Instruments of Praise',
     'Psalm 150:3-5',
     'Praise him with the sound of the trumpet: praise him with the psaltery and harp. Praise him with the timbrel and dance: praise him with stringed instruments and organs. Praise him upon the loud cymbals: praise him upon the high sounding cymbals.',
     'God delights in diverse expressions of praise. Trumpets, harps, drums, strings, cymbals, and dance all have a place in worship. Use whatever gifts and instruments God has given you to create a symphony of praise that honors the Creator of music itself.',
     'FBC Worship Team',
     '2025-07-08',
     'worship',
     true),

    -- 20
    ('Worship as a Lifestyle',
     'Romans 12:1',
     'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.',
     'Worship is not something we do for an hour on Sunday; it is how we live every day. Presenting our bodies as living sacrifices means that our work, our relationships, and our daily routines all become acts of worship when done for God''s glory.',
     'FBC Devotional Team',
     '2025-07-18',
     'worship',
     true),

    -- 21
    ('Dancing Before the Lord',
     'II Samuel 6:14',
     'And David danced before the LORD with all his might; and David was girded with a linen ephod.',
     'David danced before the Lord with complete abandon, unconcerned about what others thought. True worship sometimes calls us to express our joy in ways that go beyond our comfort zone. Do not let self-consciousness rob you of the freedom to praise God with your whole being.',
     'FBC Worship Team',
     '2025-07-28',
     'worship',
     true),

    -- 22
    ('The Heavenly Worship',
     'Revelation 4:11',
     'Thou art worthy, O Lord, to receive glory and honour and power: for thou hast created all things, and for thy pleasure they are and were created.',
     'In heaven, worship never ceases. The heavenly beings declare God''s worthiness day and night. We were created for His pleasure, and when we worship, we join the eternal chorus that echoes throughout the cosmos. Let your praise connect with heaven''s song today.',
     'Pastor Isiah Smalls',
     '2025-08-07',
     'worship',
     true),

    -- 23
    ('Still and Know',
     'Psalm 46:10',
     'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
     'Sometimes the most profound worship happens in silence. Being still before God allows us to hear His voice and sense His presence in ways that noise and activity cannot provide. Take time today to be still and simply know that He is God.',
     'FBC Worship Team',
     '2025-08-17',
     'worship',
     true),

    -- 24
    ('All Creation Worships',
     'Psalm 19:1',
     'The heavens declare the glory of God; and the firmament sheweth his handywork.',
     'All of creation joins in worship of the Creator. The stars, the mountains, the oceans, and the forests all declare His glory. When we worship, we join a chorus that began at the dawn of creation and will echo throughout eternity. Add your voice to the song.',
     'FBC Devotional Team',
     '2025-08-27',
     'worship',
     true),

    -- 25
    ('Praise Is Our Weapon',
     'II Chronicles 20:22',
     'And when they began to sing and to praise, the LORD set ambushments against the enemies of the children of Judah; and they were smitten.',
     'Jehoshaphat discovered that praise is a powerful weapon against the enemy. When the people began to sing and praise, God defeated their enemies. Your praise today is not just worship; it is spiritual warfare that sends the enemy fleeing.',
     'FBC Worship Team',
     '2025-09-06',
     'worship',
     true),

    -- 26
    ('Morning Worship',
     'Psalm 5:3',
     'My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.',
     'Beginning the day with worship sets the tone for everything that follows. When we direct our first thoughts and words toward God, we invite His presence to accompany us throughout the day. Make morning worship a non-negotiable part of your daily routine.',
     'FBC Prayer Ministry',
     '2025-09-16',
     'worship',
     true),

    -- 27
    ('The Altar of Praise',
     'Hebrews 13:15',
     'By him therefore let us offer the sacrifice of praise to God continually, that is, the fruit of our lips giving thanks to his name.',
     'The altar of praise is one we build with our words. Continual praise means that thanksgiving flows from our lips throughout the day, not just during designated worship times. Build your altar of praise with every grateful word and every song of thanksgiving.',
     'FBC Worship Team',
     '2025-09-26',
     'worship',
     true),

    -- 28
    ('Worship in Giving Thanks',
     'I Thessalonians 5:18',
     'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
     'Giving thanks in everything is the will of God for our lives. This does not mean being thankful for every situation but in every situation. Even in difficult times, we can find reasons to thank God because His character never changes.',
     'FBC Devotional Team',
     '2025-10-06',
     'worship',
     true),

    -- 29
    ('Declaring His Wonders',
     'Psalm 96:3',
     'Declare his glory among the heathen, his wonders among all people.',
     'Worship overflows into testimony when we declare God''s wonders to those around us. Every miracle, every answered prayer, and every evidence of His faithfulness is a story worth sharing. Declare His glory today and let others know what He has done.',
     'FBC Worship Team',
     '2025-10-16',
     'worship',
     true),

    -- 30
    ('A Thankful Heart',
     'Colossians 3:15',
     'And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.',
     'A thankful heart is a worshipping heart. When gratitude governs our thoughts, complaining has no room to grow. Let the peace of God rule in your heart today and let thankfulness be the atmosphere in which you live and breathe.',
     'Pastor Isiah Smalls',
     '2025-10-26',
     'worship',
     true),

    -- 31
    ('Holy, Holy, Holy',
     'Isaiah 6:3',
     'And one cried unto another, and said, Holy, holy, holy, is the LORD of hosts: the whole earth is full of his glory.',
     'The seraphim cry out day and night declaring God''s holiness. Three times they repeat the word holy, emphasizing the absolute perfection and purity of our God. Join the heavenly chorus today and declare the holiness of the One who sits on the throne.',
     'FBC Worship Team',
     '2025-11-05',
     'worship',
     true),

    -- 32
    ('Singing with Grace',
     'Colossians 3:16',
     'Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord.',
     'When the Word of Christ dwells richly in us, it naturally produces songs of worship. Psalms, hymns, and spiritual songs become the overflow of a heart saturated with Scripture. Fill your heart with His Word and let it pour out in joyful worship.',
     'FBC Devotional Team',
     '2025-11-15',
     'worship',
     true),

    -- 33
    ('Praising God for His Works',
     'Psalm 145:10',
     'All thy works shall praise thee, O LORD; and thy saints shall bless thee.',
     'Every work of God''s hands is worthy of praise. From the smallest wildflower to the vast expanse of the universe, His creation speaks of His power and creativity. Open your eyes to the works of God around you today and let them inspire fresh praise.',
     'FBC Worship Team',
     '2025-11-25',
     'worship',
     true),

    -- 34
    ('Night Songs',
     'Psalm 42:8',
     'Yet the LORD will command his lovingkindness in the daytime, and in the night his song shall be with me, and my prayer unto the God of my life.',
     'God gives us songs in the night, melodies that rise even in our darkest hours. When sleep escapes you and worry presses in, let a worship song fill your heart and mind. His song turns the midnight hour into a sacred encounter with His presence.',
     'FBC Prayer Ministry',
     '2025-12-05',
     'worship',
     true),

    -- 35
    ('Let Everything Praise the Lord',
     'Psalm 150:6',
     'Let every thing that hath breath praise the LORD. Praise ye the LORD.',
     'If you have breath in your lungs, you have reason to praise the Lord. Praise is not optional; it is the purpose for which we were given life. Every breath is a gift, and every gift calls for gratitude. Use the breath God has given you today to praise His name.',
     'FBC Worship Team',
     '2025-12-15',
     'worship',
     true),

    -- 36
    ('Offering Ourselves',
     'Psalm 51:17',
     'The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise.',
     'The most precious offering we can bring to God is a humble, broken spirit. He does not desire elaborate performances; He desires authentic hearts. Come before Him today with honesty and humility, and He will receive your worship with open arms.',
     'Pastor Isiah Smalls',
     '2025-12-25',
     'worship',
     true),

    -- 37
    ('Psalms of Ascent',
     'Psalm 122:1',
     'I was glad when they said unto me, Let us go into the house of the LORD.',
     'The psalmist''s heart leaped with joy at the invitation to worship. Going to the house of the Lord was not an obligation but a delight. Let your heart be filled with gladness every time you have the opportunity to gather with God''s people for worship.',
     'FBC Worship Team',
     '2026-01-08',
     'worship',
     true),

    -- 38
    ('Worship and Warfare',
     'II Chronicles 20:21',
     'And when he had consulted with the people, he appointed singers unto the LORD, and that should praise the beauty of holiness, as they went out before the army, and to say, Praise the LORD; for his mercy endureth for ever.',
     'Jehoshaphat placed the worship team ahead of the army because he understood that praise prepares the way for victory. When you lead with worship, you invite God''s power into your battles. Praise your way through the challenges you face today.',
     'FBC Devotional Team',
     '2026-01-18',
     'worship',
     true),

    -- 39
    ('Gratitude Unlocks Blessing',
     'Psalm 103:2',
     'Bless the LORD, O my soul, and forget not all his benefits.',
     'Forgetfulness is the enemy of gratitude. When we forget what God has done, our praise grows cold. David commanded his own soul to remember and bless the Lord. Take time today to recall God''s benefits in your life and let thanksgiving rise from your heart.',
     'FBC Worship Team',
     '2026-01-28',
     'worship',
     true),

    -- 40
    ('Created to Worship',
     'Isaiah 43:21',
     'This people have I formed for myself; they shall shew forth my praise.',
     'You were formed by God for the purpose of declaring His praise. Worship is not an add-on to your life; it is the very reason you exist. When you worship, you are fulfilling the deepest purpose of your creation. Live out your divine design today.',
     'FBC Prayer Ministry',
     '2026-02-07',
     'worship',
     true),

    -- 41
    ('The River of Praise',
     'Psalm 98:4',
     'Make a joyful noise unto the LORD, all the earth: make a loud noise, and rejoice, and sing praise.',
     'Let praise flow from your heart like a river, unrestrained and full of joy. Do not dam up what God wants to pour through you. Open the floodgates of worship and let His praise fill your home, your workplace, and every space you occupy.',
     'FBC Worship Team',
     '2026-02-17',
     'worship',
     true),

    -- 42
    ('Worshipping Through Obedience',
     'I Samuel 15:22',
     'And Samuel said, Hath the LORD as great delight in burnt offerings and sacrifices, as in obeying the voice of the LORD? Behold, to obey is better than sacrifice, and to hearken than the fat of rams.',
     'The highest form of worship is obedience. God would rather have our submission to His will than elaborate religious ceremonies. When we obey His voice promptly and completely, we offer the most pleasing worship possible.',
     'Pastor Isiah Smalls',
     '2026-02-27',
     'worship',
     true),

    -- 43
    ('A Song in the Heart',
     'Ephesians 5:19',
     'Speaking to yourselves in psalms and hymns and spiritual songs, singing and making melody in your heart to the Lord.',
     'Worship begins in the heart before it ever reaches the lips. The melody of praise that plays within your spirit is heard by God before anyone else. Let the song in your heart play continuously today, a private concert for the audience of One.',
     'FBC Worship Team',
     '2026-03-09',
     'worship',
     true),

    -- 44
    ('Standing in His Presence',
     'Psalm 84:10',
     'For a day in thy courts is better than a thousand. I had rather be a doorkeeper in the house of my God, than to dwell in the tents of wickedness.',
     'One day in God''s presence is worth more than a thousand days anywhere else. The psalmist would rather serve in the humblest position in God''s house than enjoy the greatest luxuries the world offers. Value His presence above all earthly comforts.',
     'FBC Devotional Team',
     '2026-03-19',
     'worship',
     true),

    -- 45
    ('Great Is the Lord',
     'Psalm 145:3',
     'Great is the LORD, and greatly to be praised; and his greatness is unsearchable.',
     'God''s greatness is beyond our ability to fully comprehend, yet we are called to praise Him greatly. Let the vastness of His power, wisdom, and love inspire worship that rises higher than our circumstances. He is great, and He deserves our greatest praise.',
     'FBC Worship Team',
     '2026-03-29',
     'worship',
     true),

    -- 46
    ('The House of Prayer',
     'Isaiah 56:7',
     'Even them will I bring to my holy mountain, and make them joyful in my house of prayer: their burnt offerings and their sacrifices shall be accepted upon mine altar; for mine house shall be called an house of prayer for all people.',
     'God''s house is a house of prayer for all people. When we gather for worship, prayer is the foundation upon which everything else is built. Let prayer fuel your worship and worship deepen your prayer life. Together they create a powerful connection with God.',
     'FBC Prayer Ministry',
     '2026-04-08',
     'worship',
     true),

    -- 47
    ('Shouting for Joy',
     'Psalm 5:11',
     'But let all those that put their trust in thee rejoice: let them ever shout for joy, because thou defendest them: let them also that love thy name be joyful in thee.',
     'There are moments when a whispered prayer is not enough and our worship demands a shout. When God defends us, delivers us, and blesses us, a shout of joy is the most natural response. Do not be afraid to raise your voice in jubilant praise to your defender.',
     'FBC Worship Team',
     '2026-04-18',
     'worship',
     true),

    -- 48
    ('Worship and Rest',
     'Psalm 23:2-3',
     'He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name''s sake.',
     'Sometimes the greatest act of worship is simply resting in God''s presence. He leads us to green pastures and still waters not to rush us but to restore us. Let worship slow you down today and allow your soul to be refreshed by the Shepherd''s gentle care.',
     'FBC Devotional Team',
     '2026-04-28',
     'worship',
     true),

    -- 49
    ('Worthy Is the Lamb',
     'Revelation 5:12',
     'Saying with a loud voice, Worthy is the Lamb that was slain to receive power, and riches, and wisdom, and strength, and honour, and glory, and blessing.',
     'Jesus, the Lamb who was slain, is worthy of every form of praise we can offer. He deserves power, riches, wisdom, strength, honor, glory, and blessing. Join the heavenly chorus today and declare with a loud voice that Jesus Christ is worthy of all our worship.',
     'FBC Worship Team',
     '2026-05-08',
     'worship',
     true),

    -- 50
    ('Forever Worship',
     'Psalm 145:1-2',
     'I will extol thee, my God, O king; and I will bless thy name for ever and ever. Every day will I bless thee; and I will praise thy name for ever and ever.',
     'Worship is not a temporary activity; it is an eternal calling. Every day we bless the Lord, and one day we will praise Him face to face in glory. Let your worship today be a rehearsal for the eternal praise we will offer before His throne forever.',
     'Pastor Isiah Smalls',
     '2026-05-18',
     'worship',
     true);

  END IF;
END $$;


-- ============================================================================
-- 4. CREATE SMS_LOG TABLE FOR TWILIO SMS HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by UUID REFERENCES profiles(id),
  recipient_group TEXT NOT NULL,
  message TEXT NOT NULL,
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read SMS logs
CREATE POLICY "Admins can read sms_log"
  ON sms_log FOR SELECT
  USING (is_admin());

-- Only admins can insert SMS logs
CREATE POLICY "Admins can insert sms_log"
  ON sms_log FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update SMS logs
CREATE POLICY "Admins can update sms_log"
  ON sms_log FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete SMS logs
CREATE POLICY "Admins can delete sms_log"
  ON sms_log FOR DELETE
  USING (is_admin());


-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_devotionals_category ON devotionals(category);
CREATE INDEX IF NOT EXISTS idx_sms_log_sent_by ON sms_log(sent_by);
CREATE INDEX IF NOT EXISTS idx_sms_log_created_at ON sms_log(created_at);
