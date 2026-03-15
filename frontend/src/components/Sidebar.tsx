"use client";

import { useAuthStore } from "@/stores/authStore";
import { useChatStore, Conversation } from "@/stores/chatStore";
import { FiPlus, FiTrash2, FiLogOut, FiMessageSquare } from "react-icons/fi";

interface Props {
  onClose: () => void;
}

export default function Sidebar({ onClose }: Props) {
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const {
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    newChat,
  } = useChatStore();

  const handleSelect = (id: string) => {
    selectConversation(token, id);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(token, id);
  };

  const handleNewChat = () => {
    newChat();
    onClose();
  };

  return (
    <div className="w-72 h-full flex flex-col" style={{ background: "#060a10", borderRight: "1px solid rgba(0,212,170,0.1)" }}>
      {/* Header */}
      <div className="p-4" style={{ borderBottom: "1px solid rgba(0,212,170,0.08)" }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-bold tracking-wide" style={{ color: "#e0f0ec" }}>QUANT MIND</span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded font-mono" style={{ background: "rgba(0,212,170,0.1)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.15)" }}>PRO</span>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium"
          style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)", color: "#00d4aa" }}
          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.15)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.3)"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.08)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.15)"; }}
        >
          <FiPlus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Sessions label */}
      <div className="px-4 pt-3 pb-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(0,212,170,0.35)" }}>Sessions</span>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto py-1 px-2">
        {conversations.length === 0 ? (
          <div className="text-center mt-8 px-4">
            <p className="text-xs" style={{ color: "rgba(200,220,215,0.3)" }}>No analysis sessions yet</p>
            <p className="text-[10px] mt-1" style={{ color: "rgba(200,220,215,0.2)" }}>Start a new session above</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelect(conv.id)}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-lg mb-0.5 cursor-pointer transition-all duration-150"
              style={{
                background: activeConversationId === conv.id ? "rgba(0,212,170,0.08)" : "transparent",
                borderLeft: activeConversationId === conv.id ? "2px solid #00d4aa" : "2px solid transparent",
                color: activeConversationId === conv.id ? "#e0f0ec" : "rgba(200,220,215,0.5)",
              }}
              onMouseOver={(e) => { if (activeConversationId !== conv.id) e.currentTarget.style.background = "rgba(0,212,170,0.04)"; }}
              onMouseOut={(e) => { if (activeConversationId !== conv.id) e.currentTarget.style.background = "transparent"; }}
            >
              <FiMessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
              <span className="flex-1 truncate text-sm">{conv.title}</span>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 transition"
                style={{ color: "rgba(200,220,215,0.3)" }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#ff6b6b"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "rgba(200,220,215,0.3)"; }}
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* User section */}
      <div className="p-4" style={{ borderTop: "1px solid rgba(0,212,170,0.08)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.15)" }}>
            <span className="text-xs font-bold" style={{ color: "#00d4aa" }}>
              {(user?.full_name || user?.email || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate" style={{ color: "#e0f0ec" }}>{user?.full_name || "Analyst"}</p>
            <p className="text-[10px] truncate font-mono" style={{ color: "rgba(200,220,215,0.3)" }}>{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="transition"
            title="Logout"
            style={{ color: "rgba(200,220,215,0.3)" }}
            onMouseOver={(e) => { e.currentTarget.style.color = "#ff6b6b"; }}
            onMouseOut={(e) => { e.currentTarget.style.color = "rgba(200,220,215,0.3)"; }}
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
