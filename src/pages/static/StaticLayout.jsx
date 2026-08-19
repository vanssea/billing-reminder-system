import Navbar from "../../components/landing/Navbar";
import Footer from "../../components/landing/Footer";

export default function StaticLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white" />
            <div className="absolute left-1/2 top-[-8rem] h-72 w-[40rem] -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
            <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
              HostFlow
            </p>
            <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
