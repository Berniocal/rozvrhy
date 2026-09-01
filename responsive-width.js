// Responzivní šířka rozvrhu + možnost zamknout poměr políček.
(function(){
  const BASE_WIDTH = 1600;
  const LOCK_KEY = 'rozvrhar_lock_cell_ratio';
  const originalFitSchedule = window.fitSchedule || fitSchedule;

  function isLocked(){
    return localStorage.getItem(LOCK_KEY) === '1';
  }

  function setLocked(value){
    localStorage.setItem(LOCK_KEY, value ? '1' : '0');
  }

  function applyUniformScale(scale){
    const poster = document.querySelector('#poster');
    const stage = document.querySelector('#stageScale');
    const label = document.querySelector('#zoomLabel');
    if(!poster || !stage) return;

    const naturalHeight = poster.offsetHeight || 900;
    zoom = Math.max(.25, Math.min(2.2, scale));
    stage.style.transform = `scale(${zoom})`;
    stage.style.width = (BASE_WIDTH * zoom) + 'px';
    stage.style.height = (naturalHeight * zoom) + 'px';
    if(label) label.textContent = Math.round(zoom * 100) + ' %';
  }

  function applyResponsiveLayout(){
    const wrap = document.querySelector('#stageWrap');
    const poster = document.querySelector('#poster');
    if(!wrap || !poster) return;

    const available = Math.max(320, wrap.clientWidth - 12);

    if(isLocked()){
      // Zamčený poměr: chlívečky mají stále stejnou přirozenou velikost.
      // Do šířky se zvětšuje/zmenšuje CELÝ plakát jednotným měřítkem.
      poster.style.width = BASE_WIDTH + 'px';
      applyUniformScale(available / BASE_WIDTH);
      autoFit = true;
    }else{
      // Odemčeno: plakát se fyzicky roztáhne a sloupce mohou být širší.
      poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
      originalFitSchedule();
    }
  }

  window.fitSchedule = fitSchedule = applyResponsiveLayout;

  const lockBox = document.querySelector('#lockCellRatio');
  if(lockBox){
    lockBox.checked = isLocked();
    lockBox.addEventListener('change', ()=>{
      setLocked(lockBox.checked);
      applyResponsiveLayout();
    });
  }

  window.addEventListener('resize', ()=>{
    if(typeof autoFit === 'undefined' || autoFit){
      applyResponsiveLayout();
      return;
    }

    const wrap = document.querySelector('#stageWrap');
    const poster = document.querySelector('#poster');
    if(!wrap || !poster) return;
    const available = Math.max(320, wrap.clientWidth - 12);

    if(isLocked()){
      poster.style.width = BASE_WIDTH + 'px';
      // Při ručním zoomu se poměr stále nemění; pouze zachováme zvolený zoom.
      if(typeof setZoom === 'function') setZoom(zoom);
    }else{
      poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
      if(typeof setZoom === 'function') setZoom(zoom);
    }
  });

  // Po načtení aplikace použij aktuální nastavení i bez změny velikosti okna.
  requestAnimationFrame(()=>applyResponsiveLayout());
})();
