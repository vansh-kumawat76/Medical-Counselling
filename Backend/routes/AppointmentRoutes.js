const express = require("express");
const { CreateAppointemnt, GetAllAppointments, GetSingleAppointment, UpdateAppointmentStatus, cancelAppointment, rescheduleAppointment } = require("../controllers/AppointmentController");
const auth = require("../auth")
const router = express.Router();

router.post("/create-Appointment",auth, CreateAppointemnt);
router.get("/getAll-Appointment", auth, GetAllAppointments);
router.get(
  "/get-Single-Appointment/:appointmentId",
  auth,
  GetSingleAppointment
);
router.put("/update-Appointment-Status/:appointmentId", auth, UpdateAppointmentStatus);
router.put(
  "/cancel-Appointment/:appointmentId",
  auth,
  cancelAppointment
);
router.put(
  "/reschedule-Appointment/:oldAppointment",
  auth,
  rescheduleAppointment
);
module.exports = router