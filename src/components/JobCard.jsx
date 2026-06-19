import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaPlus, FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaTimes } from "react-icons/fa";

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "", skills: "", experience: "", location: "", salary: "", description: ""
  });

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_posts")
      .select("*")
      .order("created_at", { ascending: false });
    console.log("jobs:", data, "error:", error);
    if (!error) setJobs(data || []);
    setLoading(false);
  }

  async function handleAddJob(e) {
    e.preventDefault();
    const { error } = await supabase.from("job_posts").insert([form]);
    if (!error) {
      setShowModal(false);
      setForm({ title: "", skills: "", experience: "", location: "", salary: "", description: "" });
      fetchJobs();
    } else {
      console.error("Insert error:", error);
    }
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <Navbar />
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1f2937" }}>Job Openings</h1>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#2563eb", color: "white", padding: "10px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}
            >
              <FaPlus /> Add New Job
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <p style={{ color: "#6b7280" }}>No jobs posted yet. Click "Add New Job" to create one.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  style={{
                    backgroundColor: "white", borderRadius: "12px", padding: "20px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)", cursor: "pointer",
                    border: "2px solid transparent", transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#2563eb"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                >
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "8px" }}>
                    {job.title}
                  </h2>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {job.description || "No description provided."}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#4b5563" }}>
                    <span><FaMapMarkerAlt style={{ color: "#3b82f6", marginRight: "6px" }} />{job.location || "Not specified"}</span>
                    <span><FaBriefcase style={{ color: "#10b981", marginRight: "6px" }} />{job.experience || "Not specified"}</span>
                    <span><FaDollarSign style={{ color: "#f59e0b", marginRight: "6px" }} />{job.salary || "Not specified"}</span>
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
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
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1f2937" }}>Add New Job</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddJob} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "title", placeholder: "Job Title *", required: true },
                { key: "skills", placeholder: "Required Skills (e.g. React, Node.js)" },
                { key: "experience", placeholder: "Experience (e.g. 2+ years)" },
                { key: "location", placeholder: "Location (e.g. Remote, New York)" },
                { key: "salary", placeholder: "Salary (e.g. $50,000/year)" },
              ].map(({ key, placeholder, required }) => (
                <input
                  key={key}
                  required={required}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none" }}
                />
              ))}
              <textarea
                placeholder="Job Description"
                value={form.description}
                rows={3}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "10px 12px", fontSize: "14px", outline: "none", resize: "vertical" }}
              />
              <button
                type="submit"
                style={{ backgroundColor: "#2563eb", color: "white", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "15px" }}
              >
                Post Job
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}