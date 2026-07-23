import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
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

// Roda em Background (Fire-and-forget) - Sem AWAIT fatal que trava o PC
function ensureUserData(uid, firebaseUser){
  get(ref(db, `vidaplus/users/${uid}`)).then(snap => {
    if(!snap.exists()){
      const base = {
        profile:{ name: firebaseUser.displayName||firebaseUser.email.split('@')[0], email: firebaseUser.email, premium: false, createdAt: new Date().toISOString() },
        user:{ xp:0, level:1, premium: false },
        app:{ uid:uid }
      };
      set(ref(db, `vidaplus/users/${uid}`), base).catch(()=>{});
    }
  }).catch(()=>{});
}

export function initAuthListener(callback){
  getRedirectResult(auth).then((result)=>{
    if(result && result.user){ ensureUserData(result.user.uid, result.user); }
  }).catch(()=>{});

  return onAuthStateChanged(auth, (user)=>{
    _currentUser=user;
    if(user){ ensureUserData(user.uid, user); }
    if(callback) callback(user); // Callback imediato liberando a tela!
  });
}

export async function loginEmail(email, password){
  const cred=await signInWithEmailAndPassword(auth, email, password);
  ensureUserData(cred.user.uid, cred.user); 
  return cred.user;
}

export async function signupEmail(email, password, name){
  const cred=await createUserWithEmailAndPassword(auth, email, password);
  ensureUserData(cred.user.uid, cred.user);
  return cred.user;
}

export async function loginGoogle(){
  try{
    const cred=await signInWithPopup(auth, googleProvider);
    ensureUserData(cred.user.uid, cred.user);
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
  syncCollection: saveCollection 
};
