import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages Layer Imports
import Login from "./core/auth/pages/Login";
import Signup from "./core/auth/pages/Signup";
import ForgotPassword from "./core/auth/pages/ForgotPassword";
import ResetPassword from "./core/auth/pages/ResetPassword";
import Dashboard from "./smart-hire/modules/dashboard/pages/Dashboard";
import SalesDashboard from "./sales/modules/dashboard/pages/SalesDashboard";
import SalesAdminDashboard from "./sales/modules/dashboard/pages/SalesAdminDashboard";
import CandidateList from "./smart-hire/modules/candidates/pages/CandidateList";
import CandidateDetails from "./smart-hire/modules/candidates/pages/CandidateDetails";
import CandidateProfile from "./smart-hire/modules/candidates/pages/CandidateProfile";
import CandidateChat from "./smart-hire/modules/candidates/pages/CandidateChat";
import Conversations from "./smart-hire/modules/conversations/pages/Conversations";
import BulkActions from "./smart-hire/modules/conversations/pages/BulkActions";
import BulkActionsReport from "./smart-hire/modules/conversations/pages/BulkActionsReport";
import MailInbox from "./smart-hire/modules/conversations/pages/MailInbox";
import InterviewSchedule from "./smart-hire/modules/interviews/pages/InterviewSchedule";
import ScheduledInterviews from "./smart-hire/modules/interviews/pages/ScheduledInterviews";
import CSVUpload from "./sales/modules/csv-upload/pages/CSVUpload";
import UploadResume from "./smart-hire/modules/resume-ai/pages/UploadResume";
import AIResults from "./smart-hire/modules/resume-ai/pages/AIResults";
import ResumeViewer from "./smart-hire/modules/resume-ai/pages/ResumeViewer";
import Jobs from "./smart-hire/modules/jobs/pages/Jobs";
import JobDetails from "./smart-hire/modules/jobs/pages/JobDetails";
import Settings from "./smart-hire/modules/settings/pages/Settings";
import UploadHistory from "./sales/modules/csv-upload/pages/UploadHistory";
import SalesReports from "./sales/modules/reports/pages/SalesReports";
import Notifications from "./sales/modules/notifications/pages/Notifications";
import SalesProfile from "./sales/modules/profile/pages/SalesProfile";
import ComingSoon from "./core/auth/pages/ComingSoon";
// Components Layout wrappers
import ProtectedRoute from "./core/components/ProtectedRoute";
import SmartHireLayout from "./smart-hire/components/SmartHireLayout";
import { NotificationProvider } from "./core/context/NotificationContext";

function App() {
  return (
    <NotificationProvider>
    <BrowserRouter>
      <Routes>
        {/* =========================================================
            PUBLIC AUTHENTICATION TRACKS (No Security Wrappers)
           ========================================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        
        
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
            (Sidebar + top Navbar are persistent — rendered once by
            SmartHireLayout so switching tabs never remounts them)
           ========================================================= */}
        <Route element={<SmartHireLayout />}>
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
            path="/conversations"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <Conversations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-actions"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <BulkActions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bulk-actions-report"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <BulkActionsReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mail-inbox"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <MailInbox />
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
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["admin", "user"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Standalone applicant sub-views (no sidebar/navbar chrome) */}
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
          path="/csv-upload"
          element={
            <ProtectedRoute allowedRoles={["admin", "user"]}>
              <CSVUpload />
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
    </NotificationProvider>
  );
}

export default App;