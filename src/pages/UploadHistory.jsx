import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import SalesSidebar from "../components/SalesSidebar";
import SalesNavbar from "../components/SalesNavbar";
import {
  FaSearch,
  FaFileCsv,
  FaCheckCircle,
  FaCalendarAlt,
  FaTrash,
  FaFolderOpen,
} from "react-icons/fa";

export default function UploadHistory() {
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const today = new Date().toDateString();

const totalFiles = uploads.length;

const completedFiles = uploads.filter(
  (item) => item.status === "success"
).length;

const todayUploads = uploads.filter(
  (item) =>
    new Date(item.created_at).toDateString() === today
).length;

const deleteUpload = async (id) => {
  console.log("Deleting ID:", id);

  const confirmDelete = window.confirm(
    "Are you sure you want to delete this upload?"
  );

  if (!confirmDelete) return;

 const { data, error } = await supabase
  .from("csv_uploads")
  .delete()
  .eq("id", id)
  .select();

console.log("Deleted Data:", data);
console.log("Delete Error:", error);

  console.log("Delete Error:", error);

  if (error) {
    alert(error.message);
    return;
  }

  loadUploads();
};
  const loadUploads = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("csv_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUploads(data || []);
    } catch (err) {
      console.error("Upload history error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploads();
  }, []);

 const filteredUploads = uploads.filter((item) => {
 const matchesSearch =
  !search ||
  item.file_name?.toLowerCase().includes(search.toLowerCase());

  const uploadDate = new Date(item.created_at);
  const today = new Date();

  const isToday =
    uploadDate.toDateString() === today.toDateString();

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const isThisWeek = uploadDate >= weekAgo;

  const isThisMonth =
    uploadDate.getMonth() === today.getMonth() &&
    uploadDate.getFullYear() === today.getFullYear();

  if (filter === "today") return matchesSearch && isToday;
  if (filter === "week") return matchesSearch && isThisWeek;
  if (filter === "month") return matchesSearch && isThisMonth;

  return matchesSearch;
});

  return (
 <div className="min-h-screen w-screen bg-white text-slate-900 overflow-x-hidden">
  <SalesSidebar />

<main className="min-h-screen w-screen lg:ml-72 lg:w-[calc(100vw-18rem)]">
    <SalesNavbar
  title="Upload History"
  subtitle="View all CSV files uploaded by your account."
/>

  <div className="px-3 py-6 md:p-10">
     <div className="w-full">
       
       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
  <div className="dashboard-card min-h-[170px]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-600 text-sm font-semibold">Total Files</p>
        <h2 className="text-5xl font-black mt-3 text-emerald-600">{totalFiles}</h2>
        <p className="text-slate-400 text-sm mt-2">All uploaded CSV files</p>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
        <FaFolderOpen className="text-2xl text-emerald-600" />
      </div>
    </div>
  </div>

  <div className="dashboard-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-600 text-sm font-semibold">Completed</p>
        <h2 className="text-5xl font-black mt-3 text-emerald-600">{completedFiles}</h2>
        <p className="text-slate-400 text-sm mt-2">Successfully processed</p>
      </div>

      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
        <FaCheckCircle className="text-2xl text-green-600" />
      </div>
    </div>
  </div>

  <div className="dashboard-card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-600 text-sm font-semibold">Uploaded Today</p>
        <h2 className="text-5xl font-black mt-3 text-emerald-600">{todayUploads}</h2>
        <p className="text-slate-400 text-sm mt-2">CSV files uploaded today</p>
      </div>

      <div className="w-14 h-14 rounded-2xl bg-cyan-100 flex items-center justify-center">
        <FaCalendarAlt className="text-2xl text-cyan-600" />
      </div>
    
  </div>
</div>
</div>

       <div className="dashboard-card mb-8 py-8">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 rounded-xl bg-white border border-gray-300 pl-12 pr-4 outline-none text-slate-900
               placeholder:text-slate-400 focus:border-emerald-500 shadow-sm"
            />

          </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
  <button
    onClick={() => setFilter("all")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "all"
        ? "bg-emerald-500 text-white"
        : "bg-white border border-gray-300 text-slate-700 hover:bg-emerald-50"
    }`}
  >
    All
  </button>

  <button
    onClick={() => setFilter("today")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "today"
        ? "bg-emerald-500 text-white"
        : "bg-white border border-gray-300 text-slate-700 hover:bg-emerald-50"
    }`}
  >
    Today
  </button>

  <button
    onClick={() => setFilter("week")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "week"
        ? "bg-emerald-500 text-white"
        : "bg-white border border-gray-300 text-slate-700 hover:bg-emerald-50"
    }`}
  >
    This Week
  </button>

  <button
    onClick={() => setFilter("month")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "month"
        ? "bg-emerald-500 text-white"
        : "bg-white border border-gray-300 text-slate-700 hover:bg-emerald-50"
    }`}
  >
    This Month
  </button>
</div>
        </div>

        <div className="dashboard-card">
          {loading ? (
            <p className="text-slate-600">Loading...</p>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-3">📂</div>
              <p className="text-slate-700 font-semibold">No upload history found.</p>
              <p className="text-slate-400 mt-2">
  Upload your first CSV file to see your history here.
</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl
                   bg-white border border-gray-200 shadow-sm px-6 py-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 
                    flex items-center justify-center text-emerald-600">
                      <FaFileCsv />
                    </div>

                    <div>
                      <h3 className="font-bold">{upload.file_name}</h3>

                      <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <FaCalendarAlt />
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
  
<button
  onClick={() => deleteUpload(upload.id)}
 className="w-10 h-10 rounded-xl bg-red-100 text-red-500 hover:bg-red-500 hover:text-white hover:scale-105 
 transition-all duration-200 flex items-center justify-center"
>
  <FaTrash />
</button>
  <span className="w-fit flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
    <FaCheckCircle />
    Completed
  </span>
</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
      </main>
</div>
  );
}
   
