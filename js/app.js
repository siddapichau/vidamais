import { appState, saveLocalState, loadLocalState, getLevelData, themes, levelTable, currencyFormat, uid, seedDemoData, generateDefaultLevels, financeCategories, APP_VERSION, avatarEmojis, medalCategories, evaluateMedals, getAdSettings, trackDailyLogin, renderAvatarHTML, getAvatarChar, applyLevelRewards, resetAppState, fillAvatar } from './core.js';

// Firebase é carregado DE FORMA DINÂMICA e TOLERANTE A FALHAS.
// Antigamente o app.js importava o Firebase (e o CDN gstatic) de forma estática no
// topo do módulo. Se o CDN estivesse bloqueado/offline, TODO o grafo de módulos
// falhava ao linkar e `window.navigate`/funções do shell NUNCA eram definidas ->
// tela congelada ("abre normal mas nada funciona"). Agora o Firebase é opcional:
// se falhar, o app continua 100% funcional em MODO LOCAL.
let db, auth, ref, get, set, update, onValue, arrayToObj, objToArray, initAuthListener, ADMIN_EMAIL;
let signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut;
let GoogleAuthProvider, googleProvider;

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
window.APP_VERSION = APP_VERSION;
window.avatarEmojis = avatarEmojis;
window.medalCategories = medalCategories;
window.evaluateMedals = evaluateMedals;
window.getAdSettings = getAdSettings;
window.renderAvatarHTML = renderAvatarHTML;
window.getAvatarChar = getAvatarChar;
window.fillAvatar = fillAvatar;

let saveDebounce = null;
let currentMenuData = null;
let isSyncing = false; // trava o debounce durante o sync (evita race de persistência)

// ===== Persistence to Firebase (modo local seguro se o Firebase estiver indisponível) =====
function debounceSaveToFirebase(){
  if(isSyncing) return;        // não sobrescreve o Firebase enquanto sincroniza
  if(!db || !auth || !auth.currentUser) return;   // modo local: nada a sincronizar
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

// Força o flush imediato do estado para o Firebase (usado no unload)
function flushFirebaseSave(){
  if(!db || !auth || !auth.currentUser) return;
  const uidUser = auth.currentUser.uid;
  try{
    update(ref(db, `vidaplus/users/${uidUser}`), {
      user: appState.user,
      profile: appState.profile,
      settings: appState.settings,
      transactions: arrayToObj(appState.transactions),
      habits: arrayToObj(appState.habits),
      moods: arrayToObj(appState.moods),
      goals: arrayToObj(appState.goals),
      app: { uid: uidUser, updatedAt: new Date().toISOString() }
    });
  }catch(e){ console.warn('Firebase flush fail', e); }
}

window.addEventListener('vidaplus:save', debounceSaveToFirebase);
window.addEventListener('pagehide', ()=>{ isSyncing = false; flushFirebaseSave(); });
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden'){ isSyncing=false; flushFirebaseSave(); } });

// Mescla array local com remoto por id (preserva adições locais feitas antes do sync)
function mergeById(localArr, remoteArr){
  const map = new Map();
  (localArr||[]).forEach(item=>{ if(item && item.id) map.set(item.id, item); });
  (remoteArr||[]).forEach(item=>{
    if(!item || !item.id) return;
    const local = map.get(item.id);
    if(!local){ map.set(item.id, item); return; }
    const lt = new Date(local.updatedAt || local.createdAt || local.date || 0).getTime() || 0;
    const rt = new Date(item.updatedAt || item.createdAt || item.date || 0).getTime() || 0;
    if(rt >= lt) map.set(item.id, item);
  });
  return Array.from(map.values());
}

async function syncWithFirebase(user){
  isSyncing = true; // trava o debounce para não sobrescrever o Firebase com dados antigos
  try{
    const snap = await get(ref(db, `vidaplus/users/${user.uid}`));
    if(snap.exists()){
      const data = snap.val();
      if(data.user) appState.user = {...appState.user, ...data.user};
      if(data.profile) appState.profile = {...appState.profile, ...data.profile};
      if(data.settings) appState.settings = {...appState.settings, ...data.settings};
      // mescla por id (preserva adições locais feitas antes do sync)
      if(data.transactions) appState.transactions = mergeById(appState.transactions, objToArray(data.transactions));
      if(data.habits) appState.habits = mergeById(appState.habits, objToArray(data.habits));
      if(data.moods) appState.moods = mergeById(appState.moods, objToArray(data.moods));
      if(data.goals) appState.goals = mergeById(appState.goals, objToArray(data.goals));
    }
    // garante identidade do usuário logado (corrige "tela de entrar")
    appState.profile.email = user.email;
    appState.profile.photo = user.photoURL || appState.profile.photo || '';
    if(!appState.profile.name && user.displayName) appState.profile.name = user.displayName;
    trackDailyLogin(appState);
    appState.isLoaded = true;
    document.documentElement.setAttribute('data-theme', appState.settings.theme||'default-light');
    saveLocalState();
  }catch(e){
    console.error('sync error', e);
    appState.profile.email = user.email;
    appState.isLoaded = true;
  }
  isSyncing = false;
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

// (O listener de níveis admin agora é registrado dentro de initFirebase,
//  só depois que o Firebase carrega com sucesso — evita ReferenceError se o
//  CDN estiver indisponível.)

// ===== Core gamification =====
window.addXP = async (amount)=>{
  amount = Number(amount)||0;
  // multiplicador de XP por prêmio de nível
  if(appState.user.xpBoostUntil && appState.user.xpBoostUntil > Date.now() && appState.user.xpBoost>1){
    amount = Math.round(amount * appState.user.xpBoost);
  }
  const oldLvl = getLevelData(appState.user.xp||0).current.level;
  appState.user.xp = (appState.user.xp||0) + amount;
  const lvl = getLevelData(appState.user.xp);
  appState.user.level = lvl.current.level;
  // Level-up bonus: +50 coins por nível + prêmios reais aplicados
  if(lvl.current.level > oldLvl){
    const diff = lvl.current.level - oldLvl;
    appState.user.coins = (appState.user.coins||0) + 50*diff;
    const gained = applyLevelRewards(oldLvl, lvl.current.level, appState.user);
    let msg = `🎉 Nível ${lvl.current.level} (${lvl.current.name})! +${50*diff} 🪙`;
    if(gained.length) msg += ` • 🎁 ${gained.join(', ')}`;
    window.toast && window.toast(msg);
  }
  // Atualiza streak global com base em hábitos feitos hoje
  recalcGlobalStreak();
  saveLocalState();
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};

// ===== XP diário (1 vez por atividade por dia) — evita farm de XP infinito =====
// Ganha XP apenas na PRIMEIRA vez que a atividade é feita no dia. Ex.: registrar
// humor várias vezes no mesmo dia só dá XP 1x; marcar/desmarcar hábito não dá XP
// infinito; "Check geral" só conta 1x/dia.
function awardDailyXp(type, amount){
  const today = new Date().toISOString().slice(0,10);
  if(!appState.user.dailyXp || appState.user.dailyXp.date !== today){
    appState.user.dailyXp = { date: today, types: {} };
  }
  if(appState.user.dailyXp.types[type]) return false; // já ganhou hoje
  appState.user.dailyXp.types[type] = true;
  window.addXP(amount);
  return true;
}
window.awardDailyXp = awardDailyXp;

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
  if(base==='oled') nextMode='dark'; // OLED Midnight é sempre dark
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
  if(!themeDef) return;
  // tema desbloqueado por nível ou "todos os temas grátis" → sem custo
  const unlocked = (appState.user.unlockedThemes||[]).includes(baseId) || appState.user.allThemesFree;
  if(themeDef.premium && !appState.user.premium && !unlocked){
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
  let mode = themeDef.forceMode || (appState.settings.theme||'default-light').split('-')[1] || 'light';
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
  awardDailyXp('tx', tx.type==='income'?10:5);
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
  const old = appState.settings.currency || 'BRL';
  // Converte os valores já registrados para a nova moeda (ex.: 1000 BRL -> ~185 USD)
  if(old !== cur){
    const RATES = { BRL:1, USD:0.185, EUR:0.17 };
    const factor = (RATES[cur]||1)/(RATES[old]||1);
    if(isFinite(factor) && factor>0){
      appState.transactions.forEach(t=>{ if(typeof t.amount==='number'){ t.amount = Math.round((t.amount*factor)*100)/100; } });
    }
  }
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
  awardDailyXp('habit', 20);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
  return h;
};
window.toggleHabit = (id)=>{
  const h = appState.habits.find(x=>x.id===id);
  if(!h) return;
  const today = new Date().toISOString().slice(0,10);
  const idx = h.completedDates.indexOf(today);
  if(idx>=0){ h.completedDates.splice(idx,1); h.streak=Math.max(0,(h.streak||1)-1); }
  else { h.completedDates.push(today); h.streak=(h.streak||0)+1; awardDailyXp('habit_'+h.id, 15); }
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
  awardDailyXp('mood', 15);
  if(window.onAppStateUpdate) window.onAppStateUpdate();
};
window.appQuickMood = (v)=> window.addMood(v);

// ===== Goals =====
window.addGoal = (data)=>{
  const g = { id: uid('goal'), title: data.title, target: Number(data.target)||100, current: Number(data.current)||0, category: data.category||'Geral', deadline: data.deadline||'', done:false, createdAt:new Date().toISOString() };
  appState.goals.push(g);
  saveLocalState();
  awardDailyXp('goal', 30);
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

// ===== Auth (todos protegidos caso o Firebase não tenha carregado) =====
window.loginEmail = (email, pass)=>{
  if(!signInWithEmailAndPassword || !auth) return Promise.reject(new Error('Firebase indisponível'));
  return signInWithEmailAndPassword(auth, email, pass);
};
window.signupEmail = async (email, pass, name)=>{
  if(!createUserWithEmailAndPassword || !auth || !db) throw new Error('Firebase indisponível');
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if(db && ref && update){
    try{ await update(ref(db, `vidaplus/users/${cred.user.uid}/profile`), { name, email, createdAt: new Date().toISOString() }); }catch(e){}
  }
  return cred;
};
window.loginGoogle = ()=>{
  if(!signInWithPopup || !auth) return Promise.reject(new Error('Firebase indisponível'));
  return signInWithPopup(auth, googleProvider);
};
// Logout robusto: reseta o estado em memória e limpa o storage antes do reload
window.logout = ()=>{
  try{ resetAppState(); }catch(e){ console.warn('resetAppState fail', e); }
  try{ localStorage.clear(); }catch(e){}
  if(signOut && auth){ signOut(auth).then(()=> location.reload()).catch(()=> location.reload()); }
  else { location.reload(); }
};

// ===== Loja: compra atômica (anti dedução em dobro) =====
let purchasing = false;
window.purchaseStoreItem = async (id, price)=>{
  if(purchasing) return; // protege contra duplo-clique
  if((appState.user.coins||0) < price){ window.toast && window.toast('Moedas insuficientes 🪙'); return; }
  purchasing = true;
  try{
    appState.user.coins = (appState.user.coins||0) - price; // desconta UMA única vez
    if(id==='theme_lux'){
      appState.user.premium = true;
      saveLocalState();
      await window.appSelectTheme('luxury');
      window.toast && window.toast('💎 Premium desbloqueado!');
    } else if(id==='xp_boost'){
      saveLocalState();
      await window.addXP(100);
      window.toast && window.toast('⚡ +100 XP aplicado!');
    } else if(id==='coins_2x'){
      appState.user.coinsMultiplier = 2;
      appState.user.coinsMultiplierUntil = Date.now() + 24*60*60*1000;
      saveLocalState();
      window.toast && window.toast('💰 Dobro de moedas ativo por 24h!');
    } else if(id==='habit_slot'){
      appState.user.extraHabitSlots = (appState.user.extraHabitSlots||0)+3;
      saveLocalState();
      window.toast && window.toast('⭐ +3 slots de hábito liberados!');
    } else {
      saveLocalState();
      window.toast && window.toast('Compra realizada! 🎉');
    }
    if(window.onAppStateUpdate) window.onAppStateUpdate();
  } finally {
    purchasing = false;
  }
};

// ===== Init =====
loadLocalState();
if(appState.transactions.length===0 && appState.habits.length===0) seedDemoData();

// Carrega o Firebase de forma dinâmica e tolerante a falhas.
// Se o CDN (gstatic) estiver bloqueado/offline, o app continua 100% funcional
// em MODO LOCAL — a tela NUNCA mais congela por causa do Firebase.
async function initFirebase(){
  try{
    const fb = await import('./firebase.js');
    ({ db, auth, ref, get, set, update, onValue, arrayToObj, objToArray, initAuthListener, ADMIN_EMAIL } = fb);
    const fa = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    ({ signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } = fa);
    googleProvider = new GoogleAuthProvider();

    // Níveis admin (live) — só depois do Firebase disponível
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
    }catch(e){ console.warn('admin/levels listener fail', e); }

    // Menu admin (live) — só depois do Firebase disponível
    try{
      onValue(ref(db, 'admin/menu'), (snapshot)=>{
        const menuData = snapshot.val();
        if(!menuData || (Array.isArray(menuData) && menuData.length===0)) return;
        const menu = Array.isArray(menuData) ? menuData : Object.values(menuData);
        const sorted = menu.filter(Boolean).sort((a,b)=> (a.order||0)-(b.order||0));
        if(sorted.length===0) return;
        const pcNav = document.getElementById('pcNav');
        const mobNav = document.getElementById('mobileNav');
        if(!pcNav || !mobNav) return;
        pcNav.innerHTML=''; mobNav.innerHTML='';
        sorted.forEach(item=>{
          if(!item || !item.page) return;
          const link=`<span style="font-size:16px">${item.icon||'•'}</span> <span>${item.label||item.page}</span>`;
          const aPC=document.createElement('a'); aPC.className='nav-item'; aPC.href='javascript:void(0)'; aPC.onclick=()=>{ if(window.navigate) window.navigate(item.page); }; aPC.innerHTML=link; pcNav.appendChild(aPC);
          const aMob=document.createElement('a'); aMob.className='nav-item'; aMob.href='javascript:void(0)'; aMob.onclick=()=>{ if(window.navigate) window.navigate(item.page); }; aMob.innerHTML=link; mobNav.appendChild(aMob);
        });
        const p2=new URLSearchParams(window.location.search);
        const cur=(p2.get('page')||'home.html').replace('pages/','');
        document.querySelectorAll('.nav-item').forEach(a=>{ const oc=a.getAttribute('onclick')||''; a.classList.toggle('active', oc.indexOf(cur)>-1); });
      });
    }catch(e){ console.warn('admin/menu listener fail', e); }

    initAuthListener(async (user)=>{
      if(user){
        await syncWithFirebase(user);
      }else{
        appState.isLoaded = true;
        if(window.onAppStateUpdate) window.onAppStateUpdate();
      }
    });
  }catch(e){
    // MODO LOCAL: Firebase indisponível. App continua funcionando normalmente.
    console.warn('⚠️ Firebase indisponível — app em modo local (sem sincronização na nuvem).', e && e.message ? e.message : e);
    appState.isLoaded = true;
    if(window.onAppStateUpdate) window.onAppStateUpdate();
  }
}
initFirebase();

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
