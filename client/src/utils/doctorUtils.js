/**
 * Utility functions for doctor name formatting and presentation.
 * Prevents "Dr. Dr" duplications and ensures consistent professional display.
 */

/**
 * Strips duplicate prefixes ("Dr.", "Dr", "Doctor") and returns raw clean doctor name.
 * e.g., "Dr. Rahul Sharma" -> "Rahul Sharma"
 *       "Dr Dr Rahul" -> "Rahul"
 *       "Doctor" -> "Specialist"
 */
export function getCleanDoctorName(rawName) {
  if (!rawName || typeof rawName !== "string") return "Specialist";
  let cleaned = rawName.trim();
  // Repeatedly remove leading Dr., Dr, Doctor (case-insensitive)
  while (/^(dr\.?|doctor)\s+/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(dr\.?|doctor)\s+/i, "").trim();
  }
  // If the user's name was literally just "Doctor" or "Dr", fallback
  if (!cleaned || /^(dr\.?|doctor)$/i.test(cleaned)) {
    return "Specialist";
  }
  return cleaned;
}

/**
 * Returns a formatted doctor name with exactly ONE "Dr." prefix.
 * e.g., "Rahul Sharma" -> "Dr. Rahul Sharma"
 *       "Dr. Rahul Sharma" -> "Dr. Rahul Sharma"
 *       "Dr Dr. Rahul" -> "Dr. Rahul"
 *       "" -> "Dr. Specialist"
 */
export function formatDoctorName(rawName) {
  const clean = getCleanDoctorName(rawName);
  return `Dr. ${clean}`;
}

/**
 * Returns initials for doctor avatar circles.
 */
export function getDoctorInitials(rawName) {
  const clean = getCleanDoctorName(rawName);
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (clean[0] || "D").toUpperCase();
}
