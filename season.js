// ============================================================================
// THE GAVEL HOUSE — PHASE-AWARE T20 SEASON ENGINE, PLAYING XII & ANALYTICS
// ============================================================================
// ==================== 11. EDITABLE & GEMINI PITCH-BALANCED PLAYING XII, GEMINI SENIOR ANALYST & MATCH-BY-MATCH SEASON ====================
let editingXITeamId = null;
let tempXIIds = [];
let tempImpactId = null;

// Real-world IPL batting position preferences (lower = higher in the order)
const REAL_BAT_SLOT = {
  // #1-#2 Pure Openers
  'Travis Head': 10, 'Abhishek Sharma': 11, 'Yashasvi Jaiswal': 10, 'Virat Kohli': 11,
  'Rohit Sharma': 10, 'Shubman Gill': 10, 'Ruturaj Gaikwad': 10, 'Phil Salt': 10,
  'Jos Buttler': 10, 'Quinton De Kock': 10, 'Devon Conway': 11, 'Ishan Kishan': 11,
  'KL Rahul': 12, 'Sunil Narine': 10, 'Jake Fraser-McGurk': 10, 'Sai Sudharsan': 12,
  'Prabhsimran Singh': 11, 'Rachin Ravindra': 12, 'Ryan Rickelton': 11, 'Finn Allen': 10,
  'Ben Duckett': 11, 'Priyansh Arya': 11, 'Vaibhav Suryavanshi': 11, 'Mitchell Marsh': 12,
  'Prithvi Shaw': 10, 'Pathum Nissanka': 11, 'Rahmanullah Gurbaz': 11, 'Jonny Bairstow': 11,
  // #3 Top-Order / No. 3 Specialists
  'Sanju Samson': 22, 'Suryakumar Yadav': 24, 'Shreyas Iyer': 24, 'Tilak Varma': 25,
  'Rajat Patidar': 25, 'Nitish Rana': 25, 'Venkatesh Iyer': 24, 'Aiden Markram': 23,
  'Cameron Green': 24, 'Devdutt Padikkal': 22, 'Angkrish Raghuvanshi': 22, 'Rahul Tripathi': 23,
  'Steve Smith': 23, 'Will Jacks': 22, 'Karun Nair': 24, 'Abhishek Porel': 22,
  // #4 Middle-Order Enforcers
  'Rishabh Pant': 34, 'Nicholas Pooran': 35, 'Riyan Parag': 34, 'Shivam Dube': 36,
  'Dewald Brevis': 35, 'Daryl Mitchell': 35, 'Nehal Wadhera': 36, 'Naman Dhir': 36,
  'Nitish Kumar Reddy': 36, 'Ayush Badoni': 37, 'Jacob Bethell': 35, 'Shai Hope': 34,
  // #5-#6 Finishers & WK-Finishers
  'Heinrich Klaasen': 44, 'Tristan Stubbs': 45, 'David Miller': 45, 'Glenn Phillips': 45,
  'Liam Livingstone': 46, 'Marcus Stoinis': 46, 'Hardik Pandya': 47, 'Rinku Singh': 48,
  'Shimron Hetmyer': 48, 'Tim David': 49, 'Dhruv Jurel': 46, 'Jitesh Sharma': 47,
  'Shashank Singh': 48, 'Ashutosh Sharma': 50, 'Rovman Powell': 49, 'Sherfane Rutherford': 49,
  'Shahrukh Khan': 49, 'Abdul Samad': 50, 'Sameer Rizvi': 50, 'Rahul Tewatia': 52,
  // #6-#7 All-Rounders
  'Axar Patel': 56, 'Ravindra Jadeja': 58, 'Sam Curran': 56, 'Ramandeep Singh': 55,
  'Romario Shepherd': 57, 'Krunal Pandya': 59, 'Washington Sundar': 59, 'Azmatullah Omarzai': 58,
  'Marco Jansen': 62, 'Mitchell Santner': 63, 'Shardul Thakur': 65, 'Pat Cummins': 70,
  'Rashid Khan': 68, 'Wanindu Hasaranga': 67, 'Harpreet Brar': 66, 'Shahbaz Ahmed': 61
};

function battingPosScore(p){
  if (!p) return 99;
  if (REAL_BAT_SLOT[p.name] !== undefined) return REAL_BAT_SLOT[p.name] + (100 - (p.ovr || 75)) * 0.02;
  const ph = p.phase || '';
  if (p.role === 'BW') return 82 + (100 - (p.bat || 30)) * 0.15;
  if (KNOWN_OPENERS.has(p.name) || ph === 'PP Opener' || ph === 'WK Opener') return 12 + (100 - (p.ovr || 75)) * 0.08;
  if (ph === 'Top Anchor') return 25 + (100 - (p.ovr || 75)) * 0.08;
  if (ph === 'Middle Enforcer' || ph === 'WK Middle') return 36 + (100 - (p.ovr || 75)) * 0.08;
  if (KNOWN_FINISHERS.has(p.name) || ph === 'Death Finisher' || ph === 'WK Finisher') return 48 + (100 - (p.ovr || 75)) * 0.08;
  if (ph === 'Finisher AR') return 54 + (100 - (p.ovr || 75)) * 0.08;
  if (p.role === 'AR') return (isSpinner(p) ? 64 : 60) + (100 - (p.ovr || 75)) * 0.08;
  if (p.role === 'B') return 32 + (100 - (p.ovr || 75)) * 0.08;
  if (p.role === 'WK') return 42 + (100 - (p.ovr || 75)) * 0.08;
  return 55;
}

function autoSortBattingOrder(idList){
  return [...idList].sort((a, b) => battingPosScore(state.players[a]) - battingPosScore(state.players[b]));
}

// Strict IPL rule: if 4 OS are in the XI, Impact Sub MUST be Indian (!p.os).
function pickWiseImpactSub(t, xiIds, pitchDesc=''){
  const xiSet = new Set(xiIds);
  const xiPlayers = xiIds.map(id => state.players[id]).filter(Boolean);
  const osInXI = xiPlayers.filter(p => p.os).length;
  const xiBowlers = xiPlayers.filter(p => p.role === 'BW' || p.role === 'AR').length;
  const xiSpinners = xiPlayers.filter(p => isSpinner(p)).length;
  const xiHasWK = xiPlayers.some(p => p.role === 'WK');
  if (typeof buildSmartOfflinePlayingXII === 'function') {
    const smart = buildSmartOfflinePlayingXII(t, pitchDesc);
    return { xi: smart.xi, impact: smart.impact };
  }
  const sorted = t.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);
  const xi = sorted.slice(0, 11);
  const orderedIds = autoSortBattingOrder(xi.map(p => p.id));
  return { xi: orderedIds.map(id => state.players[id]), impact: pickWiseImpactSub(t, orderedIds, pitchDesc) };
}

function openXIEditor(tid){
  const t = state.teams.find(x => x.id === tid);
  if (!t || t.squad.length < 11) { showToast('Team needs at least 11 signed players to edit Playing XII.'); return; }
  editingXITeamId = tid;
  const { xi, impact } = computePlayingXII(t);
  tempXIIds = xi.map(p => p.id);
  tempImpactId = impact ? impact.id : null;
  document.getElementById('xiEdTitle').textContent = `✏️ ${t.id} PLAYING XII & BATTING ORDER`;
  document.getElementById('xiEdSub').textContent = `${t.home} • ▲ ▼ to reorder (4 OS in XI = Indian Impact Only)`;
  renderXIEditorList();
  const xiEl = document.getElementById('xiEditorBackdrop');
  if (xiEl) { xiEl.style.zIndex = '99'; xiEl.classList.add('open'); }
}

function moveXIPlayer(pid, delta){
  const idx = tempXIIds.indexOf(pid);
  if (idx === -1) return;
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= tempXIIds.length) return;
  [tempXIIds[idx], tempXIIds[newIdx]] = [tempXIIds[newIdx], tempXIIds[idx]];
  beep(520 + (delta < 0 ? 100 : -60), 0.05, 'triangle', 0.08);
  renderXIEditorList();
}

function renderXIEditorList(){
  const t = state.teams.find(x => x.id === editingXITeamId);
  if (!t) return;
  const osCount = tempXIIds.filter(id => state.players[id]?.os).length;
  const impObj = tempImpactId !== null ? state.players[tempImpactId] : null;
  const impName = impObj ? `${impObj.name}${impObj.os?' ✈️':' (IND)'}` : 'None';
  document.getElementById('xiEdCount').textContent = `XI: ${tempXIIds.length}/11 • OS: ${osCount}/4 • Impact: ${impName}`;

  const xiSet = new Set(tempXIIds);
  const startersHTML = tempXIIds.map((pid, idx) => {
    const p = state.players[pid];
    if (!p) return '';
    return `
      <div class="pool-row" style="border-color:#10b981;background:rgba(16,185,129,0.10)">
        <div style="display:flex;align-items:center;gap:7px;min-width:0;flex:1">
          <span class="pill" style="padding:3px 6px;min-width:28px;justify-content:center;color:var(--gold)">#${idx+1}</span>
          <div class="p-info">
            <div class="p-name">${p.name}${getFormBadge(p.id)} ${p.os?'✈️':''} ${t.captainId===p.id?'<span style="color:var(--gold)">[©]</span>':t.vcId===p.id?'<span style="color:#38bdf8">[VC]</span>':''}</div>
            <div class="p-sub">${roleLabel(p.role)}${isSpinner(p)?' (Spin)':p.role==='BW'?' (Pace)':''} • OVR ${p.ovr} • T${p.tier}</div>
          </div>
        </div>
        <div style="display:flex;gap:3px;flex-shrink:0">
          <button class="btn btn-sm" style="padding:5px 7px" ${idx===0?'disabled':''} onclick="moveXIPlayer(${p.id},-1)">▲</button>
          <button class="btn btn-sm" style="padding:5px 7px" ${idx===tempXIIds.length-1?'disabled':''} onclick="moveXIPlayer(${p.id},1)">▼</button>
          <button class="btn btn-sm ${t.captainId===p.id?'btn-blue':''}" style="padding:5px 7px" onclick="setTeamLeader(${p.id},'C')">©</button>
          <button class="btn btn-sm btn-red" style="padding:5px 7px" onclick="toggleXIPlayer(${p.id})">✕</button>
        </div>
      </div>`;
  }).join('');

  const benchPlayers = t.squad
    .map(id => state.players[id])
    .filter(p => p && !xiSet.has(p.id))
    .sort((a,b) => (a.id === tempImpactId ? -1 : b.id === tempImpactId ? 1 : b.ovr - a.ovr));

  const benchHTML = benchPlayers.map(p => {
    const isImp = tempImpactId === p.id;
    const osBlocked = p.os && osCount >= 4;
    return `
      <div class="pool-row" style="${isImp?'border-color:var(--gold);background:var(--gold-dim)':''}">
        <div class="p-info">
          <div class="p-name">${p.name}${getFormBadge(p.id)} ${p.os?'✈️':'🇮🇳'} ${isImp?'<span style="color:var(--gold)">[⚡ IMPACT]</span>':''}</div>
          <div class="p-sub">${roleLabel(p.role)}${isSpinner(p)?' (Spin)':p.role==='BW'?' (Pace)':''} • OVR ${p.ovr} • T${p.tier}</div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm" ${osBlocked?'disabled':''} onclick="toggleXIPlayer(${p.id})">+ XI</button>
          <button class="btn btn-sm ${isImp?'btn-gold':''}" ${osBlocked?'disabled':''} onclick="setImpactSub(${p.id})">${isImp?'⚡ Sub':'Sub'}</button>
        </div>
      </div>`;
  }).join('');

  document.getElementById('xiEdList').innerHTML =
    `<div style="font-size:10px;font-weight:800;color:#10b981;font-family:'IBM Plex Mono',monospace;margin-bottom:2px">PLAYING XI BATTING ORDER (#1 TO #11)</div>` +
    startersHTML +
    `<div style="font-size:10px;font-weight:800;color:var(--gold);font-family:'IBM Plex Mono',monospace;margin:8px 0 2px">BENCH &amp; IMPACT PLAYER ${osCount>=4?'(4 OS IN XI → INDIAN IMPACT ONLY)':''}</div>` +
    benchHTML;
}

function toggleXIPlayer(pid){
  const idx = tempXIIds.indexOf(pid);
  if (idx !== -1) {
    tempXIIds.splice(idx, 1);
  } else {
    if (tempXIIds.length >= 11) { showToast('Remove a starter first (max 11 in XI).'); return; }
    const p = state.players[pid];
    const osNow = tempXIIds.filter(id => state.players[id]?.os).length;
    if (p.os && osNow >= 4) { showToast('Max 4 Overseas players allowed in Playing XI!'); return; }
    if (tempImpactId === pid) tempImpactId = null;
    tempXIIds.push(pid);
    const newOs = tempXIIds.filter(id => state.players[id]?.os).length;
    if (newOs >= 4 && tempImpactId !== null && state.players[tempImpactId]?.os) {
      tempImpactId = null;
      showToast('4 Overseas in XI — cleared Overseas Impact Sub.');
    }
  }
  renderXIEditorList();
}

function setImpactSub(pid){
  const p = state.players[pid];
  const osNow = tempXIIds.filter(id => id !== pid && state.players[id]?.os).length;
  if (p && p.os && osNow >= 4) {
    showToast('With 4 Overseas in Playing XI, Impact Player must be Indian.');
    return;
  }
  if (tempXIIds.includes(pid)) {
    tempXIIds = tempXIIds.filter(id => id !== pid);
  }
  tempImpactId = (tempImpactId === pid) ? null : pid;
  renderXIEditorList();
}

function setTeamLeader(pid, type){
  const t = state.teams.find(x => x.id === editingXITeamId);
  if (!t) return;
  if (type === 'C') {
    if (t.vcId === pid) t.vcId = null;
    t.captainId = (t.captainId === pid) ? null : pid;
  } else {
    if (t.captainId === pid) t.captainId = null;
    t.vcId = (t.vcId === pid) ? null : pid;
  }
  renderXIEditorList();
}

function closeXIEditor(){
  document.getElementById('xiEditorBackdrop')?.classList.remove('open');
}

function saveManualXI(){
  if (tempXIIds.length !== 11) { showToast(`Select exactly 11 starters (currently ${tempXIIds.length}/11).`); return; }
  const t = state.teams.find(x => x.id === editingXITeamId);
  if (!t) return;
  const osCount = tempXIIds.filter(id => state.players[id]?.os).length;
  if (osCount >= 4 && tempImpactId !== null && state.players[tempImpactId]?.os) {
    showToast('4 Overseas in XI — Impact Player must be Indian.');
    return;
  }
  if (tempImpactId === null) {
    const autoImp = pickWiseImpactSub(t, tempXIIds, t.home);
    tempImpactId = autoImp ? autoImp.id : null;
  }
  t.customXI = [...tempXIIds];
  t.customImpact = tempImpactId;
  t.xiSource = 'MANUAL';
  t.xiNote = 'Playing XII customized manually.';
  closeXIEditor();
  showToast(`✅ Saved ${t.id} Playing XII!`);
  renderAll(); saveState();
  if (pendingPreMatch && (pendingPreMatch.t1Id === t.id || pendingPreMatch.t2Id === t.id)) {
    renderPreMatchLineups();
  }
}

let aiPickingInProgress = {};

function formatSquadForGeminiPrompt(t){
  const st = state.seasonData && state.seasonData.pStats ? state.seasonData.pStats : {};
  return t.squad.map(id => {
    const p = state.players[id];
    const bowlStyle = isSpinner(p) ? 'Spin' : (p.role === 'BW' || p.role === 'AR') ? 'Pace' : 'Bat';
    const slotSc = battingPosScore(p);
    const posHint = slotSc <= 18 ? 'Opener(#1-2)' : slotSc <= 28 ? 'No.3(#3)' : slotSc <= 40 ? 'Middle(#4)' : slotSc <= 53 ? 'Finisher(#5-6)' : slotSc <= 72 ? 'LowerAR(#6-7)' : 'Bowler(#8-11)';
    const statTxt = st[id] && (st[id].runs > 0 || st[id].wkts > 0) ? ` | Season:${st[id].runs}R,${st[id].wkts}W` : '';
    return `ID:${p.id} | ${p.name} | ${roleLabel(p.role)} (${bowlStyle}, ${posHint}) | ${p.os?'OS':'IND'} | OVR ${p.ovr}${statTxt}`;
  }).join('\n');
}

function validateAndApplyGeminiXI(t, res, pitchDesc=''){
  const validSet = new Set(t.squad);
  const cleanXI = [];
  let os = 0;
  if (res && Array.isArray(res.xi)) {
    for (const id of res.xi) {
      const numId = parseInt(id, 10);
      if (!validSet.has(numId) || cleanXI.includes(numId)) continue;
      const p = state.players[numId];
      if (!p || (p.os && os >= 4)) continue;
      cleanXI.push(numId);
      if (p.os) os++;
      if (cleanXI.length === 11) break;
    }
  }
  const sorted = t.squad.map(id=>state.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);
  for (const p of sorted) {
    if (cleanXI.length === 11) break;
    if (cleanXI.includes(p.id) || (p.os && os >= 4)) continue;
    cleanXI.push(p.id); if (p.os) os++;
  }

  const badOrder = cleanXI.some((id, idx) => {
    const p = state.players[id];
    const slot = battingPosScore(p);
    // Catch specialist bowlers in top 6, pure batters in tail, finishers opening, or openers batting #5+
    return (idx <= 5 && p.role === 'BW')
        || (idx >= 7 && (p.role === 'B' || p.role === 'WK'))
        || (idx <= 1 && slot >= 44)
        || (idx >= 4 && slot <= 15);
  });
  const finalXI = badOrder ? autoSortBattingOrder(cleanXI) : cleanXI;

  const finalOs = finalXI.filter(id => state.players[id]?.os).length;
  let impId = res && res.impact !== undefined ? parseInt(res.impact, 10) : null;
  const impObj = (impId !== null && validSet.has(impId) && !finalXI.includes(impId)) ? state.players[impId] : null;
  if (!impObj || (finalOs >= 4 && impObj.os)) {
    const wiseImp = pickWiseImpactSub(t, finalXI, pitchDesc || t.home);
    impId = wiseImp ? wiseImp.id : null;
  }

  t.customXI = finalXI;
  t.customImpact = impId;
  t.xiSource = 'GEMINI';
  if (res && finalXI.includes(parseInt(res.captainId, 10))) t.captainId = parseInt(res.captainId, 10);
  if (res && finalXI.includes(parseInt(res.vcId, 10)) && parseInt(res.vcId, 10) !== t.captainId) t.vcId = parseInt(res.vcId, 10);
  t.xiNote = (res && res.note) ? res.note : `Pitch-balanced XII selected for ${pitchDesc || t.home}.`;
  return { xi: finalXI, impact: impId };
}

function applySmartOfflineXII(t, targetPitch, fromEditor=false, silent=false){
  const smart = buildSmartOfflinePlayingXII(t, targetPitch || t.home);
  t.customXI = [...smart.xiIds];
  t.customImpact = smart.impact ? smart.impact.id : null;
  if (!t.captainId || !t.customXI.includes(t.captainId)) t.captainId = smart.captainId;
  if (!t.vcId || !t.customXI.includes(t.vcId) || t.vcId === t.captainId) t.vcId = smart.vcId;
  t.xiSource = 'SMART';
  t.xiNote = smart.note;
  if (fromEditor) {
    tempXIIds = [...t.customXI];
    tempImpactId = t.customImpact;
    renderXIEditorList();
  }
  if (!silent) {
    sfxTrade();
    showToast(`🧠 Smart Coach locked ${t.id} Playing XII!`);
  }
  renderSquads();
  saveState();
  return smart;
}

async function aiPickPlayingXII(tid, fromEditor=false, silent=false, customPitch=''){
  const t = state.teams.find(x => x.id === tid);
  if (!t || t.squad.length < 11) { if (!silent) showToast(`${tid} needs at least 11 players first!`); return; }
  const targetPitch = customPitch || t.home;

  // If no user API key or in cooldown, run Smart Offline Coach immediately!
  const hasRealKey = (typeof getSavedApiKeys === 'function' && getSavedApiKeys().length > 0);
  if (!hasRealKey && !getSavedApiKey()) {
    applySmartOfflineXII(t, targetPitch, fromEditor, silent);
    return;
  }
  if (aiPickingInProgress[tid]) return;
  aiPickingInProgress[tid] = true;
  if (!fromEditor) renderSquads();

  const prompt = `Pick Playing XI (11 unique IDs in batting order #1-#11) + 1 Impact Sub for ${t.name} (${t.id}) on ${targetPitch}.
Squad:
${formatSquadForGeminiPrompt(t)}

Rules:
1) Max 4 Overseas (OS) in XI.
2) If 4 OS are in XI, Impact Sub MUST be Indian (!os).
3) STRICT REAL-WORLD BATTING ORDER: Put Opener(#1-2) at #1-#2, No.3(#3) at #3, Middle(#4) at #4, Finisher(#5-6) at #5-#6, LowerAR(#6-7) at #6-#7, and Bowler(#8-11) at #8-#11.
Return ONLY valid JSON: {"xi": [11 ids], "impact": id, "captainId": id, "vcId": id, "note": "short reason"}`;

  const res = await callGeminiJSON(prompt, 0.35, 5500);
  aiPickingInProgress[tid] = false;
  if (!res || !Array.isArray(res.xi)) {
    // Seamless Smart Offline Engine fallback — ALWAYS selects & saves an accurate Playing XII!
    applySmartOfflineXII(t, targetPitch, fromEditor, silent);
    return;
  }
  const applied = validateAndApplyGeminiXI(t, res, targetPitch);
  if (fromEditor) { tempXIIds = [...applied.xi]; tempImpactId = applied.impact; renderXIEditorList(); }
  if (!silent) { sfxTrade(); showToast(`Updated ${t.id} Playing XII!`); }
  renderSquads(); saveState();
}

async function aiPickAllPlayingXIIs(){
  const eligible = state.teams.filter(t => t.squad.length >= 11);
  if (!eligible.length) { showToast('Teams need at least 11 players signed first.'); return; }
  const hasUserKey = (typeof getSavedApiKeys === 'function' && getSavedApiKeys().length > 0);
  for (const t of eligible) {
    if (hasUserKey) await aiPickPlayingXII(t.id, false, true);
    else applySmartOfflineXII(t, t.home, false, true);
  }
  sfxTrade();
  showToast(`🧠 Smart Playing XIIs locked for ${eligible.length} franchise(s)!`);
  renderAll(); saveState();
}

// Local baseline score (used as fallback & match engine strength)
function teamCoachEval(t){
  const c = teamRoleCounts(t);
  const { xi, impact } = computePlayingXII(t);
  if (xi.length === 0) {
    return { overall:4.0, bat:4.0, bowl:4.0, ar:4.0, bal:4.0, xi:[], impact:null, avgOvr:0, strength:'Fresh purse ready to build', weakness:'No players signed yet' };
  }
  const batters = xi.filter(p => p.role==='B'||p.role==='WK'||p.role==='AR');
  const bowlers = xi.filter(p => p.role==='BW'||p.role==='AR');
  const allRounders = xi.filter(p => p.role==='AR');
  const tierSCount = xi.filter(p => p.tier==='S').length;
  const indCoreCount = xi.filter(p => !p.os && p.ovr >= 82).length;
  const avg = arr => arr.length ? arr.reduce((s,p)=>s+p.ovr,0)/arr.length : 64;
  const scale = (v, lo, hi) => Math.min(9.6, Math.max(4.5, 4.5 + ((v - lo) / (hi - lo)) * 5.0));

  const batScore = +(scale(avg(batters), 68, 94) + (batters.length >= 6 ? 0.3 : -0.6)).toFixed(1);
  const bowlScore = +(scale(avg(bowlers), 68, 94) + (bowlers.length >= 5 ? 0.3 : -0.7)).toFixed(1);
  const arScore = +(scale(avg(allRounders), 68, 92) + (allRounders.length >= 2 ? 0.4 : -0.8)).toFixed(1);
  let balScore = 6.5;
  if (c.WK >= 1) balScore += 0.8; else balScore -= 1.4;
  if (indCoreCount >= 4) balScore += 0.9; else if (indCoreCount <= 1) balScore -= 0.8;
  if (tierSCount >= 2) balScore += 0.7; else if (tierSCount === 0) balScore -= 0.7;
  if (xi.length < 11) balScore -= 1.5;
  balScore = +Math.min(9.5, Math.max(4.5, balScore)).toFixed(1);

  const overall = +Math.min(9.5, Math.max(4.8, (batScore*0.32 + bowlScore*0.32 + arScore*0.18 + balScore*0.18))).toFixed(1);
  const avgOvr = Math.round(avg(xi));
  const bestBat = [...batters].sort((a,b)=>b.ovr-a.ovr)[0];
  const bestBowl = [...bowlers].sort((a,b)=>b.ovr-a.ovr)[0];

  const spinnersXI = xi.filter(p => isSpinner(p));
  const deathXI = xi.filter(p => p.phase === 'Death Pace' || (p.role === 'BW' && (p.econ || 8.5) <= 8.0));
  const homeS = t.home.split(' (')[0];
  const isSpinHome = /chepauk|ekana|jaipur/i.test(homeS);

  let strengthTxt = bestBat && bestBowl
    ? `Explosive core led by ${bestBat.name} & ${bestBowl.name} tailored for ${homeS}.`
    : 'Balanced roster with solid depth.';
  if (isSpinHome && spinnersXI.length >= 2) {
    strengthTxt = `Lethal ${homeS} spin choke led by ${spinnersXI.slice(0,2).map(p=>p.name).join(' & ')} plus ${bestBat?bestBat.name:'batting depth'}.`;
  } else if (deathXI.length >= 2 && bestBat) {
    strengthTxt = `Elite death bowling (${deathXI.slice(0,2).map(p=>p.name).join(' & ')}) backing up ${bestBat.name}'s firepower.`;
  } else if (allRounders.length >= 3 && bestBat) {
    strengthTxt = `Deep batting till #8 with ${allRounders.length} all-rounders (${allRounders.slice(0,2).map(p=>p.name).join(', ')}) and ${bestBat.name}.`;
  }

  let weaknessTxt = 'Relies heavily on Impact Sub timing in close chases.';
  if (c.WK === 0) weaknessTxt = 'No specialist wicketkeeper signed — urgent trade needed.';
  else if (bowlers.length < 5) weaknessTxt = `Only ${bowlers.length} frontline bowling options — vulnerable if a bowler has an off day.`;
  else if (isSpinHome && spinnersXI.length < 2) weaknessTxt = `Light on spin (${spinnersXI.length}) for a turning ${homeS} surface.`;
  else if (deathXI.length === 0) weaknessTxt = 'Lacks a proven specialist death-overs pacer for overs 17-20.';
  else if (indCoreCount <= 2) weaknessTxt = 'Over-reliant on 4 overseas stars — thin Indian core if injuries hit.';
  else if (batters.length < 6) weaknessTxt = 'Shallow lower-middle order — top 4 must fire every game.';

  return {
    overall, bat:Math.min(9.6,batScore), bowl:Math.min(9.6,bowlScore), ar:Math.min(9.6,arScore), bal:balScore,
    xi, impact, avgOvr,
    strength: strengthTxt,
    weakness: weaknessTxt
  };
}

function exportSquadsCSV(){
  const rows = [['Team','Player','Role','Origin','Set','Tier','OVR','Price_Lakhs']];
  state.teams.forEach(t => {
    t.squad.forEach(id => {
      const p = state.players[id];
      rows.push([t.id, `"${p.name}"`, roleLabel(p.role), p.os?'Overseas':'Indian', p.set, p.tier, p.ovr, p.soldPrice]);
    });
  });
  const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'IPL_Mega_Auction_Squads.csv';
  a.click();
  showToast('Exported all 10 squads to CSV!');
}

function simSingleH2H(){
  const idA = document.getElementById('h2hTeamA').value;
  const idB = document.getElementById('h2hTeamB').value;
  if (idA === idB) { showToast('Pick two different teams!'); return; }
  const tA = state.teams.find(t=>t.id===idA), tB = state.teams.find(t=>t.id===idB);
  const sA = teamCoachEval(tA), sB = teamCoachEval(tB);
  const scA = Math.round(148 + (sA.overall - 6) * 14 + (Math.random() * 48 - 16));
  const wA = Math.min(10, Math.floor(3 + Math.random() * 6));
  const rawB = Math.round(148 + (sB.overall - 6) * 14 + (Math.random() * 48 - 16));
  const bWins = rawB >= scA;
  const scB = bWins ? (scA + 1 + Math.floor(Math.random() * 6)) : Math.min(scA - 1, rawB);
  const wB = bWins ? Math.min(8, Math.floor(2 + Math.random() * 6)) : Math.min(10, Math.floor(5 + Math.random() * 5));
  const win = bWins ? tB : tA;
  const margin = bWins ? `${10 - wB} wickets` : `${scA - scB} runs`;
  const starPool = (win.id===tA.id ? sA.xi : sB.xi);
  const potm = starPool.length ? starPool[Math.floor(Math.random()*Math.min(4, starPool.length))].name : 'Team Captain';
  sfxCrowdRoar(0.9);
  document.getElementById('h2hResultBox').innerHTML = `
    <div class="msg" style="border-left-color:${win.color}">
      <b>${tA.id} ${scA}/${wA} (20 ov) vs ${tB.id} ${scB}/${wB}</b><br/>
      🏆 <b style="color:${win.color}">${win.name}</b> won by <b>${margin}</b> • Player of the Match: <b>${potm}</b>
    </div>`;
}

// GEMINI SENIOR ANALYST REPORT (Genuine tactical reviews for all 10 squads!)
async function runCoachAnalysis(){
  const wrap = document.getElementById('coachReportWrap');
  const baseReports = state.teams.map(t => ({ t, ev: teamCoachEval(t) }));

  if (getSavedApiKey()) {
    wrap.innerHTML = `<div class="panel"><div class="sec-title">🧠 Gemini Senior Analyst reviewing all 10 squads...</div><div style="font-size:12px;color:var(--muted);margin-top:6px">Evaluating Playing XII balance, home pitch fit, death bowling, batting firepower &amp; bench depth...</div></div>`;
    const summaryText = baseReports.map(r => {
      const xiNames = r.ev.xi.map(p => `${p.name}(${p.role}${p.os?',OS':''})`).join(', ') || 'None';
      const imp = r.ev.impact ? r.ev.impact.name : 'None';
      return `${r.t.id} (${r.t.home}, Sq:${r.t.squad.length}/25, Purse:${fmtCr(r.t.purse)}): XI=[${xiNames}], Impact=${imp}`;
    }).join('\n');

    const prompt = `You are a brutally honest, world-class IPL Senior Cricket Analyst & Head Selector reviewing all 10 Mega Auction squads.
Squads:
${summaryText}

For EACH of the 10 teams (CSK, MI, RCB, KKR, SRH, RR, DC, PBKS, GT, LSG), give a genuine, honest evaluation:
- "overall", "bat", "bowl", "ar", "bal": realistic ratings out of 10 (e.g. 6.8 to 9.4, spread them honestly based on real player quality & pitch fit!).
- "strength": 1 specific tactical strength naming real players from their XI.
- "weakness": 1 genuine tactical flaw/gap (e.g., lack of death bowling, weak #6, too few spinners for home ground, thin keeper depth).
Return ONLY valid JSON: {"CSK": {"overall": 8.4, "bat": 8.2, "bowl": 8.6, "ar": 8.5, "bal": 8.4, "strength": "...", "weakness": "..."}, ...}`;

    const aiMap = await callGeminiJSON(prompt, 0.7, 6500);
    if (aiMap) {
      baseReports.forEach(r => {
        const g = aiMap[r.t.id];
        if (g && typeof g.overall === 'number') {
          r.ev.overall = +Math.min(9.7, Math.max(4.5, g.overall)).toFixed(1);
          r.ev.bat = +(g.bat || r.ev.bat).toFixed(1);
          r.ev.bowl = +(g.bowl || r.ev.bowl).toFixed(1);
          r.ev.ar = +(g.ar || r.ev.ar).toFixed(1);
          r.ev.bal = +(g.bal || r.ev.bal).toFixed(1);
          if (g.strength) r.ev.strength = g.strength;
          if (g.weakness) r.ev.weakness = g.weakness;
          r.ev.aiReviewed = true;
        }
      });
    }
  }

  baseReports.sort((a,b) => b.ev.overall - a.ev.overall);
  wrap.innerHTML = `
    <div class="panel">
      <div class="sec-title" style="margin-bottom:10px">🧠 Senior Analyst Squad Grades ${baseReports[0]?.ev.aiReviewed ? '(Powered by Gemini AI)' : '(Smart Tactical Engine)'}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:9px">
        ${baseReports.map((r,idx) => `
          <div style="background:rgba(255,255,255,0.04);border:1px solid var(--card-border);border-top:3px solid ${r.t.color};border-radius:12px;padding:11px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <b>#${idx+1} ${r.t.name}</b>
              <span class="tag tag-ovr">${r.ev.overall}/10</span>
            </div>
            <div style="font-size:11px;color:var(--muted);margin:4px 0">XI Avg OVR: ${r.ev.avgOvr} • Squad: ${r.t.squad.length}/25 • Purse: ${fmtCr(r.t.purse)}</div>
            <div class="sub-bars">
              <div class="sub-bar"><span>🏏 Bat</span><b>${r.ev.bat}</b></div>
              <div class="sub-bar"><span>🎯 Bowl</span><b>${r.ev.bowl}</b></div>
              <div class="sub-bar"><span>⚡ AR</span><b>${r.ev.ar}</b></div>
              <div class="sub-bar"><span>⚖️ Bal</span><b>${r.ev.bal}</b></div>
            </div>
            <div style="font-size:11.5px;color:#6ee7b7;margin-top:4px">✓ ${r.ev.strength}</div>
            <div style="font-size:11.5px;color:#fca5a5;margin-top:2px">✕ ${r.ev.weakness}</div>
          </div>
        `).join('')}
      </div>

    </div>`;
}

// ==================== MATCH-BY-MATCH SEASON ENGINE + AUTOMATIC OVERSEAS-AWARE INJURIES ====================
function buildBalancedIPLSchedule(teamIds){
  // Circle-method Round-Robin for 10 teams: 9 rounds x 5 matches = 45 matches
  // Every team plays EXACTLY ONCE per 5-match round!
  const t = shuffleArr(teamIds);
  const rounds = [];
  const rot = t.slice(1);
  for (let r = 0; r < 9; r++) {
    const roundMatches = [];
    const pair0 = r % 2 === 0 ? [t[0], rot[0]] : [rot[0], t[0]];
    roundMatches.push(pair0);
    for (let i = 1; i < 5; i++) {
      const a = rot[i], b = rot[9 - i];
      roundMatches.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(roundMatches);
    rot.unshift(rot.pop());
  }

  // 5 additional balanced rounds (25 matches) = 14 rounds x 5 matches = 70 matches total
  // Uses reverse fixtures from 5 distinct rounds so every team still plays EXACTLY ONCE per round!
  const extraIdx = shuffleArr([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5);
  extraIdx.forEach(ri => {
    rounds.push(rounds[ri].map(([h, a]) => [a, h]));
  });

  // Shuffle round order and order matches inside each round so NO team plays back-to-back across round boundaries
  const shufRounds = shuffleArr(rounds);
  const finalSchedule = [];
  let lastMatchTeams = new Set();

  shufRounds.forEach(rd => {
    const pool = shuffleArr(rd);
    // Pick first match of this round that shares ZERO teams with the last match of previous round
    const safeIdx = pool.findIndex(([a, b]) => !lastMatchTeams.has(a) && !lastMatchTeams.has(b));
    if (safeIdx > 0) {
      const [picked] = pool.splice(safeIdx, 1);
      pool.unshift(picked);
    }
    pool.forEach(m => finalSchedule.push(m));
    const lastM = pool[pool.length - 1];
    lastMatchTeams = new Set(lastM);
  });

  return finalSchedule;
}

function rebalanceRemainingSchedule(){
  const s = state.seasonData;
  if (!s || !Array.isArray(s.schedule) || s.nextIndex >= 70) return;
  const played = s.schedule.slice(0, s.nextIndex);
  const rem = s.schedule.slice(s.nextIndex);
  if (rem.length <= 2) return;

  // Greedy anti-back-to-back & lowest-games-played scheduler for remaining fixtures
  const gamesPlayed = {};
  state.teams.forEach(t => { gamesPlayed[t.id] = s.table[t.id]?.m || 0; });
  const lastSeen = {};
  state.teams.forEach(t => { lastSeen[t.id] = -10; });
  played.forEach(([a, b], idx) => { lastSeen[a] = idx; lastSeen[b] = idx; });

  const reordered = [];
  const pool = [...rem];
  let curIdx = played.length;

  while (pool.length) {
    let bestI = 0, bestScore = -999999;
    for (let i = 0; i < pool.length; i++) {
      const [a, b] = pool[i];
      const gapA = curIdx - lastSeen[a];
      const gapB = curIdx - lastSeen[b];
      const minGap = Math.min(gapA, gapB);
      // Heavy penalty if either team played in the immediately preceding match (gap === 1)
      let score = minGap === 1 ? -10000 : minGap === 2 ? -200 : minGap * 15;
      // Prefer teams with fewer matches played so far so standings stay synchronized
      score -= (gamesPlayed[a] + gamesPlayed[b]) * 18;
      if (score > bestScore) { bestScore = score; bestI = i; }
    }
    const [picked] = pool.splice(bestI, 1);
    reordered.push(picked);
    lastSeen[picked[0]] = curIdx;
    lastSeen[picked[1]] = curIdx;
    gamesPlayed[picked[0]]++;
    gamesPlayed[picked[1]]++;
    curIdx++;
  }

  s.schedule = [...played, ...reordered];
  s.scheduleBalanced = true;
}

function fixCurrentSeasonSchedule(){
  ensureSeasonInitialized();
  rebalanceRemainingSchedule();
  saveState();
  renderSeason();
  renderScheduleDrawer();
  showToast('📅 Remaining schedule rebalanced — zero back-to-back matches!');
}

function openScheduleDrawer(){
  ensureSeasonInitialized();
  const sel = document.getElementById('schedTeamFilter');
  if (sel && sel.options.length <= 1) {
    TEAMS_META.forEach(t => sel.add(new Option(`${t.id} — ${t.name}`, t.id)));
  }
  renderScheduleDrawer();
  document.getElementById('scheduleBackdrop').classList.add('open');
}

function renderScheduleDrawer(){
  const wrap = document.getElementById('scheduleListWrap');
  if (!wrap || !state.seasonData) return;
  const s = state.seasonData;
  const filter = document.getElementById('schedTeamFilter')?.value || 'ALL';
  let html = '';
  s.schedule.forEach(([h, a], idx) => {
    if (filter !== 'ALL' && h !== filter && a !== filter) return;
    const roundNum = Math.floor(idx / 5) + 1;
    const isDone = idx < s.nextIndex;
    const isNext = idx === s.nextIndex;
    const mRes = isDone ? s.matches[idx] : null;
    const hObj = state.teams.find(x => x.id === h);
    const aObj = state.teams.find(x => x.id === a);
    html += `
      <div class="pool-row" ${isDone && mRes ? `onclick="closeDrawers();openMatchScorecard(${mRes.idx})" style="cursor:pointer;opacity:0.85"` : isNext ? 'style="border-color:var(--gold);background:var(--gold-dim)"' : ''}>
        <div class="p-info">
          <div class="p-name">M${idx+1} <small style="color:var(--muted)">(R${roundNum})</small>: <span style="color:${hObj?.color||'var(--text)'}">${h}</span> vs <span style="color:${aObj?.color||'var(--text)'}">${a}</span></div>
          <div class="p-sub">${isDone && mRes ? `✅ ${mRes.winner} won (${mRes.margin})` : isNext ? `🔥 UPCOMING NEXT • 📍 ${hObj?.home.split(' (')[0]}` : `📍 ${hObj?.home.split(' (')[0]}`}</div>
        </div>
        <span class="pill ${isDone?'pill-live':isNext?'pill-warn':''}" style="font-size:9.5px">${isDone?'DONE':isNext?'NEXT':'SCHED'}</span>
      </div>`;
  });
  wrap.innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--muted)">No fixtures found.</div>';
}

function ensureSeasonInitialized(){
  const minSquad = Math.min(...state.teams.map(t => t.squad.length));
  if (minSquad < 11) {
    showToast('Auto-completing squads before starting season...');
    quickSimRestAuction();
  }
  if (state.seasonData && state.seasonData.schedule && !state.seasonData.finished) {
    if (!state.seasonData.scheduleBalanced) {
      rebalanceRemainingSchedule();
      saveState();
    }
    return;
  }

  const ids = state.teams.map(t => t.id);
  const balancedFixtures = buildBalancedIPLSchedule(ids);

  const pStats = {};
  state.players.forEach(p => { pStats[p.id] = { runs:0, wkts:0, catches:0, impact:0 }; });

  const table = {};
  state.teams.forEach(t => {
    const ev = teamCoachEval(t);
    table[t.id] = { id:t.id, name:t.name, color:t.color, m:0, w:0, l:0, pts:0, rf:0, of:0, ra:0, oa:0, nrr:0, str:ev.overall, form:[] };
  });

  state.seasonData = {
    schedule: balancedFixtures,
    scheduleBalanced: true,
    nextIndex: 0, // 0..69 = League, 70 = Q1, 71 = Elim, 72 = Q2, 73 = Final
    pStats,
    table,
    standings: Object.values(table),
    matches: [],
    playoffWinners: {},
    bestCatch: { player:'Ravindra Jadeja', team:'CSK', desc:'Full-stretch diving one-hander at backward point!', score:0 },
    champId: null,
    runnerId: null,
    awards: null,
    finished: false
  };
}

function triggerAutoMatchInjury(teamIds, matchLabel){
  // ~16% chance per match of a realistic match injury with AUTOMATIC replacement from Unsold Pool
  if (Math.random() > 0.16) return null;
  const tid = teamIds[Math.floor(Math.random() * teamIds.length)];
  const t = state.teams.find(x => x.id === tid);
  if (!t || t.squad.length < 12) return null;

  const { xi } = computePlayingXII(t);
  const injPool = xi.length ? xi.filter(p => !p.injured) : t.squad.map(id=>state.players[id]).filter(p=>p&&!p.injured);
  if (!injPool.length) return null;
  const pOut = injPool[Math.floor(Math.random() * injPool.length)];

  const c = teamRoleCounts(t);
  const unsoldPool = state.players.filter(p => p.status === 'UNSOLD' || p.status === 'AVAIL');
  if (!unsoldPool.length) return null;

  // STRICT IPL OVERSEAS INJURY RULE:
  // If an Overseas player is injured -> replace with an Overseas player (or Indian if none left)
  // If an Indian player is injured -> MUST replace with an Indian player (especially when OS slots are 8/8!)
  const allowOS = pOut.os || c.OS < 8;
  const preferOS = pOut.os;

  let rep = unsoldPool
    .filter(u => u.role === pOut.role && (preferOS ? u.os : !u.os))
    .sort((a,b) => b.ovr - a.ovr)[0];
  if (!rep && preferOS) {
    rep = unsoldPool.filter(u => u.os).sort((a,b) => b.ovr - a.ovr)[0];
  }
  if (!rep) {
    rep = unsoldPool.filter(u => !u.os && u.role === pOut.role).sort((a,b) => b.ovr - a.ovr)[0]
       || unsoldPool.find(u => !u.os || allowOS);
  }
  if (!rep) return null;

  const reasons = ['hamstring pull','side strain','bowling finger fracture','ankle sprain','back spasm'];
  const reason = reasons[Math.floor(Math.random() * reasons.length)];

  // Execute automatic swap cleanly (updates customXI too if injured player was in it!)
  t.squad = t.squad.filter(id => id !== pOut.id);
  pOut.injured = true; pOut.status = 'INJURED'; pOut.soldTo = null;
  t.squad.push(rep.id);
  rep.status = 'SOLD'; rep.soldTo = t.id; rep.soldPrice = rep.base;
  if (Array.isArray(t.customXI)) {
    t.customXI = t.customXI.map(id => id === pOut.id ? rep.id : id);
  }
  if (t.customImpact === pOut.id) t.customImpact = rep.id;

  const log = `🚑 ${matchLabel}: ${t.id}'s ${pOut.name} (${pOut.os?'OS':'IND'}) ruled out (${reason}) → Auto-replaced from Unsold Pool by ${rep.name} (${rep.os?'OS':'IND'}, ${roleLabel(rep.role)}, OVR ${rep.ovr}).`;
  state.injuryHistory.unshift(log);
  pushTicker(log);
  return { team:t.id, out:pOut.name, outOS:pOut.os, inName:rep.name, inOS:rep.os, reason };
}

async function runOneSeasonMatch(useGeminiLine=true, tossInfo=null){
  ensureSeasonInitialized();
  const s = state.seasonData;
  if (s.finished) { showToast('Season complete! Reset to play a new auction.'); return null; }

  let t1Id, t2Id, label;
  const idx = s.nextIndex;
  if (idx < 70) {
    [t1Id, t2Id] = s.schedule[idx];
    label = `Match ${idx + 1}`;
  } else if (idx === 70) {
    t1Id = s.standings[0].id; t2Id = s.standings[1].id; label = 'Qualifier 1';
  } else if (idx === 71) {
    t1Id = s.standings[2].id; t2Id = s.standings[3].id; label = 'Eliminator';
  } else if (idx === 72) {
    t1Id = s.playoffWinners.q1L; t2Id = s.playoffWinners.elW; label = 'Qualifier 2';
  } else if (idx === 73) {
    t1Id = s.playoffWinners.q1W; t2Id = s.playoffWinners.q2W; label = 'GRAND FINAL';
  }

  if (tossInfo && tossInfo.batFirstId === t2Id) {
    [t1Id, t2Id] = [t2Id, t1Id];
  }
  const dewBoost = (tossInfo && tossInfo.dew && tossInfo.dew.includes('Heavy')) ? 7 : 0;
  const teamAObj = state.teams.find(x => x.id === t1Id);
  const teamBObj = state.teams.find(x => x.id === t2Id);
  const xiiA = computePlayingXII(teamAObj, teamAObj.home);
  const xiiB = computePlayingXII(teamBObj, teamAObj.home);
  const xiA = [...xiiA.xi];
  const xiB = [...xiiB.xi];
  const impA = xiiA.impact;
  const impB = xiiB.impact;
  const A = s.table[t1Id], B = s.table[t2Id];
  A.str = teamCoachEval(teamAObj).overall;
  B.str = teamCoachEval(teamBObj).overall;

  // PITCH-AWARE MATCH ENGINE (Home ground of Team A dictates par score!)
  const homeVenue = teamAObj.home.toLowerCase();
  let parBase = 165;
  if (homeVenue.includes('chinnaswamy') || homeVenue.includes('uppal') || homeVenue.includes('wankhede')) parBase = 186;
  else if (homeVenue.includes('chepauk') || homeVenue.includes('ekana')) parBase = 148;
  else if (homeVenue.includes('jaipur') || homeVenue.includes('ahmedabad')) parBase = 168;

  ensurePlayerSplitStats(state.players);
  const calcPhaseScore = (batXI, bowlXI, venueL, isChasingDew) => {
    const spinTrack = venueL.includes('chepauk') || venueL.includes('ekana') || venueL.includes('jaipur');
    const flatTrack = venueL.includes('chinnaswamy') || venueL.includes('uppal') || venueL.includes('wankhede');

    // Phase 1: Powerplay (Overs 1-6) — Openers & Top-3 Bat/SR vs PP Pacers
    const top3 = batXI.slice(0, 3);
    const ppBat = top3.reduce((s,p)=>s + ((p.bat||p.ovr)*0.6 + (p.sr||135)*0.25), 0) / Math.max(1, top3.length);
    const ppBowlArr = bowlXI.filter(p => p.phase && (p.phase.includes('PP') || p.phase.includes('Express'))).slice(0,2);
    const ppBowl = (ppBowlArr.length ? ppBowlArr : bowlXI.filter(p=>p.role==='BW').slice(0,2)).reduce((s,p)=>s + (p.bowl||p.ovr), 0) / Math.max(1, ppBowlArr.length || 2);
    const hasLHBTop = top3.some(p => p.batHand === 'L') && top3.some(p => p.batHand === 'R');
    const hasLAFPP = bowlXI.some(p => p.bowlStyle === 'LAF');
    const ppRuns = Math.round(47 + (ppBat - ppBowl) * 0.35 + (hasLHBTop ? 4 : 0) - (hasLAFPP ? 3 : 0) + (flatTrack ? 7 : spinTrack ? -4 : 0) + (Math.random() * 18 - 8));

    // Phase 2: Middle Overs (Overs 7-15) — Anchors/Enforcers vs Spinners
    const midBatArr = batXI.slice(2, 6);
    const midBat = midBatArr.reduce((s,p)=>s + (p.bat||p.ovr), 0) / Math.max(1, midBatArr.length);
    const spinners = bowlXI.filter(p => isSpinner(p));
    const midBowl = spinners.length ? (spinners.reduce((s,p)=>s + (p.bowl||p.ovr), 0) / spinners.length) : 72;
    const spinGripPenalty = spinTrack && spinners.length >= 2 ? -9 : 0;
    const midRuns = Math.round(70 + (midBat - midBowl) * 0.42 + spinGripPenalty + (flatTrack ? 8 : 0) + (Math.random() * 22 - 10));

    // Phase 3: Death Overs (Overs 16-20) — Finishers (SR) vs Death Pace (Econ)
    const finArr = batXI.slice(4, 8);
    const finPower = finArr.reduce((s,p)=>s + ((p.bat||p.ovr)*0.5 + (p.sr||135)*0.32), 0) / Math.max(1, finArr.length);
    const deathB = bowlXI.filter(p => p.phase === 'Death Pace' || (p.role === 'BW' && (p.econ || 8.5) <= 7.8));
    const deathBowl = deathB.length ? (deathB.reduce((s,p)=>s + (p.bowl||p.ovr), 0) / deathB.length) : 73;
    const deathRuns = Math.round(48 + (finPower - deathBowl) * 0.38 + (isChasingDew ? 6 : 0) + (flatTrack ? 6 : spinTrack ? -5 : 0) + (Math.random() * 20 - 9));

    return Math.max(115, ppRuns + midRuns + deathRuns);
  };

  const capTrA = getCaptainTrait(state.players[teamAObj.captainId]);
  const capTrB = getCaptainTrait(state.players[teamBObj.captainId]);
  const capBonusA = capTrA ? (capTrA.key === 'PP' ? 5 : capTrA.key === 'SPIN' ? 4 : 3) : 0;
  const capBonusB = capTrB ? (capTrB.key === 'CHASE' ? 6 : capTrB.key === 'DEATH' ? 5 : 3) : 0;
  const scoreA = calcPhaseScore(xiA, xiB, homeVenue, false) + capBonusA;
  const wktsA = Math.min(10, Math.floor(3 + Math.random() * 6));

  // REAL IMPACT PLAYER SUBSTITUTION FOR INNINGS 2!
  const xiBChase = [...xiB];
  const xiADefend = [...xiA];
  const impactNotes = [];
  if (impB && scoreA >= 170 && (impB.role === 'B' || impB.role === 'WK' || impB.role === 'AR')) {
    const weakIdx = xiBChase.map((p, i) => ({ p, i })).filter(x => x.p.role === 'BW').sort((a,b) => (a.p.bat||30) - (b.p.bat||30))[0]?.i;
    if (weakIdx !== undefined) {
      impactNotes.push(`${B.id} subbed in ⚡${impB.name} for ${xiBChase[weakIdx].name}`);
      xiBChase[weakIdx] = impB;
    }
  }
  if (impA && (impA.role === 'BW' || impA.role === 'AR')) {
    const pureBatIdx = xiADefend.map((p, i) => ({ p, i })).filter(x => x.p.role === 'B').sort((a,b) => (a.p.bowl||20) - (b.p.bowl||20))[0]?.i;
    if (pureBatIdx !== undefined) {
      impactNotes.push(`${A.id} subbed in ⚡${impA.name} for ${xiADefend[pureBatIdx].name}`);
      xiADefend[pureBatIdx] = impA;
    }
  }

  const rawB = calcPhaseScore(xiBChase, xiADefend, homeVenue, dewBoost > 0) + capBonusB;

  // ~6% chance of a dramatic TIED MATCH -> SUPER OVER!
  const isSuperOver = Math.random() < 0.06 || rawB === scoreA;
  let bWins = rawB > scoreA;
  let scoreB = isSuperOver ? scoreA : (bWins ? (scoreA + 1 + Math.floor(Math.random() * 6)) : Math.min(scoreA - 1, rawB));
  const wktsB = isSuperOver ? Math.min(9, Math.floor(5 + Math.random() * 4)) : (bWins ? Math.min(8, Math.floor(2 + Math.random() * 6)) : Math.min(10, Math.floor(5 + Math.random() * 5)));
  const ovB = (isSuperOver || !bWins) ? 20.0 : +(17.1 + Math.random() * 2.5).toFixed(1);

  let superOverData = null;
  if (isSuperOver) {
    const soA = Math.floor(9 + Math.random() * 14);
    let soB = Math.floor(9 + Math.random() * 14);
    if (soB === soA) soB += 2;
    bWins = soB > soA;
    superOverData = { t1:A.id, r1:soA, w1:Math.min(2, Math.floor(Math.random()*2)), t2:B.id, r2:soB, w2:Math.min(2, Math.floor(Math.random()*2)), winner: bWins ? B.id : A.id };
  }

  function buildInnings(batTeamId, batXI, totRuns, wktsLost, oversUsed, bowlTeamId, bowlXI){
    const batters = batXI.filter(p => p.role==='B'||p.role==='WK'||p.role==='AR');
    const useBat = (batters.length >= 6 ? batters : batXI).slice(0, 7);
    const weights = useBat.map((p, i) => {
      const roleW = p.role==='B' ? 1.24 : p.role==='WK' ? 1.18 : 0.86;
      const posW = i < 2 ? 1.25 : i < 4 ? 1.12 : i < 6 ? 0.90 : 0.65;
      return roleW * posW * (0.65 + Math.random() * 0.70) * (p.ovr / 85);
    });
    const wSum = weights.reduce((a,b)=>a+b, 0) || 1;
    const extras = Math.max(4, Math.min(18, Math.round(totRuns * 0.06)));
    const batRunsPool = Math.max(20, totRuns - extras);
    const totalBalls = Math.round(Math.floor(oversUsed) * 6 + Math.round((oversUsed % 1) * 10));
    let ballsLeft = totalBalls;

    const batCard = useBat.map((p, i) => {
      const isLast = i === useBat.length - 1;
      const r = isLast ? Math.max(0, batRunsPool - useBat.slice(0,-1).reduce((acc,_,k)=>acc + Math.round((weights[k]/wSum)*batRunsPool), 0))
                       : Math.round((weights[i] / wSum) * batRunsPool);
      const srTarget = (p.sr || (122 + (p.ovr - 72) * 1.15)) + (Math.random() * 22 - 11);
      const b = isLast ? Math.max(1, ballsLeft) : Math.max(2, Math.min(ballsLeft - (useBat.length - 1 - i) * 2, Math.round((r / Math.max(90, srTarget)) * 100)));
      ballsLeft = Math.max(1, ballsLeft - b);
      const sixes = r >= 12 ? Math.min(Math.floor(r / 18), Math.floor(Math.random() * (Math.floor(r/14) + 2))) : 0;
      const remAfterSix = Math.max(0, r - sixes * 6);
      const fours = remAfterSix >= 8 ? Math.min(Math.floor(remAfterSix / 8), Math.floor(Math.random() * (Math.floor(remAfterSix/7) + 2))) : 0;
      const out = i < wktsLost;
      s.pStats[p.id].runs += r;
      s.pStats[p.id].impact += r * 1.1;
      return { name:p.name, r, b, f4:fours, s6:sixes, sr:((r/Math.max(1,b))*100).toFixed(1), out };
    });

    // Realistic 5-6 bowler rotation totaling exact oversUsed (max 4 overs each)
    const specBowlers = bowlXI.filter(p => p.role==='BW');
    const arBowlers = bowlXI.filter(p => p.role==='AR');
    const orderedBowlers = [...specBowlers, ...arBowlers];
    const useBowl = (orderedBowlers.length >= 5 ? orderedBowlers : bowlXI).slice(0, 6);
    const bowlCard = useBowl.map(b => ({ id:b.id, name:b.name, ov:0, r:0, w:0 }));

    let fullOversTarget = Math.floor(oversUsed);
    const partBall = Math.round((oversUsed - fullOversTarget) * 10);
    // Give top 4 bowlers 4 overs each first if overs allow, remaining to 5th/6th bowler
    for (let i = 0; i < bowlCard.length && fullOversTarget > 0; i++) {
      const capOv = i < 4 ? 4 : 2;
      const take = Math.min(capOv, fullOversTarget);
      bowlCard[i].ov = take;
      fullOversTarget -= take;
    }
    if (partBall > 0 && bowlCard.length > 0) {
      const targetIdx = bowlCard.findIndex(x => x.ov > 0 && x.ov < 4);
      const bIdx = targetIdx !== -1 ? targetIdx : bowlCard.length - 1;
      bowlCard[bIdx].ov = +(bowlCard[bIdx].ov + partBall / 10).toFixed(1);
    }

    const activeBowlers = bowlCard.filter(x => x.ov > 0);
    for (let w = 0; w < wktsLost && activeBowlers.length > 0; w++) {
      // Pick an active bowler who currently has < 4 wickets so wicket figures stay realistic
      const eligible = activeBowlers.filter(x => x.w < 4);
      const pool = eligible.length ? eligible : activeBowlers;
      const b = pool[Math.floor(Math.random() * pool.length)];
      if (b) { b.w += 1; s.pStats[b.id].wkts += 1; s.pStats[b.id].impact += 25; }
      const f = bowlXI[Math.floor(Math.random() * bowlXI.length)];
      if (f && Math.random() < 0.45) {
        s.pStats[f.id].catches += 1; s.pStats[f.id].impact += 8;
        const sc = Math.random() * 100 + (f.ovr * 0.2);
        if (sc > s.bestCatch.score) {
          const spots = ['flying one-handed stunner at long-on','boundary-rope relay juggle at deep mid-wicket','screaming full-dive grab at backward point','running over-the-shoulder catch at third man'];
          s.bestCatch = { player:f.name, team:bowlTeamId, desc:`${spots[Math.floor(Math.random()*spots.length)]} vs ${batTeamId} (${label})`, score:sc };
        }
      }
    }

    // Distribute runs proportionally to overs bowled so every bowler's runs & economy look natural
    let runsRem = Math.max(activeBowlers.length * 4, totRuns - extras);
    const totalOvFloat = activeBowlers.reduce((sum, x) => sum + x.ov, 0) || 1;
    activeBowlers.forEach((bc, i) => {
      if (i === activeBowlers.length - 1) {
        bc.r = Math.max(4, runsRem);
      } else {
        const share = bc.ov / totalOvFloat;
        const jitter = 0.84 + Math.random() * 0.32;
        const rc = Math.max(4, Math.min(runsRem - (activeBowlers.length - 1 - i) * 4, Math.round(totRuns * share * jitter)));
        bc.r = rc;
        runsRem -= rc;
      }
    });
    return { team:batTeamId, score:`${totRuns}/${wktsLost}`, overs:oversUsed.toFixed(1), batCard, bowlCard: activeBowlers };
  }

  const inn1 = buildInnings(A.id, xiA, scoreA, wktsA, 20.0, B.id, xiB);
  const inn2 = buildInnings(B.id, xiBChase, scoreB, wktsB, ovB, A.id, xiADefend);

  const winner = bWins ? B : A;
  const margin = superOverData ? `Super Over (${superOverData.t1} ${superOverData.r1}/${superOverData.w1} vs ${superOverData.t2} ${superOverData.r2}/${superOverData.w2})` : (bWins ? `${10 - wktsB} wickets` : `${scoreA - scoreB} runs`);
  const winBat = [...(bWins ? inn2.batCard : inn1.batCard)].sort((x,y)=>y.r-x.r)[0];
  const winBowl = [...(bWins ? inn1.bowlCard : inn2.bowlCard)].sort((x,y)=>y.w-x.w || x.r-y.r)[0];
  const potm = (winBowl && winBowl.w >= 3) ? `${winBowl.name} (${winBowl.w}/${winBowl.r})` : (winBat ? `${winBat.name} (${winBat.r} off ${winBat.b})` : winner.id);

  // Automatic Injury check (strict OS->OS, IND->IND rule)
  const injury = idx < 73 ? triggerAutoMatchInjury([t1Id, t2Id], label) : null;
  const injNote = injury ? `🚑 Injured: ${injury.out} (${injury.team}, ${injury.reason}) → Replaced by ${injury.inName}` : '✅ No injuries';

  const loserId = bWins ? A.id : B.id;
  const venueS = teamAObj.home.split(' (')[0];
  let oneLiner = buildOfflineMatchOneLiner(winner.id, loserId, venueS, scoreA, margin, potm, injNote, Boolean(superOverData), bWins);
  if (useGeminiLine && getSavedApiKey()) {
    const mPrompt = `IPL ${label}: ${A.id} (${scoreA}/${wktsA}) vs ${B.id} (${scoreB}/${wktsB} in ${ovB} ov) at ${teamAObj.home}.
Winner: ${winner.id} by ${margin}. Top performances: ${winBat?.name} ${winBat?.r}(${winBat?.b}), ${winBowl?.name} ${winBowl?.w}/${winBowl?.r}.
Injury update: ${injNote}.
Write ONE punchy broadcast-style single line (max 28 words) summarizing how ${winner.id} won, naming Player of the Match (${potm}), and noting the injury status (${injury ? `${injury.out} injured, replaced by ${injury.inName}` : 'no injuries'}).
Return ONLY valid JSON: {"line": "..."}`;
    const aiLine = await callGeminiJSON(mPrompt, 0.8);
    if (aiLine && aiLine.line) oneLiner = aiLine.line;
  }

  // Record recent player form (last 3 matches)
  if (!state.playerForm) state.playerForm = {};
  const logForm = (pid, pts) => {
    if (!state.playerForm[pid]) state.playerForm[pid] = [];
    state.playerForm[pid].push(pts);
    if (state.playerForm[pid].length > 3) state.playerForm[pid].shift();
  };
  [...inn1.batCard, ...inn2.batCard].forEach(b => {
    const pObj = state.players.find(x => x.name === b.name);
    if (pObj) logForm(pObj.id, b.r);
  });
  [...inn1.bowlCard, ...inn2.bowlCard].forEach(bw => { logForm(bw.id, bw.w * 24); });

  const mObj = { idx: s.matches.length, label, venue:teamAObj.home.split(' (')[0], t1:A.id, s1:`${scoreA}/${wktsA}`, t2:B.id, s2:`${scoreB}/${wktsB}`, winner:winner.id, margin, potm, injury, superOver:superOverData, impactNotes, oneLiner, inn1, inn2 };
  s.matches.push(mObj);

  if (idx < 70) {
    A.m++; B.m++;
    A.rf += scoreA; A.of += 20; A.ra += scoreB; A.oa += ovB;
    B.rf += scoreB; B.of += ovB; B.ra += scoreA; B.oa += 20;
    if (!A.form) A.form = []; if (!B.form) B.form = [];
    if (winner.id === A.id) { A.w++; A.pts += 2; B.l++; A.form.push('W'); B.form.push('L'); }
    else { B.w++; B.pts += 2; A.l++; B.form.push('W'); A.form.push('L'); }
    if (A.form.length > 5) A.form.shift();
    if (B.form.length > 5) B.form.shift();
    s.standings = Object.values(s.table).map(t => {
      t.nrr = +((t.rf / Math.max(1, t.of)) - (t.ra / Math.max(1, t.oa))).toFixed(3);
      return t;
    }).sort((a,b) => b.pts - a.pts || b.nrr - a.nrr);
  } else if (idx === 70) {
    s.playoffWinners.q1W = winner.id;
    s.playoffWinners.q1L = winner.id === t1Id ? t2Id : t1Id;
  } else if (idx === 71) {
    s.playoffWinners.elW = winner.id;
  } else if (idx === 72) {
    s.playoffWinners.q2W = winner.id;
  } else if (idx === 73) {
    s.champId = winner.id;
    s.runnerId = winner.id === t1Id ? t2Id : t1Id;
    s.finished = true;
    finalizeSeasonAwards();
  }

  s.nextIndex++;
  return mObj;
}

function finalizeSeasonAwards(){
  const s = state.seasonData;
  const allPlayed = state.players.filter(p => p.status === 'SOLD');
  const orange = [...allPlayed].sort((a,b) => s.pStats[b.id].runs - s.pStats[a.id].runs)[0];
  const purple = [...allPlayed].sort((a,b) => s.pStats[b.id].wkts - s.pStats[a.id].wkts)[0];
  const allRounders = allPlayed.filter(p => p.role === 'AR' && s.pStats[p.id].runs >= 100 && s.pStats[p.id].wkts >= 5);
  const brown = [...(allRounders.length ? allRounders : allPlayed.filter(p=>p.role==='AR'))].sort((a,b) =>
    (s.pStats[b.id].runs + s.pStats[b.id].wkts * 26) - (s.pStats[a.id].runs + s.pStats[a.id].wkts * 26)
  )[0] || orange;
  const mvp = [...allPlayed].sort((a,b) => s.pStats[b.id].impact - s.pStats[a.id].impact)[0];

  s.awards = {
    orange: { name:orange.name, team:orange.soldTo, stat:`${s.pStats[orange.id].runs} Runs` },
    purple: { name:purple.name, team:purple.soldTo, stat:`${s.pStats[purple.id].wkts} Wickets` },
    brown:  { name:brown.name, team:brown.soldTo, stat:`${s.pStats[brown.id].runs} Runs & ${s.pStats[brown.id].wkts} Wkts` },
    mvp:    { name:mvp.name, team:mvp.soldTo, stat:`${Math.round(s.pStats[mvp.id].impact)} MVP Pts (${s.pStats[mvp.id].runs}R, ${s.pStats[mvp.id].wkts}W)` }
  };
  sfxGavel();
  fireConfetti(s.table[s.champId]?.color || '#00e5ff');
  setTimeout(()=>sfxCrowdRoar(1.8), 150);
  speakMale(`The IPL Champions are ${s.table[s.champId].name}!`);
  pushTicker(`🏆 IPL CHAMPIONS: ${s.champId}! Orange Cap: ${orange.name} • Purple Cap: ${purple.name} • Brown Cap: ${brown.name}`);
  if (typeof checkInternationalCareerUnlock === 'function' && checkInternationalCareerUnlock()) {
    showToast('🌍🏆 IPL CHAMPION! International Cricket Career Mode UNLOCKED!');
  }
}

let pendingPreMatch = null;

function getUpcomingFixtureInfo(){
  ensureSeasonInitialized();
  const s = state.seasonData;
  if (s.finished) return null;
  let t1Id, t2Id, label;
  const idx = s.nextIndex;
  if (idx < 70) { [t1Id, t2Id] = s.schedule[idx]; label = `Match ${idx + 1}`; }
  else if (idx === 70) { t1Id = s.standings[0].id; t2Id = s.standings[1].id; label = 'Qualifier 1'; }
  else if (idx === 71) { t1Id = s.standings[2].id; t2Id = s.standings[3].id; label = 'Eliminator'; }
  else if (idx === 72) { t1Id = s.playoffWinners.q1L; t2Id = s.playoffWinners.elW; label = 'Qualifier 2'; }
  else { t1Id = s.playoffWinners.q1W; t2Id = s.playoffWinners.q2W; label = 'GRAND FINAL'; }
  const t1 = state.teams.find(x => x.id === t1Id);
  const t2 = state.teams.find(x => x.id === t2Id);
  return { label, t1Id, t2Id, t1, t2, pitch: t1 ? t1.home : 'Balanced IPL Surface' };
}


async function playNextMyTeamMatch(){
  ensureSeasonInitialized();
  const s = state.seasonData;
  if (s.finished) { showToast('Season complete! Tap Start New Season to replay.'); return; }
  const myId = state.humanTeamId;
  if (!myId) { await simulateNextMatch(); return; }

  // Auto-simulate any rival matches until myId's next match (full scorecards saved!)
  let skipped = 0;
  while (!s.finished) {
    const fx = getUpcomingFixtureInfo();
    if (!fx) break;
    if (fx.t1Id === myId || fx.t2Id === myId) {
      if (skipped > 0) {
        renderSeason();
        saveState();
        showToast(`⏩ Simulated ${skipped} rival match${skipped===1?'':'es'} — ${myId} is up next!`);
      }
      await openPreMatchPreview('NORMAL');
      return;
    }
    await runOneSeasonMatch(false);
    skipped++;
  }
  renderSeason();
  saveState();
  showToast(`Season finished! ${myId} did not have any remaining matches.`);
}

async function simulateNextMatch(){
  await openPreMatchPreview('NORMAL');
}

async function openPreMatchPreview(mode='NORMAL'){
  const fx = getUpcomingFixtureInfo();
  if (!fx) { showToast('Season complete! Tap Start New Season to replay.'); return; }
  pendingPreMatch = { ...fx, mode, pitchVerdict: '', tossWinner: fx.t1Id, decision: 'BOWL', batFirstId: fx.t2Id, dew: 'Light Dew' };
  rollPreMatchToss(true);

  document.getElementById('pmTitle').textContent = `${fx.label.toUpperCase()}: ${fx.t1Id} vs ${fx.t2Id}`;
  document.getElementById('pmVenue').textContent = `Pitch: ${fx.pitch}`;
  const isGMPreview = Boolean(state.humanTeamId);
  const myMatchPreview = isGMPreview && (fx.t1Id === state.humanTeamId || fx.t2Id === state.humanTeamId);
  document.getElementById('btnConfirmStartMatch').textContent = mode === 'FINAL_OVER'
    ? 'Confirm XIs & Start Final Over'
    : (!isGMPreview || myMatchPreview)
      ? '🏏 Confirm XIs & Play Live Match'
      : '⚡ Simulate Rival Match (View Scorecard)';
  document.getElementById('preMatchBackdrop').classList.add('open');
  await analysePreMatchLineups(false);
}

async function analysePreMatchLineups(forceGemini=false){
  if (!pendingPreMatch) return;
  const { t1, t2, pitch, label } = pendingPreMatch;
  const repEl = document.getElementById('pmPitchReport');
  const startBtn = document.getElementById('btnConfirmStartMatch');

  if (getSavedApiKey()) {
    if (startBtn) startBtn.disabled = true;
    repEl.innerHTML = `Analysing <b>${pitch}</b> and selecting pitch-suited Playing 12s for <b>${t1.id}</b> &amp; <b>${t2.id}</b>...`;
    renderPreMatchLineups();

    const prompt = `Match Pitch Analyst for ${label}: ${t1.name} (${t1.id}) vs ${t2.name} (${t2.id}) on ${pitch}.
${t1.id} Squad:
${formatSquadForGeminiPrompt(t1)}
${t2.id} Squad:
${formatSquadForGeminiPrompt(t2)}

Pick Playing XI (11 unique IDs in batting order #1-#11) + 1 Impact Sub for BOTH teams:
- Max 4 OS per XI; if 4 OS in XI, Impact Sub MUST be Indian (!os).
- STRICT REAL-WORLD BATTING ORDER: Put Opener(#1-2) at #1-#2, No.3(#3) at #3, Middle(#4) at #4, Finisher(#5-6) at #5-#6, LowerAR(#6-7) at #6-#7, and Bowler(#8-11) at #8-#11.
Return ONLY valid JSON:
{"pitchReport": "1 sentence on pitch", "team1": {"xi": [11 ids], "impact": id, "captainId": id, "note": "1 line"}, "team2": {"xi": [11 ids], "impact": id, "captainId": id, "note": "1 line"}}`;
    const aiRes = await callGeminiJSON(prompt, 0.35, 6500);
    if (aiRes && aiRes.team1 && aiRes.team2) {
      validateAndApplyGeminiXI(t1, aiRes.team1, pitch);
      validateAndApplyGeminiXI(t2, aiRes.team2, pitch);
      pendingPreMatch.pitchVerdict = aiRes.pitchReport || `Pitch-balanced XIs locked for ${pitch}.`;
      repEl.innerHTML = `<b>Pitch Analysis (${pitch.split(' (')[0]}):</b> ${pendingPreMatch.pitchVerdict}`;
    } else {
      const fb1 = computePlayingXII(t1, pitch), fb2 = computePlayingXII(t2, pitch);
      t1.customXI = fb1.xi.map(p=>p.id); t1.customImpact = fb1.impact?.id ?? null;
      t2.customXI = fb2.xi.map(p=>p.id); t2.customImpact = fb2.impact?.id ?? null;
      repEl.innerHTML = `<b>Pitch Analysis (${pitch}):</b> Pitch-suited Playing 12s ready. Review or edit before starting.`;
    }
    if (startBtn) startBtn.disabled = false;
  } else {
    const fb1 = computePlayingXII(t1, pitch), fb2 = computePlayingXII(t2, pitch);
    t1.customXI = fb1.xi.map(p=>p.id); t1.customImpact = fb1.impact?.id ?? null;
    t2.customXI = fb2.xi.map(p=>p.id); t2.customImpact = fb2.impact?.id ?? null;
    repEl.innerHTML = `<b>Pitch Analysis (${pitch}):</b> Pitch-suited Playing 12s ready. Review or edit before starting.`;
  }
  renderPreMatchLineups();
  saveState();
}

function renderPreMatchLineups(){
  if (!pendingPreMatch) return;
  const { t1, t2, pitch } = pendingPreMatch;
  const wrap = document.getElementById('pmLineupsWrap');
  if (!wrap) return;

  const getPlayerFormAvg = (pid) => {
    const h = state.playerForm && state.playerForm[pid] ? state.playerForm[pid] : [];
    return h.length >= 2 ? Math.round(h.reduce((a,b)=>a+b,0) / h.length) : 28;
  };
  const renderCard = (t) => {
    const { xi, impact } = computePlayingXII(t, pitch);
    const osXI = xi.filter(p => p.os).length;
    const xiSet = new Set(xi.map(p => p.id));
    const coldStarters = xi.filter(p => getPlayerFormAvg(p.id) <= 14);
    const hotBench = t.squad.map(id => state.players[id]).filter(p => p && !xiSet.has(p.id) && (osXI < 4 || !p.os)).sort((a,b) => b.ovr - a.ovr)[0];
    const swapAlert = (coldStarters.length && hotBench) ? `
      <div style="margin-bottom:6px;padding:5px 7px;background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.45);border-radius:4px;font-size:10.5px;display:flex;justify-content:space-between;align-items:center;gap:6px">
        <span>❄️ <b>${coldStarters[0].name}</b> is out of form!</span>
        <button class="btn btn-sm btn-gold" style="padding:2px 7px;font-size:9.5px" onclick="quickSwapColdPlayer('${t.id}',${coldStarters[0].id},${hotBench.id})">🔄 Swap ${hotBench.name.split(' ')[0]}</button>
      </div>` : '';
    return `
      <div style="background:var(--input-bg);border:1.5px solid var(--card-border);border-top:4px solid ${t.color};border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="display:inline-flex;align-items:center;gap:5px">${getTeamLogo(t.id, 20)}<b style="color:${t.color}">${t.id} PLAYING 12</b> <small style="color:var(--muted)">(OS ${osXI}/4)</small></span>
          <button class="btn btn-sm" style="padding:3px 7px;font-size:9.5px" onclick="openXIEditor('${t.id}')">✏️ Edit</button>
        </div>
        ${swapAlert}
        ${t.xiNote ? `<div style="font-size:10.5px;color:var(--muted);font-style:italic;margin-bottom:6px">${t.xiNote}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:3px;font-size:11px;font-family:'IBM Plex Mono',monospace">
          ${xi.map((p,i)=>`<div style="display:flex;justify-content:space-between;padding:2px 4px;background:rgba(255,255,255,0.03);border-radius:2px"><span><b>${i+1}.</b> ${p.name}${t.captainId===p.id?' ©':''}${getFormBadge(p.id)}${p.os?' ✈️':''}</span><span style="color:var(--muted)">${p.role}${isSpinner(p)?'•Sp':p.role==='BW'?'•Pc':''}</span></div>`).join('')}
          ${impact ? `<div style="margin-top:4px;padding:4px 6px;background:var(--gold-dim);border:1px solid var(--gold);border-radius:3px;color:var(--gold);font-weight:700">⚡ 12th / Impact: ${impact.name} (${impact.os?'OS':'IND'} • ${impact.role})</div>` : ''}
        </div>
      </div>`;
  };
  wrap.innerHTML = renderCard(t1) + renderCard(t2);
}



function quickSwapColdPlayer(tid, outId, inId){
  const t = state.teams.find(x => x.id === tid);
  if (!t) return;
  const { xi, impact } = computePlayingXII(t, pendingPreMatch?.pitch || t.home);
  const newIds = xi.map(p => p.id === outId ? inId : p.id);
  t.customXI = autoSortBattingOrder(newIds);
  const newImp = sanitizeImpactForXI(t, t.customXI, impact?.id === inId ? outId : impact?.id, pendingPreMatch?.pitch || t.home);
  t.customImpact = newImp ? newImp.id : null;
  t.xiSource = 'MANUAL';
  t.xiNote = `Rotated out-of-form ${state.players[outId]?.name} for fresh ${state.players[inId]?.name}.`;
  sfxPaddle();
  showToast(`🔄 Swapped ${state.players[outId]?.name} → ${state.players[inId]?.name}!`);
  renderPreMatchLineups();
  saveState();
}

function rollPreMatchToss(silent=false){
  if (!pendingPreMatch) return;
  const { t1Id, t2Id } = pendingPreMatch;
  const dewOptions = ['No Dew (Dry Track)', 'Light Dew', 'Heavy Evening Dew'];
  const dew = dewOptions[Math.floor(Math.random() * dewOptions.length)];
  const tossWinner = Math.random() < 0.5 ? t1Id : t2Id;
  const decision = dew.includes('Heavy') ? 'BOWL' : (Math.random() < 0.62 ? 'BOWL' : 'BAT');
  const batFirstId = decision === 'BAT' ? tossWinner : (tossWinner === t1Id ? t2Id : t1Id);
  pendingPreMatch.tossWinner = tossWinner;
  pendingPreMatch.decision = decision;
  pendingPreMatch.batFirstId = batFirstId;
  pendingPreMatch.dew = dew;
  renderPreMatchToss();
  if (!silent) beep(760, 0.07, 'triangle', 0.1);
}

function swapPreMatchBatBowl(){
  if (!pendingPreMatch) return;
  pendingPreMatch.decision = pendingPreMatch.decision === 'BAT' ? 'BOWL' : 'BAT';
  pendingPreMatch.batFirstId = pendingPreMatch.decision === 'BAT'
    ? pendingPreMatch.tossWinner
    : (pendingPreMatch.tossWinner === pendingPreMatch.t1Id ? pendingPreMatch.t2Id : pendingPreMatch.t1Id);
  renderPreMatchToss();
  beep(620, 0.06, 'sine', 0.08);
}

function renderPreMatchToss(){
  const el = document.getElementById('pmTossText');
  if (!el || !pendingPreMatch) return;
  const { tossWinner, decision, batFirstId, dew } = pendingPreMatch;
  el.innerHTML = `🪙 <b>${tossWinner}</b> won toss &amp; chose to <b>${decision}</b> (${batFirstId} bats 1st) • 💧 <b>${dew}</b>`;
}

async function confirmAndStartPreMatch(){
  if (!pendingPreMatch) return;
  const fx = pendingPreMatch;
  const mode = fx.mode;
  const tossInfo = { tossWinner: fx.tossWinner, decision: fx.decision, batFirstId: fx.batFirstId, dew: fx.dew };
  pendingPreMatch = null;
  document.getElementById('preMatchBackdrop').classList.remove('open');

  if (mode === 'FINAL_OVER') {
    launchFinalOverConfirmed();
    return;
  }

  // GM MODE RULE: Play Live Match Simulation ONLY for your own franchise's matches;
  // Other teams' matches auto-simulate instantly so you can view their full scorecard!
  // AUCTIONEER MODE: Play Live Match Simulation for EVERY match (or skip anytime)!
  const isGM = Boolean(state.humanTeamId);
  const involvesMyTeam = isGM && (fx.t1Id === state.humanTeamId || fx.t2Id === state.humanTeamId);

  if (!isGM || involvesMyTeam) {
    startLiveMatchSimulation(fx, tossInfo);
    return;
  }

  const btn = document.getElementById('btnNextMatch');
  if (btn) btn.disabled = true;
  const m = await runOneSeasonMatch(true, tossInfo);
  if (btn) btn.disabled = false;
  if (!m) return;
  showToast(`📋 ${m.t1} vs ${m.t2} simulated (${m.winner} won) — tap Latest Match for full scorecard!`);
  sfxPaddle();
  renderSeason();
  renderSquads();
  saveState();
}

async function simulateBatchMatches(count){
  for (let i = 0; i < count; i++) {
    const useAI = (i === count - 1); // Call Gemini on the final match of the batch for speed + rich summary
    const m = await runOneSeasonMatch(useAI);
    if (!m || state.seasonData.finished) break;
  }
  sfxTrade();
  renderSeason();
  renderSquads();
  saveState();
}

async function simulateRestOfSeason(){
  ensureSeasonInitialized();
  while (!state.seasonData.finished) {
    const isFinal = state.seasonData.nextIndex === 73;
    await runOneSeasonMatch(isFinal);
  }
  renderSeason();
  renderSquads();
  saveState();
}

function renderNextFixturePreview(){
  const box = document.getElementById('nextFixturePreview');
  if (!box) return;
  const s = state.seasonData;
  if (!s) {
    box.innerHTML = `<div class="next-fixture-card"><div style="font-size:12px;color:var(--muted)">Ready to start the 74-match IPL Season. Tap <b>▶ Next Match</b> to kick off Match 1 (with live Gemini broadcast verdict &amp; automatic injury tracking)!</div></div>`;
    return;
  }
  if (s.finished) {
    box.innerHTML = `<div class="next-fixture-card" style="text-align:center"><b style="color:var(--gold)">🏆 SEASON COMPLETE! ${s.champId} LIFTED THE TROPHY!</b></div>`;
    return;
  }
  let t1Id, t2Id, label;
  const idx = s.nextIndex;
  if (idx < 70) { [t1Id, t2Id] = s.schedule[idx]; label = `Match ${idx+1} of 70`; }
  else if (idx === 70) { t1Id = s.standings[0].id; t2Id = s.standings[1].id; label = 'Qualifier 1'; }
  else if (idx === 71) { t1Id = s.standings[2].id; t2Id = s.standings[3].id; label = 'Eliminator'; }
  else if (idx === 72) { t1Id = s.playoffWinners.q1L; t2Id = s.playoffWinners.elW; label = 'Qualifier 2'; }
  else { t1Id = s.playoffWinners.q1W; t2Id = s.playoffWinners.q2W; label = '🏆 GRAND FINAL'; }

  const tA = state.teams.find(x=>x.id===t1Id), tB = state.teams.find(x=>x.id===t2Id);
  if (!tA || !tB) return;
  const strA = teamCoachEval(tA).overall, strB = teamCoachEval(tB).overall;
  const probA = Math.min(78, Math.max(22, Math.round(50 + (strA - strB) * 9)));
  const probB = 100 - probA;

  box.innerHTML = `
    <div class="next-fixture-card">
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:800;color:var(--gold)">
        <span>UPCOMING: ${label.toUpperCase()}</span>
        <span style="color:var(--muted)">📍 ${tA.home}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:14px;font-weight:800">
        <span style="color:${tA.color}">${tA.id} (${probA}%)</span>
        <span style="font-size:11px;color:var(--muted)">PRE-MATCH WIN PROB</span>
        <span style="color:${tB.color}">${tB.id} (${probB}%)</span>
      </div>
      <div class="win-prob-bar">
        <div style="width:${probA}%;background:${tA.color}"></div>
        <div style="width:${probB}%;background:${tB.color}"></div>
      </div>
    </div>`;
}

function renderSeason(){
  renderInjuries();
  renderNextFixturePreview();
  const s = state.seasonData;
  const prog = document.getElementById('seasonProgressPill');
  const banner = document.getElementById('latestMatchBanner');
  const loanWrap = document.getElementById('midSeasonLoanWrap');
  const capsWrap = document.getElementById('liveCapsWrap');
  const brkWrap = document.getElementById('playoffBracketWrap');
  const ptWrap = document.getElementById('pointsTableWrap');
  const mhWrap = document.getElementById('matchHistoryWrap');
  const champWrap = document.getElementById('champAwardsWrap');

  if (!s) {
    const gmWrap = document.getElementById('gmPlayMyMatchWrap');
    const gmBtn = document.getElementById('btnPlayMyNextMatch');
    if (gmWrap && gmBtn) {
      gmWrap.style.display = state.humanTeamId ? 'block' : 'none';
      if (state.humanTeamId) gmBtn.textContent = `🏏 Play Next ${state.humanTeamId} Match (Live T20)`;
    }
    if (prog) prog.textContent = 'READY • 0/74 MATCHES';
    if (banner) banner.innerHTML = '';
    if (loanWrap) loanWrap.innerHTML = '';
    if (brkWrap) brkWrap.innerHTML = '';
    if (mhWrap) mhWrap.innerHTML = `<div class="panel" style="text-align:center;color:var(--muted);font-size:12.5px">No matches completed yet. Tap <b>▶ Next Match</b> in <b>Match Sim</b> to start the season!</div>`;
    if (champWrap) champWrap.innerHTML = '';
    return;
  }

  if (prog) prog.textContent = s.finished ? '🏆 SEASON COMPLETE (74/74)' : `LIVE • ${s.nextIndex}/74 PLAYED`;
  const gmWrap = document.getElementById('gmPlayMyMatchWrap');
  const gmBtn = document.getElementById('btnPlayMyNextMatch');
  if (gmWrap && gmBtn) {
    if (state.humanTeamId && !s.finished) {
      gmWrap.style.display = 'block';
      gmBtn.textContent = `🏏 Play Next ${state.humanTeamId} Match (Live T20)`;
    } else {
      gmWrap.style.display = 'none';
    }
  }
  const repW = document.getElementById('replaySeasonWrap');
  if (repW) repW.style.display = s.finished ? 'block' : 'none';

  // Mid-Season Loan Window (Match 35..69)
  if (loanWrap) {
    if (s.nextIndex >= 35 && s.nextIndex < 70 && !state.midSeasonLoanDone) {
      loanWrap.innerHTML = `
        <div class="panel" style="border-color:#0ea5e9">
          <div class="sec-bar" style="margin-top:0">
            <div class="sec-title" style="color:#0ea5e9">🔁 MID-SEASON LOAN WINDOW OPEN!</div>
            <button class="btn btn-blue btn-sm" onclick="executeMidSeasonLoan()">Execute Bench Loans</button>
          </div>
          <div style="font-size:12px;color:var(--muted)">Halfway mark reached (Match 35+)! Franchises can swap benched players before the playoff race.</div>
        </div>`;
    } else loanWrap.innerHTML = '';
  }

  // Latest Match Banner
  const lastM = s.matches[s.matches.length - 1];
  if (banner && lastM) {
    const winT = state.teams.find(x => x.id === lastM.winner);
    banner.innerHTML = `
      <div class="msg" onclick="openMatchScorecard(${lastM.idx})" style="cursor:pointer;border-left-color:${winT ? winT.color : 'var(--gold)'}">
        <div style="font-size:11px;font-weight:800;color:var(--gold);margin-bottom:3px">⚡ LATEST: ${lastM.label.toUpperCase()} — ${lastM.t1} (${lastM.s1}) vs ${lastM.t2} (${lastM.s2}) • TAP FOR SCORECARD</div>
        <div style="font-size:12.5px">${lastM.oneLiner}</div>
      </div>`;
  }

  // Playoff Bracket
  if (brkWrap) {
    if (s.nextIndex >= 70) {
      const q1 = s.matches.find(m=>m.label==='Qualifier 1');
      const el = s.matches.find(m=>m.label==='Eliminator');
      const q2 = s.matches.find(m=>m.label==='Qualifier 2');
      const gf = s.matches.find(m=>m.label==='GRAND FINAL');
      brkWrap.innerHTML = `
        <div class="panel" style="border-color:var(--gold)">
          <div class="sec-title" style="margin-bottom:6px">🏆 PLAYOFF BRACKET</div>
          <div class="bracket-grid">
            <div class="bracket-box"><b>Qualifier 1</b><br/>${s.standings[0].id} vs ${s.standings[1].id}<br/><span style="color:#10b981">${q1 ? 'Won: '+q1.winner : 'Upcoming'}</span></div>
            <div class="bracket-box"><b>Eliminator</b><br/>${s.standings[2].id} vs ${s.standings[3].id}<br/><span style="color:#10b981">${el ? 'Won: '+el.winner : 'Upcoming'}</span></div>
            <div class="bracket-box"><b>Qualifier 2</b><br/>${s.playoffWinners.q1L||'TBD'} vs ${s.playoffWinners.elW||'TBD'}<br/><span style="color:#10b981">${q2 ? 'Won: '+q2.winner : 'Upcoming'}</span></div>
            <div class="bracket-box final"><b>GRAND FINAL</b><br/>${s.playoffWinners.q1W||'TBD'} vs ${s.playoffWinners.q2W||'TBD'}<br/><b style="color:var(--gold)">${gf ? '🏆 '+gf.winner : 'Upcoming'}</b></div>
          </div>
        </div>`;
    } else brkWrap.innerHTML = '';
  }

  // SUB-SECTION 4: POINTS TABLE
  if (ptWrap) {
    ptWrap.innerHTML = `
      <div class="panel">
        <div class="sec-bar" style="margin-top:0">
          <div class="sec-title">📊 Live IPL Points Table</div>
          <span class="pill pill-live">TOP 4 QUALIFY</span>
        </div>
        <div class="tbl-wrap">
          <table>
            <thead><tr><th>#</th><th>Team</th><th>M</th><th>W</th><th>L</th><th>Pts</th><th>Max</th><th>NRR</th><th>Last 5</th></tr></thead>
            <tbody>
              ${s.standings.map((t,i)=>{
                const rem = Math.max(0, 14 - t.m);
                const maxPts = t.pts + rem * 2;
                const formHtml = (t.form || []).map(f => `<span style="display:inline-block;width:15px;height:15px;line-height:15px;text-align:center;border-radius:2px;font-size:9px;font-weight:800;margin-right:2px;background:${f==='W'?'#10b981':'#e11d48'};color:#fff">${f}</span>`).join('') || '<span style="color:var(--muted)">—</span>';
                return `
                <tr class="${i<4?'qual-row':''}">
                  <td>${i+1}${i<4?' Q':''}</td>
                  <td>${getTeamLogo(t.id, 18)} <b style="color:${t.color}">${t.id}</b></td>
                  <td>${t.m}</td><td>${t.w}</td><td>${t.l}</td>
                  <td><b>${t.pts}</b></td>
                  <td style="color:var(--muted)">${maxPts}</td>
                  <td style="font-family:'JetBrains Mono',monospace">${t.nrr>=0?'+':''}${t.nrr.toFixed(3)}</td>
                  <td>${formHtml}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // MATCH HISTORY LIST (inside Match Sim)
  if (mhWrap && s.matches.length > 0) {
    mhWrap.innerHTML = `
      <div class="panel">
        <div class="sec-title" style="margin-bottom:8px">📋 Completed Matches (${s.matches.length}/74 — Tap Any Match for Full Scorecard)</div>
        <div class="pool-list" style="max-height:66vh">
          ${[...s.matches].reverse().map(m=>`
            <div class="pool-row" onclick="openMatchScorecard(${m.idx})" style="cursor:pointer;${m.label.includes('FINAL')||m.label.includes('Qualifier')||m.label.includes('Eliminator')?'border-color:var(--gold);background:var(--gold-dim)':''}">
              <div class="p-info">
                <div class="p-name">${m.label}: ${m.t1} (${m.s1}) vs ${m.t2} (${m.s2})</div>
                <div class="p-sub">${m.oneLiner}</div>
              </div>
              <span class="pill" style="font-size:10px">VIEW</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  // SUB-SECTION 5: TOP PERFORMERS & GRAND AWARDS
  if (champWrap) {
    if (s.finished && s.awards) {
      const champTeam = state.teams.find(t=>t.id===s.champId);
      champWrap.innerHTML = `
        <div class="panel" style="border-color:var(--gold)">
          <div style="text-align:center;padding:8px 0 14px">
            <span class="pill pill-warn">🏆 IPL GRAND FINAL CHAMPION</span>
            <div style="font-family:'Chakra Petch',sans-serif;font-size:36px;font-weight:700;color:${champTeam.color};margin-top:6px;text-transform:uppercase">
              ${champTeam.name}
            </div>
            <div style="font-size:13px;color:var(--muted)">Defeated ${s.runnerId} in the Grand Final</div>
          </div>
          <div class="sec-title" style="margin-bottom:6px">🎖️ Grand Awards Ceremony</div>
          <div class="awards-grid">
            <div class="award-card orange"><div class="award-title">🧡 Orange Cap (Most Runs)</div><div class="award-winner">${s.awards.orange.name}</div><div class="award-stat">${s.awards.orange.team} • ${s.awards.orange.stat}</div></div>
            <div class="award-card purple"><div class="award-title">💜 Purple Cap (Most Wickets)</div><div class="award-winner">${s.awards.purple.name}</div><div class="award-stat">${s.awards.purple.team} • ${s.awards.purple.stat}</div></div>
            <div class="award-card brown"><div class="award-title">🤎 Brown Cap (All-Rounder)</div><div class="award-winner">${s.awards.brown.name}</div><div class="award-stat">${s.awards.brown.team} • ${s.awards.brown.stat}</div></div>
            <div class="award-card gold"><div class="award-title">👑 Player of the Tournament</div><div class="award-winner">${s.awards.mvp.name}</div><div class="award-stat">${s.awards.mvp.team} • ${s.awards.mvp.stat}</div></div>
            <div class="award-card"><div class="award-title">🧤 Best Catch of the Season</div><div class="award-winner">${s.bestCatch.player} (${s.bestCatch.team})</div><div class="award-stat">${s.bestCatch.desc}</div></div>
          </div>
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-gold btn-sm" onclick="downloadSeasonPosterPNG()">🖼️ Download Champion &amp; Best XI Poster (PNG)</button>
            <button class="btn btn-purple btn-sm" onclick="startNextSeasonMiniAuction()">🔄 Launch Season ${(state.seasonNumber||1)+1} Mini-Auction</button>
          </div>
        </div>`;
    } else champWrap.innerHTML = '';
  }

  if (capsWrap && s.matches.length > 0) {
    const played = state.players.filter(p => p.status === 'SOLD');
    const topRuns = [...played].sort((a,b) => (s.pStats[b.id]?.runs||0) - (s.pStats[a.id]?.runs||0)).slice(0, 10);
    const topWkts = [...played].sort((a,b) => (s.pStats[b.id]?.wkts||0) - (s.pStats[a.id]?.wkts||0)).slice(0, 10);
    const topMvp = [...played].sort((a,b) => (s.pStats[b.id]?.impact||0) - (s.pStats[a.id]?.impact||0)).slice(0, 5);
    const topSteals = [...played].filter(p => (s.pStats[p.id]?.impact||0) > 40).sort((a,b) =>
      ((s.pStats[b.id]?.impact||0) / Math.max(30, b.soldPrice)) - ((s.pStats[a.id]?.impact||0) / Math.max(30, a.soldPrice))
    ).slice(0, 5);

    capsWrap.innerHTML = `
      <div class="panel">
        <div class="sec-title" style="margin-bottom:8px">🔥 Top Performers &amp; Season Leaderboards</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">
          <div style="background:var(--input-bg);border:1px solid rgba(249,115,22,0.45);border-radius:12px;padding:10px">
            <div style="font-size:11px;font-weight:800;color:#f97316;margin-bottom:6px">🧡 ORANGE CAP (TOP 10 RUNS)</div>
            ${topRuns.map((p,i)=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--card-border)"><span>${i+1}. ${p.name}${getFormBadge(p.id)} <small style="color:var(--muted)">(${p.soldTo})</small></span><b>${s.pStats[p.id]?.runs||0}</b></div>`).join('')}
          </div>
          <div style="background:var(--input-bg);border:1px solid rgba(168,85,247,0.45);border-radius:12px;padding:10px">
            <div style="font-size:11px;font-weight:800;color:#a855f7;margin-bottom:6px">💜 PURPLE CAP (TOP 10 WICKETS)</div>
            ${topWkts.map((p,i)=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--card-border)"><span>${i+1}. ${p.name}${getFormBadge(p.id)} <small style="color:var(--muted)">(${p.soldTo})</small></span><b>${s.pStats[p.id]?.wkts||0}</b></div>`).join('')}
          </div>
          <div style="background:var(--input-bg);border:1px solid var(--gold);border-radius:12px;padding:10px">
            <div style="font-size:11px;font-weight:800;color:var(--gold);margin-bottom:6px">👑 MVP IMPACT LEADERS</div>
            ${topMvp.map((p,i)=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--card-border)"><span>${i+1}. ${p.name} <small style="color:var(--muted)">(${p.soldTo})</small></span><b>${Math.round(s.pStats[p.id]?.impact||0)} pts</b></div>`).join('')}
          </div>
          <div style="background:var(--input-bg);border:1px solid rgba(16,185,129,0.45);border-radius:12px;padding:10px">
            <div style="font-size:11px;font-weight:800;color:#10b981;margin-bottom:6px">💎 BEST VALUE STEALS (PTS / ₹)</div>
            ${topSteals.map((p,i)=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--card-border)"><span>${i+1}. ${p.name} <small style="color:var(--muted)">(${fmtCr(p.soldPrice)})</small></span><b>${Math.round(s.pStats[p.id]?.impact||0)} pts</b></div>`).join('')}
          </div>
        </div>
      </div>`;
  }
}


// ==================== 14. TEAM VS TEAM COMPARISON (WEBPAGE OR EXTERNAL MANUAL AUCTION XIs) ====================
function toggleTeamCompareInputs(){
  const a = document.getElementById('tcSourceA').value;
  const b = document.getElementById('tcSourceB').value;
  document.getElementById('tcManualBoxA').style.display = a === 'MANUAL_A' ? 'block' : 'none';
  document.getElementById('tcManualBoxB').style.display = b === 'MANUAL_B' ? 'block' : 'none';
}

function getCompareTeamPayload(side){
  const src = document.getElementById('tcSource' + side).value;
  if (src === 'MANUAL_' + side) {
    const customName = (document.getElementById('tcName' + side).value || '').trim() || `Custom Team ${side}`;
    const raw = (document.getElementById('tcList' + side).value || '').trim();
    const names = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (names.length < 5) return { error: `Please enter at least 5–11 player names for ${customName}.` };
    // Match against 520-player DB to estimate OVR if known
    let sumOvr = 0, matched = 0;
    names.forEach(n => {
      const nl = n.toLowerCase();
      const found = state.players.find(p => p.name.toLowerCase() === nl || p.name.toLowerCase().includes(nl));
      if (found) { sumOvr += found.ovr; matched++; } else { sumOvr += 76; }
    });
    const avgOvr = Math.round(sumOvr / names.length);
    return {
      name: customName,
      color: side === 'A' ? '#00e5ff' : '#ff6b35',
      xiText: names.join(', '),
      estRating: +Math.min(9.5, Math.max(5.5, 4.5 + ((avgOvr - 66) / 28) * 5.0)).toFixed(1),
      source: 'Custom External XI'
    };
  } else {
    const t = state.teams.find(x => x.id === src);
    if (!t || t.squad.length < 5) return { error: `${src} needs players signed in this auction first!` };
    const { xi, impact } = computePlayingXII(t);
    const ev = teamCoachEval(t);
    const listStr = xi.map(p => `${p.name}(${p.role})`).join(', ') + (impact ? ` | Impact: ${impact.name}` : '');
    return {
      name: `${t.id} — ${t.name}`,
      color: t.color,
      xiText: listStr,
      estRating: ev.overall,
      source: `Webpage Auction Squad (${t.home.split(' (')[0]})`
    };
  }
}

async function runTeamComparison(){
  const wrap = document.getElementById('teamCompareResultWrap');
  const tA = getCompareTeamPayload('A');
  const tB = getCompareTeamPayload('B');
  if (tA.error) { showToast(tA.error); return; }
  if (tB.error) { showToast(tB.error); return; }
  const venue = document.getElementById('tcVenue').value;

  let probA = Math.min(78, Math.max(22, Math.round(50 + (tA.estRating - tB.estRating) * 11)));
  let probB = 100 - probA;
  const offCmp = (typeof buildOfflineTeamComparison === 'function')
    ? buildOfflineTeamComparison(tA, tB, venue, probA)
    : {
        ratingsA: { bat: tA.estRating, bowl: tA.estRating, depth: tA.estRating },
        ratingsB: { bat: tB.estRating, bowl: tB.estRating, depth: tB.estRating },
        winner: probA >= probB ? tA.name : tB.name,
        keyBattle: 'Top-order powerplay batters vs new-ball pace attack',
        verdict: `Based on squad balance and phase coverage, ${probA >= probB ? tA.name : tB.name} holds the edge on ${venue}.`
      };
  let ratingsA = offCmp.ratingsA;
  let ratingsB = offCmp.ratingsB;
  let winner = offCmp.winner;
  let verdict = offCmp.verdict;
  let keyBattle = offCmp.keyBattle;
  let aiPowered = false;

  if (getSavedApiKey()) {
    wrap.innerHTML = `<div class="panel"><div class="sec-title">🤖 Gemini Senior Analyst comparing ${tA.name} vs ${tB.name}...</div><div style="font-size:12px;color:var(--muted);margin-top:5px">Analysing batting firepower, death bowling, spin options, fielding &amp; matchups on ${venue}...</div></div>`;
    const prompt = `You are a brutally honest IPL Senior Cricket Analyst comparing two Playing XIs head-to-head on: ${venue}.
Team A: ${tA.name} (${tA.source})
XI: ${tA.xiText}

Team B: ${tB.name} (${tB.source})
XI: ${tB.xiText}

Give an honest, data-grounded head-to-head verdict:
- "probA": integer 20..80 (Team A win probability %; Team B is 100 - probA).
- "a": {"bat": 1..10, "bowl": 1..10, "depth": 1..10, "edge": "1 short strength"}
- "b": {"bat": 1..10, "bowl": 1..10, "depth": 1..10, "edge": "1 short strength"}
- "winner": name of the stronger team on this pitch.
- "keyBattle": 1 exciting player-vs-player matchup between these two XIs.
- "verdict": 2 sharp sentences explaining WHY the winner beats the other team (and any weakness in the losing XI).
Return ONLY valid JSON: {"probA": 58, "a": {"bat": 8.8, "bowl": 8.2, "depth": 8.5, "edge": "..."}, "b": {"bat": 8.1, "bowl": 8.4, "depth": 8.0, "edge": "..."}, "winner": "...", "keyBattle": "...", "verdict": "..."}`;

    const aiRes = await callGeminiJSON(prompt, 0.7);
    if (aiRes && typeof aiRes.probA === 'number') {
      probA = Math.min(82, Math.max(18, Math.round(aiRes.probA)));
      probB = 100 - probA;
      if (aiRes.a) ratingsA = aiRes.a;
      if (aiRes.b) ratingsB = aiRes.b;
      if (aiRes.winner) winner = aiRes.winner;
      if (aiRes.verdict) verdict = aiRes.verdict;
      if (aiRes.keyBattle) keyBattle = aiRes.keyBattle;
      aiPowered = true;
    }
  }

  sfxTrade();
  wrap.innerHTML = `
    <div class="panel" style="border-color:var(--gold)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="sec-title">⚔️ HEAD-TO-HEAD VERDICT ${aiPowered ? '(GEMINI AI)' : '(SMART ENGINE)'}</div>
        <span class="pill pill-live">🏆 EDGE: ${winner}</span>
      </div>

      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:800">
        <span style="color:${tA.color}">${tA.name} (${probA}%)</span>
        <span style="color:${tB.color}">${tB.name} (${probB}%)</span>
      </div>
      <div class="win-prob-bar" style="height:10px;margin:6px 0 12px">
        <div style="width:${probA}%;background:${tA.color}"></div>
        <div style="width:${probB}%;background:${tB.color}"></div>
      </div>

      <div class="compare-grid" style="margin-bottom:10px">
        <div class="cmp-card" style="border-top:3px solid ${tA.color}">
          <b style="color:${tA.color}">${tA.name}</b>
          <div class="cmp-row"><span>🏏 Batting</span><b>${ratingsA.bat}/10</b></div>
          <div class="cmp-row"><span>🎯 Bowling</span><b>${ratingsA.bowl}/10</b></div>
          <div class="cmp-row"><span>⚡ Depth</span><b>${ratingsA.depth}/10</b></div>
          ${ratingsA.edge ? `<div style="font-size:11.5px;color:#10b981;margin-top:5px">✓ ${ratingsA.edge}</div>` : ''}
        </div>
        <div class="cmp-card" style="border-top:3px solid ${tB.color}">
          <b style="color:${tB.color}">${tB.name}</b>
          <div class="cmp-row"><span>🏏 Batting</span><b>${ratingsB.bat}/10</b></div>
          <div class="cmp-row"><span>🎯 Bowling</span><b>${ratingsB.bowl}/10</b></div>
          <div class="cmp-row"><span>⚡ Depth</span><b>${ratingsB.depth}/10</b></div>
          ${ratingsB.edge ? `<div style="font-size:11.5px;color:#10b981;margin-top:5px">✓ ${ratingsB.edge}</div>` : ''}
        </div>
      </div>

      <div class="msg" style="margin-bottom:6px"><b>🔥 Key Matchup:</b> ${keyBattle}</div>
      <div class="msg" style="border-left-color:#10b981"><b>🧠 Analyst Verdict:</b> ${verdict}</div>
    </div>`;
}



// ==================== V32 UPGRADE 3: LIVE BALL-BY-BALL FINAL OVER THRILLER ====================
let foState = null;
let foAutoTimer = null;

function stopFinalOverAuto(){
  if (foAutoTimer) { clearInterval(foAutoTimer); foAutoTimer = null; }
}

function openFinalOverSim(){ openPreMatchPreview('FINAL_OVER'); }
function launchFinalOverConfirmed(){
  ensureSeasonInitialized();
  const s = state.seasonData;
  if (s.finished) { showToast('Season complete! Tap Replay New Season to play again.'); return; }

  let t1Id, t2Id, label;
  const idx = s.nextIndex;
  if (idx < 70) { [t1Id, t2Id] = s.schedule[idx]; label = `Match ${idx + 1}`; }
  else if (idx === 70) { t1Id = s.standings[0].id; t2Id = s.standings[1].id; label = 'Qualifier 1'; }
  else if (idx === 71) { t1Id = s.standings[2].id; t2Id = s.standings[3].id; label = 'Eliminator'; }
  else if (idx === 72) { t1Id = s.playoffWinners.q1L; t2Id = s.playoffWinners.elW; label = 'Qualifier 2'; }
  else { t1Id = s.playoffWinners.q1W; t2Id = s.playoffWinners.q2W; label = 'GRAND FINAL'; }

  const teamA = state.teams.find(x => x.id === t1Id);
  const teamB = state.teams.find(x => x.id === t2Id);
  const xiA = computePlayingXII(teamA).xi;
  const xiB = computePlayingXII(teamB).xi;

  const target = Math.round(168 + Math.random() * 38);
  const wktsA = Math.min(9, Math.floor(4 + Math.random() * 5));
  const needToWin = Math.floor(8 + Math.random() * 14); // 8 to 21 runs needed off final 6 balls!
  const bScore19 = target - needToWin;
  const bWkts = Math.min(7, Math.floor(3 + Math.random() * 4));

  const battersB = xiB.filter(p => p.role === 'B' || p.role === 'WK' || p.role === 'AR');
  const bowlersA = xiA.filter(p => p.role === 'BW' || p.role === 'AR');
  const striker = battersB[Math.min(battersB.length - 1, 3)] || xiB[0];
  const partner = battersB[Math.min(battersB.length - 1, 4)] || xiB[1] || striker;
  const bowler = bowlersA[0] || xiA[xiA.length - 1];

  foState = {
    label, t1Id, t2Id, teamA, teamB, xiA, xiB,
    scoreA: target - 1, wktsA, target,
    scoreB: bScore19, wktsB: bWkts,
    ball: 0, outcomes: [], finished: false,
    striker, partner, bowler, strikerRuns: 28, bowlerWkts: 1
  };

  document.getElementById('foTitle').textContent = `🎬 ${label.toUpperCase()} — FINAL OVER LIVE`;
  document.getElementById('foSub').textContent = `📍 ${teamA.home} • ${t2Id} chasing ${target}`;
  document.getElementById('foCommentary').innerHTML = `<div class="msg">🎙️ <b>19.0 Overs Done!</b> ${bowler.name} has the ball for ${t1Id}. ${striker.name} is on strike for ${t2Id} — <b>${needToWin} needed off 6 balls!</b></div>`;
  document.getElementById('btnBowlNextBall').disabled = false;
  document.getElementById('btnAutoFinalOver').disabled = false;
  renderFinalOverUI();
  document.getElementById('finalOverBackdrop').classList.add('open');
}

function renderFinalOverUI(){
  if (!foState) return;
  const f = foState;
  const need = Math.max(0, f.target - f.scoreB);
  const left = 6 - f.ball;
  document.getElementById('foScoreLine').textContent = `${f.t1Id} ${f.scoreA}/${f.wktsA} (20.0)  vs  ${f.t2Id} ${f.scoreB}/${f.wktsB} (19.${f.ball})`;
  if (!f.finished) {
    document.getElementById('foEquation').textContent = `${f.t2Id} NEED ${need} RUNS OFF ${left} BALL${left === 1 ? '' : 'S'}`;
  }
  document.getElementById('foMatchup').textContent = `🏏 ${f.striker.name} (${f.strikerRuns}*)  vs  🎯 ${f.bowler.name}`;

  const row = document.getElementById('foBallsRow');
  row.innerHTML = Array.from({ length: 6 }, (_, i) => {
    const out = f.outcomes[i];
    if (!out) return `<div class="ball-pill">${i + 1}</div>`;
    const cls = out === '6' ? 'b-6' : out === '4' ? 'b-4' : out === 'W' ? 'b-w' : out === '0' ? 'b-0' : 'b-r';
    return `<div class="ball-pill ${cls}">${out}</div>`;
  }).join('');
}

function bowlFinalOverBall(){
  if (!foState || foState.finished) return;
  const f = foState;
  f.ball++;

  const batSkill = (f.striker.ovr || 80) - (f.bowler.ovr || 80);
  const roll = Math.random() * 100 + batSkill * 0.45;
  let code = '1', runs = 1, text = '';

  if (roll < 15) {
    code = 'W'; runs = 0; f.wktsB++; f.bowlerWkts++;
    text = `💥 <b>OUT!</b> ${f.bowler.name} nails a searing yorker — ${f.striker.name} is cleaned up! Huge roar from the ${f.t1Id} dugout!`;
    const nextBat = f.xiB[Math.min(f.xiB.length - 1, f.wktsB + 1)] || f.partner;
    f.striker = nextBat; f.strikerRuns = 0;
    sfxUnsold();
  } else if (roll < 33) {
    code = '0'; runs = 0;
    text = `• <b>DOT BALL!</b> Slower bouncer from ${f.bowler.name}, ${f.striker.name} swings and misses! Pressure mounts!`;
    beep(320, 0.08, 'sine', 0.09);
  } else if (roll < 56) {
    code = '1'; runs = 1; f.strikerRuns += 1;
    text = `1️⃣ Dug out to long-on for a sharp single. Strike rotates.`;
    [f.striker, f.partner] = [f.partner, f.striker];
    beep(540, 0.06, 'triangle', 0.08);
  } else if (roll < 71) {
    code = '2'; runs = 2; f.strikerRuns += 2;
    text = `2️⃣ Whipped into the deep mid-wicket gap — hard-run TWO!`;
    beep(620, 0.08, 'triangle', 0.10);
  } else if (roll < 86) {
    code = '4'; runs = 4; f.strikerRuns += 4;
    text = `🔥 <b>FOUR!</b> ${f.striker.name} slices it past backward point — races away to the rope!`;
    sfxPaddle();
  } else {
    code = '6'; runs = 6; f.strikerRuns += 6;
    text = `🚀 <b>MASSIVE SIX!</b> ${f.striker.name} launches ${f.bowler.name} 96 metres into the second tier!`;
    sfxHijack();
  }

  f.scoreB += runs;
  f.outcomes.push(code);

  const feed = document.getElementById('foCommentary');
  feed.innerHTML += `<div class="msg"><b>19.${f.ball}:</b> ${text}</div>`;
  feed.scrollTop = feed.scrollHeight;

  // Check if match decided!
  if (f.scoreB >= f.target || f.ball >= 6 || f.wktsB >= 10) {
    f.finished = true;
    stopFinalOverAuto();
    document.getElementById('btnBowlNextBall').disabled = true;
    document.getElementById('btnAutoFinalOver').disabled = true;

    let winnerId, margin;
    if (f.scoreB >= f.target) {
      winnerId = f.t2Id;
      margin = `${10 - f.wktsB} wickets (with ${6 - f.ball} ball${6 - f.ball === 1 ? '' : 's'} left)`;
    } else if (f.scoreB === f.scoreA) {
      // Instant Super Over decider
      const soWin = Math.random() < 0.5 ? f.t2Id : f.t1Id;
      winnerId = soWin;
      margin = `Super Over Thriller!`;
    } else {
      winnerId = f.t1Id;
      margin = `${f.scoreA - f.scoreB} runs`;
    }

    document.getElementById('foEquation').textContent = `🏆 ${winnerId} WON BY ${margin.toUpperCase()}!`;
    feed.innerHTML += `<div class="msg" style="border-left-color:#10b981">🏆 <b>FULL TIME:</b> <b>${winnerId}</b> clinch a nail-biting ${f.label} by <b>${margin}</b>!</div>`;
    feed.scrollTop = feed.scrollHeight;
    sfxCrowdRoar(1.5);
    fireConfetti(state.teams.find(x => x.id === winnerId)?.color || '#facc15');
    commitFinalOverToSeason(winnerId, margin);
  }
  renderFinalOverUI();
}

function autoPlayFinalOver(){
  if (!foState || foState.finished) return;
  stopFinalOverAuto();
  foAutoTimer = setInterval(() => {
    if (!foState || foState.finished) { stopFinalOverAuto(); return; }
    bowlFinalOverBall();
  }, 1050);
}

function commitFinalOverToSeason(winnerId, margin){
  const s = state.seasonData;
  const f = foState;
  const A = s.table[f.t1Id], B = s.table[f.t2Id];
  const ovB = +(19 + f.ball / 10).toFixed(1);
  const idx = s.nextIndex;
  const oneLiner = `🎬 FINAL OVER THRILLER: ${winnerId} beat ${winnerId === f.t1Id ? f.t2Id : f.t1Id} by ${margin} (Over: ${f.outcomes.join(' ')}).`;

  const makeQuickCard = (teamId, xi, totRuns, wktsLost, oversStr, oppXI, starBat, starBatR, starBowl, starBowlW) => {
    const bats = xi.slice(0, 7);
    let remR = Math.max(20, totRuns - 10);
    const batCard = bats.map((p, i) => {
      const r = (starBat && p.id === starBat.id) ? starBatR : (i === bats.length - 1 ? Math.max(0, remR) : Math.min(remR, Math.round((totRuns / 6.5) * (0.6 + Math.random() * 0.7))));
      remR = Math.max(0, remR - r);
      const b = Math.max(1, Math.round((r / Math.max(100, p.sr || 135)) * 100));
      return { name: p.name, r, b, f4: Math.floor(r / 12), s6: Math.floor(r / 22), sr: ((r / b) * 100).toFixed(1), out: i < wktsLost };
    });
    const bowls = oppXI.filter(p => p.role === 'BW' || p.role === 'AR').slice(0, 5);
    let remW = wktsLost;
    const bowlCard = (bowls.length ? bowls : oppXI.slice(-5)).map((p, i) => {
      const w = (starBowl && p.id === starBowl.id) ? starBowlW : (i === 0 ? Math.min(remW, 2) : Math.min(remW, Math.floor(Math.random() * 2)));
      remW = Math.max(0, remW - w);
      return { id: p.id, name: p.name, ov: 4, r: Math.round(totRuns / 5 + (Math.random() * 10 - 5)), w };
    });
    return { team: teamId, score: `${totRuns}/${wktsLost}`, overs: oversStr, batCard, bowlCard };
  };
  const foInn1 = makeQuickCard(f.t1Id, f.xiA, f.scoreA, f.wktsA, '20.0', f.xiB, null, 0, null, 0);
  const foInn2 = makeQuickCard(f.t2Id, f.xiB, f.scoreB, f.wktsB, ovB.toFixed(1), f.xiA, f.striker, f.strikerRuns, f.bowler, f.bowlerWkts);

  const mObj = {
    idx: s.matches.length, label: f.label, venue: f.teamA.home.split(' (')[0],
    t1: f.t1Id, s1: `${f.scoreA}/${f.wktsA}`, t2: f.t2Id, s2: `${f.scoreB}/${f.wktsB}`,
    winner: winnerId, margin, potm: winnerId === f.t2Id ? `${f.striker.name} (${f.strikerRuns}*)` : `${f.bowler.name} (${f.bowlerWkts}w)`,
    injury: null, superOver: null, impactNotes: [], oneLiner, inn1: foInn1, inn2: foInn2
  };
  s.matches.push(mObj);
  if (s.pStats[f.striker.id]) { s.pStats[f.striker.id].runs += f.strikerRuns; s.pStats[f.striker.id].impact += f.strikerRuns * 1.3; }
  if (s.pStats[f.bowler.id]) { s.pStats[f.bowler.id].wkts += f.bowlerWkts; s.pStats[f.bowler.id].impact += f.bowlerWkts * 26; }

  if (idx < 70) {
    A.m++; B.m++;
    A.rf += f.scoreA; A.of += 20; A.ra += f.scoreB; A.oa += ovB;
    B.rf += f.scoreB; B.of += ovB; B.ra += f.scoreA; B.oa += 20;
    if (winnerId === A.id) { A.w++; A.pts += 2; B.l++; } else { B.w++; B.pts += 2; A.l++; }
    s.standings = Object.values(s.table).map(t => {
      t.nrr = +((t.rf / Math.max(1, t.of)) - (t.ra / Math.max(1, t.oa))).toFixed(3);
      return t;
    }).sort((a,b) => b.pts - a.pts || b.nrr - a.nrr);
  } else if (idx === 70) { s.playoffWinners.q1W = winnerId; s.playoffWinners.q1L = winnerId === f.t1Id ? f.t2Id : f.t1Id; }
  else if (idx === 71) { s.playoffWinners.elW = winnerId; }
  else if (idx === 72) { s.playoffWinners.q2W = winnerId; }
  else if (idx === 73) { s.champId = winnerId; s.runnerId = winnerId === f.t1Id ? f.t2Id : f.t1Id; s.finished = true; finalizeSeasonAwards(); }

  s.nextIndex++;
  renderSeason();
  saveState();
}

// ==================== V32 UPGRADE 4: DOWNLOADABLE BEST XI & AUCTION GRADE PNG CARD ====================
function downloadSquadPNG(){
  const t = state.teams.find(x => x.id === selectedSquadTab);
  if (!t || !t.squad.length) { showToast('No players signed for this team yet!'); return; }
  const { xi, impact } = computePlayingXII(t);
  const ev = teamCoachEval(t);

  const W = 1080, H = 1350;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');

  // Deep Broadcast Studio Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#070d1c');
  bg.addColorStop(1, '#04070f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Team Colour Spotlight Glow at Top
  const glow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 560);
  glow.addColorStop(0, t.color + '55');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 620);

  // Outer Broadcast Border
  ctx.strokeStyle = t.color;
  ctx.lineWidth = 6;
  ctx.strokeRect(28, 28, W - 56, H - 56);

  // Top Header Badge
  ctx.fillStyle = t.color;
  ctx.fillRect(60, 62, 340, 44);
  ctx.fillStyle = '#060a14';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('IPL MEGA AUCTION • XI CARD', 78, 92);

  // Grade Box Top Right
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.fillRect(W - 260, 56, 200, 95);
  ctx.strokeRect(W - 260, 56, 200, 95);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('DRAFT GRADE', W - 224, 86);
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(`${ev.overall}/10`, W - 224, 134);

  // Team Name & Subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic bold 54px sans-serif';
  ctx.fillText(t.name.toUpperCase(), 60, 178);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 22px monospace';
  ctx.fillText(`${t.home.split(' (')[0]}  •  PURSE LEFT: ${fmtCr(t.purse)}  •  SQUAD: ${t.squad.length}/25`, 60, 218);

  // Divider Line
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 246); ctx.lineTo(W - 60, 246); ctx.stroke();

  // Playing XI Rows
  let y = 278;
  xi.forEach((p, i) => {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30, 41, 59, 0.72)' : 'rgba(15, 23, 42, 0.72)';
    ctx.fillRect(60, y, W - 120, 70);
    ctx.fillStyle = t.color;
    ctx.fillRect(60, y, 8, 70);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 26px monospace';
    ctx.fillText(String(i + 1).padStart(2, '0'), 86, y + 44);

    const capTag = t.captainId === p.id ? ' (C)' : t.vcId === p.id ? ' (VC)' : '';
    const osTag = p.os ? ' [OS]' : '';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${p.name}${capTag}${osTag}`, 145, y + 44);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(roleLabel(p.role).toUpperCase(), W - 400, y + 43);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(fmtCr(p.soldPrice || p.base), W - 210, y + 44);
    y += 78;
  });

  // Impact Sub Banner
  if (impact) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.fillRect(60, y + 12, W - 120, 74);
    ctx.strokeRect(60, y + 12, W - 120, 74);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('⚡ IMPACT SUB:', 84, y + 57);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${impact.name} (${roleLabel(impact.role)})`, 290, y + 57);
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '600 18px monospace';
  ctx.fillText('THE GAVEL HOUSE — LIVE BROADCAST TV STUDIO HUD', 60, H - 56);

  const a = document.createElement('a');
  a.href = cvs.toDataURL('image/png');
  a.download = `${t.id}_Playing_XII_Draft_Card.png`;
  a.click();
  sfxTrade();
  showToast(`🖼️ Downloaded ${t.id} Playing XII PNG Card!`);
}

// Safe Boot with error guard



// ============================================================================
// V44: FULL LIVE BALL-BY-BALL & OVER-BY-OVER MATCH SIMULATION ENGINE
// ============================================================================
let lmState = null;
let lmAutoTimer = null;
let lmSpeedLevel = 1; // 1 = 1x (650ms), 2 = 2x (300ms), 3 = 5x (95ms)

function lmStopAuto(){
  if (lmAutoTimer) { clearInterval(lmAutoTimer); lmAutoTimer = null; }
  const b = document.getElementById('btnLmAuto');
  if (b) { b.textContent = '▶ Auto-Play'; b.className = 'btn btn-green'; }
}

function closeLiveMatchModal(){
  lmStopAuto();
  if (lmState && !lmState.finished) {
    if (!confirm('Finish & commit this match to the season before closing? (Cancel to keep watching)')) return;
    lmSkipToEnd();
  }
  document.getElementById('liveMatchBackdrop')?.classList.remove('open');
}

function buildLiveBowlingRotation(bowlXI){
  const spec = bowlXI.filter(p => p.role === 'BW');
  const ars = bowlXI.filter(p => p.role === 'AR');
  const pool = [...spec, ...ars];
  const finalPool = (pool.length >= 5 ? pool : bowlXI).slice(0, 6);
  return finalPool.map(p => ({
    id: p.id, name: p.name, ov: 0, balls: 0, r: 0, w: 0,
    ovr: p.ovr || 78, bowl: p.bowl || p.ovr || 78, econ: p.econ || 8.2,
    phase: p.phase || '', isSpin: isSpinner(p)
  }));
}

function pickBowlerForOver(bowlers, overNum, lastBowlerId, isSpinTrack){
  const eligible = bowlers.filter(b => b.id !== lastBowlerId && b.ov < 4);
  const pool = eligible.length ? eligible : bowlers.filter(b => b.ov < 4);
  if (!pool.length) return bowlers[0];
  // Phase-aware bowling selection: PP (0-5) pacers, Middle (6-14) spinners, Death (15-19) death pacers!
  const scored = pool.map(b => {
    let sc = b.bowl + (4 - b.ov) * 3;
    if (overNum < 6 && !b.isSpin) sc += 10;
    if (overNum >= 6 && overNum < 15 && b.isSpin) sc += (isSpinTrack ? 16 : 9);
    if (overNum >= 15 && (b.phase === 'Death Pace' || (!b.isSpin && b.econ <= 8.2))) sc += 14;
    return { b, sc: sc + Math.random() * 6 };
  }).sort((a,b) => b.sc - a.sc);
  return scored[0].b;
}

function initLiveInnings(batTeam, bowlTeam, batXI, bowlXI, venue, target=null){
  const batCard = batXI.map(p => ({
    id: p.id, name: p.name, role: p.role, ovr: p.ovr || 75, bat: p.bat || p.ovr || 75,
    sr: p.sr || 135, r: 0, b: 0, f4: 0, s6: 0, out: false, howOut: 'not out', batted: false
  }));
  batCard[0].batted = true;
  batCard[1].batted = true;
  const bowlCard = buildLiveBowlingRotation(bowlXI);
  const isSpinTrack = /chepauk|ekana|jaipur/i.test(venue);
  const firstBowler = pickBowlerForOver(bowlCard, 0, -1, isSpinTrack);
  return {
    batTeamId: batTeam.id, batTeamName: batTeam.name, batColor: batTeam.color,
    bowlTeamId: bowlTeam.id, bowlTeamName: bowlTeam.name, bowlColor: bowlTeam.color,
    batXI, bowlXI, batCard, bowlCard,
    runs: 0, wkts: 0, legalBalls: 0, extras: 0, target,
    strikerIdx: 0, nonStrikerIdx: 1, nextBatIdx: 2,
    curBowler: firstBowler, lastBowlerId: -1,
    thisOver: [], overHistory: [], curOverRuns: 0, curOverWkts: 0, partRuns: 0, partBalls: 0,
    lastWktText: 'Opening Partnership', done: false
  };
}

function startLiveMatchSimulation(fx, tossInfo){
  lmStopAuto();
  const isIntl = Boolean(fx.isInternational);
  const t1Id = tossInfo.batFirstId;
  const t2Id = (t1Id === fx.t1Id) ? fx.t2Id : fx.t1Id;
  let team1, team2, xii1, xii2;
  if (isIntl) {
    team1 = (t1Id === fx.t1Id) ? fx.t1 : fx.t2;
    team2 = (t2Id === fx.t1Id) ? fx.t1 : fx.t2;
    const x1 = (t1Id === fx.t1Id) ? fx.customXI1 : fx.customXI2;
    const x2 = (t2Id === fx.t1Id) ? fx.customXI1 : fx.customXI2;
    xii1 = { xi: [...x1], impact: null };
    xii2 = { xi: [...x2], impact: null };
  } else {
    team1 = state.teams.find(x => x.id === t1Id);
    team2 = state.teams.find(x => x.id === t2Id);
    xii1 = computePlayingXII(team1, fx.pitch);
    xii2 = computePlayingXII(team2, fx.pitch);
    if (state.humanTeamId && (t1Id === state.humanTeamId || t2Id === state.humanTeamId)) {
      state.gmMatchesManaged = (state.gmMatchesManaged || 0) + 1;
    }
  }

  const inn1 = initLiveInnings(team1, team2, [...xii1.xi], [...xii2.xi], fx.pitch, null);

  lmState = {
    fx, tossInfo, team1, team2, xii1, xii2, isIntl,
    venue: fx.pitch,
    innNum: 1,
    inn1,
    inn2: null,
    impactNotes: [],
    impactUsed1: false,
    impactUsed2: false,
    tactics: { tempo: 'BALANCED', bowlPlan: 'STUMP', field: 'BALANCED' },
    finished: false,
    committed: false,
    showCard: false
  };

  document.getElementById('lmTitle').textContent = `🏏 ${fx.label.toUpperCase()}: ${team1.id} vs ${team2.id}`;
  document.getElementById('lmSub').textContent = `📍 ${fx.pitch.split(' (')[0]} • 🪙 ${tossInfo.tossWinner} won toss & chose to ${tossInfo.decision} • 💧 ${tossInfo.dew}`;
  document.getElementById('lmModePill').textContent = state.humanTeamId ? `🛡️ ${state.humanTeamId} LIVE` : '🎙️ AUCTIONEER LIVE';
  document.getElementById('lmLiveCardWrap').style.display = 'none';
  document.getElementById('lmEventFlash').style.display = 'none';
  document.getElementById('btnLmBall').disabled = false;
  document.getElementById('btnLmOver').disabled = false;
  document.getElementById('btnLmAuto').disabled = false;
  document.getElementById('btnLmSkip').disabled = false;

  const comm = document.getElementById('lmCommentary');
  comm.innerHTML = `
    <div class="msg" style="border-left-color:${team1.color}">
      🏟️ <b>MATCH STARTED!</b> <b>${inn1.batCard[0].name}</b> &amp; <b>${inn1.batCard[1].name}</b> walk out to open for <b>${team1.id}</b>. <b>${inn1.curBowler.name}</b> takes the new ball for <b>${team2.id}</b>!
    </div>`;

  renderLiveMatchUI();
  document.getElementById('liveMatchBackdrop').classList.add('open');
  sfxCrowdRoar(0.8);
}

function lmFormatOvers(balls){
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}

function lmFlashEvent(text, isMilestone=false){
  const el = document.getElementById('lmEventFlash');
  if (!el) return;
  el.textContent = text;
  el.className = 'lm-event-flash' + (isMilestone ? ' milestone' : '');
  el.style.display = 'block';
  clearTimeout(el._tm);
  el._tm = setTimeout(() => { el.style.display = 'none'; }, 2400);
}

function lmStepSingleBall(silent=false){
  if (!lmState || lmState.finished) return;
  const st = lmState;
  const inn = st.innNum === 1 ? st.inn1 : st.inn2;
  if (!inn || inn.done) return;

  const striker = inn.batCard[inn.strikerIdx];
  const bowler = inn.curBowler;
  const overNum = Math.floor(inn.legalBalls / 6);
  const venueL = st.venue.toLowerCase();
  const isFlat = venueL.includes('chinnaswamy') || venueL.includes('uppal') || venueL.includes('wankhede');
  const isSpin = venueL.includes('chepauk') || venueL.includes('ekana') || venueL.includes('jaipur');
  const isDew = st.innNum === 2 && st.tossInfo.dew && st.tossInfo.dew.includes('Heavy');

  // Realistic T20 phase, skill & Cricket Coach Tactical Controls!
  const tac = st.tactics || { tempo:'BALANCED', bowlPlan:'STUMP', field:'BALANCED' };
  const tempoRollMod = tac.tempo === 'SLOG' ? 9 : tac.tempo === 'ATTACK' ? 4.5 : tac.tempo === 'DEFEND' ? -6 : 0;
  const tempoWktMod  = tac.tempo === 'SLOG' ? 4.2 : tac.tempo === 'ATTACK' ? 1.6 : tac.tempo === 'DEFEND' ? -2.2 : 0;
  const bowlPlanRoll = tac.bowlPlan === 'YORKER' ? -3.5 : tac.bowlPlan === 'BOUNCER' ? 1.5 : tac.bowlPlan === 'FLIGHT' ? (bowler.isSpin ? 2.5 : 1) : -1.5;
  const bowlPlanWkt  = tac.bowlPlan === 'YORKER' ? 1.4 : tac.bowlPlan === 'BOUNCER' ? 2.1 : tac.bowlPlan === 'FLIGHT' ? (bowler.isSpin ? 2.4 : 0.5) : 0.6;
  const fieldRollMod = tac.field === 'ATTACK' ? 2.5 : tac.field === 'GUARD' ? -3.5 : 0;
  const fieldWktMod  = tac.field === 'ATTACK' ? 1.8 : tac.field === 'GUARD' ? -1.1 : 0;

  const skillDiff = ((striker.bat || 75) - (bowler.bowl || 75)) * 0.25;
  const phaseAgg = overNum < 6 ? 4 : overNum >= 15 ? 8 : 0;
  const pitchMod = isFlat ? 5 : (isSpin && bowler.isSpin ? -5 : 0);
  const dewMod = isDew ? 4 : 0;
  const roll = Math.random() * 100 + skillDiff + phaseAgg * 0.4 + pitchMod + dewMod + tempoRollMod + bowlPlanRoll + fieldRollMod;

  let code = '1', runs = 1, isWkt = false, isExtra = false, commText = '';

  if (Math.random() < 0.025) {
    // Wide ball (extra run, no legal ball consumed)
    isExtra = true; code = 'Wd'; runs = 1;
    inn.runs += 1; inn.extras += 1; bowler.r += 1; inn.partRuns += 1;
    inn.thisOver.push('Wd');
    commText = `Wide down leg from ${bowler.name} — 1 extra run.`;
  } else {
    inn.legalBalls += 1;
    bowler.balls += 1;
    striker.b += 1;
    inn.partBalls += 1;

    // Wicket probability (~4.8% base, slightly higher in death overs or vs tailenders)
    const tailPenalty = striker.role === 'BW' ? 4.5 : 0;
    const wktThresh = Math.max(1.8, 5.2 + tailPenalty + (overNum >= 16 ? 2.2 : 0) + tempoWktMod + bowlPlanWkt + fieldWktMod - skillDiff * 0.25);

    if (roll < wktThresh) {
      isWkt = true; code = 'W'; runs = 0;
      inn.wkts += 1; bowler.w += 1;
      striker.out = true;
      const modes = bowler.isSpin
        ? ['b ' + bowler.name, 'c & b ' + bowler.name, 'st WK b ' + bowler.name, 'lbw b ' + bowler.name]
        : ['b ' + bowler.name, 'c deep mid-wicket b ' + bowler.name, 'c behind b ' + bowler.name, 'lbw b ' + bowler.name];
      striker.howOut = modes[Math.floor(Math.random() * modes.length)];
      inn.thisOver.push('W');
      inn.lastWktText = `Last Wkt: ${striker.name} ${striker.r}(${striker.b}) — ${striker.howOut}`;
      commText = `💥 <b>WICKET!</b> <b>${striker.name}</b> out (${striker.howOut}) for <b>${striker.r} (${striker.b})</b>! ${inn.batTeamId} ${inn.runs}/${inn.wkts}.`;
      if (!silent) {
        lmFlashEvent(`💥 WICKET! ${striker.name} OUT (${striker.r} off ${striker.b}) — ${bowler.name} strikes!`, false);
        sfxUnsold();
      }
      inn.partRuns = 0; inn.partBalls = 0;
      if (inn.wkts < 10 && inn.nextBatIdx < inn.batCard.length) {
        inn.strikerIdx = inn.nextBatIdx++;
        inn.batCard[inn.strikerIdx].batted = true;
        commText += ` <b>${inn.batCard[inn.strikerIdx].name}</b> walks to the crease.`;
      }
    } else if (roll < 36) {
      code = '0'; runs = 0;
      inn.thisOver.push('0');
      commText = `Dot ball — ${bowler.name} keeps ${striker.name} quiet.`;
    } else if (roll < 70) {
      code = '1'; runs = 1;
      inn.runs += 1; striker.r += 1; bowler.r += 1; inn.partRuns += 1;
      inn.thisOver.push('1');
      commText = `${striker.name} works ${bowler.name} into the gap for a single.`;
      [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
    } else if (roll < 80) {
      code = '2'; runs = 2;
      inn.runs += 2; striker.r += 2; bowler.r += 2; inn.partRuns += 2;
      inn.thisOver.push('2');
      commText = `Good running! ${striker.name} tucks it deep for TWO.`;
    } else if (roll < 92) {
      code = '4'; runs = 4;
      inn.runs += 4; striker.r += 4; striker.f4 += 1; bowler.r += 4; inn.partRuns += 4;
      inn.thisOver.push('4');
      commText = `🔥 <b>FOUR!</b> Crisp boundary by <b>${striker.name}</b> off ${bowler.name}!`;
      if (!silent) sfxPaddle();
    } else {
      code = '6'; runs = 6;
      inn.runs += 6; striker.r += 6; striker.s6 += 1; bowler.r += 6; inn.partRuns += 6;
      inn.thisOver.push('6');
      commText = `🚀 <b>SIX!</b> <b>${striker.name}</b> smashes ${bowler.name} into the stands!`;
      if (!silent) sfxHijack();
    }

    // Milestone check (50 / 100)
    if (!isWkt && !silent) {
      const prevR = striker.r - runs;
      if (prevR < 50 && striker.r >= 50) lmFlashEvent(`🔥 FIFTY! ${striker.name} reaches ${striker.r} (${striker.b})!`, true);
      else if (prevR < 100 && striker.r >= 100) lmFlashEvent(`💯 CENTURY! ${striker.name} reaches ${striker.r} (${striker.b})!`, true);
    }

    inn.curOverRuns = (inn.curOverRuns || 0) + runs;
    if (isWkt) inn.curOverWkts = (inn.curOverWkts || 0) + 1;

    // End of Over handling
    if (inn.legalBalls % 6 === 0) {
      if (!inn.overHistory) inn.overHistory = [];
      inn.overHistory.push({ ov: Math.floor(inn.legalBalls / 6), runs: inn.curOverRuns || 0, wkts: inn.curOverWkts || 0 });
      inn.curOverRuns = 0;
      inn.curOverWkts = 0;
      bowler.ov += 1;
      bowler.balls = 0;
      [inn.strikerIdx, inn.nonStrikerIdx] = [inn.nonStrikerIdx, inn.strikerIdx];
      if (inn.legalBalls < 120 && inn.wkts < 10 && !(inn.target && inn.runs >= inn.target)) {
        inn.lastBowlerId = bowler.id;
        inn.curBowler = pickBowlerForOver(inn.bowlCard, Math.floor(inn.legalBalls / 6), inn.lastBowlerId, isSpin);
        inn.thisOver = [];
      }
    }
  }

  if (!silent) {
    const comm = document.getElementById('lmCommentary');
    const ovStr = isExtra ? lmFormatOvers(inn.legalBalls) : lmFormatOvers(inn.legalBalls);
    comm.innerHTML = `<div class="msg" style="border-left-color:${isWkt?'#e11d48':code==='6'?'#facc15':code==='4'?'#38bdf8':inn.batColor}"><b>${ovStr}:</b> ${commText}</div>` + comm.innerHTML;
    const msgs = comm.querySelectorAll('.msg');
    if (msgs.length > 45) msgs[msgs.length - 1].remove();
  }

  // Check Innings Completion
  const chased = Boolean(inn.target && inn.runs >= inn.target);
  if (chased || inn.wkts >= 10 || inn.legalBalls >= 120) {
    inn.done = true;
    if (st.innNum === 1) {
      // Start Innings 2 (with smart Impact Player substitution!)
      const xi2Bat = [...st.xii2.xi];
      const xi1Bowl = [...st.xii1.xi];
      if (st.xii2.impact && inn.runs >= 165 && (st.xii2.impact.role === 'B' || st.xii2.impact.role === 'WK' || st.xii2.impact.role === 'AR')) {
        const wIdx = xi2Bat.map((p,i)=>({p,i})).filter(x=>x.p.role==='BW').sort((a,b)=>(a.p.bat||30)-(b.p.bat||30))[0]?.i;
        if (wIdx !== undefined) {
          st.impactNotes.push(`${st.team2.id} subbed in ⚡${st.xii2.impact.name} for ${xi2Bat[wIdx].name}`);
          xi2Bat[wIdx] = st.xii2.impact;
        }
      }
      if (st.xii1.impact && (st.xii1.impact.role === 'BW' || st.xii1.impact.role === 'AR')) {
        const bIdx = xi1Bowl.map((p,i)=>({p,i})).filter(x=>x.p.role==='B').sort((a,b)=>(a.p.bowl||20)-(b.p.bowl||20))[0]?.i;
        if (bIdx !== undefined) {
          st.impactNotes.push(`${st.team1.id} subbed in ⚡${st.xii1.impact.name} for ${xi1Bowl[bIdx].name}`);
          xi1Bowl[bIdx] = st.xii1.impact;
        }
      }
      st.innNum = 2;
      st.inn2 = initLiveInnings(st.team2, st.team1, xi2Bat, xi1Bowl, st.venue, inn.runs + 1);
      if (!silent) {
        lmFlashEvent(`🏏 INNINGS BREAK! ${st.team2.id} need ${inn.runs + 1} runs to win!`, true);
        const comm = document.getElementById('lmCommentary');
        comm.innerHTML = `<div class="msg" style="border-left-color:#10b981"><b>INNINGS 2 BEGINS:</b> ${st.team1.id} finished on <b>${inn.runs}/${inn.wkts} (${lmFormatOvers(inn.legalBalls)})</b>. <b>${st.inn2.batCard[0].name}</b> &amp; <b>${st.inn2.batCard[1].name}</b> open the chase for <b>${st.team2.id}</b> (Target: <b>${inn.runs + 1}</b>)!${st.impactNotes.length ? '<br/>⚡ ' + st.impactNotes.join(' • ') : ''}</div>` + comm.innerHTML;
      }
    } else {
      // Match Finished!
      st.finished = true;
      lmStopAuto();
      commitLiveMatchToSeason();
    }
  }
}

function lmBowlBall(){
  if (!lmState || lmState.finished) return;
  lmStepSingleBall(false);
  renderLiveMatchUI();
}

function lmBowlOver(){
  if (!lmState || lmState.finished) return;
  const startInn = lmState.innNum;
  const inn = startInn === 1 ? lmState.inn1 : lmState.inn2;
  const targetBalls = Math.min(120, (Math.floor(inn.legalBalls / 6) + 1) * 6);
  let guard = 0;
  while (lmState && !lmState.finished && lmState.innNum === startInn && inn.legalBalls < targetBalls && guard < 15) {
    lmStepSingleBall(false);
    guard++;
  }
  renderLiveMatchUI();
}

function lmToggleAuto(){
  if (!lmState || lmState.finished) return;
  if (lmAutoTimer) { lmStopAuto(); return; }
  const delays = [0, 620, 260, 85];
  const b = document.getElementById('btnLmAuto');
  if (b) { b.textContent = '⏸ Pause'; b.className = 'btn btn-warn'; }
  lmAutoTimer = setInterval(() => {
    if (!lmState || lmState.finished) { lmStopAuto(); return; }
    lmStepSingleBall(false);
    renderLiveMatchUI();
  }, delays[lmSpeedLevel] || 620);
}

function lmCycleSpeed(){
  lmSpeedLevel = lmSpeedLevel >= 3 ? 1 : lmSpeedLevel + 1;
  const b = document.getElementById('btnLmSpeed');
  if (b) b.textContent = lmSpeedLevel === 3 ? '⚡ Speed: 5x' : lmSpeedLevel === 2 ? '🚀 Speed: 2x' : '⚡ Speed: 1x';
  if (lmAutoTimer) { lmStopAuto(); lmToggleAuto(); }
}

function lmSkipToEnd(){
  if (!lmState || lmState.finished) return;
  lmStopAuto();
  let guard = 0;
  while (!lmState.finished && guard < 400) {
    lmStepSingleBall(true);
    guard++;
  }
  renderLiveMatchUI();
}

function lmToggleScorecard(){
  if (!lmState) return;
  lmState.showCard = !lmState.showCard;
  document.getElementById('lmLiveCardWrap').style.display = lmState.showCard ? 'block' : 'none';
  renderLiveMatchUI();
}


function lmSetTempo(val){
  if (!lmState) return;
  lmState.tactics.tempo = val;
  beep(640, 0.05, 'triangle', 0.08);
  renderLiveMatchUI();
}
function lmSetBowlPlan(val){
  if (!lmState) return;
  lmState.tactics.bowlPlan = val;
  beep(580, 0.05, 'triangle', 0.08);
  renderLiveMatchUI();
}
function lmSetField(val){
  if (!lmState) return;
  lmState.tactics.field = val;
  beep(520, 0.05, 'triangle', 0.08);
  renderLiveMatchUI();
}
function lmSelectBowler(bowlerId){
  if (!lmState || lmState.finished) return;
  const inn = lmState.innNum === 1 ? lmState.inn1 : lmState.inn2;
  if (!inn) return;
  if (inn.legalBalls % 6 !== 0) { showToast('You can switch bowlers at the start of an over!'); return; }
  const b = inn.bowlCard.find(x => x.id === parseInt(bowlerId, 10));
  if (!b || b.ov >= 4 || b.id === inn.lastBowlerId) { showToast('That bowler cannot bowl this over.'); return; }
  inn.curBowler = b;
  sfxPaddle();
  showToast(`🎯 ${b.name} brought into the attack!`);
  renderLiveMatchUI();
}
function lmTriggerManualImpact(){
  if (!lmState || lmState.finished || lmState.isIntl) return;
  const st = lmState;
  const inn = st.innNum === 1 ? st.inn1 : st.inn2;
  const isTeam1Bat = (st.innNum === 1);
  const batImp = isTeam1Bat ? st.xii1.impact : st.xii2.impact;
  if (!batImp) { showToast('No Impact Sub available for this team.'); return; }
  if ((isTeam1Bat && st.impactUsed1) || (!isTeam1Bat && st.impactUsed2)) {
    showToast('Impact Sub already used by this team!'); return;
  }
  const alreadyIn = inn.batCard.some(b => b.id === batImp.id);
  if (alreadyIn) { showToast('Impact Sub already in the XI!'); return; }
  const replaceIdx = inn.batCard.findIndex(b => !b.batted && b.role === 'BW');
  const idxToUse = replaceIdx !== -1 ? replaceIdx : inn.batCard.length - 1;
  const outName = inn.batCard[idxToUse].name;
  inn.batCard[idxToUse] = {
    id: batImp.id, name: batImp.name, role: batImp.role, ovr: batImp.ovr,
    bat: batImp.bat || batImp.ovr, sr: batImp.sr || 140,
    r: 0, b: 0, f4: 0, s6: 0, out: false, howOut: 'not out', batted: false
  };
  if (isTeam1Bat) st.impactUsed1 = true; else st.impactUsed2 = true;
  const note = `⚡ TACTICAL IMPACT SUB: ${inn.batTeamId} brought in ${batImp.name} for ${outName}!`;
  st.impactNotes.push(note);
  lmFlashEvent(note, true);
  const comm = document.getElementById('lmCommentary');
  if (comm) comm.innerHTML = `<div class="msg" style="border-left-color:#facc15">${note}</div>` + comm.innerHTML;
  sfxTrade();
  renderLiveMatchUI();
}

function renderLiveMatchUI(){
  if (!lmState) return;
  const st = lmState;
  const inn = st.innNum === 1 ? st.inn1 : st.inn2;
  if (!inn) return;

  document.getElementById('lmInnTag').textContent = st.finished ? '🏆 FULL TIME' : (st.innNum === 1 ? `1ST INNINGS • ${inn.batTeamId}` : `2ND INNINGS CHASE • ${inn.batTeamId}`);
  document.getElementById('lmBigScore').innerHTML = `${inn.batTeamId} ${inn.runs}/${inn.wkts} <span class="lm-ov">(${lmFormatOvers(inn.legalBalls)} ov)</span>`;

  const ovFloat = Math.max(0.16, inn.legalBalls / 6);
  const crr = (inn.runs / ovFloat).toFixed(2);
  document.getElementById('lmRunRate').textContent = `CRR: ${crr}`;

  if (st.finished) {
    const m = state.seasonData.matches[state.seasonData.matches.length - 1];
    document.getElementById('lmTargetEq').textContent = `🏆 ${m.winner} won by ${m.margin}`;
    document.getElementById('btnLmBall').disabled = true;
    document.getElementById('btnLmOver').disabled = true;
    document.getElementById('btnLmAuto').disabled = true;
    document.getElementById('btnLmSkip').disabled = true;
  } else if (st.innNum === 2) {
    const need = Math.max(0, inn.target - inn.runs);
    const ballsLeft = Math.max(0, 120 - inn.legalBalls);
    const rrr = ballsLeft > 0 ? ((need / ballsLeft) * 6).toFixed(2) : '0.00';
    document.getElementById('lmTargetEq').textContent = `${inn.batTeamId} need ${need} off ${ballsLeft}b (RRR ${rrr})`;
  } else {
    document.getElementById('lmTargetEq').textContent = `1st Innings • Setting Target`;
  }

  // On-crease batters & bowler
  const sBat = inn.batCard[inn.strikerIdx];
  const nsBat = inn.batCard[inn.nonStrikerIdx];
  const bw = inn.curBowler;
  document.getElementById('lmStrikerRow').textContent = sBat ? `★ ${sBat.name}* — ${sBat.r} (${sBat.b}) [4s:${sBat.f4} 6s:${sBat.s6}]` : '—';
  document.getElementById('lmNonStrikerRow').textContent = nsBat ? `  ${nsBat.name} — ${nsBat.r} (${nsBat.b})` : '—';
  const bwOv = `${bw.ov}.${bw.balls}`;
  const bwEcon = (bw.r / Math.max(0.16, bw.ov + bw.balls / 6)).toFixed(2);
  document.getElementById('lmBowlerRow').textContent = `${bw.name} — ${bwOv}-0-${bw.r}-${bw.w} (Econ ${bwEcon})`;
  document.getElementById('lmLastWkt').textContent = `P'ship: ${inn.partRuns}(${inn.partBalls}) • ${inn.lastWktText}`;

  // This Over Ball Pills
  const pills = inn.thisOver.slice(-6);
  document.getElementById('lmThisOverBalls').innerHTML = Array.from({ length: 6 }, (_, i) => {
    const out = pills[i];
    if (!out) return `<div class="ball-pill">${i + 1}</div>`;
    const cls = out === '6' ? 'b-6' : out === '4' ? 'b-4' : out === 'W' ? 'b-w' : out === '0' ? 'b-0' : 'b-r';
    return `<div class="ball-pill ${cls}">${out}</div>`;
  }).join('');

  // Live Win Probability Bar & Cricket Coach Tactical HUD
  let probBat = 50;
  if (st.finished) {
    const lastRes = st.isIntl
      ? state.intlCareer.results[state.intlCareer.results.length - 1]
      : state.seasonData.matches[state.seasonData.matches.length - 1];
    probBat = (lastRes && lastRes.winner === inn.batTeamId) ? 100 : 0;
  } else if (st.innNum === 1) {
    const proj = inn.runs + (120 - inn.legalBalls) * 1.45 - inn.wkts * 7;
    probBat = Math.min(82, Math.max(22, Math.round(50 + (proj - 172) * 0.7)));
  } else {
    const need = Math.max(0, inn.target - inn.runs);
    const bl = Math.max(1, 120 - inn.legalBalls);
    const rrr = (need / bl) * 6;
    probBat = Math.min(95, Math.max(5, Math.round(62 - (rrr - 9) * 8 - inn.wkts * 4)));
  }
  const wpFill = document.getElementById('lmWinProbBar');
  const wpTxt = document.getElementById('lmWinProbTxt');
  if (wpFill) wpFill.innerHTML = `<div style="width:${probBat}%;background:${inn.batColor}"></div><div style="width:${100-probBat}%;background:${inn.bowlColor}"></div>`;
  const manEl = document.getElementById('lmManhattanWrap');
  if (manEl) {
    const hist = inn.overHistory || [];
    if (!hist.length) {
      manEl.innerHTML = `<div style="font-size:10px;color:var(--muted);text-align:center;padding:4px">📊 Manhattan Over-by-Over Graph appears after Over 1</div>`;
    } else {
      const maxR = Math.max(16, ...hist.map(h => h.runs));
      manEl.innerHTML = `<div style="display:flex;align-items:flex-end;gap:3px;height:44px;padding:4px 2px 0">` +
        hist.map(h => {
          const hPct = Math.max(12, Math.round((h.runs / maxR) * 100));
          const dots = h.wkts > 0 ? `<div style="width:6px;height:6px;border-radius:50%;background:#f43f5e;margin:0 auto 2px" title="${h.wkts} wkt(s)"></div>` : '';
          return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%" title="Over ${h.ov}: ${h.runs} runs, ${h.wkts} wkt(s)">
            ${dots}
            <div style="width:100%;max-width:16px;height:${hPct}%;background:${inn.batColor};border-radius:2px 2px 0 0;opacity:0.9"></div>
            <div style="font-size:8px;color:var(--muted);margin-top:1px">${h.ov}</div>
          </div>`;
        }).join('') + `</div>`;
    }
  }
  if (wpTxt) wpTxt.innerHTML = `<span style="color:${inn.batColor}">${inn.batTeamId} ${probBat}%</span><span style="color:var(--muted)">LIVE WIN PROBABILITY</span><span style="color:${inn.bowlColor}">${inn.bowlTeamId} ${100-probBat}%</span>`;

  // Highlight active tactical buttons
  const tac = st.tactics || { tempo:'BALANCED', bowlPlan:'STUMP', field:'BALANCED' };
  document.querySelectorAll('#lmTempoRow .chip').forEach(b => b.classList.toggle('active', b.dataset.val === tac.tempo));
  document.querySelectorAll('#lmBowlPlanRow .chip').forEach(b => b.classList.toggle('active', b.dataset.val === tac.bowlPlan));
  document.querySelectorAll('#lmFieldRow .chip').forEach(b => b.classList.toggle('active', b.dataset.val === tac.field));

  // Manual Bowler Selector (active at start of over)
  const bwSel = document.getElementById('lmBowlerSelect');
  if (bwSel) {
    const canSwitch = (inn.legalBalls % 6 === 0) && !st.finished;
    bwSel.disabled = !canSwitch;
    bwSel.innerHTML = inn.bowlCard.map(b => {
      const dis = b.ov >= 4 || b.id === inn.lastBowlerId;
      return `<option value="${b.id}" ${b.id===inn.curBowler.id?'selected':''} ${dis?'disabled':''}>${b.name} (${b.ov}/4 ov, ${b.w}/${b.r}${b.isSpin?', Spin':', Pace'})${b.id===inn.lastBowlerId?' [Rest]':''}</option>`;
    }).join('');
  }
  const impBtn = document.getElementById('btnLmImpactSub');
  if (impBtn) {
    const used = st.innNum === 1 ? st.impactUsed1 : st.impactUsed2;
    const hasImp = !st.isIntl && Boolean(st.innNum === 1 ? st.xii1.impact : st.xii2.impact);
    impBtn.style.display = hasImp ? 'inline-flex' : 'none';
    impBtn.disabled = used || st.finished;
    impBtn.textContent = used ? '⚡ Sub Used' : `⚡ Impact Sub`;
  }

  // Live Mini Scorecard if toggled open
  if (st.showCard) {
    const batted = inn.batCard.filter(b => b.batted);
    const bowled = inn.bowlCard.filter(b => b.ov > 0 || b.balls > 0);
    document.getElementById('lmLiveCardWrap').innerHTML = `
      <div class="tbl-wrap" style="background:var(--input-bg);border:1px solid var(--card-border);border-radius:5px;padding:6px">
        <table>
          <thead><tr><th>Batter</th><th>Status</th><th>R</th><th>B</th><th>4s</th><th>6s</th></tr></thead>
          <tbody>${batted.map(b=>`<tr><td><b>${b.name}</b></td><td style="font-size:10px;color:var(--muted)">${b.out?b.howOut:'not out*'}</td><td><b>${b.r}</b></td><td>${b.b}</td><td>${b.f4}</td><td>${b.s6}</td></tr>`).join('')}</tbody>
        </table>
        <table style="margin-top:6px">
          <thead><tr><th>Bowler</th><th>O</th><th>R</th><th>W</th><th>Econ</th></tr></thead>
          <tbody>${bowled.map(b=>`<tr><td><b>${b.name}</b></td><td>${b.ov}.${b.balls}</td><td>${b.r}</td><td><b>${b.w}</b></td><td>${(b.r/Math.max(0.16,b.ov+b.balls/6)).toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>
      </div>`;
  }
}

function commitLiveMatchToSeason(){
  if (!lmState || lmState.committed) return;
  lmState.committed = true;
  const st = lmState;
  const i1 = st.inn1, i2 = st.inn2;

  if (st.isIntl) {
    let bWins = i2.runs > i1.runs;
    if (i2.runs === i1.runs) bWins = Math.random() < 0.5;
    const winId = bWins ? i2.batTeamId : i1.batTeamId;
    const margin = i2.runs === i1.runs ? 'Super Over!' : (bWins ? `${10 - i2.wkts} wickets` : `${i1.runs - i2.runs} runs`);
    const topBat = [...(bWins ? i2.batCard : i1.batCard)].sort((a,b) => b.r - a.r)[0];
    const potm = topBat ? `${topBat.name} (${topBat.r} off ${topBat.b})` : winId;
    if (typeof recordIntlMatchResult === 'function') {
      recordIntlMatchResult(winId, margin, potm, i1.batTeamId, `${i1.runs}/${i1.wkts}`, i2.batTeamId, `${i2.runs}/${i2.wkts}`, i1.batCard, i2.batCard, i1.bowlCard, i2.bowlCard);
    }
    const comm = document.getElementById('lmCommentary');
    if (comm) comm.innerHTML = `<div class="msg" style="border-left-color:#10b981">🌍🏆 <b>FULL TIME:</b> <b>${winId}</b> won by <b>${margin}</b>! POTM: <b>${potm}</b>.</div>` + comm.innerHTML;
    sfxCrowdRoar(1.3);
    fireConfetti(bWins ? i2.batColor : i1.batColor);
    return;
  }

  const s = state.seasonData;
  const A = s.table[i1.batTeamId], B = s.table[i2.batTeamId];
  const idx = s.nextIndex;

  // Determine winner (handle tie via instant Super Over!)
  let bWins = i2.runs > i1.runs;
  let superOverData = null;
  if (i2.runs === i1.runs) {
    const soA = Math.floor(10 + Math.random() * 12);
    let soB = Math.floor(10 + Math.random() * 12);
    if (soB === soA) soB += 2;
    bWins = soB > soA;
    superOverData = { t1: A.id, r1: soA, w1: 1, t2: B.id, r2: soB, w2: 1, winner: bWins ? B.id : A.id };
  }
  const winner = bWins ? B : A;
  const margin = superOverData
    ? `Super Over (${superOverData.t1} ${superOverData.r1}/${superOverData.w1} vs ${superOverData.t2} ${superOverData.r2}/${superOverData.w2})`
    : (bWins ? `${10 - i2.wkts} wickets` : `${i1.runs - i2.runs} runs`);

  // Convert live innings to standard season scorecard format & update pStats + playerForm
  const toStdInn = (inn) => {
    const batCard = inn.batCard.filter(b => b.batted).map(b => {
      if (s.pStats[b.id]) { s.pStats[b.id].runs += b.r; s.pStats[b.id].impact += b.r * 1.1; }
      return { name: b.name, r: b.r, b: b.b, f4: b.f4, s6: b.s6, sr: ((b.r / Math.max(1, b.b)) * 100).toFixed(1), out: b.out };
    });
    const bowlCard = inn.bowlCard.filter(b => b.ov > 0 || b.balls > 0).map(b => {
      if (s.pStats[b.id]) { s.pStats[b.id].wkts += b.w; s.pStats[b.id].impact += b.w * 25; }
      return { id: b.id, name: b.name, ov: +(b.ov + b.balls / 10).toFixed(1), r: b.r, w: b.w };
    });
    return { team: inn.batTeamId, score: `${inn.runs}/${inn.wkts}`, overs: lmFormatOvers(inn.legalBalls), batCard, bowlCard };
  };

  const stdInn1 = toStdInn(i1);
  const stdInn2 = toStdInn(i2);
  const winBat = [...(bWins ? stdInn2.batCard : stdInn1.batCard)].sort((x,y)=>y.r-x.r)[0];
  const winBowl = [...(bWins ? stdInn1.bowlCard : stdInn2.bowlCard)].sort((x,y)=>y.w-x.w || x.r-y.r)[0];
  const potm = (winBowl && winBowl.w >= 3) ? `${winBowl.name} (${winBowl.w}/${winBowl.r})` : (winBat ? `${winBat.name} (${winBat.r} off ${winBat.b})` : winner.id);

  const injury = idx < 73 ? triggerAutoMatchInjury([i1.batTeamId, i2.batTeamId], st.fx.label) : null;
  const injNote = injury ? `🚑 Injured: ${injury.out} (${injury.team}) → Replaced by ${injury.inName}` : '✅ No injuries';
  const oneLiner = `🏏 LIVE SIM: ${winner.id} beat ${bWins?A.id:B.id} by ${margin} — POTM: ${potm}. ${injNote}`;

  const mObj = {
    idx: s.matches.length, label: st.fx.label, venue: st.venue.split(' (')[0],
    t1: A.id, s1: stdInn1.score, t2: B.id, s2: stdInn2.score,
    winner: winner.id, margin, potm, injury, superOver: superOverData,
    impactNotes: st.impactNotes, oneLiner, inn1: stdInn1, inn2: stdInn2
  };
  s.matches.push(mObj);

  const ov1 = i1.wkts >= 10 ? 20.0 : +(Math.floor(i1.legalBalls/6) + (i1.legalBalls%6)/6).toFixed(2);
  const ov2 = i2.wkts >= 10 ? 20.0 : +(Math.floor(i2.legalBalls/6) + (i2.legalBalls%6)/6).toFixed(2);

  if (idx < 70) {
    A.m++; B.m++;
    A.rf += i1.runs; A.of += ov1; A.ra += i2.runs; A.oa += ov2;
    B.rf += i2.runs; B.of += ov2; B.ra += i1.runs; B.oa += ov1;
    if (!A.form) A.form = []; if (!B.form) B.form = [];
    if (winner.id === A.id) { A.w++; A.pts += 2; B.l++; A.form.push('W'); B.form.push('L'); }
    else { B.w++; B.pts += 2; A.l++; B.form.push('W'); A.form.push('L'); }
    if (A.form.length > 5) A.form.shift();
    if (B.form.length > 5) B.form.shift();
    s.standings = Object.values(s.table).map(t => {
      t.nrr = +((t.rf / Math.max(1, t.of)) - (t.ra / Math.max(1, t.oa))).toFixed(3);
      return t;
    }).sort((a,b) => b.pts - a.pts || b.nrr - a.nrr);
  } else if (idx === 70) { s.playoffWinners.q1W = winner.id; s.playoffWinners.q1L = winner.id === A.id ? B.id : A.id; }
  else if (idx === 71) { s.playoffWinners.elW = winner.id; }
  else if (idx === 72) { s.playoffWinners.q2W = winner.id; }
  else if (idx === 73) { s.champId = winner.id; s.runnerId = winner.id === A.id ? B.id : A.id; s.finished = true; finalizeSeasonAwards(); }

  s.nextIndex++;
  const comm = document.getElementById('lmCommentary');
  if (comm) {
    comm.innerHTML = `<div class="msg" style="border-left-color:#10b981">🏆 <b>FULL TIME:</b> <b>${winner.id}</b> won by <b>${margin}</b>! POTM: <b>${potm}</b>. ${injNote}</div>` + comm.innerHTML;
  }
  sfxCrowdRoar(1.3);
  fireConfetti(winner.color || '#facc15');
  renderSeason();
  renderSquads();
  saveState();
}


// ==================== V53: CAPTAINCY TRAITS, MULTI-SEASON MINI-AUCTION & CHAMPION POSTER ====================
function getCaptainTrait(p){
  if (!p) return null;
  if (isSpinner(p) || p.role === 'AR') return { key:'SPIN', badge:'🌀 Spin Strategist', desc:'+4 middle-overs control & spin matchup boost' };
  if (p.role === 'BW') return { key:'DEATH', badge:'🎯 Death-Over Calm', desc:'+5 death-overs bowling composure & yorker accuracy' };
  if (p.role === 'WK' || KNOWN_FINISHERS.has(p.name)) return { key:'CHASE', badge:'🧊 Chase Master', desc:'+6 second-innings chase composure under pressure' };
  return { key:'PP', badge:'🔥 Powerplay Aggressor', desc:'+5 powerplay batting intent & field aggression' };
}

function startNextSeasonMiniAuction(){
  const s = state.seasonData;
  if (!s || !s.finished) { showToast('Finish the current season first to launch the Mini-Auction!'); return; }
  const nextSeason = (state.seasonNumber || 1) + 1;
  if (!confirm(`Launch Season ${nextSeason} Mini-Auction? Every franchise will retain its top 5 core stars, release the rest to the auction pool, and update player OVRs based on Season ${nextSeason - 1} stats!`)) return;

  // 1. Dynamic OVR progression based on last season stats
  state.players.forEach(p => {
    const st = s.pStats[p.id];
    if (st && (st.runs > 0 || st.wkts > 0)) {
      if (st.impact >= 420) p.ovr = Math.min(97, p.ovr + 2);
      else if (st.impact >= 240) p.ovr = Math.min(96, p.ovr + 1);
      else if (st.impact < 55 && p.ovr > 72) p.ovr = Math.max(66, p.ovr - 1);
    }
    if (p.status === 'INJURED') { p.injured = false; p.status = 'AVAIL'; }
  });

  // 2. Retain top 5 core stars per franchise (slabs: 18Cr, 14Cr, 11Cr, 8Cr, 5Cr = 56Cr; Purse left = 64Cr)
  const retSlabs = [1800, 1400, 1100, 800, 500];
  const fullPurse = state.startingPurse || 12000;
  const retainedSet = new Set();

  state.teams.forEach(t => {
    const ranked = t.squad
      .map(id => state.players[id])
      .filter(Boolean)
      .sort((a, b) => ((s.pStats[b.id]?.impact || 0) * 0.2 + b.ovr * 5) - ((s.pStats[a.id]?.impact || 0) * 0.2 + a.ovr * 5));
    const keep = [];
    let osKept = 0;
    for (const p of ranked) {
      if (keep.length >= 5) break;
      if (p.os && osKept >= 2) continue;
      keep.push(p);
      if (p.os) osKept++;
    }
    let spent = 0;
    t.squad = [];
    keep.forEach((p, idx) => {
      const cost = retSlabs[idx] || 500;
      spent += cost;
      p.status = 'SOLD'; p.soldTo = t.id; p.soldPrice = cost; p.retained = true;
      t.squad.push(p.id);
      retainedSet.add(p.id);
    });
    t.purse = Math.max(2000, fullPurse - spent);
    t.customXI = null; t.customImpact = null;
    t.rtmCards = 2;
    t.chatter = `🔒 Retained ${keep.length} stars for Season ${nextSeason} Mini-Auction!`;
  });

  // 3. Release all non-retained players back to AVAIL pool
  state.players.forEach(p => {
    if (!retainedSet.has(p.id)) {
      p.status = 'AVAIL'; p.soldTo = null; p.soldPrice = 0; p.retained = false;
    }
  });

  state.seasonNumber = nextSeason;
  state.seasonData = null;
  state.curId = null; state.curLeader = null; state.curBid = 0; state.gavelStage = 0;
  state.retentionsDone = true;
  state.tradesUnlocked = true;
  state.midSeasonLoanDone = false;
  state.playerForm = {};
  state.injuryHistory = [];
  state.soldOrder = [];

  sfxTrade();
  pushTicker(`🔥 SEASON ${nextSeason} MINI-AUCTION LIVE! TOP 5 STARS RETAINED PER TEAM — PURSES RESET!`);
  showToast(`🔥 Season ${nextSeason} Mini-Auction Ready! Head to STAGE to start bidding!`);
  switchView('stage');
  renderAll(); saveState();
}

function downloadSeasonPosterPNG(){
  const s = state.seasonData;
  if (!s || !s.finished || !s.awards) { showToast('Finish the season first to generate the Champion Poster!'); return; }
  const champ = state.teams.find(x => x.id === s.champId) || state.teams[0];

  // Build Official 11-Player Team of the Tournament (4 Bat, 1 WK, 2 AR, 4 Bowl by MVP impact)
  const played = state.players.filter(p => p.status === 'SOLD' && (s.pStats[p.id]?.impact || 0) > 0)
    .sort((a, b) => (s.pStats[b.id]?.impact || 0) - (s.pStats[a.id]?.impact || 0));
  const bestXI = [];
  const take = (role, n) => {
    for (const p of played) {
      if (bestXI.length >= 11) break;
      if (p.role === role && !bestXI.includes(p)) { bestXI.push(p); if (--n <= 0) break; }
    }
  };
  take('WK', 1); take('B', 4); take('AR', 2); take('BW', 4);
  for (const p of played) { if (bestXI.length >= 11) break; if (!bestXI.includes(p)) bestXI.push(p); }

  const W = 1080, H = 1350;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#070d1c'); bg.addColorStop(1, '#04070f');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = champ.color; ctx.lineWidth = 8;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  ctx.fillStyle = '#facc15'; ctx.font = 'bold 26px monospace';
  ctx.fillText(`IPL SEASON ${state.seasonNumber || 1} — GRAND CHAMPIONS`, 64, 90);
  ctx.fillStyle = champ.color; ctx.font = 'italic bold 60px sans-serif';
  ctx.fillText(champ.name.toUpperCase(), 64, 162);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '600 22px monospace';
  ctx.fillText(`DEFEATED ${s.runnerId} IN THE GRAND FINAL`, 64, 202);

  // Awards Strip
  const aw = [
    ['ORANGE CAP', s.awards.orange.name, s.awards.orange.stat, '#f97316'],
    ['PURPLE CAP', s.awards.purple.name, s.awards.purple.stat, '#a855f7'],
    ['MVP', s.awards.mvp.name, s.awards.mvp.stat.split(' (')[0], '#facc15']
  ];
  aw.forEach((a, i) => {
    const x = 64 + i * 324;
    ctx.fillStyle = 'rgba(15,23,42,0.92)'; ctx.fillRect(x, 228, 304, 110);
    ctx.fillStyle = a[3]; ctx.fillRect(x, 228, 304, 6);
    ctx.font = 'bold 16px monospace'; ctx.fillText(a[0], x + 16, 260);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(a[1].slice(0, 18), x + 16, 294);
    ctx.fillStyle = '#94a3b8'; ctx.font = '600 17px monospace'; ctx.fillText(a[2], x + 16, 324);
  });

  ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 24px monospace';
  ctx.fillText('TEAM OF THE TOURNAMENT (OFFICIAL BEST XI)', 64, 386);

  let y = 408;
  bestXI.forEach((p, i) => {
    const st = s.pStats[p.id] || { runs:0, wkts:0, impact:0 };
    ctx.fillStyle = i % 2 === 0 ? 'rgba(30,41,59,0.7)' : 'rgba(15,23,42,0.7)';
    ctx.fillRect(64, y, W - 128, 72);
    ctx.fillStyle = '#facc15'; ctx.font = 'bold 24px monospace';
    ctx.fillText(String(i + 1).padStart(2, '0'), 84, y + 45);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`${p.name} (${p.soldTo})`, 140, y + 45);
    ctx.fillStyle = '#34d399'; ctx.font = 'bold 20px monospace';
    ctx.fillText(`${st.runs}R • ${st.wkts}W • ${Math.round(st.impact)} pts`, W - 360, y + 45);
    y += 78;
  });

  ctx.fillStyle = '#64748b'; ctx.font = '600 18px monospace';
  ctx.fillText('THE GAVEL HOUSE — IPL MEGA AUCTION & SEASON SIMULATOR', 64, H - 46);

  const a = document.createElement('a');
  a.href = cvs.toDataURL('image/png');
  a.download = `IPL_Season_${state.seasonNumber || 1}_Champion_BestXI.png`;
  a.click();
  sfxTrade();
  showToast('🖼️ Downloaded Champion & Team of the Tournament Poster!');
}
