# AI Agents Admin Operations Backend

## Runtime lifecycle

Admin chat and report generation create an `AgentRun`. States: `QUEUED`, `RUNNING`, `WAITING_TOOL`, `COMPLETED`, `FAILED`, `CANCELLED`. Provider errors, malformed/empty SSE, tool errors, timeout, and disconnect always produce terminal state. `AgentEvent` sequence is append-only per Run.

## Governed tools

`Services/AdminAiToolRegistry.cs` owns the six V1 read-only tools, metadata, schemas, timeout, and enabled policy. `agent_tools` stores only Agent allowlists. Runtime rejects unknown, disabled, or non-allowlisted names. No arbitrary SQL, dynamic code, destructive tool, or DB-owned handler exists.

Persisted payloads use `AgentPayloadSanitizer`: secret-key redaction, UTF-8 size accounting, 8 KiB cap, truncation marker. Errors store one sanitized line; raw stack traces never persist.

## APIs

All routes require JWT plus exact `permission` claim.

- `/api/admin/ai`: owned sessions; authenticated chat SSE.
- `/api/admin/agents`: list/detail/create/update; `PATCH /{id}/enabled` with `{ "Enabled": true }`; `PUT /{id}/tools` with `{ "ToolNames": [] }`.
- `/api/admin/agent-runs`: paged Runs and detail/timeline.
- `/api/admin/agent-activity`: paged events; authenticated `/stream` SSE.
- `/api/admin/agent-tools`: code registry plus usage/failures.
- `/api/admin/agent-reports`: paged/detail; `POST /generate`; `GET /{id}/pdf`.
- `/api/admin/agent-analytics/overview`: overview, recent Runs, Agent/tool/time-series metrics.

Lists return `PagedResultDto<T>` (`Items`, `TotalCount`, `Page`, `PageSize`). JSON remains PascalCase.

## RBAC

Canonical keys: `agent_view`, `agent_chat`, `agent_run_view`, `agent_logs_view`, `agent_report_view`, `agent_report_generate`, `agent_tool_view`, `agent_tool_manage`, `agent_manage`, `agent_analytics_view`. Admin role receives all. `admin_ai_chat` remains a controller compatibility alias. PDF export uses `agent_report_view`.

## Sales report

V1 report uses completed + paid orders only, `[From,To)` up to 366 days, optional `online|offline`. Analytics defaults to the latest 30 days when no range is supplied. It persists structured JSON, Markdown, Run and ToolCall links. QuestPDF renders persisted content; model never produces PDF bytes.

## Debugging

Inspect Run detail first, then ordered Events and ToolCalls. `FAILED` stores bounded public-safe error text. Activity SSE is delivery-only; DB remains source of truth.
