import { TriageService } from "../services/triage.service.js";

export const createTriageSession = async (req, res) => {
  try {
    const result = await TriageService.createTriageSession(req.user?.userId, req.body);
    return res.status(201).json({
      message: "Triage session created successfully",
      ...result,
    });
  } catch (error) {
    console.error("Create triage session controller error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Error creating triage session",
      error: error.error || error.message,
    });
  }
};

export const processTriageResponse = async (req, res) => {
  try {
    const result = await TriageService.processTriageResponse(req.user?.userId, req.params.triageSessionId);
    
    if (result.autoMatched) {
      return res.status(200).json({
        message: result.message,
        triageResponse: result.triageResponse,
        autoMatchedConsultation: result.autoMatchedConsultation,
      });
    }

    return res.status(200).json({
      message: result.message,
      triageResponse: result.triageResponse,
      triageSession: result.triageSession,
    });
  } catch (error) {
    console.error("Process triage response controller error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Error processing triage",
      error: error.error || error.message,
    });
  }
};

export const getTriageHistory = async (req, res) => {
  try {
    const triageHistory = await TriageService.getTriageHistory(req.user?.userId);
    return res.status(200).json({
      message: "Triage history retrieved",
      triageHistory,
    });
  } catch (error) {
    console.error("Get triage history controller error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Error retrieving triage history",
      error: error.error || error.message,
    });
  }
};

export const getTriageSessionDetails = async (req, res) => {
  try {
    const triageSession = await TriageService.getTriageSessionDetails(
      req.user?.userId,
      req.params.triageSessionId,
    );
    return res.status(200).json({
      message: "Triage session details",
      triageSession,
    });
  } catch (error) {
    console.error("Get triage session details controller error:", error);
    return res.status(error.status || 500).json({
      message: "Error retrieving session details",
      error: error.message,
    });
  }
};
