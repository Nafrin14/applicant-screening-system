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
  FaSearch,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

function JobList() {

  const navigate =
    useNavigate();

  const [jobs, setJobs] =
    useState([]);

  const [
    viewMode,
    setViewMode,
  ] = useState("table");

  const [
    search,
    setSearch,
  ] = useState("");

  useEffect(() => {

    fetchJobs();

  }, []);

  const fetchJobs =
    async () => {

    const {
      data,
      error,
    } =
      await supabase
        .from("job_posts")
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

      setJobs(data || []);
    }
  };

  const deleteJob =
    async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this job post?"
      );

    if (
      !confirmDelete
    ) return;

    const { error } =
      await supabase
        .from("job_posts")
        .delete()
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {

      alert(
        "Job Deleted"
      );

      fetchJobs();
    }
  };

  const filteredJobs =
    jobs.filter((job) =>

      job.title
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

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
                  "Posted Jobs"
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

        <div className="flex justify-between items-center mb-5">

          <div>

            <h1 className="text-3xl font-black text-slate-900 mb-1">
              Posted Jobs
            </h1>

            <p className="text-gray-500 text-sm">
              Manage all posted job opportunities
            </p>

          </div>

          {/* Toggle */}

          <div className="flex gap-2">

            <button
              onClick={() =>
                setViewMode(
                  "table"
                )
              }

              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                viewMode ===
                "table"

                  ? "bg-blue-600 text-white"

                  : "bg-gray-300 text-gray-700"
              }`}
            >

              Table View

            </button>

            <button
              onClick={() =>
                setViewMode(
                  "card"
                )
              }

              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                viewMode ===
                "card"

                  ? "bg-blue-600 text-white"

                  : "bg-gray-300 text-gray-700"
              }`}
            >

              Card View

            </button>

          </div>

        </div>

        {/* Search */}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 shadow-sm">

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4">

            <FaSearch className="text-gray-400" />

            <input
              type="text"
              placeholder="Search jobs..."

              value={search}

              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }

              className="w-full bg-transparent px-4 py-3 outline-none"
            />

          </div>

        </div>

        {/* Empty */}

        {filteredJobs.length === 0 ? (

          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-200">

            <h2 className="text-xl font-bold text-slate-700 mb-2">
              No Jobs Found
            </h2>

            <p className="text-gray-500">
              No job posts available
            </p>

          </div>

        ) : viewMode ===
          "table" ? (

          /* Table View */

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-50 border-b border-slate-200">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Job Title
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Skills
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Experience
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Location
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Salary
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-bold text-slate-700">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredJobs.map(
                    (job) => (

                    <tr
                      key={job.id}

                      className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                    >

                      <td className="px-6 py-5">

                        <div className="font-bold text-slate-800 text-sm">

                          {job.title}

                        </div>

                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {job.skills}
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {job.experience}
                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2 text-sm text-gray-600">

                          <FaMapMarkerAlt className="text-blue-500" />

                          {job.location}

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600">

                          <FaMoneyBillWave />

                          {job.salary}

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <div className="flex gap-2">

                          <button
                            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                          >

                            <FaEdit />

                            Edit

                          </button>

                          <button
                            onClick={() =>
                              deleteJob(
                                job.id
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

        ) : (

          /* Card View */

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filteredJobs.map(
              (job) => (

              <div
                key={job.id}

                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
              >

                <div className="flex justify-between items-start mb-4">

                  <div>

                    <h2 className="text-xl font-black text-slate-800 mb-1">

                      {job.title}

                    </h2>

                    <p className="text-sm text-gray-500">
                      {job.experience}
                    </p>

                  </div>

                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    Active
                  </div>

                </div>

                <div className="space-y-3 text-sm text-gray-600">

                  <div>

                    <span className="font-bold text-slate-700">
                      Skills:
                    </span>

                    {" "}

                    {job.skills}

                  </div>

                  <div className="flex items-center gap-2">

                    <FaMapMarkerAlt className="text-blue-500" />

                    {job.location}

                  </div>

                  <div className="flex items-center gap-2 text-green-600 font-semibold">

                    <FaMoneyBillWave />

                    {job.salary}

                  </div>

                </div>

                <p className="text-gray-600 text-sm mt-4 line-clamp-3">

                  {job.description}

                </p>

                <div className="flex gap-2 mt-5">

                  <button
                    className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  >

                    <FaEdit />

                    Edit

                  </button>

                  <button
                    onClick={() =>
                      deleteJob(
                        job.id
                      )
                    }

                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  >

                    <FaTrash />

                    Delete

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default JobList;