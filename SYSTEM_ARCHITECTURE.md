# 🚀 EnglishX — Comprehensive Architecture, End-to-End System Explanation, Error Handling & Scalability Guide

---

## 1. End-to-End Explanation & Working of EnglishX

**EnglishX** is a monorepo, voice-first AI English speaking coach platform designed for non-native learners (with specialized tuning for Hindi speakers). It provides real-time voice conversation practice (Free Talk, HR Interview, and Placement assessment), analyzes user speech across **3 dimensions (Pronunciation, Vocabulary, Grammar)**, updates CEFR-mapped competency levels (**L1–L6**), and provides analytics for learners and batch administrators.

```
                                  ┌────────────────────────┐
                                  │   Next.js 14 Frontend  │
                                  │ (Web Audio API / UI)   │
                                  └───────────┬────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         │   NGINX Reverse Proxy (Port 80/443)    │
                         └───────────┬────────────────┬────────────┘
                                     │                │
            /api/* (Auth, Sessions,  │                │ /speech/* (Audio Turn,
                 Invites, Dashboard) │                │    Feedback Analysis, TTS)
                                     ▼                ▼
                         ┌──────────────────┐  ┌──────────────────┐
                         │   ms1-core-api   │  │ ms2-speech-agent │
                         │ (Node.js/Express)│  │ (FastAPI/LangGraph)│
                         └─────────┬────────┘  └─────────┬────────┘
                                   │                     │
                    ┌──────────────┴──────────────┐      ├──► Deepgram Nova-3 (STT)
                    │  PostgreSQL (Supabase/RDS)  │      ├──► Gemini 3.1 Flash (LLM)
                    └─────────────────────────────┘      ├──► Deepgram Aura (TTS)
                                                         └──► AWS S3 (Audio Storage)
```

---

### Key System Components

| Service | Stack / Tools | Responsibilities | Key Files |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Web Audio API | Voice recording/playback, Learner/Admin UI, session state, charts | [`frontend/src/lib/api.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/frontend/src/lib/api.js) |
| **ms1-core-api** | Node.js, Express.js, PostgreSQL, Passport | Auth (JWT/Google OAuth/OTP), Batches, Invites (AWS SES), Sessions CRUD, L1-L6 Rolling Avg calculation | [`ms1-core-api/src/app.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/ms1-core-api/src/app.js)<br>[`ms1-core-api/src/services/session.service.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/ms1-core-api/src/services/session.service.js) |
| **ms2-speech-agent** | Python 3.12, FastAPI, LangGraph | Real-time voice processing, STT (Deepgram), AI conversation partner (Gemini), TTS, 3D feedback pipeline | [`ms2-speech-agent/app/routes/speech.py`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/ms2-speech-agent/app/routes/speech.py)<br>[`ms2-speech-agent/app/graphs/conversation_graph.py`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/ms2-speech-agent/app/graphs/conversation_graph.py) |
| **Infra** | Docker Compose, NGINX, Certbot, OpenTelemetry | Container orchestration, reverse proxy, SSL termination, distributed tracing (Grafana Cloud OTLP) | [`infra/docker-compose.yml`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/infra/docker-compose.yml)<br>[`infra/schema.sql`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/infra/schema.sql) |

---

### End-to-End Lifecycle of a Voice Session

```
 Learner            Frontend              ms1-core-api         ms2-speech-agent      Deepgram / Gemini
    │                  │                       │                       │                    │
    ├─ 1. Start Session ──────────────────────►│                       │                    │
    │  (select mode)   │  POST /sessions/start │ (Creates Session DB)  │                    │
    │                  │◄──────────────────────┤                       │                    │
    │                  │                       │                       │                    │
    ├─ 2. Speak into mic                      │                       │                    │
    │  (Web Audio API) │                       │                       │                    │
    │                  ├─ 3. Send Turn Audio ─────────────────────────►│                    │
    │                  │  POST /speech/turn    │                       ├─ Transcribe ──────►│ (Deepgram Nova-3)
    │                  │  (base64 audio)       │                       │◄─ (Transcript+Words)│
    │                  │                       │                       ├─ Non-blocking S3 Upload
    │                  │                       │                       ├─ LangGraph Agent ─►│ (Gemini 3.1 LLM)
    │                  │                       │                       │◄─ (AI Text Reply)  │
    │                  │                       │                       ├─ Synthesize Audio ─►│ (Deepgram Aura TTS)
    │                  │◄──────────────────────────────────────────────┤◄─ (MP3 Audio Bytes) │
    │                  │  (Returns transcript, AI reply, S3 key, TTS)   │                    │
    │                  ├─ 4. Save Turn metadata ──────────────────────►│                    │
    │                  │  POST /sessions/:id/audio-key                 │                    │
    │                  │                                               │                    │
    ├─ 5. End Session ────────────────────────────────────────────────►│                    │
    │                  │  POST /speech/analyze                         ├─ Feedback Pipeline │ (Pronunciation,
    │                  │                                               │  (LangGraph 4-Node)│  Vocabulary,
    │                  │◄──────────────────────────────────────────────┤                    │  Grammar LLMs)
    │                  ├─ 6. Save Feedback & Update Levels ───────────►│                    │
    │                  │  POST /sessions/:id/feedback                  ├─ Weighted Avg      │
    │                  │                                               │  L1–L6 Calculation │
```

#### Step-by-Step Breakdown:
1. **Session Initialization**:
   - The user selects a mode (`free_talk`, `hr_interview`, or `placement`) in the Next.js UI.
   - The frontend calls `POST /api/sessions/start` on `ms1-core-api`. `ms1` initializes a session row in PostgreSQL with a unique UUID (`sessions` table).
2. **Turn Processing (Microsecond-level lifecycle)**:
   - Learner speaks into the microphone. The frontend uses the browser **Web Audio / MediaRecorder API** to record the audio buffer and encodes it as base64.
   - The frontend invokes `POST /speech/turn` on `ms2-speech-agent`.
   - **STT Processing**: `ms2` sends the audio buffer to **Deepgram Nova-3** (`stt_service.py`). It passes specialized keyterms (`v/w`, `th/d`, `r/l` pairs) to boost accuracy for Hindi accents. Deepgram returns the user transcript, per-word confidence, filler word detections (`um`, `uh`), and language clarity confidence.
   - **Async Audio Upload**: `ms2` fires an asynchronous background task (`s3_service.py`) to upload the raw user audio to AWS S3 without blocking the HTTP response.
   - **LangGraph Conversation Partner**: `ms2` executes the `conversation_graph` state machine (`conversation_graph.py`).
     - *Filler-Word Awareness*: If the user used 3+ filler words or had low language clarity, the system prompt dynamically instructs Gemini to keep its response extra brief (1 simple sentence) to reduce cognitive load on the learner.
     - Gemini 3.1 Flash generates an in-character response.
   - **TTS Audio Synthesis**: `ms2` calls **Deepgram Aura TTS** (`tts_service.py`) to convert the AI response text into MP3 audio bytes.
   - **Response to Client**: `ms2` sends back the transcript, AI text reply, S3 keys, and MP3 audio stream. The frontend plays the response audio via the Web Audio API and saves the turn record to `ms1`.
3. **Session Termination & 3-Dimension Feedback Pipeline**:
   - Learner ends the session. The frontend requests `POST /speech/analyze` from `ms2`.
   - `ms2` executes a 4-node **LangGraph Feedback Pipeline** (`feedback_pipeline.py`):
     - **Node 1 (Pronunciation)**: Combines Deepgram word confidence scores (<0.94 threshold) and language confidence with LLM phoneme reasoning tailored for Hindi speakers.
     - **Node 2 (Vocabulary)**: Analyzes word variety, identifies repeated words, and suggests higher-level CEFR vocabulary alternatives.
     - **Node 3 (Grammar)**: Detects grammatical errors (tense consistency, articles, subject-verb agreement) and provides clear rule explanations.
     - **Node 4 (Aggregator)**: Combines dimension scores (0–100), extracts positive strengths, assigns overall score, and picks an encouraging feedback message.
   - **Level Update & History**: The frontend posts the report to `ms1` (`POST /api/sessions/:id/feedback`). `ms1` calculates a **weighted rolling average** over the user's last 5 sessions (recent sessions weighted higher: 5, 4, 3, 2, 1), maps scores to CEFR levels (L1–L6), and persists updates into `users` and `level_history` tables.

---

## 2. How the System Handles Errors

EnglishX implements defense-in-depth error handling across all layers to ensure microservice resiliency and graceful fallback behavior:

### A. AI & Speech Microservice Resiliency (`ms2-speech-agent`)
1. **Missing API Keys / Deepgram & Gemini Outages**:
   - If `GOOGLE_API_KEY` is missing or fails, `conversation_graph.py` catches the exception and returns contextual fallback responses (e.g., *"I'm sorry, I had a little hiccup. Could you say that again?"*).
   - If Deepgram STT fails, `stt_service.py` logs the error and raises a handled exception, allowing the frontend to fall back to text mode (`transcribe_text_fallback`).
   - If Deepgram TTS fails or key is unconfigured, `speech.py` returns an **HTTP 204 No Content**. The frontend gracefully detects 204 and falls back to text-only UI without breaking playback audio elements.
2. **LLM Output Parsing Safeguards**:
   - The feedback analysis pipeline enforces JSON structures from Gemini. In `feedback_pipeline.py`, LLM responses are sanitized (stripping GFM code fences ` ```json `) and wrapped in try-catch blocks. If parsing fails, a default structured JSON fallback response is returned so report generation never crashes.
3. **Non-Blocking Best-Effort S3 Uploads**:
   - Audio persistence to S3 (`s3_service.py`) is wrapped in independent async try-catch blocks. If S3 upload fails (e.g., AWS credentials invalid or network glitch), it logs a warning and proceeds without interrupting the live conversation turn.

### B. Core API Error Handling (`ms1-core-api`)
1. **Global Unhandled Error Middleware**:
   - In [`ms1-core-api/src/app.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/ms1-core-api/src/app.js), Express registers an error-handling middleware (`(err, req, res, next)`) that logs full stack traces and responds with clean `{ "error": "Internal server error" }` with appropriate status codes (`500`).
2. **Abuse Protection (Rate Limiting)**:
   - Uses `express-rate-limit`:
     - `authLimiter`: Strict 10 requests / 15 mins for login/signup/OTP to prevent brute-force attacks.
     - `apiLimiter`: 100 requests / 15 mins for general API routes. Exceeding limits returns `429 Too Many Requests`.
3. **Database Integrity & Constraints**:
   - PostgreSQL schema uses foreign key constraints with `ON DELETE SET NULL` for batch relationships, and UUID check constraints (`CHECK (level BETWEEN 1 AND 6)`).

### C. Frontend Error Recovery (`frontend`)
1. **Microphone Permission / Web Audio Failures**:
   - If browser mic access is denied or unavailable, the UI enables a manual text-input box fallback, calling `transcribe_text_fallback` on `ms2`.
2. **Next.js Error Boundaries**:
   - Handled via [`frontend/src/app/error.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/frontend/src/app/error.js) and [`not-found.js`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/frontend/src/app/not-found.js), providing user recovery buttons ("Try Again") without breaking app state.

---

## 3. High Load Analysis: What Happens If Suddenly A Lot of Users Join?

If thousands of concurrent users suddenly access EnglishX on the current infrastructure, **several major bottlenecks will choke the system**:

```
                         ┌───────────────────────────────────────────────┐
                         │               TRAFFIC SURGE                   │
                         │          (10,000 Concurrent Users)            │
                         └──────────────────────┬────────────────────────┘
                                                │
                                                ▼
                         ┌───────────────────────────────────────────────┐
                         │   NGINX Single Instance (EC2 bottleneck)      │
                         └──────────────────────┬────────────────────────┘
                                                │
          ┌─────────────────────────────────────┴─────────────────────────────────────┐
          ▼                                                                           ▼
┌─────────────────────────────────────────┐                         ┌─────────────────────────────────────────┐
│           ms1-core-api                  │                         │          ms2-speech-agent               │
│ 💥 Node.js Event Loop Blocked           │                         │ 💥 FastAPI Uvicorn Threads Exhausted    │
│ 💥 Postgres DB Pool Exhaustion (500 Error)│                        │ 💥 Gemini & Deepgram Rate Limit (429)  │
│ 💥 In-Memory Rate Limiter Blocks Users  │                         │ 💥 Heavy Base64 Payload Memory Spikes   │
└─────────────────────────────────────────┘                         └─────────────────────────────────────────┘
```

### Critical Bottlenecks Identified:

1. **Single-Instance Monolith Deployment (Compute Bottleneck)**:
   - In [`infra/docker-compose.yml`](file:///d:/Coding/bootcamp/EnglishX/EnglishX/infra/docker-compose.yml), `ms1`, `ms2`, `frontend`, and `nginx` run as single containers on **a single EC2 instance**.
   - FastAPI and Node.js will saturate 100% CPU quickly under simultaneous voice turns.
2. **Synchronous Third-Party API Blocking (Latency Bottleneck)**:
   - Every audio turn waits synchronously for Deepgram STT HTTP response + Gemini 3.1 LLM response. Under high load, connection pools to Gemini/Deepgram saturate, causing requests to queue up and hit HTTP timeout (504 Gateway Timeout).
3. **Database Connection Pool Exhaustion (Storage Bottleneck)**:
   - PostgreSQL connections will exhaust. Requests to save sessions, record turns, and fetch user levels will hang or fail with `too many clients already` errors.
4. **Base64 Audio Memory Bloat (Network & RAM Bottleneck)**:
   - Sending raw audio as base64 string inside JSON HTTP POST requests increases payload size by **33%**. Processing hundreds of 2-5 MB base64 payloads simultaneously will cause high memory pressure and Node/Python Garbage Collection freezes.
5. **In-Memory Rate Limiting Failure**:
   - `express-rate-limit` keeps counters in process memory. If scaled horizontally without shared storage, rate limits cannot be shared across instances.

---

## 4. Scalability Architecture Plan: How to Make EnglishX Enterprise Scale

To scale EnglishX to handle **100,000+ active learners** with sub-second latency, we must implement a **Cloud-Native, Event-Driven Architecture**:

```
                                      ┌───────────────────────┐
                                      │   Cloudflare CDN /    │
                                      │   DDoS Protection     │
                                      └───────────┬───────────┘
                                                  │
                                      ┌───────────▼───────────┐
                                      │ AWS Application Load  │
                                      │    Balancer (ALB)     │
                                      └───────────┬───────────┘
                                                  │
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                                                   ▼
  ┌───────────────────────────┐                                       ┌───────────────────────────┐
  │   ms1 Core API Cluster    │                                       │   ms2 Speech Agent Cluster│
  │ (ECS Fargate / EKS Auto)  │                                       │ (ECS Fargate / EKS Auto)  │
  └─────────────┬─────────────┘                                       └─────────────┬─────────────┘
                │                                                                   │
    ┌───────────┴───────────┐         ┌───────────────────────────┐         ┌───────┴───────┐
    │  PgBouncer Pooler     │         │   Redis Cluster           │         │ AWS S3 Direct │
    │         │             │         │ - Distributed Rate Limit  │         │ Presigned URL │
    │  AWS RDS Postgres     │         │ - Session Cache           │         └───────────────┘
    │ (Multi-AZ + Read Reps)│         │ - Celery / BullMQ Queue   │
    └───────────────────────┘         └───────────────────────────┘
```

### Key Scalability Improvements:

#### 1. Horizontal Autoscaling & Container Orchestration
- Migrate from Docker Compose on a single EC2 to **AWS ECS Fargate** or **Kubernetes (EKS)** with **HPA (Horizontal Pod Autoscaler)**.
- Set scaling triggers based on CPU usage (>70%) and HTTP request latency. Place an **AWS Application Load Balancer (ALB)** in front for TLS termination and multi-AZ traffic distribution.

#### 2. Streaming Audio over WebSockets / WebRTC
- Replace HTTP POST base64 turn polling (`POST /speech/turn`) with a **WebSocket / WebRTC connection** directly streaming audio chunks to Deepgram streaming API.
- Enables **real-time streaming transcription** and streaming LLM tokens back to the user, reducing turn latency from ~2.5s down to **<500ms**.

#### 3. Offload Audio Payload Storage via Direct S3 Presigned Uploads
- Instead of routing heavy audio files through microservice memory, frontend requests a **Presigned S3 URL** from `ms1` and uploads audio directly from the browser to AWS S3.

#### 4. Async Task Queues for Feedback Analysis (Celery / BullMQ + Redis)
- The 4-node LangGraph feedback analysis pipeline takes 3-6 seconds of LLM execution time.
- Offload `POST /speech/analyze` to an asynchronous task worker queue (**Celery** in Python or **BullMQ** in Node.js) backed by **Redis**. The client receives a `202 Accepted` job ID and polls or receives a WebSocket notification when feedback is ready.

#### 5. Database Optimization & Distributed Caching
- **Connection Pooling**: Implement **PgBouncer** in front of PostgreSQL to reuse connections across scaled instances.
- **Read Replicas**: Direct dashboard read queries (`GET /dashboard/learner`, `GET /dashboard/admin`) to RDS Read Replicas, leaving the master instance dedicated to active session writes.
- **Redis Caching**: Cache user profile data, active session context, and store rate-limiting keys in Redis (`rate-limit-redis`).

#### 6. Multi-LLM Fallback & Circuit Breaker Pattern
- Wrap Deepgram and Gemini API calls with a Circuit Breaker (e.g., `pybreaker` / `opossum`).
- If Gemini hits rate limits (HTTP 429), automatically failover to secondary LLM endpoints (e.g., OpenAI GPT-4o-mini or self-hosted vLLM / Llama-3 instances).
