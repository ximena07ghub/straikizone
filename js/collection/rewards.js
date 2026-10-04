window.StrikeZoneRewards = (() => {
  const COLLECTION='strikezoneCollection', REWARDS='strikezoneRewards';
  const read = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const session = () => { try { return JSON.parse(localStorage.getItem('strikezoneSession') || 'null'); } catch { return null; } };
  const isUnlocked = id => read(COLLECTION).includes(id);
  const unlock = (player, source='collection') => {
    if(!player?.id) return false;
    const ids=read(COLLECTION);
    if(!ids.includes(player.id)){ids.push(player.id);write(COLLECTION,ids)}
    const rewards=read(REWARDS);
    if(!rewards.some(r=>r.playerId===player.id)){
      rewards.push({playerId:player.id,source,createdAt:Date.now(),hasAR:Boolean(player.arCard||player.ar)});
    }
    write(REWARDS,rewards);
    return true;
  };

  const gameRewardPool = () => {
    const players=window.STRIKEZONE_PLAYERS||[];
    return players.filter(player => player.gameReward && (player.arCard || player.ar));
  };

  const getGameReward = currentPlayerId => {
    const all=gameRewardPool();
    if(!all.length) return null;

    const notUnlocked=all.filter(player => !isUnlocked(player.id));
    const source=notUnlocked.length ? notUnlocked : all;
    const withoutCurrent=source.filter(player => player.id!==currentPlayerId);
    const candidates=withoutCurrent.length ? withoutCurrent : source;
    return candidates[Math.floor(Math.random()*candidates.length)] || null;
  };
  const requireSession = returnUrl => {
    if(session()) return true;
    location.href=`login.html?next=${encodeURIComponent(returnUrl || location.href.split('/').pop())}`; return false;
  };
  return {readCollection:()=>read(COLLECTION),readRewards:()=>read(REWARDS),isUnlocked,unlock,getGameReward,gameRewardPool,session,requireSession};
})();
