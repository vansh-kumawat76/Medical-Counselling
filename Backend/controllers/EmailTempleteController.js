
const EmailTemplate = require("../models/EmailTemplate");

async function createEmailTemplates(req, res) {
  const { title, slug, subject, content, status } = req.body;

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
      message: "The email template has been created successfully.",
      data: emailTemplate,
    });
  } catch (error) {
    console.error("Create Email Template Error:", error);

    return res.status(500).json({
      status: false,
      message:
        error.code === 11000
          ? "An email template with this slug already exists."
          : "Unable to create the email template. Please try again later.",
    });
  }
}

async function getAllEmailTemplates(req, res) {
  try {
    const emailTemplates = await EmailTemplate.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      status: true,
      message: "Email templates have been retrieved successfully.",
      data: emailTemplates,
    });
  } catch (error) {
    console.log("Get Email Templates Error :", error);

    return res.status(500).json({
      status: false,
      message: "Unable to retrieve email templates. Please try again later.",
    });
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
        message: "The requested email template could not be found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The email template has been updated successfully.",
      data: emailTemplate,
    });
  } catch (error) {
    console.error("Update Email Template Error:", error);

    return res.status(500).json({
      status: false,
      message:
        error.code === 11000
          ? "An email template with this slug already exists."
          : "Unable to update the email template. Please try again later.",
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
        message: "The requested email template could not be found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The email template has been deleted successfully.",
      data: emailTemplate,
    });
  } catch (error) {
    console.error("Delete Email Template Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to delete the email template. Please try again later.",
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
        message: "The requested email template could not be found.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "The email template has been retrieved successfully.",
      data: emailTemplate,
    });
  } catch (error) {
    console.error("Get Email Template Error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to retrieve the email template. Please try again later.",
    });
  }
}

module.exports = {
  createEmailTemplates,
  getAllEmailTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplateById,
};
