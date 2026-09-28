/**
 * remediesAndDoctorRecommender.js
 * Comprehensive utility for:
 * 1. Generating safe, evidence-based homemade remedies for low/medium urgency predictions
 * 2. Finding the best-suited doctor based on Priority Score from available doctors
 */

// Database of disease-specific homemade remedies
const REMEDY_MAP = {
  dengue: [
    {
      title: "Papaya Leaf Juice",
      desc: "Extract fresh juice from young papaya leaves (15-20 ml twice daily). Known to support platelet count.",
      icon: "🍃",
    },
    {
      title: "Tender Coconut Water & ORS",
      desc: "Replenish vital electrolytes and prevent dehydration by sipping coconut water and ORS throughout the day.",
      icon: "🥥",
    },
    {
      title: "Pomegranate & Giloy Water",
      desc: "Drink fresh pomegranate juice or boiled Giloy water to reduce fatigue and support immune response.",
      icon: "🍇",
    },
    {
      title: "Complete Bed Rest & Cold Compress",
      desc: "Avoid physical exertion. Use a lukewarm or cool damp cloth on forehead if temperature rises above 101°F.",
      icon: "🛌",
    },
  ],
  malaria: [
    {
      title: "Warm Ginger & Tulsi Decoction",
      desc: "Boil crushed ginger, 5-6 holy basil (tulsi) leaves, and black pepper. Drink warm with honey to ease chills.",
      icon: "☕",
    },
    {
      title: "Cinnamon & Honey Water",
      desc: "Boil cinnamon powder in water, add honey. Known for antimicrobial and fever-reducing properties.",
      icon: "🍯",
    },
    {
      title: "Light Nourishing Diet",
      desc: "Consume easily digestible food like moong dal khichdi, vegetable soup, and oatmeal.",
      icon: "🍲",
    },
    {
      title: "Intense Hydration",
      desc: "Drink warm boiled water, herbal teas, and clear broths to help the body flush metabolic waste.",
      icon: "💧",
    },
  ],
  typhoid: [
    {
      title: "Boiled & Filtered Water Only",
      desc: "Strictly consume water that has been boiled for at least 5 minutes and cooled, or bottled water.",
      icon: "🚰",
    },
    {
      title: "ORS & Barley Water",
      desc: "Maintain intestinal hydration and electrolyte balance with ORS packets and soothing barley water.",
      icon: "🌾",
    },
    {
      title: "Fresh Buttermilk with Roasted Cumin",
      desc: "Drink light homemade buttermilk with a pinch of roasted jeera to aid sensitive gastrointestinal digestion.",
      icon: "🥛",
    },
    {
      title: "Soft Bland Diet (BRAT)",
      desc: "Stick to bananas, soft rice, applesauce, and well-cooked porridge. Completely avoid spicy, oily, or raw food.",
      icon: "🍌",
    },
  ],
  fever: [
    {
      title: "Ginger, Tulsi & Honey Kadha",
      desc: "Simmer fresh ginger, tulsi leaves, and cloves in water for 10 minutes. Sip warm twice a day.",
      icon: "🍵",
    },
    {
      title: "Turmeric Milk (Golden Milk)",
      desc: "A warm cup of milk with 1/2 teaspoon pure turmeric and black pepper before sleeping reduces inflammation.",
      icon: "✨",
    },
    {
      title: "Steam Inhalation",
      desc: "Inhale steam with a drop of eucalyptus oil or carom seeds (ajwain) to clear nasal passages and ease head heaviness.",
      icon: "💨",
    },
    {
      title: "Lukewarm Sponge Bath",
      desc: "Sponge forehead, arms, and legs with lukewarm water if temperature exceeds 100°F. Never use ice-cold water.",
      icon: "🧊",
    },
  ],
  cold_flu: [
    {
      title: "Warm Salt Water Gargle",
      desc: "Dissolve 1/2 teaspoon rock salt in warm water. Gargle 3-4 times daily to soothe an irritated, sore throat.",
      icon: "🧂",
    },
    {
      title: "Honey & Black Pepper Syrup",
      desc: "Mix 1 teaspoon raw honey with a pinch of freshly ground black pepper to quiet dry or tickly coughs.",
      icon: "🍯",
    },
    {
      title: "Carom Seed (Ajwain) Steam",
      desc: "Boil water with 1 tablespoon ajwain seeds and inhale the vapors to open congested sinuses.",
      icon: "🌿",
    },
    {
      title: "Herbal Green / Chamomile Tea",
      desc: "Warm antioxidant-rich herbal teas soothe mucous membranes and promote restful sleep.",
      icon: "🫖",
    },
  ],
  chikungunya: [
    {
      title: "Warm Turmeric & Ginger Paste Compress",
      desc: "Apply a lukewarm paste of turmeric and dry ginger powder over swollen, stiff joints to alleviate pain.",
      icon: "🩹",
    },
    {
      title: "Epsom Salt Soaks",
      desc: "Soak aching feet and hands in warm water mixed with Epsom salt (magnesium sulfate) for 15 minutes.",
      icon: "🛁",
    },
    {
      title: "Anti-Inflammatory Hydration",
      desc: "Sip warm water infused with lemon, mint, and cucumber throughout the day.",
      icon: "🍋",
    },
  ],
  gastro: [
    {
      title: "Fennel & Cumin (Saunf-Jeera) Water",
      desc: "Boil 1 teaspoon each of fennel and cumin seeds in water. Drink warm after meals to soothe acidity and bloating.",
      icon: "🌱",
    },
    {
      title: "Probiotic Curd / Buttermilk",
      desc: "Consume fresh curd or thin chaas with a pinch of black salt to restore beneficial gut bacteria.",
      icon: "🥣",
    },
    {
      title: "Ginger & Mint Tea",
      desc: "Sip warm water infused with fresh mint leaves and ginger slices to calm nausea and stomach cramps.",
      icon: "🍃",
    },
  ],
  general: [
    {
      title: "Rest & Recovery",
      desc: "Allow your immune system to fight the infection with at least 8 to 9 hours of uninterrupted rest.",
      icon: "🛌",
    },
    {
      title: "Warm Hydration Protocol",
      desc: "Drink 2.5 to 3 liters of warm liquids daily (lukewarm water, herbal infusions, clear broths).",
      icon: "💧",
    },
    {
      title: "Immunity Boost Kadha",
      desc: "Drink a traditional warm concoction of ginger, tulsi, black pepper, and honey once daily.",
      icon: "🍵",
    },
    {
      title: "Light & Wholesome Meals",
      desc: "Prefer fresh, warm, easily digestible home-cooked meals. Avoid processed, fried, or cold foods.",
      icon: "🥗",
    },
  ],
};

/**
 * Checks whether urgency is low or medium (eligible for home remedies)
 */
export function isLowOrMediumUrgency(urgency, urgencyScore) {
  if (typeof urgencyScore === "number") {
    return urgencyScore <= 6;
  }
  if (!urgency) return true; // Default fallback to safe home remedies
  const u = String(urgency).toLowerCase().trim();
  if (u.includes("critical") || u.includes("emergency") || u.includes("high") || u.includes("severe")) {
    return false;
  }
  return true; // "low", "mild", "medium", "moderate", "non-urgent", etc.
}

/**
 * Returns list of 3-4 homemade remedies based on disease and urgency
 */
export function getHomemadeRemedies(diseaseName, urgency, urgencyScore) {
  const isEligible = isLowOrMediumUrgency(urgency, urgencyScore);
  if (!isEligible) {
    return {
      isEligible: false,
      remedies: [],
      warning:
        "High / Critical Urgency detected. Home remedies are not sufficient. Please seek emergency clinical care immediately.",
    };
  }

  const d = String(diseaseName || "").toLowerCase();
  let remedies = REMEDY_MAP.general;

  if (d.includes("dengue")) {
    remedies = REMEDY_MAP.dengue;
  } else if (d.includes("malaria")) {
    remedies = REMEDY_MAP.malaria;
  } else if (d.includes("typhoid")) {
    remedies = REMEDY_MAP.typhoid;
  } else if (d.includes("chikungunya")) {
    remedies = REMEDY_MAP.chikungunya;
  } else if (d.includes("cold") || d.includes("flu") || d.includes("cough") || d.includes("respiratory") || d.includes("bronchitis")) {
    remedies = REMEDY_MAP.cold_flu;
  } else if (d.includes("fever") || d.includes("pyrexia") || d.includes("viral")) {
    remedies = REMEDY_MAP.fever;
  } else if (d.includes("stomach") || d.includes("gastric") || d.includes("acidity") || d.includes("diarrhea") || d.includes("indigestion")) {
    remedies = REMEDY_MAP.gastro;
  }

  return {
    isEligible: true,
    remedies,
    disclaimer:
      "These traditional home remedies support recovery for mild/moderate symptoms, but are not a substitute for professional medical diagnosis.",
  };
}

/**
 * Calculates priority score for a doctor and finds the best match
 * Formula:
 * - Specialization Match Bonus: +40 points
 * - Rating (1-5): rating * 10 (up to 50 points)
 * - Experience (years): Math.min(experience, 30) * 1.5 (up to 45 points)
 * - Review Volume: Math.min(totalReviews, 20) * 1 (up to 20 points)
 */
export function calculateDoctorPriorityScore(doctor, targetSpecialist, ratingData) {
  let score = 0;
  const docSpec = String(doctor.specialization || "").toLowerCase();
  const targetSpec = String(targetSpecialist || "").toLowerCase();

  // Match specialization
  const isMatch =
    docSpec.includes(targetSpec) ||
    targetSpec.includes(docSpec) ||
    (targetSpec.includes("general") && docSpec.includes("physician")) ||
    (targetSpec.includes("fever") && docSpec.includes("general"));

  if (isMatch) {
    score += 40;
  } else if (docSpec.includes("general") || docSpec.includes("internal")) {
    score += 20; // General Physician fallback
  }

  // Rating points
  const avgRating = ratingData?.totalReviews > 0
    ? Number(ratingData.averageRating)
    : (doctor.rating || 4.5);
  score += avgRating * 10;

  // Experience points
  const exp = Number(doctor.experience || 5);
  score += Math.min(exp, 30) * 1.5;

  // Total reviews points
  const reviews = ratingData?.totalReviews || 0;
  score += Math.min(reviews, 20) * 1;

  return Math.round(score);
}

/**
 * Selects the top recommended doctor from available doctors list based on Priority Score
 */
export function getRecommendedDoctor(availableDoctors, targetSpecialist, doctorRatingsMap = {}) {
  if (!availableDoctors || availableDoctors.length === 0) {
    return null;
  }

  const scoredDoctors = availableDoctors.map((doc) => {
    const docId = doc.id || doc._id;
    const ratingData = doctorRatingsMap[docId] || null;
    const score = calculateDoctorPriorityScore(doc, targetSpecialist, ratingData);
    const avgRating = ratingData?.totalReviews > 0
      ? Number(ratingData.averageRating).toFixed(1)
      : (doc.rating ? Number(doc.rating).toFixed(1) : "New");
    const reviewsCount = ratingData?.totalReviews || 0;

    return {
      ...doc,
      priorityScore: score,
      effectiveRating: avgRating,
      totalReviews: reviewsCount,
    };
  });

  // Sort descending by priority score
  scoredDoctors.sort((a, b) => b.priorityScore - a.priorityScore);

  return scoredDoctors[0] || null;
}
