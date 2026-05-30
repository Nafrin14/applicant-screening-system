import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../supabase";

import { screenResume } from "../services/aiService";

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import {
  FaTachometerAlt,
  FaUsers,
  FaFileUpload,
  FaRobot,
  FaCalendarAlt,
  FaClipboardList,
  FaBriefcase,
  FaSuitcase,
  FaUserFriends,
  FaCog,
  FaCloudUploadAlt,
} from "react-icons/fa";

/* PDF WORKER FIX */

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function UploadResume() {

  const navigate = useNavigate();

const [files, setFiles] = useState([]);

  const [role, setRole] = useState("");

 const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);

  /* AI SCORE */

  const generateAIScore = (fileName = "") => {

    let score = 50;

    const lowerCaseFile = fileName.toLowerCase();

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

  /* SKILLS */

  const extractSkills = (fileText = "") => {

    const lowerCaseText = fileText.toLowerCase();

    let skills = [];

    if (lowerCaseText.includes("react")) {
      skills.push("React");
    }

    if (lowerCaseText.includes("node")) {
      skills.push("Node.js");
    }

    if (lowerCaseText.includes("sql")) {
      skills.push("SQL");
    }

    if (lowerCaseText.includes("python")) {
      skills.push("Python");
    }

    if (lowerCaseText.includes("java")) {
      skills.push("Java");
    }

    if (lowerCaseText.includes("javascript")) {
      skills.push("JavaScript");
    }

    return skills.join(", ");
  };

  /* STATUS */

  const getStatus = (aiText = "") => {

    const lowerText = aiText.toLowerCase();

    if (
      lowerText.includes("strong match") ||
      lowerText.includes("highly recommended") ||
      lowerText.includes("excellent fit")
    ) {
      return "Shortlisted";
    }

    if (
      lowerText.includes("moderate match") ||
      lowerText.includes("partial match")
    ) {
      return "Pending";
    }

    return "Rejected";
  };

  /* PDF TEXT EXTRACT */

  const extractPDFText = async (file) => {

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    let fullText = "";

    for (
      let pageNum = 1;
      pageNum <= pdf.numPages;
      pageNum++
    ) {

      const page = await pdf.getPage(pageNum);

      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => item.str)
        .join(" ");

      fullText += pageText + "\n";
    }

    return fullText;
  };

  /* UPLOAD FUNCTION */

  const addCandidate = async () => {

   if (files.length === 0) {

  alert("Please select resumes");

  return;
}

    if (!role) {

      alert("Please enter role");

      return;
    }

    try {

  setLoading(true);

  for (const file of files) {

    let fileText = "";

    /* PDF */

    if (file.type === "application/pdf") {

      fileText =
        await extractPDFText(file);

    } else {

      fileText =
        await file.text();
    }

    /* AI SCREENING */

    const aiResponse =
      await screenResume(
        fileText,
        role
      );
      console.log(
  "AI RESPONSE:",
  aiResponse
);

    setAiResult(aiResponse);

    /* AI SCORE */

    const aiScore =
      aiResponse?.score || 0;

    /* SKILLS */

    const skills =
      aiResponse?.strengths?.join(", ") || "";

    /* STATUS */

    const status =
      aiScore >= 75
        ? "Shortlisted"
        : aiScore >= 60
        ? "Pending"
        : "Rejected";

    /* EMAIL */

    const email =
      fileText.match(
        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      )?.[0] || "Not Found";

    /* PHONE */

    const phone =
      fileText.match(
        /(\+?\d[\d\s-]{7,}\d)/g
      )?.[0] || "Not Found";

    /* FILE NAME */

    const fileName =
      `${Date.now()}-${file.name}`;

    
      /* STORAGE */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("resumes")
        .upload(fileName, file);

      if (uploadError) {

        console.log(
          "UPLOAD ERROR:",
          uploadError
        );

        alert(uploadError.message);

        setLoading(false);

        return;
      }

      /* PUBLIC URL */

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      /* DATABASE */

      const { error } =
        await supabase
          .from("applicants")
          .insert([
            {
              name:
                file?.name ||
                "Unknown Candidate",

              email: email,

              phone: phone,

              role: role,

              experience: "2 Years",

              location: "Sri Lanka",

              work_authorization: "Yes",

              source: "Manual",

              ai_score: aiScore,

              status: status,

              ai_status: status,

              skills: skills,

matched_skills:
  aiResponse?.strengths?.join(", ") || "",

missing_skills:
  aiResponse?.missingSkills?.join(", ") || "",

recommendation:
  aiResponse?.recommendation || "Pending",

why_suitable:
  aiResponse?.whySuitable || "",

resume_url: publicUrl,
            },
          ]);

      if (error) {

        console.log(
          "DATABASE ERROR:",
          error
        );

        alert(error.message);

      } else {

        alert(
  "All resumes uploaded successfully!"
);

        setFiles([]);

        setRole("");
      }

      setLoading(false);}

    } catch (err) {

      console.log(
        "MAIN ERROR:",
        err
      );

      alert(
        err?.message ||
        JSON.stringify(err) ||
        "Upload failed"
      );

      setLoading(false);
    }
  };

  /* SIDEBAR */

  const menuItems = [

    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <FaTachometerAlt />,
    },

    {
      name: "Candidates",
      path: "/results",
      icon: <FaUsers />,
    },

    {
      name: "Resume Upload",
      path: "/upload",
      icon: <FaFileUpload />,
    },

    {
      name: "AI Results",
      path: "/ai-results",
      icon: <FaRobot />,
    },

    {
      name: "Interview Schedule",
      path: "/interview-schedule",
      icon: <FaCalendarAlt />,
    },

    {
      name: "Scheduled Interviews",
      path: "/scheduled-interviews",
      icon: <FaClipboardList />,
    },

    {
      name: "Job Post",
      path: "/job-post",
      icon: <FaBriefcase />,
    },

    {
      name: "Posted Jobs",
      path: "/jobs",
      icon: <FaSuitcase />,
    },

    {
      name: "Indeed Applicants",
      path: "/indeed-applicants",
      icon: <FaUserFriends />,
    },

    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">

      <div className="w-64 bg-slate-900 text-white p-5 flex flex-col justify-between shadow-2xl fixed left-0 top-0 h-screen overflow-y-auto">
        <div>

          <h1 className="text-2xl font-extrabold mb-10 leading-snug">
            Applicant Screening System
          </h1>

          <ul className="space-y-2">

            {menuItems.map((item) => (

              <li
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-slate-800 hover:translate-x-1 ${
                  item.name === "Resume Upload"
                    ? "bg-slate-800"
                    : ""
                }`}
              >

                <div className="flex items-center gap-3">

                  <span>{item.icon}</span>

                  <span className="text-sm font-medium">
                    {item.name}
                  </span>

                </div>

              </li>

            ))}

          </ul>

        </div>

      </div>

      <div className="flex-1 ml-64 p-8 h-screen overflow-y-auto">

        <div className="mb-8">

          <h1 className="text-4xl font-extrabold text-slate-800">
            Resume Upload
          </h1>

          <p className="text-gray-500 mt-2">
            Upload and analyze candidate resumes
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-md p-8 max-w-5xl">

          <div className="grid grid-cols-2 gap-8 items-start">
            <div className="sticky top-0">

              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Candidate Information
              </h2>

              <input
                type="text"
                placeholder="Enter Candidate Role"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
                className="w-full bg-slate-100 border border-gray-200 rounded-2xl px-5 py-4 outline-none mb-6"
              />

              <div
                onDragOver={(e) =>
                  e.preventDefault()
                }

                
onDrop={(e) => {

  e.preventDefault();

  const droppedFiles =
    Array.from(
      e.dataTransfer.files
    );

  if (droppedFiles.length > 0) {

    setFiles(droppedFiles);
  }
}}

                className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-3xl p-10 text-center hover:bg-blue-100 transition"
              >

                <FaCloudUploadAlt className="text-6xl text-blue-600 mx-auto mb-4" />

                <p className="text-xl font-bold text-blue-700 mb-2">
                  Drag & Drop Resume
                </p>

                <p className="text-gray-500 mb-6">
                  Upload PDF, DOC, DOCX
                </p>

                <input
  type="file"
  multiple
  accept=".pdf,.doc,.docx"
  onChange={(e) =>
    setFiles(
      Array.from(
        e.target.files
      )
    )
  }
  className="mb-4"
/>

                {files.length > 0 && (

  <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">

    <p className="text-green-600 font-bold">
      Selected Files
    </p>

    {files.map((file, index) => (

      <p
        key={index}
        className="text-gray-700 mt-1"
      >
        {file.name}
      </p>

    ))}

  </div>

)}

              </div>

              <button
                type="button"
                onClick={async () => {
                  await addCandidate();
                }}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl mt-6 text-lg font-semibold shadow-lg transition"
              >

                {loading
                  ? "Uploading..."
                  : "Upload Resume"}

              </button>

            </div>

            

            <div className="bg-slate-50 rounded-3xl p-6">

              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                AI Screening Result
              </h2>

              {aiResult ? (

  <div className="bg-white rounded-3xl p-6 shadow-lg">

    <div className="flex justify-between items-center mb-6">

      <h3 className="text-xl font-bold text-slate-800">
        AI Analysis Result
      </h3>

      <div className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold">
        {aiResult?.score || 0}%
      </div>

    </div>

    <div className="mb-4">
      <p className="font-semibold text-slate-700">
        Recommendation
      </p>

      <p
        className={`mt-1 font-bold ${
          aiResult?.score >= 75
            ? "text-green-600"
            : aiResult?.score >= 60
            ? "text-yellow-600"
            : "text-red-600"
        }`}
      >
        {aiResult?.recommendation}
      </p>
    </div>

    <div className="mb-4">
      <p className="font-semibold text-slate-700">
        Summary
      </p>

      <p className="text-gray-600 mt-1">
        {aiResult?.summary}
      </p>
    </div>

    <div className="mb-4">
      <p className="font-semibold text-slate-700 mb-2">
        Strengths
      </p>

      <ul className="list-disc pl-5 text-green-700">
        {aiResult?.strengths?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>

    <div className="mb-4">
      <p className="font-semibold text-slate-700 mb-2">
        Missing Skills
      </p>

      <ul className="list-disc pl-5 text-red-600">
        {aiResult?.missingSkills?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>

    <div>
      <p className="font-semibold text-slate-700 mb-2">
        Why Suitable
      </p>

      <p className="text-gray-600">
        {aiResult?.whySuitable}
      </p>
    </div>

  </div>

) : (
                <div className="h-full flex items-center justify-center text-center text-gray-400">

                  AI analysis results will appear here after resume upload.

                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default UploadResume;