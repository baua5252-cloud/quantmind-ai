"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FiUser, FiCopy, FiCheck } from "react-icons/fi";
import { useState } from "react";
import type { Message } from "@/stores/chatStore";

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1"
        style={{
          background: isUser ? "rgba(0,212,170,0.08)" : "rgba(0,212,170,0.06)",
          border: `1px solid ${isUser ? "rgba(0,212,170,0.15)" : "rgba(0,212,170,0.1)"}`,
        }}
      >
        {isUser ? (
          <FiUser className="w-4 h-4" style={{ color: "#00d4aa" }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" strokeWidth="1.5">
            <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
            <polyline points="16,7 22,7 22,13" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-wider mb-1.5" style={{ color: isUser ? "rgba(200,220,215,0.4)" : "rgba(0,212,170,0.5)" }}>
          {isUser ? "You" : "Quant Mind"}
        </p>
        <div
          className={`prose prose-invert max-w-none leading-relaxed ${
            isStreaming ? "streaming-cursor" : ""
          }`}
          style={{ color: "rgba(220,235,230,0.85)" }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const codeStr = String(children).replace(/\n$/, "");
                const codeId = `code-${codeStr.slice(0, 20)}`;

                if (match) {
                  return (
                    <div className="relative group my-3">
                      <div className="flex items-center justify-between px-4 py-2 rounded-t-lg" style={{ background: "#0a1018", borderBottom: "1px solid rgba(0,212,170,0.08)" }}>
                        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(0,212,170,0.5)" }}>{match[1]}</span>
                        <button
                          onClick={() => handleCopy(codeStr, codeId)}
                          className="transition-all duration-200"
                          style={{ color: "rgba(200,220,215,0.3)" }}
                          onMouseOver={(e) => { e.currentTarget.style.color = "#00d4aa"; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = "rgba(200,220,215,0.3)"; }}
                        >
                          {copied === codeId ? (
                            <FiCheck className="w-3.5 h-3.5" style={{ color: "#00d4aa" }} />
                          ) : (
                            <FiCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                          background: "#0d1520",
                          border: "1px solid rgba(0,212,170,0.06)",
                          borderTop: "none",
                        }}
                      >
                        {codeStr}
                      </SyntaxHighlighter>
                    </div>
                  );
                }

                return (
                  <code
                    className="px-1.5 py-0.5 rounded text-sm"
                    style={{ background: "rgba(0,212,170,0.08)", color: "#34ebc6" }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
