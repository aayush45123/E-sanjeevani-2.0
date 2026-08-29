import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function endAllActiveConsultations() {
  console.log("🔍 Loading database connection and models...");
  const { db } = await import("../config/neonDb.js");
  const { consultations } = await import("../database/schema/consultations.js");
  const { inArray } = await import("drizzle-orm");

  console.log("🔍 Finding all upcoming ('scheduled') and 'ongoing' consultations...");

  try {
    const activeConsultations = await db
      .select({
        id: consultations.id,
        status: consultations.status,
        date: consultations.consultationDate,
        startTime: consultations.startTime,
        endTime: consultations.endTime,
        symptoms: consultations.symptoms,
      })
      .from(consultations)
      .where(inArray(consultations.status, ["scheduled", "ongoing"]));

    console.log(`📋 Found ${activeConsultations.length} active/upcoming consultation(s):`);
    activeConsultations.forEach((c, idx) => {
      console.log(
        `  ${idx + 1}. ID: ${c.id} | Status: ${c.status} | Date: ${c.date} (${c.startTime} - ${c.endTime}) | Symptoms: ${c.symptoms}`
      );
    });

    if (activeConsultations.length === 0) {
      console.log("✅ No upcoming or ongoing consultations found in the database.");
      process.exit(0);
    }

    const updated = await db
      .update(consultations)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(inArray(consultations.status, ["scheduled", "ongoing"]))
      .returning({ id: consultations.id, status: consultations.status });

    console.log(`\n🎉 Successfully ended ${updated.length} consultation(s) (Status set to 'completed').`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error ending consultations:", error);
    process.exit(1);
  }
}

endAllActiveConsultations();
