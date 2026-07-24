# Vida+ AI — v2.3.6 — "Tela Congelada: RAID ROOT CAUSE"

**Data:** 2026-07-24
**Branch:** `arena/019f951f-vidamais` (atualiza a PR #14 → v2.3.6)

---

## Sintoma reportado
> "Abre normal mas nada funciona. Fica travado na tela inicial. Clico e nada acontece."
> Persistiu do v2.3.4 até o v2.3.5.

HTML/CSS renderizavam normalmente (o app "abria"), mas **todo clique era um no-op**:
a função `navigate()` e todas as funções do shell simplesmente não existiam.

---

## Causa raiz (encontrada e reproduzida)

**Bug de import faltando no `js/app.js`.**

`js/app.js` referenciava `fillAvatar` na linha `window.fillAvatar = fillAvatar;`,
porém **não o importava** do `core.js`:

```js
// ANTES (quebrado) — fillAvatar NÃO estava na lista de imports:
import { appState, saveLocalState, ..., resetAppState } from './core.js';
...
window.fillAvatar = fillAvatar;   // <- ReferenceError: fillAvatar is not defined
```

Em um módulo ES (modo `strict`), referenciar um identificador não declarado lança
`ReferenceError` **durante a avaliação do módulo**. Como `index.html` carrega
`app.js` via `<script type="module">`, a falha aborta o *link* de TODO o grafo de
módulos — e as funções `window.navigate`, `toggleMobileMenu`, `appToggleTheme` e
`onAppStateUpdate` (todas definidas DENTRO desse módulo) **nunca chegavam a ser
definidas**. Resultado: a página abre, mas nenhum botão funciona.

**Por que só quebrou no v2.3.4?** O `fillAvatar` foi introduzido no `core.js` no
v2.3.4 e passou a ser usado no `app.js`, mas o `import` não foi atualizado. O
v2.3.5 tentou consertar via Service Worker (reload no `controllerchange`), o que
**não adiantou**: o SW só re-executava o mesmo módulo quebrado → congelava de novo.

**Como confirmamos (reprodução em harness Node):**
- Cenário ANTIGO + Firebase OK → `RESULT: FROZEN (fillAvatar is not defined)`, `window.navigate === undefined`.
- O bug foi mascarado nas investigações anteriores porque os harnesses pré-declaravam os nomes, escondendo o erro real.

---

## Correções aplicadas (v2.3.6)

### 1. Correção da causa raiz (obrigatória)
- `js/app.js`: adicionado **`fillAvatar`** ao `import` do `core.js`. O grafo de
  módulos agora linka com sucesso e todas as funções do shell são definidas.

### 2. Firebase agora é opcional (resiliência extra — "nunca mais congela")
Antes, `app.js` e `index.html` importavam o Firebase (e o CDN `gstatic`) de forma
**estática no topo**. Se o CDN estivesse bloqueado/offline, TODO o app morria.
Agora:
- `js/app.js`: Firebase é carregado via **`import()` dinâmico dentro de
  `initFirebase()`**, envolto em `try/catch`. Se falhar, o app entra em
  **modo local** (`appState.isLoaded = true`) e continua 100% funcional
  (XP, moedas, hábitos, humor, metas, loja, temas).
- `js/app.js`: todas as funções que usam Firebase foram protegidas
  (`debounceSaveToFirebase`, `flushFirebaseSave`, `loginEmail`, `signupEmail`,
  `loginGoogle`, `logout`, listeners de `admin/levels` e `admin/menu`).
- `index.html`: removido o `import` estático do Firebase do módulo principal
  (o `admin/menu` live foi movido para dentro do `initFirebase` em `app.js`).

### 3. Shell resiliente (já presente, mantido)
`index.html` continua com um `<script>` comum (não-módulo) que define
`window.navigate`/`toggleMobileMenu`/`appToggleTheme`/`onAppStateUpdate` de forma
independentemente do módulo. É a 3ª camada de proteção: mesmo que o grafo de
módulos falhe por qualquer motivo futuro, a navegação sobrevive.

---

## Verificação (harness automatizado, Node + DOM stub)

| Cenário | Antes (v2.3.4/2.3.5) | Depois (v2.3.6) |
|---|---|---|
| Firebase acessível | ❄️ FROZEN (`fillAvatar is not defined`) | ✅ OK: navigate/addXP/fillAvatar funcionam |
| Firebase BLOQUEADO (gstatic) | ❄️ FROZEN | ✅ OK: modo local, sem congelamento |

Testes funcionais executados no harness (ambos os cenários):
- `navigate('dashboard.html')` → define `iframe.src = pages/dashboard.html` ✅
- `addXP(50)` → `xp=50`, `coins=50`, `isLoaded=true` ✅
- `addTransaction(...)` → adiciona transação ✅
- `fillAvatar` exposto em `window` ✅

---

## Arquivos alterados
- `js/app.js` — import de `fillAvatar` + Firebase dinâmico/tolerante a falhas
- `index.html` — remove import estático do Firebase do módulo; bump v2.3.5 → v2.3.6
- `js/core.js` — `APP_VERSION` → `2.3.6`
- `sw.js` — `CACHE_NAME` → `vidamais-v2-3-6`
- `manifest.json` — nome → `v2.3.6`

## Conclusão
A tela congelada era um **erro de import faltando** (`fillAvatar`) — exatamente o
"falta de algo" suspeitado. Corrigido na raiz, e o app agora também sobrevive a
falhas de rede no Firebase. **Congelamento resolvido.**
