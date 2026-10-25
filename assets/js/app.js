const plan=[30,40,50,...Array.from({length:30},(_,i)=>60+i*15),500,500,500];
const KEY='sport-v1';
let data;
try{data=JSON.parse(localStorage.getItem(KEY)||'{"done":{},"reps":{},"metrics":{}}')}catch(e){data={done:{},reps:{},metrics:{}}}
data.done=data.done&&typeof data.done==='object'?data.done:{};
data.reps=data.reps&&typeof data.reps==='object'?data.reps:{};
data.metrics=data.metrics&&typeof data.metrics==='object'?data.metrics:{};
if(!data.startDate)data.startDate=new Date().toISOString().slice(0,10);
if(!data.metricHistory)data.metricHistory=[];
if(!data.bestStreak)data.bestStreak=0;
if(!data.sessions)data.sessions={};
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const target=d=>plan[Math.min(35,Math.floor((d-1)/10))];
const doneCount=()=>Object.entries(data.done).filter(([d,v])=>v&&+d>=1&&+d<=360).length;
const elapsedDoneCount=()=>Object.entries(data.done).filter(([d,v])=>v&&+d>=1&&+d<=current()).length;
const current=()=>{const start=new Date(data.startDate+'T00:00:00');if(Number.isNaN(start.getTime()))return 1;return Math.min(360,Math.max(1,Math.floor((new Date().setHours(0,0,0,0)-start.getTime())/86400000)+1))};
const dayDate=d=>{const x=new Date(data.startDate+'T00:00:00');x.setDate(x.getDate()+d-1);return x};
const fmt=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const fmtLong=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
function render(){
 const cur=current(),pct=Math.round(elapsedDoneCount()/360*100),t=target(cur);
 document.querySelector('#yearPct').textContent=pct+'%';document.querySelector('#yearRing').style.background='conic-gradient(var(--accent) '+pct*3.6+'deg,#242a31 0deg)';
 document.querySelector('#streak').textContent=calcStreak()+' дней';document.querySelector('#totalReps').textContent=Object.values(data.reps).reduce((a,b)=>a+(+b||0),0).toLocaleString('ru');
 document.querySelector('#currentDay').textContent=cur+' / 360';document.querySelector('#todayTarget').textContent=t;document.querySelector('#levelNo').textContent=Math.floor((cur-1)/10)+1;
 document.querySelector('#overallBar').style.width=pct+'%';document.querySelector('#sideBar').style.width=pct+'%';document.querySelector('#sidePct').textContent=pct+'%';document.querySelector('#todayInput').value=data.reps[cur]||0;
 document.querySelector('#todayLabel').textContent=fmtLong(dayDate(cur))+' • День '+cur+' из 360';
 document.querySelector('#startDateLabel').textContent=fmtLong(dayDate(1));document.querySelector('#finishDateLabel').textContent=fmtLong(dayDate(360));
 document.querySelector('#planReps').textContent=Array.from({length:cur},(_,i)=>i+1).filter(d=>data.done[d]).reduce((a,d)=>a+target(d),0).toLocaleString('ru');
 document.querySelector('#phaseText').textContent=cur>330?'Финальная подготовка. Скоро контрольный месяц.':cur>30?'Рабочий блок. Объём растёт — техника остаётся чистой.':'Первый месяц. Формируем ежедневную привычку.';
 const box=document.querySelector('#months');box.innerHTML='';
 for(let m=1;m<=12;m++){let a=(m-1)*30+1,b=m*30,el=document.createElement('article');el.className='month '+(cur>=a&&cur<=b?'current':'');
 let completed=0,ds='';for(let d=a;d<=b;d++){if(data.done[d])completed++;ds+=`<button class="day ${data.done[d]?'done':''} ${d===cur?'today':''}" data-day="${d}" title="${fmtLong(dayDate(d))}: ${target(d)} отжиманий">${d-a+1}<small>${fmt(dayDate(d))}</small></button>`}
 el.innerHTML=`<div class="month-head"><b>Месяц ${m}</b><span>${completed}/30 • ${target(a)}→${target(b)}</span></div><div class="days">${ds}</div>`;box.appendChild(el)}
 document.querySelectorAll('.day').forEach(x=>x.onclick=()=>{let d=+x.dataset.day;if(d>current())return;data.done[d]=!data.done[d];if(data.done[d]&&!data.reps[d])data.reps[d]=target(d);save();render()});
 renderHistory();renderMetricKpis();renderGame();renderAchievements();renderChart(activeChart);renderSession();
}
function calcStreak(){let s=0,cur=current();for(let d=cur;d>=1;d--){if(data.done[d])s++;else if(d===cur)continue;else break}return s}
function renderHistory(){const box=document.querySelector('#historyList');let rows=[];for(let d=360;d>=1&&rows.length<8;d--)if(data.done[d]||data.reps[d]){let s=data.sessions[d],detail=s&&s.sets?.length?`${s.sets.length} подх. • ${s.difficulty?'сложность '+s.difficulty+'/5':'без оценки'}`:'быстрая запись';rows.push(`<div class="history-row" data-history-day="${d}"><span class="history-status ${data.done[d]?'ok':''}">${data.done[d]?'✓':'•'}</span><div><b>День ${d}</b><small>${fmtLong(dayDate(d))} • ${detail}</small></div><div><span>Цель</span><b>${target(d)}</b></div><div><span>Факт</span><b>${data.reps[d]||0}</b></div></div>`)}box.innerHTML=rows.length?rows.join(''):'<div class="empty-history">Здесь появятся завершённые тренировки. Первый день — начало истории.</div>'}
function renderMetricKpis(){let hist=data.metricHistory||[],last=hist.at(-1)||data.metrics||{},first=hist[0]||last;document.querySelector('#weightKpi').textContent=last.weight?last.weight+' кг':'—';document.querySelector('#maxKpi').textContent=last.maxSet||'—';let delta=(last.weight&&first.weight)?(+last.weight-+first.weight):null;document.querySelector('#weightDelta').textContent=delta===null?'—':(delta>0?'+':'')+delta.toFixed(1)+' кг'}
document.querySelector('#plusBtn').onclick=()=>document.querySelector('#todayInput').value=(+document.querySelector('#todayInput').value||0)+5;
document.querySelector('#minusBtn').onclick=()=>document.querySelector('#todayInput').value=Math.max(0,(+document.querySelector('#todayInput').value||0)-5);
document.querySelector('#doneBtn').onclick=()=>{let d=current(),v=+document.querySelector('#todayInput').value||target(d);data.reps[d]=v;data.done[d]=true;save();render()};
document.querySelector('#themeBtn').onclick=()=>document.body.classList.toggle('light');
['weight','maxSet','waist','note'].forEach(k=>document.querySelector('#'+k).value=data.metrics[k]||'');
document.querySelector('#saveMetrics').onclick=()=>{['weight','maxSet','waist','note'].forEach(k=>data.metrics[k]=document.querySelector('#'+k).value);data.metricHistory.push({...data.metrics,date:new Date().toISOString()});save();renderMetricKpis();alert('Показатели сохранены')};
document.querySelector('#editStartBtn').onclick=()=>{let v=prompt('Дата старта челленджа (ГГГГ-ММ-ДД):',data.startDate);if(/^\d{4}-\d{2}-\d{2}$/.test(v||'')){data.startDate=v;save();render()}};
document.querySelector('#todayLabel').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
render();
const menuBtn=document.querySelector('#menuBtn'),sidebar=document.querySelector('#sidebar'),overlay=document.querySelector('#sidebarOverlay');
function closeMenu(){sidebar.classList.remove('open');overlay.classList.remove('open')}
menuBtn.onclick=()=>{sidebar.classList.toggle('open');overlay.classList.toggle('open')};overlay.onclick=closeMenu;
document.querySelectorAll('.side-nav a').forEach(a=>a.addEventListener('click',closeMenu));
const observed=['dashboard','pushups','modules'];window.addEventListener('scroll',()=>{let active='dashboard';for(const id of observed){const el=document.getElementById(id);if(el&&el.getBoundingClientRect().top<180)active=id}document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+active))});

let activeChart='reps';
function longestStreak(){let best=0,s=0;for(let d=1;d<=360;d++){if(data.done[d]){s++;best=Math.max(best,s)}else s=0}return best}
function renderGame(){
 const completed=elapsedDoneCount(), total=Object.entries(data.reps).filter(([d])=>+d>=1&&+d<=360).reduce((a,[,b])=>a+(Number.isFinite(+b)&&+b>0?+b:0),0), xp=completed*100+Math.floor(total/10), level=Math.floor(xp/500)+1, into=xp%500;
 data.bestStreak=Math.max(data.bestStreak||0,longestStreak());save();
 const elapsed=Math.max(1,current()), rate=Math.round(completed/elapsed*100),best=Math.max(0,...Object.entries(data.reps).filter(([d])=>+d>=1&&+d<=360).map(([,v])=>+v||0));
 document.querySelector('#gameLevel').textContent=level;document.querySelector('#xpNow').textContent=into;document.querySelector('#xpNext').textContent=500;document.querySelector('#xpBar').style.width=(into/5)+'%';
 document.querySelector('#bestStreak').textContent=data.bestStreak+' дней';document.querySelector('#bestDay').textContent=best.toLocaleString('ru');document.querySelector('#completionRate').textContent=Math.min(100,rate)+'%';
}
const achievementDefs=[
 ['first','ПЕРВЫЙ ШАГ','Завершить первую тренировку',()=>doneCount()>=1,'01'],
 ['streak7','НЕДЕЛЯ БЕЗ СДАЧИ','Серия 7 дней подряд',()=>longestStreak()>=7,'07'],
 ['thousand','ПЕРВАЯ 1000','Сделать 1 000 отжиманий суммарно',()=>Object.values(data.reps).reduce((a,b)=>a+(+b||0),0)>=1000,'1K'],
 ['month','30 ДНЕЙ','Завершить 30 тренировок',()=>doneCount()>=30,'30'],
 ['hundred','СОТНЯ','Выполнить 100 отжиманий за день',()=>Math.max(0,...Object.values(data.reps).map(Number))>=100,'100'],
 ['tenk','10 000','Сделать 10 000 отжиманий суммарно',()=>Object.values(data.reps).reduce((a,b)=>a+(+b||0),0)>=10000,'10K'],
 ['half','ПОЛПУТИ','Завершить 180 тренировок',()=>doneCount()>=180,'50%'],
 ['fivehundred','500','Выполнить 500 отжиманий за день',()=>Math.max(0,...Object.values(data.reps).map(Number))>=500,'500'],
 ['finish','360','Завершить годовой челлендж',()=>doneCount()>=360,'★']
];
function renderAchievements(){let open=0;document.querySelector('#achievements').innerHTML=achievementDefs.map(a=>{let yes=a[3]();if(yes)open++;return `<article class="achievement ${yes?'unlocked':'locked'}"><div class="badge">${a[4]}</div><div><b>${a[1]}</b><span>${a[2]}</span></div><i>${yes?'ОТКРЫТО':'ЗАКРЫТО'}</i></article>`}).join('');document.querySelector('#achievementCount').textContent=open+' / '+achievementDefs.length}
function renderChart(type='reps'){
 const svg=document.querySelector('#progressChart'),empty=document.querySelector('#chartEmpty');let pts=[];
 if(type==='reps'){for(let d=1;d<=360;d++)if(data.reps[d])pts.push([d,+data.reps[d]])}
 else{(data.metricHistory||[]).forEach((m,i)=>{if(m.weight)pts.push([i+1,+m.weight])})}
 if(pts.length<2){svg.innerHTML='';empty.style.display='grid';return}empty.style.display='none';
 const vals=pts.map(p=>p[1]),min=Math.min(...vals),max=Math.max(...vals),span=Math.max(1,max-min),n=Math.max(2,pts.length);
 const xMin=pts[0][0],xMax=pts[pts.length-1][0],xSpan=Math.max(1,xMax-xMin);
 const xy=pts.map((p,i)=>[25+(p[0]-xMin)/xSpan*850,225-(p[1]-min)/span*180]);
 const poly=xy.map(p=>p.join(',')).join(' ');svg.innerHTML=`<line x1="25" y1="225" x2="875" y2="225" class="axis"/><polyline points="${poly}" class="chart-line"/>${xy.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" class="chart-dot"><title>${type==='reps'?'Тренировка':'Замер'} ${pts[i][0]}: ${pts[i][1]}</title></circle>`).join('')}`;
}
document.querySelectorAll('.chart-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chart-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');activeChart=b.dataset.chart;renderChart(activeChart)});

let restSeconds=90,restLeft=90,timerId=null;
const getSession=d=>data.sessions[d]||(data.sessions[d]={sets:[],difficulty:'',feeling:'',note:'',startedAt:null,finishedAt:null});
function renderSession(){
 const d=current(),s=getSession(d),sum=s.sets.reduce((a,b)=>a+(+b||0),0),goal=target(d),left=Math.max(0,goal-sum);
 document.querySelector('#setsTotal').textContent=sum;document.querySelector('#setsCount').textContent=s.sets.length;document.querySelector('#remainingReps').textContent=left;
 document.querySelector('#sessionBar').style.width=Math.min(100,sum/goal*100)+'%';
 document.querySelector('#setsList').innerHTML=s.sets.length?s.sets.map((v,i)=>`<div class="set-chip"><span>Подход ${i+1}</span><b>${v}</b><button data-remove-set="${i}" title="Удалить">×</button></div>`).join(''):'<div class="empty-sets">Подходов пока нет</div>';
 document.querySelector('#difficulty').value=s.difficulty||'';document.querySelector('#feeling').value=s.feeling||'';document.querySelector('#sessionNote').value=s.note||'';
 document.querySelectorAll('[data-remove-set]').forEach(b=>b.onclick=()=>{s.sets.splice(+b.dataset.removeSet,1);syncSessionReps(d,s);save();render()});
}
function syncSessionReps(d,s){const sum=s.sets.reduce((a,b)=>a+(+b||0),0);if(sum>0)data.reps[d]=sum;else if(!data.done[d])delete data.reps[d]}
document.querySelector('#addSetBtn').onclick=()=>{const d=current(),s=getSession(d),inp=document.querySelector('#setInput'),v=Math.floor(+inp.value);if(!Number.isFinite(v)||v<1||v>1000)return;if(!s.startedAt)s.startedAt=new Date().toISOString();s.sets.push(v);syncSessionReps(d,s);inp.value='';save();render();inp.focus()};
document.querySelector('#setInput').addEventListener('keydown',e=>{if(e.key==='Enter')document.querySelector('#addSetBtn').click()});
['difficulty','feeling','sessionNote'].forEach(id=>document.querySelector('#'+id).addEventListener('change',e=>{const s=getSession(current());s[id==='sessionNote'?'note':id]=e.target.value;save()}));
document.querySelector('#finishSessionBtn').onclick=()=>{const d=current(),s=getSession(d),sum=s.sets.reduce((a,b)=>a+(+b||0),0);if(!sum){alert('Сначала добавь хотя бы один подход.');return}if(sum<target(d)&&!confirm(`Сейчас выполнено ${sum} из ${target(d)}. Завершить тренировку как выполненную?`))return;s.finishedAt=new Date().toISOString();data.reps[d]=sum;data.done[d]=true;save();render()};
function paintTimer(){document.querySelector('#timerDisplay').textContent=String(Math.floor(restLeft/60)).padStart(2,'0')+':'+String(restLeft%60).padStart(2,'0')}
document.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{if(timerId)return;document.querySelectorAll('[data-rest]').forEach(x=>x.classList.remove('active'));b.classList.add('active');restSeconds=+b.dataset.rest;restLeft=restSeconds;paintTimer()});
document.querySelector('#timerBtn').onclick=()=>{const btn=document.querySelector('#timerBtn');if(timerId){clearInterval(timerId);timerId=null;restLeft=restSeconds;btn.textContent='▶ Старт';paintTimer();return}restLeft=restSeconds;paintTimer();btn.textContent='■ Стоп';timerId=setInterval(()=>{restLeft--;paintTimer();if(restLeft<=0){clearInterval(timerId);timerId=null;btn.textContent='▶ Старт';restLeft=restSeconds;setTimeout(paintTimer,800)}},1000)};
paintTimer();
