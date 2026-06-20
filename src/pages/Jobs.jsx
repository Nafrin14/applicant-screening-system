import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaPlus, FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaTimes, FaTrash } from "react-icons/fa";

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "", skills: "", experience: "", location: "", salary: "", description: ""
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setJobs(data);
    setLoading(false);
  }

  async function handleAddJob(e) {
    e.preventDefault();
    const { error } = await supabase.from("job_posts").insert([form]);
    if (!error) {
      setShowModal(false);
      setForm({ title: "", skills: "", experience: "", location: "", salary: "", description: "" });
      fetchJobs();
    }
  }

  async function handleDeleteJob(e, jobId) {
  e.stopPropagation(); // prevent card click navigation
  if (!window.confirm("Delete this job?")) return;
  await supabase.from("job_posts").delete().eq("id", jobId);
  fetchJobs();
}

  return (
   <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
  <Sidebar />
  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden", marginLeft: "220px" }}>
    <Navbar />
    <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

        

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Job Openings</h1>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-5 mt-20 rounded-lg hover:bg-blue-700"
            >
              <FaPlus /> Add New Job
            </button>
          </div>

          {/* Job Cards */}
          {loading ? (
            <p className="text-gray-500">Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-gray-500">No jobs posted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (

                
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="relative bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md hover:border-blue-500 border-2 border-transparent transition"
                >
                  <button
                    onClick={(e) => handleDeleteJob(e, job.id)}
                    className="absolute top-4 right-0 text-red-500 hover:text-red-600 focus:outline-none"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", borderRadius: "9999px" }}
                    title="Delete job"
                  >
                    <FaTrash />
                  </button>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">{job.title}</h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{job.description}</p>
                  <div className="flex flex-col gap-1 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-blue-500" /> {job.location || "Not specified"}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaBriefcase className="text-green-500" /> {job.experience || "Not specified"}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaDollarSign className="text-yellow-500" /> {job.salary || "Not specified"}
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                      View Applicants →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Add New Job</h2>
              <button onClick={() => setShowModal(false)}><FaTimes className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAddJob} className="flex flex-col gap-3">
              <input required placeholder="Job Title" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Required Skills" value={form.skills}
                onChange={e => setForm({ ...form, skills: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Experience (e.g. 2+ years)" value={form.experience}
                onChange={e => setForm({ ...form, experience: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Location" value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Salary (e.g. $50,000/year)" value={form.salary}
                onChange={e => setForm({ ...form, salary: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea placeholder="Job Description" value={form.description} rows={3}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit"
                className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">
                Post Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}