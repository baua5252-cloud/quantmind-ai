const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// --- Auth ---
export async function apiRegister(email: string, password: string, fullName: string) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Login failed" }));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function apiGetMe(token: string) {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function apiGoogleLogin(credential: string) {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Google login failed" }));
    throw new Error(err.detail || "Google login failed");
  }
  return res.json();
}

// --- Conversations ---
export async function apiGetConversations(token: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function apiGetConversation(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function apiDeleteConversation(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/chat/conversations/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
}

// --- Chat (streaming) ---
export async function apiSendMessage(
  token: string,
  message: string,
  conversationId: string | null,
  webSearch: boolean,
  onChunk: (chunk: string) => void,
  onDone: (conversationId: string, title?: string | null) => void,
  onError: (error: string) => void,
) {
  const res = await fetch(`${API_BASE}/api/chat/send`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      web_search: webSearch,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to send message" }));
    onError(err.detail || "Failed to send message");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) { onError("No response stream"); return; }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "chunk") onChunk(data.content);
          else if (data.type === "done") onDone(data.conversation_id, data.title);
          else if (data.type === "error") onError(data.content);
        } catch { /* skip malformed JSON */ }
      }
    }
  }
}

// --- File Upload (streaming) ---
export async function apiUploadAndChat(
  token: string,
  file: File,
  message: string,
  conversationId: string | null,
  onChunk: (chunk: string) => void,
  onDone: (conversationId: string, title?: string | null) => void,
  onError: (error: string) => void,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("message", message);
  if (conversationId) formData.append("conversation_id", conversationId);

  const res = await fetch(`${API_BASE}/api/files/upload-and-chat`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    onError(err.detail || "Upload failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) { onError("No response stream"); return; }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "chunk") onChunk(data.content);
          else if (data.type === "done") onDone(data.conversation_id, data.title);
          else if (data.type === "error") onError(data.content);
        } catch { /* skip malformed */ }
      }
    }
  }
}
