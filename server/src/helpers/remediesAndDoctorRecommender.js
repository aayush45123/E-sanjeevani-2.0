import { DoctorProfileRepository } from "../repositories/doctorProfile.repository.js";
import { FeedbackService } from "../services/feedback.service.js";

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

export const getTopDoctorRecommendation = async (specialistType) => {
  try {
    const rows = await DoctorProfileRepository.findAvailableDoctors({
      limit: 20,
      offset: 0,
    });

    if (!rows || rows.length === 0) return null;

    const targetSpec = String(specialistType || "").toLowerCase();

    const scoredDoctors = await Promise.all(
      rows.map(async ({ user, profile }) => {
        let ratingData = { averageRating: 4.5, totalReviews: 0 };
        try {
          ratingData = await FeedbackService.getDoctorRating(user.id);
        } catch {}

        const docSpec = String(profile?.specialization || "").toLowerCase();
        let score = 0;

        // Match specialization
        if (
          docSpec.includes(targetSpec) ||
          targetSpec.includes(docSpec) ||
          (targetSpec.includes("general") && docSpec.includes("physician")) ||
          (targetSpec.includes("fever") && docSpec.includes("general"))
        ) {
          score += 40;
        } else if (docSpec.includes("general") || docSpec.includes("internal")) {
          score += 20;
        }

        // Rating
        const avgRating = Number(ratingData.averageRating) || 4.5;
        score += avgRating * 10;

        // Experience
        const exp = Number(profile?.experience || 5);
        score += Math.min(exp, 30) * 1.5;

        // Reviews count
        const reviews = Number(ratingData.totalReviews || 0);
        score += Math.min(reviews, 20);

        return {
          id: user.id,
          name: user.name,
          specialization: profile?.specialization || "General Physician",
          experience: profile?.experience || 5,
          hospitalName: profile?.hospitalName || "E-Sanjeevani Telehealth",
          priorityScore: Math.round(score),
          rating: avgRating.toFixed(1),
          totalReviews: reviews,
        };
      })
    );

    scoredDoctors.sort((a, b) => b.priorityScore - a.priorityScore);
    const topDoc = scoredDoctors[0];

    if (!topDoc) return null;

    return (
      `### 🩺 Recommended Doctor (Best Match by Priority Score)\n` +
      `• **Dr. ${topDoc.name}** (${topDoc.specialization})\n` +
      `  - **Priority Match Score:** ${topDoc.priorityScore}/100\n` +
      `  - **Experience:** ${topDoc.experience} years\n` +
      `  - **Patient Rating:** ⭐ ${topDoc.rating}/5 (${topDoc.totalReviews} reviews)\n` +
      `  - **Hospital:** ${topDoc.hospitalName}\n` +
      `  👉 *You can book a direct video consultation with Dr. ${topDoc.name} from the Available Doctors page.*`
    );
  } catch (err) {
    console.error("Error in getTopDoctorRecommendation:", err);
    return null;
  }
};
