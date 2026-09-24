(() => {
  const chips=[...document.querySelectorAll('[data-gallery-filter]')];
  const cards=[...document.querySelectorAll('[data-media-card]')];
  chips.forEach(chip=>chip.addEventListener('click',()=>{
    const value=chip.dataset.galleryFilter;
    chips.forEach(c=>c.classList.toggle('is-active',c===chip));
    cards.forEach(card=>card.hidden=!(value==='all'||card.dataset.mediaType===value));
    window.StrikeZoneFeedback?.show(value==='all'?'Mostrando toda la galería':`Mostrando ${value==='image'?'imágenes':'videos'}`);
  }));
  document.querySelectorAll('.media-card video').forEach(v=>{const card=v.closest('.media-card');card?.addEventListener('mouseenter',()=>v.play().catch(()=>{}));card?.addEventListener('mouseleave',()=>{v.pause();v.currentTime=0});});
})();
