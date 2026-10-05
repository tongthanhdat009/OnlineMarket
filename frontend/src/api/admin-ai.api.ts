import { apiClient } from "../lib/api-client";

export interface AdminChatSession {
  SessionId: number;
  Title: string;
  Summary?: string | null;
  SummaryMessageCount: number;
  CreatedAt: string;
  UpdatedAt: string;
  Messages: Array<{ Role: string; Content: string }>;
}

export interface AdminChatEvent {
  Type: string;
  Text?: string | null;
  Error?: string | null;
  SessionId?: number | null;
}

export const adminAiApi = {
  sessions: (): Promise<AdminChatSession[]> => apiClient.get<AdminChatSession[]>("api/admin/ai/sessions"),
  session: (id: number): Promise<AdminChatSession> => apiClient.get<AdminChatSession>(`api/admin/ai/sessions/${id}`),
  removeSession: (id: number): Promise<void> => apiClient.delete<void>(`api/admin/ai/sessions/${id}`),
  async *stream(message: string, sessionId?: number, signal?: AbortSignal): AsyncGenerator<AdminChatEvent> {
    const response = await apiClient.requestRaw("api/admin/ai/chat/stream", { method: "POST", body: { Message: message, SessionId: sessionId }, signal });
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    try {
      while (true) {
        if (signal?.aborted) { await reader.cancel(); return; }
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";
        for (const event of events) {
          const data = event.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
          if (data) yield JSON.parse(data) as AdminChatEvent;
        }
        if (done) break;
      }
      if (buffer.startsWith("data:")) yield JSON.parse(buffer.slice(5).trim()) as AdminChatEvent;
    } finally { reader.releaseLock(); }
  },
};
