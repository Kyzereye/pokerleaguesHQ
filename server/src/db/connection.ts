import mysql from "mysql2/promise";
import { config } from "../config/index.js";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const { host, port, user, password, database } = config.db;
    if (!database) {
      throw new Error("DB_NAME is not set. Add DB_NAME=your_database_name to server/.env");
    }
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
