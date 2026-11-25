// ============================================================================
// THE GAVEL HOUSE — UI RENDERING, DRAWERS, GM WAR-ROOM, SHORTCUTS & BOOT
// ============================================================================
// ==================== 12. RENDERING & UI CONTROLS ====================
function renderReactions(){
  const rf = document.getElementById('reactionsFeed');
  if (!rf) return;
  rf.innerHTML = state.reactions.map(r => {
    if (typeof r === 'string') return `<div class="rx-item">${r}</div>`;
    return `<div class="rx-item" style="border-left-color:${r.color}">${r.text}</div>`;
  }).join('');
}

function renderPodium(){
  const idle = document.getElementById('idleControls');
  const live = document.getElementById('liveControls');
  const isLive = state.curId !== null;
  const atCap = isLive && state.curLeader && state.curBid >= MAX_BID_CAP;
  idle.style.display = isLive ? 'none' : 'grid';
  live.style.display = isLive ? 'block' : 'none';

  document.getElementById('btnBidRound').disabled = atCap;
  document.getElementById('btnAutoBid').disabled = atCap;

  const humanWrap = document.getElementById('humanBidWrap');
  const multiWrap = document.getElementById('multiPaddleWrap');
  const hostCtrls = document.getElementById('hostAuctioneerControls');
  const remoteNote = document.getElementById('remoteClientNote');
  const isRemoteClient = (mpRole === 'CLIENT');
  const humanTeams = state.teams.filter(t => t.isHuman);

  const isPlayerGMMode = Boolean(state.humanTeamId && !isRemoteClient);
  const deckLbl = document.getElementById('directorDeckLabel');
  if (deckLbl) deckLbl.textContent = isPlayerGMMode ? `${state.humanTeamId} FRANCHISE GM DESK` : 'STUDIO DIRECTOR CONTROL DECK';

  const aiBanner = document.getElementById('aiAuctioneerBanner');
  if (aiBanner) aiBanner.classList.toggle('show', isPlayerGMMode);

  if (hostCtrls) hostCtrls.style.display = (isRemoteClient || isPlayerGMMode) ? 'none' : 'block';
  if (idle) idle.style.display = (isLive || isRemoteClient || isPlayerGMMode) ? 'none' : 'grid';

  const myActiveTeamId = isRemoteClient ? mpClientTeamId : state.humanTeamId;
  if (isLive && myActiveTeamId) {
    humanWrap.style.display = 'block';
    if (remoteNote) remoteNote.style.display = isRemoteClient ? 'block' : 'none';
    const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : state.players[state.curId].base);
    const hb = document.getElementById('btnHumanBid');
    const hp = document.getElementById('btnHumanPass');
    const alreadyPassed = (state.passedTeams || []).includes(myActiveTeamId);
    hb.disabled = atCap || state.curLeader === myActiveTeamId || alreadyPassed;
    hb.textContent = atCap ? `🔒 ₹25.00 Cr CAP HIT` : state.curLeader === myActiveTeamId ? `👑 YOU LEAD (${fmtCr(state.curBid)})` : `✋ BID ${myActiveTeamId} (${fmtCr(nextB)})`;
    if (hp) { hp.disabled = state.curLeader === myActiveTeamId || alreadyPassed; hp.textContent = alreadyPassed ? '✓ PASSED' : '🤫 PASS / OUT'; }
    const myTObj = state.teams.find(x => x.id === myActiveTeamId);
    const j50 = document.getElementById('btnHumanJump50'), j100 = document.getElementById('btnHumanJump100'), hrtm = document.getElementById('btnHumanRtm');
    if (j50) j50.disabled = atCap || state.curLeader === myActiveTeamId || alreadyPassed;
    if (j100) j100.disabled = atCap || state.curLeader === myActiveTeamId || alreadyPassed;
    if (hrtm && myTObj) {
      hrtm.disabled = !state.curLeader || state.curLeader === myActiveTeamId || (myTObj.rtmCards ?? 0) <= 0;
      hrtm.textContent = `🃏 RTM (${myTObj.rtmCards ?? 0})`;
    }
    const gmExtra = document.getElementById('gmExtraActionsRow');
    const gmProxy = document.getElementById('gmProxyRow');
    if (gmExtra) gmExtra.style.display = isRemoteClient ? 'none' : 'grid';
    if (gmProxy) gmProxy.style.display = isRemoteClient ? 'none' : 'grid';
    updateGMCoachAdvisor();
  } else {
    humanWrap.style.display = 'none';
  }

  // Show 10-Real-Friends Paddle Board on Host/Local screen whenever 2+ teams are Human!
  if (multiWrap) {
    if (isLive && !isRemoteClient && humanTeams.length >= 2) {
      multiWrap.style.display = 'block';
      const pCur = state.players[state.curId];
      const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : pCur.base);
      document.getElementById('multiPaddleBoard').innerHTML = state.teams.map(t => {
        const isLead = state.curLeader === t.id;
        const isOut = (state.passedTeams || []).includes(t.id);
        const c = teamRoleCounts(t);
        const cantBid = !t.isHuman || atCap || isLead || isOut || t.squad.length >= 25 || (pCur.os && c.OS >= 8) || maxSpendable(t) < nextB;
        return `
          <button class="paddle-btn ${isLead?'is-lead':''} ${isOut?'is-out':''}" style="border-top:3px solid ${t.color}" ${cantBid?'disabled':''} onclick="teamRaisePaddle('${t.id}')">
            <span style="color:${t.color}">${t.id}</span>
            <span class="p-owner">${t.isHuman ? (t.ownerName||'Human') : '🤖 AI'}</span>
          </button>`;
      }).join('');
    } else {
      multiWrap.style.display = 'none';
    }
  }

  const p = isLive ? state.players[state.curId] : state.players[getNextAvailableId() ?? 0];
  const stBar = document.getElementById('setTelemetryBar');
  if (stBar && p) {
    const inSet = state.players.filter(x => x.set === p.set);
    const doneSet = inSet.filter(x => x.status !== 'AVAIL').length;
    const totSpent = state.players.reduce((s,x) => s + (x.status==='SOLD' ? (x.soldPrice||0) : 0), 0);
    stBar.innerHTML = `<span>SET: <b>${p.set.toUpperCase()}</b> (${doneSet}/${inSet.length})</span><span>LEAGUE SPENT: <b>${fmtCr(totSpent)}</b></span>`;
  }
  document.getElementById('podiumSet').textContent = isLive ? `${p.set} • LOT #${p.id+1} / 520` : `NEXT UP • ${p.set}`;
  const st = document.getElementById('podiumStatus');
  st.textContent = atCap ? '₹25 CR MAX CAP HIT' : isLive ? (state.gavelStage===2?'GOING TWICE • FINAL CALL':state.gavelStage===1?'GOING ONCE':'LIVE MEGA AUCTION') : 'LIVE MEGA AUCTION';

  document.getElementById('pName').textContent = isLive ? p.name : `NEXT: ${p.name}`;
  const pav = document.getElementById('podiumAvatar'); if (pav && p) pav.innerHTML = getPlayerCartoonAvatar(p, 56);
  document.getElementById('pMeta').innerHTML = `
    <span class="tag">${p.master}</span>
    <span class="tag">${roleLabel(p.role)}</span>
    <span class="tag ${p.os?'tag-os':'tag-ind'}">${p.os?'Overseas':'Indian'}</span>
    <span class="tag tag-ovr">OVR ${p.ovr}</span>
    <span class="tag" style="border-color:#38bdf8;color:#38bdf8">${p.phase || roleLabel(p.role)} • ${p.batHand||'R'}HB${p.bowlStyle && p.bowlStyle!=='—' ? ' • '+p.bowlStyle : ''}</span>
    ${p.role==='BW'
      ? `<span class="tag">BOWL ${p.bowl||p.ovr} • ECON ${p.econ||'7.9'}</span>`
      : p.role==='AR'
        ? `<span class="tag">BAT ${p.bat||p.ovr} • BOWL ${p.bowl||p.ovr} • SR ${p.sr||135}</span>`
        : `<span class="tag">BAT ${p.bat||p.ovr} • SR ${p.sr||135}</span>`}
    <span class="tag">Base ${fmtCr(p.base)}</span>`;

  document.getElementById('bidLabel').textContent = atCap ? 'MAX CAP BID' : state.curLeader ? 'HIGHEST BID' : 'BASE PRICE';
  document.getElementById('bidAmount').textContent = fmtCr(isLive ? state.curBid : p.base);
  const leadTeam = state.teams.find(t=>t.id===state.curLeader);
  const bl = document.getElementById('bidLeader');
  if (leadTeam) {
    bl.innerHTML = `<div class="hud-lead-crest-wrap">${getTeamLogo(leadTeam.id, 46)}<span class="hud-lead-banner" style="background:${leadTeam.color}">${leadTeam.id}</span></div>`;
  } else {
    bl.innerHTML = `<div class="hud-await-badge">AWAITING<br/>PADDLES</div>`;
  }

  for (let i=0;i<4;i++){
    const el = document.getElementById('gStep'+i);
    el.className = 'g-step' + (isLive && i<=state.gavelStage ? (state.gavelStage===2?' hot':' on') : '');
  }

  const mom = document.getElementById('bidMomentumFill');
  if (mom) {
    const pct = isLive ? Math.min(100, Math.max(8, Math.round((state.curBid / MAX_BID_CAP) * 100))) : 5;
    mom.style.width = pct + '%';
  }
  const retBanner = document.getElementById('retentionBannerWrap');
  if (retBanner) {
    retBanner.style.display = (state.retentionsDone || state.players.some(x=>x.status==='SOLD')) ? 'none' : 'block';
  }
  const tbBtn = document.getElementById('btnTieBreak');
  if (tbBtn) tbBtn.style.display = atCap ? 'inline-flex' : 'none';

  const sb = document.getElementById('scoutDossierBox');
  if (sb) sb.style.display = isLive ? 'block' : 'none';
  renderBroadcastRivalStripAndGraph(isLive, p);
  const wr = document.getElementById('warRibbon');
  wr.innerHTML = state.warLog.length
    ? state.warLog.map(w=>`<span class="war-chip ${w.hijack?'hijack':w.inflate?'inflate':''}">${w.text}</span>`).join('')
    : `<span class="war-chip">Tap "Bring Next Player" to open the floor</span>`;
  if (typeof renderGMWarRoomStrip === 'function') renderGMWarRoomStrip();
}

function renderTeams(){
  const now = Date.now();
  document.getElementById('teamsGrid').innerHTML = state.teams.map(t => {
    const c = teamRoleCounts(t);
    const pct = Math.max(0, Math.min(100, (t.purse / Math.max(1000, state.startingPurse || 12000)) * 100));
    const isLead = state.curLeader === t.id;
    const isHuman = state.humanTeamId === t.id;
    const flash = (now - (t.lastFlash||0)) < 750;
    return `
      <div class="team-card ${isLead?'leading':''} ${isHuman?'human-owned':''} ${flash?'paddle-flash':''}">
        <div class="top-strip" style="background:${t.color}"></div>
        <div class="t-head">
          <span style="display:inline-flex;align-items:center;gap:5px">${getTeamLogo(t.id, 22)}<span class="t-code" style="background:${t.color}">${t.id}${(isHuman||t.isHuman)?' 👤':''}</span></span>
          <span class="t-purse">${fmtCr(t.purse)}</span>
        </div>
        <div class="purse-bar"><div class="purse-fill" style="width:${pct}%;background:${t.color}"></div></div>
        <div class="t-stats"><span>Sq <b>${t.squad.length}/25</b></span><span>OS <b>${c.OS}/8</b></span><span>${t.isHuman ? `<span class="online-dot ${onlinePeerTeams[t.id]?'live':''}"></span> ${t.ownerName||'Human'}` : `RTM <b>${t.rtmCards ?? 2}</b>`}</span></div>
        <div class="t-bubble">${t.chatter}</div>
        <div class="t-actions">
          <button class="btn btn-sm" onclick="openTeamTalk('${t.id}')">Talk</button>
          <button class="btn btn-sm" onclick="selectedSquadTab='${t.id}';switchView('squads')">Squad</button>
        </div>
      </div>`;
  }).join('');
}

function setMasterFilter(val, btn){
  masterFilter = val;
  document.querySelectorAll('#masterFilterBar .chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  renderPool();
}

function renderPool(){
  const q = (document.getElementById('poolSearch').value || '').toLowerCase();
  const sf = document.getElementById('statusFilter').value;
  const list = state.players.filter(p => {
    if (masterFilter === 'WISHLIST') { if (!(state.wishlist || []).includes(p.id)) return false; }
    else if (masterFilter !== 'ALL' && p.master !== masterFilter) return false;
    if (sf !== 'ALL' && p.status !== sf) return false;
    if (q && !p.name.toLowerCase().includes(q) && !p.set.toLowerCase().includes(q) && !roleLabel(p.role).toLowerCase().includes(q)) return false;
    return true;
  });
  document.getElementById('poolCountPill').textContent = `${list.length} Players Shown`;
  document.getElementById('poolList').innerHTML = list.slice(0, 220).map(p => {
    const isWish = (state.wishlist||[]).includes(p.id);
    return `
    <div class="pool-row ${p.status!=='AVAIL'?'sold':''}">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
        <button class="avatar-box ${isWish?'wish-on':''}" onclick="toggleWishlist(${p.id})" title="Tap to Toggle Target Wishlist">
          ${getPlayerCartoonAvatar(p, 40)}
          <span class="avatar-star-badge">${isWish?'★':'☆'}</span>
        </button>
        <div class="p-info">
          <div class="p-name">${p.name} <span style="font-size:10px;color:var(--gold)">OVR ${p.ovr} • T${p.tier}</span></div>
          <div class="p-sub">${p.phase||roleLabel(p.role)} • ${p.role==='BW'?`BOWL ${p.bowl||p.ovr} • ECON ${p.econ||'8.0'}`:p.role==='AR'?`BAT ${p.bat||p.ovr} / BOWL ${p.bowl||p.ovr} • SR ${p.sr||135}`:`BAT ${p.bat||p.ovr} • SR ${p.sr||135}`} • ${p.os?'OS':'IND'} • ${fmtCr(p.base)}</div>
        </div>
      </div>
      ${p.status==='AVAIL'
        ? `<button class="btn btn-gold btn-sm" onclick="callPlayerById(${p.id})">Call</button>`
        : p.status==='SOLD'
          ? `<span class="pill pill-sold">${getTeamLogo(p.soldTo, 14)} ${p.soldTo} • ${fmtCr(p.soldPrice)}</span>`
          : p.status==='INJURED'
            ? `<span class="pill pill-injured">🚑 INJURED</span>`
            : `<span class="pill pill-unsold">UNSOLD</span>`
      }
    </div>`;
  }).join('') + (list.length > 220 ? `<div style="text-align:center;font-size:11px;color:var(--muted);padding:8px">Showing first 220 of ${list.length} — use search to filter faster.</div>` : '');
}

function renderTrades(){
  populateUniversalTradeDesk();
  const pill = document.getElementById('tradeStatusPill');
  pill.textContent = state.tradesUnlocked ? '● WINDOW OPEN' : '🔒 FINISH MARQUEE';
  pill.className = 'pill ' + (state.tradesUnlocked ? 'pill-live' : 'pill-warn');
  document.getElementById('btnUnlockTrades').style.display = state.tradesUnlocked ? 'none' : 'inline-flex';

  document.getElementById('tradeProposalsWrap').innerHTML = state.tradeProposals.map(tr => {
    const pA = state.players[tr.playerA];
    const pB = tr.playerB !== null ? state.players[tr.playerB] : null;
    return `
      <div class="panel" style="border-color:var(--gold)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b>${tr.teamA} ⇄ ${tr.teamB} Trade Proposal</b>
          <span class="pill pill-warn">PENDING APPROVAL</span>
        </div>
        <div style="font-size:13px;margin-bottom:6px">
          <b>${tr.teamA} sends:</b> ${pA.name} (${roleLabel(pA.role)}, ${fmtCr(pA.soldPrice)})<br/>
          <b>${tr.teamB} sends:</b> ${pB ? `${pB.name} (${roleLabel(pB.role)}, ${fmtCr(pB.soldPrice)})` : 'All-Cash Deal'}
          ${tr.cashBtoA !== 0 ? `<br/><b>Cash Adjustment:</b> ${tr.cashBtoA>0 ? `${tr.teamB} pays ${tr.teamA}` : `${tr.teamA} pays ${tr.teamB}`} ${fmtCr(Math.abs(tr.cashBtoA))}` : ''}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${tr.rationale}</div>
        <div class="btn-row">
          <button class="btn btn-green btn-sm" onclick="approveTrade('${tr.id}')">✓ Approve Trade</button>
          <button class="btn btn-red btn-sm" onclick="vetoTrade('${tr.id}')">✕ Veto</button>
        </div>
      </div>`;
  }).join('');

  const hp = document.getElementById('tradeHistoryPanel');
  if (state.tradeHistory.length) {
    hp.style.display = 'block';
    document.getElementById('tradeHistoryList').innerHTML = state.tradeHistory.map(h=>`<div class="msg">${h}</div>`).join('');
  } else hp.style.display = 'none';
  if (typeof renderIncomingTrades === 'function') renderIncomingTrades();
}

function renderSquads(){
  state.teams.forEach(tm => {
    if (Array.isArray(tm.customXI) && tm.customXI.length === 11) {
      const imp = sanitizeImpactForXI(tm, tm.customXI, tm.customImpact, tm.home);
      tm.customImpact = imp ? imp.id : null;
    }
  });
  document.getElementById('squadTeamTabs').innerHTML = state.teams.map(t =>
    `<button class="chip ${selectedSquadTab===t.id?'active':''}" style="display:inline-flex;align-items:center;gap:4px" onclick="selectedSquadTab='${t.id}';renderSquads()">${getTeamLogo(t.id, 15)}${t.id} (${t.squad.length})</button>`
  ).join('');
  const t = state.teams.find(x=>x.id===selectedSquadTab);
  const c = teamRoleCounts(t);
  const hasLockedXI = Array.isArray(t.customXI) && t.customXI.length === 11 && t.customXI.every(id => t.squad.includes(id));
  const players = t.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.soldPrice-a.soldPrice);

  // Auto-trigger Gemini to pick Playing XII directly once squad has 11+ players and API key is saved!
  if (t.squad.length >= 11 && !hasLockedXI && getSavedApiKey() && !aiPickingInProgress[t.id] && !t._autoPickTried) {
    t._autoPickTried = true;
    setTimeout(() => aiPickPlayingXII(t.id, false, true), 120);
  }

  let xiBlock = '';
  if (t.squad.length >= 11) {
    if (aiPickingInProgress[t.id]) {
      xiBlock = `
        <div style="background:var(--gold-dim);border:1px solid var(--gold);border-radius:14px;padding:12px;margin-bottom:10px;text-align:center">
          <div style="font-size:12px;font-weight:800;color:var(--gold)">🤖 GEMINI HEAD COACH PICKING PLAYING XII...</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px">Analysing ${t.home} pitch, batting order, wicketkeeper, 5+ bowling options &amp; 4 OS cap...</div>
        </div>`;
    } else if (hasLockedXI) {
      const { xi, impact } = computePlayingXII(t);
      const badgeText = t.xiSource === 'MANUAL' ? '✏️ MANAGER CUSTOM PLAYING XII' : '🤖 GEMINI PITCH-BALANCED PLAYING XII';
      xiBlock = `
        <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.35);border-radius:14px;padding:11px;margin-bottom:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:7px">
            <div style="font-size:11px;font-weight:800;color:#10b981;letter-spacing:0.6px">${badgeText} (${t.home.split(' (')[0]})</div>
            <div style="display:flex;gap:5px">
              <button class="btn btn-sm btn-blue" style="padding:4px 8px;font-size:10.5px" onclick="aiPickPlayingXII('${t.id}')">🤖 Re-Pick Gemini</button>
              <button class="btn btn-sm btn-gold" style="padding:4px 8px;font-size:10.5px" onclick="openXIEditor('${t.id}')">✏️ Edit Manually</button>
            </div>
          </div>
          ${t.xiNote ? `<div style="font-size:11.5px;color:var(--text);opacity:0.85;margin-bottom:7px;font-style:italic">🧠 ${t.xiNote}</div>` : ''}
          <div style="display:flex;flex-wrap:wrap;gap:5px">
            ${xi.map((p,i)=>`<span class="tag">${i+1}. ${p.name}${t.captainId===p.id?' ©':t.vcId===p.id?' (VC)':''}${getFormBadge(p.id)} <span style="opacity:0.65">(${p.role})</span>${p.os?' ✈️':''}</span>`).join('')}
            ${impact ? `<span class="tag" style="background:var(--gold-dim);color:var(--gold);border-color:var(--gold)">⚡ Impact: ${impact.name}</span>` : ''}
          </div>
        </div>`;
    } else {
      xiBlock = `
        <div style="background:var(--input-bg);border:1px dashed var(--gold);border-radius:14px;padding:12px;margin-bottom:10px;text-align:center">
          <div style="font-size:12px;font-weight:800;color:var(--gold);margin-bottom:4px">🤖 PLAYING XII AWAITING GEMINI HEAD COACH</div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:9px">Gemini picks the balanced batting order, bowling attack, Captain &amp; Impact Sub for <b>${t.home}</b>—then you can edit manually anytime.</div>
          <div class="btn-row" style="margin-top:0">
            <button class="btn btn-blue btn-sm" onclick="aiPickPlayingXII('${t.id}')">🤖 Let Gemini Pick XII</button>
            <button class="btn btn-sm" onclick="openXIEditor('${t.id}')">✏️ Pick Manually</button>
          </div>
        </div>`;
    }
  }

  const pctBar = (cur, tgt) => Math.min(100, Math.round((cur / Math.max(1, tgt)) * 100));

  document.getElementById('squadDetailBox').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;padding:11px;border-radius:13px;background:var(--input-bg);border-left:4px solid ${t.color}">
      <div style="min-width:0">
        <div style="display:flex;align-items:center;gap:7px">${getTeamLogo(t.id, 26)}<b style="font-size:15.5px">${t.name}</b></div>
        <div style="font-size:11.5px;color:var(--muted)">${t.home} • RTM Cards: ${t.rtmCards ?? 2}</div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-family:'JetBrains Mono',monospace;font-weight:700;color:var(--gold);white-space:nowrap">${fmtCr(t.purse)}</div>
        <div style="font-size:11px;color:var(--muted);white-space:nowrap">${t.squad.length}/25 Signed</div>
      </div>
    </div>

    <div class="role-meters">
      <div class="r-meter"><div class="rl">Bat</div><div class="rv">${c.B}/${t.targets.B}</div><div class="rbar"><div class="rfill" style="width:${pctBar(c.B,t.targets.B)}%"></div></div></div>
      <div class="r-meter"><div class="rl">WK</div><div class="rv">${c.WK}/${t.targets.WK}</div><div class="rbar"><div class="rfill" style="width:${pctBar(c.WK,t.targets.WK)}%"></div></div></div>
      <div class="r-meter"><div class="rl">AR</div><div class="rv">${c.AR}/${t.targets.AR}</div><div class="rbar"><div class="rfill" style="width:${pctBar(c.AR,t.targets.AR)}%"></div></div></div>
      <div class="r-meter"><div class="rl">Bowl</div><div class="rv">${c.BW}/${t.targets.BW}</div><div class="rbar"><div class="rfill" style="width:${pctBar(c.BW,t.targets.BW)}%"></div></div></div>
      <div class="r-meter"><div class="rl">OS</div><div class="rv">${c.OS}/8</div><div class="rbar"><div class="rfill" style="width:${pctBar(c.OS,8)}%"></div></div></div>
    </div>

    ${xiBlock}

    <div class="pool-list">
      ${players.length ? players.map(p=>`
        <div class="pool-row">
          <div class="p-info">
            <div class="p-name">${p.name}${t.captainId===p.id?' ©':''}${getFormBadge(p.id)} ${p.os?'✈️':''}</div>
            <div class="p-sub">${roleLabel(p.role)} • OVR ${p.ovr} • T${p.tier} • ${p.set}${p.retained?' • 🔒 Retained':''}</div>
          </div>
          <span class="pill" style="color:var(--gold)">${fmtCr(p.soldPrice)}</span>
        </div>`).join('') : '<div style="text-align:center;padding:24px;color:var(--muted);font-size:13px">No players signed yet.</div>'}
    </div>`;
}

function populateSelectors(){
  const selH = document.getElementById('humanTeamSelect');
  selH.innerHTML = `<option value="">Auctioneer Only (All 10 AI Bots)</option>` +
    TEAMS_META.map(t=>`<option value="${t.id}" ${state.humanTeamId===t.id?'selected':''}>Play as ${t.id} — ${t.name}</option>`).join('');
  const hA = document.getElementById('h2hTeamA'), hB = document.getElementById('h2hTeamB');
  if (!hA.options.length) {
    TEAMS_META.forEach((t,i) => {
      hA.add(new Option(`${t.id} — ${t.name}`, t.id, i===0, i===0));
      hB.add(new Option(`${t.id} — ${t.name}`, t.id, i===1, i===1));
    });
  }
}

function setHumanTeam(tid){
  if (typeof stopAIAuctioneer === 'function') stopAIAuctioneer();
  state.humanTeamId = tid;
  document.getElementById('hdrSub').textContent = tid
    ? `Playing as ${tid} GM + 9 AI Bots • ₹25 Cr Cap`
    : '520 Shuffled Players • ₹120 Cr Purse • ₹25 Cr Cap';
  if (tid) {
    if (typeof setAIAuctioneerStatus === 'function') setAIAuctioneerStatus(`🎙️ AI Auctioneer ready! You are playing as <b>${tid} GM</b>. Tap <b>▶ Start Floor</b> (or press N) to begin.`);
    showToast(`🛡️ GM Mode: You are ${tid}! AI Auctioneer Agent will run the floor.`);
  } else {
    showToast('🎙️ Switched back to Auctioneer Mode (all 10 AI bots).');
  }
  renderAll(); saveState();
}

function renderAll(){
  const soldCount = state.players.filter(p=>p.status==='SOLD').length;
  document.getElementById('hdrSold').textContent = soldCount;
  const ht = document.getElementById('hdrTotal'); if (ht) ht.textContent = state.players.length;
  renderPodium();
  renderReactions();
  renderTeams();
  renderPool();
  renderTrades();
  renderSquads();
  renderSeason();
  renderFriendsHub();
}

let activeSquadSub = 'rosters';
let activeSeasonSub = 'matchsim';

function switchSquadTab(sub){
  activeSquadSub = sub;
  document.querySelectorAll('#squadSubNav .sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
  document.querySelectorAll('#view-squads .sub-view').forEach(el => el.classList.toggle('active', el.id === 'sq-' + sub));
  if (sub === 'rosters') renderSquads();
}

function switchSeasonTab(sub){
  activeSeasonSub = sub;
  document.querySelectorAll('#seasonSubNav .sub-tab').forEach(b => b.classList.toggle('active', b.dataset.sub === sub));
  document.querySelectorAll('#view-season .sub-view').forEach(el => el.classList.toggle('active', el.id === 'sn-' + sub));
  renderSeason();
}

function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===v));
  const target = document.getElementById('view-' + v);
  if (target) target.classList.add('active');
  if (v==='pool') renderPool();
  if (v==='trades') renderTrades();
  if (v==='squads') switchSquadTab(activeSquadSub || 'rosters');
  if (v==='season') switchSeasonTab(activeSeasonSub || 'matchsim');
  if (v==='friends') renderFriendsHub();
}

function openMatchScorecard(matchIdx){
  if (!state.seasonData || !state.seasonData.matches) return;
  const m = state.seasonData.matches.find(x => x.idx === matchIdx) || state.seasonData.matches[matchIdx];
  if (!m || !m.inn1) { showToast('Re-simulate season to view full scorecards.'); return; }

  document.getElementById('scTitle').textContent = `${m.label.toUpperCase()} — ${m.t1} vs ${m.t2}`;
  document.getElementById('scSub').textContent = `🏆 ${m.winner} won by ${m.margin} • POTM: ${m.potm || 'Match Winner'}`;

  const renderInn = (inn, idx) => `
    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--card-border);border-radius:12px;padding:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <b style="color:var(--gold)">INNINGS ${idx}: ${inn.team}</b>
        <span class="pill pill-live">${inn.score} (${inn.overs} ov)</span>
      </div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Batter</th><th>R</th><th>B</th><th>4s</th><th>6s</th><th>SR</th></tr></thead>
          <tbody>
            ${inn.batCard.map(b=>`<tr><td>${b.name}${b.out?'':' *'}</td><td><b>${b.r}</b></td><td>${b.b}</td><td>${b.f4}</td><td>${b.s6}</td><td>${b.sr}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div style="font-size:11px;font-weight:700;color:var(--muted);margin:8px 0 4px">BOWLING</div>
      <div class="tbl-wrap">
        <table>
          <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
          <tbody>
            ${inn.bowlCard.map(bw=>`<tr><td>${bw.name}</td><td>${bw.ov}</td><td>${bw.r}</td><td><b>${bw.w}</b></td><td>${(bw.r/Math.max(1,bw.ov)).toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  const soHTML = m.superOver ? `
    <div style="background:var(--gold-dim);border:1.5px solid var(--gold);border-radius:12px;padding:10px;text-align:center">
      <b style="color:var(--gold)">🔥 SUPER OVER THRILLER</b>
      <div style="font-size:13px;margin-top:4px"><b>${m.superOver.t1}:</b> ${m.superOver.r1}/${m.superOver.w1} (1 ov) &nbsp;vs&nbsp; <b>${m.superOver.t2}:</b> ${m.superOver.r2}/${m.superOver.w2} (1 ov)</div>
      <div style="font-size:12px;color:#10b981;font-weight:700;margin-top:3px">🏆 ${m.superOver.winner} won the Super Over!</div>
    </div>` : '';
  const impHTML = (m.impactNotes && m.impactNotes.length) ? `<div class="msg" style="border-left-color:#38bdf8;font-size:11.5px"><b>⚡ Impact Subs Used:</b> ${m.impactNotes.join(' • ')}</div>` : '';
  document.getElementById('scBody').innerHTML = soHTML + impHTML + renderInn(m.inn1, 1) + renderInn(m.inn2, 2);
  document.getElementById('scorecardBackdrop').classList.add('open');
}

function closeDrawers(){
  stopDiscussionSpeech();
  document.getElementById('talkBackdrop').classList.remove('open');
  document.getElementById('settingsBackdrop').classList.remove('open');
  document.getElementById('scorecardBackdrop').classList.remove('open');
  document.getElementById('xiEditorBackdrop').classList.remove('open');
  document.getElementById('retentionBackdrop').classList.remove('open');
  document.getElementById('compareBackdrop').classList.remove('open');
  document.getElementById('matrixBackdrop').classList.remove('open');
  document.getElementById('soldLogBackdrop').classList.remove('open');
  document.getElementById('coachMarketBackdrop').classList.remove('open');
  document.getElementById('customPlayerBackdrop')?.classList.remove('open');
  document.getElementById('finalOverBackdrop')?.classList.remove('open');
  document.getElementById('preMatchBackdrop')?.classList.remove('open');
  document.getElementById('scheduleBackdrop')?.classList.remove('open');
  stopFinalOverAuto();
}

function applyTheme(t){
  const clean = (t === 'dark') ? 'dark' : 'hud';
  document.body.classList.remove('theme-dark','theme-hud');
  document.body.classList.add(clean === 'dark' ? 'theme-dark' : 'theme-hud');
  const dmBtn = document.getElementById('btnDarkMode');
  if (dmBtn) {
    dmBtn.textContent = clean === 'dark' ? '🌙' : '📺';
    dmBtn.classList.add('on');
    dmBtn.title = clean === 'dark' ? 'Switch to TV Broadcast HUD' : 'Switch to Midnight Dark';
  }
}
function toggleDarkMode(){
  setTheme(state.theme === 'dark' ? 'hud' : 'dark');
}
function setTheme(t){ state.theme = t; applyTheme(t); saveState(); showToast('Stadium atmosphere updated!'); }

function resetAuction(){
  if (!confirm('Reset & reshuffle the entire 520-player auction back to ₹120 Cr?')) return;
  stopAutoBid(); closeHuddle();
  localStorage.removeItem(SAVE_KEY);
  initFreshState();
  applyTheme('hud');
  populateSelectors();
  closeDrawers();
  renderAll();
  showToast('Fresh shuffled IPL Mega Auction ready!');
}

document.getElementById('btnSound').onclick = () => {
  soundOn = !soundOn;
  const b = document.getElementById('btnSound');
  b.textContent = soundOn ? '🔊 Sound' : '🔇 Muted';
  b.classList.toggle('on', soundOn);
  showToast(soundOn ? 'Stadium Sound FX ON' : 'Stadium Sound FX MUTED');
};

document.getElementById('btnVoice').onclick = () => {
  voiceOn = !voiceOn;
  if (!voiceOn) stopDiscussionSpeech();
  const b = document.getElementById('btnVoice');
  b.classList.toggle('on', voiceOn);
  if (voiceOn) speakFemale('English dual voice auctioneer activated.');
  showToast(voiceOn ? '🗣️ Dual English Voice ON' : 'Voice Auctioneer OFF');
};

document.getElementById('btnSettings').onclick = () => {
  if (typeof getSupabaseCreds === 'function') {
    const c = getSupabaseCreds();
    const u = document.getElementById('sbUrlInput'), a = document.getElementById('sbAnonInput');
    if (u) u.value = c.url || '';
    if (a) a.value = c.anon || '';
  }
  populateSelectors();
  updateVoiceInfoLabel();
  updateAiModeStatus();
  const rp = document.getElementById('rulePurseSelect'), rc = document.getElementById('ruleCapSelect');
  if (rp) rp.value = String(state.startingPurse || 12000);
  if (rc) rc.value = String(state.maxBidCap || 2500);
  document.getElementById('settingsBackdrop').classList.add('open');
};




// ==================== 13. NEW FEATURES: RETENTIONS, RTM, SEALED TIE-BREAK, AUCTION AWARDS, MID-SEASON LOANS & JSON BACKUP ====================
function openRetentionDrawer(){
  const soldAny = state.players.some(p => p.status === 'SOLD');
  if (soldAny || state.retentionsDone) {
    showToast('Retentions can only be set before the first player is sold!');
    return;
  }
  document.getElementById('retentionBackdrop').classList.add('open');
}

function applyAutoRetentions(perTeam){
  const soldAny = state.players.some(p => p.status === 'SOLD');
  if (soldAny || state.retentionsDone) { closeDrawers(); return; }
  const slabs = [1800, 1400, 1100]; // ₹18 Cr, ₹14 Cr, ₹11 Cr
  const pool = shuffleArr(state.players.filter(p => p.tier === 'S' || p.tier === 'A'));
  let idx = 0;
  state.teams.forEach(t => {
    let retained = 0;
    while (retained < perTeam && idx < pool.length) {
      const p = pool[idx++];
      if (p.status !== 'AVAIL') continue;
      const c = teamRoleCounts(t);
      if (p.os && c.OS >= 2) continue;
      const cost = slabs[retained] || 1100;
      p.status = 'SOLD'; p.soldTo = t.id; p.soldPrice = cost; p.retained = true;
      t.squad.push(p.id);
      t.purse -= cost;
      retained++;
    }
    t.rtmCards = Math.max(1, 5 - perTeam); // 2 RTMs if 3 retained, 3 RTMs if 2 retained
    t.chatter = `🔒 Retained ${retained} core stars (${t.rtmCards} RTM cards left).`;
  });
  state.retentionsDone = true;
  closeDrawers();
  sfxTrade();
  pushTicker(`🔒 PRE-AUCTION RETENTIONS LOCKED (${perTeam} STARS/TEAM) — AUCTION FLOOR NOW OPEN!`);
  showToast(`Retained ${perTeam} stars per franchise! Purses & RTM cards updated.`);
  renderAll(); saveState();
}

function triggerRTMCard(){
  if (state.curId === null || !state.curLeader) { showToast('Need an active highest bid first to use RTM!'); return; }
  const p = state.players[state.curId];
  const rtmTeams = shuffleArr(state.teams.filter(t =>
    t.id !== state.curLeader && t.rtmCards > 0 && t.squad.length < 25 &&
    (!p.os || teamRoleCounts(t).OS < 8) && maxSpendable(t) >= state.curBid
  ));
  if (!rtmTeams.length) { showToast('No eligible rival franchise has an RTM card & purse left!'); return; }

  // Prefer human team if user is playing as a franchise and eligible
  let rtmT = state.humanTeamId ? rtmTeams.find(t => t.id === state.humanTeamId) : null;
  if (!rtmT) {
    rtmTeams.sort((a,b) => evaluatePlayerForTeam(b, p, 1.15).val - evaluatePlayerForTeam(a, p, 1.15).val);
    rtmT = rtmTeams[0];
  }

  rtmT.rtmCards--;
  state.curLeader = rtmT.id;
  state.gavelStage = 0;
  rtmT.chatter = `🃏 RTM CARD PLAYED! Matching ${fmtCr(state.curBid)} for ${p.name} (${rtmT.rtmCards} left)!`;
  rtmT.lastFlash = Date.now();
  state.warLog.unshift({ text:`🃏 ${rtmT.id} RTM ${fmtCr(state.curBid)}`, hijack:true });
  if (!state.bidPoints) state.bidPoints = []; state.bidPoints.push({ bid: state.curBid, team: rtmT.id, color: rtmT.color });
  state.warLog = state.warLog.slice(0, 7);
  document.documentElement.style.setProperty('--beam', rtmT.color);
  sfxHijack();
  addReaction(`🃏 <b style="color:${rtmT.color}">${rtmT.id} PLAYED RIGHT-TO-MATCH (RTM)!</b> Matched <b>${fmtCr(state.curBid)}</b> to snatch ${p.name}!`, rtmT.color);
  speakFemale(`Right to Match card played by ${rtmT.name} at ${fmtSpeechPrice(state.curBid)}!`);
  pushTicker(`🃏 RTM PLAYED: ${rtmT.id} matches ${fmtCr(state.curBid)} for ${p.name}!`);
  showToast(`🃏 ${rtmT.id} used an RTM Card to match ${fmtCr(state.curBid)}!`);
  renderAll(); saveState();
}

function runSealedTieBreaker(){
  if (state.curId === null || state.curBid < MAX_BID_CAP) return;
  const p = state.players[state.curId];
  const contenders = state.teams.filter(t =>
    t.squad.length < 25 && (!p.os || teamRoleCounts(t).OS < 8) &&
    maxSpendable(t) >= MAX_BID_CAP && (t.id === state.curLeader || evaluatePlayerForTeam(t, p, 1.18).val >= MAX_BID_CAP)
  );
  if (contenders.length < 2) {
    showToast(`Only ${state.curLeader} stands at ₹25.00 Cr — tap SOLD!`);
    return;
  }
  // Secret bonus priority roll (weighted by remaining purse + team need)
  const bids = contenders.map(t => ({
    t,
    secretScore: Math.round((t.purse / 100) * 0.4 + Math.random() * 60 + (t.pref.includes(p.role) ? 12 : 0))
  })).sort((a,b) => b.secretScore - a.secretScore);

  const win = bids[0].t;
  state.curLeader = win.id;
  sfxHijack();
  addReaction(`🔐 <b>₹25 CR SEALED TIE-BREAKER:</b> ${bids.map(b=>`${b.t.id}(${b.secretScore}pts)`).join(' vs ')} → <b style="color:${win.color}">${win.id}</b> wins the tie-break envelope!`, win.color);
  showToast(`🔐 ${win.id} won the ₹25 Cr Sealed Tie-Breaker! Tap SOLD!`);
  renderAll(); saveState();
}

function showAuctionWrapUp(){
  const wrap = document.getElementById('auctionAwardsWrap');
  const sold = state.players.filter(p => p.status === 'SOLD' && p.soldPrice > 0);
  if (sold.length < 10) { showToast('Sell at least 10 players to generate Auction Grades!'); return; }

  const steal = [...sold].sort((a,b) => (b.ovr / Math.max(30, b.soldPrice)) - (a.ovr / Math.max(30, a.soldPrice)))[0];
  const overpaid = [...sold].sort((a,b) => (b.soldPrice - b.fairVal) - (a.soldPrice - a.fairVal))[0];
  const uncapped = sold.filter(p => p.set === 'Set 4' || p.set.startsWith('U')).sort((a,b) => b.ovr - a.ovr || b.soldPrice - a.soldPrice)[0] || sold[0];
  const smartest = [...state.teams].sort((a,b) => (teamCoachEval(b).overall + b.purse/5000) - (teamCoachEval(a).overall + a.purse/5000))[0];

  wrap.innerHTML = `
    <div style="background:var(--input-bg);border:1px solid var(--gold);border-radius:14px;padding:12px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="sec-title" style="font-size:14px">🏅 AUCTION WRAP-UP AWARDS</div>
        <button class="btn btn-sm" style="padding:3px 8px" onclick="document.getElementById('auctionAwardsWrap').innerHTML=''">✕</button>
      </div>
      <div class="awards-grid" style="margin-top:0">
        <div class="award-card gold">
          <div class="award-title">💎 Biggest Steal</div>
          <div class="award-winner" style="font-size:17px">${steal.name} (${steal.soldTo})</div>
          <div class="award-stat">OVR ${steal.ovr} for just ${fmtCr(steal.soldPrice)}!</div>
        </div>
        <div class="award-card orange">
          <div class="award-title">💸 Most Overpaid Buy</div>
          <div class="award-winner" style="font-size:17px">${overpaid.name} (${overpaid.soldTo})</div>
          <div class="award-stat">Paid ${fmtCr(overpaid.soldPrice)} (Est. ${fmtCr(overpaid.fairVal)})</div>
        </div>
        <div class="award-card purple">
          <div class="award-title">🌟 Best Uncapped Gem</div>
          <div class="award-winner" style="font-size:17px">${uncapped.name} (${uncapped.soldTo})</div>
          <div class="award-stat">${uncapped.set} • OVR ${uncapped.ovr} • ${fmtCr(uncapped.soldPrice)}</div>
        </div>
        <div class="award-card">
          <div class="award-title">🧠 Smartest Purse Table</div>
          <div class="award-winner" style="font-size:17px">${smartest.name}</div>
          <div class="award-stat">Grade ${teamCoachEval(smartest).overall}/10 • ${fmtCr(smartest.purse)} left</div>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--card-border)">
        <div style="font-size:10.5px;font-weight:800;color:var(--muted);margin-bottom:5px">💰 TOP 5 MOST EXPENSIVE BUYS</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${[...sold].sort((a,b)=>b.soldPrice-a.soldPrice).slice(0,5).map((p,i)=>`<span class="tag">${i+1}. ${p.name} (${p.soldTo}) — <b style="color:var(--gold)">${fmtCr(p.soldPrice)}</b></span>`).join('')}
        </div>
      </div>
    </div>`;
}

function executeMidSeasonLoan(){
  if (!state.seasonData || state.midSeasonLoanDone) return;
  const s = state.seasonData;
  // Find 2 teams that can swap a benched player (not in their Playing XI)
  const teamsShuf = shuffleArr(state.teams);
  let swapped = 0;
  for (let i = 0; i < teamsShuf.length - 1 && swapped < 2; i += 2) {
    const A = teamsShuf[i], B = teamsShuf[i+1];
    const xiA = new Set(computePlayingXII(A).xi.map(p=>p.id));
    const xiB = new Set(computePlayingXII(B).xi.map(p=>p.id));
    const benchA = A.squad.map(id=>state.players[id]).find(p => p && !xiA.has(p.id) && !p.os);
    const benchB = B.squad.map(id=>state.players[id]).find(p => p && !xiB.has(p.id) && !p.os && p.role !== benchA?.role);
    if (benchA && benchB) {
      A.squad = A.squad.filter(id => id !== benchA.id); A.squad.push(benchB.id); benchB.soldTo = A.id;
      B.squad = B.squad.filter(id => id !== benchB.id); B.squad.push(benchA.id); benchA.soldTo = B.id;
      const msg = `🔁 MID-SEASON LOAN: ${A.id} loaned ${benchA.name} to ${B.id} in exchange for ${benchB.name}!`;
      state.tradeHistory.unshift(msg);
      pushTicker(msg);
      swapped++;
    }
  }
  state.midSeasonLoanDone = true;
  sfxTrade();
  showToast(`Completed ${swapped} Mid-Season Bench Loans!`);
  renderAll(); saveState();
}

function exportBackupJSON(){
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `IPL_Auction_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  showToast('💾 Full Auction Universe exported to .JSON!');
}

function importBackupJSON(ev){
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !Array.isArray(parsed.players) || parsed.players.length < 520) {
        showToast('❌ Invalid backup file.'); return;
      }
      state = parsed;
      applyTheme(state.theme || 'hud');
      populateSelectors();
      closeDrawers();
      renderAll(); saveState();
      showToast('📂 Auction Backup Restored Successfully!');
    } catch(e) { showToast('❌ Could not parse JSON file.'); }
  };
  reader.readAsText(file);
  ev.target.value = '';
}

function getFormBadge(pid){
  const hist = state.playerForm && state.playerForm[pid] ? state.playerForm[pid] : [];
  if (hist.length < 2) return '';
  const avg = hist.reduce((a,b)=>a+b, 0) / hist.length;
  if (avg >= 42) return ' 🔥';
  if (avg <= 12) return ' ❄️';
  return '';
}


function openCompareDrawer(){
  const selA = document.getElementById('cmpPlayerA');
  const selB = document.getElementById('cmpPlayerB');
  const sorted = [...state.players].sort((a,b) => b.ovr - a.ovr || b.soldPrice - a.soldPrice);
  const opts = sorted.map(p => `<option value="${p.id}">${p.name} (${p.soldTo || p.status} • OVR ${p.ovr})</option>`).join('');
  selA.innerHTML = opts;
  selB.innerHTML = opts;
  if (sorted.length > 1) selB.value = sorted[1].id;
  renderCompareBody();
  document.getElementById('compareBackdrop').classList.add('open');
}

function renderCompareBody(){
  const pA = state.players[parseInt(document.getElementById('cmpPlayerA').value, 10)];
  const pB = state.players[parseInt(document.getElementById('cmpPlayerB').value, 10)];
  if (!pA || !pB) return;
  const st = state.seasonData && state.seasonData.pStats ? state.seasonData.pStats : {};
  const card = (p, other) => {
    const r = st[p.id]?.runs || 0, w = st[p.id]?.wkts || 0, imp = Math.round(st[p.id]?.impact || 0);
    return `
      <div class="cmp-card">
        <div style="font-family:'Chakra Petch',sans-serif;font-size:16px;font-weight:700;color:var(--gold);margin-bottom:6px">${p.name}${getFormBadge(p.id)}</div>
        <div class="cmp-row"><span>Team</span><b>${p.soldTo || p.status}</b></div>
        <div class="cmp-row"><span>Role</span><b>${roleLabel(p.role)} (${p.os?'OS':'IND'})</b></div>
        <div class="cmp-row"><span>Phase Tag</span><b style="color:#38bdf8">${p.phase||roleLabel(p.role)}</b></div>
        <div class="cmp-row"><span>OVR / Tier</span><b style="color:${p.ovr>=other.ovr?'#10b981':'var(--text)'}">${p.ovr} (T${p.tier})</b></div>
        <div class="cmp-row"><span>Bat / Bowl</span><b>${p.bat||p.ovr} / ${p.bowl||30}</b></div>
        <div class="cmp-row"><span>SR / Econ</span><b>${p.sr||130} / ${p.econ||'—'}</b></div>
        <div class="cmp-row"><span>Auction Price</span><b>${p.soldPrice ? fmtCr(p.soldPrice) : fmtCr(p.base)+' (Base)'}</b></div>
        <div class="cmp-row"><span>Season Runs</span><b>${r}</b></div>
        <div class="cmp-row"><span>Season Wkts</span><b>${w}</b></div>
        <div class="cmp-row" style="border:none"><span>MVP Impact</span><b>${imp} pts</b></div>
      </div>`;
  };
  document.getElementById('cmpBody').innerHTML = card(pA, pB) + card(pB, pA);
}




// ==================== LIVE 10-TEAM PURSE & ROLE MATRIX DRAWER ====================
function openMatrixDrawer(){
  const rows = state.teams.map(t => {
    const c = teamRoleCounts(t);
    const owner = t.isHuman ? (t.ownerName || 'Human') : 'AI Bot';
    return `
      <tr>
        <td>${getTeamLogo(t.id, 16)} <b style="color:${t.color}">${t.id}</b> <small style="color:var(--muted)">(${owner})</small></td>
        <td style="font-family:'JetBrains Mono',monospace;color:var(--gold)"><b>${fmtCr(t.purse)}</b></td>
        <td><b>${t.squad.length}</b>/25</td>
        <td>${c.OS}/8</td>
        <td>${c.B}</td>
        <td>${c.WK}</td>
        <td>${c.AR}</td>
        <td>${c.BW}</td>
        <td>${c.spinners}</td>
        <td>${t.rtmCards ?? 2}</td>
      </tr>`;
  }).join('');

  document.getElementById('matrixTableWrap').innerHTML = `
    <table>
      <thead>
        <tr><th>Team</th><th>Purse</th><th>Sq</th><th>OS</th><th>Bat</th><th>WK</th><th>AR</th><th>Bowl</th><th>Spin</th><th>RTM</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  const remElite = state.players.filter(p => p.status === 'AVAIL' && (p.tier === 'S' || p.tier === 'A'));
  const scGrid = document.getElementById('matrixScarcityGrid');
  if (scGrid) {
    const cnt = {
      B: remElite.filter(p => p.role === 'B').length,
      WK: remElite.filter(p => p.role === 'WK').length,
      AR: remElite.filter(p => p.role === 'AR').length,
      SPIN: remElite.filter(p => isSpinner(p)).length,
      PACE: remElite.filter(p => p.role === 'BW' && !isSpinner(p)).length
    };
    scGrid.innerHTML = `
      <div class="scarcity-card"><b>${cnt.B}</b><span>Batters</span></div>
      <div class="scarcity-card"><b>${cnt.WK}</b><span>Keepers</span></div>
      <div class="scarcity-card"><b>${cnt.AR}</b><span>All-Rnd</span></div>
      <div class="scarcity-card"><b>${cnt.SPIN}</b><span>Spinners</span></div>
      <div class="scarcity-card"><b>${cnt.PACE}</b><span>Pacers</span></div>`;
  }
  document.getElementById('matrixBackdrop').classList.add('open');
}

// ==================== LIVE SOLD & UNSOLD HISTORY LOG DRAWER ====================
function openSoldLogDrawer(){
  renderSoldLog('RECENT');
  document.getElementById('soldLogBackdrop').classList.add('open');
}

function renderSoldLog(mode='RECENT', btn=null){
  if (btn) {
    document.querySelectorAll('#soldLogFilterBar .chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
  }
  const sold = state.players.filter(p => p.status === 'SOLD');
  const unsold = state.players.filter(p => p.status === 'UNSOLD');
  const totalSpent = sold.reduce((s,p) => s + (p.soldPrice || 0), 0);
  document.getElementById('soldLogSummary').textContent = `${sold.length} Sold (${fmtCr(totalSpent)} spent) • ${unsold.length} Unsold`;

  let list = [];
  if (mode === 'RECENT') {
    const orderIds = (state.soldOrder || []).map(x => x.id);
    const ordered = orderIds.map(id => state.players[id]).filter(p => p && p.status === 'SOLD');
    const seen = new Set(ordered.map(p => p.id));
    list = [...ordered, ...sold.filter(p => !seen.has(p.id))];
  } else if (mode === 'EXPENSIVE') {
    list = [...sold].sort((a,b) => b.soldPrice - a.soldPrice);
  } else if (mode === 'STEALS') {
    list = [...sold].filter(p => p.ovr >= 78).sort((a,b) => (b.ovr / Math.max(30, b.soldPrice)) - (a.ovr / Math.max(30, a.soldPrice)));
  } else {
    list = [...unsold].sort((a,b) => b.ovr - a.ovr);
  }

  document.getElementById('soldLogList').innerHTML = list.length ? list.slice(0, 150).map((p, i) => `
    <div class="pool-row">
      <div class="p-info">
        <div class="p-name">${i+1}. ${p.name} <span style="font-size:10px;color:var(--gold)">OVR ${p.ovr} • T${p.tier}</span></div>
        <div class="p-sub">${roleLabel(p.role)} • ${p.os?'OS':'IND'} • ${p.set}</div>
      </div>
      ${p.status === 'SOLD'
        ? `<span class="pill pill-sold">${getTeamLogo(p.soldTo, 14)} ${p.soldTo} • ${fmtCr(p.soldPrice)}</span>`
        : `<span class="pill pill-unsold">UNSOLD (${fmtCr(p.base)})</span>`}
    </div>`).join('') : `<div style="text-align:center;padding:24px;color:var(--muted)">No players in this list yet.</div>`;
}


// ==================== TARGET WISHLIST TOGGLE ====================
function toggleWishlist(pid){
  if (!state.wishlist) state.wishlist = [];
  const idx = state.wishlist.indexOf(pid);
  const p = state.players[pid];
  if (idx === -1) {
    state.wishlist.push(pid);
    showToast(`⭐ Added ${p.name} to your Target Wishlist!`);
  } else {
    state.wishlist.splice(idx, 1);
    showToast(`Removed ${p.name} from Wishlist.`);
  }
  renderPool();
  saveState();
}



// ==================== COMMISSIONER UNDO LAST SALE ====================
function undoLastSale(){
  if (mpRole === 'CLIENT') { showToast('Only the Host Auctioneer can undo a sale.'); return; }
  if (!state.soldOrder || !state.soldOrder.length) {
    showToast('No recent sales to undo!'); return;
  }
  const last = state.soldOrder.shift();
  const p = state.players[last.id];
  const t = state.teams.find(x => x.id === last.team);
  if (!p || !t) return;

  t.squad = t.squad.filter(id => id !== p.id);
  t.purse = Math.min(state.startingPurse || 12000, t.purse + last.price);
  p.status = 'AVAIL'; p.soldTo = null; p.soldPrice = 0;

  closeDrawers();
  sfxUnsold();
  pushTicker(`↩️ SALE REVERTED: ${p.name} returned from ${t.id} (${fmtCr(last.price)} refunded)`);
  addReaction(`↩️ <b>UNDO SALE:</b> ${p.name} removed from <b style="color:${t.color}">${t.id}</b> (${fmtCr(last.price)} refunded) and back on the block!`, t.color);
  showToast(`↩️ Reverted ${p.name} from ${t.id} (+${fmtCr(last.price)} refunded)!`);
  callPlayerById(p.id);
}




// ==================== V32 UPGRADE 1: BROADCAST RIVAL STRIP & LIVE BID-WAR PRICE GRAPH ====================
function renderBroadcastRivalStripAndGraph(isLive, p){
  const strip = document.getElementById('rivalStrip');

  if (strip) {
    if (!isLive || !state.bidPoints || state.bidPoints.length <= 1) {
      strip.innerHTML = `<div class="rival-slot">LOT #${p ? p.id + 1 : 1}</div><div class="rival-slot lead">BASE ${p ? fmtCr(p.base) : '₹2.00 Cr'}</div><div class="rival-slot">10 TABLES READY</div>`;
    } else {
      // Latest distinct team bids (up to 3)
      const latestByTeam = new Map();
      for (let i = state.bidPoints.length - 1; i >= 1; i--) {
        const pt = state.bidPoints[i];
        if (!latestByTeam.has(pt.team)) latestByTeam.set(pt.team, pt);
        if (latestByTeam.size >= 3) break;
      }
      const arr = Array.from(latestByTeam.values());
      // Put leader in center if 3 bidders, otherwise order cleanly
      const ordered = arr.length === 3 ? [arr[1], arr[0], arr[2]] : arr;
      strip.innerHTML = ordered.map(pt => {
        const isL = pt.team === state.curLeader;
        return `<div class="rival-slot ${isL?'lead':''}" style="border-bottom:2px solid ${pt.color}">
          ${getTeamLogo(pt.team, 15)}
          <span style="color:${pt.color}">${pt.team}</span>
          <span>${fmtCr(pt.bid)}</span>
        </div>`;
      }).join('');
    }
  }

}

// ==================== V32 UPGRADE 2: CUSTOM PLAYER CREATOR ====================
function openCustomPlayerDrawer(){
  updateCpOvrLabel();
  document.getElementById('customPlayerBackdrop').classList.add('open');
}
function updateCpOvrLabel(){
  const v = parseInt(document.getElementById('cpOvr')?.value || '92', 10);
  const tier = v >= 92 ? 'S' : v >= 86 ? 'A' : v >= 80 ? 'B' : 'C';
  const el = document.getElementById('cpOvrVal');
  if (el) el.textContent = `${v} (Tier ${tier})`;
}
function addCustomPlayer(){
  const name = (document.getElementById('cpName').value || '').trim();
  if (!name) { showToast('Enter a player name first!'); return; }
  const role = document.getElementById('cpRole').value;
  const os = document.getElementById('cpOrigin').value === '1';
  const set = document.getElementById('cpSet').value;
  const base = parseInt(document.getElementById('cpBase').value, 10) || 200;
  const ovr = parseInt(document.getElementById('cpOvr').value, 10) || 90;
  const tier = ovr >= 92 ? 'S' : ovr >= 86 ? 'A' : ovr >= 80 ? 'B' : 'C';
  const fairVal = Math.min(MAX_BID_CAP, tier === 'S' ? 1850 : tier === 'A' ? 1250 : tier === 'B' ? 680 : Math.max(base, 180));
  const master = set === 'Marquee' ? 'Marquee' : (role === 'B' || role === 'WK') ? 'Batters' : role === 'AR' ? 'All-Rounders' : 'Bowlers';

  const newId = state.players.length;
  const newPlayer = {
    id: newId, name, set, role, os, base, ovr, tier, fairVal, master,
    status: 'AVAIL', soldTo: null, soldPrice: 0, injured: false, custom: true
  };
  Object.assign(newPlayer, computePlayerSplitStats(newPlayer, newId));
  state.players.push(newPlayer);
  if (state.seasonData && state.seasonData.pStats) {
    state.seasonData.pStats[newId] = { runs: 0, wkts: 0, catches: 0, impact: 0 };
  }

  const callNow = document.getElementById('cpCallNow').checked;
  document.getElementById('cpName').value = '';
  closeDrawers();
  sfxTrade();
  pushTicker(`⭐ CUSTOM PLAYER REGISTERED: ${name} (${roleLabel(role)}, OVR ${ovr}, Base ${fmtCr(base)})!`);
  showToast(`✅ Added ${name} to the IPL Auction Pool!`);
  if (callNow) callPlayerById(newId);
  else { renderAll(); saveState(); }
}



// ==================== 19. V35: FULL FRANCHISE GM WAR-ROOM, INCOMING AI TRADES, MY HUDDLE & MIND GAMES ====================
function renderGMWarRoomStrip(){
  const strip = document.getElementById('gmWarRoomStrip');
  if (!strip) return;
  const isGM = Boolean(state.humanTeamId && mpRole !== 'CLIENT');
  strip.classList.toggle('show', isGM);
  if (!isGM) return;

  const t = state.teams.find(x => x.id === state.humanTeamId);
  if (!t) return;
  const c = teamRoleCounts(t);
  const titleEl = document.getElementById('gmStripTitle');
  if (titleEl) titleEl.innerHTML = `${getTeamLogo(t.id, 16)} <span style="color:${t.color}">${t.id}</span> GM WAR ROOM • ${t.staff[0].split(' (')[0]}`;

  const kpiEl = document.getElementById('gmHudKpis');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="gm-kpi"><span>Purse</span><b>${fmtCr(t.purse)}</b></div>
      <div class="gm-kpi"><span>Squad</span><b>${t.squad.length}/25</b></div>
      <div class="gm-kpi"><span>Overseas</span><b>${c.OS}/8</b></div>
      <div class="gm-kpi"><span>RTM</span><b>${t.rtmCards ?? 0}</b></div>`;
  }

  const gaps = [];
  if (c.WK < 2) gaps.push(`WK (${c.WK}/2)`);
  if (c.spinners < 2) gaps.push(`Spin (${c.spinners}/2)`);
  if (c.BW < t.targets.BW) gaps.push(`Bowl (${c.BW}/${t.targets.BW})`);
  if (c.AR < t.targets.AR) gaps.push(`AR (${c.AR}/${t.targets.AR})`);
  if (c.B < t.targets.B) gaps.push(`Bat (${c.B}/${t.targets.B})`);

  const gapsEl = document.getElementById('gmGapsLine');
  if (gapsEl) {
    gapsEl.innerHTML = `<span>🎯 <b>Priority Needs:</b> ${gaps.slice(0,3).join(' • ') || 'Squad balanced!'}</span><span style="color:var(--muted)">Max Bid: <b>${fmtCr(maxSpendable(t))}</b></span>`;
  }
}

function callMyTeamHuddle(){
  if (!state.humanTeamId) return;
  if (state.curId === null) { showToast('Bring a player onto the podium first to call a team huddle!'); return; }
  const t = state.teams.find(x => x.id === state.humanTeamId);
  const p = state.players[state.curId];
  const nextB = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);
  // Pause AI Auctioneer while you consult your own Head Coach, Bowling Coach & Owner!
  if (!aiAuctPaused) toggleAIAuctioneerPause();
  startTeamHuddle(t, p, nextB, false);
}

function gmTableBluff(type){
  if (!state.humanTeamId || state.curId === null) return;
  const t = state.teams.find(x => x.id === state.humanTeamId);
  const p = state.players[state.curId];
  if (!t || !p) return;
  if (type === 'ALL_IN') {
    const msg = `🔥 <b style="color:${t.color}">${t.id} (YOU) Table Bluff:</b> <i>"Don't bother rivals — we are going all the way for ${p.name}!"</i>`;
    addReaction(msg, t.color);
    t.chatter = `🔥 Bluffing rivals on ${p.name}!`;
    // Small chance a cautious rival backs off slightly
    const rival = shuffleArr(state.teams.filter(x => x.id !== t.id && x.id !== state.curLeader))[0];
    if (rival && Math.random() < 0.35) {
      if (!state.lotCommitments[p.id]) state.lotCommitments[p.id] = {};
      state.lotCommitments[p.id][rival.id] = 'PASS';
      addReaction(`👀 <b style="color:${rival.color}">${rival.id}:</b> <i>"Sounds like ${t.id} is desperate for ${p.name} — we'll step back."</i>`, rival.color);
    }
    showToast('🔥 Table Bluff broadcast to all 9 rival tables!');
  } else {
    const msg = `😏 <b style="color:${t.color}">${t.id} (YOU) Taunt:</b> <i>"${fmtCr(state.curBid)} for ${p.name}?! Enjoy burning your purse, ${state.curLeader || 'rivals'}!"</i>`;
    addReaction(msg, t.color);
    t.chatter = `😏 Taunting rivals on ${p.name}!`;
    showToast('😏 Taunt sent to the auction room!');
  }
  sfxPaddle();
  renderTeams();
}

// INCOMING AI TRADE OFFERS (Rival AI GMs actively propose trades to YOUR franchise!)
function generateIncomingAITradeOffers(notify=false){
  if (!state.humanTeamId || !state.tradesUnlocked) return;
  const myT = state.teams.find(x => x.id === state.humanTeamId);
  if (!myT || myT.squad.length < 3) {
    if (notify) showToast('Sign at least 3 players first so rival AI GMs can scout your roster!');
    return;
  }
  const myC = teamRoleCounts(myT);
  const stMap = state.seasonData && state.seasonData.pStats ? state.seasonData.pStats : {};
  const offers = [];
  const rivals = shuffleArr(state.teams.filter(x => x.id !== myT.id && x.squad.length >= 3));

  for (const riv of rivals) {
    if (offers.length >= 3) break;
    const rivC = teamRoleCounts(riv);
    // Find a role rival needs that user has
    const roles = ['WK','BW','AR','B'];
    const rivNeed = roles.sort((a,b) => ((riv.targets[b]||6) - rivC[b]) - ((riv.targets[a]||6) - rivC[a]))[0];
    const myWant = roles.sort((a,b) => ((myT.targets[b]||6) - myC[b]) - ((myT.targets[a]||6) - myC[a]))[0];

    const targetFromMe = myT.squad.map(id=>state.players[id]).filter(Boolean)
      .filter(p => p.role === rivNeed && (!p.os || rivC.OS < 8))
      .sort((a,b) => b.ovr - a.ovr)[0]
      || myT.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr)[1];

    if (!targetFromMe) continue;

    const offerFromRiv = riv.squad.map(id=>state.players[id]).filter(Boolean)
      .filter(p => p.id !== targetFromMe.id && Math.abs(p.ovr - targetFromMe.ovr) <= 5 && (!p.os || (myC.OS - (targetFromMe.os?1:0)) < 8))
      .sort((a,b) => (a.role === myWant ? -1 : 1) || Math.abs(a.ovr - targetFromMe.ovr) - Math.abs(b.ovr - targetFromMe.ovr))[0];

    if (!offerFromRiv) continue;

    const diffRivToMe = targetFromMe.soldPrice - offerFromRiv.soldPrice; // >0 means rival pays me
    if ((diffRivToMe > 0 && riv.purse < diffRivToMe) || (diffRivToMe < 0 && myT.purse < -diffRivToMe)) continue;

    const stTgt = stMap[targetFromMe.id] || { runs:0, wkts:0 };
    const stOff = stMap[offerFromRiv.id] || { runs:0, wkts:0 };
    offers.push({
      id: 'INC-' + Date.now() + '-' + offers.length,
      rivalId: riv.id,
      wantMyId: targetFromMe.id,
      offerRivId: offerFromRiv.id,
      cashRivToMe: diffRivToMe,
      pitch: `${riv.staff[0].split(' (')[0]} (${riv.id}): "We need a ${roleLabel(targetFromMe.role)} like ${targetFromMe.name} (OVR ${targetFromMe.ovr}${stTgt.runs||stTgt.wkts?`, ${stTgt.runs}R/${stTgt.wkts}W`:''}). Offering ${offerFromRiv.name} (${roleLabel(offerFromRiv.role)}, OVR ${offerFromRiv.ovr}${stOff.runs||stOff.wkts?`, ${stOff.runs}R/${stOff.wkts}W`:''}) to help your ${myT.id} balance!"`
    });
  }

  state.incomingTradeOffers = offers;
  renderIncomingTrades();
  saveState();
  if (notify) showToast(offers.length ? `📩 ${offers.length} rival AI GMs sent you trade offers!` : 'No rival AI trade offers right now — try again after more signings.');
}

function renderIncomingTrades(){
  const panel = document.getElementById('incomingTradesPanel');
  const list = document.getElementById('incomingTradesList');
  if (!panel || !list) return;
  if (!state.humanTeamId || !state.tradesUnlocked) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  const offers = state.incomingTradeOffers || [];
  if (!offers.length) {
    list.innerHTML = `<div class="msg">No pending AI offers right now. Tap <b>🔄 Check AI Offers</b> above to let rival GMs scout your squad and pitch trades!</div>`;
    return;
  }
  list.innerHTML = offers.map(o => {
    const riv = state.teams.find(x=>x.id===o.rivalId);
    const pMine = state.players[o.wantMyId], pRiv = state.players[o.offerRivId];
    if (!riv || !pMine || !pRiv) return '';
    return `
      <div style="background:var(--input-bg);border:1.5px solid var(--card-border);border-left:4px solid ${riv.color};border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-size:12px;margin-bottom:5px">${o.pitch}</div>
        <div style="font-size:11.5px;font-family:'IBM Plex Mono',monospace;margin-bottom:8px">
          <span style="color:#fca5a5">YOU SEND: ${pMine.name} (${fmtCr(pMine.soldPrice)})</span> &nbsp;⇄&nbsp;
          <span style="color:#6ee7b7">YOU GET: ${pRiv.name} (${fmtCr(pRiv.soldPrice)})</span>
          ${o.cashRivToMe !== 0 ? `<br/>💵 Cash: ${o.cashRivToMe > 0 ? `${riv.id} pays YOU ${fmtCr(o.cashRivToMe)}` : `YOU pay ${riv.id} ${fmtCr(-o.cashRivToMe)}`}` : ''}
        </div>
        <div class="btn-row-3" style="margin-top:0">
          <button class="btn btn-green btn-sm" onclick="respondIncomingTrade('${o.id}','ACCEPT')">✅ Accept</button>
          <button class="btn btn-blue btn-sm" onclick="respondIncomingTrade('${o.id}','COUNTER')">💬 Counter</button>
          <button class="btn btn-red btn-sm" onclick="respondIncomingTrade('${o.id}','REJECT')">✕ Reject</button>
        </div>
      </div>`;
  }).join('');
}

function respondIncomingTrade(oid, action){
  const offers = state.incomingTradeOffers || [];
  const idx = offers.findIndex(x => x.id === oid);
  if (idx === -1) return;
  const o = offers[idx];

  if (action === 'REJECT') {
    offers.splice(idx, 1);
    sfxUnsold();
    showToast(`Declined ${o.rivalId}'s trade offer.`);
    renderIncomingTrades(); saveState();
    return;
  }

  if (action === 'COUNTER') {
    // Pre-fill the Universal Trade Desk so the user can tweak players or cash sweetener!
    const selA = document.getElementById('utTeamA'), selB = document.getElementById('utTeamB');
    if (selA && selB) {
      selA.value = state.humanTeamId;
      selB.value = o.rivalId;
      populateUniversalTradePlayers();
      const pA = document.getElementById('utPlayerA'), pB = document.getElementById('utPlayerB');
      if (pA) pA.value = String(o.wantMyId);
      if (pB) pB.value = String(o.offerRivId);
      document.getElementById('universalTradePanel')?.scrollIntoView({ behavior:'smooth' });
      showToast(`💬 Loaded ${o.rivalId}'s offer into Trade Desk — adjust player or cash & Pitch to AI GM!`);
    }
    return;
  }

  // ACCEPT
  const myT = state.teams.find(x => x.id === state.humanTeamId);
  const rivT = state.teams.find(x => x.id === o.rivalId);
  const pMine = state.players[o.wantMyId], pRiv = state.players[o.offerRivId];
  if (!myT.squad.includes(pMine.id) || !rivT.squad.includes(pRiv.id)) {
    offers.splice(idx, 1); showToast('Offer expired — player already moved.'); renderIncomingTrades(); return;
  }
  myT.squad = myT.squad.filter(id => id !== pMine.id); rivT.squad.push(pMine.id); pMine.soldTo = rivT.id;
  rivT.squad = rivT.squad.filter(id => id !== pRiv.id); myT.squad.push(pRiv.id); pRiv.soldTo = myT.id;
  myT.purse += o.cashRivToMe; rivT.purse -= o.cashRivToMe;

  const summary = `📩 INCOMING TRADE ACCEPTED (${myT.id} ⇄ ${rivT.id}): ${pMine.name} swapped for ${pRiv.name}${o.cashRivToMe!==0?` (${fmtCr(Math.abs(o.cashRivToMe))} cash adj.)`:''}`;
  state.tradeHistory.unshift(summary);
  offers.splice(idx, 1);
  pushTicker(summary);
  sfxTrade();
  showToast(`✅ Trade completed with ${rivT.id}!`);
  renderAll(); saveState();
}


// Laptop Keyboard Shortcuts (Space, P, R, N, 1-6)
document.addEventListener('keydown', (e) => {
  const tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;

  const key = e.key.toLowerCase();
  const stageActive = document.getElementById('view-stage')?.classList.contains('active');

  if (key === '1') { switchView('stage'); return; }
  if (key === '2') { switchView('pool'); return; }
  if (key === '3') { switchView('trades'); return; }
  if (key === '4') { switchView('squads'); return; }
  if (key === '5') { switchView('season'); return; }
  if (key === '6') { switchView('friends'); return; }

  if (!stageActive) return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (state.humanTeamId || mpRole === 'CLIENT') humanRaisePaddle();
    else if (state.curId !== null) runBidRound();
  } else if (key === 'p' && (state.humanTeamId || mpRole === 'CLIENT')) {
    humanPassLot();
  } else if (key === 'r' && state.curId !== null) {
    if (state.humanTeamId) humanUseRTM();
    else triggerRTMCard();
  } else if (key === 'n') {
    if (state.humanTeamId && mpRole !== 'CLIENT') toggleAIAuctioneerPause();
    else if (state.curId === null) callNextPlayer();
  }
});


// ==================== 20. V38: 1-SCREEN WELCOME MODAL & CLEAN BOOT ====================
let welcomeSelectedTeam = 'SRH';

function openWelcomeModal(){
  const modal = document.getElementById('welcomeBackdrop');
  if (!modal) return;
  const grid = document.getElementById('welcomeTeamGrid');
  if (grid) {
    grid.innerHTML = TEAMS_META.map(t => `
      <button type="button" class="wl-team-pill ${welcomeSelectedTeam===t.id?'active':''}" style="--tc:${t.color}" onclick="selectWelcomeTeam('${t.id}')">
        ${getTeamLogo(t.id, 18)} <span>${t.id}</span>
      </button>`).join('');
  }
  const soldCount = state.players.filter(p => p.status === 'SOLD').length;
  const resBtn = document.getElementById('btnWelcomeResume');
  if (resBtn) {
    if (soldCount > 0 || state.curId !== null) {
      resBtn.style.display = 'inline-flex';
      resBtn.textContent = `▶ Resume Saved Auction (${soldCount}/${state.players.length} Sold)`;
    } else {
      resBtn.style.display = 'none';
    }
  }
  modal.classList.add('open');
}

function selectWelcomeTeam(tid){
  welcomeSelectedTeam = tid;
  const grid = document.getElementById('welcomeTeamGrid');
  if (grid) {
    grid.querySelectorAll('.wl-team-pill').forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === tid);
    });
  }
  const startBtn = document.getElementById('btnWelcomeStartGM');
  if (startBtn) startBtn.textContent = `🛡️ Play as ${tid} GM`;
}

function closeWelcomeModal(){
  const modal = document.getElementById('welcomeBackdrop');
  if (modal) modal.classList.remove('open');
  try { sessionStorage.setItem('gavel_welcome_seen', '1'); } catch(e){}
}

function startFromWelcome(mode){
  closeWelcomeModal();
  if (mode === 'GM') {
    setHumanTeam(welcomeSelectedTeam || 'SRH');
    switchView('stage');
    if (state.curId === null) toggleAIAuctioneerPause();
  } else if (mode === 'AUCTIONEER') {
    setHumanTeam('');
    resetToAllAI();
    switchView('stage');
  } else if (mode === 'FRIENDS') {
    setHumanTeam('');
    switchView('friends');
  }
}

// Global error guard & clean single boot
window.addEventListener('error', (ev) => {
  try { showToast('⚠️ JS Notice: ' + (ev.message || 'Check console')); } catch(e){}
});

try {
  loadState();
  ensurePlayerSplitStats(state.players);
  applyTheme(state.theme || 'hud');
  populateSelectors();
  renderAll();
} catch (err) {
  initFreshState();
  applyTheme('hud');
  populateSelectors();
  renderAll();
}

// Show 1-screen Welcome Modal on first visit (unless joining a room link directly)
(function checkFirstLoadWelcome(){
  const params = new URLSearchParams(window.location.search);
  if (params.get('room')) return;
  let seen = false;
  try { seen = sessionStorage.getItem('gavel_welcome_seen') === '1'; } catch(e){}
  const soldAny = state.players.some(p => p.status === 'SOLD');
  if (!seen && !soldAny && state.curId === null) {
    openWelcomeModal();
  }
})();


