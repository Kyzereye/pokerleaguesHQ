import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function authMiddleware(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid token" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Missing or invalid token" });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}
