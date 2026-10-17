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
- **Tests**: Vitest (engine branching logic + generated-text placeholders)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run the eligibility engine + mock LLM tests
npm run build    # type-check and build for production
```

## Project structure

```
src/
├── App.tsx                  # single screen: form + two output views
├── components/
│   ├── PatientForm.tsx      # patient attribute input
│   ├── MswTimeline.tsx      # programs grouped by Now / During stay / After discharge
│   └── FamilyHandout.tsx   # plain-language handout, editable + printable
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
```

## Disclaimer

Learning demo. Eligibility rules are simplified and do not guarantee actual entitlement; always verify with official sources before applying.
