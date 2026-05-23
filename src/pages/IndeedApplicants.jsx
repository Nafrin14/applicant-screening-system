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
  FaDownload,
  FaUpload,
  FaPhone,
  FaMapMarkerAlt,
  FaStar,
  FaEye,
  FaPaperPlane,
} from "react-icons/fa";

function IndeedApplicants() {

  const navigate =
    useNavigate();

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    applicants,
    setApplicants,
  ] = useState([]);

  const [
    selectedResume,
    setSelectedResume,
  ] = useState(null);

  useEffect(() => {

    fetchApplicants();

  }, []);

  const fetchApplicants =
    async () => {

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "indeed_applicants"
        )
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

      setApplicants(
        data || []
      );
    }
  };

  const sendToAI =
    async (
      applicant
    ) => {

    const { error } =
      await supabase
        .from("applicants")
        .insert([
          {

            name:
              applicant.name,

            email:
              applicant.email,

            phone:
              applicant.phone,

            skills:
              applicant.skills,

            ai_score:
              applicant.score || 0,

            status:
              applicant.status ||
              "Pending",

            experience:
              applicant.experience,

            role:
              applicant.job_title,

            location:
              applicant.location,

            resume_url:
              applicant.resume_url,
          },
        ]);

    if (error) {

      console.log(error);

      alert(
        "Failed To Send"
      );

    } else {

      alert(
        "Sent To AI Screening"
      );
    }
  };

  const downloadCSV =
    () => {

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Job",
      "Location",
      "Experience",
      "Skills",
      "Score",
      "Status",
    ];

    const rows =
      applicants.map(
        (
          applicant
        ) => [
          applicant.name,
          applicant.email,
          applicant.phone,
          applicant.job_title,
          applicant.location,
          applicant.experience,
          applicant.skills,
          applicant.score,
          applicant.status,
        ]
      );

    let csvContent =
      "data:text/csv;charset=utf-8,";

    csvContent +=
      headers.join(",") +
      "\n";

    rows.forEach(
      (row) => {

      csvContent +=
        row.join(",") +
        "\n";

    });

    const encodedUri =
      encodeURI(
        csvContent
      );

    const link =
      document.createElement(
        "a"
      );

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      "indeed_applicants.csv"
    );

    document.body.appendChild(
      link
    );

    link.click();
  };

  const filteredApplicants =
    applicants.filter(
      (
        applicant
      ) =>
        applicant.name
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
                  "Indeed Applicants"
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

            <h1 className="text-4xl font-black text-slate-900 mb-1">
              Indeed Applicants
            </h1>

            <p className="text-gray-500 text-sm">
              Manage imported Indeed applicants
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                navigate(
                  "/csv-upload"
                )
              }

              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-sm transition-all"
            >

              <FaUpload />

              Upload CSV

            </button>

            <button
              onClick={
                downloadCSV
              }

              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-sm transition-all"
            >

              <FaDownload />

              Download CSV

            </button>

          </div>

        </div>

        {/* Search */}

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 shadow-sm">

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4">

            <FaSearch className="text-gray-400" />

            <input
              type="text"
              placeholder="Search applicant..."

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

        {/* Cards */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {filteredApplicants.map(
            (
              applicant
            ) => (

            <div
              key={
                applicant.id
              }

              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all"
            >

              {/* Top */}

              <div className="flex justify-between items-start mb-5">

                <div>

                  <h2 className="text-2xl font-black text-slate-800 mb-1">

                    {
                      applicant.name
                    }

                  </h2>

                  <p className="text-gray-500 text-sm">

                    {
                      applicant.email
                    }

                  </p>

                </div>

                {/* NEW SCORE BADGE */}

                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm">

                  <div className="flex items-center gap-2">

                    <FaStar className="text-xs" />

                    <span className="text-lg font-bold">
                      {applicant.score}%
                    </span>

                  </div>

                </div>

              </div>

              {/* Details */}

              <div className="space-y-3 text-sm">

                <div className="flex items-center gap-2 text-gray-700">

                  <FaPhone className="text-blue-500" />

                  <a
                    href={`tel:${applicant.phone}`}

                    className="hover:text-blue-600"
                  >

                    {
                      applicant.phone
                    }

                  </a>

                </div>

                <div>

                  <span className="font-bold text-slate-700">
                    Job:
                  </span>

                  {" "}

                  {
                    applicant.job_title
                  }

                </div>

                <div className="flex items-center gap-2 text-gray-700">

                  <FaMapMarkerAlt className="text-red-500" />

                  {
                    applicant.location
                  }

                </div>

                <div>

                  <span className="font-bold text-slate-700">
                    Experience:
                  </span>

                  {" "}

                  {
                    applicant.experience
                  }

                </div>

                <div>

                  <span className="font-bold text-slate-700">
                    Skills:
                  </span>

                  {" "}

                  {
                    applicant.skills
                  }

                </div>

                <div className="pt-2">

                  <span className="font-bold text-slate-700 mr-2">
                    Status:
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      applicant.status ===
                      "Shortlisted"

                        ? "bg-green-100 text-green-700"

                        : applicant.status ===
                          "Pending"

                        ? "bg-yellow-100 text-yellow-700"

                        : "bg-red-100 text-red-700"
                    }`}
                  >

                    {
                      applicant.status ||
                      "Pending"
                    }

                  </span>

                </div>

              </div>

              {/* Buttons */}

              <div className="flex gap-3 mt-6">

                <button
                  onClick={() =>
                    sendToAI(
                      applicant
                    )
                  }

                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-all"
                >

                  <FaPaperPlane />

                  Send To AI

                </button>

                {applicant.resume_url && (

                  <button
                    onClick={() =>
                      setSelectedResume(
                        applicant.resume_url
                      )
                    }

                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-all"
                  >

                    <FaEye />

                    Resume

                  </button>

                )}

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Resume Modal */}

      {selectedResume && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white w-[90%] h-[90%] rounded-3xl relative overflow-hidden">

            <button
              onClick={() =>
                setSelectedResume(
                  null
                )
              }

              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl z-50"
            >

              Close

            </button>

            <object
              data={selectedResume}
              type="application/pdf"
              width="100%"
              height="100%"
            >

              <p>
                PDF preview not available.
              </p>

            </object>

          </div>

        </div>

      )}

    </div>
  );
}

export default IndeedApplicants;