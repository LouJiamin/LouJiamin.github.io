const get=id=>document.getElementById(id);
let job='selector',device='desktop';
function syncPreview(){
 const narrow=job==='layout'&&device==='phone';
 const catalogue=get('catalogue');
 document.querySelectorAll('[data-job]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.job===job));
 document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==job);
 document.querySelectorAll('[data-device]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.device===device));
 get('booking').hidden=job!=='form';catalogue.hidden=job==='form';
 get('shopViewport').classList.toggle('phone',narrow);
 catalogue.querySelector('.featured').classList.toggle('stacked',narrow&&get('layoutRule').value==='responsive');
 catalogue.querySelectorAll('.ink').forEach(el=>el.classList.remove('ink'));
 get('modeLabel').textContent=narrow?'Phone · 360px':job==='layout'?'Desktop · 960px':'Bookshop';
 if(job==='selector'){
   const rule=get('selectorRule').value;
   const hits=catalogue.querySelectorAll(rule);
   hits.forEach(el=>el.classList.add('ink'));
   get('shopReport').textContent=[ 'No matches. The shelf uses a class, so an ID selector misses it.', '', 'Two book titles change. The catalogue heading keeps its original ink.', 'All three headings change, including the catalogue heading.' ][hits.length];
 }
 if(job==='layout'){
   get('shopReport').textContent=narrow?(get('layoutRule').value==='responsive'?'Phone check passed. Both titles now have their own row.':'The phone still shows two cramped columns. Apply the narrow-screen rule.'):'Desktop check: both books share one shelf. Test the phone view next.';
 }
 if(job==='form'){
   if(get('fieldRule').value==='name')get('reader').name='reader';else get('reader').removeAttribute('name');
   get('payload').textContent='';get('shopReport').textContent='Submit the form to inspect its data.';
 }
}
document.querySelectorAll('[data-job]').forEach(b=>b.onclick=()=>{job=b.dataset.job;syncPreview()});
document.querySelectorAll('[data-device]').forEach(b=>b.onclick=()=>{device=b.dataset.device;syncPreview()});
for(const id of ['selectorRule','layoutRule','fieldRule'])get(id).onchange=syncPreview;
get('booking').onsubmit=e=>{
 e.preventDefault();
 const data=Object.fromEntries(new FormData(e.currentTarget));
 get('payload').textContent=JSON.stringify(data);
 get('shopReport').textContent='reader' in data?'The submitted data includes the reader field.':'The label focuses the input, but the unnamed value is missing from the submission.';
};
syncPreview();
