import { state, saveState, loadState, themes, addXP, loadConfigFromFirebase } from './core.js';
import { db, auth, initAuthListener, logout } from './firebase.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// AdMob Config
let admobConfig = {
    appOpenId: '',
    bannerId: '',
    rewardedId: ''
};

async function loadAdMob() {
    const snap = await get(ref(db, 'admin/admob'));
    if (snap.exists()) admobConfig = snap.val();
    console.log("AdMob Configurado:", admobConfig);
}

window.showRewardedAd = () => {
    alert("Simulando Vídeo Premiado... +50 Moedas!");
    state.user.coins = (state.user.coins || 0) + 50;
    saveState();
    if (window.updateUI) window.updateUI();
};

window.appToggleTheme = () => {
  let current = document.documentElement.getAttribute('data-theme') || 'default-light';
  let [base, mode] = current.split('-');
  let nextMode = mode === 'light' ? 'dark' : 'light';
  let nextTheme = `${base}-${nextMode}`;
  
  document.documentElement.setAttribute('data-theme', nextTheme);
  state.settings.theme = nextTheme;
  saveState();
};

window.appSelectTheme = (baseId) => {
    const themeDef = themes[baseId];
    if (themeDef.premium && !state.user.premium) {
        if (confirm("Este é um tema Premium. Deseja comprar por 500 moedas?")) {
            if (state.user.coins >= 500) {
                state.user.coins -= 500;
                state.user.premium = true; // No exemplo simplificado, libera premium
                saveState();
            } else {
                alert("Moedas insuficientes!");
                return;
            }
        } else {
            return;
        }
    }
    let current = document.documentElement.getAttribute('data-theme') || 'default-light';
    let mode = current.split('-')[1] || 'light';
    let newTheme = `${baseId}-${mode}`;
    document.documentElement.setAttribute('data-theme', newTheme);
    state.settings.theme = newTheme;
    saveState();
};

// Initialize
async function init() {
    await loadConfigFromFirebase();
    await loadAdMob();
    loadState();
    
    initAuthListener((user) => {
        if (user) {
            state.profile.email = user.email;
            saveState();
        }
    });
}

init();
