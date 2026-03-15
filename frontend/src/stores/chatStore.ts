import { create } from "zustand";
import {
  apiGetConversations,
  apiGetConversation,
  apiDeleteConversation,
  apiSendMessage,
  apiUploadAndChat,
} from "@/lib/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Message[];
  streaming: boolean;
  streamingContent: string;
  webSearch: boolean;
  error: string | null;

  loadConversations: (token: string) => Promise<void>;
  selectConversation: (token: string, id: string) => Promise<void>;
  deleteConversation: (token: string, id: string) => Promise<void>;
  newChat: () => void;
  sendMessage: (token: string, message: string) => Promise<void>;
  uploadFile: (token: string, file: File, message: string) => Promise<void>;
  setWebSearch: (enabled: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  streaming: false,
  streamingContent: "",
  webSearch: false,
  error: null,

  loadConversations: async (token) => {
    try {
      const convos = await apiGetConversations(token);
      set({ conversations: convos });
    } catch { /* ignore */ }
  },

  selectConversation: async (token, id) => {
    set({ activeConversationId: id, messages: [], error: null });
    try {
      const data = await apiGetConversation(token, id);
      set({ messages: data.messages || [] });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  deleteConversation: async (token, id) => {
    try {
      await apiDeleteConversation(token, id);
      const { activeConversationId } = get();
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        ...(activeConversationId === id ? { activeConversationId: null, messages: [] } : {}),
      }));
    } catch { /* ignore */ }
  },

  newChat: () => {
    set({ activeConversationId: null, messages: [], streamingContent: "", error: null });
  },

  sendMessage: async (token, message) => {
    const { activeConversationId, webSearch } = get();

    // Add user message optimistically
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true, streamingContent: "", error: null }));

    await apiSendMessage(
      token,
      message,
      activeConversationId,
      webSearch,
      // onChunk
      (chunk) => {
        set((s) => ({ streamingContent: s.streamingContent + chunk }));
      },
      // onDone
      (conversationId, title) => {
        const content = get().streamingContent;
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          created_at: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, assistantMsg],
          streaming: false,
          streamingContent: "",
          activeConversationId: conversationId,
        }));

        // Update conversations list
        if (title) {
          set((s) => {
            const exists = s.conversations.find((c) => c.id === conversationId);
            if (exists) {
              return {
                conversations: s.conversations.map((c) =>
                  c.id === conversationId ? { ...c, title, updated_at: new Date().toISOString() } : c
                ),
              };
            }
            return {
              conversations: [
                { id: conversationId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                ...s.conversations,
              ],
            };
          });
        }
      },
      // onError
      (error) => {
        set({ streaming: false, streamingContent: "", error });
      },
    );
  },

  uploadFile: async (token, file, message) => {
    const { activeConversationId } = get();

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: `[Uploaded file: ${file.name}]\n\n${message}`,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], streaming: true, streamingContent: "", error: null }));

    await apiUploadAndChat(
      token,
      file,
      message,
      activeConversationId,
      (chunk) => {
        set((s) => ({ streamingContent: s.streamingContent + chunk }));
      },
      (conversationId, title) => {
        const content = get().streamingContent;
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content,
          created_at: new Date().toISOString(),
        };
        set((s) => ({
          messages: [...s.messages, assistantMsg],
          streaming: false,
          streamingContent: "",
          activeConversationId: conversationId,
        }));

        if (title) {
          set((s) => ({
            conversations: [
              { id: conversationId, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
              ...s.conversations,
            ],
          }));
        }
      },
      (error) => {
        set({ streaming: false, streamingContent: "", error });
      },
    );
  },

  setWebSearch: (enabled) => set({ webSearch: enabled }),
}));
