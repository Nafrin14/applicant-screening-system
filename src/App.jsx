import React from "react";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
import CandidateProfile from "./pages/CandidateProfile";
import InterviewSchedule from "./pages/InterviewSchedule";
import ScheduledInterviews from "./pages/ScheduledInterviews";
import CSVUpload from "./pages/CSVUpload";
import CareersPage from "./pages/CareersPage";
import ApplyPage from "./pages/ApplyPage";
import ResumeViewer from "./pages/ResumeViewer";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password"
  element={<ResetPassword />}
/>
        <Route
          path="/signup"
          element={<Signup />}
        />

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

        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <CandidateList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate-details"
          element={
            <ProtectedRoute>
              <CandidateDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate-profile"
          element={
            <ProtectedRoute>
              <CandidateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview-schedule"
          element={
            <ProtectedRoute>
              <InterviewSchedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scheduled-interviews"
          element={
            <ProtectedRoute>
              <ScheduledInterviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/csv-upload"
          element={
            <ProtectedRoute>
              <CSVUpload />
            </ProtectedRoute>
          }
        />

       

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadResume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-results"
          element={
            <ProtectedRoute>
              <AIResults />
            </ProtectedRoute>
          }
        />

        

       

        <Route
          path="/careers"
          element={<CareersPage />}
        />

        <Route
          path="/apply/:id"
          element={<ApplyPage />}
        />

        {/* NEW ROUTE */}

        <Route
          path="/resume-viewer"
          element={
            <ProtectedRoute>
              <ResumeViewer />
            </ProtectedRoute>
          }
        />

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