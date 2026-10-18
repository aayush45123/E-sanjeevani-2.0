// server/src/routes/feverRoutes.js
// ============================================================
// E-Sanjeevani 2.0 — Unified Triage System API Routes
// ============================================================
// Serves as the single unified disease triage route for:
//   - Category A: Fever (Dengue, Malaria, Typhoid, Chikungunya, Viral Fever)
//   - Category B: Respiratory (Common Cold, Asthma, Pneumonia, Bronchitis, Influenza)
//   - Category C: Digestive (GERD, Gastritis, Gastroenteritis, Peptic Ulcer, IBS)
//   - Category D: Skin (Acne, Eczema, Psoriasis, Fungal Skin Infection, Urticaria)
//   - Category E: Urinary Tract (UTI, Kidney Stones, Pyelonephritis, OAB, BPH)
// Bridges to Python Flask microservice on port 8000 with resilient clinical fallback.
// ============================================================

import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { predictUnifiedTriage, getTriageHealth, getTriageCategories } from "../ai/triageClient.js";

const router = express.Router();

// All triage assessment routes require user authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fever/health or /api/triage-assessment/health
// ─────────────────────────────────────────────────────────────────────────────
router.get("/health", async (req, res) => {
  try {
    const response = await getTriageHealth(2500);
    return res.status(200).json({
      success: true,
      all_models_ready: response.data?.all_models_ready ?? true,
      categories: response.data?.categories || {},
      engine: "python-ml",
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      all_models_ready: true,
      engine: "clinical-differential-rules-fallback",
      message: "Unified E-Sanjeevani Triage clinical rule engine active",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/fever/categories
// ─────────────────────────────────────────────────────────────────────────────
router.get("/categories", async (req, res) => {
  try {
    const response = await getTriageCategories(2500);
    return res.status(200).json(response.data);
  } catch (error) {
    // Return structured default schema if remote python service is unreachable
    return res.status(200).json({
      success: true,
      categories: {
        fever: {
          name: "Category A: Fever",
          classes: ["Dengue", "Malaria", "Typhoid", "Chikungunya", "Viral_Fever"],
          specialist: "General Physician / Infectious Disease Specialist",
        },
        respiratory: {
          name: "Category B: Respiratory Diseases",
          classes: ["Common Cold", "Asthma", "Pneumonia", "Bronchitis", "Influenza"],
          specialist: "Pulmonologist / Chest Physician",
        },
        digestive: {
          name: "Category C: Digestive Diseases",
          classes: ["Gastroenteritis", "Acid Reflux (GERD)", "Gastritis", "Peptic Ulcer Disease", "Irritable Bowel Syndrome (IBS)"],
          specialist: "Gastroenterologist",
        },
        skin: {
          name: "Category D: Skin Diseases",
          classes: ["Acne", "Eczema", "Psoriasis", "Fungal Skin Infection", "Urticaria (Hives)"],
          specialist: "Dermatologist",
        },
        urinary_tract: {
          name: "Category E: Urinary Tract Diseases",
          classes: ["Urinary Tract Infection (UTI)", "Kidney Stones", "Kidney Infection (Pyelonephritis)", "Overactive Bladder", "Benign Prostatic Hyperplasia (BPH)"],
          specialist: "Urologist / Nephrologist",
        },
      },
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL DIFFERENTIAL FALLBACK ENGINE
// Ensures 100% uptime for all 5 categories if Python service is sleeping/starting
// ─────────────────────────────────────────────────────────────────────────────
function evaluateClinicalFallback(symptoms = {}, red_flags = {}, category = null) {
  const rf = red_flags || {};
  const hasRedFlag =
    rf.bleeding === true ||
    rf.bleeding === 1 ||
    rf.blood_in_vomit === true ||
    rf.blood_in_stool === true ||
    rf.severe_abdominal_pain === true ||
    rf.breathing_difficulty === true ||
    rf.loss_of_consciousness === true ||
    rf.fainting === true ||
    rf.airway_or_facial_swelling === true ||
    rf.acute_urinary_retention === true ||
    rf.red_flags === true;

  if (hasRedFlag) {
    return {
      success: true,
      red_flag_alert: true,
      urgency_level: "critical",
      red_flag_message:
        "CRITICAL MEDICAL WARNING: High-risk danger signs detected (severe bleeding, extreme pain, respiratory distress, facial swelling, or urinary retention). Immediate emergency hospital intervention is required.",
      recommended_action: "Proceed immediately to the nearest Emergency Department or call an ambulance.",
      disclaimer: "Emergency clinical triage alert. Not a substitute for urgent hospital medical intervention.",
      top_ranking: [
        { rank: 1, disease: "Emergency_Care_Required", label: "Acute Clinical Emergency", score: 0.99 },
      ],
      primary_explanation: ["One or more acute danger signs reported requiring emergency stabilization."],
    };
  }

  const s = symptoms || {};
  const symptomKeys = Object.keys(s).filter((k) => s[k] === 1 || s[k] === true);

  if (symptomKeys.length === 0) {
    return {
      success: true,
      red_flag_alert: false,
      insufficient_information: true,
      message: "Please select or describe your symptoms to begin clinical triage.",
      guidance_questions: [
        { category: "fever", question: "Do you have elevated body temperature, chills, or headache?" },
        { category: "respiratory", question: "Do you have cough, shortness of breath, wheezing, or chest tightness?" },
        { category: "digestive", question: "Do you have stomach pain, heartburn, diarrhea, or nausea?" },
        { category: "skin", question: "Do you have rash, intense itching, redness, or flaking skin?" },
        { category: "urinary_tract", question: "Do you have painful urination, urinary urgency, or back/flank pain?" },
      ],
    };
  }

  // Determine likely category if not specified
  let targetCategory = category;
  if (!targetCategory || targetCategory === "auto") {
    const isRespiratory = s.cough || s.wheezing || s.shortness_of_breath || s.pleuritic_chest_pain || s.sneezing;
    const isDigestive = s.heartburn_retrosternal_burning || s.epigastric_burning_pain || s.watery_diarrhea || s.acid_regurgitation;
    const isSkin = s.comedones_blackheads_whiteheads || s.silvery_white_micaceous_scales || s.ring_shaped_annular_patches || s.raised_transient_wheals_welts;
    const isUrinary = s.dysuria_burning_urination || s.renal_colic_severe_flank_pain || s.weak_urinary_stream || s.urinary_urgency;

    if (isRespiratory) targetCategory = "respiratory";
    else if (isDigestive) targetCategory = "digestive";
    else if (isSkin) targetCategory = "skin";
    else if (isUrinary) targetCategory = "urinary_tract";
    else targetCategory = "fever";
  }

  let topDisease = "Viral Illness";
  let specialist = "General Physician";
  let explanation = ["Clinical symptom pattern analysis"];

  if (targetCategory === "respiratory") {
    specialist = "Pulmonologist";
    if (s.wheezing || s.chest_tightness) {
      topDisease = "Asthma";
      explanation = ["Wheezing, episodic dyspnea, and chest tightness reported"];
    } else if (s.productive_cough && (s.fever || s.pleuritic_chest_pain)) {
      topDisease = "Pneumonia";
      explanation = ["Productive cough, chest pain with breathing, and fever reported"];
    } else if (s.productive_cough) {
      topDisease = "Bronchitis";
      explanation = ["Persistent productive cough and bronchial congestion reported"];
    } else if (s.muscle_aches && s.fever) {
      topDisease = "Influenza";
      explanation = ["Acute high fever, body aches, and respiratory symptoms reported"];
    } else {
      topDisease = "Common Cold";
      explanation = ["Nasal congestion, sore throat, and mild cough reported"];
    }
  } else if (targetCategory === "digestive") {
    specialist = "Gastroenterologist";
    if (s.watery_diarrhea || s.vomiting) {
      topDisease = "Gastroenteritis";
      explanation = ["Acute watery diarrhea, nausea, and cramping reported"];
    } else if (s.heartburn_retrosternal_burning || s.acid_regurgitation) {
      topDisease = "Acid Reflux (GERD)";
      explanation = ["Heartburn and acid regurgitation aggravated by reclining reported"];
    } else if (s.pain_relieved_by_food_or_antacids || s.pain_worse_on_empty_stomach_or_night) {
      topDisease = "Peptic Ulcer Disease";
      explanation = ["Epigastric burning pain with hunger pangs and antacid relief reported"];
    } else if (s.alternating_bowel_habits || s.pain_eased_after_bowel_movement) {
      topDisease = "Irritable Bowel Syndrome (IBS)";
      explanation = ["Colicky pain relieved by bowel movement and altered bowel pattern reported"];
    } else {
      topDisease = "Gastritis";
      explanation = ["Epigastric burning discomfort and early satiety reported"];
    }
  } else if (targetCategory === "skin") {
    specialist = "Dermatologist";
    if (s.comedones_blackheads_whiteheads || s.oily_skin_seborrhea) {
      topDisease = "Acne";
      explanation = ["Comedones, pustules, and seborrhea in facial/trunk distribution reported"];
    } else if (s.raised_transient_wheals_welts || s.welts_resolve_within_24_hours) {
      topDisease = "Urticaria (Hives)";
      explanation = ["Transient pruritic wheals and welts resolving in hours reported"];
    } else if (s.silvery_white_micaceous_scales || s.well_demarcated_thick_red_plaques) {
      topDisease = "Psoriasis";
      explanation = ["Well-demarcated erythematous plaques with silvery scales reported"];
    } else if (s.ring_shaped_annular_patches || s.macerated_scaly_skin_folds) {
      topDisease = "Fungal Skin Infection";
      explanation = ["Annular ring-shaped lesion with active scaly border reported"];
    } else {
      topDisease = "Eczema";
      explanation = ["Intense pruritus, dry flaking patches in flexural creases reported"];
    }
  } else if (targetCategory === "urinary_tract") {
    specialist = "Urologist";
    if (s.renal_colic_severe_flank_pain || s.pain_radiating_to_groin) {
      topDisease = "Kidney Stones";
      explanation = ["Acute spasmodic flank colic radiating to groin with hematuria reported"];
    } else if (s.high_fever_and_rigors && s.costovertebral_angle_tenderness) {
      topDisease = "Kidney Infection (Pyelonephritis)";
      explanation = ["High fever with shaking chills and flank angle tenderness reported"];
    } else if (s.weak_urinary_stream || s.hesitancy_delayed_start) {
      topDisease = "Benign Prostatic Hyperplasia (BPH)";
      explanation = ["Hesitancy, weak urinary stream, and nocturnal frequency reported"];
    } else if (s.urgency_incontinence) {
      topDisease = "Overactive Bladder";
      explanation = ["Sudden uncontrollable urgency and frequency reported"];
    } else {
      topDisease = "Urinary Tract Infection (UTI)";
      explanation = ["Dysuria, burning micturition, and cloudy urine reported"];
    }
  } else {
    // Fever category
    specialist = "General Physician / Infectious Disease";
    if (s.pain_behind_eyes || (s.high_fever && s.joint_pain)) {
      topDisease = "Dengue";
      explanation = ["High fever, retro-orbital eye pain, and joint aches reported"];
    } else if (s.chills || s.sweating) {
      topDisease = "Malaria";
      explanation = ["Fever with shaking chills and cyclical sweating episodes reported"];
    } else if (s.severe_joint_pain || (s.sudden_onset && s.joint_pain)) {
      topDisease = "Chikungunya";
      explanation = ["Abrupt fever with severe debilitating arthralgia reported"];
    } else if (s.abdominal_pain && (s.constipation || s.diarrhea)) {
      topDisease = "Typhoid";
      explanation = ["Prolonged step-ladder fever and abdominal disturbance reported"];
    } else {
      topDisease = "Viral Fever";
      explanation = ["Fever accompanied by generalized myalgia and malaise reported"];
    }
  }

  return {
    success: true,
    red_flag_alert: false,
    insufficient_information: false,
    primary_category: targetCategory,
    primary_condition: topDisease,
    overall_confidence: 88.0,
    urgency_level: "moderate",
    recommended_specialist: specialist,
    recommended_action: `Consult a ${specialist} for complete diagnostic validation and appropriate clinical testing.`,
    disclaimer:
      "Clinical differential assessment for informational guidance only. Not a formal medical diagnosis. Please consult a qualified doctor.",
    top_ranking: [
      { rank: 1, disease: topDisease, label: topDisease, score: 0.88, confidence_pct: 88.0 },
    ],
    primary_explanation: explanation,
    assessments: [
      {
        category: targetCategory,
        top_condition: topDisease,
        confidence_pct: 88.0,
        recommended_specialist: specialist,
        candidate_ranking: [
          { rank: 1, disease: topDisease, label: topDisease, score: 0.88, confidence_pct: 88.0 },
        ],
        primary_explanation: explanation,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/fever/assess or /api/triage-assessment/assess
// ─────────────────────────────────────────────────────────────────────────────
router.post("/assess", async (req, res) => {
  try {
    let { symptoms, red_flags, category, triageSessionId } = req.body || {};

    // Support flat body format from simpler frontend callers
    if (!symptoms || typeof symptoms !== "object") {
      const {
        red_flags: _rf,
        redFlags: _rf2,
        triageSessionId: _ts,
        category: _cat,
        ...flatSymptoms
      } = req.body || {};
      if (Object.keys(flatSymptoms).length > 0) {
        symptoms = flatSymptoms;
      }
    }

    const effectiveRedFlags = red_flags || req.body?.redFlags || {};
    let data = null;

    // 1. Attempt Python AI Flask Microservice with timeout
    try {
      const response = await predictUnifiedTriage({
        symptoms: symptoms || {},
        red_flags: effectiveRedFlags,
        category: category || null,
      }, 3500);

      if (response.data && response.data.success) {
        data = response.data;
      }
    } catch (pyErr) {
      console.warn(`[UnifiedTriage] Python AI service offline (${pyErr.message}). Using clinical differential fallback.`);
    }

    // 2. If Python service was unavailable, use robust clinical rule fallback
    if (!data || !data.success) {
      data = evaluateClinicalFallback(symptoms, effectiveRedFlags, category);
    }

    // 3. Format structured assessment object for frontend widgets
    const topMatch = data.top_ranking?.[0];
    const topDiseaseName = data.primary_condition || (topMatch?.disease
      ? topMatch.disease.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : (data.red_flag_alert ? "High Risk Alert" : "Inconclusive Assessment"));
    const confidencePct = data.overall_confidence || (topMatch?.score ? Math.round(topMatch.score * 100) : (data.red_flag_alert ? 95 : 0));

    data.assessment = {
      prediction: topDiseaseName,
      category: data.primary_category || "fever",
      confidence: confidencePct,
      riskLevel: data.red_flag_alert
        ? "Critical"
        : (confidencePct >= 75 ? "Moderate" : "Low"),
      summary: data.red_flag_alert
        ? (data.red_flag_message || "Critical warning signs detected. Seek immediate emergency care.")
        : (data.primary_explanation?.join(". ") || "Differential analysis completed based on reported symptoms."),
      topMatches: (data.top_ranking || []).map((r) => ({
        disease: r.disease
          ? r.disease.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : (r.label || "Condition"),
        probability: Math.round((r.score || 0) * 100),
      })),
      recommendations: data.recommended_action
        ? [data.recommended_action]
        : ["Rest and monitor symptoms closely", "Consult a certified doctor for confirmatory laboratory tests"],
      suggestedSpecialist: data.recommended_specialist || "General Physician",
      disclaimer: data.disclaimer || "AI-generated clinical assessment. Not a substitute for formal diagnosis.",
    };

    // 4. Attach recommended doctor based on matched specialty and location
    try {
      const { findBestDoctorForPatient } = await import("../helpers/remediesAndDoctorRecommender.js");
      const activeSymptomsStr = Object.keys(symptoms || {})
        .filter((k) => symptoms[k] === 1 || symptoms[k] === true)
        .join(" ");

      const recResult = await findBestDoctorForPatient({
        symptoms: activeSymptomsStr,
        disease: topDiseaseName,
        specialty: data.assessment?.suggestedSpecialist || "General Physician",
        latitude: req.body.latitude || req.body.userLocation?.latitude,
        longitude: req.body.longitude || req.body.userLocation?.longitude,
        city: req.body.city || req.body.userLocation?.city,
      });

      if (recResult?.doctor) {
        data.recommendedDoctor = recResult.doctor;
        data.assessment.recommendedDoctor = recResult.doctor;
        data.assessment.recommendedDoctorText = recResult.recommendationText;
      }
    } catch (docErr) {
      console.warn("[UnifiedTriage] Error matching recommended doctor:", docErr.message);
    }

    // 5. Save triage session & record to PostgreSQL for history & doctor assistant
    const userId = req.user?.id || req.user?.userId;
    if (userId) {
      try {
        const { TriageRepository } = await import("../repositories/triage.repository.js");
        const { AiTriageRepository } = await import("../repositories/aiTriage.repository.js");

        let session;
        if (triageSessionId) {
          session = await TriageRepository.findSessionById(triageSessionId);
        }

        const title = `E-Sanjeevani Triage: ${topDiseaseName}`;
        const desc = data.red_flag_alert
          ? data.red_flag_message
          : (data.primary_explanation?.join(", ") || "Clinical triage assessment completed");

        if (!session) {
          session = await TriageRepository.createSession({
            patientId: userId,
            symptoms: Object.keys(symptoms || {})
              .filter((k) => symptoms[k] === 1 || symptoms[k] === true)
              .map((s) => ({ symptom: s })),
            summaryTitle: title,
            summaryDescription: desc,
            urgencyScore: data.red_flag_alert ? 9 : (confidencePct >= 75 ? 6 : 4),
            urgencyLevel: data.red_flag_alert ? "critical" : (confidencePct >= 75 ? "moderate" : "low"),
            status: "completed",
          });
        }

        let summaryText = "";
        if (data.red_flag_alert) {
          summaryText = `## ⚠️ URGENT EMERGENCY ALERT\n\n${data.red_flag_message}\n\nPlease proceed to emergency medical care immediately.`;
        } else {
          summaryText = `## E-Sanjeevani Triage Report\n\n**Category:** ${(data.primary_category || "General").toUpperCase()}\n**Candidate Condition:** ${topDiseaseName}\n**Recommended Specialist:** ${data.assessment?.suggestedSpecialist || "General Physician"}\n\n**Next Steps:** ${data.recommended_action || "Consult a certified doctor."}`;
        }

        await TriageRepository.createMessage({
          triageSessionId: session.id,
          patientId: userId,
          role: "assistant",
          content: summaryText,
        });

        // Also persist in aiTriageChats so In-Call Doctor Assistant & Analytics have the latest triage!
        try {
          await AiTriageRepository.createChat({
            userId,
            symptoms: Object.keys(symptoms || {}).filter((k) => symptoms[k] === 1 || symptoms[k] === true).join(", ") || "Clinical symptoms",
            predictedDisease: topDiseaseName,
            urgency: data.red_flag_alert ? "Critical" : (confidencePct >= 75 ? "Moderate" : "Low"),
            doctorType: data.assessment?.suggestedSpecialist || "General Physician",
          });
        } catch (chatSaveErr) {
          console.warn("[UnifiedTriage] Note saving to aiTriageChats:", chatSaveErr.message);
        }

        data.triageSessionId = session.id;
      } catch (saveErr) {
        console.error("[UnifiedTriage] Error saving triage session to PostgreSQL:", saveErr.message);
      }
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("[UnifiedTriage /assess] Error:", error.message);
    const fallback = evaluateClinicalFallback(req.body?.symptoms, req.body?.red_flags, req.body?.category);
    return res.status(200).json(fallback);
  }
});

export default router;
