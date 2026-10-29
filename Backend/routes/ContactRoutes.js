const express = require("express");
const { ContactController, GetAllContacts } = require("../controllers/ContactController");
const router = express.Router();

router.post("/contact", ContactController);
router.get("/get-contacts", GetAllContacts)
module.exports = router;