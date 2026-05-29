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

  useEffect(() => {

    fetchApplicants();

  }, []);

  /* FETCH APPLICANTS */

  const fetchApplicants =
    async () => {

      const {
        data,
        error,
      } =
        await supabase
          .from("applicants")
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

  /* CONNECT INDEED */

  const connectIndeed =
    async () => {

      try {

        const response =
          await fetch(
            "http://localhost:5000/api/indeed/auth-url"
          );

        const data =
          await response.json();

        if (
          data?.authUrl
        ) {

          window.open(
            data.authUrl,
            "_blank"
          );
        }

      } catch (error) {

        console.log(error);

        alert(
          "Failed to connect Indeed"
        );
      }
    };

  /* SEND TO AI */

  const sendToAI =
    async (
      applicant
    ) => {

      const { error } =
        await supabase
          .from("applicants")
          .update({
            ai_status:
              "Screened",
          })
          .eq(
            "id",
            applicant.id
          );

      if (error) {

        console.log(error);

        alert(
          "Failed To Send"
        );

      } else {

        alert(
          "Sent To AI Screening"
        );

        fetchApplicants();
      }
    };

  /* DOWNLOAD CSV */

  const downloadCSV =
    () => {

      const headers = [
        "Name",
        "Email",
        "Role",
        "AI Score",
        "Status",
      ];

      const rows =
        applicants.map(
          (
            applicant
          ) => [
            applicant.name,
            applicant.email,
            applicant.role,
            applicant.ai_score,
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

        }
      );

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

  /* SEARCH */

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

  /* SIDEBAR */

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

      {/* Main */}

      <div className="flex-1 p-5 overflow-y-auto">

        {/* Header */}

        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">

          <div>

            <h1 className="text-4xl font-black text-slate-900 mb-1">

              Indeed Applicants

            </h1>

            <p className="text-gray-500 text-sm">

              Manage Indeed applied candidates

            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <button
              onClick={
                connectIndeed
              }
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-semibold shadow-sm transition-all"
            >

              Connect Indeed

            </button>

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

        <div className="bg-white rounded-3xl p-5 shadow-sm mb-5">

          <div className="flex items-center bg-slate-100 rounded-2xl px-4">

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
              className="w-full bg-transparent px-4 py-4 outline-none"
            />

          </div>

        </div>

        {/* Applicant Cards */}

        <div className="grid grid-cols-1 gap-5">

          {filteredApplicants.map(
            (
              applicant
            ) => (

            <div
              key={applicant.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300"
            >

              <div className="flex justify-between items-start flex-wrap gap-5">

                {/* Left */}

                <div>

                  <h2 className="text-2xl font-bold text-slate-800 mb-2">

                    {applicant.name}

                  </h2>

                  <p className="text-gray-500 mb-3">

                    {applicant.email}

                  </p>

                  {/* Phone & Location */}

                  <div className="flex gap-5 flex-wrap text-sm text-gray-600">

                    {/* Clickable Phone */}

                    <span className="flex items-center gap-2">

                      <FaPhone />

                      {applicant.phone ? (

                        <a
                          href={`tel:${applicant.phone}`}
                          className="text-blue-600 hover:underline font-medium"
                        >

                          {applicant.phone}

                        </a>

                      ) : (

                        <span className="text-gray-400">

                          N/A

                        </span>

                      )}

                    </span>

                    {/* Location */}

                    <span className="flex items-center gap-2">

                      <FaMapMarkerAlt />

                      {applicant.location || "N/A"}

                    </span>

                  </div>

                </div>

                {/* Right */}

                <div className="text-right">

                  <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-2xl font-bold flex items-center gap-2">

                    <FaStar />

                    {applicant.ai_score || 0}

                  </div>

                  <p className="text-sm text-gray-500 mt-2">

                    {applicant.status || "Pending"}

                  </p>

                </div>

              </div>

              {/* Buttons */}

              <div className="mt-6 flex gap-3 flex-wrap">

                <button
                  onClick={() =>
                    navigate(
                      "/candidate-details",
                      {
                        state: applicant,
                      }
                    )
                  }
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-semibold"
                >

                  <FaEye />

                  View

                </button>

                <button
                  onClick={() =>
                    sendToAI(
                      applicant
                    )
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-2xl font-semibold"
                >

                  <FaPaperPlane />

                  Send To AI

                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default IndeedApplicants;