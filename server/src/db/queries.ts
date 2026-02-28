const queries: Record<string, string> = {
  get_user_by_email: `SELECT u.id, u.email, u.password_hash, u.email_verified_at,
    ud.first_name, ud.last_name, ud.role, ud.status
FROM users u
LEFT JOIN user_details ud ON ud.user_id = u.id
WHERE u.email = ?`,

  get_user_by_id: `SELECT u.id, u.email, u.email_verified_at,
    ud.first_name, ud.last_name, ud.role, ud.status
FROM users u
LEFT JOIN user_details ud ON ud.user_id = u.id
WHERE u.id = ?`,

  insert_user: `INSERT INTO users (id, email, password_hash) VALUES (UUID_TO_BIN(UUID()), ?, ?)`,

  insert_user_details: `INSERT INTO user_details (id, user_id, first_name, last_name, role, status)
VALUES (UUID_TO_BIN(UUID()), (SELECT id FROM users WHERE email = ? LIMIT 1), ?, ?, 'member', 'active')`,

  set_email_verified: `UPDATE users SET email_verified_at = CURRENT_TIMESTAMP(3), updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,

  insert_verification_token: `INSERT INTO verification_tokens (user_id, token, expires_at)
SELECT id, ?, ? FROM users WHERE email = ? LIMIT 1`,

  get_verification_token: `SELECT vt.user_id, u.email FROM verification_tokens vt
JOIN users u ON u.id = vt.user_id
WHERE vt.token = ? AND vt.expires_at > NOW()`,

  delete_verification_token: `DELETE FROM verification_tokens WHERE token = ?`,

  insert_password_reset_token: `INSERT INTO password_reset_tokens (user_id, token, expires_at)
SELECT id, ?, ? FROM users WHERE email = ? LIMIT 1`,

  get_password_reset_token: `SELECT prt.user_id FROM password_reset_tokens prt
WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL`,

  mark_reset_token_used: `UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP(3) WHERE token = ?`,

  update_password: `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,

  get_password_hash_by_id: `SELECT password_hash FROM users WHERE id = ?`,

  update_profile: `UPDATE user_details SET first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ?`,

  update_user_email: `UPDATE users SET email = ?, email_verified_at = NULL, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,

  get_all_users: `SELECT u.id, u.email, u.email_verified_at, u.created_at,
    ud.first_name, ud.last_name, ud.role, ud.status
FROM users u
LEFT JOIN user_details ud ON ud.user_id = u.id
ORDER BY u.created_at DESC`,

  update_user_by_id: `UPDATE user_details SET first_name = ?, last_name = ?, role = ?, status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE user_id = ?`,

  delete_user: `DELETE FROM users WHERE id = ?`,

  list_venues: `SELECT id, name, street, city, state, zip FROM venues ORDER BY name`,

  get_venue_by_id: `SELECT id, name, street, city, state, zip FROM venues WHERE id = ?`,

  insert_venue: `INSERT INTO venues (id, name, street, city, state, zip) VALUES (?, ?, ?, ?, ?, ?)`,

  update_venue: `UPDATE venues SET name = ?, street = ?, city = ?, state = ?, zip = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,

  delete_venue: `DELETE FROM venues WHERE id = ?`,

  list_games: `SELECT g.id, g.venue_id, g.game_day, g.game_time, g.notes, v.name AS venue_name, v.street AS venue_street, v.city AS venue_city, v.state AS venue_state, v.zip AS venue_zip
FROM games g
JOIN venues v ON v.id = g.venue_id
WHERE (? IS NULL OR g.game_day = ?)
  AND (? IS NULL OR g.venue_id = ?)
ORDER BY FIELD(g.game_day, 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), g.game_time`,

  get_game_by_id: `SELECT g.id, g.venue_id, g.game_day, g.game_time, g.notes, v.name AS venue_name, v.street AS venue_street, v.city AS venue_city, v.state AS venue_state, v.zip AS venue_zip
FROM games g
JOIN venues v ON v.id = g.venue_id
WHERE g.id = ?`,

  insert_game: `INSERT INTO games (id, venue_id, game_day, game_time, notes) VALUES (?, ?, ?, ?, ?)`,

  update_game: `UPDATE games SET venue_id = ?, game_day = ?, game_time = ?, notes = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,

  delete_game: `DELETE FROM games WHERE id = ?`,

  get_my_signup: `SELECT gs.game_id, g.game_day, g.game_time, g.notes, v.name AS venue_name, v.street AS venue_street, v.city AS venue_city, v.state AS venue_state, v.zip AS venue_zip
FROM game_signups gs
JOIN games g ON g.id = gs.game_id
JOIN venues v ON v.id = g.venue_id
WHERE gs.user_id = ?
LIMIT 1`,

  insert_signup: `INSERT INTO game_signups (id, game_id, user_id) VALUES (UUID_TO_BIN(UUID()), ?, ?)`,

  delete_signup_by_game_user: `DELETE FROM game_signups WHERE game_id = ? AND user_id = ?`,

  get_signup_by_game_user: `SELECT 1 FROM game_signups WHERE game_id = ? AND user_id = ?`,

  list_signups_for_game: `SELECT gs.signed_up_at, u.id AS user_id, ud.first_name, ud.last_name, u.email
FROM game_signups gs
JOIN users u ON u.id = gs.user_id
LEFT JOIN user_details ud ON ud.user_id = u.id
WHERE gs.game_id = ?
ORDER BY gs.signed_up_at`,

  list_standings: `SELECT ps.user_id, ps.period, ps.points, ps.wins, ud.first_name, ud.last_name, u.email
FROM player_standings ps
JOIN users u ON u.id = ps.user_id
LEFT JOIN user_details ud ON ud.user_id = u.id
WHERE (? IS NULL OR ps.period = ?)
ORDER BY ps.points DESC, ps.wins DESC`,
};

export function getQuery(name: string): string {
  const q = queries[name];
  if (!q) throw new Error(`Unknown query: ${name}`);
  return q;
}
