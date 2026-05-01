// shuffle.js — Physics shuffle with hands for Tx-Dom-Beta2
// Extracted from Texas_Dominoes_v13.1.0_ShuffleTest_v2
// Requires: Matter.js loaded before this script

// Sandbox stubs — not in sandbox mode
var _shuffleSandboxActive = false;
var _sandboxPlaybackActive = false;
var _sandboxMode = '';
var _sandboxIdleTimer = null;
function _sandboxResetIdleTimer() {}
function _sandboxStopIdleTimer() {}
if (typeof _shufflePickPool === 'undefined') var _shufflePickPool = [];

var _shufflePhysicsActive = false;
var _shufflePhysicsEngine = null;
var _shufflePhysicsBodies = [];
var _shufflePhysicsRealSprites = [];
var _shuffleAreaCenter = { x: 0, y: 0, r: 200 };
var _shufflePhysicsRAF = null;
var _shufflePhysicsPointer = { x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, active: false };
var _shuffleTouchPointers = {}; // keyed by touch identifier: { x, y, px, py, vx, vy }
var _shufflePhysicsResolve = null;
// Recording system
var _shuffleRecording = false;
var _shuffleRecordData = [];  // array of { t, x, y, vx, vy }
var _shuffleRecordStart = 0;
var _shuffleExportedRecordings = []; // in-memory backup of exported recordings
var _shuffleGatherActive = false;
var _shuffleGatherStartTime = 0; // timestamp when gather was activated
var _shuffleGatherRampMs = 2000; // ms to ramp from 0 to full gather force

// Physics settings — calibrated from Jason's phone testing (Apr 2026)
var SHUFFLE_PHYSICS = {
  // ── Area ──
  centerXN: 0.515,
  centerYN: 0.63,
  areaRadius: 0.37,
  showArea: true,
  areaOpacity: 0.25,
  areaColor: '#ffffff',

  // ── Tiles ──
  tileScale: 0.35,
  tileCount: 0,

  // ── Grab / Push ──
  grabRadius: 240,
  grabStrength: 0.15,
  grabFalloff: 0.5,
  pushOnHover: true,

  // ── Physics ──
  timeScale: 0.8,
  frictionAir: 0.29,
  friction: 0.03,
  restitution: 1.0,
  density: 0.02,
  posIter: 9,
  velIter: 7,

  // ── Boundary (gradient force, no hard wall) ──
  boundaryForceStart: 0.9,
  boundaryForcePeak: 0.3,
  boundaryExponent: 1,
  boundaryDamping: 0.5,

  // ── Gather ──
  gatherForce: 0.005,
  gatherRadius: 110,
  gatherDamping: 0.75,
  autoGatherDelay: 850,

  // ── Scatter ──
  scatterForce: 0.08,
  scatterSpin: 0.15,

  // ── Deal animation ──
  dealSpeed: 350,
  dealStagger: 30,

  // ── Visual ──
  showShadows: false,
  shadowOpacity: 0.5,

  // ── Motion / Tilt ──
  motionEnabled: false,
  motionSensitivity: 0.5,
  motionDeadZone: 0.1,
  tiltGravity: true,
  tiltStrength: 5.0,
  shakeThreshold: 1.0,
  shakeMaxForce: 1.0,
  tiltMaxAngle: 0.5,

  // ── Playback ──
  playbackStrength: 1.0,   // multiplier for AI/replay shuffle force (0.1=gentle, 2.0=strong)
  playbackSpeed: 1.0,      // speed multiplier for playback (0.5=slow, 2.0=fast)
  playbackShowFinger: true, // show ghost finger during replay

  // ── Pick Phase / Pile Circles ──
  pileDist: 0.20,
  pileRadius: 0.21,
  centerCircleRadius: 0.45,
  pileSeatDist: {"0":0.45,"1":0.25,"5":0.25},
  pileSeatYOff: {"0":0.05,"1":0.095,"2":-0.11,"3":-0.1,"4":-0.11,"5":0.1},
  pickAnimSpeed: 0.5,       // pick phase animation speed multiplier (0.1=slow, 2.0=fast)
  showPileCircles: false,   // show dashed pile/center circles (off by default)
  showPileMenu: false       // show pile tuning panel (off by default)
};

async function performShuffleAnimation() {
  // This is now a physics-driven interactive shuffle
  // Returns a promise that resolves when player clicks "Done" or gather completes
  return new Promise(function(resolve) {
    _shufflePhysicsResolve = resolve;
    _startShufflePhysics();

    // Always auto-mix (AI shuffles for all players in this version)
    _autoMixAI();

    // Auto-end shuffle after 4 seconds
    setTimeout(function() {
      if (_shufflePhysicsActive && _shufflePhysicsResolve) {
        _endShuffleForPick();
      }
    }, 4000);
  });
}

var _shuffleRecordings = []; // loaded from shuffle_recordings.json
(function() {
  fetch('shuffle_recordings.json').then(function(r) {
    if (r.ok) return r.json();
  }).then(function(data) {
    if (Array.isArray(data) && data.length > 0) {
      _shuffleRecordings = data;
      console.log('[Shuffle] Loaded ' + data.length + ' recordings');
    }
  }).catch(function() {
    console.log('[Shuffle] No recordings file, AI will use procedural fallback');
  });
})();

function _autoMixAI() {
  if (!_shufflePhysicsActive) return;
  var ac = _shuffleAreaCenter;
  var cx = ac.x, cy = ac.y, r = ac.r;
  var ptr = _shufflePhysicsPointer;

  // Pick a random recording from any source (or fall back to procedural)
  var allRecs = _shuffleRecordings.slice();
  if (_shuffleExportedRecordings.length > 0) {
    allRecs = allRecs.concat(_shuffleExportedRecordings);
  } else {
    try { var sr = localStorage.getItem('shuffleRecordings'); if (sr) allRecs = allRecs.concat(JSON.parse(sr)); } catch(e) {}
  }
  if (allRecs.length > 0) {
    var rec = allRecs[Math.floor(Math.random() * allRecs.length)];
    _playRecording(rec, cx, cy, r, ptr);
  } else {
    _proceduralMix(cx, cy, r, ptr);
  }
}

function _playRecording(rec, cx, cy, r, ptr) {
  var points = rec.points;
  var idx = 0;
  var startTime = performance.now();
  _sandboxPlaybackActive = true;
  var SP = SHUFFLE_PHYSICS;

  // Faithful playback — no random mirror/rotation so it matches what was recorded
  var speedMult = SP.playbackSpeed;
  var strengthMult = SP.playbackStrength;
  var _pbWasMoving = false; // track moving→stopped transitions for idle timer
  var _pbLiftedFingers = {}; // fingers that have been lifted — don't recreate

  // Ghost finger indicator — only in sandbox, not in real game
  var ghostEl = (_shuffleSandboxActive && SP.playbackShowFinger) ? true : null;

  var playTimer = setInterval(function() {
    if (!_shufflePhysicsActive || !_sandboxPlaybackActive) {
      clearInterval(playTimer); _sandboxPlaybackActive = false;
      var ek = Object.keys(_shuffleTouchPointers);
      for (var ei = 0; ei < ek.length; ei++) { if (ek[ei].indexOf('_pb') === 0) delete _shuffleTouchPointers[ek[ei]]; }
      var gs = document.querySelectorAll('.playbackGhost'); for (var gi = 0; gi < gs.length; gi++) gs[gi].remove();
      return;
    }
    var now = (performance.now() - startTime) * speedMult;

    var prevIdx = idx;
    while (idx < points.length - 1 && points[idx + 1].t <= now) idx++;

    // Process ALL action events from prevIdx to idx (handles same-timestamp events)
    for (var ai = prevIdx; ai <= idx; ai++) {
      var p = points[ai];
      if (!p.action || p._played) continue;
      p._played = true;
      if (p.action === 'up') {
        var upFid = p.f !== undefined ? p.f : 0;
        _pbLiftedFingers[upFid] = p.t;
        var upKey = '_pb' + upFid;
        delete _shuffleTouchPointers[upKey];
        var upGhost = document.getElementById('playbackGhost' + upFid);
        if (upGhost) upGhost.remove();
      } else if (p.action === 'gather') {
        _shuffleGatherActive = true;
        _shuffleGatherStartTime = performance.now();
      } else if (p.action === 'ungather') {
        _shuffleGatherActive = false;
      } else if (p.action === 'scatter') {
        _shuffleGatherActive = false;
        var SP2 = SHUFFLE_PHYSICS;
        for (var si = 0; si < _shufflePhysicsBodies.length; si++) {
          var sb = _shufflePhysicsBodies[si];
          if (sb.isStatic) continue;
          Matter.Body.setVelocity(sb, {
            x: (Math.random() - 0.5) * SP2.scatterForce * 200,
            y: (Math.random() - 0.5) * SP2.scatterForce * 200
          });
          Matter.Body.setAngularVelocity(sb, (Math.random() - 0.5) * SP2.scatterSpin * 2);
        }
      }
    }

    // End check — after actions are processed
    if (idx >= points.length - 1) {
      clearInterval(playTimer);
      ptr.active = false;
      _sandboxPlaybackActive = false;
      var tpKeys = Object.keys(_shuffleTouchPointers);
      for (var tk = 0; tk < tpKeys.length; tk++) {
        if (tpKeys[tk].indexOf('_pb') === 0) delete _shuffleTouchPointers[tpKeys[tk]];
      }
      var ghosts = document.querySelectorAll('.playbackGhost');
      for (var gi = 0; gi < ghosts.length; gi++) ghosts[gi].remove();
      if (_shuffleSandboxActive) {
        _sandboxStopIdleTimer();
      } else if (window._gameStopMouseIdle) {
        window._gameStopMouseIdle();
      }
      if (!_shuffleSandboxActive) {
        setTimeout(function() {
          if (_shufflePhysicsActive) _endShuffleForPick();
        }, 400);
      }
      return;
    }

    // Collect all finger data at the current timestamp
    // Points may have multiple entries per timestamp (one per finger)
    var fingerData = {}; // f -> { x, y, vx, vy, grabR }
    // Scan from idx backward and forward to find all fingers near current time
    for (var si = Math.max(0, idx - 5); si <= Math.min(points.length - 1, idx + 5); si++) {
      var sp = points[si];
      if (sp.action) continue;
      if (Math.abs(sp.t - now) > 50) continue; // within 50ms window
      var fid = sp.f !== undefined ? sp.f : 0;
      // Skip fingers that have been lifted (until a new motion point AFTER the lift)
      if (_pbLiftedFingers[fid] !== undefined) {
        if (sp.t <= _pbLiftedFingers[fid]) continue; // motion before lift — skip
        delete _pbLiftedFingers[fid]; // motion after lift — finger is back
      }
      // Find next point for this finger for interpolation
      var spNext = sp;
      for (var sn = si + 1; sn < Math.min(points.length, si + 20); sn++) {
        if (points[sn].action) continue;
        var snf = points[sn].f !== undefined ? points[sn].f : 0;
        if (snf === fid) { spNext = points[sn]; break; }
      }
      var sdt = spNext.t - sp.t;
      var sfrac = sdt > 0 ? Math.min(1, (now - sp.t) / sdt) : 1;
      sfrac = Math.max(0, sfrac);
      fingerData[fid] = {
        x: cx + (sp.x + (spNext.x - sp.x) * sfrac) * r,
        y: cy + (sp.y + (spNext.y - sp.y) * sfrac) * r,
        vx: (sp.vx + (spNext.vx - sp.vx) * sfrac) * r * strengthMult,
        vy: (sp.vy + (spNext.vy - sp.vy) * sfrac) * r * strengthMult,
        grabR: sp.grabR || 0
      };
    }

    var fingerKeys = Object.keys(fingerData);
    if (fingerKeys.length === 0) return;

    // Set up touch pointers for each finger
    ptr.active = true;
    ptr._isTouch = true;
    // Clean old playback pointers
    var existingKeys = Object.keys(_shuffleTouchPointers);
    for (var ek = 0; ek < existingKeys.length; ek++) {
      if (existingKeys[ek].indexOf('_pb') === 0) delete _shuffleTouchPointers[existingKeys[ek]];
    }
    // Create a touch pointer per recorded finger
    var anyMoving = false;
    for (var fk = 0; fk < fingerKeys.length; fk++) {
      var fd = fingerData[fingerKeys[fk]];
      var pbKey = '_pb' + fingerKeys[fk];
      _shuffleTouchPointers[pbKey] = {
        x: fd.x, y: fd.y, vx: fd.vx, vy: fd.vy,
        px: fd.x, py: fd.y, grabR: fd.grabR
      };
      if (Math.hypot(fd.vx, fd.vy) > 0.5) anyMoving = true;
    }
    // Sync primary pointer to first finger
    var first = fingerData[fingerKeys[0]];
    ptr.x = first.x; ptr.y = first.y;
    ptr.vx = first.vx; ptr.vy = first.vy;

    // Mirror live touch behavior for idle timer:
    // Only reset on the transition from stopped→moving (like touchstart).
    // When fingers stop, let the idle timer fire naturally (like touchend).
    var maxSpd = 0;
    for (var fk = 0; fk < fingerKeys.length; fk++) {
      var fd2 = fingerData[fingerKeys[fk]];
      var s = Math.hypot(fd2.vx, fd2.vy);
      if (s > maxSpd) maxSpd = s;
    }
    var isMoving = maxSpd > 2.0;
    if (isMoving && !_pbWasMoving) {
      // Transition: stopped → moving — reset idle timer (cancels gather, starts new countdown)
      if (_shuffleSandboxActive) {
        _sandboxResetIdleTimer();
      } else if (window._gameResetMouseIdle) {
        window._gameResetMouseIdle();
      }
    } else if (!isMoving && _pbWasMoving) {
      // Transition: moving → stopped — start idle countdown for gather
      if (_shuffleSandboxActive) {
        if (_sandboxIdleTimer) { clearTimeout(_sandboxIdleTimer); _sandboxIdleTimer = null; }
        _sandboxIdleTimer = setTimeout(function() {
          if (_shuffleSandboxActive && _sandboxMode === 'shuffle' && _shufflePhysicsActive) {
            _shuffleGatherActive = true;
            _shuffleGatherStartTime = performance.now();
          }
        }, SHUFFLE_PHYSICS.autoGatherDelay);
      } else if (window._gameTriggerAutoGather) {
        // In main game, start countdown then trigger gather
        if (window._gameStopMouseIdle) window._gameStopMouseIdle();
        setTimeout(function() {
          if (_shufflePhysicsActive) window._gameTriggerAutoGather();
        }, SHUFFLE_PHYSICS.autoGatherDelay);
      }
    }
    _pbWasMoving = isMoving;

    // Update ghost finger(s)
    if (ghostEl) {
      // Aggressively remove ghosts for fingers NOT in current fingerData
      var allGhosts = document.querySelectorAll('.playbackGhost');
      var activeGhostIds = {};
      for (var fk = 0; fk < fingerKeys.length; fk++) {
        activeGhostIds['playbackGhost' + fingerKeys[fk]] = true;
      }
      for (var og = 0; og < allGhosts.length; og++) {
        if (!activeGhostIds[allGhosts[og].id]) allGhosts[og].remove();
      }
      // Update/create ghost per active finger
      var tableEl = document.getElementById('tableMain');
      for (var fk = 0; fk < fingerKeys.length; fk++) {
        var fd = fingerData[fingerKeys[fk]];
        var gid = 'playbackGhost' + fingerKeys[fk];
        var gel = document.getElementById(gid);
        if (!gel) {
          gel = document.createElement('div');
          gel.id = gid;
          gel.className = 'playbackGhost';
          var ghostR = fd.grabR > 0 ? fd.grabR : SHUFFLE_PHYSICS.grabRadius;
          gel.style.cssText = 'position:absolute;width:' + (ghostR * 2) + 'px;height:' + (ghostR * 2) + 'px;border:3px solid rgba(255,100,100,0.7);border-radius:50%;pointer-events:none;z-index:505;transform:translate(-50%,-50%);background:rgba(255,100,100,0.1);';
          tableEl.appendChild(gel);
        }
        var ghostR = fd.grabR > 0 ? fd.grabR : SHUFFLE_PHYSICS.grabRadius;
        gel.style.width = (ghostR * 2) + 'px';
        gel.style.height = (ghostR * 2) + 'px';
        gel.style.left = fd.x + 'px';
        gel.style.top = fd.y + 'px';
      }
    }
  }, 16);
}

function _proceduralMix(cx, cy, r, ptr) {
  // Fallback: simple spiral pattern
  _sandboxPlaybackActive = true;
  var elapsed = 0, duration = 15000, interval = 16;
  var angle = Math.random() * Math.PI * 2;
  var prevX = cx, prevY = cy;
  var mixTimer = setInterval(function() {
    if (!_shufflePhysicsActive || !_sandboxPlaybackActive) { clearInterval(mixTimer); ptr.active = false; return; }
    elapsed += interval;
    var t = elapsed / duration;
    var loopSpeed = 3 + t * 2;
    var spiralR = r * 0.35 * (0.4 + 0.6 * Math.sin(t * 4));
    angle += loopSpeed * interval / 1000;
    var px = cx + Math.cos(angle) * spiralR;
    var py = cy + Math.sin(angle) * spiralR;
    ptr.x = px; ptr.y = py;
    ptr.vx = (px - prevX) * 1.5;
    ptr.vy = (py - prevY) * 1.5;
    ptr.active = true;
    prevX = px; prevY = py;
    if (elapsed >= duration) {
      clearInterval(mixTimer);
      ptr.active = false;
      setTimeout(function() {
        if (_shufflePhysicsActive) _endShufflePhysics();
      }, 400);
    }
  }, interval);
}

function _setShuffleTableUI(visible) {
  // Simplified: just hide/show non-essential UI during shuffle, keep settings accessible
  _shuffleUIHidden = !visible;
  var opacity = visible ? '1' : '0';
  var transition = 'opacity 0.5s ease';
  var keepVisible = { 'spriteLayer':1, 'shadowLayer':1, 'shufflePhysicsOverlay':1,
    'settingsBtn':1, 'settingsMenu':1, 'shuffleHandCanvas':1 };
  var tableMain = document.getElementById('tableMain');
  if (tableMain) {
    for (var i = 0; i < tableMain.children.length; i++) {
      var child = tableMain.children[i];
      if (keepVisible[child.id]) continue;
      child.style.transition = transition;
      child.style.opacity = opacity;
    }
  }
}

function _startShufflePhysics() {
  if (_shufflePhysicsActive) return;
  _shufflePhysicsActive = true;
  _shuffleHandsActive = true;
  _lastShuffleHandPositions = null;
  _shuffleGatherActive = false;

  // Ensure table UI is hidden during shuffle
  _setShuffleTableUI(false);

  var SP = SHUFFLE_PHYSICS;
  var rect = getRect();
  var tableEl = document.getElementById('tableMain');
  var W = rect.width;
  var H = rect.height;

  // Center on lead indicator position
  var cx = W * SP.centerXN;
  var cy = H * SP.centerYN;
  var areaR = H * SP.areaRadius;

  // Create Matter.js engine
  var Engine = Matter.Engine, Bodies = Matter.Bodies, Body = Matter.Body, World = Matter.World;
  var engine = Engine.create({
    gravity: { x: 0, y: 0 },
    positionIterations: SP.posIter,
    velocityIterations: SP.velIter,
  });
  _shufflePhysicsEngine = engine;

  // No hard walls — gradient force keeps tiles contained (applied in physics loop)

  // Collect real sprites
  var allSprites = [];
  for (var seat = 0; seat < sprites.length; seat++) {
    var seatSprites = sprites[seat] || [];
    for (var i = 0; i < seatSprites.length; i++) {
      var data = seatSprites[i];
      if (data && data.sprite && data.sprite.parentNode) {
        allSprites.push(data.sprite);
      }
    }
  }
  _shufflePhysicsRealSprites = allSprites;
  if (allSprites.length === 0) {
    _endShufflePhysics();
    return;
  }

  // Physical tile dimensions (scaled)
  var tileW = 56 * SP.tileScale;
  var tileH = 112 * SP.tileScale;

  _shufflePhysicsBodies = [];
  _shuffleAreaCenter = { x: cx, y: cy, r: areaR };

  for (var idx = 0; idx < allSprites.length; idx++) {
    var sp = allSprites[idx];

    // Set face-down ONCE, then bypass setPose during physics
    sp.setFaceUp(false);
    if (typeof sp.setState === 'function') sp.setState(false, true);
    // NOTE: shuffleSimple is added on first physics frame (not here)
    // to avoid a visual jump from CSS layout changes

    // Hide/show shadow based on setting
    if (sp._shadow) {
      if (SP.showShadows) {
        sp._shadow.style.display = '';
        sp._shadow.style.opacity = SP.shadowOpacity;
      } else {
        sp._shadow.style.display = 'none';
      }
    }

    // Use sprite's current position if it has one (from gather transition),
    // otherwise random position inside the circle
    var pose = (typeof sp.getPose === 'function') ? sp.getPose() : null;
    var px, py, bodyAngle;
    if (pose && pose.x !== undefined) {
      px = pose.x + 28; // getPose returns top-left, body needs center
      py = pose.y + 56;
      bodyAngle = (pose.rz || 0) * Math.PI / 180;
    } else {
      var angle = Math.random() * Math.PI * 2;
      var dist = Math.random() * areaR * 0.7;
      px = cx + Math.cos(angle) * dist;
      py = cy + Math.sin(angle) * dist;
      bodyAngle = Math.random() * Math.PI * 2;
    }

    // Create physics body at the sprite's actual position
    var body = Bodies.rectangle(px, py, tileW, tileH, {
      frictionAir: SP.frictionAir,
      friction: SP.friction,
      restitution: SP.restitution,
      density: SP.density,
      angle: bodyAngle,
    });
    body._idx = idx;
    body._shufW = tileW;
    body._shufH = tileH;
    World.add(engine.world, body);
    _shufflePhysicsBodies.push(body);

    // No scatter impulse — tiles start at rest where they gathered
    // (player or AI will mix them)

    // Sync sprite and shadow to body position
    var initTx = (px - 28), initTy = (py - 56), initRa = (bodyAngle * 180 / Math.PI);
    sp.style.transform = 'translate(' + initTx + 'px,' + initTy + 'px) scale(' + SP.tileScale + ') rotate(' + initRa + 'deg)';
    sp.style.transformOrigin = '50% 50%';
    if (sp._shadow) {
      sp._shadow.style.transform = 'translate(' + initTx + 'px,' + initTy + 'px) scale(' + SP.tileScale + ') rotate(' + initRa + 'deg)';
    }
    bringToFront(sp);
  }

  // Draw circular area boundary
  if (SP.showArea) {
    var ring = document.createElement('div');
    ring.id = 'shuffleAreaRing';
    ring.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;z-index:90;'
      + 'border:2px solid ' + SP.areaColor + ';'
      + 'opacity:' + SP.areaOpacity + ';'
      + 'width:' + (areaR * 2) + 'px;height:' + (areaR * 2) + 'px;'
      + 'left:' + (cx - areaR) + 'px;top:' + (cy - areaR) + 'px;';
    tableEl.appendChild(ring);
  }

  // Create touch/mouse capture overlay (no buttons/sandbox UI)
  var overlay = document.createElement('div');
  overlay.id = 'shufflePhysicsOverlay';
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:500;touch-action:none;';
  var tableEl = document.getElementById('tableMain');
  if (tableEl) tableEl.appendChild(overlay);

  // Mouse events
  overlay.addEventListener('mousedown', function(e) {
    _shufflePhysicsPointer.active = true;
    _shufflePhysicsPointer._isTouch = false;
    var r = tableEl.getBoundingClientRect();
    _shufflePhysicsPointer.x = _shufflePhysicsPointer.px = e.clientX - r.left;
    _shufflePhysicsPointer.y = _shufflePhysicsPointer.py = e.clientY - r.top;
  });
  overlay.addEventListener('mousemove', function(e) {
    if (!_shufflePhysicsPointer.active) return;
    var r = tableEl.getBoundingClientRect();
    _shufflePhysicsPointer.px = _shufflePhysicsPointer.x;
    _shufflePhysicsPointer.py = _shufflePhysicsPointer.y;
    _shufflePhysicsPointer.x = e.clientX - r.left;
    _shufflePhysicsPointer.y = e.clientY - r.top;
    _shufflePhysicsPointer.vx = _shufflePhysicsPointer.x - _shufflePhysicsPointer.px;
    _shufflePhysicsPointer.vy = _shufflePhysicsPointer.y - _shufflePhysicsPointer.py;
  });
  overlay.addEventListener('mouseup', function() { _shufflePhysicsPointer.active = false; });
  overlay.addEventListener('mouseleave', function() { _shufflePhysicsPointer.active = false; });

  // Touch events
  overlay.addEventListener('touchstart', function(e) {
    e.preventDefault();
    _shufflePhysicsPointer.active = true;
    _shufflePhysicsPointer._isTouch = true;
    var r = tableEl.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      _shuffleTouchPointers[t.identifier] = {
        x: t.clientX - r.left, y: t.clientY - r.top,
        px: t.clientX - r.left, py: t.clientY - r.top,
        vx: 0, vy: 0
      };
    }
  }, { passive: false });
  overlay.addEventListener('touchmove', function(e) {
    e.preventDefault();
    var r = tableEl.getBoundingClientRect();
    for (var i = 0; i < e.changedTouches.length; i++) {
      var t = e.changedTouches[i];
      var tp = _shuffleTouchPointers[t.identifier];
      if (tp) {
        tp.px = tp.x; tp.py = tp.y;
        tp.x = t.clientX - r.left; tp.y = t.clientY - r.top;
        tp.vx = tp.x - tp.px; tp.vy = tp.y - tp.py;
      }
    }
    // Sync primary pointer
    var first = e.changedTouches[0];
    _shufflePhysicsPointer.px = _shufflePhysicsPointer.x;
    _shufflePhysicsPointer.py = _shufflePhysicsPointer.y;
    _shufflePhysicsPointer.x = first.clientX - r.left;
    _shufflePhysicsPointer.y = first.clientY - r.top;
    _shufflePhysicsPointer.vx = _shufflePhysicsPointer.x - _shufflePhysicsPointer.px;
    _shufflePhysicsPointer.vy = _shufflePhysicsPointer.y - _shufflePhysicsPointer.py;
  }, { passive: false });
  overlay.addEventListener('touchend', function(e) {
    for (var i = 0; i < e.changedTouches.length; i++) {
      delete _shuffleTouchPointers[e.changedTouches[i].identifier];
    }
    if (Object.keys(_shuffleTouchPointers).length === 0) _shufflePhysicsPointer.active = false;
  });

  // Start physics loop
  _shufflePhysicsLoop();
}

function _shufflePhysicsLoop() {
  if (!_shufflePhysicsActive) return;

  var SP = SHUFFLE_PHYSICS;
  var engine = _shufflePhysicsEngine;
  var ptr = _shufflePhysicsPointer;

  // Apply gather force if active (centered on shuffle area) — ramps up gradually
  if (_shuffleGatherActive) {
    var gatherElapsed = performance.now() - _shuffleGatherStartTime;
    var ramp = Math.min(1, gatherElapsed / _shuffleGatherRampMs); // 0→1 over ramp period
    ramp = ramp * ramp; // ease-in (quadratic) for natural feel
    var acx = _shuffleAreaCenter.x;
    var acy = _shuffleAreaCenter.y;
    var gR = SP.gatherRadius;
    var gatherTotalDist = 0;
    var gatherTotalSpeed = 0;
    for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
      var b = _shufflePhysicsBodies[i];
      var dx = b.position.x - acx;
      var dy = b.position.y - acy;
      var dist = Math.hypot(dx, dy);
      gatherTotalDist += dist;
      gatherTotalSpeed += Math.abs(b.velocity.x) + Math.abs(b.velocity.y);
      if (dist > gR && dist > 1) {
        var excess = dist - gR;
        var nx = dx / dist, ny = dy / dist;
        Matter.Body.applyForce(b, b.position, {
          x: -nx * excess * SP.gatherForce * ramp,
          y: -ny * excess * SP.gatherForce * ramp
        });
        // Extra damping during gather — also ramps in
        var damp = 1 - (1 - SP.gatherDamping) * ramp;
        Matter.Body.setVelocity(b, {
          x: b.velocity.x * damp,
          y: b.velocity.y * damp
        });
      }
    }
    // Auto-deactivate once tiles are settled near center (after ramp-up completes)
    var n = _shufflePhysicsBodies.length || 1;
    if (ramp >= 1 && gatherTotalDist / n < gR * 1.3 && gatherTotalSpeed / n < 0.8) {
      _shuffleGatherActive = false;
      // Re-enable gather button
      var gb = document.querySelector('#shuffleBtnBar button');
      if (gb && gb.textContent === 'Gather') {
        gb.style.opacity = '1';
        gb.style.pointerEvents = '';
      }
    }
  }

  // Gradient boundary force — ramps up as tiles approach/exceed circle edge
  if (_shuffleAreaCenter.r > 0 && !_shuffleGatherActive) {
    var acx2 = _shuffleAreaCenter.x;
    var acy2 = _shuffleAreaCenter.y;
    var bndR = _shuffleAreaCenter.r;
    var forceStart = bndR * SP.boundaryForceStart; // distance where force begins
    for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
      var b = _shufflePhysicsBodies[i];
      if (b._pileSeat !== undefined) continue; // skip tiles already in a pile
      var dx = b.position.x - acx2;
      var dy = b.position.y - acy2;
      var dist = Math.hypot(dx, dy);
      if (dist > forceStart && dist > 1) {
        var nx = dx / dist, ny = dy / dist;
        // t goes 0→1 from forceStart to bndR, then >1 beyond the circle
        var t = (dist - forceStart) / (bndR - forceStart);
        // Force ramps up with exponent — gentle near start, strong at edge
        var strength = SP.boundaryForcePeak * Math.pow(Math.min(t, 3), SP.boundaryExponent);
        Matter.Body.applyForce(b, b.position, { x: -nx * strength, y: -ny * strength });
        // Damp velocity when outside the circle to prevent escape
        if (dist > bndR) {
          Matter.Body.setVelocity(b, {
            x: b.velocity.x * SP.boundaryDamping,
            y: b.velocity.y * SP.boundaryDamping
          });
        }
      }
    }
  }

  // Per-pile containment — tiles tagged with _pileSeat stay inside their pile circle
  if (_pickPilePositions && _pickPileRadius > 0) {
    for (var pi = 0; pi < _shufflePhysicsBodies.length; pi++) {
      var pb = _shufflePhysicsBodies[pi];
      if (pb._pileSeat === undefined) continue;
      var pp = _pickPilePositions[pb._pileSeat];
      if (!pp) continue;
      var pdx = pb.position.x - pp.x;
      var pdy = pb.position.y - pp.y;
      var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      var pLimit = _pickPileRadius * 0.75; // containment zone
      if (pdist > pLimit && pdist > 1) {
        var pnx = pdx / pdist, pny = pdy / pdist;
        var pStr = 0.002 * Math.pow(Math.min((pdist - pLimit) / pLimit, 2), 1.5);
        Matter.Body.applyForce(pb, pb.position, { x: -pnx * pStr, y: -pny * pStr });
        // Hard contain — kill outward velocity at pile edge
        if (pdist > _pickPileRadius * 0.9) {
          var dot = pb.velocity.x * pnx + pb.velocity.y * pny;
          if (dot > 0) {
            Matter.Body.setVelocity(pb, {
              x: pb.velocity.x - pnx * dot,
              y: pb.velocity.y - pny * dot
            });
          }
        }
      }
    }
  }

  // Hard screen clamp — tiles cannot leave the visible table area
  var _clampRect = getRect();
  var _clampW = _clampRect.width, _clampH = _clampRect.height;
  for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
    var b = _shufflePhysicsBodies[i];
    var hw = (b._shufW || 30) * 0.5, hh = (b._shufH || 60) * 0.5;
    var clamped = false;
    if (b.position.x < hw) { Matter.Body.setPosition(b, { x: hw, y: b.position.y }); clamped = true; }
    if (b.position.x > _clampW - hw) { Matter.Body.setPosition(b, { x: _clampW - hw, y: b.position.y }); clamped = true; }
    if (b.position.y < hh) { Matter.Body.setPosition(b, { x: b.position.x, y: hh }); clamped = true; }
    if (b.position.y > _clampH - hh) { Matter.Body.setPosition(b, { x: b.position.x, y: _clampH - hh }); clamped = true; }
    if (clamped) {
      // Kill outward velocity component
      var vx = b.velocity.x, vy = b.velocity.y;
      if (b.position.x <= hw && vx < 0) vx = 0;
      if (b.position.x >= _clampW - hw && vx > 0) vx = 0;
      if (b.position.y <= hh && vy < 0) vy = 0;
      if (b.position.y >= _clampH - hh && vy > 0) vy = 0;
      Matter.Body.setVelocity(b, { x: vx * 0.5, y: vy * 0.5 });
    }
  }

  // Apply grab force from pointer (and mirror point for mouse)
  if (ptr.active) {
    var speed = Math.hypot(ptr.vx, ptr.vy);
    if (speed > 0.5) {
      var R = SP.grabRadius;
      var R2 = R * R;

      // Build list of force points
      var ac = _shuffleAreaCenter;
      var forcePoints = [];
      if (ptr._isTouch) {
        // Touch: use all active touch pointers (real multi-finger input)
        var touchKeys = Object.keys(_shuffleTouchPointers);
        for (var tk = 0; tk < touchKeys.length; tk++) {
          var tp = _shuffleTouchPointers[touchKeys[tk]];
          forcePoints.push({ x: tp.x, y: tp.y, vx: tp.vx, vy: tp.vy, grabR: tp.grabR || 0 });
        }
        if (forcePoints.length === 0) {
          forcePoints.push({ x: ptr.x, y: ptr.y, vx: ptr.vx, vy: ptr.vy, grabR: 0 });
        }
      } else {
        // Mouse: primary + 180° mirror
        forcePoints.push({ x: ptr.x, y: ptr.y, vx: ptr.vx, vy: ptr.vy });
        if (ac) {
          forcePoints.push({
            x: 2 * ac.x - ptr.x,
            y: 2 * ac.y - ptr.y,
            vx: -ptr.vx,
            vy: -ptr.vy
          });
        }
      }

      for (var fp = 0; fp < forcePoints.length; fp++) {
        var pt = forcePoints[fp];
        var spd = Math.hypot(pt.vx, pt.vy);
        if (spd < 0.5) continue;
        // Use per-finger grab radius if available, otherwise global
        var fpR = (pt.grabR > 0) ? pt.grabR : R;
        var fpR2 = fpR * fpR;
        var ux = pt.vx / spd;
        var uy = pt.vy / spd;
        for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
          var b = _shufflePhysicsBodies[i];
          var dx = b.position.x - pt.x;
          var dy = b.position.y - pt.y;
          var dist2 = dx*dx + dy*dy;
          if (dist2 >= fpR2) continue;
          // Only push tiles we're moving toward
          if (dx * ux + dy * uy > 0) continue;
          var t = 1 - Math.sqrt(dist2) / fpR;
          Matter.Body.applyForce(b, b.position, {
            x: pt.vx * Math.pow(t, SP.grabFalloff) * SP.grabStrength,
            y: pt.vy * Math.pow(t, SP.grabFalloff) * SP.grabStrength
          });
        }
      }
    }
  }

  // Record all active touch pointers individually with stable touch IDs
  if (_shuffleRecording) {
    var recT = performance.now() - _shuffleRecordStart;
    if (ptr._isTouch && ptr.active) {
      var tkeys = Object.keys(_shuffleTouchPointers);
      for (var tk = 0; tk < tkeys.length; tk++) {
        var tp = _shuffleTouchPointers[tkeys[tk]];
        if (Math.abs(tp.vx) < 0.01 && Math.abs(tp.vy) < 0.01) continue; // skip stationary
        _shuffleRecordData.push({
          t: recT, f: tkeys[tk], // f = stable touch identifier
          x: tp.x, y: tp.y, vx: tp.vx, vy: tp.vy,
          grabR: tp.grabR || 0
        });
      }
    } else if (ptr.active) {
      // Mouse fallback
      _shuffleRecordData.push({ t: recT, f: 0, x: ptr.x, y: ptr.y, vx: ptr.vx, vy: ptr.vy, grabR: 0 });
    }
  }

  // Step physics
  Matter.Engine.update(engine, (1000/60) * SP.timeScale);

  // Sync body positions -> real sprite transforms (direct, bypassing setPose for speed)
  var sc = SHUFFLE_PHYSICS.tileScale;
  for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
    var body = _shufflePhysicsBodies[i];
    var sp = _shufflePhysicsRealSprites[i];
    if (!sp) continue;
    var tx = body.position.x - 28, ty = body.position.y - 56, ra = body.angle * 180 / Math.PI;
    sp.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ') rotate(' + ra + 'deg)';
    // Sync shadow to follow the tile
    if (sp._shadow) {
      sp._shadow.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc + ') rotate(' + ra + 'deg)';
    }
    // Apply shuffleSimple on first frame (after transform is set, so no visual jump)
    if (!sp.classList.contains('shuffleSimple')) {
      sp.classList.add('shuffleSimple');
    }
  }

  // Draw shuffle hands overlay — follows pointer positions
  _drawShuffleHandsOverlay();

  _shufflePhysicsRAF = requestAnimationFrame(_shufflePhysicsLoop);
}

var _shuffleHandsActive = true; // flag to stop drawing after shuffle ends
var _lastShuffleHandPositions = null; // persist hand positions through pointer gaps

// Render hands on a canvas overlay during shuffle physics
function _drawShuffleHandsOverlay() {
  if (!_shuffleHandsActive || !_shufflePhysicsActive) {
    // If hands should be gone, remove canvas if it exists
    var old = document.getElementById('shuffleHandCanvas');
    if (old) { old.remove(); _shuffleHandCanvas = null; }
    return;
  }
  var cvs = document.getElementById('shuffleHandCanvas');
  if (!cvs) {
    var gw = document.getElementById('gameWrapper');
    if (!gw) return;
    cvs = document.createElement('canvas');
    cvs.id = 'shuffleHandCanvas';
    cvs.width = Math.round(gw.offsetWidth) || 414;
    cvs.height = Math.round(gw.offsetHeight) || 896;
    cvs.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:900;pointer-events:none;';
    gw.appendChild(cvs);
  }
  var c = cvs.getContext('2d');
  var W = cvs.width, H = cvs.height;
  c.clearRect(0, 0, W, H);

  // Build force points exactly like the physics loop does
  var ptr = _shufflePhysicsPointer;
  var ac = _shuffleAreaCenter;
  var forcePoints = [];

  if (ptr && ptr.active) {
    if (ptr._isTouch) {
      var touchKeys = Object.keys(_shuffleTouchPointers);
      for (var tk = 0; tk < touchKeys.length; tk++) {
        var tp = _shuffleTouchPointers[touchKeys[tk]];
        if (tp) forcePoints.push({ x: tp.x, y: tp.y });
      }
      if (forcePoints.length === 0) {
        forcePoints.push({ x: ptr.x, y: ptr.y });
      }
    } else {
      forcePoints.push({ x: ptr.x, y: ptr.y });
      if (ac) {
        forcePoints.push({ x: 2 * ac.x - ptr.x, y: 2 * ac.y - ptr.y });
      }
    }
  } else {
    // AI playback or idle — check all touch pointers
    var pbKeys = Object.keys(_shuffleTouchPointers);
    for (var pk = 0; pk < pbKeys.length; pk++) {
      var pbp = _shuffleTouchPointers[pbKeys[pk]];
      if (pbp) forcePoints.push({ x: pbp.x, y: pbp.y });
    }
  }

  // Update last known positions when we have data, otherwise keep previous
  if (forcePoints.length > 0) {
    _lastShuffleHandPositions = forcePoints.slice(0, 2);
  }

  // Use last known positions (persists through pointer gaps)
  var drawPoints = _lastShuffleHandPositions;
  if (!drawPoints || drawPoints.length === 0) {
    // Fallback to center
    if (ac && ac.x) {
      drawPoints = [{ x: ac.x - ac.r * 0.3, y: ac.y }, { x: ac.x + ac.r * 0.3, y: ac.y }];
    } else {
      return;
    }
  }

  // Draw hands at influence locations
  if (drawPoints.length >= 2) {
    shDrawHand(c, drawPoints[0].x, drawPoints[0].y, 0, W, H);
    shDrawHand(c, drawPoints[1].x, drawPoints[1].y, 1, W, H);
  } else if (drawPoints.length === 1) {
    shDrawHand(c, drawPoints[0].x, drawPoints[0].y, 1, W, H);
  }
}

// Clean up shuffle hand canvas when shuffle ends
var _origEndShuffleForPick = typeof _endShuffleForPick === 'function' ? _endShuffleForPick : null;

function _cleanupShuffleHands() {
  _shuffleHandsActive = false;
  var cvs = document.getElementById('shuffleHandCanvas');
  if (!cvs) return;
  var c = cvs.getContext('2d');
  var W = cvs.width, H = cvs.height;

  // Animate hands sliding off-screen downward
  var startY = H * 0.4;
  var endY = H + 200;
  var duration = 400; // ms
  var startTime = performance.now();

  // Capture last known hand positions
  var lastForcePoints = [];
  var ptr = _shufflePhysicsPointer;
  var ac = _shuffleAreaCenter;
  var tpKeys = Object.keys(_shuffleTouchPointers);
  for (var i = 0; i < tpKeys.length; i++) {
    var tp = _shuffleTouchPointers[tpKeys[i]];
    if (tp) lastForcePoints.push({ x: tp.x, y: tp.y });
  }
  if (lastForcePoints.length === 0 && ac && ac.x) {
    lastForcePoints.push({ x: ac.x - ac.r * 0.3, y: ac.y });
    lastForcePoints.push({ x: ac.x + ac.r * 0.3, y: ac.y });
  }

  function animateOff(now) {
    var elapsed = now - startTime;
    var t = Math.min(1, elapsed / duration);
    var ease = t * t; // ease-in
    var offsetY = ease * (endY - startY);

    c.clearRect(0, 0, W, H);
    if (lastForcePoints.length >= 2) {
      shDrawHand(c, lastForcePoints[0].x, lastForcePoints[0].y + offsetY, 0, W, H);
      shDrawHand(c, lastForcePoints[1].x, lastForcePoints[1].y + offsetY, 1, W, H);
    } else if (lastForcePoints.length === 1) {
      shDrawHand(c, lastForcePoints[0].x, lastForcePoints[0].y + offsetY, 1, W, H);
    }

    if (t < 1) {
      requestAnimationFrame(animateOff);
    } else {
      cvs.remove();
      _shuffleHandCanvas = null;
    }
  }
  requestAnimationFrame(animateOff);

function _endShuffleForPick() {
  _shuffleGatherActive = false;
  _sandboxPlaybackActive = false; // stop any recording playback
  _shufflePhysicsPointer.active = false;

  // Don't cleanup hands here — let _runPickPhase do the gather animation with hands

  // Remove shuffle UI only
  var btnBar = document.getElementById('shuffleBtnBar');
  if (btnBar) btnBar.remove();
  var hint = document.getElementById('shuffleHint');
  if (hint) hint.remove();
  var ring = document.getElementById('shuffleAreaRing');
  if (ring) ring.remove();
  var settingsPanel = document.getElementById('shuffleSettingsPanel');
  if (settingsPanel) settingsPanel.remove();

  // Resolve the promise to continue to pick phase — physics keeps running
  if (_shufflePhysicsResolve) {
    var resolve = _shufflePhysicsResolve;
    _shufflePhysicsResolve = null;
    resolve();
  }
}

// Full teardown — stops physics, removes everything
function _endShufflePhysics() {
  _shufflePhysicsActive = false;
  _shuffleGatherActive = false;
  if (_shufflePhysicsRAF) {
    cancelAnimationFrame(_shufflePhysicsRAF);
    _shufflePhysicsRAF = null;
  }

  // Snapshot final body positions before destroying physics
  var finalPositions = [];
  for (var i = 0; i < _shufflePhysicsBodies.length; i++) {
    var b = _shufflePhysicsBodies[i];
    finalPositions.push({ x: b.position.x, y: b.position.y, angle: b.angle });
  }

  // Clean up physics
  if (_shufflePhysicsEngine) {
    Matter.World.clear(_shufflePhysicsEngine.world);
    Matter.Engine.clear(_shufflePhysicsEngine);
    _shufflePhysicsEngine = null;
  }
  _shufflePhysicsBodies = [];
}

async function _runPickPhase() {
  const localSeat = getLocalSeat();
  const playerCount = session.game.player_count;
  const handSize = session.game.hand_size;
  const SP = SHUFFLE_PHYSICS;
  const pool = _shufflePickPool; // { sprite, tile, data, picked }

  // All tiles should be face-down from the shuffle
  for (var p = 0; p < pool.length; p++) {
    pool[p].sprite.setFaceUp(false);
  }

  // Reset sprites arrays — will be rebuilt as tiles are picked
  for (var s = 0; s < playerCount; s++) sprites[s] = [];

  // ── Keep physics engine running for bumping ──
  // The shuffle physics is still active — _shufflePhysicsBodies has all tile bodies
  // Just remove shuffle UI (buttons, hint, ring) but keep overlay and physics loop
  var btnBar = document.getElementById('shuffleBtnBar');
  if (btnBar) btnBar.remove();
  var shuffleHint = document.getElementById('shuffleHint');
  if (shuffleHint) shuffleHint.remove();
  var ring = document.getElementById('shuffleAreaRing');
  if (ring) ring.remove();
  var settingsPanel = document.getElementById('shuffleSettingsPanel');
  if (settingsPanel) settingsPanel.remove();
  // Gather tiles into center circle before pick phase — hands pull inward
  _shufflePhysicsPointer.active = false;
  _shuffleGatherActive = true;
  _shuffleGatherStartTime = performance.now();
  var gatherR = getRect().height * SP.areaRadius * SP.centerCircleRadius;
  _shuffleAreaCenter.r = gatherR;

  // Switch hands to "gather mode" — positioned outside perimeter, pulling in
  var _gatherHandMode = true;
  var ac = _shuffleAreaCenter;

  // Override hand drawing for gather phase
  _lastShuffleHandPositions = [
    { x: ac.x - gatherR * 1.4, y: ac.y },
    { x: ac.x + gatherR * 1.4, y: ac.y }
  ];

  // Wait for tiles to gather into the center circle
  await new Promise(function(resolve) {
    var gatherStart = performance.now();
    var gatherCheck = setInterval(function() {
      var elapsed = performance.now() - gatherStart;

      // Animate hands inward during gather
      var t = Math.min(1, elapsed / (2000 / SPEED_MULTIPLIER));
      var ease = t * t;
      var startR = gatherR * 1.4;
      var endR = gatherR * 0.6;
      var currentR = startR - ease * (startR - endR);
      _lastShuffleHandPositions = [
        { x: ac.x - currentR, y: ac.y },
        { x: ac.x + currentR, y: ac.y }
      ];

      // Check if tiles are mostly inside center circle, or timeout after 2s
      if (elapsed > 2000 / SPEED_MULTIPLIER) {
        clearInterval(gatherCheck);
        // Now cleanup hands
        _cleanupShuffleHands();
        resolve();
      } else {
        var allInside = true;
        var cr2 = _shuffleAreaCenter.r * 0.9;
        for (var bi = 0; bi < _shufflePhysicsBodies.length; bi++) {
          var b = _shufflePhysicsBodies[bi];
          var bdx = b.position.x - _shuffleAreaCenter.x, bdy = b.position.y - _shuffleAreaCenter.y;
          if (Math.sqrt(bdx * bdx + bdy * bdy) > cr2) { allInside = false; break; }
        }
        if (allInside) { clearInterval(gatherCheck); resolve(); }
      }
    }, 100);
  });
  _shuffleGatherActive = false;
  // Keep center circle boundary active so unpicked tiles gravitate back in
  // _shuffleAreaCenter.r stays set to the center circle radius

  // Seat colors for AI pick ghosts and pile labels
  var AI_SEAT_COLORS = ['rgba(239,68,68,', 'rgba(59,130,246,', 'rgba(34,197,94,', 'rgba(234,179,8,', 'rgba(168,85,247,', 'rgba(236,72,153,'];

  // Remove old overlay and create a fresh one for pick phase
  var tableEl = document.getElementById('tableMain');
  var oldOverlay = document.getElementById('shufflePhysicsOverlay');
  if (oldOverlay) oldOverlay.remove();
  var oldPickOverlay = document.getElementById('pickPhaseOverlay');
  if (oldPickOverlay) oldPickOverlay.remove();

  var overlay = document.createElement('div');
  overlay.id = 'pickPhaseOverlay';
  overlay.style.cssText = 'position:absolute;inset:0;z-index:600;cursor:pointer;touch-action:none;';
  tableEl.appendChild(overlay);
  console.log('[Pick] Overlay created, z-index:600, bodies:', _shufflePhysicsBodies.length, 'pool:', pool.length);

  // Hint text
  var hint = document.createElement('div');
  hint.id = 'pickHint';
  hint.style.cssText = 'position:absolute;top:5%;left:50%;transform:translateX(-50%);z-index:510;background:rgba(0,0,0,0.7);color:rgba(255,255,255,0.95);padding:8px 20px;border-radius:20px;font-size:14px;font-weight:700;font-family:system-ui,sans-serif;pointer-events:none;transition:opacity 0.4s;';
  hint.textContent = 'Slide your ' + handSize + ' dominoes to your hand';
  tableEl.appendChild(hint);

  // Counter
  var counter = document.createElement('div');
  counter.id = 'pickCounter';
  counter.style.cssText = 'position:absolute;top:10%;left:50%;transform:translateX(-50%);z-index:510;background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.8);padding:4px 14px;border-radius:14px;font-size:12px;font-weight:600;font-family:system-ui,sans-serif;pointer-events:none;';
  counter.textContent = '0 / ' + handSize;
  tableEl.appendChild(counter);

  // Speed-up button — bottom-left, makes all AI grab remaining tiles at once
  var _pickSpeedUp = false;
  var speedBtn = document.createElement('button');
  speedBtn.id = 'pickSpeedBtn';
  speedBtn.textContent = '\u23e9';
  speedBtn.style.cssText = 'position:absolute;bottom:8px;left:8px;z-index:610;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.7);font-size:20px;cursor:pointer;line-height:40px;text-align:center;padding:0;';
  speedBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    _pickSpeedUp = true;
    speedBtn.style.background = 'rgba(34,197,94,0.5)';
    speedBtn.style.color = '#fff';
  });
  tableEl.appendChild(speedBtn);

  // Gear button to toggle pile adjustment menu
  var pileGearBtn = document.createElement('button');
  pileGearBtn.id = 'pileGearBtn';
  pileGearBtn.textContent = '\u2699';
  pileGearBtn.style.cssText = 'position:absolute;bottom:8px;left:56px;z-index:610;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.7);font-size:20px;cursor:pointer;line-height:40px;text-align:center;padding:0;';
  pileGearBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var panel = document.getElementById('pileSettingsPanel');
    if (panel) {
      var show = panel.style.display === 'none';
      panel.style.display = show ? 'block' : 'none';
      // Also toggle pile circles
      SP.showPileCircles = show;
      if (show) { _drawPileCircles(); } else { _removePileCircles(); }
    }
  });
  tableEl.appendChild(pileGearBtn);

  // Pile position tuning panel — semi-transparent, bottom-left, scrollable
  var pilePanel = document.createElement('div');
  pilePanel.id = 'pileSettingsPanel';
  pilePanel.style.cssText = 'position:absolute;bottom:6px;left:6px;z-index:610;background:rgba(0,0,0,0.15);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;font-family:system-ui,sans-serif;color:rgba(255,255,255,0.85);font-size:11px;pointer-events:auto;min-width:210px;max-height:70vh;overflow-y:auto;display:none;';

  function _pileSlider(container, label, initVal, min, max, step, decimals, onChange) {
    var row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;';
    var top = document.createElement('div');
    top.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:2px;';
    var lbl = document.createElement('span');
    lbl.style.cssText = 'color:rgba(255,255,255,0.6);font-size:10px;';
    lbl.textContent = label;
    var val = document.createElement('span');
    val.style.cssText = 'color:rgba(80,210,110,0.95);font-size:10px;font-weight:bold;min-width:36px;text-align:right;';
    val.textContent = Number(initVal).toFixed(decimals);
    top.appendChild(lbl); top.appendChild(val);
    var sl = document.createElement('input');
    sl.type = 'range'; sl.min = min; sl.max = max; sl.step = step; sl.value = initVal;
    sl.style.cssText = 'width:100%;-webkit-appearance:none;height:3px;background:rgba(255,255,255,0.2);border-radius:2px;outline:none;cursor:pointer;';
    sl.addEventListener('input', function() {
      var v = parseFloat(sl.value);
      val.textContent = v.toFixed(decimals);
      onChange(v);
      _updatePileCirclesLive();
    });
    row.appendChild(top); row.appendChild(sl);
    container.appendChild(row);
    return sl;
  }

  // Section helper
  function _pileSection(label, color) {
    var sec = document.createElement('div');
    sec.style.cssText = 'color:' + (color || 'rgba(255,255,255,0.4)') + ';font-size:8px;letter-spacing:0.14em;text-transform:uppercase;margin:8px 0 4px;font-weight:700;';
    sec.textContent = label;
    pilePanel.appendChild(sec);
  }

  // Title + close
  var pileTitle = document.createElement('div');
  pileTitle.style.cssText = 'font-size:10px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;';
  pileTitle.innerHTML = 'Pile Positions <span id="pilePanelClose" style="cursor:pointer;font-size:14px;color:rgba(255,255,255,0.4);line-height:1;">\u2715</span>';
  pilePanel.appendChild(pileTitle);

  // ── Global sliders ──
  _pileSection('Center Circle');
  _pileSlider(pilePanel, 'Center Size', SP.centerCircleRadius, 0.2, 1.2, 0.05, 2, function(v) { SP.centerCircleRadius = v; });
  _pileSlider(pilePanel, 'Center X', SP.centerXN, 0.1, 0.9, 0.005, 3, function(v) { SP.centerXN = v; });
  _pileSlider(pilePanel, 'Center Y', SP.centerYN, 0.1, 0.9, 0.005, 3, function(v) { SP.centerYN = v; });

  _pileSection('All Piles');
  _pileSlider(pilePanel, 'Base Distance', SP.pileDist, 0.2, 3.0, 0.05, 2, function(v) {
    SP.pileDist = v;
    // Reset per-seat overrides to follow global
    for (var s = 0; s < playerCount; s++) {
      if (!SP.pileSeatDist[s] || !_seatSliders[s]) continue;
      // Only reset seats that haven't been individually adjusted
    }
  });
  _pileSlider(pilePanel, 'Pile Size', SP.pileRadius, 0.03, 0.25, 0.005, 3, function(v) { SP.pileRadius = v; });
  _pileSlider(pilePanel, 'Anim Speed', SP.pickAnimSpeed, 0.1, 2.0, 0.05, 2, function(v) { SP.pickAnimSpeed = v; });

  // ── Per-seat sliders ──
  _pileSection('Individual Piles');
  var _seatSliders = {};
  if (!SP.pileSeatDist || typeof SP.pileSeatDist !== 'object') SP.pileSeatDist = {};
  if (!SP.pileSeatYOff || typeof SP.pileSeatYOff !== 'object') SP.pileSeatYOff = {};

  for (var ps = 0; ps < playerCount; ps++) {
    var isLocal = (ps === localSeat);
    var seatLabel = isLocal ? 'YOU' : ('P' + seatToPlayer(ps));
    var seatColor = isLocal ? 'rgba(34,197,94,' : AI_SEAT_COLORS[ps % AI_SEAT_COLORS.length];
    var initDist = (SP.pileSeatDist[ps] !== undefined) ? SP.pileSeatDist[ps] : SP.pileDist;
    var initYOff = (SP.pileSeatYOff[ps] !== undefined) ? SP.pileSeatYOff[ps] : 0;

    // Colored label
    var seatHdr = document.createElement('div');
    seatHdr.style.cssText = 'color:' + seatColor + '0.8);font-size:9px;font-weight:700;margin-top:4px;';
    seatHdr.textContent = seatLabel;
    pilePanel.appendChild(seatHdr);

    (function(seat, initD, initY) {
      _seatSliders[seat] = _pileSlider(pilePanel, 'Distance', initD, 0.2, 3.0, 0.05, 2, function(v) {
        SP.pileSeatDist[seat] = v;
      });
      _pileSlider(pilePanel, 'Y Offset', initY, -0.25, 0.25, 0.005, 3, function(v) {
        SP.pileSeatYOff[seat] = v;
      });
    })(ps, initDist, initYOff);
  }

  // Export button
  var exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export Settings';
  exportBtn.style.cssText = 'margin-top:10px;width:100%;padding:6px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);font-size:10px;cursor:pointer;';
  exportBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    var out = {
      centerCircleRadius: SP.centerCircleRadius,
      centerXN: SP.centerXN,
      centerYN: SP.centerYN,
      pileDist: SP.pileDist,
      pileRadius: SP.pileRadius,
      pileSeatDist: JSON.parse(JSON.stringify(SP.pileSeatDist)),
      pileSeatYOff: JSON.parse(JSON.stringify(SP.pileSeatYOff)),
      pickAnimSpeed: SP.pickAnimSpeed
    };
    var json = JSON.stringify(out, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function() {
        exportBtn.textContent = 'Copied!';
        setTimeout(function() { exportBtn.textContent = 'Export Settings'; }, 1500);
      });
    } else {
      prompt('Copy pile settings:', json);
    }
  });
  pilePanel.appendChild(exportBtn);

  tableEl.appendChild(pilePanel);

  // Close button
  setTimeout(function() {
    var closeEl = document.getElementById('pilePanelClose');
    if (closeEl) closeEl.addEventListener('click', function() { pilePanel.style.display = 'none'; });
  }, 50);

  // Live-update circles from sliders
  function _updatePileCirclesLive() {
    var rect2 = getRect();
    var W2 = rect2.width, H2 = rect2.height;
    var pr = Math.min(W2, H2) * SP.pileRadius;
    var cr = H2 * SP.areaRadius * SP.centerCircleRadius;
    var ccx = W2 * SP.centerXN, ccy = H2 * SP.centerYN;
    centerCx = ccx; centerCy = ccy;
    pileRadius = pr; centerRadius = cr;
    _pickPileRadius = pr; // sync global for physics loop
    var cc = document.getElementById('pickCenterCircle');
    if (cc) {
      cc.style.width = (cr * 2) + 'px'; cc.style.height = (cr * 2) + 'px';
      cc.style.left = (ccx - cr) + 'px'; cc.style.top = (ccy - cr) + 'px';
    }
    // Recompute each pile position from center circle edge
    for (var s = 0; s < playerCount; s++) {
      _pilePositions[s] = _computePilePosition(s);
    }
    var circles = document.querySelectorAll('.pickPileCircle');
    for (var ci = 0; ci < circles.length; ci++) {
      var pc = circles[ci];
      var s = parseInt(pc.dataset.seat);
      var pos = _pilePositions[s];
      if (pos) {
        pc.style.width = (pr * 2) + 'px'; pc.style.height = (pr * 2) + 'px';
        pc.style.left = (pos.x - pr) + 'px'; pc.style.top = (pos.y - pr) + 'px';
      }
    }
  }

  // Map pool entries to physics bodies
  for (var pi = 0; pi < pool.length; pi++) {
    pool[pi]._bodyIdx = _shufflePhysicsRealSprites.indexOf(pool[pi].sprite);
    pool[pi]._body = (pool[pi]._bodyIdx >= 0) ? _shufflePhysicsBodies[pool[pi]._bodyIdx] : null;
  }

  // Hands being built — array of tiles per seat
  var pickedHands = [];
  for (var s2 = 0; s2 < playerCount; s2++) pickedHands.push([]);

  // Get hand center position for a seat
  function getSeatHandCenter(seat) {
    var playerNum = seatToPlayer(seat);
    var sumX = 0, sumY = 0, count = 0;
    for (var si = 0; si < handSize; si++) {
      var hp = getHandPosition(playerNum, si);
      if (hp) { sumX += hp.x + 28; sumY += hp.y + 56; count++; }
    }
    return count > 0 ? { x: sumX / count, y: sumY / count } : { x: getRect().width / 2, y: getRect().height / 2 };
  }

  // ── Containment Circles (pile zones) ──
  var rect = getRect();
  var W = rect.width, H = rect.height;
  var centerCx = W * SP.centerXN, centerCy = H * SP.centerYN;
  var pileRadius = Math.min(W, H) * SP.pileRadius;
  _pickPileRadius = pileRadius;
  var centerRadius = H * SP.areaRadius * SP.centerCircleRadius;

  // Compute pile positions — each seat gets a circle near their edge
  var _pilePositions = {}; // seat -> { x, y }
  var _pileDivs = {}; // seat -> DOM element
  var _pileTiles = {}; // seat -> [entry, entry, ...]

  function _computePilePosition(seat) {
    // Evenly spaced around center circle — seat 0 at bottom (6 o'clock), then clockwise
    var angleStart = Math.PI / 2; // 6 o'clock = 90° in standard coords (positive Y = down)
    var angleStep = (2 * Math.PI) / playerCount;
    var angle = angleStart + seat * angleStep;
    var nx = Math.cos(angle), ny = Math.sin(angle);
    // Per-seat distance (or global default)
    var seatDist = (SP.pileSeatDist && SP.pileSeatDist[seat] !== undefined) ? SP.pileSeatDist[seat] : SP.pileDist;
    // Place pile outward from center circle edge
    var offset = centerRadius + seatDist * centerRadius;
    var px = centerCx + nx * offset;
    var py = centerCy + ny * offset;
    // Per-seat Y offset (fraction of H)
    var yOff = (SP.pileSeatYOff && SP.pileSeatYOff[seat] !== undefined) ? SP.pileSeatYOff[seat] : 0;
    py += H * yOff;
    return { x: px, y: py };
  }
}
}
