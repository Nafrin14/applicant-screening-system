import React, { useState, useEffect } from "react";
import { supabase } from "../../../../core/lib/supabase";
import { useNotification } from "../../../../core/context/NotificationContext";

import {
  FaShieldAlt,
  FaUserCircle,
  FaSave,
  FaCamera,
  FaBell,
  FaPaperPlane,
  FaEnvelopeOpenText,
  FaSyncAlt,
  FaRobot,
} from "react-icons/fa";

const AI_MODEL_OPTIONS = [
  { value: "groq", label: "Groq — Llama 3.1 8B (active)" },
  { value: "anthropic", label: "Anthropic — Claude (coming soon)" },
  { value: "gemini", label: "Google — Gemini (coming soon)" },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

const formatRelativeTime = (isoString) => {
  if (!isoString) return "Never";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.round(diffHr / 24)} day(s) ago`;
};

function Settings() {
  const { notify } = useNotification();
  const [companyName, setCompanyName] = useState("SmartHire");
  const [hrRole, setHrRole] = useState("HR Manager");
  const [hrPhone, setHrPhone] = useState("");
  const [replyToEmail, setReplyToEmail] = useState("");
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [notifyInterviewReminders, setNotifyInterviewReminders] = useState(true);
  const [notifyMailReplies, setNotifyMailReplies] = useState(true);
  const [emailFromName, setEmailFromName] = useState("");
  const [aiModel, setAiModel] = useState("groq");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchSyncStatus();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setCompanyName(data.company_name);
      setHrRole(data.hr_name);
      setHrPhone(data.hr_phone || "");
      setReplyToEmail(data.reply_to_email || "");
      setEmail(data.email);
      setProfileImage(data.profile_image || "");
      setNotifyInterviewReminders(data.notify_interview_reminders ?? true);
      setNotifyMailReplies(data.notify_mail_replies ?? true);
      setEmailFromName(data.email_from_name || "");
      setAiModel(data.ai_model || "groq");
    }
    console.log("FETCH DATA:", data);
    console.log("FETCH ERROR:", error);
  };

  const fetchSyncStatus = async () => {
    const { data, error } = await supabase
      .from("sync_status")
      .select("last_synced_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.log("fetchSyncStatus error (table may not exist yet):", error);
      return;
    }

    setLastSyncedAt(data?.last_synced_at || null);
  };

  const handleSave = async () => {
    setSaving(true);

    const { data, error } = await supabase
      .from("settings")
      .update({
        company_name: companyName,
        hr_name: hrRole,
        hr_phone: hrPhone,
        reply_to_email: replyToEmail,
        profile_image: profileImage,
        notify_interview_reminders: notifyInterviewReminders,
        notify_mail_replies: notifyMailReplies,
        email_from_name: emailFromName,
        ai_model: aiModel,
      })
      .eq("id", 1)
      .select();

    setSaving(false);
    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (error) {
      notify("Update Failed", { type: "error" });
      console.log(error);
    } else {
      notify("Settings Updated Successfully", { type: "success" });
      fetchSettings();
    }
  };

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      notify("Passwords do not match", { type: "error" });
      return;
    }

    if (newPassword.length < 8) {
      notify("Password must be at least 8 characters", { type: "error" });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      notify(error.message, { type: "error" });
    } else {
      notify("Password Updated Successfully", { type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail) {
      notify("Please enter a new email", { type: "error" });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      notify(error.message, { type: "error" });
    } else {
      notify(
        "Verification email sent. Please check your new email inbox.",
        { type: "success" }
      );
      setNewEmail("");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-images")
      .upload(fileName, file);

    if (uploadError) {
      notify(uploadError.message, { type: "error" });
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-images").getPublicUrl(fileName);
    setProfileImage(publicUrl);

    const { error: updateError } = await supabase
      .from("settings")
      .update({
        profile_image: publicUrl,
      })
      .eq("id", 1);

    if (updateError) {
      console.log(updateError);
      notify(updateError.message, { type: "error" });
    } else {
      notify("Profile image updated successfully", { type: "success" });
    }
  };

  return (
    <div className="p-4 md:p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-gray-500 text-sm">
          Manage your account and system settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Company & Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col items-center text-center sm:text-left sm:items-start gap-4 mb-6">
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                profileImage ? "" : "bg-blue-100"
              }`}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="block w-full h-full max-w-full max-h-full object-cover"
                />
              ) : (
                <FaUserCircle className="text-5xl text-blue-600" />
              )}
            </div>

            <div className="w-full">
              <h2 className="text-2xl font-black text-slate-800">
                Company & Profile
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Update company and HR details
              </p>

              <input
                type="file"
                id="profileImageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="profileImageUpload"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <FaCamera /> Change Photo
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Company Name">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <Field label="Admin Name">
              <input
                type="text"
                value={hrRole}
                onChange={(e) => setHrRole(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <Field label="Recruiter Phone (used in bulk emails)">
              <input
                type="tel"
                value={hrPhone}
                onChange={(e) => setHrPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <Field label="Reply-To Email (for bulk interview emails)">
              <input
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>
          </div>
        </div>

        {/* Change Email */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm h-fit">
          <h2 className="text-2xl font-black text-slate-800">Change Email</h2>
          <p className="text-gray-500 text-sm mt-1 mb-5">
            Update the email you log in with
          </p>

          <div className="space-y-4">
            <Field label="Current Email">
              <input
                type="email"
                value={email}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 outline-none cursor-not-allowed"
              />
            </Field>

            <Field label="New Email">
              <input
                type="email"
                placeholder="new-email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <button
              onClick={handleEmailUpdate}
              className="inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white transition-all px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 w-fit"
            >
              Update Email
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <FaShieldAlt className="text-red-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Security</h2>
              <p className="text-gray-500 text-sm">Password protection</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="New Password">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <Field label="Confirm Password">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
            </Field>

            <p className="text-xs text-slate-500">
              Password must contain at least 8 characters.
            </p>

            <button
              onClick={handlePasswordUpdate}
              className="inline-flex items-center gap-2 text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white transition-all px-6 py-2.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 w-fit"
            >
              Update Password
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <FaBell className="text-amber-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Notifications
              </h2>
              <p className="text-gray-500 text-sm">
                Choose what shows up in the bell icon
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <Toggle
              checked={notifyInterviewReminders}
              onChange={setNotifyInterviewReminders}
              label="Interview Reminders"
              description="Alert when a scheduled interview is starting soon"
            />
            <Toggle
              checked={notifyMailReplies}
              onChange={setNotifyMailReplies}
              label="Mail Reply Alerts"
              description="Alert when a candidate replies to a bulk email"
            />
          </div>
        </div>

        {/* AI Screening */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <FaRobot className="text-purple-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                AI Screening
              </h2>
              <p className="text-gray-500 text-sm">
                Which model scores uploaded resumes
              </p>
            </div>
          </div>

          <Field label="AI Model">
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
            >
              {AI_MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-slate-500 mt-2">
            Only Groq is wired up to the screening backend right now — the
            other options are saved but don't take effect yet.
          </p>
        </div>

        {/* Email Sending */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm h-fit lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <FaPaperPlane className="text-indigo-500 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">
                Email Sending
              </h2>
              <p className="text-gray-500 text-sm">
                Controls how bulk emails identify themselves to candidates
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <Field label="From Name (shown to candidates as the sender)">
              <input
                type="text"
                placeholder="e.g. KD Marketing Recruitment"
                value={emailFromName}
                onChange={(e) => setEmailFromName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                Also set your EmailJS template's "From Name" field to{" "}
                <code className="bg-slate-100 px-1 rounded">
                  {"{{from_name}}"}
                </code>{" "}
                for this to take effect.
              </p>
            </Field>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4">
              <FaEnvelopeOpenText className="text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  Mail Inbox Sync
                </p>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                  <FaSyncAlt className="text-[10px] text-slate-400" />
                  Last synced {formatRelativeTime(lastSyncedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-4 rounded-2xl font-semibold shadow-lg hover:scale-[1.01] transition-all"
      >
        <FaSave />
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
export default Settings;
