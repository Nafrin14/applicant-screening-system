import React, { useEffect, useState } from "react";
import { FaEnvelope, FaEnvelopeOpen, FaLink } from "react-icons/fa";
import { supabase } from "../../../../core/lib/supabase";
import { useNotification } from "../../../../core/context/NotificationContext";

function MailInbox() {
  const { notify } = useNotification();
  const [replies, setReplies] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchReplies();
    fetchCandidates();
  }, []);

  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from("email_replies")
      .select("*, applicants(name)")
      .order("received_at", { ascending: false })
      .limit(500);

    if (error) {
      console.log("fetchReplies error (table may not exist yet):", error);
      return;
    }

    setReplies(data || []);
  };

  const fetchCandidates = async () => {
    const { data } = await supabase.from("applicants").select("id, name");
    setCandidates(data || []);
  };

  const toggleExpand = async (reply) => {
    const opening = expandedId !== reply.id;
    setExpandedId(opening ? reply.id : null);

    if (opening && !reply.is_read) {
      await supabase.from("email_replies").update({ is_read: true }).eq("id", reply.id);
      setReplies((prev) =>
        prev.map((r) => (r.id === reply.id ? { ...r, is_read: true } : r))
      );
    }
  };

  const linkToCandidate = async (replyId, candidateId) => {
    const { error } = await supabase
      .from("email_replies")
      .update({ candidate_id: candidateId })
      .eq("id", replyId);

    if (error) {
      notify(error.message || "Failed to link candidate", { type: "error" });
      return;
    }

    notify("Linked to candidate", { type: "success" });
    fetchReplies();
  };

  const filteredReplies = replies.filter((reply) => {
    const query = search.toLowerCase();
    if (!query) return true;
    return (
      reply.from_email?.toLowerCase().includes(query) ||
      reply.from_name?.toLowerCase().includes(query) ||
      reply.subject?.toLowerCase().includes(query) ||
      reply.applicants?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#f8f9fa]">
      <div className="px-6 py-5 border-b border-slate-200 bg-white">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Mail Inbox
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Candidate replies to your bulk emails, synced automatically every 5 minutes.
        </p>
      </div>

      <div className="p-6">
        <div className="max-w-4xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate, sender, or subject..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none mb-4 bg-white"
          />

          {filteredReplies.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-6 text-center">
              No replies yet.
            </p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
              {filteredReplies.map((reply) => {
                const expanded = expandedId === reply.id;

                return (
                  <div key={reply.id}>
                    <button
                      onClick={() => toggleExpand(reply)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
                    >
                      <span className="mt-0.5 text-gray-400 flex-shrink-0">
                        {reply.is_read ? (
                          <FaEnvelopeOpen size={14} />
                        ) : (
                          <FaEnvelope size={14} className="text-blue-600" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-sm truncate ${
                              reply.is_read ? "text-gray-700" : "text-[#111b21] font-semibold"
                            }`}
                          >
                            {reply.applicants?.name || reply.from_name || reply.from_email}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                            {new Date(reply.received_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{reply.subject}</p>
                        {!reply.candidate_id && (
                          <span className="inline-block mt-1 text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                            Unmatched
                          </span>
                        )}
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 pl-11">
                        <p className="text-xs text-gray-500 mb-2">
                          From: {reply.from_name ? `${reply.from_name} ` : ""}
                          {"<"}
                          {reply.from_email}
                          {">"}
                        </p>
                        <p className="text-sm text-[#111b21] bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 whitespace-pre-wrap mb-3">
                          {reply.body_text || "(no text content)"}
                        </p>

                        {!reply.candidate_id && (
                          <div className="flex items-center gap-2">
                            <FaLink className="text-gray-400 flex-shrink-0" size={12} />
                            <select
                              defaultValue=""
                              onChange={(e) =>
                                linkToCandidate(
                                  reply.id,
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none bg-white"
                            >
                              <option value="">Link to a candidate...</option>
                              {candidates.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MailInbox;
