import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import authRoutes from "./routes/auth.js";

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many attempts" },
});
app.use("/auth", authLimiter);
app.use("/auth", authRoutes);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
