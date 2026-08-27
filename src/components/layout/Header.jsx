import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  LogOut,
  Package,
  Timer,
  User,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationApi";

const NOTIF_ICONS = {
  PURCHASE_REQUEST: { Icon: Package, iconClass: "bg-brand-50 text-brand-600" },
  PURCHASE_APPROVED: { Icon: CheckCircle2, iconClass: "bg-green-50 text-green-600" },
  PURCHASE_REJECTED: { Icon: XCircle, iconClass: "bg-rose-50 text-rose-600" },
  PAYMENT_NEW: { Icon: CreditCard, iconClass: "bg-blue-50 text-blue-600" },
  PAYMENT_APPROVED: { Icon: CheckCircle2, iconClass: "bg-green-50 text-green-600" },
  PAYMENT_REJECTED: { Icon: XCircle, iconClass: "bg-rose-50 text-rose-600" },
  INVOICE_NEW: { Icon: FileText, iconClass: "bg-indigo-50 text-indigo-600" },
  INVOICE_OVERDUE: { Icon: Timer, iconClass: "bg-amber-50 text-amber-600" },
  REMINDER_FAILED: { Icon: Clock, iconClass: "bg-brand-50 text-brand-600" },
};

const timeAgo = (iso) => {
  if (!iso) return "";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const Header = ({ role = "admin" }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, accessToken, signOut } = useAuth();

  const profilePathByRole = {
    ADMIN: "/admin/profile",
    CLIENT: "/client/profile",
  };

  const profilePath = profilePathByRole[user?.role];

  const loadNotifications = useCallback(async () => {
    try {
      const result = await getNotifications(15, accessToken);
      setNotifications(result.data || []);
      setUnreadCount(result.unread_count || 0);
    } catch {
      setNotifications([]);
    }
  }, [accessToken]);

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(accessToken);
      await loadNotifications();
    } catch {}
  };

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return;

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, is_read: true } : item
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(notification.id, accessToken);
    } catch {
      await loadNotifications();
    }
  };

  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || role.slice(0, 2).toUpperCase();

  const menuRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);

    return () =>
      document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfile(false);

    await signOut();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="app-header fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-all duration-300 print:hidden">
      <div className="flex h-full items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
                if (!showNotifications) {
                  loadNotifications();
                }
              }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
              aria-label="Notifikasi"
            >
              <Bell size={20} />

              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Notifikasi</h3>

                      <p className="text-xs text-slate-500">
                        Pemberitahuan terbaru untuk Anda
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-center text-xs text-slate-400">
                        Belum ada notifikasi
                      </p>
                    ) : (
                      notifications.map((notification) => {
                        const meta =
                          NOTIF_ICONS[notification.type] || {
                            Icon: Bell,
                            iconClass: "bg-slate-100 text-slate-500",
                          };
                        const Icon = meta.Icon;

                        return (
                          <button
                            type="button"
                            key={notification.id}
                            onClick={() => handleMarkRead(notification)}
                            className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                              notification.is_read ? "" : "bg-brand-50/40"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.iconClass}`}
                            >
                              <Icon size={16} />
                            </span>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900">
                                {notification.title}
                              </p>

                              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                {notification.message}
                              </p>

                              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                {!notification.is_read && (
                                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                                )}

                                {timeAgo(notification.created_at)}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
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
                {profilePath && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        navigate(profilePath);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-600"
                    >
                      <User size={18} />

                      Profile
                    </button>

                    <div className="my-1 border-t border-slate-100" />
                  </>
                )}

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
