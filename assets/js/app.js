// assets/js/app.js
(function () {
  'use strict';

  /* -------------------- Utilities -------------------- */
  const supports = {
    gsap: typeof window.gsap !== 'undefined',
    AOS: typeof window.AOS !== 'undefined',
    Swiper: typeof window.Swiper !== 'undefined',
  };

  const safeQuery = (sel, root = document) => { try { return root.querySelector(sel); } catch { return null; } };
  const safeQueryAll = (sel, root = document) => { try { return Array.from(root.querySelectorAll(sel)); } catch { return []; } };

  /* -------------------- Helpers -------------------- */
  const setAlert = (el, type, message) => {
    if (!el) return;
    el.className = 'mt-4 form-feedback';
    el.innerHTML = `<div class="rounded-xl border p-3 ${type==='success'?'border-emerald-500/20 bg-emerald-500/8':'border-rose-500/20 bg-rose-500/8'}">${message}</div>`;
    clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(() => el.classList.remove('success','error'), 7000);
  };

  const splitLetters = (el) => {
    if (!el || el.dataset.split==='true') return [];
    el.dataset.split = 'true';
    const text = el.textContent.trim();
    el.textContent = '';
    const frag = document.createDocumentFragment();
    text.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'reveal-letter';
      span.textContent = ch===' ' ? '\u00A0' : ch;
      frag.appendChild(span);
    });
    el.appendChild(frag);
    return Array.from(el.querySelectorAll('.reveal-letter'));
  };

  const fetchWithTimeout = async (url, opts={}, ms=9000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try { const res = await fetch(url,{...opts, signal: controller.signal}); clearTimeout(id); return res; }
    catch(e){ clearTimeout(id); throw e; }
  };

  /* -------------------- Animations & UI -------------------- */
  const initAOS = () => supports.AOS && AOS.init({duration:700,once:true,offset:80});

  const initGSAPHero = () => {
    const h1 = safeQuery('h1'); if(!h1) return;
    const letters = splitLetters(h1);
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(supports.gsap && !prefersReduced && letters.length){
      try { gsap.fromTo(letters,{opacity:0,y:18,rotateX:14},{opacity:1,y:0,rotateX:0,ease:'expo.out',duration:0.9,stagger:0.03,delay:0.12}); } catch{letters.forEach(l=>l.style.opacity=1);}
    } else letters.forEach(l=>l.style.opacity=1);

    const art = safeQuery('.aspect-video');
    if(art && supports.gsap && !prefersReduced){ try{ gsap.to(art,{y:-8,repeat:-1,yoyo:true,ease:'sine.inOut',duration:6}); } catch{} }
  };

  const initSwiper = () => {
    if(!supports.Swiper) return;
    new Swiper('.mySwiper',{
      slidesPerView:1.1, spaceBetween:16, loop:true,
      breakpoints:{768:{slidesPerView:2.1},1024:{slidesPerView:3}},
      pagination:{el:'.swiper-pagination',clickable:true},
      navigation:{nextEl:'.swiper-button-next',prevEl:'.swiper-button-prev'},
      autoplay:{delay:3000,disableOnInteraction:false, pauseOnMouseEnter:true}
    });
  };

  const updateYear = () => { const el = safeQuery('#year'); if(el) el.textContent = new Date().getFullYear(); };

  /* -------------------- Project Cards & Modal -------------------- */
  const initProjectCards = () => {
    const modal = document.createElement('div');
    modal.id = 'projectModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:10000;visibility:hidden;';

    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'position:relative; max-width:80vw; max-height:80vh; display:flex; flex-direction:column; align-items:center;';

    const modalImg = document.createElement('img');
    modalImg.style.cssText = 'max-width:100%; max-height:100%; border-radius:10px;';

    const modalTitle = document.createElement('h3');
    modalTitle.style.color = 'white';
    modalTitle.style.marginTop = '10px';

    const modalDesc = document.createElement('p');
    modalDesc.style.color = 'white';
    modalDesc.style.marginTop = '5px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:white;
      border:none; border-radius:50%; width:32px; height:32px; font-size:20px; cursor:pointer;
    `;
    closeBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      modal.style.visibility = 'hidden';
    });

    modalContent.append(modalImg, modalTitle, modalDesc, closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    document.querySelectorAll('.project-card').forEach(card=>{
      const img = card.querySelector('img');
      const desc = card.dataset.desc;
      const p = card.querySelector('p');

      // Hover description
      img.addEventListener('mouseenter',()=>p.textContent=desc);
      img.addEventListener('mouseleave',()=>p.textContent='Cliquez sur l’image pour voir plus de détails');

      // Click modal
      card.addEventListener('click',()=>{
        modalImg.src = card.dataset.img;
        modalTitle.innerText = card.dataset.title;
        modalDesc.innerText = desc;
        modal.style.visibility='visible';
      });
    });

    // Close modal with ESC or click outside content
    modal.addEventListener('click', (e)=>{
      if(e.target === modal) modal.style.visibility='hidden';
    });
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') modal.style.visibility='hidden'; });
  };

  /* -------------------- Button Ripple -------------------- */
  const attachButtonRipple = () => {
    const buttons = safeQueryAll('button, a.btn-primary, a.btn-ghost');
    buttons.forEach(btn=>{
      if(!btn.classList.contains('ripple')) btn.classList.add('ripple');
      btn.addEventListener('click',()=>{
        btn.classList.remove('ripple--active');
        void btn.offsetWidth;
        btn.classList.add('ripple--active');
        setTimeout(()=>btn.classList.remove('ripple--active'),650);
      });
    });
  };

  /* -------------------- Tilt Cards -------------------- */
  const attachCardTilt = () => {
    const cards = safeQueryAll('.project-card, .skill-card');
    if(!cards.length) return;
    const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
    if(isTouch) return;
    cards.forEach(card=>{
      card.style.transformStyle='preserve-3d';
      let raf=null;
      const onMove = (e)=>{
        if(raf) return;
        raf=requestAnimationFrame(()=>{
          const rect=card.getBoundingClientRect();
          const cx=rect.left+rect.width/2;
          const cy=rect.top+rect.height/2;
          const clientX=e.touches?e.touches[0].clientX:e.clientX;
          const clientY=e.touches?e.touches[0].clientY:e.clientY;
          const dx=(clientX-cx)/(rect.width/2);
          const dy=(clientY-cy)/(rect.height/2);
          const tiltX=(dy*6).toFixed(2);
          const tiltY=(dx*-8).toFixed(2);
          card.style.transform=`perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(6px)`;
          raf=null;
        });
      };
      const onLeave=()=>{ card.style.transform=''; };
      card.addEventListener('mousemove',onMove);
      card.addEventListener('mouseleave',onLeave);
    });
  };

  /* -------------------- Contact Form -------------------- */
  const initContactForm = () => {
    const form = safeQuery('#contactForm') || safeQuery('form[action]') || safeQuery('form');
    if(!form) return;
    const alertBox = safeQuery('#formAlert') || (() => { const d=document.createElement('div'); form.parentElement.appendChild(d); d.id='formAlert'; return d; })();
    const sendBtn = safeQuery('#sendBtn', form) || form.querySelector('button[type="submit"]') || form.querySelector('button');
    const honeypot = safeQuery('#website', form) || form.querySelector('input[name="website"]');
    const setSending = (sending)=>{
      if(!sendBtn) return;
      sendBtn.disabled=sending;
      if(sending){ sendBtn.dataset.orig=sendBtn.innerHTML; sendBtn.innerHTML='<span class="btn-spinner" aria-hidden="true"></span> Envoi...'; sendBtn.classList.add('opacity-60'); }
      else{ if(sendBtn.dataset.orig) sendBtn.innerHTML=sendBtn.dataset.orig; sendBtn.classList.remove('opacity-60'); }
    };
    const validate = (values)=>{
      if(!values.name || values.name.trim().length<2) return 'Votre nom doit contenir au moins 2 caractères.';
      if(!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Veuillez fournir un email valide.';
      if(!values.subject || values.subject.trim().length<3) return 'Sujet trop court.';
      if(!values.message || values.message.trim().length<10) return 'Message trop court.';
      return null;
    };
    form.addEventListener('submit', async (ev)=>{
      ev.preventDefault();
      if(honeypot && honeypot.value.trim()!=='') return;
      const data=Object.fromEntries(new FormData(form).entries());
      const error=validate(data);
      if(error){ setAlert(alertBox,'error',error); return; }
      setSending(true);
      let action=form.getAttribute('action')||'api/contact.php';
      const method=(form.getAttribute('method')||'POST').toUpperCase();
      try{
        const res=await fetchWithTimeout(action,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)},9000);
        let json=null; try{ json=await res.json(); } catch{} 
        if(!res.ok) throw new Error((json&&json.error)?json.error:`Erreur serveur (${res.status})`);
        if(json && json.success===false) throw new Error(json.error||'Envoi impossible');
        form.reset(); setAlert(alertBox,'success','Merci ! Votre message a bien été envoyé. Je vous répondrai bientôt.');
      } catch(err){ console.warn('Contact send failed:',err); setAlert(alertBox,'error',err.message||"Impossible d'envoyer le message. Réessayez plus tard."); }
      finally{ setSending(false); }
    });
  };

  /* -------------------- Hero Bio -------------------- */
  const initHeroBio = () => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    let bio = safeQuery('p.hero-bio') || safeQueryAll('p').find(p=>/je m'?appelle/i.test(p.textContent.trim()));
    if(!bio) return;
    bio.classList.add('hero-bio');
    const bolds = safeQueryAll('b',bio);
    if(!bolds.length) return;
    let live = bio.querySelector('.hero-bio-live');
    if(!live){ live=document.createElement('span'); live.className='hero-bio-live'; live.setAttribute('aria-live','polite'); live.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;left:-9999px;'; bio.appendChild(live);}
    let idx=0,DURATION=2200,rafId=null,start=null,paused=false;
    const highlight=(i)=>{ bolds.forEach((b,j)=>{ if(j===i){ b.classList.add('bio-active'); b.setAttribute('aria-hidden','false'); live.textContent=b.textContent;} else {b.classList.remove('bio-active'); b.setAttribute('aria-hidden','true');} }); };
    const step=(ts)=>{ if(!start) start=ts; const elapsed=ts-start; if(elapsed>=DURATION){ idx=(idx+1)%bolds.length; highlight(idx); start=ts;} rafId=requestAnimationFrame(step); };
    highlight(idx); rafId=requestAnimationFrame(step);
    const pause=()=>{ if(paused) return; paused=true; if(rafId){ cancelAnimationFrame(rafId); rafId=null; } };
    const resume=()=>{ if(!paused) return; paused=false; start=null; rafId=requestAnimationFrame(step); };
    bio.addEventListener('mouseenter',pause); bio.addEventListener('mouseleave',resume); bio.addEventListener('focusin',pause); bio.addEventListener('focusout',resume);
    if(supports.gsap) try{ gsap.to(bio,{y:-6,repeat:-1,yoyo:true,ease:'sine.inOut',duration:5}); } catch{}
  };

  /* -------------------- Initialize All -------------------- */
  const initAll = () => {
    initAOS(); initGSAPHero(); initSwiper(); updateYear();
    initProjectCards(); attachButtonRipple(); attachCardTilt();
    initContactForm(); initHeroBio();
  };

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',initAll); } 
  else { initAll(); }

  /* Export for debugging */
  window.__berzahka = { initAll, splitLetters, fetchWithTimeout };

})();
