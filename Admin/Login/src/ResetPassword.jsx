import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({});

  const resetPasswordHandler = async (e) => {
    e.preventDefault();

    const newError = {};

    if (!email) {
      setError("Email not found. Please restart the password reset process.");
      toast.error("Email not found. Please try again.");
      return;
    }

    if (password === "") {
      newError.password = "Password field is required";
    } else if (password.length < 8) {
      newError.password = "Password must be at least 8 characters";
    }

    if (confirmPassword === "") {
      newError.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      newError.confirmPassword = "Passwords do not match";
    }

    setFieldError(newError);

    if (Object.keys(newError).length > 0) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await axios.post("http://localhost:8090/reset-password", {
        email: email,
        password: password,
      });

      console.log("Reset Password Response >>>", response.data);

      if (response.data.status) {
        toast.success("Password reset successfully!");

        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        const message =
          response.data.message || "Password reset failed. Please try again.";

        setError(message);
        toast.error(message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(message);
      toast.error(message);

      console.log("Reset Password Error >>>", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // UI-only: simple password strength (0-4)
  const strength = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][strength];

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white/[0.03] py-3.5 pl-12 pr-16 text-[15px] text-[#f5ecd7] placeholder-[#f5ecd7]/30 outline-none transition-all duration-300 ${
      hasError
        ? "border-red-400/60 focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
        : "border-[#d4a73c]/20 hover:border-[#d4a73c]/40 focus:border-[#e8c46a] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#d4a73c]/15"
    }`;

  const labelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4a73c]/80";

  const toggleClass =
    "absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-widest text-[#f5ecd7]/45 transition hover:text-[#e8c46a]";

  const lockIcon = (
    <svg
      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#d4a73c]/60"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="10.5" width="16" height="10" rx="3" />
      <path strokeLinecap="round" d="M8 10.5V8a4 4 0 118 0v2.5" />
    </svg>
  );

  const errorTag = (msg) => (
    <p className="shake mt-2 flex items-center gap-2 text-xs font-medium text-red-400">
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-400/50 text-[10px]">
        !
      </span>
      {msg}
    </p>
  );

  const gold =
    "bg-[linear-gradient(110deg,#8a6a1f_0%,#e8c46a_28%,#fff1c1_50%,#e8c46a_72%,#8a6a1f_100%)]";

  return (
    <div className="login-root relative min-h-screen overflow-hidden bg-[#050505] text-[#f5ecd7]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .login-root { font-family: 'Inter', system-ui, sans-serif; }
        .login-root .font-serif-lux { font-family: 'Playfair Display', Georgia, serif; }
        @keyframes glow-pulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.08); } }
        @keyframes gold-flow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sheen { 0% { transform: translateX(-130%) skewX(-22deg); } 100% { transform: translateX(330%) skewX(-22deg); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes ring-pulse { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
        @keyframes float-slow { 0%,100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(-16px) rotate(45deg); } }
        .glow-pulse { animation: glow-pulse 7s ease-in-out infinite; }
        .gold-text { background-size: 200% auto; animation: gold-flow 7s linear infinite; }
        .fade-up { animation: fade-up .9s cubic-bezier(.2,.8,.2,1) both; }
        .shake { animation: shake .35s ease-in-out; }
        .ring-pulse { animation: ring-pulse 2.6s ease-out infinite; }
        .float-slow { animation: float-slow 9s ease-in-out infinite; }
        .btn-gold::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 35%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); transform: translateX(-130%) skewX(-22deg); }
        .btn-gold:hover:not(:disabled)::after { animation: sheen .9s ease; }
        .login-root input:-webkit-autofill,
        .login-root input:-webkit-autofill:focus {
          -webkit-text-fill-color: #f5ecd7;
          transition: background-color 9999s ease-in-out 0s;
          caret-color: #f5ecd7;
        }
        @media (prefers-reduced-motion: reduce) {
          .glow-pulse, .gold-text, .fade-up, .shake, .ring-pulse, .float-slow { animation: none; }
        }
      `}</style>

      {/* ===== Background ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-pulse absolute -left-40 top-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#d4a73c]/20 blur-[150px]" />
        <div className="glow-pulse absolute -right-40 bottom-[-15%] h-[42rem] w-[42rem] rounded-full bg-[#b8892a]/20 blur-[160px] [animation-delay:-3s]" />

        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(#e8c46a 1px, transparent 1px), linear-gradient(90deg, #e8c46a 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 70%)",
          }}
        />

        <div className="absolute -right-20 top-0 h-full w-[40%] -skew-x-12 bg-gradient-to-b from-[#e8c46a]/[0.06] via-transparent to-transparent" />

        <span className="float-slow absolute left-[12%] top-[18%] h-8 w-8 border border-[#e8c46a]/30" />
        <span className="float-slow absolute bottom-[16%] right-[14%] h-10 w-10 border border-[#e8c46a]/25 [animation-delay:-4s]" />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* ===== Main ===== */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <div className="fade-up w-full max-w-md">
          {/* gold hairline border */}
          <div
            className={`rounded-[26px] p-px shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_70px_-25px_rgba(212,167,60,0.35)] ${gold} gold-text`}
          >
            <div className="relative overflow-hidden rounded-[25px] bg-gradient-to-b from-[#121212] to-[#080808] p-8 sm:p-10">
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#d4a73c]/20 blur-[70px]" />

              <div className="relative">
                {/* Emblem with pulse ring */}
                <div className="mb-7 flex items-center gap-4">
                  <div className="relative">
                    <span className="ring-pulse absolute inset-0 rotate-45 rounded-lg border border-[#e8c46a]/60" />
                    <div
                      className={`relative flex h-14 w-14 rotate-45 items-center justify-center rounded-lg ${gold} shadow-[0_8px_30px_-6px_rgba(212,167,60,0.7)]`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#1a1204"
                        strokeWidth="2.1"
                        className="h-7 w-7 -rotate-45"
                      >
                        <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
                        <path strokeLinecap="round" d="M8.5 10.5V8a3.5 3.5 0 117 0v2.5" />
                        <path strokeLinecap="round" d="M12 14v3" />
                      </svg>
                    </div>
                  </div>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#d4a73c]/50 to-transparent" />
                </div>

                {/* Heading */}
                <h2 className="font-serif-lux text-[2rem] font-semibold leading-tight">
                  Reset your{" "}
                  <span className={`${gold} gold-text bg-clip-text italic text-transparent`}>
                    password
                  </span>
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#f5ecd7]/50">
                  Create a new password for your account.
                </p>

                {email && (
                  <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#d4a73c]/30 bg-[#d4a73c]/10 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[#e8c46a]" />
                    <span className="truncate text-sm font-medium text-[#e8c46a]">
                      {email}
                    </span>
                  </div>
                )}

                <form
                  onSubmit={resetPasswordHandler}
                  className="mt-8 space-y-5"
                  noValidate
                >
                  {/* New Password */}
                  <div>
                    <label htmlFor="password" className={labelClass}>
                      New Password
                    </label>

                    <div className="relative">
                      {lockIcon}
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);

                          setFieldError({
                            ...fieldError,
                            password: "",
                          });

                          setError("");
                        }}
                        className={inputClass(!!fieldError.password)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={toggleClass}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {password && (
                      <div className="mt-3">
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                i <= strength
                                  ? "bg-gradient-to-r from-[#b8892a] to-[#fff1c1]"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1.5 text-right text-[11px] font-medium uppercase tracking-widest text-[#d4a73c]/70">
                          {strengthLabel}
                        </p>
                      </div>
                    )}

                    {fieldError.password && errorTag(fieldError.password)}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className={labelClass}>
                      Confirm Password
                    </label>

                    <div className="relative">
                      {lockIcon}
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);

                          setFieldError({
                            ...fieldError,
                            confirmPassword: "",
                          });

                          setError("");
                        }}
                        className={inputClass(!!fieldError.confirmPassword)}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className={toggleClass}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {fieldError.confirmPassword &&
                      errorTag(fieldError.confirmPassword)}
                  </div>

                  {/* Backend Error */}
                  {error && (
                    <p
                      role="alert"
                      className="shake rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}

                  {/* Reset Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-gold relative w-full overflow-hidden rounded-xl ${gold} gold-text py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#1a1204] shadow-[0_12px_40px_-10px_rgba(212,167,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(232,196,106,0.9)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8c46a]/40 disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {loading ? "Resetting Password…" : "Reset Password"}
                  </button>

                  {/* Back Login */}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4a73c]/30 bg-transparent py-3.5 text-sm font-semibold text-[#e8c46a] transition-all duration-300 hover:border-[#e8c46a]/70 hover:bg-[#d4a73c]/10"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M9.7 3.3a1 1 0 010 1.4L5.4 9H17a1 1 0 110 2H5.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                    Back to Login
                  </button>
                </form>

                {/* Bottom */}
                <div className="mt-7 flex items-center justify-center gap-2 text-xs leading-relaxed text-[#f5ecd7]/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#d4a73c]/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  </svg>
                  Your new password must contain at least 8 characters.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
