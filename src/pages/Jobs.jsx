import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
  FaPlus,
  FaTimes,
  FaTrash,
  FaBriefcase,
  FaUsers,
  FaSearch,
  FaEye,
  FaChartLine,
  FaFunnelDollar,
  FaBullhorn,
FaHeadset,
  FaVideo,
  FaPaintBrush,
  FaUserTie,
  FaTools,
  FaLeaf,
  FaSearchDollar,
  FaCode,
  FaThLarge,
  FaList,
} from "react-icons/fa";

const initialJobs = [
  { id: "1", title: "Sales Representative", applicants: 0, icon: FaChartLine, color: "emerald", tag: "Sales" },
  { id: "2", title: "Lead Generation Specialist", applicants: 0, icon: FaBullhorn, color: "blue", tag: "Marketing" },
  { id: "3", title: "Video Editor", applicants: 0, icon: FaVideo, color: "orange", tag: "Creative" },
  { id: "4", title: "Graphic Designer", applicants: 0, icon: FaPaintBrush, color: "purple", tag: "Creative" },
  { id: "5", title: "Full Stack React & Supabase Developer", applicants: 0, icon: FaCode, color: "indigo", tag: "Tech" },
  { id: "6", title: "Diesel Mechanic", applicants: 0, icon: FaTools, color: "blue", tag: "Technical" },
  { id: "7", title: "Landscaping Sales Rep (1099/Commission)", applicants: 0, icon: FaLeaf, color: "emerald", tag: "Sales" },
  { id: "8", title: "SEO Specialist", applicants: 0, icon: FaBullhorn, color: "orange", tag: "Marketing" },
  { id: "9", title: "Landscaping Sales / Estimator (1099)", applicants: 0, icon: FaLeaf, color: "emerald", tag: "Sales" },
  { id: "10", title: "Customer Service Representative", applicants: 0, icon: FaHeadset, color: "blue", tag: "Support" },
  { id: "11", title: "Customer Service Agent (Remote)", applicants: 0, icon: FaHeadset, color: "purple", tag: "Support" },
  { id: "12", title: "Landscaping Team Hiring - Immediate", applicants: 30, icon: FaLeaf, color: "emerald", tag: "Landscaping" },
  { id: "13", title: "Landscaping Crew Member", applicants: 0, icon: FaLeaf, color: "emerald", tag: "Landscaping" },
  { id: "14", title: "Landscaping Foreman", applicants: 0, icon: FaLeaf, color: "blue", tag: "Landscaping" },
  { id: "15", title: "Web Development", applicants: 2, icon: FaCode, color: "indigo", tag: "Tech" },
];

const colorConfig = {
  emerald: {
    iconBg: "bg-emerald-100", iconText: "text-emerald-600",
    tagBg: "bg-emerald-50", tagText: "text-emerald-600",
    btn: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-400", bar: "bg-emerald-400",
  },
  blue: {
    iconBg: "bg-blue-100", iconText: "text-blue-600",
    tagBg: "bg-blue-50", tagText: "text-blue-600",
    btn: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    dot: "bg-blue-400", bar: "bg-blue-400",
  },
  purple: {
    iconBg: "bg-purple-100", iconText: "text-purple-600",
    tagBg: "bg-purple-50", tagText: "text-purple-600",
    btn: "bg-purple-50 hover:bg-purple-100 text-purple-700",
    dot: "bg-purple-400", bar: "bg-purple-400",
  },
  orange: {
    iconBg: "bg-orange-100", iconText: "text-orange-600",
    tagBg: "bg-orange-50", tagText: "text-orange-600",
    btn: "bg-orange-50 hover:bg-orange-100 text-orange-700",
    dot: "bg-orange-400", bar: "bg-orange-400",
  },
  indigo: {
    iconBg: "bg-indigo-100", iconText: "text-indigo-600",
    tagBg: "bg-indigo-50", tagText: "text-indigo-600",
    btn: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700",
    dot: "bg-indigo-400", bar: "bg-indigo-400",
  },
};
const getJobStyle = (title) => {
  const text = title.toLowerCase();

  if (text.includes("sales")) {
    return { icon: FaChartLine, color: "emerald", tag: "Sales" };
  }

  if (text.includes("lead") || text.includes("seo") || text.includes("marketing")) {
    return { icon: FaBullhorn, color: "orange", tag: "Marketing" };
  }

  if (text.includes("video")) {
    return { icon: FaVideo, color: "orange", tag: "Creative" };
  }

  if (text.includes("graphic") || text.includes("designer") || text.includes("design")) {
    return { icon: FaPaintBrush, color: "purple", tag: "Creative" };
  }

  if (text.includes("web") || text.includes("react") || text.includes("developer") || text.includes("supabase")) {
    return { icon: FaCode, color: "indigo", tag: "Tech" };
  }

  if (text.includes("mechanic") || text.includes("technician") || text.includes("maintenance")) {
    return { icon: FaTools, color: "blue", tag: "Technical" };
  }

  if (text.includes("customer") || text.includes("support") || text.includes("agent")) {
    return { icon: FaHeadset, color: "blue", tag: "Support" };
  }

  if (text.includes("landscaping") || text.includes("landscape") || text.includes("crew") || text.includes("foreman")) {
    return { icon: FaLeaf, color: "emerald", tag: "Landscaping" };
  }

  return { icon: FaBriefcase, color: "indigo", tag: "General" };
};

function Jobs() {
  const navigate = useNavigate();
const [sortBy, setSortBy] = useState(
  localStorage.getItem("jobsSortBy") || "newest"
);
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
 const [viewMode, setViewMode] = useState(
  localStorage.getItem("jobsViewMode") || "grid"
);

  const [form, setForm] = useState({
    title: "",
  });

  useEffect(() => {
    fetchJobs();
    fetchApplicants();
  }, []);

  async function fetchJobs() {
    setLoading(true);

    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setJobs(data || []);
    }

    setLoading(false);
  }

  async function fetchApplicants() {
    const { data, error } = await supabase
      .from("applicants")
      .select("id, job_post_id");

    if (!error) {
      setApplicants(data || []);
    }
  }

  const getApplicantsCount = (jobId) => {
    return applicants.filter(
      (item) => item.job_post_id === jobId
    ).length;
  };
  const activeCategoriesCount = jobs.filter(
  (job) => getApplicantsCount(job.id) > 0
).length;

  const filteredJobs = jobs.filter((job) =>
    job.title
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );
const sortedJobs = [...filteredJobs].sort((a, b) => {
  const aApplicants = getApplicantsCount(a.id);
  const bApplicants = getApplicantsCount(b.id);

  // Active categories first
  if (aApplicants > 0 && bApplicants === 0) return -1;
  if (aApplicants === 0 && bApplicants > 0) return 1;

  // Existing sort options
  if (sortBy === "newest") {
    return new Date(b.created_at) - new Date(a.created_at);
  }

  if (sortBy === "oldest") {
    return new Date(a.created_at) - new Date(b.created_at);
  }

  if (sortBy === "az") {
    return a.title.localeCompare(b.title);
  }

  if (sortBy === "za") {
    return b.title.localeCompare(a.title);
  }

  return 0;
});
  async function handleAddJob(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter job category name");
      return;
    }

    const { error } = await supabase
      .from("job_posts")
      .insert([
        {
          title: form.title.trim(),
        },
      ]);

    if (error) {
      alert(error.message);
      return;
    }

    setShowModal(false);
    setForm({ title: "" });
    fetchJobs();
  }

  async function handleDeleteJob(e, jobId) {
    e.stopPropagation();

    if (!window.confirm("Delete this job category?")) return;

    const { error } = await supabase
      .from("job_posts")
      .delete()
      .eq("id", jobId);

    if (error) {
      alert(error.message);
      return;
    }

    fetchJobs();
    fetchApplicants();
  }
 const getIcon = (title = "") => {
  const job = title.toLowerCase();

  if (job.includes("sales")) return <FaChartLine />;
  if (job.includes("lead generation")) return <FaFunnelDollar />;
  if (job.includes("video")) return <FaVideo />;

  if (
    job.includes("graphic") ||
    job.includes("designer")
  )
    return <FaPaintBrush />;

  if (
    job.includes("react") ||
    job.includes("developer") ||
    job.includes("frontend") ||
    job.includes("backend")
  )
    return <FaCode />;

  if (job.includes("seo")) return <FaSearchDollar />;
  if (job.includes("mechanic")) return <FaTools />;
  if (job.includes("landscaping")) return <FaLeaf />;

  return <FaUserTie />;
};

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10 pointer-events-none" />
      <Sidebar />

      <div className="flex-1 md:ml-56 min-w-0 z-10">
       

        <main className="p-6 md:p-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Job Categories
              </h1>
              <p className="text-slate-500 mt-2 font-medium">
                Manage all your job categories in one place.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-7 py-3.5 rounded-2xl font-semibold shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.35)] hover:-translate-y-1 transition-all duration-300"
            >
              <FaPlus />
              Add Job Category
            </button>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-sm border border-slate-100/50 p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
              <div className="relative w-full md:w-[360px] group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/60 border border-slate-200/70 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm"
                />
              </div>

             <div className="flex items-center gap-3 w-full md:w-auto">
               <select
                 value={sortBy}
                onChange={(e) => {
  setSortBy(e.target.value);
  localStorage.setItem("jobsSortBy", e.target.value);
}}
                 className="bg-white/60 border border-slate-200/70 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm cursor-pointer hover:bg-white"
               >
                 <option value="newest">Newest First</option>
                 <option value="oldest">Oldest First</option>
                 <option value="az">A-Z</option>
                 <option value="za">Z-A</option>
               </select>
               <div className="flex gap-2 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                 <button
                  onClick={() => {
  setViewMode("grid");
  localStorage.setItem("jobsViewMode", "grid");
}}
                   className={`p-3 rounded-xl transition-all ${
                     viewMode === "grid"
                       ? "bg-white text-indigo-600 shadow-sm font-semibold"
                       : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                   }`}
                   title="Grid View"
                 >
                   <FaThLarge />
                 </button>

                 <button
                  onClick={() => {
  setViewMode("list");
  localStorage.setItem("jobsViewMode", "list");
}}
                   className={`p-3 rounded-xl transition-all ${
                     viewMode === "list"
                       ? "bg-white text-indigo-600 shadow-sm font-semibold"
                       : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                   }`}
                   title="List View"
                 >
                   <FaList />
                 </button>
               </div>
             </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="relative overflow-hidden rounded-[24px] bg-white border border-slate-100/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-violet-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                <div className="relative flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 flex items-center justify-center text-2xl shadow-sm border border-violet-100/50">
                    <FaBriefcase />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      Total Categories
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {jobs.length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-white border border-slate-100/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-emerald-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                <div className="relative flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm border border-emerald-100/50">
                    <FaUsers />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      Total Applicants
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {applicants.length}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[24px] bg-white border border-slate-100/80 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-6 group hover:shadow-md transition-all duration-300">
                <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-blue-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                <div className="relative flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-sm border border-blue-100/50">
                    <FaEye />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      Active Categories
                    </p>
                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                      {activeCategoriesCount}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="text-slate-500">
                Loading job categories...
              </p>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                  💼
                </div>
                <p className="font-semibold text-slate-700">
                  No job categories found
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Add your first job category to start uploading CVs.
                </p>
              </div>
            ) : (
             <div
  className={
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      : "flex flex-col gap-4"
  }
>
  {viewMode === "list" && (
  <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 rounded-[20px] text-xs uppercase tracking-wider font-bold text-slate-500 border border-slate-100/80 shadow-sm mb-2">
    <div className="w-1/3 pl-4">Category</div>
    <div className="w-1/6 text-center">Applicants</div>
    <div className="w-1/6 text-center">Status</div>
    <div className="w-1/3 text-right pr-4">Actions</div>
  </div>
)}
              {sortedJobs.map((job, index) => (
               
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className={`relative bg-white border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-indigo-100 transition-all duration-300 group ${
  viewMode === "grid"
    ? "rounded-[28px] p-6 hover:-translate-y-1 flex flex-col"
    : "rounded-[24px] px-6 py-5 flex items-center justify-between gap-4"
}`}
                  >
                    <button
                      onClick={(e) => handleDeleteJob(e, job.id)}
                      className={`absolute text-slate-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10 ${
                        viewMode === "grid" ? "top-4 right-4" : "top-1/2 -translate-y-1/2 right-[180px]"
                      }`}
                      title="Delete category"
                    >
                      <FaTrash size={13} />
                    </button>

                    {viewMode === "grid" ? (
                      <>
                        <div
                          className={`rounded-[20px] flex items-center justify-center shadow-sm border border-white/50 w-16 h-16 text-2xl mb-6 ${
                            index % 4 === 0
                              ? "bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600"
                              : index % 4 === 1
                              ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600"
                              : index % 4 === 2
                              ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600"
                              : "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600"
                          }`}
                        >
                          {getIcon(job.title)}
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-slate-800 mb-1.5 group-hover:text-indigo-600 transition-colors tracking-tight">
                            {job.title}
                          </h2>
                          <p className="text-sm font-medium text-slate-500 mb-5">
                            {getApplicantsCount(job.id)} {getApplicantsCount(job.id) === 1 ? 'Applicant' : 'Applicants'}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-bold bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors px-4 py-2.5 rounded-full border border-slate-100 group-hover:border-indigo-100 w-fit">
                          View <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-1/3 flex items-center gap-4">
                          <div
                            className={`rounded-2xl flex items-center justify-center shadow-sm border border-white/50 w-12 h-12 text-xl shrink-0 ${
                              index % 4 === 0
                                ? "bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600"
                                : index % 4 === 1
                                ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600"
                                : index % 4 === 2
                                ? "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600"
                                : "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600"
                            }`}
                          >
                            {getIcon(job.title)}
                          </div>
                          <h2 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate pr-4">
                            {job.title}
                          </h2>
                        </div>
                        
                        <div className="w-1/6 flex justify-center">
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                            <FaUsers className="text-slate-400 text-xs" />
                            <span className="font-bold text-slate-700 text-sm">{getApplicantsCount(job.id)}</span>
                          </div>
                        </div>

                        <div className="w-1/6 flex justify-center">
                          {getApplicantsCount(job.id) > 0 ? (
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Active
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-500 border border-slate-200/60 shadow-sm px-3 py-1.5 rounded-xl text-xs font-bold">
                              No CVs
                            </span>
                          )}
                        </div>

                        <div className="w-1/3 flex items-center justify-end">
                          <span className="inline-flex items-center gap-2 text-sm font-bold bg-indigo-50 text-indigo-600 transition-all px-5 py-2.5 rounded-[14px] shadow-sm border border-indigo-100 group-hover:shadow-[0_4px_15px_-3px_rgba(79,70,229,0.25)] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                            View Category
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
         {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <FaTimes />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mb-5">
              <FaBriefcase />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2">
              Add Job Category
            </h2>

            <p className="text-slate-500 text-sm mb-6">
              Enter job title to create a new category.
            </p>

            <form onSubmit={handleAddJob}>
              <input
                required
                placeholder="Enter job title"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                className="w-full border border-slate-200 rounded-2xl px-5 py-4 outline-none mb-5"
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-bold"
              >
                Add Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;

export default Jobs;
