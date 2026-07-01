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
 <div className="min-h-screen w-screen bg-[#021b16] text-white overflow-x-hidden">
  <SalesSidebar />

<main className="min-h-screen w-screen lg:ml-72 lg:w-[calc(100vw-18rem)]">
    <SalesNavbar
  title="Upload History"
  subtitle="View all CSV files uploaded by your account."
/>

  <div className="px-3 py-6 md:p-10">
     <div className="w-full">
       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

  <div className="dashboard-card">
    <p className="text-white/50 text-sm">
      Total Files
    </p>

    <h2 className="text-4xl font-black mt-3 text-emerald-300">
      {totalFiles}
    </h2>
  </div>

  <div className="dashboard-card">
    <p className="text-white/50 text-sm">
      Completed
    </p>

    <h2 className="text-4xl font-black mt-3 text-green-400">
      {completedFiles}
    </h2>
  </div>

  <div className="dashboard-card">
    <p className="text-white/50 text-sm">
      Uploaded Today
    </p>

    <h2 className="text-4xl font-black mt-3 text-cyan-300">
      {todayUploads}
    </h2>
  </div>

</div>

        <div className="dashboard-card mb-6">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search file name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 rounded-xl bg-black/25 border border-white/10 pl-12 pr-4 outline-none focus:border-emerald-400"
            />

          </div>
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
  <button
    onClick={() => setFilter("all")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "all"
        ? "bg-emerald-500 text-white"
        : "bg-black/25 border border-white/10 text-white/60"
    }`}
  >
    All
  </button>

  <button
    onClick={() => setFilter("today")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "today"
        ? "bg-emerald-500 text-white"
        : "bg-black/25 border border-white/10 text-white/60"
    }`}
  >
    Today
  </button>

  <button
    onClick={() => setFilter("week")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "week"
        ? "bg-emerald-500 text-white"
        : "bg-black/25 border border-white/10 text-white/60"
    }`}
  >
    This Week
  </button>

  <button
    onClick={() => setFilter("month")}
   className={`w-full h-11 rounded-xl text-sm font-medium ${
      filter === "month"
        ? "bg-emerald-500 text-white"
        : "bg-black/25 border border-white/10 text-white/60"
    }`}
  >
    This Month
  </button>
</div>
        </div>

        <div className="dashboard-card">
          {loading ? (
            <p className="text-white/60">Loading...</p>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">📂</div>
              <p className="text-white/50">No upload history found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl bg-black/20 border border-white/10 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center text-emerald-300">
                      <FaFileCsv />
                    </div>

                    <div>
                      <h3 className="font-bold">{upload.file_name}</h3>

                      <p className="text-white/45 text-sm mt-1 flex items-center gap-2">
                        <FaCalendarAlt />
                        {new Date(upload.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
  
<button
  onClick={() => deleteUpload(upload.id)}
  className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center"
>
  <FaTrash />
</button>
  <span className="w-fit flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-300 text-sm font-bold">
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
   
