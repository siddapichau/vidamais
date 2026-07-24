# Changelog v2.3.4 — Guerreiro da Evolução

Data: 2026-07-24
Branch: `arena/019f951f-vidamais`
Base: `main` (já contém v2.3.3)

## Resumo
Atualização **v2.3.4** focada em corrigir 5 bugs críticos de sessão/persistência e tornar *reais* os prêmios do sistema de gamificação (temas, redução de anúncios, boost de XP e dobro de moedas por nível), além de novas categorias de medalhas, dicas de IA para iniciantes e o tema OLED Midnight.

## 🐛 Bugs críticos corrigidos
1. **Usuário logado continuava vendo tela de entrar** — `syncWithFirebase` agora carimba `profile.email` e `profile.photo` a partir do usuário autenticado em ambos os caminhos (dados existentes ou conta nova), garantindo o estado "logado" na shell e nas páginas.
2. **Avatar aparecendo como `?`** — novo helper `fillAvatar()` (emoji > foto > inicial) usado na shell e no Perfil; fallback nunca mais mostra `?` (usa `👤` quando não há dado).
3. **Transações não carregavam/adicionavam (race de persistência)** — durante o sync o debounce do Firebase é travado (`isSyncing`); arrays são **mesclados por id** (local + remoto), preservando adições feitas antes do sync; flush imediato em `pagehide`/`visibilitychange`. Seeds de demonstração não sobrescrevem mais o Firebase.
4. **Logout não limpava sessão anterior** — `logout` reseta o estado em memória (`resetAppState`), limpa o storage e só então faz `signOut` + reload, sem flash de dados do usuário anterior.
5. **Moedas descontadas em dobro na loja** — compra movida para `purchaseStoreItem()` atômico com guarda anti duplo-clique: desconta **uma única vez** e persiste uma vez.

## ✨ Features novas
- **50 níveis com nomes temáticos únicos**: `Recruta` (1) → `Imortal` (50), com curva de XP progressiva.
- **Prêmios REAIS por nível** aplicados ao subir de nível (`applyLevelRewards`):
  - Desbloqueio de temas (Dark, Luxury, Cyberpunk, Nature, Deep Space, OLED) — selecionáveis grátis quando desbloqueados.
  - **Redução progressiva de anúncios** conforme o nível (`getAdSettings`: intervalo cresce e redução chega a ~95%; Premium remove anúncios).
  - **Boost de XP** (1.1x / 1.25x por 7 dias) respeitado em `addXP`.
  - **Dobro de moedas** (24h) e bônus de moedas nos marcos.
- **50 medalhas em 8 categorias** (era 6): adicionadas **Social** (6) e **Consistência** (7). Cada medalha exibe **barra de progresso** visível (`evaluateMedals` em `core.js`).
- **Dicas de IA para iniciantes** contextuais na Home (baseadas no progresso: perfil, transações, hábitos, humor, metas).
- **Seletor de avatar com 36 emojis** no Perfil (`avatarEmojis`), com toggle e persistência em `profile.avatar`.
- **Tema novo: OLED Midnight** (`oled-dark`, fundo #000 com acento ciano), premium.
- **Próximas recompensas visíveis nas Conquistas** com progresso (já existia; agora com barra e ordenação por % concluída).

## 🔧 Arquivos modificados
- `js/core.js` — níveis Recruta→Imortal + `rewards`, `themes.oled`, `avatarEmojis`, `medalCategories`/`medalCatalog`/`evaluateMedals`, `getAdSettings`, `applyLevelRewards`, `trackDailyLogin`, `renderAvatarHTML`/`fillAvatar`, `resetAppState`, `APP_VERSION`.
- `js/app.js` — sync merge + lock (`isSyncing`), `flushFirebaseSave`, perfil do auth user, `addXP` com prêmios + boost, `appSelectTheme` (OLED forceMode + temas desbloqueados grátis), `logout` robusto, `purchaseStoreItem` atômico, helpers expostos.
- `index.html` — `fillAvatar` na shell, versão v2.3.4 (badge, sync, footer).
- `pages/home.html` — dicas de IA, banner de redução de anúncios, compartilhar, avatar.
- `pages/conquistas.html` — 8 categorias com barras de progresso + próximas recompensas.
- `pages/perfil.html` — seletor de avatar por emoji (36).
- `pages/insumos.html` — compra via `purchaseStoreItem` (sem duplo débito).
- `css/style.css` — `[data-theme="oled-dark"]`.
- `manifest.json`, `sw.js` — versão v2.3.4 / cache `vidamais-v2-3-4`.

## 📊 Estatísticas
- 50 medalhas em 8 categorias (era 6)
- 50 níveis nomeados Recruta→Imortal (era por tiers genéricos)
- 5 bugs críticos corrigidos
- 1 tema novo (OLED Midnight)
- 1 seletor de avatar (36 emojis)
- 13 arquivos modificados

## Como testar
1. `python -m http.server 8000` e abrir `index.html`.
2. Logar → shell mostra avatar (emoji/inicial), sem tela de "entrar".
3. Perfil → escolher 1 dos 36 emojis → salvar → avatar reflete em toda a app.
4. Subir de nível (vídeo/transações) → toast com prêmios reais; temas desbloqueados ficam grátis.
5. Conquistas → 8 categorias com barras de progresso; "Próximas recompensas" com %.
6. Home → dicas de IA contextuais; banner de anúncio com redução % crescente por nível.
7. Insumos → comprar itens sem débito em dobro; recarregar a página no meio de uma ação não perde dados (merge por id).
8. Logout → estado limpo, sem dados do usuário anterior.
