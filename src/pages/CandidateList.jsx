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
} from "react-icons/fa";

function CandidateList() {

  const navigate =
    useNavigate();

  const [
    applicants,
    setApplicants,
  ] = useState([]);

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants =
    async () => {

    const { data, error } =
      await supabase
        .from("applicants")
        .select("*");

    if (error) {

      console.log(error);

    } else {

      setApplicants(data || []);

    }
  };

  /* Delete Function */

  const handleDelete =
    async (id) => {

    const { error } =
      await supabase
        .from("applicants")
        .delete()
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {

      fetchApplicants();

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
                className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-slate-800 hover:translate-x-1 ${
                  item.name ===
                  "Candidates"
                    ? "bg-slate-800"
                    : ""
                }`}
              >

                <div className="flex items-center gap-3">

                  <span className="text-base">
                    {item.icon}
                  </span>

                  <span className="font-medium text-sm">
                    {item.name}
                  </span>

                </div>

              </li>

            ))}

          </ul>

        </div>

      </div>

      {/* Main Content */}

      <div className="flex-1 p-8 overflow-y-auto">

        {/* Header */}

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl font-extrabold text-slate-800">
              Candidate List
            </h1>

            <p className="text-gray-500 mt-1 text-base">
              Manage all applicants
            </p>

          </div>

          <div className="flex gap-3">

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

          </div>

        </div>

        {/* Table Card */}

        <div className="bg-white rounded-3xl shadow-md p-6">

          {/* Search */}

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Applicant List
            </h2>

            <input
              type="text"
              placeholder="Search candidate..."
              className="bg-slate-100 border border-gray-200 px-5 py-3 rounded-2xl outline-none w-72"
            />

          </div>

          {/* Table */}

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-gray-200 text-left">

                  <th className="py-4 text-gray-500 font-semibold">
                    Candidate
                  </th>

                  <th className="text-gray-500 font-semibold">
                    Email
                  </th>

                  <th className="text-gray-500 font-semibold">
                    AI Score
                  </th>

                  <th className="text-gray-500 font-semibold">
                    Status
                  </th>

                  <th className="text-gray-500 font-semibold">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {applicants.map(
                  (applicant) => (

                  <tr
                    key={applicant.id}
                    className="border-b border-gray-100 hover:bg-slate-50 transition"
                  >

                    <td className="py-5">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">

                          {applicant.name
                            ?.charAt(0)}

                        </div>

                        <div>

                          <h3 className="font-bold text-slate-800">
                            {applicant.name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Applicant
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="text-gray-600">

                      {applicant.email}

                    </td>

                    <td>

                      <span className="font-bold text-blue-600">

                        {applicant.ai_score ||
                          applicant.score ||
                          0}

                      </span>

                    </td>

                    <td>

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

                        {applicant.status}

                      </span>

                    </td>

                    <td>

                      <div className="flex gap-2">

                        {/* View */}

                        <button
                          onClick={() =>
                            navigate(
                              "/candidate-details",
                              {
                                state:
                                  applicant,
                              }
                            )
                          }
                          className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-3 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          View
                        </button>

                        {/* Edit */}

                        <button
                          onClick={() =>
                            navigate(
                              "/candidate-details",
                              {
                                state:
                                  applicant,
                              }
                            )
                          }
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Edit
                        </button>

                        {/* Delete */}

                        <button
                          onClick={() =>
                            handleDelete(
                              applicant.id
                            )
                          }
                          className="bg-red-100 hover:bg-red-200 text-red-600 px-3 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CandidateList;