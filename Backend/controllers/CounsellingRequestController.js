
const CounsellingRequest = require("../models/CounsellingRequest");
const User = require("../models/User");
const crypto = require("crypto");

// CREATE COUNSELLING REQUEST
async function CounsellingRequestController(req, res) {
    try {
        const requestNumber = `CR-${crypto.randomUUID()}`;

        console.log("Request Number:", requestNumber);

        const studentId = req.user.userId;

        console.log("Student ID:", studentId);

        const newRequest = new CounsellingRequest({
            ...req.body,
            requestNumber,
            student: studentId
        });

        const saveRequest = await newRequest.save();

        console.log("Saved Request:", saveRequest);

        return res.status(201).json({
            success: true,
            message: "Counselling request created successfully",
            data: saveRequest
        });

    } catch (error) {
        console.log("Counselling Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create counselling request",
            error: error.message
        });
    }
}


// GET COUNSELLING REQUEST
async function GetCounsellingRequestController(req, res) {
    try {
        const studentId = req.user.userId;
        const role = req.user.role;

        console.log("Logged in User ID:", studentId);
        console.log("Logged in Role:", role);

        console.log("Student ID:", studentId);
        console.log("Role:", role);

        let requests;

        if (role === "Student") {
            requests = await CounsellingRequest.find({
                student: studentId
            }).populate("student", "name email").populate("assignedTo", "name email");
        }
        else if (role === "Counsellor") {
            console.log("Counsellor ID:", studentId);
    requests = await CounsellingRequest.find({
        assignedTo: studentId
    })
    .populate("student", "name email")
    .populate("assignedTo", "name email");
}
        else if (role === "Admin" || role === "SuperAdmin") {
            requests = await CounsellingRequest.find()
            .populate("student", "name email")
            .populate("assignedTo", "name email");
        }
        else {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view counselling requests"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Counselling requests fetched successfully",
            total: requests.length,
            data: requests
        });

    } catch (error) {
        console.log("Get Counselling Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch counselling requests",
            error: error.message
        });
    }
}


// ASSIGN COUNSELLING REQUEST
async function AssigendToController(req, res) {
    try {

        const role = req.user.role;

console.log("Logged in User Role:", role);

if (role !== "Admin" && role !== "SuperAdmin") {
    return res.status(403).json({
        success: false,
        message: "Only Admin or SuperAdmin can assign counselling requests"
    });
}

        console.log("Request Body:", req.body);

        const { requestId, counsellorId } = req.body;

        console.log("Request ID:", requestId);
        console.log("Counsellor ID:", counsellorId);

        // Find counselling request
        const request = await CounsellingRequest.findById(requestId);

        console.log("Found Request:", request);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Counselling request not found"
            });
        }

        // Find counsellor
        const Counseller = await User.findById(counsellorId)
        .populate("role", "role");

        if (!Counseller) {
    return res.status(404).json({
        success: false,
        message: "Counsellor not found"
    });
}

if (!Counseller.role || Counseller.role.role !== "Counsellor") {
    return res.status(400).json({
        success: false,
        message: "Selected user is not a counsellor"
    });
}

        console.log("Found Counsellor:", Counseller);


        // Assign counsellor
        request.assignedTo = counsellorId;
        request.status = "assigned";

        await request.save();

        console.log("Updated Request:", request);

        return res.status(200).json({
            success: true,
            message: "Counselling request assigned successfully",
            data: request
        });

    } catch (error) {
        console.log("Assign Counselling Request Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign counselling request",
            error: error.message
        });
    }
}

async function UpdateCounsellingRequestStatus(req,res) {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        console.log("userID>>>>", userId);
        console.log("role>>>>>>>", role);

        const {requestId, status} = req.body;
        
        const allowedStatus = [
    "new",
    "assigned",
    "contact_pending",
    "in_progress",
    "recommendations_shared",
    "converted",
    "closed",
    "cancelled"
];

if (!allowedStatus.includes(status)) {
    return res.status(400).json({
        success: false,
        message: "Invalid counselling request status"
    });
}

        //Find Request
        const request = await CounsellingRequest.findById(requestId);
              if (!request) {
            return res.status(404).json({
                success: false,
                message: "Counselling request not found"
            });
        }
        // Check authorized user
        if(role === "Counsellor" && request.assignedTo?.toString() !== userId) {
            return res.status(403).json({
                success : false,
                message : "you can only update your assigned requests"
            })
        }
        if (
            role !== "Counsellor" &&
            role !== "Admin" &&
            role !== "SuperAdmin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update status"
            });
        }
        //Update status
        request.status = status;

        await request.save();

                return res.status(200).json({
            success: true,
            message: "Counselling request status updated successfully",
            data: request
        });

    }
    catch(error) {
       console.log("Update Status Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update counselling request status",
            error: error.message
        });

    }
}

module.exports = {
    CounsellingRequestController,
    GetCounsellingRequestController,
    AssigendToController,
    UpdateCounsellingRequestStatus
};
