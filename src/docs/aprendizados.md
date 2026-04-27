# Aprendizados Automáticos

Descobertas registradas automaticamente durante o uso do assistente.


## Entidade Parceiro indisponível via sankhya_query (mge-dwf)
**Categoria:** entidade | **Data:** 2026-03-16 | **Tags:** Parceiro, sankhya_query, mge-dwf, erro

A consulta para a entidade 'Parceiro' usando sankhya_query (mge-dwf) resultou em 'Não foi encontrado objeto de acesso a dados para este BMP: mge-dwf:null', apesar de estar listada como disponível na documentação. Isso indica que a entidade não é acessível por essa camada.

---

## Entidade Produto indisponível via sankhya_query (mge-dwf)
**Categoria:** entidade | **Data:** 2026-03-16 | **Tags:** Produto, sankhya_query, mge-dwf, erro

A consulta para a entidade 'Produto' usando sankhya_query (mge-dwf) resultou em 'Não foi encontrado objeto de acesso a dados para este BMP: mge-dwf:null'. Isso indica que a entidade não é acessível por essa camada, contrariando a documentação anterior.

---

## Filtro de Vendas por CODTIPOPER (TGFCAB)
**Categoria:** regra_negocio | **Data:** 2026-03-16 | **Tags:** vendas, CODTIPOPER, TGFCAB, filtro

Para identificar operações de venda, utilize o campo CODTIPOPER da tabela TGFCAB com os valores (1103, 1105, 1109). Este filtro substitui o uso de CODCFO para vendas.

---

## Vendas Detalhadas de Itens por CODTIPOPER e Período
**Categoria:** consulta | **Data:** 2026-03-16 | **Tags:** vendas, detalhes, itemnota, tgfcab, tgfite, codtipoper, periodo, sql


SELECT TOP 500 c.NUNOTA, c.DTNEG, c.CODPARC, c.CODTIPOPER, i.CODPROD, p.DESCRPROD, i.QTDNEG, i.VLRUNIT, i.VLRTOT, i.SEQUENCIA
FROM TGFCAB c
JOIN TGFITE i ON c.NUNOTA = i.NUNOTA
JOIN TGFPRO p ON i.CODPROD = p.CODPROD
WHERE c.CODEMP = 2
  AND c.DTNEG >= '{DATA_INICIO}' AND c.DTNEG < '{DATA_FIM}'
  AND i.CODCFO IN (5101, 5102, 5124)
  AND c.CODTIPOPER IN ({CODTIPOPER_LIST})
  AND i.SEQUENCIA > 0
  AND i.CODPROD IN (356,368,370,372,374,381,387,390,391,393,510,517,519,524,532,539,547,550,582,586,612,647,648,650,654,655,657,661,664,671)
ORDER BY c.NUNOTA, i.SEQUENCIA ASC


---

## AD_DTCOP em TGFFIN - bloqueio de escrita via API e SQL de update
**Categoria:** campo | **Data:** 2026-03-20 | **Tags:** TGFFIN, AD_DTCOP, TGFCAB, DTMOV, financeiro, update, API, bloqueio

## Objetivo
Atualizar o campo AD_DTCOP na TGFFIN com o valor de DTMOV da TGFCAB, para títulos com DTVENC em determinada data e AD_DTCOP nulo.

## SQL de Update (validado via preview - 57 registros para DTVENC 20260319)
```sql
UPDATE FIN
SET FIN.AD_DTCOP = CAB.DTMOV
FROM TGFFIN FIN
INNER JOIN TGFCAB CAB ON FIN.NUNOTA = CAB.NUNOTA
WHERE FIN.DTVENC = '20260319'
AND (FIN.AD_DTCOP IS NULL OR FIN.AD_DTCOP = '')
```

## SQL de Preview (verificar antes de executar)
```sql
SELECT FIN.NUFIN, FIN.NUNOTA, FIN.CODEMP, FIN.DTVENC,
       FIN.AD_DTCOP AS AD_DTCOP_ATUAL, CAB.DTMOV AS NOVO_AD_DTCOP
FROM TGFFIN FIN
INNER JOIN TGFCAB CAB ON FIN.NUNOTA = CAB.NUNOTA
WHERE FIN.DTVENC = '20260319'
AND (FIN.AD_DTCOP IS NULL OR FIN.AD_DTCOP = '')
ORDER BY FIN.NUFIN
```

## Template reutilizável (qualquer data)
```sql
-- Consulta títulos com AD_DTCOP vazio por DTVENC
SELECT NUFIN, NUNOTA, CODEMP, CODPARC, DTNEG, DTVENC, VLRDESDOB, RECDESP, AD_DTCOP
FROM TGFFIN
WHERE DTVENC BETWEEN 'YYYYMMDD' AND 'YYYYMMDD'
AND (AD_DTCOP IS NULL OR AD_DTCOP = '')
ORDER BY NUFIN
```

## Diagnóstico: campo NÃO atualizável via API Sankhya
Todas as abordagens via API foram testadas e bloqueadas:
- sankhya_sql: só permite SELECT
- DatasetSP.save (entidade Financeiro): sempre tenta INSERT, entidade sem BMP para update
- CRUDServiceProvider.saveRecord: retorna sucesso mas não persiste AD_DTCOP
- DbExplorerSP.executeQuery: bloqueia DML explicitamente
- REST PUT /v1/financeiros/receitas/{nufin}: não persiste campos AD_
- ScriptSP / MGEFinanceiroSP / DatasetSP.update: serviços não existem

## Conclusão
AD_DTCOP na TGFFIN não está exposto para escrita via API. Update deve ser executado:
1. Diretamente no banco via SSMS/DBeaver na base GTM_PROD
2. Ou via Script Sankhya configurado dentro do sistema

## Contexto técnico
- Banco: SQL Server / GTM_PROD / schema SANKHYA
- Formato de data para DML: YYYYMMDD (ex: 20260319)
- AD_DTCOP tipo: datetime
- Lógica de negócio: preencher AD_DTCOP com DTMOV do TGFCAB (join por NUNOTA)

---

## Estrutura da Tabela TPRIPROC (Cabeçalho da Instância do Processo)
**Categoria:** entidade | **Data:** 2026-03-20 | **Tags:** producao, ordem_producao, TPRIPROC, cabecalho

A tabela TPRIPROC é a principal para as Ordens de Produção (OPs), representando o cabeçalho da instância do processo. Campos importantes incluem:
- NROLOTE (Nro. Lote): varchar(20), permite nulo, default '0'
- IDIPROC (Nro. OP): PK, int(10)
- IDICOP (Nro. OP Conjunta): int(10)
- STATUSPROC (Status): varchar(2)
- CODPARC (Parceiro): int(10)
- CODPLP (Planta de manufatura): int(10)
- NUMPS (Nro. MPS): int(10)
- DTPREVENT (Previsão de Entrega): datetime(23)
- TEMPOATRAVESS (Tempo de Atravessamento (min)): float(53)
- DTINICIOMAX (Dh. Inicialização (máx)): datetime(23)

---

## Estrutura da Tabela TPRIPA (Produto Acabado a Produzir)
**Categoria:** entidade | **Data:** 2026-03-20 | **Tags:** producao, ordem_producao, TPRIPA, produto_acabado, lote

A tabela TPRIPA contém os campos da seção de produto acabado da aba Geral nas Ordens de Produção. É vinculada à TPRIPROC por IDIPROC. Campos importantes incluem:
- NROLOTE (Nro. Lote): varchar(20), obrigatório
- CODPRODPA (Produto Acabado): int(10)
- CONTROLEPA (Controle): varchar(11)
- QTDPRODUZIR (Tam. Lote): float(53)
- CONCLUIDO (Concluído): varchar(1)
- DTVAL (Data de Validade): datetime(23)
- DTFAB (Data de Fabricação): datetime(23)

---

## Campos de Lote no Processo de Produção
**Categoria:** regra_negocio | **Data:** 2026-03-20 | **Tags:** producao, lote, NROLOTE, QTDPRODUZIR, TPRIPROC, TPRIPA, campos

Resumo dos campos de lote nas Ordens de Produção:
- Cabeçalho (campo Nro. Lote): NROLOTE na tabela TPRIPROC. É o número do lote do processo/OP.
- Aba Geral -> seção Produto Acabado (Nro. Lote): NROLOTE na tabela TPRIPA. É o número do lote do produto acabado a produzir.
- Aba Geral -> Tam. Lote: QTDPRODUZIR na tabela TPRIPA. Representa o tamanho/quantidade do lote a produzir.
- Filtro lateral -> Nro. Lote: NROLOTE na tabela TPRIPROC. Usado para busca pelo número do lote.

---

## CRUDServiceProvider.saveRecord — único método que funciona para UPDATE de campos customizados (AD_) no TGFFIN
**Categoria:** processo | **Data:** 2026-03-20 | **Tags:** CRUDServiceProvider, saveRecord, TGFFIN, AD_DTCOP, update, campo customizado, Financeiro, API, XML, DatasetSP, DbExplorerSP, produção

## Problema
Atualizar campos customizados (AD_) em TGFFIN via API do Sankhya Om 4.35b442 na produção (gtm.nuvemdatacom.com.br:9745).

## O que NÃO funciona
- **DbExplorerSP.executeQuery com UPDATE/INSERT/DELETE**: Retorna "Expected EOF at line 1 column 17" — o parser rejeita DML completamente nessa versão
- **DbExplorerSP.executeQuery via cloud gateway (api.sankhya.com.br)**: Retorna "JsonObject" silenciosamente — não executa DML
- **DatasetSP.save com entidade "Financeiro" + apenas NUFIN+AD_DTCOP**: Erro "A data de vencimento deve ser informada" — UPDATE detectado mas validação de negócio exige DTVENC
- **DatasetSP.save com NUFIN+DTVENC+AD_DTCOP**: Muda para INSERT e falha com NULL em CODEMP
- **CRUDServiceProvider.saveRecord com atributos XML** (ex: `<NUFIN value="123290"/>`): Erro "Elemento de um EntityPrimaryKey não pode ser null"
- **Regras de Negócio**: Só aceita contextos "Portais" e "Venda Assistida" — não serve para automação geral

## O que FUNCIONA
**CRUDServiceProvider.saveRecord com text content nos elementos XML** (NÃO atributos):

```xml
POST /mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=xml&mgeSession={SESSION}
Content-Type: text/xml

<serviceRequest serviceName="CRUDServiceProvider.saveRecord">
  <requestBody>
    <dataSet rootEntity="Financeiro" includePresentationFields="S" parallelFields="false">
      <entity path="">
        <fieldset list="NUFIN,AD_DTCOP"/>
      </entity>
      <dataRow>
        <localFields>
          <NUFIN>123290</NUFIN>
          <AD_DTCOP>18/01/2026 00:00:00</AD_DTCOP>
        </localFields>
        <key>
          <NUFIN>123290</NUFIN>
        </key>
      </dataRow>
    </dataSet>
  </requestBody>
</serviceRequest>
```

Resposta de sucesso: `status="1"` com `<entity><NUFIN>...</NUFIN><AD_DTCOP>...</AD_DTCOP></entity>`

## Regras críticas do formato XML
1. Valores devem ser **text content** (`<NUFIN>123290</NUFIN>`), NUNCA atributos (`<NUFIN value="123290"/>`)
2. rootEntity = "Financeiro" (não "TGFFIN")
3. Deve ter bloco `<key>` com a PK (NUFIN)
4. Data no formato brasileiro: `DD/MM/YYYY 00:00:00`
5. outputType=xml (json retorna "Expected EOF")
6. Funciona via XHR síncrono dentro do browser autenticado OU via MCP sankhya_execute

## Como executar via MCP (sankhya_execute)
Usar a ferramenta sankhya_execute com serviceName="CRUDServiceProvider.saveRecord" e o XML acima no requestBody.

## Caso de uso original
Atualizar AD_DTCOP (Dt. Competência Gerencial) em TGFFIN com o DTMOV da TGFCAB correspondente, para financeiros com vencimento em data específica onde o campo estava nulo.

Query para buscar os dados: 
```sql
SELECT FIN.NUFIN, CONVERT(VARCHAR(10), CAB.DTMOV, 103) AS DTMOV_FMT 
FROM TGFFIN FIN 
INNER JOIN TGFCAB CAB ON FIN.NUNOTA = CAB.NUNOTA 
WHERE FIN.DTVENC = '{YYYYMMDD}' AND FIN.AD_DTCOP IS NULL
```


---
