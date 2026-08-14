import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../core/lib/supabase";
import { screenResume } from "../services/aiService";
import { useNotification } from "../../../../core/context/NotificationContext";


import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  
import {
  FaCloudUploadAlt,
  FaSearch,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";

// Same candidate re-uploaded (same email, or same name+phone when no email
// was extracted) should not create a second row in applicants.
const findDuplicateApplicant = async (candidateEmail, candidateName, candidatePhone) => {
  let query = supabase.from("applicants").select("id").limit(1);

  if (candidateEmail && candidateEmail !== "Not Found") {
    query = query.ilike("email", candidateEmail);
  } else {
    query = query.ilike("name", candidateName);
    if (candidatePhone && candidatePhone !== "--") {
      query = query.eq("phone", candidatePhone);
    }
  }

  const { data } = await query;
  return (data || []).length > 0;
};

function UploadResume() {
const navigate = useNavigate();
const { notify } = useNotification();
const [files, setFiles] = useState([]);
const [role, setRole] = useState("");
const [jobs, setJobs] = useState([]);
const [selectedJobId, setSelectedJobId] = useState("");
const [jobSearch, setJobSearch] = useState("");
const [jobDropdownOpen, setJobDropdownOpen] = useState(false);
const jobDropdownRef = useRef(null);
const [aiResult, setAiResult] = useState(null);
const [loading, setLoading] = useState(false);
       useEffect(() => {
       fetchJobs();
       }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobDropdownRef.current && !jobDropdownRef.current.contains(e.target)) {
        setJobDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const fetchJobs = async () => {
const { data } = await supabase
    .from("job_posts")
    .select("*")
    .order("created_at", { ascending: false });
    setJobs(data || []);
};

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

  notify("Please select resumes", { type: "error" });

  return;
}
if (!selectedJobId) {
  notify("Please select a Job Position", { type: "error" });
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
const selectedJobTitle =
  jobs.find((j) => j.id == selectedJobId)?.title || "";

const aiResponse =
  await screenResume(
    fileText,
    selectedJobTitle
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

   console.log(fileText);

/* PHONE */

let phone = "--";

const phoneMatches =
  fileText.match(/(?:\+?\d[\d\s()-]{8,25})/g) || [];

for (const num of phoneMatches) {
  const digits = num.replace(/\D/g, "");

  if (digits.length >= 9 && digits.length <= 15) {
    phone = num.match(
      /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|(?:\+?\d[\d\s()-]{8,20})/
    )[0];

    break;
  }
}

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

    /* DUPLICATE CHECK */

    const candidateName = aiResponse?.name || file?.name || "Unknown Candidate";
    const isDuplicate = await findDuplicateApplicant(email, candidateName, phone);

    if (isDuplicate) {
      notify(
        `Skipped "${candidateName}" — already exists in the system`,
        { type: "error" }
      );
      continue;
    }

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

        notify(uploadError.message, { type: "error" });

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
              name: candidateName,
              email: email,
              phone: phone,
              role: selectedJobTitle,
              job_post_id: parseInt(selectedJobId),
              experience:experience !== "Not Found" ? experience : "--",
              location:aiResponse?.location ||location,
              work_authorization: "Yes",
              source: "Manual",
              ai_score: aiScore,
              status: status,
              ai_status: status,
              skills: skills,
              matched_skills:aiResponse?.strengths?.join(", ") || "",
              missing_skills:aiResponse?.missingSkills?.join(", ") || "",
              recommendation:aiResponse?.recommendation || "Pending",
              why_suitable:aiResponse?.whySuitable || "",
              recommended_role:aiResponse?.recommendedRole || "",
              resume_url: publicUrl,
              created_at: new Date().toISOString(),
            },
          ]);

      if (error) {
        console.log(
          "DATABASE ERROR:",
          error
        );

        notify(error.message, { type: "error" });
      } else {

        notify(
  "All resumes uploaded successfully!", { type: "success" }
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

      notify(
        err?.message ||
        JSON.stringify(err) ||
        "Upload failed",
        { type: "error" }
      );

      setLoading(false);
    }
  };
 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 px-4 md:px-4 py-4 md:py-8">
  <div className="mb-6 md:mb-8">
  <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600
 to-purple-600 bg-clip-text text-transparent">
   Resume Upload
  </h1>
  <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">
   Upload and analyze candidate resumes
   </p>
  </div>

<div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 w-full mx-auto
">
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
<div className="lg:sticky lg:top-8 self-start">
<h2 className="text-2xl font-bold text-slate-800 mb-6">
  Candidate Information
</h2>

<div className="mb-6 relative" ref={jobDropdownRef}>
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    Select Job Position
  </label>

  {/* Trigger button */}
  <button
    type="button"
    onClick={() => {
      setJobDropdownOpen((prev) => !prev);
      setJobSearch("");
    }}
    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all flex items-center justify-between text-left"
  >
    <span className={selectedJobId ? "text-slate-800" : "text-slate-400"}>
      {selectedJobId
        ? jobs.find((j) => j.id == selectedJobId)?.title || "Select Job Position..."
        : "Select Job Position..."}
    </span>
    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
      {selectedJobId && (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedJobId("");
            setJobSearch("");
          }}
          className="text-slate-400 hover:text-red-500 transition"
        >
          <FaTimes className="text-xs" />
        </span>
      )}
      <FaChevronDown
        className={`text-slate-400 text-xs transition-transform duration-200 ${jobDropdownOpen ? "rotate-180" : ""}`}
      />
    </div>
  </button>

  {/* Dropdown */}
  {jobDropdownOpen && (
      <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
      {/* Search input */}
      <div className="p-3 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <FaSearch className="text-slate-400 text-xs flex-shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search job position..."
            value={jobSearch}
            onChange={(e) => setJobSearch(e.target.value)}
            className="bg-transparent text-sm outline-none w-full text-slate-700 placeholder-slate-400"
          />
          {jobSearch && (
            <button onClick={() => setJobSearch("")} className="text-slate-400 hover:text-slate-600">
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="max-h-52 overflow-y-auto">
        {jobs
          .filter((job) =>
            job.title.toLowerCase().includes(jobSearch.toLowerCase())
          )
          .map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJobId(job.id);
                setJobDropdownOpen(false);
                setJobSearch("");
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                selectedJobId == job.id
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {job.title}
            </button>
          ))}
        {jobs.filter((job) =>
          job.title.toLowerCase().includes(jobSearch.toLowerCase())
        ).length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            No matching positions found
          </div>
        )}
      </div>
    </div>
  )}
</div>
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
               

className="border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl min-h-[280px]
flex flex-col justify-center items-center p-6 md:p-8 text-center hover:scale-[1.02] hover:shadow-xl transition-all duration-300
cursor-pointer
" >
<div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
  <FaCloudUploadAlt className="text-white text-2xl" />
</div>
<p className="text-base md:text-lg font-bold text-blue-700 mb-1">
   Drag & Drop Resume
</p>

<p className="text-xs text-gray-500 mb-3 md:mb-4">
  Upload PDF, DOC, DOCX
  </p>
<input id="resumeUpload"
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

  px-5 py-2.5 text-sm font-semibold
  rounded-xl
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
      className="text-gray-700 text-xs md:text-sm mt-1 truncate" >
        {file.name}
          </p>
       ))}
 </div>
   )}</div>

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
  );
}

export default UploadResume;