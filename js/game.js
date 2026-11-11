
let down=false;
const LET='АВЕКМНОРСТУХ',WORDS=['КОТ','ТОР','МАМ','РОК','ОСА','САМ','КУМ','ТУТ','КОМ','ТОМ','ХОР','МОР'];
const REG=[2,10,16,21,23,31,34,36,38,42,47,50,52,54,59,61,63,64,66,74,76,77,78,86,93,96,97,98,99,102,116,134,150,152,154,161,163,174,177,178,186,190,196,197,199,277,750,777,799];
const ELITE=[77,97,99,177,197,199,777,799,78,98,178,50,150,750,102,116,161,174,196];
const RM={};[50,150,750,52,54,59,61,63,66,74,102,116,161,163,174,196,152,154,186,190,134].forEach(r=>RM[r]=1.25);[78,98,178].forEach(r=>RM[r]=2);[97,99,177,197,199,777,799].forEach(r=>RM[r]=2.4);RM[77]=3;
const SP={'001':18000,'002':6000,'007':30000,'100':7000,'123':14000,'321':6000,'228':9000,'404':5000,'101':4000,'010':4000};
const CN=['Убитый','Ржавый','Потёртый','Хороший','Как новый'],CC=['#c0562b','#d58a3a','#c9b458','#7ccf8a','#6fc7ff'],M=[.2,.45,.75,1,1.3];
const TN=['Обычный','Красивый','Редкий','Эпик','Легенда'];
const COUNTS=[1,2,3,4,5],MCOST=[10000,80000,500000,3000000];
const THR=[Infinity,3000,15000,60000],THL=['Не хранить','от 3 тыс','от 15 тыс','от 60 тыс'];
const rnd=a=>a[Math.floor(Math.random()*a.length)],sleep=ms=>new Promise(r=>setTimeout(r,ms));
// FIX: добавлены lastCrew, tl, turnover
const DEF=()=>({
  money:2500,rolls:0,earned:0,tc:[0,0,0,0,0],
  lv:{auto:0,luck:0,multi:0,sklad:0,shop:0,arch:0,conn:0,crew:0,rep:0,clients:0},
  sel:0,thr:1,autoOn:true,inv:[],top:[],restored:0,ord:[],ev:null,nextEv:0,done:0,col:[],
  lastCrew:Date.now(),
  tl:{hammer:0,polish:0,paint:0,rust:0},
  biz:{xp:0,day:'',wholesale:0,workshop:0,marketing:0,staff:0,branches:0,expert:0,broker:0,lastPassive:Date.now(),
    daily:{sales:0,restore:0,orders:0,buy:0,turnover:0},
    missions:[],offers:[],showcase:[],supplier:0,shop:0,ads:0,lastSale:0,deals:0}
});
let S=DEF();
try{const x=JSON.parse(localStorage.getItem('nomera3'));if(x&&x.lv)S=Object.assign(DEF(),x,{lv:Object.assign(DEF().lv,x.lv),biz:Object.assign(DEF().biz,x.biz||{},{daily:Object.assign(DEF().biz.daily,x.biz&&x.biz.daily||{})})})}catch(e){}
if(!S.rolls&&S.money<2500)S.money=2500;
if(typeof S.lastCrew!=='number')S.lastCrew=Date.now();
S.biz=Object.assign(DEF().biz,S.biz||{});
let settingsPrefs={};try{settingsPrefs=JSON.parse(localStorage.getItem('nomera-settings')||'{}')||{}}catch(e){}
const save=(force=false)=>{try{const p=JSON.parse(localStorage.getItem('nomera-settings')||'{}');if(force||p.autosave!==false)localStorage.setItem('nomera3',JSON.stringify(S))}catch(e){}};

function fmt(n){
  n=Math.round(n);if(n<10000)return n.toLocaleString('ru-RU');
  for(const [k,s] of [[1e12,'трлн'],[1e9,'млрд'],[1e6,'млн'],[1e3,'тыс']])if(n>=k)return (n/k).toFixed(n/k<10?2:1).replace('.',',')+' '+s;
}
function potOf(p,year){
  const d=p.d;let b=220;
  if(d[0]==d[1]&&d[1]==d[2])b=d=='777'?45000:d=='888'?20000:12000;
  else if(SP[d])b=SP[d];
  else if(d[1]=='0'&&d[2]=='0')b=3500;
  else if(d[0]==d[2])b=1800;
  else if(d[0]==d[1]||d[1]==d[2])b=650;
  let lm=1;if(p.l1==p.l2&&p.l2==p.l3)lm=3.5;else if(p.l2==p.l3)lm=1.6;
  return Math.round(b*lm*(WORDS.includes(p.l1+p.l2+p.l3)?2.5:1)*(RM[p.r]||1)*(year<=2000?1.35:1));
}
const priceOf=q=>Math.round(q.pot*M[q.c]*(1+(q.k||0)));
const tierOf=v=>v<1200?0:v<5000?1:v<25000?2:v<120000?3:4;
const repM=()=>Math.pow(1.08,S.lv.rep)*(1+.01*S.col.length),shopF=()=>Math.max(.5,1-.06*S.lv.shop);
const EVS=[
 {id:'elite',t:'Ажиотаж на элитные регионы',m:1.5,f:q=>(RM[q.p.r]||1)>=2},
 {id:'triple',t:'Любители «троек» скупают номера',m:1.6,f:q=>q.p.d[0]==q.p.d[1]&&q.p.d[1]==q.p.d[2]},
 {id:'rare',t:'Коллекционеры ищут раритет',m:1.5,f:q=>q.year<=2000},
 {id:'word',t:'Номера-слова в моде',m:1.8,f:q=>WORDS.includes(q.p.l1+q.p.l2+q.p.l3)},
 {id:'mint',t:'Спрос на номера в идеале',m:1.3,f:q=>q.c==4},
 {id:'hol',t:'Праздничный спрос на все номера',m:1.2,f:q=>true},
 {id:'cris',t:'Кризис: покупатели экономят',m:.8,f:q=>true}
];
const evM=q=>{const e=S.ev&&EVS.find(x=>x.id==S.ev.id);return e&&e.f(q)?e.m:1};
const sellVal=q=>Math.round(priceOf(q)*repM()*evM(q)*(window.NMV?NMV.sell():1));
const slots=()=>(window.NMV?NMV.slots():0)+3+S.lv.sklad+Math.floor(((S.biz?bizLevel().lv:1)-1)/3);
const REGO=[77,99,197,177,50,150,78,98,199,777,799,102,116,161,174];
const oSlots=()=>2+S.lv.clients;
function newOrder(){
  const k=rnd(['pair','pair','region','region','word','same','rare','price']);
  if(k=='pair')return{type:k,minC:2,mult:1.5};
  if(k=='region'){const r=rnd(REGO);return{type:k,arg:r,minC:2,mult:r==77?2:(r>=97&&r!=102)?1.9:1.6}}
  if(k=='word')return{type:k,minC:2,mult:1.8};
  if(k=='same')return{type:k,minC:2,mult:2.2};
  if(k=='rare')return{type:k,minC:3,mult:1.8};
  return{type:'price',arg:rnd([3000,10000,30000]),minC:3,mult:1.4};
}
function fillOrders(){while(S.ord.length<oSlots())S.ord.push(newOrder())}
const fits=(q,o)=>{
  if(q.c<o.minC)return false;const p=q.p,d=p.d;
  switch(o.type){
    case'pair':return d[0]==d[1]||d[1]==d[2]||d[0]==d[2];
    case'region':return p.r==o.arg;
    case'word':return WORDS.includes(p.l1+p.l2+p.l3);
    case'same':return d[0]==d[1]&&d[1]==d[2];
    case'rare':return q.year<=2000;
    default:return priceOf(q)>=o.arg;
  }
};
const oText=o=>({pair:'Номер с повторяющимися цифрами',region:`Номер региона ${o.arg}`,word:'Номер, где буквы образуют слово (КОТ, ТОР, МАМ…)',same:'Номер с тремя одинаковыми цифрами',rare:'Раритет: выдан до 2000 года',price:`Номер стоимостью от ${fmt(o.arg)} ₽`}[o.type])+` · состояние не хуже «${CN[o.minC]}»`;
const oMult=o=>o.mult*(1+.1*S.lv.clients);
const oCand=o=>{let bi=-1;S.inv.forEach((q,i)=>{if(!q.lock&&fits(q,o)&&(bi<0||priceOf(q)<priceOf(S.inv[bi])))bi=i});return bi};
const txt=p=>p.l1+p.d+p.l2+p.l3;
function mk(){
  const p={l1:rnd(LET),l2:rnd(LET),l3:rnd(LET),d:String(1+Math.floor(Math.random()*999)).padStart(3,'0'),r:rnd(REG)};
  // FIX: кап 50% на связи (было 12%*lv = 72% на максе)
  if(S.lv.conn&&Math.random()<Math.min(.5,S.lv.conn*.1))p.r=rnd(ELITE);
  const age=Math.floor(Math.random()*32),year=2025-age;
  const wear=Math.max(0,age*3+Math.random()*28-S.lv.arch*7);
  const c=wear<14?4:wear<34?3:wear<56?2:wear<78?1:0;
  const q={p,year,c};q.pot=potOf(p,year);return q;
}
// FIX: кап 8 выборок (было luck+expert = 11)
function pickBest(){
  let b=null;
  const n=Math.min(8,S.lv.luck+(S.biz.expert||0));
  for(let i=0;i<=n;i++){const q=mk();if(!b||priceOf(q)>priceOf(b))b=q}
  return b
}

// Business progression
const BIZ_MISSIONS=[
 {id:'sales',title:'Закрой 3 сделки',desc:'Продай любые три номера',icon:'🤝',target:3,reward:1800,xp:18},
 {id:'restore',title:'Работа мастерской',desc:'Отреставрируй два номера',icon:'🛠',target:2,reward:2200,xp:22},
 {id:'orders',title:'Довольные клиенты',desc:'Выполни два заказа покупателей',icon:'📋',target:2,reward:3000,xp:28},
 {id:'buy',title:'Работа с поставщиками',desc:'Закупи одну оптовую партию',icon:'🚚',target:1,reward:1600,xp:16},
 {id:'turnover',title:'Оборот компании',desc:'Продай пять номеров',icon:'💸',target:5,reward:2600,xp:24}
];
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
// FIX: auto-claim completed unclaimed before day reset, turnover in daily
function ensureBiz(){
  if(!S.biz)S.biz=DEF().biz;
  if(S.biz.day!==dayKey()){
    S.biz.missions.forEach(m=>{
      if(m.claimed)return;
      const key=m.id==='turnover'?'turnover':m.id;
      if((S.biz.daily[key]||0)>=m.target){S.money+=m.reward;S.biz.xp+=m.xp}
    });
    S.biz.day=dayKey();S.biz.daily={sales:0,restore:0,orders:0,buy:0,turnover:0};
    S.biz.missions=[...BIZ_MISSIONS].sort(()=>Math.random()-.5).slice(0,3).map(m=>({...m,claimed:false}));
  }
  if(!Array.isArray(S.biz.offers)||!S.biz.offers.length)S.biz.offers=makeOffers();
  if(!Array.isArray(S.biz.showcase))S.biz.showcase=[];
}
function bizLevel(){let xp=Math.max(0,S.biz.xp||0),lv=1;while(lv<30&&xp>=100*Math.pow(lv,1.45)){xp-=Math.floor(100*Math.pow(lv,1.45));lv++}return{lv,xp,next:Math.floor(100*Math.pow(lv,1.45))}}
// FIX: убран авто-клейм миссий
function bizTrack(type,n=1){
  ensureBiz();S.biz.daily[type]=(S.biz.daily[type]||0)+n;
  S.biz.xp=(S.biz.xp||0)+(type==='orders'?16:type==='restore'?8:type==='buy'?5:5)*n;
  if(type==='sales'||type==='orders'){S.biz.deals=(S.biz.deals||0)+n;const commission=25*(S.biz.broker||0)*n;S.money+=commission;S.earned+=commission;}
  if(type==='sales')S.biz.daily.turnover=(S.biz.daily.turnover||0)+n;
}
// NEW: ручной клейм
function claimMission(id){
  const m=S.biz.missions.find(x=>x.id===id);
  if(!m||m.claimed)return false;
  const key=m.id==='turnover'?'turnover':m.id;
  if((S.biz.daily[key]||0)<m.target)return false;
  m.claimed=true;S.money+=m.reward;S.biz.xp+=m.xp;
  save();draw();return true;
}
function makeOffers(){
  const specs=[{id:'yard',name:'Лот с авторазборки',desc:'3 номера в разном состоянии. Дёшево, но потребуется работа.',n:3,disc:.57,lo:0,hi:2,icon:'🔧'},
    {id:'archive',name:'Архивная партия',desc:'3 старых номера. Есть шанс найти настоящий раритет.',n:3,disc:.69,lo:1,hi:3,icon:'🗄',unlock:2},
    {id:'premium',name:'Поставка коллекционера',desc:'2 отобранных номера в хорошем состоянии.',n:2,disc:.82,lo:2,hi:4,icon:'💎',unlock:4}];
  return specs.map(sp=>{const items=Array.from({length:sp.n},()=>{let q=mk();q.c=sp.lo+Math.floor(Math.random()*(sp.hi-sp.lo+1));if(sp.id==='archive'){q.year=1985+Math.floor(Math.random()*16);q.pot=potOf(q.p,q.year)}return q});const value=items.reduce((a,q)=>a+sellVal(q),0);const discount=Math.max(1200,Math.round(value*sp.disc*(1-Math.min(.25,(S.biz.supplier||0)*.04))));return{...sp,items,value,cost:discount}});
}
function buyLot(id){
  ensureBiz();const o=S.biz.offers.find(x=>x.id===id);if(!o||bizLevel().lv<(o.unlock||1)||S.money<o.cost||S.inv.length+o.items.length>slots())return false;
  S.money-=o.cost;o.items.forEach(q=>S.inv.push(q));bizTrack('buy');S.biz.offers=S.biz.offers.filter(x=>x.id!==id);S.biz.offers.push(...makeOffers().filter(x=>x.id===id));save();draw();return true;
}
function listForShowcase(i){
  ensureBiz();const cap=1+S.biz.shop+(S.biz.branches||0);if(S.biz.showcase.length>=cap||!S.inv[i])return false;
  const q=S.inv[i],ask=Math.round(sellVal(q)*(1.08+S.biz.ads*.05+(S.biz.marketing||0)*.025));
  S.biz.showcase.push({q,ask,readyAt:Date.now()+Math.max(20,75-S.biz.ads*8)*1000});S.inv.splice(i,1);save();draw();return true;
}
function claimShowcase(i){
  const x=S.biz.showcase[i];if(!x||Date.now()<x.readyAt)return false;
  const payout=Math.round(x.ask*(1+(S.biz.marketing||0)*.012));S.money+=payout;S.earned+=payout;bizTrack('sales');if(payout>=3000)recTop(x.q,payout);S.biz.showcase.splice(i,1);S.biz.lastSale=Date.now();save();draw();return true;
}
// FIX: workshop теперь тоже даёт скидку на расходники, описание соответствует
const BIZ_UPS=[
 {id:'supplier',icon:'🚚',name:'Дешёвые партии',desc:'Оптовые партии номеров дешевле на 4% за уровень.',max:5,base:9000,mul:2.25},
 {id:'shop',icon:'🏬',name:'Место на витрине',desc:'+1 место на витрине для продажи номеров.',max:5,base:12000,mul:2.4},
 {id:'ads',icon:'📣',name:'Реклама',desc:'Покупатели на витрине приходят быстрее и платят больше.',max:5,base:16000,mul:2.5},
 {id:'wholesale',icon:'📦',name:'Дешёвая прокрутка',desc:'Каждая прокрутка дешевле на 2,5% за уровень.',max:10,base:5000,mul:1.85},
 {id:'workshop',icon:'🔧',name:'Скидка на материалы',desc:'Материалы для ремонта дешевле на 2,5% за уровень.',max:8,base:8500,mul:2.0},
 {id:'marketing',icon:'📈',name:'Дороже на витрине',desc:'Покупатели на витрине платят больше.',max:8,base:10000,mul:2.05},
 {id:'staff',icon:'👥',name:'Пассивный доход',desc:'Офис сам приносит деньги каждую минуту.',max:8,base:14000,mul:2.15},
 {id:'branches',icon:'🏢',name:'Филиалы',desc:'+1 место на витрине за каждый филиал.',max:6,base:26000,mul:2.35},
 {id:'expert',icon:'🔎',name:'Поиск ценных номеров',desc:'Чаще выпадают дорогие номера.',max:6,base:18000,mul:2.2},
 {id:'broker',icon:'🤝',name:'Бонус за сделки',desc:'+25 ₽ за каждую сделку за уровень.',max:6,base:22000,mul:2.25}
];
function drawBusiness(){
  ensureBiz();const b=bizLevel(),pct=Math.min(100,b.xp/b.next*100);
  document.getElementById('bizrank').textContent=`Уровень компании ${b.lv} · ${b.lv<4?'Частный перекупщик':b.lv<8?'Местный дилер':b.lv<14?'Региональная сеть':b.lv<22?'Крупный оператор':'Империя номеров'}`;
  document.getElementById('bizxpbar').style.width=pct+'%';
  document.getElementById('bizstats').innerHTML=`<div>ОПЫТ<b>${fmt(b.xp)} / ${fmt(b.next)}</b></div><div>СДЕЛОК<b>${fmt(S.biz.deals||S.done)}</b></div><div>ВИТРИНА<b>${S.biz.showcase.length}/${1+S.biz.shop+(S.biz.branches||0)}</b></div>`;
  // FIX: кнопка "Забрать" для неполученных наград
  document.getElementById('missions').innerHTML=S.biz.missions.map(m=>{
    const key=m.id==='turnover'?'turnover':m.id;
    const cur=Math.min(m.target,S.biz.daily[key]||0);
    const done=m.claimed||cur>=m.target;
    const claimable=!m.claimed&&cur>=m.target;
    const right=claimable
      ?`<button class="missionclaim" data-biz="claim-mission" data-id="${m.id}">Забрать<small>+${fmt(m.reward)} ₽</small></button>`
      :`<div class="missionreward">${m.claimed?'✓ ПОЛУЧЕНО':'+'+fmt(m.reward)+' ₽'}</div>`;
    return `<div class="mission ${done?'done':''}"><div class="missiontop"><div class="missionico">${m.icon}</div><div class="missiontext"><b>${m.title}</b><span>${m.desc} · ${cur}/${m.target}</span></div>${right}</div><div class="missionbar"><i style="width:${cur/m.target*100}%"></i></div></div>`
  }).join('');
  document.getElementById('lots').innerHTML=S.biz.offers.map(o=>{const locked=bizLevel().lv<(o.unlock||1),disabled=locked||S.money<o.cost||S.inv.length+o.items.length>slots();return `<div class="lot"><div class="lottop"><div><b>${o.icon} ${o.name}</b><div class="lotdesc">${o.desc}</div></div><div class="lotprice">${fmt(o.cost)} ₽</div></div><div class="lotplates">${o.items.map(q=>plateH(q,'mini')).join('')}<span class="sub">Оценка: ${fmt(o.value)} ₽</span></div><button data-biz="lot" data-id="${o.id}" ${disabled?'disabled':''}>${locked?'Откроется на уровне компании '+o.unlock:S.inv.length+o.items.length>slots()?'Нужно место на складе':S.money<o.cost?'Недостаточно средств':'Закупить партию'}</button></div>`}).join('');
  document.getElementById('showcase').innerHTML=S.biz.showcase.length?S.biz.showcase.map((x,i)=>{const left=Math.max(0,Math.ceil((x.readyAt-Date.now())/1000)),ready=left===0;return `<div class="showitem"><div class="showtop">${plateH(x.q,'mini')}<div class="rm"><b>${fmt(x.ask)} ₽</b><span>${ready?'Покупатель готов забрать':'Осталось '+left+' сек.'}</span></div></div><button data-biz="claim" data-i="${i}" ${ready?'':'disabled'}>${ready?'Получить оплату':'Номер выставлен'}</button></div>`}).join(''):'<div class="empty">Витрина пока пустая. Выставляй лучшие номера со склада — покупатели готовы платить с наценкой.</div>';
  document.getElementById('bizup').innerHTML='<div class="bizupgrid">'+BIZ_UPS.map(u=>{const l=S.biz[u.id]||0,cost=Math.round(u.base*Math.pow(u.mul,l)),full=l>=u.max;return `<div class="bizup"><div class="buico">${u.icon}</div><b>${u.name} · ${l}/${u.max}</b><span>${u.desc}</span><button data-biz="upgrade" data-id="${u.id}" ${full||S.money<cost?'disabled':''}>${full?'Максимум': 'Улучшить · '+fmt(cost)+' ₽'}</button></div>`}).join('')+'</div>';
}
// FIX: обработка claim-mission
document.getElementById('t5').addEventListener('click',e=>{const b=e.target.closest('button[data-biz]');if(!b)return;const a=b.dataset.biz,id=b.dataset.id;if(a==='lot')buyLot(id);else if(a==='claim')claimShowcase(+b.dataset.i);else if(a==='claim-mission')claimMission(id);else if(a==='upgrade'){const u=BIZ_UPS.find(x=>x.id===id);if(!u)return;const l=S.biz[id]||0,cost=Math.round(u.base*Math.pow(u.mul,l));if(l<u.max&&S.money>=cost){S.money-=cost;S.biz[id]++;save();draw()}}});
setInterval(()=>{if(!S.biz||!S.biz.showcase||!S.biz.showcase.length)return;const tab=document.getElementById('t5');if(tab.classList.contains('show'))drawBusiness()},1000);
setInterval(()=>{if(!S.biz)return;const now=Date.now(),last=S.biz.lastPassive||now,mins=Math.floor((now-last)/60000);if(mins>0){const income=mins*(S.biz.staff||0)*35;if(income>0){S.money+=income;S.earned+=income;}S.biz.lastPassive=last+mins*60000;save();if(document.getElementById('t5').classList.contains('show'))draw();}},10000);

const cell=(c,k)=>`<span class="c${k||''}"><span class="st"><span>${c}</span></span></span>`;
const inner=p=>`<span class="m">${[...txt(p)].map(c=>cell(c)).join('')}</span><span class="rg">${cell(p.r,' rr')}<em>RUS</em></span>`;
const plateH=(q,sz)=>`<span class="pl ${sz} w${q.c} r${tierOf(priceOf(q))}">${inner(q.p)}</span>`;

const ivl=l=>Math.round(4500*Math.pow(.88,l)*(window.NMV?NMV.auto():1)),crewIvl=l=>Math.round(14*Math.pow(.82,l));
const U=[
 {id:'auto',i:'⚡',c:'#ffb627',n:'Автокрутка',max:14,cost:l=>Math.round(8000*Math.pow(2.05,l)),d:l=>l?`Сама крутит раз в ${(ivl(l)/1000).toFixed(1)} с`:'Номера крутятся сами'},
 {id:'multi',i:'🎰',c:'#b36bff',n:'Несколько номеров сразу',max:4,cost:l=>MCOST[l],d:l=>`До ${COUNTS[l]} номеров за одну прокрутку`},
 {id:'sklad',i:'📦',c:'#4aa3ff',n:'Место на складе',max:12,cost:l=>Math.round(1500*Math.pow(1.9,l)),d:l=>`Мест на складе: ${3+l}`},
 {id:'rep',i:'💰',c:'#5fcf7a',n:'Дороже продажа',max:15,cost:l=>Math.round(3000*Math.pow(2.2,l)),d:l=>`Номера продаются дороже: ×${Math.pow(1.08,l).toFixed(2)}`},
 {id:'shop',i:'🛠',c:'#ff7a45',n:'Дешёвые материалы',max:8,cost:l=>Math.round(4000*Math.pow(2.3,l)),d:l=>`Материалы для ремонта дешевле на ${6*l}%`},
 {id:'arch',i:'🗄',c:'#e8c15a',n:'Целые номера',max:6,cost:l=>Math.round(12000*Math.pow(3,l)),d:l=>l?`Чаще выпадают целые номера (ур. ${l})`:'Чаще выпадают целые номера'},
 {id:'luck',i:'🍀',c:'#7bdc9a',n:'Выбор лучшего',max:5,cost:l=>Math.round(20000*Math.pow(3.2,l)),d:l=>`Из ${1+l} номеров вам достаётся лучший`},
 {id:'conn',i:'🏛',c:'#6fc7ff',n:'Редкие регионы',max:6,cost:l=>Math.round(25000*Math.pow(3.3,l)),d:l=>`Шанс редкого региона +${10*Math.min(l,5)}%`},
 {id:'crew',i:'🎓',c:'#ff9bd2',n:'Наставник',max:6,cost:l=>Math.round(30000*Math.pow(2.6,l)),d:l=>l?`Ручной ремонт: номер дороже на +${l}%, опыт цеха +${25*l}%`:'Ручной ремонт приносит больше'},
 {id:'clients',i:'🤝',c:'#c9a6ff',n:'Больше заказов',max:4,cost:l=>Math.round(6000*Math.pow(3,l)),d:l=>`Заказов одновременно: ${2+l}, награда +${10*l}%`}
];

const pl=document.getElementById('plate'),go=document.getElementById('go');
pl.innerHTML=inner({l1:'А',l2:'А',l3:'А',d:'777',r:77});
let busy=false;
function spin(p,dur){
  const fin=[p.l1,...p.d,p.l2,p.l3,String(p.r)],kind=['L','D','D','D','L','L','R'];
  const cs=[...pl.querySelectorAll('.c')];
  return Promise.all(cs.map((el,i)=>new Promise(res=>{
    const st=el.firstChild,old=el.textContent,N=10+i,t=Math.round(dur*(.5+.5*i/6));
    const g=()=>kind[i]=='L'?rnd(LET):kind[i]=='D'?String(Math.floor(Math.random()*10)):String(rnd(REG));
    let h='<span>'+old+'</span>';for(let k=1;k<N;k++)h+='<span>'+g()+'</span>';h+='<span>'+fin[i]+'</span><span>'+g()+'</span>';
    st.style.transition='none';st.style.transform='translateY(0)';st.innerHTML=h;void st.offsetWidth;
    st.style.transition='transform '+t+'ms cubic-bezier(.14,.78,.22,1.07)';st.style.transform='translateY(-'+(N*1.1)+'em)';
    setTimeout(()=>{st.style.transition='none';st.style.transform='none';st.innerHTML='<span>'+fin[i]+'</span>';res()},t+40);
  })));
}
function recTop(q,v){
  S.top.push({p:q.p,year:q.year,c:q.c,pot:q.pot,v});S.top.sort((a,b)=>b.v-a.v);S.top=S.top.slice(0,8);
}
const ROLL_BASE=[100,190,270,340,400];
function rollCost(n){const b=S.biz||{};const discount=Math.min(.25,(b.wholesale||0)*.025);return Math.max(1,Math.round((ROLL_BASE[n-1]||100*n)*(1-discount)*(window.NMV?NMV.roll():1)));}
async function roll(n,dur){
  if(busy)return;const fee=rollCost(n);if(S.money<fee){document.getElementById('gain').textContent='Не хватает денег · нужно '+fmt(fee)+' ₽';return;}S.money-=fee;busy=true;go.disabled=true;
  const rs=[];for(let i=0;i<n;i++)rs.push(pickBest());
  rs.sort((a,b)=>priceOf(b)-priceOf(a));
  const stg=document.querySelector('.stage');pl.className='pl spinning';stg.classList.add('go2');await spin(rs[0].p,dur);stg.classList.remove('go2');
  let sum=0,kept=0;
  rs.forEach(q=>{
    const t=tierOf(priceOf(q));S.tc[t]++;
    const ord=S.ord.some(o=>fits(q,o));
    if(S.inv.length<slots()&&(ord||(q.c<4&&q.pot>=THR[S.thr]))){S.inv.push(q);q.st=ord?'заказ':'склад';kept++}
    else{const v=sellVal(q);sum+=v;S.money+=v;S.earned+=v;q.st='продан';if(v>=3000)recTop(q,v)}
    q.v=sellVal(q);
  });
  S.rolls+=n;
  const b=rs[0],bt=tierOf(priceOf(b));
  pl.className='pl w'+b.c+' r'+bt;
  if(bt>=3){pl.classList.remove('shine');void pl.offsetWidth;pl.classList.add('shine')}
  if(bt>=2){pl.classList.remove('zm2','zm3','zm4');void pl.offsetWidth;pl.classList.add('zm'+bt);burst(bt)}
  document.getElementById('meta').innerHTML=`<span style="color:${CC[b.c]}">${CN[b.c]}</span> · выдан в ${b.year}`+(b.year<=2000?' · раритет':'');
  const g=document.getElementById('gain');g.className='t'+bt;g.textContent=(sum?`+${fmt(sum)} ₽`:'на склад')+(kept&&sum?` · на склад: ${kept}`:'');
  document.getElementById('batch').style.display='block';
  document.getElementById('bl').innerHTML=rs.map(q=>`<div class="it">${plateH(q,'mini')}<div class="rm"><b class="t${tierOf(priceOf(q))}">${fmt(q.v)} ₽</b><span><span style="color:${CC[q.c]}">${CN[q.c]}</span> · ${q.year}</span></div><span class="tag" style="color:${q.st=='заказ'?'#b36bff':q.st=='склад'?'#4aa3ff':'#8a92a3'}">${q.st}</span></div>`).join('');
  save();draw();busy=false;go.disabled=false;
}
const cnt=()=>COUNTS[Math.min(S.sel,S.lv.multi)];
go.onclick=()=>roll(cnt(),cnt()>1?600:750);
(async function loop(){
  for(;;){
    if(S.autoOn&&S.lv.auto>0&&!busy){
      const t=ivl(S.lv.auto),d=Math.min(700,Math.round(t*.7));
      await roll(cnt(),d);await sleep(Math.max(40,t-d));
    }else await sleep(200);
  }
})();

// FIX: instant restore теперь 2x дороже (workshop эффективнее)
const stepOf=q=>q.c<4?q.pot*(M[q.c+1]-M[q.c]):0;
const costOf=q=>Math.max(1,Math.round((300*(q.c+1)+.6*stepOf(q))*shopF()*(1-Math.min(.3,(S.biz.workshop||0)*.025))));
function restore(i){const q=S.inv[i],c=costOf(q);if(!q||q.c>=4||S.money<c)return false;S.money-=c;q.c++;S.restored++;bizTrack('restore');return true}
function sell(i){const q=S.inv[i];if(!q||q.lock)return;const v=Math.round(sellVal(q)*(1+(S.biz.marketing||0)*.012));S.money+=v;S.earned+=v;bizTrack('sales');if(v>=3000)recTop(q,v);S.inv.splice(i,1)}
document.getElementById('wh').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.a=='w'){toWorkshop(+b.dataset.i);return}else if(b.dataset.a=='s')sell(+b.dataset.i);
  else if(b.dataset.a=='all'){
    // FIX: продаём всё, кроме номеров под заказы
    const orderSafe=S.inv.map(q=>S.ord.some(o=>fits(q,o)));
    const safeCount=orderSafe.filter(x=>!x).length;
    if(!safeCount){alert('Все номера на складе подходят под заказы — продавать нечего.');return}
    const keep=S.inv.length-safeCount;
    const plur=(n,a,b,c)=>n%10===1&&n%100!==11?a:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?b:c;
    const w=plur(safeCount,'номер','номера','номеров');
    const msg=keep?` ${keep} ${plur(keep,'останется','останутся','останутся')} под заказами.`:'';
    if(!confirm(`Продать ${safeCount} ${w}?${msg}`))return;
    for(let i=S.inv.length-1;i>=0;i--){if(!orderSafe[i])sell(i)}
    save();draw();return;
  }
  else if(b.dataset.a=='g'){const i=+b.dataset.i;if(S.col.length<12&&S.inv[i]){S.col.push(S.inv[i]);S.inv.splice(i,1)}}
  else if(b.dataset.a=='list'){listForShowcase(+b.dataset.i);return}
  save();draw();
};
// FIX: lastCrew персистится в S
setInterval(()=>{
  return;/* v4: склад больше не ремонтирует номера сам */
  let bi=-1,bg=0;
  S.inv.forEach((q,i)=>{if(q.c<4){const c=costOf(q),gain=stepOf(q)*repM()-c;if(S.money>=c&&gain>bg){bg=gain;bi=i}}});
  S.lastCrew=Date.now();
  if(bi>=0&&restore(bi)){save();draw()}
},500);

let shown=S.money,anim=0,flashId=null,wsort='price',wfilt='all';
function animMoney(){
  const el=document.getElementById('money'),from=shown,to=S.money;cancelAnimationFrame(anim);
  if(from===to){el.textContent=fmt(to)+' ₽';return}
  if(to>from){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
  const t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/450),e=1-Math.pow(1-k,3);shown=from+(to-from)*e;el.textContent=fmt(shown)+' ₽';if(k<1)anim=requestAnimationFrame(f);else shown=to})(t0);
}
function burst(t){
  try{if(JSON.parse(localStorage.getItem('nomera-settings')||'{}').effects===false)return}catch(e){}
  const st=document.querySelector('.stage'),f=document.createElement('div');f.className='flash f'+t;st.appendChild(f);setTimeout(()=>f.remove(),800);st.insertAdjacentHTML('beforeend','<div class="ring k'+t+'"></div><div class="tl t'+t+'">'+TN[t]+'</div>');setTimeout(()=>st.querySelectorAll('.ring,.tl').forEach(x=>x.remove()),1500);
  for(let i=0;i<(t>=4?48:t>=3?32:18);i++){const p=document.createElement('i'),a=Math.random()*6.28,r=60+Math.random()*120;p.className='pt';
    p.style.cssText=`--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r*.7}px;--c:${(t>=4?['#ffd25a','#ffb627','#fff2b0']:t>=3?['#c084fc','#a855f7','#f0e1ff']:['#7cc4ff','#4aa3ff','#dff0ff'])[i%3]}`;st.appendChild(p);setTimeout(()=>p.remove(),1000)}
  try{navigator.vibrate&&navigator.vibrate(t>=4?[40,40,80]:t>=3?[30,30,50]:25)}catch(e){}
}
const RK={price:q=>-sellVal(q),rar:q=>-tierOf(priceOf(q))*1e9-priceOf(q),cond:q=>q.c};
function whIdx(){return S.inv.map((q,i)=>i).filter(i=>{const q=S.inv[i];return wfilt=='all'||(wfilt=='ord'&&S.ord.some(o=>fits(q,o)))||(wfilt=='rest'&&q.c<4)}).sort((a,b)=>RK[wsort](S.inv[a])-RK[wsort](S.inv[b]))}
document.getElementById('wctl').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.k=='s')wsort=b.dataset.v;else wfilt=b.dataset.v;draw()};
// FIX: fillOrders убран из draw() (вызывается в init, после clients upgrade, и после reset)
function draw(){
  ensureBiz();
  animMoney();
  document.getElementById('rate').innerHTML=`Круток: ${fmt(S.rolls)}<br>Склад: ${S.inv.length}/${slots()}<br>×${cnt()} · ${fmt(rollCost(cnt()))} ₽`;
  const au=document.getElementById('au');au.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';au.title=S.lv.auto?'Автокрутка: '+(S.autoOn?'включена':'выключена'):'Автокрутка не куплена';au.className='au'+(S.lv.auto?(S.autoOn?' on':''):' lock');if(S.lv.auto)document.getElementById('ahint').hidden=true;
  const c=document.getElementById('cnt');c.innerHTML='';go.textContent='Крутить · '+fmt(rollCost(cnt()))+' ₽';go.disabled=busy||S.money<rollCost(cnt());
  COUNTS.forEach((n,i)=>{const b=document.createElement('button'),lock=i>S.lv.multi;b.textContent=lock?'🔒':'×'+n;b.disabled=lock;b.className=i==Math.min(S.sel,S.lv.multi)?'on':'';b.onclick=()=>{S.sel=i;save();draw()};c.appendChild(b)});
  const th=document.getElementById('thr');th.innerHTML='';
  THL.forEach((l,i)=>{const b=document.createElement('button');b.textContent=l;b.className=i==S.thr?'on':'';b.onclick=()=>{S.thr=i;save();draw()};th.appendChild(b)});
  const nw=document.getElementById('nw');nw.querySelector('.bdg').textContent=S.inv.length||'';
  document.getElementById('whh').textContent='Занято '+S.inv.length+' из '+slots()+' мест. Ремонт делается вручную в мастерской — так номер стоит дороже.';
  const wh=document.getElementById('wh');
  if(!S.inv.length)wh.innerHTML='<div class="empty">Склад пуст. Ценные потёртые номера будут попадать сюда при крутке.</div>';
  else {
    const idx=whIdx();
    wh.innerHTML=(idx.length?idx.map(i=>{const q=S.inv[i];
      const full=q.c>=4,cost=costOf(q),now=sellVal(q),next=Math.round(q.pot*M[q.c+1]*repM()*evM(q));
      const order=S.ord.some(o=>fits(q,o));
      const tier=tierOf(priceOf(q));
      return `<article class="wh wh-tier-${tier}"><div class="storage-top"><div class="storage-plate">${plateH(q,'big')}</div><div class="storage-meta"><b class="t${tier}">${fmt(now)} ₽</b><span>Выдан в<br>${q.year}</span>${q.year<=2000?'<small>Раритет</small>':''}${order?'<small class="order-mark">Под<br>заказ</small>':''}${evM(q)!=1?`<small>${evM(q)>1?'Спрос ↑':'Спрос ↓'}</small>`:''}</div></div>`+
      `<div class="nums"><span><i class="dot" style="background:${full?'#3282ff':tier>=3?'#ad42fd':'#ffd041'}"></i><b>${CN[q.c]}</b></span><span>${full?'Лучшее состояние':'После ремонта в мастерской: <b>'+fmt(next)+' ₽</b>'}</span></div>`+
      `<div class="acts"><button class="br" data-a="w" data-i="${i}" ${full?'disabled':''}>${full?'Как новый':'В мастерскую'}</button><button class="bs" data-a="s" data-i="${i}">Продать</button><button class="bg" data-a="g" data-i="${i}" ${S.col.length>=12?'disabled':''}>В гараж</button><button class="bg" data-a="list" data-i="${i}" ${S.biz.showcase.length>=1+S.biz.shop+(S.biz.branches||0)?'disabled':''}>На<br>витрину</button></div></article>`;
    }).join(''):'<div class="empty">Нет номеров, подходящих под выбранный фильтр.</div>')+`<button class="sell-all" data-a="all">Продать всё (кроме заказных)</button>`;
  }
  document.getElementById('ord').innerHTML=S.ord.slice(0,oSlots()).map((o,i)=>{
    const qi=oCand(o),q=qi>=0?S.inv[qi]:null,v=q?Math.round(priceOf(q)*repM()*oMult(o)):0;
    return `<div class="ord"><div class="ot"><b>${oText(o)}</b><span class="mu">×${oMult(o).toFixed(1)}</span></div><div class="ob"><button data-a="o" data-i="${i}" ${q?'':'disabled'}>${q?'Сдать · +'+fmt(v)+' ₽':'Нет подходящего на складе'}</button><button class="sw" data-a="sw" data-i="${i}">Другой</button></div></div>`;
  }).join('');
  const filters=[['s','price','По цене','<svg viewBox="0 0 24 24"><path d="M7 3v15m-3-3 3 3 3-3M17 21V6m-3 3 3-3 3 3M3 6h10M11 18h10"/></svg>'],['s','rar','По редкости','<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="m12 2 3 6.4 7 .8-5.2 5 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.2l7-.8z"/></svg>'],['s','cond','По состоянию','<svg viewBox="0 0 24 24"><path d="M14 4a6 6 0 0 0 6 8l-7 7-4-4 7-7a6 6 0 0 0-2-4ZM3 18l3 3 3-3-3-3z"/></svg>'],['f','all','Все',''],['f','ord','Под заказ',''],['f','rest','Требуют ремонта','']];
  const ctrl=([k,v,l,icon])=>`<button data-k="${k}" data-v="${v}" class="${(k=='s'?wsort:wfilt)==v?'on':''}">${icon?'<span class="filter-icon" aria-hidden="true">'+icon+'</span>':''}${l}</button>`;
  document.getElementById('wctl').innerHTML='<div class="sort-filters">'+filters.slice(0,3).map(ctrl).join('')+'</div><div class="type-filters">'+filters.slice(3).map(ctrl).join('')+'</div>';
  const box=document.getElementById('ups');box.innerHTML='';const UG=['Прокрутка номеров','Склад и продажи','Ручной ремонт'],UGR={auto:0,multi:0,luck:0,arch:0,conn:0,sklad:1,rep:1,clients:1,shop:2,crew:2};let lastG=-1,grp=null;
  [...U].sort((a,b)=>(UGR[a.id]??9)-(UGR[b.id]??9)).forEach(u=>{const gi=UGR[u.id]??9;if(gi!==lastG){lastG=gi;const gh=document.createElement('h3');gh.className='sec-t up-group';gh.textContent=UG[gi]||'Другое';box.appendChild(gh);grp=document.createElement('div');grp.className='ug';box.appendChild(grp)}
    const l=S.lv[u.id],full=l>=u.max,cost=full?0:u.cost(l);
    const el=document.createElement('div');el.className='up'+(flashId==u.id?' bought':'');el.style.setProperty('--c',u.c);
    const pips=Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('');
    el.innerHTML=`<div class="uh"><div class="ic">${u.i}</div><div class="un"><b>${u.n}</b><span>${u.d(l)}</span></div><div class="lv">${l}<small>/${u.max}</small></div></div>`+(full?'':`<div class="nx">Дальше: ${u.d(l+1)}</div>`)+`<div class="pips">${pips}</div>`;
    const b=document.createElement('button');
    b.innerHTML=full?'<em>Максимум</em>':`<span class="fill" style="width:${Math.min(100,S.money/cost*100)}%"></span><em>${fmt(cost)} ₽</em>`;b.disabled=full||S.money<cost;
    b.onclick=()=>{if(S.money>=cost&&!full){S.money-=cost;S.lv[u.id]++;if(u.id=='auto'&&S.lv.auto==1)S.autoOn=true;if(u.id=='multi')S.sel=S.lv.multi;if(u.id=='crew')S.lastCrew=Date.now();if(u.id=='clients')fillOrders();save();flashId=u.id;draw();flashId=null;try{navigator.vibrate&&navigator.vibrate(18)}catch(e){}}};
    el.appendChild(b);(grp||box).appendChild(el);
  });
  drawBusiness();
  document.getElementById('gar').innerHTML=S.col.length?S.col.map(q=>`<div class="gi">${plateH(q,'mini')}<b class="t${tierOf(priceOf(q))}">${fmt(priceOf(q))} ₽</b><span class="sub">${CN[q.c]} · ${q.year}</span></div>`).join(''):'<div class="empty" style="grid-column:1/-1">Витрина пуста. Отправляй лучшие номера со склада кнопкой «В гараж».</div>';
  document.getElementById('gh').textContent=`Витрина: ${S.col.length}/12 · бонус к цене продажи +${S.col.length}%`;
  document.getElementById('tc').innerHTML=S.tc.map((n,i)=>`<div class="t${i}"><b>${fmt(n)}</b>${TN[i]}</div>`).join('');
  document.getElementById('kv').innerHTML=`<div class="kv"><span>Всего заработано</span><b>${fmt(S.earned)} ₽</b></div><div class="kv"><span>Номеров прокручено</span><b>${fmt(S.rolls)}</b></div><div class="kv"><span>Реставраций сделано</span><b>${fmt(S.restored)}</b></div><div class="kv"><span>Заказов выполнено</span><b>${fmt(S.done)}</b></div>`;
  document.getElementById('top').innerHTML=S.top.length?S.top.map(x=>`<div class="it">${plateH(x,'mini')}<div class="rm"><b class="t${tierOf(x.v)}">${fmt(x.v)} ₽</b><span>${CN[x.c]} · ${x.year}</span></div></div>`).join(''):'<div class="empty">Пока ничего дороже 3 тыс не продано.</div>';
}
document.getElementById('ord').onclick=e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const i=+b.dataset.i,o=S.ord[i];
  if(b.dataset.a=='sw')S.ord[i]=newOrder();
  else{const qi=oCand(o);if(qi<0)return;const q=S.inv[qi],v=Math.round(priceOf(q)*repM()*oMult(o));
    S.money+=v;S.earned+=v;S.done++;bizTrack('orders');if(v>=3000)recTop(q,v);S.inv.splice(qi,1);S.ord[i]=newOrder()}
  save();draw();
};
function tickEv(){
  const now=Date.now();
  if(S.ev&&now>=S.ev.until){S.ev=null;draw()}
  if(!S.ev&&now>=S.nextEv){const e=rnd(EVS);S.ev={id:e.id,until:now+(75+Math.random()*45)*1000};S.nextEv=S.ev.until+(40+Math.random()*50)*1000;save();draw()}
  const el=document.getElementById('ev');
  if(S.ev){const e=EVS.find(x=>x.id==S.ev.id);el.className=e.m>1?'up2':'dn';el.innerHTML=`<span>${e.m>1?'📈':'📉'} ${e.t} ×${e.m}</span><b>${Math.max(0,Math.ceil((S.ev.until-now)/1000))} с</b>`}else{el.className='';el.innerHTML=''}
}
if(!S.nextEv)S.nextEv=Date.now()+25000;
setInterval(tickEv,1000);
let aht=0;document.getElementById('au').onclick=()=>{if(!S.lv.auto){try{if(JSON.parse(localStorage.getItem('nomera-settings')||'{}').hints===false)return}catch(e){}const h=document.getElementById('ahint');h.hidden=false;clearTimeout(aht);aht=setTimeout(()=>h.hidden=true,7000);return}S.autoOn=!S.autoOn;save();draw()};
document.getElementById('ahbuy').onclick=()=>{document.getElementById('ahint').hidden=true;document.querySelector('.sb[data-t="t3"]').click();const c=document.getElementById('ups').firstElementChild;if(c){c.scrollIntoView({block:'center',behavior:'smooth'});c.classList.remove('bought');void c.offsetWidth;c.classList.add('bought')}};
document.querySelectorAll('.sb').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('.sb').forEach(x=>x.classList.toggle('on',x==b));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('show',t.id==b.dataset.t));
});
document.querySelector('.balance-link').onclick=()=>{document.querySelector('.sb[data-t="t1"]').click();document.querySelector('.top').scrollIntoView({block:'start',behavior:'smooth'})};document.getElementById('premium-info').onclick=()=>say('Премиум-возможности пока недоступны');
document.getElementById('reset').onclick=()=>{if(confirm('Сбросить весь прогресс?')){S=DEF();shown=0;fillOrders();save(true);draw()}};
ensureBiz();
fillOrders();
draw();

/* ===== DESKTOP: layout switch, hotkeys, click safety ===== */
(function(){
 const mq=matchMedia('(min-width:1100px)'),tabBtn=id=>document.querySelector('.sb[data-t="'+id+'"]');
 let dirty=false,tm=0;
 const _d=draw,_b=drawBusiness;
 draw=function(){if(down)dirty=true;else{_d();ui();wkSync()}};
 drawBusiness=function(){down?dirty=true:_b()};
 const release=()=>{clearTimeout(tm);setTimeout(()=>{down=false;if(dirty){dirty=false;draw()}},0)};
 addEventListener('pointerdown',()=>{down=true;clearTimeout(tm);tm=setTimeout(release,1500)},true);
 ['pointerup','pointercancel','blur','dragend'].forEach(ev=>addEventListener(ev,release,true));
 document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');const t=g?g.dataset.go:e.target.closest('#bell')?(+document.getElementById('belln').dataset.o?'t1':'t5'):0;if(t){const b=document.querySelector('.sb[data-t="'+t+'"]');if(b)b.click()}});
 addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
  const c=e.code;
  if(c==='Space'){if(e.target.closest&&e.target.closest('#t7 button,#t7 a'))return;e.preventDefault();if(e.repeat)return;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();if(!go.disabled)go.click()}
  else if(c==='KeyA')document.getElementById('au').click();
  else if(c==='ArrowRight'||c==='ArrowLeft'){const max=Math.min(S.lv.multi,COUNTS.length-1),cur=Math.min(S.sel,max),n=Math.max(0,Math.min(max,cur+(c==='ArrowRight'?1:-1)));if(n!==cur){S.sel=n;save();draw()}}
  else if(/^Digit[1-8]$/.test(c)){const id=['t1','t5','t2','t8','t3','t4','t6','t7'][+c[5]-1];const b=document.querySelector('.sb[data-t="'+id+'"]');if(b)b.click()}
 });
})();
/* ===== REDESIGN: live widgets ===== */
const $=id=>document.getElementById(id);
function rec(){const h=S.hist=S.hist||[],n=Date.now();if(!h.length||n-h[h.length-1][0]>=30000){h.push([n,S.earned,S.money]);if(h.length>2000)S.hist=h.filter((_,i)=>i%2==0||i>h.length-500);save()}}
const hAt=(t,k)=>{const h=S.hist;let r=null;for(const e of h){if(e[0]<=t)r=e;else break}return r?r[k]:(h.length?h[0][k]:0)};
function bsvg(t){const bw=[150,230,300][t],fl=[1,2,3][t],x0=(340-bw)/2,top=124-fl*34;let o='<svg viewBox="0 0 340 130"><rect width="340" height="130" fill="#0b0a17"/>';
 if(t>1)o+='<rect x="8" y="84" width="46" height="40" fill="#1a1536" stroke="#a78bfa55"/><rect x="286" y="84" width="46" height="40" fill="#1a1536" stroke="#a78bfa55"/>';
 o+=`<rect x="${x0}" y="${top}" width="${bw}" height="${fl*34}" fill="#1c1738" stroke="#a78bfa" stroke-opacity=".6"/>`;
 for(let f=0;f<fl;f++)for(let i=0;i<Math.floor((bw-10)/28);i++)o+=`<rect x="${x0+9+i*28}" y="${top+6+f*34}" width="20" height="22" rx="2" fill="#ffc247" opacity="${.55+((i+f)%3)*.15}"/>`;
 return o+`<text x="170" y="${top-6}" text-anchor="middle" fill="#ddd6fe" font-size="11" font-weight="800" letter-spacing="3" font-family="Manrope">NOMERA</text><rect y="124" width="340" height="6" fill="#2a2250"/></svg>`}
let lastT=-1;
function ui(){
 if(!S.hist)S.hist=[];rec();const n=Date.now(),b=bizLevel(),h=S.hist;
 const from=Math.max(n-36e5,h.length?h[0][0]:n),sp=(n-from)/36e5,ph=sp>.005?(S.earned-hAt(from,1))/sp:0;
 const pi=(S.biz.staff||0)*2100;$('ph').textContent='+'+fmt(pi)+' ₽';$('phs').textContent=pi?'от персонала, не зависит от удачи':'Даёт персонал в разделе «Бизнес»';
 $('lvn').textContent=b.lv;$('lvx').style.width=Math.min(100,b.xp/b.next*100)+'%';$('lvt').textContent=fmt(b.xp)+' / '+fmt(b.next)+' XP';
 const o=S.ord.slice(0,oSlots()).filter(x=>oCand(x)>=0).length,r=(S.biz.showcase||[]).filter(x=>n>=x.readyAt).length;
 /* v1.2.1: #belln is owned by addons.js badge() */
 $('cost').textContent=fmt(rollCost(cnt()))+' ₽';
 if(b.lv<4?0:b.lv<8?1:2,lastT!==(b.lv<4?0:b.lv<8?1:2)){lastT=b.lv<4?0:b.lv<8?1:2;$('bsvg').innerHTML=bsvg(lastT)}
 $('bpi').textContent='+'+fmt((S.biz.staff||0)*2100)+' ₽';$('bcap').textContent=S.inv.length+' / '+slots();
 const cs=BIZ_UPS.filter(u=>(S.biz[u.id]||0)<u.max).map(u=>Math.round(u.base*Math.pow(u.mul,S.biz[u.id]||0)));$('bfrom').textContent=cs.length?'от '+fmt(Math.min(...cs))+' ₽':'Максимум';
 $('whn').textContent=S.inv.length+' номеров';
 $('whp').innerHTML=S.inv.length?S.inv.slice(0,3).map(q=>plateH(q,'mini')).join('')+(S.inv.length>3?'<span class="more">+'+(S.inv.length-3)+'</span>':''):'<span class="sub">Склад пуст</span>';
 $('ordn').textContent=S.ord.slice(0,oSlots()).length;
 $('popl').innerHTML=S.top.length?S.top.slice(0,3).map(x=>`<div class="pr">${plateH(x,'mini')}<b class="t${tierOf(x.v)}">${fmt(x.v)} ₽<svg><use href="#i-flame"/></svg></b></div>`).join(''):'<div class="empty">Продайте номер дороже 3 тыс, он появится здесь</div>';
 const k=$('per').value,t0=k=='d'?new Date().setHours(0,0,0,0):k=='w'?n-6048e5:k=='m'?n-2592e6:0;
 const inc=k=='a'?S.earned:S.earned-hAt(t0,1),net=k=='a'?S.money-2500:S.money-hAt(t0,2),ex=Math.max(0,inc-net);
 const a0=k=='a'?(h.length?h[0][0]:n-1):t0,N=12,v=[];for(let i=0;i<N-1;i++)v.push(hAt(a0+(n-a0)*(i+1)/(N-1),1)-hAt(a0+(n-a0)*i/(N-1),1));
 const mx=Math.max(1,...v),pt=v.map((y,i)=>[i*300/(N-2),100-y/mx*80]),ln='M'+pt.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
 $('chart').innerHTML=`<defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b5cf6" stop-opacity=".5"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></linearGradient></defs><path d="${ln}L300 110L0 110Z" fill="url(#cg)"/><path d="${ln}" fill="none" stroke="#a78bfa" stroke-width="2"/>`+pt.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#c4b5fd"/>`).join('');
 $('stn').innerHTML=`<b class="pg">+${fmt(inc)} ₽</b><span>Доход</span><b class="${net<0?'':'pg'}" style="${net<0?'color:#ff9b8f':''}">${net<0?'−':'+'}${fmt(Math.abs(net))} ₽</b><span>Чистая прибыль</span><b>${fmt(ex)} ₽</b><span>Расходы · продано ${fmt(S.biz.deals||0)} · круток ${fmt(S.rolls)}</span>`;
}
$('per').onchange=ui;setInterval(()=>{if(!down)ui()},1000);ui();
/* ===== WORKSHOP: ручная реставрация ===== */
function W(){const w=S.wk||(S.wk={jobs:0});if(!w.up)w.up={bench:0,speed:0,stations:0,cap:0};['lamp','vise','store'].forEach(k=>{if(w.up[k]==null)w.up[k]=0});if(!w.tu)w.tu={rust:0,hammer:0,polish:0,paint:0};if(!w.mat)w.mat={clean:3,paste:3,paint:3,paintP:0};if(!w.sk)w.sk={std:0,rest:0,prem:0};if(w.xp==null)w.xp=(w.jobs||0)*4;if(!w.staff)w.staff=[];if(!w.ord)w.ord=[];if(!w.lot)w.lot=[];if(!w.lotAt)w.lotAt=0;return w}
const DK=[['bend','Вмятины'],['fade','Краска знаков'],['dull','Налёт'],['rust','Коррозия']];
const WT={
 rust:{n:'Щётка',s:'Очистка',k:'rust',m:'clean',h:'Этап 1. Нажимайте или водите по номеру — щётка снимает ржавчину. Кружки показывают, где ещё осталась ржавчина.'},
 hammer:{n:'Молоток',s:'Вмятины',k:'bend',h:'Этап 2. Нажимайте по вмятинам — молоток сам бьёт по ближайшей. Чем ближе к центру, тем сильнее.'},
 polish:{n:'Полировка',s:'Полировка',k:'dull',m:'paste',h:'Этап 3. Нажимайте или водите по номеру — полировка убирает налёт.'},
 paint:{n:'Кисть',s:'Покраска',k:'fade',m:'paint',h:'Этап 4. Нажимайте по выцветшим знакам — кисть подкрашивает их.'}
};
const WORD={bend:'hammer',dull:'polish',fade:'paint',rust:'rust'};
const WORDER=['rust','hammer','polish','paint'];const TDEF={hammer:{w:140,h:140,hx:12,hy:25,ox:70,oy:136,r:0},polish:{w:120,h:90,hx:60,hy:45,ox:60,oy:45,r:0},paint:{w:60,h:150,hx:30,hy:141,ox:30,oy:141,r:24},rust:{w:120,h:110,hx:60,hy:98,ox:60,oy:98,r:0}};
const TSVG={
 hammer:`<svg viewBox="0 0 140 140"><rect x="62" y="30" width="16" height="108" rx="7" fill="#9a6a3a"/><rect x="62" y="30" width="6" height="108" rx="3" fill="#bf8a50"/><rect x="22" y="8" width="92" height="34" rx="6" fill="#7b8596"/><rect x="22" y="8" width="92" height="12" rx="6" fill="#b3bccb"/><rect x="12" y="10" width="14" height="30" rx="3" fill="#dde3ee"/><path d="M114 12q22 5 24 17q-12-3-24 7z" fill="#6b7585"/></svg>`,
 polish:`<svg viewBox="0 0 120 90"><g transform="rotate(-8 60 45)"><rect x="8" y="14" width="104" height="62" rx="16" fill="#eef1f7" stroke="#aeb7c8" stroke-width="2"/><path d="M20 30q40 10 80 0M20 46q40 10 80 0M20 62q40 10 80 0" stroke="#c7cfdd" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="92" cy="30" r="5" fill="#d9c98a" opacity=".7"/></g></svg>`,
 paint:`<svg viewBox="0 0 60 150"><path d="M22 84Q30 2 38 84z" fill="#b57a42"/><path d="M22 84Q26 20 30 12 28 60 25 84z" fill="#d49a60" opacity=".6"/><rect x="18" y="82" width="24" height="28" rx="3" fill="#aeb6c4"/><rect x="18" y="82" width="8" height="28" fill="#dbe1ec"/><path d="M20 110h20l-3 29q-7 6-14 0z" fill="#171717"/></svg>`,
 rust:`<svg viewBox="0 0 120 110"><path d="M20 32q40-34 80 0v12H20z" fill="#9a6a3a"/><path d="M26 30q34-26 68 0" stroke="#c18d55" stroke-width="3" fill="none"/><rect x="14" y="42" width="92" height="14" rx="3" fill="#8a929f"/><rect x="18" y="56" width="84" height="40" rx="3" fill="#4a4f5a"/><path d="${Array.from({length:10},(_,i)=>'M'+(24+i*8)+' 56v40').join('')}" stroke="#a3acbb" stroke-width="2"/></svg>`
};
const wearOf=d=>d.bend*.3+d.fade*.3+d.dull*.2+d.rust*.2,skillQ=()=>(1+Math.min(.5,(W().jobs||0)/150))*(1+.08*W().up.speed);
function recalc(q){const w=wearOf(q.d);q.c=w<14?4:w<34?3:w<56?2:w<78?1:0;q.dc=q.c}
// FIX: расходники дешевле с workshop (как и написано в апгрейде)
const MAT={clean:{n:'Чистящее средство',u:'Этап 1',p:90},paste:{n:'Полировочная паста',u:'Этап 3',p:70},paint:{n:'Краска',u:'Этап 4',p:130},paintP:{n:'Премиум-краска',u:'Этап 4 · +4% к цене',p:420}};
const MATI={clean:'🧴',paste:'🧽',paint:'🎨',paintP:'✨'},MATU={clean:'rust',paste:'polish',paint:'paint',paintP:'paint'};
const matP=k=>Math.round(MAT[k].p*shopF()*(1-Math.min(.3,(S.biz.workshop||0)*.025))*(1-.04*(W().up.store||0))*(window.NMV?NMV.mat():1));
const stock=t=>{const m=W().mat;return t==='paint'?m.paint+m.paintP:m[WT[t].m]};
const SPEC={std:{n:'Обычный ремонт',lv:1,d:'Обычные и красивые номера'},rest:{n:'Реставрация',lv:2,d:'Редкие номера'},prem:{n:'Премиум-обработка',lv:4,d:'Эпик и легенды'}};
const wClass=q=>{const t=tierOf(q.pot*1.3);return t<=1?'std':t==2?'rest':'prem'};
const specB=q=>Math.min(.05,.001*(W().sk[wClass(q)]||0));
const kOf=q=>Math.min(.09,(q.j||0)*.015)+.015*W().up.bench+specB(q)+(q.pr?.04:0)+.01*(S.lv.crew||0);
const LVX=[0,40,120,260,500,900,1500,2400];
const wLv=()=>{const x=W().xp;let l=1;while(l<LVX.length&&x>=LVX[l])l++;return l};
function wXp(n){const a=wLv();W().xp+=n;if(wLv()>a)say('Мастерская: уровень '+wLv()+'!')}
function genDn(q){const d=q.d;q.dn=[];if(d.bend<3){d.bend=0;return}
 const n=Math.min(8,Math.max(1,Math.round(d.bend/13))),w=Array.from({length:n},()=>.5+Math.random()),sw=w.reduce((a,b)=>a+b,0);
 for(let i=0;i<n;i++){let x,y,t=0;do{x=.1+Math.random()*.8;y=.22+Math.random()*.56;t++}while(t<12&&q.dn.some(o=>Math.hypot((o.x-x)*4,o.y-y)<.34));q.dn.push({x,y,s:d.bend*1.5*w[i]/sw,u:Math.random()})}}
function genCf(q){const d=q.d;if(d.fade<3){q.cf=Array(7).fill(0);d.fade=0;return}
 const r=Array.from({length:7},()=>.4+Math.random()*1.2),m=r.reduce((a,b)=>a+b,0)/7;q.cf=r.map(x=>Math.min(100,x*d.fade/m));d.fade=q.cf.reduce((a,b)=>a+b,0)/7}
function ensureD(q){
 if(!q.id)q.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 if(!(q.d&&q.dc===q.c)){
  const R=[[80,98],[58,76],[36,54],[16,32],[2,12]][q.c],W0=R[0]+Math.random()*(R[1]-R[0]),w=[.3,.3,.2,.2],K=['bend','fade','dull','rust'],r=K.map(()=>.4+Math.random()*1.2),s=r.reduce((a,x,i)=>a+x*w[i],0);
  q.d={};K.forEach((k,i)=>q.d[k]=Math.min(100,Math.max(0,r[i]*W0/s)));q.dc=q.c;q.dn=null;q.cf=null;q.pd=null}
 if(!q.dn)genDn(q);if(!q.cf)genCf(q);if(!q.pd)q.pd={};
 return q.d}
let wsel=null,B=null,wlast=['','',''];
function curQ(){S.inv.forEach(ensureD);const a=S.inv.filter(q=>!q.lock);return a.find(q=>q.id===wsel)||(a.length?(wsel=a[0].id,a[0]):null)}

const TEL=document.createElement('div');TEL.id='tool';TEL.innerHTML='<div id="tin"></div>';document.body.appendChild(TEL);
const TIN=TEL.firstChild;let T='rust',HX=0,HY=0,snd1=true,AC=null,NB=null;
function setTool(t){T=t;TEL.dataset.lv=TL(t);const f=TDEF[t];TIN.innerHTML=TOOLSVG(t,TL(t));TIN.style.width=f.w+'px';TIN.style.height=f.h+'px';TIN.style.transformOrigin=f.ox+'px '+f.oy+'px';TIN.style.setProperty('--r0',f.r+'deg');TIN.style.setProperty('--tilt','0deg');HX=f.hx;HY=f.hy;
 document.querySelectorAll('.bwt').forEach(b=>b.classList.toggle('on',b.dataset.tool===t));const h=$('bhint');if(h)h.textContent=WT[t].h;refSteps()}
const toolMove=e=>{TEL.style.transform='translate('+(e.clientX-HX)+'px,'+(e.clientY-HY)+'px)'};
const toolShow=e=>{toolMove(e);TEL.style.display='block'};
const toolHide=()=>{TEL.style.display='none';TEL.classList.remove('pr')};
function swing(){TIN.classList.remove('swing');void TIN.offsetWidth;TIN.classList.add('swing')}

function ac(){if(!snd1)return null;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){return null}return AC}
function noise(a,t,dur,fr,q,g,type){if(!NB){NB=a.createBuffer(1,a.sampleRate,a.sampleRate);const c=NB.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1}
 const s=a.createBufferSource();s.buffer=NB;s.loop=true;const f=a.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=fr;f.Q.value=q;const gn=a.createGain();gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(f);f.connect(gn);gn.connect(a.destination);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
function tone(a,t,f,g,dur,type){const o=a.createOscillator(),gn=a.createGain();o.type=type||'triangle';o.frequency.value=f;gn.gain.setValueAtTime(g,t);gn.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(gn);gn.connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function snd(k,v){const a=ac();if(!a)return;const t=a.currentTime;v=v||1;
 if(k==='hit'){[[640,.5],[1710,.3],[2950,.15]].forEach(([f,g])=>tone(a,t,f*(.97+Math.random()*.06),.16*g*v,.5));noise(a,t,.05,3500,.7,.25*v,'highpass')}
 else if(k==='thud'){const o=a.createOscillator(),gn=a.createGain();o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(55,t+.12);gn.gain.setValueAtTime(.35*v,t);gn.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(gn);gn.connect(a.destination);o.start(t);o.stop(t+.2);noise(a,t,.06,900,.8,.2*v,'lowpass')}
 else if(k==='rub')noise(a,t,.09,2600,.9,.07*v,'bandpass');
 else if(k==='scr')noise(a,t,.07,4200,1.2,.09*v,'highpass');
 else if(k==='wet')noise(a,t,.1,1500,.6,.04*v,'bandpass');
 else if(k==='ok'){[660,880,1320].forEach((f,i)=>tone(a,t+i*.08,f,.12,.4,'sine'))}}

function fxSpark(cx,cy,col,n){if(!B)return;const br=B.be.getBoundingClientRect();for(let i=0;i<n;i++){const p=document.createElement('i');p.className='spk';const a=Math.random()*6.28,r=18+Math.random()*34;p.style.cssText=`left:${cx-br.left}px;top:${cy-br.top}px;--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r-8}px;background:${col}`;B.be.appendChild(p);setTimeout(()=>p.remove(),520)}}
function ring(cx,cy){const br=B.be.getBoundingClientRect(),p=document.createElement('i');p.className='rp';p.style.cssText=`left:${cx-br.left}px;top:${cy-br.top}px`;B.be.appendChild(p);setTimeout(()=>p.remove(),240)}
function say(t,w){const m=$('bmsg');if(!m)return;m.textContent=t;m.className='bmsg'+(w?' warn':'')}

const ctx2=c=>c.getContext('2d',{willReadFrequently:true});
function sumA(c){const dt=ctx2(c).getImageData(0,0,c.width,c.height).data;let s=0;for(let i=3;i<dt.length;i+=16)s+=dt[i];return s}
function drawGrime(c,w,h,v){c.clearRect(0,0,w,h);const a=.08+Math.min(100,v)/100*.30;c.fillStyle=`rgba(118,104,66,${a})`;c.fillRect(0,0,w,h);
 for(let i=0;i<44;i++){const x=Math.random()*w,y=Math.random()*h,r=(.05+Math.random()*.17)*w,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(70,58,30,${a*.55})`);g.addColorStop(1,'rgba(70,58,30,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,6.3);c.fill()}
 c.strokeStyle=`rgba(60,50,28,${a*.4})`;c.lineWidth=2;for(let i=0;i<10;i++){const y=Math.random()*h,x=Math.random()*w;c.beginPath();c.moveTo(x,y);c.lineTo(x+w*(.1+Math.random()*.25),y+(Math.random()-.5)*8);c.stroke()}}
function drawRust(c,w,h,v){c.clearRect(0,0,w,h);const n=Math.round(3+v*.10);
 for(let i=0;i<n;i++){let x=Math.random()*w,y=Math.random()*h;if(Math.random()<.65){if(Math.random()<.5)x=Math.random()<.5?Math.random()*w*.12:w-Math.random()*w*.12;else y=Math.random()<.5?Math.random()*h*.2:h-Math.random()*h*.2}
  const R=(.025+Math.random()*.045+v/100*.03)*w;
  for(let j=0;j<3;j++){const ox=x+(Math.random()-.5)*R*1.4,oy=y+(Math.random()-.5)*R*.9,rr=R*(.3+Math.random()*.5),col=Math.random()<.5?'122,53,16':'168,84,26',g=c.createRadialGradient(ox,oy,0,ox,oy,rr);g.addColorStop(0,`rgba(${col},.72)`);g.addColorStop(.6,`rgba(${col},.38)`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.arc(ox,oy,rr,0,6.3);c.fill()}}}

function dSize(s){const H=B.pl.getBoundingClientRect().height||80;return H*(.2+.5*Math.min(1,s/42))}
function renderDents(){const q=B.q,ids=new Set();
 q.dn.forEach(x=>{if(!x.u)x.u=Math.random();ids.add(x.u);let el=B.dEls.get(x.u);if(!el){el=document.createElement('i');el.className='dn';B.dl.appendChild(el);B.dEls.set(x.u,el)}
  const z=dSize(x.s);el.style.cssText=`left:${x.x*100}%;top:${x.y*100}%;width:${z}px;height:${z}px;opacity:${Math.min(1,.45+x.s/60)}`});
 B.dEls.forEach((el,u)=>{if(!ids.has(u)){B.dEls.delete(u);el.style.opacity=0;el.style.width=el.style.height='2px';setTimeout(()=>el.remove(),280)}})}
const chars=()=>[...B.pl.querySelectorAll('.c')];

function sync(){const q=B.q,d=q.d;recalc(q);
 B.pl.className=B.pl.className.replace(/\bw\d\b/,'w'+q.c).replace(/\br\d\b/,'r'+tierOf(priceOf(q)));
 B.pl.style.setProperty('--b',(d.bend/100).toFixed(3));
 chars().forEach((el,i)=>el.style.opacity=(1-q.cf[i]/100*.62).toFixed(2));updUI()}
// FIX: shopRender вызывается из updUI чтобы деньги в магазине не отставали
function updUI(){const q=B.q,d=q.d;
 DK.forEach(([k])=>{const v=d[k],b=$('bb_'+k);if(!b)return;b.style.width=v+'%';b.style.background='hsl('+(120-v*1.2)+',70%,50%)';$('bv_'+k).textContent=Math.round(v)+'%'});
 Object.keys(WT).forEach(t=>{const e=$('tn_'+t);if(e){e.textContent=TN2[t][TL(t)];e.parentNode.dataset.lv=TL(t);const im=e.parentNode.querySelector('.tsv');if(im&&im.dataset.l!=TL(t)){im.dataset.l=TL(t);im.innerHTML=TOOLSVG(t,TL(t))}}});
 const st=(k,t,txt)=>{const e=$('ts_'+k);if(e)e.textContent=txt};
 st('hammer','',d.bend>=3?'вмятин: '+q.dn.length:'ровно ✓');
 ['polish','paint','rust'].forEach(t=>{const w=WT[t];st(t,'',d[w.k]<3?'готово ✓':q.pd[t]?'в работе':stock(t)>0?'запас: '+stock(t):'нет материала')});
  Object.keys(WT).forEach(t=>{const e=$('tn_'+t);if(e)e.parentNode.classList.toggle('fin',d[WT[t].k]<3)});
 const v=sellVal(q),dl=v-B.v0;
 $('bval').innerHTML=`<span style="color:${CC[q.c]}">${CN[q.c]}</span> · выдан в ${q.year} · оценка <b class="gold">${fmt(v)} ₽</b>${dl?` <span style="color:${dl>0?'#5fcf7a':'#ff9b8f'}">(${dl>0?'+':'−'}${fmt(Math.abs(dl))} ₽)</span>`:''}${q.k?' · ручная работа +'+Math.round(q.k*100)+'%':''}`;
 $('bsk').textContent='Цех ур. '+wLv()+' · работ: '+(W().jobs||0)+' · мастерство +'+Math.round((skillQ()-1)*100)+'%';
 shopRender();refUpdate();}
function pay(t){const q=B.q,w=WT[t];if(!w.m||q.pd[t])return true;const m=W().mat;let k=w.m;
 if(t==='paint')k=(m.paintP>0&&(m.paint<1||wClass(q)!=='std'))?'paintP':'paint';
 if(!(m[k]>0)){say('Нет материала: '+MAT[k].n+'. Купите во вкладке «Материалы»',1);return false}
 m[k]--;q.pd[t]=1;if(k==='paintP')q.pr=1;say('Расход: '+MAT[k].n);return true}
function done(k){const q=B.q,d=q.d;d[k]=0;
 if(k==='fade')q.cf=q.cf.map(()=>0);
 if(k==='bend')q.dn=[];
 if(q.pd)q.pd[WORD[k]]=0;
 q.j=(q.j||0)+1;q.k=kOf(q);W().jobs=(W().jobs||0)+1;W().sk[wClass(q)]++;{const tk=WORDER.find(t=>WT[t].k===k);if(tk)W().tu[tk]=(W().tu[tk]||0)+1}wXp(Math.round(4*(1+.25*(S.lv.crew||0))));S.restored++;bizTrack('restore');
 if(k==='dull'||k==='rust'){const cv=k==='dull'?B.cd:B.cr;cv.style.transition='opacity .45s';cv.style.opacity=0}
 B.pl.classList.remove('shine');void B.pl.offsetWidth;B.pl.classList.add('shine');
 snd('ok');workToast('Этап завершён: '+DK.find(x=>x[0]===k)[1]);
 {const nx=WORDER.find(t=>d[WT[t].k]>=3);say(nx?DK.find(x=>x[0]===k)[1]+': готово. Дальше — '+WT[nx].n.toLowerCase():'Номер как новый. Отличная работа!');if(nx&&WT[T].k===k)setTimeout(()=>{if(B&&B.q===q&&B.pl.isConnected)setTool(nx)},700)}
 shopRender();
 save()}

let HB=0,HQ=null;
function hammerHit(cx,cy,fx,fy){if(!B)return;const s={cx:cx,cy:cy,fx:fx,fy:fy,q:B.q,t:Date.now()};if(HB){HQ=s;return}HB=1;B.hb=1;swing();setTimeout(()=>{impact(s.cx,s.cy,s.fx,s.fy,s.q);setTimeout(()=>{HB=0;if(B)B.hb=0;const n=HQ;HQ=null;if(n&&B&&n.q===B.q&&Date.now()-n.t<600)hammerHit(n.cx,n.cy,n.fx,n.fy)},130)},150)}
function impact(cx,cy,fx,fy,sq){
 if(!B||!B.pl.isConnected||(sq&&B.q!==sq))return;const q=B.q,d=q.d,r=B.pl.getBoundingClientRect(),k=Math.min(1.6,skillQ())*(.7+.5*TST.hammer.pw[TL('hammer')]),prev=d.bend,onPlate=fx>=-.08&&fx<=1.08&&fy>=-.08&&fy<=1.08;
 fxSpark(cx,cy,'#ffe6a0',onPlate?9:5);B.bp.classList.remove('hit');void B.bp.offsetWidth;B.bp.classList.add('hit');
 if(!q.dn.length){
  if(d.bend>=3){d.bend=0;renderDents();if(prev>=3)done('bend');sync();save()}
  else{snd('thud',.6);say('Вмятин нет — берите следующий инструмент')}
  return}
 if(!onPlate){snd('thud',.8);say('Удар мимо номера — бейте прямо по знаку',1);return}
 let best=null,bd=1e9;
 q.dn.forEach(x=>{const dist=Math.hypot((fx-x.x)*r.width,(fy-x.y)*r.height);if(dist<bd){bd=dist;best=x}});
 const rad=Math.max(dSize(best.s)/2*2.2,r.width*.32),pw=Math.max(.5,1-Math.min(1,bd/rad));
 best.s-=(18+18*pw)*k;snd('hit',.7+.3*pw);say(pw>.75?'Точно в центр!':'Хороший удар');ring(cx,cy);
 if(best.s<=2)q.dn=q.dn.filter(x=>x!==best);
 d.bend=Math.min(100,q.dn.reduce((a,x)=>a+x.s,0)/1.5);
 if(d.bend<3){q.dn=[];d.bend=0}
 renderDents();
 if(prev>=3&&d.bend<3)done('bend');
 sync();save()}

function strip(cx,cy,m){const q=B.q;let hit=0;chars().forEach((el,i)=>{const r=el.getBoundingClientRect();if(cx>r.left&&cx<r.right&&cy>r.top&&cy<r.bottom){q.cf[i]=Math.min(100,q.cf[i]+(.5+.08*m)*TST.rust.pen[TL('rust')]*.3);hit=1}});
 if(hit){q.d.fade=q.cf.reduce((a,b)=>a+b,0)/7;say('Щётка по чистому металлу стирает краску со знаков',1);sync()}}
function scrub(cx,cy,px,py,L){
 const q=B.q,d=q.d,rust=T==='rust',k=rust?'rust':'dull',m=L?Math.hypot(px-L.x,py-L.y):0,tap=!L;
 if(d[k]<3){if(rust)strip(cx,cy,m);else say('Налёта нет, номер блестит');return}
 if(!pay(T))return;
 const cv=rust?B.cr:B.cd,c=ctx2(cv),r=B.pl.getBoundingClientRect(),kx=cv.width/r.width,ky=cv.height/r.height,
  R=(rust?TST.rust.r[TL('rust')]:TST.polish.r[TL('polish')])*kx*(tap?1.9:1),
  x1=px*kx,y1=py*ky,x0=L?L.x*kx:x1,y0=L?L.y*ky:y1,n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)/(R*.4)));
 c.globalCompositeOperation='destination-out';
 for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/Math.max(1,n),y=y0+(y1-y0)*i/Math.max(1,n),g=c.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,'rgba(0,0,0,.92)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,R,0,6.3);c.fill()}
 c.globalCompositeOperation='source-over';
 const pow=rust?(TST.rust.a[TL('rust')]/TST.rust.a[0]):(TST.polish.a[TL('polish')]/TST.polish.a[0]),sk=Math.min(1.6,skillQ())*(1+.1*(W().up.lamp||0)),dec=(tap?(rust?12:13):(rust?4.4:4.8))*pow*sk;
 d[k]=Math.max(0,d[k]-dec);
 if(B[k+'0'])cv.style.opacity=Math.max(0,Math.min(1,d[k]/B[k+'0'])).toFixed(3);
 const now=performance.now();
 if(tap){ring(cx,cy);snd(rust?'scr':'rub');fxSpark(cx,cy,rust?'#c9733a':'#ffffff',4)}
 else if(now-B.st>(rust?55:85)){B.st=now;snd(rust?'scr':'rub');if(Math.random()<(rust?.5:.35))fxSpark(cx,cy,rust?'#c9733a':'#ffffff',rust?2:1)}
 if(d[k]<3){done(k);clearLeft()}
 sync()}
function applyScrub(k){if(B)sync()}

function paintAt(cx,cy,m){
 const q=B.q,d=q.d,tap=m===0;if(d.fade<3){say('Знаки уже яркие');return}
 if(!pay('paint'))return;const old=d.fade;
 const pow=TST.paint.a[TL('paint')]/TST.paint.a[0],sk=Math.min(1.6,skillQ()),dec=(tap?24:7)*pow*sk;let hit=0;
 const pp=TST.paint.pad[TL('paint')]+(tap?9999:20);
 chars().forEach((el,i)=>{const r=el.getBoundingClientRect();if((tap||(cx>r.left-pp&&cx<r.right+pp&&cy>r.top-pp&&cy<r.bottom+pp))&&q.cf[i]>0){hit=1;q.cf[i]=Math.max(0,q.cf[i]-dec)}});
 if(!hit)return;
 d.fade=q.cf.reduce((a,b)=>a+b,0)/7;const now=performance.now();
 if(tap||now-B.gt>70){B.gt=now;fxSpark(cx,cy,'#1a1a1a',tap?4:2);snd('wet');if(tap)ring(cx,cy)}
 if(d.fade<3&&old>=3)done('fade');
 sync()}

function dragAct(e){
 const r=B.pl.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top,L=B.last;
 if(px>-6&&px<r.width+6&&py>-6&&py<r.height+6){
  if(T==='paint')paintAt(e.clientX,e.clientY,L?Math.hypot(px-L.x,py-L.y):0);
  else if(T==='polish'||T==='rust')scrub(e.clientX,e.clientY,px,py,L)}
 if(T==='polish')TIN.style.setProperty('--tilt',Math.max(-18,Math.min(18,(px-(L?L.x:px))*.8))+'deg');
 B.last={x:px,y:py}}
function commit(){if(!B)return;if(T==='polish'||T==='rust')showLeft(T==='rust'?'rust':'dull');save();draw()}
function bindBench(){
 const be=B.be;
 be.onpointerenter=toolShow;
 be.onpointerleave=()=>{if(!B.drag)toolHide()};
 be.onpointermove=e=>{toolMove(e);if(B.drag)dragAct(e)};
 be.onpointerdown=e=>{
  if(e.button>0)return;{const sp=SPEC[wClass(B.q)];if(wLv()<sp.lv){say('«'+sp.n+'» открывается с уровня цеха '+sp.lv,1);return}if(B.q.lock){say('Этот номер сейчас в работе у сотрудника',1);return}}ac();toolShow(e);TEL.classList.add('pr');
  const r=B.pl.getBoundingClientRect(),fx=(e.clientX-r.left)/r.width,fy=(e.clientY-r.top)/r.height;
  if(T==='hammer'){hammerHit(e.clientX,e.clientY,fx,fy);return}
  B.drag=true;B.last=null;clearLeft();try{be.setPointerCapture(e.pointerId)}catch(_){}dragAct(e)}}
function up(e){TEL.classList.remove('pr');TIN.style.setProperty('--tilt','0deg');
 if(B&&B.drag){B.drag=false;B.last=null;commit()}
 if(e.pointerType!=='mouse')setTimeout(toolHide,300);else if(B&&B.be&&!B.be.matches(':hover'))toolHide()}
addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);
document.querySelectorAll('.sb').forEach(b=>b.addEventListener('click',toolHide));
addEventListener('keydown',e=>{if(!$('t8').classList.contains('show')||e.ctrlKey||e.metaKey||e.altKey||!B)return;const m={KeyQ:'rust',KeyW:'hammer',KeyE:'polish',KeyR:'paint'}[e.code];if(m)setTool(m)});

const TN2={rust:['Старая щётка','Стальная щётка','Латунная щётка','Щётка со скребком','Дрель с щёткой','Шлифмашинка','Пескоструй','Лазерная очистка'],hammer:['Ржавый молоток','Слесарный молоток','Рихтовочный молоток','Молоток с фиброй','Титановый молоток','Пневмомолоток','Гидравлический рихтовщик','Ультразвуковой рихтовщик'],polish:['Обрывок тряпки','Ветошь','Микрофибра','Фетровый круг','Губка с пастой','Полировальная машинка','Эксцентриковая машинка','Роторная машина PRO'],paint:['Облезлая кисть','Малярная кисть','Тонкая кисть','Кисть из колонка','Набор кистей','Маркер-краска','Аэрограф','Краскопульт PRO']};
const TP=[0,6000,30000,120000,450000,1500000,5000000,15000000],TREQ=[1,2,3,4,5,6,7,8],TUSE=[0,5,15,35,70,120,200,320],TMAX=7,TPM={hammer:1,polish:1.2,paint:1.4,rust:1.1};
const TST={hammer:{pw:[.5,.9,1.3,1.7,2.2,2.8,3.4,4.2]},polish:{r:[16,19,22,26,30,34,38,44],a:[.6,.85,1.1,1.4,1.8,2.2,2.7,3.3]},paint:{a:[.6,1,1.4,1.9,2.5,3.2,4,5],pad:[2,4,5,6,8,10,12,15]},rust:{r:[16,19,22,25,29,33,38,44],a:[.2,.25,.3,.36,.43,.5,.58,.68],pen:[.8,.6,.45,.35,.25,.15,.08,0]}};
const TDESC={hammer:l=>'Сила удара ×'+TST.hammer.pw[l]+(l?'':' · иногда оставляет следы'),polish:l=>'Ширина '+TST.polish.r[l]+' · скорость ×'+TST.polish.a[l],paint:l=>'Скорость ×'+TST.paint.a[l]+' · точность '+TST.paint.pad[l],rust:l=>'Ширина '+TST.rust.r[l]+' · скорость ×'+(TST.rust.a[l]/.2).toFixed(1)+(TST.rust.pen[l]?' · царапает краску':' · не царапает краску')};
const TL=t=>((S.tl||(S.tl={hammer:0,polish:0,paint:0,rust:0}))[t])|0;
const tprice=(t,l)=>Math.round(TP[l]*TPM[t]);

/* --- улучшения цеха, сотрудники, заказы, лавка --- */
const WUP=[
 {id:'bench',n:'Хороший верстак',max:6,base:6000,mul:1.9,d:l=>'Отремонтированный номер дороже на '+(l*1.5)+'%'},
 {id:'speed',n:'Быстрая работа',max:6,base:5000,mul:1.8,d:l=>'Инструменты и сотрудники быстрее на '+l*8+'%'},
 {id:'stations',n:'Места для сотрудников',max:3,base:15000,mul:2.6,d:l=>'Сотрудников одновременно: '+(1+l)},
 {id:'cap',n:'Больше заказов',max:4,base:4000,mul:2,d:l=>'Заказов: '+(2+l)+' · номеров в лавке: '+(3+l)},
 {id:'lamp',n:'Яркая лампа',max:4,base:7000,mul:2.2,d:l=>'Щётка и полировка работают быстрее на '+l*10+'%'},
 {id:'vise',n:'Тиски',max:3,base:9000,mul:2.4,d:l=>'Промах молотком реже оставляет вмятину: −'+l*25+'%'},
 {id:'store',n:'Кладовка',max:4,base:6000,mul:2.1,d:l=>'Материалы дешевле на '+l*4+'%'}];
const STF=[{n:'Ученик',h:5000,w:25,max:2,s:60,lv:1},{n:'Мастер',h:25000,w:70,max:3,s:38,lv:3},{n:'Эксперт',h:120000,w:180,max:4,s:22,lv:5}];
const NM=['Андрей','Игорь','Ольга','Тимур','Мария','Денис','Елена','Павел','Руслан','Анна'];
const ANCH=[200,1200,5000,25000],SKIN=['Обычный','Красивый','Редкий','Эпик'];
const oCap=()=>2+W().up.cap,lotN=()=>3+W().up.cap,stSl=()=>1+W().up.stations;
const fitW=(q,o)=>!q.lock&&q.c>=o.C&&tierOf(priceOf(q))>=o.T;
const bestFit=o=>S.inv.filter(q=>fitW(q,o)&&!W().ord.some(z=>z!==o&&z.accepted&&z.pid===q.id)).sort((a,b)=>sellVal(a)-sellVal(b))[0];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function newWO(){const mx=wLv()<2?1:wLv()<4?2:3,T=Math.floor(Math.random()*(mx+1)),C=2+Math.floor(Math.random()*3);
 return{id:uid(),T,C,rw:Math.round(ANCH[T]*(1.25+.1*(C-2))*(1+.05*(wLv()-1))),exp:Date.now()+(8+Math.random()*10)*6e4}}
function wOrd(){const w=W(),n=Date.now();w.ord=w.ord.filter(o=>o.exp>n);while(w.ord.filter(o=>!o.accepted).length<oCap())w.ord.push(newWO())}
function deliver(o,q){const w=W(),i=S.inv.indexOf(q);if(i<0)return false;S.inv.splice(i,1);S.money+=o.rw;S.earned+=o.rw;w.ord=w.ord.filter(x=>x!==o);bizTrack('orders');wXp(6+o.T*4);if(B&&B.q===q)B=null;save();return true}
function newLot(){const w=W();w.lot=[];for(let i=0;i<lotN();i++){let q=null;for(let j=0;j<5;j++){const x=mk();if(!q||x.pot>q.pot)q=x}q.c=rnd([0,0,1,1,2]);q.st='лавка';w.lot.push({id:uid(),q,pr:Math.max(40,Math.round(q.pot*M[q.c]))})}w.lotAt=Date.now()+24e4}
const lotRc=()=>Math.round(200*(1+wLv()*.5));
const matCost=q=>(q.c<=1?matP('clean'):0)+matP('paste')+matP('paint');
function startJob(s){const w=W(),T=STF[s.t],m=w.mat,dur=T.s*1000/(1+.08*w.up.speed);
 let b=null,bg=0;const assigned=w.ord.find(o=>o.accepted&&o.worker===s.id);
 if(assigned){const q=S.inv.find(x=>x.id===assigned.pid);if(!q){s.msg='номер для заказа отсутствует';return}if(q.lock){s.msg='номер занят';return}if(fitW(q,assigned)){deliver(assigned,q);s.msg='заказ выполнен';return}if(q.c>=T.max){s.msg='достигнут предел квалификации';return}if(q.c<=1&&m.clean<1){s.msg='нет чистящего средства';return}b=q}
 if(!assigned)S.inv.forEach(q=>{if(q.c>=T.max||q.lock||q.id===wsel||w.ord.some(o=>o.accepted&&o.pid===q.id))return;if(q.c<=1&&m.clean<1)return;if(!q.id)q.id=uid();
  let g=stepOf(q)*repM()-matCost(q)-T.w*dur/6e4;
  w.ord.forEach(o=>{if(o.accepted&&!o.worker&&!o.manualOnly&&q.c+1>=o.C&&tierOf(Math.round(q.pot*M[q.c+1]))>=o.T)g+=o.rw*.4});
  if(g>bg){bg=g;b=q}});
 if(!b){s.msg='нет выгодных номеров';return}
 if(m.paste<1||m.paint+m.paintP<1){s.msg='нет материалов';return}
 if(b.c<=1&&m.clean<1){s.msg='нет чистящего средства';return}
 if(b.c<=1)m.clean--;m.paste--;
 if(m.paint>0&&(wClass(b)==='std'||m.paintP<1))m.paint--;else{m.paintP--;b.pr=1}
 b.lock=s.id;s.job={pid:b.id,end:Date.now()+dur};s.msg=''}
function endJob(s){const w=W(),q=S.inv.find(x=>x.id===s.job.pid);s.job=null;if(!q)return;delete q.lock;
 q.c=Math.min(4,q.c+1);q.j=(q.j||0)+1;q.k=kOf(q);S.restored++;bizTrack('restore');w.jobs++;w.sk[wClass(q)]++;wXp(3);if(B&&B.q===q)B=null;
 const o=w.ord.find(o=>o.accepted&&!o.manualOnly&&(!o.worker||o.worker===s.id)&&(!o.pid||o.pid===q.id)&&fitW(q,o));if(o)deliver(o,q);save()}
function wTick(){const w=W(),n=Date.now();let ch=0;wOrd();if(!w.lot.length||n>w.lotAt){newLot();ch=1}
 w.staff.forEach(s=>{const T=STF[s.t],due=Math.floor((n-s.paid)/6e4);
  if(due>0){const k=Math.min(due,60),c=k*T.w;if(S.money>=c){S.money-=c;s.paid=due>60?n:s.paid+k*6e4;s.stall=0;ch=1}else s.stall=1}else s.stall=0;
  if(s.job){if(n>=s.job.end){endJob(s);ch=1}}else if(!s.stall){const before=w.ord.length;startJob(s);if(s.job||w.ord.length!==before)ch=1}});
 return ch}
setInterval(()=>{if(wTick()){save();draw()}if($('t8').classList.contains('show')){wkRender();shopRender()}},1000);

let WP='ord',SRT=0;
const WTABS=[['ord','Заказы'],['lot','Покупка номеров'],['mat','Материалы'],['tool','Инструменты'],['up','Улучшения цеха'],['st','Команда']];
const mmss=ms=>{ms=Math.max(0,Math.ceil(ms/1000));return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0')};
function shopRender(f){
 const el=$('wshop');if(!el)return;const n=Date.now();if(!f&&n-SRT<300)return;SRT=n;const w=W(),lv=wLv();let b='';
 if(WP==='ord'){b=orderManagerHTML(w,n)}
 else if(WP==='lot'){
  b=`<div class="wsub">Повреждённые номера по цене их состояния. Отремонтируйте и продайте дороже. Обновление через ${mmss(w.lotAt-n)}.</div>`+w.lot.map(l=>{const q=l.q;
   return `<div class="wc2">${plateH(q,'mini')}<div><b>${CN[q.c]} · ${SPEC[wClass(q)].n}</b><span>после ремонта до ${fmt(Math.round(q.pot*M[4]*repM()))} ₽</span></div><button data-lot="${l.id}" ${S.money<l.pr||S.inv.length>=slots()?'disabled':''}>${fmt(l.pr)} ₽</button></div>`}).join('')+(S.inv.length>=slots()?'<div class="wsub">Склад полон: продайте или освободите место.</div>':'')+`<button class="wb2" data-lr="1" ${S.money<lotRc()?'disabled':''}>Обновить лавку · ${fmt(lotRc())} ₽</button>`}
 else if(WP==='mat'){const wm=W().mat,can=Math.min(wm.clean,wm.paste,wm.paint+wm.paintP),kp=Math.round((matP('clean')+matP('paste')+matP('paint'))*5*.88);
  b=`<div class="mat-sum"><div><b>Хватит примерно на ${can} ${plw(can,'номер','номера','номеров')}</b><span>Материал тратится один раз в начале этапа. Пачкой — дешевле.</span></div><button type="button" data-kit="5" ${S.money<kp?'disabled':''}>Набор на 5 номеров<small>${fmt(kp)} ₽ · −12%</small></button></div><div class="mat-grid">`+Object.keys(MAT).map(k=>{const p=matP(k),st=wm[k]|0,pc=Math.min(100,st/20*100);return `<div class="mat-card ${st<1?'empty':st<3?'low':''}"><div class="mat-top"><span class="mat-ic">${MATI[k]}</span><div><b>${MAT[k].n}</b><span>${WT[MATU[k]].n} · ${MAT[k].u}</span></div><div class="mat-st"><b>${st}</b><span>в запасе</span></div></div><div class="mat-bar"><i style="width:${pc}%"></i></div><div class="mat-btns">${[[1,1],[5,.95],[10,.9]].map(([n,f])=>{const c=Math.round(p*n*f);return `<button type="button" data-mat="${k}" data-n="${n}" ${S.money<c?'disabled':''}>+${n}<small>${fmt(c)} ₽${f<1?' · −'+Math.round((1-f)*100)+'%':''}</small></button>`}).join('')}</div></div>`}).join('')+'</div>'}
 else if(WP==='tool'){const lv=wLv(),tu=W().tu||{};
  b='<div class="wsub">Новый инструмент работает быстрее и аккуратнее. Для покупки нужны уровень цеха, опыт работы этим инструментом и деньги.</div>'+WORDER.map(t=>{const l=TL(t),n=l+1;
   if(l>=TMAX)return `<div class="tcard max"><div class="tc-imgs"><span class="tc-img">${TOOLSVG(t,l)}</span></div><div class="tc-info"><small>${WT[t].s} · ур. ${l+1} из ${TMAX+1}</small><b>${TN2[t][l]}</b><span>${TDESC[t](l)}</span><div class="tc-max">✓ Лучший инструмент</div></div></div>`;
   const np=tprice(t,n),u=tu[t]||0,okL=lv>=TREQ[n],okU=u>=TUSE[n],okM=S.money>=np;
   return `<div class="tcard"><div class="tc-imgs"><span class="tc-img now">${TOOLSVG(t,l)}</span><i>→</i><span class="tc-img">${TOOLSVG(t,n)}</span></div><div class="tc-info"><small>${WT[t].s} · сейчас: ${TN2[t][l]}</small><b>${TN2[t][n]}</b><span>${TDESC[t](n)}</span><ul class="tc-req"><li class="${okL?'ok':''}">Уровень цеха ${TREQ[n]}</li><li class="${okU?'ok':''}">Опыт: ${Math.min(u,TUSE[n])} из ${TUSE[n]} этапов этим инструментом</li><li class="${okM?'ok':''}">Цена ${fmt(np)} ₽</li></ul><button type="button" data-buy="${t}" ${okL&&okU&&okM?'':'disabled'}>${okL&&okU?(okM?'Купить за '+fmt(np)+' ₽':'Не хватает денег'):'Выполните требования'}</button></div></div>`}).join('')}
 else if(WP==='up'){
  const a=LVX[lv-1],nx=LVX[lv],pc=lv>=LVX.length?100:(w.xp-a)/(nx-a)*100;
  b=`<div class="wlv"><b>Уровень цеха ${lv}</b><span class="sub" style="float:right">${lv>=LVX.length?'максимум':w.xp+' / '+nx+' XP'}</span><div class="mb big"><i style="width:${pc}%"></i></div><div class="wsub" style="margin-top:6px">Опыт даёт каждый этап и заказ. Уровень открывает классы, сотрудников и инструменты.</div></div>`
  +WUP.map(u=>{const l=w.up[u.id],c=Math.round(u.base*Math.pow(u.mul,l)),mx=l>=u.max;return `<div class="wc2"><div><b>${u.n} <span style="display:inline;color:var(--dim)">${l}/${u.max}</span></b><span>${mx?u.d(l):'Далее: '+u.d(l+1)}</span></div>${mx?'':`<button data-up="${u.id}" ${S.money<c?'disabled':''}>${fmt(c)} ₽</button>`}</div>`}).join('')
  +'<div class="wsub" style="margin-top:2px">Специализации: опыт в классе даёт бонус к цене</div>'+Object.keys(SPEC).map(k=>{const sp=SPEC[k];return `<div class="wc2"><div><b>${sp.n}</b><span>${sp.d} · ${lv>=sp.lv?'бонус +'+(Math.min(.05,.001*w.sk[k])*100).toFixed(1)+'% (этапов: '+w.sk[k]+')':'откроется с уровня '+sp.lv}</span></div></div>`}).join('')}
 else{
  b=`<div class="wsub">Сотрудники сами берут самые выгодные номера, расходуют материалы и получают зарплату каждую минуту. Мест: ${w.staff.length}/${stSl()}</div>`
  +w.staff.map(s=>{const T=STF[s.t],q=s.job&&S.inv.find(x=>x.id===s.job.pid);
   return `<div class="wc2"><div><b>${s.name} · ${T.n}</b><span>${s.job?(q?'Работает: '+q.p.l1+q.p.d+q.p.l2+q.p.l3+' · '+mmss(s.job.end-n):'Работает'):s.stall?'Ждёт зарплату':s.msg?'Простой: '+s.msg:'Свободен'} · ${T.w} ₽/мин</span></div><button class="dg" data-fire="${s.id}">Уволить</button></div>`}).join('')
  +(w.staff.length<stSl()?STF.map((T,i)=>`<div class="wc2"><div><b>${T.n}</b><span>до «${CN[T.max]}» · ${T.s} с/шаг · ${T.w} ₽/мин</span></div><button data-hire="${i}" ${lv<T.lv||S.money<T.h?'disabled':''}>${lv<T.lv?'Ур. '+T.lv:'Нанять · '+fmt(T.h)}</button></div>`).join(''):'<div class="wsub">Нет свободных мест. Купите «Места для сотрудников» во вкладке «Улучшения цеха».</div>')}
 const h=`<h2><svg><use href="#i-tool"/></svg>Мастерская<span class="rt">ур. ${lv}</span></h2><div class="wnav">${WTABS.map(([k,t])=>`<button data-p="${k}" class="${WP===k?'on':''}">${t}</button>`).join('')}</div><div class="wbody" data-pane="${WP}">${b}</div>`;
 if(wlast[2]!==h){const o=el.querySelector('.wbody'),st=o?o.scrollTop:0;el.innerHTML=h;wlast[2]=h;const nb=el.querySelector('.wbody');if(nb)nb.scrollTop=st}}
$('wshop').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const w=W(),d=b.dataset;
 if(d.p){WP=d.p}
 else if(d.buy){const t=d.buy,l=TL(t);if(l>=TMAX||wLv()<TREQ[l+1]||((W().tu||{})[t]||0)<TUSE[l+1])return;const pr=tprice(t,l+1);if(S.money<pr)return;S.money-=pr;S.tl[t]=l+1;snd('ok')}
 else if(d.mat){const nn=+d.n,p=Math.round(matP(d.mat)*nn*(nn>=10?.9:nn>=5?.95:1));if(S.money<p)return;S.money-=p;w.mat[d.mat]+=nn}else if(d.kit){const nn=+d.kit,p=Math.round((matP('clean')+matP('paste')+matP('paint'))*nn*.88);if(S.money<p)return;S.money-=p;w.mat.clean+=nn;w.mat.paste+=nn;w.mat.paint+=nn}
 else if(d.up){const u=WUP.find(x=>x.id===d.up),l=w.up[u.id],c=Math.round(u.base*Math.pow(u.mul,l));if(l>=u.max||S.money<c)return;S.money-=c;w.up[u.id]++;snd('ok')}
 else if(d.hire!==undefined){const T=STF[+d.hire];if(!T||w.staff.length>=stSl()||wLv()<T.lv||S.money<T.h)return;S.money-=T.h;w.staff.push({id:uid(),t:+d.hire,name:rnd(NM),job:null,paid:Date.now(),stall:0,msg:''});snd('ok')}
 else if(d.fire){const s=w.staff.find(x=>x.id===d.fire);if(!s)return;if(s.job){const q=S.inv.find(x=>x.id===s.job.pid);if(q)delete q.lock}w.ord.forEach(o=>{if(o.worker===s.id){delete o.worker;delete o.pid;o.manualOnly=true}});w.staff=w.staff.filter(x=>x!==s)}
 else if(d.od){const o=w.ord.find(x=>x.id===d.od&&x.accepted),q=o&&bestFit(o);if(!q||!deliver(o,q))return;snd('ok');say('Заказ выполнен: +'+fmt(o.rw)+' ₽')}
 else if(d.lot){const l=w.lot.find(x=>x.id===d.lot);if(!l||S.money<l.pr||S.inv.length>=slots())return;S.money-=l.pr;S.inv.push(l.q);w.lot=w.lot.filter(x=>x!==l)}
 else if(d.lr){const c=lotRc();if(S.money<c)return;S.money-=c;newLot()}
 save();wlast[2]='';shopRender(1);if(B){setTool(T);updUI()}wkRender(true);draw();if(d.buy||d.mat||d.kit||d.up||d.hire!==undefined||d.lot||d.lr)workToast(d.hire!==undefined?'Сотрудник нанят':d.mat?'Материалы куплены':d.lot?'Номер куплен':d.lr?'Лавка обновлена':'Покупка выполнена');else if(d.od)workToast('Заказ выполнен');else if(d.fire)workToast('Сотрудник уволен')});

let refStepCache='',refSideCache='',refBottomCache='';
function refSteps(){if(!B||!$('ref-steps'))return;const steps=[['rust','Очистка'],['hammer','Выравнивание'],['polish','Полировка'],['paint','Покраска']];let h=steps.map(([k,n],i)=>`<button class="ref-step ${T===k?'on':''}" data-ref-step="${k}" aria-pressed="${T===k}"><i>${i+1}</i>${n}</button>`).join('');if($('ref-steps').innerHTML!==h)$('ref-steps').innerHTML=h;const pc=Math.max(0,Math.min(100,Math.round(100-wearOf(B.q.d))));$('ref-progress-bar').style.width=pc+'%';$('ref-progress-text').textContent='Готовность номера: '+pc+'%';document.querySelector('#t8 .ref-progress').setAttribute('aria-valuenow',pc)}
// Orders use the original records and prices; accepted/worker/pid are optional fields.
function orderNumber(o){return o.id.slice(-7).toUpperCase()}
function workToast(text){const el=$('work-toast');if(!el)return;el.textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(workToast.timer);workToast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
function orderCards(w,active){const list=w.ord.filter(o=>!!o.accepted===active);if(!list.length)return `<p class="order-empty">${active?'Нет активных заказов':'Доступных заказов пока нет'}</p>`;return list.map(o=>{const q=o.pid&&S.inv.find(x=>x.id===o.pid),employee=w.staff.find(x=>x.id===o.worker),fit=bestFit(o),remain=Math.max(0,Math.ceil((o.exp-Date.now())/60000));return `<article class="order-card"><div class="order-card-top"><b>Заказ № ${orderNumber(o)}</b><span>${remain} мин</span></div><div class="order-desc">Номер: ${q?txt(q.p)+' · регион '+q.p.r:'любой подходящий'}<br>Класс: <strong>${SKIN[o.T]}+</strong> · состояние: <strong>${CN[o.C]}+</strong></div>${active&&employee?`<div class="order-assigned">Сотрудник: ${employee.name}${employee.msg?' · '+employee.msg:''}</div>`:''}<div class="order-card-bottom"><b>${fmt(o.rw)} ₽</b>${active?`<button data-ref-action="od" data-value="${o.id}" ${fit?'':'disabled'}>Сдать</button>`:`<button data-order-accept="${o.id}" ${w.ord.filter(x=>x.accepted).length>=oCap()?'disabled title="Нет свободных мест для заказов"':''}>Принять заказ</button>`}</div>${active?`<div class="order-assign"><button ${employee?`data-order-unassign="${o.id}"`:`data-order-assign="${o.id}"`}>${employee?'Снять сотрудника':'Поручить сотруднику'}</button></div>`:''}</article>`}).join('')}
function orderManagerHTML(w,n){return `<div class="wsub">Примите заказ, затем сдайте подходящий номер со склада. Сотрудникам можно поручить ремонт.</div><h3 class="order-section-title">Активные · ${w.ord.filter(o=>o.accepted).length}/${oCap()}</h3><div class="manager-orders">${orderCards(w,true)}</div><h3 class="order-section-title">Доступные</h3><div class="manager-orders">${orderCards(w,false)}</div>`}
function refreshOrders(){save();wlast[2]='';shopRender(1);wkRender(true);draw()}
function acceptWO(id){const w=W(),o=w.ord.find(x=>x.id===id&&!x.accepted);if(!o||w.ord.filter(x=>x.accepted).length>=oCap())return;o.accepted=true;wOrd();refreshOrders();snd('ok');workToast('Заказ № '+orderNumber(o)+' принят')}
function assignWO(id){const w=W(),o=w.ord.find(x=>x.id===id&&x.accepted);if(!o||o.worker)return;const ss=w.staff.filter(s=>!w.ord.some(z=>z.accepted&&z.worker===s.id));if(!ss.length){workToast('Нет свободного сотрудника для поручения');return}let pick=null;for(const st of ss){let cands=S.inv.filter(q=>!q.lock&&!w.ord.some(z=>z.accepted&&z.pid===q.id)&&tierOf(priceOf({...q,c:o.C}))>=o.T&&(q.c<STF[st.t].max||fitW(q,o)));cands.sort((a,b)=>(b.id===wsel)-(a.id===wsel)||sellVal(a)-sellVal(b));if(cands.length){pick={st,q:cands[0]};break}}if(!pick){workToast('Нужен подходящий номер на складе для этого сотрудника');return}ensureD(pick.q);o.worker=pick.st.id;o.pid=pick.q.id;delete o.manualOnly;pick.st.msg='назначен заказ';refreshOrders();workToast('Заказ поручен: '+pick.st.name)}
function unassignWO(id){const o=W().ord.find(x=>x.id===id&&x.accepted);if(!o||!o.worker)return;delete o.worker;delete o.pid;o.manualOnly=true;refreshOrders();workToast('Поручение снято; текущий этап сотрудник завершит')}
function refUpdate(){if(!$('t8').classList.contains('show'))return;refSteps();const w=W(),lv=wLv(),q=B&&B.q,active=w.ord.filter(o=>o.accepted).length;
 const side=`<section class="ref-card order-panel"><div class="order-heading"><div><span class="order-kicker">РАБОТА МАСТЕРСКОЙ</span><h3>Заказы <span class="order-count">${active}/${oCap()}</span></h3></div><button class="order-more" data-ref-open="ord">Все ›</button></div><div class="order-summary">Уровень ${lv} · ${q?'оценка '+fmt(sellVal(q))+' ₽':'нет номера на верстаке'}</div><h4>Активные <span>${active}</span></h4><div class="order-list active-orders">${orderCards(w,true)}</div><h4>Доступные <span>${w.ord.filter(o=>!o.accepted).length}</span></h4><div class="order-list available-orders">${orderCards(w,false)}</div></section>`;
 if(side!==refSideCache){const sc=$('ref-side').scrollTop;$('ref-side').innerHTML=side;$('ref-side').scrollTop=sc;refSideCache=side}
 const u=WUP[0],ul=w.up.bench,uc=Math.round(u.base*Math.pow(u.mul,ul)),max=ul>=u.max;
 const toolcards=WORDER.map(t=>{const l=TL(t),mx=l>=TMAX,n=l+1,c=mx?0:tprice(t,n),lk=!mx&&(lv<TREQ[n]||((W().tu||{})[t]||0)<TUSE[n]);return `<div class="ref-mini"><div class="ref-mini-head"><span class="ref-mini-img tsv">${TOOLSVG(t,mx?l:n)}</span><div><b>${mx?TN2[t][l]:TN2[t][n]}</b><p>${mx?'Максимум':TDESC[t](n)}</p></div></div><div class="price">${mx?'Куплено':'🪙 '+fmt(c)+' ₽'}</div><button class="ref-action" data-ref-action="buy" data-value="${t}" ${mx||lk||S.money<c?'disabled':''}>${mx?'Максимум':lk?(lv<TREQ[n]?'Уровень '+TREQ[n]:'Опыт '+(((W().tu||{})[t])||0)+'/'+TUSE[n]):'Купить'}</button></div>`}).join('');
 const st=w.staff[0],stf=st&&STF[st.t],working=st&&(st.job?'Работает':st.stall?'Ждёт зарплату':st.msg?'Простой: '+st.msg:'Свободен');
 const bottom=`<section class="ref-card"><h3>👑 Улучшение мастерской <button class="more" data-ref-open="up">Все ›</button></h3><div class="ref-up-inner"><div class="ref-building" role="img" aria-label="Здание мастерской"></div><div class="ref-up-copy"><b>Улучшенный верстак</b><p class="good">${u.d(Math.min(u.max,ul+1))}</p><p>Текущий уровень: ${ul} / ${u.max}</p><button class="ref-action" data-ref-action="up" data-value="bench" ${max||S.money<uc?'disabled':''}>${max?'Максимум':'Улучшить<br>🪙 '+fmt(uc)+' ₽'}</button></div></div></section><section class="ref-card"><h3>⭐ Магазин инструментов <button class="more" data-ref-open="tool">Все товары ›</button></h3><div class="ref-mini-grid">${toolcards}</div></section><section class="ref-card"><h3>Сотрудники <span class="r">${w.staff.length} / ${stSl()}</span></h3><div class="ref-person"><div class="ref-photo" aria-hidden="true"><span>${st?st.name.slice(0,1):'✦'}</span></div><div>${st?`<b>${st.name} · ${stf.n}</b><p>${working}</p><p>${stf.w} ₽/мин</p><button class="fire" data-ref-action="fire" data-value="${st.id}">Уволить</button>`:'<b>Команда ждёт</b><p>Наймите сотрудника для автоматического ремонта.</p>'}</div></div><button class="ref-action" ${w.staff.length<stSl()?`data-ref-action="hire" data-value="0" ${S.money<STF[0].h?'disabled':''}`:'data-ref-open="st"'}>${w.staff.length<stSl()?'👥 Нанять ученика · '+fmt(STF[0].h)+' ₽':'👥 Управлять сотрудниками'}</button></section>`;
 if(bottom!==refBottomCache){$('ref-bottom').innerHTML=bottom;refBottomCache=bottom}}
function refOpen(p){WP=p;wlast[2]='';$('ref-manager').hidden=false;shopRender(1);$('ref-manager').scrollIntoView({block:'start',behavior:'smooth'})}
$('t8').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.orderAccept){acceptWO(b.dataset.orderAccept);return}if(b.dataset.orderAssign){assignWO(b.dataset.orderAssign);return}if(b.dataset.orderUnassign){unassignWO(b.dataset.orderUnassign);return}if(b.dataset.refOpen){refOpen(b.dataset.refOpen);return}if(b.dataset.refClose){$('ref-manager').hidden=true;return}if(b.dataset.refAction){const type=b.dataset.refAction,val=b.dataset.value;if(type==='od'){const o=W().ord.find(x=>x.id===val&&x.accepted),q=o&&bestFit(o);if(q&&deliver(o,q)){refreshOrders();snd('ok');workToast('Заказ выполнен')}return}const p={od:'ord',buy:'tool',up:'up',hire:'st',fire:'st'}[type];if(!p)return;WP=p;wlast[2]='';shopRender(1);const target=$('wshop').querySelector(`[data-${type}="${val}"]`);if(target&&!target.disabled)target.click();refUpdate()}});

function buildBench(q){
 toolHide();const d=q.d,box=$('wkb');
 box.innerHTML=`<div class="ref-scene"><div class="ref-title"><span class="ref-sign"><i></i><span>МАСТЕРСКАЯ</span><i></i></span></div><div class="ref-steps" id="ref-steps"></div><div class="bench" id="bench"><i class="vs l"></i><i class="vs r"></i><div class="anv"></div><div class="bplate" id="bplate"><span class="pl bb w${q.c} r${tierOf(priceOf(q))}" id="bpl">${inner(q.p)}<i class="dl" id="bdl"></i><canvas class="cvv" id="cvd"></canvas><canvas class="cvv" id="cvr"></canvas></span></div><div class="bmsg" id="bmsg">Выберите инструмент и нажимайте прямо на номере</div></div><div class="ref-progress" role="progressbar" aria-label="Готовность номера" aria-valuemin="0" aria-valuemax="100"><i id="ref-progress-bar"></i><b id="ref-progress-text"></b></div></div><div class="btray">${WORDER.map(k=>`<button class="bwt" data-tool="${k}" data-lv="${TL(k)}"><span class="ref-toolimg tsv" data-l="${TL(k)}">${TOOLSVG(k,TL(k))}</span><b id="tn_${k}">${TN2[k][TL(k)]}</b><span id="ts_${k}"></span></button>`).join('')}</div><details class="ref-detail"><summary>Состояние номера и подсказки</summary><div class="bhd"><div class="wkm" id="bval"></div><label class="bsn"><input type="checkbox" id="bsnd" ${snd1?'checked':''}> Звук</label></div><span id="bsk"></span><div class="bhint" id="bhint"></div><div class="bdr">${DK.map(([k,n])=>`<div class="dr"><span>${n}</span><div class="mb big"><i id="bb_${k}"></i></div><b id="bv_${k}"></b></div>`).join('')}</div><div class="sub">Горячие клавиши: Q W E R — этапы 1–4</div></details>`;
 B={q,pl:$('bpl'),be:$('bench'),bp:$('bplate'),cd:$('cvd'),cr:$('cvr'),dl:$('bdl'),dEls:new Map(),v0:sellVal(q),mt:0,st:0,gt:0,hb:0,drag:false,last:null,dull0:d.dull,rust0:d.rust,dullS:0,rustS:0};
 const rc=B.pl.getBoundingClientRect(),CW=360,CH=Math.max(40,Math.round(CW*(rc.height||80)/(rc.width||420)));
 [B.cd,B.cr].forEach(c=>{c.width=CW;c.height=CH});
 if(d.dull>=3){drawGrime(ctx2(B.cd),CW,CH,d.dull);B.dullS=sumA(B.cd)}else B.cd.style.display='none';
 if(d.rust>=3){drawRust(ctx2(B.cr),CW,CH,d.rust);B.rustS=sumA(B.cr)}else B.cr.style.display='none';
 {const f=WORDER.find(t=>d[WT[t].k]>=3);if(f&&(window._v4lid!==q.id||!(d[WT[T].k]>=3)))T=f;window._v4lid=q.id}
 setTool(T);renderDents();B.pl.style.setProperty('--b',(d.bend/100).toFixed(3));
 chars().forEach((el,i)=>el.style.opacity=(1-q.cf[i]/100*.62).toFixed(2));
 updUI();bindBench()}

function wkSync(){wkRender()}
function wkRender(f){
 if(!$('t8').classList.contains('show')&&!f)return;
 const q=curQ();
 const L=[...S.inv].sort((a,b)=>sellVal(b)-sellVal(a)).map(x=>{const w=wearOf(ensureD(x));return `<button class='it2${x.id===wsel&&!x.lock?' on':''}' data-id='${x.id}' ${x.lock?'disabled title="Номер у сотрудника"':''}><div class='rw'>${plateH(x,'mini')}<b class='gold'>${fmt(sellVal(x))} ₽</b></div><div class='sub'><span style='color:${CC[x.c]}'>${CN[x.c]}</span><span>${x.lock?'У сотрудника':'износ '+Math.round(w)+'%'}</span></div><div class='mb'><i style='width:${w}%;background:hsl(${120-w*1.2},70%,50%)'></i></div></button>`}).join('')||'<div class="empty">Склад пуст, номеров для работы нет</div>';
 if(wlast[0]!==L){$('wkl').innerHTML=L;wlast[0]=L}
 if(!q){if(B||wlast[1]!=='e'){B=null;toolHide();$('wkb').innerHTML='<div class="ref-scene ref-empty"><div class="ref-title"><span class="ref-sign"><i></i><span>МАСТЕРСКАЯ</span><i></i></span></div><div class="ref-empty-text"><b>Верстак ждёт номер</b><br>Купите повреждённый номер или дождитесь завершения работы сотрудника.<br><button data-ref-open="lot">Открыть лавку</button></div></div>';wlast[1]='e'}}
 else if(!B||B.q!==q||!B.pl.isConnected){wlast[1]='';buildBench(q)}
 else updUI();
 $('wkc').textContent=S.inv.length+' шт.';shopRender();refUpdate()}
$('t8').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.refStep&&B)setTool(b.dataset.refStep);
 else if(b.dataset.id){wsel=b.dataset.id;wkRender(true)}
 else if(b.dataset.tool&&B)setTool(b.dataset.tool)});
$('t8').addEventListener('change',e=>{if(e.target.id==='bsnd')snd1=e.target.checked});
document.querySelector('.sb[data-t="t8"]').addEventListener('click',()=>wkRender(true));


/* Settings interactions */
(function(){
 const SUPPORT_URL=''; // ссылка поддержки, например 'https://t.me/your_support' или 'mailto:help@site.ru'
 const root=$('t7'),on=k=>settingsPrefs[k]!==false;
 const toastEl=document.createElement('div');toastEl.className='nm-toast';toastEl.setAttribute('role','status');toastEl.setAttribute('aria-live','polite');document.body.appendChild(toastEl);
 let tt=0;const toast=(t,w)=>{toastEl.textContent=t;toastEl.classList.toggle('warn',!!w);toastEl.classList.remove('show');void toastEl.offsetWidth;toastEl.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>toastEl.classList.remove('show'),2600)};
 window.nmToast=toast;
 const write=()=>{try{localStorage.setItem('nomera-settings',JSON.stringify(settingsPrefs))}catch(e){toast('Не удалось сохранить настройки в браузере',1)}};
 const sync=()=>{
  root.querySelectorAll('[data-setting]').forEach(b=>b.setAttribute('aria-checked',String(on(b.dataset.setting))));
  const theme=['dark','purple','classic'].includes(settingsPrefs.theme)?settingsPrefs.theme:'dark';
  root.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));
  document.body.dataset.theme=theme;document.body.dataset.interfaceMotion=on('motion')?'on':'off';
  $('autosave-warn').hidden=on('autosave');
 };
 root.querySelectorAll('[data-setting]').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.setting;settingsPrefs[k]=!on(k);write();sync();
  if(k==='autosave'){if(on(k)){save(true);toast('Автосохранение включено — прогресс сохранён')}else toast('Автосохранение выключено')}
  if(k==='notifications')ui();
  if(k==='hints'&&!on(k))$('ahint').hidden=true;
 }));
 root.querySelectorAll('.setting-row').forEach(r=>{const t=r.querySelector('.toggle');if(t)r.addEventListener('click',e=>{if(!e.target.closest('button'))t.click()})});
 root.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>{settingsPrefs.theme=b.dataset.themeChoice;write();sync()}));
 const tabs=[...root.querySelectorAll('.settings-tab')];
 const show=b=>{tabs.forEach(x=>{const s=x===b;x.setAttribute('aria-selected',String(s));x.tabIndex=s?0:-1});root.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==b.dataset.section)};
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>show(b));b.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();e.stopPropagation();const n=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];n.focus();show(n)})});
 // ручное сохранение + защита от потери прогресса при выключенном автосохранении
 addEventListener('beforeunload',e=>{if(on('autosave'))return;let same=true;try{same=localStorage.getItem('nomera3')===JSON.stringify(S)}catch(_){}if(!same){e.preventDefault();e.returnValue=''}});
 $('save-now').addEventListener('click',()=>{save(true);toast('Прогресс сохранён')});
 // ID и копирование
 let id;try{id=localStorage.getItem('nomera-local-id');if(!id){id='#'+String(Math.floor(10000+Math.random()*90000));localStorage.setItem('nomera-local-id',id)}}catch(e){id='—'}
 $('local-id').textContent=id;
 const copy=async t=>{try{await navigator.clipboard.writeText(t);return true}catch(e){try{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(a);a.select();const ok=document.execCommand('copy');a.remove();return ok}catch(_){return false}}};
 $('copy-local-id').addEventListener('click',async()=>{const ok=await copy(id);toast(ok?'ID '+id+' скопирован':'Не удалось скопировать. Ваш ID: '+id,!ok)});
 // поддержка
 const sbox=$('support-box'),sbtn=$('support-btn'),slink=$('support-link');
 if(SUPPORT_URL){slink.href=SUPPORT_URL;slink.hidden=false}
 sbtn.addEventListener('click',()=>{sbox.hidden=!sbox.hidden;sbtn.setAttribute('aria-expanded',String(!sbox.hidden))});
 const report=()=>['НОМЕРА v1.0.0','ID: '+id,'Баланс: '+fmt(S.money)+' ₽','Круток: '+(S.rolls||0),'Тема: '+(settingsPrefs.theme||'dark'),'Браузер: '+navigator.userAgent,'Время: '+new Date().toLocaleString('ru-RU')].join('\n');
 $('support-copy').addEventListener('click',async()=>{const ok=await copy(report());toast(ok?'Данные для поддержки скопированы':'Не удалось скопировать данные',!ok)});
 // сброс прогресса с подтверждением внутри игры
 const rb=$('reset'),rc=$('reset-confirm'),closeRc=()=>{rc.hidden=true;rb.hidden=false};
 rb.onclick=()=>{rb.hidden=true;rc.hidden=false;$('reset-no').focus()};
 $('reset-no').onclick=()=>{closeRc();rb.focus()};
 $('reset-yes').onclick=()=>{S=DEF();shown=0;fillOrders();save(true);draw();closeRc();toast('Прогресс сброшен')};
 // уведомление о начале рыночного события
 const evKey=()=>S.ev?S.ev.id+':'+S.ev.until:'';let lastEv=evKey();
 setInterval(()=>{const k=evKey();if(k&&k!==lastEv&&on('notifications')){const e=EVS.find(x=>x.id==S.ev.id);if(e)toast((e.m>1?'📈 ':'📉 ')+'Событие на рынке: '+e.t+' ×'+e.m)}lastEv=k},1000);
 sync();
})();


/* ===== v4: инструменты по уровням, подсказки, достижения, ежедневный бонус ===== */
function TOOLSVG(t,l){
 l=Math.max(0,Math.min(7,l|0));
 const br=(x0,x1,y0,y1,n,c,w)=>{let s='';for(let i=0;i<n;i++){const x=(x0+(x1-x0)*i/(n-1)).toFixed(1);s+='<path d="M'+x+' '+y0+'V'+y1+'" stroke="'+c+'" stroke-width="'+w+'" stroke-linecap="round"/>'}return s};
 const V={hammer:'0 0 140 140',rust:'0 0 120 110',polish:'0 0 120 90',paint:'0 0 60 150'};
 let m;
 if(t==='hammer')m=[
 '<rect x="63" y="34" width="14" height="102" rx="6" fill="#5e3f22"/><rect x="63" y="34" width="4" height="102" rx="2" fill="#7a5532"/><path d="M68 44l3 20-2 16 3 24" stroke="#2e1d0e" stroke-width="1.6" fill="none"/><rect x="24" y="10" width="88" height="30" rx="4" fill="#6f6259"/><rect x="24" y="10" width="88" height="8" rx="4" fill="#8c7f74"/><circle cx="44" cy="28" r="6" fill="#8a4a22" opacity=".85"/><circle cx="80" cy="20" r="4" fill="#a0562a" opacity=".8"/><circle cx="96" cy="32" r="5" fill="#7a3e1c" opacity=".8"/><path d="M12 12h14v26H12z" fill="#7d726a"/><path d="M12 30l6 3-6 5z" fill="#3e352f"/><path d="M112 12q18 4 22 16q-10-2-22 8z" fill="#5d5249"/><circle cx="120" cy="20" r="3" fill="#8a4a22"/>',
 '<rect x="62" y="32" width="16" height="104" rx="7" fill="#b98049"/><rect x="62" y="32" width="5" height="104" rx="3" fill="#d9a46b"/><path d="M66 58h9M66 86h9M66 112h9" stroke="#8f6033" stroke-width="1.3" opacity=".7"/><rect x="24" y="8" width="88" height="32" rx="5" fill="#7d8899"/><rect x="24" y="8" width="88" height="10" rx="5" fill="#b9c3d2"/><rect x="12" y="10" width="14" height="28" rx="3" fill="#dbe2ec"/><path d="M112 12l26 10v6l-26 10z" fill="#6b7586"/>',
 '<rect x="63" y="30" width="14" height="106" rx="6" fill="#d8b07a"/><rect x="63" y="30" width="4" height="106" rx="2" fill="#efd0a0"/><rect x="61" y="112" width="18" height="26" rx="7" fill="#2a2a30"/><rect x="22" y="14" width="96" height="22" rx="10" fill="#8f9bb0"/><rect x="22" y="14" width="96" height="7" rx="4" fill="#cfd8e6"/><ellipse cx="18" cy="25" rx="7" ry="14" fill="#e6ecf5"/><path d="M118 16l20 9-20 9z" fill="#77839a"/>',
 '<rect x="62" y="30" width="16" height="108" rx="7" fill="#f2c230"/><rect x="62" y="30" width="5" height="108" rx="3" fill="#ffe07a"/><rect x="60" y="88" width="20" height="50" rx="8" fill="#1d1d22"/><path d="M62 96h16M62 104h16M62 112h16M62 120h16M62 128h16" stroke="#3a3a44" stroke-width="2"/><rect x="22" y="8" width="92" height="32" rx="6" fill="#3e4553"/><rect x="22" y="8" width="92" height="10" rx="5" fill="#6b7587"/><rect x="11" y="9" width="15" height="30" rx="4" fill="#c9d2df"/><path d="M114 10q20 4 24 18q-12-2-24 10z" fill="#363c49"/>',
 '<rect x="63" y="30" width="14" height="108" rx="6" fill="#9fb3c8"/><rect x="63" y="30" width="4" height="108" rx="2" fill="#dbe8f5"/><rect x="60" y="84" width="20" height="54" rx="9" fill="#c62f3a"/><rect x="60" y="84" width="6" height="54" rx="3" fill="#e65a63"/><rect x="22" y="8" width="92" height="32" rx="8" fill="#8ea6c0"/><rect x="22" y="8" width="92" height="9" rx="5" fill="#e2eefa"/><rect x="40" y="22" width="56" height="4" rx="2" fill="#6f86a1"/><rect x="11" y="9" width="15" height="30" rx="5" fill="#f0f6ff"/><path d="M114 12l24 8v8l-24 8z" fill="#7f97b2"/>',
 '<path d="M74 122q34 10 44-8t4-44" stroke="#1f2933" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M62 36h20l-4 86H66z" fill="#22262e"/><path d="M64 52h15M64 66h15M64 80h14M65 94h13M66 108h12" stroke="#3a404c" stroke-width="2"/><path d="M58 44q-7 9 0 18" stroke="#c7ccd6" stroke-width="3" fill="none"/><rect x="30" y="10" width="92" height="30" rx="8" fill="#2f6fd0"/><rect x="30" y="10" width="92" height="9" rx="5" fill="#69a3ff"/><rect x="104" y="14" width="22" height="22" rx="4" fill="#20242c"/><rect x="16" y="16" width="16" height="18" rx="2" fill="#b8c1cf"/><rect x="11" y="12" width="7" height="26" rx="2" fill="#e3e8f0"/>',
 '<rect x="62" y="36" width="16" height="100" rx="6" fill="#2b2f37"/><rect x="62" y="36" width="5" height="100" rx="2" fill="#49505c"/><rect x="60" y="96" width="20" height="40" rx="8" fill="#f07a1a"/><rect x="34" y="6" width="84" height="36" rx="9" fill="#f07a1a"/><rect x="34" y="6" width="84" height="10" rx="6" fill="#ffab5c"/><circle cx="98" cy="24" r="9" fill="#f4f6f8" stroke="#2b2f37" stroke-width="3"/><path d="M98 24l5-5" stroke="#d22" stroke-width="2"/><rect x="18" y="14" width="18" height="22" rx="3" fill="#cfd6e0"/><rect x="18" y="14" width="18" height="6" rx="3" fill="#f5f8fc"/><rect x="10" y="10" width="10" height="30" rx="4" fill="#9aa4b2"/>',
 '<rect x="62" y="34" width="16" height="104" rx="7" fill="#151a2e"/><rect x="62" y="34" width="4" height="104" rx="2" fill="#2d3658"/><path d="M70 52v70" stroke="#38e8ff" stroke-width="2" opacity=".8"/><rect x="26" y="8" width="94" height="32" rx="14" fill="#1b2140"/><rect x="26" y="8" width="94" height="8" rx="6" fill="#3a4680"/><path d="M46 10v28M58 10v28M70 10v28" stroke="#38e8ff" stroke-width="3" opacity=".9"/><path d="M120 14q16 10 0 20z" fill="#1b2140"/><circle cx="16" cy="25" r="13" fill="#38e8ff" opacity=".28"/><rect x="11" y="12" width="18" height="26" rx="6" fill="#8ff5ff"/>'];
 else if(t==='rust')m=[
 '<path d="M22 34q38-30 76 0v10H22z" fill="#6a4a2c"/><path d="M30 30q30-22 60 0" stroke="#86613d" stroke-width="3" fill="none"/><rect x="16" y="42" width="88" height="14" rx="3" fill="#5c4a3a"/><circle cx="36" cy="49" r="3" fill="#8a4a22"/><circle cx="78" cy="48" r="2.5" fill="#8a4a22"/><path d="M24 56l-3 32M32 56l1 38M40 56l-4 28M50 56l2 40M58 56v24M66 56l-2 39M76 56l4 32M86 56l-1 38M96 56l3 28" stroke="#8a6a48" stroke-width="3" stroke-linecap="round"/>',
 '<path d="M20 32q40-34 80 0v12H20z" fill="#a8743f"/><path d="M28 30q32-26 64 0" stroke="#d29c62" stroke-width="3" fill="none"/><rect x="14" y="42" width="92" height="14" rx="3" fill="#8a929f"/><rect x="18" y="56" width="84" height="40" rx="3" fill="#3f444e"/>'+br(21,99,57,95,14,'#b4bdcb',2.2),
 '<path d="M20 32q40-34 80 0v12H20z" fill="#2a2a30"/><path d="M28 30q32-26 64 0" stroke="#55555f" stroke-width="3" fill="none"/><rect x="14" y="42" width="92" height="14" rx="3" fill="#b08a3a"/><rect x="18" y="56" width="84" height="40" rx="3" fill="#6d5520"/>'+br(21,99,57,96,16,'#f0cd6e',2.2),
 '<path d="M18 30q42-30 84 0v14H18z" fill="#c8352f"/><path d="M26 28q34-22 68 0" stroke="#ef6a5f" stroke-width="3" fill="none"/><rect x="14" y="42" width="92" height="12" rx="3" fill="#2d2f36"/><rect x="18" y="54" width="70" height="42" rx="2" fill="#3c4250"/>'+br(21,85,55,96,12,'#c9d1dc',2.2)+'<path d="M90 54h14l4 42H90z" fill="#d7dee8"/><path d="M90 54h4v42h-4z" fill="#9aa3b0"/>',
 '<path d="M22 8h66q12 0 12 12v12H22z" fill="#2f8f4e"/><rect x="22" y="8" width="78" height="7" rx="4" fill="#5fc27d"/><path d="M80 30h16l6 26H88z" fill="#1f2328"/><rect x="48" y="30" width="24" height="12" rx="2" fill="#30343b"/><rect x="56" y="42" width="8" height="12" fill="#9aa3b0"/><path d="M30 54h60l-6 42H36z" fill="#4a4f5a"/>'+br(36,84,58,96,12,'#c9d1dc',2.4),
 '<rect x="10" y="12" width="100" height="24" rx="12" fill="#2a64c9"/><rect x="10" y="12" width="100" height="7" rx="4" fill="#6c9cf0"/><path d="M16 22h10M16 28h10" stroke="#173a78" stroke-width="2"/><rect x="46" y="34" width="28" height="20" rx="4" fill="#3a3f48"/><rect x="55" y="54" width="10" height="12" fill="#9aa3b0"/><ellipse cx="60" cy="82" rx="46" ry="14" fill="#5b4630"/><ellipse cx="60" cy="79" rx="46" ry="13" fill="#a07c4e"/><path d="M24 76l10 10M40 70l6 14M60 68v16M80 70l-6 14M96 76l-10 10" stroke="#7a5c38" stroke-width="2"/><ellipse cx="60" cy="78" rx="9" ry="4" fill="#3a3f48"/>',
 '<path d="M78 22q28-14 38 8" stroke="#20252d" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="38" y="8" width="44" height="42" rx="9" fill="#6d7f95"/><rect x="38" y="8" width="44" height="11" rx="6" fill="#a7b6c8"/><path d="M80 26h16l-4 28H82z" fill="#262b33"/><rect x="52" y="50" width="16" height="20" fill="#3a3f48"/><path d="M53 70h14l-3 24h-8z" fill="#c9a24a"/><path d="M56 70h3v24h-3z" fill="#e8c86e"/><path d="M60 96l-12 10M60 96v12M60 96l12 10" stroke="#e8d7a8" stroke-width="2" opacity=".75"/>',
 '<rect x="36" y="6" width="48" height="46" rx="12" fill="#1a1d2e"/><rect x="36" y="6" width="48" height="10" rx="8" fill="#3a3f66"/><path d="M84 20h22v10H84z" fill="#262b40"/><path d="M46 52h28l-6 24H52z" fill="#2a2f48"/><circle cx="60" cy="30" r="9" fill="#ff3b5c" opacity=".9"/><circle cx="60" cy="30" r="4" fill="#ffd0d8"/><path d="M60 76v22" stroke="#ff3b5c" stroke-width="5"/><path d="M60 76v22" stroke="#fff" stroke-width="1.5"/><ellipse cx="60" cy="99" rx="15" ry="4" fill="#ff3b5c" opacity=".5"/>'];
 else if(t==='polish')m=[
 '<path d="M14 22l20-8 18 6 22-10 30 8 6 22-8 18 4 14-26 6-20-6-22 8-18-10 2-20-10-12z" fill="#8c8273"/><path d="M24 30q30 8 64-4M22 52q36 10 74-2" stroke="#6f6658" stroke-width="3" fill="none"/><circle cx="70" cy="40" r="6" fill="#2e2a26"/><circle cx="38" cy="62" r="4" fill="#2e2a26"/><circle cx="88" cy="58" r="7" fill="#5c4a2e" opacity=".6"/>',
 '<path d="M10 30q8-18 30-14q14-12 34-2q22-6 34 12q10 18-4 32q-6 16-30 12q-16 10-36 2q-22 2-28-16q-10-10 0-26z" fill="#e9e2d0"/><path d="M22 36q18-8 34 2t38-4M24 54q20 8 40-2t32 4" stroke="#c9bfa6" stroke-width="3" fill="none"/><circle cx="80" cy="30" r="6" fill="#bda56a" opacity=".6"/>',
 '<g transform="rotate(-8 60 45)"><rect x="8" y="14" width="104" height="62" rx="12" fill="#4f86d9"/><rect x="8" y="14" width="104" height="18" rx="10" fill="#79a6ee"/><path d="M20 46q40 8 80 0M20 62q40 8 80 0" stroke="#3b6fbf" stroke-width="3" fill="none"/></g>',
 '<circle cx="60" cy="45" r="40" fill="#f1efe9"/><circle cx="60" cy="45" r="40" fill="none" stroke="#cfcac0" stroke-width="3"/><circle cx="60" cy="45" r="28" fill="none" stroke="#dcd7cc" stroke-width="2" stroke-dasharray="4 5"/><circle cx="60" cy="45" r="13" fill="#7a5530"/><circle cx="56" cy="41" r="5" fill="#a77a4a"/>',
 '<rect x="12" y="16" width="96" height="58" rx="20" fill="#f6c93b"/><rect x="12" y="16" width="96" height="16" rx="14" fill="#ffe27a"/><circle cx="28" cy="58" r="3" fill="#d9a51f"/><circle cx="92" cy="54" r="3" fill="#d9a51f"/><circle cx="84" cy="64" r="2" fill="#d9a51f"/><circle cx="36" cy="66" r="2" fill="#d9a51f"/><path d="M42 40q10-12 24-2q12-6 16 6q-4 12-20 9q-14 4-20-7z" fill="#f4f1ff"/><circle cx="62" cy="44" r="3" fill="#d6cff0"/>',
 '<circle cx="60" cy="45" r="42" fill="#ff8a2a"/><circle cx="60" cy="45" r="35" fill="#26292f"/><circle cx="60" cy="45" r="35" fill="none" stroke="#3b4048" stroke-width="3"/><rect x="44" y="30" width="32" height="30" rx="10" fill="#3b4048"/><rect x="48" y="34" width="24" height="6" rx="3" fill="#ff8a2a"/>',
 '<circle cx="60" cy="45" r="43" fill="#d8323c"/><circle cx="60" cy="45" r="43" fill="none" stroke="#a51f2a" stroke-width="2"/><circle cx="60" cy="45" r="30" fill="#2a2d33"/><rect x="28" y="38" width="64" height="14" rx="7" fill="#454a54"/><rect x="28" y="38" width="64" height="5" rx="3" fill="#6b717d"/><circle cx="60" cy="45" r="8" fill="#d8323c"/>',
 '<circle cx="60" cy="45" r="44" fill="#7c3aed" opacity=".35"/><circle cx="60" cy="45" r="40" fill="#e9e3ff"/><circle cx="60" cy="45" r="40" fill="none" stroke="#a78bfa" stroke-width="4"/><circle cx="60" cy="45" r="27" fill="#1c1830"/><path d="M60 18a27 27 0 0 1 27 27" stroke="#c4b5fd" stroke-width="4" fill="none"/><rect x="22" y="40" width="76" height="10" rx="5" fill="#cfd5e0"/><circle cx="60" cy="45" r="7" fill="#a78bfa"/>'];
 else m=[
 '<path d="M24 86Q30 6 36 86z" fill="#7a5a3a"/><path d="M27 34l4 7-3 6M33 52l-3 5 3 6" stroke="#a88a62" stroke-width="2" fill="none"/><rect x="19" y="84" width="22" height="24" rx="3" fill="#7d6f62"/><circle cx="26" cy="96" r="3" fill="#8a4a22"/><path d="M21 108l-3 20 5-6 2 14 4-12 3 17 3-15 4 10 1-14 4 8-3-22z" fill="#3a2f25"/>',
 '<rect x="25" y="8" width="10" height="78" rx="5" fill="#c98a4c"/><rect x="25" y="8" width="3" height="78" rx="2" fill="#e8b47a"/><rect x="16" y="84" width="28" height="26" rx="3" fill="#b0b8c6"/><rect x="16" y="84" width="9" height="26" fill="#dce2ec"/><path d="M17 110h26l-3 26q-10 8-20 0z" fill="#1d1a17"/>',
 '<path d="M26 6h8l-1 84h-6z" fill="#c0392b"/><path d="M27 6h3l-1 84h-2z" fill="#e8665a"/><rect x="24" y="88" width="12" height="26" rx="2" fill="#c4ccd8"/><path d="M24 114h12q0 16-6 27q-6-11-6-27z" fill="#2a1f18"/>',
 '<path d="M25 4h10l-2 86h-6z" fill="#14141a"/><path d="M26 6h3l-1 82h-1z" fill="#3c3c48"/><rect x="23" y="88" width="14" height="28" rx="2" fill="#d4a63a"/><rect x="23" y="88" width="4" height="28" fill="#f3d27a"/><path d="M23 116h14q0 14-7 25q-7-11-7-25z" fill="#8a4a1f"/><path d="M30 120v16" stroke="#b5703a" stroke-width="1.5"/>',
 '<g opacity=".75"><path d="M8 10h7l-1 70h-5z" fill="#2c7a4b"/><rect x="7" y="78" width="9" height="16" fill="#b8c0cc"/><path d="M7 94h9q0 10-4.5 16q-4.5-6-4.5-16z" fill="#2a1f18"/></g><g opacity=".75"><path d="M45 14h7l-1 68h-5z" fill="#8e44ad"/><rect x="44" y="80" width="9" height="16" fill="#b8c0cc"/><path d="M44 96h9q0 10-4.5 16q-4.5-6-4.5-16z" fill="#2a1f18"/></g><path d="M25 4h10l-2 86h-6z" fill="#1f5fbf"/><path d="M26 6h3l-1 82h-1z" fill="#5b93e6"/><rect x="23" y="88" width="14" height="28" rx="2" fill="#c4ccd8"/><rect x="23" y="88" width="4" height="28" fill="#eef2f7"/><path d="M23 116h14q0 14-7 25q-7-11-7-25z" fill="#2a1f18"/>',
 '<rect x="20" y="4" width="20" height="28" rx="6" fill="#e74c3c"/><rect x="19" y="28" width="22" height="86" rx="8" fill="#eef1f5"/><rect x="19" y="28" width="7" height="86" rx="4" fill="#ffffff"/><rect x="19" y="56" width="22" height="18" fill="#e74c3c"/><path d="M21 114h18l-4 14H25z" fill="#9aa3b0"/><path d="M26 128h8l-2 13h-4z" fill="#1d1d1d"/>',
 '<path d="M14 22q8-16 16-2" stroke="#2a2f38" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="22" y="20" width="16" height="96" rx="8" fill="#aeb7c4"/><rect x="22" y="20" width="5" height="96" rx="3" fill="#e3e8ef"/><path d="M38 52h10l4-16h-8z" fill="#c9d1dc"/><ellipse cx="48" cy="36" rx="8" ry="3" fill="#7f8896"/><rect x="26" y="40" width="8" height="10" rx="2" fill="#2d3440"/><path d="M22 116h16l-5 18h-6z" fill="#c9d1dc"/><path d="M27 134h6l-2 7h-2z" fill="#4a5260"/>',
 '<circle cx="30" cy="141" r="9" fill="#7cc4ff" opacity=".35"/><path d="M18 4h24l-3 26H21z" fill="#d7e3ef"/><rect x="18" y="4" width="24" height="6" rx="2" fill="#f4f8fc"/><rect x="20" y="30" width="20" height="70" rx="6" fill="#2563eb"/><rect x="20" y="30" width="6" height="70" rx="3" fill="#60a5fa"/><path d="M40 60h12l-2 40h-8z" fill="#1f2937"/><path d="M38 64q8 6 0 14" stroke="#e5e7eb" stroke-width="3" fill="none"/><rect x="22" y="100" width="16" height="16" rx="3" fill="#9aa3b0"/><path d="M23 116h14l-4 18h-6z" fill="#e5e7eb"/><path d="M27 134h6l-2 7h-2z" fill="#334155"/>'];
 return '<svg viewBox="'+(V[t]||V.hammer)+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+(m[l]||'')+'</svg>';
}
function plw(n,a,b,c){n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m>1&&m<5?b:m===1?a:c}
function toWorkshop(i){const q=S.inv[i];if(!q)return;wsel=q.id;const nb=document.querySelector('.sb[data-t="t8"]');if(nb)nb.click();setTimeout(()=>{try{wkRender(true)}catch(e){}},40)}
function clearLeft(){const l=B&&B.pl&&B.pl.querySelector('.ll');if(l)l.innerHTML=''}
function showLeft(k){
 if(!B||!B.pl||!B.pl.isConnected)return;
 let l=B.pl.querySelector('.ll');if(!l){l=document.createElement('i');l.className='ll';B.pl.appendChild(l)}
 l.innerHTML='';if(!k||!(B.q.d[k]>=3))return;
 const cv=k==='rust'?B.cr:B.cd;if(!cv||cv.style.display==='none'||!cv.width)return;
 const w=cv.width,h=cv.height,dt=ctx2(cv).getImageData(0,0,w,h).data,gx=12,gy=4,cw=w/gx,chh=h/gy,cells=[];let mx=0;
 for(let a=0;a<gx;a++)for(let b=0;b<gy;b++){let s=0,n=0;for(let x=Math.floor(a*cw);x<Math.min(w,(a+1)*cw);x+=3)for(let y=Math.floor(b*chh);y<Math.min(h,(b+1)*chh);y+=3){s+=dt[(y*w+x)*4+3];n++}const v=n?s/n:0;if(v>mx)mx=v;cells.push({x:(a+.5)/gx,y:(b+.5)/gy,v})}
 const th=Math.max(k==='rust'?14:16,mx*.3);
 cells.filter(c=>c.v>th).sort((p,q)=>q.v-p.v).slice(0,8).forEach(c=>{const e=document.createElement('b');e.className='lm '+k;e.style.left=(c.x*100).toFixed(1)+'%';e.style.top=(c.y*100).toFixed(1)+'%';l.appendChild(e)});
 const s0=B[k+'S'],pc=s0?Math.max(1,Math.round(Math.min(1,sumA(cv)/s0)*100)):0;
 say((k==='rust'?'Осталось ржавчины: ':'Осталось налёта: ')+pc+'%. Кружки показывают, где ещё грязно')
}

const ACH=[
 {id:'r100',i:'🎰',n:'Первая сотня',d:'Прокрутите 100 номеров',g:100,v:()=>S.rolls||0,rw:3000},
 {id:'r1k',i:'🎲',n:'Азарт',d:'Прокрутите 1 000 номеров',g:1000,v:()=>S.rolls||0,rw:40000},
 {id:'f10',i:'🧰',n:'Руки из нужного места',d:'Сделайте 10 этапов ремонта вручную',g:10,v:()=>WORDER.reduce((a,t)=>a+(W().tu[t]||0),0),rw:6000},
 {id:'f100',i:'🛠',n:'Мастер реставрации',d:'Сделайте 100 этапов ремонта вручную',g:100,v:()=>WORDER.reduce((a,t)=>a+(W().tu[t]||0),0),rw:70000},
 {id:'o10',i:'📋',n:'Надёжный продавец',d:'Выполните 10 заказов',g:10,v:()=>S.done||0,rw:12000},
 {id:'e1m',i:'💰',n:'Первый миллион',d:'Заработайте 1 млн ₽',g:1e6,v:()=>S.earned||0,rw:50000},
 {id:'e10m',i:'💎',n:'Магнат',d:'Заработайте 10 млн ₽',g:1e7,v:()=>S.earned||0,rw:400000},
 {id:'g12',i:'🚗',n:'Полный гараж',d:'Соберите 12 номеров в гараже',g:12,v:()=>(S.col||[]).length,rw:30000},
 {id:'wl5',i:'🏭',n:'Свой цех',d:'Поднимите мастерскую до 5 уровня',g:5,v:()=>wLv(),rw:80000},
 {id:'t12',i:'🔨',n:'Хороший набор',d:'Улучшите инструменты в сумме на 12 уровней',g:12,v:()=>WORDER.reduce((a,t)=>a+TL(t),0),rw:150000},
 {id:'d7',i:'🔥',n:'Постоянный игрок',d:'Забирайте ежедневный бонус 7 дней подряд',g:7,v:()=>(S.daily&&S.daily.best)||0,rw:70000}];
function achRender(){
 const el=$('ach');S.ach=S.ach||{};let ready=0,got=0;
 const h=ACH.map(a=>{const v=Math.min(a.g,a.v()||0),ok=!!S.ach[a.id],can=!ok&&v>=a.g;if(can)ready++;if(ok)got++;
  return `<div class="ach ${ok?'got':can?'can':''}"><span class="ach-ic">${a.i}</span><div class="ach-b"><b>${a.n}</b><span>${a.d}</span><div class="ach-bar"><i style="width:${(v/a.g*100).toFixed(1)}%"></i></div><small>${fmt(v)} / ${fmt(a.g)}</small></div><button type="button" data-ach="${a.id}" ${can?'':'disabled'}>${ok?'Получено ✓':can?'Забрать<br>+'+fmt(a.rw)+' ₽':'+'+fmt(a.rw)+' ₽'}</button></div>`}).join('');
 if(el&&el._h!==h){el.innerHTML=h;el._h=h}
 const s=$('achsum');if(s)s.textContent='Получено '+got+' из '+ACH.length+(ready?' · можно забрать: '+ready:'');
 document.querySelectorAll('.sb[data-t="t4"]').forEach(b=>{let x=b.querySelector('.achb');if(!x){x=document.createElement('i');x.className='bdg achb';b.appendChild(x)}x.textContent=ready?String(ready):''});
}
const dkey=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
function dailyRw(s){return Math.round((1500+Math.min((S.earned||0)*.002,60000))*Math.min(7,Math.max(1,s))/100)*100}
function dailyInfo(){const D=S.daily||{d:'',s:0,best:0},t=dkey(new Date()),y=dkey(new Date(Date.now()-864e5)),can=D.d!==t,streak=can?(D.d===y?D.s+1:1):D.s;return{D,t,can,streak,rw:dailyRw(streak)}}
function dailyRender(){const b=$('daily');if(!b)return;const I=dailyInfo();const h=I.can?`🎁 Ежедневный бонус<small>день ${I.streak} · +${fmt(I.rw)} ₽</small>`:`✓ Бонус получен<small>серия: ${I.D.s} ${plw(I.D.s,'день','дня','дней')} · завтра снова</small>`;if(b._h!==h){b.innerHTML=h;b._h=h}b.disabled=!I.can;b.classList.toggle('can',I.can)}
function upsSummary(){const p=$('upsum');if(!p)return;let a=0,m=0;U.forEach(u=>{a+=S.lv[u.id]||0;m+=u.max});p.textContent='Улучшения для прокрутки, склада и ремонта. Куплено уровней: '+a+' из '+m+'.'}
function v4toast(t){try{if(window.nmToast)nmToast(t)}catch(e){}}
function v4Render(){achRender();dailyRender();upsSummary()}
document.addEventListener('click',e=>{
 const d=e.target.closest('#daily');
 if(d){if(d.disabled)return;const I=dailyInfo();if(!I.can)return;S.daily={d:I.t,s:I.streak,best:Math.max(I.D.best||0,I.streak)};S.money+=I.rw;save();draw();v4toast('Ежедневный бонус: +'+fmt(I.rw)+' ₽');return}
 const a=e.target.closest('[data-ach]');
 if(a&&!a.disabled){const x=ACH.find(z=>z.id===a.dataset.ach);S.ach=S.ach||{};if(!x||S.ach[x.id]||(x.v()||0)<x.g)return;S.ach[x.id]=Date.now();S.money+=x.rw;save();draw();v4toast('Достижение «'+x.n+'»: +'+fmt(x.rw)+' ₽')}
});
draw=(function(o){return function(){const r=o.apply(this,arguments);try{v4Render()}catch(e){console.error(e)}return r}})(draw);
try{v4Render()}catch(e){console.error(e)}
setTool=(function(o){return function(){const r=o.apply(this,arguments);try{if(B&&B.pl&&B.pl.isConnected)showLeft(T==='rust'?'rust':T==='polish'?'dull':null)}catch(e){}return r}})(setTool);

