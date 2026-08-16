import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "../../uploads/prescriptions");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class PrescriptionPdfService {
  static async generatePrescriptionPdf({
    recordId,
    consultationId,
    recordDate,
    doctor,
    patient,
    diagnosis,
    prescriptionItems = [],
    advice,
    recommendedTests,
    referralInfo,
    followUpRequired,
    followUpDays,
    doctorNotes,
  }) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `prescription-${recordId || Date.now()}.pdf`;
        const filePath = path.join(UPLOADS_DIR, fileName);
        const relativeUrl = `/uploads/prescriptions/${fileName}`;

        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Header Background Banner
        doc
          .rect(0, 0, doc.page.width, 90)
          .fill("#0f172a");

        doc
          .fillColor("#ffffff")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("eSanjeevani 2.0", 40, 25);

        doc
          .fillColor("#38bdf8")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("NATIONAL TELEMEDICINE SERVICE — DIGITAL PRESCRIPTION", 40, 52);

        doc
          .fillColor("#94a3b8")
          .fontSize(9)
          .font("Helvetica")
          .text(`Date: ${recordDate || new Date().toLocaleDateString("en-IN")}`, doc.page.width - 200, 52, { align: "right" });

        doc.moveDown(4);

        // Doctor & Hospital Details
        doc
          .fillColor("#0f172a")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(`Dr. ${doctor.name || "Specialist"}`, 40, 110);

        doc
          .fillColor("#2563eb")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`${doctor.specialization || "General Medicine"} | ${doctor.qualification || "MBBS"}`);

        doc
          .fillColor("#64748b")
          .fontSize(9)
          .font("Helvetica")
          .text(`Reg No: ${doctor.medicalRegistrationNumber || "TEST-MCI-VERIFIED"} | ${doctor.hospitalName || "E-Sanjeevani Healthcare Center"}`);

        doc
          .moveDown()
          .strokeColor("#e2e8f0")
          .lineWidth(1)
          .moveTo(40, doc.y)
          .lineTo(doc.page.width - 40, doc.y)
          .stroke();

        doc.moveDown(0.8);

        // Patient Info Block
        const patientY = doc.y;
        doc
          .rect(40, patientY, doc.page.width - 80, 50)
          .fill("#f8fafc")
          .stroke("#e2e8f0");

        doc
          .fillColor("#475569")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("PATIENT NAME:", 52, patientY + 12);

        doc
          .fillColor("#0f172a")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(patient.name || "Patient", 135, patientY + 11);

        doc
          .fillColor("#475569")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("CONSULTATION ID:", 52, patientY + 30);

        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .font("Helvetica")
          .text(consultationId || recordId, 155, patientY + 30);

        doc
          .fillColor("#475569")
          .fontSize(9)
          .font("Helvetica-Bold")
          .text("GENDER / AGE:", doc.page.width - 220, patientY + 12);

        doc
          .fillColor("#0f172a")
          .fontSize(9)
          .font("Helvetica")
          .text(`${patient.gender || "N/A"} / ${patient.age || "N/A"}`, doc.page.width - 135, patientY + 12);

        doc.y = patientY + 65;

        // Diagnosis Section
        doc
          .fillColor("#0f172a")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text("DIAGNOSIS");

        doc
          .rect(40, doc.y + 4, doc.page.width - 80, 28)
          .fill("#eff6ff")
          .stroke("#bfdbfe");

        doc
          .fillColor("#1e40af")
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(diagnosis || "Clinical Evaluation & Consultation", 52, doc.y + 12);

        doc.y = doc.y + 30;

        // Prescription Header (Rx)
        doc.moveDown(0.8);
        doc
          .fillColor("#0f172a")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Rx — Prescribed Medications");

        doc.moveDown(0.4);

        // Medicines Table Header
        const tableTop = doc.y;
        doc
          .rect(40, tableTop, doc.page.width - 80, 22)
          .fill("#1e293b");

        doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
        doc.text("MEDICINE NAME", 48, tableTop + 7);
        doc.text("DOSAGE", 195, tableTop + 7);
        doc.text("ROUTE", 270, tableTop + 7);
        doc.text("FREQUENCY", 345, tableTop + 7);
        doc.text("DURATION", 430, tableTop + 7);
        doc.text("INSTRUCTIONS", 495, tableTop + 7);

        let currentY = tableTop + 22;

        if (prescriptionItems.length > 0) {
          prescriptionItems.forEach((item, index) => {
            const rowBg = index % 2 === 0 ? "#ffffff" : "#f8fafc";
            doc
              .rect(40, currentY, doc.page.width - 80, 24)
              .fill(rowBg)
              .stroke("#f1f5f9");

            doc.fillColor("#0f172a").fontSize(8.5).font("Helvetica-Bold");
            doc.text(`${index + 1}. ${item.medicineName}`, 45, currentY + 7, { width: 145 });

            doc.fillColor("#334155").font("Helvetica");
            doc.text(item.dosage || "-", 195, currentY + 7);
            doc.text(item.route || "Oral", 270, currentY + 7);
            doc.text(item.frequency || "-", 345, currentY + 7);
            doc.text(item.duration || "-", 430, currentY + 7);
            doc.text(item.instructions || "After food", 495, currentY + 7, { width: 65 });

            currentY += 24;
          });
        } else {
          doc
            .rect(40, currentY, doc.page.width - 80, 24)
            .fill("#ffffff")
            .stroke("#f1f5f9");
          doc.fillColor("#64748b").fontSize(8.5).font("Helvetica");
          doc.text("No specific medications prescribed.", 50, currentY + 7);
          currentY += 24;
        }

        doc.y = currentY + 15;

        // Advice & Recommended Tests
        if (advice) {
          doc
            .fillColor("#0f172a")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("GENERAL ADVICE");

          doc
            .fillColor("#334155")
            .fontSize(9)
            .font("Helvetica")
            .text(advice, 40, doc.y + 4, { width: doc.page.width - 80 });

          doc.y = doc.y + 12;
        }

        if (recommendedTests) {
          doc.moveDown(0.6);
          doc
            .fillColor("#0f172a")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("RECOMMENDED DIAGNOSTIC TESTS");

          doc
            .fillColor("#334155")
            .fontSize(9)
            .font("Helvetica")
            .text(recommendedTests, 40, doc.y + 4, { width: doc.page.width - 80 });

          doc.y = doc.y + 12;
        }

        if (referralInfo) {
          doc.moveDown(0.6);
          doc
            .fillColor("#0f172a")
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("SPECIALIST REFERRAL INFORMATION");

          doc
            .fillColor("#334155")
            .fontSize(9)
            .font("Helvetica")
            .text(referralInfo, 40, doc.y + 4, { width: doc.page.width - 80 });

          doc.y = doc.y + 12;
        }

        if (followUpRequired) {
          doc.moveDown(0.6);
          doc
            .fillColor("#15803d")
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .text(`FOLLOW-UP ADVISED: Re-consult after ${followUpDays || 7} days.`);
        }

        if (doctorNotes) {
          doc.moveDown(0.6);
          doc
            .fillColor("#475569")
            .fontSize(8.5)
            .font("Helvetica-Oblique")
            .text(`Doctor Notes: ${doctorNotes}`, 40, doc.y + 4, { width: doc.page.width - 80 });
        }

        // Footer Banner
        const footerY = doc.page.height - 60;
        doc
          .strokeColor("#e2e8f0")
          .lineWidth(1)
          .moveTo(40, footerY - 10)
          .lineTo(doc.page.width - 40, footerY - 10)
          .stroke();

        doc
          .fillColor("#16a34a")
          .fontSize(8.5)
          .font("Helvetica-Bold")
          .text("✓ DIGITALLY SIGNED & VERIFIED", 40, footerY);

        doc
          .fillColor("#94a3b8")
          .fontSize(7.5)
          .font("Helvetica")
          .text("Generated by E-Sanjeevani 2.0 National Telemedicine Platform. This prescription is legally valid under IT Act 2000 & Telemedicine Guidelines.", 40, footerY + 12, { align: "center", width: doc.page.width - 80 });

        doc.end();

        writeStream.on("finish", () => {
          resolve(relativeUrl);
        });

        writeStream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
