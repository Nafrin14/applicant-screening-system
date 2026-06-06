import React, {
  useState,
} from "react";

import {
  useNavigate,
  useLocation,
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

 await supabase
  .from("notifications")
  .insert([
    {
      title: "Interview Scheduled",
      candidate_name: candidateName,
      message: `${candidateName} interview scheduled on ${interviewDate} at ${interviewTime}`,
      interview_date: interviewDate,
      interview_time: interviewTime,
      is_read: false,
    },
  ]);

  console.log(data);

  alert(
    "Interview Scheduled Successfully"
  );

  setCandidateName("");
  setInterviewDate("");
  setInterviewTime("");
  setMeetingType("Online");

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
      <Sidebar />

      {/* Main */}

     <div className="flex-1 md:ml-60 pt-20 md:pt-8 px-6 md:px-8 py-6 min-h-screen overflow-y-auto">
        {/* Header */}

        <div className="mb-4">
<h1 className="
text-3xl
md:text-4xl
font-extrabold
bg-gradient-to-r
from-blue-600
to-indigo-600
bg-clip-text
text-transparent
mb-2
">
         
            Schedule Interview
          </h1>

          <p className="text-gray-500 text-sm">
            Manage and schedule candidate interviews
          </p>

        </div>

        {/* Form Card */}

     <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-5 md:p-6 w-full">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

            {/* Candidate */}

            <div className="md:col-span-2">

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
    className="
w-full
bg-slate-50
border
border-slate-200
rounded-2xl
px-4
py-4
outline-none
focus:ring-2
focus:ring-blue-500
focus:border-blue-500
transition-all
"
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

            <div className="md:col-span-2">

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

        <div className="flex justify-center mt-8">
  <button
    onClick={scheduleInterview}
    className="
    bg-gradient-to-r
    from-blue-600
    to-indigo-600
    hover:from-blue-700
    hover:to-indigo-700
    text-white
    px-10
    py-4
    rounded-2xl
    font-semibold
    shadow-lg
    hover:shadow-xl
    transition-all
    duration-300
    hover:-translate-y-1
    "
  >
    Schedule Interview
  </button>
</div>
           

        </div>

      </div>

    </div>
  );
}

export default InterviewSchedule;