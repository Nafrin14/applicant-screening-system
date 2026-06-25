import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
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
  FaBriefcase,
  FaMapMarkerAlt,
  FaMoneyBillWave,
   FaUpload,
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  <div className="min-h-screen bg-slate-100">
  <Navbar />
  <Sidebar />

<div className="md:ml-56 mt-20 p-4 md:p-6">
        
        {/* Header */}

<div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-8">
<div className="pt-12 md:pt-0">
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
 <div className="bg-white rounded-3xl p-4 min-h-[130px] border-l-[4px] border-l-blue-500 border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm">
          Total Applicants
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-3">
          {totalCandidates}
        </h2>
      </div>

      <div className="bg-blue-100 p-3 rounded-2xl">
        <FaUsers className="text-blue-600 text-xl" />
      </div>
    </div>
  </div>

<div className="bg-white rounded-3xl p-4 min-h-[130px] border-l-[4px] border-l-green-500 border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm">
          Shortlisted
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-green-600 mt-3">
          {shortlisted}
        </h2>
      </div>

      <div className="bg-green-100 p-3 rounded-2xl">
        <FaUserCheck className="text-green-600 text-xl" />
      </div>
    </div>
  </div>

 <div className="bg-white rounded-3xl p-4 min-h-[130px] border-l-[4px] border-l-red-500 border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm">
          Rejected
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-red-600 mt-3">
          {rejected}
        </h2>
      </div>

      <div className="bg-red-100 p-3 rounded-2xl">
        <FaUserTimes className="text-red-600 text-xl" />
      </div>
    </div>
  </div>

  <div className="bg-white rounded-3xl p-4 min-h-[130px] border-l-[4px] border-l-yellow-500 border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm">
          Pending
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-600 mt-3">
          {pending}
        </h2>
      </div>

      <div className="bg-yellow-100 p-3 rounded-2xl">
        <FaUserClock className="text-yellow-600 text-xl" />
      </div>
    </div>
  </div>

</div>
        {/* Analytics + Recent Applicants */}

        <div className="grid grid-cols-1 gap-6">
         

         

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

            <div className="space-y-4">

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
 className="flex flex-col md:flex-row justify-between md:items-center
gap-3 p-4 rounded-3xl border border-slate-200 bg-white
hover:shadow-xl hover:border-blue-200
hover:-translate-y-1 transition-all duration-300 cursor-pointer"
>

                 <div className="flex items-center gap-4">

  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl shadow-sm flex-shrink-0">
    {applicant.name?.charAt(0)}
  </div>

  <div className="min-w-0">

    <h3 className="text-base font-bold text-slate-800 tracking-tight truncate">
      {applicant.name}
    </h3>

    <p className="text-sm text-slate-400 truncate">
      {applicant.email}
    </p>

  </div>

</div>

                    <div className="flex flex-col items-end gap-1">

                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
  {applicant.ai_score || applicant.score || 0}% Match
</div>
                      <span
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${
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

    </div>
  );
}

export default Dashboard;