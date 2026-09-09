# Mirella na França — site da campanha

Site da vaquinha para custear o intercâmbio na **ECE Paris**.

- **No ar:** https://miborim.github.io/vakinha/
- **Stack:** React 19 + Vite 8, com pré-renderização (o HTML já sai pronto do build)

---

## Atualizar o valor arrecadado

Esse é o único fluxo que precisa ser usado no dia a dia.

```powershell
pwsh -File scripts/atualizar-arrecadacao.ps1
```

O script cuida de tudo: mostra o progresso atual, pergunta quanto adicionar
(dá para lançar vários valores e editar antes de confirmar), atualiza
`src/data/campaign.js`, faz commit e push na `develop`, abre o Pull Request para
a `main` e — se você quiser — aprova o PR, acompanha a publicação e confirma que
o site já está mostrando o valor novo.

Se algo der errado no meio do caminho (sem internet, branch fora de sincronia,
push recusado), ele **avisa e desfaz** o que fez, em vez de dizer que deu certo
sem ter publicado nada.

Para ver o que aconteceria, sem alterar nada:

```powershell
pwsh -File scripts/atualizar-arrecadacao.ps1 -DryRun
```

Requisitos: [Git](https://git-scm.com), [GitHub CLI](https://cli.github.com)
autenticado e PowerShell 7+.

---

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local
npm run build    # build de produção + pré-renderização
npm run preview  # confere o build final
npm run lint
```

Todo o conteúdo da campanha (meta, valor, PIX, contatos, data) fica em um único
arquivo: `src/data/campaign.js`.

## Deploy

Push na `main` dispara `.github/workflows/deploy.yml`, que roda o build e publica
no GitHub Pages. A `main` é protegida: as alterações entram por Pull Request a
partir da `develop`.

---

## Próximos passos

Melhorias mapeadas na auditoria técnica que ainda não foram feitas:

- [ ] **Auto-hospedar as fontes do Google.** Hoje Caveat, EB Garamond, Space Mono
      e Special Elite vêm do `fonts.googleapis.com` (`index.html`). Baixar os
      arquivos `.woff2`, servir do próprio domínio e declarar com `@font-face`
      elimina ~169 KB de terceiros e duas conexões externas no carregamento.
- [ ] **Submeter o sitemap no Google Search Console.** Verificar a propriedade do
      site e enviar `https://miborim.github.io/vakinha/sitemap.xml` para acelerar
      a indexação e acompanhar o desempenho nas buscas.
