import { sql } from "drizzle-orm";
import { db, ensureLongitudinalHealthTablesExist } from "../config/neonDb.js";

async function runMigration() {
  console.log("⚙️ Running Longitudinal Patient Health Intelligence migration...");
  try {
    await ensureLongitudinalHealthTablesExist();
    console.log("✅ Longitudinal Health Intelligence tables & indexes verified successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

runMigration();

