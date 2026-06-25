import React, { useEffect, useState, useRef } from "react";
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
  FaBars,
} from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import throttle from "lodash/throttle";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";

// ==========================================
// HELPER FUNCTIONS (Moved outside component)
// ==========================================
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
const normalizePhone = (phone) => {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
};
// ==========================================
// SUB-COMPONENTS (Defined within the same file)
// ==========================================

const ChatSidebarPanel = ({
  selectedCandidate,
  searchTerm,
  setSearchTerm,
  filteredCandidates,
  handleSelectCandidate,
  lastMessages,
  unreadCounts,
  navigate,
  sidebarOpen,
  setSidebarOpen,
  setCandidateMenu,
  setCandidateMenuPos,
}) => (
  <div
    className={`${
      sidebarOpen || !selectedCandidate
        ? "flex"
        : "hidden"
    } md:flex w-full md:w-[360px] border-r border-[#e9edef] bg-white flex-col h-full flex-shrink-0`}
  >
    {/* Sidebar Header */}
    <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between border-b border-[#e9edef]">
      <div className="flex items-center gap-3">
       <button
 onClick={() => setSidebarOpen(true)}
  className="md:hidden w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md"
>
  <FaBars className="text-base" />
</button>
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
              onContextMenu={(e) => {
    e.preventDefault();
    setCandidateMenu(candidate);
    setCandidateMenuPos({
      x: e.clientX,
      y: e.clientY,
    });
  }}
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
                {lastMessages[normalizePhone(candidate.phone)]?.time && (
                  <span className="text-xs text-[#667781] font-normal ml-2 flex-shrink-0">
                    {formatMessageTime(lastMessages[normalizePhone(candidate.phone)].time)}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[13.5px] text-[#667781] truncate pr-2">
                  {lastMessages[normalizePhone(candidate.phone)]?.message || "No messages"}
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
);

// ==========================================
// MAIN COMPONENT
// ==========================================

function Conversations() {
  const navigate = useNavigate();
  
  // State Variables
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [highlightedMessage, setHighlightedMessage] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [messageMenu, setMessageMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [forwardMessage, setForwardMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedForwardCandidate, setSelectedForwardCandidate] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [sortedCandidates, setSortedCandidates] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [candidateMenu, setCandidateMenu] = useState(null);

const [candidateMenuPos, setCandidateMenuPos] = useState({
  x: 0,
  y: 0,
});

  // Refs
  const emojiRef = useRef(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Environment Variables
  const GHL_TOKEN = import.meta.env.VITE_GHL_TOKEN;
  const LOCATION_ID = import.meta.env.VITE_GHL_LOCATION_ID;

  // ==========================================
  // EFFECTS
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedCandidate) {
      loadMessages();
    }
  }, [selectedCandidate]);

  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
      async (payload) => {
  console.log("NEW MESSAGE:", payload);

  const phone = payload.new?.phone || payload.old?.phone;

  await loadCandidates();

  if (phone) {
    setSortedCandidates((prev) => {
     const found = prev.find(
  (c) => normalizePhone(c.phone) === normalizePhone(phone)
);
      if (!found) return prev;

      return [
        found,
        ...prev.filter(
  (c) => normalizePhone(c.phone) !== normalizePhone(phone)
)
      ];
    });
  }
          if (
            selectedCandidate &&
            (payload.new?.phone === selectedCandidate.phone ||
              payload.old?.phone === selectedCandidate.phone)
          ) {
            loadMessages();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [candidates, selectedCandidate]);

  useEffect(() => {
    loadCandidates();
  }, []);

  useEffect(() => {
    const savedCandidate = localStorage.getItem("selectedCandidate");
    if (savedCandidate) {
      setSelectedCandidate(JSON.parse(savedCandidate));
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchReplies();
    }, 15000);
    return () => clearInterval(interval);
  }, [selectedCandidate]);

  useEffect(() => {
    const typingChannel = supabase
      .channel("typing-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "typing_status" },
        (payload) => {
          if (
            payload.new.conversation_id === selectedCandidate?.id &&
            payload.new.user_id !== "hr"
          ) {
            setIsTyping(true);
            clearTimeout(window.typingTimer);
            window.typingTimer = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [selectedCandidate]);

  // ==========================================
  // DATA FETCHING & SYNC FUNCTIONS
  // ==========================================

const loadCandidates = async () => {
  const { data, error } = await supabase
    .from("applicants")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  setCandidates(data);
  await loadLastMessages(data);
};
   const loadMessages = async () => {
  if (!selectedCandidate) return;

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("phone", selectedCandidate.phone)
    .order("created_at", { ascending: true });

  if (error) {
    console.log(error);
    return;
  }

  const filteredData = data.filter(
    (m) => m.message !== "[DELETED_MSG]"
  );

  setMessages(filteredData);

  const pinned = filteredData.find(
    (m) => m.is_pinned === true
  );

  setPinnedMessage(pinned || null);
};

  const loadLastMessages = async (candidateList = []) => {
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
      if (msg.message === "[DELETED_MSG]") return;
    const msgPhone = normalizePhone(msg.phone);

if (!latest[msgPhone]) {
  latest[msgPhone] = {
    message: msg.message || "📎 Attachment",
    time: msg.created_at,
  };
}
    });
    setLastMessages(latest);

    const getTime = (phone) => {
  const normalized = normalizePhone(phone);
  return latest[normalized]?.time
    ? new Date(latest[normalized].time).getTime()
    : 0;
};

const sorted = [...candidateList].sort((a, b) => {
  return getTime(b.phone) - getTime(a.phone);
});
   
    console.log("SORTED =", sorted);
    console.log(
  "FIRST CANDIDATE =",
  sorted[0]?.name,
  sorted[0]?.phone
);
    setSortedCandidates(sorted);
    const counts = {};
    data.forEach((msg) => {
      if (msg.message === "[DELETED_MSG]") return;
      if (msg.sender === "candidate" && msg.is_read === false) {
        counts[msg.phone] = (counts[msg.phone] || 0) + 1;
      }
    });
    setUnreadCounts(counts);
  };

  const fetchReplies = async () => {
    if (!selectedCandidate || !selectedCandidate.contact_id) return;

    try {
      const response = await fetch(
        `https://services.leadconnectorhq.com/conversations/search?contactId=${selectedCandidate.contact_id}&locationId=${LOCATION_ID}`,
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
      if (result.conversations?.length > 0) {
        const conversation = result.conversations[0];
        const conversationId = conversation.id;
        const messagesResponse = await fetch(
          `https://services.leadconnectorhq.com/conversations/${conversationId}/messages`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${GHL_TOKEN}`,
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
          }
        );

        const messagesResult = await messagesResponse.json();
        for (const msg of messagesResult.messages.messages) {
          if (msg.direction !== "inbound") continue;
          const { data: existingGHL } = await supabase
            .from("chat_messages")
            .select("id")
            .eq("ghl_message_id", msg.id)
            .limit(1);

          if (existingGHL && existingGHL.length > 0) continue;

          await supabase.from("chat_messages").insert([
            {
              candidate_name: selectedCandidate.name,
              phone: selectedCandidate.phone,
              message: msg.body,
              sender: "candidate",
              is_read: false,
              ghl_message_id: msg.id,
            },
          ]);
         await loadCandidates();
        }
      }
    } catch (err) {
      console.log("Error fetching replies:", err);
    }
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleSelectCandidate = async (candidate) => {
    setSelectedCandidate(candidate);
    setSidebarOpen(false);
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("phone", candidate.phone)
      .eq("sender", "candidate");
    setSelectedCandidate(candidate);
    localStorage.setItem("selectedCandidate", JSON.stringify(candidate));
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      delete updated[candidate.phone];
      return updated;
    });
  };

  const sendTypingStatus = throttle(async () => {
    if (!selectedCandidate) return;
    await supabase.from("typing_status").upsert({
      conversation_id: selectedCandidate.id,
      user_id: "hr",
      last_typing_at: new Date().toISOString(),
    });
  }, 1000);

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
        body: JSON.stringify({
          type: "SMS",
          contactId: contactId,
          message: message,
        }),
      });
    } catch (error) {
      console.log("SMS Error:", error);
    }
  };

  const sendVoiceMessage = async (audioUrl, contactId) => {
    try {
      await fetch("https://services.leadconnectorhq.com/conversations/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SMS",
          contactId: contactId,
          message: "📩 Voice Mail",
        }),
      });
    } catch (error) {
      console.log("Voice message error", error);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (editingMessage) {
      const { error } = await supabase
        .from("chat_messages")
        .update({
          message: newMessage,
          is_edited: true,
        })
        .eq("id", editingMessage.id);
      if (error) {
        console.log(error);
        return;
      }
      setEditingMessage(null);
      setNewMessage("");
      loadMessages();
loadLastMessages(candidates);
      return;
    }

    let fileUrl = "";
    if (selectedFile) {
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, selectedFile);
      if (uploadError) {
        alert(uploadError.message);
        return;
      }
      const { data } = supabase.storage.from("chat-files").getPublicUrl(fileName);
      fileUrl = data.publicUrl;
    }
    const { error } = await supabase.from("chat_messages").insert([
      {
        candidate_name: selectedCandidate.name,
        phone: selectedCandidate.phone,
        message: newMessage,
        file_url: fileUrl,
        sender: "hr",
        is_read: true,
        delivery_status: "sent",
        reply_to_id: replyMessage?.id || null,
        reply_text: replyMessage?.message || null,
      },
    ]);
    loadLastMessages(candidates);

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
    await supabase
      .from("chat_messages")
      .update({ delivery_status: "delivered" })
      .eq("phone", selectedCandidate.phone)
      .eq("message", newMessage);
    setNewMessage("");
    setReplyMessage(null);
    setSelectedFile(null);
    loadMessages();
    await loadCandidates();
   setSortedCandidates((prev) => {
  const current = prev.find(
    (c) =>
      normalizePhone(c.phone) ===
      normalizePhone(selectedCandidate.phone)
  );

  if (!current) return prev;

  return [
    current,
    ...prev.filter(
      (c) =>
        normalizePhone(c.phone) !==
        normalizePhone(selectedCandidate.phone)
    ),
  ];
});
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
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
      const { error } = await supabase.storage
        .from("chat-files")
        .upload(fileName, audioBlob);
      if (error) {
        console.log(error);
        return;
      }
      const { data } = supabase.storage.from("chat-files").getPublicUrl(fileName);

      await supabase.from("chat_messages").insert([
        {
          candidate_name: selectedCandidate.name,
          phone: selectedCandidate.phone,
          file_url: data.publicUrl,
          sender: "hr",
          is_read: true,
          message: "📩 Voice Mail",
          message_type: "voicemail",
        },
      ]);
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
      await sendVoiceMessage(data.publicUrl, contactId);
      loadMessages();
    };
    recorder.stop();
    setIsRecording(false);
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleForward = async () => {
    if (!forwardMessage || !selectedForwardCandidate) {
      alert("Select a candidate");
      return;
    }
    const { error } = await supabase.from("chat_messages").insert([
      {
        candidate_name: selectedForwardCandidate.name,
        phone: selectedForwardCandidate.phone,
        message: forwardMessage.message,
        file_url: forwardMessage.file_url || "",
        sender: "hr",
        is_read: true,
      },
    ]);

    if (error) {
      console.log(error);
      return;
    }
    alert("Message Forwarded");
    setShowForwardModal(false);
    setForwardMessage(null);
    setSelectedForwardCandidate(null);
    loadLastMessages(candidates);
  };

  const handlePinMessage = async (msg) => {
    if (!selectedCandidate) return;
    await supabase
      .from("chat_messages")
      .update({ is_pinned: false })
      .eq("phone", selectedCandidate.phone);
    await supabase
      .from("chat_messages")
      .update({ is_pinned: true })
      .eq("id", msg.id);
    setPinnedMessage(msg);
    loadMessages();
  };

  const handleDelete = async (id) => {
    const msgToDelete = messages.find((m) => m.id === id);
    if (msgToDelete?.ghl_message_id) {
      const { error } = await supabase
        .from("chat_messages")
        .update({ message: "[DELETED_MSG]", file_url: null })
        .eq("id", id);
      if (error) {
        console.log(error);
        return;
      }
    } else {
      const { error } = await supabase.from("chat_messages").delete().eq("id", id);
      if (error) {
        console.log(error);
        return;
      }
    }
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };
const handleDeleteCandidate = async (candidate) => {
  if (!candidate) return;

  if (
    !window.confirm(
      `Delete ${candidate.name} and all chat messages?`
    )
  ) {
    return;
  }

  await supabase
    .from("chat_messages")
    .delete()
    .eq("phone", candidate.phone);

  await supabase
    .from("applicants")
    .delete()
    .eq("id", candidate.id);

  if (selectedCandidate?.id === candidate.id) {
    setSelectedCandidate(null);
    localStorage.removeItem("selectedCandidate");
  }

  setCandidateMenu(null);
  await loadCandidates();
};
  const handleClearChat = async () => {
    if (!selectedCandidate) return;
    if (
      !window.confirm(
        `Are you sure you want to clear all messages for ${selectedCandidate.name}?`
      )
    )
      return;
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
        const senderName =
          msg.sender === "hr" ? "You (HR)" : selectedCandidate.name;
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
    link.download = `chat_with_${selectedCandidate.name.replace(
      /\s+/g,
      "_"
    )}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowMenu(false);
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
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      <Sidebar />
    
      <div className="md:ml-56 h-screen flex overflow-hidden bg-[#eae6df] relative w-full">
        {/* Chat Sidebar */}
     <ChatSidebarPanel
  selectedCandidate={selectedCandidate}
  searchTerm={searchTerm}
  setSearchTerm={setSearchTerm}
  filteredCandidates={filteredCandidates}
  handleSelectCandidate={handleSelectCandidate}
  lastMessages={lastMessages}
  unreadCounts={unreadCounts}
  navigate={navigate}
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
  setCandidateMenu={setCandidateMenu}
setCandidateMenuPos={setCandidateMenuPos}
/>
{candidateMenu && (
  <>
    <div
      className="fixed inset-0 z-[9998]"
      onClick={() => setCandidateMenu(null)}
    />

    <div
      className="fixed bg-white shadow-xl rounded-lg border z-[9999] min-w-[190px]"
      style={{
        left: candidateMenuPos.x,
        top: candidateMenuPos.y,
      }}
    >
      <button
        onClick={() => handleDeleteCandidate(candidateMenu)}
        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-500 font-medium"
      >
        🗑️ Delete Candidate
      </button>
    </div>
  </>
)}

        {/* Main Chat Area */}
        <div
          className={`${
            !selectedCandidate ? "hidden md:flex" : "flex"
          } flex-1 min-w-0 bg-[#efeae2] flex-col h-full relative`}
        >
          {selectedCandidate ? (
            <div className="w-full h-full flex flex-col bg-transparent">
              {/* Chat Header */}
              <div className="sticky top-0 z-20 h-[60px] bg-[#f0f2f5] border-b border-[#e9edef] px-4 py-2 flex items-center justify-between flex-shrink-0 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                   onClick={() => {
  setSelectedCandidate(null);
  setSidebarOpen(true);
  localStorage.removeItem("selectedCandidate");
}}
                    className="md:hidden text-[#667781] hover:text-[#111b21] mr-1"
                  >
                    <FaArrowLeft className="text-lg" />
                  </button>

                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(
                      selectedCandidate.name
                    )} flex items-center justify-center text-white font-bold text-base shadow-sm`}
                  >
                    {selectedCandidate.name?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-[#111b21] text-[15.5px] truncate">
                      {selectedCandidate.name}
                    </h2>
                    <p className="text-[#667781] text-[12px] truncate mt-0.5">
                      {selectedCandidate.phone || selectedCandidate.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors"
                    title="Call candidate"
                  >
                    <FaPhone className="text-base" />
                  </button>
                  <button
                    onClick={() => setShowChatSearch(!showChatSearch)}
                    className="p-2 hover:bg-gray-200 text-[#667781] rounded-full transition-colors"
                    title="Search Messages"
                  >
                    <FaSearch />
                  </button>

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
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-150 py-1.5 w-56 z-40 animate-fade-in origin-top-right">
                          <button
                            onClick={handleClearChat}
                            className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <FaTrash className="text-gray-400 text-xs" /> Clear
                            Chat
                          </button>
                          <button
                            onClick={() => {
                              navigate("/candidate-details", {
                                state: selectedCandidate,
                              });
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                              i
                            </div>{" "}
                            Candidate Details
                          </button>
                          <button
                            onClick={handleExportChat}
                            className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                          >
                            <span className="text-gray-400 text-xs">📄</span> Export
                            Chat History
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => setShowMenu(false)}
                            className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                          >
                            <span>✕</span> Close Menu
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Search Bar */}
              {showChatSearch && (
                <div className="bg-white border-b px-4 py-2">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 outline-none"
                  />
                </div>
              )}

              {/* Pinned Message */}
              {pinnedMessage && (
                <div
                  onClick={() => {
                    const element = document.getElementById(
                      `msg-${pinnedMessage.id}`
                    );
                    element?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                    setHighlightedMessage(pinnedMessage.id);
                    setTimeout(() => {
                      setHighlightedMessage(null);
                    }, 2000);
                  }}
                  className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 cursor-pointer"
                >
                  <span>📌</span>
                  <div className="flex-1 truncate text-sm">
                    {pinnedMessage.message}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await supabase
                        .from("chat_messages")
                        .update({ is_pinned: false })
                        .eq("id", pinnedMessage.id);
                      setPinnedMessage(null);
                      loadMessages();
                    }}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Chat Messages Area */}
              <div
                className="flex-1 p-4 overflow-y-auto max-w-full"
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
                      {(chatSearch.trim()
                        ? group.messages.filter((msg) =>
                            msg.message
                              ?.toLowerCase()
                              .includes(chatSearch.toLowerCase())
                          )
                        : group.messages
                      ).map((msg) => {
                        const msgTime = new Date(msg.created_at).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        );
                        const isHR = msg.sender === "hr";

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${
                              isHR ? "justify-end" : "justify-start"
                            } mb-2 group relative`}
                          >
                            <div
                              id={`msg-${msg.id}`}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setMenuPosition({ x: e.clientX, y: e.clientY });
                                setMessageMenu(msg.id);
                              }}
                              className={`relative max-w-[85%] md:max-w-[65%] px-3 py-1.5 rounded-lg shadow-sm text-[14.2px] leading-relaxed break-words transition-all duration-500 ${
                                highlightedMessage === msg.id
                                  ? "ring-4 ring-yellow-400"
                                  : ""
                              } ${
                                isHR
                                  ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-none"
                                  : "bg-white text-[#111b21] rounded-tl-none"
                              }`}
                            >
                              {msg.is_pinned && (
                                <span className="absolute top-1 right-2 text-gray-500 text-xs">
                                  📌
                                </span>
                              )}
                              <div className="pr-12 pb-1 text-[#111b21]">
                                {msg.reply_text && (
                                  <div className="bg-black/10 border-l-4 border-green-500 rounded px-2 py-1 mb-2">
                                    <p className="text-xs text-green-700 font-semibold">
                                      Reply
                                    </p>
                                    <p className="text-xs text-gray-700 truncate">
                                      {msg.reply_text}
                                    </p>
                                  </div>
                                )}
                                {msg.message_type === "voicemail" ? (
                                  <div className="flex items-center gap-2">
                                    <span>📩</span>
                                    <audio controls className="w-full max-w-[220px]">
                                      <source src={msg.file_url} type="audio/webm" />
                                    </audio>
                                  </div>
                                ) : (
                                  <>
                                    <span
                                      className={
                                        chatSearch &&
                                        msg.message
                                          ?.toLowerCase()
                                          .includes(chatSearch.toLowerCase())
                                          ? "bg-yellow-300 px-1 rounded"
                                          : ""
                                      }
                                    >
                                      {msg.message}
                                    </span>
                                    {msg.file_url && (
                                      <div className="mt-2 p-2 rounded bg-black/5 flex items-center gap-2">
                                        <FaPaperclip className="text-gray-500 text-xs" />
                                        <a
                                          href={msg.file_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="underline text-blue-600"
                                        >
                                          Open Attachment
                                        </a>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9.5px] text-[#667781] select-none">
                                {msg.is_edited && (
                                  <span className="text-[10px] italic mr-1">
                                    edited
                                  </span>
                                )}
                                <span>{msgTime}</span>
                                {isHR && (
                                  <span className="ml-1">
                                    {msg.delivery_status === "sent" && "✓"}
                                    {msg.delivery_status === "delivered" && "✓✓"}
                                    {msg.delivery_status === "read" && "✓✓"}
                                  </span>
                                )}
                              </div>
                              {messageMenu === msg.id && (
                                <div
                                  className="fixed bg-white shadow-xl rounded-lg border z-[9999] min-w-[180px]"
                                  style={{
                                    left: menuPosition.x,
                                    top: menuPosition.y,
                                  }}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setForwardMessage(msg);
                                      setShowForwardModal(true);
                                      setMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                                  >
                                    Forward
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReplyMessage(msg);
                                      setMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                                  >
                                    ↩️ Reply
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handlePinMessage(msg);
                                      setMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                                  >
                                    📌 Pin Message
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMessage(msg);
                                      setNewMessage(msg.message || "");
                                      setMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100"
                                  >
                                    ✏️ Edit Message
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(msg.id);
                                      setMessageMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
                                  >
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
                    <div className="bg-white p-4 rounded-xl shadow-sm text-center max-w-xs border border-gray-150">
                      <p className="text-[#667781] text-sm">
                        No message history. Send a message to start the conversation!
                      </p>
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">
                    Candidate is typing...
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
              <div ref={emojiRef}>
                {showEmojiPicker && (
                  <div className="absolute bottom-20 left-4 z-50">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
              {editingMessage && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 px-3 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-yellow-700 font-semibold">
                      ✏️ Editing Message
                    </p>
                    <p className="text-sm text-gray-700 truncate max-w-md">
                      {editingMessage.message}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMessage(null);
                      setNewMessage("");
                    }}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
              {replyMessage && (
                <div className="bg-white border-l-4 border-green-500 px-3 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-green-600 font-semibold">
                      Replying to
                    </p>
                    <p className="text-sm text-gray-700 truncate max-w-md">
                      {replyMessage.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyMessage(null)}
                    className="text-red-500 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="sticky bottom-0 w-full p-3 bg-[#f0f2f5] flex items-center gap-3 border-t border-[#e9edef] flex-shrink-0">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-[#667781] hover:text-[#111b21] text-xl p-1.5 rounded-full hover:bg-gray-200 transition-colors"
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
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    sendTypingStatus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  className="w-full flex-1 bg-white rounded-lg px-4 py-2 outline-none text-[15px] border-none placeholder-[#667781] text-[#111b21]"
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
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`text-xl p-1.5 rounded-full transition-colors ${
                      isRecording ? "text-red-500" : "text-[#667781]"
                    }`}
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
                Select an applicant from the list to view their chat history and
                send messages in real-time.
              </p>
            </div>
          )}

          {/* Forward Message Modal */}
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
                      className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${
                        selectedForwardCandidate?.id === candidate.id
                          ? "bg-green-100"
                          : ""
                      }`}
                    >
                      {candidate.name}
                    </div>
                  ))}
                </div>
                <div className="p-4 flex justify-end gap-2">
                  <button
                    onClick={() => setShowForwardModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForward}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Send
                  </button>
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