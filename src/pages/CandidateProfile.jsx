import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CandidateProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  const applicant = location.state;

  if (!applicant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <h1 className="text-3xl font-bold text-red-500">
          No Applicant Data
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl mb-5"
      >
        ← Back
      </button>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-800 shadow-xl mb-5">
          <div className="flex justify-between items-center">
           <div className="flex items-center gap-4">

 <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold">
    {applicant.name?.charAt(0)}
  </div>

  <div>

    <h1 className="text-4xl font-bold">
      {applicant.name}
    </h1>

    <p className="text-slate-600 mt-1 font-medium">
      {applicant.email}
    </p>
    <div className="flex flex-wrap gap-6 mt-3 text-sm text-slate-600">

  <span>
    📞 {applicant.phone || "Not Available"}
  </span>

  <span>
    📍 {applicant.location || "Not Available"}
  </span>

  </div>


  </div>



             
            </div>

          <div className="flex flex-col items-end gap-3">
              <div className="bg-blue-50 text-blue-600 px-5 py-3 rounded-2xl text-2xl font-bold border border-blue-100 shadow-sm">
  {applicant.ai_score || applicant.score || 0}%
</div>

              <span
  className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold ${
    applicant.status === "Shortlisted"
      ? "bg-green-500"
      : applicant.status === "Pending"
      ? "bg-yellow-400 text-black"
      : "bg-red-500"
  }`}
>
  {applicant.status}
</span>
            </div>
          </div>
        </div>

        {/* AI Recommended Role */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 mb-5 shadow-sm">
         <p className="text-sm font-medium text-slate-500">
   AI Recommended Role
</p>

         <h3 className="text-2xl font-bold text-blue-600 mt-2">
            {applicant.recommended_role || "Not Available"}
          </h3>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Candidate Details */}
          <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              Candidate Details
            </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
  <p className="text-xs text-gray-500">Email</p>

  <p className="font-semibold text-sm break-all">
    {applicant.email}
  </p>
</div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
  <p className="text-xs text-gray-500">Phone</p>

  <p className="font-semibold text-sm">
    {applicant.phone || "Not Available"}
  </p>
</div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
  <p className="text-xs text-gray-500">Experience</p>
  <p className="font-semibold text-sm">
    {applicant.experience || "Not Available"}
  </p>
</div>

             <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 md:col-span-2">
  <p className="text-xs text-gray-500">Location</p>
  <p className="font-semibold text-sm">
    {applicant.location || "Not Available"}
  </p>
</div>
            </div>
          </div>

          {/* Skills & Resume */}
          <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              Skills & Resume
            </h2>

            <p className="font-semibold text-sm mb-3">
              Skills
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {(applicant.skills || "")
                .split(",")
                .map((skill, index) => (
                  <span
                    key={index}
                   className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-2 rounded-xl text-xs font-medium"
                  >
                    {skill.trim()}
                  </span>
                ))}
            </div>

            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-5">
  <p className="text-xs font-medium text-green-600">
    AI Recommendation
  </p>

  <p className="font-bold text-green-700 mt-1">
    {applicant.recommendation ||
      "No recommendation available"}
  </p>
</div>

            {applicant.resume_url && (
              <button
                onClick={() =>
                  navigate("/resume-viewer", {
                    state: {
                      resumeUrl: applicant.resume_url,
                    },
                  })
                }
               className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
                text-white py-3 rounded-2xl font-semibold shadow-md transition-all"
              >
                View Resume
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;