import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";

const navLinks = [
  { label: "Fitur", to: "/#fitur" },
  { label: "Cara Mulai", to: "/#cara-kerja" },
  { label: "Harga", to: "/#harga" },
  { label: "Testimoni", to: "/#testimoni" },
  { label: "FAQ", to: "/#faq" },
];

function Logo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-600/30">
        <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
      </span>
      <span className="text-xl font-extrabold tracking-tight text-slate-900">
        Host<span className="text-brand-600">Flow</span>
      </span>
    </Link>
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
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-semibold text-slate-600 transition hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:shadow-xl hover:shadow-brand-600/40 hover:brightness-110"
          >
            Daftar Gratis
          </Link>
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
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-600"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 px-5 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-brand-600/30"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export { Logo };
