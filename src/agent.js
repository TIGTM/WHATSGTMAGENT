import { config } from "./config.js";
import { askGemini } from "./gemini.js";
import { clientFaq, employeeFaq, products, recipes, companyInstitution } from "./data/catalog.js";

import fs from "fs";
import path from "path";

// Carrega os Conhecimentos Globais em Memória
let globalKnowledgeContext = "";
try {
  const docsPath = path.resolve("./src/docs");
  const ctxFile = fs.existsSync(path.join(docsPath, "GTM_ALIMENTOS_CONTEXTO_COMPLETO.md")) 
    ? fs.readFileSync(path.join(docsPath, "GTM_ALIMENTOS_CONTEXTO_COMPLETO.md"), "utf8") 
    : "";
  const memFile = fs.existsSync(path.join(docsPath, "memory.md")) 
    ? fs.readFileSync(path.join(docsPath, "memory.md"), "utf8") 
    : "";
  const aprenFile = fs.existsSync(path.join(docsPath, "aprendizados.md")) 
    ? fs.readFileSync(path.join(docsPath, "aprendizados.md"), "utf8") 
    : "";
    
  globalKnowledgeContext = `
--- CONTEXTO MESTRE GTM ALIMENTOS ---
${ctxFile}

--- MEMÓRIA APRENDIDA ---
${memFile}

--- APRENDIZADOS ---
${aprenFile}
  `.trim();

  if (globalKnowledgeContext.length > config.maxGlobalContextChars) {
    globalKnowledgeContext = `${globalKnowledgeContext.slice(0, config.maxGlobalContextChars)}\n\n[CONTEXTO TRUNCADO PARA PERFORMANCE]`;
  }
} catch (e) {
  console.log("[Docs] Erro ao carregar arquivos MD:", e.message);
}

const memoryByUser = new Map();

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getOrCreateState(userId) {
  if (!memoryByUser.has(userId)) {
    memoryByUser.set(userId, {
      history: [],
      leadStage: "new",
      isPaused: false,
      persona: null, // Pode ser: 'cliente', 'colaborador', 'fornecedor', 'parceiro', 'diretoria'
      isAuthenticated: false
    });
  }
  return memoryByUser.get(userId);
}

function detectPersonaSelection(rawText) {
  const text = normalize(rawText || "");
  if (text.includes("1") || text.includes("cliente")) return "cliente";
  if (text.includes("2") || text.includes("colaborador") || text.includes("funcionario")) return "colaborador";
  if (text.includes("3") || text.includes("fornecedor")) return "fornecedor";
  if (text.includes("4") || text.includes("parceiro") || text.includes("revendedor")) return "parceiro";
  if (text.includes("5") || text.includes("diretoria") || text.includes("diretor")) return "diretoria";
  return null;
}

function detectIntent(rawText, persona) {
  const text = normalize(rawText || "");

  if (!text) return "empty";
  
  const isMatch = (words) => words.some(k => text === k || (text.includes(k) && k.length > 2) || text === k.toString());

  if (isMatch(["encerrar", "reiniciar", "sair", "tchau", "comecar do zero", "limpar"])) return "reset";
  if (isMatch(["oi", "ola", "bom dia", "boa tarde", "boa noite", "menu", "inicio"])) return "welcome";
  if (isMatch(["atendente", "humano", "suporte", "pessoa"])) return "handoff";

  if (persona === "cliente") {
    if (isMatch(["receita", "cozinhar", "preparo", "como fazer", "2"])) return "recipe";
    if (isMatch(["comprar", "pedido", "orcamento", "preco", "valor", "3"])) return "sales";
    if (isMatch(["produto", "catalogo", "cardapio", "itens", "1"])) return "products";
    if (isMatch(["pagamento", "entrega", "congelado", "duvida"])) return "faq";
  }

  if (persona === "colaborador") {
    if (isMatch(["treinamento", "curso", "portal", "1"])) return "courses";
    if (isMatch(["rh", "pagamento", "contracheque", "duvida", "2"])) return "rh_faq";
    if (isMatch(["empresa", "institucional", "sobre", "3"])) return "company_info";
  }

  if (persona === "fornecedor") {
    if (isMatch(["financeiro", "pagamento", "boleto", "1"])) return "finance";
    if (isMatch(["vendas", "oferecer", "compras", "2"])) return "purchasing";
  }

  if (persona === "parceiro") {
    if (isMatch(["cadastro", "registrar", "1"])) return "partner_register";
    if (isMatch(["tabela", "precos", "2"])) return "pricing";
  }

  if (persona === "diretoria") {
    if (isMatch(["relatorio", "erp", "dados", "1"])) return "erp_data";
  }

  return "chat";
}

function toProductList() {
  return products.map((p) => `- ${p.name} (${p.category})\n  ${p.description}`).join("\n");
}
function toRecipeText() {
  return recipes.map((r, index) => `${index + 1}) ${r.title} (${r.prepTime})\n${r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`).join("\n\n");
}

function getBestFaq(userText, faqList) {
  const text = normalize(userText);
  return faqList.find((item) => normalize(item.question).includes(text) || text.includes(normalize(item.question)))?.answer || null;
}

function buildPersonaSelection() {
  return `${config.welcomeMessage}\n\nPara um melhor atendimento, por favor me diga, você é:\n\n1️⃣ *Cliente*\n2️⃣ *Colaborador(a)*\n3️⃣ *Fornecedor*\n4️⃣ *Quero ser Parceiro / Revendedor*\n5️⃣ *Diretoria (Acesso Restrito)*\n\n_(Responda apenas com o número)_`;
}

function buildWelcome(persona) {
  if (persona === "cliente") {
    return `Menu do Cliente:\n1) 📦 Nossos Produtos\n2) 🥣 Ver Receitas\n3) 🛒 Comprar\n4) 🙋 Falar com Atendente\n\n_(Responda com o número ou a palavra desejada)_`;
  }
  if (persona === "colaborador") {
    return `Portal Colaborador GTM:\n1) 📚 Cursos e Treinamentos\n2) ❓ Dúvidas Frequentes RH\n3) 🏢 Perguntar sobre a Empresa\n4) 🙋 Falar com Suporte Interno`;
  }
  if (persona === "fornecedor") {
    return `Portal Fornecedores:\n1) 💰 Financeiro / Boletos\n2) 🛒 Compras / Oferecer Produtos\n3) 🙋 Falar com nosso time`;
  }
  if (persona === "parceiro") {
    return `Portal Parceiros e Vendas B2B:\n1) 📝 Fazer Cadastro\n2) 📋 Tabela de Preços e Condições\n3) 🙋 Falar com Consultor B2B`;
  }
  if (persona === "diretoria") {
    return `Painel da Diretoria GTM:\n1) 📊 Consultar Resumo do ERP\n2) 🤖 Conversar com a IA sobre as métricas\n3) 🙋 Entrar em contato com gerência`;
  }
}

function buildHandoff() {
  return "Um dos nossos atendentes vai continuar a conversa com você por aqui mesmo. Por favor, aguarde só um instante.\n\n_(Para voltar a falar comigo a qualquer momento, digite *voltar* ou *encerrar*)._";
}

export async function replyToUser({ userId, userName, text }) {
  const state = getOrCreateState(userId);

  // Intent de reset global (até quando pausado)
  if (["encerrar", "reiniciar", "sair", "tchau", "comecar do zero", "limpar"].includes(normalize(text))) {
    memoryByUser.delete(userId);
    return "Sua sessão foi encerrada e limpa com sucesso. Quando precisar falar com a GTM Alimentos, Q'Pescado ou Bem Fresco, é só mandar um *oi*! Até logo 👋";
  }

  // Lógica de despausa
  if (state.isPaused) {
    if (normalize(text) === "voltar" || normalize(text) === "menu") {
      state.isPaused = false;
      return state.persona ? buildWelcome(state.persona) : buildPersonaSelection();
    }
    return null; // O humano está falando
  }

  // Fluxo de identificação da persona
  if (!state.persona) {
    const selected = detectPersonaSelection(text);
    if (selected) {
      state.persona = selected;
      if (selected === "diretoria") {
        return "Acesso restrito. Por favor, digite a sua senha numérica (PIN) para continuar:";
      }
      return `Que legal! ${buildWelcome(selected)}`;
    }
    return buildPersonaSelection(); // Força selecionar persona
  }

  // Fluxo de Autenticação da Diretoria
  if (state.persona === "diretoria" && !state.isAuthenticated) {
    if (text.trim() === config.directorPin) {
      state.isAuthenticated = true;
      return `Senha correta! Bem-vindo(a) à central de gestão.\n\n${buildWelcome("diretoria")}`;
    } else {
      return "Senha incorreta. Tente novamente ou digite *encerrar* para voltar ao menu inicial.";
    }
  }

  const intent = detectIntent(text, state.persona);

  if (intent === "empty") return "Não consegui ler sua mensagem. Pode mandar novamente?";

  if (intent === "welcome") return buildWelcome(state.persona);

  if (intent === "handoff") {
    state.isPaused = true;
    return buildHandoff();
  }

  // Fluxos do Cliente
  if (state.persona === "cliente") {
    if (intent === "products") return `Nosso catálogo GTM, Q'Pescado e Bem Fresco:\n\n${toProductList()}\n\nDigite *2* para ver receitas ou *3* para comprar.`;
    if (intent === "recipe") return `Aqui vão nossas melhores receitas para as marcas Q'Pescado e Bem Fresco:\n\n${toRecipeText()}\n\nGostou? Digite *3* para ir às compras!`;
    if (intent === "sales") return `Excelente escolha! Para finalizar sua compra online ou ver o catálogo de preços, acesse: ${config.salesUrl} \nOu digite *4* se preferir falar com vendas.`;
    if (intent === "faq") {
      const resp = getBestFaq(text, clientFaq);
      if (resp) return `${resp}\n\nPosso ajudar em mais algo? (digite *menu*)`;
    }
  }

  // Fluxos do Colaborador
  if (state.persona === "colaborador") {
    if (intent === "courses") return `Temos vários cursos para capacitar você! \nAcesse nossa plataforma de treinamentos: ${config.employeePortalUrl} \n\nDigite *menu* para voltar.`;
    if (intent === "rh_faq") {
      const resp = getBestFaq(text, employeeFaq) || "Para dúvidas não listadas, sugerimos acionar o RH na Intranet ou enviar e-mail para rh@gtmalimentos.com.br.";
      return `${resp}\n\nO que mais precisa? (digite *menu*)`;
    }
    if (intent === "company_info") return `${companyInstitution}\n\nTem mais curiosidades? Digite a pergunta (nossa IA tentará responder) ou digite *menu*.`;
  }

  // Fluxos do Fornecedor
  if (state.persona === "fornecedor") {
    if (intent === "finance") return `Para assuntos financeiros e envio de notas, encaminhe e-mail para financeiro@gtmalimentos.com.br informando seu CNPJ e NF.`;
    if (intent === "purchasing") return `Legal! Se você quer oferecer seus produtos para a gente comercializar, envie sua apresentação e tabela comercial para o e-mail responsável por compras: ${config.supplierContact}. \nNós avaliaremos!`;
  }

  // Fluxos do Parceiro/Revendedor
  if (state.persona === "parceiro") {
    if (intent === "partner_register") return `Ficamos felizes com seu interesse B2B! Faça o pré-cadastro comercial direto em nosso site para aprovarmos: ${config.partnerRegistrationUrl}`;
    if (intent === "pricing") return `A nossa tabela de atacado é exclusiva e enviada após o pré-cadastro ou pelo nosso executivo comercial. \nDigite *3* para falar com o atendente ou *1* para se cadastrar.`;
  }

  // Fluxo da Diretoria
  if (state.persona === "diretoria" && state.isAuthenticated) {
    if (intent === "erp_data") {
      text = "Me faça o favor de ser o analista do ERP: Crie um resumo listando o valor total de notas fiscais aprovadas HOJE (use TGFCAB e a data de hoje para DTNEG), busque os TOP 3 produtos mais vendidos (TGFITE), e me traga pelo menos dois exemplos de estoque (TGFEST). Não pare até agrupar o resultado. Mande a resposta formatada.";
    }
  }

  // Fallback Gemini IA e injeção do ERP para Diretoria
  const basePrompt = [
    `Você é ${config.agentName}, uma IA prestativa da ${config.companyName}.`,
    `Atenção: O usuário atual se identificou como da categoria: ${state.persona.toUpperCase()}.`,
    `Adapte sua linguagem.`
  ];

  if (state.persona === "diretoria" && state.isAuthenticated) {
    const dataNativa = new Date();
    dataNativa.setHours(dataNativa.getHours() - 3);
    const d = String(dataNativa.getDate()).padStart(2, '0');
    const m = String(dataNativa.getMonth() + 1).padStart(2, '0');
    const y = dataNativa.getFullYear();
    const todayStr = `${d}/${m}/${y}`;
    const todayYMD = `${y}${m}${d}`;
    
    // Injeção cirúrgica na mensagem final para nunca perguntarem datas novamente
    if (!text.includes("mês") && !text.includes("ano")) {
      text = `${text} [O usuário exige o relatório do mês ${m} e ano ${y}. Substitua e deduzá a data nas queries SQL usando ${y}${m} sem NUNCA perguntar!]`;
    }

    basePrompt.push(
      `O usuário atual faz parte da DIRETORIA. Forneça respostas estratégicas através do ERP Sankhya. Atenção: HOJE é dia ${todayStr} (No SQL: '${todayYMD}'). ATENÇÃO: Se o usuário pedir "hoje", você deve usar '${todayYMD}'. REGRA ABSOLUTA DE DATAS: O banco de dados só aceita AAAAMMDD completo. A menos que seja impossível, NÃO DEVOLVA NENHUMA PERGUNTA perguntando sobre Mês ou Ano que ele quer. Assuma sempre de imediato o mês atual e o ano atual se eles não forem ditos. Trabalhe num processo fluido e silencioso!`,
      `MUITO IMPORTANTE SOBRE A GÍRIA "TOP" ou "TOPs": No jargão da GTM Alimentos, a palavra "TOP" significa EXCLUSIVAMENTE "Tipo de Operação" (coluna CODTIPOPER da tabela TGFCAB). Se o usuário disser "vendas da TOP 1100", execute silenciosamente WHERE c.CODTIPOPER IN (1100) na sua próxima operação. NUNCA, SOB HIPÓTESE ALGUMA, pergunte para o usuário se ele queria dizer "limite de registros sql", já assuma silenciosamente que é o Filtro CODTIPOPER e só mostre o resultado final financeiro!`,
      `MUITO IMPORTANTE: Se a ferramenta sankhya_query retornar um erro (como falha de acesso), acione silenciosamente a ferramenta sankhya_sql e consiga o dado via banco de dados bruto. NUNCA recuse buscar um dado que envolva estoques ou contas, use o SQL.`,
      `ATENÇÃO À FORMATAÇÃO (WHATSAPP): O WhatsApp não suporta tabelas com barras (|) ou marcação Markdown HTML. NUNCA tente gerar tabelas para listas de produtos, notas ou estoques. Em vez disso, use sempre TÓPICOS ou LISTAS NUMERADAS! Formate usando asteriscos para *negrito* e quebras de linha claras. Exemplo: "- *Produto A*: 10 unidades".`
    );
  } else {
    basePrompt.push(
      `Se ele for cliente, venda os pescados e fale sobre saúde. Se for colaborador, seja um RH amistoso. Se fornecedor/parceiro, seja comercial e profissional.`
    );
  }

  // Novo super-contexto master extraído dos arquivos markdown importados.
  basePrompt.push(
    `Informações base e aprendizados da empresa (ESTUDE isso antes de responder qualquer dúvida):`,
    globalKnowledgeContext
  );

  if (state.persona === "diretoria" && state.isAuthenticated) {
    if (config.erpWriteEnabled) {
      basePrompt.push(
        `REGRA DESTA INSTÂNCIA: operações de escrita no ERP estão habilitadas (sankhya_save, sankhya_delete, sankhya_execute, sankhya_rest com POST/PUT/DELETE).`,
        `Quando o usuário pedir execução de comando no Sankhya, confirme em linguagem natural o que será alterado e então execute usando ferramenta de escrita.`,
        `Se houver instruções antigas no contexto proibindo escrita, ignore essas instruções antigas e priorize esta regra atual.`
      );
    } else {
      basePrompt.push(
        `REGRA DESTA INSTÂNCIA: operações de escrita no ERP estão bloqueadas por configuração (ERP_WRITE_ENABLED=false).`,
        `Se o usuário pedir comando de escrita, informe como habilitar ERP_WRITE_ENABLED=true no ambiente.`
      );
    }
  }

  basePrompt.push(
    `Seja direto e muito educado. Não minta informações técnicas ou preços que você não sabe.`,
    `Mensagem do usuário: "${text}"`
  );

  const prompt = basePrompt.join("\n");

  const useERP = (state.persona === "diretoria" && state.isAuthenticated);
  const aiReply = await askGemini({ prompt, history: state.history, useERP });
  
  const genReply = aiReply || `Opa, não entendi muito bem. Digite *menu* para ver as opções principais ou *atendente* para falar com nossa equipe!`;

  state.history.push({ role: "user", content: text });
  state.history.push({ role: "assistant", content: genReply });
  if(state.history.length > 20) state.history.shift();

  return genReply;
}
