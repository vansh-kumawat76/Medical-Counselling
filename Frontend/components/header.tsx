
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import api from "../src/lib/axios";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/college", label: "College" },
  { href: "/course", label: "Course" },
  { href: "/contact", label: "Contact Us" },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

type ModalView =
  | "login"
  | "signup"
  | "forget"
  | "verifyOtp"
  | "resetPassword";

export default function Header() {
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

  const closeModal = () => {
    setIsOpen(false);
    setModalView("login");
    setResetEmail("");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmNewPassword("");
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
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 min-[968px]:gap-4 min-[968px]:px-6 min-[968px]:py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 text-lg font-extrabold text-white shadow-lg shadow-cyan-500/30">
              M
            </div>

            <div className="leading-tight">
              <h1 className="text-lg font-bold text-white">
                Medical <span className="text-cyan-400">Counselling</span>
              </h1>

              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Management System
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 min-[968px]:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-2xl text-white transition hover:border-cyan-400 hover:text-cyan-400 min-[968px]:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>

          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                aria-label="Profile"
                aria-expanded={showProfileMenu}
                title="Profile"
                onClick={() =>
                  setShowProfileMenu((prev) => !prev)
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/40 bg-gray-800 text-cyan-400 transition hover:bg-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="8" r="3" />
                  <path d="M6.5 19a5.5 5.5 0 0 1 11 0" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-14 z-[60] w-60 rounded-xl border border-white/10 bg-gray-900 p-3 shadow-xl">
                  <p className="px-2 py-1 text-xs text-gray-500">
                    Signed in as
                  </p>

                  <p className="break-all px-2 py-2 text-sm text-gray-200">
                    {userEmail || "Logged-in user"}
                  </p>

                  <hr className="my-2 border-white/10" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-white/5"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setModalView("login");
                setIsOpen(true);
              }}
              className="hidden min-[968px]:block rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105"
            >
              Login
            </button>
          )}
        </div>

        {menuOpen && (
          <nav className="absolute left-0 top-full flex w-full flex-col gap-1 border-b border-white/10 bg-gray-950 px-4 py-4 shadow-xl min-[968px]:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5 hover:text-cyan-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Animated Authentication Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="auth-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={closeModal}
          >
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 35 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/20 bg-gray-900/80 p-7 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated Background Effects */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
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
                  className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl"
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
                  className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-indigo-600/25 blur-3xl"
                />
              </div>

              {/* Modal Content */}
              <div className="relative z-10">

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {titles[modalView]}
                    </h2>

                    <p className="mt-1 break-words text-sm text-gray-400">
                      {descriptions[modalView]}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    aria-label="Close modal"
                    className="text-3xl leading-none text-gray-500 transition hover:text-white"
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
                            className="text-sm text-cyan-400 hover:text-cyan-300"
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
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {loading
                        ? "Please wait..."
                        : modalView === "login"
                          ? "Login"
                          : "Create Account"}
                    </button>

                    <p className="pt-2 text-center text-sm text-gray-400">
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
                        className="font-semibold text-cyan-400 hover:underline"
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
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalView("login")}
                      className="w-full text-sm text-gray-300 hover:text-white"
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
                      className={inputCls}
                    />

                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalView("forget")}
                      className="w-full text-sm text-gray-300 hover:text-white"
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
                      className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
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
