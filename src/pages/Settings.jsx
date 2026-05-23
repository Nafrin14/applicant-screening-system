import React from "react";

import {
  useNavigate,
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
  FaBell,
  FaShieldAlt,
  FaDatabase,
  FaUserCircle,
  FaSave,
  FaSignOutAlt,
  FaCheckCircle,
} from "react-icons/fa";

function Settings() {

  const navigate =
    useNavigate();

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
                  "Settings"
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

        <div className="mb-6">

          <h1 className="text-4xl font-black text-slate-900 mb-1">
            Settings
          </h1>

          <p className="text-gray-500 text-sm">
            Manage your account and system settings
          </p>

        </div>

        {/* Top Grid */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

          {/* Profile */}

          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center gap-4 mb-6">

              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">

                <FaUserCircle className="text-4xl text-blue-600" />

              </div>

              <div>

                <h2 className="text-2xl font-black text-slate-800">
                  Profile Settings
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Update company and HR details
                </p>

              </div>

            </div>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Company Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="text"
                placeholder="HR Role"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />

            </div>

          </div>

          {/* Security */}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">

                <FaShieldAlt className="text-red-500 text-xl" />

              </div>

              <div>

                <h2 className="text-xl font-black text-slate-800">
                  Security
                </h2>

                <p className="text-gray-500 text-sm">
                  Password protection
                </p>

              </div>

            </div>

            <div className="space-y-4">

              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />

              <input
                type="password"
                placeholder="Confirm Password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />

            </div>

          </div>

        </div>

        {/* Bottom Grid */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Notifications */}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center">

                <FaBell className="text-yellow-500 text-xl" />

              </div>

              <div>

                <h2 className="text-xl font-black text-slate-800">
                  Notifications
                </h2>

                <p className="text-gray-500 text-sm">
                  Manage alerts
                </p>

              </div>

            </div>

            <div className="space-y-5 text-sm">

              <label className="flex items-center justify-between">

                <span className="font-medium text-slate-700">
                  Email Notifications
                </span>

                <input type="checkbox" />

              </label>

              <label className="flex items-center justify-between">

                <span className="font-medium text-slate-700">
                  Candidate Alerts
                </span>

                <input type="checkbox" />

              </label>

              <label className="flex items-center justify-between">

                <span className="font-medium text-slate-700">
                  Resume Upload Alerts
                </span>

                <input type="checkbox" />

              </label>

            </div>

          </div>

          {/* System Info */}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">

                <FaDatabase className="text-green-600 text-xl" />

              </div>

              <div>

                <h2 className="text-xl font-black text-slate-800">
                  System Info
                </h2>

                <p className="text-gray-500 text-sm">
                  Current system status
                </p>

              </div>

            </div>

            <div className="space-y-4 text-sm">

              <div className="flex justify-between">

                <span className="text-gray-500">
                  App Version
                </span>

                <span className="font-semibold">
                  1.0.0
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  System Status
                </span>

                <span className="text-green-600 font-semibold">
                  Active
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-500">
                  Database
                </span>

                <span className="text-blue-600 font-semibold">
                  Connected
                </span>

              </div>

            </div>

          </div>

          {/* Backend */}

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">

                <FaCheckCircle className="text-blue-600 text-xl" />

              </div>

              <div>

                <h2 className="text-xl font-black text-slate-800">
                  Backend Status
                </h2>

                <p className="text-gray-500 text-sm">
                  Services running
                </p>

              </div>

            </div>

            <div className="space-y-4 text-sm">

              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-2xl font-semibold">
                ✅ Supabase Connected
              </div>

              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-semibold">
                ✅ AI Screening Active
              </div>

              <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-2xl font-semibold">
                ✅ Resume Upload Working
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Buttons */}

        <div className="flex gap-4 mt-8">

          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-4 rounded-2xl font-semibold shadow-sm transition-all">

            <FaSave />

            Save Changes

          </button>

          <button
            onClick={() =>
              navigate("/")
            }

            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-7 py-4 rounded-2xl font-semibold shadow-sm transition-all"
          >

            <FaSignOutAlt />

            Logout

          </button>

        </div>

      </div>

    </div>
  );
}

export default Settings;