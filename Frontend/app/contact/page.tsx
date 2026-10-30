
"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiMessageSquare,
  FiInfo,
  FiCheckCircle,
  FiSend,
  FiArrowRight,
} from "react-icons/fi";

const enquiryTypes = [
  "Medical Counselling & Admissions",
  "NEET / MBBS / BDS Guidance",
  "College & University Information",
  "Technical Support",
  "General Enquiry",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-cyan-300 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/15";

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#eef5fb] via-[#f5f8fc] to-[#e6f6f8] text-slate-800">

      {/* Background Decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 12, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl"
        />

        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -12, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-24 bottom-20 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
        />
      </div>

      {/* Contact Form Section */}
      <section
        id="contact-form"
        className="relative px-4 py-14 sm:px-8 sm:py-20 lg:px-12"
      >
        <div className="mx-auto max-w-3xl">

          {/* Section Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-10 text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm">
              <FiMessageSquare />
              Contact Us
            </span>

          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 45, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              ease: "easeOut",
            }}
            whileHover={{
              boxShadow: "0 35px 100px -35px rgba(15,61,105,0.4)",
            }}
            className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_30px_90px_-30px_rgba(15,61,105,0.35)] lg:rounded-[2rem]"
          >
            {/* Top Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#103d69] via-cyan-600 to-[#087e8b]" />

            {/* Form Panel */}
            <div className="p-5 sm:p-9 lg:p-12">

              {/* Form Heading */}
              <div className="border-b border-slate-100 pb-6">
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyan-700">
                  <FiSend />
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

              {/* Success / Form Animation */}
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 25, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 sm:p-8"
                    role="status"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 12,
                        delay: 0.2,
                      }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl text-emerald-700 shadow-inner"
                    >
                      <FiCheckCircle />
                    </motion.div>

                    <h3 className="mt-5 text-xl font-extrabold text-emerald-900">
                      Enquiry submitted successfully!
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-emerald-800">
                      Thank you for contacting us. Your request has
                      been accepted by the server.
                    </p>

                    <motion.button
                      type="button"
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSubmitted(false)}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/10 transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20"
                    >
                      Submit another enquiry
                      <FiArrowRight />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="contact-form"
                    onSubmit={handleSubmit}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.08,
                          delayChildren: 0.15,
                        },
                      },
                    }}
                    className="mt-7 space-y-6"
                  >
                    {/* Name and Email */}
                    <div className="grid gap-5 sm:grid-cols-2">

                      <motion.div variants={fieldVariants}>
                        <label
                          htmlFor="name"
                          className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                        >
                          <FiUser className="text-cyan-700" />
                          Full name
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
                      </motion.div>

                      <motion.div variants={fieldVariants}>
                        <label
                          htmlFor="email"
                          className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                        >
                          <FiMail className="text-cyan-700" />
                          Email address
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
                      </motion.div>

                    </div>

                    {/* Phone and Enquiry Type */}
                    <div className="grid gap-5 sm:grid-cols-2">

                      <motion.div variants={fieldVariants}>
                        <label
                          htmlFor="phone"
                          className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                        >
                          <FiPhone className="text-cyan-700" />
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
                      </motion.div>

                      <motion.div variants={fieldVariants}>
                        <label
                          htmlFor="enquiryType"
                          className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                        >
                          <FiMessageSquare className="text-cyan-700" />
                          Enquiry type
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
                      </motion.div>

                    </div>

                    {/* Subject */}
                    <motion.div variants={fieldVariants}>
                      <label
                        htmlFor="subject"
                        className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                      >
                        <FiFileText className="text-cyan-700" />
                        Subject
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
                    </motion.div>

                    {/* Message */}
                    <motion.div variants={fieldVariants}>
                      <label
                        htmlFor="message"
                        className="mb-2.5 flex items-center gap-2 text-sm font-bold text-slate-700"
                      >
                        <FiMessageSquare className="text-cyan-700" />
                        Your message
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
                        <FiInfo className="mt-0.5 shrink-0 text-cyan-700" />
                        <p>
                          Please do not include passwords or sensitive
                          medical records.
                        </p>
                      </div>
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={fieldVariants}>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={
                          !isSubmitting
                            ? { y: -3, scale: 1.01 }
                            : {}
                        }
                        whileTap={
                          !isSubmitting
                            ? { scale: 0.98 }
                            : {}
                        }
                        className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#103d69] to-[#087e8b] px-6 py-4 font-bold text-white shadow-lg shadow-cyan-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-900/25 focus:outline-none focus:ring-4 focus:ring-cyan-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : "Submit enquiry"}

                        {!isSubmitting && (
                          <FiArrowRight className="text-xl transition-transform duration-300 group-hover:translate-x-1" />
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.p
                      variants={fieldVariants}
                      className="text-center text-xs leading-5 text-slate-400"
                    >
                      Thank you for reaching out to our team.
                    </motion.p>

                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
