export const STORE = {
  user: 'vidaplus_user_v8',
  profile: 'vidaplus_profile_v8',
  settings: 'vidaplus_settings_v8',
  transactions: 'vidaplus_tx_v8',
  habits: 'vidaplus_habits_v8',
  moods: 'vidaplus_moods_v8',
  goals: 'vidaplus_goals_v8',
};

export function generateDefaultLevels(){
  const names = ['Despertar','Foco','Constância','Hábito','Evolução','Mestre','Lenda','Supremo'];
  const table = [];
  for(let i=1; i<=50; i++){
    let xp = i === 1 ? 0 : Math.round(Math.pow(i, 2.45) * 5.2);
    let nameIdx = Math.floor((i-1)/7);
    let base = names[nameIdx] || 'Transcendente';
    let sub = (i%7===0?7:i%7);
    let benefits = [
      'Desbloqueio: Tema Dark',
      'Insight financeiro básico',
      'Desbloqueio: Gráfico de humor',
      'Hábito ilimitado: +1 slot',
      'Relatório IA estendido',
      'Desbloqueio: Tema Luxury',
      'Badge: Constante',
      'Desbloqueio: Tema Cyberpunk',
      'Relatório correlação humor x gasto',
      'Moedas bônus +100',
    ];
    table.push({
      level: i,
      xp: xp,
      name: `${base} ${sub}`,
      benefit: benefits[i % benefits.length],
    });
  }
  return table;
}

export let levelTable = generateDefaultLevels();

export const themes = {
  default: { label:'Vida+ AI', premium:false, icon:'✨' },
  luxury: { label:'Luxury Gold', premium:true, icon:'👑' },
  cyberpunk: { label:'Cyberpunk', premium:true, icon:'🌃' },
  nature: { label:'Nature Eco', premium:true, icon:'🌿' },
  space: { label:'Deep Space', premium:true, icon:'🚀' }
};

export const financeCategories = {
  income: ['Salário','Freelance','Investimentos','Vendas','Outros'],
  expense: ['Alimentação','Transporte','Moradia','Lazer','Saúde','Educação','Compras','Contas','Outros']
};

export let appState = {
  user: { xp:0, level:1, premium:false, coins:0, streak:0 },
  profile: { name:'', email:'', firstName:'', lastName:'', phone:'', address:'', photo:'', createdAt: null },
  settings: { theme:'default-light', currency:'BRL', language:'pt-BR' },
  transactions: [],
  habits: [],
  moods: [],
  goals: [],
  isLoaded: false
};

export function getLevelData(xp){
  xp = Number(xp)||0;
  let current = levelTable[0];
  let next = levelTable[1];
  for(let i=0;i<levelTable.length;i++){
    if(xp >= levelTable[i].xp){
      current = levelTable[i];
      next = levelTable[i+1] || levelTable[i];
    } else break;
  }
  const totalNeeded = next.xp - current.xp;
  const earned = xp - current.xp;
  const pct = totalNeeded===0?100:Math.min(100, Math.max(0, (earned/totalNeeded)*100));
  return { current, next, pct, totalNeeded, earned };
}

export function saveLocalState(){
  try{
    localStorage.setItem(STORE.user, JSON.stringify(appState.user));
    localStorage.setItem(STORE.settings, JSON.stringify(appState.settings));
    localStorage.setItem(STORE.profile, JSON.stringify(appState.profile));
    localStorage.setItem(STORE.transactions, JSON.stringify(appState.transactions));
    localStorage.setItem(STORE.habits, JSON.stringify(appState.habits));
    localStorage.setItem(STORE.moods, JSON.stringify(appState.moods));
    localStorage.setItem(STORE.goals, JSON.stringify(appState.goals));
    window.dispatchEvent(new CustomEvent('vidaplus:save', { detail: appState }));
  }catch(e){ console.warn('saveLocalState fail', e); }
}

export function loadLocalState(){
  try{
    const u = localStorage.getItem(STORE.user);
    const s = localStorage.getItem(STORE.settings);
    const p = localStorage.getItem(STORE.profile);
    const tx = localStorage.getItem(STORE.transactions);
    const hb = localStorage.getItem(STORE.habits);
    const md = localStorage.getItem(STORE.moods);
    const gl = localStorage.getItem(STORE.goals);
    if(u) appState.user = {...appState.user, ...JSON.parse(u)};
    if(s) appState.settings = {...appState.settings, ...JSON.parse(s)};
    if(p) appState.profile = {...appState.profile, ...JSON.parse(p)};
    if(tx) appState.transactions = JSON.parse(tx) || [];
    if(hb) appState.habits = JSON.parse(hb) || [];
    if(md) appState.moods = JSON.parse(md) || [];
    if(gl) appState.goals = JSON.parse(gl) || [];
    document.documentElement.setAttribute('data-theme', appState.settings.theme || 'default-light');
  }catch(e){ console.warn('load fail', e); }
}

export function seedDemoData(){
  if(appState.transactions.length===0){
    const now = Date.now();
    appState.transactions = [
      { id:'tx1', type:'income', amount:4500, category:'Salário', desc:'Salário Mensal', date: new Date(now-10*86400000).toISOString() },
      { id:'tx2', type:'expense', amount:120, category:'Alimentação', desc:'Supermercado', date: new Date(now-5*86400000).toISOString() },
      { id:'tx3', type:'expense', amount:80, category:'Transporte', desc:'Uber', date: new Date(now-2*86400000).toISOString() },
      { id:'tx4', type:'income', amount:350, category:'Freelance', desc:'Projeto Vida+', date: new Date(now-1*86400000).toISOString() },
    ];
  }
  if(appState.habits.length===0){
    appState.habits = [
      { id:'h1', name:'Beber Água', icon:'💧', color:'#06B6D4', streak:3, completedDates:[new Date().toISOString().slice(0,10)], createdAt: new Date().toISOString() },
      { id:'h2', name:'Meditar', icon:'🧘', color:'#8B5CF6', streak:7, completedDates:[], createdAt: new Date().toISOString() },
      { id:'h3', name:'Ler 20min', icon:'📚', color:'#F59E0B', streak:2, completedDates:[], createdAt: new Date().toISOString() },
    ];
  }
  if(appState.moods.length===0){
    const moods = [];
    for(let i=6;i>=0;i--){
      const d = new Date(Date.now()-i*86400000);
      moods.push({ id:'m'+i, value: 2+Math.floor(Math.random()*3), date: d.toISOString().slice(0,10), note:'' });
    }
    appState.moods = moods;
  }
  if(appState.goals.length===0){
    appState.goals = [
      { id:'g1', title:'Economizar R$ 5.000', target:5000, current:1250, category:'Financeiro', deadline: new Date(Date.now()+90*86400000).toISOString().slice(0,10), done:false },
      { id:'g2', title:'21 dias de hábito', target:21, current:7, category:'Hábitos', deadline: new Date(Date.now()+30*86400000).toISOString().slice(0,10), done:false },
    ];
  }
  saveLocalState();
}

// helpers
export function currencyFormat(value, currency='BRL'){
  const map = { BRL:'pt-BR', USD:'en-US', EUR:'de-DE' };
  const cur = currency || appState.settings.currency || 'BRL';
  try{
    return new Intl.NumberFormat(map[cur]||'pt-BR', { style:'currency', currency: cur }).format(value);
  }catch{
    return `R$ ${Number(value).toFixed(2)}`;
  }
}

export function uid(prefix='id'){
  return prefix+'_'+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
}
