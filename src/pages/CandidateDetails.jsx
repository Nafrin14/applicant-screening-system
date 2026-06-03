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
  return (

    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}

      <div className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">

        <div className="bg-white rounded-3xl shadow-md p-6 md:p-8 max-w-5xl">

          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

            <div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">
                Candidate Details
              </h1>

              <p className="text-gray-500 mt-2">
                Applicant full information
              </p>

            </div>

            <button
              onClick={() =>
                navigate("/results")
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl"
            >
              Back
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Full Name
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.name}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Email
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.email}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Role
              </p>

              <h2 className="text-xl font-bold text-slate-800">
                {applicant?.role || "Frontend Developer"}
              </h2>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                AI Match Score
              </p>

              <h2 className="text-xl font-bold text-blue-600">
                {applicant?.ai_score ||
                  applicant?.score ||
                  0}
              </h2>

            </div>

            

          <div className="bg-slate-50 p-5 rounded-2xl">

              <p className="text-gray-500 mb-2">
                Status
              </p>

              <span
                className={`px-4 py-2 rounded-full font-semibold ${
                  applicant?.status ===
                  "Shortlisted"
                    ? "bg-green-100 text-green-600"
                    : applicant?.status ===
                      "Rejected"
                    ? "bg-red-100 text-red-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >

                {applicant?.status}

              </span>

            </div>

            <div className="bg-slate-50 p-5 rounded-2xl">

  <p className="text-gray-500 mb-2">
    Recommendation
  </p>

  <h2 className="text-xl font-bold text-purple-600">
    {applicant?.recommendation || "Pending"}
  </h2>

</div>


          </div>

        </div>

      </div>

    </div>
  );
}

export default CandidateDetails;