"use client";

import React, { useEffect, useState } from "react";
import api from "../../src/lib/axios";
import { toast } from "react-toastify";

interface Plan {
  _id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

interface Subscription {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  plan: {
    _id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    durationInDays: number;
  };
}

interface SubscriptionHistory {
  _id: string;
  startDate: string;
  endDate: string;
  status: string;
  payment: string | null;
  plan: {
    _id: string;
    name: string;
    price: number;
    durationInDays: number;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CounsellingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionHistory, setSubscriptionHistory] = useState<
    SubscriptionHistory[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  useEffect(() => {
    fetchPlans();
    fetchMySubscription();
    fetchMySubscriptionHistory();
  }, []);

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);

      const response = await api.get("/plans/active");
      const data = response.data;

      const plansData = Array.isArray(data)
        ? data
        : data.plans || data.data?.plans || data.data || [];

      setPlans(plansData);
    } catch (error: any) {
      console.error("Fetch plans error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load counselling plans.",
      );
    } finally {
      setLoadingPlans(false);
    }
  };

  // Fetch Student Active Subscription
  const fetchMySubscription = async () => {
    try {
      setLoadingSubscription(true);

      const response = await api.get("/payment/my-subscription");

      if (response.data.success && response.data.hasSubscription) {
        setSubscription(response.data.data);
      } else {
        setSubscription(null);
      }
    } catch (error: any) {
      console.error("Fetch subscription error:", error);
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Fetch Student Subscription History
  const fetchMySubscriptionHistory = async () => {
    try {
      setLoadingHistory(true);

      const response = await api.get("/payment/my-subscription-history");

      if (response.data.success) {
        setSubscriptionHistory(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Fetch subscription history error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load subscription history.",
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculate Remaining Subscription Days
  const getRemainingDays = () => {
    if (!subscription?.endDate) return 0;

    const today = new Date();
    const expiryDate = new Date(subscription.endDate);

    const difference = expiryDate.getTime() - today.getTime();

    return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
  };

  // Load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  // Select Plan
  const handlePayment = async (plan: Plan) => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Your session has expired. Please login again.");
      return;
    }

    if (plan.price === 0) {
      try {
        setLoading(plan._id);

        const response = await api.post(
          "/payment/activate-free-plan",
          { planId: plan._id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          toast.success("Free plan activated successfully!");

          await fetchMySubscription();
          await fetchMySubscriptionHistory();
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Unable to activate free plan.",
        );
      } finally {
        setLoading("");
      }

      return;
    }

    await processPayment(plan, token);
  };

  // Payment Process
  const processPayment = async (plan: Plan, token: string) => {
    try {
      setLoading(plan._id);

      const isLoaded = await loadRazorpay();

      if (!isLoaded) {
        toast.error("Razorpay SDK failed to load.");
        return;
      }

      // Create Order
      const orderResponse = await api.post(
        "/payment/create-order",
        { planId: plan._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const orderData =
        orderResponse.data.order ||
        orderResponse.data.data?.order ||
        orderResponse.data;

      if (!orderData?.id) {
        toast.error("Unable to create payment order.");
        return;
      }

      const options = {
        key:
          orderResponse.data.key ||
          orderResponse.data.data?.key ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: orderData.amount,
        currency: orderData.currency || "INR",

        name: "Counselling Services",
        description: `${plan.name} Counselling Plan`,
        order_id: orderData.id,

        handler: async (paymentResponse: any) => {
          console.log("RAZORPAY SUCCESS RESPONSE:", paymentResponse);

          try {
            console.log("VERIFY API CALL STARTED");

            const verifyResponse = await api.post(
              "/payment/verify",
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (
              verifyResponse.data.success ||
              verifyResponse.data.status === "success"
            ) {
              toast.success("Payment successful! Your plan is activated.");

              fetchPlans();
              await fetchMySubscription();
              await fetchMySubscriptionHistory();
            } else {
              toast.error(
                verifyResponse.data.message || "Payment verification failed.",
              );
            }
          } catch (error: any) {
            console.error("Verification error:", error);

            toast.error(
              error.response?.data?.message || "Payment verification failed.",
            );
          }
        },

        prefill: {
          name: "",
          email: "",
          contact: "",
        },

        theme: {
          color: "#7c3aed",
        },

        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);

        toast.error(
          response.error?.description || "Payment failed. Please try again.",
        );
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);

      toast.error(
        error.response?.data?.message || "Unable to process payment.",
      );
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-violet-600">
            Counselling Plans
          </p>

          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
            Choose Your Perfect Plan
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Get expert guidance and personalised support to make the right
            decisions for your future.
          </p>
        </div>

        {/* Loading */}
        {loadingPlans && (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        )}

        {/* Active Subscription */}
        {!loadingSubscription && subscription && (
          <div className="mb-10 rounded-2xl border border-emerald-200 bg-white p-6 shadow-md sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ACTIVE SUBSCRIPTION
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  {subscription.plan.name}
                </h2>

                <p className="mt-2 text-slate-500">
                  ₹{subscription.plan.price.toLocaleString("en-IN")} / plan
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Remaining Days
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      getRemainingDays() <= 7
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {getRemainingDays()} Days Left
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Start Date
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {new Date(subscription.startDate).toLocaleDateString(
                      "en-IN",
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Expiry Date
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {new Date(subscription.endDate).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription History */}
        <div className="mb-12 mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Subscription History
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              View all your current and previous counselling plans.
            </p>
          </div>

          {loadingHistory ? (
            <div className="flex min-h-32 items-center justify-center rounded-2xl bg-white">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            </div>
          ) : subscriptionHistory.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="font-semibold text-slate-700">
                No Subscription History Found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Your subscription records will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptionHistory.map((item) => {
                const isExpired = new Date(item.endDate).getTime() < Date.now();

                const displayStatus =
                  item.status === "active" && isExpired
                    ? "Expired"
                    : item.status;

                const statusStyle =
                  displayStatus === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : displayStatus === "cancelled"
                      ? "bg-red-50 text-red-700"
                      : displayStatus === "Expired" ||
                          displayStatus === "expired"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600";

                return (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            {item.plan?.name || "Counselling Plan"}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle}`}
                          >
                            {displayStatus}
                          </span>
                        </div>

                        <p className="text-xl font-extrabold text-violet-700">
                          ₹{(item.plan?.price || 0).toLocaleString("en-IN")}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.plan?.durationInDays || 0} Days Plan
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:min-w-64">
                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Start Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {new Date(item.startDate).toLocaleDateString(
                              "en-IN",
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-slate-400">
                            Expiry Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {new Date(item.endDate).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty Plans */}
        {!loadingPlans && plans.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No Counselling Plans Available
            </h2>

            <p className="mt-3 text-slate-500">
              Please check back later for available plans.
            </p>
          </div>
        )}

        {/* Plans */}
        {!loadingPlans && plans.length > 0 && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isSilver = plan.name.toLowerCase() === "silver";

              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col rounded-2xl border p-7 transition duration-300 hover:-translate-y-2 ${
                    isSilver
                      ? "border-violet-500 bg-gradient-to-b from-violet-950 to-slate-900 text-white shadow-xl shadow-violet-950/30"
                      : "border-slate-200 bg-white text-slate-900 shadow-md hover:border-violet-300"
                  }`}
                >
                  {/* Silver Badge */}
                  {isSilver && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                      Most Popular
                    </div>
                  )}

                  {/* Plan Name */}
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold">{plan.name}</h2>

                    <p
                      className={`mt-3 min-h-12 text-sm leading-6 ${
                        isSilver ? "text-violet-200" : "text-slate-500"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-7">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>

                      {plan.price > 0 && (
                        <span
                          className={`mb-1 text-sm ${
                            isSilver ? "text-violet-200" : "text-slate-400"
                          }`}
                        >
                          / plan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-1">
                    <h3
                      className={`mb-4 text-sm font-semibold ${
                        isSilver ? "text-violet-100" : "text-slate-700"
                      }`}
                    >
                      What's Included
                    </h3>

                    <ul className="space-y-4">
                      {plan.features?.map((feature, index) => (
                        <li
                          key={index}
                          className={`flex items-start gap-3 text-sm ${
                            isSilver ? "text-violet-100" : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                              isSilver
                                ? "bg-violet-500/20 text-violet-300"
                                : "bg-emerald-50 text-emerald-600"
                            }`}
                          >
                            ✓
                          </span>

                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button */}

                  {/* Button */}

                  {/* Button */}
                  {subscription && subscription.plan._id === plan._id ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-emerald-100 px-5 py-3.5 text-sm font-bold text-emerald-700"
                    >
                      ✓ Current Active Plan
                    </button>
                  ) : subscription &&
                    !(subscription.plan.price === 0 && plan.price > 0) ? (
                    <button
                      disabled
                      className="w-full cursor-not-allowed rounded-xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-400"
                    >
                      Subscription Already Active
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePayment(plan)}
                      disabled={loading !== ""}
                      className={`w-full rounded-xl px-5 py-3.5 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSilver
                          ? "bg-violet-600 text-white hover:bg-violet-700"
                          : "bg-slate-100 text-slate-900 hover:bg-violet-100"
                      }`}
                    >
                      {loading === plan._id
                        ? "Processing..."
                        : subscription &&
                            subscription.plan.price === 0 &&
                            plan.price > 0
                          ? "Upgrade Plan"
                          : plan.price === 0
                            ? "Select Free Plan"
                            : "Get Started"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Note */}
        {!loadingPlans && plans.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Secure payments powered by Razorpay. Your payment details are
              protected.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
