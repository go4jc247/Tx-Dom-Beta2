// ============================================================
// TX-Dom-Dev — observer.js
// Lazy-loaded module extracted from game.js v13.4.0
// ============================================================

// V10_104: Request room status from relay (connects if needed)
function mpRequestRoomStatus() {
  if (mpSocket && mpSocket.readyState === WebSocket.OPEN) {
    try {
      mpSocket.send(JSON.stringify({ type: 'room_status' }));
    } catch(e) {
      console.error('[MP] Room status send error:', e);
      return;
    }
    mpStatusRequested = true;
    return;
  }
  // Need to connect first
  if (mpSocket && mpSocket.readyState === WebSocket.CONNECTING) return; // already connecting
  if (mpSocket && mpSocket.readyState <= 1) mpSocket.close();

  mpSocket = new WebSocket(MP_WS_URL);
  mpSocket.onopen = () => {
    console.log('[MP] Status socket opened');
    try {
      mpSocket.send(JSON.stringify({ type: 'room_status' }));
      mpStatusRequested = true;
    } catch(e) {
      console.error('[MP] Status send error:', e);
    }
  };
  mpSocket.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch(e) { return; }
    console.log('[MP] Status received:', msg.type);
    mpHandleMessage(msg);
  };
  mpSocket.onclose = () => {
    mpStatusRequested = false;
    // Don't show disconnect status if just polling
    if (!MULTIPLAYER_MODE && !mpObserver) return;
    mpConnected = false;
    mpUpdateStatus('Disconnected', '#ef4444');
    mpUpdateIndicator();
    const obsPanel = document.getElementById('mpObserverPanel');
    if (obsPanel) obsPanel.remove();
    mpObserver = false;
  };
  mpSocket.onerror = () => {};
}

// V10_104: Connect as observer
function mpConnectAsObserver(roomName) {
  mpRoom = roomName;
  mpObserver = true;
  mpObserverViewSeat = 0;
  mpUpdateStatus('Connecting as observer...', '#a78bfa');

  // If already connected (from status polling), send observe directly
  if (mpSocket && mpSocket.readyState === WebSocket.OPEN) {
    try {
      mpSocket.send(JSON.stringify({ type: 'observe', room: roomName }));
    } catch(e) {
      console.error('[MP] Observer send error:', e);
      mpSocket.close();
    }
    return;
  }

  // Need fresh connection
  if (mpSocket && mpSocket.readyState <= 1) mpSocket.close();

  mpSocket = new WebSocket(MP_WS_URL);
  mpSocket.onopen = () => {
    try {
      mpSocket.send(JSON.stringify({ type: 'observe', room: roomName }));
    } catch(e) {
      console.error('[MP] Observer send error on open:', e);
    }
  };
  mpSocket.onmessage = (evt) => {
    let msg;
    try { msg = JSON.parse(evt.data); } catch(e) { return; }
    console.log('[MP] Observer received:', msg.type);
    mpHandleMessage(msg);
  };
  mpSocket.onclose = () => {
    mpConnected = false;
    mpObserver = false;
    mpStatusRequested = false;
    const obsPanel = document.getElementById('mpObserverPanel');
    if (obsPanel) obsPanel.remove();
    mpUpdateStatus('Observer disconnected', '#ef4444');
  };
  mpSocket.onerror = () => {
    mpUpdateStatus('Connection error', '#ef4444');
  };
}

// V10_104: Handle messages when in observer mode
function mpHandleObserverMessage(msg) {
  const move = msg.move;
  if (!move) return;

  switch(move.action) {
    case 'deal':
      mpObserverHandleDeal(move);
      break;
    case 'play':
      mpObserverHandlePlay(move);
      break;
    case 'bid':
      mpObserverHandleBid(move);
      break;
    case 'pass':
      mpObserverHandlePass(move);
      break;
    case 'trump':
      mpObserverHandleTrump(move);
      break;
    case 'state_sync':
      mpObserverHandleStateSync(move);
      break;
    case 'player_list':
      mpHandlePlayerList(move);
      break;
    case 'nello':
    case 'call_double':
    case 'nello_doubles':
      // Pass through to normal handlers (they update game state)
      if (move.action === 'call_double') {
        if(move.called) { callForDoubleActive = true; session.game.force_double_trump = true; setStatus('Double has been called!'); applyForcedDoubleGlow(); showCallDoubleBanner(); }
        else { callForDoubleActive = false; session.game.force_double_trump = false; clearForcedDoubleGlow(); }
      }
      if (move.action === 'nello_doubles') {
        nelloDoublesSuitActive = (move.mode === 'doubles_only');
        session.game.nello_doubles_suit = nelloDoublesSuitActive;
      }
      break;
    case 'widow_swap':
      // Observer sees widow swap
      if (session && session.moon_widow && move.tile) {
        const oldWidow = session.moon_widow.slice();
        session.moon_widow = move.tile.slice();
        session._widowRevealed = true;
        updateWidowDisplay();
        setStatus(getPlayerDisplayName(move.seat) + ' swapped with widow');
      }
      break;
    case 'next_hand':
    case 'start_game':
      // Observer waits for deal
      setStatus('New hand starting...');
      break;
    default:
      console.log('[MP-OBS] Ignored action:', move.action);
  }
}

// V10_104: Observer deal handler - all hands face down
function mpObserverHandleDeal(move) {
  console.log('[MP-OBS] Received deal');

  mpGameStarted = true;

  // Close modals
  document.getElementById('mpBackdrop').style.display = 'none';
  document.getElementById('bidBackdrop').style.display = 'none';

  // Ensure game mode matches
  if (move.gameMode && GAME_MODE !== move.gameMode) {
    initGameMode(move.gameMode);
  }

  // Apply layout
  if (GAME_MODE === 'MOON') applyMoonSettings();
  else if (GAME_MODE === 'T42') applyT42Settings();
  else applyTn51Settings();

  const playerCount = mpPlayerCount();
  const maxPip = mpMaxPip();
  const handSize = mpHandSize();
  const marksToWin = move.marksToWin || 7;

  if (!session || session.game.player_count !== playerCount) {
    session = new SessionV6_4g(playerCount, maxPip, handSize, marksToWin);
  }

  session.dealer = move.dealer;
  const hands = move.hands;
  session.game.set_hands(hands, 0);
  session.game.set_trump_suit(null);
  session.game.set_active_players(Array.from({length: playerCount}, (_, i) => i));
  session.phase = PHASE_NEED_BID;

  if (move.teamMarks) session.team_marks = move.teamMarks;

  // Reset visual state
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

  document.getElementById('trumpDisplay').classList.remove('visible');

  // Hide unused indicators
  if (GAME_MODE === 'MOON') {
    for (let h = 4; h <= 6; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = 'none'; }
    for (let h = 1; h <= 3; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = ''; }
  } else if (GAME_MODE === 'T42') {
    for (let h = 5; h <= 6; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = 'none'; }
  }

  // Moon widow
  if (move.moonWidow) { session.moon_widow = move.moonWidow; session._widowRevealed = false; }
  if (move.moonShoot !== undefined) session.moon_shoot = move.moonShoot;

  createPlaceholders();

  // Create sprites - ALL face down for observer
  for (let p = 0; p < playerCount; p++) {
    sprites[p] = [];
    const visualP = mpVisualPlayer(p);  // uses mpObserverViewSeat
    for (let h = 0; h < handSize; h++) {
      const tile = hands[p][h];
      if (!tile) continue;
      const sprite = makeSprite(tile);
      const pos = getHandPosition(visualP, h);
      if (pos) {
        sprite.setPose(pos);
        if (sprite._shadow) shadowLayer.appendChild(sprite._shadow);
        spriteLayer.appendChild(sprite);
        sprites[p][h] = { sprite, tile, originalSlot: h };
        sprite.setFaceUp(false);  // ALL face down for observer
      }
    }
  }

  // Scores
  if (GAME_MODE === 'MOON') {
    // Moon scores handled by updateScoreDisplay
  } else {
    team1Score = session.game.team_points[0];
    team2Score = session.game.team_points[1];
    team1Marks = session.team_marks[0];
    team2Marks = session.team_marks[1];
  }
  updateScoreDisplay();

  if (GAME_MODE === 'MOON' && session.moon_widow) updateWidowDisplay();

  positionPlayerIndicators();

  // Initialize bidding state so observer can see bid indicators
  initBiddingRound();

  // Hide start screen
  const startScreen = document.getElementById('startScreenBackdrop');
  if (startScreen) startScreen.style.display = 'none';

  setStatus('Observing - waiting for bids...');
}

// V10_104: Observer play handler
async function mpObserverHandlePlay(move) {
  if (isAnimating) {
    _mpPlayQueue.push(move);
    return;
  }
  console.log('[MP-OBS] Play from seat', move.seat, 'tile:', move.tile);

  const seat = move.seat;
  const tile = move.tile;

  // Sync current_player
  if (seat !== session.game.current_player) {
    session.game.current_player = seat;
  }

  // Find tile in hand
  const hand = session.game.hands[seat] || [];
  let gameHandIndex = -1;
  for (let i = 0; i < hand.length; i++) {
    const ht = hand[i];
    if ((ht[0] === tile[0] && ht[1] === tile[1]) || (ht[0] === tile[1] && ht[1] === tile[0])) {
      gameHandIndex = i;
      break;
    }
  }
  if (gameHandIndex < 0) {
    console.log('[MP-OBS] Tile not found in hand');
    return;
  }

  // Find sprite
  const seatSprites = sprites[seat] || [];
  let spriteIdx = -1;
  for (let i = 0; i < seatSprites.length; i++) {
    const sd = seatSprites[i];
    if (sd && sd.tile && ((sd.tile[0] === tile[0] && sd.tile[1] === tile[1]) || (sd.tile[0] === tile[1] && sd.tile[1] === tile[0]))) {
      spriteIdx = i;
      break;
    }
  }

  isAnimating = true;
  const isLead = session.game.current_trick.length === 0;

  try {
    session.play(seat, gameHandIndex);
  } catch(e) {
    console.log('[MP-OBS] Play error:', e);
    isAnimating = false;
    return;
  }

  // Animate - playDomino flips tile face-up when moving to trick area
  if (spriteIdx >= 0) {
    try {
      await playDomino(seat, spriteIdx, isLead, null, null);
    } catch(animErr) {
      console.warn('[MP-OBS] playDomino error:', animErr);
    }
  }

  // Trick complete
  if (session.game._sanitized_trick().length >= session.game.active_players.length) {
    await new Promise(r => setTimeout(r, 800));
    await collectToHistory();
    session.game.current_trick = [];
    if (session.game.force_double_trump) {
      session.game.force_double_trump = false;
      callForDoubleActive = false;
    }
    playedThisTrick = [];
    currentTrick++;

    if (session.maybe_finish_hand()) {
      setStatus(session.status);
      if (GAME_MODE !== 'MOON') {
        team1Score = session.game.team_points[0];
        team2Score = session.game.team_points[1];
        team1Marks = session.team_marks[0];
        team2Marks = session.team_marks[1];
      }
      updateScoreDisplay();
      isAnimating = false;
      setStatus('Hand over! ' + session.status);
      return;
    }
  }

  isAnimating = false;

  // Show whose turn it is
  const cp = session.game.current_player;
  setStatus(getPlayerDisplayName(cp) + '\'s turn...');

  // Process queued plays
  if (_mpPlayQueue.length > 0) {
    const next = _mpPlayQueue.shift();
    setTimeout(() => mpObserverHandlePlay(next), 100);
  }
}

// V10_104: Observer bid handler
function mpObserverHandleBid(move) {
  console.log('[MP-OBS] Bid from seat', move.seat, ':', move.bid);
  mpSuppressSend = true;

  if (biddingState) {
    // Apply bid to biddingState
    biddingState.current_seat = move.seat;
    const bidValue = move.bid;
    const bidMarks = move.marks || 1;
    // Update bidding state
    if (bidValue > 0) {
      biddingState.highest_bid = bidValue;
      biddingState.highest_bidder = move.seat;
      biddingState.highest_marks = bidMarks;
    }
    biddingState.bids_done++;
    // Show bid in placeholder
    const vp = seatToVisual(move.seat);
    const lp = seatToPlayer(move.seat);
    const ph = document.querySelector('[data-placeholder="p' + vp + '"]');
    if (ph) {
      const bidText = bidValue > 0 ? (bidMarks > 1 ? bidMarks + 'x' : String(bidValue)) : 'Pass';
      ph.textContent = bidText;
      ph.style.fontSize = '14px';
      ph.style.color = bidValue > 0 ? '#fbbf24' : '#666';
    }
    // Update status
    if (bidValue > 0) {
      setStatus('P' + lp + ' bids ' + (bidMarks > 1 ? bidMarks + 'x' : bidValue));
    } else {
      setStatus('P' + lp + ' passes');
    }
  }

  // Handle Moon shoot flag
  if (move.moonShoot !== undefined) {
    session.moon_shoot = move.moonShoot;
  }

  mpSuppressSend = false;
}

// V10_104: Observer pass handler
function mpObserverHandlePass(move) {
  console.log('[MP-OBS] Pass from seat', move.seat);
  const vp = seatToVisual(move.seat);
  const ph = document.querySelector('[data-placeholder="p' + vp + '"]');
  if (ph) {
    ph.textContent = 'Pass';
    ph.style.fontSize = '14px';
    ph.style.color = '#666';
  }
  setStatus(getPlayerDisplayName(move.seat) + ' passes');
}

// V10_104: Observer trump handler
function mpObserverHandleTrump(move) {
  console.log('[MP-OBS] Trump selected:', move.suit, 'by seat', move.seat);

  session.game.set_trump_suit(move.suit);
  session.phase = PHASE_PLAYING;
  session.bid_winner_seat = move.seat;
  if (move.contract) session.contract = move.contract;

  // Show trump display
  const trumpEl = document.getElementById('trumpDisplay');
  if (trumpEl) {
    trumpEl.classList.add('visible');
    const trumpText = document.getElementById('trumpText');
    if (trumpText) trumpText.textContent = move.suit === 'doubles' ? 'Doubles' : move.suit;
  }

  // Set active players from contract
  if (move.contract && move.contract.active_players) {
    session.game.set_active_players(move.contract.active_players);
  }

  // Set current player (left of dealer or specified)
  if (move.currentPlayer !== undefined) {
    session.game.current_player = move.currentPlayer;
  }

  setStatus('Trump is ' + (move.suit === 'doubles' ? 'Doubles' : move.suit) + ' - P' + seatToPlayer(session.game.current_player) + '\'s turn');

  positionPlayerIndicators();
}

// V10_104: Observer state sync (for mid-game join)
function mpObserverHandleStateSync(move) {
  // We can reuse most of the normal state sync logic but with all tiles face-down
  console.log('[MP-OBS] State sync received');

  mpGameStarted = true;
  document.getElementById('mpBackdrop').style.display = 'none';
  const startScreen = document.getElementById('startScreenBackdrop');
  if (startScreen) startScreen.style.display = 'none';

  if (move.gameMode && GAME_MODE !== move.gameMode) {
    initGameMode(move.gameMode);
  }

  const playerCount = mpPlayerCount();
  const maxPip = mpMaxPip();
  const handSize = mpHandSize();
  const marksToWin = move.marksToWin || 7;

  if (!session || session.game.player_count !== playerCount) {
    session = new SessionV6_4g(playerCount, maxPip, handSize, marksToWin);
  }

  session.dealer = move.dealer;
  session.phase = move.phase;
  session.bid_winner_seat = move.bidWinner;
  session.current_bid = move.currentBid;
  session.bid_marks = move.bidMarks || 1;
  session.game.marks_to_win = marksToWin;

  if (move.teamMarks) session.team_marks = move.teamMarks;
  if (move.teamPoints) session.game.team_points = move.teamPoints;
  if (move.trumpSuit !== undefined) session.game.trump_suit = move.trumpSuit;
  if (move.trumpMode !== undefined) session.game.trump_mode = move.trumpMode;
  if (move.leader !== undefined) session.game.leader = move.leader;
  session.game.current_player = move.currentPlayer;
  if (move.contract) session.contract = move.contract;
  if (move.activePlayers) session.game.active_players = move.activePlayers.slice();
  if (move.engineTrickNumber !== undefined) session.game.trick_number = move.engineTrickNumber;
  if (move.tricksTeam) {
    session.game.tricks_team = move.tricksTeam.map(team => (team || []).map(rec => rec.map(t => t ? [t[0], t[1]] : null)));
  }
  if (move.moonWidow) session.moon_widow = [move.moonWidow[0], move.moonWidow[1]];
  if (move.moonShoot !== undefined) session.moon_shoot = move.moonShoot;
  if (move.currentTrick && Array.isArray(move.currentTrick)) {
    session.game.current_trick = move.currentTrick.map(ct => [ct.seat, ct.tile ? [ct.tile[0], ct.tile[1]] : null]);
  }

  // Set hands
  const hands = move.hands;
  for (let p = 0; p < playerCount; p++) {
    session.game.hands[p] = [];
    if (hands[p]) {
      for (let h = 0; h < hands[p].length; h++) {
        if (hands[p][h]) session.game.hands[p][h] = hands[p][h];
      }
    }
  }

  // Reset visuals
  shadowLayer.innerHTML = '';
  spriteLayer.innerHTML = '';
  sprites.length = 0;
  currentTrick = move.trickNumber || 0;
  playedThisTrick = [];
  team1TricksWon = move.team1TricksWon || 0;
  team2TricksWon = move.team2TricksWon || 0;
  if (move.moonPlayerTricksWon) moonPlayerTricksWon = move.moonPlayerTricksWon.slice();
  zIndexCounter = 100;
  isAnimating = false;
  waitingForPlayer1 = false;

  // Hide unused indicators
  if (GAME_MODE === 'MOON') {
    for (let h = 4; h <= 6; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = 'none'; }
    for (let h = 1; h <= 3; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = ''; }
  } else if (GAME_MODE === 'T42') {
    for (let h = 5; h <= 6; h++) { const hel = document.getElementById('playerIndicator' + h); if (hel) hel.style.display = 'none'; }
  }

  createPlaceholders();

  // Create sprites — ALL face down for observer
  for (let p = 0; p < playerCount; p++) {
    sprites[p] = [];
    const visualP = mpVisualPlayer(p);
    const hand = session.game.hands[p] || [];
    for (let h = 0; h < hand.length; h++) {
      const tile = hand[h];
      if (!tile) continue;
      const sprite = makeSprite(tile);
      const pos = getHandPosition(visualP, h);
      if (pos) {
        sprite.setPose(pos);
        if (sprite._shadow) shadowLayer.appendChild(sprite._shadow);
        spriteLayer.appendChild(sprite);
        sprites[p][h] = { sprite, tile, originalSlot: h };
        sprite.setFaceUp(false);  // ALL face down
      }
    }
  }

  // Show played tiles in current trick (face up)
  if (move.playedThisTrick && move.playedThisTrick.length > 0) {
    for (const pt of move.playedThisTrick) {
      if (pt.tile) {
        playedThisTrick.push({ seat: pt.seat, tile: pt.tile, points: 0 });
        const sprite = makeSprite(pt.tile);
        const visualP = mpVisualPlayer(pt.seat);
        const pos = getTrickPosition(visualP);
        if (pos) {
          sprite.setPose(pos);
          sprite.setFaceUp(true);
          if (sprite._shadow) shadowLayer.appendChild(sprite._shadow);
          spriteLayer.appendChild(sprite);
        }
      }
    }
  }

  // Show trump display
  if (session.game.trump_suit !== null && session.game.trump_suit !== undefined) {
    const trumpEl = document.getElementById('trumpDisplay');
    if (trumpEl) {
      trumpEl.classList.add('visible');
      const trumpText = document.getElementById('trumpText');
      if (trumpText) trumpText.textContent = session.game.trump_suit === 'doubles' ? 'Doubles' : session.game.trump_suit;
    }
  }

  // Scores
  if (GAME_MODE !== 'MOON') {
    team1Score = session.game.team_points[0];
    team2Score = session.game.team_points[1];
    team1Marks = session.team_marks[0];
    team2Marks = session.team_marks[1];
  }
  updateScoreDisplay();
  positionPlayerIndicators();

  if (GAME_MODE === 'MOON' && session.moon_widow) updateWidowDisplay();

  // Show current game state
  if (session.phase === PHASE_PLAYING) {
    setStatus('Observing - P' + seatToPlayer(session.game.current_player) + '\'s turn');
  } else if (session.phase === PHASE_NEED_BID) {
    setStatus('Observing - bidding in progress');
  } else if (session.phase === PHASE_NEED_TRUMP) {
    setStatus('Observing - waiting for trump selection');
  } else {
    setStatus('Observing game in progress');
  }
}

// V10_104: Show observer floating panel
function mpShowObserverControls() {
  let panel = document.getElementById('mpObserverPanel');
  if (panel) panel.remove();

  panel = document.createElement('div');
  panel.id = 'mpObserverPanel';
  panel.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.88);border:1px solid rgba(167,139,250,0.4);border-radius:10px;padding:8px 14px;display:flex;gap:8px;align-items:center;z-index:1200;font-family:system-ui,-apple-system,sans-serif;';

  // Purple dot
  const dot = document.createElement('span');
  dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#a78bfa;flex-shrink:0;';
  panel.appendChild(dot);

  // Label
  const lbl = document.createElement('span');
  lbl.style.cssText = 'color:#a78bfa;font-size:12px;font-weight:600;';
  lbl.textContent = 'Observing';
  panel.appendChild(lbl);

  // Separator
  const sep = document.createElement('span');
  sep.style.cssText = 'color:#444;font-size:11px;';
  sep.textContent = '|';
  panel.appendChild(sep);

  // View label
  const viewLbl = document.createElement('span');
  viewLbl.style.cssText = 'color:#9ca3af;font-size:11px;';
  viewLbl.textContent = 'View:';
  panel.appendChild(viewLbl);

  // View buttons
  const btnContainer = document.createElement('div');
  btnContainer.id = 'mpObserverViewBtns';
  btnContainer.style.cssText = 'display:flex;gap:3px;';

  const pc = session ? session.game.player_count : (GAME_MODE === 'MOON' ? 3 : (GAME_MODE === 'T42' ? 4 : 6));
  for (let i = 0; i < pc; i++) {
    const vBtn = document.createElement('button');
    vBtn.textContent = 'P' + (i + 1);
    vBtn.dataset.seat = i;
    const isActive = i === mpObserverViewSeat;
    vBtn.style.cssText = 'padding:3px 7px;border:1px solid ' + (isActive ? '#a78bfa' : 'rgba(255,255,255,0.15)') + ';border-radius:5px;background:' + (isActive ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)') + ';color:' + (isActive ? '#fff' : '#9ca3af') + ';font-size:11px;cursor:pointer;font-weight:600;';
    vBtn.addEventListener('click', () => {
      mpObserverViewSeat = i;
      mpObserverRefreshView();
      // Update button styles
      btnContainer.querySelectorAll('button').forEach(b => {
        const active = parseInt(b.dataset.seat) === mpObserverViewSeat;
        b.style.borderColor = active ? '#a78bfa' : 'rgba(255,255,255,0.15)';
        b.style.background = active ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)';
        b.style.color = active ? '#fff' : '#9ca3af';
      });
    });
    btnContainer.appendChild(vBtn);
  }
  panel.appendChild(btnContainer);

  // Leave button
  const leaveBtn = document.createElement('button');
  leaveBtn.textContent = 'Leave';
  leaveBtn.style.cssText = 'margin-left:8px;background:#ef4444;border:none;border-radius:6px;color:#fff;padding:4px 10px;font-size:11px;cursor:pointer;font-weight:600;';
  leaveBtn.addEventListener('click', () => {
    mpDisconnect();
    panel.remove();
  });
  panel.appendChild(leaveBtn);

  document.body.appendChild(panel);
}

// V10_104: Refresh observer view when switching perspective
function mpObserverRefreshView() {
  if (!session || !sprites) return;

  const playerCount = session.game.player_count;
  const handSize = mpHandSize();

  // Reposition all hand sprites
  for (let p = 0; p < playerCount; p++) {
    const visualP = mpVisualPlayer(p);
    const seatSprites = sprites[p] || [];
    let slotIdx = 0;
    for (let h = 0; h < seatSprites.length; h++) {
      const sd = seatSprites[h];
      if (!sd || !sd.sprite) continue;
      const pos = getHandPosition(visualP, slotIdx);
      if (pos) {
        sd.sprite.setPose(pos);
      }
      slotIdx++;
    }
  }

  // Reposition played tiles in current trick
  const trickSprites = spriteLayer.querySelectorAll('.trickSprite');
  // We can't easily get trick sprites, so reposition based on playedThisTrick
  // The trick tiles are the last N children of spriteLayer where N = playedThisTrick.length
  // Actually, playDomino moves them. Let's just update indicators and status
  positionPlayerIndicators();
  updateScoreDisplay();

  const cp = session.game.current_player;
  if (session.phase === PHASE_PLAYING) {
    setStatus('Observing - P' + seatToPlayer(cp) + '\'s turn');
  }
}


