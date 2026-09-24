(async()=>{
  if(!window.StrikeZoneSession?.require('mis-fotos.html')) return;
  const grid=document.querySelector('[data-media-grid]'),empty=document.querySelector('[data-empty-media]'),count=document.querySelector('[data-media-count]');if(!grid)return;
  async function render(){const items=await window.StrikeZonePhotos.all();count.textContent=`${items.length} ${items.length===1?'elemento':'elementos'}`;grid.innerHTML='';empty.hidden=items.length>0;
    for(const item of items){const type=item.type||(item.blob?.type?.startsWith('video')?'video':'image'),url=URL.createObjectURL(item.blob);const card=document.createElement('article');card.className='saved-card';
      card.innerHTML=`<div class="saved-preview">${type==='video'?`<video src="${url}" controls playsinline></video>`:`<img src="${url}" alt="${escapeHtml(item.title||'Captura StrikeZone')}">`}</div><div class="saved-body"><strong>${escapeHtml(item.title||'StrikeZone')}</strong><small>${escapeHtml(item.filter||'Original')} · ${new Date(item.createdAt).toLocaleDateString('es-MX')}</small><div class="saved-actions"><button class="button" data-download>Descargar</button><button class="button" data-delete>Eliminar</button></div></div>`;
      card.querySelector('[data-download]').addEventListener('click',()=>{const a=document.createElement('a');a.href=url;a.download=`strikezone-${item.id}.${type==='video'?'webm':'jpg'}`;a.click();window.StrikeZoneFeedback?.show('Descarga iniciada')});
      card.querySelector('[data-delete]').addEventListener('click',async()=>{await window.StrikeZonePhotos.remove(item.id);URL.revokeObjectURL(url);window.StrikeZoneFeedback?.show('Elemento eliminado');render()});grid.appendChild(card)}
  }
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  render();
})();
