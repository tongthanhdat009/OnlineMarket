SHELL := /bin/bash
.DEFAULT_GOAL := help

# ── Paths & tools ──
BACKEND_SLN  := dotnet-backend/dotnet_backend/dotnet_backend.sln
BACKEND_PROJ := dotnet-backend/dotnet_backend/dotnet-backend.csproj
BLAZOR_PROJ  := BlazorApp/BlazorApp.csproj
COMPOSE      := docker compose -f dotnet-backend/docker-compose.yml
ENV_FILE     := dotnet-backend/.env
ENV_EXAMPLE  := dotnet-backend/.env.example

# ── Help ──────────────────────────────────────────────────────────
.PHONY: help
help: ## Hiện tất cả lệnh
	@echo "OnlineMarket — make aliases"
	@echo ""
	@grep -E '^[a-zA-Z0-9_.-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?##"} {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Ví dụ:"
	@echo "  make install          # cài deps .NET (API + Blazor)"
	@echo "  make db-up            # bật MySQL docker"
	@echo "  make dev              # bật DB + API + Blazor (song song)"
	@echo "  make dev-api          # chỉ API (http://localhost:7000)"
	@echo "  make dev-blazor       # chỉ Blazor customer (http://localhost:5192)"

# ── Env ───────────────────────────────────────────────────────────
.PHONY: env env-check
env: env-check ## Kiểm tra/tạo dotnet-backend/.env

env-check:
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "→ $(ENV_FILE) chưa có, copy từ $(ENV_EXAMPLE)"; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		if command -v openssl >/dev/null 2>&1; then \
			secret=$$(openssl rand -hex 32); \
			sed -i "s|^Jwt__Secret=.*|Jwt__Secret=$$secret|" $(ENV_FILE); \
			echo "→ Đã sinh Jwt__Secret ngẫu nhiên"; \
		else \
			echo "⚠ Không có openssl — hãy tự điền Jwt__Secret trong $(ENV_FILE)"; \
		fi; \
		echo "⚠ Mở $(ENV_FILE) điền OpenRouter/VNPay/AWS/Email trước khi chạy tích hợp"; \
	else \
		echo "✓ $(ENV_FILE) đã tồn tại"; \
	fi

# ── Install ───────────────────────────────────────────────────────
.PHONY: install install-backend install-blazor
install: install-backend ## Cài tất cả deps .NET

install-backend: ## dotnet restore (API + Blazor)
	dotnet restore $(BACKEND_SLN)
	dotnet restore $(BLAZOR_PROJ)

install-blazor: ## dotnet restore Blazor riêng
	dotnet restore $(BLAZOR_PROJ)

# ── DB (MySQL 8.0 via docker compose) ─────────────────────────────
.PHONY: db-up db-down db-restart db-logs db-ps db-wait db-reset
db-up: ## Bật MySQL (127.0.0.1:3308)
	$(COMPOSE) up -d
	@echo "→ MySQL: 127.0.0.1:3308 (store_management / root / no password)"

db-down: ## Tắt MySQL (giữ volume)
	$(COMPOSE) down

db-restart: ## Restart MySQL
	$(COMPOSE) restart db

db-logs: ## Xem log MySQL
	$(COMPOSE) logs -f db

db-ps: ## Trạng thái container
	$(COMPOSE) ps

db-wait: ## Đợi MySQL healthy
	@echo "→ Đợi MySQL healthy..."
	@for i in $$(seq 1 30); do \
		if $(COMPOSE) exec -T db mysqladmin ping -h localhost --silent 2>/dev/null | grep -q "mysqld is alive"; then \
			echo "✓ MySQL healthy"; exit 0; \
		fi; \
		echo "  ...chờ ($$i/30)"; sleep 2; \
	done; \
	echo "✗ Timeout — kiểm tra 'make db-logs'"; exit 1

db-reset: ## Xóa volume DB (mất dữ liệu) + bật lại
	@echo "⚠ Sẽ xóa local-mysql-data (mất dữ liệu DB local)"
	@read -p "Gõ 'yes' để tiếp tục: " c; [ "$$c" = "yes" ] || (echo "Hủy"; exit 1)
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	@echo "→ Đã reset, đợi healthy rồi chạy lại API để EF migrations tự chạy"

# ── Build ─────────────────────────────────────────────────────────
.PHONY: build build-backend build-blazor
build: build-backend build-blazor ## Build API + Blazor

build-backend: ## Build API
	dotnet build $(BACKEND_SLN)

build-blazor: ## Build Blazor WASM
	dotnet build $(BLAZOR_PROJ)

# ── Dev — chạy lẻ ─────────────────────────────────────────────────
.PHONY: dev-api dev-blazor dev-customer
dev-api: env-check db-up ## Chạy API (http://localhost:7000)
	@echo "→ API http://localhost:7000 (swagger nếu có)"
	set -a; source $(ENV_FILE); set +a; \
	ASPNETCORE_ENVIRONMENT=Development dotnet run --project $(BACKEND_PROJ)

dev-blazor: ## Chạy Blazor customer (http://localhost:5192)
	dotnet run --project $(BLAZOR_PROJ)

dev-customer: dev-blazor ## Alias của dev-blazor

# ── Dev — chạy full ───────────────────────────────────────────────
.PHONY: dev dev-all dev-bg urls open
dev: db-up ## Bật DB + chạy API + Blazor song song (Ctrl+C để dừng tất cả)
	@echo "→ Khởi động API (7000) + Blazor (5192) song song..."
	@$(MAKE) -j2 dev-api dev-blazor

dev-all: dev ## Alias của dev

dev-bg: db-up ## Chạy full dev ở background (log ra .make-dev-*.log)
	@echo "→ Chạy background..."
	set -a; source $(ENV_FILE); set +a; \
	nohup env ASPNETCORE_ENVIRONMENT=Development dotnet run --project $(BACKEND_PROJ) > .make-dev-api.log 2>&1 & echo $$! > .make-dev-api.pid; \
	nohup dotnet run --project $(BLAZOR_PROJ) > .make-dev-blazor.log 2>&1 & echo $$! > .make-dev-blazor.pid; \
	echo "✓ PID: $$(cat .make-dev-api.pid) (api) $$(cat .make-dev-blazor.pid) (blazor)"; \
	echo "  log: .make-dev-*.log  |  dừng: make dev-stop  |  urls: make urls"

dev-stop: ## Dừng các process dev-bg
	@for f in .make-dev-api.pid .make-dev-blazor.pid; do \
		if [ -f "$$f" ]; then pid=$$(cat $$f); kill $$pid 2>/dev/null && echo "✓ killed $$pid ($$f)" || echo "- $$f ($$pid) đã dừng"; rm -f $$f; fi; \
	done
	@rm -f .make-dev-*.log
	@echo "→ Đã dừng dev-bg"

urls: ## In URLs dev
	@echo "  API:    http://localhost:7000  (swagger: http://localhost:7000/swagger nếu bật)"
	@echo "  Blazor: http://localhost:5192  (http) / https://localhost:7190"
	@echo "  MySQL:  127.0.0.1:3308  (db: store_management, user: root)"

open: ## Mở API + Blazor bằng xdg-open/open (Linux/macOS)
	@(command -v xdg-open >/dev/null && xdg-open http://localhost:7000 & xdg-open http://localhost:5192 &) || \
	 (command -v open >/dev/null && open http://localhost:7000 & open http://localhost:5192 &) || \
	 echo "Không tìm thấy xdg-open/open — dùng 'make urls' để xem URL"

# ── Clean ─────────────────────────────────────────────────────────
.PHONY: clean clean-backend clean-blazor
clean: clean-backend clean-blazor ## Clean build artifacts

clean-backend:
	dotnet clean $(BACKEND_SLN)

clean-blazor:
	dotnet clean $(BLAZOR_PROJ)

# ── Check ─────────────────────────────────────────────────────────
.PHONY: check static-check
check: build ## Build check nhanh (alias)
	@echo "✓ check xong"

static-check: build ## Kiểm tra build toàn repo (dùng trước khi push)
	@echo "✓ static-check xong"
