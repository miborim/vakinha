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

### Atalho na área de trabalho

Para não precisar do terminal, crie um atalho com ícone do site:

```powershell
pwsh -File scripts/criar-atalho.ps1
```

Depois é só dar dois cliques em **"Atualizar arrecadacao"** na área de trabalho.
Rode o comando de novo se a pasta do projeto mudar de lugar.

---

## Configurar em um computador novo

Passo a passo para deixar a atualização da vaquinha funcionando em outra máquina.
**Não é preciso copiar nada pelo pendrive ou pela rede** — está tudo no GitHub, e
o que falta é gerado na hora.

### 1. Instalar os três programas

Abra o **Terminal do Windows** (ou o Prompt de Comando) e cole:

```powershell
winget install --id Microsoft.PowerShell -e
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

Depois **feche e abra o terminal de novo**, para que ele reconheça os comandos
recém-instalados. A partir daqui, use o **PowerShell 7** (procure por "PowerShell 7"
no menu Iniciar).

### 2. Entrar na conta do GitHub

```powershell
gh auth login
```

Responda: **GitHub.com** → **HTTPS** → **Yes** (autenticar o Git com suas
credenciais) → **Login with a web browser**. Entre com a conta **`miborim`**.

### 3. Dizer ao Git quem é você

Sem isso, o commit falha na hora de registrar a doação:

```powershell
git config --global user.name "Mirella Borim"
git config --global user.email "miborim@users.noreply.github.com"
```

### 4. Baixar o projeto

O repositório é **privado**, por isso o passo 2 (login) precisa vir antes deste.

Escolha uma pasta **fora do OneDrive** (a sincronização pode corromper o
histórico do Git) e **fora de Downloads** (pasta que costuma ser limpa):

```powershell
mkdir "$env:USERPROFILE\Projetos"
cd "$env:USERPROFILE\Projetos"
gh repo clone miborim/vakinha
cd vakinha
```

### 5. Criar o atalho na área de trabalho

```powershell
pwsh -File scripts/criar-atalho.ps1
```

### 6. Testar sem alterar nada

```powershell
pwsh -File scripts/atualizar-arrecadacao.ps1 -DryRun
```

Se aparecer o valor atual da campanha e a barra de progresso, está tudo certo.
O modo teste não altera nada, não faz commit e não publica.

### No computador antigo

Apague o atalho antigo da área de trabalho, para não correr o risco de atualizar
a vaquinha por duas pastas diferentes. O script avisa se isso acontecer, mas é
mais simples evitar.

> **Não copie o atalho de um computador para o outro**: ele guarda o caminho
> exato da pasta antiga e não funcionaria. Sempre gere pelo passo 5.

### Se quiser também mexer no site

Só para registrar doações, os passos acima bastam. Para editar textos, imagens
ou o visual, instale também o Node.js e baixe as dependências:

```powershell
winget install --id OpenJS.NodeJS.LTS -e
npm install
```

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
