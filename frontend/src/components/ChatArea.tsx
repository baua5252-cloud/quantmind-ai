"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import ChatMessage from "./ChatMessage";
import { FiSend, FiPaperclip, FiGlobe } from "react-icons/fi";

const SUGGESTIONS = [
  { icon: "📈", text: "Price a European call option using Black-Scholes" },
  { icon: "🐍", text: "Build a momentum trading strategy in Python" },
  { icon: "📊", text: "Calculate VaR and CVaR for a portfolio" },
  { icon: "⚡", text: "Optimize a portfolio using Mean-Variance" },
];

export default function ChatArea() {
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const token = useAuthStore((s) => s.token)!;
  const { messages, streaming, streamingContent, webSearch, setWebSearch, sendMessage, uploadFile, error } =
    useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSend = async () => {
    if (streaming) return;
    const msg = input.trim();
    if (!msg && !selectedFile) return;
    setInput("");
    if (selectedFile) {
      await uploadFile(token, selectedFile, msg || "Analyze this file.");
      setSelectedFile(null);
    } else {
      await sendMessage(token, msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const isEmpty = messages.length === 0 && !streaming;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "#080b12" }}>
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            {/* Quant Logo */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.5">
                <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
                <polyline points="16,7 22,7 22,13" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#e0f0ec" }}>Quant Mind AI</h2>
            <p className="text-center max-w-md mb-2 text-sm" style={{ color: "rgba(200,220,215,0.5)" }}>
              Your elite quantitative analyst. Derivatives pricing, portfolio optimization, algorithmic trading, and production-ready code.
            </p>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(0,212,170,0.08)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.12)" }}>GPT-4o</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(0,212,170,0.08)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.12)" }}>Low Temp</span>
              <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(0,212,170,0.08)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.12)" }}>8K Tokens</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  onClick={() => setInput(s.text)}
                  className="text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 group"
                  style={{ background: "rgba(0,212,170,0.04)", border: "1px solid rgba(0,212,170,0.08)", color: "rgba(200,220,215,0.6)" }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.08)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.2)"; e.currentTarget.style.color = "#e0f0ec"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.04)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.08)"; e.currentTarget.style.color = "rgba(200,220,215,0.6)"; }}
                >
                  <span className="mr-2">{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {streaming && streamingContent && (
              <ChatMessage
                message={{ id: "streaming", role: "assistant", content: streamingContent, created_at: new Date().toISOString() }}
                isStreaming
              />
            )}

            {streaming && !streamingContent && (
              <div className="flex gap-1.5 py-4 pl-12">
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#00d4aa", animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#00d4aa", animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#00d4aa", animationDelay: "300ms" }} />
              </div>
            )}

            {error && (
              <div className="text-sm rounded-lg px-4 py-3 mt-2" style={{ color: "#ff6b6b", background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.1)" }}>
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(0,212,170,0.08)" }}>
        <div className="max-w-3xl mx-auto">
          {selectedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg w-fit" style={{ background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.12)" }}>
              <FiPaperclip className="w-3.5 h-3.5" style={{ color: "#00d4aa" }} />
              <span className="text-xs font-mono" style={{ color: "#00d4aa" }}>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="ml-1 text-xs" style={{ color: "rgba(0,212,170,0.5)" }}>✕</button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-lg transition-all duration-200"
              title="Upload file"
              style={{ color: "rgba(200,220,215,0.35)" }}
              onMouseOver={(e) => { e.currentTarget.style.color = "#00d4aa"; e.currentTarget.style.background = "rgba(0,212,170,0.08)"; }}
              onMouseOut={(e) => { e.currentTarget.style.color = "rgba(200,220,215,0.35)"; e.currentTarget.style.background = "transparent"; }}
            >
              <FiPaperclip className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept=".pdf,.docx,.csv,.xlsx,.xls,.txt,.md,.json,.py,.js,.ts,.html,.css,.png,.jpg,.jpeg,.gif,.webp" className="hidden" />

            <button
              onClick={() => setWebSearch(!webSearch)}
              className="p-2.5 rounded-lg transition-all duration-200"
              title={webSearch ? "Web search enabled" : "Enable web search"}
              style={{
                color: webSearch ? "#00d4aa" : "rgba(200,220,215,0.35)",
                background: webSearch ? "rgba(0,212,170,0.1)" : "transparent",
                border: webSearch ? "1px solid rgba(0,212,170,0.2)" : "1px solid transparent",
              }}
              onMouseOver={(e) => { if (!webSearch) { e.currentTarget.style.color = "#00d4aa"; e.currentTarget.style.background = "rgba(0,212,170,0.08)"; } }}
              onMouseOut={(e) => { if (!webSearch) { e.currentTarget.style.color = "rgba(200,220,215,0.35)"; e.currentTarget.style.background = "transparent"; } }}
            >
              <FiGlobe className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the quant analyst..."
                rows={1}
                className="w-full px-4 py-3 rounded-lg resize-none transition-all duration-200 focus:outline-none"
                style={{
                  background: "rgba(0,212,170,0.03)",
                  border: "1px solid rgba(0,212,170,0.1)",
                  color: "#e0f0ec",
                  fontSize: "0.9rem",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,170,0.3)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,212,170,0.06)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,170,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                disabled={streaming}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={streaming || (!input.trim() && !selectedFile)}
              className="p-2.5 rounded-lg transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
              style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.25)", color: "#00d4aa" }}
              onMouseOver={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.background = "rgba(0,212,170,0.25)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,212,170,0.15)"; } }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,212,170,0.15)"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[10px] text-center mt-2 font-mono" style={{ color: "rgba(200,220,215,0.2)" }}>
            Quant Mind AI · GPT-4o · Verify all calculations independently
          </p>
        </div>
      </div>
    </div>
  );
}
