# Vida+ AI — v2.3.7 — XP justo, moeda de verdade, IA no Dashboard e notas de humor

**Data:** 2026-07-24
**Branch:** `arena/019f951f-vidamais` (acrescenta a PR #15 / v2.3.6)

---

## Correções e melhorias (pedidos do usuário)

### 1. Fim do XP infinito — "1 vez por atividade por dia"
Antes dava para farmar XP infinito trocando o humor, marcando/desmarcando
hábito, criando várias metas ou clicando em "Check geral"/"Assista e Ganhe".
Agora existe `awardDailyXp(tipo, valor)` que **só concede XP na PRIMEIRA vez**
que a atividade é feita no dia:

- Humor: só o 1º registro do dia dá +15 XP (trocar o humor não dá mais).
- Hábito (criar): +20 XP 1x/dia.
- Hábito (check): +15 XP **por hábito** 1x/dia (marcar/desmarcar não farmeia).
- Meta (criar): +30 XP 1x/dia (2ª meta não dá).
- Transação: +10/+5 XP 1x/dia.
- "Check diário" (dashboard) e "Assista e Ganhe" (home): recompensa 1x/dia.

### 2. Conversão de moeda de verdade
Ao trocar a moeda (ex.: BRL → USD) os valores **já registrados são
convertidos** seguindo taxas de câmbio (base BRL). Ex.: 1000 BRL vira o
equivalente em USD (~185). Implementado em `appChangeCurrency` + `convertCurrency`
(em `core.js`). Taxas são estáticas/aproximadas (`EXCHANGE_RATES`).

### 3. Hábitos registrando e salvando
O "não salvava hábitos" era consequência do app congelado (módulo não
executava → `parent.addHabit` era `undefined`). Com o v2.3.6 o app carrega e
`addHabit` persiste normalmente em `localStorage`. Verificado por harness:
`localStorage['vidaplus_habits_v8']` reflete o estado.

### 4. Nota do humor por dia (clicável)
No calendário de `humor.html`, os dias que têm registro ficam clicáveis e
abrem um modal com **data, humor e a nota escrita naquele dia**.

### 5. Dashboard com Análise IA + mais informações
- Novo card **"Análise IA de hoje"** (saudação + LifeScore, economia do mês,
  hábitos do dia e humor médio 7d).
- Novos KPIs: 🔥 Sequência de login, 🪙 Moedas (faltam p/ 500), 🏅 Medalhas
  desbloqueadas e XP para o próximo nível.

### 6. IA inicial no Home
O card de dicas de IA **nunca fica vazio**: quando não há pendências, mostra
uma análise inicial contextual (nível atual + orientação).

---

## Arquivos alterados
- `js/app.js` — `awardDailyXp` (XP diário), cap em addMood/addGoal/addHabit/
  toggleHabit/addTransaction, cap em watchVideo/doTask (via `parent.awardDailyXp`),
  `appChangeCurrency` com conversão.
- `js/core.js` — `EXCHANGE_RATES` + `convertCurrency`.
- `pages/home.html` — watchVideo 1x/dia, dica de IA inicial sempre visível.
- `pages/dashboard.html` — card Análise IA + KPIs extras, "Check diário" 1x/dia.
- `pages/humor.html` — calendário clicável → modal com nota do dia.
- `index.html`, `manifest.json`, `sw.js`, `js/core.js` — versão → `2.3.7`.

## Verificação (harness Node + DOM stub)
11/11 testes passaram: persistência de hábitos, XP 1x/dia (humor, toggle,
transação, meta, check), conversão 4500 BRL → 832.5 USD, e nota de humor salva.
