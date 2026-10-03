-- Project Star seed data (mirrors backend/src/seed.ts)
-- Passwords: admin=AdminPass1, demo & bots=DemoPass1 (bcrypt, cost 12)

-- Core users
INSERT INTO "User" ("email", "username", "passwordHash", "role", "emailVerified", "status", "createdAt", "updatedAt")
VALUES ('admin@projectstar.app', 'admin', '$2a$12$OJ.4jTjFtPIIxbPL.T/4ouBzhYb87UU6YoTG4Qis7.j2S.EPQU4mi', 'SUPER_ADMIN', true, 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
INSERT INTO "Profile" ("userId", "bio", "onboardingCompleted", "createdAt", "updatedAt")
SELECT "id", 'System administrator', false, NOW(), NOW() FROM "User" WHERE "email" = 'admin@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "Profile" p WHERE p."userId" = "User"."id");
INSERT INTO "UserPreference" ("userId", "createdAt", "updatedAt")
SELECT "id", NOW(), NOW() FROM "User" WHERE "email" = 'admin@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserPreference" p WHERE p."userId" = "User"."id");
INSERT INTO "UserStardust" ("userId", "balance", "updatedAt")
SELECT "id", 9999, NOW() FROM "User" WHERE "email" = 'admin@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserStardust" s WHERE s."userId" = "User"."id");

INSERT INTO "User" ("email", "username", "passwordHash", "role", "emailVerified", "status", "createdAt", "updatedAt")
VALUES ('demo@projectstar.app', 'stargazer', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;
INSERT INTO "Profile" ("userId", "bio", "country", "gender", "birthDate", "onboardingCompleted", "createdAt", "updatedAt")
SELECT "id", 'Hello from the stars!', 'Turkey', 'PREFER_NOT_TO_SAY', NOW() - INTERVAL '25 years', true, NOW(), NOW() FROM "User" WHERE "email" = 'demo@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "Profile" p WHERE p."userId" = "User"."id");
INSERT INTO "UserPreference" ("userId", "preferredGender", "minAge", "maxAge", "conversationGoals", "createdAt", "updatedAt")
SELECT "id", 'EVERYONE', 18, 35, '["Friendship","Casual"]', NOW(), NOW() FROM "User" WHERE "email" = 'demo@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserPreference" p WHERE p."userId" = "User"."id");
INSERT INTO "UserStardust" ("userId", "balance", "updatedAt")
SELECT "id", 500, NOW() FROM "User" WHERE "email" = 'demo@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserStardust" s WHERE s."userId" = "User"."id");
INSERT INTO "UserLanguage" ("userId", "language", "level")
SELECT "id", l.lang, l.lvl FROM "User", (VALUES ('Turkish','NATIVE'), ('English','FLUENT')) AS l(lang, lvl)
WHERE "email" = 'demo@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserLanguage" ul WHERE ul."userId" = "User"."id");
INSERT INTO "UserInterest" ("userId", "interest")
SELECT "id", i.interest FROM "User", (VALUES ('Music'), ('Travel'), ('Gaming')) AS i(interest)
WHERE "email" = 'demo@projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserInterest" ui WHERE ui."userId" = "User"."id");

-- Bot users
INSERT INTO "User" ("email", "username", "passwordHash", "role", "emailVerified", "status", "createdAt", "updatedAt")
VALUES
  ('luna@bots.projectstar.app', 'luna', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('orion@bots.projectstar.app', 'orion', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('nova@bots.projectstar.app', 'nova', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('cosmo@bots.projectstar.app', 'cosmo', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('aurora@bots.projectstar.app', 'aurora', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('nebula@bots.projectstar.app', 'nebula', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('quasar@bots.projectstar.app', 'quasar', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('stella@bots.projectstar.app', 'stella', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('comet@bots.projectstar.app', 'comet', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('eclipse@bots.projectstar.app', 'eclipse', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('sol@bots.projectstar.app', 'sol', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW()),
  ('astra@bots.projectstar.app', 'astra', '$2a$12$yzKe6iwYD5Qnn5Puo4zQBe7VNnoEcZq9WbtS5YBoqPNhG4EdeYTVu', 'USER', true, 'ACTIVE', NOW(), NOW())
ON CONFLICT ("email") DO NOTHING;

-- Bot profiles
INSERT INTO "Profile" ("userId", "bio", "country", "gender", "birthDate", "onboardingCompleted", "createdAt", "updatedAt")
SELECT u."id", p.bio, p.country, p.gender, NOW() - (p.age || ' years')::interval, true, NOW(), NOW()
FROM "User" u
JOIN (VALUES
  ('luna', 'Dreamer who loves indie music and old cities.', 'Italy', 'FEMALE', 24),
  ('orion', 'Night owl, gamer, and stargazer.', 'Germany', 'MALE', 29),
  ('nova', 'Always chasing sunsets and good conversations.', 'Japan', 'NON_BINARY', 26),
  ('cosmo', 'Football fan with a playlist for every mood.', 'Brazil', 'MALE', 31),
  ('aurora', 'Quiet reader, loud thinker.', 'Norway', 'FEMALE', 28),
  ('nebula', 'Loves cinema, coffee, and late-night talks.', 'France', 'FEMALE', 23),
  ('quasar', 'Entrepreneur learning to slow down.', 'United States', 'MALE', 33),
  ('stella', 'K-pop and RPG enthusiast.', 'South Korea', 'FEMALE', 22),
  ('comet', 'Road trip lover with a camera.', 'Canada', 'MALE', 27),
  ('eclipse', 'Curious about almost everything.', 'United Kingdom', 'NON_BINARY', 30),
  ('sol', 'Chef in training, music lover.', 'Spain', 'MALE', 25),
  ('astra', 'Bollywood fan and sketch artist.', 'India', 'FEMALE', 21)
) AS p(username, bio, country, gender, age) ON p.username = u."username"
WHERE u."email" LIKE '%@bots.projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "Profile" pr WHERE pr."userId" = u."id");

-- Bot preferences
INSERT INTO "UserPreference" ("userId", "preferredGender", "minAge", "maxAge", "conversationGoals", "createdAt", "updatedAt")
SELECT u."id", 'EVERYONE', 18, 40, '["' || array_to_string(ARRAY[p.g1, p.g2], '","') || '"]', NOW(), NOW()
FROM "User" u
JOIN (VALUES
  ('luna', 'Culture exchange', 'Music'),
  ('orion', 'Gaming friends', 'Deep conversations'),
  ('nova', 'Travel', 'Friendship'),
  ('cosmo', 'Casual', 'Music'),
  ('aurora', 'Deep conversations', 'Culture exchange'),
  ('nebula', 'Random discoveries', 'Friendship'),
  ('quasar', 'Life', 'Deep conversations'),
  ('stella', 'Gaming friends', 'Casual'),
  ('comet', 'Travel', 'Friendship'),
  ('eclipse', 'Deep conversations', 'Random discoveries'),
  ('sol', 'Culture exchange', 'Life'),
  ('astra', 'Friendship', 'Culture exchange')
) AS p(username, g1, g2) ON p.username = u."username"
WHERE u."email" LIKE '%@bots.projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserPreference" pr WHERE pr."userId" = u."id");

-- Bot stardust
INSERT INTO "UserStardust" ("userId", "balance", "updatedAt")
SELECT u."id", 200 + (u."id" * 37) % 500, NOW()
FROM "User" u
WHERE u."email" LIKE '%@bots.projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserStardust" s WHERE s."userId" = u."id");

-- Bot languages
INSERT INTO "UserLanguage" ("userId", "language", "level")
SELECT u."id", l.lang, l.lvl
FROM "User" u
JOIN (VALUES
  ('luna', 'Italian', 'NATIVE'), ('luna', 'English', 'FLUENT'),
  ('orion', 'German', 'NATIVE'), ('orion', 'English', 'FLUENT'),
  ('nova', 'Japanese', 'NATIVE'), ('nova', 'English', 'FLUENT'),
  ('cosmo', 'Portuguese', 'NATIVE'), ('cosmo', 'Spanish', 'FLUENT'),
  ('aurora', 'Norwegian', 'NATIVE'), ('aurora', 'English', 'FLUENT'),
  ('nebula', 'French', 'NATIVE'), ('nebula', 'English', 'FLUENT'),
  ('quasar', 'English', 'NATIVE'),
  ('stella', 'Korean', 'NATIVE'), ('stella', 'English', 'FLUENT'),
  ('comet', 'English', 'NATIVE'), ('comet', 'French', 'FLUENT'),
  ('eclipse', 'English', 'NATIVE'),
  ('sol', 'Spanish', 'NATIVE'), ('sol', 'English', 'FLUENT'),
  ('astra', 'Hindi', 'NATIVE'), ('astra', 'English', 'FLUENT')
) AS l(username, lang, lvl) ON l.username = u."username"
WHERE u."email" LIKE '%@bots.projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserLanguage" ul WHERE ul."userId" = u."id" AND ul."language" = l.lang);

-- Bot interests
INSERT INTO "UserInterest" ("userId", "interest")
SELECT u."id", i.interest
FROM "User" u
JOIN (VALUES
  ('luna', 'Music'), ('luna', 'Travel'), ('luna', 'Art'),
  ('orion', 'Gaming'), ('orion', 'Technology'), ('orion', 'Science'),
  ('nova', 'Photography'), ('nova', 'Nature'), ('nova', 'Travel'),
  ('cosmo', 'Sports'), ('cosmo', 'Music'), ('cosmo', 'Food'),
  ('aurora', 'Nature'), ('aurora', 'Books'), ('aurora', 'History'),
  ('nebula', 'Fashion'), ('nebula', 'Art'), ('nebula', 'Movies'),
  ('quasar', 'Technology'), ('quasar', 'Business'), ('quasar', 'Fitness'),
  ('stella', 'Gaming'), ('stella', 'Music'), ('stella', 'Technology'),
  ('comet', 'Travel'), ('comet', 'Photography'), ('comet', 'Sports'),
  ('eclipse', 'Science'), ('eclipse', 'Technology'), ('eclipse', 'Books'),
  ('sol', 'Food'), ('sol', 'Music'), ('sol', 'History'),
  ('astra', 'Movies'), ('astra', 'Art'), ('astra', 'Travel')
) AS i(username, interest) ON i.username = u."username"
WHERE u."email" LIKE '%@bots.projectstar.app'
AND NOT EXISTS (SELECT 1 FROM "UserInterest" ui WHERE ui."userId" = u."id" AND ui."interest" = i.interest);

-- App settings
INSERT INTO "AppSetting" ("key", "value", "category", "updatedAt") VALUES
  ('app.name', 'PROJECT STAR', 'brand', NOW()),
  ('app.slogan', 'Someone out there is waiting.', 'brand', NOW()),
  ('matching.weights', '{"interests":0.30,"age":0.20,"language":0.15,"goals":0.15,"activity":0.10,"quality":0.10,"randomness":0.30}', 'matching', NOW()),
  ('matching.diversity_ratio', '0.30', 'matching', NOW()),
  ('economy.daily_free_casts', '3', 'economy', NOW()),
  ('economy.message_cost', '0', 'economy', NOW()),
  ('economy.boost_message_price', '100', 'economy', NOW()),
  ('economy.boost_profile_price', '150', 'economy', NOW()),
  ('economy.extra_cast_price', '50', 'economy', NOW()),
  ('safety.min_age', '18', 'safety', NOW()),
  ('safety.message_expiry_days', '30', 'safety', NOW()),
  ('safety.inactive_threshold_days', '14', 'safety', NOW())
ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "category" = EXCLUDED."category";

-- Message vessels
INSERT INTO "MessageVessel" ("key", "name", "tier", "price", "description", "active") VALUES
  ('parchment', 'Parchment', 'free', 0, 'A timeless classic.', true),
  ('heart', 'Heart', 'free', 0, 'Send love across the stars.', true),
  ('basic_capsule', 'Basic Capsule', 'free', 0, 'A sturdy metal capsule.', true),
  ('star_message', 'Star Message', 'free', 0, 'A glowing star-shaped note.', true),
  ('crystal_heart', 'Crystal Heart', 'premium', 150, 'Beautiful and rare.', true),
  ('galaxy_capsule', 'Galaxy Capsule', 'premium', 200, 'Swirling cosmic colors.', true),
  ('golden_letter', 'Golden Letter', 'premium', 250, 'For messages that matter.', true),
  ('moon_message', 'Moon Message', 'premium', 180, 'Soft lunar glow.', true),
  ('saturn_capsule', 'Saturn Capsule', 'premium', 220, 'A message with rings.', true),
  ('rose_message', 'Rose Message', 'premium', 160, 'Romantic and elegant.', true)
ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "tier" = EXCLUDED."tier", "price" = EXCLUDED."price", "description" = EXCLUDED."description", "active" = true;

-- Daily missions
INSERT INTO "DailyMission" ("key", "title", "description", "reward", "active") VALUES
  ('send_message', 'Send a Message', 'Cast one message into space.', 10, true),
  ('discover_messages', 'Discover Messages', 'View 2 incoming messages.', 15, true),
  ('reply_chat', 'Start a Conversation', 'Send one chat message.', 10, true),
  ('complete_profile', 'Complete Your Profile', 'Fill all profile sections.', 50, true),
  ('return_tomorrow', 'Return Tomorrow', 'Come back tomorrow for a streak reward.', 5, true)
ON CONFLICT ("key") DO UPDATE SET "title" = EXCLUDED."title", "description" = EXCLUDED."description", "reward" = EXCLUDED."reward", "active" = true;

-- Boosts
INSERT INTO "Boost" ("key", "name", "description", "price", "durationMin", "active") VALUES
  ('message_boost', 'Message Boost', 'Your message travels faster and reaches more users.', 100, 1440, true),
  ('profile_boost', 'Profile Visibility Boost', 'Increase your chance of receiving messages.', 150, 1440, true)
ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "price" = EXCLUDED."price", "durationMin" = EXCLUDED."durationMin", "active" = true;
