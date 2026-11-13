
const cloudinary = require("../config/cloudinary");
const StudentDocument = require("../models/uploadDocument");
const UserSession = require("../models/UserSession");

const REQUIRED_DOCUMENTS = [
  "10th Marksheet",
  "12th Marksheet",
  "Graduation",
  "Aadhaar",
  "PAN Card",
  "Voter Id",
];

// ==================== GET STUDENT ACCOUNT ====================

const getStudentAccount = async (req) => {
  const userId = req.user?.userId;
  const sessionId = req.user?.sessionId;

  if (!userId || !sessionId || req.user?.role !== "Student") {
    return null;
  }

  const session = await UserSession.findOne({
    userId,
    sessionId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!session || !["User", "Students"].includes(session.accountModel)) {
    return null;
  }

  return {
    student: userId,
    accountModel: session.accountModel,
  };
};

// ==================== CLOUDINARY UPLOAD HELPER ====================

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "student-documents",
        resource_type: "auto",
        type: "authenticated",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

// ==================== UPLOAD DOCUMENT ====================

const uploadDocument = async (req, res) => {
  let uploadedFile;

  try {
    const account = await getStudentAccount(req);

    if (!account) {
      return res.status(403).json({
        status: false,
        message: "Only authenticated students can upload documents.",
      });
    }

    const { category } = req.body;

    if (!category || !REQUIRED_DOCUMENTS.includes(category)) {
      return res.status(400).json({
        status: false,
        message: "Please provide a valid document category.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Please select a document to upload.",
      });
    }

    // Check duplicate category
    const existingDocument = await StudentDocument.findOne({
      ...account,
      category,
    });

    if (existingDocument) {
      return res.status(409).json({
        status: false,
        message:
          existingDocument.status === "Rejected"
            ? "This document was rejected. Please delete it before uploading again."
            : "This document category has already been uploaded.",
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file);
    uploadedFile = result;

    const extension = req.file.originalname
      .split(".")
      .pop()
      .toLowerCase();

    const document = await StudentDocument.create({
      ...account,
      category,
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      fileType: extension,
    });

    // Get updated mandatory document status
    const documents = await StudentDocument.find(account);

    const uploadedCategories = [
      ...new Set(
        documents
          .filter((doc) => doc.status !== "Rejected")
          .map((doc) => doc.category)
      ),
    ];

    const missingDocuments = REQUIRED_DOCUMENTS.filter(
      (item) => !uploadedCategories.includes(item)
    );

    return res.status(201).json({
      status: true,
      message: "Document uploaded successfully.",
      data: document,
      uploadedDocuments: uploadedCategories,
      missingDocuments,
      isComplete: missingDocuments.length === 0,
    });
  } catch (error) {
    console.error("Upload Document Error:", error);

    // Cloudinary cleanup if database creation fails
    if (uploadedFile?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedFile.public_id, {
          resource_type: uploadedFile.resource_type,
          type: "authenticated",
        });
      } catch (deleteError) {
        console.error("Cloudinary Cleanup Error:", deleteError);
      }
    }

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while uploading the document.",
    });
  }
};

// ==================== GET STUDENT DOCUMENTS ====================

const getStudentDocuments = async (req, res) => {
  try {
    const account = await getStudentAccount(req);

    if (!account) {
      return res.status(403).json({
        status: false,
        message: "Only authenticated students can access documents.",
      });
    }

    const documents = await StudentDocument.find(account).sort({
      createdAt: -1,
    });

    const uploadedCategories = [
      ...new Set(
        documents
          .filter((doc) => doc.status !== "Rejected")
          .map((doc) => doc.category)
      ),
    ];

    const missingDocuments = REQUIRED_DOCUMENTS.filter(
      (category) => !uploadedCategories.includes(category)
    );

    return res.status(200).json({
      status: true,
      count: documents.length,
      data: documents,
      requiredDocuments: REQUIRED_DOCUMENTS,
      uploadedDocuments: uploadedCategories,
      missingDocuments,
      totalRequired: REQUIRED_DOCUMENTS.length,
      totalUploaded: uploadedCategories.length,
      isComplete: missingDocuments.length === 0,
    });
  } catch (error) {
    console.error("Get Student Documents Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while fetching documents.",
    });
  }
};

// ==================== DELETE STUDENT DOCUMENT ====================

const deleteStudentDocument = async (req, res) => {
  try {
    const account = await getStudentAccount(req);

    if (!account) {
      return res.status(403).json({
        status: false,
        message: "Only authenticated students can delete documents.",
      });
    }

    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid document ID.",
      });
    }

    const document = await StudentDocument.findOne({
      _id: id,
      ...account,
    });

    if (!document) {
      return res.status(404).json({
        status: false,
        message: "Document not found.",
      });
    }

    if (document.status === "Verified") {
      return res.status(403).json({
        status: false,
        message: "Verified documents cannot be deleted.",
      });
    }

    await cloudinary.uploader.destroy(document.publicId, {
      resource_type: document.resourceType,
      type: "authenticated",
    });

    await document.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Document deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Student Document Error:", error);

    return res.status(500).json({
      status: false,
      message: "An unexpected error occurred while deleting the document.",
    });
  }
};

// ==================== VIEW STUDENT DOCUMENT ====================

const getStudentDocumentView = async (req, res) => {
  try {
    const account = await getStudentAccount(req);

    if (!account) {
      return res.status(403).json({
        status: false,
        message: "Only authenticated students can access documents.",
      });
    }

    const { id } = req.params;

    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid document ID.",
      });
    }

    const document = await StudentDocument.findOne({
      _id: id,
      ...account,
    });

    if (!document) {
      return res.status(404).json({
        status: false,
        message: "Document not found.",
      });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    const fileUrl = cloudinary.utils.private_download_url(
      document.publicId,
      document.fileType,
      {
        resource_type: document.resourceType,
        type: "authenticated",
        expires_at: expiresAt,
        attachment: false,
      }
    );

    return res.status(200).json({
      status: true,
      message: "Document access URL generated successfully.",
      data: {
        fileName: document.fileName,
        fileType: document.fileType,
        fileUrl,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("View Student Document Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to generate document access URL.",
    });
  }
};

module.exports = {
  uploadDocument,
  getStudentDocuments,
  deleteStudentDocument,
  getStudentDocumentView,
};
