import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  getDoctorPatientHistory,
  getDoctorPatientAnalytics,
  getPatientClinicalRecords,
  addClinicalRecord,
  getClinicalRecordById,
} from "../controllers/patientHistoryController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ATTACHMENTS_DIR = path.join(__dirname, "../../uploads/attachments");
if (!fs.existsSync(ATTACHMENTS_DIR)) {
  fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ATTACHMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "doc-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

router.use(authMiddleware);

// Doctor patient history & analytics routes
router.get("/doctors/:doctorId/patients/:patientId/history", getDoctorPatientHistory);
router.get("/doctors/:doctorId/patients/:patientId/analytics", getDoctorPatientAnalytics);

// Patient clinical records routes
router.get("/patients/:patientId/clinical-records", getPatientClinicalRecords);
router.post("/patients/:patientId/clinical-records", upload.array("files", 5), addClinicalRecord);
router.get("/clinical-records/:id", getClinicalRecordById);

export default router;
