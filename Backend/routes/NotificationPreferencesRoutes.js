
const express = require("express");

const {
  getNotificationPreferences,
  updateNotificationPreferences,
} = require("../controllers/NotificationPreferencesController");

const router = express.Router();
const auth = require("../auth");

// Get notification preferences
router.get("/", auth, getNotificationPreferences);

// Update notification preferences
router.put("/", auth, updateNotificationPreferences);

module.exports = router;
