import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaArrowLeft, FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaUser } from "react-icons/fa";

export default function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [jobId]);

  async function fetchData() {
    setLoading(true);

    const { data: jobData } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", jobId)
      .single();
    setJob(jobData);

    // Try job_post_id first, fallback to role match
    let { data: appData } = await supabase
      .from("applicants")
      .select("*")
      .eq("job_post_id", jobId);

    if (!appData || appData.length === 0) {
      // Fallback: match by role = job title
      const { data: byRole } = await supabase
        .from("applicants")
        .select("*")
        .eq("role", jobData?.title);
      appData = byRole || [];
    }

    setApplicants(appData);
    setLoading(false);
  }

  const statusStyle = (status) => {
    const map = {
      Pending: { backgroundColor: "#fef9c3", color: "#92400e" },
      Rejected: { backgroundColor: "#fee2e2", color: "#991b1b" },
      Accepted: { backgroundColor: "#d1fae5", color: "#065f46" },
    };
    return map[status] || { backgroundColor: "#f3f4f6", color: "#374151" };
  };

  return (
  <div className="mt-20 flex h-screen w-screen overflow-hidden bg-gray-100">
    <Sidebar />
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden ml-[220px]">
      <Navbar />
      <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => navigate("/jobs")}
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", background: "none", border: "none", cursor: "pointer", marginBottom: "20px", fontSize: "14px", fontWeight: "600" }}
          >
            <FaArrowLeft /> Back to Jobs
          </button>

          {loading ? (
            <p style={{ color: "#6b7280" }}>Loading...</p>
          ) : (
            <>
              {/* Job Info */}
              {job && (
                <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                  <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1f2937", marginBottom: "8px" }}>{job.title}</h1>
                  <p style={{ color: "#6b7280", marginBottom: "16px", fontSize: "14px" }}>{job.description}</p>
                  <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "14px", color: "#4b5563" }}>
                    <span><FaMapMarkerAlt style={{ color: "#3b82f6", marginRight: "4px" }} />{job.location || "N/A"}</span>
                    <span><FaBriefcase style={{ color: "#10b981", marginRight: "4px" }} />{job.experience || "N/A"}</span>
                    <span><FaDollarSign style={{ color: "#f59e0b", marginRight: "4px" }} />{job.salary || "N/A"}</span>
                  </div>
                </div>
              )}

              {/* Applicants */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1f2937", marginBottom: "16px" }}>
                  Applicants ({applicants.length})
                </h2>

                {applicants.length === 0 ? (
                  <p style={{ color: "#9ca3af" }}>No applicants found for this job yet.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left", color: "#6b7280" }}>
                        <th style={{ paddingBottom: "12px" }}>Name</th>
                        <th style={{ paddingBottom: "12px" }}>Email</th>
                        <th style={{ paddingBottom: "12px" }}>Phone</th>
                        <th style={{ paddingBottom: "12px" }}>Skills</th>
                        <th style={{ paddingBottom: "12px" }}>Status</th>
                        <th style={{ paddingBottom: "12px" }}>AI Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicants.map((a) => (
                        <tr key={a.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "12px 0", fontWeight: "600", color: "#1f2937" }}>
                            <FaUser style={{ color: "#9ca3af", marginRight: "6px" }} />{a.name}
                          </td>
                          <td style={{ padding: "12px 0", color: "#6b7280" }}>{a.email}</td>
                          <td style={{ padding: "12px 0", color: "#6b7280" }}>{a.phone || "—"}</td>
                          <td style={{ padding: "12px 0", color: "#6b7280", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.skills}</td>
                          <td style={{ padding: "12px 0" }}>
                            <span style={{ ...statusStyle(a.status), padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>
                              {a.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 0", fontWeight: "700", color: a.ai_score >= 70 ? "#059669" : "#dc2626" }}>
                            {a.ai_score ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}