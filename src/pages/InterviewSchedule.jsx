import React, {
  useState,
  useEffect,
  useRef,
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

 const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;


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
useEffect(() => {
  fetchCandidates();
}, []);
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target)
    ) {
      setFilteredCandidates([]);
    }
  };

  document.addEventListener(
    "mousedown",
    handleClickOutside
  );

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

const fetchCandidates = async () => {
  const { data, error } = await supabase
    .from("applicants")
   .select("*");

    console.log("Candidates:", data);
console.log("Error:", error);

  if (!error) {
    setCandidates(data || []);
  }
};

const handleCandidateChange = (e) => {
  console.log("Typing:", e.target.value);
  const value = e.target.value;

  setCandidateName(value);

  if (!value.trim()) {
    setFilteredCandidates([]);
    return;
  }

  const filtered = candidates.filter((candidate) =>
    candidate.name
      ?.toLowerCase()
      .includes(value.toLowerCase())
  );
console.log("Filtered:", filtered);
  setFilteredCandidates(filtered);
};
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

const [candidates, setCandidates] = useState([]);
const [filteredCandidates, setFilteredCandidates] = useState([]);
const dropdownRef = useRef(null);
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

  const [showPreview, setShowPreview] = useState(false);

  const createGHLContact = async () => {
   
  try {

    console.log("GHL Test Data:", {
  firstName: candidateName,
  email: email,
  phone: phone,
  locationId: LOCATION_ID,
});
    const response = await fetch(
      "https://services.leadconnectorhq.com/contacts/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: candidateName,
          email: email,
          phone: phone,
          locationId: LOCATION_ID,
        }),
      }
    );

    const result = await response.json();

    console.log("GHL Response:", result);

    return result?.contact?.id;
  } catch (error) {
    console.error("GHL Error:", error);
    return null;
  }
};

const sendSMS = async (contactId) => {
  try {
    const response = await fetch(
  "https://services.leadconnectorhq.com/conversations/messages",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GHL_TOKEN}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
body: JSON.stringify({
  type: "SMS",
  contactId: contactId,
 message: `Hello ${candidateName},

I'm Sean from KD Landscaping.

Recently you applied for the Landscaping Foreman position through Indeed.

Do you have a driving license?

Can you come to 9950 County Rd, Clarence Center, NY 14032, USA on ${interviewDate} at ${interviewTime}?`

    }),
  }
);

console.log("Sending SMS to Contact:", contactId);
    const result = await response.json();

    console.log("SMS Response:", result);

    return result;
  } catch (error) {
    console.error("SMS Error:", error);
  }
};

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


  // TODO: GHL API Integration
  /*const contactId = await createGHLContact();
  console.log("Contact ID:", contactId);
  if (!contactId) {
  alert("GHL Contact Creation Failed");
  return;
}
await sendSMS(contactId);*/
const contactId = "gHNySydEIaXvZBYPy1mq";

console.log("Using Existing Contact ID:", contactId);

await sendSMS(contactId);
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

   <div className="min-h-screen bg-slate-100 flex flex-col">

 

  <div className="flex">
      {/* Sidebar */}
       <Sidebar />

      {/* Main */}
   <div className="flex-1 md:ml-56  px-6 md:px-8 py-6 min-h-screen overflow-y-auto">
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

          <div
  className="md:col-span-2 relative"
  ref={dropdownRef}
>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Candidate Name
              </label>

            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaUser className="text-gray-400" />

                <input
  type="text"
  placeholder="Enter candidate name"
  value={candidateName}
  onChange={handleCandidateChange}
  className="w-full bg-transparent px-4 py-4 outline-none"
/>
{filteredCandidates.length > 0 && (
 <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[9999] max-h-52 overflow-y-auto">
    {filteredCandidates.map((candidate, index) => (
      <div
        key={index}
        onClick={() => {
          setCandidateName(candidate.name);
          setEmail(candidate.email);
          setPhone(candidate.phone);
          setFilteredCandidates([]);
        }}
        className="p-3 hover:bg-blue-50 cursor-pointer border-b"
      >
        <p className="font-medium">
          {candidate.name}
        </p>

        <p className="text-xs text-slate-500">
          {candidate.email}
        </p>
      </div>
    ))}

  </div>
)}
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

             <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

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
{showPreview && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white w-[700px] rounded-3xl p-6 shadow-2xl">

      <h2 className="text-2xl font-bold mb-5">
        SMS Preview
      </h2>

      <div className="space-y-4">

        <div className="bg-slate-100 p-4 rounded-2xl">
          Hello {candidateName},
          <br />
          I'm Sean from KD Landscaping.
        </div>

        <div className="bg-slate-100 p-4 rounded-2xl">
          Recently you applied for the Landscaping Foreman position through Indeed.
        </div>

        <div className="bg-slate-100 p-4 rounded-2xl">
          Do you have a driving license?
          <br /><br />
          Can you come to 9950 County Rd, Clarence Center, NY 14032, USA on {interviewDate} at {interviewTime}?
        </div>

      </div>

      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() => setShowPreview(false)}
          className="px-5 py-2 border rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            setShowPreview(false);
            await scheduleInterview();
          }}
          className="bg-blue-600 text-white px-5 py-2 rounded-xl"
        >
          Send SMS
        </button>

      </div>

    </div>

  </div>
)}
    </div>
    </div>
  );
}

export default InterviewSchedule;