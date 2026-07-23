# Vida+ AI — Evolution OS

**Sua evolução diária, inteligente.** App focado em finanças, hábitos, humor e metas com gamificação XP, níveis e relatórios de IA que cruzam seus dados.

## 🚀 Stack Modular (v2)

```
/index.html         -> App principal (usa módulos)
/admin.html         -> Console admin completo (temas, usuários, premium, Firebase explorer)
/css/style.css      -> Design system completo (light/dark/midnight/forest/sunset)
/js/
  firebase.js      -> Integração Firebase Realtime DB (REST + SDK compat) + sync
  core.js          -> Cérebro: state, gamificação, insights, seed, import/export
  app.js           -> UI, render, charts canvas vanilla, eventos
/assets/
  logo.png         -> Logo gerada IA
  favicon.png      -> Favicon V+
manifest.json      -> PWA
```

## 🔥 Firebase Integração

URL configurada: `https://rodadosabor-default-rtdb.firebaseio.com/`

**Como está integrado:**

- `js/firebase.js` tenta SDK compat (app-compat + database-compat) carregado via CDN.
- Se SDK falhar (falta apiKey ou permission denied), faz fallback REST `fetch(.../.json)` + localStorage.
- Todo `saveState()` dispara `vidaplus:save` que faz debounce e sincroniza coleções em `vidaplus/users/{uid}/transactions`, `habits`, `moods`, `goals`, `app`.

**Para desbloquear 100%:**

1. Vá em Firebase Console > Projeto `rodadosabor` > Configurações > Seus apps > copie `firebaseConfig`.
2. Cole no Admin Console (`admin.html`) no campo JSON e clique Salvar.
3. No Realtime Database > Rules, libere temporariamente para teste:

```json
{
  "rules": {
    "vidaplus": {
      ".read": true,
      ".write": true
    },
    "admin": {
      ".read": true,
      ".write": true
    }
  }
}
```

Depois restrinja por `auth != null && auth.uid === $uid`.

4. O app já faz sync automático. Verifique `● Sincronizado` no sidebar.

## 🛠️ Admin Console (admin.html)

- **Status Firebase**: troca URL, cola config, reconecta ao vivo.
- **Temas & Aparência**: preview de light/dark/midnight/forest/sunset, muda cor primária, força tema global e transmite via Firebase `admin_settings/theme`.
- **Usuários & Premium**: lista local + `adminListUsers()` do RTDB, ativa/desativa premium, impersonate por UID.
- **Financeiro Global**: KPIs agregados.
- **Sistema & Backup**: export/import JSON completo, limpeza, preparar GitHub.
- **RTDB Explorer**: digite qualquer path (ex: `vidaplus/users`) e veja JSON live.
- **Anúncios & Monetização**: edita banner, liga/desliga ads, força premium, salva em `admin/banner`.

## 📦 GitHub - Por que não push direto?

No ambiente Arena, não tenho token GitHub seu por segurança. Mas já preparei tudo:

```bash
git init
git add .
git commit -m "Vida+ AI v2 modular + Firebase RTDB + Admin"
git branch -M main
git remote add origin https://github.com/SEUUSER/vida-plus-ai.git
git push -u origin main
```

Se criar token em github.com/settings/tokens, posso fazer push via `default.bash` com `GITHUB_TOKEN` env.

## 🌗 Temas Premium

- `light` free
- `dark` free
- `midnight`, `forest`, `sunset` premium (libera via admin ou comprando no app)

Troca via `applyTheme(id)` em `core.js`. Premium gate checado em `toggleTheme()`.

## 🎮 Gamificação

Tabela: 0, 500, 1500, 3000, 5000, 7500, 10500, 14000, 18000, 22500 XP
+10 XP transação, +20 XP hábito, +15 XP humor, +30 XP meta, +100 XP meta concluída.

## ▶️ Rodar local

Só abrir `index.html` ou servir com `python -m http.server` ou Vercel drop.

Para Vercel: `vercel --prod` ou arraste pasta em vercel.com/new - zero config.

## 📄 Licença

MIT - use livre. Premium simulation sem cobrança real, pronto para Stripe/AdMob.

## Próximos passos sugeridos

- [ ] Adicionar login com Google (Firebase Auth)
- [ ] Notificações push por humor/hábito
- [ ] Export Excel real com SheetJS
- [ ] Onboarding com 3 passos
- [ ] Página `/public` com landing page SEO

Feito com ❤️ para evolução diária.
