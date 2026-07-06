import { and, asc, count, desc, eq, ilike, sql, or } from "drizzle-orm";

import { db } from "../config/neonDb.js";

import {
  users,
  doctorProfiles,
  doctorAvailabilities,
  availabilitySlots,
  consultations,
} from "../db/schema/index.js";

import { sendAppointmentEmail } from "../utils/sendAppointmentEmail.js";

/*
==================================================
CONSTANTS
==================================================
*/

const SLOT_DURATION_MINUTES = 30;

/*
==================================================
HELPERS
==================================================
*/

const normalizeDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getDateString = (value) => {
  const date = normalizeDate(value);

  if (!date) {
    return null;
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDayName = (dateString) => {
  const date = new Date(`${dateString}T12:00:00`);

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

const formatDoctor = (user, profile) => ({
  /*
  MongoDB compatibility.
  */
  _id: user.id,

  id: user.id,

  name: user.name,

  email: user.email,

  role: user.role,

  profileImage: user.profileImage ?? null,

  specialization: profile?.specialization ?? null,

  qualification: profile?.qualification ?? null,

  experience: profile?.experience ?? null,

  hospitalName: profile?.hospitalName ?? null,

  consultationFee: profile?.consultationFee ?? null,

  consultationModes: profile?.consultationModes ?? [],

  aboutDoctor: profile?.aboutDoctor ?? "",

  shortBio: profile?.shortBio ?? "",

  profileCompleted: profile?.profileCompleted ?? false,
});

const formatSlot = (slot) => ({
  _id: slot.id,

  id: slot.id,

  startTime: slot.startTime,

  endTime: slot.endTime,

  isBooked: slot.isBooked,

  bookedBy: slot.bookedById ?? null,

  consultationId: slot.consultationId ?? null,
});

const formatConsultation = (
  consultation,
  { patient = null, doctor = null, doctorProfile = null } = {},
) => {
  const result = {
    ...consultation,

    /*
    MongoDB compatibility.
    */
    _id: consultation.id,
  };

  if (patient) {
    result.patient = {
      _id: patient.id,
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone ?? null,
    };
  } else {
    result.patient = consultation.patientId;
  }

  if (doctor) {
    result.doctor = {
      _id: doctor.id,
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,

      specialization: doctorProfile?.specialization ?? null,

      qualification: doctorProfile?.qualification ?? null,

      experience: doctorProfile?.experience ?? null,
    };
  } else {
    result.doctor = consultation.doctorId;
  }

  return result;
};

const getDoctorById = async (database, doctorId) => {
  const rows = await database
    .select()
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")))
    .limit(1);

  return rows[0] ?? null;
};

const getAvailabilityByDate = async (database, doctorId, availableDate) => {
  const rows = await database
    .select()
    .from(doctorAvailabilities)
    .where(
      and(
        eq(doctorAvailabilities.doctorId, doctorId),

        eq(doctorAvailabilities.availableDate, availableDate),

        eq(doctorAvailabilities.isActive, true),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
};

const createFallbackAvailability = async (
  database,
  doctorId,
  availableDate,
) => {
  const profileRows = await database
    .select()
    .from(doctorProfiles)
    .where(eq(doctorProfiles.userId, doctorId))
    .limit(1);

  const profile = profileRows[0];

  if (
    !profile ||
    !Array.isArray(profile.workingDays) ||
    !profile.workingDays.includes(getDayName(availableDate))
  ) {
    return null;
  }

  const generatedSlots = buildSlots(profile.startTime, profile.endTime);

  if (generatedSlots.length === 0) {
    return null;
  }

  /*
    Unique constraint:

    doctor_id + available_date

    prevents duplicate availability rows.
    */
  const availabilityRows = await database
    .insert(doctorAvailabilities)
    .values({
      doctorId,

      availableDate,

      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  let availability = availabilityRows[0];

  /*
    Another request may have inserted it.
    */
  if (!availability) {
    availability = await getAvailabilityByDate(
      database,
      doctorId,
      availableDate,
    );
  }

  if (!availability) {
    return null;
  }

  /*
    Unique constraint:

    availability_id +
    start_time +
    end_time

    prevents duplicate slots.
    */
  await database
    .insert(availabilitySlots)
    .values(
      generatedSlots.map((slot) => ({
        availabilityId: availability.id,

        startTime: slot.startTime,

        endTime: slot.endTime,

        isBooked: false,
      })),
    )
    .onConflictDoNothing();

  return availability;
};

const getOrCreateAvailability = async (database, doctorId, availableDate) => {
  let availability = await getAvailabilityByDate(
    database,
    doctorId,
    availableDate,
  );

  if (!availability) {
    availability = await createFallbackAvailability(
      database,
      doctorId,
      availableDate,
    );
  }

  return availability;
};

/*
==================================================
GET AVAILABLE DOCTORS

GET /api/consultations/doctors/available
==================================================
*/

export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, limit = 10, page = 1 } = req.query;

    const parsedLimit = Math.min(
      Math.max(Number.parseInt(limit, 10) || 10, 1),
      100,
    );

    const parsedPage = Math.max(Number.parseInt(page, 10) || 1, 1);

    const offset = (parsedPage - 1) * parsedLimit;

    const conditions = [eq(users.role, "doctor")];

    if (specialization) {
      conditions.push(
        ilike(doctorProfiles.specialization, `%${specialization}%`),
      );
    }

    const rows = await db
      .select({
        user: users,
        profile: doctorProfiles,
      })
      .from(users)
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(users.name))
      .limit(parsedLimit)
      .offset(offset);

    const countRows = await db
      .select({
        total: count(),
      })
      .from(users)
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .where(and(...conditions));

    const total = Number(countRows[0]?.total ?? 0);

    const doctors = rows.map(({ user, profile }) =>
      formatDoctor(user, profile),
    );

    return res.status(200).json({
      success: true,

      doctors,

      pagination: {
        total,

        pages: Math.ceil(total / parsedLimit),

        currentPage: parsedPage,
      },
    });
  } catch (error) {
    console.error("getAvailableDoctors error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch doctors",

      error: error.message,
    });
  }
};

/*
==================================================
GET DOCTOR AVAILABLE SLOTS

GET /api/consultations/doctor-slots
==================================================
*/

export const getDoctorAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    const availableDate = getDateString(date);

    if (!doctorId || !availableDate) {
      return res.status(400).json({
        success: false,

        message: "doctorId and valid date are required",
      });
    }

    const doctor = await getDoctorById(db, doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor not found",
      });
    }

    const availability = await getOrCreateAvailability(
      db,
      doctorId,
      availableDate,
    );

    if (!availability) {
      return res.status(200).json({
        success: true,
        slots: [],
      });
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

      slots: slots.map(formatSlot),
    });
  } catch (error) {
    console.error("getDoctorAvailableSlots error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch doctor slots",

      error: error.message,
    });
  }
};

/*
==================================================
CREATE CONSULTATION

POST /api/consultations/book
==================================================
*/

export const createConsultation = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,

        message: "Only patients can book consultations",
      });
    }

    const {
      doctorId,
      consultationType,
      symptoms,
      currentProblem,
      currentMedication,
      medicalHistory,
      allergies,
      consultationDate,
      startTime,
      endTime,
    } = req.body;

    if (
      !doctorId ||
      !consultationType ||
      !symptoms ||
      !currentProblem ||
      !consultationDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,

        message: "All required fields must be provided",
      });
    }

    const availableDate = getDateString(consultationDate);

    const normalizedConsultationDate = normalizeDate(consultationDate);

    if (!availableDate || !normalizedConsultationDate) {
      return res.status(400).json({
        success: false,

        message: "Invalid consultation date",
      });
    }

    const patientRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(
        and(
          eq(users.id, req.user.id),

          eq(users.role, "patient"),
        ),
      )
      .limit(1);

    const patient = patientRows[0];

    if (!patient) {
      return res.status(404).json({
        success: false,

        message: "Patient not found",
      });
    }

    const doctor = await getDoctorById(db, doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor not found",
      });
    }

    /*
      Ensure availability exists before transaction.

      Availability creation itself is idempotent because
      of database unique constraints.
      */
    const availability = await getOrCreateAvailability(
      db,
      doctorId,
      availableDate,
    );

    if (!availability) {
      return res.status(400).json({
        success: false,

        message: "Doctor is not available on the selected date",
      });
    }

    /*
      TRANSACTION:

      1. Atomically claim exact slot.
      2. Create consultation.
      3. Attach consultation ID.
      */
    const createdConsultation = await db.transaction(async (tx) => {
      /*
            Atomic conditional UPDATE.

            Even if two transactions try booking
            simultaneously, only one can change
            isBooked false → true.
            */
      const claimedSlots = await tx
        .update(availabilitySlots)
        .set({
          isBooked: true,

          bookedById: req.user.id,

          updatedAt: new Date(),
        })
        .where(
          and(
            eq(availabilitySlots.availabilityId, availability.id),

            eq(availabilitySlots.startTime, startTime),

            eq(availabilitySlots.endTime, endTime),

            eq(availabilitySlots.isBooked, false),
          ),
        )
        .returning();

      const claimedSlot = claimedSlots[0];

      if (!claimedSlot) {
        const error = new Error("Selected slot is not available");

        error.statusCode = 409;

        throw error;
      }

      const consultationRows = await tx
        .insert(consultations)
        .values({
          patientId: req.user.id,

          doctorId,

          consultationType,

          symptoms: String(symptoms),

          currentProblem: String(currentProblem),

          currentMedication: currentMedication ? String(currentMedication) : "",

          medicalHistory: medicalHistory ? String(medicalHistory) : "",

          allergies: allergies ? String(allergies) : "",

          consultationDate: normalizedConsultationDate,

          startTime,

          endTime,

          status: "scheduled",

          roomId: crypto.randomUUID(),

          updatedAt: new Date(),
        })
        .returning();

      const consultation = consultationRows[0];

      await tx
        .update(availabilitySlots)
        .set({
          consultationId: consultation.id,

          updatedAt: new Date(),
        })
        .where(eq(availabilitySlots.id, claimedSlot.id));

      return consultation;
    });

    /*
      Send email AFTER COMMIT.

      Email failure must never rollback booking.
      */
    if (patient.email && doctor.email) {
      try {
        await sendAppointmentEmail({
          patientEmail: patient.email,

          doctorEmail: doctor.email,

          patientName: patient.name,

          doctorName: doctor.name,

          consultationDate,

          startTime,

          endTime,

          consultationType,
        });
      } catch (emailError) {
        console.error(
          "Appointment email failed (non-critical):",
          emailError.message,
        );
      }
    }

    return res.status(201).json({
      success: true,

      message: "Consultation booked successfully",

      consultation: formatConsultation(createdConsultation, {
        doctor,
      }),
    });
  } catch (error) {
    console.error("createConsultation error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    /*
      Invalid PostgreSQL enum value.
      */
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,

        message: "Invalid consultation type or consultation data",
      });
    }

    return res.status(500).json({
      success: false,

      message: "Failed to create consultation",

      error: error.message,
    });
  }
};

/*
==================================================
DOCTOR DASHBOARD CONSULTATIONS

GET /api/consultations/doctor-dashboard
==================================================
*/

export const getDoctorConsultations = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,

        message: "Only doctors can access doctor dashboard consultations",
      });
    }

    const rows = await db
      .select({
        consultation: consultations,

        patient: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.patientId, users.id))
      .where(eq(consultations.doctorId, req.user.id))
      .orderBy(
        asc(consultations.consultationDate),

        asc(consultations.startTime),
      );

    return res.status(200).json({
      success: true,

      consultations: rows.map(({ consultation, patient }) =>
        formatConsultation(consultation, {
          patient,
        }),
      ),
    });
  } catch (error) {
    console.error("getDoctorConsultations error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch doctor consultations",

      error: error.message,
    });
  }
};

/*
==================================================
PATIENT CONSULTATIONS

GET /api/consultations/my-consultations
==================================================
*/

export const getPatientConsultations = async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,

        message: "Only patients can access patient consultations",
      });
    }

    const rows = await db
      .select({
        consultation: consultations,

        doctor: {
          id: users.id,
          name: users.name,
          email: users.email,
        },

        doctorProfile: doctorProfiles,
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.doctorId, users.id))
      .leftJoin(
        doctorProfiles,
        eq(doctorProfiles.userId, consultations.doctorId),
      )
      .where(eq(consultations.patientId, req.user.id))
      .orderBy(desc(consultations.consultationDate));

    return res.status(200).json({
      success: true,

      consultations: rows.map(({ consultation, doctor, doctorProfile }) =>
        formatConsultation(consultation, {
          doctor,
          doctorProfile,
        }),
      ),
    });
  } catch (error) {
    console.error("getPatientConsultations error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch patient consultations",

      error: error.message,
    });
  }
};

export const getDoctorsNearMe = async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

    const radius = Math.min(Math.max(Number(req.query.radius) || 10, 1), 100);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    /*
      Haversine distance in kilometers.

      clinicLatitude / clinicLongitude are numeric columns,
      so PostgreSQL casts them to double precision for
      trigonometric functions.
    */
    const distanceExpression = sql`
      (
        6371 * acos(
          least(
            1,
            greatest(
              -1,
              cos(radians(${latitude}))
              * cos(radians(${doctorProfiles.clinicLatitude}::double precision))
              * cos(
                  radians(${doctorProfiles.clinicLongitude}::double precision)
                  - radians(${longitude})
                )
              + sin(radians(${latitude}))
              * sin(radians(${doctorProfiles.clinicLatitude}::double precision))
            )
          )
        )
      )
    `;

    const rows = await db
      .select({
        user: users,
        profile: doctorProfiles,
        distance: distanceExpression,
      })
      .from(users)
      .innerJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .where(
        and(
          eq(users.role, "doctor"),
          eq(users.isActive, true),
          eq(doctorProfiles.hasClinic, true),
          sql`${doctorProfiles.clinicLatitude} IS NOT NULL`,
          sql`${doctorProfiles.clinicLongitude} IS NOT NULL`,
          sql`${distanceExpression} <= ${radius}`,
        ),
      )
      .orderBy(distanceExpression);

    return res.status(200).json({
      success: true,

      doctors: rows.map(({ user, profile, distance }) => ({
        ...formatDoctor(user, profile),

        distance: Number(Number(distance).toFixed(2)),

        clinicAddress: {
          apartment: profile.clinicApartment ?? "",
          street: profile.clinicStreet ?? "",
          district: profile.clinicDistrict ?? "",
          city: profile.clinicCity ?? "",
          pinCode: profile.clinicPinCode ?? "",
          state: profile.clinicState ?? "",

          coordinates: {
            type: "Point",

            coordinates: [
              Number(profile.clinicLongitude),
              Number(profile.clinicLatitude),
            ],
          },
        },
      })),
    });
  } catch (error) {
    console.error("getDoctorsNearMe error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch nearby doctors",
      error: error.message,
    });
  }
};

const CONSULTATION_STATUS_TRANSITIONS = {
  scheduled: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const canUpdateStatus = (consultation, user, nextStatus) => {
  const allowedTransitions =
    CONSULTATION_STATUS_TRANSITIONS[consultation.status] ?? [];

  if (!allowedTransitions.includes(nextStatus)) {
    return false;
  }

  /*
    Doctor can manage only consultations assigned to them.
  */
  if (user.role === "doctor") {
    if (consultation.doctorId !== user.id) {
      return false;
    }

    return true;
  }

  /*
    Patient can only cancel their own consultation.
  */
  if (user.role === "patient") {
    return consultation.patientId === user.id && nextStatus === "cancelled";
  }

  return false;
};

export const updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const rows = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId))
      .limit(1);

    const existingConsultation = rows[0];

    if (!existingConsultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    if (!canUpdateStatus(existingConsultation, req.user, status)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this status transition",
      });
    }

    const updatedConsultation = await db.transaction(async (tx) => {
      /*
        Lock the consultation row.

        This prevents simultaneous status transitions from
        reading the same old status and both succeeding.
      */
      const lockedResult = await tx.execute(sql`
        SELECT *
        FROM consultations
        WHERE id = ${consultationId}
        FOR UPDATE
      `);

      const lockedConsultation = lockedResult.rows[0];

      if (!lockedConsultation) {
        const error = new Error("Consultation not found");
        error.statusCode = 404;
        throw error;
      }

      /*
        Raw SQL returns snake_case properties.
      */
      const lockedNormalized = {
        id: lockedConsultation.id,
        patientId: lockedConsultation.patient_id,
        doctorId: lockedConsultation.doctor_id,
        status: lockedConsultation.status,
      };

      if (!canUpdateStatus(lockedNormalized, req.user, status)) {
        const error = new Error(
          "Consultation status changed or transition is not allowed",
        );

        error.statusCode = 409;
        throw error;
      }

      const updatedRows = await tx
        .update(consultations)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(consultations.id, consultationId))
        .returning();

      const consultation = updatedRows[0];

      /*
        Cancellation releases only the slot linked
        to this consultation.

        Clearing consultationId, bookedById, and isBooked
        makes it available again.
      */
      if (status === "cancelled") {
        await tx
          .update(availabilitySlots)
          .set({
            isBooked: false,
            bookedById: null,
            consultationId: null,
            updatedAt: new Date(),
          })
          .where(eq(availabilitySlots.consultationId, consultationId));
      }

      return consultation;
    });

    return res.status(200).json({
      success: true,
      message: "Consultation status updated successfully",
      consultation: formatConsultation(updatedConsultation),
    });
  } catch (error) {
    console.error("updateConsultationStatus error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation status",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update consultation status",
      error: error.message,
    });
  }
};

export const addDoctorNotes = async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can update consultation notes",
      });
    }

    const { consultationId } = req.params;

    const { doctorNotes, prescription, followUpRequired } = req.body;

    const rows = await db
      .select()
      .from(consultations)
      .where(eq(consultations.id, consultationId))
      .limit(1);

    const consultation = rows[0];

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    if (consultation.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can update notes only for consultations assigned to you",
      });
    }

    const updates = {
      updatedAt: new Date(),
    };

    if (doctorNotes !== undefined) {
      updates.doctorNotes = String(doctorNotes);
    }

    if (prescription !== undefined) {
      updates.prescription = String(prescription);
    }

    if (followUpRequired !== undefined) {
      updates.followUpRequired =
        followUpRequired === true || followUpRequired === "true";
    }

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({
        success: false,
        message: "No consultation note fields provided",
      });
    }

    const updatedRows = await db
      .update(consultations)
      .set(updates)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.doctorId, req.user.id),
        ),
      )
      .returning();

    const updatedConsultation = updatedRows[0];

    if (!updatedConsultation) {
      return res.status(409).json({
        success: false,
        message: "Consultation could not be updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor notes updated successfully",
      consultation: formatConsultation(updatedConsultation),
    });
  } catch (error) {
    console.error("addDoctorNotes error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor notes",
      error: error.message,
    });
  }
};

export const markUserJoined = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const rows = await db
      .select({
        consultation: consultations,

        patient: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(consultations)
      .innerJoin(users, eq(consultations.patientId, users.id))
      .where(eq(consultations.id, consultationId))
      .limit(1);

    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found",
      });
    }

    const consultation = row.consultation;

    if (
      req.user.id !== consultation.patientId &&
      req.user.id !== consultation.doctorId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not part of this consultation",
      });
    }

    let joinField;

    if (req.user.role === "patient" && req.user.id === consultation.patientId) {
      joinField = "patient";
    } else if (
      req.user.role === "doctor" &&
      req.user.id === consultation.doctorId
    ) {
      joinField = "doctor";
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid consultation participant role",
      });
    }

    const updates = {
      updatedAt: new Date(),
    };

    if (joinField === "patient") {
      updates.patientJoined = true;
    } else {
      updates.doctorJoined = true;
    }

    const updatedRows = await db
      .update(consultations)
      .set(updates)
      .where(eq(consultations.id, consultationId))
      .returning();

    const updatedConsultation = updatedRows[0];

    /*
      Socket.IO side effects after successful DB update.
    */
    if (io) {
      io.to(consultationId).emit("participant-joined", {
        consultationId,

        userId: req.user.id,

        role: req.user.role,

        patientJoined: updatedConsultation.patientJoined,

        doctorJoined: updatedConsultation.doctorJoined,
      });
    }

    /*
      Preserve the old waiting-email behavior:

      patient joined,
      doctor has not joined yet.
    */
    if (joinField === "patient" && !updatedConsultation.doctorJoined) {
      try {
        const doctorRows = await db
          .select({
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, consultation.doctorId))
          .limit(1);

        const doctor = doctorRows[0];

        if (doctor?.email) {
          await sendMeetingWaitingEmail({
            doctorEmail: doctor.email,

            doctorName: doctor.name,

            patientName: row.patient.name,

            consultationId,

            consultationDate: consultation.consultationDate,

            startTime: consultation.startTime,
          });
        }
      } catch (emailError) {
        console.error(
          "Meeting waiting email failed (non-critical):",
          emailError.message,
        );
      }
    }

    return res.status(200).json({
      success: true,

      message: `${req.user.role} marked as joined`,

      consultation: formatConsultation(updatedConsultation, {
        patient: row.patient,
      }),
    });
  } catch (error) {
    console.error("markUserJoined error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update meeting join status",
      error: error.message,
    });
  }
};
