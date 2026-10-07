import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // UI-only states
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState({});
  const Navigate = useNavigate();

  // Input change ke liye
  const LoginHandlerInput = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });

    setFieldError({
      ...fieldError,
      [name]: "",
    });
  };

  const LoginHandler = async (e) => {
    e.preventDefault();

    const newError = {};

    if (loginForm.email === "") {
      newError.email = "Email field is required";
    }

    if (loginForm.password === "") {
      newError.password = "Password field is required";
    } else if (loginForm.password.length < 8) {
      newError.password = "Password must be at least 8 characters";
    }

    setFieldError(newError);

    // Validation error hai to API call nahi hogi
    if (Object.keys(newError).length > 0) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await axios.post("http://localhost:8090/login-user", {
        email: loginForm.email,
        password: loginForm.password,
      });

      console.log("Response >>>>>>", response.data);

      if (response.data.status) {
        toast.success("Login successful");

        console.log("Login Successfully");
        console.log("Token >>>>>>", response.data.token);

        Navigate("/dashboard");
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Login failed. Check your email and password.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full rounded-xl border bg-white/[0.03] px-4 py-3.5 text-[15px] text-[#f5ecd7] placeholder-[#f5ecd7]/30 outline-none transition-all duration-300 ${
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
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheen { 0% { transform: translateX(-130%) skewX(-22deg); } 100% { transform: translateX(330%) skewX(-22deg); } }
        @keyframes line-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes float-slow { 0%,100% { transform: translateY(0) rotate(45deg); } 50% { transform: translateY(-16px) rotate(45deg); } }
        .glow-pulse { animation: glow-pulse 7s ease-in-out infinite; }
        .gold-text { background-size: 200% auto; animation: gold-flow 7s linear infinite; }
        .fade-up { animation: fade-up .9s cubic-bezier(.2,.8,.2,1) both; }
        .fade-in { animation: fade-in 1.4s ease both; }
        .line-draw { transform-origin: left; animation: line-draw 1.2s .4s cubic-bezier(.2,.8,.2,1) both; }
        .shake { animation: shake .35s ease-in-out; }
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
          .glow-pulse, .gold-text, .fade-up, .fade-in, .line-draw, .shake, .float-slow { animation: none; }
        }
      `}</style>

      {/* ===== Background ===== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="glow-pulse absolute -left-40 top-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#d4a73c]/20 blur-[150px]" />
        <div className="glow-pulse absolute -right-40 bottom-[-15%] h-[42rem] w-[42rem] rounded-full bg-[#b8892a]/20 blur-[160px] [animation-delay:-3s]" />

        {/* fine gold grid */}
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

        {/* diagonal light beam */}
        <div className="absolute -right-20 top-0 h-full w-[40%] -skew-x-12 bg-gradient-to-b from-[#e8c46a]/[0.06] via-transparent to-transparent" />

        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-2 lg:gap-20">
        {/* ===== Right: pitch (desktop only) ===== */}
        <div className="fade-in relative hidden lg:order-2 lg:block">
          {/* floating diamonds */}
          <span className="float-slow absolute -right-4 -top-16 h-10 w-10 border border-[#e8c46a]/40" />
          <span className="float-slow absolute right-24 top-[22rem] h-6 w-6 border border-[#e8c46a]/30 [animation-delay:-4s]" />

          <div className="flex items-center gap-4">
            <span className={`line-draw h-px w-14 ${gold}`} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#d4a73c]">
              Members Access
            </span>
          </div>

          <h1 className="font-serif-lux mt-8 text-6xl font-semibold leading-[1.08] tracking-tight xl:text-7xl">
            Welcome back,
            <br />
            <span
              className={`gold-text ${gold} bg-clip-text italic text-transparent`}
            >
              pick up where
              <br />
              you left off.
            </span>
          </h1>

          <p className="mt-8 max-w-md text-[17px] leading-relaxed text-[#f5ecd7]/55">
            Log in to get back to your account. Everything is exactly how you
            left it.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              "Secure login with your email",
              "Reset your password anytime",
              "Your data stays private",
            ].map((item) => (
              <li key={item} className="flex items-center gap-4 text-[#f5ecd7]/80">
                <span className="flex h-6 w-6 rotate-45 items-center justify-center border border-[#d4a73c]/60 bg-[#d4a73c]/10">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3 -rotate-45 text-[#e8c46a]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ===== Left: form card ===== */}
        <div className="fade-up mx-auto w-full max-w-md lg:order-1">
          {/* gold hairline border */}
          <div
            className={`rounded-[26px] p-px shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),0_0_70px_-25px_rgba(212,167,60,0.35)] ${gold} gold-text`}
          >
            <div className="relative overflow-hidden rounded-[25px] bg-gradient-to-b from-[#121212] to-[#080808] p-8 sm:p-10">
              {/* top glow */}
              <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#d4a73c]/20 blur-[70px]" />

              <div className="relative">
                {/* Emblem */}
                <div className="mb-7 flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 rotate-45 items-center justify-center rounded-lg ${gold} shadow-[0_8px_30px_-6px_rgba(212,167,60,0.7)]`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1a1204"
                      strokeWidth="2.2"
                      className="h-6 w-6 -rotate-45"
                    >
                      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
                      <path strokeLinecap="round" d="M8 10.5V8a4 4 0 118 0v2.5" />
                    </svg>
                  </div>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#d4a73c]/50 to-transparent" />
                </div>

                <h2 className="font-serif-lux text-[2rem] font-semibold leading-tight">
                  Log in to your{" "}
                  <span className={`${gold} gold-text bg-clip-text italic text-transparent`}>
                    account
                  </span>
                </h2>
                <p className="mt-2 text-sm text-[#f5ecd7]/50">
                  Enter your email and password to continue.
                </p>

                <form onSubmit={LoginHandler} className="mt-8 space-y-5" noValidate>
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={LoginHandlerInput}
                      className={inputClass(!!fieldError.email)}
                    />
                    {fieldError.email && (
                      <p className="shake mt-2 flex items-center gap-2 text-xs font-medium text-red-400">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-400/50 text-[10px]">
                          !
                        </span>
                        {fieldError.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label
                        htmlFor="password"
                        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4a73c]/80"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => Navigate("/forgetPassword")}
                        className="text-xs font-medium text-[#e8c46a] transition hover:text-[#fff1c1]"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        placeholder="Your password"
                        value={loginForm.password}
                        onChange={LoginHandlerInput}
                        className={`${inputClass(!!fieldError.password)} pr-16`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold uppercase tracking-widest text-[#f5ecd7]/45 transition hover:text-[#e8c46a]"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    {fieldError.password && (
                      <p className="shake mt-2 flex items-center gap-2 text-xs font-medium text-red-400">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-400/50 text-[10px]">
                          !
                        </span>
                        {fieldError.password}
                      </p>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <p
                      role="alert"
                      className="shake rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn-gold relative w-full overflow-hidden rounded-xl ${gold} gold-text py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#1a1204] shadow-[0_12px_40px_-10px_rgba(212,167,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(232,196,106,0.9)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8c46a]/40 disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {loading ? "Logging in…" : "Log in"}
                  </button>

                  {/* Reset Password */}
                  <button
                    type="button"
                    onClick={() => Navigate("/resetPassword")}
                    className="w-full rounded-xl border border-[#d4a73c]/30 bg-transparent py-3.5 text-sm font-semibold text-[#e8c46a] transition-all duration-300 hover:border-[#e8c46a]/70 hover:bg-[#d4a73c]/10"
                  >
                    Reset password
                  </button>
                </form>

                {/* Signup */}
                <p className="mt-7 text-center text-sm text-[#f5ecd7]/50">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => Navigate("/signup")}
                    className="font-semibold text-[#e8c46a] transition hover:text-[#fff1c1] hover:underline hover:underline-offset-4"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
