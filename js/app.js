import { state, loadState, saveState, addXP, applyRemoteData, setUid, fmtMoney, fmtDate } from './core.js';
import { VidaFirebase, auth, initAuthListener, loginEmail, signupEmail, loginGoogle, logout, loadFullUser, getUid } from './firebase.js';

let _syncing=false;
async function trySyncAll(){
  if(_syncing) return;
  const uid=getUid();
  if(uid==='default_user') return;
  _syncing=true;
  try{
    await VidaFirebase.syncCollection(uid,'transactions',state.tx);
    await VidaFirebase.syncCollection(uid,'habits',state.habits);
    await VidaFirebase.syncCollection(uid,'app',state.app);
    await VidaFirebase.syncCollection(uid,'profile',state.profile);
    const el=document.getElementById('syncStatus');
    if(el) el.textContent=`● Sincronizado ✔`;
  }catch(e){
    console.warn("Sync err:", e);
  }finally{_syncing=false;}
}

window.addEventListener('vidaplus:save', ()=>{
  clearTimeout(window._syncTimer);
  window._syncTimer=setTimeout(()=>trySyncAll(),800);
});

window.addEventListener('vidaplus:auth', async (e)=>{
  const user=e.detail.user;
  if(user){
    setUid(user.uid);
    state.profile.email=user.email;
    saveState();
    appCloseModal('overlayAuth');
    updateHeader();
    try{
      const remote=await loadFullUser(user.uid);
      if(remote) applyRemoteData(remote);
    }catch(e){}
    appLoadPage('dashboard');
  }else{
    setUid('default_user');
    updateHeader();
    appLoadPage('home');
  }
});

export function appOpenAuthModal(){
  const el=document.getElementById('overlayAuth');
  if(el){ el.classList.add('open'); el.style.display='grid'; }
}
export function appCloseModal(id){
  const el=document.getElementById(id);
  if(el){ el.style.display='none'; el.classList.remove('open'); }
}
export function appSwitchAuthMode(mode){
  const lv=document.getElementById('authLoginView');
  const sv=document.getElementById('authSignupView');
  const tl=document.getElementById('tabLogin');
  const ts=document.getElementById('tabSignup');
  if(mode==='signup'){
    if(lv) lv.style.display='none'; if(sv) sv.style.display='grid';
    if(tl) tl.classList.remove('active'); if(ts) ts.classList.add('active');
  }else{
    if(lv) lv.style.display='grid'; if(sv) sv.style.display='none';
    if(tl) tl.classList.add('active'); if(ts) ts.classList.remove('active');
  }
}

export async function appHandleLogin(){
  const e=document.getElementById('authEmail').value.trim();
  const p=document.getElementById('authPass').value;
  try{ await loginEmail(e,p); }catch(err){ alert('Erro: ' + err.message); }
}
export async function appHandleSignup(){
  const e=document.getElementById('authEmailSignup').value.trim();
  const p=document.getElementById('authPassSignup').value;
  const n=document.getElementById('authFirstName').value.trim();
  try{ await signupEmail(e,p,n); }catch(err){ alert('Erro: ' + err.message); }
}
export async function appHandleGoogleLogin(){
  try{ await loginGoogle(); }catch(err){ alert('Erro Google: ' + err.message); }
}
export async function appHandleLogout(){
  if(confirm('Sair da conta?')) await logout();
}

function updateHeader(){
  const e=document.getElementById('userEmailChip');
  const av=document.getElementById('avatar');
  const btnLg=document.getElementById('topLoginBtn');
  const btnLgOut=document.getElementById('btnLogout');
  const uid=getUid();
  if(uid!=='default_user'){
    if(e) e.textContent=state.profile.email||'Usuário';
    if(av) av.textContent=(state.profile.name||state.profile.email||'U').charAt(0).toUpperCase();
    if(btnLg) btnLg.style.display='none';
    if(btnLgOut) btnLgOut.style.display='block';
  }else{
    if(e) e.textContent='Visitante • Faça login';
    if(av) av.textContent='?';
    if(btnLg) btnLg.style.display='block';
    if(btnLgOut) btnLgOut.style.display='none';
  }
}

export async function appLoadPage(name){
  document.querySelectorAll('.nav button').forEach(b=>{ b.classList.toggle('active', b.dataset.page===name); });
  const homeView=document.getElementById('homeView');
  const pageContainer=document.getElementById('pageContainer');
  
  if(name==='home' || getUid()==='default_user'){
    homeView.style.display='block';
    pageContainer.style.display='none';
    if(name!=='home') appOpenAuthModal();
    const res=await fetch(`pages/home.html?_=${Date.now()}`);
    const text=await res.text();
    const doc=new DOMParser().parseFromString(text, 'text/html');
    homeView.innerHTML=doc.body.innerHTML;
    return;
  }
  
  homeView.style.display='none';
  pageContainer.style.display='block';
  pageContainer.innerHTML='<p style="text-align:center;padding:40px;color:var(--muted)">Carregando...</p>';
  
  try{
    const res=await fetch(`pages/${name}.html?_=${Date.now()}`);
    if(res.ok){
      const text=await res.text();
      const doc=new DOMParser().parseFromString(text, 'text/html');
      pageContainer.innerHTML=doc.body.innerHTML;
      if(name==='dashboard') renderDashboard();
    }else{
      pageContainer.innerHTML=`<div class="card"><h3>Página não encontrada: ${name}</h3></div>`;
    }
  }catch(e){
    pageContainer.innerHTML=`<div class="card"><h3>Erro ao carregar</h3></div>`;
  }
}

function renderDashboard(){
  const inc = state.tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const exp = state.tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const st = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  st('dashIncome', fmtMoney(inc, state.settings.currency));
  st('dashExpense', fmtMoney(exp, state.settings.currency));
  st('dashEconomy', fmtMoney(inc-exp, state.settings.currency));
  st('dashEconomyPct', inc>0 ? Math.round(((inc-exp)/inc)*100)+'% da renda guardada' : '0% da renda');
  
  const list=document.getElementById('dashTxList');
  if(list){
    list.innerHTML='';
    [...state.tx].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5).forEach(t=>{
      const isInc = t.type==='income';
      list.innerHTML+=`<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="width:36px;height:36px;border-radius:10px;background:${isInc?'#DCFCE7':'#FEE2E2'};display:grid;place-items:center;color:${isInc?'#10B981':'#F43F5E'}">${isInc?'↑':'↓'}</div>
        <div style="flex:1"><b>${t.desc||t.category||'Transação'}</b><br><span style="font-size:11px;color:var(--muted)">${fmtDate(t.date)}</span></div>
        <div style="font-weight:bold;color:${isInc?'#10B981':'#F43F5E'}">${isInc?'+':'-'} ${fmtMoney(t.amount, state.settings.currency)}</div>
      </div>`;
    });
  }
}

window.appOpenAuthModal = appOpenAuthModal;
window.appCloseModal = appCloseModal;
window.appSwitchAuthMode = appSwitchAuthMode;
window.appHandleLogin = appHandleLogin;
window.appHandleSignup = appHandleSignup;
window.appHandleGoogleLogin = appHandleGoogleLogin;
window.appHandleLogout = appHandleLogout;
window.appLoadPage = appLoadPage;

loadState();
initAuthListener((user)=>{
  if(!user){ appLoadPage('home'); }
});
