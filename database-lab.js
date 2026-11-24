const byId = id => document.getElementById(id);
// Three-schema request trace, adapted from the Week 1 schema workbench.
let grade = 76, operation = 'read', depth = 0, compressed = false;
function renderSchema() {
  const invalid = operation === 'invalid';
  const reading = operation === 'read';
  const end = invalid ? 1 : 2;
  const stages = ['external','conceptual','internal'];
  stages.forEach((id,i)=>{
    byId(id).classList.toggle('activeLayer',i===depth);
    byId(id).classList.toggle('rejected',invalid && depth===1 && i===1);
  });
  byId('studentView').classList.toggle('viewSelected',reading);
  byId('instructorView').classList.toggle('viewSelected',!reading);
  byId('fieldMap').textContent=(reading?'My grade':'Roster grade')+' → Enrollment.Score';
  byId('viewMapping').classList.toggle('traced',depth>=1);
  byId('pageMapping').classList.toggle('traced',depth===2);
  byId('storageLayout').textContent=compressed?'P18 · compressed':'P18 · plain pages';
  byId('recordScore').textContent='Score = '+grade;
  const notes = reading
    ? ['The student requests their own score through the student view.','The view maps to Enrollment.Score for this student and course.','Read the enrollment record from a buffered page. The view returns '+grade+'.']
    : ['The instructor submits '+(invalid?'128':'88')+' through the roster view.',
       invalid?'Rejected by CHECK (Score BETWEEN 0 AND 100). No data page is written. Stored score: '+grade+'.':'88 satisfies the score constraint. Advance to write the record.',
       'The buffer page has been updated. The student now sees 88.'];
  byId('schemaNote').textContent=notes[depth];
  byId('advance').disabled=depth===end;
  byId('compress').setAttribute('aria-pressed',compressed);
  document.querySelectorAll('[data-request]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.request===operation));
}
document.querySelectorAll('[data-request]').forEach(b=>b.onclick=()=>{operation=b.dataset.request;depth=0;renderSchema();});
byId('advance').onclick=()=>{depth++;if(depth===2 && operation==='valid')grade=88;renderSchema();};
byId('compress').onclick=()=>{compressed=!compressed;renderSchema();byId('schemaNote').textContent='Physical layout changed. Enrollment.Score and the student view still return '+grade+'.';};
byId('schemaReset').onclick=()=>{grade=76;operation='read';depth=0;compressed=false;renderSchema();};
renderSchema();

