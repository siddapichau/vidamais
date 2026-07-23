// Vida+ AI - Firebase Integration (Realtime Database)
// URL fornecida: https://rodadosabor-default-rtdb.firebaseio.com/
// Este módulo tenta integrar via REST API + Firebase SDK (compat) e faz fallback para localStorage se permissão negada

export const FIREBASE_DB_URL = "https://rodadosabor-default-rtdb.firebaseio.com";

// Config mínima - tente completar com credenciais reais do projeto rodasabor no console
// Se você tiver apiKey, authDomain etc, cole abaixo para desbloquear SDK completo
export const firebaseConfig = {
  apiKey: "AIzaSyDUMMY-RODA-SABOR-PLACEHOLDER",
  authDomain: "rodadosabor.firebaseapp.com",
  databaseURL: FIREBASE_DB_URL,
  projectId: "rodadosabor",
  storageBucket: "rodadosabor.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:placeholder"
};

// Estado de conexão
let _connected = false;
let _sdkApp = null;
let _db = null;
let _lastError = null;

export function setFirebaseConfig(custom){
  Object.assign(firebaseConfig, custom);
}

// Tenta inicializar SDK via CDN import se disponível (carregado em index.html via compat)
export async function initFirebaseSDK(){
  try{
    if(typeof window !== 'undefined' && window.firebase && window.firebase.initializeApp){
      if(!window.firebase.apps.length){
        _sdkApp = window.firebase.initializeApp(firebaseConfig);
      } else {
        _sdkApp = window.firebase.app();
      }
      _db = window.firebase.database();
      _connected = true;
      console.log("[Vida+ Firebase] SDK conectado:", FIREBASE_DB_URL);
      return true;
    }
  }catch(e){
    _lastError = e.message;
    console.warn("[Vida+ Firebase] falha SDK", e);
  }
  return false;
}

// REST helpers (funciona mesmo sem apiKey se rules públicas ou com auth token)
export async function restGet(path){
  try{
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(data && data.error) throw new Error(data.error);
    return data;
  }catch(e){
    _lastError = e.message;
    // throw to allow fallback
    throw e;
  }
}
export async function restSet(path, value){
  try{
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`,{
      method:'PUT',
      body: JSON.stringify(value),
      headers:{'Content-Type':'application/json'}
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(data && data.error) throw new Error(data.error);
    return data;
  }catch(e){
    _lastError = e.message;
    throw e;
  }
}
export async function restPush(path, value){
  try{
    const res = await fetch(`${FIREBASE_DB_URL}/${path}.json`,{
      method:'POST',
      body: JSON.stringify(value),
      headers:{'Content-Type':'application/json'}
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(e){
    _lastError = e.message;
    throw e;
  }
}

// Wrapper de alto nível - tenta SDK primeiro, depois REST, senão fallback
export const VidaFirebase = {
  async getUserData(uid="default_user"){
    // Tenta SDK Realtime
    if(_db){
      try{
        const snap = await _db.ref(`vidaplus/users/${uid}`).once('value');
        return snap.val();
      }catch(e){ console.warn(e) }
    }
    // Tenta REST
    try{
      return await restGet(`vidaplus/users/${uid}`);
    }catch(e){
      console.warn("[Vida+ Firebase] getUserData offline fallback", e.message);
      return null;
    }
  },
  async saveUserData(uid, data){
    const payload = {...data, _syncAt: new Date().toISOString(), _source:'web'};
    if(_db){
      try{ await _db.ref(`vidaplus/users/${uid}`).set(payload); _connected=true; return true; }catch(e){}
    }
    try{ await restSet(`vidaplus/users/${uid}`, payload); _connected=true; return true; }catch(e){
      console.warn("[Firebase] save offline, mantendo localStorage", e.message);
      return false;
    }
  },
  async syncCollection(uid, collectionName, items){
    // collectionName: transactions, habits, moods, goals, settings
    const path = `vidaplus/users/${uid}/${collectionName}`;
    try{
      if(_db){ await _db.ref(path).set(items); return true; }
      await restSet(path, items);
      return true;
    }catch(e){
      console.warn(`[Firebase] sync ${collectionName} falhou`, e.message);
      return false;
    }
  },
  async loadCollection(uid, collectionName){
    const path = `vidaplus/users/${uid}/${collectionName}`;
    try{
      if(_db){
        const snap = await _db.ref(path).once('value');
        const val = snap.val();
        if(val) return Array.isArray(val) ? val : Object.values(val);
      }
      const data = await restGet(path);
      if(data) return Array.isArray(data) ? data : Object.values(data);
    }catch(e){}
    return null;
  },
  // Admin: listar todos os usuários (requer rules liberadas)
  async adminListUsers(){
    try{
      const data = await restGet(`vidaplus/users`);
      if(!data) return [];
      return Object.entries(data).map(([id, val])=>({id, ...val}));
    }catch(e){
      console.warn("[adminListUsers] erro", e.message);
      return [];
    }
  },
  async adminSetPremium(uid, isPremium){
    try{
      const path = `vidaplus/users/${uid}/premium`;
      if(_db) await _db.ref(path).set(isPremium);
      else await restSet(path, isPremium);
      return true;
    }catch(e){ return false; }
  },
  getStatus(){ return {connected:_connected, lastError:_lastError, dbUrl:FIREBASE_DB_URL} }
};

// Auto init quando importado no browser
if(typeof window !== 'undefined'){
  // tenta carregar Firebase SDK via script tag se ainda não houver
  window.addEventListener('load', ()=>{
    // se firebase compat já carregado no HTML, init
    if(window.firebase) initFirebaseSDK();
  });
}
