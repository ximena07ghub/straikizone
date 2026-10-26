(() => {
  const cards=window.STRIKEZONE_AR_CARDS||{};
  const id=new URLSearchParams(location.search).get('card')||'yadier-molina';
  const card=cards[id]||cards['yadier-molina'];
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  $('[data-title]').textContent=card.name;
  $$('[data-name]').forEach(el=>el.textContent=card.name);
  $$('[data-team]').forEach(el=>el.textContent=card.team);
  $$('[data-category]').forEach(el=>el.textContent=card.category);
  $$('[data-number]').forEach(el=>el.textContent=card.number||'01');
  const role=$('[data-role]'); if(role) role.textContent=card.role||'MLB';
  const bioEl=$('[data-bio]'); if(bioEl) bioEl.textContent=card.bio;

  // El frente es visual; el reverso impreso completo es el target que compila MindAR.
  const frontPrint=$('[data-front-print-image]');
  if(frontPrint){frontPrint.src=card.frontImage || card.markerImage || 'assets/cards/yadier-molina-front.png';frontPrint.alt=`Frente de tarjeta de ${card.name}`;}
  const backPrint=$('[data-back-print-image]');
  if(backPrint){backPrint.src=card.backImage || card.targetImage;backPrint.alt=`Reverso AR de ${card.name} con el QR de ${card.modelLabel || 'su modelo'}`;}

  const stats=$('[data-stats]');
  if(stats) stats.innerHTML=card.stats.map(([k,v])=>`<div class="print-stat"><span>${k}</span><strong>${v}</strong></div>`).join('');

  const fallback=$('[data-qr-fallback]');
  if(fallback){fallback.src=card.qr;fallback.alt=`QR AR de ${card.name}`;}

  const arPath=`ar-carta.html?card=${encodeURIComponent(card.id)}`;
  const modelPath=`ar-carta.html?model=${encodeURIComponent(card.modelKey || '')}`;
  const local=['localhost','127.0.0.1',''].includes(location.hostname);
  const fallbackBase='https://strikezonev4.netlify.app';
  const base=(!local&&(location.protocol==='https:'||location.protocol==='http:'))?location.origin:fallbackBase;
  const url=`${base}/${modelPath}`;
  const qrBox=$('[data-qr]');
  if(qrBox && typeof QRCode!=='undefined'){
    qrBox.innerHTML='';
    new QRCode(qrBox,{
      text:url,
      width:420,
      height:420,
      colorDark:'#000000',
      colorLight:'#ffffff',
      correctLevel:QRCode.CorrectLevel.Q
    });
  }

  const note=$('[data-url-note]');
  if(note) note.innerHTML=local
    ? `El QR abre el visor del modelo <strong>${card.modelLabel || ''}</strong>: <code>${url}</code>. Publica el proyecto en Netlify para probarlo en el teléfono.`
    : `QR listo para el modelo <strong>${card.modelLabel || ''}</strong>: <code>${url}</code>. Imprime frente y reverso al mismo tamaño.`;
  const open=$('[data-open-ar]');if(open)open.href=arPath;
  const printButton=$('[data-print]');if(printButton)printButton.addEventListener('click',()=>window.print());
  document.title=`StrikeZone | Tarjeta ${card.name}`;
})();
