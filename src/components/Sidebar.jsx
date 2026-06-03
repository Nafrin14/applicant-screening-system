import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaFileUpload,
  FaRobot,
  FaCalendarAlt,
  FaClipboardList,
  FaBriefcase,
  FaSuitcase,
  FaUserFriends,
  FaCog,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Candidates", path: "/results", icon: <FaUsers /> },
    { name: "Resume Upload", path: "/upload", icon: <FaFileUpload /> },
    { name: "AI Results", path: "/ai-results", icon: <FaRobot /> },
    { name: "Interview Schedule", path: "/interview-schedule", icon: <FaCalendarAlt /> },
    { name: "Scheduled Interviews", path: "/scheduled-interviews", icon: <FaClipboardList /> },
    { name: "Job Post", path: "/job-post", icon: <FaBriefcase /> },
    { name: "Posted Jobs", path: "/jobs", icon: <FaSuitcase /> },
    { name: "Indeed Applicants", path: "/indeed-applicants", icon: <FaUserFriends /> },
    { name: "Settings", path: "/settings", icon: <FaCog /> },
  ];

  return (
    <>
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg"
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 left-0 h-screen w-64
          bg-slate-900 text-white p-5
          transition-transform duration-300 z-50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 text-xl"
        >
          ✕
        </button>

        <h1 className="text-2xl font-extrabold mb-10">
          Applicant Screening System
        </h1>

        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className="p-3 rounded-xl cursor-pointer hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;