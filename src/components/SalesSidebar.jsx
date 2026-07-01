import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaHistory,
  FaChartLine,
  FaUser,
  FaSignOutAlt,
  FaTimes,
  FaBars,
} from "react-icons/fa";
import { supabase } from "../supabase";

export default function SalesSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const goTo = (path) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[70] w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg"
      >
        <FaBars />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/70"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-[60]
          h-screen w-[82vw] max-w-72
          bg-[#031f19] border-r border-emerald-400/20
          backdrop-blur-xl p-6
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:w-72
        `}
      >
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden absolute top-5 right-5 text-white/70"
        >
          <FaTimes />
        </button>

        <div className="mb-10">
          <h2 className="text-emerald-300 tracking-[4px] text-lg font-black">
            KD MARKETING
          </h2>

          <p className="text-white/45 text-sm mt-1">
            CSV Analysis System
          </p>
        </div>

        <nav className="space-y-3">
          <SidebarItem
            icon={<FaHome />}
            label="Dashboard"
            active={location.pathname === "/sales-dashboard"}
            onClick={() => goTo("/sales-dashboard")}
          />

          <SidebarItem
            icon={<FaHistory />}
            label="Upload History"
            active={location.pathname === "/upload-history"}
            onClick={() => goTo("/upload-history")}
          />

          <SidebarItem
            icon={<FaChartLine />}
            label="Reports"
            active={location.pathname === "/sales-reports"}
            onClick={() => goTo("/sales-reports")}
          />

          <SidebarItem
            icon={<FaUser />}
            label="Profile"
            active={location.pathname === "/profile"}
            onClick={() => goTo("/profile")}
          />
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-red-300 hover:bg-red-500/10 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </aside>
    </>
  );
}

function SidebarItem({ icon, label, active, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 transition ${
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>

      {badge && (
        <span className="w-6 h-6 rounded-full bg-red-500 text-xs flex items-center justify-center text-white">
          {badge}
        </span>
      )}
    </button>
  );
}