// ============================================================================
// THE GAVEL HOUSE — PLAYERS DATABASE, SPLIT T20 STATS, LOGOS & AVATARS
// ============================================================================
// ==================== 1. CONSTANTS & BALANCED FRANCHISE BLUEPRINTS ====================
let MAX_BID_CAP = 2500;
let STARTING_PURSE = 12000; // Hard ₹25.00 Cr cap per player (in Lakhs)

const TEAMS_META = [
  { id:'CSK', name:'Chennai Super Kings', color:'#facc15', home:'Chepauk (Spin-friendly, slow grip)', mindset:'Zaheer Khan era with MS Dhoni mentoring: sharp pace-spin balance, tactical bowling control, and batting depth till #8.', style:'Smart pace-spin attack, Indian all-rounders & calm chase masters.', staff:['Zaheer Khan (Head Coach)','Mohit Sharma (Bowling)','MS Dhoni (Mentor)'], inflator:0.28, pref:['BW','AR'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'MI',  name:'Mumbai Indians', color:'#3b82f6', home:'Wankhede (True bounce, pace & high-scoring)', mindset:'Kieron Pollard leads the MI rebuild: fearless power-hitters, lethal death bowlers, and ruthless championship mentality.', style:'Explosive finishers, lethal death pace & world-class Indian core.', staff:['Kieron Pollard (Head Coach)','Mitchell McClenaghan (Bowling)','Sachin Tendulkar (Mentor)'], inflator:0.42, pref:['AR','BW'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'RCB', name:'Royal Challengers Bengaluru', color:'#ef4444', home:'Chinnaswamy (Small boundaries, batting paradise)', mindset:'Back-to-back champions under Andy Flower & DK: fearless power-hitters and wicket-taking bowlers built for Chinnaswamy.', style:'Aggressive marquee batters, wicket-taking pacers & big hitters.', staff:['Andy Flower (Head Coach)','Omkar Salvi (Bowling)','Dinesh Karthik (Mentor)'], inflator:0.45, pref:['B','WK'], targets:{B:8,WK:2,AR:6,BW:9} },
  { id:'KKR', name:'Kolkata Knight Riders', color:'#a855f7', home:'Eden Gardens (Balanced, rewards mystery spin & pace)', mindset:'Abhishek Nayar with Bravo & Russell: player-centric Indian core, mystery spin, and explosive middle-order power-hitting.', style:'Indian core, mystery spin & explosive power-hitting all-rounders.', staff:['Abhishek Nayar (Head Coach)','Tim Southee (Bowling)','Dwayne Bravo (Mentor)'], inflator:0.41, pref:['AR','BW'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'SRH', name:'Sunrisers Hyderabad', color:'#f97316', home:'Uppal (Flat batting deck, 220+ totals)', mindset:'Daniel Vettori all-out attack blueprint: destructive powerplay openers, six-hitters, and skiddy fast bowlers.', style:'Ultra-aggressive top-order firepower paired with sharp fast bowling.', staff:['Daniel Vettori (Head Coach)','Varun Aaron (Bowling)','Muttiah Muralitharan (Spin Mentor)'], inflator:0.40, pref:['B','BW'], targets:{B:8,WK:2,AR:6,BW:9} },
  { id:'RR',  name:'Rajasthan Royals', color:'#ec4899', home:'Jaipur (Big square boundaries, rewards leg-spin & anchors)', mindset:'Kumar Sangakkara & Shane Bond: data-driven scouting, classical top-order anchors, wrist-spinners, and express pace.', style:'Data-driven scouts: young Indian guns, leg-spin & express pace.', staff:['Kumar Sangakkara (Head Coach)','Shane Bond (Bowling)','Trevor Penney (Asst Coach)'], inflator:0.33, pref:['B','BW'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'DC',  name:'Delhi Capitals', color:'#0ea5e9', home:'Kotla (True batting surface with late turn)', mindset:'Sourav Ganguly & Yuvraj Singh bring fearless leadership: aggressive Indian batters, left-arm pace, and bold bidding wars.', style:'Fearless Indian core, dynamic keepers & sharp left-arm pace.', staff:['Sourav Ganguly (Head Coach)','Chaminda Vaas (Bowling)','Yuvraj Singh (Batting/Mentor)'], inflator:0.50, pref:['B','WK'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'PBKS',name:'Punjab Kings', color:'#e11d48', home:'Mullanpur (True pace & carry)', mindset:'Ricky Ponting heavy-purse bullies: goes hard early for explosive overseas power-hitters and fast-bowling all-rounders.', style:'Heavy purse bidders chasing overseas power-hitters & pace all-rounders.', staff:['Ricky Ponting (Head Coach)','Trevor Gonsalves (Bowling)','Ness Wadia (Owner)'], inflator:0.55, pref:['AR','B'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'GT',  name:'Gujarat Titans', color:'#38bdf8', home:'Ahmedabad (Large ground, true bounce)', mindset:'Ashish Nehra & Matthew Hayden: ice-cold bowling-first pragmatists with a lethal 5-bowler core and attacking top-order.', style:'Disciplined bids for anchors, lethal seam attack & clutch finishers.', staff:['Ashish Nehra (Head Coach)','Vikram Solanki (Director)','Matthew Hayden (Batting Coach)'], inflator:0.31, pref:['BW','B'], targets:{B:7,WK:2,AR:7,BW:9} },
  { id:'LSG', name:'Lucknow Super Giants', color:'#14b8a6', home:'Ekana (Two-paced grip, rewards tall pacers & all-rounders)', mindset:'Justin Langer, Bharat Arun & Kane Williamson: tough multi-skilled all-rounders, tall pacers, and smart Ekana batting.', style:'Versatile all-rounders, tall fast bowlers & smart middle-order anchors.', staff:['Justin Langer (Head Coach)','Bharat Arun (Bowling)','Kane Williamson (Strategic Advisor)'], inflator:0.43, pref:['AR','WK'], targets:{B:7,WK:2,AR:7,BW:9} }
];


const SPINNER_NAMES = new Set([
  'Rashid Khan','Kuldeep Yadav','Yuzvendra Chahal','Varun Chakravarthy','Noor Ahmad','Sunil Narine',
  'Axar Patel','Ravindra Jadeja','Ravi Bishnoi','Maheesh Theekshana','Wanindu Hasaranga','Mitchell Santner',
  'Washington Sundar','Rahul Chahar','Allah Ghazanfar','Mujeeb Rahman','Akeal Hosein','R. Sai Kishore',
  'Krunal Pandya','Shahbaz Ahmed','Harpreet Brar','Mayank Markande','Suyash Sharma','Shreyas Gopal',
  'Digvesh Rathi','Manav Suthar','M. Siddharth','Zeeshan Ansari','Vipraj Nigam','Tabraiz Shamsi',
  'Karn Sharma','Kumar Kartikeya Singh','Rishad Hossain','Qais Ahmad','Rehan Ahmed','Dunith Wellalage',
  'Michael Bracewell','Liam Dawson','George Linde','Vignesh Puthur','Murugan Ashwin','K.C. Cariappa',
  'Jayant Yadav','Swapnil Singh','Anukul Roy','Shams Mulani','Vicky Ostwal','Tanush Kotian'
]);

function isSpinner(p){
  if (!p) return false;
  return SPINNER_NAMES.has(p.name) || (p.set && (p.set.startsWith('SP') || p.set.startsWith('USP')));
}


const KNOWN_OPENERS = new Set([
  'Virat Kohli','Rohit Sharma','Yashasvi Jaiswal','Shubman Gill','Ruturaj Gaikwad','Travis Head',
  'Abhishek Sharma','Phil Salt','Jos Buttler','Quinton De Kock','Devon Conway','Jake Fraser-McGurk',
  'Sunil Narine','Ishan Kishan','KL Rahul','Sanju Samson','Sai Sudharsan','Prabhsimran Singh',
  'Rachin Ravindra','Finn Allen','Ben Duckett','Ryan Rickelton','Pathum Nissanka','Priyansh Arya',
  'Devdutt Padikkal','Mitchell Marsh','Aiden Markram','Faf du Plessis','Prithvi Shaw','Vaibhav Suryavanshi'
]);
const KNOWN_FINISHERS = new Set([
  'Hardik Pandya','Rinku Singh','Heinrich Klaasen','Nicholas Pooran','Tim David','Shimron Hetmyer',
  'Shivam Dube','Marcus Stoinis','Liam Livingstone','Tristan Stubbs','Glenn Phillips','David Miller',
  'Ravindra Jadeja','Axar Patel','Sam Curran','Andre Russell','Romario Shepherd','Rovman Powell',
  'Rahul Tewatia','Ashutosh Sharma','Shashank Singh','Abdul Samad','Ramandeep Singh','Jitesh Sharma',
  'Dhruv Jurel','Sameer Rizvi','Shahrukh Khan','Sherfane Rutherford','Donovan Ferreira'
]);



const DEATH_BOWLERS = new Set([
  'Jasprit Bumrah','Arshdeep Singh','Matheesha Pathirana','Mitchell Starc','Pat Cummins',
  'Kagiso Rabada','Josh Hazlewood','Trent Boult','Jofra Archer','T. Natarajan','Harshal Patel',
  'Bhuvneshwar Kumar','Mohammad Shami','Mohammad Siraj','Mustafizur Rahman','Nathan Ellis',
  'Avesh Khan','Mukesh Kumar','Khaleel Ahmed','Sandeep Sharma','Naveen Ul Haq','Lockie Ferguson',
  'Anrich Nortje','Gerald Coetzee','Eshan Malinga','Mayank Yadav','Harshit Rana','Yash Dayal',
  'Akash Madhwal','Rasikh Salam','Nuwan Thushara','Alzarri Joseph','Obed McCoy'
]);

const MYSTERY_SPINNERS = new Set([
  'Rashid Khan','Sunil Narine','Varun Chakravarthy','Kuldeep Yadav','Noor Ahmad',
  'Yuzvendra Chahal','Ravi Bishnoi','Maheesh Theekshana','Wanindu Hasaranga','Allah Ghazanfar',
  'Mujeeb Rahman','Digvesh Rathi','Suyash Sharma','Tabraiz Shamsi','Akeal Hosein'
]);


// Authentic IPL / T20 Career & Recent Profile Data: [batHand, bowlStyle, sr, econ, phase]
// BatHand: 'L' | 'R' | BowlStyle: 'RAF' | 'LAF' | 'Leg' | 'Off' | 'SLA' | '—'
const REAL_T20_STATS = {
  // MARQUEE (46)
  'Jasprit Bumrah': ['R','RAF',65,7.30,'Death Pace'],
  'Virat Kohli': ['R','—',132,null,'PP Opener'],
  'Rohit Sharma': ['R','—',131,null,'PP Opener'],
  'Suryakumar Yadav': ['R','—',145,null,'Middle Enforcer'],
  'Hardik Pandya': ['R','RAF',146,8.85,'Finisher AR'],
  'Rishabh Pant': ['L','—',149,null,'WK Middle'],
  'Heinrich Klaasen': ['R','—',168,null,'WK Finisher'],
  'Nicholas Pooran': ['L','—',162,null,'WK Finisher'],
  'Jos Buttler': ['R','—',148,null,'WK Opener'],
  'Sanju Samson': ['R','—',139,null,'WK Middle'],
  'KL Rahul': ['R','—',135,null,'WK Opener'],
  'Ishan Kishan': ['L','—',136,null,'WK Opener'],
  'Phil Salt': ['R','—',175,null,'WK Opener'],
  'Travis Head': ['L','Off',174,null,'PP Opener'],
  'Yashasvi Jaiswal': ['L','—',151,null,'PP Opener'],
  'Shubman Gill': ['R','—',136,null,'PP Opener'],
  'Ruturaj Gaikwad': ['R','—',137,null,'PP Opener'],
  'Shreyas Iyer': ['R','—',128,null,'Top Anchor'],
  'Rinku Singh': ['L','—',143,null,'Death Finisher'],
  'Shivam Dube': ['L','RAF',147,9.40,'Finisher AR'],
  'Tim David': ['R','—',170,null,'Death Finisher'],
  'Shimron Hetmyer': ['L','—',153,null,'Death Finisher'],
  'Aiden Markram': ['R','Off',130,8.20,'Top Anchor'],
  'Sunil Narine': ['L','Off',166,6.73,'Mystery Spin'],
  'Rashid Khan': ['R','Leg',155,6.82,'Mystery Spin'],
  'Ravindra Jadeja': ['L','SLA',130,7.62,'Spin AR'],
  'Axar Patel': ['L','SLA',131,7.28,'Spin AR'],
  'Sam Curran': ['L','LAF',136,9.25,'Pace AR'],
  'Marcus Stoinis': ['R','RAF',142,9.35,'Finisher AR'],
  'Mitchell Marsh': ['R','RAF',135,8.90,'Pace AR'],
  'Marco Jansen': ['R','LAF',126,9.10,'Pace AR'],
  'Will Jacks': ['R','Off',165,8.60,'Middle Enforcer'],
  'Arshdeep Singh': ['L','LAF',72,8.45,'Death Pace'],
  'Mitchell Starc': ['L','LAF',80,8.25,'Death Pace'],
  'Pat Cummins': ['R','RAF',138,8.75,'Death Pace'],
  'Trent Boult': ['R','LAF',78,8.29,'PP Swing Pace'],
  'Kagiso Rabada': ['L','RAF',88,8.48,'Death Pace'],
  'Josh Hazlewood': ['L','RAF',64,8.06,'PP Swing Pace'],
  'Mohammad Shami': ['R','RAF',76,8.44,'PP Swing Pace'],
  'Mohammad Siraj': ['R','RAF',70,8.65,'PP Swing Pace'],
  'Bhuvneshwar Kumar': ['R','RAF',92,7.56,'PP Swing Pace'],
  'Lockie Ferguson': ['R','RAF',95,8.98,'Express Pace'],
  'Kuldeep Yadav': ['L','Leg',84,8.14,'Mystery Spin'],
  'Varun Chakravarthy': ['R','Leg',60,7.56,'Mystery Spin'],
  'Yuzvendra Chahal': ['R','Leg',58,7.84,'Mystery Spin'],
  'Noor Ahmad': ['R','Leg',78,8.04,'Mystery Spin'],

  // SET 1 - 4 & TOP CAPPED / UNCAPPED STARS (110+)
  'Abhishek Sharma': ['L','SLA',162,8.40,'PP Opener'],
  'Tilak Varma': ['L','Off',146,null,'Middle Enforcer'],
  'Sai Sudharsan': ['L','—',139,null,'Top Anchor'],
  'Rajat Patidar': ['R','—',159,null,'Middle Enforcer'],
  'Tristan Stubbs': ['R','Off',174,null,'Death Finisher'],
  'Dhruv Jurel': ['R','—',151,null,'WK Finisher'],
  'Riyan Parag': ['R','Leg',136,8.90,'Middle Enforcer'],
  'Washington Sundar': ['L','Off',118,7.54,'Spin AR'],
  'Krunal Pandya': ['L','SLA',133,7.37,'Spin AR'],
  'Mitchell Santner': ['L','SLA',122,7.05,'Spin AR'],
  'Shardul Thakur': ['R','RAF',138,9.22,'Pace AR'],
  'Romario Shepherd': ['R','RAF',182,9.85,'Finisher AR'],
  'Azmatullah Omarzai': ['R','RAF',132,8.60,'Pace AR'],
  'Glenn Phillips': ['R','Off',152,7.90,'Death Finisher'],
  'Rovman Powell': ['R','RAF',148,null,'Death Finisher'],
  'Sherfane Rutherford': ['L','RAF',150,null,'Death Finisher'],
  'Deepak Chahar': ['R','RAF',110,7.98,'PP Swing Pace'],
  'Harshal Patel': ['R','RAF',115,8.74,'Death Pace'],
  'T. Natarajan': ['L','LAF',62,8.83,'Death Pace'],
  'Khaleel Ahmed': ['R','LAF',64,8.81,'PP Swing Pace'],
  'Avesh Khan': ['R','RAF',95,8.91,'Death Pace'],
  'Prasidh Krishna': ['R','RAF',65,8.92,'Express Pace'],
  'Mayank Yadav': ['R','RAF',68,6.99,'Express Pace'],
  'Dewald Brevis': ['R','Leg',144,null,'Middle Enforcer'],
  'Ryan Rickelton': ['L','—',142,null,'WK Opener'],
  'Nitish Rana': ['L','Off',135,8.20,'Middle Enforcer'],
  'Rahul Tewatia': ['L','Leg',135,7.95,'Finisher AR'],
  'Jacob Bethell': ['L','SLA',148,8.10,'Spin AR'],
  'Jamie Overton': ['R','RAF',156,9.10,'Finisher AR'],
  'Brydon Carse': ['R','RAF',134,8.55,'Pace AR'],
  'Nathan Ellis': ['R','RAF',90,8.42,'Death Pace'],
  'Mukesh Kumar': ['R','RAF',65,9.45,'Death Pace'],
  'Jaydev Unadkat': ['R','LAF',96,8.95,'PP Swing Pace'],
  'Nandre Burger': ['L','LAF',72,8.52,'Express Pace'],
  'Nuwan Thushara': ['R','RAF',68,8.70,'Death Pace'],
  'Allah Ghazanfar': ['R','Off',74,6.95,'Mystery Spin'],
  'Devdutt Padikkal': ['L','—',125,null,'Top Anchor'],
  'Nitish Kumar Reddy': ['R','RAF',143,9.20,'Pace AR'],
  'Jitesh Sharma': ['R','—',151,null,'WK Finisher'],
  'Shahrukh Khan': ['R','Off',142,null,'Death Finisher'],
  'Shahbaz Ahmed': ['L','SLA',122,8.65,'Spin AR'],
  'Harshit Rana': ['R','RAF',92,8.95,'Death Pace'],
  'Sandeep Sharma': ['R','RAF',82,7.88,'Death Pace'],
  'R. Sai Kishore': ['L','SLA',95,7.95,'Middle Spin'],
  'Yash Dayal': ['L','LAF',65,9.15,'PP Swing Pace'],
  'Tushar Deshpande': ['R','RAF',84,9.35,'Death Pace'],
  'Umran Malik': ['R','RAF',76,9.40,'Express Pace'],
  'Ishant Sharma': ['R','RAF',68,8.24,'PP Swing Pace'],
  'Karun Nair': ['R','—',134,null,'Top Anchor'],
  'Manish Pandey': ['R','—',122,null,'Top Anchor'],
  'Prabhsimran Singh': ['R','—',146,null,'WK Opener'],
  'Abhishek Porel': ['L','—',156,null,'WK Opener'],
  'Shashank Singh': ['R','RAF',164,null,'Death Finisher'],
  'Ashutosh Sharma': ['R','—',167,null,'Death Finisher'],
  'Naman Dhir': ['R','Off',177,null,'Middle Enforcer'],
  'Nehal Wadhera': ['L','—',140,null,'Middle Enforcer'],
  'Ramandeep Singh': ['R','RAF',170,null,'Finisher AR'],
  'Angkrish Raghuvanshi': ['R','—',155,null,'PP Opener'],
  'Priyansh Arya': ['L','—',162,null,'PP Opener'],
  'Vaibhav Suryavanshi': ['L','—',158,null,'PP Opener'],
  'Ayush Badoni': ['R','Off',134,null,'Middle Enforcer'],
  'Abdul Samad': ['R','Leg',146,null,'Death Finisher'],
  'Sameer Rizvi': ['R','Off',144,null,'Death Finisher'],
  'Harpreet Brar': ['L','SLA',118,7.92,'Spin AR'],
  'Mayank Markande': ['R','Leg',80,8.55,'Middle Spin'],
  'Suyash Sharma': ['R','Leg',62,8.45,'Mystery Spin'],
  'Digvesh Rathi': ['R','Leg',65,7.80,'Mystery Spin'],
  'Vaibhav Arora': ['R','RAF',70,8.92,'PP Swing Pace'],
  'Mohsin Khan': ['L','LAF',74,8.50,'Death Pace'],
  'Rasikh Salam': ['R','RAF',85,9.15,'Death Pace'],
  'Vyshak Vijaykumar': ['R','RAF',80,9.10,'Death Pace'],
  'Eshan Malinga': ['R','RAF',72,8.40,'Death Pace'],
  'Anshul Kamboj': ['R','RAF',84,8.55,'PP Swing Pace'],
  'Yash Thakur': ['R','RAF',68,9.45,'Death Pace'],
  'Vipraj Nigam': ['R','Leg',138,8.10,'Spin AR'],
  'Cameron Green': ['R','RAF',154,8.95,'Pace AR'],
  'David Miller': ['L','—',139,null,'Death Finisher'],
  'Devon Conway': ['L','—',141,null,'PP Opener'],
  'Jake Fraser-McGurk': ['R','—',204,null,'PP Opener'],
  'Prithvi Shaw': ['R','—',147,null,'PP Opener'],
  'Liam Livingstone': ['R','Leg',162,8.90,'Finisher AR'],
  'Venkatesh Iyer': ['L','RAF',137,9.50,'Middle Enforcer'],
  'Rachin Ravindra': ['L','SLA',152,8.20,'PP Opener'],
  'Wanindu Hasaranga': ['R','Leg',130,8.13,'Mystery Spin'],
  'Gus Atkinson': ['R','RAF',118,8.45,'Express Pace'],
  'Quinton De Kock': ['L','—',134,null,'WK Opener'],
  'Jonny Bairstow': ['R','—',144,null,'WK Opener'],
  'Rahmanullah Gurbaz': ['R','—',134,null,'WK Opener'],
  'Finn Allen': ['R','—',164,null,'WK Opener'],
  'Ben Duckett': ['L','—',148,null,'WK Opener'],
  'Jamie Smith': ['R','—',150,null,'WK Middle'],
  'Matheesha Pathirana': ['R','RAF',60,7.88,'Death Pace'],
  'Anrich Nortje': ['R','RAF',75,8.96,'Express Pace'],
  'Gerald Coetzee': ['R','RAF',105,9.50,'Express Pace'],
  'Matt Henry': ['R','RAF',82,8.20,'PP Swing Pace'],
  'Fazalhaq Farooqi': ['R','LAF',64,8.25,'PP Swing Pace'],
  'Spencer Johnson': ['L','LAF',72,8.70,'Express Pace'],
  'Akash Deep': ['R','RAF',88,9.60,'PP Swing Pace'],
  'Ravi Bishnoi': ['R','Leg',70,7.81,'Mystery Spin'],
  'Maheesh Theekshana': ['R','Off',74,7.66,'Mystery Spin'],
  'Rahul Chahar': ['R','Leg',84,7.72,'Middle Spin'],
  'Akeal Hosein': ['L','SLA',108,7.15,'Mystery Spin'],
  'Mujeeb Rahman': ['R','Off',88,7.95,'Mystery Spin'],
  'Jofra Archer': ['R','RAF',132,7.44,'Death Pace'],
  'Mustafizur Rahman': ['L','LAF',70,8.14,'Death Pace'],
  'Josh Inglis': ['R','—',156,null,'WK Middle'],
  'Daryl Mitchell': ['R','RAF',138,8.70,'Middle Enforcer'],
  'Jason Holder': ['R','RAF',128,8.85,'Pace AR'],
  'Michael Bracewell': ['L','Off',142,7.85,'Spin AR'],
  'Matthew Short': ['R','Off',148,8.10,'PP Opener'],
  'Steve Smith': ['R','—',128,null,'Top Anchor'],
  'Pathum Nissanka': ['R','—',134,null,'PP Opener'],
  'Rahul Tripathi': ['R','—',139,null,'Middle Enforcer'],
  'Mayank Agarawal': ['R','—',133,null,'PP Opener'],
  'Tim Seifert': ['R','—',142,null,'WK Opener'],
  'Tom Banton': ['R','—',146,null,'WK Opener'],
  'Shai Hope': ['R','—',134,null,'WK Middle'],
  'Kusal Mendis': ['R','—',138,null,'WK Opener'],
  'Kusal Perera': ['L','—',142,null,'WK Opener'],
  'Adam Milne': ['R','RAF',95,8.65,'Express Pace'],
  'Lungisani Ngidi': ['R','RAF',70,8.30,'PP Swing Pace'],
  'Kyle Jamieson': ['R','RAF',112,8.95,'Express Pace'],
  'Umesh Yadav': ['R','RAF',96,8.45,'PP Swing Pace'],
  'Naveen Ul Haq': ['R','RAF',72,9.10,'Death Pace'],
  'Alzarri Joseph': ['R','RAF',98,9.55,'Express Pace'],
  'Jhye Richardson': ['R','RAF',102,8.50,'PP Swing Pace'],
  'Riley Meredith': ['R','RAF',72,8.95,'Express Pace'],
  'Shamar Joseph': ['L','RAF',88,8.90,'Express Pace'],
  'Taskin Ahmed': ['L','RAF',74,8.35,'Express Pace'],
  'Jason Behrendorff': ['R','LAF',76,8.15,'PP Swing Pace'],
  'Obed McCoy': ['L','LAF',75,8.85,'Death Pace'],
  'Joshua Little': ['R','LAF',74,8.60,'PP Swing Pace'],
  'Tabraiz Shamsi': ['R','Leg',65,7.55,'Mystery Spin'],
  'Rishad Hossain': ['R','Leg',125,7.90,'Middle Spin'],
  'Akash Madhwal': ['R','RAF',68,8.65,'Death Pace'],
  'Kartik Tyagi': ['R','RAF',76,9.20,'Express Pace'],
  'Simarjeet Singh': ['R','RAF',78,8.80,'Express Pace'],
  'Karn Sharma': ['L','Leg',105,8.25,'Middle Spin'],
  'Kyle Mayers': ['L','RAF',144,8.90,'PP Opener'],
  'Roston Chase': ['R','Off',132,7.60,'Spin AR'],
  'Liam Dawson': ['R','SLA',126,7.40,'Spin AR'],
  'Charith Asalanka': ['L','Off',136,null,'Middle Enforcer'],
  'Dunith Wellalage': ['L','SLA',118,7.35,'Spin AR'],
  'Dwaine Pretorius': ['R','RAF',134,8.65,'Pace AR'],
  'Tom Curran': ['R','RAF',130,9.10,'Pace AR'],
  'Sean Abbott': ['R','RAF',132,8.95,'Pace AR'],
  'Daniel Sams': ['R','LAF',136,9.05,'Pace AR'],
  'Ben Dwarshuis': ['L','LAF',128,8.45,'Pace AR'],
  'Saurabh Netravalkar': ['R','LAF',68,7.60,'PP Swing Pace']
};

function computePlayerSplitStats(p, idxSeed=0){
  const hash = (p.name.split('').reduce((a,c)=>a + c.charCodeAt(0), 0) * 17 + idxSeed * 13) % 100;
  const ovr = p.ovr || 72;
  const real = REAL_T20_STATS[p.name];

  if (real) {
    const [batHand, bowlStyle, sr, econ, phase] = real;
    let bat = 50, bowl = 25;
    if (p.role === 'B' || p.role === 'WK') {
      bat = Math.min(98, Math.max(64, ovr + (sr >= 155 ? 2 : 0)));
      bowl = bowlStyle !== '—' ? 42 : 18;
    } else if (p.role === 'AR') {
      bat = Math.min(94, Math.max(60, Math.round(ovr - 1 + (sr - 135) * 0.12)));
      bowl = Math.min(93, Math.max(58, Math.round(ovr - 1 + (8.4 - (econ || 8.4)) * 3.5)));
    } else {
      bowl = Math.min(98, Math.max(64, Math.round(ovr + (8.2 - (econ || 8.2)) * 2.5)));
      bat = Math.min(68, Math.max(24, Math.round(28 + (sr - 60) * 0.35)));
    }
    return { bat, bowl, sr, econ, phase, batHand, bowlStyle };
  }

  const spin = isSpinner(p);
  const opener = KNOWN_OPENERS.has(p.name);
  const finisher = KNOWN_FINISHERS.has(p.name);
  const deathB = DEATH_BOWLERS.has(p.name);
  const mystS = MYSTERY_SPINNERS.has(p.name);
  const batHand = (hash % 4 === 0) ? 'L' : 'R';
  let bowlStyle = '—';
  let bat = 50, bowl = 25, sr = 126, econ = null, phase = 'Utility';

  if (p.role === 'B' || p.role === 'WK') {
    bat = Math.min(96, Math.max(60, ovr + (hash % 5) - 2));
    bowl = 15 + (hash % 14);
    if (finisher) { sr = Math.min(176, Math.round(145 + (ovr - 72) * 1.1)); phase = p.role === 'WK' ? 'WK Finisher' : 'Death Finisher'; }
    else if (opener) { sr = Math.min(165, Math.round(136 + (ovr - 72) * 0.9)); phase = p.role === 'WK' ? 'WK Opener' : 'PP Opener'; }
    else { sr = Math.min(156, Math.round(128 + (ovr - 72) * 0.8)); phase = p.role === 'WK' ? 'WK Middle' : (sr >= 140 ? 'Middle Enforcer' : 'Top Anchor'); }
  } else if (p.role === 'AR') {
    bat = Math.min(92, Math.max(58, ovr - 2 + (hash % 5) - 2));
    bowl = Math.min(90, Math.max(56, ovr - 3 + ((hash * 3) % 5) - 2));
    sr = Math.min(168, Math.round((finisher ? 142 : 132) + (bat - 70) * 0.85));
    econ = +Math.max(6.8, Math.min(9.9, 9.0 - (bowl - 65) * 0.065)).toFixed(2);
    bowlStyle = spin ? (batHand === 'L' ? 'SLA' : 'Off') : (batHand === 'L' ? 'LAF' : 'RAF');
    phase = finisher ? 'Finisher AR' : spin ? 'Spin AR' : 'Pace AR';
  } else {
    bowl = Math.min(96, Math.max(62, ovr + (hash % 5) - 2));
    bat = Math.min(58, Math.max(22, 30 + (hash % 20)));
    sr = Math.round(98 + (hash % 22));
    econ = +Math.max(6.4, Math.min(10.1, 9.2 - (bowl - 66) * 0.08)).toFixed(2);
    bowlStyle = spin ? (hash % 2 === 0 ? 'Leg' : (batHand === 'L' ? 'SLA' : 'Off')) : (hash % 3 === 0 ? 'LAF' : 'RAF');
    phase = mystS ? 'Mystery Spin' : spin ? 'Middle Spin' : deathB ? 'Death Pace' : (hash % 2 === 0 ? 'PP Swing Pace' : 'Express Pace');
  }
  return { bat, bowl, sr, econ, phase, batHand, bowlStyle };
}

function ensurePlayerSplitStats(playersList){
  if (!Array.isArray(playersList)) return;
  playersList.forEach((p, idx) => {
    if (p && (typeof p.bat !== 'number' || !p.batHand || !p.bowlStyle || !p.phase)) {
      Object.assign(p, computePlayerSplitStats(p, idx));
    }
  });
}

// ==================== 2. ALL 520 REAL IPL PLAYERS ====================
const RAW_PLAYERS = `
Aiden Markram|Marquee|B|1|200
Arshdeep Singh|Marquee|BW|0|200
Axar Patel|Marquee|AR|0|200
Bhuvneshwar Kumar|Marquee|BW|0|200
Hardik Pandya|Marquee|AR|0|200
Heinrich Klaasen|Marquee|WK|1|200
Ishan Kishan|Marquee|WK|0|200
Jasprit Bumrah|Marquee|BW|0|200
Jos Buttler|Marquee|WK|1|200
Josh Hazlewood|Marquee|BW|1|200
Kagiso Rabada|Marquee|BW|1|200
KL Rahul|Marquee|WK|0|200
Kuldeep Yadav|Marquee|BW|0|200
Lockie Ferguson|Marquee|BW|1|200
Marco Jansen|Marquee|AR|1|200
Marcus Stoinis|Marquee|AR|1|200
Mitchell Marsh|Marquee|AR|1|200
Mitchell Starc|Marquee|BW|1|200
Mohammad Shami|Marquee|BW|0|200
Mohammad Siraj|Marquee|BW|0|200
Nicholas Pooran|Marquee|WK|1|200
Noor Ahmad|Marquee|BW|1|200
Pat Cummins|Marquee|BW|1|200
Phil Salt|Marquee|WK|1|200
Rashid Khan|Marquee|BW|1|200
Ravindra Jadeja|Marquee|AR|0|200
Rinku Singh|Marquee|B|0|200
Rishabh Pant|Marquee|WK|0|200
Rohit Sharma|Marquee|B|0|200
Ruturaj Gaikwad|Marquee|B|0|200
Sam Curran|Marquee|AR|1|200
Sanju Samson|Marquee|WK|0|200
Shimron Hetmyer|Marquee|B|1|200
Shivam Dube|Marquee|AR|0|200
Shreyas Iyer|Marquee|B|0|200
Shubman Gill|Marquee|B|0|200
Sunil Narine|Marquee|AR|1|200
Suryakumar Yadav|Marquee|B|0|200
Tim David|Marquee|B|1|200
Travis Head|Marquee|B|1|200
Trent Boult|Marquee|BW|1|200
Varun Chakravarthy|Marquee|BW|0|200
Virat Kohli|Marquee|B|0|200
Will Jacks|Marquee|AR|1|200
Yashasvi Jaiswal|Marquee|B|0|200
Yuzvendra Chahal|Marquee|BW|0|200
Abhishek Sharma|Set 1|AR|0|100
Avesh Khan|Set 1|BW|0|100
Azmatullah Omarzai|Set 1|AR|1|100
Deepak Chahar|Set 1|BW|0|100
Dhruv Jurel|Set 1|WK|0|100
Glenn Phillips|Set 1|B|1|100
Harshal Patel|Set 1|BW|0|100
Khaleel Ahmed|Set 1|BW|0|100
Krunal Pandya|Set 1|AR|0|100
Mayank Yadav|Set 1|BW|0|100
Mitchell Santner|Set 1|AR|1|100
Prasidh Krishna|Set 1|BW|0|100
Rajat Patidar|Set 1|B|0|100
Riyan Parag|Set 1|AR|0|100
Romario Shepherd|Set 1|AR|1|100
Rovman Powell|Set 1|B|1|100
Sai Sudharsan|Set 1|B|0|100
Shardul Thakur|Set 1|AR|0|100
Sherfane Rutherford|Set 1|B|1|100
T. Natarajan|Set 1|BW|0|100
Tilak Varma|Set 1|B|0|100
Tristan Stubbs|Set 1|B|1|100
Washington Sundar|Set 1|AR|0|100
Allah Ghazanfar|Set 2|BW|1|75
Brydon Carse|Set 2|AR|1|75
Corbin Bosch|Set 2|AR|1|75
Dewald Brevis|Set 2|B|1|75
Dushmantha Chameera|Set 2|BW|1|75
Jacob Bethell|Set 2|AR|1|75
Jamie Overton|Set 2|AR|1|75
Jaydev Unadkat|Set 2|BW|0|75
Kamindu Mendis|Set 2|AR|1|75
Matthew Breetzke|Set 2|B|1|75
Mitchell Owen|Set 2|B|1|75
Mukesh Kumar|Set 2|BW|0|75
Nandre Burger|Set 2|BW|1|75
Nathan Ellis|Set 2|BW|1|75
Nitish Rana|Set 2|B|0|75
Nuwan Thushara|Set 2|BW|1|75
Rahul Tewatia|Set 2|AR|0|75
Ryan Rickelton|Set 2|WK|1|75
Xavier Bartlett|Set 2|BW|1|75
Devdutt Padikkal|Set 3|B|0|50
Harshit Rana|Set 3|BW|0|50
Ishant Sharma|Set 3|BW|0|50
Jayant Yadav|Set 3|AR|0|50
Jitesh Sharma|Set 3|WK|0|50
Karun Nair|Set 3|B|0|50
Manish Pandey|Set 3|B|0|50
Nitish Kumar Reddy|Set 3|AR|0|50
R. Sai Kishore|Set 3|BW|0|50
Sandeep Sharma|Set 3|BW|0|50
Shahbaz Ahmed|Set 3|AR|0|50
Shahrukh Khan|Set 3|B|0|50
Tushar Deshpande|Set 3|BW|0|50
Umran Malik|Set 3|BW|0|50
Yash Dayal|Set 3|BW|0|50
Abdul Samad|Set 4|AR|0|30
Abhinandan Singh|Set 4|BW|0|30
Abhishek Porel|Set 4|WK|0|30
Ajay Mandal|Set 4|AR|0|30
Akash Singh|Set 4|BW|0|30
Angkrish Raghuvanshi|Set 4|B|0|30
Aniket Verma|Set 4|B|0|30
Anshul Kamboj|Set 4|BW|0|30
Anuj Rawat|Set 4|WK|0|30
Anukul Roy|Set 4|AR|0|30
Arjun Tendulkar|Set 4|AR|0|30
Arshin Kulkarni|Set 4|AR|0|30
Ashutosh Sharma|Set 4|AR|0|30
Ashwani Kumar|Set 4|BW|0|30
Ayush Badoni|Set 4|B|0|30
Ayush Mhatre|Set 4|B|0|30
Digvesh Rathi|Set 4|BW|0|30
Donovan Ferreira|Set 4|AR|1|30
Eshan Malinga|Set 4|BW|1|30
Gurjapneet Singh|Set 4|BW|0|30
Gurnoor Brar|Set 4|BW|0|30
Harnoor Pannu|Set 4|B|0|30
Harpreet Brar|Set 4|AR|0|30
Harsh Dubey|Set 4|BW|0|30
Himmat Singh|Set 4|B|0|30
Kumar Kushagra|Set 4|WK|0|30
Kwena Maphaka|Set 4|BW|1|30
Lhuan-Dre Pretorious|Set 4|AR|1|30
M. Siddharth|Set 4|BW|0|30
Madhav Tiwari|Set 4|B|0|30
Manav Suthar|Set 4|BW|0|30
Mayank Markande|Set 4|BW|0|30
Mohd. Arshad Khan|Set 4|BW|0|30
Mohsin Khan|Set 4|BW|0|30
Mukesh Choudhary|Set 4|BW|0|30
Musheer Khan|Set 4|AR|0|30
Naman Dhir|Set 4|B|0|30
Nehal Wadhera|Set 4|B|0|30
Nishant Sindhu|Set 4|AR|0|30
Prabhsimran Singh|Set 4|WK|0|30
Prince Yadav|Set 4|BW|0|30
Priyansh Arya|Set 4|B|0|30
Pyla Avinash|Set 4|B|0|30
Raghu Sharma|Set 4|BW|0|30
Raj Angad Bawa|Set 4|AR|0|30
Ramakrishna Ghosh|Set 4|WK|0|30
Ramandeep Singh|Set 4|AR|0|30
Rasikh Salam|Set 4|BW|0|30
Robin Minz|Set 4|WK|0|30
Sameer Rizvi|Set 4|AR|0|30
Shashank Singh|Set 4|AR|0|30
Shreyas Gopal|Set 4|BW|0|30
Shubham Dubey|Set 4|B|0|30
Smaran Ravichandaran|Set 4|B|0|30
Suryansh Shedge|Set 4|AR|0|30
Suyash Sharma|Set 4|BW|0|30
Swapnil Singh|Set 4|AR|0|30
Tripurana Vijay|Set 4|B|0|30
Urvil Patel|Set 4|WK|0|30
Vaibhav Arora|Set 4|BW|0|30
Vaibhav Suryavanshi|Set 4|B|0|30
Vipraj Nigam|Set 4|AR|0|30
Vishnu Vinod|Set 4|WK|0|30
Vyshak Vijaykumar|Set 4|BW|0|30
Yash Thakur|Set 4|BW|0|30
Yudhvir Charak|Set 4|AR|0|30
Zeeshan Ansari|Set 4|BW|0|30
Cameron Green|BA1|B|1|200
David Miller|BA1|B|1|200
Devon Conway|BA1|B|1|200
Jake Fraser-McGurk|BA1|B|1|200
Prithvi Shaw|BA1|B|0|75
Sarfaraz Khan|BA1|B|0|75
Deepak Hooda|AL1|AR|0|75
Gus Atkinson|AL1|AR|1|200
Liam Livingstone|AL1|AR|1|200
Rachin Ravindra|AL1|AR|1|200
Venkatesh Iyer|AL1|AR|0|200
Wanindu Hasaranga|AL1|AR|1|200
Wiaan Mulder|AL1|AR|1|100
Ben Duckett|WK1|WK|1|200
Finn Allen|WK1|WK|1|200
Jamie Smith|WK1|WK|1|200
Jonny Bairstow|WK1|WK|1|100
K.S. Bharat|WK1|WK|0|75
Quinton De Kock|WK1|WK|1|100
Rahmanullah Gurbaz|WK1|WK|1|150
Akash Deep|FA1|BW|0|100
Anrich Nortje|FA1|BW|1|200
Fazalhaq Farooqi|FA1|BW|1|100
Gerald Coetzee|FA1|BW|1|200
Jacob Duffy|FA1|BW|1|200
Matheesha Pathirana|FA1|BW|1|200
Matt Henry|FA1|BW|1|200
Shivam Mavi|FA1|BW|0|75
Spencer Johnson|FA1|BW|1|150
Akeal Hosein|SP1|BW|1|200
Maheesh Theekshana|SP1|BW|1|200
Mujeeb Rahman|SP1|BW|1|200
Rahul Chahar|SP1|BW|0|100
Ravi Bishnoi|SP1|BW|0|200
Aarya Desai|UBA1|B|0|30
Abhinav Manohar|UBA1|B|0|30
Abhinav Tejrana|UBA1|B|0|30
Anmolpreet Singh|UBA1|B|0|30
Atharva Taide|UBA1|B|0|30
Yash Dhull|UBA1|B|0|30
Auqib Dar|UAL1|AR|0|30
Edhen Tom|UAL1|AR|0|30
Kamlesh Nagarkoti|UAL1|AR|0|30
Mahipal Lomror|UAL1|AR|0|50
Prashant Veer|UAL1|AR|0|30
Rajvardhan Hangargekar|UAL1|AR|0|40
Sanvir Singh|UAL1|AR|0|30
Shivang Kumar|UAL1|AR|0|30
Tanush Kotian|UAL1|AR|0|30
Vijay Shankar|UAL1|AR|0|30
Kartik Sharma|UWK1|WK|0|30
Mukul Choudhary|UWK1|WK|0|30
Ruchit Ahir|UWK1|WK|0|30
Tejasvi Singh|UWK1|WK|0|30
Tushar Raheja|UWK1|WK|0|30
Vansh Bedi|UWK1|WK|0|30
Akash Madhwal|UFA1|BW|0|30
Ashok Sharma|UFA1|BW|0|30
Kartik Tyagi|UFA1|BW|0|30
Naman Tiwari|UFA1|BW|0|30
Raj Limbani|UFA1|BW|0|30
Simarjeet Singh|UFA1|BW|0|30
Sushant Mishra|UFA1|BW|0|30
Karn Sharma|USP1|BW|0|50
Kumar Kartikeya Singh|USP1|BW|0|30
Prashant Solanki|USP1|BW|0|30
Shivam Shukla|USP1|BW|0|30
Vignesh Puthur|USP1|BW|0|30
Wahidullah Zadran|USP1|BW|1|30
Yash Raj Punja|USP1|BW|0|30
Ackeem Auguste|BA2|B|1|75
Mayank Agarawal|BA2|B|0|75
Pathum Nissanka|BA2|B|1|75
Rahul Tripathi|BA2|B|0|75
Reeza Hendricks|BA2|B|1|100
Sediqullah Atal|BA2|B|1|75
Steve Smith|BA2|B|1|200
Tim Robinson|BA2|B|1|75
Ben Dwarshuis|AL2|AR|1|100
Daniel Sams|AL2|AR|1|100
Daryl Mitchell|AL2|AR|1|200
Dasun Shanaka|AL2|AR|1|75
Jason Holder|AL2|AR|1|200
Matthew Short|AL2|AR|1|150
Michael Bracewell|AL2|AR|1|200
Sean Abbott|AL2|AR|1|200
Zak Foulkes|AL2|AR|1|75
Benjamin McDermott|WK2|WK|1|75
Jordan Cox|WK2|WK|1|75
Josh Inglis|WK2|WK|1|200
Kusal Mendis|WK2|WK|1|75
Kusal Perera|WK2|WK|1|100
Shai Hope|WK2|WK|1|200
Tim Seifert|WK2|WK|1|150
Tom Banton|WK2|WK|1|200
Adam Milne|FA2|BW|1|200
Chetan Sakariya|FA2|BW|0|75
Kuldeep Sen|FA2|BW|0|75
Kyle Jamieson|FA2|BW|1|200
Lungisani Ngidi|FA2|BW|1|200
Mustafizur Rahman|FA2|BW|1|200
Saqib Mahmood|FA2|BW|1|150
Umesh Yadav|FA2|BW|0|150
William Orourke|FA2|BW|1|200
Mohammad Waqar Salamkheil|SP2|BW|1|100
Qais Ahmad|SP2|BW|1|75
Rishad Hossain|SP2|BW|1|75
Viyaskanth Vijayakanth|SP2|BW|1|75
Akshat Raghuwanshi|UBA2|B|0|30
Aman Rao Perala|UBA2|B|0|30
Ankit Kumar|UBA2|B|0|30
Danish Malewar|UBA2|B|0|30
Manan Vohra|UBA2|B|0|30
Pukhraj Mann|UBA2|B|0|30
Rohan Kunnummal|UBA2|B|0|30
Salman Nizar|UBA2|B|0|30
Aman Khan|UAL2|AR|0|30
Darshan Nalkande|UAL2|AR|0|30
Harsh Tyagi|UAL2|AR|0|30
Mangesh Yadav|UAL2|AR|0|30
Mayank Rawat|UAL2|AR|0|30
Sairaj Patil|UAL2|AR|0|30
Satvik Deswal|UAL2|AR|0|30
Suyash Prabhudessai|UAL2|AR|0|30
Vicky Ostwal|UAL2|AR|0|30
Yuvraj Chaudhary|UAL2|AR|0|30
Abhishek Pathak|UWK2|WK|0|30
Kunal Rathore|UWK2|WK|0|30
Rahul Buddhi|UWK2|WK|0|30
Ravi Singh|UWK2|WK|0|30
Ricky Bhui|UWK2|WK|0|30
Salil Arora|UWK2|WK|0|30
Saurav Chuahan|UWK2|WK|0|30
Yashvardhan Dalal|UWK2|WK|0|30
K.M Asif|UFA2|BW|0|40
Mohammad Izhar|UFA2|BW|0|30
Onkar Tarmale|UFA2|BW|0|30
Prithviraj Yarra|UFA2|BW|0|30
PV.Satyanarayana Raju|UFA2|BW|0|30
Sakib Hussain|UFA2|BW|0|30
Vidwath Kaverappa|UFA2|BW|0|30
Vidyadhar Patil|UFA2|BW|0|30
Vijay Kumar|UFA2|BW|0|30
Bailapudi Yeswanth|USP2|BW|0|30
Himanshu Sharma|USP2|BW|0|30
K.C. Cariappa|USP2|BW|0|30
Kartik Chadha|USP2|BW|0|30
Mohit Rathee|USP2|BW|0|30
Murugan Ashwin|USP2|BW|0|30
Pravin Dubey|USP2|BW|0|30
Shubham Agrawal|USP2|BW|0|40
Tejas Baroka|USP2|BW|0|30
Beau Webster|AL3|AR|1|125
Bevon-John Jacobs|AL3|AR|1|75
Cooper Connolly|AL3|AR|1|200
Daniel Lawrence|AL3|AR|1|200
George Linde|AL3|AR|1|100
Gulbadin Naib|AL3|AR|1|100
Rehan Ahmed|AL3|AR|1|75
Tom Curran|AL3|AR|1|200
William Sutherland|AL3|AR|1|100
Alzarri Joseph|FA3|BW|1|200
Jhye Richardson|FA3|BW|1|150
Luke Wood|FA3|BW|1|75
Navdeep Saini|FA3|BW|0|75
Naveen Ul Haq|FA3|BW|1|200
Richard Gleeson|FA3|BW|1|75
Riley Meredith|FA3|BW|1|150
Shamar Joseph|FA3|BW|1|75
Taskin Ahmed|FA3|BW|1|75
Adarsh Singh|UBA3|B|0|30
Arsh Kabir Ranga|UBA3|B|0|30
Ayush Doseja|UBA3|B|0|30
Bhanu Pania|UBA3|B|0|30
Kunal Chandela|UBA3|B|0|30
M.Dheeraj Kumar|UBA3|B|0|30
Qamran Iqbal|UBA3|B|0|30
Sahil Parakh|UBA3|B|0|30
Abid Mushtaq|UAL3|AR|0|30
Atit Sheth|UAL3|AR|0|30
Hritik Shokeen|UAL3|AR|0|30
Jagadeesha Suchith|UAL3|AR|0|30
Jalaj Saxena|UAL3|AR|0|40
Manoj Bhandage|UAL3|AR|0|30
Manvanth Kumar|UAL3|AR|0|30
Mayank Dagar|UAL3|AR|0|30
Raghav Goyal|UAL3|AR|0|30
Tanay Thyagarajann|UAL3|AR|0|30
Ajitesh Guruswamy|UWK3|WK|0|30
Bipin Saurabh|UWK3|WK|0|30
Connor Esterhuizen|UWK3|WK|1|30
Hardik Tamore|UWK3|WK|0|30
Joe Clarke|UWK3|WK|1|50
Siddharth Joon|UWK3|WK|0|30
Tom Moores|UWK3|WK|1|40
Vishnu Solanki|UWK3|WK|0|30
Abhilash Shetty|UFA3|BW|0|30
Arpit Guleria|UFA3|BW|0|30
Divesh Sharma|UFA3|BW|0|30
Irfan Umair|UFA3|BW|0|30
Kuldip Yadav|UFA3|BW|0|30
Money Grewal|UFA3|BW|0|30
Sayan Ghosh|UFA3|BW|0|30
Sunil Kumar|UFA3|BW|0|30
Tristan Luus|UFA3|BW|1|30
Amit Kumar|USP3|BW|0|30
Chintal Gandhi|USP3|BW|0|30
Dharmendrasinh Jadeja|USP3|BW|0|30
Jhathavedh Subramanyan|USP3|BW|0|30
Manan Bhardwaj|USP3|BW|0|30
Parikshit Dhanak|USP3|BW|0|30
Saumy Pandey|USP3|BW|0|30
Shreyas Chavan|USP3|BW|0|30
Vishal Nishad|USP3|BW|0|30
Charith Asalanka|AL4|AR|1|100
Dunith Wellalage|AL4|AR|1|75
Dwaine Pretorius|AL4|AR|1|100
George Garton|AL4|AR|1|75
Kyle Mayers|AL4|AR|1|125
Liam Dawson|AL4|AR|1|200
Muhammad Abbas|AL4|AR|1|75
Nathan Smith|AL4|AR|1|75
Roston Chase|AL4|AR|1|125
Jason Behrendorff|FA4|BW|1|150
Joshua Tongue|FA4|BW|1|100
Matthew Potts|FA4|BW|1|75
Nahid Rana|FA4|BW|1|75
Olly Stone|FA4|BW|1|125
Sandeep Warrier|FA4|BW|0|75
Tanzim Hasan Sakib|FA4|BW|1|75
Aaron Varghese|UBA4|B|0|30
Ahammed Imran|UBA4|B|0|30
Ayaz Khan|UBA4|B|0|30
Daniel Lategan|UBA4|B|1|30
Miles Hammond|UBA4|B|1|30
Sachin Dhas|UBA4|B|0|30
Siddhant Rana|UBA4|B|0|30
Vishvarajsinh Jadeja|UBA4|B|0|30
Abdul Bazith|UAL4|AR|0|30
Atharva Ankolekar|UAL4|AR|0|30
Ayush Vartak|UAL4|AR|0|30
Karan Lal|UAL4|AR|0|30
Prince Rai|UAL4|AR|0|30
Ripal Patel|UAL4|AR|0|30
Sanjay Yadav|UAL4|AR|0|30
Shams Mulani|UAL4|AR|0|30
Utkarsh Singh|UAL4|AR|0|30
Vivrant Sharma|UAL4|AR|0|30
Esakkimuthu Ayyakutti|UFA4|BW|0|30
Ishan Porel|UFA4|BW|0|30
Kulwant Khejroliya|UFA4|BW|0|30
Pankaj Jaswal|UFA4|BW|0|30
Praful Hinge|UFA4|BW|0|30
Rajan Kumar|UFA4|BW|0|30
Ravi Kumar|UFA4|BW|0|30
Safvan Patel|UFA4|BW|0|30
Sayed Irfan Aftab|UFA4|BW|0|30
Arab Gul|USP4|BW|1|40
Izaz Sawariya|USP4|BW|0|30
Jikku Bright|USP4|BW|0|30
Naman Pushpak|USP4|BW|0|30
Purav Agarwal|USP4|BW|0|30
Rakibul Hasan|USP4|BW|1|30
Roshan Wagshare|USP4|BW|0|30
Traveen Mathew|USP4|BW|1|30
Yash Dicholkar|USP4|BW|0|30
Billy Stanlake|FA5|BW|1|75
Binura Fernando|FA5|BW|1|75
Joshua Little|FA5|BW|1|75
Md Shoriful Islam|FA5|BW|1|75
Obed McCoy|FA5|BW|1|75
Wesley Agar|FA5|BW|1|75
Krains Fuletra|UAL5|AR|0|30
Macneil Noronha|UAL5|AR|0|30
Nikhil Chaudhary|UAL5|AR|0|40
Ninad Rathva|UAL5|AR|0|30
R Rajkumar|UAL5|AR|0|30
R.S Ambrish|UAL5|AR|0|30
R.Sonu Yadav|UAL5|AR|0|30
Shivalik Sharma|UAL5|AR|0|30
Siddharth Yadav|UAL5|AR|0|30
Sunny Sandhu|UAL5|AR|0|30
Atal Rai|UFA5|BW|0|30
Atif Mushtaq|UFA5|BW|0|30
C.Rakshann Readdi|UFA5|BW|0|30
Deependra Singh|UFA5|BW|0|30
Manish Reddy|UFA5|BW|0|30
Nishanth Saranu|UFA5|BW|0|30
Rajat Verma|UFA5|BW|0|30
Rohit Yadav|UFA5|BW|0|30
Waseem Khanday|UFA5|BW|0|30
Bal Krishna|UAL6|AR|0|30
Delano Potgieter|UAL6|AR|1|30
Emanjot Chahal|UAL6|AR|0|30
Hardik Raj|UAL6|AR|0|30
Khilan Patel|UAL6|AR|0|30
Parth Rekhade|UAL6|AR|0|30
Sarthak Ranjan|UAL6|AR|0|30
Shubhang Hegde|UAL6|AR|0|30
Tiaan Van Vuuren|UAL6|AR|1|30
Vihaan Malhotra|UAL6|AR|0|30
Aaqib Khan|UFA6|BW|0|30
Aman Shekhawat|UFA6|BW|0|30
Bayanda Majola|UFA6|BW|1|30
Brijesh Sharma|UFA6|BW|0|30
Sabir Khan|UFA6|BW|0|30
Sadek Hussain|UFA6|BW|0|30
Shreevatsha Acharya|UFA6|BW|0|30
Shubham Kapse|UFA6|BW|0|30
Srihari Nair|UFA6|BW|0|30
Abhimanyusingh Rajput|UAL7|AR|0|30
Akash Pugazhanthi|UAL7|AR|0|30
Arpit Rana|UAL7|AR|0|30
Himanshu Bisht|UAL7|AR|0|30
Kanishk Chouhan|UAL7|AR|0|30
Maramreddy Reddy|UAL7|AR|0|30
Mayank Gusain|UAL7|AR|0|30
Sagar Solanki|UAL7|AR|0|30
Shreyan Chakraborty|UAL7|AR|0|30
Shubham Rana|UAL7|AR|0|30
Anuj Thakral|UAL8|AR|0|30
Arfaz Mohammad|UAL8|AR|0|30
Aryaman Singh Dhaliwal|UAL8|AR|0|30
Daksh Kamra|UAL8|AR|0|30
Hemang Patel|UAL8|AR|0|30
Lalit Yadav|UAL8|AR|0|30
Mridul Surroch|UAL8|AR|0|30
Nitin Sai Yadav|UAL8|AR|0|30
Parth Vats|UAL8|AR|0|30
Vishal Mandwal|UAL8|AR|0|30
Krish Bhagat|UAL9|AR|0|30
Prerit Dutta|UAL9|AR|0|30
Sammar Gajjar|UAL9|AR|0|30
Mohamed Ali|UAL9|AR|0|30
Madhav Bajaj|UAL9|AR|0|30
Akshu Bajwa|UAL9|AR|0|30
Varun Raj Singh Bisht|UAL9|AR|0|30
Rishabh Chauhan|UAL9|AR|0|30
Dian Forrester|UAL9|AR|1|30
Dhurmil Matkar|UAL9|AR|0|30
Shiva Singh|UAL10|AR|0|30
Parikshit Valsangkar|UAL10|AR|0|30
Manisankar Murasingh|UAL10|AR|0|30
Swastik Chikara|UAL10|B|0|30
Virandeep Singh|UAL10|AR|1|30
Ethan Bosch|UAL10|AR|1|30
Jack Edwards|UAL10|AR|1|50
Tabraiz Shamsi|UAL10|BW|1|100
Jofra Archer|UAL10|BW|1|200
Saurabh Netravalkar|UAL10|BW|1|50
`.trim();

const TIER_S = new Set([
  'Jasprit Bumrah','Virat Kohli','Rishabh Pant','Hardik Pandya','Heinrich Klaasen','Rashid Khan',
  'Suryakumar Yadav','Shreyas Iyer','Arshdeep Singh','Nicholas Pooran','Yashasvi Jaiswal',
  'Shubman Gill','Sanju Samson','Jos Buttler','Pat Cummins','Travis Head','Mitchell Starc',
  'Sunil Narine','Cameron Green','Matheesha Pathirana'
]);
const TIER_A = new Set([
  'KL Rahul','Axar Patel','Kuldeep Yadav','Varun Chakravarthy','Yuzvendra Chahal','Ravindra Jadeja',
  'Ruturaj Gaikwad','Rohit Sharma','Josh Hazlewood','Trent Boult','Kagiso Rabada','Phil Salt',
  'Ishan Kishan','Mohammad Siraj','Mohammad Shami','Rinku Singh','Shivam Dube','Abhishek Sharma',
  'Tilak Varma','Liam Livingstone','Venkatesh Iyer','Jofra Archer','Noor Ahmad','Marco Jansen',
  'Marcus Stoinis','Mitchell Marsh','Sam Curran','Will Jacks','Tim David','Aiden Markram',
  'Ravi Bishnoi','Harshal Patel','T. Natarajan','Mayank Yadav','Sai Sudharsan','Rajat Patidar',
  'Tristan Stubbs','Dhruv Jurel','Riyan Parag','Washington Sundar','Josh Inglis','Quinton De Kock'
]);
const TIER_B = new Set([
  'Bhuvneshwar Kumar','Lockie Ferguson','Shimron Hetmyer','Avesh Khan','Deepak Chahar',
  'Khaleel Ahmed','Krunal Pandya','Prasidh Krishna','Mitchell Santner','Glenn Phillips','Rovman Powell',
  'Romario Shepherd','Shardul Thakur','Sherfane Rutherford','Azmatullah Omarzai','David Miller',
  'Devon Conway','Jake Fraser-McGurk','Rachin Ravindra','Wanindu Hasaranga','Anrich Nortje',
  'Gerald Coetzee','Matt Henry','Maheesh Theekshana','Rahul Chahar','Mustafizur Rahman','Jason Holder',
  'Nitish Kumar Reddy','Harshit Rana','Jitesh Sharma','Nitish Rana','Mukesh Kumar','Nathan Ellis',
  'Dewald Brevis','Ryan Rickelton','Rahul Tewatia','Prabhsimran Singh','Shashank Singh','Ashutosh Sharma',
  'Naman Dhir','Nehal Wadhera','Vaibhav Suryavanshi','Abhishek Porel','Ramandeep Singh'
]);

function roleLabel(r){ return r==='B'?'Batsman':r==='WK'?'Wicket-Keeper':r==='AR'?'All-Rounder':'Bowler'; }
function fmtCr(lakhs){ return lakhs>=100 ? `₹${(lakhs/100).toFixed(2)} Cr` : `₹${lakhs} L`; }
function fmtSpeechPrice(lakhs){ return lakhs>=100 ? `${(lakhs/100).toFixed(2)} Crore` : `${lakhs} Lakhs`; }
function nextInc(cur){ return cur<100 ? 5 : cur<200 ? 10 : cur<500 ? 20 : 25; }

function shuffleArr(arr){
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildInitialPlayers(){
  const rawList = RAW_PLAYERS.split('\n').map((line, idx) => {
    const [name, set, role, osStr, baseStr] = line.split('|');
    const base = parseInt(baseStr, 10);
    const os = osStr === '1';
    let ovr = base>=200 ? 81 : base>=150 ? 77 : base>=100 ? 74 : base>=75 ? 71 : base>=50 ? 69 : 65;
    let tier = 'C', fairVal = Math.max(base, 60);
    if (TIER_S.has(name)) { ovr = 92 + (idx % 5); tier = 'S'; fairVal = 1750 + (idx % 5) * 140; }
    else if (TIER_A.has(name)) { ovr = 86 + (idx % 5); tier = 'A'; fairVal = 1150 + (idx % 5) * 115; }
    else if (TIER_B.has(name)) { ovr = 80 + (idx % 5); tier = 'B'; fairVal = 580 + (idx % 5) * 85; }
    else if (base >= 100) { fairVal = 280 + (idx % 4) * 55; }
    else if (base >= 50) { fairVal = 140 + (idx % 4) * 35; }
    const master = set === 'Marquee' ? 'Marquee' : (role==='B'||role==='WK') ? 'Batters' : role==='AR' ? 'All-Rounders' : 'Bowlers';
    const baseObj = { name, set, role, os, base, ovr: Math.min(97, ovr), tier, fairVal: Math.min(MAX_BID_CAP, fairVal), master, status:'AVAIL', soldTo:null, soldPrice:0, injured:false }; return Object.assign(baseObj, computePlayerSplitStats(baseObj, idx));
  });

  // Shuffle within every Set so every auction has a fresh draw order
  const setOrder = [];
  const bySet = {};
  rawList.forEach(p => {
    if (!bySet[p.set]) { bySet[p.set] = []; setOrder.push(p.set); }
    bySet[p.set].push(p);
  });

  const shuffledAll = [];
  setOrder.forEach(s => {
    shuffleArr(bySet[s]).forEach(p => {
      p.id = shuffledAll.length;
      shuffledAll.push(p);
    });
  });
  return shuffledAll;
}


// ==================== BESPOKE INLINE SVG FRANCHISE LOGOS (ALL 10 TEAMS) ====================
const TEAM_LOGO_SVGS = {
  CSK: `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L36 8 V21 C36 30 28 36 20 38 C12 36 4 30 4 21 V8 Z" fill="#facc15" stroke="#111" stroke-width="2.2"/><path d="M11 23 L13 13 L17 18 L20 10 L23 18 L27 13 L29 23 Z" fill="#1d4ed8" stroke="#111" stroke-width="1.4"/><rect x="12" y="25" width="16" height="3.5" rx="1" fill="#1d4ed8"/></svg>`,
  MI:  `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><circle cx="20" cy="20" r="17" fill="#1d4ed8" stroke="#111" stroke-width="2.2"/><circle cx="20" cy="20" r="11" fill="none" stroke="#facc15" stroke-width="2.2" stroke-dasharray="4 2.2"/><polygon points="20,9 23,17 31,20 23,23 20,31 17,23 9,20 17,17" fill="#facc15" stroke="#111" stroke-width="1"/><circle cx="20" cy="20" r="3" fill="#1d4ed8"/></svg>`,
  RCB: `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L35 8 V22 C35 30 28 35 20 38 C12 35 5 30 5 22 V8 Z" fill="#dc2626" stroke="#111" stroke-width="2.2"/><path d="M20 2 L35 8 V22 C35 30 28 35 20 38 Z" fill="#111111" opacity="0.32"/><path d="M13 16 L16 10 L20 14 L24 10 L27 16 Z" fill="#facc15"/><circle cx="20" cy="24" r="6.5" fill="#facc15" stroke="#111" stroke-width="1.3"/><circle cx="20" cy="24" r="2.5" fill="#dc2626"/></svg>`,
  KKR: `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L36 9 V22 C36 30 28 36 20 38 C12 36 4 30 4 22 V9 Z" fill="#6b21a8" stroke="#111" stroke-width="2.2"/><path d="M14 28 V16 C14 11 26 11 26 16 V28 L20 24 Z" fill="#facc15" stroke="#111" stroke-width="1.4"/><line x1="20" y1="12" x2="20" y2="25" stroke="#6b21a8" stroke-width="2"/><line x1="15" y1="18" x2="25" y2="18" stroke="#6b21a8" stroke-width="2"/></svg>`,
  SRH: `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><circle cx="20" cy="20" r="17" fill="#f97316" stroke="#111" stroke-width="2.2"/><path d="M6 25 H34" stroke="#111" stroke-width="2.2"/><path d="M11 25 A9 9 0 0 1 29 25 Z" fill="#fef08a" stroke="#111" stroke-width="1.4"/><path d="M20 7 V13 M10 12 L14 16 M30 12 L26 16" stroke="#111" stroke-width="2" stroke-linecap="round"/><path d="M10 30 Q20 25 30 30" fill="none" stroke="#111" stroke-width="2"/></svg>`,
  RR:  `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L36 9 V22 C36 30 28 36 20 38 C12 36 4 30 4 22 V9 Z" fill="#ec4899" stroke="#111" stroke-width="2.2"/><path d="M10 25 L12 14 L16.5 19 L20 11 L23.5 19 L28 14 L30 25 Z" fill="#facc15" stroke="#111" stroke-width="1.4"/><circle cx="20" cy="29" r="2.2" fill="#fff"/></svg>`,
  DC:  `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L35 8 V22 C35 30 28 35 20 38 C12 35 5 30 5 22 V8 Z" fill="#0284c7" stroke="#111" stroke-width="2.2"/><path d="M20 5 L32 10 V21 C32 27 26 32 20 34 Z" fill="#ef4444"/><polygon points="20,11 22.5,17 29,17.5 24,21.5 25.5,28 20,24.5 14.5,28 16,21.5 11,17.5 17.5,17" fill="#facc15" stroke="#111" stroke-width="1"/></svg>`,
  PBKS:`<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L36 8 V22 C36 30 28 36 20 38 C12 36 4 30 4 22 V8 Z" fill="#e11d48" stroke="#111" stroke-width="2.2"/><polygon points="20,8 28,15 25,28 15,28 12,15" fill="#facc15" stroke="#111" stroke-width="1.5"/><path d="M16 18 L20 14 L24 18 L20 24 Z" fill="#e11d48"/></svg>`,
  GT:  `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><path d="M20 2 L36 9 V22 C36 30 28 36 20 38 C12 36 4 30 4 22 V9 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="2.2"/><polygon points="23,7 12,22 20,22 17,33 28,18 20,18" fill="#38bdf8" stroke="#facc15" stroke-width="1"/></svg>`,
  LSG: `<svg viewBox="0 0 40 40" class="team-logo-svg" width="__S__" height="__S__"><circle cx="20" cy="20" r="17" fill="#0d9488" stroke="#111" stroke-width="2.2"/><path d="M7 18 Q14 11 20 18 Q26 11 33 18 Q26 24 20 21 Q14 24 7 18 Z" fill="#f97316" stroke="#111" stroke-width="1.3"/><circle cx="20" cy="27" r="4" fill="#facc15" stroke="#111" stroke-width="1.2"/></svg>`
};

function getTeamLogo(teamId, size=20){
  const svg = TEAM_LOGO_SVGS[teamId];
  return svg ? svg.replace(/__S__/g, String(size)) : '';
}


// ==================== V28: CUSTOM CARTOON CRICKET PLAYER AVATAR GENERATOR ====================
function getPlayerCartoonAvatar(p, size=40){
  if (!p) return '';
  let h = 0;
  for (let i = 0; i < p.name.length; i++) h = ((h << 5) - h + p.name.charCodeAt(i)) | 0;
  h = Math.abs(h);

  const indSkins = ['#d89b6c', '#c68652', '#b37142', '#e0ab7e'];
  const osSkins  = ['#f3c6a5', '#e8b48c', '#c98a5b', '#8d5524', '#f1c29b'];
  const skin = p.os ? osSkins[h % osSkins.length] : indSkins[h % indSkins.length];

  const hairColors = p.os ? ['#1f1b18', '#4a3222', '#8c6239', '#c99b4b', '#2b2623'] : ['#141414', '#1f1a17', '#2c221e'];
  const hair = hairColors[(h >> 2) % hairColors.length];
  const hasBeard = (h % 3) !== 0;
  const hairStyle = (h >> 4) % 4; // 0: classic, 1: spiky, 2: curly/full, 3: cap/headband

  // Jersey color: franchise color if sold, otherwise crisp role-coded kit
  const teamObj = p.soldTo ? state.teams.find(x => x.id === p.soldTo) : null;
  const roleColors = { B: '#2563eb', WK: '#0891b2', AR: '#7c3aed', BW: '#d97706' };
  const jersey = teamObj ? teamObj.color : (roleColors[p.role] || '#2563eb');
  const bgTint = p.tier === 'S' ? '#fef3c7' : p.tier === 'A' ? '#e0f2fe' : '#f1f5f9';

  let hairSVG = '';
  if (hairStyle === 0) {
    hairSVG = `<path d="M12 18 C12 9 28 9 28 18 C26 14 14 14 12 18 Z" fill="${hair}" stroke="#111" stroke-width="1.2"/>`;
  } else if (hairStyle === 1) {
    hairSVG = `<path d="M12 18 L13 11 L17 13 L20 8 L23 13 L27 11 L28 18 C25 14 15 14 12 18 Z" fill="${hair}" stroke="#111" stroke-width="1.2"/>`;
  } else if (hairStyle === 2) {
    hairSVG = `<path d="M11 19 C10 10 17 8 20 9 C23 8 30 10 29 19 C26 15 14 15 11 19 Z" fill="${hair}" stroke="#111" stroke-width="1.2"/>`;
  } else {
    // Cricket Cap
    hairSVG = `<path d="M12 16 C12 9 28 9 28 16 Z" fill="${jersey}" stroke="#111" stroke-width="1.3"/><path d="M11 16 H31" stroke="#111" stroke-width="2" stroke-linecap="round"/>`;
  }

  const beardSVG = hasBeard
    ? `<path d="M14 23 C14 27.5 26 27.5 26 23 C24.5 25.5 15.5 25.5 14 23 Z" fill="${hair}" opacity="0.88"/>`
    : '';

  // Mini role prop in bottom-right corner
  let propSVG = '';
  if (p.role === 'B' || p.role === 'AR') {
    propSVG = `<rect x="30.5" y="25" width="3.5" height="11" rx="1" transform="rotate(-18 32 30)" fill="#f59e0b" stroke="#111" stroke-width="1"/>`;
  } else if (p.role === 'BW') {
    propSVG = `<circle cx="32.5" cy="32.5" r="4" fill="#dc2626" stroke="#111" stroke-width="1.1"/><path d="M29.8 31.2 Q32.5 33 35.2 31.2" fill="none" stroke="#fff" stroke-width="0.9"/>`;
  } else if (p.role === 'WK') {
    propSVG = `<rect x="29" y="28" width="7" height="7" rx="2" fill="#10b981" stroke="#111" stroke-width="1.1"/>`;
  }

  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" style="display:block">
    <rect width="40" height="40" fill="${bgTint}"/>
    <path d="M7 40 C7 31 13 28 20 28 C27 28 33 31 33 40 Z" fill="${jersey}" stroke="#111" stroke-width="1.6"/>
    <path d="M16 28 L20 33 L24 28" fill="none" stroke="#111" stroke-width="1.3"/>
    <rect x="17.5" y="24" width="5" height="5" fill="${skin}"/>
    <circle cx="20" cy="18.5" r="8" fill="${skin}" stroke="#111" stroke-width="1.5"/>
    ${hairSVG}
    <circle cx="17.2" cy="18.5" r="1.15" fill="#111"/>
    <circle cx="22.8" cy="18.5" r="1.15" fill="#111"/>
    <path d="M17.5 22.3 Q20 24.2 22.5 22.3" fill="none" stroke="#111" stroke-width="1.2" stroke-linecap="round"/>
    ${beardSVG}
    ${propSVG}
  </svg>`;
}





// ==================== V55: REALISTIC PLAYER VALUATION FACTORS (AGE, CAPTAINCY, AVAILABILITY, FORM, INJURY RISK) ====================
const PROVEN_CAPTAINS = new Set([
  'Shreyas Iyer','Rishabh Pant','Hardik Pandya','KL Rahul','Sanju Samson','Shubman Gill',
  'Ruturaj Gaikwad','Suryakumar Yadav','Pat Cummins','Rohit Sharma','Virat Kohli',
  'Aiden Markram','Mitchell Marsh','Nicholas Pooran','Rashid Khan','Axar Patel','Ravindra Jadeja',
  'Jos Buttler','Mitchell Santner','Sam Curran','David Miller','Shai Hope','Dasun Shanaka'
]);

const INJURY_PRONE_PLAYERS = new Set([
  'Jofra Archer','Mayank Yadav','Deepak Chahar','Anrich Nortje','Lockie Ferguson',
  'Mark Wood','Gerald Coetzee','Mohsin Khan','Prasidh Krishna','T. Natarajan',
  'Spencer Johnson','Mitchell Marsh','Cameron Green','Hardik Pandya','Wanindu Hasaranga'
]);

const PARTIAL_AVAIL_RISK = new Set([
  'Josh Hazlewood','Pat Cummins','Mitchell Starc','Jos Buttler','Phil Salt','Will Jacks',
  'Liam Livingstone','Sam Curran','Jofra Archer','Ben Duckett','Jacob Bethell','Jamie Smith',
  'Gus Atkinson','Brydon Carse','Jamie Overton','Kagiso Rabada','Marco Jansen','Aiden Markram'
]);

// Known ages (as of Nov 2026) for marquee & top stars; others get deterministic realistic ages
const KNOWN_AGES = {
  'Virat Kohli':38,'Rohit Sharma':39,'Ravindra Jadeja':37,'Bhuvneshwar Kumar':36,'Mohammad Shami':36,
  'Sunil Narine':38,'Jos Buttler':36,'Trent Boult':37,'Mitchell Starc':36,'David Miller':37,
  'Suryakumar Yadav':36,'Yuzvendra Chahal':36,'KL Rahul':34,'Hardik Pandya':33,'Jasprit Bumrah':32,
  'Pat Cummins':33,'Travis Head':32,'Heinrich Klaasen':35,'Marcus Stoinis':37,'Mitchell Marsh':35,
  'Josh Hazlewood':35,'Kagiso Rabada':31,'Sanju Samson':32,'Shreyas Iyer':31,'Axar Patel':32,
  'Kuldeep Yadav':31,'Varun Chakravarthy':35,'Mohammad Siraj':32,'Aiden Markram':32,'Nicholas Pooran':31,
  'Rishabh Pant':29,'Ishan Kishan':28,'Ruturaj Gaikwad':29,'Shubman Gill':27,'Arshdeep Singh':27,
  'Rinku Singh':29,'Shivam Dube':33,'Tim David':30,'Shimron Hetmyer':29,'Sam Curran':28,'Will Jacks':28,
  'Rashid Khan':28,'Phil Salt':30,'Lockie Ferguson':35,'Marco Jansen':26,'Yashasvi Jaiswal':24,
  'Abhishek Sharma':26,'Tilak Varma':24,'Noor Ahmad':21,'Sai Sudharsan':25,'Tristan Stubbs':26,
  'Dhruv Jurel':25,'Riyan Parag':25,'Mayank Yadav':24,'Nitish Kumar Reddy':23,'Harshit Rana':24,
  'Dewald Brevis':23,'Jacob Bethell':23,'Vaibhav Suryavanshi':15,'Angkrish Raghuvanshi':21,
  'Matheesha Pathirana':23,'Cameron Green':27,'Rachin Ravindra':27,'Jake Fraser-McGurk':24
};

function getPlayerMarketProfile(p){
  if (!p) return { age:26, isCaptain:false, avail:'Full Season', injRisk:'Low', formTag:'Steady' };
  const h = p.name.split('').reduce((a,c)=>a+c.charCodeAt(0), 0);
  const age = p.age || KNOWN_AGES[p.name] || (p.set === 'Set 4' || (p.set && p.set.startsWith('U')) ? (19 + (h % 7)) : (24 + (h % 9)));
  const isCaptain = PROVEN_CAPTAINS.has(p.name);
  const injRisk = INJURY_PRONE_PLAYERS.has(p.name) ? 'High' : (p.role === 'BW' && !isSpinner(p) && age >= 32) ? 'Med' : 'Low';
  const avail = PARTIAL_AVAIL_RISK.has(p.name) ? 'Int\'l Clash Risk' : 'Full Season';
  const formTag = (p.ovr >= 91 && age <= 31) ? 'Red Hot' : (age >= 36 ? 'Veteran' : (h % 5 === 0 ? 'Hot' : h % 7 === 0 ? 'Mixed' : 'Steady'));
  return { age, isCaptain, avail, injRisk, formTag };
}
