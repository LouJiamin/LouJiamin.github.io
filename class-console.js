(() => {
  const $ = id => document.getElementById(id);
  const app = $('class-console');
  const lessons = {
    apr:{date:'3 April 2023',focus:'Linear inequalities in two variables',times:['15:05','15:10','15:15','15:20','15:25','15:30','15:35'],values:[[31,40,90,51,42,82,56],[11,32,80,32,60,52,41],[15,11,32,18,9,24,11]],metrics:[['Mean task time','6.97','min'],['Submission rate','95.8','%'],['Correct answers','75.9','%']]},
    mar:{date:'30 March 2023',focus:'Within-lesson activity',times:['14:05','14:15','14:25','14:35','14:45','14:55','15:05'],values:[[0,0,100,0,72,0,0],[0,0,85,0,62,0,0],[0,0,72,0,54,0,0]],metrics:[['Interaction','100','%'],['Submission','85','%'],['Accuracy','72','%']]}
  };
  const series=[['Interaction','#963b50'],['Submission','#187a78'],['Accuracy','#ab711f']];
  const samples=[['20 Sep',47],['22 Sep',45],['26 Sep',null],['27 Sep',null],['8 Oct',42],['17 Oct',46],['24 Oct',44],['10 Nov',43],['3 Apr',46]];
  const cases=[
    {id:'01',label:'Stable',range:'Up to 5 places'},
    {id:'02',label:'Moderately variable',range:'6–10 places'},
    {id:'03',label:'Highly variable',range:'More than 10 places'}
  ];
  const storeKey='jiamin-classroom-reviewed-2023-v1';
  let reviewed=new Set();
  try{const saved=JSON.parse(localStorage.getItem(storeKey));if(Array.isArray(saved))reviewed=new Set(saved.filter(id=>cases.some(c=>c.id===id)));}catch{}
  let selectedCase=cases[0], screen='overview', historyCase=null;
  const activeSeries=new Set([0,1,2]);
  const lesson=()=>lessons[$('lessonChoice').value];
  function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;}
  function go(name){
    screen=name;
    for(const b of app.querySelectorAll('[data-screen]'))b.setAttribute('aria-pressed',String(b.dataset.screen===screen));
    for(const s of app.querySelectorAll('.consoleBody>section'))s.hidden=s.id!=='view-'+screen;
    if(screen==='overview')renderOverview();
    if(screen==='history')renderHistory();
    if(screen==='roster')renderRegister();
    if(screen==='profile')renderQueue();
  }
  function inspectCase(c){
    selectedCase=c;$('caseSearch').value='';$('reviewFilter').selectedIndex=0;go('roster');
  }
  function drawPlot(el,labels,lines,index,range,unit,choose){
    const width=Math.floor(el.getBoundingClientRect().width);
    if(width<100)return;
    const h=218,l=36,r=19,t=17,b=32;
    const svg=d3.select(el).selectAll('svg').data([1]).join('svg').attr('viewBox','0 0 '+width+' '+h).attr('role','img').attr('aria-label',el.id==='rankChart'?'Individual fluency rank by class day':'Interaction, submission and accuracy over class time');
    svg.selectAll('*').remove();
    const x=d3.scaleLinear().domain([0,labels.length-1]).range([l,width-r]);
    const y=d3.scaleLinear().domain(range).range([h-b,t]);
    const ticks=unit==='%'?[0,25,50,75,100]:[40,42,44,46,48];
    for(const n of ticks){
      svg.append('line').attr('x1',l).attr('x2',width-r).attr('y1',y(n)).attr('y2',y(n)).attr('stroke','#e4e9e7');
      svg.append('text').attr('x',l-6).attr('y',y(n)+4).attr('text-anchor','end').text(n+unit);
    }
    labels.forEach((v,i)=>{if(width>470||i%2===0)svg.append('text').attr('x',x(i)).attr('y',h-8).attr('text-anchor','middle').text(v);});
    for(const [k,s] of lines.entries()){
      const curve=d3.line().defined(v=>v!==null).x((v,i)=>x(i)).y(y).curve(d3.curveMonotoneX);
      if(k===0)svg.append('path').attr('d',d3.area().defined(v=>v!==null).x((v,i)=>x(i)).y0(h-b).y1(y).curve(d3.curveMonotoneX)(s.values)).attr('fill',s.color).attr('opacity',.065);
      svg.append('path').attr('d',curve(s.values)).attr('fill','none').attr('stroke',s.color).attr('stroke-width',2.5);
      s.values.forEach((v,i)=>{if(v!==null)svg.append('circle').attr('cx',x(i)).attr('cy',y(v)).attr('r',i===index?5:2.6).attr('fill',s.color).attr('stroke','white').attr('stroke-width',1.4);});
    }
    svg.append('line').attr('x1',x(index)).attr('x2',x(index)).attr('y1',t).attr('y2',h-b).attr('stroke','#677b7c').attr('stroke-dasharray','3 4').style('pointer-events','none');
    function point(event){const i=Math.max(0,Math.min(labels.length-1,Math.round(x.invert(d3.pointer(event,svg.node())[0]))));if(i!==index)choose(i);}
    svg.on('pointermove',e=>{if(e.pointerType==='mouse')point(e);}).on('click',point);
  }
  function renderTime(){
    const s=lesson(),i=Number($('timeStep').value);
    const lines=series.flatMap(([name,color],k)=>activeSeries.has(k)?[{name,color,values:s.values[k]}]:[]);
    drawPlot($('activityChart'),s.times,lines,i,[0,100],'%',j=>{$('timeStep').value=j;renderTime();});
    $('timeRead').innerHTML='<b>'+s.times[i]+'</b>'+lines.map(line=>'<span>'+line.name+' <strong>'+line.values[i]+'%</strong></span>').join('');
  }
  function renderOverview(){
    const s=lesson();
    $('lessonFocus').textContent=s.focus;
    $('lessonMetrics').innerHTML=s.metrics.map(([label,value,unit])=>'<div><small>'+label+'</small><strong>'+value+'<em>'+unit+'</em></strong><span>'+($('lessonChoice').value==='apr'?'Lesson summary · 03 Apr':'Observation · 14:25')+'</span></div>').join('');
    $('recordNote').textContent='Class-level rates from the original dashboard series. Each dot marks a recorded observation.';
    $('archiveAlerts').replaceChildren(...cases.map(c=>{const b=button('',()=>inspectCase(c));b.innerHTML='<span><strong>Band C · '+c.label+'</strong><small>'+c.range+'</small></span><b>'+c.id+' ↗</b>';b.setAttribute('aria-label','Inspect case '+c.id+', '+c.label);return b;}));
    $('lessonConcepts').hidden = $('lessonChoice').value !== 'apr';
    renderTime();
  }
  function renderHistory(){
    $('historyContext').textContent=historyCase?'Case '+historyCase.id+' has a band C forecast and a '+historyCase.label.toLowerCase()+' trend. The archived series below is a separate teaching example; the case-level raw series was not provided.':'Inspect the archived student trajectory across class days.';
    const i=Number($('rankStep').value);
    drawPlot($('rankChart'),samples.map(d=>d[0]),[{color:'#187a78',values:samples.map(d=>d[1])}],i,[40,48],'',j=>{$('rankStep').value=j;renderHistory();});
    $('rankRead').textContent=samples[i][0]+' · '+(samples[i][1]===null?'Rank obscured in source':(i===5?'Recorded rank ':'Approximate rank ')+samples[i][1]);
  }
  function toggleReview(){
    if(reviewed.has(selectedCase.id))reviewed.delete(selectedCase.id);else reviewed.add(selectedCase.id);
    let saved=true;try{localStorage.setItem(storeKey,JSON.stringify([...reviewed]));}catch{saved=false;}
    renderRegister();
    if(!saved)$('caseDetail').append(' Review retained for this session.');
  }
  function renderRegister(){
    const q=$('caseSearch').value.trim().toLowerCase(),f=$('reviewFilter').selectedIndex;
    const matches=cases.filter(c=>('case '+c.id+' '+c.label).toLowerCase().includes(q)&&(!f||(f===2)===reviewed.has(c.id)));
    if(!matches.includes(selectedCase))selectedCase=matches[0]||selectedCase;
    $('caseList').replaceChildren(...matches.map(c=>{
      const b=button('',()=>{selectedCase=c;renderRegister();});b.setAttribute('aria-pressed',String(c===selectedCase));
      b.innerHTML='<b>Case '+c.id+'</b><span>Forecast C</span><span>'+c.label+'</span><small>'+(reviewed.has(c.id)?'Reviewed':'Awaiting review')+'</small>';return b;
    }));
    if(!matches.length){$('caseList').textContent='No matching cases.';$('caseDetail').replaceChildren();return;}
    $('caseDetail').innerHTML='<small>Selected alert · Case '+selectedCase.id+'</small><h5>Predicted band C</h5><p>'+selectedCase.label+' means a rank shift of '+selectedCase.range.toLowerCase()+'.</p>';
    $('caseDetail').append(button('Inspect progress history ↗',()=>{historyCase=selectedCase;go('history');}),button(reviewed.has(selectedCase.id)?'Reopen review':'Mark reviewed',toggleReview));
  }
  function renderQueue(){
    $('queueSummary').innerHTML='<p><strong>'+reviewed.size+' of 3</strong> alerts reviewed on this device.</p>';
    for(const c of cases)$('queueSummary').append(button('Case '+c.id+' · '+(reviewed.has(c.id)?'Reviewed':'Awaiting review')+' ↗',()=>inspectCase(c)));
  }
  $('exportReview').onclick=()=>{
    const rows=['case,forecast_band,rank_variability,review_status',...cases.map(c=>[c.id,'C',c.label,reviewed.has(c.id)?'Reviewed':'Awaiting review'].join(','))];
    const href=URL.createObjectURL(new Blob([rows.join('\r\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=href;a.download='classroom-review.csv';a.click();setTimeout(()=>URL.revokeObjectURL(href),2000);
  };
  for(const b of app.querySelectorAll('[data-screen],[data-jump]'))b.onclick=()=>{if(b.dataset.screen==='history')historyCase=null;go(b.dataset.screen||b.dataset.jump);};
  Object.entries(lessons).forEach(([key,s])=>$('lessonRows').append(button(s.date+' · '+s.focus+' ↗',()=>{$('lessonChoice').value=key;$('timeStep').value=2;go('overview');})));
  series.forEach(([name,color],i)=>{
    const b=button(name,()=>{if(activeSeries.has(i)){if(activeSeries.size===1)return;activeSeries.delete(i);}else activeSeries.add(i);b.setAttribute('aria-pressed',String(activeSeries.has(i)));renderTime();});
    b.style.setProperty('--series',color);b.setAttribute('aria-pressed','true');$('traceLegend').append(b);
  });
  $('lessonChoice').onchange=()=>{$('timeStep').value=2;go('overview');};
  $('caseSearch').oninput=renderRegister;$('reviewFilter').onchange=renderRegister;
  $('timeStep').oninput=renderTime;$('rankStep').oninput=renderHistory;
  for(const id of ['activityChart','rankChart'])new ResizeObserver(()=>{if($(id).clientWidth){if(id==='activityChart')renderTime();else renderHistory();}}).observe($(id));
  go('overview');
})();
