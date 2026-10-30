# Team workflow (4 developers)

## Repository setup
1. One person creates the GitHub repo `sakhi-vani` (private), pushes `main`, then creates `develop`.
2. Protect `main` and `develop`: PR required, 1 review, tests passing.
3. Everyone clones, runs `setup.bat`, and works on feature branches from `develop`.

## Branches
`main` (demo-ready) · `develop` (integration) · `feature/mobile-ui` · `feature/backend` · `feature/voice-calling` · `feature/schemes-notifications` · short-lived `fix/<topic>`.

## Ownership
| Dev | Area | Main folders |
|---|---|---|
| 1 | Mobile UI, auth screens, ASHA + citizen dashboards, navigation | `mobile-app/src/screens`, `components`, `App.tsx`, `i18n.ts` |
| 2 | Backend, database, auth, records, visits/follow-ups | `backend-api/`, `core/service.ts` (records/visits sections), `database/` |
| 3 | AI orchestration, voice documentation, calling, speech | `ai-services/orchestrator`, `ai-services/agents`, `voice-services/`, `calling-services/` |
| 4 | Schemes, eligibility, notifications, tests, integration | `ai-services/eligibility`, `database/demo-data`, notification rules in `core/service.ts`, `tests/` |

## Pull requests
- Small PRs into `develop`; title `[area] what changed`; describe testing done.
- Run `run-tests.bat` before opening a PR; add a test for every new rule.
- Never commit `.env`, real data, API keys or `node_modules`.

## Integration order
1. `shared-types` + `core/contract.ts` changes first (they are the contract between mobile and backend).
2. Backend/service implementation + tests.
3. Mobile screens consuming the new methods.
4. Voice/calling/AI adapters behind existing interfaces.

## Avoiding merge conflicts
- Agree contract changes (types, routes) in a short PR before building on them.
- Keep screens in separate files per area; avoid reformatting files you don't own.
- `core/service.ts` is shared: add new methods in your own section and rebase often (`git pull --rebase origin develop`).
- Translations: add new keys at the end of each language block in `i18n.ts`.

## Environment configuration
Each developer keeps their own `backend-api/.env` (from `.env.example`). Shared secrets go in a password manager, never in Git. Use the in-app demo backend for UI work without running the API.
