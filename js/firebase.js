// Vida+ AI - Firebase v3 FINAL - vidamaisai + ADMIN PROTECTED
// Auth Email+Google + RTDB total + admin wesleystudio@gmail.com only

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, off, remove, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut, sendPasswordResetEmail, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const ADMIN_EMAIL = "wesleystudio@gmail.com";

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

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let analytics = null;
analyticsSupported().then(supported => { if(supported){ try{ analytics = getAnalytics(app); }catch(e){} } });

let _currentUser = null;

async function createInitialUserData(uid, profile){
  const isAdmin = (profile.email||'').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const fullName = profile.name || 'Usuário';
  const parts = fullName.trim().split(' ');
  const firstName = parts[0] || fullName;
  const lastName = parts.slice(1).join(' ') || '';
  const base = {
    profile:{
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: profile.email || '',
      phone: profile.phone || '',
      photo: profile.photo || '',
      birthDate: profile.birthDate || '',
      currency: profile.currency || 'BRL',
      premium: isAdmin ? true : false, // admin sempre premium
      isAdmin: isAdmin,
      createdAt: new Date().toISOString()
    },
    user:{
      name: fullName,
      xp: 0,
      level: 1,
      joined: new Date().toISOString(),
      premium: isAdmin ? true : false
    },
    app:{
      streak: 0,
      maxStreak: 0,
      premium: isAdmin ? true : false,
      theme: 'light',
      uid: uid,
      isAdmin: isAdmin
    },
    settings:{
      theme: 'light',
      currency: 'BRL',
      notifications: true,
      language: 'pt-BR'
    },
    transactions: [],
    habits: [],
    moods: [],
    goals: [],
    _createdAt: serverTimestamp()
  };
  await set(ref(db, `vidaplus/users/${uid}`), base);
  // também garante que admin aparece na lista mesmo se já existir users antigos sem profile
  if(isAdmin){
    await set(ref(db, `admin/users/${uid}`), {email: profile.email, name: fullName, isAdmin:true, lastLogin: new Date().toISOString()});
  }
  return base;
}

async function ensureUserData(uid, firebaseUser){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(!snap.exists()){
      await createInitialUserData(uid, {
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        photo: firebaseUser.photoURL || ''
      });
    } else {
      // se existe mas não tem profile completo ou admin flag desatualizada, atualiza isAdmin
      const data = snap.val();
      const isAdmin = (firebaseUser.email||'').toLowerCase() === ADMIN_EMAIL.toLowerCase();
      if(isAdmin && !data?.profile?.isAdmin){
        await update(ref(db, `vidaplus/users/${uid}/profile`), {isAdmin:true, premium:true});
        await update(ref(db, `vidaplus/users/${uid}/app`), {isAdmin:true, premium:true});
        await update(ref(db, `vidaplus/users/${uid}/user`), {premium:true});
      }
      // garante admin/users ref para lista rápida
      if(isAdmin){
        await set(ref(db, `admin/users/${uid}`), {email: firebaseUser.email, name: data?.profile?.name || firebaseUser.displayName, isAdmin:true, lastLogin: new Date().toISOString()});
      }
    }
  }catch(e){ console.warn("[ensureUserData]", e.message); }
}

// AUTH
export function initAuthListener(callback){
  return onAuthStateChanged(auth, async (user)=>{
    _currentUser = user;
    if(user){
      await ensureUserData(user.uid, user);
      // atualiza último login
      try{ await update(ref(db, `vidaplus/users/${user.uid}/profile`), {lastLogin: new Date().toISOString()}); }catch{}
    }
    if(callback) callback(user);
    window.dispatchEvent(new CustomEvent('vidaplus:auth', {detail:{user}}));
  });
}

export async function loginEmail(email, password){
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserData(cred.user.uid, cred.user);
  return cred.user;
}
export async function signupEmail(email, password, name, extra={}){
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if(name){ await updateProfile(cred.user, {displayName: name}); }
  await createInitialUserData(cred.user.uid, {name: name || cred.user.displayName || email.split('@')[0], email: cred.user.email, phone: extra.phone||'', birthDate: extra.birthDate||''});
  return cred.user;
}
export async function loginGoogle(){
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserData(cred.user.uid, cred.user);
  return cred.user;
}
export async function logout(){ await fbSignOut(auth); _currentUser=null; }
export async function resetPassword(email){ await sendPasswordResetEmail(auth, email); }
export async function updateUserProfileData(uid, profileUpdates){
  // profileUpdates: {firstName, lastName, phone, birthDate, currency, photo, name}
  const fullName = `${profileUpdates.firstName||''} ${profileUpdates.lastName||''}`.trim() || profileUpdates.name;
  const toUpdate = {
    ...profileUpdates,
    name: fullName,
    _updatedAt: serverTimestamp()
  };
  await update(ref(db, `vidaplus/users/${uid}/profile`), toUpdate);
  if(fullName) await update(ref(db, `vidaplus/users/${uid}/user`), {name: fullName});
  // tenta atualizar Auth displayName
  try{ if(auth.currentUser && fullName) await updateProfile(auth.currentUser, {displayName: fullName}); }catch{}
  return true;
}
export async function changePassword(currentPassword, newPassword){
  const user = auth.currentUser;
  if(!user || !user.email) throw new Error("Usuário não logado");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export function getCurrentUser(){ return _currentUser || auth.currentUser; }
export function getUid(){ return getCurrentUser()?.uid || 'default_user'; }
export function isAdminEmail(email){ return (email||'').toLowerCase() === ADMIN_EMAIL.toLowerCase(); }
export function isCurrentUserAdmin(){ const u=getCurrentUser(); return u && isAdminEmail(u.email); }

// DATABASE
export async function saveCollection(uid, collectionName, data){
  const r = ref(db, `vidaplus/users/${uid}/${collectionName}`);
  await set(r, data);
  return true;
}
export async function updateUserData(uid, partial){
  const r = ref(db, `vidaplus/users/${uid}`);
  await update(r, {...partial, _updatedAt: serverTimestamp()});
}
export async function saveUserData(uid, data){
  try{ await set(ref(db, `vidaplus/users/${uid}/user`), data); return true; }catch(e){ return false; }
}
export async function syncCollection(uid, collectionName, items){
  try{ await saveCollection(uid, collectionName, items); return true; }catch(e){ return false; }
}
export async function loadCollection(uid, collectionName){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}/${collectionName}`));
    if(snap.exists()){
      const val = snap.val();
      if(Array.isArray(val)) return val;
      if(typeof val === 'object' && val !== null){
        const keys = Object.keys(val);
        if(keys.length && keys.every(k=>!isNaN(k))) return keys.map(k=>val[k]);
        return val;
      }
      return val;
    }
    return null;
  }catch(e){ return null; }
}
export async function loadFullUser(uid){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(snap.exists()) return snap.val();
    return null;
  }catch(e){ return null; }
}
export function listenCollection(uid, collectionName, callback){
  const r = ref(db, `vidaplus/users/${uid}/${collectionName}`);
  return onValue(r, (snap)=>{ callback(snap.val()); });
}

// ADMIN - apenas wesleystudio@gmail.com pode ler lista completa via regras, mas aqui tentamos também via /admin/users fallback
export async function adminListUsers(){
  try{
    // tenta lista completa
    const snap = await get(ref(db, `vidaplus/users`));
    if(snap.exists()){
      const data = snap.val();
      return Object.entries(data).map(([uid, obj])=>({
        uid,
        name: obj?.profile?.name || obj?.user?.name || 'Sem nome',
        firstName: obj?.profile?.firstName || '',
        lastName: obj?.profile?.lastName || '',
        email: obj?.profile?.email || '',
        phone: obj?.profile?.phone || '',
        xp: obj?.user?.xp || 0,
        premium: obj?.profile?.premium || obj?.app?.premium || false,
        isAdmin: obj?.profile?.isAdmin || false,
        streak: obj?.app?.streak || 0,
        joined: obj?.profile?.createdAt || '',
        lastLogin: obj?.profile?.lastLogin || '',
        ...obj
      }));
    }
    // fallback: tenta /admin/users
    const snap2 = await get(ref(db, `admin/users`));
    if(snap2.exists()){
      const d = snap2.val();
      return Object.entries(d).map(([uid, o])=>({uid, ...o, name: o.name||o.email}));
    }
    return [];
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
  }catch(e){ return false; }
}
export async function adminDeleteUser(uid){
  try{ await remove(ref(db, `vidaplus/users/${uid}`)); await remove(ref(db, `admin/users/${uid}`)).catch(()=>{}); return true; }catch(e){ return false; }
}
export async function adminSetTheme(uid, theme){
  try{ await update(ref(db, `vidaplus/users/${uid}`), {"app/theme": theme, "settings/theme": theme}); return true; }catch(e){ return false; }
}
export async function adminBroadcastTheme(theme, primary){
  try{ await set(ref(db, `admin/settings/theme`), {forced: theme, primary: primary||'#123C7A', updatedAt: serverTimestamp()}); return true; }catch(e){ return false; }
}
export async function adminSetBanner(data){
  try{ await set(ref(db, `admin/banner`), {...data, updatedAt: serverTimestamp()}); return true; }catch(e){ return false; }
}
export async function adminGetSettings(){
  try{ const snap = await get(ref(db, `admin/settings/theme`)); return snap.exists()? snap.val(): null; }catch(e){ return null; }
}

export const VidaFirebase = {
  ADMIN_EMAIL,
  getUid,
  getCurrentUser,
  isCurrentUserAdmin,
  isAdminEmail,
  initAuthListener,
  loginEmail,
  signupEmail,
  loginGoogle,
  logout,
  resetPassword,
  updateUserProfileData,
  changePassword,
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
  getStatus: ()=>({connected: !!getCurrentUser(), uid: getUid(), dbUrl: FIREBASE_DB_URL, isAdmin: isCurrentUserAdmin()})
};

console.log("[Vida+ Firebase v3] vidamaisai + admin", ADMIN_EMAIL);
