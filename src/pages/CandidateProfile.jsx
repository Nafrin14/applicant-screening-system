import React from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

function CandidateProfile() {

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const applicant =
    location.state;

  if (!applicant) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <h1 className="text-3xl font-bold text-red-500">
          No Applicant Data
        </h1>

      </div>
    );
  }

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      {/* Back Button */}

      <button
        onClick={() =>
          navigate(-1)
        }
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl mb-8"
      >
        Back
      </button>

      {/* Profile Card */}

      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-5xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <div>

            <h1 className="text-5xl font-bold text-gray-800">
              {applicant.name}
            </h1>

            <p className="text-gray-500 mt-2 text-lg">
              {applicant.email}
            </p>

          </div>

          <div className="text-right">

            <p className="text-4xl font-bold text-blue-600">
              {applicant.ai_score ||
                applicant.score ||
                0}%
            </p>

            <p className="text-gray-500">
              AI Match Score
            </p>

          </div>

        </div>

        {/* Details */}

        <div className="grid grid-cols-2 gap-8">

          <div className="bg-gray-100 rounded-2xl p-8">

            <h2 className="text-2xl font-bold mb-6">
              Candidate Details
            </h2>

            <div className="space-y-4 text-lg">

              <p>
                <strong>Email:</strong>
                {" "}
                {applicant.email}
              </p>

              <p>
                <strong>Phone:</strong>
                {" "}
                {applicant.phone ||
                  "Not Available"}
              </p>

              <p>
                <strong>Role:</strong>
                {" "}
                {applicant.role ||
                  "Not Available"}
              </p>

              <p>
                <strong>Experience:</strong>
                {" "}
                {applicant.experience ||
                  "Not Available"}
              </p>

              <p>
                <strong>Location:</strong>
                {" "}
                {applicant.location ||
                  "Not Available"}
              </p>

            </div>

          </div>

          {/* Skills + Status */}

          <div className="bg-gray-100 rounded-2xl p-8">

            <h2 className="text-2xl font-bold mb-6">
              Skills & Status
            </h2>

            <div className="space-y-4 text-lg">

              <p>
                <strong>Skills:</strong>
                {" "}
                {applicant.skills}
              </p>

              <p>

                <strong>Status:</strong>

                <span className="ml-3 bg-blue-600 text-white px-4 py-1 rounded-full text-sm">
                  {applicant.status}
                </span>

              </p>

              <p>
                <strong>Recommendation:</strong>
                {" "}
                {applicant.recommendation ||
                  "No recommendation available"}
              </p>

            </div>

            {applicant.resume_url && (

              <a
                href={
                  applicant.resume_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl"
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