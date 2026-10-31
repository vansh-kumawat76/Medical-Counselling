"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import api from "../src/lib/axios";
import axios from "axios";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
} from "motion/react";
import { FiLogIn, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/college", label: "College" },
  { href: "/course", label: "Course" },
  { href: "/contact", label: "Contact Us" },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-300 hover:border-cyan-400/40 focus:border-cyan-400 focus:bg-cyan-400/5 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.18),0_0_24px_rgba(34,211,238,0.25)]";

const primaryBtn =
  "w-full rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 py-3 text-sm font-bold text-[#04121c] shadow-[0_0_30px_-8px_rgba(34,211,238,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_44px_-6px_rgba(129,140,248,0.8)] focus:outline-none focus:ring-4 focus:ring-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const ghostBtn =
  "w-full text-sm text-slate-400 transition hover:text-white";

type ModalView =
  | "login"
  | "signup"
  | "forget"
  | "verifyOtp"
  | "resetPassword";

export default function Header() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("login");

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  /* header visual state */
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const progressX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    setIsLoggedIn(Boolean(token));

    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setUserEmail(parsedUser.email || "");
      } catch {
        setUserEmail("");
      }
    }
  }, []);

  /* shrink + glass effect after scrolling */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* close mobile menu when the page changes */
  useEffect(() => {
    setMenuOpen(false);
    setShowProfileMenu(false);
  }, [pathname]);

  /* close profile dropdown on outside click / Escape */
  useEffect(() => {
    if (!showProfileMenu && !menuOpen) return;

    const onDown = (e: MouseEvent) => {
      if (
        showProfileMenu &&
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowProfileMenu(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showProfileMenu, menuOpen]);

  const closeModal = () => {
    setIsOpen(false);
    setModalView("login");
    setResetEmail("");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const openLogin = () => {
    setModalView("login");
    setIsOpen(true);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setUserEmail("");
    setShowProfileMenu(false);

    setModalView("login");
    setIsOpen(true);

    toast.success("Logged out successfully!");
  };

  const handleForgotPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.post("/forget-password", {
        email: resetEmail.trim(),
      });

      if (!data.status) {
        toast.error(data.message || "Unable to send OTP");
        return;
      }

      toast.success(data.message || "OTP sent to your email");
      setModalView("verifyOtp");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Failed to send OTP"
          : "Something went wrong!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { data } = await api.post("/verify-forget-otp", {
        email: resetEmail.trim(),
        otp: otp.trim(),
      });

      if (!data.status) {
        toast.error(data.message || "Invalid OTP");
        return;
      }

      if (!data.resetToken) {
        toast.error(
          "Reset token missing. Please update the backend OTP verification API."
        );
        return;
      }

      setResetToken(data.resetToken);
      toast.success("OTP verified successfully");
      setModalView("resetPassword");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "OTP verification failed"
          : "Something went wrong!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!resetToken) {
      toast.error("Reset authorization missing. Verify your OTP again.");
      setModalView("verifyOtp");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/reset-password", {
        resetToken,
        newPassword,
      });

      if (!data.status) {
        toast.error(data.message || "Password reset failed");
        return;
      }

      toast.success("Password reset successfully. Please login.");

      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setModalView("login");
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Password reset failed"
          : "Something went wrong!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    const isLogin = modalView === "login";

    if (!isLogin && password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match!");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post(
        isLogin ? "/login-user" : "/create-user",
        isLogin
          ? { email, password, portal: "user" }
          : { fullName, email, password },
        { withCredentials: true }
      );

      if (!data.status) {
        toast.error(data.message || "Something went wrong!");
        return;
      }

      if (isLogin) {
        if (!data.token) {
          toast.error("Login token was not received from server.");
          return;
        }

        const loggedInEmail = data.emailVerify?.email ?? email;

        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "user",
          JSON.stringify({
            email: loggedInEmail,
            role: data.emailVerify?.role?.role ?? "",
            permissions:
              data.emailVerify?.role?.permissions?.map(
                (permission: { name: string }) => permission.name
              ) ?? [],
          })
        );

        setUserEmail(loggedInEmail);
        setIsLoggedIn(true);
        setShowProfileMenu(false);

        toast.success("Login successful!");
        setIsOpen(false);
        form.reset();

        window.location.href = "/";
      } else {
        toast.success("Account created successfully! Please login.");
        setModalView("login");
        form.reset();
      }
    } catch (error) {
      console.error("Authentication error:", error);

      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message ||
              "Cannot connect to backend. Check whether server is running."
          : "Something went wrong!"
      );
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<ModalView, string> = {
    login: "Welcome Back!",
    signup: "Create Account",
    forget: "Forgot Password?",
    verifyOtp: "Verify OTP",
    resetPassword: "Reset Password",
  };

  const descriptions: Record<ModalView, string> = {
    login: "Login to your account",
    signup: "Signup for a new account",
    forget: "Enter your registered email address",
    verifyOtp: `Enter the OTP sent to ${resetEmail}`,
    resetPassword: "Choose a new password for your account",
  };

  return (
    <>
      {/* ═════════════════ HEADER ═════════════════ */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="sticky top-0 z-50 w-full"
      >
        <div
          className={`relative transition-all duration-500 ${
            scrolled
              ? "border-b border-white/10 bg-[#060a14]/80 shadow-[0_14px_44px_-22px_rgba(34,211,238,0.45)] backdrop-blur-xl"
              : "border-b border-white/5 bg-[#060a14]/50 backdrop-blur-md"
          }`}
        >
          {/* top glow line */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

          {/* soft ambient glows */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="absolute -right-16 -top-16 h-40 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
          </div>

          <div
            className={`relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 transition-all duration-500 min-[968px]:gap-4 min-[968px]:px-6 ${
              scrolled ? "py-2.5" : "py-3.5 min-[968px]:py-4"
            }`}
          >
            {/* ───── Logo ───── */}
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative">
                <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-90" />
                <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 text-lg font-extrabold text-white ring-1 ring-white/25">
                  M
                  <span className="absolute inset-y-0 -left-full w-1/2 -skew-x-12 bg-white/40 blur-sm transition-all duration-700 group-hover:left-[130%]" />
                </div>
              </div>

              <div className="leading-tight">
                <p className="text-lg font-bold tracking-tight text-white">
                  Medical{" "}
                  <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                    Counselling
                  </span>
                </p>

                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-500">
                  Management System
                </p>
              </div>
            </Link>

            {/* ───── Desktop nav (glass pill) ───── */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1.5 shadow-inner shadow-white/[0.03] backdrop-blur min-[968px]:flex"
            >
              {links.map((link) => {
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative isolate rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                      active
                        ? "text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-cyan-400/25 to-violet-400/25 shadow-[0_0_22px_rgba(34,211,238,0.3)] ring-1 ring-cyan-300/30"
                      />
                    )}
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* ───── Right side ───── */}
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    aria-label="Profile"
                    aria-expanded={showProfileMenu}
                    aria-haspopup="menu"
                    title="Profile"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-2.5 transition hover:border-cyan-400/50 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                  >
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 p-[2px]">
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0f1e] text-sm font-bold text-cyan-300">
                        {userEmail ? (
                          userEmail.charAt(0).toUpperCase()
                        ) : (
                          <FiUser />
                        )}
                      </span>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#060a14] bg-emerald-400" />
                    </span>

                    <FiChevronDown
                      className={`hidden text-slate-400 transition-transform duration-300 sm:block ${
                        showProfileMenu ? "rotate-180 text-cyan-300" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: -10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-14 z-[60] w-64 origin-top-right rounded-2xl bg-gradient-to-br from-cyan-400/50 via-white/10 to-violet-400/50 p-px shadow-[0_20px_60px_-20px_rgba(34,211,238,0.4)]"
                      >
                        <div className="rounded-[calc(1rem-1px)] bg-[#080c1a]/95 p-3 backdrop-blur-xl">
                          <p className="px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            Signed in as
                          </p>

                          <p className="break-all px-2 py-2 text-sm font-medium text-slate-200">
                            {userEmail || "Logged-in user"}
                          </p>

                          <div className="my-2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                          <Link
                            href="/profile"
                            role="menuitem"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-cyan-400/10 hover:text-cyan-300"
                          >
                            <FiUser />
                            Profile
                          </Link>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-400 transition hover:bg-rose-400/10"
                          >
                            <FiLogOut />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openLogin}
                  className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 px-6 py-2.5 text-sm font-bold text-[#04121c] shadow-[0_0_30px_-8px_rgba(34,211,238,0.7)] transition-shadow hover:shadow-[0_0_44px_-6px_rgba(129,140,248,0.9)] focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/40 min-[968px]:inline-flex"
                >
                  <span className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/50 blur-md transition-all duration-700 group-hover:left-[120%]" />
                  <FiLogIn className="text-base" />
                  Login
                </motion.button>
              )}

              {/* ───── Animated hamburger ───── */}
              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white transition hover:border-cyan-400/60 hover:text-cyan-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 min-[968px]:hidden"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                <span className="relative block h-4 w-5">
                  <span
                    className={`absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                      menuOpen
                        ? "top-1/2 -translate-y-1/2 rotate-45"
                        : "top-0"
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current transition-all duration-300 ${
                      menuOpen ? "scale-x-0 opacity-0" : "opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                      menuOpen
                        ? "top-1/2 -translate-y-1/2 -rotate-45"
                        : "bottom-0"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* scroll progress bar */}
          <motion.div
            style={{ scaleX: progressX }}
            className="absolute inset-x-0 -bottom-px h-[2px] origin-left bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
          />
        </div>

        {/* ───── Mobile menu ───── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              key="mobile-nav"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute left-0 top-full flex w-full flex-col gap-1.5 border-b border-white/10 bg-[#060a14]/95 px-4 py-4 shadow-[0_30px_60px_-30px_rgba(34,211,238,0.35)] backdrop-blur-xl min-[968px]:hidden"
            >
              {links.map((link, i) => {
                const active = isActive(link.href);

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        active
                          ? "border-cyan-400/30 bg-gradient-to-r from-cyan-400/15 to-violet-400/15 text-white"
                          : "border-transparent text-slate-300 hover:bg-white/5 hover:text-cyan-300"
                      }`}
                    >
                      {link.label}
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              {!isLoggedIn && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + links.length * 0.05 }}
                  onClick={openLogin}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 py-3 text-sm font-bold text-[#04121c] shadow-[0_0_30px_-8px_rgba(34,211,238,0.6)]"
                >
                  <FiLogIn />
                  Login
                </motion.button>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ═════════════════ AUTH MODAL ═════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onClick={closeModal}
          >
            {/* Modal Card (gradient border) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-[1.6rem] bg-gradient-to-br from-cyan-400/70 via-white/10 to-violet-400/70 p-px shadow-[0_0_80px_-20px_rgba(34,211,238,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Background Effects */}
              <div className="pointer-events-none absolute inset-px overflow-hidden rounded-[calc(1.6rem-1px)] bg-[#080c1a]">
                <motion.div
                  animate={{
                    x: [0, 35, 0],
                    y: [0, 25, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/25 blur-3xl"
                />

                <motion.div
                  animate={{
                    x: [0, -30, 0],
                    y: [0, -25, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-violet-600/30 blur-3xl"
                />
              </div>

              {/* Modal Content */}
              <div className="relative z-10 max-h-[88vh] overflow-y-auto rounded-[calc(1.6rem-1px)] p-7">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="bg-gradient-to-r from-white via-cyan-200 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
                      {titles[modalView]}
                    </h2>

                    <p className="mt-1 break-words text-sm text-slate-400">
                      {descriptions[modalView]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-2xl leading-none text-slate-400 transition hover:border-cyan-400/50 hover:text-white"
                  >
                    &times;
                  </button>
                </div>

                {(modalView === "login" || modalView === "signup") && (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    {modalView === "signup" && (
                      <input
                        name="fullName"
                        placeholder="Full Name"
                        autoComplete="name"
                        required
                        className={inputCls}
                      />
                    )}

                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      autoComplete="email"
                      required
                      className={inputCls}
                    />

                    <div>
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        autoComplete={
                          modalView === "login"
                            ? "current-password"
                            : "new-password"
                        }
                        minLength={6}
                        required
                        className={inputCls}
                      />

                      {modalView === "login" && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmail("");
                              setOtp("");
                              setResetToken("");
                              setModalView("forget");
                            }}
                            className="text-sm text-cyan-300 transition hover:text-cyan-200"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>

                    {modalView === "signup" && (
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        minLength={6}
                        required
                        className={inputCls}
                      />
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={primaryBtn}
                    >
                      {loading
                        ? "Please wait..."
                        : modalView === "login"
                          ? "Login"
                          : "Create Account"}
                    </button>

                    <p className="pt-2 text-center text-sm text-slate-400">
                      {modalView === "login"
                        ? "Don't have an account?"
                        : "Already have an account?"}{" "}

                      <button
                        type="button"
                        onClick={() =>
                          setModalView(
                            modalView === "login" ? "signup" : "login"
                          )
                        }
                        className="font-semibold text-cyan-300 hover:underline"
                      >
                        {modalView === "login" ? "Signup" : "Login"}
                      </button>
                    </p>
                  </form>
                )}

                {modalView === "forget" && (
                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-4"
                  >
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Registered Email Address"
                      autoComplete="email"
                      required
                      className={inputCls}
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className={primaryBtn}
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalView("login")}
                      className={ghostBtn}
                    >
                      Back to Login
                    </button>
                  </form>
                )}

                {modalView === "verifyOtp" && (
                  <form
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                            .replace(/[^a-zA-Z0-9]/g, "")
                            .slice(0, 6)
                        )
                      }
                      placeholder="Enter 6-character OTP"
                      maxLength={6}
                      required
                      className={`${inputCls} text-center font-mono tracking-[0.5em]`}
                    />

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className={primaryBtn}
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalView("forget")}
                      className={ghostBtn}
                    >
                      Back
                    </button>
                  </form>
                )}

                {modalView === "resetPassword" && (
                  <form
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                  >
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New Password (minimum 8 characters)"
                      minLength={8}
                      required
                      className={inputCls}
                    />

                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) =>
                        setConfirmNewPassword(e.target.value)
                      }
                      placeholder="Confirm New Password"
                      minLength={8}
                      required
                      className={inputCls}
                    />

                    <button
                      type="submit"
                      disabled={loading}
                      className={primaryBtn}
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
