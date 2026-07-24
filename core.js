import { db } from './firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

export const STORE = {
  user: 'vidaplus_user_v7', profile: 'vidaplus_profile_v7', settings: 'vidaplus_settings_v7'
};

// Configuração Padrão de Níveis (se não houver no Firebase)
export let levelTable = [];
function generateDefaultLevels(){
  const names = ['Despertar','Foco Inicial','Construindo Hábito','Rotina Leve','Passo Firme','Determinação','Consistência','Mentalidade Forte','Evolução Visível','Mestre da Rotina'];
  const table = [];
  for(let i=1; i<=50; i++){
    // Progressão curva: Nível 50 em ~365 dias com ~200 XP/dia = 73,000 XP
    let xp = i === 1 ? 0 : Math.round(Math.pow(i, 2.4) * 6); 
    let name = names[Math.floor((i-1)/5)] || `Nível ${i}`;
    table.push({level: i, xp: xp, name: name, description: 'Continue evoluindo!'});
  }
  return table;
}
levelTable = generateDefaultLevels();

export const themes = { 
  default: { label:'Vida+ AI', premium:false }, 
  luxury: { label:'Luxury Gold', premium:true },
  cyberpunk: { label:'Cyberpunk', premium:true },
  nature: { label:'Nature Eco', premium:true },
  space: { label:'Deep Space', premium:true }
};

export let state = {
  user: {xp:0, level:1, premium:false, coins: 0},
  settings: {theme:'default-light'},
  profile: {name:'', email:'', photo:''}
};

export async function loadConfigFromFirebase() {
    try {
        const snap = await get(ref(db, 'admin/levels'));
        if (snap.exists()) levelTable = snap.val();
    } catch (e) { console.error("Erro ao carregar níveis", e); }
}

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

export function saveState(){
  localStorage.setItem(STORE.user, JSON.stringify(state.user));
  localStorage.setItem(STORE.settings, JSON.stringify(state.settings));
  localStorage.setItem(STORE.profile, JSON.stringify(state.profile));
}

export function loadState(){
  const u = localStorage.getItem(STORE.user);
  const s = localStorage.getItem(STORE.settings);
  const p = localStorage.getItem(STORE.profile);
  if(u) state.user = JSON.parse(u);
  if(s) state.settings = JSON.parse(s);
  if(p) state.profile = JSON.parse(p);
  
  // Apply theme
  document.documentElement.setAttribute('data-theme', state.settings.theme);
}

export function addXP(amount){
  state.user.xp = (state.user.xp || 0) + amount;
  const lvlData = getLevelData(state.user.xp);
  state.user.level = lvlData.current.level;
  saveState();
}
