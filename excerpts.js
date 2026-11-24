const byId = id => document.getElementById(id);
const courseButtons = document.querySelectorAll('[data-course]');
function showCourse(name) {
  for (const button of courseButtons) {
    const selected = button.dataset.course === name;
    button.setAttribute('aria-pressed', selected);
    byId(button.dataset.course).hidden = !selected;
  }
}
function restoreCourse(){
  const fragment=location.hash.slice(1);
  showCourse(['ai','web','db'].includes(fragment)?fragment:'db');
}
for (const button of courseButtons) button.onclick=()=>{
  const name=button.dataset.course;
  history.pushState(null,'','#'+name);
  showCourse(name);
};
window.addEventListener('hashchange',restoreCourse);
window.addEventListener('popstate',restoreCourse);
restoreCourse();

// English overview of the nine AI Agent Development labs.
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
// The curriculum graph in studio.js uses these module descriptions.

// Adapted from Week 3: form input, conditional roles, and loop-generated energy tokens.
let level=0;
const input=byId('questInput');
const instructions=['Give your character a call sign. Watch the preview change as you type.','Choose a fictional character age. The condition assigns one of four roles.','Choose how many energy tokens to generate with a loop.'];
function stage(n){
  level=n;
  byId('challenge').textContent=instructions[n] || 'Quest complete. Your profile combines input, a branch, and repeated elements.';
  byId('progress').textContent=n+' of 3 complete';
  input.type=['text','number','range','text'][n];
  input.value='';
  if(n===1){input.min='0';input.max='120';}
  if(n===2){input.min='1';input.max='20';input.value='5';}
  input.hidden=n===3;
  input.required=n!==3;
  byId('questLabel').hidden=n===3;
  byId('questLabel').textContent=['Call sign','Character age','Token count',''][n];
  byId('questButton').textContent=['Unlock role','Unlock inventory','Generate tokens','Play again'][n];
  byId('questNote').textContent=n===2?'5 tokens selected.':'';
}
function role(age){return age<18?'Bronze apprentice':age<40?'Silver hacker':age<60?'Gold mentor':'Legendary architect';}
input.oninput=()=>{
  input.setCustomValidity('');
  if(level===0)byId('alias').textContent=input.value.trim() || 'Your player';
  if(level===1)byId('rank').textContent=input.value!==''&&input.validity.valid?role(input.valueAsNumber):'';
  if(level===2)byId('questNote').textContent=input.value+' tokens selected.';
};
byId('questForm').onsubmit=e=>{
  e.preventDefault();
  if(level===0&&!input.value.trim()){input.setCustomValidity('Enter a call sign.');input.reportValidity();return;}
  if(level===2){
    byId('tokens').replaceChildren(...Array.from({length:input.valueAsNumber},(_,i)=>{
      const token=document.createElement('span');token.textContent=i+1;return token;
    }));
  }
  if(level===3){byId('alias').textContent='Your player';byId('rank').textContent='';byId('tokens').replaceChildren();}
  stage((level+1)%4);
  (level===3?byId('questButton'):input).focus();
};
stage(0);

