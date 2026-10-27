
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Section 1: Image Left, Text Right */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2 lg:px-10 lg:py-16">
       <div className="h-72 overflow-hidden rounded-2xl md:h-96">
  <img
    src="/images/students.png"
    alt="Medical students"
    className="h-full w-full object-cover"
  />
</div>
        <div>
          <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            About Us
          </span>

          <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
            Helping You Build a Healthier Future
          </h1>

          <p className="mt-5 leading-7 text-slate-600">
            We are a dedicated platform created to simplify the medical
            admission process for students across India. Our mission is to
            provide accurate information, expert guidance and a seamless
            experience for every aspiring medical student.
          </p>
        </div>
      </section>

      {/* Section 2: Text Left, Image Right */}
      <section className="bg-blue-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2 lg:px-10 lg:py-16">
          <div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-blue-700">
              Our Mission & Vision
            </span>

            <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
              Guiding Today, Building Tomorrow
            </h2>

            <p className="mt-5 leading-7 text-slate-600">
              Our mission is to bridge the gap between students and their
              dream medical colleges by providing reliable information,
              expert guidance and easy access to counselling resources.
            </p>
          </div>

               <div className="h-72 overflow-hidden rounded-2xl md:h-96">
  <img
    src="/images/liveImages.jpg"
    alt="Medical students"
    className="h-full w-full object-cover"
  />
</div>
        </div>
      </section>

      {/* Section 3: Platform Statistics */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-12 text-center md:grid-cols-4 lg:px-10">
        <div>
          <h3 className="text-3xl font-bold text-blue-600">10,000+</h3>
          <p className="mt-2 text-sm text-slate-600">Students Helped</p>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-blue-600">100+</h3>
          <p className="mt-2 text-sm text-slate-600">Top Colleges</p>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-blue-600">5+</h3>
          <p className="mt-2 text-sm text-slate-600">Years of Experience</p>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-blue-600">100%</h3>
          <p className="mt-2 text-sm text-slate-600">Trusted Platform</p>
        </div>
      </section>
    </main>
  );
}
