document.write('<script src="app-core-1.js"><\/script>');
document.write('<script src="app-core-2.js"><\/script>');
document.write('<script src="app-core-3.js"><\/script>');
document.write('<script src="app-core-4.js"><\/script>');
document.write('<script src="app-core-5.js"><\/script>');
document.write('<script src="responsive-width.js?v=20260901-13"><\/script>');

// Tyto dvě pomocné funkce v rozdělené GitHub verzi chyběly.
// Bez syncHeaderInputs() se inicializace zastavila ještě před render(),
// proto zůstala vidět jen prázdná statická kostra rozvrhu.
function itemDefaults(code=""){
  const m=subjectMeta(code);
  return {subject:code,room:"",teacher:"",group:"",icon:m.icon,color:subjectColor(code)};
}

function syncHeaderInputs(){
  $("#schoolInput").value=state.school||"";
  $("#classInput").value=state.className||"";
  $("#teacherInput").value=state.classTeacher||"";
  $("#roomInput").value=state.room||"";
  $("#mottoInput").value=state.motto||"";
  $("#bgSelect").value=state.bg||"paper";
  $("#printSelect").value=state.printSize||"A3";
}
