# Changelog v2.3.5 — Hotfix de Estabilidade (corrige tela congelada)

Data: 2026-07-24
Branch: `arena/019f951f-vidamais`
Base: `main`

## Resumo
Hotfix **v2.3.5** focado em corrigir o cenário em que o app abria mas "congelava" (nada carregava / nada respondia a cliques) após a atualização para v2.3.4.

## 🔍 Causa raiz identificada
O app é um **PWA com Service Worker** que cacheia `core.js`/`app.js`. O v2.3.4 alterou os exports de `core.js` e o `app.js` passou a importá-los. Durante a transição do SW, o SW **antigo podia servir um `core.js` obsoleto junto com o `app.js` novo**, causando falha de *link* de módulo ES ("does not provide an export named …"). Como o `index.html` importa esses módulos, o **grafo de módulos inteiro falhava** → `navigate`/`onAppStateUpdate` nunca eram definidos → tela congelada (sem erro visível).

## ✅ Correções
1. **Consistência de cache do SW (principal correção)**
   - Bump do cache: `vidamais-v2-3-4` → `vidamais-v2-3-5` (força re-download de todos os assets).
   - `index.html`: ao registrar o SW, adicionado `controllerchange` → `location.reload()`. Assim que o novo SW assume o controle, a página recarrega com módulos **consistentes** (mesma versão), eliminando a janela de arquivos misturados.
2. **Overlay de erro global** (`index.html`, `<head>`, script simples não-módulo): captura falhas de import/módulo e exibe aviso clicável ("toque para recarregar / F5"), em vez de congelar em silêncio.
3. **`onAppStateUpdate` envelopado em `try/catch`** na shell, para que um erro de renderização pontual não quebre a navegação.
4. **Bug funcional de avatar corrigido**: nas páginas (iframe) o helper estava sendo chamado como `window.fillAvatar`, mas ele é exposto no **`parent`**. Trocado para `parent.fillAvatar` em `perfil.html` e `home.html` → o seletor de 36 emojis e a pré-visualização do avatar agora funcionam de verdade.
5. Bump de versão em `core.js` (`APP_VERSION`), `manifest.json` e `index.html` (badges/sync).

## 🧪 Validação
- `node --check` em `core.js`, `app.js` e no módulo de `index.html`: OK.
- Harness Node com stubs de DOM/Firebase: carregamento de `core.js`+`app.js`, init, `onAppStateUpdate` da shell, e `updateUI` de **todas** as páginas (home, perfil, conquistas, insumos, auth, dashboard, habitos, metas, relatorios) executam sem erro.
- Caminho de usuário logado simulado (sync + level-up aplicando prêmios + compra na loja): OK.
- `fillAvatar` com emoji/foto/inicial: OK.

## Como testar (garantia extra)
1. Servir via `python -m http.server 8000` (ou abrir o PWA).
2. Se aparecer o aviso vermelho de erro de carregamento, **toque nele ou pressione F5** — ele força o reload com o SW novo e os módulos consistentes.
3. Navegação (Home/Dash/Financeiro/…) deve funcionar; avatar com emoji selecionável no Perfil.

## Arquivos modificados (v2.3.5)
`index.html`, `js/core.js`, `sw.js`, `manifest.json`, `pages/home.html`, `pages/perfil.html`
