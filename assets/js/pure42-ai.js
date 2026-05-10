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
    if (hasDoubleTrump && trumpCount >= 3) {
      // Have the double + 2 more trumps. Leading the double forces all opponents
      // to play their trumps. After that, our remaining 2+ trumps are likely highest.
      // Book: "You can easily pull in the other trumps" — risk is minimal.
      // Risk: might lose 1 trick to the second-highest trump (which we may not have)
      // but with 3+ trumps total it's manageable.
      trumpRisk = 1; // lose at most 1 trump trick
    } else if (hasDoubleTrump && trumpCount === 3 && topTrumpsHeld >= 2) {
      // Have double + second highest + one more. Very safe.
      trumpRisk = 0;
    } else if (topTrumpsHeld >= 2) {
      trumpRisk = 0;
    } else if (hasDoubleTrump) {
      // Have the double but only 2 trumps total — less control
      trumpRisk = 1;
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump && !hand.some(h => _p42TileEq(h, ct.tile))) {
          trumpRisk += ct.pts;
        }
      }
    } else {
      // We DON'T have the double trump — significant risk
      // Will lose at least 1 trump trick, possibly more
      // Doubles are vulnerable to being trumped by opponents
      trumpRisk = 2; // lose at least 1 trick, opponent controls trump timing
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump && !hand.some(h => _p42TileEq(h, ct.tile))) {
          trumpRisk += ct.pts;
        }
      }
      // Extra penalty: without the double, opponents keep their trumps longer
      // making our non-trump doubles vulnerable
      const ntDbls = doubles.filter(d => d[0] !== trumpPip).length;
      trumpRisk += ntDbls > 0 ? 5 : 10;
    }

    // ── OFF RISK ──
    const nonTrumpDoubles = doubles.filter(d => d[0] !== trumpPip);
    const offs = hand.filter(t => {
      if (t[0] === t[1]) return false; // doubles
      if (t[0] === trumpPip || t[1] === trumpPip) return false; // trumps
      return true;
    });

    // BOOK RULE: need supporting doubles for offs. No doubles = extremely risky.
    // With 3+ offs and 0 non-trump doubles, this is almost never a bidding hand.
    if (offs.length >= 3 && nonTrumpDoubles.length === 0) continue;

    // FIVE-OFF RULE: 5-off risks 15pts (5-5 + 5-0). Book says almost never bid.
    const hasDangerousFiveOff = offs.some(off => {
      const highPip = Math.max(off[0], off[1]);
      if (highPip !== 5 || trumpPip === 5) return false;
      // Check if both 5-5 and 5-0 are NOT in hand and NOT trump
      const has55 = hand.some(h => _p42TileEq(h, [5,5]));
      const has50 = hand.some(h => _p42TileEq(h, [5,0]));
      const is50trump = trumpPip === 0;
      return !has55 && !has50 && !is50trump; // both exposed = deadly
    });
    if (hasDangerousFiveOff) continue; // Book: don't bid with unprotected 5-off

    // FOUR-OFF RULE: 4-off risks 15pts (6-4 + 4-1).
    const hasDangerousFourOff = offs.some(off => {
      const highPip = Math.max(off[0], off[1]);
      if (highPip !== 4) return false;
      const is64trump = trumpPip === 6;
      const is41trump = trumpPip === 1;
      const has64 = hand.some(h => _p42TileEq(h, [6,4]));
      const has41 = hand.some(h => _p42TileEq(h, [4,1]));
      // Dangerous if BOTH count tiles are exposed
      return !has64 && !has41 && !is64trump && !is41trump;
    });
    if (hasDangerousFourOff) continue; // Book: don't bid with exposed 4-off

    let totalOffRisk = 0;

    for (const off of offs) {
      const highPip = Math.max(off[0], off[1]);
      const lowPip = Math.min(off[0], off[1]);
      const hasDoubleAhead = doublePips.has(highPip);

      // FIX: If the off itself IS a count tile, add its value as inherent risk
      const offIsCount = (off[0] + off[1] === 5 || off[0] + off[1] === 10);

      // High-side risk (each off evaluated independently — no cross-off dedup)
      let highRisk = 1; // minimum 1 trick point
      if (offIsCount) highRisk += (off[0] + off[1] === 10 ? 10 : 5); // the off itself is count
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump) continue;
        if (ct.suits.includes(highPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            highRisk += ct.pts;
          }
        }
      }
      if (hasDoubleAhead && highRisk > 1) {
        // Double ahead pulls count ~60% of the time. Reduce risk but not to zero.
        highRisk = Math.max(1, Math.ceil(highRisk * 0.4));
      }

      // Low-side risk (if opponent leads this suit instead of you)
      let lowRisk = 1;
      if (offIsCount) lowRisk += (off[0] + off[1] === 10 ? 10 : 5);
      for (const ct of P42_COUNT_TILES) {
        const isTrump = ct.tile[0] === trumpPip || ct.tile[1] === trumpPip;
        if (isTrump) continue;
        if (ct.suits.includes(lowPip) && !_p42TileEq(ct.tile, off)) {
          const inHand = hand.some(h => _p42TileEq(h, ct.tile));
          if (!inHand) {
            lowRisk += ct.pts;
          }
        }
      }

      // Book: take the higher of the two risks, don't add
      totalOffRisk += Math.max(highRisk, lowRisk);
    }

    // Partner help: with 2+ offs, expect partner to win 1 trick
    // But only give full help with 4+ trumps. With 3 trumps, be more conservative.
    if (offs.length >= 2 && nonTrumpDoubles.length >= 1) {
      const helpAmount = (trumpCount >= 4) ? 6 : 3;
      totalOffRisk = Math.max(0, totalOffRisk - helpAmount);
    }

    // Strong hand bonus: 4+ trumps with double + 2+ non-trump doubles = very strong control
    // You control 6+ tricks, off risk is mitigated because you choose WHEN to play it
    if (trumpCount >= 4 && hasDoubleTrump && nonTrumpDoubles.length >= 2 && offs.length <= 1) {
      totalOffRisk = Math.max(0, Math.ceil(totalOffRisk * 0.4)); // off risk greatly reduced
    }
    // 4+ trumps with double + 1 off + 1 non-trump double — strong but not dominant
    else if (trumpCount >= 4 && hasDoubleTrump && nonTrumpDoubles.length >= 1 && offs.length === 1) {
      totalOffRisk = Math.max(0, totalOffRisk - 5); // moderate reduction
    }

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
  const playerCount = gameState.player_count;

  const makeResult = (idx, reason) => {
    if (!returnRec) return idx;
    return { index: idx, tile: hand[idx], reason: reason };
  };
  if (legal.length === 0) return makeResult(-1, "No legal moves");
  if (legal.length === 1) return makeResult(legal[0], "Only legal move");

  // ── ROLE DETECTION ──
  const bidderSeat = (typeof session !== 'undefined' && session.bid_winner_seat !== undefined)
    ? session.bid_winner_seat : gameState.leader;
  const bidderTeam = bidderSeat % 2;
  const iAmBidder = (p === bidderSeat);
  const iAmPartner = (!iAmBidder && myTeam === bidderTeam);
  const iAmDefender = (myTeam !== bidderTeam);
  const iPlayLast = (trick.length === playerCount - 1);

  // ── HELPERS ──
  const isTrump = (t) => gameState._is_trump_tile(t);
  const isDouble = (t) => t[0] === t[1];
  const tileVal = (t) => t[0] + t[1];
  const isCount = (t) => { const s = t[0]+t[1]; return s === 5 || s === 10; };
  const countPts = (t) => { const s = t[0]+t[1]; return (s===5||s===10) ? s : 0; };
  const trumpRank = (t) => { const r = gameState._trump_rank(t); return r[0]*100+r[1]; };

  // ── PLAYED TILES ──
  const playedSet = new Set();
  const addPlayed = (t) => { if(t) playedSet.add(_p42TileKey(t[0],t[1])); };
  for (let tm = 0; tm < (gameState.tricks_team||[]).length; tm++)
    for (const rec of (gameState.tricks_team[tm]||[]))
      for (const t of rec) if(t) addPlayed(t);
  for (const pl of trick) if(Array.isArray(pl)) addPlayed(pl[1]);
  for (const t of hand) addPlayed(t);
  const isPlayed = (a,b) => playedSet.has(_p42TileKey(a,b));

  // ── TRICK STATE ──
  let currentWinner = null, myTeamWinning = false, opponentWinning = false;
  let trickCountPts = 0;
  if (trick.length > 0) {
    currentWinner = gameState._determine_trick_winner();
    myTeamWinning = (currentWinner % 2 === myTeam);
    opponentWinning = !myTeamWinning;
    for (const pl of trick) if(Array.isArray(pl)) trickCountPts += countPts(pl[1]);
  }

  // ── TRUMP TRACKING ──
  let highestRemainingTrumpRank = -1;
  let myHighestTrumpRank = -1;
  if (trumpMode === "PIP" && trumpSuit !== null) {
    for (let o = 0; o <= maxPip; o++) {
      const a = Math.min(trumpSuit,o), b = Math.max(trumpSuit,o);
      if (hand.some(h => _p42TileEq(h,[a,b]))) {
        const rn = trumpRank([a,b]);
        if (rn > myHighestTrumpRank) myHighestTrumpRank = rn;
      } else if (!isPlayed(a,b)) {
        const rn = trumpRank([a,b]);
        if (rn > highestRemainingTrumpRank) highestRemainingTrumpRank = rn;
      }
    }
  }
  const iHaveHighestTrump = myHighestTrumpRank > highestRemainingTrumpRank;
  const allTrumpsOut = (highestRemainingTrumpRank === -1) || trumpMode === "NONE";

  // ── CLASSIFY LEGAL TILES ──
  const ltDouble = [], ltTrump = [], ldDouble = [], ldOff = [];
  for (const idx of legal) {
    const t = hand[idx];
    if (isTrump(t) && isDouble(t)) ltDouble.push(idx);
    else if (isTrump(t)) ltTrump.push(idx);
    else if (isDouble(t)) ldDouble.push(idx);
    else ldOff.push(idx);
  }

  // Sort helpers
  const sortByValAsc = (arr) => arr.slice().sort((a,b) => tileVal(hand[a]) - tileVal(hand[b]));
  const sortByValDesc = (arr) => arr.slice().sort((a,b) => tileVal(hand[b]) - tileVal(hand[a]));
  const sortByTrumpAsc = (arr) => arr.slice().sort((a,b) => trumpRank(hand[a]) - trumpRank(hand[b]));
  const sortByTrumpDesc = (arr) => arr.slice().sort((a,b) => trumpRank(hand[b]) - trumpRank(hand[a]));
  const nonCountFrom = (arr) => arr.filter(i => !isCount(hand[i]));
  const countFrom = (arr) => arr.filter(i => isCount(hand[i]));

  // Count threat for a suit (how much count could fall if this suit is led)
  const suitCountThreat = (pip) => {
    let threat = 0;
    for (const ct of P42_COUNT_TILES) {
      if (ct.suits.includes(pip) && !isTrump(ct.tile) && !isPlayed(ct.tile[0],ct.tile[1])) {
        if (!hand.some(h => _p42TileEq(h, ct.tile))) threat += ct.pts;
      }
    }
    return threat;
  };

  // ══════════════════════════════════════════════════════════════
  //  L E A D I N G
  // ══════════════════════════════════════════════════════════════
  if (isLead) {

    // ─── BIDDER LEAD ───
    if (iAmBidder) {
      // 1. Pull trumps
      if (!allTrumpsOut) {
        if (ltDouble.length > 0)
          return makeResult(ltDouble[0], "P42B: trump double (pull)");
        if (ltTrump.length > 0 && trickNum <= 2) {
          if (iHaveHighestTrump) {
            return makeResult(sortByTrumpDesc(ltTrump)[0], "P42B: highest trump (guaranteed, partner donate)");
          }
          const nc = nonCountFrom(ltTrump);
          if (nc.length > 0) return makeResult(sortByValAsc(nc)[0], "P42B: low non-count trump (will lose)");
          return makeResult(sortByValAsc(ltTrump)[0], "P42B: low trump (no non-count)");
        }
      }
      // 2. Double ahead of off
      for (const dIdx of ldDouble) {
        const dPip = hand[dIdx][0];
        if (ldOff.some(i => Math.max(hand[i][0],hand[i][1]) === dPip)) {
          return makeResult(dIdx, "P42B: double ahead of off (" + dPip + "-suit)");
        }
      }
      // 3. Dump offs (highest risk first)
      if (ldOff.length > 0) {
        const scored = ldOff.map(i => ({ i, r: countPts(hand[i]) + suitCountThreat(Math.max(hand[i][0],hand[i][1])) }));
        scored.sort((a,b) => b.r - a.r);
        return makeResult(scored[0].i, "P42B: dump off (risk=" + scored[0].r + ")");
      }
      // 4. Lead doubles (count-heavy first)
      if (ldDouble.length > 0) {
        const scored = ldDouble.map(i => ({ i, cv: countPts(hand[i]) + suitCountThreat(hand[i][0]) }));
        scored.sort((a,b) => b.cv - a.cv);
        return makeResult(scored[0].i, "P42B: double (count=" + scored[0].cv + ")");
      }
      // 5. Remaining trump
      if (ltTrump.length > 0) return makeResult(sortByValAsc(ltTrump)[0], "P42B: last trump");
    }

    // ─── PARTNER LEAD ───
    if (iAmPartner) {
      // Lead doubles (count-calling preferred). NEVER lead trump. Lead away from count if no doubles.
      if (ldDouble.length > 0) {
        const scored = ldDouble.map(i => ({ i, cv: suitCountThreat(hand[i][0]) }));
        scored.sort((a,b) => b.cv - a.cv);
        return makeResult(scored[0].i, "P42P: double (count=" + scored[0].cv + ")");
      }
      // No doubles — lead AWAY from count (lowest risk)
      const allNonTrump = [...ldOff];
      if (allNonTrump.length > 0) {
        const scored = allNonTrump.map(i => ({ i, r: countPts(hand[i]) + suitCountThreat(Math.max(hand[i][0],hand[i][1])) }));
        scored.sort((a,b) => a.r - b.r); // lowest risk first
        return makeResult(scored[0].i, "P42P: away from count (risk=" + scored[0].r + ")");
      }
      // Last resort: trump (book says avoid)
      if (ltTrump.length > 0) return makeResult(sortByValAsc(ltTrump)[0], "P42P: trump (last resort)");
      if (ltDouble.length > 0) return makeResult(ltDouble[0], "P42P: trump double (last resort)");
    }

    // ─── DEFENDER LEAD ───
    if (iAmDefender) {
      // Lead tiles that call for count. Don't lead count itself. Don't lead doubles without count threat.
      const allLeads = [...ldDouble, ...ldOff, ...ltTrump, ...ltDouble];
      if (allLeads.length > 0) {
        const scored = allLeads.map(i => {
          const t = hand[i];
          let score = suitCountThreat(Math.max(t[0],t[1]));
          if (isDouble(t)) score += 3; // doubles help win tricks
          if (isCount(t)) score -= 25; // never lead your own count
          if (isTrump(t)) score -= 15; // avoid leading trump
          return { i, score };
        });
        scored.sort((a,b) => b.score - a.score);
        return makeResult(scored[0].i, "P42D: lead (threat=" + scored[0].score + ")");
      }
    }

    return makeResult(legal[0], "P42: lead fallback");
  }

  // ══════════════════════════════════════════════════════════════
  //  F O L L O W I N G
  // ══════════════════════════════════════════════════════════════

  // ─── MY TEAM IS WINNING ───
  if (myTeamWinning) {
    // Partner/bidder winning — donate count if safe, else play low
    if (iPlayLast) {
      // I'm last — guaranteed winner is known. Donate count!
      const cl = countFrom(legal).filter(i => !isTrump(hand[i]));
      if (cl.length > 0) {
        return makeResult(sortByValDesc(cl)[0], "P42: donate " + countPts(hand[sortByValDesc(cl)[0]]) + "pts (last, safe)");
      }
    } else {
      // Not last — only donate if leader played double or THE highest remaining trump
      const leaderTile = trick.length > 0 && Array.isArray(trick[0]) ? trick[0][1] : null;
      const leaderPlayedGuaranteed = leaderTile && (
        isDouble(leaderTile) ||
        (isTrump(leaderTile) && trumpRank(leaderTile) > highestRemainingTrumpRank)
      );
      if (leaderPlayedGuaranteed) {
        const cl = countFrom(legal).filter(i => !isTrump(hand[i]));
        if (cl.length > 0) {
          return makeResult(sortByValDesc(cl)[0], "P42: donate count (leader has double/high trump)");
        }
      }
    }
    // Play low, prefer non-count
    const nc = nonCountFrom(legal);
    return makeResult(sortByValAsc(nc.length > 0 ? nc : legal)[0], "P42: team winning, play low");
  }

  // ─── OPPONENT IS WINNING ───
  if (opponentWinning) {

    // == DEFENDER: opponent = bidder is winning ==
    if (iAmDefender) {
      // Can I win? (double of led suit, or trump in)
      const ledSuit = gameState._led_suit_for_trick();
      let winIdx = -1;
      // Check for double of led suit
      for (const idx of legal) {
        if (isDouble(hand[idx]) && !isTrump(hand[idx]) && hand[idx][0] === ledSuit) { winIdx = idx; break; }
      }
      // Check for trump-in
      if (winIdx < 0) {
        for (const idx of legal) { if (isTrump(hand[idx])) { winIdx = idx; break; } }
      }
      if (winIdx >= 0) return makeResult(winIdx, "P42D: pounce (win trick)");

      // Can't win. Throw count or save it?
      if (iPlayLast) {
        // LAST to play. Partner already couldn't win. DON'T throw count.
        const nc = nonCountFrom(legal);
        return makeResult(sortByValAsc(nc.length > 0 ? nc : legal)[0], "P42D: last, partner lost, save count");
      }
      // NOT last — partner might still win. "Play it or lose it!"
      const cl = countFrom(legal);
      if (cl.length > 0) {
        return makeResult(sortByValDesc(cl)[0], "P42D: pounce count (" + countPts(hand[sortByValDesc(cl)[0]]) + "pts, play it or lose it)");
      }
      // No count — throw low, create void
      return makeResult(sortByValAsc(legal)[0], "P42D: no count, play low");
    }

    // == BIDDER/PARTNER: opponent winning, try to take it back ==
    // Trump in if count is at stake
    const trumpLegal = legal.filter(i => isTrump(hand[i]));
    if (trumpLegal.length > 0 && trickCountPts > 0) {
      return makeResult(sortByTrumpAsc(trumpLegal)[0], "P42: trump in (protect " + trickCountPts + "pts count)");
    }
    // Try to win in-suit with highest
    const nonCount = nonCountFrom(legal);
    const high = sortByValDesc(nonCount.length > 0 ? nonCount : legal);
    if (high.length > 0) return makeResult(high[0], "P42: play high to contest");
    return makeResult(sortByValAsc(legal)[0], "P42: can't win, play low");
  }

  // ─── FOLLOWING TRUMP SUIT (forced to follow) ───
  if (!isLead && gameState._led_suit_for_trick() === -1) {
    if (iAmDefender) {
      // Defender: play LOWEST trump — save high for tricks you can win
      return makeResult(sortByTrumpAsc(legal)[0], "P42D: follow trump, play lowest (save high)");
    }
  }

  // ─── DEFAULT ───
  const nc = nonCountFrom(legal);
  return makeResult(sortByValAsc(nc.length > 0 ? nc : legal)[0], "P42: default play low");
}
