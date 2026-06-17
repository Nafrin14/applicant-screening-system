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
    className={`flex justify-between items-start p-4 border-b border-slate-100 ${
      !item.is_read ? "bg-blue-50" : ""
    }`}
  >
    <div
      onClick={() => markAsRead(item.id)}
      className="flex-1 cursor-pointer"
    >
      <p className="font-semibold text-sm text-slate-800">
        {item.title}
      </p>

      <p className="text-xs text-slate-500 mt-1">
        {item.message}
      </p>
    </div>

    <button
      onClick={() => handleDelete(item.id)}
      className="ml-3 text-red-500 hover:text-red-700"
    >
      <FaTrash />
    </button>
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