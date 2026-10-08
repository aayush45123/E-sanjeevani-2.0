import { AnalyticsService } from "../services/analytics.service.js";

export const getDoctorAnalytics = async (req, res, next) => {
  try {
    const range = req.query.range ? parseInt(req.query.range, 10) : 30;
    const data = await AnalyticsService.getDoctorAnalytics(req.user.id, {
      range,
    });
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get doctor analytics controller error:", error);
    next(error);
  }
};

export const getDoctorFollowUps = async (req, res, next) => {
  try {
    const followUps = await AnalyticsService.getFollowUps(req.user.id);
    return res.status(200).json({
      success: true,
      data: followUps,
    });
  } catch (error) {
    console.error("Get doctor follow-ups controller error:", error);
    next(error);
  }
};

export const updateDoctorFollowUpStatus = async (req, res, next) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;
    const updated = await AnalyticsService.updateFollowUpStatus(
      req.user.id,
      consultationId,
      status,
    );
    return res.status(200).json({
      success: true,
      message: "Follow-up status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update doctor follow-up status error:", error);
    next(error);
  }
};

export const getDoctorOverview = async (req, res, next) => {
  try {
    const overview = await AnalyticsService.getDoctorOverview(req.user.id);
    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Get doctor overview controller error:", error);
    next(error);
  }
};
