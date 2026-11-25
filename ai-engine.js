// ============================================================================
// THE GAVEL HOUSE — AI BIDDING BRAIN, HUDDLES, GEMINI PROXY, TRADES & COACHES
// ============================================================================
// ==================== 4. BALANCED 10-TEAM AI BRAINS (FAIR PURSE DISTRIBUTION + INFLATION) ====================
function teamRoleCounts(team){
  const c = { B:0, WK:0, AR:0, BW:0, OS:0, eliteBatWK:0, eliteAR:0, eliteBowl:0, eliteWK:0, spinners:0, eliteSpin:0, elitePace:0 };
  team.squad.forEach(pid => {
    const p = state.players[pid];
    if (!p) return;
    c[p.role]++;
    if (p.os) c.OS++;
    const spin = isSpinner(p);
    if (spin) c.spinners++;
    if (p.ovr >= 85) {
      if (p.role === 'B' || p.role === 'WK') c.eliteBatWK++;
      if (p.role === 'WK') c.eliteWK++;
      if (p.role === 'AR') c.eliteAR++;
      if (p.role === 'BW') c.eliteBowl++;
      if (spin && (p.role === 'BW' || p.role === 'AR')) c.eliteSpin++;
      if (!spin && p.role === 'BW') c.elitePace++;
    }
  });
  return c;
}

function maxSpendable(team){
  const curLen = team.squad.length;
  if (curLen >= 25) return 0;
  const minLeftAfterThis = Math.max(0, 18 - (curLen + 1));
  return Math.min(MAX_BID_CAP, Math.max(0, team.purse - minLeftAfterThis * 30));
}

function evaluatePlayerForTeam(team, p, stretch=1.0){
  const counts = teamRoleCounts(team);
  if (team.squad.length >= 25) return { val:0, strategy:'FULL', reason:'Squad full (25/25).' };
  const commitment = state.lotCommitments && state.lotCommitments[p.id] ? state.lotCommitments[p.id][team.id] : null;
  if (commitment === 'PASS') return { val:0, strategy:'PASS_WORD', reason:`Sticking to our word — passing on ${p.name}.` };
  if (p.os && counts.OS >= 8) return { val:0, strategy:'OS_FULL', reason:'Overseas cap full (8/8).' };
  const cap = maxSpendable(team);
  if (cap < p.base) return { val:0, strategy:'LOW_PURSE', reason:'Saving purse for remaining slots.' };

  // STRICT ROLE-BALANCE GUARDRAILS (Stops hoarding 4 marquee WKs or 0 bowlers!)
  if (p.role === 'WK' && counts.WK >= 3) {
    return { val:0, strategy:'STACKED', reason:'Already have 3 Wicket-Keepers.' };
  }
  if (p.role === 'WK' && p.ovr >= 85 && counts.eliteWK >= 1) {
    // Never hoard 2+ marquee keepers unless every other team already has one
    const needyWKTeams = state.teams.filter(x => x.id !== team.id && teamRoleCounts(x).WK === 0 && maxSpendable(x) >= p.base).length;
    if (needyWKTeams > 0) return { val:0, strategy:'STACKED', reason:'Already locked our marquee keeper.' };
  }

  const target = team.targets[p.role] || 6;
  const needRatio = Math.max(0, (target - counts[p.role]) / target);
  if (counts[p.role] >= target + 1) {
    return { val:0, strategy:'STACKED', reason:`Already stacked at ${roleLabel(p.role)}.` };
  }

  // Prevent hoarding too many Tier-S/A stars in ONE department while starving another!
  const isElite = p.ovr >= 85;
  let balanceBoost = 1.0;
  if (isElite) {
    if (p.role === 'WK' && counts.WK === 0) balanceBoost *= 1.24;
    if (p.role === 'BW' && counts.eliteBowl === 0 && counts.eliteBatWK >= 1) balanceBoost *= 1.28;
    if (p.role === 'BW' && counts.eliteBowl >= 3 && counts.eliteBatWK <= 1) balanceBoost *= 0.62;
    if ((p.role === 'B' || p.role === 'WK') && counts.eliteBatWK === 0 && counts.eliteBowl >= 1) balanceBoost *= 1.28;
    if ((p.role === 'B' || p.role === 'WK') && counts.eliteBatWK >= 3 && counts.eliteBowl <= 1) balanceBoost *= 0.60;
    if (p.role === 'AR' && counts.eliteAR === 0) balanceBoost *= 1.16;
    if (p.role === 'AR' && counts.eliteAR >= 2 && (counts.eliteBowl === 0 || counts.eliteBatWK === 0)) balanceBoost *= 0.72;
  }

  // V38 Split-Stat & T20 Phase Awareness (Death Pace, Spin Grip, Finisher SR & PP Openers!)
  const homeL = (team.home || '').toLowerCase();
  const isSpinHome = homeL.includes('chepauk') || homeL.includes('ekana') || homeL.includes('jaipur');
  const isFlatHome = homeL.includes('chinnaswamy') || homeL.includes('uppal') || homeL.includes('wankhede');
  if (p.phase === 'Death Pace' && (p.econ || 8.5) <= 7.8) balanceBoost *= 1.10;
  const lhbCount = team.squad.filter(id => state.players[id]?.batHand === 'L' && (state.players[id]?.role === 'B' || state.players[id]?.role === 'WK')).length;
  const lafCount = team.squad.filter(id => state.players[id]?.bowlStyle === 'LAF').length;
  if (p.batHand === 'L' && (p.role === 'B' || p.role === 'WK') && lhbCount < 2) balanceBoost *= 1.07;
  if (p.bowlStyle === 'LAF' && lafCount === 0) balanceBoost *= 1.08;
  if (isSpinHome && (p.phase === 'Mystery Spin' || p.phase === 'Middle Spin' || p.phase === 'Spin AR')) balanceBoost *= 1.12;
  if (isFlatHome && (p.phase === 'Death Finisher' || p.phase === 'WK Finisher' || p.phase === 'PP Opener') && (p.sr || 130) >= 145) balanceBoost *= 1.10;

  // Spin vs Pace Sub-Role Balance (Every team MUST get quality spinners AND quality pacers!)
  const spin = isSpinner(p);
  if (spin && (p.role === 'BW' || p.role === 'AR')) {
    if (counts.eliteSpin === 0 && p.ovr >= 82) balanceBoost *= 1.22;
    else if (counts.spinners >= 4) balanceBoost *= 0.65;
  } else if (!spin && p.role === 'BW') {
    if (counts.elitePace === 0 && p.ovr >= 82) balanceBoost *= 1.22;
    else if (counts.elitePace >= 3 && counts.eliteSpin === 0) balanceBoost *= 0.72;
  }

  // Budget Discipline & Smart Purse Utilization (spend purse properly across all sets, not ₹18 Cr left idle!)
  const megaBuys = team.squad.filter(id => state.players[id] && state.players[id].soldPrice >= 1500).length;
  const superBuys = team.squad.filter(id => state.players[id] && state.players[id].soldPrice >= 1800).length;
  const slotsLeft = Math.max(1, 22 - team.squad.length);
  const avgPerSlot = team.purse / slotsLeft;

  const avgPurse = state.teams.reduce((s,x)=>s+x.purse, 0) / 10;
  const purseFactor = Math.max(0.78, Math.min(1.26, team.purse / Math.max(1500, avgPurse)));

  let val = p.tier==='S' ? p.fairVal * 0.94 : p.tier==='A' ? p.fairVal * 0.94 : p.fairVal * 0.92;
  if (!p.os && (p.tier === 'S' || p.tier === 'A')) val *= 1.08;
  if (p.role === 'AR' && !p.os && p.ovr >= 82) val *= 1.06;

  let mult = (0.76 + needRatio * 0.28) * purseFactor * balanceBoost;
  if (team.pref && team.pref.includes(p.role)) mult *= 1.05;

  if (team.id === 'RR' || team.id === 'GT' || team.id === 'CSK') {
    if (megaBuys >= 1) mult *= 0.85;
  } else if (team.id === 'PBKS' || team.id === 'RCB') {
    if (superBuys === 0 && p.tier === 'S') mult *= 1.07;
    else if (megaBuys >= 2) mult *= 0.80;
  } else {
    if (megaBuys >= 2) mult *= 0.78;
    else if (megaBuys === 1) mult *= 0.88;
  }

  const hash = ((team.id.charCodeAt(0) * 41 + team.id.charCodeAt(1) * 19 + p.id * 23 + (state.seed || 17)) % 25) - 12;
  mult *= (1 + hash / 100) * stretch;

  const rawSpendable = Math.max(0, team.purse - Math.max(0, 18 - (team.squad.length + 1)) * 30);
  let hardTierCap = p.tier==='S'
    ? (superBuys === 0 ? Math.min(MAX_BID_CAP, rawSpendable * 0.25) : Math.min(1750, rawSpendable * 0.20))
    : p.tier==='A'
      ? (megaBuys < 2 ? Math.min(1700, rawSpendable * 0.20) : Math.min(1250, rawSpendable * 0.16))
      : p.tier==='B'
        ? Math.min(1050, rawSpendable * 0.15)
        : Math.min(500, rawSpendable * 0.10);

  if (megaBuys >= 1) hardTierCap = Math.min(hardTierCap, avgPerSlot * 3.4);
  hardTierCap = Math.min(MAX_BID_CAP, hardTierCap * stretch);

  const commitBoost = (commitment === 'BID') ? 225 : 0;
  const scoutFitBonus = (state.scoutSuitability && state.scoutSuitability[p.id] && state.scoutSuitability[p.id][team.id]) ? state.scoutSuitability[p.id][team.id] : 0;
  const boost = ((state.curId === p.id && state.persuasionBoost && state.persuasionBoost[team.id]) ? state.persuasionBoost[team.id] : 0) + commitBoost + scoutFitBonus;
  let finalVal = Math.min(MAX_BID_CAP, cap, Math.max(p.base, Math.min(val * mult + boost, Math.max(p.base, hardTierCap + boost))));
  finalVal = Math.min(MAX_BID_CAP, Math.round(finalVal / 5) * 5);

  let strategy = needRatio >= 0.5 ? 'CORE_TARGET' : 'VALUE';
  if (p.tier === 'S' || p.tier === 'A') {
    const inflateRoll = ((team.id.charCodeAt(0) * 17 + p.id * 31 + (state.seed || 7)) % 100) / 100;
    if (needRatio < 0.45 && team.purse > 5000 && inflateRoll < team.inflator) {
      const inflateCap = Math.min(1800, cap, Math.round((p.fairVal * 0.82) / 5) * 5);
      if (inflateCap > finalVal) {
        finalVal = inflateCap;
        strategy = 'INFLATE';
      }
    }
  }

  const reason = strategy === 'INFLATE'
    ? `😈 Mind game: driving price up to drain rival purse!`
    : needRatio >= 0.55
      ? `🎯 Prime ${roleLabel(p.role)} target (${counts[p.role]}/${target}) for ${team.home}.`
      : `Smart balanced fit for ${team.home}.`;
  return { val: finalVal, strategy, reason };
}

// ==================== 5. TEAM STAFF HUDDLE (2-MIN TACTICAL TIMEOUT) ====================
let huddleResumeAIAuct = false;
async function startTeamHuddle(team, p, nextBid, resumeAutoAfter=false){
  stopAutoBid();
  if (typeof aiAuctPaused !== 'undefined' && state.humanTeamId && !aiAuctPaused) {
    huddleResumeAIAuct = true;
    aiAuctPaused = true;
    aiAuctLoopToken++;
    if (typeof updateAIAuctButtons === 'function') updateAIAuctButtons();
    if (typeof setAIAuctioneerStatus === 'function') setAIAuctioneerStatus(`⏸️ Auction paused — <b>${team.id}</b> is in a staff huddle...`);
  } else {
    huddleResumeAIAuct = false;
  }
  clearHuddleTimers();
  huddleResumeAuto = resumeAutoAfter;
  huddleSecLeft = 120;

  const ev = evaluatePlayerForTeam(team, p, 1.14);
  const c = teamRoleCounts(team);
  let willStretch = ev.val >= nextBid && nextBid <= MAX_BID_CAP;
  const [coach, specialist, owner] = team.staff;

  const box = document.getElementById('huddleBox');
  box.classList.add('open');
  document.getElementById('huddleTitle').innerHTML = `🧠 <span style="color:${team.color}">${team.id}</span> WAR-ROOM HUDDLE — 2:00 TIMEOUT`;
  document.getElementById('huddleSub').textContent = `Debating ${p.name} at ${fmtCr(nextBid)} • Remaining Purse: ${fmtCr(team.purse)}`;
  const feed = document.getElementById('huddleFeed');
  feed.innerHTML = `<div class="h-line" style="border-left-color:${team.color};opacity:0.75">🎙️ ${getSavedApiKey() ? 'Live Gemini AI tuning into' : 'Tuning into'} ${team.id} war-room mics...</div>`;

  updateHuddleClock();
  huddleInterval = setInterval(() => {
    huddleSecLeft--;
    updateHuddleClock();
    if (huddleSecLeft <= 0) finishHuddleNow();
  }, 1000);

  addReaction(`⏱️ <b style="color:${team.color}">${team.id}</b> called a 2-minute tactical huddle to debate ${p.name} at ${fmtCr(nextBid)}!`, team.color);
  speakFemale(`${team.name} management is in a deep huddle discussing the next bid.`);

  let lines = null;
  if (getSavedApiKey()) {
    const squadNames = team.squad.slice(0, 6).map(id => state.players[id]?.name).filter(Boolean).join(', ') || 'None yet';
    const prompt = `You are simulating a real 2-minute IPL Mega Auction war-room huddle for ${team.name} (${team.id}, Home: ${team.home}).
Staff speaking: 1) ${coach}, 2) ${specialist}, 3) ${owner}.
Player on podium: ${p.name} (${roleLabel(p.role)}, ${p.os?'Overseas':'Indian'}, Tier ${p.tier}, OVR ${p.ovr}).
Current Bid: ${fmtCr(state.curBid)} (held by ${state.curLeader || 'None'}). Next bid needed: ${fmtCr(nextBid)}.
${team.id} Purse: ${fmtCr(team.purse)}, Squad: ${team.squad.length}/25 (Bat:${c.B}, WK:${c.WK}, AR:${c.AR}, Bowl:${c.BW}, OS:${c.OS}/8). Key buys: ${squadNames}.
Internal valuation ceiling: ${fmtCr(ev.val)}.
Write a realistic, punchy 3-line dialogue between the 3 staff members debating whether to stretch their budget or walk away, and decide verdict ("STRETCH" or "WALK_AWAY").
Return ONLY valid JSON: {"lines": ["<b>Coach:</b> ...", "<b>Specialist:</b> ...", "<b>Owner:</b> ..."], "verdict": "STRETCH" or "WALK_AWAY", "extraLakhs": 150}`;
    const aiRes = await callGeminiJSON(prompt, 0.85, 5500);
    if (aiRes && Array.isArray(aiRes.lines) && aiRes.lines.length >= 2) {
      willStretch = aiRes.verdict === 'STRETCH' && nextBid <= MAX_BID_CAP && maxSpendable(team) >= nextBid;
      const extraL = Math.min(350, Math.max(100, parseInt(aiRes.extraLakhs || 175, 10)));
      if (willStretch) {
        if (!state.persuasionBoost) state.persuasionBoost = {};
        state.persuasionBoost[team.id] = (state.persuasionBoost[team.id] || 0) + extraL;
      } else {
        if (!state.lotCommitments[p.id]) state.lotCommitments[p.id] = {};
        state.lotCommitments[p.id][team.id] = 'PASS';
      }
      lines = [
        ...aiRes.lines.slice(0, 3),
        `<b style="color:${willStretch?'#34d399':'#f87171'}">📋 FINAL HUDDLE VERDICT (${team.id}):</b> ${willStretch ? `✅ STRETCH BUDGET (+${fmtCr(extraL)}) & STAY IN THE FIGHT!` : `🛑 WALK AWAY — STICKING TO DISCIPLINE!`}`
      ];
    }
  }

  if (!lines) {
    if (!willStretch) {
      if (!state.lotCommitments[p.id]) state.lotCommitments[p.id] = {};
      state.lotCommitments[p.id][team.id] = 'PASS';
    }
    lines = [
      `<b>${coach}:</b> "Hold the paddle! ${p.name} is already at ${fmtCr(state.curBid)}. Next bid is ${fmtCr(nextBid)} — do we stretch for him?"`,
      `<b>${specialist}:</b> "Squad check: ${c.B} Bat, ${c.WK} WK, ${c.AR} AR, ${c.BW} Bowl, ${c.OS}/8 OS. For ${team.home}, a Tier-${p.tier} ${roleLabel(p.role)} like ${p.name} is huge."`,
      `<b>${owner}:</b> "We have ${fmtCr(team.purse)} left for ${Math.max(0, 18 - team.squad.length)} mandatory slots. ${willStretch ? `Let's stretch up to ${fmtCr(ev.val)} — we can't let a rival steal him!` : `That's above our valuation (${fmtCr(ev.val)}). Let them burn their purse and walk away!`}"`,
      `<b style="color:${willStretch?'#34d399':'#f87171'}">📋 FINAL HUDDLE VERDICT (${team.id}):</b> ${willStretch ? `✅ STRETCH BUDGET & STAY IN THE FIGHT!` : `🛑 WALK AWAY — SAVE PURSE FOR NEXT TARGETS!`}`
    ];
  }

  feed.innerHTML = '';
  const myHuddleToken = ++speechQueueToken;
  (async () => {
    // Brief pause so the initial huddle announcement finishes cleanly before staff start talking
    await new Promise(r => setTimeout(r, voiceOn ? 1800 : 400));
    for (let idx = 0; idx < lines.length; idx++) {
      if (myHuddleToken !== speechQueueToken) break;
      const txt = lines[idx];
      feed.innerHTML += `<div class="h-line" style="border-left-color:${team.color}">${txt}</div>`;
      feed.scrollTop = feed.scrollHeight;
      beep(480 + idx * 60, 0.06, 'sine', 0.06);

      if (voiceOn) {
        const prof = idx < 3 ? getTeamVoiceProfile(team.id, idx) : { gender: 'male', pitch: 0.70, rate: 1.00 };
        await speakAsync(txt, prof.gender, { isLiveBid: false, pitch: prof.pitch, rate: prof.rate });
      } else {
        await new Promise(r => setTimeout(r, acceleratorMode ? 450 : 900));
      }
    }
    // Auto-close huddle & auto-resume auction once all statements finish!
    if (myHuddleToken === speechQueueToken) {
      await new Promise(r => setTimeout(r, acceleratorMode ? 550 : 1200));
      if (myHuddleToken === speechQueueToken) finishHuddleNow();
    }
  })();
}

function updateHuddleClock(){
  const m = String(Math.floor(huddleSecLeft / 60)).padStart(2, '0');
  const s = String(huddleSecLeft % 60).padStart(2, '0');
  document.getElementById('huddleTimer').textContent = `${m}:${s}`;
}
function clearHuddleTimers(){
  stopDiscussionSpeech();
  if (huddleInterval) { clearInterval(huddleInterval); huddleInterval = null; }
  huddleStepTimers.forEach(t => clearTimeout(t));
  huddleStepTimers = [];
}
function finishHuddleNow(){
  clearHuddleTimers();
  document.getElementById('huddleBox').classList.remove('open');
  if (huddleResumeAIAuct && state.humanTeamId && state.curId !== null) {
    huddleResumeAIAuct = false;
    aiAuctPaused = false;
    startAIAuctioneerLoop();
    return;
  }
  if (huddleResumeAuto && state.curId !== null) {
    huddleResumeAuto = false;
    startAutoBidLoop();
  }
}
function closeHuddle(){
  clearHuddleTimers();
  huddleResumeAuto = false;
  document.getElementById('huddleBox').classList.remove('open');
}
function triggerManualHuddle(){
  if (state.curId === null) return;
  const p = state.players[state.curId];
  const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);
  const rivals = state.teams.filter(t => t.id !== state.curLeader && t.id !== state.humanTeamId);
  rivals.sort((a,b) => evaluatePlayerForTeam(b, p, 1.0).val - evaluatePlayerForTeam(a, p, 1.0).val);
  startTeamHuddle(rivals[0] || state.teams[0], p, nextB, false);
}

// ==================== 6. AUCTION FLOW (VOICE-SYNCED AUTO BID + REACTIONS) ====================
function getNextAvailableId(){
  const p = state.players.find(x => x.status === 'AVAIL');
  return p ? p.id : null;
}
function callNextPlayer(){
  const id = getNextAvailableId();
  if (id === null) { showToast('All 520 players processed! Try Recall Unsold or Season.'); return; }
  callPlayerById(id);
}
function callRandomPlayer(){
  const avail = state.players.filter(x => x.status === 'AVAIL');
  if (!avail.length) { showToast('No available players left!'); return; }
  callPlayerById(avail[Math.floor(Math.random() * avail.length)].id);
}

function callPlayerById(id){
  stopAutoBid();
  closeHuddle();
  const p = state.players[id];
  if (!p || p.status !== 'AVAIL') { showToast('Player already processed.'); return; }
  state.curId = id;
  state.curBid = p.base;
  state.curLeader = null;
  state.gavelStage = 0;
  state.biddersThisLot = [];
  state.bidHistory = [];
  state.passedTeams = [];
  restartBidTimer();
  state.overpayWarned = false;
  state.huddleDoneThisLot = false;
  state.inflatingTeam = null;
  state.persuasionBoost = {};
  if (!state.lotCommitments) state.lotCommitments = {};
  state.warLog = [{ text:`ON BLOCK: ${p.name} (${fmtCr(p.base)})`, hijack:false }];
  state.bidPoints = [{ bid: p.base, team: 'BASE', color: '#94a3b8' }];
  state.teams.forEach(t => t.chatter = t.id===state.humanTeamId ? 'Your turn to decide!' : 'Checking potential & budget...');
  document.documentElement.style.setProperty('--beam', '#f5c542');

  addReaction(`🏏 <b>${p.name}</b> (${p.set} • Tier ${p.tier} • Est. ${fmtCr(p.fairVal)}) walks onto the podium!`, '#f5c542');
  speakFemale(`Next player, ${p.name}, ${roleLabel(p.role)}, base price ${fmtSpeechPrice(p.base)}.`);
  if (state.wishlist && state.wishlist.includes(id)) {
    sfxHijack();
    showToast(`⭐ WISHLIST TARGET ON PODIUM: ${p.name}!`);
    addReaction(`⭐ <b>WISHLIST ALERT:</b> Your target <b>${p.name}</b> is now live on the podium!`, '#facc15');
  }
  switchView('stage');
  renderAll();
  saveState();
  scoutCurrentPlayer(false);
}

async function runBidRound(isAuto=false, forcedBid=null){
  if (state.curId === null) return false;
  if (state.curLeader && state.curBid >= MAX_BID_CAP) {
    if (isAuto) stopAutoBid();
    showToast(`🔒 ₹25.00 Cr MAX CAP REACHED! Drop the hammer for ${state.curLeader}!`);
    return false;
  }

  const p = state.players[state.curId];
  let reqBid = forcedBid !== null ? forcedBid : (state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);
  if (reqBid > MAX_BID_CAP) reqBid = MAX_BID_CAP;
  if (state.curLeader && reqBid <= state.curBid) {
    if (isAuto) stopAutoBid();
    showToast(`🔒 ₹25.00 Cr MAX CAP REACHED! Call SOLD for ${state.curLeader}.`);
    return false;
  }

  const interested = [];
  // Iterate in shuffled order so ties NEVER favour CSK/MI!
  shuffleArr(state.teams).forEach(t => {
    if (t.id === state.curLeader || t.id === state.humanTeamId || t.isHuman) return;
    const ev = evaluatePlayerForTeam(t, p, 1.0);
    if (ev.val >= reqBid) {
      interested.push({ team:t, val:ev.val, strategy:ev.strategy, reason:ev.reason });
    } else {
      if (state.inflatingTeam === t.id) {
        t.chatter = `😏 Mission done! Drained rivals to ${fmtCr(state.curBid)}, pulling out!`;
        addReaction(`😈 <b style="color:${t.color}">${t.id}</b> smirks and drops out: <i>"We only drove ${p.name}'s price up to drain ${state.curLeader}'s purse!"</i>`, t.color);
        state.inflatingTeam = null;
      } else {
        t.chatter = ev.val === 0 ? ev.reason : `Out at ${fmtCr(reqBid)} (cap ${fmtCr(ev.val)}).`;
      }
    }
  });

  if (interested.length === 0) {
    if (isAuto) stopAutoBid();
    showToast(state.curLeader ? `AI tables quiet! Call Going Once for ${state.curLeader}.` : 'No AI takers at this price.');
    renderTeams();
    return false;
  }

  if (!state.huddleDoneThisLot && reqBid >= 1300 && interested.length >= 1 && state.biddersThisLot.length >= 2) {
    state.huddleDoneThisLot = true;
    interested.sort((a,b) => b.val - a.val);
    startTeamHuddle(interested[0].team, p, reqBid, isAuto);
    return false;
  }

  interested.sort((a,b) => b.val - a.val);
  // REAL AUCTION MULTI-TEAM ROTATION: Let 3-5 interested teams enter the war instead of only #1 vs #2 ping-pong!
  const recentBidders = new Set((state.bidPoints || []).slice(-2).map(pt => pt.team));
  const freshEntrants = interested.filter(x => !recentBidders.has(x.team.id));
  let winner = interested[0];
  if (freshEntrants.length > 0 && Math.random() < 0.72) {
    // Pick among top 3 fresh interested tables so 3rd, 4th, 5th teams actively jump in!
    const pool = freshEntrants.slice(0, Math.min(3, freshEntrants.length));
    winner = pool[Math.floor(Math.random() * pool.length)];
  } else if (interested.length >= 2 && Math.random() < 0.45) {
    const pool = interested.slice(0, Math.min(3, interested.length));
    winner = pool[Math.floor(Math.random() * pool.length)];
  }
  state.curBid = reqBid;
  state.curLeader = winner.team.id;
  state.gavelStage = 0;
  if (!state.biddersThisLot.includes(winner.team.id)) state.biddersThisLot.push(winner.team.id);
  if (winner.strategy === 'INFLATE') state.inflatingTeam = winner.team.id;
  if (state.lotCommitments && state.lotCommitments[p.id] && state.lotCommitments[p.id][winner.team.id] === 'BLUFF') {
    state.lotCommitments[p.id][winner.team.id] = 'BID';
    addReaction(`😈 <b style="color:${winner.team.color}">${winner.team.id} BLUFF EXPOSED!</b> Said they were out on ${p.name}, now they jump in at <b>${fmtCr(reqBid)}</b>!`, winner.team.color);
  }

  winner.team.chatter = reqBid >= MAX_BID_CAP
    ? `🔒 MAX CAP ₹25.00 Cr! ${winner.reason}`
    : `✋ PADDLE UP ${fmtCr(reqBid)}! ${winner.reason}`;
  winner.team.lastFlash = Date.now();
  state.warLog.unshift({ text:`${winner.team.id} ${fmtCr(reqBid)}`, hijack:false, inflate: winner.strategy==='INFLATE' });
  if (!state.bidPoints) state.bidPoints = []; state.bidPoints.push({ bid: reqBid, team: winner.team.id, color: winner.team.color });
  state.warLog = state.warLog.slice(0, 7);

  if (!state.overpayWarned && reqBid >= p.fairVal * 1.18 && reqBid >= 800) {
    state.overpayWarned = true;
    const watchers = shuffleArr(state.teams.filter(t => t.id !== winner.team.id && !interested.some(x=>x.team.id===t.id)));
    if (watchers[0]) addReaction(`🤯 <b style="color:${watchers[0].color}">${watchers[0].id} Table:</b> <i>"${fmtCr(reqBid)} for ${p.name}?! Way overpriced — let ${winner.team.id} burn their purse!"</i>`, watchers[0].color);
    if (watchers[1]) addReaction(`📊 <b style="color:${watchers[1].color}">${watchers[1].id} Analyst:</b> <i>"Our fair value was ${fmtCr(p.fairVal)}. ${winner.team.id} is paying a heavy marquee tax here."</i>`, watchers[1].color);
  }

  document.documentElement.style.setProperty('--beam', winner.team.color);
  sfxPaddle();
  renderAll();
  saveState();

  if (reqBid >= MAX_BID_CAP) {
    stopAutoBid();
    showToast(`🔒 ₹25.00 Cr MAX CAP reached by ${winner.team.id}! Call Going Once / SOLD.`);
    await speakFemale(`Maximum 25 Crore cap reached by ${winner.team.name}! No further bids.`);
    return false;
  } else {
    if (state.humanTeamId && (acceleratorMode || (typeof aiAuctSpeedLevel !== 'undefined' && aiAuctSpeedLevel >= 2))) {
      speakBidFemale(`${fmtSpeechPrice(reqBid)}, ${winner.team.name}.`); // non-blocking so next bid is instant!
    } else {
      await speakBidFemale(`${fmtSpeechPrice(reqBid)}, ${winner.team.name}.`);
    }
    return true;
  }
}

function toggleAutoBid(){
  if (autoRunning) { stopAutoBid(); return; }
  if (state.curId === null) return;
  startAutoBidLoop();
}
async function startAutoBidLoop(){
  if (autoRunning || state.curId === null) return;
  autoRunning = true;
  document.getElementById('btnAutoBid').textContent = '⏸ Stop Auto';
  while (autoRunning && state.curId !== null) {
    const ok = await runBidRound(true);
    if (!ok || !autoRunning) break;
    await new Promise(r => setTimeout(r, acceleratorMode ? 240 : (voiceOn ? 320 : 650)));
  }
  stopAutoBid();
}
function stopAutoBid(){
  autoRunning = false;
  const b = document.getElementById('btnAutoBid');
  if (b) b.textContent = '▶ Auto Bid War';
}

function jumpBid(extraLakhs){
  if (state.curId === null) return;
  stopAutoBid();
  if (state.curLeader && state.curBid >= MAX_BID_CAP) { showToast('🔒 ₹25.00 Cr MAX CAP reached!'); return; }
  const target = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + extraLakhs : state.players[state.curId].base + extraLakhs);
  runBidRound(false, target);
}

function attemptLateHijack(stageLabel, stretchFactor, chance){
  if (state.curId === null || !state.curLeader) return false;
  if (state.curBid >= MAX_BID_CAP) return false;
  const p = state.players[state.curId];
  const nextB = Math.min(MAX_BID_CAP, state.curBid + nextInc(state.curBid));
  if (nextB <= state.curBid) return false;

  const candidates = [];
  shuffleArr(state.teams).forEach(t => {
    if (t.id === state.curLeader || t.id === state.humanTeamId || t.isHuman) return;
    const ev = evaluatePlayerForTeam(t, p, stretchFactor);
    if (ev.val >= nextB) candidates.push({ team:t, val:ev.val, reason:ev.reason });
  });
  if (candidates.length > 0 && Math.random() < chance) {
    candidates.sort((a,b) => b.val - a.val);
    const hijacker = candidates[0].team;
    state.curBid = nextB;
    state.curLeader = hijacker.id;
    state.gavelStage = 0;
    if (!state.biddersThisLot.includes(hijacker.id)) state.biddersThisLot.push(hijacker.id);
    hijacker.chatter = `⚡ LATE HIJACK on ${stageLabel}! Stretching to ${fmtCr(nextB)}!`;
    hijacker.lastFlash = Date.now();
    state.warLog.unshift({ text:`⚡ ${hijacker.id} HIJACK ${fmtCr(nextB)}`, hijack:true });
    if (!state.bidPoints) state.bidPoints = []; state.bidPoints.push({ bid: nextB, team: hijacker.id, color: hijacker.color });
    state.warLog = state.warLog.slice(0, 7);
    document.documentElement.style.setProperty('--beam', hijacker.color);
    sfxHijack();
    addReaction(`⚡ <b style="color:${hijacker.color}">${hijacker.id}</b> hijacks the gavel on <b>${stageLabel}</b> at ${fmtCr(nextB)}!`, hijacker.color);
    speakFemale(`Late bid! ${hijacker.name} jumps in at ${fmtSpeechPrice(nextB)}!`);
    pushTicker(`⚡ LATE HIJACK! ${hijacker.id} interrupts ${stageLabel} for ${p.name} at ${fmtCr(nextB)}!`);
    showToast(`⚡ ${hijacker.id} INTERRUPTED ${stageLabel} at ${fmtCr(nextB)}!`);
    renderAll();
    saveState();
    return true;
  }
  return false;
}

function callGoingOnce(){
  if (state.curId === null || !state.curLeader) { showToast('Need at least one bid first!'); return; }
  stopAutoBid();
  if (attemptLateHijack('GOING ONCE', 1.15, 0.46)) return;
  state.gavelStage = 1;
  sfxOnce();
  speakMale(`Going once, at ${fmtSpeechPrice(state.curBid)}.`);
  showToast(`Going once at ${fmtCr(state.curBid)} to ${state.curLeader}...`);
  renderPodium();
}

function callGoingTwice(){
  if (state.curId === null || !state.curLeader) { showToast('Need at least one bid first!'); return; }
  stopAutoBid();
  if (attemptLateHijack('GOING TWICE', 1.22, 0.34)) return;
  state.gavelStage = 2;
  sfxTwice();
  speakMale(`Going twice, at ${fmtSpeechPrice(state.curBid)}. Final call!`);
  showToast(`Going twice at ${fmtCr(state.curBid)}... Final call!`);
  renderPodium();
}

function hammerSold(){
  if (state.curId === null) return;
  stopAutoBid(); closeHuddle();
  if (!state.curLeader) { showToast('No bids yet — use Unsold instead.'); return; }
  const p = state.players[state.curId];
  const winTeam = state.teams.find(x => x.id === state.curLeader);
  if (winTeam.squad.length >= 25) { showToast(`${winTeam.id} already has 25 players!`); return; }
  const price = Math.min(MAX_BID_CAP, state.curBid);

  p.status = 'SOLD'; p.soldTo = winTeam.id; p.soldPrice = price;
  if (!state.soldOrder) state.soldOrder = [];
  state.soldOrder.unshift({ id:p.id, team:winTeam.id, price });
  if (price >= 1400) fireConfetti(winTeam.color);
  winTeam.purse = Math.max(0, winTeam.purse - price);
  winTeam.squad.push(p.id);
  winTeam.chatter = `🎉 Signed ${p.name} for ${fmtCr(price)}!`;

  const losers = shuffleArr(state.biddersThisLot.filter(id => id !== winTeam.id));
  const watchers = shuffleArr(state.teams.filter(t => t.id !== winTeam.id && !losers.includes(t.id)));
  const isHighPrice = price >= 1400 || price >= p.fairVal * 1.14;
  const isSteal = price <= p.fairVal * 0.80 && p.tier !== 'C';

  if (getSavedApiKey() && !quotaSaverOn) {
    // 100% Live Gemini AI Reactions — no manual hardcoded text!
    addReaction(`🔨 <b>SOLD:</b> ${p.name} joins <b style="color:${winTeam.color}">${winTeam.id}</b> for <b>${fmtCr(price)}</b>. <i>(10 tables reacting via Gemini AI...)</i>`, winTeam.color);
    fetchLiveSoldReactions(p, winTeam, price, losers, watchers);
  } else {
    const winStars = winTeam.squad.map(id => state.players[id]).filter(Boolean).sort((a,b) => b.ovr - a.ovr);
    const otherWinStars = winStars.filter(x => x.id !== p.id).slice(0, 2).map(x => x.name);
    losers.forEach((lid, idx) => {
      const lt = state.teams.find(x => x.id === lid);
      if (!lt) return;
      const msg = (isHighPrice && idx % 2 === 0)
        ? `Smiling! Made ${winTeam.id} burn ${fmtCr(price)} on ${p.name} — saved our ${fmtCr(lt.purse)}!`
        : `Gutted to miss ${p.name} to ${winTeam.id} — pivoting to Plan B for ${roleLabel(p.role)}.`;
      lt.chatter = msg;
      addReaction(`💬 <b style="color:${lt.color}">${lt.id}:</b> <i>"${msg}"</i>`, lt.color);
    });
    if (watchers[0] && otherWinStars.length) {
      const smsg = `Look at ${winTeam.id}'s lineup now: ${otherWinStars.join(' + ')} AND ${p.name}?!`;
      watchers[0].chatter = `😱 ${smsg}`;
      addReaction(`😱 <b style="color:${watchers[0].color}">${watchers[0].id}:</b> <i>"${smsg}"</i>`, watchers[0].color);
    }
    addReaction(`🔨 <b>SOLD:</b> ${p.name} joins <b style="color:${winTeam.color}">${winTeam.id}</b> for ${fmtCr(price)}.`, winTeam.color);
  }

  sfxGavel();
  setTimeout(()=>sfxCrowdRoar(1.3), 160);
  speakMale(`Sold! ${p.name} goes to ${winTeam.name} for ${fmtSpeechPrice(price)}!`);
  pushTicker(`🔨 SOLD: ${p.name} → ${winTeam.id} for ${fmtCr(price)}`);
  showSoldStamp(p.name, winTeam.name, fmtCr(price), winTeam.id);

  stopBidTimer();
  state.curId = null; state.curLeader = null; state.curBid = 0; state.gavelStage = 0; state.biddersThisLot = []; state.bidHistory = []; state.passedTeams = [];
  checkTradeUnlock();
  renderAll();
  saveState();
}

function hammerUnsold(){
  if (state.curId === null) return;
  stopAutoBid(); closeHuddle();
  const p = state.players[state.curId];
  p.status = 'UNSOLD';
  sfxUnsold();
  speakMale(`${p.name} goes unsold.`);
  addReaction(`✕ <b>UNSOLD:</b> All 10 franchises passed on ${p.name} at ${fmtCr(p.base)}.`, '#ef4444');
  pushTicker(`✕ UNSOLD: ${p.name} (${fmtCr(p.base)})`);
  showToast(`${p.name} goes UNSOLD.`);
  stopBidTimer();
  state.curId = null; state.curLeader = null; state.curBid = 0; state.gavelStage = 0; state.biddersThisLot = []; state.bidHistory = []; state.passedTeams = [];
  checkTradeUnlock();
  renderAll();
  saveState();
}

function startAcceleratedRound(){
  const unsold = state.players.filter(p => p.status === 'UNSOLD');
  if (unsold.length === 0) { showToast('No unsold players to recall yet!'); return; }
  unsold.forEach(p => { p.status = 'AVAIL'; p.set = 'Accelerated'; });
  sfxTrade();
  speakFemale(`Accelerated round begins! ${unsold.length} unsold players are back on the block.`);
  pushTicker(`⚡ ACCELERATED ROUND: ${unsold.length} UNSOLD PLAYERS RECALLED AT BASE PRICE!`);
  showToast(`Recalled ${unsold.length} unsold players for Accelerated Round!`);
  renderAll(); saveState();
}

function showSoldStamp(name, teamName, price, teamId=''){
  document.getElementById('stampPlayer').textContent = name.toUpperCase();
  document.getElementById('stampTeam').innerHTML = `${teamId ? getTeamLogo(teamId, 28) + ' ' : ''}TO ${teamName.toUpperCase()}`;
  document.getElementById('stampPrice').textContent = price;
  const ov = document.getElementById('soldOverlay');
  ov.classList.add('show');
  clearTimeout(ov._tm); ov._tm = setTimeout(()=>ov.classList.remove('show'), 2400);
}

function pushTicker(msg){
  state.tickerItems.unshift(msg);
  state.tickerItems = state.tickerItems.slice(0, 12);
  document.getElementById('tickerText').textContent = state.tickerItems.join('   •   ');
}

// ==================== 7. QUICK-SIM SET & FULL AUCTION (BALANCED ACROSS ALL 10 TEAMS) ====================
function simSinglePlayerSilent(p){
  let bestT = null, bestVal = 0, secondVal = 0;
  // Shuffled team iteration ensures fair tie-breaking across all 10 teams!
  shuffleArr(state.teams).forEach(t => {
    const ev = evaluatePlayerForTeam(t, p, 1.0);
    if (ev.val >= p.base) {
      if (ev.val > bestVal) { secondVal = bestVal; bestVal = ev.val; bestT = t; }
      else if (ev.val > secondVal) { secondVal = ev.val; }
    }
  });
  if (!bestT || bestT.squad.length >= 25) { p.status = 'UNSOLD'; return; }
  let price = secondVal >= p.base ? Math.min(bestVal, secondVal + nextInc(secondVal)) : p.base;
  price = Math.min(MAX_BID_CAP, Math.max(p.base, Math.min(maxSpendable(bestT), Math.round(price / 5) * 5)));
  p.status = 'SOLD'; p.soldTo = bestT.id; p.soldPrice = price;
  if (!state.soldOrder) state.soldOrder = [];
  state.soldOrder.unshift({ id:p.id, team:bestT.id, price });
  bestT.purse = Math.max(0, bestT.purse - price);
  bestT.squad.push(p.id);
}

function quickSimCurrentSet(){
  stopAutoBid(); closeHuddle();
  const refId = state.curId !== null ? state.curId : getNextAvailableId();
  if (refId === null) { showToast('Auction already complete!'); return; }
  const setName = state.players[refId].set;
  let count = 0;
  state.players.forEach(p => {
    if (p.set === setName && p.status === 'AVAIL') { simSinglePlayerSilent(p); count++; }
  });
  state.curId = null; state.curLeader = null; state.curBid = 0; state.gavelStage = 0;
  checkTradeUnlock();
  sfxTrade();
  pushTicker(`⏩ Quick-Simulated Set "${setName}" (${count} players)`);
  showToast(`Simulated ${count} players in ${setName}!`);
  renderAll(); saveState();
}

function quickSimRestAuction(){
  stopAutoBid(); closeHuddle();
  let count = 0;
  state.players.forEach(p => {
    if (p.status === 'AVAIL') { simSinglePlayerSilent(p); count++; }
  });
  // Smart Role-Balanced Fill: fill genuine gaps (WK -> Spinner -> Pacer -> AR -> Bat) up to 25 players!
  state.teams.forEach(t => {
    while (t.squad.length < 25 && t.purse >= 30) {
      const c = teamRoleCounts(t);
      const unsoldAvail = state.players
        .filter(p => p.status==='UNSOLD' && p.base <= t.purse && (!p.os || c.OS < 8))
        .sort((a,b) => b.ovr - a.ovr);
      if (!unsoldAvail.length) break;

      let fill = null;
      if (c.WK < 2) fill = unsoldAvail.find(p => p.role === 'WK');
      if (!fill && c.spinners < 2) fill = unsoldAvail.find(p => isSpinner(p));
      if (!fill && c.BW < t.targets.BW) fill = unsoldAvail.find(p => p.role === 'BW');
      if (!fill && c.AR < t.targets.AR) fill = unsoldAvail.find(p => p.role === 'AR');
      if (!fill && c.B < t.targets.B) fill = unsoldAvail.find(p => p.role === 'B');
      if (!fill) fill = unsoldAvail[0];
      if (!fill) break;

      fill.status = 'SOLD'; fill.soldTo = t.id; fill.soldPrice = fill.base;
      t.purse = Math.max(0, t.purse - fill.base);
      t.squad.push(fill.id);
    }
  });
  state.curId = null; state.curLeader = null; state.curBid = 0; state.gavelStage = 0;
  checkTradeUnlock();
  sfxCrowdRoar(1.2);
  pushTicker(`⚡ FULL AUCTION SIMULATED (${count} players) — ALL 10 SQUADS READY FOR TRADES & SEASON!`);
  showToast(`Simulated remaining ${count} players! Open Trades or Season.`);
  renderAll(); saveState();
}

// ==================== 8. UPGRADED 10-TEAM & INDIVIDUAL CHAT (SMART OFFLINE + OPTIONAL LIVE GEMINI AI) ====================
const API_KEY_STORAGE = 'ipl_2026_gemini_key';
const API_KEY2_STORAGE = 'ipl_2026_gemini_key_2';
const QUOTA_SAVER_STORAGE = 'ipl_2026_quota_saver';
const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.6-flash', 'gemini-4-hydrogen'];
let workingGeminiModel = null;
let activeKeyIndex = 0;
let lastGeminiError = '';
let quotaSaverOn = false;

try { quotaSaverOn = localStorage.getItem(QUOTA_SAVER_STORAGE) === '1'; } catch(e){}

function getSavedApiKeys(){
  const keys = [];
  try {
    const k1 = (localStorage.getItem(API_KEY_STORAGE) || '').trim();
    const k2 = (localStorage.getItem(API_KEY2_STORAGE) || '').trim();
    if (k1) keys.push(k1);
    if (k2 && k2 !== k1) keys.push(k2);
  } catch(e){}
  return keys;
}
function isHostedOnline(){
  return typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
}
function getSavedApiKey(){
  const keys = getSavedApiKeys();
  return keys.length ? keys[activeKeyIndex % keys.length] : (isHostedOnline() ? '__NETLIFY_PROXY__' : '');
}
function toggleQuotaSaver(){
  quotaSaverOn = !quotaSaverOn;
  try { localStorage.setItem(QUOTA_SAVER_STORAGE, quotaSaverOn ? '1' : '0'); } catch(e){}
  updateAiModeStatus();
  showToast(quotaSaverOn
    ? '🔋 Quota Saver ON — Saves your free API calls for Floor Mic, Huddles, Coach Chat & Playing XII!'
    : '🔋 Quota Saver OFF — Full Live AI on every player scout & sold reaction.');
}
function saveApiKey(){
  const val1 = (document.getElementById('geminiKeyInput').value || '').trim();
  const val2 = (document.getElementById('geminiKeyInput2')?.value || '').trim();
  workingGeminiModel = null; lastGeminiError = ''; activeKeyIndex = 0;
  try {
    if (val1) localStorage.setItem(API_KEY_STORAGE, val1);
    else localStorage.removeItem(API_KEY_STORAGE);
    if (val2) localStorage.setItem(API_KEY2_STORAGE, val2);
    else localStorage.removeItem(API_KEY2_STORAGE);
  } catch(e){}
  updateAiModeStatus();
  if (val1 || val2) testApiKey();
  else showToast('Switched back to Smart Built-In Engine.');
}
function updateAiModeStatus(){
  const keys = getSavedApiKeys();
  const el = document.getElementById('aiModeStatus');
  const inp1 = document.getElementById('geminiKeyInput');
  const inp2 = document.getElementById('geminiKeyInput2');
  const qBtn = document.getElementById('btnQuotaSaver');
  try {
    if (inp1) inp1.value = localStorage.getItem(API_KEY_STORAGE) || '';
    if (inp2) inp2.value = localStorage.getItem(API_KEY2_STORAGE) || '';
  } catch(e){}
  if (qBtn) {
    qBtn.textContent = quotaSaverOn ? '🔋 Saver: ON' : '🔋 Saver: OFF';
    qBtn.className = quotaSaverOn ? 'btn btn-green btn-sm' : 'btn btn-sm';
  }
  if (!el) return;
  if (!keys.length) { el.style.color = '#6ee7b7'; el.textContent = 'Mode: Smart Built-In Engine (Offline Ready)'; return; }
  if (lastGeminiError) { el.style.color = '#fca5a5'; el.textContent = `⚠️ API Error: ${lastGeminiError}`; return; }
  el.style.color = '#6ee7b7';
  const keyTxt = keys.length > 1 ? `Key #${(activeKeyIndex % keys.length) + 1}/${keys.length} Auto-Rotate` : '1 Key Active';
  el.textContent = workingGeminiModel
    ? `Mode: 🤖 LIVE GEMINI (${workingGeminiModel} • ${keyTxt})`
    : `Mode: 🤖 ${keys.length} Gemini Key(s) Saved (Tap Test to verify)`;
}

// Fast JSON caller with 7s timeout, Dual-Key Auto-Rotation, Thinking Filter & Model Fallback
async function callGeminiJSON(prompt, temperature=0.8, timeoutMs=7000){
  const keys = getSavedApiKeys();
  if (!keys.length) {
    if (!isHostedOnline()) return null;
    try {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch('/.netlify/functions/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({ prompt, temperature, grounded: false })
      });
      clearTimeout(tm);
      if (res.ok) {
        const parsed = await res.json();
        if (parsed && typeof parsed === 'object' && !parsed.error) return parsed;
      }
    } catch(e){}
    return null;
  }
  const modelsToTry = workingGeminiModel
    ? [workingGeminiModel, ...GEMINI_MODELS.filter(m => m !== workingGeminiModel)]
    : GEMINI_MODELS;

  for (let kStep = 0; kStep < keys.length; kStep++) {
    const kIdx = (activeKeyIndex + kStep) % keys.length;
    const key = keys[kIdx];
    for (const model of modelsToTry) {
      const ctrl = new AbortController();
      const tm = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: ctrl.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature }
          })
        });
        clearTimeout(tm);
        if (!res.ok) {
          const errBody = await res.json().catch(()=>({}));
          lastGeminiError = `Key#${kIdx+1} ${model} HTTP ${res.status}: ${errBody?.error?.message || res.statusText}`.slice(0, 140);
          if (res.status === 401 || res.status === 403) break;
          if (res.status === 429) {
            if (keys.length > 1 && kStep === 0) break;
            continue;
          }
          continue;
        }
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        let rawText = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
        if (!rawText && parts.length) rawText = parts.map(p => p.text || '').join('').trim();
        if (!rawText) continue;

        rawText = rawText.replace(/^`{3}(?:json)?\s*/i, '').replace(/`{3}$/i, '').trim();
        let parsed = null;
        try {
          parsed = JSON.parse(rawText);
        } catch(parseErr) {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }
        if (!parsed || typeof parsed !== 'object') continue;
        activeKeyIndex = kIdx;
        workingGeminiModel = model;
        lastGeminiError = '';
        updateAiModeStatus();
        return parsed;
      } catch(e) {
        clearTimeout(tm);
        lastGeminiError = e.name === 'AbortError' ? `Timed out on ${model}` : (e.message || 'Network/Parse error');
      }
    }
  }
  updateAiModeStatus();
  return null;
}

// Normalize team-keyed Gemini JSON (handles wrapped objects, lowercase IDs, or full franchise names)
function normalizeTeamMap(rawMap){
  if (!rawMap || typeof rawMap !== 'object') return null;
  const unwrapped = rawMap.replies || rawMap.teams || rawMap.responses || rawMap.franchises || rawMap;
  if (!unwrapped || typeof unwrapped !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(unwrapped)) {
    const ku = String(k).trim().toUpperCase();
    const match = TEAMS_META.find(t => t.id === ku || t.name.toUpperCase() === ku || ku.includes(t.id));
    if (match) out[match.id] = v;
  }
  return Object.keys(out).length ? out : null;
}

async function testApiKey(){
  const key = getSavedApiKey();
  if (!key) { showToast('Paste a Gemini API key first!'); return; }
  const el = document.getElementById('aiModeStatus');
  if (el) { el.style.color = '#fbbf24'; el.textContent = '⏳ Testing Gemini API connection...'; }
  const res = await callGeminiJSON('Return ONLY valid JSON: {"ok": true, "msg": "Floodlight AI Online"}', 0.1);
  if (res && res.ok) {
    showToast(`✅ Connected via ${workingGeminiModel}!`);
  } else {
    showToast(`❌ API Failed: ${lastGeminiError || 'Check key'}`);
  }
  updateAiModeStatus();
}

async function fetchLiveSoldReactions(p, winTeam, price, losers, watchers){
  const pickIds = [...losers.slice(0, 2), ...watchers.slice(0, 2).map(w => w.id)];
  if (!pickIds.length) return;
  const winSquad = winTeam.squad.slice(0, 5).map(id => state.players[id]?.name).filter(Boolean).join(', ');
  const teamDesc = pickIds.map(id => {
    const t = state.teams.find(x => x.id === id);
    const role = losers.includes(id) ? 'LOST_BIDDING_WAR' : 'WATCHING_RIVAL';
    return `${t.id} (${role}, Coach: ${t.staff[0]}, Purse: ${fmtCr(t.purse)})`;
  }).join('\n');

  const prompt = `IPL Mega Auction live room! ${p.name} (${roleLabel(p.role)}, Tier ${p.tier}, Est. value ${fmtCr(p.fairVal)}) just SOLD to ${winTeam.id} for ${fmtCr(price)}!
${winTeam.id} now has: ${winSquad} (Purse left: ${fmtCr(winTeam.purse)}).
Generate 1 distinct, vivid, emotional reaction (max 20 words) from EACH of these rival tables — make every team feel DIFFERENT (e.g., one heartbroken/sad, one happy/relieved they forced a high price, one shocked at ${winTeam.id}'s stacked squad, one regretful if cheap):
${teamDesc}
Return ONLY valid JSON: {"CSK": {"emoji": "😱", "label": "Shocked", "text": "..."}, ...}`;

  const aiMap = await callGeminiJSON(prompt, 0.9);
  if (!aiMap) return;
  pickIds.forEach(id => {
    const item = aiMap[id];
    const t = state.teams.find(x => x.id === id);
    if (!item || !t || !item.text) return;
    const em = item.emoji || '💬', lb = item.label || 'Live Reaction';
    t.chatter = `${em} ${item.text}`;
    addReaction(`${em} <b style="color:${t.color}">${t.id} (${lb} • AI):</b> <i>"${item.text}"</i>`, t.color);
  });
  renderTeams();
}

function openFloorMic(){
  activeTalkTarget = 'ALL';
  const k = getSavedApiKey();
  document.getElementById('talkTitle').textContent = '📢 FLOOR MIC — ALL 10 FRANCHISES';
  document.getElementById('talkSub').textContent = k ? '🤖 Live Gemini AI connected — ask literally anything!' : 'Ask if everyone is ready, praise buys, ask about players, strategy, or rivals';
  const curName = state.curId !== null ? state.players[state.curId].name : 'Jasprit Bumrah';
  const prompts = state.curId !== null ? ['Too low! Don\'t let them steal him!', `Will you bid for ${curName}?`, 'Indian pitches need him — bid!', 'Great job everyone!'] : ['Are all teams ready?', 'Great job everyone!', `Will you bid for ${curName}?`, 'Who is your captain pick?'];
  document.getElementById('talkQuickPrompts').innerHTML = prompts.map(q=>`<button class="chip" onclick="sendTalk('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('');
  document.getElementById('talkFeed').innerHTML = `<div class="msg"><b>Auctioneer Mic Live:</b> Speak naturally to all 10 tables! ${k ? '(Powered by Live Gemini AI)' : '(Smart Persona Engine — connect a free Gemini key in ⚙️ Settings for full LLM chat)'}</div>`;
  document.getElementById('talkBackdrop').classList.add('open');
}

function openTeamTalk(tid){
  activeTalkTarget = tid;
  const t = state.teams.find(x=>x.id===tid);
  const curName = state.curId !== null ? state.players[state.curId].name : 'Arshdeep Singh';
  document.getElementById('talkTitle').textContent = `🎙️ ${t.name.toUpperCase()} TABLE`;
  document.getElementById('talkSub').textContent = `Purse: ${fmtCr(t.purse)} • Squad: ${t.squad.length}/25 • ${t.home}`;
  const prompts = ['Are you ready?', 'Well done on your buys!', `Will you bid for ${curName}?`, 'Why were you quiet?'];
  document.getElementById('talkQuickPrompts').innerHTML = prompts.map(q=>`<button class="chip" onclick="sendTalk('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('');
  document.getElementById('talkFeed').innerHTML = `<div class="msg" style="border-left-color:${t.color}"><b>${t.staff[0]}:</b> Ready at the ${t.id} desk. ${t.style}</div>`;
  document.getElementById('talkBackdrop').classList.add('open');
}

function findMentionedPlayer(ql){
  for (const p of state.players) {
    const full = p.name.toLowerCase();
    const parts = full.split(' ');
    const last = parts[parts.length - 1];
    if (ql.includes(full) || (last.length >= 4 && new RegExp('\\b' + last.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b', 'i').test(ql))) return p;
  }
  return null;
}

function generateSmartTeamReply(t, q){
  const c = teamRoleCounts(t);
  const ql = q.toLowerCase().trim();
  const curP = state.curId !== null ? state.players[state.curId] : null;
  const topBuy = t.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.soldPrice-a.soldPrice)[0];
  const leader = t.staff[0].split(' (')[0];
  const tIdx = TEAMS_META.findIndex(x => x.id === t.id);

  // 1. PRIORITY: Auctioneer Persuasion / Hyping Live Player on Podium (checked BEFORE Appreciation!)
  const isPersuading = curP && !/(what a steal|great steal|nice steal|good job|well done|great buy)/i.test(ql) &&
    /(too low|don'?t let.*steal|steal him|cheap|convince|come on|buy him|wake up|indian.*pitch|pitches need|spinner|worth more|raise.*paddle|jump in|go for him|bid!|\bbid for him\b)/i.test(ql);

  if (isPersuading) {
    if (state.curLeader === t.id) {
      return `Hey Auctioneer, stop hyping him up! We already hold the bid at ${fmtCr(state.curBid)} — drop the hammer!`;
    }
    const ev = evaluatePlayerForTeam(t, curP, 1.0);
    const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : curP.base);
    const worthy = (curP.tier === 'S' || curP.tier === 'A' || curP.tier === 'B') && state.curBid < curP.fairVal * 1.15 && state.curBid < MAX_BID_CAP;
    const canAfford = maxSpendable(t) >= nextB && t.squad.length < 25 && (!curP.os || c.OS < 8);
    // Guarantee 3-4 teams get convinced on worthy players, while others react differently!
    const convinceRoll = (tIdx * 3 + curP.id + Math.floor(state.curBid / 25)) % 10;

    if (worthy && canAfford && convinceRoll < 4) {
      if (!state.persuasionBoost) state.persuasionBoost = {};
      const extra = Math.min(400, Math.max(150, Math.round((Math.max(nextB, curP.fairVal) - state.curBid) * 0.6 / 25) * 25));
      state.persuasionBoost[t.id] = (state.persuasionBoost[t.id] || 0) + extra;
      t.chatter = `🔥 Convinced! Raising cap by +${fmtCr(extra)} for ${curP.name}!`;
      const yesLines = [
        `Fair point, Auctioneer! Letting ${state.curLeader || 'a rival'} steal ${curP.name} at ${fmtCr(state.curBid)} would be criminal — ${leader} just approved +${fmtCr(extra)}!`,
        `You're right — on Indian tracks a ${roleLabel(curP.role)} like ${curP.name} wins matches. We're stretching our budget!`,
        `Okay, you woke us up! ${t.id} is jumping back in with +${fmtCr(extra)} extra room — hit Ask Bots!`,
        `Good call! At ${fmtCr(state.curBid)} he's underpriced for ${t.home}. Our paddle is ready to go back up!`
      ];
      return yesLines[(tIdx + curP.id) % yesLines.length];
    } else if (!worthy) {
      const noUnworthy = [
        `Nice sales pitch, Auctioneer, but ${curP.name} isn't worth stretching past ${fmtCr(ev.val)} for ${t.id}.`,
        `We're not falling for that! ${fmtCr(state.curBid)} is already plenty for ${curP.name}.`,
        `Pass from ${t.id} — ${leader} wants to save our ${fmtCr(t.purse)} for bigger match-winners.`,
        `No chance! Let ${state.curLeader || 'them'} keep ${curP.name} at ${fmtCr(state.curBid)}, we're staying out.`
      ];
      return noUnworthy[tIdx % noUnworthy.length];
    } else {
      const noBudget = [
        `We agree ${curP.name} is quality, but ${t.id} has to stay disciplined at ${fmtCr(ev.val)} max.`,
        `Tempting, Auctioneer! Still, our analysts say hold firm and save ${fmtCr(t.purse)} for our ${t.pref.map(roleLabel).join('/')} slots.`,
        `Can't stretch right now — let's see if another table blinks before the gavel drops!`,
        `We already have our eye on the next set, Auctioneer — ${t.id} is sitting tight here.`,
        `Respect the hustle, Auctioneer, but ${leader} shook his head — we're out on ${curP.name}.`,
        `Too tight for our ${t.home} plan right now — we'll let the other tables fight over him!`
      ];
      return noBudget[tIdx % noBudget.length];
    }
  }

  // 2. "Are you ready / All ready / Let's start / Begin"
  if (/(ready|start|begin|let'?s go|shall we|set to go|bring.*out|open the floor|kick off)/i.test(ql)) {
    const readyLines = {
      CSK: `100% ready, Auctioneer! ${leader} has our Chepauk spin & all-rounder list locked in — bring out the first name!`,
      MI:  `Locked and loaded! Paddles are up at the MI table — we're hunting match-winners from Lot 1.`,
      RCB: `Born ready! Bold strategy today — we're here to build a Chinnaswamy powerhouse. Let's roll!`,
      KKR: `Ready at the KKR table! Our analysts are dialed in — let the bidding wars begin!`,
      SRH: `All set! Full firepower mode today — bring on the marquee stars!`,
      RR:  `Ready and calm! Our Moneyball sheets are open — let's find the hidden gems and superstars.`,
      DC:  `Absolutely ready! Sitting on ${fmtCr(t.purse)} and looking forward to a few spicy bidding wars!`,
      PBKS:`Ready to rock! Ricky Ponting has the paddle warmed up — let's start the mega auction!`,
      GT:  `All set from the Gujarat desk. Disciplined bids, zero panic — fire away, Auctioneer!`,
      LSG: `Ready to go! Justin Langer and Zaheer are set — bring the first player to the podium!`
    };
    return readyLines[t.id] || `Yes, ${t.id} is 100% ready!`;
  }

  // 3. "How are you / Mood / Feeling / Nervous / Excited / Energy"
  if (/(how are you|how'?s everyone|feeling|nervous|excited|tense|pressure|mood|energy|confident|vibe)/i.test(ql)) {
    const moodLines = {
      CSK: `Calm as ever — no panic at the CSK table, we trust our process.`,
      MI:  `High energy! Mega auctions are where championships are built.`,
      RCB: `Super excited! Fans expect fireworks and we're ready to deliver.`,
      KKR: `Confident and focused. Eden Gardens needs a balanced unit and we know our targets.`,
      SRH: `Pumped up! Ready to go aggressive when the right match-winner walks out.`,
      RR:  `Feeling sharp — zero nerves, just pure data and smart scouting.`,
      DC:  `Loving the energy in the room! Ready to keep rivals on their toes.`,
      PBKS:`Fired up! With ${fmtCr(t.purse)} in the bank, we're feeling unstoppable.`,
      GT:  `Very composed. Ashish Nehra's got the notebook ready — we'll strike at the right moments.`,
      LSG: `Feeling great! Looking forward to building a rock-solid Ekana squad.`
    };
    return moodLines[t.id];
  }

  // 4. Greetings
  if (/^(hi|hello|hey|namaste|good morning|good evening|good afternoon|yo|sup|welcome)\b/i.test(ql)) {
    const greets = [
      `Hello Auctioneer! ${leader} here at ${t.id} — ${fmtCr(t.purse)} in the purse, ready for your gavel!`,
      `Hey there! Great to be in the Floodlight Arena. ${t.id} table is all ears!`,
      `Namaste Auctioneer! ${t.name} management is dialed in and ready to bid.`
    ];
    return greets[tIdx % greets.length];
  }

  // 5. Good luck / Bye
  if (/(good luck|all the best|best of luck|cheers|see you|bye)/i.test(ql)) {
    return `Thank you, Auctioneer! Wishing all tables a thrilling auction — may the smartest squad lift the IPL trophy!`;
  }

  // 6. Appreciation / Praise / Congratulations (NO bare "steal" here!)
  if (/(good job|great|well done|awesome|nice|congrat|appreciate|superb|brilliant|smart|love|thank|amazing|best buy|what a steal|great steal|nice steal|respect|fantastic|impressive)/i.test(ql)) {
    if (topBuy) {
      const praiseBought = [
        `Thank you, Auctioneer! ${leader} is thrilled — landing ${topBuy.name} (${fmtCr(topBuy.soldPrice)}) sets up our ${t.home} XI!`,
        `Appreciate that! ${topBuy.name} was #1 on our board and getting him at ${fmtCr(topBuy.soldPrice)} feels huge.`,
        `Cheers from the ${t.id} table! Building around ${topBuy.name} with ${fmtCr(t.purse)} still left is right on plan.`
      ];
      return praiseBought[tIdx % praiseBought.length];
    }
    const praiseFresh = [
      `Thank you, Auctioneer! ${t.id} is staying patient with ${fmtCr(t.purse)} ready for our prime targets.`,
      `Appreciate the kind words! ${leader} has our shortlist ready — just waiting for the right moment.`,
      `Cheers! Feeling sharp at the ${t.id} desk — our biggest bids are still to come!`,
      `Thanks from ${t.name}! Discipline wins mega auctions and we're locked in.`
    ];
    return praiseFresh[tIdx % praiseFresh.length];
  }

  // 7. Criticism / Banter
  if (/(bad buy|waste|terrible|worst|fool|mistake|overpaid|crazy|mad|stupid|lol|haha)/i.test(ql)) {
    return `Haha, tough crowd at the podium! Wait till you see this ${t.id} XI in action at ${t.home} — our analysts know what they're doing!`;
  }

  // 8. Quiet / Why didn't you bid
  if (/(quiet|silent|sleep|not bidding|didn'?t bid|why.*pass|waiting|holding back|scared)/i.test(ql)) {
    return t.squad.length === 0
      ? `Just warming up! We're saving our ${fmtCr(t.purse)} for our #1 marquee priorities instead of chasing early hype.`
      : `Not sleeping — being smart! We have ${t.squad.length}/25 signed and ${fmtCr(t.purse)} left. We'll strike when our exact role target comes up!`;
  }

  // 9. Captain / Skipper
  if (/(captain|skipper|leader|lead the team|who will lead)/i.test(ql)) {
    const capCand = t.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr)[0];
    return capCand
      ? `Right now, ${capCand.name} (OVR ${capCand.ovr}) is our frontrunner to lead ${t.id}, unless we land another marquee skipper!`
      : `We're specifically targeting a proven Indian or international leader in the Marquee set to captain ${t.id}!`;
  }

  // 10. Specific player mentioned (or "him / this player / current") — UNIQUE reply per franchise!
  const mentioned = findMentionedPlayer(ql) || ((ql.includes('this player') || ql.includes('him') || ql.includes('current') || ql.includes('next player')) ? curP : null);
  if (mentioned) {
    if (mentioned.status === 'SOLD') {
      return mentioned.soldTo === t.id
        ? `We already signed ${mentioned.name} for ${fmtCr(mentioned.soldPrice)}! Core pillar of our ${t.home} XI.`
        : `${mentioned.name} went to ${mentioned.soldTo} for ${fmtCr(mentioned.soldPrice)}. ${mentioned.soldPrice > mentioned.fairVal * 1.12 ? 'Way too pricey for our budget.' : 'Good pick by them, we moved on to our next target.'}`;
    }
    const ev = evaluatePlayerForTeam(t, mentioned, 1.0);
    if (ev.val === 0) return `Passing on ${mentioned.name} — ${ev.reason}`;
    if (ev.strategy === 'INFLATE') return `Honestly? ${mentioned.name} isn't our #1 gap, but with ${fmtCr(t.purse)} left we might push him to ${fmtCr(ev.val)} just to drain our rivals!`;

    const uniquePlayerLines = [
      `${mentioned.name} fits ${t.home} like a glove! ${leader} has cleared us up to ~${fmtCr(ev.val)}.`,
      `Big fan of ${mentioned.name} (Tier ${mentioned.tier}) — we're ready to battle till around ${fmtCr(ev.val)}.`,
      `He's on our shortlist! We'll stay in the fight for ${mentioned.name} up to ${fmtCr(ev.val)}, then reassess.`,
      `Definitely interested in ${mentioned.name}. With ${fmtCr(t.purse)} left, our ceiling is roughly ${fmtCr(ev.val)}.`,
      `If ${mentioned.name} stays under ${fmtCr(ev.val)}, our paddle is going straight up!`
    ];
    return uniquePlayerLines[(tIdx + mentioned.id) % uniquePlayerLines.length];
  }

  // 11. Price inflation / mind games
  if (/(inflat|raise.*price|drain|mind game|trick|bluff|fake bid)/i.test(ql)) {
    return t.inflator >= 0.44
      ? `Guilty as charged! With ${fmtCr(t.purse)} left, we'll gladly push rival targets up by ₹3–5 Cr before dropping out.`
      : `We prefer disciplined bidding at ${t.id} — we only raise the paddle if we genuinely want the player.`;
  }

  // 12. Overprice / worth
  if (/(overprice|expensive|worth|price|cost|too much|bargain)/i.test(ql)) {
    if (curP) {
      const ev = evaluatePlayerForTeam(t, curP, 1.0);
      return state.curBid > curP.fairVal * 1.15
        ? `${fmtCr(state.curBid)} for ${curP.name} is overpriced (our cap: ${fmtCr(ev.val)}). Happy to watch others burn cash!`
        : `At ${fmtCr(state.curBid)}, ${curP.name} is still ${state.curBid < curP.fairVal * 0.85 ? 'a total bargain' : 'fair value'} for a Tier-${curP.tier} ${roleLabel(curP.role)}.`;
    }
    return `With a ₹25 Cr cap, Tier-S Indian stars are worth ₹18–24 Cr, while uncapped Set 4 steals win championships.`;
  }

  // 13. Rivals / strongest team / who will win
  if (/(rival|strongest|threat|best team|who will win|champion|trophy|cup|favourite|favorite)/i.test(ql)) {
    const others = state.teams.filter(x => x.id !== t.id).sort((a,b) => teamCoachEval(b).overall - teamCoachEval(a).overall || b.purse - a.purse);
    const top = others[0];
    return `${top.id} looks like our biggest rival right now (${top.squad.length} signed, ${fmtCr(top.purse)} left), but ${t.id} is built to lift the IPL Cup!`;
  }


  // 13b. Auction Opinion / Review / Progress Until Now
  if (/(opinion|until now|untill now|so far|how.*auction|auction.*going|review|progress|summary|thoughts on)/i.test(ql)) {
    const soldAll = state.players.filter(x => x.status === 'SOLD');
    const biggest = [...soldAll].sort((a,b) => b.soldPrice - a.soldPrice)[0];
    if (topBuy) {
      const opLines = [
        `Loving how this auction is shaping up! Landing ${topBuy.name} (${fmtCr(topBuy.soldPrice)}) with ${fmtCr(t.purse)} left puts ${t.id} right on track.`,
        `Intense bidding so far! ${biggest ? biggest.name + ' going for ' + fmtCr(biggest.soldPrice) + ' set the market on fire, ' : ''}and we're happy with our ${t.squad.length} buys.`,
        `Very tactical room today! We've spent smartly on ${topBuy.name} and still hold ${fmtCr(t.purse)} for our remaining ${t.pref.map(roleLabel).join('/')} targets.`
      ];
      return opLines[tIdx % opLines.length];
    }
    return `High-octane auction so far! ${biggest ? `${biggest.name} (${fmtCr(biggest.soldPrice)}) was massive—` : ''}${t.id} is staying patient with ${fmtCr(t.purse)} intact for our prime targets.`;
  }

  // 14. Weakness / missing / squad / targets
  if (/(weak|miss|need|gap|squad|role|target|wishlist|looking for|who do you want)/i.test(ql)) {
    const prefNames = t.pref.map(roleLabel).join(' & ');
    if (t.squad.length === 0) {
      return `Fresh ₹120 Cr slate! Our top priorities for ${t.home} are elite ${prefNames}, plus a reliable wicketkeeper.`;
    }
    const gaps = [];
    if (c.WK < 2) gaps.push(`Wicket-Keeper (${c.WK}/2)`);
    if (c.BW < t.targets.BW) gaps.push(`Bowlers (${c.BW}/${t.targets.BW})`);
    if (c.AR < t.targets.AR) gaps.push(`All-Rounders (${c.AR}/${t.targets.AR})`);
    if (c.B < t.targets.B) gaps.push(`Batters (${c.B}/${t.targets.B})`);
    return `Roster (${t.squad.length}/25, OS ${c.OS}/8): biggest gaps are ${gaps.slice(0,2).join(' & ') || 'bench depth'}. Purse left: ${fmtCr(t.purse)}.`;
  }

  // 15. Specific roles / trades / purse / injury
  if (/(bowl|pacer|spin|death|fast|seamer)/i.test(ql)) {
    return `We have ${c.BW}/${t.targets.BW} bowlers so far. ${c.BW < 5 ? `Hunting frontline pace & spin tailored for ${t.home}!` : `Bowling attack is shaping up nicely.`}`;
  }
  if (/(bat|open|finish|middle order|sixes)/i.test(ql)) {
    return `We have ${c.B}/${t.targets.B} batters & ${c.WK}/2 keepers. ${c.B < 5 ? 'Need explosive top-order & finisher firepower!' : 'Batting core looks solid.'}`;
  }
  if (/(all-round|allround)/i.test(ql)) {
    return `All-rounders signed: ${c.AR}/${t.targets.AR}. ${c.AR < 4 ? 'High priority for 6 bowling options!' : 'Happy with our all-round depth.'}`;
  }
  if (/(keep|wk|glove)/i.test(ql)) {
    return `Keepers signed: ${c.WK}/2. ${c.WK === 0 ? 'A frontline keeper is high on our list!' : 'Keeper slot is covered.'}`;
  }
  if (/(trade|swap|exchange)/i.test(ql)) {
    return state.tradesUnlocked
      ? `Open for 1-for-1 swaps! With ${fmtCr(t.purse)} left, run the 10-Team GM Roundtable.`
      : `Trade window unlocks after the Marquee set wraps up — we'll talk deals then.`;
  }
  if (/(purse|budget|money|strateg|plan|spend)/i.test(ql)) {
    return `${t.style} Purse: ${fmtCr(t.purse)} for ${Math.max(0, 25 - t.squad.length)} remaining slots (max single bid: ${fmtCr(maxSpendable(t))}).`;
  }
  if (/(injur|replace|unsold)/i.test(ql)) {
    return `If any of our 25 players pick up an injury during the season, we'll immediately request a like-for-like replacement from the Unsold Pool!`;
  }

  // 16. Distinct, non-repetitive contextual fallback
  const prefStr = t.pref.map(roleLabel).join(' & ');
  const uniqueFallbacks = {
    CSK: `Heard you loud and clear, Auctioneer! At CSK (${fmtCr(t.purse)} left), we're focused on smart ${prefStr} picks for Chepauk.`,
    MI:  `Got it, Auctioneer! MI desk (${t.squad.length}/25 signed) is locked in on high-impact ${prefStr} for Wankhede.`,
    RCB: `Loud and clear! RCB has ${fmtCr(t.purse)} ready — we're chasing fearless ${prefStr} for Chinnaswamy!`,
    KKR: `Copy that! KKR (${fmtCr(t.purse)} left) is keeping an eye on match-winning ${prefStr} for Eden Gardens.`,
    SRH: `With you, Auctioneer! SRH is all about relentless firepower — prioritizing ${prefStr} next.`,
    RR:  `Noted from the Royals table! ${fmtCr(t.purse)} left and sticking to our data-driven ${prefStr} targets.`,
    DC:  `Roger that! Delhi Capitals (${t.squad.length}/25) are ready to jump in whenever top ${prefStr} appear.`,
    PBKS:`Right behind you, Auctioneer! PBKS has ${fmtCr(t.purse)} ready to spend big on ${prefStr}.`,
    GT:  `Clear at the Gujarat table! Staying patient with ${fmtCr(t.purse)} left and eyeing quality ${prefStr}.`,
    LSG: `On it, Auctioneer! LSG (${t.squad.length}/25) is building a versatile Ekana squad around ${prefStr}.`
  };
  return uniqueFallbacks[t.id] + (curP ? ` Watching ${curP.name} at ${fmtCr(state.curBid)} closely.` : '');
}

async function fetchLiveGeminiReplies(targets, userMsg, mentionedPlayer){
  if (!getSavedApiKey()) return null;
  const curP = state.curId !== null ? state.players[state.curId] : null;
  const targetP = mentionedPlayer || curP;
  const ctxSummary = targets.map(t => {
    const c = teamRoleCounts(t);
    const names = t.squad.slice(0, 3).map(id => state.players[id]?.name).filter(Boolean).join(', ') || 'None';
    const ev = targetP ? evaluatePlayerForTeam(t, targetP, 1.0) : null;
    const evalNote = ev ? ` | Cap:${fmtCr(ev.val)}` : '';
    return `${t.id} (${t.staff[0].split(' (')[0]}, Purse:${fmtCr(t.purse)}, Sq:${t.squad.length}/25, OS:${c.OS}/8, Buys:${names}${evalNote})`;
  }).join('\n');

  const prompt = `You are roleplaying IPL Mega Auction franchise management tables.
Current player on podium: ${curP ? `${curP.name} (${roleLabel(curP.role)}, Tier ${curP.tier}, Current Bid: ${fmtCr(state.curBid)}, Leading: ${state.curLeader || 'None'})` : 'None yet'}.
${targetP ? `Player being discussed: ${targetP.name} (Est. Fair Value: ${fmtCr(targetP.fairVal)}).` : ''}
Franchises to reply:
${ctxSummary}

The Auctioneer just said: "${userMsg}"

CRITICAL RULE — STICK TO YOUR WORD (OR EXPLICIT MIND-GAME BLUFF):
For each franchise, return a JSON object with:
- "reply": 1 short, natural, witty in-character sentence (max 22 words) directly answering what the Auctioneer said.
- "stance": one of "BID" (will genuinely bid/fight for ${targetP ? targetP.name : 'the player'}), "PASS" (genuinely saying NO — will strictly NOT bid on him!), "BLUFF" (mind game: says no in chat to fool rivals, might secretly jump in!), or "NEUTRAL" (not about bidding).
If a team's reply says "no / passing / out / too expensive / not buying", you MUST set stance to "PASS" (or rarely "BLUFF" for mind-game teams like PBKS/DC/RCB/KKR).
Return ONLY valid JSON: {"CSK": {"reply": "...", "stance": "PASS"}, ...}`;

  let res = normalizeTeamMap(await callGeminiJSON(prompt, 0.82));
  if (!res) {
    await new Promise(r => setTimeout(r, 450));
    res = normalizeTeamMap(await callGeminiJSON(prompt, 0.72));
  }
  return res;
}

function applyTeamCommitment(teamId, player, stance, replyText){
  if (!player || player.status !== 'AVAIL') return;
  if (!state.lotCommitments) state.lotCommitments = {};
  if (!state.lotCommitments[player.id]) state.lotCommitments[player.id] = {};

  let finalStance = stance;
  // Extra safety: if reply clearly says no/pass/out and stance wasn't BLUFF, enforce PASS so they stick to their word!
  if (finalStance !== 'BLUFF' && /\b(no\b|nope|passing|pass on|we'?re out|staying out|not buying|not bidding|won'?t bid|too expensive|skipping)\b/i.test(replyText)) {
    finalStance = 'PASS';
  }
  if (finalStance === 'PASS') {
    state.lotCommitments[player.id][teamId] = 'PASS';
    const t = state.teams.find(x => x.id === teamId);
    if (t) t.chatter = `✋ Committed: Passing on ${player.name}.`;
  } else if (finalStance === 'BID') {
    state.lotCommitments[player.id][teamId] = 'BID';
  } else if (finalStance === 'BLUFF') {
    state.lotCommitments[player.id][teamId] = 'BLUFF';
  }
}

async function sendTalk(preset){
  const inp = document.getElementById('talkInput');
  const txt = preset || inp.value.trim();
  if (!txt) return;
  inp.value = '';
  const feed = document.getElementById('talkFeed');
  feed.innerHTML += `<div class="msg user"><b>You (Auctioneer):</b> ${txt}</div>`;
  feed.scrollTop = feed.scrollHeight;

  const ql = txt.toLowerCase();
  const curP = state.curId !== null ? state.players[state.curId] : null;
  const mentioned = findMentionedPlayer(ql) || curP;
  const targets = activeTalkTarget === 'ALL' ? state.teams : [state.teams.find(x=>x.id===activeTalkTarget)];

  let liveMap = null;
  if (getSavedApiKey()) {
    const waitId = 'wait-' + Date.now();
    feed.innerHTML += `<div class="msg" id="${waitId}" style="opacity:0.7">🤖 Franchise tables are thinking (Live Gemini AI)...</div>`;
    feed.scrollTop = feed.scrollHeight;
    liveMap = await fetchLiveGeminiReplies(targets, txt, mentioned);
    const wEl = document.getElementById(waitId);
    if (wEl) wEl.remove();
  }

  if (getSavedApiKey() && !liveMap) {
    feed.innerHTML += `<div class="msg" style="border-left-color:#f59e0b;font-size:11px">⚠️ <b>Gemini API Busy (${lastGeminiError || 'Timeout'}):</b> Using Smart Persona Engine so tables stay responsive.</div>`;
  }
  targets.forEach(t => {
    let reply = '', stance = 'NEUTRAL';
    if (liveMap && liveMap[t.id]) {
      const entry = liveMap[t.id];
      reply = typeof entry === 'string' ? entry : (entry.reply || entry.text || entry.message || generateSmartTeamReply(t, txt));
      stance = typeof entry === 'object' && entry.stance ? entry.stance : 'NEUTRAL';
    } else {
      reply = generateSmartTeamReply(t, txt);
      if (mentioned && /(passing on|pass from|no chance|staying out|not falling|we'?re out|hold firm|sit tight)/i.test(reply)) stance = 'PASS';
      else if (mentioned && /(paddle is ready|jumping back in|stretching|battle till|fight up to|cleared us)/i.test(reply)) stance = 'BID';
    }

    if (mentioned) applyTeamCommitment(t.id, mentioned, stance, reply);
    const badge = stance === 'PASS' ? ' <span style="font-size:10px;color:#fca5a5">[OUT]</span>' : stance === 'BID' ? ' <span style="font-size:10px;color:#6ee7b7">[IN]</span>' : '';
    feed.innerHTML += `<div class="msg" style="border-left-color:${t.color}"><b style="color:${t.color}">${t.id}:</b> ${reply}${badge}</div>`;
  });
  feed.scrollTop = feed.scrollHeight;
  renderTeams();
  saveState();
  beep(540, 0.06, 'sine', 0.08);

  // Speak team replies aloud in distinct voices (1 team = full reply; All 10 = speaks top 3 distinct voices or all cleanly in queue)
  const spokenMsgs = [];
  const msgNodes = feed.querySelectorAll('.msg');
  const recentNodes = Array.from(msgNodes).slice(-targets.length);
  targets.forEach((t, idx) => {
    const nodeText = recentNodes[idx] ? recentNodes[idx].textContent.replace(/\[(OUT|IN)\]/g, '').trim() : '';
    if (nodeText) {
      const prof = getTeamVoiceProfile(t.id, 0);
      spokenMsgs.push({ text: nodeText, gender: prof.gender, pitch: prof.pitch, rate: prof.rate });
    }
  });
  if (spokenMsgs.length) speakDiscussionQueue(spokenMsgs);
}

// ==================== 9. ALL-10-TEAMS AI TRADE WINDOW (STRICT 25 CAP & NO NEGATIVE PURSE) ====================
function checkTradeUnlock(){
  const marqueeLeft = state.players.filter(p => p.set==='Marquee' && p.status==='AVAIL').length;
  if (marqueeLeft === 0 && !state.tradesUnlocked) {
    state.tradesUnlocked = true;
    sfxTrade();
    pushTicker('🔄 MARQUEE COMPLETE! ALL-10-TEAM LIVE AI TRADE WINDOW IS NOW OPEN!');
    showToast('🔄 Marquee Set Complete! Trade Window Unlocked!');
  }
}

function unlockTradesManual(){
  state.tradesUnlocked = true;
  sfxTrade();
  showToast('Commissioner unlocked the Trade Window!');
  renderTrades(); saveState();
}

async function runTradeRoundtable(){
  if (!state.tradesUnlocked) { showToast('Finish Marquee Set or tap Commissioner Unlock.'); return; }
  const activeTeams = state.teams.filter(t => t.squad.length >= 2);
  if (activeTeams.length < 2) { showToast('At least 2 teams need 2+ players signed first!'); return; }

  // Shuffle ALL active teams so ALL 10 franchises participate — never stuck on CSK/MI!
  const profiles = shuffleArr(activeTeams).map(t => {
    const c = teamRoleCounts(t);
    const roles = ['WK','B','AR','BW'];
    let need = roles[0], maxDef = -99, surplus = roles[0], maxSur = -99;
    roles.forEach(r => {
      const def = (t.targets[r] || 6) - c[r];
      if (def > maxDef) { maxDef = def; need = r; }
      if (c[r] >= 2 && c[r] - (t.targets[r] * 0.35) > maxSur) { maxSur = c[r] - (t.targets[r] * 0.35); surplus = r; }
    });
    return { t, c, need, surplus };
  });

  // Show ALL 10 teams speaking in the Roundtable!
  const chat = profiles.map(pr => ({
    team: pr.t,
    text: `Looking for a ${roleLabel(pr.need)} (currently ${pr.c[pr.need]}). Open to 1-for-1 swaps from our ${roleLabel(pr.surplus)} group (${fmtCr(pr.t.purse)} left).`
  }));

  const proposals = [];
  const usedTeams = new Set();

  // Pair distinct teams so up to 5 different pairs (all 10 teams!) get trade proposals
  for (let i = 0; i < profiles.length && proposals.length < 5; i++) {
    const A = profiles[i];
    if (usedTeams.has(A.t.id)) continue;
    for (let j = i + 1; j < profiles.length; j++) {
      const B = profiles[j];
      if (usedTeams.has(B.t.id)) continue;

      // Prefer 1-for-1 player swaps so squad counts NEVER exceed 25!
      const pFromA = A.t.squad.map(id=>state.players[id]).find(p =>
        p.role === B.need && (!p.os || B.c.OS < 8 || B.t.squad.some(bid => state.players[bid].role === A.need && state.players[bid].os))
      ) || A.t.squad.map(id=>state.players[id]).find(p => p.role === A.surplus && (!p.os || B.c.OS < 8));

      const pFromB = B.t.squad.map(id=>state.players[id]).find(p =>
        p.role === A.need && (!p.os || (A.c.OS - (pFromA && pFromA.os ? 1 : 0)) < 8)
      ) || B.t.squad.map(id=>state.players[id]).find(p =>
        p.role === B.surplus && p.id !== (pFromA ? pFromA.id : -1) && (!p.os || (A.c.OS - (pFromA && pFromA.os ? 1 : 0)) < 8)
      );

      if (pFromA && pFromB) {
        // FAIR TRADE CHECK: Prevent lopsided superstar-for-bench swaps (OVR difference must be <= 6)
        if (Math.abs(pFromA.ovr - pFromB.ovr) > 6) continue;
        // Verify overseas caps after swap
        const aNewOS = A.c.OS - (pFromA.os ? 1 : 0) + (pFromB.os ? 1 : 0);
        const bNewOS = B.c.OS - (pFromB.os ? 1 : 0) + (pFromA.os ? 1 : 0);
        if (aNewOS > 8 || bNewOS > 8) continue;

        const diff = pFromA.soldPrice - pFromB.soldPrice; // if >0, B pays A
        if ((diff > 0 && B.t.purse < diff) || (diff < 0 && A.t.purse < -diff)) continue;

        usedTeams.add(A.t.id);
        usedTeams.add(B.t.id);
        proposals.push({
          id: 'TR-' + Date.now() + '-' + proposals.length,
          teamA: A.t.id, teamB: B.t.id,
          playerA: pFromA.id, playerB: pFromB.id,
          cashBtoA: diff,
          rationale: `Balanced 1-for-1 swap: ${A.t.id} strengthens ${roleLabel(pFromB.role)} with ${pFromB.name}; ${B.t.id} adds ${pFromA.name} (${roleLabel(pFromA.role)}). Both squads keep exact size (${A.t.squad.length} & ${B.t.squad.length}).`
        });
        break;
      }
    }
  }

  // Upgrade Trade Roundtable with Live Gemini AI GM discussions & smart rationale if API key is active!
  if (getSavedApiKey() && proposals.length > 0) {
    showToast('🤖 10 AI GMs negotiating trades via Gemini...');
    const propDesc = proposals.map((pr, idx) => {
      const pA = state.players[pr.playerA], pB = state.players[pr.playerB];
      return `Deal ${idx}: ${pr.teamA} sends ${pA.name} (${roleLabel(pA.role)}, OVR ${pA.ovr}, ${fmtCr(pA.soldPrice)}) <-> ${pr.teamB} sends ${pB.name} (${roleLabel(pB.role)}, OVR ${pB.ovr}, ${fmtCr(pB.soldPrice)})`;
    }).join('\\n');
    const teamSummaries = profiles.map(pr => `${pr.t.id} (Needs: ${roleLabel(pr.need)}, Purse: ${fmtCr(pr.t.purse)}, Sq: ${pr.t.squad.length}/25)`).join(', ');
    const trPrompt = `IPL Mega Auction Live Trade Room!
Teams: ${teamSummaries}
Proposed Fair 1-for-1 Swaps:
${propDesc}
Write:
1) "chat": 1 realistic short trade-room comment (max 18 words) from EACH of the 10 team IDs (CSK, MI, RCB, KKR, SRH, RR, DC, PBKS, GT, LSG) discussing their needs or reacting to rival swaps.
2) "rationales": an array of ${proposals.length} sharp, realistic GM rationales (1 sentence each) explaining why each Deal makes tactical sense for both squads.
Return ONLY valid JSON: {"chat": {"CSK": "...", ...}, "rationales": ["...", ...]}`;
    const aiTr = await callGeminiJSON(trPrompt, 0.85);
    if (aiTr) {
      if (aiTr.chat) {
        chat.forEach(m => { if (aiTr.chat[m.team.id]) m.text = aiTr.chat[m.team.id]; });
      }
      if (Array.isArray(aiTr.rationales)) {
        proposals.forEach((pr, idx) => { if (aiTr.rationales[idx]) pr.rationale = aiTr.rationales[idx]; });
      }
    }
  }

  state.tradeProposals = proposals;
  document.getElementById('tradeChatPanel').style.display = 'block';
  document.getElementById('tradeChatFeed').innerHTML = chat.map(m =>
    `<div class="msg" style="border-left-color:${m.team.color}"><b style="color:${m.team.color}">${m.team.id} GM:</b> ${m.text}</div>`
  ).join('');
  sfxTrade();
  showToast(`Generated ${proposals.length} fair trade proposals across ${usedTeams.size} franchises!`);
  renderTrades(); saveState();

  // Voice the GM Roundtable discussion aloud
  if (voiceOn && chat.length) {
    const trQueue = chat.map(m => {
      const prof = getTeamVoiceProfile(m.team.id, 0);
      return { text: `${m.team.name} says: ${m.text}`, gender: prof.gender, pitch: prof.pitch, rate: prof.rate };
    });
    speakDiscussionQueue(trQueue);
  }
}

function approveTrade(tid){
  const idx = state.tradeProposals.findIndex(x => x.id === tid);
  if (idx === -1) return;
  const tr = state.tradeProposals[idx];
  const tA = state.teams.find(x=>x.id===tr.teamA);
  const tB = state.teams.find(x=>x.id===tr.teamB);
  const pA = state.players[tr.playerA];
  const pB = tr.playerB !== null ? state.players[tr.playerB] : null;

  // Strict live validation before execution (prevents 27-player squads or negative purses!)
  if (!tA.squad.includes(pA.id) || (pB && !tB.squad.includes(pB.id))) {
    showToast('Trade invalid — one of these players already moved.');
    state.tradeProposals.splice(idx, 1); renderTrades(); return;
  }
  if (!pB && tB.squad.length >= 25) {
    showToast(`Blocked: ${tB.id} already has 25/25 players!`); return;
  }
  if ((tr.cashBtoA > 0 && tB.purse < tr.cashBtoA) || (tr.cashBtoA < 0 && tA.purse < -tr.cashBtoA)) {
    showToast('Blocked: Insufficient purse for cash adjustment!'); return;
  }
  const cA = teamRoleCounts(tA), cB = teamRoleCounts(tB);
  const aNewOS = cA.OS - (pA.os ? 1 : 0) + (pB && pB.os ? 1 : 0);
  const bNewOS = cB.OS - (pB && pB.os ? 1 : 0) + (pA.os ? 1 : 0);
  if (aNewOS > 8 || bNewOS > 8) {
    showToast('Blocked: Would exceed 8 Overseas player limit!'); return;
  }

  tA.squad = tA.squad.filter(id => id !== pA.id);
  tB.squad.push(pA.id); pA.soldTo = tB.id;
  if (pB) {
    tB.squad = tB.squad.filter(id => id !== pB.id);
    tA.squad.push(pB.id); pB.soldTo = tA.id;
  }
  tA.purse += tr.cashBtoA;
  tB.purse -= tr.cashBtoA;

  const summary = pB
    ? `🔄 ${tA.id} ⇄ ${tB.id}: ${pA.name} swapped for ${pB.name}${tr.cashBtoA!==0 ? ` (${fmtCr(Math.abs(tr.cashBtoA))} cash adj.)` : ''}`
    : `🔄 ${tB.id} signs ${pA.name} from ${tA.id} for ${fmtCr(tr.cashBtoA)} all-cash`;
  state.tradeHistory.unshift(summary);
  state.tradeProposals.splice(idx, 1);
  pushTicker(summary);
  sfxTrade();
  showToast('Trade Approved & Executed!');
  renderAll(); saveState();
}

function vetoTrade(tid){
  state.tradeProposals = state.tradeProposals.filter(x => x.id !== tid);
  sfxUnsold();
  showToast('Trade Vetoed by Commissioner.');
  renderTrades(); saveState();
}

function populateHumanTradePlayers(){
  const panel = document.getElementById('humanTradePanel');
  if (!panel) return;
  if (!state.humanTeamId || !state.tradesUnlocked) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  const myT = state.teams.find(x => x.id === state.humanTeamId);
  document.getElementById('humanTradeBadge').textContent = `${myT.id} GM DESK`;

  const rSel = document.getElementById('htRivalSelect');
  const prevRival = rSel.value;
  const rivals = state.teams.filter(x => x.id !== myT.id);
  rSel.innerHTML = rivals.map(r => `<option value="${r.id}">${r.id} — ${r.name} (Purse: ${fmtCr(r.purse)}, Sq: ${r.squad.length})</option>`).join('');
  if (prevRival && rivals.some(r => r.id === prevRival)) rSel.value = prevRival;

  const rivalT = state.teams.find(x => x.id === rSel.value) || rivals[0];
  const mySel = document.getElementById('htMyPlayer');
  const rivSel = document.getElementById('htRivalPlayer');

  const myPlayers = myT.squad.map(id => state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);
  const rivPlayers = rivalT ? rivalT.squad.map(id => state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr) : [];

  mySel.innerHTML = myPlayers.length
    ? myPlayers.map(p => `<option value="${p.id}">${p.name} (${roleLabel(p.role)}, OVR ${p.ovr}, ${fmtCr(p.soldPrice)})</option>`).join('')
    : '<option value="">No players signed yet</option>';
  rivSel.innerHTML = rivPlayers.length
    ? rivPlayers.map(p => `<option value="${p.id}">${p.name} (${roleLabel(p.role)}, OVR ${p.ovr}, ${fmtCr(p.soldPrice)})</option>`).join('')
    : '<option value="">No players signed yet</option>';
}

async function proposeHumanTrade(){
  if (!state.humanTeamId || !state.tradesUnlocked) return;
  const myT = state.teams.find(x => x.id === state.humanTeamId);
  const rivT = state.teams.find(x => x.id === document.getElementById('htRivalSelect').value);
  const myPid = parseInt(document.getElementById('htMyPlayer').value, 10);
  const rivPid = parseInt(document.getElementById('htRivalPlayer').value, 10);
  const fb = document.getElementById('htFeedback');
  if (isNaN(myPid) || isNaN(rivPid) || !rivT) { showToast('Both teams need signed players first!'); return; }

  const pSend = state.players[myPid], pReq = state.players[rivPid];
  const cMy = teamRoleCounts(myT), cRiv = teamRoleCounts(rivT);

  // Check OS limits
  const myNewOS = cMy.OS - (pSend.os ? 1 : 0) + (pReq.os ? 1 : 0);
  const rivNewOS = cRiv.OS - (pReq.os ? 1 : 0) + (pSend.os ? 1 : 0);
  if (myNewOS > 8 || rivNewOS > 8) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444"><b>❌ Trade Blocked:</b> Swap would exceed the 8 Overseas player limit.</div>`;
    sfxUnsold(); return;
  }

  // Cash adjustment (difference in auction price)
  const diff = pReq.soldPrice - pSend.soldPrice; // if >0, Human pays Rival
  if ((diff > 0 && myT.purse < diff) || (diff < 0 && rivT.purse < -diff)) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444"><b>❌ Insufficient Purse:</b> Cash balance difference (${fmtCr(Math.abs(diff))}) cannot be covered.</div>`;
    sfxUnsold(); return;
  }

  // Rival AI GM Fairness Evaluation (Live Gemini AI if key active, plus hard OVR sanity guardrail)
  const ovrGap = pReq.ovr - pSend.ovr;
  const rivNeedsSendRole = cRiv[pSend.role] < (rivT.targets[pSend.role] || 6);
  const fairThreshold = rivNeedsSendRole ? 4 : 2;
  let accepted = ovrGap <= fairThreshold;
  let gmReply = accepted
    ? `Fair swap — ${pSend.name} fits our ${rivT.home} plans. Deal done!`
    : `No deal! ${pReq.name} (OVR ${pReq.ovr}) is much stronger than ${pSend.name} (OVR ${pSend.ovr}). Offer someone closer in value!`;

  if (getSavedApiKey()) {
    fb.innerHTML = `<div class="msg" style="opacity:0.75">🤖 ${rivT.id} GM (${rivT.staff[0]}) is reviewing your trade offer...</div>`;
    const htPrompt = `You are the GM of ${rivT.name} (${rivT.id}, Home: ${rivT.home}, Coach: ${rivT.staff[0]}).
Your squad: ${rivT.squad.length}/25 (Bat:${cRiv.B}, WK:${cRiv.WK}, AR:${cRiv.AR}, Bowl:${cRiv.BW}, OS:${cRiv.OS}/8), Purse: ${fmtCr(rivT.purse)}.
${myT.id} offers a 1-for-1 trade:
- You RECEIVE: ${pSend.name} (${roleLabel(pSend.role)}, OVR ${pSend.ovr}, Tier ${pSend.tier}, Price ${fmtCr(pSend.soldPrice)})
- You GIVE UP: ${pReq.name} (${roleLabel(pReq.role)}, OVR ${pReq.ovr}, Tier ${pReq.tier}, Price ${fmtCr(pReq.soldPrice)})
- Cash adjustment: ${diff >= 0 ? `You receive +${fmtCr(diff)}` : `You pay ${fmtCr(-diff)}`}.
Be a sharp, realistic IPL GM: REJECT unfair/lopsided trades (especially if OVR gap > 4 against you); ACCEPT fair trades that fill a role need or upgrade your balance.
Return ONLY valid JSON: {"accept": true or false, "message": "1 short in-character sentence"}`;
    const aiEval = await callGeminiJSON(htPrompt, 0.7);
    if (aiEval && typeof aiEval.accept === 'boolean' && aiEval.message) {
      // Hard anti-exploit guardrail: never accept if user tries to steal a player 7+ OVR higher
      accepted = aiEval.accept && (ovrGap <= 6);
      gmReply = aiEval.message;
    }
  }

  if (!accepted) {
    sfxUnsold();
    fb.innerHTML = `<div class="msg" style="border-left-color:${rivT.color}"><b style="color:${rivT.color}">${rivT.id} GM Rejected:</b> "${gmReply}"</div>`;
    return;
  }

  // Accepted! Execute fair trade immediately
  myT.squad = myT.squad.filter(id => id !== pSend.id);
  rivT.squad.push(pSend.id); pSend.soldTo = rivT.id;
  rivT.squad = rivT.squad.filter(id => id !== pReq.id);
  myT.squad.push(pReq.id); pReq.soldTo = myT.id;
  myT.purse -= diff;
  rivT.purse += diff;

  const summary = `🤝 FAIR TRADE (${myT.id} ⇄ ${rivT.id}): ${pSend.name} swapped for ${pReq.name}${diff !== 0 ? ` (${fmtCr(Math.abs(diff))} cash adj.)` : ''}`;
  state.tradeHistory.unshift(summary);
  pushTicker(summary);
  sfxTrade();
  fb.innerHTML = `<div class="msg" style="border-left-color:#10b981"><b style="color:#6ee7b7">✅ ${rivT.id} GM Accepted!</b> "${gmReply}"</div>`;
  showToast(`Fair trade completed with ${rivT.id}!`);
  renderAll(); saveState();
}

// ==================== 10. INJURY REPLACEMENT DESK (FROM UNSOLD POOL) ====================
function generateInjuryReports(){
  const eligibleTeams = shuffleArr(state.teams.filter(t => t.squad.length >= 12));
  const unsoldPool = state.players.filter(p => p.status === 'UNSOLD' || p.status === 'AVAIL');
  if (!eligibleTeams.length || !unsoldPool.length) {
    showToast('Need signed squads and unsold players to trigger injury replacements.');
    return;
  }

  const injuries = ['Hamstring tear (ruled out of season)','Side strain during nets','Fractured bowling finger','Ankle ligament sprain','Lower-back stress reaction'];
  const newReqs = [];
  const usedUnsold = new Set();

  eligibleTeams.slice(0, 3).forEach((t, idx) => {
    const candidates = t.squad.map(id=>state.players[id]).filter(p => !p.injured);
    if (!candidates.length) return;
    const injPlayer = candidates[Math.floor(Math.random() * Math.min(12, candidates.length))];
    const c = teamRoleCounts(t);
    const osAfterOut = c.OS - (injPlayer.os ? 1 : 0);

    // Find best matching replacement from UNSOLD (or remaining AVAIL) pool respecting OS cap
    const rep = unsoldPool
      .filter(u => !usedUnsold.has(u.id) && u.role === injPlayer.role && (!u.os || osAfterOut < 8))
      .sort((a,b) => b.ovr - a.ovr)[0]
      || unsoldPool.find(u => !usedUnsold.has(u.id) && (!u.os || osAfterOut < 8));

    if (rep) {
      usedUnsold.add(rep.id);
      newReqs.push({
        id: 'INJ-' + Date.now() + '-' + idx,
        teamId: t.id,
        outId: injPlayer.id,
        inId: rep.id,
        reason: injuries[Math.floor(Math.random() * injuries.length)]
      });
    }
  });

  state.injuryRequests = newReqs;
  sfxHijack();
  showToast(`🏥 ${newReqs.length} franchise injury replacement requests awaiting your approval!`);
  renderInjuries(); saveState();
}

function approveInjuryReplacement(reqId){
  const idx = state.injuryRequests.findIndex(r => r.id === reqId);
  if (idx === -1) return;
  const req = state.injuryRequests[idx];
  const t = state.teams.find(x => x.id === req.teamId);
  const pOut = state.players[req.outId];
  const pIn = state.players[req.inId];

  if (!t.squad.includes(pOut.id)) { state.injuryRequests.splice(idx, 1); renderInjuries(); return; }

  // Swap injured player out, bring unsold replacement in (keeps squad exact at 25/25!)
  t.squad = t.squad.filter(id => id !== pOut.id);
  pOut.injured = true; pOut.status = 'INJURED'; pOut.soldTo = null;
  t.squad.push(pIn.id);
  pIn.status = 'SOLD'; pIn.soldTo = t.id; pIn.soldPrice = pIn.base;

  const log = `🏥 ${t.id} Replacement Approved: ${pIn.name} (${roleLabel(pIn.role)}, OVR ${pIn.ovr}) replaces injured ${pOut.name} (${req.reason}). Squad stays ${t.squad.length}/25.`;
  state.injuryHistory.unshift(log);
  state.injuryRequests.splice(idx, 1);
  pushTicker(log);
  sfxTrade();
  showToast(`${t.id} signed ${pIn.name} as injury replacement!`);
  renderAll(); saveState();
}

function rejectInjuryReplacement(reqId){
  state.injuryRequests = state.injuryRequests.filter(r => r.id !== reqId);
  sfxUnsold();
  showToast('Injury replacement request rejected.');
  renderInjuries(); saveState();
}

function renderInjuries(){
  const wrap = document.getElementById('injuryRequestsWrap');
  const pill = document.getElementById('injuryCountPill');
  if (pill) pill.textContent = `${state.injuryHistory.length} INJURIES`;
  if (!wrap) return;
  let html = '';
  if (state.injuryRequests.length) {
    html += state.injuryRequests.map(r => {
      const t = state.teams.find(x=>x.id===r.teamId);
      const pOut = state.players[r.outId], pIn = state.players[r.inId];
      return `
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.35);border-left:4px solid ${t.color};border-radius:12px;padding:10px;margin-bottom:8px">
          <div style="font-size:13px;font-weight:700"><span style="color:${t.color}">${t.id}</span> Injury Replacement Request</div>
          <div style="font-size:12px;color:#fca5a5;margin:4px 0">🚑 OUT: <b>${pOut.name}</b> (${roleLabel(pOut.role)}, OVR ${pOut.ovr}) — ${r.reason}</div>
          <div style="font-size:12px;color:#6ee7b7;margin-bottom:8px">✅ IN (Unsold Pool): <b>${pIn.name}</b> (${roleLabel(pIn.role)}, ${pIn.os?'OS':'IND'}, OVR ${pIn.ovr})</div>
          <div class="btn-row" style="margin-top:0">
            <button class="btn btn-green btn-sm" onclick="approveInjuryReplacement('${r.id}')">✓ Approve Swap</button>
            <button class="btn btn-red btn-sm" onclick="rejectInjuryReplacement('${r.id}')">✕ Reject</button>
          </div>
        </div>`;
    }).join('');
  } else {
    html += `<div style="font-size:12px;color:var(--muted)">No pending injury requests. Tap <b>Trigger Match Injuries</b> to simulate injuries &amp; replace players from the Unsold Pool.</div>`;
  }
  if (state.injuryHistory.length) {
    html += `<div style="margin-top:8px;display:flex;flex-direction:column;gap:5px">${state.injuryHistory.slice(0,25).map(h=>`<div class="msg" style="font-size:11.5px;border-left-color:#ef4444">${h}</div>`).join('')}</div>`;
  }
  wrap.innerHTML = html;
}



// ==================== 16. V19 FULL-FLEDGED UPGRADES: UNIVERSAL TRADE DESK (HUMAN<->HUMAN, HUMAN<->AI, AI<->AI + ALL-CASH), 10-TEAM MATRIX, SOLD LOG, CUSTOM RULES, REPLAY SEASON & CONFETTI ====================
function populateUniversalTradeDesk(){
  const panel = document.getElementById('universalTradePanel');
  if (!panel) return;
  if (!state.tradesUnlocked) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const selA = document.getElementById('utTeamA');
  const selB = document.getElementById('utTeamB');
  const prevA = selA.value, prevB = selB.value;

  const teamLabel = t => {
    const tag = (t.isHuman || t.id === state.humanTeamId) ? `👤 ${t.ownerName && t.ownerName !== 'AI Bot' ? t.ownerName : 'Human'}` : '🤖 AI';
    return `${t.id} (${tag} • ${fmtCr(t.purse)} • ${t.squad.length}/25)`;
  };
  selA.innerHTML = state.teams.map(t => `<option value="${t.id}">${teamLabel(t)}</option>`).join('');
  selB.innerHTML = state.teams.map(t => `<option value="${t.id}">${teamLabel(t)}</option>`).join('');

  if (prevA && state.teams.some(t => t.id === prevA)) selA.value = prevA;
  else if (state.humanTeamId) selA.value = state.humanTeamId;
  else selA.value = state.teams[0].id;

  if (prevB && state.teams.some(t => t.id === prevB)) selB.value = prevB;
  else selB.value = state.teams.find(t => t.id !== selA.value)?.id || state.teams[1].id;

  populateUniversalTradePlayers();
}

function populateUniversalTradePlayers(){
  const idA = document.getElementById('utTeamA').value;
  const idB = document.getElementById('utTeamB').value;
  const tA = state.teams.find(x => x.id === idA);
  const tB = state.teams.find(x => x.id === idB);
  const pSelA = document.getElementById('utPlayerA');
  const pSelB = document.getElementById('utPlayerB');
  if (!tA || !tB || !pSelA || !pSelB) return;

  const listA = tA.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);
  const listB = tB.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);

  pSelA.innerHTML = listA.length
    ? listA.map(p=>`<option value="${p.id}">${p.name} (${roleLabel(p.role)}, OVR ${p.ovr}, ${fmtCr(p.soldPrice)})</option>`).join('')
    : '<option value="">No players signed yet</option>';

  pSelB.innerHTML = `<option value="CASH_ONLY">💵 ALL-CASH DEAL (Team B buys Player A for cash)</option>` +
    (listB.length ? listB.map(p=>`<option value="${p.id}">${p.name} (${roleLabel(p.role)}, OVR ${p.ovr}, ${fmtCr(p.soldPrice)})</option>`).join('') : '');

  // Update dynamic badge showing Human<->Human vs Human<->AI vs AI<->AI
  const isHumanA = tA.isHuman || tA.id === state.humanTeamId;
  const isHumanB = tB.isHuman || tB.id === state.humanTeamId;
  const pill = document.getElementById('utModePill');
  const pitchBtn = document.getElementById('btnUtPitchAI');
  if (pill) {
    if (isHumanA && isHumanB) pill.textContent = '👥 FRIEND ↔ FRIEND';
    else if (isHumanA || isHumanB) pill.textContent = '🤝 FRIEND ↔ AI GM';
    else pill.textContent = '🤖 AI ↔ AI DESK';
  }
  if (pitchBtn) {
    pitchBtn.style.display = (isHumanA && isHumanB) ? 'none' : 'inline-flex';
  }
}

async function executeUniversalTrade(askAIGM=false){
  const idA = document.getElementById('utTeamA').value;
  const idB = document.getElementById('utTeamB').value;
  const fb = document.getElementById('utFeedback');
  if (idA === idB) { showToast('Pick two different franchises!'); return; }

  const tA = state.teams.find(x => x.id === idA);
  const tB = state.teams.find(x => x.id === idB);
  const pidA = parseInt(document.getElementById('utPlayerA').value, 10);
  const rawB = document.getElementById('utPlayerB').value;
  const isAllCash = (rawB === 'CASH_ONLY');
  const pidB = isAllCash ? null : parseInt(rawB, 10);
  const extraAtoB = parseInt(document.getElementById('utCashSweetener').value, 10) || 0;

  if (isNaN(pidA)) { showToast(`${tA.id} has no players to trade!`); return; }
  if (!isAllCash && isNaN(pidB)) { showToast(`${tB.id} has no players — choose All-Cash Deal!`); return; }

  const pA = state.players[pidA];
  const pB = isAllCash ? null : state.players[pidB];
  const cA = teamRoleCounts(tA), cB = teamRoleCounts(tB);

  // Strict IPL Roster Cap Validations
  if (isAllCash && tB.squad.length >= 25) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444">❌ <b>Blocked:</b> ${tB.id} already has 25/25 players! Pick a 1-for-1 swap instead.</div>`;
    sfxUnsold(); return;
  }
  const newOSA = cA.OS - (pA.os?1:0) + (pB && pB.os ? 1 : 0);
  const newOSB = cB.OS - (pB && pB.os ? 1 : 0) + (pA.os?1:0);
  if (newOSA > 8 || newOSB > 8) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444">❌ <b>Blocked:</b> Trade would exceed the 8 Overseas player limit!</div>`;
    sfxUnsold(); return;
  }

  // Net cash flow B -> A = (PriceA - PriceB) - extraAtoB
  const baseDiffBtoA = isAllCash ? pA.soldPrice : (pA.soldPrice - pB.soldPrice);
  const netBtoA = baseDiffBtoA - extraAtoB;
  if (netBtoA > 0 && tB.purse < netBtoA) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444">❌ <b>Blocked:</b> ${tB.id} needs ${fmtCr(netBtoA)} purse (only has ${fmtCr(tB.purse)}).</div>`;
    sfxUnsold(); return;
  }
  if (netBtoA < 0 && tA.purse < -netBtoA) {
    fb.innerHTML = `<div class="msg" style="border-left-color:#ef4444">❌ <b>Blocked:</b> ${tA.id} needs ${fmtCr(-netBtoA)} purse (only has ${fmtCr(tA.purse)}).</div>`;
    sfxUnsold(); return;
  }

  // If Pitching to AI GM, evaluate fairness with Gemini AI (or Smart Offline GM Brain)!
  if (askAIGM) {
    const aiTeam = (!tB.isHuman && tB.id !== state.humanTeamId) ? tB : tA;
    const isBTheAI = (aiTeam.id === tB.id);
    const recvP = isBTheAI ? pA : pB;
    const giveP = isBTheAI ? pB : pA;
    const stMap = state.seasonData && state.seasonData.pStats ? state.seasonData.pStats : {};
    const getFormAvg = (p) => {
      if (!p || !state.playerForm || !state.playerForm[p.id] || !state.playerForm[p.id].length) return 26;
      const arr = state.playerForm[p.id];
      return Math.round(arr.reduce((a,b)=>a+b,0) / arr.length);
    };
    const getStatSummary = (p) => {
      if (!p) return 'All-Cash';
      const st = stMap[p.id] || { runs:0, wkts:0, impact:0 };
      const fAvg = getFormAvg(p);
      const fTag = fAvg >= 42 ? 'HOT FORM' : fAvg <= 12 ? 'COLD FORM' : 'STEADY FORM';
      return `${p.name} (${roleLabel(p.role)}, OVR ${p.ovr}, ${p.os?'OS':'IND'}, Price ${fmtCr(p.soldPrice)}, Season: ${st.runs}R/${st.wkts}W/${Math.round(st.impact)}MVP, ${fTag})`;
    };

    const aiCounts = teamRoleCounts(aiTeam);
    const recvNeedBonus = recvP && aiCounts[recvP.role] < (aiTeam.targets[recvP.role] || 6) ? 3.5 : 0;
    const giveSurplusBonus = giveP && aiCounts[giveP.role] > (aiTeam.targets[giveP.role] || 6) - 1 ? 2.0 : 0;
    const pitchL = (aiTeam.home || '').toLowerCase();
    const spinPitch = pitchL.includes('chepauk') || pitchL.includes('ekana') || pitchL.includes('jaipur');
    const pitchFitBonus = (recvP && spinPitch && isSpinner(recvP)) ? 2.5 : (giveP && spinPitch && isSpinner(giveP)) ? -2.5 : 0;
    const formDelta = (getFormAvg(recvP) - getFormAvg(giveP)) * 0.08;
    const impactDelta = (((recvP && stMap[recvP.id]?.impact) || 0) - ((giveP && stMap[giveP.id]?.impact) || 0)) * 0.015;

    const ovrGain = (recvP ? recvP.ovr : 74) - (giveP ? giveP.ovr : 72);
    const aiCashDelta = isBTheAI ? -netBtoA : netBtoA; // + means AI receives cash
    const cashScore = aiCashDelta / 150;
    const totalEvalScore = ovrGain + recvNeedBonus + giveSurplusBonus + pitchFitBonus + formDelta + impactDelta + cashScore;

    let accepted = isAllCash
      ? (isBTheAI ? (pA.ovr >= 78 && tB.purse >= netBtoA + 300) : (pA.ovr <= 82 || aiCashDelta >= pA.fairVal * 1.05))
      : (totalEvalScore >= -1.5 && ovrGain >= -5);

    const reasons = [];
    if (recvNeedBonus > 0) reasons.push(`fills our ${roleLabel(recvP.role)} gap`);
    if (pitchFitBonus > 0) reasons.push(`great spin fit for ${aiTeam.home.split(' (')[0]}`);
    if (formDelta >= 1.5) reasons.push(`${recvP.name} is in hot form`);
    if (formDelta <= -1.5) reasons.push(`${recvP?.name || 'target'} is in cold form`);
    if (ovrGain <= -3) reasons.push(`OVR drop (${giveP?.ovr} → ${recvP?.ovr}) is too steep`);

    let gmReply = accepted
      ? `Deal accepted! ${reasons.length ? reasons.join(', ') : `Fits ${aiTeam.home.split(' (')[0]} well`} — ${aiTeam.staff[0].split(' (')[0]} signs off!`
      : `Rejected! ${reasons.length ? reasons.join('; ') : `We aren't weakening our ${aiTeam.id} core`}. Offer better form/OVR or add cash!`;

    if (getSavedApiKey()) {
      fb.innerHTML = `<div class="msg" style="opacity:0.75">🤖 ${aiTeam.id} GM (${aiTeam.staff[0]}) is evaluating this trade offer via Gemini AI...</div>`;
      const utPrompt = `You are the GM of ${aiTeam.name} (${aiTeam.id}, Home: ${aiTeam.home}, Coach: ${aiTeam.staff[0]}).
Purse: ${fmtCr(aiTeam.purse)}, Squad: ${aiTeam.squad.length}/25.
Trade Offer:
- You RECEIVE: ${getStatSummary(recvP)}
- You GIVE UP: ${getStatSummary(giveP)}
- Your Role Counts: Bat ${aiCounts.B}/${aiTeam.targets.B}, WK ${aiCounts.WK}/${aiTeam.targets.WK}, AR ${aiCounts.AR}/${aiTeam.targets.AR}, Bowl ${aiCounts.BW}/${aiTeam.targets.BW}, OS ${aiCounts.OS}/8.
- Net Cash Impact for you: ${aiCashDelta >= 0 ? `+${fmtCr(aiCashDelta)} gained` : `${fmtCr(-aiCashDelta)} spent`}.
Be a realistic IPL GM: REJECT unfair/exploitative trades; ACCEPT fair deals that improve balance or purse.
Return ONLY valid JSON: {"accept": true or false, "message": "1 short punchy in-character sentence"}`;
      const aiRes = await callGeminiJSON(utPrompt, 0.7);
      if (aiRes && typeof aiRes.accept === 'boolean' && aiRes.message) {
        accepted = aiRes.accept && (isAllCash || ovrGain >= -6);
        gmReply = aiRes.message;
      }
    }

    if (!accepted) {
      sfxUnsold();
      fb.innerHTML = `<div class="msg" style="border-left-color:${aiTeam.color}"><b style="color:${aiTeam.color}">${aiTeam.id} GM Rejected:</b> "${gmReply}"</div>`;
      return;
    }
    fb.innerHTML = `<div class="msg" style="border-left-color:#10b981"><b style="color:#6ee7b7">✅ ${aiTeam.id} GM Accepted!</b> "${gmReply}"</div>`;
  } else {
    fb.innerHTML = `<div class="msg" style="border-left-color:#10b981">✅ <b>Trade Executed!</b> Both squads &amp; purses updated cleanly.</div>`;
  }

  // Execute Transfer
  tA.squad = tA.squad.filter(id => id !== pA.id);
  tB.squad.push(pA.id); pA.soldTo = tB.id;
  if (pB) {
    tB.squad = tB.squad.filter(id => id !== pB.id);
    tA.squad.push(pB.id); pB.soldTo = tA.id;
  }
  tA.purse += netBtoA;
  tB.purse -= netBtoA;

  const summary = pB
    ? `🤝 TRADE (${tA.id} ⇄ ${tB.id}): ${pA.name} swapped for ${pB.name}${netBtoA !== 0 ? ` (${netBtoA > 0 ? tB.id + '→' + tA.id : tA.id + '→' + tB.id} ${fmtCr(Math.abs(netBtoA))})` : ''}`
    : `💵 ALL-CASH TRANSFER: ${tB.id} signed ${pA.name} from ${tA.id} for ${fmtCr(Math.abs(netBtoA))}`;
  state.tradeHistory.unshift(summary);
  pushTicker(summary);
  sfxTrade();
  showToast('🤝 Trade Completed!');
  renderAll(); saveState();
}


// ==================== 17. V20 FEATURES: TRADE WINDOW CHAT, PLAYING XI COACH CHAT & SHAREABLE SQUAD CARD ====================
async function sendTradeWindowChat(preset){
  const inp = document.getElementById('tradeWindowChatInput');
  const txt = (preset || (inp ? inp.value : '') || '').trim();
  if (!txt) return;
  if (inp && !preset) inp.value = '';

  const targetVal = document.getElementById('tradeChatTarget').value;
  const feed = document.getElementById('tradeWindowChatFeed');
  feed.innerHTML += `<div class="msg user"><b>You (${targetVal==='ALL'?'To All 10 GMs':'To '+targetVal+' GM'}):</b> ${txt}</div>`;
  feed.scrollTop = feed.scrollHeight;

  const targets = targetVal === 'ALL' ? state.teams : [state.teams.find(x => x.id === targetVal)].filter(Boolean);
  const propSummary = state.tradeProposals.length
    ? state.tradeProposals.map(tr => `${tr.teamA} sends ${state.players[tr.playerA]?.name} <-> ${tr.teamB} sends ${tr.playerB!==null?state.players[tr.playerB]?.name:'Cash'}`).join('; ')
    : 'No active pending proposals yet (user may be discussing general trades).';

  let aiReplies = null;
  if (getSavedApiKey()) {
    const wId = 'tw-' + Date.now();
    feed.innerHTML += `<div class="msg" id="${wId}" style="opacity:0.7">🤖 Franchise GMs replying in Trade War-Room...</div>`;
    feed.scrollTop = feed.scrollHeight;
    const teamCtx = targets.map(t => {
      const c = teamRoleCounts(t);
      return `${t.id} (GM/Coach: ${t.staff[0]}, Purse: ${fmtCr(t.purse)}, Sq: ${t.squad.length}/25, Bat:${c.B}, WK:${c.WK}, AR:${c.AR}, Bowl:${c.BW}, Spin:${c.spinners})`;
    }).join('\n');
    const prompt = `IPL Mega Auction Trade Window Chat!
Active Trade Proposals on table: ${propSummary}
Franchises replying:
${teamCtx}
The Commissioner/User just told them: "${txt}"
For each franchise, reply in 1 sharp, natural sentence (max 22 words) reacting to whether it's a good trade, bad trade, or answering their trade question.
Return ONLY valid JSON: {"CSK": "...", ...}`;
    aiReplies = await callGeminiJSON(prompt, 0.85);
    const wEl = document.getElementById(wId);
    if (wEl) wEl.remove();
  }

  const ql = txt.toLowerCase();
  targets.forEach((t, idx) => {
    let reply = aiReplies && aiReplies[t.id] ? aiReplies[t.id] : '';
    if (!reply) {
      const c = teamRoleCounts(t);
      if (/(bad trade|robbed|terrible|lopsided|don'?t do|rethink|worst)/i.test(ql)) {
        const lines = [
          `Fair warning! ${t.staff[0].split(' (')[0]} is double-checking the numbers — we won't let anyone fleece ${t.id}!`,
          `Hear you loud and clear — if the value isn't equal, we're pulling our offer off the table.`,
          `Appreciate the heads-up! We'll demand a cash sweetener or a better player before signing.`
        ];
        reply = lines[idx % lines.length];
      } else if (/(good trade|great trade|smart|fair|love|nice deal)/i.test(ql)) {
        const lines = [
          `Glad you see it too! Filling our roster gap while keeping ${fmtCr(t.purse)} intact is smart business.`,
          `Win-win deal! Both squads get stronger for the 74-match grind.`,
          `Exactly — ${t.id} needed that balance for ${t.home}. Ready to sign off!`
        ];
        reply = lines[idx % lines.length];
      } else {
        reply = `At ${t.id} (${t.squad.length}/25, ${fmtCr(t.purse)} left), we're open to fair 1-for-1 swaps—especially if it upgrades our ${c.WK<2?'WK':c.spinners<2?'Spin':c.BW<7?'Bowling':'Batting'} depth.`;
      }
    }
    feed.innerHTML += `<div class="msg" style="border-left-color:${t.color}"><b style="color:${t.color}">${t.id} GM:</b> ${reply}</div>`;
  });
  feed.scrollTop = feed.scrollHeight;
  beep(560, 0.06, 'sine', 0.08);
  if (voiceOn) {
    const nodes = Array.from(feed.querySelectorAll('.msg')).slice(-targets.length);
    const q = targets.map((t, i) => {
      const prof = getTeamVoiceProfile(t.id, 0);
      return { text: nodes[i] ? nodes[i].textContent : '', gender: prof.gender, pitch: prof.pitch, rate: prof.rate };
    }).filter(x => x.text);
    speakDiscussionQueue(q);
  }
}

async function sendXICoachChat(preset){
  const inp = document.getElementById('xiCoachChatInput');
  const txt = (preset || (inp ? inp.value : '') || '').trim();
  if (!txt) return;
  if (inp && !preset) inp.value = '';

  const selVal = document.getElementById('xiChatTarget').value;
  const targets = selVal === 'ALL'
    ? state.teams
    : [state.teams.find(x => x.id === (selVal === 'SELECTED' ? selectedSquadTab : selVal))].filter(Boolean);

  const feed = document.getElementById('xiCoachChatFeed');
  const labelTo = selVal === 'ALL' ? 'All 10 Coaches' : `${targets[0].id} Coach`;
  feed.innerHTML += `<div class="msg user"><b>You (To ${labelTo}):</b> ${txt}</div>`;
  feed.scrollTop = feed.scrollHeight;

  let aiReplies = null;
  if (getSavedApiKey()) {
    const wId = 'xic-' + Date.now();
    feed.innerHTML += `<div class="msg" id="${wId}" style="opacity:0.7">🧠 Head Coach analysing Playing XI suggestion via Gemini AI...</div>`;
    feed.scrollTop = feed.scrollHeight;

    const ctx = targets.map(t => {
      const { xi, impact } = computePlayingXII(t);
      const bench = t.squad.map(id=>state.players[id]).filter(p => p && !xi.some(x=>x.id===p.id)).slice(0,6).map(p=>`${p.name}(${p.role}${p.os?',OS':''})`).join(', ');
      return `${t.id} (Coach: ${t.staff[0]}, Home: ${t.home}): XI=[${xi.map(p=>`${p.name}(${p.role}${p.os?',OS':''})`).join(', ')}], Impact=${impact?impact.name:'None'}, Bench=[${bench}]`;
    }).join('\n');

    const prompt = `You are the Head Coach(es) in an IPL Mega Auction app.
Team(s) & Current Playing XII:
${ctx}
The Manager/User just gave this Playing XI suggestion or question: "${txt}"

For each team, respond honestly in 1-2 crisp sentences (max 32 words):
- Explicitly start with "✅ GOOD IDEA:" or "❌ BAD IDEA:" or "⚖️ MIXED IDEA:" when evaluating a suggestion!
- Ground your answer in their actual players, overseas 4-player cap, bowling depth, and home pitch (${targets.length===1 ? targets[0].home : 'each home pitch'}).
Return ONLY valid JSON: {"CSK": "✅ GOOD IDEA: ...", ...}`;
    aiReplies = await callGeminiJSON(prompt, 0.75);
    const wEl = document.getElementById(wId);
    if (wEl) wEl.remove();
  }

  const ql = txt.toLowerCase();
  targets.forEach(t => {
    const coachName = t.staff[0].split(' (')[0];
    let reply = aiReplies && aiReplies[t.id] ? aiReplies[t.id] : '';
    if (!reply) {
      const { xi, impact } = computePlayingXII(t);
      const bowlers = xi.filter(p => p.role==='BW'||p.role==='AR').length;
      const spinners = xi.filter(p => isSpinner(p)).length;
      if (/spinner|spin/i.test(ql)) {
        const goodSpin = t.home.toLowerCase().includes('chepauk') || t.home.toLowerCase().includes('ekana') || spinners < 2;
        reply = goodSpin
          ? `✅ GOOD IDEA: At ${t.home}, adding an extra spinner (currently ${spinners} in XI) gives us crucial middle-overs control!`
          : `❌ BAD IDEA: We already have ${spinners} spin options and ${t.home} favours pace—extra spin could get targeted.`;
      } else if (/impact|sub/i.test(ql)) {
        reply = `⚡ Currently ${impact ? impact.name : 'our top bench pick'} is our Impact Sub—we can bring them in as a specialist batter while chasing or extra bowler defending!`;
      } else if (/weak|flaw|problem/i.test(ql)) {
        reply = `🔍 Honest check: ${bowlers < 5 ? 'We are short on a 5th bowler in the XI!' : 'Our core XI is solid, just need our finishers to fire under pressure at ' + t.home + '.'}`;
      } else {
        reply = `⚖️ MIXED IDEA: Interesting thought for ${t.home}! Tap "✏️ Edit Manually" above if you want to test that swap in our Playing XII (we have ${bowlers} bowling options right now).`;
      }
    }
    feed.innerHTML += `<div class="msg" style="border-left-color:${t.color}"><b style="color:${t.color}">${t.id} (${coachName}):</b> ${reply}</div>`;
  });
  feed.scrollTop = feed.scrollHeight;
  beep(580, 0.06, 'sine', 0.08);
  if (voiceOn) {
    const nodes = Array.from(feed.querySelectorAll('.msg')).slice(-targets.length);
    const q = targets.map((t, i) => {
      const prof = getTeamVoiceProfile(t.id, 0);
      return { text: nodes[i] ? nodes[i].textContent : '', gender: prof.gender, pitch: prof.pitch, rate: prof.rate };
    }).filter(x => x.text);
    speakDiscussionQueue(q);
  }
}

function copySquadCard(){
  const t = state.teams.find(x => x.id === selectedSquadTab);
  if (!t || !t.squad.length) { showToast('No players signed for this team yet!'); return; }
  const { xi, impact } = computePlayingXII(t);
  const lines = [
    `🏏 ${t.name.toUpperCase()} (${t.id}) — IPL MEGA AUCTION`,
    `📍 ${t.home} | 💰 Purse Left: ${fmtCr(t.purse)} | Squad: ${t.squad.length}/25`,
    `⭐ PLAYING XI:`,
    ...xi.map((p, i) => `${i+1}. ${p.name}${t.captainId===p.id?' (C)':''}${p.os?' ✈️':''} (${p.role})`),
    impact ? `⚡ Impact Sub: ${impact.name}` : ''
  ].filter(Boolean).join('\n');
  if (navigator.clipboard) navigator.clipboard.writeText(lines);
  showToast(`📋 Copied ${t.id} Playing XII Card — ready to paste on WhatsApp!`);
}


function toggleTopTools(force){
  const el = document.getElementById('topToolsDropdown');
  const btn = document.getElementById('btnToolsDrop');
  if (!el) return;
  const open = (typeof force === 'boolean') ? force : !el.classList.contains('open');
  el.classList.toggle('open', open);
  if (btn) btn.textContent = open ? '▴' : '▾';
}


// ==================== 18. V26 FEATURES: LIVE GEMINI CRICKET SCOUTING (WITH GOOGLE SEARCH GROUNDING), COACHING STAFF MARKET & TARGET WISHLIST ====================

// Helper that attempts Google Search Grounding for live cricket stats first, then falls back cleanly to standard Gemini JSON
async function callGeminiGroundedScout(prompt){
  const key = getSavedApiKey();
  if (!key) return null;
  const modelsToTry = workingGeminiModel
    ? [workingGeminiModel, ...GEMINI_MODELS.filter(m => m !== workingGeminiModel)]
    : GEMINI_MODELS;

  // Attempt 1: With Google Search Grounding (live web stats from Cricinfo/Cricbuzz/IPLT20)
  for (const model of modelsToTry.slice(0, 2)) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt + '\nRespond ONLY with a raw JSON object (no markdown fences).' }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.4 }
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      const gParts = data?.candidates?.[0]?.content?.parts || [];
      const rawText = gParts.filter(x => !x.thought && x.text).map(x => x.text).join('') || gParts.map(x => x.text || '').join('');
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        parsed._webGrounded = Boolean(data?.candidates?.[0]?.groundingMetadata);
        workingGeminiModel = model;
        return parsed;
      }
    } catch(e){}
  }

  // Attempt 2: Standard Gemini JSON fallback (fast & reliable)
  const fallback = await callGeminiJSON(prompt, 0.5);
  if (fallback) fallback._webGrounded = false;
  return fallback;
}

function buildOfflineScoutReport(p){
  const spin = isSpinner(p);
  const roleTag = p.role === 'B' ? 'Strokeplay / Power' : p.role === 'WK' ? 'Gloves + Middle-Order' : p.role === 'AR' ? 'Dual-Impact 3D' : spin ? 'Spin Control' : 'Pace & Bounce';
  const stat1 = (p.role === 'B' || p.role === 'WK')
    ? `Est. T20 SR: ${128 + (p.ovr - 70) * 1.1 | 0}`
    : `Est. T20 Econ: ${(8.8 - (p.ovr - 70) * 0.05).toFixed(2)}`;
  const stat2 = p.role === 'AR'
    ? `SR ${132 + (p.ovr - 72)} • Econ ${(8.4 - (p.ovr - 72) * 0.04).toFixed(2)}`
    : `Phase: ${spin ? 'Middle Overs (7-15)' : p.role === 'BW' ? 'Powerplay & Death' : 'Powerplay / Finisher'}`;

  // Match player profile to the 10 real IPL home ground conditions
  const scored = state.teams.map(t => {
    let sc = 50;
    const h = t.home.toLowerCase();
    const c = teamRoleCounts(t);
    if (spin && (h.includes('chepauk') || h.includes('ekana') || h.includes('jaipur') || h.includes('eden'))) sc += 26;
    if (!spin && p.role === 'BW' && (h.includes('wankhede') || h.includes('mullanpur') || h.includes('ahmedabad'))) sc += 24;
    if ((p.role === 'B' || p.role === 'WK') && (h.includes('chinnaswamy') || h.includes('uppal') || h.includes('wankhede'))) sc += 22;
    if (p.role === 'AR' && (h.includes('chepauk') || h.includes('ekana') || h.includes('eden'))) sc += 20;
    if (c[p.role] < (t.targets[p.role] || 6)) sc += 14;
    if (t.pref && t.pref.includes(p.role)) sc += 10;
    return { t, sc };
  }).sort((a,b) => b.sc - a.sc).slice(0, 3);

  return {
    stats: [stat1, stat2, `Trait: ${roleTag}`],
    bestFits: scored.map(x => ({
      teamId: x.t.id,
      reason: `Suits ${x.t.home.split(' (')[0]} conditions & fills ${x.t.id}'s ${roleLabel(p.role)} plan.`
    })),
    summary: `Tier-${p.tier} ${p.os?'Overseas':'Indian'} ${roleLabel(p.role)} tailored for ${scored.map(x=>x.t.id).join(', ')}.`,
    _webGrounded: false,
    _offline: true
  };
}

async function scoutCurrentPlayer(forceRefresh=false){
  if (state.curId === null) return;
  const p = state.players[state.curId];
  const box = document.getElementById('scoutDossierBox');
  const lbl = document.getElementById('scoutSourceLabel');
  const statsRow = document.getElementById('scoutStatsRow');
  const fitsList = document.getElementById('scoutFitsList');
  if (!box || !p) return;

  box.style.display = 'block';

  // Use cached dossier if already scouted and not forced
  if (!forceRefresh && state.scoutCache && state.scoutCache[p.id]) {
    renderScoutDossier(p, state.scoutCache[p.id]);
    return;
  }

  // Show instant baseline while Gemini searches cricket stats
  const baseline = buildOfflineScoutReport(p);
  renderScoutDossier(p, baseline, Boolean(getSavedApiKey()));

  if (!getSavedApiKey() || (quotaSaverOn && !forceRefresh)) return;

  const teamConditions = state.teams.map(t => `${t.id}: ${t.home} (Coach: ${t.staff[0]}, Need: ${t.pref.join('/')})`).join('\n');
  const prompt = `You are a world-class IPL Cricket Data Scout. Analyze real-world IPL & T20 career/recent stats for cricket player "${p.name}" (${roleLabel(p.role)}, ${p.os?'Overseas':'Indian'}).
Evaluate which 3 IPL franchises best suit ${p.name} based on their home pitch conditions and coaching philosophy:
${teamConditions}

Return ONLY valid JSON:
{
  "stats": ["e.g. IPL SR: 148.2 / Avg: 32.4", "e.g. Phase: Powerplay & Death", "e.g. Key Skill: Left-arm swing / Spin basher"],
  "bestFits": [
    {"teamId": "CSK", "reason": "1 crisp sentence why ${p.name} thrives at their home ground & under their coach"},
    {"teamId": "MI", "reason": "..."},
    {"teamId": "SRH", "reason": "..."}
  ],
  "summary": "1 punchy scout verdict line (max 20 words)"
}`;

  const aiReport = await callGeminiGroundedScout(prompt);
  if (aiReport && Array.isArray(aiReport.bestFits) && aiReport.bestFits.length) {
    if (!state.scoutCache) state.scoutCache = {};
    state.scoutCache[p.id] = aiReport;

    // Apply tactical suitability boost (+₹1.25 Cr to #1 fit, +₹75 L to #2 fit, +₹50 L to #3 fit) so AI GMs react!
    if (!state.scoutSuitability) state.scoutSuitability = {};
    state.scoutSuitability[p.id] = {};
    const bonuses = [125, 75, 50];
    aiReport.bestFits.slice(0, 3).forEach((bf, idx) => {
      if (bf.teamId) state.scoutSuitability[p.id][bf.teamId] = bonuses[idx] || 50;
    });

    if (state.curId === p.id) {
      renderScoutDossier(p, aiReport, false);
    }
    const fitIds = aiReport.bestFits.slice(0, 3).map(x => x.teamId).join(', ');
    addReaction(`🔍 <b>SCOUT REPORT (${p.name}):</b> Best pitch fit → <b>${fitIds}</b>. <i>${aiReport.summary || ''}</i>`, '#0f766e');
    saveState();
  }
}

function renderScoutDossier(p, rep, loadingAI=false){
  const lbl = document.getElementById('scoutSourceLabel');
  const statsRow = document.getElementById('scoutStatsRow');
  const fitsList = document.getElementById('scoutFitsList');
  if (!lbl || !statsRow || !fitsList) return;

  if (loadingAI) {
    lbl.textContent = '🌐 GEMINI ANALYSING CRICKET STATS & PITCH FIT...';
  } else if (rep._webGrounded) {
    lbl.textContent = '🌐 LIVE WEB-GROUNDED GEMINI SCOUT REPORT';
  } else if (!rep._offline) {
    lbl.textContent = '🤖 GEMINI AI SCOUTING & PITCH FIT REPORT';
  } else {
    lbl.textContent = '🔍 SMART SCOUTING & PITCH FIT (ADD GEMINI KEY FOR WEB STATS)';
  }

  statsRow.innerHTML = (rep.stats || []).slice(0, 3).map(s => `<span class="scout-stat-pill">${s}</span>`).join('');
  fitsList.innerHTML = (rep.bestFits || []).slice(0, 3).map((bf, i) => {
    const t = state.teams.find(x => x.id === bf.teamId);
    const col = t ? t.color : 'var(--gold)';
    return `<div class="scout-fit-row" style="border-left-color:${col}">${getTeamLogo(bf.teamId, 16)} <b>#${i+1} ${bf.teamId}</b> — ${bf.reason}</div>`;
  }).join('');
}

// ==================== PRE-AUCTION COACHING STAFF REPLACEMENT MARKET ====================
const COACH_MARKET_POOL = {
  // 30 Head Coaches: All 10 Official IPL 2027 Head Coaches + 20 Elite Franchise/Free-Agent Coaches
  // STRICTLY ZERO active international national-team coaches (no Gambhir, McCullum, McDonald, Hesson, Walter, Conrad, Sammy, etc.)
  head: [
    // --- Official IPL 2027 Head Coaches ---
    { name:'Zaheer Khan (Head Coach)', pref:['BW','AR'], inflator:0.28, mindset:'CSK 2027: Sharp pace-spin balance, bowling discipline & batting depth till #8.' },
    { name:'Kieron Pollard (Head Coach)', pref:['AR','BW'], inflator:0.42, mindset:'MI 2027: Fearless power-hitters, explosive finishers & clutch death bowling.' },
    { name:'Andy Flower (Head Coach)', pref:['B','WK'], inflator:0.45, mindset:'RCB 2027: Bold superstar hunters, fearless power-hitters & strike bowlers.' },
    { name:'Abhishek Nayar (Head Coach)', pref:['AR','BW'], inflator:0.41, mindset:'KKR 2027: Player-centric Indian core, mystery spin & middle-order six-hitters.' },
    { name:'Daniel Vettori (Head Coach)', pref:['B','BW'], inflator:0.40, mindset:'SRH 2027: All-out batting firepower paired with skiddy fast bowling.' },
    { name:'Kumar Sangakkara (Head Coach)', pref:['B','BW'], inflator:0.33, mindset:'RR 2027: Data-driven scouting, classical top order & quality wrist-spin.' },
    { name:'Sourav Ganguly (Head Coach)', pref:['B','WK'], inflator:0.50, mindset:'DC 2027: Fearless Indian leadership, attacking batters & bold bidding wars.' },
    { name:'Ricky Ponting (Head Coach)', pref:['AR','B'], inflator:0.55, mindset:'PBKS 2027: Heavy-purse bullies chasing overseas power-hitters & express pace.' },
    { name:'Ashish Nehra (Head Coach)', pref:['BW','B'], inflator:0.31, mindset:'GT 2027: Bowling-first pragmatist with a lethal 5-bowler core & ice-cool finishers.' },
    { name:'Justin Langer (Head Coach)', pref:['AR','WK'], inflator:0.43, mindset:'LSG 2027: Tough, versatile all-rounders and tall hit-the-deck fast bowlers.' },
    // --- 20 Free-Agent & Franchise-Only Elite Head Coaches ---
    { name:'Stephen Fleming (Head Coach)', pref:['AR','BW'], inflator:0.26, mindset:'5x IPL Champion: Calm, experience-first, spin control & deep batting.' },
    { name:'Mahela Jayawardene (Head Coach)', pref:['BW','B'], inflator:0.35, mindset:'3x IPL Champion: Elite Indian core, death-over pacers & tactical matchups.' },
    { name:'Rahul Dravid (Head Coach)', pref:['B','BW'], inflator:0.32, mindset:'Youth scouting, classical anchors & disciplined bowling attacks.' },
    { name:'Ravi Shastri (Head Coach)', pref:['BW','AR'], inflator:0.49, mindset:'Fearless aggressive cricket, 145+ kmph express pacers & bold chases.' },
    { name:'Gary Kirsten (Head Coach)', pref:['B','BW'], inflator:0.30, mindset:'Calm championship culture, anchors & reliable bowling depth.' },
    { name:'Tom Moody (Head Coach)', pref:['BW','AR'], inflator:0.35, mindset:'Strong bowling unit that defends 160+ on any surface.' },
    { name:'Trevor Bayliss (Head Coach)', pref:['B','AR'], inflator:0.36, mindset:'2x IPL Winner: White-ball specialist targeting multi-dimensional all-rounders.' },
    { name:'Chandrakant Pandit (Head Coach)', pref:['AR','BW'], inflator:0.38, mindset:'Disciplined domestic Indian core & strict tactical spin matchups.' },
    { name:'Hemang Badani (Head Coach)', pref:['WK','BW'], inflator:0.46, mindset:'Street-smart Indian core & aggressive purse disruption.' },
    { name:'Jonathan Trott (Head Coach)', pref:['B','BW'], inflator:0.34, mindset:'Structured chases, disciplined seam attacks & relentless fighting spirit.' },
    { name:'Mark Boucher (Head Coach)', pref:['WK','AR'], inflator:0.44, mindset:'Explosive keeper-batters, athletic fielders & attacking seamers.' },
    { name:'Simon Katich (Head Coach)', pref:['B','AR'], inflator:0.36, mindset:'Balanced top-order stability paired with smart matchup bowlers.' },
    { name:'Sanjay Bangar (Head Coach)', pref:['B','AR'], inflator:0.33, mindset:'Indian batting depth, technical anchors & utility all-rounders.' },
    { name:'Anil Kumble (Head Coach)', pref:['BW','AR'], inflator:0.32, mindset:'Spin-heavy analytical tactician prioritizing wicket-taking middle overs.' },
    { name:'Brian Lara (Head Coach)', pref:['B','WK'], inflator:0.47, mindset:'Flair-first strokeplay, destructive middle-order hitters & fearless cricket.' },
    { name:'Jacques Kallis (Head Coach)', pref:['AR','BW'], inflator:0.34, mindset:'True pace all-rounders, solid top order & balanced seam bowling.' },
    { name:'Lance Klusener (Head Coach)', pref:['AR','B'], inflator:0.48, mindset:'Death-overs power-hitting and multi-skilled pace all-rounders.' },
    { name:'Shane Watson (Head Coach)', pref:['AR','B'], inflator:0.45, mindset:'Powerplay domination, seam all-rounders & aggressive chasing.' },
    { name:'Eoin Morgan (Head Coach)', pref:['B','AR'], inflator:0.51, mindset:'Modern T20 boundary-hitting revolution & data-backed matchups.' },
    { name:'Brad Hodge (Head Coach)', pref:['B','BW'], inflator:0.40, mindset:'T20 veteran hunting underrated value buys & clever death bowlers.' }
  ],
  bowling: [
    'Mohit Sharma (Bowling)','Mitchell McClenaghan (Bowling)','Omkar Salvi (Bowling)','Tim Southee (Bowling)',
    'Varun Aaron (Bowling)','Shane Bond (Bowling)','Chaminda Vaas (Bowling)','Trevor Gonsalves (Bowling)',
    'Vikram Solanki (Director)','Bharat Arun (Bowling)','Lasith Malinga (Bowling)','Dale Steyn (Bowling)',
    'Eric Simons (Bowling)','Muttiah Muralitharan (Spin)','Amit Mishra (Spin)','Carl Crowe (Spin)',
    'Allan Donald (Bowling)','Shaun Tait (Pace)','James Franklin (Bowling)','Sridharan Sriram (Spin/Asst)',
    'Albie Morkel (Asst)','Mo Bobat (Director)','Venugopal Rao (Director)','Paras Mhambrey (Bowling)'
  ],
  mentor: [
    'MS Dhoni (Mentor)','Sachin Tendulkar (Mentor)','Dinesh Karthik (Mentor)','Dwayne Bravo (Mentor)',
    'Muttiah Muralitharan (Spin Mentor)','Trevor Penney (Asst Coach)','Yuvraj Singh (Batting/Mentor)','Matthew Hayden (Batting Coach)',
    'Kane Williamson (Strategic Advisor)','Andre Russell (Power-Hitting Coach)','Robin Uthappa (Batting Coach)','AB de Villiers (Mentor)',
    'Suresh Raina (Mentor)','Virender Sehwag (Mentor)','VVS Laxman (Mentor)','Parthiv Patel (Batting Coach)',
    'Chris Gayle (Power-Hitting Mentor)','Kevin Pietersen (Batting Mentor)','Michael Hussey (Batting Coach)','Harbhajan Singh (Spin Mentor)',
    'Adam Gilchrist (Mentor)','Kavya Maran (Owner)','Akash Ambani (Owner)','Ness Wadia (Owner)'
  ]
};

function syncIPL2027Coaches(){
  state.teams.forEach(t => {
    const meta = TEAMS_META.find(m => m.id === t.id);
    if (!meta) return;
    t.staff = [...meta.staff];
    t.pref = [...meta.pref];
    t.inflator = meta.inflator;
    t.mindset = meta.mindset;
    t.style = meta.style;
    t.chatter = `👔 Official IPL 2027 Staff: ${meta.staff[0].split(' (')[0]} takes charge!`;
  });
  pushTicker('👔 SYNCED OFFICIAL IPL 2027 COACHING STAFF ACROSS ALL 10 FRANCHISES!');
  sfxTrade();
  showToast('✅ Synced all 10 teams to Official IPL 2027 Coaches!');
  renderCoachMarketList();
  renderTeams();
  saveState();
}

function openCoachMarketDrawer(){
  const inp = document.getElementById('coachSearchInput');
  if (inp) inp.value = '';
  renderCoachMarketList();
  document.getElementById('coachMarketBackdrop').classList.add('open');
}

function renderCoachMarketList(){
  const wrap = document.getElementById('coachMarketList');
  if (!wrap) return;
  const q = (document.getElementById('coachSearchInput')?.value || '').trim().toLowerCase();
  const teamsToShow = state.teams.filter(t =>
    !q || t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.staff.some(s => s.toLowerCase().includes(q))
  );

  wrap.innerHTML = teamsToShow.map(t => {
    const curHead = t.staff[0] || COACH_MARKET_POOL.head[0].name;
    const curBowl = t.staff[1] || COACH_MARKET_POOL.bowling[0];
    const curMent = t.staff[2] || COACH_MARKET_POOL.mentor[0];

    const headOpts = COACH_MARKET_POOL.head.map(c => `<option value="${c.name}" ${c.name===curHead?'selected':''}>${c.name}</option>`).join('') +
      (COACH_MARKET_POOL.head.some(c=>c.name===curHead) ? '' : `<option value="${curHead}" selected>${curHead}</option>`);
    const bowlOpts = COACH_MARKET_POOL.bowling.map(n => `<option value="${n}" ${n===curBowl?'selected':''}>${n}</option>`).join('') +
      (COACH_MARKET_POOL.bowling.includes(curBowl) ? '' : `<option value="${curBowl}" selected>${curBowl}</option>`);
    const mentOpts = COACH_MARKET_POOL.mentor.map(n => `<option value="${n}" ${n===curMent?'selected':''}>${n}</option>`).join('') +
      (COACH_MARKET_POOL.mentor.includes(curMent) ? '' : `<option value="${curMent}" selected>${curMent}</option>`);

    return `
      <div class="coach-card" style="border-top:4px solid ${t.color}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="display:inline-flex;align-items:center;gap:6px">${getTeamLogo(t.id, 22)}<b>${t.id} — ${t.name}</b></span>
          <span class="tag" style="font-size:9.5px">Pref: ${(t.pref||[]).join('/')} • Agg: ${Math.round((t.inflator||0.35)*100)}%</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr;gap:5px">
          <select class="input-box" style="padding:6px 8px;font-size:11.5px" onchange="updateTeamCoach('${t.id}', 0, this.value)">${headOpts}</select>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
            <select class="input-box" style="padding:6px 8px;font-size:11px" onchange="updateTeamCoach('${t.id}', 1, this.value)">${bowlOpts}</select>
            <select class="input-box" style="padding:6px 8px;font-size:11px" onchange="updateTeamCoach('${t.id}', 2, this.value)">${mentOpts}</select>
          </div>
        </div>
      </div>`;
  }).join('') || '<div style="text-align:center;padding:18px;color:var(--muted)">No matching franchise or coach found.</div>';
}

function updateTeamCoach(tid, slotIdx, newName){
  const t = state.teams.find(x => x.id === tid);
  if (!t) return;
  const oldName = t.staff[slotIdx];
  t.staff[slotIdx] = newName;

  if (slotIdx === 0) {
    const profile = COACH_MARKET_POOL.head.find(c => c.name === newName);
    if (profile) {
      t.pref = [...profile.pref];
      t.inflator = profile.inflator;
      t.mindset = profile.mindset;
      t.style = profile.mindset;
    }
  }
  t.chatter = `👔 New Hire: ${newName.split(' (')[0]} joins ${t.id} war-room!`;
  const msg = `👔 COACHING UPDATE: ${t.id} replaces ${oldName.split(' (')[0]} with ${newName}!`;
  pushTicker(msg);
  addReaction(msg, t.color);
  sfxTrade();
  showToast(`✅ ${t.id} hired ${newName}!`);
  renderCoachMarketList();
  renderTeams();
  saveState();
}

function runAICoachingCarousel(){
  const picks = shuffleArr(state.teams).slice(0, 3);
  const freeHeads = shuffleArr(COACH_MARKET_POOL.head.filter(c => !state.teams.some(t => t.staff[0] === c.name)));
  const freeMentors = shuffleArr(['MS Dhoni (Mentor)','AB de Villiers (Mentor)','Virender Sehwag (Mentor)','Eoin Morgan (Mentor)','Suresh Raina (Mentor)','Yuvraj Singh (Mentor)']);

  picks.forEach((t, i) => {
    if (i < 2 && freeHeads[i]) {
      const h = freeHeads[i];
      t.staff[0] = h.name;
      t.pref = [...h.pref];
      t.inflator = h.inflator;
      t.mindset = h.mindset;
      t.style = h.mindset;
      const msg = `🚨 BREAKING HIRE: ${t.id} appoints ${h.name} ahead of the Mega Auction!`;
      pushTicker(msg);
      addReaction(msg, t.color);
      t.chatter = `👔 ${h.name.split(' (')[0]} takes charge of ${t.id}!`;
    } else if (freeMentors[i]) {
      t.staff[2] = freeMentors[i];
      const msg = `🚨 MENTOR SIGNING: ${t.id} brings in ${freeMentors[i]} for the auction table!`;
      pushTicker(msg);
      addReaction(msg, t.color);
      t.chatter = `👔 ${freeMentors[i]} joins ${t.id} table!`;
    }
  });
  sfxHijack();
  showToast('⚡ 3 Franchises just shook up their Coaching Staff!');
  renderCoachMarketList();
  renderTeams();
  saveState();
}

async function runPreAuctionPressConf(){
  showToast('🎙️ Holding Pre-Auction Press Conference...');
  const staffSummary = state.teams.map(t => `${t.id}: ${t.staff.join(', ')} (${t.home})`).join('\n');
  let headlines = null;
  if (getSavedApiKey()) {
    const prompt = `IPL Mega Auction Pre-Auction Press Conference!
Current 10 Franchise Coaching Staffs:
${staffSummary}
Generate 3 spicy, realistic breaking media headlines & coach quotes reacting to the coaching setups and auction tension.
Return ONLY valid JSON: {"quotes": [{"teamId": "CSK", "text": "..."}, {"teamId": "RCB", "text": "..."}, {"teamId": "PBKS", "text": "..."}]}`;
    const res = await callGeminiJSON(prompt, 0.9);
    if (res && Array.isArray(res.quotes)) headlines = res.quotes;
  }
  if (!headlines) {
    const sample = shuffleArr(state.teams).slice(0, 3);
    headlines = sample.map(t => ({
      teamId: t.id,
      text: `${t.staff[0].split(' (')[0]} at press conference: "We have a clear blueprint for ${t.home.split(' (')[0]}—rivals better watch out!"`
    }));
  }
  const voiceItems = [];
  headlines.forEach(h => {
    const t = state.teams.find(x => x.id === h.teamId) || state.teams[0];
    addReaction(`🎙️ <b style="color:${t.color}">${t.id} PRESS CONF:</b> <i>"${h.text}"</i>`, t.color);
    const prof = getTeamVoiceProfile(t.id, 0);
    voiceItems.push({ text: `${t.name} press conference: ${h.text}`, gender: prof.gender, pitch: prof.pitch, rate: prof.rate });
  });
  closeDrawers();
  switchView('stage');
  if (voiceOn && voiceItems.length) speakDiscussionQueue(voiceItems);
}


// ==================== 18. V34: DEDICATED AI AUCTIONEER AGENT + GM ADVISOR + AUTO-PROXY + LAPTOP SHORTCUTS ====================
let aiAuctRunning = false;
let aiAuctPaused = true;
let aiAuctFast = false;
let aiAuctLoopToken = 0;
let humanProxyCapLakhs = 0;
let humanResponseWindowMs = 0;

function setAIAuctioneerStatus(msg){
  const el = document.getElementById('aiAuctioneerStatus');
  if (el) el.innerHTML = msg;
}

let aiAuctSpeedLevel = 1; // 1 = Normal, 2 = Fast, 3 = Turbo
function toggleAIAuctioneerSpeed(){
  aiAuctSpeedLevel = aiAuctSpeedLevel >= 3 ? 1 : aiAuctSpeedLevel + 1;
  aiAuctFast = aiAuctSpeedLevel >= 2;
  const b = document.getElementById('btnAiAuctSpeed');
  if (b) {
    b.textContent = aiAuctSpeedLevel === 3 ? '⚡ Speed: 3x' : aiAuctSpeedLevel === 2 ? '🚀 Speed: 2x' : '⚡ Speed: 1x';
    b.className = aiAuctSpeedLevel === 3 ? 'btn btn-sm btn-warn' : aiAuctSpeedLevel === 2 ? 'btn btn-sm btn-blue' : 'btn btn-sm';
  }
  showToast(aiAuctSpeedLevel === 3 ? '⚡ AI Auctioneer: 3x TURBO' : aiAuctSpeedLevel === 2 ? '🚀 AI Auctioneer: 2x FAST' : '⚡ AI Auctioneer: 1x Normal');
}

function toggleAIAuctioneerPause(){
  if (!state.humanTeamId || mpRole === 'CLIENT') return;
  if (aiAuctPaused) {
    aiAuctPaused = false;
    startAIAuctioneerLoop();
  } else {
    aiAuctPaused = true;
    aiAuctLoopToken++;
    setAIAuctioneerStatus('⏸️ AI Auctioneer paused. Tap <b>▶ Resume</b> when ready.');
  }
  updateAIAuctButtons();
}

function stopAIAuctioneer(){
  aiAuctPaused = true;
  aiAuctRunning = false;
  aiAuctLoopToken++;
  humanProxyCapLakhs = 0;
  updateAIAuctButtons();
}

function updateAIAuctButtons(){
  const b = document.getElementById('btnAiAuctPause');
  if (!b) return;
  b.textContent = aiAuctPaused ? (state.curId !== null ? '▶ Resume' : '▶ Start Floor') : '⏸ Pause AI';
  b.className = aiAuctPaused ? 'btn btn-sm btn-green' : 'btn btn-sm btn-warn';
}

function humanJumpBid(extraLakhs){
  if (state.curId === null || !state.humanTeamId) return;
  const t = state.teams.find(x => x.id === state.humanTeamId);
  const p = state.players[state.curId];
  if (!t || !p) return;
  if (state.curLeader === t.id) { showToast('You already hold the highest bid!'); return; }
  const target = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + extraLakhs : p.base + extraLakhs);
  if (target > maxSpendable(t)) { showToast(`Max spendable for ${t.id} is ${fmtCr(maxSpendable(t))}!`); return; }
  if (t.squad.length >= 25) { showToast('Your squad is full (25/25)!'); return; }
  if (p.os && teamRoleCounts(t).OS >= 8) { showToast('Your overseas cap is full (8/8)!'); return; }

  state.curBid = target;
  state.curLeader = t.id;
  state.gavelStage = 0;
  if (!state.biddersThisLot.includes(t.id)) state.biddersThisLot.push(t.id);
  t.chatter = `🚀 JUMP BID ${fmtCr(target)}!`;
  t.lastFlash = Date.now();
  state.warLog.unshift({ text:`YOU (${t.id}) ${fmtCr(target)}`, hijack:true });
  if (!state.bidPoints) state.bidPoints = [];
  state.bidPoints.push({ bid: target, team: t.id, color: t.color });
  state.warLog = state.warLog.slice(0, 7);
  document.documentElement.style.setProperty('--beam', t.color);
  sfxHijack();
  speakBidFemale(`Jump bid! ${fmtSpeechPrice(target)}, ${t.name}!`);
  renderAll();
  saveState();
}

function humanUseRTM(){
  if (!state.humanTeamId || state.curId === null || !state.curLeader) return;
  const t = state.teams.find(x => x.id === state.humanTeamId);
  const p = state.players[state.curId];
  if (!t || !p) return;
  if (state.curLeader === t.id) { showToast('You already lead this bid!'); return; }
  if ((t.rtmCards ?? 0) <= 0) { showToast('No RTM cards left!'); return; }
  if (t.squad.length >= 25 || (p.os && teamRoleCounts(t).OS >= 8) || maxSpendable(t) < state.curBid) {
    showToast('Not eligible to use RTM (check purse/squad/OS cap).'); return;
  }
  t.rtmCards--;
  state.curLeader = t.id;
  state.gavelStage = 0;
  t.chatter = `🃏 RTM PLAYED at ${fmtCr(state.curBid)}!`;
  t.lastFlash = Date.now();
  state.warLog.unshift({ text:`🃏 YOU (${t.id}) RTM ${fmtCr(state.curBid)}`, hijack:true });
  document.documentElement.style.setProperty('--beam', t.color);
  sfxHijack();
  addReaction(`🃏 <b style="color:${t.color}">${t.id} (YOU)</b> played an <b>RTM Card</b> at ${fmtCr(state.curBid)}!`, t.color);
  speakFemale(`Right to Match card played by ${t.name} at ${fmtSpeechPrice(state.curBid)}!`);
  renderAll();
  saveState();
}

function setHumanProxyCap(){
  if (!state.humanTeamId || state.curId === null) return;
  const rawCr = parseFloat(document.getElementById('gmProxyCapInput')?.value || '0');
  if (!rawCr || rawCr <= 0) {
    humanProxyCapLakhs = 0;
    showToast('🤖 Auto-Bid Proxy Cap cleared.');
    updateGMCoachAdvisor();
    return;
  }
  humanProxyCapLakhs = Math.min(MAX_BID_CAP, Math.round(rawCr * 100));
  showToast(`🤖 Auto-Bid Cap set to ${fmtCr(humanProxyCapLakhs)} for ${state.players[state.curId].name}!`);
  updateGMCoachAdvisor();
}

function updateGMCoachAdvisor(){
  const box = document.getElementById('gmCoachAdvisor');
  if (!box) return;
  if (!state.humanTeamId || state.curId === null || mpRole === 'CLIENT') {
    box.style.display = 'none';
    return;
  }
  const t = state.teams.find(x => x.id === state.humanTeamId);
  const p = state.players[state.curId];
  if (!t || !p) { box.style.display = 'none'; return; }
  const ev = evaluatePlayerForTeam(t, p, 1.0);
  const coachName = (t.staff[0] || 'Head Coach').split(' (')[0];
  const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);

  let advice = '';
  if (ev.val === 0) advice = `🛑 <b>Pass recommended:</b> ${ev.reason}`;
  else if (nextB <= ev.val * 0.85) advice = `🔥 <b>Strong Buy!</b> Fair value ~${fmtCr(ev.val)}. ${ev.reason}`;
  else if (nextB <= ev.val) advice = `✅ <b>Fair Price:</b> Worth pushing up to ~${fmtCr(ev.val)} for ${t.home.split(' (')[0]}.`;
  else advice = `⚠️ <b>Overpriced now</b> (our cap ${fmtCr(ev.val)}). Consider walking away to save ${fmtCr(t.purse)}.`;

  const proxyTag = humanProxyCapLakhs > 0 ? ` <span class="pill pill-live" style="font-size:9px;margin-left:4px">🤖 AUTO-CAP ${fmtCr(humanProxyCapLakhs)}</span>` : '';
  box.style.display = 'block';
  box.innerHTML = `🧠 <b>${coachName} (${t.id} Coach):</b> ${advice}${proxyTag}`;
}

async function waitAuctioneerMs(ms, token){
  const step = 40;
  let elapsed = 0;
  while (elapsed < ms) {
    if (token !== aiAuctLoopToken || aiAuctPaused || !state.humanTeamId) return false;
    await new Promise(r => setTimeout(r, step));
    elapsed += step;
  }
  return (token === aiAuctLoopToken && !aiAuctPaused && Boolean(state.humanTeamId));
}

async function aiAuctioneerHypeUndervaluedPlayer(p, token){
  if (!p || state.lotHyped) return false;
  const isHighValue = p.tier === 'S' || p.tier === 'A' || p.ovr >= 82;
  const isCheap = !state.curLeader || state.curBid < Math.round(p.fairVal * 0.72);
  if (!isHighValue || !isCheap) return false;

  state.lotHyped = true;
  const scoutInfo = state.scoutCache && state.scoutCache[p.id];
  const statSnippet = (scoutInfo && Array.isArray(scoutInfo.stats) && scoutInfo.stats.length)
    ? scoutInfo.stats.slice(0, 2).join(', ')
    : `OVR ${p.ovr} • Tier ${p.tier} ${roleLabel(p.role)}`;

  const hypeMsg = `🎙️ <b>AI Auctioneer:</b> "Hold on tables! <b>${p.name}</b> (${statSnippet}) is valued around <b>${fmtCr(p.fairVal)}</b> — ${fmtCr(state.curBid)} is an absolute steal! Any franchise stepping up?"`;
  setAIAuctioneerStatus(hypeMsg);
  addReaction(hypeMsg, '#facc15');
  if (!acceleratorMode) await speakFemale(`Hold on tables! ${p.name} has top stats and high value around ${fmtSpeechPrice(p.fairVal)}. Any franchise stepping up?`);

  // It's strictly each team's own choice: 1-2 eligible rivals who like the player MAY stretch slightly
  let boostedCount = 0;
  shuffleArr(state.teams).forEach(t => {
    if (boostedCount >= 2 || t.id === state.curLeader || t.id === state.humanTeamId || t.isHuman) return;
    const ev = evaluatePlayerForTeam(t, p, 1.0);
    if (ev.val > 0 && Math.random() < 0.55) {
      if (!state.persuasionBoost) state.persuasionBoost = {};
      const extra = 100 + Math.floor(Math.random() * 3) * 50;
      state.persuasionBoost[t.id] = (state.persuasionBoost[t.id] || 0) + extra;
      boostedCount++;
    }
  });
  await waitAuctioneerMs(acceleratorMode ? 280 : 650, token);
  return boostedCount > 0;
}

async function startAIAuctioneerLoop(){
  if (!state.humanTeamId || mpRole === 'CLIENT') return;
  const token = ++aiAuctLoopToken;
  aiAuctRunning = true;
  aiAuctPaused = false;
  updateAIAuctButtons();

  while (token === aiAuctLoopToken && !aiAuctPaused && state.humanTeamId) {
    const fast = aiAuctFast || acceleratorMode;

    // 1. If no player is on the podium, bring the next available player automatically
    if (state.curId === null) {
      const nextId = getNextAvailableId();
      if (nextId === null) {
        setAIAuctioneerStatus('🏁 All 520 players processed! Head to Trades, Squads, or Season.');
        stopAIAuctioneer();
        break;
      }
      humanProxyCapLakhs = 0;
      state.lotHyped = false;
      const inp = document.getElementById('gmProxyCapInput');
      if (inp) inp.value = '';
      setAIAuctioneerStatus(`🎙️ Bringing next player onto the podium...`);
      callPlayerById(nextId);
      if (!(await waitAuctioneerMs(aiAuctSpeedLevel===3 ? 120 : fast ? 220 : 550, token))) break;
    }

    const p = state.players[state.curId];
    if (!p) break;

    const myId = state.humanTeamId;
    const myTeam = state.teams.find(x => x.id === myId);
    const humanPassed = (state.passedTeams || []).includes(myId);
    const humanCanBid = myTeam && !humanPassed && state.curLeader !== myId &&
      myTeam.squad.length < 25 && (!p.os || teamRoleCounts(myTeam).OS < 8) &&
      state.curBid < MAX_BID_CAP &&
      maxSpendable(myTeam) >= (state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);

    // 2. Auto-Bid Proxy Cap check for human GM
    if (humanCanBid && humanProxyCapLakhs > 0) {
      const reqB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);
      if (reqB <= humanProxyCapLakhs) {
        setAIAuctioneerStatus(`🤖 Auto-Bid Proxy raising paddle for <b>${myId}</b> at ${fmtCr(reqB)}...`);
        teamRaisePaddle(myId);
        if (!(await waitAuctioneerMs(fast ? 220 : 480, token))) break;
        continue;
      }
    }

    // 3. Let 9 AI bots evaluate and bid immediately (fast & snappy!)
    setAIAuctioneerStatus(`🎙️ Polling 9 rival tables for <b>${p.name}</b>...`);
    const aiBidPlaced = await runBidRound(false);
    if (token !== aiAuctLoopToken || aiAuctPaused) break;

    if (aiBidPlaced) {
      // If human hasn't passed, give a crisp countdown window (immediately breaks the instant user clicks Bid or Pass!)
      const stillCanBid = !(state.passedTeams || []).includes(myId) && state.curLeader !== myId && state.curBid < MAX_BID_CAP;
      if (stillCanBid) {
        const waitMsTotal = (aiAuctSpeedLevel===3 || acceleratorMode) ? 1400 : (aiAuctSpeedLevel===2 ? 2000 : 2800);
        const stepMs = 45;
        let elapsed = 0;
        const prevLeader = state.curLeader;
        const prevBid = state.curBid;
        while (elapsed < waitMsTotal) {
          if (token !== aiAuctLoopToken || aiAuctPaused) break;
          if (state.curLeader === myId || state.curBid !== prevBid || (state.passedTeams || []).includes(myId)) break;
          const remS = Math.ceil((waitMsTotal - elapsed) / 1000);
          setAIAuctioneerStatus(`✋ <b>${prevLeader}</b> leads at <b>${fmtCr(prevBid)}</b> — Your turn (${myId}): <b>${remS}s</b> to Bid or Pass!`);
          if (!(await waitAuctioneerMs(stepMs, token))) break;
          elapsed += stepMs;
        }
        if (token !== aiAuctLoopToken || aiAuctPaused) break;
        // If YOU just placed a bid, pause briefly so the announcer speaks your bid cleanly before rivals counter!
        if (state.curLeader === myId) {
          if (!(await waitAuctioneerMs(voiceOn && !acceleratorMode ? 750 : 280, token))) break;
        }
      } else {
        // User already passed — zip through AI-vs-AI war fast!
        if (!(await waitAuctioneerMs(aiAuctSpeedLevel===3 ? 60 : fast ? 110 : 220, token))) break;
      }
      continue;
    }

    // 4. Before going Unsold or Going Once, check if this high-value player is going too cheap -> AI Auctioneer hype!
    if (!state.lotHyped && (p.tier === 'S' || p.tier === 'A' || p.ovr >= 82) && (!state.curLeader || state.curBid < p.fairVal * 0.72)) {
      const sparked = await aiAuctioneerHypeUndervaluedPlayer(p, token);
      if (token !== aiAuctLoopToken || aiAuctPaused) break;
      if (sparked) continue;
    }

    // 5. Nobody has bid yet -> brief chance for human GM to open at base price, else UNSOLD
    if (!state.curLeader) {
      if (humanCanBid) {
        const waitMsTotal = fast ? 1800 : 3000;
        let elapsed = 0;
        while (elapsed < waitMsTotal) {
          if (token !== aiAuctLoopToken || aiAuctPaused) break;
          if (state.curLeader === myId || (state.passedTeams || []).includes(myId)) break;
          setAIAuctioneerStatus(`🎙️ No rival takers at ${fmtCr(p.base)} — <b>${myId}</b> has <b>${Math.ceil((waitMsTotal-elapsed)/1000)}s</b> to open!`);
          if (!(await waitAuctioneerMs(150, token))) break;
          elapsed += 150;
        }
        if (token !== aiAuctLoopToken || aiAuctPaused) break;
        if (state.curLeader) continue;
      }
      setAIAuctioneerStatus(`✕ No takers for <b>${p.name}</b> — calling UNSOLD!`);
      hammerUnsold();
      if (!(await waitAuctioneerMs(acceleratorMode ? 700 : 1400, token))) break;
      continue;
    }

    // 6. Someone leads & 9 AI bots are quiet -> Going Once -> Going Twice -> SOLD!
    if (state.gavelStage === 0) {
      setAIAuctioneerStatus(`🔔 Going Once at <b>${fmtCr(state.curBid)}</b> to <b>${state.curLeader}</b>...`);
      callGoingOnce();
      if (!(await waitAuctioneerMs(aiAuctSpeedLevel===3 ? 220 : fast ? 380 : 750, token))) break;
      continue;
    }
    if (state.gavelStage === 1) {
      setAIAuctioneerStatus(`🔥 Going Twice at <b>${fmtCr(state.curBid)}</b> to <b>${state.curLeader}</b> — Final Call!`);
      callGoingTwice();
      if (!(await waitAuctioneerMs(aiAuctSpeedLevel===3 ? 220 : fast ? 380 : 750, token))) break;
      continue;
    }
    if (state.gavelStage >= 2) {
      setAIAuctioneerStatus(`🔨 SOLD! <b>${p.name}</b> goes to <b>${state.curLeader}</b> for <b>${fmtCr(state.curBid)}</b>!`);
      hammerSold();
      // Wait 2.6s so the SOLD stamp card stays visible and the Male Gavel Voice finishes announcing SOLD!
      if (!(await waitAuctioneerMs(acceleratorMode ? 1400 : 2600, token))) break;
      continue;
    }
  }
  aiAuctRunning = false;
  updateAIAuctButtons();
}




function gmSkipCurrentSet(){
  if (!state.humanTeamId) { quickSimCurrentSet(); return; }
  stopAIAuctioneer();
  quickSimCurrentSet();
  setAIAuctioneerStatus('⏩ Set skipped! Your AI Coach drafted for your team. Tap <b>▶ Start Floor</b> to resume.');
}

function gmAutoBuildRestAuction(){
  if (!confirm('Let your AI Coaching Staff automatically complete the rest of the auction and build your full 25-player squad?')) return;
  stopAIAuctioneer();
  quickSimRestAuction();
  setAIAuctioneerStatus('🏁 Auction auto-completed! Your AI Staff built your full squad — head to <b>SQUADS</b> or <b>SEASON</b>!');
}
