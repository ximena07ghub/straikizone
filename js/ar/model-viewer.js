(() => {
  const viewer=document.querySelector('model-viewer'),stage=document.querySelector('[data-model-stage]');if(!viewer)return;
  const spin=document.querySelector('[data-spin]'),bounce=document.querySelector('[data-bounce]'),celebrate=document.querySelector('[data-celebrate]');let spinning=false;
  spin?.addEventListener('click',()=>{if(spinning)return;spinning=true;const start=performance.now(),dur=1700;const step=t=>{const p=Math.min(1,(t-start)/dur),e=1-Math.pow(1-p,3);viewer.setAttribute('orientation',`0deg ${Math.round(360*e)}deg 0deg`);if(p<1)requestAnimationFrame(step);else{viewer.setAttribute('orientation','0deg 0deg 0deg');spinning=false}};requestAnimationFrame(step)});
  bounce?.addEventListener('click',()=>{stage?.classList.remove('is-bouncing');void stage?.offsetWidth;stage?.classList.add('is-bouncing');setTimeout(()=>stage?.classList.remove('is-bouncing'),1450)});
  celebrate?.addEventListener('click',()=>{spin?.click();window.strikezoneConfetti?.(64)});
})();
