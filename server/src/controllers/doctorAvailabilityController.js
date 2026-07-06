import { and, asc, eq } from "drizzle-orm";

import { db } from "../config/neonDb.js";

import {
  users,
  doctorProfiles,
  doctorAvailabilities,
  availabilitySlots,
} from "../db/schema/index.js";

const SLOT_DURATION_MINUTES = 30;

/*
========================================================
HELPERS
========================================================
*/

const getDateString = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDayName = (value) => {
  const date = new Date(value);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
};

const buildSlots = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return [];
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);

  const [endHour, endMinute] = endTime.split(":").map(Number);

  const start = startHour * 60 + startMinute;

  const end = endHour * 60 + endMinute;

  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    return [];
  }

  const slots = [];

  const formatMinutes = (totalMinutes) => {
    const hour = Math.floor(totalMinutes / 60);

    const minute = totalMinutes % 60;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0",
    )}`;
  };

  for (
    let minute = start;
    minute + SLOT_DURATION_MINUTES <= end;
    minute += SLOT_DURATION_MINUTES
  ) {
    slots.push({
      startTime: formatMinutes(minute),

      endTime: formatMinutes(minute + SLOT_DURATION_MINUTES),
    });
  }

  return slots;
};

const normalizeRequestedSlots = (slots) => {
  if (!Array.isArray(slots)) {
    return [];
  }

  const normalized = [];

  for (const slot of slots) {
    const startTime =
      typeof slot?.startTime === "string" ? slot.startTime.trim() : "";

    const endTime =
      typeof slot?.endTime === "string" ? slot.endTime.trim() : "";

    if (!startTime || !endTime) {
      continue;
    }

    normalized.push({
      startTime,
      endTime,
    });
  }

  /*
    Remove duplicate requested slots.
  */
  return Array.from(
    new Map(
      normalized.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]),
    ).values(),
  );
};

const formatSlot = (slot) => ({
  /*
    MongoDB compatibility.
  */
  _id: slot.id,

  id: slot.id,

  startTime: slot.startTime,

  endTime: slot.endTime,

  isBooked: slot.isBooked,

  bookedBy: slot.bookedById ?? null,

  consultationId: slot.consultationId ?? null,
});

const formatAvailability = (availability, slots) => ({
  /*
    MongoDB compatibility.
  */
  _id: availability.id,

  id: availability.id,

  doctor: availability.doctorId,

  doctorId: availability.doctorId,

  availableDate: availability.availableDate,

  slots: slots.map(formatSlot),

  isActive: availability.isActive,

  createdAt: availability.createdAt,

  updatedAt: availability.updatedAt,
});

const getAvailabilityByDate = async (doctorId, availableDate) => {
  const rows = await db
    .select()
    .from(doctorAvailabilities)
    .where(
      and(
        eq(doctorAvailabilities.doctorId, doctorId),

        eq(doctorAvailabilities.availableDate, availableDate),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
};

const getSlotsForAvailability = async (availabilityId) => {
  return db
    .select()
    .from(availabilitySlots)
    .where(eq(availabilitySlots.availabilityId, availabilityId))
    .orderBy(asc(availabilitySlots.startTime));
};

/*
========================================================
REPLACE UNBOOKED SLOTS

IMPORTANT:

Booked slots are preserved.

Manual availability updates cannot erase an
existing consultation booking.
========================================================
*/

const replaceUnbookedSlots = async (availabilityId, requestedSlots) => {
  await db.delete(availabilitySlots).where(
    and(
      eq(availabilitySlots.availabilityId, availabilityId),

      eq(availabilitySlots.isBooked, false),
    ),
  );

  const bookedSlots = await db
    .select({
      startTime: availabilitySlots.startTime,

      endTime: availabilitySlots.endTime,
    })
    .from(availabilitySlots)
    .where(
      and(
        eq(availabilitySlots.availabilityId, availabilityId),

        eq(availabilitySlots.isBooked, true),
      ),
    );

  const bookedKeys = new Set(
    bookedSlots.map((slot) => `${slot.startTime}-${slot.endTime}`),
  );

  const slotsToInsert = requestedSlots.filter(
    (slot) => !bookedKeys.has(`${slot.startTime}-${slot.endTime}`),
  );

  if (slotsToInsert.length > 0) {
    await db.insert(availabilitySlots).values(
      slotsToInsert.map((slot) => ({
        availabilityId,

        startTime: slot.startTime,

        endTime: slot.endTime,

        isBooked: false,
      })),
    );
  }
};

/*
========================================================
FALLBACK FROM DOCTOR PROFILE

Returns generated slots only.

Database persistence is handled separately.
========================================================
*/

const getFallbackSlots = async (doctorId, availableDate) => {
  const rows = await db
    .select({
      workingDays: doctorProfiles.workingDays,

      startTime: doctorProfiles.startTime,

      endTime: doctorProfiles.endTime,
    })
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, doctorId))
    .limit(1);

  const profile = rows[0];

  if (!profile) {
    return [];
  }

  if (!Array.isArray(profile.workingDays)) {
    return [];
  }

  const requestedDay = getDayName(`${availableDate}T12:00:00`);

  if (!profile.workingDays.includes(requestedDay)) {
    return [];
  }

  return buildSlots(profile.startTime, profile.endTime);
};

/*
========================================================
CREATE / UPDATE DOCTOR AVAILABILITY

POST /api/doctor-availability
========================================================
*/

export const createDoctorAvailability = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create availability",
      });
    }

    const { availableDate, slots } = req.body ?? {};

    const normalizedDate = getDateString(availableDate);

    const normalizedSlots = normalizeRequestedSlots(slots);

    if (!normalizedDate || normalizedSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid availableDate and slots are required",
      });
    }

    /*
        Verify the authenticated doctor
        still exists in PostgreSQL.
      */
    const userRows = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.id, req.user.id),

          eq(users.role, "doctor"),
        ),
      )
      .limit(1);

    if (!userRows[0]) {
      return res.status(403).json({
        success: false,
        message: "Doctor user not found",
      });
    }

    let availability = await getAvailabilityByDate(req.user.id, normalizedDate);

    let created = false;

    if (!availability) {
      const insertedRows = await db
        .insert(doctorAvailabilities)
        .values({
          doctorId: req.user.id,

          availableDate: normalizedDate,

          isActive: true,
        })
        .returning();

      availability = insertedRows[0];

      created = true;
    } else {
      const updatedRows = await db
        .update(doctorAvailabilities)
        .set({
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(doctorAvailabilities.id, availability.id))
        .returning();

      availability = updatedRows[0];
    }

    await replaceUnbookedSlots(availability.id, normalizedSlots);

    const savedSlots = await getSlotsForAvailability(availability.id);

    return res.status(created ? 201 : 200).json({
      success: true,

      message: created
        ? "Availability created successfully"
        : "Availability updated successfully",

      availability: formatAvailability(availability, savedSlots),
    });
  } catch (error) {
    console.error("createDoctorAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor availability",
      error: error.message,
    });
  }
};

/*
========================================================
GET DOCTOR OWN AVAILABILITY

GET /api/doctor-availability/my-slots
========================================================
*/

export const getDoctorOwnAvailability = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access their availability",
      });
    }

    const rows = await db
      .select()
      .from(doctorAvailabilities)
      .where(
        and(
          eq(doctorAvailabilities.doctorId, req.user.id),

          eq(doctorAvailabilities.isActive, true),
        ),
      )
      .orderBy(asc(doctorAvailabilities.availableDate));

    const availability = await Promise.all(
      rows.map(async (row) => {
        const slots = await getSlotsForAvailability(row.id);

        return formatAvailability(row, slots);
      }),
    );

    return res.status(200).json({
      success: true,
      availability,
    });
  } catch (error) {
    console.error("getDoctorOwnAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor availability",
      error: error.message,
    });
  }
};

/*
========================================================
PATIENT FETCHES AVAILABLE SLOTS

GET /api/doctor-availability/slots/:doctorId?date=YYYY-MM-DD
========================================================
*/

export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const { date } = req.query;

    const normalizedDate = getDateString(date);

    if (!doctorId || !normalizedDate) {
      return res.status(400).json({
        success: false,
        message: "Valid doctorId and date query parameter are required",
      });
    }

    /*
        Verify doctor exists.
      */
    const doctorRows = await db
      .select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.id, doctorId),

          eq(users.role, "doctor"),
        ),
      )
      .limit(1);

    if (!doctorRows[0]) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    let availability = await getAvailabilityByDate(doctorId, normalizedDate);

    let source = "manual-availability";

    /*
        Ignore inactive availability.

        An explicitly disabled date should not
        silently expose old slots.
      */
    if (availability && !availability.isActive) {
      return res.status(200).json({
        success: true,
        slots: [],
        source: "inactive-availability",
      });
    }

    /*
        Generate and persist fallback if
        no exact availability exists.
      */
    if (!availability) {
      const fallbackSlots = await getFallbackSlots(doctorId, normalizedDate);

      if (fallbackSlots.length === 0) {
        return res.status(200).json({
          success: true,
          slots: [],
          source: "doctor-profile-fallback",
        });
      }

      const insertedRows = await db
        .insert(doctorAvailabilities)
        .values({
          doctorId,

          availableDate: normalizedDate,

          isActive: true,
        })
        .returning();

      availability = insertedRows[0];

      await db.insert(availabilitySlots).values(
        fallbackSlots.map((slot) => ({
          availabilityId: availability.id,

          startTime: slot.startTime,

          endTime: slot.endTime,

          isBooked: false,
        })),
      );

      source = "doctor-profile-fallback";
    }

    const slots = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.availabilityId, availability.id),

          eq(availabilitySlots.isBooked, false),
        ),
      )
      .orderBy(asc(availabilitySlots.startTime));

    return res.status(200).json({
      success: true,

      slots: slots.map((slot) => ({
        _id: slot.id,

        id: slot.id,

        startTime: slot.startTime,

        endTime: slot.endTime,
      })),

      source,
    });
  } catch (error) {
    console.error("getDoctorAvailabilitySlots error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor slots",
      error: error.message,
    });
  }
};

/*
========================================================
SOFT DELETE AVAILABILITY

DELETE /api/doctor-availability/:availabilityId
========================================================
*/

export const deleteDoctorAvailability = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can delete availability",
      });
    }

    const { availabilityId } = req.params;

    const rows = await db
      .select()
      .from(doctorAvailabilities)
      .where(eq(doctorAvailabilities.id, availabilityId))
      .limit(1);

    const availability = rows[0];

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    if (availability.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    await db
      .update(doctorAvailabilities)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(doctorAvailabilities.id, availabilityId));

    return res.status(200).json({
      success: true,
      message: "Availability removed successfully",
    });
  } catch (error) {
    console.error("deleteDoctorAvailability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete availability",
      error: error.message,
    });
  }
};
