# taste: backend

> **domain:** Preferencias de backend (Python/FastAPI + Go)
> **confidence:** 0.85
> **updated:** 2026-06-30
> **version:** 1

## preferences

### python

- Type hints obligatorios en todas las funciones y métodos `[type-hints-required]` (confidence: 0.95)
- Pydantic para toda validación de entrada/salida de la API `[pydantic-validation-api]` (confidence: 0.90)
- `async def` para rutas FastAPI y llamadas de red `[async-def-fastapi-routes]` (confidence: 0.85)
- `asyncio.to_thread` para procesamiento pesado (OpenCV, FFmpeg) `[asyncio-to-thread-heavy]` (confidence: 0.80)
- PEP 8: formatear con Black + Ruff `[pep8-black-ruff]` (confidence: 0.90)

### go (freebuff2api)

- Estructura estándar: `main.go` + `server.go` + `models.go` + handlers `[go-standard-structure]` (confidence: 0.85)
- `net/http` con `gorilla/mux` o similar para rutas `[net-http-gorilla-mux]` (confidence: 0.80)
- JSON como formato de intercambio `[json-exchange-format]` (confidence: 0.90)
- Config via JSON + variables de entorno `[config-json-env-vars]` (confidence: 0.85)

### api design

- REST endpoints con naming semántico: `GET /api/taste/packages` `[rest-semantic-naming]` (confidence: 0.90)
- WebSocket para eventos en tiempo real `[websocket-real-time-events]` (confidence: 0.85)
- Rate limiting y validación en cada endpoint `[rate-limiting-per-endpoint]` (confidence: 0.85)
- Errores con código HTTP semántico + mensaje descriptivo `[http-error-semantic-codes]` (confidence: 0.90)

### servidor local (express)

- Servidor Express.js en `ServidorLocal/server.js` `[express-server-local]` (confidence: 0.95)
- Puerto: 3000, bind a 0.0.0.0 `[port-3000-bind-all]` (confidence: 0.98)
- CORS habilitado, JSON body limit: 50mb `[cors-json-50mb]` (confidence: 0.95)
- Endpoints: `[endpoints]` (confidence: 0.95)
  - `POST /api/download-youtube`: descarga video YouTube vía `@distube/ytdl-core`, retorna MP4 como stream `[post-download-youtube]` (confidence: 0.98)
  - `POST /send-cart`: recibe productos del carrito y escribe a `~/Downloads/bandera.txt` `[post-send-cart-bandera]` (confidence: 0.90)
  - `GET /healthz`: health check con status + server info `[get-healthz-status]` (confidence: 0.95)
- Static files: sirve `~/Downloads/arc-editor/` `[static-files-arc-editor]` (confidence: 0.90)

### docker / deployments

- **Odysseus** (Python FastAPI, puerto 7000) `[docker-odysseus]` (confidence: 0.95)
  - Dockerfile: python:3.12-slim, uvicorn, pip install requirements `[dockerfile-python-312-slim]` (confidence: 0.95)
  - docker-compose.yml: odysseus + chromadb + searxng + ntfy `[docker-compose-odysseus]` (confidence: 0.95)
  - GPU variants: `docker-compose.gpu-amd.yml`, `docker-compose.gpu-nvidia.yml` `[docker-gpu-variants]` (confidence: 0.90)
  - Volúmenes: data, logs, huggingface cache, local deps `[docker-volumes-data-logs]` (confidence: 0.95)
  - Entrypoint: drop a PUID/PGID con gosu, chown en volúmenes `[docker-entrypoint-gosu]` (confidence: 0.95)
- **Freebuff2API** (Go, puerto 8080) — single binary con Dockerfile multi-stage `[docker-freebuff2api]` (confidence: 0.90)

### freebuff2api endpoints (go)

- `GET /healthz` — health check con uptime y token state `[go-healthz-uptime]` (confidence: 0.95)
- `GET /v1/models` — lista modelos del ModelRegistry con metadatos `[go-v1-models-list]` (confidence: 0.95)
- `POST /v1/chat/completions` — proxy OpenAI-compatible al upstream `[go-v1-chat-completions]` (confidence: 0.95)
- `POST /v1/messages` — proxy Claude API-compatible (convierte payload al formato upstream) `[go-v1-messages-proxy]` (confidence: 0.95)
- `POST /v1/messages/count_tokens` — estimación de tokens `[go-v1-count-tokens]` (confidence: 0.90)
- Middleware: autenticación via `x-api-key` header o `Authorization: Bearer` `[go-auth-middleware]` (confidence: 0.95)
- ModelRegistry: mapea model IDs → agent IDs para routing de requests `[go-model-registry-routing]` (confidence: 0.90)
- Response streaming: SSE para chat completions + eventos `[go-response-streaming-sse]` (confidence: 0.95)

### upstream proxy (ai)

- **UpstreamClient** en `upstream.go` proxy requests al backend de Codebuff `[upstream-client-proxy]` (confidence: 0.95)
- Métodos: `StartRun`, `FinishRun` (agent lifecycle), `ChatCompletions` (AI proxy) `[upstream-start-finish-run]` (confidence: 0.95)
- Auth: `Authorization: Bearer {AUTH_TOKEN}`, rotation automática cada 6h `[upstream-auth-bearer-rotation]` (confidence: 0.95)
- **RunManager**: acquire/release runs con waiting room y retry `[upstream-run-manager]` (confidence: 0.95)
- **Session management**: ensure/invalidate sessions, cooldown en errores 401 `[upstream-session-management]` (confidence: 0.95)
- Soporte HTTP proxy via `HTTP_PROXY` env var `[upstream-http-proxy]` (confidence: 0.90)
- Tool schema normalization: resuelve `$ref`, simplifica `anyOf`/`oneOf` nullable `[upstream-tool-schema]` (confidence: 0.90)
- Inyecta metadatos upstream: `codebuff_metadata.run_id`, `cost_mode: free`, `freebuff_instance_id` `[upstream-inject-metadata]` (confidence: 0.95)

### config / env vars

- **Freebuff2API**: JSON config file (`config.json`) con override via env vars `[config-freebuff2api]` (confidence: 0.95)
  - `LISTEN_ADDR`: default `:8080` `[listen-addr-8080]` (confidence: 0.98)
  - `UPSTREAM_BASE_URL`: default `https://www.codebuff.com` `[upstream-base-url]` (confidence: 0.95)
  - `AUTH_TOKENS`: lista de tokens de upstream, separados por coma `[auth-tokens-upstream-list]` (confidence: 0.95)
  - `API_KEYS`: lista de API keys para autenticar clients `[api-keys-client-auth]` (confidence: 0.95)
  - `HTTP_PROXY`: proxy opcional para upstream `[http-proxy-optional]` (confidence: 0.90)
  - `ROTATION_INTERVAL`: default `6h` `[rotation-interval-6h]` (confidence: 0.95)
  - `REQUEST_TIMEOUT`: default `15m` `[request-timeout-15m]` (confidence: 0.95)
- **Odysseus**: config via env vars + `.env` file `[config-odysseus]` (confidence: 0.95)
  - `OPENAI_API_KEY`, `HF_TOKEN`, `DATABASE_URL` (sqlite:///./data/app.db) `[odysseus-env-openai-hf-db]` (confidence: 0.95)
  - `AUTH_ENABLED`, `ODYSSEUS_ADMIN_USER`/`ADMIN_PASSWORD` `[odysseus-env-auth-admin]` (confidence: 0.95)
  - `EMBEDDING_URL`, `EMBEDDING_MODEL`, `FASTEMBED_MODEL` `[odysseus-env-embedding]` (confidence: 0.90)
  - `SEARXNG_INSTANCE`, `CHROMADB_HOST`/`CHROMADB_PORT` `[odysseus-env-searxng-chromadb]` (confidence: 0.95)
  - `PUID`/`PGID`: default 1000:1000 para bind mounts `[odysseus-env-puid-pgid]` (confidence: 0.95)
- **ServidorLocal**: sin config — hardcodea puerto 3000 `[config-servidor-local]` (confidence: 0.95)

### security / threat model

- **Trust boundary:** Odysseus está diseñado para usuarios confiables en red privada, no exposición pública — tratarlo como consola de administración `[security-trust-boundary]` (confidence: 0.95)
- **Autenticación:** bcrypt para passwords, sesiones con 7-day tokens, 2FA con TOTP + 8 backup codes de un solo uso `[security-auth]` (confidence: 0.95)
- **Roles:** Admin vs Non-admin — admin tiene shell, file I/O, email, MCP, calendar, tokens, model serving, vault y settings. Non-admin solo chat, browser, documents, research, image gen y memory `[security-roles]` (confidence: 0.95)
- **Usernames reservados:** `internal-tool`, `api`, `demo`, `system` no se pueden registrar — `internal-tool` es crítico de seguridad porque pasa `require_admin` automáticamente `[security-reserved-usernames]` (confidence: 0.98)
- **Internal tool loopback:** token generado con `secrets.token_hex(32)` al iniciar, nunca se persiste ni se envía a clients; loopback usa `X-Odysseus-Internal-Token` header `[security-internal-token]` (confidence: 0.95)
- **Prompt injection hardening:** todo contenido externo que llega al LLM debe pasar por `untrusted_context_message()` — web results, fetched URLs, emails, memories, skills, notes `[security-prompt-injection]` (confidence: 0.95)
- **Untrusted surfaces:** inyectar contenido no confiable directo en system role es un security bug `[security-untrusted-surfaces]` (confidence: 0.98)
- **Security headers:** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` en todas las respuestas `[security-headers]` (confidence: 0.95)
- **CSP:** nonce-based `script-src`, `style-src 'unsafe-inline'` (intencional — riesgo visual, no ejecución) `[security-csp]` (confidence: 0.90)
- **Gaps conocidos:** sin sandbox shell/filesystem, SSRF via `base_url`, token scopes gruesos (solo chat/admin) `[security-gaps]` (confidence: 0.90)

## patterns

### Pydantic validation

- **trigger:** Crear un nuevo endpoint API
- **action:** Definir modelo Pydantic para request y response antes de implementar la ruta
- **rationale:** Validación automática, documentación OpenAPI gratis

### Async separation

- **trigger:** Operación que puede durar > 100ms
- **action:** Si es I/O usar async/await. Si es CPU-bound usar asyncio.to_thread o BackgroundTasks
- **rationale:** No bloquear el event loop de FastAPI

## anti-patterns

### Raw dict access from client

- **description:** Leer `request.body` como diccionario sin validación
- **why:** Riesgo de seguridad, errores difíciles de debuggear, sin documentación automática
- **instead:** Usar modelos Pydantic siempre

### Blocking calls in async routes

- **description:** Llamadas síncronas a FFmpeg/OpenCV dentro de una ruta async
- **why:** Bloquean todo el event loop, degradan el rendimiento de todos los endpoints
- **instead:** Usar asyncio.to_thread o worker externo (Celery)

### Exponer Odysseus en puerto público sin autenticación

- **description:** Desplegar Odysseus accesible desde internet sin reverse proxy ni VPN
- **why:** Odysseus solo tiene autenticación básica, sin rate limiting global ni WAF; un admin autenticado puede ejecutar shell y leer/escribir archivos
- **instead:** Desplegar solo en red privada, detrás de nginx/Caddy con autenticación adicional, o usar VPN (WireGuard/Tailscale)

### Inyectar contenido externo en system prompt

- **description:** Pasar web results, fetched URLs o emails directamente al system role del LLM sin wrapper de seguridad
- **why:** El contenido externo puede contener instrucciones maliciosas de prompt injection que el modelo podría seguir
- **instead:** Usar siempre `untrusted_context_message()` o similar para wrapping en user-role; el content policy debe declarar que el contenido no es confiable

### Ignorar el threat model en nuevos endpoints

- **description:** Agregar un nuevo endpoint HTTP sin considerar trust boundary, rate limiting ni validación de input
- **why:** Cada endpoint nuevo expande la superficie de ataque; en un sistema con ejecución de shell y acceso a archivos, un endpoint sin validación puede ser crítico
- **instead:** Revisar `odysseus/THREAT_MODEL.md` antes de agregar endpoints; aplicar autenticación, validación Pydantic y rate limiting por defecto
