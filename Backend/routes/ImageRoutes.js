const express = require("express");
const router = express.Router();
const cacheMiddleware = require("../middleware/cacheMiddleware");
const {
  SaveImageController,
  GetImageController,
} = require("../controllers/ImageController");

router.post("/save-image", SaveImageController);
router.get("/get-image", 
  cacheMiddleware(300),
   GetImageController);

module.exports = router;