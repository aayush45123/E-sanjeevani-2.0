import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import {
  users,
  doctorProfiles,
  doctorAvailabilities,
  availabilitySlots,
} from "../database/schema/index.js";

const SEED_PASSWORD = "Doctor@123";

const DOCTORS_DATA = [
  // 1. General Physician (3)
  {
    name: "Dr. Aarav Sharma",
    email: "doctor01@test.com",
    specialization: "General Physician",
    superSpecialization: "Internal Medicine",
    qualification: "MBBS, MD General Medicine",
    medicalRegistrationNumber: "TEST-MCI-0001",
    experience: 12,
    hospitalName: "E-Sanjeevani City Hospital, Mumbai",
    consultationFee: "600.00",
    languagesSpoken: ["English", "Hindi", "Marathi"],
    gender: "male",
    dateOfBirth: new Date("1985-05-12"),
    clinicCity: "Mumbai",
    clinicState: "Maharashtra",
    clinicLatitude: 19.076,
    clinicLongitude: 72.8777,
  },
  {
    name: "Dr. Ananya Iyer",
    email: "doctor02@test.com",
    specialization: "General Physician",
    superSpecialization: "Family Healthcare",
    qualification: "MBBS, DNB Family Medicine",
    medicalRegistrationNumber: "TEST-MCI-0002",
    experience: 9,
    hospitalName: "Apollo Clinics, Bengaluru",
    consultationFee: "500.00",
    languagesSpoken: ["English", "Hindi", "Tamil", "Kannada"],
    gender: "female",
    dateOfBirth: new Date("1988-08-24"),
    clinicCity: "Bengaluru",
    clinicState: "Karnataka",
    clinicLatitude: 12.9716,
    clinicLongitude: 77.5946,
  },
  {
    name: "Dr. Rajesh Gupta",
    email: "doctor03@test.com",
    specialization: "General Physician",
    superSpecialization: "Preventive Healthcare",
    qualification: "MBBS, MD",
    medicalRegistrationNumber: "TEST-MCI-0003",
    experience: 15,
    hospitalName: "Max Healthcare, New Delhi",
    consultationFee: "700.00",
    languagesSpoken: ["English", "Hindi", "Punjabi"],
    gender: "male",
    dateOfBirth: new Date("1980-03-15"),
    clinicCity: "New Delhi",
    clinicState: "Delhi",
    clinicLatitude: 28.6139,
    clinicLongitude: 77.209,
  },

  // 2. Cardiologist (2)
  {
    name: "Dr. Vikramaditya Rao",
    email: "doctor04@test.com",
    specialization: "Cardiologist",
    superSpecialization: "Interventional Cardiology",
    qualification: "MBBS, MD, DM Cardiology",
    medicalRegistrationNumber: "TEST-MCI-0004",
    experience: 16,
    hospitalName: "Fortis Escorts Heart Institute, Delhi",
    consultationFee: "1200.00",
    languagesSpoken: ["English", "Hindi", "Telugu"],
    gender: "male",
    dateOfBirth: new Date("1979-11-04"),
    clinicCity: "New Delhi",
    clinicState: "Delhi",
    clinicLatitude: 28.5422,
    clinicLongitude: 77.2764,
  },
  {
    name: "Dr. Meera Kulkarni",
    email: "doctor05@test.com",
    specialization: "Cardiologist",
    superSpecialization: "Non-Invasive Cardiology",
    qualification: "MBBS, MD, DNB Cardiology",
    medicalRegistrationNumber: "TEST-MCI-0005",
    experience: 11,
    hospitalName: "Asian Heart Institute, Mumbai",
    consultationFee: "1000.00",
    languagesSpoken: ["English", "Hindi", "Marathi"],
    gender: "female",
    dateOfBirth: new Date("1986-02-18"),
    clinicCity: "Mumbai",
    clinicState: "Maharashtra",
    clinicLatitude: 19.0657,
    clinicLongitude: 72.868,
  },

  // 3. Dermatologist (2)
  {
    name: "Dr. Sneha Kapadia",
    email: "doctor06@test.com",
    specialization: "Dermatologist",
    superSpecialization: "Cosmetic Dermatology",
    qualification: "MBBS, DVD, MD Dermatology",
    medicalRegistrationNumber: "TEST-MCI-0006",
    experience: 8,
    hospitalName: "Skin & Cosmetology Centre, Pune",
    consultationFee: "800.00",
    languagesSpoken: ["English", "Hindi", "Gujarati"],
    gender: "female",
    dateOfBirth: new Date("1990-06-30"),
    clinicCity: "Pune",
    clinicState: "Maharashtra",
    clinicLatitude: 18.5204,
    clinicLongitude: 73.8567,
  },
  {
    name: "Dr. Rohan Malhotra",
    email: "doctor07@test.com",
    specialization: "Dermatologist",
    superSpecialization: "Trichology & Laser",
    qualification: "MBBS, MD Dermatology",
    medicalRegistrationNumber: "TEST-MCI-0007",
    experience: 10,
    hospitalName: "DermaCare Clinic, Chandigarh",
    consultationFee: "850.00",
    languagesSpoken: ["English", "Hindi", "Punjabi"],
    gender: "male",
    dateOfBirth: new Date("1987-09-12"),
    clinicCity: "Chandigarh",
    clinicState: "Punjab",
    clinicLatitude: 30.7333,
    clinicLongitude: 76.7794,
  },

  // 4. Neurologist (2)
  {
    name: "Dr. Siddharth Deshmukh",
    email: "doctor08@test.com",
    specialization: "Neurologist",
    superSpecialization: "Stroke & Epilepsy Specialist",
    qualification: "MBBS, MD, DM Neurology",
    medicalRegistrationNumber: "TEST-MCI-0008",
    experience: 14,
    hospitalName: "Kokilaben Dhirubhai Ambani Hospital, Mumbai",
    consultationFee: "1500.00",
    languagesSpoken: ["English", "Hindi", "Marathi"],
    gender: "male",
    dateOfBirth: new Date("1981-04-22"),
    clinicCity: "Mumbai",
    clinicState: "Maharashtra",
    clinicLatitude: 19.1314,
    clinicLongitude: 72.8258,
  },
  {
    name: "Dr. Kavita Menon",
    email: "doctor09@test.com",
    specialization: "Neurologist",
    superSpecialization: "Cognitive Neurology",
    qualification: "MBBS, MD, DNB Neurology",
    medicalRegistrationNumber: "TEST-MCI-0009",
    experience: 10,
    hospitalName: "NIMHANS Allied Neuro Centre, Kochi",
    consultationFee: "1300.00",
    languagesSpoken: ["English", "Hindi", "Malayalam"],
    gender: "female",
    dateOfBirth: new Date("1986-12-05"),
    clinicCity: "Kochi",
    clinicState: "Kerala",
    clinicLatitude: 9.9312,
    clinicLongitude: 76.2673,
  },

  // 5. Gastroenterologist (2)
  {
    name: "Dr. Alok Verma",
    email: "doctor10@test.com",
    specialization: "Gastroenterologist",
    superSpecialization: "Hepatology & Endoscopy",
    qualification: "MBBS, MD, DM Gastroenterology",
    medicalRegistrationNumber: "TEST-MCI-0010",
    experience: 13,
    hospitalName: "Medanta The Medicity, Gurugram",
    consultationFee: "1100.00",
    languagesSpoken: ["English", "Hindi"],
    gender: "male",
    dateOfBirth: new Date("1983-01-19"),
    clinicCity: "Gurugram",
    clinicState: "Haryana",
    clinicLatitude: 28.4595,
    clinicLongitude: 77.0266,
  },
  {
    name: "Dr. Pooja Nambiar",
    email: "doctor11@test.com",
    specialization: "Gastroenterologist",
    superSpecialization: "Pediatric Gastroenterology",
    qualification: "MBBS, MD, DNB Gastroenterology",
    medicalRegistrationNumber: "TEST-MCI-0011",
    experience: 9,
    hospitalName: "Manipal Hospital, Bengaluru",
    consultationFee: "950.00",
    languagesSpoken: ["English", "Hindi", "Kannada"],
    gender: "female",
    dateOfBirth: new Date("1989-07-14"),
    clinicCity: "Bengaluru",
    clinicState: "Karnataka",
    clinicLatitude: 12.9575,
    clinicLongitude: 77.6412,
  },

  // 6. Pulmonologist (2)
  {
    name: "Dr. Hardik Patel",
    email: "doctor12@test.com",
    specialization: "Pulmonologist",
    superSpecialization: "Asthma & Allergy Care",
    qualification: "MBBS, MD Pulmonary Medicine",
    medicalRegistrationNumber: "TEST-MCI-0012",
    experience: 11,
    hospitalName: "Zydus Hospital, Ahmedabad",
    consultationFee: "900.00",
    languagesSpoken: ["English", "Hindi", "Gujarati"],
    gender: "male",
    dateOfBirth: new Date("1985-10-09"),
    clinicCity: "Ahmedabad",
    clinicState: "Gujarat",
    clinicLatitude: 23.0225,
    clinicLongitude: 72.5714,
  },
  {
    name: "Dr. Ritu Choudhury",
    email: "doctor13@test.com",
    specialization: "Pulmonologist",
    superSpecialization: "Sleep Medicine & Critical Care",
    qualification: "MBBS, DTCD, MD Chest Diseases",
    medicalRegistrationNumber: "TEST-MCI-0013",
    experience: 12,
    hospitalName: "AMRI Hospital, Kolkata",
    consultationFee: "850.00",
    languagesSpoken: ["English", "Hindi", "Bengali"],
    gender: "female",
    dateOfBirth: new Date("1984-03-27"),
    clinicCity: "Kolkata",
    clinicState: "West Bengal",
    clinicLatitude: 22.5726,
    clinicLongitude: 88.3639,
  },

  // 7. Orthopedic (1)
  {
    name: "Dr. Karanbir Singh",
    email: "doctor14@test.com",
    specialization: "Orthopedic",
    superSpecialization: "Joint Replacement & Arthroscopy",
    qualification: "MBBS, MS Orthopedics",
    medicalRegistrationNumber: "TEST-MCI-0014",
    experience: 15,
    hospitalName: "Bone & Joint Care Institute, Jaipur",
    consultationFee: "1000.00",
    languagesSpoken: ["English", "Hindi", "Rajasthani"],
    gender: "male",
    dateOfBirth: new Date("1980-05-18"),
    clinicCity: "Jaipur",
    clinicState: "Rajasthan",
    clinicLatitude: 26.9124,
    clinicLongitude: 75.7873,
  },

  // 8. ENT Specialist (1)
  {
    name: "Dr. Neha Saxena",
    email: "doctor15@test.com",
    specialization: "ENT Specialist",
    superSpecialization: "Rhinology & Sinus Surgery",
    qualification: "MBBS, MS ENT",
    medicalRegistrationNumber: "TEST-MCI-0015",
    experience: 9,
    hospitalName: "ClearEar ENT Clinic, Lucknow",
    consultationFee: "700.00",
    languagesSpoken: ["English", "Hindi"],
    gender: "female",
    dateOfBirth: new Date("1988-11-20"),
    clinicCity: "Lucknow",
    clinicState: "Uttar Pradesh",
    clinicLatitude: 26.8467,
    clinicLongitude: 80.9462,
  },

  // 9. Gynecologist (1)
  {
    name: "Dr. Sunita Reddy",
    email: "doctor16@test.com",
    specialization: "Gynecologist",
    superSpecialization: "Obstetrics & High-Risk Pregnancy",
    qualification: "MBBS, MS OB-GYN, DNB",
    medicalRegistrationNumber: "TEST-MCI-0016",
    experience: 16,
    hospitalName: "Rainbow Children's & Women Hospital, Hyderabad",
    consultationFee: "950.00",
    languagesSpoken: ["English", "Hindi", "Telugu"],
    gender: "female",
    dateOfBirth: new Date("1978-09-02"),
    clinicCity: "Hyderabad",
    clinicState: "Telangana",
    clinicLatitude: 17.385,
    clinicLongitude: 78.4867,
  },

  // 10. Endocrinologist (1)
  {
    name: "Dr. Manish Bhatia",
    email: "doctor17@test.com",
    specialization: "Endocrinologist",
    superSpecialization: "Diabetes & Thyroid Care",
    qualification: "MBBS, MD, DM Endocrinology",
    medicalRegistrationNumber: "TEST-MCI-0017",
    experience: 11,
    hospitalName: "Endocrine & Diabetes Care, Indore",
    consultationFee: "900.00",
    languagesSpoken: ["English", "Hindi"],
    gender: "male",
    dateOfBirth: new Date("1985-02-14"),
    clinicCity: "Indore",
    clinicState: "Madhya Pradesh",
    clinicLatitude: 22.7196,
    clinicLongitude: 75.8577,
  },

  // 11. Psychiatrist (1)
  {
    name: "Dr. Tarun Joshi",
    email: "doctor18@test.com",
    specialization: "Psychiatrist",
    superSpecialization: "Adult & Adolescent Mental Health",
    qualification: "MBBS, MD Psychiatry",
    medicalRegistrationNumber: "TEST-MCI-0018",
    experience: 10,
    hospitalName: "Mind Care Wellness Clinic, Dehradun",
    consultationFee: "1100.00",
    languagesSpoken: ["English", "Hindi"],
    gender: "male",
    dateOfBirth: new Date("1986-06-25"),
    clinicCity: "Dehradun",
    clinicState: "Uttarakhand",
    clinicLatitude: 30.3165,
    clinicLongitude: 78.0322,
  },

  // 12. Ophthalmologist (1)
  {
    name: "Dr. Priyamvada Acharya",
    email: "doctor19@test.com",
    specialization: "Ophthalmologist",
    superSpecialization: "Cataract & Lasik Surgery",
    qualification: "MBBS, MS Ophthalmology",
    medicalRegistrationNumber: "TEST-MCI-0019",
    experience: 14,
    hospitalName: "Sankara Nethralaya Centre, Chennai",
    consultationFee: "800.00",
    languagesSpoken: ["English", "Hindi", "Tamil"],
    gender: "female",
    dateOfBirth: new Date("1981-10-31"),
    clinicCity: "Chennai",
    clinicState: "Tamil Nadu",
    clinicLatitude: 13.0827,
    clinicLongitude: 80.2707,
  },

  // 13. Pediatrician (1)
  {
    name: "Dr. Madhav Sharma",
    email: "doctor20@test.com",
    specialization: "Pediatrician",
    superSpecialization: "Pediatric Neonatology",
    qualification: "MBBS, MD Pediatrics",
    medicalRegistrationNumber: "TEST-MCI-0020",
    experience: 13,
    hospitalName: "Surya Children's Hospital, Mumbai",
    consultationFee: "750.00",
    languagesSpoken: ["English", "Hindi", "Marathi"],
    gender: "male",
    dateOfBirth: new Date("1983-04-03"),
    clinicCity: "Mumbai",
    clinicState: "Maharashtra",
    clinicLatitude: 19.0825,
    clinicLongitude: 72.8411,
  },
];

// Time slots to generate for each availability day
const SLOT_TIMES = [
  { startTime: "09:00", endTime: "09:30" },
  { startTime: "09:30", endTime: "10:00" },
  { startTime: "10:00", endTime: "10:30" },
  { startTime: "11:00", endTime: "11:30" },
  { startTime: "14:00", endTime: "14:30" },
  { startTime: "15:00", endTime: "15:30" },
];

export async function seedDoctors() {
  console.log("🌱 Starting Doctor Seeding process...");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const seededDoctorSummary = [];

  // Generate dates for the next 7 days starting from today (2026-07-22 onward)
  const today = new Date();
  const upcomingDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    upcomingDates.push(d.toISOString().split("T")[0]);
  }

  for (const docData of DOCTORS_DATA) {
    // 1. Create or Find User
    let userRow;
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, docData.email))
      .limit(1);

    if (existingUsers.length > 0) {
      userRow = existingUsers[0];
      // Update role & password if necessary
      await db
        .update(users)
        .set({
          role: "doctor",
          passwordHash,
          isVerified: true,
          isActive: true,
        })
        .where(eq(users.id, userRow.id));
    } else {
      const insertedUsers = await db
        .insert(users)
        .values({
          name: docData.name,
          email: docData.email,
          passwordHash,
          phone: docData.phone || "98765000" + docData.medicalRegistrationNumber.slice(-2),
          role: "doctor",
          isVerified: true,
          isActive: true,
        })
        .returning();
      userRow = insertedUsers[0];
    }

    // 2. Create or Update Doctor Profile
    const profileValues = {
      userId: userRow.id,
      phone: docData.phone || "98765000" + docData.medicalRegistrationNumber.slice(-2),
      gender: docData.gender,
      dateOfBirth: docData.dateOfBirth,
      specialization: docData.specialization,
      superSpecialization: docData.superSpecialization,
      qualification: docData.qualification,
      medicalRegistrationNumber: docData.medicalRegistrationNumber,
      experience: docData.experience,
      hospitalName: docData.hospitalName,
      consultationFee: docData.consultationFee,
      languagesSpoken: docData.languagesSpoken,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      consultationModes: ["video", "call", "chat"],
      startTime: "09:00",
      endTime: "17:00",
      hasClinic: true,
      clinicCity: docData.clinicCity,
      clinicState: docData.clinicState,
      clinicLatitude: docData.clinicLatitude,
      clinicLongitude: docData.clinicLongitude,
      profileCompleted: true,
      verificationStatus: "verified",
      aboutDoctor: `Experienced ${docData.specialization} at ${docData.hospitalName}. Specialized in ${docData.superSpecialization}.`,
      shortBio: `${docData.qualification} with ${docData.experience} years of clinical experience.`,
    };

    const existingProfiles = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.userId, userRow.id))
      .limit(1);

    if (existingProfiles.length > 0) {
      await db
        .update(doctorProfiles)
        .set(profileValues)
        .where(eq(doctorProfiles.userId, userRow.id));
    } else {
      await db.insert(doctorProfiles).values(profileValues);
    }

    // 3. Create Doctor Availabilities & Availability Slots
    for (const availableDate of upcomingDates) {
      let availabilityRow;
      const existingAvail = await db
        .select()
        .from(doctorAvailabilities)
        .where(
          and(
            eq(doctorAvailabilities.doctorId, userRow.id),
            eq(doctorAvailabilities.availableDate, availableDate)
          )
        )
        .limit(1);

      if (existingAvail.length > 0) {
        availabilityRow = existingAvail[0];
      } else {
        const insertedAvail = await db
          .insert(doctorAvailabilities)
          .values({
            doctorId: userRow.id,
            availableDate,
            isActive: true,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedAvail.length > 0) {
          availabilityRow = insertedAvail[0];
        } else {
          // Fetch existing if conflict occurred
          const refetch = await db
            .select()
            .from(doctorAvailabilities)
            .where(
              and(
                eq(doctorAvailabilities.doctorId, userRow.id),
                eq(doctorAvailabilities.availableDate, availableDate)
              )
            )
            .limit(1);
          availabilityRow = refetch[0];
        }
      }

      if (availabilityRow) {
        for (const slot of SLOT_TIMES) {
          await db
            .insert(availabilitySlots)
            .values({
              availabilityId: availabilityRow.id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBooked: false,
              bookedById: null,
              consultationId: null,
            })
            .onConflictDoNothing();
        }
      }
    }

    seededDoctorSummary.push({
      id: userRow.id,
      name: docData.name,
      email: docData.email,
      password: SEED_PASSWORD,
      specialization: docData.specialization,
      hospital: docData.hospitalName,
      city: docData.clinicCity,
      fee: `₹${docData.consultationFee}`,
      verificationStatus: "verified",
      profileCompleted: true,
    });
  }

  console.log("✅ Successfully seeded 20 test doctors with complete profiles & availability slots!");
  return seededDoctorSummary;
}

// Allow direct execution via CLI (node src/seeds/seedDoctors.js)
if (process.argv[1]?.includes("seedDoctors.js")) {
  seedDoctors()
    .then((summary) => {
      console.log("\n====================================================");
      console.log("             SEEDED DOCTORS LIST                    ");
      console.log("====================================================");
      console.table(summary);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Doctor Seeding Failed:", err);
      process.exit(1);
    });
}
