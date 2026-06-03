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
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl mb-5">

          <div className="flex justify-between items-center">

            <div>

              <h1 className="text-3xl font-bold">
                {applicant.name}
              </h1>

              <p className="text-blue-100 mt-2">
                {applicant.email}
              </p>

              <span
                className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold ${
                  applicant.status === "Shortlisted"
                    ? "bg-green-500"
                    : applicant.status === "Pending"
                    ? "bg-yellow-500 text-black"
                    : "bg-red-500"
                }`}
              >
                {applicant.status}
              </span>

            </div>

            <div className="text-center">

              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-blue-700 text-2xl font-bold shadow-lg">
                {applicant.ai_score || applicant.score || 0}%
              </div>

              <p className="mt-2 text-blue-100 text-sm">
                AI Match Score
              </p>

            </div>

          </div>

        </div>

        {/* AI Recommended Role */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">

          <p className="text-xs text-gray-500">
            AI Recommended Role
          </p>

          <h3 className="text-lg font-bold text-blue-700 mt-1">
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

            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-500">
                  Email
                </p>
                <p className="font-semibold text-sm">
                  {applicant.email}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Phone
                </p>
                <p className="font-semibold text-sm">
                  {applicant.phone || "Not Available"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Role
                </p>
                <p className="font-semibold text-sm">
                  {applicant.role || "Not Available"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Experience
                </p>
                <p className="font-semibold text-sm">
                  {applicant.experience || "Not Available"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Location
                </p>
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
                    className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                  >
                    {skill.trim()}
                  </span>
                ))}

            </div>

            <div className="mb-5">

              <p className="text-xs text-gray-500">
                Recommendation
              </p>

              <p className="font-semibold text-green-600 text-sm">
                {applicant.recommendation ||
                  "No recommendation available"}
              </p>

            </div>

            {applicant.resume_url && (
              <a
                href={applicant.resume_url}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold text-sm"
              >
                View Resume
              </a>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default CandidateProfile;