import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";

import { supabase } from "../supabaseClient";

function Navbar() {
  const [profileImage, setProfileImage] = useState("");
  const [hrName, setHrName] = useState("");
const [companyName, setCompanyName] = useState("");
const [notificationCount, setNotificationCount] = useState(0);
const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);
const [hasUpcomingInterview, setHasUpcomingInterview] = useState(false);
const [upcomingInterview, setUpcomingInterview] = useState(null);

 useEffect(() => {
  fetchProfile();
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
  .from("settings")
  .select("*")
  .eq("id", 1)
  .single();

    if (error) {
      console.log(error);
    } else {
      setProfileImage(data?.profile_image || "");
setHrName(data?.hr_name || "");
setCompanyName(data?.company_name || "");
    }
  };

  const fetchNotifications = async () => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.log(error);
  } else {
    setNotifications(data || []);

    const unread = data.filter(
      (item) => item.is_read === false
    );

    setNotificationCount(unread.length);
    const now = new Date();

const upcomingInterviewData = data.find((item) => {
  if (!item.interview_date || !item.interview_time)
    return false;

  const interviewDateTime = new Date(
    `${item.interview_date}T${item.interview_time}`
  );

  const diffMinutes =
    (interviewDateTime - now) / (1000 * 60);

  return diffMinutes > 0 && diffMinutes <= 30;
});

setHasUpcomingInterview(!!upcomingInterviewData);
setUpcomingInterview(upcomingInterviewData || null);
console.log("UPCOMING:", upcomingInterviewData);
  }
};

const markAsRead = async (id) => {
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", id);

  if (!error) {
    fetchNotifications();
  }
};

  return (
    <div className="fixed top-0 left-[224px] right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="h-full flex items-center justify-between px-8">

        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-2 w-[320px]">
          <FaSearch className="text-slate-400" />

          <input
            type="text"
            placeholder="Search candidates..."
            className="bg-transparent outline-none ml-3 w-full text-sm text-slate-700"
          />
        </div>

        {/* Right Side */}
      <div className="flex items-center gap-6 ml-auto relative">

          {/* Notification */}
         <button
  onClick={() =>
    setShowNotifications(!showNotifications)
  }
  className="relative text-slate-500 hover:text-blue-600 transition"
>
          <FaBell
  size={20}
  className={
    hasUpcomingInterview
      ? "text-red-500 animate-bounce"
      : ""
  }
/>

           {notificationCount > 0 && (
  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
    {notificationCount}
  </span>
)}
          </button>

          {showNotifications && (
  <div className="absolute top-14 right-0 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
    
    <div className="p-4 border-b border-slate-200">
      <h3 className="font-bold text-slate-800">
        Notifications
      </h3>
    </div>

    <div className="max-h-80 overflow-y-auto">
      {hasUpcomingInterview && (
  <div className="bg-red-100 border-l-4 border-red-500 p-4">
    <p className="font-bold text-red-700">
      🚨 Interview Starting Soon
    </p>

   <div className="mt-2 text-sm text-red-700">
  <p>
    👤 {upcomingInterview?.message}
  </p>
</div>
  </div>
)}

      {notifications.length === 0 ? (
        <p className="p-4 text-sm text-slate-500">
          No notifications found
        </p>
      ) : (
        notifications.map((item) => (
         <div
  key={item.id}
  onClick={() =>
    markAsRead(item.id)
  }
  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
              !item.is_read
                ? "bg-blue-50"
                : ""
            }`}
          >
            <p className="font-semibold text-sm text-slate-800">
              {item.title}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {item.message}
            </p>
          </div>
        ))
      )}

    </div>
  </div>
)}

          {/* Profile */}
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition">

            <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FaUserCircle
                  size={34}
                  className="text-blue-600"
                />
              )}
            </div>

            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800">
  {hrName || "Admin"}
</p>

<p className="text-xs text-slate-500">
  {companyName || "Company"}
</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Navbar;