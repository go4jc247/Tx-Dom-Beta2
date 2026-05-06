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

var _pickPilePositions = null;
var _pickPileRadius = 0;

// ═══ Hand rendering code (baked from v6 sandbox) ═══
var SHUFFLE_LEFT_HAND = new Path2D("M 559 792 L 562 792 L 580 782 L 605 766 L 637 742 L 642 736 L 644 736 L 655 725 L 655 723 L 661 718 L 661 716 L 669 709 L 679 696 L 717 659 L 729 642 L 729 640 L 742 628 L 748 624 L 755 616 L 758 615 L 761 611 L 763 605 L 763 598 L 760 595 L 758 590 L 752 583 L 743 580 L 738 580 L 737 578 L 732 578 L 731 580 L 723 580 L 710 584 L 695 591 L 679 602 L 676 605 L 676 610 L 675 611 L 671 611 L 665 614 L 641 633 L 628 639 L 619 639 L 620 643 L 620 650 L 619 651 L 615 651 L 608 642 L 604 641 L 604 635 L 602 631 L 600 615 L 593 586 L 593 568 L 597 547 L 603 526 L 634 464 L 648 428 L 656 414 L 656 411 L 660 407 L 682 368 L 682 364 L 685 361 L 687 353 L 686 348 L 687 339 L 685 338 L 684 334 L 678 327 L 671 324 L 668 324 L 667 322 L 663 322 L 662 324 L 658 324 L 650 328 L 647 331 L 625 361 L 589 399 L 579 418 L 569 441 L 555 464 L 543 477 L 537 481 L 527 485 L 522 485 L 521 480 L 522 477 L 524 476 L 526 468 L 528 467 L 530 456 L 543 406 L 559 374 L 568 359 L 575 345 L 575 342 L 577 341 L 584 327 L 588 315 L 588 310 L 589 309 L 588 297 L 586 296 L 583 289 L 575 284 L 562 283 L 555 286 L 543 299 L 523 328 L 495 359 L 487 372 L 482 383 L 465 438 L 455 463 L 446 477 L 433 488 L 429 488 L 428 483 L 439 473 L 439 469 L 437 464 L 437 456 L 436 455 L 435 407 L 444 381 L 450 369 L 460 354 L 466 342 L 467 334 L 469 333 L 470 328 L 469 317 L 467 316 L 464 309 L 457 305 L 454 305 L 453 303 L 448 303 L 447 305 L 444 305 L 438 308 L 430 316 L 421 329 L 407 345 L 394 371 L 390 377 L 387 379 L 386 384 L 379 392 L 376 404 L 376 413 L 374 414 L 375 428 L 373 429 L 374 439 L 373 440 L 371 473 L 370 474 L 370 483 L 369 484 L 369 496 L 367 505 L 359 517 L 354 516 L 354 512 L 358 506 L 358 499 L 351 472 L 349 455 L 358 435 L 362 423 L 364 405 L 362 398 L 359 396 L 359 394 L 354 393 L 353 391 L 348 391 L 347 393 L 343 393 L 336 398 L 333 402 L 332 406 L 330 407 L 328 412 L 305 445 L 299 460 L 299 478 L 304 500 L 308 542 L 309 543 L 308 554 L 310 555 L 310 574 L 309 575 L 308 587 L 307 588 L 304 613 L 303 614 L 303 621 L 302 622 Q 345.5 835.5 559 792 Z");
var SHUFFLE_RIGHT_HAND = new Path2D("M 1286 669 L 1286 661 L 1285 660 L 1282 636 L 1280 631 L 1278 618 L 1259 548 L 1258 527 L 1259 526 L 1259 513 L 1260 512 L 1260 500 L 1261 499 L 1261 480 L 1262 479 L 1262 463 L 1261 462 L 1262 443 L 1260 442 L 1259 431 L 1256 419 L 1252 409 L 1250 399 L 1247 392 L 1247 386 L 1244 379 L 1237 374 L 1226 374 L 1221 376 L 1218 379 L 1218 381 L 1215 383 L 1213 388 L 1212 404 L 1213 405 L 1213 413 L 1216 428 L 1216 436 L 1213 448 L 1209 491 L 1207 497 L 1207 501 L 1213 507 L 1213 511 L 1208 512 L 1195 501 L 1188 489 L 1182 465 L 1172 411 L 1166 391 L 1161 381 L 1145 356 L 1134 333 L 1116 306 L 1116 303 L 1102 289 L 1091 287 L 1090 289 L 1085 290 L 1078 296 L 1078 300 L 1076 301 L 1076 313 L 1078 314 L 1078 321 L 1081 327 L 1084 338 L 1090 353 L 1099 370 L 1099 372 L 1101 376 L 1103 377 L 1103 381 L 1110 398 L 1111 417 L 1112 418 L 1112 435 L 1113 436 L 1114 450 L 1117 460 L 1121 466 L 1124 468 L 1125 471 L 1124 476 L 1120 476 L 1108 465 L 1098 446 L 1096 439 L 1093 434 L 1071 367 L 1063 356 L 1051 344 L 1029 318 L 1019 302 L 1016 294 L 1014 293 L 1007 283 L 1002 279 L 996 277 L 986 277 L 974 282 L 972 284 L 970 292 L 968 295 L 969 306 L 973 318 L 984 337 L 1011 392 L 1012 396 L 1015 398 L 1015 402 L 1020 412 L 1024 431 L 1032 456 L 1040 475 L 1047 483 L 1046 488 L 1041 488 L 1028 484 L 1012 474 L 987 446 L 971 422 L 949 400 L 947 400 L 933 385 L 912 354 L 905 348 L 900 346 L 889 346 L 881 349 L 878 352 L 876 352 L 874 359 L 872 360 L 871 369 L 873 379 L 879 395 L 905 443 L 954 524 L 957 526 L 957 529 L 976 557 L 981 567 L 984 588 L 987 599 L 987 605 L 988 606 L 988 616 L 987 617 L 987 624 L 984 639 L 981 649 L 977 657 L 973 657 L 972 654 L 969 654 L 961 658 L 956 658 L 954 652 L 950 651 L 930 640 L 920 636 L 918 634 L 906 630 L 905 629 L 905 624 L 884 607 L 862 596 L 847 592 L 835 592 L 822 597 L 815 604 L 813 616 L 815 620 L 824 629 L 845 645 L 845 647 L 854 658 L 859 669 L 865 677 L 867 677 L 869 680 L 871 680 L 873 683 L 889 693 L 899 701 L 943 748 L 973 770 L 991 785 L 995 786 L 997 789 L 1009 797 L 1012 797 L 1016 801 L 1034 810 L 1036 810 L 1056 821 L 1059 821 L 1061 824 L 1063 824 Q 1252.0 858.0 1286 669 Z");
var SH_LEFT_WC = { x: 430.5, y: 707.0 };
var SH_RIGHT_WC = { x: 1174.5, y: 746.5 };
var SH_HAND_SCALE_BASE = 0.78;
var SH_FOREARM_W_BASE = 45;
var SH_SHOULDER_DEPTH = 1.32;
var SH_SKIN_FILL = '#d4a574';
var SH_SKIN_SHADOW = 'rgba(0,0,0,0.25)';
var SH_SHADOW_OFFSET = 4;

function shGetScale(W) { return SH_HAND_SCALE_BASE * (W / 1200); }
function shGetForearmW(W) { return SH_FOREARM_W_BASE * (W / 1200); }

function shConstantSegment(c, from, to, width) {
  var dx = to.x - from.x, dy = to.y - from.y;
  var len = Math.max(1, Math.hypot(dx, dy));
  var nx = -dy / len, ny = dx / len;
  var hw = width / 2;
  c.beginPath();
  c.moveTo(from.x + nx * hw, from.y + ny * hw);
  c.lineTo(to.x + nx * hw, to.y + ny * hw);
  c.lineTo(to.x - nx * hw, to.y - ny * hw);
  c.lineTo(from.x - nx * hw, from.y - ny * hw);
  c.closePath();
  c.fill();
}

function shGetElbow(shoulder, wrist, bendDir) {
  var dx = wrist.x - shoulder.x, dy = wrist.y - shoulder.y;
  var dist = Math.max(1, Math.hypot(dx, dy));
  var mid = { x: (shoulder.x + wrist.x) / 2, y: (shoulder.y + wrist.y) / 2 };
  var nx = -dy / dist, ny = dx / dist;
  var elbowLift = Math.min(140, Math.max(18, dist * 0.22));
  return { x: mid.x + nx * elbowLift * bendDir, y: mid.y + ny * elbowLift * bendDir };
}

function shDrawHandParts(c, wx, wy, index, W, H) {
  // Just the hand shape, always vertical (pointing up), no arms
  var handPath = (index % 2 === 0) ? SHUFFLE_LEFT_HAND : SHUFFLE_RIGHT_HAND;
  var wc = (index % 2 === 0) ? SH_LEFT_WC : SH_RIGHT_WC;
  var sc = shGetScale(W);

  c.save();
  c.translate(wx, wy);
  c.scale(sc, sc);
  c.translate(-wc.x, -wc.y);
  c.fill(handPath);
  c.restore();
}

function shDrawHand(c, wx, wy, index, W, H) {
  c.save();
  c.fillStyle = SH_SKIN_SHADOW;
  c.save();
  c.translate(SH_SHADOW_OFFSET, SH_SHADOW_OFFSET);
  shDrawHandParts(c, wx, wy, index, W, H);
  c.restore();
  c.fillStyle = SH_SKIN_FILL;
  shDrawHandParts(c, wx, wy, index, W, H);
  c.restore();
}

// ═══ Physics shuffle state ═══
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
var _shuffleRecordData = [];  // array of { t, x, y, vx, vy, f? }
var _shuffleRecordStart = 0;
var _shuffleExportedRecordings = []; // in-memory backup of exported recordings
var _shuffleRecordInterval = null;

var _shuffleEditorActive = false;
var _shuffleEditorSavedTimeout = null; // saved auto-end timeout

function _createRecordUI() {
  var tableEl = document.getElementById('gameWrapper');
  if (!tableEl) return;

  var container = document.createElement('div');
  container.id = 'shuffleRecordUI';
  container.style.cssText = 'position:absolute;top:8px;right:8px;z-index:620;display:flex;gap:6px;align-items:center;';

  var btnStyle = 'padding:6px 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;';

  // EDIT button — enters shuffle editor mode
  var editBtn = document.createElement('button');
  editBtn.id = 'shuffleEditBtn';
  editBtn.textContent = 'EDIT';
  editBtn.style.cssText = btnStyle;
  editBtn.addEventListener('click', function() {
    _enterShuffleEditor();
  });
  container.appendChild(editBtn);

  // Count display
  var countEl = document.createElement('span');
  countEl.id = 'shuffleRecCount';
  countEl.style.cssText = 'color:rgba(255,255,255,0.5);font-size:10px;font-weight:600;font-family:system-ui,sans-serif;line-height:30px;';
  var existingCount = 0;
  try { var s = localStorage.getItem('txdom_userRecordings'); if (s) existingCount = JSON.parse(s).length; } catch(e) {}
  countEl.textContent = existingCount + ' saved';
  container.appendChild(countEl);

  tableEl.appendChild(container);
}

function _enterShuffleEditor() {
  _shuffleEditorActive = true;
  var tableEl = document.getElementById('gameWrapper');
  if (!tableEl) return;

  // Stop any active AI playback
  _sandboxPlaybackActive = false;
  _shufflePhysicsPointer.active = false;
  // Clear all playback touch pointers
  var tpKeys = Object.keys(_shuffleTouchPointers);
  for (var tk = 0; tk < tpKeys.length; tk++) {
    if (tpKeys[tk].indexOf('_pb') === 0) delete _shuffleTouchPointers[tpKeys[tk]];
  }
  // Remove playback ghosts
  var ghosts = document.querySelectorAll('.playbackGhost');
  for (var gi = 0; gi < ghosts.length; gi++) ghosts[gi].remove();

  // Gather tiles to center, then release
  _shuffleGatherActive = true;
  _shuffleGatherStartTime = performance.now();
  setTimeout(function() {
    _shuffleGatherActive = false;
    // Stop all tile movement
    for (var bi = 0; bi < _shufflePhysicsBodies.length; bi++) {
      var body = _shufflePhysicsBodies[bi];
      if (!body.isStatic) {
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
      }
    }
  }, 1500);

  // Replace the UI with editor controls
  var container = document.getElementById('shuffleRecordUI');
  if (!container) return;
  container.innerHTML = '';
  container.style.cssText = 'position:absolute;top:8px;right:8px;z-index:620;display:flex;flex-direction:column;gap:6px;align-items:flex-end;';

  var btnStyle = 'padding:6px 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.3);background:rgba(0,0,0,0.5);color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;';

  // Row 1: REC/STOP + PLAY + CLR
  var row1 = document.createElement('div');
  row1.style.cssText = 'display:flex;gap:6px;';

  var recBtn = document.createElement('button');
  recBtn.id = 'shuffleEdRecBtn';
  recBtn.textContent = 'REC';
  recBtn.style.cssText = btnStyle;
  recBtn.addEventListener('click', function() {
    if (_shuffleRecording) {
      _editorStopRecording();
    } else {
      _editorStartRecording();
    }
  });
  row1.appendChild(recBtn);

  var playBtn = document.createElement('button');
  playBtn.id = 'shuffleEdPlayBtn';
  playBtn.textContent = 'PLAY';
  playBtn.style.cssText = btnStyle;
  var _playIdx = 0;
  playBtn.addEventListener('click', function() {
    var recs = [];
    try { var s = localStorage.getItem('txdom_userRecordings'); if (s) recs = JSON.parse(s); } catch(e) {}
    if (recs.length === 0) return;
    _playIdx = _playIdx % recs.length;
    // Reset tiles to center first
    _editorResetTiles();
    // Play the recording
    setTimeout(function() {
      var ac = _shuffleAreaCenter;
      var ptr = _shufflePhysicsPointer;
      _playRecording(recs[_playIdx], ac.x, ac.y, ac.r, ptr);
      var statusEl = document.getElementById('shuffleEdStatus');
      if (statusEl) statusEl.textContent = 'Playing ' + (_playIdx + 1) + '/' + recs.length;
      _playIdx++;
    }, 500);
  });
  row1.appendChild(playBtn);

  var clearBtn = document.createElement('button');
  clearBtn.textContent = 'CLR';
  clearBtn.style.cssText = btnStyle;
  clearBtn.addEventListener('click', function() {
    try { localStorage.removeItem('txdom_userRecordings'); } catch(e) {}
    _shuffleExportedRecordings = [];
    var statusEl = document.getElementById('shuffleEdStatus');
    if (statusEl) statusEl.textContent = '0 saved';
    console.log('[Shuffle] Cleared all user recordings');
  });
  row1.appendChild(clearBtn);

  container.appendChild(row1);

  // Row 2: RESUME button
  var row2 = document.createElement('div');
  row2.style.cssText = 'display:flex;gap:6px;';

  var resumeBtn = document.createElement('button');
  resumeBtn.textContent = 'RESUME';
  resumeBtn.style.cssText = btnStyle + 'background:rgba(34,197,94,0.5);';
  resumeBtn.addEventListener('click', function() {
    _exitShuffleEditor();
  });
  row2.appendChild(resumeBtn);

  var statusEl = document.createElement('span');
  statusEl.id = 'shuffleEdStatus';
  statusEl.style.cssText = 'color:rgba(255,255,255,0.6);font-size:10px;font-weight:600;font-family:system-ui,sans-serif;line-height:30px;';
  var existingCount = 0;
  try { var s = localStorage.getItem('txdom_userRecordings'); if (s) existingCount = JSON.parse(s).length; } catch(e) {}
  statusEl.textContent = existingCount + ' saved — shuffle & record!';
  row2.appendChild(statusEl);

  container.appendChild(row2);

  // Show hint
  var hintEl = document.getElementById('shuffleHint');
  if (hintEl) hintEl.textContent = 'Shuffle Editor — mix tiles and record';
}

function _editorStartRecording() {
  // Reset tiles to center first
  _editorResetTiles();

  setTimeout(function() {
    _shuffleRecording = true;
    _shuffleRecordStart = performance.now();
    _shuffleRecordData = [];

    var recBtn = document.getElementById('shuffleEdRecBtn');
    if (recBtn) {
      recBtn.textContent = 'STOP';
      recBtn.style.background = 'rgba(220,38,38,0.6)';
      recBtn.style.color = '#fff';
    }
    var statusEl = document.getElementById('shuffleEdStatus');
    if (statusEl) statusEl.textContent = 'Recording...';

    // Sample touch data every 16ms
    _shuffleRecordInterval = setInterval(function() {
      if (!_shuffleRecording || !_shufflePhysicsActive) {
        clearInterval(_shuffleRecordInterval);
        return;
      }
      var ac = _shuffleAreaCenter;
      var t = Math.round(performance.now() - _shuffleRecordStart);
      // Record all active fingers
      var touchKeys = Object.keys(_shuffleTouchPointers);
      var recorded = false;
      for (var tk = 0; tk < touchKeys.length; tk++) {
        var key = touchKeys[tk];
        if (key.indexOf('_pb') === 0) continue;
        var tp = _shuffleTouchPointers[key];
        if (tp) {
          _shuffleRecordData.push({
            t: t,
            x: (tp.x - ac.x) / ac.r,
            y: (tp.y - ac.y) / ac.r,
            vx: tp.vx / ac.r,
            vy: tp.vy / ac.r,
            f: parseInt(key) || 0
          });
          recorded = true;
        }
      }
      // Also record mouse if active and no touch
      if (!recorded && _shufflePhysicsPointer.active) {
        var ptr = _shufflePhysicsPointer;
        _shuffleRecordData.push({
          t: t,
          x: (ptr.x - ac.x) / ac.r,
          y: (ptr.y - ac.y) / ac.r,
          vx: ptr.vx / ac.r,
          vy: ptr.vy / ac.r
        });
      }
    }, 16);
  }, 600);
}

function _editorStopRecording() {
  _shuffleRecording = false;
  clearInterval(_shuffleRecordInterval);

  var recBtn = document.getElementById('shuffleEdRecBtn');
  if (recBtn) {
    recBtn.textContent = 'REC';
    recBtn.style.background = 'rgba(0,0,0,0.5)';
    recBtn.style.color = 'rgba(255,255,255,0.8)';
  }

  // Save recording if it has enough data
  if (_shuffleRecordData.length > 10) {
    var recs = [];
    try { var s = localStorage.getItem('txdom_userRecordings'); if (s) recs = JSON.parse(s); } catch(e) {}
    recs.push({ points: _shuffleRecordData });
    _shuffleExportedRecordings.push({ points: _shuffleRecordData });
    try { localStorage.setItem('txdom_userRecordings', JSON.stringify(recs)); } catch(e) {}
    var statusEl = document.getElementById('shuffleEdStatus');
    if (statusEl) statusEl.textContent = recs.length + ' saved (' + _shuffleRecordData.length + ' pts)';
    console.log('[Shuffle] Saved recording: ' + _shuffleRecordData.length + ' points');
  } else {
    var statusEl = document.getElementById('shuffleEdStatus');
    if (statusEl) statusEl.textContent = 'Too short, not saved';
  }
  _shuffleRecordData = [];

  // Reset tiles back to center for next recording
  setTimeout(function() { _editorResetTiles(); }, 800);
}

function _editorResetTiles() {
  // Move all physics bodies back to center with random spread
  var ac = _shuffleAreaCenter;
  for (var bi = 0; bi < _shufflePhysicsBodies.length; bi++) {
    var body = _shufflePhysicsBodies[bi];
    if (body.isStatic) continue;
    var angle = Math.random() * Math.PI * 2;
    var dist = Math.random() * ac.r * 0.5;
    var tx = ac.x + Math.cos(angle) * dist;
    var ty = ac.y + Math.sin(angle) * dist;
    Matter.Body.setPosition(body, { x: tx, y: ty });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setAngle(body, Math.random() * Math.PI * 2);
  }
}

function _exitShuffleEditor() {
  _shuffleEditorActive = false;
  // Stop any recording in progress
  if (_shuffleRecording) {
    _shuffleRecording = false;
    clearInterval(_shuffleRecordInterval);
  }
  // Reset tiles to center
  _editorResetTiles();
  // Continue normal shuffle — end for pick
  setTimeout(function() {
    if (_shufflePhysicsActive && _shufflePhysicsResolve) {
      _endShuffleForPick();
    }
  }, 500);
}

function _removeRecordUI() {
  // Stop any active recording
  if (_shuffleRecording) {
    _shuffleRecording = false;
    clearInterval(_shuffleRecordInterval);
  }
  _shuffleEditorActive = false;
  var ui = document.getElementById('shuffleRecordUI');
  if (ui) ui.remove();
}

// Load user recordings from localStorage into the pool
(function() {
  try {
    var s = localStorage.getItem('txdom_userRecordings');
    if (s) {
      var recs = JSON.parse(s);
      if (Array.isArray(recs)) _shuffleExportedRecordings = recs;
      console.log('[Shuffle] Loaded ' + recs.length + ' user recordings from localStorage');
    }
  } catch(e) {}
})();
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
  var localSeat = getLocalSeat();
  var isLocalShuffler = (localSeat === session.dealer);
  var autoOn = false;
  try { autoOn = localStorage.getItem('txdom_autoSelectPick') === 'true'; } catch(e) {}

  if (isLocalShuffler && !autoOn) {
    // ── MANUAL SHUFFLE MODE ──
    // Player shuffles with their fingers. Must displace 80% of tiles + 5s minimum.
    return new Promise(function(resolve) {
      _shufflePhysicsResolve = resolve;
      _startShufflePhysics();
      _createRecordUI();

      // Track which tiles have been displaced from center
      var totalTiles = _shufflePhysicsBodies.length;
      var displacedSet = {};  // bodyId -> true once it leaves center
      var ac = _shuffleAreaCenter;
      var displacedThreshold = Math.floor(totalTiles * 0.8);
      var startTime = performance.now();
      var MIN_TIME = 5000;
      var MIN_FINGER_SPEED = 3; // pixels per frame minimum to count as mixing
      var shuffleValidated = false;

      // Show hint
      var hintEl = document.getElementById('shuffleHint');
      if (hintEl) hintEl.textContent = 'Your turn to shuffle!';

      // Create progress indicator
      var progEl = document.createElement('div');
      progEl.id = 'shuffleProgress';
      progEl.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);z-index:510;color:rgba(255,255,255,0.8);font-size:12px;font-weight:600;font-family:system-ui,sans-serif;text-align:center;pointer-events:none;';
      progEl.textContent = '0% mixed';
      var tableEl = document.getElementById('gameWrapper');
      if (tableEl) tableEl.appendChild(progEl);

      // Create Done button (hidden until validated)
      var doneBtn = document.createElement('button');
      doneBtn.id = 'shuffleDoneBtn';
      doneBtn.textContent = 'Done';
      doneBtn.style.cssText = 'position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:610;padding:10px 32px;border-radius:20px;border:1px solid rgba(255,255,255,0.4);background:rgba(59,130,246,0.6);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;display:none;';
      doneBtn.addEventListener('click', function() {
        clearInterval(checkTimer);
        if (progEl) progEl.remove();
        doneBtn.remove();
        _endShuffleForPick();
      });
      if (tableEl) tableEl.appendChild(doneBtn);

      // Check displacement every 200ms
      var checkTimer = setInterval(function() {
        if (!_shufflePhysicsActive) { clearInterval(checkTimer); return; }

        // Check finger speed — only count mixing if finger is moving fast enough
        var hasSpeed = false;
        var touchKeys = Object.keys(_shuffleTouchPointers);
        for (var tk = 0; tk < touchKeys.length; tk++) {
          var tp = _shuffleTouchPointers[touchKeys[tk]];
          if (tp) {
            var spd = Math.sqrt(tp.vx * tp.vx + tp.vy * tp.vy);
            if (spd >= MIN_FINGER_SPEED) hasSpeed = true;
          }
        }
        // Also check mouse pointer
        var ptr = _shufflePhysicsPointer;
        if (ptr.active) {
          var mspd = Math.sqrt(ptr.vx * ptr.vx + ptr.vy * ptr.vy);
          if (mspd >= MIN_FINGER_SPEED) hasSpeed = true;
        }

        // Track tiles that have left the center area
        var centerR = ac.r * 0.5; // "center" = inner 50% of area
        for (var bi = 0; bi < _shufflePhysicsBodies.length; bi++) {
          var body = _shufflePhysicsBodies[bi];
          if (body.isStatic) continue;
          var dx = body.position.x - ac.x;
          var dy = body.position.y - ac.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > centerR) {
            displacedSet[body.id] = true;
          }
        }

        var displacedCount = Object.keys(displacedSet).length;
        var pct = Math.min(100, Math.round((displacedCount / displacedThreshold) * 100));
        var elapsed = performance.now() - startTime;

        if (progEl) {
          progEl.textContent = pct + '% mixed' + (elapsed < MIN_TIME ? ' (' + Math.ceil((MIN_TIME - elapsed) / 1000) + 's)' : '');
        }

        // Validate: 80% displaced AND 5 seconds elapsed
        if (displacedCount >= displacedThreshold && elapsed >= MIN_TIME && !shuffleValidated) {
          shuffleValidated = true;
          doneBtn.style.display = 'block';
          if (progEl) progEl.textContent = 'Ready! Tap Done';
          if (hintEl) hintEl.textContent = '';
        }
      }, 200);

      // Safety timeout — auto-end after 30 seconds (unless in editor mode)
      setTimeout(function() {
        if (_shufflePhysicsActive && _shufflePhysicsResolve && !_shuffleEditorActive) {
          clearInterval(checkTimer);
          if (progEl) progEl.remove();
          doneBtn.remove();
          _endShuffleForPick();
        }
      }, 30000);
    });
  }

  // ── AUTO SHUFFLE (AI mixes) ──
  return new Promise(function(resolve) {
    _shufflePhysicsResolve = resolve;
    _startShufflePhysics();
    _createRecordUI();

    _autoMixAI();

    // Auto-end shuffle after 4 seconds (unless in editor mode)
    setTimeout(function() {
      if (_shufflePhysicsActive && _shufflePhysicsResolve && !_shuffleEditorActive) {
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
  }
  // No fallback — if no recordings, timeout will end the shuffle
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
}

function _endShuffleForPick() {
  _shuffleGatherActive = false;
  _sandboxPlaybackActive = false; // stop any recording playback
  _shufflePhysicsPointer.active = false;
  _removeRecordUI();

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

  // Speed-up button — persistent via localStorage
  var _pickSpeedUp = false;
  try { _pickSpeedUp = localStorage.getItem('txdom_pickSpeedUp') === 'true'; } catch(e) {}
  var speedBtn = document.createElement('button');
  speedBtn.id = 'pickSpeedBtn';
  speedBtn.textContent = '\u23e9';
  var _speedBtnActive = _pickSpeedUp;
  speedBtn.style.cssText = 'position:absolute;bottom:8px;left:8px;z-index:610;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.3);background:' + (_speedBtnActive ? 'rgba(34,197,94,0.5)' : 'rgba(0,0,0,0.5)') + ';color:' + (_speedBtnActive ? '#fff' : 'rgba(255,255,255,0.7)') + ';font-size:20px;cursor:pointer;line-height:40px;text-align:center;padding:0;';
  speedBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    _pickSpeedUp = !_pickSpeedUp;
    try { localStorage.setItem('txdom_pickSpeedUp', _pickSpeedUp ? 'true' : 'false'); } catch(e) {}
    speedBtn.style.background = _pickSpeedUp ? 'rgba(34,197,94,0.5)' : 'rgba(0,0,0,0.5)';
    speedBtn.style.color = _pickSpeedUp ? '#fff' : 'rgba(255,255,255,0.7)';
  });
  tableEl.appendChild(speedBtn);

  // Auto-select button — persistent via localStorage
  var _autoSelectPick = false;
  try { _autoSelectPick = localStorage.getItem('txdom_autoSelectPick') === 'true'; } catch(e) {}
  var autoSelBtn = document.createElement('button');
  autoSelBtn.id = 'pickAutoSelBtn';
  autoSelBtn.textContent = 'AUTO';
  var _autoSelActive = _autoSelectPick;
  autoSelBtn.style.cssText = 'position:absolute;bottom:8px;left:56px;z-index:610;height:40px;padding:0 12px;border-radius:20px;border:1px solid rgba(255,255,255,0.3);background:' + (_autoSelActive ? 'rgba(59,130,246,0.5)' : 'rgba(0,0,0,0.5)') + ';color:' + (_autoSelActive ? '#fff' : 'rgba(255,255,255,0.7)') + ';font-size:11px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;';
  autoSelBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    _autoSelectPick = !_autoSelectPick;
    try { localStorage.setItem('txdom_autoSelectPick', _autoSelectPick ? 'true' : 'false'); } catch(e) {}
    autoSelBtn.style.background = _autoSelectPick ? 'rgba(59,130,246,0.5)' : 'rgba(0,0,0,0.5)';
    autoSelBtn.style.color = _autoSelectPick ? '#fff' : 'rgba(255,255,255,0.7)';
  });
  tableEl.appendChild(autoSelBtn);

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
  _pickPileHandCenters = {};
  for (var seat = 0; seat < playerCount; seat++) {
    _pickPileHandCenters[seat] = getSeatHandCenter(seat);
    _pilePositions[seat] = _computePilePosition(seat);
    _pileTiles[seat] = [];
  }
  _pickPilePositions = _pilePositions; // share with physics loop

  // Draw visible containment circles
  function _drawPileCircles() {
    if (!SP.showPileCircles) return;
    // Center circle (undrawn tiles)
    var centerDiv = document.createElement('div');
    centerDiv.id = 'pickCenterCircle';
    centerDiv.style.cssText = 'position:absolute;border:2px dashed rgba(255,255,255,0.3);border-radius:50%;pointer-events:none;z-index:90;'
      + 'width:' + (centerRadius * 2) + 'px;height:' + (centerRadius * 2) + 'px;'
      + 'left:' + (centerCx - centerRadius) + 'px;top:' + (centerCy - centerRadius) + 'px;';
    centerDiv.innerHTML = '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.2);font-size:10px;font-weight:700;font-family:system-ui,sans-serif;">DRAW</span>';
    tableEl.appendChild(centerDiv);

    // Per-seat pile circles
    for (var seat = 0; seat < playerCount; seat++) {
      var pos = _pilePositions[seat];
      var isLocal = (seat === localSeat);
      var team = (GAME_MODE === 'MOON') ? seat : (seat % 2);
      var dealerTeamNum = (GAME_MODE === 'MOON') ? dealerSeat : (dealerSeat % 2);
      var color = isLocal ? 'rgba(34,197,94,' : (team !== dealerTeamNum ? 'rgba(239,68,68,' : 'rgba(59,130,246,');
      if (seat === dealerSeat) color = 'rgba(168,85,247,';

      var div = document.createElement('div');
      div.className = 'pickPileCircle';
      div.dataset.seat = seat;
      div.style.cssText = 'position:absolute;border:2px dashed ' + color + '0.4);border-radius:50%;pointer-events:none;z-index:90;'
        + 'background:' + color + '0.05);'
        + 'width:' + (pileRadius * 2) + 'px;height:' + (pileRadius * 2) + 'px;'
        + 'left:' + (pos.x - pileRadius) + 'px;top:' + (pos.y - pileRadius) + 'px;';

      var label = isLocal ? 'YOU' : ('P' + seatToPlayer(seat));
      var playerName = isLocal ? 'YOU' : (session.game.player_names ? session.game.player_names[seat] || ('Player ' + seatToPlayer(seat)) : ('Player ' + seatToPlayer(seat)));
      div.innerHTML = '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:' + color + '0.25);font-size:22px;font-weight:900;font-family:system-ui,sans-serif;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">' + playerName + '</span>';
      tableEl.appendChild(div);
      _pileDivs[seat] = div;
    }
  }

  function _removePileCircles() {
    var cc = document.getElementById('pickCenterCircle');
    if (cc) cc.remove();
    var circles = document.querySelectorAll('.pickPileCircle');
    for (var i = 0; i < circles.length; i++) circles[i].remove();
  }

  // Snap a tile to a seat's pile circle (not final hand position yet)
  function snapTileToPile(entry, seat) {
    var pos = _pilePositions[seat];
    _pileTiles[seat].push(entry);

    // Tag the body with its pile seat — physics loop will contain it and pull it in
    if (entry._body) {
      entry._body._pileSeat = seat;
      // High friction, no bounce — tiles block each other but don't bounce around
      entry._body.friction = 0.8;
      entry._body.frictionAir = 0.08;
      entry._body.restitution = 0;
      // Strong push toward pile center — arrives in ~1-2 seconds
      var dx = pos.x - entry._body.position.x;
      var dy = pos.y - entry._body.position.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) {
        var speed = Math.min(d * 0.4, 20);
        Matter.Body.setVelocity(entry._body, { x: dx / d * speed, y: dy / d * speed });
      }
      Matter.Body.setAngularVelocity(entry._body, 0);
    }
  }

  // After all picking, move tiles from piles to final hand positions — cascaded 200ms apart
  async function _arrangePilesToHands() {
    hint.textContent = 'Arranging hands...';
    var allPromises = [];
    for (var seat = 0; seat < playerCount; seat++) {
      var tiles = _pileTiles[seat];
      var playerNum = seatToPlayer(seat);
      var isLocal = (seat === localSeat);
      var seatDelay = seat * (200 / (SPEED_MULTIPLIER * SP.pickAnimSpeed));
      for (var si = 0; si < tiles.length; si++) {
        var entry = tiles[si];
        var targetPos = getHandPosition(playerNum, si);
        if (!targetPos) continue;

        var data = { sprite: entry.sprite, tile: entry.tile, originalSlot: si };
        sprites[seat][si] = data;
        pickedHands[seat].push(entry.tile);

        // Animate from pile to hand — cascaded start, only local player gets full 3D
        var faceUp = isLocal;
        (function(sp, tp, fu, delay) {
          var speed = 600 / (SPEED_MULTIPLIER * SP.pickAnimSpeed);
          allPromises.push(new Promise(function(r) { setTimeout(r, delay); }).then(function() {
            return animateSprite(sp, {
              x: tp.x, y: tp.y, s: tp.s, rz: tp.rz, ry: fu ? 180 : 0
            }, speed).then(function() {
              // Remove simplified rendering — all tiles need full render for gameplay
              sp.classList.remove('shuffleSimple');
            });
          }));
        })(entry.sprite, targetPos, faceUp, seatDelay);
      }
    }
    await Promise.all(allPromises);

    // Attach gameplay handlers for local player's tiles
    for (var si = 0; si < sprites[localSeat].length; si++) {
      var sd = sprites[localSeat][si];
      if (sd && sd.sprite) {
        (function(sp) {
          sp.addEventListener('click', function() { handlePlayer1Click(sp); });
          sp.addEventListener('touchstart', function(ev) {
            ev.preventDefault(); ev.stopPropagation();
            handlePlayer1Click(sp);
          }, { passive: false });
        })(sd.sprite);
      }
    }
  }

  _drawPileCircles();

  // Snap a tile to its final hand position (make static, remove from physics flow)
  function snapTileToHand(entry, seat, slotIdx, faceUp) {
    entry.picked = true;
    var playerNum = seatToPlayer(seat);
    var targetPos = getHandPosition(playerNum, slotIdx);
    if (!targetPos) return;

    // Make physics body static at target
    if (entry._body) {
      Matter.Body.setStatic(entry._body, true);
      Matter.Body.setPosition(entry._body, { x: targetPos.x + 28, y: targetPos.y + 56 });
      Matter.Body.setAngle(entry._body, (targetPos.rz || 0) * Math.PI / 180);
      Matter.Body.setVelocity(entry._body, { x: 0, y: 0 });
    }

    entry.sprite.classList.remove('shuffleSimple');
    entry.sprite.setPose({
      x: targetPos.x, y: targetPos.y,
      s: targetPos.s, rz: targetPos.rz,
      ry: faceUp ? 180 : 0
    });
    bringToFront(entry.sprite);

    var data = { sprite: entry.sprite, tile: entry.tile, originalSlot: slotIdx };
    sprites[seat][slotIdx] = data;
    pickedHands[seat].push(entry.tile);
  }

  // Find pool entry for a physics body
  function poolEntryForBody(body) {
    for (var i = 0; i < pool.length; i++) {
      if (pool[i]._body === body && !pool[i].picked) return pool[i];
    }
    return null;
  }

  // Find closest unpicked body to a point
  function findUnpickedBodyAt(px, py, maxDist) {
    var best = null, bestD2 = maxDist * maxDist;
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].picked || !pool[i]._body) continue;
      var b = pool[i]._body;
      var dx = b.position.x - px, dy = b.position.y - py;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = b; }
    }
    return best;
  }

  // Find a tile in the local player's pile (for rearranging)
  function findPileBodyAt(px, py, maxDist) {
    var best = null, bestD2 = maxDist * maxDist;
    var tiles = _pileTiles[localSeat] || [];
    for (var i = 0; i < tiles.length; i++) {
      var b = tiles[i]._body;
      if (!b) continue;
      var dx = b.position.x - px, dy = b.position.y - py;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD2) { bestD2 = d2; best = b; }
    }
    return best;
  }

  // Create a physics constraint to drag a body
  function grabBody(body, px, py) {
    var c = Matter.Constraint.create({
      pointA: { x: px, y: py },
      bodyB: body,
      pointB: { x: px - body.position.x, y: py - body.position.y },
      stiffness: 0.8, damping: 0.1, length: 0
    });
    Matter.Composite.add(_shufflePhysicsEngine.world, c);
    return c;
  }
  function releaseGrab(constraint) {
    if (constraint) Matter.Composite.remove(_shufflePhysicsEngine.world, constraint);
  }

  // ── TEAM-BASED DRAW ORDER ──
  // Determine draw groups based on shuffler's team
  var dealerSeat = session.dealer;
  var dealerTeam = (GAME_MODE === 'MOON') ? dealerSeat : (dealerSeat % 2);
  var localTeam = (GAME_MODE === 'MOON') ? localSeat : (localSeat % 2);

  // Build draw groups: opponents first, then partners, then shuffler auto-gets rest
  var opponentSeats = [];
  var partnerSeats = [];
  for (var gs = 0; gs < playerCount; gs++) {
    if (gs === dealerSeat) continue;
    var seatTeam = (GAME_MODE === 'MOON') ? gs : (gs % 2);
    if (seatTeam !== dealerTeam) {
      opponentSeats.push(gs);
    } else {
      partnerSeats.push(gs);
    }
  }

  // Determine which group the local player is in
  var localIsShuffler = (localSeat === dealerSeat);
  var localIsOpponent = opponentSeats.indexOf(localSeat) >= 0;
  var localIsPartner = partnerSeats.indexOf(localSeat) >= 0;

  // ── Physics-based player pick — drag with constraints, tiles bump ──
  var playerPicked = 0;
  var _pickGrabs = {}; // touchId -> { body, constraint, entry }
  var _pickMouseGrab = null;
  var localHandCenter = getSeatHandCenter(localSeat);
  var snapZoneY = getRect().height * 0.6;

  function pickTileForPlayer(entry) {
    if (playerPicked >= handSize || entry.picked) return;
    playerPicked++;
    entry.picked = true;
    snapTileToPile(entry, localSeat);
    counter.textContent = playerPicked + ' / ' + handSize;
    entry.sprite.addEventListener('click', function() { handlePlayer1Click(entry.sprite); });
    entry.sprite.addEventListener('touchstart', function(ev) {
      ev.preventDefault(); ev.stopPropagation();
      handlePlayer1Click(entry.sprite);
    }, { passive: false });
  }

  function playerPickPhase() {
    // If auto-select is on, use slideTileToSeat just like AI players
    if (_autoSelectPick) {
      return (async function() {
        hint.textContent = 'Auto-selecting your dominoes...';
        counter.textContent = '0 / ' + handSize;
        var color = 'rgba(59,130,246,';
        var center = getSeatHandCenter(localSeat);
        var picked = 0;
        var slidePs = [];
        var grabs = [];
        var rem = handSize;
        while (rem > 0) {
          var gc = (Math.random() < 0.35 && rem >= 2) ? 2 : 1;
          grabs.push(gc);
          rem -= gc;
        }
        var totalTime = (3000 + Math.random() * 2000) / (SPEED_MULTIPLIER * SP.pickAnimSpeed);
        var gap = totalTime / grabs.length;
        for (var gi = 0; gi < grabs.length; gi++) {
          if (_pickSpeedUp) {
            while (picked < handSize) {
              var av = [];
              for (var j = 0; j < pool.length; j++) {
                if (!pool[j].picked && pool[j]._body && !pool[j]._body.isStatic) av.push(pool[j]);
              }
              if (av.length === 0) break;
              var en = av[Math.floor(Math.random() * av.length)];
              en.picked = true;
              slidePs.push(slideTileToSeat(en, localSeat, picked, center, color));
              picked++;
              counter.textContent = picked + ' / ' + handSize;
            }
            break;
          }
          var grabCount = grabs[gi];
          for (var g = 0; g < grabCount; g++) {
            var available = [];
            for (var j = 0; j < pool.length; j++) {
              if (!pool[j].picked && pool[j]._body && !pool[j]._body.isStatic) available.push(pool[j]);
            }
            if (available.length === 0) break;
            var entry = available[Math.floor(Math.random() * available.length)];
            entry.picked = true;
            slidePs.push(slideTileToSeat(entry, localSeat, picked, center, color));
            picked++;
            counter.textContent = picked + ' / ' + handSize;
            if (g === 0 && grabCount > 1) {
              await new Promise(function(r) { setTimeout(r, 80 + Math.random() * 120); });
            }
          }
          if (gi < grabs.length - 1) {
            await new Promise(function(r) { setTimeout(r, gap * (0.7 + Math.random() * 0.6)); });
          }
        }
        await Promise.all(slidePs);
      })();
    }

    return new Promise(function(resolve) {
      // Don't overwrite hint if it was already set by the group label
      if (!hint.textContent || hint.textContent.indexOf('slide') < 0) {
        hint.textContent = 'Slide ' + handSize + ' dominoes to your hand';
      }
      counter.textContent = '0 / ' + handSize;

      function onTouchStart(e) {
        e.preventDefault();
        var br = overlay.getBoundingClientRect();
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
          var t = e.changedTouches[ti];
          var tx = t.clientX - br.left, ty = t.clientY - br.top;
          // Count unpicked bodies for debugging
          var unpickedCount = 0;
          for (var di = 0; di < pool.length; di++) {
            if (!pool[di].picked && pool[di]._body) unpickedCount++;
          }
          var body = findUnpickedBodyAt(tx, ty, 80);
          var isPileGrab = false;
          if (!body) {
            body = findPileBodyAt(tx, ty, 60);
            isPileGrab = !!body;
          }
          console.log('[Pick] touch at', Math.round(tx), Math.round(ty), 'found body:', !!body, 'pile:', isPileGrab, 'unpicked:', unpickedCount);
          if (body) {
            _pickGrabs[t.identifier] = { body: body, constraint: grabBody(body, tx, ty), entry: poolEntryForBody(body), isPileGrab: isPileGrab };
          }
        }
      }
      function onTouchMove(e) {
        e.preventDefault();
        var br = overlay.getBoundingClientRect();
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
          var t = e.changedTouches[ti];
          var g = _pickGrabs[t.identifier];
          if (g) { g.constraint.pointA.x = t.clientX - br.left; g.constraint.pointA.y = t.clientY - br.top; }
        }
      }
      function onTouchEnd(e) {
        e.preventDefault();
        var br = overlay.getBoundingClientRect();
        for (var ti = 0; ti < e.changedTouches.length; ti++) {
          var t = e.changedTouches[ti];
          var g = _pickGrabs[t.identifier];
          if (g) {
            releaseGrab(g.constraint);
            if (!g.isPileGrab && g.entry && !g.entry.picked && (t.clientY - br.top) > snapZoneY) pickTileForPlayer(g.entry);
            delete _pickGrabs[t.identifier];
          }
        }
        if (playerPicked >= handSize) { cleanup(); resolve(); }
      }
      function onMouseDown(e) {
        var br = overlay.getBoundingClientRect();
        var mx = e.clientX - br.left, my = e.clientY - br.top;
        var body = findUnpickedBodyAt(mx, my, 80);
        var isPileGrab = false;
        if (!body) { body = findPileBodyAt(mx, my, 60); isPileGrab = !!body; }
        if (body) _pickMouseGrab = { body: body, constraint: grabBody(body, mx, my), entry: poolEntryForBody(body), isPileGrab: isPileGrab };
      }
      function onMouseMove(e) {
        if (!_pickMouseGrab) return;
        var br = overlay.getBoundingClientRect();
        _pickMouseGrab.constraint.pointA.x = e.clientX - br.left;
        _pickMouseGrab.constraint.pointA.y = e.clientY - br.top;
      }
      function onMouseUp(e) {
        if (!_pickMouseGrab) return;
        releaseGrab(_pickMouseGrab.constraint);
        var br = overlay.getBoundingClientRect();
        if (!_pickMouseGrab.isPileGrab && _pickMouseGrab.entry && !_pickMouseGrab.entry.picked && (e.clientY - br.top) > snapZoneY) pickTileForPlayer(_pickMouseGrab.entry);
        _pickMouseGrab = null;
        if (playerPicked >= handSize) { cleanup(); resolve(); }
      }
      function cleanup() {
        overlay.removeEventListener('touchstart', onTouchStart);
        overlay.removeEventListener('touchmove', onTouchMove);
        overlay.removeEventListener('touchend', onTouchEnd);
        overlay.removeEventListener('mousedown', onMouseDown);
        overlay.removeEventListener('mousemove', onMouseMove);
        overlay.removeEventListener('mouseup', onMouseUp);
      }
      overlay.addEventListener('touchstart', onTouchStart, { passive: false });
      overlay.addEventListener('touchmove', onTouchMove, { passive: false });
      overlay.addEventListener('touchend', onTouchEnd, { passive: false });
      overlay.addEventListener('mousedown', onMouseDown);
      overlay.addEventListener('mousemove', onMouseMove);
      overlay.addEventListener('mouseup', onMouseUp);
    });
  }

  // ── AI pick — single controller, round-robin, colored ghost fingers ──

  function slideTileToSeat(entry, aiSeat, slotIdx, seatCenter, color) {
    if (!entry._body) {
      snapTileToPile(entry, aiSeat);
      return Promise.resolve();
    }
    entry.picked = true;
    // Use pile position as target — spread tiles out so they don't stack on one point
    var pilePos = _pilePositions[aiSeat];
    if (pilePos) { seatCenter = pilePos; }
    var body = entry._body;
    if (body.isStatic) Matter.Body.setStatic(body, false);
    // Softer constraint so tiles can't force through each other
    var constraint = Matter.Constraint.create({
      pointA: { x: body.position.x, y: body.position.y },
      bodyB: body,
      pointB: { x: 0, y: 0 },
      stiffness: 0.3, damping: 0.2, length: 0
    });
    Matter.Composite.add(_shufflePhysicsEngine.world, constraint);
    var startX = body.position.x, startY = body.position.y;
    // Offset target within pile circle so tiles spread out
    var spreadAngle = slotIdx * (Math.PI * 2 / Math.max(handSize, 1)) + Math.random() * 0.3;
    var spreadDist = pileRadius ? pileRadius * 0.35 : 20;
    var targetX = seatCenter.x + Math.cos(spreadAngle) * spreadDist;
    var targetY = seatCenter.y + Math.sin(spreadAngle) * spreadDist;
    var slideDuration = (800 + Math.random() * 400) / (SPEED_MULTIPLIER * SP.pickAnimSpeed);
    var slideStart = performance.now();

    // Create ghost finger circle
    var ghost = document.createElement('div');
    ghost.className = 'aiPickGhost';
    ghost.style.cssText = 'position:absolute;width:60px;height:60px;border:3px solid ' + color + '0.7);border-radius:50%;pointer-events:none;z-index:505;transform:translate(-50%,-50%);background:' + color + '0.1);';
    ghost.style.left = startX + 'px';
    ghost.style.top = startY + 'px';
    tableEl.appendChild(ghost);

    return new Promise(function(resolveSlide) {
      var resolved = false;
      var slideInterval = setInterval(function() {
        if (resolved) return;
        var elapsed = performance.now() - slideStart;
        var t = Math.min(1, elapsed / slideDuration);
        var et = 1 - Math.pow(1 - t, 2); // ease-out
        var cx = startX + (targetX - startX) * et;
        var cy = startY + (targetY - startY) * et;
        constraint.pointA.x = cx;
        constraint.pointA.y = cy;
        ghost.style.left = cx + 'px';
        ghost.style.top = cy + 'px';
        if (t >= 1) {
          resolved = true;
          clearInterval(slideInterval);
          releaseGrab(constraint);
          ghost.remove();
          snapTileToPile(entry, aiSeat);
          resolveSlide();
        }
      }, 16);
      // Safety timeout — force resolve if animation gets stuck
      setTimeout(function() {
        if (!resolved) {
          resolved = true;
          clearInterval(slideInterval);
          try { releaseGrab(constraint); } catch(e) {}
          ghost.remove();
          snapTileToPile(entry, aiSeat);
          resolveSlide();
        }
      }, slideDuration + 2000);
    });
  }

  async function aiGroupPick(seats, groupLabel) {
    if (seats.length === 0) return;
    if (groupLabel) hint.textContent = groupLabel;

    var seatCenters = {};
    var seatPicks = {};
    for (var si = 0; si < seats.length; si++) {
      seatCenters[seats[si]] = getSeatHandCenter(seats[si]);
      seatPicks[seats[si]] = 0;
    }

    // Each AI seat takes 3-5 seconds total, grabs spread across that window
    // Sometimes grabs 2 at once (two hands), with natural timing variation
    var totalTime = (3000 + Math.random() * 2000) / (SPEED_MULTIPLIER * SP.pickAnimSpeed);
    var allSlides = [];
    for (var si = 0; si < seats.length; si++) {
      (function(aiSeat) {
        var color = AI_SEAT_COLORS[aiSeat % AI_SEAT_COLORS.length];
        var center = seatCenters[aiSeat];
        var picked = 0;
        allSlides.push((async function() {
          // Spread grabs across totalTime — figure out how many grab events
          var grabs = [];
          var rem = handSize;
          while (rem > 0) {
            var gc = (Math.random() < 0.35 && rem >= 2) ? 2 : 1;
            grabs.push(gc);
            rem -= gc;
          }
          var gap = totalTime / grabs.length;
          var slidePs = []; // collect all slide promises
          for (var gi = 0; gi < grabs.length; gi++) {
            // Speed-up: grab all remaining at once
            if (_pickSpeedUp) {
              while (picked < handSize) {
                var av = [];
                for (var j2 = 0; j2 < pool.length; j2++) {
                  if (!pool[j2].picked && pool[j2]._body && !pool[j2]._body.isStatic) av.push(pool[j2]);
                }
                if (av.length === 0) break;
                var en = av[Math.floor(Math.random() * av.length)];
                en.picked = true;
                slidePs.push(slideTileToSeat(en, aiSeat, picked, center, color));
                picked++;
              }
              break;
            }
            var grabCount = grabs[gi];
            for (var g = 0; g < grabCount; g++) {
              var available = [];
              for (var j = 0; j < pool.length; j++) {
                if (!pool[j].picked && pool[j]._body && !pool[j]._body.isStatic) available.push(pool[j]);
              }
              if (available.length === 0) break;
              var entry = available[Math.floor(Math.random() * available.length)];
              entry.picked = true;
              slidePs.push(slideTileToSeat(entry, aiSeat, picked, center, color));
              picked++;
              // Tiny stagger between two-handed grabs
              if (g === 0 && grabCount > 1) {
                await new Promise(function(r) { setTimeout(r, 80 + Math.random() * 120); });
              }
            }
            // Wait before next grab — spread across total time with some jitter
            if (gi < grabs.length - 1) {
              await new Promise(function(r) { setTimeout(r, gap * (0.7 + Math.random() * 0.6)); });
            }
          }
          // Wait for all slides to fully arrive — no stranded tiles
          await Promise.all(slidePs);
        })());
      })(seats[si]);
    }
    await Promise.all(allSlides);

    var ghosts = document.querySelectorAll('.aiPickGhost');
    for (var gi = 0; gi < ghosts.length; gi++) ghosts[gi].remove();
    await new Promise(function(r) { setTimeout(r, 300 / (SPEED_MULTIPLIER * SP.pickAnimSpeed)); });
  }

  // Shuffler auto-gets remaining tiles — sweep via physics
  async function shufflerAutoGet() {
    hint.textContent = 'Shuffler gets remaining tiles...';
    counter.textContent = '';
    var shufflerCenter = getSeatHandCenter(dealerSeat);
    var shufflerPick = 0;
    var faceUp = (dealerSeat === localSeat);
    var color = AI_SEAT_COLORS[dealerSeat % AI_SEAT_COLORS.length];
    var remaining = [];
    for (var j = 0; j < pool.length; j++) {
      if (!pool[j].picked && pool[j]._body && !pool[j]._body.isStatic) remaining.push(pool[j]);
    }

    if (GAME_MODE === 'MOON') {
      // Moon: shuffler grabs all but 1 at same time, last one goes to widow
      var widowEntry = remaining.pop(); // last one = widow
      var sweepSlides = [];
      for (var ri = 0; ri < remaining.length; ri++) {
        sweepSlides.push(slideTileToSeat(remaining[ri], dealerSeat, shufflerPick, shufflerCenter, color));
        shufflerPick++;
      }
      await Promise.all(sweepSlides);
      // Send the widow tile to the widow position
      if (widowEntry) {
        widowEntry.picked = true;
        var wp = getWidowPose();
        if (widowEntry._body) {
          widowEntry._body._pileSeat = -1; // exempt from pile containment
          Matter.Body.setPosition(widowEntry._body, { x: wp.x + 28, y: wp.y + 56 });
          Matter.Body.setVelocity(widowEntry._body, { x: 0, y: 0 });
          Matter.Body.setStatic(widowEntry._body, true);
        }
        widowEntry.sprite.classList.remove('shuffleSimple');
        widowEntry.sprite.setPose(wp);
        // Store widow tile in session
        if (widowEntry.tile) {
          session.moon_widow = [widowEntry.tile.a, widowEntry.tile.b];
        }
      }
    } else {
      // Shuffler grabs all remaining at the same time
      var sweepSlides = [];
      for (var ri = 0; ri < remaining.length; ri++) {
        sweepSlides.push(slideTileToSeat(remaining[ri], dealerSeat, shufflerPick, shufflerCenter, color));
        shufflerPick++;
      }
      await Promise.all(sweepSlides);
    }
    var ghosts = document.querySelectorAll('.aiPickGhost');
    for (var gi = 0; gi < ghosts.length; gi++) ghosts[gi].remove();
    await new Promise(function(r) { setTimeout(r, 200 / (SPEED_MULTIPLIER * SP.pickAnimSpeed)); });
  }

  // Brief pause after gather so player can see the tiles before AI picks start
  await new Promise(function(r) { setTimeout(r, 2000 / SPEED_MULTIPLIER); });

  // ── EXECUTE DRAW ORDER ──
  // Group 1: Opponents of shuffler
  var aiOpponents = opponentSeats.filter(function(s) { return s !== localSeat; });
  if (localIsOpponent) {
    if (_autoSelectPick) {
      // Auto: player picks simultaneously with AI groupmates
      hint.textContent = 'Your team picking...';
      await Promise.all([playerPickPhase(), aiOpponents.length > 0 ? aiGroupPick(aiOpponents, '') : Promise.resolve()]);
    } else {
      hint.textContent = 'Your team picks — slide ' + handSize + ' dominoes';
      // Player picks first, then AI picks (prevents speed-up from stealing player's tiles)
      await playerPickPhase();
      if (aiOpponents.length > 0) await aiGroupPick(aiOpponents, '');
    }
  } else {
    await aiGroupPick(opponentSeats, 'Opponents picking...');
  }

  // Group 2: Partners of shuffler (not shuffler themselves)
  var aiPartners = partnerSeats.filter(function(s) { return s !== localSeat; });
  if (localIsPartner) {
    if (_autoSelectPick) {
      // Auto: player picks simultaneously with AI groupmates
      hint.textContent = 'Your team picking...';
      await Promise.all([playerPickPhase(), aiPartners.length > 0 ? aiGroupPick(aiPartners, '') : Promise.resolve()]);
    } else {
      hint.textContent = 'Your turn — slide ' + handSize + ' dominoes';
      // Player picks first, then AI picks
      await playerPickPhase();
      if (aiPartners.length > 0) await aiGroupPick(aiPartners, '');
    }
  } else if (partnerSeats.length > 0) {
    await aiGroupPick(partnerSeats, 'Partner(s) picking...');
  }

  // Group 3: Shuffler gets rest
  if (localIsShuffler) {
    // In Moon, shuffler picks manually; otherwise auto-get
    if (GAME_MODE === 'MOON') {
      await playerPickPhase();
    } else {
      await shufflerAutoGet();
    }
  } else {
    if (GAME_MODE === 'MOON') {
      await aiGroupPick([dealerSeat], 'Shuffler picking...');
    } else {
      await shufflerAutoGet();
    }
  }

  // Stop physics loop but DON'T reset sprites (we animate them ourselves)
  _shufflePhysicsActive = false;
  if (_shufflePhysicsRAF) { cancelAnimationFrame(_shufflePhysicsRAF); _shufflePhysicsRAF = null; }

  // Sync _pose from physics body positions so animateSprite starts from correct spot
  var _syncSc = SP.tileScale;
  for (var _si = 0; _si < _shufflePhysicsBodies.length; _si++) {
    var _sb = _shufflePhysicsBodies[_si];
    var _ssp = _shufflePhysicsRealSprites[_si];
    if (_ssp && _sb) {
      _ssp._pose = {
        x: _sb.position.x - 28, y: _sb.position.y - 56,
        s: _syncSc, rz: _sb.angle * 180 / Math.PI, ry: 0
      };
    }
  }

  // ── ARRANGE: animate tiles from pile circles to final hand positions ──
  await _arrangePilesToHands();
  // Brief pause so pile circles stay visible during animation
  await new Promise(function(r) { setTimeout(r, 500 / (SPEED_MULTIPLIER * SP.pickAnimSpeed)); });
  _removePileCircles();

  // Now fully tear down physics engine
  _endShufflePhysics();

  // ── FINALIZE: inject picked hands into the game engine ──
  session.game.set_hands(pickedHands, 0);

  // Clean up pick UI
  if (overlay.parentNode) overlay.remove();
  if (hint.parentNode) hint.remove();
  if (counter.parentNode) counter.remove();
  if (speedBtn.parentNode) speedBtn.remove();
  if (pileGearBtn.parentNode) pileGearBtn.remove();
  var _pPanel = document.getElementById('pileSettingsPanel');
  if (_pPanel) _pPanel.remove();

  // Brief pause before UI comes back
  await new Promise(function(r) { setTimeout(r, 300 / (SPEED_MULTIPLIER * SP.pickAnimSpeed)); });

  // Tiles are in place — now fade UI back in
  _setShuffleTableUI(true);

  // Clear the pool reference
  _shufflePickPool = [];
}
