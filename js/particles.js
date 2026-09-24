(() => {
  const palette=['#2f6f36','#b7cb83','#f3d56b','#d94d43','#ffffff','#173a27'];
  window.strikezoneConfetti=(count=54)=>{
    const layer=document.getElementById('confetti-layer')||document.body.appendChild(Object.assign(document.createElement('div'),{id:'confetti-layer',className:'confetti-layer'}));
    for(let i=0;i<count;i++){
      const p=document.createElement('i');p.className='confetti-piece';p.style.left=`${Math.random()*100}%`;p.style.background=palette[i%palette.length];p.style.setProperty('--dur',`${1.8+Math.random()*1.7}s`);p.style.setProperty('--drift',`${-90+Math.random()*180}px`);p.style.setProperty('--spin',`${360+Math.random()*1080}deg`);p.style.animationDelay=`${Math.random()*.35}s`;p.style.width=`${7+Math.random()*7}px`;p.style.height=`${9+Math.random()*12}px`;layer.appendChild(p);setTimeout(()=>p.remove(),3900);
    }
  };
})();
