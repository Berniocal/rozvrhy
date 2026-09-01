const CARD_STYLE_DEFAULTS={
  subject:{size:26,font:"Segoe Print",x:0,y:0},
  icon:{size:36,font:"Segoe UI Emoji",x:0,y:0},
  group:{size:12,font:"Segoe UI",x:0,y:0},
  room:{size:14,font:"Segoe UI",x:0,y:0},
  teacher:{size:14,font:"Segoe UI",x:0,y:0}
};
const DENSITY_SCALE={
  double:{subject:.66,icon:.67,group:.75,room:.79,teacher:.79,position:.68},
  triple:{subject:.54,icon:.53,group:.67,room:.64,teacher:.64,position:.55}
};
let styleMoveMode=false;
let styleDrag=null;

function ensureCardStyles(){
  state.cardStyles = state.cardStyles || {};
  for(const key of Object.keys(CARD_STYLE_DEFAULTS)){
    state.cardStyles[key]={...CARD_STYLE_DEFAULTS[key],...(state.cardStyles[key]||{})};
  }
  state.densityStyles=state.densityStyles||{};
  for(const scope of ["double","triple"]){
    state.densityStyles[scope]=state.densityStyles[scope]||{auto:true,styles:{}};
    if(typeof state.densityStyles[scope].auto!=="boolean") state.densityStyles[scope].auto=true;
    state.densityStyles[scope].styles=state.densityStyles[scope].styles||{};
  }
}
function cssFontValue(font){
  const safe=String(font||"Segoe UI").replace(/["\\]/g,"");
  return `"${safe}"`;
}
function currentStyleScope(){
  return $("#styleScope")?.value || "single";
}
function currentStyleTarget(){
  return $("#styleTarget")?.value || "subject";
}
function autoDensityStyle(scope,key){
  ensureCardStyles();
  const base=state.cardStyles[key];
  const scale=DENSITY_SCALE[scope]||DENSITY_SCALE.double;
  return {
    size:Math.max(6,Math.round(base.size*(scale[key]||.7))),
    font:base.font,
    x:Math.round(base.x*scale.position),
    y:Math.round(base.y*scale.position)
  };
}
function resolvedStyle(scope,key){
  ensureCardStyles();
  if(scope==="single") return {...state.cardStyles[key]};
  const d=state.densityStyles[scope];
  const auto=autoDensityStyle(scope,key);
  if(d.auto) return auto;
  return {...auto,...(d.styles[key]||{})};
}
function ensureManualDensityStyle(scope,key){
  ensureCardStyles();
  if(scope==="single") return state.cardStyles[key];
  const d=state.densityStyles[scope];
  if(!d.styles[key]) d.styles[key]=autoDensityStyle(scope,key);
  else d.styles[key]={...autoDensityStyle(scope,key),...d.styles[key]};
  return d.styles[key];
}
function setCssStyleVars(poster,prefix,key,s){
  const cssKey={subject:"sub",icon:"icon",group:"group",room:"room",teacher:"teacher"}[key];
  poster.style.setProperty(`--${prefix}${cssKey}-size`,`${s.size}px`);
  poster.style.setProperty(`--${prefix}${cssKey}-font`,cssFontValue(s.font));
  poster.style.setProperty(`--${prefix}${cssKey}-x`,`${s.x}px`);
  poster.style.setProperty(`--${prefix}${cssKey}-y`,`${s.y}px`);
}
function applyCardStyles(){
  ensureCardStyles();
  const poster=$("#poster");
  if(!poster) return;
  for(const key of Object.keys(CARD_STYLE_DEFAULTS)){
    setCssStyleVars(poster,"card-",key,resolvedStyle("single",key));
    setCssStyleVars(poster,"double-",key,resolvedStyle("double",key));
    setCssStyleVars(poster,"triple-",key,resolvedStyle("triple",key));
  }
  poster.classList.toggle("style-move-mode",styleMoveMode);
}
function styleControlsDisabled(){
  const scope=currentStyleScope();
  return scope!=="single" && state.densityStyles?.[scope]?.auto;
}
function syncStyleControls(){
  ensureCardStyles();
  const scope=currentStyleScope();
  const key=currentStyleTarget();
  const s=resolvedStyle(scope,key);
  if(!s) return;

  $("#densityAutoField").style.display=scope==="single"?"none":"block";
  if(scope!=="single") $("#densityAuto").checked=!!state.densityStyles[scope].auto;

  $("#styleFont").value=s.font;
  if($("#styleFont").selectedIndex<0) $("#styleFont").value="Segoe UI";
  $("#styleSize").value=s.size;
  $("#styleSizeRange").value=Math.max(6,Math.min(56,s.size));
  $("#styleX").value=s.x;
  $("#styleXRange").value=Math.max(-50,Math.min(50,s.x));
  $("#styleY").value=s.y;
  $("#styleYRange").value=Math.max(-50,Math.min(50,s.y));

  const disabled=styleControlsDisabled();
  ["#styleFont","#styleSize","#styleSizeRange","#styleX","#styleXRange","#styleY","#styleYRange","#resetStyleBtn"]
    .forEach(sel=>{ const el=$(sel); if(el) el.disabled=disabled; });
}
function updateCurrentStyle(prop,value){
  ensureCardStyles();
  const scope=currentStyleScope();
  const key=currentStyleTarget();
  if(scope!=="single" && state.densityStyles[scope].auto) return;

  const s=scope==="single" ? state.cardStyles[key] : ensureManualDensityStyle(scope,key);
  if(prop==="font") s[prop]=value;
  else s[prop]=Number(value)||0;
  saveState();
  applyCardStyles();
}
function selectStyleTarget(key,scope=null){
  if(!CARD_STYLE_DEFAULTS[key]) return;
  if(scope && ["single","double","triple"].includes(scope)) $("#styleScope").value=scope;
  $("#styleTarget").value=key;
  syncStyleControls();
}
function resetCurrentStyle(){
  ensureCardStyles();
  const scope=currentStyleScope();
  const key=currentStyleTarget();
  if(scope==="single"){
    state.cardStyles[key]={...CARD_STYLE_DEFAULTS[key]};
  }else{
    delete state.densityStyles[scope].styles[key];
  }
  saveState();
  syncStyleControls();
  applyCardStyles();
}
function scopeForElement(el){
  const slot=el.closest(".slot");
  if(slot?.classList.contains("many")) return "triple";
  if(slot?.classList.contains("multi")) return "double";
  return "single";
}
function bindStyleEditor(){
  ensureCardStyles();

  $("#styleScope").addEventListener("change",syncStyleControls);
  $("#styleTarget").addEventListener("change",syncStyleControls);
  $("#densityAuto").addEventListener("change",e=>{
    const scope=currentStyleScope();
    if(scope==="single") return;
    state.densityStyles[scope].auto=e.target.checked;
    if(!e.target.checked){
      for(const key of Object.keys(CARD_STYLE_DEFAULTS)) ensureManualDensityStyle(scope,key);
    }
    saveState();
    syncStyleControls();
    applyCardStyles();
  });
  $("#styleFont").addEventListener("change",e=>updateCurrentStyle("font",e.target.value));

  const bindPair=(rangeSel,numSel,prop)=>{
    const r=$(rangeSel), n=$(numSel);
    r.addEventListener("input",e=>{
      n.value=e.target.value;
      updateCurrentStyle(prop,e.target.value);
    });
    n.addEventListener("input",e=>{
      r.value=Math.max(Number(r.min),Math.min(Number(r.max),Number(e.target.value)||0));
      updateCurrentStyle(prop,e.target.value);
    });
  };
  bindPair("#styleSizeRange","#styleSize","size");
  bindPair("#styleXRange","#styleX","x");
  bindPair("#styleYRange","#styleY","y");

  $("#moveMode").addEventListener("change",e=>{
    styleMoveMode=e.target.checked;
    applyCardStyles();
  });
  $("#resetStyleBtn").addEventListener("click",resetCurrentStyle);

  $("#poster").addEventListener("pointerdown",e=>{
    const el=e.target.closest("[data-style-target]");
    if(!el || !styleMoveMode) return;

    e.preventDefault();
    e.stopPropagation();

    const key=el.dataset.styleTarget;
    const scope=scopeForElement(el);
    if(scope!=="single" && state.densityStyles[scope].auto){
      state.densityStyles[scope].auto=false;
      for(const k of Object.keys(CARD_STYLE_DEFAULTS)) ensureManualDensityStyle(scope,k);
    }
    selectStyleTarget(key,scope);

    const s=scope==="single" ? state.cardStyles[key] : ensureManualDensityStyle(scope,key);
    styleDrag={
      pointerId:e.pointerId,
      key,
      scope,
      startX:e.clientX,
      startY:e.clientY,
      baseX:s.x,
      baseY:s.y,
      el
    };
    el.classList.add("dragging");
    try{el.setPointerCapture(e.pointerId)}catch(err){}
  },true);

  $("#poster").addEventListener("pointermove",e=>{
    if(!styleDrag || e.pointerId!==styleDrag.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const dx=(e.clientX-styleDrag.startX)/Math.max(zoom,.01);
    const dy=(e.clientY-styleDrag.startY)/Math.max(zoom,.01);
    const s=styleDrag.scope==="single"
      ? state.cardStyles[styleDrag.key]
      : ensureManualDensityStyle(styleDrag.scope,styleDrag.key);

    s.x=Math.round(styleDrag.baseX+dx);
    s.y=Math.round(styleDrag.baseY+dy);
    applyCardStyles();
    syncStyleControls();
  },true);

  const finishDrag=e=>{
    if(!styleDrag || (e.pointerId!=null && e.pointerId!==styleDrag.pointerId)) return;
    e.preventDefault();
    e.stopPropagation();
    styleDrag.el?.classList.remove("dragging");
    saveState();
    styleDrag=null;
  };
  $("#poster").addEventListener("pointerup",finishDrag,true);
  $("#poster").addEventListener("pointercancel",finishDrag,true);

  $("#poster").addEventListener("click",e=>{
    if(styleMoveMode && e.target.closest("[data-style-target]")){
      e.preventDefault();
      e.stopPropagation();
    }
  },true);

  syncStyleControls();
  applyCardStyles();
}

