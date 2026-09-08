import { campaign } from "./campaign";
import { formatBRL } from "../utils/format";

// Perguntas frequentes da campanha.
//
// Esta é a fonte única de verdade: o mesmo conteúdo alimenta a seção visível
// do site (componente Doar) e o JSON-LD do tipo FAQPage injetado no HTML
// durante o build (ver scripts/prerender.mjs). Assim o que a pessoa lê e o
// que o Google/IA leem nunca ficam fora de sincronia.
export const perguntasFrequentes = [
  {
    pergunta: "Como faço para doar?",
    resposta: `A doação é por PIX, na chave ${campaign.pix}. Não tem valor mínimo: você escolhe quanto quer contribuir e qualquer quantia ajuda. Se preferir outra forma de apoio, é só me chamar por e-mail ou no Instagram.`,
  },
  {
    pergunta: "Para onde vai o dinheiro arrecadado?",
    resposta:
      "Para os gastos pessoais dos três meses de intercâmbio em Paris: moradia, alimentação, transporte, chip de celular e seguro saúde. A faculdade cobre os custos dos estudos, e as passagens eu já paguei. Nada é usado para lazer ou viagens pessoais.",
  },
  {
    pergunta: "Qual é a meta da campanha?",
    resposta: `A meta é de ${formatBRL(campaign.meta)}. Esse valor vem do orçamento que montei para os três meses em Paris, somado ao que ainda preciso complementar do que já tenho guardado e a uma reserva de emergência.`,
  },
  {
    pergunta: "Como acompanho o valor já arrecadado?",
    resposta:
      "Pela barra de progresso aqui mesmo na página. Eu atualizo os valores manualmente, e a data e o horário da última atualização ficam logo abaixo da barra.",
  },
  {
    pergunta: "Por que não usar uma plataforma de vaquinha?",
    resposta:
      "Porque as plataformas cobram taxas altas sobre cada doação. Fazer este site próprio foi a minha alternativa para que o valor doado chegue inteiro, sem intermediários.",
  },
  {
    pergunta: "Não posso doar agora. Tem outro jeito de ajudar?",
    resposta: `Tem, e ajuda muito: compartilhe o link desta página com outras pessoas e acompanhe a campanha no Instagram ${campaign.contato.instagramUser}. Alcance também é apoio.`,
  },
];
