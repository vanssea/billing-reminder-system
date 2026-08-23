import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const profilePathByRole = {
  admin: "/admin/profile",
  client: "/client/profile",
};

const Header = ({ role = "admin" }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayName =
    user?.full_name || (role === "admin" ? "Admin" : "User");
  const initial = (displayName[0] || "U").toUpperCase();

  const handleProfileClick = () => {
    setShowProfile(false);
    const path = profilePathByRole[role];
    if (path) navigate(path);
  };

  const handleLogout = async () => {
    setShowProfile(false);
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-[#c7c4d8] bg-[#f7f9fb] md:left-[280px]">
      <div className="flex h-full items-center justify-end px-4 sm:px-6">
        <div className="flex items-center gap-3">

          {/* Notification */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#464555] transition hover:bg-[#eceef0] hover:text-[#3525cd]"
          >
            <span className="material-symbols-outlined">
              notifications
            </span>
          </button>

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
                  <span className="material-symbols-outlined text-[20px]">
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
