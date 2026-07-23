// Vida+ AI - APP v6 - Fluxo corrigido
import { state, themes, currencies, levelTable, defaultCategories, moodMap, fmtMoney, fmtDate, todayStr, getLevel, getNextLevel, getLevelProgress, loadState, saveState, addXP, calcStreak, calcHabitRate, calcLifeScore, generateInsights, seedHabits, ensureSeed, applyRemoteData, setUid } from './core.js';
import { VidaFirebase, FIREBASE_DB_URL, auth } from './firebase.js';
import { initAuthListener, loginEmail as fbLoginEmail, signupEmail as fbSignupEmail, loginGoogle as fbLoginGoogle, logout as fbLogout, resetPassword, updateUserProfileData, changePassword as fbChangePassword, loadFullUser, getUid } from './firebase.js';

// ... (funções toast, confetti, expose, etc. permanecem iguais)

// ====== EVENTO DE AUTENTICAÇÃO ======
window.addEventListener('vidaplus:auth', async (e)=>{
  const user = e.detail.user;
  const authOverlay = document.getElementById('overlayAuth');
  if (user) {
    // Usuário logado
    setUid(user.uid);
    state.profile.email = user.email;
    if (user.displayName && !state.profile.firstName) {
      const p = user.displayName.split(' ');
      state.profile.firstName = p[0];
      state.profile.lastName = p.slice(1).join(' ');
      state.profile.name = user.displayName;
    }
    if (user.photoURL) state.profile.photo = user.photoURL;
    state.user.name = state.profile.firstName || state.profile.name || user.email.split('@')[0];
    saveState();
    if (authOverlay) {
      authOverlay.classList.remove('open');
      authOverlay.style.display = 'none';
    }
    updateHeader();
    await pullFromFirebase();
    renderCurrentPage();
    if (!state.profile.firstName || !state.profile.lastName) {
      const cp = document.getElementById('overlayCompleteProfile');
      if (cp) {
        document.getElementById('completeFirstName').value = state.profile.firstName || '';
        document.getElementById('completeLastName').value = state.profile.lastName || '';
        document.getElementById('completePhone').value = state.profile.phone || '';
        cp.classList.add('open');
      }
    }
    toast(`Bem-vindo, ${state.profile.firstName || state.user.name}!`, '👋');
  } else {
    // Usuário deslogado: limpa tudo e mostra login
    setUid('default_user');
    loadState(true); // força limpeza total
    updateHeader();
    renderCurrentPage();
    openAuthModal();
  }
});

// ====== INICIALIZAÇÃO ======
export function initApp(){
  // NÃO CARREGA ESTADO AQUI – o listener fará isso
  const params = new URLSearchParams(location.search);
  const page = params.get('page') || params.get('id') || 'dashboard';
  initAuthListener(()=>{});
  document.querySelectorAll('.overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
  });
  loadPage(page);
  const forced = localStorage.getItem('vidaplus_forced_theme');
  document.documentElement.setAttribute('data-theme', forced || state.settings.theme || 'light');
  console.log('[Vida+ AI] Iniciado com listener de autenticação.');
}

// ... (restante das funções de renderização, etc.)