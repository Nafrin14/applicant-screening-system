import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import {
  FaHistory,
  FaCalendarAlt,
  FaPhone,
  FaPaperclip,
  FaEllipsisV,
  FaSearch,
  FaSmile,
  FaMicrophone,
  FaPaperPlane,
  FaTimes,
  FaTrash,
  FaCopy,
} from "react-icons/fa";

function CandidateChat() {
  const location = useLocation();
  const navigate = useNavigate();

  const { candidateName, phone } = location.state || {};
  const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;
 

  const [messages, setMessages] = useState([
    {
      sender: "candidate",
      text: "Yes, I have a driving license.",
    },
  ]);

  const suggestedMessages = [
    {
      label: "Greeting",
      text: "Hello Candidate, I'm Sean from KD Landscaping.",
    },
    {
      label: "Job Applied",
      text: "Recently you applied for the Landscaping Foreman position through Indeed.",
    },
    {
      label: "License",
      text: "Do you have a driving license?",
    },
  ];

  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getDateLabel = (date) => {
    if (!date) return "Today";
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    return messageDate.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    loadMessages();

    const interval = setInterval(() => {
      loadMessages();
      fetchReplies();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("phone", phone)
      .order("created_at", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setMessages(
      data.map((msg) => ({
        id: msg.id,
        sender: msg.sender === "hr" ? "user" : "candidate",
        text: msg.message,
        time: msg.created_at,
        fileUrl: msg.file_url,
      }))
    );
  };

  const fetchReplies = async () => {
    const { data: applicant } = await supabase
  .from("applicants")
  .select("contact_id")
  .eq("phone", phone)
  .single();

const contactId = applicant?.contact_id;

if (!contactId) return;
    try {
      const response = await fetch(
        `https://services.leadconnectorhq.com/conversations/search?contactId=${contactId}&locationId=${LOCATION_ID}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${GHL_TOKEN}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      console.log("GHL Replies:", result);
      if (result.conversations?.[0]?.lastMessageDirection === "inbound") {
        const lastMessage = result.conversations?.[0]?.lastMessageBody;
        const { data: existingMessage } = await supabase
          .from("chat_messages")
          .select("id")
          .eq("message", lastMessage)
          .eq("sender", "candidate")
          .limit(1);

        if (existingMessage.length > 0) {
          return;
        }

        await supabase.from("chat_messages").insert([
          {
            candidate_name: candidateName,
            phone: phone,
            message: result.conversations?.[0]?.lastMessageBody,
            sender: "candidate",
          },
        ]);

        loadMessages();
      }
    } catch (error) {
      console.log("Fetch Reply Error:", error);
    }
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
          firstName: candidateName,
          phone: phone,
          locationId: LOCATION_ID,
        }),
      }
    );

    const result = await response.json();

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
    if (!id) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete failed");
      console.log(error);
      return;
    }

    loadMessages();
  };

  const handleClearChat = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all messages?"
    );
    if (!confirmClear) return;

    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("phone", phone);

    if (error) {
      alert("Clear Chat Failed");
      console.log(error);
      return;
    }

    setShowMenu(false);
    loadMessages();
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

    const { error } = await supabase.from("chat_messages").insert([
      {
        candidate_name: candidateName,
        phone: phone,
        message: newMessage,
        file_url: fileUrl,
        sender: "hr",
      },
    ]);

    if (error) {
      console.log(error);
      alert("Message save failed");
      return;
    }
const { data: applicant } = await supabase
  .from("applicants")
  .select("contact_id")
  .eq("phone", phone)
  .single();

let contactId = applicant?.contact_id;

if (!contactId) {
  contactId = await createGHLContact();

  if (!contactId) {
    alert("Failed to create GHL contact");
    return;
  }

  await supabase
    .from("applicants")
    .update({ contact_id: contactId })
    .eq("phone", phone);
}
   await sendSMS(newMessage, contactId);
    
    setNewMessage("");
    setSelectedFile(null);
    loadMessages();
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      alert("No messages to export.");
      return;
    }

    const chatText = messages
      .map((msg) => {
        const senderName = msg.sender === "user" ? "You (HR)" : candidateName;
        const timeStr = msg.time ? new Date(msg.time).toLocaleString() : "Just Now";
        return `[${timeStr}] ${senderName}: ${msg.text || ""}${
          msg.fileUrl ? ` (Attachment: ${msg.fileUrl})` : ""
        }`;
      })
      .join("\n");

    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat_with_${candidateName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const navigateToDetails = async () => {
    setShowMenu(false);
    const { data, error } = await supabase
      .from("applicants")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error || !data) {
      const { data: dataByName } = await supabase
        .from("applicants")
        .select("*")
        .eq("name", candidateName)
        .limit(1);

      if (dataByName && dataByName.length > 0) {
        navigate("/candidate-details", { state: dataByName[0] });
      } else {
        navigate("/candidate-details", {
          state: { name: candidateName, phone: phone },
        });
      }
    } else {
      navigate("/candidate-details", { state: data });
    }
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

  const groupMessagesByDate = (msgList) => {
    const groups = [];
    let currentGroup = null;

    msgList.forEach((msg) => {
      const date = msg.time ? new Date(msg.time) : new Date();
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

  return (
  <div className="min-h-screen bg-white p-6 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg h-[88vh] w-full max-w-5xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="h-[65px] bg-[#f0f2f5] px-6 py-3 flex items-center justify-between border-b border-[#e9edef] select-none flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(
                candidateName
              )} text-white flex items-center justify-center font-bold text-lg shadow-sm`}
            >
              {candidateName?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-[16px] font-semibold text-[#111b21]">
                {candidateName}
              </h1>

              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-xs text-[#667781]">{phone}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${phone}`}
              title="Call Candidate"
              className="p-2.5 hover:bg-gray-200 text-[#667781] rounded-full transition-colors"
            >
              <FaPhone className="text-base" />
            </a>

            <button
              title="Chat History"
              onClick={() => setShowHistory(true)}
              className="p-2.5 hover:bg-gray-200 text-[#667781] rounded-full transition-colors"
            >
              <FaHistory className="text-base" />
            </button>

            {/* Dropdown Menu Container */}
            <div className="relative">
              <button
                title="Menu"
                onClick={() => setShowMenu(!showMenu)}
                className={`p-2.5 hover:bg-gray-200 text-[#667781] rounded-full transition-colors ${
                  showMenu ? "bg-gray-200" : ""
                }`}
              >
                <FaEllipsisV className="text-base" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />

                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-150 py-1.5 w-56 z-40 animate-fade-in origin-top-right">
                    <button
                      onClick={handleClearChat}
                      className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <FaTrash className="text-gray-400 text-xs" />
                      Clear Chat
                    </button>
                    <button
                      onClick={navigateToDetails}
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

        {/* Quick Templates bar */}
        <div className="px-5 py-2.5 border-b border-[#e9edef] bg-white flex items-center select-none flex-shrink-0">
          <span className="text-xs font-semibold text-[#667781] mr-3 uppercase tracking-wider">
            Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedMessages.map((msg, index) => (
              <button
                key={index}
                onClick={() => setNewMessage(msg.text)}
                className="px-3 py-1 bg-[#f0f2f5] hover:bg-[#e4e6eb] rounded-full text-xs text-[#41525d] font-medium transition-colors border border-gray-100"
              >
                {msg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-5"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b5c0ad' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {messages.length > 0 ? (
            groupMessagesByDate(messages).map((group) => (
              <div key={group.dateStr}>
                {/* Date separator */}
                <div className="flex justify-center my-4 select-none">
                  <span className="bg-white text-[#54656f] text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-sm border border-[#e9edef] uppercase tracking-wider">
                    {getDateLabel(group.date)}
                  </span>
                </div>

                {/* Messages in this group */}
                {group.messages.map((msg, index) => {
                  const isHR = msg.sender === "user";
                  const timeStr = msg.time
                    ? new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Just Now";

                  return (
                    <div
                      key={msg.id || index}
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
                        {/* Text and attachment details */}
                        <div className="pr-12 pb-1 text-[#111b21]">
                          {msg.text}

                          {msg.fileUrl && (
                            <div className="mt-2 p-2 rounded bg-black/5 flex items-center gap-2">
                              <FaPaperclip className="text-gray-500 text-xs flex-shrink-0" />
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-blue-600 font-medium hover:text-blue-800 break-all text-xs"
                              >
                                Open Attachment
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Footer time and ticks */}
                        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9.5px] text-[#667781] select-none">
                          <span>{timeStr}</span>
                        </div>

                        {/* Action buttons (Copy + Delete) */}
                        <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity pr-1 pt-1 flex gap-1">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.text || "");
                              alert("Message Copied!");
                            }}
                            className="text-gray-400 hover:text-blue-500 p-1 text-xs"
                            title="Copy message"
                          >
                            <FaCopy />
                          </button>
                          {msg.id && (
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="text-gray-400 hover:text-red-500 p-1 text-xs"
                              title="Delete message"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center select-none">
              <div className="bg-white p-4 rounded-xl shadow-sm text-center max-w-xs border border-gray-150">
                <p className="text-[#667781] text-sm">
                  No message history. Send a message or use templates to start!
                </p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="bg-white px-4 py-2 border-t border-[#e9edef] flex items-center justify-between gap-3 text-sm text-gray-700 select-none animate-slide-up flex-shrink-0">
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

        {/* Bottom Input Area */}
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
            className="flex-1 bg-white rounded-lg px-4 py-2.5 outline-none text-[15px] border-none placeholder-[#667781] text-[#111b21]"
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

      {/* Chat History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#f0f2f5]">
              <h2 className="text-base font-semibold text-[#111b21]">
                Conversation History
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-[#667781] hover:text-red-500 font-bold p-1 rounded-full hover:bg-gray-200 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-[#d9fdd3] border-[#c1ebd0] ml-auto"
                      : "bg-white border-[#e9edef]"
                  }`}
                >
                  <p className="text-[14px] text-[#111b21]">{msg.text}</p>
                  {msg.fileUrl && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-2 underline text-blue-600 font-medium hover:text-blue-800 break-all text-xs"
                    >
                      📎 Open Attachment
                    </a>
                  )}
                  <p className="text-[10px] text-gray-400 text-right mt-1">
                    {msg.time
                      ? new Date(msg.time).toLocaleString()
                      : "Just Now"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateChat;