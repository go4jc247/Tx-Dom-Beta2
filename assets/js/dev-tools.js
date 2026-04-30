// ============================================================
// TX-Dom-Dev — dev-tools.js
// Lazy-loaded module extracted from game.js v13.4.0
// ============================================================

// ── Custom Hand Replay ──
function showCustomHandDialog(){
  closeReplayDialog();
  let overlay = document.getElementById('customHandOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'customHandOverlay';
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:210;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);';
    document.body.appendChild(overlay);
  }

  const sampleTN51 = 'P1 (T1): 7-4, 7-2, 7-0, 6-1, 3-0, 1-0\n'
    + 'P2 (T2): 5-0, 6-2, 1-1, 2-2, 6-5, 5-3\n'
    + 'P3 (T1): 5-5, 7-7, 7-3, 0-0, 3-3, 6-6\n'
    + 'P4 (T2): 7-6, 5-4, 4-4, 6-3, 3-2, 7-5\n'
    + 'P5 (T1): 5-1, 4-0, 4-3, 4-1, 2-1, 2-0\n'
    + 'P6 (T2): 7-1, 5-2, 4-2, 6-0, 3-1, 6-4';

  let html = '<div style="background:rgba(0,20,0,0.97);border-radius:12px;padding:18px 22px;color:#fff;max-width:95%;max-height:90%;overflow-y:auto;min-width:300px;max-width:420px;">';
  html += '<div style="font-size:16px;font-weight:bold;margin-bottom:10px;">Custom Hand</div>';
  html += '<div style="font-size:11px;opacity:0.6;margin-bottom:8px;">Paste deal text below. Format: P1: tile, tile, ... (one line per player)</div>';

  // Textarea
  html += '<textarea id="customHandText" rows="8" style="width:100%;box-sizing:border-box;padding:8px;border-radius:6px;border:1px solid #555;background:#111;color:#0f0;font-family:monospace;font-size:12px;resize:vertical;" placeholder="' + sampleTN51.replace(/"/g,'&quot;') + '"></textarea>';

  // Game mode selector
  html += '<div style="display:flex;gap:12px;margin-top:10px;align-items:center;">';
  html += '<div style="font-size:12px;">Game:</div>';
  html += '<label style="font-size:12px;cursor:pointer;"><input type="radio" name="customGameMode" value="TN51" checked> TN51 (6P)</label>';
  html += '<label style="font-size:12px;cursor:pointer;"><input type="radio" name="customGameMode" value="T42"> T42 (4P)</label>';
  html += '<label style="font-size:12px;cursor:pointer;"><input type="radio" name="customGameMode" value="MOON"> Moon (3P)</label>';
  html += '</div>';

  // First bidder selector
  html += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center;">';
  html += '<div style="font-size:12px;">First Bidder:</div>';
  html += '<select id="customFirstBidder" style="padding:4px 8px;border-radius:6px;border:1px solid #555;background:#1a1a2e;color:#fff;font-size:12px;">';
  for(let i = 1; i <= 6; i++){
    html += '<option value="' + i + '">P' + i + '</option>';
  }
  html += '</select>';
  html += '</div>';

  // Buttons
  html += '<div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">';
  html += '<button onclick="pasteCustomSample()" style="padding:6px 12px;border-radius:6px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:12px;">Sample</button>';
  html += '<button onclick="closeCustomHandDialog()" style="padding:6px 12px;border-radius:6px;border:none;background:#555;color:#fff;cursor:pointer;font-size:12px;">Cancel</button>';
  html += '<button onclick="startCustomHand()" style="padding:6px 14px;border-radius:6px;border:none;background:#22c55e;color:#fff;cursor:pointer;font-size:13px;font-weight:bold;">Start</button>';
  html += '</div>';

  html += '</div>';
  overlay.innerHTML = html;
  overlay.style.display = 'flex';

  // Update first bidder options when game mode changes
  const radios = overlay.querySelectorAll('input[name="customGameMode"]');
  radios.forEach(r => r.addEventListener('change', updateCustomBidderOptions));
}

function updateCustomBidderOptions(){
  const mode = document.querySelector('input[name="customGameMode"]:checked').value;
  const sel = document.getElementById('customFirstBidder');
  const maxP = mode === 'MOON' ? 3 : (mode === 'T42' ? 4 : 6);
  sel.innerHTML = '';
  for(let i = 1; i <= maxP; i++){
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = 'P' + i;
    sel.appendChild(opt);
  }
}

function pasteCustomSample(){
  const mode = document.querySelector('input[name="customGameMode"]:checked').value;
  const ta = document.getElementById('customHandText');
  if(mode === 'MOON'){
    ta.value = 'P1: 6-4, 5-3, 2-1, 0-0, 4-2, 6-0, 3-1\n'
      + 'P2: 6-5, 5-4, 3-3, 2-2, 1-1, 5-2, 4-1\n'
      + 'P3: 6-6, 5-5, 4-4, 6-3, 5-1, 4-0, 3-2\n'
      + 'Widow: 6-2';
  } else if(mode === 'T42'){
    ta.value = 'P1 (T1): 6-4, 5-3, 2-1, 0-0, 4-2, 6-0, 3-1\n'
      + 'P2 (T2): 6-5, 5-4, 3-3, 2-2, 1-1, 5-2, 4-1\n'
      + 'P3 (T1): 6-6, 5-5, 4-4, 6-3, 5-1, 4-0, 3-2\n'
      + 'P4 (T2): 6-2, 6-1, 5-0, 4-3, 3-0, 2-0, 1-0';
  } else {
    ta.value = 'P1 (T1): 7-4, 7-2, 7-0, 6-1, 3-0, 1-0\n'
      + 'P2 (T2): 5-0, 6-2, 1-1, 2-2, 6-5, 5-3\n'
      + 'P3 (T1): 5-5, 7-7, 7-3, 0-0, 3-3, 6-6\n'
      + 'P4 (T2): 7-6, 5-4, 4-4, 6-3, 3-2, 7-5\n'
      + 'P5 (T1): 5-1, 4-0, 4-3, 4-1, 2-1, 2-0\n'
      + 'P6 (T2): 7-1, 5-2, 4-2, 6-0, 3-1, 6-4';
  }
}

function closeCustomHandDialog(){
  const el = document.getElementById('customHandOverlay');
  if(el) el.style.display = 'none';
}

function parseCustomHandText(text){
  // Parse formats:
  //   P1 (T1): 7-4, 7-2, 7-0, 6-1, 3-0, 1-0
  //   P1: 7-4, 7-2, 7-0, 6-1, 3-0, 1-0
  //   Seat 0: 7-4, 7-2, ...
  //   Just lines of tiles: 7-4, 7-2, ...
  const lines = text.trim().split('\n').filter(l => l.trim());
  const hands = [];

  for(const line of lines){
    // Skip header lines like "Hands:" or empty
    const trimmed = line.trim();
    if(!trimmed) continue;

    // Extract tiles — look for digit-digit patterns
    const tileMatches = trimmed.match(/\d+\s*-\s*\d+/g);
    if(!tileMatches || tileMatches.length === 0) continue;

    const tiles = tileMatches.map(t => {
      const parts = t.split('-').map(p => parseInt(p.trim()));
      return [parts[0], parts[1]];
    });

    // Try to extract player number for ordering
    const pMatch = trimmed.match(/P(\d+)/i);
    const sMatch = trimmed.match(/Seat\s*(\d+)/i);
    let idx = hands.length;  // Default: sequential
    if(pMatch) idx = parseInt(pMatch[1]) - 1;
    else if(sMatch) idx = parseInt(sMatch[1]);

    // Ensure array is big enough
    while(hands.length <= idx) hands.push(null);
    hands[idx] = tiles;
  }

  // Remove any null gaps
  return hands.filter(h => h !== null);
}

function startCustomHand(){
  const text = document.getElementById('customHandText').value;
  const mode = document.querySelector('input[name="customGameMode"]:checked').value;
  const firstBidderPlayer = parseInt(document.getElementById('customFirstBidder').value);
  const firstBidderSeat = firstBidderPlayer - 1;

  if(!text.trim()){
    alert('Please paste hand data first.');
    return;
  }

  const hands = parseCustomHandText(text);

  // V12.10.7: Moon mode — 3 players x 7 tiles + optional widow (P4/Widow line with 1 tile)
  var customWidow = null;
  if(mode === 'MOON'){
    // Check if there's a 4th entry with 1 tile (the widow)
    if(hands.length === 4 && hands[3].length === 1){
      customWidow = hands[3][0];
      hands.length = 3; // Remove widow from hands array
    } else if(hands.length === 3){
      // No widow provided — that's OK, game will proceed without one
      customWidow = null;
    }
  }

  const expectedPlayers = mode === 'MOON' ? 3 : (mode === 'T42' ? 4 : 6);
  const expectedTiles = (mode === 'T42' || mode === 'MOON') ? 7 : 6;

  if(hands.length !== expectedPlayers){
    alert('Expected ' + expectedPlayers + ' players for ' + mode + ' but found ' + hands.length + ' hands.\nCheck your input format.');
    return;
  }

  // Validate tile counts
  for(let i = 0; i < hands.length; i++){
    if(hands[i].length !== expectedTiles){
      alert('P' + (i+1) + ' has ' + hands[i].length + ' tiles, expected ' + expectedTiles + '.\nCheck your input format.');
      return;
    }
  }

  // Validate no duplicate tiles
  const seen = new Set();
  for(let i = 0; i < hands.length; i++){
    for(const t of hands[i]){
      const key = Math.min(t[0],t[1]) + '-' + Math.max(t[0],t[1]);
      if(seen.has(key)){
        alert('Duplicate tile found: ' + t[0] + '-' + t[1] + ' in P' + (i+1) + '.');
        return;
      }
      seen.add(key);
    }
  }
  // Also check widow for duplicates
  if(customWidow){
    const wKey = Math.min(customWidow[0],customWidow[1]) + '-' + Math.max(customWidow[0],customWidow[1]);
    if(seen.has(wKey)){
      alert('Duplicate tile found: widow ' + customWidow[0] + '-' + customWidow[1] + ' is already in a hand.');
      return;
    }
  }

  closeCustomHandDialog();

  // Switch game mode if needed
  if(GAME_MODE !== mode){
    initGameMode(mode);
  }

  // Set dealer such that firstBidder = (dealer - 1 + pc) % pc
  // So dealer = (firstBidderSeat + 1) % pc
  const pc = session.game.player_count;
  const dealerForBidder = (firstBidderSeat + 1) % pc;

  // Reset game state (same pattern as replayHand)
  shadowLayer.innerHTML = '';
  spriteLayer.innerHTML = '';
  sprites.length = 0;
  currentTrick = 0;
  playedThisTrick = [];
  team1TricksWon = 0;
  team2TricksWon = 0;
  moonPlayerTricksWon = [0, 0, 0];
  zIndexCounter = 100;
  isAnimating = false;
  waitingForPlayer1 = false;

  // Hide boneyard2, summaries
  if(boneyard2Visible){
    boneyard2Visible = false;
    const by2c = document.getElementById('boneyard2Container');
    const thBg = document.getElementById('trickHistoryBg');
    const toggleBtn = document.getElementById('boneyard2Toggle');
    if(by2c) by2c.style.display = 'none';
    if(thBg) thBg.style.display = '';
    if(toggleBtn) toggleBtn.classList.remove('active');
  }
  hideGameEndSummary();
  hideRoundEndSummary();

  const bonesToggle = document.getElementById('boneyard2Toggle');
  if(bonesToggle){
    bonesToggle.style.pointerEvents = 'auto';
    bonesToggle.style.opacity = '';
  }
  document.getElementById('trumpDisplay').classList.remove('visible');

  // Set up session
  session.contract = "NORMAL";
  session.current_bid = 0;
  session.bid_marks = 1;
  session.dealer = dealerForBidder;
  session.game.set_hands(hands, 0);
  // V12.10.6: Set _dealtHands so custom hand can be saved for replay
  session._dealtHands = hands.map(function(h){ return h.map(function(t){ return [t[0], t[1]]; }); });
  session._dealtDealer = session.dealer;

  // V12.10.7: Set Moon widow for custom hand
  if(mode === 'MOON' && customWidow){
    session.moon_widow = customWidow;
    session._widowRevealed = false;
    session._dealtWidow = [customWidow[0], customWidow[1]];
    session._dealSnapshot = {
      hands: hands.map(function(h){ return h.map(function(t){ return [t[0], t[1]]; }); }),
      moon_widow: [customWidow[0], customWidow[1]]
    };
  } else if(mode === 'MOON'){
    session.moon_widow = null;
    session._dealtWidow = null;
  } else {
    session._dealtWidow = null;
  }

  session.game.set_trump_suit(null);
  session.game.set_active_players(Array.from({length: pc}, (_, i) => i));
  session.phase = PHASE_NEED_BID;
  session.status = "Starting bidding round... (Custom hand)";

  createPlaceholders();

  // Render sprites
  for(let p = 0; p < pc; p++){
    sprites[p] = [];
    const playerNum = seatToPlayer(p);
    for(let h = 0; h < session.game.hand_size; h++){
      const tile = hands[p] && hands[p][h];
      if(!tile) continue;
      const sprite = makeSprite(tile);
      const pos = getHandPosition(playerNum, h);
      if(pos){
        sprite.setPose(pos);
        if(sprite._shadow) shadowLayer.appendChild(sprite._shadow);
        spriteLayer.appendChild(sprite);
      }
      const data = { sprite, tile, originalSlot: h };
      sprites[p][h] = data;
      if(p === 0){
        sprite.addEventListener('click', () => handlePlayer1Click(sprite));
        sprite.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePlayer1Click(sprite);
        }, { passive: false });
      }
    }
  }

  team1Score = session.game.team_points[0];
  team2Score = session.game.team_points[1];
  updateScoreDisplay();

  initBiddingRound();
  startBiddingRound();
}

document.getElementById('notesCloseBtn').addEventListener('click', () => {
  saveNotes(document.getElementById('notesTextarea').value);
  document.getElementById('notesBackdrop').style.display = 'none';
});

document.getElementById('notesCopyBtn').addEventListener('click', () => {
  const text = document.getElementById('notesTextarea').value;
  navigator.clipboard.writeText(text).then(() => {
    document.getElementById('notesCopyBtn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('notesCopyBtn').textContent = 'Copy to Clipboard';
    }, 1500);
  }).catch(e => {
    console.error('Copy failed:', e);
  });
});

document.getElementById('notesClearBtn').addEventListener('click', () => {
  document.getElementById('notesTextarea').value = '';
  saveNotes('');
});

// Auto-save notes on change

// Game Settings menu toggle moved to game.js (core UI, not dev-only)

// Settings UI handlers (letterbox, aspect ratio, logs, volume, speed) moved to game.js



/******************************************************************************
 * GAME LOG FUNCTIONALITY (v2.0 - Detailed Format)
 ******************************************************************************/
// handNumber, trickNumber, currentTrickPlays declared in game.js stubs
handNumber = 0;
trickNumber = 0;
currentTrickPlays = [];

// Helper functions
function _tileStr(t){ return t ? `${t[0]}-${t[1]}` : null; }
function _tilesStr(arr){ return (arr||[]).map(t => _tileStr(t)); }
function _partnerSeats(seat){
  if(seat % 2 === 0) return [0,2,4].filter(s => s !== seat);
  return [1,3,5].filter(s => s !== seat);
}

function logHandStart(trumpMode, trumpSuit, contract, bid, bidderSeat, hands, dealerSeat, leaderSeat, scoresBeforeHand){
  let trumpDisplay = "";
  if(contract === "NELLO"){
    trumpDisplay = "Nel-O";
  } else if(trumpMode === "DOUBLES"){
    trumpDisplay = "Doubles";
  } else if(trumpMode === "NONE" || trumpSuit === null){
    trumpDisplay = "No Trumps (NT)";
  } else if(trumpMode === "PIP"){
    trumpDisplay = `${trumpSuit}s`;
  }

  const entry = {
    type: "HAND_START",
    handId: handNumber,
    dealerSeat: dealerSeat,
    leaderSeat: leaderSeat,
    contract: {
      mode: contract,
      trumpMode: trumpMode,
      trumpSuit: trumpSuit,
      trumpDisplay: trumpDisplay,
      bid: bid,
      bidderSeat: bidderSeat,
      bidderTeam: bidderSeat !== null ? (bidderSeat % 2 === 0 ? 1 : 2) : null
    },
    scoresBeforeHand: scoresBeforeHand || { team1: 0, team2: 0 },
    hands: hands ? hands.map((h, seat) => ({
      seat: seat,
      team: seat % 2 === 0 ? 1 : 2,
      tiles: _tilesStr(h)
    })) : null,
    timestamp: new Date().toISOString()
  };

  // V12.10.4: Attach pre-swap Moon state for replay
  if(session && session._dealSnapshot){
    entry.moon_widow = session._dealSnapshot.moon_widow;
    entry.preSwapHands = session._dealSnapshot.hands.map((h, seat) => ({
      seat: seat,
      team: seat % 2 === 0 ? 1 : 2,
      tiles: _tilesStr(h)
    }));
    session._dealSnapshot = null; // consumed
  }

  trickNumber = 0;
  currentTrickPlays = [];
  gameLog.push(entry);
  saveGameLog();
}

function logTrickStart(leaderSeat, ledPip){
  const entry = {
    type: "TRICK_START",
    handId: handNumber,
    trickId: trickNumber,
    leaderSeat: leaderSeat,
    leaderTeam: leaderSeat % 2 === 0 ? 1 : 2,
    ledPip: ledPip,
    timestamp: new Date().toISOString()
  };
  currentTrickPlays = [];
  gameLog.push(entry);
  saveGameLog();
}

function logPlay(player, tile, reason, isAISeat, aiRec, playContext){
  const ctx = playContext || {};
  const aiTile = aiRec ? aiRec.tile : null;
  const wasOverride = !isAISeat && aiTile && (!tile || tile[0] !== aiTile[0] || tile[1] !== aiTile[1]);

  const entry = {
    type: "PLAY",
    handId: handNumber,
    trickId: trickNumber,
    seat: player,
    tilePlayed: _tileStr(tile),
    isAISeat: isAISeat,
    wasOverride: wasOverride,
    aiSuggestedTile: aiTile ? _tileStr(aiTile) : null,
    aiReason: aiRec ? aiRec.reason : (reason || null),
    aiDebug: aiRec && aiRec.debugInfo ? aiRec.debugInfo : null,
    legalMoves: ctx.legalTiles ? _tilesStr(ctx.legalTiles) : null,
    partnerCurrentlyWinning: ctx.currentWinner ? (_partnerSeats(player).includes(ctx.currentWinner.seat)) : false,
    positionInTrick: currentTrickPlays.length,
    timestamp: new Date().toISOString()
  };

  currentTrickPlays.push(entry);
  gameLog.push(entry);
  saveGameLog();
}

function logTrickEnd(winnerSeat, points){
  const playsString = currentTrickPlays.map(p => `P${seatToPlayer(p.seat)}:${p.tilePlayed}`).join(' → ');

  // Capture end-of-trick state summary by running AI analysis from seat 0's perspective
  // This gives us the void tracking, trump control, and bid safety state AFTER this trick
  let trickEndState = null;
  try {
    // Run AI from seat 0 just to get the debug info (won't actually play)
    // IMPORTANT: Temporarily clear current_trick so AI evaluates as if leading
    // the NEXT trick (current_trick still has the just-completed trick's plays
    // at this point because collectToHistory hasn't finished yet)
    const savedTrick = session.game.current_trick;
    session.game.current_trick = [];
    const debugRec = choose_tile_ai(session.game, 0, session.contract, true, session.current_bid);
    session.game.current_trick = savedTrick;
    if(debugRec && debugRec.debugInfo){
      const d = debugRec.debugInfo;
      trickEndState = {
        teamScores: [session.game.team_points[0], session.game.team_points[1]],
        voidTracking: d.voidTracking || {},
        trumpControl: d.weHaveTrumpControl || false,
        opponentsVoidInTrump: d.opponentsVoidInTrump || false,
        partnersHaveTrump: d.partnersHaveTrump,
        trumpsRemaining: d.trumpsRemaining || [],
        bidSafety: d.bidSafety || null,
        trumpsInHand: d.trumpsInHand || []
      };
    }
  } catch(e) {
    // If AI fails (e.g., hand is over), just skip
  }

  const entry = {
    type: "TRICK_END",
    handId: handNumber,
    trickId: trickNumber,
    winnerSeat: winnerSeat,
    winnerTeam: winnerSeat % 2 === 0 ? 1 : 2,
    pointsInTrick: points,
    playsString: playsString,
    trickEndState: trickEndState,
    timestamp: new Date().toISOString()
  };

  gameLog.push(entry);
  trickNumber++;
  currentTrickPlays = [];
  saveGameLog();
}

function logHandEnd(winner, bidMade){
  const entry = {
    type: "HAND_END",
    handId: handNumber,
    finalScores: {
      team1: session.game.team_points[0],
      team2: session.game.team_points[1]
    },
    winner: winner,
    bidMade: bidMade,
    timestamp: new Date().toISOString()
  };

  gameLog.push(entry);
  handNumber++;
  trickNumber = 0;
  saveGameLog();
}

// Legacy function for backwards compatibility
function logEvent(type, data){
  if(type === 'HAND_END'){
    const status = data.status || '';
    const bidMade = status.includes('made') || status.includes('success');
    logHandEnd(status, bidMade);
  }
  // Other types handled by specific functions
}

function saveGameLog(){
  try {
    // Keep log manageable
    if(gameLog.length > 500) gameLog = gameLog.slice(-500);
    localStorage.setItem(GAME_LOG_KEY, JSON.stringify({
      log: gameLog,
      handNumber: handNumber,
      trickNumber: trickNumber
    }));
  } catch(e) {}
}

function loadGameLog(){
  try {
    const saved = localStorage.getItem(GAME_LOG_KEY);
    if(saved){
      const data = JSON.parse(saved);
      if(Array.isArray(data)){
        // Old format
        gameLog = data;
      } else {
        // New format with metadata
        gameLog = data.log || [];
        handNumber = data.handNumber || 0;
        trickNumber = data.trickNumber || 0;
      }
    }
  } catch(e) {
    gameLog = [];
  }
}

function formatGameLog(){
  let text = "=== TENNESSEE 51 GAME LOG (v2.0) ===\n\n";

  for(const entry of gameLog){
    if(entry.type === "HAND_START"){
      text += `\n========== HAND ${entry.handId + 1} ==========\n`;
      const c = entry.contract || {};
      text += `  Dealer: P${seatToPlayer(entry.dealerSeat||0)} | Leader: P${seatToPlayer(entry.leaderSeat||0)}\n`;
      text += `  Contract: ${c.mode || "NORMAL"} | Trump: ${c.trumpDisplay || "?"} | Bid: ${c.bid || "?"}\n`;
      text += `  Bidder: P${seatToPlayer(c.bidderSeat||0)} (Team ${c.bidderTeam || "?"})\n`;
      const scores = entry.scoresBeforeHand || {};
      text += `  Scores Before: Team1=${scores.team1||0} Team2=${scores.team2||0}\n`;
      if(entry.hands){
        text += `  Starting Hands:\n`;
        for(const h of entry.hands){
          if(h.tiles && h.tiles.length > 0){
            text += `    P${seatToPlayer(h.seat)} (T${h.team}): ${h.tiles.join(", ")}\n`;
          }
        }
      }
    } else if(entry.type === "TRICK_START"){
      text += `\n  --- Trick ${entry.trickId + 1} ---\n`;
      text += `    Leader: P${seatToPlayer(entry.leaderSeat)} (Team ${entry.leaderTeam}) | Led pip: ${entry.ledPip !== null ? entry.ledPip : "?"}\n`;
    } else if(entry.type === "PLAY"){
      const actor = entry.isAISeat ? "[AI]" : "[Human]";
      text += `    P${seatToPlayer(entry.seat)} ${actor}: ${entry.tilePlayed}`;
      if(entry.aiReason) text += ` (${entry.aiReason})`;
      if(entry.wasOverride){
        text += ` [OVERRIDE! AI wanted: ${entry.aiSuggestedTile}]`;
      } else if(!entry.isAISeat && entry.aiSuggestedTile){
        text += ` [AI agreed]`;
      }
      if(entry.partnerCurrentlyWinning) text += ` [partner winning]`;
      text += "\n";
      if(entry.legalMoves && entry.legalMoves.length > 1){
        text += `      Legal: ${entry.legalMoves.join(", ")}\n`;
      }
    } else if(entry.type === "TRICK_END"){
      text += `    >> Winner: P${seatToPlayer(entry.winnerSeat)} (Team ${entry.winnerTeam}) +${entry.pointsInTrick} pts\n`;
      text += `    >> Plays: ${entry.playsString}\n`;
    } else if(entry.type === "HAND_END"){
      const scores = entry.finalScores || {};
      text += `\n  ====== HAND ${entry.handId + 1} RESULT ======\n`;
      text += `  Final: Team1=${scores.team1||0} Team2=${scores.team2||0}\n`;
      text += `  ${entry.winner || ""}\n`;
      text += `  Bid made: ${entry.bidMade ? "Yes" : "No"}\n`;
    }
  }

  return text || 'No log entries yet.';
}

function formatAdvancedLog(){
  let text = "=== TENNESSEE 51 — ADVANCED AI DEBUG LOG ===\n";
  text += "=== Generated: " + new Date().toISOString() + " ===\n\n";

  let _noTrump = false;  // Track if current hand has no trumps (Nello or No Trump)
  for(const entry of gameLog){
    if(entry.type === "HAND_START"){
      const c = entry.contract || {};
      _noTrump = (c.mode === "NELLO" || c.mode === "NONE" || c.mode === "NO_TRUMP");
      text += "\n" + "=".repeat(70) + "\n";
      text += " HAND " + (entry.handId + 1) + "\n";
      text += "=".repeat(70) + "\n";
      text += "Contract: " + (c.mode||"NORMAL") + " | Trump: " + (c.trumpDisplay||"?");
      text += " | Bid: " + (c.bid||"?") + " by P" + seatToPlayer(c.bidderSeat||0);
      text += " (Team " + (c.bidderTeam||"?") + ")\n";
      const scores = entry.scoresBeforeHand || {};
      text += "Scores Before: Team1=" + (scores.team1||0) + " Team2=" + (scores.team2||0) + "\n";
      if(entry.hands){
        text += "Hands:\n";
        for(const h of entry.hands){
          if(h.tiles && h.tiles.length > 0){
            text += "  P" + seatToPlayer(h.seat) + " (T" + h.team + "): " + h.tiles.join(", ") + "\n";
          }
        }
      }
    }
    else if(entry.type === "TRICK_START"){
      text += "\n--- Trick " + (entry.trickId + 1) + " ---\n";
      text += "  Leader: P" + seatToPlayer(entry.leaderSeat) + " (Team " + entry.leaderTeam + ")\n";
    }
    else if(entry.type === "PLAY"){
      const actor = entry.isAISeat ? "[AI]" : "[Human]";
      text += "\n  P" + seatToPlayer(entry.seat) + " " + actor + " plays: " + entry.tilePlayed;
      if(entry.aiReason) text += " — " + entry.aiReason;
      if(entry.wasOverride) text += " [OVERRIDE! AI wanted: " + entry.aiSuggestedTile + "]";
      text += "\n";
      if(entry.legalMoves && entry.legalMoves.length > 1){
        text += "    Legal moves: " + entry.legalMoves.join(", ") + "\n";
      }

      // === ADVANCED DEBUG ===
      const d = entry.aiDebug;
      if(d){
        text += "    ┌─── AI REASONING ───\n";
        text += "    │ Seat: " + d.seat + " | Team: " + d.myTeam + " | Trick: " + d.trickNum;
        text += " | " + (d.isLead ? "LEADING" : "FOLLOWING (led pip: " + d.ledPip + ")") + "\n";
        text += "    │ Hand: [" + (d.handTiles||[]).join(", ") + "]\n";
        text += "    │ Legal: [" + (d.legalTiles||[]).join(", ") + "]\n";
        text += "    │ Played tiles tracked: " + d.playedCount + "\n";

        // Trump info
        if(d.trumpMode && d.trumpMode !== "NONE"){
          text += "    │\n";
          text += "    │ TRUMP: mode=" + d.trumpMode + " suit=" + d.trumpSuit + "\n";
          text += "    │   In hand: [" + (d.trumpsInHand||[]).join(", ") + "]\n";
          text += "    │   Remaining (not in hand): [" + (d.trumpsRemaining||[]).join(", ") + "]\n";
          text += "    │   I have highest trump: " + d.iHaveHighestTrump;
          text += " (my rank: " + d.myHighestTrumpRank + " vs remaining: " + d.highestRemainingTrumpRank + ")\n";
        }

        // Suit analysis
        if(d.suitAnalysis){
          const sa = d.suitAnalysis;
          const pips = Object.keys(sa).sort((a,b) => Number(a)-Number(b));
          if(pips.length > 0){
            text += "    │\n";
            text += "    │ SUIT ANALYSIS:\n";
            for(const pip of pips){
              const s = sa[pip];
              text += "    │   Suit " + pip + ": " + s.tilesLeft + " tiles left";
              text += ", count exposure=" + s.countExposure;
              text += ", double " + (s.doubleOut ? "OUT" : "still in (" + s.doubleCount + "pts)") + "\n";
            }
          }
        }

        // Void tracking (suppress trump void info in Nello/No Trump)
        if(d.voidTracking && Object.keys(d.voidTracking).length > 0){
          text += "    │\n";
          text += "    │ VOID TRACKING:\n";
          for(const [seat, info] of Object.entries(d.voidTracking)){
            if(info.voidSuits && info.voidSuits.length === 0 && !info.trumpVoidConfirmed && !(info.trumpVoidLikely > 0)){
              text += "    │   " + seat + " (" + info.team + "): no voids detected\n";
            } else {
              text += "    │   " + seat + " (" + info.team + "): void in suits [" + info.voidSuits.join(",") + "]";
              if(!_noTrump){
                if(info.trumpVoidConfirmed) text += " | TRUMP VOID (confirmed)";
                else if(info.trumpVoidLikely > 0) text += " | trump void likely (" + Math.round(info.trumpVoidLikely*100) + "%)";
              }
              text += "\n";
            }
          }
        }

        // Trump control (skip entirely in Nello/No Trump)
        if(!_noTrump){
          text += "    │\n";
          text += "    │ TRUMP CONTROL: " + (d.weHaveTrumpControl ? "YES ✓" : "NO");
          text += " (opps void: " + d.opponentsVoidInTrump + ", partners have trump: " + d.partnersHaveTrump;
          if(d.partnersHoldRemainingTrumps) text += ", PARTNERS HOLD ALL REMAINING TRUMPS";
          text += ")\n";
        }

        // Bid safety
        if(d.bidSafety){
          const b = d.bidSafety;
          text += "    │ BID: " + b.currentBid + " | Our score: " + b.ourScore;
          text += " | Need: " + b.pointsNeeded + " | ";
          if(b.bidIsSafe) text += "SAFE";
          else if(b.bidIsClose) text += "CLOSE!";
          else text += "still working";
          text += " | Tricks left: " + b.tricksLeft + "\n";
        }

        // Last trump (skip in Nello/No Trump)
        if(d.lastTrump && !_noTrump){
          text += "    │ LAST TRUMP: " + (d.lastTrump.isLastTrump ? "YES, only 1 left" : "No");
          if(d.lastTrump.isLastTrump) text += " → " + (d.lastTrump.shouldSaveLastTrump ? "SAVING IT" : "will use if needed");
          text += "\n";
        }

        // Lead categories
        if(d.leadCategories){
          const lc = d.leadCategories;
          text += "    │\n";
          text += "    │ LEAD PHASE: " + lc.phase + "\n";
          if(lc.partnersHoldTrumps) text += "    │   ★ Partners hold all remaining trumps\n";
          if(lc.sacrificeLowTrumpEligible){
            text += "    │   ★ Low-trump sacrifice check (no doubles, 2+ trumps)";
            if(lc.sacrificeRankCheck){
              const rc = lc.sacrificeRankCheck;
              text += ": my lowest=" + rc.myLowestRank + " vs partner highest=" + rc.partnerHighestRank;
              text += rc.partnerCanBeat ? " → SACRIFICE OK" : " → SKIP (partner can't beat)";
            }
            text += "\n";
          }
          if(!_noTrump && lc.trumpDoubles.length) text += "    │   Trump doubles: [" + lc.trumpDoubles.join(", ") + "]\n";
          if(!_noTrump && lc.otherTrumps.length) text += "    │   Other trumps: [" + lc.otherTrumps.join(", ") + "]\n";
          if(lc.nonTrumpDoubles.length) text += "    │   Non-trump doubles: [" + lc.nonTrumpDoubles.join(", ") + "]\n";
          if(lc.nonTrumpSingles.length) text += "    │   Non-trump singles: [" + lc.nonTrumpSingles.join(", ") + "]\n";
        }

        // Lead candidates (danger scoring)
        if(d.leadCandidates && d.leadCandidates.length > 0){
          text += "    │\n";
          text += "    │ LEAD CANDIDATE SCORES (danger scoring):\n";
          const sorted = [...d.leadCandidates].sort((a,b) => b.totalScore - a.totalScore);
          for(const c of sorted){
            text += "    │   " + c.tile + " (suit " + c.suit + "): SCORE=" + c.totalScore;
            if(c.count) text += " [count=" + c.count + "pts]";
            text += "\n";
            const bk = c.breakdown;
            const parts = [];
            if(bk.doubleNotOut !== undefined) parts.push("dbl-not-out=" + bk.doubleNotOut);
            if(bk.doubleOut !== undefined) parts.push("dbl-out=+" + bk.doubleOut);
            if(bk.doubleCountPenalty) parts.push("dbl-count=" + bk.doubleCountPenalty);
            if(bk.myCountPenalty) parts.push("my-count=" + bk.myCountPenalty);
            if(bk.suitCountRisk) parts.push("suit-risk=" + bk.suitCountRisk);
            if(bk.suitCountBonus) parts.push("suit-bonus=+" + bk.suitCountBonus);
            if(bk.tilesLeftPenalty) parts.push("tiles-left=" + bk.tilesLeftPenalty);
            if(bk.oppVoidTrumpRisk) parts.push("opp-trump-risk=" + bk.oppVoidTrumpRisk);
            if(bk.oppVoidSafe) parts.push("opp-safe=+" + bk.oppVoidSafe);
            parts.push("pip=" + bk.pipPenalty);
            parts.push("sum=" + bk.sumPenalty);
            if(parts.length) text += "    │     → " + parts.join(", ") + "\n";
          }
        }

        // Follow suit debug
        if(d.followSuit){
          const fs = d.followSuit;
          text += "    │\n";
          text += "    │ FOLLOW SUIT: led pip=" + fs.ledPip;
          text += " | winner=P" + fs.currentWinnerSeat + " (rank " + fs.winnerRank + (fs.winnerIsTrump ? " TRUMP" : "") + ")\n";
          text += "    │   Can beat winner: " + fs.canBeat + "\n";
          for(const c of fs.candidates){
            text += "    │   " + c.tile + ": rank=" + c.rank + (c.isDouble ? " (DOUBLE)" : "") + "\n";
          }
        }

        // Trump-in debug (skip in Nello/No Trump)
        if(d.trumpIn && !_noTrump){
          const ti = d.trumpIn;
          text += "    │\n";
          text += "    │ TRUMP IN: highest in trick=" + ti.highestTrickTrump;
          text += " | opp trumped=" + ti.oppHasTrump + " | partner trumped=" + ti.partnerHasTrump + "\n";
          for(const c of ti.candidates){
            text += "    │   " + c.tile + ": rank=" + c.rank + (c.canWin ? " (WINS)" : " (loses)") + "\n";
          }
        }

        // Dump candidates
        if(d.dumpCandidates && d.dumpCandidates.length > 0){
          text += "    │\n";
          text += "    │ DUMP CANDIDATE SCORES:\n";
          const sorted = [...d.dumpCandidates].sort((a,b) => b.totalScore - a.totalScore);
          for(const c of sorted){
            text += "    │   " + c.tile + ": SCORE=" + c.totalScore;
            if(c.count) text += " [count=" + c.count + "pts]";
            text += "\n";
            const bk = c.breakdown;
            const parts = [];
            if(bk.voidBonus) parts.push("void=+" + bk.voidBonus);
            if(bk.suitCounts) parts.push("suits=" + bk.suitCounts);
            if(bk.countPenalty) parts.push("count=" + bk.countPenalty);
            parts.push("sum=" + bk.sumPenalty);
            if(bk.trumpPenalty) parts.push("trump=" + bk.trumpPenalty);
            if(bk.lastTrumpPenalty) parts.push("last-trump=" + bk.lastTrumpPenalty);
            if(parts.length) text += "    │     → " + parts.join(", ") + "\n";
          }
        }

        text += "    └─────────────────────\n";
      }
    }
    else if(entry.type === "TRICK_END"){
      text += "  >> Winner: P" + seatToPlayer(entry.winnerSeat) + " (Team " + entry.winnerTeam + ") +" + entry.pointsInTrick + " pts\n";
      text += "  >> " + entry.playsString + "\n";

      // End-of-trick state summary
      const ts = entry.trickEndState;
      if(ts){
        text += "  ┌─── END OF TRICK STATE ───\n";
        text += "  │ Scores: Team1=" + ts.teamScores[0] + " Team2=" + ts.teamScores[1] + "\n";

        if(ts.bidSafety){
          const b = ts.bidSafety;
          text += "  │ Bid: " + b.currentBid + " | Need: " + b.pointsNeeded + " | ";
          if(b.bidIsSafe) text += "SAFE";
          else if(b.bidIsClose) text += "CLOSE!";
          else text += "still working";
          text += " | Tricks left: " + b.tricksLeft + "\n";
        }

        if(!_noTrump){
          if(ts.trumpsInHand && ts.trumpsInHand.length > 0){
            text += "  │ P1 trumps: [" + ts.trumpsInHand.join(", ") + "]\n";
          }
          if(ts.trumpsRemaining && ts.trumpsRemaining.length > 0){
            text += "  │ Trumps still out: [" + ts.trumpsRemaining.join(", ") + "]\n";
          } else {
            text += "  │ Trumps still out: none (all accounted for)\n";
          }

          text += "  │ Trump control: " + (ts.trumpControl ? "YES" : "NO");
          text += " (opps void: " + ts.opponentsVoidInTrump;
          if(ts.partnersHaveTrump !== undefined) text += ", partners trump: " + ts.partnersHaveTrump;
          text += ")\n";
        }

        const vt = ts.voidTracking;
        if(vt && Object.keys(vt).length > 0){
          text += "  │ KNOWN VOIDS:\n";
          for(const [seat, info] of Object.entries(vt)){
            text += "  │   " + seat + " (" + info.team + "):";
            if(info.voidSuits && info.voidSuits.length > 0) text += " void in suits [" + info.voidSuits.join(",") + "]";
            if(!_noTrump){
              if(info.trumpVoidConfirmed) text += " | TRUMP VOID";
              else if(info.trumpVoidLikely > 0) text += " | trump void " + Math.round(info.trumpVoidLikely*100) + "%";
            }
            text += "\n";
          }
        } else {
          text += "  │ KNOWN VOIDS: none detected yet\n";
        }
        text += "  └────────────────────────\n";
      }
    }
    else if(entry.type === "HAND_END"){
      const scores = entry.finalScores || {};
      text += "\n  ====== HAND " + (entry.handId + 1) + " RESULT ======\n";
      text += "  Final: Team1=" + (scores.team1||0) + " Team2=" + (scores.team2||0) + "\n";
      text += "  " + (entry.winner || "") + "\n";
      text += "  Bid made: " + (entry.bidMade ? "Yes" : "No") + "\n";
    }
  }

  return text || 'No log entries yet.';
}

document.getElementById('menuGameLog').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  refreshGameLogContent();
  document.getElementById('gameLogBackdrop').style.display = 'flex';
});

document.getElementById('gameLogCloseBtn').addEventListener('click', () => {
  document.getElementById('gameLogBackdrop').style.display = 'none';
});

document.getElementById('gameLogCopyBtn').addEventListener('click', () => {
  const text = _gameLogTab === 'hand' ? formatGameLogCurrentHand() : formatGameLog();
  navigator.clipboard.writeText(text).then(() => {
    document.getElementById('gameLogCopyBtn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('gameLogCopyBtn').textContent = 'Copy Log to Clipboard';
    }, 1500);
  }).catch(e => {
    console.error('Copy failed:', e);
  });
});

document.getElementById('gameLogClearBtn').addEventListener('click', () => {
  if(confirm('Clear all game log entries? Hand numbering will restart from 1.')){
    gameLog = [];
    handNumber = 0;
    trickNumber = 0;
    saveGameLog();
    document.getElementById('gameLogContent').textContent = 'Log cleared. Hand numbering will start from 1.';
  }
});

// ─── Current-hand log helpers ───
// Extract only entries from the most recent hand
function getCurrentHandEntries(){
  // Find the last HAND_START
  let lastHandIdx = -1;
  for(let i = gameLog.length - 1; i >= 0; i--){
    if(gameLog[i].type === 'HAND_START'){ lastHandIdx = i; break; }
  }
  if(lastHandIdx === -1) return [];
  return gameLog.slice(lastHandIdx);
}

function formatGameLogCurrentHand(){
  const entries = getCurrentHandEntries();
  if(entries.length === 0) return 'No current hand data.';
  let text = "=== CURRENT HAND LOG ===\n\n";
  for(const entry of entries){
    if(entry.type === "HAND_START"){
      text += `========== HAND ${entry.handId + 1} ==========\n`;
      const c = entry.contract || {};
      text += `  Dealer: P${seatToPlayer(entry.dealerSeat||0)} | Leader: P${seatToPlayer(entry.leaderSeat||0)}\n`;
      text += `  Contract: ${c.mode || "NORMAL"} | Trump: ${c.trumpDisplay || "?"} | Bid: ${c.bid || "?"}\n`;
      text += `  Bidder: P${seatToPlayer(c.bidderSeat||0)} (Team ${c.bidderTeam || "?"})\n`;
      const scores = entry.scoresBeforeHand || {};
      text += `  Scores Before: Team1=${scores.team1||0} Team2=${scores.team2||0}\n`;
      if(entry.hands){
        text += `  Starting Hands:\n`;
        for(const h of entry.hands){
          if(h.tiles && h.tiles.length > 0){
            text += `    P${seatToPlayer(h.seat)} (T${h.team}): ${h.tiles.join(", ")}\n`;
          }
        }
      }
    } else if(entry.type === "TRICK_START"){
      text += `\n  --- Trick ${entry.trickId + 1} ---\n`;
      text += `    Leader: P${seatToPlayer(entry.leaderSeat)} (Team ${entry.leaderTeam}) | Led pip: ${entry.ledPip !== null ? entry.ledPip : "?"}\n`;
    } else if(entry.type === "PLAY"){
      const actor = entry.isAISeat ? "[AI]" : "[Human]";
      text += `    P${seatToPlayer(entry.seat)} ${actor}: ${entry.tilePlayed}`;
      if(entry.aiReason) text += ` (${entry.aiReason})`;
      if(entry.wasOverride) text += ` [OVERRIDE! AI wanted: ${entry.aiSuggestedTile}]`;
      else if(!entry.isAISeat && entry.aiSuggestedTile) text += ` [AI agreed]`;
      if(entry.partnerCurrentlyWinning) text += ` [partner winning]`;
      text += "\n";
      if(entry.legalMoves && entry.legalMoves.length > 1) text += `      Legal: ${entry.legalMoves.join(", ")}\n`;
    } else if(entry.type === "TRICK_END"){
      text += `    >> Winner: P${seatToPlayer(entry.winnerSeat)} (Team ${entry.winnerTeam}) +${entry.pointsInTrick} pts\n`;
      text += `    >> Plays: ${entry.playsString}\n`;
    } else if(entry.type === "HAND_END"){
      const scores = entry.finalScores || {};
      text += `\n  ====== HAND ${entry.handId + 1} RESULT ======\n`;
      text += `  Final: Team1=${scores.team1||0} Team2=${scores.team2||0}\n`;
      text += `  ${entry.winner || ""}\n`;
      text += `  Bid made: ${entry.bidMade ? "Yes" : "No"}\n`;
    }
  }
  return text;
}

function formatAdvancedLogCurrentHand(){
  const entries = getCurrentHandEntries();
  if(entries.length === 0) return 'No current hand data.';
  // Reuse the full advanced formatter but only on current hand entries
  let text = "=== CURRENT HAND — ADVANCED AI DEBUG ===\n";
  text += "=== Generated: " + new Date().toISOString() + " ===\n\n";
  let _noTrump = false;
  for(const entry of entries){
    if(entry.type === "HAND_START"){
      const c = entry.contract || {};
      _noTrump = (c.mode === "NELLO" || c.mode === "NONE" || c.mode === "NO_TRUMP");
      text += "\n" + "=".repeat(70) + "\n";
      text += " HAND " + (entry.handId + 1) + "\n";
      text += "=".repeat(70) + "\n";
      text += "Contract: " + (c.mode||"NORMAL") + " | Trump: " + (c.trumpDisplay||"?");
      text += " | Bid: " + (c.bid||"?") + " by P" + seatToPlayer(c.bidderSeat||0);
      text += " (Team " + (c.bidderTeam||"?") + ")\n";
      const scores = entry.scoresBeforeHand || {};
      text += "Scores Before: Team1=" + (scores.team1||0) + " Team2=" + (scores.team2||0) + "\n";
      if(entry.hands){
        text += "Hands:\n";
        for(const h of entry.hands){
          if(h.tiles && h.tiles.length > 0) text += "  P" + seatToPlayer(h.seat) + " (T" + h.team + "): " + h.tiles.join(", ") + "\n";
        }
      }
    }
    else if(entry.type === "TRICK_START"){
      text += "\n--- Trick " + (entry.trickId + 1) + " ---\n";
      text += "  Leader: P" + seatToPlayer(entry.leaderSeat) + " (Team " + entry.leaderTeam + ")\n";
    }
    else if(entry.type === "PLAY"){
      const actor = entry.isAISeat ? "[AI]" : "[Human]";
      text += "\n  P" + seatToPlayer(entry.seat) + " " + actor + " plays: " + entry.tilePlayed;
      if(entry.aiReason) text += " — " + entry.aiReason;
      if(entry.wasOverride) text += " [OVERRIDE! AI wanted: " + entry.aiSuggestedTile + "]";
      text += "\n";
      if(entry.legalMoves && entry.legalMoves.length > 1) text += "    Legal moves: " + entry.legalMoves.join(", ") + "\n";
      const d = entry.aiDebug;
      if(d){
        text += "    \u250c\u2500\u2500\u2500 AI REASONING \u2500\u2500\u2500\n";
        text += "    \u2502 Seat: " + d.seat + " | Team: " + d.myTeam + " | Trick: " + d.trickNum;
        text += " | " + (d.isLead ? "LEADING" : "FOLLOWING (led pip: " + d.ledPip + ")") + "\n";
        text += "    \u2502 Hand: [" + (d.handTiles||[]).join(", ") + "]\n";
        text += "    \u2502 Legal: [" + (d.legalTiles||[]).join(", ") + "]\n";
        text += "    \u2502 Played tiles tracked: " + d.playedCount + "\n";
        if(d.trumpMode && d.trumpMode !== "NONE"){
          text += "    \u2502\n";
          text += "    \u2502 TRUMP: mode=" + d.trumpMode + " suit=" + d.trumpSuit + "\n";
          text += "    \u2502   In hand: [" + (d.trumpsInHand||[]).join(", ") + "]\n";
          text += "    \u2502   Remaining (not in hand): [" + (d.trumpsRemaining||[]).join(", ") + "]\n";
          text += "    \u2502   I have highest trump: " + d.iHaveHighestTrump;
          text += " (my rank: " + d.myHighestTrumpRank + " vs remaining: " + d.highestRemainingTrumpRank + ")\n";
        }
        if(d.voidTracking && Object.keys(d.voidTracking).length > 0){
          text += "    \u2502\n";
          text += "    \u2502 VOID TRACKING:\n";
          for(const [seat, info] of Object.entries(d.voidTracking)){
            if(info.voidSuits && info.voidSuits.length === 0 && !info.trumpVoidConfirmed && !(info.trumpVoidLikely > 0)){
              text += "    \u2502   " + seat + " (" + info.team + "): no voids detected\n";
            } else {
              text += "    \u2502   " + seat + " (" + info.team + "): void in suits [" + info.voidSuits.join(",") + "]";
              if(!_noTrump){
                if(info.trumpVoidConfirmed) text += " | TRUMP VOID (confirmed)";
                else if(info.trumpVoidLikely > 0) text += " | trump void likely (" + Math.round(info.trumpVoidLikely*100) + "%)";
              }
              text += "\n";
            }
          }
        }
        if(!_noTrump){
          text += "    \u2502\n";
          text += "    \u2502 TRUMP CONTROL: " + (d.weHaveTrumpControl ? "YES" : "NO");
          text += " (opps void: " + d.opponentsVoidInTrump + ", partners have trump: " + d.partnersHaveTrump + ")\n";
        }
        if(d.bidSafety){
          const b = d.bidSafety;
          text += "    \u2502 BID: " + b.currentBid + " | Our score: " + b.ourScore;
          text += " | Need: " + b.pointsNeeded + " | ";
          text += b.bidIsSafe ? "SAFE" : (b.bidIsClose ? "CLOSE!" : "still working");
          text += " | Tricks left: " + b.tricksLeft + "\n";
        }
        text += "    \u2502\n";
        text += "    \u2502 DECISION: " + (d.decision || d.chosenTile || "?") + "\n";
        text += "    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n";
      }
    }
    else if(entry.type === "TRICK_END"){
      text += "  >> Winner: P" + seatToPlayer(entry.winnerSeat) + " (Team " + entry.winnerTeam + ") +" + entry.pointsInTrick + " pts\n";

      // End-of-trick state summary
      const ts = entry.trickEndState;
      if(ts){
        text += "  ┌─── END OF TRICK STATE ───\n";
        text += "  │ Scores: Team1=" + ts.teamScores[0] + " Team2=" + ts.teamScores[1] + "\n";

        if(ts.bidSafety){
          const b = ts.bidSafety;
          text += "  │ Bid: " + b.currentBid + " | Need: " + b.pointsNeeded + " | ";
          if(b.bidIsSafe) text += "SAFE";
          else if(b.bidIsClose) text += "CLOSE!";
          else text += "still working";
          text += " | Tricks left: " + b.tricksLeft + "\n";
        }

        if(!_noTrump){
          if(ts.trumpsInHand && ts.trumpsInHand.length > 0){
            text += "  │ P1 trumps: [" + ts.trumpsInHand.join(", ") + "]\n";
          }
          if(ts.trumpsRemaining && ts.trumpsRemaining.length > 0){
            text += "  │ Trumps still out: [" + ts.trumpsRemaining.join(", ") + "]\n";
          } else {
            text += "  │ Trumps still out: none (all accounted for)\n";
          }

          text += "  │ Trump control: " + (ts.trumpControl ? "YES" : "NO");
          text += " (opps void: " + ts.opponentsVoidInTrump;
          if(ts.partnersHaveTrump !== undefined) text += ", partners trump: " + ts.partnersHaveTrump;
          text += ")\n";
        }

        const vt = ts.voidTracking;
        if(vt && Object.keys(vt).length > 0){
          text += "  │ KNOWN VOIDS:\n";
          for(const [seat, info] of Object.entries(vt)){
            if(info.voidSuits && info.voidSuits.length === 0 && !info.trumpVoidConfirmed && !(info.trumpVoidLikely > 0)){
              text += "  │   " + seat + " (" + info.team + "): no voids detected\n";
            } else {
              text += "  │   " + seat + " (" + info.team + "):";
              if(info.voidSuits && info.voidSuits.length > 0) text += " void in suits [" + info.voidSuits.join(",") + "]";
              if(!_noTrump){
                if(info.trumpVoidConfirmed) text += " | TRUMP VOID";
                else if(info.trumpVoidLikely > 0) text += " | trump void " + Math.round(info.trumpVoidLikely*100) + "%";
              }
              text += "\n";
            }
          }
        } else {
          text += "  │ KNOWN VOIDS: none detected yet\n";
        }
        text += "  └────────────────────────\n";
      }
    }
    else if(entry.type === "HAND_END"){
      const scores = entry.finalScores || {};
      text += "\n" + "=".repeat(70) + "\n";
      text += "HAND " + (entry.handId+1) + " RESULT: Team1=" + (scores.team1||0) + " Team2=" + (scores.team2||0);
      text += " | " + (entry.winner||"") + " | Bid made: " + (entry.bidMade ? "Yes" : "No") + "\n";
      text += "=".repeat(70) + "\n";
    }
  }
  return text;
}

// Track which tab is active for each log
// _gameLogTab, _advLogTab declared in game.js stubs
_gameLogTab = 'full';
_advLogTab = 'full';

function refreshGameLogContent(){
  const content = _gameLogTab === 'hand' ? formatGameLogCurrentHand() : (formatGameLog() || 'No log entries yet.');
  document.getElementById('gameLogContent').textContent = content;
  // Tab styling
  document.getElementById('gameLogTabFull').style.background = _gameLogTab === 'full' ? 'rgba(255,255,255,0.15)' : 'transparent';
  document.getElementById('gameLogTabFull').style.color = _gameLogTab === 'full' ? '#fff' : 'rgba(255,255,255,0.5)';
  document.getElementById('gameLogTabHand').style.background = _gameLogTab === 'hand' ? 'rgba(255,255,255,0.15)' : 'transparent';
  document.getElementById('gameLogTabHand').style.color = _gameLogTab === 'hand' ? '#fff' : 'rgba(255,255,255,0.5)';
}

function refreshAdvLogContent(){
  const content = _advLogTab === 'hand' ? formatAdvancedLogCurrentHand() : (formatAdvancedLog() || 'No log entries yet.');
  document.getElementById('advLogContent').textContent = content;
  document.getElementById('advLogTabFull').style.background = _advLogTab === 'full' ? 'rgba(255,255,255,0.15)' : 'transparent';
  document.getElementById('advLogTabFull').style.color = _advLogTab === 'full' ? '#fff' : 'rgba(255,255,255,0.5)';
  document.getElementById('advLogTabHand').style.background = _advLogTab === 'hand' ? 'rgba(255,255,255,0.15)' : 'transparent';
  document.getElementById('advLogTabHand').style.color = _advLogTab === 'hand' ? '#fff' : 'rgba(255,255,255,0.5)';
}

// Tab click handlers
document.getElementById('gameLogTabFull').addEventListener('click', () => { _gameLogTab = 'full'; refreshGameLogContent(); });
document.getElementById('gameLogTabHand').addEventListener('click', () => { _gameLogTab = 'hand'; refreshGameLogContent(); });
document.getElementById('advLogTabFull').addEventListener('click', () => { _advLogTab = 'full'; refreshAdvLogContent(); });
document.getElementById('advLogTabHand').addEventListener('click', () => { _advLogTab = 'hand'; refreshAdvLogContent(); });

// Advanced AI Log handlers
document.getElementById('menuAdvancedLog').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  refreshAdvLogContent();
  document.getElementById('advLogBackdrop').style.display = 'flex';
});

document.getElementById('advLogCloseBtn').addEventListener('click', () => {
  document.getElementById('advLogBackdrop').style.display = 'none';
});

document.getElementById('advLogCopyBtn').addEventListener('click', () => {
  const text = _advLogTab === 'hand' ? formatAdvancedLogCurrentHand() : formatAdvancedLog();
  navigator.clipboard.writeText(text).then(() => {
    document.getElementById('advLogCopyBtn').textContent = 'Copied!';
    setTimeout(() => {
      document.getElementById('advLogCopyBtn').textContent = 'Copy to Clipboard';
    }, 1500);
  }).catch(e => {
    console.error('Copy failed:', e);
  });
});

document.getElementById('advLogDownloadBtn').addEventListener('click', () => {
  const text = _advLogTab === 'hand' ? formatAdvancedLogCurrentHand() : formatAdvancedLog();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tn51_ai_debug_' + new Date().toISOString().slice(0,10) + '.txt';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('advLogClearBtn').addEventListener('click', () => {
  if(confirm('Clear all log entries? Hand numbering will restart from 1.')){
    gameLog = [];
    handNumber = 0;
    trickNumber = 0;
    saveGameLog();
    document.getElementById('advLogContent').textContent = 'Log cleared. Hand numbering will start from 1.';
  }
});

var BUILTIN_DEVICE_PRESETS = {
  "iPhone SE/8": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.071,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1537,
        "p2Scale": 0.393,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0256,
        "p3Scale": 0.393,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0256,
        "p4Scale": 0.393,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0528,
        "p5Scale": 0.393,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0256,
        "p6Scale": 0.393,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0256,
        "trickScale": 0.393,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.92,
        "p1Spacing": 0.1302,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.59,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0466,
        "p3Scale": 0.59,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.0826,
        "p4Scale": 0.59,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0466,
        "trickScale": 0.59,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.51,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 375,
    "screenHeight": 667
  },
  "iPhone 11/XR": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.071,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1537,
        "p2Scale": 0.393,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0256,
        "p3Scale": 0.393,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0256,
        "p4Scale": 0.393,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0528,
        "p5Scale": 0.393,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0256,
        "p6Scale": 0.393,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0256,
        "trickScale": 0.393,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.92,
        "p1Spacing": 0.1302,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.59,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0466,
        "p3Scale": 0.59,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.0826,
        "p4Scale": 0.59,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0466,
        "trickScale": 0.59,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.51,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 414,
    "screenHeight": 896
  },
  "iPhone 12/13/14": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.071,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1537,
        "p2Scale": 0.393,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0256,
        "p3Scale": 0.393,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0256,
        "p4Scale": 0.393,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0528,
        "p5Scale": 0.393,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0256,
        "p6Scale": 0.393,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0256,
        "trickScale": 0.393,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.92,
        "p1Spacing": 0.1302,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.59,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0466,
        "p3Scale": 0.59,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.0826,
        "p4Scale": 0.59,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0466,
        "trickScale": 0.59,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.51,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 390,
    "screenHeight": 844
  },
  "iPhone 14 Pro/15/16": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.071,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1537,
        "p2Scale": 0.393,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0256,
        "p3Scale": 0.393,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0256,
        "p4Scale": 0.393,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0528,
        "p5Scale": 0.393,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0256,
        "p6Scale": 0.393,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0256,
        "trickScale": 0.393,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.92,
        "p1Spacing": 0.1302,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.59,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0466,
        "p3Scale": 0.59,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.0826,
        "p4Scale": 0.59,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0466,
        "trickScale": 0.59,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.51,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 393,
    "screenHeight": 852
  },
  "iPhone Plus/Max": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.113,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1598,
        "p2Scale": 0.408,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0267,
        "p3Scale": 0.408,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0267,
        "p4Scale": 0.408,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0549,
        "p5Scale": 0.408,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0267,
        "p6Scale": 0.408,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0267,
        "trickScale": 0.408,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.956,
        "p1Spacing": 0.1353,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.613,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0484,
        "p3Scale": 0.613,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.0859,
        "p4Scale": 0.613,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0484,
        "trickScale": 0.613,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.53,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 430,
    "screenHeight": 932
  },
  "iPhone 16 Pro Max": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.14,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.1637,
        "p2Scale": 0.418,
        "p2x": 0.134,
        "p2y": 0.627,
        "p2Spacing": 0.0273,
        "p3Scale": 0.418,
        "p3x": 0.134,
        "p3y": 0.572,
        "p3Spacing": 0.0273,
        "p4Scale": 0.418,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0562,
        "p5Scale": 0.418,
        "p5x": 0.86,
        "p5y": 0.572,
        "p5Spacing": 0.0273,
        "p6Scale": 0.418,
        "p6x": 0.86,
        "p6y": 0.627,
        "p6Spacing": 0.0273,
        "trickScale": 0.418,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 0.98,
        "p1Spacing": 0.1386,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.628,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0496,
        "p3Scale": 0.628,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.088,
        "p4Scale": 0.628,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0496,
        "trickScale": 0.628,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.543,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 440,
    "screenHeight": 956
  },
  "iPad Mini": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.639,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.2353,
        "p2Scale": 0.602,
        "p2x": 0.126,
        "p2y": 0.627,
        "p2Spacing": 0.0393,
        "p3Scale": 0.602,
        "p3x": 0.126,
        "p3y": 0.572,
        "p3Spacing": 0.0393,
        "p4Scale": 0.602,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0809,
        "p5Scale": 0.602,
        "p5x": 0.868,
        "p5y": 0.572,
        "p5Spacing": 0.0393,
        "p6Scale": 0.602,
        "p6x": 0.868,
        "p6y": 0.627,
        "p6Spacing": 0.0393,
        "trickScale": 0.602,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 1.408,
        "p1Spacing": 0.1992,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.903,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0713,
        "p3Scale": 0.903,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.1265,
        "p4Scale": 0.903,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0713,
        "trickScale": 0.903,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.781,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 744,
    "screenHeight": 1133
  },
  "iPad 10th/Air 11": {
      "portrait": {
          "tn51": {
              "p1Scale": 1.99,
              "p1x": 0.9,
              "p1y": 0.895,
              "p1Spacing": 0.1618,
              "p2Scale": 0.63,
              "p2x": 0.05,
              "p2y": 0.63,
              "p2Spacing": 0.028,
              "p3Scale": 0.63,
              "p3x": 0.05,
              "p3y": 0.57,
              "p3Spacing": 0.028,
              "p4Scale": 0.63,
              "p4x": 0.38,
              "p4y": 0.42,
              "p4Spacing": 0.048,
              "p5Scale": 0.63,
              "p5x": 0.95,
              "p5y": 0.57,
              "p5Spacing": 0.028,
              "p6Scale": 0.63,
              "p6x": 0.95,
              "p6y": 0.63,
              "p6Spacing": 0.028,
              "trickScale": 0.63,
              "p2xOff": -0.005,
              "p3xOff": -0.005,
              "p5xOff": -0.005,
              "p6xOff": -0.005,
              "p1TrickX": 0.5,
              "p1TrickY": 0.665,
              "p2TrickX": 0.42,
              "p2TrickY": 0.625,
              "p3TrickX": 0.42,
              "p3TrickY": 0.58,
              "p4TrickX": 0.5,
              "p4TrickY": 0.54,
              "p5TrickX": 0.58,
              "p5TrickY": 0.58,
              "p6TrickX": 0.58,
              "p6TrickY": 0.625,
              "leadScale": 0.393,
              "leadX": 0.495,
              "leadY": 0.6,
              "ind1x": 0.5,
              "ind1y": 0.775,
              "ind2x": 0.18,
              "ind2y": 0.67,
              "ind3x": 0.18,
              "ind3y": 0.525,
              "ind4x": 0.5,
              "ind4y": 0.47,
              "ind5x": 0.815,
              "ind5y": 0.53,
              "ind6x": 0.82,
              "ind6y": 0.67,
              "thScale": 0.63,
              "thBaseX": 0.125,
              "thBaseY": 0.19,
              "thRowSpacing": 0.107,
              "thColSpacing": 0.033
          },
          "t42": {
              "p1Scale": 1.7,
              "p1Spacing": 0.137,
              "p1x": 0.905,
              "p1y": 0.905,
              "p2Scale": 0.98,
              "p2x": 0.08,
              "p2y": 0.635,
              "p2Spacing": 0.051,
              "p3Scale": 0.98,
              "p3x": 0.28,
              "p3y": 0.44,
              "p3Spacing": 0.072,
              "p4Scale": 0.98,
              "p4x": 0.92,
              "p4y": 0.635,
              "p4Spacing": 0.049,
              "trickScale": 0.98,
              "p1TrickX": 0.495,
              "p1TrickY": 0.725,
              "p2TrickX": 0.35,
              "p2TrickY": 0.65,
              "p3TrickX": 0.495,
              "p3TrickY": 0.585,
              "p4TrickX": 0.63,
              "p4TrickY": 0.65,
              "leadScale": 0.8,
              "leadX": 0.49,
              "leadY": 0.65,
              "ind1x": 0.495,
              "ind1y": 0.8,
              "ind2x": 0.215,
              "ind2y": 0.65,
              "ind3x": 0.495,
              "ind3y": 0.505,
              "ind4x": 0.775,
              "ind4y": 0.65,
              "thScale": 0.76,
              "thBaseX": 0.11,
              "thBaseY": 0.21,
              "thRowSpacing": 0.1111,
              "thColSpacing": 0.039
          },
          "moon": {
              "ind1x": 0.495,
              "ind1y": 0.8,
              "ind2x": 0.165,
              "ind2y": 0.65,
              "ind3x": 0.835,
              "ind3y": 0.65,
              "p1HandScale": 1.49,
              "p1HandX": 0.895,
              "p1HandY": 0.915,
              "p1HandSpacing": 0.132,
              "p2HandScale": 0.94,
              "p2HandX": 0.075,
              "p2HandY": 0.65,
              "p2HandSpacing": 0.049,
              "p3HandScale": 0.94,
              "p3HandX": 0.925,
              "p3HandY": 0.65,
              "p3HandSpacing": 0.049,
              "trickScale": 0.415,
              "thScale": 0.415,
              "thColSpacing": 0.062,
              "thRowSpacing": 0.022,
              "thBlockGap": 0.003,
              "thBaseX": 0.12,
              "widowLabelY": -30,
              "widowHorizontal": true,
              "widowScale": 1.37,
              "widowSwapX": 0.5,
              "widowSwapY": 0.655,
              "widowSwapScale": 1,
              "trickHistoryX": 0,
              "trickHistoryY": 13,
              "bidPopupX": 0.47,
              "bidPopupY": 0.155
          },
          "moonPlaceholders": {
              "dominoWidth": 44,
              "dominoHeight": 22,
              "leadSize": 28,
              "players": {
                  "1": {
                      "xN": 0.495,
                      "yN": 0.725
                  },
                  "2": {
                      "xN": 0.35,
                      "yN": 0.65
                  },
                  "3": {
                      "xN": 0.63,
                      "yN": 0.65
                  }
              },
              "lead": {
                  "xN": 0.495,
                  "yN": 0.65
              }
          },
          "moonWidowPos": {
              "xN": 0.5,
              "yN": 0.42
          }
      },
      "screenWidth": 820,
      "screenHeight": 1180
  },

  "iPad Pro 11": {
    "portrait": {
      "tn51": {
        "p1Scale": 1.792,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.2572,
        "p2Scale": 0.658,
        "p2x": 0.1239,
        "p2y": 0.627,
        "p2Spacing": 0.0429,
        "p3Scale": 0.658,
        "p3x": 0.1239,
        "p3y": 0.572,
        "p3Spacing": 0.0429,
        "p4Scale": 0.658,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.0884,
        "p5Scale": 0.658,
        "p5x": 0.8701,
        "p5y": 0.572,
        "p5Spacing": 0.0429,
        "p6Scale": 0.658,
        "p6x": 0.8701,
        "p6y": 0.627,
        "p6Spacing": 0.0429,
        "trickScale": 0.658,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 1.54,
        "p1Spacing": 0.2178,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 0.987,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0779,
        "p3Scale": 0.987,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.1383,
        "p4Scale": 0.987,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0779,
        "trickScale": 0.987,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 0.854,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 834,
    "screenHeight": 1194
  },
  "iPad Air 13/Pro 13": {
    "portrait": {
      "tn51": {
        "p1Scale": 2.141,
        "p1x": 0.9,
        "p1y": 0.9,
        "p1Spacing": 0.3073,
        "p2Scale": 0.786,
        "p2x": 0.1193,
        "p2y": 0.627,
        "p2Spacing": 0.0513,
        "p3Scale": 0.786,
        "p3x": 0.1193,
        "p3y": 0.572,
        "p3Spacing": 0.0513,
        "p4Scale": 0.786,
        "p4x": 0.356,
        "p4y": 0.411,
        "p4Spacing": 0.1056,
        "p5Scale": 0.786,
        "p5x": 0.8747,
        "p5y": 0.572,
        "p5Spacing": 0.0513,
        "p6Scale": 0.786,
        "p6x": 0.8747,
        "p6y": 0.627,
        "p6Spacing": 0.0513,
        "trickScale": 0.786,
        "p2xOff": 0,
        "p3xOff": 0,
        "p5xOff": 0,
        "p6xOff": 0
      },
      "t42": {
        "p1Scale": 1.839,
        "p1Spacing": 0.2602,
        "p1x": 0.905,
        "p1y": 0.925,
        "p2Scale": 1.179,
        "p2x": 0.09,
        "p2y": 0.65,
        "p2Spacing": 0.0931,
        "p3Scale": 1.179,
        "p3x": 0.235,
        "p3y": 0.43,
        "p3Spacing": 0.1652,
        "p4Scale": 1.179,
        "p4x": 0.905,
        "p4y": 0.65,
        "p4Spacing": 0.0931,
        "trickScale": 1.179,
        "p1TrickX": 0.495,
        "p1TrickY": 0.725,
        "p2TrickX": 0.35,
        "p2TrickY": 0.65,
        "p3TrickX": 0.495,
        "p3TrickY": 0.585,
        "p4TrickX": 0.63,
        "p4TrickY": 0.65,
        "leadScale": 1.019,
        "leadX": 0.485,
        "leadY": 0.65,
        "ind1x": 0.495,
        "ind1y": 0.8,
        "ind2x": 0.215,
        "ind2y": 0.65,
        "ind3x": 0.495,
        "ind3y": 0.505,
        "ind4x": 0.775,
        "ind4y": 0.65
      }
    },
    "screenWidth": 1024,
    "screenHeight": 1366
  }
};



// V12: Screen name is now inline on start screen — no popup needed
// updateScreenNameUI() is called in the IIFE above

// Show start screen on load
showStartScreen();

// Service Worker registration moved to index.html (always loads, not lazy)

