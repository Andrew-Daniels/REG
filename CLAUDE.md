# Price Is Fairway — contributor notes

House-price-guessing party game with golf scoring. Mobile-first, TDD, free to operate.

## Layout
- `src/core/` — pure game logic (TDD). No React/DOM here.
  - `scoring.ts` golf tiers + ranking · `listing.ts` model + info presets · `game.ts` round state machine
  - `daily.ts` deterministic daily pick + share card · `asyncGame.ts` play-by-link match
- `src/data/` — `ListingProvider` interface, status/recency filter, bundled `seedListings` (default, free).
- `src/audio/` — `notes.ts` (pure, tested theme) + `engine.ts` (Web Audio playback).
- `src/ui/` — React screens/components (mobile-first). `src/state/` hooks + settings.
- `src/net/` — WebSocket client (`useLobby`) + shared `protocol.ts`.
- `server/` — `lobby.ts` (pure, tested) + `index.ts` (WS server + static host).
- `tests/` — Vitest. `scripts/` — Playwright screenshot harnesses.

## Workflow
- `npm test` (TDD — write/keep tests green), `npm run typecheck`, `npm run build`.
- `npm run dev` (client) + `npm run server` (lobby) for live mode; `npm start` for prod-style.
- Keep new game rules in `src/core` with tests before wiring UI.

## Conventions
- Listing prices are the answer: never send the current round's `price` to clients
  until reveal (see `sanitize` in `server/index.ts`).
- External resources (Unsplash photos, OSM tiles) must degrade gracefully — components
  render fallbacks so the game works offline / behind strict networks.
- Data stays behind `ListingProvider` so a free-tier live API can be dropped in later.
