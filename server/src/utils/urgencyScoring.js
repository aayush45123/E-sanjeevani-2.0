// Urgency Scoring Service
// Calculates urgency score based on symptoms and medical data

const urgencyKeywords = {
  critical: [
    "chest pain",
    "difficulty breathing",
    "bleeding",
    "unconscious",
    "severe allergic",
    "poisoning",
    "stroke symptoms",
    "severe head injury",
  ],
  high: [
    "high fever",
    "severe headache",
    "abdominal pain",
    "severe dizziness",
    "vomiting",
    "severe injury",
    "burn",
    "serious bleeding",
  ],
  moderate: [
    "fever",
    "cough",
    "sore throat",
    "mild headache",
    "nausea",
    "diarrhea",
    "skin rash",
    "joint pain",
  ],
  low: [
    "mild cold",
    "minor cuts",
    "minor bruises",
    "general checkup",
    "consultation",
  ],
};

const severityScore = {
  mild: 1,
  moderate: 3,
  severe: 7,
};

const calculateUrgencyScore = (symptoms, medicalHistory, age) => {
  let score = 0;

  // Check for critical symptoms
  symptoms.forEach((symptom) => {
    const symptomLower = symptom.symptom.toLowerCase();

    // Critical check
    if (
      urgencyKeywords.critical.some((keyword) => symptomLower.includes(keyword))
    ) {
      score += 10;
    }
    // High check
    else if (
      urgencyKeywords.high.some((keyword) => symptomLower.includes(keyword))
    ) {
      score += 7;
    }
    // Moderate check
    else if (
      urgencyKeywords.moderate.some((keyword) => symptomLower.includes(keyword))
    ) {
      score += 4;
    }
    // Low check
    else if (
      urgencyKeywords.low.some((keyword) => symptomLower.includes(keyword))
    ) {
      score += 1;
    }

    // Add severity factor
    if (symptom.severity) {
      score += severityScore[symptom.severity] || 0;
    }

    // Duration factor - longer duration might indicate more concern
    if (symptom.duration) {
      if (
        symptom.duration.includes("week") ||
        symptom.duration.includes("month")
      ) {
        score += 1;
      }
    }
  });

  // Age factor - older patients with same symptoms get slightly higher score
  if (age > 60) {
    score += 1;
  } else if (age < 5) {
    score += 1;
  }

  // Cap at 10
  score = Math.min(score, 10);
  score = Math.max(score, 0);

  return Math.round(score * 10) / 10; // Round to 1 decimal
};

const getUrgencyLevel = (score) => {
  if (score >= 8) return "critical";
  if (score >= 6) return "high";
  if (score >= 4) return "moderate";
  return "low";
};

const getRecommendedTests = (symptoms, conditions) => {
  const tests = new Set();

  // Common tests based on symptoms
  const symptomTests = {
    fever: ["Blood Test", "CBC"],
    cough: ["Chest X-ray", "Pulmonary Function Test"],
    "chest pain": ["ECG", "Troponin Test", "Chest X-ray"],
    headache: ["MRI", "CT Scan"],
    "abdominal pain": ["Ultrasound", "CT Scan"],
    "high blood pressure": ["Blood Pressure Monitoring", "Blood Test"],
    "diabetes symptoms": ["Blood Sugar Test", "HbA1c Test"],
  };

  symptoms.forEach((symptom) => {
    const symptomLower = symptom.symptom.toLowerCase();
    Object.keys(symptomTests).forEach((key) => {
      if (symptomLower.includes(key)) {
        symptomTests[key].forEach((test) => tests.add(test));
      }
    });
  });

  // Add basic tests
  tests.add("Blood Test");
  tests.add("Vital Signs Check");

  return Array.from(tests);
};

const getRecommendedSpecialties = (symptoms, urgencyScore) => {
  const specialties = new Set();

  const symptomSpecialties = {
    "chest pain": ["Cardiologist", "General Physician"],
    breathing: ["Pulmonologist", "Cardiologist"],
    headache: ["Neurologist", "General Physician"],
    "abdominal pain": ["Gastroenterologist", "General Physician"],
    "joint pain": ["Orthopedic", "Rheumatologist"],
    skin: ["Dermatologist"],
    fever: ["General Physician", "Infectious Disease Specialist"],
    cough: ["Pulmonologist", "General Physician"],
    infection: ["Infectious Disease Specialist", "General Physician"],
    anxiety: ["Psychiatrist", "Psychologist"],
    depression: ["Psychiatrist", "Psychologist"],
    "high blood pressure": ["Cardiologist", "General Physician"],
    diabetes: ["Endocrinologist", "General Physician"],
    eye: ["Ophthalmologist"],
    ear: ["ENT Specialist"],
    throat: ["ENT Specialist"],
    dental: ["Dentist"],
    pregnancy: ["Gynecologist"],
    "women health": ["Gynecologist"],
    "men health": ["Urologist"],
  };

  symptoms.forEach((symptom) => {
    const symptomLower = symptom.symptom.toLowerCase();
    Object.keys(symptomSpecialties).forEach((key) => {
      if (symptomLower.includes(key)) {
        symptomSpecialties[key].forEach((spec) => specialties.add(spec));
      }
    });
  });

  // Default specialty
  if (specialties.size === 0) {
    specialties.add("General Physician");
  }

  return Array.from(specialties);
};

const getImmediateRecommendations = (urgencyScore, symptoms) => {
  const recommendations = [];

  if (urgencyScore >= 8) {
    recommendations.push("Please seek immediate medical attention");
    recommendations.push("Contact emergency services if symptoms worsen");
    recommendations.push("Do not delay in visiting a hospital");
  } else if (urgencyScore >= 6) {
    recommendations.push("Please consult a specialist doctor soon");
    recommendations.push("Monitor your symptoms closely");
    recommendations.push("Avoid strenuous activities");
  } else if (urgencyScore >= 4) {
    recommendations.push("Consult a doctor within a few days");
    recommendations.push("Take prescribed medications if any");
    recommendations.push("Rest and hydrate well");
  } else {
    recommendations.push("Monitor your symptoms");
    recommendations.push("Consult a doctor if symptoms persist");
    recommendations.push("Maintain healthy lifestyle habits");
  }

  // Add specific recommendations based on symptoms
  const symptomLower = symptoms.map((s) => s.symptom.toLowerCase()).join(" ");

  if (symptomLower.includes("fever")) {
    recommendations.push("Stay hydrated and get adequate rest");
    recommendations.push("Use fever-reducing medication if needed");
  }

  if (symptomLower.includes("cough")) {
    recommendations.push("Avoid cold and irritants");
    recommendations.push("Use cough syrups or lozenges");
  }

  if (symptomLower.includes("headache")) {
    recommendations.push("Get adequate rest and sleep");
    recommendations.push("Avoid bright screens and loud noises");
  }

  return recommendations;
};

module.exports = {
  calculateUrgencyScore,
  getUrgencyLevel,
  getRecommendedTests,
  getRecommendedSpecialties,
  getImmediateRecommendations,
};
