// ============================================================================
// THE GAVEL HOUSE — SUPABASE REALTIME 10-FRIEND MULTIPLAYER + LOCAL HOTSEAT
// Works reliably on Jio/Airtel 4G/5G with browser-refresh seat recovery!
// ============================================================================

// Paste your free Supabase Project URL & Anon Key here (or configure in Settings)
const DEFAULT_SUPABASE_URL = '';
const DEFAULT_SUPABASE_ANON_KEY = '';
const SB_URL_KEY = 'gavel_supabase_url';
const SB_ANON_KEY = 'gavel_supabase_anon';
const MP_SESSION_KEY = 'gavel_mp_session';

let mpRole = 'SOLO'; // 'SOLO' | 'HOST' | 'CLIENT'
let sbClient = null;
let sbChannel = null;
let mpRoomCode = '';
let mpClientTeamId = '';
let mpClientName = '';
let onlinePeerTeams = {};
let bidTimerInterval = null;
let bidTimerLeft = 0;

function getSupabaseCreds(){
  try {
    const url = (localStorage.getItem(SB_URL_KEY) || DEFAULT_SUPABASE_URL || '').trim();
    const anon = (localStorage.getItem(SB_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY || '').trim();
    return { url, anon };
  } catch(e){
    return { url: DEFAULT_SUPABASE_URL, anon: DEFAULT_SUPABASE_ANON_KEY };
  }
}

function saveSupabaseConfig(){
  const url = (document.getElementById('sbUrlInput')?.value || '').trim();
  const anon = (document.getElementById('sbAnonInput')?.value || '').trim();
  try {
    if (url) localStorage.setItem(SB_URL_KEY, url); else localStorage.removeItem(SB_URL_KEY);
    if (anon) localStorage.setItem(SB_ANON_KEY, anon); else localStorage.removeItem(SB_ANON_KEY);
  } catch(e){}
  sbClient = null;
  showToast(url && anon ? '✅ Supabase Realtime configured!' : 'Cleared Supabase config.');
}

function getSupabaseClient(){
  if (sbClient) return sbClient;
  const { url, anon } = getSupabaseCreds();
  if (!url || !anon || typeof window.supabase === 'undefined') return null;
  sbClient = window.supabase.createClient(url, anon, { realtime: { params: { eventsPerSecond: 10 } } });
  return sbClient;
}

function saveMpSession(){
  try {
    if (mpRole === 'SOLO') sessionStorage.removeItem(MP_SESSION_KEY);
    else sessionStorage.setItem(MP_SESSION_KEY, JSON.stringify({ role: mpRole, roomCode: mpRoomCode, teamId: mpClientTeamId, name: mpClientName }));
  } catch(e){}
}

function teamRaisePaddle(tid){
  if (state.curId === null) return;
  if (mpRole === 'CLIENT') {
    if (sbChannel) {
      sbChannel.send({ type: 'broadcast', event: 'action', payload: { type: 'BID', teamId: mpClientTeamId, name: mpClientName } });
      showToast(`✋ Bid sent for ${mpClientTeamId}!`);
    }
    return;
  }

  const t = state.teams.find(x => x.id === tid);
  const p = state.players[state.curId];
  if (!t || !p) return;
  if (state.curLeader === t.id) { showToast(`${t.id} already holds the highest bid!`); return; }
  if (state.curLeader && state.curBid >= MAX_BID_CAP) { showToast('🔒 ₹25.00 Cr MAX CAP reached!'); return; }
  const c = teamRoleCounts(t);
  if (t.squad.length >= 25) { showToast(`${t.id} squad is full (25/25)!`); return; }
  if (p.os && c.OS >= 8) { showToast(`${t.id} overseas cap is full (8/8)!`); return; }
  const reqBid = Math.min(MAX_BID_CAP, state.curLeader ? state.curBid + nextInc(state.curBid) : p.base);
  if (reqBid > maxSpendable(t)) { showToast(`${t.id} max spendable is ${fmtCr(maxSpendable(t))}!`); return; }

  if (!state.bidHistory) state.bidHistory = [];
  state.bidHistory.push({ bid: state.curBid, leader: state.curLeader, gavel: state.gavelStage });
  if (state.bidHistory.length > 20) state.bidHistory.shift();

  state.curBid = reqBid;
  state.curLeader = t.id;
  state.gavelStage = 0;
  if (!state.biddersThisLot.includes(t.id)) state.biddersThisLot.push(t.id);
  const whoLabel = t.ownerName && t.ownerName !== 'AI Bot' ? t.ownerName : t.id;
  t.chatter = `✋ ${whoLabel} raised paddle at ${fmtCr(reqBid)}!`;
  t.lastFlash = Date.now();
  state.warLog.unshift({ text:`✋ ${t.id} (${whoLabel}) ${fmtCr(reqBid)}`, hijack:false });
  if (!state.bidPoints) state.bidPoints = [];
  state.bidPoints.push({ bid: reqBid, team: t.id, color: t.color });
  state.warLog = state.warLog.slice(0, 7);
  document.documentElement.style.setProperty('--beam', t.color);
  sfxPaddle();
  restartBidTimer();
  speakBidFemale(`${fmtSpeechPrice(reqBid)}, ${t.name}.`);
  renderAll();
  saveState();
}

function humanRaisePaddle(){
  const tid = mpRole === 'CLIENT' ? mpClientTeamId : state.humanTeamId;
  if (tid) teamRaisePaddle(tid);
}

function humanPassLot(){
  const tid = mpRole === 'CLIENT' ? mpClientTeamId : state.humanTeamId;
  if (!tid || state.curId === null) return;
  if (mpRole === 'CLIENT') {
    if (sbChannel) {
      sbChannel.send({ type: 'broadcast', event: 'action', payload: { type: 'PASS', teamId: tid, name: mpClientName } });
      showToast(`🤫 Marked ${tid} as OUT for this player.`);
    }
    return;
  }
  if (!state.passedTeams) state.passedTeams = [];
  if (!state.passedTeams.includes(tid)) state.passedTeams.push(tid);
  const t = state.teams.find(x=>x.id===tid);
  if (t) t.chatter = `🤫 ${t.ownerName||t.id} passed on this lot.`;
  addReaction(`🤫 <b style="color:${t.color}">${t.id} (${t.ownerName||'Human'})</b> dropped out of the bidding.`, t.color);
  renderAll(); saveState();
}

function undoLastBid(){
  if (mpRole === 'CLIENT') { showToast('Only the Host Auctioneer can undo a bid.'); return; }
  if (state.curId === null || !state.bidHistory || !state.bidHistory.length) {
    showToast('No previous bid to undo on this lot.'); return;
  }
  const prev = state.bidHistory.pop();
  if (state.bidPoints && state.bidPoints.length > 1) state.bidPoints.pop();
  state.curBid = prev.bid;
  state.curLeader = prev.leader;
  state.gavelStage = prev.gavel;
  state.warLog.unshift({ text:`↩️ UNDO → ${prev.leader||'OPEN'} ${fmtCr(prev.bid)}`, hijack:false });
  state.warLog = state.warLog.slice(0, 7);
  sfxUnsold();
  restartBidTimer();
  showToast(`↩️ Reverted bid back to ${prev.leader || 'Base Price'} (${fmtCr(prev.bid)})!`);
  renderAll(); saveState();
}

function setBidTimerDuration(val){
  state.bidTimerSec = parseInt(val, 10) || 0;
  if (state.bidTimerSec > 0 && state.curId !== null) restartBidTimer();
  else stopBidTimer();
  saveState();
  showToast(state.bidTimerSec ? `⏱️ Bid Shot Clock set to ${state.bidTimerSec}s!` : '⏱️ Bid Shot Clock OFF');
}

function restartBidTimer(){
  stopBidTimer();
  const pill = document.getElementById('bidTimerPill');
  if (!state.bidTimerSec || state.curId === null || mpRole === 'CLIENT') {
    if (pill) pill.style.display = 'none';
    return;
  }
  bidTimerLeft = state.bidTimerSec;
  if (pill) { pill.style.display = 'inline-block'; pill.classList.remove('urgent'); pill.textContent = `⏱️ ${bidTimerLeft}s`; }
  bidTimerInterval = setInterval(() => {
    bidTimerLeft--;
    if (pill) {
      pill.textContent = `⏱️ ${bidTimerLeft}s`;
      pill.classList.toggle('urgent', bidTimerLeft <= 5);
    }
    if (bidTimerLeft <= 5 && bidTimerLeft > 0) beep(880, 0.06, 'sine', 0.09);
    if (bidTimerLeft <= 0) {
      stopBidTimer();
      if (state.curLeader) {
        callGoingTwice();
        showToast(`⏰ Time up! Final call for ${state.curLeader} — tap SOLD!`);
      } else {
        showToast('⏰ Time up with no bids — tap Unsold or raise a paddle!');
      }
    }
  }, 1000);
}

function stopBidTimer(){
  if (bidTimerInterval) { clearInterval(bidTimerInterval); bidTimerInterval = null; }
  const pill = document.getElementById('bidTimerPill');
  if (pill) { pill.style.display = 'none'; pill.classList.remove('urgent'); }
}

function enableAll10FriendsLocal(){
  state.teams.forEach((t, i) => {
    t.isHuman = true;
    if (!t.ownerName || t.ownerName === 'AI Bot') t.ownerName = `Friend ${i+1}`;
  });
  state.humanTeamId = '';
  sfxTrade();
  showToast('👥 All 10 Franchises are now REAL HUMAN FRIENDS! Use the 10-Team Paddle Board on STAGE.');
  renderAll(); saveState();
}

function resetToAllAI(){
  state.teams.forEach(t => { t.isHuman = false; t.ownerName = 'AI Bot'; });
  state.humanTeamId = '';
  sfxUnsold();
  showToast('🤖 Switched all 10 franchises back to AI Bots.');
  renderAll(); saveState();
}

function updateSeatOwner(tid, nameVal){
  const t = state.teams.find(x => x.id === tid);
  if (!t) return;
  t.ownerName = (nameVal || '').trim() || (t.isHuman ? 'Friend' : 'AI Bot');
  renderTeams();
  saveState();
}

function toggleSeatHuman(tid){
  const t = state.teams.find(x => x.id === tid);
  if (!t) return;
  t.isHuman = !t.isHuman;
  if (t.isHuman && (!t.ownerName || t.ownerName === 'AI Bot')) t.ownerName = `${t.id} Owner`;
  if (!t.isHuman) t.ownerName = 'AI Bot';
  renderAll(); saveState();
}

// ==================== SUPABASE REALTIME CHANNEL (HOST & CLIENT) ====================
function hostOnlineRoom(existingCode=''){
  const client = getSupabaseClient();
  if (!client) {
    showToast('⚙️ Paste your free Supabase URL & Anon Key in ⚙️ Settings (or multiplayer.js) to host online!');
    return;
  }
  if (sbChannel) { try { client.removeChannel(sbChannel); } catch(e){} sbChannel = null; }

  mpRoomCode = existingCode || ('IPL-' + Math.floor(1000 + Math.random() * 9000));
  onlinePeerTeams = {};
  document.getElementById('onlineStatusPill').textContent = 'CONNECTING...';

  sbChannel = client.channel('gavel-room-' + mpRoomCode.toLowerCase(), {
    config: { broadcast: { self: false }, presence: { key: 'HOST' } }
  });

  sbChannel.on('broadcast', { event: 'action' }, ({ payload }) => {
    handleHostIncomingMsg(payload);
  });

  sbChannel.on('presence', { event: 'sync' }, () => {
    const pres = sbChannel.presenceState();
    onlinePeerTeams = {};
    Object.entries(pres).forEach(([k, arr]) => {
      if (k !== 'HOST' && arr && arr[0] && arr[0].teamId) {
        onlinePeerTeams[arr[0].teamId] = arr[0].name || 'Friend';
      }
    });
    updateHostConnLabel();
    renderTeams();
  });

  sbChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      mpRole = 'HOST';
      saveMpSession();
      await sbChannel.track({ role: 'HOST', name: 'Auctioneer' });
      if (state.teams.every(t => !t.isHuman)) enableAll10FriendsLocal();
      document.getElementById('onlineStatusPill').textContent = '🟢 SUPABASE LIVE';
      document.getElementById('onlineStatusPill').className = 'pill pill-live';
      document.getElementById('hostRoomBox').style.display = 'block';
      document.getElementById('joinRoomBox').style.display = 'none';
      document.getElementById('hostRoomCodeDisplay').textContent = mpRoomCode;
      sfxTrade();
      showToast(`🌐 Supabase Realtime Room ${mpRoomCode} live! Works on Jio/Airtel 5G!`);
      renderFriendsHub();
    }
  });
}

function handleHostIncomingMsg(msg){
  if (!msg || !msg.type) return;
  if (msg.type === 'JOIN') {
    const tid = msg.teamId;
    const fname = (msg.name || 'Friend').slice(0, 18);
    const t = state.teams.find(x => x.id === tid);
    if (t) { t.isHuman = true; t.ownerName = fname; }
    onlinePeerTeams[tid] = fname;
    updateHostConnLabel();
    pushFriendChatSystem(`🟢 ${fname} joined live as ${tid}!`);
    broadcastRoomState();
    renderAll(); saveState();
  } else if (msg.type === 'BID') {
    teamRaisePaddle(msg.teamId);
  } else if (msg.type === 'PASS') {
    if (!state.passedTeams) state.passedTeams = [];
    if (!state.passedTeams.includes(msg.teamId)) state.passedTeams.push(msg.teamId);
    const t = state.teams.find(x=>x.id===msg.teamId);
    if (t) t.chatter = `🤫 ${msg.name} passed on this lot.`;
    addReaction(`🤫 <b style="color:${t?.color||'var(--gold)'}">${msg.teamId} (${msg.name})</b> passed.`, t?.color||'var(--gold)');
    renderAll(); saveState();
  } else if (msg.type === 'CHAT') {
    state.friendsChat.unshift({ sender:`${msg.name} (${msg.teamId})`, color: state.teams.find(x=>x.id===msg.teamId)?.color || 'var(--gold)', text: msg.text });
    state.friendsChat = state.friendsChat.slice(0, 30);
    renderFriendsChat();
    saveState();
  }
}

function broadcastRoomState(){
  if (mpRole !== 'HOST' || !sbChannel) return;
  try {
    sbChannel.send({ type: 'broadcast', event: 'state', payload: { state } });
  } catch(e){}
}

function updateHostConnLabel(){
  const el = document.getElementById('hostConnCount');
  if (!el) return;
  const entries = Object.entries(onlinePeerTeams);
  const names = entries.map(([tid, nm]) => `${tid}(${nm})`).join(', ');
  el.textContent = `🟢 ${entries.length} friend(s) connected via Supabase Realtime${names ? ': ' + names : ' (empty seats can be controlled locally or set to AI Bot)'}.`;
}

function copyInviteLink(){
  const baseUrl = window.location.href.split('?')[0];
  const link = baseUrl.startsWith('http') ? `${baseUrl}?room=${mpRoomCode}` : `Room Code: ${mpRoomCode}`;
  if (navigator.clipboard) navigator.clipboard.writeText(link);
  showToast('📋 Copied Invite Link / Room Code!');
}

function shareWhatsAppInvite(){
  const baseUrl = window.location.href.split('?')[0];
  const txt = baseUrl.startsWith('http')
    ? `🏏 Join our Live 10-Player IPL Mega Auction! Room Code: ${mpRoomCode} — Open link & pick your team: ${baseUrl}?room=${mpRoomCode}`
    : `🏏 Join our Live 10-Player IPL Mega Auction! Open The Gavel House, go to 👥 FRIENDS tab, and enter Room Code: ${mpRoomCode}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank');
}

function joinOnlineRoom(overrideCode='', overrideName='', overrideTeam=''){
  const client = getSupabaseClient();
  if (!client) {
    showToast('⚙️ Supabase Realtime not configured yet! Add URL & Anon Key in ⚙️ Settings.');
    return;
  }
  const rawCode = (overrideCode || document.getElementById('joinCodeInput').value || '').trim().toUpperCase();
  const fname = (overrideName || document.getElementById('joinNameInput').value || '').trim() || 'Friend';
  const tid = overrideTeam || document.getElementById('joinTeamSelect').value;
  if (!rawCode) { showToast('Enter the Host Room Code (e.g. IPL-4821)!'); return; }

  const cleanCode = rawCode.startsWith('IPL-') ? rawCode : ('IPL-' + rawCode);
  document.getElementById('onlineStatusPill').textContent = 'JOINING...';
  if (sbChannel) { try { client.removeChannel(sbChannel); } catch(e){} sbChannel = null; }

  sbChannel = client.channel('gavel-room-' + cleanCode.toLowerCase(), {
    config: { broadcast: { self: false }, presence: { key: tid } }
  });

  sbChannel.on('broadcast', { event: 'state' }, ({ payload }) => {
    if (payload && payload.state) {
      state = payload.state;
      renderAll();
    }
  });

  sbChannel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      mpRole = 'CLIENT';
      mpRoomCode = cleanCode;
      mpClientTeamId = tid;
      mpClientName = fname;
      saveMpSession();
      await sbChannel.track({ role: 'CLIENT', teamId: tid, name: fname });
      sbChannel.send({ type: 'broadcast', event: 'action', payload: { type: 'JOIN', teamId: tid, name: fname } });
      document.getElementById('onlineStatusPill').textContent = '🟢 CONNECTED';
      document.getElementById('onlineStatusPill').className = 'pill pill-live';
      document.getElementById('joinRoomBox').style.display = 'none';
      document.getElementById('clientConnectedBox').style.display = 'block';
      document.getElementById('clientTeamBadge').textContent = tid;
      document.getElementById('clientNameBadge').textContent = fname;
      document.getElementById('clientRoomBadge').textContent = cleanCode;
      sfxTrade();
      showToast(`🟢 Joined Live Auction as ${tid}! Refreshing browser will keep your seat.`);
      switchView('stage');
    }
  });
}

function leaveOnlineRoom(){
  const client = getSupabaseClient();
  if (sbChannel && client) { try { client.removeChannel(sbChannel); } catch(e){} }
  sbChannel = null;
  mpRole = 'SOLO';
  mpClientTeamId = '';
  saveMpSession();
  document.getElementById('onlineStatusPill').textContent = 'OFFLINE';
  document.getElementById('onlineStatusPill').className = 'pill';
  document.getElementById('joinRoomBox').style.display = 'block';
  document.getElementById('clientConnectedBox').style.display = 'none';
  document.getElementById('hostRoomBox').style.display = 'none';
  renderAll();
}

function pushFriendChatSystem(text){
  if (!state.friendsChat) state.friendsChat = [];
  state.friendsChat.unshift({ sender:'SYSTEM', color:'#10b981', text });
  state.friendsChat = state.friendsChat.slice(0, 30);
  renderFriendsChat();
}

function sendFriendChat(preset){
  const inp = document.getElementById('friendsChatInput');
  const txt = (preset || (inp ? inp.value : '') || '').trim();
  if (!txt) return;
  if (inp && !preset) inp.value = '';

  if (mpRole === 'CLIENT' && sbChannel) {
    sbChannel.send({ type: 'broadcast', event: 'action', payload: { type: 'CHAT', teamId: mpClientTeamId, name: mpClientName, text: txt } });
    return;
  }
  const senderLabel = mpRole === 'HOST' ? 'Host (Auctioneer)' : (state.humanTeamId ? `${state.humanTeamId} GM` : 'Auctioneer');
  if (!state.friendsChat) state.friendsChat = [];
  state.friendsChat.unshift({ sender: senderLabel, color:'var(--gold)', text: txt });
  state.friendsChat = state.friendsChat.slice(0, 30);
  renderFriendsChat();
  saveState();
}

function renderFriendsChat(){
  const feed = document.getElementById('friendsChatFeed');
  if (!feed) return;
  if (!state.friendsChat || !state.friendsChat.length) {
    feed.innerHTML = `<div class="msg">🏟️ Welcome to the Friends Room! Invite your squad and drop live auction banter here.</div>`;
    return;
  }
  feed.innerHTML = state.friendsChat.map(m =>
    `<div class="msg" style="border-left-color:${m.color}"><b style="color:${m.color}">${m.sender}:</b> ${m.text}</div>`
  ).join('');
}

function renderFriendsHub(){
  const grid = document.getElementById('friendsSeatsGrid');
  const joinSel = document.getElementById('joinTeamSelect');
  const badge = document.getElementById('mpModeBadge');
  const tSel = document.getElementById('bidTimerSelect');
  if (tSel) tSel.value = String(state.bidTimerSec || 0);

  if (joinSel && !joinSel.options.length) {
    TEAMS_META.forEach(t => joinSel.add(new Option(`${t.id} — ${t.name}`, t.id)));
  }

  const humanCount = state.teams.filter(t => t.isHuman).length;
  if (badge) {
    badge.textContent = mpRole === 'HOST' ? `🌐 HOSTING (${humanCount} HUMAN)` : mpRole === 'CLIENT' ? `🌐 ONLINE (${mpClientTeamId})` : humanCount >= 2 ? `👥 ${humanCount} REAL FRIENDS` : '🤖 SOLO / AI MODE';
  }

  renderFriendsChat();
  if (!grid) return;
  grid.innerHTML = state.teams.map(t => `
    <div class="seat-card" style="border-top:3px solid ${t.color}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="display:inline-flex;align-items:center;gap:5px">${getTeamLogo(t.id, 18)}<b style="color:${t.color}">${t.id} <span style="font-size:11px;color:var(--muted);font-weight:500">(${fmtCr(t.purse)})</span></b></span>
        <button class="btn btn-sm ${t.isHuman?'btn-blue':''}" style="padding:4px 8px;font-size:10.5px" onclick="toggleSeatHuman('${t.id}')">${t.isHuman?'👤 Human':'🤖 AI Bot'}</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="online-dot ${onlinePeerTeams[t.id]?'live':''}"></span>
        <input type="text" class="input-box" style="padding:6px 8px;font-size:12px" value="${(t.ownerName||'').replace(/"/g,'&quot;')}" placeholder="Friend's Name..." onchange="updateSeatOwner('${t.id}', this.value)" />
      </div>
    </div>`).join('');
}

// Auto-recover seat on browser refresh OR detect ?room=IPL-XXXX invite link!
(function checkMpRecoveryAndInvite(){
  try {
    const saved = sessionStorage.getItem(MP_SESSION_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      setTimeout(() => {
        if (s.role === 'HOST' && s.roomCode) hostOnlineRoom(s.roomCode);
        else if (s.role === 'CLIENT' && s.roomCode && s.teamId) joinOnlineRoom(s.roomCode, s.name, s.teamId);
      }, 450);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const rCode = params.get('room');
    if (rCode) {
      setTimeout(() => {
        const inp = document.getElementById('joinCodeInput');
        if (inp) inp.value = rCode.toUpperCase();
        switchView('friends');
        showToast(`🌐 Invite Link detected (${rCode.toUpperCase()})! Enter your name, pick your team & tap Join.`);
      }, 350);
    }
  } catch(e){}
})();
