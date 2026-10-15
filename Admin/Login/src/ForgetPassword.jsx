import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ForgetPassword = () => {
  const [forget, setForget] = useState({
    email: "",
  });

  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Page-level scrollbar band
  useEffect(() => {
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, []);

  const forgetInputHandler = (e) => {
    const { name, value } = e.target;

    setForget({
      ...forget,
      [name]: value,
    });

    setFieldError({
      ...fieldError,
      [name]: "",
    });

    setError("");
  };

  const forgetHandler = async (e) => {
    e.preventDefault();

    const newError = {};

    if (forget.email === "") {
      newError.email = "Email field is required";
    }

    setFieldError(newError);

    // Validation error hai to API call nahi hogi
    if (Object.keys(newError).length > 0) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await axios.post(
        "http://localhost:8090/forget-password",
        forget
      );

      console.log("Forget Password Response >>>>>", response.data);

      if (response.data.status) {
        toast.success("OTP sent successfully!");

        console.log("Email Before Navigate >>>>>>>", forget.email);

        navigate("/otpPage", {
          state: {
            email: forget.email,
          },
        });
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(message);
      toast.error(message);

      console.log("Forget Password Error >>>>>", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full rounded-lg border bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
        : "border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
    }`;

  const features = [
    { icon: "🎓", text: "Manage students, colleges & universities" },
    { icon: "🛡️", text: "Role based access and permissions" },
    { icon: "⚡", text: "Fast, simple and secure admin tools" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-slate-100">
      {/* ================= LEFT: BRAND PANEL ================= */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 p-12 text-white">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold shadow-lg shadow-blue-600/30">
            A
          </div>
          <span className="text-xl font-semibold tracking-wide">
            Admin Panel
          </span>
        </div>

        {/* Heading */}
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Forgot your password?
            <br />
            <span className="text-blue-400">We've got you covered.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
            Enter your registered email and we will send you a one time
            password to reset your account password.
          </p>

          <ul className="mt-10 space-y-4">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg backdrop-blur">
                  {f.icon}
                </span>
                <span className="text-slate-200">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-slate-400">
          © {new Date().getFullYear()} Admin Panel. All rights reserved.
        </p>
      </div>

      {/* ================= RIGHT: FORM ================= */}
      <div
        className="flex w-full lg:w-1/2 items-center justify-center overflow-y-auto px-5 py-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white shadow-lg shadow-blue-600/30">
              A
            </div>
            <span className="text-xl font-semibold text-slate-800">
              Admin Panel
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 sm:p-10">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              🔑
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              Forgot password?
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your registered email and we'll send you an OTP to reset
              your password.
            </p>

            <form onSubmit={forgetHandler} className="mt-8 space-y-5" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={forget.email}
                  onChange={forgetInputHandler}
                  className={inputClass(!!fieldError.email)}
                />
                {fieldError.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">
                    {fieldError.email}
                  </p>
                )}
              </div>

              {/* Backend Error */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  <span className="mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Send OTP */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && (
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                ← Back to Login
              </button>
            </form>

            {/* Bottom Info */}
            <p className="mt-6 text-center text-xs text-slate-400">
              🔒 We'll send a verification code to your registered email
              address.
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            Protected area. Authorized users only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;