import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import {
  FaChevronLeft,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaComments,
  FaFileDownload,
  FaExternalLinkAlt,
  FaStickyNote,
  FaUser,
  FaBriefcase,
  FaClock,
  FaCopy,
 FaStar,
  FaSave,
  FaGlobe,
  FaInfoCircle
} from "react-icons/fa";

function CandidateDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get initial state
  const initialApplicant = location.state;
  
  const [applicant, setApplicant] = useState(initialApplicant || null);
  const [loading, setLoading] = useState(!initialApplicant);
  const [activeTab, setActiveTab] = useState("overview");
  const [notesList, setNotesList] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Extract ID from state or query parameter
  const queryParams = new URLSearchParams(location.search);
  const applicantId = initialApplicant?.id || queryParams.get("id");

  useEffect(() => {
    if (applicantId) {
      fetchApplicantDetails(applicantId);
      loadNotes(applicantId);
    }
  }, [applicantId]);

  const fetchApplicantDetails = async (id) => {
    try {
      const { data, error } = await supabase
        .from("applicants")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching applicant details:", error);
      } else if (data) {
        setApplicant(data);
      }
    } catch (err) {
      console.error("Fetch details exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (id) => {
    // 1. Try to load from localStorage first for immediate results or fallback
    const localNotesStr = localStorage.getItem(`candidate_notes_${id}`);
    let localNotes = [];
    if (localNotesStr) {
      try {
        localNotes = JSON.parse(localNotesStr);
      } catch (e) {
        localNotes = [{ id: 1, text: localNotesStr, date: "Earlier" }];
      }
    }

    // 2. Fetch applicant from DB to check notes column
    try {
      const { data, error } = await supabase
        .from("applicants")
        .select("notes")
        .eq("id", id)
        .single();

      if (!error && data?.notes) {
        try {
          const dbNotes = JSON.parse(data.notes);
          if (Array.isArray(dbNotes)) {
            setNotesList(dbNotes);
            return;
          }
        } catch (e) {
          // If notes column is just plain text
          setNotesList([{ id: Date.now(), text: data.notes, date: "Imported" }]);
          return;
        }
      }
    } catch (err) {
      console.error("Notes column query exception:", err);
    }

    // Fallback to local notes if Supabase check fails or has no notes
    setNotesList(localNotes);
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNotes(true);

    const noteItem = {
      id: Date.now(),
      text: newNote.trim(),
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    const updatedNotes = [...notesList, noteItem];
    setNotesList(updatedNotes);
    setNewNote("");

    // Save locally
    localStorage.setItem(`candidate_notes_${applicantId}`, JSON.stringify(updatedNotes));

    // Save to Supabase
    try {
      const { error } = await supabase
        .from("applicants")
        .update({ notes: JSON.stringify(updatedNotes) })
        .eq("id", applicantId);

      if (error) {
        console.warn("Supabase notes update error (column may not exist, falling back to local storage):", error);
      }
    } catch (err) {
      console.warn("Supabase update notes exception:", err);
    } finally {
      setSavingNotes(false);
    }
  };

  const deleteNote = async (noteId) => {
    const updatedNotes = notesList.filter((n) => n.id !== noteId);
    setNotesList(updatedNotes);
    localStorage.setItem(`candidate_notes_${applicantId}`, JSON.stringify(updatedNotes));

    try {
      await supabase
        .from("applicants")
        .update({ notes: JSON.stringify(updatedNotes) })
        .eq("id", applicantId);
    } catch (err) {
      console.error("Delete note DB sync exception:", err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!applicant) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from("applicants")
        .update({ status: newStatus })
        .eq("id", applicant.id);

      if (error) {
        alert("Status update failed: " + error.message);
      } else {
        setApplicant({ ...applicant, status: newStatus });
      }
    } catch (err) {
      console.error("Status update exception:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(""), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 md:ml-56 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading candidate profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="flex-1 md:ml-56 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-4xl mb-4 shadow-sm">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold text-slate-800">No Candidate Profile Found</h1>
          <p className="text-slate-500 max-w-md mt-2">
            The candidate details could not be loaded. Please return to the candidate list and select another candidate.
          </p>
          <button
            onClick={() => navigate("/results")}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md transition"
          >
            Go to Candidates List
          </button>
        </div>
      </div>
    );
  }

  // Calculate SVG circular gauge variables
  const score = applicant.ai_score || applicant.score || 0;
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Custom status configurations
  const getStatusStyle = (status) => {
    switch (status) {
      case "Shortlisted":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Interview Scheduled":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "Selected":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 md:ml-56 p-4 md:p-8 overflow-y-auto overflow-x-hidden min-h-screen pb-24 md:pb-12 pt-20 md:pt-8">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          
          {/* Back Navigation & breadcrumbs */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition group bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
            >
              <FaChevronLeft className="text-xs transition-transform group-hover:-translate-x-0.5" />
              <span>Back to List</span>
            </button>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest hidden sm:block">
              Candidate Profile / {applicant.name?.split(" ")[0]}
            </div>
          </div>

          {/* Profile Header Block */}
          <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 z-10 w-full">
              
              {/* Left Side: Avatar & Core Information */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 w-full lg:w-auto">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg flex items-center justify-center text-3xl md:text-4xl font-extrabold border-4 border-slate-800/80 shrink-0">
                  {applicant.name?.charAt(0)}
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{applicant.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(applicant.status)} shadow-sm`}>
                      {applicant.status || "Pending"}
                    </span>
                  </div>

                  <p className="text-slate-300 font-medium text-sm md:text-base">
                    Applied for: <span className="text-indigo-300 font-semibold">{applicant.role || "General Position"}</span>
                  </p>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1.5 text-xs md:text-sm text-slate-300">
                    {/* Email */}
                    <div className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition">
                      <FaEnvelope className="text-indigo-400" />
                      <span className="truncate max-w-[150px] sm:max-w-[200px]">{applicant.email}</span>
                      <button
                        onClick={() => copyToClipboard(applicant.email, "email")}
                        className="text-slate-400 hover:text-white ml-1.5"
                        title="Copy Email"
                      >
                        {copiedText === "email" ? <span className="text-[10px] text-green-400 font-bold">Copied!</span> : <FaCopy size={10} />}
                      </button>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition">
                      <FaPhone className="text-indigo-400" />
                      <span>{applicant.phone || "--"}</span>
                      {applicant.phone && (
                        <button
                          onClick={() => copyToClipboard(applicant.phone, "phone")}
                          className="text-slate-400 hover:text-white ml-1.5"
                          title="Copy Phone"
                        >
                          {copiedText === "phone" ? <span className="text-[10px] text-green-400 font-bold">Copied!</span> : <FaCopy size={10} />}
                        </button>
                      )}
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition">
                      <FaMapMarkerAlt className="text-indigo-400" />
                      <span>{applicant.location || "--"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Score Circle */}
              <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-2xl self-stretch sm:self-auto justify-center">
                <div className="text-right">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">AI Suitability Score</p>
                  <p className="text-lg font-bold text-indigo-300 mt-1">{applicant.recommendation || "Evaluating..."}</p>
                </div>
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      className="stroke-slate-800"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke={score >= 75 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-sm font-extrabold">{score}%</span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Recruiter Status Update Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Recruiter Decision & Actions
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Shortlisted")}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  applicant.status === "Shortlisted"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                Shortlist
              </button>
              
              <button
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Rejected")}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  applicant.status === "Rejected"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white hover:bg-rose-50 text-rose-600 border-rose-200"
                }`}
              >
                Reject
              </button>

              <button
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Selected")}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  applicant.status === "Selected"
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white hover:bg-blue-50 text-blue-600 border-blue-200"
                }`}
              >
                Select Candidate
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <button
                onClick={() => navigate("/interview-schedule", { state: applicant })}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm hover:shadow-md"
              >
                <FaCalendarAlt />
                <span>Schedule Interview</span>
              </button>

              <button
                onClick={() => navigate("/conversations", { state: applicant })}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm hover:shadow-md"
              >
                <FaComments />
                <span>Chat</span>
              </button>
            </div>
          </div>

          {/* Double Column Workspace Layout */}
          <div className="grid lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Quick Profile Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <h2 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-100">
                Core Profile Details
              </h2>

              <div className="space-y-4">
                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FaUser size={12} className="text-slate-400" />
                    <span>Candidate Name</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{applicant.name}</p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FaBriefcase size={12} className="text-slate-400" />
                    <span>Experience Level</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{applicant.experience || "Not Available"}</p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FaMapMarkerAlt size={12} className="text-slate-400" />
                    <span>Location</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1">{applicant.location || "Not Available"}</p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FaGlobe size={12} className="text-slate-400" />
                    <span>Work Authorization</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mt-1">Authorized (Yes)</p>
                </div>

                <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FaClock size={12} className="text-slate-400" />
                    <span>Source</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-xs mt-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full inline-block">
                    {applicant.source || "Manual Upload"}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Tab Bar & Tab Content (Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tab Header bar */}
              <div className="bg-white rounded-2xl px-2 py-1.5 border border-slate-100 shadow-sm flex items-center justify-between overflow-x-auto">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === "overview"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                    <FaInfoCircle />
                    <span>Overview</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === "skills"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                  <FaStar />
                    <span>AI Analysis</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("resume")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === "resume"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                    <FaFileDownload />
                    <span>Resume View</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      activeTab === "notes"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-slate-50"
                    }`}
                  >
                    <FaStickyNote />
                    <span>Recruiter Notes</span>
                    {notesList.length > 0 && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full ${activeTab === 'notes' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {notesList.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content Panels */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
                
                {/* 1. Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/60 rounded-2xl p-5">
                      <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">AI Recommended Role</p>
                      <h3 className="text-xl md:text-2xl font-black text-indigo-950">
                        {applicant.recommended_role || "Not Available"}
                      </h3>
                      <p className="text-slate-500 text-xs mt-2">
                        Recommendation based on skills alignment, work duration, and location eligibility.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-md font-bold text-slate-800">Suitability Summary</h3>
                      <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 leading-relaxed text-sm text-slate-600">
                        {applicant.why_suitable || applicant.recommendation || "No detailed AI suitability analysis is available for this candidate yet."}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Score Category</h4>
                        <p className="text-md font-bold text-slate-700 mt-2">
                          {score >= 90 ? "🥇 Best Match" : score >= 75 ? "🥈 Strong Match" : score >= 60 ? "🥉 Moderate Match" : "Weak Match"}
                        </p>
                      </div>

                      <div className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Status</h4>
                        <p className="text-md font-bold text-slate-700 mt-2">
                          {applicant.status || "Pending Screening"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Skills Tab */}
                {activeTab === "skills" && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Skills Header */}
                    <div>
                      <h3 className="text-md font-bold text-slate-800">AI Resume Competency Mapping</h3>
                      <p className="text-xs text-slate-500 mt-1">Matched and missing skills identified during screening.</p>
                    </div>

                    {/* Matched Skills */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Matched Skills & Strengths
                      </h4>
                      {applicant.matched_skills || applicant.skills ? (
                        <div className="flex flex-wrap gap-2">
                          {(applicant.matched_skills || applicant.skills || "")
                            .split(",")
                            .filter(Boolean)
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-100 shadow-sm"
                              >
                                <FaCheck className="text-[10px]" />
                                <span>{skill.trim()}</span>
                              </span>
                            ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          No matched skills specified in screening data.
                        </div>
                      )}
                    </div>

                    {/* Missing Skills */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Missing Skills / Skills Gap
                      </h4>
                      {applicant.missing_skills ? (
                        <div className="flex flex-wrap gap-2">
                          {applicant.missing_skills
                            .split(",")
                            .filter(Boolean)
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="flex items-center gap-1.5 bg-amber-50/50 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100"
                              >
                                <span className="text-sm leading-none font-bold">&#8211;</span>
                                <span>{skill.trim()}</span>
                              </span>
                            ))}
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-600 bg-emerald-50/30 rounded-xl p-3 border border-emerald-100 flex items-center gap-2">
                          <FaCheck className="text-emerald-500" />
                          <span>Candidate possesses all key skills matched against the target role criteria!</span>
                        </div>
                      )}
                    </div>

                    {/* Overall AI Summary */}
                    {applicant.recommendation && (
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 flex items-start gap-3 mt-4">
                        <FaInfoCircle className="text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Interview Recommendation Guide</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {score >= 75
                              ? "Focus interview on advanced leadership and technical depth since the candidate has strong credentials matching the job profile."
                              : "Verify skills gap areas identified above during live discussion to assess core capabilities."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Resume Tab */}
                {activeTab === "resume" && (
                  <div className="space-y-4 h-full flex flex-col animate-fadeIn">
                    
                    {/* Resume Header Bar */}
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Document Attachment
                      </span>

                      <div className="flex items-center gap-2">
                        {applicant.resume_url && (
                          <>
                            <a
                              href={applicant.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                            >
                              <FaExternalLinkAlt size={10} />
                              <span>View Direct</span>
                            </a>
                            
                            <a
                              href={applicant.resume_url}
                              download
                              className="flex items-center gap-1.5 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                            >
                              <FaFileDownload size={10} />
                              <span>Download</span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Resume Frame */}
                    <div className="flex-1 min-h-[450px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative flex items-center justify-center">
                      {applicant.resume_url ? (
                        <iframe
                          src={applicant.resume_url}
                          title="Resume PDF Frame"
                          className="w-full h-[500px] border-none"
                        />
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto text-2xl">
                            📄
                          </div>
                          <h4 className="font-bold text-slate-800">No Resume File Provided</h4>
                          <p className="text-slate-500 text-xs max-w-sm">
                            This applicant has been added manually without uploading a resume document, or the resume link is invalid.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Notes Tab */}
                {activeTab === "notes" && (
                  <div className="space-y-6 animate-fadeIn">
                    
                    {/* Notes Creator */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Add Recruiter Comment</label>
                      <div className="relative border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 shadow-sm focus-within:shadow-md transition">
                        <textarea
                          placeholder="Type internal notes about interview performance, skills check, or salary expectations..."
                          rows="4"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full p-4 text-sm text-slate-700 outline-none resize-none bg-slate-50/30"
                        />
                        <div className="flex justify-between items-center bg-slate-50 px-4 py-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium">Notes are internal and only visible to recruitment staff.</span>
                          <button
                            onClick={saveNote}
                            disabled={savingNotes || !newNote.trim()}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-1.5 rounded-xl shadow transition disabled:bg-slate-300 disabled:shadow-none"
                          >
                            <FaSave />
                            <span>{savingNotes ? "Saving..." : "Save Note"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notes List Feed */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comment Thread ({notesList.length})</h4>
                      
                      {notesList.length === 0 ? (
                        <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                          <p className="text-sm font-semibold">No comments added yet.</p>
                          <p className="text-xs mt-1 text-slate-400">Be the first to leave a feedback note about this candidate.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {notesList.map((note) => (
                            <div key={note.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">{note.text}</p>
                                <p className="text-[10px] text-slate-400 font-bold tracking-wider">{note.date}</p>
                              </div>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="text-slate-300 hover:text-red-500 transition px-1 py-0.5 rounded"
                                title="Delete Note"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default CandidateDetails;