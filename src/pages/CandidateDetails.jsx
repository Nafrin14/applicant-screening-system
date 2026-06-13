import React from "react";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";

function CandidateDetails() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const applicant =
    location.state;

    console.log("Applicant Data:", applicant);
  return (

    <div className="min-h-screen bg-slate-100 flex">
  <Sidebar />

 <div className="flex-1 md:ml-56 p-4 md:p-8 overflow-y-auto overflow-x-hidden">
   <div className="w-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100"> 
       <h1 className="text-3xl md:text-4xl font-bold text-slate-900"></h1>
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">

    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
     text-white shadow-lg flex items-center justify-center text-2xl font-bold">
              {applicant?.name?.charAt(0)}
            </div>

            <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 break-words">
                {applicant?.name}
              </h1>

              <p className="mt-2 text-slate-600">
                {applicant?.email}
              </p>

             <p className="text-slate-600 mt-1">
                📞 {applicant?.phone || "N/A"}
              </p>

             <p className="text-slate-600 mt-1">
                📍 {applicant?.location || "N/A"}
              </p>
            </div>

          </div>
<div className="flex flex-row lg:flex-col items-center gap-3">

  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 px-4 py-3 rounded-xl text-center min-w-[110px]">

   <p className="text-xs text-slate-500">
      AI Match Score
    </p>

    <h2 className="text-3xl font-bold text-blue-600">
      {applicant?.ai_score || 0}%
    </h2>

  </div>

  <span
    className={`px-4 py-2 rounded-full text-sm font-semibold ${
      applicant?.status === "Shortlisted"
        ? "bg-green-100 text-green-600"
        : applicant?.status === "Rejected"
        ? "bg-red-100 text-red-600"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {applicant?.status}
  </span>

</div>
        </div>

      </div>

     {/* Info Cards */}
<div className="grid grid-cols-2 gap-3 md:gap-6 mt-6">

 <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 text-center hover:shadow-lg transition duration-300">
    <p className="text-3xl mb-2"></p>
    <p className="text-gray-500 mb-2">
      Suitable Role
    </p>

   <h3 className="text-base md:text-2xl font-bold text-blue-600 break-words">
      {applicant?.recommended_role || "N/A"}
    </h3>
  </div>

 <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 text-center hover:shadow-lg transition duration-300">
    <p className="text-3xl mb-2"></p>
    <p className="text-gray-500 mb-2">
      Experience
    </p>

  <h3 className="text-base md:text-xl font-bold text-slate-800">
    {applicant?.experience || "Not Available"}
    </h3>
  </div>

</div>

{/* Skills */}
<div className="bg-white rounded-3xl border border-slate-100 p-8 mt-6">

<h3 className="text-xl font-semibold text-slate-800 mb-6">
  Technical Skills
</h3>

 <div className="flex flex-wrap gap-4">

    {(applicant?.skills || "")
      .split(",")
      .filter(Boolean)
      .map((skill, index) => (
        <span
          key={index}
     className="bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200
      hover:bg-blue-50 hover:border-blue-200 transition-all break-words">
          {skill.trim()}
        </span>
      ))}

  </div>

</div>

      

  </div>
</div>
</div>
        );
}


export default CandidateDetails;