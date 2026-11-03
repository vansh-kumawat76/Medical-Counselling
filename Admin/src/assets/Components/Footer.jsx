import React from "react";
import { Link } from "react-router-dom";
import {
  SiYoutube,
  SiInstagram,
  SiGooglemaps,
} from "react-icons/si"
import {FaLinkedin} from "react-icons/fa";
const quickLinks = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Students", to: "/students" },
  { label: "Colleges", to: "/colleges" },
  { label: "Universities", to: "/university" },
];

const academicLinks = [
  { label: "Streams", to: "/stream" },
  { label: "Degrees", to: "/degree" },
  { label: "Courses", to: "/course" },
  { label: "Specializations", to: "/specializations" },
];

const linkClass =
  "inline-block text-slate-400 transition duration-200 hover:translate-x-1 hover:text-blue-400";

const Footer = () => {
  return (
    <footer className="mt-auto w-full border-t border-slate-700 bg-gray-800 text-slate-300">
      {/* ===== TOP ===== */}
      <div className="grid grid-cols-1 gap-8 px-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-600/30">
              M
            </div>
            <span className="text-xl font-bold text-white">
              Medical<span className="text-blue-400">Hub</span>
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            One place to manage students, colleges, universities and courses.
            Simple, fast and secure.
          </p>

         {/* Social Icons */}
<div className="mt-5 flex items-center gap-3">
  {[
    {
      icon: SiYoutube,
      link: "https://www.youtube.com/",
      label: "YouTube",
    },
    {
      icon: SiInstagram,
      link: "https://www.instagram.com/",
      label: "Instagram",
    },
    {
      icon: SiGooglemaps,
      link: "https://maps.google.com/",
      label: "Google Maps",
    },
    {
      icon: FaLinkedin,
      link: "https://www.linkedin.com/",
      label: "LinkedIn",
    },
  ].map(({ icon: Icon, link, label }) => (
    <a
      key={label}
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-lg text-slate-300 transition-all duration-200 hover:-translate-y-1 hover:bg-blue-600 hover:text-white"
    >
      <Icon />
    </a>
  ))}
</div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h3>
          <ul className="space-y-2.5 text-sm">
            {quickLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Academics */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Academics
          </h3>
          <ul className="space-y-2.5 text-sm">
            {academicLinks.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={linkClass}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Contact
          </h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-center gap-3">
              <span>📧</span>
              <a
                href="mailto:support@studenthub.com"
                className="transition hover:text-blue-400"
              >
                support@studenthub.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span>📞</span>
              <a
                href="tel:+910000000000"
                className="transition hover:text-blue-400"
              >
                +91 00000 00000
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span>📍</span>
              <span>Jaipur, Rajasthan, India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ===== BOTTOM ===== */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-700 px-8 py-4 text-xs text-slate-400 sm:flex-row">
        <p>© {new Date().getFullYear()} StudentHub. All rights reserved.</p>

        <div className="flex items-center gap-5">
          <button className="transition hover:text-blue-400">
            Privacy Policy
          </button>
          <button className="transition hover:text-blue-400">
            Terms of Service
          </button>
          <span className="rounded-full bg-slate-700 px-3 py-1 text-slate-300">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;