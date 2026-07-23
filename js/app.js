import { state, loadState, saveState, applyRemoteData, setUid, addXP, fmtMoney, avatars, getLevelData, themes } from './core.js';
import { VidaFirebase, auth, initAuthListener, loginEmail, signupEmail, loginGoogle, logout, loadFullUser, getUid } from './firebase.js';
import { updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Helpers Globais ---
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

// --- HTMLs Nativos Protegidos ---
function getPageHTML(name) {
  if(name === 'home') return `<div id="home-welcome" style="max-width:900px;margin:0 auto;text-align:center;padding:20px 10px"><div style="width:80px;height:80px;margin:0 auto 16px;border-radius:20px;background:conic-gradient(from 210deg at 50% 50%, #123C7A, #6366F1, #06B6D4, #10B981, #123C7A);display:grid;place-items:center;box-shadow:0 12px 30px rgba(18,60,122,.25)"><span style="font-size:32px; font-weight:800; color:white;">V+</span></div><h1 class="display" style="font-size:42px;line-height:1;letter-spacing:-.04em">Evolução diária<br>inteligente.</h1><p style="color:var(--muted);font-size:15px;margin-top:14px;line-height:1.5;max-width:600px;margin-left:auto;margin-right:auto">Una finanças, hábitos e metas. Uma plataforma que ajuda você a tomar decisões melhores, encontrar padrões invisíveis e subir de nível na vida real.</p><div style="display:flex;gap:10px;justify-content:center;margin-top:24px"><button class="btn btn-primary" style="height:50px;padding:0 28px;font-size:15px" onclick="appOpenAuthModal()">🚀 Acessar o App Gratuitamente</button></div></div>`;
  if(name === 'dashboard') return `<div class="top-actions" style="margin-bottom: 20px;"><h2 style="font-size:26px">Dashboard</h2><p style="color:var(--muted); font-size: 13px;">Sua visão geral financeira e de progresso do mês.</p></div><div class="grid grid-3"><div class="card kpi"><div class="kpi-head"><span class="kpi-label">RECEITAS NO MÊS</span><span class="kpi-icon" style="background:#DCFCE7;color:#10B981">↑</span></div><div class="kpi-value" id="dashIncome">R$ 0,00</div></div><div class="card kpi"><div class="kpi-head"><span class="kpi-label">ECONOMIA</span><span class="kpi-icon" style="background:#E0E7FF;color:#6366F1">💰</span></div><div class="kpi-value" id="dashEconomy">R$ 0,00</div></div><div class="card kpi"><div class="kpi-head"><span class="kpi-label">DESPESAS NO MÊS</span><span class="kpi-icon" style="background:#FEE2E2;color:#F43F5E">↓</span></div><div class="kpi-value" id="dashExpense">R$ 0,00</div></div></div>`;
  if(name === 'perfil') return `<div class="top-actions" style="margin-bottom: 20px;"><h2>Meu Perfil</h2><p style="color:var(--muted); font-size: 13px;">Gerencie suas configurações, dados de cliente, plano e design.</p></div><div class="grid grid-2"><div class="card"><b style="font-size:16px;">Dados do Cliente</b><div style="display:grid;gap:12px;margin-top:16px"><div class="row"><input id="profileFirstName" class="input" placeholder="Nome"><input id="profileLastName" class="input" placeholder="Sobrenome"></div><input id="profileEmail" class="input" disabled title="E-mail gerado pelo Auth"><input id="profilePhone" class="input" placeholder="Celular (WhatsApp)"><input id="profileAddress" class="input" placeholder="Endereço Completo"><div class="divider">SEGURANÇA</div><input id="profileNewPassword" class="input" type="password" placeholder="Nova Senha (deixe vazio para não alterar)"><button class="btn btn-primary" onclick="appSaveProfile()" style="margin-top:10px;">Salvar Alterações</button></div></div><div style="display:flex;flex-direction:column;gap:16px;"><div class="card" style="background:linear-gradient(135deg,var(--primary),var(--violet));color:white;border:none;"><b style="font-size:16px;">Plano Vida+ AI</b><div style="font-size:24px;font-weight:800;margin-top:12px" id="perfilStatus">Status: Free</div><p style="margin-top:8px; font-size:13px; opacity:0.9;">Com o plano Premium você desbloqueia novos temas, relatórios avançados de IA e projeções financeiras.</p><button class="btn btn-white" style="margin-top:16px;width:100%" onclick="appActivatePremium()">Ativar Teste Premium</button></div><div class="card"><b style="font-size:16px;">Temas Profissionais</b><p style="font-size:12px;color:var(--muted);margin-top:6px;">Escolha o tema. O botão "◐" no topo alterna perfeitamente entre as versões claras e escuras do tema escolhido!</p><div id="themesList" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;"></div></div><div class="card"><b style="font-size:16px;">Avatares</b><p style="font-size:12px;color:var(--muted);margin-top:6px;">Escolha seu avatar preferido. Cada mudança garante XP na plataforma!</p><div id="avatarGrid" class="avatar-grid"></div></div></div></div>`;
  if(name === 'relatorios') return `<div class="top-actions" style="margin-bottom: 20px;"><h2>IA & Insights Funcional</h2><p style="color:var(--muted); font-size: 13px;">O cérebro do Vida+ AI. Cruzamos seus hábitos, humor e finanças para entregar oportunidades invisíveis a olho nu.</p></div><div id="insightsList" class="grid grid-2"></div>`;
  if(name === 'conquistas') return `<div class="top-actions" style="margin-bottom: 20px;"><h2>Sistema de Conquistas</h2><p style="color:var(--muted); font-size: 13px;">Cada ação importa. São 50 níveis para a evolução máxima (78.000 XP), com uma jornada desenhada para durar 1 ano.</p></div><div class="grid grid-2"><div class="card"><div id="conquistasLevel" style="text-align:center; padding:20px 0;"></div><div class="progress" style="margin-top:20px; height:14px;"><i id="conquistasBar"></i></div><button class="btn btn-primary" style="margin-top:20px; width:100%" onclick="window.appGiveXP(150, 'Recompensa Diária (Simulação)')">Clique para Ganhar 150 XP!</button></div><div class="card"><b style="font-size:16px;">Benefícios de Nível</b><p style="font-size:12px; color:var(--muted); margin-top:10px;">No futuro, atingir novos níveis garantirá recursos exclusivos, emblemas para o perfil e descontos de parceiros.</p></div></div>`;
  return `<div class="card"><h2>Acesso Liberado</h2><p style="color:var(--muted);margin-top:8px;">Página renderizada de forma super rápida e nativa.</p></div>`;
}

window.appLoadPage = async (name) => {
  if(!name) name = 'home';
  
  try {
    const url = new URL(window.location);
    url.searchParams.set('page', name);
    window.history.pushState({}, '', url);
  } catch(e) {}

  document.querySelectorAll('.nav button').forEach(b => { if(b) b.classList.toggle('active', b.dataset.page === name) });
  
  const pageContainer = document.getElementById('pageContainer');
  const homeView = document.getElementById('homeView');
  if(!pageContainer || !homeView) return;

  if(name === 'home' || getUid() === 'default_user'){
    homeView.style.display = 'block'; pageContainer.style.display = 'none';
    if(name !== 'home') appOpenAuthModal();
    homeView.innerHTML = getPageHTML('home');
    return;
  }
  
  homeView.style.display = 'none'; pageContainer.style.display = 'block';
  pageContainer.innerHTML = getPageHTML(name); 

  try { if(name === 'dashboard') renderDashboard(); } catch(e){}
  try { if(name === 'perfil') renderPerfil(); } catch(e){}
  try { if(name === 'relatorios') renderRelatorios(); } catch(e){}
  try { if(name === 'conquistas') renderConquistas(); } catch(e){}
};

function updateHeader(){
  const av = document.getElementById('avatar');
  if(getUid() !== 'default_user'){
    const loginBtn = document.getElementById('topLoginBtn');
    const logoutBtn = document.getElementById('btnLogout');
    if(loginBtn) loginBtn.style.display = 'none';
    if(logoutBtn) logoutBtn.style.display = 'block';
    
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
    { title: 'Economia Potencial', desc: 'Identificamos que 18% dos seus gastos ocorrem aos sábados à noite. Evitar fast-food noturno pode poupar R$ 250/mês.', icon: '💰', premium: false },
    { title: 'Consistência de Hábitos', desc: 'Você está no top 15% de usuários ativos esta semana. A prática de "Leitura" salvou seu streak 3 vezes.', icon: '🔥', premium: false },
    { title: 'Correlação de Humor (Avançado)', desc: 'Sempre que seu humor está "Ruim", seus gastos com "Delivery" sobem 45%. Cuidado emocional reflete no bolso.', icon: '🧠', premium: true },
    { title: 'DNA Comportamental (Projeção)', desc: 'Padrão Coruja: Você rende mais à noite. Sugerimos agendar tarefas pesadas após as 19h para aproveitar seu pico de energia natural.', icon: '🧬', premium: true }
  ];
  insights.forEach(ins => {
    if(ins.premium && !state.user.premium){
      list.innerHTML += `<div class="card" style="opacity:0.6; border-color:var(--primary)"><b>${ins.icon} ${ins.title}</b><p style="font-size:12px;margin-top:8px;">🔒 Recurso Exclusivo Premium. Desbloqueie sua conta para visualizar correlações comportamentais avançadas.</p></div>`;
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

// --- Funções Auth ---
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


// ============================================
// BOOT PRINCIPAL (ARQUITETURA NÃO-BLOQUEANTE)
// ============================================
loadState();
initAuthListener((user)=>{
  let initialPage = 'dashboard';
  try {
    const params = new URLSearchParams(window.location.search);
    initialPage = params.get('page') || 'dashboard';
  } catch(e) {}

  if(user){
    // 1. Ação Instantânea: Atualiza o Estado Local 
    setUid(user.uid); 
    state.profile.email = user.email; 
    saveState();
    
    // 2. Libera a UI Imediatamente (Zero congelamento)
    window.appCloseModal('overlayAuth');
    updateHeader();
    document.documentElement.setAttribute('data-theme', state.settings.theme || 'default-light');
    window.appLoadPage(initialPage === 'home' ? 'dashboard' : initialPage);

    // 3. Puxa Banco de Dados em Background (Fire-and-forget)
    loadFullUser(user.uid).then(remote => {
        if(remote) {
            applyRemoteData(remote);
            
            // Re-renderiza a página caso o usuário já esteja nela quando os dados chegarem da nuvem
            const current = new URLSearchParams(window.location.search).get('page') || 'dashboard';
            if(current === 'dashboard') renderDashboard();
            if(current === 'perfil') renderPerfil();
            if(current === 'conquistas') renderConquistas();
        }
    }).catch(err => {
        console.warn('Banco offline ou acesso restrito.', err);
    });

  } else {
    // Tela limpa para visitante
    setUid('default_user'); 
    updateHeader(); 
    window.appLoadPage('home');
    if(initialPage !== 'home' && initialPage !== 'dashboard') {
        window.appOpenAuthModal();
    }
  }
});
