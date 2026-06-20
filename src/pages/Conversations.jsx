import React, {
  useEffect,
  useState,
  useRef,
} from "react";
import {
  FaPaperclip,
  FaPhone,
  FaEllipsisV,
  FaSearch,
  FaSmile,
  FaMicrophone,
  FaPaperPlane,
  FaTimes,
  FaArrowLeft,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Conversations() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [sortedCandidates, setSortedCandidates] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
 const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;
console.log("TOKEN =", GHL_TOKEN);
console.log("LOCATION =", LOCATION_ID);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    if (selectedCandidate) {
      loadMessages();
    }
  }, [selectedCandidate]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("phone", selectedCandidate.phone)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setMessages(data);
  };

 useEffect(() => {
  const interval = setInterval(() => {
    loadLastMessages();

    if (selectedCandidate) {
      loadMessages();
    }
  }, 2000);

  return () => clearInterval(interval);
}, [selectedCandidate]);

  useEffect(() => {
    loadCandidates();
    loadLastMessages();
  }, []);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("applicants")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    setCandidates(data);
    setSortedCandidates(data);
  };

  const loadLastMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

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
const counts = {};

data.forEach((msg) => {
  if (
    msg.sender === "candidate" &&
    msg.is_read === false
  ) {
    counts[msg.phone] =
      (counts[msg.phone] || 0) + 1;
  }
});

setUnreadCounts(counts);
    setSortedCandidates((prev) => {
      return [...prev].sort((a, b) => {
        const aTime = latest[a.phone]?.time || "";
        const bTime = latest[b.phone]?.time || "";

        return new Date(bTime) - new Date(aTime);
      });
    });
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    let fileUrl = "";

    if (selectedFile) {
      const fileName = `${Date.now()}-${selectedFile.name}`;

      const { error: uploadError } =
        await supabase.storage
          .from("chat-files")
          .upload(fileName, selectedFile);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      fileUrl = data.publicUrl;
    }
const { error } = await supabase
  .from("chat_messages")
  .insert([
    {
      candidate_name: selectedCandidate.name,
      phone: selectedCandidate.phone,
      message: newMessage,
      file_url: fileUrl,
      sender: "hr",
      is_read: true,
    },
  ]);

    if (error) {
      console.log(error);
      return;
    }
    let contactId = selectedCandidate.contact_id;
    if (!contactId) {
  contactId = await createGHLContact();

  if (!contactId) {
    alert("Failed to create GHL contact");
    return;
  }

  await supabase
    .from("applicants")
    .update({ contact_id: contactId })
    .eq("phone", selectedCandidate.phone);
}
await sendSMS(newMessage, contactId);
    setNewMessage("");
    setSelectedFile(null);
    loadMessages();
  };
  const createGHLContact = async () => {
   
  try {
    const response = await fetch(
      "https://services.leadconnectorhq.com/contacts/",
      {
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
      }
    );

    const result = await response.json();
    console.log("GHL STATUS:", response.status);
console.log("GHL RESPONSE:", result);
console.log("FULL RESPONSE:", JSON.stringify(result, null, 2));

    return result?.contact?.id;
  } catch (error) {
    console.log("Contact Create Error:", error);
    return null;
  }
};
const sendSMS = async (message, contactId) => {
  try {
    await fetch(
      "https://services.leadconnectorhq.com/conversations/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SMS",
         contactId: contactId,
          message: message,
        }),
      }
    );
  } catch (error) {
    console.log("SMS Error:", error);
  }
};
  const handleDelete = async (id) => {
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    loadMessages();
  };

  const handleClearChat = async () => {
    if (!selectedCandidate) return;
    if (!window.confirm(`Are you sure you want to clear all messages for ${selectedCandidate.name}?`)) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("phone", selectedCandidate.phone);

    if (error) {
      console.log(error);
      alert(`Error clearing chat: ${error.message}`);
      return;
    }

    setMessages([]);
    setShowMenu(false);
  };

  const handleExportChat = () => {
    if (!selectedCandidate || messages.length === 0) {
      alert("No messages to export.");
      return;
    }

    const chatText = messages
      .map((msg) => {
        const senderName = msg.sender === "hr" ? "You (HR)" : selectedCandidate.name;
        const time = new Date(msg.created_at).toLocaleString();
        return `[${time}] ${senderName}: ${msg.message || ""}${
          msg.file_url ? ` (Attachment: ${msg.file_url})` : ""
        }`;
      })
      .join("\n");

    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
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
  await supabase
    .from("chat_messages")
    .update({ is_read: true })
    .eq("phone", candidate.phone)
    .eq("sender", "candidate");

  setSelectedCandidate(candidate);

  setUnreadCounts((prev) => {
    const updated = { ...prev };
    delete updated[candidate.phone];
    return updated;
  });
};
   

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

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const groupMessagesByDate = (msgList) => {
    const groups = [];
    let currentGroup = null;

    msgList.forEach((msg) => {
      const date = new Date(msg.created_at);
      const dateStr = date.toDateString();

      if (!currentGroup || currentGroup.dateStr !== dateStr) {
        currentGroup = {
          dateStr,
          date,
          messages: [],
        };
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

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  // Filter candidates based on name, phone, or email
  const filteredCandidates = sortedCandidates.filter((candidate) => {
    const query = searchTerm.toLowerCase();
    return (
      candidate.name?.toLowerCase().includes(query) ||
      candidate.phone?.includes(query) ||
      candidate.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <Sidebar />
      <div className="md:ml-56 mt-16 h-[calc(100vh-64px)] flex overflow-hidden bg-[#eae6df]">
      {/* Sidebar Panel */}
      <div className="w-80 border-r border-[#e9edef] bg-white flex flex-col h-full flex-shrink-0">
        {/* Sidebar Header */}
        <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between border-b border-[#e9edef]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
              HR
            </div>
            <span className="font-semibold text-[#111b21] text-base select-none">
              SmartHire Chats
            </span>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="p-2 bg-white border-b border-[#f0f2f5] flex items-center">
          <div className="bg-[#f0f2f5] flex items-center gap-3 px-3 py-1.5 rounded-lg w-full">
            <FaSearch className="text-gray-500 text-sm flex-shrink-0" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm w-full outline-none text-[#111b21] placeholder-[#667781] p-0.5"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredCandidates.length > 0 ? (
            filteredCandidates.map((candidate) => (
              <div
                key={candidate.id}
            onClick={() => handleSelectCandidate(candidate)}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#f0f2f5] transition-colors duration-150 relative ${
                  selectedCandidate?.id === candidate.id
                    ? "bg-[#f0f2f5]"
                    : "hover:bg-[#f5f6f6]"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br ${getAvatarColor(
                    candidate.name
                  )} flex items-center justify-center text-white font-bold text-lg shadow-sm select-none`}
                >
                  {candidate.name?.charAt(0).toUpperCase()}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className="font-medium text-[#111b21] truncate text-[15px]">
                      {candidate.name}
                    </h3>
                    {lastMessages[candidate.phone]?.time && (
                      <span className="text-xs text-[#667781] font-normal ml-2 flex-shrink-0">
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
            <div className="p-8 text-center text-gray-400 text-sm">
              No contacts found
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-[#efeae2] flex flex-col h-full relative">
        {selectedCandidate ? (
          <div className="w-full h-full flex flex-col bg-transparent">
            {/* Chat Header */}
            <div className="h-[60px] bg-[#f0f2f5] border-b border-[#e9edef] px-4 py-2 flex items-center justify-between flex-shrink-0 select-none">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button for smaller screen scopes if needed */}
                <button
                onClick={() => setSelectedCandidate(null)}
                  className="md:hidden text-[#667781] hover:text-[#111b21] mr-1"
                >
                  <FaArrowLeft className="text-lg" />
                </button>

                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                    selectedCandidate.name
                  )} flex items-center justify-center text-white font-bold text-base shadow-sm`}
                >
                  {selectedCandidate.name?.charAt(0).toUpperCase()}
                </div>

                {/* Name & Phone */}
                <div className="min-w-0">
                  <h2 className="font-medium text-[#111b21] text-[15.5px] truncate">
                    {selectedCandidate.name}
                  </h2>
                  <p className="text-[#667781] text-[12px] truncate mt-0.5">
                    {selectedCandidate.phone || selectedCandidate.email}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors"
                  title="Call candidate"
                >
                  <FaPhone className="text-base" />
                </button>

                {/* Dropdown Menu Container */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={`p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors ${
                      showMenu ? "bg-gray-200" : ""
                    }`}
                    title="Menu"
                  >
                    <FaEllipsisV className="text-base" />
                  </button>

                  {showMenu && (
                    <>
                      {/* Invisible Backdrop overlay to catch click outside */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowMenu(false)}
                      />

                      {/* Dropdown Box */}
                      <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-150 py-1.5 w-56 z-40 animate-fade-in origin-top-right">
                        <button
                          onClick={handleClearChat}
                          className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <FaTrash className="text-gray-400 text-xs" />
                          Clear Chat
                        </button>
                        <button
                          onClick={() => {
                            navigate("/candidate-details", { state: selectedCandidate });
                            setShowMenu(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                            i
                          </div>
                          Candidate Details
                        </button>
                        <button
                          onClick={handleExportChat}
                          className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-gray-400 text-xs">📄</span>
                          Export Chat History
                        </button>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={() => setShowMenu(false)}
                          className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                          <span>✕</span>
                          Close Menu
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div
              className="flex-1 p-4 overflow-y-auto"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b5c0ad' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {messages.length > 0 ? (
                groupMessagesByDate(messages).map((group) => (
                  <div key={group.dateStr}>
                    {/* Date Separator Header */}
                    <div className="flex justify-center my-4">
                      <span className="bg-white text-[#54656f] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-[#e9edef] select-none uppercase tracking-wider">
                        {getDateLabel(group.date)}
                      </span>
                    </div>

                    {/* Messages */}
                    {group.messages.map((msg) => {
                      const msgTime = new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const isHR = msg.sender === "hr";

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            isHR ? "justify-end" : "justify-start"
                          } mb-2 group relative`}
                        >
                          <div
                            className={`relative max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-[14.2px] leading-relaxed break-words ${
                              isHR
                                ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                                : "bg-white text-[#111b21] rounded-tl-none"
                            }`}
                          >
                            {/* Message Content */}
                            <div className="pr-12 pb-1 text-[#111b21]">
                              {msg.message}

                              {msg.file_url && (
                                <div className="mt-2 p-2 rounded bg-black/5 flex items-center gap-2">
                                  <FaPaperclip className="text-gray-500 text-xs flex-shrink-0" />
                                  <a
                                    href={msg.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline text-blue-600 font-medium hover:text-blue-800 break-all text-xs"
                                  >
                                    Open Attachment
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Timestamp + Read checkmarks */}
                            <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9.5px] text-[#667781] select-none">
                              <span>{msgTime}</span>
                            </div>

                            {/* Delete single message hover button */}
                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity pr-1 pt-1">
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="text-gray-400 hover:text-red-500 p-1 text-xs"
                                title="Delete message"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white p-4 rounded-xl shadow-sm text-center max-w-xs border border-gray-150">
                    <p className="text-[#667781] text-sm">
                      No message history. Send a message to start the conversation!
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Selected File Attachment Preview Bar */}
            {selectedFile && (
              <div className="bg-white px-4 py-2 border-t border-[#e9edef] flex items-center justify-between gap-3 text-sm text-gray-700 animate-slide-up select-none">
                <div className="flex items-center gap-2 truncate">
                  <FaPaperclip className="text-blue-500 text-xs flex-shrink-0" />
                  <span className="font-medium truncate">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-red-500 p-1 font-bold text-xs"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Input Send Message Area */}
            <div className="p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef] flex-shrink-0">
              <button
                className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                title="Emojis"
              >
                <FaSmile />
              </button>

              <div>
                <input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <button
                  onClick={() => document.getElementById("fileUpload").click()}
                  className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  title="Attach file"
                >
                  <FaPaperclip />
                </button>
              </div>

              <input
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                className="flex-1 bg-white rounded-lg px-4 py-2 outline-none text-[15px] border-none placeholder-[#667781] text-[#111b21]"
              />

              {newMessage.trim() || selectedFile ? (
                <button
                  onClick={handleSend}
                  className="bg-[#00a884] hover:bg-[#008f72] text-white p-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm"
                  title="Send message"
                >
                  <FaPaperPlane className="text-xs ml-0.5" />
                </button>
              ) : (
                <button
                  className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  title="Voice message"
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
            <h2 className="text-2xl font-semibold text-[#41525d] mb-2">
              SmartHire Chat Integration
            </h2>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              Select an applicant from the list to view their chat history and send messages in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);
    }
  
export default Conversations;