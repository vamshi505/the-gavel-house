// ============================================================================
// THE GAVEL HOUSE — INTERNATIONAL CRICKET MANAGER CAREER (v50)
// Top 10 ICC Men's T20I Teams (Nov 2026) • 150 Active Players • Bilateral & World Cup
// ============================================================================

const INTL_TEAMS_DATA = [
  {
    id:'ENG', name:'England', rank:1, rating:268, color:'#e11d48', accent:'#1e3a8a', text:'#ffffff',
    home:"Lord's / Edgbaston (True bounce, fast outfield)",
    players:[
      ['Harry Brook','B',91,152,null,'Middle Enforcer','R','—',true],
      ['Phil Salt','WK',90,174,null,'WK Opener','R','—'],
      ['Jos Buttler','WK',92,149,null,'WK Opener','R','—'],
      ['Ben Duckett','B',86,148,null,'PP Opener','L','—'],
      ['Tom Banton','WK',84,146,null,'WK Opener','R','—'],
      ['Jacob Bethell','AR',85,148,8.10,'Spin AR','L','SLA'],
      ['Will Jacks','AR',87,162,8.50,'Middle Enforcer','R','Off'],
      ['Sam Curran','AR',86,138,8.95,'Pace AR','L','LAF'],
      ['Liam Dawson','AR',82,126,7.40,'Spin AR','R','SLA'],
      ['Jamie Overton','AR',83,156,9.00,'Finisher AR','R','RAF'],
      ['Rehan Ahmed','BW',82,110,7.85,'Middle Spin','R','Leg'],
      ['Jofra Archer','BW',92,128,7.45,'Death Pace','R','RAF'],
      ['Adil Rashid','BW',91,82,7.35,'Mystery Spin','R','Leg'],
      ['Josh Tongue','BW',83,70,8.45,'Express Pace','R','RAF'],
      ['Luke Wood','BW',82,76,8.55,'PP Swing Pace','L','LAF']
    ]
  },
  {
    id:'IND', name:'India', rank:2, rating:267, color:'#0284c7', accent:'#f97316', text:'#ffffff',
    home:'Wankhede / Ahmedabad (High-scoring, true bounce)',
    players:[
      ['Suryakumar Yadav','B',94,166,null,'Middle Enforcer','R','—',true],
      ['Abhishek Sharma','AR',90,174,8.20,'PP Opener','L','SLA'],
      ['Sanju Samson','WK',89,151,null,'WK Opener','R','—'],
      ['Tilak Varma','B',90,154,null,'Middle Enforcer','L','Off'],
      ['Ishan Kishan','WK',86,138,null,'WK Opener','L','—'],
      ['Hardik Pandya','AR',93,148,8.50,'Finisher AR','R','RAF'],
      ['Rinku Singh','B',88,162,null,'Death Finisher','L','—'],
      ['Shivam Dube','AR',86,148,9.10,'Finisher AR','L','RAF'],
      ['Axar Patel','AR',90,134,7.25,'Spin AR','L','SLA'],
      ['Washington Sundar','AR',85,122,7.30,'Spin AR','L','Off'],
      ['Jasprit Bumrah','BW',96,65,6.65,'Death Pace','R','RAF'],
      ['Arshdeep Singh','BW',91,72,8.10,'Death Pace','L','LAF'],
      ['Varun Chakaravarthy','BW',91,60,7.15,'Mystery Spin','R','Leg'],
      ['Kuldeep Yadav','BW',90,80,7.40,'Mystery Spin','L','Leg'],
      ['Mohammed Siraj','BW',87,70,8.25,'PP Swing Pace','R','RAF']
    ]
  },
  {
    id:'AUS', name:'Australia', rank:3, rating:260, color:'#facc15', accent:'#15803d', text:'#090d16',
    home:'MCG / Perth (Express pace & big boundaries)',
    players:[
      ['Mitchell Marsh','AR',89,140,8.80,'Pace AR','R','RAF',true],
      ['Travis Head','B',93,168,null,'PP Opener','L','Off'],
      ['Josh Inglis','WK',88,156,null,'WK Middle','R','—'],
      ['Cameron Green','AR',88,152,8.85,'Pace AR','R','RAF'],
      ['Glenn Maxwell','AR',89,158,7.90,'Finisher AR','R','Off'],
      ['Tim David','B',88,168,null,'Death Finisher','R','—'],
      ['Marcus Stoinis','AR',87,144,8.95,'Finisher AR','R','RAF'],
      ['Steve Smith','B',85,130,null,'Top Anchor','R','—'],
      ['Cooper Connolly','AR',82,138,7.80,'Spin AR','L','SLA'],
      ['Matthew Renshaw','B',81,132,null,'Middle Enforcer','L','—'],
      ['Nathan Ellis','BW',88,88,7.95,'Death Pace','R','RAF'],
      ['Xavier Bartlett','BW',85,84,8.10,'PP Swing Pace','R','RAF'],
      ['Ben Dwarshuis','BW',84,124,8.35,'PP Swing Pace','L','LAF'],
      ['Adam Zampa','BW',90,72,7.40,'Mystery Spin','R','Leg'],
      ['Matthew Kuhnemann','BW',81,68,7.60,'Middle Spin','L','SLA']
    ]
  },
  {
    id:'NZ', name:'New Zealand', rank:4, rating:248, color:'#1e293b', accent:'#14b8a6', text:'#ffffff',
    home:'Eden Park / Wellington (Drop-in decks, short straight)',
    players:[
      ['Mitchell Santner','AR',89,128,7.05,'Spin AR','L','SLA',true],
      ['Finn Allen','WK',86,164,null,'WK Opener','R','—'],
      ['Devon Conway','WK',86,136,null,'WK Opener','L','—'],
      ['Tim Seifert','WK',85,144,null,'WK Opener','R','—'],
      ['Rachin Ravindra','AR',88,146,8.05,'PP Opener','L','SLA'],
      ['Glenn Phillips','B',89,150,7.80,'Death Finisher','R','Off'],
      ['Daryl Mitchell','AR',87,138,8.65,'Middle Enforcer','R','RAF'],
      ['Mark Chapman','B',84,142,null,'Middle Enforcer','L','—'],
      ['James Neesham','AR',83,152,9.20,'Finisher AR','L','RAF'],
      ['Cole McConchie','AR',80,126,7.75,'Spin AR','R','Off'],
      ['Lockie Ferguson','BW',89,90,8.25,'Express Pace','R','RAF'],
      ['Matt Henry','BW',89,82,7.85,'PP Swing Pace','R','RAF'],
      ['Kyle Jamieson','BW',85,112,8.45,'Express Pace','R','RAF'],
      ['Jacob Duffy','BW',86,74,8.00,'PP Swing Pace','R','RAF'],
      ['Ish Sodhi','BW',84,78,7.95,'Middle Spin','R','Leg']
    ]
  },
  {
    id:'SA', name:'South Africa', rank:5, rating:243, color:'#15803d', accent:'#facc15', text:'#ffffff',
    home:'Wanderers / Centurion (Pace, bounce & altitude)',
    players:[
      ['Aiden Markram','B',88,140,8.10,'Top Anchor','R','Off',true],
      ['Quinton de Kock','WK',88,140,null,'WK Opener','L','—'],
      ['Ryan Rickelton','WK',86,144,null,'WK Opener','L','—'],
      ['Tristan Stubbs','B',89,165,null,'Death Finisher','R','Off'],
      ['Dewald Brevis','B',85,152,null,'Middle Enforcer','R','Leg'],
      ['David Miller','B',88,144,null,'Death Finisher','L','—'],
      ['Donovan Ferreira','WK',84,158,null,'WK Finisher','R','Off'],
      ['Marco Jansen','AR',89,130,8.35,'Pace AR','L','LAF'],
      ['Corbin Bosch','AR',84,136,8.40,'Pace AR','R','RAF'],
      ['George Linde','AR',83,134,7.45,'Spin AR','L','SLA'],
      ['Kagiso Rabada','BW',91,88,8.15,'Death Pace','L','RAF'],
      ['Anrich Nortje','BW',88,75,8.45,'Express Pace','R','RAF'],
      ['Lungi Ngidi','BW',85,70,8.30,'PP Swing Pace','R','RAF'],
      ['Keshav Maharaj','BW',86,86,7.25,'Middle Spin','R','SLA'],
      ['Kwena Maphaka','BW',83,70,8.50,'Express Pace','L','LAF']
    ]
  },
  {
    id:'PAK', name:'Pakistan', rank:6, rating:241, color:'#059669', accent:'#a3e635', text:'#ffffff',
    home:'Gaddafi Lahore / Rawalpindi (Flat batting & reverse swing)',
    players:[
      ['Salman Ali Agha','AR',85,136,7.90,'Middle Enforcer','R','Off',true],
      ['Saim Ayub','B',87,148,null,'PP Opener','L','Off'],
      ['Fakhar Zaman','B',86,142,null,'PP Opener','L','—'],
      ['Babar Azam','B',89,130,null,'Top Anchor','R','—'],
      ['Sahibzada Farhan','B',83,140,null,'PP Opener','R','—'],
      ['Usman Khan','WK',83,144,null,'WK Middle','R','—'],
      ['Shadab Khan','AR',86,142,7.60,'Spin AR','R','Leg'],
      ['Mohammad Nawaz','AR',83,132,7.45,'Spin AR','L','SLA'],
      ['Faheem Ashraf','AR',82,135,8.45,'Pace AR','L','RAF'],
      ['Khawaja Nafay','B',81,146,null,'Middle Enforcer','R','—'],
      ['Shaheen Shah Afridi','BW',91,98,7.95,'PP Swing Pace','L','LAF'],
      ['Naseem Shah','BW',88,84,8.05,'Express Pace','R','RAF'],
      ['Abrar Ahmed','BW',86,65,7.30,'Mystery Spin','R','Leg'],
      ['Mohammad Salman Mirza','BW',81,72,8.35,'Express Pace','L','LAF'],
      ['Usman Tariq','BW',82,66,7.55,'Mystery Spin','R','Off']
    ]
  },
  {
    id:'WI', name:'West Indies', rank:7, rating:236, color:'#881337', accent:'#facc15', text:'#ffffff',
    home:'Kensington Oval / Trinidad (Power-hitting & spin grip)',
    players:[
      ['Shai Hope','WK',86,138,null,'WK Middle','R','—',true],
      ['Brandon King','B',85,138,null,'PP Opener','R','—'],
      ['Johnson Charles','WK',83,144,null,'WK Opener','R','—'],
      ['Evin Lewis','B',84,152,null,'PP Opener','L','—'],
      ['Shimron Hetmyer','B',86,152,null,'Death Finisher','L','—'],
      ['Rovman Powell','B',86,148,null,'Death Finisher','R','RAF'],
      ['Sherfane Rutherford','B',85,150,null,'Death Finisher','L','RAF'],
      ['Romario Shepherd','AR',86,174,9.20,'Finisher AR','R','RAF'],
      ['Jason Holder','AR',85,130,8.55,'Pace AR','R','RAF'],
      ['Roston Chase','AR',84,132,7.55,'Spin AR','R','Off'],
      ['Akeal Hosein','BW',87,108,7.05,'Mystery Spin','L','SLA'],
      ['Gudakesh Motie','BW',86,86,7.20,'Middle Spin','L','SLA'],
      ['Shamar Joseph','BW',85,84,8.55,'Express Pace','L','RAF'],
      ['Jayden Seales','BW',84,72,8.25,'PP Swing Pace','L','RAF'],
      ['Matthew Forde','AR',82,134,8.35,'Pace AR','R','RAF']
    ]
  },
  {
    id:'BAN', name:'Bangladesh', rank:8, rating:222, color:'#047857', accent:'#ef4444', text:'#ffffff',
    home:'Mirpur Dhaka (Slow turner, spin & cutters)',
    players:[
      ['Litton Das','WK',85,134,null,'WK Opener','R','—',true],
      ['Tanzid Hasan','B',83,138,null,'PP Opener','L','—'],
      ['Parvez Hossain Emon','WK',82,142,null,'WK Opener','L','—'],
      ['Towhid Hridoy','B',85,136,null,'Middle Enforcer','R','—'],
      ['Saif Hassan','AR',81,130,8.10,'Top Anchor','R','Off'],
      ['Shamim Hossain','AR',82,144,8.20,'Death Finisher','L','Off'],
      ['Nurul Hasan','WK',80,132,null,'WK Finisher','R','—'],
      ['Mahedi Hasan','AR',83,124,7.30,'Spin AR','R','Off'],
      ['Mohammad Saifuddin','AR',82,128,8.40,'Pace AR','L','RAF'],
      ['Rishad Hossain','BW',86,126,7.60,'Mystery Spin','R','Leg'],
      ['Nasum Ahmed','BW',83,84,7.25,'Middle Spin','L','SLA'],
      ['Mustafizur Rahman','BW',89,70,7.75,'Death Pace','L','LAF'],
      ['Taskin Ahmed','BW',86,74,8.05,'Express Pace','L','RAF'],
      ['Tanzim Hasan Sakib','BW',83,86,8.25,'PP Swing Pace','R','RAF'],
      ['Shoriful Islam','BW',83,72,8.15,'PP Swing Pace','L','LAF']
    ]
  },
  {
    id:'SL', name:'Sri Lanka', rank:9, rating:221, color:'#1d4ed8', accent:'#facc15', text:'#ffffff',
    home:'R. Premadasa Colombo (Spin-friendly, slingers)',
    players:[
      ['Dasun Shanaka','AR',84,142,8.80,'Finisher AR','R','RAF',true],
      ['Pathum Nissanka','B',88,138,null,'PP Opener','R','—'],
      ['Kusal Mendis','WK',86,138,null,'WK Opener','R','—'],
      ['Kusal Perera','WK',85,144,null,'WK Opener','L','—'],
      ['Charith Asalanka','B',86,138,null,'Middle Enforcer','L','Off'],
      ['Kamindu Mendis','AR',85,138,7.90,'Spin AR','L','Off'],
      ['Kamil Mishara','B',81,134,null,'Top Anchor','L','—'],
      ['Janith Liyanage','AR',82,134,8.45,'Pace AR','R','RAF'],
      ['Pavan Rathnayake','B',80,136,null,'Middle Enforcer','R','—'],
      ['Wanindu Hasaranga','AR',90,132,7.35,'Mystery Spin','R','Leg'],
      ['Dunith Wellalage','AR',84,120,7.25,'Spin AR','L','SLA'],
      ['Maheesh Theekshana','BW',87,74,7.20,'Mystery Spin','R','Off'],
      ['Matheesha Pathirana','BW',90,60,7.80,'Death Pace','R','RAF'],
      ['Dushmantha Chameera','BW',84,74,8.25,'Express Pace','R','RAF'],
      ['Eshan Malinga','BW',83,72,8.20,'Death Pace','R','RAF']
    ]
  },
  {
    id:'AFG', name:'Afghanistan', rank:10, rating:220, color:'#2563eb', accent:'#dc2626', text:'#ffffff',
    home:'Sharjah / Abu Dhabi (Spin paradise & big sixes)',
    players:[
      ['Rashid Khan','BW',94,155,6.65,'Mystery Spin','R','Leg',true],
      ['Rahmanullah Gurbaz','WK',87,146,null,'WK Opener','R','—'],
      ['Ibrahim Zadran','B',85,126,null,'Top Anchor','R','—'],
      ['Sediqullah Atal','B',83,138,null,'PP Opener','L','—'],
      ['Darwish Rasooli','B',81,134,null,'Middle Enforcer','R','—'],
      ['Azmatullah Omarzai','AR',87,138,8.35,'Pace AR','R','RAF'],
      ['Mohammad Nabi','AR',85,136,7.40,'Spin AR','R','Off'],
      ['Gulbadin Naib','AR',83,134,8.65,'Pace AR','R','RAF'],
      ['Mohammad Ishaq','WK',80,136,null,'WK Middle','R','—'],
      ['Shahidullah Kamal','AR',79,126,7.90,'Spin AR','L','SLA'],
      ['Noor Ahmad','BW',89,78,7.30,'Mystery Spin','R','Leg'],
      ['Mujeeb Ur Rahman','BW',86,86,7.25,'Mystery Spin','R','Off'],
      ['Fazalhaq Farooqi','BW',87,64,7.85,'PP Swing Pace','R','LAF'],
      ['Naveen Ul Haq','BW',85,72,8.35,'Death Pace','R','RAF'],
      ['AM Ghazanfar','BW',85,74,6.95,'Mystery Spin','R','Off']
    ]
  }
];

function buildIntlTeamObjects(){
  let pidCounter = 9000;
  return INTL_TEAMS_DATA.map(td => {
    const squad = td.players.map(row => {
      const [name, role, ovr, sr, econ, phase, batHand, bowlStyle, isCap] = row;
      const bat = (role === 'B' || role === 'WK') ? ovr : role === 'AR' ? Math.max(66, ovr - 2) : 34;
      const bowl = role === 'BW' ? ovr : role === 'AR' ? Math.max(66, ovr - 2) : 20;
      return {
        id: pidCounter++, name, role, ovr, bat, bowl, sr, econ, phase, batHand, bowlStyle,
        isCap: Boolean(isCap), os: false, form: [32, 30], fitness: 96
      };
    });
    const xiIds = squad.slice(0, 11).map(p => p.id);
    return {
      id: td.id, name: td.name, rank: td.rank, rating: td.rating,
      color: td.color, accent: td.accent, text: td.text, home: td.home,
      squad, xiIds
    };
  });
}

function ensureIntlCareerState(){
  if (!state.intlCareer) {
    state.intlCareer = {
      unlocked: false,
      teams: buildIntlTeamObjects(),
      myTeamId: '',
      mode: 'SERIES', // 'SERIES' | 'WORLDCUP'
      oppTeamId: 'AUS',
      fixtures: [],
      nextIdx: 0,
      results: [],
      table: {},
      finished: false,
      trophyWon: false
    };
  }
  return state.intlCareer;
}

function checkInternationalCareerUnlock(){
  const ic = ensureIntlCareerState();
  const s = state.seasonData;
  if (s && s.finished && state.humanTeamId && s.champId === state.humanTeamId) {
    ic.unlocked = true;
    saveState();
  }
  return ic.unlocked;
}

function unlockIntlCareerDirect(){
  const ic = ensureIntlCareerState();
  ic.unlocked = true;
  saveState();
  sfxTrade();
  showToast('🌍 International Career Mode Unlocked! Pick any Top 10 Nation!');
  renderIntlHub();
}

function openIntlCareerHub(){
  ensureIntlCareerState();
  checkInternationalCareerUnlock();
  renderIntlHub();
  document.getElementById('intlCareerBackdrop').classList.add('open');
}

function closeIntlCareerHub(){
  document.getElementById('intlCareerBackdrop')?.classList.remove('open');
}

function selectIntlTeam(tid){
  const ic = ensureIntlCareerState();
  ic.myTeamId = tid;
  if (ic.oppTeamId === tid) {
    ic.oppTeamId = ic.teams.find(t => t.id !== tid)?.id || 'AUS';
  }
  saveState();
  renderIntlHub();
}

function swapIntlSquadPlayer(outId, inId){
  const ic = ensureIntlCareerState();
  const team = ic.teams.find(t => t.id === ic.myTeamId);
  if (!team) return;
  const idx = team.xiIds.indexOf(outId);
  if (idx === -1 || team.xiIds.includes(inId)) return;
  team.xiIds[idx] = inId;
  sfxPaddle();
  showToast('🔄 Updated International Playing XI!');
  saveState();
  renderIntlHub();
}

function startIntlTournament(mode){
  const ic = ensureIntlCareerState();
  if (!ic.myTeamId) { showToast('Select one of the Top 10 International Teams first!'); return; }
  ic.mode = mode;
  ic.results = [];
  ic.nextIdx = 0;
  ic.finished = false;
  ic.trophyWon = false;

  if (mode === 'SERIES') {
    const opp = document.getElementById('intlOppSelect')?.value || ic.oppTeamId || 'AUS';
    ic.oppTeamId = opp === ic.myTeamId ? (ic.teams.find(t => t.id !== ic.myTeamId)?.id || 'ENG') : opp;
    ic.fixtures = [
      { label: '1st T20I', t1: ic.myTeamId, t2: ic.oppTeamId },
      { label: '2nd T20I', t1: ic.oppTeamId, t2: ic.myTeamId },
      { label: '3rd T20I (Decider)', t1: ic.myTeamId, t2: ic.oppTeamId }
    ];
  } else {
    // 10-Team ICC T20 World Cup: 5-Team Group (4 group games + Semi-Final + Final!)
    const others = shuffleArr(ic.teams.filter(t => t.id !== ic.myTeamId)).slice(0, 4).map(t => t.id);
    ic.groupTeams = [ic.myTeamId, ...others];
    ic.table = {};
    ic.groupTeams.forEach(id => {
      const tm = ic.teams.find(x => x.id === id);
      ic.table[id] = { id, name: tm.name, color: tm.color, m:0, w:0, l:0, pts:0 };
    });
    ic.fixtures = others.map((oid, i) => ({
      label: `WC Group Match ${i + 1}`,
      t1: i % 2 === 0 ? ic.myTeamId : oid,
      t2: i % 2 === 0 ? oid : ic.myTeamId
    }));
  }
  saveState();
  sfxTrade();
  showToast(mode === 'SERIES' ? `🌍 3-Match T20I Series vs ${ic.oppTeamId} Ready!` : '🏆 ICC T20 World Cup Campaign Started!');
  renderIntlHub();
}

function playNextIntlMatch(){
  const ic = ensureIntlCareerState();
  if (!ic.fixtures.length || ic.finished) { showToast('Start a Series or World Cup campaign first!'); return; }
  const fx = ic.fixtures[ic.nextIdx];
  if (!fx) return;
  const team1 = ic.teams.find(x => x.id === fx.t1);
  const team2 = ic.teams.find(x => x.id === fx.t2);
  if (!team1 || !team2) return;

  const xi1 = team1.xiIds.map(id => team1.squad.find(p => p.id === id)).filter(Boolean);
  const xi2 = team2.xiIds.map(id => team2.squad.find(p => p.id === id)).filter(Boolean);
  const tossWinner = Math.random() < 0.5 ? team1.id : team2.id;
  const decision = Math.random() < 0.55 ? 'BOWL' : 'BAT';
  const batFirstId = decision === 'BAT' ? tossWinner : (tossWinner === team1.id ? team2.id : team1.id);

  closeIntlCareerHub();
  startLiveMatchSimulation(
    { label: `🌍 ${fx.label}`, t1Id: team1.id, t2Id: team2.id, t1: team1, t2: team2, pitch: team1.home, isInternational: true, customXI1: xi1, customXI2: xi2 },
    { tossWinner, decision, batFirstId, dew: 'Light Evening Dew' }
  );
}

function recordIntlMatchResult(winnerId, margin, potm, t1Id, s1, t2Id, s2, batCard1, batCard2, bowlCard1, bowlCard2){
  const ic = ensureIntlCareerState();
  const fx = ic.fixtures[ic.nextIdx];
  if (!fx) return;
  ic.results.push({ label: fx.label, t1: t1Id, s1, t2: t2Id, s2, winner: winnerId, margin, potm });

  // Update player form & fitness in international squads
  const updateSquadForm = (tid, bCard, bwCard) => {
    const tm = ic.teams.find(x => x.id === tid);
    if (!tm) return;
    tm.squad.forEach(p => {
      if (!Array.isArray(p.form)) p.form = [30];
      const b = bCard.find(x => x.name === p.name);
      const bw = bwCard.find(x => x.name === p.name);
      if (b || bw) {
        const pts = (b ? b.r : 0) + (bw ? bw.w * 24 : 0);
        p.form.push(pts);
        if (p.form.length > 3) p.form.shift();
        p.fitness = Math.max(68, (p.fitness || 95) - (5 + Math.floor(Math.random() * 7)));
      } else {
        p.fitness = Math.min(100, (p.fitness || 90) + 12);
      }
    });
  };
  updateSquadForm(t1Id, batCard1, bowlCard2);
  updateSquadForm(t2Id, batCard2, bowlCard1);

  if (ic.mode === 'WORLDCUP' && ic.table[t1Id] && ic.table[t2Id]) {
    ic.table[t1Id].m++; ic.table[t2Id].m++;
    if (winnerId === t1Id) { ic.table[t1Id].w++; ic.table[t1Id].pts += 2; ic.table[t2Id].l++; }
    else { ic.table[t2Id].w++; ic.table[t2Id].pts += 2; ic.table[t1Id].l++; }
  }

  ic.nextIdx++;

  if (ic.mode === 'SERIES' && ic.nextIdx >= ic.fixtures.length) {
    ic.finished = true;
    const myWins = ic.results.filter(r => r.winner === ic.myTeamId).length;
    ic.trophyWon = myWins >= 2;
    showToast(ic.trophyWon ? `🏆 ${ic.myTeamId} WON THE T20I SERIES ${myWins}-${3 - myWins}!` : `Series ended (${myWins}-${3 - myWins}). Start a rematch!`);
  } else if (ic.mode === 'WORLDCUP') {
    if (ic.nextIdx === 4) {
      // Group stage done -> Check Semi-Final!
      const myWins = ic.results.filter(r => r.winner === ic.myTeamId).length;
      if (myWins >= 2) {
        const sfOpp = shuffleArr(ic.teams.filter(t => t.id !== ic.myTeamId))[0].id;
        ic.fixtures.push({ label: '🏆 WC SEMI-FINAL', t1: ic.myTeamId, t2: sfOpp });
        showToast(`🔥 ${ic.myTeamId} qualified for the T20 World Cup Semi-Final vs ${sfOpp}!`);
      } else {
        ic.finished = true;
        showToast(`${ic.myTeamId} bowed out in the Group Stage (${myWins}/4 wins). Try again!`);
      }
    } else if (ic.nextIdx === 5) {
      if (winnerId === ic.myTeamId) {
        const finOpp = shuffleArr(ic.teams.filter(t => t.id !== ic.myTeamId && t.id !== fx.t2))[0].id;
        ic.fixtures.push({ label: '🏆 T20 WORLD CUP FINAL', t1: ic.myTeamId, t2: finOpp });
        showToast(`🔥 THROUGH TO THE WORLD CUP FINAL vs ${finOpp}!`);
      } else {
        ic.finished = true;
        showToast(`Heartbreak in the Semi-Final! Start a new World Cup campaign!`);
      }
    } else if (ic.nextIdx >= 6) {
      ic.finished = true;
      ic.trophyWon = (winnerId === ic.myTeamId);
      if (ic.trophyWon) {
        fireConfetti('#facc15');
        sfxCrowdRoar(1.8);
        showToast(`🏆🌍 ${ic.myTeamId} ARE T20 WORLD CHAMPIONS!`);
      }
    }
  }
  saveState();
}

function renderIntlHub(){
  const ic = ensureIntlCareerState();
  const body = document.getElementById('intlCareerBody');
  const pill = document.getElementById('intlUnlockPill');
  if (!body) return;

  const isGMChamp = Boolean(state.seasonData?.finished && state.humanTeamId && state.seasonData?.champId === state.humanTeamId);
  if (pill) {
    pill.textContent = ic.unlocked ? '🌍 UNLOCKED' : '🔒 WIN IPL AS GM';
    pill.className = 'pill ' + (ic.unlocked ? 'pill-live' : 'pill-warn');
  }

  if (!ic.unlocked) {
    const managedCount = state.gmMatchesManaged || 0;
    body.innerHTML = `
      <div class="msg" style="border-left-color:var(--gold)">
        <b>🏆 SPECIAL CAREER REWARD: MANAGE TOP 10 INTERNATIONAL CRICKET TEAMS!</b><br/>
        Play as an IPL Franchise GM, manage your squad &amp; Playing XI match-by-match, rotate out-of-form players, and <b>win the IPL Cup</b> to earn a national Head Coach contract for any of the Top 10 ICC T20I Nations (ENG, IND, AUS, NZ, SA, PAK, WI, BAN, SL, AFG)!
      </div>
      <div style="background:var(--input-bg);border:1.5px solid var(--card-border);border-radius:6px;padding:10px;font-size:12px">
        <div>🛡️ <b>GM Mode Active:</b> ${state.humanTeamId ? `Yes (${state.humanTeamId})` : 'Not selected yet'}</div>
        <div style="margin-top:4px">🏏 <b>Live Matches Managed:</b> ${managedCount}</div>
        <div style="margin-top:4px">🏆 <b>IPL Cup Won as GM:</b> ${isGMChamp ? '✅ YES!' : 'Not yet'}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px">
        ${ic.teams.map(t => `<div style="background:var(--input-bg);border:1px solid var(--card-border);border-top:3px solid ${t.color};padding:6px 4px;text-align:center;font-size:10.5px;font-family:'IBM Plex Mono',monospace"><b>#${t.rank} ${t.id}</b><div style="font-size:9px;color:var(--muted)">${t.rating} pts</div></div>`).join('')}
      </div>
      <button class="btn btn-gold" style="width:100%" onclick="unlockIntlCareerDirect()">🔓 Unlock Now (Commissioner Pass / Preview)</button>`;
    return;
  }

  const myTeam = ic.teams.find(t => t.id === ic.myTeamId);
  const gridHtml = `
    <div style="font-size:10.5px;font-weight:800;color:var(--gold);font-family:'IBM Plex Mono',monospace;margin-bottom:5px">SELECT NATIONAL TEAM (TOP 10 ICC T20I RANKINGS • NOV 2026)</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:10px">
      ${ic.teams.map(t => `
        <button class="btn btn-sm ${ic.myTeamId===t.id?'btn-gold':''}" style="border-top:3px solid ${t.color};flex-direction:column;padding:6px 3px;gap:1px" onclick="selectIntlTeam('${t.id}')">
          <span>#${t.rank} ${t.id}</span>
          <span style="font-size:8.5px;opacity:0.8">${t.rating}</span>
        </button>`).join('')}
    </div>`;

  if (!myTeam) {
    body.innerHTML = gridHtml + `<div class="msg">👆 Tap any of the Top 10 International Teams above to take charge of their active 15-man T20I squad!</div>`;
    return;
  }

  const xiPlayers = myTeam.xiIds.map(id => myTeam.squad.find(p => p.id === id)).filter(Boolean);
  const benchPlayers = myTeam.squad.filter(p => !myTeam.xiIds.includes(p.id));
  const formTag = (p) => {
    const avg = (p.form && p.form.length) ? p.form.reduce((a,b)=>a+b,0) / p.form.length : 30;
    if (avg >= 42) return '<span style="color:#34d399">🔥 Hot</span>';
    if (avg <= 15) return '<span style="color:#f43f5e">❄️ Cold</span>';
    return '<span style="color:#94a3b8">● Steady</span>';
  };

  const nextFx = (!ic.finished && ic.fixtures[ic.nextIdx]) ? ic.fixtures[ic.nextIdx] : null;
  const oppOpts = ic.teams.filter(t => t.id !== myTeam.id).map(t => `<option value="${t.id}" ${t.id===ic.oppTeamId?'selected':''}>vs #${t.rank} ${t.name}</option>`).join('');

  body.innerHTML = `
    ${gridHtml}
    <div style="background:linear-gradient(135deg,${myTeam.color}33,rgba(8,14,28,0.96));border:1.5px solid ${myTeam.color};border-radius:7px;padding:10px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
        <div>
          <b style="font-size:16px;color:#fff">${myTeam.name.toUpperCase()} — HEAD COACH</b>
          <div style="font-size:11px;color:var(--muted)">ICC Rank #${myTeam.rank} (Rating ${myTeam.rating}) • 📍 ${myTeam.home}</div>
        </div>
        ${ic.trophyWon ? `<span class="pill pill-live">🏆 CHAMPION</span>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:6px;margin-top:8px">
        <select id="intlOppSelect" class="input-box" style="padding:6px 8px;font-size:11px">${oppOpts}</select>
        <button class="btn btn-blue btn-sm" onclick="startIntlTournament('SERIES')">🏏 3-Match Series</button>
        <button class="btn btn-gold btn-sm" onclick="startIntlTournament('WORLDCUP')">🏆 T20 World Cup</button>
      </div>
      ${nextFx ? `<button class="btn btn-green" style="width:100%;margin-top:8px" onclick="playNextIntlMatch()">▶ PLAY LIVE: ${nextFx.label} (${nextFx.t1} vs ${nextFx.t2})</button>` : ''}
    </div>

    ${ic.results.length ? `
      <div style="margin-bottom:8px">
        <div style="font-size:10px;font-weight:800;color:var(--muted);margin-bottom:4px">RECENT INTERNATIONAL RESULTS</div>
        ${ic.results.map(r => `<div class="msg" style="padding:6px 9px;font-size:11px;margin-bottom:4px"><b>${r.label}:</b> ${r.t1} (${r.s1}) vs ${r.t2} (${r.s2}) — 🏆 <b>${r.winner}</b> won by ${r.margin} (POTM: ${r.potm})</div>`).join('')}
      </div>` : ''}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:var(--input-bg);border:1px solid var(--card-border);border-radius:6px;padding:8px">
        <div style="font-size:10px;font-weight:800;color:#34d399;margin-bottom:5px">ACTIVE PLAYING XI (${myTeam.id})</div>
        ${xiPlayers.map((p, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10.5px;padding:3px 0;border-bottom:1px dashed var(--card-border)">
            <span><b>${i+1}.</b> ${p.name}${p.isCap?' ©':''} <small style="color:var(--muted)">(${p.role})</small></span>
            <span>${formTag(p)} <small style="color:#38bdf8">${p.fitness||96}%</small></span>
          </div>`).join('')}
      </div>
      <div style="background:var(--input-bg);border:1px solid var(--card-border);border-radius:6px;padding:8px">
        <div style="font-size:10px;font-weight:800;color:var(--gold);margin-bottom:5px">BENCH (TAP TO ROTATE INTO XI)</div>
        ${benchPlayers.map(bp => {
          const coldestStarter = [...xiPlayers].sort((a,b) => ((a.form?.slice(-1)[0]||30) - (b.form?.slice(-1)[0]||30)))[0];
          return `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:10.5px;padding:4px 0;border-bottom:1px dashed var(--card-border);gap:4px">
            <div><b>${bp.name}</b> <small style="color:var(--muted)">(${bp.role} • OVR ${bp.ovr})</small><br/>${formTag(bp)} • Fit ${bp.fitness||98}%</div>
            ${coldestStarter ? `<button class="btn btn-sm" style="padding:3px 6px;font-size:9px" onclick="swapIntlSquadPlayer(${coldestStarter.id},${bp.id})" title="Swap in for ${coldestStarter.name}">🔄 In</button>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
