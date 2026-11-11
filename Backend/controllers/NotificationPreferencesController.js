
const NotificationPreferences = require("../models/NotificationPreferences");

// ================= GET NOTIFICATION PREFERENCES =================

async function getNotificationPreferences(req, res) {
  try {
    const userId = req.user.userId;

    let preferences = await NotificationPreferences.findOne({
      student: userId,
    });

    // Create default preferences for first-time users
    if (!preferences) {
      preferences = await NotificationPreferences.create({
        student: userId,
      });
    }

    return res.status(200).send({
      status: true,
      message: "Notification preferences retrieved successfully.",
      data: preferences,
    });

  } catch (error) {
    console.error("Get Notification Preferences Error:", error);

    return res.status(500).send({
      status: false,
      message: "Unable to retrieve notification preferences.",
      error: error.message,
    });
  }
}

// ================= UPDATE NOTIFICATION PREFERENCES =================

async function updateNotificationPreferences(req, res) {
  try {
    const userId = req.user.userId;

    const allowedFields = [
      "emailNotifications",
      "appointmentNotifications",
      "counsellingNotifications",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "boolean") {
          return res.status(400).send({
            status: false,
            message: `${field} must be true or false.`,
          });
        }

        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).send({
        status: false,
        message: "Please provide at least one valid notification preference.",
      });
    }

    const preferences = await NotificationPreferences.findOneAndUpdate(
      {
        student: userId,
      },
      {
        $set: updates,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).send({
      status: true,
      message: "Notification preferences updated successfully.",
      data: preferences,
    });

  } catch (error) {
    console.error("Update Notification Preferences Error:", error);

    return res.status(500).send({
      status: false,
      message: "Unable to update notification preferences.",
      error: error.message,
    });
  }
}

// ================= EXPORTS =================

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
};
