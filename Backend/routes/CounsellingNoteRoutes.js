
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  CreateCounsellingNote,
  GetAllCounsellingNotes,
  GetSingleCounsellingNote,
  UpdateCounsellingNote,
  DeleteCounsellingNote
} = require("../controllers/CounsellingNoteController");

// Create Note
router.post("/Create-Counselling-Note", auth, CreateCounsellingNote);

// Get All Notes
router.get("/Get-All-Counselling-Notes", auth, GetAllCounsellingNotes);

// Get Single Note
router.get("/Get-Single-Counselling-Note/:noteId", auth, GetSingleCounsellingNote);

// Update Note
router.put("/Update-Counselling-Note/:noteId", auth, UpdateCounsellingNote);

// Delete Note
router.delete("/Delete-Counselling-Note/:noteId", auth, DeleteCounsellingNote);

module.exports = router;
