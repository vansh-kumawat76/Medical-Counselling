
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

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CounsellingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loading, setLoading] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);

      const response = await api.get("/plans/active");
      const data = response.data;

      const plansData = Array.isArray(data)
        ? data
        : data.plans ||
          data.data?.plans ||
          data.data ||
          [];

      setPlans(plansData);
    } catch (error: any) {
      console.error("Fetch plans error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load counselling plans."
      );
    } finally {
      setLoadingPlans(false);
    }
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
      toast.success("Free counselling plan selected successfully!");
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
        }
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
          try {
            const verifyResponse = await api.post(
              "/payment/verify",
              {
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,
                razorpay_signature:
                  paymentResponse.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (
              verifyResponse.data.success ||
              verifyResponse.data.status === "success"
            ) {
              toast.success(
                "Payment successful! Your plan is activated."
              );

              fetchPlans();
            } else {
              toast.error(
                verifyResponse.data.message ||
                  "Payment verification failed."
              );
            }
          } catch (error: any) {
            console.error("Verification error:", error);

            toast.error(
              error.response?.data?.message ||
                "Payment verification failed."
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
          response.error?.description ||
            "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to process payment."
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
            Get expert guidance and personalised support
            to make the right decisions for your future.
          </p>
        </div>

        {/* Loading */}
        {loadingPlans && (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          </div>
        )}

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
              const isSilver =
                plan.name.toLowerCase() === "silver";

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
                    <h2 className="text-2xl font-bold">
                      {plan.name}
                    </h2>

                    <p
                      className={`mt-3 min-h-12 text-sm leading-6 ${
                        isSilver
                          ? "text-violet-200"
                          : "text-slate-500"
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
                            isSilver
                              ? "text-violet-200"
                              : "text-slate-400"
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
                        isSilver
                          ? "text-violet-100"
                          : "text-slate-700"
                      }`}
                    >
                      What's Included
                    </h3>

                    <ul className="space-y-4">
                      {plan.features?.map((feature, index) => (
                        <li
                          key={index}
                          className={`flex items-start gap-3 text-sm ${
                            isSilver
                              ? "text-violet-100"
                              : "text-slate-600"
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
                      : plan.price === 0
                      ? "Select Free Plan"
                      : "Get Started"}
                  </button>

                </div>
              );
            })}

          </div>
        )}

        {/* Bottom Note */}
        {!loadingPlans && plans.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-slate-500">
              Secure payments powered by Razorpay.
              Your payment details are protected.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
