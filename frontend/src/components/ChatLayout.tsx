"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import { FiMenu } from "react-icons/fi";

export default function ChatLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const token = useAuthStore((s) => s.token)!;
  const loadConversations = useChatStore((s) => s.loadConversations);

  useEffect(() => {
    loadConversations(token);
  }, [token, loadConversations]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080b12" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-30 h-full transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center px-4 py-3" style={{ borderBottom: "1px solid rgba(0,212,170,0.08)" }}>
          <button onClick={() => setSidebarOpen(true)} style={{ color: "rgba(200,220,215,0.4)" }}>
            <FiMenu className="w-5 h-5" />
          </button>
          <div className="ml-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="2">
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
            <span className="text-sm font-bold tracking-wide" style={{ color: "#e0f0ec" }}>QUANT MIND</span>
          </div>
        </div>

        <ChatArea />
      </div>
    </div>
  );
}
