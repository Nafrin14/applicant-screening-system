import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";
import CalendarTracker from "../components/CalendarTracker";
import { formatDateString } from "../utils/helpers";

import {
  FaBars,
  FaBell,
  FaChartLine,
  FaCloudUploadAlt,
  FaFolderOpen,
  FaHistory,
  FaHome,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

export default function SalesDashboard() {
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const loadUserUploadHistory = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

  const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", user.id)
        .single();

      setUserName(profile?.name || user.email?.split("@")[0] || "User");

  const { data, error } = await supabase
        .from("csv_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHistory(data || []);

  const dates = (data || []).map((item) =>
        formatDateString(item.created_at)
      );

      setMarkedDates([...new Set(dates)]);
    } catch (err) {
      console.error("Dashboard loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload CSV file only.");
      return;
    }

    setUploading(true);

    try {
  const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not logged in.");

  const { error } = await supabase.from("csv_uploads").insert([
        {
  user_id: user.id,
  file_name: file.name,
  file_path: file.name,
  status: "success",
}
      ]);

      if (error) throw error;

      await loadUserUploadHistory();
      alert("CSV uploaded successfully.");
    } catch (err) {
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
const generateWeeklyReport = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const today = new Date();

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - 6);

    const { data, error } = await supabase
      .from("csv_uploads")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", firstDay.toISOString());

    if (error) throw error;

    const total = data.length;
    const completed = data.filter(
      (item) => item.status === "success"
    ).length;

    const missing = Math.max(0, 7 - completed);

    const { error: insertError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        report_type: "weekly",
        total_uploads: total,
        completed,
        missing,
      });

    if (insertError) throw insertError;

    alert("Weekly report generated successfully.");
  } catch (err) {
    alert(err.message);
  }
};
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  };

 useEffect(() => {
  loadUserUploadHistory();

  const timer = setInterval(() => {
    setCurrentDateTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, []);

  const today = formatDateString(new Date());
  const uploadedToday = markedDates.includes(today);

  const totalUploads = history.length;
  const completedUploads = history.filter(
    (item) => item.status === "success"
  ).length;
  const missingUploads = uploadedToday ? 0 : 1;

  return (
    <div className="min-h-screen bg-[#021b16] text-white">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.20),transparent_32%),
    radial-gradient(circle_at_bottom_left,rgba(5,150,105,0.14),transparent_35%)] pointer-events-none" />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 bg-[#031f19]/95 border-r border-emerald-400/20 
          backdrop-blur-xl p-6 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
    <div className="mb-10">
    <h2 className="text-emerald-300 tracking-[4px] text-lg font-black">
    KD MARKETING
    </h2>
    <p className="text-white/45 text-sm mt-1">CSV Analysis System</p>
    </div>

    <nav className="space-y-3">
          <SidebarItem icon={<FaHome />} label="Dashboard" active />
          <SidebarItem icon={<FaCloudUploadAlt />} label="Upload CSV" />
          <SidebarItem icon={<FaHistory />} label="Upload History" />
          <SidebarItem icon={<FaChartLine />} label="Reports" />
          <SidebarItem icon={<FaBell />} label="Notifications" badge="1" />
          <SidebarItem icon={<FaUser />} label="Profile" />
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl px-4 py-3 text-red-300 hover:bg-red-500/10 transition"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* Main */}
      <main className="relative z-10 lg:ml-72 min-h-screen">
        {/* Navbar */}
        <header className="sticky top-0 z-20 h-20 bg-[#021b16]/80 backdrop-blur-xl border-b border-emerald-400/20 px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-2xl text-emerald-300"
            >
              <FaBars />
            </button>

            <div>
              <h1 className="text-xl font-black">Dashboard</h1>
              <p className="text-white/45 text-sm hidden sm:block">
                Manage your daily CSV uploads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative text-xl text-white/75">
              <FaBell />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
                1
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center
               justify-center font-black text-emerald-300">
                {userName?.charAt(0)?.toUpperCase()}
              </div>
              <span className="font-bold">{userName}</span>
            </div>
          </div>
        </header>

        <div className="px-6 py-7 md:px-10">
          {/* Welcome */}
          <section className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              
              <h2 className="text-3xl md:text-4xl font-black mt-2">
                Welcome Back, {userName} 👋
              </h2>
              <p className="text-white/55 mt-2">
                Upload your CSV and monitor your daily progress.
              </p>
            </div>

           <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5
            py-3 text-emerald-200">

  <span className="text-lg">📅</span>

  <span className="font-semibold">
    {currentDateTime.toLocaleDateString("en-GB")}
  </span>

  <span className="text-emerald-400">|</span>

  <span className="font-semibold">
    {currentDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })}
  </span>

</div>
          </section>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <Card title="Total Uploads" value={totalUploads} icon={<FaFolderOpen />} />
            <Card title="Completed" value={completedUploads} icon="✅" />
            <Card
              title="Today Status"
              value={uploadedToday ? "Uploaded" : "Not Uploaded"}
              icon="⚠️"
              danger={!uploadedToday}
            />
            <Card
              title="Missing Upload"
              value={missingUploads}
              icon="❌"
              danger={missingUploads > 0}
            />
          </div>

          {!uploadedToday && (
            <div className="mb-6 rounded-3xl border border-red-400/30 bg-red-900/20 p-5 flex flex-col md:flex-row 
            md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-red-300">
                  You have not uploaded today.
                </h3>
                <p className="text-white/60 mt-1">
                  Please upload your CSV file to keep your daily report updated.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current.click()}
                className="bg-gradient-to-r from-emerald-500 to-green-700 px-6 py-3 rounded-xl font-bold shadow-lg
                 shadow-emerald-500/30 hover:scale-105 transition"
              >
                Upload CSV
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="dashboard-card">
              <h2 className="text-xl font-bold mb-5">Upload CSV</h2>

              <div className="border-2 border-dashed border-emerald-400/30 rounded-3xl min-h-[200px] flex flex-col 
              items-center justify-center text-center bg-black/20">
                <FaCloudUploadAlt className="text-6xl text-emerald-300 mb-4" />

                <h3 className="text-xl font-bold">Upload your CSV file</h3>

                <p className="text-white/50 mt-2 mb-5">
                  Select a CSV file from your computer.
                </p>

                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="bg-gradient-to-r from-emerald-500 to-green-700 px-6 py-3 rounded-xl font-bold
                   disabled:opacity-60 hover:scale-105 transition"
                >
                  {uploading ? "Uploading..." : "Browse CSV"}
                </button>
              </div>
            </section>

            <section className="dashboard-card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold">Recent Uploads</h2>
                <span className="text-emerald-300 text-sm font-bold">
                  {history.length} files
                </span>
              </div>

              {loading ? (
                <p className="text-white/60">Loading...</p>
              ) : history.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📂</div>
                  <p className="text-white/50">No CSV uploads available.</p>
                  <p className="text-white/35 text-sm mt-1">
                    Upload your first CSV file to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 5).map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-black/20 border border-white/10 p-4"
                    >
                      <div>
                        <p className="font-bold">📄 {row.file_name}</p>
                        <p className="text-white/45 text-sm mt-1">
                          {new Date(row.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <CalendarTracker markedDates={markedDates} />

            <section className="dashboard-card">
              <h2 className="text-xl font-bold mb-5">Reports</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReportCard
  title="Weekly Report"
  desc="Generate this week summary"
  onClick={generateWeeklyReport}
/>

<ReportCard
  title="Monthly Report"
  desc="Generate this month summary"
  onClick={() => alert("Monthly Report Coming Soon")}
/>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, badge }) {
  return (
    <button
      className={`w-full flex items-center justify-between rounded-2xl px-4 py-3 transition ${
        active
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
          : "text-white/70 hover:bg-white/8 hover:text-white"
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

function Card({ title, value, icon, danger }) {
  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between">
        <p className="text-white/55 font-semibold">{title}</p>
        <span className="text-2xl text-emerald-300">{icon}</span>
      </div>

      <h2
        className={`mt-5 font-black ${
          typeof value === "string" ? "text-2xl" : "text-3xl"
        } ${danger ? "text-red-300" : "text-emerald-300"}`}
      >
        {value}
      </h2>
    </div>
  );
}

function ReportCard({ title, desc, onClick }) {
  return (
    <div className="rounded-2xl bg-black/20 border border-white/10 p-5">
      <div className="text-3xl mb-3">📄</div>
      <h3 className="font-bold">{title}</h3>
      <p className="text-white/45 text-sm mt-1 mb-4">{desc}</p>

      <button
  onClick={onClick}
  className="w-full rounded-xl bg-emerald-500/15 border border-emerald-400/30
  text-emerald-300 font-bold py-3 hover:bg-emerald-500/25"
>
  Generate
</button>
    </div>
  );
}