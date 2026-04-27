# Memória Aprendida — Assistente GTM Alimentos

> Fatos descobertos e validados durante o uso do assistente.
> Este arquivo é carregado no system prompt e tem prioridade sobre o context.md em caso de conflito.
> Reinicie o servidor após alterações: `npm run chat:gemini:dev`

---

## Arquitetura de Acesso ao Sankhya — 3 Camadas (OAuth 2.0)

### Ferramentas disponíveis

| Camada | Ferramenta | Quando usar |
|--------|------------|-------------|
| **1 — Gateway (mge-dwf)** | `sankhya_query` | Entidades: Parceiro, ItemNota, Produto, GrupoProduto, Vendedor, Empresa |
| **2 — REST v1** | `sankhya_rest` | GET/POST /financeiros/receitas, /despesas, /pedidos, /produtos, /clientes |
| **3 — SQL Direto** | `sankhya_sql` | TGFCAB, TGFITE e qualquer tabela com filtro por DTNEG (data real) |

### Entidades acessíveis confirmadas

| Entidade | Método | Status |
|----------|--------|--------|
| `Parceiro` | sankhya_query (mge-dwf) | ✅ funciona |
| `Produto` | sankhya_query (mge-dwf) | ✅ funciona |
| `ItemNota` | sankhya_query (mge-dwf) | ✅ funciona |
| `GrupoProduto` | sankhya_query (mge-dwf) | ✅ funciona |
| `Vendedor` | sankhya_query (mge-dwf) | ✅ funciona |
| `Empresa` | sankhya_query (mge-dwf) | ✅ funciona |
| `TGFCAB` (CabecNota) | sankhya_sql (DbExplorerSP) | ✅ funciona — usar SQL direto |
| `TGFITE` (ItemNota) | sankhya_sql (DbExplorerSP) | ✅ funciona via SQL |

### ✅ TGFCAB acessível via sankhya_sql (DbExplorerSP.executeQuery)

CabecNota/TGFCAB é acessível via SQL direto com a ferramenta `sankhya_sql`.
- **BANCO:** SQL Server (NÃO Oracle)
- **Formato de data no WHERE:** YYYYMMDD sem separador — ex: `'20260201'`
- **Formato de retorno do DTNEG:** `DDMMYYYY HH:MM:SS` — ex: `"15022026 00:00:00"` = 15/02/2026
- **NUNCA usar:** formato ISO com traço (`'2026-02-01'`), ROWNUM, TO_DATE()

**Exemplo — notas de fevereiro 2026:**
```sql
SELECT TOP 500 NUNOTA, DTNEG, CODEMP, CODTIPOPER, CODPARC, VLRNOTA
FROM TGFCAB
WHERE CODEMP = 2 AND DTNEG >= '{AAAAMMDD_INICIAL}' AND DTNEG <= '{AAAAMMDD_FINAL}'
```

**Campos principais do TGFCAB:** NUNOTA, DTNEG, CODEMP, CODTIPOPER, CODPARC, VLRNOTA, NUMNOTA, STATUSNOTA

---

## ItemNota — campos disponíveis (Camada 1 — sankhya_query)

- **Entidade:** `ItemNota`
- **Campos válidos:** `NUNOTA`, `CODEMP`, `CODPROD`, `QTDNEG`, `CODVOL`, `VLRUNIT`, `VLRTOT`, `CODCFO`, `SEQUENCIA`
- **Campos INVÁLIDOS nessa entidade:** `DTNEG`, `CODTIPOPER`, `NUMNOTA`, `DESCRPROD`, `NOMEPARC`, `CODPARC`
- **Importante:** `SEQUENCIA = -1` são estornos/reversões. Sempre filtre `SEQUENCIA > 0` para dados reais.

---

## CODCFO como discriminador de tipo de movimento (CODEMP=2)

Validado cruzando BD_Vendas do Relatório de Qualidade com API:

| CODCFO | Significado |
|--------|-------------|
| `5101` | Saída de produto industrializado do estado → **VENDA** |
| `5102` | Venda de Mercadoria → **VENDA** (usado para RESÍDUO) |
| `5124` | Produto industrializado para terceiro → **VENDA TERCEIROS** |
| `1201` | Devolução de venda → **DEVOLUÇÃO** |
| `0`    | Movimentos internos (produção, apontamentos) |
| `2101`, `1101`, `1102` | Compras/entradas |

---

---

## Relatório de Qualidade — Template Completo

### O que é
Relatório mensal gerado pelo departamento de qualidade da GTM Alimentos com 3 seções:
1. **VENDAS** — total de KG vendidos por família de produto (com e sem gerencial)
2. **DEVOLUÇÕES** — KG devolvidos no período
3. **PRODUÇÃO** — dados de movimentos internos (CODCFO=0)

### Como gerar — via SQL direto (PREFERENCIAL)

Usar `sankhya_sql` com JOIN direto apenas se for analisar detalhadamente KG por produto. 

> ⚠️ **MUITO IMPORTANTE:** Se o usuário pedir "vendas", "resumo de vendas", "faturamento", "soma", "total de vendas em dinheiro", "vlrnota" ou perguntar por uma TOP específica sem pedir detalhes de KG por produto: **O SEU CEREBRO ESTÁ ESTRITAMENTE OBRIGADO A NÃO FAZER JOIN COM TGFITE!** E NÃO USE FILTRO DE CODPROD OU CODEMP=2! Rode APENAS UM SQL SIMPLES e puramente financeiro na TGFCAB. Exemplo INQUEBRÁVEL para dados financeiros:
```sql
SELECT SUM(VLRNOTA) AS Faturamento_Total, COUNT(NUNOTA) AS Qtd_Notas 
FROM TGFCAB 
WHERE DTNEG >= '{DATA_INICIO}' AND DTNEG < '{DATA_FIM}' 
AND CODTIPOPER IN ({A_TOP_PEDIDA})
```

**ATENÇÃO ABSOLUTA**: O Roteiro abaixo (Passos 1 a 4) é **ESCLUSIVO** para as raras vezes que ele pedir: "Relatório de Qualidade", "Ranking de Produtos em KG" ou "Detalhes de produtos específicos (356,368...)". NUNCA USE OS PASSOS ABAIXO SE ELE PEDIR "VENDAS DA TOP X" EM DINHEIRO!

**Passo 1 — VENDAS POR KG (Apenas para relatório de Qualidade/Auditoria):**
```sql
SELECT TOP 100 i.CODPROD, SUM(i.QTDNEG) AS KG
FROM TGFCAB c
JOIN TGFITE i ON i.NUNOTA = c.NUNOTA
WHERE c.CODEMP = 2
  AND c.DTNEG >= '{DATA_EXATA_PEDIDA}' AND c.DTNEG < '{DATA_EXATA_PEDIDA_MAIS_1_DIA}' /* GEMINI: Use SEMPRE INCLUSIVO e EXCLUSIVO. Exemplo pro dia 20: DTNEG >= '20260320' AND DTNEG < '20260321' (para englobar todas as horas do dia 20). NUNCA repita a variavel ou use <=. */
  AND c.CODTIPOPER IN (1103, 1105, 1109) /* GEMINI: Substitua essa lista pelo numero de TOP que o usuario pediu! Se ele nao pedir TOP, use esses 3. */
  AND i.SEQUENCIA > 0
  AND i.CODPROD IN (356,368,370,372,374,381,387,390,391,393,510,517,519,524,532,539,547,550,582,586,612,647,648,650,654,655,657,661,664,671)
GROUP BY i.CODPROD
ORDER BY KG DESC
```

**Passo 2 — DEVOLUÇÕES (SQL direto com JOIN):**
```sql
SELECT i.CODPROD, SUM(i.QTDNEG) AS KG
FROM TGFCAB c
JOIN TGFITE i ON i.NUNOTA = c.NUNOTA
WHERE c.CODEMP = 2
  AND c.DTNEG >= '{DATA_EXATA}' AND c.DTNEG < '{DIA_SEGUINTE}' /* GEMINI: IGUAL ACIMA, EX: >= 20 E < 21 */
  AND i.CODCFO = 1201
  AND i.SEQUENCIA > 0
GROUP BY i.CODPROD
```

**Passo 3 — PRODUÇÃO (SQL direto com JOIN):**
```sql
SELECT i.CODPROD, SUM(i.QTDNEG) AS KG
FROM TGFCAB c
JOIN TGFITE i ON i.NUNOTA = c.NUNOTA
WHERE c.CODEMP = 2
  AND c.DTNEG >= '{DATA_EXATA}' AND c.DTNEG < '{DIA_SEGUINTE}' /* GEMINI: IGUAL ACIMA, EX: >= 20 E < 21 */
  AND i.CODCFO = 0
  AND i.SEQUENCIA > 0
  AND i.CODVOL = 'KG'
  AND i.CODPROD IN (356,368,370,372,374,381,387,390,391,393,510,517,519,524,532,539,547,550,582,586,612,647,648,650,654,655,657,661,664,671)
GROUP BY i.CODPROD
```

**Passo 4 — Agregar e calcular split Gerencial:**
- Agrupar por CODPROD → FAMÍLIA usando a Tabela IND abaixo
- Split Gerencial/Não Gerencial pela coluna `GERENCIAL` da Tabela IND
- ⚠️ CODTIPOPER não disponível — usar Tabela IND como fonte de verdade para o split

---

### Classificação de Produtos (Tabela IND) — 30 produtos

| CODPROD | DESCRIÇÃO (resumida) | FAMÍLIA | GERENCIAL |
|---------|---------------------|---------|-----------|
| 356 | FILE SALMAO CG GRANEL TUDO BOM | SALMÃO | Não |
| 368 | CAMARAO CZ INT COZ 100-120 PCT 200G | CAMARÃO | Sim |
| 370 | CAMARAO CZ SC COZ 71-90 PCT 200G | CAMARÃO | Sim |
| 372 | FILE SALMAO SALAR 1500/2000G GRANEL PESQUALI | SALMÃO | Não |
| 374 | FILE SALMAO COHO 1500/2000G GRANEL PESQUALI | SALMÃO | Não |
| 381 | FILE TILAPIA PCT 800G B FRESCO MG | TILÁPIA | Não |
| 387 | PEDAÇO FILE SALMAO PCT 500G B FRESCO | SALMÃO | Não |
| 390 | PEDAÇO FILE SALMAO VACUO CX VARIAVEL Q PESCADO | SALMÃO | Não |
| 391 | FILE TILAPIA PCT 800G Q PESCADO | TILÁPIA | Não |
| 393 | FILE MERLUZA PCT 500G B FRESCO | MERLUZA | Não |
| 510 | FILE TILAPIA PCT 400G Q PESCADO | TILÁPIA | Não |
| 517 | FILE TILAPIA PCT 400G B FRESCO MG | TILÁPIA | Não |
| 519 | CAMARAO DESC COZ 71-90 PCT 300G | CAMARÃO | Sim |
| 524 | ISCAS TILAPIA PCT 300G Q PESCADO | TILÁPIA | Não |
| 532 | CAMARAO DESC EVISC COZ 36-40 PCT 300G | CAMARÃO | Sim |
| 539 | FILE TILAPIA PCT 400G Q PESCADO | TILÁPIA | Não |
| 547 | FILE TILAPIA GRANEL CX12KG Q PESCADO | TILÁPIA | Não |
| 550 | FILE SALMAO VACUO CX VARIAVEL Q PESCADO | SALMÃO | Não |
| 582 | RESIDUO DE TILAPIA | RESÍDUO | Sim |
| 586 | CAMARAO DESC EVISC 26-30 PCT 400G SELECAO DO CHEF | CAMARÃO | Sim |
| 612 | FILE MERLUZA PCT 500G Q-PESCADO | MERLUZA | Não |
| 647 | FILE TILAPIA GRANEL PREMIUM CX10KG MKT | TILÁPIA | Sim |
| 648 | FILE TILAPIA FRESCO GRANEL CX VARIAVEL | TILÁPIA | Sim |
| 650 | FILE TILAPIA PCT 400G Q PESCADO (MKT) | TILÁPIA | Sim |
| 654 | PEDAÇO FILE SALMAO PCT 430G B FRESCO | SALMÃO | Sim |
| 655 | FILE SALMAO PCT 230G B FRESCO | SALMÃO | Sim |
| 657 | FILE TILAPIA PCT 800G Q PESCADO | TILÁPIA | Não |
| 661 | PEDAÇOS FILE MERLUZA GRANEL CX VARIAVEL | MERLUZA | Não |
| 664 | FILE SALMAO PEDAÇOS PCT 600G Q-PESCADO | SALMÃO | Não |
| 671 | FILE SALMAO GRANEL CX VARIAVEL TUDO BOM | SALMÃO | Não |

---

### REGRAS DE FORMATAÇÃO — OBRIGATÓRIAS

- **NUNCA** mostrar cálculos, somas parciais, raciocínio intermediário ou texto de progresso na resposta final
- **NUNCA** listar dados brutos linha a linha antes de apresentar o resultado
- Apresentar SOMENTE tabelas limpas no formato abaixo
- Se precisar buscar várias páginas, fazer silenciosamente e só mostrar o resultado final consolidado
- **NUNCA** perguntar ao usuário o range de NUNOTA se o mês estiver mapeado acima
- **NUNCA usar valores fixos/memorizados** — sempre buscar dados frescos do Sankhya

### FORMATO EXATO DA RESPOSTA:

```
## 📊 Relatório de Qualidade — (Mês Solicitado)

---

### 🛒 VENDAS

| Família | Vendas Totais (KG) | Sem Gerencial (KG) | Gerencial (KG) |
|---------|-------------------:|-------------------:|---------------:|
| TILÁPIA | xx.xxx,xx | xx.xxx,xx | xx.xxx,xx |
| CAMARÃO | xx.xxx,xx | — | xx.xxx,xx |
| SALMÃO  | xx.xxx,xx | xx.xxx,xx | xx.xxx,xx |
| MERLUZA | x.xxx,xx  | x.xxx,xx  | — |
| RESÍDUO | xx.xxx,xx | — | xx.xxx,xx |
| **Total Geral** | **xxx.xxx,xx** | **xx.xxx,xx** | **xx.xxx,xx** |

> ℹ️ Split Gerencial/Não Gerencial baseado na Tabela IND (classificação interna dos produtos).

---

### 🔄 DEVOLUÇÕES

| Família | Produto | KG Devolvidos |
|---------|---------|-------------:|
| CAMARÃO | [nome produto] | xx,xx |
| **Total Geral** | | **xx,xx** |

*(Se não houver devoluções: "Nenhuma devolução registrada no período.")*

---

### 🏭 PRODUÇÃO

| Produto | Produção Total (KG) | Sem Gerencial (KG) | Gerencial (KG) |
|---------|--------------------:|-------------------:|---------------:|
| **TILÁPIA** | **xx.xxx,xx** | **xx.xxx,xx** | **xx.xxx,xx** |
| **CAMARÃO** | **xx.xxx,xx** | **—** | **xx.xxx,xx** |
| **SALMÃO**  | **xx.xxx,xx** | **xx.xxx,xx** | **—** |
| **MERLUZA** | **x.xxx,xx**  | **x.xxx,xx**  | **—** |
| **Total Geral** | **xxx.xxx,xx** | **xx.xxx,xx** | **xx.xxx,xx** |

> ℹ️ Dados de produção baseados em movimentos internos (CODCFO=0) registrados no período.
```
