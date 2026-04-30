// ============================================================
// TX-Dom-Dev — mp-social.js
// Multiplayer social features extracted from game.js v13.5.0
// Includes: Rematch voting system, In-game chat, No Table Talk
// ============================================================

// ===== REMATCH VOTING SYSTEM (V10_77) =====
let _rematchVotes = {};
let _rematchDeclined = false; // V11.4: Track if this guest declined rematch
let _rematchExpectedVoters = 0;
let _rematchReceivedVotes = 0;

// Host: Send rematch invite to all players
function mpSendRematchInvite() {
  if (!mpIsHost) return;
  _rematchVotes = {};
  _rematchReceivedVotes = 0;
  _rematchExpectedVoters = 0;

  const playerCount = session.game.player_count;
  for (let s = 0; s < playerCount; s++) {
    if (s === mpSeat) continue;
    if (mpIsAI(s)) continue;
    _rematchExpectedVoters++;
  }

  mpSendMove({ action: 'rematch_invite', hostSeat: mpSeat });
  console.log('[MP] Sent rematch invite, expecting', _rematchExpectedVoters, 'votes');

  // If no human guests, just start new game immediately
  if (_rematchExpectedVoters === 0) {
    mpStartRematch([]);
    return;
  }

  // Timeout: if not all votes in 15 seconds, proceed with whoever accepted
  setTimeout(() => {
    if (_rematchReceivedVotes < _rematchExpectedVoters) {
      console.log('[MP] Rematch vote timeout (' + _rematchReceivedVotes + '/' + _rematchExpectedVoters + ')');
      mpProcessRematchVotes();
    }
  }, 15000);
}

// Host: Handle a rematch vote from a guest
function mpHandleRematchVote(move) {
  if (!mpIsHost) return;
  const seat = move.seat;
  const accepted = move.accepted;
  _rematchVotes[seat] = accepted;
  _rematchReceivedVotes++;
  console.log('[MP] Rematch vote from seat', seat, ':', accepted ? 'YES' : 'NO');

  // Update the button text with vote count
  const rematchBtn = document.getElementById('gameEndRematchBtn');
  if (rematchBtn) {
    rematchBtn.textContent = 'Votes: ' + _rematchReceivedVotes + '/' + _rematchExpectedVoters;
  }

  if (_rematchReceivedVotes >= _rematchExpectedVoters) {
    mpProcessRematchVotes();
  }
}

// Host: Process all votes and start or cancel rematch
function mpProcessRematchVotes() {
  const accepted = [];
  for (const [seat, vote] of Object.entries(_rematchVotes)) {
    if (vote) accepted.push(parseInt(seat));
  }

  if (accepted.length > 0) {
    mpStartRematch(accepted);
  } else {
    // Nobody accepted
    const rematchBtn = document.getElementById('gameEndRematchBtn');
    if (rematchBtn) {
      rematchBtn.textContent = 'No players accepted';
      rematchBtn.style.background = 'linear-gradient(135deg, #6b7280, #4b5563)';
      setTimeout(() => {
        rematchBtn.textContent = 'Play Again?';
        rematchBtn.style.background = 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 100%)';
        rematchBtn.style.opacity = '1';
        rematchBtn.disabled = false;
      }, 3000);
    }
  }
}

// Host: Start a new game with accepted players
function mpStartRematch(acceptedSeats) {
  console.log('[MP] Starting rematch with seats:', acceptedSeats);
  hideGameEndSummary();
  SFX.resumeBgmAfterResult();

  // Reset marks for new game
  session.team_marks = [0, 0];
  clearSavedGame();

  // Mark declined seats as AI
  const playerCount = session.game.player_count;
  for (let s = 0; s < playerCount; s++) {
    if (s === mpSeat) continue; // host stays
    if (mpIsAI(s)) continue; // already AI
    if (!acceptedSeats.includes(s)) {
      // This player declined or didn't respond — mark as disconnected/AI
      delete mpPlayers[s];
      delete mpPlayerIds[s];
    }
  }

  // Broadcast rematch_start so guests know to reset
  mpSendMove({ action: 'rematch_start' });
  mpBroadcastPlayerList();

  // Deal new hand
  mpHostDeal();
}

// Guest: Show vote overlay when host sends rematch invite
function mpShowRematchVote() {
  triggerHaptic([50, 30, 50]); // V11.4: Haptic for rematch prompt
  const overlay = document.getElementById('gameEndOverlay');
  if (!overlay) return;

  // Replace the "Waiting for host..." text with voting buttons
  const waitMsg = document.getElementById('gameEndWaitMsg');
  if (waitMsg) {
    waitMsg.innerHTML = '<div style="margin-bottom:8px;font-size:14px;font-weight:600;">Play again?</div>'
      + '<div style="display:flex;gap:12px;justify-content:center;">'
      + '<button id="rematchYesBtn" style="padding:10px 20px;font-size:22px;background:linear-gradient(135deg,#22c55e,#16a34a);border:none;border-radius:10px;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.2);color:#fff;" title="Yes">\u{1F44D}</button>'
      + '<button id="rematchNoBtn" style="padding:10px 20px;font-size:22px;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;border-radius:10px;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.2);color:#fff;" title="No">\u{1F44E}</button>'
      + '</div>';

    document.getElementById('rematchYesBtn').addEventListener('click', () => {
      mpSendMove({ action: 'rematch_vote', seat: mpSeat, accepted: true });
      waitMsg.innerHTML = '<div style="font-size:14px;opacity:0.8;">Waiting for other players...</div>';
    });

    document.getElementById('rematchNoBtn').addEventListener('click', () => {
      mpSendMove({ action: 'rematch_vote', seat: mpSeat, accepted: false });
      waitMsg.innerHTML = '<div style="font-size:14px;opacity:0.8;">Leaving game...</div>';
      // V11.4: Disconnect and return to home screen
      _rematchDeclined = true;
      setTimeout(() => {
        hideGameEndSummary();
        mpDisconnectAndGoHome();
      }, 800);
    });
  }
}

// V11.4: Disconnect from multiplayer and return to home screen
function mpDisconnectAndGoHome() {
  console.log('[MP] Disconnecting and returning to home screen');
  // Close WebSocket
  if (mpSocket) {
    try { mpSocket.close(); } catch(e) {}
    mpSocket = null;
  }
  // Reset MP state
  MULTIPLAYER_MODE = false;
  mpConnected = false;
  mpGameStarted = false;
  mpRoom = null;
  mpSeat = -1;
  mpIsHost = false;
  mpPlayers = {};
  mpPlayerIds = {};
  _rematchDeclined = false;
  // Clear game display
  const sl = document.getElementById('spriteLayer');
  if (sl) sl.innerHTML = '';
  // Hide MP overlays
  const mpOverlay = document.getElementById('multiplayerOverlay');
  if (mpOverlay) mpOverlay.style.display = 'none';
  const mpIndicator = document.getElementById('mpIndicator');
  if (mpIndicator) mpIndicator.style.display = 'none';
  mpShowChatIcon(false); // V11.4: Hide chat
  mpClearMyChat(); // V11.4: Clear chat messages
  const chatPanel = document.getElementById('mpChatPanel');
  if (chatPanel) chatPanel.style.display = 'none';
  _mpChatOpen = false;
  setStatus('');
  // Show start screen
  showStartScreen();
}

// Guest: Handle rematch_start from host — reset and prepare for new deal
function mpHandleRematchStart() {
  // V11.4: If guest declined, ignore rematch start
  if (_rematchDeclined) {
    console.log('[MP] Ignoring rematch_start — we declined');
    return;
  }
  hideGameEndSummary();
  SFX.resumeBgmAfterResult();
  session.team_marks = [0, 0];
  clearSavedGame();
  setStatus('New game starting...');
  // The deal message will follow from the host
}

// ============ V11.4: IN-GAME CHAT ============
let mpChatEnabled = true; // Host can toggle
let _mpChatMessages = []; // Local message store
let _mpChatUnread = 0;
let _mpChatOpen = false;
const _CHAT_MAX_MESSAGES = 100;

// V11.4b: No Table Talk — blocks chat during active rounds
let _noTableTalk = true; // On by default

function _isRoundActive() {
  try {
    if (!session || !session.phase) return false;
    return session.phase === PHASE_NEED_BID || session.phase === PHASE_NEED_TRUMP ||
           session.phase === PHASE_PLAYING || session.phase === 'MOON_WIDOW';
  } catch(e) { return false; }
}

function _showNoTableTalkToast() {
  let toast = document.getElementById('noTableTalkToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'noTableTalkToast';
    toast.style.cssText = 'position:fixed;bottom:50%;left:50%;transform:translate(-50%,50%);z-index:2500;background:rgba(220,38,38,0.95);color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;text-align:center;pointer-events:none;opacity:0;transition:opacity 0.3s;font-family:system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.4);max-width:260px;';
    document.body.appendChild(toast);
  }
  toast.textContent = 'No table talk! You can chat after the round is over.';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

function mpToggleChat() {
  _mpChatOpen = !_mpChatOpen;
  const panel = document.getElementById('mpChatPanel');
  if (panel) {
    panel.style.display = _mpChatOpen ? 'flex' : 'none';
    if (_mpChatOpen) {
      _mpChatUnread = 0;
      _updateChatBadge();
      const msgs = document.getElementById('mpChatMessages');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
      const input = document.getElementById('chatInputField');
      if (input) input.focus();
    }
  }
}

function mpSendChat() {
  if (!MULTIPLAYER_MODE || !mpChatEnabled) return;
  // No Table Talk: block during active rounds
  if (_noTableTalk && _isRoundActive()) {
    _showNoTableTalkToast();
    return;
  }
  const input = document.getElementById('chatInputField');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  const msg = {
    seat: mpSeat,
    name: (typeof playerName !== 'undefined' ? playerName : 'Player') || 'Player',
    text: text,
    t: Date.now()
  };
  // Send via relay
  if (mpSocket && mpSocket.readyState === WebSocket.OPEN) {
    try {
      mpSocket.send(JSON.stringify({ type: 'chat', room: mpRoom, ...msg }));
    } catch(e) { console.warn('[CHAT] Send error:', e); }
  }
  // Show locally
  _addChatMessage(msg, true);
}

function mpHandleChat(data) {
  if (!mpChatEnabled) return;
  // No Table Talk: silently block incoming during active rounds
  if (_noTableTalk && _isRoundActive()) return;
  _addChatMessage({ seat: data.seat, name: data.name || 'Player', text: data.text, t: data.t }, false);
  if (!_mpChatOpen) {
    _mpChatUnread++;
    _updateChatBadge();
    triggerHaptic(30); // Light vibration for new message
  }
}

function mpHandleNoTableTalk(data) {
  _noTableTalk = !!data.enabled;
  _updateNoTableTalkUI();
}

function _updateNoTableTalkUI() {
  const chk = document.getElementById('chkNoTableTalk');
  if (chk) chk.checked = _noTableTalk;
  // Show/hide the label for guests
  const label = document.getElementById('noTableTalkLabel');
  if (label) label.style.display = _noTableTalk ? '' : 'none';
}

function _toggleNoTableTalk() {
  if (!mpIsHost) return;
  _noTableTalk = !_noTableTalk;
  _updateNoTableTalkUI();
  // Broadcast to all guests
  if (mpSocket && mpSocket.readyState === WebSocket.OPEN) {
    try {
      mpSocket.send(JSON.stringify({ type: 'no_table_talk', room: mpRoom, enabled: _noTableTalk }));
    } catch(e) {}
  }
}

function _addChatMessage(msg, isSelf) {
  _mpChatMessages.push({ ...msg, isSelf });
  if (_mpChatMessages.length > _CHAT_MAX_MESSAGES) _mpChatMessages.shift();
  const container = document.getElementById('mpChatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg' + (isSelf ? ' chat-self' : '');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'chat-name';
  nameSpan.textContent = (isSelf ? 'You' : (msg.name || 'P' + (msg.seat + 1))) + ':';
  div.appendChild(nameSpan);
  div.appendChild(document.createTextNode(' ' + msg.text));
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  // 24hr auto-expire
  const msgTime = msg.t || Date.now();
  setTimeout(() => {
    if (div.parentNode) div.parentNode.removeChild(div);
  }, 86400000 - (Date.now() - msgTime));
}

function _updateChatBadge() {
  const badge = document.getElementById('chatBadge');
  if (badge) {
    badge.textContent = _mpChatUnread;
    badge.style.display = _mpChatUnread > 0 ? 'block' : 'none';
  }
}

function mpClearMyChat() {
  _mpChatMessages = [];
  const container = document.getElementById('mpChatMessages');
  if (container) container.innerHTML = '';
  _mpChatUnread = 0;
  _updateChatBadge();
}

function mpClearAllChat() {
  if (!mpIsHost) return;
  mpClearMyChat();
  if (mpSocket && mpSocket.readyState === WebSocket.OPEN) {
    try {
      mpSocket.send(JSON.stringify({ type: 'chat_clear', room: mpRoom }));
    } catch(e) {}
  }
}

function mpHandleChatClear() {
  mpClearMyChat();
}

function mpShowChatIcon(show) {
  const icon = document.getElementById('mpChatIcon');
  if (icon) icon.style.display = (show && mpChatEnabled) ? 'flex' : 'none';
  // Show clear-all button only for host
  const clearAllBtn = document.getElementById('chatClearAllBtn');
  if (clearAllBtn) clearAllBtn.style.display = mpIsHost ? '' : 'none';
  // Show No Table Talk checkbox for host, label for guests
  const nttRow = document.getElementById('noTableTalkRow');
  if (nttRow) nttRow.style.display = show ? 'flex' : 'none';
  const nttChk = document.getElementById('chkNoTableTalk');
  if (nttChk) nttChk.style.display = mpIsHost ? '' : 'none';
  _updateNoTableTalkUI();
}

// V11.4b: Keep chat above keyboard WITHOUT moving the game window
// Strategy: lock body position, adjust chat panel bottom, and use visualViewport
// to counteract any scroll the browser tries to do
let _chatKeyboardOpen = false;
let _chatSavedScrollY = 0;

if (window.visualViewport) {
  const _handleViewportResize = () => {
    const panel = document.getElementById('mpChatPanel');
    const icon = document.getElementById('mpChatIcon');
    const vv = window.visualViewport;
    const keyboardHeight = window.innerHeight - vv.height;

    if (keyboardHeight > 100 && document.activeElement && document.activeElement.id === 'chatInputField') {
      _chatKeyboardOpen = true;
      // Move chat panel above keyboard
      if (panel) panel.style.bottom = (keyboardHeight + 8) + 'px';
      if (icon) icon.style.bottom = (keyboardHeight + 8) + 'px';
      // Counteract any viewport offset (scroll that iOS/Android forced)
      if (vv.offsetTop > 0) {
        window.scrollTo(0, 0);
      }
    } else {
      if (_chatKeyboardOpen) {
        _chatKeyboardOpen = false;
        if (panel) panel.style.bottom = '';
        if (icon) icon.style.bottom = '';
        window.scrollTo(0, 0);
      }
    }
  };
  window.visualViewport.addEventListener('resize', _handleViewportResize);
  window.visualViewport.addEventListener('scroll', () => {
    // If keyboard is open and viewport scrolled, force back to 0
    if (_chatKeyboardOpen && window.visualViewport.offsetTop > 0) {
      window.scrollTo(0, 0);
    }
  });
}

// Prevent body scroll on focus (iOS Safari keyboard push)
document.addEventListener('focusin', (e) => {
  if (e.target && e.target.id === 'chatInputField') {
    _chatSavedScrollY = window.scrollY;
    // Lock the page so keyboard doesn't push content
    document.body.style.position = 'fixed';
    document.body.style.top = '0';
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
});
document.addEventListener('focusout', (e) => {
  if (e.target && e.target.id === 'chatInputField') {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, 0); // Reset scroll to top
  }
});
