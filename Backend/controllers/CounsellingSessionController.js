 const mongoose = require("mongoose");
 const CounsellingSession = require("../models/CounsellingSession");
    const Appointment = require("../models/Appointment")

const createCounsellingSession = async (req,res) => {
   try {
    const userId = req.user.userId;
    const role = req.user.role;

    const {appointmentId, type, mode} = req.body;

    //1. Validate appointment id
    if(!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
            status : false,
            message : "Invalid appointment ID"
        })
    }
    //2. Find appointment
    const appointment = await Appointment.findById(appointmentId);
       if(!appointment) {
        return res.status(404).json({
         status : false,
         message : "Appointment not found"
        })
       }
       // 3. check role permission
       if(role === "Student") {
        return res.status(403).json({
            status : false,
            message : "Students cannot create counselling sessions"
        })
       }
       if(role === "Counsellor" && appointment.counsellor.toString()!==userId) {
        return res.status(403).json({
            status : false,
            message : "You can create sessions only for your assigned appointments"
        })
       }
       if(!["Admin", "SuperAdmin", "Counsellor"].includes(role)) {
        return res.status(403).json({
            status : false,
            message : "You are not authorized to create a session"
        })
       }
       //4. check appoinment status
       if(!["confirmed", "completed"].includes(appointment.status)) {
        return res.status(400).json({
            status : false,
            message : "Appointment must be confirmed or completed"
        })
       }
       //5. check duplicate session for appointment
       const existingSession = await CounsellingSession.findOne({
        appointment : appointment._id
       })

       if(existingSession) {
        return res.status(409).json({
            status : false,
            message : "Session already exists for this appointment"
        })
       }

        const allowedTypes = ["initial", "follow_up", "admission_guidance", "other"];
        const allowedModes = ["phone", "video", "in_person", "chat"];

        if(type && !allowedTypes.includes(type)) {
           return res.status(400).json({
            status : false,
            message  : "Invalid session type"
           })
        }

        if(mode && !allowedModes.includes(mode)) {
            return res.status(400).json({
                status : false,
                message : "Invalid session mode"
            })
        }


       // 6. Generate session number
        const lastSession = await CounsellingSession.findOne({
            counsellingRequest : appointment.counsellingRequest
        }).sort({sessionNumber : -1});
        const sessionNumber = lastSession ? lastSession.sessionNumber+1 : 1;

       
        //7. create counselling session
            const session = await CounsellingSession.create({
      counsellingRequest: appointment.counsellingRequest,
      appointment: appointment._id,
      student: appointment.student,
      counsellor: appointment.counsellor,
      sessionNumber,
      type: type || "initial",
      mode: mode || appointment.mode,
      status: "in_progress"
    });

        return res.status(201).json({
            status : true,
            message : "Counselling session created successfully",
            session
        })
   }
   catch(error) {
    console.log("create counselling session error",error);
    return res.status(500).json({
        status : false,
        message : "Internal server error",
        error : error.message
    })
   }
}

const GetAllCounsellingSession = async(req,res)=>{
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        let filter = {};

        if(role === "Counsellor")  filter.counsellor = userId;
        
        else if(role === "Student") filter.student = userId;
        else if(!["Admin", "SuperAdmin"].includes(role)) {
            return res.status(403).json({
                status : false,
                message : "You are not authorized to view counselling sessions"
            })
        }
        const sessions = await CounsellingSession.find(filter).sort({createdAt : -1});
        return res.status(200).json({
            status : true,
            message : "Counselling sessions fetched successfully",
            totalSessions : sessions.length,
            sessions
        })
    }
    catch(error) {
        console.log("Get all counselling sessions error :", error);

        return res.status(500).json({
            status : false,
            message : "Internal server error",
            error : error.message 
        })
    }
}

const GetSingleCounsellingSession = async(req,res)=> {
    try {
const userId = req.user.userId;
const role = req.user.role;

const {sessionId} = req.params;
console.log("sessionId :", sessionId);

//1. Validate session ID
if(!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({
        status : false,
        message : "Invalid counselling session Id"
    })
}
//2. Find session
const session = await CounsellingSession.findById(sessionId);

if(!session) {
    return res.status(404).json({
        status : false,
        message : "Counselling session not found",
    })
}
//3. check authorization
if(role === "Counsellor" && session.counsellor.toString()!==userId) {
    return res.status(403).json({
        status : false,
        message : "You can view only counselling sessions",
    })
}
if(role === "Student" && session.student.toString()!==userId) {
    return res.status(403).json({
        status : false,
        message : "You can view only counselling sessions",
    })
}
if(!["Admin","SuperAdmin", "Counsellor", "Student"].includes(role)){
    return res.status(403).json({
        status : false,
        message : "you are not authorized to view this session"
    })
}
return res.status(200).json({
    status : true,
    message : "Counselling session fetched successfully",
    session
})
}
catch(error) {
    console.log("Get single counselling session error:", error);
    return res.status(500).json({
        status : false,
        message : "Internal server error",
        error : error.message
    })
}
}

const StartCounsellingSession = async(req,res)=>{
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const {sessionId} = req.params;

        //1. validate session ID
        if(!mongoose.Types.ObjectId.isValid(sessionId)) {
            return res.status(400).json({
                status : false,
                message : "Invalid counselling session ID",
            });
        }
        //2. Find session
        const session = await CounsellingSession.findById(sessionId);

        if(!session) {
            return res.status(404).json({
                status : false,
                message : "Counselling session not found"
            });
        }
        //3. check role permission
        if(role === "Student") {
            return res.status(403).json({
                status :false,
                message : "Students cannot start counselling sessions"
            });
        }
        if(role === "Counsellor" && session.counsellor.toString()!==userId){
            return res.status(403).json({
                status : false,
                message : "You can start only your assigned sessions"
            });
        }
        if(!["Admin", "SuperAdmin", "Counsellor"].includes(role)) {
            return res.status(403).json({
                status : false,
                message : "You are not authorized to start this session"
            })
        }
        //4. Check sessions status
        if(session.status != "in_progress") {
            return res.status(400).json({
                status : false,
                message : "Only in-progress sessions can be started"
            })
        }
        //5. check already started
        if(session.startedAt) {
            return res.status(400).json({
                status : false,
                message : "Counselling session alreday started"
            });
        }
        //6. start session
        session.startedAt = new Date();
        await session.save();

        return res.status(200).json({
            status : true,
            message : "Counselling session started successfully",
            session
        })
    }
    catch(error) {
        console.log("Start counselling session error :", error);
        return res.status(500).json({
            status : false,
            message : "Internal server error",
            error : error.message
        })
    }
}

const CompleteCounsellingSession = async(req,res)=>{
    try {
    const userId = req.user.userId;
    const role = req.user.role;
console.log("Logged-in User ID:", userId);
console.log("Logged-in User Role:", role);
    const {sessionId} = req.params;
    const {outcome} = req.body;

    if(!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
            status : false,
            message : "Invalid counselling session ID"
        })
    }


    const session = await CounsellingSession.findById(sessionId);

    if(!session) {
        return res.status(404).json({
            status : false,
        message : "Counselling session not found"
        })
    }

    if(role !== "Counsellor") {
        return res.status(403).json({
            status : false,
            message : "Only counsellor can complete the session"
        })
    }
      if(!session.counsellor.equals(userId)) {
        return res.status(403).json({
            status : false,
            message : "You are not authorized to complete the session"
        })
      }

    if(session.status === "completed") {
        return res.status(400).json({
            status : false,
            message : "Counselling session is already completed"
        })
    }
    if(!session.startedAt) {
        return res.status(400).json({
             status : false,
             message : "Counselling session has not started yet"
        })
    }
    const allowedOutcomes = [
    "counselling_completed",
    "follow_up_required",
    "recommendations_needed",
    "student_unreachable",
    "student_not_interested"
];

if(!outcome || !allowedOutcomes.includes(outcome)) {
    return res.status(400).json({
        status : false,
        message : "Please provide a valid counselling session outcome",
    })
}

const endedAt = new Date();
const durationMinutes = Math.floor((endedAt-session.startedAt)/60000);
  session.endedAt = endedAt;
  session.durationMinutes = durationMinutes;
  session.outcome = outcome;
  session.status = "completed";

  await session.save();

  return res.status(200).json({
    status : true,
    message : "Counselling session completed successfully",
    session
  })
    }catch(error) {
        console.log("Complete counselling session error:",error);
        return res.status(500).json({
            status : false,
            message : "Internal server error",
            error : error.message
        })
    }
    
}

module.exports = {
    createCounsellingSession,
    GetAllCounsellingSession,
    GetSingleCounsellingSession,
      StartCounsellingSession,
      CompleteCounsellingSession
}