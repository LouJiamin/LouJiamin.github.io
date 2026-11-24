const byId = id => document.getElementById(id);
const clipButtons = [...document.querySelectorAll('[data-clip]')];
const recordings = [...document.querySelectorAll('[data-recording]')];
const notes = [
  'Watch a 3D character demonstrate a sign, then study the movement before trying it yourself.',
  'During practice, the camera captures hand positions. The assessment module tracks key points and returns a practice score.',
  'Choose the meaning of a sign. After scoring, the platform collects missed vocabulary for another round of practice.'
];
let selectedClip = 0;
function updatePlaybackLabel() {
  const video = recordings[selectedClip];
  byId('playClip').textContent = video.ended ? 'Replay clip' : !video.paused ? 'Pause clip' : video.currentTime > 0 ? 'Resume clip' : 'Play clip';
}
recordings.forEach(video => {
  for (const event of ['play','pause','ended','seeked']) video.addEventListener(event,updatePlaybackLabel);
});
clipButtons.forEach((button,index) => button.addEventListener('click',() => {
  if (selectedClip === index) return;
  recordings[selectedClip].pause();
  selectedClip = index;
  recordings.forEach((video,i) => video.hidden = i !== index);
  clipButtons.forEach((tab,i) => tab.setAttribute('aria-pressed',String(i === index)));
  byId('clipNote').textContent = notes[index];
  updatePlaybackLabel();
}));
byId('playClip').onclick = async () => {
  const video = recordings[selectedClip];
  if (!video.paused) { video.pause(); return; }
  try {
    await video.play();
  } catch (error) {
    if (error.name !== 'AbortError') byId('clipNote').textContent = 'This recording could not be played in this browser.';
  }
};

const captions={assessment:['Study design','Smart-pen data collection','Assessment results'],prediction:['System architecture','Class dashboard','Interactive charts','Misclassification analysis']};
document.querySelectorAll('[data-paper]').forEach(card=>{
  let number=Number(card.dataset.page);
  const name=card.dataset.paper,total=Number(card.dataset.total);
  const img=card.querySelector('img');
  const render=()=>{
    img.src='assets/'+name+'-'+number+'.jpg';
    img.alt=captions[name][number-1]+' from the '+name+' project PDF';
    card.querySelector('.paperNav span').textContent=number+' / '+total+' · '+captions[name][number-1];
    card.querySelectorAll('[data-page-step]').forEach(b=>b.disabled=number+Number(b.dataset.pageStep)<1 || number+Number(b.dataset.pageStep)>total);
  };
  card.querySelectorAll('[data-page-step]').forEach(b=>b.onclick=()=>{number+=Number(b.dataset.pageStep);render();});
  card.querySelector('.paperImage').onclick=()=>{const dialog=byId('zoomPaper');const zoom=dialog.querySelector('img');zoom.src=img.src;zoom.alt=img.alt;dialog.showModal();};
  render();
});
byId('dismissZoom').onclick=()=>byId('zoomPaper').close();
