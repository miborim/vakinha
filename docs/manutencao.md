# Manutenção do site (uso pessoal)

Anotações da Mirella para operar o site: registrar doações, criar o atalho e
configurar o projeto em um computador novo.

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

### Se aparecer um erro de rede

Erros de TLS/conexão (`TLS connect error`, `unable to access`) são instabilidade
momentânea, não perda de dados. O script tenta de novo sozinho e, quando o envio
já tinha dado certo, segue em frente em vez de abandonar no meio.

Se mesmo assim a atualização não for ao ar, é só **abrir o atalho de novo**: ele
detecta que existe um valor registrado fora do ar, mostra os dois valores e
pergunta se você quer publicar — sem lançar a doação duas vezes.

Se o erro se repetir sempre, vale testar uma vez:

```powershell
git config --global http.sslBackend schannel
```

Isso faz o Git usar o sistema de segurança do próprio Windows, o que costuma
resolver conflitos com antivírus e redes corporativas.

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

Esse login é o que permite ao script publicar as doações — sem ele, o envio
para o GitHub é recusado.

### 3. Dizer ao Git quem é você

Sem isso, o commit falha na hora de registrar a doação:

```powershell
git config --global user.name "Mirella Borim"
git config --global user.email "miborim@users.noreply.github.com"
```

### 4. Baixar o projeto

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

### Fontes

As fontes são **auto-hospedadas**: não há nenhuma conexão com
`fonts.googleapis.com` ou `fonts.gstatic.com`. Isso deixa o carregamento mais
rápido (duas conexões externas a menos) e evita expor o IP de quem visita a
página a terceiros.

Os arquivos ficam em `src/assets/fonts/` e as declarações `@font-face` em
`src/fontes.css`, que é importado por `src/index.css`. **Nada disso é editado à
mão**: rode o script se precisar trocar peso, estilo ou família.

```bash
node scripts/baixar-fontes.mjs
```

Ele baixa os `.woff2` do Google, gera o `src/fontes.css` e copia as três fontes
usadas pela página de erro para `public/fonts/`. A `public/404.html` precisa de
cópia própria porque não passa pelo Vite: é publicada do jeito que está, então
não enxerga os arquivos com hash de `src/assets/`. Ao final o script imprime os
`@font-face` a colar no `<style>` dela, caso a lista mude.

São baixados só os subconjuntos `latin` e `latin-ext`. O `latin` (U+0000–00FF)
já cobre todo o acentuado do português e do francês; o `latin-ext` entra como
garantia e só é baixado se a página precisar. Na prática o navegador busca
apenas os pesos que a página usa — hoje 6 dos 20 arquivos.

## Deploy

Push na `main` dispara `.github/workflows/deploy.yml`, que roda o build e publica
no GitHub Pages. A `main` é protegida: as alterações entram por Pull Request a
partir da `develop`.

---

## Próximos passos

Melhorias mapeadas na auditoria técnica que ainda não foram feitas:

- [ ] **Submeter o sitemap no Google Search Console.** Passo a passo na seção
      abaixo. Só você pode fazer: exige login na conta Google.

### Submeter o sitemap no Search Console

O site já publica `robots.txt` e `sitemap.xml` sozinho — falta só avisar o
Google. Isso acelera a indexação e mostra por quais buscas as pessoas chegam
até a página.

1. Acesse <https://search.google.com/search-console> e entre com sua conta
   Google.
2. Em **Adicionar propriedade**, escolha o tipo **Prefixo do URL** (não
   "Domínio" — esse exige mexer no DNS, e o site está em `github.io`, que não
   é seu).
3. Informe exatamente, com a barra no final:

   ```
   https://miborim.github.io/vakinha/
   ```

4. Na verificação de propriedade, escolha **Tag HTML**. O Google mostra uma
   linha parecida com:

   ```html
   <meta name="google-site-verification" content="ALGUMCODIGO" />
   ```

   Copie essa linha, cole dentro do `<head>` do `index.html` (na raiz do
   repositório, logo abaixo das outras `<meta>`), publique com o fluxo normal
   (`develop` → PR → merge) e espere o deploy terminar. Só então clique em
   **Verificar**.

   > Os outros métodos (arquivo HTML, DNS, Google Analytics) também funcionam,
   > mas a tag é a mais simples aqui porque o `index.html` já é versionado.

5. Com a propriedade verificada, abra **Sitemaps** no menu da esquerda, digite
   `sitemap.xml` no campo e clique em **Enviar**.
6. Em **Inspeção de URL**, cole `https://miborim.github.io/vakinha/` e peça
   **Solicitar indexação**. Isso costuma adiantar bastante a primeira visita do
   robô.

A indexação não é imediata: pode levar de alguns dias a duas semanas. Depois
disso, o relatório **Desempenho** mostra as buscas que trouxeram visitantes.

> Não precisa repetir nada disso a cada atualização de valor. O `sitemap.xml`
> é fixo, e o Google revisita a página sozinho.
