import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import QuickActionsFab from "./QuickActionsFab";

function SmartHireLayout() {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar />
      <Navbar />
      <div className="sh-content-offset pt-16 min-h-screen">
        <Outlet />
      </div>
      <QuickActionsFab />
    </div>
  );
}

export default SmartHireLayout;
