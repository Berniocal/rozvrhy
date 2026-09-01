const DAYS = [
  {id:"Po", name:"Po", emoji:"🌞"},
  {id:"Út", name:"Út", emoji:"🎒"},
  {id:"St", name:"St", emoji:"✏️"},
  {id:"Čt", name:"Čt", emoji:"💡"},
  {id:"Pá", name:"Pá", emoji:"🌈"}
];

const SUBJECTS = {
  "ČJL":{name:"Český jazyk",icon:"📚",color:"#e6d8ff"},
  "ANJ":{name:"Anglický jazyk",icon:"🇬🇧",color:"#ffd9df"},
  "NJ": {name:"Německý jazyk",icon:"🇩🇪",color:"#dff3d3"},
  "SPJ":{name:"Španělský jazyk",icon:"🇪🇸",color:"#d9eaff"},
  "MAT":{name:"Matematika",icon:"√x",color:"#fff0a8"},
  "DĚJ":{name:"Dějepis",icon:"🏛️",color:"#f7e3bf"},
  "ZEM":{name:"Zeměpis",icon:"🌍",color:"#eef0ad"},
  "FYZ":{name:"Fyzika",icon:"⚛️",color:"#ffd79f"},
  "CHE":{name:"Chemie",icon:"🧪",color:"#d9f2c8"},
  "BIO":{name:"Biologie",icon:"🍃",color:"#d9f2c8"},
  "INF":{name:"Informatika",icon:"💻",color:"#d8e1e5"},
  "HV": {name:"Hudební výchova",icon:"🎵",color:"#e2f6c3"},
  "VV": {name:"Výtvarná výchova",icon:"🎨",color:"#e8e0ff"},
  "SV": {name:"Společenské vědy",icon:"⚖️",color:"#e7d8ff"},
  "TV": {name:"Tělesná výchova",icon:"🏀",color:"#fff0b5"}
};

const defaultPeriods = [
  {label:"0.",time:"7:05–7:50"},
  {label:"1.",time:"8:00–8:45"},
  {label:"2.",time:"8:55–9:40"},
  {label:"3.",time:"10:00–10:45"},
  {label:"4.",time:"10:55–11:40"},
  {label:"5a.",time:"11:50–12:35"},
  {label:"5b.",time:"12:20–13:05"},
  {label:"6.",time:"13:15–14:00"},
  {label:"7.",time:"14:10–14:55"},
  {label:"8.",time:"15:05–15:50"}
];

const freshState = () => ({
  school:"Gymnázium Brno-Bystrc, příspěvková organizace",
  className:"2A4",
  classTeacher:"Jan Bernard",
  room:"202",
  motto:"Učíme se s radostí! ☺",
  bg:"paper",
  printSize:"A3",
  subjectColors:{},
  dayEmojis:{Po:"🌞","Út":"🎒",St:"✏️","Čt":"💡","Pá":"🌈"},
  teacherNames:{},
  densityStyles:{
    double:{auto:true,styles:{}},
    triple:{auto:true,styles:{}}
  },
  cardStyles:{
    subject:{size:26,font:"Segoe Print",x:0,y:0},
    icon:{size:36,font:"Segoe UI Emoji",x:0,y:0},
    group:{size:12,font:"Segoe UI",x:0,y:0},
    room:{size:14,font:"Segoe UI",x:0,y:0},
    teacher:{size:14,font:"Segoe UI",x:0,y:0}
  },
  periods: structuredClone(defaultPeriods),
  cells:{}
});

let state = loadState() || freshState();
if(!state.cardStyles) state.cardStyles=freshState().cardStyles;
if(!state.dayEmojis) state.dayEmojis=freshState().dayEmojis;
if(!state.teacherNames) state.teacherNames={};
if(!state.densityStyles) state.densityStyles=freshState().densityStyles;
let selected = null;
let zoom = .75;

const $ = s => document.querySelector(s);
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const cellKey=(d,p)=>d+"|"+p;

function loadState(){
  try{ return JSON.parse(localStorage.getItem("rozvrhar_v1")); }catch(e){ return null; }
}
function saveState(){
  localStorage.setItem("rozvrhar_v1",JSON.stringify(state));
}
function toast(msg){
  const n=$("#notice"); n.textContent=msg; n.style.display="block";
  clearTimeout(n._t); n._t=setTimeout(()=>n.style.display="none",1800);
}
function subjectMeta(code){
  const c=(code||"").trim().toUpperCase();
  return SUBJECTS[c] || {name:c||"Předmět",icon:"✦",color:"#e9f2ff"};
}

function normSubject(code){
  return String(code||"").trim().toUpperCase();
}
function subjectColor(code){
  const c=normSubject(code);
  return state?.subjectColors?.[c] || subjectMeta(c).color;
}
function flagClassForSubject(code){
  const c=normSubject(code);
  if(c==="ANJ") return "flag-gb";
  if(c==="NJ") return "flag-de";
  if(c==="SPJ") return "flag-es";
  return "";
}
function lessonIconHTML(it, meta){
  const flagClass=flagClassForSubject(it.subject);
  if(flagClass) return `<span class="lang-flag ${flagClass}" aria-label="${esc(meta.name)}"></span>`;
  return `<span>${esc(it.icon||meta.icon)}</span>`;
}
function applySubjectColor(subject, color){
  const code=normSubject(subject);
  if(!code) return;
  state.subjectColors = state.subjectColors || {};
  state.subjectColors[code]=color;
  Object.values(state.cells||{}).flat().forEach(it=>{
    if(normSubject(it.subject)===code) it.color=color;
  });
}

