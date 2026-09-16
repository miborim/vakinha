// Dados centrais da campanha — edite aqui para atualizar o site
export const campaign = {
  nome: "Mirella Borim Lima", // usado no JSON-LD gerado por scripts/prerender.mjs
  meta: 18000, // R$
  arrecadado: 8856.98, // R$ — atualize conforme as doações chegarem
  atualizadoEm: "16/09/2026, às 11h08", // data da última atualização do valor arrecadado
  pix: "mirellaborimlima@gmail.com", // chave PIX (e-mail) — ajuste se necessário
  contato: {
    email: "mirellaborimlima@gmail.com",
    instagram: "https://instagram.com/bonjourmimie",
    instagramUser: "bonjourmimie",
    linkedin: "https://www.linkedin.com/in/mirellaborim",
    linkedinNome: "Mirella Borim",
  },
};

// Linha do tempo em texto corrido — NÃO é renderizada pelo site.
// A versão exibida fica em src/components/Historia.jsx (array `entradas`),
// em formato visual (logo + data + uma linha). Este texto mais longo é
// mantido como material de apoio para bio, posts e mensagens de divulgação.
// Ao atualizar um marco, atualize nos dois lugares.
export const trajetoria = [
  {
    periodo: "2024 – 2027",
    titulo: "Inteli — Institute of Technology and Leadership",
    texto:
      "Graduação em Sistemas de Informação, Negócios e Liderança, uma das faculdades de tecnologia mais concorridas do país, com bolsa integral.",
  },
  {
    periodo: "2024 – hoje",
    titulo: "Atividades extracurriculares no Inteli",
    texto:
      "Diretora de Marketing na Wave (projeto social que prepara estudantes para o vestibular do Inteli), membro do Grace Hopper Women's Collective (preparação de mulheres para o mercado) e monitora de aulas de inglês.",
  },
  {
    periodo: "2024 – 2025",
    titulo: "Presidente da Inteli Júnior",
    texto:
      "Liderei uma empresa júnior de 45 membros, reestruturei processos internos e alcancei um crescimento de 140% na receita.",
  },
  {
    periodo: "Jul 2024",
    titulo: "Estágio na Morgan Stanley",
    texto:
      "Estágio de verão em cibersegurança: analisei políticas internas e acompanhei o CISO junto ao time global, eliminando redundâncias entre políticas nacionais.",
  },
  {
    periodo: "Jul 2025",
    titulo: "Estágio na Ambev — Zé Delivery",
    texto:
      "Estágio de verão em Digital Insights: treinei um modelo de regressão linear para otimizar aquisição e retenção de clientes. Ferramentas: Databricks, PySpark e SQL.",
  },
  {
    periodo: "Jan – Fev 2026",
    titulo: "Estágio na Elogroup",
    texto:
      "Consultoria de negócios: apoiei a construção de um roadmap estratégico de IA para uma grande fintech brasileira, mapeando mais de 3.000 startups e 206 aplicações de IA.",
  },
  {
    periodo: "Mar – Set 2026",
    titulo: "Estágio na Microsoft",
    texto:
      "Customer Success no segmento Major Growth: conecto necessidades de negócio a soluções digitais e acompanho métricas de adoção junto a times técnicos e comerciais.",
  },
  {
    periodo: "Out – Dez 2026",
    titulo: "Aprovada em Paris 🇫🇷",
    texto:
      'Aprovada na ECE Paris para o intercâmbio em "AI for Business Transformation". O próximo passo de uma jornada construída com estudo e apoio.',
  },
];
