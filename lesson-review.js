(() => {
  const $ = id => document.getElementById(id);
  const lessons = [
    {title:'Reading a linear graph',date:'28 Mar',start:540,topics:['Locate the intercept','Estimate the slope','Compare two lines']},
    {title:'Testing a boundary',date:'30 Mar',start:840,topics:['Check a point','Trace a boundary line','Compare half-planes']},
    {title:'Linear inequalities in two variables',date:'03 Apr',start:900,topics:['Interpret an inequality','Test a candidate solution','Graph the solution region']}
  ];
  const learners=Array.from({length:46},(_,i)=>'L'+String(i+1).padStart(2,'0'));
  const windows=d3.range(8);
  const colors=['#283e59','#a43b50','#687e87'];
  const metrics=['Active learners','Submissions','Revisions'];
  // Deterministic sample events. No identifiers or activity from actual students are used.
  let seed=58211;
  function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  const records=lessons.map((lesson,l)=>{
    const events=[];
    learners.forEach((id,i)=>{
      const skill=.32+(i%11)*.052;
      windows.forEach(w=>{
        const topic=Math.min(2,Math.floor((w+(i%7===0?1:0))/3));
        if(i===6 && w===4){
          [false,false,false,true].forEach((correct,k)=>events.push({id,w,topic,minute:w*5+k,item:'Q5',k,correct,seconds:[26,38,42,31][k]}));
          return;
        }
        const active=[.22,.67,.85,.32,.78,.9,.63,.4][w];
        if(random()>active || (i+l*3)%29===0 && w<5)return;
        const tries=1+(random()<.27?1:0)+(i%8===1&&w>=4?1:0);
        for(let k=0;k<tries;k++){
          const correct=random()<skill+.1*k-.07*topic;
          events.push({id,w,topic,minute:w*5+Math.min(4,k+Math.floor(random()*2)),item:'Q'+(w+1),k,correct,seconds:15+Math.floor(random()*68)});
          if(correct)break;
        }
      });
    });
    return events.sort((a,b)=>a.minute-b.minute||a.k-b.k);
  });
  const ranks=records.map(events=>{
    const scores=learners.map(id=>{
      const own=events.filter(e=>e.id===id),final=new Map(own.map(e=>[e.item,e]));
      const accuracy=d3.mean([...final.values()],e=>+e.correct)||0;
      return {id,value:accuracy/(d3.sum(own,e=>e.seconds)||1)};
    }).sort((a,b)=>b.value-a.value);
    return new Map(scores.map(({id,value})=>[id,1+scores.findIndex(s=>s.value===value)]));
  });
  const band=r=>r<=10?'A':r<=40?'B':'C';
  const state={l:0,w:4,topic:null,id:learners[0],tab:'class',scope:'all',expanded:false,metrics:new Set([0,1,2])};
  const reviewKey='jiamin-sample-class-reviews-v1';
  let reviews=new Set();try{const a=JSON.parse(localStorage.getItem(reviewKey));if(Array.isArray(a))reviews=new Set(a);}catch{}
  const L=()=>lessons[state.l], all=()=>records[state.l], context=()=>all().filter(e=>state.topic===null||e.topic===state.topic);
  const time=(w,extra=0)=>{const m=L().start+w*5+extra;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
  const interval=()=>time(state.w)+'–'+time(state.w+1);
  const topicName=()=>state.topic===null?'All knowledge points':L().topics[state.topic];
  const selectedRows=()=>context().filter(e=>e.w===state.w);
  function btn(label,click){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=click;return b;}
  function tab(name){state.tab=name;document.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==name);document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===name)));render();}
  function profile(id){state.id=id;state.scope='all';$('ldFind').value='';tab('students');}
  function tally(rows){return [new Set(rows.map(e=>e.id)).size,rows.length,rows.filter(e=>e.k>0).length];}
  function grouped(){const rows=context();return windows.map(w=>tally(rows.filter(e=>e.w===w)));}
  function chart(){
    const el=$('ldChart'), width=el.clientWidth;if(width<50)return;
    const height=200, data=grouped(), x=d3.scalePoint().domain(windows).range([30,width-20]), y=d3.scaleLinear().domain([0,Math.max(5,d3.max(data,d=>d3.max(d)))]).nice(4).range([height-26,14]);
    const svg=d3.select(el).selectAll('svg').data([0]).join('svg').attr('viewBox','0 0 '+width+' '+height).attr('role','img').attr('aria-label','Counts of active learners, submissions and revisions by five-minute interval');
    svg.selectAll('*').remove();
    y.ticks(4).forEach(n=>{svg.append('path').attr('d','M30 '+y(n)+'H'+(width-20)).attr('stroke','#e4e7eb');svg.append('text').attr('x',23).attr('y',y(n)+3).attr('text-anchor','end').text(n);});
    const xPos=x(state.w);svg.append('path').attr('d','M'+xPos+' 10V'+(height-26)).attr('stroke','#939ca7').attr('stroke-dasharray','3 4');
    state.metrics.forEach(k=>{
      svg.append('path').attr('d',d3.line().x((_,i)=>x(i)).y(d=>y(d[k])).curve(d3.curveMonotoneX)(data)).attr('stroke',colors[k]).attr('fill','none').attr('stroke-width',2.6);
      svg.append('circle').attr('cx',xPos).attr('cy',y(data[state.w][k])).attr('r',4.5).attr('fill',colors[k]).attr('stroke','white');
    });
    windows.forEach(w=>{if(width>430||w%2===0)svg.append('text').attr('x',x(w)).attr('y',height-7).attr('text-anchor','middle').text(time(w));});
    const nearest=ev=>d3.least(windows,w=>Math.abs(x(w)-d3.pointer(ev,svg.node())[0]));
    const tip=svg.append('g').attr('pointer-events','none').attr('visibility','hidden');
    tip.append('rect').attr('width',139).attr('height',74).attr('fill','#ffffff').attr('stroke','#ced3d9').attr('rx',3);
    svg.on('pointermove',ev=>{
      const w=nearest(ev);
      tip.attr('visibility','visible').attr('transform','translate('+Math.max(0,Math.min(width-139,x(w)+7))+',12)');
      tip.selectAll('text').data([time(w)+'–'+time(w+1),...metrics.map((name,k)=>name+'   '+data[w][k])]).join('text').attr('x',8).attr('y',(_,i)=>15+i*16).text(d=>d);
    }).on('pointerleave',()=>tip.attr('visibility','hidden')).on('click',ev=>selectWindow(nearest(ev)));
  }
  function selectWindow(w){state.w=w;render();}
  function groupFor(n){return n===0?0:n===1?1:n===2?2:3;}
  const groupLabels=['No submission','One submission','Two submissions','Three or more'];
  function showExamples(){
    const groups=d3.groups(context(),e=>e.id+'-'+e.item).map(([,rows])=>rows);
    const examples=[
      ['Correct on first attempt',g=>g.length===1&&g[0].correct],
      ['Correct after revision',g=>g.length>1&&g.at(-1).correct],
      ['Still open after revision',g=>g.length>1&&!g.at(-1).correct]
    ];
    $('ldExamples').replaceChildren(...examples.flatMap(([label,match])=>{
      const group=groups.find(match);if(!group)return [];
      const e=group[0];
      const b=btn('',()=>{state.w=e.w;state.topic=e.topic;profile(e.id);});
      b.innerHTML='<small>'+e.id+' · '+time(e.w)+'</small><strong>'+label+' ↗</strong><span>'+L().topics[e.topic]+' · '+group.length+' attempt'+(group.length===1?'':'s')+'</span>';
      return [b];
    }));
  }
  function drawClass(){
    $('ldDate').textContent='Grade 8 mathematics · '+L().date;$('ldName').textContent=L().title;
    const rows=context(),chosen=selectedRows(),ids=new Set(chosen.map(e=>e.id));
    const counts=learners.map(id=>chosen.filter(e=>e.id===id).length);
    const total=tally(rows);
    $('ldStats').innerHTML=[['Enrolled',46],['Active learners',total[0]],['Submissions',total[1]],['Revisions',total[2]]].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');
    $('ldTimes').replaceChildren(...windows.map(w=>new Option(time(w)+'–'+time(w+1),w,false,w===state.w)));
    $('ldConcepts').replaceChildren(...['All concepts',...L().topics].map((name,i)=>{const topic=i?i-1:null;const b=btn(name,()=>{state.topic=topic;if(topic!==null&&!all().some(e=>e.w===state.w&&e.topic===topic)){state.w=d3.greatest(windows,w=>all().filter(e=>e.w===w&&e.topic===topic).length);}render();});b.setAttribute('aria-pressed',String(state.topic===topic));return b;}));
    $('ldSummary').textContent=topicName()+' · '+ids.size+' of 46 learners submitted.';
    $('ldDistribution').replaceChildren(...groupLabels.map((name,i)=>{const count=counts.filter(n=>groupFor(n)===i).length;const b=btn('',()=>{state.scope=String(i);$('ldFind').value='';tab('students');});b.innerHTML='<span>'+name+'</span><b>'+count+'</b><i style="width:'+count/46*100+'%"></i>';b.disabled=!count;b.title='Inspect '+count+' learners';return b;}));
    $('ldReason').textContent=chosen.length?chosen.filter(e=>e.k>0).length+' repeat submissions. Open a frequency group to inspect attempts and revisions.':'No submissions for this selection. Choose another interval to compare.';
    const sorted=[...learners];if($('ldSort').value!=='code')sorted.sort((a,b)=>counts[learners.indexOf(b)]-counts[learners.indexOf(a)]);
    const visible=state.expanded?sorted:sorted.slice(0,5);
    const host=$('ldMatrix');host.innerHTML='<table><thead><tr><th>Student</th>'+windows.map(w=>'<th>'+time(w)+'</th>').join('')+'</tr></thead><tbody></tbody></table>';
    const body=host.querySelector('tbody');
    for(const id of visible){const tr=body.insertRow();const th=document.createElement('th');th.scope='row';th.append(btn(id,()=>profile(id)));tr.append(th);
      windows.forEach(w=>{const n=rows.filter(e=>e.id===id&&e.w===w).length;const cell=tr.insertCell(),b=btn(String(n),()=>{state.w=w;profile(id);});b.dataset.level=groupFor(n);b.title=id+' · '+time(w)+' · '+n+' submissions';b.setAttribute('aria-label',b.title);cell.append(b);});}
    host.append(btn(state.expanded?'Show five learners':'Show all 46 learners',()=>{state.expanded=!state.expanded;drawClass();}));chart();showExamples();
  }
  function evidence(id){
    const vals=ranks.slice(0,state.l+1).map(r=>r.get(id)),current=vals.at(-1),previous=vals.at(-2),diff=previous===undefined?null:Math.abs(current-previous);
    return {vals,current,forecast:band(current),trend:diff===null?'First observation':diff<=5?'Stable':diff<=10?'Moderately variable':'Highly variable',diff};
  }
  function drawStudents(){
    const rows=selectedRows(),found=learners.filter(id=>(state.scope==='all'||state.scope==='active'&&rows.some(e=>e.id===id)||state.scope===String(groupFor(rows.filter(e=>e.id===id).length)))&&id.toLowerCase().includes($('ldFind').value.trim().toLowerCase()));
    $('ldCohort').textContent=L().date+' · '+interval()+' · '+topicName()+' · '+(state.scope==='all'?'All learners':state.scope==='active'?'Active learners':groupLabels[Number(state.scope)]);
    if(!found.includes(state.id))state.id=found[0]||'';
    $('ldStudents').replaceChildren(...found.map(id=>{const n=rows.filter(e=>e.id===id).length,b=btn(id+' · '+n+' submissions',()=>{state.id=id;drawStudents();});b.setAttribute('aria-pressed',String(id===state.id));return b;}));
    const p=$('ldProfile');if(!state.id){p.textContent='No learners match this selection.';return;}
    const e=evidence(state.id),own=context().filter(d=>d.id===state.id),log=own.filter(d=>d.w===state.w);
    p.innerHTML='<small>Individual record · '+L().date+'</small><h5>Learner '+state.id+'</h5><div class="ldIndividual"><div><small>Predicted band</small><b>'+e.forecast+'</b></div><div><small>Observed rank</small><b>'+e.current+' / 46</b></div><div><small>Rank trend</small><b>'+e.trend+'</b></div></div><small>Fluency rank by lesson</small><div class="ldRankDays">'+e.vals.map((v,i)=>'<span>'+lessons[i].date+' <b>'+v+'</b></span>').join(' → ')+'</div><p class="ldFoot">Sample forecast uses the current rank band. The original study evaluated a random forest.</p><h6>Submissions across this lesson</h6>';
    const strip=document.createElement('div');strip.className='ldStrip';windows.forEach(w=>{const n=own.filter(d=>d.w===w).length,b=btn(time(w)+' · '+n,()=>{state.scope='all';state.w=w;drawStudents();});b.setAttribute('aria-pressed',String(w===state.w));strip.append(b);});p.append(strip);
    const heading=document.createElement('h6');heading.textContent=interval()+' · '+topicName();p.append(heading);
    const table=document.createElement('table');table.innerHTML='<thead><tr><th>Time</th><th>Task / concept</th><th>Attempt</th><th>Duration</th><th>Result</th></tr></thead><tbody>'+log.map(d=>'<tr><td>'+time(0,d.minute)+'</td><td>'+d.item+' · '+L().topics[d.topic]+'</td><td>'+(d.k+1)+'</td><td>'+d.seconds+' s</td><td>'+(d.correct?'Correct':'Incorrect')+'</td></tr>').join('')+'</tbody>';if(log.length)p.append(table);else p.append('No submissions recorded for this interval and concept.');
    const key=state.l+'/'+state.id;p.append(btn(reviews.has(key)?'Reopen review':'Mark reviewed',()=>{reviews.has(key)?reviews.delete(key):reviews.add(key);try{localStorage.setItem(reviewKey,JSON.stringify([...reviews]));}catch{}drawStudents();}));
  }
  function drawQueue(){
    const queue=learners.filter(id=>evidence(id).forecast==='C');
    $('ldQueue').innerHTML='<table><thead><tr><th>Learner</th><th>Forecast</th><th>Recent rank movement</th><th>Review</th></tr></thead><tbody></tbody></table>';
    const body=$('ldQueue').querySelector('tbody');for(const id of queue){const e=evidence(id),row=body.insertRow();row.insertCell().append(btn(id+' ↗',()=>profile(id)));row.insertCell().textContent=e.forecast;row.insertCell().textContent=e.trend+(e.diff===null?'':' · '+e.diff+' places');row.insertCell().textContent=reviews.has(state.l+'/'+id)?'Reviewed':'Open';}
  }
  function render(){if(state.tab==='class')drawClass();if(state.tab==='students')drawStudents();if(state.tab==='review')drawQueue();}
  lessons.forEach((l,i)=>$('ldLesson').add(new Option(l.date+' · '+l.title,i)));
  state.l=2;$('ldLesson').value=2;
  $('ldLesson').onchange=()=>{state.l=Number($('ldLesson').value);state.topic=null;state.w=4;state.scope='all';state.expanded=false;$('ldFind').value='';render();};
  $('ldSort').onchange=drawClass;$('ldFind').oninput=drawStudents;
  $('ldTimes').onchange=()=>selectWindow(Number($('ldTimes').value));
  $('ldReset').onclick=()=>{state.topic=null;state.w=4;state.expanded=false;render();};
  $('ldDrill').onclick=()=>{state.scope='active';$('ldFind').value='';tab('students');};
  $('ldAll').onclick=()=>{state.scope='all';$('ldFind').value='';drawStudents();};
  $('ldExport').onclick=()=>{const rows=['lesson,learner,sample_forecast,rank,trend,review',...learners.filter(id=>evidence(id).forecast==='C').map(id=>{const e=evidence(id);return [L().date,id,e.forecast,e.current,e.trend,reviews.has(state.l+'/'+id)?'Reviewed':'Open'].join(',');})];const u=URL.createObjectURL(new Blob([rows.join('\r\n')],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download='sample-lesson-review.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
  metrics.forEach((name,k)=>{const b=btn(name,()=>{if(state.metrics.has(k)){if(state.metrics.size===1)return;state.metrics.delete(k);}else state.metrics.add(k);b.setAttribute('aria-pressed',String(state.metrics.has(k)));chart();});b.style.setProperty('--series',colors[k]);b.setAttribute('aria-pressed','true');$('ldLegend').append(b);});
  new ResizeObserver(()=>{if(state.tab==='class')chart();}).observe($('ldChart'));
  tab('class');
})();
