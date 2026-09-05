import { db } from "../config/neonDb.js";
import { ConsultationRepository } from "../repositories/consultation.repository.js";

async function check() {
  try {
    // Just test if drizzle builds query with extra property or if consultations has diagnosis
    const { prescriptions, prescriptionItems } = await import("../database/schema/index.js");
    const rx = await db.select().from(prescriptions).limit(1);
    const rxi = await db.select().from(prescriptionItems).limit(1);
    console.log("Prescriptions ok:", rx);
    console.log("PrescriptionItems ok:", rxi);
  } catch (e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
check();
