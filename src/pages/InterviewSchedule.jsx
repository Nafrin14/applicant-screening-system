import React, {
  useState,
} from "react";

import {
  useNavigate,
  useLocation,
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
  FaUser,
  FaClock,
  FaVideo,
} from "react-icons/fa";

function InterviewSchedule() {

  const navigate =
    useNavigate();

    const location =
  useLocation();

const applicant =
  location.state;

  console.log(
  "Applicant Data:",
  applicant
);

  const [
  candidateName,
  setCandidateName,
] = useState(
  applicant?.name || ""
);

const [
  email,
  setEmail,
] = useState(
  applicant?.email || ""
);

const [
  phone,
  setPhone,
] = useState(
  applicant?.phone || ""
);

  const [
    interviewDate,
    setInterviewDate,
  ] = useState("");

  const [
    interviewTime,
    setInterviewTime,
  ] = useState("");

  const [
    meetingType,
    setMeetingType,
  ] = useState("Online");

  const scheduleInterview =
    async () => {

    if (
      !candidateName ||
      !interviewDate ||
      !interviewTime
    ) {

      alert(
        "Please fill all fields"
      );

      return;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("interviews")
        .insert([
  {
    candidate_name:
      candidateName,

    email:
      email,

    phone:
      phone,

    interview_date:
      interviewDate,

    interview_time:
      interviewTime,

    meeting_type:
      meetingType,

    status:
      "Scheduled",
  },
])
        .select();

    if (error) {

      console.log(
        error.message
      );

      alert(
        error.message
      );

    } else {

      console.log(data);

      alert(
        "Interview Scheduled Successfully"
      );

      setCandidateName("");
      setInterviewDate("");
      setInterviewTime("");
      setMeetingType(
        "Online"
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
                  "Interview Schedule"
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
            Schedule Interview
          </h1>

          <p className="text-gray-500 text-sm">
            Manage and schedule candidate interviews
          </p>

        </div>

        {/* Form Card */}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-4xl">

          <div className="grid grid-cols-2 gap-5">

            {/* Candidate */}

            <div className="col-span-2">

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Candidate Name
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaUser className="text-gray-400" />

                <input
                  type="text"
                  placeholder="Enter candidate name"
                  value={candidateName}
                  onChange={(e) =>
                    setCandidateName(
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>
            <div>

  <label className="text-sm font-semibold text-slate-700 mb-2 block">
    Email
  </label>

  <input
    type="text"
    value={email}
    readOnly
    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
  />

</div>
<div>

  <label className="text-sm font-semibold text-slate-700 mb-2 block">
    Phone Number
  </label>

  <input
    type="text"
    value={phone}
    readOnly
    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
  />

</div>
            {/* Date */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Interview Date
              </label>

              <input
                type="date"
                value={interviewDate}
                onChange={(e) =>
                  setInterviewDate(
                    e.target.value
                  )
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
              />

            </div>

            {/* Time */}

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Interview Time
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaClock className="text-gray-400" />

                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) =>
                    setInterviewTime(
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            {/* Meeting Type */}

            <div className="col-span-2">

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Meeting Type
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaVideo className="text-gray-400" />

                <select
                  value={meetingType}
                  onChange={(e) =>
                    setMeetingType(
                      e.target.value
                    )
                  }
                  className="w-full bg-transparent px-4 py-4 outline-none"
                >

                  <option>
                    Online
                  </option>

                  <option>
                    Offline
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* Button */}

          <button
            onClick={
              scheduleInterview
            }
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-md transition-all duration-300"
          >

            Schedule Interview

          </button>

        </div>

      </div>

    </div>
  );
}

export default InterviewSchedule;