import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import CalendarTracker from "../components/CalendarTracker";
import { formatDateString } from "../utils/helpers";
import confetti from "canvas-confetti";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";
import Papa from "papaparse";
import {
  FaFolderOpen,
  FaCloudUploadAlt,
  FaTrash,
} from "react-icons/fa";

// ─── ACCOUNT MAPPING ──────────────────────────────────────────────────────
// Map account names to region + salesperson
const ACCOUNT_MAPPING = {
  // ROCHESTER — Habil
  "all pro landscaping":        { region: "Rochester", salesperson: "Habil" },
  "bills tress":                { region: "Rochester", salesperson: "Habil" },
  "branch specialist rochester":{ region: "Rochester", salesperson: "Habil" },
  "kd fence and desks":         { region: "Rochester", salesperson: "Habil" },
  "kd landscaping rochester":   { region: "Rochester", salesperson: "Habil" },
  "kd tree service rochester":  { region: "Rochester", salesperson: "Habil" },
  "marbel landscaping rochester":{ region: "Rochester", salesperson: "Habil" },

  // ALBANY — Rahul
  "kd tree albany":             { region: "Albany", salesperson: "Rahul" },
  "kd fence albany":            { region: "Albany", salesperson: "Rahul" },
  "kd landscaping albany":      { region: "Albany", salesperson: "Rahul" },

  // SYRACUSE — Aqsa
  "kd tree syracuse":           { region: "Syracuse", salesperson: "Aqsa" },
  "kd fence syracuse":          { region: "Syracuse", salesperson: "Aqsa" },
  "kd landscaping syracuse":    { region: "Syracuse", salesperson: "Aqsa" },
  "snowiest city tree service": { region: "Syracuse", salesperson: "Aqsa" },
  "syracuse tree service":      { region: "Syracuse", salesperson: "Aqsa" },

  // BUFFALO — Anusha
  "soil & seed landscaping":    { region: "Buffalo", salesperson: "Anusha" },
  "all pro fence":              { region: "Buffalo", salesperson: "Anusha" },
  "redefine landscaping buffalo":{ region: "Buffalo", salesperson: "Anusha" },
  "branch specialists buffalo": { region: "Buffalo", salesperson: "Anusha" },

  // BUFFALO — Raj
  "kd tree buffalo":            { region: "Buffalo", salesperson: "Raj" },
  "kd fence buffalo":           { region: "Buffalo", salesperson: "Raj" },
  "kd pool builders":           { region: "Buffalo", salesperson: "Raj" },

  // BUFFALO — Chirag
  "kd landscaping and snow plowing": { region: "Buffalo", salesperson: "Chirag" },

  // ERIE — Vidhya
  "kd landscaping erie":        { region: "Erie", salesperson: "Vidhya" },

  // BELMONT/MOORE — Shakeel
  "kd tree belmont":            { region: "Belmont", salesperson: "Shakeel" },
  "kd tree service moore":      { region: "Moore", salesperson: "Shakeel" },
};

// Fallback region-only lookup if account name match fails
const ACCOUNT_OWNERS = {
  Albany:    "Rahul",
  Rochester: "Habil",
  Syracuse:  "Aqsa",
  Buffalo:   "Anusha",
};

// ─── HELPER: Match filename to account ──────────────────────────────────
function lookupAccount(fileName) {
  const cleanName = fileName.toLowerCase().replace(/\.csv$/, '');
  
  // Try exact substring match against known account names
  for (const [key, value] of Object.entries(ACCOUNT_MAPPING)) {
    if (cleanName.includes(key)) {
      return { accountName: key, ...value };
    }
  }
  
  // If no match, try to detect by city name
  let region = "Other / Unassigned";
  let salesperson = "Unassigned";
  
  if (cleanName.includes("albany")) {
    region = "Albany";
    salesperson = ACCOUNT_OWNERS["Albany"];
  } else if (cleanName.includes("rochester")) {
    region = "Rochester";
    salesperson = ACCOUNT_OWNERS["Rochester"];
  } else if (cleanName.includes("syracuse")) {
    region = "Syracuse";
    salesperson = ACCOUNT_OWNERS["Syracuse"];
  } else if (cleanName.includes("buffalo")) {
    region = "Buffalo";
    salesperson = ACCOUNT_OWNERS["Buffalo"];
  } else if (cleanName.includes("nyc") || cleanName.includes("new york")) {
    region = "NYC Metro";
    salesperson = "Unassigned";
  }
  
  return { accountName: cleanName, region, salesperson };
}

export default function SalesDashboard() {
  const fileInputRef = useRef(null);
 
  const [history, setHistory] = useState([]);
  const [markedDates, setMarkedDates] = useState([]);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
 
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
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const invalidFiles = files.filter(
      (file) => !file.name.toLowerCase().endsWith(".csv")
    );

    if (invalidFiles.length > 0) {
      alert("Please upload CSV files only.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not logged in.");

      // Step A: Save file to csv_uploads and get back the ID
      const uploadData = files.map((file) => ({
        user_id: user.id,
        file_name: file.name,
        file_path: file.name,
        status: "success",
      }));

      const { data: insertedFiles, error: uploadError } = await supabase
        .from("csv_uploads")
        .insert(uploadData)
        .select();

      if (uploadError) throw uploadError;

      // Step B: Parse each CSV file and save rows to sales_leads
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const csvUploadId = insertedFiles[i].id;

        console.log(`📁 Processing file ${i + 1}:`, file.name);
        console.log("📋 CSV Upload ID:", csvUploadId);

        await new Promise((resolve) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              console.log("STEP 1 - Papa parsed rows:", results.data.length);
              console.log("STEP 2 - Headers:", Object.keys(results.data[0] || {}));
              console.log("STEP 3 - First row:", results.data[0]);

              // ─── FIX: Use lookupAccount to get region and salesperson ───
              const fileName = file.name.toLowerCase();
              const match = lookupAccount(fileName);
              
              const location = match?.region || "Other / Unassigned";
              const salesperson = match?.salesperson || "Unassigned";

              console.log("STEP 3.5 - Matched account:", match);

              // Determine business line from filename
              let businessLine = "General Pipeline";
              if (fileName.includes("fence") || fileName.includes("fencing")) {
                businessLine = "Fencing";
              } else if (fileName.includes("tree") || fileName.includes("branch")) {
                businessLine = "Tree Service";
              } else if (fileName.includes("landscaping") || fileName.includes("landscap")) {
                businessLine = "Landscaping";
              } else if (fileName.includes("pool")) {
                businessLine = "Pool Building";
              } else if (fileName.includes("power wash") || fileName.includes("powerwash")) {
                businessLine = "Power Washing";
              } else if (fileName.includes("snow") || fileName.includes("plow")) {
                businessLine = "Snow Removal";
              }

              // ─── FIX: Add salesperson to leadRows ──────────────────────
              const leadRows = results.data.map((row) => ({
                user_id: user.id,
                csv_upload_id: csvUploadId,
                name: row["Opportunity name"] || row["Primary Contact name"] || row["Name"] || row["name"] || "",
                phone: row["Phone number"] || row["Phone"] || row["phone"] || "",
                location: location,
                business_line: businessLine,
                salesperson: salesperson, // ✅ NEW: Store salesperson
                stage: row["Stage"] || row["stage"] || "",
                lead_date: row["Created on"] || row["Date"] || row["date"] || "",
              }));

              console.log("STEP 4 - Lead rows built:", leadRows.length);
              console.log("STEP 5 - First lead row:", leadRows[0]);

              if (leadRows.length > 0) {
                const { data, error: leadError } = await supabase
                  .from("sales_leads")
                  .insert(leadRows)
                  .select();

                console.log("STEP 6 - Insert result:", data);
                console.log("STEP 7 - Insert error:", leadError);

                if (leadError) {
                  console.error("❌ Error inserting leads:", leadError);
                } else {
                  console.log(`✅ Successfully inserted ${leadRows.length} leads`);
                }
              } else {
                console.warn("⚠️ No rows to insert for file:", file.name);
              }

              resolve();
            },
            error: (error) => {
              console.error("❌ Papa Parse error:", error);
              resolve();
            },
          });
        });
      }

      await loadUserUploadHistory();

      confetti({
        particleCount: 250,
        spread: 130,
        origin: { y: 0.6 },
      });

      setUploadedFileName(
        files.length === 1
          ? files[0].name
          : `${files.length} CSV files uploaded`
      );

      setUploadToast(true);

      setTimeout(() => {
        setUploadToast(false);
      }, 2500);
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const deleteUpload = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this upload?"
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("csv_uploads")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadUserUploadHistory();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadUserUploadHistory();
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
      {uploadToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
          <div className="flex items-center gap-4 rounded-2xl bg-white text-black px-6 py-4 shadow-2xl border border-emerald-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-black">
              ✓
            </div>

            <div>
              <h3 className="font-black text-lg">
                Upload Successful
              </h3>

              <p className="text-sm text-gray-500">
                {uploadedFileName}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.20),transparent_32%),
      radial-gradient(circle_at_bottom_left,rgba(5,150,105,0.14),transparent_35%)] pointer-events-none" />

      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Dashboard"
          subtitle="Upload your CSV and monitor your daily progress."
          uploadedToday={uploadedToday}
        />

        <div className="px-6 py-7 md:px-10">
          <section className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="text-3xl md:text-4xl font-black mt-2">
                Welcome Back, {userName} 👋
              </h2>
            </div>
          </section>

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
            multiple
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
                  {uploading ? "Uploading..." : "Browse CSV Files"}
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

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold">
                          Completed
                        </span>

                        <button
                          onClick={() => deleteUpload(row.id)}
                          className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition flex items-center justify-center"
                          title="Delete Upload"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <CalendarTracker markedDates={markedDates} />
          </div>
        </div>
      </main>
    </div>
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