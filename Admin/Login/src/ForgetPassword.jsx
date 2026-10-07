import axios from "axios";
import React, { useState } from "react";
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
    `w-full rounded-xl border bg-white/[0.03] py-3.5 pl-12 pr-4 text-[15px] text-[#f5ecd7] placeholder-[#f5ecd7]/30 outline-none transition-all duration-300 ${
      hasError
        ? "border-red-400/60 focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
        : "border-[#d4a73c]/20 hover:border-[#d4a73c]/40 focus:border-[#e8c46a] focus:bg-white/[0.06] focus:ring-4 focus:ring-[#d4a73c]/15"
    }`;

  const labelClass =
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4a73c]/80";

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

        {/* floating diamonds */}
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
                        <circle cx="8" cy="15" r="3.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.5L19 4m-3 3l2.5 2.5M13.5 9.5L16 12" />
                      </svg>
                    </div>
                  </div>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#d4a73c]/50 to-transparent" />
                </div>

                <h2 className="font-serif-lux text-[2rem] font-semibold leading-tight">
                  Forgot your{" "}
                  <span className={`${gold} gold-text bg-clip-text italic text-transparent`}>
                    password?
                  </span>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#f5ecd7]/50">
                  Enter your registered email and we'll send you an OTP to reset
                  your password.
                </p>

                <form onSubmit={forgetHandler} className="mt-8 space-y-5" noValidate>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#d4a73c]/60"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5l7.4 5.2a2 2 0 002.2 0l7.4-5.2" />
                      </svg>
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
                    </div>

                    {fieldError.email && (
                      <p className="shake mt-2 flex items-center gap-2 text-xs font-medium text-red-400">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-400/50 text-[10px]">
                          !
                        </span>
                        {fieldError.email}
                      </p>
                    )}
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

                  {/* Send OTP */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-gold relative w-full overflow-hidden rounded-xl ${gold} gold-text py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#1a1204] shadow-[0_12px_40px_-10px_rgba(212,167,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(232,196,106,0.9)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8c46a]/40 disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {loading ? "Sending OTP…" : "Send OTP"}
                  </button>

                  {/* Back to Login */}
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

                {/* Bottom Info */}
                <div className="mt-7 flex items-center justify-center gap-2 text-xs leading-relaxed text-[#f5ecd7]/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#d4a73c]/60">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
                  </svg>
                  We'll send a verification code to your registered email address.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
