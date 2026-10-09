import { apiClient } from "../lib/api-client";
import type { ApiListResult, ListQuery } from "../types/api";
import type { AgentReport } from "../types/domain";

export interface GenerateReportInput { From: string; To: string; OrderType?: string; }
export interface ReportQuery extends ListQuery { reportType?: string; from?: string; to?: string; }

export const reportsApi = {
  list: (query?: ReportQuery): Promise<ApiListResult<AgentReport>> => apiClient.list<AgentReport>("api/admin/agent-reports", { page: 1, pageSize: 20, ...query }),
  byId: (id: number | string): Promise<AgentReport> => apiClient.get<AgentReport>(`api/admin/agent-reports/${id}`),
  generate: (input: GenerateReportInput): Promise<unknown> => apiClient.post("api/admin/agent-reports/generate", input),
  generateSales: (input: GenerateReportInput): Promise<unknown> => apiClient.post("api/admin/agent-reports/sales", input),
  pdf: (id: number | string): Promise<Blob> => apiClient.requestRaw(`api/admin/agent-reports/${id}/pdf`, { method: "GET" }).then(response => response.blob()),
  autoStatus: (): Promise<AutoAnalysisStatus> => apiClient.get<AutoAnalysisStatus>("api/admin/agent-auto-analysis/status"),
  autoTrigger: (): Promise<unknown> => apiClient.post("api/admin/agent-auto-analysis/trigger", {}),
};

export interface AutoAnalysisStatus {
  Enabled: boolean; IntervalSeconds: number; LookbackSeconds: number;
  LastRunAt?: string | null; LastStatus?: string | null;
  LastRunId?: number | null; LastReportId?: number | null; LastError?: string | null;
}
