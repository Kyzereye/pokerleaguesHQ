import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "../db/connection.js";
import { getQuery } from "../db/queries.js";
import { config } from "../config/index.js";
import { authMiddleware, requireAdmin, JwtPayload } from "../middleware/auth.js";
import { requireBody } from "../middleware/validate.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../mail/index.js";
import crypto from "crypto";

const router = Router();
const SALT_ROUNDS = 12;
const VERIFICATION_EXPIRY_HOURS = 24;
const RESET_EXPIRY_HOURS = 1;

function jwtSign(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: `${config.jwt.expiryDays}d`,
  });
}

router.post("/register", requireBody(["email", "password", "firstName", "lastName"]), async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body as { email: string; password: string; firstName: string; lastName: string };
  const pool = getPool();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    await pool.execute(getQuery("insert_user"), [email, hash]);
    await pool.execute(getQuery("insert_user_details"), [email, (firstName ?? "").trim(), (lastName ?? "").trim()]);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    throw err;
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.execute(getQuery("insert_verification_token"), [token, expires, email]);
  const user = (await pool.execute(getQuery("get_user_by_email"), [email])) as [unknown[], unknown];
  const userId = (user[0] as { id: Buffer }[])[0]?.id;
  if (userId) {
    if (!config.apiUrl) throw new Error("API_URL is not set in server/.env (required for verification email link)");
    const verifyLink = `${config.apiUrl}/auth/verify-email?token=${token}`;
    await sendVerificationEmail(email, verifyLink);
  }
  res.status(201).json({ message: "Check your email to verify your account" });
});

router.get("/verify-email", async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const loginUrl = config.frontendUrl + "/login";
  if (!token) {
    res.redirect(302, loginUrl + "?error=missing_token");
    return;
  }
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("get_verification_token"), [token]);
  const row = (rows as { user_id: Buffer }[])[0];
  if (!row) {
    res.redirect(302, loginUrl + "?error=invalid_token");
    return;
  }
  await pool.execute(getQuery("set_email_verified"), [row.user_id]);
  await pool.execute(getQuery("delete_verification_token"), [token]);
  res.redirect(302, loginUrl + "?verified=1");
});

router.post("/resend-verification", requireBody(["email"]), async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const pool = getPool();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.execute(getQuery("insert_verification_token"), [token, expires, email]);
  if (!config.apiUrl) throw new Error("API_URL is not set in server/.env (required for verification email link)");
  const verifyLink = `${config.apiUrl}/auth/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyLink);
  res.json({ message: "If an account exists, we sent a verification email." });
});

router.post("/login", requireBody(["email", "password"]), async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("get_user_by_email"), [email]);
  const row = (rows as { id: Buffer; password_hash: string; email_verified_at: Date | null; email: string; first_name: string; last_name: string; role: string; status: string | null }[])[0];
  if (!row) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (!row.email_verified_at) {
    res.status(403).json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" });
    return;
  }
  if (row.status !== "active") {
    res.status(403).json({ error: "Account suspended", code: "ACCOUNT_SUSPENDED" });
    return;
  }
  const userId = row.id.toString("hex");
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email;
  const jwtToken = jwtSign({ userId, email: row.email, role: row.role });
  res.json({ token: jwtToken, user: { id: userId, email: row.email, displayName, role: row.role, firstName: row.first_name, lastName: row.last_name } });
});

router.get("/me", authMiddleware, async (req: Request & { user: JwtPayload }, res: Response) => {
  const pool = getPool();
  const idBuffer = Buffer.from(req.user.userId, "hex");
  const [rows] = await pool.execute(getQuery("get_user_by_id"), [idBuffer]);
  const row = (rows as { id: Buffer; email: string; first_name: string; last_name: string; role: string }[])[0];
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email;
  res.json({ user: { id: row.id.toString("hex"), email: row.email, displayName, role: row.role, firstName: row.first_name, lastName: row.last_name } });
});

router.post("/forgot-password", requireBody(["email"]), async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const pool = getPool();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000);
  await pool.execute(getQuery("insert_password_reset_token"), [token, expires, email]);
  const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetLink);
  res.json({ message: "If an account exists, we sent a password reset link." });
});

router.post("/reset-password", requireBody(["token", "newPassword"]), async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("get_password_reset_token"), [token]);
  const row = (rows as { user_id: Buffer }[])[0];
  if (!row) {
    res.status(400).json({ error: "Invalid or expired token" });
    return;
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute(getQuery("update_password"), [hash, row.user_id]);
  await pool.execute(getQuery("mark_reset_token_used"), [token]);
  res.json({ message: "Password updated. You can log in." });
});

router.post("/change-password", authMiddleware, requireBody(["currentPassword", "newPassword"]), async (req: Request & { user: JwtPayload }, res: Response) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const pool = getPool();
  const idBuffer = Buffer.from(req.user.userId, "hex");
  const [rows] = await pool.execute(getQuery("get_password_hash_by_id"), [idBuffer]);
  const row = (rows as { password_hash: string }[])[0];
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const ok = await bcrypt.compare(currentPassword, row.password_hash);
  if (!ok) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute(getQuery("update_password"), [hash, idBuffer]);
  res.json({ message: "Password updated." });
});

router.delete("/account", authMiddleware, async (req: Request & { user: JwtPayload }, res: Response) => {
  const pool = getPool();
  const idBuffer = Buffer.from(req.user.userId, "hex");
  const [result] = await pool.execute(getQuery("delete_user"), [idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(204).send();
});

router.patch("/profile", authMiddleware, requireBody(["firstName", "lastName"]), async (req: Request & { user: JwtPayload }, res: Response) => {
  const { firstName, lastName, email: bodyEmail } = req.body as { firstName: string; lastName: string; email?: string };
  const pool = getPool();
  const idBuffer = Buffer.from(req.user.userId, "hex");
  const newEmail = bodyEmail != null ? String(bodyEmail).trim().toLowerCase() : null;
  if (newEmail && newEmail !== req.user.email) {
    const [existing] = await pool.execute(getQuery("get_user_by_email"), [newEmail]);
    const existingRow = (existing as { id: Buffer }[])[0];
    if (existingRow && existingRow.id.compare(idBuffer) !== 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000);
    await pool.execute(getQuery("update_user_email"), [newEmail, idBuffer]);
    await pool.execute(getQuery("update_profile"), [(firstName ?? "").trim(), (lastName ?? "").trim(), idBuffer]);
    await pool.execute(getQuery("insert_verification_token"), [token, expires, newEmail]);
    if (config.apiUrl) {
      const verifyLink = `${config.apiUrl}/auth/verify-email?token=${token}`;
      await sendVerificationEmail(newEmail, verifyLink);
    }
  } else {
    await pool.execute(getQuery("update_profile"), [(firstName ?? "").trim(), (lastName ?? "").trim(), idBuffer]);
  }
  const [rows] = await pool.execute(getQuery("get_user_by_id"), [idBuffer]);
  const row = (rows as { id: Buffer; email: string; first_name: string; last_name: string; role: string }[])[0];
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email;
  const payload: { user: { id: string; email: string; displayName: string; role: string; firstName: string; lastName: string }; emailVerificationSent?: boolean } = {
    user: { id: row.id.toString("hex"), email: row.email, displayName, role: row.role, firstName: row.first_name, lastName: row.last_name },
  };
  if (newEmail && newEmail !== req.user.email) payload.emailVerificationSent = true;
  res.json(payload);
});

router.get("/users", authMiddleware, requireAdmin, async (_req: Request, res: Response) => {
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("get_all_users"));
  const users = (rows as { id: Buffer; email: string; first_name: string; last_name: string; role: string; status: string; email_verified_at: Date | null; created_at: Date }[]).map((r) => ({
    id: r.id.toString("hex"),
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    role: r.role,
    status: r.status,
    emailVerifiedAt: r.email_verified_at,
    createdAt: r.created_at,
  }));
  res.json({ users });
});

router.patch("/users/:id", authMiddleware, requireAdmin, requireBody(["firstName", "lastName", "role", "status"]), async (req: Request & { user: JwtPayload }, res: Response) => {
  const { id } = req.params;
  const { firstName, lastName, role, status } = req.body as { firstName: string; lastName: string; role: string; status: string };
  if (!["member", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  if (!["active", "suspended"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const pool = getPool();
  let idBuffer: Buffer;
  try {
    idBuffer = Buffer.from(id, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  await pool.execute(getQuery("update_user_by_id"), [(firstName ?? "").trim(), (lastName ?? "").trim(), role, status, idBuffer]);
  const [rows] = await pool.execute(getQuery("get_user_by_id"), [idBuffer]);
  const row = (rows as { id: Buffer; email: string; first_name: string; last_name: string; role: string }[])[0];
  if (!row) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const displayName = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email;
  res.json({ user: { id: row.id.toString("hex"), email: row.email, displayName, role: row.role, firstName: row.first_name, lastName: row.last_name } });
});

router.delete("/users/:id", authMiddleware, requireAdmin, async (req: Request & { user: JwtPayload }, res: Response) => {
  const { id } = req.params;
  if (req.user.userId === id) {
    res.status(400).json({ error: "You cannot delete your own account" });
    return;
  }
  let idBuffer: Buffer;
  try {
    idBuffer = Buffer.from(id, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  const pool = getPool();
  const [result] = await pool.execute(getQuery("delete_user"), [idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(204).send();
});

export default router;
