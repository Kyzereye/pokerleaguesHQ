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
};

export function getQuery(name: string): string {
  const q = queries[name];
  if (!q) throw new Error(`Unknown query: ${name}`);
  return q;
}
