import { AnalyticsService } from "../services/analytics.service.js";

export const getDoctorAnalytics = async (req, res, next) => {
  try {
    const data = await AnalyticsService.getDoctorAnalytics(req.user.id);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get doctor analytics controller error:", error);
    next(error);
  }
};
