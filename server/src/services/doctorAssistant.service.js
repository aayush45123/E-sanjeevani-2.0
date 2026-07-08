import { ConsultationRepository } from "../repositories/consultation.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { PatientProfileRepository } from "../repositories/patientProfile.repository.js";
import { AiTriageRepository } from "../repositories/aiTriage.repository.js";

export class DoctorAssistantService {
  static async getDoctorAssistantData(consultationId) {
    const consultation = await ConsultationRepository.findById(consultationId);

    if (!consultation) {
      throw { status: 404, message: "Consultation not found" };
    }

    const patientInfo = await UserRepository.findById(consultation.patientId);
    let patientBasicInfo = null;
    if (patientInfo) {
      patientBasicInfo = {
        id: patientInfo.id,
        name: patientInfo.name,
        email: patientInfo.email,
        phone: patientInfo.phone,
        profileImage: patientInfo.profileImage,
        role: patientInfo.role,
        isVerified: patientInfo.isVerified,
        isActive: patientInfo.isActive,
        createdAt: patientInfo.createdAt,
        updatedAt: patientInfo.updatedAt,
      };
    }

    const doctorInfo = await UserRepository.findById(consultation.doctorId);
    let doctorBasicInfo = null;
    if (doctorInfo) {
      doctorBasicInfo = {
        id: doctorInfo.id,
        name: doctorInfo.name,
        email: doctorInfo.email,
        phone: doctorInfo.phone,
        profileImage: doctorInfo.profileImage,
        role: doctorInfo.role,
        isVerified: doctorInfo.isVerified,
        isActive: doctorInfo.isActive,
        createdAt: doctorInfo.createdAt,
        updatedAt: doctorInfo.updatedAt,
      };
    }

    const patientProfile = await PatientProfileRepository.findByUserId(consultation.patientId);
    const latestAITriage = await AiTriageRepository.findLatestByUserId(consultation.patientId);

    return {
      patientBasicInfo,
      consultationDetails: {
        ...consultation,
        patient: patientBasicInfo,
        doctor: doctorBasicInfo,
      },
      patientProfile,
      latestAITriage,
    };
  }
}
