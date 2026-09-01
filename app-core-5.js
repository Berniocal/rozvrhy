async function capturePoster(scale=2){
  if(!window.html2canvas){
    throw new Error("html2canvas se nenačetl");
  }

  const poster=$("#poster");
  const holder=document.createElement("div");
  holder.style.cssText=[
    "position:fixed",
    "left:-100000px",
    "top:0",
    "width:1600px",
    "height:auto",
    "overflow:visible",
    "background:#fffdf8",
    "z-index:-9999"
  ].join(";");

  const clone=poster.cloneNode(true);
  clone.removeAttribute("id");
  clone.style.transform="none";
  clone.style.width="1600px";
  clone.style.height="auto";
  clone.style.minHeight="0";
  clone.style.maxHeight="none";
  clone.style.overflow="visible";
  clone.style.margin="0";

  holder.appendChild(clone);
  document.body.appendChild(holder);

  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  if(document.fonts?.ready){
    try{ await document.fonts.ready; }catch(e){}
  }

  const rect=clone.getBoundingClientRect();
  const width=Math.ceil(Math.max(rect.width, clone.scrollWidth, 1600));
  const height=Math.ceil(Math.max(rect.height, clone.scrollHeight));

  const canvas=await html2canvas(clone,{
    scale,
    backgroundColor:"#fffdf8",
    useCORS:true,
    logging:false,
    width,
    height,
    windowWidth:width,
    windowHeight:height,
    scrollX:0,
    scrollY:0
  });

  holder.remove();
  canvas.posterWidth=width;
  canvas.posterHeight=height;
  return canvas;
}

function download(name,text,type="application/json"){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type}));
  a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}

let copiedCell = (() => {
  try { return JSON.parse(localStorage.getItem("rozvrhar_cell_clipboard") || "null"); }
  catch(e){ return null; }
})();

function setCopiedCell(items){
  copiedCell = structuredClone(items || []);
  localStorage.setItem("rozvrhar_cell_clipboard", JSON.stringify(copiedCell));
  updatePasteButton();
}
function updatePasteButton(){
  const b = $("#pasteCell");
  if(!b) return;
  b.disabled = !copiedCell || !copiedCell.length;
  b.style.opacity = b.disabled ? ".45" : "1";
}

