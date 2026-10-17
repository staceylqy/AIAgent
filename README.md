# AIAgent

Stroke patient support-program navigator for medical social workers (MSWs) at Japanese acute-care hospitals.

## What it is

A single-screen web app that helps MSWs figure out which public support programs a stroke patient qualifies for, and drafts explanations for staff and family.

## Who uses it

Only the MSW. Patients and families never touch the app; they get a handout the MSW has reviewed and edited.

## Why it matters

Stroke patients stay about 2 weeks, and in that window the MSW has to sort out financial support and discharge plans under hard deadlines. MSWs are understaffed and spend much of their time rewriting the same patient info for different audiences, instead of supporting anxious families.

## How it works

1. **Input form** — the MSW enters patient attributes (age, insurance type, employment, diagnosis, family situation, expected ADL level).
2. **Eligibility check (deterministic, no LLM)** — code evaluates the patient against a small rule table (JSON, about 8–10 programs) and returns the matching programs. The LLM never decides eligibility, so it can't hallucinate a program.
3. **Text generation (LLM)** — for each matched program, the LLM writes (a) why it applies, for the MSW, and (b) a plain-language version for the family.
4. **Output — two views**:
   - **MSW timeline** — each program tagged "Now", "During stay", or "After discharge", with the reason and a source link.
   - **Family handout** — the same content in plain language, with a "to-do this week" list.
5. **Family share (add-on)** — the MSW presses 「家族と共有する」 to publish the reviewed handout as a live page:
   - A QR code + link (`/f/<token>`) is added to the printed handout; scanning it opens a mobile, calm checklist.
   - The family checks off tasks (with an optional "who completed this?" dialog).
   - 「チャットで質問する」 opens a chatbot that answers only from the shared handout (deterministic, JA/EN); questions it cannot answer can be forwarded to the MSW with one tap.
   - The MSW sees forwarded questions in the 「家族との共有」 panel (3-second polling) with an unread badge.
   - Nothing reaches the family until the MSW shares; the family page never runs eligibility or calls the LLM.
   - Links expire after 30 days, can be re-issued (lost paper) and stopped; a JA/EN toggle is on the family page.

## Demo personas

- 52-year-old employed patient
- 78-year-old living alone

They produce clearly different programs and handouts, showing the branching logic.

## Out of scope

- No EHR integration; uses fictional patient personas.
- No hospital matching.
- No automated decisions; the MSW always has the final say.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite (single-screen app)
- **Eligibility**: deterministic rule engine (`src/eligibility/engine.ts`) over a JSON rule table (`src/data/programs.json`, 10 programs)
- **Text generation**: `LlmProvider` interface (`src/llm.ts`) — currently a deterministic mock that fills patient-specific templates; swap in a real API later without touching the UI
- **UI language**: Japanese / English toggle
- **Family share**: in-memory share server (`server/`) mounted as a Vite plugin — API under `/api/share/*`, family page at `/f/:token` (single-file HTML, no external assets), QR codes via `qrcode.react`
- **Tests**: Vitest (engine branching logic, generated-text placeholders, share snapshot & store)

## Getting started

```bash
npm install
npm run dev      # start the dev server (LAN-exposed so a phone can scan the QR)
npm test         # run the eligibility engine + mock LLM + share tests
npm run build    # type-check and build for production
```

## Project structure

```
src/
├── App.tsx                  # single screen: form + two output views (+ share badge)
├── components/
│   ├── PatientForm.tsx      # patient attribute input
│   ├── MswTimeline.tsx      # programs grouped by Now / During stay / After discharge
│   ├── FamilyHandout.tsx    # plain-language handout, editable + printable (+ print QR box)
│   └── SharePanel.tsx       # 「家族との共有」 panel: QR, tasks, questions, reissue/revoke
├── share/
│   ├── ShareContext.tsx     # share state + 3s polling + unread badge
│   ├── snapshot.ts          # builds the JA/EN snapshot of the approved handout
│   ├── api.ts               # share API client
│   └── types.ts             # SharedPlan / SharedTodo / SharedQuestion
├── data/
│   ├── programs.json        # rule table (10 support programs, JA/EN)
│   ├── programs.ts          # typed loader
│   └── personas.ts          # the two demo personas
├── eligibility/
│   ├── engine.ts            # deterministic JSON rule evaluation
│   └── engine.test.ts
├── llm.ts                   # LlmProvider interface + mock implementation
├── llm.test.ts
└── i18n.ts                  # JA/EN UI strings and label maps
server/
├── share.ts                 # Vite plugin: /api/share/* endpoints + /f/:token page
├── chatbot.ts               # handout-grounded chatbot (deterministic, JA/EN)
├── store.ts                 # in-memory SharedPlan store (token, expiry, reissue)
├── familyPage.ts            # family page HTML (JA/EN toggle, chat, no external assets)
└── store.test.ts
```

## Disclaimer

Learning demo. Eligibility rules are simplified and do not guarantee actual entitlement; always verify with official sources before applying.
