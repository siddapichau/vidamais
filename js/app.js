import { state, loadState, saveState, applyRemoteData, setUid } from './core.js';
import { VidaFirebase, auth, initAuthListener, loginEmail, signupEmail, logout, loadFullUser, getUid } from './firebase.js';
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.toast = (msg, ico='✦') => {
  const stack = document.getElementById('toasts');
  const el = document.createElement('div'); el.className='toast';
  el.innerHTML=`<div class="t-ico">${ico}</div><div>${msg}</div>`;
  stack.appendChild(el);
  setTimeout(()=>el.remove(), 4000);
};

window.appAvatarClick = () => {
  if(getUid() === 'default_user'){
    window.appOpenAuthModal();
  } else {
    window.appLoadPage('perfil');
  }
};

window.appSaveProfile = async () => {
  const fn = document.getElementById('profileFirstName').value.trim();
  const ln = document.getElementById('profileLastName').value.trim();
  const ph = document.getElementById('profilePhone').value.trim();
  const ad = document.getElementById('profileAddress').value.trim();
  const av = document.getElementById('profileAvatarUrl').value.trim();
  const pw = document.getElementById('profileNewPassword').value;
  const th = document.getElementById('profileTheme').value;

  state.profile.firstName = fn;
  state.profile.lastName = ln;
  state.profile.name = fn + ' ' + ln;
  state.profile.phone = ph;
  state.profile.address = ad;
  state.profile.photo = av;
  
  state.settings.theme = th;
  document.documentElement.setAttribute('data-theme', th);

  // Alterar senha se preenchido
  if(pw && pw.length >= 6) {
     try {
       await updatePassword(auth.currentUser, pw);
       window.toast('Senha atualizada com segurança!', '🔒');
       document.getElementById('profileNewPassword').value = '';
     } catch(e) {
       window.toast('Erro na senha. Saia, faça login novamente e tente.', '⚠️');
     }
  }

  saveState();
  updateHeader();
  
  try {
    await VidaFirebase.syncCollection(getUid(), 'profile', state.profile);
    await VidaFirebase.syncCollection(getUid(), 'settings', state.settings);
    window.toast('Perfil de Cliente salvo na nuvem!', '✓');
  } catch(e) {
    window.toast('Salvo offline.', '☁️');
  }
};

window.appToggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  // Alterna entre light e dark base. Mantém temas coloridos intocados a não ser que escolha no perfil.
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  state.settings.theme = next;
  saveState();
  window.toast(`Modo ${next} ativado`, '◐');
};

// Carregamento de Páginas via Iframe SPA / DOMParser
window.appLoadPage = async (name) => {
  document.querySelectorAll('.nav button').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  const pageContainer = document.getElementById('pageContainer');
  const homeView = document.getElementById('homeView');
  
  if(name === 'home' || getUid() === 'default_user'){
    homeView.style.display = 'block'; pageContainer.style.display = 'none';
    const res = await fetch(`pages/home.html?_=${Date.now()}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    homeView.innerHTML = doc.body.innerHTML;
    return;
  }
  
  homeView.style.display = 'none'; pageContainer.style.display = 'block';
  pageContainer.innerHTML = '<p style="padding:40px;text-align:center;">Carregando...</p>';
  try {
    const res = await fetch(`pages/${name}.html?_=${Date.now()}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    pageContainer.innerHTML = doc.body.innerHTML;
    
    // Preenche os dados automaticamente se for a página de perfil
    if(name === 'perfil'){
      document.getElementById('profileFirstName').value = state.profile.firstName || '';
      document.getElementById('profileLastName').value = state.profile.lastName || '';
      document.getElementById('profilePhone').value = state.profile.phone || '';
      document.getElementById('profileAddress').value = state.profile.address || '';
      document.getElementById('profileAvatarUrl').value = state.profile.photo || '';
      document.getElementById('profileEmail').value = state.profile.email || '';
      document.getElementById('profileTheme').value = state.settings.theme || 'light';
    }
  } catch(e) { pageContainer.innerHTML = `<div class="card"><h3>Erro</h3></div>`; }
};

function updateHeader(){
  const av = document.getElementById('avatar');
  if(getUid() !== 'default_user'){
    document.getElementById('topLoginBtn').style.display = 'none';
    document.getElementById('btnLogout').style.display = 'block';
    
    // Sistema de Avatar Avançado
    if(state.profile.photo && state.profile.photo.includes('http')){
      av.innerHTML = `<img src="${state.profile.photo}" alt="Avatar">`;
    } else {
      av.innerHTML = (state.profile.name || state.profile.email || 'U').charAt(0).toUpperCase();
    }
  }
}

// Inicializações da Auth (Mesma do seu projeto original)
window.appOpenAuthModal = () => { document.getElementById('overlayAuth').style.display='grid'; };
window.appCloseModal = (id) => { document.getElementById(id).style.display='none'; };
window.appSwitchAuthMode = (mode) => { document.getElementById('authLoginView').style.display = mode==='login'?'grid':'none'; document.getElementById('authSignupView').style.display = mode==='signup'?'grid':'none'; };
window.appHandleLogin = async () => { await loginEmail(document.getElementById('authEmail').value, document.getElementById('authPass').value); };
window.appHandleSignup = async () => { await signupEmail(document.getElementById('authEmailSignup').value, document.getElementById('authPassSignup').value, document.getElementById('authFirstName').value); };
window.appHandleLogout = async () => { if(confirm('Sair da conta?')) await logout(); };

loadState();
initAuthListener(async (user)=>{
  if(user){
    setUid(user.uid); state.profile.email = user.email; saveState();
    window.appCloseModal('overlayAuth');
    try { const remote = await loadFullUser(user.uid); if(remote) applyRemoteData(remote); } catch(e){}
    updateHeader();
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'light');
    window.appLoadPage('dashboard');
  } else {
    setUid('default_user'); updateHeader(); window.appLoadPage('home');
  }
});
