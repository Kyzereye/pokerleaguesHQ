import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/connection.js";
import { getQuery } from "../db/queries.js";
import { authMiddleware, requireAdmin, JwtPayload } from "../middleware/auth.js";
import { requireBody } from "../middleware/validate.js";

const router = Router();

function buildVenueAddress(street: string, city: string, state: string, zip: string): string {
  return [street, city, `${state} ${zip}`.trim()].filter(Boolean).join(", ");
}

router.get("/venues", authMiddleware, async (_req: Request, res: Response) => {
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("list_venues"));
  const venues = (rows as { id: Buffer; name: string; street: string; city: string; state: string; zip: string }[]).map((r) => ({
    id: r.id.toString("hex"),
    name: r.name,
    street: r.street,
    city: r.city,
    state: r.state,
    zip: r.zip,
  }));
  res.json({ venues });
});

router.post("/venues", authMiddleware, requireAdmin, requireBody(["name", "street", "city", "state", "zip"]), async (req: Request, res: Response) => {
  const pool = getPool();
  const idBuffer = Buffer.from(randomUUID().replace(/-/g, ""), "hex");
  const name = (req.body.name as string).trim();
  const street = (req.body.street as string).trim();
  const city = (req.body.city as string).trim();
  const state = (req.body.state as string).trim();
  const zip = (req.body.zip as string).trim();
  if (!street || !city || !state || !/^\d{5}$/.test(zip)) {
    res.status(400).json({ error: "Street, city, state, and zip (5 digits) are required" });
    return;
  }
  await pool.execute(getQuery("insert_venue"), [idBuffer, name, street, city, state, zip]);
  res.status(201).json({ venue: { id: idBuffer.toString("hex"), name, street, city, state, zip } });
});

router.patch("/venues/:id", authMiddleware, requireAdmin, requireBody(["name", "street", "city", "state", "zip"]), async (req: Request, res: Response) => {
  const idParam = req.params.id;
  let idBuffer: Buffer;
  try {
    idBuffer = Buffer.from(idParam, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid venue id" });
    return;
  }
  const pool = getPool();
  const name = (req.body.name as string).trim();
  const street = (req.body.street as string).trim();
  const city = (req.body.city as string).trim();
  const state = (req.body.state as string).trim();
  const zip = (req.body.zip as string).trim();
  if (!street || !city || !state || !/^\d{5}$/.test(zip)) {
    res.status(400).json({ error: "Street, city, state, and zip (5 digits) are required" });
    return;
  }
  const [result] = await pool.execute(getQuery("update_venue"), [name, street, city, state, zip, idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  const [rows] = await pool.execute(getQuery("get_venue_by_id"), [idBuffer]);
  const r = (rows as { id: Buffer; name: string; street: string; city: string; state: string; zip: string }[])[0];
  res.json({ venue: { id: r.id.toString("hex"), name: r.name, street: r.street, city: r.city, state: r.state, zip: r.zip } });
});

router.delete("/venues/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const idParam = req.params.id;
  let idBuffer: Buffer;
  try {
    idBuffer = Buffer.from(idParam, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid venue id" });
    return;
  }
  const pool = getPool();
  const [result] = await pool.execute(getQuery("delete_venue"), [idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.status(204).send();
});

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function validGameDay(d: string): string | null {
  const s = String(d).trim();
  return DAYS_OF_WEEK.includes(s) ? s : null;
}

router.get("/games", authMiddleware, async (req: Request, res: Response) => {
  const dayParam = req.query.day as string | undefined;
  const venueIdParam = req.query.venueId as string | undefined;
  const gameDay = dayParam ? validGameDay(dayParam) : null;
  let venueIdBuffer: Buffer | null = null;
  if (venueIdParam) {
    try {
      venueIdBuffer = Buffer.from(venueIdParam, "hex");
      if (venueIdBuffer.length !== 16) venueIdBuffer = null;
    } catch {
      venueIdBuffer = null;
    }
  }
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("list_games"), [
    gameDay,
    gameDay,
    venueIdBuffer,
    venueIdBuffer,
  ]);
  const games = (rows as { id: Buffer; venue_id: Buffer; game_day: string; game_time: string; notes: string | null; venue_name: string; venue_street: string; venue_city: string; venue_state: string; venue_zip: string }[]).map((r) => ({
    id: r.id.toString("hex"),
    venueId: r.venue_id.toString("hex"),
    gameDay: r.game_day,
    gameTime: formatTime(r.game_time),
    notes: r.notes ?? undefined,
    venueName: r.venue_name,
    venueAddress: buildVenueAddress(r.venue_street, r.venue_city, r.venue_state, r.venue_zip),
  }));
  res.json({ games });
});

function normalizeTime(s: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(s).trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const sec = match[3] ? parseInt(match[3], 10) : 0;
  if (h < 0 || h > 23 || m < 0 || m > 59 || sec < 0 || sec > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

router.post("/games", authMiddleware, requireAdmin, requireBody(["venueId", "gameDay", "gameTime"]), async (req: Request, res: Response) => {
  const venueIdParam = req.body.venueId as string;
  const gameDay = validGameDay(req.body.gameDay as string);
  const gameTime = normalizeTime(req.body.gameTime as string);
  if (!gameDay || !gameTime) {
    res.status(400).json({ error: "Valid gameDay (Sunday–Saturday) and gameTime (HH:mm) are required" });
    return;
  }
  let venueIdBuffer: Buffer;
  try {
    venueIdBuffer = Buffer.from(venueIdParam, "hex");
    if (venueIdBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid venue id" });
    return;
  }
  const pool = getPool();
  const notes = typeof req.body.notes === "string" ? req.body.notes.trim() || null : null;
  const idBuffer = Buffer.from(randomUUID().replace(/-/g, ""), "hex");
  await pool.execute(getQuery("insert_game"), [idBuffer, venueIdBuffer, gameDay, gameTime, notes]);
  const [rows] = await pool.execute(getQuery("get_game_by_id"), [idBuffer]);
  const r = (rows as { id: Buffer; venue_id: Buffer; game_day: string; game_time: string; notes: string | null; venue_name: string; venue_street: string; venue_city: string; venue_state: string; venue_zip: string }[])[0];
  res.status(201).json({
    game: {
      id: r.id.toString("hex"),
      venueId: r.venue_id.toString("hex"),
      gameDay: r.game_day,
      gameTime: formatTime(r.game_time),
      notes: r.notes ?? undefined,
      venueName: r.venue_name,
      venueAddress: buildVenueAddress(r.venue_street, r.venue_city, r.venue_state, r.venue_zip),
    },
  });
});

router.patch("/games/:id", authMiddleware, requireAdmin, requireBody(["venueId", "gameDay", "gameTime"]), async (req: Request, res: Response) => {
  const idParam = req.params.id;
  const gameDay = validGameDay(req.body.gameDay as string);
  const gameTime = normalizeTime(req.body.gameTime as string);
  if (!gameDay || !gameTime) {
    res.status(400).json({ error: "Valid gameDay (Sunday–Saturday) and gameTime (HH:mm) are required" });
    return;
  }
  let idBuffer: Buffer;
  let venueIdBuffer: Buffer;
  try {
    idBuffer = Buffer.from(idParam, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
    venueIdBuffer = Buffer.from(req.body.venueId as string, "hex");
    if (venueIdBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid game or venue id" });
    return;
  }
  const notes = typeof req.body.notes === "string" ? req.body.notes.trim() || null : null;
  const pool = getPool();
  const [result] = await pool.execute(getQuery("update_game"), [venueIdBuffer, gameDay, gameTime, notes, idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  const [rows] = await pool.execute(getQuery("get_game_by_id"), [idBuffer]);
  const r = (rows as { id: Buffer; venue_id: Buffer; game_day: string; game_time: string; notes: string | null; venue_name: string; venue_street: string; venue_city: string; venue_state: string; venue_zip: string }[])[0];
  res.json({
    game: {
      id: r.id.toString("hex"),
      venueId: r.venue_id.toString("hex"),
      gameDay: r.game_day,
      gameTime: formatTime(r.game_time),
      notes: r.notes ?? undefined,
      venueName: r.venue_name,
      venueAddress: buildVenueAddress(r.venue_street, r.venue_city, r.venue_state, r.venue_zip),
    },
  });
});

router.delete("/games/:id", authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const idParam = req.params.id;
  let idBuffer: Buffer;
  try {
    idBuffer = Buffer.from(idParam, "hex");
    if (idBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid game id" });
    return;
  }
  const pool = getPool();
  const [result] = await pool.execute(getQuery("delete_game"), [idBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.status(204).send();
});

router.get("/my-signup", authMiddleware, async (req: Request & { user: JwtPayload }, res: Response) => {
  const pool = getPool();
  const idBuffer = Buffer.from(req.user.userId, "hex");
  const [rows] = await pool.execute(getQuery("get_my_signup"), [idBuffer]);
  const row = (rows as { game_id: Buffer; game_day: string; game_time: string; notes: string | null; venue_name: string; venue_street: string; venue_city: string; venue_state: string; venue_zip: string }[])[0];
  if (!row) {
    res.status(404).json({ error: "Not signed up for any game" });
    return;
  }
  res.json({
    gameId: row.game_id.toString("hex"),
    gameDay: row.game_day,
    gameTime: formatTime(row.game_time),
    notes: row.notes ?? undefined,
    venueName: row.venue_name,
    venueAddress: buildVenueAddress(row.venue_street, row.venue_city, row.venue_state, row.venue_zip),
  });
});

router.post("/games/:gameId/signup", authMiddleware, async (req: Request & { user: JwtPayload }, res: Response) => {
  const { gameId } = req.params;
  let gameIdBuffer: Buffer;
  try {
    gameIdBuffer = Buffer.from(gameId, "hex");
    if (gameIdBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid game id" });
    return;
  }
  const userIdBuffer = Buffer.from(req.user.userId, "hex");
  const pool = getPool();
  const [existing] = await pool.execute(getQuery("get_my_signup"), [userIdBuffer]);
  if ((existing as unknown[]).length > 0) {
    const existingRow = (existing as { game_id: Buffer }[])[0];
    if (existingRow.game_id.compare(gameIdBuffer) !== 0) {
      res.status(400).json({ error: "You are already signed up for another game. Remove that signup first." });
      return;
    }
  }
  const [exists] = await pool.execute(getQuery("get_signup_by_game_user"), [gameIdBuffer, userIdBuffer]);
  if ((exists as unknown[]).length > 0) {
    res.status(400).json({ error: "Already signed up for this game" });
    return;
  }
  const [gameRows] = await pool.execute(getQuery("get_game_by_id"), [gameIdBuffer]);
  if ((gameRows as unknown[]).length === 0) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  await pool.execute(getQuery("insert_signup"), [gameIdBuffer, userIdBuffer]);
  res.status(201).json({ message: "Signed up successfully" });
});

router.delete("/games/:gameId/signup", authMiddleware, async (req: Request & { user: JwtPayload }, res: Response) => {
  const { gameId } = req.params;
  let gameIdBuffer: Buffer;
  try {
    gameIdBuffer = Buffer.from(gameId, "hex");
    if (gameIdBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid game id" });
    return;
  }
  const userIdBuffer = Buffer.from(req.user.userId, "hex");
  const pool = getPool();
  const [result] = await pool.execute(getQuery("delete_signup_by_game_user"), [gameIdBuffer, userIdBuffer]) as [{ affectedRows: number }, unknown];
  if (result.affectedRows === 0) {
    res.status(404).json({ error: "Signup not found" });
    return;
  }
  res.status(204).send();
});

router.get("/games/:gameId/signups", authMiddleware, async (req: Request, res: Response) => {
  const { gameId } = req.params;
  let gameIdBuffer: Buffer;
  try {
    gameIdBuffer = Buffer.from(gameId, "hex");
    if (gameIdBuffer.length !== 16) throw new Error("bad");
  } catch {
    res.status(400).json({ error: "Invalid game id" });
    return;
  }
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("list_signups_for_game"), [gameIdBuffer]);
  const signups = (rows as { signed_up_at: Date; user_id: Buffer; first_name: string; last_name: string; email: string }[]).map((r) => ({
    signedUpAt: r.signed_up_at.toISOString(),
    userId: r.user_id.toString("hex"),
    displayName: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || r.email,
    email: r.email,
  }));
  res.json({ signups });
});

router.get("/standings", authMiddleware, async (req: Request, res: Response) => {
  const periodParam = (req.query.period as string) || null;
  const period = periodParam && periodParam.trim() ? periodParam.trim() : null;
  const pool = getPool();
  const [rows] = await pool.execute(getQuery("list_standings"), [period, period]);
  const list = rows as { user_id: Buffer; period: string; points: number; wins: number; first_name: string; last_name: string; email: string }[];
  const standings = list.map((r, index) => ({
    rank: index + 1,
    userId: r.user_id.toString("hex"),
    displayName: [r.first_name, r.last_name].filter(Boolean).join(" ").trim() || r.email,
    points: r.points,
    wins: r.wins,
    period: r.period,
  }));
  const periods = period ? [period] : [...new Set(list.map((r) => r.period))].sort();
  res.json({ standings, periods });
});

function formatTime(t: string | Date): string {
  const d = new Date(`1970-01-01T${t}`);
  if (Number.isNaN(d.getTime())) return String(t);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default router;
