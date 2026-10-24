const plan=[30,40,50,...Array.from({length:30},(_,i)=>60+i*15),500,500,500];
const KEY='sport-v1'; let data=JSON.parse(localStorage.getItem(KEY)||'{"done":{},"reps":{},"metrics":{}}');
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const target=d=>plan[Math.min(35,Math.floor((d-1)/10))];
const doneCount=()=>Object.values(data.done).filter(Boolean).length;
const current=()=>Math.min(360,doneCount()+1);
function render(){
 const cur=current(),pct=Math.round(doneCount()/360*100),t=target(cur);
 document.querySelector('#yearPct').textContent=pct+'%';document.querySelector('#yearRing').style.background='conic-gradient(var(--accent) '+pct*3.6+'deg,#242a31 0deg)';
 document.querySelector('#streak').textContent=calcStreak()+' дней';document.querySelector('#totalReps').textContent=Object.values(data.reps).reduce((a,b)=>a+(+b||0),0).toLocaleString('ru');
 document.querySelector('#currentDay').textContent=cur+' / 360';document.querySelector('#todayTarget').textContent=t;document.querySelector('#levelNo').textContent=Math.floor((cur-1)/10)+1;
 document.querySelector('#overallBar').style.width=pct+'%';document.querySelector('#todayInput').value=data.reps[cur]||0;
 document.querySelector('#todayLabel').textContent='День '+cur+' из 360';
 document.querySelector('#phaseText').textContent=cur>330?'Финальная подготовка. Скоро контрольный месяц.':cur>30?'Рабочий блок. Объём растёт — техника остаётся чистой.':'Первый месяц. Формируем ежедневную привычку.';
 const box=document.querySelector('#months');box.innerHTML='';
 for(let m=1;m<=12;m++){let a=(m-1)*30+1,b=m*30,el=document.createElement('article');el.className='month '+(cur>=a&&cur<=b?'current':'');
 let completed=0,ds='';for(let d=a;d<=b;d++){if(data.done[d])completed++;ds+=`<button class="day ${data.done[d]?'done':''} ${d===cur?'today':''}" data-day="${d}" title="День ${d}: ${target(d)} отжиманий">${d-a+1}</button>`}
 el.innerHTML=`<div class="month-head"><b>Месяц ${m}</b><span>${completed}/30 • ${target(a)}→${target(b)}</span></div><div class="days">${ds}</div>`;box.appendChild(el)}
 document.querySelectorAll('.day').forEach(x=>x.onclick=()=>{let d=+x.dataset.day;data.done[d]=!data.done[d];if(data.done[d]&&!data.reps[d])data.reps[d]=target(d);save();render()});
}
function calcStreak(){let s=0;for(let d=1;d<=360;d++){if(data.done[d])s++;else if(d<current())s=0;else break}return s}
document.querySelector('#plusBtn').onclick=()=>document.querySelector('#todayInput').value=(+document.querySelector('#todayInput').value||0)+5;
document.querySelector('#minusBtn').onclick=()=>document.querySelector('#todayInput').value=Math.max(0,(+document.querySelector('#todayInput').value||0)-5);
document.querySelector('#doneBtn').onclick=()=>{let d=current(),v=+document.querySelector('#todayInput').value||target(d);data.reps[d]=v;data.done[d]=true;save();render()};
document.querySelector('#themeBtn').onclick=()=>document.body.classList.toggle('light');
['weight','maxSet','waist','note'].forEach(k=>document.querySelector('#'+k).value=data.metrics[k]||'');
document.querySelector('#saveMetrics').onclick=()=>{['weight','maxSet','waist','note'].forEach(k=>data.metrics[k]=document.querySelector('#'+k).value);save();alert('Показатели сохранены')};
document.querySelector('#todayLabel').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long'});
render();