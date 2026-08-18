# Project Agent Instructions — Vietnamese TTS App

## Behavioral Rules (Non-Negotiable)

### 1. No Over-Engineering (Karpathy Guidelines)
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" that wasn't requested.
- Ask: "Would a senior engineer say this is overcomplicated?" -> If yes, simplify.
- Every changed line must trace directly to the user's request.
- Touch only what you must. Don't "improve" adjacent code.

### 2. No Silent Assumptions -> Brainstorming First
- If **anything is uncertain**, stop and enter brainstorming mode.
- State assumptions explicitly before implementing.
- If multiple interpretations exist, present them — don't pick silently.
- Never assume API behavior, data shapes, or user intent without confirmation.
- Trigger brainstorming when: new features, architecture changes, ambiguous requirements.

### 3. Plan + Docs Before Implement
- Always create/update `implementation_plan.md` before writing code.
- Always update `docs/` with design decisions, API contracts, architecture diagrams.
- No code without a confirmed plan. No plan without user approval.
- Workflow: Research -> Brainstorm -> Plan (with docs) -> User approves -> Implement -> Verify.

### 4. Never Delete Files Without Permission
- NEVER run rm -rf, del /f /s /q, or any destructive command without explicit user confirmation.
- If a file needs to be deleted, ask first.
- Same rule for overwriting critical files (config, .env, migrations).
- If a refactor makes a file obsolete, mention it — don't delete it unilaterally.

DELETE REQUEST FORMAT:
  WARNING DELETE REQUEST: I want to delete [filename].
  Reason: [reason]
  Action: Please confirm with "yes delete" before I proceed.

### 5. TDD — Test First
- Write failing test BEFORE implementation code.
- Watch test fail, then write minimal code to pass.
- Every new function/method must have a test.
- Tests use real code — mocks only when unavoidable (external APIs).

---

## Project Context

**App**: Vietnamese Text-to-Speech Web App
**MVP1 Scope**: Vietnamese text -> MP3 audio download

### Tech Stack
| Layer | Technology |
|---|---|
| Backend | .NET 10 C# Minimal API |
| Frontend | React + Vite (TypeScript) |
| TTS Provider | Gemini TTS API (gemini-2.5-flash-preview-tts) |
| Deploy FE | Vercel |
| Deploy BE | Railway / Render |

### Provider Strategy
- Primary: Gemini TTS — API key stored in backend .env (never exposed to frontend)
- Default Voice: Charon (Firm/Informative) — closest to "Adam" TikTok style
- Voice selection: User can pick from all 30 Gemini prebuilt voices
- Roadmap MVP2: ElevenLabs integration (true Adam voice)

### Architecture Pattern
```
User Browser (React)
    |-- POST /api/tts { text, voice, speed } -->
.NET 10 Backend (proxy)
    |-- calls Gemini TTS API with server-side key -->
Gemini TTS
    |-- returns audio bytes -->
.NET converts -> MP3 -> returns to frontend
User downloads MP3
```

### Non-Goals (MVP1)
- No user authentication
- No conversation history
- No rate limiting
- No ElevenLabs / local model
- No multi-language (Vietnamese only)
- No batch processing

---

## Decision Log

| Decision | Alternatives Considered | Reason |
|---|---|---|
| Gemini TTS | ElevenLabs, OpenAI TTS | User has Gemini key, free tier sufficient |
| Charon as default | Kore, Orus, Fenrir | Firm+Informative style -> closest to Adam-like |
| .NET backend proxy | Direct FE -> API | Hide API key, handle CORS, future rate limit hook |
| React Vite | Angular | Faster MVP, user preference |
| Vercel + Railway | Azure, AWS | Free tier, zero-config deploy |
