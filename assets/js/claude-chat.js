// ============================================================
// Claude Chat — Direct chat overlay via WebSocket relay
// ============================================================

(function() {
  'use strict';

  const CC_WS_URL = 'wss://tn51-tx42-relay.onrender.com';
  const CC_ROOM = 'Moonroom004';
  const CC_ALLOWED_NAME = 'johnjohn';
  const CC_HEARTBEAT_MS = 15000;
  const CC_HISTORY_KEY = 'txdom_chatHistory';
  const CC_MAX_HISTORY = 50;

  // Load chat history from localStorage
  function ccLoadHistory() {
    try {
      const raw = localStorage.getItem(CC_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  // Save a message to history
  function ccSaveToHistory(name, text, isSelf) {
    try {
      const history = ccLoadHistory();
      history.push({ name, text, isSelf, t: Date.now() });
      if (history.length > CC_MAX_HISTORY) history.splice(0, history.length - CC_MAX_HISTORY);
      localStorage.setItem(CC_HISTORY_KEY, JSON.stringify(history));
    } catch(e) {}
  }

  // Restore chat history into the chat container
  function ccRestoreHistory() {
    const container = document.getElementById('claudeChatMessages');
    if (!container) return;
    const history = ccLoadHistory();
    for (const msg of history) {
      const div = document.createElement('div');
      div.className = 'claude-chat-msg' + (msg.isSelf ? ' claude-chat-msg-self' : '');
      div.innerHTML =
        '<div class="claude-chat-msg-header">' +
          '<span class="claude-chat-msg-name">' + escapeHtml(msg.name) + '</span>' +
        '</div>' +
        '<div class="claude-chat-msg-text">' + escapeHtml(msg.text) + '</div>';
      container.appendChild(div);
    }
    container.scrollTop = container.scrollHeight;
  }

  let ccSocket = null;
  let ccConnected = false;
  let ccReconnectTimer = null;
  let ccHeartbeatTimer = null;
  let ccReconnectDelay = 1000;
  let ccOpen = false;

  // ---- UI Toggle ----
  window.claudeChatToggle = function() {
    const backdrop = document.getElementById('claudeChatBackdrop');
    if (!backdrop) return;

    if (ccOpen) {
      backdrop.style.display = 'none';
      ccOpen = false;
      claudeChatDisconnect();
    } else {
      backdrop.style.display = 'flex';
      ccOpen = true;

      // Check access — wrong handle sees "offline" and nothing else
      const name = (typeof playerName !== 'undefined' && playerName) ? playerName : '';
      if (name.toLowerCase() !== CC_ALLOWED_NAME) {
        claudeChatAddMessage('System', 'Public chat is currently offline.', false, true);
        ccUpdateStatus('disconnected');
        return;
      }
      // Restore history if chat is empty
      const container = document.getElementById('claudeChatMessages');
      if (container && container.children.length === 0) {
        ccRestoreHistory();
      }
      claudeChatConnect();
      // Focus input
      const input = document.getElementById('claudeChatInput');
      if (input) setTimeout(() => input.focus(), 100);
    }
  };

  // ---- Connection ----
  window.claudeChatConnect = function() {
    if (ccSocket && (ccSocket.readyState === WebSocket.OPEN || ccSocket.readyState === WebSocket.CONNECTING)) return;

    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : 'Player';
    ccUpdateStatus('connecting');

    try {
      ccSocket = new WebSocket(CC_WS_URL);
    } catch (e) {
      console.error('[ClaudeChat] WebSocket create error:', e);
      ccUpdateStatus('disconnected');
      ccScheduleReconnect();
      return;
    }

    ccSocket.onopen = function() {
      console.log('[ClaudeChat] Connected');
      ccConnected = true;
      ccReconnectDelay = 1000;
      ccUpdateStatus('connected');

      // Join room
      ccSocket.send(JSON.stringify({ type: 'join', room: CC_ROOM }));
      // Hello
      ccSocket.send(JSON.stringify({ type: 'chat', room: CC_ROOM, seat: 0, name: name, text: '** joined Claude Chat **', t: Date.now() }));

      // Heartbeat
      clearInterval(ccHeartbeatTimer);
      ccHeartbeatTimer = setInterval(function() {
        if (ccSocket && ccSocket.readyState === WebSocket.OPEN) {
          ccSocket.send(JSON.stringify({ type: 'ping', room: CC_ROOM }));
        }
      }, CC_HEARTBEAT_MS);
    };

    ccSocket.onmessage = function(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'chat') {
          const selfName = (typeof playerName !== 'undefined' && playerName) ? playerName : 'Player';
          const isSelf = msg.name && msg.name.toLowerCase() === selfName.toLowerCase();
          if (!isSelf) {
            // ACK = stop retrying, mark as received, don't display
            if (msg.text === '__ack__') {
              ccClearPending();
              ccMarkReceived();
              return;
            }
            claudeChatAddMessage(msg.name || 'Unknown', msg.text || '', false, false);
            ccAddMiniMessage(msg.name || 'Unknown', msg.text || '', false);
            ccClearPending();
            // Show badge if chat is minimized (bubble visible)
            ccShowBadge();
          }
        }
      } catch (e) {}
    };

    ccSocket.onclose = function() {
      console.log('[ClaudeChat] Disconnected');
      ccConnected = false;
      ccUpdateStatus('disconnected');
      clearInterval(ccHeartbeatTimer);
      if (ccOpen) ccScheduleReconnect();
    };

    ccSocket.onerror = function(err) {
      console.error('[ClaudeChat] WebSocket error:', err);
      ccUpdateStatus('disconnected');
    };
  };

  window.claudeChatDisconnect = function() {
    clearTimeout(ccReconnectTimer);
    clearInterval(ccHeartbeatTimer);
    ccReconnectTimer = null;
    if (ccSocket) {
      try { ccSocket.close(); } catch (e) {}
      ccSocket = null;
    }
    ccConnected = false;
    ccUpdateStatus('disconnected');
  };

  function ccScheduleReconnect() {
    if (ccReconnectTimer) return;
    ccReconnectTimer = setTimeout(function() {
      ccReconnectTimer = null;
      if (ccOpen) claudeChatConnect();
    }, ccReconnectDelay);
    ccReconnectDelay = Math.min(ccReconnectDelay * 2, 30000);
  }

  // ---- Send with retry until acknowledged ----
  let ccRetryTimer = null;
  let ccPendingMsg = null;

  window.claudeChatSend = function() {
    const input = document.getElementById('claudeChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!ccSocket || ccSocket.readyState !== WebSocket.OPEN) return;

    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : 'Player';
    const msgPayload = {
      type: 'chat',
      room: CC_ROOM,
      seat: 0,
      name: name,
      text: text,
      t: Date.now()
    };

    // Send immediately
    ccSocket.send(JSON.stringify(msgPayload));

    // Show own message locally (once)
    claudeChatAddMessage(name, text, true, false);

    input.value = '';
    input.focus();

    // Keep re-sending every 3 seconds until we get a reply
    ccPendingMsg = msgPayload;
    if (ccRetryTimer) clearInterval(ccRetryTimer);
    ccRetryTimer = setInterval(function() {
      if (!ccPendingMsg) { clearInterval(ccRetryTimer); ccRetryTimer = null; return; }
      if (ccSocket && ccSocket.readyState === WebSocket.OPEN) {
        ccSocket.send(JSON.stringify(ccPendingMsg));
      }
    }, 3000);
  };

  // Stop retrying when we receive a reply
  function ccClearPending() {
    ccPendingMsg = null;
    if (ccRetryTimer) { clearInterval(ccRetryTimer); ccRetryTimer = null; }
  }

  // ---- Display ----
  window.claudeChatAddMessage = function(name, text, isSelf, isSystem) {
    const container = document.getElementById('claudeChatMessages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'claude-chat-msg' + (isSelf ? ' claude-chat-msg-self' : '') + (isSystem ? ' claude-chat-msg-system' : '');
    div._sentAt = Date.now();
    div._statusEl = null;

    if (isSystem) {
      div.innerHTML = '<span class="claude-chat-msg-text-system">' + escapeHtml(text) + '</span>';
    } else {
      const statusText = isSelf ? '<span class="claude-chat-msg-status" style="color:rgba(255,200,100,0.6);font-size:9px;">sending...</span>' : '';
      div.innerHTML =
        '<div class="claude-chat-msg-header">' +
          '<span class="claude-chat-msg-name">' + escapeHtml(name) + '</span>' +
          statusText +
        '</div>' +
        '<div class="claude-chat-msg-text">' + escapeHtml(text) + '</div>';
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Save to localStorage (skip system messages)
    if (!isSystem) {
      ccSaveToHistory(name, text, isSelf);
    }

    // Track pending message for status update
    if (isSelf) {
      div._statusEl = div.querySelector('.claude-chat-msg-status');
      ccLastSentDiv = div;
    }
  };

  let ccLastSentDiv = null;

  // Update status when ACK received
  function ccMarkReceived() {
    if (ccLastSentDiv && ccLastSentDiv._statusEl) {
      const elapsed = Date.now() - ccLastSentDiv._sentAt;
      let timeStr;
      if (elapsed < 1000) timeStr = 'received just now';
      else if (elapsed < 60000) timeStr = 'received ' + Math.round(elapsed / 1000) + 's ago';
      else timeStr = 'received ' + Math.round(elapsed / 60000) + 'm ago';
      ccLastSentDiv._statusEl.textContent = timeStr;
      ccLastSentDiv._statusEl.style.color = 'rgba(100,255,150,0.7)';
      ccLastSentDiv = null;
    }
  }

  function ccUpdateStatus(state) {
    const el = document.getElementById('claudeChatStatus');
    if (!el) return;
    el.className = 'claude-chat-status claude-chat-status-' + state;
    const textEl = el.querySelector('.claude-chat-status-text');
    if (textEl) {
      textEl.textContent = state === 'connected' ? 'Connected' : state === 'connecting' ? 'Connecting...' : 'Disconnected';
    }
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ---- Mini chat mode ----
  let ccMinimized = false;

  window.claudeChatOpenMini = function() {
    document.getElementById('chatBubble').style.display = 'none';
    document.getElementById('chatMini').style.display = 'block';
    ccHideBadge();
    // Sync messages from main chat to mini
    ccSyncMiniMessages();
    // Ensure connected
    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : '';
    if (name.toLowerCase() === CC_ALLOWED_NAME && !ccConnected) claudeChatConnect();
    // Focus input
    const input = document.getElementById('chatMiniInput');
    if (input) setTimeout(() => input.focus(), 100);
  };

  window.claudeChatCloseMini = function() {
    document.getElementById('chatMini').style.display = 'none';
    document.getElementById('chatBubble').style.display = 'flex';
  };

  window.claudeChatMaximize = function() {
    document.getElementById('chatMini').style.display = 'none';
    document.getElementById('chatBubble').style.display = 'none';
    ccHideBadge();
    ccMinimized = false;
    // Open full chat
    const backdrop = document.getElementById('claudeChatBackdrop');
    if (backdrop) backdrop.style.display = 'flex';
    ccOpen = true;
    // Restore history if empty
    const container = document.getElementById('claudeChatMessages');
    if (container && container.children.length === 0) ccRestoreHistory();
    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : '';
    if (name.toLowerCase() === CC_ALLOWED_NAME && !ccConnected) claudeChatConnect();
  };

  window.claudeChatSendMini = function() {
    const input = document.getElementById('chatMiniInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!ccSocket || ccSocket.readyState !== WebSocket.OPEN) return;
    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : 'Player';
    const msgPayload = { type: 'chat', room: CC_ROOM, seat: 0, name: name, text: text, t: Date.now() };
    ccSocket.send(JSON.stringify(msgPayload));
    claudeChatAddMessage(name, text, true, false);
    ccAddMiniMessage(name, text, true);
    input.value = '';
    input.focus();
    // Retry logic
    ccPendingMsg = msgPayload;
    if (ccRetryTimer) clearInterval(ccRetryTimer);
    ccRetryTimer = setInterval(function() {
      if (!ccPendingMsg) { clearInterval(ccRetryTimer); ccRetryTimer = null; return; }
      if (ccSocket && ccSocket.readyState === WebSocket.OPEN) ccSocket.send(JSON.stringify(ccPendingMsg));
    }, 3000);
  };

  function ccAddMiniMessage(name, text, isSelf) {
    const container = document.getElementById('chatMiniMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:4px;' + (isSelf ? 'text-align:right;' : '');
    div.innerHTML = '<span style="color:' + (isSelf ? 'rgba(167,139,250,0.8)' : 'rgba(34,197,94,0.8)') + ';font-weight:600;font-size:10px;">' + name + '</span> <span style="color:rgba(255,255,255,0.8);">' + text.replace(/</g,'&lt;') + '</span>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function ccSyncMiniMessages() {
    const mainMsgs = document.getElementById('claudeChatMessages');
    const miniMsgs = document.getElementById('chatMiniMessages');
    if (!mainMsgs || !miniMsgs) return;
    miniMsgs.innerHTML = '';
    // Copy last 20 messages
    const msgs = mainMsgs.querySelectorAll('.claude-chat-msg');
    const start = Math.max(0, msgs.length - 20);
    for (let i = start; i < msgs.length; i++) {
      const clone = msgs[i].cloneNode(true);
      clone.style.fontSize = '10px';
      miniMsgs.appendChild(clone);
    }
    miniMsgs.scrollTop = miniMsgs.scrollHeight;
  }

  // Override toggle to support minimize
  const origToggle = window.claudeChatToggle;
  window.claudeChatToggle = function() {
    const backdrop = document.getElementById('claudeChatBackdrop');
    if (backdrop && backdrop.style.display !== 'none') {
      // Closing full chat — minimize to bubble
      backdrop.style.display = 'none';
      ccOpen = false;
      ccMinimized = true;
      document.getElementById('chatBubble').style.display = 'flex';
      // Don't disconnect — keep alive for mini mode
    } else {
      // Opening full chat
      if (backdrop) backdrop.style.display = 'flex';
      ccOpen = true;
      ccMinimized = false;
      document.getElementById('chatBubble').style.display = 'none';
      document.getElementById('chatMini').style.display = 'none';
      ccHideBadge();
      // Restore history if chat is empty
      const container = document.getElementById('claudeChatMessages');
      if (container && container.children.length === 0) {
        ccRestoreHistory();
      }
      const name = (typeof playerName !== 'undefined' && playerName) ? playerName : '';
      if (name.toLowerCase() !== CC_ALLOWED_NAME) {
        claudeChatAddMessage('System', 'Public chat is currently offline.', false, true);
        ccUpdateStatus('disconnected');
        return;
      }
      claudeChatConnect();
      const input = document.getElementById('claudeChatInput');
      if (input) setTimeout(() => input.focus(), 100);
    }
  };

  // Also add received messages to mini chat
  const origOnMessage = ccSocket ? ccSocket.onmessage : null;
  function ccHookMiniMessages(msg) {
    if (msg.type === 'chat') {
      const selfName = (typeof playerName !== 'undefined' && playerName) ? playerName : 'Player';
      const isSelf = msg.name && msg.name.toLowerCase() === selfName.toLowerCase();
      if (!isSelf) {
        ccAddMiniMessage(msg.name || 'Unknown', msg.text || '', false);
      }
    }
  }

  // Mini input enter key
  document.addEventListener('DOMContentLoaded', function() {
    const miniInput = document.getElementById('chatMiniInput');
    if (miniInput) {
      miniInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); claudeChatSendMini(); }
      });
    }
  });

  // ---- Notification badge ----
  function ccShowBadge() {
    const badge = document.getElementById('chatBubbleBadge');
    const bubble = document.getElementById('chatBubble');
    if (badge && bubble && bubble.style.display === 'flex') {
      badge.style.display = 'block';
    }
  }
  function ccHideBadge() {
    const badge = document.getElementById('chatBubbleBadge');
    if (badge) badge.style.display = 'none';
  }

  // ---- Auto-show bubble for secret handle ----
  function ccShowBubbleIfAllowed() {
    const name = (typeof playerName !== 'undefined' && playerName) ? playerName : '';
    const bubble = document.getElementById('chatBubble');
    if (bubble && name.toLowerCase() === CC_ALLOWED_NAME) {
      bubble.style.display = 'flex';
    }
  }
  // Check every 2 seconds (player name may load late)
  setInterval(ccShowBubbleIfAllowed, 2000);

  // ---- Event Listeners ----
  document.addEventListener('DOMContentLoaded', function() {
    ccShowBubbleIfAllowed();
    const closeBtn = document.getElementById('claudeChatCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        claudeChatToggle();
      });
    }

    const backdrop = document.getElementById('claudeChatBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) claudeChatToggle();
      });
    }

    const sendBtn = document.getElementById('claudeChatSendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', function() {
        claudeChatSend();
      });
    }

    const input = document.getElementById('claudeChatInput');
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          claudeChatSend();
        }
      });
    }
  });

})();
