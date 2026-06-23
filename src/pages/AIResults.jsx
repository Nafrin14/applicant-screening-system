import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";


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
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");
  const [scoreFilter, setScoreFilter] = useState("All");

 
  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    const { data, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("source", "Manual")
      .order("ai_score", {
        ascending: false,
      });

    if (error) {
      console.log(error);
    } else {
      setCandidates(data || []);
    }
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Candidates",
      path: "/results",
      icon: <FaUsers />,
    },
    {
      name: "Resume Upload",
      path: "/upload",
      icon: <FaFileUpload />,
    },
    {
      name: "AI Results",
      path: "/ai-results",
      icon: <FaRobot />,
    },
    {
      name: "Interview Schedule",
      path: "/interview-schedule",
      icon: <FaCalendarAlt />,
    },
    {
      name: "Scheduled Interviews",
      path: "/scheduled-interviews",
      icon: <FaClipboardList />,
    },
    {
      name: "Job Post",
      path: "/job-post",
      icon: <FaBriefcase />,
    },
    {
      name: "Posted Jobs",
      path: "/jobs",
      icon: <FaSuitcase />,
    },
    {
      name: "Indeed Applicants",
      path: "/indeed-applicants",
      icon: <FaUserFriends />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
    },
  ];

 const filteredCandidates = candidates.filter((candidate) => {

  const matchesName =
    candidate.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All"
      ? true
      : candidate.status === statusFilter;

  const score =
    candidate.ai_score || candidate.score || 0;

  const matchesScore =
    scoreFilter === "All"
      ? true
      : score >= Number(scoreFilter);

  return (
    matchesName &&
    matchesStatus &&
    matchesScore
  );
});

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main */}
        <div className="flex-1 md:ml-56 mt-16 p-4 md:p-6 min-h-screen overflow-y-auto">
          {/* Header */}
          <div className="mb-5">
            
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
              AI Screening
            </h1>
            <p className="text-gray-500 text-sm">
              Smart AI candidate analysis dashboard 

              
            </p>

            
          </div>
          

         <div className="flex flex-wrap gap-3 mb-6">
  {/* Search */}
  <input
    type="text"
    placeholder="Search candidates by name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:w-64 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />

  {/* Status */}
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  className="w-48 px-4 py-2 border rounded-xl bg-white">
    <option value="All">All Status</option>
    <option value="Shortlisted">Shortlisted</option>
    <option value="Pending">Pending</option>
    <option value="Rejected">Rejected</option>
  </select>

  {/* Score */}
  <select
    value={scoreFilter}
    onChange={(e) => setScoreFilter(e.target.value)}
   
  className="w-48 px-4 py-2 border rounded-xl bg-white">
    <option value="All">All Scores</option>
    <option value="90">90+ Score</option>
    <option value="80">80+ Score</option>
    <option value="70">70+ Score</option>
  </select>
</div>
         

          {/* Cards Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            
            {/* BUG FIX HERE: Map over filteredCandidates instead of candidates */}
            {filteredCandidates.map((candidate, index) => (
              <div
                key={candidate.id}
                className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
                  <div className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-14 h-14 rounded-2xl shadow-md">
                    <span className="text-sm font-black leading-none">
                      {candidate.ai_score || candidate.score || 0}%
                    </span>
                    <span className="text-[9px] text-blue-100 mt-1 font-medium">
                      Score
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      candidate.status === "Shortlisted"
                        ? "bg-green-100 text-green-700"
                        : candidate.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {candidate.status}
                  </span>
                </div>

                {/* AI Result */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <h3 className="text-xs font-bold text-slate-800 mb-2">
                    AI Recommendation
                  </h3>

                  <p className="text-gray-700 whitespace-pre-wrap leading-5 text-[11px]">
                    {candidate.recommendation || "AI recommendation not available"}
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
                  <button
                    onClick={() => setSelectedResume(candidate.resume_url)}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
                  >
                    <FaEye />
                    Resume
                  </button>

                  <button
                    onClick={() =>
                      navigate("/candidate-details", {
                        state: candidate,
                      })
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-[11px] font-semibold shadow-sm transition-all"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}

          </div>

          {/* Empty State UI Hint */}
          {filteredCandidates.length === 0 && (
            <div className="text-center text-gray-400 mt-12 w-full text-sm font-semibold">
              No matching applicants found for "{searchTerm}"
            </div>
          )}

        </div>

        {/* Resume Modal Overlay */}
        {selectedResume && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] relative">
              <button
                onClick={() => setSelectedResume(null)}
                className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg z-10 font-bold hover:bg-red-600 transition-all"
              >
                X
              </button>
              <iframe
                src={selectedResume}
                title="Resume Viewer"
                className="w-full h-full rounded-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResults;