import "dotenv/config";

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "../db/schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

/*
Required when @neondatabase/serverless runs
inside a Node.js environment.
*/
neonConfig.webSocketConstructor = ws;

/*
Create one shared connection pool for the application.

Do NOT create a new Pool inside controllers.
*/
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/*
Drizzle database instance.

This driver supports interactive transactions:

await db.transaction(async (tx) => {
  ...
});
*/
export const db = drizzle(pool, {
  schema,
});

export const checkPostgresConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");

    console.log("Neon PostgreSQL Connected");
    console.log("Database time:", result.rows[0].current_time);

    return true;
  } catch (error) {
    console.error("Neon PostgreSQL Connection Error:", error);

    throw error;
  }
};
