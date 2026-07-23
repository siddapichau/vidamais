// Vida+ AI - Firebase v4 BULLETPROOF - Mobile + Admin
// Corrige travamento login, adiciona Redirect fallback para celular, mensagens detalhadas RTDB
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getDatabase, ref, set, get, push, onValue, remove, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as fbSignOut, sendPasswordResetEmail, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

setPersistence(auth, browserLocalPersistence).catch(()=>{});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let analytics = null;
analyticsSupported().then(s=>{ if(s){ try{ analytics=getAnalytics(app);}catch{} } });

let _currentUser = null;

// Cria dados iniciais usuário
async function createInitialUserData(uid, profile){
  const isAdmin = (profile.email||'').toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const fullName = profile.name || 'Usuário';
  const parts = fullName.trim().split(' ');
  const base = {
    profile:{
      name: fullName,
      firstName: parts[0]||fullName,
      lastName: parts.slice(1).join(' ')||'',
      email: profile.email||'',
      phone: profile.phone||'',
      photo: profile.photo||'',
      birthDate: profile.birthDate||'',
      currency: profile.currency||'BRL',
      premium: isAdmin?true:false,
      isAdmin: isAdmin,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    },
    user:{ name: fullName, xp:0, level:1, joined: new Date().toISOString(), premium: isAdmin?true:false },
    app:{ streak:0, maxStreak:0, premium: isAdmin?true:false, theme:'light', uid:uid, isAdmin:isAdmin },
    settings:{ theme:'light', currency:'BRL', notifications:true, language:'pt-BR' },
    transactions: [],
    habits: [],
    moods: [],
    goals: [],
    _createdAt: serverTimestamp()
  };
  try{
    await set(ref(db, `vidaplus/users/${uid}`), base);
    if(isAdmin){
      await set(ref(db, `admin/users/${uid}`), {email: profile.email, name: fullName, isAdmin:true, lastLogin: new Date().toISOString()}).catch(()=>{});
    }
  }catch(e){ console.error("[createInitialUserData] RTDB write failed:", e.message); throw e; }
  return base;
}

async function ensureUserData(uid, firebaseUser){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(!snap.exists()){
      await createInitialUserData(uid, { name: firebaseUser.displayName||firebaseUser.email.split('@')[0], email: firebaseUser.email, photo: firebaseUser.photoURL||'' });
    }else{
      const data=snap.val();
      const isAdmin=(firebaseUser.email||'').toLowerCase()===ADMIN_EMAIL.toLowerCase();
      if(isAdmin && !data?.profile?.isAdmin){
        await update(ref(db, `vidaplus/users/${uid}/profile`), {isAdmin:true, premium:true}).catch(()=>{});
        await update(ref(db, `vidaplus/users/${uid}/app`), {isAdmin:true, premium:true}).catch(()=>{});
      }
      if(isAdmin){
        await set(ref(db, `admin/users/${uid}`), {email: firebaseUser.email, name: data?.profile?.name||firebaseUser.displayName, isAdmin:true, lastLogin: new Date().toISOString()}).catch(()=>{});
      }
      await update(ref(db, `vidaplus/users/${uid}/profile`), {lastLogin: new Date().toISOString()}).catch(()=>{});
    }
  }catch(e){
    console.warn("[ensureUserData] RTDB error:", e.code, e.message);
    if(e.message.includes('permission_denied') || e.code==='PERMISSION_DENIED'){
      console.error("⚠️ REGRA RTDB BLOQUEANDO! Use regra com admin email: ", ADMIN_EMAIL);
    }
  }
}

// AUTH LISTENER COM REDIRECT RESULT PARA CELULAR
export function initAuthListener(callback){
  // Verifica se voltou de redirect (celular)
  getRedirectResult(auth).then(async (result)=>{
    if(result && result.user){
      console.log("[Firebase] Redirect login OK:", result.user.email);
      await ensureUserData(result.user.uid, result.user);
      // Dispara evento para o app
      window.dispatchEvent(new CustomEvent('vidaplus:auth', {detail:{user: result.user}}));
    }
  }).catch(e=>{
    console.warn("[getRedirectResult]", e.message);
  });

  return onAuthStateChanged(auth, async (user)=>{
    console.log("[Firebase] onAuthStateChanged:", user?.email || 'null');
    _currentUser=user;
    if(user){
      try{ await ensureUserData(user.uid, user); }catch(e){ console.warn(e); }
    }
    if(callback) callback(user);
    window.dispatchEvent(new CustomEvent('vidaplus:auth', {detail:{user}}));
  });
}

export async function loginEmail(email, password){
  try{
    const cred=await signInWithEmailAndPassword(auth, email, password);
    await ensureUserData(cred.user.uid, cred.user);
    return cred.user;
  }catch(e){
    console.error("[loginEmail]", e.code, e.message);
    throw e;
  }
}
export async function signupEmail(email, password, name, extra={}){
  try{
    const cred=await createUserWithEmailAndPassword(auth, email, password);
    if(name){ try{ await updateProfile(cred.user, {displayName:name}); }catch{} }
    await createInitialUserData(cred.user.uid, { name: name||email.split('@')[0], email: cred.user.email, phone: extra.phone||'', currency: extra.currency||'BRL' });
    return cred.user;
  }catch(e){
    console.error("[signupEmail]", e.code, e.message);
    throw e;
  }
}
export async function loginGoogle(){
  try{
    // Tenta popup primeiro (desktop)
    const cred=await signInWithPopup(auth, googleProvider);
    await ensureUserData(cred.user.uid, cred.user);
    return cred.user;
  }catch(e){
    console.warn("[loginGoogle popup failed]", e.code, e.message);
    if(e.code==='auth/popup-blocked' || e.code==='auth/popup-closed-by-user' || /mobile|android|iphone|ipad/i.test(navigator.userAgent)){
      try{
        await signInWithRedirect(auth, googleProvider);
        return null;
      }catch(e2){
        console.error("[loginGoogle redirect failed]", e2.code, e2.message);
        throw e2;
      }
    }
    throw e;
  }
}
export async function logout(){ await fbSignOut(auth); _currentUser=null; }
export async function resetPassword(email){ await sendPasswordResetEmail(auth, email); }

export async function updateUserProfileData(uid, profileUpdates){
  const fullName = `${profileUpdates.firstName||''} ${profileUpdates.lastName||''}`.trim() || profileUpdates.name;
  const toUpdate = { ...profileUpdates, name: fullName, _updatedAt: serverTimestamp() };
  await update(ref(db, `vidaplus/users/${uid}/profile`), toUpdate);
  if(fullName) await update(ref(db, `vidaplus/users/${uid}/user`), {name: fullName}).catch(()=>{});
  try{ if(auth.currentUser && fullName) await updateProfile(auth.currentUser, {displayName: fullName}); }catch{}
  return true;
}
export async function changePassword(currentPassword, newPassword){
  const user=auth.currentUser;
  if(!user||!user.email) throw new Error("Não logado");
  const cred=EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export function getCurrentUser(){ return _currentUser||auth.currentUser; }
export function getUid(){ return getCurrentUser()?.uid||'default_user'; }
export function isAdminEmail(email){ return (email||'').toLowerCase()===ADMIN_EMAIL.toLowerCase(); }
export function isCurrentUserAdmin(){ const u=getCurrentUser(); return u && isAdminEmail(u.email); }

// DATABASE
export async function saveCollection(uid, collectionName, data){
  try{
    const r=ref(db, `vidaplus/users/${uid}/${collectionName}`);
    await set(r, data);
    return true;
  }catch(e){
    console.error(`[saveCollection ${collectionName}]`, e.code, e.message);
    if(e.code==='PERMISSION_DENIED') throw new Error(`RTDB permissão negada em ${collectionName}. Verifique Rules com seu email admin.`);
    throw e;
  }
}
export async function loadFullUser(uid){
  try{
    const snap=await get(ref(db, `vidaplus/users/${uid}`));
    if(snap.exists()) return snap.val();
    return null;
  }catch(e){
    console.error("[loadFullUser]", e.code, e.message);
    throw e;
  }
}
export async function loadCollection(uid, collectionName){
  try{
    const snap=await get(ref(db, `vidaplus/users/${uid}/${collectionName}`));
    if(snap.exists()){
      const val=snap.val();
      if(Array.isArray(val)) return val;
      if(typeof val==='object' && val!==null){
        const keys=Object.keys(val);
        if(keys.length && keys.every(k=>!isNaN(k))) return keys.map(k=>val[k]);
        return val;
      }
      return val;
    }
    return null;
  }catch(e){ console.warn("[loadCollection]", e.message); return null; }
}

// ADMIN
export async function adminListUsers(){
  try{
    const snap=await get(ref(db, `vidaplus/users`));
    if(snap.exists()){
      const data=snap.val();
      return Object.entries(data).map(([uid,obj])=>({
        uid,
        name: obj?.profile?.name||obj?.user?.name||'Sem nome',
        firstName: obj?.profile?.firstName||'',
        lastName: obj?.profile?.lastName||'',
        email: obj?.profile?.email||'',
        phone: obj?.profile?.phone||'',
        xp: obj?.user?.xp||0,
        premium: obj?.profile?.premium||obj?.app?.premium||false,
        isAdmin: obj?.profile?.isAdmin||false,
        streak: obj?.app?.streak||0,
        joined: obj?.profile?.createdAt||'',
        lastLogin: obj?.profile?.lastLogin||'',
        ...obj
      }));
    }
    const snap2=await get(ref(db, `admin/users`));
    if(snap2.exists()){
      const d=snap2.val();
      return Object.entries(d).map(([uid,o])=>({uid, ...o, name: o.name||o.email}));
    }
    return [];
  }catch(e){
    console.error("[adminListUsers] RTDB error:", e.code, e.message);
    if(e.code==='PERMISSION_DENIED'){
      throw new Error(`PERMISSION_DENIED: Sua regra RTDB está bloqueando leitura de vidaplus/users. Use regra com seu email ${ADMIN_EMAIL}. Erro: ${e.message}`);
    }
    throw e;
  }
}
export async function adminSetPremium(uid, isPremium){
  try{
    await update(ref(db, `vidaplus/users/${uid}`), {"profile/premium":isPremium,"app/premium":isPremium,"user/premium":isPremium,_premiumUpdatedAt:serverTimestamp()});
    return true;
  }catch(e){ console.error(e); return false; }
}
export async function adminDeleteUser(uid){
  try{ await remove(ref(db, `vidaplus/users/${uid}`)); await remove(ref(db, `admin/users/${uid}`)).catch(()=>{}); return true; }catch(e){ return false; }
}
export async function adminBroadcastTheme(theme, primary){
  try{ await set(ref(db, `admin/settings/theme`), {forced:theme, primary:primary||'#123C7A', updatedAt:serverTimestamp()}); return true; }catch(e){ console.error(e); return false; }
}
export async function adminSetBanner(data){
  try{ await set(ref(db, `admin/banner`), {...data, updatedAt:serverTimestamp()}); return true; }catch(e){ return false; }
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
  saveCollection,
  syncCollection: saveCollection,
  loadCollection,
  loadFullUser,
  adminListUsers,
  adminSetPremium,
  adminDeleteUser,
  adminBroadcastTheme,
  adminSetBanner,
  getStatus: ()=>({connected: !!getCurrentUser(), uid: getUid(), dbUrl: FIREBASE_DB_URL, isAdmin: isCurrentUserAdmin()})
};

console.log("[Vida+ Firebase v4 BULLETPROOF] Admin:", ADMIN_EMAIL, "DB:", FIREBASE_DB_URL);