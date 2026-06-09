# Star Trader

A digital adaptation of Paul Elliott's solo trading game **Star Trader** (Zozer
Games), built on the **Cepheus Engine** speculative-trade rules (Open Game
Content, OGL 1.0a — Samardan Press).

Buy cargo cheap on one world, jump, sell it dear on another. The balance sheet
is the score; the mortgage is the clock.

## Play

**[Play it in your browser](https://kieferhart.github.io/startrader/)** — or
clone the repo and open `index.html`. No install, no build, no server. Your
game auto-saves in the browser (localStorage).

## Features

- Auto-generated subsector with full Cepheus UWPs and trade codes
- **Interactive star map** — click a world to plot your jump; range, starport
  class and trade codes at a glance
- Cepheus Engine trade engine: D66 trade-goods table, purchase/resale DMs,
  broker rolls — with 1,800 thematic specific goods across 36 categories
- **Star Trader d66 event tables with teeth**: World, Port and Jump events pop
  up with real consequences — credits, time, cargo — and decision points
  (smuggle the package? outbid the rival? fight the pirates?)
- Crew that matter: skills resolve events (Medic prevents quarantines, Engineer
  halves repairs, Leadership holds morale), plus UPPs and NPC relationships
- Ship operating costs: 40-year mortgage, crew salaries, maintenance, life
  support — billed every 4 weeks
- Financials: full profit & loss and balance sheet, reconciled to the credit

## Project layout

```
index.html        markup + script load order (data → world → ship → game →
                  events → npc → ui → main; plain scripts, no build step)
css/style.css     dark monospace "spreadsheet" theme
js/data.js        trade goods, 50-name pools per category, price table
js/world.js       UWP generation, trade codes, subsector, hex math
js/ship.js        ships, crew generation, running costs
js/game.js        game state, books, market, buy/sell, time, jump
js/events.js      d66 event mechanics, pop-up queue, player choices
js/npc.js         contacts and small shared helpers
js/ui.js          rendering, star map, modals
js/main.js        boot
```

## Testing

There is no framework; tests run in Node against the concatenated sources:

```bash
cat js/data.js js/world.js js/ship.js js/game.js js/events.js js/npc.js js/ui.js js/main.js > /tmp/st.js
node --check /tmp/st.js
```

then eval the source plus assertions in one scope with mocked
`document`/`localStorage` (see `CLAUDE.md` for the harness pattern and the
invariants worth asserting — above all **books reconciliation** after every
action).

## Credits & legal

- *Star Trader* solo game design: Paul Elliott, **Zozer Games**. The d66
  World/Port/Jump event tables are adapted from that book — buy it; it's
  excellent. The book's PDF is not included in this repository.
- Trade, world-generation and ship-economics rules: **Cepheus Engine System
  Reference Document** (Samardan Press), used as Open Game Content under the
  Open Game License v1.0a — see `LICENSE.md`.
- This project is not affiliated with Zozer Games, Mongoose Publishing or Far
  Future Enterprises.
