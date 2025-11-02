# TigerTix – Testing (Task 3)

## Strategy
- **Unit/Integration (Automated)**  
  - Admin: event creation/validation  
  - Client: list + transactional purchase  
  - LLM: parse (LLM mocked) + confirm (transaction safety)  
  - Frontend: LlmAssistant proposal → confirm (no auto-booking)
- **E2E (Manual)**  
  - Voice flow, screen-reader announcements, keyboard-only nav, concurrency

## Automated Suites
- All tests: `npm test`
- Watch: `npm run test:watch`
- Coverage: `npm run test:coverage`

## Covered Files
- `tests/admin/adminRoutes.int.test.js`
- `tests/client/clientRoutes.int.test.js`
- `tests/llm/parseWithLLM.test.js`
- `tests/llm/confirm.int.test.js`
- `tests/frontend/LlmAssistant.test.js`

## Manual Checklist
- [x] **Text flow:** “Show events” lists events (and short spoken summary).  
- [x] **NL booking:** “Book two tickets for Jazz Night” → shows proposal only → **Confirm** → success and tickets decrement.  
- [x] **Voice input:** Mic beeps → recognized text appears **before** sending → proposal → **Confirm** → success.  
- [x] **A11y:**  
  - Tab order reaches Skip link, controls, Confirm button; visible focus rings.  
  - Live region announces status/booking messages.  
  - Buttons have clear `aria-label`s (Send, Mic, Confirm).  
- [x] **Concurrency:** With 1 ticket left, trigger two confirms quickly → one 200, one 409 (sold out).

