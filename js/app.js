import { db, auth, initAuthListener, ADMIN_EMAIL, ref, get, set, update, onValue } from './firebase.js';
import { appState, saveLocalState, loadLocalState, getLevelData, themes, levelTable } from './core.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Exportar para o window para as subpáginas (iframes) acessarem
window.appState = appState;
window.getLevelData = getLevelData;
window.themes = themes;

const googleProvider = new GoogleAuthProvider();

// Sincronização com Firebase
async function syncWithFirebase(user) {
    const snap = await get(ref(db, `vidaplus/users/${user.uid}`));
    if (snap.exists()) {
        const data = snap.val();
        appState.user = { ...appState.user, ...data.user };
        appState.profile = { ...appState.profile, ...data.profile };
        appState.isLoaded = true;
        saveLocalState();
        if (window.onAppStateUpdate) window.onAppStateUpdate();
    }
}

// Funções Globais para o App
window.addXP = async (amount) => {
    appState.user.xp = (appState.user.xp || 0) + amount;
    const lvl = getLevelData(appState.user.xp);
    appState.user.level = lvl.current.level;
    saveLocalState();
    if (auth.currentUser) {
        await update(ref(db, `vidaplus/users/${auth.currentUser.uid}/user`), { xp: appState.user.xp, level: appState.user.level });
    }
    if (window.onAppStateUpdate) window.onAppStateUpdate();
};

window.updateProfile = async (data) => {
    appState.profile = { ...appState.profile, ...data };
    saveLocalState();
    if (auth.currentUser) {
        await update(ref(db, `vidaplus/users/${auth.currentUser.uid}/profile`), appState.profile);
    }
    if (window.onAppStateUpdate) window.onAppStateUpdate();
};

window.appToggleTheme = () => {
    let current = appState.settings.theme || 'default-light';
    let [base, mode] = current.split('-');
    let nextMode = mode === 'light' ? 'dark' : 'light';
    let nextTheme = `${base}-${nextMode}`;
    appState.settings.theme = nextTheme;
    document.documentElement.setAttribute('data-theme', nextTheme);
    saveLocalState();
};

window.appSelectTheme = async (baseId) => {
    const themeDef = themes[baseId];
    if (themeDef.premium && !appState.user.premium) {
        if (appState.user.coins >= 500) {
            if (confirm(`Deseja desbloquear o tema ${themeDef.label} por 500 moedas?`)) {
                appState.user.coins -= 500;
                appState.user.premium = true;
                await window.addXP(0); // Forçar sync de moedas/premium
            } else return;
        } else {
            alert("Moedas insuficientes! Assista anúncios para ganhar mais.");
            return;
        }
    }
    let mode = appState.settings.theme.split('-')[1] || 'light';
    appState.settings.theme = `${baseId}-${mode}`;
    document.documentElement.setAttribute('data-theme', appState.settings.theme);
    saveLocalState();
};

// Auth
window.loginEmail = (email, pass) => signInWithEmailAndPassword(auth, email, pass);
window.signupEmail = async (email, pass, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await update(ref(db, `vidaplus/users/${cred.user.uid}/profile`), { name, email, createdAt: new Date().toISOString() });
    return cred;
};
window.loginGoogle = () => signInWithPopup(auth, googleProvider);
window.logout = () => signOut(auth).then(() => { localStorage.clear(); location.reload(); });

// Inicialização
loadLocalState();
initAuthListener(async (user) => {
    if (user) {
        await syncWithFirebase(user);
    } else {
        appState.isLoaded = true;
    }
});

// Toast System
window.toast = (msg) => {
    const t = document.createElement('div');
    t.style = "position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:12px 24px; border-radius:30px; z-index:9999; font-size:14px; transition:0.3s; opacity:0;";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.style.opacity = "1", 10);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 3000);
};
