const byId = id => document.getElementById(id);
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
