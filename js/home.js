const railLinks=[...document.querySelectorAll('.rail a')];
const sections=railLinks.map(link=>document.getElementById(link.hash.slice(1)));
let scheduled=false;
function highlightSection(){
  const active=sections.filter(section=>section.getBoundingClientRect().top<=window.innerHeight*.32).at(-1)||sections[0];
  const atEnd=window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-3;
  railLinks.forEach((link,index)=>{
    const current=sections[index]===(atEnd?sections.at(-1):active);
    if(current)link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  });
  scheduled=false;
}
function updateRail(){
  if(!scheduled){scheduled=true;requestAnimationFrame(highlightSection);}
}
window.addEventListener('scroll',updateRail,{passive:true});
window.addEventListener('resize',updateRail);
highlightSection();

