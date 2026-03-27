# WarGames — Global Thermonuclear War

A browser-based strategy game inspired by the 1983 film *WarGames*. Play as the United States against the Soviet Union (controlled by JOSHUA, the WOPR AI) in a turn-based nuclear war simulation rendered in a retro CRT terminal aesthetic.

## How to Play

Open `index.html` in any modern browser — no build step or server required.

1. **Boot Sequence** — Watch the WOPR system initialize
2. **Login** — Enter any username/password (try password `joshua` for an easter egg)
3. **Select Scenario** — Choose from Standard, Limited, or Full Thermonuclear War
4. **Target & Launch** — Click enemy cities on the world map to target them, then launch your missiles
5. **Survive** — JOSHUA will counter-strike; manage DEFCON levels across multiple rounds

## Features

- Authentic WOPR terminal interface with CRT scanlines and green phosphor glow
- Typewriter-style JOSHUA AI dialog with movie-accurate quotes
- Interactive SVG world map with animated missile trajectories and explosions
- Three difficulty modes with varying round counts and strike limits
- DEFCON escalation system and missile reserve tracking
- The iconic conclusion: *"The only winning move is not to play."*

## Files

| File | Description |
|------|-------------|
| `index.html` | Main entry point |
| `style.css` | Retro terminal styling (CRT effects, animations) |
| `game.js` | Complete game logic, AI, and rendering |