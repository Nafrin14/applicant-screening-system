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
from "../../../../core/lib/supabase";

import { useNotification } from "../../../../core/context/NotificationContext";
import {
  FaEye,
  FaUserCheck,
  FaUserTimes,
  FaCalendarAlt,
  FaTrashAlt,
  FaClock,
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

const [selectedApplicants, setSelectedApplicants] = useState([]);
const [statusFilter, setStatusFilter] = useState("All");
const [selectedDate, setSelectedDate] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 10;
const { notify, confirmDialog } = useNotification();

useEffect(() => {
  setCurrentPage(1);
}, [search, statusFilter, selectedDate]);

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

const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / ITEMS_PER_PAGE));
const paginatedApplicants = filteredApplicants.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

const groupedApplicants = paginatedApplicants.reduce((groups, applicant) => {
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
      const confirmDelete = await confirmDialog(
  "Are you sure you want to delete this candidate?",
  { danger: true, confirmLabel: "Delete" }
);

if (!confirmDelete) return;

    const { error } =
      await supabase
        .from("applicants")
        .delete()
        .eq("id", id);

    if (error) {

      console.log(error);
      notify("Failed to delete candidate", { type: "error" });

    } else {
      notify("Candidate deleted successfully", { type: "success" });

      fetchApplicants();

    }
  };
const bulkDelete = async () => {const confirmDelete = await confirmDialog(
  `Delete ${selectedApplicants.length} selected candidates?`,
  { danger: true, confirmLabel: "Delete" }
);

if (!confirmDelete) return;

  const { error } = await supabase
    .from("applicants")
    .delete()
    .in("id", selectedApplicants);

  if (error) {

    console.log(error);
    notify("Failed to delete selected candidates", { type: "error" });

  } else {

    notify(`${selectedApplicants.length} candidates deleted successfully`, { type: "success" });
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
    notify("Failed to update selected candidates", { type: "error" });

  } else { notify(
  `${selectedApplicants.length} candidates ${status.toLowerCase()} successfully`,
  { type: "success" }
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

<div className="p-4 md:p-8 overflow-y-auto">


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

        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 overflow-hidden">

        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-6 pb-5">

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
  className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 p-2.5 rounded-xl shadow-sm transition"
  title="Bulk Shortlist"
>
  <FaUserCheck size={14} />
</button>

    <button
  onClick={() =>
    bulkUpdateStatus("Rejected")
  }
  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 p-2.5 rounded-xl shadow-sm transition"
  title="Bulk Reject"
>
  <FaUserTimes size={14} />
</button>

    <button
  onClick={() =>
    bulkUpdateStatus("Pending")
  }
  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-100 p-2.5 rounded-xl shadow-sm transition"
  title="Bulk Pending"
>
  <FaClock size={14} />
</button>
    <button
  onClick={bulkDelete}
  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2.5 rounded-xl shadow-sm transition"
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
    className="bg-white border border-slate-200 px-4 py-3 rounded-2xl outline-none w-full md:w-auto shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
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
  className="bg-white border border-slate-200 px-4 py-3 rounded-2xl outline-none w-full md:w-auto shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
/>

<button
  onClick={() => setSelectedDate("")}
  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-3 rounded-2xl transition"
>
  Clear
</button>

  <input
    type="text"
    placeholder="Search candidate..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="bg-white border border-slate-200 px-5 py-3 rounded-2xl outline-none w-full md:w-72 shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
  />

</div>


          </div>

         <div className="overflow-x-auto w-full">

          <table className="min-w-[1200px] w-full">
              <thead>

                <tr className="bg-slate-50/80 border-y border-slate-100/80 text-xs uppercase tracking-wider font-bold text-slate-500">
                  <th className="px-6 py-5">
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

                  <th className="px-6 py-5">
                    Candidate
                  </th>

                  <th className="px-6 py-5">
                    Email
                  </th>
<th className="px-6 py-5">
  Applied Job
</th>

                  <th className="px-6 py-5">
                    AI Score
                  </th>


<th className="px-6 py-5">
  Status
</th>
                  <th className="px-6 py-5">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100/80">

                {Object.entries(groupedApplicants).map(([date, list]) => (
  <React.Fragment key={date}>
    <tr>
      <td
        colSpan="7"
        className="bg-slate-50/60 py-3 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider"
      >
        {date}
      </td>
    </tr>

    {list.map((applicant, index) => (
                  <tr
  key={applicant.id}
  className={`transition-colors group ${
    selectedApplicants.includes(applicant.id)
      ? "bg-indigo-50/50"
      : "hover:bg-slate-50/50"
  }`}
>
                    <td className="px-6 py-5">
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

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center
                         text-indigo-600 font-bold text-lg shrink-0">

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

                    <td className="px-6 py-5 text-gray-600">
  <div>
    <p className="text-sm">{applicant.email}</p>

    <p className="mt-1 text-sm">
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
<td className="px-6 py-5 text-gray-600">
  <div className="max-w-xs">

    <p className="text-sm text-blue-600 font-medium">
    {applicant.role || "Not Available"}
    </p>

  </div>
</td>
                    <td className="px-6 py-5">

                      <div className="flex items-center gap-2">

  <span className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 font-bold text-indigo-700 shadow-sm">

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



                  <td className="px-6 py-5">

  <span
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${
      applicant.status === "Shortlisted"
        ? "bg-green-50 text-green-700 border-green-100"
        : applicant.status === "Rejected"
        ? "bg-red-50 text-red-600 border-red-100"
        : applicant.status === "Interview Scheduled"
        ? "bg-purple-50 text-purple-700 border-purple-100"
        : applicant.status === "Selected"
        ? "bg-blue-50 text-blue-700 border-blue-100"
        : "bg-yellow-50 text-yellow-700 border-yellow-100"
    }`}
  >
    {applicant.status}
  </span>

</td>

<td className="px-6 py-5 w-[180px]">

 <div className="flex items-center gap-2 whitespace-nowrap">

    <button
      onClick={() =>
        navigate("/candidate-details", {
          state: applicant,
        })
      }
      className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 p-2.5 rounded-xl transition"
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
        className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-100 p-2.5 rounded-xl transition"
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
        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 p-2.5 rounded-xl transition"
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
        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 p-2.5 rounded-xl transition"
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
      className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 p-2.5 rounded-xl transition"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredApplicants.length)} of{" "}
                {filteredApplicants.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
  );
}

export default CandidateList;