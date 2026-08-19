import React, { useEffect, useState, useRef } from "react";
import {
  FaBell,
  FaUserCircle,
  FaTrash,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
  FaCalendarDay,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../core/lib/supabase";
import { useNotification } from "../../core/context/NotificationContext";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

function Navbar() {
  const navigate = useNavigate();
  const { confirmDialog } = useNotification();
  const [profileImage, setProfileImage] = useState("");
  const [hrName, setHrName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUpcomingInterview, setHasUpcomingInterview] = useState(false);
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [todayApplicants, setTodayApplicants] = useState(0);
  const [todayInterviews, setTodayInterviews] = useState(0);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

 useEffect(() => {
  fetchProfile();
  fetchNotifications();
  fetchTodayStats();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 60000);

  return () => {
    clearInterval(interval);
  };
}, []);

const fetchTodayStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayDate = startOfToday.toISOString().slice(0, 10);

  const { count: applicantCount } = await supabase
    .from("applicants")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfToday.toISOString());

  const { count: interviewCount } = await supabase
    .from("interviews")
    .select("id", { count: "exact", head: true })
    .eq("interview_date", todayDate);

  setTodayApplicants(applicantCount || 0);
  setTodayInterviews(interviewCount || 0);
};

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      profileRef.current &&
      !profileRef.current.contains(event.target)
    ) {
      setShowProfileMenu(false);
    }
    if (
      notificationRef.current &&
      !notificationRef.current.contains(event.target)
    ) {
      setShowNotifications(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
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

  const { data: unreadReplies, error: repliesError } = await supabase
    .from("email_replies")
    .select("id, from_name, from_email, candidate_id, received_at, body_text")
    .eq("is_read", false)
    .order("received_at", { ascending: false });

  if (repliesError) {
    console.log("fetchNotifications (email_replies) error:", repliesError);
  }

  if (error) {
    console.log(error);
  } else {
    const replyItems = (unreadReplies || []).map((row) => ({
      id: `reply-${row.id}`,
      source: "email_reply",
      replyId: row.id,
      title: "New email reply",
      candidate_name: row.from_name || row.from_email || "Unknown sender",
      snippet: (row.body_text || "").trim().slice(0, 100),
      received_at: row.received_at,
      is_read: false,
    }));

    const notificationItems = (data || []).map((row) => ({
      ...row,
      source: "notification",
    }));

    const merged = [...replyItems, ...notificationItems];
    setNotifications(merged);

    const unread = merged.filter(
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

const handleNotificationClick = async (item) => {
  if (item.source === "email_reply") {
    setShowNotifications(false);
    navigate("/mail-inbox", { state: { openReplyId: item.replyId } });
    fetchNotifications();
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", item.id);

  if (!error) {
    fetchNotifications();
  }
};

const handleClearAll = async () => {
  if (notifications.length === 0) return;

  const confirmClear = await confirmDialog(
    "Clear all notifications?",
    { danger: true, confirmLabel: "Clear All" }
  );

  if (!confirmClear) return;

  const notificationIds = notifications
    .filter((item) => item.source === "notification")
    .map((item) => item.id);
  const replyIds = notifications
    .filter((item) => item.source === "email_reply")
    .map((item) => item.replyId);

  if (notificationIds.length > 0) {
    await supabase.from("notifications").delete().in("id", notificationIds);
  }
  if (replyIds.length > 0) {
    await supabase.from("email_replies").update({ is_read: true }).in("id", replyIds);
  }

  fetchNotifications();
};

const handleDelete = async (item) => {
  const confirmDelete = await confirmDialog(
    item.source === "email_reply" ? "Dismiss this reply notification?" : "Delete this notification?",
    { danger: true, confirmLabel: item.source === "email_reply" ? "Dismiss" : "Delete" }
  );

  if (!confirmDelete) return;

  if (item.source === "email_reply") {
    const { error } = await supabase
      .from("email_replies")
      .update({ is_read: true })
      .eq("id", item.replyId);
    if (!error) fetchNotifications();
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", item.id);

  if (!error) {
    fetchNotifications();
  }
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="sh-navbar-offset fixed top-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="h-full flex items-center gap-6 px-8">

        {/* Greeting */}
        <p className="hidden lg:block text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
          {getGreeting()}{hrName ? `, ${hrName.split(" ")[0]}` : ""}
        </p>

        {/* Today's Quick Stats */}
        <div className="hidden md:flex items-center gap-5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <FaUserPlus className="text-blue-500" />
            <span>
              <span className="font-bold text-slate-700">{todayApplicants}</span> new
              applicant{todayApplicants !== 1 ? "s" : ""} today
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-2">
            <FaCalendarDay className="text-emerald-500" />
            <span>
              <span className="font-bold text-slate-700">{todayInterviews}</span>{" "}
              interview{todayInterviews !== 1 ? "s" : ""} today
            </span>
          </span>
        </div>

        {/* Right Side */}
      <div className="flex items-center gap-6 ml-auto relative">

          {/* Notification */}
        <div ref={notificationRef} className="relative">
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
  <div className="fixed left-4 right-4 top-16 md:left-auto md:w-[380px] bg-[#242424] text-white rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden">
    
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <h3 className="font-semibold text-sm">
        Notifications
      </h3>

      <button
        type="button"
        onClick={handleClearAll}
        className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md"
      >
        Clear all
      </button>
    </div>

    <div className="max-h-[420px] overflow-y-auto p-3">
      <p className="text-xs text-gray-300 mb-3">
        Today
      </p>

      {hasUpcomingInterview && (
        <div className="mb-3 rounded-xl p-4 bg-red-500/20 border border-red-400/40">
          <p className="text-sm font-semibold text-red-200">
            🚨 Interview Starting Soon
          </p>

          <p className="text-sm text-red-100 mt-2">
            {upcomingInterview?.candidate_name || "Candidate"}
          </p>

          <p className="text-xs text-red-100/80 mt-1">
            {upcomingInterview?.interview_date} • {upcomingInterview?.interview_time}
          </p>
        </div>
      )}

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-400 p-4">
          No notifications found
        </p>
      ) : (
        notifications.map((item) => (
          <div
            key={item.id}
            onClick={() => handleNotificationClick(item)}
            className={`mb-3 rounded-xl p-4 cursor-pointer border border-white/10 bg-[#3a3a3a] hover:bg-[#444] transition ${
              !item.is_read ? "ring-1 ring-blue-400/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-300 mb-2">
                  {item.source === "email_reply" ? "📧 Mail Reply" : "🔔 Notification"}
                </p>

                <p className="text-sm font-semibold text-white">
                  {item.title || "Interview Scheduled"}
                </p>

                <p className="text-sm font-medium text-gray-200 mt-2">
                  {item.candidate_name || "Candidate"}
                </p>

                {item.source === "email_reply" && item.snippet && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {item.snippet}
                    {item.snippet.length >= 100 ? "…" : ""}
                  </p>
                )}

                {item.source === "email_reply" && item.received_at && (
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    {new Date(item.received_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}

                {(item.interview_date || item.interview_time) && (
                  <p className="text-xs text-gray-400 mt-1">
                    {item.interview_date} • {item.interview_time}
                  </p>
                )}

                {!item.is_read && (
                  <span className="inline-block mt-3 text-xs bg-white/10 px-3 py-1 rounded-md text-gray-200">
                    New notification
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="text-gray-400 hover:text-red-400"
              >
                <FaTrash size={13} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}
        </div>

          {/* Profile */}
          <div ref={profileRef} className="relative">
            <div
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-100 transition"
            >
              <div
                className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  profileImage ? "" : "bg-slate-200"
                }`}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="block w-full h-full max-w-full max-h-full object-cover"
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

            {showProfileMenu && (
              <div className="absolute top-14 right-0 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden py-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/settings");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition"
                >
                  <FaCog className="text-slate-500" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FaSignOutAlt />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Navbar;