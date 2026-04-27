export const products = [
  {
    id: "tilapia-file",
    name: "Filé de Tilápia GTM",
    category: "Pescados",
    description: "Filé limpo, ideal para grelha, forno e airfryer.",
    priceHint: "Consulte nosso catálogo"
  },
  {
    id: "camarao-limpo",
    name: "Camarão Descascado Q'Pescado",
    category: "Frutos do Mar",
    description: "Camarão selecionado para risotos, moquecas e massas.",
    priceHint: "Consulte nosso catálogo"
  },
  {
    id: "salmao-posta",
    name: "Salmão em Postas Premium",
    category: "Premium",
    description: "Corte premium para preparos especiais.",
    priceHint: "Consulte nosso catálogo"
  },
  {
    id: "tiras-peixe-empanado",
    name: "Tiras de Peixe Empanado Q'Pescado",
    category: "Práticos",
    description: "Tiras de peixe empanadas crocantes, perfeitas para petiscos e refeições rápidas.",
    priceHint: "Consulte nosso catálogo"
  },
  {
    id: "truta-bem-fresco",
    name: "Filé de Truta Bem Fresco",
    category: "Pescados Bem Fresco",
    description: "Filé de Truta branca ou rosa com pele, excelente qualidade para forno e grelha.",
    priceHint: "Consulte nosso catálogo"
  }
];

export const recipes = [
  {
    id: "tilapia-airfryer",
    title: "Tilápia na Airfryer com Ervas",
    products: ["tilapia-file"],
    prepTime: "25 min",
    steps: [
      "Tempere os filés com limão, sal, alho e ervas finas.",
      "Preaqueça a airfryer a 200°C por 5 minutos.",
      "Asse por 12 a 15 minutos, virando na metade do tempo.",
      "Finalize com azeite e sirva."
    ]
  },
  {
    id: "tiras-crocantes",
    title: "Tiras de Peixe Crocantes Assadas",
    products: ["tiras-peixe-empanado"],
    prepTime: "20 min",
    steps: [
      "Retire as tiras de peixe Q'Pescado do congelador.",
      "Distribua em uma assadeira ou cesto da airfryer.",
      "Asse a 200°C por cerca de 15 minutos, até dourarem.",
      "Sirva com molho tártaro ou limão."
    ]
  }
];

export const clientFaq = [
  {
    question: "Quais formas de pagamento vocês aceitam?",
    answer: "Trabalhamos com Pix, Cartões de Crédito/Débito e Boleto (sob análise comercial)."
  },
  {
    question: "Vocês fazem entregas?",
    answer: "Sim! Somos uma grande distribuidora atendendo principalmente Minas Gerais (incluindo BH e região metropolitana) e Espírito Santo."
  },
  {
    question: "Quais são as marcas de vocês?",
    answer: "Temos orgulho de ser GTM Alimentos e trabalhamos com as marcas Q'Pescado e Pescados Bem Fresco, focadas em qualidade, sabor e muita praticidade."
  }
];

export const employeeFaq = [
  {
    question: "Onde vejo meu contracheque?",
    answer: "O contracheque pode ser acessado através de nossa Intranet de RH."
  },
  {
    question: "Quem é o contato do RH?",
    answer: "Você pode falar com o RH enviando um e-mail ou abrindo um chamado direto pelo portal do colaborador."
  },
  {
    question: "Como funciona nosso sistema de qualidade?",
    answer: "A GTM Alimentos possui fábricas e logística inteligente com controle rigoroso de qualidade, desde a piscicultura até a entrega."
  }
];

export const companyInstitution = `
**Sobre a GTM Alimentos, Q'Pescado e Pescados Bem Fresco:**
Sede localizada em Belo Horizonte - MG (Av. Amazonas, 2095 - Centro). Atuamos como distribuidora líder em MG e ES com foco na entrega de produtos de qualidade e logística inteligente. Nosso portfólio inclui a incrível marca Q'Pescado e a marca Pescados Bem Fresco, focado em alta qualidade e bem-estar (mais de 1.000 pontos de venda parceiros!).
Missão: Levar saúde e praticidade às famílias através de ótimos alimentos, seja o prato principal ou ingrediente secreto!
Contatos comerciais adicionais: vendas@pescadosbemfresco.com.br
`;
