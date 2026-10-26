const plan=[30,40,50,...Array.from({length:30},(_,i)=>60+i*15),500,500,500];
const KEY='sport-v1';
let data;
try{data=JSON.parse(localStorage.getItem(KEY)||'{"done":{},"reps":{},"metrics":{}}')}catch(e){data={done:{},reps:{},metrics:{}}}
data.done=data.done&&typeof data.done==='object'?data.done:{};
data.reps=data.reps&&typeof data.reps==='object'?data.reps:{};
data.metrics=data.metrics&&typeof data.metrics==='object'?data.metrics:{};
if(!data.startDate){
 const knownDays=Object.keys(data.done||{}).concat(Object.keys(data.reps||{})).map(Number).filter(n=>Number.isFinite(n)&&n>=1&&n<=360);
 const inferredDay=knownDays.length?Math.max(...knownDays):1, x=new Date();x.setHours(0,0,0,0);x.setDate(x.getDate()-(inferredDay-1));data.startDate=x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
}
if(!data.metricHistory)data.metricHistory=[];
if(!data.bestStreak)data.bestStreak=0;
if(!data.sessions)data.sessions={};
const save=()=>{data.schemaVersion=3;localStorage.setItem(KEY,JSON.stringify(data))};
const target=d=>plan[Math.min(35,Math.floor((d-1)/10))];
const doneCount=()=>Object.entries(data.done).filter(([d,v])=>v&&+d>=1&&+d<=360).length;
const elapsedDoneCount=()=>Object.entries(data.done).filter(([d,v])=>v&&+d>=1&&+d<=current()).length;
const current=()=>{const start=new Date(data.startDate+'T00:00:00');if(Number.isNaN(start.getTime()))return 1;return Math.min(360,Math.max(1,Math.floor((new Date().setHours(0,0,0,0)-start.getTime())/86400000)+1))};
const dayDate=d=>{const x=new Date(data.startDate+'T00:00:00');x.setDate(x.getDate()+d-1);return x};
const fullPlanReps=()=>Array.from({length:360},(_,i)=>target(i+1)).reduce((a,b)=>a+b,0);
const actualReps=()=>Object.entries(data.reps).filter(([d])=>+d>=1&&+d<=360).reduce((a,[,v])=>a+(+v||0),0);
function syncDayStatus(d){
 const reps=Math.max(0,+data.reps[d]||0),goal=target(d);
 data.done[d]=reps>=goal;
 if(!reps){delete data.reps[d];delete data.done[d]}
 return !!data.done[d];
}
function setDayReps(d,reps){
 reps=Math.max(0,Math.floor(+reps||0));
 if(reps)data.reps[d]=reps;else delete data.reps[d];
 syncDayStatus(d);save();
}
const fmt=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const fmtLong=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
function render(){
 const cur=current(),pct=Math.round(elapsedDoneCount()/360*100),t=target(cur),volume=actualReps(),planTotal=fullPlanReps(),completedDays=Object.entries(data.done).filter(([d,v])=>v&&+d>=1&&+d<=360).map(([d])=>+d),furthestDone=completedDays.length?Math.max(...completedDays):0,achievedTarget=furthestDone?target(furthestDone):30,progressionPct=furthestDone?Math.max(0,Math.min(100,furthestDone/360*100)):0;
 document.querySelector('#yearPct').textContent=pct+'%';document.querySelector('#yearRing').style.background='conic-gradient(var(--accent) '+pct*3.6+'deg,#242a31 0deg)';
 document.querySelector('#streak').textContent=calcStreak()+' дней';document.querySelector('#totalReps').textContent=Object.values(data.reps).reduce((a,b)=>a+(+b||0),0).toLocaleString('ru');
 document.querySelector('#currentDay').textContent=cur+' / 360';document.querySelector('#todayTarget').textContent=t;document.querySelector('#levelNo').textContent=Math.floor((cur-1)/10)+1;
 const overallBar=document.querySelector('#overallBar'),progressionMarker=document.querySelector('#progressionMarker'),progressionCurrent=document.querySelector('#progressionCurrent'),progressionLabel=document.querySelector('#progressionPct');
 if(overallBar)overallBar.style.width=progressionPct+'%';if(progressionMarker)progressionMarker.style.left=progressionPct+'%';if(progressionCurrent)progressionCurrent.textContent=achievedTarget;if(progressionLabel)progressionLabel.textContent=progressionPct.toFixed(progressionPct<10?1:0)+'% пути • день '+furthestDone+'/360';document.querySelector('#sideBar').style.width=pct+'%';document.querySelector('#sidePct').textContent=pct+'%';
 const yearPct=Math.min(100,volume/planTotal*100),yearActual=document.querySelector('#yearActual'),yearBar=document.querySelector('#yearVolumeBar'),yearPctEl=document.querySelector('#yearVolumePct'),yearRemaining=document.querySelector('#yearRemaining');
 if(yearActual)yearActual.textContent=volume.toLocaleString('ru');if(yearBar)yearBar.style.width=yearPct+'%';if(yearPctEl)yearPctEl.textContent=yearPct.toFixed(yearPct<1?2:1)+'%';if(yearRemaining)yearRemaining.textContent='Осталось '+Math.max(0,planTotal-volume).toLocaleString('ru');document.querySelector('#todayInput').value=data.reps[cur]||0;
 document.querySelector('#todayLabel').textContent=fmtLong(dayDate(cur))+' • День '+cur+' из 360';
 document.querySelector('#startDateLabel').textContent=fmtLong(dayDate(1));document.querySelector('#finishDateLabel').textContent=fmtLong(dayDate(360));
 document.querySelector('#planReps').textContent=Array.from({length:cur},(_,i)=>i+1).filter(d=>data.done[d]).reduce((a,d)=>a+target(d),0).toLocaleString('ru');
 document.querySelector('#phaseText').textContent=cur>330?'Финальная подготовка. Скоро контрольный месяц.':cur>30?'Рабочий блок. Объём растёт — техника остаётся чистой.':'Первый месяц. Формируем ежедневную привычку.';
 const box=document.querySelector('#months');box.innerHTML='';
 for(let m=1;m<=12;m++){let a=(m-1)*30+1,b=m*30,el=document.createElement('article');el.className='month '+(cur>=a&&cur<=b?'current':'');
 let completed=0,ds='';for(let d=a;d<=b;d++){if(data.done[d])completed++;ds+=`<button class="day ${data.done[d]?'done':''} ${d===cur?'today':''}" data-day="${d}" title="${fmtLong(dayDate(d))}: ${target(d)} отжиманий">${d-a+1}<small>${fmt(dayDate(d))}</small></button>`}
 el.innerHTML=`<div class="month-head"><b>Месяц ${m}</b><span>${completed}/30 • ${target(a)}→${target(b)}</span></div><div class="days">${ds}</div>`;box.appendChild(el)}
 document.querySelectorAll('.day').forEach(x=>{
 x.onclick=()=>{let d=+x.dataset.day;if(d>current())return;
   if(!data.done[d]){setDayReps(d,target(d));render()}
   else openDayEditor(d)
 };
 x.oncontextmenu=e=>{e.preventDefault();let d=+x.dataset.day;if(d<=current())openDayEditor(d)}
});
 renderHistory();renderMetricKpis();renderGame();renderAchievements();renderChart(activeChart);renderSession();renderDeepAnalytics();
}
function calcStreak(){let s=0,cur=current();for(let d=cur;d>=1;d--){if(data.done[d])s++;else if(d===cur)continue;else break}return s}
function historyRow(d){let s=data.sessions[d],detail=s&&s.sets?.length?`${s.sets.length} подх. • ${s.difficulty?'сложность '+s.difficulty+'/5':'без оценки'}`:'быстрая запись';return `<div class="history-row clickable" data-history-day="${d}"><span class="history-status ${data.done[d]?'ok':''}">${data.done[d]?'✓':'•'}</span><div><b>День ${d}</b><small>${fmtLong(dayDate(d))} • ${detail}</small></div><div><span>Цель</span><b>${target(d)}</b></div><div><span>Факт</span><b>${data.reps[d]||0}</b></div></div>`}
function bindHistoryRows(root=document){root.querySelectorAll('[data-history-day]').forEach(r=>r.onclick=()=>{closeHistory();openDayEditor(+r.dataset.historyDay)})}
function renderHistory(){const box=document.querySelector('#historyList');let rows=[];for(let d=360;d>=1&&rows.length<8;d--){if(data.done[d]||data.reps[d])rows.push(historyRow(d))}box.innerHTML=rows.length?rows.join(''):'<div class="empty-history">Здесь появятся завершённые тренировки. Первый день — начало истории.</div>';bindHistoryRows(box)}
function renderMetricKpis(){let hist=data.metricHistory||[],last=hist.at(-1)||data.metrics||{},first=hist[0]||last;document.querySelector('#weightKpi').textContent=last.weight?last.weight+' кг':'—';document.querySelector('#maxKpi').textContent=last.maxSet||'—';let delta=(last.weight&&first.weight)?(+last.weight-+first.weight):null;document.querySelector('#weightDelta').textContent=delta===null?'—':(delta>0?'+':'')+delta.toFixed(1)+' кг';const mc=document.querySelector('#measureCount');if(mc)mc.textContent=hist.length+' '+(hist.length===1?'запись':'записей')}
document.querySelector('#plusBtn').onclick=()=>document.querySelector('#todayInput').value=(+document.querySelector('#todayInput').value||0)+5;
document.querySelector('#minusBtn').onclick=()=>document.querySelector('#todayInput').value=Math.max(0,(+document.querySelector('#todayInput').value||0)-5);
function commitTodayInput(){const d=current(),v=Math.max(0,Math.floor(+document.querySelector('#todayInput').value||0));setDayReps(d,v);render()}
document.querySelector('#doneBtn').onclick=()=>{let d=current(),v=Math.max(0,Math.floor(+document.querySelector('#todayInput').value||0));if(!v)v=target(d);setDayReps(d,v);render()};
document.querySelector('#todayInput').addEventListener('change',commitTodayInput);
document.querySelector('#themeBtn').onclick=()=>document.body.classList.toggle('light');
['weight','maxSet','waist','note'].forEach(k=>document.querySelector('#'+k).value=data.metrics[k]||'');
document.querySelector('#saveMetrics').onclick=()=>{['weight','maxSet','waist','note'].forEach(k=>data.metrics[k]=document.querySelector('#'+k).value);data.metricHistory.push({...data.metrics,date:new Date().toISOString()});save();renderMetricKpis();alert('Показатели сохранены')};
document.querySelector('#editStartBtn').onclick=()=>{let v=prompt('Дата старта челленджа (ГГГГ-ММ-ДД):',data.startDate);if(/^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!Number.isNaN(new Date(v+'T00:00:00').getTime())){data.startDate=v;save();render()}else if(v!==null)alert('Дата должна быть в формате ГГГГ-ММ-ДД')};
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
 data.bestStreak=Math.max(data.bestStreak||0,longestStreak());
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
function syncSessionReps(d,s){const sum=s.sets.reduce((a,b)=>a+(+b||0),0);if(sum>0)data.reps[d]=sum;else delete data.reps[d];syncDayStatus(d)}
document.querySelector('#addSetBtn').onclick=()=>{const d=current(),s=getSession(d),inp=document.querySelector('#setInput'),v=Math.floor(+inp.value);if(!Number.isFinite(v)||v<1||v>1000)return;if(!s.startedAt)s.startedAt=new Date().toISOString();s.sets.push(v);syncSessionReps(d,s);inp.value='';save();render();inp.focus()};
document.querySelector('#setInput').addEventListener('keydown',e=>{if(e.key==='Enter')document.querySelector('#addSetBtn').click()});
['difficulty','feeling','sessionNote'].forEach(id=>document.querySelector('#'+id).addEventListener('change',e=>{const s=getSession(current());s[id==='sessionNote'?'note':id]=e.target.value;save()}));
document.querySelector('#finishSessionBtn').onclick=()=>{const d=current(),s=getSession(d),sum=s.sets.reduce((a,b)=>a+(+b||0),0);if(!sum){alert('Сначала добавь хотя бы один подход.');return}if(sum<target(d)&&!confirm(`Сейчас выполнено ${sum} из ${target(d)}. Завершить тренировку как выполненную?`))return;s.finishedAt=new Date().toISOString();data.reps[d]=sum;syncDayStatus(d);save();render()};
function paintTimer(){document.querySelector('#timerDisplay').textContent=String(Math.floor(restLeft/60)).padStart(2,'0')+':'+String(restLeft%60).padStart(2,'0')}
document.querySelectorAll('[data-rest]').forEach(b=>b.onclick=()=>{if(timerId)return;document.querySelectorAll('[data-rest]').forEach(x=>x.classList.remove('active'));b.classList.add('active');restSeconds=+b.dataset.rest;restLeft=restSeconds;paintTimer()});
document.querySelector('#timerBtn').onclick=()=>{const btn=document.querySelector('#timerBtn');if(timerId){clearInterval(timerId);timerId=null;restLeft=restSeconds;btn.textContent='▶ Старт';paintTimer();return}restLeft=restSeconds;paintTimer();btn.textContent='■ Стоп';timerId=setInterval(()=>{restLeft--;paintTimer();if(restLeft<=0){clearInterval(timerId);timerId=null;btn.textContent='▶ Старт';restLeft=restSeconds;setTimeout(paintTimer,800)}},1000)};
paintTimer();

let editingDay=null;
function openDayEditor(d){
 editingDay=d;const s=getSession(d);
 document.querySelector('#editDayTitle').textContent='День '+d;
 document.querySelector('#editDayDate').textContent=fmtLong(dayDate(d));
 document.querySelector('#editDayTarget').textContent=target(d);
 document.querySelector('#editDayReps').value=data.reps[d]||target(d);
 document.querySelector('#editDaySets').value=(s.sets||[]).join(', ');
 document.querySelector('#editDayDifficulty').value=s.difficulty||'';
 document.querySelector('#editDayFeeling').value=s.feeling||'';
 document.querySelector('#editDayNote').value=s.note||'';
 document.querySelector('#dayModal').classList.add('open');document.body.classList.add('modal-open');
}
function closeDayEditor(){document.querySelector('#dayModal').classList.remove('open');document.body.classList.remove('modal-open');editingDay=null}
document.querySelector('#dayModalClose').onclick=closeDayEditor;document.querySelector('#dayModalBackdrop').onclick=closeDayEditor;
document.querySelector('#saveDayBtn').onclick=()=>{if(!editingDay)return;const d=editingDay,reps=Math.max(0,Math.floor(+document.querySelector('#editDayReps').value||0)),raw=document.querySelector('#editDaySets').value.trim();
 const sets=raw?raw.split(/[,;+ ]+/).map(Number).filter(v=>Number.isFinite(v)&&v>0).map(Math.floor):[];
 const setSum=sets.reduce((a,b)=>a+b,0),finalReps=sets.length?setSum:reps;if(finalReps<=0){alert('Укажи количество отжиманий или подходы.');return}
 data.reps[d]=finalReps;syncDayStatus(d);const s=getSession(d);s.sets=sets;s.difficulty=document.querySelector('#editDayDifficulty').value;s.feeling=document.querySelector('#editDayFeeling').value;s.note=document.querySelector('#editDayNote').value;s.finishedAt=s.finishedAt||new Date().toISOString();save();closeDayEditor();render()};
document.querySelector('#deleteDayBtn').onclick=()=>{if(!editingDay||!confirm('Удалить запись этой тренировки?'))return;const d=editingDay;delete data.done[d];delete data.reps[d];delete data.sessions[d];save();closeDayEditor();render()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editingDay)closeDayEditor()});

function renderFullHistory(){const box=document.querySelector('#fullHistoryList');let rows=[];for(let d=current();d>=1;d--)if(data.done[d]||data.reps[d])rows.push(historyRow(d));box.innerHTML=rows.length?rows.join(''):'<div class="empty-history">История пока пуста.</div>';bindHistoryRows(box)}
function openHistory(){renderFullHistory();document.querySelector('#historyModal').classList.add('open');document.body.classList.add('modal-open')}
function closeHistory(){document.querySelector('#historyModal').classList.remove('open');if(!document.querySelector('#dayModal').classList.contains('open'))document.body.classList.remove('modal-open')}
document.querySelector('#showAllHistory').onclick=openHistory;document.querySelector('#historyClose').onclick=closeHistory;document.querySelector('#historyBackdrop').onclick=closeHistory;

function renderDeepAnalytics(){
 const entries=Object.entries(data.reps).filter(([d,v])=>+d>=1&&+d<=360&&+v>0).map(([d,v])=>[+d,+v]).sort((a,b)=>a[0]-b[0]);
 const fact=entries.reduce((a,[,v])=>a+v,0),plannedToRecorded=entries.reduce((a,[d])=>a+target(d),0),avg=entries.length?fact/entries.length:0;
 let allSets=[];Object.entries(data.sessions||{}).forEach(([d,s])=>{if(+d>=1&&+d<=360&&Array.isArray(s.sets))allSets.push(...s.sets.map(Number).filter(v=>v>0))});
 const best=entries.length?entries.reduce((a,b)=>b[1]>a[1]?b:a,entries[0]):[0,0],extra=entries.reduce((a,[d,v])=>a+Math.max(0,v-target(d)),0);
 const set=(id,val)=>{const e=document.querySelector(id);if(e)e.textContent=val};
 set('#aPlanFact',plannedToRecorded?Math.round(fact/plannedToRecorded*100)+'%':'0%');set('#aPlanFactSub',fact.toLocaleString('ru')+' / '+plannedToRecorded.toLocaleString('ru'));
 set('#aAvgDay',avg?avg.toFixed(1):'0');set('#aAvgSet',allSets.length?(allSets.reduce((a,b)=>a+b,0)/allSets.length).toFixed(1):'—');set('#aSetsTotal',allSets.length+' подходов записано');
 set('#aBestDay',best[1].toLocaleString('ru'));set('#aBestDayDate',best[0]?fmtLong(dayDate(best[0])):'—');set('#aDoneDays',doneCount());set('#aDoneDaysSub','из 360');set('#aExtra',extra.toLocaleString('ru'));
 const levels=[30,50,100,150,200,300,400,500],mil=document.querySelector('#milestones');
 if(mil)mil.innerHTML=levels.map(n=>{const hit=entries.find(([,v])=>v>=n);return `<div class="milestone ${hit?'hit':''}"><span>${hit?'✓':'○'}</span><div><b>${n}</b><small>${hit?fmt(dayDate(hit[0])):'ещё впереди'}</small></div></div>`}).join('');
 const ms=document.querySelector('#monthlySummary');if(ms)ms.innerHTML=Array.from({length:12},(_,m)=>{const a=m*30+1,b=a+29,days=Array.from({length:30},(_,i)=>a+i),plan=days.reduce((s,d)=>s+target(d),0),actual=days.reduce((s,d)=>s+(+data.reps[d]||0),0),done=days.filter(d=>data.done[d]).length,pct=Math.round(actual/plan*100);return `<article class="month-summary"><div><span>МЕСЯЦ ${m+1}</span><b>${actual.toLocaleString('ru')} <i>/ ${plan.toLocaleString('ru')}</i></b></div><div class="month-summary-bar"><i style="width:${Math.min(100,pct)}%"></i></div><footer><span>${done}/30 дней</span><strong>${pct}% объёма</strong></footer></article>`}).join('');
}
document.querySelector('#showMeasurements').onclick=()=>{const hist=data.metricHistory||[];if(!hist.length){alert('История замеров пока пуста. Сохрани первый замер ниже.');return}alert(hist.slice().reverse().map((m,i)=>{const d=m.date?new Date(m.date).toLocaleDateString('ru-RU'):'—';return d+' • вес '+(m.weight||'—')+' кг • талия '+(m.waist||'—')+' см • максимум '+(m.maxSet||'—')}).join('\n'))};
