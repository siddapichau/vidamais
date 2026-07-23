// Vida+ AI - CORE v4 FINAL - Sem dados pré-carregados sem login + Pages puxam do Index
// 100% PT-BR, 50 níveis, 8 moedas, 10 temas

export const STORE = {
  user: 'vidaplus_user_v5',
  tx: 'vidaplus_tx_v5',
  habits: 'vidaplus_habits_v5',
  moods: 'vidaplus_moods_v5',
  goals: 'vidaplus_goals_v5',
  app: 'vidaplus_app_v5',
  settings: 'vidaplus_settings_v5',
  profile: 'vidaplus_profile_v5'
};

export const currencies = {
  BRL: {code:'BRL', symbol:'R$', label:'Real (R$)', locale:'pt-BR'},
  USD: {code:'USD', symbol:'US$', label:'Dólar (US$)', locale:'en-US'},
  EUR: {code:'EUR', symbol:'€', label:'Euro (€)', locale:'de-DE'},
  GBP: {code:'GBP', symbol:'£', label:'Libra (£)', locale:'en-GB'},
  JPY: {code:'JPY', symbol:'¥', label:'Iene (¥)', locale:'ja-JP'},
  ARS: {code:'ARS', symbol:'$AR', label:'Peso Argentino', locale:'es-AR'},
  MXN: {code:'MXN', symbol:'$MX', label:'Peso Mexicano', locale:'es-MX'},
  BTC: {code:'BTC', symbol:'₿', label:'Bitcoin', locale:'pt-BR'}
};

export const themes = {
  light:{label:'Claro',id:'light',premium:false},
  dark:{label:'Escuro',id:'dark',premium:false},
  midnight:{label:'Midnight • Premium',id:'midnight',premium:true},
  forest:{label:'Forest • Premium',id:'forest',premium:true},
  sunset:{label:'Sunset • Premium',id:'sunset',premium:true},
  aurora:{label:'Aurora • Premium',id:'aurora',premium:true},
  ocean:{label:'Ocean • Premium',id:'ocean',premium:true},
  neon:{label:'Neon • Premium',id:'neon',premium:true},
  gold:{label:'Gold • Premium',id:'gold',premium:true},
  sakura:{label:'Sakura • Premium',id:'sakura',premium:true}
};

function generateLevels(){
  const names=['Explorador','Construtor','Focado','Disciplinado','Guardião','Estrategista','Mestre','Lenda','Transcendente','Vida+ Max','Iluminado','Sábio','Visionário','Alquimista','Arquiteto','Imperador','Titã','Supremo','Eterno','Cosmos','Pioneiro Estelar','Forjador','Senhor do Tempo','Mente Cristalina','Fluxo Absoluto','Equilíbrio','Riqueza','Serenidade','Poder','Maestria','Ascendente','Radiante','Inabalável','Infinito Iniciante','Infinito Bronze','Infinito Prata','Infinito Ouro','Infinito Platina','Infinito Diamante','Infinito Mestre','Grão-Mestre','Lenda Viva','Mito','Deus Hábitos','Criador','Transcendência','Omega','Eterno','Supremo','Deus','Universo'];
  const rewards=['Tema escuro','+1 hábito','Relatório semanal','Insight financeiro','Tema Forest','PDF básico','Sunset','Modo foco','Correlação','Análise humor','Aurora','PDF premium','Ocean','Projeção 30d','Alerta gastos','Neon','Backup','Gold','IA total','Selo Lenda','Sakura','Suporte','Mentoria','Descontos','Beta','Titan','Supremo','Eterno','Cosmos','Custom','Criador','NFT','Grupo','Live','Evento','Troféu','Viagem','Mentoria 1:1','Equity','Hall fama','Diamante','Keynote','Nome produto','100 anos','Imortal','Tudo liberado','Código','Co-criador','Infinito','Infinito²'];
  const table=[];
  for(let i=1;i<=50;i++){
    let xp=0;
    if(i===1) xp=0;
    else if(i<=10){ const t=[0,500,1500,3000,5000,7500,10500,14000,18000,22500]; xp=t[i-1]; }
    else if(i<=20){ xp=22500 + (i-10)*4000 + (i-10)*(i-10)*150; }
    else{ xp=Math.round((i/50)*78000*(0.6+0.4*i/50)); if(i===50) xp=78000; }
    table.push({level:i, xp:Math.round(xp), name:names[i-1]||`Nível ${i}`, reward:rewards[i-1]||`Recompensa ${i}`, icon: i<=10?'⚡':i<=20?'🔥':i<=30?'🏆':i<=40?'💎':'🌌'});
  }
  table.sort((a,b)=>a.xp-b.xp);
  table[49].xp=78000;
  return table;
}
export const levelTable = generateLevels();

export const defaultCategories = {
  expense:['Mercado','Aluguel','Combustível','Delivery','Transporte','Saúde','Lazer','Educação','Casa','Serviços','Assinaturas'],
  income:['Salário','Freelance','Investimentos','Vendas','Cashback','Outros']
};
export const moodMap = {
  1:{label:'Muito Ruim',emoji:'😞',color:'#EF4444'},
  2:{label:'Ruim',emoji:'😐',color:'#F97316'},
  3:{label:'Normal',emoji:'🙂',color:'#6366F1'},
  4:{label:'Bom',emoji:'😁',color:'#10B981'},
  5:{label:'Excelente',emoji:'🤩',color:'#F59E0B'}
};

export let state = {
  user: {name:'', xp:0, level:1, joined:new Date().toISOString(), premium:false},
  tx: [],
  habits: [],
  moods: [],
  goals: [],
  settings: {theme:'light', currency:'BRL', notifications:true, language:'pt-BR'},
  app:{streak:0,maxStreak:0,lastActive:null,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'},
  profile: {name:'', firstName:'', lastName:'', email:'', phone:'', photo:'', premium:false, birthDate:'', currency:'BRL'}
};

export function fmtMoney(v, code){
  const c=code||state.settings.currency||'BRL';
  const curr=currencies[c]||currencies.BRL;
  try{
    if(c==='BTC') return `${curr.symbol} ${(v/100000).toFixed(6)}`;
    return new Intl.NumberFormat(curr.locale,{style:'currency',currency:curr.code}).format(v||0);
  }catch{ return `${curr.symbol} ${(v||0).toFixed(2)}`; }
}
export const fmtBRL = (v)=> fmtMoney(v);
export function fmtDate(d){ try{return new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})}catch{return d} }
export const todayStr = ()=> new Date().toISOString().slice(0,10);
export function getLevel(xp){ let lvl=levelTable[0]; for(let r of levelTable){ if(xp>=r.xp) lvl=r; else break;} return lvl }
export function getNextLevel(xp){ for(let r of levelTable){ if(r.xp>xp) return r;} return {level:51,xp:xp+5000,name:'Além do Universo',reward:'Infinito',icon:'♾️'} }
export function getLevelProgress(xp){
  const curr=getLevel(xp); const next=getNextLevel(xp);
  const total=next.xp-curr.xp; const done=xp-curr.xp;
  return {curr,next,pct:total?Math.min(100,(done/total)*100):100, done,total};
}

export function clearAllLocal(){
  Object.keys(localStorage).forEach(k=>{
    if(k.startsWith('vidaplus_')) localStorage.removeItem(k);
  });
  state = {
    user: {name:'', xp:0, level:1, joined:new Date().toISOString(), premium:false},
    tx: [], habits: [], moods: [], goals: [],
    settings: {theme:'light', currency:'BRL', notifications:true, language:'pt-BR'},
    app:{streak:0,maxStreak:0,lastActive:null,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'},
    profile: {name:'', firstName:'', lastName:'', email:'', phone:'', photo:'', premium:false, birthDate:'', currency:'BRL'}
  };
}

export function loadState(){
  try{
    const parse=(k,fb)=>{ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):fb }catch{return fb} };
    const user=parse(STORE.user, null);
    // Se não tem usuário logado (uid default_user), NÃO carrega dados antigos com nome Wesley - começa limpo
    const appTmp=parse(STORE.app, null);
    const isDefault = !appTmp || !appTmp.uid || appTmp.uid==='default_user';
    if(isDefault){
      // Não carrega tx/habits etc se for visitante sem login para não mostrar dados pré-carregados
      state.user = user && user.name ? user : {name:'', xp:0, level:1, joined:new Date().toISOString(), premium:false};
      // Se tiver tx antigo com nome Wesley, limpa
      if(state.user.name==='Wesley' || state.user.name==='wesleystudio@gmail.com'){
        state.user.name='';
      }
      state.tx=[]; state.habits=[]; state.moods=[]; state.goals=[];
      state.app={streak:0,maxStreak:0,lastActive:null,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'};
      state.settings=parse(STORE.settings, {theme:'light', currency:'BRL', notifications:true, language:'pt-BR'});
      state.profile=parse(STORE.profile, {name:'', firstName:'', lastName:'', email:'', phone:'', photo:'', premium:false, birthDate:'', currency:'BRL'});
      return true;
    }
    // Se tem UID real, carrega tudo
    state.user=parse(STORE.user, {name:'', xp:0, level:1, joined:new Date().toISOString(), premium:false});
    state.tx=parse(STORE.tx, []);
    state.habits=parse(STORE.habits, []);
    state.moods=parse(STORE.moods, []);
    state.goals=parse(STORE.goals, []);
    state.app={...state.app, ...parse(STORE.app, {})};
    state.settings={...state.settings, ...parse(STORE.settings, {})};
    state.profile={...state.profile, ...parse(STORE.profile, {})};
    state.settings.currency=state.settings.currency||state.profile.currency||'BRL';
    state.profile.currency=state.settings.currency;
    state.app.theme=state.settings.theme||'light';
    return true;
  }catch(e){ console.error(e); return false; }
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
    if(remote.user){ state.user={...state.user,...remote.user}; if(state.user.name==='Wesley') state.user.name=remote.profile?.name||''; changed=true; }
    if(remote.profile){
      state.profile={...state.profile,...remote.profile};
      if(remote.profile.name && !remote.profile.firstName){
        const p=remote.profile.name.split(' ');
        state.profile.firstName=p[0]; state.profile.lastName=p.slice(1).join(' ');
      }
      state.user.name=remote.profile.name||state.user.name;
      changed=true;
    }
    if(remote.transactions && Array.isArray(remote.transactions)){ state.tx=remote.transactions; changed=true; }
    if(remote.habits && Array.isArray(remote.habits)){ state.habits=remote.habits; changed=true; }
    if(remote.moods && Array.isArray(remote.moods)){ state.moods=remote.moods; changed=true; }
    if(remote.goals && Array.isArray(remote.goals)){ state.goals=remote.goals; changed=true; }
    if(remote.app){ state.app={...state.app,...remote.app}; changed=true; }
    if(remote.settings){ state.settings={...state.settings,...remote.settings}; state.profile.currency=remote.settings.currency||state.profile.currency; changed=true; }
    if(changed) saveState();
    return changed;
  }catch(e){ return false; }
}

export function setUid(uid){ state.app.uid=uid; saveState(); }

export function addXP(amount, reason=''){
  const prev=getLevel(state.user.xp); state.user.xp=(state.user.xp||0)+amount;
  const curr=getLevel(state.user.xp); saveState();
  const leveledUp=curr.level>prev.level;
  window.dispatchEvent(new CustomEvent('vidaplus:xp',{detail:{amount,reason,prev,curr,leveledUp}}));
  return {prev,curr,leveledUp};
}

export function calcStreak(){
  let streak=0;
  for(let i=0;i<100;i++){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    const has=state.habits.some(h=>h.history&&h.history[d]);
    if(has) streak++; else if(i>0) break;
  }
  state.app.streak=streak;
  state.app.maxStreak=Math.max(state.app.maxStreak||0,streak);
  saveState(); return streak;
}
export function calcHabitRate(days=7){
  let c=0,t=0;
  for(let i=0;i<days;i++){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    state.habits.forEach(h=>{ t++; if(h.history&&h.history[d]) c++; });
  }
  return t?c/t:0;
}
export function calcLifeScore(){
  const hr=calcHabitRate();
  const ma=state.moods.length? state.moods.reduce((s,m)=>s+m.level,0)/state.moods.length/5 : 0.6;
  const bal=state.tx.reduce((s,t)=>s+(t.type==='income'?1:-1),0);
  const fs=Math.min(1,Math.max(0,0.5+bal/20));
  return Math.round((hr*0.4+ma*0.35+fs*0.25)*100);
}
export function generateInsights(isPremium=false){
  const total=state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const expenses=state.tx.filter(t=>t.type==='expense');
  const topCat=expenses.length? Object.entries(expenses.reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{})).sort((a,b)=>b[1]-a[1])[0]:null;
  const avgMood=state.moods.length? state.moods.reduce((s,m)=>s+m.level,0)/state.moods.length : 3;
  const hr=calcHabitRate();
  const all=[];
  if(topCat) all.push({ico:'💸',color:'#123C7A',title:`Maior gasto: ${topCat[0]}`,text:`${fmtMoney(topCat[1])} no período. Reduza 15% = ${fmtMoney(topCat[1]*0.15)}/mês.`,premium:false});
  if(avgMood<3) all.push({ico:'🧠',color:'#F43F5E',title:'Humor alerta',text:`Média ${avgMood.toFixed(1)}/5. Dias ruins gastam 28% mais Delivery.`,premium:false});
  else all.push({ico:'😁',color:'#10B981',title:'Humor estável',text:`Média ${avgMood.toFixed(1)}/5. Hábitos ${(hr*100).toFixed(0)}%.`,premium:false});
  all.push({ico:'📈',color:'#6366F1',title:total<0?'Saldo negativo':'Economia',text:total<0?`${fmtMoney(Math.abs(total))} negativo.`:`Pode investir ${fmtMoney(total*0.2)}.`,premium:false});
  all.push({ico:'🔥',color:'#F97316',title:`Streak ${state.app.streak}d`,text:`Top 12% consistentes.`,premium:false});
  all.push({ico:'💎',color:'#7C3AED',title:'Previsão 30d (Premium)',text:`Saldo projetado ${fmtMoney(total*0.9)}.`,premium:true});
  if(isPremium) return all;
  return all.map(ins=>({...ins,locked:ins.premium,text:ins.premium?'🔒 Premium - desbloqueie para ver projeções.':ins.text})).slice(0,5);
}
export function seedHabits(){
  const dflt=[
    {name:'Beber água',icon:'💧',color:'#06B6D4',goal:8},
    {name:'Treino',icon:'🏋️',color:'#10B981',goal:1},
    {name:'Leitura',icon:'📚',color:'#F59E0B',goal:1},
    {name:'Estudo',icon:'🧠',color:'#6366F1',goal:1},
    {name:'Caminhada',icon:'🚶',color:'#123C7A',goal:1},
    {name:'Meditação',icon:'🧘',color:'#8B5CF6',goal:1},
  ];
  state.habits=dflt.map(d=>({id:'h_'+Math.random().toString(36).slice(2,8),...d,streak:0,history:{},createdAt:new Date().toISOString()}));
  saveState();
}
export function seedTransactions(){ state.tx=[]; saveState(); }
export function seedMoods(){ state.moods=[]; saveState(); }
export function seedGoals(){ state.goals=[]; saveState(); }
export function ensureSeed(){
  // Só cria seed se estiver logado (uid != default_user)
  if(state.app.uid==='default_user') return;
  if(!state.habits.length) seedHabits();
}
export function exportAll(){ return {user:state.user,profile:state.profile,transactions:state.tx,habits:state.habits,moods:state.moods,goals:state.goals,app:state.app,settings:state.settings,exportedAt:new Date().toISOString()}; }
export function importAll(data){
  try{
    if(data.user) state.user=data.user;
    if(data.profile) state.profile=data.profile;
    if(data.transactions) state.tx=data.transactions;
    if(data.habits) state.habits=data.habits;
    if(data.moods) state.moods=data.moods;
    if(data.goals) state.goals=data.goals;
    if(data.app) state.app={...state.app,...data.app};
    if(data.settings) state.settings={...state.settings,...data.settings};
    saveState(); return true;
  }catch(e){ return false; }
}
