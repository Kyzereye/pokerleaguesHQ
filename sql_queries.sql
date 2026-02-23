-- Auth: run once to create schema. Users = login only; user_details = profile/other data.

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS password_reset_tokens, verification_tokens, user_details, users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE IF NOT EXISTS users (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
  updated_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS user_details (
  id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
  user_id BINARY(16) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL DEFAULT '',
  last_name VARCHAR(255) NOT NULL DEFAULT '',
  role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
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

-- Set a user to admin by email (uncomment and run as needed):
-- UPDATE user_details ud
-- JOIN users u ON u.id = ud.user_id
-- SET ud.role = 'admin'
-- WHERE u.email = 'kyzereye@gmail.com';
