export const STORE = {
  user: 'vidaplus_user_v5', tx: 'vidaplus_tx_v5', habits: 'vidaplus_habits_v5', moods: 'vidaplus_moods_v5',
  goals: 'vidaplus_goals_v5', app: 'vidaplus_app_v5', settings: 'vidaplus_settings_v5', profile: 'vidaplus_profile_v5'
};

export const currencies = { BRL: {code:'BRL', symbol:'R$', locale:'pt-BR'}, USD: {code:'USD', symbol:'US$', locale:'en-US'}, EUR: {code:'EUR', symbol:'€', locale:'de-DE'} };
export const themes = { light:{label:'Claro',id:'light',premium:false}, dark:{label:'Escuro',id:'dark',premium:false}, midnight:{label:'Midnight',id:'midnight',premium:true}, forest:{label:'Forest',id:'forest',premium:true} };

function generateLevels(){
  const table=[];
  for(let i=1;i<=50;i++){
    let xp=i<=10 ? (i-1)*500 : (i*1500);
    table.push({level:i, xp:xp, name:`Nível ${i}`, reward:`Bônus ${i}`, icon:'⚡'});
  }
  return table;
}
export const levelTable = generateLevels();

export let state = {
  user: {name:'', xp:0, level:1, joined:new Date().toISOString(), premium:false},
  tx: [], habits: [], moods: [], goals: [],
  settings: {theme:'light', currency:'BRL', notifications:true, language:'pt-BR'},
  app:{streak:0,maxStreak:0,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'},
  profile: {name:'', firstName:'', lastName:'', email:'', phone:'', photo:'', premium:false, currency:'BRL'}
};

export function fmtMoney(v, code){
  const c=code||state.settings.currency||'BRL';
  const curr=currencies[c]||currencies.BRL;
  try{ return new Intl.NumberFormat(curr.locale,{style:'currency',currency:curr.code}).format(v||0); }catch{ return `${curr.symbol} ${(v||0).toFixed(2)}`; }
}
export function fmtDate(d){ try{return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch{return d} }
export const todayStr = ()=> new Date().toISOString().slice(0,10);

export function getLevel(xp){ let lvl=levelTable[0]; for(let r of levelTable){ if(xp>=r.xp) lvl=r; else break;} return lvl; }
export function getNextLevel(xp){ for(let r of levelTable){ if(r.xp>xp) return r;} return {level:51,xp:xp+5000,name:'Max',icon:'♾️'}; }
export function getLevelProgress(xp){
  const curr=getLevel(xp); const next=getNextLevel(xp);
  const total=next.xp-curr.xp; const done=xp-curr.xp;
  return {curr,next,pct:total?Math.min(100,(done/total)*100):100, done,total};
}

export function loadState(){
  try{
    const parse=(k,fb)=>{ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):fb }catch{return fb} };
    const appTmp=parse(STORE.app, null);
    const isDefault = !appTmp || !appTmp.uid || appTmp.uid==='default_user';
    if(isDefault){
      state.tx=[]; state.habits=[]; state.moods=[]; state.goals=[];
      state.app={streak:0,maxStreak:0,premium:false,theme:'light',txType:'expense',uid:'default_user'};
      return true;
    }
    state.user=parse(STORE.user, {name:'', xp:0, level:1, premium:false});
    state.tx=parse(STORE.tx, []);
    state.habits=parse(STORE.habits, []);
    state.moods=parse(STORE.moods, []);
    state.goals=parse(STORE.goals, []);
    state.app={...state.app, ...parse(STORE.app, {})};
    state.settings={...state.settings, ...parse(STORE.settings, {})};
    state.profile={...state.profile, ...parse(STORE.profile, {})};
    return true;
  }catch(e){ return false; }
}

export function saveState(){
  try{
    localStorage.setItem(STORE.user, JSON.stringify(state.user));
    localStorage.setItem(STORE.tx, JSON.stringify(state.tx));
    localStorage.setItem(STORE.habits, JSON.stringify(state.habits));
    localStorage.setItem(STORE.moods, JSON.stringify(state.moods));
    localStorage.setItem(STORE.goals, JSON.stringify(state.goals));
    localStorage.setItem(STORE.app, JSON.stringify(state.app));
    localStorage.setItem(STORE.settings, JSON.stringify(state.settings));
    localStorage.setItem(STORE.profile, JSON.stringify(state.profile));
    window.dispatchEvent(new CustomEvent('vidaplus:save',{detail:{state}}));
    return true;
  }catch(e){ return false; }
}

export function applyRemoteData(remote){
  if(!remote) return false;
  let changed=false;
  try{
    if(remote.user){ state.user={...state.user,...remote.user}; changed=true; }
    if(remote.profile){ state.profile={...state.profile,...remote.profile}; state.user.name=remote.profile.name||state.user.name; changed=true; }
    if(remote.transactions){ state.tx=remote.transactions; changed=true; }
    if(remote.habits){ state.habits=remote.habits; changed=true; }
    if(remote.app){ state.app={...state.app,...remote.app}; changed=true; }
    if(changed) saveState();
    return changed;
  }catch(e){ return false; }
}

export function setUid(uid){ state.app.uid=uid; saveState(); }
export function addXP(amount){ state.user.xp=(state.user.xp||0)+amount; saveState(); }
