import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { FeedbackService } from "../services/feedback.service.js";
import { formatDoctor } from "./responseFormatter.helper.js";

const REMEDY_MAP = {
  dengue: [
    "**Papaya Leaf Juice**: Extract fresh juice from young papaya leaves (15-20 ml twice daily) to support healthy platelet levels.",
    "**Electrolyte Hydration**: Drink tender coconut water, ORS solution, and clear broths to combat fluid loss.",
    "**Pomegranate & Giloy Juice**: Boost vitality and help stabilize immunity with fresh pomegranate juice.",
    "**Rest**: Maintain complete physical bed rest and apply lukewarm damp cloth compresses if fever spikes.",
  ],
  malaria: [
    "**Ginger-Tulsi Decoction**: Boil crushed ginger and holy basil (tulsi) leaves with black pepper. Drink warm with honey to relieve chills.",
    "**Cinnamon Infusion**: Sip warm water infused with cinnamon powder and honey for natural antimicrobial and soothing properties.",
    "**Light Diet**: Consume easily digestible moong dal khichdi, vegetable soups, and boiled apples.",
    "**Continuous Hydration**: Keep sipping warm boiled water throughout the day.",
  ],
  typhoid: [
    "**Boiled Water**: Strictly consume water that has been boiled vigorously for 5+ minutes and cooled.",
    "**Oral Rehydration (ORS)**: Drink WHO-standard ORS packets to maintain intestinal electrolyte balance.",
    "**Light Buttermilk with Jeera**: Fresh thin chaas with roasted cumin powder to gently support sensitive digestion.",
    "**Soft Bland Foods**: Stick to bananas, soft cooked rice, oats, and boiled potatoes. Avoid raw or spicy items.",
  ],
  fever: [
    "**Ginger-Tulsi-Honey Kadha**: Simmer fresh ginger, tulsi, and cloves in water for 10 minutes. Sip twice daily.",
    "**Turmeric Milk**: Drink warm milk with 1/2 tsp turmeric and a pinch of black pepper before bedtime.",
    "**Steam Inhalation**: Inhale warm steam with ajwain (carom seeds) to ease headache and sinus congestion.",
    "**Lukewarm Sponge Bath**: Sponge forehead and limbs with lukewarm water if temperature exceeds 100°F.",
  ],
  cold_flu: [
    "**Warm Salt Water Gargle**: Dissolve 1/2 tsp salt in warm water. Gargle 3-4 times daily for throat irritation.",
    "**Honey-Pepper Cough Syrup**: Mix 1 tsp raw honey with freshly ground black pepper for cough relief.",
    "**Herbal Teas**: Drink warm green or chamomile tea with lemon and honey to soothe mucous membranes.",
    "**Hydration & Steam**: Take regular steam inhalations and drink plenty of warm fluids.",
  ],
  general: [
    "**Rest & Sleep**: Give your body at least 8 to 9 hours of restorative sleep to empower your immune defense.",
    "**Warm Hydration**: Drink 2.5-3 liters of lukewarm water, herbal teas, or warm soups daily.",
    "**Immunity Kadha**: Consume a warm decoction of ginger, tulsi, and honey once daily.",
    "**Nutritious Soft Meals**: Prefer fresh, home-cooked, easy-to-digest foods.",
  ],
};

export const getHomemadeRemediesText = (diseaseName, urgency) => {
  const u = String(urgency || "").toLowerCase();
  const isHighOrCritical =
    u.includes("critical") ||
    u.includes("emergency") ||
    u.includes("high") ||
    u.includes("severe");

  if (isHighOrCritical) {
    return null; // For high/critical urgency, do not rely on home remedies
  }

  const d = String(diseaseName || "").toLowerCase();
  let remedies = REMEDY_MAP.general;

  if (d.includes("dengue")) {
    remedies = REMEDY_MAP.dengue;
  } else if (d.includes("malaria")) {
    remedies = REMEDY_MAP.malaria;
  } else if (d.includes("typhoid")) {
    remedies = REMEDY_MAP.typhoid;
  } else if (d.includes("cold") || d.includes("flu") || d.includes("cough")) {
    remedies = REMEDY_MAP.cold_flu;
  } else if (d.includes("fever") || d.includes("viral")) {
    remedies = REMEDY_MAP.fever;
  }

  return (
    `### 🌿 Prescribed Homemade Remedies (Low/Medium Urgency)\n` +
    remedies.map((r) => `• ${r}`).join("\n") +
    `\n\n*Note: These home remedies are supportive care for mild/moderate symptoms and do not substitute a formal prescription.*`
  );
};

export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1));
};

export const mapConditionToSpecialty = (text) => {
  if (!text) return "General Physician";
  const t = String(text).toLowerCase();

  if (/chest\s*pain|heart|angina|palpitation|blood\s*pressure|hypertension|\bcardio/i.test(t)) {
    return "Cardiology";
  }
  if (/skin|rash|acne|itch|eczema|psoriasis|fungal|dermat/i.test(t)) {
    return "Dermatology";
  }
  if (/bone|joint|knee|fracture|ortho|arthritis|back\s*pain|sprain|spine|shoulder|ligament/i.test(t)) {
    return "Orthopedics";
  }
  if (/child|baby|infant|toddler|pediatric|newborn/i.test(t)) {
    return "Pediatrics";
  }
  if (/stomach|acidity|gas|diarrhea|constipation|vomit|nausea|liver|abdomen|digest|gut|acid\s*reflux|ulcer|gastro/i.test(t)) {
    return "Gastroenterology";
  }
  if (/brain|nerve|seizure|paralysis|stroke|vertigo|migraine|neuro/i.test(t)) {
    return "Neurology";
  }
  if (/period|menstrual|pregnan|pcos|ovary|uterus|gynae|vaginal/i.test(t)) {
    return "Gynecology";
  }
  if (/ear|nose|throat|tonsil|sinus|hearing|\bent\b/i.test(t)) {
    return "ENT";
  }
  if (/eye|vision|blur|cataract|ophthalm/i.test(t)) {
    return "Ophthalmology";
  }
  if (/tooth|teeth|gum|cavity|dent/i.test(t)) {
    return "Dentistry";
  }
  if (/breath|lung|asthma|bronchitis|wheez|pulmon/i.test(t)) {
    return "Pulmonology";
  }
  if (/stress|anxiety|depress|panic|insomnia|mental|psych/i.test(t)) {
    return "Psychiatry";
  }
  if (/kidney|urinary|urine|bladder|nephro|uro/i.test(t)) {
    return "Urology";
  }
  if (/sugar|diabetes|thyroid|endocrin/i.test(t)) {
    return "Endocrinology";
  }
  return "General Physician";
};

export const findBestDoctorForPatient = async ({
  symptoms = "",
  disease = "",
  specialty = "",
  latitude = null,
  longitude = null,
  city = "",
} = {}) => {
  try {
    const rows = await DoctorProfileRepository.findAvailableDoctors({
      limit: 100,
      offset: 0,
    });

    if (!rows || rows.length === 0) return null;

    let targetSpec = specialty;
    if (!targetSpec || targetSpec === "General Assessment" || targetSpec === "Specialist") {
      targetSpec = mapConditionToSpecialty(`${disease} ${symptoms}`);
    }
    const targetSpecLower = targetSpec.toLowerCase();

    const userLat = latitude !== null && latitude !== undefined ? Number(latitude) : null;
    const userLon = longitude !== null && longitude !== undefined ? Number(longitude) : null;
    const hasLocation = userLat !== null && userLon !== null && !isNaN(userLat) && !isNaN(userLon);

    const scoredDoctors = await Promise.all(
      rows.map(async ({ user, profile }) => {
        let ratingData = { averageRating: 4.8, totalReviews: 12 };
        try {
          ratingData = await FeedbackService.getDoctorRating(user.id);
        } catch {}

        const docSpec = String(profile?.specialization || "").toLowerCase();
        let score = 0;
        let matchReason = "";

        // 1. Specialty matching (0-50 pts)
        if (
          docSpec.includes(targetSpecLower) ||
          targetSpecLower.includes(docSpec) ||
          (targetSpecLower.includes("physician") && docSpec.includes("medicine")) ||
          (targetSpecLower.includes("medicine") && docSpec.includes("physician"))
        ) {
          score += 50;
          matchReason = `Specialist in ${profile?.specialization || targetSpec}`;
        } else if (docSpec.includes("general") || docSpec.includes("internal medicine")) {
          score += 30;
          matchReason = `General Physician for comprehensive evaluation`;
        } else {
          score += 10;
          matchReason = `${profile?.specialization || "Physician"}`;
        }

        // 2. Location & Distance matching (0-30 pts)
        let distanceKm = null;
        if (hasLocation && profile?.clinicLatitude && profile?.clinicLongitude) {
          distanceKm = calculateHaversineDistanceKm(
            userLat,
            userLon,
            Number(profile.clinicLatitude),
            Number(profile.clinicLongitude)
          );
          if (distanceKm !== null) {
            if (distanceKm <= 5) {
              score += 30;
              matchReason += ` • Nearby (${distanceKm} km away)`;
            } else if (distanceKm <= 12) {
              score += 22;
              matchReason += ` • ${distanceKm} km away`;
            } else if (distanceKm <= 25) {
              score += 15;
              matchReason += ` • ${distanceKm} km away`;
            } else {
              score += 5;
            }
          }
        } else if (city && profile?.clinicCity) {
          if (profile.clinicCity.toLowerCase().includes(city.toLowerCase())) {
            score += 20;
            matchReason += ` • Located in ${profile.clinicCity}`;
          }
        }

        // 3. Ratings (0-20 pts)
        const avgRating = Number(ratingData.averageRating) || 4.7;
        score += avgRating * 4;

        // 4. Experience (0-10 pts)
        const exp = Number(profile?.experience || 5);
        score += Math.min(exp, 20) * 0.5;

        const formatted = formatDoctor(user, profile);
        if (distanceKm !== null) {
          formatted.distanceInKm = distanceKm;
          formatted.distance = distanceKm;
        }

        return {
          ...formatted,
          priorityScore: Math.round(score),
          rating: avgRating.toFixed(1),
          totalReviews: Number(ratingData.totalReviews || 0),
          matchReason,
        };
      })
    );

    scoredDoctors.sort((a, b) => b.priorityScore - a.priorityScore);
    const topDoc = scoredDoctors[0];
    if (!topDoc) return null;

    const cleanDocName = topDoc.displayName || `Dr. ${topDoc.name}`;
    const distanceText = topDoc.distanceInKm ? ` (${topDoc.distanceInKm} km away)` : "";
    const hospitalText = topDoc.hospitalName ? ` • ${topDoc.hospitalName}` : "";
    const feeText = topDoc.consultationFee ? ` • ₹${topDoc.consultationFee} Fee` : "";

    const recommendationText =
      `### 🩺 Recommended Doctor Match\n` +
      `• **${cleanDocName}** (${topDoc.specialization || targetSpec})${distanceText}\n` +
      `  - **Match:** ${topDoc.matchReason}\n` +
      `  - **Experience:** ${topDoc.experience || 5} years${hospitalText}${feeText}\n` +
      `  - **Rating:** ⭐ ${topDoc.rating}/5 (${topDoc.totalReviews} reviews)\n` +
      `  👉 *You can directly connect with ${cleanDocName} below to book your appointment.*`;

    return {
      doctor: topDoc,
      recommendationText,
    };
  } catch (err) {
    console.error("Error in findBestDoctorForPatient:", err);
    return null;
  }
};

export const getTopDoctorRecommendation = async (specialistType) => {
  const result = await findBestDoctorForPatient({ specialty: specialistType });
  return result?.recommendationText || null;
};

