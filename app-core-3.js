function renderDayEmojiEditors(){
  const wrap=$("#dayEmojiEditors");
  if(!wrap) return;
  wrap.innerHTML=DAYS.map(d=>`
    <div class="day-emoji-editor">
      <b>${esc(d.id)}</b>
      <input data-day-emoji="${esc(d.id)}" value="${esc(state.dayEmojis?.[d.id] ?? d.emoji)}" maxlength="8">
    </div>
  `).join("");
  wrap.querySelectorAll("[data-day-emoji]").forEach(inp=>{
    inp.addEventListener("input",e=>{
      state.dayEmojis=state.dayEmojis||{};
      state.dayEmojis[e.target.dataset.dayEmoji]=e.target.value;
      saveState();
      render();
    });
  });
}
function renderTeacherNameEditors(){
  const wrap=$("#teacherNameEditors");
  if(!wrap) return;
  const teachers=getTeacherAbbreviations();
  wrap.innerHTML=teachers.length ? teachers.map(t=>`
    <div class="teacher-name-row">
      <b>${esc(t)}</b>
      <input data-teacher-name="${esc(t)}" value="${esc(state.teacherNames?.[t]||"")}" placeholder="Celé jméno">
    </div>
  `).join("") : `<div class="small">Zatím nejsou v rozvrhu žádní učitelé.</div>`;
  wrap.querySelectorAll("[data-teacher-name]").forEach(inp=>{
    inp.addEventListener("input",e=>{
      state.teacherNames=state.teacherNames||{};
      state.teacherNames[e.target.dataset.teacherName]=e.target.value;
      saveState();
      const teachers=getTeacherAbbreviations();
      $("#teacherStrip").innerHTML =
        `<div class="teacher-legend-title">LEGENDA UČITELŮ</div>` +
        teachers.map(t=>`<div class="teacher">
          <div class="abbr">${esc(t)}</div>
          <div class="name">${esc(state.teacherNames?.[t]||"")}</div>
        </div>`).join("");
    });
  });
}

function renderPeriodEditors(){
  $("#periodEditors").innerHTML = state.periods.map((p,i)=>`
    <div class="period-editor">
      <input data-i="${i}" data-k="label" value="${esc(p.label)}" aria-label="Číslo hodiny">
      <input data-i="${i}" data-k="time" value="${esc(p.time)}" aria-label="Čas hodiny">
    </div>`).join("");
  $("#periodEditors").querySelectorAll("input").forEach(inp=>inp.addEventListener("input",e=>{
    const i=+e.target.dataset.i, k=e.target.dataset.k;
    state.periods[i][k]=e.target.value; saveState(); render();
  }));
}
