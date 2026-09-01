$("#drawerClose").onclick=()=>$("#drawer").classList.remove("open");
$("#addItem").onclick=()=>{
  if(!selected)return;const k=cellKey(selected.day,selected.p);
  state.cells[k]=state.cells[k]||[];state.cells[k].push(itemDefaults(""));
  saveState();render();renderItemsEditor();
};

function isEditableTarget(el){
  if(!el) return false;
  const tag=el.tagName?.toLowerCase();
  return tag==="input" || tag==="textarea" || tag==="select" || el.isContentEditable;
}
document.addEventListener("keydown",e=>{
  if(!(e.ctrlKey || e.metaKey) || isEditableTarget(e.target)) return;
  const key=e.key.toLowerCase();

  if(key==="c"){
    if(!selected) return;
    const items=state.cells[cellKey(selected.day,selected.p)] || [];
    if(!items.length){ toast("Vybrané políčko je prázdné"); return; }
    e.preventDefault();
    setCopiedCell(items);
    toast("Políčko zkopírováno • Ctrl+V vloží");
  }

  if(key==="v"){
    if(!selected || !copiedCell || !copiedCell.length) return;
    e.preventDefault();
    const targetKey=cellKey(selected.day,selected.p);
    state.cells[targetKey]=structuredClone(copiedCell);
    saveState();
    render();
    renderItemsEditor();
    toast("Políčko vloženo");
  }
});

$("#copyCell").onclick=()=>{
  if(!selected) return;
  const items = state.cells[cellKey(selected.day,selected.p)] || [];
  if(!items.length){ toast("Políčko je prázdné"); return; }
  setCopiedCell(items);
  toast("Políčko zkopírováno");
};
$("#pasteCell").onclick=()=>{
  if(!selected || !copiedCell || !copiedCell.length) return;
  const key = cellKey(selected.day,selected.p);
  state.cells[key] = structuredClone(copiedCell);
  saveState(); render(); renderItemsEditor();
  toast("Políčko vloženo");
};

$("#clearCell").onclick=()=>{
  if(!selected)return;delete state.cells[cellKey(selected.day,selected.p)];
  saveState();render();renderItemsEditor();
};
$("#sampleBtn").onclick=()=>{if(confirm("Načíst ukázku a přepsat aktuální rozvrh?"))sample()};
$("#newBtn").onclick=()=>{if(confirm("Opravdu vytvořit nový prázdný rozvrh?")){state=freshState();saveState();syncHeaderInputs();renderDayEmojiEditors();renderPeriodEditors();render();}};
$("#exportBtn").onclick=()=>download(`rozvrh-${state.className||"trida"}.json`,JSON.stringify(state,null,2));
$("#importBtn").onclick=(e)=>{
  if(e.shiftKey){
    $("#importText").value="";
    $("#importDialog").showModal();
  } else {
    $("#jsonFileInput").value="";
    $("#jsonFileInput").click();
  }
};
$("#jsonFileInput").addEventListener("change", async e=>{
  const file=e.target.files?.[0];
  if(!file) return;
  try{
    const txt=await file.text();
    loadJsonObject(JSON.parse(txt));
  }catch(err){
    console.error(err);
    alert("JSON se nepodařilo načíst. Pokud je to starší formát, pošli mi ho a doplním přesný převod.");
  }
});
$("#importConfirm").onclick=()=>{
  try{
    loadJsonObject(JSON.parse($("#importText").value));
    $("#importDialog").close();
  }catch(e){
    console.error(e);
    alert("JSON se nepodařilo načíst. Pokud je to starší formát, pošli mi ho a doplním přesný převod.");
  }
};

// CSV a klasický tisk už nejsou součástí rozhraní. Původní elementy
// odstraňujeme až po načtení stránky, takže starší HTML/cache aplikaci nerozbije.
$("#csvBtn")?.remove();
$("#printBtn")?.remove();
$("#csvDialog")?.remove();

$("#jpgBtn").onclick=async()=>{
  try{
    toast("Připravuji JPG…");
    const canvas=await capturePoster(2);
    const a=document.createElement("a");
    a.download=`rozvrh-${state.className||"trida"}.jpg`;
    a.href=canvas.toDataURL("image/jpeg",0.94);
    document.body.appendChild(a); a.click(); a.remove();
    toast("JPG hotové");
  }catch(err){
    console.error(err);
    alert("JPG se nepodařilo vytvořit. Pro export je potřeba, aby se při otevření HTML načetla knihovna html2canvas z internetu.");
  }
};

$("#pdfBtn").onclick=async()=>{
  try{
    if(!window.jspdf?.jsPDF) throw new Error("jsPDF se nenačetl");
    toast("Připravuji celé PDF…");
    const canvas=await capturePoster(2);
    const img=canvas.toDataURL("image/jpeg",0.97);
    const w=canvas.posterWidth || 1600;
    const h=canvas.posterHeight || Math.round(w*canvas.height/canvas.width);
    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({orientation:w>=h ? "landscape" : "portrait",unit:"px",format:[w,h],hotfixes:["px_scaling"],compress:true});
    pdf.addImage(img,"JPEG",0,0,w,h,undefined,"FAST");
    pdf.save(`rozvrh-${state.className||"trida"}.pdf`);
    toast("PDF hotové – celý rozvrh");
  }catch(err){
    console.error(err);
    alert("PDF se nepodařilo vytvořit. Pro přímý export PDF je potřeba, aby se načetly knihovny html2canvas a jsPDF.");
  }
};

$("#settingsBtn").onclick=()=>$("#sidebar").classList.add("open");
$("#sidebarClose").onclick=()=>$("#sidebar").classList.remove("open");
document.addEventListener("keydown",e=>{ if(e.key==="Escape") $("#sidebar").classList.remove("open"); });
$("#fitBtn").onclick=()=>fitSchedule();
$("#zoomIn").onclick=()=>{autoFit=false;setZoom(zoom+.1)};
$("#zoomOut").onclick=()=>{autoFit=false;setZoom(zoom-.1)};
window.addEventListener("resize",()=>{ if(autoFit) fitSchedule(); });

bindHeader();
bindStyleEditor();
renderDayEmojiEditors();
renderPresets();
syncHeaderInputs();
renderPeriodEditors();
applyPrintSize();
render();
requestAnimationFrame(()=>fitSchedule());
window.addEventListener("load",()=>setTimeout(fitSchedule,80));
if(document.fonts?.ready) document.fonts.ready.then(()=>fitSchedule());
updatePasteButton();

// --- Automatické roztažení + volitelný zámek poměru políček -----------------
(function initResponsiveCellRatio(){
  const STORAGE_KEY="rozvrhar_lock_cell_ratio";
  let locked=localStorage.getItem(STORAGE_KEY)==="1";
  const baseFitSchedule=fitSchedule;

  function applyNaturalPosterWidth(){
    const wrap=$("#stageWrap");
    const poster=$("#poster");
    if(!wrap || !poster) return;
    const available=Math.max(320,wrap.clientWidth-12);

    // Zamčeno = jednotlivé buňky mají stále stejnou návrhovou šířku.
    // Celý plakát se pouze rovnoměrně zoomuje nahoru/dolů.
    // Odemčeno = na širokém monitoru se přirozená šířka plakátu zvětší,
    // a tím se rozšíří i jednotlivé buňky.
    poster.style.width=(locked ? 1600 : Math.max(1600,available))+"px";
  }

  fitSchedule=function(){
    applyNaturalPosterWidth();
    baseFitSchedule();
  };
  window.fitSchedule=fitSchedule;

  const bgField=$("#bgSelect")?.closest(".field");
  if(bgField){
    const field=document.createElement("div");
    field.className="field";
    field.innerHTML=`
      <label class="toggle-row" style="display:flex;gap:8px;align-items:center">
        <input id="lockRatioInput" type="checkbox" ${locked?"checked":""} style="width:auto">
        <span>🔒 Zamknout poměr / velikost políček</span>
      </label>
      <div class="small" style="margin-top:5px">
        Zapnuto: políčka nemění své rozměry a mění se jen měřítko celého rozvrhu. Vypnuto: rozvrh využije celou šířku okna a políčka se mohou roztáhnout.
      </div>`;
    bgField.insertAdjacentElement("afterend",field);

    $("#lockRatioInput").addEventListener("change",e=>{
      locked=e.target.checked;
      localStorage.setItem(STORAGE_KEY,locked?"1":"0");
      autoFit=true;
      fitSchedule();
      toast(locked?"Poměr políček zamknut":"Poměr políček odemknut");
    });
  }

  window.addEventListener("resize",()=>{
    applyNaturalPosterWidth();
    if(autoFit) fitSchedule();
    else setZoom(zoom);
  });

  // Přepočet po dokončení inicializace stránky.
  requestAnimationFrame(()=>fitSchedule());
})();
