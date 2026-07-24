import { db, auth, initAuthListener, ADMIN_EMAIL, ref, get, set, update, onValue, arrayToObj, objToArray } from './firebase.js';
import { appState, saveLocalState, loadLocalState, getLevelData, themes, levelTable, currencyFormat, uid, seedDemoData, generateDefaultLevels, financeCategories } from './core.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Expose globally for iframes
window.appState = appState;
window.getLevelData = getLevelData;
window.themes = themes;
window.levelTable = levelTable;
window.currencyFormat = currencyFormat;
window.financeCategories = financeCategories;
window.saveLocalState = saveLocalState;
window.loadLocalState = loadLocalState;
window.uid = uid;

const googleProvider = new GoogleAuthProvider();
let saveDebounce = null;
let currentMenuData = null;

// ===== Persistence to Firebase =====
function debounceSaveToFirebase(){
  if(!auth.currentUser) return;
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(async ()=>{
    const uidUser = auth.currentUser.uid;
    try{
      await update(ref(db, `vidaplus/users/${uidUser}`), {
        user: appState.user,
        profile: appState.profile,
        settings: appState.settings,
        transactions: arrayToObj(appState.transactions),
        habits: arrayToObj(appState.habits),
        moods: arrayToObj(appState.moods),
        goals: arrayToObj(appState.goals),
        app: { uid: uidUser, updatedAt: new Date().toISOString() }
      });
      console.log('✓ Firebase sync ok');
    }catch(e){ console.warn('Firebase sync fail', e); }
  }, 900);
}

window.addEventListener('vidaplus:save', debounceSaveToFirebase);

async function syncWithFirebase(user){
  try{
    const snap = await get(ref(db, `vidaplus/users/${user.uid}`));
    if(snap.exists()){
      const data = snap.val();
      if(data.user) appState.user = {...appState.user, ...data.user};
      if(data.profile) appState.profile = {...appState.profile, ...data.profile};
      if(data.settings) appState.settings = {...appState.settings, ...data.settings};
      if(data.transactions) appState.transactions = objToArray(data.transactions);
      if(data.habits) appState.habits = objToArray(data.habits);
      if(data.moods) appState.moods = objToArray(data.moods);
      if(data.goals) appState.goals = objToArray(data.goals);
      appState.isLoaded = true;
      document.documentElement.setAttribute('data-theme', appState.settings.theme||'default-light');
      saveLocalState();
    } else {
      appState.profile.email = user.email;
      appState.profile.photo = user.photoURL || '';
      appState.profile.name = user.displayName || '';
      appState.isLoaded = true;
      seedDemoData();
    }
  }catch(e){
    console.error('sync error', e);
    appState.isLoaded = true;
  }
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  // try load levels from admin
  try{
    const lSnap = await get(ref(db, 'admin/levels'));
    if(lSnap.exists()){
      const lv = lSnap.val();
      const arr = Array.isArray(lv) ? lv : Object.values(lv);
      if(arr && arr.length>=50){
        levelTable.length = 0;
        arr.slice(0,50).forEach(it=> levelTable.push(it));
        window.levelTable = levelTable;
      }
    }
  }catch{}
}

// Listen levels live
try{
  onValue(ref(db, 'admin/levels'), (snap)=>{
    if(snap.exists()){
      const lv = snap.val();
      const arr = Array.isArray(lv) ? lv : Object.values(lv);
      if(arr && arr.length>=20){
        levelTable.length = 0;
        arr.forEach(it=> levelTable.push(it));
        if(window.onAppStateUpdate) window.onAppStateUpdate();
      }
    }
  });
}catch{}

// ===== Core gamification =====
window.addXP = async (amount)=>{
  const oldLvl = getLevelData(appState.user.xp||0).current.level;
  appState.user.xp = (appState.user.xp||0) + amount;
  const lvl = getLevelData(appState.user.xp);
  appState.user.level = lvl.current.level;
  // Level-up bonus: +50 coins por nível subido + toast
  if(lvl.current.level > oldLvl){
    const diff = lvl.current.level - oldLvl;
    appState.user.coins = (appState.user.coins||0) + 50*diff;
    window.toast && window.toast(`🎉 Nível ${lvl.current.level}! +${50*diff} 🪙 • ${lvl.current.name}`);
  }
  // Atualiza streak global com base em hábitos feitos hoje
  recalcGlobalStreak();
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};

function recalcGlobalStreak(){
  // Streak do usuário = maior streak entre seus hábitos, ou streak de humor consecutivo
  let maxStreak = 0;
  (appState.habits||[]).forEach(h=>{ if((h.streak||0)>maxStreak) maxStreak=h.streak; });
  // Calcula streak de humor (dias consecutivos com registro)
  if((appState.moods||[]).length){
    const dates = new Set(appState.moods.map(m=> m.date));
    let moodStreak = 0;
    const d = new Date();
    while(dates.has(d.toISOString().slice(0,10))){
      moodStreak++;
      d.setDate(d.getDate()-1);
    }
    if(moodStreak>maxStreak) maxStreak=moodStreak;
  }
  appState.user.streak = maxStreak;
  return maxStreak;
}

window.updateProfile = async (data)=>{
  appState.profile = {...appState.profile, ...data};
  if(data.firstName || data.lastName){
    appState.profile.name = `${data.firstName||appState.profile.firstName||''} ${data.lastName||appState.profile.lastName||''}`.trim();
  }
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};

// ===== Themes =====
window.appToggleTheme = ()=>{
  let current = appState.settings.theme || 'default-light';
  let [base, mode] = current.split('-');
  if(!mode){ mode='light'; base=current; }
  let nextMode = mode==='light' ? 'dark' : 'light';
  let nextTheme = `${base}-${nextMode}`;
  appState.settings.theme = nextTheme;
  document.documentElement.setAttribute('data-theme', nextTheme);
  const frame = document.getElementById('mainIframe');
  if(frame && frame.contentWindow){
    try{ frame.contentWindow.document.documentElement.setAttribute('data-theme', nextTheme); }catch{}
  }
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};

window.appSelectTheme = async (baseId)=>{
  const themeDef = themes[baseId];
  if(themeDef && themeDef.premium && !appState.user.premium){
    const coins = appState.user.coins||0;
    if(coins>=500){
      if(confirm(`Desbloquear tema ${themeDef.label} por 500 moedas?`)){
        appState.user.coins -= 500;
        appState.user.premium = true;
        await window.addXP(0);
      } else return;
    } else {
      alert(`Tema Premium 💎. Precisa de 500 moedas. Você tem ${coins}. Ganhe assistindo anúncios na Home.`);
      return;
    }
  }
  let mode = (appState.settings.theme||'default-light').split('-')[1] || 'light';
  const nextTheme = `${baseId}-${mode}`;
  appState.settings.theme = nextTheme;
  document.documentElement.setAttribute('data-theme', nextTheme);
  const frame = document.getElementById('mainIframe');
  if(frame && frame.contentWindow){
    try{ frame.contentWindow.document.documentElement.setAttribute('data-theme', nextTheme); }catch{}
  }
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  window.toast(`Tema ${themes[baseId]?.label||baseId} aplicado`);
};

// ===== Finance =====
window.addTransaction = (data)=>{
  const tx = { id: uid('tx'), type: data.type||'expense', amount: Number(data.amount)||0, category: data.category||'Outros', desc: data.desc||data.description||'', date: data.date || new Date().toISOString(), createdAt: new Date().toISOString() };
  appState.transactions.unshift(tx);
  saveLocalState();
  window.addXP(tx.type==='income'?10:5);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  return tx;
};
window.deleteTransaction = (id)=>{
  appState.transactions = appState.transactions.filter(t=> t.id!==id);
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.getFinanceStats = ()=>{
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  let income=0, expense=0;
  const catMap = {};
  appState.transactions.forEach(t=>{
    const d = new Date(t.date);
    if(d.getMonth()===month && d.getFullYear()===year){
      if(t.type==='income') income+=Number(t.amount);
      else { expense+=Number(t.amount); catMap[t.category]=(catMap[t.category]||0)+Number(t.amount); }
    }
  });
  return { income, expense, saving: income-expense, savingPct: income>0? Math.round(((income-expense)/income)*100):0, catMap };
};

// Compatibility wrappers for old fragments
window.appChangeCurrency = (cur)=>{
  appState.settings.currency = cur;
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  window.toast(`Moeda: ${cur}`);
};
window.appOpenTxModal = ()=>{ const f=document.getElementById('mainIframe'); if(f&&f.contentWindow&&f.contentWindow.openTxModal) f.contentWindow.openTxModal(); };
window.appFilterTx = (type, el)=>{ const f=document.getElementById('mainIframe'); if(f&&f.contentWindow&&f.contentWindow.filterTx) f.contentWindow.filterTx(type, el); };

// ===== Habits =====
window.addHabit = (data)=>{
  const h = { id: uid('habit'), name: data.name, icon: data.icon||'⭐', color: data.color||'#3B82F6', streak:0, completedDates:[], createdAt:new Date().toISOString() };
  appState.habits.push(h);
  saveLocalState();
  window.addXP(20);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  return h;
};
window.toggleHabit = (id)=>{
  const h = appState.habits.find(x=>x.id===id);
  if(!h) return;
  const today = new Date().toISOString().slice(0,10);
  const idx = h.completedDates.indexOf(today);
  if(idx>=0){ h.completedDates.splice(idx,1); h.streak=Math.max(0,(h.streak||1)-1); }
  else { h.completedDates.push(today); h.streak=(h.streak||0)+1; window.addXP(15); }
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.deleteHabit = (id)=>{
  appState.habits = appState.habits.filter(h=>h.id!==id);
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.appOpenHabitModal = ()=>{ const f=document.getElementById('mainIframe'); if(f&&f.contentWindow&&f.contentWindow.openHabitModal) f.contentWindow.openHabitModal(); };
window.appLoadPage = (p)=>{ if(window.navigate) window.navigate(p.includes('.html')?p:p+'.html'); };

// ===== Mood =====
window.addMood = (value, note='')=>{
  const today = new Date().toISOString().slice(0,10);
  const existingIdx = appState.moods.findIndex(m=> m.date===today);
  const mood = { id: uid('mood'), value: Number(value), date: today, note, createdAt: new Date().toISOString() };
  if(existingIdx>=0) appState.moods[existingIdx]=mood;
  else appState.moods.push(mood);
  saveLocalState();
  window.addXP(15);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.appQuickMood = (v)=> window.addMood(v);

// ===== Goals =====
window.addGoal = (data)=>{
  const g = { id: uid('goal'), title: data.title, target: Number(data.target)||100, current: Number(data.current)||0, category: data.category||'Geral', deadline: data.deadline||'', done:false, createdAt:new Date().toISOString() };
  appState.goals.push(g);
  saveLocalState();
  window.addXP(30);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  return g;
};
window.updateGoalProgress = (id, delta)=>{
  const g = appState.goals.find(x=>x.id===id);
  if(!g) return;
  g.current = Math.min(g.target, Math.max(0, (g.current||0)+delta));
  if(g.current>=g.target && !g.done){ g.done=true; window.addXP(100); window.toast('Meta concluída! +100 XP 🎉'); }
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.deleteGoal = (id)=>{
  appState.goals = appState.goals.filter(g=>g.id!==id);
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.appOpenGoalModal = ()=>{ const f=document.getElementById('mainIframe'); if(f&&f.contentWindow&&f.contentWindow.openGoalModal) f.contentWindow.openGoalModal(); };

// ===== Reports / Life Score =====
window.getLifeScore = ()=>{
  const tx = window.getFinanceStats();
  const financeScore = tx.income>0 ? Math.min(100, Math.max(0, tx.savingPct+50))/100 : 0.3;
  const habitScore = appState.habits.length ? (appState.habits.filter(h=> h.completedDates.includes(new Date().toISOString().slice(0,10))).length / appState.habits.length) : 0.5;
  const moodAvg = appState.moods.length ? appState.moods.slice(-7).reduce((a,b)=>a+b.value,0)/Math.min(7,appState.moods.length)/5 : 0.6;
  const goalScore = appState.goals.length ? appState.goals.reduce((a,g)=>a+(g.current/g.target),0)/appState.goals.length : 0.5;
  const score = Math.round((financeScore*0.3 + habitScore*0.3 + moodAvg*0.2 + goalScore*0.2)*100);
  return { score, financeScore, habitScore, moodAvg, goalScore };
};

// ===== Auth =====
window.loginEmail = (email, pass)=> signInWithEmailAndPassword(auth, email, pass);
window.signupEmail = async (email, pass, name)=>{
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await update(ref(db, `vidaplus/users/${cred.user.uid}/profile`), { name, email, createdAt: new Date().toISOString() });
  return cred;
};
window.loginGoogle = ()=> signInWithPopup(auth, googleProvider);
window.logout = ()=> signOut(auth).then(()=>{ localStorage.clear(); location.reload(); });

// ===== Init =====
loadLocalState();
if(appState.transactions.length===0 && appState.habits.length===0) seedDemoData();

initAuthListener(async (user)=>{
  if(user){
    await syncWithFirebase(user);
  }else{
    appState.isLoaded = true;
    if(window.onAppStateUpdate) window.onAppStateUpdate();
  }
});

// Toast
window.toast = (msg)=>{
  let c = document.getElementById('toastContainer');
  if(!c){
    c = document.createElement('div');
    c.id='toastContainer';
    c.style='position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none;';
    document.body.appendChild(c);
  }
  const t = document.createElement('div');
  t.style='background: color-mix(in srgb, var(--text) 90%, transparent); color: var(--bg); padding:12px 22px; border-radius:100px; font-size:13px; font-weight:700; box-shadow:0 10px 30px rgba(0,0,0,0.2); opacity:0; transform:translateY(10px); transition:0.3s; pointer-events:auto; max-width:90vw; text-align:center; backdrop-filter: blur(10px);';
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(()=>{ t.style.opacity='1'; t.style.transform='translateY(0)'; });
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(10px)'; setTimeout(()=> t.remove(), 300); }, 3000);
};

// Currency helper global
window.fmtMoney = (v)=> currencyFormat(v, appState.settings.currency);
