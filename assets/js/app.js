const plan=[30,40,50,...Array.from({length:30},(_,i)=>60+i*15),500,500,500];
const KEY='sport-v1'; let data=JSON.parse(localStorage.getItem(KEY)||'{"done":{},"reps":{},"metrics":{}}');
if(!data.startDate)data.startDate=new Date().toISOString().slice(0,10);
if(!data.metricHistory)data.metricHistory=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const target=d=>plan[Math.min(35,Math.floor((d-1)/10))];
const doneCount=()=>Object.values(data.done).filter(Boolean).length;
const current=()=>Math.min(360,Math.max(1,Math.floor((new Date().setHours(0,0,0,0)-new Date(data.startDate+'T00:00:00').getTime())/86400000)+1));
const dayDate=d=>{const x=new Date(data.startDate+'T00:00:00');x.setDate(x.getDate()+d-1);return x};
const fmt=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'short'});
const fmtLong=x=>x.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
function render(){
 const cur=current(),pct=Math.round(doneCount()/360*100),t=target(cur);
 document.querySelector('#yearPct').textContent=pct+'%';document.querySelector('#yearRing').style.background='conic-gradient(var(--accent) '+pct*3.6+'deg,#242a31 0deg)';
 document.querySelector('#streak').textContent=calcStreak()+' дней';document.querySelector('#totalReps').textContent=Object.values(data.reps).reduce((a,b)=>a+(+b||0),0).toLocaleString('ru');
 document.querySelector('#currentDay').textContent=cur+' / 360';document.querySelector('#todayTarget').textContent=t;document.querySelector('#levelNo').textContent=Math.floor((cur-1)/10)+1;
 document.querySelector('#overallBar').style.width=pct+'%';document.querySelector('#sideBar').style.width=pct+'%';document.querySelector('#sidePct').textContent=pct+'%';document.querySelector('#todayInput').value=data.reps[cur]||0;
 document.querySelector('#todayLabel').textContent=fmtLong(dayDate(cur))+' • День '+cur+' из 360';
 document.querySelector('#startDateLabel').textContent=fmtLong(dayDate(1));document.querySelector('#finishDateLabel').textContent=fmtLong(dayDate(360));
 document.querySelector('#planReps').textContent=Array.from({length:cur},(_,i)=>target(i+1)).reduce((a,b)=>a+b,0).toLocaleString('ru');
 document.querySelector('#phaseText').textContent=cur>330?'Финальная подготовка. Скоро контрольный месяц.':cur>30?'Рабочий блок. Объём растёт — техника остаётся чистой.':'Первый месяц. Формируем ежедневную привычку.';
 const box=document.querySelector('#months');box.innerHTML='';
 for(let m=1;m<=12;m++){let a=(m-1)*30+1,b=m*30,el=document.createElement('article');el.className='month '+(cur>=a&&cur<=b?'current':'');
 let completed=0,ds='';for(let d=a;d<=b;d++){if(data.done[d])completed++;ds+=`<button class="day ${data.done[d]?'done':''} ${d===cur?'today':''}" data-day="${d}" title="${fmtLong(dayDate(d))}: ${target(d)} отжиманий">${d-a+1}<small>${fmt(dayDate(d))}</small></button>`}
 el.innerHTML=`<div class="month-head"><b>Месяц ${m}</b><span>${completed}/30 • ${target(a)}→${target(b)}</span></div><div class="days">${ds}</div>`;box.appendChild(el)}
 document.querySelectorAll('.day').forEach(x=>x.onclick=()=>{let d=+x.dataset.day;data.done[d]=!data.done[d];if(data.done[d]&&!data.reps[d])data.reps[d]=target(d);save();render()});
 renderHistory();renderMetricKpis();
}
function calcStreak(){let s=0,cur=current();for(let d=cur;d>=1;d--){if(data.done[d])s++;else if(d===cur)continue;else break}return s}
function renderHistory(){const box=document.querySelector('#historyList');let rows=[];for(let d=360;d>=1&&rows.length<8;d--)if(data.done[d]||data.reps[d])rows.push(`<div class="history-row"><span class="history-status ${data.done[d]?'ok':''}">${data.done[d]?'✓':'•'}</span><div><b>День ${d}</b><small>${fmtLong(dayDate(d))}</small></div><div><span>Цель</span><b>${target(d)}</b></div><div><span>Факт</span><b>${data.reps[d]||0}</b></div></div>`);box.innerHTML=rows.length?rows.join(''):'<div class="empty-history">Здесь появятся завершённые тренировки. Первый день — начало истории.</div>'}
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
