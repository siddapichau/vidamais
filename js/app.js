// Vida+ AI - APP v4 - Router Pages + Perfil Completo + Moedas + 50 níveis + PT-BR 100%
// Index é página principal, carrega páginas via fetch (iframe inteligente sem iframe aparente)
// URL: index.html?page=habitos ou ?id=habitos.html ou ?p=habitos

import { state, themes, currencies, levelTable, defaultCategories, moodMap, fmtMoney, fmtDate, todayStr, getLevel, getNextLevel, getLevelProgress, loadState, saveState, addXP, calcStreak, calcHabitRate, calcLifeScore, generateInsights, seedHabits, ensureSeed, applyRemoteData, setUid } from './core.js';
import { VidaFirebase, FIREBASE_DB_URL, auth } from './firebase.js';
import { initAuthListener, loginEmail as fbLoginEmail, signupEmail as fbSignupEmail, loginGoogle as fbLoginGoogle, logout as fbLogout, resetPassword, updateUserProfileData, changePassword as fbChangePassword, loadFullUser, getUid, ADMIN_EMAIL } from './firebase.js';

let tempMood = null;
let currentPage = 'dashboard';

// Expose globals para inline onclick
window.toast = toast;
window.loadPage = loadPage;
window.switchView = loadPage; // compat
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
window.seedHabits = ()=>{ seedHabits(); renderAll(); toast('Hábitos restaurados • Firebase','◍'); };
window.exportFin = ()=>{ toast('Gerando PDF...','📄'); setTimeout(()=>window.print(),400); };
window.exportReport = ()=>{ toast('Gerando relatório IA...','✦'); setTimeout(()=>window.print(),400); };
window.activatePremium = activatePremium;
window.regenerateAI = regenerateAI;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleGoogleLogin = handleGoogleLogin;
window.handleLogout = handleLogout;
window.handleReset = handleReset;
window.openAuthModal = openAuthModal;
window.saveProfile = saveProfile;
window.saveCompleteProfile = saveCompleteProfile;
window.changePasswordProfile = changePasswordProfile;
window.changeCurrency = changeCurrency;
window.previewCurrency = previewCurrency;
window.previewTheme = applyThemePreview;
window.saveCompleteProfile = saveCompleteProfile;

function toast(msg, ico='✦'){
  const stack = document.getElementById('toasts');
  if(!stack) return;
  const el = document.createElement('div');
  el.className='toast';
  el.innerHTML=`<div class="t-ico">${ico}</div><div>${msg}</div>`;
  stack.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=>el.remove(),300); }, 4000);
}
function confettiLevel(lvl){
  const overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:999;display:grid;place-items:center';
  overlay.innerHTML=`<div style="background:var(--card);padding:22px 26px;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);border:1px solid var(--border);text-align:center;animation:pop .5s cubic-bezier(.34,1.56,.64,1)"><div style="font-size:48px">${lvl.icon||'🎉'}</div><b style="font-size:18px;display:block;margin-top:8px">Nível ${lvl.level} • ${lvl.name}</b><p style="color:var(--muted);font-size:12px;margin-top:6px">${lvl.reward}</p></div>`;
  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),3000);
}

// ===== SYNC =====
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
    if(el) el.textContent=`● Sincronizado Firebase ✔ • ${state.settings.currency}`;
  }catch(e){
    const el=document.getElementById('syncStatus');
    if(el) el.textContent='● Erro sync: '+e.message;
  }finally{_syncing=false;}
}
async function pullFromFirebase(){
  const uid=getUid();
  if(uid==='default_user') return;
  try{
    const remote=await loadFullUser(uid);
    if(remote){
      const changed=applyRemoteData(remote);
      if(changed){ toast('Dados da nuvem puxados ☁️','☁️'); renderCurrentPage(); }
    }
  }catch(e){}
}

// Eventos
window.addEventListener('vidaplus:xp', (e)=>{
  const {amount, reason, leveledUp, curr}=e.detail;
  updateXPUI();
  if(leveledUp){ confettiLevel(curr); toast(`Nível ${curr.level} • ${curr.name} desbloqueado! Recompensa: ${curr.reward}`,'🎉'); }
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
    // atualiza profile local com dados Auth
    state.profile.email=user.email;
    if(user.displayName && !state.profile.firstName){
      const parts=user.displayName.split(' ');
      state.profile.firstName=parts[0];
      state.profile.lastName=parts.slice(1).join(' ');
      state.profile.name=user.displayName;
    }
    if(user.photoURL) state.profile.photo=user.photoURL;
    state.user.name=state.profile.firstName || state.profile.name || user.email.split('@')[0];
    saveState();
    if(authOverlay) authOverlay.classList.remove('open');
    updateHeader();
    await pullFromFirebase();
    // Verifica perfil incompleto SÓ se faltar nome/sobrenome (não trava se faltar celular)
    const missingName = !state.profile.firstName || !state.profile.lastName;
    if(missingName){
      const cp=document.getElementById('overlayCompleteProfile');
      if(cp){
        document.getElementById('completeFirstName').value=state.profile.firstName||'';
        document.getElementById('completeLastName').value=state.profile.lastName||'';
        document.getElementById('completePhone').value=state.profile.phone||'';
        document.getElementById('completeBirth').value=state.profile.birthDate||'';
        document.getElementById('completeCurrency').value=state.profile.currency||state.settings.currency||'BRL';
        cp.classList.add('open');
      }
    }
    renderCurrentPage();
    toast(`Bem-vindo, ${state.profile.firstName||state.user.name}! • ${state.settings.currency}`,'👋');
  }else{
    setUid('default_user');
    updateHeader();
    openAuthModal();
  }
});

// AUTH
export function openAuthModal(){ const el=document.getElementById('overlayAuth'); if(el) el.classList.add('open'); showAuthError(''); }
export function switchAuthMode(mode){
  const loginView=document.getElementById('authLoginView');
  const signupView=document.getElementById('authSignupView');
  const tabLogin=document.getElementById('tabLogin');
  const tabSignup=document.getElementById('tabSignup');
  const title=document.getElementById('authTitle');
  const sub=document.getElementById('authSubtitle');
  if(mode==='signup'){
    if(loginView) loginView.style.display='none';
    if(signupView) signupView.style.display='grid';
    if(tabLogin) tabLogin.classList.remove('active');
    if(tabSignup) tabSignup.classList.add('active');
    if(title) title.textContent='Criar conta no Vida+ AI';
    if(sub) sub.textContent='Cadastro completo, mas login futuro só com Google ou e-mail/senha';
  }else{
    if(loginView) loginView.style.display='grid';
    if(signupView) signupView.style.display='none';
    if(tabLogin) tabLogin.classList.add('active');
    if(tabSignup) tabSignup.classList.remove('active');
    if(title) title.textContent='Entrar no Vida+ AI';
    if(sub) sub.textContent='Use Google ou e-mail e senha • 100% PT-BR';
  }
  showAuthError('');
}
function showAuthError(msg){
  const el=document.getElementById('authError');
  if(!el) return;
  if(!msg){ el.style.display='none'; el.textContent=''; return; }
  el.style.display='block';
  el.textContent=msg;
}
window.switchAuthMode=switchAuthMode;

export async function handleLogin(){
  const email=document.getElementById('authEmail').value.trim();
  const pass=document.getElementById('authPass').value;
  if(!email||!pass){ showAuthError('Preencha e-mail e senha'); toast('Preencha e-mail e senha','⚠️'); return; }
  const btn=document.getElementById('authBtnLogin');
  try{
    if(btn) btn.textContent='Entrando...';
    btn.disabled=true;
    showAuthError('');
    await fbLoginEmail(email,pass);
    toast('Login realizado com sucesso! Bem-vindo 👋','✓');
    // modal fecha via evento auth
  }catch(e){
    console.error(e);
    let msg=e.message;
    if(msg.includes('invalid-credential')||msg.includes('wrong-password')||msg.includes('user-not-found')) msg='E-mail ou senha incorretos. Verifique ou crie conta.';
    if(msg.includes('too-many-requests')) msg='Muitas tentativas. Aguarde ou redefina senha.';
    showAuthError(msg);
    toast('Erro login: '+msg,'⚠️');
  }finally{
    if(btn){ btn.textContent='Entrar com e-mail'; btn.disabled=false; }
  }
}
export async function handleSignup(){
  // pega dados do view de cadastro
  const firstName=document.getElementById('authFirstName')?.value.trim() || '';
  const lastName=document.getElementById('authLastName')?.value.trim() || '';
  const phone=document.getElementById('authPhone')?.value.trim() || '';
  const email=document.getElementById('authEmailSignup')?.value.trim() || document.getElementById('authEmail')?.value.trim() || '';
  const pass=document.getElementById('authPassSignup')?.value || document.getElementById('authPass')?.value || '';
  const currency=document.getElementById('authCurrency')?.value || 'BRL';
  const fullName=`${firstName} ${lastName}`.trim() || firstName || email.split('@')[0];
  if(!firstName){ showAuthError('Informe seu nome'); toast('Nome obrigatório','⚠️'); return; }
  if(!email){ showAuthError('Informe e-mail'); return; }
  if(!pass || pass.length<6){ showAuthError('Senha mínimo 6 caracteres'); return; }
  const btn=document.getElementById('authBtnSignup');
  try{
    if(btn){ btn.textContent='Criando conta...'; btn.disabled=true; }
    showAuthError('');
    await fbSignupEmail(email, pass, fullName, {phone, birthDate:'', currency});
    state.profile.firstName=firstName;
    state.profile.lastName=lastName;
    state.profile.phone=phone;
    state.profile.currency=currency;
    state.settings.currency=currency;
    saveState();
    await trySyncAll();
    toast('Conta criada! Agora você pode entrar com Google ou e-mail/senha 🎉','🎉');
    switchAuthMode('login');
    // após criar, já está logado via auth listener, modal fechará
  }catch(e){
    console.error(e);
    let msg=e.message;
    if(msg.includes('email-already-in-use')) msg='Este e-mail já existe. Tente entrar ou use Google.';
    if(msg.includes('invalid-email')) msg='E-mail inválido.';
    if(msg.includes('weak-password')) msg='Senha fraca, use mínimo 6 caracteres.';
    showAuthError(msg);
    toast('Erro cadastro: '+msg,'⚠️');
  }finally{
    if(btn){ btn.textContent='Criar conta → depois login com e-mail/senha ou Google'; btn.disabled=false; }
  }
}
export async function handleGoogleLogin(){
  const btn=document.getElementById('authBtnGoogle');
  const btns=document.querySelectorAll('#authBtnGoogle');
  try{
    btns.forEach(b=>{ b.textContent='Conectando Google...'; b.disabled=true; });
    showAuthError('');
    await fbLoginGoogle();
    toast('Login Google OK! Bem-vindo 👋','✓');
    // modal fecha via auth listener
  }catch(e){
    console.error(e);
    let msg=e.message;
    if(msg.includes('popup-closed-by-user')) msg='Pop-up fechado. Tente novamente.';
    if(msg.includes('unauthorized-domain')) msg='Domínio não autorizado no Firebase. Adicione seu domínio em Firebase Console → Authentication → Authorized domains.';
    if(msg.includes('popup-blocked')) msg='Pop-up bloqueado pelo navegador. Permita pop-ups.';
    showAuthError(msg);
    toast('Google falhou: '+msg,'⚠️');
  }finally{
    btns.forEach(b=>{ b.textContent='Continuar com Google'; b.disabled=false; });
  }
}
export async function handleLogout(){ if(!confirm('Sair da conta? Seu progresso está salvo no Firebase.')) return; await fbLogout(); toast('Saída realizada • Dados salvos','👋'); openAuthModal(); }
export async function handleReset(){
  const emailLogin=document.getElementById('authEmail')?.value.trim() || '';
  const emailSignup=document.getElementById('authEmailSignup')?.value.trim() || '';
  const email = emailLogin || emailSignup;
  if(!email){ showAuthError('Digite seu e-mail no campo para receber reset'); toast('Digite e-mail','⚠️'); return; }
  try{
    showAuthError('');
    await resetPassword(email);
    toast('E-mail de recuperação enviado! Verifique caixa e spam 📧','📧');
    showAuthError('E-mail enviado para '+email+'. Verifique spam.');
  }catch(e){
    let msg=e.message;
    if(msg.includes('user-not-found')) msg='E-mail não encontrado. Crie conta.';
    showAuthError(msg);
    toast('Erro: '+msg,'⚠️');
  }
}
export async function saveCompleteProfile(){
  const firstName=document.getElementById('completeFirstName').value.trim();
  const lastName=document.getElementById('completeLastName').value.trim();
  const phone=document.getElementById('completePhone').value.trim();
  const birthDate=document.getElementById('completeBirth').value;
  const currency=document.getElementById('completeCurrency').value;
  if(!firstName){ toast('Nome obrigatório','⚠️'); return; }
  state.profile.firstName=firstName;
  state.profile.lastName=lastName;
  state.profile.phone=phone;
  state.profile.birthDate=birthDate;
  state.profile.currency=currency;
  state.profile.name=`${firstName} ${lastName}`.trim();
  state.settings.currency=currency;
  state.user.name=state.profile.name;
  saveState();
  const uid=getUid();
  if(uid!=='default_user'){
    await VidaFirebase.updateUserProfileData(uid, state.profile).catch(()=>{});
    await trySyncAll();
  }
  document.getElementById('overlayCompleteProfile').classList.remove('open');
  toast('Perfil completado e salvo no Firebase!','✓');
  updateHeader(); renderCurrentPage();
}
export async function saveProfile(){
  const firstName=document.getElementById('profileFirstName')?.value.trim()||'';
  const lastName=document.getElementById('profileLastName')?.value.trim()||'';
  const phone=document.getElementById('profilePhone')?.value.trim()||'';
  const birth=document.getElementById('profileBirth')?.value||'';
  const email=document.getElementById('profileEmail')?.value||'';
  const photo=document.getElementById('profilePhoto')?.value.trim()||'';
  const currency=document.getElementById('profileCurrency')?.value||'BRL';
  const theme=document.getElementById('profileTheme')?.value||'light';
  state.profile.firstName=firstName;
  state.profile.lastName=lastName;
  state.profile.phone=phone;
  state.profile.birthDate=birth;
  state.profile.photo=photo;
  state.profile.currency=currency;
  state.profile.name=`${firstName} ${lastName}`.trim()||state.profile.name;
  state.settings.currency=currency;
  state.settings.theme=theme;
  state.app.theme=theme;
  state.user.name=state.profile.name;
  document.documentElement.setAttribute('data-theme', theme);
  saveState();
  const uid=getUid();
  if(uid!=='default_user'){
    try{ await VidaFirebase.updateUserProfileData(uid, state.profile); await trySyncAll(); toast('Perfil salvo no Firebase!','✓'); }catch(e){ toast('Erro ao salvar: '+e.message,'⚠️'); }
  }else{ toast('Perfil salvo local (faça login para nuvem)','⚠️'); }
  updateHeader();
}
export async function changePasswordProfile(){
  const current=document.getElementById('currentPassword')?.value||'';
  const ne=document.getElementById('newPassword')?.value||'';
  if(!ne||ne.length<6){ toast('Nova senha mínimo 6','⚠️'); return; }
  try{ await fbChangePassword(current, ne); toast('Senha alterada no Firebase!','✓'); document.getElementById('currentPassword').value=''; document.getElementById('newPassword').value=''; }catch(e){ toast('Erro senha: '+e.message,'⚠️'); }
}
export function changeCurrency(code){
  state.settings.currency=code;
  state.profile.currency=code;
  saveState(); trySyncAll();
  const chip=document.getElementById('currencyLabelTop'); if(chip) chip.textContent=code;
  const badge=document.getElementById('currencyBadge'); if(badge) badge.textContent=code;
  const sel=document.getElementById('currencySelect'); if(sel) sel.value=code;
  const txCurr=document.getElementById('txCurrency'); if(txCurr) txCurr.textContent=code;
  renderCurrentPage();
  toast(`Moeda alterada para ${code} • ${currencies[code]?.label||''}`,'💱');
}
export function previewCurrency(code){
  const el=document.getElementById('profileCurrency'); if(el) el.value=code;
  // preview apenas visual, salvar depois
}
function applyThemePreview(id){
  if(!id) return;
  const t=themes[id];
  if(!t){ document.documentElement.setAttribute('data-theme','light'); return; }
  if(t.premium && !state.app.premium && !VidaFirebase.isCurrentUserAdmin()){ openPremium(); return; }
  document.documentElement.setAttribute('data-theme', id);
  state.settings.theme=id; state.app.theme=id; saveState(); trySyncAll();
}

// ROUTER PAGES COM FALLBACK 100% FUNCIONAL SE /pages/ NÃO EXISTIR (evita travamento no celular)
export async function loadPage(pageName){
  let name = pageName.replace('.html','').toLowerCase();
  const allowed = ['dashboard','financeiro','habitos','humor','metas','relatorios','conquistas','perfil'];
  if(!allowed.includes(name)) name='dashboard';
  currentPage=name;

  document.querySelectorAll('.nav button').forEach(b=>{ b.classList.toggle('active', b.dataset.page===name); });

  const url = new URL(window.location);
  url.searchParams.set('page', name);
  window.history.pushState({}, '', url);

  const container=document.getElementById('pageContainer');
  if(!container) return;
  container.innerHTML=`<div class="page-loader"><div style="font-size:32px">◍</div><b>Carregando ${name}...</b><p style="font-size:12px;color:var(--muted)">Se demorar, verifique se pasta /pages/ existe no GitHub</p><p style="font-size:10px;color:var(--muted-2)" id="loaderStatus">Tentando fetch pages/${name}.html...</p></div>`;

  try{
    const res = await fetch(`pages/${name}.html?embedded=true&_=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status} - pasta /pages/ não encontrada? Verifique GitHub.`);
    let html = await res.text();
    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if(match) html = match[1];
    html = html.replace(/<script[^>]*>[\s\S]*?location\.replace[\s\S]*?<\/script>/gi, '');
    if(!html.trim()) throw new Error("Página vazia");
    container.innerHTML = html;
    setTimeout(()=>{ renderCurrentPage(); }, 80);
  }catch(e){
    console.warn("[loadPage] falhou, usando fallback inline para não travar:", e.message);
    // FALLBACK INLINE - garante que app funciona mesmo sem /pages/
    container.innerHTML = getFallbackPageHTML(name);
    try{ renderCurrentPage(); }catch(err){ console.warn(err); }
    // Mostra aviso discreto
    setTimeout(()=>{ toast(`Pasta /pages/ não encontrada no GitHub (${e.message}). Usando fallback inline. Upe a pasta /pages/`,'⚠️'); }, 500);
  }
}

function getFallbackPageHTML(name){
  // Fallbacks completos inline para caso /pages/ não exista no GitHub
  if(name==='dashboard'){
    return `
      <div class="page-dashboard">
        <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px">
          <div><h1 class="display" style="font-size:34px;line-height:.9">Bom dia, <span id="userName">Usuário</span> 👋</h1><p style="color:var(--muted);margin-top:8px;font-size:13px">Você completou <b id="todayProgressPct">0%</b> • <span id="todayDate"></span></p></div>
          <button class="btn btn-primary btn-sm" onclick="appOpenMoodModal()">Registrar humor</button>
        </div>
        <div class="grid grid-4">
          <div class="card kpi"><div class="kpi-head"><span class="kpi-label">Saldo</span><span class="kpi-icon" style="background:#E0F2FE">💰</span></div><div class="kpi-value" id="balanceValue">R$ 0</div><div class="kpi-sub"><span class="badge badge-up" id="balanceTrend">+0%</span> <span id="balanceSub">0 transações</span></div><div style="height:44px;margin-top:6px"><canvas id="miniBalance"></canvas></div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-label">XP & Nível</span><span class="kpi-icon" style="background:#FEF3C7">⚡</span></div><div class="kpi-value"><span id="levelLabel">Nv 1</span> <small id="xpLabel">0 XP</small></div><div class="lvl-bar"><i id="xpBar" style="width:0%"></i></div><div class="lvl-nodes"><span id="xpFrom">0 XP</span><span id="xpTo">500 XP</span></div><div class="kpi-sub">Falta <b id="xpNext">500 XP</b></div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-label">Hábitos</span><span class="kpi-icon" style="background:#DCFCE7">✅</span></div><div class="kpi-value"><span id="habitsDone">0</span>/<span id="habitsTotal">0</span></div><div class="progress"><i id="habitsProgress" style="width:0%"></i></div><div class="kpi-sub" id="habitsMotivation">Comece!</div></div>
          <div class="card kpi"><div class="kpi-head"><span class="kpi-label">Humor</span><span class="kpi-icon" style="background:#F3E8FF" id="moodIcon">🙂</span></div><div class="kpi-value" id="moodLabel" style="font-size:20px">--</div><div class="kpi-sub" id="moodSub">Nenhum</div><div style="margin-top:8px;display:flex;gap:6px" id="moodWeekDots"></div></div>
        </div>
        <div class="grid grid-2" style="margin-top:16px">
          <div class="card"><b>Hábitos hoje</b><div id="todayHabits" style="display:grid;gap:10px;margin-top:12px"></div></div>
          <div class="card"><b>Insights IA</b><span class="badge" style="background:#EEF2FF;color:#4338CA" id="aiBadge">FREE</span><div id="aiInsights" style="display:grid;gap:10px;margin-top:12px"></div></div>
        </div>
        <div class="grid grid-2" style="margin-top:16px"><div class="card"><b>Fluxo semanal</b><div class="chart-box" style="margin-top:12px"><canvas id="weeklyFlow"></canvas></div></div><div class="card"><b>Gastos</b><div class="chart-box" style="margin-top:12px"><canvas id="categoryDonut"></canvas></div></div></div>
        <p style="font-size:11px;color:var(--muted);margin-top:12px;text-align:center">Fallback inline ativo porque pasta /pages/ não encontrada no GitHub. Upe a pasta /pages/ com 8 arquivos HTML para versão completa modular.</p>
      </div>`;
  }
  if(name==='financeiro'){
    return `<div class="card"><h3>Financeiro</h3><p style="font-size:13px;color:var(--muted)">Fallback inline - pasta /pages/ não encontrada. Upe pages/financeiro.html</p><div class="grid grid-3" style="margin-top:12px"><div class="card"><span class="kpi-label">Receitas</span><div class="kpi-value" id="incomeMonth">R$ 0</div></div><div class="card"><span class="kpi-label">Despesas</span><div class="kpi-value" id="expenseMonth">R$ 0</div></div><div class="card"><span class="kpi-label">Economia</span><div class="kpi-value" id="savingMonth">R$ 0</div></div></div><div id="txList" style="margin-top:12px"></div><div style="margin-top:12px"><button class="btn btn-primary" onclick="appOpenTxModal()">+ Transação</button></div></div>`;
  }
  if(name==='habitos'){
    return `<div class="card"><h3>Hábitos</h3><div id="habitStats" class="grid grid-4" style="margin-top:12px"></div><div id="habitsLibrary" style="display:grid;gap:10px;margin-top:12px"></div><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="appOpenHabitModal()">+ Novo hábito</button></div>`;
  }
  if(name==='perfil'){
    return `<div class="page-perfil"><div class="card"><h3>Perfil</h3><p style="font-size:12px;color:var(--muted)">Fallback - upa pages/perfil.html completo para edição completa nome/sobrenome/celular</p><div style="margin-top:12px"><b>Nome:</b> <span id="userName"></span><br><b>Email:</b> <span id="profileEmail"></span><br><b>Moeda:</b> <span id="currencyLabelTop"></span><br><b>Streak:</b> <span id="streakLabel"></span></div><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="appLoadPage('perfil')">Tentar recarregar perfil completo</button></div></div>`;
  }
  return `<div class="card" style="text-align:center;padding:30px"><b>Página ${name}</b><p style="font-size:13px;color:var(--muted);margin-top:8px">Pasta /pages/${name}.html não encontrada no GitHub Pages. Verifique se você upou a pasta /pages/ com todos os arquivos. Fallback ativo para não travar.</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="appLoadPage('dashboard')">Ir para Dashboard</button></div>`;
}

function renderCurrentPage(){
  // chama renders conforme página atual
  updateHeader();
  updateXPUI();
  // tenta renderizar tudo, se elementos não existirem, ignora
  try{ renderDashboard(); }catch{}
  try{ renderTx(); }catch{}
  try{ renderHabits(); }catch{}
  try{ renderMood(); }catch{}
  try{ renderGoals(); }catch{}
  try{ renderReports(); }catch{}
  try{ renderAchievements(); }catch{}
  try{ renderPerfil(); }catch{}
}

function renderPerfil(){
  const setVal = (id, val)=>{ const el=document.getElementById(id); if(el) el.value=val||''; };
  const setText = (id, txt)=>{ const el=document.getElementById(id); if(el) el.textContent=txt||''; };
  setVal('profileFirstName', state.profile.firstName);
  setVal('profileLastName', state.profile.lastName);
  setVal('profilePhone', state.profile.phone);
  setVal('profileBirth', state.profile.birthDate);
  setVal('profileEmail', state.profile.email);
  setVal('profilePhoto', state.profile.photo);
  setVal('profileCurrency', state.settings.currency);
  setVal('profileTheme', state.settings.theme);
  setText('profileUid', getUid());
  setText('uidShort', getUid().slice(0,8));
  setText('profileJoined', state.user.joined ? new Date(state.user.joined).toLocaleDateString('pt-BR') : '');
  const lvl=getLevel(state.user.xp||0);
  const prog=getLevelProgress(state.user.xp||0);
  setText('perfilLevel', `Nv ${lvl.level} • ${lvl.name}`);
  setText('perfilXp', `${state.user.xp||0} XP / ${prog.next.xp} XP • ${lvl.reward}`);
  const bar=document.getElementById('perfilBar'); if(bar) bar.style.width=prog.pct+'%';
  const premiumBadge=document.getElementById('perfilPremium'); if(premiumBadge){ premiumBadge.textContent= state.app.premium ? '★ PREMIUM' : 'FREE'; premiumBadge.style.background= state.app.premium ? '#DCFCE7' : 'var(--bg-2)'; premiumBadge.style.color= state.app.premium ? '#166534' : 'var(--muted)'; }
  const streakEl=document.getElementById('perfilStreak'); if(streakEl) streakEl.textContent=`Streak ${state.app.streak||0} dias`;
}

// RENDER FUNCTIONS (mantém compat com pages)
export function updateHeader(){
  const nameEl=document.getElementById('userName'); if(nameEl) nameEl.textContent=state.profile.firstName || state.user.name || 'Usuário';
  const sidebarName=document.getElementById('sidebarName'); if(sidebarName) sidebarName.textContent= state.profile.firstName ? `Olá, ${state.profile.firstName}` : 'Sua evolução';
  const avatar=document.getElementById('avatar'); if(avatar){
    const photo=state.profile.photo;
    if(photo){ avatar.innerHTML=`<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">`; avatar.style.background='transparent'; }
    else{ avatar.textContent=(state.profile.firstName||state.user.name||'U').charAt(0).toUpperCase(); avatar.style.background=''; }
  }
  const emailChip=document.getElementById('userEmailChip'); if(emailChip) emailChip.textContent= state.profile.email || 'offline • faça login';
  const currTop=document.getElementById('currencyLabelTop'); if(currTop) currTop.textContent=state.settings.currency||'BRL';
  const currBadge=document.getElementById('currencyBadge'); if(currBadge) currBadge.textContent=state.settings.currency||'BRL';
  const currChip=document.getElementById('currencyChip'); // placeholder
  const todayDate=document.getElementById('todayDate'); if(todayDate) todayDate.textContent=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const habitsDate=document.getElementById('habitsDate'); if(habitsDate) habitsDate.textContent=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
  calcStreak();
  const streakLabel=document.getElementById('streakLabel'); if(streakLabel) streakLabel.textContent=`Streak ${state.app.streak} dias`;
  const syncStatus=document.getElementById('syncStatus'); if(syncStatus){ const uid=getUid(); syncStatus.textContent= uid==='default_user' ? '● Offline (login requerido)' : `● Firebase ${state.settings.currency} • UID:${uid.slice(0,6)}`; }
  const premiumTag=document.getElementById('premiumTag'); if(premiumTag){ premiumTag.textContent= state.app.premium ? '★ PREMIUM • vidamaisai' : 'FREE • vidamaisai'; }
}
export function updateXPUI(){
  const xp=state.user.xp||0;
  const prog=getLevelProgress(xp);
  const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
  set('levelLabel', `Nv ${prog.curr.level}`); set('xpLabel', `${xp} XP`); set('xpFrom', `${prog.curr.xp} XP`); set('xpTo', `${prog.next.xp} XP`); set('xpNext', `${prog.next.xp-xp} XP`);
  const xpBar=document.getElementById('xpBar'); if(xpBar) xpBar.style.width=prog.pct+'%';
  set('achLevel', `Nv ${prog.curr.level} • ${prog.curr.name}`); set('achXp', `${xp} XP • ${prog.next.xp-xp} para Nv ${prog.next.level} • ${prog.next.reward}`);
  const achBar=document.getElementById('achBar'); if(achBar) achBar.style.width=prog.pct+'%';
  const lvlIcon=document.getElementById('levelIcon'); if(lvlIcon) lvlIcon.textContent=prog.curr.icon;
  const lvlReward=document.getElementById('levelReward'); if(lvlReward) lvlReward.textContent=`Próxima: ${prog.next.reward}`;
  const lvlRewardDetail=document.getElementById('levelRewardDetail'); if(lvlRewardDetail) lvlRewardDetail.textContent=`Recompensa atual: ${prog.curr.reward} • Próxima: ${prog.next.reward}`;
  // trilha
  const trail=document.getElementById('levelTrail'); if(trail){
    trail.innerHTML='';
    levelTable.forEach(l=>{
      const isCurrent = l.level===prog.curr.level;
      const isPast = l.xp <= xp;
      const div=document.createElement('div'); div.style.cssText=`display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid ${isCurrent? 'var(--primary)' : 'var(--border)'};background:${isPast? 'var(--bg-2)' : 'var(--card)'};${isCurrent?'font-weight:700':''}`;
      div.innerHTML=`<span style="font-size:16px">${l.icon}</span><div style="flex:1"><b style="font-size:12px">${l.level}. ${l.name} ${isCurrent?'• VOCÊ':''}</b><br><small style="font-size:10px;color:var(--muted)">${l.xp} XP • ${l.reward}</small></div><span style="font-size:10px" class="badge ${isPast?'badge-up':''}">${isPast?'FEITO': l.xp-xp +' XP'}</span>`;
      trail.appendChild(div);
    });
  }
  const proj50=document.getElementById('proj50'); if(proj50){
    const avgXpPerDay = 180; // média estimada
    const remaining = 78000 - xp;
    const days = Math.max(0, Math.ceil(remaining/avgXpPerDay));
    proj50.textContent = days>0 ? `~${days} dias (${(days/30).toFixed(1)} meses)` : 'Completo!';
  }
  const daysUsing=document.getElementById('daysUsing'); if(daysUsing){
    const joined = state.user.joined ? new Date(state.user.joined) : new Date();
    const diff = Math.floor((Date.now()-joined)/86400000);
    daysUsing.textContent = `${diff} dias`;
  }
}

// Dashboard render (usa fmtMoney com moeda)
export function renderDashboard(){
  const total=state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const balEl=document.getElementById('balanceValue'); if(balEl) balEl.textContent=fmtMoney(total, state.settings.currency);
  const monthTx=state.tx.filter(t=> new Date(t.date).getMonth()===new Date().getMonth());
  const balSub=document.getElementById('balanceSub'); if(balSub) balSub.textContent=`${monthTx.length} transações no mês • ${state.settings.currency}`;
  const prevMonth=state.tx.filter(t=>{const d=new Date(t.date);return d.getMonth()===new Date().getMonth()-1}).reduce((s,t)=>s+(t.type==='income'?t.amount:-t.amount),0);
  const trend=prevMonth? ((total-prevMonth)/Math.abs(prevMonth)*100):0;
  const trendEl=document.getElementById('balanceTrend'); if(trendEl){ trendEl.textContent=`${trend>=0?'+':''}${trend.toFixed(0)}%`; trendEl.className=`badge ${trend>=0?'badge-up':'badge-down'}`; }
  const today=todayStr(); let done=0; state.habits.forEach(h=>{ if(h.history && h.history[today]) done++; });
  const set=(id,t)=>{const el=document.getElementById(id); if(el) el.textContent=t;};
  set('habitsDone',done); set('habitsTotal',state.habits.length);
  const hp=document.getElementById('habitsProgress'); if(hp) hp.style.width= (state.habits.length? (done/state.habits.length*100):0)+'%';
  set('todayProgressPct', Math.round((state.habits.length? done/state.habits.length:0)*100)+'%');
  const mot=document.getElementById('habitsMotivation'); if(mot) mot.textContent = done===state.habits.length?'Dia perfeito! 🎉': done>=2?'Seguindo bem! Continue':'Vamos começar? +20 XP por hábito';
  const todMood=state.moods.find(m=>m.date===today);
  if(todMood){ const map=moodMap[todMood.level]; set('moodLabel', map.label); const mi=document.getElementById('moodIcon'); if(mi) mi.textContent=map.emoji; set('moodSub', todMood.note||'Registrado hoje'); }
  else{ set('moodLabel','--'); set('moodSub','Nenhum registro hoje'); const mi=document.getElementById('moodIcon'); if(mi) mi.textContent='🙂'; }
  const dots=document.getElementById('moodWeekDots'); if(dots){ dots.innerHTML=''; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const m=state.moods.find(x=>x.date===d); const dot=document.createElement('div'); dot.style.cssText=`width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:12px;background:${m?moodMap[m.level].color:'var(--bg-2)'};color:${m?'white':'var(--muted-2)'}`; dot.textContent=m?moodMap[m.level].emoji:'·'; dots.appendChild(dot); } }
  const list=document.getElementById('todayHabits'); if(list){ list.innerHTML=''; state.habits.slice(0,5).forEach(h=>{ const isDone=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${isDone?'done':''}" onclick="toggleHabit('${h.id}')">${isDone?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>${isDone?'Feito hoje • +20 XP':`${h.goal}x hoje`} • ${h.streak}d</span></div><span class="streak">🔥 ${h.streak}</span>`; list.appendChild(el); }); }
  const aiCont=document.getElementById('aiInsights'); if(aiCont){ aiCont.innerHTML=''; const isPrem=state.app.premium; generateInsights(isPrem).slice(0, isPrem? 5:3).forEach(ins=>{ const div=document.createElement('div'); div.className='insight'; if(ins.locked) div.style.opacity='.7'; div.innerHTML=`<div class="i-ico" style="background:${ins.color}">${ins.ico}</div><div><b>${ins.title} ${ins.locked?'🔒':''}</b><p>${ins.text}</p></div>`; aiCont.appendChild(div); }); }
  const aiBadge=document.getElementById('aiBadge'); if(aiBadge){ aiBadge.textContent= state.app.premium ? 'PREMIUM 7/7' : 'FREE 3/7 • Premium total'; }
  drawMiniBalance(); drawWeeklyFlow(); drawCategoryDonut();
}
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
  const expByCat=state.tx.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{}); let entries=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).slice(0,5); if(!entries.length) entries=[['Sem dados',1]]; const total=entries.reduce((s,e)=>s+e[1],0); const colors=['#123C7A','#6366F1','#06B6D4','#10B981','#F59E0B']; let ang=-Math.PI/2; entries.forEach(([cat,val],i)=>{ const slice=(val/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+slice); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill(); ang+=slice; }); ctx.beginPath(); ctx.arc(cx,cy,r*0.6,0,Math.PI*2); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#fff'; ctx.fill(); ctx.fillStyle='#0F172A'; ctx.textAlign='center'; ctx.font='800 16px Fraunces'; ctx.fillText(entries.length? fmtMoney(total, state.settings.currency):'R$ 0',cx,cy+4);
}

// Finance
export function renderTx(){
  const catCont=document.getElementById('txCategories'); if(catCont){ catCont.innerHTML=''; const list=defaultCategories[state.app.txType||'expense']; list.forEach(c=>{ const b=document.createElement('button'); b.className='pill'; b.textContent=c; b.onclick=()=>{ document.querySelectorAll('#txCategories .pill').forEach(x=>x.classList.remove('active')); b.classList.add('active'); document.getElementById('txCategoryCustom').value=c; }; catCont.appendChild(b); }); }
  const filter=state.app.txFilter||'all'; const searchEl=document.getElementById('txSearch'); const search=searchEl? searchEl.value.toLowerCase():''; let filtered=[...state.tx].sort((a,b)=> new Date(b.date)-new Date(a.date)); if(filter!=='all') filtered=filtered.filter(t=>t.type===filter); if(search) filtered=filtered.filter(t=>t.category.toLowerCase().includes(search)||(t.desc||'').toLowerCase().includes(search)); const cont=document.getElementById('txList'); if(!cont) return; cont.innerHTML=''; if(!filtered.length){ cont.innerHTML='<p style="color:var(--muted);font-size:13px;padding:18px;text-align:center">Nenhuma transação</p>'; } filtered.forEach(t=>{ const div=document.createElement('div'); div.className='tx'; const isInc=t.type==='income'; div.innerHTML=`<div class="tx-ico" style="background:${isInc?'#DCFCE7':'#FEE2E2'}">${isInc?'↑':'↓'}</div><div><b>${t.desc||t.category}</b><br><span>${t.category} • ${fmtDate(t.date)}</span></div><div class="tx-amt" style="color:${isInc?'var(--emerald)':'var(--rose)'}">${isInc?'+':''}${fmtMoney(t.amount, state.settings.currency)}</div>`; cont.appendChild(div); });
  const monthInc=state.tx.filter(t=>t.type==='income' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0); const monthExp=state.tx.filter(t=>t.type==='expense' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);
  const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;}; set('incomeMonth', fmtMoney(monthInc, state.settings.currency)); set('expenseMonth', fmtMoney(monthExp, state.settings.currency)); set('savingMonth', fmtMoney(monthInc-monthExp, state.settings.currency)); set('savingPct', monthExp? Math.round(((monthInc-monthExp)/monthInc)*100)+'%':'0%');
  set('currencyLabel', state.settings.currency); const currSel=document.getElementById('currencySelect'); if(currSel) currSel.value=state.settings.currency;
  const topExp = Object.entries(state.tx.filter(t=>t.type==='expense').reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{})).sort((a,b)=>b[1]-a[1])[0]; if(topExp){ const ti=document.getElementById('finInsightTitle'); if(ti) ti.textContent=`Maior gasto: ${topExp[0]}`; const te=document.getElementById('finInsightText'); if(te) te.textContent=`${fmtMoney(topExp[1], state.settings.currency)} acumulado. Limite ${fmtMoney(topExp[1]*0.8, state.settings.currency)}.`; }
  drawFinCategory(); drawFinLine();
}
function drawFinCategory(){ const canvas=document.getElementById('finCategory'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; const cx=w/2,cy=h/2-10, r=Math.min(w,h)/2-16; ctx.clearRect(0,0,w,h); const expByCat=state.tx.filter(t=>t.type==='expense' && new Date(t.date).getMonth()===new Date().getMonth()).reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{}); let entries=Object.entries(expByCat).sort((a,b)=>b[1]-a[1]); if(!entries.length) entries=[['Sem dados',1]]; const total=entries.reduce((s,e)=>s+e[1],0); const colors=['#123C7A','#6366F1','#06B6D4','#10B981','#F59E0B','#F43F5E','#8B5CF6']; let ang=-Math.PI/2; entries.forEach(([cat,val],i)=>{ const slice=(val/total)*Math.PI*2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,ang,ang+slice); ctx.closePath(); ctx.fillStyle=colors[i%colors.length]; ctx.fill(); ang+=slice; }); ctx.beginPath(); ctx.arc(cx,cy,r*0.58,0,Math.PI*2); ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--card').trim()||'#fff'; ctx.fill(); }
function drawFinLine(){ const canvas=document.getElementById('finLine'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h); const days=[]; let bal=0; const sorted=[...state.tx].sort((a,b)=> new Date(a.date)-new Date(b.date)); for(let i=29;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const dayTx=sorted.filter(t=>t.date===d); const net=dayTx.reduce((s,t)=> s + (t.type==='income'?t.amount:-t.amount),0); bal+=net; days.push(bal);} if(days.length<2) return; const min=Math.min(...days),max=Math.max(...days); ctx.beginPath(); ctx.strokeStyle='#123C7A'; ctx.lineWidth=2.5; days.forEach((v,i)=>{ const x=(i/(days.length-1))*w; const y=h - ((v-min)/(max-min||1))* (h-20) -10; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke(); }
export function setTxType(type,el){ state.app.txType=type; document.querySelectorAll('#overlayTx .pill[data-type]').forEach(b=>b.classList.remove('active')); el.classList.add('active'); saveState(); renderTx(); }
export function filterTx(type,el){ state.app.txFilter=type; document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active')); el.classList.add('active'); renderTx(); }
export function openTxModal(){ const d=document.getElementById('txDate'); if(d) d.value=todayStr(); const a=document.getElementById('txAmount'); if(a) a.value=''; const de=document.getElementById('txDesc'); if(de) de.value=''; const cc=document.getElementById('txCategoryCustom'); if(cc) cc.value=''; renderTx(); document.getElementById('overlayTx').classList.add('open'); const tc=document.getElementById('txCurrency'); if(tc) tc.textContent=state.settings.currency; }
export function saveTx(){
  const amount=parseFloat(document.getElementById('txAmount').value); if(!amount||amount<=0){ toast('Valor inválido','⚠️'); return; }
  const cat=document.getElementById('txCategoryCustom').value || (defaultCategories[state.app.txType][0]); const date=document.getElementById('txDate').value || todayStr(); const desc=document.getElementById('txDesc').value;
  state.tx.push({id:'t_'+Date.now(),type:state.app.txType||'expense',amount,category:cat,date,desc:desc||cat,createdAt:new Date().toISOString()});
  saveState(); closeModal('overlayTx'); addXP(10,'Transação'); renderCurrentPage(); toast(`Transação ${fmtMoney(amount, state.settings.currency)} salva • Firebase`,'💰'); trySyncAll();
}

// Habits
export function renderHabits(){
  const lib=document.getElementById('habitsLibrary'); if(lib){ lib.innerHTML=''; state.habits.forEach(h=>{ const today=todayStr(); const done=!!(h.history && h.history[today]); const el=document.createElement('div'); el.className='habit'; el.innerHTML=`<div class="habit-check ${done?'done':''}" style="${done?`background:${h.color};border-color:${h.color}`:`border-color:${h.color}40;color:${h.color}`}" onclick="toggleHabit('${h.id}')">${done?'✓':h.icon}</div><div class="habit-meta"><b>${h.name}</b><span>Meta: ${h.goal}x/dia • Streak ${h.streak} dias</span></div><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm" onclick="editHabit('${h.id}')">Editar</button><button class="btn btn-ghost btn-sm" onclick="deleteHabit('${h.id}')">✕</button></div>`; lib.appendChild(el); }); }
  const stats=document.getElementById('habitStats'); if(stats){ stats.innerHTML=''; const totalDone = Object.values(state.habits.reduce((a,h)=>{ Object.keys(h.history||{}).forEach(d=>{ if(h.history[d]) a[d]=(a[d]||0)+1}); return a; },{})).reduce((s,v)=>s+v,0); const bestStreak=Math.max(0,...state.habits.map(h=>h.streak)); const today=todayStr(); const todayDone=state.habits.filter(h=>h.history && h.history[today]).length; [{label:'Feitos hoje',value:`${todayDone}/${state.habits.length}`,sub:`${Math.round((todayDone/(state.habits.length||1))*100)}%`},{label:'Total feitos',value:totalDone,sub:'Desde início'},{label:'Maior streak',value:`${bestStreak} dias`,sub:'Recorde'},{label:'Taxa semanal',value:`${Math.round(calcHabitRate()*100)}%`,sub:'7 dias'}].forEach(k=>{ const div=document.createElement('div'); div.className='card'; div.innerHTML=`<span class="kpi-label">${k.label}</span><div class="kpi-value" style="font-size:20px;margin-top:6px">${k.value}</div><div class="kpi-sub">${k.sub}</div>`; stats.appendChild(div); }); }
  const heat=document.getElementById('habitHeatmap'); if(heat){ heat.innerHTML=''; for(let i=6;i>=0;i--){ const d=new Date(Date.now()-i*86400000); const str=d.toISOString().slice(0,10); const dayCount=state.habits.filter(h=>h.history && h.history[str]).length; const pct=state.habits.length? dayCount/state.habits.length:0; const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:10px'; row.innerHTML=`<span style="width:64px;font-size:11px;font-weight:600">${d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit'})}</span><div class="progress" style="flex:1;height:18px;border-radius:10px"><i style="width:${pct*100}%;background:${pct>0.7?'#10B981':pct>0.4?'#F59E0B':'#E2E8F0'}"></i></div><span style="font-size:11px;font-weight:700">${dayCount}/${state.habits.length}</span>`; heat.appendChild(row);} }
}
export function toggleHabit(id){ const h=state.habits.find(x=>x.id===id); if(!h) return; const today=todayStr(); const wasDone=!!(h.history && h.history[today]); if(!h.history) h.history={}; if(wasDone){ delete h.history[today]; h.streak=Math.max(0,h.streak-1); toast('Hábito desmarcado','◍'); }else{ h.history[today]=true; h.streak++; addXP(20,`Hábito: ${h.name}`); if(h.streak===7) addXP(50,'7 dias!'); } saveState(); renderCurrentPage(); trySyncAll(); }
export function openHabitModal(){ document.getElementById('habitName').value=''; document.getElementById('habitIcon').value=''; document.getElementById('habitGoal').value=1; document.getElementById('overlayHabit').classList.add('open'); }
export function saveHabit(){ const name=document.getElementById('habitName').value.trim(); if(!name){ toast('Nome obrigatório','⚠️'); return; } const icon=document.getElementById('habitIcon').value||'⭐'; const goal=parseInt(document.getElementById('habitGoal').value)||1; const color=document.getElementById('habitColor').value; state.habits.push({id:'h_'+Date.now(),name,icon,color,goal,streak:0,history:{},createdAt:new Date().toISOString()}); saveState(); closeModal('overlayHabit'); addXP(15,'Novo hábito'); renderCurrentPage(); toast('Hábito criado!','◍'); trySyncAll(); }
export function editHabit(id){ const h=state.habits.find(x=>x.id===id); if(!h) return; const name=prompt('Novo nome:',h.name); if(name){ h.name=name; saveState(); renderHabits(); trySyncAll(); } }
export function deleteHabit(id){ if(!confirm('Remover hábito?')) return; state.habits=state.habits.filter(h=>h.id!==id); saveState(); renderCurrentPage(); trySyncAll(); }

// Mood
export function renderMood(){
  const cal=document.getElementById('moodCalendar'); if(cal){ cal.innerHTML=''; ['D','S','T','Q','Q','S','S'].forEach(l=>{ const d=document.createElement('div'); d.className='head'; d.textContent=l; cal.appendChild(d); }); const now=new Date(); const year=now.getFullYear(),month=now.getMonth(); const first=new Date(year,month,1).getDay(); const days=new Date(year,month+1,0).getDate(); for(let i=0;i<first;i++){ const e=document.createElement('div'); cal.appendChild(e);} for(let d=1;d<=days;d++){ const date=new Date(year,month,d).toISOString().slice(0,10); const mood=state.moods.find(m=>m.date===date); const el=document.createElement('div'); el.className='day'+(mood?' has-mood':''); if(mood){ el.style.background=moodMap[mood.level].color; el.textContent=moodMap[mood.level].emoji; }else el.textContent=d; cal.appendChild(el);} }
  drawMoodChart();
  const patterns=document.getElementById('moodPatterns'); if(patterns){ patterns.innerHTML=''; generateInsights(state.app.premium).slice(0,2).forEach(i=>{ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<div class="i-ico" style="background:${i.color}">${i.ico}</div><div><b>${i.title} ${i.locked?'🔒':''}</b><p>${i.text}</p></div>`; patterns.appendChild(div); }); }
  document.querySelectorAll('.mood-opt[data-mood]').forEach(el=>{ const m=parseInt(el.dataset.mood); const todayM=state.moods.find(x=>x.date===todayStr()); el.classList.toggle('active', !!(todayM && todayM.level===m)); });
}
function drawMoodChart(){ const canvas=document.getElementById('moodChart'); if(!canvas) return; const ctx=canvas.getContext('2d'); const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect(); canvas.width=rect.width*dpr; canvas.height=rect.height*dpr; ctx.scale(dpr,dpr); const w=rect.width,h=rect.height; ctx.clearRect(0,0,w,h); const pts=[]; for(let i=13;i>=0;i--){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); const m=state.moods.find(x=>x.date===d); pts.push(m?m.level:null);} const valid=pts.filter(p=>p!==null); if(!valid.length){ ctx.fillStyle='#94A3B8'; ctx.font='12px Plus Jakarta Sans'; ctx.textAlign='center'; ctx.fillText('Registre humor',w/2,h/2); return;} ctx.beginPath(); ctx.strokeStyle='#6366F1'; ctx.lineWidth=2.5; let started=false; pts.forEach((v,i)=>{ if(v===null) return; const x=(i/(pts.length-1))*w; const y=h - (v/5)*(h-20) -10; if(!started){ ctx.moveTo(x,y); started=true;} else ctx.lineTo(x,y); }); ctx.stroke(); pts.forEach((v,i)=>{ if(v===null) return; const x=(i/(pts.length-1))*w; const y=h - (v/5)*(h-20) -10; ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle='#6366F1'; ctx.fill(); ctx.fillStyle='white'; ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }); }
export function pickMood(lvl){ tempMood=lvl; document.querySelectorAll('#overlayMood .mood-opt').forEach((el,idx)=>{ el.classList.toggle('active', idx+1===lvl); }); }
export function quickMood(lvl){ tempMood=lvl; confirmMood(); }
export function openMoodModal(){ tempMood=null; const note=document.getElementById('moodNoteModal'); if(note) note.value=''; document.querySelectorAll('#overlayMood .mood-opt').forEach(el=>el.classList.remove('active')); document.getElementById('overlayMood').classList.add('open'); }
export function confirmMood(){
  const noteModal=document.getElementById('moodNoteModal'); const noteEl=document.getElementById('moodNote'); const note=(noteModal && noteModal.value) || (noteEl && noteEl.value) || '';
  if(!tempMood && !note){ toast('Selecione humor','🙂'); return; }
  const lvl=tempMood || 3; const today=todayStr(); let existing=state.moods.find(m=>m.date===today); if(existing){ existing.level=lvl; existing.note=note; } else state.moods.unshift({date:today,level:lvl,note});
  saveState(); closeModal('overlayMood'); if(noteEl) noteEl.value=''; addXP(15,'Humor'); renderCurrentPage(); toast(`Humor ${moodMap[lvl].label} salvo • Firebase`,'☺'); trySyncAll();
}
export function saveMoodNote(){ const note=document.getElementById('moodNote'); if(!note || (!note.value && !tempMood)){ toast('Escolha emoji ou escreva','🙂'); return;} tempMood=tempMood||3; confirmMood(); }

// Goals
export function renderGoals(){
  const grid=document.getElementById('goalsGrid'); if(!grid) return; grid.innerHTML=''; state.goals.forEach(g=>{ const pct=Math.min(100, Math.max(0, (g.current/g.target)*100)); const div=document.createElement('div'); div.className='card'; div.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="badge" style="background:var(--bg-2);color:var(--muted)">${g.type.toUpperCase()}</span><button class="btn btn-ghost btn-sm" onclick="deleteGoal('${g.id}')">✕</button></div><b style="display:block;margin:12px 0 4px;font-size:16px">${g.title}</b><p style="font-size:12px;color:var(--muted)">Prazo: ${fmtDate(g.deadline)} • ${Math.round(pct)}%</p><div class="progress" style="margin:14px 0"><i style="width:${pct}%;background:linear-gradient(90deg, var(--primary), var(--violet))"></i></div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="font-weight:700">${fmtMoney(g.current, state.settings.currency)} / ${fmtMoney(g.target, state.settings.currency)}</span><span style="color:var(--muted)">Falta ${fmtMoney(g.target-g.current, state.settings.currency)}</span></div><div style="display:flex;gap:8px;margin-top:14px"><button class="btn btn-primary btn-sm" style="flex:1" onclick="addGoalProgress('${g.id}',10)">+10%</button><button class="btn btn-ghost btn-sm" style="flex:1" onclick="addGoalProgress('${g.id}',25)">+25%</button></div>`; grid.appendChild(div); }); if(!state.goals.length) grid.innerHTML='<p style="color:var(--muted);grid-column:1/-1;text-align:center;padding:20px">Nenhuma meta</p>';
}
export function openGoalModal(){ const t=document.getElementById('goalTitle'); if(t) t.value=''; const ta=document.getElementById('goalTarget'); if(ta) ta.value=''; const dl=document.getElementById('goalDeadline'); if(dl) dl.value=new Date(Date.now()+30*86400000).toISOString().slice(0,10); document.getElementById('overlayGoal').classList.add('open'); }
export function saveGoal(){ const titleEl=document.getElementById('goalTitle'); const title=titleEl? titleEl.value.trim():''; const targetEl=document.getElementById('goalTarget'); const target=parseFloat(targetEl? targetEl.value:0)||1000; const typeEl=document.getElementById('goalType'); const type=typeEl? typeEl.value:'financeira'; const deadlineEl=document.getElementById('goalDeadline'); const deadline=deadlineEl? deadlineEl.value:''; if(!title){ toast('Título obrigatório','⚠️'); return;} state.goals.push({id:'g_'+Date.now(),title,type,target,current:0,deadline}); saveState(); closeModal('overlayGoal'); addXP(30,'Meta'); renderGoals(); toast('Meta criada • Firebase','◎'); trySyncAll(); }
export function addGoalProgress(id,pct){ const g=state.goals.find(x=>x.id===id); if(!g) return; g.current=Math.min(g.target, g.current + g.target*(pct/100)); if(g.current>=g.target){ addXP(100,`Meta: ${g.title}`); toast(`Meta "${g.title}" concluída! 🎉`,'◎'); } saveState(); renderGoals(); trySyncAll(); }
export function deleteGoal(id){ state.goals=state.goals.filter(g=>g.id!==id); saveState(); renderGoals(); trySyncAll(); }

// Reports
export function renderReports(){
  const score=calcLifeScore(); const ls=document.getElementById('lifeScore'); if(ls) ls.textContent=score; const lsb=document.getElementById('lifeScoreBar'); if(lsb) lsb.style.width=score+'%'; const lsd=document.getElementById('lifeScoreDesc'); if(lsd) lsd.textContent= score>80?'Excelente equilíbrio!': score>60?'Bom progresso':'Precisa de atenção';
  const isPrem=state.app.premium;
  const financeCont=document.getElementById('reportFinance'); if(financeCont){ financeCont.innerHTML=''; generateInsights(isPrem).slice(0,2).forEach(ins=>{ const d=document.createElement('div'); d.className='insight'; d.innerHTML=`<div class="i-ico" style="background:${ins.color}">${ins.ico}</div><div><b>${ins.title} ${ins.locked?'🔒':''}</b><p>${ins.text}</p></div>`; financeCont.appendChild(d); }); }
  const behCont=document.getElementById('reportBehavior'); if(behCont){ const rate=calcHabitRate(); behCont.innerHTML=`<div class="insight"><div class="i-ico">🔥</div><div><b>Streak ${state.app.streak} dias</b><p>${rate>0.6?'Acima média.':'Tente 3 dias.'}</p></div></div><div class="insight"><div class="i-ico">🧠</div><div><b>Humor médio ${(state.moods.reduce((s,m)=>s+m.level,0)/(state.moods.length||1)).toFixed(1)}/5</b><p>Correlação ${(rate*100).toFixed(0)}%.</p></div></div>`; }
  const weekly=document.getElementById('weeklyAIReport'); if(weekly){ weekly.innerHTML=''; for(let i=0;i<3;i++){ const div=document.createElement('div'); div.className='insight'; div.innerHTML=`<div class="i-ico">✦</div><div><b>${['Resumo semana','Alerta inteligente','Próxima ação'][i]}</b><p>${['Economizou 18% vs semana passada e 5/7 hábitos.','Pico delivery 21h quando humor Ruim. Premium alerta antes.','Amanhã academia cedo +40% chance humor Bom/Excelente. Premium mostra horário ideal.'][i]}</p></div>`; weekly.appendChild(div);} }
  const corr=document.getElementById('correlations'); if(corr){ corr.innerHTML=''; [{ico:'💸',title:'Delivery ↔ Humor Ruim',text:'Ruim = 2.3x Delivery. Premium sugere snack.',up:true},{ico:'🏋️',title:'Treino cedo = Dia Bom',text:'Até 9h = 82% dias bons. Premium ranking horário.',up:true},{ico:'📚',title:'Leitura protege saldo',text:'4+ leituras = -22% lazer. Premium projeção.',up:false}].forEach(c=>{ const d=document.createElement('div'); d.className='insight'; d.innerHTML=`<div class="i-ico" style="background:${c.up?'#DCFCE7':'#FEF3C7'};color:${c.up?'#166534':'#92400E'}">${c.ico}</div><div><b>${c.title}</b><p>${c.text}</p></div>`; corr.appendChild(d); }); }
  const premBadge=document.getElementById('premiumBadge'); if(premBadge){ premBadge.textContent= isPrem ? 'PREMIUM • Total liberado' : 'FREE • 3/7 insights'; premBadge.style.background= isPrem ? '#DCFCE7' : '#EEF2FF'; premBadge.style.color= isPrem ? '#166534' : '#4338CA'; }
}
export function regenerateAI(){ toast('IA reanalisando...','✦'); setTimeout(()=>{ renderReports(); renderDashboard(); toast('Relatório atualizado! • Free 3, Premium 7','✦') },800); }

// Achievements
export function renderAchievements(){
  const set=(id,txt)=>{const el=document.getElementById(id); if(el) el.textContent=txt;};
  set('achStreak', `${state.app.maxStreak||0} dias`);
  const totalHabits = state.habits.reduce((s,h)=> s + Object.keys(h.history||{}).length,0);
  set('achHabits', totalHabits);
  const list=document.getElementById('achList'); if(!list) return; list.innerHTML='';
  const achievements=[
    {id:'first_tx',title:'Primeira transação',desc:'Registre primeira movimentação',ico:'💰',check:()=>state.tx.length>0,xp:10},
    {id:'first_habit',title:'Primeiro hábito',desc:'Crie primeiro hábito',ico:'◍',check:()=>state.habits.length>0,xp:15},
    {id:'streak3',title:'3 dias de fogo',desc:'Streak 3 dias',ico:'🔥',check:()=> (state.app.maxStreak||0)>=3,xp:30},
    {id:'streak7',title:'Guardião semana',desc:'7 dias seguidos',ico:'🛡️',check:()=> (state.app.maxStreak||0)>=7,xp:70},
    {id:'mood5',title:'Autoconhecimento',desc:'5 humores',ico:'☺',check:()=>state.moods.length>=5,xp:25},
    {id:'level5',title:'Guardião Nv5',desc:'Alcance nível 5 (5000 XP)',ico:'🏆',check:()=> (state.user.xp||0)>=5000,xp:100},
    {id:'level10',title:'Vida+ Max Nv10',desc:'Alcance nível 10',ico:'🌟',check:()=> (state.user.xp||0)>=22500,xp:200},
    {id:'saver',title:'Economista',desc:'Saldo positivo mês',ico:'📈',check:()=>{const inc=state.tx.filter(t=>t.type==='income'&& new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);const exp=state.tx.filter(t=>t.type==='expense'&& new Date(t.date).getMonth()===new Date().getMonth()).reduce((s,t)=>s+t.amount,0);return inc>exp && inc>0},xp:40},
    {id:'goal',title:'Meta batida',desc:'Conclua meta',ico:'◎',check:()=>state.goals.some(g=>g.current>=g.target),xp:100},
    {id:'year',title:'1 Ano Jornada',desc:'Alcance nível 50 (78k XP)',ico:'🌌',check:()=> (state.user.xp||0)>=78000,xp:1000},
  ];
  achievements.forEach(a=>{ const done=a.check(); const div=document.createElement('div'); div.className='ach'+(done?'':' lock'); div.innerHTML=`<div class="ach-ico">${a.ico}</div><div style="flex:1"><b style="font-size:13px">${a.title} ${done?'✓':''}</b><p style="font-size:11px;color:var(--muted)">${a.desc} • +${a.xp} XP</p></div><span class="badge" style="background:${done?'#DCFCE7':'var(--bg-2)'};color:${done?'#166534':'var(--muted)'}">${done?'FEITO':'BLOQ'}</span>`; list.appendChild(div); });
}

// Modals
export function closeModal(id){ const el=document.getElementById(id); if(el) el.classList.remove('open'); }
export function openQuickAdd(){ document.getElementById('overlayQuick').classList.add('open'); }
export function openPremium(){ document.getElementById('overlayPremium').classList.add('open'); }
export function activatePremium(){ state.app.premium=true; state.user.premium=true; state.profile.premium=true; saveState(); trySyncAll(); closeModal('overlayPremium'); toast('Premium ativado! Temas e IA total liberados','★'); renderCurrentPage(); }

// INIT ROUTER
export function initApp(){
  loadState();
  ensureSeed();

  // Lê params: ?page=, ?id=, ?p=
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page') || urlParams.get('id') || urlParams.get('p') || 'dashboard';
  const cleanPage = pageParam.replace('.html','');

  // Auth listener
  initAuthListener(async (user)=>{ /* handled via event */ });

  const nav = document.getElementById('nav');
  // nav já tem onclick inline

  document.querySelectorAll('.overlay').forEach(el=>{ el.addEventListener('click',ev=>{ if(ev.target===el) el.classList.remove('open'); }); });
  const gs = document.getElementById('globalSearch');
  if(gs) gs.addEventListener('keydown', e=>{ if(e.key==='Enter'){ const q=e.target.value.toLowerCase(); if(!q) return; loadPage('financeiro'); setTimeout(()=>{ const txs=document.getElementById('txSearch'); if(txs){ txs.value=q; renderTx(); } },400); toast(`Buscando: ${q} • PT-BR`,'⌕'); } });

  // Carrega página inicial
  loadPage(cleanPage);

  window.addEventListener('popstate', ()=>{
    const params = new URLSearchParams(window.location.search);
    const p = params.get('page') || 'dashboard';
    loadPage(p.replace('.html',''));
  });

  // tema inicial
  const forced = localStorage.getItem('vidaplus_forced_theme');
  if(forced) document.documentElement.setAttribute('data-theme', forced);
  else document.documentElement.setAttribute('data-theme', state.settings.theme||'light');

  console.log('[Vida+ AI v4] Router pages + 50 níveis + multi moeda + PT-BR 100% - vidamaisai');
}

if(typeof window !== 'undefined'){
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
}
