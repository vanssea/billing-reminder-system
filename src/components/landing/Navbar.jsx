import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Mulai", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "Testimoni", href: "#testimoni" },
  { label: "FAQ", href: "#faq" },
];

function Logo({ className = "" }) {
  return (
    <a href="#beranda" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-600/30">
        <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        Host<span className="text-brand-600">Flow</span>
      </span>
    </a>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition hover:text-brand-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#harga"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Masuk
          </a>
          <a
            href="#harga"
            className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:shadow-xl hover:shadow-brand-600/40 hover:brightness-110"
          >
            Coba Gratis
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200/70 bg-white px-4 pb-6 pt-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-600"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <a
              href="#harga"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Masuk
            </a>
            <a
              href="#harga"
              className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-brand-600/30"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

export { Logo };
