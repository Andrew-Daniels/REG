# 🏡⛳ Price Is Fairway

A mobile-first **house-price-guessing party game** with **golf scoring**. Players
join a lobby from their phones with a code, study a real listing (photos +
map + selected details), and guess the price. Closest guesses score like golf —
hole-in-one, birdie, par, bogey — and the lowest total wins.

> **Free to operate.** Maps use Leaflet + OpenStreetMap (no key). Sounds and the
> theme song are synthesized with the Web Audio API (no licensing). Listing data
> comes from a bundled seed dataset by default, with a pluggable adapter for a
> free-tier real-estate API when a key is supplied.

## Game modes
- **Party (local lobby):** host on the big screen, up to 20 players join by code from phones.
- **Solo:** play for a personal best on the leaderboard.
- **Daily Challenge:** everyone gets the same 10 houses each day; share a Wordle-style score card.
- **Pass-and-play / text-message async:** game state encodes into a shareable link; friends take a turn and re-send. In a group, everyone plays round _n_ before anyone plays round _n+1_.

## Scoring (golf — lower is better)
| Result | Abs. price error (medium) | Strokes |
|---|---|---|
| 🏆 Hole in One | ≤ 2% | −3 |
| 🦅 Eagle | ≤ 5% | −2 |
| 🐦 Birdie | ≤ 10% | −1 |
| 🟢 Par | ≤ 20% | 0 |
| 😬 Bogey | ≤ 35% | +1 |
| 😵 Double Bogey | ≤ 50% | +2 |
| 💀 Triple Bogey | ≤ 75% | +3 |
| 🌲 Out of Bounds | > 75% | +4 |

Difficulty presets scale the thresholds (easy ×1.5, hard ×0.6).

## Powerups
Lose a round (bogey or worse) and earn a **powerup** that reveals one hidden
detail on the next listing (year built, days on market, lot size, etc.).

## Host options
Hosts choose which listing details are shared (beds/baths/sqft/year/DOM/lot/type),
pick easy/medium/hard presets, and toggle which listing statuses are in play
(active / pending / closed) plus a recency window (default: sold in the last ~month;
optionally include the "very very past").

## Tech / development
- Vite + React + TypeScript, **developed in TDD with Vitest**.
- Pluggable `ListingProvider` (seed dataset default; free-API adapter optional).
- Leaflet maps, Web Audio sound engine.

```bash
npm install
npm test        # run the TDD suite
npm run dev     # play locally
```

## Running the live (phone-lobby) mode
```bash
npm run dev          # client at :5173
npm run server       # lobby WebSocket server at :8787 (separate terminal)
# or, production-style (one process serves the built client + WS):
npm start            # build + serve on :8787
```
Open the host on the big screen ("Big Screen Party"), then players open the same
URL on their phones, tap "Join a Lobby", and enter the 4-letter code.

## Build roadmap (loop progress)
- [x] Golf scoring engine (tiers, difficulty scaling, ranking)
- [x] Listing model + info-share presets + powerup reveal logic
- [x] Pluggable data provider + status/recency filtering + 24-listing seed dataset
- [x] Game session state machine (rounds, guesses, standings, celebrations)
- [x] Daily challenge (deterministic 10-house selection + shareable score)
- [x] Async link-state encoding for text-message play
- [x] React UI: home, setup, big-screen, phone controller (mobile-first)
- [x] Leaflet map + photo viewer (graceful offline fallbacks)
- [x] Web Audio sound engine (ticking timer, theme song, celebrations)
- [x] Multiplayer lobby server (WebSocket, up to 20 players, answer-hiding)
- [x] Screenshot-driven design iteration (Playwright)

### Possible next steps
- Live API adapter (e.g. RentCast free tier) implementing `ListingProvider`
- Per-player round timer enforcement on the server (auto-lock at 0)
- Reconnect polish + lobby cleanup TTLs
- Richer celebrations / leaderboard persistence across sessions
