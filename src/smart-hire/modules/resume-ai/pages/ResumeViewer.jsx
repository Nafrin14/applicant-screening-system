import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResumeViewer() {
  const location = useLocation();
  const navigate = useNavigate();

  const resumeUrl = location.state?.resumeUrl;

  if (!resumeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>No Resume Found</h1>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      <div className="p-4 border-b">
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          ← Back
        </button>
      </div>

      <iframe
        src={resumeUrl}
        title="Resume"
        className="w-full h-[calc(100vh-70px)]"
      />
    </div>
  );
}

export default ResumeViewer;