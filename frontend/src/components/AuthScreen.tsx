"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { FiZap, FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const { login, register, googleLogin, loading, error } = useAuthStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleCallback = useCallback(
    (response: { credential: string }) => {
      googleLogin(response.credential);
    },
    [googleLogin]
  );

  useEffect(() => {
    const initGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleCallback,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: "100%",
          shape: "rectangular",
          text: "continue_with",
        });
      }
    };

    // Google script may already be loaded or still loading
    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password, fullName);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center px-4">
      {/* Nebula glows */}
      <div className="nebula nebula-1" />
      <div className="nebula nebula-2" />
      <div className="nebula nebula-3" />

      {/* Perspective grid */}
      <div className="cyber-grid" />

      {/* Floating particles */}
      <div className="particle-field">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${(i * 3.3 + 5) % 100}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              animationDuration: `${4 + (i % 7) * 1.5}s`,
              animationDelay: `${-(i * 0.7)}s`,
              opacity: 0.3 + (i % 4) * 0.15,
            }}
          />
        ))}
      </div>

      {/* Expanding rings */}
      <div className="ring-container">
        <div className="ring" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="auth-logo inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6">
            <FiZap className="w-10 h-10" style={{ color: "#00e5ff" }} />
          </div>
          <h1 className="auth-title auth-title-glow glitch-text text-4xl font-bold tracking-wider">
            Quant Mind AI
          </h1>
          <p className="auth-subtitle mt-4 font-semibold">
            Elite Quantitative Analysis Engine
          </p>
        </div>

        {/* Form Card */}
        <div className="auth-card rounded-2xl p-8">
          {/* Corner accents */}
          <div className="corner-accent corner-tl" />
          <div className="corner-accent corner-tr" />
          <div className="corner-accent corner-bl" />
          <div className="corner-accent corner-br" />

          <h2
            className="text-xl font-semibold mb-1 tracking-wide"
            style={{ color: "#e0f7fa" }}
          >
            {isLogin ? "[ WELCOME BACK ]" : "[ CREATE ACCOUNT ]"}
          </h2>
          <p
            className="text-xs mb-8 tracking-widest uppercase"
            style={{ color: "rgba(0,200,220,0.4)" }}
          >
            {isLogin
              ? "Authenticate to access your terminal"
              : "Initialize your quant engine"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div
                className="auth-form-group"
                style={{ animationDelay: "0.1s" }}
              >
                <label
                  className="block text-xs font-medium mb-2 uppercase tracking-widest"
                  style={{ color: "rgba(0,200,220,0.5)" }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <FiUser
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: "rgba(0,200,220,0.35)" }}
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input w-full pl-11 pr-4 py-3.5 rounded-lg focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div
              className="auth-form-group"
              style={{ animationDelay: isLogin ? "0.1s" : "0.2s" }}
            >
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: "rgba(0,200,220,0.5)" }}
              >
                Email
              </label>
              <div className="relative">
                <FiMail
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(0,200,220,0.35)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input w-full pl-11 pr-4 py-3.5 rounded-lg focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div
              className="auth-form-group"
              style={{ animationDelay: isLogin ? "0.2s" : "0.3s" }}
            >
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-widest"
                style={{ color: "rgba(0,200,220,0.5)" }}
              >
                Password
              </label>
              <div className="relative">
                <FiLock
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(0,200,220,0.35)" }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input w-full pl-11 pr-4 py-3.5 rounded-lg focus:outline-none"
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs uppercase tracking-wider"
                style={{
                  background: "rgba(255,50,50,0.08)",
                  border: "1px solid rgba(255,50,50,0.2)",
                  color: "#ff6b6b",
                }}
              >
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-btn w-full py-3.5 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  AUTHENTICATING...
                </span>
              ) : (
                <>
                  {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                  <FiArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,255,255,0.2), transparent)",
                }}
              />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-[10px] uppercase tracking-[0.2em]"
                style={{ color: "rgba(0,200,220,0.3)", background: "rgba(5,5,20,0.9)" }}
              >
                or
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <div ref={googleBtnRef} />
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(0,255,255,0.2), transparent)",
                }}
              />
            </div>
          </div>

          <p
            className="text-center text-xs uppercase tracking-wider"
            style={{ color: "rgba(0,200,220,0.35)" }}
          >
            {isLogin ? "No account yet? " : "Already registered? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                useAuthStore.setState({ error: null });
              }}
              className="font-semibold transition-all duration-200"
              style={{ color: "#00e5ff" }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "#80deea";
                e.currentTarget.style.textShadow = "0 0 10px rgba(0,255,255,0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "#00e5ff";
                e.currentTarget.style.textShadow = "none";
              }}
            >
              {isLogin ? "SIGN UP" : "SIGN IN"}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p
          className="text-center text-[10px] mt-8 uppercase tracking-[0.25em]"
          style={{ color: "rgba(0,200,220,0.2)" }}
        >
          ◆ Quant Engine v3.0 · GPT-4o · Encrypted ◆
        </p>
      </div>
    </div>
  );
}
