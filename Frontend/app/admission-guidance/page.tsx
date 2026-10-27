
export default function AdmissionGuidancePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-4 text-4xl font-bold text-slate-900 sm:text-5xl">
          Admission Guidance
        </h1>

        <p className="mb-12 max-w-3xl text-lg leading-8 text-slate-600">
          Understand the medical college admission process, counselling
          steps, and important information to help you make informed decisions.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">📝</div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Registration
            </h2>
            <p className="leading-7 text-slate-600">
              Learn about registration and the details required to begin the
              counselling process.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">📄</div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Document Preparation
            </h2>
            <p className="leading-7 text-slate-600">
              Keep your academic certificates, identity proof, and other
              required documents ready.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-3xl">🎓</div>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">
              Choice Filling
            </h2>
            <p className="leading-7 text-slate-600">
              Compare colleges and review their courses, preferences, and
              admission requirements before making your choices.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold text-blue-900">
            Important Reminder
          </h2>
          <p className="leading-7 text-blue-800">
            Counselling rules, eligibility, and deadlines can vary by course
            and counselling authority. Always verify the latest information
            through the relevant official website.
          </p>
        </div>
      </div>
    </main>
  );
}
