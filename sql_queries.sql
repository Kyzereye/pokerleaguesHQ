-- Auth: run once to create schema. Users = login only; user_details = profile/other data.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS player_standings, game_signups, games, venues, password_reset_tokens, verification_tokens, user_details, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS users (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) DEFAULT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS user_details (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  user_id BINARY(16) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL DEFAULT '',
  last_name VARCHAR(255) NOT NULL DEFAULT '',
  role ENUM('member', 'admin', 'dealer') NOT NULL DEFAULT 'member',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  user_id BINARY(16) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  user_id BINARY(16) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Venues for Phase 3+ (games and signups). Street, city, state, zip are all required (NOT NULL).
CREATE TABLE IF NOT EXISTS venues (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  name VARCHAR(255) NOT NULL,
  street VARCHAR(512) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip VARCHAR(5) NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS games (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  venue_id BINARY(16) NOT NULL,
  game_day VARCHAR(9) NOT NULL,
  game_time TIME NOT NULL,
  notes VARCHAR(512) DEFAULT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- One signup per user per game; user may only be signed up for one game at a time (enforced in app)
CREATE TABLE IF NOT EXISTS game_signups (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  game_id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  signed_up_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY one_per_game (game_id, user_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Standings: one row per user per period (e.g. season or year)
CREATE TABLE IF NOT EXISTS player_standings (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  user_id BINARY(16) NOT NULL,
  period VARCHAR(64) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  is_demo TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY one_per_user_period (user_id, period),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed: venues (street, city, state, zip all NOT NULL)
INSERT INTO venues (id, name, street, city, state, zip) VALUES
  (UUID_TO_BIN(UUID()), '3''s Bar', '333 Main St', 'Longmont', 'CO', '80501'),
  (UUID_TO_BIN(UUID()), 'Beer Depot', '4231 W. 38th Avenue', 'Denver', 'CO', '80212'),
  (UUID_TO_BIN(UUID()), 'Berkeley Inn', '3834 Tennyson St', 'Denver', 'CO', '80212'),
  (UUID_TO_BIN(UUID()), 'Big Thompson Brewing', '114 E 15th St', 'Loveland', 'CO', '80538'),
  (UUID_TO_BIN(UUID()), 'Boise Tavern', '1475 N Boise Ave # 3', 'Loveland', 'CO', '80538'),
  (UUID_TO_BIN(UUID()), 'Bradford''s Grub & Grog', '335 Mountain Ave', 'Berthoud', 'CO', '80513'),
  (UUID_TO_BIN(UUID()), 'Charlie L''s Pub', '271 14th Street SE', 'Loveland', 'CO', '80537'),
  (UUID_TO_BIN(UUID()), 'Crabtree Brewing Company', '2961 29th St', 'Greeley', 'CO', '80634'),
  (UUID_TO_BIN(UUID()), 'Crooked Beech Taproom', '3121 N Garfield Avenue', 'Loveland', 'CO', '80538'),
  (UUID_TO_BIN(UUID()), 'Cruiser''s Neighborhood Bar', '1020 28th Avenue', 'Greeley', 'CO', '80634'),
  (UUID_TO_BIN(UUID()), 'Crave Hot Dogs & Beer', '2170 35th Avenue', 'Greeley', 'CO', '80634'),
  (UUID_TO_BIN(UUID()), 'Dillinger''s Bar & Grill', '1202 Centaur Village Drive', 'Lafayette', 'CO', '80026'),
  (UUID_TO_BIN(UUID()), 'Emperor Palace West', '6700 W 120th Ave,', 'Broomfield', 'CO', '80020'),
  (UUID_TO_BIN(UUID()), 'Hacienda Azul Mexican Grill', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Henry''s Bar & Grill', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Horsetooth Tavern', 'TBD', 'Fort Collins', 'CO', '80525'),
  (UUID_TO_BIN(UUID()), 'Lucky Shot Sports Bar', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Mad Rabbit Distillery', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Midtown Pool Club', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Mighty River Brewing Company', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'O''Hara''s Irish Pub', '1007 Broad Street', 'Milliken', 'CO', '80543'),
  (UUID_TO_BIN(UUID()), 'Olde Town Tavern', '7355 Ralston Road', 'Arvada', 'CO', '80002'),
  (UUID_TO_BIN(UUID()), 'Peculier Ales Fort Collins', 'TBD', 'Fort Collins', 'CO', '80525'),
  (UUID_TO_BIN(UUID()), 'Pepper''s Fireside Grille', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Pharaoh''s Billiards', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Pitcher''s Sports Bar', '1670 S Chambers Road', 'Aurora', 'CO', '80017'),
  (UUID_TO_BIN(UUID()), 'Point Bar & Grill', '4050 E 100th Avenue', 'Thornton', 'CO', '80233'),
  (UUID_TO_BIN(UUID()), 'Por Winehouse', '701 A. Main Street', 'Louisville', 'CO', '80027'),
  (UUID_TO_BIN(UUID()), 'Press Play Bar', '1005 Pearl Street', 'Boulder', 'CO', '80302'),
  (UUID_TO_BIN(UUID()), 'Rusty Melon - Erie', '615 Mitchell Way', 'Erie', 'CO', '80516'),
  (UUID_TO_BIN(UUID()), 'Sampan Bar and Grill', 'TBD', 'Denver', 'CO', '80202'),
  (UUID_TO_BIN(UUID()), 'Timnath Beerwerks Fort Collins', 'TBD', 'Fort Collins', 'CO', '80525'),
  (UUID_TO_BIN(UUID()), 'Verboten Brewing', 'TBD', 'Loveland', 'CO', '80537'),
  (UUID_TO_BIN(UUID()), 'Wyler''s Pub & Grill', '2385 W 27th St #513', 'Greeley', 'CO', '80634');

-- Seed games from RMPV events. Recurring weekly by game_day (poker_signup model). One row per venue+day+time.
-- Sunday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Sunday', CAST(STR_TO_DATE('4:00 PM', '%h:%i %p') AS TIME), 'Free Texas Hold''em. Win gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'Peculier Ales Fort Collins' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Sunday', CAST(STR_TO_DATE('5:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'Midtown Pool Club' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Sunday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win gift cards. Great food.' FROM venues WHERE name = 'Horsetooth Tavern' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Sunday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar tabs, bonus chips for quarterly tournament.' FROM venues WHERE name = '3''s Bar' AND is_demo = 0 LIMIT 1;
-- Monday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'Poker. Win bar gift cards, bonus chips for Verboten Brewing quarterly.' FROM venues WHERE name = 'Verboten Brewing' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'O''Hara''s Irish Pub' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Win bar gift cards. Monday spaghetti special $9.99.' FROM venues WHERE name = 'Olde Town Tavern' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar tabs, bonus chips for quarterly tournament.' FROM venues WHERE name = 'Wyler''s Pub & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Win bar tabs, bonus chips for Henry''s Bar quarterly.' FROM venues WHERE name = 'Henry''s Bar & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Monday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE Texas Hold''em. Win bar gift cards, bonus chips for quarterly.' FROM venues WHERE name = 'Dillinger''s Bar & Grill' AND is_demo = 0 LIMIT 1;
-- Tuesday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar credits, bonus chips for Crooked Beech quarterly.' FROM venues WHERE name = 'Crooked Beech Taproom' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'O''Hara''s Irish Pub' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Win bar gift cards.' FROM venues WHERE name = 'Olde Town Tavern' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE Texas Hold''em. Win bar gift cards, bonus chips for quarterly.' FROM venues WHERE name = 'Dillinger''s Bar & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE Texas Hold''em. Win bar gift cards, bonus chips for Point Bar quarterly.' FROM venues WHERE name = 'Point Bar & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Tuesday', CAST(STR_TO_DATE('7:30 PM', '%h:%i %p') AS TIME), 'Poker. Great drink prices, $5 PBJ special. Get there early.' FROM venues WHERE name = 'Press Play Bar' AND is_demo = 0 LIMIT 1;
-- Wednesday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('5:00 PM', '%h:%i %p') AS TIME), 'Poker. Great cocktails and food. Get there early.' FROM venues WHERE name = 'Mad Rabbit Distillery' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'Poker. Craft beer, bar snacks. Get there early.' FROM venues WHERE name = 'Big Thompson Brewing' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar tabs, bonus chips for Mighty River quarterly.' FROM venues WHERE name = 'Mighty River Brewing Company' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Great drink specials. Get there early.' FROM venues WHERE name = 'Cruiser''s Neighborhood Bar' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Great food and drink specials. Get there early.' FROM venues WHERE name = 'Rusty Melon - Erie' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Wednesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Wednesday Whiskey special. Get there early.' FROM venues WHERE name = 'Berkeley Inn' AND is_demo = 0 LIMIT 1;
-- Thursday (O'Hara's, Olde Town, Dillinger's also run Mon/Tue - already added)
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Thursday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar gift cards, bonus chips for Crabtree Brewery quarterly.' FROM venues WHERE name = 'Crabtree Brewing Company' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Thursday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE Texas Hold''em. Win bar gift cards, bonus chips for quarterly.' FROM venues WHERE name = 'Dillinger''s Bar & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Thursday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar gift cards, bonus chips for Beer Depot quarterly.' FROM venues WHERE name = 'Beer Depot' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Thursday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'Charlie L''s Pub' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Thursday', CAST(STR_TO_DATE('8:00 PM', '%h:%i %p') AS TIME), 'VIP poker tournament. Dress code applies.' FROM venues WHERE name = 'Por Winehouse' AND is_demo = 0 LIMIT 1;
-- Friday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Friday', CAST(STR_TO_DATE('5:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar tabs and other prizes.' FROM venues WHERE name = 'Hacienda Azul Mexican Grill' AND is_demo = 0 LIMIT 1;
-- Saturday
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Saturday', CAST(STR_TO_DATE('2:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar gift cards, bonus chips for Beer Depot quarterly.' FROM venues WHERE name = 'Beer Depot' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Saturday', CAST(STR_TO_DATE('3:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar gift cards, bonus chips for quarterly tournament.' FROM venues WHERE name = 'Charlie L''s Pub' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Saturday', CAST(STR_TO_DATE('6:00 PM', '%h:%i %p') AS TIME), 'FREE bar poker. Win bar tabs, bonus chips for Wyler''s Pub quarterly.' FROM venues WHERE name = 'Wyler''s Pub & Grill' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Saturday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Poker. Win bar gift cards, bonus chips for Boise Tavern quarterly.' FROM venues WHERE name = 'Boise Tavern' AND is_demo = 0 LIMIT 1;
INSERT INTO games (id, venue_id, game_day, game_time, notes) SELECT UUID_TO_BIN(UUID()), id, 'Saturday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'FREE poker. Win bar gift cards, bonus chips for Midtown Pool Club quarterly.' FROM venues WHERE name = 'Midtown Pool Club' AND is_demo = 0 LIMIT 1;

-- Seed user (run after schema + locations so you don't have to register each time)
-- Fixed UUID so both tables can be filled with INSERT only (no SELECT). is_demo = 0 (real).
INSERT INTO users (id, email, password_hash, email_verified_at, is_demo) VALUES
  (UUID_TO_BIN('f47ac10b-58cc-4372-a567-0e02b2c3d479'), 'kyzereye@gmail.com', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 0);
INSERT INTO user_details (id, user_id, first_name, last_name, role, status, is_demo) VALUES
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('f47ac10b-58cc-4372-a567-0e02b2c3d479'), 'jeff', 'kyzer', 'admin', 'active', 0);

-- ========== Demo data below (is_demo = 1). For testing and future marketing/client preview. ==========
-- Demo users: same password hash as seed user so you can log in as demo1@demo.local etc. with your usual password.
INSERT INTO users (id, email, password_hash, email_verified_at, is_demo) VALUES
  (UUID_TO_BIN('b0000001-58cc-4372-a567-0e02b2c3d479'), 'demo1@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000002-58cc-4372-a567-0e02b2c3d479'), 'demo2@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000003-58cc-4372-a567-0e02b2c3d479'), 'demo3@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000004-58cc-4372-a567-0e02b2c3d479'), 'demo4@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000005-58cc-4372-a567-0e02b2c3d479'), 'demo5@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000006-58cc-4372-a567-0e02b2c3d479'), 'demo6@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000007-58cc-4372-a567-0e02b2c3d479'), 'demo7@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000008-58cc-4372-a567-0e02b2c3d479'), 'demo8@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b0000009-58cc-4372-a567-0e02b2c3d479'), 'demo9@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000a-58cc-4372-a567-0e02b2c3d479'), 'demo10@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000b-58cc-4372-a567-0e02b2c3d479'), 'demo11@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000c-58cc-4372-a567-0e02b2c3d479'), 'demo12@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000d-58cc-4372-a567-0e02b2c3d479'), 'demo13@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000e-58cc-4372-a567-0e02b2c3d479'), 'demo14@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1),
  (UUID_TO_BIN('b000000f-58cc-4372-a567-0e02b2c3d479'), 'demo15@demo.local', '$2b$12$uXU/fkmPRNRKrI9vdpZmEOBFI6Ve.5q4Xs7f8xkuxoU748njlmUXi', NOW(), 1);
INSERT INTO user_details (id, user_id, first_name, last_name, role, status, is_demo) VALUES
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000001-58cc-4372-a567-0e02b2c3d479'), 'Alex', 'Demo', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000002-58cc-4372-a567-0e02b2c3d479'), 'Sam', 'Sample', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000003-58cc-4372-a567-0e02b2c3d479'), 'Jordan', 'Preview', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000004-58cc-4372-a567-0e02b2c3d479'), 'Morgan', 'Blake', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000005-58cc-4372-a567-0e02b2c3d479'), 'Riley', 'Cole', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000006-58cc-4372-a567-0e02b2c3d479'), 'Casey', 'Dunn', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000007-58cc-4372-a567-0e02b2c3d479'), 'Quinn', 'Ellis', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000008-58cc-4372-a567-0e02b2c3d479'), 'Reese', 'Ford', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000009-58cc-4372-a567-0e02b2c3d479'), 'Avery', 'Gray', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000a-58cc-4372-a567-0e02b2c3d479'), 'Parker', 'Hayes', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000b-58cc-4372-a567-0e02b2c3d479'), 'Drew', 'Ingram', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000c-58cc-4372-a567-0e02b2c3d479'), 'Skyler', 'James', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000d-58cc-4372-a567-0e02b2c3d479'), 'Cameron', 'Knight', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000e-58cc-4372-a567-0e02b2c3d479'), 'Jamie', 'Lane', 'member', 'active', 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000f-58cc-4372-a567-0e02b2c3d479'), 'Taylor', 'Moss', 'member', 'active', 1);
INSERT INTO venues (id, name, street, city, state, zip, is_demo) VALUES
  (UUID_TO_BIN('c0000001-58cc-4372-a567-0e02b2c3d479'), 'Demo Venue', '123 Demo Street', 'Demo City', 'CO', '80202', 1);
INSERT INTO games (id, venue_id, game_day, game_time, notes, is_demo) VALUES
  (UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('c0000001-58cc-4372-a567-0e02b2c3d479'), 'Tuesday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Demo game 1', 1),
  (UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('c0000001-58cc-4372-a567-0e02b2c3d479'), 'Thursday', CAST(STR_TO_DATE('7:00 PM', '%h:%i %p') AS TIME), 'Demo game 2', 1);
INSERT INTO game_signups (id, game_id, user_id, is_demo) VALUES
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000001-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000002-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000003-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000004-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000005-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000006-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000001-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000007-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000002-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000003-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000004-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000005-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000008-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b0000009-58cc-4372-a567-0e02b2c3d479'), 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('d0000002-58cc-4372-a567-0e02b2c3d479'), UUID_TO_BIN('b000000a-58cc-4372-a567-0e02b2c3d479'), 1);
INSERT INTO player_standings (id, user_id, period, points, wins, is_demo) VALUES
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000001-58cc-4372-a567-0e02b2c3d479'), 'Demo', 142, 5, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000002-58cc-4372-a567-0e02b2c3d479'), 'Demo', 128, 4, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000003-58cc-4372-a567-0e02b2c3d479'), 'Demo', 115, 4, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000004-58cc-4372-a567-0e02b2c3d479'), 'Demo', 98, 3, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000005-58cc-4372-a567-0e02b2c3d479'), 'Demo', 87, 3, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000006-58cc-4372-a567-0e02b2c3d479'), 'Demo', 76, 2, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000007-58cc-4372-a567-0e02b2c3d479'), 'Demo', 65, 2, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000008-58cc-4372-a567-0e02b2c3d479'), 'Demo', 54, 1, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b0000009-58cc-4372-a567-0e02b2c3d479'), 'Demo', 48, 1, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000a-58cc-4372-a567-0e02b2c3d479'), 'Demo', 41, 1, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000b-58cc-4372-a567-0e02b2c3d479'), 'Demo', 35, 0, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000c-58cc-4372-a567-0e02b2c3d479'), 'Demo', 28, 0, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000d-58cc-4372-a567-0e02b2c3d479'), 'Demo', 22, 0, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000e-58cc-4372-a567-0e02b2c3d479'), 'Demo', 15, 0, 1),
  (UUID_TO_BIN(UUID()), UUID_TO_BIN('b000000f-58cc-4372-a567-0e02b2c3d479'), 'Demo', 8, 0, 1);
