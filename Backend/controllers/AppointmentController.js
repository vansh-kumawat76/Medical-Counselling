const CounsellingRequest = require("../models/CounsellingRequest");
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");
async function CreateAppointemnt(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    console.log("Logged -in user ID :", userId);
    console.log("Logged-in User Role :", role);

    const { requestId, scheduledStart, scheduledEnd, mode } = req.body;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid counselling request ID",
      });
    }
    const request = await CounsellingRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        status: false,
        message: "Counselling request not found",
      });
    }

    // Check whether counsellor is assigned
    if (!request.assignedTo) {
      return res.status(400).json({
        status: false,
        message: "Counsellor is not assigned to this request",
      });
    }

    // Role authorization
    if (role === "Admin" || role === "SuperAdmin") {
      // Admin and SuperAdmin are allowed
    } else if (role === "Counsellor") {
      if (!request.assignedTo.equals(userId)) {
        return res.status(403).json({
          status: false,
          message:
            "You are not authorized to create an appointment for this counselling request",
        });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to create appointments",
      });
    }

    // Validate appointment dates
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (
      !scheduledStart ||
      !scheduledEnd ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      start >= end
    ) {
      return res.status(400).json({
        status: false,
        message: "Please provide valid appointment start and end times",
      });
    }

    const allowedModes = ["phone", "video", "in_person", "chat"];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        status: false,
        message: "Invalid appointment mode",
      });
    }

    //Check overlapping appointments
    const overlappingAppointment = await Appointment.findOne({
      counsellor: request.assignedTo,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledStart: { $lt: end },
      scheduledEnd: { $gt: start },
    });

    if (overlappingAppointment) {
      return res.status(409).json({
        status: false,
        message: "Counsellor already has an appointment during this time",
        conflictingAppointment: overlappingAppointment._id,
      });
    }

    // Check duplicate active appointment for same request
    const existingAppointment = await Appointment.findOne({
      counsellingRequest: request._id,
      status: { $in: ["scheduled", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(409).json({
        status: false,
        message:
          "An active appointment already exists for this counselling request",
        existingAppointment: existingAppointment._id,
      });
    }

    // Create appointment
    const createAppointment = await Appointment.create({
      counsellingRequest: request._id,
      student: request.student,
      counsellor: request.assignedTo,
      scheduledStart: start,
      scheduledEnd: end,
      mode,
      bookedBy: userId,
    });

    return res.status(201).json({
      status: true,
      message: "Appointment created successfully",
      appointment: createAppointment,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function GetAllAppointments(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let filter = {};

    // Admin and SuperAdmin can see all appointments
    if (role === "Admin" || role === "SuperAdmin") {
      filter = {};
    }

    // Counsellor can see only their appointments
    else if (role === "Counsellor") {
      filter.counsellor = userId;
    }

    // Student can see only their appointments
    else if (role === "Student") {
      filter.student = userId;
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view appointments",
      });
    }

    const appointments = await Appointment.find(filter)
      .populate("student", "name email")
      .populate("counsellor", "name email")
      .populate(
        "counsellingRequest",
        "requestNumber academicYear admissionLevel",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "Appointments fetched successfully",
      totalAppointments: appointments.length,
      appointments,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}
async function GetSingleAppointment(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("student", "name email")
      .populate("counsellor", "name email")
      .populate(
        "counsellingRequest",
        "requestNumber academicYear admissionLevel",
      );

    if (!appointment) {
      return res.status(404).json({
        status: false,
        message: "Appointment not found",
      });
    }

    // Admin and SuperAdmin can view all appointments
    if (role === "Admin" || role === "SuperAdmin") {
      // Allowed
    }

    // Counsellor can view only their appointments
    else if (role === "Counsellor") {
      if (!appointment.counsellor._id.equals(userId)) {
        return res.status(403).json({
          status: false,
          message: "You are not authorized to view this appointment",
        });
      }
    }

    // Student can view only their appointments
    else if (role === "Student") {
      if (!appointment.student._id.equals(userId)) {
        return res.status(403).json({
          status: false,
          message: "You are not authorized to view this appointment",
        });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to view appointments",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Appointment fetched successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function UpdateAppointmentStatus(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { appointmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
  return res.status(400).json({
    status: false,
    message: "Invalid appointment ID",
  });
}
    const { status } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        status: false,
        message: "Appointment not found",
      });
    }

    // Role authorization
    if (role === "Admin" || role === "SuperAdmin") {
      // Allowed
    } else if (role === "Counsellor") {
      if (!appointment.counsellor.equals(userId)) {
        return res.status(403).json({
          status: false,
          message: "You are not authorized to update this appointment",
        });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to update appointment status",
      });
    }

    // Allowed status transitions
    const allowedTransitions = {
      scheduled: ["confirmed"],
      confirmed: ["completed", "no_show"],
    };

    if (!allowedTransitions[appointment.status]?.includes(status)) {
      return res.status(400).json({
        status: false,
        message: `Cannot change appointment status from ${appointment.status} to ${status}`,
      });
    }

    // Update status
    appointment.status = status;

    if (status === "completed") {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    return res.status(200).json({
      status: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { appointmentId } = req.params;
    console.log("appointmentId", appointmentId);

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid appointment ID",
      });
    }

    const { cancellationReason } = req.body;
    console.log("cancellationReason :", cancellationReason);

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        status: false,
        message: "Appointment not found",
      });
    }

    if (role === "Admin" || role === "SuperAdmin") {
      //Admin and superAdmin are allwoed
    } else if (role === "Counsellor") {
      if (!appointment.counsellor.equals(userId)) {
        return res.status(403).json({
          status: false,
          message: "You are not authorize to cancel this appointment",
        });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to cancel appointments",
      });
    }
    if (!["scheduled", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        status: false,
        message: `Appointment with status ${appointment.status} cannot be cancelled`,
      });
    }
    if (typeof cancellationReason !== "string" || !cancellationReason.trim()) {
      return res.status(400).json({
        status: false,
        message: "Cancellation reason is required",
      });
    }
    appointment.status = "cancelled";
    appointment.cancellationReason = cancellationReason.trim();

    await appointment.save();

    return res.status(200).json({
      status: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const { oldAppointment } = req.params;
    if (!mongoose.Types.ObjectId.isValid(oldAppointment)) {
      return res.status(400).json({
        status: false,
        message: "Invalid appointment ID",
      });
    }
    const { scheduledStart, scheduledEnd, mode } = req.body;

    console.log(userId, role);
    console.log(oldAppointment);
    console.log(scheduledStart, scheduledEnd, mode);

    const appointment = await Appointment.findById(oldAppointment);
    if (!appointment) {
      return res.status(404).json({
        status: false,
        message: "Appointment not found",
      });
    }
    if (role === "Admin" || role === "SuperAdmin") {
      // admin and superAdmin are allowed
    } else if (role === "Counsellor") {
      if (!appointment.counsellor.equals(userId)) {
        return res.status(403).json({
          status: false,
          message: "Your are not authorized to reschedule this appointment",
        });
      }
    } else {
      return res.status(403).json({
        status: false,
        message: "You are not authorized to reschedule appointments",
      });
    }
    if (!["scheduled", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        status: false,
        message: `Appointment with status ${appointment.status} cannot be rescheduled`,
      });
    }
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);

    if (
      !scheduledStart ||
      !scheduledEnd ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      start >= end
    ) {
      return res.status(400).json({
        status: false,
        message: "Please provide valid appointment start and end times",
      });
    }
    
    const overlappingAppointment = await Appointment.findOne({
      _id: { $ne: appointment._id },
      counsellor: appointment.counsellor,
      status: { $in: ["scheduled", "confirmed"] },
      scheduledStart: { $lt: end },
      scheduledEnd: { $gt: start },
    });

    if (overlappingAppointment) {
      return res.status(409).json({
        status: false,
        message: "Counsellor already has an appointment during this time",
        conflictingAppointment: overlappingAppointment._id,
      });
    }

    const allowedModes = ["phone", "video", "in_person", "chat"];
    if (mode && !allowedModes.includes(mode)) {
      return res.status(400).json({
        status: false,
        message: "Invalid appointment mode",
      });
    }


    const newAppointment = await Appointment.create({
      counsellingRequest: appointment.counsellingRequest,
      student: appointment.student,
      counsellor: appointment.counsellor,
      scheduledStart: start,
      scheduledEnd: end,
      timezone: appointment.timezone,
      mode: mode || appointment.mode,
      bookedBy: userId,
      rescheduledFrom: appointment._id,
    });

      appointment.status = "rescheduled";
    await appointment.save();
    return res.status(201).json({
      status: true,
      message: "Appointment rescheduled successfully",
      oldAppointment: appointment,
      newAppointment,
    });
  
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  CreateAppointemnt,
  GetAllAppointments,
  GetSingleAppointment,
  UpdateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
};
