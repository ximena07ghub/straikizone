(() => {
  const start=document.querySelector('[data-scan-start]'),stop=document.querySelector('[data-scan-stop]'),result=document.querySelector('[data-scan-result]');let scanner=null,active=false;
  const allowed=['ar-pelota.html','ar-estadio.html','ar-premio.html','ar-carta.html'];
  function message(t){result.textContent=t}
  function handle(decoded){let target='',destination='';try{const u=new URL(decoded,location.href);target=u.pathname.split('/').pop();destination=target+(u.search||'')}catch{target=decoded.split('?')[0].split('/').pop();destination=decoded}if(allowed.includes(target)){message('Código reconocido. Abriendo experiencia…');stopScan().finally(()=>location.href=destination)}else{message('Código leído, pero no corresponde a una experiencia StrikeZone.') }}
  async function startScan(){if(active)return;if(typeof Html5Qrcode==='undefined'){message('El lector no pudo cargarse. Usa la cámara del teléfono sobre uno de los QR de StrikeZone.');return}scanner=new Html5Qrcode('reader');try{await scanner.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},handle,()=>{});active=true;start.disabled=true;stop.disabled=false;message('Cámara activa. Coloca el QR dentro del recuadro.')}catch{message('No se pudo abrir la cámara. Revisa el permiso del navegador.')}}
  async function stopScan(){if(scanner&&active){try{await scanner.stop();await scanner.clear()}catch{}active=false;start.disabled=false;stop.disabled=true}}
  start?.addEventListener('click',startScan);stop?.addEventListener('click',stopScan);window.addEventListener('beforeunload',stopScan);
})();
