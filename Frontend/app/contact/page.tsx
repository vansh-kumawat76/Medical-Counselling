"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SplitText } from "gsap/SplitText";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiMessageSquare,
  FiCheck,
  FiSend,
  FiArrowRight,
  FiLock,
  FiLoader,
  FiChevronRight,
  FiHome,
} from "react-icons/fi";

gsap.registerPlugin(useGSAP, SplitText);

const enquiryTypes = [
  "Medical Counselling & Admissions",
  "NEET / MBBS / BDS Guidance",
  "College & University Information",
  "Technical Support",
  "General Enquiry",
];

const labelClass =
  "mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-600";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-sky-300 focus:border-sky-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]";

const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ───────── Text animation helpers ───────── */

function AnimatedHeading({
  text,
  delay = 0.2,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const letters = Array.from(text);
  const n = letters.length;

  return (
    <span
      className={`inline-block [perspective:700px] ${className}`}
      aria-label={text}
    >
      {letters.map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ opacity: 0, y: 60, rotateX: -90, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.7,
            delay: delay + i * 0.07,
            ease: [0.2, 0.8, 0.2, 1],
          }}
          whileHover={{ y: -10, scale: 1.12 }}
          className="inline-block cursor-default"
          style={{
            backgroundImage:
              "linear-gradient(90deg,#0f172a,#0284c7,#38bdf8)",
            backgroundSize: `${n * 100}% 100%`,
            backgroundPosition: `${(i / (n - 1)) * 100}% 0`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {char === " " ? " " : char}
        </motion.span>
      ))}
    </span>
  );
}

function WordReveal({
  text,
  delay = 0,
  stagger = 0.045,
  className = "",
}: {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i}>
          <motion.span
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.5, delay: delay + i * stagger }}
            className="inline-block"
          >
            {word}
          </motion.span>{" "}
        </span>
      ))}
    </span>
  );
}

function GsapLines({
  text,
  delay = 1,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.set(el, { visibility: "visible" });

      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            opacity: 0,
            rotateX: -35,
            transformOrigin: "50% 100%",
            duration: 1.1,
            ease: "power4.out",
            stagger: 0.18,
            delay,
          }),
      });
    },
    { scope: ref }
  );

  return (
    <p ref={ref} className={`invisible ${className}`}>
      {text}
    </p>
  );
}

function useTypewriter(
  words: string[],
  typingMs = 55,
  deletingMs = 28,
  pauseMs = 1600
) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (!deleting && text === word) {
      timer = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    } else {
      timer = setTimeout(
        () => setText(word.slice(0, text.length + (deleting ? -1 : 1))),
        deleting ? deletingMs : typingMs
      );
    }

    return () => clearTimeout(timer);
  }, [text, deleting, index, words, typingMs, deletingMs, pauseMs]);

  return text;
}

export default function ContactPage() {
  const typedType = useTypewriter(enquiryTypes);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

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
        setMessageLength(0);
      } else {
        toast.error(response.data.message || "Failed to submit enquiry.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to submit enquiry."
        );
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#f4faff] text-slate-800">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-200/50 blur-[100px]" />
        <div className="absolute -right-40 top-40 h-[500px] w-[500px] rounded-full bg-blue-100/70 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-cyan-100/60 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.025)_1px,transparent_1px)] bg-[size:45px_45px]" />
      </div>

      {/* Breadcrumb */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-7 sm:px-8 lg:px-12">
        <motion.nav
          aria-label="Breadcrumb"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-medium text-slate-500 shadow-sm backdrop-blur"
        >
          <a
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-sky-600"
          >
            <FiHome className="text-sm" />
            Home
          </a>
          <FiChevronRight className="text-slate-400" />
          <span className="font-semibold text-sky-600">Contact Us</span>
        </motion.nav>
      </div>

      {/* Main Contact Section */}
      <section className="relative px-5 pb-16 pt-10 sm:px-8 sm:pb-24 sm:pt-14 lg:px-12 lg:pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">

          {/* Left Content */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-600" />
              </span>
              MBBS Counselling
            </motion.div>

            <motion.h1
              animate={{
                filter: [
                  "drop-shadow(0 0 0px rgba(14,165,233,0))",
                  "drop-shadow(0 8px 22px rgba(14,165,233,0.12))",
                  "drop-shadow(0 0 0px rgba(14,165,233,0))",
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="mt-7 text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
            >
              <AnimatedHeading text="Contact Us" delay={0.25} />
            </motion.h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="mt-6 h-1.5 w-24 origin-left rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
            />

            <GsapLines
              text="Have questions about medical admissions, counselling or colleges? We are here to guide you at every step of your journey. Reach out to our expert team and get the support you need."
              delay={1}
              className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg"
            />

            {/* Typewriter */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.2 }}
              className="mt-5 flex min-h-7 flex-wrap items-center gap-x-2 text-sm text-slate-500 sm:text-base"
              aria-live="off"
            >
              <span>We can help with</span>
              <span className="font-bold text-sky-700">
                {typedType}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-sky-600 align-baseline"
                />
              </span>
            </motion.p>

            {/* Support Features */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                {
                  title: "Expert Guidance",
                  description: "Get the right admission advice",
                  icon: <FiUser />,
                },
                {
                  title: "Trusted Support",
                  description: "Guidance you can rely on",
                  icon: <FiCheck />,
                },
                {
                  title: "Quick Response",
                  description: "We are here to help you",
                  icon: <FiMessageSquare />,
                },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 + index * 0.15 }}
                  whileHover={{ y: -5 }}
                  className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-[0_8px_30px_rgba(14,165,233,0.05)] backdrop-blur"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-lg text-sky-700">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Decorative Medical Icon */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-2 top-0 hidden h-24 w-24 items-center justify-center rounded-[2rem] border border-sky-100 bg-white/70 text-5xl font-light text-sky-200 shadow-xl shadow-sky-100/50 backdrop-blur sm:flex lg:-right-8 lg:top-20"
            >
              +
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8, duration: 0.7 }}
              className="mt-10 font-serif text-xl italic text-sky-700 sm:text-2xl"
            >
              Your Future, Our Priority.
            </motion.p>
          </div>

          {/* Right Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 45, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-sky-200/70 via-white to-cyan-100/70 blur-xl" />

            <div className="relative rounded-[1.7rem] border border-white bg-white p-5 shadow-[0_25px_80px_-25px_rgba(14,116,184,0.2)] sm:p-8 lg:p-9">
              {/* Form Heading */}
              <div className="border-b border-slate-100 pb-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-sky-700">
                  <FiSend />
                  Send a message
                </span>

                <motion.h2
                  initial={{ opacity: 0, x: -24 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    backgroundPosition: ["0% 0%", "200% 0%"],
                  }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.5 },
                    x: { duration: 0.6, delay: 0.5 },
                    backgroundPosition: {
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  className="mt-4 bg-[linear-gradient(90deg,#0f172a,#0284c7,#0f172a)] bg-[length:200%_100%] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl"
                >
                  Send us an enquiry
                </motion.h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  <WordReveal
                    text="Fill in your details below. Fields marked with"
                    delay={0.8}
                    stagger={0.05}
                  />
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [0, 1.6, 1] }}
                    transition={{ duration: 0.5, delay: 1.35 }}
                    className="inline-block px-1 font-bold text-red-500"
                  >
                    *
                  </motion.span>
                  <WordReveal text="are required." delay={1.4} stagger={0.05} />
                </p>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  /* Success Message */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 25, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                    role="status"
                    className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center sm:p-10"
                  >
                    <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                      <motion.span
                        animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                        className="absolute inset-0 rounded-full bg-emerald-400/40"
                      />

                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 12,
                          delay: 0.2,
                        }}
                        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 text-3xl text-emerald-600"
                      >
                        <FiCheck />
                      </motion.div>
                    </div>

                    <h3 className="mt-6 text-2xl font-bold text-slate-800">
                      <WordReveal
                        text="Enquiry submitted successfully!"
                        delay={0.35}
                        stagger={0.12}
                      />
                    </h3>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                      <WordReveal
                        text="Thank you for contacting us. Your request has been accepted by the server."
                        delay={0.9}
                        stagger={0.05}
                      />
                    </p>

                    <motion.button
                      type="button"
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSubmitted(false)}
                      className="mt-7 inline-flex items-center gap-2 rounded-xl border border-emerald-300 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                    >
                      Submit another enquiry
                      <FiArrowRight />
                    </motion.button>
                  </motion.div>
                ) : (
                  /* Contact Form */
                  <motion.form
                    key="contact-form"
                    onSubmit={handleSubmit}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
                      },
                    }}
                    className="mt-7 space-y-5"
                  >
                    {/* Name + Email + Phone */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <motion.div variants={fieldVariants}>
                        <label htmlFor="name" className={labelClass}>
                          <FiUser className="text-sm text-sky-600" />
                          Full name <span className="text-red-500">*</span>
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
                        <label htmlFor="email" className={labelClass}>
                          <FiMail className="text-sm text-sky-600" />
                          Email address <span className="text-red-500">*</span>
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

                      <motion.div variants={fieldVariants}>
                        <label htmlFor="phone" className={labelClass}>
                          <FiPhone className="text-sm text-sky-600" />
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
                    </div>

                    {/* Enquiry Type + Subject */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <motion.div variants={fieldVariants}>
                        <label htmlFor="enquiryType" className={labelClass}>
                          <FiMessageSquare className="text-sm text-sky-600" />
                          Enquiry type <span className="text-red-500">*</span>
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

                      <motion.div variants={fieldVariants}>
                        <label htmlFor="subject" className={labelClass}>
                          <FiFileText className="text-sm text-sky-600" />
                          Subject <span className="text-red-500">*</span>
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
                    </div>

                    {/* Message */}
                    <motion.div variants={fieldVariants}>
                      <label htmlFor="message" className={labelClass}>
                        <FiMessageSquare className="text-sm text-sky-600" />
                        Your message <span className="text-red-500">*</span>

                        <span
                          className={`ml-auto tabular-nums transition-colors ${
                            messageLength > 2700
                              ? "text-red-500"
                              : "text-slate-400"
                          }`}
                        >
                          {messageLength}/3000
                        </span>
                      </label>

                      <textarea
                        id="message"
                        name="message"
                        rows={5}
                        placeholder="Tell us how we can help you..."
                        required
                        minLength={10}
                        maxLength={3000}
                        onChange={(e) => setMessageLength(e.target.value.length)}
                        className={`${inputClass} min-h-36 resize-y`}
                      />
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={fieldVariants}>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={!isSubmitting ? { y: -3, scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-4 text-[15px] font-bold text-white shadow-[0_10px_25px_rgba(14,165,233,0.25)] transition-all duration-300 hover:shadow-[0_14px_35px_rgba(14,165,233,0.35)] focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-md transition-all duration-700 group-hover:left-[120%]" />

                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin text-xl" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Send Enquiry
                            <FiArrowRight className="text-xl transition-transform duration-300 group-hover:translate-x-1.5" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>

                    {/* Security Notice */}
                    <motion.p
                      variants={fieldVariants}
                      className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-400"
                    >
                      <FiLock className="shrink-0 text-sky-600" />
                      Please do not include passwords or sensitive medical
                      records.
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