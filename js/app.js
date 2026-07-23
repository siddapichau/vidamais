import { state, loadState, saveState, applyRemoteData, setUid, addXP, fmtMoney, avatars, getLevelData, themes } from './core.js';
import { VidaFirebase, auth, initAuthListener, loginEmail, signupEmail, loginGoogle, logout, loadFullUser, getUid } from './firebase.js';
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

window.toast = (msg, ico='✦') => {
  const stack = document.getElementById('toasts');
  if(!stack) return;
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

window.appGiveXP = (amount, reason) => {
  addXP(amount);
  window.toast(`+${amount} XP: ${reason}`, '⚡');
  if(document.getElementById('conquistasLevel')) renderConquistas(); 
};

window.appActivatePremium = async () => {
  state.user.premium = true; state.profile.premium = true; saveState();
  window.toast('Premium ativado! 💎 Aproveite os relatórios IA e Temas.', '💎');
  window.appLoadPage('perfil');
  try { await VidaFirebase.syncCollection(getUid(), 'profile', state.profile); await VidaFirebase.syncCollection(getUid(), 'user', state.user); }catch(e){}
};

window.appSaveProfile = async () => {
  const fn = document.getElementById('profileFirstName')?.value.trim() || '';
  const ln = document.getElementById('profileLastName')?.value.trim() || '';
  const ph = document.getElementById('profilePhone')?.value.trim() || '';
  const ad = document.getElementById('profileAddress')?.value.trim() || '';
  const pw = document.getElementById('profileNewPassword')?.value || '';

  state.profile.firstName = fn; state.profile.lastName = ln; state.profile.name = (fn + ' ' + ln).trim();
  state.profile.phone = ph; state.profile.address = ad;
  
  if(pw && pw.length >= 6) {
     try {
       await updatePassword(auth.currentUser, pw);
       window.toast('Senha atualizada com segurança!', '🔒');
       document.getElementById('profileNewPassword').value = '';
       window.appGiveXP(50, 'Segurança da conta reforçada');
     } catch(e) { window.toast('Erro na senha. Tente novamente.', '⚠️'); }
  }

  saveState(); updateHeader();
  window.appGiveXP(20, 'Atualizou informações do perfil');
  try {
    await VidaFirebase.syncCollection(getUid(), 'profile', state.profile);
    await VidaFirebase.syncCollection(getUid(), 'settings', state.settings);
    window.toast('Perfil salvo na nuvem com sucesso!', '✓');
  } catch(e) { window.toast('Salvo localmente.', '☁️'); }
};

window.appSelectTheme = (baseId) => {
  const themeDef = themes[baseId];
  if(themeDef && themeDef.premium && !state.user.premium){
    window.toast(`O tema ${themeDef.label} é exclusivo Premium!`, '💎');
    return;
  }
  let current = document.documentElement.getAttribute('data-theme') || 'default-light';
  let mode = current.split('-')[1] || 'light'; 
  
  let newTheme = `${baseId}-${mode}`;
  document.documentElement.setAttribute('data-theme', newTheme);
  state.settings.theme = newTheme;
  saveState();
  
  document.querySelectorAll('.theme-btn').forEach(btn => btn.style.border = '1px solid var(--border)');
  const activeBtn = document.getElementById(`themeBtn_${baseId}`);
  if(activeBtn) activeBtn.style.border = '2px solid var(--primary)';
  window.appGiveXP(10, 'Personalizou a interface');
};

window.appToggleTheme = () => {
  let current = document.documentElement.getAttribute('data-theme') || 'default-light';
  let [base, mode] = current.split('-');
  if(!mode) { base = current; mode = 'light'; }
  let nextMode = mode === 'light' ? 'dark' : 'light';
  let nextTheme = `${base}-${nextMode}`;
  
  document.documentElement.setAttribute('data-theme', nextTheme);
  state.settings.theme = nextTheme;
  saveState();
  window.toast(`Modo ${nextMode === 'light' ? 'Claro ☀️' : 'Escuro 🌙'} Ativado`, '◐');
};

window.appSelectAvatar = (url) => {
  state.profile.photo = url; saveState(); updateHeader();
  window.toast('Avatar atualizado perfeitamente!', '👤');
  window.appGiveXP(15, 'Evoluiu o visual');
  
  document.querySelectorAll('.avatar-grid img').forEach(img => img.classList.remove('selected'));
  const activeImg = document.querySelector(`.avatar-grid img[src="${url}"]`);
  if(activeImg) activeImg.classList.add('selected');
};

// --- ROTEAMENTO E INJEÇÃO EXTERNA (Puxa os arquivos da pasta /pages) ---
window.appLoadPage = async (name) => {
  if(!name) name = 'home';
  
  // REGRA DE OURO: Se o usuário está logado e tentou ir para a Home, redireciona para Dashboard.
  if (name === 'home' && getUid() !== 'default_user') {
    name = 'dashboard';
  }
  
  try {
    const url = new URL(window.location);
    url.searchParams.set('page', name);
    window.history.pushState({}, '', url);
  } catch(e) {}

  document.querySelectorAll('.nav button').forEach(b => { if(b) b.classList.toggle('active', b.dataset.page === name) });
  
  const pageContainer = document.getElementById('pageContainer');
  const homeView = document.getElementById('homeView');
  if(!pageContainer || !homeView) return;

  // Renderiza a Home (Apenas para visitantes)
  if(name === 'home'){
    homeView.style.display = 'block'; 
    pageContainer.style.display = 'none';
    try {
      const res = await fetch(`pages/home.html?_=${Date.now()}`);
      if(res.ok) {
        homeView.innerHTML = await res.text();
      } else {
        homeView.innerHTML = `<div class="card" style="text-align:center;"><h3>Página Inicial não encontrada.</h3></div>`;
      }
    } catch(e) {
      homeView.innerHTML = `<div class="card" style="text-align:center;"><h3>Erro local de CORS.</h3><p>Abra o projeto num servidor local (Live Server).</p></div>`;
    }
    return;
  }
  
  // Renderiza as páginas restritas puxando os arquivos externos
  homeView.style.display = 'none'; 
  pageContainer.style.display = 'block';
  pageContainer.innerHTML = '<p style="padding:40px;text-align:center;color:var(--muted)">Carregando...</p>';

  try {
    const res = await fetch(`pages/${name}.html?_=${Date.now()}`);
    if(res.ok){
      // Tira o DOMParser complexo, injeta o texto HTML direto
      pageContainer.innerHTML = await res.text();
    } else {
       pageContainer.innerHTML = `<div class="card" style="text-align:center;"><h3>Página não encontrada</h3></div>`;
    }
  } catch(e) {
    pageContainer.innerHTML = `<div class="card" style="text-align:center;"><h3>Erro de conexão</h3></div>`;
  }

  // Aciona os Scripts Visuais após injetar o HTML
  try { if(name === 'dashboard') renderDashboard(); } catch(e){}
  try { if(name === 'perfil') renderPerfil(); } catch(e){}
  try { if(name === 'relatorios') renderRelatorios(); } catch(e){}
  try { if(name === 'conquistas') renderConquistas(); } catch(e){}
};

function updateHeader(){
  const av = document.getElementById('avatar');
  const navHomeBtn = document.getElementById('navHomeBtn'); // Botão Home no Menu

  if(getUid() !== 'default_user'){
    const loginBtn = document.getElementById('topLoginBtn');
    const logoutBtn = document.getElementById('btnLogout');
    if(loginBtn) loginBtn.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'block';
    
    // Esconde o botão da Home do menu quando o usuário está logado
    if(navHomeBtn) navHomeBtn.style.display = 'none';
    
    if(av) {
      if(typeof state.profile.photo === 'string' && state.profile.photo.includes('http')){
        av.innerHTML = `<img src="${state.profile.photo}" alt="Avatar">`;
      } else {
        const letter = String(state.profile.firstName || state.profile.email || 'U').charAt(0).toUpperCase();
        av.innerHTML = letter;
      }
    }
  } else {
    const loginBtn = document.getElementById('topLoginBtn');
    const logoutBtn = document.getElementById('btnLogout');
    if(loginBtn) loginBtn.style.display = 'block';
    if(logoutBtn) logoutBtn.style.display = 'none';
    
    // Mostra o botão da Home novamente se for visitante
    if(navHomeBtn) navHomeBtn.style.display = 'flex'; 
    if(av) av.textContent = '?';
  }
}

function renderDashboard(){
  const txList = Array.isArray(state.tx) ? state.tx : [];
  const inc = txList.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount||0),0);
  const exp = txList.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
  
  const st = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  st('dashIncome', fmtMoney(inc)); st('dashExpense', fmtMoney(exp)); st('dashEconomy', fmtMoney(inc-exp));
}

function renderPerfil(){
  const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val || ''; };
  setVal('profileFirstName', state.profile.firstName); setVal('profileLastName', state.profile.lastName);
  setVal('profilePhone', state.profile.phone); setVal('profileAddress', state.profile.address);
  setVal('profileEmail', state.profile.email);
  
  const statusLbl = document.getElementById('perfilStatus');
  if(statusLbl) statusLbl.textContent = state.user.premium ? '💎 Premium Vitalício' : 'Free';
  
  const tContainer = document.getElementById('themesList');
  if(tContainer){
    tContainer.innerHTML = '';
    const currentBase = (state.settings.theme || 'default-light').split('-')[0];
    Object.keys(themes).forEach(key => {
       const isCurrent = currentBase === key;
       tContainer.innerHTML += `<button id="themeBtn_${key}" class="theme-btn btn btn-ghost" style="border:${isCurrent?'2px solid var(--primary)':'1px solid var(--border)'}; margin-right:6px; margin-bottom:6px;" onclick="appSelectTheme('${key}')">${themes[key].label} ${themes[key].premium?'💎':''}</button>`;
    });
  }

  const aContainer = document.getElementById('avatarGrid');
  if(aContainer){
    aContainer.innerHTML = '';
    avatars.forEach(url => {
       const isSel = state.profile.photo === url;
       aContainer.innerHTML += `<img src="${url}" class="${isSel?'selected':''}" onclick="appSelectAvatar('${url}')" style="background:var(--bg-2); border-radius:50%; width:100%; border:3px solid ${isSel?'var(--primary)':'transparent'}; cursor:pointer;">`;
    });
  }
}

function renderRelatorios(){
  const list = document.getElementById('insightsList');
  if(!list) return;
  list.innerHTML = '';
  const insights = [
    { title: 'Economia Potencial', desc: 'Identificamos que 18% dos seus gastos ocorrem aos sábados à noite.', icon: '💰', premium: false },
    { title: 'Consistência de Hábitos', desc: 'A prática de "Leitura" salvou seu streak 3 vezes.', icon: '🔥', premium: false },
    { title: 'Correlação de Humor (Avançado)', desc: 'Sempre que seu humor está "Ruim", seus gastos com "Delivery" sobem 45%.', icon: '🧠', premium: true },
    { title: 'DNA Comportamental (Projeção)', desc: 'Sugerimos agendar tarefas pesadas após as 19h para aproveitar seu pico natural.', icon: '🧬', premium: true }
  ];
  insights.forEach(ins => {
    if(ins.premium && !state.user.premium){
      list.innerHTML += `<div class="card" style="opacity:0.6; border-color:var(--primary)"><b>${ins.icon} ${ins.title}</b><p style="font-size:12px;margin-top:8px;">🔒 Recurso Exclusivo Premium.</p></div>`;
    } else {
      list.innerHTML += `<div class="card" style="border-left: 4px solid var(--primary)"><b>${ins.icon} ${ins.title}</b><p style="font-size:12px;margin-top:8px;color:var(--muted)">${ins.desc}</p></div>`;
    }
  });
}

function renderConquistas(){
  const lvlData = getLevelData(state.user.xp || 0);
  const el = document.getElementById('conquistasLevel');
  const bar = document.getElementById('conquistasBar');
  if(el) el.innerHTML = `<span style="font-size:42px">${lvlData.current.icon || '⚡'}</span><br><b style="font-size:22px">${lvlData.current.name} (Nível ${lvlData.current.level})</b><br><small style="color:var(--muted)">${state.user.xp || 0} XP de ${lvlData.next.xp} XP para subir de rank.</small>`;
  if(bar) bar.style.width = lvlData.pct + '%';
}

window.appOpenAuthModal = () => { const el = document.getElementById('overlayAuth'); if(el) { el.style.display='grid'; el.classList.add('open'); }};
window.appCloseModal = (id) => { const el = document.getElementById(id); if(el) { el.style.display='none'; el.classList.remove('open'); }};
window.appSwitchAuthMode = (mode) => { 
  const lv = document.getElementById('authLoginView'); const sv = document.getElementById('authSignupView');
  if(lv) lv.style.display = mode==='login'?'grid':'none'; 
  if(sv) sv.style.display = mode==='signup'?'grid':'none'; 
};
window.appHandleLogin = async () => { 
  try { await loginEmail(document.getElementById('authEmail').value, document.getElementById('authPass').value); } 
  catch(e) { window.toast('Erro: e-mail ou senha incorretos.', '⚠️'); }
};
window.appHandleSignup = async () => { 
  try { await signupEmail(document.getElementById('authEmailSignup').value, document.getElementById('authPassSignup').value, document.getElementById('authFirstName').value); } 
  catch(e) { window.toast('Erro: e-mail já existe ou senha curta.', '⚠️'); }
};
window.appHandleGoogleLogin = async () => { await loginGoogle(); };
window.appHandleLogout = async () => { if(confirm('Sair da conta?')) await logout(); };

loadState();
initAuthListener((user)=>{
  let initialPage = 'dashboard';
  try {
    const params = new URLSearchParams(window.location.search);
    initialPage = params.get('page') || 'dashboard';
  } catch(e) {}

  if(user){
    setUid(user.uid); 
    state.profile.email = user.email; 
    saveState();
    
    window.appCloseModal('overlayAuth');
    updateHeader(); // Atualiza a UI para esconder o botão Home
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'default-light');
    
    // Roteamento condicional de Login
    window.appLoadPage(initialPage === 'home' ? 'dashboard' : initialPage);

    loadFullUser(user.uid).then(remote => {
        if(remote) {
            applyRemoteData(remote);
            const current = new URLSearchParams(window.location.search).get('page') || 'dashboard';
            if(current === 'dashboard') renderDashboard();
            if(current === 'perfil') renderPerfil();
            if(current === 'conquistas') renderConquistas();
        }
    }).catch(err => { console.warn('Banco offline ou acesso restrito.', err); });

  } else {
    setUid('default_user'); 
    updateHeader(); 
    window.appLoadPage('home');
    if(initialPage !== 'home' && initialPage !== 'dashboard') {
        window.appOpenAuthModal();
    }
  }
});
