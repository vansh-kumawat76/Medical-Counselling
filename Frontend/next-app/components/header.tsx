
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import api from "../src/lib/axios";
import axios from "axios";

const links = [
  { href: "/", label: "Students" },
  { href: "/colleges", label: "Colleges" },
  { href: "/universities", label: "Universities" },
  { href: "/stream", label: "Streams" },
  { href: "/degree", label: "Degrees" },
  { href: "/courses", label: "Courses" },
  { href: "/specilizations", label: "Specializations" },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    if (!isLogin && password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match!");
      return;
    }

    const endpoint = isLogin ? "/login-user" : "/create-user";

    try {
      setLoading(true);

      const { data } = await api.post(endpoint, {
        email,
        password,
      });

      if (!data.status) {
        toast.error(data.message || "Something went wrong!");
        return;
      }

      if (isLogin) {
        if (!data.token) {
          toast.error("Login token was not received from server.");
          return;
        }

        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "user",
          JSON.stringify({
            email: data.emailVerify?.email ?? email,
            role: data.emailVerify?.role?.role ?? "",
            permissions:
              data.emailVerify?.role?.permissions?.map(
                (permission: { name: string }) => permission.name
              ) ?? [],
          })
        );

        toast.success("Login successful!");
        setIsOpen(false);
        form.reset();
      } else {
        toast.success("Account created successfully! Please login.");
        setIsLogin(true);
        form.reset();
      }
    } catch (error) {
      console.error("Authentication error:", error);

      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message ||
            "Cannot connect to backend. Check whether server is running."
        );
      } else {
        toast.error("Something went wrong!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gray-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
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

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-300">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-1 transition hover:text-white after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-gradient-to-r after:from-cyan-400 after:to-indigo-500 after:transition-all hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setIsOpen(true);
            }}
            className="rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-105"
          >
            Login
          </button>
        </div>
      </header>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-gray-900 p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-indigo-600" />

            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isLogin ? "Welcome Back!" : "Create Account"}
                </h2>

                <p className="mt-1 text-sm text-gray-400">
                  {isLogin
                    ? "Login to your account"
                    : "Signup for a new account"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close modal"
                className="text-3xl leading-none text-gray-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <input
                  type="text"
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
                    isLogin ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  className={inputCls}
                />

                {isLogin && (
                  <div className="mt-2 text-right">
                    <Link
                      href="/forgot-password"
                      onClick={() => setIsOpen(false)}
                      className="text-sm font-medium text-cyan-400 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                )}
              </div>

              {!isLogin && (
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className={inputCls}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Login"
                    : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin((previous) => !previous)}
                className="font-semibold text-cyan-400 hover:underline"
              >
                {isLogin ? "Signup" : "Login"}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
