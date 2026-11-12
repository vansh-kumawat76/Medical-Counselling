
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  createOrder,
  verifyPayment,
} = require("../controllers/PaymentController");

router.post("/create-order", auth, createOrder);
router.post("/verify", auth, verifyPayment);

module.exports = router;
