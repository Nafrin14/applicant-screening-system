import React from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

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
} from "react-icons/fa";

function CandidateDetails() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const applicant =
    location.state;

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

  return (

    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}

      <div className="w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shadow-2xl">

        <div>

          <h1 className="text-2xl font-extrabold mb-10 leading-snug">
            Applicant Screening System
          </h1>

          <ul className="space-y-2">

            {menuItems.map(
              (item) => (

              <li
                key={item.name}
                onClick={() =>
                  navigate(
                    item.path
                  )
                }
                className="p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-slate-800"
              >

                <div className="flex items-center gap-3">

                  {item.icon}

                  <span className="text-sm font-medium">
                    {item.name}
                  </span>

                </div>

              </li>

            ))}

          </ul>

        </div>

      </div>

      {/* Main Content */}

      <div className="flex-1 p-8">

        <div className="bg-white rounded-3xl shadow-md p-8 max-w-5xl">

          <div className="flex justify-between items-center mb-8">

            <div>

              <h1 className="text-4xl font-extrabold text-slate-800">
                Candidate Details
              </h1>

              <p className="text-gray-500 mt-2">
                Applicant full information
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/results")
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl"
            >
              Back
            </button>

          </div>

          <div className="grid grid-cols-2 gap-6">

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Full Name
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.name}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Email
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.email}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Role
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.role || "Frontend Developer"}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                AI Match Score
              </p>

              <h2 className="text-xl font-bold text-blue-600">
                {applicant?.ai_score ||
                  applicant?.score ||
                  0}
              </h2>

            </div>

            

          <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Status
              </p>

              <span
                className={`px-4 py-2 rounded-full font-semibold ${
                  applicant?.status ===
                  "Shortlisted"
                    ? "bg-green-100 text-green-600"
                    : applicant?.status ===
                      "Rejected"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >

                {applicant?.status}

              </span>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

  <p className="text-gray-500 mb-2">
    Recommendation
  </p>

  <h2 className="text-xl font-bold text-purple-600">
    {applicant?.recommendation || "Pending"}
  </h2>

</div>


          </div>

        </div>

      </div>

    </div>
  );
}

export default CandidateDetails;