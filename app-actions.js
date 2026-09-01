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
$("#csvBtn").onclick=()=>{$("#csvText").value="";$("#csvDialog").showModal()};
$("#csvConfirm").onclick=()=>{
  const cells=parseCSV($("#csvText").value);
  state.cells=cells;saveState();render();$("#csvDialog").close();toast("CSV načteno");
};
$("#printBtn").onclick=async()=>{
  const win=window.open("","_blank");
  if(!win){
    alert("Prohlížeč zablokoval tiskové okno. Povol vyskakovací okna nebo použij tlačítko PDF.");
    return;
  }

  win.document.write(`
    <!doctype html><html><head><meta charset="utf-8"><title>Rozvrh – tisk</title>
    <style>
      @page{size:${state.printSize||"A3"} landscape;margin:5mm}
      html,body{margin:0;padding:0;width:100%;height:100%;background:white}
      body{display:flex;align-items:center;justify-content:center}
      img{display:block;max-width:100%;max-height:100vh;width:auto;height:auto;object-fit:contain}
      .msg{font-family:Arial,sans-serif;padding:20px}
      @media print{html,body{width:100%;height:100%}img{width:100%;height:100%;max-width:none;max-height:none;object-fit:contain}}
    </style></head><body><div class="msg">Připravuji celý rozvrh…</div></body></html>
  `);
  win.document.close();

  try{
    const canvas=await capturePoster(2);
    const img=canvas.toDataURL("image/jpeg",0.97);
    win.document.body.innerHTML=`<img src="${img}" alt="Rozvrh">`;
    const im=win.document.querySelector("img");
    await new Promise(resolve=>{ if(im.complete) resolve(); else im.onload=resolve; });
    setTimeout(()=>{ win.focus(); win.print(); },150);
  }catch(err){
    console.error(err); win.close();
    alert("Tisk se nepodařilo připravit. Použij prosím tlačítko PDF.");
  }
};

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
