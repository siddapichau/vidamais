# Changelog v2.3.3 — 50 Níveis, 50 Medalhas & Fixes

Data: 2026-07-24
Branch: `arena/019f94eb-vidamais`

## Resumo
Atualização **v2.3.3** focada em expandir o sistema de gamificação (agora com 50 medalhas reais, benefícios únicos por nível) e corrigir bugs identificados na v2.3.2.

## ✨ Features Novas

### 🏅 50 Medalhas / Conquistas (antes eram só 10)
Organizadas em 6 categorias:
- **XP** (13): Primeiro Passo, Iniciante, Explorador, Focado, Dedicado, Disciplinado, Especialista, Mestre, Lenda, Supremo, Transcendente, Nv10, Meio Caminho (Nv25)
- **Financeiro** (10): Registro Inicial, Organizado, Contador, Financeiro, Primeiro Milhar, Dez Mil Reais, Mês Positivo, Economista, Diversificado, Frequente
- **Hábitos** (10): Primeiro Hábito, Trindade, Múltiplos Hábitos, Primeiro Check, Constante 7, Hábito de Aço, Centena, Streak 3/7/21
- **Humor** (6): Se Conhecendo, Semana Interior, Mês de Consciência, Autoconhecimento, Positivo, Arco-Íris
- **Metas** (5): Realizador, Três Conquistas, Planejador, Finalizador, Desafiador
- **Progresso** (6): Identidade, Poupador, Premium Ready, Mil Moedas, Premium, Dia Completo

Cada medalha mostra a categoria e há contador global (`X/50` + porcentagem) no topo.

### 🆙 Benefícios únicos por nível (50 benefícios)
Antes: 10 benefícios repetindo em ciclo. Agora: cada nível (1 a 50) tem um benefício único e progressivo, desde desbloqueio de temas até multiplicadores de XP, análises IA, badges exclusivas e bônus de moedas.

### 🪙 Bônus ao subir de nível
Agora **cada level-up dá +50 moedas** automaticamente e exibe um toast comemorativo com o nome do novo nível.

### 🔥 Streak global do usuário
Antes sempre 0. Agora é recalculado automaticamente como o maior streak entre hábitos e registros de humor (dias consecutivos).

### 💰 Multiplicador de moedas na loja
O item "Dobro de moedas 24h" agora **realmente funciona**: assistir vídeo ganha 2x moedas quando ativo (verificação de expiração por timestamp).

### 🛒 Loja corrigida e com estado persistente
- Bug de dedo-duro corrigido (moedas eram descontadas duas vezes em cada compra)
- Comprar Luxury agora realmente ativa `premium = true`
- `habit_slot` agora salva `extraHabitSlots` no estado do usuário
- `xp_boost` funciona e o save é feito antes de dar XP

### 🎨 Outros melhoramentos
- **Tema Dark**: adicionadas as cores que faltavam para moods 2, 3, 4 no calendário (antes só 1 e 5 tinham estilo dark)
- **Versão** atualizada para `v2.3.3` em: badge do header, footer/sync, manifest, e cache do Service Worker
- **Service Worker** atualizado (cache `vidamais-v2-3-3`) com mais assets: `admin.html`, `debug.html`, `sw.js`, logos
- **Helpers globais expostos**: `saveLocalState`, `loadLocalState`, `uid` agora disponíveis via `parent.*` para as páginas iframe
- **Vídeo premiado** respeita multiplicador 2x da loja e mostra feedback visual

## 🐛 Bugs corrigidos
1. **Crash em `financeiro.html`**: havia resto de edição `function openTxModal/edit(){}` que quebrava o JS inteiro da página — removido
2. **Moedas não salvas** em algumas ações: ao adicionar moedas manualmente (ex.: vídeo), o estado global era alterado mas o `saveLocalState` não estava exposto no window → agora exposto
3. **Deduplicação de moedas na loja**: compra desconta moedas só 1 vez
4. **Streak do usuário sempre 0**: agora calculado a cada XP adicionado
5. **Tema Luxury não persistia o premium**: comprando pela loja, `premium=true` não era salvo — corrigido
6. **Cores mood calendário dark**: faltavam 3 das 5 cores no tema escuro
7. **SW desatualizado**: cache antigo (v2-3-2) não servia os arquivos novos (agora v2-3-3)

## 📊 Estatísticas da mudança
- 50 medalhas reais (antes 10)
- 50 benefícios únicos por nível (antes 10 repetindo)
- 6 bugs corrigidos
- 9 arquivos modificados
- Cores dark completas no calendário
- Sistema de multiplicador de moedas funcional

## Como testar
1. Abrir `index.html` (ou `python -m http.server 8000`)
2. Entrar em Conquistas → ver contador 0/50, as 50 medalhas em 6 categorias
3. Entrar em Insumos/Loja → comprar itens sem bug de moedas
4. Ver moedas aumentando em ações (vídeo, transações, hábitos, humor, metas)
5. Subir de nível → toast de parabéns +50 🪙
6. Tema dark → checar calendário de humor com todas as 5 cores visíveis
7. PWA: SW atualizado, cache fresco
