import React, {
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
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaTools,
  FaUserTie,
} from "react-icons/fa";

function JobPost() {

  const navigate =
    useNavigate();

  const [job, setJob] =
    useState({
      title: "",
      skills: "",
      experience: "",
      location: "",
      salary: "",
      description: "",
    });

  const handleChange =
    (e) => {

    setJob({
      ...job,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {

    e.preventDefault();

    const { error } =
      await supabase
        .from("job_posts")
        .insert([job]);

    if (error) {

      console.log(error);

      alert(
        "Error posting job"
      );

    } else {

      alert(
        "Job Posted Successfully!"
      );

      navigate("/jobs");
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
                  "Job Post"
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

      <div className="flex-1 p-6 overflow-y-auto">

        {/* Header */}

        <div className="mb-6">

          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Create Job Post
          </h1>

          <p className="text-gray-500 text-sm">
            Create and publish new job opportunities
          </p>

        </div>

        {/* Form Card */}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-5xl">

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Job Title */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Job Title
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaUserTie className="text-gray-400" />

                <input
                  type="text"
                  name="title"
                  placeholder="Enter job title"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            {/* Skills */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Required Skills
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaTools className="text-gray-400" />

                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, SQL"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            {/* Experience & Location */}

            <div className="grid grid-cols-2 gap-5">

              <div>

                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Experience
                </label>

                <input
                  type="text"
                  name="experience"
                  placeholder="2+ Years"
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
                />

              </div>

              <div>

                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Location
                </label>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                  <FaMapMarkerAlt className="text-gray-400" />

                  <input
                    type="text"
                    name="location"
                    placeholder="Doha, Qatar"
                    onChange={handleChange}
                    className="w-full bg-transparent px-4 py-4 outline-none"
                  />

                </div>

              </div>

            </div>

            {/* Salary */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Salary
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaMoneyBillWave className="text-gray-400" />

                <input
                  type="text"
                  name="salary"
                  placeholder="QAR 5000 - 7000"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            {/* Description */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Job Description
              </label>

              <textarea
                name="description"
                placeholder="Enter detailed job description..."
                onChange={handleChange}
                rows="6"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none resize-none"
              ></textarea>

            </div>

            {/* Button */}

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-md transition-all duration-300"
            >

              Post Job

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default JobPost;