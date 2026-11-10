"use client";

import React from "react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Basic counselling support",
    features: [
      "Basic counselling guidance",
      "Limited support",
      "General admission information",
    ],
    button: "Get Started",
    cardStyle: "bg-white border-gray-200",
    buttonStyle: "border border-gray-400 text-gray-700 hover:bg-gray-100",
  },
  {
    name: "Silver",
    price: "₹999",
    description: "Personalized counselling support",
    features: [
      "Personalized counselling",
      "College and course guidance",
      "Admission assistance",
      "Priority support",
    ],
    button: "Choose Silver",
    popular: true,
    cardStyle:
      "bg-gradient-to-br from-slate-50 via-gray-200 to-slate-300 border-slate-400",
    buttonStyle: "bg-slate-600 text-white hover:bg-slate-700",
  },
  {
    name: "Premium",
    price: "₹1,999",
    description: "Complete counselling experience",
    features: [
      "One-to-one counselling",
      "Personalized college selection",
      "Complete admission guidance",
      "Priority counsellor support",
      "Follow-up assistance",
    ],
    button: "Choose Premium",
    cardStyle:
      "bg-gradient-to-br from-yellow-50 via-amber-200 to-yellow-400 border-amber-500",
    buttonStyle: "bg-amber-700 text-white hover:bg-amber-800",
  },
];

export default function CounsellingPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Choose Your Counselling Plan
          </h1>
          <p className="mt-3 text-gray-600">
            Select the right plan to start your educational journey.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 shadow-md transition duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.cardStyle}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-700 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              )}

              <h2 className="text-2xl font-bold text-gray-900">
                {plan.name}
              </h2>

              <p className="mt-2 text-sm text-gray-700">
                {plan.description}
              </p>

              <div className="my-6">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-700"> / plan</span>
              </div>

              <button
                type="button"
                className={`w-full rounded-lg px-5 py-3 font-semibold transition ${plan.buttonStyle}`}
              >
                {plan.button}
              </button>

              <div className="mt-8">
                <h3 className="mb-4 font-semibold text-gray-900">
                  What's included:
                </h3>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-gray-800"
                    >
                      <span className="font-bold text-green-700">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}