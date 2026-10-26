const EmailTemplate = require("../models/EmailTemplate");

async function createEmailTemplates(req,res) {
    const {title,slug,subject,content,status} = req.body
    try {
    const emailTemplate = await EmailTemplate.create({
        title,
        slug,
        subject,
        content,
        status,
    });

    return res.status(201).json({
        status: true,
        message: "Email template created successfully",
        data: emailTemplate,
    });
} catch (error) {
    console.error("Create Email Template Error:", error);

    return res.status(500).json({
        status: false,
        message: error.code === 11000
            ? "Email template slug already exists"
            : "Failed to create email template",
    });
}
}

async function getAllEmailTemplates(req,res) {
    try {
        const emailTemplates = await EmailTemplate.find().sort({
            createdAt : -1,
        })
        return res.status(200).json({
            status : true,
            message : "Email templates fetched successfully",
            data : emailTemplates,
        })
    }
    catch(error) {
        console.log("Get Email Templates Error :", error);

        return res.status(500).json({
            status : false,
            message : "Failed to fetch email templates"
        })
    }
}

async function updateEmailTemplate(req, res) {
    try {
        const { id } = req.params;
        const { title, slug, subject, content, status } = req.body;

        const emailTemplate = await EmailTemplate.findByIdAndUpdate(
            id,
            { title, slug, subject, content, status },
            { new: true, runValidators: true }
        );

        if (!emailTemplate) {
            return res.status(404).json({
                status: false,
                message: "Email template not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Email template updated successfully",
            data: emailTemplate,
        });
    } catch (error) {
        console.error("Update Email Template Error:", error);

        return res.status(500).json({
            status: false,
            message: error.code === 11000
                ? "Email template slug already exists"
                : "Failed to update email template",
        });
    }
}

async function deleteEmailTemplate(req, res) {
    try {
        const { id } = req.params;

        const emailTemplate = await EmailTemplate.findByIdAndDelete(id);

        if (!emailTemplate) {
            return res.status(404).json({
                status: false,
                message: "Email template not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Email template deleted successfully",
            data: emailTemplate,
        });
    } catch (error) {
        console.error("Delete Email Template Error:", error);

        return res.status(500).json({
            status: false,
            message: "Failed to delete email template",
        });
    }
}

async function getEmailTemplateById(req, res) {
    try {
        const { id } = req.params;

        const emailTemplate = await EmailTemplate.findById(id);

        if (!emailTemplate) {
            return res.status(404).json({
                status: false,
                message: "Email template not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Email template fetched successfully",
            data: emailTemplate,
        });
    } catch (error) {
        console.error("Get Email Template Error:", error);

        return res.status(500).json({
            status: false,
            message: "Failed to fetch email template",
        });
    }
}

module.exports = {
    createEmailTemplates,
    getAllEmailTemplates,
    updateEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplateById
}