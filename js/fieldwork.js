const zoom = document.querySelector('.plateZoom');
const targetMap = d3.select('.targetMap');
const layers = [
  ['Lesson context','Feature family','Learner and lesson information','The dataset links observations to students and lessons across four classes and eight subjects.'],
  ['Past achievement','Feature family','Previous academic performance','Exam results provide a longer-term reference for interpreting what happens within one lesson.'],
  ['LMS activity','Feature family','Participation and submission','Classroom activity supplies evidence of engagement. Teachers can compare it with the accuracy and timing of students’ work.'],
  ['Precision teaching','Feature family','Speed and accuracy together','Task accuracy divided by answering time gives fluency. Its within-class rank and change from the last class describe relative position and movement.'],
  ['20 inputs','Dataset','7,491 lesson records','The four feature families draw on 24 weeks of classroom activity. These inputs capture the learning context, earlier performance and activity during the lesson.'],
  ['Six classifiers','Model comparison','Five conventional models and an MLP','The same candidate set comprised KNN, SVM, random forest, decision tree, logistic regression and a multilayer perceptron. Model selection was specific to each outcome.'],
  ['Homework grade','Current lesson','Decision tree · 92.862% accuracy','A five-category homework label supports formative assessment. The key evidence included achievement and engagement.'],
  ['Next-class rank','Following lesson','Random forest · 91.99% accuracy','The predicted rank band informs a teacher alert. Past exam performance and current classroom achievement contributed to this task.']
];
const assessment = Boolean(document.querySelector('.gradeMatrix'));
if (!assessment) layers[6] = layers[7];
layers.length = 7;
let topic = 6;
function updateMap() {
  const w = targetMap.node().clientWidth;
  const compact = w < 510;
  const width = compact ? 300 : 660, height = compact ? 244 : 160;
  const pos = compact ? [[68,20],[232,20],[68,60],[232,60],[150,106],[150,156],[150,218]]
                      : [[68,20],[68,60],[68,100],[68,140],[240,80],[402,80],[581,80]];
  const svg = targetMap.selectAll('svg').data([0]).join('svg').attr('viewBox','0 0 '+width+' '+height).attr('role','group').attr('aria-label','Explore study inputs, models and outcomes');
  svg.selectAll('*').remove();
  for (const [a,b] of [[0,4],[1,4],[2,4],[3,4],[4,5],[5,6]]) {
    const active = topic === a || topic === b;
    const path = compact ? d3.linkVertical() : d3.linkHorizontal();
    const source=pos[a].slice(), target=pos[b].slice();
    if(compact){source[1]+=13;target[1]-=13;} else {source[0]+=61;target[0]-=61;}
    svg.append('path').attr('d',path({source,target})).attr('fill','none').attr('stroke',active?'#8c3a4a':'#b8aaa1').attr('stroke-width',active?2.5:1.3);
  }
  const nodes=svg.selectAll('g').data(layers).join('g').attr('transform',(_,i)=>'translate('+pos[i]+')').attr('role','button').attr('tabindex','0').attr('aria-pressed',(_,i)=>String(i===topic)).attr('aria-label',d=>d[0]);
  nodes.append('rect').attr('x',-60).attr('y',-13).attr('width',120).attr('height',26).attr('rx',2).attr('fill',(_,i)=>i===topic?'#75303d':'#fffaf7').attr('stroke',(_,i)=>i===topic?'#75303d':'#c7b7ac');
  nodes.append('text').attr('text-anchor','middle').attr('dy','.36em').attr('fill',(_,i)=>i===topic?'white':'#453637').text(d=>d[0]);
  function select(event,d){
    topic=layers.indexOf(d);
    updateMap();
    if(event.type==='keydown')targetMap.selectAll('g').nodes()[topic].focus();
  }
  nodes.on('click',select).on('keydown',(event,d)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();select(event,d);}});
  const [,type,title,detail]=layers[topic];
  document.getElementById('targetType').textContent=type;
  document.getElementById('targetTitle').textContent=title;
  document.getElementById('targetDetail').textContent=detail;
}
let mapWidth = targetMap.node().clientWidth;
updateMap();
new ResizeObserver(() => {
  const width = targetMap.node().clientWidth;
  if (width !== mapWidth) {
    mapWidth = width;
    updateMap();
  }
}).observe(targetMap.node());
for (const deck of document.querySelectorAll('.evidenceDeck')) {
  const controls = deck.querySelectorAll('[aria-controls]');
  controls.forEach(button => button.addEventListener('click', () => {
    controls.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-pressed', String(selected));
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }));
  deck.querySelectorAll('.openPhoto').forEach(button => button.addEventListener('click', () => {
    const image = button.querySelector('img');
    const enlarged = zoom.querySelector('img');
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    zoom.querySelector('p').textContent = button.nextElementSibling.textContent;
    zoom.showModal();
    zoom.querySelector('button').focus();
  }));
}
zoom.querySelector('button').addEventListener('click', () => zoom.close());
const previous = document.getElementById('previous');
if (previous) {
  const examples = document.createElement('div');
  examples.className = 'rankExamples';
  for (const [label, a, b] of [['Cross A/B',10,11],['Cross B/C',40,41],['Move within B',14,29]]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      previous.value = a;
      document.getElementById('nextRank').value = b;
      previous.dispatchEvent(new Event('input'));
    });
    examples.append(button);
  }
  previous.closest('.plotControls').after(examples);
}

