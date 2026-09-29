import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { Agent, AgentActivity, AgentAnalytics, AgentRun } from "../types/domain";

export interface SaveAgentInput {
  Name: string;
  Description?: string;
  SystemInstructions: string;
  Model?: string;
  Temperature?: number;
  MaxToolRounds?: number;
  Tools?: string[];
}

export interface AgentRunQuery extends ListQuery { agentId?: number; status?: string; trigger?: string; userId?: number; from?: string; to?: string; }
export interface AgentActivityQuery extends AgentRunQuery { runId?: number; type?: string; level?: string; tool?: string; runStatus?: string; }

export interface AgentTool { Name: string; Description: string; Category: string; Version: string; Risk: string; TimeoutSeconds: number; Enabled: boolean; Schema: unknown; UsageCount: number; FailureCount: number; }

export const agentsApi = {
  list: (query?: ListQuery): Promise<ApiListResult<Agent>> => apiClient.list<Agent>("api/admin/agents", { page: 1, pageSize: 20, ...query }),
  byId: (id: number): Promise<Agent> => apiClient.get<Agent>(`api/admin/agents/${id}`),
  create: (input: SaveAgentInput): Promise<Agent> => apiClient.post<Agent>("api/admin/agents", input),
  update: (id: number, input: Partial<SaveAgentInput>): Promise<Agent> => apiClient.put<Agent>(`api/admin/agents/${id}`, input),
  setEnabled: (id: number, enabled: boolean): Promise<Agent> => apiClient.patch<Agent>(`api/admin/agents/${id}/enabled`, { Enabled: enabled }),
  assignTools: (id: number, toolNames: string[]): Promise<Agent> => apiClient.put<Agent>(`api/admin/agents/${id}/tools`, { ToolNames: toolNames }),

  runs: (query?: AgentRunQuery): Promise<ApiListResult<AgentRun>> => apiClient.list<AgentRun>("api/admin/agent-runs", { page: 1, pageSize: 20, ...query }),
  run: (id: number | string): Promise<AgentRun> => apiClient.get<AgentRun>(`api/admin/agent-runs/${id}`),
  activity: (query?: AgentActivityQuery): Promise<ApiListResult<AgentActivity>> => apiClient.list<AgentActivity>("api/admin/agent-activity", { page: 1, pageSize: 20, ...query }),
  tools: (): Promise<AgentTool[]> => apiClient.get<AgentTool[]>("api/admin/agent-tools"),
  tool: (name: string): Promise<AgentTool> => apiClient.get<AgentTool>(`api/admin/agent-tools/${encodeURIComponent(name)}`),
  analytics: (from?: string, to?: string): Promise<AgentAnalytics> => apiClient.get<AgentAnalytics>("api/admin/agent-analytics", { from, to }),

  /** Consume activity SSE. Return cleanup function; callback runs per `data:` event. */
  async streamActivity(onEvent: (event: AgentActivity) => void, signal?: AbortSignal): Promise<() => void> {
    const controller = new AbortController();
    if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
    const response = await apiClient.requestRaw("api/admin/agent-activity/stream", { method: "GET", signal: controller.signal });
    if (!response.body) return () => controller.abort();
    void (async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (!controller.signal.aborted) {
          const chunk = await reader.read();
          if (chunk.done) break;
          buffer += decoder.decode(chunk.value, { stream: true });
          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() ?? "";
          for (const event of events) {
            const data = event.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n");
            if (!data) continue;
            try { onEvent(JSON.parse(data) as AgentActivity); } catch { /* Ignore malformed event, keep stream alive. */ }
          }
        }
      } finally { reader.releaseLock(); }
    })();
    return () => controller.abort();
  },
};
