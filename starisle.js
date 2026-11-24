const byId = id => document.getElementById(id);
// Starisle Routes workshop: OrderItems compound-key puzzle from the game source.
const fragments=['PRIMARY KEY (OID)','CREATE TABLE OrderItems (','PRIMARY KEY (OID, PID)',');','OID VARCHAR(12), PID VARCHAR(12),'];
const solution=[1,4,2,3];let built=[];
function drawBuild(){
  byId('pieces').replaceChildren(...fragments.map((f,i)=>{const b=document.createElement('button');b.textContent=f;b.disabled=built.includes(i);b.onclick=()=>{built.push(i);byId('buildNote').textContent='';drawBuild();};return b;}));
  byId('assembly').textContent=built.length?built.map(i=>fragments[i]).join('\n'):'Select SQL fragments in order.';
  byId('undoBuild').disabled=!built.length;byId('checkBuild').disabled=!built.length;
}
byId('checkBuild').onclick=()=>{byId('buildNote').textContent=built.join()===solution.join()?'Manifest complete. The pair (OID, PID) is unique, so an order can contain different products.':built.includes(0)?'A key on OID alone allows only one row per order. Which pair identifies an order line?':'Start with the table, declare both columns, add the key, then close the statement.';};
byId('undoBuild').onclick=()=>{built.pop();byId('buildNote').textContent='';drawBuild();};
byId('clearBuild').onclick=()=>{built=[];byId('buildNote').textContent='';drawBuild();};drawBuild();


const viewer=byId('zoomPaper');
document.querySelectorAll('.levelImage').forEach(button=>button.onclick=()=>{
  const original=button.querySelector('img'),image=viewer.querySelector('img');
  image.src=original.src;image.alt=original.alt;viewer.showModal();
});
byId('dismissZoom').onclick=()=>viewer.close();
