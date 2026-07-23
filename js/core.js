export const STORE = {
  user: 'vidaplus_user_v6', profile: 'vidaplus_profile_v6', app: 'vidaplus_app_v6', settings: 'vidaplus_settings_v6'
};

export const themes = { 
  light:{label:'Claro',id:'light'}, dark:{label:'Escuro',id:'dark'}, 
  dracula:{label:'Dracula',id:'dracula', premium:true}, cyberpunk:{label:'Cyberpunk',id:'cyberpunk', premium:true},
  lofi:{label:'Lo-Fi',id:'lofi'}, aurora:{label:'Aurora',id:'aurora', premium:true}
};

export let state = {
  user: {name:'', xp:0, level:1, premium:false},
  tx: [], habits: [], moods: [], goals: [],
  settings: {theme:'light', currency:'BRL'},
  app: {uid:'default_user'},
  profile: {name:'', firstName:'', lastName:'', email:'', phone:'', address:'', photo:'', currency:'BRL'}
};

export function loadState(){
  try{
    const parse=(k,fb)=>{ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):fb }catch{return fb} };
    const appTmp=parse(STORE.app, null);
    if(!appTmp || appTmp.uid==='default_user'){
      state.app={uid:'default_user'}; return true;
    }
    state.user=parse(STORE.user, {name:'', xp:0, level:1, premium:false});
    state.settings={...state.settings, ...parse(STORE.settings, {})};
    state.profile={...state.profile, ...parse(STORE.profile, {})};
    return true;
  }catch(e){ return false; }
}

export function saveState(){
  try{
    localStorage.setItem(STORE.user, JSON.stringify(state.user));
    localStorage.setItem(STORE.settings, JSON.stringify(state.settings));
    localStorage.setItem(STORE.profile, JSON.stringify(state.profile));
    localStorage.setItem(STORE.app, JSON.stringify(state.app));
    return true;
  }catch(e){ return false; }
}

export function setUid(uid){ state.app.uid=uid; saveState(); }
export function applyRemoteData(remote){
  if(remote.profile) state.profile = {...state.profile, ...remote.profile};
  if(remote.settings) state.settings = {...state.settings, ...remote.settings};
  saveState();
}
