const express = require("express");
const router = express.Router();

const {
  SaveImageController,
  GetImageController,
} = require("../controllers/ImageController");

router.post("/save-image", SaveImageController);
router.get("/get-image", GetImageController);

module.exports = router;