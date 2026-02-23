import { Request, Response, NextFunction } from "express";

export function requireBody(keys: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    for (const key of keys) {
      if (body[key] == null || body[key] === "") {
        res.status(400).json({ error: `Missing or empty: ${key}` });
        return;
      }
    }
    next();
  };
}
