import React, {
  useEffect,
  useState,
} from "react";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  const [
  search,
  setSearch,
] = useState("");

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants =
  async () => {

  const { data, error } =
await supabase
  .from("applicants")
  .select("*")
  .eq("source", "Manual")
  .order(
    "ai_score",
    {
      ascending: false,
    }
  );

  if (error) {

    console.log(error);

  } else {

    setApplicants(data || []);

  }
};
const filteredApplicants =
  applicants.filter(
    (applicant) =>
      applicant.name
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

    
  

  /* DELETE */

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

  /* STATUS UPDATE */

  const updateStatus =
    async (
      id,
      status
    ) => {

    const { error } =
      await supabase
        .from("applicants")
        .update({
          status,
        })
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {

      fetchApplicants();

    }
  };

  const downloadExcel = () => {

  const excelData =
    applicants.map((applicant) => ({
      Name: applicant.name,
      Email: applicant.email,
      Phone: applicant.phone,
      Location: applicant.location,
      Experience: applicant.experience,
      RecommendedRole:
        applicant.recommended_role,
      AI_Score:
        applicant.ai_score,
      Status:
        applicant.status,
    }));

  const worksheet =
    XLSX.utils.json_to_sheet(
      excelData
    );

    worksheet["!cols"] = [
  { wch: 25 }, // Name
  { wch: 35 }, // Email
  { wch: 18 }, // Phone
  { wch: 20 }, // Location
  { wch: 15 }, // Experience
  { wch: 30 }, // Recommended Role
  { wch: 10 }, // AI Score
  { wch: 15 }, // Status
];

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Candidates"
  );

  const excelBuffer =
    XLSX.write(
      workbook,
      {
        bookType: "xlsx",
        type: "array",
      }
    );

  const fileData =
    new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

  saveAs(
    fileData,
    "Candidates.xlsx"
  );
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

     <div className="w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shadow-2xl fixed left-0 top-0 h-screen overflow-y-auto">
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

      {/* Main */}

<div className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl font-extrabold text-slate-800">
              Candidate List
            </h1>

            <p className="text-gray-500 mt-1 text-base">
              Manage manual uploaded applicants
            </p>

          </div>

          <div className="flex gap-3">

  <button
    onClick={downloadExcel}
    className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl shadow-lg transition"
  >
    Download Excel
  </button>

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

        {/* Table */}

        <div className="bg-white rounded-3xl shadow-md p-6">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold text-slate-800">
              Applicant List
            </h2>

            <input
  type="text"
  placeholder="Search candidate..."
  value={search}
  onChange={(e) =>
    setSearch(
      e.target.value
    )
  }
  className="bg-slate-100 border border-gray-200 px-5 py-3 rounded-2xl outline-none w-72"
/>

          </div>

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
  Suitable Jobs
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

                {filteredApplicants.map(
  (applicant, index) => (
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
                        <p
  className={`text-xs font-bold ${
    index === 0
      ? "text-yellow-600"
      : index === 1
      ? "text-gray-600"
      : index === 2
      ? "text-orange-600"
      : "text-blue-600"
  }`}
>
  {index === 0
    ? "🥇"
    : index === 1
    ? "🥈"
    : index === 2
    ? "🥉"
    : "🏅"}{" "}
  Rank #{index + 1}
</p>
                          <h3 className="font-bold text-slate-800">
                            {applicant.name}
                          </h3>

                          

                        </div>

                      </div>

                    </td>

                    <td className="text-gray-600">
  <div>
    <p>{applicant.email}</p>

    <p className="mt-1">
      📞 {applicant.phone ? (
        <a
          href={`tel:${applicant.phone}`}
          className="text-blue-600 hover:underline"
        >
          {applicant.phone}
        </a>
      ) : (
        "N/A"
      )}
    </p>
  </div>
</td>
<td className="text-gray-600">
  <div className="max-w-xs">

    <p className="text-sm text-blue-600 font-medium">
     {applicant.recommended_role || "Not Available"}
    </p>

  </div>
</td>
                    <td>

                      <div className="flex items-center gap-2">

  <span className="font-bold text-blue-600">

    {applicant.ai_score ||
      applicant.score ||
      0}

  </span>

  {index === 0 && (

    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">

      Top Candidate

    </span>

  )}

</div>

                    </td>

                    

                  <td>

  <span
    className={`px-3 py-1 rounded-full text-xs font-semibold ${
      applicant.status === "Shortlisted"
        ? "bg-green-100 text-green-600"
        : applicant.status === "Rejected"
        ? "bg-red-100 text-red-600"
        : applicant.status === "Interview Scheduled"
        ? "bg-purple-100 text-purple-700"
        : applicant.status === "Selected"
        ? "bg-blue-100 text-blue-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {applicant.status}
  </span>

</td>  

<td className="w-[300px]">

 <div className="flex items-center gap-2 whitespace-nowrap">

    <button
      onClick={() =>
        navigate("/candidate-details", {
          state: applicant,
        })
      }
      className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded-lg text-xs font-semibold transition"
    >
      View
    </button>

    {applicant.status !== "Shortlisted" && (
      <button
        onClick={() =>
          updateStatus(
            applicant.id,
            "Shortlisted"
          )
        }
        className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded-lg text-xs font-semibold transition"
      >
        Shortlist
      </button>
    )}

    {applicant.status !== "Rejected" && (
      <button
        onClick={() =>
          updateStatus(
            applicant.id,
            "Rejected"
          )
        }
        className="bg-red-100 hover:bg-red-200 text-red-600 px-2 py-1 rounded-lg text-xs font-semibold transition"
      >
        Reject
      </button>
    )}

    {applicant.status !== "Rejected" && (
      <button
        onClick={async () => {

  await updateStatus(
    applicant.id,
    "Interview Scheduled"
  );

  navigate(
    "/interview-schedule",
    {
      state: applicant,
    }
  );

}}
        className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold transition"
      >
        Interview
      </button>
    )}

    <button
      onClick={() =>
        handleDelete(
          applicant.id
        )
      }
      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded-lg text-xs font-semibold transition"
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