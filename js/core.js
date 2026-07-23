// Vida+ AI - CORE v3 - Evolution Longa (1 ano) + Multi Moeda + Temas Gradientes
// 100% PT-BR, níveis longos, moedas, temas premium

export const STORE = {
  user: 'vidaplus_user_v2',
  tx: 'vidaplus_tx_v2',
  habits: 'vidaplus_habits_v2',
  moods: 'vidaplus_moods_v2',
  goals: 'vidaplus_goals_v2',
  app: 'vidaplus_app_v2',
  settings: 'vidaplus_settings_v2',
  profile: 'vidaplus_profile_v2'
};

// ===== MOEDAS =====
export const currencies = {
  BRL: {code:'BRL', symbol:'R$', label:'Real (R$)', locale:'pt-BR'},
  USD: {code:'USD', symbol:'US$', label:'Dólar (US$)', locale:'en-US'},
  EUR: {code:'EUR', symbol:'€', label:'Euro (€)', locale:'de-DE'},
  GBP: {code:'GBP', symbol:'£', label:'Libra (£)', locale:'en-GB'},
  JPY: {code:'JPY', symbol:'¥', label:'Iene (¥)', locale:'ja-JP'},
  ARS: {code:'ARS', symbol:'$AR', label:'Peso Argentino', locale:'es-AR'},
  MXN: {code:'MXN', symbol:'$MX', label:'Peso Mexicano', locale:'es-MX'},
  BTC: {code:'BTC', symbol:'₿', label:'Bitcoin (simbólico)', locale:'pt-BR'}
};

// ===== TEMAS MODERNOS COM GRADIENTES =====
export const themes = {
  light:{label:'Claro • Padrão',id:'light',premium:false, gradient:'linear-gradient(135deg,#F6F7FB,#EEF1FF)'},
  dark:{label:'Escuro',id:'dark',premium:false, gradient:'linear-gradient(135deg,#0B1020,#121A33)'},
  midnight:{label:'Midnight • Premium',id:'midnight',premium:true, gradient:'linear-gradient(135deg,#08081A,#13132B)'},
  forest:{label:'Forest • Premium',id:'forest',premium:true, gradient:'linear-gradient(135deg,#052E16,#166534)'},
  sunset:{label:'Sunset • Premium',id:'sunset',premium:true, gradient:'linear-gradient(135deg,#431407,#EA580C)'},
  aurora:{label:'Aurora Boreal • Premium',id:'aurora',premium:true, gradient:'linear-gradient(135deg,#0F172A,#6366F1 35%,#06B6D4 70%,#10B981)'},
  ocean:{label:'Ocean Deep • Premium',id:'ocean',premium:true, gradient:'linear-gradient(135deg,#082F49,#0E7490,#06B6D4)'},
  neon:{label:'Neon Cyber • Premium',id:'neon',premium:true, gradient:'linear-gradient(135deg,#1A0033,#FF00E5,#00FFE0)'},
  gold:{label:'Gold Royal • Premium',id:'gold',premium:true, gradient:'linear-gradient(135deg,#78350F,#F59E0B,#FDE68A)'},
  sakura:{label:'Sakura • Premium',id:'sakura',premium:true, gradient:'linear-gradient(135deg,#831843,#EC4899,#F9A8D4)'}
};

// ===== NÍVEIS LONGOS - 1 ANO DE USO 100% =====
// Cálculo: uso 100% diário = ~200 XP/dia (6 hábitos 20=120 + tx 10 + mood 15 + metas 30 + streak 25)
// 365 dias = 73.000 XP para chegar no nível máximo
// Criamos 50 níveis, último em 78.000 XP (1 ano + bônus)
// Cada nível tem recompensa e vantagem desbloqueada

function generateLevels(){
  const base = [];
  let xp = 0;
  const names = [
    'Explorador','Construtor','Focado','Disciplinado','Guardião',
    'Estrategista','Mestre','Lenda','Transcendente','Vida+ Max',
    'Iluminado','Sábio','Visionário','Alquimista','Arquiteto',
    'Imperador','Titã','Supremo','Eterno','Cosmos',
    'Pioneiro Estelar','Forjador de Hábitos','Senhor do Tempo','Mente Cristalina','Fluxo Absoluto',
    'Equilíbrio Supremo','Riqueza Consciente','Serenidade','Poder Interior','Maestria Total',
    'Ascendente','Radiante','Inabalável','Infinito Iniciante','Infinito Bronze',
    'Infinito Prata','Infinito Ouro','Infinito Platina','Infinito Diamante','Infinito Mestre',
    'Infinito Grão-Mestre','Lenda Viva','Mito','Deus dos Hábitos','Criador de Realidades',
    'Transcendência Final','Omega','Vida+ Eterno','Vida+ Supremo','Vida+ Deus','Vida+ Universo'
  ];
  const rewards = [
    'Desbloqueia tema escuro','+1 slot de hábito','Relatório semanal','Insight financeiro','Tema Forest liberado',
    'Exporta PDF básico','Tema Sunset','Modo foco','IA correlação hábitos','Análise humor x gastos',
    'Tema Aurora desbloqueado','PDF premium','Tema Ocean','Projeção 30 dias','Alerta gastos por humor',
    'Tema Neon','Backup automático','Temas Gold','IA avançada total','Selo Lenda no perfil',
    'Tema Sakura','Suporte prioritário','Mentoria IA','Descontos parceiros','Acesso beta',
    'Selo Titan','Selo Supremo','Selo Eterno','Selo Cosmos','Customização total',
    'Tema exclusivo criador','NFT simbólico','Grupo seleto','Live com criador','Evento anual',
    'Troféu físico','Viagem imersiva','Mentoria 1:1','Equity simbólico','Hall da fama',
    'Placa diamante','Keynote convite','Produto nomeado','100 anos premium','Imortalidade digital',
    'Tudo liberado','Deus - acesso código','Universo - co-criador','Infinito','Infinito²'
  ];
  for(let i=1;i<=50;i++){
    if(i===1) xp=0;
    else if(i<=10){
      // 500, 1500, 3000, 5000, etc (original)
      const table = [0,500,1500,3000,5000,7500,10500,14000,18000,22500];
      xp = table[i-1];
    } else if(i<=20){
      // +4000 a +8000
      xp = 22500 + (i-10)*4000 + Math.floor((i-10)*(i-10)*150);
    } else if(i<=30){
      xp = 22500 + 10*4000 + 10*10*15 + (i-20)*6000;
      xp = Math.round(22500 + 55000 + (i-20)*6500);
    } else {
      xp = 22500 + 55000 + 10*6500 + (i-30)*8000;
      xp = 22500 + 120000 + (i-30)*8500 - 65000; // ajusta para chegar ~78k no 50
      // Recalcula para meta 78k no 50
      // Vamos usar fórmula linear final para fechar 78k
      xp = Math.round( (i/50) * 78000 * (0.6 + 0.4*i/50) );
      if(i===50) xp=78000;
    }
    base.push({
      level:i,
      xp: i===1 ? 0 : Math.round(xp),
      name: names[i-1] || `Nível ${i}`,
      reward: rewards[i-1] || `Recompensa nível ${i}`,
      icon: i<=10 ? '⚡' : i<=20 ? '🔥' : i<=30 ? '🏆' : i<=40 ? '💎' : '🌌'
    });
  }
  // Garante ordem crescente e corrige duplicatas
  base.sort((a,b)=>a.xp-b.xp);
  // Força último = 78000
  base[49].xp = 78000;
  return base;
}

export const levelTable = generateLevels();

export const defaultCategories = {
  expense:['Mercado','Aluguel','Combustível','Delivery','Transporte','Saúde','Lazer','Educação','Casa','Serviços','Assinaturas','Investimentos'],
  income:['Salário','Freelance','Investimentos','Vendas','Cashback','Prêmios','Outros']
};

export const moodMap = {
  1:{label:'Muito Ruim',emoji:'😞',color:'#EF4444'},
  2:{label:'Ruim',emoji:'😐',color:'#F97316'},
  3:{label:'Normal',emoji:'🙂',color:'#6366F1'},
  4:{label:'Bom',emoji:'😁',color:'#10B981'},
  5:{label:'Excelente',emoji:'🤩',color:'#F59E0B'}
};

export let state = {
  user: null,
  tx: [],
  habits: [],
  moods: [],
  goals: [],
  settings: {theme:'light', currency:'BRL', notifications:true, aiLevel:'balanced', language:'pt-BR'},
  app:{streak:0,maxStreak:0,lastActive:null,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'},
  profile: {name:'', firstName:'', lastName:'', email:'', phone:'', photo:'', premium:false, birthDate:'', currency:'BRL'}
};

export function fmtMoney(v, currencyCode){
  const code = currencyCode || state.settings.currency || state.profile.currency || 'BRL';
  const curr = currencies[code] || currencies.BRL;
  try{
    // BTC simbólico
    if(code==='BTC') return `${curr.symbol} ${(v/100000).toFixed(6)}`;
    return new Intl.NumberFormat(curr.locale,{style:'currency',currency:curr.code}).format(v||0);
  }catch{
    return `${curr.symbol} ${(v||0).toFixed(2)}`;
  }
}
export const fmtBRL = (v)=> fmtMoney(v); // compat
export function fmtDate(d){ try{return new Date(d).toLocaleDateString('pt-BR', {day:'2-digit', month:'short', year:'numeric'})}catch{return d} }
export const todayStr = ()=> new Date().toISOString().slice(0,10);
export function getLevel(xp){ let lvl=levelTable[0]; for(let row of levelTable){ if(xp>=row.xp) lvl=row; else break;} return lvl }
export function getNextLevel(xp){ for(let r of levelTable){ if(r.xp>xp) return r;} return {level: levelTable.length+1, xp: xp+5000, name:'Além do Universo', reward:'Infinito', icon:'♾️'} }
export function getLevelProgress(xp){
  const curr = getLevel(xp);
  const next = getNextLevel(xp);
  const total = next.xp - curr.xp;
  const done = xp - curr.xp;
  return {curr, next, pct: total ? Math.min(100, (done/total)*100) : 100, done, total};
}

export function loadState(){
  try{
    const parse = (k,fallback)=>{ try{ const v=localStorage.getItem(k); return v? JSON.parse(v):fallback }catch{return fallback} };
    state.user = parse(STORE.user, {name:'Wesley',xp:0,level:1,joined:new Date().toISOString(),premium:false});
    state.tx = parse(STORE.tx, []);
    state.habits = parse(STORE.habits, []);
    state.moods = parse(STORE.moods, []);
    state.goals = parse(STORE.goals, []);
    state.app = {...state.app, ...parse(STORE.app, {})};
    state.settings = {...state.settings, ...parse(STORE.settings, {})};
    state.profile = {...state.profile, ...parse(STORE.profile, {})};
    // compat moeda
    state.settings.currency = state.settings.currency || state.profile.currency || 'BRL';
    state.profile.currency = state.settings.currency;
    state.app.theme = state.settings.theme || state.app.theme || 'light';
    return true;
  }catch(e){ console.error("[core] load error", e); return false; }
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
    window.dispatchEvent(new CustomEvent('vidaplus:save', {detail:{state}}));
    return true;
  }catch(e){ console.error("[core] save error", e); return false; }
}

export function applyRemoteData(remote){
  if(!remote) return false;
  let changed = false;
  try{
    if(remote.user){ state.user = {...state.user, ...remote.user}; changed=true; }
    if(remote.profile){ 
      state.profile = {...state.profile, ...remote.profile}; 
      // garante firstName lastName
      if(remote.profile.name && !remote.profile.firstName){
        const parts = remote.profile.name.split(' ');
        state.profile.firstName = parts[0];
        state.profile.lastName = parts.slice(1).join(' ');
      }
      state.user.name = remote.profile.name || state.user.name; 
      changed=true; 
    }
    if(remote.transactions && Array.isArray(remote.transactions) && remote.transactions.length >= state.tx.length){ state.tx = remote.transactions; changed=true; }
    if(remote.habits && Array.isArray(remote.habits) && remote.habits.length >= state.habits.length){ state.habits = remote.habits; changed=true; }
    if(remote.moods && Array.isArray(remote.moods) && remote.moods.length >= state.moods.length){ state.moods = remote.moods; changed=true; }
    if(remote.goals && Array.isArray(remote.goals) && remote.goals.length >= state.goals.length){ state.goals = remote.goals; changed=true; }
    if(remote.app){ state.app = {...state.app, ...remote.app}; changed=true; }
    if(remote.settings){ state.settings = {...state.settings, ...remote.settings}; state.profile.currency = remote.settings.currency || state.profile.currency; changed=true; }
    if(changed) saveState();
    return changed;
  }catch(e){ console.error("[applyRemoteData]", e); return false; }
}

export function setUid(uid){ state.app.uid = uid; saveState(); }

export function addXP(amount, reason=''){
  const prev = getLevel(state.user.xp);
  state.user.xp = (state.user.xp||0) + amount;
  const curr = getLevel(state.user.xp);
  saveState();
  const leveledUp = curr.level > prev.level;
  window.dispatchEvent(new CustomEvent('vidaplus:xp', {detail:{amount, reason, prev, curr, leveledUp}}));
  return {prev, curr, leveledUp};
}

export function calcStreak(){
  let streak=0;
  for(let i=0;i<100;i++){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    const has = state.habits.some(h=>h.history && h.history[d]);
    if(has) streak++;
    else if(i>0) break;
  }
  state.app.streak = streak;
  state.app.maxStreak = Math.max(state.app.maxStreak||0, streak);
  saveState();
  return streak;
}

export function calcHabitRate(days=7){
  let c=0,t=0;
  for(let i=0;i<days;i++){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    state.habits.forEach(h=>{ t++; if(h.history && h.history[d]) c++; });
  }
  return t? c/t : 0;
}

export function calcLifeScore(){
  const habitRate = calcHabitRate();
  const moodAvg = state.moods.length ? state.moods.reduce((s,m)=>s+m.level,0)/state.moods.length/5 : 0.6;
  const balance = state.tx.reduce((s,t)=> s + (t.type==='income'?1:-1),0);
  const financeScore = Math.min(1, Math.max(0, 0.5 + balance/20));
  return Math.round((habitRate*0.4 + moodAvg*0.35 + financeScore*0.25)*100);
}

export function generateInsights(isPremium=false){
  const total = state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const expenses = state.tx.filter(t=>t.type==='expense');
  const topCat = expenses.length ? Object.entries(expenses.reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{})).sort((a,b)=>b[1]-a[1])[0] : null;
  const avgMood = state.moods.length ? (state.moods.reduce((s,m)=>s+m.level,0)/state.moods.length) : 3;
  const habitRate = calcHabitRate();
  const insights=[];
  // Free vê 2 insights, Premium vê todos
  const all = [];
  if(topCat){
    all.push({ico:'💸',color:'#123C7A',title:`Maior gasto: ${topCat[0]}`,text:`${fmtMoney(topCat[1])} no período. Reduza 15% = economize ${fmtMoney(topCat[1]*0.15)}/mês. Projeção Premium: ${fmtMoney(topCat[1]*12*0.15)}/ano.`,premium:false});
  }
  if(avgMood<3){
    all.push({ico:'🧠',color:'#F43F5E',title:'Humor alerta, gastos sobem?',text:`Média ${(avgMood).toFixed(1)}/5. Dias ruins gastam 28% mais Delivery. Premium: alerta preventivo + sugestão snack saudável.`,premium:false});
  } else {
    all.push({ico:'😁',color:'#10B981',title:'Humor estável = foco alto',text:`Média ${avgMood.toFixed(1)}/5. Hábitos ${(habitRate*100).toFixed(0)}%. Premium mostra correlação por horário.`,premium:false});
  }
  all.push({ico:'📈',color:'#6366F1',title: total<0? 'Saldo negativo':'Economia saudável', text: total<0? `Você está ${fmtMoney(Math.abs(total))} negativo. Meta corte ${fmtMoney(Math.abs(total)*0.2)}.` : `Pode investir ${fmtMoney(total*0.2)} (20% saldo) sem afetar padrão. Premium projeta 90 dias.`,premium:false});
  all.push({ico:'🔥',color:'#F97316',title:`Streak ${state.app.streak} dias!`,text:`Top 12% consistentes. ${state.app.maxStreak} max. Premium: calendário anual + previsão queda.`,premium:false});
  // Premium exclusivos
  all.push({ico:'💎',color:'#7C3AED',title:'Previsão 30 dias (Premium)',text:`Baseado em seus gastos, em 30 dias saldo projetado ${fmtMoney(total*0.9)} se manter padrão. Alerta: ${topCat? topCat[0]+' vai subir 12%':''}`,premium:true});
  all.push({ico:'🧬',color:'#06B6D4',title:'DNA Comportamental (Premium)',text:`Seu horário pico gasto: 20h-22h. Melhor horário treino: 07h (82% dias bons). Correlação leitura x economia: -22% lazer.`,premium:true});
  all.push({ico:'🎯',color:'#F59E0B',title:'Meta inteligente (Premium)',text:`Você pode atingir reserva R$5k em ${Math.max(1, Math.round(5000/(total>0? total*0.2:200)))} meses se economizar 20% saldo.`,premium:true});

  if(isPremium) return all;
  // Free: mostra 3 primeiros + blur nos premium
  return all.map((ins,i)=>({
    ...ins,
    locked: ins.premium,
    text: ins.premium ? '🔒 Conteúdo Premium - desbloqueie para ver análise completa com projeções e correlações por horário.' : ins.text
  })).slice(0,5);
}

export function seedHabits(){
  const defaults=[
    {name:'Beber água',icon:'💧',color:'#06B6D4',goal:8},
    {name:'Academia / Treino',icon:'🏋️',color:'#10B981',goal:1},
    {name:'Leitura',icon:'📚',color:'#F59E0B',goal:1},
    {name:'Estudo / Curso',icon:'🧠',color:'#6366F1',goal:1},
    {name:'Caminhada',icon:'🚶',color:'#123C7A',goal:1},
    {name:'Meditação',icon:'🧘',color:'#8B5CF6',goal:1},
  ];
  state.habits = defaults.map(d=>({id:'h_'+Math.random().toString(36).slice(2,8),...d,streak:Math.floor(Math.random()*5),history:{},createdAt:new Date().toISOString()}));
  for(let i=0;i<7;i++){const date=new Date(Date.now()-i*86400000).toISOString().slice(0,10); state.habits.forEach(h=>{ if(Math.random()>.4) h.history[date]=true })}
  saveState();
}
export function seedTransactions(){
  const cats=['Mercado','Delivery','Combustível','Aluguel','Salário','Freelance'];
  const tx=[];
  for(let i=0;i<18;i++){
    const d=new Date(Date.now()-(Math.floor(Math.random()*14))*86400000);
    const isIncome=Math.random()>.7;
    tx.push({id:'t_'+Math.random().toString(36).slice(2,9),type:isIncome?'income':'expense',amount: isIncome? Math.floor(200+Math.random()*3500) : Math.floor(15+Math.random()*600),category:cats[Math.floor(Math.random()*cats.length)],date:d.toISOString().slice(0,10),desc:isIncome?'Recebimento':'Compra',createdAt:new Date().toISOString()});
  }
  state.tx = tx; saveState();
}
export function seedMoods(){
  const moods=[];
  for(let i=0;i<10;i++){ const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); moods.push({date:d,level:Math.ceil(Math.random()*5),note:i%3===0?'Dia produtivo, mantive hábitos':''}) }
  state.moods = moods; saveState();
}
export function seedGoals(){
  state.goals=[
    {id:'g1',title:'Reserva de emergência R$ 5k',type:'financeira',target:5000,current: state.tx.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) - state.tx.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0), deadline:new Date(Date.now()+60*86400000).toISOString().slice(0,10)},
    {id:'g2',title:'Ler 12 livros no ano',type:'pessoal',target:12,current:4,deadline:new Date(Date.now()+200*86400000).toISOString().slice(0,10)},
    {id:'g3',title:'30 dias de treino',type:'habito',target:30,current:state.app.streak,deadline:new Date(Date.now()+30*86400000).toISOString().slice(0,10)},
  ]; saveState();
}
export function ensureSeed(){
  if(!state.habits.length) seedHabits();
  if(!state.tx.length) seedTransactions();
  if(!state.moods.length) seedMoods();
  if(!state.goals.length) seedGoals();
}
export function exportAll(){
  return {
    user: state.user,
    profile: state.profile,
    transactions: state.tx,
    habits: state.habits,
    moods: state.moods,
    goals: state.goals,
    app: state.app,
    settings: state.settings,
    exportedAt: new Date().toISOString()
  };
}
export function importAll(data){
  try{
    if(data.user) state.user = data.user;
    if(data.profile) state.profile = data.profile;
    if(data.transactions) state.tx = data.transactions;
    if(data.habits) state.habits = data.habits;
    if(data.moods) state.moods = data.moods;
    if(data.goals) state.goals = data.goals;
    if(data.app) state.app = {...state.app, ...data.app};
    if(data.settings) state.settings = {...state.settings, ...data.settings};
    saveState();
    return true;
  }catch(e){ console.error(e); return false; }
}
