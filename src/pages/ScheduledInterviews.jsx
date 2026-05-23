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
  FaCheck,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

function ScheduledInterviews() {

  const navigate =
    useNavigate();

  const [
    interviews,
    setInterviews,
  ] = useState([]);

  useEffect(() => {

    fetchInterviews();

  }, []);

  const fetchInterviews =
    async () => {

    const {
      data,
      error,
    } =
      await supabase
        .from("interviews")
        .select("*")
        .order(
          "id",
          {
            ascending: false,
          }
        );

    if (error) {

      console.log(error);

    } else {

      setInterviews(
        data || []
      );
    }
  };

  const deleteInterview =
    async (id) => {

    const { error } =
      await supabase
        .from("interviews")
        .delete()
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {

      alert(
        "Interview Deleted"
      );

      fetchInterviews();
    }
  };

  const updateStatus =
    async (
      id,
      newStatus
    ) => {

    const { error } =
      await supabase
        .from("interviews")
        .update({
          status:
            newStatus,
        })
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {

      alert(
        "Status Updated"
      );

      fetchInterviews();
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

      <div className="w-64 bg-[#020617] text-white p-5">

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
                  "Scheduled Interviews"
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

      <div className="flex-1 p-5 overflow-y-auto">

        {/* Header */}

        <div className="mb-5">

          <h1 className="text-3xl font-black text-slate-900 mb-1">
            Scheduled Interviews
          </h1>

          <p className="text-gray-500 text-sm">
            Manage candidate interview schedules
          </p>

        </div>

        {/* Table Card */}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 border-b border-slate-200">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Candidate
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Date
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Time
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Meeting Type
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {interviews.map(
                  (
                    interview
                  ) => (

                  <tr
                    key={
                      interview.id
                    }

                    className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                  >

                    <td className="px-6 py-5">

                      <div className="font-bold text-slate-800 text-sm">

                        {
                          interview.candidate_name
                        }

                      </div>

                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">

                      {
                        interview.interview_date
                      }

                    </td>

                    <td className="px-6 py-5 text-sm text-gray-600">

                      {
                        interview.interview_time
                      }

                    </td>

                    <td className="px-6 py-5">

                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">

                        {
                          interview.meeting_type
                        }

                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          interview.status ===
                          "Completed"

                            ? "bg-green-100 text-green-700"

                            : interview.status ===
                              "Cancelled"

                            ? "bg-red-100 text-red-700"

                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >

                        {
                          interview.status
                        }

                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            updateStatus(
                              interview.id,
                              "Completed"
                            )
                          }

                          className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        >

                          <FaCheck />

                          Complete

                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              interview.id,
                              "Cancelled"
                            )
                          }

                          className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        >

                          <FaTimes />

                          Cancel

                        </button>

                        <button
                          onClick={() =>
                            deleteInterview(
                              interview.id
                            )
                          }

                          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                        >

                          <FaTrash />

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

export default ScheduledInterviews;