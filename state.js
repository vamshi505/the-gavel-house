// ============================================================================
// THE GAVEL HOUSE — STATE, AUDIO FX, SPEECH SYNTHESIS, RULES & CONFETTI
// ============================================================================
// ==================== 3. STATE, AUDIO SUITE & STRICT ENGLISH DUAL VOICE ====================
const SAVE_KEY = 'ipl_mega_auction_v32';
let state = null;
let autoRunning = false;
let acceleratorMode = false;
let soundOn = true;
let voiceOn = true;
let audioCtx = null;
let masterFilter = 'ALL';
let selectedSquadTab = 'CSK';
let activeTalkTarget = 'ALL';
let cachedVoices = [];
let huddleInterval = null;
let huddleStepTimers = [];
let huddleSecLeft = 120;
let huddleResumeAuto = false;

if ('speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    updateVoiceInfoLabel();
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function getEnglishVoices(){
  if (!cachedVoices.length && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
  return cachedVoices.filter(v => v.lang && /^en([-_][A-Za-z]+)?$/i.test(v.lang.trim()));
}

const MALE_VOICE_KEY = 'ipl_2026_male_voice_uri';
function getSavedMaleVoiceURI(){ try { return localStorage.getItem(MALE_VOICE_KEY) || ''; } catch(e){ return ''; } }
function setCustomMaleVoice(uri){
  try {
    if (uri) localStorage.setItem(MALE_VOICE_KEY, uri);
    else localStorage.removeItem(MALE_VOICE_KEY);
  } catch(e){}
  updateVoiceInfoLabel();
  speakMale('Going once! Going twice! Sold!');
}

function pickEnglishVoice(gender){
  const en = getEnglishVoices();
  if (!en.length) return null;

  // Android Google TTS voice codes + Desktop/iOS names
  const femaleRx = /(female|woman|zira|samantha|heera|veena|karen|tessa|moira|aria|jenny|neerja|sonia|libby|susan|victoria|kate|sara|emma|olivia|ava|allison|en-in-x-ena|en-in-x-enc|en-in-x-ahp|en-gb-x-gba|en-gb-x-gbc|en-us-x-sfg|en-us-x-tpc|en-us-x-iog|en-au-x-aua|en-au-x-auc)/i;
  const maleRx = /(\bmale\b|david|rishi|prabhat|daniel|alex|mark|george|ryan|guy|james|arthur|oliver|william|thomas|brian|andrew|christopher|en-in-x-end|en-in-x-ene|en-gb-x-gbb|en-gb-x-gbd|en-gb-x-rjs|en-us-x-iom|en-us-x-iob|en-us-x-tpd|en-us-x-tpf|en-au-x-aub|en-au-x-aud)/i;

  if (gender === 'female') {
    return en.find(v => /en[-_]IN/i.test(v.lang) && femaleRx.test(v.name))
        || en.find(v => femaleRx.test(v.name) && !maleRx.test(v.name))
        || en.find(v => /en[-_]IN/i.test(v.lang))
        || en[0];
  } else {
    const customURI = getSavedMaleVoiceURI();
    if (customURI) {
      const customV = en.find(v => v.voiceURI === customURI || v.name === customURI);
      if (customV) return customV;
    }
    return en.find(v => /en[-_]IN/i.test(v.lang) && maleRx.test(v.name))
        || en.find(v => /en[-_](GB|US|AU)/i.test(v.lang) && maleRx.test(v.name))
        || en.find(v => maleRx.test(v.name))
        || en.find(v => /en[-_](GB|US)/i.test(v.lang) && !femaleRx.test(v.name))
        || en.find(v => /en[-_]IN/i.test(v.lang))
        || en[0];
  }
}

function updateVoiceInfoLabel(){
  const el = document.getElementById('voiceInfoLabel');
  const sel = document.getElementById('maleVoiceSelect');
  const en = getEnglishVoices();
  const savedURI = getSavedMaleVoiceURI();
  if (sel && en.length) {
    sel.innerHTML = `<option value="">Auto-Detect English Male Voice</option>` +
      en.map(v => `<option value="${v.voiceURI}" ${v.voiceURI===savedURI?'selected':''}>${v.name} (${v.lang})</option>`).join('');
  }
  if (!el) return;
  const f = pickEnglishVoice('female'), m = pickEnglishVoice('male');
  el.textContent = `Female: ${f ? f.name + ' (' + f.lang + ')' : 'Default EN'} • Male: ${m ? m.name + ' (' + m.lang + ')' : 'Default EN (Deep)'}`;
}

let speechQueueToken = 0;

function stopDiscussionSpeech(){
  speechQueueToken++;
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch(e){}
  }
}

function cleanSpeechText(raw){
  return String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[🏏🔥⚡😈🤯📊💬🔨✕⏱️🧠📋✅🛑🎉💎💸🌟🏆🧡💜🤎👑🧤🚑🔒🃏🔐🤝💵🔄📢🎙️🗣️👥🌐🚀🔌]/g, ' ')
    .replace(/₹\s*(\d+(?:\.\d+)?)\s*Cr/gi, '$1 Crore')
    .replace(/₹\s*(\d+(?:\.\d+)?)\s*L/gi, '$1 Lakhs')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTeamVoiceProfile(teamId, staffIndex=0){
  const idx = Math.max(0, TEAMS_META.findIndex(x => x.id === teamId));
  // SRH Owner Kavya Maran uses Female voice in huddles; other franchises get distinct pitch variations
  if (teamId === 'SRH' && staffIndex === 2) return { gender: 'female', pitch: 1.14, rate: 1.06 };
  const malePitches = [0.76, 0.84, 0.92, 0.80, 0.88, 0.96, 0.74, 0.90, 0.82, 0.98];
  const basePitch = malePitches[idx % malePitches.length];
  const roleOffset = staffIndex === 0 ? -0.05 : staffIndex === 1 ? 0.07 : 0.02;
  return { gender: 'male', pitch: Math.max(0.62, Math.min(1.12, basePitch + roleOffset)), rate: 1.05 };
}

function toggleAccelerator(){
  acceleratorMode = !acceleratorMode;
  const b = document.getElementById('btnAccel');
  if (b) {
    b.textContent = acceleratorMode ? '⏩ Accel: ON' : '⏩ Accel: OFF';
    b.className = acceleratorMode ? 'btn btn-warn' : 'btn';
  }
  const b2 = document.getElementById('btnAiAuctAccel');
  if (b2) {
    b2.textContent = acceleratorMode ? '⏩ Accel: ON' : '⏩ Accel: OFF';
    b2.className = acceleratorMode ? 'btn btn-sm btn-warn' : 'btn btn-sm';
  }
  beep(acceleratorMode ? 960 : 480, 0.08, 'triangle', 0.14);
  showToast(acceleratorMode
    ? '⏩ Accel ON — Fast Bids (Huddles, Team Discussions & Male Gavel Voices Stay Active!)'
    : 'Accelerator OFF — Full Live-Bid + Discussion Voices');
}

window._activeUtterance = null;

function splitIntoSpeechChunks(text, maxLen=135){
  const clean = cleanSpeechText(text);
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];
  // Split cleanly on sentence boundaries first, then commas if still long
  const rawParts = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  for (const part of rawParts) {
    if (part.length <= maxLen) {
      chunks.push(part);
    } else {
      const sub = part.split(/(?<=[,;:])\s+/);
      let buf = '';
      for (const s of sub) {
        if ((buf + ' ' + s).trim().length <= maxLen) {
          buf = (buf + ' ' + s).trim();
        } else {
          if (buf) chunks.push(buf);
          buf = s;
        }
      }
      if (buf) chunks.push(buf);
    }
  }
  return chunks.filter(Boolean);
}

function speakAsync(text, gender, opts={}){
  return new Promise(resolve => {
    const isLiveBid = Boolean(opts && opts.isLiveBid);
    if ((acceleratorMode && isLiveBid) || !voiceOn || !('speechSynthesis' in window)) { resolve(); return; }
    const spoken = cleanSpeechText(text);
    if (!spoken) { resolve(); return; }

    const shouldCancel = opts.interrupt !== false;
    const launchUtterance = () => {
      try {
        if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(spoken);
        window._activeUtterance = u; // Prevent Android/Chrome GC from dropping onend!
        const v = pickEnglishVoice(gender);
        if (v) { u.voice = v; u.lang = v.lang; }
        else { u.lang = 'en-IN'; }
        u.pitch = (typeof opts.pitch === 'number') ? opts.pitch : (gender === 'female' ? 1.16 : 0.66);
        u.rate = (typeof opts.rate === 'number') ? opts.rate : (gender === 'female' ? 1.14 : 0.96);

        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            clearTimeout(safety);
            if (window._activeUtterance === u) window._activeUtterance = null;
            resolve();
          }
        };
        u.onend = finish;
        u.onerror = finish;
        // Generous timeout (up to 28s) so full statements NEVER get cut off mid-sentence
        const estMs = Math.min(28000, Math.max(4000, spoken.length * 120));
        const safety = setTimeout(finish, estMs);
        window.speechSynthesis.speak(u);
      } catch(e){ resolve(); }
    };

    if (shouldCancel) {
      try { window.speechSynthesis.cancel(); } catch(e){}
      // 70ms settle delay avoids Chrome/Android race condition that swallows new utterances after cancel()
      setTimeout(launchUtterance, 95);
    } else {
      launchUtterance();
    }
  });
}
function speakBidFemale(text){
  const fastRate = (typeof aiAuctSpeedLevel !== 'undefined' && aiAuctSpeedLevel === 3) ? 1.32 : (typeof aiAuctSpeedLevel !== 'undefined' && aiAuctSpeedLevel === 2) ? 1.24 : 1.16;
  return speakAsync(text, 'female', { isLiveBid: true, interrupt: true, pitch: 1.16, rate: fastRate });
}
function speakFemale(text){ return speakAsync(text, 'female', { isLiveBid: false, interrupt: true, pitch: 1.16, rate: 1.08 }); }
function speakMale(text){ return speakAsync(text, 'male', { isLiveBid: false, interrupt: true, pitch: 0.68, rate: 0.96 }); }

async function speakDiscussionQueue(items){
  if (!voiceOn || !items || !items.length) return;
  const myToken = ++speechQueueToken;
  try { window.speechSynthesis.cancel(); } catch(e){}
  await new Promise(r => setTimeout(r, 90));

  for (const item of items) {
    if (myToken !== speechQueueToken || !voiceOn) break;
    const chunks = splitIntoSpeechChunks(item.text, 135);
    for (const chunk of chunks) {
      if (myToken !== speechQueueToken || !voiceOn) break;
      await speakAsync(chunk, item.gender || 'male', {
        isLiveBid: false,
        interrupt: false, // Never cancel mid-queue — guarantees zero skipped statements!
        pitch: item.pitch,
        rate: item.rate || 1.02
      });
      if (myToken !== speechQueueToken || !voiceOn) break;
      await new Promise(r => setTimeout(r, 120));
    }
    if (myToken !== speechQueueToken || !voiceOn) break;
    await new Promise(r => setTimeout(r, 260));
  }
}

function initFreshState(){
  state = {
    seed: Math.floor(Math.random() * 10000),
    players: buildInitialPlayers(),
    teams: TEAMS_META.map(t => ({ ...t, purse:12000, squad:[], customXI:null, customImpact:null, captainId:null, vcId:null, rtmCards:2, isHuman:false, ownerName:'AI Bot', xiNote:'', chatter:'Ready at table.', lastFlash:0 })),
    curId: null,
    curBid: 0,
    curLeader: null,
    gavelStage: 0,
    biddersThisLot: [],
    overpayWarned: false,
    huddleDoneThisLot: false,
    inflatingTeam: null,
    persuasionBoost: {},
    lotCommitments: {},
    warLog: [],
    bidPoints: [],
    reactions: ['🏟️ All 10 franchise tables are mic\'d up & players are freshly shuffled!'],
    tickerItems: ['IPL FLOODLIGHT MEGA AUCTION • SHUFFLED SETS • ₹25 CR CAP • STRICT 25-PLAYER SQUAD LIMIT • ALL 10 TEAMS ACTIVE'],
    tradesUnlocked: false,
    tradeProposals: [],
    tradeHistory: [],
    injuryRequests: [],
    injuryHistory: [],
    theme: 'hud',
    humanTeamId: '',
    retentionsDone: false,
    bidHistory: [],
    passedTeams: [],
    bidTimerSec: 0,
    maxBidCap: 2500,
    startingPurse: 12000,
    soldOrder: [],
    wishlist: [],
    scoutCache: {},
    scoutSuitability: {},
    friendsChat: [],
    midSeasonLoanDone: false,
    playerForm: {},
    seasonData: null
  };
}

function loadState(){
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.players && parsed.players.length >= 520) {
        state = parsed;
        if (!state.reactions) state.reactions = [];
        if (!state.biddersThisLot) state.biddersThisLot = [];
        if (!state.injuryRequests) state.injuryRequests = [];
        if (!state.injuryHistory) state.injuryHistory = [];
        if (!state.lotCommitments) state.lotCommitments = {};
        if (!state.playerForm) state.playerForm = {};
        state.teams.forEach(t => { if (t.rtmCards === undefined) t.rtmCards = 2; if (t.isHuman === undefined) t.isHuman = false; if (!t.ownerName) t.ownerName = t.isHuman ? 'Friend' : 'AI Bot'; });
        if (!state.bidHistory) state.bidHistory = [];
        if (!state.passedTeams) state.passedTeams = [];
        if (!state.friendsChat) state.friendsChat = [];
        if (!state.soldOrder) state.soldOrder = [];
        if (!state.wishlist) state.wishlist = [];
        if (!state.scoutCache) state.scoutCache = {};
        if (!state.scoutSuitability) state.scoutSuitability = {};
        MAX_BID_CAP = state.maxBidCap || 2500;
        STARTING_PURSE = state.startingPurse || 12000;
        ensurePlayerSplitStats(state.players);
        applyTheme(state.theme === 'dark' ? 'dark' : 'hud');
        return;
      }
    }
  } catch(e){}
  initFreshState();
}

function saveState(notify=false){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e){}
  broadcastRoomState();
  if (notify) showToast('Auction progress saved!');
}

function getCtx(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function beep(freq, dur, type='sine', vol=0.12, delay=0){
  if (!soundOn) return;
  try {
    const ctx = getCtx();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur);
  } catch(e){}
}

function sfxPaddle(){ beep(620, 0.08, 'triangle', 0.13, 0); beep(880, 0.09, 'triangle', 0.11, 0.055); }
function sfxHijack(){ beep(880, 0.10, 'sawtooth', 0.11, 0); beep(1175, 0.12, 'sawtooth', 0.12, 0.08); beep(1480, 0.15, 'sawtooth', 0.12, 0.16); }
function sfxOnce(){ beep(440, 0.18, 'sine', 0.15, 0); beep(554, 0.16, 'sine', 0.10, 0.12); }
function sfxTwice(){ beep(587, 0.14, 'triangle', 0.16, 0); beep(740, 0.18, 'triangle', 0.15, 0.11); }
function sfxGavel(){ beep(165, 0.15, 'square', 0.22, 0); beep(110, 0.22, 'square', 0.20, 0.11); }
function sfxUnsold(){ beep(220, 0.14, 'sine', 0.14, 0); beep(150, 0.22, 'sine', 0.12, 0.12); }
function sfxTrade(){ beep(523, 0.09, 'triangle', 0.12, 0); beep(659, 0.09, 'triangle', 0.12, 0.08); beep(784, 0.16, 'triangle', 0.14, 0.16); }

function sfxCrowdRoar(duration=1.35){
  if (!soundOn) return;
  try {
    const ctx = getCtx();
    const bufSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.04 * white)) / 1.04;
      lastOut = data[i];
      data[i] *= 2.8;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(550, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + duration * 0.45);
    filter.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + duration);
    filter.Q.value = 0.85;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.24, ctx.currentTime + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    noise.start(); noise.stop(ctx.currentTime + duration);
  } catch(e){}
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._tm); t._tm = setTimeout(()=>t.classList.remove('show'), 2600);
}

function addReaction(htmlText, borderColor='#f5c542'){
  state.reactions.unshift({ text: htmlText, color: borderColor });
  state.reactions = state.reactions.slice(0, 14);
  renderReactions();
}


// ==================== CUSTOM AUCTION RULES (STARTING PURSE & MAX BID CAP) ====================
function updateCustomRules(){
  const newPurse = parseInt(document.getElementById('rulePurseSelect').value, 10) || 12000;
  const newCap = parseInt(document.getElementById('ruleCapSelect').value, 10) || 2500;
  const soldAny = state.players.some(p => p.status === 'SOLD');

  state.maxBidCap = newCap;
  MAX_BID_CAP = newCap;

  if (!soldAny) {
    state.startingPurse = newPurse;
    STARTING_PURSE = newPurse;
    state.teams.forEach(t => t.purse = newPurse);
    showToast(`✅ Rules updated: ${fmtCr(newPurse)} Purse • ${newCap > 50000 ? 'Unlimited' : fmtCr(newCap)} Bid Cap!`);
  } else {
    showToast(`✅ Max Bid Cap updated to ${newCap > 50000 ? 'Unlimited' : fmtCr(newCap)}! (Reset auction to change starting purse.)`);
  }
  const capTxt = newCap > 50000 ? 'No Cap' : `${fmtCr(newCap)} Cap`;
  document.getElementById('hdrSub').textContent = `520 Shuffled Players • ${fmtCr(state.startingPurse || 12000)} Purse • ${capTxt}`;
  renderAll(); saveState();
}

// ==================== REPLAY NEW SEASON WITH SAME 10 SQUADS ====================
function replayNewSeason(){
  if (!confirm('Start a fresh 74-match IPL Season using your current 10 squads & Playing XIIs?')) return;
  state.seasonData = null;
  state.midSeasonLoanDone = false;
  state.playerForm = {};
  state.injuryHistory = [];
  // Heal injured players back into Unsold pool if needed
  state.players.forEach(p => { if (p.status === 'INJURED') { p.status = 'UNSOLD'; p.injured = false; } });
  ensureSeasonInitialized();
  sfxTrade();
  showToast('🔄 New Season Ready! Tap ▶ Next Match to begin Season 2!');
  renderAll(); saveState();
}

// ==================== BROADCAST CONFETTI ENGINE (PURE CANVAS) ====================
function fireConfetti(primaryColor='#00e5ff'){
  const cvs = document.getElementById('confettiCanvas');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  const colors = [primaryColor, '#facc15', '#ff6b35', '#10b981', '#ffffff'];
  const pieces = Array.from({ length: 75 }, () => ({
    x: cvs.width * (0.2 + Math.random() * 0.6),
    y: cvs.height * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 4,
    size: 5 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 14
  }));
  let frame = 0;
  function step(){
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.38; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (++frame < 95) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, cvs.width, cvs.height);
  }
  requestAnimationFrame(step);
}



