const brands = [
  "NusantaraWeb",
  "KopiKita",
  "MedikaRaya",
  "Sekolahku",
  "GunaWangi",
  "Bangkit.co",
  "Aruna Digital",
  "TaniMaju",
];

export default function LogoMarquee() {
  const doubled = [...brands, ...brands];

  return (
    <section className="border-y border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          Dipercaya oleh tim teknologi di seluruh Indonesia
        </p>

        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee items-center gap-14 pr-14">
            {doubled.map((brand, i) => (
              <span
                key={`${brand}-${i}`}
                className="text-xl font-extrabold tracking-tight text-slate-300 transition hover:text-brand-500"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
