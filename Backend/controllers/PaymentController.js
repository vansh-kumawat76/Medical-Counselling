
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Payment = require("../models/payment");

// CREATE RAZORPAY ORDER
exports.createOrder = async (req, res) => {
  try {
    const { planName } = req.body;

    const plans = {
      Silver: 999,
      Premium: 1999,
    };

    if (!plans[planName]) {
      return res.status(400).json({
        success: false,
        message: "Invalid or free plan selected",
      });
    }

    const amount = plans[planName] * 100;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    const payment = await Payment.create({
      user: req.user.userId,
      planName,
      amount,
      razorpayOrderId: order.id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,
      payment,
    });
  } catch (error) {
    console.log("Create Order Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// VERIFY RAZORPAY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user.userId,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.status === "paid") {
      return res.json({
        success: true,
        message: "Payment already verified",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const generated = Buffer.from(generatedSignature, "hex");

    const isValid =
      received.length === generated.length &&
      crypto.timingSafeEqual(received, generated);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const razorpayPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      razorpayPayment.order_id !== payment.razorpayOrderId ||
      razorpayPayment.amount !== payment.amount ||
      razorpayPayment.currency !== payment.currency ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or details do not match",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "paid";

    await payment.save();

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment,
    });
  } catch (error) {
    console.log("Verify Payment Error:", error);

    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
};
