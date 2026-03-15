"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import AuthScreen from "@/components/AuthScreen";
import ChatLayout from "@/components/ChatLayout";

export default function Home() {
  const { token, initializing, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050510" }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8" style={{ color: "#00e5ff" }} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "rgba(0,200,220,0.4)" }}>Initializing...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return <ChatLayout />;
}
