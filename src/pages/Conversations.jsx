import React, { useEffect, useState, useRef } from "react";
import {
  FaPaperclip, FaPhone, FaEllipsisV, FaSearch, FaSmile,
  FaMicrophone, FaPaperPlane, FaTimes, FaArrowLeft, FaTrash,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
 
function Conversations() {
  const navigate = useNavigate();
 
  // ── State ──────────────────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [messageMenu, setMessageMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedForwardCandidate, setSelectedForwardCandidate] = useState(null);
  const [sortedCandidates, setSortedCandidates] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
 
  const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
  const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;
 
  // ── Refs ───────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const selectedCandidateRef = useRef(null);
  const candidatesRef = useRef([]);
  const emojiRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
 
  // ── Keep refs in sync ──────────────────────────────────────────────────────
  useEffect(() => { selectedCandidateRef.current = selectedCandidate; }, [selectedCandidate]);
  useEffect(() => { candidatesRef.current = candidates; }, [candidates]);
 
  // ── Auto-scroll on new messages ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
 
  // ── Load messages when candidate changes ───────────────────────────────────
  useEffect(() => {
    if (selectedCandidate) loadMessages();
  }, [selectedCandidate]);
 
  // ── Restore selected candidate from localStorage ───────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("selectedCandidate");
    if (saved) setSelectedCandidate(JSON.parse(saved));
  }, []);
 
  // ── Close emoji picker on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
 
  // ── Supabase Realtime subscription ────────────────────────────────────────
  // Single subscription, no polling. Fires instantly on every INSERT.
  useEffect(() => {
    const channel = supabase
      .channel("realtime-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const newMsg = payload.new;
          const current = selectedCandidateRef.current;
 
          if (current && newMsg.phone === current.phone) {
            // Append to open chat, removing any matching optimistic temp message
            setMessages((prev) => {
              const filtered = prev.filter(
                (m) => !(m.id?.toString().startsWith("temp-") && m.message === newMsg.message)
              );
              return [...filtered, newMsg];
            });
            // Auto-mark candidate messages as read
            if (newMsg.sender === "candidate") {
              supabase.from("chat_messages").update({ is_read: true }).eq("id", newMsg.id);
            }
          } else if (newMsg.sender === "candidate") {
            // Increment unread badge for other contacts
            setUnreadCounts((prev) => ({
              ...prev,
              [newMsg.phone]: (prev[newMsg.phone] || 0) + 1,
            }));
          }
 
          // Update sidebar preview and bubble contact to top
          setLastMessages((prev) => {
            const updated = {
              ...prev,
              [newMsg.phone]: {
                message: newMsg.message || "📎 Attachment",
                time: newMsg.created_at,
              },
            };
            setSortedCandidates((list) =>
              [...list].sort((a, b) => {
                const aTime = updated[a.phone]?.time || 0;
                const bTime = updated[b.phone]?.time || 0;
                return new Date(bTime) - new Date(aTime);
              })
            );
            return updated;
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });
 
    return () => supabase.removeChannel(channel);
  }, []); // Subscribe once; refs keep closures fresh
 
  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadCandidates();
  }, []);
 
  // ── GHL polling: pull incoming messages from GHL into Supabase ─────────────
  // This runs every 2 s and checks for new messages from GHL that haven't
  // been saved to Supabase yet. Realtime then picks them up automatically.
  useEffect(() => {
    const interval = setInterval(fetchReplies, 2000);
    return () => clearInterval(interval);
  }, []);
 
  // ── Data loaders ───────────────────────────────────────────────────────────
 
  const loadCandidates = async () => {
    const { data, error } = await supabase.from("applicants").select("*");
    if (error) { console.log(error); return; }
    setCandidates(data);
    loadLastMessages(data); // pass directly to avoid race condition
  };
 
  const loadLastMessages = async (candidateList) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.log(error); return; }
 
    // Build latest-message map
    const latest = {};
    data.forEach((msg) => {
      if (!latest[msg.phone]) {
        latest[msg.phone] = {
          message: msg.message || "📎 Attachment",
          time: msg.created_at,
        };
      }
    });
    setLastMessages(latest);
 
    // Unread counts
    const counts = {};
    data.forEach((msg) => {
      if (msg.sender === "candidate" && msg.is_read === false) {
        counts[msg.phone] = (counts[msg.phone] || 0) + 1;
      }
    });
    setUnreadCounts(counts);
 
    // Sort candidates — use || 0 (epoch) so NaN never poisons the comparator
    const list = candidateList ?? candidatesRef.current;
    setSortedCandidates(
      [...list].sort((a, b) => {
        const aTime = latest[a.phone]?.time || 0;
        const bTime = latest[b.phone]?.time || 0;
        return new Date(bTime) - new Date(aTime);
      })
    );
  };
 
  const loadMessages = async () => {
    const phone = selectedCandidateRef.current?.phone;
    if (!phone) return;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: true });
    if (error) { console.log(error); return; }
    setMessages(data);
    setPinnedMessage(data.find((m) => m.is_pinned === true) || null);
  };
 
  const fetchReplies = async () => {
    const { data } = await supabase
      .from("applicants")
      .select("name, phone, contact_id")
      .not("contact_id", "is", null);
    if (!data) return;
 
    for (const applicant of data) {
      try {
        const response = await fetch(
          `https://services.leadconnectorhq.com/conversations/search?contactId=${applicant.contact_id}&locationId=${LOCATION_ID}`,
          {
            headers: {
              Authorization: `Bearer ${GHL_TOKEN}`,
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
          }
        );
        const result = await response.json();
        if (!result.conversations?.length) continue;
 
        const lastBody = result.conversations[0].lastMessageBody;
        const { data: existing } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("message", lastBody)
          .eq("phone", applicant.phone)
          .limit(1);
 
        if (existing?.length === 0) {
          await supabase.from("chat_messages").insert([{
            candidate_name: applicant.name,
            phone: applicant.phone,
            message: lastBody,
            sender: "candidate",
            is_read: false,
          }]);
          // Realtime will handle UI update automatically
        }
      } catch (err) {
        console.log("fetchReplies error:", err);
      }
    }
  };
 
  // ── Voice recording ────────────────────────────────────────────────────────
 
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.log(error);
      alert("Microphone permission denied");
    }
  };
 
  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const fileName = `voice-${Date.now()}.webm`;
      const { error } = await supabase.storage.from("chat-files").upload(fileName, audioBlob);
      if (error) { console.log(error); return; }
      const { data } = supabase.storage.from("chat-files").getPublicUrl(fileName);
 
      await supabase.from("chat_messages").insert([{
        candidate_name: selectedCandidate.name,
        phone: selectedCandidate.phone,
        file_url: data.publicUrl,
        sender: "hr",
        is_read: true,
        message: "🎤 Voice Message",
      }]);
 
      let contactId = selectedCandidate.contact_id;
      if (!contactId) {
        contactId = await createGHLContact();
        if (!contactId) { alert("Failed to create GHL contact"); return; }
        await supabase.from("applicants").update({ contact_id: contactId }).eq("phone", selectedCandidate.phone);
      }
      sendVoiceMessage(data.publicUrl, contactId); // fire and forget
    };
    recorder.stop();
    setIsRecording(false);
  };
 
  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };
 
  // ── Send message (optimistic UI + fire-and-forget SMS) ─────────────────────
 
  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
 
    const messageText = newMessage;
    const fileToSend = selectedFile;
 
    // Clear inputs immediately
    setNewMessage("");
    setSelectedFile(null);
 
    // Show message instantly (optimistic)
    const tempId = `temp-${Date.now()}`;
    if (messageText.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          candidate_name: selectedCandidate.name,
          phone: selectedCandidate.phone,
          message: messageText,
          file_url: "",
          sender: "hr",
          is_read: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
 
    // Upload file if attached
    let fileUrl = "";
    if (fileToSend) {
      const fileName = `${Date.now()}-${fileToSend.name}`;
      const { error: uploadError } = await supabase.storage.from("chat-files").upload(fileName, fileToSend);
      if (uploadError) { alert(uploadError.message); return; }
      const { data } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      fileUrl = data.publicUrl;
    }
 
    // Insert to DB — Realtime will replace the temp message
    const { error } = await supabase.from("chat_messages").insert([{
      candidate_name: selectedCandidate.name,
      phone: selectedCandidate.phone,
      message: messageText,
      file_url: fileUrl,
      sender: "hr",
      is_read: true,
    }]);
 
    if (error) {
      // Rollback optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      console.log(error);
      return;
    }
 
    // SMS — fire and forget, never blocks the UI
    let contactId = selectedCandidate.contact_id;
    if (!contactId) {
      createGHLContact().then(async (id) => {
        if (!id) return;
        await supabase.from("applicants").update({ contact_id: id }).eq("phone", selectedCandidate.phone);
        setSelectedCandidate((prev) => ({ ...prev, contact_id: id }));
        sendSMS(messageText, id);
      });
    } else {
      sendSMS(messageText, contactId);
    }
  };
 
  // ── GHL API helpers ────────────────────────────────────────────────────────
 
  const createGHLContact = async () => {
    try {
      const response = await fetch("https://services.leadconnectorhq.com/contacts/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: selectedCandidate.name,
          phone: selectedCandidate.phone,
          locationId: LOCATION_ID,
        }),
      });
      const result = await response.json();
      return result?.contact?.id;
    } catch (error) {
      console.log("Contact Create Error:", error);
      return null;
    }
  };
 
  const sendSMS = async (message, contactId) => {
    try {
      await fetch("https://services.leadconnectorhq.com/conversations/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "SMS", contactId, message }),
      });
    } catch (error) {
      console.log("SMS Error:", error);
    }
  };
 
  const sendVoiceMessage = async (audioUrl, contactId) => {
    try {
      const response = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SMS",
          contactId,
          attachments: [{ url: audioUrl }],
        }),
      });
      console.log("Voice response:", await response.json());
    } catch (error) {
      console.log("Voice Error:", error);
    }
  };
 
  // ── Chat actions ───────────────────────────────────────────────────────────
 
  const handleForward = async () => {
    if (!forwardMessage || !selectedForwardCandidate) { alert("Select a candidate"); return; }
    const { error } = await supabase.from("chat_messages").insert([{
      candidate_name: selectedForwardCandidate.name,
      phone: selectedForwardCandidate.phone,
      message: forwardMessage.message,
      file_url: forwardMessage.file_url || "",
      sender: "hr",
      is_read: true,
    }]);
    if (error) { console.log(error); return; }
    alert("Message Forwarded");
    setShowForwardModal(false);
    setForwardMessage(null);
    setSelectedForwardCandidate(null);
  };
 
  const handlePinMessage = async (msg) => {
    if (!selectedCandidate) return;
    await supabase.from("chat_messages").update({ is_pinned: false }).eq("phone", selectedCandidate.phone);
    await supabase.from("chat_messages").update({ is_pinned: true }).eq("id", msg.id);
    setPinnedMessage(msg);
    loadMessages();
  };
 
  const handleDelete = async (id) => {
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) { console.log(error); return; }
    loadMessages();
  };
 
  const handleClearChat = async () => {
    if (!selectedCandidate) return;
    if (!window.confirm(`Clear all messages for ${selectedCandidate.name}?`)) return;
    const { error } = await supabase.from("chat_messages").delete().eq("phone", selectedCandidate.phone);
    if (error) { console.log(error); alert(`Error: ${error.message}`); return; }
    setMessages([]);
    setPinnedMessage(null);
    setShowMenu(false);
  };
 
  const handleExportChat = () => {
    if (!selectedCandidate || messages.length === 0) { alert("No messages to export."); return; }
    const text = messages
      .map((msg) => {
        const sender = msg.sender === "hr" ? "You (HR)" : selectedCandidate.name;
        const time = new Date(msg.created_at).toLocaleString();
        return `[${time}] ${sender}: ${msg.message || ""}${msg.file_url ? ` (Attachment: ${msg.file_url})` : ""}`;
      })
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_with_${selectedCandidate.name.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };
 
  const handleSelectCandidate = async (candidate) => {
    await supabase.from("chat_messages").update({ is_read: true }).eq("phone", candidate.phone).eq("sender", "candidate");
    setSelectedCandidate(candidate);
    localStorage.setItem("selectedCandidate", JSON.stringify(candidate));
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[candidate.phone];
      return updated;
    });
  };
 
  // ── Helpers ────────────────────────────────────────────────────────────────
 
  const getAvatarColor = (name = "") => {
    const colors = [
      "from-red-400 to-red-600",
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-yellow-400 to-yellow-600",
      "from-purple-400 to-purple-600",
      "from-pink-400 to-pink-600",
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };
 
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString())
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };
 
  const groupMessagesByDate = (msgList) => {
    const groups = [];
    let currentGroup = null;
    msgList.forEach((msg) => {
      const date = new Date(msg.created_at);
      const dateStr = date.toDateString();
      if (!currentGroup || currentGroup.dateStr !== dateStr) {
        currentGroup = { dateStr, date, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    });
    return groups;
  };
 
  const getDateLabel = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };
 
  const filteredCandidates = sortedCandidates.filter((c) => {
    const q = searchTerm.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
  });
 
  // ── Render ─────────────────────────────────────────────────────────────────
 
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <Sidebar />
      <div className="md:ml-56 mt-16 h-[calc(100vh-64px)] flex overflow-hidden bg-[#eae6df]">
 
        {/* ── Left sidebar: contact list ── */}
        <div className="w-80 border-r border-[#e9edef] bg-white flex flex-col h-full flex-shrink-0">
          <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center gap-3 border-b border-[#e9edef]">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
              HR
            </div>
            <span className="font-semibold text-[#111b21] text-base select-none">SmartHire Chats</span>
          </div>
 
          <div className="p-2 bg-white border-b border-[#f0f2f5]">
            <div className="bg-[#f0f2f5] flex items-center gap-3 px-3 py-1.5 rounded-lg">
              <FaSearch className="text-gray-500 text-sm flex-shrink-0" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm w-full outline-none text-[#111b21] placeholder-[#667781] p-0.5"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
 
          <div className="flex-1 overflow-y-auto bg-white">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#f0f2f5] transition-colors duration-150 ${
                    selectedCandidate?.id === candidate.id ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarColor(candidate.name)} flex items-center justify-center text-white font-bold text-lg shadow-sm select-none`}>
                    {candidate.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-medium text-[#111b21] truncate text-[15px]">{candidate.name}</h3>
                      {lastMessages[candidate.phone]?.time && (
                        <span className="text-xs text-[#667781] ml-2 flex-shrink-0">
                          {formatMessageTime(lastMessages[candidate.phone].time)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[13.5px] text-[#667781] truncate pr-2">
                        {lastMessages[candidate.phone]?.message || "No messages"}
                      </p>
                      {unreadCounts[candidate.phone] > 0 && (
                        <span className="bg-[#25d366] text-white text-[11px] font-bold px-1.5 rounded-full flex items-center justify-center min-w-[20px] h-5 flex-shrink-0 select-none">
                          {unreadCounts[candidate.phone]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No contacts found</div>
            )}
          </div>
        </div>
 
        {/* ── Main chat area ── */}
        <div className="flex-1 bg-[#efeae2] flex flex-col h-full relative">
          {selectedCandidate ? (
            <div className="w-full h-full flex flex-col bg-transparent">
 
              {/* Chat header */}
              <div className="h-[60px] bg-[#f0f2f5] border-b border-[#e9edef] px-4 py-2 flex items-center justify-between flex-shrink-0 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => { setSelectedCandidate(null); localStorage.removeItem("selectedCandidate"); }}
                    className="md:hidden text-[#667781] hover:text-[#111b21] mr-1"
                  >
                    <FaArrowLeft className="text-lg" />
                  </button>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(selectedCandidate.name)} flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                    {selectedCandidate.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-medium text-[#111b21] text-[15.5px] truncate">{selectedCandidate.name}</h2>
                    <p className="text-[#667781] text-[12px] truncate mt-0.5">{selectedCandidate.phone || selectedCandidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors" title="Call">
                    <FaPhone className="text-base" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className={`p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors ${showMenu ? "bg-gray-200" : ""}`}
                    >
                      <FaEllipsisV className="text-base" />
                    </button>
                    {showMenu && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 w-56 z-40 origin-top-right">
                          <button onClick={handleClearChat} className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <FaTrash className="text-gray-400 text-xs" /> Clear Chat
                          </button>
                          <button
                            onClick={() => { navigate("/candidate-details", { state: selectedCandidate }); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">i</div>
                            Candidate Details
                          </button>
                          <button onClick={handleExportChat} className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <span className="text-gray-400 text-xs">📄</span> Export Chat History
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button onClick={() => setShowMenu(false)} className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-3">
                            <span>✕</span> Close Menu
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
 
              {/* Pinned message banner */}
              {pinnedMessage && (
                <div
                  onClick={() => {
                    document.getElementById(`msg-${pinnedMessage.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setHighlightedMessage(pinnedMessage.id);
                    setTimeout(() => setHighlightedMessage(null), 2000);
                  }}
                  className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 cursor-pointer"
                >
                  <span>📌</span>
                  <div className="flex-1 truncate text-sm">{pinnedMessage.message}</div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await supabase.from("chat_messages").update({ is_pinned: false }).eq("id", pinnedMessage.id);
                      setPinnedMessage(null);
                    }}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
 
              {/* Messages */}
              <div
                className="flex-1 p-4 overflow-y-auto"
                onClick={() => setMessageMenu(null)}
                style={{
                  backgroundColor: "#efeae2",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b5c0ad' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {messages.length > 0 ? (
                  groupMessagesByDate(messages).map((group) => (
                    <div key={group.dateStr}>
                      <div className="flex justify-center my-4">
                        <span className="bg-white text-[#54656f] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-[#e9edef] select-none uppercase tracking-wider">
                          {getDateLabel(group.date)}
                        </span>
                      </div>
                      {group.messages.map((msg) => {
                        const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                        const isHR = msg.sender === "hr";
                        const isTemp = msg.id?.toString().startsWith("temp-");
 
                        return (
                          <div key={msg.id} className={`flex ${isHR ? "justify-end" : "justify-start"} mb-2 group relative`}>
                            <div
                              id={`msg-${msg.id}`}
                              onContextMenu={(e) => {
                                if (isTemp) return;
                                e.preventDefault();
                                setMenuPosition({ x: e.clientX, y: e.clientY });
                                setMessageMenu(msg.id);
                              }}
                              className={`relative max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-[14.2px] leading-relaxed break-words transition-all duration-500
                                ${highlightedMessage === msg.id ? "ring-4 ring-yellow-400" : ""}
                                ${isTemp ? "opacity-60" : ""}
                                ${isHR ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none" : "bg-white text-[#111b21] rounded-tl-none"}`}
                            >
                              {msg.is_pinned && <span className="absolute top-1 right-2 text-xs">📌</span>}
 
                              <div className="pr-12 pb-1 text-[#111b21]">
                                {msg.message}
                                {msg.file_url && (
                                  msg.file_url.includes("voice-") || msg.message === "🎤 Voice Message" ? (
                                    <audio controls src={msg.file_url} className="mt-2 max-w-full rounded" />
                                  ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.file_url) ? (
                                    <a href={msg.file_url} target="_blank" rel="noreferrer" className="block mt-2">
                                      <img src={msg.file_url} alt="attachment" className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90" />
                                    </a>
                                  ) : (
                                    <div className="mt-2 p-2 rounded bg-black/5 flex items-center gap-2">
                                      <FaPaperclip className="text-gray-500 text-xs flex-shrink-0" />
                                      <a href={msg.file_url} target="_blank" rel="noreferrer" className="underline text-blue-600 font-medium hover:text-blue-800 break-all text-xs">
                                        Open Attachment
                                      </a>
                                    </div>
                                  )
                                )}
                              </div>
 
                              {/* Timestamp + read ticks */}
                              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9.5px] text-[#667781] select-none">
                                <span>{msgTime}</span>
                                {isHR && !isTemp && (
                                  <span className={msg.is_read ? "text-[#53bdeb]" : "text-[#667781]"}>
                                    <svg viewBox="0 0 16 11" width="14" height="11" fill="currentColor">
                                      <path d="M11.071.653a.5.5 0 0 0-.707 0L4.501 6.517l-1.86-1.86a.5.5 0 0 0-.707.707l2.214 2.214a.5.5 0 0 0 .707 0l6.216-6.218a.5.5 0 0 0 0-.707z" />
                                      <path d="M14.071.653a.5.5 0 0 0-.707 0L7.5 6.517a.5.5 0 0 0 .707.707l5.864-5.864a.5.5 0 0 0 0-.707z" />
                                    </svg>
                                  </span>
                                )}
                              </div>
 
                              {/* Right-click context menu */}
                              {messageMenu === msg.id && (
                                <div
                                  className="fixed bg-white shadow-xl rounded-lg border z-[9999] min-w-[180px] py-1"
                                  style={{ left: menuPosition.x, top: menuPosition.y }}
                                >
                                  <button onClick={(e) => { e.stopPropagation(); setForwardMessage(msg); setShowForwardModal(true); setMessageMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm">
                                    Forward
                                  </button>
                                  <button onClick={async (e) => { e.stopPropagation(); await handlePinMessage(msg); setMessageMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm">
                                    📌 Pin Message
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); setMessageMenu(null); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-sm text-red-500">
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center max-w-xs border border-gray-100">
                      <p className="text-[#667781] text-sm">No message history. Send a message to start the conversation!</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
 
              {/* File preview bar */}
              {selectedFile && (
                <div className="bg-white px-4 py-2 border-t border-[#e9edef] flex items-center justify-between gap-3 text-sm text-gray-700 select-none">
                  <div className="flex items-center gap-2 truncate">
                    <FaPaperclip className="text-blue-500 text-xs flex-shrink-0" />
                    <span className="font-medium truncate">{selectedFile.name}</span>
                    <span className="text-xs text-gray-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 p-1 font-bold text-xs">
                    <FaTimes />
                  </button>
                </div>
              )}
 
              {/* Emoji picker */}
              {showEmojiPicker && (
                <div ref={emojiRef} className="absolute bottom-20 left-4 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} />
                </div>
              )}
 
              {/* Input bar */}
              <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef] flex-shrink-0">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <FaSmile />
                </button>
                <div>
                  <input type="file" id="fileUpload" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                  <button onClick={() => document.getElementById("fileUpload").click()} className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors" title="Attach file">
                    <FaPaperclip />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                  className="flex-1 bg-white rounded-lg px-4 py-2 outline-none text-[15px] border-none placeholder-[#667781] text-[#111b21]"
                />
                {newMessage.trim() || selectedFile ? (
                  <button
                    onClick={handleSend}
                    className="bg-[#00a884] hover:bg-[#008f72] text-white p-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm"
                    title="Send"
                  >
                    <FaPaperPlane className="text-xs ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`text-xl p-1.5 rounded-full transition-colors ${
                      isRecording ? "text-red-500 animate-pulse" : "text-[#667781] hover:text-[#111b21] hover:bg-gray-200"
                    }`}
                    title={isRecording ? "Stop recording" : "Voice message"}
                  >
                    <FaMicrophone />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center select-none bg-[#f8f9fa] border-l border-[#e9edef] p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00a884]/20 to-[#008f72]/20 flex items-center justify-center text-[#00a884] mb-6 shadow-sm">
                <FaPaperPlane className="text-4xl transform rotate-12" />
              </div>
              <h2 className="text-2xl font-semibold text-[#41525d] mb-2">SmartHire Chat Integration</h2>
              <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
                Select an applicant from the list to view their chat history and send messages in real-time.
              </p>
            </div>
          )}
 
          {/* Forward modal */}
          {showForwardModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white w-96 rounded-xl shadow-xl">
                <div className="bg-green-600 text-white p-4 rounded-t-xl">
                  <h2 className="font-semibold">Forward Message</h2>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      onClick={() => setSelectedForwardCandidate(candidate)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedForwardCandidate?.id === candidate.id ? "bg-green-100" : ""}`}
                    >
                      {candidate.name}
                    </div>
                  ))}
                </div>
                <div className="p-4 flex justify-end gap-2">
                  <button onClick={() => setShowForwardModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button onClick={handleForward} className="px-4 py-2 bg-green-600 text-white rounded">Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
 
export default Conversations;

 