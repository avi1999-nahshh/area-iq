import { WaitlistForm } from "./waitlist-form";
import { MapExplorer } from "./map-explorer";
import { CompareCard } from "./compare-card";

const features = [
  {
    num: "01",
    title: "Public infrastructure",
    description:
      "Hospitals, schools, shopping, and transit connectivity scored and mapped for any pincode.",
  },
  {
    num: "02",
    title: "Air quality",
    description:
      "Live AQI, PM2.5 levels, and seasonal pollution patterns from government monitoring stations.",
  },
  {
    num: "03",
    title: "Safety",
    description:
      "Crime indices, FIR trends, police station proximity, and night-time walkability scores.",
  },
  {
    num: "04",
    title: "Cleanliness score",
    description:
      "Ward-level garbage complaint data, Swachh Survekshan rankings, and drain density.",
  },
  {
    num: "05",
    title: "Property & rentals",
    description:
      "Buying and rental rates per sq ft, year-on-year price trend, and active builders in the area.",
  },
  {
    num: "06",
    title: "Key contacts",
    description:
      "Your MP, MLA, Ward Councillor, and local police officers — always current, one tap away.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-[family-name:var(--font-geist-sans)] grain">
      {/* Skip to content */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {/* Nav */}
      <header
        className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between animate-fade-in-up"
        style={{ animationDelay: "0ms" }}
      >
        <span className="font-semibold text-lg tracking-tight text-slate-900">
          Area<span className="text-amber-500">IQ</span>
        </span>
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          Early access
        </span>
      </header>

      <main id="main" className="flex-1">
        {/* Hero — asymmetric 2-col */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1fr_460px] gap-16 items-center">
          {/* Left: copy */}
          <div>
            <p
              className="text-sm font-medium text-amber-600 mb-6 animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              Neighbourhood intelligence for India
            </p>

            <h1
              className="text-5xl sm:text-6xl font-bold tracking-tighter leading-none text-slate-900 mb-6 text-balance animate-fade-in-up"
              style={{ animationDelay: "160ms" }}
            >
              Search, compare, and choose
              <br />
              <span className="text-amber-500">your next neighbourhood.</span>
            </h1>

            <p
              className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg text-balance animate-fade-in-up"
              style={{ animationDelay: "240ms" }}
            >
              Type any two pincodes. Get a side-by-side report card — safety,
              air quality, infrastructure, property prices, government contacts —
              so you can decide with data, not gut feeling.
            </p>

            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "320ms" }}
            >
              <WaitlistForm />
            </div>

          </div>

          {/* Right: comparison card */}
          <div
            className="hidden lg:flex justify-center animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <CompareCard />
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-slate-200/70" />
        </div>

        {/* Map explorer */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-10">
            <p className="text-sm font-medium text-amber-600 mb-3">
              Explore before you decide
            </p>
            <h2 className="text-4xl font-bold tracking-tighter leading-none text-slate-900 text-balance">
              Find your neighbourhood on the map.
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg text-balance leading-relaxed">
              Filter by what matters most — safety, air quality, or affordability —
              and see how every area in Bengaluru stacks up at a glance.
            </p>
          </div>
          <MapExplorer />
        </section>

        {/* Divider */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-t border-slate-200/70" />
        </div>

        {/* Features — numbered editorial 2-col list */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="mb-14">
            <p className="text-sm font-medium text-amber-600 mb-3">
              What&apos;s in every report
            </p>
            <h2 className="text-4xl font-bold tracking-tighter leading-none text-slate-900 text-balance">
              Six data layers. Every pincode.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-0 border-t border-slate-200/70">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={[
                  "group flex gap-6 py-8 transition-colors duration-200 hover:bg-amber-50/40",
                  i % 2 === 0
                    ? "sm:pr-12 sm:border-r sm:border-slate-200/70"
                    : "sm:pl-12",
                  i < features.length - 2 ? "border-b border-slate-200/70" : "",
                ].join(" ")}
              >
                <span className="text-2xl font-bold text-amber-200 group-hover:text-amber-300 tabular-nums pt-0.5 shrink-0 transition-colors duration-200 leading-none">
                  {f.num}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1.5 text-sm group-hover:text-amber-700 transition-colors duration-200">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-amber-100 bg-amber-50/60">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold tracking-tighter leading-none text-slate-900 mb-4 text-balance">
                Know your neighbourhood before you move.
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Get early access and be the first to compare any two pincodes in India.
              </p>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 px-6 py-6 bg-[#fdfcf7]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-semibold text-slate-900 text-sm">
            Area<span className="text-amber-500">IQ</span>
          </span>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors duration-200">Terms</a>
            <span>© {new Date().getFullYear()} AreaIQ. Built for India.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
