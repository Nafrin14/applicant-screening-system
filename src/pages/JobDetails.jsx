import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import {
  FaArrowLeft,
  FaSearch,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaTrash,
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaBriefcase,
  FaFilter,
  FaPhone,
  FaChartBar,
} from "react-icons/fa";

const JOB_MAP = {
  "1": "Sales Representative",
  "2": "Lead Generation Specialist",
  "3": "Video Editor",
  "4": "Graphic Designer",
  "5": "Full Stack React & Supabase Developer",
  "6": "Diesel Mechanic",
  "7": "Landscaping Sales Representative (1099/Commission Based)",
  "8": "SEO Specialist",
  "9": "Landscaping Sales / Estimator (1099/Commission Based)",
  "10": "Customer Service Representative",
  "11": "Customer Service Agent (Remote)",
  "12": "Landscaping Team Hiring - Immediate Openings",
  "13": "Landscaping Crew Member",
  "14": "Landscaping Foreman",
  "15": "web development",
};

const STATUS_STYLES = {
  Shortlisted: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-600",
  "Interview Scheduled": "bg-violet-100 text-violet-700",
  Selected: "bg-blue-100 text-blue-700",
  Pending: "bg-amber-100 text-amber-700",
};

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const jobTitle = JOB_MAP[id];

  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (jobTitle) fetchApplicants();
  }, [jobTitle]);

  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("applicants")
      .select("*")
      .or(
        `role.ilike.%${jobTitle}%,recommended_role.ilike.%${jobTitle}%`
      )
      .order("ai_score", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setApplicants(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (applicantId, status) => {
    const { error } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", applicantId);
    if (!error) fetchApplicants();
  };

  const handleDelete = async (applicantId) => {
    if (!window.confirm("Delete this candidate?")) return;
    const { error } = await supabase
      .from("applicants")
      .delete()
      .eq("id", applicantId);
    if (!error) fetchApplicants();
  };

  if (!jobTitle) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 md:ml-56 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">⚠️</div>
            <h1 className="text-xl font-bold text-slate-800">Job not found</h1>
            <button onClick={() => navigate("/jobs")} className="mt-4 text-indigo-600 font-semibold text-sm">← Back to Jobs</button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = applicants.filter((a) => {
    const matchSearch =
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.phone?.includes(searchTerm);
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = applicants.length;
  const shortlisted = applicants.filter((a) => a.status === "Shortlisted").length;
  const rejected = applicants.filter((a) => a.status === "Rejected").length;
  const pending = applicants.filter((a) => a.status === "Pending").length;
  const avgScore =
    total > 0
      ? Math.round(applicants.reduce((s, a) => s + (a.ai_score || a.score || 0), 0) / total)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="md:ml-56 pt-20 p-4 md:p-6">
        {/* ── Back ── */}
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold text-sm mb-6 group bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all"
        >
          <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
          Back to Jobs
        </button>

        {/* ── Hero Header ── */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <FaBriefcase className="text-white text-xl" />
              </div>
              <div>
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">Job Category</p>
                <h1 className="text-xl md:text-2xl font-black text-white leading-snug">{jobTitle}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
              <FaUsers className="text-indigo-300 text-lg" />
              <div>
                <p className="text-xs text-slate-400">Total CVs</p>
                <p className="text-2xl font-black text-white">{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Shortlisted", value: shortlisted, icon: FaCheckCircle, bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
            { label: "Rejected", value: rejected, icon: FaTimesCircle, bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100" },
            { label: "Pending", value: pending, icon: FaClock, bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
            { label: "Avg AI Score", value: `${avgScore}%`, icon: FaChartBar, bg: "bg-indigo-50", text: "text-indigo-600", iconBg: "bg-indigo-100" },
          ].map(({ label, value, icon: Icon, bg, text, iconBg }) => (
            <div key={label} className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3`}>
              <div className={`w-10 h-10 rounded-xl ${iconBg} ${text} flex items-center justify-center flex-shrink-0`}>
                <Icon className="text-sm" />
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium">{label}</p>
                <h2 className={`text-xl font-black ${text}`}>{value}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* ── Applicants Table Panel ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-6">
          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <FaUsers className="text-indigo-600" />
              <h2 className="text-base font-black text-slate-800">Applicants for this Role</h2>
              <span className="ml-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">{filtered.length}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 flex-1 min-w-[180px]">
                <FaSearch className="text-slate-400 text-xs flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  className="w-full bg-transparent outline-none text-xs text-slate-700 placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 h-10">
                <FaFilter className="text-slate-400 text-xs" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent outline-none text-xs text-slate-700 cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <p className="text-slate-400 text-sm font-medium animate-pulse">Loading applicants...</p>
            </div>

          ) : filtered.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-2xl">📂</div>
              <p className="text-slate-600 font-bold">No applicants found</p>
              <p className="text-slate-400 text-sm mt-1">
                {searchTerm || statusFilter !== "All"
                  ? "Try clearing your search or filter."
                  : "No CVs have been submitted for this job yet."}
              </p>
            </div>

          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">AI Score</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((applicant, index) => {
                    const score = applicant.ai_score || applicant.score || 0;
                    const initials = applicant.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "?";

                    return (
                      <tr
                        key={applicant.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* Candidate */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{applicant.name}</p>
                              <p className="text-xs text-slate-400 truncate">{applicant.email}</p>
                            </div>
                            {index === 0 && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">Top</span>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 pr-4">
                          {applicant.phone ? (
                            <a
                              href={`tel:${applicant.phone}`}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition"
                            >
                              <FaPhone className="text-[10px]" />
                              {applicant.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-400"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black tabular-nums ${
                              score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-500"
                            }`}>
                              {score}%
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 pr-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${STATUS_STYLES[applicant.status] || STATUS_STYLES.Pending}`}>
                            {applicant.status || "Pending"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => navigate("/candidate-details", { state: applicant })}
                              title="View Profile"
                              className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                            >
                              <FaEye size={12} />
                            </button>

                            {applicant.status !== "Shortlisted" && (
                              <button
                                onClick={() => updateStatus(applicant.id, "Shortlisted")}
                                title="Shortlist"
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                              >
                                <FaUserCheck size={12} />
                              </button>
                            )}

                            {applicant.status !== "Rejected" && (
                              <button
                                onClick={() => updateStatus(applicant.id, "Rejected")}
                                title="Reject"
                                className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition"
                              >
                                <FaUserTimes size={12} />
                              </button>
                            )}

                            <button
                              onClick={() =>
                                navigate("/interview-schedule", { state: applicant })
                              }
                              title="Schedule Interview"
                              className="p-2 rounded-xl bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
                            >
                              <FaCalendarAlt size={12} />
                            </button>

                            <button
                              onClick={() => handleDelete(applicant.id)}
                              title="Delete"
                              className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobDetails;
