
"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
const enquiryTypes = [
  "Medical Counselling & Admissions",
  "NEET / MBBS / BDS Guidance",
  "College & University Information",
  "Technical Support",
  "General Enquiry",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const contactData = Object.fromEntries(formData.entries());
    console.log(contactData);
    try {
    const response = await axios.post("http://localhost:8090/contact",contactData)
    if(response.data.status) {
      toast.success("Enquiry submitted successfully!");
      setSubmitted(true);
    }
    else {
      toast.error(response.data.message || "Failed to submit enquiry.");
    }
    
    }catch(error) {
console.log("Error toast trigger ho raha hai");
      if(axios.isAxiosError(error)) {
      
        toast.error(error.response?.data?.message || "Failed to submit enquiry.");
      }
      else{
      toast.error("Something went wrong. Please try again");
      }
      console.log(error);
      
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-800">
      <style jsx global>{`
        @keyframes contactFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes contactReveal {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .contact-float { animation: contactFloat 5s ease-in-out infinite; }
        .contact-reveal { animation: contactReveal .7s ease-out both; }
        .contact-delay { animation-delay: .15s; }
        @media (prefers-reduced-motion: reduce) {
          .contact-float, .contact-reveal {
            animation: none !important;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#071b3b] via-[#103d69] to-[#087e8b]">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-10 lg:grid-cols-2 lg:px-12 lg:py-24">
          <div className="contact-reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-cyan-100 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              We are here to help
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Let&apos;s make your
              <span className="block text-cyan-300">
                medical journey
              </span>
              easier.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
              Have questions about medical admissions, counselling,
              colleges, or your account? Our support team is here to
              guide students and parents at every step.
            </p>

            <a
              href="#contact-form"
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 font-semibold text-[#103d69] shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-cyan-50"
            >
              Contact our team <span aria-hidden="true">→</span>
            </a>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100">
              <span>✓ Student-focused support</span>
              <span>✓ Admission enquiries</span>
            </div>
          </div>

          {/* Healthcare illustration */}
          <div className="contact-float relative mx-auto w-full max-w-md">
            <div className="absolute inset-8 rounded-full bg-cyan-300/20 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md sm:p-7">
              <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Your future, supported
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-[#103d69]">
                      Medical Counselling
                    </h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-2xl">
                    ✚
                  </div>
                </div>

                <div className="my-7 flex items-center justify-center">
                  <div className="flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-cyan-50 to-blue-100">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl shadow-lg">
                      🩺
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">
                      🎓
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Admission Guidance
                      </p>
                      <p className="text-xs text-slate-500">
                        Support for your next step
                      </p>
                    </div>
                    <span className="ml-auto text-xl text-cyan-600">↗</span>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                      💬
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Personal Assistance
                      </p>
                      <p className="text-xs text-slate-500">
                        We&apos;re ready to listen
                      </p>
                    </div>
                    <span className="ml-auto text-xl text-cyan-600">✓</span>
                  </div>
                </div>
              </div>

              <div className="absolute -left-5 top-1/3 rounded-2xl border border-white/40 bg-white px-4 py-3 shadow-xl sm:-left-8">
                <span className="text-sm font-semibold text-[#103d69]">
                  Your goals matter
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  We&apos;re listening
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact information */}
      <section className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-12 lg:py-20">
        <div className="contact-reveal text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-700">
            Get in touch
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#103d69] sm:text-4xl">
            How can we help you?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            Whether you need admission information or help using our
            platform, choose the best way to reach our team.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: "🎓",
              title: "Admission Support",
              description:
                "Questions about NEET, MBBS, BDS or the counselling process.",
              detail: "Medical counselling enquiries",
              color: "bg-blue-50",
            },
            {
              icon: "🏛️",
              title: "College Information",
              description:
                "Get help finding information about colleges and universities.",
              detail: "College & university enquiries",
              color: "bg-cyan-50",
            },
            {
              icon: "💬",
              title: "General Support",
              description:
                "Need help with your account or have a general question?",
              detail: "Platform & general enquiries",
              color: "bg-emerald-50",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="contact-reveal contact-delay rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-xl"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color} text-2xl`}
              >
                {item.icon}
              </div>
              <h3 className="mt-5 text-xl font-bold text-[#103d69]">
                {item.title}
              </h3>
              <p className="mt-3 min-h-14 leading-7 text-slate-600">
                {item.description}
              </p>
              <a
                href="#contact-form"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-900"
              >
                {item.detail} <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section
        id="contact-form"
        className="mx-auto max-w-7xl scroll-mt-10 px-6 pb-20 sm:px-10 lg:px-12"
      >
        <div className="grid overflow-hidden rounded-[2rem] bg-white shadow-xl ring-1 ring-slate-200 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="bg-gradient-to-br from-[#0c2e55] to-[#087e8b] p-8 text-white sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Contact our team
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              We&apos;d love to hear from you.
            </h2>
            <p className="mt-5 leading-7 text-blue-100">
              Share your question with us. Select the enquiry type so
              your message can be directed appropriately.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  ✉
                </span>
                <div>
                  <p className="font-semibold">Email support</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Add your official support email here.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  ☎
                </span>
                <div>
                  <p className="font-semibold">Phone support</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Add your official contact number here.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-xl">
                  ◷
                </span>
                <div>
                  <p className="font-semibold">Support hours</p>
                  <p className="mt-1 text-sm leading-6 text-blue-100">
                    Add your confirmed working hours here.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5">
              <p className="font-semibold">A note for students</p>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                For official counselling dates, eligibility and seat
                allotment, always verify information with the relevant
                official counselling authority.
              </p>
            </div>
          </aside>

          <div className="p-6 sm:p-10 lg:p-12">
            <h2 className="text-2xl font-bold text-[#103d69]">
              Send us an enquiry
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Fill in the details below. Fields marked with * are required.
            </p>

            {submitted ? (
              <div
                className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
                role="status"
              >
                <div className="text-3xl">✓</div>
                <h3 className="mt-3 text-lg font-bold text-emerald-900">
                  Form validated successfully
                </h3>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  This is a frontend demo. Your enquiry has not been sent
                  or saved yet. Connect the form to your backend to receive
                  real enquiries.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 font-semibold text-emerald-900 underline underline-offset-4"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      required
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      maxLength={254}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Enter phone number"
                      maxLength={20}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="enquiryType"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Enquiry type *
                    </label>
                    <select
                      id="enquiryType"
                      name="enquiryType"
                      required
                      defaultValue=""
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
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
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Subject *
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="What is your enquiry about?"
                    required
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Your message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help..."
                    required
                    minLength={10}
                    maxLength={3000}
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:bg-white focus:ring-4 focus:ring-cyan-600/10"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Please do not include passwords or sensitive medical records.
                  </p>
                </div>

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#103d69] to-[#087e8b] px-6 py-4 font-semibold text-white shadow-lg shadow-cyan-900/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-cyan-600/25"
                >
                  Submit enquiry
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer callout */}
      <section className="px-6 pb-16 sm:px-10">
        <div className="mx-auto max-w-7xl rounded-3xl border border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-8 text-center sm:px-10">
          <h2 className="text-xl font-bold text-[#103d69] sm:text-2xl">
            Your next step starts with the right guidance.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">
            We aim to make your medical counselling journey clearer,
            more organised and easier to navigate.
          </p>
        </div>
      </section>
    </main>
  );
}
