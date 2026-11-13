
const express = require("express");
const router = express.Router();

const auth = require("../auth");
const documentUpload = require("../middleware/documentUpload");
const { uploadDocument, getStudentDocuments, deleteStudentDocument, getStudentDocumentView } = require("../controllers/UploadDocumentController");



// Upload document
router.post(
  "/upload",
  auth,
  documentUpload.single("document"),
  uploadDocument
);

// Get logged-in student's documents
router.get(
  "/",
  auth,
  getStudentDocuments
);

// Delete document
router.delete(
  "/:id",
  auth,
  deleteStudentDocument
);


router.get("/:id/view", auth, getStudentDocumentView);

module.exports = router;
