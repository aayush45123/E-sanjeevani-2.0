import { db } from "../config/neonDb.js";
import { consultationFeedback, consultations, doctorProfiles } from "../database/schema/index.js";
import { eq, avg, count, and } from "drizzle-orm";

export class FeedbackService {
  /**
   * Submit post-call feedback (patient only, once per consultation).
   */
  static async submitFeedback(userId, { consultationId, rating, comment }) {
    if (!consultationId || !rating) {
      throw { status: 400, message: "consultationId and rating are required" };
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw { status: 400, message: "Rating must be an integer between 1 and 5" };
    }

    // Verify consultation exists and patient is participant
    const [consultation] = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId))
      .limit(1);

    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    if (consultation.patientId !== userId) {
      throw { status: 403, message: "Only the patient can submit feedback for this consultation" };
    }

    if (consultation.status !== "completed") {
      throw { status: 400, message: "Feedback can only be submitted after the consultation is completed" };
    }

    // Check for duplicate feedback
    const existing = await db
      .select()
      .from(consultationFeedback)
      .where(eq(consultationFeedback.consultationId, consultationId))
      .limit(1);

    if (existing.length > 0) {
      throw { status: 409, message: "Feedback already submitted for this consultation" };
    }

    const [feedback] = await db
      .insert(consultationFeedback)
      .values({
        consultationId,
        patientId: userId,
        doctorId: consultation.doctorId,
        rating: ratingNum,
        comment: comment ? String(comment).trim() : "",
      })
      .returning();

    return feedback;
  }

  /**
   * Get aggregated rating for a doctor (average + count).
   */
  static async getDoctorRating(doctorId) {
    const result = await db
      .select({
        averageRating: avg(consultationFeedback.rating),
        totalReviews: count(consultationFeedback.id),
      })
      .from(consultationFeedback)
      .where(eq(consultationFeedback.doctorId, doctorId));

    const row = result[0];
    return {
      averageRating: row?.averageRating ? parseFloat(Number(row.averageRating).toFixed(1)) : null,
      totalReviews: Number(row?.totalReviews ?? 0),
    };
  }

  /**
   * Check if patient has already submitted feedback for a consultation.
   */
  static async hasFeedback(userId, consultationId) {
    const existing = await db
      .select()
      .from(consultationFeedback)
      .where(
        and(
          eq(consultationFeedback.consultationId, consultationId),
          eq(consultationFeedback.patientId, userId),
        )
      )
      .limit(1);
    return existing.length > 0;
  }
}
