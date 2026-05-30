import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

import {
  FaTachometerAlt,
  FaUsers,
  FaFileUpload,
  FaRobot,
  FaCalendarAlt,
  FaClipboardList,
  FaBriefcase,
  FaSuitcase,
  FaUserFriends,
  FaCog,
  FaEye,
} from "react-icons/fa";

function AIResults() {

  const navigate =
    useNavigate();

  const [
    candidates,
    setCandidates,
  ] = useState([]);

  useEffect(() => {

    fetchCandidates();

  }, []);

  const fetchCandidates =
    async () => {

    const {
      data,
      error,
    } =
     await supabase
  .from("applicants")
  .select("*")
  .eq("source", "Manual")
  .order(
    "ai_score",
    {
      ascending: false,
    }
  );
        

    if (error) {

      console.log(error);

    } else {

      setCandidates(
        data || []
      );
    }
  };

  const menuItems = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon:
        <FaTachometerAlt />,
    },

    {
      name: "Candidates",
      path: "/results",
      icon:
        <FaUsers />,
    },

    {
      name: "Resume Upload",
      path: "/upload",
      icon:
        <FaFileUpload />,
    },

    {
      name: "AI Results",
      path: "/ai-results",
      icon:
        <FaRobot />,
    },

    {
      name:
        "Interview Schedule",

      path:
        "/interview-schedule",

      icon:
        <FaCalendarAlt />,
    },

    {
      name:
        "Scheduled Interviews",

      path:
        "/scheduled-interviews",

      icon:
        <FaClipboardList />,
    },

    {
      name:
        "Job Post",

      path:
        "/job-post",

      icon:
        <FaBriefcase />,
    },

    {
      name:
        "Posted Jobs",

      path:
        "/jobs",

      icon:
        <FaSuitcase />,
    },

    {
      name:
        "Indeed Applicants",

      path:
        "/indeed-applicants",

      icon:
        <FaUserFriends />,
    },

    {
      name:
        "Settings",

      path:
        "/settings",

      icon:
        <FaCog />,
    },

  ];

  return (

    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}

      <div className="w-64 bg-[#020617] text-white p-5 fixed left-0 top-0 h-screen overflow-y-auto">
        <div>

          <h1 className="text-3xl font-extrabold leading-tight mb-10">
            Applicant
            <br />
            Screening System
          </h1>

          <ul className="space-y-3">

            {menuItems.map(
              (item) => (

              <li
                key={item.name}

                onClick={() =>
                  navigate(
                    item.path
                  )
                }

                className={`p-2 rounded-xl cursor-pointer transition-all duration-300 hover:text-blue-400 ${
                  item.name ===
                  "AI Results"
                    ? "text-blue-400"
                    : "text-white"
                }`}
              >

                <div className="flex items-center gap-4">

                  <span className="text-base">
                    {item.icon}
                  </span>

                  <span className="font-semibold text-[14px]">
                    {item.name}
                  </span>

                </div>

              </li>

            ))}

          </ul>

        </div>

      </div>

      {/* Main */}

      <div className="flex-1 ml-64 p-5 h-screen overflow-y-auto">
        {/* Header */}

        <div className="mb-5">

          <h1 className="text-3xl font-black text-slate-900 mb-1">
            AI Screening Results
          </h1>

          <p className="text-gray-500 text-sm">
            Smart AI candidate analysis dashboard
          </p>

        </div>

        {/* Cards */}

        <div className="grid grid-cols-3 gap-3">

          {candidates.map(
  (
    candidate,
    index
  ) => (

            <div
              key={candidate.id}

              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300"
            >

              {/* Top */}

              <div className="flex justify-between items-start mb-3">

                <div>
{index === 0 && (
  <div className="text-xs font-bold text-yellow-600 mb-1">
    🥇 Rank #1
  </div>
)}

{index === 1 && (
  <div className="text-xs font-bold text-gray-600 mb-1">
    🥈 Rank #2
  </div>
)}

{index === 2 && (
  <div className="text-xs font-bold text-orange-600 mb-1">
    🥉 Rank #3
  </div>
)}
                  <h2 className="text-lg font-black text-slate-900 mb-1">

                    {candidate.name}

                  </h2>

                  <p className="text-gray-500 text-[11px]">
                    {candidate.role}
                  </p>

                </div>

                {/* Score */}

                <div className="flex flex-col items-center justify-center bg-slate-100 border border-slate-200 w-12 h-12 rounded-xl">

                  <span className="text-xs font-black text-blue-600 leading-none">

                    {
                      candidate.ai_score ||
                      candidate.score ||
                      0
                    }%

                  </span>

                  <span className="text-[8px] text-gray-500 mt-1 font-medium">
                    Score
                  </span>

                </div>

              </div>

              {/* Status */}

              <div className="mb-3">

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    candidate.status ===
                    "Shortlisted"

                      ? "bg-green-100 text-green-700"

                      : candidate.status ===
                        "Pending"

                      ? "bg-yellow-100 text-yellow-700"

                      : "bg-red-100 text-red-600"
                  }`}
                >

                  {candidate.status}

                </span>

              </div>

              {/* AI Result */}

              <div className="bg-slate-50 rounded-2xl p-3  border border-slate-100">

                <h3 className="text-xs font-bold text-slate-800 mb-2">
                  AI Recommendation
                </h3>

                <p className="text-gray-700 whitespace-pre-wrap leading-5 text-[11px]">

                  {
                    candidate.recommendation ||
                    "AI recommendation not available"
                  }

                </p>
                <div className="mt-3 bg-green-50 p-2 rounded-lg">
  <h3 className="text-xs font-bold text-green-600 mb-1">
    Matched Skills
  </h3>

  <p className="text-[11px] text-gray-700">
    {candidate.matched_skills || "N/A"}
  </p>
</div>

<div className="mt-3 bg-red-50 p-2 rounded-lg">
  <h3 className="text-xs font-bold text-red-600 mb-1">
    Missing Skills
  </h3>

  <p className="text-[11px] text-gray-700">
    {candidate.missing_skills || "N/A"}
  </p>
</div>

<div className="mt-3 bg-blue-50 p-2 rounded-lg">
  <h3 className="text-xs font-bold text-blue-600 mb-1">
    Why Suitable
  </h3>

  <p className="text-[11px] text-gray-700">
    {candidate.why_suitable || "N/A"}
  </p>
</div>

              </div>

              {/* Buttons */}

              <div className="flex gap-2 mt-3">

                <a
                  href={
                    candidate.resume_url
                  }

                  target="_blank"

                  rel="noreferrer"

                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
                >

                  <FaEye />

                  Resume

                </a>

                <button
                  onClick={() =>
                    navigate(
                      "/candidate-details",
                      {
                        state:
                          candidate,
                      }
                    )
                  }

                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-[11px] font-semibold shadow-sm transition-all"
                >

                  Details

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default AIResults;