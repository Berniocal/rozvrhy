function normalizeImportedState(raw){
  if(raw && Array.isArray(raw.periods) && raw.cells && typeof raw.cells === "object"){
    const out = freshState();
    out.school = raw.school ?? raw.schoolName ?? out.school;
    out.className = raw.className ?? raw.class ?? raw.trida ?? out.className;
    out.classTeacher = raw.classTeacher ?? raw.teacher ?? raw.tridniUcitel ?? out.classTeacher;
    out.room = raw.room ?? raw.classRoom ?? raw.ucebna ?? out.room;
    out.motto = raw.motto ?? out.motto;
    out.bg = raw.bg ?? out.bg;
    out.printSize = raw.printSize ?? out.printSize;
    out.subjectColors = (raw.subjectColors && typeof raw.subjectColors==="object") ? {...raw.subjectColors} : {};
    if(raw.dayEmojis && typeof raw.dayEmojis==="object") out.dayEmojis={...out.dayEmojis,...raw.dayEmojis};
    if(raw.teacherNames && typeof raw.teacherNames==="object") out.teacherNames={...raw.teacherNames};
    if(raw.densityStyles && typeof raw.densityStyles==="object"){
      for(const scope of ["double","triple"]){
        if(raw.densityStyles[scope] && typeof raw.densityStyles[scope]==="object"){
          out.densityStyles[scope]={
            ...out.densityStyles[scope],
            ...raw.densityStyles[scope],
            styles:{...(out.densityStyles[scope].styles||{}),...(raw.densityStyles[scope].styles||{})}
          };
        }
      }
    }
    if(raw.cardStyles && typeof raw.cardStyles==="object"){
      out.cardStyles = {...out.cardStyles};
      for(const k of ["subject","icon","group","room","teacher"]){
        if(raw.cardStyles[k] && typeof raw.cardStyles[k]==="object"){
          out.cardStyles[k] = {...out.cardStyles[k], ...raw.cardStyles[k]};
        }
      }
    }
    out.periods = raw.periods.map((p,i)=>({
      label: p.label ?? p.name ?? defaultPeriods[i]?.label ?? `${i}.`,
      time: p.time ?? p.cas ?? defaultPeriods[i]?.time ?? ""
    }));
    out.cells = {};
    for(const [k,v] of Object.entries(raw.cells)){
      const arr = Array.isArray(v) ? v : [v];
      out.cells[k] = arr.filter(Boolean).map(it => {
        const subj = it.subject ?? it.predmet ?? it.code ?? "";
        const m = subjectMeta(subj);
        return {
          subject: subj,
          room: it.room ?? it.ucebna ?? "",
          teacher: it.teacher ?? it.ucitel ?? "",
          group: it.group ?? it.skupina ?? "",
          icon: it.icon ?? m.icon,
          color: it.color ?? it.barva ?? m.color
        };
      });
      if(!out.cells[k].length) delete out.cells[k];
    }
    for(const arr of Object.values(out.cells)){
      for(const it of arr){
        const c=String(it.subject||"").trim().toUpperCase();
        if(c && it.color && !out.subjectColors[c]) out.subjectColors[c]=it.color;
      }
    }
    for(const arr of Object.values(out.cells)){
      for(const it of arr){
        const c=String(it.subject||"").trim().toUpperCase();
        if(c && out.subjectColors[c]) it.color=out.subjectColors[c];
      }
    }
    return out;
  }

  const lessons = raw?.lessons ?? raw?.hodiny ?? raw?.items;
  if(Array.isArray(lessons)){
    const out = freshState();
    out.school = raw.school ?? raw.schoolName ?? raw.skola ?? out.school;
    out.className = raw.className ?? raw.class ?? raw.trida ?? out.className;
    out.classTeacher = raw.classTeacher ?? raw.teacher ?? raw.tridniUcitel ?? out.classTeacher;
    out.room = raw.room ?? raw.ucebna ?? out.room;
    for(const it of lessons){
      const dayRaw = String(it.day ?? it.den ?? "").trim().toLowerCase();
      const aliases = {
        "po":"Po","pondělí":"Po","pondeli":"Po",
        "út":"Út","ut":"Út","úterý":"Út","utery":"Út",
        "st":"St","středa":"St","streda":"St",
        "čt":"Čt","ct":"Čt","čtvrtek":"Čt","ctvrtek":"Čt",
        "pá":"Pá","pa":"Pá","pátek":"Pá","patek":"Pá"
      };
      const day = aliases[dayRaw] || it.day || it.den;
      let p = it.period ?? it.hour ?? it.hodina ?? it.slot;
      if(typeof p === "string"){
        const idx = out.periods.findIndex(x => x.label.replace(".","") === p.replace(".",""));
        p = idx >= 0 ? idx : Number(p);
      }
      p = Number(p);
      if(p >= out.periods.length && p-1 >= 0 && p-1 < out.periods.length) p -= 1;
      if(!DAYS.some(d=>d.id===day) || !Number.isFinite(p) || p<0 || p>=out.periods.length) continue;

      const subj = it.subject ?? it.predmet ?? it.code ?? "";
      const m = subjectMeta(subj);
      const key = cellKey(day,p);
      out.cells[key] = out.cells[key] || [];
      out.cells[key].push({
        subject: subj,
        room: it.room ?? it.ucebna ?? "",
        teacher: it.teacher ?? it.ucitel ?? "",
        group: it.group ?? it.skupina ?? "",
        icon: it.icon ?? m.icon,
        color: it.color ?? it.barva ?? m.color
      });
    }
    return out;
  }

  const nested = raw?.timetable ?? raw?.rozvrh;
  if(nested && typeof nested === "object"){
    const out = freshState();
    for(const [dayKey, dayData] of Object.entries(nested)){
      const dayMap = {
        "Po":"Po","po":"Po","Pondělí":"Po","pondělí":"Po",
        "Út":"Út","ut":"Út","út":"Út","Úterý":"Út","úterý":"Út",
        "St":"St","st":"St","Středa":"St","středa":"St",
        "Čt":"Čt","ct":"Čt","čt":"Čt","Čtvrtek":"Čt","čtvrtek":"Čt",
        "Pá":"Pá","pa":"Pá","pá":"Pá","Pátek":"Pá","pátek":"Pá"
      };
      const day = dayMap[dayKey] || dayKey;
      if(!DAYS.some(d=>d.id===day) || !dayData || typeof dayData !== "object") continue;
      for(const [periodKey, val] of Object.entries(dayData)){
        let p = out.periods.findIndex(x=>x.label.replace(".","")===String(periodKey).replace(".",""));
        if(p < 0) p = Number(periodKey);
        if(!Number.isFinite(p) || p<0 || p>=out.periods.length) continue;
        const arr = Array.isArray(val) ? val : [val];
        for(const it of arr){
          if(!it) continue;
          const subj = typeof it === "string" ? it : (it.subject ?? it.predmet ?? it.code ?? "");
          const m = subjectMeta(subj);
          const key = cellKey(day,p);
          out.cells[key] = out.cells[key] || [];
          out.cells[key].push({
            subject: subj,
            room: typeof it === "string" ? "" : (it.room ?? it.ucebna ?? ""),
            teacher: typeof it === "string" ? "" : (it.teacher ?? it.ucitel ?? ""),
            group: typeof it === "string" ? "" : (it.group ?? it.skupina ?? ""),
            icon: typeof it === "string" ? m.icon : (it.icon ?? m.icon),
            color: typeof it === "string" ? m.color : (it.color ?? it.barva ?? m.color)
          });
        }
      }
    }
    return out;
  }

  throw new Error("Neznámý formát JSON");
}

function loadJsonObject(raw){
  const normalized = normalizeImportedState(raw);
  state = normalized;
  saveState();
  syncHeaderInputs();
  renderDayEmojiEditors();
  renderPeriodEditors();
  render();
  applyPrintSize();
  toast("JSON načten");
}

function sample(){
  state=freshState();
  const add=(d,p,sub,room,teacher,group="")=>{
    const k=cellKey(d,p);state.cells[k]=state.cells[k]||[];
    state.cells[k].push({...itemDefaults(sub),subject:sub,room,teacher,group});
  };
  add("Po",0,"TV","TV","NVK","TVch"); add("Po",0,"TV","TVM","TOP","TVd"); add("Po",1,"ČJL","","HEN");
  add("Po",2,"ZEM","205","HOD"); add("Po",3,"ANJ","102","FŠN","JAZ1"); add("Po",3,"ANJ","123","TOP","JAZ2");
  add("Po",4,"NJ","","ŠAN"); add("Po",4,"SPJ","316","KST","SPJ1"); add("Po",4,"SPJ","165","VYS","SPJ2");
  add("Po",6,"INF","224","ŠUM"); add("Po",6,"INF","236","TMŠ"); add("Po",8,"BIO","","ŽÁK");
  add("Út",1,"CHE","327","ŽÁK"); add("Út",1,"FYZ","322","BRN"); add("Út",2,"CHE","326","ŽÁK");
  add("Út",3,"ANJ","102","FŠN","JAZ1"); add("Út",4,"FYZ","","BRN"); add("Út",5,"BIO","","ŽÁK");
  add("Út",7,"HV","226","ZAC"); add("Út",7,"VV","106","MAL","VV1"); add("Út",7,"VV","103","NVR","VV2");
  add("St",1,"MAT","","ŠPE"); add("St",2,"DĚJ","","MAŠ"); add("St",3,"NJ","365","ŠAN");
  add("St",3,"SPJ","365","KST","SPJ1"); add("St",3,"SPJ","365","VYS","SPJ2"); add("St",4,"ANJ","305","FŠN","JAZ1");
  add("St",4,"ANJ","154","TOP","JAZ2"); add("St",6,"SV","","PTR"); add("St",7,"ČJL","","HEN"); add("St",8,"ZEM","","HOD");
  add("Čt",1,"ČJL","","HEN"); add("Čt",2,"ANJ","216","FŠN","JAZ1"); add("Čt",2,"ANJ","","WAR","JAZ2");
  add("Čt",3,"BIO","325","ŽÁK"); add("Čt",4,"MAT","","ŠPE"); add("Čt",5,"NJ","","ŠAN");
  add("Čt",5,"SPJ","335","KST","SPJ1"); add("Čt",5,"SPJ","165","VYS","SPJ2"); add("Čt",7,"CHE","326","ŽÁK");
  add("Pá",1,"ČJL","","HEN"); add("Pá",2,"DĚJ","304","MAŠ"); add("Pá",3,"FYZ","322","BRN");
  add("Pá",4,"ANJ","","WAR","JAZ1"); add("Pá",4,"ANJ","236","TOP","JAZ2"); add("Pá",5,"TV","TV","NVK","TVch");
  add("Pá",5,"TV","TVM","NOV","TVd"); add("Pá",8,"MAT","","ŠPE");
  saveState();syncHeaderInputs();renderDayEmojiEditors();renderPeriodEditors();render();toast("Ukázkový rozvrh načten");
}
function parseCSV(text){
  const lines=text.trim().split(/\r?\n/).filter(Boolean);
  const cells={};
  const dayAliases={"po":"Po","pondělí":"Po","ut":"Út","út":"Út","úterý":"Út","st":"St","středa":"St","ct":"Čt","čt":"Čt","čtvrtek":"Čt","pa":"Pá","pá":"Pá","pátek":"Pá"};
  for(let ri=0;ri<lines.length;ri++){
    let row=lines[ri].split(/[;\t,]/).map(x=>x.trim());
    if(ri===0 && /den/i.test(row[0]) && /hod/i.test(row[1])) continue;
    if(row.length<3) continue;
    const day=dayAliases[(row[0]||"").toLowerCase()]||row[0];
    const periodText=row[1];
    let p=state.periods.findIndex(x=>x.label.replace(".","")===periodText.replace(".",""));
    if(p<0 && /^\d+$/.test(periodText)) p=+periodText;
    if(!DAYS.find(d=>d.id===day) || p<0 || p>=state.periods.length) continue;
    const [_,__,subject,room="",teacher="",group=""]=row;
    const k=cellKey(day,p);cells[k]=cells[k]||[];
    cells[k].push({...itemDefaults(subject),subject,room,teacher,group});
  }
  return cells;
}
