
const mongoose = require("mongoose");

const CounsellingNote = require("../models/CounsellingNote");
const CounsellingSession = require("../models/CounsellingSession");

const allowedRoles = ["SuperAdmin", "Admin", "Counsellor"];
const allowedVisibility = ["internal", "student_visible"];
const allowedCategories = [
  "academic",
  "budget",
  "preferences",
  "follow_up",
  "general"
];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getSessionAccess = async (sessionId, userId, role) => {
  const session = await CounsellingSession.findById(sessionId);

  if (!session) {
    return { error: "Counselling session not found", status: 404 };
  }

  if (
    role === "Counsellor" &&
    session.counsellor.toString() !== userId
  ) {
    return { error: "You cannot access this session", status: 403 };
  }

  if (
    role === "Student" &&
    session.student.toString() !== userId
  ) {
    return { error: "You cannot access this session", status: 403 };
  }

  return { session };
};

// CREATE NOTE
const CreateCounsellingNote = async (req, res) => {
  try {
    const { session, content, visibility, category } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to create notes"
      });
    }

    if (!session || !isValidId(session)) {
      return res.status(400).json({
        success: false,
        message: "Valid session ID is required"
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required"
      });
    }

    if (content.trim().length > 10000) {
      return res.status(400).json({
        success: false,
        message: "Note cannot exceed 10000 characters"
      });
    }

    if (visibility && !allowedVisibility.includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note visibility"
      });
    }

    if (category && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note category"
      });
    }

    const access = await getSessionAccess(session, userId, role);

    if (access.error) {
      return res.status(access.status).json({
        success: false,
        message: access.error
      });
    }

    const note = await CounsellingNote.create({
      session: access.session._id,
      counsellingRequest: access.session.counsellingRequest,
      author: userId,
      content: content.trim(),
      visibility: visibility || "internal",
      category: category || "general"
    });

    const populatedNote = await CounsellingNote.findById(note._id)
      .populate("author", "name email")
      .populate("session", "sessionNumber type status");

    return res.status(201).json({
      success: true,
      message: "Counselling note created successfully",
      data: populatedNote
    });

  } catch (error) {
    console.log("Create Counselling Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create counselling note",
      error: error.message
    });
  }
};

// GET ALL NOTES
const GetAllCounsellingNotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    if (!["SuperAdmin", "Admin", "Counsellor", "Student"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view notes"
      });
    }

    let sessionIds = null;

    if (role === "Counsellor" || role === "Student") {
      const filter = role === "Counsellor"
        ? { counsellor: userId }
        : { student: userId };

      const sessions = await CounsellingSession.find(filter).select("_id");
      sessionIds = sessions.map(item => item._id);
    }

    const query = {};

    if (sessionIds) {
      query.session = { $in: sessionIds };
    }

    if (role === "Student") {
      query.visibility = "student_visible";
    }

    const notes = await CounsellingNote.find(query)
      .populate("author", "name email")
      .populate("session", "sessionNumber type status student counsellor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });

  } catch (error) {
    console.log("Get All Counselling Notes Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch counselling notes",
      error: error.message
    });
  }
};

// GET SINGLE NOTE
const GetSingleCounsellingNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!isValidId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID"
      });
    }

    const note = await CounsellingNote.findById(noteId)
      .populate("author", "name email")
      .populate("session", "sessionNumber type status student counsellor");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Counselling note not found"
      });
    }

    if (role === "Student") {
      if (
        note.visibility !== "student_visible" ||
        note.session.student.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          message: "You cannot access this note"
        });
      }
    } else if (role === "Counsellor") {
      if (note.session.counsellor.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You cannot access this note"
        });
      }
    } else if (!["Admin", "SuperAdmin"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this note"
      });
    }

    return res.status(200).json({
      success: true,
      data: note
    });

  } catch (error) {
    console.log("Get Single Counselling Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch counselling note",
      error: error.message
    });
  }
};

// UPDATE NOTE
const UpdateCounsellingNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { content, visibility, category } = req.body;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!isValidId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID"
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update notes"
      });
    }

    const note = await CounsellingNote.findById(noteId)
      .populate("session", "student counsellor");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Counselling note not found"
      });
    }

    if (
      role === "Counsellor" &&
      note.session.counsellor.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this note"
      });
    }

    if (content !== undefined) {
      if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Note content cannot be empty"
        });
      }

      if (content.trim().length > 10000) {
        return res.status(400).json({
          success: false,
          message: "Note cannot exceed 10000 characters"
        });
      }

      note.content = content.trim();
    }

    if (visibility !== undefined) {
      if (!allowedVisibility.includes(visibility)) {
        return res.status(400).json({
          success: false,
          message: "Invalid note visibility"
        });
      }

      note.visibility = visibility;
    }

    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid note category"
        });
      }

      note.category = category;
    }

    note.editedAt = new Date();

    await note.save();

    return res.status(200).json({
      success: true,
      message: "Counselling note updated successfully",
      data: note
    });

  } catch (error) {
    console.log("Update Counselling Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update counselling note",
      error: error.message
    });
  }
};

// DELETE NOTE
const DeleteCounsellingNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const userId = req.user.userId;
    const role = req.user.role;

    if (!isValidId(noteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid note ID"
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete notes"
      });
    }

    const note = await CounsellingNote.findById(noteId)
      .populate("session", "student counsellor");

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Counselling note not found"
      });
    }

    if (
      role === "Counsellor" &&
      note.session.counsellor.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this note"
      });
    }

    await CounsellingNote.findByIdAndDelete(noteId);

    return res.status(200).json({
      success: true,
      message: "Counselling note deleted successfully"
    });

  } catch (error) {
    console.log("Delete Counselling Note Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete counselling note",
      error: error.message
    });
  }
};

module.exports = {
  CreateCounsellingNote,
  GetAllCounsellingNotes,
  GetSingleCounsellingNote,
  UpdateCounsellingNote,
  DeleteCounsellingNote
};
