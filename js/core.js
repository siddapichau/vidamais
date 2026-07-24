export const APP_VERSION = '2.3.6';

export const STORE = {
  user: 'vidaplus_user_v8',
  profile: 'vidaplus_profile_v8',
  settings: 'vidaplus_settings_v8',
  transactions: 'vidaplus_tx_v8',
  habits: 'vidaplus_habits_v8',
  moods: 'vidaplus_moods_v8',
  goals: 'vidaplus_goals_v8',
};

// 36 emojis disponíveis no seletor de avatar
export const avatarEmojis = [
  '🦊','🐱','🐶','🦁','🐯','🐼','🐨','🐸','🐵','🦄',
  '🐺','🦉','🦅','🐢','🐙','🐝','🦋','🌟','⚡','🔥',
  '💎','🌈','🍀','🌸','🌻','🍎','🍕','⚽','🎮','🎯',
  '🚀','🛡️','⚔️','👑','🧠','💡','🥷','🦸','🧚','🤖'
];

// === 50 níveis temáticos: Recruta (1) → Imortal (50) ===
const LEVEL_NAMES = [
  'Recruta','Soldado','Cabo','Sargento','Tenente','Capitão','Major','Comandante','Guerreiro','Lutador',
  'Batalhador','Iniciado','Aprendiz','Discípulo','Adepto','Praticante','Devoto','Fiel','Penitente','Monge',
  'Eremita','Sábio','Iluminado','Visionário','Mestre','Professor','Mentor','Guia','Conselheiro','Estrategista',
  'Tático','Líder','General','Comandante Supremo','Herói','Campeão','Lendário','Mítico','Semideus','Titã',
  'Ascendido','Transcendente','Arcano','Fênix','Estrela','Supernova','Quasar','Cosmos','Astral','Imortal'
];

const LEVEL_BENEFITS = [
  'Bem-vindo, Recruta! Sua jornada começa 🌱',
  'Desbloqueio: Tema Dark automático 🌓',
  'Adaptação de Soldado — +moedas de bônus',
  'Sargento: histórico básico liberado',
  'Tenente: gráfico de humor desbloqueado',
  'Capitão: +1 slot de hábito extra',
  'Major: relatório semanal liberado',
  'Comandante: insights financeiros IA',
  "Guerreiro: medalha 'Focado' 🏅",
  'Lutador: trilha de foco consolidada',
  'Batalhador: +100 🪙 bônus de batalha',
  'Iniciado: Tema Luxury Gold 💎 desbloqueado',
  'Aprendiz: heatmap de 90 dias',
  'Discípulo: exportar dados JSON',
  'Adepto: badges de constância',
  'Praticante: metas com sub-tarefas',
  'Devoto: relatório IA estendido',
  'Fiel: +2 slots de hábitos',
  'Penitente: Tema Cyberpunk 🌃 desbloqueado',
  'Monge: Multiplicador XP 1.1x por 7 dias',
  'Eremita: análise de tendências de humor',
  'Sábio: IA recomenda 3 ações por dia',
  'Iluminado: comparativo mês a mês',
  'Visionário: badge Analista Financeiro',
  'MEIO CAMINHO! Mestre: +500 🪙 + Dobro de moedas 24h 💰',
  'Professor: Tema Nature Eco 🌿 desbloqueado',
  'Mentor: projeção de metas com IA',
  'Guia: correlação humor × gasto',
  'Conselheiro: backup em nuvem semanal',
  'Estrategista: heatmap anual de hábitos',
  'Tático: sem marca d’água em relatórios',
  'Líder: Tema Deep Space 🚀 desbloqueado',
  'General: consultor IA sênior (premium)',
  'Comandante Supremo: plano de vida 5 anos (IA)',
  'Herói: acesso antecipado a novas features',
  'Campeão: Tema OLED Midnight 🌑 desbloqueado',
  'Lendário: medalha “Especialista” 🏅',
  'Mítico: Multiplicador XP 1.25x por 7 dias',
  'Semideus: +1000 🪙 bônus mítico',
  'Titã: heatmap anual completo',
  'Ascendido: consultor IA supremo',
  'Transcendente: metas com IA preditiva',
  'Arcano: temas exclusivos Arcano',
  'Fênix: renascimento de streak',
  'Estrela: badge “Estrela” ⭐',
  'Supernova: todos os temas futuros gratuitos',
  'Quasar: acesso Beta de novidades',
  'Cosmos: prêmio cósmico +2000 🪙',
  'Astral: quase Imortal! +2000 🪙',
  'IMORTAL 👑: Nível Máximo! Badge exclusiva do Orgulho Vida+'
];

// Prêmios REAIS aplicados ao subir de nível
const LEVEL_REWARDS = {
  2:  [{ type:'theme', value:'default-dark', label:'Tema Dark 🌓' }],
  6:  [{ type:'habitSlot', value:1, label:'+1 slot de hábito' }],
  11: [{ type:'coins', value:100, label:'+100 🪙' }],
  12: [{ type:'theme', value:'luxury', label:'Tema Luxury Gold 💎' }],
  18: [{ type:'habitSlot', value:2, label:'+2 slots de hábitos' }],
  19: [{ type:'theme', value:'cyberpunk', label:'Tema Cyberpunk 🌃' }],
  20: [{ type:'xpBoost', value:1.1, days:7, label:'Multiplicador XP 1.1x (7 dias)' }],
  25: [{ type:'coins', value:500, label:'+500 🪙' }, { type:'coins2x', days:1, label:'Dobro de moedas 24h 💰' }],
  26: [{ type:'theme', value:'nature', label:'Tema Nature Eco 🌿' }],
  32: [{ type:'theme', value:'space', label:'Tema Deep Space 🚀' }],
  36: [{ type:'theme', value:'oled', label:'Tema OLED Midnight 🌑' }],
  38: [{ type:'xpBoost', value:1.25, days:7, label:'Multiplicador XP 1.25x (7 dias)' }],
  39: [{ type:'coins', value:1000, label:'+1000 🪙' }],
  46: [{ type:'allThemesFree', label:'Todos os temas futuros gratuitos' }],
  48: [{ type:'coins', value:2000, label:'+2000 🪙' }],
  49: [{ type:'coins', value:2000, label:'+2000 🪙' }]
};

export function generateDefaultLevels(){
  const table = [];
  for(let i=1; i<=50; i++){
    const xp = i === 1 ? 0 : Math.round(Math.pow(i, 2.45) * 5.2);
    table.push({
      level: i,
      xp,
      name: LEVEL_NAMES[i-1] || `Nível ${i}`,
      benefit: LEVEL_BENEFITS[i-1] || 'Benefício especial',
      rewards: LEVEL_REWARDS[i] || []
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
  space: { label:'Deep Space', premium:true, icon:'🚀' },
  oled: { label:'OLED Midnight', premium:true, icon:'🌑', forceMode:'dark' }
};

export const financeCategories = {
  income: ['Salário','Freelance','Investimentos','Vendas','Outros'],
  expense: ['Alimentação','Transporte','Moradia','Lazer','Saúde','Educação','Compras','Contas','Outros']
};

export let appState = {
  user: {
    xp:0, level:1, premium:false, coins:0, streak:0,
    unlockedThemes: [], extraHabitSlots:0,
    coinsMultiplier:1, coinsMultiplierUntil:0,
    xpBoost:1, xpBoostUntil:0, allThemesFree:false,
    loginStreak:0, lastSeen:null,
    sharedApp:false, invites:0, referrals:0, reviewedApp:false, follows:false, inCommunity:false
  },
  profile: { name:'', email:'', firstName:'', lastName:'', phone:'', address:'', photo:'', avatar:'', createdAt: null },
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

// Aplica os prêmios reais dos níveis alcançados (prevLevel -> newLevel)
export function applyLevelRewards(prevLevel, newLevel, user){
  const gained = [];
  user = user || appState.user;
  for(let L=prevLevel+1; L<=newLevel; L++){
    const rewards = LEVEL_REWARDS[L];
    if(!rewards || !rewards.length) continue;
    rewards.forEach(r=>{
      if(r.type==='theme'){
        user.unlockedThemes = user.unlockedThemes || [];
        if(!user.unlockedThemes.includes(r.value)) user.unlockedThemes.push(r.value);
      } else if(r.type==='habitSlot'){
        user.extraHabitSlots = (user.extraHabitSlots||0) + (r.value||0);
      } else if(r.type==='coins'){
        user.coins = (user.coins||0) + (r.value||0);
      } else if(r.type==='coins2x'){
        user.coinsMultiplier = 2;
        user.coinsMultiplierUntil = Date.now() + (r.days||1)*86400000;
      } else if(r.type==='xpBoost'){
        user.xpBoost = r.value || 1;
        user.xpBoostUntil = Date.now() + (r.days||7)*86400000;
      } else if(r.type==='allThemesFree'){
        user.allThemesFree = true;
      }
      gained.push(r.label);
    });
  }
  return gained;
}

// Redução progressiva de anúncios conforme o nível
export function getAdSettings(state){
  const u = (state && state.user) || appState.user;
  const level = u.level || 1;
  const premium = !!u.premium;
  const enabled = !premium;
  // intervalo entre anúncios cresce com o nível (redução progressiva)
  const interval = enabled ? Math.round(Math.min(300, 45 + level*5)) : 0;
  const reductionPct = premium ? 100 : Math.min(95, level*2);
  return { enabled, interval, reductionPct };
}

// Streak de login diário (para medalhas de consistência + redução de anúncios)
export function trackDailyLogin(state){
  const u = (state && state.user) || appState.user;
  const today = new Date().toISOString().slice(0,10);
  if(u.lastSeen === today){
    return u.loginStreak || 0;
  }
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(u.lastSeen === yesterday){
    u.loginStreak = (u.loginStreak||0) + 1;
  } else {
    u.loginStreak = 1;
  }
  u.lastSeen = today;
  return u.loginStreak;
}

// Avatar: emoji > foto > inicial (nunca '?')
export function getAvatarChar(profile){
  profile = profile || {};
  const base = profile.firstName || profile.name || profile.email || '';
  if(!base) return '';
  return base.charAt(0).toUpperCase();
}

export function renderAvatarHTML(profile, opts){
  opts = opts || {};
  const size = opts.size || 40;
  const style = `width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;font-weight:800;flex-shrink:0;overflow:hidden;`;
  profile = profile || {};
  if(profile.avatar){
    return `<div class="avatar-circle" style="${style}background:var(--primary);color:white;font-size:${Math.round(size*0.5)}px">${profile.avatar}</div>`;
  }
  if(profile.photo){
    return `<div class="avatar-circle" style="${style}border:2px solid var(--border)"><img src="${profile.photo}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"></div>`;
  }
  const ch = getAvatarChar(profile) || '👤';
  return `<div class="avatar-circle" style="${style}background:var(--primary);color:white;font-size:${Math.round(size*0.42)}px">${ch}</div>`;
}

// Preenche um elemento .avatar-circle existente (preserva handlers de clique)
export function fillAvatar(el, profile){
  if(!el) return;
  el.className = 'avatar-circle';
  el.style.cssText = 'width:42px;height:42px;border-radius:50%;background:var(--primary);border:2px solid var(--border);overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;flex-shrink:0;';
  profile = profile || {};
  if(profile.avatar){
    el.textContent = profile.avatar;
    el.style.fontSize = '18px';
  } else if(profile.photo){
    el.innerHTML = `<img src="${profile.photo}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`;
  } else {
    const ch = getAvatarChar(profile) || '👤';
    el.textContent = ch;
    el.style.fontSize = '16px';
  }
}

// === 50 medalhas em 8 categorias ===
export const medalCategories = [
  { id:'xp', label:'XP', icon:'⚡' },
  { id:'financeiro', label:'Financeiro', icon:'💰' },
  { id:'habitos', label:'Hábitos', icon:'⭐' },
  { id:'humor', label:'Humor', icon:'🧠' },
  { id:'metas', label:'Metas', icon:'🎯' },
  { id:'progresso', label:'Progresso', icon:'📈' },
  { id:'social', label:'Social', icon:'🤝' },
  { id:'consistencia', label:'Consistência', icon:'🔥' }
];

function computeMedalStats(state){
  const u = state.user || {};
  const tx = state.transactions || [];
  const habits = state.habits || [];
  const moods = state.moods || [];
  const goals = state.goals || [];
  const p = state.profile || {};
  const xp = u.xp || 0;
  const coins = u.coins || 0;
  const premium = !!u.premium;
  const txCount = tx.length;
  const income = tx.filter(t=>t.type==='income').reduce((a,t)=>a+Number(t.amount||0),0);
  const expense = tx.filter(t=>t.type==='expense').reduce((a,t)=>a+Number(t.amount||0),0);
  const habitsLen = habits.length;
  const habitsDone = habits.reduce((a,h)=>a+((h.completedDates||[]).length),0);
  const maxHabitStreak = habits.reduce((a,h)=>Math.max(a,(h.streak||0)),0);
  const moodsLen = moods.length;
  const avgMood = moodsLen ? moods.slice(-30).reduce((a,b)=>a+b.value,0)/Math.min(30,moodsLen) : 0;
  const moodStreak = (()=>{ const set=new Set(moods.map(m=>m.date)); let s=0; const d=new Date(); while(set.has(d.toISOString().slice(0,10))){s++;d.setDate(d.getDate()-1);} return s; })();
  const moodRange = new Set(moods.map(m=>m.value)).size;
  const goalsLen = goals.length;
  const goalsDone = goals.filter(g=>g.done).length;
  const today = new Date().toISOString().slice(0,10);
  const hasProfile = !!(p.firstName || p.name);
  const all3today = habits.some(h=>(h.completedDates||[]).includes(today)) && moods.some(m=>m.date===today) && tx.some(t=>(t.date||'').slice(0,10)===today);
  const loginStreak = u.loginStreak || 0;
  const catExpense = new Set(tx.filter(t=>t.type==='expense').map(t=>t.category)).size;
  const shared = u.sharedApp ? 1 : 0;
  const invites = u.invites || 0;
  const referrals = u.referrals || 0;
  const reviewed = u.reviewedApp ? 1 : 0;
  const follows = u.follows ? 1 : 0;
  const inCommunity = u.inCommunity ? 1 : 0;
  return { xp, coins, premium, txCount, income, expense, habitsLen, habitsDone, maxHabitStreak,
    moodsLen, avgMood, moodStreak, moodRange, goalsLen, goalsDone, hasProfile, all3today,
    loginStreak, catExpense, shared, invites, referrals, reviewed, follows, inCommunity };
}

export const medalCatalog = [
  // XP (8)
  { id:'xp_first', name:'Primeiro Passo', desc:'Ganhe seu primeiro XP', icon:'🌱', cat:'xp', target:1, metric:s=>s.xp },
  { id:'xp_100', name:'Iniciante', desc:'Acumule 100 XP', icon:'🔰', cat:'xp', target:100, metric:s=>s.xp },
  { id:'xp_500', name:'Explorador', desc:'Acumule 500 XP', icon:'🧭', cat:'xp', target:500, metric:s=>s.xp },
  { id:'xp_1k', name:'Focado', desc:'Acumule 1.000 XP', icon:'🎯', cat:'xp', target:1000, metric:s=>s.xp },
  { id:'xp_5k', name:'Dedicado', desc:'Acumule 5.000 XP', icon:'💎', cat:'xp', target:5000, metric:s=>s.xp },
  { id:'xp_10k', name:'Especialista', desc:'Acumule 10.000 XP', icon:'🏅', cat:'xp', target:10000, metric:s=>s.xp },
  { id:'xp_20k', name:'Mestre', desc:'Acumule 20.000 XP', icon:'👑', cat:'xp', target:20000, metric:s=>s.xp },
  { id:'xp_50k', name:'Lenda', desc:'Acumule 50.000 XP', icon:'🌟', cat:'xp', target:50000, metric:s=>s.xp },

  // Financeiro (7)
  { id:'tx_1', name:'Registro Inicial', desc:'Crie sua 1ª transação', icon:'📝', cat:'financeiro', target:1, metric:s=>s.txCount },
  { id:'tx_10', name:'Organizado', desc:'10 transações registradas', icon:'💰', cat:'financeiro', target:10, metric:s=>s.txCount },
  { id:'tx_50', name:'Contador', desc:'50 transações', icon:'🧮', cat:'financeiro', target:50, metric:s=>s.txCount },
  { id:'inc_1k', name:'Primeiro Milhar', desc:'Receitas somam R$ 1.000', icon:'💵', cat:'financeiro', target:1000, metric:s=>s.income },
  { id:'inc_10k', name:'Dez Mil Reais', desc:'Receitas somam R$ 10.000', icon:'🤑', cat:'financeiro', target:10000, metric:s=>s.income },
  { id:'save_pos', name:'Mês Positivo', desc:'Economize no mês', icon:'✅', cat:'financeiro', target:1, metric:s=> s.income>s.expense ? 1 : 0 },
  { id:'cat_5', name:'Diversificado', desc:'Use 5+ categorias de despesa', icon:'🗂️', cat:'financeiro', target:5, metric:s=>s.catExpense },

  // Hábitos (8)
  { id:'hbt_1', name:'Primeiro Hábito', desc:'Crie seu 1º hábito', icon:'⭐', cat:'habitos', target:1, metric:s=>s.habitsLen },
  { id:'hbt_3', name:'Trindade', desc:'Tenha 3 hábitos ativos', icon:'🔱', cat:'habitos', target:3, metric:s=>s.habitsLen },
  { id:'hbt_5', name:'Múltiplos Hábitos', desc:'Tenha 5 hábitos', icon:'📋', cat:'habitos', target:5, metric:s=>s.habitsLen },
  { id:'hbt_done1', name:'Primeiro Check', desc:'Complete 1 hábito', icon:'☑️', cat:'habitos', target:1, metric:s=>s.habitsDone },
  { id:'hbt_done30', name:'Hábito de Aço', desc:'30 checks de hábito', icon:'⚡', cat:'habitos', target:30, metric:s=>s.habitsDone },
  { id:'hbt_done100', name:'Centena', desc:'100 checks de hábitos', icon:'💯', cat:'habitos', target:100, metric:s=>s.habitsDone },
  { id:'streak_7', name:'Semana Perfeita', desc:'Streak de 7 dias', icon:'🥈', cat:'habitos', target:7, metric:s=>s.maxHabitStreak },
  { id:'streak_21', name:'Disciplinado 21', desc:'Streak de 21 dias', icon:'🥇', cat:'habitos', target:21, metric:s=>s.maxHabitStreak },

  // Humor (5)
  { id:'mood_1', name:'Se Conhecendo', desc:'1º registro de humor', icon:'🧘', cat:'humor', target:1, metric:s=>s.moodsLen },
  { id:'mood_7', name:'Semana Interior', desc:'7 registros de humor', icon:'🧠', cat:'humor', target:7, metric:s=>s.moodsLen },
  { id:'mood_30', name:'Mês de Consciência', desc:'30 registros de humor', icon:'🫀', cat:'humor', target:30, metric:s=>s.moodsLen },
  { id:'mood_good', name:'Positivo', desc:'Humor médio ≥ 4 (últimos 7)', icon:'😊', cat:'humor', target:1, metric:s=> s.avgMood>=4 ? 1 : 0 },
  { id:'mood_range', name:'Arco-Íris', desc:'Use os 5 níveis de humor', icon:'🌈', cat:'humor', target:5, metric:s=>s.moodRange },

  // Metas (4)
  { id:'goal_1', name:'Realizador', desc:'Conclua 1 meta', icon:'🎉', cat:'metas', target:1, metric:s=>s.goalsDone },
  { id:'goal_3', name:'Três Conquistas', desc:'Conclua 3 metas', icon:'🏁', cat:'metas', target:3, metric:s=>s.goalsDone },
  { id:'goal_create', name:'Planejador', desc:'Crie 5 metas', icon:'🗺️', cat:'metas', target:5, metric:s=>s.goalsLen },
  { id:'goal_finish', name:'Finalizador', desc:'Conclua 5 metas', icon:'✅', cat:'metas', target:5, metric:s=>s.goalsDone },

  // Progresso (5)
  { id:'profile_set', name:'Identidade', desc:'Complete seu perfil', icon:'🪪', cat:'progresso', target:1, metric:s=> s.hasProfile ? 1 : 0 },
  { id:'coins_100', name:'Poupador', desc:'100 moedas acumuladas', icon:'🪙', cat:'progresso', target:100, metric:s=>s.coins },
  { id:'coins_500', name:'Premium Ready', desc:'500 moedas acumuladas', icon:'💠', cat:'progresso', target:500, metric:s=>s.coins },
  { id:'coins_1k', name:'Mil Moedas', desc:'1.000 moedas', icon:'🏛️', cat:'progresso', target:1000, metric:s=>s.coins },
  { id:'premium', name:'💎 Premium', desc:'Seja usuário Premium', icon:'👑', cat:'progresso', target:1, metric:s=> s.premium ? 1 : 0 },

  // Social (6)
  { id:'social_share', name:'Divulgador', desc:'Compartilhe o Vida+', icon:'📣', cat:'social', target:1, metric:s=>s.shared },
  { id:'social_invite', name:'Anfitrião', desc:'Convide 1 amigo', icon:'✉️', cat:'social', target:1, metric:s=>s.invites },
  { id:'social_referral', name:'Embaixador', desc:'3 referências confirmadas', icon:'🌍', cat:'social', target:3, metric:s=>s.referrals },
  { id:'social_review', name:'Apoiador', desc:'Avalie o app', icon:'⭐', cat:'social', target:1, metric:s=>s.reviewed },
  { id:'social_follow', name:'Seguidor', desc:'Siga o Vida+ nas redes', icon:'💙', cat:'social', target:1, metric:s=>s.follows },
  { id:'social_community', name:'Da Comunidade', desc:'Entre na comunidade', icon:'🤝', cat:'social', target:1, metric:s=>s.inCommunity },

  // Consistência (7)
  { id:'cons_3d', name:'Iniciante Constante', desc:'3 dias seguidos de uso', icon:'🔥', cat:'consistencia', target:3, metric:s=>s.loginStreak },
  { id:'cons_7d', name:'Semana de Ferro', desc:'7 dias seguidos', icon:'🗓️', cat:'consistencia', target:7, metric:s=>s.loginStreak },
  { id:'cons_14d', name:'Quinzena Firme', desc:'14 dias seguidos', icon:'📆', cat:'consistencia', target:14, metric:s=>s.loginStreak },
  { id:'cons_30d', name:'Mesão de Aço', desc:'30 dias seguidos', icon:'🏋️', cat:'consistencia', target:30, metric:s=>s.loginStreak },
  { id:'cons_mood7', name:'Autoconhecido', desc:'7 dias seguidos de humor', icon:'🌿', cat:'consistencia', target:7, metric:s=>s.moodStreak },
  { id:'cons_habit21', name:'Disciplinado 21', desc:'21 dias seguidos de hábito', icon:'🥇', cat:'consistencia', target:21, metric:s=>s.maxHabitStreak },
  { id:'cons_triple', name:'Dia Completo', desc:'Hábito+Humor+Transação no mesmo dia', icon:'⭐', cat:'consistencia', target:1, metric:s=> s.all3today ? 1 : 0 }
];

export function evaluateMedals(state){
  const s = computeMedalStats(state);
  return medalCatalog.map(m=>{
    const v = m.metric ? m.metric(s) : 0;
    const target = m.target || 1;
    const pct = Math.max(0, Math.min(100, Math.round((v/target)*100)));
    return { ...m, current:v, target, pct, unlocked: v>=target };
  });
}

// === Persistência local ===
export function resetAppState(){
  appState.user = {
    xp:0, level:1, premium:false, coins:0, streak:0,
    unlockedThemes: [], extraHabitSlots:0,
    coinsMultiplier:1, coinsMultiplierUntil:0,
    xpBoost:1, xpBoostUntil:0, allThemesFree:false,
    loginStreak:0, lastSeen:null,
    sharedApp:false, invites:0, referrals:0, reviewedApp:false, follows:false, inCommunity:false
  };
  appState.profile = { name:'', email:'', firstName:'', lastName:'', phone:'', address:'', photo:'', avatar:'', createdAt: null };
  appState.settings = { theme:'default-light', currency:'BRL', language:'pt-BR' };
  appState.transactions = [];
  appState.habits = [];
  appState.moods = [];
  appState.goals = [];
  appState.isLoaded = false;
  try{ document.documentElement.setAttribute('data-theme', appState.settings.theme); }catch(e){}
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
