// Responzivní šířka rozvrhu + jeden zámek rozložení.
// Zámek NEVYPÍNÁ roztahování rozvrhu do šířky. Pouze zabrání tomu,
// aby obsah (větší text nebo více objektů) měnil rozměry chlívečků.
(function(){
  const BASE_WIDTH = 1600;
  const LOCK_KEY = 'rozvrhar_lock_cell_ratio'; // zachováme původní klíč kvůli nastavení uživatelů
  const originalFitSchedule = window.fitSchedule || fitSchedule;

  function isLocked(){
    return localStorage.getItem(LOCK_KEY) === '1';
  }

  function setLocked(value){
    localStorage.setItem(LOCK_KEY, value ? '1' : '0');
  }

  function getLockBox(){
    return document.querySelector('#lockCellRatio');
  }

  // CSS zámku: přesně drží výchozí geometrii mřížky.
  // Šířka celého plakátu se může dál responzivně měnit, ale obsah už
  // nesmí roztáhnout konkrétní sloupec nebo řádek.
  function installLockedLayoutCSS(){
    if(document.querySelector('#lockedLayoutCSS')) return;
    const style = document.createElement('style');
    style.id = 'lockedLayoutCSS';
    style.textContent = `
      #poster.layout-locked .grid{
        grid-template-columns:74px repeat(10,minmax(0,1fr)) !important;
        grid-template-rows:54px repeat(5,124px) !important;
      }
      #poster.layout-locked .corner,
      #poster.layout-locked .period-head{
        height:54px !important;
        min-height:54px !important;
        max-height:54px !important;
        overflow:hidden !important;
        min-width:0 !important;
      }
      #poster.layout-locked .day-head,
      #poster.layout-locked .slot{
        height:124px !important;
        min-height:124px !important;
        max-height:124px !important;
        overflow:hidden !important;
        min-width:0 !important;
      }
      #poster.layout-locked .slot{
        display:flex !important;
        flex-direction:column !important;
      }
      #poster.layout-locked .slot .lesson{
        flex:1 1 0 !important;
        min-height:0 !important;
        min-width:0 !important;
        overflow:hidden !important;
      }
      #poster.layout-locked .slot .lesson > *{
        min-width:0 !important;
        max-width:100%;
      }
    `;
    document.head.appendChild(style);
  }

  function applyLockClass(){
    const poster = document.querySelector('#poster');
    if(!poster) return;
    poster.classList.toggle('layout-locked', isLocked());
  }

  function cleanupFileButtons(){
    // Starší app-actions.js tyto prvky při startu ještě očekává.
    // V UI už nejsou vidět a po inicializaci je můžeme odstranit.
    document.querySelector('#csvBtn')?.remove();
    document.querySelector('#printBtn')?.remove();
    document.querySelector('#csvDialog')?.remove();
  }

  function applyResponsiveLayout(){
    const wrap = document.querySelector('#stageWrap');
    const poster = document.querySelector('#poster');
    if(!wrap || !poster) return;

    const available = Math.max(320, wrap.clientWidth - 12);

    // Rozvrh se VŽDY roztahuje do dostupné šířky jako dosud.
    // Zámek řeší pouze to, zda obsah smí měnit geometrii jednotlivých buněk.
    poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
    applyLockClass();
    originalFitSchedule();
  }

  installLockedLayoutCSS();
  window.fitSchedule = fitSchedule = applyResponsiveLayout;

  const lockBox = getLockBox();
  if(lockBox){
    lockBox.checked = isLocked();
    lockBox.addEventListener('change', ()=>{
      setLocked(lockBox.checked);
      applyLockClass();
      applyResponsiveLayout();
      if(typeof toast === 'function'){
        toast(lockBox.checked ? 'Rozložení chlívečků zamčeno' : 'Rozložení chlívečků odemčeno');
      }
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
    poster.style.width = Math.max(BASE_WIDTH, available) + 'px';
    applyLockClass();
    if(typeof setZoom === 'function') setZoom(zoom);
  });

  // Delete smaže celé právě označené políčko. V textových polích se Delete
  // chová normálně a rozvrh se nemaže.
  document.addEventListener('keydown', (e)=>{
    if(e.key !== 'Delete') return;
    const target = e.target;
    const tag = target?.tagName?.toLowerCase();
    if(tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
    if(typeof selected === 'undefined' || !selected) return;
    if(typeof state === 'undefined' || !state?.cells) return;

    const key = typeof cellKey === 'function' ? cellKey(selected.day, selected.p) : `${selected.day}|${selected.p}`;
    if(!state.cells[key]) return;

    e.preventDefault();
    delete state.cells[key];
    if(typeof saveState === 'function') saveState();
    if(typeof render === 'function') render();
    if(typeof renderItemsEditor === 'function') renderItemsEditor();
    if(typeof toast === 'function') toast('Políčko smazáno');
  });

  setTimeout(cleanupFileButtons, 0);
  requestAnimationFrame(()=>applyResponsiveLayout());
})();
