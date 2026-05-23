import React from "react";
import { useNavigate } from "react-router-dom";

function Settings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-6">

        <h1 className="text-4xl font-bold mb-12">
          HireDesk
        </h1>

        <ul className="space-y-8 text-lg">

          <li onClick={() => navigate("/dashboard")} className="cursor-pointer hover:text-blue-400">
            Dashboard
          </li>

          <li onClick={() => navigate("/results")} className="cursor-pointer hover:text-blue-400">
            Candidates
          </li>

          <li onClick={() => navigate("/upload")} className="cursor-pointer hover:text-blue-400">
            Resume Upload
          </li>

          <li onClick={() => navigate("/ai-results")} className="cursor-pointer hover:text-blue-400">
            AI Results
          </li>

          <li onClick={() => navigate("/job-post")} className="cursor-pointer hover:text-blue-400">
            Job Post
          </li>

          <li onClick={() => navigate("/jobs")} className="cursor-pointer hover:text-blue-400">
            Posted Jobs
          </li>

          <li className="text-blue-400">
            Settings
          </li>

        </ul>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-10">

        <h1 className="text-5xl font-bold mb-8">
          Settings
        </h1>

        <div className="grid grid-cols-2 gap-8">

          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              Profile Settings
            </h2>
            <p className="text-gray-600">
              Update your name, email, and role.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              Security
            </h2>
            <p className="text-gray-600">
              Change password and secure your account.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              Notifications
            </h2>
            <p className="text-gray-600">
              Manage email and system alerts.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">
              System Info
            </h2>
            <p className="text-gray-600">
              App version and system status.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Settings;