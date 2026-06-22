import React, { useEffect, useState, useRef } from "react";
import {
  FaBell,
  FaSearch,
  FaUserCircle,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";

function Navbar() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState("");
  const [hrName, setHrName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUpcomingInterview, setHasUpcomingInterview] = useState(false);
  const [upcomingInterview, setUpcomingInterview] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

 useEffect(() => {
  fetchProfile();
  fetchNotifications();

  const interval = setInterval(() => {
    fetchNotifications();
  }, 60000);

  return () => {
    clearInterval(interval);
  };
}, []);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target)
    ) {
      setShowSearchResults(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };
}, []);

const handleSearchChange = (e) => {
  const value = e.target.value;
  setSearchQuery(value);

  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  if (!value.trim()) {
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
    return;
  }

  debounceRef.current = setTimeout(() => {
    searchApplicants(value.trim());
  }, 300);
};

const searchApplicants = async (query) => {
  setIsSearching(true);

  const { data, error } = await supabase
    .from("applicants")
    .select("id, name, email, role, status")
    .or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%`)
    .order("id", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Search error:", error);
    setSearchResults([]);
    setShowSearchResults(true);
  } else {
    setSearchResults(data || []);
    setShowSearchResults(true);
  }

  setIsSearching(false);
};

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

const handleDelete = async (id) => {
  const confirmDelete = window.confirm(
    "Delete this notification?"
  );

  if (!confirmDelete) return;

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (!error) {
    fetchNotifications();
  }
};

  return (
    <div className="fixed top-0 left-[224px] right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-40">
      <div className="h-full flex items-center justify-between px-8">

        {/* Search */}
        <div
          ref={searchRef}
          className="relative hidden md:flex items-center bg-slate-100 rounded-2xl px-4 py-2 w-[320px]"
        >
          <FaSearch className="text-slate-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            placeholder="Search candidates..."
            className="bg-transparent outline-none ml-3 w-full text-sm text-slate-700"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowSearchResults(false);
              }}
              className="text-slate-400 hover:text-slate-600 text-xs ml-2"
            >
              ✕
            </button>
          )}

          {showSearchResults && (
            <div className="absolute left-0 top-full mt-2 w-full z-50 rounded-2xl bg-white border border-slate-200 shadow-xl">
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Search results
                  </p>
                  {isSearching && (
                    <span className="text-xs text-slate-500">
                      Searching...
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-sm text-slate-500">
                    No candidates found
                  </p>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-200">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                    </div>
                    {searchResults.map((applicant) => (
                      <button
                        key={applicant.id}
                        type="button"
                        onClick={() => {
                          navigate("/candidate-details", {
                            state: applicant,
                          });
                          setShowSearchResults(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {applicant.name || "Unnamed Candidate"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {applicant.email}
                            </p>
                          </div>
                          <span className="text-xs text-slate-500">
                            {applicant.status || "Status unknown"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
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
  <div className="absolute top-14 right-0 w-[380px] bg-[#242424] text-white rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden">
    
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <h3 className="font-semibold text-sm">
        Notifications
      </h3>

      <button
        type="button"
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
            onClick={() => markAsRead(item.id)}
            className={`mb-3 rounded-xl p-4 cursor-pointer border border-white/10 bg-[#3a3a3a] hover:bg-[#444] transition ${
              !item.is_read ? "ring-1 ring-blue-400/40" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-300 mb-2">
                  🔔 Notification
                </p>

                <p className="text-sm font-semibold text-white">
                  {item.title || "Interview Scheduled"}
                </p>

                <p className="text-sm font-medium text-gray-200 mt-2">
                  {item.candidate_name || "Candidate"}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {item.interview_date} • {item.interview_time}
                </p>

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
                  handleDelete(item.id);
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