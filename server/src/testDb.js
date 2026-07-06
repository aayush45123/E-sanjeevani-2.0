import "dotenv/config";

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const testConnection = async () => {
  try {
    const result = await sql`SELECT NOW() AS current_time`;

    console.log("SUCCESS: Connected to Neon PostgreSQL");
    console.log("Database time:", result[0].current_time);

    process.exit(0);
  } catch (error) {
    console.error("FAILED: Could not connect to Neon PostgreSQL");
    console.error(error);

    process.exit(1);
  }
};

testConnection();
