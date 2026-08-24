import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  LogOut,
  Timer,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const notifications = [
  {
    id: 1,
    icon: Timer,
    iconClass: "bg-amber-50 text-amber-600",
    title: "INV-0011 mendekati jatuh tempo",
    description: "Jatuh tempo 3 hari lagi. Segera lakukan pembayaran.",
    time: "2 jam lalu",
    unread: true,
  },
  {
    id: 2,
    icon: Clock,
    iconClass: "bg-brand-50 text-brand-600",
    title: "Pembayaran PAY-0002 menunggu verifikasi",
    description: "Bukti transfer sedang diperiksa oleh admin.",
    time: "5 jam lalu",
    unread: true,
  },
  {
    id: 3,
    icon: XCircle,
    iconClass: "bg-rose-50 text-rose-600",
    title: "Pembayaran PAY-0003 ditolak",
    description: "Nominal transfer tidak sesuai dengan tagihan.",
    time: "1 hari lalu",
    unread: true,
  },
  {
    id: 4,
    icon: CheckCircle2,
    iconClass: "bg-green-50 text-green-600",
    title: "Pembayaran PAY-0004 disetujui",
    description: "INV-0007 telah ditandai lunas.",
    time: "3 hari lalu",
    unread: false,
  },
];

const Header = ({ role = "admin", collapsed = false }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || role.slice(0, 2).toUpperCase();

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-all duration-300 print:hidden ${
        collapsed ? "md:left-20" : "md:left-[280px]"
      }`}
    >
      <div className="flex h-full items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
              aria-label="Notifikasi"
            >
              <Bell size={20} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>

                    <p className="text-xs text-slate-500">
                      Pemberitahuan terbaru untuk Anda
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex gap-3 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notification.iconClass}`}
                        >
                          <notification.icon size={16} />
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900">
                            {notification.title}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {notification.description}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            {notification.unread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                            )}

                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-xs font-bold text-white shadow-md shadow-brand-600/30">
                {initials}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {user?.full_name || "User Name"}
                </p>

                <p className="max-w-[200px] truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </div>

              <ChevronDown
                size={18}
                className={`text-slate-500 transition-transform ${
                  showProfile ? "rotate-180" : ""
                }`}
              />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-12 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/client/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
                >
                  <User size={18} />

                  Profile
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={18} />

                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;