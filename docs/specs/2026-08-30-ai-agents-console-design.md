# AI Agents Admin Operations Console Design

## Status

Accepted implementation design derived from the active goal and current repository inspection.

## Current baseline

- Customer AI: `/api/customer/ai`, `AiService`, OpenAI-compatible SSE/function calling.
- Partial Admin AI: `/api/admin/ai`, `AdminAiService`, six read-oriented tools; currently non-compiling because session/report contracts are missing.
- Admin Vue has no AI UI or SSE client.
- RBAC is permission-claim based. EF Core/MySQL is the persistence source. QuestPDF already generates PDFs.

## Decisions

### 1. One runtime, chat as a trigger

`AgentRuntime` owns Admin execution lifecycle. Admin chat resolves the default Agent, creates a Run linked to its chat Session, streams LLM content, executes allowed registered tools, persists events/tool calls, then completes or fails the Run. Customer `AiService` remains unchanged to preserve its anonymous/product-suggestion contract.

Manual report generation also creates a Run. It uses the same controlled Tool Registry and persisted lifecycle; no arbitrary SQL or model-generated executable code.

### 2. Persistence model

- `Agent`: configuration, enabled state, model, temperature, max tool rounds, creator/timestamps.
- `AgentTool`: Agent-to-code-registered-tool allowlist by stable tool name.
- `AgentRun`: execution unit; optional Session; trigger/user/status/input/output/model/timing/tool count/tokens/error.
- `AgentEvent`: append-only ordered structured timeline.
- `AgentToolCall`: independently timed/redacted tool invocation.
- `AgentReport`: persistent structured business artifact linked to its source Run.
- `AdminChatSession` and `AdminChatMessage`: conversation context, separate from execution history.

Foreign keys preserve history. Agents are disabled, never hard-deleted. Events/messages/tool calls cascade with their owning Run/Session only. Indexes cover recency, status, Agent/date, Run sequence, tool/date, report type/date.

### 3. Tool Registry

A single code registry is authoritative for schema, category, version, risk, timeout, enabled state, and handler mapping. V1 tools are `READ_ONLY`; existing product/inventory/order/sales behavior moves behind this registry without exposing `ApplicationDbContext` to the LLM. DB stores only Agent allowlists, not executable handlers.

Runtime rejects unknown, disabled, or Agent-forbidden tools before execution. Analytics/report agents default to read-only tools.

### 4. Payload safety

Persisted arguments/results pass a sanitizer that:

- redacts keys matching authorization/token/password/secret/API key/AWS/VNPay/email credential patterns;
- stores at most 8 KiB per payload;
- records original byte size and truncation state;
- never exposes stack traces or provider credentials.

Frontend renders text with Vue interpolation only; no `v-html`.

### 5. Lifecycle and failure semantics

Run states: `QUEUED`, `RUNNING`, `WAITING_TOOL`, `COMPLETED`, `FAILED`, `CANCELLED`.

Transitions are service-owned and deterministic. Important events: `RUN_STARTED`, `CONTEXT_CREATED`, `LLM_REQUEST_STARTED`, `LLM_RESPONSE_RECEIVED`, `TOOL_CALL_STARTED`, `TOOL_CALL_COMPLETED`, `TOOL_CALL_FAILED`, `REPORT_CREATED`, `RUN_COMPLETED`, `RUN_FAILED`.

Every event receives a per-Run sequence inside the persistence service. Provider HTTP/malformed response/tool exception/max-round failure completes the Run as failed. Client disconnect marks the Run cancelled; it never remains running.

### 6. Realtime activity

DB remains source of truth. A singleton in-process activity broadcaster publishes persisted operational events to authenticated SSE subscribers. Chat tokens remain only in the per-chat stream. Activity SSE emits structured events, supports cancellation, and does not re-persist on reconnect.

### 7. APIs and RBAC

Resource APIs:

- `/api/admin/agents`: list/detail/create/update/enable/tool assignment.
- `/api/admin/agent-runs`: paged filters, detail/timeline.
- `/api/admin/agent-activity`: paged history and SSE stream.
- `/api/admin/agent-tools`: registry/detail/usage.
- `/api/admin/agent-reports`: list/detail/generate/PDF.
- `/api/admin/agent-analytics`: overview/time series/tool metrics.
- `/api/admin/ai`: backward-compatible sessions/chat SSE.

Backend checks exact permission claims. Permission keys follow the requested granular names. `admin_ai_chat` remains an alias/seed for current chat compatibility; new routes use `agent_*` keys.

### 8. Reports

V1 implements a deterministic Daily/Custom Sales report using the registered `sales_summary` data adapter. Structured JSON contains validated summary, metrics, findings, recommendations, related entities, and severity. Markdown remains renderable content. Report links to Run and Tool Call. QuestPDF renders the persisted structured artifact; the LLM never writes PDF bytes.

### 9. Vue console

Add one `AI Agents` sidebar group while preserving shell design. Views: Overview, Chat, Activity, Runs, Run Detail, Reports, Report Detail, Analytics, Agents, Tools. Shared native CSS, existing `Pagination`, Chart.js, Axios, and authenticated `fetch` SSE are reused. No new dependency. Detail routes are hidden from sidebar. All lists use server pagination.

## Rejected alternatives

- Separate AI service/microservice: duplicates auth/client/business infrastructure.
- Arbitrary SQL tool: bypasses validation/RBAC/audit boundaries.
- Dynamic tool code from DB: creates remote-code-execution risk.
- Message broker/background queue: unnecessary for current manual/chat execution.
- Store every raw LLM/tool payload: leaks sensitive data and creates unbounded log growth.

## Validation

- Focused backend lifecycle/sanitizer/authorization/report tests.
- Backend solution build.
- Vue production build.
- React customer build to detect storefront regression.
- `make static-check` final gate.
