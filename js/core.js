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
  // 50 níveis com nomes temáticos e benefícios progressivos únicos
  const tiers = [
    { prefix:'Despertar',    count:5  }, // 1-5
    { prefix:'Foco',         count:5  }, // 6-10
    { prefix:'Constância',   count:7  }, // 11-17
    { prefix:'Hábito',       count:7  }, // 18-24
    { prefix:'Evolução',     count:8  }, // 25-32
    { prefix:'Mestre',       count:7  }, // 33-39
    { prefix:'Lenda',        count:6  }, // 40-45
    { prefix:'Supremo',      count:3  }, // 46-48
    { prefix:'Transcendente',count:2  }, // 49-50
  ];
  const benefits = [
    'Boas-vindas ao Vida+! Comece sua evolução',                          // 1
    'Desbloqueio: Tema Dark disponível',                                   // 2
    '+50 moedas de bônus inicial',                                         // 3
    'Insight financeiro básico liberado',                                  // 4
    'Desbloqueio: Gráfico de humor',                                       // 5
    'Primeiro marco — trilha Foco',                                        // 6
    '+1 slot extra de hábitos',                                            // 7
    'Histórico completo de 30 dias',                                       // 8
    'Relatório IA estendido',                                              // 9
    '🏅 Medalha "Focado" desbloqueada',                                    // 10
    'Entrada na Constância — +100 🪙 bônus',                               // 11
    'Desbloqueio: Tema Luxury Gold',                                       // 12
    'Heatmap de hábitos 90 dias',                                          // 13
    'Insights semanais por e-mail (em breve)',                             // 14
    'Gráficos avançados de categorias',                                    // 15
    'Badge: Constante 7 dias',                                             // 16
    'Exportação de dados em JSON',                                         // 17
    'Entrada na fase Hábito',                                              // 18
    'Desbloqueio: Tema Cyberpunk',                                         // 19
    'Multiplicador XP 1.1x por 7 dias',                                    // 20
    'Relatório correlação humor × gasto',                                  // 21
    'Lembretes personalizados (em breve)',                                 // 22
    '+2 slots de hábitos',                                                 // 23
    '🎖️ Medalha "Disciplinado"',                                           // 24
    'Marco 25 — MEIO CAMINHO! +500 🪙',                                    // 25
    'Desbloqueio: Tema Nature Eco',                                        // 26
    'Análise de tendências de humor',                                      // 27
    'Metas com sub-tarefas (em breve)',                                    // 28
    'IA recomenda 3 ações por dia',                                        // 29
    'Comparativo mês a mês no relatório',                                  // 30
    'Badge Analista Financeiro',                                           // 31
    'Desbloqueio: Tema Deep Space',                                        // 32
    'Entrada na fase Mestre!',                                             // 33
    'Correlação avançada entre hábitos e humor',                           // 34
    'Backup em nuvem semanal (automático)',                                // 35
    'Tema escuro OLED (economia de bateria)',                              // 36
    'Medalha "Especialista"',                                              // 37
    'Projeção de metas com IA',                                            // 38
    '+1000 🪙 bônus de mestre',                                            // 39
    'Fase Lenda! 🏆',                                                      // 40
    'Consultor IA sênior (insights premium)',                              // 41
    'Sem marca d\'água em relatórios',                                     // 42
    'Heatmap anual de hábitos (365 dias)',                                 // 43
    'Medalha "Mestre Supremo"',                                            // 44
    'Plano de vida 5 anos gerado por IA (em breve)',                       // 45
    'Fase Supremo 🔥',                                                     // 46
    'Todos os temas futuros gratuitos',                                    // 47
    'Acesso antecipado a novas features',                                  // 48
    'Transcendente — quase lá! +2000 🪙',                                  // 49
    '👑 NÍVEL MÁXIMO! Você é o Orgulho do Vida+! Badge exclusiva',         // 50
  ];

  const table = [];
  let level = 1;
  for(const tier of tiers){
    for(let sub=1; sub<=tier.count; sub++){
      const i = level;
      let xp = i === 1 ? 0 : Math.round(Math.pow(i, 2.45) * 5.2);
      table.push({
        level: i,
        xp: xp,
        name: `${tier.prefix} ${sub}`,
        benefit: benefits[i-1] || 'Benefício especial',
      });
      level++;
    }
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
