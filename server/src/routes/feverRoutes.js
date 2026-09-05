// server/src/routes/feverRoutes.js
// ============================================================
// Proxy routes — bridges Node.js server to Python Flask
// fever differential assessment endpoints on port 8000.
// ============================================================

import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

const rawPythonUrl = process.env.PYTHON_AI_URL || "http://127.0.0.1:8000";
const PYTHON_AI_URL = rawPythonUrl.replace(/\/$/, "");

// ─────────────────────────────────────────────────────────────────────────────
// AUTH — all fever routes require login
// ─────────────────────────────────────────────────────────────────────────────
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fever/health
// Check that the Python fever model is loaded and ready
// ─────────────────────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${PYTHON_AI_URL}/fever-health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    return res.status(response.ok ? 200 : 503).json(data);
  } catch (error) {
    console.error("[FeverRoute /health] Error:", error.message);
    return res.status(503).json({
      success: false,
      message: "Fever model service unavailable. Ensure the Python server is running.",
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/fever/assess
// Proxies the fever differential assessment request to Python Flask
//
// Body:
//   { symptoms: { fever: 1, headache: 1, ... },
//     red_flags: { bleeding: false, ... } }
//
// Response:
//   { red_flag_alert: bool, top_ranking: [...], primary_explanation: [...], ... }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/assess", async (req, res) => {
  try {
    const { symptoms, red_flags, triageSessionId } = req.body;

    if (!symptoms || typeof symptoms !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request must include a 'symptoms' object with binary feature values.",
      });
    }

    console.log(`[FeverRoute /assess] User: ${req.user?.id || "unknown"}`);

    const response = await fetch(`${PYTHON_AI_URL}/predict-fever`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, red_flags: red_flags || {} }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data.message || "Fever assessment failed",
      });
    }

    // Save session in PostgreSQL database so it appears in patient Triage History
    const userId = req.user?.id || req.user?.userId;
    if (userId) {
      try {
        const { TriageRepository } = await import("../repositories/triage.repository.js");
        let session;
        if (triageSessionId) {
          session = await TriageRepository.findSessionById(triageSessionId);
        }
        const topDisease = data.top_ranking?.[0]?.disease?.replace(/_/g, " ");
        const title = topDisease ? `Fever: ${topDisease}` : "Fever Symptom Assessment";
        const desc = data.red_flag_alert
          ? data.red_flag_message
          : (data.primary_explanation?.join(", ") || "Fever differential analysis completed");

        if (!session) {
          session = await TriageRepository.createSession({
            patientId: userId,
            symptoms: Object.keys(symptoms || {}).filter((k) => symptoms[k] === 1).map((s) => ({ symptom: s })),
            summaryTitle: title,
            summaryDescription: desc,
            urgencyScore: data.red_flag_alert ? 9 : 5,
            urgencyLevel: data.red_flag_alert ? "critical" : "moderate",
            status: "completed",
          });
        }

        let summaryText = "";
        if (data.red_flag_alert) {
          summaryText = `## URGENT WARNING\n\n${data.red_flag_message}\n\nPlease seek immediate medical care.`;
        } else if (data.top_ranking?.[0]) {
          summaryText = `## Fever Assessment Report\n\n**Predicted Condition:** ${topDisease}\n\n**Next Step:** ${data.recommended_action || "Consult a physician."}`;
        } else {
          summaryText = data.message || "Fever assessment completed.";
        }

        await TriageRepository.createMessage({
          triageSessionId: session.id,
          patientId: userId,
          role: "assistant",
          content: summaryText,
        });

        data.triageSessionId = session.id;
      } catch (saveErr) {
        console.error("[FeverRoute] Error saving triage session to PostgreSQL:", saveErr.message);
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("[FeverRoute /assess] Error:", error.message);
    return res.status(503).json({
      success: false,
      message: "Fever model service unavailable. Ensure the Python server is running.",
      error: error.message,
    });
  }
});

export default router;
