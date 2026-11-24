(() => {
  const $ = id => document.getElementById(id);
  const action = $('reqAction');
  const condition = $('reqCondition');
  const diagram = $('reqSequence');
  const bookings = [];
  let messages = [];
  let runNumber = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  function shape(name, attrs, label) {
    const element = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
    if (label !== undefined) element.textContent = label;
    return element;
  }
  function conditions() {
    const staff = action.value === 'staff';
    $('conditionLabel').textContent = staff ? 'Session' : 'Form data';
    const options = staff ? [['guest', 'Guest session'], ['staff', 'Staff session']] : [['valid', 'All fields supplied'], ['missing', 'Phone field empty']];
    condition.replaceChildren(...options.map(([value, label]) => new Option(label, value)));
  }
  function record(from, to, label, browser, server, note) {
    messages.push({ from, to, label, browser, server, note, count: bookings.length });
  }
  function book(complete, name, records, appendEvent) {
    function record(from, to, label, browser, server, note) {
      appendEvent({from, to, label, browser, server, note, count:records.length});
    }
    record(0, 1, 'GET · activity', 'GET detail.php?id=web101', 'find_activity("web101")', 'The browser requests the activity page. PHP looks up the activity named in the URL.');
    record(1, 0, '200 · booking form', 'Registration form', 'Render detail.php', 'The page offers a form for this activity. Opening it leaves the register unchanged.');
    record(0, 1, 'POST · form data', complete ? 'POST · phone supplied' : 'POST · phone empty', 'Validate required fields', complete ? 'The request body contains the activity, sample learner name, and phone. All required fields are present.' : 'The request body contains an empty phone field. Validation sends the learner back to complete the form.');
    if (complete) {
      records.push({activity_id:'web101', student_name:name, phone:'demo-phone', request_method:'POST'});
      record(1, 2, 'Append · booking', 'Waiting for response', 'save_booking(…)', 'The handler appends one sample registration. Inspect the saved records to see the fields at this step.');
    }
    record(1, 0, complete ? '302 · confirmation' : '302 · missing field', 'Follow redirect to index.php', 'Location: index.php?msg=…', complete ? 'PHP redirects the browser after the write. Reloading the destination will issue a GET.' : 'PHP redirects with a validation message. The write step was skipped.');
    record(0, 1, 'GET · result page', complete ? 'Booking confirmed' : 'Complete the required fields', 'Render index.php', 'The redirected GET displays the result and leaves the number of saved registrations unchanged.');
    return complete ? 'Booking saved' : 'Validation failed';
  }
  function staffView() {
    const staff = condition.value === 'staff';
    record(0, 1, 'GET · register', 'GET admin.php', 'Check session', 'The staff page checks the session before opening the registration file.');
    if (staff) {
      record(1, 2, 'Read · register', 'Waiting for register', 'read_bookings()', 'A staff session allows PHP to read the records saved by earlier successful bookings.');
      record(2, 1, 'Return · records', 'Waiting for register', bookings.length + ' records returned', 'PHP receives the current registration list. Reading it leaves every record intact.');
      record(1, 0, '200 · register', bookings.length + (bookings.length === 1 ? ' registration shown' : ' registrations shown'), 'Render admin.php', 'The register displays the records from the same store used by the booking form.');
    } else {
      record(1, 0, '302 · sign in', 'Redirect to login.php', 'Location: login.php', 'The guest is directed to sign in before any records are read.');
      record(0, 1, 'GET · sign-in page', 'Sign-in form', 'Render login.php', 'The browser opens the sign-in page. The staff register has not been read.');
    }
    return staff ? 'Register opened' : 'Sign-in required';
  }
  const columns = [66, 360, 654];
  function inspect(index) {
    const event = messages[index];
    for (const [i, group] of [...diagram.querySelectorAll('[role=button]')].entries()) group.setAttribute('aria-pressed', String(i === index));
    $('reqBrowser').textContent = event.browser;
    $('reqServer').textContent = event.server;
    $('reqStore').textContent = event.count + (event.count === 1 ? ' saved record' : ' saved records');
    $('reqExplain').textContent = event.note;
    $('reqRecordsTitle').textContent = 'Inspect bookings.json at this step (' + event.count + ')';
    $('reqRecords').textContent = JSON.stringify(bookings.slice(0, event.count), null, 2);
  }
  function draw() {
    const end = 53 + messages.length * 39;
    diagram.setAttribute('viewBox','0 0 720 ' + (end + 10));
    diagram.replaceChildren();
    ['Browser','PHP handler','Record store'].forEach((name, i) => {
      const x = columns[i];
      diagram.append(shape('line',{x1:x,x2:x,y1:40,y2:end,class:'reqGuide'}),shape('text',{x,y:22,'text-anchor':'middle',class:'reqLane'},name),shape('circle',{cx:x,cy:40,r:3,class:'reqPoint'}));
    });
    messages.forEach((m,i) => {
      const x = columns[m.from], dest = columns[m.to], direction = Math.sign(dest-x);
      const y = 66 + 39*i;
      const group = shape('g',{role:'button',tabindex:'0','aria-label':String(i+1)+'. '+m.label});
      group.append(shape('rect',{x:5,y:y-18,width:710,height:35,rx:2,class:'reqBand'}),shape('path',{d:'M '+x+' '+y+' H '+dest,class:'reqLine'}),shape('path',{d:'M '+(dest-direction*8)+' '+(y-4)+' L '+dest+' '+y+' L '+(dest-direction*8)+' '+(y+4),class:'reqArrow'}),shape('circle',{cx:x,cy:y,r:3,class:'reqPoint'}),shape('text',{x:(x+dest)/2,y:y-5,'text-anchor':'middle',class:'reqMsg'},m.label));
      group.addEventListener('click',()=>inspect(i));
      group.addEventListener('keydown',event=>{
        if (event.key === 'Enter' || event.key === ' ') {event.preventDefault();inspect(i);}
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const next = (i + (event.key === 'ArrowDown' ? 1 : -1) + messages.length) % messages.length;
          diagram.querySelectorAll('[role=button]')[next].focus();
          inspect(next);
        }
      });
      diagram.append(group);
    });
  }
  function run() {
    runNumber++;
    messages = [];
    const staff = action.value === 'staff';
    const name = 'Learner ' + String(runNumber).padStart(2, '0');
    $('reqOutcome').textContent = staff ? staffView() : book(condition.value === 'valid', name, bookings, event => messages.push(event));
    $('reqFigureTitle').textContent = staff ? 'The staff register' : 'Activity registration';
    draw();
    inspect(staff ? messages.length-1 : (condition.value === 'valid' ? 3 : 2));
  }
  action.addEventListener('change',conditions);
  $('reqRun').addEventListener('click',run);
  $('reqClear').addEventListener('click',() => {
    bookings.length = 0;
    runNumber = 0;
    action.value = 'book';
    conditions();
    messages = [];
    record(0, 1, 'GET · activity', 'GET detail.php?id=web101', 'find_activity("web101")', 'The register is empty. Run a booking with a complete or incomplete form to compare the paths.');
    record(1, 0, '200 · booking form', 'Registration form', 'Render detail.php', 'The form is ready to submit. No records have been written.');
    $('reqOutcome').textContent = 'Ready to submit';
    $('reqFigureTitle').textContent = 'Activity registration';
    draw();
    inspect(1);
  });
  conditions();
  run();
  const comparison = [true, false].map(complete => {
    const events = [];
    book(complete, 'Sample learner', [], event => events.push(event));
    return events;
  });
  const stages = [
    'Both forms open the same activity. The only input that changes between the two submissions is the phone field.',
    'PHP checks the same required fields in both requests. An empty phone field sends the second learner back to the form.',
    'Only the complete submission reaches the write. Starting with the same empty register makes the difference visible.',
    'Both browsers follow a redirect to the index page. The message they display depends on the validation result.'
  ];
  const stageButtons = document.querySelectorAll('[data-stack-step]');
  const stageViews = [
    ['detail.php','Submit the form','phone = "demo-phone"','phone = ""'],
    ['process.php','Check the required fields','save_booking(…)','redirect_to(…)'],
    ['bookings.json','Where the write happens','append { activity_id: "web101", … }','[]'],
    ['index.php','Read the response','GET index.php · confirmation','GET index.php · validation message']
  ];
  const planes = document.querySelectorAll('[data-layer]');
  function showStage(index) {
    const activeLayer = index === 3 ? 0 : index;
    for (const plane of planes) plane.setAttribute('aria-pressed', String(Number(plane.dataset.layer) === activeLayer));
    for (const button of stageButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.stackStep) === index));
    comparison.forEach((events, i) => {
      const post = events[2];
      const write = events.find(event => event.to === 2);
      const last = events.at(-1);
      const states = [post.browser, write ? 'Required fields pass' : 'Required field empty',
        '0 → ' + last.count + (last.count === 1 ? ' record' : ' records'), last.browser];
      $(i === 0 ? 'completeState' : 'incompleteState').textContent = states[index];
    });
    $('stackExplanation').textContent = stages[index];
    const [file, title, complete, missing] = stageViews[index];
    $('stackLocation').textContent = file;
    $('stackHeading').textContent = title;
    $('completeEvidence').textContent = complete;
    $('missingEvidence').textContent = missing;
    document.querySelector('.stackDrawing').dataset.stage = index;
  }
  stageButtons.forEach(button => button.addEventListener('click', () => showStage(Number(button.dataset.stackStep))));
  planes.forEach(plane => {
    const select = () => showStage(Number(plane.dataset.layer));
    plane.addEventListener('click', select);
    plane.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); select();}
    });
  });
  showStage(2);
})();
