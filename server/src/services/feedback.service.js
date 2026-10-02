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

    if (consultation.status === "cancelled") {
      throw { status: 400, message: "Feedback cannot be submitted for a cancelled consultation" };
    }

    // If the consultation is ongoing or scheduled when the call ended, mark it completed
    if (consultation.status !== "completed") {
      await db
        .update(consultations)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(consultations.id, consultationId));
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
    let result = await db
      .select({
        averageRating: avg(consultationFeedback.rating),
        totalReviews: count(consultationFeedback.id),
      })
      .from(consultationFeedback)
      .where(eq(consultationFeedback.doctorId, doctorId));

    let row = result[0];

    // Fallback: if no feedback found, doctorId might be a doctor_profile id
    if (!row?.averageRating) {
      const [profile] = await db
        .select({ userId: doctorProfiles.userId })
        .from(doctorProfiles)
        .where(eq(doctorProfiles.id, doctorId))
        .limit(1);

      if (profile?.userId) {
        result = await db
          .select({
            averageRating: avg(consultationFeedback.rating),
            totalReviews: count(consultationFeedback.id),
          })
          .from(consultationFeedback)
          .where(eq(consultationFeedback.doctorId, profile.userId));
        row = result[0];
      }
    }

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
