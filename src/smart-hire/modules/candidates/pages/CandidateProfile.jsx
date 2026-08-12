import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * CandidateProfile serves as a redirection wrapper to CandidateDetails.
 * This ensures we maintain a single, highly-polished, mobile-responsive
 * and premium candidate details screen at `/candidate-details` without duplicating code.
 */
function CandidateProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Forward the location state (candidate data object) and search query string
    navigate(`/candidate-details${location.search}`, {
      state: location.state,
      replace: true
    });
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse text-sm">Redirecting to candidate details...</p>
      </div>
    </div>
  );
}

export default CandidateProfile;