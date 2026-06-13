import React, { useState } from "react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../supabase";

import { screenResume } from "../services/aiService";

import Sidebar from "../components/Sidebar";

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
import {
  FaCloudUploadAlt,
} from "react-icons/fa";



function UploadResume() {

  const navigate = useNavigate();

const [files, setFiles] = useState([]);

  const [role, setRole] = useState("");

  const [jobDescription, setJobDescription] = useState("");

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

if (!jobDescription) {

  alert("Please enter Job Description");

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
    jobDescription
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

const phoneMatch = fileText.match(
  /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
);

const phone = phoneMatch
  ? phoneMatch[0]
  : "--";


      const experienceMatch =
  fileText.match(
    /(\d+(\.\d+)?\+?\s*(years?|yrs?|months?))/i
  );

const experience =
  experienceMatch
    ? experienceMatch[0]
    : "--";

const locationMatch =
  fileText.match(
    /(Colombo|Kalmunai|Kandy|Galle|Jaffna|Batticaloa|Trincomalee|Doha|Qatar|Dubai|UAE|Chennai|Bangalore|India|Sri Lanka)/i
  );

const location =
  locationMatch
    ? locationMatch[0]
    : "Not Found";

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
  aiResponse?.name ||
  file?.name ||
  "Unknown Candidate",

              email: email,

              phone: phone,

              role: role,

              experience:
  experience !== "Not Found"
    ? experience
    : "--",

location:
  aiResponse?.location ||
  location,
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

recommended_role:
  aiResponse?.recommendedRole || "",



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
  return (
   <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex">
      {/* Sidebar */}
      <Sidebar />

    <div className="flex-1 md:ml-60 pt-20 md:pt-8 px-4 md:px-4 py-4 md:py-8 min-h-screen">
        <div className="mb-6 md:mb-8">
<h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Resume Upload
          </h1>
          <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">
            Upload and analyze candidate resumes
          </p>
        </div>

       <div className="
bg-white
rounded-3xl
shadow-xl
border
border-slate-200
p-6 md:p-8
w-full mx-auto
">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
           <div className="lg:sticky lg:top-8 self-start">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Candidate Information
              </h2>

              <textarea
                placeholder="Paste Job Description Here"
                value={jobDescription}
                onChange={(e) =>
                  setJobDescription(e.target.value)
                }
                rows={6}
               className="
w-full
bg-slate-50
border
border-slate-200
rounded-3xl
px-5
py-4
outline-none
text-sm
md:text-base
mb-6
focus:ring-2
focus:ring-blue-500
focus:border-blue-500
transition-all
"
              />

              <div
                onDragOver={(e) =>
                  e.preventDefault()
                }
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedFiles = Array.from(e.dataTransfer.files);
                  if (droppedFiles.length > 0) {
                    setFiles(droppedFiles);
                  }
                }}
               

className="
border-2
border-dashed
border-blue-400
bg-gradient-to-br
from-blue-50
to-indigo-50
rounded-3xl
min-h-[500px]
flex
flex-col
justify-center
items-center
p-10
md:p-14
text-center
hover:scale-[1.02]
hover:shadow-xl
transition-all
duration-300
cursor-pointer
"
              >
               <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
  <FaCloudUploadAlt className="text-white text-4xl" />
</div>
                <p className="text-lg md:text-xl font-bold text-blue-700 mb-1 md:mb-2">
                  Drag & Drop Resume
                </p>

                <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">
                  Upload PDF, DOC, DOCX
                </p>

                <input
  id="resumeUpload"
  type="file"
  multiple
  accept=".pdf,.doc,.docx"
  onChange={(e) =>
    setFiles(Array.from(e.target.files))
  }
  className="hidden"
/>

<label
  htmlFor="resumeUpload"
  className="
  inline-flex
  items-center
  gap-2
  bg-gradient-to-r
  from-blue-600
  to-indigo-600
  text-white
  
  px-8 py-4 text-lg font-semibold
  rounded-2xl
  cursor-pointer
  shadow-lg
  hover:shadow-xl
  transition-all
  duration-300
  hover:-translate-y-1
  "
>
  📄 Choose Resume Files
</label>

                {files.length > 0 && (
                  <div className="mt-4 bg-white rounded-xl p-3 md:p-4 shadow-sm text-left">
                    <p className="text-green-600 font-bold text-sm">
                      Selected Files
                    </p>
                    {files.map((file, index) => (
                      <p
                        key={index}
                        className="text-gray-700 text-xs md:text-sm mt-1 truncate"
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
               className="
w-full
bg-gradient-to-r
from-blue-600
to-indigo-600
hover:from-blue-700
hover:to-indigo-700
text-white
py-4
rounded-2xl
mt-6
text-lg
font-semibold
shadow-lg
hover:shadow-xl
transition-all
duration-300
hover:-translate-y-1
"
              >
                {loading ? "Uploading..." : "Upload Resume"}
              </button>
            </div>

        <div className="
bg-gradient-to-br
from-slate-50
to-blue-50
rounded-3xl
border
border-slate-200
p-6
h-[800px]
overflow-y-auto
mt-4
lg:mt-0
">
              <h2 className="text-3xl font-bold text-slate-800 mb-6">
                AI Screening Result
              </h2>

              {aiResult ? (
                <div className="
bg-white
rounded-3xl
p-6
shadow-lg
border
border-slate-100
">
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800">
                      AI Analysis Result
                    </h3>
               <div className="
bg-gradient-to-r
from-blue-600
to-indigo-600
text-white
px-5
py-2
rounded-full
font-bold
shadow-md
text-sm
md:text-base
">
                      {aiResult?.score || 0}%
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold text-slate-700 text-sm md:text-base">
                      Recommendation
                    </p>
                    <p
                      className={`mt-1 font-bold text-sm md:text-base ${
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
                    <p className="font-semibold text-slate-700 text-sm md:text-base">
                      Summary
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm mt-1 leading-relaxed">
                      {aiResult?.summary}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold text-slate-700 text-sm md:text-base mb-2">
                      Strengths
                    </p>
                    <ul className="list-disc pl-5 text-green-700 text-xs md:text-sm space-y-1">
                      {aiResult?.strengths?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <p className="font-semibold text-slate-700 text-sm md:text-base mb-2">
                      Missing Skills
                    </p>
                    <ul className="list-disc pl-5 text-red-600 text-xs md:text-sm space-y-1">
                      {aiResult?.missingSkills?.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-700 text-sm md:text-base mb-2">
                      Why Suitable
                    </p>
                    <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                      {aiResult?.whySuitable}
                    </p>
                  </div>
                </div>
              ) : (
              <div className="h-[350px] flex flex-col items-center justify-center text-center">
  <div className="text-6xl mb-4">🤖</div>

  <h3 className="text-lg font-semibold text-slate-700">
    AI Screening Ready
  </h3>

  <p className="text-slate-500 mt-2">
    Upload a resume to generate AI analysis
  </p>
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