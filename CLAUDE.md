# CLAUDE.md — Project Rules for TX-Dom-Dev
# Texas 42 Dominoes — Claude Code Dev Build
# Owner: go4jc247 | Repo: https://github.com/go4jc247/TX-Dom-Dev

---

## ⚠️ THESE RULES ARE MANDATORY. NO EXCEPTIONS. EVER. ⚠️

This file is automatically loaded by Claude Code at the start of every session.
These are not suggestions. They are hard rules for this project.

---

## SCOPE — Where Claude Is Allowed to Work

- ✅ Working directory: `/Users/jp/TX-Dom-Dev/` ONLY
- ✅ GitHub: `go4jc247/TX-Dom-Dev` repository ONLY
- ❌ NEVER access, read, modify, or touch any files outside of `/Users/jp/TX-Dom-Dev/`
- ❌ NEVER touch any other GitHub repository, organization, settings, tokens, or account data outside of TX-Dom-Dev
- ❌ NEVER access iCloud files directly — originals in iCloud are reference only, never modify them

---

## RULES

### Rule 1 — Never Delete Files Without Confirmation
- NEVER delete any file without explicitly asking the user first and receiving a clear "yes delete it" response
- This includes temporary files, old versions, and anything that looks unused

### Rule 2 — Always Increment the Version Number
- EVERY delivered file must have an incremented version number — no exceptions
- Minor fix/tweak → bump patch: v13.0.1, v13.0.2, etc.
- Significant change → bump minor: v13.1.0, v13.2.0, etc.
- Major upgrade → bump major: v14.0.0, v15.0.0, etc.
- Update ALL THREE locations every version change:
  1. `MP_VERSION` constant in index.html
  2. `CACHE_NAME` in sw.js
  3. The `id="aboutVersion"` default text in index.html (backup, since it's dynamic)

### Rule 3 — Never Overwrite Original iCloud Files
- Our ONLY working directory is `/Users/jp/TX-Dom-Dev/`
- The iCloud folder `/Users/jp/Library/Mobile Documents/com~apple~CloudDocs/Texas dominoes /` is READ-ONLY reference
- NEVER write, move, rename, or delete anything in iCloud

### Rule 4 — No Major Feature Removal Without Explicit Approval
- NEVER remove a feature, function, or significant block of code without the user saying clearly "yes delete it" or "remove it"
- Dead code cleanup requires item-by-item confirmation unless user gives blanket approval for a specific list

### Rule 5 — Always Commit to Main Before gh-pages
- Workflow is always: make changes → commit to `main` → then merge to `gh-pages`
- NEVER commit directly to `gh-pages`
- NEVER skip `main`

### Rule 6 — Warn Before Anything That Could Break the Game
- If a change has any risk of breaking gameplay, UI, multiplayer, or audio — STOP and warn the user before proceeding
- Describe the risk clearly and wait for confirmation

### Rule 7 — Never Touch Anything Outside the TX-Dom-Dev Repository
- GitHub access is limited to: `go4jc247/TX-Dom-Dev` only
- NEVER access other repos, GitHub settings, billing, tokens, SSH keys, or any other account data
- NEVER create new repositories without explicit instruction

### Rule 8 — Never Access Files Outside the Project Directory
- File system access is limited to `/Users/jp/TX-Dom-Dev/` only
- Do not read, list, or interact with any other directory on the machine
- If a file is needed from elsewhere, ask the user to provide it

### Rule 9 — Never Restructure the Project Without Approval
- NEVER move, rename, or reorganize files or folders without asking first
- File renames or folder structure changes can break GitHub Pages paths and service worker caching

### Rule 10 — Always Summarize Changes at Delivery
- At the end of every version delivery, provide a brief changelog:
  - What version was delivered
  - What changed (bullet points)
  - What was NOT changed (so user knows scope)

---

## PROJECT CONTEXT

- **Game:** Texas 42 / TN51 Dominoes — HTML5 web game (multi-file, modular)
- **Base file:** Started from `Texas Dominoes V12.10.27c 2.html` (clean, no Easter egg)
- **Current version:** v13.5.1 (MP_VERSION in multiplayer.js, CACHE_NAME in sw.js)
- **Live URL:** https://go4jc247.github.io/TX-Dom-Dev/
- **PWA:** Installable as standalone app (manifest.json + sw.js)
- **Dev branch:** main
- **Live branch:** gh-pages (merge from main, never commit directly)
- **Relay server:** wss://tn51-tx42-relay.onrender.com
- **User uses voice-to-text** — expect typos, decipher intent, ask if unclear
- **Version display** is dynamic — `MP_VERSION` drives About panel AND splash screen automatically

---

## VERSIONING LOCATIONS (update all 3 every release)
1. `const MP_VERSION = 'vX.X.X';` — in `assets/js/multiplayer.js` (line ~13)
2. `const CACHE_NAME = 'tx-dom-vX.X.X';` — in `sw.js` (line 7)
3. `<div ... id="aboutVersion">vX.X.X</div>` — in `index.html` (~line 1981)

---

## MODEL PREFERENCE

- **Default model: Sonnet** — use for all standard tasks
- **Recommend switching to Opus** when the task involves:
  - Complex multiplayer sync logic or race condition debugging
  - Fixing or building out the Monte Carlo simulation
  - Major architectural decisions (restructuring JS, separating files)
  - Subtle game logic bugs that require deep reasoning
  - Any task where Sonnet has already tried and failed
- When recommending Opus, say clearly: **"⚠️ This task may need Opus — consider switching with /model"**

---

## WORKFLOW PREFERENCE

- **Bug fixes: Just do it.** Don't ask permission for fixes — fix it, commit, and report what changed. If it breaks, we roll back.
- **Always commit before and after changes** so every version is recoverable via git history.
- **Keep the user focused.** User has ADHD — reel them back to the current task when they drift. State clearly what the next step is.
- **Answer questions, then act.** If the user asks a question, answer it first. If they give an action, do the action. Don't conflate the two.

---

## TOKEN-EFFICIENCY RULES

### Every session:
1. **Read CLAUDE.md first** — don't re-discover what's already documented
2. **Search, don't load** — use Grep/Glob to find specific lines; only Read the ranges you need. Never read a 12,000-line file to find one function.
3. **Delegate exploration to subagents** — use Explore agents for broad searches, keep the main context lean
4. **Plan before executing** — use plan mode for multi-step work so there are fewer fix-it cycles
5. **Small commits, small tasks** — one focused chunk per conversation when possible
6. **Update CLAUDE.md at session end** — if project state changed (version, file structure, new conventions), update this file so the next session starts clean

### Optional (suggest when relevant):
- If a task only touches one file, mention that Sonnet can handle it to save tokens
- If exploring an unfamiliar area, suggest launching an Explore agent instead of reading everything inline

---

## FILE ARCHITECTURE (after module split)

### Script loading order in index.html:
```
<script src="./assets/js/sfx.js" defer></script>         ← SFX needed at init
<script src="./assets/js/game.js" defer></script>         ← core game engine
<script src="./assets/js/multiplayer.js" defer></script>  ← MP protocol/WebSocket
<script src="./assets/js/ai-engine.js" defer></script>    ← AI bidding + play
<script src="./assets/js/mp-social.js" defer></script>    ← chat, rematch, no-table-talk
<script src="./assets/js/orientation.js" defer></script>  ← orientation IIFE, style panels
<script src="./assets/js/popup-config.js" defer></script> ← popup position config IIFE
```

### Lazy-loaded (on demand via `_lazyLoad()`):
- `dev-tools.js` — dev mode toggle, custom hands, game logging, device presets
- `monte-carlo.js` — Monte Carlo simulation modal
- `observer.js` — observer/spectator mode
- `replay.js` — save/load/replay system

### File sizes (as of v13.5.1):
| File | Lines | Description |
|------|-------|-------------|
| game.js | ~12,287 | Core engine, UI, scoring, game flow, settings handlers |
| multiplayer.js | ~5,064 | WebSocket, MP protocol, room mgmt, bidding sync, reconnection |
| orientation.js | ~2,407 | Orientation IIFE, domino style panel, shuffle settings, presets |
| dev-tools.js | ~2,085 | Dev mode features (lazy-loaded) |
| ai-engine.js | ~1,623 | AI bidding evaluation + tile play logic |
| observer.js | ~724 | Observer/spectator mode (lazy-loaded) |
| monte-carlo.js | ~648 | Monte Carlo simulation (lazy-loaded) |
| replay.js | ~586 | Save/load/replay system (lazy-loaded) |
| sfx.js | ~509 | Sound effects (Web Audio API) |
| mp-social.js | ~447 | Chat, rematch voting, no-table-talk |
| popup-config.js | ~320 | Popup positioning config IIFE |
| **Total** | **~26,700** | |

### Cross-file variable rules:
- MP globals (`MULTIPLAYER_MODE`, `mpSeat`, `mpIsHost`, `mpPlayers`, `mpSocket`, etc.) are **declared in game.js** so they exist before multiplayer.js loads
- `_staleRefreshCount` declared in game.js, used by both game.js and multiplayer.js
- `getLocalSeat()` lives in game.js (serves all modes)
- `SFX` object lives in sfx.js, must load before game.js
- Lazy-loaded files override stub functions defined in game.js when they load

### Lazy Load Pattern:
```javascript
function _lazyLoad(src, cb) {
  if (document.querySelector('script[src="' + src + '"]')) { if(cb) cb(); return; }
  var s = document.createElement('script');
  s.src = src; s.onload = cb;
  document.head.appendChild(s);
}
```

---

## BACKLOG (future tasks, not urgent)

### Audio Quality Upgrade
- Current audio files in `assets/audio/` are heavily compressed (were embedded as base64)
- User has original high-quality source files
- When ready: replace compressed files with originals, no HTML changes needed
- Status: **On hold**

### Further Module Extraction
- game.js is still ~12,287 lines — potential further splits:
  - Scoring/moon-mode logic
  - UI/animation code
  - Pass & Play mode
- Would require careful dependency analysis
- Status: **On hold — evaluate when needed**

---

## PENDING WORK

- **Multiplayer extraction not yet committed** — extracted ~5,070 lines to multiplayer.js, tested clean home screen load, need full gameplay test before commit
- **Full UI regression test needed** — click through all settings, game modes, bidding, gameplay after the module split
