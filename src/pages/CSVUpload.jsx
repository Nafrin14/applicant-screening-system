import React, {
  useState,
} from "react";

import Papa
from "papaparse";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

function CSVUpload() {

  const navigate =
    useNavigate();

  const [file, setFile] =
    useState(null);

  const uploadCSV =
    () => {

    if (!file) {

      alert(
        "Please select CSV file"
      );

      return;
    }

    Papa.parse(file, {

      header: true,

      skipEmptyLines: true,

      complete: async (
        results
      ) => {

        const applicants =
          results.data
            .filter(
              (row) =>
                row.Name &&
                row.Email
            )
            .map(
              (row) => ({

                name:
                  row.Name,

                email:
                  row.Email,

                phone:
                  row.Phone,

                job_title:
                  row.Job,

                location:
                  row.Location,

                experience:
                  row.Experience,

                skills:
                  row.Skills,

                score:
                  row.Score,

                status:
                  row.Status,

              })
            );

        console.log(
          applicants
        );

        const { error } =
          await supabase
            .from(
              "indeed_applicants"
            )
            .insert(
              applicants
            );

        if (error) {

          console.log(
            error
          );

          alert(
            "CSV Upload Failed"
          );

        } else {

          alert(
            "CSV Uploaded Successfully"
          );

          navigate(
            "/indeed-applicants"
          );
        }
      },
    });
  };

  return (

    <div className="min-h-screen bg-gray-100 flex">

      {/* Sidebar */}

      <div className="w-64 bg-slate-900 text-white p-6">

        <h1 className="text-3xl font-bold mb-12">
          Applicant Screening System
        </h1>

      </div>

      {/* Main */}

      <div className="flex-1 p-10">

        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-3xl">

          <h1 className="text-4xl font-bold mb-10 text-gray-800">
            Upload Indeed CSV
          </h1>

          <input
            type="file"
            accept=".csv"
            onChange={(e) =>
              setFile(
                e.target.files[0]
              )
            }
            className="mb-8"
          />

          <br />

          <button
            onClick={uploadCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl"
          >
            Upload CSV
          </button>

        </div>

      </div>

    </div>
  );
}

export default CSVUpload;