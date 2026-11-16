
const express = require("express");
const router = express.Router();

const auth = require("../auth");

const {
  createOrder,
  verifyPayment,
  getMySubscription,
  activateFreePlan,
  getMyPaymentHistory,
  getMySubscriptionHistory,
} = require("../controllers/PaymentController");

router.post("/create-order", auth, createOrder);
router.post("/verify", auth, verifyPayment);
router.get("/my-subscription", auth, getMySubscription);
router.post("/activate-free-plan", auth, activateFreePlan);
router.get("/my-payment-history", auth, getMyPaymentHistory);
router.get("/my-subscription-history", auth, getMySubscriptionHistory);
module.exports = router;
