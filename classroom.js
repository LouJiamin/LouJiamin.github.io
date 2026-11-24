(() => {
  const $ = id => document.getElementById(id);
  // Grade series transcribed from the seven-day figure in the formative assessment report.
  const series = [
    {name:'Interaction', color:'#535d60', values:['D','B','A','A','B','B','B']},
    {name:'Model grade', color:'#8d3944', values:['D','C','D','B','B','C','C']},
    {name:'Fluency', color:'#ad8561', values:['D','D','D','C','B',null,null]}
  ];
  const matrix = d3.select('.gradeMatrix');
  if (!matrix.empty()) {
    const days = d3.range(1,8);
    const outcomes = [
      'All three measures were D. This day provides a common starting point for the seven-day comparison.',
      'Interaction rose to B while fluency stayed at D. The homework assessment reached C.',
      'Interaction reached A, yet both writing fluency and the estimated homework grade were D. This is the day to revisit the written response.',
      'Interaction remained at A. Fluency rose to C and the estimated homework grade rose to B.',
      'Interaction, fluency and the homework assessment all reached B.',
      'Interaction held at B while the estimated homework grade fell to C. The fluency value cannot be resolved for this day.',
      'Interaction remained at B and the homework assessment remained at C. The fluency value cannot be resolved for this day.'
    ];
    const buttons=matrix.select('thead tr').selectAll('th.dayCol').data(days).join('th').attr('scope','col').attr('class','dayCol').append('button').attr('type','button').attr('aria-label',day=>'Inspect day '+day).text(day=>day);
    const rows=matrix.select('tbody').selectAll('tr').data([series[0],series[2],series[1]]).join('tr');
    rows.append('th').attr('scope','row').text(s=>s.name==='Model grade'?'Homework estimate':s.name);
    rows.selectAll('td').data(s=>s.values).join('td').attr('data-grade',d=>d||'').text(d=>d||'—');
    function selectDay(day){
      buttons.attr('aria-pressed',d=>String(d===day));
      rows.selectAll('td').classed('isSelected',(_,i)=>i+1===day);
      inspect('School day '+day,'Interaction '+series[0].values[day-1]+' · Homework '+series[1].values[day-1],outcomes[day-1]);
    }
    buttons.on('click',(_,d)=>selectDay(d));
    rows.selectAll('td').on('click',function(){selectDay(this.cellIndex);});
    selectDay(3);
  }
  const band = rank => rank <= 10 ? 'A' : rank <= 40 ? 'B' : 'C';
  function text(svg,x,y,value,attrs={}) {
    const node=svg.append('text').attr('x',x).attr('y',y).text(value);
    for(const [key,val] of Object.entries(attrs)) node.attr(key,val);
    return node;
  }
  function line(svg,x1,y1,x2,y2,color,dash) {
    return svg.append('line').attr('x1',x1).attr('y1',y1).attr('x2',x2).attr('y2',y2).attr('stroke',color).attr('stroke-dasharray',dash||null);
  }
  function inspect(label,title,detail) {
    $('readLabel').textContent=label;
    $('readTitle').textContent=title;
    $('readText').textContent=detail;
  }
  function draw(container) {
    const mini=container.hasAttribute('data-mini');
    const mode=container.dataset.mini || container.dataset.plot;
    const width=Math.max(225,Math.floor(container.clientWidth)), height=mini?150:255;
    const svg=d3.select(container).selectAll('svg').data([mode]).join('svg')
      .attr('viewBox','0 0 '+width+' '+height).attr('role','img');
    svg.selectAll('*').remove();
    const left=mini?24:34,right=width-(mini?18:25),top=mini?39:45,bottom=height-30;
      const before=mini?10:Number($('previous').value),after=mini?11:Number($('nextRank').value);
      const x=d3.scaleLinear().domain([0.5,55.5]).range([left,right]);
      const y1=top+49,y2=bottom-42;
      [[.5,10.5,'A'],[10.5,40.5,'B'],[40.5,55.5,'C']].forEach(([lo,hi,label],i)=>{
        svg.append('rect').attr('x',x(lo)).attr('y',top).attr('width',x(hi)-x(lo)).attr('height',bottom-top).attr('fill',['#f6eeed','#f6f4f0','#f1f3f1'][i]);
        text(svg,(x(lo)+x(hi))/2,top-9,'Band '+label,{'text-anchor':'middle'});
        if(i)line(svg,x(lo),top-3,x(lo),bottom,'#a69591','3 3');
      });
      [1,10,25,40,55].forEach(n=>text(svg,x(n),bottom+20,n,{'text-anchor':'middle'}));
      const route=d3.linkVertical()({source:[x(before),y1],target:[x(after),y2]});
      svg.append('path').attr('d',route).attr('fill','none').attr('stroke','#ac6a75').attr('stroke-width',10).attr('opacity',.19);
      svg.append('path').attr('d',route).attr('fill','none').attr('stroke','#843846').attr('stroke-width',2.4);
      [[before,y1,'Previous'],[after,y2,'Next']].forEach(([n,y,label],i)=>{
        for(let rank=1;rank<=55;rank++){
          const color=rank===n?'#8a3544':rank<n?'#b69294':'#d6d0c9';
          line(svg,x(rank),y-3,x(rank),y+3,color);
        }
        svg.append('circle').attr('cx',x(n)).attr('cy',y).attr('r',6).attr('fill',i?'#883e48':'white').attr('stroke','#883e48').attr('stroke-width',2.5);
        text(svg,x(n),i?y+25:y-17,label+' · '+n,{'text-anchor':n<9?'start':n>46?'end':'middle',class:'selectedValue'});
      });
      svg.attr('aria-label','Previous rank '+before+', band '+band(before)+'; next rank '+after+', band '+band(after));
      if(!mini){
        const change=Math.abs(before-after);
        const trend=change<=5?'stable':change<=10?'moderately variable':'highly variable';
        $('prevVal').textContent=before;$('nextVal').textContent=after;
        inspect('Illustrative rank change','Band '+band(before)+' → '+band(after),'A shift of '+change+(change===1?' place':' places')+' is classified as '+trend+'. '+(band(before)===band(after)?'Both ranks fall in the same band.':'The two ranks cross a classification boundary.')+' The trend and the band capture different aspects of the same change.');
      }
  }
  const framework = document.querySelector('.researchPath');
  if (framework) {
    const holder = d3.select(framework).insert('div','.pathPanel').attr('class','frameworkMap');
    const stages = [
      [['Initial attempt','AI suggestion','Revised query'], 'Recorded test'],
      [['Prior performance','Final correctness','Tests and revisions'], 'Unaided debugging'],
      [['Previous error','Learner explanation','Task history'], 'Next SQL challenge']
    ];
    function renderFramework() {
      const active = framework.querySelector('[aria-pressed=true]');
      const [inputs,outcome] = stages[Number(active.dataset.path)];
      const width = Math.max(240,holder.node().clientWidth);
      const svg = holder.selectAll('svg').data([outcome]).join('svg').attr('viewBox','0 0 '+width+' 104').attr('role','img').attr('aria-label',inputs.join(', ')+' linked to '+outcome);
      svg.selectAll('*').remove();
      const start=116,end=width-115;
      inputs.forEach((input,i)=>{
        const y=18+32*i;
        text(svg,0,y+4,input);
        svg.append('path').attr('d',d3.linkHorizontal()({source:[start,y],target:[end,50]})).attr('stroke','#c5aaa5').attr('fill','none');
      });
      svg.append('circle').attr('cx',end).attr('cy',50).attr('r',3).attr('fill','#8d3944');
      text(svg,end+7,54,outcome);
    }
    framework.querySelectorAll('[data-path]').forEach(button=>button.addEventListener('click',renderFramework));
    renderFramework();
    new ResizeObserver(renderFramework).observe(holder.node());
  }
  document.querySelectorAll('[data-mini],[data-plot]').forEach(plot=>{
    draw(plot);
    new ResizeObserver(()=>draw(plot)).observe(plot);
    plot.closest('section.caseFigure')?.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>draw(plot)));
  });
})();
