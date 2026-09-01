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

  function installLockControl(){
    if(document.querySelector('#lockCellRatio')) return document.querySelector('#lockCellRatio');
    const bgSelect = document.querySelector('#bgSelect');
    const section = bgSelect?.closest('.side-section');
    if(!section) return null;

    const field = document.createElement('div');
    field.className = 'field';
    field.innerHTML = `
      <label class="toggle-row" style="display:flex;gap:8px;align-items:flex-start">
        <input id="lockCellRatio" type="checkbox" style="width:auto;margin-top:2px">
        <span><b>🔒 Zamknout poměr políček</b><br><span class="small" style="opacity:.9">Rozvrh se bude zvětšovat a zmenšovat jako jeden celek. Šířka jednotlivých chlívečků se nebude měnit.</span></span>
      </label>`;

    section.insertBefore(field, bgSelect.closest('.field'));
    return field.querySelector('#lockCellRatio');
  }

  function cleanupFileButtons(){
    // Funkce se volá až po načtení app-actions.js, aby odstranění tlačítek
    // nepřerušilo jeho inicializaci.
    document.querySelector('#csvBtn')?.remove();
    document.querySelector('#printBtn')?.remove();
    document.querySelector('#csvDialog')?.remove();
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
      // Zamčeno: rozměry sloupců a buněk zůstávají jako v návrhu 1600 px.
      // Celý rozvrh se pouze rovnoměrně škáluje na dostupnou šířku.
      poster.style.width = BASE_WIDTH + 'px';
      applyUniformScale(available / BASE_WIDTH);
      autoFit = true;
    }else{
      // Odemčeno: rozvrh fyzicky využije celou šířku a buňky se rozšíří.
      poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
      originalFitSchedule();
    }
  }

  window.fitSchedule = fitSchedule = applyResponsiveLayout;

  const lockBox = installLockControl();
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
      if(typeof setZoom === 'function') setZoom(zoom);
    }else{
      poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
      if(typeof setZoom === 'function') setZoom(zoom);
    }
  });

  // Odstranění nepotřebných tlačítek až poté, co se k nim app-actions.js stihne navázat.
  setTimeout(cleanupFileButtons, 0);
  requestAnimationFrame(()=>applyResponsiveLayout());
})();
