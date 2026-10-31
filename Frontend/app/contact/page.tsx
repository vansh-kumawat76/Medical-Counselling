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
  "mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-300";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/30 hover:border-cyan-400/40 focus:border-cyan-400 focus:bg-cyan-400/5 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.18),0_0_26px_rgba(34,211,238,0.28)]";

const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

/* ───────── Text animation helpers ───────── */

/** Big heading: each letter springs in with blur + 3D flip, gradient flows
 *  across all letters, and letters lift up when hovered. */
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
              "linear-gradient(90deg,#ffffff,#a5f3fc,#c4b5fd)",
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

/** Paragraph text: words fade + slide + un-blur one after another. */
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

/** GSAP text animation: splits the paragraph into lines (each line masked),
 *  then slides every line up from below with a stagger. Re-splits correctly
 *  when the screen is resized (autoSplit). */
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

      // text starts hidden (class "invisible"), show it right before animating
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

/** Types a word, pauses, deletes it, then moves to the next one. */
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
    <main className="relative isolate min-h-screen overflow-hidden bg-[#060a14] text-slate-200">
      {/* ───────── Page Background ───────── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(38%_32%_at_12%_14%,rgba(124,58,237,0.38),transparent),radial-gradient(38%_32%_at_90%_88%,rgba(6,182,212,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      </div>

      {/* ═════════ BANNER ═════════ */}
      <section className="relative overflow-hidden border-b border-white/10 px-4 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20 lg:px-12 lg:pt-24">
        {/* banner decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1230]/80 via-[#080d1f]/60 to-transparent" />

          <motion.div
            animate={{ y: [0, -22, 0], x: [0, 16, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-violet-500/30 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 24, 0], x: [0, -18, 0], opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-24 -top-10 h-96 w-96 rounded-full bg-cyan-400/25 blur-3xl"
          />

          {/* concentric glow rings */}
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
          <div className="absolute left-1/2 top-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[0.08]" />
          <div className="absolute left-1/2 top-1/2 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.1]" />

          {/* bottom glow line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cyan-400/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]" />
            </span>
            Get in touch
          </motion.span>

          <motion.h1
            animate={{
              filter: [
                "drop-shadow(0 0 18px rgba(34,211,238,0.2))",
                "drop-shadow(0 0 38px rgba(167,139,250,0.45))",
                "drop-shadow(0 0 18px rgba(34,211,238,0.2))",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            <AnimatedHeading text="Contact Us" delay={0.25} />
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mx-auto mt-6 h-1 w-24 origin-center rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          />

          <GsapLines
            text="Admissions, counselling, college information or technical help. Send us your enquiry and our team will respond on your email or phone."
            delay={1}
            className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base sm:leading-8"
          />

          {/* Typewriter line */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 2.2 }}
            className="mx-auto mt-5 flex min-h-7 max-w-full flex-wrap items-center justify-center gap-x-2 text-sm text-slate-500 sm:text-base"
            aria-live="off"
          >
            <span>We can help with</span>
            <span className="font-semibold text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
              {typedType}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-cyan-300 align-baseline"
              />
            </span>
          </motion.p>

          {/* Breadcrumb */}
          <motion.nav
            aria-label="Breadcrumb"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-slate-400 backdrop-blur"
          >
            <a
              href="/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-cyan-300 focus:outline-none focus-visible:text-cyan-300"
            >
              <FiHome className="text-sm" />
              Home
            </a>
            <FiChevronRight className="text-slate-600" />
            <span className="font-semibold text-cyan-300">Contact Us</span>
          </motion.nav>
        </div>
      </section>

      {/* ═════════ FORM SECTION ═════════ */}
      <section
        id="contact-form"
        className="relative -mt-12 px-4 pb-16 sm:-mt-14 sm:px-8 sm:pb-24 lg:px-12"
      >
        <div className="mx-auto max-w-3xl">
          {/* Gradient border card */}
          <motion.div
            initial={{ opacity: 0, y: 45, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="rounded-[1.7rem] bg-gradient-to-br from-cyan-400/75 via-white/10 to-violet-400/75 p-px shadow-[0_0_80px_-20px_rgba(34,211,238,0.4)]"
          >
            <div className="rounded-[calc(1.7rem-1px)] bg-[#080c1a]/95 p-5 backdrop-blur-xl sm:p-9 lg:p-12">
              {/* Form heading */}
              <div className="border-b border-white/10 pb-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
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
                    backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" },
                  }}
                  className="mt-4 bg-[linear-gradient(90deg,#ffffff,#67e8f9,#a78bfa,#67e8f9,#ffffff)] bg-[length:200%_100%] bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl"
                >
                  Send us an enquiry
                </motion.h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  <WordReveal
                    text="Fill in your details below. Fields marked with"
                    delay={0.8}
                    stagger={0.05}
                  />
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: [0, 1.6, 1] }}
                    transition={{ duration: 0.5, delay: 1.35 }}
                    className="inline-block px-1 font-bold text-pink-400"
                  >
                    *
                  </motion.span>
                  <WordReveal text="are required." delay={1.4} stagger={0.05} />
                </p>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  /* ───────── Success ───────── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 25, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                    role="status"
                    className="mt-8 rounded-2xl border border-emerald-400/35 bg-emerald-400/[0.07] p-7 text-center sm:p-10"
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
                        className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/10 text-3xl text-emerald-300 shadow-[0_0_40px_rgba(52,211,153,0.4)]"
                      >
                        <FiCheck />
                      </motion.div>
                    </div>

                    <h3 className="mt-6 text-2xl font-bold text-white">
                      <WordReveal
                        text="Enquiry submitted successfully!"
                        delay={0.35}
                        stagger={0.12}
                      />
                    </h3>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
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
                      className="mt-7 inline-flex items-center gap-2 rounded-xl border border-emerald-400/50 px-6 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/10 focus:outline-none focus:ring-4 focus:ring-emerald-400/25"
                    >
                      Submit another enquiry
                      <FiArrowRight />
                    </motion.button>
                  </motion.div>
                ) : (
                  /* ───────── Form ───────── */
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
                    className="mt-8 space-y-6"
                  >
                    {/* Name + Email */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <motion.div variants={fieldVariants}>
                        <label htmlFor="name" className={labelClass}>
                          <FiUser className="text-sm text-cyan-400" />
                          Full name <span className="text-pink-400">*</span>
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
                          <FiMail className="text-sm text-cyan-400" />
                          Email address <span className="text-pink-400">*</span>
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

                    {/* Phone + Enquiry type */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <motion.div variants={fieldVariants}>
                        <label htmlFor="phone" className={labelClass}>
                          <FiPhone className="text-sm text-cyan-400" />
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
                        <label htmlFor="enquiryType" className={labelClass}>
                          <FiMessageSquare className="text-sm text-cyan-400" />
                          Enquiry type <span className="text-pink-400">*</span>
                        </label>
                        <select
                          id="enquiryType"
                          name="enquiryType"
                          required
                          defaultValue=""
                          className={`${inputClass} cursor-pointer [&>option]:bg-[#0a0f1e] [&>option]:text-white`}
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
                      <label htmlFor="subject" className={labelClass}>
                        <FiFileText className="text-sm text-cyan-400" />
                        Subject <span className="text-pink-400">*</span>
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
                      <label htmlFor="message" className={labelClass}>
                        <FiMessageSquare className="text-sm text-cyan-400" />
                        Your message <span className="text-pink-400">*</span>
                        <span
                          className={`ml-auto tabular-nums transition-colors ${
                            messageLength > 2700
                              ? "text-pink-400"
                              : "text-slate-500"
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

                    {/* Submit */}
                    <motion.div variants={fieldVariants}>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={!isSubmitting ? { y: -3, scale: 1.01 } : {}}
                        whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 px-6 py-4 text-[15px] font-bold text-[#04121c] shadow-[0_0_34px_-6px_rgba(34,211,238,0.6)] transition-shadow duration-300 hover:shadow-[0_0_50px_-4px_rgba(129,140,248,0.8)] focus:outline-none focus:ring-4 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/40 blur-md transition-all duration-700 group-hover:left-[120%]" />

                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin text-xl" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit enquiry
                            <FiArrowRight className="text-xl transition-transform duration-300 group-hover:translate-x-1.5" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.p
                      variants={fieldVariants}
                      className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500"
                    >
                      <FiLock className="shrink-0" />
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
