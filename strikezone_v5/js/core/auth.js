(() => {
  async function hash(value){
    if (!crypto?.subtle) return btoa(unescape(encodeURIComponent(value)));
    const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  const next = new URLSearchParams(location.search).get('next');
  const safeNext = next && !/^https?:/i.test(next) ? next : 'cuenta.html';
  const reg=document.querySelector('[data-register-form]');
  reg?.addEventListener('submit',async e=>{
    e.preventDefault(); const fd=new FormData(reg);
    const name=String(fd.get('name')||'').trim(),email=String(fd.get('email')||'').trim().toLowerCase(),pass=String(fd.get('password')||''),confirm=String(fd.get('confirm')||''),msg=document.querySelector('[data-auth-message]');
    if(name.length<2||!email.includes('@')||pass.length<6){msg.textContent='Completa los datos. La contraseña debe tener al menos 6 caracteres.';return}
    if(pass!==confirm){msg.textContent='Las contraseñas no coinciden.';return}
    let users=[];try{users=JSON.parse(localStorage.getItem('strikezoneUsers')||'[]')}catch{}
    if(users.some(u=>u.email===email)){msg.textContent='Ya existe una cuenta con ese correo.';return}
    users.push({name,email,passwordHash:await hash(pass)}); localStorage.setItem('strikezoneUsers',JSON.stringify(users)); localStorage.setItem('strikezoneSession',JSON.stringify({name,email}));
    window.StrikeZoneFeedback?.show('Cuenta creada. Bienvenido a StrikeZone.'); setTimeout(()=>location.href=safeNext,450);
  });
  const login=document.querySelector('[data-login-form]');
  login?.addEventListener('submit',async e=>{
    e.preventDefault(); const fd=new FormData(login),email=String(fd.get('email')||'').trim().toLowerCase(),pass=String(fd.get('password')||''),msg=document.querySelector('[data-auth-message]');
    let users=[];try{users=JSON.parse(localStorage.getItem('strikezoneUsers')||'[]')}catch{}
    const h=await hash(pass),user=users.find(u=>u.email===email&&u.passwordHash===h);
    if(!user){msg.textContent='Correo o contraseña incorrectos.';return}
    localStorage.setItem('strikezoneSession',JSON.stringify({name:user.name,email:user.email})); window.StrikeZoneFeedback?.show('Sesión iniciada.'); setTimeout(()=>location.href=safeNext,350);
  });
})();
