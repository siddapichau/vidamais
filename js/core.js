export const STORE = {
  user: 'vidaplus_user_v8', profile: 'vidaplus_profile_v8', settings: 'vidaplus_settings_v8'
};

// 50 Níveis - Curva de 1 ano para o nível 50
export function generateDefaultLevels(){
  const names = ['Despertar','Foco','Constância','Hábito','Evolução','Mestre','Lenda','Supremo'];
  const table = [];
  for(let i=1; i<=50; i++){
    // Nível 50 ~ 78k XP (curva suave)
    let xp = i === 1 ? 0 : Math.round(Math.pow(i, 2.45) * 5.2); 
    let nameIdx = Math.floor((i-1)/7);
    let name = (names[nameIdx] || 'Transcendente') + ' ' + ( (i%7 === 0 ? 7 : i%7) );
    table.push({level: i, xp: xp, name: name, benefit: 'Bônus de evolução nível ' + i});
  }
  return table;
}

export let levelTable = generateDefaultLevels();

export const themes = { 
  default: { label:'Vida+ AI', premium:false }, 
  luxury: { label:'Luxury Gold', premium:true },
  cyberpunk: { label:'Cyberpunk', premium:true },
  nature: { label:'Nature Eco', premium:true },
  space: { label:'Deep Space', premium:true }
};

export let appState = {
  user: {xp:0, level:1, premium:false, coins: 0},
  settings: {theme:'default-light'},
  profile: {name:'', email:'', firstName:'', lastName:'', phone:'', address:'', photo:''},
  isLoaded: false
};

export function getLevelData(xp) {
  let current = levelTable[0];
  let next = levelTable[1];
  for(let i=0; i<levelTable.length; i++){
    if(xp >= levelTable[i].xp){
      current = levelTable[i];
      next = levelTable[i+1] || levelTable[i];
    } else { break; }
  }
  const totalNeeded = next.xp - current.xp;
  const earned = xp - current.xp;
  const pct = totalNeeded === 0 ? 100 : Math.min(100, Math.max(0, (earned / totalNeeded) * 100));
  return { current, next, pct };
}

export function saveLocalState(){
  localStorage.setItem(STORE.user, JSON.stringify(appState.user));
  localStorage.setItem(STORE.settings, JSON.stringify(appState.settings));
  localStorage.setItem(STORE.profile, JSON.stringify(appState.profile));
}

export function loadLocalState(){
  const u = localStorage.getItem(STORE.user);
  const s = localStorage.getItem(STORE.settings);
  const p = localStorage.getItem(STORE.profile);
  if(u) appState.user = {...appState.user, ...JSON.parse(u)};
  if(s) appState.settings = {...appState.settings, ...JSON.parse(s)};
  if(p) appState.profile = {...appState.profile, ...JSON.parse(p)};
  
  document.documentElement.setAttribute('data-theme', appState.settings.theme || 'default-light');
}
