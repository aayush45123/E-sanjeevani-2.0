import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { doctorProfiles, users } from "../database/schema/index.js";

export class DoctorProfileRepository {
  static async findByUserId(userId) {
    const result = await db
      .select({
        profile: doctorProfiles,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(doctorProfiles.userId, users.id))
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }

  static async findRawProfileByUserId(userId) {
    const result = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userId))
      .limit(1);
    return result[0] ?? null;
  }

  static async createOrUpdate(profileData) {
    const result = await db
      .insert(doctorProfiles)
      .values(profileData)
      .onConflictDoUpdate({
        target: doctorProfiles.userId,
        set: {
          phone: profileData.phone,
          gender: profileData.gender,
          dateOfBirth: profileData.dateOfBirth,
          specialization: profileData.specialization,
          superSpecialization: profileData.superSpecialization,
          qualification: profileData.qualification,
          medicalRegistrationNumber: profileData.medicalRegistrationNumber,
          experience: profileData.experience,
          hospitalName: profileData.hospitalName,
          consultationFee: profileData.consultationFee,
          languagesSpoken: profileData.languagesSpoken,
          workingDays: profileData.workingDays,
          consultationModes: profileData.consultationModes,
          startTime: profileData.startTime,
          endTime: profileData.endTime,
          aboutDoctor: profileData.aboutDoctor,
          shortBio: profileData.shortBio,
          hasClinic: profileData.hasClinic,
          clinicApartment: profileData.clinicApartment,
          clinicStreet: profileData.clinicStreet,
          clinicDistrict: profileData.clinicDistrict,
          clinicCity: profileData.clinicCity,
          clinicPinCode: profileData.clinicPinCode,
          clinicState: profileData.clinicState,
          clinicLatitude: profileData.clinicLatitude,
          clinicLongitude: profileData.clinicLongitude,
          profileCompleted: profileData.profileCompleted,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  static async findAvailableDoctors({ specialization, limit, offset }) {
    const conditions = [eq(users.role, "doctor")];
    if (specialization) {
      conditions.push(ilike(doctorProfiles.specialization, `%${specialization}%`));
    }

    return db
      .select({
        user: users,
        profile: doctorProfiles,
      })
      .from(users)
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(users.name))
      .limit(limit)
      .offset(offset);
  }

  static async countAvailableDoctors({ specialization }) {
    const conditions = [eq(users.role, "doctor")];
    if (specialization) {
      conditions.push(ilike(doctorProfiles.specialization, `%${specialization}%`));
    }

    const result = await db
      .select({
        total: count(),
      })
      .from(users)
      .leftJoin(doctorProfiles, eq(doctorProfiles.userId, users.id))
      .where(and(...conditions));
    return Number(result[0]?.total ?? 0);
  }

  static async findVerifiedCandidatesBySpecialties(specialties) {
    return db
      .select({
        userId: doctorProfiles.userId,
        specialization: doctorProfiles.specialization,
        experience: doctorProfiles.experience,
        languagesSpoken: doctorProfiles.languagesSpoken,
        name: users.name,
      })
      .from(doctorProfiles)
      .innerJoin(users, eq(users.id, doctorProfiles.userId))
      .where(
        and(
          inArray(doctorProfiles.specialization, specialties),
          eq(doctorProfiles.verificationStatus, "verified"),
          eq(users.isActive, true),
        ),
      );
  }

  static async findDoctorsNearMe({ latitude, longitude, radius, distanceExpression }) {
    return db
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
  }
}
