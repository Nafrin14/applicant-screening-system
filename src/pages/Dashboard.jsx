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

    <div className="min-h-screen bg-slate-100 flex">

     {/* Sidebar */}

<Sidebar />
      {/* Main Content */}

     <div className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">

        {/* Header */}

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl font-extrabold text-slate-800">
              Dashboard
            </h1>

            <p className="text-gray-500 mt-1 text-base">
              Welcome back 👋
            </p>

          </div>

         <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={() =>
                navigate(
                  "/upload"
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl shadow-lg transition"
            >
              + Upload Resume
            </button>

            <button
              onClick={() =>
                navigate(
                  "/job-post"
                )
              }
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl shadow-lg transition"
            >
              + Post Job
            </button>

            <button
              onClick={() =>
                navigate(
                  "/results"
                )
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl shadow-lg transition"
            >
              View Applicants
            </button>

          </div>

        </div>

        {/* Stats Cards */}

       <div className="grid grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">

          <div className="bg-white p-2 sm:p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition">

            <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm mb-1 md:mb-2 truncate">
              Total Applicants
            </p>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-800">
              {totalCandidates}
            </h2>

          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 sm:p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition">

            <p className="text-[10px] sm:text-xs md:text-sm mb-1 md:mb-2 truncate">
              Shortlisted
            </p>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold">
              {shortlisted}
            </h2>

          </div>

          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-2 sm:p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition">

            <p className="text-[10px] sm:text-xs md:text-sm mb-1 md:mb-2 truncate">
              Rejected
            </p>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold">
              {rejected}
            </h2>

          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 sm:p-3 md:p-5 rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition">

            <p className="text-[10px] sm:text-xs md:text-sm mb-1 md:mb-2 truncate">
              Pending
            </p>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold">
              {pending}
            </h2>

          </div>

        </div>

        {/* Analytics + Recent Applicants */}

        <div className="grid grid-cols-1 gap-6">
         

         

          {/* Recent Applicants */}

          <div className="bg-white rounded-3xl p-6 shadow-md">

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-bold text-slate-800">
                Recent Applicants
              </h2>

              <button
                onClick={() =>
                  navigate(
                    "/results"
                  )
                }
                className="text-blue-600 font-semibold"
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
 className="flex flex-col md:flex-row justify-between md:items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:shadow-md transition cursor-pointer hover:bg-slate-50"
>

                    <div className="flex items-center gap-4">

                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {applicant.name
                          ?.charAt(0)}
                      </div>

                      <div>

                        <h3 className="text-base font-bold text-slate-800">
                          {
                            applicant.name
                          }
                        </h3>

                        <p className="text-sm text-gray-500">
                          {
                            applicant.email
                          }
                        </p>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="font-bold text-blue-600 text-base">
                        Score:
                        {" "}
                        {applicant.ai_score ||
                          applicant.score ||
                          0}
                      </p>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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