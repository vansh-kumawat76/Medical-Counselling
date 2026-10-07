import axios from "axios";
import React, { useState } from "react";
import OtpInput from "react-otp-input";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const OtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [page, setPage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  console.log("Full Location >>>>>>", location);
  console.log("Email From Location >>>>>>>", email);
  console.log("OTP >>>>>", page);

  const verifyOtp = async () => {
    setError("");

    // Email nahi mila
    if (!email) {
      setError("Email not found. Please try again.");
      toast.error("Email not found. Please try again.");
      return;
    }

    // OTP validation
    if (page === "") {
      setError("Please enter OTP.");
      toast.warning("Please enter OTP.");
      return;
    }

    if (page.length !== 6) {
      setError("OTP must be 6 digits.");
      toast.warning("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      console.log("Email Sending >>>>>", email);
      console.log("OTP Sending >>>>>", page);

      const response = await axios.post(
        "http://localhost:8090/verify-forget-otp",
        {
          email: email,
          otp: page,
        }
      );

      console.log("Verify OTP Response >>>>>>>>", response.data);

      if (response.data.status) {
        toast.success("OTP verified successfully!");

        setTimeout(() => {
          navigate("/resetPassword", {
            state: {
              email: email,
            },
          });
        }, 1000);
      } else {
        setError(response.data.message || "Invalid OTP. Please try again.");

        toast.error(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "OTP verification failed. Please try again.";

      setError(message);
      toast.error(message);

      console.log("Verify OTP Error >>>>>", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

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
        @keyframes box-in { from { opacity: 0; transform: translateY(14px) scale(.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .glow-pulse { animation: glow-pulse 7s ease-in-out infinite; }
        .gold-text { background-size: 200% auto; animation: gold-flow 7s linear infinite; }
        .fade-up { animation: fade-up .9s cubic-bezier(.2,.8,.2,1) both; }
        .shake { animation: shake .35s ease-in-out; }
        .ring-pulse { animation: ring-pulse 2.6s ease-out infinite; }
        .float-slow { animation: float-slow 9s ease-in-out infinite; }
        .otp-wrap input { animation: box-in .5s cubic-bezier(.2,.8,.2,1) both; }
        .otp-wrap > *:nth-child(1) input { animation-delay: .10s; }
        .otp-wrap > *:nth-child(3) input { animation-delay: .17s; }
        .otp-wrap > *:nth-child(5) input { animation-delay: .24s; }
        .otp-wrap > *:nth-child(7) input { animation-delay: .31s; }
        .otp-wrap > *:nth-child(9) input { animation-delay: .38s; }
        .otp-wrap > *:nth-child(11) input { animation-delay: .45s; }
        .btn-gold::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 35%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent); transform: translateX(-130%) skewX(-22deg); }
        .btn-gold:hover:not(:disabled)::after { animation: sheen .9s ease; }
        @media (prefers-reduced-motion: reduce) {
          .glow-pulse, .gold-text, .fade-up, .shake, .ring-pulse, .float-slow, .otp-wrap input { animation: none; }
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
                        <rect x="3" y="5" width="18" height="14" rx="2.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5l8.5 6 8.5-6" />
                      </svg>
                    </div>
                  </div>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#d4a73c]/50 to-transparent" />
                </div>

                {/* Heading */}
                <h2 className="font-serif-lux text-[2rem] font-semibold leading-tight">
                  Verify your{" "}
                  <span className={`${gold} gold-text bg-clip-text italic text-transparent`}>
                    OTP
                  </span>
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#f5ecd7]/50">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>

                {email && (
                  <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full border border-[#d4a73c]/30 bg-[#d4a73c]/10 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-[#e8c46a]" />
                    <span className="truncate text-sm font-medium text-[#e8c46a]">
                      {email}
                    </span>
                  </div>
                )}

                {/* OTP Section */}
                <div className="mt-8">
                  <label className="mb-4 block text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d4a73c]/80">
                    Enter OTP
                  </label>

                  <div className="otp-wrap flex justify-center">
                    <OtpInput
                      value={page}
                      onChange={(value) => {
                        setPage(value);
                        setError("");
                      }}
                      numInputs={6}
                      containerStyle={{ display: "flex", alignItems: "center" }}
                      renderSeparator={
                        <span className="mx-1 h-1 w-1 rotate-45 bg-[#d4a73c]/40" />
                      }
                      renderInput={(props) => (
                        <input
                          {...props}
                          className={`!h-14 !w-11 rounded-xl border bg-white/[0.03] text-center font-serif-lux text-xl font-semibold text-[#f5ecd7] caret-[#e8c46a] outline-none transition-all duration-300 focus:-translate-y-0.5 focus:bg-white/[0.07] focus:ring-4 ${
                            error
                              ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/10"
                              : "border-[#d4a73c]/25 hover:border-[#d4a73c]/50 focus:border-[#e8c46a] focus:shadow-[0_10px_30px_-10px_rgba(232,196,106,0.5)] focus:ring-[#d4a73c]/15"
                          }`}
                        />
                      )}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <p
                      role="alert"
                      className="shake mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}

                  {/* Verify Button */}
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={loading}
                    className={`btn-gold relative mt-7 w-full overflow-hidden rounded-xl ${gold} gold-text py-4 text-sm font-bold uppercase tracking-[0.2em] text-[#1a1204] shadow-[0_12px_40px_-10px_rgba(212,167,60,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(232,196,106,0.9)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#e8c46a]/40 disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {loading ? "Verifying OTP…" : "Verify OTP"}
                  </button>

                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => navigate("/forgetPassword")}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4a73c]/30 bg-transparent py-3.5 text-sm font-semibold text-[#e8c46a] transition-all duration-300 hover:border-[#e8c46a]/70 hover:bg-[#d4a73c]/10"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M9.7 3.3a1 1 0 010 1.4L5.4 9H17a1 1 0 110 2H5.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                    Change Email
                  </button>
                </div>

                {/* Bottom */}
                <p className="mt-7 text-center text-xs leading-relaxed text-[#f5ecd7]/40">
                  Didn't receive the OTP? Go back and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
