(() => {
  let toast = document.querySelector('[data-toast]');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    toast.dataset.toast = '';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    document.body.appendChild(toast);
  }
  let timer = 0;
  window.StrikeZoneFeedback = {
    show(message, duration = 2400) {
      clearTimeout(timer);
      toast.textContent = message;
      toast.classList.add('is-visible');
      timer = setTimeout(() => toast.classList.remove('is-visible'), duration);
    },
    click() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.frequency.value = 520; gain.gain.value = .025;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + .045);
      } catch {}
    }
  };
})();
