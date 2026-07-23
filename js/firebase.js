// Vida+ AI - Firebase v2 FINAL - vidamaisai
// Configuração REAL fornecida - Auth Email+Google + Realtime DB + Analytics
// Este arquivo é o CÉREBRO de nuvem: tudo gravado em /vidaplus/users/{uid}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, off, remove, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// CONFIG REAL - VIDAMAISAI
export const firebaseConfig = {
  apiKey: "AIzaSyB3PEDD9LwVeqSVYFkYvfl7GiXARJgLV6Q",
  authDomain: "vidamaisai.firebaseapp.com",
  databaseURL: "https://vidamaisai-default-rtdb.firebaseio.com",
  projectId: "vidamaisai",
  storageBucket: "vidamaisai.firebasestorage.app",
  messagingSenderId: "685977764265",
  appId: "1:685977764265:web:aab35e2d621856a3e6c4b8",
  measurementId: "G-2BJZ5C1F9G"
};

export const FIREBASE_DB_URL = firebaseConfig.databaseURL;

// Inicialização
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let analytics = null;
analyticsSupported().then(supported => {
  if(supported){ try{ analytics = getAnalytics(app); }catch(e){} }
});

let _currentUser = null;
let _connected = false;
let _listeners = [];

// ================= AUTH =================
export function initAuthListener(callback){
  return onAuthStateChanged(auth, (user)=>{
    _currentUser = user;
    _connected = !!user;
    console.log("[Vida+ Firebase] Auth:", user ? user.email : "deslogado");
    if(callback) callback(user);
    // dispara evento global
    window.dispatchEvent(new CustomEvent('vidaplus:auth', {detail:{user}}));
  });
}

export async function loginEmail(email, password){
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export async function signupEmail(email, password, name){
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if(name){ await updateProfile(cred.user, {displayName: name}); }
  // cria nó inicial no RTDB
  await createInitialUserData(cred.user.uid, {name: name || cred.user.displayName || email.split('@')[0], email: cred.user.email});
  return cred.user;
}
export async function loginGoogle(){
  const cred = await signInWithPopup(auth, googleProvider);
  // garante nó
  const existing = await get(ref(db, `vidaplus/users/${cred.user.uid}`));
  if(!existing.exists()){
    await createInitialUserData(cred.user.uid, {name: cred.user.displayName, email: cred.user.email, photo: cred.user.photoURL});
  }
  return cred.user;
}
export async function logout(){
  await fbSignOut(auth);
  _currentUser = null;
}
export async function resetPassword(email){
  await sendPasswordResetEmail(auth, email);
}
export function getCurrentUser(){ return _currentUser || auth.currentUser; }
export function getUid(){ return getCurrentUser()?.uid || 'default_user'; }

// Cria dados iniciais
async function createInitialUserData(uid, profile){
  const base = {
    profile:{
      name: profile.name || 'Usuário',
      email: profile.email || '',
      photo: profile.photo || '',
      premium: false,
      createdAt: new Date().toISOString()
    },
    user:{
      name: profile.name || 'Wesley',
      xp: 0,
      level: 1,
      joined: new Date().toISOString(),
      premium: false
    },
    app:{
      streak: 0,
      maxStreak: 0,
      premium: false,
      theme: 'light',
      uid: uid
    },
    settings:{
      theme: 'light',
      currency: 'BRL',
      notifications: true
    },
    transactions: [],
    habits: [],
    moods: [],
    goals: [],
    _init: true,
    _createdAt: serverTimestamp()
  };
  await set(ref(db, `vidaplus/users/${uid}`), base);
  return base;
}

// ================= DATABASE CRUD =================
// Salva coleção inteira (sobrescreve)
export async function saveCollection(uid, collectionName, data){
  const r = ref(db, `vidaplus/users/${uid}/${collectionName}`);
  await set(r, data);
  return true;
}

// Salva parcial (merge)
export async function updateUserData(uid, partial){
  const r = ref(db, `vidaplus/users/${uid}`);
  await update(r, {...partial, _updatedAt: serverTimestamp()});
}

// Para compat com código antigo
export async function saveUserData(uid, data){
  try{
    await set(ref(db, `vidaplus/users/${uid}/user`), data);
    return true;
  }catch(e){ console.warn("[saveUserData]", e.message); return false; }
}
export async function syncCollection(uid, collectionName, items){
  // collectionName pode ser transactions, habits, moods, goals, app, settings, user
  try{
    await saveCollection(uid, collectionName, items);
    return true;
  }catch(e){ 
    console.warn(`[syncCollection ${collectionName}]`, e.message);
    return false;
  }
}
export async function loadCollection(uid, collectionName){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}/${collectionName}`));
    if(snap.exists()){
      const val = snap.val();
      // Se for objeto com chaves numéricas do array, converte
      if(Array.isArray(val)) return val;
      if(typeof val === 'object' && val !== null){
        // Detecta se é array-like (0,1,2...)
        const keys = Object.keys(val);
        if(keys.length && keys.every(k=>!isNaN(k))) return keys.map(k=>val[k]);
        // Se for coleção, retorna array se for lista, senão objeto
        return val;
      }
      return val;
    }
    return null;
  }catch(e){ console.warn("[loadCollection]", e.message); return null; }
}
export async function loadFullUser(uid){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(snap.exists()) return snap.val();
    return null;
  }catch(e){ console.warn(e); return null; }
}

// Listeners em tempo real
export function listenCollection(uid, collectionName, callback){
  const r = ref(db, `vidaplus/users/${uid}/${collectionName}`);
  const unsub = onValue(r, (snap)=>{
    const val = snap.val();
    callback(val);
  });
  _listeners.push(unsub);
  return unsub;
}
export function stopAllListeners(){
  _listeners.forEach(u=>{ try{u();}catch{} });
  _listeners = [];
}

// ================= ADMIN =================
export async function adminListUsers(){
  try{
    const snap = await get(ref(db, `vidaplus/users`));
    if(!snap.exists()) return [];
    const data = snap.val();
    return Object.entries(data).map(([uid, obj])=>({
      uid,
      name: obj?.profile?.name || obj?.user?.name || 'Sem nome',
      email: obj?.profile?.email || '',
      xp: obj?.user?.xp || 0,
      premium: obj?.profile?.premium || obj?.app?.premium || obj?.user?.premium || false,
      streak: obj?.app?.streak || 0,
      joined: obj?.profile?.createdAt || obj?.user?.joined || '',
      ...obj
    }));
  }catch(e){
    console.warn("[adminListUsers]", e.message);
    return [];
  }
}
export async function adminSetPremium(uid, isPremium){
  try{
    await update(ref(db, `vidaplus/users/${uid}`), {
      "profile/premium": isPremium,
      "app/premium": isPremium,
      "user/premium": isPremium,
      "_premiumUpdatedAt": serverTimestamp()
    });
    return true;
  }catch(e){ console.warn(e); return false; }
}
export async function adminDeleteUser(uid){
  try{
    await remove(ref(db, `vidaplus/users/${uid}`));
    return true;
  }catch(e){ return false; }
}
export async function adminSetTheme(uid, theme){
  try{
    await update(ref(db, `vidaplus/users/${uid}`), {
      "app/theme": theme,
      "settings/theme": theme
    });
    return true;
  }catch(e){ return false; }
}
export async function adminBroadcastTheme(theme, primary){
  try{
    await set(ref(db, `admin/settings/theme`), {forced: theme, primary: primary || '#123C7A', updatedAt: serverTimestamp()});
    return true;
  }catch(e){ return false; }
}
export async function adminSetBanner(data){
  try{
    await set(ref(db, `admin/banner`), {...data, updatedAt: serverTimestamp()});
    return true;
  }catch(e){ return false; }
}
export async function adminGetSettings(){
  try{
    const snap = await get(ref(db, `admin/settings/theme`));
    return snap.exists() ? snap.val() : null;
  }catch(e){ return null; }
}

// Wrap para compatibilidade com código antigo
export const VidaFirebase = {
  getUid,
  getCurrentUser,
  initAuthListener,
  loginEmail,
  signupEmail,
  loginGoogle,
  logout,
  resetPassword,
  saveUserData,
  syncCollection,
  loadCollection,
  loadFullUser,
  listenCollection,
  adminListUsers,
  adminSetPremium,
  adminDeleteUser,
  adminSetTheme,
  adminBroadcastTheme,
  adminSetBanner,
  adminGetSettings,
  getStatus: ()=>({connected: !!getCurrentUser(), uid: getUid(), dbUrl: FIREBASE_DB_URL})
};

// Auto init
console.log("[Vida+ Firebase] Inicializado:", FIREBASE_DB_URL);
