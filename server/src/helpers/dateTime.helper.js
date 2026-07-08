import { SLOT_DURATION_MINUTES } from "../constants/index.js";

export const getDayName = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

export const normalizeDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

export const getDateString = (value) => {
  const date = normalizeDate(value);
  if (!date) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeTime = (t) => {
  if (typeof t !== "string") return null;
  const parts = t.split(":").map((p) => Number(p));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  const hh = String(parts[0]).padStart(2, "0");
  const mm = String(parts[1]).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const buildSlots = (startTime, endTime) => {
  const slots = [];
  if (!startTime || !endTime) {
    return slots;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const current = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (Number.isNaN(current) || Number.isNaN(end) || current >= end) {
    return slots;
  }

  const formatMinutes = (totalMinutes) => {
    const hour = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  for (
    let minute = current;
    minute + SLOT_DURATION_MINUTES <= end;
    minute += SLOT_DURATION_MINUTES
  ) {
    const next = minute + SLOT_DURATION_MINUTES;
    slots.push({
      startTime: formatMinutes(minute),
      endTime: formatMinutes(next),
    });
  }

  return slots;
};

export const toNullableNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const validateTimeRange = (startTime, endTime) => {
  const slots = buildSlots(startTime, endTime);
  return slots.length > 0;
};
