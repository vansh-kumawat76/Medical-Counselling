"use client";

import { useEffect, useState, type FormEvent } from "react";
import api from "@/src/lib/axios";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

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
  FiGrid,
  FiChevronDown,
  FiAward,
  FiHeart,
  FiHeadphones,
  FiActivity,
  FiPlus,
} from "react-icons/fi";

/*
  OPTIONAL: agar tumhare paas real images hain to unko /public me daal ke
  yaha path de do (e.g. "/contact/stethoscope.png", "/contact/building.png").
  Khali chhodoge to neeche ka built-in SVG/CSS design use hoga.
*/
const STETHOSCOPE_IMAGE = "";
const BUILDING_IMAGE = "";

const enquiryTypes = [
  "Medical Counselling & Admissions",
  "NEET / MBBS / BDS Guidance",
  "College & University Information",
  "Technical Support",
  "General Enquiry",
];

const features = [
  { icon: FiAward, label: "Expert\nGuidance" },
  { icon: FiHeart, label: "Trusted\nSupport" },
  { icon: FiHeadphones, label: "Quick\nResponse" },
];

const fieldWrap = "relative";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-[#1e3a8a]";

const inputClass =
  "w-full rounded-lg border border-white bg-white/90 py-3 pl-10 pr-4 text-sm font-medium text-slate-700 shadow-[0_2px_8px_rgba(30,58,138,0.08)] outline-none transition-all duration-300 placeholder:font-medium placeholder:text-slate-500 hover:border-blue-200 focus:border-blue-500 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18)]";

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ───────── Helpers ───────── */

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
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
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

function Stethoscope({ className = "" }: { className?: string }) {
  if (STETHOSCOPE_IMAGE) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={STETHOSCOPE_IMAGE} alt="" className={className} />;
  }

  return (
    <svg viewBox="0 0 240 380" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="steth-tube" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1b4a" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <radialGradient id="steth-metal" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
        <linearGradient id="steth-pipe" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      {/* ear tips */}
      <circle cx="58" cy="16" r="10" fill="#cbd5e1" />
      <circle cx="182" cy="16" r="10" fill="#cbd5e1" />
      {/* metal ear tubes */}
      <path d="M58 26 L58 70" stroke="url(#steth-pipe)" strokeWidth="8" strokeLinecap="round" />
      <path d="M182 26 L182 70" stroke="url(#steth-pipe)" strokeWidth="8" strokeLinecap="round" />
      {/* tubes */}
      <path d="M58 68 C58 150 120 160 120 215" stroke="url(#steth-tube)" strokeWidth="11" strokeLinecap="round" />
      <path d="M182 68 C182 150 120 160 120 215" stroke="url(#steth-tube)" strokeWidth="11" strokeLinecap="round" />
      <path d="M120 215 C120 300 52 290 52 322" stroke="url(#steth-tube)" strokeWidth="11" strokeLinecap="round" />
      {/* chest piece */}
      <circle cx="52" cy="338" r="38" fill="#1e3a8a" />
      <circle cx="52" cy="338" r="30" fill="url(#steth-metal)" />
      <circle cx="52" cy="338" r="17" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
    </svg>
  );
}

function BuildingBackdrop({ className = "" }: { className?: string }) {
  if (BUILDING_IMAGE) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={BUILDING_IMAGE} alt="" className={className} />;
  }

  return (
    <svg viewBox="0 0 600 260" fill="none" className={className} aria-hidden="true" preserveAspectRatio="xMaxYMax meet">
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93b4ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c9dafc" stopOpacity="0.15" />
        </linearGradient>
        <pattern id="win" width="22" height="22" patternUnits="userSpaceOnUse">
          <rect x="4" y="5" width="12" height="11" rx="1.5" fill="#ffffff" fillOpacity="0.55" />
        </pattern>
      </defs>
      <rect x="40" y="90" width="150" height="170" fill="url(#bld)" />
      <rect x="40" y="90" width="150" height="170" fill="url(#win)" />
      <rect x="200" y="30" width="210" height="230" fill="url(#bld)" />
      <rect x="200" y="30" width="210" height="230" fill="url(#win)" />
      <rect x="420" y="70" width="150" height="190" fill="url(#bld)" />
      <rect x="420" y="70" width="150" height="190" fill="url(#win)" />
    </svg>
  );
}

export default function ContactPage() {
  const typedType = useTypewriter(enquiryTypes);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

  /* ───────── Submit Contact Enquiry ───────── */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const contactData = Object.fromEntries(formData.entries());

    setIsSubmitting(true);

    try {
      const response = await api.post("/contact", contactData);

      if (response.data.status) {
        toast.success("Enquiry submitted successfully!");
        setSubmitted(true);
        setMessageLength(0);
      } else {
        toast.error(
          response.data.message || "Failed to submit enquiry."
        );
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
    <main className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-[#f3f8ff] via-[#e3edff] to-[#cfdffb] text-slate-800">
      {/* ───────── Background ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-blue-300/40 via-blue-200/20 to-transparent" />
        <BuildingBackdrop className="absolute bottom-0 right-0 h-[60%] w-full max-w-4xl opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#cfdffb] to-transparent" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-stretch justify-center gap-10 px-4 py-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-12">
        {/* ═════════ LEFT ═════════ */}
        <div className="relative z-10 lg:w-[52%]">
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-100/90 py-1 pl-1 pr-4 text-xs font-bold text-blue-800 shadow-sm ring-1 ring-blue-200"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
              <FiActivity className="text-sm" />
            </span>
            MBBS Counselling
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-[#0b1b4a] sm:text-6xl lg:text-7xl"
          >
            Contact Us
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-5 max-w-sm text-base font-medium leading-7 text-slate-800 sm:text-lg"
          >
            Get expert guidance for MBBS admissions, counselling and more.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-2 flex min-h-6 flex-wrap items-center gap-x-2 text-sm text-slate-500"
            aria-live="off"
          >
            <span>We can help with</span>
            <span className="font-semibold text-blue-700">
              {typedType}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-blue-700 align-baseline"
              />
            </span>
          </motion.p>

          {/* Feature circles */}
          <div className="mt-7 flex items-start gap-2 sm:gap-4">
            {features.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.55 + i * 0.12 }}
                className="flex items-start gap-2 sm:gap-4"
              >
                <div className="flex w-[4.5rem] flex-col items-center text-center sm:w-24">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-white to-blue-100 text-2xl text-[#1e3a8a] shadow-[0_10px_24px_-8px_rgba(37,99,235,0.55)] ring-1 ring-blue-200 sm:h-16 sm:w-16">
                    <Icon />
                  </span>
                  <span className="mt-2 whitespace-pre-line text-xs font-bold leading-4 text-slate-800">
                    {label}
                  </span>
                </div>
                {i < features.length - 1 && (
                  <FiPlus className="mt-5 text-xs text-blue-300" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="mt-8"
          >
            <p className="font-serif text-2xl italic text-[#1e3a8a] sm:text-3xl">
              Your Future, Our Priority
            </p>
            <svg viewBox="0 0 220 12" className="mt-1 h-3 w-44 text-blue-600" fill="none" aria-hidden="true">
              <path d="M2 8 C50 2, 120 2, 218 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        </div>

        {/* ═════════ Stethoscope (center, desktop) ═════════ */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 6 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="pointer-events-none absolute bottom-10 right-[400px] z-10 hidden w-44 drop-shadow-[0_22px_26px_rgba(30,58,138,0.4)] lg:block xl:right-[430px] xl:w-52"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Stethoscope className="h-auto w-full" />
          </motion.div>
        </motion.div>

        <motion.span
          animate={{ y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute right-[460px] top-16 z-10 hidden text-4xl text-blue-500 lg:block"
        >
          <FiPlus />
        </motion.span>

        {/* ═════════ RIGHT: Form card ═════════ */}
        <motion.div
          id="contact-form"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
          className="relative z-20 w-full rounded-[1.5rem] bg-white/55 p-4 shadow-[0_30px_80px_-20px_rgba(30,58,138,0.45)] ring-1 ring-white/80 backdrop-blur-xl sm:p-5 lg:w-[400px] lg:shrink-0"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 25, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                role="status"
                className="rounded-2xl border border-emerald-300 bg-emerald-50 p-7 text-center sm:p-8"
              >
                <div className="relative mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                  <motion.span
                    animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 rounded-full bg-emerald-400/40"
                  />
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.2 }}
                    className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-emerald-400 bg-white text-3xl text-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                  >
                    <FiCheck />
                  </motion.div>
                </div>

                <h3 className="mt-6 text-2xl font-bold text-slate-900">
                  <WordReveal text="Enquiry submitted successfully!" delay={0.35} stagger={0.12} />
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
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
                  className="mt-7 inline-flex items-center gap-2 rounded-xl border border-emerald-400 bg-white px-6 py-3 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-400/25"
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
                  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                }}
                className="space-y-3"
              >
                {/* Name */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiUser className={iconClass} />
                  <label htmlFor="name" className="sr-only">Full name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name *"
                    required
                    maxLength={100}
                    className={inputClass}
                  />
                </motion.div>

                {/* Email */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiMail className={iconClass} />
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address *"
                    required
                    maxLength={254}
                    className={inputClass}
                  />
                </motion.div>

                {/* Phone */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiPhone className={iconClass} />
                  <label htmlFor="phone" className="sr-only">Phone number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Phone Number"
                    maxLength={20}
                    className={inputClass}
                  />
                </motion.div>

                {/* Enquiry type */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiGrid className={iconClass} />
                  <label htmlFor="enquiryType" className="sr-only">Enquiry type</label>
                  <select
                    id="enquiryType"
                    name="enquiryType"
                    required
                    defaultValue=""
                    className={`${inputClass} cursor-pointer appearance-none pr-10 invalid:text-slate-500`}
                  >
                    <option value="" disabled>
                      Enquiry Type *
                    </option>
                    {enquiryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1e3a8a]" />
                </motion.div>

                {/* Subject */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiFileText className={iconClass} />
                  <label htmlFor="subject" className="sr-only">Subject</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="Subject *"
                    required
                    maxLength={150}
                    className={inputClass}
                  />
                </motion.div>

                {/* Message */}
                <motion.div variants={fieldVariants} className={fieldWrap}>
                  <FiMessageSquare className="pointer-events-none absolute left-3.5 top-4 text-[15px] text-[#1e3a8a]" />
                  <label htmlFor="message" className="sr-only">Your message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder="Your Message *"
                    required
                    minLength={10}
                    maxLength={3000}
                    onChange={(e) => setMessageLength(e.target.value.length)}
                    className={`${inputClass} min-h-28 resize-y pb-7`}
                  />
                  <span
                    className={`pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums transition-colors ${
                      messageLength > 2700 ? "text-pink-500" : "text-slate-400"
                    }`}
                  >
                    {messageLength}/3000
                  </span>
                </motion.div>

                {/* Submit */}
                <motion.div variants={fieldVariants}>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { y: -3, scale: 1.01 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[#0b1b4a] via-[#1e3a8a] to-[#1d4ed8] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-8px_rgba(30,58,138,0.65)] transition-shadow duration-300 hover:shadow-[0_18px_40px_-6px_rgba(37,99,235,0.75)] focus:outline-none focus:ring-4 focus:ring-blue-400/40 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-md transition-all duration-700 group-hover:left-[120%]" />

                    {isSubmitting ? (
                      <>
                        <FiLoader className="animate-spin text-xl" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FiSend className="text-lg" />
                        Send Enquiry
                        <FiArrowRight className="text-lg transition-transform duration-300 group-hover:translate-x-1.5" />
                      </>
                    )}
                  </motion.button>
                </motion.div>

                <motion.p
                  variants={fieldVariants}
                  className="flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-500"
                >
                  <FiLock className="shrink-0" />
                  Please do not include passwords or sensitive medical records.
                </motion.p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
