const express = require("express");
const router = express.Router();

const {
    createEmailTemplates,
    getAllEmailTemplates,
    updateEmailTemplate,
    deleteEmailTemplate,
    getEmailTemplateById
} = require("../controllers/EmailTempleteController");

router.post("/create", createEmailTemplates);
router.get("/all", getAllEmailTemplates);
router.put("/update/:id", updateEmailTemplate);
router.delete("/delete/:id", deleteEmailTemplate);
router.get("/:id", getEmailTemplateById);
module.exports = router;