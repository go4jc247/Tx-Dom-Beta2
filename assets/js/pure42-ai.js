// ============================================================
// Pure 42 AI Engine
// Based on "Winning 42" by Dennis Roberson
// Strategy: at-risk points bidding, book-correct play order
// ============================================================

// ── AI Routing: wrap original functions to route to Pure 42 when active ──
(function() {
  const _origEval = window.evaluateHandForBid;
  const _origTrump = window.aiChooseTrump;
  const _origPlay = window.choose_tile_ai;

  window.evaluateHandForBid = function(hand) {
    if (typeof pure42Mode !== 'undefined' && pure42Mode && GAME_MODE === 'T42') {
      return pure42_evaluateHandForBid(hand);
    }
    return _origEval(hand);
  };

  window.aiChooseTrump = function(hand, bidAmount) {
    if (typeof pure42Mode !== 'undefined' && pure42Mode && GAME_MODE === 'T42') {
      return pure42_aiChooseTrump(hand, bidAmount);
    }
    return _origTrump(hand, bidAmount);
  };

  window.choose_tile_ai = function(gameState, playerIndex, contract, returnRec, bid) {
    if (typeof pure42Mode !== 'undefined' && pure42Mode && GAME_MODE === 'T42') {
      return pure42_choose_tile_ai(gameState, playerIndex, contract, returnRec, bid);
    }
    return _origPlay(gameState, playerIndex, contract, returnRec, bid);
  };
})();

// ── COUNT TILES (constant for double-6 set) ──
const P42_COUNT_TILES = [
  { tile: [5,5], pts: 10, suits: [5] },
  { tile: [6,4], pts: 10, suits: [6, 4] },
  { tile: [5,0], pts: 5,  suits: [5, 0] },
  { tile: [4,1], pts: 5,  suits: [4, 1] },
  { tile: [3,2], pts: 5,  suits: [3, 2] }
];

function _p42TileKey(a, b) { return Math.min(a,b) + ',' + Math.max(a,b); }
function _p42TileEq(t1, t2) { return _p42TileKey(t1[0],t1[1]) === _p42TileKey(t2[0],t2[1]); }

// ════════════════════════════════════════════════════════════════
//  BIDDING — At-Risk Points Method
// ════════════════════════════════════════════════════════════════

function pure42_evaluateHandForBid(hand) {
  const maxPip = session.game.max_pip;
  const handSize = session.game.hand_size;

  // Find all doubles in hand
  const doubles = hand.filter(t => t[0] === t[1]);
  const doublePips = new Set(doubles.map(d => d[0]));

  let bestBid = 0;
  let bestTrumpPip = null;
  let bestMarks = 1;

  // ── NT (No Trumps / Doubles) evaluation ──
  if (doubles.length >= 4) {
    const offs = hand.filter(t => t[0] !== t[1]);
    let totalRisk = 0;
    const riskedCounts = new Set();

    for (const off of offs) {
      const highPip = Math.max(off[0], off[1]);
      const lowPip = Math.min(off[0], off[1]);
      const hasDoubleAhead = doublePips.has(highPip);

      // High-side risk (when I lead this off)
      let highRisk = 1; // trick point
      for (const ct of P42_COUNT_TILES) {
        if (ct.suits.includes(highPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            const key = _p42TileKey(ct.tile[0], ct.tile[1]);
            if (!riskedCounts.has(key)) {
              highRisk += ct.pts;
              riskedCounts.add(key);
            }
          }
        }
      }
      // Double ahead reduces risk (pulls count ~60% of the time)
      if (hasDoubleAhead && highRisk > 1) {
        highRisk = Math.max(1, Math.ceil(highRisk * 0.4));
      }

      // Low-side risk (if opponent leads this suit)
      let lowRisk = 1;
      for (const ct of P42_COUNT_TILES) {
        if (ct.suits.includes(lowPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            const key = _p42TileKey(ct.tile[0], ct.tile[1]);
            if (!riskedCounts.has(key)) {
              lowRisk += ct.pts;
            }
          }
        }
      }

      // Book: take higher of two risks, don't add
      totalRisk += Math.max(highRisk, lowRisk);
    }

    // Partner help: with 2+ offs, expect partner to win 1 trick
    if (offs.length >= 2) totalRisk = Math.max(0, totalRisk - 6);

    const ntBid = Math.min(42, 42 - totalRisk);
    if (ntBid > bestBid) {
      bestBid = ntBid;
      bestTrumpPip = 'NT';
    }

    // All doubles = max bid
    if (doubles.length === handSize) {
      return { action: "bid", bid: 42, marks: 2 };
    }
  }

  // ── PIP TRUMP evaluation (for each possible trump suit) ──
  for (let trumpPip = maxPip; trumpPip >= 0; trumpPip--) {
    const trumpTiles = hand.filter(t => t[0] === trumpPip || t[1] === trumpPip);
    const trumpCount = trumpTiles.length;
    if (trumpCount < 3) continue; // Need at least 3 trumps

    const hasDoubleTrump = trumpTiles.some(t => t[0] === trumpPip && t[1] === trumpPip);

    // Sort trumps by rank (double first, then by other pip descending)
    const trumpsSorted = trumpTiles.slice().sort((a, b) => {
      const aIsDouble = a[0] === a[1];
      const bIsDouble = b[0] === b[1];
      if (aIsDouble && !bIsDouble) return -1;
      if (!aIsDouble && bIsDouble) return 1;
      const aOther = a[0] === trumpPip ? a[1] : a[0];
      const bOther = b[0] === trumpPip ? b[1] : b[0];
      return bOther - aOther;
    });

    // ── TRUMP RISK ──
    // Build complete trump ranking to check if we have top trumps
    const allTrumpsRanked = [];
    allTrumpsRanked.push([trumpPip, trumpPip]); // double is highest
    for (let p = maxPip; p >= 0; p--) {
      if (p === trumpPip) continue;
      allTrumpsRanked.push([Math.min(trumpPip, p), Math.max(trumpPip, p)]);
    }

    // Check how many of the top trumps we have
    let topTrumpsHeld = 0;
    for (const rt of allTrumpsRanked) {
      if (hand.some(h => _p42TileEq(h, rt))) topTrumpsHeld++;
      else break; // first missing = stop counting
    }

    let trumpRisk = 0;
    if (topTrumpsHeld >= 2) {
      // We have top 2+ trumps — safe, we control trump
      trumpRisk = 0;
    } else {
      // We'll lose at least 1 trump trick
      trumpRisk = 1;
      // Check if trump count tiles are at risk
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump && !hand.some(h => _p42TileEq(h, ct.tile))) {
          trumpRisk += ct.pts;
        }
      }
    }

    // ── OFF RISK ──
    const offs = hand.filter(t => {
      if (t[0] === t[1]) return false; // doubles
      if (t[0] === trumpPip || t[1] === trumpPip) return false; // trumps
      return true;
    });

    // FIVE-OFF RULE: if any off has 5 as high pip and 5 is not trump → 15pt risk, usually pass
    const hasDangerousFiveOff = offs.some(off => {
      const highPip = Math.max(off[0], off[1]);
      return highPip === 5 && trumpPip !== 5;
    });
    // FOUR-OFF RULE: if 4 is high pip and neither 4 nor 6 is trump → 15pt risk
    const hasDangerousFourOff = offs.some(off => {
      const highPip = Math.max(off[0], off[1]);
      return highPip === 4 && trumpPip !== 4 && trumpPip !== 6;
    });

    let totalOffRisk = 0;
    const riskedCounts = new Set();

    for (const off of offs) {
      const highPip = Math.max(off[0], off[1]);
      const lowPip = Math.min(off[0], off[1]);
      const hasDoubleAhead = doublePips.has(highPip);

      // High-side risk
      let highRisk = 1;
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump) continue; // count tile is a trump, not at risk in this suit
        if (ct.suits.includes(highPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            const key = _p42TileKey(ct.tile[0], ct.tile[1]);
            if (!riskedCounts.has(key)) {
              highRisk += ct.pts;
              riskedCounts.add(key);
            }
          }
        }
      }
      if (hasDoubleAhead && highRisk > 1) {
        highRisk = Math.max(1, Math.ceil(highRisk * 0.4));
      }

      // Low-side risk
      let lowRisk = 1;
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump) continue;
        if (ct.suits.includes(lowPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            const key = _p42TileKey(ct.tile[0], ct.tile[1]);
            if (!riskedCounts.has(key)) {
              lowRisk += ct.pts;
            }
          }
        }
      }

      totalOffRisk += Math.max(highRisk, lowRisk);
    }

    // Partner help
    if (offs.length >= 2) totalOffRisk = Math.max(0, totalOffRisk - 6);

    const totalRisk = trumpRisk + totalOffRisk;
    const pipBid = Math.min(42, 42 - totalRisk);

    if (pipBid > bestBid) {
      bestBid = pipBid;
      bestTrumpPip = trumpPip;
    }
  }

  // ── DECISION ──
  if (bestBid >= 30) {
    // Bid only as high as necessary (will be adjusted by bidding system)
    return { action: "bid", bid: bestBid, marks: bestBid >= 42 ? 2 : 1 };
  }

  return { action: "pass" };
}

// ════════════════════════════════════════════════════════════════
//  TRUMP SELECTION
// ════════════════════════════════════════════════════════════════

function pure42_aiChooseTrump(hand, bidAmount) {
  // Re-evaluate to find best trump (same logic as bidding)
  const result = pure42_evaluateHandForBid(hand);
  // The bidding function already found the best trump
  // But we need to extract it — let's re-run the evaluation
  const maxPip = session.game.max_pip;
  const doubles = hand.filter(t => t[0] === t[1]);

  // NT check
  if (doubles.length >= 4) {
    const offs = hand.filter(t => t[0] !== t[1]);
    // If all offs are covered by doubles, NT is strong
    const doublePips = new Set(doubles.map(d => d[0]));
    const uncoveredOffs = offs.filter(off => !doublePips.has(Math.max(off[0], off[1])));
    if (uncoveredOffs.length <= 1 && doubles.length >= 4) {
      return "NT";
    }
  }

  // Find best pip suit
  let bestPip = null;
  let bestScore = -Infinity;

  for (let pip = maxPip; pip >= 0; pip--) {
    const trumpTiles = hand.filter(t => t[0] === pip || t[1] === pip);
    if (trumpTiles.length < 3) continue;

    const hasDouble = trumpTiles.some(t => t[0] === pip && t[1] === pip);

    // Score: count * 10 + double bonus + high pip bonus + count-protection bonus
    let score = trumpTiles.length * 10;
    if (hasDouble) score += 25;

    // Bonus for trump suits that convert count tiles to trumps
    for (const ct of P42_COUNT_TILES) {
      if (ct.tile[0] === pip || ct.tile[1] === pip) {
        score += ct.pts; // converting count to trump is valuable
      }
    }

    // Penalty for low pips (less powerful trumps)
    if (pip <= 1) score -= 5;

    // Sort by other pip (higher second trump = stronger)
    const sorted = trumpTiles.filter(t => t[0] !== t[1]).sort((a, b) => {
      const aOther = a[0] === pip ? a[1] : a[0];
      const bOther = b[0] === pip ? b[1] : b[0];
      return bOther - aOther;
    });
    if (sorted.length > 0) {
      const topOther = sorted[0][0] === pip ? sorted[0][1] : sorted[0][0];
      score += topOther; // higher second trump is better
    }

    if (score > bestScore) {
      bestScore = score;
      bestPip = pip;
    }
  }

  return bestPip !== null ? bestPip : (doubles.length >= 3 ? "NT" : maxPip);
}

// ════════════════════════════════════════════════════════════════
//  PLAY LOGIC — choose_tile_ai replacement for Pure 42
// ════════════════════════════════════════════════════════════════

function pure42_choose_tile_ai(gameState, playerIndex, contract, returnRec, bid) {
  const p = Number(playerIndex);
  const legal = gameState.legal_indices_for_player(p);
  const hand = gameState.hands[p] || [];
  const trick = gameState.current_trick || [];
  const isLead = trick.length === 0;
  const trumpSuit = gameState.trump_suit;
  const trumpMode = gameState.trump_mode;
  const maxPip = gameState.max_pip;
  const myTeam = p % 2;
  const trickNum = gameState.trick_number;
  const totalTricks = gameState.hand_size;
  const currentBid = bid || 30;

  const makeResult = (idx, reason) => {
    if (!returnRec) return idx;
    return { index: idx, tile: hand[idx], reason: reason };
  };

  if (legal.length === 0) return makeResult(-1, "No legal moves");
  if (legal.length === 1) return makeResult(legal[0], "Only legal move");

  const isTrump = (t) => gameState._is_trump_tile(t);
  const isDouble = (t) => t[0] === t[1];
  const isSameTeam = (seat) => seat % 2 === myTeam;
  const tileVal = (t) => t[0] + t[1];
  const isCount = (t) => { const s = t[0]+t[1]; return s === 5 || s === 10; };

  // ── Played tiles tracking ──
  const playedSet = new Set();
  const addPlayed = (t) => { if(t) playedSet.add(_p42TileKey(t[0],t[1])); };

  for (let team = 0; team < (gameState.tricks_team || []).length; team++) {
    for (const record of (gameState.tricks_team[team] || [])) {
      for (const t of record) { if(t) addPlayed(t); }
    }
  }
  for (const play of trick) { if(Array.isArray(play)) addPlayed(play[1]); }
  for (const t of hand) addPlayed(t);
  const isPlayed = (a,b) => playedSet.has(_p42TileKey(a,b));

  // ── Trick winner detection ──
  let currentWinner = null;
  let partnerWinning = false;
  if (trick.length > 0) {
    const winnerSeat = gameState._determine_trick_winner();
    currentWinner = winnerSeat;
    partnerWinning = isSameTeam(winnerSeat) && winnerSeat !== p;
  }

  // ── Trump analysis ──
  const trumpsInHand = legal.filter(i => isTrump(hand[i]));
  const allTrumpsOut = (() => {
    if (trumpMode === "NONE") return true;
    if (trumpMode === "PIP") {
      for (let o = 0; o <= maxPip; o++) {
        const a = Math.min(trumpSuit, o), b = Math.max(trumpSuit, o);
        if (!isPlayed(a, b) && !hand.some(h => _p42TileEq(h, [a,b]))) return false;
      }
      return true;
    }
    if (trumpMode === "DOUBLES") {
      for (let v = 0; v <= maxPip; v++) {
        if (!isPlayed(v,v) && !hand.some(h => h[0]===v && h[1]===v)) return false;
      }
      return true;
    }
    return true;
  })();

  // Classify legal tiles
  const legalTrumpDoubles = [];
  const legalTrumps = [];
  const legalDoubles = [];
  const legalOffs = [];

  for (const idx of legal) {
    const t = hand[idx];
    const trump = isTrump(t);
    const dbl = isDouble(t);
    if (trump && dbl) legalTrumpDoubles.push(idx);
    else if (trump) legalTrumps.push(idx);
    else if (dbl) legalDoubles.push(idx);
    else legalOffs.push(idx);
  }

  // Am I the bidder's team?
  // Determine bidder from game context
  const bidderTeam = (() => {
    // The bidder's team has the higher score target
    // In Pure 42, the bidder leads first, so leader of trick 0 is the bidder
    // We don't have direct access, but we can infer from currentBid
    // For now, assume team with the bid obligation
    const t0 = gameState.team_points[0];
    const t1 = gameState.team_points[1];
    // The team that needs to reach currentBid is the bidder's team
    // This is imperfect but functional
    return myTeam; // placeholder — will be improved
  })();
  const iAmBidder = true; // simplified — in real game, track who bid

  // ════════════════════════════════════════════════════════════════
  //  LEADING
  // ════════════════════════════════════════════════════════════════
  if (isLead) {
    // ── Phase 1: Pull trumps (if opponents might have them) ──
    if (!allTrumpsOut && trumpsInHand.length > 0) {
      // Lead trump double first
      if (legalTrumpDoubles.length > 0) {
        return makeResult(legalTrumpDoubles[0], "P42: Lead trump double (pull trumps)");
      }
      // Lead highest trump
      if (legalTrumps.length > 0 && trickNum <= 2) {
        // Sort by trump rank descending
        const sorted = legalTrumps.slice().sort((a, b) => {
          const ra = gameState._trump_rank(hand[a]);
          const rb = gameState._trump_rank(hand[b]);
          return (rb[0]*100+rb[1]) - (ra[0]*100+ra[1]);
        });
        return makeResult(sorted[0], "P42: Lead high trump (pull remaining)");
      }
    }

    // ── Phase 2: Double ahead of off ──
    // If I have a double + an off in the same suit, lead the double first
    for (const dIdx of legalDoubles) {
      const dPip = hand[dIdx][0]; // double pip
      const matchingOff = legalOffs.find(oIdx => {
        const off = hand[oIdx];
        return Math.max(off[0], off[1]) === dPip;
      });
      if (matchingOff !== undefined) {
        // Check if this suit has count tiles not yet played
        let suitHasCount = false;
        for (const ct of P42_COUNT_TILES) {
          if (ct.suits.includes(dPip) && !isTrump(ct.tile) && !isPlayed(ct.tile[0], ct.tile[1])) {
            if (!hand.some(h => _p42TileEq(h, ct.tile))) {
              suitHasCount = true;
              break;
            }
          }
        }
        if (suitHasCount) {
          return makeResult(dIdx, "P42: Double ahead of off (pull count from " + dPip + "-suit)");
        }
      }
    }

    // ── Phase 3: Dump offs (as early as possible) ──
    if (legalOffs.length > 0) {
      // Sort offs by risk (highest risk first — get rid of dangerous offs)
      const offScored = legalOffs.map(idx => {
        const off = hand[idx];
        const highPip = Math.max(off[0], off[1]);
        let risk = 0;
        for (const ct of P42_COUNT_TILES) {
          if (ct.suits.includes(highPip) && !isTrump(ct.tile)) {
            if (!hand.some(h => _p42TileEq(h, ct.tile)) && !isPlayed(ct.tile[0], ct.tile[1])) {
              risk += ct.pts;
            }
          }
        }
        return { idx, risk };
      });
      offScored.sort((a, b) => b.risk - a.risk);

      // Keep at least 1 trump for get-back-in (if we still have offs after this)
      if (trumpsInHand.length > 0 || allTrumpsOut) {
        return makeResult(offScored[0].idx, "P42: Dump off (risk=" + offScored[0].risk + ")");
      }
    }

    // ── Phase 4: Lead doubles (count-heavy suits first) ──
    if (legalDoubles.length > 0) {
      const dblScored = legalDoubles.map(idx => {
        const dPip = hand[idx][0];
        let countValue = 0;
        for (const ct of P42_COUNT_TILES) {
          if (ct.suits.includes(dPip) && !isTrump(ct.tile)) {
            if (!isPlayed(ct.tile[0], ct.tile[1]) && !hand.some(h => _p42TileEq(h, ct.tile))) {
              countValue += ct.pts;
            }
          }
        }
        // Also add count if the double itself is count
        if (isCount(hand[idx])) countValue += tileVal(hand[idx]);
        return { idx, countValue };
      });
      dblScored.sort((a, b) => b.countValue - a.countValue);
      return makeResult(dblScored[0].idx, "P42: Lead double (count pull=" + dblScored[0].countValue + ")");
    }

    // ── Fallback: lead lowest trump ──
    if (legalTrumps.length > 0) {
      const sorted = legalTrumps.slice().sort((a, b) => tileVal(hand[a]) - tileVal(hand[b]));
      return makeResult(sorted[0], "P42: Lead low trump (fallback)");
    }

    return makeResult(legal[0], "P42: Lead (no better option)");
  }

  // ════════════════════════════════════════════════════════════════
  //  FOLLOWING SUIT / PLAYING ON A TRICK
  // ════════════════════════════════════════════════════════════════

  // ── Partner is winning → play low, or donate count if guaranteed ──
  if (partnerWinning) {
    // Check if partner is GUARANTEED to win (led double or highest trump)
    // Simple heuristic: if no one after me can beat partner, it's guaranteed
    const trickPlaysRemaining = gameState.active_players.length - trick.length - 1;
    const partnerGuaranteed = trickPlaysRemaining === 0; // I'm last to play

    if (partnerGuaranteed || trick.length >= 3) {
      // Play count if I have it (donate to partner's winning trick)
      const countLegal = legal.filter(i => isCount(hand[i]));
      if (countLegal.length > 0) {
        // Play highest count
        countLegal.sort((a, b) => tileVal(hand[b]) - tileVal(hand[a]));
        return makeResult(countLegal[0], "P42: Donate count to partner (" + tileVal(hand[countLegal[0]]) + "pts)");
      }
    }
    // Play lowest
    const sorted = legal.slice().sort((a, b) => tileVal(hand[a]) - tileVal(hand[b]));
    return makeResult(sorted[0], "P42: Partner winning, play low");
  }

  // ── Can I win this trick? ──
  const canWin = (() => {
    // Check if any of my legal tiles can beat the current winner
    for (const idx of legal) {
      // This is complex to evaluate without replaying the trick logic
      // Simplified: if I have a higher trump or higher in-suit tile
      if (isTrump(hand[idx]) && !legal.every(i => isTrump(hand[i]))) {
        return true; // I can trump in
      }
    }
    return true; // assume possible
  })();

  // ── Opponent is winning — try to beat them ──
  if (currentWinner !== null && !isSameTeam(currentWinner)) {
    // Defense: if I'm defending and can win, do so
    // If I have the double of the led suit, play it (pounce!)
    const ledSuit = gameState._led_suit_for_trick();

    // Try to play highest legal tile to win
    const sorted = legal.slice().sort((a, b) => {
      // Prefer trumps over non-trumps
      const aTrump = isTrump(hand[a]) ? 1 : 0;
      const bTrump = isTrump(hand[b]) ? 1 : 0;
      if (aTrump !== bTrump) return bTrump - aTrump;
      // Prefer doubles (they win the suit)
      const aDbl = isDouble(hand[a]) ? 1 : 0;
      const bDbl = isDouble(hand[b]) ? 1 : 0;
      if (aDbl !== bDbl) return bDbl - aDbl;
      // Prefer higher tiles
      return tileVal(hand[b]) - tileVal(hand[a]);
    });

    // But don't waste count trumping a worthless trick
    const trickHasCount = trick.some(play => {
      if (!Array.isArray(play)) return false;
      const t = play[1];
      return isCount(t);
    });

    if (trickHasCount || trickNum >= totalTricks - 2) {
      // Trick has count or it's late game — play to win
      return makeResult(sorted[0], "P42: Play high to win (opponent leading)");
    }

    // If trick is low value and I'd have to spend count to win, play low instead
    const bestTile = hand[sorted[0]];
    if (isCount(bestTile) && !trickHasCount) {
      // Playing count to win a 1-point trick — might not be worth it
      // Play lowest instead
      const lowSorted = legal.slice().sort((a, b) => tileVal(hand[a]) - tileVal(hand[b]));
      return makeResult(lowSorted[0], "P42: Save count, play low");
    }

    return makeResult(sorted[0], "P42: Play to win trick");
  }

  // ── Default: play lowest ──
  const sorted = legal.slice().sort((a, b) => tileVal(hand[a]) - tileVal(hand[b]));
  return makeResult(sorted[0], "P42: Play low (default)");
}
