import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaTrash, FaTimes, FaPen } from "react-icons/fa";
import { FaSquareWhatsapp } from "react-icons/fa6";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import { supabase } from "../../../../core/lib/supabase";
import { useNotification } from "../../../../core/context/NotificationContext";

const getAvatarColor = (name = "") => {
  const colors = [
    "from-red-400 to-red-600 bg-red-500",
    "from-blue-400 to-blue-600 bg-blue-500",
    "from-green-400 to-green-600 bg-green-500",
    "from-yellow-400 to-yellow-600 bg-yellow-500",
    "from-purple-400 to-purple-600 bg-purple-500",
    "from-pink-400 to-pink-600 bg-pink-500",
    "from-indigo-400 to-indigo-600 bg-indigo-500",
    "from-teal-400 to-teal-600 bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const normalizePhone = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
};

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email) => EMAIL_FORMAT_RE.test(String(email || "").trim());

const nowISOString = () => new Date().toISOString();

// Since replies land in one shared inbox (no backend inbound-mail parser),
// this tag is how a recruiter matches a reply back to the right candidate.
const withCandidateRefTag = (subject, candidateId) =>
  candidateId ? `${subject} [Ref: ${candidateId}]` : subject;

function BulkActions() {
  const { notify, confirmDialog } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const preselect = location.state || null;
  const [preselectApplied, setPreselectApplied] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkJobFilter, setBulkJobFilter] = useState("");
  const [bulkSelected, setBulkSelected] = useState([]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkChannel, setBulkChannel] = useState("Text"); // "Text" | "Email"
  const [textDeliveryMode, setTextDeliveryMode] = useState("SMS"); // "SMS" | "WhatsApp" — only used when bulkChannel is "Text"
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkLabel, setBulkLabel] = useState("");
  const [bulkInterviewDate, setBulkInterviewDate] = useState("");
  const [bulkInterviewTime, setBulkInterviewTime] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [companySettings, setCompanySettings] = useState({
    company_name: "",
    hr_name: "",
    hr_phone: "",
    reply_to_email: "",
    email_from_name: "",
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showManageTemplatesModal, setShowManageTemplatesModal] = useState(false);
  const [manageTemplateName, setManageTemplateName] = useState("");
  const [manageTemplateBody, setManageTemplateBody] = useState("");
  const [manageTemplateSubject, setManageTemplateSubject] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [importingTemplates, setImportingTemplates] = useState(false);

  const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
  const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;

  // The actual channel a send/log uses. "Text" is just a UI grouping —
  // the WhatsApp icon toggle picks which real channel it resolves to.
  const effectiveChannel = bulkChannel === "Text" ? textDeliveryMode : bulkChannel;

  useEffect(() => {
    loadCandidates();
    fetchTemplates();
    fetchCompanySettings();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserEmail(data?.user?.email || "");
    });
  }, []);

  // Quick-action entry from Candidate Details ("Text/WhatsApp" / "Email"
  // buttons) — pre-select that one candidate and switch to the right tab
  // once the candidate list has actually loaded.
  useEffect(() => {
    if (!preselect?.preselectCandidateId || preselectApplied || candidates.length === 0) {
      return;
    }

    const candidate = candidates.find((c) => c.id === preselect.preselectCandidateId);
    setPreselectApplied(true);
    if (!candidate) return;

    const channel = preselect.channel === "Email" ? "Email" : "Text";
    setBulkChannel(channel);

    if (isReachable(candidate, channel)) {
      setBulkSelected([candidate.id]);
    } else {
      notify(
        `${candidate.name} has no ${channel === "Email" ? "email" : "phone number"} on file`,
        { type: "error" }
      );
    }
  }, [candidates]);

  const loadCandidates = async () => {
    const { data, error } = await supabase.from("applicants").select("*");

    if (error) {
      console.log(error);
      return;
    }

    setCandidates(data || []);
  };

  const createGHLContactSilent = async (candidate) => {
    const response = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: candidate.name,
        phone: candidate.phone,
        locationId: LOCATION_ID,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      const existingId = result?.meta?.contactId;
      if (existingId) return existingId;
      throw new Error(result?.message || "Failed to create contact");
    }
    return result?.contact?.id;
  };

  const sendMessageSilent = async (message, contactId, channelType = "SMS") => {
    const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: channelType,
        contactId,
        message,
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || "Message failed to send");
    }
  };

  const fetchCompanySettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("company_name, hr_name, hr_phone, reply_to_email, email_from_name")
      .eq("id", 1)
      .single();

    if (error) {
      console.log("fetchCompanySettings error:", error);
      return;
    }

    setCompanySettings({
      company_name: data?.company_name || "",
      hr_name: data?.hr_name || "",
      hr_phone: data?.hr_phone || "",
      reply_to_email: data?.reply_to_email || "",
      email_from_name: data?.email_from_name || "",
    });
  };

  // Replaces every {{Variable}} placeholder with real data for one candidate.
  // {{name}} is kept as an alias so existing SMS/WhatsApp templates still work.
  const personalizeText = (text, candidate) => {
    if (!text) return text;

    const firstName = (candidate.name || "").trim().split(/\s+/)[0] || "there";
    const lastName = (candidate.name || "").trim().split(/\s+/).slice(1).join(" ");

    const replacements = {
      "{{name}}": candidate.name || "there",
      "{{FirstName}}": firstName,
      "{{LastName}}": lastName,
      "{{FullName}}": candidate.name || "there",
      "{{Position}}": candidate.role || "open",
      "{{CompanyName}}": companySettings.company_name || "our company",
      "{{InterviewDate}}": bulkInterviewDate || "[DATE]",
      "{{InterviewTime}}": bulkInterviewTime || "[TIME]",
      "{{RecruiterName}}": companySettings.hr_name || "",
      "{{RecruiterPhone}}": companySettings.hr_phone || "",
    };

    let result = text;
    Object.entries(replacements).forEach(([token, value]) => {
      result = result.split(token).join(value);
    });
    return result;
  };

  const DEFAULT_INTERVIEW_TEMPLATE = {
    subject: "You Have Been Shortlisted for an Interview",
    body: `Hello,

Thank you for your interest in joining our team. Based on your application and qualifications, you have been shortlisted for an interview.

We would like to schedule an interview with you. Please reply to this email with your availability around the following time:

Proposed Interview Time: {{InterviewDate}} {{InterviewTime}}

Please let us know if this time works for you. If not, kindly provide a few alternative times that suit your schedule.

We look forward to speaking with you.

Thank you,
{{CompanyName}}
{{RecruiterName}}
{{RecruiterPhone}}`,
  };

  const sendEmailSilent = async (candidate, subject, body) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error("EmailJS is not configured yet (missing env keys)");
    }

    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: candidate.email,
        to_name: candidate.name,
        from_name: companySettings.email_from_name || undefined,
        subject: withCandidateRefTag(subject, candidate.id),
        message: body,
        reply_to: companySettings.reply_to_email || undefined,
      },
      { publicKey }
    );
  };

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from("sms_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("fetchTemplates error (table may not exist yet):", error);
      return;
    }

    setTemplates(data || []);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      notify("Enter a template name", { type: "error" });
      return;
    }
    if (!bulkMessage.trim()) {
      notify("Write a message before saving it as a template", { type: "error" });
      return;
    }

    setSavingTemplate(true);
    const { data, error } = await supabase
      .from("sms_templates")
      .insert([
        {
          name: newTemplateName.trim(),
          body: bulkMessage,
          subject: bulkChannel === "Email" ? bulkSubject : null,
        },
      ])
      .select()
      .single();
    setSavingTemplate(false);

    if (error) {
      notify(error.message || "Failed to save template", { type: "error" });
      return;
    }

    notify("Template saved", { type: "success" });
    setTemplates((prev) => [data, ...prev]);
    setSelectedTemplateId(String(data.id));
    setShowSaveTemplateModal(false);
    setNewTemplateName("");
  };

  const handleDeleteTemplate = async (id) => {
    const confirmed = await confirmDialog("Delete this template?", {
      danger: true,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    const { error } = await supabase.from("sms_templates").delete().eq("id", id);
    if (error) {
      notify(error.message || "Failed to delete template", { type: "error" });
      return;
    }

    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === String(id)) {
      setSelectedTemplateId("");
    }
    if (editingTemplateId === id) {
      cancelTemplateEdit();
    }
    notify("Template deleted", { type: "success" });
  };

  const startTemplateEdit = (template) => {
    setEditingTemplateId(template.id);
    setManageTemplateName(template.name || "");
    setManageTemplateSubject(template.subject || "");
    setManageTemplateBody(template.body || "");
  };

  const cancelTemplateEdit = () => {
    setEditingTemplateId(null);
    setManageTemplateName("");
    setManageTemplateSubject("");
    setManageTemplateBody("");
  };

  const handleCreateTemplateDirect = async () => {
    if (!manageTemplateName.trim()) {
      notify("Enter a template name", { type: "error" });
      return;
    }
    if (!manageTemplateBody.trim()) {
      notify("Enter the template message", { type: "error" });
      return;
    }

    setCreatingTemplate(true);

    if (editingTemplateId) {
      const { data, error } = await supabase
        .from("sms_templates")
        .update({
          name: manageTemplateName.trim(),
          body: manageTemplateBody.trim(),
          subject: manageTemplateSubject.trim() || null,
        })
        .eq("id", editingTemplateId)
        .select()
        .single();
      setCreatingTemplate(false);

      if (error) {
        notify(error.message || "Failed to update template", { type: "error" });
        return;
      }

      notify("Template updated", { type: "success" });
      setTemplates((prev) => prev.map((t) => (t.id === editingTemplateId ? data : t)));
      cancelTemplateEdit();
      setShowManageTemplatesModal(false);
      return;
    }

    const { data, error } = await supabase
      .from("sms_templates")
      .insert([
        {
          name: manageTemplateName.trim(),
          body: manageTemplateBody.trim(),
          subject: manageTemplateSubject.trim() || null,
        },
      ])
      .select()
      .single();
    setCreatingTemplate(false);

    if (error) {
      notify(error.message || "Failed to create template", { type: "error" });
      return;
    }

    notify("Template created", { type: "success" });
    setTemplates((prev) => [data, ...prev]);
    setManageTemplateName("");
    setManageTemplateBody("");
    setManageTemplateSubject("");
    setShowManageTemplatesModal(false);
  };

  const handleImportTemplates = (file) => {
    if (!file) return;

    setImportingTemplates(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data
          .map((row) => ({
            name: (row.Name || row.name || "").trim(),
            body: (
              row.Body ||
              row.body ||
              row.Message ||
              row.message ||
              ""
            ).trim(),
            subject: (row.Subject || row.subject || "").trim() || null,
          }))
          .filter((row) => row.name && row.body);

        if (rows.length === 0) {
          notify(
            "No valid rows found. CSV needs Name and Body columns.",
            { type: "error" }
          );
          setImportingTemplates(false);
          return;
        }

        const { data, error } = await supabase
          .from("sms_templates")
          .insert(rows)
          .select();

        setImportingTemplates(false);

        if (error) {
          notify(error.message || "Failed to import templates", { type: "error" });
          return;
        }

        notify(
          `${data.length} template${data.length !== 1 ? "s" : ""} imported`,
          { type: "success" }
        );
        setTemplates((prev) => [...data, ...prev]);
      },
      error: (err) => {
        setImportingTemplates(false);
        notify(err.message || "Failed to read CSV", { type: "error" });
      },
    });
  };

  // Step 1: validate, then show the confirmation modal instead of sending immediately.
  const openSendConfirmation = () => {
    if (bulkSelected.length === 0) {
      notify("Select at least one candidate", { type: "error" });
      return;
    }
    if (!bulkMessage.trim()) {
      notify("Enter a message", { type: "error" });
      return;
    }
    if (bulkChannel === "Email" && !bulkSubject.trim()) {
      notify("Enter a subject line", { type: "error" });
      return;
    }
    setShowConfirmModal(true);
  };

  // Step 2: only runs after the user explicitly confirms in the modal.
  const executeBulkSend = async () => {
    setShowConfirmModal(false);
    setBulkSending(true);
    setBulkResults(null);

    const batchId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const label = bulkLabel.trim() || bulkSubject.trim() || `Bulk ${effectiveChannel}`;

    const targets = candidates.filter(
      (c) =>
        bulkSelected.includes(c.id) &&
        (bulkChannel === "Email" ? c.email : c.phone)
    );

    const details = [];

    for (const candidate of targets) {
      const personalizedBody = personalizeText(bulkMessage, candidate);
      const personalizedSubject = personalizeText(bulkSubject, candidate);
      let status = "sent";
      let errorMessage = null;

      try {
        if (bulkChannel === "Email") {
          // Each candidate gets their own individually-addressed email —
          // no shared BCC list, so no candidate can ever see another's info.
          await sendEmailSilent(candidate, personalizedSubject, personalizedBody);
        } else {
          let contactId = candidate.contact_id;
          if (!contactId) {
            contactId = await createGHLContactSilent(candidate);
            if (contactId) {
              await supabase
                .from("applicants")
                .update({ contact_id: contactId })
                .eq("id", candidate.id);
            }
          }
          if (!contactId) throw new Error("Failed to create contact");

          await sendMessageSilent(personalizedBody, contactId, effectiveChannel);
        }
      } catch (error) {
        status = "failed";
        errorMessage = error.message;
      }

      if (status === "sent" && bulkChannel !== "Email") {
        try {
          await supabase.from("chat_messages").insert([
            {
              candidate_name: candidate.name,
              phone: candidate.phone,
              message: personalizedBody,
              sender: "hr",
              is_read: true,
              delivery_status: "sent",
            },
          ]);
        } catch (chatLogError) {
          console.log("chat_messages insert failed:", chatLogError);
        }
      }

      if (status === "sent" && bulkChannel === "Email") {
        try {
          await supabase
            .from("applicants")
            .update({
              email_status: "Interview Email Sent",
              last_email_sent_at: nowISOString(),
            })
            .eq("id", candidate.id);
        } catch (statusError) {
          console.log("applicants email_status update failed:", statusError);
        }
      }

      details.push({ candidate, status, error: errorMessage });

      try {
        await supabase.from("bulk_send_logs").insert([
          {
            batch_id: batchId,
            candidate_id: candidate.id,
            candidate_name: candidate.name,
            recipient: bulkChannel === "Email" ? candidate.email : candidate.phone,
            channel: effectiveChannel.toLowerCase(),
            status,
            error: errorMessage,
            label,
            sent_by: currentUserEmail || null,
            message: personalizedBody,
            subject: bulkChannel === "Email" ? personalizedSubject : null,
          },
        ]);
      } catch (logError) {
        console.log("bulk_send_logs insert failed (table may not exist yet):", logError);
      }
    }

    const sentCount = details.filter((d) => d.status === "sent").length;
    const failedCount = details.filter((d) => d.status === "failed").length;

    setBulkResults({ batchId, sent: sentCount, failed: failedCount, details });
    setBulkSending(false);
    setBulkLabel("");
    await loadCandidates();

    notify(
      `Bulk ${effectiveChannel} sent — ${sentCount} sent${
        failedCount > 0 ? `, ${failedCount} failed` : ""
      }`,
      {
        type: sentCount === 0 ? "error" : "success",
        duration: 8000,
        action: {
          label: "Check Send History",
          onClick: () => navigate("/bulk-actions-report"),
        },
      }
    );
  };

  const isReachable = (candidate, channel) =>
    channel === "Email" ? isValidEmail(candidate.email) : Boolean(candidate.phone);

  const handleChannelChange = (channel) => {
    setBulkChannel(channel);
    // Drop anyone who isn't reachable on the new channel so "X selected" and
    // the send always agree — they stay visible in the list, just disabled.
    setBulkSelected((prev) =>
      prev.filter((id) => {
        const candidate = candidates.find((c) => c.id === id);
        return candidate && isReachable(candidate, channel);
      })
    );
  };

  // Unique job roles for the category filter dropdown
  const jobCategories = [...new Set(
    candidates.map((c) => c.role).filter(Boolean)
  )].sort();

  // Show every candidate matching the search — never hide anyone silently.
  const bulkSearchFilteredCandidates = candidates.filter((candidate) => {
    const query = bulkSearch.toLowerCase();
    const normalizedQuery = normalizePhone(bulkSearch);

    // Job category filter — applied independently of search
    if (bulkJobFilter && candidate.role !== bulkJobFilter) return false;

    if (!query) return true;
    return (
      candidate.name?.toLowerCase().includes(query) ||
      candidate.phone?.includes(query) ||
      (normalizedQuery && normalizePhone(candidate.phone).includes(normalizedQuery)) ||
      candidate.email?.toLowerCase().includes(query)
    );
  });

  // Highest-scored first, so "Top N" always means the N best-ranked candidates.
  const rankedCandidates = [...bulkSearchFilteredCandidates].sort(
    (a, b) => (b.ai_score || b.score || 0) - (a.ai_score || a.score || 0)
  );

  // Only these can actually be selected/sent to on the current channel.
  const bulkReachableCandidates = bulkSearchFilteredCandidates.filter((c) =>
    isReachable(c, bulkChannel)
  );
  const rankedReachableCandidates = rankedCandidates.filter((c) =>
    isReachable(c, bulkChannel)
  );

  const selectTopN = (n) => {
    setBulkSelected(rankedReachableCandidates.slice(0, n).map((c) => c.id));
  };

  const selectAllShortlisted = () => {
    setBulkSelected(
      bulkReachableCandidates
        .filter((c) => c.status === "Shortlisted")
        .map((c) => c.id)
    );
  };

  const selectedCandidateObjects = candidates.filter((c) => bulkSelected.includes(c.id));

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#f8f9fa]">
      <div className="px-6 py-5 border-b border-slate-200 bg-white flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Bulk Send
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Send SMS, WhatsApp, or Email to multiple candidates at once.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Candidate Selection */}
        <div className="w-full md:w-[360px] border-r border-[#e9edef] bg-white flex flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-[#e9edef]">
            <h2 className="font-semibold text-[#111b21] mb-3">Select Candidates</h2>
            <input
              type="text"
              placeholder="Search candidates..."
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
              className="w-full bg-[#f0f2f5] px-3 py-2 rounded-lg text-sm outline-none"
            />
          </div>

          <div className="px-4 py-2.5 border-b border-[#e9edef] flex-shrink-0">
            <select
              value={bulkJobFilter}
              onChange={(e) => {
                setBulkJobFilter(e.target.value);
                setBulkSelected([]); // clear selection when category changes
              }}
              className="w-full bg-[#f0f2f5] px-3 py-2 rounded-lg text-sm outline-none text-[#111b21]"
            >
              <option value="">All Job Categories ({candidates.length})</option>
              {jobCategories.map((role) => {
                const count = candidates.filter((c) => c.role === role).length;
                return (
                  <option key={role} value={role}>
                    {role} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="px-4 py-2.5 border-b border-[#e9edef] flex items-center justify-between flex-shrink-0">
            <label className="flex items-center gap-2 text-sm text-[#54656f] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={
                  bulkReachableCandidates.length > 0 &&
                  bulkSelected.length === bulkReachableCandidates.length
                }
                onChange={(e) =>
                  setBulkSelected(
                    e.target.checked
                      ? bulkReachableCandidates.map((c) => c.id)
                      : []
                  )
                }
              />
              Select All ({bulkReachableCandidates.length})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#00a884]">
                {bulkSelected.length} selected
              </span>
              {bulkSelected.length > 0 && (
                <button
                  onClick={() => setBulkSelected([])}
                  className="text-xs font-semibold text-red-500 hover:underline"
                >
                  Deselect All
                </button>
              )}
            </div>
          </div>

          <div className="px-4 py-2.5 border-b border-[#e9edef] flex flex-wrap gap-1.5 flex-shrink-0">
            {[5, 10, 25, 50, 100].map((n) => (
              <button
                key={n}
                onClick={() => selectTopN(n)}
                className="text-xs font-semibold bg-[#f0f2f5] hover:bg-gray-200 text-[#111b21] px-2.5 py-1 rounded-full transition-colors"
              >
                Top {n}
              </button>
            ))}
            <button
              onClick={selectAllShortlisted}
              className="text-xs font-semibold bg-[#f0f2f5] hover:bg-gray-200 text-[#111b21] px-2.5 py-1 rounded-full transition-colors"
            >
              All Shortlisted
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {bulkSearchFilteredCandidates.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                No candidates found
              </p>
            ) : (
              rankedCandidates.map((candidate, index) => {
                const reachable = isReachable(candidate, bulkChannel);
                return (
                  <label
                    key={candidate.id}
                    className={`flex items-center gap-3 p-3 border-b border-[#f0f2f5] ${
                      reachable
                        ? "cursor-pointer hover:bg-[#f5f6f6]"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!reachable}
                      checked={bulkSelected.includes(candidate.id)}
                      onChange={() => {
                        if (!reachable) return;
                        setBulkSelected((prev) =>
                          prev.includes(candidate.id)
                            ? prev.filter((id) => id !== candidate.id)
                            : [...prev, candidate.id]
                        );
                      }}
                    />
                    <span className="text-[10px] font-bold text-gray-400 w-5 flex-shrink-0 text-center">
                      #{index + 1}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarColor(
                        candidate.name
                      )} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {candidate.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#111b21] truncate">
                        {candidate.name}
                      </p>
                      {reachable ? (
                        <p className="text-xs text-[#667781] truncate">
                          {bulkChannel === "Email" ? candidate.email : candidate.phone}
                        </p>
                      ) : (
                        <p className="text-xs text-red-400 italic truncate">
                          {bulkChannel === "Email"
                            ? candidate.email
                              ? "Invalid email address"
                              : "No email on file"
                            : "No phone number on file"}
                        </p>
                      )}
                    </div>
                    {bulkChannel === "Email" && candidate.email_status && (
                      <span
                        title={
                          candidate.last_email_sent_at
                            ? `Sent ${new Date(candidate.last_email_sent_at).toLocaleString()}`
                            : "Interview email already sent"
                        }
                        className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex-shrink-0"
                      >
                        ✉ Sent
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Compose + Results + History */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6">
          <div className="max-w-3xl">
            <h2 className="text-lg font-bold text-[#111b21] mb-1">
              Bulk {effectiveChannel}
            </h2>
            <p className="text-sm text-[#667781] mb-4">
              {bulkChannel === "Email"
                ? "Sends a private, individually-addressed email to every selected candidate — no candidate ever sees another's name or address."
                : `Sends a ${effectiveChannel === "WhatsApp" ? "WhatsApp message" : "an SMS"} to every selected candidate. Use the WhatsApp icon next to Send to switch delivery mode.`}{" "}
              Use <code className="bg-gray-100 px-1 rounded">{"{{FirstName}}"}</code>{" "}
              and similar variables to personalize.
            </p>

            <div className="flex items-center gap-1 mb-4 bg-[#f0f2f5] p-1 rounded-lg w-fit">
              <button
                onClick={() => handleChannelChange("Text")}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  bulkChannel === "Text"
                    ? "bg-white text-[#111b21] shadow-sm"
                    : "text-[#54656f] hover:text-[#111b21]"
                }`}
              >
                Text (SMS/WhatsApp)
              </button>
              <button
                onClick={() => handleChannelChange("Email")}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  bulkChannel === "Email"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-[#54656f] hover:text-[#111b21]"
                }`}
              >
                Email
              </button>
            </div>

            <input
              type="text"
              value={bulkLabel}
              onChange={(e) => setBulkLabel(e.target.value)}
              placeholder="Action label (optional, shown in Send History)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-3"
            />

            {/* Fixed core compose box — identical position on every tab.
                Subject is the only field that appears/disappears here. */}
            <div className="flex items-center gap-2 mb-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedTemplateId(id);
                  const tpl = templates.find((t) => String(t.id) === id);
                  if (tpl) {
                    setBulkMessage(tpl.body);
                    if (bulkChannel === "Email") setBulkSubject(tpl.subject || "");
                  }
                }}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none bg-white"
              >
                <option value="">Use a saved template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {selectedTemplateId && (
                <button
                  onClick={() => handleDeleteTemplate(Number(selectedTemplateId))}
                  title="Delete template"
                  className="text-red-400 hover:text-red-600 p-2 flex-shrink-0"
                >
                  <FaTrash size={14} />
                </button>
              )}
              <button
                onClick={() => setShowManageTemplatesModal(true)}
                className="text-sm font-semibold text-[#00a884] hover:underline flex-shrink-0 whitespace-nowrap"
              >
                Manage Templates
              </button>
            </div>

            {bulkChannel === "Email" && (
              <input
                type="text"
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="Subject"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-2 focus:border-blue-400"
              />
            )}

            <textarea
              value={bulkMessage}
              onChange={(e) => setBulkMessage(e.target.value)}
              placeholder={
                bulkChannel === "Email" ? "Hi {{FirstName}}, ..." : "Hi {{name}}, ..."
              }
              rows={8}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#25d366] resize-none"
            />

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setShowSaveTemplateModal(true)}
                disabled={!bulkMessage.trim()}
                className="text-sm font-semibold text-[#00a884] hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                Save as Template
              </button>
              <button
                onClick={() => {
                  setBulkSubject("");
                  setBulkMessage("");
                  setSelectedTemplateId("");
                }}
                disabled={!bulkSubject.trim() && !bulkMessage.trim()}
                className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
            {/* End fixed core compose box */}

            {/* Channel-specific extras — always below the compose box, never
                shift its position when switching SMS/WhatsApp/Email. */}
            {bulkChannel === "Email" && (
              <button
                onClick={() => {
                  setSelectedTemplateId("");
                  setBulkSubject(DEFAULT_INTERVIEW_TEMPLATE.subject);
                  setBulkMessage(DEFAULT_INTERVIEW_TEMPLATE.body);
                }}
                className="text-sm font-semibold text-blue-600 hover:underline mt-3 block"
              >
                Load Default Interview Template
              </button>
            )}

            {bulkChannel === "Email" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <input
                  type="text"
                  value={bulkInterviewDate}
                  onChange={(e) => setBulkInterviewDate(e.target.value)}
                  placeholder="Proposed Interview Date (e.g. Mon, Nov 24)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
                <input
                  type="text"
                  value={bulkInterviewTime}
                  onChange={(e) => setBulkInterviewTime(e.target.value)}
                  placeholder="Proposed Interview Time (e.g. 2:00 PM)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
                />
              </div>
            )}

            {effectiveChannel === "WhatsApp" && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                This only works once a WhatsApp Business number is connected to your
                GoHighLevel location. If it isn't connected yet, sends will show up as
                failed below.
              </p>
            )}

            {bulkChannel === "Email" && !import.meta.env.VITE_EMAILJS_PUBLIC_KEY && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                Email isn't configured yet — add VITE_EMAILJS_SERVICE_ID,
                VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY to your .env file.
                Sends will show up as failed below until then.
              </p>
            )}

            {bulkChannel === "Email" && (
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-3">
                Each email gets a <code className="bg-white px-1 rounded">[Ref: id]</code>{" "}
                tag appended to its subject so a candidate's reply can be matched back to
                them. Set a Reply-To address in Settings, and make sure your EmailJS
                template's "Reply To" field is set to{" "}
                <code className="bg-white px-1 rounded">{"{{reply_to}}"}</code>.
              </p>
            )}

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-[#667781]">
                {bulkSelected.length} candidate
                {bulkSelected.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex items-center gap-2">
                {bulkChannel === "Text" && (
                  <button
                    onClick={() =>
                      setTextDeliveryMode((prev) =>
                        prev === "WhatsApp" ? "SMS" : "WhatsApp"
                      )
                    }
                    title={
                      textDeliveryMode === "WhatsApp"
                        ? "Sending via WhatsApp — click to switch to SMS"
                        : "Sending via SMS — click to switch to WhatsApp"
                    }
                    className={`flex-shrink-0 rounded-xl transition-all ${
                      textDeliveryMode === "WhatsApp"
                        ? "ring-2 ring-[#25d366] ring-offset-1"
                        : ""
                    }`}
                  >
                    <FaSquareWhatsapp size={34} className="text-[#25d366]" />
                  </button>
                )}
                <button
                  onClick={openSendConfirmation}
                  disabled={
                    bulkSending ||
                    bulkSelected.length === 0 ||
                    !bulkMessage.trim() ||
                    (bulkChannel === "Email" && !bulkSubject.trim())
                  }
                  className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  {bulkSending ? "Sending..." : `Send Bulk ${effectiveChannel}`}
                </button>
              </div>
            </div>

            {bulkResults && (
              <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[#111b21]">Results</h3>
                  <p className="text-sm">
                    <span className="text-green-600 font-bold">
                      {bulkResults.sent} sent
                    </span>
                    {bulkResults.failed > 0 && (
                      <span className="text-red-500 font-bold ml-3">
                        {bulkResults.failed} failed
                      </span>
                    )}
                  </p>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                  {bulkResults.details.map((r) => (
                    <div
                      key={r.candidate.id}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-[#111b21]">{r.candidate.name}</span>
                      {r.status === "sent" ? (
                        <span className="text-green-600 font-semibold">✓ Sent</span>
                      ) : (
                        <span
                          className="text-red-500 font-semibold"
                          title={r.error || "Failed"}
                        >
                          ✕ Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {bulkResults.failed > 0 && (
                  <button
                    onClick={() => {
                      setBulkSelected(
                        bulkResults.details
                          .filter((r) => r.status === "failed")
                          .map((r) => r.candidate.id)
                      );
                      setBulkResults(null);
                    }}
                    className="mt-3 text-sm font-semibold text-red-500 hover:underline"
                  >
                    Retry Failed ({bulkResults.failed})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Send Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-[#111b21]">
                  Confirm Bulk {effectiveChannel}
                </h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <p className="text-sm text-gray-600">
                  You're about to send to{" "}
                  <span className="font-semibold text-[#111b21]">
                    {selectedCandidateObjects.length} candidate
                    {selectedCandidateObjects.length !== 1 ? "s" : ""}
                  </span>{" "}
                  over <span className="font-semibold">{effectiveChannel}</span>. Review the
                  list before sending.
                </p>

                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {selectedCandidateObjects.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span className="text-[#111b21]">{candidate.name}</span>
                      <span className="text-gray-500">
                        {bulkChannel === "Email" ? candidate.email : candidate.phone}
                      </span>
                    </div>
                  ))}
                </div>

                {bulkChannel === "Email" && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Subject</p>
                    <p className="text-sm text-[#111b21] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      {bulkSubject}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Message</p>
                  <p className="text-sm text-[#111b21] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {bulkMessage}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBulkSend}
                  className="px-4 py-2 bg-[#25d366] hover:bg-[#20bd5a] text-white rounded-lg text-sm font-semibold"
                >
                  Confirm &amp; Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save as Template Modal */}
        {showSaveTemplateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-96 rounded-xl shadow-xl p-5">
              <h3 className="font-semibold text-[#111b21] mb-3">Save as Template</h3>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(false);
                    setNewTemplateName("");
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="px-4 py-2 bg-[#25d366] text-white rounded-lg text-sm disabled:opacity-60"
                >
                  {savingTemplate ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manage Templates Modal */}
        {showManageTemplatesModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <h3 className="font-semibold text-[#111b21]">Manage Templates</h3>
                <button
                  onClick={() => {
                    cancelTemplateEdit();
                    setShowManageTemplatesModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* Create / edit template */}
                <div>
                  <h4 className="text-sm font-semibold text-[#111b21] mb-2">
                    {editingTemplateId ? "Edit Template" : "New Template"}
                  </h4>
                  <input
                    type="text"
                    value={manageTemplateName}
                    onChange={(e) => setManageTemplateName(e.target.value)}
                    placeholder="Template name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-2"
                  />
                  <input
                    type="text"
                    value={manageTemplateSubject}
                    onChange={(e) => setManageTemplateSubject(e.target.value)}
                    placeholder="Subject (optional, used for Email)"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-2"
                  />
                  <textarea
                    value={manageTemplateBody}
                    onChange={(e) => setManageTemplateBody(e.target.value)}
                    placeholder="Hi {{name}}, ..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none resize-none mb-2"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCreateTemplateDirect}
                      disabled={creatingTemplate}
                      className="bg-[#25d366] hover:bg-[#20bd5a] disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      {creatingTemplate
                        ? editingTemplateId
                          ? "Saving..."
                          : "Creating..."
                        : editingTemplateId
                        ? "Save Changes"
                        : "Create Template"}
                    </button>
                    {editingTemplateId && (
                      <button
                        onClick={cancelTemplateEdit}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Import from CSV */}
                <div className="border-t border-gray-100 pt-5">
                  <h4 className="text-sm font-semibold text-[#111b21] mb-1">
                    Import from CSV
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    CSV needs a <code className="bg-gray-100 px-1 rounded">Name</code>{" "}
                    column and a <code className="bg-gray-100 px-1 rounded">Body</code>{" "}
                    column, plus an optional{" "}
                    <code className="bg-gray-100 px-1 rounded">Subject</code> column
                    (used for Email). Every valid row becomes a template.
                  </p>
                  <input
                    type="file"
                    id="templateCsvUpload"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      handleImportTemplates(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor="templateCsvUpload"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
                      importingTemplates
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-100 hover:bg-gray-200 text-[#111b21]"
                    }`}
                  >
                    {importingTemplates ? "Importing..." : "Choose CSV File"}
                  </label>
                </div>

                {/* Existing templates */}
                <div className="border-t border-gray-100 pt-5">
                  <h4 className="text-sm font-semibold text-[#111b21] mb-2">
                    Saved Templates ({templates.length})
                  </h4>
                  {templates.length === 0 ? (
                    <p className="text-sm text-gray-400">No templates yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start justify-between gap-3 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#111b21] truncate">
                              {t.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{t.body}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => startTemplateEdit(t)}
                              title="Edit template"
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <FaPen size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              title="Delete template"
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <FaTrash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BulkActions;
