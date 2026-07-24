import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut as fbSignOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const ADMIN_EMAIL = "wesleystudio@gmail.com";

export const firebaseConfig = {
  apiKey: "AIzaSyB3PEDD9LwVeqSVYFkYvfl7GiXARJgLV6Q",
  authDomain: "vidamaisai.firebaseapp.com",
  databaseURL: "https://vidamaisai-default-rtdb.firebaseio.com",
  projectId: "vidamaisai",
  storageBucket: "vidamaisai.firebasestorage.app",
  messagingSenderId: "685977764265",
  appId: "1:685977764265:web:aab35e2d621856a3e6c4b8"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(()=>{});
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let _currentUser = null;

async function ensureUserData(uid, firebaseUser){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(!snap.exists()){
      const base = {
        profile:{ name: firebaseUser.displayName||firebaseUser.email.split('@')[0], email: firebaseUser.email, premium: false, createdAt: new Date().toISOString() },
        user:{ xp:0, level:1, premium: false },
        app:{ uid:uid }
      };
      await set(ref(db, `vidaplus/users/${uid}`), base);
    }
  }catch(e){}
}

export function initAuthListener(callback){
  getRedirectResult(auth).then(async (result)=>{
    if(result && result.user){ await ensureUserData(result.user.uid, result.user); }
  }).catch(()=>{});

  return onAuthStateChanged(auth, async (user)=>{
    _currentUser=user;
    if(user){ try{ await ensureUserData(user.uid, user); }catch(e){} }
    if(callback) callback(user);
  });
}

export async function loginEmail(email, password){
  const cred=await signInWithEmailAndPassword(auth, email, password);
  await ensureUserData(cred.user.uid, cred.user);
  return cred.user;
}
export async function signupEmail(email, password, name){
  const cred=await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserData(cred.user.uid, cred.user);
  return cred.user;
}
export async function loginGoogle(){
  try{
    const cred=await signInWithPopup(auth, googleProvider);
    await ensureUserData(cred.user.uid, cred.user);
    return cred.user;
  }catch(e){
    if(e.code==='auth/popup-blocked' || /mobile|android|iphone/i.test(navigator.userAgent)){
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw e;
  }
}
export async function logout(){
  await fbSignOut(auth);
  Object.keys(localStorage).forEach(k=>{ if(k.startsWith('vidaplus_')) localStorage.removeItem(k); });
  location.reload();
}

export function getUid(){ return _currentUser?.uid||'default_user'; }
export async function loadFullUser(uid){
  try{ const snap=await get(ref(db, `vidaplus/users/${uid}`)); return snap.exists()? snap.val():null; }catch(e){ return null; }
}
export async function saveCollection(uid, collectionName, data){
  try{ await set(ref(db, `vidaplus/users/${uid}/${collectionName}`), data); return true; }catch(e){ return false; }
}

// Lógica de Admin para listar usuários e ler temas
export const VidaFirebase = { 
  adminListUsers: async()=>{
    try{
      const snap=await get(ref(db, `vidaplus/users`));
      if(snap.exists()){
        return Object.entries(snap.val()).map(([uid,obj])=>({
          uid,
          name: obj?.profile?.name||'Sem nome',
          email: obj?.profile?.email||'',
          phone: obj?.profile?.phone||'',
          xp: obj?.user?.xp||0,
          premium: obj?.profile?.premium||false
        }));
      }
      return [];
    }catch(e){ throw e; }
  },
  adminGetConfig: async()=>{
    try{ const snap=await get(ref(db, `admin/config`)); return snap.exists() ? snap.val() : {}; }catch(e){ return {}; }
  },
  adminSaveConfig: async(config)=>{
    try{ await update(ref(db, `admin/config`), config); return true; }catch(e){ throw e; }
  },
  syncCollection: saveCollection 
};
