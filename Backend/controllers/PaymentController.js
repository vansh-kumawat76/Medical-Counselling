
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const Payment = require("../models/payment");
const CounsellingPlan = require("../models/CounsellingPlan");
const Subscription = require("../models/Subscription");
// CREATE RAZORPAY ORDER
exports.createOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }


    // CHECK EXISTING ACTIVE SUBSCRIPTION
    const existingSubscription = await Subscription.findOne({
      user: req.user.userId,
      status: "active",
      endDate: { $gte: new Date() },
    });

    if (existingSubscription) {
      const currentPlan = await CounsellingPlan.findById(
        existingSubscription.plan
      );

      // Block purchase if current subscription is already paid
      if (currentPlan && currentPlan.price > 0) {
        return res.status(409).json({
          success: false,
          message: "You already have an active paid subscription",
        });
      }
    }


    // FETCH PLAN FROM DATABASE
    const plan = await CounsellingPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or currently inactive",
      });
    }

    // FREE PLAN NOT ALLOWED FOR RAZORPAY
    if (plan.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Free plan does not require payment",
      });
    }

    // DATABASE PRICE IN RUPEES -> RAZORPAY AMOUNT IN PAISE
    const amount = Math.round(plan.price * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan price",
      });
    }

    // CREATE RAZORPAY ORDER
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // SAVE PAYMENT RECORD
    const payment = await Payment.create({
      user: req.user.userId,
      plan : plan._id,
      planName: plan.name,
      amount,
      currency: "INR",
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
  console.log("Verify payment function hit");
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


    // ACTIVATE STUDENT SUBSCRIPTION
    const existingSubscription = await Subscription.findOne({
      payment: payment._id,
    });

    if (!existingSubscription) {
      const plan = await CounsellingPlan.findById(payment.plan);

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Purchased plan not found",
        });
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationInDays);

      // Cancel previous active subscriptions
      await Subscription.updateMany(
        {
          user: payment.user,
          status: "active",
        },
        {
          $set: { status: "cancelled" },
        }
      );

      // Create new paid subscription
      await Subscription.create({
        user: payment.user,
        plan: plan._id,
        payment: payment._id,
        startDate,
        endDate,
        status: "active",
      });
    }

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



// GET LOGGED-IN STUDENT'S ACTIVE SUBSCRIPTION
exports.getMySubscription = async (req, res) => {
  try {
    // Mark expired subscriptions
    await Subscription.updateMany(
      {
        user: req.user.userId,
        status: "active",
        endDate: { $lt: new Date() },
      },
      {
        $set: { status: "expired" },
      }
    );

    const subscription = await Subscription.findOne({
      user: req.user.userId,
      status: "active",
      endDate: { $gte: new Date() },
    })
      .populate("plan")
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        hasSubscription: false,
        message: "No active subscription found",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      hasSubscription: true,
      data: subscription,
    });
  } catch (error) {
    console.log("Get My Subscription Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch subscription",
    });
  }
};



// ACTIVATE FREE COUNSELLING PLAN
exports.activateFreePlan = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    const plan = await CounsellingPlan.findOne({
      _id: planId,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive",
      });
    }

    if (plan.price > 0) {
      return res.status(400).json({
        success: false,
        message: "This is not a free plan",
      });
    }

    const existingSubscription = await Subscription.findOne({
      user: req.user.userId,
      status: "active",
      endDate: { $gte: new Date() },
    });

    if (existingSubscription) {
      return res.status(409).json({
        success: false,
        message: "You already have an active subscription",
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(
      endDate.getDate() + plan.durationInDays
    );

    const subscription = await Subscription.create({
      user: req.user.userId,
      plan: plan._id,
      payment: null,
      startDate,
      endDate,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Free plan activated successfully",
      data: subscription,
    });
  } catch (error) {
    console.log("Activate Free Plan Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to activate free plan",
    });
  }
};


// GET LOGGED-IN STUDENT'S PAYMENT HISTORY
exports.getMyPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({
      user: req.user.userId,
    })
      .select(
        "plan planName amount currency razorpayOrderId razorpayPaymentId status createdAt"
      )
      .populate("plan", "name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.log("Get Payment History Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch payment history",
    });
  }
};

// GET LOGGED-IN STUDENT'S SUBSCRIPTION HISTORY


exports.getMySubscriptionHistory = async (req, res) => {
  try {
    // Mark expired subscriptions before fetching history
    await Subscription.updateMany(
      {
        user: req.user.userId,
        status: "active",
        endDate: { $lt: new Date() },
      },
      {
        $set: { status: "expired" },
      }
    );

    const subscriptions = await Subscription.find({
      user: req.user.userId,
    })
      .populate("plan", "name price durationInDays")
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      data: subscriptions,
    });
  } catch (error) {
    console.log("Get Subscription History Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch subscription history",
    });
  }
};

