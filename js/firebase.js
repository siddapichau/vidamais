import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

export const googleProvider = new GoogleAuthProvider();

export async function ensureUserData(uid, firebaseUser){
  try{
    const snap = await get(ref(db, `vidaplus/users/${uid}`));
    if(!snap.exists()){
      const base = {
        profile:{
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email: firebaseUser.email,
          premium: false,
          createdAt: new Date().toISOString(),
          firstName: '',
          lastName: '',
          phone: '',
          address: '',
          photo: firebaseUser.photoURL || ''
        },
        user:{ xp:0, level:1, premium:false, coins:0, streak:0 },
        transactions: {},
        habits: {},
        moods: {},
        goals: {},
        app:{ uid, updatedAt: new Date().toISOString() }
      };
      await set(ref(db, `vidaplus/users/${uid}`), base);
    }
  }catch(e){ console.error("ensureUserData", e); }
}

export function initAuthListener(callback){
  return onAuthStateChanged(auth, async (user)=>{
    if(user){ await ensureUserData(user.uid, user); }
    if(callback) callback(user);
  });
}

// helper to convert array <-> object for RTDB
export function arrayToObj(arr){
  const obj = {};
  (arr||[]).forEach(item=>{ if(item && item.id) obj[item.id]=item; });
  return obj;
}
export function objToArray(obj){
  if(!obj) return [];
  if(Array.isArray(obj)) return obj;
  return Object.values(obj);
}

export { ref, get, set, update, onValue, serverTimestamp };
