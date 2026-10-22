
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-auto w-full bg-slate-900 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row">

          <div>
            <h2 className="text-2xl font-bold">
              StudentHub
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Medical Counselling System
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Explore universities and manage
              educational information easily.
            </p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Quick Links</h3>

            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
              <Link to="/colleges" className="hover:text-white">Colleges</Link>
              <Link to="/students" className="hover:text-white">Students</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">Contact</h3>

            <p className="text-sm text-slate-400">
              Email: support@Studenthub.com
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Education Management Portal
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-slate-700 pt-5 text-center">
          <p className="text-sm text-slate-400">
            © 2026 StudentHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;