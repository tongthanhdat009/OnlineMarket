# OnlineMarket — task runner (pwsh, chạy được trên Windows + Linux/macOS có pwsh)
# Yêu cầu: GNU Make + pwsh 7+, .NET 10 SDK, Node 20+, Docker + Compose v2 (MySQL :3308)
# QUAN TRỌNG: bản make Windows32 không truyền được UTF-8 qua command line,
# nên mọi DÒNG RECIPE (dòng bắt đầu bằng TAB) phải là ASCII thuần (tiếng Việt
# không dấu). Chữ có dấu chỉ được dùng trong comment và sau ## (help text).
# Lưu ý: KHÔNG dùng .ONESHELL — mỗi dòng recipe là một process pwsh riêng,
# dòng nào cũng phải tự chứa (nối lệnh bằng ";" trên cùng dòng).

ifeq ($(OS),Windows_NT)
SHELL := pwsh.exe
else
SHELL := pwsh
endif
.SHELLFLAGS := -NoProfile -Command
.DEFAULT_GOAL := help

# ── Paths & tools ──────────────────────────────────────────────────
BACKEND_SLN  := dotnet-backend/dotnet_backend/dotnet_backend.sln
BACKEND_PROJ := dotnet-backend/dotnet_backend/dotnet-backend.csproj
ADMIN_DIR    := frontend
CUSTOMER_DIR := frontend-customer
COMPOSE      := docker compose -f dotnet-backend/docker-compose.yml
ENV_FILE     := dotnet-backend/.env
ENV_EXAMPLE  := dotnet-backend/.env.example
API_PORT     := 7000
ADMIN_PORT   := 5188
CUSTOMER_PORT := 5193

# ── Help ──────────────────────────────────────────────────────────
.PHONY: help
help: ## Hiện tất cả lệnh
	@echo "OnlineMarket - make aliases"
	@echo ""
	@Select-String -Path $(MAKEFILE_LIST) -Pattern '^([A-Za-z0-9_.-]+)\s*:.*##\s*(.*)$$' | ForEach-Object { $$m = $$_.Matches[0].Groups; Write-Host ("  {0,-18} {1}" -f $$m[1].Value, $$m[2].Value) }
	@echo ""
	@echo "Vi du:"
	@echo "  make install          # cai deps API + React admin/customer"
	@echo "  make doctor           # kiem tra toolchain + node_modules truoc khi dev"
	@echo "  make db-up            # bat MySQL docker"
	@echo "  make dev              # bat DB + API + 2 React app"
	@echo "  make dev-api          # chi API (http://localhost:7000)"
	@echo "  make dev-admin        # React admin (http://localhost:5188)"
	@echo "  make dev-customer     # React customer (http://localhost:5193)"

# ── Env ───────────────────────────────────────────────────────────
.PHONY: env env-check
env: env-check ## Kiểm tra/tạo dotnet-backend/.env

env-check:
	if (!(Test-Path "$(ENV_FILE)")) { Write-Output "-> $(ENV_FILE) chua co, copy tu $(ENV_EXAMPLE)"; Copy-Item "$(ENV_EXAMPLE)" "$(ENV_FILE)"; try { $$b = New-Object byte[] 32; [System.Security.Cryptography.RandomNumberGenerator]::Fill($$b); $$s = [BitConverter]::ToString($$b).Replace('-','').ToLower(); $$c = Get-Content "$(ENV_FILE)"; $$c = $$c -replace '^Jwt__Secret=.*', "Jwt__Secret=$$s"; Set-Content "$(ENV_FILE)" -Value $$c; Write-Output "-> Da sinh Jwt__Secret ngau nhien" } catch { Write-Output "WARN: khong sinh duoc secret - tu dien Jwt__Secret trong $(ENV_FILE)" }; Write-Output "WARN: mo $(ENV_FILE) dien OpenRouter/VNPay/AWS/Email truoc khi chay tich hop" } else { Write-Output "OK: $(ENV_FILE) da ton tai" }

# ── Doctor (fail-fast truoc khi dev) ──────────────────────────────
.PHONY: doctor
doctor: ## Kiem tra toolchain + node_modules 2 frontend
	foreach ($$c in @('node','npm','dotnet','docker')) { if (-not (Get-Command $$c -ErrorAction SilentlyContinue)) { Write-Error "Thieu $$c - cai dat roi chay lai"; exit 1 } }; Write-Output 'OK: node/npm/dotnet/docker'
	if (!(Test-Path "$(ENV_FILE)")) { Write-Error "Thieu $(ENV_FILE) - chay: make env"; exit 1 } else { Write-Output "OK: $(ENV_FILE)" }
	foreach ($$d in @('$(ADMIN_DIR)','$(CUSTOMER_DIR)')) { $$shim = if ($$IsWindows) { "$$d/node_modules/.bin/vite.cmd" } else { "$$d/node_modules/.bin/vite" }; if (!(Test-Path $$shim)) { Write-Error "$$d/node_modules hong hoac thieu (khong co shim vite trong .bin) - thuong do copy node_modules tu may/OS khac. Chay: make install"; exit 1 }; $$v = node "$$d/node_modules/vite/bin/vite.js" --version 2>$$null; if ($$LASTEXITCODE -ne 0) { Write-Error "$$d/node_modules thieu native binding (optional deps). Xoa $$d/node_modules roi chay: make install"; exit 1 } else { Write-Output "OK: $$d ($$v)" } }

# ── Install ───────────────────────────────────────────────────────
.PHONY: install install-backend install-admin install-customer
install: install-backend install-admin install-customer ## Cài deps API + React admin/customer

install-backend: ## dotnet restore API
	dotnet restore $(BACKEND_SLN)

install-admin: ## npm install React admin (tu xoa node_modules hong truoc khi cai)
	$$shim = if ($$IsWindows) { "$(ADMIN_DIR)/node_modules/.bin/vite.cmd" } else { "$(ADMIN_DIR)/node_modules/.bin/vite" }; if ((Test-Path "$(ADMIN_DIR)/node_modules") -and !(Test-Path $$shim)) { Write-Output "-> $(ADMIN_DIR)/node_modules hong (thieu shim vite) - xoa de cai lai"; Remove-Item -Recurse -Force "$(ADMIN_DIR)/node_modules" }
	npm install --prefix $(ADMIN_DIR)

install-customer: ## npm install React customer storefront (tu xoa node_modules hong truoc khi cai)
	$$shim = if ($$IsWindows) { "$(CUSTOMER_DIR)/node_modules/.bin/vite.cmd" } else { "$(CUSTOMER_DIR)/node_modules/.bin/vite" }; if ((Test-Path "$(CUSTOMER_DIR)/node_modules") -and !(Test-Path $$shim)) { Write-Output "-> $(CUSTOMER_DIR)/node_modules hong (thieu shim vite) - xoa de cai lai"; Remove-Item -Recurse -Force "$(CUSTOMER_DIR)/node_modules" }
	npm install --prefix $(CUSTOMER_DIR)

# ── DB (MySQL 8.0 via docker compose) ─────────────────────────────
.PHONY: db-up db-down db-restart db-logs db-ps db-wait db-reset
db-up: ## Bật MySQL (127.0.0.1:3308)
	$(COMPOSE) up -d
	@echo "-> MySQL: 127.0.0.1:3308 (store_management / root / no password)"

db-down: ## Tắt MySQL (giữ volume)
	$(COMPOSE) down

db-restart: ## Restart MySQL
	$(COMPOSE) restart db

db-logs: ## Xem log MySQL
	$(COMPOSE) logs -f db

db-ps: ## Trạng thái container
	$(COMPOSE) ps

db-wait: ## Đợi MySQL healthy
	Write-Output '-> Doi MySQL healthy...'; $$ok = $$false; for ($$i = 1; $$i -le 30; $$i++) { $$o = $(COMPOSE) exec -T db mysqladmin ping -h localhost 2>&1 | Out-String; if ($$o -match 'mysqld is alive') { Write-Output 'OK: MySQL healthy'; $$ok = $$true; break }; Write-Output "... cho ($$i/30)"; Start-Sleep -Seconds 2 }; if (-not $$ok) { Write-Error 'Timeout - kiem tra make db-logs'; exit 1 }

db-reset: ## Xóa volume DB (mất dữ liệu) + bật lại
	Write-Output 'WARN: se xoa local-mysql-data (mat du lieu DB local)'; $$c = Read-Host "Go 'yes' de tiep tuc"; if ($$c -ne 'yes') { Write-Output 'Huy'; exit 1 }
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	@echo "-> Da reset, doi healthy roi chay lai API de EF migrations tu chay"

# ── Build ─────────────────────────────────────────────────────────
.PHONY: build build-backend build-admin build-customer
build: build-backend build-admin build-customer ## Build API + React admin/customer

build-backend: ## Build API
	dotnet build $(BACKEND_SLN)

build-admin: ## Build React admin
	npm run build --prefix $(ADMIN_DIR)

build-customer: ## Build React customer storefront
	npm run build --prefix $(CUSTOMER_DIR)

# ── Dev — chạy lẻ ─────────────────────────────────────────────────
.PHONY: dev-api dev-admin dev-customer
dev-api: env-check db-up ## Chạy API (http://localhost:7000)
	Get-Content "$(ENV_FILE)" | ForEach-Object { if ($$_ -match '^\s*([^#=]+?)\s*=\s*(.*)$$') { $$k = $$Matches[1].Trim(); $$v = $$Matches[2].Trim() -replace '^[''"]|[''"]$$', ''; Set-Content "env:$$k" -Value $$v } }; $$env:ASPNETCORE_ENVIRONMENT = 'Development'; Write-Output '-> API http://localhost:7000 (swagger neu co)'; dotnet run --project $(BACKEND_PROJ)

dev-admin: doctor ## Chạy React admin (http://localhost:5188)
	npm run dev --prefix $(ADMIN_DIR) -- --host 0.0.0.0

dev-customer: doctor ## Chạy React customer storefront (http://localhost:5193)
	npm run dev --prefix $(CUSTOMER_DIR) -- --host 0.0.0.0

# ── Dev — chạy full ───────────────────────────────────────────────
.PHONY: dev dev-all dev-bg dev-stop urls open
dev: doctor db-up ## Bật DB + API + 2 React app song song (Ctrl+C để dừng tất cả)
	@echo "-> Khoi dong API (7000) + React admin (5188) + customer (5193)..."
	$(MAKE) -j3 dev-api dev-admin dev-customer

dev-all: dev ## Alias của dev

dev-bg: doctor db-up ## Chạy full dev ở background (log ra .make-dev-*.log)
	Write-Output '-> Chay background...'
	Get-Content "$(ENV_FILE)" | ForEach-Object { if ($$_ -match '^\s*([^#=]+?)\s*=\s*(.*)$$') { $$k = $$Matches[1].Trim(); $$v = $$Matches[2].Trim() -replace '^[''"]|[''"]$$', ''; Set-Content "env:$$k" -Value $$v } }; $$env:ASPNETCORE_ENVIRONMENT = 'Development'
	$$p1 = Start-Process -FilePath 'pwsh' -ArgumentList '-NoProfile','-Command', "dotnet run --project '$(CURDIR)/$(BACKEND_PROJ)'" -RedirectStandardOutput '.make-dev-api.log' -RedirectStandardError '.make-dev-api.err.log' -PassThru; $$p1.Id | Set-Content '.make-dev-api.pid'
	$$p2 = Start-Process -FilePath 'pwsh' -ArgumentList '-NoProfile','-Command', "Set-Location '$(CURDIR)/$(ADMIN_DIR)'; npm run dev -- --host 0.0.0.0" -RedirectStandardOutput '.make-dev-admin.log' -RedirectStandardError '.make-dev-admin.err.log' -PassThru; $$p2.Id | Set-Content '.make-dev-admin.pid'
	$$p3 = Start-Process -FilePath 'pwsh' -ArgumentList '-NoProfile','-Command', "Set-Location '$(CURDIR)/$(CUSTOMER_DIR)'; npm run dev -- --host 0.0.0.0" -RedirectStandardOutput '.make-dev-customer.log' -RedirectStandardError '.make-dev-customer.err.log' -PassThru; $$p3.Id | Set-Content '.make-dev-customer.pid'
	$$a = Get-Content '.make-dev-api.pid'; $$b = Get-Content '.make-dev-admin.pid'; $$c = Get-Content '.make-dev-customer.pid'; Write-Output "OK: PID $$a (api) $$b (admin) $$c (customer)"; Write-Output '  log: .make-dev-*.log  |  dung: make dev-stop  |  urls: make urls'

dev-stop: ## Dừng các process dev-bg
	foreach ($$f in @('.make-dev-api.pid','.make-dev-admin.pid','.make-dev-customer.pid')) { if (Test-Path $$f) { $$id = Get-Content $$f; try { Stop-Process -Id $$id -Force -ErrorAction Stop; Write-Output "OK: killed $$id ($$f)" } catch { Write-Output "- $$f ($$id) da dung" }; Remove-Item $$f -Force } }
	foreach ($$pt in @($(API_PORT),$(ADMIN_PORT),$(CUSTOMER_PORT))) { Get-NetTCPConnection -LocalPort $$pt -ErrorAction SilentlyContinue | ForEach-Object { try { Stop-Process -Id $$_.OwningProcess -Force -ErrorAction Stop; Write-Output "OK: killed port $$pt (PID $$($$_.OwningProcess))" } catch { } } }
	Remove-Item .make-dev-*.log -Force -ErrorAction SilentlyContinue; Write-Output '-> Da dung dev-bg'

urls: ## In URLs dev
	@echo "  API:    http://localhost:7000  (swagger: http://localhost:7000/swagger neu bat)"
	@echo "  Admin:  http://localhost:5188"
	@echo "  Customer: http://localhost:5193"
	@echo "  MySQL:  127.0.0.1:3308  (db: store_management, user: root)"

open: ## Mở API + React apps trên trình duyệt
	Start-Process "http://localhost:7000"; Start-Process "http://localhost:5188"; Start-Process "http://localhost:5193"

# ── Clean ─────────────────────────────────────────────────────────
.PHONY: clean clean-backend clean-admin clean-customer
clean: clean-backend clean-admin clean-customer ## Clean build artifacts

clean-backend:
	dotnet clean $(BACKEND_SLN)

clean-admin:
	if (Test-Path "$(ADMIN_DIR)/dist") { Remove-Item -Recurse -Force "$(ADMIN_DIR)/dist" }

clean-customer:
	if (Test-Path "$(CUSTOMER_DIR)/dist") { Remove-Item -Recurse -Force "$(CUSTOMER_DIR)/dist" }

# ── Check ─────────────────────────────────────────────────────────
.PHONY: check static-check
check: build ## Build check nhanh (alias)
	@echo "OK: check xong"

static-check: build ## Kiểm tra build toàn repo (dùng trước khi push)
	@echo "OK: static-check xong"
