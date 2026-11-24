(() => {
  const byId=id=>document.getElementById(id);
  const stock={camera:3,mic:2};
  const names={camera:'Camera',mic:'Microphone'};
  let stage=0, before=3;
  function render(){
    const receiver=byId('objectReceiver').value, qty=Number(byId('objectQty').value);
    if(stage===0)before=stock[receiver];
    const valid=qty>=1 && qty<=before;
    const other=receiver==='camera'?'mic':'camera';
    const notes=[
      'Each object has its own available count. Predict the result of the call below.',
      '$this refers to $'+receiver+' for this call. The method reads its available count of '+before+'.',
      valid?'The request passes: '+qty+' is within the available stock of '+before+'. The count has not changed yet.':(qty<1?'A loan must request at least one item.':'The quantity exceeds this object’s stock.')+' The guard will return false.',
      (valid?'Returned true. '+names[receiver]+' stock changed from '+before+' to '+stock[receiver]+'.':'Returned false. '+names[receiver]+' stock stays at '+before+'.')+' '+names[other]+' stock stays at '+stock[other]+'.'
    ];
    byId('cameraCount').textContent=stock.camera;byId('micCount').textContent=stock.mic;
    byId('callLine').textContent='$'+receiver+'->borrow('+qty+')'+(stage===3?' → '+valid:'');
    document.querySelectorAll('[data-instance]').forEach(node=>node.classList.toggle('receiving',node.dataset.instance===receiver && stage>0));
    document.querySelectorAll('.callSteps li').forEach((li,i)=>i===stage?li.setAttribute('aria-current','step'):li.removeAttribute('aria-current'));
    byId('objectNote').textContent=notes[stage];
    byId('objectNext').textContent=['Trace the call →','Check the guard →','See the result →','Start another call'][stage];
  }
  byId('objectNext').onclick=()=>{
    if(stage===2){
      const r=byId('objectReceiver').value,q=Number(byId('objectQty').value);
      if(q>=1 && q<=stock[r])stock[r]-=q;
    }
    stage=(stage+1)%4;render();
  };
  for(const id of ['objectReceiver','objectQty'])byId(id).onchange=()=>{stage=0;render();};
  byId('objectReset').onclick=()=>{stock.camera=3;stock.mic=2;stage=0;render();};
  render();
})();
