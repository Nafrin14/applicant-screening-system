import React, {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { supabase }
from "../supabase";

import Sidebar from "../components/Sidebar";

import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaTools,
  FaUserTie,
} from "react-icons/fa";

function JobPost() {

  const navigate =
    useNavigate();

  const [job, setJob] =
    useState({
      title: "",
      skills: "",
      experience: "",
      location: "",
      salary: "",
      description: "",
    });

  const handleChange =
    (e) => {

    setJob({
      ...job,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      const { error } =
        await supabase
          .from("job_posts")
          .insert([job]);

      if (error) {

        console.log(error);

        alert(
          "Error posting job"
        );

      } else {

        try {

          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const indeedResponse =
            await fetch(
              `${API_BASE}/api/indeed/post-job`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(job),
              }
            );

          const indeedData =
            await indeedResponse.json();

          console.log(
            "Indeed Response:",
            indeedData
          );

          alert(
            "Job Posted Successfully!"
          );

          navigate("/jobs");

        } catch (err) {

          console.log(err);

          alert(
            "Indeed connection failed"
          );
        }
      }
    };

  return (

    <div className="min-h-screen bg-slate-100 flex">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}

      <div className="flex-1 md:ml-64 p-6 overflow-y-auto">

        <div className="mb-6">

          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Create Job Post
          </h1>

          <p className="text-gray-500 text-sm">
            Create and publish new job opportunities
          </p>

        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 max-w-5xl">

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Job Title
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaUserTie className="text-gray-400" />

                <input
                  type="text"
                  name="title"
                  placeholder="Enter job title"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Required Skills
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaTools className="text-gray-400" />

                <input
                  type="text"
                  name="skills"
                  placeholder="React, Node.js, SQL"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-5">

              <div>

                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Experience
                </label>

                <input
                  type="text"
                  name="experience"
                  placeholder="2+ Years"
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none"
                />

              </div>

              <div>

                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Location
                </label>

                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                  <FaMapMarkerAlt className="text-gray-400" />

                  <input
                    type="text"
                    name="location"
                    placeholder="Srilanka"
                    onChange={handleChange}
                    className="w-full bg-transparent px-4 py-4 outline-none"
                  />

                </div>

              </div>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Salary
              </label>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4">

                <FaMoneyBillWave className="text-gray-400" />

                <input
                  type="text"
                  name="salary"
                  placeholder="LK 30000 - 50000"
                  onChange={handleChange}
                  className="w-full bg-transparent px-4 py-4 outline-none"
                />

              </div>

            </div>

            <div>

              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Job Description
              </label>

              <textarea
                name="description"
                placeholder="Enter detailed job description..."
                onChange={handleChange}
                rows="6"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none resize-none"
              ></textarea>

            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-md transition-all duration-300"
            >

              Post Job

            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default JobPost;