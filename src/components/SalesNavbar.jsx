import React, { useEffect, useState } from "react";
import { FaBell } from "react-icons/fa";
import { supabase } from "../supabase";

export default function SalesNavbar({
  title = "Dashboard",
  subtitle = "",
  uploadedToday = false,
}) {
  const [userName, setUserName] = useState("User");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [lastLogin, setLastLogin] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  

  useEffect(() => {
    loadUser();
   

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, last_login, profile_image")
      .eq("id", user.id)
      .single();

    setUserName(profile?.name || user.email.split("@")[0]);
    setProfileImage(profile?.profile_image || "");

    if (profile?.last_login) {
      const loginDate = new Date(profile.last_login);
      const today = new Date();

      if (loginDate.toDateString() === today.toDateString()) {
        setLastLogin(
          `Today at ${loginDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}`
        );
      } else {
        setLastLogin(
          loginDate.toLocaleString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        );
      }
    } else {
      setLastLogin("First Login");
    }
  };

  return (
  <header className="sticky top-0 z-20 min-h-24 w-full bg-[#021b16]/80 backdrop-blur-xl border-b
   border-emerald-400/20 pl-16 pr-4 md:px-10 flex items-center justify-between gap-3">
     <div className="min-w-0">
       <h1 className="text-2xl md:text-3xl font-black text-white truncate">
          {title}
        </h1>

        {subtitle && (
          <p className="text-white/45 text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden lg:flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
          <div className="flex items-center gap-2 text-white">
            <span>{currentDateTime.toLocaleDateString("en-GB")}</span>
            <span>|</span>
            <span>{currentDateTime.toLocaleTimeString()}</span>
          </div>

          <p className="text-xs text-emerald-300 mt-1">
            Last Login: {lastLogin}
          </p>
        </div>

        <div className="relative">
          <button
            className="relative text-xl text-white/70 hover:text-white"
            onClick={() => setShowNotifications(!showNotifications)}
          >
           <FaBell className={!uploadedToday ? "bell-shake" : ""} />

           {!uploadedToday && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-xs flex items-center justify-center badge-pulse">
               1
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 rounded-2xl border border-emerald-400/20 bg-[#062820] shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold">
                  Notifications
                </h3>

               
              </div>
{!uploadedToday ? (
  <div className="rounded-xl bg-red-900/20 border border-red-400/30 p-4">
    <p className="text-red-300 font-bold">
      ⚠️ Daily Upload Reminder
    </p>

    <p className="text-white/60 text-sm mt-2">
      You have not uploaded your CSV today.
    </p>
  </div>
) : (
  <p className="text-white/50 text-sm">
    ✅ No new notifications
  </p>
)}

            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 overflow-hidden flex items-center justify-center text-emerald-300 font-bold">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </div>

          <span className="hidden md:block font-semibold text-white">
            {userName}
          </span>
        </div>
      </div>
    </header>
  );
}