import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationApi";

const profilePathByRole = {
  admin: "/admin/profile",
  client: "/client/profile",
};

const NOTIF_ROLES = {
  superadmin: "SUPERADMIN",
  admin: "ADMIN",
};

// Kode warna per tipe notifikasi: garis kiri + titik + latar saat belum dibaca.
const TYPE_META = {
  PAYMENT_APPROVED: {
    color: "#059669",
    unreadBg: "bg-emerald-500/[0.08]",
  },
  PAYMENT_REJECTED: {
    color: "#dc2626",
    unreadBg: "bg-red-500/[0.07]",
  },
  INVOICE_OVERDUE: {
    color: "#d97706",
    unreadBg: "bg-amber-500/[0.09]",
  },
  REMINDER_FAILED: {
    color: "#3525cd",
    unreadBg: "bg-[#3525cd]/[0.06]",
  },
};

const DEFAULT_TYPE_META = {
  color: "#464555",
  unreadBg: "",
};

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} mnt lalu`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days} hari lalu`;

  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

function NotificationBell({ roleKey }) {
  const apiRole = NOTIF_ROLES[roleKey];

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await getNotifications(apiRole, 15);

      setItems(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch {
      // Diamkan: badge memakai data terakhir yang berhasil dimuat.
    }
  }, [apiRole]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, 30000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleOpen = async () => {
    const next = !open;

    setOpen(next);

    if (next) {
      setLoading(true);
      await fetchData();
      setLoading(false);
    }
  };

  const handleItemClick = async (item) => {
    if (item.is_read) return;

    setItems((prev) =>
      prev.map((n) =>
        n.id === item.id ? { ...n, is_read: true } : n
      )
    );

    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await markNotificationRead(item.id);
    } catch {
      fetchData();
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) =>
      prev.map((n) => ({
        ...n,
        is_read: true,
      }))
    );

    setUnreadCount(0);

    try {
      await markAllNotificationsRead(apiRole);
    } catch {
      fetchData();
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#464555] transition hover:bg-[#eceef0] hover:text-[#3525cd]"
        aria-label="Notifikasi"
      >
        <span className="material-symbols-outlined">
          notifications
        </span>

        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[#f7f9fb] bg-[#dc2626] px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#c7c4d8] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[#191c1e]">
                Notifikasi
              </p>

              {unreadCount > 0 && (
                <span className="rounded-full bg-[#3525cd]/10 px-2 py-0.5 text-[11px] font-bold text-[#3525cd]">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-semibold text-[#3525cd] hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-[380px] divide-y divide-[#eef0f2] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#9a97a9]">
                Memuat…
              </p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10">
                <span className="material-symbols-outlined text-[32px] text-[#c7c4d8]">
                  notifications_none
                </span>

                <p className="text-sm text-[#9a97a9]">
                  Tidak ada notifikasi.
                </p>
              </div>
            ) : (
              items.map((item) => {
                const meta =
                  TYPE_META[item.type] || DEFAULT_TYPE_META;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    style={{ borderLeftColor: meta.color }}
                    className={`flex w-full flex-col gap-1 border-l-[3px] px-4 py-3 text-left transition hover:bg-[#f3f1f7] ${
                      item.is_read ? "" : meta.unreadBg
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          item.is_read ? "opacity-35" : ""
                        }`}
                        style={{
                          backgroundColor: meta.color,
                        }}
                      />

                      <span
                        className={`truncate text-sm ${
                          item.is_read
                            ? "font-medium text-[#777587]"
                            : "font-bold text-[#191c1e]"
                        }`}
                      >
                        {item.title}
                      </span>
                    </span>

                    <span className="block truncate text-xs text-[#9a97a9]">
                      {item.message}
                    </span>

                    <span className="text-[11px] font-medium text-[#aaa7b5]">
                      {relativeTime(item.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const Header = ({ role = "admin" }) => {
  const [showProfile, setShowProfile] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  const { user, signOut } = useAuth();

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

  const displayName =
    user?.full_name || (role === "admin" ? "Admin" : "User");

  const initial = (displayName[0] || "U").toUpperCase();

  const handleProfileClick = () => {
    setShowProfile(false);

    const path = profilePathByRole[role];

    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    setShowProfile(false);

    await signOut();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#c7c4d8] bg-[#f7f9fb] md:left-[280px]">
      <div className="flex h-full items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Notification */}
          {NOTIF_ROLES[role] && (
            <NotificationBell roleKey={role} />
          )}

          {/* Divider */}
          <div className="h-8 w-px bg-[#c7c4d8]" />

          {/* Profile */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[#eceef0]"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e2dfff] text-sm font-bold text-[#3525cd]">
                {initial}
              </div>

              {/* User */}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-[#191c1e]">
                  {displayName}
                </p>

                <p className="text-xs capitalize text-[#777587]">
                  {role}
                </p>
              </div>

              <span className="material-symbols-outlined text-[20px] text-[#777587]">
                expand_more
              </span>
            </button>

            {/* Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-12 w-52 rounded-lg border border-[#c7c4d8] bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#464555] hover:bg-[#eceef0]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    person
                  </span>

                  Profile
                </button>

                <div className="my-1 border-t border-[#e0e3e5]" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#ba1a1a] hover:bg-[#ffdad6]"
                >
                  <span className="material-symbols-outlined">
                    logout
                  </span>

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