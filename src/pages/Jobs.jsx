import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  FaSearch,
  FaPlus,
  FaBriefcase,
  FaUsers,
  FaEye,
  FaTrash,
  FaLeaf,
  FaChartLine,
  FaBullhorn,
  FaVideo,
  FaPaintBrush,
  FaCode,
  FaTools,
  FaHeadset,
  FaArrowRight,
  FaFilter,
  FaTh,
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
  const [jobs, setJobs] = useState(initialJobs);
const [newJobTitle, setNewJobTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [activeTag, setActiveTag] = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
 const [viewMode, setViewMode] = useState(() => {
  return localStorage.getItem("jobsViewMode") || "card";
});

  const totalApplicants = jobs.reduce((sum, job) => sum + job.applicants, 0);
  const activeCategories = jobs.filter((job) => job.applicants > 0).length;
  const allTags = ["All", ...Array.from(new Set(jobs.map((j) => j.tag)))];
const [showAddJobModal, setShowAddJobModal] = useState(false);
  const filteredJobs = jobs
    .filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = activeTag === "All" || job.tag === activeTag;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Active jobs always on top
      const aActive = a.applicants > 0 ? 0 : 1;
      const bActive = b.applicants > 0 ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;

      // Within each group, apply selected sort
      if (sortOrder === "az") return a.title.localeCompare(b.title);
      if (sortOrder === "za") return b.title.localeCompare(a.title);
      if (sortOrder === "most") return b.applicants - a.applicants;
      return 0;
    });

  return (
   <div className="min-h-screen bg-slate-50 overflow-y-auto">
      <Sidebar />

     <div className="md:ml-56 pt-20 p-4 md:p-6 min-h-screen pb-24">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-4 md:pt-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center
               justify-center shadow-md">
                <FaBriefcase className="text-white text-sm" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Job Categories
              </h1>
            </div>
            <p className="text-slate-500 text-sm md:text-base ml-12">
              Manage and monitor all your open positions
            </p>
          </div>

         <button
 onClick={() => setShowAddJobModal(true)}
  className="self-start md:self-auto flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600
   text-white px-5 py-3 rounded-2xl font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] 
   transition-all duration-200 text-sm"
>
            <FaPlus className="text-xs" />
            Add Job Category
          </button>
        </div>

        {/* ── Stats Strip ── */}
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <FaBriefcase className="text-indigo-600 text-lg" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Total Jobs</p>
              <h2 className="text-2xl font-black text-slate-900">{jobs.length}</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <FaUsers className="text-emerald-600 text-lg" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Total Applicants</p>
              <h2 className="text-2xl font-black text-slate-900">{totalApplicants}</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FaEye className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">Active Roles</p>
              <h2 className="text-2xl font-black text-slate-900">{activeCategories}</h2>
            </div>
          </div>
        </div>

        {/* ── Main Panel ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">

          {/* Search + Sort + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 h-12">
              <FaSearch className="text-slate-400 text-sm flex-shrink-0" />
              <input
                type="text"
                placeholder="Search job categories..."
                className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-slate-400 text-sm" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="h-12 px-4 border border-slate-200 rounded-2xl outline-none bg-white text-sm text-slate-700
                 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="most">Most Applicants</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>

              {/* View Mode Toggle */}
             <div className="hidden md:flex items-center bg-slate-100 rounded-xl p-1 h-12">
                <button
                 onClick={() => {
  setViewMode("card");
  localStorage.setItem("jobsViewMode", "card");
}}
                  title="Card View"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                    viewMode === "card"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FaTh className="text-sm" />
                </button>
                <button
                 onClick={() => {
  setViewMode("list");
  localStorage.setItem("jobsViewMode", "list");
}}
                  title="List View"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 ${
                    viewMode === "list"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <FaList className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Tag Filters */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  activeTag === tag
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            ))}
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {filteredJobs.length} of {jobs.length} roles
            </span>
          </div>

          {/* ── Empty State ── */}
          {filteredJobs.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-slate-300 text-2xl" />
              </div>
              <p className="text-slate-500 font-medium">No jobs found</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter</p>
            </div>

       ) : viewMode === "card" || window.innerWidth < 768 ? (
            /* ══════════ CARD VIEW ══════════ */
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredJobs.map((job) => {
                const cfg = colorConfig[job.color];
                const Icon = job.icon;
                return (
                  <div
                    key={job.id}
                   className="group relative bg-white rounded-2xl border border-slate-100 hover:border-slate-200
                    p-5 h-[225px] flex flex-col shadow-sm hover:shadow-lg transition-all duration-200"
                  >
                    {/* Delete */}
                    <button
                      onClick={() => setDeleteConfirm(job.id)}
                     className="absolute top-4 right-4 text-slate-400 hover:text-red-500 text-sm"
                    >
                      <FaTrash />
                    </button>

                    {/* Icon + Tag */}
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center text-lg shadow-sm`}>
                        <Icon />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.tagBg} ${cfg.tagText}`}>
                        {job.tag}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-900 leading-snug mt-4 h-[42px] line-clamp-2">
                      {job.title}
                    </h3>

                    {/* Applicants */}
                   <div className="flex items-center gap-2 mt-auto mb-3">
                      <div className={`w-2 h-2 rounded-full ${job.applicants > 0 ? cfg.dot : "bg-slate-200"}`} />
                      <span className="text-slate-500 text-xs font-medium">
                        {job.applicants} Applicant{job.applicants !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* View Button */}
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                     className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                       transition-all duration-150 ${cfg.btn}`}
                    >
                      View Applicants
                      <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                );
              })}
            </div>

          ) : (
            /* ══════════ LIST VIEW ══════════ */
           <div className="hidden md:flex flex-col divide-y divide-slate-100">
              {/* List Header */}
              <div className="grid grid-cols-12 px-4 pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="col-span-1" />
                <div className="col-span-4">Role</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-3">Applicants</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {filteredJobs.map((job) => {
                const cfg = colorConfig[job.color];
                const Icon = job.icon;
                const maxApplicants = Math.max(...jobs.map(j => j.applicants), 1);

                return (
                  <div
                    key={job.id}
                    className="group grid grid-cols-12 items-center px-4 py-4 hover:bg-slate-50 rounded-2xl transition-all duration-150 gap-2"
                  >
                    {/* Icon */}
                    <div className="col-span-1">
                      <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} ${cfg.iconText} flex items-center justify-center text-base`}>
                        <Icon />
                      </div>
                    </div>

                    {/* Title */}
                    <div className="col-span-4 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{job.title}</p>
                    </div>

                    {/* Tag */}
                    <div className="col-span-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${cfg.tagBg} ${cfg.tagText}`}>
                        {job.tag}
                      </span>
                    </div>

                    {/* Applicants bar */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                          style={{ width: `${(job.applicants / maxApplicants) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-6 text-right tabular-nums">
                        {job.applicants}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="col-span-2 flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${cfg.btn}`}
                      >
                        View
                        <FaArrowRight className="text-[10px]" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(job.id)}
                     className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    {/* Add Job Modal */}
{showAddJobModal && (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <FaBriefcase className="text-2xl" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Add Job Category
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Enter job title to create a new category
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddJobModal(false)}
          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xl"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Job Title <span className="text-red-500">*</span>
        </label>

        <div className="h-14 border border-purple-200 rounded-2xl flex items-center px-4 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition">
          <FaBriefcase className="text-slate-400 text-lg mr-3" />

          <input
            type="text"
            placeholder="Enter job title"
            value={newJobTitle}
onChange={(e) => setNewJobTitle(e.target.value)}
            className="w-full outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50">
        <button
          onClick={() => setShowAddJobModal(false)}
          className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100"
        >
          Cancel
        </button>

        <button
         onClick={() => {
  if (!newJobTitle.trim()) return;

const style = getJobStyle(newJobTitle);

const newJob = {
  id: Date.now().toString(),
  title: newJobTitle,
  applicants: 0,
  icon: style.icon,
  color: style.color,
  tag: style.tag,
};

 setJobs((prevJobs) => [newJob, ...prevJobs]);
setActiveTag("All");
  setNewJobTitle("");
  setShowAddJobModal(false);
}}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-200"
        >
          Save Job →
        </button>
      </div>
    </div>
  </div>
)}
      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaTrash className="text-red-500 text-lg" />
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Delete Job Category?</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action cannot be undone. All applicant data for this role will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
               onClick={() => {
  setJobs((prevJobs) =>
    prevJobs.filter((job) => job.id !== deleteConfirm)
  );
  setDeleteConfirm(null);
}}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Jobs;