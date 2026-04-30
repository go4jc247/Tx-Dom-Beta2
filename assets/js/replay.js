// ============================================================
// TX-Dom-Dev — replay.js
// Lazy-loaded module extracted from game.js v13.4.0
// ============================================================

/******************************************************************************
 * AUTO-SAVE & RESUME GAME
 ******************************************************************************/
const SAVE_KEY = 'tn51_saved_game';
const NOTES_KEY = 'tn51_notes';
const GAME_LOG_KEY = 'tn51_game_log';

// Game log array
let gameLog = [];

function saveGameState(){
  try {
    const state = {
      version: 1,
      timestamp: Date.now(),
      session: session.snapshot(),
      team1TricksWon,
      team2TricksWon,
      currentTrick,
      team1Score,
      team2Score,
      team1Marks: session.team_marks[0],
      team2Marks: session.team_marks[1],
      sprites: sprites.map((seatSprites, seatIdx) =>
        seatSprites ? seatSprites.map((s, idx) => s ? { tile: s.tile, slot: idx } : null) : []
      )
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    console.log('Game auto-saved');
  } catch(e) {
    console.warn('Failed to save game:', e);
  }
}

function loadSavedGame(){
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if(!saved) return null;
    return JSON.parse(saved);
  } catch(e) {
    console.warn('Failed to load saved game:', e);
    return null;
  }
}

function resumeGameFromSave(){
  const saved = loadSavedGame();
  if(!saved || !saved.session) return false;
  try {
    shadowLayer.innerHTML = '';
    spriteLayer.innerHTML = '';
    sprites.length = 0;

    const snap = saved.session;
    session.game.hands = snap.hands;
    session.game.current_trick = snap.current_trick || [];
    session.game.tricks_team = snap.tricks_team || [[], []];
    session.game.team_points = snap.team_points || [0, 0];
    session.game.trump_suit = snap.trump_suit;
    session.game.trump_mode = snap.trump_mode;
    session.game.trick_number = snap.trick_number || 0;
    session.game.current_player = snap.current_player || 0;
    session.game.leader = snap.leader || 0;
    session.game.active_players = snap.active_players || Array.from({length: session.game.player_count}, (_, i) => i);

    session.phase = snap.phase || PHASE_PLAYING;
    session.team_marks = snap.team_marks || [saved.team1Marks || 0, saved.team2Marks || 0];
    session.marks_to_win = snap.marks_to_win || 7;
    session.contract = snap.contract || "NORMAL";
    session.current_bid = snap.current_bid || 34;
    session.bid_marks = snap.bid_marks || 1;
    session.bid_winner_seat = snap.bid_winner_seat || 0;
    session.dealer = snap.dealer || 0;

    // V12.10.3: Restore Moon-specific state (widow + shoot the moon)
    if(snap.moon_widow) session.moon_widow = snap.moon_widow;
    if(snap.moon_shoot !== undefined) session.moon_shoot = snap.moon_shoot;

    team1TricksWon = saved.team1TricksWon || 0;
    team2TricksWon = saved.team2TricksWon || 0;
    moonPlayerTricksWon = saved.moonPlayerTricksWon || [0, 0, 0];
    currentTrick = saved.currentTrick || 0;
    team1Score = saved.team1Score || 0;
    team2Score = saved.team2Score || 0;

    // Recreate sprites using makeSprite (consistent with startNewHand)
    createPlaceholders();
    const hands = session.game.hands;
    for(let p = 0; p < session.game.player_count; p++){
      sprites[p] = [];
      const playerNum = seatToPlayer(p);
      for(let h = 0; h < session.game.hand_size; h++){
        const tile = hands[p] && hands[p][h];
        if(tile){
          const sprite = makeSprite(tile);
          const pos = getHandPosition(playerNum, h);
          if(pos){
            sprite.setPose(pos);
            if(sprite._shadow) shadowLayer.appendChild(sprite._shadow);
            spriteLayer.appendChild(sprite);
          }
          sprites[p][h] = { sprite, tile, originalSlot: h };
          if(p === 0){
            sprite.addEventListener('click', () => handlePlayer1Click(sprite));
            sprite.addEventListener('touchstart', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePlayer1Click(sprite);
            }, { passive: false });
          }
        } else {
          sprites[p][h] = null;
        }
      }
    }

    team1Marks = session.team_marks[0];
    team2Marks = session.team_marks[1];
    updateScoreDisplay();
    updateTrumpDisplay();
    renderAll();

    // V12.10.3: Redraw Moon widow after sprites are created
    if(GAME_MODE === 'MOON' && session.moon_widow){
      if(typeof updateWidowDisplay === 'function') updateWidowDisplay();
    }

    if(session.phase === PHASE_PLAYING && session.game.current_player === 0){
      waitingForPlayer1 = true;
      enablePlayer1Clicks();
      updatePlayer1ValidStates();
      setStatus('Game resumed - Click a domino to play');
    } else if(session.phase === PHASE_PLAYING){
      setStatus('Game resumed');
      setTimeout(() => aiPlayTurn(), 500);
    } else {
      setStatus(session.status || 'Game resumed');
    }

    console.log('Game restored successfully');
    return true;
  } catch(e) {
    console.error('Failed to restore game:', e);
    setStatus('Failed to restore game');
    return false;
  }
}

function hasSavedGame(){
  // V10_122e: Wrap localStorage in try-catch for iOS Safari private mode
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch(e) {
    return false;
  }
}

function clearSavedGame(){
  localStorage.removeItem(SAVE_KEY);
}

function checkForSavedGame(){
  if(hasSavedGame()){
    document.getElementById('menuResumeGame').style.display = 'block';
  } else {
    document.getElementById('menuResumeGame').style.display = 'none';
  }
}

// Resume saved game handler
document.getElementById('menuResumeGame').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  resumeGameFromSave();
});

// Auto-save after each significant action
function autoSave(){
  // Save during any active game phase
  if(session.phase === PHASE_PLAYING || session.phase === PHASE_HAND_PAUSE ||
     session.phase === PHASE_NEED_BID || session.phase === PHASE_NEED_TRUMP){
    saveGameState();
  }
}

/******************************************************************************
 * NOTES FUNCTIONALITY
 ******************************************************************************/
function loadNotes(){
  // V10_122e: Wrap localStorage in try-catch for iOS Safari private mode
  try {
    return localStorage.getItem(NOTES_KEY) || '';
  } catch(e) {
    return '';
  }
}

function saveNotes(text){
  // V10_122e: Wrap localStorage in try-catch for iOS Safari private mode
  try {
    localStorage.setItem(NOTES_KEY, text);
  } catch(e) {
    console.warn('[iOS] localStorage write error:', e);
  }
}

document.getElementById('menuNotes').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  document.getElementById('notesTextarea').value = loadNotes();
  document.getElementById('notesBackdrop').style.display = 'flex';
});

// ============================================================
// HAND REPLAY SYSTEM — save/load named hands for testing
// ============================================================
const REPLAY_KEY = 'tn51_saved_hands';

function getSavedHands(){
  try {
    const data = localStorage.getItem(REPLAY_KEY);
    return data ? JSON.parse(data) : [];
  } catch(e){ return []; }
}

function saveHandForReplay(name){
  // V12.10.6: Save from session snapshot (_dealtHands), not gameLog
  // _dealtHands is set at deal time and always reflects the CURRENT hand
  // This fixes the bug where saving during bidding would save the previous hand

  var handsToSave = null;
  var dealerToSave = session.dealer;
  var widowToSave = null;
  var contractToSave = null;

  if(session._dealtHands){
    // Best source: snapshot taken at deal time (always current)
    handsToSave = session._dealtHands.map(function(h){
      return h.map(function(t){ return t[0] + '-' + t[1]; });
    });
    if(session._dealtDealer !== undefined) dealerToSave = session._dealtDealer;
    // V12.10.7: Use _dealtWidow (set at deal time, never consumed)
    if(session._dealtWidow){
      widowToSave = session._dealtWidow;
    } else if(session._dealSnapshot && session._dealSnapshot.moon_widow){
      widowToSave = session._dealSnapshot.moon_widow;
    } else if(GAME_MODE === 'MOON' && session.moon_widow){
      widowToSave = [session.moon_widow[0], session.moon_widow[1]];
    }
  } else {
    // Fallback: read from gameLog (for hands dealt before this update)
    var handStart = null;
    for(var i = gameLog.length - 1; i >= 0; i--){
      if(gameLog[i].type === 'HAND_START'){
        handStart = gameLog[i];
        break;
      }
    }
    if(!handStart || !handStart.hands) return false;
    handsToSave = handStart.preSwapHands
      ? handStart.preSwapHands.map(function(h){ return h.tiles; })
      : handStart.hands.map(function(h){ return h.tiles; });
    dealerToSave = handStart.dealerSeat;
    contractToSave = handStart.contract;
    widowToSave = handStart.moon_widow || null;
  }

  if(!handsToSave || handsToSave.length === 0) return false;

  // Try to get contract info from gameLog if available
  if(!contractToSave){
    for(var j = gameLog.length - 1; j >= 0; j--){
      if(gameLog[j].type === 'HAND_START'){
        contractToSave = gameLog[j].contract;
        break;
      }
    }
  }

  var entry = {
    name: name,
    timestamp: Date.now(),
    gameMode: GAME_MODE,
    hands: handsToSave,
    dealerSeat: dealerToSave,
    contract: contractToSave,
    marks: [session.team_marks[0], session.team_marks[1]],
    marksToWin: session.marks_to_win,
    moon_widow: widowToSave
  };

  var saved = getSavedHands();
  saved.unshift(entry);
  if(saved.length > 20) saved.length = 20;
  localStorage.setItem(REPLAY_KEY, JSON.stringify(saved));
  return true;
}

function replayHand(index){
  const saved = getSavedHands();
  if(index < 0 || index >= saved.length) return false;
  const entry = saved[index];

  // V12.10.5: Determine target game mode from saved entry
  // Fall back to detecting from hand count if gameMode not saved (old entries)
  var targetMode = entry.gameMode || null;
  if(!targetMode){
    if(entry.hands.length === 3) targetMode = 'MOON';
    else if(entry.hands.length === 4) targetMode = 'T42';
    else targetMode = 'TN51';
  }

  // V12.10.5: FULL CLEANUP — stop all ongoing activity
  _biddingCompleting = false;
  _aiActionInProgress = false;
  _clearAllAITimers();
  biddingState = null;

  // V12.10.5: Hide ALL overlays
  hideStartScreen();
  showBidOverlay(false);
  document.getElementById('layDownBtnGroup').style.display = 'none';
  document.getElementById('layDownMinDot').style.display = 'none';
  document.getElementById('layDownTraveler').style.display = 'none';
  document.getElementById('layDownBackdrop').style.display = 'none';
  document.getElementById('callDoubleBtnGroup').style.display = 'none';
  if(typeof hideCallDoubleBanner === 'function') hideCallDoubleBanner();
  if(typeof clearForcedDoubleGlow === 'function') clearForcedDoubleGlow();

  // V12.10.5: Switch game mode if needed (creates new session with correct player count)
  if(GAME_MODE !== targetMode){
    initGameMode(targetMode);
  }

  // Reconstruct hands as tile arrays
  const hands = entry.hands.map(tiles =>
    tiles.map(tStr => {
      const parts = tStr.split('-');
      return [parseInt(parts[0]), parseInt(parts[1])];
    })
  );

  // Reset game state
  shadowLayer.innerHTML = '';
  spriteLayer.innerHTML = '';
  sprites.length = 0;
  widowSprite = null; // V12.10.4: Reset detached widow sprite
  var _widowLbl = document.getElementById('moonWidowLabel');
  if(_widowLbl) _widowLbl.style.display = 'none';
  currentTrick = 0;
  playedThisTrick = [];
  team1TricksWon = 0;
  team2TricksWon = 0;
  moonPlayerTricksWon = [0, 0, 0];
  zIndexCounter = 100;
  isAnimating = false;
  waitingForPlayer1 = false;

  // Hide boneyard2, game end summary
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

  // Re-enable bones button
  const bonesToggle = document.getElementById('boneyard2Toggle');
  if(bonesToggle){
    bonesToggle.style.pointerEvents = 'auto';
    bonesToggle.style.opacity = '';
  }

  document.getElementById('trumpDisplay').classList.remove('visible');

  // V12.10.5: Update player indicators for this game mode
  if(GAME_MODE === 'MOON'){
    for(var _ih = 4; _ih <= 6; _ih++){
      var _hel = document.getElementById('playerIndicator' + _ih);
      if(_hel) _hel.style.display = 'none';
    }
    for(var _ih2 = 1; _ih2 <= 3; _ih2++){
      var _hel2 = document.getElementById('playerIndicator' + _ih2);
      if(_hel2) _hel2.style.display = '';
    }
  } else if(GAME_MODE === 'T42'){
    for(var _ih3 = 5; _ih3 <= 6; _ih3++){
      var _hel3 = document.getElementById('playerIndicator' + _ih3);
      if(_hel3) _hel3.style.display = 'none';
    }
    for(var _ih4 = 1; _ih4 <= 4; _ih4++){
      var _hel4 = document.getElementById('playerIndicator' + _ih4);
      if(_hel4) _hel4.style.display = '';
    }
  } else {
    for(var _ih5 = 1; _ih5 <= 6; _ih5++){
      var _hel5 = document.getElementById('playerIndicator' + _ih5);
      if(_hel5) _hel5.style.display = '';
    }
  }
  if(typeof positionPlayerIndicators === 'function') positionPlayerIndicators();

  // Restore marks if saved
  if(entry.marks){
    session.team_marks = [entry.marks[0], entry.marks[1]];
  }
  if(entry.marksToWin){
    session.marks_to_win = entry.marksToWin;
  }
  if(entry.dealerSeat !== undefined){
    session.dealer = entry.dealerSeat;
  }

  // Set hands directly instead of random shuffle
  session.contract = "NORMAL";
  session.current_bid = 0;
  session.bid_marks = 1;
  session.dealer = (session.dealer + 1) % session.game.player_count;

  session.game.set_hands(hands, 0);

  // V12.10.6: Set _dealtHands so this replayed hand can be saved again
  session._dealtHands = hands.map(function(h){ return h.map(function(t){ return [t[0], t[1]]; }); });
  session._dealtDealer = session.dealer;
  // V12.10.7: Set _dealtWidow for re-save support
  session._dealtWidow = (entry.moon_widow) ? [entry.moon_widow[0], entry.moon_widow[1]] : null;

  // V12.10.4: Restore Moon widow for replay
  if(GAME_MODE === 'MOON' && entry.moon_widow){
    // moon_widow is stored as [pip1, pip2] array
    session.moon_widow = [entry.moon_widow[0], entry.moon_widow[1]];
    session._widowRevealed = false;
    // Save snapshot so this replayed hand can be saved again after a new swap
    session._dealSnapshot = {
      hands: hands.map(function(h){ return h.map(function(t){ return [t[0], t[1]]; }); }),
      moon_widow: [session.moon_widow[0], session.moon_widow[1]]
    };
  } else if(GAME_MODE === 'MOON'){
    session.moon_widow = null;
  }

  session.game.set_trump_suit(null);
  session.game.set_active_players(Array.from({length: session.game.player_count}, (_, i) => i));
  session.phase = PHASE_NEED_BID;
  session.status = "Starting bidding round... (Replaying saved hand)";

  // V12.10.5: Reset off-tracker and lay-down state
  offTracker = null;
  layDownState = null;
  layDownDismissed = false;
  layDownContested = false;
  layDownMinimized = false;

  createPlaceholders();

  for(let p = 0; p < session.game.player_count; p++){
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
  team1Marks = session.team_marks[0];
  team2Marks = session.team_marks[1];
  updateScoreDisplay();

  // V12.10.4: Show widow sprite for Moon replay
  if(GAME_MODE === 'MOON' && session.moon_widow){
    if(typeof updateWidowDisplay === 'function') updateWidowDisplay();
  }

  initBiddingRound();
  startBiddingRound();
  return true;
}

document.getElementById('menuReplay').addEventListener('click', () => {
  document.getElementById('settingsMenu').classList.remove('open');
  showReplayDialog();
});

function showReplayDialog(){
  const saved = getSavedHands();
  let overlay = document.getElementById('replayOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'replayOverlay';
    overlay.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);';
    document.body.appendChild(overlay);
  }

  let html = '<div style="background:rgba(0,20,0,0.95);border-radius:12px;padding:16px 20px;color:#fff;max-width:90%;max-height:80%;overflow-y:auto;min-width:280px;">';
  html += '<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">Saved Hands</div>';

  // Save current hand button
  html += '<div style="margin-bottom:12px;">';
  html += '<input type="text" id="replayNameInput" placeholder="Name this hand..." style="padding:6px 10px;border-radius:6px;border:1px solid #444;background:#1a1a2e;color:#fff;width:60%;font-size:13px;">';
  html += ' <button onclick="saveCurrentHand()" style="padding:6px 12px;border-radius:6px;border:none;background:#22c55e;color:#fff;cursor:pointer;font-size:13px;">Save</button>';
  html += '</div>';

  // Custom hand button
  html += '<div style="margin-bottom:12px;">';
  html += '<button onclick="showCustomHandDialog()" style="padding:8px 16px;border-radius:6px;border:none;background:#a855f7;color:#fff;cursor:pointer;font-size:13px;width:100%;">\u270F\uFE0F Custom Hand (Paste Deal)</button>';
  html += '</div>';

  if(saved.length === 0){
    html += '<div style="opacity:0.5;font-size:13px;">No saved hands yet. Play a hand first, then save it here.</div>';
  } else {
    for(let i = 0; i < saved.length; i++){
      const h = saved[i];
      const date = new Date(h.timestamp).toLocaleDateString();
      const contract = h.contract ? `${h.contract.mode || ''} ${h.contract.trumpDisplay || ''}`.trim() : '';
      const modeLabel = h.gameMode === 'MOON' ? 'Moon' : (h.gameMode === 'T42' ? 'T42' : (h.gameMode === 'TN51' ? 'TN51' : ''));
      const modeBadge = modeLabel ? `<span style="font-size:9px;background:rgba(255,255,255,0.15);padding:1px 5px;border-radius:3px;margin-left:4px;">${modeLabel}</span>` : '';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.1);">`;
      html += `<div style="flex:1;"><div style="font-size:13px;font-weight:bold;">${h.name || 'Hand ' + (i+1)}${modeBadge}</div>`;
      html += `<div style="font-size:10px;opacity:0.5;">${date}${contract ? ' | ' + contract : ''}</div></div>`;
      html += `<button onclick="loadReplayHand(${i})" style="padding:4px 10px;border-radius:6px;border:none;background:#3b82f6;color:#fff;cursor:pointer;font-size:12px;">Replay</button>`;
      html += `<button onclick="deleteReplayHand(${i})" style="padding:4px 8px;border-radius:6px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:12px;">X</button>`;
      html += '</div>';
    }
  }

  html += '<div style="text-align:right;margin-top:12px;"><button onclick="closeReplayDialog()" style="padding:6px 14px;border-radius:6px;border:none;background:#555;color:#fff;cursor:pointer;font-size:13px;">Close</button></div>';
  html += '</div>';

  overlay.innerHTML = html;
  overlay.style.display = 'flex';
}

function closeReplayDialog(){
  const el = document.getElementById('replayOverlay');
  if(el) el.style.display = 'none';
}

function saveCurrentHand(){
  const nameInput = document.getElementById('replayNameInput');
  const name = (nameInput && nameInput.value.trim()) || ('Hand ' + new Date().toLocaleTimeString());
  if(saveHandForReplay(name)){
    showReplayDialog();  // Refresh the list
  } else {
    alert('No hand data available. Play at least one hand first.');
  }
}

function loadReplayHand(index){
  document.getElementById('replayOverlay').style.display = 'none';
  replayHand(index);
}

function deleteReplayHand(index){
  const saved = getSavedHands();
  saved.splice(index, 1);
  localStorage.setItem(REPLAY_KEY, JSON.stringify(saved));
  showReplayDialog();  // Refresh
}

