# Plan 06-1: Medical Document Protection & Upload Security

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Wave**: 1 of 4  
> **Requirements**: REQ-SEC-DOC-01, REQ-SEC-DOC-02, REQ-SEC-DOC-03, REQ-SEC-DOC-04, REQ-SEC-UPLOAD-01, REQ-SEC-UPLOAD-02  
> **Files Modified**:  
> - `server/src/app.js`  
> - `server/src/controllers/prescriptionController.js`  
> - `server/src/routes/prescriptionRoutes.js`  
> - `server/src/controllers/patientHistoryController.js`  
> - `server/src/routes/patientHistoryRoutes.js`  
> - `server/src/routes/medicalRecordRoutes.js`  
> - `client/src/utils/api.js`  
> - `client/src/pages/ClinicalRecords/ClinicalRecords.jsx`  

---

## Task 1.1: Discontinue Public Static Serving of `/uploads`
- **File**: `server/src/app.js`
- **Action**: Remove or comment out `app.use("/uploads", express.static(...))`.
- **Verification**: `curl -I http://localhost:5000/uploads/prescriptions/test.pdf` returns HTTP 404.

## Task 1.2: Implement Authenticated Prescription PDF Streaming
- **Files**: `server/src/controllers/prescriptionController.js`, `server/src/routes/prescriptionRoutes.js`
- **Action**:
  - Add `streamPrescriptionPdf` controller.
  - Query prescription by `id`. Verify requester is either `rx.patientId`, `rx.doctorId`, an authorized attending doctor with a consultation relationship, or admin.
  - Return HTTP 403 if unauthorized.
  - Stream file via `fs.createReadStream` with `Content-Disposition: attachment; filename="prescription-<id>.pdf"`, `Content-Type: application/pdf`, `X-Content-Type-Options: nosniff`.
  - Wire to `GET /api/prescriptions/:id/pdf` with `authMiddleware`.
- **Verification**: Patient can download their own prescription PDF; unrelated doctor gets 403.

## Task 1.3: Implement Authenticated Clinical Attachment Streaming
- **Files**: `server/src/controllers/patientHistoryController.js`, `server/src/routes/patientHistoryRoutes.js`
- **Action**:
  - Add `streamClinicalRecordAttachment` controller.
  - Query attachment and associated medical record. Verify ownership or active doctor relationship.
  - Stream file with verified MIME and `nosniff`.
  - Wire to `GET /api/patient-history/attachments/:attachmentId`.
- **Verification**: Unauthorized requests receive 403.

## Task 1.4: Update Client PDF & Attachment Viewers
- **Files**: `client/src/utils/api.js`, `client/src/pages/ClinicalRecords/ClinicalRecords.jsx`
- **Action**:
  - Add `prescriptionApi.downloadPrescriptionPdf(id)` downloading blob with auth header.
  - Update `ClinicalRecords.jsx` "Download PDF" and "View" buttons to use the authenticated blob download helper instead of direct `/uploads/` URLs.
- **Verification**: Clicking Download PDF in ClinicalRecords downloads the PDF cleanly.

## Task 1.5: Add Strict Multer FileFilter for Uploads
- **Files**: `server/src/routes/medicalRecordRoutes.js`, `server/src/routes/patientHistoryRoutes.js`
- **Action**:
  - Configure Multer `fileFilter` to accept only `image/jpeg`, `image/png`, and `application/pdf`.
  - Reject all other MIME types with `new Error("Only PDF, JPG, and PNG files are allowed")`.
- **Verification**: Uploading `.html` or `.svg` is rejected with 400 Bad Request.

