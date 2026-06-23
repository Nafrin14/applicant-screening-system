import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const UploadResume = () => {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);

  // AI Score Generator
  const generateAIScore = (fileName) => {
    let score = 50;

    const lowerCaseFile =
      fileName.toLowerCase();

    if (lowerCaseFile.includes("react")) {
      score += 15;
    }

    if (lowerCaseFile.includes("node")) {
      score += 15;
    }

    if (lowerCaseFile.includes("sql")) {
      score += 15;
    }

    if (lowerCaseFile.includes("python")) {
      score += 15;
    }

    if (lowerCaseFile.includes("java")) {
      score += 10;
    }

    return score;
  };

  // Extract Skills
  const extractSkills = (fileName) => {
    const lowerCaseFile =
      fileName.toLowerCase();

    let skills = [];

    if (lowerCaseFile.includes("react")) {
      skills.push("React");
    }

    if (lowerCaseFile.includes("node")) {
      skills.push("Node.js");
    }

    if (lowerCaseFile.includes("sql")) {
      skills.push("SQL");
    }

    if (lowerCaseFile.includes("python")) {
      skills.push("Python");
    }

    if (lowerCaseFile.includes("java")) {
      skills.push("Java");
    }

    return skills.join(", ");
  };

  // Candidate Status
  const getStatus = (score) => {
    if (score >= 85) {
      return "Shortlisted";
    } else if (score >= 70) {
      return "Pending";
    } else {
      return "Rejected";
    }
  };

  // Upload Function
  const addCandidate = async () => {
    if (!file) {
      alert("Please select a resume");
      return;
    }

    // Generate AI Score
    const aiScore =
      generateAIScore(file.name);

    // Extract Skills
    const skills =
      extractSkills(file.name);

    const status = getStatus(aiScore);

    // Upload PDF
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } =
      await supabase.storage
        .from("resumes")
        .upload(fileName, file);

    if (uploadError) {
      console.log(uploadError);
      alert("File upload failed");
      return;
    }

    // Get Resume URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("resumes")
      .getPublicUrl(fileName);

    // Save Database
    const { error } = await supabase
      .from("candidates")
      .insert([
        {
          name: file.name,
          role: "Frontend Developer",
          score: `${aiScore}%`,
          status: status,
          skills: skills,
          resume_url: publicUrl,
        },
      ]);

    if (error) {
      console.log(error);
    } else {
      alert(
        `Resume Uploaded!\nAI Score: ${aiScore}%`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}
      <div className="w-64 bg-black text-white p-5">

        <h1 className="text-3xl font-bold mb-10">
          HireDesk
        </h1>

        <ul className="space-y-6 text-lg">

          <li
            onClick={() => navigate("/dashboard")}
            className="cursor-pointer hover:text-blue-400"
          >
            Dashboard
          </li>

          <li
            onClick={() => navigate("/results")}
            className="cursor-pointer hover:text-blue-400"
          >
            Candidates
          </li>

          <li
            onClick={() => navigate("/upload")}
            className="cursor-pointer hover:text-blue-400"
          >
            Resume Upload
          </li>

          <li
            onClick={() => navigate("/ai-results")}
            className="cursor-pointer hover:text-blue-400"
          >
            AI Results
          </li>

          <li
            onClick={() => navigate("/settings")}
            className="cursor-pointer hover:text-blue-400"
          >
            Settings
          </li>

        </ul>

      </div>

      {/* Main */}
      <div className="flex-1 p-10">

        <div className="bg-white rounded-2xl shadow-md p-10 max-w-3xl">

          <h1 className="text-4xl font-bold mb-8">
            Upload Resume
          </h1>

          {/* Upload Box */}
          <div className="border-2 border-dashed border-gray-400 rounded-2xl p-16 text-center">

            <p className="text-gray-600 text-lg mb-6">
              Upload Resume PDF
            </p>

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) =>
                setFile(e.target.files[0])
              }
              className="mb-6"
            />

            {file && (
              <p className="mb-6 text-green-600 font-semibold">
                Selected File: {file.name}
              </p>
            )}

            <button
              onClick={addCandidate}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700"
            >
              Upload Resume
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default UploadResume;