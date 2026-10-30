
"use client";

import { motion } from "motion/react";
import {
  FiHeart,
  FiTarget,
  FiEye,
  FiUsers,
  FiBookOpen,
  FiAward,
  FiShield,
} from "react-icons/fi";

const stats = [
  {
    number: "10,000+",
    label: "Students Helped",
    icon: FiUsers,
  },
  {
    number: "100+",
    label: "Top Colleges",
    icon: FiBookOpen,
  },
  {
    number: "5+",
    label: "Years of Experience",
    icon: FiAward,
  },
  {
    number: "100%",
    label: "Trusted Platform",
    icon: FiShield,
  },
];

const features = [
  {
    icon: FiTarget,
    title: "Our Mission",
    description:
      "Our mission is to bridge the gap between students and their dream medical colleges by providing reliable information, expert guidance and easy access to counselling resources.",
  },
  {
    icon: FiEye,
    title: "Our Vision",
    description:
      "We envision a future where every aspiring medical student can make informed decisions and confidently move towards their dream of building a career in healthcare.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 lg:px-10 lg:py-24">

        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute -left-5 -top-5 h-28 w-28 rounded-full bg-blue-100 blur-2xl" />

          <div className="relative h-72 overflow-hidden rounded-3xl shadow-xl md:h-[450px]">
            <img
              src="/images/students.png"
              alt="Medical students"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute -bottom-6 -right-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-xl md:-right-6"
          >
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <FiHeart size={25} />
            </div>
            <div>
              <p className="font-bold text-slate-900">Your Future Matters</p>
              <p className="text-xs text-slate-500">
                Guiding every step
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="pt-5 md:pt-0"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <FiHeart />
            About Us
          </span>

          <h1 className="mt-6 text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl lg:text-6xl">
            Helping You Build a{" "}
            <span className="text-blue-600">Healthier Future</span>
          </h1>

          <p className="mt-6 text-base leading-8 text-slate-600">
            We are a dedicated platform created to simplify the medical
            admission process for students across India. Our mission is to
            provide accurate information, expert guidance and a seamless
            experience for every aspiring medical student.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <FiShield size={22} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Reliable Information. Better Decisions. Brighter Futures.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Mission & Vision Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 py-20 lg:py-24">

        <div className="mx-auto max-w-7xl">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <span className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              What Drives Us
            </span>

            <h2 className="mt-5 text-3xl font-extrabold text-slate-900 md:text-4xl">
              Guiding Today,{" "}
              <span className="text-blue-600">Building Tomorrow</span>
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              We are committed to making the medical admission journey
              simpler, smarter and more accessible for every student.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                  whileHover={{ y: -8 }}
                  className="rounded-3xl border border-blue-100 bg-white p-8 shadow-sm transition-shadow duration-300 hover:shadow-xl md:p-10"
                >
                  <div className="mb-6 inline-flex rounded-2xl bg-blue-100 p-4 text-blue-600">
                    <Icon size={30} />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-4 leading-8 text-slate-600">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}

          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <span className="rounded-full bg-blue-50 px-5 py-2 text-sm font-semibold text-blue-700">
            Our Achievements
          </span>

          <h2 className="mt-5 text-3xl font-extrabold text-slate-900 md:text-4xl">
            Making a Difference Together
          </h2>

          <p className="mt-4 text-slate-600">
            Our journey is driven by the trust and success of students.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-7">

          {stats.map((stat, index) => {
            const Icon = stat.icon;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-md transition-shadow duration-300 hover:shadow-xl md:p-8"
              >
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Icon size={27} />
                </div>

                <h3 className="text-2xl font-extrabold text-blue-600 md:text-3xl">
                  {stat.number}
                </h3>

                <p className="mt-3 text-sm font-medium text-slate-600 md:text-base">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}

        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-12 text-center text-white shadow-xl md:px-16 md:py-16"
        >
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Your Medical Journey Starts Here
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-blue-100">
            Let us help you find the right information and take the next
            step towards your medical career.
          </p>
        </motion.div>
      </section>

    </main>
  );
}
