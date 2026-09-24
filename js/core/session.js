window.StrikeZoneSession = (() => {
  function get(){try{return JSON.parse(localStorage.getItem('strikezoneSession')||'null')}catch{return null}}
  function require(returnUrl){
    if(get()) return true;
    const next=returnUrl||`${location.pathname.split('/').pop()}${location.search||''}`;
    location.href=`login.html?next=${encodeURIComponent(next)}`;
    return false;
  }
  return {get,require};
})();
