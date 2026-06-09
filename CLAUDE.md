# Star Trader — project guide for Claude

A digital adaptation of **Star Trader** (Paul Elliott / Zozer Games),
a solo trading game for the *Traveller* RPG. You buy cargo cheap on one world,
jump, and sell it dear on another; a running balance sheet is the score.

## The rules that matter most

**Multi-file, but still zero-toolchain.** The app is plain HTML/CSS/JS — no build
step, no dependencies, no framework, no ES modules. It runs by opening `index.html`
in any browser (classic `<script>` tags share one global scope). Do not add a
bundler, package.json, or module system.

**Script load order is the architecture.** `index.html` loads, in this exact order:
`js/data.js → js/world.js → js/ship.js → js/game.js → js/events.js → js/npc.js →
js/ui.js → js/main.js`. The files are sequential slices of what was once one script;
top-level `const`/`let` in any file is visible to all later files (and to inline
`onclick` handlers). If you add a file, add its `<script>` tag in dependency order
and update the test concatenation command below.

**Hosted on GitHub Pages** (repo `kieferhart/startrader`, served from the `main`
branch root — push to `main` deploys). `Star_Trader.pdf` and all PDFs are gitignored:
the book is Zozer Games' copyrighted work and must never be committed.

## What it is / source material

- The book (`Star_Trader.pdf`) is the design source. It is a *paper* solo game: a
  10-step loop (search cargo → buy → world event → jump → sell → repeat) plus d66
  event tables, ship operating costs, and crew NPCs.
- **Rules source = Cepheus Engine SRD** (Open Game Content, OGL 1.0a — Samardan Press;
  *not* Mongoose/Far Future closed content). The app copies, faithfully, the Cepheus
  D66 trade-goods table, world generation + trade codes, purchase/resale DMs, the
  modified-price table, broker rolls, crew salaries, and ship running costs. Reference
  markdown: github.com/orffen/cepheus-srd → `book2/trade-and-commerce.md`,
  `book2/off-world-travel.md`, `book3/worlds.md`. (`Traveller_Core_Rulebook_2020_-_BW.pdf`
  in the folder is a watermarked personal copy for cross-reference only — it contains
  **no** OGC; do not copy from it or redistribute it.)
- The d66 **event tables** (`WORLD_ENC`/`PORT_ENC`/`JUMP_ENC`) are Star Trader's own
  (Zozer Games), *not* Cepheus — keep them attributed separately.
- **Known SRD quirk:** Cepheus's worlds.md literally says Hydrographics = 2D6−7+**Size**;
  the app follows that text. (Most Traveller variants use +Atmosphere — flagged, not a bug.)

## Architecture (where things live — file noted per item)

File map: `js/data.js` (goods, GOODNAMES, price), `js/world.js` (world gen, hexes),
`js/ship.js` (ships, crew, running costs), `js/game.js` (books, state, market,
trade, time, jump), `js/events.js` (event tables + mechanics + choices + pop-ups),
`js/npc.js` (contacts, `here`/`logEntry`/`flash`), `js/ui.js` (rendering, star map,
modals), `js/main.js` (boot), `css/style.css`, `index.html`.

- **`COMMON` / `TRADE` / `ALLGOODS`** — the Cepheus trade-goods table. `COMMON` (6
  goods, ids 101–106) is always available; `TRADE` is the D66 map (keys 11–65; 66 =
  "Unusual Cargo", deliberately skipped). Each good: `base` price, `tons` dice spec
  (e.g. `'2D6*5'`, rolled by `rollTons`), `pDM` (purchase DMs, world makes it cheap),
  `rDM` (resale DMs, world wants it), `illegal`. **Availability is by random D66 roll,
  not by trade code** — codes only drive price.
- **`GOODNAMES` + `goodVariant(id)` / `goodCat(o)`** — 50 thematic specific names per
  good category (36 categories, 1,800 names). The category keeps ALL mechanics (base
  price, DMs, tonnage dice, legality); the variant name is rolled when a lot reaches
  the market (`makeOffer`, `addSeizedLot`, auction) and carried into the hold. Offers
  and hold entries have `name` (variant) + `cat` (category); `goodCat()` falls back to
  `ALLGOODS[id].name` for pre-variant saves. Keep each list at exactly 50 unique names.
- **Star map** — `renderMap()` draws an interactive SVG hex grid (flat-top, odd-q,
  `hexCenter()` matches the `cube()`/`hexDist` math — verify adjacency if you touch
  either). Worlds are clickable (`selectDest`), tooltips via SVG `<title>`, current
  world ringed green, destination blue with a dashed jump line, in-range hexes
  brightened, starport class colours via `SP_COLOR`. The old sorted list remains
  below it as "World List".
- **`PRICE` + `priceMult(result, sale)`** — Cepheus modified-price table, keyed by the
  **2D6 check result** (clamped 2…16). `maxDM(dm, codes)` returns only the *largest*
  matching DM (Cepheus rule). Buy result = `2d6 + broker + maxDM(pDM) − maxDM(rDM)`;
  sell flips the two. Higher result = cheaper buy / dearer sale. Table is monotonic.
- **World gen** — `genUWP`, `tradeCodes`, `genSubsector` (8×10 hex), `hexDist` (odd-q
  cube distance), `uwpString`. UWP = Starport/Size/Atmo/Hydro/Pop/Gov/Law-TL, all per
  Cepheus (starport = 2D6−7+Pop; pop-0 zeroes gov/law/tl; full TL DM table + min-TL).
- **`SHIPS`** — per-ship `cargo`, `jump`, `perJump` fuel, `mortgage` (= price/240,
  40-yr note), `price`, `broker`. **Salaries, maintenance and life support are NOT on
  the ship object** — they're derived live: `crewSalaries()` (sum of `G.crew` salaries),
  `shipMaint()` (0.1%/yr of price ÷12), `lifeSupport()` (Cr2,000 × `staterooms()`,
  staterooms = ⌈crew/2⌉). `monthlyTotal()` = mortgage + salaries + maint + life support.
  The `easy` hauler is mortgage-free (low-stress mode).
- **Crew** — `genCrew`, `CREW_TMPL`, `SKILLPOOL`, `NPC_REL` (the book's d66 relationship
  table). Each member: UPP (6 hex chars, STR·DEX·END·INT·EDU·SOC), age, skills,
  salary, and a relationship pointing at another crewmate.
- **Books / financials** — `emptyBooks`, `book(cat, amt)`, `inventoryValue`,
  `netWorth`. Drives the P&L + balance-sheet modal.
- **Event tables** — `WORLD_ENC`, `PORT_ENC`, `JUMP_ENC` (d66 strings from the book),
  rolled by `rollWorldEncounter(force?)` / `doPortEvent(force?)` / `rollJumpEvent(force?)`
  (the optional arg forces a d66 result — used by the test harness). **Every entry now
  has a mechanical consequence**, adjudicated per the book's own text (skill rolls,
  Cr costs, cargo loss, the auction DM ladder, the graded patrol-ship sub-table).
- **Event mechanics layer** —
  - `G.mods` (`emptyMods()`): short-lived bonuses. `buyDM`/`extraLots` are consumed by
    the next `generateMarket()`; `nextTradeDM` by the next sale roll; `nextContactDM`
    by the next contact search; `trained` by the next `skillCheck`.
  - `crewSkill(...names)` / `skillCheck(target,...names)` — crew skills are mechanical:
    best matching skill level is the DM on 2D6 vs target (Medic prevents quarantine /
    bills, Engineer halves repairs, Leadership guards morale, etc.).
  - **Event pop-ups** — events surface as modals via a transient queue (`EVQ`,
    `pumpEvents`/`evNext`, layer `#ev-bg` separate from the Ship/Crew modal).
    `showEvent` both queues a pop-up and prepends a history card to the Bridge feed
    (`#event-area`). Decision pop-ups (`EV_CHOICE`) can't be backdrop-dismissed.
  - **Choice engine** — events with a decision call
    `offerChoice(kind,title,roll,text,data,options)`; `G.pendingChoice` persists across
    save/load (`renderPendingChoice()` in `renderAll` re-opens the pop-up). Option
    buttons call `resolveChoice(k)`, dispatching to the `CHOICES[kind]` handler
    (returns outcome HTML, shown in the pop-up + feed). `dropChoice()` (called by
    search / jump / port walk / contacts) lapses an unanswered decision — mostly a
    load-state safety valve now that the modal blocks other actions. **Randomized
    stakes (pay, duty, target lot) are rolled at offer time into `data`** so the
    player can't dodge them by acting first.
  - **Deferred jobs** — `G.courier` / `G.smuggleJob` / `G.passenger` are set by choices
    and settled by `resolveArrivalJobs()` after each jump (pay → `otherIncome`, busts →
    `fines`).
  - Cargo/market flags: `quality` (+1 on the sale roll, shown as a tag, carried from
    market offer into the hold) and `hot` (hidden; stolen goods — 2-in-6 chance of a
    25% fine when sold).
- **State** — global `G`; persisted to `localStorage` key `starTraderSave_v1`. `load()`
  backfills `books`/`crew` on older saves so they don't crash.
- **UI** — top bar + 3 columns (subsector / market+hold / bridge+ledger) + modals
  (`showShip`, `showCrew`, `showFinancials`, `showHelp`, `confirmNewGame`).

## Invariants you must preserve

1. **Books reconciliation:** at all times
   `sum(values of G.books) === netWorth() - G.startCredits`.
   Every cash flow that isn't a pure cash↔inventory swap MUST call `book(cat, amt)`
   (income positive, expense negative). Buying cargo is a swap (cash → inventory) and is
   NOT booked; selling books `sales` (+revenue) and `cogs` (−cost basis). The monthly
   bill books `mortgage`, `salaries` and `overhead` (maintenance + life support); cargo
   lost to events books `spoilage`. If you add any new credit change, book it, or
   reconciliation breaks. The test harness checks this after every action.
2. **Price table monotonic** — as the 2D6 result rises, buy multiplier falls and sale
   multiplier rises (Cepheus: result 8 = par 100%/100%; 16+ = 20% buy / 400% sell).
3. **Naming/format** — `cr()` for money, `ehex()` for UWP digits, monospace
   "spreadsheet" aesthetic, dark theme via the CSS `:root` vars. Match it.

## Testing (do this for any logic change)

There is no test file; tests are run ad-hoc in Node against the concatenated
sources (same order as the `<script>` tags in `index.html`):

```bash
cat js/data.js js/world.js js/ship.js js/game.js js/events.js js/npc.js js/ui.js js/main.js > /tmp/st.js
node --check /tmp/st.js              # syntax
```

Then a harness that **mocks `document`/`localStorage`/`window` and evals the source +
test in ONE scope** (top-level `const`s like `here`, `SHIPS` do NOT leak out of a
separate `eval`, so append your test string to the source and eval together):

```js
const els={}; function mk(){return {innerHTML:'',textContent:'',className:'',style:{},value:'99'};}
global.document={getElementById:id=>els[id]||(els[id]=mk())};
global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=v},removeItem(k){delete this._d[k]}};
global.window={};
const src=require('fs').readFileSync('/tmp/st.js','utf8');
eval(src + `/* your asserts here, calling newGame(), buyGood(), doJump(), sellHold()... */`);
```

What's worth asserting: UWP digits in range, price-table monotonicity, all d66 tables
complete, full play loops with no NaN, edge cases (jump-range guard, over-buy,
zero-credit, save/load round-trip, monthly billing), and **books reconciliation after
every action**. The Cepheus-conversion harness ran ~94,000 such checks (60 games ×
25 turns × 4 ships) at 0 failures — keep that bar.

## Previewing in-browser

`.claude/launch.json` runs a tiny **Node** static server (`.claude/static-server.js`)
on port 8731, serving the project root. Use `preview_start` then `preview_eval` /
`preview_screenshot`. Note: **`python3 -m http.server` fails under the sandbox**
(`PermissionError` on `os.getcwd()` at argparse import) — that's why it's Node.

## Balance notes

- The economy is **generous** by design-of-Traveller: Cepheus price swings run from
  0.2× to 4× base (sale up to 4×), so a sharp trader profits most runs. The **mortgage**
  (Free Trader ≈ Cr154k/mo) dominates the ~Cr176k/mo Free-Trader burden (mortgage +
  Cr15k salaries + Cr3k maint + Cr4k life support), billed every 4 weeks — the main
  source of tension. Life support scales with crew size (Cr2,000 per 2 crew).
- Starting capital is Cr250,000 ≈ one month of runway before the first bill.
- If asked to make it harder: enable bigger price-swing dampening, raise upkeep, or
  start the player in debt with a payoff goal. The `easy` hauler exists for the opposite.

## Possible next steps (raised but not built)

- **Hire / fire crew** (agreed next task): at a starport, generate a candidate via
  `genCrew` machinery, salary fixed by Cepheus position; firing must stop the salary and
  repair any dangling `c.rel.target` pointers. Cepheus has no dice procedure for this —
  it's an original layer on the OGC salary numbers. Cepheus also offers a salary-vs-
  profit-share option (`off-world-travel.md`) worth surfacing in the hire flow.
- Crew are now **partly mechanical** (skills resolve events via `skillCheck`). Still
  unbuilt: captain's Broker feeding the trade roll itself, and relationships triggering
  crew-conflict events.
- **Contracts / passengers** for non-speculative income.
- Difficulty / starting-capital selector on New Game.

## Conventions recap

- Plain HTML/CSS/JS only; never add a build system. Respect the script load order.
- Book every new cash flow; re-run the Node reconciliation check.
- There is exactly one copy of the app (`index.html` + `css/` + `js/`) — do not
  create preview duplicates (this project had a two-copies drift problem once).
- Never commit PDFs (the gitignore enforces it); push to `main` deploys to Pages.
