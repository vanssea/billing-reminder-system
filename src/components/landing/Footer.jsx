import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const columns = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", to: "/#fitur" },
      { label: "Harga", to: "/#harga" },
      { label: "Integrasi", to: "/integrasi" },
      { label: "Changelog", to: "/changelog" },
      { label: "Status Sistem", to: "/status-sistem" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", to: "/tentang-kami" },
      { label: "Blog", to: "/blog" },
      { label: "Karir", to: "/karir" },
      { label: "Kontak", to: "/kontak" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "Pusat Bantuan", to: "/pusat-bantuan" },
      { label: "Dokumentasi", to: "/dokumentasi" },
      { label: "Panduan API", to: "/panduan-api" },
      { label: "Komunitas", to: "/komunitas" },
    ],
  },
];

const socials = [
  { name: "x", href: "https://x.com" },
  { name: "instagram", href: "https://instagram.com" },
  { name: "linkedin", href: "https://linkedin.com" },
  { name: "github", href: "https://github.com" },
];

function SocialIcon({ name }) {
  const paths = {
    x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z",
    instagram:
      "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 2.163c-3.259 0-3.667.014-4.947.072-2.404.11-3.65 1.356-3.761 3.76-.058 1.28-.072 1.689-.072 4.948 0 3.259.014 3.668.072 4.948.11 2.403 1.356 3.65 3.761 3.761 1.28.058 1.688.072 4.947.072 3.259 0 3.668-.014 4.948-.072 2.403-.111 3.65-1.357 3.761-3.761.058-1.28.072-1.688.072-4.948 0-3.259-.014-3.667-.072-4.947-.111-2.404-1.356-3.65-3.761-3.761-1.28-.058-1.688-.072-4.948-.072zm0 3.678a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
    linkedin:
      "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z",
    github:
      "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 shadow-lg shadow-brand-600/30">
                <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
              </span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                Host<span className="text-brand-600">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              Web hosting cepat dan handal dengan server NVMe, LiteSpeed, SSL gratis, backup
              harian, dan dukungan teknis 24/7.
            </p>

            <div className="mt-6 flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                >
                  <SocialIcon name={social.name} />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title} className="lg:col-span-2">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-slate-500 transition hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-sm font-medium text-slate-400">
            © 2026 HostFlow. Semua hak dilindungi.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link to="/kebijakan-privasi" className="transition hover:text-brand-600">
              Kebijakan Privasi
            </Link>
            <Link to="/syarat-ketentuan" className="transition hover:text-brand-600">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
