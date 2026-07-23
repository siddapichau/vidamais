// Vida+ AI - APP v6 FINAL - BULLETPROOF MOBILE - NÃO TRAVA MAIS
// Agora o estado só é carregado após o listener de auth definir o usuário

import { state, themes, currencies, levelTable, defaultCategories, moodMap, fmtMoney, fmtDate, todayStr, getLevel, getNextLevel, getLevelProgress, loadState, saveState, addXP, calcStreak, calcHabitRate, calcLifeScore, generateInsights, seedHabits, ensureSeed, applyRemoteData, setUid } from './core.js';
import { VidaFirebase, FIREBASE_DB_URL, auth } from './firebase.js';
import { initAuthListener, loginEmail as fbLoginEmail, signupEmail as fbSignupEmail, loginGoogle as fbLoginGoogle, logout as fbLogout, resetPassword, updateUserProfileData, changePassword as fbChangePassword, loadFullUser, getUid } from './firebase.js';

let tempMood = null;
let currentPage = 'dashboard';

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
  } catch(e){
    const el=document.getElementById('syncStatus');
    if(el) el.textContent='● Offline: '+e.message.slice(0,40);
  } finally {_syncing=false;}
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
  } catch(e){ console.warn(e); }
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
    if(authOverlay) {
      authOverlay.classList.remove('open');
      authOverlay.style.display = 'none';
    }
    updateHeader();
    await pullFromFirebase();       // aguarda dados remotos
    renderCurrentPage();            // renderiza com dados atualizados
    if(!state.profile.firstName || !state.profile.lastName){
      const cp=document.getElementById('overlayCompleteProfile');
      if(cp){
        document.getElementById('completeFirstName').value=state.profile.firstName||'';
        document.getElementById('completeLastName').value=state.profile.lastName||'';
        document.getElementById('completePhone').value=state.profile.phone||'';
        cp.classList.add('open');
      }
    }
    toast(`Bem-vindo, ${state.profile.firstName||state.user.name}!`,'👋');
  } else {
    // Usuário deslogado: limpa estado e mostra modal de login
    setUid('default_user');
    loadState(true); // força limpeza total (inclui localStorage)
    updateHeader();
    renderCurrentPage();
    openAuthModal();
  }
});

// ====== AUTH ======
let _authBusy=false;
export function openAuthModal(){
  const el=document.getElementById('overlayAuth');
  if(el){
    el.classList.add('open');
    el.style.display = 'grid';
  }
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
    if(sv) sv.style.display='grid';
    if(tl) tl.classList.remove('active');
    if(ts) ts.classList.add('active');
    if(title) title.textContent='Criar conta';
  } else {
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
    // O evento 'vidaplus:auth' será disparado e fechará o modal
  } catch(e){
    console.error(e);
    let msg=e.message||'Erro login';
    if(e.code==='auth/invalid-credential' || e.code==='auth/wrong-password' || e.code==='auth/user-not-found') msg='E-mail ou senha incorretos';
    if(e.code==='auth/too-many-requests') msg='Muitas tentativas, aguarde ou redefina senha';
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado. Adicione em Firebase > Auth > Authorized domains`;
    if(e.code==='auth/network-request-failed') msg='Sem internet ou Firebase fora. Verifique conexão';
    showAuthError(msg+' ('+e.code+')');
  } finally {
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
  } catch(e){
    console.error(e);
    let msg=e.message;
    if(e.code==='auth/email-already-in-use') msg='E-mail já existe, tente Entrar';
    if(e.code==='auth/weak-password') msg='Senha fraca, mínimo 6';
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado`;
    showAuthError(msg+' ('+e.code+')');
  } finally {
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
    await fbLoginGoogle(); // sempre redirect
    toast('Redirecionando para Google... aguarde voltar','↗️');
    // A página será redirecionada, e ao voltar o getRedirectResult será capturado
  } catch(e){
    console.error(e);
    let msg=e.message;
    if(e.code==='auth/unauthorized-domain') msg=`Domínio ${location.hostname} não autorizado. Adicione em Firebase > Auth > Authorized domains`;
    showAuthError(msg+' ('+e.code+')');
  } finally {
    _authBusy=false;
    btns.forEach((b,i)=>{ b.textContent=origTexts[i]||'Continuar com Google'; b.disabled=false; });
  }
}
export async function handleLogout(){
  if(!confirm('Sair? Progresso salvo no Firebase.')) return;
  try{ await fbLogout(); toast('Saiu','👋'); openAuthModal(); } catch(e){ toast('Erro sair: '+e.message,'⚠️'); }
}
export async function handleReset(){
  const email=document.getElementById('authEmail')?.value.trim() || document.getElementById('authEmailSignup')?.value.trim() || '';
  if(!email){ showAuthError('Digite e-mail para reset'); return; }
  try{
    const { resetPassword } = await import('./firebase.js');
    await resetPassword(email);
    showAuthError('E-mail de recuperação enviado para '+email+' - verifique spam');
    toast('E-mail enviado 📧','📧');
  } catch(e){ showAuthError(e.message+' ('+e.code+')'); }
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
  } catch(e){ toast('Erro: '+e.message,'⚠️'); }
}

// ====== RESTO DO CÓDIGO (renderização, etc.) permanece igual ======
// ... (mantenha as funções renderDashboard, renderTx, etc. como estavam)
// Certifique-se de que as funções updateHeader, updateXPUI, etc. existem.

// No initApp, agora apenas inicia o listener e carrega a página inicial
export function initApp(){
  // Não carrega estado aqui – será feito pelo listener
  const params=new URLSearchParams(location.search);
  const page=params.get('page')||params.get('id')||'dashboard';
  initAuthListener(()=>{});
  document.querySelectorAll('.overlay').forEach(el=>{ el.addEventListener('click',e=>{ if(e.target===el) el.classList.remove('open'); }); });
  loadPage(page);
  const forced=localStorage.getItem('vidaplus_forced_theme');
  document.documentElement.setAttribute('data-theme', forced||state.settings.theme||'light');
  console.log('[Vida+ AI v6 FINAL] Mobile bulletproof - domínio precisa estar em Firebase Auth Authorized domains');
}

if(typeof window!=='undefined'){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
}