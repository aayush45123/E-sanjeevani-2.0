import { FeedbackService } from "../services/feedback.service.js";

export const submitFeedback = async (req, res) => {
  try {
    const feedback = await FeedbackService.submitFeedback(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("submitFeedback error:", error);
    return res.status(500).json({ success: false, message: "Failed to submit feedback" });
  }
};

export const getDoctorRating = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const rating = await FeedbackService.getDoctorRating(doctorId);
    return res.status(200).json({ success: true, ...rating });
  } catch (error) {
    console.error("getDoctorRating error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch doctor rating" });
  }
};

export const checkFeedback = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const hasSubmitted = await FeedbackService.hasFeedback(req.user.id, consultationId);
    return res.status(200).json({ success: true, hasSubmitted });
  } catch (error) {
    console.error("checkFeedback error:", error);
    return res.status(500).json({ success: false, message: "Failed to check feedback status" });
  }
};
