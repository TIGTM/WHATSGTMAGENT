/**
 * Cliente HTTP para a API Sankhya
 *
 * Expõe funções de alto nível para as operações mais comuns (query, save, delete)
 * e uma função genérica para qualquer serviço da plataforma.
 */

import axios from 'axios';
import { obterToken } from './auth.js';

const BASE_URL = 'https://api.sankhya.com.br/gateway/v1/mge/service.sbr';

/**
 * Realiza uma chamada genérica ao gateway de serviços Sankhya.
 * Só lança erro se houver tsException real ou falha HTTP.
 */
async function chamarServico(serviceName, outputType = 'json', requestBody = {}) {
  const token = await obterToken();

  const payload = { serviceName, requestBody };

  let resposta;
  try {
    resposta = await axios.post(BASE_URL, payload, {
      params: { serviceName, outputType },
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    const detalhe = err.response?.data?.statusMessage || err.message;
    throw new Error(`Sankhya HTTP Error: ${detalhe}`);
  }

  const dados = resposta.data;

  // Se a API retornou uma exceção explícita, lança erro com a mensagem
  const excecao = dados?.responseBody?.tsException?.message;
  if (excecao) {
    throw new Error(`Sankhya API Error: ${excecao}`);
  }

  // Se status "3" = não autorizado
  if (dados?.status === '3') {
    throw new Error(`Sankhya API Error: ${dados?.statusMessage || 'Não autorizado'}`);
  }

  // Qualquer outra resposta é retornada como está
  return dados;
}

// ──────────────────────────────────────────────
// Funções de alto nível
// ──────────────────────────────────────────────

/**
 * Busca registros de uma entidade (CRUDServiceProvider.loadRecords).
 */
export async function query(entidade, campos, criteria = null, pagina = 1, itensPorPagina = 50) {
  const dataSet = {
    rootEntity: entidade,
    ignoreCalculatedFields: 'true',
    useFileBasedPagination: 'true',
    includePresentationFields: 'N',
    tryJoinedFields: 'true',
    offsetPage: String(pagina - 1),
    entity: [
      {
        path: '',
        fieldset: {
          list: campos.join(', '),
        },
      },
    ],
  };

  if (criteria) {
    dataSet.criteria = {
      expression: { $: criteria },
    };
  }

  const resposta = await chamarServico('CRUDServiceProvider.loadRecords', 'json', { dataSet });

  // Mapeia f0, f1, f2... para os nomes reais dos campos
  const entities = resposta?.responseBody?.entities;
  if (!entities) return resposta;

  const nomesCampos = (entities.metadata?.fields?.field ?? []).map((f) => f.name);
  const listaEntidades = entities.entity
    ? (Array.isArray(entities.entity) ? entities.entity : [entities.entity])
    : [];

  const registros = listaEntidades.map((row) =>
    Object.fromEntries(
      nomesCampos.map((nome, i) => [nome, row[`f${i}`]?.$ ?? null])
    )
  );

  return {
    total: entities.total,
    hasMoreResult: entities.hasMoreResult,
    offsetPage: entities.offsetPage,
    registros,
  };
}

/**
 * Insere ou atualiza registros (DatasetSP.save).
 */
export async function save(entidade, registros) {
  const campos = Object.keys(registros[0]);

  const records = registros.map((reg) => ({
    values: Object.values(reg).reduce((acc, val, idx) => {
      acc[String(idx)] = String(val);
      return acc;
    }, {}),
  }));

  const requestBody = {
    entityName: entidade,
    standAlone: true,
    fields: campos,
    records,
    ignoreListenerMethods: '',
  };

  return chamarServico('DatasetSP.save', 'json', requestBody);
}

/**
 * Deleta registros (DatasetSP.remove).
 */
export async function remove(entidade, chaves) {
  const campos = Object.keys(chaves[0]);

  const records = chaves.map((chave) => ({
    values: Object.values(chave).reduce((acc, val, idx) => {
      acc[String(idx)] = String(val);
      return acc;
    }, {}),
  }));

  const requestBody = {
    entityName: entidade,
    standAlone: true,
    fields: campos,
    records,
  };

  return chamarServico('DatasetSP.remove', 'json', requestBody);
}

/**
 * Executa qualquer serviço genérico da API Sankhya.
 */
export async function execute(serviceName, outputType = 'json', requestBody = {}) {
  return chamarServico(serviceName, outputType, requestBody);
}
