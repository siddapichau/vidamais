// Vida+ AI - APP v6 FINAL - BULLETPROOF MOBILE - NÃO TRAVA MAIS
// Correção: fallback inline se /pages/ falhar + login Google redirect + erro visível + sem info admin
// Index roteador: ?page=dashboard | Se pages/ não existir, usa fallback inline garantido

import { state, themes, currencies, levelTable, defaultCategories, moodMap, fmtMoney, fmtDate, todayStr, getLevel, getNextLevel, getLevelProgress, loadState, saveState, addXP, calcStreak, calcHabitRate, calcLifeScore, generateInsights, seedHabits, ensureSeed, applyRemoteData, setUid } from './core.js';
import { VidaFirebase, FIREBASE_DB_URL, auth } from './firebase.js';
import { initAuthListener, loginEmail as fbLoginEmail, signupEmail as fbSignupEmail, loginGoogle as fbLoginGoogle, logout as fbLogout, resetPassword, updateUserProfileData, changePassword as fbChangePassword, loadFullUser, getUid } from './firebase.js';

let tempMood = null;
let currentPage = 'dashboard';

// Expose globais para onclick funcionar no celular (com e sem prefixo app*)
function expose(name, fn){ window[name]=fn; window['app'+name.charAt(0).toUpperCase()+name.slice(1)]=fn; }
expose('toast', toast);
expose('loadPage', loadPage);
expose('switchView', loadPage);
expose('toggleTheme', toggleTheme);
expose('openQuickAdd', openQuickAdd);
expose('openPremium', openPremium);
expose('closeModal', closeModal);
expose('openTxModal', openTxModal);
expose('openHabitModal', openHabitModal);
expose('openMoodModal', openMoodModal);
expose('openGoalModal', openGoalModal);
expose('saveTx', saveTx);
expose('saveHabit', saveHabit);
expose('saveGoal', saveGoal);
expose('toggleHabit', toggleHabit);
expose('editHabit', editHabit);
expose('deleteHabit', deleteHabit);
expose('filterTx', filterTx);
expose('setTxType', setTxType);
expose('quickMood', quickMood);
expose('pickMood', pickMood);
expose('confirmMood', confirmMood);
expose('saveMoodNote', saveMoodNote);
expose('addGoalProgress', addGoalProgress);
expose('deleteGoal', deleteGoal);
expose('saveProfile', saveProfile);
expose('saveCompleteProfile', saveCompleteProfile);
expose('changePasswordProfile', changePasswordProfile);
expose('changeCurrency', changeCurrency);
expose('handleLogin', handleLogin);
expose('handleSignup', handleSignup);
expose('handleGoogleLogin', handleGoogleLogin);
expose('handleLogout', handleLogout);
expose('handleReset', handleReset);
expose('switchAuthMode', switchAuthMode);
expose('openAuthModal', openAuthModal);

function toast(msg, ico='✦'){
  const stack=document.getElementById('toasts');
  if(!stack) return;
  const el=document.createElement('div');
  el.className='toast';
  el.innerHTML=`<div class="t-ico">${ico}</div><div>${msg}</div>`;
  stack.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=>el.remove(),300); }, 4000);
}
function confettiLevel(lvl){
  const o=document.createElement('div');
  o.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:999;display:grid;place-items:center';
  o.innerHTML=`<div style="background:var(--card);padding:22px 26px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);border:1px solid var(--border);text-align:center"><div style="font-size:42px">${lvl.icon||'🎉'}</div><b>Nível ${lvl.level} • ${lvl.name}</b><p style="color:var(--muted);font-size:12px;margin-top:6px">${lvl.reward}</p></div>`;
  document.body.appendChild(o);
  setTimeout(()=>o.remove(),2800);
}

let _syncing=false;
async function trySyncAll(){
  if(_syncing) return;
  const uid=getUid();
  if(uid==='default_user') return;
  _syncing=true;
  try{
    await Promise.all([
      VidaFirebase.syncCollection(uid,'transactions',state.tx),
      VidaFirebase.syncCollection(uid,'habits',state.habits),
      VidaFirebase.syncCollection(uid,'moods',state.moods),
      VidaFirebase.syncCollection(uid,'goals',state.goals),
      VidaFirebase.syncCollection(uid,'app',state.app),
      VidaFirebase.syncCollection(uid,'settings',state.settings),
      VidaFirebase.syncCollection(uid,'user',state.user),
      VidaFirebase.syncCollection(uid,'profile',state.profile)
    ]);
    const el=document.getElementById('syncStatus');
    if(el) el.textContent=`● Sincronizado ✔ • ${state.settings.currency}`;
  }catch(e){
    const el=document.getElementById('syncStatus');
    if(el) el.textContent='● Offline: '+e.message.slice(0,40);
  }finally{_syncing=false;}
}
async function pullFromFirebase(){
  const uid=getUid();
  if(uid==='default_user') return;
  try{
    const remote=await loadFullUser(uid);
    if(remote){
      const changed=applyRemoteData(remote);
      if(changed){ toast('Nuvem puxada ☁️','☁️'); renderCurrentPage(); }
    }
  }catch(e){ console.warn(e); }
}

window.addEventListener('vidaplus:xp', (e)=>{
  const {amount, reason, leveledUp, curr}=e.detail;
  updateXPUI();
  if(leveledUp){ confettiLevel(curr); toast(`Nível ${curr.level} • ${curr.name} - ${curr.reward}`,'🎉'); }
  else if(reason) toast(`+${amount} XP • ${reason}`,'⚡');
  trySyncAll();
});
window.addEventListener('vidaplus:save', ()=>{
  clearTimeout(window._syncTimer);
  window._syncTimer=setTimeout(()=>trySyncAll(),800);
});
window.addEventListener('vidaplus:auth', async (e)=>{
  const user=e.detail.user;
  const authOverlay=document.getElementById('overlayAuth');
  if(user){
    setUid(user.uid);
    state.profile.email=user.email;
    if(user.displayName && !state.profile.firstName){
      const p=user.displayName.split(' ');
      state.profile.firstName=p[0];
      state.profile.lastName=p.slice(1).join(' ');
      state.profile.name=user.displayName;
    }
    if(user.photoURL) state.profile.photo=user.photoURL;
    state.user.name=state.profile.firstName||state.profile.name||user.email.split('@')[0];
    saveState();
    if(authOverlay) authOverlay.classList.remove('open');
    updateHeader();
    await pullFromFirebase();
    // Só abre completar perfil se faltar nome mesmo
    if(!state.profile.firstName || !state.profile.lastName){
      const cp=document.getElementById('overlayCompleteProfile');
      if(cp){
        document.getElementById('completeFirstName').value=state.profile.firstName||'';
        document.getElementById('completeLastName').value=state.profile.lastName||'';
        document.getElementById('completePhone').value=state.profile.phone||'';
        cp.classList.add('open');
      }
    }
    renderCurrentPage();
    toast(`Bem-vindo, ${state.profile.firstName||state.user.name}!`,'👋');
  }else{
    setUid('default_user');
    updateHeader();
    openAuthModal();
  }
});

// AUTH - SIMPLES E COM ERRO VISÍVEL (NÃO TRAVA)
let _authBusy=false;
export function openAuthModal(){
  const el=document.getElementById('overlayAuth');
  if(el){ el.classList.add('open'); el.style.display='grid'; }
  const err=document.getElementById('authError');
  if(err) err.style.display='none';
}
export function switchAuthMode(mode){
  const lv=document.getElementById('authLoginView');
  const sv=document.getElementById('authSignupView');
  const tl=document.getElementById('tabLogin');
  const ts=document.getElementById('tabSignup');
  const title=document.getElementById('authTitle');
  if(mode==='signup'){
    if(lv) lv.style.display='none';
    if(sv) { sv.style.display='grid'; }
    if(tl) tl.classList.remove('active');
    if(ts) ts.classList.add('active');
    if(title) title.textContent='Criar conta';
  }else{
    if(lv) lv.style.display='grid';
    if(sv) sv.style.display='none';
    if(tl) tl.classList.add('active');
    if(ts) ts.classList.remove('active');
    if(title) title.textContent='Entrar no Vida+ AI';
  }
  const err=document.getElementById('authError');
  if(err) err.style.display='none';
}
function showAuthError(msg){
  const el=document.getElementById('authError');
  if(!el) { toast(msg,'⚠️'); return; }
  if(!msg){ el.style.display='none'; return; }
  el.style.display='block';
  el.textContent=msg;
  // também toast pra celular vibrar
  toast(msg,'⚠️');
}

export async function handleLogin(){
  if(_authBusy) return;
  const email=document.getElementById('authEmail')?.value.trim();
  const pass=document.getElementById('authPass')?.value;
  if(!email||!pass){ showAuthError('Digite e-mail e senha'); return; }
  _authBusy=true;
  const btn=document.getElementById('authBtnLogin');
  const original=btn?.textContent;
  try{
    if(btn){ btn.textContent='Entrando...'; btn.disabled=true; }
    showAuthError('');
    await fbLoginEmail(email, pass);
    // fecha via evento auth
  }catch(e){
    console.error(e);
    let msg=e.message||'Erro login';
    if(e.code==='auth/invalid-credential' || e.code==='auth/wrong-password' || e.code==='auth/user-not-found') msg='E-mail ou senha incorretos';
    if(e.code==='auth/too-many-requests') msg='Muitas tentativas, aguarde ou redefina senha';
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado. Adicione em Firebase > Auth > Authorized domains`;
    if(e.code==='auth/network-request-failed') msg='Sem internet ou Firebase fora. Verifique conexão';
    showAuthError(msg+' ('+e.code+')');
  }finally{
    _authBusy=false;
    if(btn){ btn.textContent=original||'Entrar'; btn.disabled=false; }
  }
}
export async function handleSignup(){
  if(_authBusy) return;
  const fn=document.getElementById('authFirstName')?.value.trim()||'';
  const ln=document.getElementById('authLastName')?.value.trim()||'';
  const email=document.getElementById('authEmailSignup')?.value.trim()||'';
  const pass=document.getElementById('authPassSignup')?.value||'';
  const phone=document.getElementById('authPhone')?.value.trim()||'';
  const curr=document.getElementById('authCurrency')?.value||'BRL';
  if(!fn){ showAuthError('Informe nome'); return; }
  if(!email){ showAuthError('Informe e-mail'); return; }
  if(!pass || pass.length<6){ showAuthError('Senha mínimo 6 caracteres'); return; }
  _authBusy=true;
  const btn=document.getElementById('authBtnSignup');
  const orig=btn?.textContent;
  try{
    if(btn){ btn.textContent='Criando...'; btn.disabled=true; }
    showAuthError('');
    const fullName=`${fn} ${ln}`.trim();
    await fbSignupEmail(email, pass, fullName, {phone, currency: curr});
    state.profile.firstName=fn;
    state.profile.lastName=ln;
    state.profile.phone=phone;
    state.profile.currency=curr;
    state.settings.currency=curr;
    saveState();
    toast('Conta criada! Logado automaticamente 🎉','🎉');
  }catch(e){
    console.error(e);
    let msg=e.message;
    if(e.code==='auth/email-already-in-use') msg='E-mail já existe, tente Entrar';
    if(e.code==='auth/weak-password') msg='Senha fraca, mínimo 6';
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado`;
    showAuthError(msg+' ('+e.code+')');
  }finally{
    _authBusy=false;
    if(btn){ btn.textContent=orig||'Criar conta'; btn.disabled=false; }
  }
}
export async function handleGoogleLogin(){
  if(_authBusy) return;
  _authBusy=true;
  const btns=document.querySelectorAll('#authBtnGoogle, [onclick*="Google"]');
  const origTexts=[...btns].map(b=>b.textContent);
  try{
    btns.forEach(b=>{ b.textContent='Conectando Google...'; b.disabled=true; });
    showAuthError('');
    const user=await fbLoginGoogle();
    if(user){
      toast('Google OK!','✓');
    }else{
      // redirect iniciado - página vai recarregar
      toast('Redirecionando para Google... aguarde voltar','↗️');
    }
  }catch(e){
    console.error(e);
    let msg=e.message;
    if(e.code==='auth/popup-closed-by-user') msg='Popup fechado, tente novamente ou use Redirect';
    if(e.code==='auth/popup-blocked') msg='Popup bloqueado. Clique em "Google Redirect" ou permita popups. No celular use Redirect.';
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado. Adicione em Firebase > Auth > Authorized domains`;
    showAuthError(msg+' ('+e.code+')');
  }finally{
    _authBusy=false;
    btns.forEach((b,i)=>{ b.textContent=origTexts[i]||'Continuar com Google'; b.disabled=false; });
  }
}
export async function handleLogout(){
  if(!confirm('Sair? Progresso salvo no Firebase.')) return;
  try{ await fbLogout(); toast('Saiu','👋'); openAuthModal(); }catch(e){ toast('Erro sair: '+e.message,'⚠️'); }
}
export async function handleReset(){
  const email=document.getElementById('authEmail')?.value.trim() || document.getElementById('authEmailSignup')?.value.trim() || '';
  if(!email){ showAuthError('Digite e-mail para reset'); return; }
  try{
    const { resetPassword } = await import('./firebase.js');
    await resetPassword(email);
    showAuthError('E-mail de recuperação enviado para '+email+' - verifique spam');
    toast('E-mail enviado 📧','📧');
  }catch(e){ showAuthError(e.message+' ('+e.code+')'); }
}
export async function saveCompleteProfile(){
  const fn=document.getElementById('completeFirstName')?.value.trim()||'';
  const ln=document.getElementById('completeLastName')?.value.trim()||'';
  const phone=document.getElementById('completePhone')?.value.trim()||'';
  const curr=document.getElementById('completeCurrency')?.value||'BRL';
  if(!fn){ toast('Nome obrigatório','⚠️'); return; }
  state.profile.firstName=fn;
  state.profile.lastName=ln;
  state.profile.phone=phone;
  state.profile.currency=curr;
  state.profile.name=`${fn} ${ln}`.trim();
  state.settings.currency=curr;
  state.user.name=state.profile.name;
  saveState();
  try{
    const uid=getUid();
    if(uid!=='default_user'){
      await VidaFirebase.updateUserProfileData(uid, state.profile);
      await trySyncAll();
    }
    toast('Perfil salvo!','✓');
    closeModal('overlayCompleteProfile');
    updateHeader();
  }catch(e){ toast('Erro: '+e.message,'⚠️'); }
}

// RESTO: perfil, moeda, tema, etc (simplificado para não travar)
export async function saveProfile(){
  const fn=document.getElementById('profileFirstName')?.value.trim()||'';
  const ln=document.getElementById('profileLastName')?.value.trim()||'';
  const phone=document.getElementById('profilePhone')?.value.trim()||'';
  const curr=document.getElementById('profileCurrency')?.value||'BRL';
  const theme=document.getElementById('profileTheme')?.value||'light';
  state.profile.firstName=fn; state.profile.lastName=ln; state.profile.phone=phone; state.profile.currency=curr; state.profile.name=`${fn} ${ln}`.trim()||state.profile.name;
  state.settings.currency=curr; state.settings.theme=theme; state.app.theme=theme;
  state.user.name=state.profile.name;
  document.documentElement.setAttribute('data-theme', theme);
  saveState();
  trySyncAll();
  toast('Perfil salvo','✓');
  updateHeader();
}
export async function changePasswordProfile(){
  toast('Use Esqueci senha no login para reset por e-mail (mais seguro no celular)','ℹ️');
}
export function changeCurrency(code){
  state.settings.currency=code; state.profile.currency=code; saveState(); trySyncAll();
  const el=document.getElementById('currencyLabelTop'); if(el) el.textContent=code;
  renderCurrentPage(); toast('Moeda '+code,'💱');
}
function applyThemePreview(id){
  if(!id) return;
  const t=themes[id];
  if(t?.premium && !state.app.premium){
    const isAdmin = (()=>{ try{ return VidaFirebase?.isCurrentUserAdmin?.(); }catch{return false;} })();
    if(!isAdmin){ openPremium(); return; }
  }
  document.documentElement.setAttribute('data-theme', id);
  state.settings.theme=id; state.app.theme=id; saveState(); trySyncAll();
}
export function previewCurrency(c){ const el=document.getElementById('profileCurrency'); if(el) el.value=c; }

// ROUTER COM HOME VIRAL SEM LOGIN + PROTEGIDAS COM LOGIN + FALLBACK
export async function loadPage(pageName){
  let name = (pageName||'home').replace('.html','').toLowerCase();
  const allowed=['home','dashboard','financeiro','habitos','humor','metas','relatorios','conquistas','perfil'];
  if(!allowed.includes(name)) name='home';
  currentPage=name;

  document.querySelectorAll('.nav button').forEach(b=>{ b.classList.toggle('active', b.dataset.page===name); });
  try{
    const url=new URL(window.location);
    url.searchParams.set('page', name);
    window.history.pushState({}, '', url);
  }catch{}

  const homeView=document.getElementById('homeView');
  const pageContainer=document.getElementById('pageContainer');
  const homeEssential=document.getElementById('homeEssential');

  // Home é pública, não precisa login, não puxa Firebase pesado
  if(name==='home'){
    if(homeView) homeView.style.display='block';
    if(homeEssential) homeEssential.style.display='none';
    if(pageContainer){ pageContainer.style.display='none'; pageContainer.innerHTML=''; }
    // Carrega home.html fragment viral
    try{
      const res=await fetch(`pages/home.html?embedded=1&_=${Date.now()}`, {cache:'no-store'});
      if(res.ok){
        let html=await res.text();
        const m=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if(m) html=m[1];
        html=html.replace(/<script[^>]*>[\s\S]*?location\.replace[\s\S]*?<\/script>/gi,'');
        if(homeView) homeView.innerHTML=html;
      }
    }catch(e){ console.warn('home load', e.message); }
    // resize
    setTimeout(()=>{ const f=document.getElementById('pageFrame'); if(f){ try{ f.style.height='auto'; }catch{} } },100);
    return;
  }

  // Páginas protegidas: se não logado, pede login e não carrega
  const uid=getUid();
  if(uid==='default_user'){
    if(homeView) homeView.style.display='none';
    if(pageContainer){ pageContainer.style.display='none'; pageContainer.innerHTML=''; }
    openAuthModal();
    toast('Faça login para acessar '+name,'🔒');
    return;
  }

  // Logado: esconde home, mostra container page
  if(homeView) homeView.style.display='none';
  if(homeEssential) homeEssential.style.display='none';
  if(pageContainer) pageContainer.style.display='block';
  if(!pageContainer) return;
  pageContainer.innerHTML=`<div class="page-loader"><div style="font-size:28px">◍</div><b>Carregando ${name}...</b><p style="font-size:11px;color:var(--muted)">pages/${name}.html • herda CSS/JS do Index</p></div>`;

  // Tenta pages/ primeiro, depois raiz, depois fallback inline
  const tryUrls=[`pages/${name}.html`, `${name}.html`];
  for(const tryUrl of tryUrls){
    try{
      const res=await fetch(`${tryUrl}?embedded=1&_=${Date.now()}`, {cache:'no-store'});
      if(!res.ok) continue;
      let html=await res.text();
      if(html.includes('http-equiv="refresh"') && html.includes('index.html?page=')) continue; // pula redirect
      const m=html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if(m) html=m[1];
      html=html.replace(/<script[^>]*>[\s\S]*?location\.replace[\s\S]*?<\/script>/gi,'');
      if(!html.trim()) continue;
      pageContainer.innerHTML=html;
      setTimeout(()=>{ renderCurrentPage(); },80);
      return;
    }catch(e){ console.warn(`[loadPage] ${tryUrl} falhou`, e.message); continue; }
  }

  // Fallback inline garantido
  pageContainer.innerHTML=getFallbackPageHTML(name);
  renderCurrentPage();
}
function getFallbackPageHTML(name){
  // Fallback mínimo para não travar nunca
  const common=`<p style="font-size:11px;color:var(--muted);margin-top:8px;text-align:center">Modo fallback inline - funciona mesmo sem /pages/. Para versão modular completa, upa pasta /pages/ no GitHub.</p>`;
  if(name==='dashboard'){
    return `<div class="grid grid-4"><div class="card kpi"><div class="kpi-head"><span class="kpi-label">Saldo</span><span class="kpi-icon" style="background:#E0F2FE">💰</span></div><div class="kpi-value" id="balanceValue">R$ 0</div><div class="kpi-sub"><span class="badge badge-up" id="balanceTrend">+0%</span> <span id="balanceSub">0 transações</span></div><div style="height:44px"><canvas id="miniBalance"></canvas></div></div>
    <div class="card kpi"><div class="kpi-head"><span class="kpi-label">XP</span><span class="kpi-icon" style="background:#FEF3C7">⚡</span></div><div class="kpi-value"><span id="levelLabel">Nv 1</span> <small id="xpLabel">0 XP</small></div><div class="lvl-bar"><i id="xpBar" style="width:0%"></i></div><div class="kpi-sub">Falta <b id="xpNext">500 XP</b></div></div>
    <div class="card kpi"><div class="kpi-head"><span class="kpi-label">Hábitos</span><span class="kpi-icon" style="background:#DCFCE7">✅</span></div><div class="kpi-value"><span id="habitsDone">0</span>/<span id="habitsTotal">0</span></div><div class="progress"><i id="habitsProgress"></i></div><div class="kpi-sub" id="habitsMotivation">Comece!</div></div>
    <div class="card kpi"><div class="kpi-head"><span class="kpi-label">Humor</span><span class="kpi-icon" id="moodIcon">🙂</span></div><div class="kpi-value" id="moodLabel">--</div><div class="kpi-sub" id="moodSub">--</div><div id="moodWeekDots" style="display:flex;gap:6px;margin-top:8px"></div></div></div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><b>Hábitos hoje</b><div id="todayHabits" style="display:grid;gap:10px;margin-top:12px"></div></div><div class="card"><b>Insights IA</b><div id="aiInsights" style="display:grid;gap:10px;margin-top:12px"></div></div></div>
    <div class="grid grid-2" style="margin-top:16px"><div class="card"><b>Fluxo</b><div class="chart-box"><canvas id="weeklyFlow"></canvas></div></div><div class="card"><b>Gastos</b><div class="chart-box"><canvas id="categoryDonut"></canvas></div></div></div>${common}`;
  }
  return `<div class="card" style="text-align:center;padding:20px"><h3>${name}</h3><p style="font-size:12px;color:var(--muted);margin-top:8px">Página ${name} - fallback inline ativo.<br>Se quiser versão completa separada, verifique se <code>pages/${name}.html</code> existe no GitHub Pages.</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="appLoadPage('dashboard')">Dashboard</button></div>${common}`;
}

function renderCurrentPage(){ updateHeader(); updateXPUI(); try{renderDashboard();}catch(e){} try{renderTx();}catch(e){} try{renderHabits();}catch(e){} try{renderMood();}catch(e){} try{renderGoals();}catch(e){} try{renderReports();}catch(e){} try{renderAchievements();}catch(e){} try{renderPerfil();}catch(e){} }

function renderPerfil(){
  const gv=(id,v)=>{ const el=document.getElementById(id); if(el) el.value=v||''; };
  const gt=(id,t)=>{ const el=document.getElementById(id); if(el) el.textContent=t||''; };
  gv('profileFirstName', state.profile.firstName); gv('profileLastName', state.profile.lastName); gv('profilePhone', state.profile.phone); gv('profileEmail', state.profile.email); gv('profileCurrency', state.settings.currency); gv('profileTheme', state.settings.theme);
  gt('profileUid', getUid()); gt('uidShort', getUid().slice(0,8));
  const lvl=getLevel(state.user.xp||0); const prog=getLevelProgress(state.user.xp||0);
  gt('perfilLevel', `Nv ${lvl.level} • ${lvl.name}`); gt('perfilXp', `${state.user.xp||0} XP`);
  const bar=document.getElementById('perfilBar'); if(bar) bar.style.width=prog.pct+'%';
}

export function updateHeader(){
  const ne=document.getElementById('userName'); if(ne) ne.textContent=state.profile.firstName||state.user.name||'Usuário';
  const sn=document.getElementById('sidebarName'); if(sn) sn.textContent=state.profile.firstName? `Olá, ${state.profile.firstName}` : 'Sua evolução';
  const av=document.getElementById('avatar'); if(av){
    const ph=state.profile.photo;
    if(ph){ av.innerHTML=`<img src="${ph}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`; av.style.background='transparent'; }
    else{ av.textContent=(state.profile.firstName||state.user.name||'U').charAt(0).toUpperCase(); av.style.background=''; }
  }
  const ec=document.getElementById('userEmailChip'); if(ec) ec.textContent=state.profile.email||'offline';
  const ct=document.getElementById('currencyLabelTop'); if(ct) ct.textContent=state.settings.currency||'BRL';
  const td=document.getElementById('todayDate'); if(td) td.textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  calcStreak();
  const sl=document.getElementById('streakLabel'); if(sl) sl.textContent=`Streak ${state.app.streak||0}d`;
  const ss=document.getElementById('syncStatus'); if(ss){ const uid=getUid(); ss.textContent= uid==='default_user' ? '● Offline' : `● ${state.settings.currency} • ${uid.slice(0,6)}`; }
  const pt=document.getElementById('premiumTag'); if(pt) pt.textContent= state.app.premium ? '★ Premium' : 'Free';
}
export function updateXPUI(){
  const xp=state.user.xp||0; const prog=getLevelProgress(xp);
  const s=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  s('levelLabel', `Nv ${prog.curr.level}`); s('xpLabel', `${xp} XP`); s('xpFrom', `${prog.curr.xp} XP`); s('xpTo', `${prog.next.xp} XP`); s('xpNext', `${prog.next.xp-xp} XP`);
  const xb=document.getElementById('xpBar'); if(xb) xb.style.width=prog.pct+'%';
}

export function renderDashboard(){
  const total=state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const bv=document.getElementById('balanceValue'); if(bv) bv.textContent=fmtMoney(total, state.settings.currency);
  const monthTx=state.tx.filter(t=> new Date(t.date).getMonth()===new Date().getMonth());
  const bs=document.getElementById('balanceSub'); if(bs) bs.textContent=`${monthTx.length} transações`;
  const today=todayStr(); let done=0; state.habits.forEach(h=>{ if(h.history && h.history[today]) done++; });
  const st=(id,t)=>{ const e=document.getElementById(id); if(e) e.textContent=t; };
  st('habitsDone', done); st('habitsTotal', state.habits.length);
  const hp=document.getElementById('habitsProgress'); if(hp) hp.style.width= (state.habits.length? (done/state.habits.length*100):0)+'%';
  st('todayProgressPct', Math.round((state.habits.length? done/state.habits.length:0)*100)+'%');
  const todMood=state.moods.find(m=>m.date===today);
  if(todMood){ const mm=moodMap[todMood.level]; st('moodLabel', mm.label); const mi=document.getElementById('moodIcon'); if(mi) mi.textContent=mm.emoji; }
  const dots=document.getElementById('moodWeekDots'); if(dots){ dots.innerHTML=''; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const m=state.moods.find(x=>x.date===d); const dot=document.createElement('div'); dot.style.cssText=`width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:12px;background:${m?moodMap[m.level].color:'var(--bg-2)'};color:${m?'white':'var(--muted-2)'}`; dot.textContent=m?moodMap[m.level].emoji:'·'; dots.appendChild(dot); } }
  const list=document.getElementById('todayHabits'); if(list){ list.innerHTML=''; state.habits.slice(0,4).forEach(h=>{ const isDone=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${isDone?'done':''}" onclick="appToggleHabit('${h.id}')">${isDone?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>${h.streak}d streak</span></div>`; list.appendChild(el); }); }
  const ai=document.getElementById('aiInsights'); if(ai){ ai.innerHTML=''; generateInsights(state.app.premium).slice(0,3).forEach(ins=>{ const d=document.createElement('div'); d.className='insight'; d.innerHTML=`<div class="i-ico" style="background:${ins.color}">${ins.ico}</div><div><b>${ins.title}</b><p>${ins.text}</p></div>`; ai.appendChild(d); }); }
  try{ drawMiniBalance(); drawWeeklyFlow(); drawCategoryDonut(); }catch{}
}
function drawMiniBalance(){
  const c=document.getElementById('miniBalance'); if(!c) return; const ctx=c.getContext('2d'); const r=c.getBoundingClientRect(); c.width=r.width*(window.devicePixelRatio||1); c.height=r.height*(window.devicePixelRatio||1); ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1); ctx.clearRect(0,0,r.width,r.height);
  const pts=[]; let b=0; [...state.tx].sort((a,b)=> new Date(a.date)-new Date(b.date)).slice(-10).forEach(t=>{ b+= t.type==='income'? t.amount : -t.amount; pts.push(b); }); if(pts.length<2) pts.push(0,100);
  const min=Math.min(...pts),max=Math.max(...pts); ctx.beginPath(); ctx.strokeStyle='#6366F1'; ctx.lineWidth=2; pts.forEach((p,i)=>{ const x=(i/(pts.length-1))*r.width; const y=r.height - ((p-min)/(max-min||1))*r.height; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
}
function drawWeeklyFlow(){
  const c=document.getElementById('weeklyFlow'); if(!c) return; const ctx=c.getContext('2d'); const r=c.getBoundingClientRect(); c.width=r.width*(window.devicePixelRatio||1); c.height=r.height*(window.devicePixelRatio||1); ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1); ctx.clearRect(0,0,r.width,r.height);
  const days=[]; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000); const s=d.toISOString().slice(0,10); const tx=state.tx.filter(t=>t.date===s); const inc=tx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0); const exp=tx.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0); days.push({label:d.toLocaleDateString('pt-BR',{weekday:'short'}),inc,exp}); }
  const max=Math.max(1,...days.map(d=>Math.max(d.inc,d.exp))); days.forEach((d,i)=>{ const x=i*(r.width/7)+4; const incH=(d.inc/max)*(r.height-30); const expH=(d.exp/max)*(r.height-30); ctx.fillStyle='#DCFCE7'; ctx.fillRect(x, r.height-20-incH, r.width/7-8, incH); ctx.fillStyle='#FEE2E2'; ctx.fillRect(x, r.height-20-incH-expH-4, r.width/7-8, expH); });
}
function drawCategoryDonut(){
  const c=document.getElementById('categoryDonut'); if(!c) return; const ctx=c.getContext('2d'); const r=c.getBoundingClientRect(); c.width=r.width*(window.devicePixelRatio||1); c.height=r.height*(window.devicePixelRatio||1); ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1); ctx.clearRect(0,0,r.width,r.height);
  const exp=state.tx.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{}); const entries=Object.entries(exp).slice(0,5); if(!entries.length) return; const total=entries.reduce((s,e)=>s+e[1],0); let ang=-Math.PI/2; const colors=['#123C7A','#6366F1','#06B6D4','#10B981','#F59E0B']; entries.forEach(([k,v],i)=>{ const slice=(v/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(r.width/2,r.height/2); ctx.arc(r.width/2,r.height/2,Math.min(r.width,r.height)/2-10,ang,ang+slice); ctx.closePath(); ctx.fillStyle=colors[i%5]; ctx.fill(); ang+=slice; });
}

// Demais renders simplificados para não travar
export function renderTx(){
  const cont=document.getElementById('txList'); if(!cont) return;
  let filtered=[...state.tx].sort((a,b)=> new Date(b.date)-new Date(a.date));
  const filter=state.app.txFilter||'all'; if(filter!=='all') filtered=filtered.filter(t=>t.type===filter);
  const search=document.getElementById('txSearch')?.value.toLowerCase()||''; if(search) filtered=filtered.filter(t=>t.category.toLowerCase().includes(search));
  cont.innerHTML=''; if(!filtered.length) cont.innerHTML='<p style="color:var(--muted);font-size:12px;padding:12px;text-align:center">Nenhuma transação</p>';
  filtered.forEach(t=>{ const d=document.createElement('div'); d.className='tx'; const inc=t.type==='income'; d.innerHTML=`<div class="tx-ico" style="background:${inc?'#DCFCE7':'#FEE2E2'}">${inc?'↑':'↓'}</div><div><b>${t.desc||t.category}</b><br><span>${t.category} • ${fmtDate(t.date)}</span></div><div class="tx-amt" style="color:${inc?'#10B981':'#F43F5E'}">${fmtMoney(t.amount, state.settings.currency)}</div>`; cont.appendChild(d); });
  const inc=state.tx.filter(t=>t.type==='income' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);
  const exp=state.tx.filter(t=>t.type==='expense' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('incomeMonth', fmtMoney(inc, state.settings.currency)); set('expenseMonth', fmtMoney(exp, state.settings.currency)); set('savingMonth', fmtMoney(inc-exp, state.settings.currency));
}
export function renderHabits(){
  const lib=document.getElementById('habitsLibrary'); if(lib){ lib.innerHTML=''; state.habits.forEach(h=>{ const today=todayStr(); const done=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${done?'done':''}" onclick="appToggleHabit('${h.id}')">${done?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>${h.streak}d streak</span></div>`; lib.appendChild(el); }); }
}
export function renderMood(){ /* simplificado */ }
export function renderGoals(){
  const g=document.getElementById('goalsGrid'); if(!g) return; g.innerHTML=''; state.goals.forEach(goal=>{ const pct=Math.min(100, (goal.current/goal.target)*100); const d=document.createElement('div'); d.className='card'; d.innerHTML=`<b>${goal.title}</b><div class="progress" style="margin:8px 0"><i style="width:${pct}%"></i></div><small>${Math.round(pct)}%</small>`; g.appendChild(d); });
}
export function renderReports(){
  const ls=document.getElementById('lifeScore'); if(ls) ls.textContent=calcLifeScore();
  const lsb=document.getElementById('lifeScoreBar'); if(lsb) lsb.style.width=calcLifeScore()+'%';
}
export function renderAchievements(){
  const list=document.getElementById('achList'); if(!list) return; list.innerHTML='<p style="font-size:12px;color:var(--muted)">50 níveis = 78k XP = 1 ano</p>';
}

export function setTxType(t, el){ state.app.txType=t; document.querySelectorAll('#overlayTx .pill').forEach(b=>b.classList.remove('active')); el.classList.add('active'); }
export function filterTx(t, el){ state.app.txFilter=t; document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active')); if(el) el.classList.add('active'); renderTx(); }
export function openTxModal(){ const d=document.getElementById('txDate'); if(d) d.value=todayStr(); document.getElementById('overlayTx')?.classList.add('open'); }
export function saveTx(){
  const a=parseFloat(document.getElementById('txAmount')?.value);
  if(!a){ toast('Valor inválido','⚠️'); return; }
  const cat=document.getElementById('txCategoryCustom')?.value||'Outros';
  const date=document.getElementById('txDate')?.value||todayStr();
  const desc=document.getElementById('txDesc')?.value||cat;
  state.tx.push({id:'t_'+Date.now(),type:state.app.txType||'expense',amount:a,category:cat,date,desc,createdAt:new Date().toISOString()});
  saveState(); closeModal('overlayTx'); addXP(10,'Transação'); renderCurrentPage(); trySyncAll(); toast('Transação salva','💰');
}
export function openHabitModal(){ document.getElementById('overlayHabit')?.classList.add('open'); }
export function saveHabit(){
  const name=document.getElementById('habitName')?.value.trim();
  if(!name){ toast('Nome obrigatório','⚠️'); return; }
  const icon=document.getElementById('habitIcon')?.value||'⭐';
  state.habits.push({id:'h_'+Date.now(),name,icon,color:'#10B981',goal:1,streak:0,history:{},createdAt:new Date().toISOString()});
  saveState(); closeModal('overlayHabit'); renderCurrentPage(); toast('Hábito criado','◍'); trySyncAll();
}
export function toggleHabit(id){
  const h=state.habits.find(x=>x.id===id); if(!h) return;
  const today=todayStr(); if(!h.history) h.history={};
  if(h.history[today]){ delete h.history[today]; h.streak=Math.max(0,h.streak-1); }else{ h.history[today]=true; h.streak++; addXP(20,'Hábito'); }
  saveState(); renderCurrentPage(); trySyncAll();
}
export function editHabit(id){ const h=state.habits.find(x=>x.id===id); if(!h) return; const n=prompt('Novo nome',h.name); if(n){ h.name=n; saveState(); renderHabits(); } }
export function deleteHabit(id){ if(!confirm('Remover?')) return; state.habits=state.habits.filter(h=>h.id!==id); saveState(); renderCurrentPage(); }
export function openMoodModal(){ document.getElementById('overlayMood')?.classList.add('open'); }
export function pickMood(l){ tempMood=l; document.querySelectorAll('#overlayMood .mood-opt').forEach((el,i)=>{ el.classList.toggle('active', i+1===l); }); }
export function quickMood(l){ tempMood=l; confirmMood(); }
export function confirmMood(){
  const lvl=tempMood||3; const today=todayStr();
  let ex=state.moods.find(m=>m.date===today);
  if(ex) ex.level=lvl; else state.moods.unshift({date:today,level:lvl,note:''});
  saveState(); closeModal('overlayMood'); renderCurrentPage(); addXP(15,'Humor'); trySyncAll(); toast('Humor salvo','☺');
}
export function saveMoodNote(){ confirmMood(); }
export function openGoalModal(){ document.getElementById('overlayGoal')?.classList.add('open'); }
export function saveGoal(){
  const t=document.getElementById('goalTitle')?.value.trim(); if(!t){ toast('Título obrigatório','⚠️'); return; }
  const tg=parseFloat(document.getElementById('goalTarget')?.value)||1000;
  state.goals.push({id:'g_'+Date.now(),title:t,type:'financeira',target:tg,current:0,deadline:new Date(Date.now()+30*86400000).toISOString().slice(0,10)});
  saveState(); closeModal('overlayGoal'); renderCurrentPage(); toast('Meta criada','◎');
}
export function addGoalProgress(id,p){ const g=state.goals.find(x=>x.id===id); if(!g) return; g.current=Math.min(g.target,g.current+g.target*p/100); saveState(); renderGoals(); }
export function deleteGoal(id){ state.goals=state.goals.filter(g=>g.id!==id); saveState(); renderGoals(); }
export function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); }
export function openQuickAdd(){ document.getElementById('overlayQuick')?.classList.add('open'); }
export function openPremium(){ document.getElementById('overlayPremium')?.classList.add('open'); }
export function activatePremium(){ state.app.premium=true; state.user.premium=true; state.profile.premium=true; saveState(); trySyncAll(); closeModal('overlayPremium'); toast('Premium ativado','★'); renderCurrentPage(); }
export function regenerateAI(){ toast('IA reanalisando...','✦'); setTimeout(()=>renderCurrentPage(),600); }

export function initApp(){
  // Carrega só essencial primeiro para não travar
  loadState();
  // NÃO chama ensureSeed nem loadPage aqui - espera auth
  const forced=localStorage.getItem('vidaplus_forced_theme');
  document.documentElement.setAttribute('data-theme', forced||state.settings.theme||'light');

  // Escuta auth - SÓ DEPOIS que souber se está logado carrega o resto
  initAuthListener((user)=>{
    if(user){
      // Logado: garante dados, puxa do Firebase, depois carrega página
      ensureSeed();
      pullFromFirebase().then(()=>{
        const params=new URLSearchParams(location.search);
        const page=params.get('page')||params.get('id')||'dashboard';
        console.log('[Init] Logado, carregando página:', page);
        loadPage(page);
      });
    }else{
      console.log('[Init] Não logado, mostrando login, sem carregar páginas');
      // Não carrega páginas, só mostra login
      const home=document.getElementById('homeView');
      if(home) home.style.display='block';
      const pc=document.getElementById('pageContainer');
      if(pc){ pc.style.display='none'; pc.innerHTML=''; }
    }
  });

  document.querySelectorAll('.overlay').forEach(el=>{ el.addEventListener('click',e=>{ if(e.target===el) el.classList.remove('open'); }); });

  // NÃO carrega página aqui para evitar conflito - espera auth listener
  console.log('[Vida+ AI v6 FINAL] Iniciando só essencial, aguardando auth...');
  const homeEssential=document.getElementById('homeEssential');
  if(homeEssential) homeEssential.style.display='block';
}
if(typeof window!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
}
