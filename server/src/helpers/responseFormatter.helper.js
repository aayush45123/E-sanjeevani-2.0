export const formatDoctor = (user, profile) => ({
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

export const formatSlot = (slot) => ({
  _id: slot.id,
  id: slot.id,
  startTime: slot.startTime,
  endTime: slot.endTime,
  isBooked: slot.isBooked,
  bookedBy: slot.bookedById ?? null,
  consultationId: slot.consultationId ?? null,
});

export const formatConsultation = (
  consultation,
  { patient = null, doctor = null, doctorProfile = null } = {},
) => {
  const result = {
    ...consultation,
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

export const formatDoctorProfile = (profile, user = null) => {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    userId: user
      ? {
          _id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
        }
      : profile.userId,

    clinicAddress: {
      apartment: profile.clinicApartment || "",
      street: profile.clinicStreet || "",
      district: profile.clinicDistrict || "",
      city: profile.clinicCity || "",
      pinCode: profile.clinicPinCode || "",
      state: profile.clinicState || "",
      coordinates:
        profile.clinicLongitude !== null && profile.clinicLatitude !== null
          ? {
              type: "Point",
              coordinates: [profile.clinicLongitude, profile.clinicLatitude],
            }
          : null,
    },
  };
};

export const calculateCompletion = (profile) => {
  if (!profile) {
    return 0;
  }

  let completed = 0;
  const total = 3;

  if (profile.profileCompleted) {
    completed += 1;
  }

  if (
    profile.hasClinic &&
    profile.clinicLongitude !== null &&
    profile.clinicLatitude !== null
  ) {
    completed += 1;
  }

  if (
    Array.isArray(profile.workingDays) &&
    profile.workingDays.length > 0 &&
    profile.startTime &&
    profile.endTime
  ) {
    completed += 1;
  }

  return Math.round((completed / total) * 100);
};

const REQUIRED_FIELDS = [
  "age",
  "gender",
  "bloodGroup",
  "maritalStatus",
  "height",
  "weight",
  "smoking",
  "alcohol",
  "diet",
  "exercise",
];

export const calculateProfileCompletion = (profile) => {
  if (!profile) return false;
  return REQUIRED_FIELDS.every((field) => {
    const value = profile[field];
    return value !== undefined && value !== null && value !== "";
  });
};

export const sanitizeProfile = (profile) => {
  if (!profile) {
    return null;
  }
  const { userId, ...safeProfile } = profile;
  return safeProfile;
};

export const formatAvailability = (availability, slots) => ({
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
