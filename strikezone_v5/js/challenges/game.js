(() => {
  const intro=document.querySelector('[data-game-intro]');
  const panel=document.querySelector('[data-game-panel]');
  const result=document.querySelector('[data-game-result]');
  if(!intro||!panel||!result) return;
  const $=s=>document.querySelector(s);
  const startBtn=$('[data-start]'), hitBtn=$('[data-hit]'), exitBtn=$('[data-exit]'), restartBtn=$('[data-restart]');
  const scoreEl=$('[data-score]'), strikesEl=$('[data-strikes]'), timeEl=$('[data-time]'), levelEl=$('[data-level]'), hitsEl=$('[data-hits]'), comboEl=$('[data-combo]'), feedback=$('[data-feedback]'), ball=$('[data-ball]'), perfect=$('[data-perfect-zone]'), good=$('[data-good-zone]'), goalFill=$('[data-goal-fill]'), playerEl=$('[data-player]');
  const finalScore=$('[data-final-score]'), finalSummary=$('[data-final-summary]'), resultTitle=$('[data-result-title]'), unlock=$('[data-unlock]'), unlockCopy=$('[data-unlock-copy]'), rewardLink=$('[data-reward-link]');
  const params=new URLSearchParams(location.search); const playerId=params.get('player')||'ichiro-suzuki'; if(!window.StrikeZoneRewards?.session()){window.StrikeZoneRewards?.requireSession(`juego.html?player=${encodeURIComponent(playerId)}`);return;}
  const player=(window.STRIKEZONE_PLAYERS||[]).find(p=>p.id===playerId); if(playerEl) playerEl.textContent=player?.name||'Carta internacional';
  const TARGET=3000, LIMIT=45, STRIKES_MAX=3;
  let running=false,score=0,strikes=0,hits=0,combo=0,level=1,pos=.12,dir=1,speed=.47,zone=.22,timeLeft=LIMIT,last=0,raf=0,lastHitAt=0,timerId=0;
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  function updateUI(){scoreEl.textContent=score.toLocaleString('es-MX');strikesEl.textContent=`${strikes} / ${STRIKES_MAX}`;timeEl.textContent=`${Math.max(0,Math.ceil(timeLeft))} s`;hitsEl.textContent=hits;comboEl.textContent=`x${combo}`;levelEl.textContent=level;goalFill.style.width=`${clamp(score/TARGET*100,0,100)}%`;perfect.style.width=`${zone*100}%`;perfect.style.left=`${(0.5-zone/2)*100}%`;const gw=Math.min(.52,zone+.20);good.style.width=`${gw*100}%`;good.style.left=`${(0.5-gw/2)*100}%`;}
  function reset(){score=0;strikes=0;hits=0;combo=0;level=1;pos=.12;dir=1;speed=.47;zone=.22;timeLeft=LIMIT;last=0;feedback.textContent='¡Batea cuando la pelota llegue al centro!';ball.style.left=`${pos*100}%`;unlock.hidden=true;rewardLink.hidden=true;updateUI();}
  function tick(t){if(!running)return;if(!last)last=t;const dt=Math.min(.05,(t-last)/1000);last=t;pos+=dir*speed*dt;if(pos>=.985){pos=.985;dir=-1}else if(pos<=.015){pos=.015;dir=1}ball.style.left=`${pos*100}%`;raf=requestAnimationFrame(tick)}
  function startTimer(){clearInterval(timerId);timerId=setInterval(()=>{if(!running)return;timeLeft-=.1;if(timeLeft<=0){timeLeft=0;updateUI();finish(false,'Se acabó el tiempo.');return}updateUI()},100)}
  function begin(){reset();intro.hidden=true;result.hidden=true;panel.hidden=false;running=true;last=0;startTimer();raf=requestAnimationFrame(tick);hitBtn.focus()}
  function hit(){if(!running)return;const now=performance.now();if(now-lastHitAt<260)return;lastHitAt=now;const d=Math.abs(pos-.5);const perfectHalf=zone/2;const goodHalf=perfectHalf+.10;if(d<=perfectHalf){combo++;hits++;const bonus=Math.min(250,(combo-1)*50);score+=500+bonus;feedback.textContent=`PERFECT HIT +${500+bonus}`;}else if(d<=goodHalf){combo++;hits++;score+=250;feedback.textContent='GOOD +250';}else{strikes++;combo=0;feedback.textContent='STRIKE';}
    if(hits>0){level=Math.min(6,1+Math.floor(hits/2));speed=.47+(level-1)*.105;zone=Math.max(.095,.22-(level-1)*.025)}updateUI();if(score>=TARGET){finish(true,'Meta alcanzada.')}else if(strikes>=STRIKES_MAX){finish(false,'Tres strikes. Fin de la entrada.')}}
  function saveCard(){if(!playerId||!player)return;window.StrikeZoneRewards?.unlock(player,'minijuego');}
  function finish(won,reason){if(!running)return;running=false;cancelAnimationFrame(raf);clearInterval(timerId);panel.hidden=true;result.hidden=false;finalScore.textContent=`${score.toLocaleString('es-MX')} pts`;if(won){saveCard();resultTitle.textContent='¡Reto superado!';finalSummary.textContent=`${player?.name||'La carta internacional'} quedó desbloqueada con ${hits} hits y ${Math.ceil(LIMIT-timeLeft)} segundos de juego.`;unlock.hidden=false;unlockCopy.textContent=`${player?.name||'La carta'} se guardó en tu colección local.`;rewardLink.hidden=false;window.strikezoneConfetti?.(); window.StrikeZoneFeedback?.show('¡Carta desbloqueada!');}else{resultTitle.textContent='Fin de la entrada';const missing=Math.max(0,TARGET-score);finalSummary.textContent=`${reason} Lograste ${hits} hits. Te faltaron ${missing.toLocaleString('es-MX')} puntos para desbloquear ${player?.name||'la carta'}.`;}}
  startBtn.addEventListener('click',begin);restartBtn.addEventListener('click',begin);hitBtn.addEventListener('click',hit);exitBtn.addEventListener('click',()=>finish(false,'Entrada terminada por el jugador.'));
  document.addEventListener('keydown',e=>{if(running&&e.code==='Space'&&!['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();hit()}});
})();
