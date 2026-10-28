"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const enquiryTypes = [
  "Medical Counselling & Admissions",
  "NEET / MBBS / BDS Guidance",
  "College & University Information",
  "Technical Support",
  "General Enquiry",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/15";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const contactData = Object.fromEntries(formData.entries());

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "http://localhost:8090/contact",
        contactData
      );

      if (response.data.status) {
        toast.success("Enquiry submitted successfully!");
        setSubmitted(true);
      } else {
        toast.error(
          response.data.message || "Failed to submit enquiry."
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Failed to submit enquiry."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#eef5fb] via-[#f5f8fc] to-[#e6f6f8] text-slate-800">
      <style jsx global>{`
        @keyframes contactFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes contactReveal {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes contactGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.08);
          }
        }

        .contact-float {
          animation: contactFloat 5s ease-in-out infinite;
        }

        .contact-reveal {
          animation: contactReveal 0.75s ease-out both;
        }

        .contact-delay {
          animation-delay: 0.15s;
        }

        .contact-glow {
          animation: contactGlow 6s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-float,
          .contact-reveal,
          .contact-glow {
            animation: none !important;
          }
        }
      `}</style>


      {/* Contact Form Section */}
      <section
        id="contact-form"
        className=" px-4 py-14 sm:px-8 sm:py-20 lg:px-12"
      >
        <div className="mx-auto max-w-3xl">
          {/* Section Heading */}
         

          <div className="contact-reveal contact-delay overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-30px_rgba(15,61,105,0.35)] lg:rounded-[2rem]">
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#103d69] via-cyan-600 to-[#087e8b]" />

            {/* Right Form Panel */}
            <div className="p-5 sm:p-9 lg:p-12">
              <div className="border-b border-slate-100">
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">
                  Send a message
                </p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#103d69] sm:text-3xl">
                  Send us an enquiry
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Fill in your details below. Fields marked with{" "}
                  <span className="font-bold text-rose-500">*</span>{" "}
                  are required.
                </p>
              </div>

              {submitted ? (
                <div
                  className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8"
                  role="status"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700 shadow-inner">
                    ✓
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold text-emerald-900">
                    Enquiry submitted successfully!
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-emerald-800">
                    Thank you for contacting us. Your request has
                    been accepted by the server.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
                  >
                    Submit another enquiry
                    <span>→</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2.5 block text-sm font-bold text-slate-700"
                      >
                        Full name{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        required
                        maxLength={100}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2.5 block text-sm font-bold text-slate-700"
                      >
                        Email address{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        maxLength={254}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2.5 block text-sm font-bold text-slate-700"
                      >
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Enter phone number"
                        maxLength={20}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="enquiryType"
                        className="mb-2.5 block text-sm font-bold text-slate-700"
                      >
                        Enquiry type{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="enquiryType"
                        name="enquiryType"
                        required
                        defaultValue=""
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="" disabled>
                          Select an enquiry
                        </option>
                        {enquiryTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2.5 block text-sm font-bold text-slate-700"
                    >
                      Subject{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      placeholder="What is your enquiry about?"
                      required
                      maxLength={150}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2.5 block text-sm font-bold text-slate-700"
                    >
                      Your message{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      required
                      minLength={10}
                      maxLength={3000}
                      className={`${inputClass} min-h-36 resize-y`}
                    />
                    <div className="mt-2 flex items-start gap-2 rounded-lg bg-cyan-50/70 px-3 py-2 text-xs leading-5 text-slate-500">
                      <span className="mt-px text-cyan-700">ⓘ</span>
                      <p>
                        Please do not include passwords or sensitive
                        medical records.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#103d69] to-[#087e8b] px-6 py-4 font-bold text-white shadow-lg shadow-cyan-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-900/25 focus:outline-none focus:ring-4 focus:ring-cyan-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isSubmitting ? "Submitting..." : "Submit enquiry"}
                    {!isSubmitting && (
                      <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    )}
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    Thank you for reaching out to our team.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
