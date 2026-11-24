const byId = id => document.getElementById(id);
const modules = [
  ['Foundations','Build a course reminder agent.','Set its role and goal, then test a reminder in the preview.'],
  ['Workflows','Turn a writing task into a workflow.','Trace a variable from input through analysis and generation to the final output.'],
  ['Tools & cards','Display a tool result as a card.','Match a field from a JSON response to the value shown to the reader.'],
  ['Retrieval','Build a course FAQ assistant.','Split source documents into passages. Run five questions and check whether each answer cites the passage that supports it.'],
  ['Prompt design','Revise an instructional prompt.','Compare outputs after changing the role, constraints, or example.'],
  ['Databases','Build an event registration assistant.','Choose the record fields, add an entry, then retrieve it to check the stored values.'],
  ['Media projects','Build a poster or news video workflow.','Follow a source asset through generation and inspect the resulting media.'],
  ['Multi-agent','Design a travel assistant with three roles.','Test which agent receives each question and how its result reaches the next role.'],
  ['Final project','Explain one complete agent run.','Bring together the workflow, tools, evidence and tests. Use a run record to explain how an input produced its output.']
];
// Relationships and concepts from the original course map.
const concepts=[
 ['Agent definition','Digital employee','Platform interface','Role settings','Preview and debug'],
 ['Start node','Variable passing','Model node','Conditional branches','Output'],
 ['API concepts','JSON data flow','Parameters','Card fields','Result display'],
 ['Import sources','Document chunking','Retrieval','Citations','Hallucination control'],
 ['Role','Task steps','Constraints','Output format','Examples'],
 ['Field design','Insert records','Query records','Update and delete','Privacy'],
 ['Requirements','Source assets','Prompt roles','Image generation','Audio and video'],
 ['Roles','Routing rules','Task handoff','Combined output','Boundaries'],
 ['Requirements','Prompts','Workflows','Tools and cards','Knowledge base','Database','Generated content','Multi-agent','Test review']
];
const layout=[[490,145],[710,215],[805,365],[710,525],[490,610],[270,525],[175,365],[270,215],[490,370]];
const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[1,6],[3,8],[4,7],[5,8],[2,6]];
const atlas=byId('atlasPlot');
const svgNamespace='http://www.w3.org/2000/svg';
function svgElement(name,attributes,parent,label){
  const element=document.createElementNS(svgNamespace,name);
  Object.entries(attributes).forEach(([key,value])=>element.setAttribute(key,value));
  if(label!==undefined)element.textContent=label;
  parent.append(element);
  return element;
}
const labButtons=modules.map(([title],index)=>{
  const button=document.createElement('button');
  const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');
  button.append(number,document.createTextNode(title));
  button.onclick=()=>selectModule(index);
  document.querySelector('.atlasNav').append(button);
  return button;
});
const exampleLab=modules.findIndex(([title])=>title==='Retrieval');
let activeLab=exampleLab, expanded=true, zoomLevel=1, panX=0, panY=0;
function fitView(){
  atlas.classList.toggle('zoomed',zoomLevel>1);
  const w=980/zoomLevel,h=760/zoomLevel;
  atlas.setAttribute('viewBox',[(980-w)/2+panX,(760-h)/2+panY,w,h].join(' '));
  byId('scaleDown').disabled=zoomLevel<=1;
  byId('scaleUp').disabled=zoomLevel>=2;
}
function selectModule(index){
  activeLab=index;expanded=true;
  if(zoomLevel>1){panX=layout[index][0]-490;panY=layout[index][1]-380;fitView();}
  drawAtlas();
}
function curve([x,y],[u,v],bend){
  const length=Math.hypot(u-x,v-y);
  return 'M '+x+' '+y+' Q '+((x+u)/2-(v-y)*bend/length)+' '+((y+v)/2+(u-x)*bend/length)+' '+u+' '+v;
}
// Place translated labels around each module without covering another lab.
function placeBranches(index){
  const [x,y]=layout[index],labels=concepts[index],count=labels.length;
  const blocked=layout.map(([cx,cy],i)=>({cx,cy,w:i===8?162:142,h:i===8?160:65}));
  const points=[];
  labels.forEach((label,i)=>{
    const w=Math.max(62,label.length*7.3+22);
    let best;
    for(const radius of [104,134,166,198]){
      for(let shift=0;shift<24;shift++){
        const rotation=Math.ceil(shift/2)*(shift%2?1:-1)*Math.PI/12;
        const angle=-Math.PI/2+i*2*Math.PI/count+rotation;
        const cx=x+Math.cos(angle)*radius,cy=y+Math.sin(angle)*radius;
        if(cx-w/2<6||cx+w/2>974||cy<30||cy>724)continue;
        if(blocked.some(box=>Math.abs(box.cx-cx)<(w+box.w)/2+4 && Math.abs(box.cy-cy)<(42+box.h)/2+4))continue;
        const cost=Math.abs(rotation)*42+radius;
        if(!best||cost<best.cost)best={cx,cy,w,h:42,cost};
      }
    }
    if(best){blocked.push(best);points.push({...best,label});}
  });
  return points;
}
function drawAtlas(){
  const query=byId('findConcept').value.toLowerCase().trim();
  const matching=modules.map(([name],i)=>[name,...concepts[i]].join(' ').toLowerCase().includes(query));
  const group=svgElement('g',{},atlas);atlas.replaceChildren(group);
  const adjacent=new Set([activeLab]);
  for(const [a,b] of edges)if(a===activeLab||b===activeLab||activeLab===8){adjacent.add(a);adjacent.add(b);}
  svgElement('ellipse',{cx:490,cy:374,rx:317,ry:238,class:'orbit'},group);
  svgElement('ellipse',{cx:490,cy:374,rx:190,ry:151,class:'orbit innerOrbit'},group);
  edges.forEach(([a,b],i)=>{
    const hot=a===activeLab||b===activeLab||activeLab===8;
    svgElement('path',{d:curve(layout[a],layout[b],i<8?28:50),class:'atlasEdge '+(i>=8?'cross ':'')+(hot?'hot':'')},group);
  });
  const branchPoints=expanded?placeBranches(activeLab):[];
  branchPoints.forEach(p=>svgElement('path',{d:curve(layout[activeLab],[p.cx,p.cy-8],8),class:'twig'},group));
  layout.forEach(([x,y],i)=>{
    const active=i===activeLab,central=i===8;
    const node=svgElement('g',{transform:'translate('+x+' '+y+')',class:'labNode '+(central?'core ':'')+(active?'selected ':'')+(!query&&!adjacent.has(i)||query&&!matching[i]?'quiet':''),role:'button',tabindex:0,'aria-label':modules[i][0],'aria-pressed':active},group);
    svgElement('ellipse',{cx:0,cy:0,rx:central?89:82,ry:central?89:54,class:'halo'},node);
    if(central)svgElement('circle',{cx:0,cy:0,r:70,class:'nodeFace'},node);
    else svgElement('rect',{x:-69,y:-32,width:138,height:64,rx:15,class:'nodeFace'},node);
    if(central){
      svgElement('text',{y:-19,class:'labTag'},node,'COOL-PLAY AI');
      svgElement('text',{y:5,class:'nodeName'},node,'Final project');
      svgElement('text',{y:25,class:'labTag'},node,'LAB 09');
    }else{
      svgElement('text',{y:-7,class:'labTag'},node,'LAB '+String(i+1).padStart(2,'0'));
      svgElement('text',{y:14,class:'nodeName'},node,modules[i][0]);
    }
    node.onclick=()=>selectModule(i);
    node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectModule(i);atlas.querySelectorAll('.labNode')[i].focus();}};
  });
  branchPoints.forEach(({cx,cy,w,label})=>{
    const branch=svgElement('g',{transform:'translate('+cx+' '+cy+')',class:'satellite'},group);
    svgElement('polygon',{points:'0,-17 7,-13 7,-5 0,-1 -7,-5 -7,-13'},branch);
    svgElement('rect',{x:-w/2,y:1,width:w,height:22,rx:7},branch);
    svgElement('text',{y:17},branch,label);
  });
  labButtons.forEach((button,i)=>{button.setAttribute('aria-pressed',i===activeLab);button.hidden=!!query&&!matching[i];});
  byId('branchToggle').setAttribute('aria-pressed',expanded);
  byId('labNumber').textContent='Lab '+String(activeLab+1).padStart(2,'0')+' / 09';
  byId('mapTitle').textContent=modules[activeLab][0];
  byId('mapNote').textContent=modules[activeLab].slice(1).join(' ');
  byId('matches').textContent=query?(matching.filter(Boolean).length+' matching modules'):'Solid lines follow the lab sequence. Dashed lines connect related labs.';
}
byId('findConcept').oninput=()=>{
  const q=byId('findConcept').value.toLowerCase().trim();
  const i=modules.findIndex(([title],n)=>[title,...concepts[n]].join(' ').toLowerCase().includes(q));
  if(i>=0&&q)selectModule(i);else drawAtlas();
};
byId('branchToggle').onclick=()=>{expanded=!expanded;drawAtlas();};
function resetAtlas(){
  byId('findConcept').value='';
  zoomLevel=matchMedia('(max-width:760px)').matches?2:1;
  panX=panY=0;
  selectModule(exampleLab);
  fitView();
}
byId('clearMap').onclick=resetAtlas;
function changeScale(step){
  zoomLevel=Math.min(2,Math.max(1,zoomLevel+step));
  panX=zoomLevel===1?0:layout[activeLab][0]-490;
  panY=zoomLevel===1?0:layout[activeLab][1]-380;
  fitView();
}
byId('scaleDown').onclick=()=>changeScale(-.25);byId('scaleUp').onclick=()=>changeScale(.25);
let drag=null;
atlas.onpointerdown=e=>{
  if(zoomLevel===1||e.target.closest('.labNode'))return;
  drag=[e.clientX,e.clientY,panX,panY];atlas.setPointerCapture(e.pointerId);
};
atlas.onpointermove=e=>{
  if(!drag)return;
  const scale=atlas.getScreenCTM().a;
  panX=Math.max(-420,Math.min(420,drag[2]-(e.clientX-drag[0])/scale));
  panY=Math.max(-320,Math.min(320,drag[3]-(e.clientY-drag[1])/scale));
  fitView();
};
atlas.onpointerup=atlas.onpointercancel=()=>{drag=null;};
matchMedia('(max-width:760px)').addEventListener('change',resetAtlas);
resetAtlas();

