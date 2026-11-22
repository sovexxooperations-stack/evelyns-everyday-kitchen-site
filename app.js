function track(name){try{const counts=JSON.parse(localStorage.getItem('ek_local_counts')||'{}');counts[name]=(counts[name]||0)+1;localStorage.setItem('ek_local_counts',JSON.stringify(counts));}catch{}}
track('page_'+location.pathname);
document.querySelectorAll('[data-track]').forEach(el=>el.addEventListener('click',()=>track(el.dataset.track)));
const imageModal=document.querySelector('#image-modal');
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{imageModal.querySelector('img').src=button.dataset.preview;imageModal.querySelector('img').alt=button.dataset.caption;imageModal.querySelector('img').classList.toggle('food-preview',button.classList.contains('recipe-zoom'));imageModal.querySelector('p').textContent=button.dataset.caption;imageModal.showModal();track(button.classList.contains('recipe-zoom')?'open_recipe_image':'open_sample_image');}));
document.querySelectorAll('[data-checkout-pending]').forEach(button=>button.addEventListener('click',()=>document.querySelector('#checkout-pending').showModal()));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.modal-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});});
const sticky=document.querySelector('.sticky-buy'),hero=document.querySelector('.product-hero,.hero');
if(sticky&&hero){let heroVisible=true,finalVisible=false;function update(){sticky.classList.toggle('is-visible',(matchMedia('(max-width:720px)').matches||!heroVisible)&&!finalVisible);}const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.target===hero)heroVisible=e.isIntersecting;else finalVisible=e.isIntersecting;});update();});observer.observe(hero);observer.observe(document.querySelector('.final-cta'));addEventListener('resize',update);update();}

// Recipe browsing and actual-page previews share a keyboard-accessible tab pattern.
document.querySelectorAll('.browse-tabs').forEach(list=>{
  const tabs=[...list.querySelectorAll('[role="tab"]')];
  function select(tab,focus=false){
    tabs.forEach(item=>{
      const active=item===tab;
      item.setAttribute('aria-selected',String(active));
      item.tabIndex=active?0:-1;
      const panel=document.getElementById(item.getAttribute('aria-controls'));
      if(panel)panel.hidden=!active;
    });
    if(focus)tab.focus();
    track('browse_'+tab.getAttribute('aria-controls'));
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();select(tabs[next],true);
    });
  });
});

