
import Link from "next/link";

export default function Footer() {
  const currentYear = 2026;

  return (
    <footer className="m-0 w-full bg-slate-900 p-0 text-slate-300">
      <div className="grid grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
        {/* Platform Info */}
        <div>
          <h2 className="text-xl font-bold text-white">
            Medical Counselling Platform
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            Explore medical colleges, understand admission guidance, and
            make informed decisions about your medical education.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-white">Quick Links</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/college" className="transition hover:text-white">
                Explore Colleges
              </Link>
            </li>
            <li>
              <Link
                href="/admission-guidance"
                className="transition hover:text-white"
              >
                Admission Guidance
              </Link>
            </li>
          </ul>
        </div>

        {/* Student Support */}
        <div>
          <h3 className="font-semibold text-white">Student Support</h3>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Need help understanding the admission process? Explore our
            admission guidance and available college information.
          </p>
          <Link
            href="/admission-guidance"
            className="mt-4 inline-flex font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Get Guidance →
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
       © 2026 Medical Counselling Platform. All rights reserved.
      </div>
    </footer>
  );
}
