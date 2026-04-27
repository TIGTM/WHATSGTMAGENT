import fs from "fs";
import axios from "axios";
import { config } from "./config.js";
import { query, executarSQL, save, remove, execute, rest } from "./sankhya/sankhya-api.js";

const TODAS_FERRAMENTAS = [
  {
    name: 'sankhya_query',
    description: 'Busca registros no Sankhya. Entidades: Parceiro, Produto, ItemNota, Vendedor, Empresa, Cidade. Use quando a diretoria perguntar sobre dados em geral.',
    parameters: {
      type: 'object',
      properties: {
        entidade: { type: 'string', description: 'Nome da entidade (ex: "Produto", "ItemNota")' },
        campos: { type: 'array', items: { type: 'string' }, description: 'Campos desejados (ex: ["CODPROD", "DESCRPROD", "VLRVENDA"])' },
        criteria: { type: 'string', description: "Filtro (ex: 'ATIVO = S')" },
        itensPorPagina: { type: 'number', description: 'Limite de registros (padrão: 50)' }
      },
      required: ['entidade', 'campos']
    }
  },
  {
    name: 'sankhya_save',
    description: 'Insere ou atualiza registros no Sankhya via DatasetSP.save.',
    parameters: {
      type: 'object',
      properties: {
        entidade: { type: 'string', description: 'Nome da entidade (ex: "Parceiro", "Financeiro")' },
        registros: { type: 'array', items: { type: 'object' }, description: 'Lista de registros para inserir/atualizar' }
      },
      required: ['entidade', 'registros']
    }
  },
  {
    name: 'sankhya_delete',
    description: 'Remove registros no Sankhya via DatasetSP.remove.',
    parameters: {
      type: 'object',
      properties: {
        entidade: { type: 'string', description: 'Nome da entidade (ex: "Parceiro")' },
        chaves: { type: 'array', items: { type: 'object' }, description: 'Lista de chaves primárias para remoção' }
      },
      required: ['entidade', 'chaves']
    }
  },
  {
    name: 'sankhya_execute',
    description: 'Executa qualquer serviço genérico do Sankhya (ex: FinanceiroSP.baixarTitulo, CRUDServiceProvider.saveRecord).',
    parameters: {
      type: 'object',
      properties: {
        serviceName: { type: 'string', description: 'Nome completo do serviço Sankhya' },
        outputType: { type: 'string', description: 'Tipo de retorno (json/xml), padrão json' },
        requestBody: { type: 'object', description: 'Corpo do serviço' }
      },
      required: ['serviceName']
    }
  },
  {
    name: 'sankhya_rest',
    description: 'Chama endpoints REST v1 do Sankhya (GET/POST/PUT/DELETE).',
    parameters: {
      type: 'object',
      properties: {
        metodo: { type: 'string', description: 'GET, POST, PUT ou DELETE' },
        endpoint: { type: 'string', description: 'Caminho após /v1/ (ex: financeiros/receitas)' },
        corpo: { type: 'object', description: 'Payload JSON para POST/PUT' },
        params: { type: 'object', description: 'Query params para GET' }
      },
      required: ['metodo', 'endpoint']
    }
  },
  {
    name: 'sankhya_sql',
    description: 'Executa SQL nativo no banco do Sankhya. Use para qualquer relatorio. Tabelas mapeadas: TGFCAB (notas/vendas), TGFITE (itens vendidos), TGFPRO (produtos), TGFPAR (parceiros/clientes), TGFEST (estoque atual com campos ESTOQUE, RESERVADO, CODEMP, CODPROD), TGFFIN (financeiro, contas, parcelas). Limite sempre a busca com TOP N.',
    parameters: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: "Comando SQL. Ex: SELECT TOP 50 NUNOTA, VLRNOTA FROM TGFCAB WHERE DTNEG >= '20260201'" }
      },
      required: ['sql']
    }
  }
];

const OLLAMA_TOOLS = TODAS_FERRAMENTAS.map((tool) => ({
  type: "function",
  function: tool
}));

const WRITE_TOOL_NAMES = new Set([
  'sankhya_save',
  'sankhya_delete',
  'sankhya_execute'
]);

const SQL_VERBOS_BLOQUEADOS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE',
  'MERGE',
  'GRANT',
  'REVOKE'
];

const OLLAMA_MAX_ITERATIONS = 3;

function parseFunctionArgs(rawArgs) {
  if (!rawArgs) return {};
  if (typeof rawArgs === 'string') {
    try {
      return JSON.parse(rawArgs);
    } catch {
      return {};
    }
  }
  return rawArgs;
}

function isWriteOperation(toolName, args) {
  if (WRITE_TOOL_NAMES.has(toolName)) return true;
  if (toolName === 'sankhya_rest') {
    return (String(args?.metodo || 'GET').toUpperCase() !== 'GET');
  }
  return false;
}

function sqlTemComandoBloqueado(sql) {
  const texto = String(sql || '').toUpperCase();
  return SQL_VERBOS_BLOQUEADOS.find((verbo) => texto.includes(verbo));
}

function truncateToolResult(toolResult) {
  const toolResponseStr = JSON.stringify(toolResult);
  if (toolResponseStr.length > 15000) {
    console.warn("[IA] Resultado muito grande! Forçando redução de escopo da consulta.");
    return {
      error: "Muitos dados retornados (limite de payload excedido). Refaça a requisição com TOP N menor ou filtro WHERE mais preciso."
    };
  }
  return toolResult;
}

async function executarFerramentaERP(toolName, argsRaw) {
  const args = parseFunctionArgs(argsRaw);

  if (isWriteOperation(toolName, args) && !config.erpWriteEnabled) {
    return {
      error: `Operação de escrita bloqueada no ambiente atual. Defina ERP_WRITE_ENABLED=true para liberar ${toolName}.`
    };
  }

  if (toolName === 'sankhya_query') {
    const { entidade, campos, criteria, itensPorPagina } = args;
    return query(entidade, campos, criteria || null, 1, itensPorPagina || 50);
  }

  if (toolName === 'sankhya_sql') {
    const verboBloqueado = sqlTemComandoBloqueado(args.sql);
    if (verboBloqueado) {
      return {
        error: `sankhya_sql aceita apenas SELECT. Comando ${verboBloqueado} bloqueado. Use sankhya_execute ou sankhya_rest para comandos de negócio.`
      };
    }
    return executarSQL(args.sql);
  }

  if (toolName === 'sankhya_save') {
    const registros = Array.isArray(args.registros) ? args.registros : [];
    if (!args.entidade || !registros.length) {
      return { error: 'Parâmetros inválidos para sankhya_save. Envie entidade e registros.' };
    }
    return save(args.entidade, registros);
  }

  if (toolName === 'sankhya_delete') {
    const chaves = Array.isArray(args.chaves) ? args.chaves : [];
    if (!args.entidade || !chaves.length) {
      return { error: 'Parâmetros inválidos para sankhya_delete. Envie entidade e chaves.' };
    }
    return remove(args.entidade, chaves);
  }

  if (toolName === 'sankhya_execute') {
    if (!args.serviceName) {
      return { error: 'Parâmetro serviceName é obrigatório para sankhya_execute.' };
    }
    return execute(args.serviceName, args.outputType || 'json', args.requestBody || {});
  }

  if (toolName === 'sankhya_rest') {
    if (!args.metodo || !args.endpoint) {
      return { error: 'Parâmetros método e endpoint são obrigatórios para sankhya_rest.' };
    }
    return rest(String(args.metodo).toUpperCase(), args.endpoint, args.corpo || null, args.params || {});
  }

  return { error: `Ferramenta desconhecida: ${toolName}` };
}

function resolveProvider() {
  if (config.llmProvider === 'gemini') return 'gemini';
  if (config.llmProvider === 'ollama') return 'ollama';
  return config.geminiApiKey ? 'gemini' : 'ollama';
}

async function askWithGemini({ prompt, history = [], useERP = false }) {
  if (!config.geminiApiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  const turns = history.slice(-6).map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const contents = [
    ...turns,
    { role: "user", parts: [{ text: prompt }] }
  ];

  let iteration = 0;

  while (iteration < 6) {
    iteration++;

    const payload = {
      contents,
      generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
      tools: useERP ? [{ functionDeclarations: TODAS_FERRAMENTAS }] : []
    };

    try {
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000
      });

      const parts = response.data?.candidates?.[0]?.content?.parts || [];
      const functionCall = parts.find((p) => p.functionCall)?.functionCall;
      const text = parts.find((p) => p.text)?.text;

      if (functionCall) {
        let toolResult;
        console.log(`[Gemini] IA acionou ferramenta ERP: ${functionCall.name}`);

        try {
          fs.appendFileSync('sql_log.txt', `\n[TOOL CALL] ${functionCall.name}\n${JSON.stringify(functionCall.args, null, 2)}\n`);
          toolResult = await executarFerramentaERP(functionCall.name, functionCall.args);
        } catch (e) {
          toolResult = { error: e.message };
          console.error(`[Gemini] Erro na ferramenta: ${functionCall.name}`, e.message);
        }

        toolResult = truncateToolResult(toolResult);

        contents.push({ role: "model", parts: [{ functionCall }] });
        contents.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: functionCall.name,
              response: { result: toolResult }
            }
          }]
        });
      } else if (text) {
        return text.trim();
      } else {
        return null;
      }
    } catch (error) {
      console.error("[Gemini] Falha ao gerar resposta:", error.message);
      if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
      return null;
    }
  }

  return "[Gemini] Limite interno alcançado gerando resposta.";
}

async function askWithOllama({ prompt, history = [], useERP = false }) {
  if (!config.ollamaModel || !config.ollamaBaseUrl) return null;

  const baseUrl = config.ollamaBaseUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/api/chat`;

  const messages = history.slice(-2).map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content: msg.content
  }));

  messages.push({ role: "user", content: prompt });

  let iteration = 0;
  while (iteration < OLLAMA_MAX_ITERATIONS) {
    iteration++;
    try {
      const payload = {
        model: config.ollamaModel,
        messages,
        stream: false,
        options: {
          temperature: 0.3,
          num_ctx: config.ollamaNumCtx,
          num_predict: config.ollamaNumPredict
        },
        tools: useERP ? OLLAMA_TOOLS : undefined
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: config.ollamaTimeoutMs
      });

      const message = response.data?.message || {};
      const toolCalls = message.tool_calls || [];
      const text = (message.content || '').trim();

      if (toolCalls.length) {
        messages.push({
          role: 'assistant',
          content: message.content || '',
          tool_calls: toolCalls
        });

        for (const toolCall of toolCalls) {
          const toolName = toolCall?.function?.name;
          const toolArgs = toolCall?.function?.arguments;
          let toolResult;

          console.log(`[Ollama] IA acionou ferramenta ERP: ${toolName}`);
          try {
            fs.appendFileSync('sql_log.txt', `\n[TOOL CALL] ${toolName}\n${JSON.stringify(parseFunctionArgs(toolArgs), null, 2)}\n`);
            toolResult = await executarFerramentaERP(toolName, toolArgs);
          } catch (e) {
            toolResult = { error: e.message };
            console.error(`[Ollama] Erro na ferramenta: ${toolName}`, e.message);
          }

          toolResult = truncateToolResult(toolResult);

          messages.push({
            role: 'tool',
            name: toolName,
            content: JSON.stringify(toolResult)
          });
        }

        continue;
      }

      if (text) {
        return text;
      }

      return null;
    } catch (error) {
      console.error("[Ollama] Falha ao gerar resposta:", error.message);
      if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
      if (error.code === 'ECONNABORTED' || /timeout/i.test(String(error.message || ''))) {
        return "Estou processando sua solicitação no ERP, mas o modelo local demorou além do limite. Tente novamente em alguns segundos ou simplifique a pergunta.";
      }
      return null;
    }
  }

  return "[Ollama] Limite interno alcançado gerando resposta.";
}

export async function askGemini({ prompt, history = [], useERP = false }) {
  const provider = resolveProvider();

  if (provider === 'gemini') {
    const respostaGemini = await askWithGemini({ prompt, history, useERP });
    if (respostaGemini) return respostaGemini;
    if (config.llmProvider === 'gemini') return null;
  }

  if (provider === 'ollama' || config.llmProvider === 'auto') {
    const respostaOllama = await askWithOllama({ prompt, history, useERP });
    if (respostaOllama) return respostaOllama;
  }

  return null;
}
