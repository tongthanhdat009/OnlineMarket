# AI Agents Admin Operations Console Implementation Plan

**Goal:** Extend existing Admin AI into a traceable, governed Operations Console while preserving customer and Admin chat compatibility.

**Architecture:** Keep customer AI unchanged. Route Admin chat/report triggers through a persisted `AgentRuntime`; use one code-owned Tool Registry, EF Core as history source, in-process SSE only for realtime delivery, existing Vue shell/RBAC/Chart.js/QuestPDF patterns.

**Tech Stack:** ASP.NET Core 10, EF Core/Pomelo MySQL, System.Text.Json, QuestPDF, Vue 3, Axios, Chart.js, native fetch streams.

## Global Constraints

- No arbitrary SQL, dynamic C#, executable DB tools, destructive autonomous actions, queue, broker, vector DB, or new frontend dependency.
- API JSON remains PascalCase.
- Persisted operational payloads must be redacted and capped at 8 KiB.
- All resource lists use server pagination.
- Customer `/api/customer/ai` contract and product suggestion flow remain unchanged.

### Task 1: Restore baseline Admin chat

**Files:** Create Admin chat DTO/entity/session service/report query service; modify `AiChatDto.cs`, `ApplicationDbContext.cs`, `Program.cs`, `.env.example`.

**Interfaces:**

- Produces `IAdminChatSessionService`, `AdminChatSessionContext`, `ISalesReportService` required by current controller/service.
- [ ] Add session ownership validation and bounded message history.
- [ ] Add deterministic sales aggregate using completed+paid semantics.
- [ ] Register services and committed Admin model config template.
- [ ] Build backend; fix all masked compiler failures.

### Task 2: Persist Agent operations

**Files:** Create Agent/Run/Event/ToolCall/Report entities, DTOs, runtime persistence/sanitizer/broadcaster services; modify context/user navigations.

**Interfaces:**

- Produces state constants, run/event APIs, sanitized payload persistence.
- [ ] Map entities, constraints, indexes, delete behavior.
- [ ] Implement deterministic lifecycle and append-only event sequence.
- [ ] Implement secret redaction/truncation.
- [ ] Instrument Admin chat LLM/tool loop; fail/cancel terminally.

### Task 3: Govern tools and agents

**Files:** Replace static declaration-only registry with code metadata/execution registry; create Agent management service/controller.

**Interfaces:**

- Produces tool metadata, risk classification, enable policy, Agent allowlist enforcement.
- [ ] Register six existing read-only tools.
- [ ] Validate arguments, timeout, allowed Agent/tool mapping.
- [ ] Expose registry and usage visibility; never allow executable tool creation.

### Task 4: Operations APIs and activity SSE

**Files:** Create runs/activity/analytics controllers and query service.

**Interfaces:**

- Produces paged Runs, Run Detail timeline, historical Activity, authenticated SSE, overview/agent/tool/time-series metrics.
- [ ] Add filters for Agent/status/trigger/user/date.
- [ ] Query with `AsNoTracking`, projections, stable ordering, no N+1.
- [ ] Stream only persisted operational events; tokens stay in chat stream.

### Task 5: Structured Agent reports and PDF

**Files:** Create report service/controller/PDF renderer.

**Interfaces:**

- Produces one traceable Sales report, validated structured content, persisted Markdown, QuestPDF export.
- [ ] Generate report through registered read-only sales tool and a Run.
- [ ] Validate structured metrics/findings/recommendations/severity.
- [ ] Link Report, Run, Tool Call; emit `REPORT_CREATED`.
- [ ] Render persisted report to PDF.

### Task 6: RBAC and migration

**Files:** Modify seed; generate EF migration/designer/snapshot.

**Interfaces:**

- Produces requested `agent_*` permissions plus `admin_ai_chat` compatibility grant.
- [ ] Seed stable permission IDs and Admin role assignments.
- [ ] Generate migration from context; inspect schema/index/FK output.
- [ ] Verify migration can script successfully.

### Task 7: Vue Operations Console

**Files:** Create AI resource API, stream helper, shared status/page styles, 10 views; modify router/sidebar.

**Interfaces:**

- Consumes PascalCase resource APIs and SSE events.
- [ ] Add `AI Agents` grouped navigation and hidden detail routes.
- [ ] Build Overview, Chat, Activity, Runs, Run Detail, Reports, Report Detail, Analytics, Agents, Tools.
- [ ] Reuse `Pagination.vue`, Chart.js, existing shell palette.
- [ ] Abort streams on unmount; reconnect Activity safely; render via interpolation only.

### Task 8: Tests and documentation

**Files:** Create xUnit project/tests; update architecture documentation.

**Interfaces:**

- [ ] Test sanitizer, state transitions, event ordering, tool allow/deny/invalid/failure, report validation, analytics queries, RBAC helpers.
- [ ] Document lifecycle, event types, tool registration/policy, APIs/SSE/RBAC/report security/debugging.
- [ ] Run `dotnet test`, backend build, Vue build, React customer build, `make static-check`.
