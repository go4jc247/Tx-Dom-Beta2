// ============================================================
// TX-Dom-Dev — monte-carlo.js
// Lazy-loaded module extracted from game.js v13.4.0
// ============================================================

// ============================================================================
// MONTE CARLO SIMULATION ENGINE (V10_33)
// ============================================================================

(function() {
  'use strict';

  let mcSelectedOrder = [];   // indices into P1's hand, in user-selected order
  let mcPlayerHand = [];      // copy of P1's hand tiles at time modal opened
  let mcRunning = false;

  // --- Open Monte Carlo modal ---
  document.getElementById('menuMonteCarlo').addEventListener('click', () => {
    document.getElementById('settingsMenu').classList.remove('open');
    mcOpenModal();
  });

  document.getElementById('mcCloseBtn').addEventListener('click', () => {
    document.getElementById('mcBackdrop').style.display = 'none';
    mcRunning = false;
  });

  document.getElementById('mcResetBtn').addEventListener('click', () => {
    mcSelectedOrder = [];
    mcRenderTiles();
    mcUpdateRunBtn();
  });

  document.getElementById('mcRunBtn').addEventListener('click', () => {
    if (mcRunning) return;
    mcStartSimulation();
  });

  document.getElementById('mcCopyBtn').addEventListener('click', () => {
    const resultsDiv = document.getElementById('mcResults');
    if (!resultsDiv || resultsDiv.style.display === 'none') return;
    const text = resultsDiv.innerText;
    navigator.clipboard.writeText(text).then(() => {
      document.getElementById('mcCopyBtn').textContent = 'Copied!';
      setTimeout(() => { document.getElementById('mcCopyBtn').textContent = 'Copy Results'; }, 1500);
    }).catch(e => { console.error('Copy failed:', e); });
  });

  // --- Open the modal and populate tiles ---
  function mcOpenModal() {
    const notReady = document.getElementById('mcNotReady');
    const main = document.getElementById('mcMain');

    // Check if we're in a valid state for Monte Carlo
    if (!session || session.phase !== PHASE_PLAYING) {
      notReady.style.display = 'block';
      notReady.textContent = 'Monte Carlo is available during the play phase. Start a hand first.';
      main.style.display = 'none';
      document.getElementById('mcBackdrop').style.display = 'flex';
      return;
    }

    const g = session.game;
    const hand = g.hands[0];
    if (!hand || hand.length === 0) {
      notReady.style.display = 'block';
      notReady.textContent = 'No tiles in your hand.';
      main.style.display = 'none';
      document.getElementById('mcBackdrop').style.display = 'flex';
      return;
    }

    notReady.style.display = 'none';
    main.style.display = 'block';

    // Copy P1's current hand
    mcPlayerHand = hand.map(t => [t[0], t[1]]);
    mcSelectedOrder = [];

    mcRenderTiles();
    mcUpdateRunBtn();

    // Clear previous results
    document.getElementById('mcResults').style.display = 'none';
    document.getElementById('mcResults').innerHTML = '';
    document.getElementById('mcProgress').style.display = 'none';

    document.getElementById('mcBackdrop').style.display = 'flex';
  }

  // --- Render tile selection UI ---
  function mcRenderTiles() {
    const container = document.getElementById('mcTileSelect');
    container.innerHTML = '';

    mcPlayerHand.forEach((tile, idx) => {
      const orderPos = mcSelectedOrder.indexOf(idx);
      const isSelected = orderPos !== -1;

      const tileDiv = document.createElement('div');
      tileDiv.style.cssText = 'position:relative;width:56px;height:72px;border-radius:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;user-select:none;transition:transform 0.15s,box-shadow 0.15s;';

      if (isSelected) {
        tileDiv.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        tileDiv.style.boxShadow = '0 4px 12px rgba(34,197,94,0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
        tileDiv.style.transform = 'scale(1.05)';
        tileDiv.style.border = '2px solid rgba(255,255,255,0.5)';
      } else {
        tileDiv.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 100%)';
        tileDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
        tileDiv.style.border = '2px solid rgba(255,255,255,0.2)';
      }

      // Tile pips display
      const topPip = document.createElement('div');
      topPip.textContent = tile[0];
      topPip.style.cssText = 'font-size:18px;line-height:1;';
      const divider = document.createElement('div');
      divider.style.cssText = 'width:70%;height:2px;background:rgba(255,255,255,0.4);margin:3px 0;';
      const botPip = document.createElement('div');
      botPip.textContent = tile[1];
      botPip.style.cssText = 'font-size:18px;line-height:1;';

      tileDiv.appendChild(topPip);
      tileDiv.appendChild(divider);
      tileDiv.appendChild(botPip);

      // Order badge
      if (isSelected) {
        const badge = document.createElement('div');
        badge.textContent = String(orderPos + 1);
        badge.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:#fbbf24;color:#000;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);';
        tileDiv.appendChild(badge);
      }

      tileDiv.addEventListener('click', () => {
        if (mcRunning) return;
        const existingPos = mcSelectedOrder.indexOf(idx);
        if (existingPos !== -1) {
          // Deselect: remove this and all after it
          mcSelectedOrder.splice(existingPos);
        } else if (mcSelectedOrder.length < mcPlayerHand.length) {
          mcSelectedOrder.push(idx);
        }
        mcRenderTiles();
        mcUpdateRunBtn();
      });

      container.appendChild(tileDiv);
    });
  }

  // --- Update Run button state ---
  function mcUpdateRunBtn() {
    const btn = document.getElementById('mcRunBtn');
    const anySelected = mcSelectedOrder.length > 0;
    btn.disabled = !anySelected;
    btn.style.opacity = anySelected ? '1' : '0.5';
    // Show mode indicator
    const isPartial = mcSelectedOrder.length > 0 && mcSelectedOrder.length < mcPlayerHand.length;
    btn.textContent = isPartial ? 'Run Control Analysis' : 'Run Simulation';
  }

  // --- Start simulation ---
  function mcStartSimulation() {
    if (mcSelectedOrder.length === 0) return;
    mcRunning = true;
    document.getElementById('mcCopyRow').style.display = 'none';

    const numSims = parseInt(document.getElementById('mcSimCount').value) || 500;
    const progressDiv = document.getElementById('mcProgress');
    const progressText = document.getElementById('mcProgressText');
    const progressBar = document.getElementById('mcProgressBar');
    const resultsDiv = document.getElementById('mcResults');

    progressDiv.style.display = 'block';
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
    progressBar.style.width = '0%';
    progressText.textContent = 'Preparing simulation...';

    // Disable controls during run
    document.getElementById('mcRunBtn').disabled = true;
    document.getElementById('mcRunBtn').style.opacity = '0.5';

    // Gather game state
    const g = session.game;
    const trumpSuit = g.trump_suit;
    const trumpMode = g.trump_mode;
    const contract = session.contract || "NORMAL";
    const bid = session.current_bid || 34;
    const activePlayers = g.active_players.slice();
    const bidWinnerSeat = session.bid_winner_seat !== undefined ? session.bid_winner_seat : 0;

    // Build remaining tile pool (all tiles minus P1's hand)
    const allTiles = allDominoesForSet(g.max_pip);
    const handSet = new Set(mcPlayerHand.map(t => t[0] + ',' + t[1]));
    const remainingPool = allTiles.filter(t => !handSet.has(t[0] + ',' + t[1]));

    const isPartial = mcSelectedOrder.length < mcPlayerHand.length;
    const isMoon = GAME_MODE === 'MOON';

    // Get existing game scores for cumulative display
    const existingScores = isMoon
      ? (session.game.team_points || [0,0,0]).slice()
      : (session.game.team_points || [0,0]).slice();

    // Results accumulators
    const results = {
      total: numSims,
      isPartial: isPartial,
      isMoon: isMoon,
      existingScores: existingScores,
      tilesPlayed: mcSelectedOrder.length,
      keptControl: 0, keptControlBidMade: 0,
      lostToPartner: 0, lostToPartnerBidMade: 0,
      lostToOpponent: 0, lostToOpponentBidMade: 0,
      totalBidMade: 0,
      scoreWhenMade: 0, scoreWhenFailed: 0,
      madeCount: 0, failedCount: 0,
      setCount: 0,
      nelloWon: 0, nelloLost: 0,
      trickControlLost: new Array(7).fill(0),
      // V12.9.3: Per-scenario score tracking
      keptControlYourPts: 0, keptControlTheirPts: 0,
      lostPartnerYourPts: 0, lostPartnerTheirPts: 0,
      lostOppYourPts: 0, lostOppTheirPts: 0,
      // Moon: per-player score tracking (3 players)
      moonScores: { kept: [0,0,0], lostPartner: [0,0,0], lostOpp: [0,0,0] },
      // Set opponent bid tracking
      setOppBidCount: 0
    };

    let simsDone = 0;
    const BATCH_SIZE = 25;

    function runBatch() {
      const batchEnd = Math.min(simsDone + BATCH_SIZE, numSims);

      for (let sim = simsDone; sim < batchEnd; sim++) {
        runOneSim(results, mcPlayerHand, mcSelectedOrder, remainingPool,
                  trumpSuit, trumpMode, contract, bid, activePlayers, bidWinnerSeat);
      }

      simsDone = batchEnd;
      const pct = Math.round((simsDone / numSims) * 100);
      progressBar.style.width = pct + '%';
      progressText.textContent = 'Running simulation ' + simsDone + '/' + numSims + '...';

      if (simsDone < numSims) {
        setTimeout(runBatch, 0);
      } else {
        // Done
        mcRunning = false;
        progressDiv.style.display = 'none';
        mcDisplayResults(results, contract);
        mcUpdateRunBtn();
      }
    }

    setTimeout(runBatch, 10);
  }

  // --- Run one simulation ---
  function runOneSim(results, playerHand, playOrder, remainingPool,
                     trumpSuit, trumpMode, contract, bid, activePlayers, bidWinnerSeat) {
    // Shuffle remaining tiles and distribute
    const pool = remainingPool.slice();
    shuffleInPlace(pool);

    const _simPC = session.game.player_count;
    const _simHS = session.game.hand_size;
    const _simMP = session.game.max_pip;
    const isMoon = results.isMoon;
    const isPartial = results.isPartial;
    const hands = new Array(_simPC);
    hands[0] = playerHand.map(t => [t[0], t[1]]);
    let pi = 0;
    for (let s = 1; s < _simPC; s++) {
      if (contract === "NELLO" && (s === 2 || s === 4)) {
        hands[s] = [];
      } else {
        hands[s] = pool.slice(pi, pi + _simHS);
        pi += _simHS;
      }
    }

    // Create fresh game state
    const sim = new GameStateV6_4g(_simPC, _simMP, _simHS);
    sim.set_hands(hands, bidWinnerSeat);
    if (trumpMode === "NONE") {
      sim.set_trump_suit(null);
    } else if (trumpMode === "DOUBLES") {
      sim.set_trump_suit("DOUBLES");
    } else {
      sim.set_trump_suit(trumpSuit);
    }
    sim.set_active_players(activePlayers);

    // Track control
    let inControl = true;
    let controlLostTo = null;
    let controlLostTrick = -1;
    let leadOrderIdx = 0;
    let tricksPlayedByP1 = 0;

    let safety = 0;
    while (!sim.hand_is_over() && safety < 100) {
      safety++;
      const currentSeat = sim.current_player;
      const isLeading = sim.current_trick.length === 0;
      let tileIdx = -1;

      if (currentSeat === 0 && inControl && isLeading && leadOrderIdx < playOrder.length) {
        const preferredTile = playerHand[playOrder[leadOrderIdx]];
        const hand = sim.hands[0];
        tileIdx = hand.findIndex(t => t[0] === preferredTile[0] && t[1] === preferredTile[1]);
        if (tileIdx === -1) {
          try { tileIdx = choose_tile_ai(sim, 0, contract, false, bid); } catch(_) { tileIdx = 0; }
        }
        leadOrderIdx++;
      } else {
        try {
          tileIdx = choose_tile_ai(sim, currentSeat, contract, false, bid);
        } catch(_) {
          const legal = sim.legal_indices_for_player(currentSeat);
          tileIdx = legal.length > 0 ? legal[0] : 0;
        }
      }

      const legal = sim.legal_indices_for_player(currentSeat);
      if (legal.length === 0) break;
      if (!legal.includes(tileIdx)) tileIdx = legal[0];

      let result;
      try {
        result = sim.play_tile(currentSeat, tileIdx);
      } catch(e) {
        break;
      }

      if (result && result[2]) {
        sim.current_trick = [];
        const winner = result[1];
        const winnerTeam = sim.team_of(winner);
        const p1Team = isMoon ? 0 : 0;

        if (currentSeat === 0 || isLeading) tricksPlayedByP1++;

        if (inControl && winner !== 0) {
          inControl = false;
          if (isMoon) {
            controlLostTo = 'opponent';
          } else if (winnerTeam === p1Team) {
            controlLostTo = 'partner';
          } else {
            controlLostTo = 'opponent';
          }
          controlLostTrick = sim.trick_number;
          if (controlLostTrick >= 1 && controlLostTrick <= 6) {
            results.trickControlLost[controlLostTrick]++;
          }

          // In partial mode, STOP when control is lost
          if (isPartial) break;
        }

        // In partial mode, stop when all selected tiles have been led
        if (isPartial && leadOrderIdx >= playOrder.length && inControl) break;

        // Full mode: check for early set / bid made
        if (!isPartial) {
          const bidderTeamIndex = isMoon ? bidWinnerSeat : (bidWinnerSeat % 2 === 0 ? 0 : 1);
          const bidderPoints = sim.team_points[bidderTeamIndex];
          const totalAwarded = sim.team_points.reduce((a,b) => a+b, 0);
          const maxPts = isMoon ? 21 : 51;
          const pointsRemaining = maxPts - totalAwarded;
          if (contract !== "NELLO" && bidderPoints + pointsRemaining < bid) break;
          if (contract !== "NELLO" && bidderPoints >= bid) break;
        }
      }
    }

    // Collect scores from simulation
    const simPts = sim.team_points.slice();
    const p1Team = isMoon ? 0 : 0;

    // Per-scenario score accumulation
    if (isMoon) {
      if (inControl) {
        for (let i = 0; i < 3; i++) results.moonScores.kept[i] += simPts[i];
      } else if (controlLostTo === 'partner') {
        for (let i = 0; i < 3; i++) results.moonScores.lostPartner[i] += simPts[i];
      } else {
        for (let i = 0; i < 3; i++) results.moonScores.lostOpp[i] += simPts[i];
      }
    } else {
      if (inControl) {
        results.keptControlYourPts += simPts[p1Team];
        results.keptControlTheirPts += simPts[1 - p1Team];
      } else if (controlLostTo === 'partner') {
        results.lostPartnerYourPts += simPts[p1Team];
        results.lostPartnerTheirPts += simPts[1 - p1Team];
      } else {
        results.lostOppYourPts += simPts[p1Team];
        results.lostOppTheirPts += simPts[1 - p1Team];
      }
    }

    // Evaluate bid outcome
    const bidderTeamIndex = isMoon ? bidWinnerSeat : (bidWinnerSeat % 2 === 0 ? 0 : 1);
    const bidderPoints = sim.team_points[bidderTeamIndex];

    let bidMade = false;
    if (contract === "NELLO") {
      bidMade = (sim.tricks_team ? sim.tricks_team[bidderTeamIndex].length === 0 : false);
      if (bidMade) results.nelloWon++;
      else results.nelloLost++;
    } else if (!isPartial) {
      bidMade = bidderPoints >= bid;
    }

    // For partial mode: check cumulative score against bid
    if (isPartial && contract !== "NELLO") {
      const existScores = results.existingScores;
      const cumulBidder = existScores[bidderTeamIndex] + simPts[bidderTeamIndex];
      bidMade = cumulBidder >= bid;

      // Check if we set opponent's bid
      if (bidWinnerSeat !== 0 && !isMoon) {
        const oppBidderTeam = bidderTeamIndex;
        const cumulOppBidder = existScores[oppBidderTeam] + simPts[oppBidderTeam];
        const maxPts = 51;
        const totalSoFar = existScores.reduce((a,b) => a+b, 0) + simPts.reduce((a,b) => a+b, 0);
        const remaining = maxPts - totalSoFar;
        if (cumulOppBidder + remaining < bid) results.setOppBidCount++;
      }
    }

    // Classify
    if (inControl) {
      results.keptControl++;
      if (bidMade) results.keptControlBidMade++;
    } else if (controlLostTo === 'partner') {
      results.lostToPartner++;
      if (bidMade) results.lostToPartnerBidMade++;
    } else {
      results.lostToOpponent++;
      if (bidMade) results.lostToOpponentBidMade++;
    }

    if (!isPartial) {
      if (bidMade) {
        results.totalBidMade++;
        results.scoreWhenMade += bidderPoints;
        results.madeCount++;
      } else {
        results.scoreWhenFailed += bidderPoints;
        results.failedCount++;
        if (contract !== "NELLO") {
          const totalAwarded = sim.team_points.reduce((a,b) => a+b, 0);
          const maxPts = isMoon ? 21 : 51;
          if (bidderPoints + (maxPts - totalAwarded) < bid) results.setCount++;
        }
      }
    } else {
      if (bidMade) { results.totalBidMade++; results.madeCount++; }
      else { results.failedCount++; }
    }
  }

  // --- Display results ---
  function mcDisplayResults(r, contract) {
    const div = document.getElementById('mcResults');
    div.style.display = 'block';

    const orderStr = mcSelectedOrder.map(idx => {
      const t = mcPlayerHand[idx];
      return t[0] + '-' + t[1];
    }).join(', ');

    const g = session.game;
    let trumpStr = 'NT';
    if (g.trump_mode === 'PIP') trumpStr = g.trump_suit + 's';
    else if (g.trump_mode === 'DOUBLES') trumpStr = 'Doubles';

    const bid = session.current_bid || 0;
    const pct = (n, d) => d > 0 ? (n / d * 100).toFixed(1) + '%' : '0%';
    const avg = (s, c) => c > 0 ? (s / c).toFixed(1) : '--';

    let html = '';

    // Header
    html += '<div style="background:rgba(0,0,0,0.2);border-radius:10px;padding:10px;margin-bottom:8px;">';
    html += '<div style="font-size:13px;font-weight:700;color:#fbbf24;margin-bottom:6px;">';
    html += r.isPartial ? 'CONTROL ANALYSIS' : 'MONTE CARLO RESULTS';
    html += ' (' + r.total + ' sims)</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px;">Play order: ' + orderStr;
    if (r.isPartial) html += ' (' + r.tilesPlayed + '/' + mcPlayerHand.length + ' tiles)';
    html += '</div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,0.7);">Trump: ' + trumpStr + ' | Bid: ' + bid + (contract === 'NELLO' ? ' | Nel-O' : '') + '</div>';
    html += '</div>';

    if (contract === 'NELLO' && !r.isPartial) {
      html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;margin-bottom:8px;">';
      html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">NEL-O RESULTS</div>';
      html += mcResultRow('Won (0 tricks taken)', r.nelloWon, r.total, '#4ade80');
      html += mcResultRow('Lost (caught a trick)', r.nelloLost, r.total, '#f87171');
      html += '</div>';
    } else {
      // Control analysis
      html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;margin-bottom:8px;">';
      html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">CONTROL</div>';

      html += mcResultRow('Kept full control', r.keptControl, r.total, '#4ade80');
      if (r.keptControl > 0 && !r.isPartial) {
        html += mcSubRow('Bid made', r.keptControlBidMade, r.keptControl);
      }

      if (!r.isMoon) {
        html += mcResultRow('Lost to PARTNER', r.lostToPartner, r.total, '#fbbf24');
        if (r.lostToPartner > 0 && !r.isPartial) {
          html += mcSubRow('Bid made', r.lostToPartnerBidMade, r.lostToPartner);
        }
      }

      html += mcResultRow('Lost to OPPONENT', r.lostToOpponent, r.total, '#f87171');
      if (r.lostToOpponent > 0 && !r.isPartial) {
        html += mcSubRow('Bid made', r.lostToOpponentBidMade, r.lostToOpponent);
      }
      html += '</div>';

      // Points breakdown per scenario
      html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;margin-bottom:8px;">';
      html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">POINTS BREAKDOWN</div>';

      if (r.isMoon) {
        // Moon: individual scores
        var pNames = ['You (P1)', 'P2', 'P3'];
        var scenarios = [
          { label: 'Kept control', count: r.keptControl, scores: r.moonScores.kept, color: '#4ade80' },
          { label: 'Lost to opp', count: r.lostToOpponent, scores: r.moonScores.lostOpp, color: '#f87171' }
        ];
        scenarios.forEach(function(sc){
          if (sc.count === 0) return;
          html += '<div style="font-size:11px;font-weight:600;color:' + sc.color + ';margin-bottom:4px;">' + sc.label + ' (' + sc.count + ' sims):</div>';
          for (var pi = 0; pi < 3; pi++) {
            var avgPts = avg(sc.scores[pi], sc.count);
            var cumul = (r.existingScores[pi] + (sc.count > 0 ? sc.scores[pi] / sc.count : 0)).toFixed(1);
            html += '<div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.7);padding-left:12px;margin-bottom:2px;">';
            html += '<span>' + pNames[pi] + ': ' + avgPts + ' pts</span>';
            html += '<span>Cumulative: ' + cumul + '</span>';
            html += '</div>';
          }
        });
      } else {
        // Team game: your team vs their team
        var scenarios = [
          { label: 'Kept control', count: r.keptControl, yourPts: r.keptControlYourPts, theirPts: r.keptControlTheirPts, color: '#4ade80' },
          { label: 'Lost to partner', count: r.lostToPartner, yourPts: r.lostPartnerYourPts, theirPts: r.lostPartnerTheirPts, color: '#fbbf24' },
          { label: 'Lost to opponent', count: r.lostToOpponent, yourPts: r.lostOppYourPts, theirPts: r.lostOppTheirPts, color: '#f87171' }
        ];

        // Table header
        html += '<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 80px;gap:2px;font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px;padding:0 2px;">';
        html += '<span></span><span style="text-align:center;">Your Pts</span><span style="text-align:center;">Opp Pts</span><span style="text-align:center;">Cumul You</span><span style="text-align:center;">Cumul Opp</span>';
        html += '</div>';

        scenarios.forEach(function(sc){
          if (sc.count === 0) return;
          var yourAvg = avg(sc.yourPts, sc.count);
          var theirAvg = avg(sc.theirPts, sc.count);
          var cumulYou = (r.existingScores[0] + (sc.count > 0 ? sc.yourPts / sc.count : 0)).toFixed(1);
          var cumulOpp = (r.existingScores[1] + (sc.count > 0 ? sc.theirPts / sc.count : 0)).toFixed(1);
          html += '<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 80px;gap:2px;font-size:10px;margin-bottom:3px;padding:4px 2px;background:rgba(255,255,255,0.03);border-radius:4px;">';
          html += '<span style="color:' + sc.color + ';font-weight:600;">' + sc.label + '</span>';
          html += '<span style="text-align:center;color:rgba(255,255,255,0.8);">' + yourAvg + '</span>';
          html += '<span style="text-align:center;color:rgba(255,255,255,0.8);">' + theirAvg + '</span>';
          html += '<span style="text-align:center;color:rgba(255,255,255,0.8);">' + cumulYou + '</span>';
          html += '<span style="text-align:center;color:rgba(255,255,255,0.8);">' + cumulOpp + '</span>';
          html += '</div>';
        });
      }
      html += '</div>';

      // Bid outcome stats
      if (r.isPartial) {
        html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;margin-bottom:8px;">';
        html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">BID OUTCOME (cumulative)</div>';
        html += mcResultRow('Made bid (' + session.current_bid + ')', r.totalBidMade, r.total, '#4ade80');
        if (r.setOppBidCount > 0) {
          html += mcResultRow('Set opponent bid', r.setOppBidCount, r.total, '#a78bfa');
        }
        html += '</div>';
      } else {
        // Full mode overall
        html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;margin-bottom:8px;">';
        html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">OVERALL</div>';
        html += mcResultRow('Bid made', r.totalBidMade, r.total, '#4ade80');
        html += mcResultRow('Set (early loss)', r.setCount, r.total, '#f87171');
        html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">';
        html += '<span>Avg when made: ' + Math.min(51, parseFloat(avg(r.scoreWhenMade, r.madeCount))).toFixed(1) + '</span>';
        html += '<span>Avg when failed: ' + avg(r.scoreWhenFailed, r.failedCount) + '</span>';
        html += '</div>';
        html += '</div>';
      }

      // Trick where control was lost
      var hasLostData = false;
      for (var i = 1; i <= 6; i++) {
        if (r.trickControlLost[i] > 0) { hasLostData = true; break; }
      }
      if (hasLostData) {
        html += '<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:10px;">';
        html += '<div style="font-size:12px;font-weight:700;color:#60a5fa;margin-bottom:8px;">CONTROL LOST ON TRICK</div>';
        var totalLost = r.lostToPartner + r.lostToOpponent;
        for (var i = 1; i <= 6; i++) {
          if (r.trickControlLost[i] > 0) {
            html += mcResultRow('Trick ' + i, r.trickControlLost[i], totalLost, '#a78bfa');
          }
        }
        html += '</div>';
      }
    }

    div.innerHTML = html;
    // Show copy button
    document.getElementById('mcCopyRow').style.display = 'block';
  }

  function mcResultRow(label, count, total, color) {
    const pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
      '<div style="flex:1;font-size:11px;color:rgba(255,255,255,0.9);">' + label + '</div>' +
      '<div style="font-size:11px;font-weight:700;color:' + color + ';">' + count + '/' + total + ' (' + pct + '%)</div>' +
      '</div>';
  }

  function mcSubRow(label, count, total) {
    const pct = total > 0 ? (count / total * 100).toFixed(1) : '0.0';
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;padding-left:16px;">' +
      '<div style="flex:1;font-size:10px;color:rgba(255,255,255,0.6);">' + label + '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.6);">' + count + '/' + total + ' (' + pct + '%)</div>' +
      '</div>';
  }

})();

