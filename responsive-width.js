// Automatické roztažení rozvrhu do celé dostupné šířky.
// Na širokém monitoru se plakát skutečně zvětší, na užším se dál zmenší přes fitSchedule.
(function(){
  const originalFitSchedule = window.fitSchedule || fitSchedule;

  window.fitSchedule = fitSchedule = function(){
    const wrap = document.querySelector('#stageWrap');
    const poster = document.querySelector('#poster');
    if(!wrap || !poster) return;

    const available = Math.max(320, wrap.clientWidth - 12);
    // 1600 px zůstává minimální návrhová šířka. Pokud je ale okno širší,
    // plakát se roztáhne až na dostupnou šířku místo toho, aby zůstal malý vlevo.
    poster.style.width = Math.max(1600, available) + 'px';

    originalFitSchedule();
  };

  // Když uživatel používá vlastní zoom, chceme přesto při změně šířky okna
  // upravit přirozenou šířku plakátu. Zoom zůstane zachovaný.
  window.addEventListener('resize', ()=>{
    const wrap = document.querySelector('#stageWrap');
    const poster = document.querySelector('#poster');
    if(!wrap || !poster) return;

    const available = Math.max(320, wrap.clientWidth - 12);
    poster.style.width = Math.max(1600, available) + 'px';

    if(typeof autoFit !== 'undefined' && autoFit){
      fitSchedule();
    }else if(typeof setZoom === 'function'){
      setZoom(zoom);
    }
  });
})();
