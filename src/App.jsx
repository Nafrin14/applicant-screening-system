import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages Layer Imports
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SalesDashboard from "./pages/SalesDashboard";
import SalesAdminDashboard from "./pages/SalesAdminDashboard";
import CandidateList from "./pages/CandidateList";
import CandidateDetails from "./pages/CandidateDetails";
import CandidateProfile from "./pages/CandidateProfile";
import CandidateChat from "./pages/CandidateChat";
import Conversations from "./pages/Conversations";
import InterviewSchedule from "./pages/InterviewSchedule";
import ScheduledInterviews from "./pages/ScheduledInterviews";
import CSVUpload from "./pages/CSVUpload";
import UploadResume from "./pages/UploadResume";
import AIResults from "./pages/AIResults";
import ApplyPage from "./pages/ApplyPage";
import ResumeViewer from "./pages/ResumeViewer";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Settings from "./pages/Settings";
import UploadHistory from "./pages/UploadHistory";
import SalesReports from "./pages/SalesReports";
import Notifications from "./pages/Notifications";
import SalesProfile from "./pages/SalesProfile";
// Components Layout wrappers
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================================================
            PUBLIC AUTHENTICATION TRACKS (No Security Wrappers)
           ========================================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/apply/:id" element={<ApplyPage />} />
        
        <Route path="/test" element={<h1>Test Page Working</h1>} />

        {/* =========================================================
            CORE KD3 MARKETING CHANNELS (Role Validation Enabled)
           ========================================================= */}
        {/* Sales User Workspace Track */}
        <Route
          path="/sales-dashboard"
          element={
            <ProtectedRoute allowedRoles={["user", "admin"]}>
              <SalesDashboard />
            </ProtectedRoute>
          }
        />

        {/* Platform Executive Management Dashboard */}
        <Route
          path="/sales-admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <SalesAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            APPLICANT SCREENING SYSTEM INTEGRATED CORE
           ========================================================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CandidateList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-details"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CandidateDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CandidateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate-chat"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <CandidateChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <Conversations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-schedule"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <InterviewSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scheduled-interviews"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ScheduledInterviews />
            </ProtectedRoute>
          }
        />
        <Route
          path="/csv-upload"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <CSVUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UploadResume />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-results"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AIResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-viewer"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ResumeViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
       <Route
  path="/upload-history"
  element={
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <UploadHistory />
    </ProtectedRoute>
  }
/>
<Route
  path="/sales-reports"
  element={
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <SalesReports />
    </ProtectedRoute>
  }
/>
<Route
  path="/notifications"
  element={
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <Notifications />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <SalesProfile />
    </ProtectedRoute>
  }
/>


        {/* =========================================================
            CATCH-ALL REDIRECT ROUTING INTERCEPTOR
           ========================================================= */}
        {/* Instead of mounting Dashboard flatly, redirect roots cleanly straight out to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;