function render(){
  $("#schoolText").textContent=state.school;
  $("#classText").textContent=state.className;
  $("#teacherText").textContent=state.classTeacher;
  $("#teacherCard").textContent=state.classTeacher;
  $("#roomText").textContent=state.room ? "Učebna: "+state.room : "";
  $("#mottoText").textContent=state.motto;

  const poster=$("#poster");
  if(state.bg==="clean") poster.style.background="#fffdf8";
  else if(state.bg==="gridpaper") poster.style.background="linear-gradient(#d9e7f7 1px,transparent 1px),linear-gradient(90deg,#d9e7f7 1px,transparent 1px),#fffdf8", poster.style.backgroundSize="22px 22px";
  else poster.style.background="radial-gradient(circle at 2% 4%, rgba(59,113,196,.08) 0 2px, transparent 2.5px) 0 0/22px 22px,linear-gradient(115deg,rgba(255,210,95,.05),transparent 22%),#fffdf8";

  const grid=$("#grid");
  let h = `<div class="corner"></div>`;
  state.periods.forEach(p=>h+=`<div class="period-head"><div class="pnum">${esc(p.label)}</div><div class="ptime">${esc(p.time)}</div></div>`);
  DAYS.forEach(d=>{
    h+=`<div class="day-head"><div class="dayname">${d.name}</div><div class="dayemoji">${esc(state.dayEmojis?.[d.id] ?? d.emoji)}</div></div>`;
    state.periods.forEach((p,pi)=>{
      const key=cellKey(d.id,pi);
      const items=state.cells[key]||[];
      const density = items.length >= 3 ? "many" : (items.length >= 2 ? "multi" : "");
      const isSelected = selected && selected.day===d.id && selected.p===pi;
      h+=`<div class="slot ${items.length?"":"empty"} ${density} ${isSelected?"selected":""}" data-day="${d.id}" data-p="${pi}">`;
      items.forEach(it=>{
        const meta=subjectMeta(it.subject);
        const color=it.color||subjectColor(it.subject);
        h+=`<div class="lesson" style="background:${esc(color)}">
          <div class="sub" data-style-target="subject">${esc(it.subject||"—")}</div>
          ${it.group ? `<div class="group-badge" data-style-target="group">${esc(it.group)}</div>` : ``}
          <div class="ico" data-style-target="icon">${lessonIconHTML(it, meta)}</div>
          <div class="room" data-style-target="room">${esc(it.room||"")}</div>
          <div class="teacher" data-style-target="teacher">${esc(it.teacher||"")}</div>
        </div>`;
      });
      h+=`</div>`;
    });
  });
  grid.innerHTML=h;
  grid.querySelectorAll(".slot").forEach(s=>s.addEventListener("click",()=>openCell(s.dataset.day,+s.dataset.p)));
  renderLegend();
  renderTeachers();
  applyCardStyles();
}
function renderLegend(){
  const used=[];
  Object.values(state.cells).flat().forEach(it=>{
    const code=(it.subject||"").trim().toUpperCase();
    if(code && !used.includes(code)) used.push(code);
  });
  $("#legendRows").innerHTML = used.length ? used.map(code=>{
    const m=subjectMeta(code);
    const custom = Object.values(state.cells).flat().find(x=>(x.subject||"").trim().toUpperCase()===code);
    const fc=flagClassForSubject(code);
    const li=fc ? `<span class="lang-flag ${fc}" style="width:24px;height:16px"></span>` : `<span class="li">${esc(custom?.icon||m.icon)}</span>`;
    return `<div class="legend-row"><span class="li">${li}</span><b>${esc(code)}</b><span>${esc(m.name)}</span></div>`;
  }).join("") : `<div style="font-size:12px;color:#72839a;text-align:center;padding:10px">Legenda se doplní automaticky.</div>`;
}
function getTeacherAbbreviations(){
  const set=new Set();
  Object.values(state.cells||{}).flat().forEach(it=>{
    const t=String(it.teacher||"").trim();
    if(t) set.add(t);
  });
  return [...set].sort((a,b)=>a.localeCompare(b,"cs"));
}
function renderTeachers(){
  const teachers=getTeacherAbbreviations();
  $("#teacherStrip").innerHTML =
    `<div class="teacher-legend-title">LEGENDA UČITELŮ</div>` +
    (teachers.length
      ? teachers.map(t=>`<div class="teacher">
          <div class="abbr">${esc(t)}</div>
          <div class="name">${esc(state.teacherNames?.[t]||"")}</div>
        </div>`).join("")
      : `<div class="teacher" style="flex:1 1 100%"><div class="name">Doplní se automaticky podle rozvrhu.</div></div>`);
  renderTeacherNameEditors();
}
function renderPresets(){
  $("#presetGrid").innerHTML = Object.keys(SUBJECTS).map(c=>`<button class="preset" data-c="${c}">${SUBJECTS[c].icon}<br>${c}</button>`).join("");
  $("#presetGrid").querySelectorAll(".preset").forEach(b=>b.addEventListener("click",()=>{
    if(!selected) return;
    const key=cellKey(selected.day,selected.p);
    state.cells[key]=state.cells[key]||[];
    state.cells[key].push(itemDefaults(b.dataset.c));
    saveState(); render(); renderItemsEditor();
  }));
}
function updateSelectedVisual(){
  document.querySelectorAll(".slot.selected").forEach(el=>el.classList.remove("selected"));
  if(!selected) return;
  const el=document.querySelector(`.slot[data-day="${CSS.escape(selected.day)}"][data-p="${selected.p}"]`);
  if(el) el.classList.add("selected");
}
function openCell(day,p){
  selected={day,p};
  updateSelectedVisual();
  const pd=state.periods[p];
  $("#drawerTitle").textContent=`${day} • ${pd.label} (${pd.time})`;
  $("#drawer").classList.add("open");
  renderItemsEditor();
}
function renderItemsEditor(){
  if(!selected)return;
  const key=cellKey(selected.day,selected.p);
  const items=state.cells[key]||[];
  $("#itemsEditor").innerHTML = items.length ? items.map((it,i)=>`
    <div class="item-card" data-i="${i}">
      <div class="item-top"><b>Skupina ${i+1}</b><button class="remove" data-remove="${i}">Smazat</button></div>
      <div class="two">
        <div class="field"><label>Předmět</label><input data-k="subject" value="${esc(it.subject)}" placeholder="např. FYZ"></div>
        <div class="field"><label>Ikona / emoji</label><input data-k="icon" value="${esc(it.icon||"")}"></div>
      </div>
      <div class="two">
        <div class="field"><label>Učebna</label><input data-k="room" value="${esc(it.room)}" placeholder="např. 322"></div>
        <div class="field"><label>Vyučující</label><input data-k="teacher" value="${esc(it.teacher)}" placeholder="např. BRN"></div>
      </div>
      <div class="two">
        <div class="field"><label>Skupina</label><input data-k="group" value="${esc(it.group)}" placeholder="např. JAZ1"></div>
        <div class="field"><label>Barva</label><input type="color" data-k="color" value="${esc(it.color||subjectColor(it.subject))}"></div>
      </div>
    </div>`).join("") : `<div class="small" style="color:#72839a;opacity:1;margin:12px 0">Políčko je zatím prázdné. Vyber předmět nahoře nebo přidej skupinu.</div>`;

  $("#itemsEditor").querySelectorAll(".item-card input").forEach(inp=>inp.addEventListener("input",e=>{
    const card=e.target.closest(".item-card");
    const idx=+card.dataset.i;
    const k=e.target.dataset.k;
    state.cells[key][idx][k]=e.target.value;
    if(k==="subject"){
      const m=subjectMeta(e.target.value);
      if(!state.cells[key][idx].icon) state.cells[key][idx].icon=m.icon;
      state.cells[key][idx].color=subjectColor(e.target.value);
    }
    if(k==="color") applySubjectColor(state.cells[key][idx].subject, e.target.value);
    saveState(); render();
  }));
  $("#itemsEditor").querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{
    state.cells[key].splice(+b.dataset.remove,1);
    if(!state.cells[key].length) delete state.cells[key];
    saveState();render();renderItemsEditor();
  }));
}
function bindHeader(){
  const binds=[
    ["#schoolInput","school"],["#classInput","className"],["#teacherInput","classTeacher"],
    ["#roomInput","room"],["#mottoInput","motto"]
  ];
  binds.forEach(([sel,k])=>$(sel).addEventListener("input",e=>{state[k]=e.target.value;saveState();render()}));
  $("#bgSelect").addEventListener("change",e=>{state.bg=e.target.value;saveState();render()});
  $("#printSelect").addEventListener("change",e=>{state.printSize=e.target.value;saveState();applyPrintSize()});
}
function applyPrintSize(){
  const old=$("#dynamicPrintStyle");
  if(old) old.remove();
  const st=document.createElement("style");st.id="dynamicPrintStyle";
  st.textContent=`@media print{@page{size:${state.printSize||"A3"} landscape;margin:8mm}}`;
  document.head.appendChild(st);
}
function setZoom(v){
  zoom=Math.max(.35,Math.min(1.15,v));
  const poster=$("#poster");
  const naturalWidth=poster?.offsetWidth || 1600;
  const naturalHeight=poster?.offsetHeight || 900;
  $("#stageScale").style.transform=`scale(${zoom})`;
  $("#stageScale").style.width=(naturalWidth*zoom)+"px";
  $("#stageScale").style.height=(naturalHeight*zoom)+"px";
  $("#zoomLabel").textContent=Math.round(zoom*100)+" %";
}

let autoFit = true;
function fitSchedule(){
  const wrap=$("#stageWrap");
  const poster=$("#poster");
  if(!wrap || !poster) return;
  const available=Math.max(320, wrap.clientWidth-12);
  const naturalWidth=poster.offsetWidth || 1600;
  const fit=Math.min(1, available/naturalWidth);
  setZoom(fit);
  const naturalHeight=poster.offsetHeight || 900;
  $("#stageScale").style.height=(naturalHeight*fit)+"px";
  autoFit=true;
}

