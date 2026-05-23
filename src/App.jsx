import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import CandidateList from "./pages/CandidateList";
import CandidateDetails from "./pages/CandidateDetails";
import UploadResume from "./pages/UploadResume";
import AIResults from "./pages/AIResults";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import IndeedApplicants from "./pages/IndeedApplicants";
import JobPost from "./pages/JobPost";
import JobList from "./pages/JobList";
import CandidateProfile from "./pages/CandidateProfile";
import InterviewSchedule from "./pages/InterviewSchedule";
import ScheduledInterviews from "./pages/ScheduledInterviews";
import CSVUpload from "./pages/CSVUpload";

import ProtectedRoute
from "./components/ProtectedRoute";

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* Login */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Signup */}

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* Dashboard */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Candidate List */}

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <CandidateList />
            </ProtectedRoute>
          }
        />

        {/* Candidate Details */}

        <Route
          path="/candidate-details"
          element={
            <ProtectedRoute>
              <CandidateDetails />
            </ProtectedRoute>
          }
        />

        {/* Candidate Profile */}

        <Route
          path="/candidate-profile"
          element={
            <ProtectedRoute>
              <CandidateProfile />
            </ProtectedRoute>
          }
        />

        {/* Interview Schedule */}

        <Route
          path="/interview-schedule"
          element={
            <ProtectedRoute>
              <InterviewSchedule />
            </ProtectedRoute>
          }
        />

        {/* Scheduled Interviews */}

        <Route
          path="/scheduled-interviews"
          element={
            <ProtectedRoute>
              <ScheduledInterviews />
            </ProtectedRoute>
          }
        />

        {/* CSV Upload */}

        <Route
          path="/csv-upload"
          element={
            <ProtectedRoute>
              <CSVUpload />
            </ProtectedRoute>
          }
        />

        {/* Indeed Applicants */}

        <Route
          path="/indeed-applicants"
          element={
            <ProtectedRoute>
              <IndeedApplicants />
            </ProtectedRoute>
          }
        />

        {/* Upload Resume */}

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadResume />
            </ProtectedRoute>
          }
        />

        {/* AI Results */}

        <Route
          path="/ai-results"
          element={
            <ProtectedRoute>
              <AIResults />
            </ProtectedRoute>
          }
        />

        {/* Job Post */}

        <Route
          path="/job-post"
          element={
            <ProtectedRoute>
              <JobPost />
            </ProtectedRoute>
          }
        />

        {/* Posted Jobs */}

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobList />
            </ProtectedRoute>
          }
        />

        {/* Settings */}

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;