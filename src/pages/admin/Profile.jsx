import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import { Fingerprint, Mail, ShieldCheck, UserRound } from "lucide-react";

const initials = (name) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export default function AdminProfile() {
  const { user } = useAuth();

  const rows = [
    { label: "Nama Lengkap", value: user?.full_name || "-", icon: UserRound },
    { label: "Email", value: user?.email || "-", icon: Mail },
    { label: "Role", value: user?.role || "-", icon: ShieldCheck },
    { label: "User ID", value: user?.id || "-", icon: Fingerprint },
  ];

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 md:pl-[280px]">
      <Sidebar role="admin" />
      <Header />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Profil Saya</h1>
            <p className="mt-1 text-sm text-white/80">
              Informasi akun admin yang sedang masuk.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-[#e5e2ea] bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4 border-b border-[#f0edf3] p-6 sm:flex-row sm:p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3525cd] to-[#5b44f3] text-2xl font-bold text-white">
              {initials(user?.full_name)}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-[#191c1e]">
                {user?.full_name || "-"}
              </h2>
              <p className="mt-0.5 text-sm text-[#777587]">{user?.email}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#eeeafe] px-3 py-1 text-xs font-bold text-[#3525cd]">
                <ShieldCheck size={13} />
                {user?.role || "-"}
              </span>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 sm:p-8">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="rounded-xl border border-[#e8e6ee] bg-white p-4"
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className="text-[#aaa7b5]" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9996a5]">
                      {row.label}
                    </p>
                  </div>
                  <p className="mt-2 truncate text-sm font-bold text-[#191c1e]">
                    {row.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
