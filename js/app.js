// Vida+ AI - APP.JS (Funções de UI)
// Importa core + firebase e orquestra a interface

import { state, STORE, levelTable, defaultCategories, moodMap, themes, fmtBRL, fmtDate, todayStr, getLevel, getNextLevel, loadState, saveState, addXP, calcStreak, calcHabitRate, calcLifeScore, generateInsights, seedHabits, seedTransactions, seedMoods, seedGoals, ensureSeed, themes as themeMap } from './core.js';
import { VidaFirebase, initFirebaseSDK, FIREBASE_DB_URL } from './firebase.js';

let tempMood = null;

// Expose to window for inline onclick handlers
window.state = state;
window.toast = toast;
window.switchView = switchView;
window.toggleTheme = toggleTheme;
window.openQuickAdd = openQuickAdd;
window.openPremium = openPremium;
window.openTxModal = openTxModal;
window.openHabitModal = openHabitModal;
window.openMoodModal = openMoodModal;
window.openGoalModal = openGoalModal;
window.closeModal = closeModal;
window.saveTx = saveTx;
window.saveHabit = saveHabit;
window.saveGoal = saveGoal;
window.toggleHabit = toggleHabit;
window.editHabit = editHabit;
window.deleteHabit = deleteHabit;
window.filterTx = filterTx;
window.setTxType = setTxType;
window.quickMood = quickMood;
window.pickMood = pickMood;
window.confirmMood = confirmMood;
window.saveMoodNote = saveMoodNote;
window.addGoalProgress = addGoalProgress;
window.deleteGoal = deleteGoal;
window.seedHabits = ()=>{ seedHabits(); renderAll(); toast('Hábitos restaurados','◍'); };
window.exportFin = ()=>{ toast('Gerando PDF...','📄'); setTimeout(()=>window.print(),400); };
window.exportReport = ()=>{ toast('Gerando relatório IA...','✦'); setTimeout(()=>window.print(),400); };
window.activatePremium = activatePremium;
window.regenerateAI = regenerateAI;

// Toast
export function toast(msg, ico='✦'){
  const stack = document.getElementById('toasts');
  if(!stack) return;
  const el = document.createElement('div');
  el.className='toast';
  el.innerHTML=`<div class="t-ico">${ico}</div><div>${msg}</div>`;
  stack.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=>el.remove(),300); }, 3500);
}

function confettiLevel(lvl){
  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:999;display:grid;place-items:center';
  overlay.innerHTML=`<div style="background:var(--card);padding:22px 26px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);border:1px solid var(--border);text-align:center;animation:pop .5s cubic-bezier(.34,1.56,.64,1)"><div style="font-size:48px">🎉</div><b style="font-size:20px;display:block;margin-top:8px">Nível ${lvl.level} • ${lvl.name}</b><p style="color:var(--muted);font-size:13px;margin-top:6px">Você está evoluindo de verdade!</p></div>`;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),2600);
}

// Listeners do core
window.addEventListener('vidaplus:xp', (e)=>{
  const {amount, reason, leveledUp, curr} = e.detail;
  updateXPUI();
  if(leveledUp) confettiLevel(curr), toast(`Nível ${curr.level} desbloqueado! • ${curr.name}`,'🎉');
  else if(reason) toast(`+${amount} XP • ${reason}`,'⚡');
  // tenta sync firebase
  trySyncUser();
});

window.addEventListener('vidaplus:save', ()=>{
  // debounce sync
  clearTimeout(window._syncTimer);
  window._syncTimer = setTimeout(()=> trySyncAll(), 1200);
});

async function trySyncUser(){
  const uid = state.app.uid || 'default_user';
  await VidaFirebase.saveUserData(uid, state.user).catch(()=>{});
}
async function trySyncAll(){
  const uid = state.app.uid || 'default_user';
  const ok = await VidaFirebase.syncCollection(uid, 'transactions', state.tx);
  await VidaFirebase.syncCollection(uid, 'habits', state.habits);
  await VidaFirebase.syncCollection(uid, 'moods', state.moods);
  await VidaFirebase.syncCollection(uid, 'goals', state.goals);
  await VidaFirebase.syncCollection(uid, 'app', state.app);
  document.getElementById('syncStatus') && (document.getElementById('syncStatus').textContent = ok ? '● Sincronizado com Firebase' : '● Offline • localStorage');
}

// NAV
export function switchView(name){
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id===`view-${name}`));
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
}

export function toggleTheme(){
  const ids = Object.keys(themes);
  let idx = ids.indexOf(state.settings.theme);
  idx = (idx+1)%ids.length;
  const next = ids[idx];
  if(themes[next].premium && !state.app.premium){
    openPremium();
    return;
  }
  applyTheme(next);
}
export function applyTheme(id){
  const theme = themes[id] || themes.light;
  state.settings.theme = theme.id;
  state.app.theme = theme.id;
  document.documentElement.setAttribute('data-theme', theme.id);
  saveState();
  toast(`Tema: ${theme.label}`, '◐');
}

// Render
export function renderAll(){
  updateHeader();
  updateXPUI();
  renderDashboard();
  renderTx();
  renderHabits();
  renderMood();
  renderGoals();
  renderReports();
  renderAchievements();
}

export function updateHeader(){
  const nameEl = document.getElementById('userName');
  if(nameEl) nameEl.textContent = state.user.name;
  const avatar = document.getElementById('avatar');
  if(avatar) avatar.textContent = state.user.name.charAt(0).toUpperCase();
  const todayDate = document.getElementById('todayDate');
  if(todayDate) todayDate.textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const habitsDate = document.getElementById('habitsDate');
  if(habitsDate) habitsDate.textContent = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  calcStreak();
  const streakLabel = document.getElementById('streakLabel');
  if(streakLabel) streakLabel.textContent = `Streak ${state.app.streak} dias`;
  const syncStatus = document.getElementById('syncStatus');
  if(syncStatus) syncStatus.textContent = VidaFirebase.getStatus().connected ? '● Sincronizado' : '● Local • tentando Firebase...';
}

export function updateXPUI(){
  const xp = state.user.xp||0;
  const lvl = getLevel(xp);
  const next = getNextLevel(xp);
  const pct = next.xp===lvl.xp ? 100 : Math.min(100, ((xp-lvl.xp)/(next.xp-lvl.xp))*100);
  const setText = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt; };
  setText('levelLabel', `Nv ${lvl.level}`);
  setText('xpLabel', `${xp} XP`);
  setText('xpFrom', `${lvl.xp} XP`);
  setText('xpTo', `${next.xp} XP`);
  setText('xpNext', `${next.xp-xp} XP`);
  const xpBar = document.getElementById('xpBar'); if(xpBar) xpBar.style.width=pct+'%';
  setText('achLevel', `Nv ${lvl.level} • ${lvl.name}`);
  setText('achXp', `${xp} XP • ${next.xp-xp} para o próximo`);
  const achBar = document.getElementById('achBar'); if(achBar) achBar.style.width=pct+'%';
}

// Dashboard
export function renderDashboard(){
  const total = state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const balEl = document.getElementById('balanceValue'); if(balEl) balEl.textContent=fmtBRL(total);
  const monthTx = state.tx.filter(t=> new Date(t.date).getMonth()===new Date().getMonth());
  const balSub = document.getElementById('balanceSub'); if(balSub) balSub.textContent=`${monthTx.length} transações no mês`;
  const prevMonth = state.tx.filter(t=>{const d=new Date(t.date);return d.getMonth()===new Date().getMonth()-1}).reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0);
  const trend = prevMonth? ((total-prevMonth)/Math.abs(prevMonth)*100):0;
  const trendEl = document.getElementById('balanceTrend'); if(trendEl){ trendEl.textContent=`${trend>=0?'+':''}${trend.toFixed(0)}%`; trendEl.className=`badge ${trend>=0?'badge-up':'badge-down'}`; }

  const today = todayStr();
  let done=0; state.habits.forEach(h=>{ if(h.history && h.history[today]) done++; });
  const setText=(id,t)=>{const el=document.getElementById(id); if(el) el.textContent=t;};
  setText('habitsDone', done);
  setText('habitsTotal', state.habits.length);
  const hp = document.getElementById('habitsProgress'); if(hp) hp.style.width= (state.habits.length? (done/state.habits.length*100):0)+'%';
  setText('todayProgressPct', Math.round((state.habits.length? done/state.habits.length:0)*100)+'%');
  const mot = document.getElementById('habitsMotivation'); if(mot) mot.textContent = done===state.habits.length?'Dia perfeito! 🎉': done>=2?'Seguindo bem! Continue':'Vamos começar? +20 XP por hábito';

  const todMood = state.moods.find(m=>m.date===today);
  if(todMood){ const map=moodMap[todMood.level]; setText('moodLabel', map.label); const mi=document.getElementById('moodIcon'); if(mi) mi.textContent=map.emoji; setText('moodSub', todMood.note||'Registrado hoje'); }
  else { setText('moodLabel','--'); setText('moodSub','Nenhum registro hoje'); const mi=document.getElementById('moodIcon'); if(mi) mi.textContent='🙂'; }
  const dots=document.getElementById('moodWeekDots'); if(dots){ dots.innerHTML=''; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const m=state.moods.find(x=>x.date===d); const dot=document.createElement('div'); dot.style.cssText=`width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:12px;background:${m?moodMap[m.level].color:'var(--bg-2)'};color:${m?'white':'var(--muted-2)'}`; dot.textContent=m?moodMap[m.level].emoji:'·'; dots.appendChild(dot); } }

  const list=document.getElementById('todayHabits'); if(list){ list.innerHTML=''; state.habits.slice(0,5).forEach(h=>{ const isDone=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${isDone?'done':''}" onclick="toggleHabit('${h.id}')">${isDone?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>${isDone?'Feito hoje • +20 XP':`${h.goal}x hoje`} • ${h.streak} dias streak</span></div><span class="streak">🔥 ${h.streak}</span>`; list.appendChild(el); }); }

  const aiCont=document.getElementById('aiInsights'); if(aiCont){ aiCont.innerHTML=''; generateInsights().slice(0,3).forEach(ins=>{ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<div class="i-ico" style="background:${ins.color}">${ins.ico}</div><div><b>${ins.title}</b><p>${ins.text}</p></div>`; aiCont.appendChild(div); }); }

  drawMiniBalance(); drawWeeklyFlow(); drawCategoryDonut();
}

// Charts vanilla
function drawMiniBalance(){
  const canvas=document.getElementById('miniBalance'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h);
  const points=[]; let bal=0; const sorted=[...state.tx].sort((a,b)=> new Date(a.date)-new Date(b.date)).slice(-10); sorted.forEach(t=>{ bal+= t.type==='income'? t.amount : -t.amount; points.push(bal); }); if(points.length<2){ points.push(0,100,200) }
  const min=Math.min(...points),max=Math.max(...points); const pad=10; ctx.beginPath(); ctx.strokeStyle='#6366F1'; ctx.lineWidth=2; ctx.lineJoin='round'; ctx.lineCap='round'; points.forEach((p,i)=>{ const x=(i/(points.length-1))*w; const y=h - ((p-min)/(max-min||1))* (h-pad*2) - pad; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); const grad=ctx.createLinearGradient(0,0,0,h); grad.addColorStop(0,'rgba(99,102,241,.25)'); grad.addColorStop(1,'rgba(99,102,241,0)'); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
}
function drawWeeklyFlow(){
  const canvas=document.getElementById('weeklyFlow'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h);
  const days=[]; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000); const str=d.toISOString().slice(0,10); const dayTx=state.tx.filter(t=>t.date===str); const inc=dayTx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0); const exp=dayTx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0); days.push({label:d.toLocaleDateString('pt-BR',{weekday:'short'}),inc,exp}); }
  const max=Math.max(1,...days.map(d=>Math.max(d.inc,d.exp))); const barW=w/7 -12; const gap=12; ctx.textAlign='center'; ctx.font='11px Plus Jakarta Sans'; days.forEach((d,i)=>{ const x=i*(barW+gap)+6; const incH=(d.inc/max)*(h-40); const expH=(d.exp/max)*(h-40); ctx.fillStyle='#DCFCE7'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, h-20-incH, barW, incH, 6); else ctx.fillRect(x, h-20-incH, barW, incH); ctx.fill(); ctx.fillStyle='#FEE2E2'; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, h-20-expH-incH-4, barW, expH, 6); else ctx.fillRect(x, h-20-expH-incH-4, barW, expH); ctx.fill(); ctx.fillStyle='#64748B'; ctx.fillText(d.label, x+barW/2, h-2); });
}
function drawCategoryDonut(){
  const canvas=document.getElementById('categoryDonut'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; const cx=w/2,cy=h/2, r=Math.min(w,h)/2-10; ctx.clearRect(0,0,w,h);
  const expByCat=state.tx.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{}); let entries=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).slice(0,5); if(!entries.length) entries=[['Sem dados',1]]; const total=entries.reduce((s,e)=>s+e[1],0); const colors=['#123C7A','#6366F1','#06B6D4','#10B981','#F59E0B']; let ang=-Math.PI/2; entries.forEach(([cat,val],i)=>{ const slice=(val/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+slice); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill(); ang+=slice; }); ctx.beginPath(); ctx.arc(cx,cy,r*0.6,0,Math.PI*2); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#fff'; ctx.fill(); ctx.fillStyle='#0F172A'; ctx.textAlign='center'; ctx.font='800 18px Fraunces'; ctx.fillText(entries.length? fmtBRL(total):'R$ 0',cx,cy+4);
}

// Finance
export function renderTx(){
  const catCont=document.getElementById('txCategories'); if(catCont){ catCont.innerHTML=''; const list=defaultCategories[state.app.txType||'expense']; list.forEach(c=>{ const b=document.createElement('button'); b.className='pill'; b.textContent=c; b.onclick=()=>{ document.querySelectorAll('#txCategories .pill').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.getElementById('txCategoryCustom').value=c; }; catCont.appendChild(b); }); }
  const filter=state.app.txFilter||'all'; const searchEl=document.getElementById('txSearch'); const search=searchEl? searchEl.value.toLowerCase():''; let filtered=[...state.tx].sort((a,b)=> new Date(b.date)-new Date(a.date)); if(filter!=='all') filtered=filtered.filter(t=>t.type===filter); if(search) filtered=filtered.filter(t=>t.category.toLowerCase().includes(search)||(t.desc||'').toLowerCase().includes(search)); const cont=document.getElementById('txList'); if(!cont) return; cont.innerHTML=''; if(!filtered.length){ cont.innerHTML='<p style="color:var(--muted);font-size:13px;padding:18px;text-align:center">Nenhuma transação encontrada</p>'; } filtered.forEach(t=>{ const div=document.createElement('div'); div.className='tx'; const isInc=t.type==='income'; div.innerHTML=`<div class="tx-ico" style="background:${isInc?'#DCFCE7':'#FEE2E2'}">${isInc?'↑':'↓'}</div><div><b>${t.desc||t.category}</b><br><span>${t.category} • ${fmtDate(t.date)}</span></div><div class="tx-amt" style="color:${isInc?'var(--emerald)':'var(--rose)'}">${isInc?'+':''}${fmtBRL(t.amount)}</div>`; cont.appendChild(div); });
  const monthInc=state.tx.filter(t=>t.type==='income' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0); const monthExp=state.tx.filter(t=>t.type==='expense' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);
  const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;}; set('incomeMonth', fmtBRL(monthInc)); set('expenseMonth', fmtBRL(monthExp)); set('savingMonth', fmtBRL(monthInc-monthExp)); set('savingPct', monthInc? Math.round(((monthInc-monthExp)/monthInc)*100)+'%':'0%');
  const topExp = Object.entries(state.tx.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{})).sort((a,b)=>b[1]-a[1])[0]; if(topExp){ const ti=document.getElementById('finInsightTitle'); if(ti) ti.textContent=`Você gasta mais com ${topExp[0]}`; const te=document.getElementById('finInsightText'); if(te) te.textContent=`${fmtBRL(topExp[1])} acumulados. Dica IA: tente limitar ${topExp[0]} a ${fmtBRL(topExp[1]*0.8)} nas próximas 2 semanas.`; }
  drawFinCategory(); drawFinLine();
}
function drawFinCategory(){ const canvas=document.getElementById('finCategory'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; const cx=w/2,cy=h/2-10, r=Math.min(w,h)/2-16; ctx.clearRect(0,0,w,h); const expByCat=state.tx.filter(t=>t.type==='expense' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{}); let entries=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]); if(!entries.length) entries=[['Sem dados',1]]; const total=entries.reduce((s,e)=>s+e[1],0); const colors=['#123C7A','#6366F1','#06B6D4','#10B981','#F59E0B','#F43F5E','#8B5CF6']; let ang=-Math.PI/2; entries.forEach(([cat,val],i)=>{ const slice=(val/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+slice); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill(); ang+=slice; }); ctx.beginPath(); ctx.arc(cx,cy,r*0.58,0,Math.PI*2); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#fff'; ctx.fill(); }
function drawFinLine(){ const canvas=document.getElementById('finLine'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h); const days=[]; let bal=0; const sorted=[...state.tx].sort((a,b)=> new Date(a.date)-new Date(b.date)); for(let i=29;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const dayTx=sorted.filter(t=>t.date===d); const net=dayTx.reduce((s,t)=> s + (t.type==='income'?t.amount:-t.amount),0); bal+=net; days.push(bal);} if(days.length<2) return; const min=Math.min(...days),max=Math.max(...days); ctx.beginPath(); ctx.strokeStyle='#123C7A'; ctx.lineWidth=2.5; days.forEach((v,i)=>{ const x=(i/(days.length-1))*w; const y=h - ((v-min)/(max-min||1))* (h-20) -10; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }

export function setTxType(type,el){ state.app.txType=type; document.querySelectorAll('#overlayTx .pill[data-type]').forEach(b=>b.classList.remove('active')); el.classList.add('active'); saveState(); renderTx(); }
export function filterTx(type,el){ state.app.txFilter=type; document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active')); el.classList.add('active'); renderTx(); }
export function openTxModal(){ const d=document.getElementById('txDate'); if(d) d.value=todayStr(); const a=document.getElementById('txAmount'); if(a) a.value=''; const de=document.getElementById('txDesc'); if(de) de.value=''; const cc=document.getElementById('txCategoryCustom'); if(cc) cc.value=''; renderTx(); document.getElementById('overlayTx').classList.add('open'); }
export function saveTx(){
  const amount=parseFloat(document.getElementById('txAmount').value); if(!amount||amount<=0){ toast('Informe um valor válido','⚠️'); return; }
  const cat=document.getElementById('txCategoryCustom').value || (defaultCategories[state.app.txType][0]); const date=document.getElementById('txDate').value || todayStr(); const desc=document.getElementById('txDesc').value;
  state.tx.push({id:'t_'+Date.now(),type:state.app.txType||'expense',amount,category:cat,date,desc:desc||cat,createdAt:new Date().toISOString()});
  saveState(); closeModal('overlayTx'); addXP(10,'Transação registrada'); renderAll(); toast('Transação salva!','💰');
}

// Habits
export function renderHabits(){
  const lib=document.getElementById('habitsLibrary'); if(lib){ lib.innerHTML=''; state.habits.forEach(h=>{ const today=todayStr(); const done=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${done?'done':''}" style="${done?`background:${h.color};border-color:${h.color}`:`border-color:${h.color}40;color:${h.color}`}" onclick="toggleHabit('${h.id}')">${done?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>Meta: ${h.goal}x/dia • Streak ${h.streak} dias</span></div><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" onclick="editHabit('${h.id}')">Editar</button><button class="btn btn-ghost btn-sm" onclick="deleteHabit('${h.id}')">✕</button></div>`; lib.appendChild(el); }); }
  const stats=document.getElementById('habitStats'); if(stats){ stats.innerHTML=''; const totalDone = Object.values(state.habits.reduce((a,h)=>{ Object.keys(h.history||{}).forEach(d=>{ if(h.history[d]) a[d]=(a[d]||0)+1}); return a; },{})).reduce((s,v)=>s+v,0); const bestStreak=Math.max(0,...state.habits.map(h=>h.streak)); const today=todayStr(); const todayDone=state.habits.filter(h=>h.history && h.history[today]).length; [{label:'Feitos hoje',value:`${todayDone}/${state.habits.length}`,sub:`${Math.round((todayDone/(state.habits.length||1))*100)}% do dia`},{label:'Total feitos',value:totalDone,sub:'Desde o início'},{label:'Maior streak',value:`${bestStreak} dias`,sub:'Seu recorde'},{label:'Taxa semanal',value:`${Math.round(calcHabitRate()*100)}%`,sub:'Últimos 7 dias'}].forEach(k=>{ const div=document.createElement('div'); div.className='card'; div.innerHTML=`<span class="kpi-label">${k.label}</span><div class="kpi-value" style="font-size:22px;margin-top:6px">${k.value}</div><div class="kpi-sub">${k.sub}</div>`; stats.appendChild(div); }); }
  const heat=document.getElementById('habitHeatmap'); if(heat){ heat.innerHTML=''; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000); const str=d.toISOString().slice(0,10); const dayCount=state.habits.filter(h=>h.history && h.history[str]).length; const pct=state.habits.length? dayCount/state.habits.length:0; const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:12px'; row.innerHTML=`<span style="width:64px;font-size:12px;font-weight:600">${d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit'})}</span><div class="progress" style="flex:1;height:18px;border-radius:10px"><i style="width:${pct*100}%;background:${pct>0.7?'#10B981':pct>0.4?'#F59E0B':'#E2E8F0'}"></i></div><span style="font-size:12px;font-weight:700">${dayCount}/${state.habits.length}</span>`; heat.appendChild(row);} }
}
export function toggleHabit(id){ const h=state.habits.find(x=>x.id===id); if(!h) return; const today=todayStr(); const wasDone=!!(h.history && h.history[today]); if(!h.history) h.history={}; if(wasDone){ delete h.history[today]; h.streak=Math.max(0,h.streak-1); toast('Hábito desmarcado','◍'); }else{ h.history[today]=true; h.streak++; addXP(20,`Hábito: ${h.name}`); if(h.streak===7) addXP(50,'7 dias seguidos!'); } saveState(); renderAll(); }
export function openHabitModal(){ const n=document.getElementById('habitName'); if(n) n.value=''; const i=document.getElementById('habitIcon'); if(i) i.value=''; const g=document.getElementById('habitGoal'); if(g) g.value=1; document.getElementById('overlayHabit').classList.add('open'); }
export function saveHabit(){ const name=document.getElementById('habitName').value.trim(); if(!name){ toast('Nome obrigatório','⚠️'); return; } const icon=document.getElementById('habitIcon').value||'⭐'; const goal=parseInt(document.getElementById('habitGoal').value)||1; const color=document.getElementById('habitColor').value; state.habits.push({id:'h_'+Date.now(),name,icon,color,goal,streak:0,history:{},createdAt:new Date().toISOString()}); saveState(); closeModal('overlayHabit'); addXP(15,'Novo hábito criado'); renderAll(); toast('Hábito criado!','◍'); }
export function editHabit(id){ const h=state.habits.find(x=>x.id===id); if(!h) return; const name=prompt('Novo nome:',h.name); if(name){ h.name=name; saveState(); renderHabits(); } }
export function deleteHabit(id){ if(!confirm('Remover hábito?')) return; state.habits=state.habits.filter(h=>h.id!==id); saveState(); renderAll(); }

// Mood
export function renderMood(){
  const cal=document.getElementById('moodCalendar'); if(cal){ cal.innerHTML=''; ['D','S','T','Q','Q','S','S'].forEach(l=>{ const d=document.createElement('div'); d.className='head'; d.textContent=l; cal.appendChild(d); }); const now=new Date(); const year=now.getFullYear(),month=now.getMonth(); const first=new Date(year,month,1).getDay(); const days=new Date(year,month+1,0).getDate(); for(let i=0;i<first;i++){ const e=document.createElement('div'); cal.appendChild(e);} for(let d=1;d<=days;d++){ const date=new Date(year,month,d).toISOString().slice(0,10); const mood=state.moods.find(m=>m.date===date); const el=document.createElement('div'); el.className='day'+(mood?' has-mood':''); if(mood){ el.style.background=moodMap[mood.level].color; el.textContent=moodMap[mood.level].emoji; }else el.textContent=d; cal.appendChild(el);} }
  drawMoodChart();
  const patterns=document.getElementById('moodPatterns'); if(patterns){ patterns.innerHTML=''; generateInsights().slice(0,2).forEach(i=>{ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<div class="i-ico" style="background:${i.color}">${i.ico}</div><div><b>${i.title}</b><p>${i.text}</p></div>`; patterns.appendChild(div); }); }
  document.querySelectorAll('.mood-opt[data-mood]').forEach(el=>{ const m=parseInt(el.dataset.mood); const todayM=state.moods.find(x=>x.date===todayStr()); el.classList.toggle('active', !!(todayM && todayM.level===m)); });
}
function drawMoodChart(){ const canvas=document.getElementById('moodChart'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h); const pts=[]; for(let i=13;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const m=state.moods.find(x=>x.date===d); pts.push(m?m.level:null);} const valid=pts.filter(p=>p!==null); if(!valid.length){ ctx.fillStyle='#94A3B8'; ctx.font='13px Plus Jakarta Sans'; ctx.textAlign='center'; ctx.fillText('Registre seu humor para ver a curva',w/2,h/2); return;} ctx.beginPath(); ctx.strokeStyle='#6366F1'; ctx.lineWidth=2.5; let started=false; pts.forEach((v,i)=>{ if(v===null) return; const x=(i/(pts.length-1))*w; const y=h - (v/5)*(h-20) -10; if(!started){ ctx.moveTo(x,y); started=true;} else ctx.lineTo(x,y); }); ctx.stroke(); pts.forEach((v,i)=>{ if(v===null) return; const x=(i/(pts.length-1))*w; const y=h - (v/5)*(h-20) -10; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#6366F1'; ctx.fill(); ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }); }
export function pickMood(lvl){ tempMood=lvl; document.querySelectorAll('#overlayMood .mood-opt').forEach((el,idx)=>{ el.classList.toggle('active', idx+1===lvl); }); }
export function quickMood(lvl){ tempMood=lvl; confirmMood(); }
export function openMoodModal(){ tempMood=null; const note=document.getElementById('moodNoteModal'); if(note) note.value=''; document.querySelectorAll('#overlayMood .mood-opt').forEach(el=>el.classList.remove('active')); document.getElementById('overlayMood').classList.add('open'); }
export function confirmMood(){
  const noteModal=document.getElementById('moodNoteModal'); const noteEl=document.getElementById('moodNote'); const note=(noteModal && noteModal.value) || (noteEl && noteEl.value) || '';
  if(!tempMood && !note){ toast('Selecione um humor','🙂'); return; }
  const lvl=tempMood || 3; const today=todayStr(); let existing=state.moods.find(m=>m.date===today); if(existing){ existing.level=lvl; existing.note=note; } else state.moods.unshift({date:today,level:lvl,note});
  saveState(); closeModal('overlayMood'); if(noteEl) noteEl.value=''; addXP(15,'Humor registrado'); renderAll(); toast(`Humor ${moodMap[lvl].label} salvo!`,'☺');
}
export function saveMoodNote(){ const note=document.getElementById('moodNote'); if(!note || (!note.value && !tempMood)){ toast('Escreva algo ou escolha emoji','🙂'); return;} tempMood=tempMood||3; confirmMood(); }

// Goals
export function renderGoals(){
  const grid=document.getElementById('goalsGrid'); if(!grid) return; grid.innerHTML=''; state.goals.forEach(g=>{ const pct=Math.min(100, Math.max(0, (g.current/g.target)*100)); const div=document.createElement('div'); div.className='card'; div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="badge" style="background:var(--bg-2);color:var(--muted)">${g.type.toUpperCase()}</span><button class="btn btn-ghost btn-sm" onclick="deleteGoal('${g.id}')">✕</button></div><b style="display:block;margin:12px 0 4px;font-size:16px">${g.title}</b><p style="font-size:12.5px;color:var(--muted)">Prazo: ${fmtDate(g.deadline)} • ${Math.round(pct)}% concluído</p><div class="progress" style="margin:14px 0"><i style="width:${pct}%;background:linear-gradient(90deg, var(--primary), var(--violet))"></i></div><div style="display:flex;justify-content:space-between;font-size:13px"><span style="font-weight:700">${fmtBRL(g.current)} / ${fmtBRL(g.target)}</span><span style="color:var(--muted)">Falta ${fmtBRL(g.target-g.current)}</span></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-primary btn-sm" style="flex:1" onclick="addGoalProgress('${g.id}',10)">+10%</button><button class="btn btn-ghost btn-sm" style="flex:1" onclick="addGoalProgress('${g.id}',25)">+25%</button></div>`; grid.appendChild(div); }); if(!state.goals.length) grid.innerHTML='<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:20px">Nenhuma meta ainda. Crie sua primeira e ganhe 30 XP.</p>';
}
export function openGoalModal(){ const t=document.getElementById('goalTitle'); if(t) t.value=''; const ta=document.getElementById('goalTarget'); if(ta) ta.value=''; const dl=document.getElementById('goalDeadline'); if(dl) dl.value=new Date(Date.now()+30*86400000).toISOString().slice(0,10); document.getElementById('overlayGoal').classList.add('open'); }
export function saveGoal(){ const titleEl=document.getElementById('goalTitle'); const title=titleEl? titleEl.value.trim():''; const targetEl=document.getElementById('goalTarget'); const target=parseFloat(targetEl? targetEl.value:0)||1000; const typeEl=document.getElementById('goalType'); const type=typeEl? typeEl.value:'financeira'; const deadlineEl=document.getElementById('goalDeadline'); const deadline=deadlineEl? deadlineEl.value:''; if(!title){ toast('Título obrigatório','⚠️'); return;} state.goals.push({id:'g_'+Date.now(),title,type,target,current:0,deadline}); saveState(); closeModal('overlayGoal'); addXP(30,'Nova meta criada'); renderGoals(); toast('Meta criada!','◎'); }
export function addGoalProgress(id,pct){ const g=state.goals.find(x=>x.id===id); if(!g) return; g.current=Math.min(g.target, g.current + g.target*(pct/100)); if(g.current>=g.target){ addXP(100,`Meta concluída: ${g.title}`); toast(`Meta "${g.title}" concluída! 🎉`,'◎'); } saveState(); renderGoals(); }
export function deleteGoal(id){ state.goals=state.goals.filter(g=>g.id!==id); saveState(); renderGoals(); }

// Reports
export function renderReports(){
  const score=calcLifeScore(); const ls=document.getElementById('lifeScore'); if(ls) ls.textContent=score; const lsb=document.getElementById('lifeScoreBar'); if(lsb) lsb.style.width=score+'%'; const lsd=document.getElementById('lifeScoreDesc'); if(lsd) lsd.textContent= score>80?'Excelente equilíbrio! Continue assim': score>60?'Bom progresso — ajuste finanças e hábitos':'Precisa de atenção — foque em streak essa semana';
  const financeCont=document.getElementById('reportFinance'); if(financeCont){ financeCont.innerHTML=''; generateInsights().slice(0,2).forEach(ins=>{ const d=document.createElement('div'); d.className='insight'; d.innerHTML=`<div class="i-ico" style="background:${ins.color}">${ins.ico}</div><div><b>${ins.title}</b><p>${ins.text}</p></div>`; financeCont.appendChild(d); }); }
  const behCont=document.getElementById('reportBehavior'); if(behCont){ const rate=calcHabitRate(); behCont.innerHTML=`<div class="insight"><div class="i-ico">🔥</div><div><b>Streak ${state.app.streak} dias</b><p>${rate>0.6?'Você está acima da média global.':'Tente 3 dias seguidos para criar tração.'}</p></div></div><div class="insight"><div class="i-ico">🧠</div><div><b>Humor médio ${(state.moods.reduce((s,m)=>s+m.level,0)/(state.moods.length||1)).toFixed(1)}/5</b><p>Correlação com hábitos de ${(rate*100).toFixed(0)}% de completude.</p></div></div>`; }
  const weekly=document.getElementById('weeklyAIReport'); if(weekly){ weekly.innerHTML=''; for(let i=0;i<3;i++){ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<div class="i-ico">✦</div><div><b>${['Resumo da semana','Alerta inteligente','Próxima ação'][i]}</b><p>${['Você economizou 18% vs semana passada e completou 5/7 hábitos. Melhor dia: quarta.','Detectamos pico de gastos em delivery às 21h quando seu humor ficou em Ruim.','Amanhã tente marcar academia logo cedo — aumenta 40% sua chance de humor Bom/Excelente.'][i]}</p></div>`; weekly.appendChild(div);} }
  const corr=document.getElementById('correlations'); if(corr){ corr.innerHTML=''; [{ico:'💸',title:'Delivery ↔ Humor Ruim',text:'Quando marca Humor Ruim, gasta 2.3x mais em Delivery. Sugestão: tenha snack saudável em casa.',up:true},{ico:'🏋️',title:'Treino cedo = Dia Bom',text:'Dias que você treina até 9h, 82% terminam com humor Bom ou Excelente.',up:true},{ico:'📚',title:'Leitura protege saldo',text:'Semanas com 4+ leituras, gasto médio com lazer cai 22%.',up:false}].forEach(c=>{ const d=document.createElement('div'); d.className='insight'; d.innerHTML=`<div class="i-ico" style="background:${c.up?'#DCFCE7':'#FEF3C7'};color:${c.up?'#166534':'#92400E'}">${c.ico}</div><div><b>${c.title}</b><p>${c.text}</p></div>`; corr.appendChild(d); }); }
}
export function regenerateAI(){ toast('IA reanalisando seus dados...','✦'); setTimeout(()=>{ renderReports(); renderDashboard(); toast('Relatório atualizado com novos insights!','✦'); },800); }

// Achievements
export function renderAchievements(){
  const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
  set('achStreak', `${state.app.maxStreak||0} dias`);
  const totalHabits = state.habits.reduce((s,h)=> s + Object.keys(h.history||{}).length,0);
  set('achHabits', totalHabits);
  const list=document.getElementById('achList'); if(!list) return; list.innerHTML='';
  const achievements=[
    {id:'first_tx',title:'Primeira transação',desc:'Registre sua primeira movimentação',ico:'💰',check:()=>state.tx.length>0,xp:10},
    {id:'first_habit',title:'Primeiro hábito',desc:'Crie seu primeiro hábito transformador',ico:'◍',check:()=>state.habits.length>0,xp:15},
    {id:'streak3',title:'3 dias de fogo',desc:'Mantenha streak de 3 dias',ico:'🔥',check:()=> (state.app.maxStreak||0)>=3,xp:30},
    {id:'streak7',title:'Guardião da semana',desc:'7 dias seguidos completando hábitos',ico:'🛡️',check:()=> (state.app.maxStreak||0)>=7,xp:70},
    {id:'mood5',title:'Autoconhecimento',desc:'Registre humor 5 vezes',ico:'☺',check:()=>state.moods.length>=5,xp:25},
    {id:'level2',title:'Construtor',desc:'Alcance nível 2',ico:'⚡',check:()=> (state.user.xp||0)>=500,xp:50},
    {id:'saver',title:'Economista',desc:'Mês com saldo positivo',ico:'📈',check:()=>{const inc=state.tx.filter(t=>t.type==='income'&& new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);const exp=state.tx.filter(t=>t.type==='expense'&& new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);return inc>exp && inc>0},xp:40},
    {id:'goal',title:'Meta batida',desc:'Conclua uma meta',ico:'◎',check:()=>state.goals.some(g=>g.current>=g.target),xp:100},
  ];
  achievements.forEach(a=>{ const done=a.check(); const div=document.createElement('div'); div.className='ach'+(done?'':' lock'); div.innerHTML=`<div class="ach-ico">${a.ico}</div><div style="flex:1"><b style="font-size:14px">${a.title} ${done?'✓':''}</b><p style="font-size:12.5px;color:var(--muted)">${a.desc} • +${a.xp} XP</p></div><span class="badge" style="background:${done?'#DCFCE7':'var(--bg-2)'};color:${done?'#166534':'var(--muted)'}">${done?'FEITO':'BLOQ'}</span>`; list.appendChild(div); });
}

// Modals
export function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); }
export function openQuickAdd(){ document.getElementById('overlayQuick').classList.add('open'); }
export function openPremium(){ document.getElementById('overlayPremium').classList.add('open'); }
export function activatePremium(){ state.app.premium=true; state.user.premium=true; saveState(); closeModal('overlayPremium'); toast('Premium ativado! (simulação) Aproveite temas e PDF ilimitado','★'); renderAll(); }

// Init
export function initApp(){
  loadState();
  ensureSeed();
  // tenta firebase
  initFirebaseSDK().then(()=>{ trySyncAll(); }).catch(()=>{});
  // tentativa de carregar do firebase se tiver dados mais novos
  (async()=>{
    const uid = state.app.uid || 'default_user';
    try{
      const remoteTx = await VidaFirebase.loadCollection(uid,'transactions');
      if(remoteTx && remoteTx.length > state.tx.length) { state.tx = remoteTx; saveState(); toast('Dados sincronizados do Firebase','☁️'); renderAll(); }
    }catch{}
  })();

  // nav
  const nav = document.getElementById('nav');
  if(nav) nav.addEventListener('click', e=>{ const btn=e.target.closest('button[data-view]'); if(!btn) return; switchView(btn.dataset.view); });

  // modals overlay close
  document.querySelectorAll('.overlay').forEach(el=>{ el.addEventListener('click',ev=>{ if(ev.target===el) el.classList.remove('open'); }); });

  // global search
  const gs = document.getElementById('globalSearch');
  if(gs) gs.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const q=e.target.value.toLowerCase(); if(!q) return; switchView('financeiro'); const txs=document.getElementById('txSearch'); if(txs){ txs.value=q; } renderTx(); toast(`Buscando: ${q}`,'⌕'); } });

  renderAll();

  let resizeTimer;
  window.addEventListener('resize', ()=>{ clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{ drawMiniBalance(); drawWeeklyFlow(); drawCategoryDonut(); },200); });

  // logo handling
  const logoImg = document.getElementById('logoImg');
  if(logoImg){
    logoImg.onerror = ()=>{ logoImg.style.display='none'; };
  }

  console.log('[Vida+ AI] App iniciado - conectado em', FIREBASE_DB_URL);
}

// Auto init when DOM ready
if(typeof window !== 'undefined'){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
}
