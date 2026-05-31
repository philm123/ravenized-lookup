# Momentum — Decision Log

| Date | Decision | Rationale | Revisit When |
|---|---|---|---|
| 2026-05-30 | Storm data from Open-Meteo + Zippopotam.us APIs | Free, no API key. Derives events from real WMO weather codes (hail: 96/99, thunderstorm: 95) and wind gust thresholds. 6h in-memory cache. Mock fallback on API failure (`STORM_SOURCE=mock` to force). `lib/storm-api.ts` | API rate limits become an issue or need NOAA Storm Events for official event records |
| 2026-05-12 | ~~Storm data is mocked via deterministic hash~~ | ~~No weather API budget for v1~~ | Replaced 2026-05-30 — mock kept as fallback in `lib/storm-mock.ts` |
| 2026-05-12 | Fit score calculated server-side from criteria codes | Keeps scoring logic centralized, criteria codes already in data | Brand builder flow is added (scores become brand-relative) |
| 2026-05-12 | Leads stored in localStorage, not a database | No auth system in v1 | Auth/sign-up flow is implemented |
| 2026-05-12 | No sign-up/auth flow | BDR persona doesn't need it for v1 utility | Multi-user or Owner persona is built |
| 2026-05-12 | SQLite for data storage | 30K rows is perfect for SQLite, no external DB needed, deploys with the app | Dataset exceeds 500K rows or needs real-time updates |
| 2026-05-12 | Pattern A only (no B/C) | BDR field use case ships first | Marketing/Owner personas are added |
| 2026-05-12 | Web-first, not native | Faster to ship, works on any phone browser | Field testing reveals PWA limitations that require native |

## What is NOT in v1

- Sign-up / auth flow
- Brand builder questionnaire
- CRM integration
- Map view
- Address-level marking
- Marketing/Owner persona views
- Ad avenue recommendations
- ~~Real storm data integration~~ (done 2026-05-30)
- PWA/offline support
- Multi-user / team features
