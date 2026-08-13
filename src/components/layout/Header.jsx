import { useState } from "react";

const Header = ({ role = "admin" }) => {
  const [showProfile, setShowProfile] = useState(false);

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
          <div className="relative">

            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-[#eceef0]"
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e2dfff]">
                <span className="material-symbols-outlined text-[#3525cd]">
                  person
                </span>
              </div>

              {/* User */}
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-[#191c1e]">
                  User Name
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
                  onClick={() => setShowProfile(false)}
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