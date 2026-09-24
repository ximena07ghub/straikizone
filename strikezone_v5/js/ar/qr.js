(() => {
  const FALLBACK='https://willowy-crisp-7d943a.netlify.app';
  const isLocal=['localhost','127.0.0.1'].includes(location.hostname);
  const base=((location.protocol==='http:'||location.protocol==='https:')&&!isLocal)?location.origin:FALLBACK;
  const entries=[['pelotaQr','ar-pelota.html'],['stadiumQr','ar-estadio.html'],['rewardQr','ar-premio.html']];
  entries.forEach(([id,path])=>{const box=document.getElementById(id);if(!box||typeof QRCode==='undefined')return;box.innerHTML='';new QRCode(box,{text:`${base}/${path}`,width:180,height:180,colorDark:'#142319',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})});
})();
