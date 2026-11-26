// ============================================================================
// THE GAVEL HOUSE — MASSIVE NO-REPEAT OFFLINE ENGINE (v49)
// Uses Fisher-Yates no-repeat decks so statements NEVER repeat back-to-back!
// ============================================================================
const _offlineDecks = {};

function pickFresh(deckKey, arr){
  if (!arr || !arr.length) return '';
  if (arr.length === 1) return arr[0];
  let deck = _offlineDecks[deckKey];
  if (!deck || !deck.length) {
    deck = Array.from({ length: arr.length }, (_, i) => i);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    _offlineDecks[deckKey] = deck;
  }
  return arr[deck.pop()];
}

// ==================== 1. HUDDLE DIALOGUES (50 COACH + 50 SPECIALIST + 50 OWNER) ====================
function buildOfflineHuddleLines(team, p, nextBid, ev, c, willStretch){
  const [coach, specialist, owner] = team.staff;
  const slotsLeft = Math.max(0, 18 - team.squad.length);
  const homeShort = team.home.split(' (')[0];
  const roleStr = roleLabel(p.role);
  const phaseStr = p.phase || roleStr;
  const lead = state.curLeader || 'rivals';
  const curP = fmtCr(state.curBid);
  const nxtP = fmtCr(nextBid);
  const capP = fmtCr(ev.val);
  const purseP = fmtCr(team.purse);
  const statStr = p.role === 'BW' ? `Econ ${p.econ || '8.0'}` : `SR ${p.sr || 138}`;
  const handStr = `${p.batHand || 'R'}HB${p.bowlStyle && p.bowlStyle !== '—' ? ' / ' + p.bowlStyle : ''}`;
  const roleHave = c[p.role] || 0;
  const roleTgt = team.targets[p.role] || 6;

  // 50 DISTINCT COACH STATEMENTS
  const coachLines = [
    `Hold the paddle! ${p.name} is already at ${curP} with ${lead} pushing hard. Next bid is ${nxtP} — do we back him?`,
    `Quick pause, team! ${p.name} (${phaseStr}) is a match-winner, but ${nxtP} is serious money. Worth stretching?`,
    `Look at the board — ${p.name} at ${nxtP}. If we miss him, who is our Plan B for ${homeShort}?`,
    `I love ${p.name}'s T20 impact (OVR ${p.ovr}), but ${lead} isn't blinking. Should we go one more round?`,
    `Timeout! We budgeted ~${capP} for ${p.name}. Going to ${nxtP} means tightening up on later sets — what's the call?`,
    `Wait a second! ${lead} looks desperate for ${p.name}. Are we genuinely buying or just making them bleed purse?`,
    `Let's breathe and think. ${p.name} is Tier-${p.tier} quality, and ${nxtP} is steep — does he start every single game for us?`,
    `Eyes on the purse, everyone. ${p.name} at ${nxtP} — if he fires at ${homeShort}, that's 4 points in the bag.`,
    `Hold on! How many ${roleStr}s of ${p.name}'s calibre are even left in the pool? We can't miss out lightly.`,
    `${lead} just raised fast. That tells me they want ${p.name} badly. Do we challenge them at ${nxtP}?`,
    `Pause the paddle! ${p.name} brings ${phaseStr} value we desperately need, but ${nxtP} eats into our bench budget.`,
    `Quick huddle! Is ${p.name} worth ${nxtP} on ${homeShort}, or should we pivot to two solid ${roleStr}s later?`,
    `I've watched ${p.name} win games under pressure. At ${nxtP}, are we comfortable going one more step?`,
    `Hold up — ${curP} already! If we jump to ${nxtP}, we're committing to ${p.name} as a core pillar of our XI.`,
    `Let's check our bowling and batting balance before raising for ${p.name} at ${nxtP}.`,
    `Honestly, ${p.name} fits our ${homeShort} blueprint like a glove, but ${nxtP} is right at our danger zone.`,
    `Don't get sucked into ego bidding with ${lead}! Tell me straight — is ${p.name} worth ${nxtP} to our XI?`,
    `We've been waiting for a Tier-${p.tier} ${roleStr}. ${p.name} is on the podium right now — do we pull the trigger at ${nxtP}?`,
    `Stop and look at ${lead}'s purse. If we push to ${nxtP}, they might fold right here!`,
    `I'm torn on this one. ${p.name} is OVR ${p.ovr}, pure class, yet ${nxtP} is a big chunk of our ${purseP}.`,
    `Let's be smart here. If we let ${p.name} go to ${lead} at ${curP}, we'll face him twice in the league!`,
    `Quick tactical check: does ${p.name} (${handStr}) give us the exact matchup edge we need at ${homeShort}?`,
    `Pause! We still have ${slotsLeft} mandatory slots to fill. Can we afford ${nxtP} for ${p.name} right now?`,
    `${p.name} is a proven IPL performer, no doubt. The only question is whether ${nxtP} is fair value or marquee tax.`,
    `Hold the paddle down for 10 seconds! Let's verify if ${p.name} actually improves our starting Playing XII.`,
    `Look at the energy in the room — ${p.name} is triggering a bidding war. Do we stay calm or go all in at ${nxtP}?`,
    `I rate ${p.name} very highly for ${phaseStr}, especially on ${homeShort}. Give me the green light for ${nxtP}?`,
    `Wait — we already have ${roleHave}/${roleTgt} in the ${roleStr} department. Is ${nxtP} too much for ${p.name}?`,
    `If we land ${p.name} at ${nxtP}, our top-level firepower jumps massively. What do the numbers say?`,
    `Let's not panic! ${lead} is trying to bully the room on ${p.name}. Should we stand our ground at ${nxtP}?`,
    `Give me a quick gut check: ${p.name} at ${nxtP} now, or save that cash for the upcoming sets?`,
    `We've scouted ${p.name} for months. He's sitting at ${curP} — one more raise to ${nxtP} could seal it.`,
    `Hold everything! At ${nxtP}, ${p.name} becomes one of our marquee investments. Is everyone on board?`,
    `Think about the playoffs! Players like ${p.name} (OVR ${p.ovr}) are the ones who win Qualifiers.`,
    `Let's check the overseas count and purse before we touch ${nxtP} for ${p.name}.`,
    `I don't want to overpay, but letting ${lead} walk away with ${p.name} at ${curP} feels risky.`,
    `Quick word with the table — ${p.name} is a rare ${phaseStr} specialist. Do we stretch to ${nxtP}?`,
    `Look, ${nxtP} is steep, I know. But try finding another ${roleStr} with ${p.name}'s ${statStr} later!`,
    `Pause! Are we bidding because we need ${p.name}, or just because ${lead} wants him?`,
    `Let's weigh this carefully: ${p.name} at ${nxtP} gives us instant match-winning pedigree at ${homeShort}.`,
    `We're at a crossroads on ${p.name}. Either we commit to ${nxtP} now or we drop out cleanly.`,
    `Wait a moment! Check our remaining purse (${purseP}) — does ${nxtP} leave us enough for death bowlers and keepers?`,
    `${p.name} has been on our shortlist since day one. ${nxtP} is high, so let's decide together right now.`,
    `Hold on! If ${lead} is at their limit, one sharp bid of ${nxtP} brings ${p.name} to ${team.id}!`,
    `Let's be ruthless and objective. Is ${p.name} worth ${nxtP} in this market?`,
    `Quick huddle! ${p.name} brings experience and composure. Do we back ourselves at ${nxtP}?`,
    `We can't afford a bad buy at ${nxtP}. Tell me honestly — is ${p.name} a must-have for ${homeShort}?`,
    `Look at our squad sheet: ${team.squad.length}/25 signed. Adding ${p.name} at ${nxtP} changes our whole balance.`,
    `I like ${p.name}'s attitude and skill set, but ${nxtP} is past our initial comfort zone. Thoughts?`,
    `Final call before the gavel moves — ${p.name} at ${nxtP}, yes or no?`
  ];

  // 50 DISTINCT SPECIALIST / ANALYST STATEMENTS
  const specLines = [
    `Roster check: ${c.B} Bat, ${c.WK} WK, ${c.AR} AR, ${c.BW} Bowl (${c.OS}/8 OS). On ${homeShort}, a ${phaseStr} like ${p.name} wins 2-3 games alone.`,
    `Data says ${p.name}'s skill profile (${statStr}) is rare in this pool. We only have ${roleHave}/${roleTgt} in his role.`,
    `Careful — if we overspend here, we still need ${slotsLeft} mandatory slots filled. Yet ${p.name} is Tier-${p.tier} quality.`,
    `Matchup-wise, ${p.name} (${handStr}) fixes a glaring tactical gap in our Playing XI for ${homeShort}.`,
    `We've got ${c.OS}/8 overseas used and ${c.spinners} spinners. ${willStretch ? `Adding ${p.name} elevates our starting XI immediately.` : `There are cheaper value picks coming in the next two sets.`}`,
    `Our analytics model pegs ${p.name}'s fair value at ${capP}. At ${nxtP}, ${nextBid <= ev.val ? 'he is still within our value zone!' : 'we are paying above model value.'}`,
    `Look at the phase impact: ${p.name} dominates as a ${phaseStr} (${statStr}), which is gold at ${homeShort}.`,
    `Scarcity alert! Elite ${roleStr}s with OVR ${p.ovr}+ are disappearing fast from the 520-player pool.`,
    `Checking our balance: ${c.B} batters, ${c.BW} bowlers, ${c.AR} all-rounders. ${p.name} slots straight into our first-choice XI.`,
    `If we pass on ${p.name}, our backup options in Set 2 and Set 3 drop by at least 6-8 OVR points.`,
    `From a bowling/batting matchup angle, ${p.name} (${handStr}) forces rival captains to rethink their powerplay and death plans.`,
    `Purse math check: spending ${nxtP} leaves us ${fmtCr(Math.max(0, team.purse - nextBid))} for ${Math.max(1, slotsLeft - 1)} remaining slots.`,
    `${p.name}'s numbers (${statStr}, OVR ${p.ovr}) hold up even on tough surfaces away from ${homeShort}.`,
    `We're currently at ${c.OS}/8 overseas. ${p.os ? (c.OS >= 6 ? 'Remember overseas slots are getting tight!' : 'We still have plenty of overseas room for him.') : 'Being an Indian star makes him twice as valuable for XI flexibility!'}`,
    `Tactically, ${p.name} gives us a huge edge against spin-heavy teams like CSK and LSG.`,
    `Look at ${lead}'s squad — they're already thin on purse. Pushing ${p.name} to ${nxtP} puts massive pressure on them.`,
    `Our scouting sheet flags ${p.name} as a high-impact ${phaseStr}. Hard to replace that skill set later.`,
    `Statistically, teams with two Tier-S/A ${roleStr}s make the playoffs 70% of the time. ${p.name} fits that mould.`,
    `On ${homeShort}, ${p.name}'s ${statStr} profile is a massive upgrade over average replacements in the uncapped sets.`,
    `Hold on — we have ${roleHave}/${roleTgt} ${roleStr}s already. ${roleHave < roleTgt ? 'We definitely still need this slot filled!' : 'We are fairly well-covered here.'}`,
    `Comparing ${p.name} to recent sales: ${nxtP} is actually ${nextBid <= ev.val ? 'right on market rate' : 'slightly inflated by the bidding war'}.`,
    `In tight 20-over chases, a ${phaseStr} with OVR ${p.ovr} is the difference between 14 points and 18 points.`,
    `Our bench depth is currently ${team.squad.length}/25. Signing ${p.name} locks down a key starting spot early.`,
    `Video analysis shows ${p.name} thrives under pressure — his ${statStr} doesn't dip in the big games.`,
    `Check the remaining sets: once ${p.set} finishes, the quality of ${roleStr}s drops sharply.`,
    `We need to protect our ${homeShort} fortress. ${p.name} is tailor-made for our home conditions.`,
    `Our valuation ceiling is ${capP}. Going to ${nxtP} is ${nextBid <= ev.val ? 'totally justified by the data.' : 'a risky stretch on our spreadsheets.'}`,
    `Look at the left-right / pace-spin variety: ${p.name} (${handStr}) balances our lineup nicely.`,
    `We've got ${c.WK} keepers and ${c.spinners} spinners so far. Make sure ${nxtP} doesn't starve our other priority slots.`,
    `Honestly, ${p.name} is a plug-and-play starter. Zero gamble, proven ${phaseStr} output (${statStr}).`,
    `If we land ${p.name}, we can afford to shop smartly for uncapped bargains in Set 4.`,
    `The market for Tier-${p.tier} ${p.os ? 'overseas' : 'Indian'} ${roleStr}s is red hot today — ${nxtP} isn't surprising at all.`,
    `Our win-probability sim jumps noticeably with ${p.name} (OVR ${p.ovr}) in the Playing XII.`,
    `Watch the average per slot: after ${nxtP}, we'd average ${fmtCr(Math.round(Math.max(0, team.purse - nextBid) / Math.max(1, slotsLeft - 1)))} per remaining player.`,
    `Matchup check: ${p.name} neutralises the top threats from MI, SRH, and RCB.`,
    `We rated ${p.name} as a Tier-${p.tier} target before the auction started. His ${statStr} speaks for itself.`,
    `Even if we don't win him, making ${lead} pay ${nxtP} weakens a direct playoff rival.`,
    `Check our core: ${team.squad.length} signed so far. ${p.name} would immediately be one of our top-3 impact players.`,
    `On flat tracks and slow tracks alike, ${p.name}'s OVR ${p.ovr} skill set travels well across all 10 venues.`,
    `Our scouts flagged ${p.name} as a high-ceiling ${phaseStr} — rare combination of consistency and firepower.`,
    `Don't forget the Impact Player rule! ${p.name} gives us tactical flexibility whether we bat first or chase.`,
    `We have ${c.AR} all-rounders and ${c.BW} bowlers. ${p.name} strengthens our ${roleStr} unit right away.`,
    `Data check: ${p.name} is ${p.os ? 'an overseas impact star' : 'a prized Indian core asset'} — Indian stars always command a premium.`,
    `If we walk away at ${curP}, we keep ${purseP} intact and dominate the middle sets.`,
    `Every title-winning IPL squad has a clutch ${phaseStr}. ${p.name} ticks every box on our sheet.`,
    `Looking at ${p.name}'s numbers (${statStr}), he's easily top-15 in his category across the entire auction.`,
    `Our spreadsheet says ${capP} max. Anything beyond that starts eating into our bowling/batting depth.`,
    `At ${homeShort}, you cannot afford to be light in the ${roleStr} department. ${p.name} solves that.`,
    `We've tracked ${p.name} all season — his form and OVR ${p.ovr} rating justify serious consideration.`,
    `All data is on the table: ${p.name} (${phaseStr}, ${statStr}) vs ${nxtP} out of our ${purseP}. Over to the boss!`
  ];

  // 25 DISTINCT OWNER STRETCH STATEMENTS
  const ownerStretch = [
    `We have ${purseP} in the bank. Back your instincts — stretch up to ${capP} and don't let ${lead} steal him!`,
    `Championships need bold calls. You have my green light to push ${p.name} up to ${capP} — raise that paddle!`,
    `We came here to build a title squad for ${homeShort}. Go ahead, stretch the budget and lock ${p.name} in!`,
    `Purse check looks healthy (${purseP} left). Stay in the fight for ${p.name} — make them pay or bring him home!`,
    `I trust our coaching staff 100%. If ${p.name} wins us games at ${homeShort}, go to ${nxtP} right now!`,
    `No regrets at the auction table! Raise the paddle to ${nxtP} and show ${lead} we mean business!`,
    `Fans want superstars and match-winners. ${p.name} is worth stretching to ${capP} — go get him!`,
    `We didn't save ${purseP} to sit on it! Push to ${nxtP} and bring ${p.name} to ${team.id}!`,
    `Approved! Stretch the ceiling to ${capP} — ${p.name} is too good to hand over to ${lead}!`,
    `Let's be fearless today. Put the paddle straight up at ${nxtP} and see if ${lead} blinks!`,
    `You convinced me. ${p.name}'s ${phaseStr} value is huge — go ahead and bid ${nxtP}!`,
    `We can balance the budget in the uncapped rounds. Lock in ${p.name} while we have the chance!`,
    `Green light from ownership! Take it to ${nxtP} — ${p.name} belongs in ${team.id} colours!`,
    `If we want the IPL trophy, we have to win bidding wars like this. Push to ${nxtP}!`,
    `I'm backing you on ${p.name}. Stretch up to ${capP} and don't back down to ${lead}!`,
    `Money is meant to buy match-winners, not sit unused at the end of Day 2. Go to ${nxtP}!`,
    `Solid analysis, team. ${p.name} is worth the extra stretch — raise the paddle!`,
    `Let's make a statement to the whole room! Bid ${nxtP} for ${p.name} right now!`,
    `We've got ${purseP} ready — we can absorb ${nxtP} and still build a deep 25-man roster.`,
    `Agreed! ${p.name} at ${homeShort} will be electric. Push the bid to ${nxtP}!`,
    `Don't let a direct rival steal a Tier-${p.tier} star for cheap. Stay in till ${capP}!`,
    `You have my backing — go one more round at ${nxtP} and bring ${p.name} home!`,
    `That's the exact kind of impact player we need. Stretch the budget and raise the paddle!`,
    `Done deal — I'm approving the stretch up to ${capP}. Let's win this bidding war!`,
    `Go for it! ${p.name} is a marquee addition for ${team.id} — hit ${nxtP}!`
  ];

  // 25 DISTINCT OWNER WALK-AWAY STATEMENTS
  const ownerWalk = [
    `No panic buying! ${nxtP} is past our ${capP} ceiling. Let ${lead} drain their purse and walk away!`,
    `Stay disciplined — we still have ${slotsLeft} slots to fill with ${purseP}. Drop out and save our firepower!`,
    `That's marquee tax right there. Shake your head, smile at ${lead}, and let them overpay!`,
    `Good try, but we stick to our valuation (${capP}). Plenty of smart value left in the 520-player pool!`,
    `Put the paddle down! Let ${lead} burn ${curP} on ${p.name} — we'll dominate the next set!`,
    `Discipline wins mega auctions, not ego. ${nxtP} is too rich for us — we're out!`,
    `We already pushed ${lead} way past fair value. Mission accomplished — step back cleanly!`,
    `Can't wreck our entire squad balance for one player. Hold our ${purseP} and move on!`,
    `No chance at ${nxtP}. Respect to ${p.name}, but ${team.id} won't overpay today.`,
    `Let's stay smart! Saving ${nxtP} right now lets us buy two quality starters later.`,
    `Hard pass from ownership. ${capP} was our red line and we're sticking to it!`,
    `Look at ${lead} sweating over that price — leave ${p.name} to them and protect our ${purseP}!`,
    `We have a clear Plan B on our sheet. Drop out on ${p.name} and stay calm!`,
    `Not worth stretching to ${nxtP} when we still need ${slotsLeft} mandatory signings.`,
    `Walk away! Every crore we save here makes us stronger in the middle and uncapped sets.`,
    `I'm calling it off — ${nxtP} is way above our ${capP} model. Let them have him!`,
    `Zero panic at the ${team.id} table. Drop the paddle and smile — we'll get better value soon!`,
    `We came in with strict price caps for a reason. ${p.name} at ${nxtP} is a no from me.`,
    `Let ${lead} carry that massive price tag into the season. We're keeping our ${purseP} safe!`,
    `Smart teams know when to fold. ${nxtP} is too steep — let's pivot to our next target!`,
    `Keep your powder dry, team! Bigger bargains are coming right after this set.`,
    `That's a trap price. Step out cleanly and let the other tables fight over ${p.name}!`,
    `We're out! ${capP} was our max and we won't break our budget discipline.`,
    `Good hustle pushing the price up, now let's walk away with our ${purseP} intact!`,
    `Pass! We'll build a deeper, more balanced XI by skipping ${p.name} at ${nxtP}.`
  ];

  return [
    `<b>${coach}:</b> "${pickFresh('hud_coach', coachLines)}"`,
    `<b>${specialist}:</b> "${pickFresh('hud_spec', specLines)}"`,
    `<b>${owner}:</b> "${willStretch ? pickFresh('hud_own_yes', ownerStretch) : pickFresh('hud_own_no', ownerWalk)}"`,
    `<b style="color:${willStretch?'#34d399':'#f87171'}">📋 FINAL HUDDLE VERDICT (${team.id}):</b> ${willStretch ? `✅ STRETCH BUDGET & STAY IN THE FIGHT!` : `🛑 WALK AWAY — SAVE PURSE FOR NEXT TARGETS!`}`
  ];
}

// ==================== 2. SOLD REACTIONS (NO-REPEAT DECKS) ====================
function buildOfflineSoldLoserMsg(lt, winTeam, p, price, isHighPrice, idx){
  const coach = lt.staff[0].split(' (')[0];
  const inflateMsgs = [
    `Smiling! Made ${winTeam.id} burn ${fmtCr(price)} on ${p.name} — our ${fmtCr(lt.purse)} stays intact!`,
    `Mission accomplished! Pushed ${winTeam.id} way past fair value on ${p.name}. Enjoy the purse dent!`,
    `Haha, ${fmtCr(price)}?! Glad we dropped out — ${coach} has a smarter Plan B ready.`,
    `We only stayed in to drain ${winTeam.id}'s budget — ${fmtCr(price)} is a huge win for our table!`,
    `Let ${winTeam.id} celebrate now; spending ${fmtCr(price)} will hurt them in the later sets!`,
    `Smart fold by ${lt.id}. Pushing ${p.name} to ${fmtCr(price)} was pure auction chess.`,
    `Zero regrets! We forced ${winTeam.id} to pay top dollar while keeping our ${fmtCr(lt.purse)} safe.`,
    `That's a massive overpay by ${winTeam.id} — we're laughing all the way to the next lot!`
  ];
  const guttedMsgs = [
    `Gutted to miss ${p.name} to ${winTeam.id} — pivoting straight to our next ${roleLabel(p.role)} target.`,
    `So close! ${p.name} was #1 on our board, but ${winTeam.id} had deeper pockets on that lot.`,
    `Tough loss at ${fmtCr(price)}. We'll remember this when ${winTeam.id}'s next target walks out!`,
    `Fair play to ${winTeam.id}, ${p.name} is a match-winner. Time to hunt value in the next set.`,
    `Heartbreaker! ${coach} really wanted ${p.name} for ${lt.home.split(' (')[0]}. On to Plan B!`,
    `We pushed as far as our budget allowed — ${winTeam.id} just edged us out on ${p.name}.`,
    `Stings to lose ${p.name} at ${fmtCr(price)}, especially to a rival like ${winTeam.id}.`,
    `Missed out by one bid! Resetting our sheet and locking onto the next ${roleLabel(p.role)}.`
  ];
  return (isHighPrice && idx % 2 === 0) ? pickFresh('sold_inf', inflateMsgs) : pickFresh('sold_gut', guttedMsgs);
}

function buildOfflineSoldWatcherMsg(wt, winTeam, p, price, isSteal, isHighPrice, otherWinStars){
  if (isSteal) {
    return pickFresh('sold_steal', [
      `How did everyone let ${winTeam.id} steal ${p.name} for just ${fmtCr(price)}?! Bargain of the auction!`,
      `Massive steal by ${winTeam.id}! ${p.name} at ${fmtCr(price)} is highway robbery.`,
      `Unbelievable value! ${winTeam.id} just grabbed a Tier-${p.tier} star for ${fmtCr(price)}!`,
      `Other tables were asleep on that lot — ${p.name} at ${fmtCr(price)} is a dream signing for ${winTeam.id}!`,
      `Wait, ${p.name} went for only ${fmtCr(price)}?! ${winTeam.id}'s scouts are smiling ear to ear.`
    ]);
  }
  if (isHighPrice) {
    return pickFresh('sold_high', [
      `${fmtCr(price)} for ${p.name}?! ${winTeam.id} just blew a huge chunk of their purse!`,
      `Bold call by ${winTeam.id}, but spending ${fmtCr(price)} leaves them tight for bench depth.`,
      `Whoa! ${fmtCr(price)} on one player — ${winTeam.id} better hope ${p.name} wins the Orange/Purple Cap!`,
      `Heavy marquee tax paid by ${winTeam.id}! Good news for the rest of us with bigger purses left.`,
      `${winTeam.id} went all-in at ${fmtCr(price)} — let's see how they fill the rest of their 25 slots!`
    ]);
  }
  if (otherWinStars.length) {
    return pickFresh('sold_core', [
      `Look at ${winTeam.id}'s core now: ${otherWinStars.join(' + ')} AND ${p.name}?! Scary lineup!`,
      `${winTeam.id} is quietly building a monster XI around ${otherWinStars[0]} and ${p.name}.`,
      `Seriously strong auction from ${winTeam.id} — pairing ${p.name} with ${otherWinStars[0]} is lethal!`,
      `Watch out league! ${winTeam.id}'s Playing XI with ${otherWinStars[0]} and ${p.name} looks title-ready.`,
      `That's a slick pickup by ${winTeam.id} — ${p.name} complements ${otherWinStars[0]} brilliantly.`
    ]);
  }
  return pickFresh('sold_fair', [
    `Smart pickup by ${winTeam.id} — ${p.name} fits ${winTeam.home.split(' (')[0]} nicely.`,
    `Clean, disciplined business from ${winTeam.id} getting ${p.name} at ${fmtCr(price)}.`,
    `Solid value signing! ${p.name} gives ${winTeam.id} great balance early in the auction.`,
    `Good buy by ${winTeam.id} — ${p.name} at ${fmtCr(price)} is right on the money.`
  ]);
}

// ==================== 3. TRADE ROUNDTABLE & TRADE CHAT (NO-REPEAT DECKS) ====================
function buildOfflineTradeRoundtableLine(pr){
  const t = pr.t, c = pr.c;
  const coach = t.staff[0].split(' (')[0];
  const homeS = t.home.split(' (')[0];
  const need = roleLabel(pr.need);
  const surp = roleLabel(pr.surplus);
  return pickFresh('tr_round', [
    `Looking for a quality ${need} (only ${c[pr.need]} signed). Open to 1-for-1 swaps from our ${surp} bench (${fmtCr(t.purse)} left).`,
    `${coach} wants one more ${need} for ${homeS}. Willing to move a ${surp} if the OVR matches!`,
    `We're heavy on ${surp} (${c[pr.surplus]}) and light on ${need}. Any GM want a fair swap?`,
    `Sitting on ${fmtCr(t.purse)} — ready to talk ${need} upgrades without breaking our Playing XI balance.`,
    `Our ${homeS} gameplan needs an extra ${need}. Send us serious offers for our ${surp} depth!`,
    `Phone lines are open at ${t.id}! We have surplus ${surp} talent and need a dependable ${need}.`,
    `If any franchise has a spare ${need}, ${t.id} can offer a strong ${surp} plus cash adjustment.`,
    `${coach} just reviewed our Playing XII — adding one ${need} makes us a complete title contender.`,
    `We won't give away core stars, but our ${surp} bench is available for a fair ${need} swap!`,
    `Happy to do smart business today: ${t.id} is hunting a ${need} and listening to offers on ${surp}s.`,
    `Look at our roster — ${c[pr.surplus]} ${surp}s is plenty. Let's turn that surplus into a frontline ${need}!`,
    `Targeting a match-ready ${need} for ${homeS}. Pitch us a balanced OVR swap!`,
    `With ${fmtCr(t.purse)} remaining, ${t.id} can absorb a slight price difference to land a top ${need}.`,
    `Open for 1-for-1 deals! ${coach} wants better ${need} cover before the 74-match season starts.`,
    `Any team short on ${surp}s? Talk to ${t.id} — we're actively shopping for a ${need}.`
  ]);
}

function buildOfflineTradeChatReply(t, ql, teamProp, c, wantsCancel, wantsApprove){
  const coach = t.staff[0].split(' (')[0];
  const homeS = t.home.split(' (')[0];
  const gapRole = c.WK < 2 ? 'Wicket-Keeper' : c.spinners < 2 ? 'Spinner' : c.BW < 7 ? 'Bowler' : 'Batter';

  if (wantsCancel && teamProp) {
    return {
      action: 'WITHDRAW',
      reply: pickFresh('tw_cancel', [
        `You're right — ${coach} agrees we're losing value here. Pulling our ${teamProp.teamA}⇄${teamProp.teamB} trade off the table right now!`,
        `Good catch! Looking closer at the numbers, we're calling off the ${teamProp.teamA}⇄${teamProp.teamB} swap immediately.`,
        `Fair point — no point weakening our ${homeS} XI. ${t.id} is withdrawing that trade proposal!`,
        `Thanks for the sanity check! ${coach} just nixed the ${teamProp.teamA}⇄${teamProp.teamB} deal.`
      ])
    };
  }
  if (wantsApprove && teamProp) {
    return {
      action: 'EXECUTE',
      reply: pickFresh('tw_approve', [
        `Agreed! That trade strengthens our ${homeS} balance — sealing the ${teamProp.teamA}⇄${teamProp.teamB} deal immediately!`,
        `Glad you like it! ${coach} is signing off and executing the ${teamProp.teamA}⇄${teamProp.teamB} swap right now.`,
        `Done deal! Both teams fill a real gap — locking in the ${teamProp.teamA}⇄${teamProp.teamB} trade!`,
        `100% on board — ${t.id} is confirming and executing the ${teamProp.teamA}⇄${teamProp.teamB} transfer!`
      ])
    };
  }
  if (/(why|reason|explain)/i.test(ql)) {
    return {
      action: 'NONE',
      reply: teamProp
        ? pickFresh('tw_why', [
            `Simple: this swap fills our ${gapRole} gap for ${homeS} without hurting our overseas balance.`,
            `${coach} wanted better phase coverage at ${homeS}, and this 1-for-1 deal keeps both squads balanced.`,
            `We had surplus depth in one area and needed a reliable ${gapRole} — the OVR match made sense.`
          ])
        : `We haven't proposed a swap yet — ${coach} is happy with our core unless a top ${gapRole} becomes available.`
    };
  }
  if (/(who|available|offer|sell|give)/i.test(ql)) {
    const tradable = t.squad.map(id => state.players[id]).filter(Boolean).sort((a, b) => a.ovr - b.ovr).slice(0, 2).map(p => p.name).join(' or ');
    return {
      action: 'NONE',
      reply: tradable
        ? pickFresh('tw_who', [
            `We could listen to fair offers involving ${tradable} if you send us a solid ${gapRole} in return.`,
            `Bench players like ${tradable} are tradable — pitch us a balanced ${gapRole} swap in the Trade Desk!`,
            `${coach} is open to moving ${tradable} for a like-for-like ${gapRole} upgrade.`
          ])
        : `Still building our roster (${t.squad.length}/25) — check back once we have bench depth to trade!`
    };
  }
  return {
    action: 'NONE',
    reply: pickFresh('tw_gen', [
      `At ${t.id} (${t.squad.length}/25, ${fmtCr(t.purse)} left), we're open to fair 1-for-1 swaps to upgrade our ${gapRole} depth.`,
      `${coach} says ${t.id} will only trade if it directly strengthens our ${homeS} Playing XI.`,
      `No panic trades from ${t.id} — send us a balanced OVR offer in the Universal Trade Desk and we'll review it!`,
      `We're listening to all 9 tables, especially if someone has a quality ${gapRole} on their bench.`,
      `Smart trades win championships — ${t.id} is actively scouting ${gapRole} options right now.`
    ])
  };
}

// ==================== 4. PLAYING XI COACH CHAT (NO-REPEAT DECKS) ====================
function buildOfflineXICoachReply(t, ql, xi, impact){
  const coachName = t.staff[0].split(' (')[0];
  const bowlers = xi.filter(p => p.role === 'BW' || p.role === 'AR').length;
  const spinners = xi.filter(p => isSpinner(p)).length;
  const hasWK = xi.some(p => p.role === 'WK');
  const homeS = t.home.split(' (')[0];
  const opener = xi[0]?.name || 'our top order';

  if (/(balance|good or bad|review)/i.test(ql)) {
    return (bowlers >= 5 && hasWK)
      ? pickFresh('xi_bal_ok', [
          `✅ GOOD IDEA: Our ${homeS} XI is well-balanced with ${bowlers} bowling options, ${spinners} spinner(s), and ${impact ? impact.name : 'a strong bench'} as Impact Sub.`,
          `✅ GOOD IDEA: ${coachName} rates this XII highly — ${opener} up top, ${bowlers} bowlers, and solid depth for ${homeS}.`,
          `✅ GOOD IDEA: All three T20 phases are covered cleanly with ${bowlers} bowling choices and ${impact ? impact.name : 'strong bench cover'} ready.`
        ])
      : `❌ BAD IDEA: We have a gap (${!hasWK ? 'missing a specialist WK' : 'only ' + bowlers + ' bowling options'}) — tell me to "fix & rebuild XI" and I'll sort it!`;
  }
  if (/(impact|sub|12th)/i.test(ql)) {
    return impact
      ? pickFresh('xi_imp', [
          `✅ GOOD IDEA: ${impact.name} (${roleLabel(impact.role)}, OVR ${impact.ovr}) is our ideal Impact Sub — he gives us ${impact.role === 'BW' || impact.role === 'AR' ? 'an extra bowling weapon defending' : 'extra batting firepower chasing'}!`,
          `✅ GOOD IDEA: Keeping ${impact.name} as 12th man lets us adapt instantly to the toss at ${homeS}.`,
          `✅ GOOD IDEA: ${impact.name} is the perfect tactical Impact Player — high-impact ${roleLabel(impact.role)} without breaking the 4-overseas rule.`
        ])
      : `⚖️ MIXED IDEA: Sign more depth so we have a specialist Indian Impact Sub ready for ${homeS}.`;
  }
  if (/(weak|flaw|problem|gap|missing)/i.test(ql)) {
    const weakTxt = !hasWK ? 'no specialist keeper in the XI' : bowlers < 5 ? 'light on a 5th bowling option' : spinners < 2 && /chepauk|ekana|jaipur/i.test(homeS) ? `only ${spinners} spinner for ${homeS}` : 'finishing power in overs 17-20';
    return pickFresh('xi_weak', [
      `⚖️ HONEST ASSESSMENT: Our biggest area to watch is ${weakTxt}. Say "rebuild XI" or edit manually anytime!`,
      `⚖️ TACTICAL NOTE: If anything could hurt us at ${homeS}, it's ${weakTxt}. We can tweak the XII or look for a trade.`,
      `⚖️ COACH AUDIT: Solid core overall, though ${weakTxt} is something ${coachName} wants to tighten up.`
    ]);
  }
  return pickFresh('xi_gen', [
    `⚖️ MIXED IDEA: Our current XI has ${bowlers} bowling options and ${spinners} spinner(s) with ${impact ? impact.name : 'bench depth'} as Impact Sub. Say "fix batting order" or "add spinner" to rebuild!`,
    `✅ GOOD IDEA: ${coachName} likes our ${homeS} combination — ${opener} up top and ${bowlers} bowlers give us control in all 3 phases.`,
    `✅ GOOD IDEA: Every player is slotted into their natural IPL batting position. Tap Edit Manually if you want a custom tweak!`,
    `⚖️ TACTICAL VIEW: We've balanced batting depth and ${bowlers} bowling options for ${homeS}. Tell me if you want an extra spinner or pacer!`
  ]);
}

// ==================== 5. SEASON MATCH ONE-LINERS (NO-REPEAT DECKS) ====================
function buildOfflineMatchOneLiner(winnerId, loserId, venueS, scoreA, margin, potm, injNote, isSuperOver, bWins){
  if (isSuperOver) {
    return pickFresh('m_so', [
      `🔥 SUPER OVER CLASSIC at ${venueS}! ${winnerId} edge out ${loserId} — POTM: ${potm}. ${injNote}`,
      `⚡ NERVES OF STEEL! ${winnerId} snatch a dramatic Super Over win over ${loserId} (${potm} shines). ${injNote}`,
      `🎬 INSTANT CLASSIC at ${venueS}! ${winnerId} prevail in the Super Over — POTM: ${potm}. ${injNote}`
    ]);
  }
  if (bWins) {
    return pickFresh('m_chase', [
      `${winnerId} chase it down at ${venueS} by ${margin}, powered by POTM ${potm}! ${injNote}`,
      `Clinical chase! ${winnerId} overhaul ${loserId} by ${margin} — ${potm} stars. ${injNote}`,
      `${winnerId} hunt down ${scoreA + 1} at ${venueS} (${margin}) behind ${potm}'s match-winning display. ${injNote}`,
      `Ice-cool chasing from ${winnerId} at ${venueS}! Beat ${loserId} by ${margin} — POTM: ${potm}. ${injNote}`,
      `${winnerId} make light work of ${scoreA + 1} to defeat ${loserId} by ${margin} (${potm} takes POTM). ${injNote}`,
      `Statement chase at ${venueS}! ${winnerId} take 2 crucial points over ${loserId} by ${margin} — POTM: ${potm}. ${injNote}`
    ]);
  }
  return pickFresh('m_defend', [
    `${winnerId} defend ${scoreA} at ${venueS} to beat ${loserId} by ${margin} — POTM: ${potm}! ${injNote}`,
    `Bowling masterclass! ${winnerId} restrict ${loserId} and win by ${margin} (${potm} shines). ${injNote}`,
    `${winnerId} hold their nerve at ${venueS} to defeat ${loserId} by ${margin} — POTM: ${potm}. ${injNote}`,
    `Clinical defence! ${winnerId} choke ${loserId}'s chase to win by ${margin} (${potm} named POTM). ${injNote}`,
    `Fortress ${venueS}! ${winnerId} protect ${scoreA} and beat ${loserId} by ${margin} — POTM: ${potm}. ${injNote}`,
    `Clutch death bowling seals it! ${winnerId} overcome ${loserId} by ${margin} — POTM: ${potm}. ${injNote}`
  ]);
}


// ==================== 6. POSITION-AWARE SMART OFFLINE PLAYING XII ENGINE ====================
function buildSmartOfflinePlayingXII(t, pitchDesc=''){
  const pitchL = (pitchDesc || t.home || '').toLowerCase();
  const homeShort = (pitchDesc || t.home || 'Home Ground').split(' (')[0];
  const isSpinPitch = pitchL.includes('chepauk') || pitchL.includes('ekana') || pitchL.includes('jaipur') || pitchL.includes('spin');
  const isFlatPitch = pitchL.includes('chinnaswamy') || pitchL.includes('uppal') || pitchL.includes('wankhede') || pitchL.includes('flat');

  const pool = t.squad
    .map(id => state.players[id])
    .filter(p => p && !p.injured)
    .sort((a, b) => b.ovr - a.ovr);

  const xi = [];
  const used = new Set();
  let osCount = 0;

  const canAdd = (p) => p && !used.has(p.id) && xi.length < 11 && (!p.os || osCount < 4);
  const addPlayer = (p) => {
    if (!canAdd(p)) return false;
    xi.push(p);
    used.add(p.id);
    if (p.os) osCount++;
    return true;
  };
  const pickBest = (pred, maxCount=1) => {
    let added = 0;
    for (const p of pool) {
      if (added >= maxCount || xi.length >= 11) break;
      if (canAdd(p) && pred(p)) {
        addPlayer(p);
        added++;
      }
    }
    return added;
  };

  // STEP 1: Lock 1 Specialist Wicket-Keeper first (preferring highest OVR)
  pickBest(p => p.role === 'WK', 1);

  // STEP 2: Lock 2 Genuine Openers (#1-#2)
  const curOpeners = () => xi.filter(p => battingPosScore(p) <= 18).length;
  if (curOpeners() < 2) {
    pickBest(p => p.role !== 'BW' && battingPosScore(p) <= 18, 2 - curOpeners());
  }

  // STEP 3: Lock No. 3 Anchor / Top-Order (#3)
  pickBest(p => (p.role === 'B' || p.role === 'WK' || p.role === 'AR') && battingPosScore(p) > 18 && battingPosScore(p) <= 30, 1);

  // STEP 4: Lock No. 4 Middle-Order Enforcer (#4)
  pickBest(p => (p.role === 'B' || p.role === 'WK' || p.role === 'AR') && battingPosScore(p) > 30 && battingPosScore(p) <= 43, 1);

  // STEP 5: Lock 1-2 Death Finishers / Finisher All-Rounders (#5-#6)
  pickBest(p => (p.role !== 'BW') && (KNOWN_FINISHERS.has(p.name) || (p.phase && p.phase.includes('Finisher')) || (battingPosScore(p) > 43 && battingPosScore(p) <= 59)), 2);

  // STEP 6: Lock Bowling Core (5-6 genuine bowling options, pitch-matched!)
  const curSpinners = () => xi.filter(p => isSpinner(p) && (p.role === 'BW' || p.role === 'AR')).length;
  const targetSpin = isSpinPitch ? 2 : 1;
  if (curSpinners() < targetSpin) {
    pickBest(p => (p.role === 'BW' || p.role === 'AR') && isSpinner(p), targetSpin - curSpinners());
  }

  // Guarantee at least 1 Death Pace specialist if available
  const hasDeathPacer = () => xi.some(p => p.role === 'BW' && !isSpinner(p) && (p.phase === 'Death Pace' || (p.econ || 8.8) <= 8.1));
  if (!hasDeathPacer()) {
    pickBest(p => p.role === 'BW' && !isSpinner(p) && (p.phase === 'Death Pace' || (p.econ || 8.8) <= 8.1), 1);
  }

  // Guarantee at least 2-3 Pacers (flat/pace tracks prefer 3 pacers, spin tracks 2 pacers)
  const curPacers = () => xi.filter(p => p.role === 'BW' && !isSpinner(p)).length;
  const targetPacers = isSpinPitch ? 2 : 3;
  if (curPacers() < targetPacers) {
    pickBest(p => p.role === 'BW' && !isSpinner(p), targetPacers - curPacers());
  }

  // Ensure at least 5 total bowling options (BW + AR)
  const curBowlers = () => xi.filter(p => p.role === 'BW' || p.role === 'AR').length;
  if (curBowlers() < 5) {
    pickBest(p => p.role === 'AR', Math.min(2, 5 - curBowlers()));
  }
  if (curBowlers() < 5) {
    pickBest(p => p.role === 'BW' || p.role === 'AR', 5 - curBowlers());
  }

  // STEP 7: Fill remaining slots up to 11 (prefer batting depth on flat tracks, extra AR/spinner on spin tracks)
  if (xi.length < 11 && isSpinPitch) {
    pickBest(p => p.role === 'AR' || isSpinner(p), 11 - xi.length);
  } else if (xi.length < 11 && isFlatPitch) {
    pickBest(p => p.role === 'B' || p.role === 'AR', 11 - xi.length);
  }
  pickBest(() => true, 11 - xi.length);

  // STEP 8: Sort cleanly into real IPL batting order #1 to #11
  const orderedIds = autoSortBattingOrder(xi.map(p => p.id));
  const orderedXI = orderedIds.map(id => state.players[id]).filter(Boolean);

  // STEP 9: Pick smartest Impact Sub (Indian-only if 4 OS in XI)
  const impact = pickWiseImpactSub(t, orderedIds, pitchDesc || t.home);

  // STEP 10: Smart Captain & Vice-Captain selection (prefer Tier S/A Indian core or highest OVR star)
  const leaderRank = [...orderedXI].sort((a, b) => {
    const scoreA = a.ovr + (!a.os ? 3 : 0) + (a.role === 'B' || a.role === 'WK' || a.role === 'AR' ? 2 : 0);
    const scoreB = b.ovr + (!b.os ? 3 : 0) + (b.role === 'B' || b.role === 'WK' || b.role === 'AR' ? 2 : 0);
    return scoreB - scoreA;
  });
  const captainId = leaderRank[0]?.id ?? null;
  const vcId = leaderRank[1]?.id ?? null;

  // Build specific tactical note
  const openers = orderedXI.slice(0, 2).map(p => p.name.split(' ').slice(-1)[0]).join(' & ');
  const bowlersCount = orderedXI.filter(p => p.role === 'BW' || p.role === 'AR').length;
  const spinCount = orderedXI.filter(p => isSpinner(p) && (p.role === 'BW' || p.role === 'AR')).length;
  const note = `Position-balanced for ${homeShort}: ${openers} open, ${bowlersCount} bowling options (${spinCount} spin)${impact ? `, ⚡${impact.name} as Impact Sub` : ''}.`;

  return { xi: orderedXI, xiIds: orderedIds, impact, captainId, vcId, note };
}

// ==================== 7. OFFLINE TEAM VS TEAM TACTICAL COMPARISON ====================
function buildOfflineTeamComparison(tA, tB, venue, probA){
  const vL = (venue || '').toLowerCase();
  const isSpinV = vL.includes('chepauk') || vL.includes('ekana') || vL.includes('spin');
  const isFlatV = vL.includes('chinnaswamy') || vL.includes('uppal') || vL.includes('flat');

  const namesA = tA.xiText.split(',').map(s => s.replace(/\(.*?\)|\|.*/g, '').trim()).filter(Boolean);
  const namesB = tB.xiText.split(',').map(s => s.replace(/\(.*?\)|\|.*/g, '').trim()).filter(Boolean);
  const starA = namesA[0] || tA.name;
  const starB = namesB[0] || tB.name;
  const bowlA = namesA[Math.min(namesA.length - 1, 8)] || namesA[namesA.length - 1] || 'frontline attack';
  const bowlB = namesB[Math.min(namesB.length - 1, 8)] || namesB[namesB.length - 1] || 'frontline attack';

  const winner = probA >= 50 ? tA.name : tB.name;
  const loser = probA >= 50 ? tB.name : tA.name;
  const edgeA = isFlatV ? `Top-order firepower led by ${starA}` : isSpinV ? `Middle-overs control & spin depth` : `Balanced core around ${starA}`;
  const edgeB = isFlatV ? `Explosive chasing potential via ${starB}` : isSpinV ? `Disciplined bowling unit with ${bowlB}` : `Strong XI versatility led by ${starB}`;

  const rA = {
    bat: +Math.min(9.6, Math.max(6.0, tA.estRating + (isFlatV ? 0.3 : 0))).toFixed(1),
    bowl: +Math.min(9.6, Math.max(6.0, tA.estRating - 0.1 + (isSpinV ? 0.2 : 0))).toFixed(1),
    depth: +Math.min(9.5, Math.max(6.0, tA.estRating - 0.1)).toFixed(1),
    edge: edgeA
  };
  const rB = {
    bat: +Math.min(9.6, Math.max(6.0, tB.estRating + (isFlatV ? 0.2 : 0))).toFixed(1),
    bowl: +Math.min(9.6, Math.max(6.0, tB.estRating - 0.1 + (isSpinV ? 0.3 : 0))).toFixed(1),
    depth: +Math.min(9.5, Math.max(6.0, tB.estRating - 0.1)).toFixed(1),
    edge: edgeB
  };

  const keyBattle = `${starA} vs ${bowlB} in the Powerplay, plus ${starB} vs ${bowlA} under pressure.`;
  const verdict = `${winner} holds the tactical edge on ${venue} thanks to superior XI balance and phase coverage. ${loser} will need an explosive start from their top order to overcome ${winner}'s bowling depth.`;

  return { ratingsA: rA, ratingsB: rB, winner, keyBattle, verdict };
}
