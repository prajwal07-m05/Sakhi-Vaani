# database
- `schemas/recordSchemas.ts` — field definitions for VHR, ASHA Diary, Maternal, HBNC, Immunisation, Postnatal, Elderly; `recordTypesFor(category)`.
- `seed/seed.ts` — synthetic seed (2 demo accounts, Demo Village, 25 households, 48 beneficiaries, visits, documents). Dates are relative to "today".
- `demo-data/schemes.ts` — schemes (source URL, last reviewed, verification status), deterministic eligibility rules, question bank (EN/HI/KN).
- `demo-data/knowledge.ts` — source-backed health information, UIP schedule reference, HBNC visit days, emergency numbers.
All data is synthetic. See `docs/DATABASE.md`.
