import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaEnvelope, FaLink, FaPaperPlane, FaTimes, FaInbox, FaChevronLeft } from "react-icons/fa";
import emailjs from "@emailjs/browser";
import { supabase } from "../../../../core/lib/supabase";
import { useNotification } from "../../../../core/context/NotificationContext";

// ─── helpers ────────────────────────────────────────────────────────────────

const getAvatarColor = (name = "") => {
  const colors = [
    "bg-blue-500", "bg-purple-500", "bg-green-500",
    "bg-red-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

const formatTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ─── component ──────────────────────────────────────────────────────────────

function MailInbox() {
  const { notify } = useNotification();
  const bottomRef = useRef(null);
  const location = useLocation();
  const openReplyId = location.state?.openReplyId || null;

  const [incomingMails, setIncomingMails] = useState([]);   // email_replies
  const [outgoingMails, setOutgoingMails] = useState([]);   // bulk_send_logs (email only)
  const [candidates, setCandidates] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [autoOpenApplied, setAutoOpenApplied] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedThread, setSelectedThread] = useState(null); // { email, name, candidateId }

  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchAll();

    // ── Supabase Realtime ──────────────────────────────────────────────
    // Fires instantly when pollMail.js inserts a new row into email_replies
    const channel = supabase
      .channel("mail-inbox-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "email_replies" },
        () => {
          fetchIncoming();
        }
      )
      .subscribe();

    // ── 30-second fallback poll ────────────────────────────────────────
    // Catches any updates that Realtime might miss (e.g. tab was in background)
    const interval = setInterval(() => {
      fetchIncoming();
      fetchOutgoing();
    }, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Scroll to bottom when thread opens or new message arrives
  useEffect(() => {
    if (selectedThread) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [selectedThread, incomingMails, outgoingMails]);

  const fetchAll = async () => {
    await Promise.all([fetchIncoming(), fetchOutgoing(), fetchCandidates(), fetchSettings()]);
  };

  const fetchIncoming = async () => {
    const { data, error } = await supabase
      .from("email_replies")
      .select("*, applicants(name)")
      .order("received_at", { ascending: true })
      .limit(1000);
    if (error) { console.log("fetchIncoming error:", error); return; }
    setIncomingMails(data || []);
  };

  const fetchOutgoing = async () => {
    const { data, error } = await supabase
      .from("bulk_send_logs")
      .select("*")
      .eq("channel", "email")
      .eq("status", "sent")
      .order("sent_at", { ascending: true })
      .limit(1000);
    if (error) { console.log("fetchOutgoing error:", error); return; }
    setOutgoingMails(data || []);
  };

  const fetchCandidates = async () => {
    const { data } = await supabase.from("applicants").select("id, name");
    setCandidates(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    if (data) setCompanySettings(data);
  };

  // ── Build thread list ───────────────────────────────────────────────────

  // Group all messages by from_email / recipient into threads
  const threadMap = {};

  incomingMails.forEach((m) => {
    const email = m.from_email?.toLowerCase() || "unknown";
    if (!threadMap[email]) {
      threadMap[email] = {
        email,
        name: m.applicants?.name || m.from_name || m.from_email,
        candidateId: m.candidate_id,
        messages: [],
        lastAt: m.received_at,
        unread: 0,
      };
    }
    threadMap[email].messages.push({ ...m, direction: "incoming", at: m.received_at });
    if (!m.is_read) threadMap[email].unread += 1;
    if (m.received_at > threadMap[email].lastAt) threadMap[email].lastAt = m.received_at;
  });

  outgoingMails.forEach((m) => {
    const email = m.recipient?.toLowerCase() || "unknown";
    if (!threadMap[email]) {
      threadMap[email] = {
        email,
        name: m.candidate_name || m.recipient,
        candidateId: m.candidate_id,
        messages: [],
        lastAt: m.sent_at,
        unread: 0,
      };
    }
    threadMap[email].messages.push({ ...m, direction: "outgoing", at: m.sent_at });
    if (m.sent_at > threadMap[email].lastAt) threadMap[email].lastAt = m.sent_at;
  });

  // Sort messages within each thread by time
  Object.values(threadMap).forEach((t) => {
    t.messages.sort((a, b) => new Date(a.at) - new Date(b.at));
  });

  const threads = Object.values(threadMap).sort(
    (a, b) => new Date(b.lastAt) - new Date(a.lastAt)
  );

  // Filter threads by search
  const filteredThreads = threads.filter((t) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      t.email.includes(q) ||
      t.name?.toLowerCase().includes(q)
    );
  });

  // Active thread messages
  const activeThread = selectedThread
    ? threadMap[selectedThread.email]
    : null;

  // Quick-action entry from the notification bell ("Mail Reply" click) —
  // resolve which thread that reply belongs to during render (not inside
  // the effect below, since threadMap gets mutated after being built).
  const targetMail = openReplyId
    ? incomingMails.find((m) => m.id === openReplyId)
    : null;
  const targetThread = targetMail
    ? threadMap[targetMail.from_email?.toLowerCase() || "unknown"]
    : null;

  useEffect(() => {
    if (!openReplyId || autoOpenApplied || incomingMails.length === 0) return;
    setAutoOpenApplied(true);
    if (targetThread) {
      setSelectedThread(targetThread);
      markThreadRead(targetThread.email);
    }
  }, [incomingMails]);

  // ── Link to candidate ───────────────────────────────────────────────────

  const linkToCandidate = async (candidateId) => {
    if (!activeThread) return;
    // Update all incoming mails from this email address
    const ids = incomingMails
      .filter((m) => m.from_email?.toLowerCase() === activeThread.email)
      .map((m) => m.id);

    for (const id of ids) {
      await supabase
        .from("email_replies")
        .update({ candidate_id: candidateId })
        .eq("id", id);
    }
    notify("Linked to candidate", { type: "success" });
    await fetchIncoming();
    setSelectedThread((prev) => ({ ...prev, candidateId }));
  };

  // ── Mark thread as read ─────────────────────────────────────────────────

  const markThreadRead = async (emailAddr) => {
    const unreadIds = incomingMails
      .filter((m) => m.from_email?.toLowerCase() === emailAddr && !m.is_read)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from("email_replies").update({ is_read: true }).in("id", unreadIds);
    setIncomingMails((prev) =>
      prev.map((m) =>
        unreadIds.includes(m.id) ? { ...m, is_read: true } : m
      )
    );
  };

  // ── Send reply ──────────────────────────────────────────────────────────

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      notify("EmailJS is not configured. Add VITE_EMAILJS_* keys to .env", { type: "error" });
      return;
    }

    const lastIncoming = [...activeThread.messages]
      .reverse()
      .find((m) => m.direction === "incoming");

    const replySubject = lastIncoming?.subject?.startsWith("Re:")
      ? lastIncoming.subject
      : `Re: ${lastIncoming?.subject || ""}`;

    const messageBody = replyText.trim();
    setSending(true);

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: activeThread.email,
          to_name: activeThread.name,
          subject: replySubject,
          message: messageBody,
          from_name: companySettings?.company_name || "Recruiting Team",
          reply_to: companySettings?.reply_to_email || undefined,
        },
        { publicKey }
      );

      // Log to bulk_send_logs
      const { data: userData } = await supabase.auth.getUser();
      const batchId = `reply-${Date.now()}`;
      await supabase.from("bulk_send_logs").insert([
        {
          batch_id: batchId,
          candidate_id: activeThread.candidateId || null,
          candidate_name: activeThread.name,
          recipient: activeThread.email,
          channel: "email",
          status: "sent",
          label: `Reply: ${replySubject}`,
          sent_by: userData?.user?.email || null,
          message: messageBody,
          subject: replySubject,
          sent_at: new Date().toISOString(),
        },
      ]);

      setReplyText("");
      await fetchOutgoing();
      notify(`Reply sent to ${activeThread.email}`, { type: "success" });
    } catch (err) {
      console.error("Reply send error:", err);
      notify(err?.text || "Failed to send reply", { type: "error" });
    } finally {
      setSending(false);
    }
  };

  // ── UI ──────────────────────────────────────────────────────────────────

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-[#f8f9fa]">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center gap-3 flex-shrink-0">
        {selectedThread && (
          <button
            onClick={() => { setSelectedThread(null); setReplyText(""); }}
            className="md:hidden text-gray-500 hover:text-gray-800 mr-1"
          >
            <FaChevronLeft />
          </button>
        )}
        <div className="flex-1 min-w-0">
          {selectedThread ? (
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(activeThread?.name || "")}`}>
                {initials(activeThread?.name || "")}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[#111b21] text-sm truncate">{activeThread?.name}</p>
                <p className="text-xs text-gray-400 truncate">{activeThread?.email}</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                Mail Inbox
                {totalUnread > 0 && (
                  <span className="text-sm font-bold bg-blue-600 text-white rounded-full px-2 py-0.5">
                    {totalUnread}
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">Synced every 5 minutes</p>
            </div>
          )}
        </div>

        {/* Link to candidate — shown when thread open & unmatched */}
        {selectedThread && !activeThread?.candidateId && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <FaLink className="text-gray-400" size={11} />
            <select
              defaultValue=""
              onChange={(e) => e.target.value && linkToCandidate(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none bg-white"
            >
              <option value="">Link candidate...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Thread list (left panel) ── */}
        <div className={`${selectedThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-[320px] border-r border-[#e9edef] bg-white flex-shrink-0`}>
          <div className="p-3 border-b border-[#e9edef]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#f0f2f5] px-3 py-2 rounded-lg text-sm outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 p-8">
                <FaInbox size={32} className="opacity-30" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const lastMsg = thread.messages[thread.messages.length - 1];
                const isActive = selectedThread?.email === thread.email;
                const isOutgoing = lastMsg?.direction === "outgoing";

                return (
                  <button
                    key={thread.email}
                    onClick={() => {
                      setSelectedThread(thread);
                      setReplyText("");
                      markThreadRead(thread.email);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-[#f0f2f5] flex items-start gap-3 transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-[#f5f6f6]"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold ${getAvatarColor(thread.name)}`}>
                      {initials(thread.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-sm truncate ${thread.unread > 0 ? "font-bold text-[#111b21]" : "text-gray-700"}`}>
                          {thread.name}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatTime(thread.lastAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={`text-xs truncate ${thread.unread > 0 ? "text-gray-700" : "text-gray-400"}`}>
                          {isOutgoing && <span className="text-blue-500 mr-1">You:</span>}
                          {lastMsg?.body_text || lastMsg?.message || "—"}
                        </p>
                        {thread.unread > 0 && (
                          <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Conversation panel (right) ── */}
        <div className={`${selectedThread ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0`}>
          {!selectedThread ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <FaEnvelope size={48} className="opacity-20" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {activeThread?.messages.map((msg, i) => {
                  const isOut = msg.direction === "outgoing";
                  const text = msg.body_text || msg.message || "";

                  return (
                    <div key={i} className={`flex ${isOut ? "justify-end" : "justify-start"}`}>
                      {/* Avatar for incoming */}
                      {!isOut && (
                        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 ${getAvatarColor(activeThread.name)}`}>
                          {initials(activeThread.name)}
                        </div>
                      )}

                      <div className={`max-w-[70%] ${isOut ? "items-end" : "items-start"} flex flex-col`}>
                        {/* Bubble */}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
                          isOut
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white text-[#111b21] border border-gray-100 rounded-bl-md"
                        }`}>
                          {text || <span className="opacity-50 italic">(empty)</span>}
                        </div>

                        {/* Subject tag */}
                        {msg.subject && (
                          <p className="text-[10px] text-gray-400 mt-0.5 px-1 truncate max-w-full">
                            {msg.subject}
                          </p>
                        )}

                        {/* Time + direction label */}
                        <p className={`text-[10px] mt-0.5 px-1 ${isOut ? "text-blue-400" : "text-gray-400"}`}>
                          {isOut ? "You · " : ""}{formatTime(msg.at)}
                        </p>
                      </div>

                      {/* Avatar for outgoing */}
                      {isOut && (
                        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-600 text-white text-xs font-bold ml-2 mt-1">
                          {initials(companySettings?.company_name || "Me")}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-gray-200 bg-white px-4 py-3 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSendReply();
                    }}
                    rows={2}
                    placeholder="Type a reply... (Ctrl+Enter to send)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none bg-[#f0f2f5] resize-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
                    title="Send (Ctrl+Enter)"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FaPaperPlane size={13} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MailInbox;
