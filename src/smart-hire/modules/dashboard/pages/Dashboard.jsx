import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../../../../core/lib/supabase";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
   FaUpload,
  FaBriefcase,
} from "react-icons/fa";

function Dashboard() {

  const navigate =
    useNavigate();

  const [
    totalCandidates,
    setTotalCandidates,
  ] = useState(0);

  const [
    shortlisted,
    setShortlisted,
  ] = useState(0);

  const [
    rejected,
    setRejected,
  ] = useState(0);

  const [
    pending,
    setPending,
  ] = useState(0);

  const [
    applicants,
    setApplicants,
  ] = useState([]);

  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchJobsData();
  }, []);

  const fetchJobsData = async () => {
    const { data, error } = await supabase
      .from("job_posts")
      .select("id, title");

    if (error) {
      console.log(error);
      return;
    }

    setJobs(data || []);
  };

  // Job with the most applicants — surfaced on the dashboard so recruiters
  // can see which opening is drawing the most interest at a glance.
  const topJob = useMemo(() => {
    if (jobs.length === 0) return null;

    const counts = {};
    applicants.forEach((applicant) => {
      if (!applicant.job_post_id) return;
      counts[applicant.job_post_id] = (counts[applicant.job_post_id] || 0) + 1;
    });

    let best = null;
    jobs.forEach((job) => {
      const count = counts[job.id] || 0;
      if (!best || count > best.count) {
        best = { ...job, count };
      }
    });

    return best?.count > 0 ? best : null;
  }, [jobs, applicants]);

  const trendData = useMemo(() => {
    const days = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: 0,
      });
    }

    const byDay = Object.fromEntries(
      days.map((day) => [day.key, day])
    );

    applicants.forEach((applicant) => {
      const createdAt =
        applicant.created_at || applicant.createdAt;
      if (!createdAt) return;

      const key = new Date(createdAt)
        .toISOString()
        .slice(0, 10);

      if (byDay[key]) {
        byDay[key].count += 1;
      }
    });

    return days;
  }, [applicants]);

  const statusData = useMemo(
    () =>
      [
        { name: "Shortlisted", value: shortlisted, color: "#22c55e" },
        { name: "Rejected", value: rejected, color: "#ef4444" },
        { name: "Pending", value: pending, color: "#eab308" },
      ].filter((slice) => slice.value > 0),
    [shortlisted, rejected, pending]
  );

  const percentOf = (value) =>
    totalCandidates > 0
      ? Math.round((value / totalCandidates) * 100)
      : 0;

  const fetchDashboardData =
    async () => {

    const { data, error } =
      await supabase
        .from("applicants")
        .select("*");

    if (error) {
      console.log(error);

    } else {
      setApplicants(data || []);

      setTotalCandidates(
        data.length
      );

      setShortlisted(
        data.filter(
          (candidate) =>
            candidate.status ===
            "Shortlisted"
        ).length
      );

      setRejected(
        data.filter(
          (candidate) =>
            candidate.status ===
            "Rejected"
        ).length
      );

      setPending(
        data.filter(
          (candidate) =>
            candidate.status ===
            "Pending"
        ).length
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "isLoggedIn"
    );

    navigate("/login");
  };
  return (

  <div className="p-4 md:p-6">

        {/* Header */}

<div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-8">
<div>
<h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600
 to-purple-600 bg-clip-text text-transparent">
 Dashboard </h1>

<p className="text-slate-500 mt-2 text-sm md:text-base max-w-md">
 Track applicants, interviews and hiring performance in one place.
</p>
</div>

<div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
<button
  onClick={() => navigate("/upload")}
 className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r
  from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-2xl shadow-lg"
>
<FaUpload />
Upload Resume
</button>

<button
onClick={() => navigate("/results")}
className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r
  from-violet-600 to-purple-600 text-white px-5 py-3 rounded-2xl shadow-lg">

  <FaUsers />
  View Applicants
</button>

          </div>

        </div>

        {/* Stats Cards */}

     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <div className="relative overflow-hidden bg-white rounded-3xl p-5 min-h-[140px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-10 blur-2xl" />

    <div className="relative flex justify-between items-start">
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-blue-500/30">
        <FaUsers className="text-white text-xl" />
      </div>
    </div>

    <h2 className="relative text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
      {totalCandidates}
    </h2>
    <p className="relative text-slate-500 text-sm font-medium mt-1">
      Total Applicants
    </p>
  </div>

<div className="relative overflow-hidden bg-white rounded-3xl p-5 min-h-[140px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-10 blur-2xl" />

    <div className="relative flex justify-between items-start">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg shadow-green-500/30">
        <FaUserCheck className="text-white text-xl" />
      </div>

      {totalCandidates > 0 && (
        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          {percentOf(shortlisted)}%
        </span>
      )}
    </div>

    <h2 className="relative text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
      {shortlisted}
    </h2>
    <p className="relative text-slate-500 text-sm font-medium mt-1">
      Shortlisted
    </p>
  </div>

 <div className="relative overflow-hidden bg-white rounded-3xl p-5 min-h-[140px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-red-400 to-rose-500 opacity-10 blur-2xl" />

    <div className="relative flex justify-between items-start">
      <div className="bg-gradient-to-br from-red-500 to-rose-600 p-3 rounded-2xl shadow-lg shadow-red-500/30">
        <FaUserTimes className="text-white text-xl" />
      </div>

      {totalCandidates > 0 && (
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
          {percentOf(rejected)}%
        </span>
      )}
    </div>

    <h2 className="relative text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
      {rejected}
    </h2>
    <p className="relative text-slate-500 text-sm font-medium mt-1">
      Rejected
    </p>
  </div>

  <div className="relative overflow-hidden bg-white rounded-3xl p-5 min-h-[140px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 opacity-10 blur-2xl" />

    <div className="relative flex justify-between items-start">
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-2xl shadow-lg shadow-yellow-500/30">
        <FaUserClock className="text-white text-xl" />
      </div>

      {totalCandidates > 0 && (
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
          {percentOf(pending)}%
        </span>
      )}
    </div>

    <h2 className="relative text-3xl md:text-4xl font-extrabold text-slate-900 mt-4">
      {pending}
    </h2>
    <p className="relative text-slate-500 text-sm font-medium mt-1">
      Pending
    </p>
  </div>

</div>

        {/* Quick Actions */}
        {/* Analytics + Recent Applicants */}

        <div className="grid grid-cols-1 gap-6">

          {/* Analytics */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Applications (Last 30 Days)
              </h2>

              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval={4}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Status Breakdown
              </h2>

              {statusData.length === 0 ? (
                <p className="text-sm text-slate-400 py-16 text-center">
                  No applicant data yet
                </p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {statusData.map((slice) => (
                          <Cell key={slice.name} fill={slice.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex flex-col gap-2 mt-4">
                    {statusData.map((slice) => (
                      <div
                        key={slice.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: slice.color }}
                          />
                          <span className="text-slate-600">{slice.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {slice.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* Active Jobs */}

          <div
            onClick={() => navigate("/jobs")}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-violet-500/30 flex-shrink-0">
                <FaBriefcase className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  {jobs.length}
                </h2>
                <p className="text-slate-500 text-sm font-medium">Active Jobs</p>
              </div>
            </div>

            <div className="hidden sm:block h-12 w-px bg-slate-100" />

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                Top Job by Applicants
              </p>
              {topJob ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-800 truncate">
                    {topJob.title}
                  </span>
                  <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full flex-shrink-0">
                    {topJob.count} applicant{topJob.count !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No applicants linked to a job yet</p>
              )}
            </div>
          </div>

          {/* Recent Applicants */}

    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">

            <div className="flex justify-between items-center mb-6">

          <div className="flex items-center gap-3">
  <FaUsers className="text-blue-600 text-2xl" />
  <h2 className="text-2xl font-bold text-slate-800">
    Latest Applicants
  </h2>
</div>

              <button
                onClick={() =>
                  navigate(
                    "/results"
                  )
                }
             className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
              >
                View All
              </button>

            </div>

            <div className="divide-y divide-slate-100">

              {applicants
                ?.slice(0, 5)
                .map(
                  (applicant) => (

                  <div
  key={applicant.id}
  onClick={() =>
    navigate("/candidate-profile", {
      state: applicant,
    })
  }
 className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer"
>

                 <div className="flex items-center gap-3 min-w-0">

  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm flex-shrink-0">
    {applicant.name?.charAt(0)}
  </div>

  <div className="min-w-0">

    <h3 className="text-sm font-semibold text-slate-800 truncate">
      {applicant.name}
    </h3>

    <p className="text-xs text-slate-400 truncate">
      {applicant.email}
    </p>

  </div>

</div>

                    <div className="flex items-center gap-2 flex-shrink-0">

                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
  {applicant.ai_score || applicant.score || 0}% Match
</span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          applicant.status ===
                          "Shortlisted"
                            ? "bg-green-100 text-green-600"
                            : applicant.status ===
                              "Rejected"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {
                          applicant.status
                        }
                      </span>

                    </div>

                  </div>

                ))}

            </div>

          </div>

        </div>

      </div>

  );
}

export default Dashboard;