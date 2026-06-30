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

import Sidebar from "../components/Sidebar";
import { FaEye, FaUserCheck, FaUserTimes, FaCalendarAlt, FaTrashAlt,FaClock }
 from "react-icons/fa";



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

const [selectedApplicants, setSelectedApplicants] = useState([]);
const [statusFilter, setStatusFilter] = useState("All");
const [selectedDate, setSelectedDate] = useState("");

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
 .order("created_at", { ascending: false })
.order("ai_score", { ascending: false });

  if (error) {

    console.log(error);

  } else {

    setApplicants(data || []);

  }
};
const filteredApplicants = applicants.filter((applicant) => {
  const matchesSearch =
    applicant.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All"
      ? true
      : applicant.status === statusFilter;

  const matchesDate =
    !selectedDate ||
    new Date(applicant.created_at)
      .toISOString()
      .slice(0, 10) === selectedDate;

  return (
    matchesSearch &&
    matchesStatus &&
    matchesDate
  );
});

    const getDateLabel = (date) => {
  if (!date) return "No Date";

  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return "No Date";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const groupedApplicants = filteredApplicants.reduce((groups, applicant) => {
 const label = getDateLabel(
  applicant.created_at || applicant.createdAt || applicant.uploaded_at
);

  if (!groups[label]) {
    groups[label] = [];
  }

  groups[label].push(applicant);

  return groups;
}, {});
  

  /* DELETE */

  const handleDelete =
    async (id) => {
      const confirmDelete = window.confirm(
  "Are you sure you want to delete this candidate?"
);

if (!confirmDelete) return;

    const { error } =
      await supabase
        .from("applicants")
        .delete()
        .eq("id", id);

    if (error) {

      console.log(error);

    } else {
      alert("Candidate deleted successfully");

      fetchApplicants();

    }
  };
const bulkDelete = async () => {const confirmDelete = window.confirm(
  `Delete ${selectedApplicants.length} selected candidates?`
);

if (!confirmDelete) return;

  const { error } = await supabase
    .from("applicants")
    .delete()
    .in("id", selectedApplicants);

  if (error) {

    console.log(error);

  } else {

    setSelectedApplicants([]);
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
const bulkUpdateStatus = async (status) => {

  const { error } = await supabase
    .from("applicants")
    .update({ status })
    .in("id", selectedApplicants);

  if (error) {

    console.log(error);

  } else { alert(
  `${selectedApplicants.length} candidates ${status.toLowerCase()} successfully`
);

    setSelectedApplicants([]);
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

  

  return (

   <div className="min-h-screen bg-slate-100 flex flex-col">

 

  <div className="flex">

      

     {/* Sidebar */}
<Sidebar />



      {/* Main */}
<div className="flex-1 md:ml-56 p-4 md:p-8 overflow-y-auto">


        {/* Header */}

       <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

          <div>

           <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600
 to-purple-600 bg-clip-text text-transparent">
              Candidate List
            </h1>

             <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">
              Manage manual uploaded applicants
            </p>

            

          </div>

         <div className="flex flex-col md:flex-row gap-3">

  <button
  onClick={downloadExcel}
  className="
    bg-gradient-to-r from-emerald-600 to-green-500
    hover:from-emerald-700 hover:to-green-600
    text-white px-6 py-3 rounded-2xl
    shadow-lg hover:shadow-xl
    transition-all duration-300
    hover:-translate-y-1
    font-medium
  "
>
  Download Excel
</button>

<button
  onClick={() => navigate("/upload")}
  className="
    bg-gradient-to-r from-blue-600 to-indigo-600
    hover:from-blue-700 hover:to-indigo-700
    text-white px-6 py-3 rounded-2xl
    shadow-lg hover:shadow-xl
    transition-all duration-300
    hover:-translate-y-1
    font-medium
  "
>
  + Upload Resume
</button>

</div>

        </div>



        {/* Table */}

        <div className="bg-white rounded-3xl shadow-md p-6">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-3">

           <p className="text-sm text-slate-500 font-medium">
  Showing {filteredApplicants.length} Candidates
</p>

{selectedApplicants.length > 0 && (
  <div className="flex items-center gap-2 mt-3">

    <span className="text-sm font-semibold text-gray-600">
      {selectedApplicants.length} Selected
    </span>

    <button
  onClick={() =>
    bulkUpdateStatus(
      "Shortlisted"
    )
  }
  className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
  title="Bulk Shortlist"
>
  <FaUserCheck size={14} />
</button>

    <button
  onClick={() =>
    bulkUpdateStatus("Rejected")
  }
  className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg"
  title="Bulk Reject"
>
  <FaUserTimes size={14} />
</button>

    <button
  onClick={() =>
    bulkUpdateStatus("Pending")
  }
  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 p-2 rounded-lg"
  title="Bulk Pending"
>
  <FaClock size={14} />
</button>

    <button
  onClick={bulkDelete}
  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg"
  title="Bulk Delete"
>
  <FaTrashAlt size={14} />
</button>

  </div>
)}


<div className="flex flex-col md:flex-row gap-3 items-center">

  <select
    value={statusFilter}
    
    onChange={(e) => setStatusFilter(e.target.value)}
    className="bg-slate-100 border border-gray-200 px-4 py-3 rounded-2xl outline-none w-full md:w-auto"
  >
    <option value="All">All Status</option>
    <option value="Shortlisted">Shortlisted</option>
    <option value="Pending">Pending</option>
    <option value="Rejected">Rejected</option>
    <option value="Interview Scheduled">
      Interview Scheduled
    </option>
  </select>
  <input
  type="date"
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
  className="bg-slate-100 border border-gray-200 px-4 py-3 rounded-2xl outline-none w-full md:w-auto"
/>

<button
  onClick={() => setSelectedDate("")}
  className="bg-gray-200 hover:bg-gray-300 px-4 py-3 rounded-2xl"
>
  Clear
</button>

  <input
    type="text"
    placeholder="Search candidate..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="bg-slate-100 border border-gray-200 px-5 py-3 rounded-2xl outline-none w-full md:w-72"
  />

</div>
 

          </div>

         <div className="overflow-x-auto w-full">

          <table className="min-w-[1200px] w-full">
              <thead>

                <tr className="border-b border-gray-200 text-left">
                  <th className="py-4">
  <input
    type="checkbox"
    onChange={(e) =>
      setSelectedApplicants(
        e.target.checked
          ? filteredApplicants.map(
              (a) => a.id
            )
          : []
      )
    }
  />
</th>

                  <th className="py-4 text-gray-500 font-semibold">
                    Candidate
                  </th>

                  <th className="text-gray-500 font-semibold">
                    Email
                  </th>
<th className="text-gray-500 font-semibold">
  Applied Job
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

                {Object.entries(groupedApplicants).map(([date, list]) => (
  <React.Fragment key={date}>
    <tr>
      <td
        colSpan="7"
        className="bg-slate-100 py-3 px-4 text-center text-sm font-bold text-slate-600"
      >
        ───── {date} ─────
      </td>
    </tr>

    {list.map((applicant, index) => (
                  <tr
  key={applicant.id}
  className={`border-b border-gray-100 transition ${
    selectedApplicants.includes(applicant.id)
      ? "bg-blue-50"
      : "hover:bg-slate-50"
  }`}
>
                    <td>
  <input
    type="checkbox"
    checked={selectedApplicants.includes(applicant.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedApplicants([
          ...selectedApplicants,
          applicant.id,
        ]);
      } else {
        setSelectedApplicants(
          selectedApplicants.filter(
            (id) => id !== applicant.id
          )
        );
      }
    }}
  />
</td>

                    <td className="py-5">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center
                         text-blue-600 font-bold text-lg">

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
    {applicant.role || "Not Available"}
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

<td className="w-[180px]">

 <div className="flex items-center gap-2 whitespace-nowrap">

    <button
      onClick={() =>
        navigate("/candidate-details", {
          state: applicant,
        })
      }
      className="bg-blue-100 hover:bg-blue-200 text-blue-600 p-2 rounded-lg transition"
      title="View Details"
    >
      <FaEye size={14} />
    </button>

    {applicant.status !== "Shortlisted" && (
      <button
        onClick={() =>
          updateStatus(
            applicant.id,
            "Shortlisted"
          )
        }
        className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition"
        title="Shortlist Candidate"
      >
        <FaUserCheck size={14} />
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
        className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition"
        title="Reject Candidate"
      >
        <FaUserTimes size={14} />
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
        className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-lg transition"
        title="Schedule Interview"
      >
        <FaCalendarAlt size={14} />
      </button>
    )}

    <button
      onClick={() =>
        handleDelete(
          applicant.id
        )
      }
      className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition"
      title="Delete Profile"
    >
      <FaTrashAlt size={14} />
    </button>

  </div>

</td>
                  </tr>

                    ))}
  </React.Fragment>
))}

              </tbody>

            </table>

          </div>

        </div>

      </div>
</div>
    </div>
  );
}

export default CandidateList;