import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import {
  FaArrowLeft,
  FaTrash,
  FaUsers,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaPhoneAlt,
  FaEye,
  FaSearch,
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

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

 useEffect(() => {
  fetchApplicants();
}, [id]);

  const fetchApplicants = async () => {
    setLoading(true);

    const { data: jobData } = await supabase
      .from("job_posts")
      .select("*")
    .eq("id", id)
      .single();

    setJob(jobData);

    let { data: appData } = await supabase
      .from("applicants")
      .select("*")
      .or(
  `role.ilike.%${jobData?.title}%,recommended_role.ilike.%${jobData?.title}%`
)
      .order("ai_score", { ascending: false });

    if (!appData || appData.length === 0) {
      const { data: byRole } = await supabase
        .from("applicants")
        .select("*")
        .eq("role", jobData?.title);

      appData = byRole || [];
    }

    const sortedApplicants = (appData || []).sort((a, b) => {
      const scoreA = a.ai_score ?? -1;
      const scoreB = b.ai_score ?? -1;
      return scoreB - scoreA;
    });

    setApplicants(sortedApplicants);
    setLoading(false);
  };

  const filteredApplicants = applicants.filter((item) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      item.name?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword) ||
      item.phone?.toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "All" ? true : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const averageScore =
    applicants.length > 0
      ? Math.round(
          applicants.reduce(
            (sum, item) => sum + (item.ai_score || 0),
            0
          ) / applicants.length
        )
      : 0;

  const pendingCount = applicants.filter(
    (item) => item.status === "Pending"
  ).length;

  const shortlistedCount = applicants.filter(
    (item) =>
      item.status === "Shortlisted" ||
      item.status === "Accepted"
  ).length;

  const rejectedCount = applicants.filter(
    (item) => item.status === "Rejected"
  ).length;

  const statusClass = (status) => {
    if (status === "Rejected") {
      return "bg-red-100 text-red-600";
    }

    if (status === "Shortlisted" || status === "Accepted") {
      return "bg-green-100 text-green-600";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const scoreClass = (score) => {
    if (score >= 70) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-600";
  };

  async function handleDeleteApplicant(id) {
    if (!window.confirm("Remove this applicant?")) return;

    await supabase
      .from("applicants")
      .delete()
      .eq("id", id);

   fetchApplicants();
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10 pointer-events-none" />
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 ml-[220px] z-10">
        <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          <button
            onClick={() => navigate("/jobs")}
            className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-8 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-colors w-fit shadow-[0_2px_10px_-3px_rgba(79,70,229,0.1)] border border-indigo-100/50"
          >
            <FaArrowLeft size={14} />
            Back to Jobs
          </button>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
            </div>
          ) : (
            <>
              <div className="bg-white/70 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-8 mb-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {job?.title}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                  Manage applicants under this job category.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-10">
                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-violet-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-50 text-violet-600 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-violet-100/50">
                      <FaUsers />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Applicants</p>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {applicants.length}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-indigo-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-indigo-100/50">
                      <FaChartLine />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Average Score</p>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {averageScore}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-amber-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-amber-100/50">
                      <FaClock />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending</p>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {pendingCount}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-emerald-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-emerald-100/50">
                      <FaCheckCircle />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Shortlisted</p>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {shortlistedCount}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-slate-100/80 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-red-50/50 transition-transform group-hover:scale-150 duration-500 ease-out" />
                  <div className="relative flex flex-col gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-red-100/50">
                      <FaTimesCircle />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Rejected</p>
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {rejectedCount}
                      </h2>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
                  <div className="relative w-full md:w-[430px] group">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email or phone..."
                      className="w-full bg-slate-50/50 border border-slate-200/80 rounded-2xl pl-12 pr-4 py-3.5 outline-none text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50/50 border border-slate-200/80 rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-sm cursor-pointer hover:bg-white"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {filteredApplicants.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 border border-slate-100">
                      📭
                    </div>
                    <p className="font-semibold text-slate-700">
                      No applicants found
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try adjusting your filters or search query.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-[24px] border border-slate-100/80 shadow-sm bg-white">
                    <table className="w-full min-w-[1100px] text-sm">
                      <thead className="bg-slate-50/80 border-b border-slate-100/80">
                        <tr className="text-left text-slate-500 font-bold tracking-wider uppercase text-[11px]">
                          <th className="py-5 px-6">Candidate</th>
                          <th className="px-4">Contact</th>
                          <th className="px-4">Skills</th>
                          <th className="px-4">Status</th>
                          <th className="px-4">AI Score</th>
                          <th className="px-6 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredApplicants.map((a, index) => (
                          <tr
                            key={a.id}
                            className={`border-b border-slate-50 hover:bg-indigo-50/30 transition-colors ${index === filteredApplicants.length - 1 ? 'border-b-0' : ''}`}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700 flex items-center justify-center font-bold shadow-sm border border-violet-100/50">
                                  {a.name
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase() || "NA"}
                                </div>

                                <div>
                                  <p className="font-bold text-slate-900 mb-0.5">
                                    {a.name || "Unknown Candidate"}
                                  </p>
                                  <p className="text-xs font-medium text-slate-500">
                                    {a.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="text-slate-600 px-4 font-medium whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <FaPhoneAlt className="text-slate-400 text-xs" />
                                {a.phone || "—"}
                              </div>
                            </td>

                            <td className="text-slate-600 max-w-[280px] truncate px-4 font-medium">
                              {a.skills || "—"}
                            </td>

                            <td className="px-4">
                              <span
                                className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                                  a.status === "Rejected"
                                    ? "bg-red-50 text-red-600 border-red-100"
                                    : a.status === "Shortlisted" || a.status === "Accepted"
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                              >
                                {a.status || "Pending"}
                              </span>
                            </td>

                            <td className="px-4">
                              <span
                                className={`px-4 py-2 rounded-xl text-sm font-extrabold border inline-block ${
                                  (a.ai_score || 0) >= 70
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100/50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]"
                                    : (a.ai_score || 0) >= 60
                                    ? "bg-amber-50 text-amber-700 border-amber-100/50 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.2)]"
                                    : "bg-red-50 text-red-600 border-red-100/50 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.2)]"
                                }`}
                              >
                                {a.ai_score ?? "—"}
                              </span>
                            </td>

                            <td className="px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() =>
                                    navigate("/candidate-details", {
                                      state: a,
                                    })
                                  }
                                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 flex items-center justify-center shadow-sm transition-all"
                                  title="View Candidate"
                                >
                                  <FaEye />
                                </button>

                                <button
                                  onClick={() =>
                                    handleDeleteApplicant(a.id)
                                  }
                                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 flex items-center justify-center shadow-sm transition-all"
                                  title="Remove Applicant"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

               <div className="flex justify-between items-center mt-6 px-2">
  <p className="text-sm font-medium text-slate-500">
    Showing
    <span className="font-bold text-slate-700">
      {filteredApplicants.length}
    </span>
    of
    <span className="font-bold text-slate-700">
      {applicants.length}
    </span>
    applicants
  </p>
</div>

              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default JobDetails;