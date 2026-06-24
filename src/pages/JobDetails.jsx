import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";

import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaFileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";

function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobAndApplicants();
  }, [id]);

  async function fetchJobAndApplicants() {
    setLoading(true);

    // Fetch the job details
    const { data: jobData, error: jobError } = await supabase
      .from("job_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (!jobError && jobData) {
      setJob(jobData);
    }

    // Fetch the applicants for this job
    const { data: applicantData, error: applicantError } = await supabase
      .from("applicants")
      .select("*")
      .eq("job_post_id", id)
      .order("ai_score", { ascending: false });

    if (!applicantError) {
      setApplicants(applicantData || []);
    }

    setLoading(false);
  }

  const getStatusColor = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("shortlist")) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes("reject")) return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getStatusIcon = (status = "") => {
    const s = status.toLowerCase();
    if (s.includes("shortlist")) return <FaCheckCircle className="text-green-500" />;
    if (s.includes("reject")) return <FaTimesCircle className="text-red-500" />;
    return <FaClock className="text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-700 mb-4">Job Category Not Found</h2>
        <button 
          onClick={() => navigate('/jobs')}
          className="text-indigo-600 hover:underline flex items-center gap-2"
        >
          <FaArrowLeft /> Go Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/80 to-transparent -z-10 pointer-events-none" />
      <Sidebar />

      <div className="flex-1 md:ml-56 min-w-0 z-10 pt-10 pb-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium mb-6 group w-fit"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Categories
          </button>

          {/* Header */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50 mb-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {job.title}
              </h1>
              <p className="text-slate-500 font-medium text-lg">
                Showing all candidates who applied for this position.
              </p>
            </div>

            <div className="relative z-10 bg-indigo-50 border border-indigo-100 px-6 py-4 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">
                <FaUsers />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Total Applicants</p>
                <p className="text-2xl font-bold text-indigo-700">{applicants.length}</p>
              </div>
            </div>
          </div>

          {/* Applicants List */}
          {applicants.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-[32px] border border-slate-200 border-dashed">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-3xl mb-4 text-slate-400">
                  <FaUserCircle />
               </div>
               <h3 className="text-2xl font-bold text-slate-700 mb-2">No Applicants Yet</h3>
               <p className="text-slate-500">Wait for candidates to upload their resumes for this role.</p>
             </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100/80 text-xs uppercase tracking-wider font-bold text-slate-500">
                      <th className="px-8 py-5">Candidate</th>
                      <th className="px-6 py-5">Contact Info</th>
                      <th className="px-6 py-5 text-center">AI Score</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {applicants.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
                              {app.name ? app.name.charAt(0).toUpperCase() : "?"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">{app.name || "Unknown Candidate"}</p>
                              <p className="text-sm text-slate-500 mt-0.5 truncate max-w-[200px]">{app.role}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FaEnvelope className="text-slate-400" />
                              <span className="truncate max-w-[180px]">{app.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FaPhone className="text-slate-400" />
                              <span>{app.phone || "N/A"}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 font-bold text-indigo-700 shadow-sm">
                            {app.ai_score || 0}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold shadow-sm ${getStatusColor(app.status)}`}>
                            {getStatusIcon(app.status)}
                            {app.status || "Pending"}
                          </span>
                        </td>

                        <td className="px-8 py-5 text-right">
                          <button
  onClick={() => {
    if (app.resume_url) {
      window.open(app.resume_url, "_blank");
    } else {
      alert("No CV file available for this applicant.");
    }
  }}
  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
>
  <FaFileAlt />
  View Applicant
</button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default JobDetails;