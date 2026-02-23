import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  port: Number(process.env.PORT) || 3000,
  apiUrl: process.env.API_URL ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  db: {
    host: process.env.DB_HOST ?? "",
    port: Number(process.env.DB_PORT) ?? 0,
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
    expiryDays: Number(process.env.JWT_EXPIRY_DAYS) || 7,
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT) ?? 0,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "",
  },
} as const;
