import React, {
  useState,
} from "react";

import { useParams }
from "react-router-dom";

import { supabase }
from "../supabase";

import { screenResume }
from "../services/aiService";

import * as pdfjsLib
from "pdfjs-dist";

import {
  FaCloudUploadAlt,
} from "react-icons/fa";

/* PDF WORKER */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function ApplyPage() {

  const { id } =
    useParams();

  const [file, setFile] =
    useState(null);

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  /* PDF TEXT EXTRACT */

  const extractPDFText =
    async (file) => {

      const arrayBuffer =
        await file.arrayBuffer();

      const pdf =
        await pdfjsLib.getDocument({
          data: arrayBuffer,
        }).promise;

      let fullText = "";

      for (
        let pageNum = 1;
        pageNum <= pdf.numPages;
        pageNum++
      ) {

        const page =
          await pdf.getPage(
            pageNum
          );

        const textContent =
          await page.getTextContent();

        const pageText =
          textContent.items
            .map(
              (item) => item.str
            )
            .join(" ");

        fullText +=
          pageText + "\n";
      }

      return fullText;
    };

  const handleApply =
    async () => {

      if (
        !file ||
        !name ||
        !email
      ) {

        alert(
          "Fill all fields"
        );

        return;
      }

      try {

        setLoading(true);

        /* Resume Text */

        let resumeText = "";

        if (
          file.type ===
          "application/pdf"
        ) {

          resumeText =
            await extractPDFText(
              file
            );

        } else {

          resumeText =
            await file.text();
        }

        /* AI Screening */

        const aiResponse =
          await screenResume(
            resumeText,
            "Applied Job"
          );

        const fileName =
          `${Date.now()}-${file.name}`;

        /* Upload Resume */

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from("resumes")
            .upload(
              fileName,
              file
            );

        if (uploadError) {

          alert(
            uploadError.message
          );

          setLoading(false);

          return;
        }

        const {
          data: { publicUrl },
        } =
          supabase.storage
            .from("resumes")
            .getPublicUrl(
              fileName
            );

        /* Save Applicant */

        const { error } =
          await supabase
            .from("applicants")
            .insert([
              {

                name,

                email,

                role:
                  "Applied Job",

                source:
                  "Indeed",

                resume_url:
                  publicUrl,

                status:
                  "Pending",

                ai_status:
                  "Screened",

                ai_score:
                  85,

                recommendation:
                  aiResponse?.result ||
                  "AI Analysis Completed",
              },
            ]);

        if (error) {

          alert(
            error.message
          );

        } else {

          alert(
            "Application Submitted Successfully"
          );

          setName("");

          setEmail("");

          setFile(null);
        }

        setLoading(false);

      } catch (err) {

        console.log(err);

        alert(
          "Application failed"
        );

        setLoading(false);
      }
    };

  return (

    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-10">

      <div className="bg-white rounded-3xl shadow-md p-10 w-full max-w-2xl">

        <h1 className="text-4xl font-bold text-center mb-2">
          Apply for Job
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Submit your application
        </p>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          className="w-full bg-slate-100 rounded-2xl px-5 py-4 mb-5 outline-none"
        />

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className="w-full bg-slate-100 rounded-2xl px-5 py-4 mb-5 outline-none"
        />

        <div className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-3xl p-10 text-center mb-6">

          <FaCloudUploadAlt className="text-6xl text-blue-600 mx-auto mb-4" />

          <p className="font-bold mb-4">
            Upload Resume
          </p>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
          />

          {file && (

            <p className="mt-4 text-green-600 font-semibold">

              {file.name}

            </p>

          )}

        </div>

        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl text-lg font-semibold"
        >

          {loading
            ? "Submitting..."
            : "Apply Now"}

        </button>

      </div>

    </div>
  );
}

export default ApplyPage;