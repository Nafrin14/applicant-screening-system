import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

function CareersPage() {

  const navigate =
    useNavigate();

  const [jobs, setJobs] =
    useState([]);

  useEffect(() => {

    fetchJobs();

  }, []);

  const fetchJobs =
    async () => {

      const {
        data,
        error,
      } =
        await supabase
          .from("job_posts")
          .select("*")
          .order("id", {
            ascending: false,
          });

      if (!error) {

        setJobs(data);
      }
    };

  return (

    <div className="min-h-screen bg-slate-100 p-10">

      <h1 className="text-4xl font-bold text-center mb-10">
        Careers
      </h1>

      <div className="grid md:grid-cols-2 gap-6">

        {jobs.map((job) => (

          <div
            key={job.id}
            className="bg-white rounded-3xl p-6 shadow-md"
          >

            <h2 className="text-2xl font-bold mb-3">
              {job.title}
            </h2>

            <p className="text-gray-600 mb-2">
              {job.location}
            </p>

            <p className="text-blue-600 font-semibold mb-4">
              {job.salary}
            </p>

            <p className="text-gray-700 mb-4">
              {job.description}
            </p>

            <button
              onClick={() =>
                navigate(
                  `/apply/${job.id}`
                )
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl"
            >

              Apply Now

            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default CareersPage;