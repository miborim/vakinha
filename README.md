# Mirella na França 🇫🇷

Site da campanha que criei para me ajudar a viver meu intercâmbio em Paris.

**👉 [miborim.github.io/vakinha](https://miborim.github.io/vakinha/)**

---

## Sobre o intercâmbio

Conhecer a França sempre foi um sonho, e é um privilégio que a minha primeira
oportunidade de viajar para fora seja por meio dos estudos. Vou passar um
semestre tendo aulas de **"Artificial Intelligence for Business Transformation"**
na [ECE Paris](https://www.ece.fr/en/) — École d'ingénieurs.

A faculdade cobre os custos dos estudos, mas os gastos pessoais ficam por minha
conta: moradia, alimentação, transporte, chip de celular e seguro saúde. As
passagens eu já paguei. É aí que entra esta campanha.

No orçamento eu não incluí gastos com lazer ou viagens pessoais, só o necessário
para os estudos mesmo. A partir desses valores, calculei quanto ainda preciso
complementar do que já tenho guardado, além de uma reserva de emergência para os
imprevistos. Está tudo aberto no site, categoria por categoria.

## Por que eu fiz um site em vez de usar uma vaquinha pronta

Essa é a pergunta que mais me fizeram, e a resposta é simples:

> Fazer um site próprio foi a minha alternativa para evitar as taxas (abusivas)
> das plataformas de arrecadação.

As plataformas de arrecadação ficam com uma parte do que as pessoas doam. Como
cada real aqui faz diferença, preferi receber as doações direto por **PIX**, em
uma conta usada só para a campanha, e atualizar os valores manualmente no site.

Isso também me deu espaço para explicar a história inteira do meu jeito: de onde
eu venho, como cheguei até aqui e exatamente para onde vai cada valor — em vez de
caber num formulário padrão.

E, sendo sincera: eu estudo tecnologia. Fazia todo sentido que o meu pedido de
ajuda fosse também algo que eu construísse com as minhas próprias mãos.

## O que tem no site

- **Minha história** — a trajetória que me trouxe até aqui, do Inteli aos
  estágios, até a aprovação em Paris
- **Sobre o intercâmbio** — o orçamento aberto, categoria por categoria, com os
  valores em euro e em real
- **Galeria** — fotos da faculdade, dos estágios, da família e dos amigos
- **Formas de ajudar** — a chave PIX e outras maneiras de apoiar, incluindo
  simplesmente compartilhar
- **Perguntas frequentes** — para quem quer entender melhor antes de doar

---

## Como o site foi feito

Um site estático em **React 19 + Vite**, publicado no **GitHub Pages**.

O visual é inteiramente autoral, inspirado em scrapbook e em cartas de viagem:
papéis rasgados, fitas adesivas, polaroids e stickers, montados à mão sobre
texturas de papel. As fotos e ilustrações originais ficam em `assets-originais/`
e são otimizadas para WebP antes de ir para o ar.

Alguns detalhes que fiz questão de cuidar:

- **Pré-renderização (SSG).** Um app React normalmente entrega uma página vazia
  para quem não executa JavaScript — e é justamente esse o caso do Google, dos
  bots de IA e do gerador de preview de link do WhatsApp e do Instagram. Um
  script roda depois do build e injeta o HTML já pronto, então o conteúdo aparece
  para todo mundo. O React continua assumindo a página no navegador, e toda a
  interatividade segue igual.
- **Acessibilidade.** Contraste, navegação por teclado, textos alternativos e
  estrutura semântica. O site tira **100 em acessibilidade, boas práticas e
  SEO** no Lighthouse.
- **Uma fonte única de verdade.** Meta, valor arrecadado, PIX e contatos ficam
  todos em `src/data/campaign.js`.
- **Nenhum rastreador de terceiros.** O site não tem analytics, e as fontes são
  servidas do próprio domínio em vez de virem do Google — ou seja, visitar a
  página não entrega o seu IP para ninguém além do GitHub Pages.
- **Publicação automática.** Todo commit na `main` dispara o build e o deploy
  pelo GitHub Actions.

### Rodando localmente

```bash
npm install
npm run dev
```

### Estrutura

```
src/
  components/      seções da página (Hero, História, Sobre, Galeria, Doar…)
  data/            campaign.js (dados da campanha) e faq.js
  assets/          imagens otimizadas usadas no site
scripts/           build, pré-renderização e otimização de imagens
assets-originais/  arquivos originais das imagens
```

---

## Obrigada 💛

Se você chegou até aqui, obrigada de verdade. Compartilhar o site também é uma
forma enorme de ajudar.

**Mirella Borim**
[Instagram](https://instagram.com/bonjourmimie) ·
[LinkedIn](https://www.linkedin.com/in/mirellaborim) ·
mirellaborimlima@gmail.com
