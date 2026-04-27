# Contexto da Empresa — Assistente Sankhya

> Este arquivo é carregado automaticamente no system prompt do assistente.
> Preencha cada seção com as informações reais da sua empresa.
> Reinicie o chat server após qualquer alteração (`npm run chat`).

---

## 1. Identificação da Empresa

- **Nome:** GTM Alimentos
- **Segmento:** Industria de pescados
- **Porte:** 150 colaboradores, GTM escritorio, MKT insdustria, Estancia psicultura, top service logistica
- **Módulos Sankhya ativos:** Comercial, Financeiro, Estoque, Compras, Fiscal, Produção, WMS

---

## 2. Entidades Disponíveis na Gateway (`mge-dwf`)

> ⚠️ IMPORTANTE: Este assistente acessa o Sankhya via gateway `mge-dwf` (cloud).
> Apenas as entidades abaixo estão disponíveis. Nunca tente entidades fora desta lista.

### ✅ Entidades Confirmadas

| Entidade | O que representa | Campos-chave validados |
|---|---|---|
| `Parceiro` | Clientes, fornecedores, transportadoras | `CODPARC`, `NOMEPARC`, `CGC_CPF`, `TIPPESSOA`, `ATIVO`, `CODCID` |
| `ItemNota` | **Toda movimentação: vendas, devoluções, compras, produção** | `NUNOTA`, `CODPROD`, `QTDNEG`, `VLRUNIT`, `VLRTOT`, `CODCFO`, `SEQUENCIA`, `CODEMP` |
| `Produto` | Cadastro de produtos | `CODPROD`, `DESCRPROD`, `ATIVO` |
| `GrupoProduto` | Grupos e categorias de produtos | `CODGRUPOPROD`, `DESCRGRUPOPROD` |
| `Cidade` | Tabela de cidades | `CODCID`, `NOMECID`, `UF` |
| `Empresa` | Filiais/empresas do grupo | `CODEMP`, `RAZAOSOCIAL` |
| `Vendedor` | Equipe de vendas | `CODVEND`, `APELIDO` |
| `TipoNegociacao` | Condições de pagamento | `CODTIPVENDA`, `DESCRTIPVENDA` |

### ❌ Entidades NÃO disponíveis (retornam erro)

| Entidade bloqueada | Substituto correto |
|---|---|
| `CabecNota`, `CabecalhoNota` | → usar `ItemNota` com filtro `CODCFO` |
| `TituloRecPag` | ❌ Sem acesso financeiro nesta gateway |
| `MovEstoque` | ❌ Sem acesso direto a estoque |
| `TipOperacao` | ❌ Indisponível |
| `Estado` | → usar `Cidade` (campo `UF` disponível) |
| `TipoParceiro` | ❌ Indisponível |
| `Grupo` | → usar `GrupoProduto` |

---

## 3. Campos Importantes

> Documente campos que têm significados específicos na empresa — siglas, códigos, status.

### Parceiros (`Parceiro`)
- `CODPARC`: código único do parceiro
- `NOMEPARC`: nome/razão social
- `CGC_CPF`: CNPJ ou CPF
- `TIPPESSOA`: J = Jurídica, F = Física, E = Estrangeiro
- `CODTIPPARC`: tipo de parceiro (ex: 1=Cliente, 2=Fornecedor, 3=Transportadora)
- `ATIVO`: S = ativo, N = inativo
- _(adicione campos específicos da empresa)_

### Produtos (`Produto`)
- `CODPROD`: código do produto
- `DESCRPROD`: descrição
- `CODVOL`: unidade (ex: UN, KG, CX, MT)
- `ATIVO`: S/N
- _(adicione campos como grupo, marca, NCM, etc.)_

### Movimentações (`ItemNota`) — substitui CabecNota
- `NUNOTA`: número único da nota
- `CODEMP`: empresa/filial
- `CODPROD`: produto
- `QTDNEG`: quantidade
- `VLRUNIT`: valor unitário
- `VLRTOT`: valor total do item
- `SEQUENCIA`: sequência do item (filtrar `SEQUENCIA > 0` para excluir estornos)
- `CODCFO`: **discrimina o tipo de movimento:**
  - `5101`, `5102`, `5124` = **Vendas**
  - `1201` = **Devoluções de venda**
  - `2101`, `1101`, `1102` = **Compras**
  - `0` = **Produção interna**

### Empresa (`Empresa`)
- `CODEMP`: código da filial
- `RAZAOSOCIAL`: nome da empresa ⚠️ (não usar `NOMEEMP` — campo inválido)

### Vendedor (`Vendedor`)
- `CODVEND`: código do vendedor
- `APELIDO`: nome do vendedor ⚠️ (não usar `NOMEVEND` — campo inválido)

---

## 4. Tipos de Movimento via `CODCFO` (campo de `ItemNota`)

> ⚠️ `CabecNota` não está disponível. Use `ItemNota` + `CODCFO` para filtrar movimentos.

| CODCFO | Tipo de Movimento |
|--------|-------------------|
| `5101`, `5102`, `5124` | **Vendas** |
| `1201` | **Devoluções de venda** |
| `2101`, `1101`, `1102` | **Compras** |
| `0` | **Produção interna** |

> Sempre adicionar filtro `SEQUENCIA > 0` para excluir registros de estorno.

---

## 5. Regras de Negócio

> Documente regras que o assistente deve conhecer para responder corretamente.

- _(ex: "Clientes inativos têm ATIVO = 'N'. Sempre filtre por ATIVO = 'S' em consultas de clientes ativos.")_
- _(ex: "O campo CODTIPPARC = 1 identifica clientes. Fornecedores têm CODTIPPARC = 2.")_
- _(ex: "Pedidos confirmados têm STATUS = 'L'. Pedidos em digitação têm STATUS = 'A'.")_
- _(ex: "A empresa trabalha com 3 filiais: CODEMP 1, 2 e 3. Filtrar por CODEMP quando necessário.")_
- _(adicione as regras específicas da empresa)_

---

## 6. Consultas Frequentes

> Ensine ao assistente os padrões de consulta mais usados na empresa.

### Listar clientes ativos
- Entidade: `Parceiro`
- Campos: `CODPARC`, `NOMEPARC`, `CGC_CPF`, `TELEFONE`
- Filtro: `CODTIPPARC = 1 AND ATIVO = 'S'`

### Pedidos do mês atual
- Entidade: `CabecNota`
- Campos: `NUNOTA`, `DTNEG`, `CODPARC`, `VLRNOTA`
- Filtro: `MONTH(DTNEG) = MONTH(GETDATE()) AND TIPMOV = '_(código da venda)_'`

### Títulos em aberto (contas a receber)
- Entidade: `TituloRecPag`
- Campos: `CODTITULO`, `CODPARC`, `DTVENC`, `VLRTITULO`
- Filtro: `RECPAG = 'R' AND DTREC IS NULL`

### Estoque atual por produto
- _(documente a entidade e campos de estoque da empresa)_

---

## 7. Glossário Interno

> Termos e siglas usados internamente que o assistente deve entender.

| Termo interno | Significado no Sankhya |
|--------------|----------------------|
| _(ex: "NF")_ | _(ex: Nota Fiscal — entidade CabecNota)_ |
| _(ex: "fatura")_ | _(ex: Título a receber — TituloRecPag com RECPAG='R')_ |
| _(ex: "pedido")_ | _(ex: CabecNota com TIPMOV do tipo venda)_ |
| _(adicione termos da empresa)_ |  |

---

## 8. Personas dos Usuários

> Quem usa este assistente e o que cada um precisa? Isso ajuda a calibrar as respostas.

- **Vendedores:** consultam clientes, pedidos e estoque disponível
- **Financeiro:** verificam títulos em aberto, recebimentos e inadimplência
- **Compras:** acompanham pedidos de compra e fornecedores
- _(ajuste conforme os usuários reais da empresa)_

---

## 9. Informações Adicionais

> Qualquer outro contexto relevante que o assistente deva saber.

_(ex: "A empresa tem sazonalidade alta no 4º trimestre.")_
_(ex: "O CNPJ principal é 00.000.000/0001-00.")_
_(ex: "Os representantes comerciais são cadastrados como parceiros com CODTIPPARC = 5.")_
