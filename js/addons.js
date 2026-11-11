
/* ================= NOMERA v1.1 ADDONS: барабан, уведомления, профиль, VIP, промокоды, админ-панель ================= */
;(function(){
const XK='nomera-x';
const hsh=(str,seed=7)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return(4294967296*(2097151&h2)+(h1>>>0)).toString(36)};
const ADMIN_H='10lhi10e2s9';
let X={};try{X=JSON.parse(localStorage.getItem(XK)||'{}')||{}}catch(e){X={}}
X.profile=Object.assign({nick:'Мастер',garage:'Номерной дом',bio:'',ava:'🧑‍🔧',plate:{l1:'Н',d:'001',l2:'М',l3:'Р',r:'77'},frame:'',created:Date.now()},X.profile||{});
X.vip=X.vip||{tier:0,until:0};X.used=X.used||{};X.codes=X.codes||[];X.off=X.off||{};X.uses=X.uses||{};X.log=X.log||[];
const xsave=()=>{try{localStorage.setItem(XK,JSON.stringify(X))}catch(e){}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const F=n=>{try{return fmt(Math.round(n))}catch(e){return String(Math.round(n))}};
const toast=t=>{try{window.nmToast&&window.nmToast(t)}catch(e){}};
const dk=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const persist=()=>{xsave();try{save(true)}catch(e){}try{draw()}catch(e){}refresh()};
function tab(t){const bs=[...document.querySelectorAll('.sb[data-t="'+t+'"]')];const b=bs.find(x=>x.offsetParent)||bs[0];if(b)b.click();closeNP();closeModal()}

/* ---------- БАРАБАН ПРОКРУТКИ ---------- */
function tick(i){let A=null;try{A=ac()}catch(e){}if(!A)return;try{const o=A.createOscillator(),g=A.createGain(),t=A.currentTime;o.type='triangle';o.frequency.value=640+i*55;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.045,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+.07);o.connect(g).connect(A.destination);o.start(t);o.stop(t+.08)}catch(e){}}
spin=function(p,dur){
 const fin=[p.l1,...p.d,p.l2,p.l3,String(p.r)],kind=['L','D','D','D','L','L','R'];
 const cs=[...pl.querySelectorAll('.c')];
 const rm=matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.dataset.interfaceMotion==='off';
 const base=dur>=550?Math.round(dur*1.6):dur,loud=dur>=550;
 return Promise.all(cs.map((el,i)=>new Promise(res=>{
  const st=el.querySelector('.st')||el.firstElementChild;if(!st){res();return}
  const k=kind[i]||'D',g=()=>k==='L'?rnd(LET):k==='D'?String(Math.floor(Math.random()*10)):String(rnd(REG));
  const N=rm?1:Math.max(6,Math.round(base/85))+i*2,t=rm?140:Math.round(base*(.55+.45*i/Math.max(1,cs.length-1)));
  let h='<span>'+(st.textContent||g())+'</span>';for(let j=1;j<N;j++)h+='<span>'+g()+'</span>';h+='<span>'+fin[i]+'</span><span>'+g()+'</span>';
  st.style.transition='none';st.style.transform='none';st.innerHTML=h;el.classList.remove('land');el.classList.add('reel');
  let doneF=0;const end=()=>{if(doneF)return;doneF=1;st.innerHTML='<span>'+fin[i]+'</span>';st.style.transform='none';el.classList.remove('reel');void el.offsetWidth;el.classList.add('land');if(loud)tick(i);res()};
  if(!st.animate){setTimeout(end,t);return}
  const lh=(st.firstElementChild&&st.firstElementChild.getBoundingClientRect().height)||0;
  const shift=lh?(N*lh)+'px':(N*1.1)+'em';
  const a=st.animate([{transform:'translateY(0)'},{transform:'translateY(-'+shift+')'}],{duration:t,easing:'cubic-bezier(.15,.7,.22,1.05)',fill:'forwards'});
  a.onfinish=()=>{end();a.cancel()};setTimeout(end,t+400);
 })));
};

/* ---------- VIP ---------- */
const VIP=[null,
 {n:'Бронза',i:'🥉',c:'#e09a5b',p:60000,sell:1.10,roll:.95,slots:1,auto:1,mat:1,xp:1.1,daily:2500,frame:'bronze'},
 {n:'Серебро',i:'🥈',c:'#cfd8e8',p:250000,sell:1.20,roll:.90,slots:2,auto:.88,mat:.9,xp:1.25,daily:8000,frame:'silver'},
 {n:'Золото',i:'🥇',c:'#ffc94a',p:900000,sell:1.35,roll:.85,slots:4,auto:.78,mat:.8,xp:1.5,daily:20000,frame:'gold'},
 {n:'Платина',i:'💎',c:'#9fe8ff',p:3000000,sell:1.50,roll:.80,slots:6,auto:.68,mat:.7,xp:2,daily:50000,frame:'plat'}];
const NOV={sell:1,roll:1,slots:0,auto:1,mat:1,xp:1,daily:0};
const DUR=[[1,.25,'1 день'],[7,1,'7 дней'],[30,3.2,'30 дней']];
const vt=()=>X.vip.tier&&X.vip.until>Date.now()?X.vip.tier:0;
const vv=()=>VIP[vt()]||NOV;
window.NMV={sell:()=>vv().sell,roll:()=>vv().roll,slots:()=>vv().slots,auto:()=>vv().auto,mat:()=>vv().mat,tier:vt};
const left=ms=>{ms=Math.max(0,ms);const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4);return d?d+' д '+h+' ч':h?h+' ч '+m+' мин':m+' мин'};
function vipGrant(t,days){const now=Date.now(),c=vt();
 if(c===t)X.vip.until+=days*864e5;
 else{let bonus=0;if(c&&c<t)bonus=(X.vip.until-now)*VIP[c].p/VIP[t].p;X.vip={tier:t,until:now+days*864e5+bonus}}
 xsave()}
const perks=v=>[`+${Math.round((v.sell-1)*100)}% к цене продажи`,`−${Math.round((1-v.roll)*100)}% к стоимости прокрутки`,`+${v.slots} мест. на складе`,v.auto<1?`Автокрутка быстрее на ${Math.round((1/v.auto-1)*100)}%`:null,v.mat<1?`−${Math.round((1-v.mat)*100)}% на материалы`:null,`×${v.xp} опыт компании`,`VIP-бонус ${F(v.daily)} ₽ каждый день`,`Рамка номера «${v.n}» и VIP-аватары`].filter(Boolean);
if(typeof bizTrack==='function'){const _bt=bizTrack;bizTrack=function(){const b=(S.biz&&S.biz.xp)||0;const r=_bt.apply(this,arguments);const m=vv().xp;if(m>1&&S.biz)S.biz.xp+=Math.round(((S.biz.xp||0)-b)*(m-1));return r}}
function claimVip(){if(!vt()){toast('VIP не активен');return}if(X.vd===dk()){toast('VIP-бонус уже получен сегодня');return}const v=vv();S.money+=v.daily;S.earned=(S.earned||0)+v.daily;X.vd=dk();persist();toast('👑 VIP-бонус: +'+F(v.daily)+' ₽')}

/* ---------- ПРОМОКОДЫ ---------- */
const BUILTIN=[
 {code:'START2026',money:25000,note:'Стартовый капитал'},
 {code:'СТАРТ2026',money:25000,note:'Стартовый капитал (кириллица)',same:'START2026'},
 {code:'ГАРАЖ',mat:5,note:'Набор материалов ×5'},
 {code:'VIPTEST',vip:2,days:3,note:'VIP «Серебро» на 3 дня'}];
const norm=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,'');
const allCodes=()=>[...BUILTIN.map(x=>Object.assign({bi:1},x)),...X.codes];
function rdesc(p){const a=[];if(p.money)a.push('+'+F(p.money)+' ₽');if(p.vip&&VIP[p.vip])a.push('VIP «'+VIP[p.vip].n+'» на '+(p.days||1)+' дн.');if(p.mat)a.push('материалы +'+p.mat);if(p.xp)a.push('+'+F(p.xp)+' XP компании');if(p.wxp)a.push('+'+F(p.wxp)+' XP мастерской');return a.join(', ')||'без награды'}
function redeem(raw){const c=norm(raw);if(!c)return[0,'Введите промокод'];
 if(hsh(c)===(X.adminH||ADMIN_H)){X.admin=true;xsave();refresh();setTimeout(openAdmin,60);return[1,'🛠 Режим администратора включён']}
 const p=allCodes().find(x=>norm(x.code)===c);
 if(!p||X.off[p.code]||p.off)return[0,'Такого промокода нет или он отключён'];
 const id=p.same||p.code;
 if(p.until&&Date.now()>p.until)return[0,'Срок действия промокода истёк'];
 if(p.max&&(X.uses[id]||0)>=p.max)return[0,'Лимит активаций исчерпан'];
 if(X.used[id])return[0,'Вы уже активировали этот промокод'];
 if(p.money){S.money+=p.money}
 if(p.vip&&VIP[p.vip])vipGrant(+p.vip,+p.days||1);
 if(p.mat){const m=W().mat;for(const k in m)m[k]=(m[k]||0)+(k==='paintP'?Math.ceil(p.mat/2):p.mat)}
 if(p.xp){ensureBiz();S.biz.xp=(S.biz.xp||0)+p.xp}
 if(p.wxp){W().xp=(W().xp||0)+p.wxp}
 X.used[id]=Date.now();X.uses[id]=(X.uses[id]||0)+1;persist();
 return[1,'Промокод активирован: '+rdesc(p)]}
const promoHTML=()=>`<form class="nm-promo" data-nm-promo><input class="nm-in" name="code" maxlength="32" placeholder="Введите промокод" autocomplete="off" spellcheck="false"><button class="nm-btn pri" type="submit">Активировать</button></form><div class="nm-muted" data-nm-promo-msg style="margin-top:8px;min-height:1.3em"></div>`;
document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('[data-nm-promo]');if(!f)return;e.preventDefault();const[ok,msg]=redeem(f.code.value);const m=f.parentNode.querySelector('[data-nm-promo-msg]');if(m){m.textContent=msg;m.style.color=ok?'#7ff0a8':'#ff9fae'}if(ok){f.code.value='';toast(msg)}},true);

/* ---------- МОДАЛКИ ---------- */
let cur=null;
function closeModal(){if(!cur)return;const o=cur;cur=null;o.classList.remove('in');setTimeout(()=>o.remove(),230)}
function modal(title,body,cls){if(cur){cur.remove();cur=null}const ov=document.createElement('div');ov.className='nm-ov';ov.innerHTML=`<div class="nm-md ${cls||''}" role="dialog" aria-modal="true"><div class="nm-mh"><h2>${title}</h2><button type="button" class="nm-x" aria-label="Закрыть">×</button></div><div class="nm-mb">${body}</div></div>`;document.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('in')));ov.addEventListener('click',e=>{if(e.target===ov||e.target.closest('.nm-x'))closeModal()});cur=ov;return ov.querySelector('.nm-mb')}
function tabsInit(root){root.querySelectorAll('.nm-tabs button').forEach(b=>b.onclick=()=>{root.querySelectorAll('.nm-tabs button').forEach(x=>x.classList.toggle('on',x===b));root.querySelectorAll('.nm-pane').forEach(p=>p.classList.toggle('on',p.dataset.p===b.dataset.p));root.dataset.cur=b.dataset.p})}

/* ---------- ПРОФИЛЬ ---------- */
const AVAS=['🧑‍🔧','👨‍🔧','👩‍🔧','🚗','🏎️','🚙','🛻','🚕','🚓','🏍️','🔧','🛠️','🏁','🦊','🐻','🐯','😎','🤠'];
const VAVAS=[['👑',1],['🚀',2],['🦅',2],['🏆',3],['💎',3],['🐉',4]];
const FRAMES=[['','Без рамки',0],['bronze','Бронза',1],['silver','Серебро',2],['gold','Золото',3],['plat','Платина',4]];
const LAT={A:'А',B:'В',E:'Е',K:'К',M:'М',H:'Н',O:'О',P:'Р',C:'С',T:'Т',Y:'У',X:'Х'};
const fixL=s=>{s=String(s||'').toUpperCase().slice(-1);s=LAT[s]||s;return LET.includes(s)?s:''};
const frameOk=f=>{const x=FRAMES.find(y=>y[0]===f);return x&&vt()>=x[2]};
const avaOk=a=>{const v=VAVAS.find(y=>y[0]===a);return !v||vt()>=v[1]};
function plateHTML(p,fr){let h='';try{h=inner({l1:p.l1,d:p.d,l2:p.l2,l3:p.l3,r:+p.r||p.r})}catch(e){h=esc(p.l1+p.d+p.l2+p.l3+' '+p.r)}return `<span class="pl nm-pf w4 ${fr&&frameOk(fr)?'fr-'+fr:''}">${h}</span>`}
function vipBadge(){const t=vt();return t?`<span class="nm-vipb" style="--vipc:${VIP[t].c}">${VIP[t].i} VIP ${VIP[t].n}</span>`:''}
function licHTML(P){const t=vt(),id=(document.getElementById('local-id')||{}).textContent||'';return `<div class="nm-lic"><div class="lid">${esc(id?('ID '+id):'')}</div><div class="face" ${t?`data-vip style="--vipc:${VIP[t].c}"`:''}>${esc(avaOk(P.ava)?P.ava:AVAS[0])}</div><div><div class="doc">Карточка мастера</div><div class="nick">${esc(P.nick||'Мастер')}</div><div class="gar">🏢 ${esc(P.garage||'')}</div>${P.bio?`<div class="bio">«${esc(P.bio)}»</div>`:''}<div class="plt">${plateHTML(P.plate,P.frame)}${vipBadge()}</div></div></div>`}
function statsHTML(){let lv=1;try{lv=bizLevel().lv}catch(e){}const w=W();const ach=Object.keys(S.ach||{}).length;const days=Math.max(1,Math.ceil((Date.now()-X.profile.created)/864e5));
 const it=[[F(S.earned||0)+' ₽','Заработано всего'],[F(S.rolls||0),'Прокручено номеров'],[F((S.biz&&S.biz.deals)||0),'Сделок'],[F(S.restored||0),'Восстановлено'],[F(w.jobs||0),'Работ в мастерской'],[lv,'Уровень компании'],[ach+' / '+ACH.length,'Достижения'],[days+' дн.','В игре']];
 return '<div class="nm-stats">'+it.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')+'</div>'}
function openProfile(){closeNP();const P=JSON.parse(JSON.stringify(X.profile));const t=vt();
 const body=`<div data-lic>${licHTML(P)}</div>${statsHTML()}
 <div class="nm-sec"><h3>✏️ Редактирование</h3>
  <div class="nm-row"><label><span class="nm-lbl">Никнейм</span><input class="nm-in" data-f="nick" maxlength="18" value="${esc(P.nick)}"></label><label><span class="nm-lbl">Название компании</span><input class="nm-in" data-f="garage" maxlength="24" value="${esc(P.garage)}"></label></div>
  <label style="display:block;margin-bottom:12px"><span class="nm-lbl">Девиз</span><input class="nm-in" data-f="bio" maxlength="60" placeholder="Например: Только чистые номера" value="${esc(P.bio)}"></label>
  <span class="nm-lbl">Аватар</span><div class="nm-avas" style="margin-bottom:14px">${AVAS.map(a=>`<button type="button" data-ava="${a}" class="${a===P.ava?'on':''}">${a}</button>`).join('')}${VAVAS.map(([a,lv])=>`<button type="button" data-ava="${a}" class="${a===P.ava?'on':''}" ${t>=lv?'':'disabled'} title="VIP ${VIP[lv].n}+">${a}</button>`).join('')}</div>
  <span class="nm-lbl">Именной номер (буквы: ${LET.split('').join(' ')})</span>
  <div class="nm-plin" style="margin-bottom:6px"><input class="nm-in" data-p="l1" maxlength="1" value="${esc(P.plate.l1)}"><input class="nm-in d3" data-p="d" maxlength="3" inputmode="numeric" value="${esc(P.plate.d)}"><input class="nm-in" data-p="l2" maxlength="1" value="${esc(P.plate.l2)}"><input class="nm-in" data-p="l3" maxlength="1" value="${esc(P.plate.l3)}"><input class="nm-in rg" data-p="r" maxlength="3" inputmode="numeric" value="${esc(P.plate.r)}"></div>
  <div class="nm-muted" data-perr style="min-height:1.3em;margin-bottom:10px"></div>
  <span class="nm-lbl">Рамка номера</span><div class="nm-frames" style="margin-bottom:16px">${FRAMES.map(([f,n,lv])=>`<button type="button" data-fr="${f}" class="${f===P.frame?'on':''}" ${t>=lv?'':'disabled'}>${lv?'👑 ':''}${n}</button>`).join('')}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="nm-btn pri" data-save>Сохранить профиль</button><button type="button" class="nm-btn gold" data-vip>👑 VIP-привилегии</button>${X.admin?'<button type="button" class="nm-btn" data-adm>🛠 Админ-панель</button>':''}</div></div>
 <div class="nm-sec"><h3>🎟 Промокод</h3>${promoHTML()}</div>`;
 const m=modal('👤 Профиль мастера',body);
 const re=()=>{m.querySelector('[data-lic]').innerHTML=licHTML(P)};
 const perr=m.querySelector('[data-perr]');
 const valid=()=>{const p=P.plate;if(!p.l1||!p.l2||!p.l3)return'Нужны 3 буквы из списка';if(!/^\d{3}$/.test(p.d)||p.d==='000')return'Цифры: три цифры, не 000';if(!/^\d{2,3}$/.test(p.r))return'Регион: 2–3 цифры';return''};
 m.querySelectorAll('[data-f]').forEach(i=>i.oninput=()=>{P[i.dataset.f]=i.value.trim();re()});
 m.querySelectorAll('[data-p]').forEach(i=>i.oninput=()=>{const k=i.dataset.p;if(k==='d'||k==='r')i.value=i.value.replace(/\D/g,'');else i.value=fixL(i.value);P.plate[k]=i.value;perr.textContent=valid();perr.style.color='#ff9fae';re()});
 m.querySelectorAll('[data-ava]').forEach(b=>b.onclick=()=>{P.ava=b.dataset.ava;m.querySelectorAll('[data-ava]').forEach(x=>x.classList.toggle('on',x===b));re()});
 m.querySelectorAll('[data-fr]').forEach(b=>b.onclick=()=>{P.frame=b.dataset.fr;m.querySelectorAll('[data-fr]').forEach(x=>x.classList.toggle('on',x===b));re()});
 m.querySelector('[data-save]').onclick=()=>{const er=valid();if(er){perr.textContent=er;perr.style.color='#ff9fae';return}if(!P.nick){P.nick='Мастер'}X.profile=P;xsave();refresh();toast('Профиль сохранён');closeModal()};
 m.querySelector('[data-vip]').onclick=openVip;const ad=m.querySelector('[data-adm]');if(ad)ad.onclick=openAdmin}

/* ---------- VIP-ОКНО ---------- */
function openVip(){closeNP();const t=vt(),n=Date.now();
 const hero=t?`<div class="nm-vip-hero"><div class="crown">${VIP[t].i}</div><div style="flex:1;min-width:200px"><b style="color:${VIP[t].c}">VIP «${VIP[t].n}» активен</b><div class="nm-muted">Осталось: ${left(X.vip.until-n)}. Все бонусы уже работают.</div></div><button class="nm-btn gold" data-claim ${X.vd===dk()?'disabled':''}>${X.vd===dk()?'Бонус получен':'Забрать +'+F(VIP[t].daily)+' ₽'}</button></div>`
  :`<div class="nm-vip-hero"><div class="crown">👑</div><div style="flex:1;min-width:200px"><b>VIP-статус гаража</b><div class="nm-muted">Покупается за игровые рубли или выдаётся промокодом. Бонусы включаются сразу после покупки.</div></div></div>`;
 const cards=VIP.slice(1).map((v,ix)=>{const id=ix+1;return `<div class="nm-tier ${t===id?'cur':''}" style="--tc:${v.c}"><h4>${v.i} ${v.n}${t===id?' <span class="nm-tag ok">активен</span>':''}</h4><ul>${perks(v).map(x=>`<li>${x}</li>`).join('')}</ul><div class="pr">от ${F(v.p*DUR[0][1])} ₽</div><div class="dur">${DUR.map(([d,k,l])=>{const pr=Math.round(v.p*k);const lock=t>id;return `<button class="nm-btn sm" data-buy="${id}:${d}" ${S.money<pr||lock?'disabled':''} title="${F(pr)} ₽">${l}<br>${F(pr)} ₽</button>`}).join('')}</div></div>`}).join('');
 const m=modal('👑 VIP-привилегии',hero+'<div class="nm-tiers">'+cards+'</div><div class="nm-sec"><h3>🎟 Есть промокод?</h3>'+promoHTML()+'</div><div class="nm-muted">При переходе на уровень выше оставшиеся дни пересчитываются по цене и не пропадают. Покупка того же уровня продлевает срок.</div>','wide');
 const c=m.querySelector('[data-claim]');if(c)c.onclick=()=>{claimVip();openVip()};
 m.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const[id,d]=b.dataset.buy.split(':').map(Number);const k=DUR.find(x=>x[0]===d)[1];const pr=Math.round(VIP[id].p*k);if(S.money<pr){toast('Не хватает денег');return}S.money-=pr;vipGrant(id,d);persist();toast(VIP[id].i+' VIP «'+VIP[id].n+'» активирован');openVip()})}

/* ---------- УВЕДОМЛЕНИЯ ---------- */
const _nt=window.nmToast;if(_nt){window.nmToast=function(t){try{X.log.unshift({t:String(t).slice(0,160),at:Date.now()});X.log.length=Math.min(X.log.length,30);xsave()}catch(e){}return _nt.apply(this,arguments)}}
function items(){const n=Date.now(),a=[];
 try{const o=S.ord.slice(0,oSlots()).filter(x=>oCand(x)>=0).length;if(o)a.push({ic:'📋',t:'Можно сдать заказы: '+o,s:'На складе есть подходящие номера',go:()=>tab('t1'),c:1})}catch(e){}
 try{const r=((S.biz&&S.biz.showcase)||[]).filter(x=>n>=x.readyAt).length;if(r)a.push({ic:'🏪',t:'Витрина: готово к оплате '+r,s:'Заберите деньги в разделе «Бизнес»',go:()=>tab('t5'),c:1})}catch(e){}
 try{const I=dailyInfo();if(I&&I.can)a.push({ic:'🎁',t:'Ежедневный бонус доступен',s:'Нажмите, чтобы забрать',go:()=>{const d=document.getElementById('daily');if(d)d.click();renderNP()},c:1})}catch(e){}
 if(vt()&&X.vd!==dk())a.push({ic:'👑',t:'VIP-бонус дня',s:'+'+F(vv().daily)+' ₽ — нажмите, чтобы забрать',go:()=>{claimVip();renderNP()},c:1});
 try{const ac2=ACH.filter(x=>!(S.ach||{})[x.id]&&(x.v()||0)>=x.g);if(ac2.length)a.push({ic:'🏆',t:'Награды за достижения: '+ac2.length,s:ac2.slice(0,2).map(x=>x.n).join(', '),go:()=>tab('t4'),c:1})}catch(e){}
 try{if(S.ev){const e=EVS.find(x=>x.id==S.ev.id);if(e)a.push({ic:e.m>1?'📈':'📉',t:e.t+' ×'+e.m,s:'Событие рынка · ещё '+Math.max(0,Math.round((S.ev.until-n)/1000))+' с',go:()=>tab('t1')})}}catch(e){}
 if(vt()&&X.vip.until-n<864e5)a.push({ic:'⏳',t:'VIP скоро закончится',s:'Осталось '+left(X.vip.until-n),go:openVip});
 return a}
let np=null,npItems=[];
function renderNP(){if(!np)return;npItems=items();const ago=ms=>{const s=Math.round(ms/1000);return s<60?'только что':s<3600?Math.round(s/60)+' мин назад':Math.round(s/3600)+' ч назад'};
 let h=npItems.length?'<div class="nm-np-sep">Требует внимания</div>'+npItems.map((x,i)=>`<div class="nm-ni act" data-i="${i}" role="button" tabindex="0"><div class="ic">${x.ic}</div><div class="tx"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></div><div class="go">›</div></div>`).join(''):'<div class="nm-np-empty">✨ Всё сделано — новых дел нет</div>';
 if(X.log.length)h+='<div class="nm-np-sep">Недавние события</div>'+X.log.slice(0,12).map(x=>`<div class="nm-ni"><div class="ic">🔔</div><div class="tx"><b style="font-weight:600">${esc(x.t)}</b><small>${ago(Date.now()-x.at)}</small></div></div>`).join('');
 np.querySelector('.nm-np-b').innerHTML=h;np.querySelectorAll('[data-i]').forEach(el=>el.onclick=()=>{const it=npItems[+el.dataset.i];if(it&&it.go)it.go()})}
function posNP(){if(!np)return;const b=document.getElementById('bell');if(!b)return;const r=b.getBoundingClientRect();np.style.top=Math.round(r.bottom+10)+'px';np.style.right=Math.max(10,Math.round(innerWidth-r.right))+'px'}
function openNP(){if(np)return;np=document.createElement('div');np.className='nm-np';np.setAttribute('role','dialog');np.innerHTML='<div class="nm-np-h"><b>🔔 Уведомления</b><button type="button" class="nm-btn sm" data-clr>Очистить</button></div><div class="nm-np-b"></div>';document.body.appendChild(np);posNP();renderNP();markSeen();badge();np.querySelector('[data-clr]').onclick=()=>{X.log=[];markSeen();xsave();renderNP();badge()};requestAnimationFrame(()=>np&&np.classList.add('in'));const b=document.getElementById('bell');if(b){b.classList.add('nm-open');b.setAttribute('aria-expanded','true')}}
function closeNP(){if(!np)return;const o=np;np=null;o.classList.remove('in');setTimeout(()=>o.remove(),200);const b=document.getElementById('bell');if(b){b.classList.remove('nm-open');b.setAttribute('aria-expanded','false')}}
addEventListener('resize',posNP);
document.addEventListener('pointerdown',e=>{if(np&&!np.contains(e.target)&&!(e.target.closest&&e.target.closest('#bell')))closeNP()},true);
function nKey(x){return dk()+'|'+x.ic+'|'+x.t}
function markSeen(){try{const t=Date.now(),s=X.seen||(X.seen={});let ch=0;items().forEach(x=>{if(x.c&&!s[nKey(x)]){s[nKey(x)]=t;ch=1}});for(const k in s)if(t-s[k]>3*864e5){delete s[k];ch=1}if(ch)xsave()}catch(e){}}
function badge(){const b=document.getElementById('belln');if(!b)return;let n=0;try{if(np)markSeen();const s=X.seen||{};n=items().filter(x=>x.c&&!s[nKey(x)]).length}catch(e){}if(typeof settingsPrefs!=='undefined'&&settingsPrefs&&settingsPrefs.notifications===false)n=0;const s=n?(n>9?'9+':String(n)):'';if(b.textContent!==s)b.textContent=s;b.dataset.o='';if(np)renderNP()}
if(typeof ui==='function'){const _ui=ui;ui=function(){const r=_ui.apply(this,arguments);try{badge()}catch(e){}return r}}

/* ---------- АДМИН-ПАНЕЛЬ ---------- */
const num=(v,d=0)=>{const x=Number(String(v).replace(/\s/g,'').replace(',','.'));return isFinite(x)?x:d};
const TN={rust:'Щётка',hammer:'Молоток',polish:'Полировка',paint:'Кисть'};
function openAdmin(){closeNP();if(!X.admin){toast('Админ-панель открывается по служебному промокоду');return}const keep=cur&&cur.querySelector('.nm-mb')&&cur.querySelector('.nm-mb').dataset.cur;
 const w=W();let lv={lv:1,xp:0};try{lv=bizLevel()}catch(e){}
 const ups=U.map(u=>`<label><span class="nm-lbl">${u.i||''} ${esc(u.n)} (0–${u.max})</span><input class="nm-in" data-lv="${u.id}" type="number" min="0" max="${u.max}" value="${S.lv[u.id]|0}"></label>`).join('');
 const tools=WORDER.map(k=>`<label><span class="nm-lbl">${TN[k]||k} (0–7)</span><input class="nm-in" data-tl="${k}" type="number" min="0" max="7" value="${TL(k)}"></label>`).join('');
 const mats=Object.keys(w.mat).map(k=>`<label><span class="nm-lbl">${esc((MAT[k]&&MAT[k].n)||k)}</span><input class="nm-in" data-mat="${k}" type="number" min="0" value="${w.mat[k]|0}"></label>`).join('');
 const codes=allCodes().map(p=>{const id=p.same||p.code,off=X.off[p.code]||p.off,exp=p.until&&Date.now()>p.until;return `<tr><td><b>${esc(p.code)}</b>${p.bi?' <span class="nm-tag">встроенный</span>':''}<div class="nm-muted">${esc(p.note||'')}</div></td><td>${esc(rdesc(p))}</td><td>${X.uses[id]||0}${p.max?' / '+p.max:''}</td><td>${p.until?new Date(p.until).toLocaleDateString('ru-RU'):'—'}</td><td>${off?'<span class="nm-tag off">выкл</span>':exp?'<span class="nm-tag off">истёк</span>':'<span class="nm-tag ok">активен</span>'}${X.used[id]?' <span class="nm-tag">использован здесь</span>':''}</td><td style="white-space:nowrap"><button class="nm-btn sm" data-ctog="${esc(p.code)}">${off?'Вкл':'Выкл'}</button> <button class="nm-btn sm" data-creset="${esc(id)}" title="Сбросить активацию на этом устройстве">↺</button>${p.bi?'':` <button class="nm-btn sm red" data-cdel="${esc(p.code)}">✕</button>`}</td></tr>`}).join('');
 const t=vt();
 const body=`<div class="nm-muted" style="margin-bottom:14px">⚠️ Панель работает в браузере и меняет только локальное сохранение этого устройства. Для тестов и настройки баланса.</div>
 <div class="nm-tabs"><button class="on" data-p="pl">👤 Игрок</button><button data-p="wk">🔧 Мастерская</button><button data-p="vip">👑 VIP</button><button data-p="pr">🎟 Промокоды</button><button data-p="sys">⚙️ Система</button></div>
 <div class="nm-pane on" data-p="pl"><div class="nm-sec"><h3>💰 Деньги и опыт</h3><div class="nm-row"><label><span class="nm-lbl">Баланс, ₽</span><input class="nm-in" data-money type="number" value="${Math.round(S.money)}"></label><label><span class="nm-lbl">Опыт компании (сейчас ур. ${lv.lv})</span><input class="nm-in" data-bxp type="number" value="${Math.round((S.biz&&S.biz.xp)||0)}"></label><label><span class="nm-lbl">Опыт мастерской</span><input class="nm-in" data-wxp type="number" value="${Math.round(w.xp||0)}"></label></div>
  <div style="display:flex;gap:6px;flex-wrap:wrap">${[10000,100000,1000000,10000000].map(v=>`<button class="nm-btn sm" data-addm="${v}">+${F(v)} ₽</button>`).join('')}</div></div>
  <div class="nm-sec"><h3>🚀 Улучшения</h3><div class="nm-row">${ups}</div><button class="nm-btn sm" data-maxup>Всё на максимум</button> <button class="nm-btn sm" data-zeroup>Сбросить в 0</button></div>
  <button class="nm-btn pri" data-apply="pl">Применить</button></div>
 <div class="nm-pane" data-p="wk"><div class="nm-sec"><h3>🧰 Уровни инструментов</h3><div class="nm-row">${tools}</div></div><div class="nm-sec"><h3>🧪 Материалы</h3><div class="nm-row">${mats}</div><button class="nm-btn sm" data-mat50>Всего по 50</button></div>
  <div class="nm-sec"><h3>🔩 Тестовый номер</h3><div class="nm-muted" style="margin-bottom:10px">Добавляет на склад сильно повреждённый номер, чтобы проверить все инструменты.</div><button class="nm-btn sm" data-dmg>Добавить и открыть в мастерской</button></div>
  <button class="nm-btn pri" data-apply="wk">Применить</button></div>
 <div class="nm-pane" data-p="vip"><div class="nm-sec"><h3>👑 Статус</h3><div class="nm-muted" style="margin-bottom:12px">${t?`Сейчас: ${VIP[t].i} ${VIP[t].n}, осталось ${left(X.vip.until-Date.now())}`:'VIP не активен'}</div><div class="nm-row"><label><span class="nm-lbl">Уровень</span><select data-vt>${VIP.slice(1).map((v,i)=>`<option value="${i+1}">${v.i} ${v.n}</option>`).join('')}</select></label><label><span class="nm-lbl">Дней</span><input class="nm-in" data-vd type="number" min="1" value="30"></label></div><button class="nm-btn gold" data-vgive>Выдать VIP</button> <button class="nm-btn red" data-voff>Снять VIP</button> <button class="nm-btn" data-vbon>Сбросить VIP-бонус дня</button></div></div>
 <div class="nm-pane" data-p="pr"><div class="nm-sec"><h3>➕ Новый промокод</h3><div class="nm-row"><label><span class="nm-lbl">Код</span><input class="nm-in" data-nc="code" maxlength="24" placeholder="Например SUMMER" style="text-transform:uppercase"></label><label><span class="nm-lbl">Деньги, ₽</span><input class="nm-in" data-nc="money" type="number" min="0" value="0"></label><label><span class="nm-lbl">VIP</span><select data-nc="vip"><option value="0">— нет —</option>${VIP.slice(1).map((v,i)=>`<option value="${i+1}">${v.n}</option>`).join('')}</select></label><label><span class="nm-lbl">Дней VIP</span><input class="nm-in" data-nc="days" type="number" min="1" value="7"></label></div><div class="nm-row"><label><span class="nm-lbl">Материалы (шт. каждого)</span><input class="nm-in" data-nc="mat" type="number" min="0" value="0"></label><label><span class="nm-lbl">XP компании</span><input class="nm-in" data-nc="xp" type="number" min="0" value="0"></label><label><span class="nm-lbl">Лимит активаций (0 = без лимита)</span><input class="nm-in" data-nc="max" type="number" min="0" value="0"></label><label><span class="nm-lbl">Действует до</span><input class="nm-in" data-nc="until" type="date"></label></div><label style="display:block;margin-bottom:12px"><span class="nm-lbl">Описание</span><input class="nm-in" data-nc="note" maxlength="60"></label><button class="nm-btn pri" data-cadd>Создать</button> <button class="nm-btn" data-cgen>Случайный код</button><div class="nm-muted" data-cmsg style="margin-top:8px;min-height:1.2em"></div></div>
  <div class="nm-sec" style="overflow:auto"><h3>📋 Все промокоды</h3><table class="nm-tbl"><thead><tr><th>Код</th><th>Награда</th><th>Активаций</th><th>До</th><th>Статус</th><th></th></tr></thead><tbody>${codes}</tbody></table></div></div>
 <div class="nm-pane" data-p="sys"><div class="nm-sec"><h3>📈 События рынка</h3><div class="nm-row"><label><span class="nm-lbl">Событие</span><select data-ev>${EVS.map(e=>`<option value="${e.id}">${esc(e.t)} ×${e.m}</option>`).join('')}</select></label><label><span class="nm-lbl">Длительность, с</span><input class="nm-in" data-evs type="number" min="10" value="120"></label></div><button class="nm-btn" data-evgo>Запустить</button> <button class="nm-btn" data-evoff>Завершить текущее</button></div>
  <div class="nm-sec"><h3>🔄 Сбросы</h3><button class="nm-btn sm" data-rdaily>Ежедневный бонус снова доступен</button> <button class="nm-btn sm" data-rord>Новые заказы</button> <button class="nm-btn sm" data-rach>Сбросить полученные достижения</button></div>
  <div class="nm-sec"><h3>💾 Сохранение</h3><textarea data-json rows="5" placeholder="Здесь появится JSON. Для импорта вставьте сюда сохранение"></textarea><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="nm-btn sm" data-exp>Экспорт</button><button class="nm-btn sm" data-dl>Скачать файл</button><button class="nm-btn sm" data-imp>Импорт</button></div></div>
  <div class="nm-sec"><h3>🔑 Доступ</h3><div class="nm-row"><label><span class="nm-lbl">Новый служебный код администратора</span><input class="nm-in" data-newadm maxlength="32" placeholder="минимум 6 символов"></label></div><button class="nm-btn sm" data-setadm>Сменить код</button> <button class="nm-btn sm" data-admout>Выйти из режима админа</button> <button class="nm-btn sm red" data-wipe>Полный сброс игры</button></div></div>`;
 const m=modal('🛠 Админ-панель',body,'wide');tabsInit(m);
 if(keep){const b=m.querySelector(`.nm-tabs button[data-p="${keep}"]`);if(b)b.click()}
 const Q=s=>m.querySelector(s),QA=s=>[...m.querySelectorAll(s)];
 const done=msg=>{persist();toast(msg||'Изменения применены');openAdmin()};
 QA('[data-addm]').forEach(b=>b.onclick=()=>{S.money+=+b.dataset.addm;done('+'+F(+b.dataset.addm)+' ₽')});
 Q('[data-maxup]').onclick=()=>QA('[data-lv]').forEach(i=>i.value=i.max);Q('[data-zeroup]').onclick=()=>QA('[data-lv]').forEach(i=>i.value=0);
 Q('[data-apply="pl"]').onclick=()=>{S.money=Math.max(0,num(Q('[data-money]').value,S.money));ensureBiz();S.biz.xp=Math.max(0,num(Q('[data-bxp]').value,S.biz.xp));W().xp=Math.max(0,num(Q('[data-wxp]').value,W().xp));QA('[data-lv]').forEach(i=>{S.lv[i.dataset.lv]=Math.max(0,Math.min(+i.max,Math.round(num(i.value))))});done()};
 Q('[data-mat50]').onclick=()=>QA('[data-mat]').forEach(i=>i.value=50);
 Q('[data-apply="wk"]').onclick=()=>{S.tl=S.tl||{};QA('[data-tl]').forEach(i=>S.tl[i.dataset.tl]=Math.max(0,Math.min(7,Math.round(num(i.value)))));QA('[data-mat]').forEach(i=>W().mat[i.dataset.mat]=Math.max(0,Math.round(num(i.value))));try{wkRender(true)}catch(e){}done()};
 Q('[data-dmg]').onclick=()=>{let q=null;try{q=pickBest()}catch(e){}if(!q){toast('Не удалось создать номер');return}q.c=0;delete q.d;try{ensureD(q);q.d.rust=70;q.d.dull=60;q.d.bend=50;q.d.fade=50;delete q.dn;delete q.cf;ensureD(q);recalc&&recalc(q)}catch(e){}S.inv.push(q);persist();closeModal();setTimeout(()=>{try{toWorkshop(S.inv.length-1)}catch(e){tab('t8')}},250)};
 Q('[data-vgive]').onclick=()=>{vipGrant(+Q('[data-vt]').value,Math.max(1,num(Q('[data-vd]').value,1)));done('VIP выдан')};
 Q('[data-voff]').onclick=()=>{X.vip={tier:0,until:0};done('VIP снят')};
 Q('[data-vbon]').onclick=()=>{delete X.vd;done('VIP-бонус снова доступен')};
 const cm=Q('[data-cmsg]');
 Q('[data-cgen]').onclick=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='NM-';for(let i=0;i<6;i++)s+=A[Math.floor(Math.random()*A.length)];Q('[data-nc="code"]').value=s};
 Q('[data-cadd]').onclick=()=>{const g=k=>Q(`[data-nc="${k}"]`).value;const code=norm(g('code'));
  if(code.length<3){cm.textContent='Код — минимум 3 символа';cm.style.color='#ff9fae';return}
  if(allCodes().some(x=>norm(x.code)===code)||hsh(code)===(X.adminH||ADMIN_H)){cm.textContent='Такой код уже есть';cm.style.color='#ff9fae';return}
  const p={code,money:Math.max(0,num(g('money'))),vip:+g('vip')||0,days:Math.max(1,num(g('days'),1)),mat:Math.max(0,num(g('mat'))),xp:Math.max(0,num(g('xp'))),max:Math.max(0,num(g('max'))),note:g('note').trim(),created:Date.now()};
  const u=g('until');if(u)p.until=new Date(u+'T23:59:59').getTime();
  if(!p.money&&!p.vip&&!p.mat&&!p.xp){cm.textContent='Укажите хотя бы одну награду';cm.style.color='#ff9fae';return}
  X.codes.push(p);xsave();toast('Промокод '+code+' создан');openAdmin()};
 QA('[data-ctog]').forEach(b=>b.onclick=()=>{const c=b.dataset.ctog,p=X.codes.find(x=>x.code===c);if(p)p.off=!p.off;else X.off[c]=!X.off[c];xsave();openAdmin()});
 QA('[data-cdel]').forEach(b=>b.onclick=()=>{if(!confirm('Удалить промокод '+b.dataset.cdel+'?'))return;X.codes=X.codes.filter(x=>x.code!==b.dataset.cdel);xsave();openAdmin()});
 QA('[data-creset]').forEach(b=>b.onclick=()=>{delete X.used[b.dataset.creset];delete X.uses[b.dataset.creset];xsave();openAdmin()});
 Q('[data-evgo]').onclick=()=>{const id=Q('[data-ev]').value,sec=Math.max(10,num(Q('[data-evs]').value,120));S.ev={id,until:Date.now()+sec*1000};S.nextEv=S.ev.until+60000;done('Событие запущено')};
 Q('[data-evoff]').onclick=()=>{S.ev=null;S.nextEv=Date.now()+60000;done('Событие завершено')};
 Q('[data-rdaily]').onclick=()=>{if(S.daily){S.daily.d=''}done('Ежедневный бонус снова доступен')};
 Q('[data-rord]').onclick=()=>{S.ord=[];try{fillOrders()}catch(e){}done('Заказы обновлены')};
 Q('[data-rach]').onclick=()=>{S.ach={};done('Достижения сброшены')};
 const ta=Q('[data-json]');const dump=()=>JSON.stringify({v:'nomera-1.1',S,X:Object.assign({},X,{admin:undefined,adminH:undefined})});
 Q('[data-exp]').onclick=()=>{ta.value=dump();ta.select()};
 Q('[data-dl]').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([dump()],{type:'application/json'}));a.download='nomera-save-'+dk()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
 Q('[data-imp]').onclick=()=>{let o;try{o=JSON.parse(ta.value)}catch(e){toast('Неверный JSON');return}if(!o||!o.S){toast('В файле нет сохранения');return}if(!confirm('Заменить текущий прогресс?'))return;localStorage.setItem('nomera3',JSON.stringify(o.S));if(o.X){const a=X.admin,h=X.adminH;X=Object.assign({},o.X,{admin:a,adminH:h});xsave()}location.reload()};
 Q('[data-setadm]').onclick=()=>{const v=norm(Q('[data-newadm]').value);if(v.length<6){toast('Минимум 6 символов');return}X.adminH=hsh(v);xsave();toast('Служебный код изменён');Q('[data-newadm]').value=''};
 Q('[data-admout]').onclick=()=>{X.admin=false;xsave();refresh();closeModal();toast('Режим администратора выключен')};
 Q('[data-wipe]').onclick=()=>{if(!confirm('Сбросить ВЕСЬ прогресс, профиль и VIP?'))return;const a=X.admin,h=X.adminH,c=X.codes;localStorage.removeItem('nomera3');X={admin:a,adminH:h,codes:c};xsave();location.reload()}}

/* ---------- ИНТЕГРАЦИЯ В ИНТЕРФЕЙС ---------- */
function refresh(){const P=X.profile,t=vt();
 document.querySelectorAll('.ava').forEach(a=>{const e=avaOk(P.ava)?P.ava:AVAS[0];if(a.dataset.e!==e){a.innerHTML='<span class="nm-ava-e">'+e+'</span>';a.dataset.e=e}a.title='Профиль: '+P.nick;a.setAttribute('role','button');a.tabIndex=0;if(t){a.dataset.vip=t;a.style.setProperty('--vipc',VIP[t].c)}else{delete a.dataset.vip}});
 const bn=document.querySelector('.bizname');if(bn&&P.garage)bn.textContent=P.garage.toUpperCase();
 const sp=document.querySelector('.side-premium');if(sp){const b=sp.querySelector('.premium-card b'),btn=sp.querySelector('#premium-info');sp.classList.toggle('nm-has',!!t);if(t)sp.style.setProperty('--vipc',VIP[t].c);if(b)b.innerHTML=t?`${VIP[t].i} VIP ${VIP[t].n}<br><small style="font-weight:600;opacity:.8">ещё ${left(X.vip.until-Date.now())}</small>`:'VIP<br>привилегии';if(btn)btn.innerHTML=(t?'Подробнее':'Узнать больше')+' <span aria-hidden="true">→</span>'}
 const acc=document.getElementById('nm-acc');if(acc){const ab=acc.querySelector('[data-adm]');if(ab)ab.hidden=!X.admin;const st=acc.querySelector('[data-vst]');if(st)st.innerHTML=t?vipBadge()+` <span class="nm-muted">ещё ${left(X.vip.until-Date.now())}</span>`:'<span class="nm-muted">VIP не активен</span>'}
 badge()}
function injectAccount(){const sec=document.getElementById('sp-account');if(!sec||document.getElementById('nm-acc'))return;const c=document.createElement('div');c.className='st-card';c.id='nm-acc';c.innerHTML=`<h2>👤 Профиль, VIP и промокоды</h2><div data-vst style="margin-bottom:12px"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"><button type="button" class="nm-btn pri" data-prof>Открыть профиль</button><button type="button" class="nm-btn gold" data-vipo>👑 VIP</button><button type="button" class="nm-btn" data-adm hidden>🛠 Админ-панель</button></div><span class="nm-lbl">Промокод</span>${promoHTML()}`;sec.insertBefore(c,sec.firstChild);c.querySelector('[data-prof]').onclick=openProfile;c.querySelector('[data-vipo]').onclick=openVip;c.querySelector('[data-adm]').onclick=openAdmin}

// перехват кликов раньше старых обработчиков
window.addEventListener('click',e=>{const t=e.target;if(!t||!t.closest)return;
 if(t.closest('#bell')){e.stopPropagation();e.preventDefault();np?closeNP():openNP();return}
 if(t.closest('.ava')){e.stopPropagation();e.preventDefault();openProfile();return}
 if(t.closest('#premium-info')||t.closest('.side-premium')){e.stopPropagation();e.preventDefault();openVip();return}},true);
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&(cur||np)){e.stopPropagation();if(cur)closeModal();else closeNP();return}
 if(e.ctrlKey&&e.shiftKey&&(e.key==='A'||e.key==='a'||e.key==='Ф'||e.key==='ф')){e.preventDefault();e.stopPropagation();openAdmin();return}
 const t=e.target;if(t&&t.closest&&(t.closest('.nm-ov')||t.closest('.nm-np'))){e.stopPropagation();return}
 if(e.key==='Enter'&&t&&t.closest&&t.closest('.ava')){openProfile()}},true);

window.NMX={openProfile,openVip,openAdmin,openNotifications:openNP,redeem};
injectAccount();refresh();
// старт всегда с «Рынка»
try{const sh=document.querySelector('.tab.show');if(!sh||sh.id!=='t1'){const bs=[...document.querySelectorAll('.sb[data-t="t1"]')];const b=bs.find(x=>x.offsetParent)||bs[0];if(b)b.click()}}catch(e){}
setInterval(refresh,5000);
})();
