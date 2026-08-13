import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  FaTachometerAlt,
  FaUsers,
  FaFileUpload,
  FaRobot,
  FaCalendarAlt,
  FaClipboardList,
  FaBriefcase,
  FaComments,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

const EXPANDED_WIDTH = "224px";
const COLLAPSED_WIDTH = "80px";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sh-sidebar-width",
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    );
  }, [collapsed]);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaTachometerAlt /> },
    { name: "Jobs", path: "/jobs", icon: <FaBriefcase /> },
    { name: "Candidates", path: "/results", icon: <FaUsers /> },
    { name: "Resume Upload", path: "/upload", icon: <FaFileUpload /> },
    { name: "AI Results", path: "/ai-results", icon: <FaRobot /> },
    { name: "Conversations", path: "/conversations", icon: <FaComments /> },
    {
      name: "Interview Schedule",
      path: "/interview-schedule",
      icon: <FaCalendarAlt />,
    },
    {
      name: "Scheduled Interviews",
      path: "/scheduled-interviews",
      icon: <FaClipboardList />,
    },
  ];

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-xl shadow-lg"
      >
        ☰
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen ${
          collapsed ? "w-20" : "w-56"
        } bg-white border-r border-slate-200 z-50 transition-[width,transform] duration-300 ease-in-out overflow-visible ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Close Button (mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 text-xl text-slate-600"
        >
          ✕
        </button>

        {/* Collapse Toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex absolute top-8 -right-3 w-6 h-6 rounded-full bg-blue-600 text-white items-center justify-center shadow-md hover:bg-blue-700 transition-colors z-10"
        >
          {collapsed ? (
            <FaChevronRight className="text-[10px]" />
          ) : (
            <FaChevronLeft className="text-[10px]" />
          )}
        </button>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-200 overflow-hidden">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
              <FaBriefcase className="text-blue-600 text-lg" />
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
              }`}
            >
              <h1 className="text-2xl font-black text-slate-800 whitespace-nowrap">
                SmartHire
              </h1>

              <p className="text-xs text-slate-400 whitespace-nowrap">
                AI Recruitment Platform
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-3">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <li
                  key={item.name}
                  onClick={() => goTo(item.path)}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all ${
                    collapsed ? "justify-center" : "gap-3"
                  } ${
                    active
                      ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span
                    className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                    }`}
                  >
                    {item.name}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
