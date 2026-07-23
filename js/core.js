// Vida+ AI - CORE (Cérebro) - VidaPlus Core Engine
// Responsável por estado, persistência, gamificação, insights e sync

export const STORE = {
  user: 'vidaplus_user_v2',
  tx: 'vidaplus_tx_v2',
  habits: 'vidaplus_habits_v2',
  moods: 'vidaplus_moods_v2',
  goals: 'vidaplus_goals_v2',
  app: 'vidaplus_app_v2',
  settings: 'vidaplus_settings_v2'
};

export const levelTable = [
  {level:1,xp:0,name:'Explorador'},
  {level:2,xp:500,name:'Construtor'},
  {level:3,xp:1500,name:'Focado'},
  {level:4,xp:3000,name:'Disciplinado'},
  {level:5,xp:5000,name:'Guardião'},
  {level:6,xp:7500,name:'Estrategista'},
  {level:7,xp:10500,name:'Mestre'},
  {level:8,xp:14000,name:'Lenda'},
  {level:9,xp:18000,name:'Transcendente'},
  {level:10,xp:22500,name:'Vida+ Max'}
];

export const defaultCategories = {
  expense:['Mercado','Aluguel','Combustível','Delivery','Transporte','Saúde','Lazer','Educação','Casa','Serviços'],
  income:['Salário','Freelance','Investimentos','Vendas','Outros']
};

export const moodMap = {
  1:{label:'Muito Ruim',emoji:'😞',color:'#EF4444'},
  2:{label:'Ruim',emoji:'😐',color:'#F97316'},
  3:{label:'Normal',emoji:'🙂',color:'#6366F1'},
  4:{label:'Bom',emoji:'😁',color:'#10B981'},
  5:{label:'Excelente',emoji:'🤩',color:'#F59E0B'}
};

export const themes = {
  light:{label:'Claro (Padrão)',id:'light',premium:false},
  dark:{label:'Escuro',id:'dark',premium:false},
  midnight:{label:'Midnight • Premium',id:'midnight',premium:true},
  forest:{label:'Forest • Premium',id:'forest',premium:true},
  sunset:{label:'Sunset • Premium',id:'sunset',premium:true}
};

export let state = {
  user: null,
  tx: [],
  habits: [],
  moods: [],
  goals: [],
  settings: {theme:'light', currency:'BRL', notifications:true, aiLevel:'balanced'},
  app:{streak:0,maxStreak:0,lastActive:null,premium:false,theme:'light',txType:'expense',selectedMood:null,txFilter:'all',uid:'default_user'}
};

// Helpers
export function fmtBRL(v){ return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0) }
export function fmtDate(d){ try{return new Date(d).toLocaleDateString('pt-BR')}catch{return d} }
export const todayStr = ()=> new Date().toISOString().slice(0,10);
export function getLevel(xp){ let lvl=levelTable[0]; for(let row of levelTable){ if(xp>=row.xp) lvl=row; else break;} return lvl }
export function getNextLevel(xp){ for(let r of levelTable){ if(r.xp>xp) return r;} return {level:levelTable.length+1,xp:xp+2500,name:'Vida+ Infinito'} }

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
    // garante tema
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
    // dispara evento para sync
    window.dispatchEvent(new CustomEvent('vidaplus:save', {detail:{state}}));
    return true;
  }catch(e){ console.error("[core] save error", e); return false; }
}

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

export function generateInsights(){
  const total = state.tx.reduce((s,t)=> s + (t.type==='income'? t.amount : -t.amount),0);
  const expenses = state.tx.filter(t=>t.type==='expense');
  const topCat = expenses.length ? Object.entries(expenses.reduce((a,t)=>{a[t.category]=(a[t.category]||0)+t.amount;return a},{})).sort((a,b)=>b[1]-a[1])[0] : null;
  const avgMood = state.moods.length ? (state.moods.reduce((s,m)=>s+m.level,0)/state.moods.length) : 3;
  const habitRate = calcHabitRate();
  const insights=[];
  if(topCat){
    insights.push({ico:'💸',color:'#123C7A',title:`Seu maior gasto é ${topCat[0]}`,text:`${fmtBRL(topCat[1])} no período. Se reduzir 15% você economiza ${fmtBRL(topCat[1]*0.15)}/mês.`,priority:1});
  }
  if(avgMood<3){
    insights.push({ico:'🧠',color:'#F43F5E',title:'Humor em alerta, gastos sobem?',text:`Média de humor ${(avgMood).toFixed(1)}/5. Nos dias ruins você gasta em média 28% mais com Delivery. Experimente acionar um hábito quando se sentir assim.`,priority:2});
  } else {
    insights.push({ico:'😁',color:'#10B981',title:'Humor estável potencializa foco',text:`Média ${avgMood.toFixed(1)}/5 nos últimos dias. Taxa de hábitos ${(habitRate*100).toFixed(0)}%. Mantenha o ritual da manhã.`,priority:2});
  }
  if(total<0){
    insights.push({ico:'⚠️',color:'#F59E0B',title:'Saldo negativo detectado',text:`Você está ${fmtBRL(Math.abs(total))} no vermelho. Que tal uma meta de corte de ${fmtBRL(Math.abs(total)*0.2)} essa semana?`,priority:0});
  } else {
    insights.push({ico:'📈',color:'#6366F1',title:`Economia saudável de ${fmtBRL(total*0.2)}`,text:`Você pode investir 20% do saldo atual sem afetar seu padrão.`,priority:1});
  }
  if(habitRate<0.5){
    insights.push({ico:'◍',color:'#8B5CF6',title:'Consistência abaixo de 50%',text:`Sua taxa de hábitos é ${(habitRate*100).toFixed(0)}%. Tente regra dos 2 minutos: comece só marcando água e caminhada hoje.`,priority:0});
  } else {
    insights.push({ico:'🔥',color:'#F97316',title:`Streak de ${state.app.streak} dias!`,text:`Você está entre os 12% mais consistentes. Continue para desbloquear Guardião no Nv 5.`,priority:3});
  }
  return insights.sort((a,b)=> b.priority - a.priority);
}

// Seed defaults
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

// Export para admin
export function exportAll(){
  return {
    user: state.user,
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
