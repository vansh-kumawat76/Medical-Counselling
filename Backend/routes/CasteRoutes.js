
const express = require("express");
const router = express.Router();

const {
  createCaste,
  getAllCastes,
  getCastesByLevel,
  getCastesByState,
  updateCaste,
  deleteCaste,
} = require("../controllers/CasteController");

// Create Caste
router.post("/create", createCaste);
// Get All Castes
router.get("/all", getAllCastes);
// Get Castes By Level
router.get("/level", getCastesByLevel);
// Get Castes By State
router.get("/state/:stateId", getCastesByState);
// Update Caste
router.put("/update/:casteId", updateCaste);
// Deactivate Caste
router.patch("/delete/:casteId", deleteCaste);
module.exports = router;
