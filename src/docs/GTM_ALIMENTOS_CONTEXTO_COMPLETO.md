# GTM Alimentos — Contexto Completo: WMS, Produção e Integrações Sankhya Om

> **Documento de referência consolidado do projeto.**
> Fonte: processo-producao-wms.md, wms.md, producao.md, compras.md, configuracoes.md, api.md, sankhya_crud_update_instrucoes.md, PROCESSO DE PRODUÇÃO - Resumo.md, PROCESSO DE EXPEDIÇÃO - Resumo.md, Processo de Expedição - Arquivo Impresso.md, POPs MKT (Pedido de Compra, Pedido de Venda, Operações de Produção, Entrada/Conferência/Armazenagem, Faturamento, Inventário, Coletor), conversas gravadas (Brenda processo fiscal, Thiago fábrica, Natália rastreabilidade), manual.md.
> Última consolidação: 21/03/2026

---

## 1. Contexto da Empresa

| Item | Valor |
|---|---|
| **Empresa operadora** | MKT (processa e armazena para GTM Alimentos) |
| **Nome no Sankhya** | Empresa 2 — MKT BENEFICIADORA E IMPORTADORA |
| **Cliente principal** | GTM Alimentos |
| **Segmento** | Indústria de beneficiamento/processamento de pescados (piscicultura) |
| **ERP** | Sankhya Om |
| **URL Produção** | `http://gtm.nuvemdatacom.com.br:9745/mge/` |
| **URL Teste/Homologação** | `http://gtm.nuvemdatacom.com.br:9746/mge/` |
| **Módulos em uso** | Compras, Vendas, WMS, Produção/W, Fiscal |
| **Coletor WMS** | MC 3100 + SuperWaba (URL: gtm.nuvemdatacom.com.br, porta: 9745) |
| **Responsável técnico POPs** | Matheus Felipe (Logística/PCP), Giovanne Rodrigues (PCP/Produção) |

> ⚠️ **Sempre preferir base de teste** para diagnósticos. Nunca alterar base de produção sem solicitação explícita.

---

## 2. Visão Geral do Fluxo Completo

```
Piscicultura / Fornecedor terceiro
     ↓  NF emitida na origem
Programação semanal (WhatsApp — quinta a sexta para semana seguinte)
     ↓  Tales abre pedidos de compra
Portal de Compras → Pedido de Compra (com previsão de entrega + volume estimado)
     ↓  Chegada da carga → ajuste de quantidade real
Brenda envia para WMS (Recebimento) + informa Doca
     ↓  Davidson confere no coletor WMS (conferência a cegas)
Brenda finaliza entrada da nota
     ↓  Gera saldo de Matéria-Prima no estoque comercial (Local 101)
Isabela preenche planilha de lote MKT (rastreabilidade)
     ↓  Criação das OPs por produto acabado (Tales, com lote MKT)
Tales faz movimentação acessória: Local 101 → 102 (MP para produção)
     ↓  Davidson executa tarefa WMS de separação/expedição interna
Produção física: filetagem → congelamento → glaceamento → embalagem
     ↓  Tales aponta produto acabado na OP (horários: 09h / 11h / 14h30 / 16h)
Sistema baixa MP do Local 102 → produto gerado no Local 104 (Processado)
     ↓  Tales faz movimentação acessória: Local 104 → 103
     ↓  Davidson confere e conclui no WMS
Produto disponível no Local 103 (Produto Acabado) → apto para faturamento
     ↓  Mapa de Produção gerado (Sankhya + Excel)
     ↓  Brenda faz separação WMS (Davidson executa)
Faturamento: Retorno de Industrialização + Pedido de Venda GTM
     ↓
Expedição → Transporte → Cliente (GTM)
```

---

## 3. Personas e Responsabilidades

| Pessoa | Papel | Atividades Principais |
|---|---|---|
| **Tales** | PCP / Operações (Apontador) | Abre pedidos de compra, cria e inicia OPs, faz movimentações acessórias (101→102, 104→103), aponta produção, gera solicitações de faturamento, libera movimentações para WMS |
| **Brenda** | Faturamento / Financeiro | Finaliza entradas de nota via Portal de Importação XML, envia para WMS, faz faturamento, gera notas de retorno de industrialização e armazenagem |
| **Davidson (Deison)** | WMS / Conferente / Logística | Confere recebimento no coletor WMS, executa tarefas de separação, movimentação e expedição |
| **Júlio** | Produção (espelho/gerente) | Solicita quais produtos serão produzidos e com qual lote MKT |
| **Isabela (Natália)** | Qualidade | Alimenta planilha de controle de recebimento / lote MKT, realiza conferência qualitativa durante descarga e carregamento |
| **Giovanni** | Gestor/TI | Responsável pelo Processo 7 (fiscal), comunicações sobre novos processos produtivos |
| **Bruno** | Liberador de pedidos | Libera pedidos de venda/compra (código 31 no sistema); define horário diário para as liberações |
| **Matheus Felipe** | Coordenador de Logística/PCP | Responsável técnico pelos POPs de Logística; conduz inventários e treinamentos |
| **Giovanne Rodrigues** | Analista de PCP/Produção | Responsável técnico pelos POPs de Produção e Vendas |
| **Responsável programação** | Planejamento | Faz a programação semanal de compras (quinta a sexta) |

---

## 4. Programação e Pedidos de Compra

### Fluxo
1. Responsável monta programação semanal com volumes estimados (ex: 3.500 kg / 175 caixas × 20 kg)
2. Envia no grupo de WhatsApp
3. **Tales** abre **todos os pedidos de compra** com volume estimado e previsão de entrega
4. Pedidos ficam visíveis no Portal de Compras filtrados por data
5. Na chegada da carga: responsável **ajusta a quantidade** para a real da NF (ex: 3.500 → 3.515 kg)

### Pré-requisitos
- Cadastro da matéria-prima de acordo com especificações (PCP)
- Ativação do cadastro fiscal (Fiscal GTM)
- Pedido de compra colocado e aprovado (Gerência MKT / Diretoria GTM)

---

## 5. Recebimento — Entrada de Nota Fiscal

### Fluxo Operacional

```
Motorista chega → entrega NF ao Faturamento
     ↓
Brenda valida e libera para conferência WMS
     ↓  (Portal de Compras → Outras Opções → Enviar para WMS Recebimento → informa Data + Doca)
Davidson recebe tarefa no coletor → confere a cegas (sem ver quantidades da NF)
     ↓
Divergência?  Sim → Informar Brenda → recontagem → se persistir, acionar PCP
              Não → Conclui recebimento no WMS
     ↓
Brenda finaliza a entrada da nota (só é possível APÓS Davidson concluir no WMS)
     ↓
Saldo de MP gerado no Local 101 (Matéria-Prima) no estoque comercial
     ↓
Liberação do veículo
```

> ⚠️ **Dependência crítica:** Brenda NÃO consegue finalizar a nota sem Davidson concluir o recebimento no WMS.
> ⚠️ **Erro com movimentação WMS vinculada:** o sistema não permite alterações após movimentações WMS — resolver qualquer divergência ANTES de prosseguir.

### Exceção: Salmão Imperial "eventual"
- Conferência com a nota (não a cegas)
- Faturamento entrega cópia da nota ao conferente
- Variação de até 10% aceita; acima disso acionar PCP

---

## 6. Controle de Recebimento — Lote MKT (Rastreabilidade)

### O que é
Planilha no **Google Planilhas** — principal fonte de rastreabilidade da MP até o produto acabado.

### Estrutura do lote MKT
- Formato: `NNN.AA` (ex: `077.26` = lote 77 do ano 2026)
- Sequencial anual — reinicia a cada ano
- Válido para remessas de industrialização e compras diretas

### Quem alimenta
- **Isabela (qualidade):** preenche os dados de cada lote no momento do recebimento
- **Brenda:** comunica quais notas chegaram no dia

### Por que importa
- O número do lote MKT é o elo de rastreabilidade MP → produto acabado
- Cada OP criada usa esse lote
- Permite calcular rendimento: ex: lote 077.26 entrou 3.512 kg → rendimento ~31% → gerou ~1.000 kg PA
- Antes: planilha com dois anos juntos (difícil de navegar) → Isabela criou planilha separada por ano em 2026

### Melhoria potencial
Migrar controle de lote MKT para dentro do Sankhya, mantendo rastreabilidade sem dependência de Google Planilhas.

---

## 7. Locais de Estoque (Mapa)

| Local | Descrição | Quando o saldo entra |
|---|---|---|
| **101** | Matéria-Prima | Após Brenda finalizar entrada da nota (Davidson concluiu WMS) |
| **102** | Produto em Processo | Após Tales fazer movimentação acessória 101→102 E Davidson concluir tarefa WMS |
| **103** | Produto Acabado | Após Tales fazer movimentação acessória 104→103 E Davidson concluir tarefa WMS |
| **104** | Produto Processado | Gerado automaticamente pelo apontamento da OP (etapa intermediária, aguarda conferência Davidson) |

### Fluxo de locais

```
101 (MP)
  → [movimentação acessória Tales + confirmação nota + tarefa WMS Davidson]
102 (Em Processo)
  → [apontamento Tales na OP]
104 (Processado — aguarda Davidson)
  → [movimentação acessória Tales + confirmação nota + tarefa WMS Davidson]
103 (Acabado — disponível para faturamento)
```

---

## 8. Criação das Ordens de Produção (OP)

### Telas utilizadas no Sankhya
1. **Composição do Produto** — define insumos (BOM) e rendimento esperado
2. **Ordem de Produção Nova** (`TPRIPROC` / `TPRIPA`) — geração da OP
3. **Produção** — tela de apontamento (segunda etapa, após iniciar a OP)

### Processos produtivos cadastrados

| Processo | Descrição |
|---|---|
| Processo 1 | Produção padrão |
| Processo 3 | Produção padrão (variação) |
| Processo 7 | Processo fiscal (Giovanni) — OP fictícia, produto não passa fisicamente pela linha |

### Como criar uma OP
1. Júlio informa produto e lote MKT
2. Tales acessa **Ordem de Produção Nova** → seleciona Planta de Manufatura → informa Produto Acabado + quantidade estimada → clica **"Incluir OP"**
3. OP deve ser **iniciada** para aparecer na tela de Produção (apontamento)
4. **Regra:** uma OP por produto acabado por lote (mesmo lote → múltiplas OPs, uma por produto)

### Pré-requisito operacional
- Matéria-prima armazenada no estoque (Local 101)
- OP emitida e iniciada pelo PCP / Gerente

### Estrutura de banco de dados das OPs

#### `TPRIPROC` — Cabeçalho da Instância do Processo

| Campo tela | Campo BD | Tipo |
|---|---|---|
| Nro. OP | `IDIPROC` (PK) | int 10 |
| **Nro. Lote** | **`NROLOTE`** | varchar 20 (permite nulo, default `'0'`) |
| Status | `STATUSPROC` | varchar 2 |
| Parceiro | `CODPARC` | int 10 |
| Planta de manufatura | `CODPLP` | int 10 |
| Previsão de Entrega | `DTPREVENT` | datetime 23 |

#### `TPRIPA` — Produto Acabado (subtabela por `IDIPROC`)

| Campo tela | Campo BD | Tipo |
|---|---|---|
| Produto Acabado | `CODPRODPA` | int 10 |
| **Nro. Lote** | **`NROLOTE`** | varchar 20 (**obrigatório**, Nulo = Não) |
| **Tam. Lote** | `QTDPRODUZIR` | float 53 |
| Concluído | `CONCLUIDO` | varchar 1 |
| Data de Validade | `DTVAL` | datetime 23 |
| Data de Fabricação | `DTFAB` | datetime 23 |

> ⚠️ `NROLOTE` em `TPRIPA` é obrigatório; em `TPRIPROC` permite nulo (default `'0'`).

---

## 9. Movimentação de Matéria-Prima para Produção

### Etapa 1: MP → Produto em Processo (101 → 102)

**Quem:** Tales

**Como:**
1. Na OP → **Movimentações Acessórias** → "Nova Movimentação — Requisição de Materiais"
2. Seleciona MP (ex: produto 341), quantidade, local origem 101 → destino 102
3. Gera número único de movimentação
4. Acessa **Portal de Movimentações** → confirma a nota
5. Nota confirmada → gera **tarefa de expedição no WMS** para Davidson
6. Davidson conclui a tarefa no coletor → saldo muda de 101 para 102 no comercial

> ⚠️ A movimentação no comercial (101→102) só ocorre APÓS Davidson concluir no WMS.

**Horários de movimentação:** 09:00 / 11:00 / 14:30 / 16:00
- Mover apenas paletes fechados (exceto o último da produção)

### Etapa 2: Produto Processado → Produto Acabado (104 → 103)

**Quem:** Tales (após apontamento de produto acabado)

**Como:**
1. Tales aponta os kg produzidos na OP
2. Sistema baixa MP do Local 102 e gera produto no Local 104
3. Tales vai em Movimentações Acessórias → move 104 → 103
4. Gera número único → Portal de Movimentações → confirma
5. Gera tarefa WMS para Davidson
6. Davidson confere e conclui → produto disponível no Local 103 para faturamento

---

## 10. Apontamento de Produção

### Quem faz
**Tales** (Apontadora) — nos horários programados: **09:00 / 11:00 / 14:30 / 16:00**

### Como funciona
1. Acessa tela **Produção** (segunda etapa da OP, após iniciar)
2. Aba **Separação de MP**: aponta 1 kg simbolicamente para abrir a próxima etapa
3. Etapa de **Produção**:
   - Aponta quantidade produzida (ex: 504 kg)
   - Informa quantidade de caixas (ex: 42 caixas)
   - Sistema baixa MP do Local 102 e gera produto no Local 104
   - Etiquetas geradas: 1 por caixa (Tales confere se bate)
4. Após apontamento: Tales faz movimentação acessória 104 → 103 e libera para WMS
5. Conferente/Davidson recebe mercadoria via WMS e faz armazenagem

### Etiquetagem
- Produto GTM e Cód. 372 Imperial: etiquetar **caixa a caixa**
- Produtos de outros parceiros (exceto GTM e Cód. 372 Imperial): etiquetar **palete a palete**
- Em caso de dúvida: validar com PCP ou Gerente de Produção

> ⚠️ **Crítico:** o processo no sistema deve ocorrer no mesmo momento que o físico. O apontamento não pode atrasar — a partir da confirmação no WMS a operação não pode ser desfeita.

---

## 11. Mapa de Produção e Solicitação de Faturamento

### O que é o Mapa de Produção
Documento (hoje em Excel) que resume os apontamentos da OP e calcula valores para faturamento. Gerado pelo relatório **"Mapa de Produção Sintético"** no Sankhya, complementado no Excel.

### Quando é gerado
- Ideal: ao final do lote (OP completa)
- Na prática: gerado **parcialmente** (proporcional) quando há necessidade de faturar antes do fim do lote

### Como fazer um mapa parcial (proporcional)
1. Verificar na tela de **Etiqueta de Produção** (mais rápida) ou **Custo de Produção** (mais completa) o total apontado na OP
2. Identificar quantidade disponível no Local 103
3. Calcular proporcional dos insumos:
   - Fórmula: `(insumo_total ÷ kg_total_produzido) × kg_a_faturar`
   - Exemplo: 0,6765 do insumo 162 para 6.924 kg, vai faturar 240 kg → `0,6765 ÷ 6.924 × 240 = 0,0234`
4. Calcular rendimento esperado (MP necessária):
   - Fórmula: `kg_a_faturar ÷ rendimento_percentual`
   - Exemplo: 240 kg ÷ 1,16 ≈ 207 kg de MP

### Processo completo de solicitação de faturamento
1. Preencher mapa de produção (quantidades + valores)
2. Gerar **pedido de retorno de industrialização** com quantidade de MP
3. Gerar **pedido de venda** com valor unitário calculado
4. Enviar e-mail para Brenda com: valor unitário de faturamento, quantidade a faturar, referência ao mapa
5. Brenda digita pedido de retorno e envia para WMS (**horário: 12h às 14h**)
6. Davidson executa separação no WMS (**liberação até 16h30**)
7. Brenda fatura o pedido de retorno (**até 17h**)
8. GTM emite nota de venda
9. Brenda imprime notas → carregamento do veículo

---

## 12. Tipos de Faturamento

### Tipo 1: Retorno de Industrialização (produção própria neste ciclo)
- Produto produzido internamente neste ciclo
- Mapa de produção gerado a partir da OP
- Pedido de retorno de industrialização → nota fiscal de retorno
- Pedido de venda → fatura para o cliente (GTM)

### Tipo 2: Retorno de Armazenagem (produto já faturado anteriormente)
- Produto já produzido e faturado (mapa já feito)
- Armazenado na MKT como **"Terceiros em Poder Próprio"** (parceiro: GTM)
- Processo:
  1. Criar **pedido de retorno de armazenagem**
  2. Informar remessa de armazenagem original (consultar Portal de Compras → filtrar "Entrada de Remessa para Armazenagem")
  3. Informar quantidades e valor da remessa original
  4. Separação WMS → faturar retorno
- Se houver duas notas de remessa com valores diferentes: colocar ambas no pedido de retorno

### Tipo 3: Produção para outros clientes (MKT)
- Digitação do pedido de venda/industrialização pelo PCP
- Aprovação (Gerência MKT / Diretoria GTM)
- Agendamento logístico (PCP)
- Envio separação ao WMS (PCP)
- Separação → Conferência → Carregamento → Faturamento → Liberação veículo

---

## 13. Produção Própria vs. Produção de Terceiros (Industrialização)

### Produção Própria
- MP **consumida dentro da OP** no momento do apontamento
- Baixa do Local 102 acontece no apontamento
- Gera produto acabado diretamente

### Produção de Terceiros (Industrialização)
- MP **não é consumida dentro da OP**
- MP é baixada na **nota de retorno de industrialização** (fora da OP)
- Dentro da OP: gerado pedido para Brenda fazer o faturamento
- Necessário manter saldo de MP para gerar a nota de retorno
- Controle manual pelo responsável para garantir que toda MP da remessa foi consumida

---

## 14. WMS — Conceitos e Configuração

### Visão Geral
O WMS opera em paralelo com o estoque comercial (ERP). Os dois saldos são **independentes** e precisam estar sincronizados.

### Conceitos fundamentais

| Conceito | Descrição |
|---|---|
| **Endereço** | Posição física no armazém (prateleira, corredor, nível) |
| **Picking** | Endereço de retirada para separação |
| **Bulk / Reserva** | Endereço de armazenagem em maior quantidade |
| **Doca** | Ponto de entrada/saída físico |
| **Reabastecimento** | Movimento de Bulk → Picking quando picking fica abaixo do mínimo |
| **Checkout** | Endereço de conferência de volumes antes da expedição |
| **OC (Ordem de Carga)** | Agrupamento de pedidos para separação/expedição conjunta |
| **FEFO** | First Expire First Out — critério por validade (requer controle de lote + validade) |

### Configuração de produtos para WMS (Cadastro de Produtos — aba WMS)
- `Controlado pelo WMS?`: obrigatório para o produto ser gerenciado pelo WMS
  - Uma vez marcado, só pode desmarcar se NÃO houver estoque no WMS
- `Usa controle adicional no WMS?`: para lote/validade no WMS (WMS **não suporta** Série)
  - Para Lote + Validade: ativar parâmetro `LOTEDTVAL`
  - Para FEFO: informar `Shelflife` na aba WMS do produto
- Código de barras de unidades alternativas: deve ser informado manualmente (não importado automaticamente)

### Parâmetros críticos do WMS

| Parâmetro | Descrição |
|---|---|
| `INTEGRAWMSPROD` | Integração WMS × Produção (processo específico por cliente — avaliar antes de ativar) |
| `ENDECKTINDEF` | Endereço de checkout indefinido |
| `UNALTPAWMS` | Unidade alternativa de palete no WMS |
| `APRCOMPLPROD` | Apresenta complemento do produto no coletor (limpar cache após alterar) |
| `TOPDEVOLUCAOWMS` | TOP para devolução automática por divergência no WMS |
| `SERIEDEVWMS` | Série da nota gerada no processo de conferência com divergência |
| `CONFENTRMANWMS` | Permite confirmar NF antes de enviar para WMS (entrada manual) |
| `SUBESTDOCAWMS` | Desconta do estoque disponível mercadorias ainda na doca |
| `REABCORRECAOWMS` | Gera reabastecimento corretivo quando picking for insuficiente |
| `CORTEAUTLOTEWMS` | Corte automático de lote quando estoque físico for insuficiente |
| `LOTEDTVAL` | Usa data de validade junto com lote |
| `WMSINFOADTAREFA` | Informações adicionais nas tarefas do coletor |
| `VALIDAESTWMS` | Desativado a partir da versão 4.0 |

### Reabastecimento
- **Automático**: quando picking fica abaixo do mínimo → reabastecimento de Bulk → Picking
- **Corretivo** (`REABCORRECAOWMS`): quando separação é gerada e picking não é suficiente → reabastece mesmo extrapolando máximo do picking (requer `ZERARQTDCONF` desligado)

### Divergências ERP × WMS
- Usar utilitário **Verificação de Saldos** do MGEConfig
- Investigar movimentações sem contrapartida no WMS
- Checar TOPs com dupla atualização (comercial + WMS)
- Parâmetro `SUBESTDOCAWMS`: subtrai da consulta de estoque os itens ainda na doca

### Alertas WMS
- ⚠️ Após alterar parâmetros WMS: **sempre limpar cache do servidor**
- ⚠️ TOP configurada para movimentação WMS deve atualizar **somente** estoque WMS (não o comercial)
- ⚠️ Controle por **Série** não é suportado no WMS — usar Lote ou Data de Validade
- ⚠️ Produtos em doca ainda não foram armazenados — cuidado ao considerar no estoque disponível
- ⚠️ Quando existem movimentações vinculadas ao WMS o sistema NÃO permite alterações

---

## 15. Módulo Produção — Configurações e Parâmetros

### Telas principais

| Tela | Função |
|---|---|
| Estrutura de Produção | Define etapas do processo produtivo (Configurações > Cadastros > Gerencial) |
| Fórmula de Composição (BOM) | Define insumos necessários para produzir uma unidade do PA |
| Planejamento de Produção e Compra (PCP) | Gera OP + requisição de compra das MPs |
| Acompanhamento de Produção | Geração efetiva das OPs após chegada dos insumos |
| Ordens de Produção (Nova) | Tela principal de gestão das OPs |

### Campos críticos da Estrutura de Produção
- `Modelo do Pedido MP`: TOP usada para pedir matéria-prima
- `Top Produção`: TOP que representa a movimentação de produção
- `Compartilha Produção`: compartilha OP entre produtos do mesmo grupo
- `Gera Produção`: marcação obrigatória para compartilhamento

### Parâmetros críticos do módulo Produção

| Parâmetro | Descrição |
|---|---|
| `QUERYESTQPLP` | Query customizada para apuração de estoque no PCP |
| `COPITEMCOMPPRO` | Copia fórmula de composição ao duplicar produto (padrão: ativo) |
| `INTEGRAWMSPROD` | Integração Produção × WMS (específico por cliente) |
| `UNALTPAWMS` | Unidade alternativa de palete no WMS para produção |

### Preferências da Empresa — Produção
- `Margem de Segurança para PCP`: % adicionado ao Lead Time no cálculo
- `Meta Padrão para PCP`: meta mensal padrão para geração de planejamentos

### Alertas Produção
- ⚠️ Produtos intermediários **não** são tratados pelo botão "Gerar Produção" no portal de vendas
- ⚠️ Quando produto pertence a grupo de produção, lotes são gerados por grupo + empresa
- ⚠️ Não alterar TOPs de produção sem análise de impacto no estoque e financeiro
- ⚠️ Sempre testar geração de OP em homologação antes de produção

---

## 16. Tipos de Operação — TOP (Transversal)

> ⚠️ **A TOP é o elemento mais crítico do sistema.** Uma TOP mal configurada afeta estoque, financeiro, fiscal e WMS simultaneamente.

### Tipos de Movimento (TIPMOV)
- `C` = Compras | `V` = Vendas | `DC` = Devolução de Compra | `DV` = Devolução de Venda | `P` = Produção | `T` = Transferência

### O que a TOP controla
- Atualização de estoque ERP e/ou WMS
- Geração de título financeiro
- Cálculo de impostos
- Impressão de notas
- Comportamento no WMS (recebimento, expedição, romaneio)
- Tipo de giro (Venda Saída, Devolução Entrada, etc.)

### Campos críticos para indústria

| Campo | Descrição |
|---|---|
| `TOP p/ Faturamento` | TOP automática no faturamento de pedidos |
| `TOP p/ Transferência` | Transferência entre etapas de produção |
| `TOP p/ Devolução` | Para gerar nota com status "Enviada EPEC" |
| `Movimento Armazém` | Define comportamento no WMS (Romaneio / Recebimento / Expedição) |
| `Tipo de Giro` | Venda (Saída), Devolução de Venda (Entrada) |
| `Atualiza Estoque ERP` | Sim/Não |
| `Atualiza Estoque WMS` | Sim/Não |

### Regras TOP × WMS
- TOP para movimentações WMS internas deve atualizar **somente** estoque WMS (não o comercial)
- Campo "Modelo Estorno WMS - Dev. Compra" nas Preferências da Empresa é **obrigatório** para devolução WMS
- TOP de devolução WMS deve ser configurada em `TOPDEVOLUCAOWMS`

---

## 17. Expedição — Processo Completo

### Recebimento de mercadorias na Expedição
1. Liberação da descarga: Financeiro + PCP
2. Início da descarga: Expedição + Qualidade
3. Etiquetagem da mercadoria (WMS): Expedição
4. Conferência quantitativa: Expedição (verificar sistema — tela: Recebimentos de Mercadorias + formulário online)
5. Conferência qualitativa: Qualidade (amostragem durante descarregamento + formulário online)
6. Em caso de divergência: acionar PCP/Comercial
7. Liberação do veículo: Financeiro
8. Armazenagem (WMS): Expedição (físico + sistema)

### Expedição de mercadorias
1. Solicitação de separação: PCP
2. Separação das mercadorias: Expedição (físico + WMS)
3. Conferência quantitativa: Expedição (físico + WMS)
4. Impressão da Ordem de Carga: PCP
5. Início do carregamento: Expedição + Qualidade
6. Conferência V2 (quantitativa): Expedição (física conforme OC + formulário)
7. Conferência qualitativa V2: Qualidade (amostragem + formulário)
8. Em caso de divergência: acionar PCP/Comercial

> ⚠️ Formulário online deve ser preenchido durante todo o processo (recebimento e carregamento).
> ⚠️ Caso mercadoria separada não seja expedida em até 2 dias: informar PCP/Faturamento (produtos "descobertos" fiscalmente).

---

## 18. Problemas Identificados e Melhorias Planejadas

### Problema 1 — Apontamento tardio
- **Atual:** Tales aponta só quando o produto chega na expedição (fim do processo)
- **Impacto:** sem visibilidade do andamento durante a produção (o que está filetado, glaciado, etc.)
- **Ideal:** apontamento no momento exato em que cada etapa acontece (caixa pesada → lança no sistema)
- **Visão futura:** balança no início + QR code → automação com máquinas novas (Tiago)

### Problema 2 — Movimentação de MP não feita em tempo real
- **Atual:** Tales deveria fazer a movimentação 101→102 nos horários programados, mas nem sempre é possível (está fazendo apontamentos)
- **Proposta:** movimentação automática conforme caixas enviadas à produção (via pesagem)

### Problema 3 — Sem visão do que foi para produção no dia
- Portal de Movimentações não mostra tabela agrupada por dia
- **Necessidade:** relatório/tela mostrando tudo que foi para Local 102 no dia

### Problema 4 — OPs em aberto com erro / sem fechamento
- OPs ficam abertas por meses (algumas com erro)
- Fechamento manual e dependente de confirmação verbal com a produção
- **Risco:** fechar antes do fim → não consegue mais puxar MP ou fazer apontamentos
- **Necessidade:** mecanismo para sinalizar que o lote acabou sem fechar a OP prematuramente

### Problema 5 — Mapa de produção no Excel (manual e trabalhoso)
- Cálculo proporcional de insumos feito manualmente
- **Ideia:** campo na tela do Sankhya para informar quantos kg quer faturar → sistema gera o proporcional automaticamente

### Problema 6 — Planilha de lote MKT fora do Sankhya
- Controle de lotes MKT em Google Planilhas
- **Potencial:** migrar para dentro do Sankhya mantendo a rastreabilidade

### Ideia de melhoria — OPs intermediárias para rastreabilidade
- **OP 1:** MP (341) → Produto Glaciado (intermediário)
- **OP 2:** Produto Glaciado → Produto Acabado (embalado)
- Permite rastrear em qual etapa está cada quantidade durante o processo

---

## 19. API Sankhya — Referência de Integração

### Ambientes

| Ambiente | URL Base |
|---|---|
| **Produção** | `https://api.sankhya.com.br` |
| **Sandbox** | `https://api.sandbox.sankhya.com.br` |
| **MKT Produção** | `http://gtm.nuvemdatacom.com.br:9745/mge/` |
| **MKT Homologação** | `http://gtm.nuvemdatacom.com.br:9746/mge/` |

### Autenticação — OAuth 2.0 (recomendado)

> ⚠️ Fluxo legado (usuário+senha+appkey) descontinuado em **30/04/2026**. Migrar para OAuth 2.0.

```http
POST https://api.sankhya.com.br/authenticate
Content-Type: application/x-www-form-urlencoded
X-Token: TOKEN_DA_TELA_CONFIGURACOES_GATEWAY

grant_type=client_credentials&client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET
```

Retorna `access_token` (JWT) → usar como `Authorization: Bearer {token}`.

### CRUDServiceProvider — loadRecords (múltiplos registros)

```json
{
  "serviceName": "CRUDServiceProvider.loadRecords",
  "requestBody": {
    "dataSet": {
      "rootEntity": "Parametro",
      "includePresentationFields": "N",
      "offsetPage": "0",
      "criteria": {
        "expression": {"$": "NOMPAR LIKE ?"},
        "parameter": [{"$": "WMS%", "type": "S"}]
      },
      "entity": {"fieldset": {"list": "NOMPAR, VLRPAR, DESPAR"}}
    }
  }
}
```

> Limite: ~150 registros por página. Usar `offsetPage` para paginar.
> Tipos de parâmetro: `"I"` = inteiro | `"S"` = string | `"D"` = data | `"F"` = float

### DbExplorerSP — SQL Direto (somente SELECT)

```http
POST .../service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json
```
```json
{"serviceName": "DbExplorerSP.executeQuery", "requestBody": {"sql": "SELECT ..."}}
```

> ⚠️ Nunca executar UPDATE/DELETE via DbExplorer sem backup prévio. Usar método via browser (ver seção 21).

### APIs REST Modernas — Relevantes para Indústria

**Estoque:**
- `GET /estoque/{codigoProduto}` — estoque de um produto
- `GET /estoque/locais` — lista locais de estoque

**Produtos:**
- `GET /produtos/{codigo}/componentes` — BOM / fórmula de composição

**Logística / WMS:**
- `GET /ordens-carga` — lista ordens de carga
- `POST /ordens-carga` — incluir ordem de carga
- `GET /ordens-carga/{codigo}/pedidos` — pedidos de uma OC

**Vendas:**
- `POST /pedidos` — incluir pedido
- `GET /pedidos` — consultar pedidos

---

## 20. Queries SQL Prontas (Diagnóstico e Operação)

```sql
-- Módulos licenciados
SELECT CODMOD, DESCRICAO, DTLICENCA FROM AD_LICMOD
WHERE DTLICENCA >= SYSDATE OR DTLICENCA IS NULL ORDER BY CODMOD;

-- Parâmetros críticos WMS e Produção
SELECT NOMPAR, VLRPAR, DESPAR FROM TSIPAR
WHERE NOMPAR IN (
  'INTEGRAWMSPROD','UNALTPAWMS','APRCOMPLPROD','TOPDEVOLUCAOWMS',
  'SERIEDEVWMS','CONFENTRMANWMS','SUBESTDOCAWMS','REABCORRECAOWMS',
  'CORTEAUTLOTEWMS','LOTEDTVAL','WMSINFOADTAREFA','ENDECKTINDEF',
  'QUERYESTQPLP','COPITEMCOMPPRO','CONTROLAFATPED','ZERARQTDCONF','INATSESSTIMEOUT'
) ORDER BY NOMPAR;

-- TOPs ativas
SELECT CODTIPOPER, DESCROPER, TIPMOV, ATUESTOQUE, ATUFIN, GERANF
FROM TGFTOP WHERE ATIVO = 'S' ORDER BY TIPMOV, CODTIPOPER;

-- Ordens de Produção abertas
SELECT P.IDIPROC, P.NROLOTE AS LOTE_PROCESSO,
       PA.CODPRODPA, PR.DESCRPROD,
       PA.NROLOTE AS LOTE_PA, PA.QTDPRODUZIR,
       PA.CONCLUIDO, P.STATUSPROC, P.DTPREVENT, P.CODPLP
FROM TPRIPROC P
INNER JOIN TPRIPA PA ON PA.IDIPROC = P.IDIPROC
INNER JOIN TGFPRO PR ON PR.CODPROD = PA.CODPRODPA
WHERE P.STATUSPROC NOT IN ('F', 'C')
ORDER BY P.DTPREVENT, P.IDIPROC;

-- Buscar OP por número de lote
SELECT P.IDIPROC, P.NROLOTE, PA.CODPRODPA, PR.DESCRPROD,
       PA.QTDPRODUZIR, P.STATUSPROC
FROM TPRIPROC P
INNER JOIN TPRIPA PA ON PA.IDIPROC = P.IDIPROC
INNER JOIN TGFPRO PR ON PR.CODPROD = PA.CODPRODPA
WHERE P.NROLOTE = :lote OR PA.NROLOTE = :lote;

-- Divergência Estoque ERP vs WMS
-- ERP:
SELECT S.CODPROD, P.DESCRPROD, S.CODEMP, SUM(S.ESTOQUE) AS EST_ERP
FROM TGFEST S INNER JOIN TGFPRO P ON P.CODPROD = S.CODPROD
GROUP BY S.CODPROD, P.DESCRPROD, S.CODEMP ORDER BY S.CODPROD;
-- WMS:
SELECT E.CODPROD, P.DESCRPROD, E.CODEMP, SUM(E.QTDATUAL) AS EST_WMS
FROM TGFEND E INNER JOIN TGFPRO P ON P.CODPROD = E.CODPROD
GROUP BY E.CODPROD, P.DESCRPROD, E.CODEMP ORDER BY E.CODPROD;

-- BOM / Fórmulas de composição
SELECT P.CODPROD, P.DESCRPROD, COUNT(C.CODPRODMP) AS QTD_COMPONENTES
FROM TGFPRO P INNER JOIN AD_COMPROD C ON C.CODPROD = P.CODPROD
GROUP BY P.CODPROD, P.DESCRPROD ORDER BY P.CODPROD;

-- Pedidos de compra pendentes
SELECT C.NUNOTA, C.DTNEG, I.CODPROD, P.DESCRPROD,
       I.QTDNEG, NVL(I.QTDENTREGUE,0) AS ENTREGUE,
       (I.QTDNEG - NVL(I.QTDENTREGUE,0)) AS SALDO_PENDENTE
FROM TGFCAB C
INNER JOIN TGFITE I ON I.NUNOTA = C.NUNOTA
INNER JOIN TGFPRO P ON P.CODPROD = I.CODPROD
WHERE C.TIPMOV = 'C' AND C.STATUSNOTA = 'P'
ORDER BY C.DTNEG;

-- Estoque por local (produção) — Locais 101, 102, 103, 104
SELECT S.CODPROD, P.DESCRPROD, S.CODLOCAL, SUM(S.ESTOQUE) AS ESTOQUE
FROM TGFEST S
INNER JOIN TGFPRO P ON P.CODPROD = S.CODPROD
WHERE S.CODLOCAL IN (101, 102, 103, 104)
GROUP BY S.CODPROD, P.DESCRPROD, S.CODLOCAL
ORDER BY S.CODPROD, S.CODLOCAL;
```

---

## 21. UPDATE de Campos no Sankhya — Método Definitivo

> ⚠️ **REGRA ABSOLUTA:** NUNCA usar `sankhya_execute`, `sankhya_rest`, `sankhya_save`, `sankhya_sql` ou qualquer MCP tool para fazer UPDATE.
> **SEMPRE usar** `javascript_tool` no tab do Sankhya (porta 9745) com `XMLHttpRequest` e `Content-Type: text/xml`.

### Fluxo obrigatório

**Passo 1 — Buscar registros via `sankhya_sql`**
```sql
SELECT FIN.NUFIN, CONVERT(VARCHAR(10), CAB.DTMOV, 103) AS DTMOV_FMT
FROM TGFFIN FIN
INNER JOIN TGFCAB CAB ON FIN.NUNOTA = CAB.NUNOTA
WHERE FIN.DTVENC = '{YYYYMMDD}' AND FIN.AD_DTCOP IS NULL
```

**Passo 2 — Executar UPDATE via `javascript_tool` no browser (porta 9745)**
```javascript
var records = [{nufin: 123290, dt: "18/01/2026"}, /* ... */];
var mgeSession = 'SESSION_DO_TAB_ATIVO';
var url = 'http://gtm.nuvemdatacom.com.br:9745/mge/service.sbr?serviceName=CRUDServiceProvider.saveRecord&outputType=xml&mgeSession=' + mgeSession;
var success = 0, errors = [];

for (var i = 0; i < records.length; i++) {
  var r = records[i];
  var xml = '<serviceRequest serviceName="CRUDServiceProvider.saveRecord"><requestBody>' +
    '<dataSet rootEntity="Financeiro" includePresentationFields="S" parallelFields="false">' +
    '<entity path=""><fieldset list="NUFIN,AD_DTCOP"/></entity>' +
    '<dataRow><localFields><NUFIN>' + r.nufin + '</NUFIN><AD_DTCOP>' + r.dt + ' 00:00:00</AD_DTCOP></localFields>' +
    '<key><NUFIN>' + r.nufin + '</NUFIN></key></dataRow></dataSet></requestBody></serviceRequest>';
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, false);
  xhr.setRequestHeader('Content-Type', 'text/xml');
  xhr.send(xml);
  if (xhr.responseText.indexOf('status="1"') >= 0) success++;
  else errors.push({nufin: r.nufin, resp: xhr.responseText.substring(0, 200)});
}
JSON.stringify({total: records.length, success: success, errors: errors});
```

**Passo 3 — Verificar via `sankhya_sql`**
```sql
SELECT COUNT(*) AS RESTAM_NULOS
FROM TGFFIN WHERE DTVENC = '{YYYYMMDD}' AND AD_DTCOP IS NULL;
-- Deve retornar 0
```

### Por que os outros métodos não funcionam

| Método | Erro |
|---|---|
| `DbExplorerSP.executeQuery` com UPDATE | "Expected EOF at line 1 column 17" — rejeita DML |
| `DatasetSP.save` / `sankhya_save` | Erro de validação ou muda para INSERT |
| `CRUDServiceProvider.saveRecord` via JSON (`outputType=json`) | "Expected EOF" |
| `CRUDServiceProvider.saveRecord` com atributos XML (`value=""`) | "EntityPrimaryKey não pode ser null" |
| Cloud gateway (`api.sankhya.com.br`) | Retorna "JsonObject" silencioso — não executa DML |

### Formato XML (crítico)
```xml
<!-- ✅ CORRETO — text content -->
<NUFIN>123290</NUFIN>

<!-- ❌ ERRADO — atributo -->
<NUFIN value="123290"/>
```

---

## 22. Tabelas Principais do Banco (Referência Rápida)

| Tabela | Entidade loadRecords | Descrição |
|---|---|---|
| `TGFCAB` | `CabecalhoNota` | Cabeçalho de notas/pedidos |
| `TGFITE` | `ItemNota` | Itens de notas/pedidos |
| `TGFTOP` | `TipoOperacao` | Tipos de Operação |
| `TGFPRO` | `Produto` | Cadastro de Produtos |
| `TGFPAR` | `Parceiro` | Cadastro de Parceiros |
| `TGFEST` | `Estoque` | Saldos de Estoque ERP |
| `TGFEND` | — | Endereçamento WMS |
| `TSIEMP` | `Empresa` | Cadastro de Empresas |
| `TSIPAR` | `Parametro` | Parâmetros do Sistema |
| `TGFFIN` | `Financeiro` | Títulos financeiros |
| `AD_LICMOD` | — | Módulos Licenciados |
| `AD_ETPROD` | — | Estruturas de Produção |
| `AD_COMPROD` | — | Fórmula de Composição (BOM) |
| `AD_PLANPROD` | — | Planejamentos de Produção |
| `TPRIPROC` | `CabecalhoInstanciaProcesso` | Cabeçalho das OPs (tela Nova) |
| `TPRIPA` | — | Produto Acabado vinculado à OP |

---

## 23. Pontos de Integração Sankhya × Operação Física

| Evento físico | Ação no Sankhya | Responsável |
|---|---|---|
| Carga chega com NF | Ajustar quantidade no pedido de compra | Responsável programação |
| NF conferida | Enviar para WMS (Recebimento) — informa Data + Doca | Brenda |
| Conferência física concluída | Concluir recebimento no WMS (coletor) | Davidson |
| NF finalizada no WMS | Finalizar entrada da nota | Brenda |
| MP enviada à produção | Movimentação acessória 101→102 + confirmar nota + tarefa WMS | Tales |
| Tarefa WMS de movimentação concluída | Saldo muda 101→102 no comercial | Davidson |
| Produto acabado contado/pesado | Apontamento na OP (horários: 09h / 11h / 14h30 / 16h) | Tales |
| Apontamento feito | Movimentação acessória 104→103 + confirmar nota + tarefa WMS | Tales |
| Produto armazenado (Local 103) | Separação WMS para faturamento | Davidson |
| Separação WMS concluída | Faturamento da nota | Brenda |

---

## 24. Alertas Permanentes (Síntese)

> ⚠️ **TOP** é o elemento mais crítico — uma TOP mal configurada afeta estoque, financeiro, fiscal e WMS simultaneamente.

> ⚠️ **WMS × Estoque Comercial** são saldos independentes — divergências causam problemas graves. Usar Verificação de Saldos do MGEConfig para diagnóstico.

> ⚠️ **Parâmetros de sistema** exigem limpeza de cache para ter efeito após alteração.

> ⚠️ **INTEGRAWMSPROD** deve ser avaliado caso a caso antes de ativar.

> ⚠️ **UPDATE no Sankhya** só funciona via `javascript_tool` no browser com `CRUDServiceProvider.saveRecord` em XML. Todos os outros métodos falham.

> ⚠️ **Movimentações WMS vinculadas** impedem alterações no sistema — resolver divergências ANTES de prosseguir.

> ⚠️ **Apontamento** não pode atrasar — a partir da confirmação no WMS a operação não pode ser desfeita.

> ⚠️ **Fluxo de autenticação legado** (appkey+token) descontinuado em **30/04/2026** — migrar para OAuth 2.0.

---

## 25. Estado Atual do Projeto / Próximos Passos

> Seção viva — atualizar ao final de cada sessão relevante.

### Soluções em desenvolvimento / planejadas

| Solução | Status | Descrição |
|---|---|---|
| Mapa de Produção automatizado | Levantamento | Campo no Sankhya para calcular proporcional de insumos por kg faturado |
| Migração lote MKT para Sankhya | Levantamento | Eliminar dependência do Google Planilhas para rastreabilidade |
| Relatório de MP por dia (Local 102) | Levantamento | Visão diária do que foi para produção |
| Mecanismo de encerramento de lote | Levantamento | Sinalizar fim de lote sem fechar OP prematuramente |
| OPs intermediárias | Levantamento | Rastrear etapas (filetagem, glaceamento) separadamente |
| Apontamento em tempo real | Visão futura | Balança + QR code → integração com máquinas novas |

### Decisões de arquitetura registradas

| Decisão | Motivo | Data |
|---|---|---|
| UPDATE via javascript_tool (CRUDServiceProvider.saveRecord XML) | Único método que funciona para DML via API/browser no ambiente GTM | 2026 |

### Configurações mapeadas no ambiente GTM

| Configuração | Valor/Status |
|---|---|
| Locais de estoque produção | 101 (MP), 102 (Em Processo), 103 (Acabado), 104 (Processado) |
| Produto MP principal | Produto 341 |
| Lote MKT formato | NNN.AA (ex: 077.26) |
| Volume padrão por lote | 175 caixas × 20 kg = 3.500 kg |
| Rendimento médio processamento | ~31% (MP → produto acabado) |
| `INTEGRAWMSPROD` | A verificar |

### Próximos passos sugeridos

- [ ] Mapear TOPs ativas e suas configurações de estoque (ERP e WMS)
- [ ] Verificar parâmetros críticos no ambiente de produção via API
- [ ] Levantar status das OPs em aberto (query seção 20)
- [ ] Definir escopo e prioridade das soluções em desenvolvimento
- [ ] Avaliar `INTEGRAWMSPROD` — impacto de ativar ou manter desativado
- [ ] Planejar migração do lote MKT para dentro do Sankhya

---

---

## 26. TOPs Mapeadas no Ambiente GTM/MKT

> Fonte: POPs operacionais (MKT) + conversas com Brenda e Giovanni.

### Compras (Entrada)

| TOP | Descrição | Quando usar |
|---|---|---|
| **100** | Pedido de Compra (MP produção própria) | Compra de MP para industrialização própria |
| **104** | Pedido de Compra (terceiros) | Compra de MP para industrialização de terceiros |
| **205** | Entrada de compra para revenda | Produtos provenientes de compra para revenda |
| **214** | Entrada de industrialização própria | Produtos de industrialização própria |
| **215** | Entrada de bonificação/brinde | Produtos de bonificação ou brinde |
| **227** | Entrada de bonificação/brinde para revenda | Bonificação/brinde de produtos que podem ser revendidos |
| **230** | Entrada de industrialização para terceiros | Produtos industrializados para terceiros |
| **231** | Entrada de armazenagem | Produtos destinados a armazenagem |

### Vendas (Saída)

| TOP | Descrição | Quando usar |
|---|---|---|
| **1002** | Pedido de Industrialização (MKT) | Pedido de venda de produtos de terceiros |
| **1003** | Pedido de Venda (MKT) | Pedido de venda de produtos próprios |
| **1100** | Venda de peixe (revenda) | NF de saída — peixe para revenda |
| **1103** | Industrialização própria (saída) | NF de saída — produtos de industrialização própria |
| **1105** | Industrialização para terceiros (saída) | NF de saída — industrialização para terceiros |
| **1107** | Venda de frango | NF de saída — frango |
| **1117** | Bonificação/brinde (saída) | NF de saída — bonificação ou brinde |
| **232** | Saída de armazenagem | Retorno de mercadoria de armazenagem |

> ⚠️ **Regra TOP × valor unitário:** nas TOPs 1100 e 1107, o valor unitário NÃO é ajustado na nota. Nas demais (1103, 1105), o valor deve ser ajustado conforme o mapa de produção.

### Campos de controle no pedido de venda
- **Liberador:** Bruno (código 31) — deve ser informado ao confirmar o pedido
- **Empresa:** sempre `2 – MKT BENEFICIADORA E IMPORTADORA`
- **Centro de Resultado:** 20201 – Compras
- **Natureza:** 4010101 – Custo das Mercadorias
- **Pedido por produto:** SEMPRE um pedido por produto (vinculado à OP)

---

## 27. Docas Mapeadas no Armazém MKT

| Doca | Descrição | Uso |
|---|---|---|
| **8** | SP LINHA 1 | Envio de MP para produção — Linha 1 |
| **9** | SP LINHA 2 | Envio de MP para produção — Linha 2 |
| **13** | Produto Processado | Recebimento de produto acabado (Local 104 → 103) |

> Observação: a doca de recebimento de MP (matéria-prima chegando da estância/fornecedor) é informada no momento do envio para WMS pela Brenda.

---

## 28. Telas do Sistema — Nomes Exatos

> Referência para busca no campo "Localizar" do Sankhya.

| Tela | Função principal |
|---|---|
| **Portal de Compras** | Criação e gestão de pedidos de compra |
| **Portal de Importação XML** | Entrada de NF via XML (importação de notas de fornecedores) |
| **Portal de Vendas** | Criação e gestão de pedidos de venda / faturamento |
| **Portal de Mov. Internas** | Consulta e envio de movimentações acessórias para WMS |
| **Central de Compras** | Edição detalhada de uma nota/pedido de compra |
| **Central de Vendas** | Edição detalhada de uma nota/pedido de venda |
| **Ordens de Produção - Nova** | Criação e listagem de OPs (entidade: `CabecalhoInstanciaProcesso`) |
| **Operações de Produção** | Execução das OPs: movimentações, apontamentos, etapas |
| **Composição do Produto** | BOM / fórmula de composição dos produtos acabados |
| **Mapa de Produção - Sintético** | Relatório de custo e consumo por OP |
| **Etiquetas de Produção** | Consulta de etiquetas geradas (by produto / apontamento) |
| **Etiqueta de Produto Acabado** | Impressão de etiquetas WMS de produto acabado (90×50mm) |
| **Impressão de Etiqueta** | Impressão de etiquetas WMS para recebimento |
| **Recebimento de Mercadorias** | Acompanhamento de recebimentos em andamento no WMS |
| **Expedição de Mercadorias** | Acompanhamento de expedições em andamento no WMS |
| **Inventários** | Criação e gestão de inventários físicos |
| **Geração de Tarefas de Contagem** | Gera tarefas de contagem por endereço para inventário |
| **Ajuste de Estoque por Inventário** | Ajuste de saldo WMS após inventário |
| **Visão de Estoque** | Consulta de saldo de estoque por produto/local |

---

## 29. Atividades do Coletor WMS (SuperWaba — MC 3100)

### Configuração do Coletor (URL)
- URL: `gtm.nuvemdatacom.com.br`
- Porta: `9745`
- Aplicativo: SuperWaba → pasta WMS

### Funções disponíveis no coletor

| Função | Quando usar |
|---|---|
| **Separação Balcão** | Separação padrão de produtos (saída para cliente ou produção) |
| **Separação** | Separação de venda direta |
| **Conferência** | Conferência de produto recebido ou separado |
| **Recontagem** | Recontagem após divergência na conferência |
| **Movimentação Pró-Ativa** | Armazenagem de produto (da doca para o endereço definitivo) |
| **Contagem de Estoque** | Execução de inventário por endereço |

### Fluxo de separação no coletor (padrão)
1. Selecionar **Separação Balcão** → vincular código do equipamento → clicar **Tarefa**
2. Ir ao local indicado → bipar endereço de origem (campo Origem) → bipar código lateral da etiqueta WMS (campo Produto)
3. Clicar **Enter** → levar para doca indicada → bipar endereço da doca de destino

### Fluxo de conferência no coletor
1. Selecionar **Conferência** → clicar **Conferência**
2. Campo **Doca**: bipar código de barras da doca
3. Campo **Produto**: bipar código horizontal das etiquetas WMS (bipar a quantidade total de etiquetas)
4. Clicar **Enviar** ao final

### Fluxo de armazenagem no coletor
1. Selecionar **Movimentação Pró-Ativa** → clicar **Moviment.**
2. Campo **Endereço**: bipar doca com os produtos a armazenar
3. Campo **Produto**: bipar código lateral do produto → selecionar quantidade → clicar **Confirmar**
4. Clicar **Destino** → selecionar produto → informar endereço de destino e quantidade → **Confirmar**

---

## 30. Etapas da OP — Tela "Operações de Produção" (Detalhado)

### Etapas por tipo de OP

| Etapa | OP Terceiros | OP Própria |
|---|---|---|
| Separação de MPs | ✅ (manter aberta) | ✅ (manter aberta) |
| Embalamento | — | ✅ (manter aberta) |
| Produção / Venda | ✅ (manter aberta) | — |
| Retorno Simbólico | ✅ (manter aberta) | — |

> ⚠️ As etapas marcadas como "manter aberta" são as que geram movimentações e não devem ser finalizadas até o encerramento da OP.

### Sequência de execução (POP 2.01.004 — Giovanne Rodrigues)

**Passo 1 — Iniciar etapa de Separação de MP**
1. Filtrar OP na tela "Operações de Produção"
2. Iniciar primeira etapa (confirmar abertura)
3. Na sub-aba **Mov. Acessórias**: verificar se movimentação de embalagem/rotulagem está correta; ajustar se necessário

**Passo 2 — Solicitar MP (Peixe) para Produção**
1. Sub-aba **Mov. Acessórias** → botão **"+ Movimentação"**
2. Selecionar operação: **"Transferência de Materiais Terc. p/ Industrialização"** → **Próximo**
3. Validar MP e quantidade → incluir mais MPs se necessário (ícone "+")
4. Clicar **Concluir** → confirmar movimentação → copiar **Nro. Único**
5. Abrir **Portal de Mov. Internas** → filtrar pelo Nro. Único → **Aplicar**
6. Clicar em "..." → **"Enviar para o WMS (Expedição)"**
7. Informar Doca: `8 – SP LINHA 1` ou `9 – SP LINHA 2` → **OK**
8. Repetir quantas vezes necessário até consumir todo volume da OP

**Passo 3 — WMS: Separação e Conferência (Davidson)**
- Separação Balcão → bipar origem + etiqueta lateral
- Conferência → bipar doca + etiqueta horizontal (total de volumes)

**Passo 4 — Liberar Doca (após cada lote de separação)**
1. Abrir tela **"Expedição de Mercadorias"**
2. Filtrar: Empresa 2 + Período D-1
3. Selecionar item com situação **"Conferência Validada"** → "..." → **"Liberar Doca"**
> ⚠️ A doca DEVE ser liberada antes de enviar nova separação. Caso contrário, não aparece como opção.

**Passo 5 — Avançar etapas de produção**
- Na sub-aba **Apontamentos**: apontar 1 unidade na etapa de Separação (abre próxima etapa)
- Iniciar e finalizar etapas intermediárias até chegar em **"Retorno Simbólico"** e **"Produção / Venda"**
- Iniciar essas duas etapas (mantê-las abertas)

**Passo 6 — Apontamento de Produção**
1. Etapa **"Produção/Venda"** iniciada → sub-aba **Apontamentos** → ícone "+"
2. Informar **Qtd. Apontada** (kg produzidos)
3. Sistema calcula baixa proporcional de materiais automaticamente
4. Conferir sub-aba **Materiais** → ajustar se necessário → **Confirmar**
5. Quando aparecer mensagem de confirmação: SEMPRE clicar **"Não"** (clicar "Sim" bloqueia novos apontamentos na OP)
> ⚠️ Baixas só possíveis se MP estiver no local **"102 – Produto em Processo"**

**Diferença OP Terceiros vs Própria no apontamento:**
- **OP Própria:** baixa a matéria-prima principal (peixe) no apontamento
- **OP Terceiros:** NÃO baixa o peixe; ele é devolvido ao terceiro na etapa **"Retorno Simbólico"**

**Passo 7 — Envio de Produto Acabado para Expedição (104 → 103)**
1. Sub-aba **Mov. Acessórias** → **"+ Nova Movimentação"**
2. Selecionar operação: **"Transferência P/ Acabado"** → **Próximo**
3. Ícone "+" → preencher: Produto (código do PA), Qtde. a Movimentar (kg), Unidade (KG)
4. Salvar → **Concluir** → confirmar
5. Copiar **Nro. Único** → abrir **Portal de Mov. Internas** → filtrar → **Aplicar**
6. Clicar "..." → **"Enviar para o WMS (Recebimento)"**
7. Doca: `13 – Produto Processado` → **OK**
> Só fazer quando produto for para armazenagem definitiva na câmara. Se o palete voltar para a linha em até 24h, pode postergar.

**Passo 8 — Impressão de Etiquetas WMS (Produto Acabado)**
1. Abrir tela **"Etiquetas de Produção"** → selecionar produto → setinha canto superior direito → **"Etiqueta de Produto Acabado"**
2. Preencher: Peso (kg/caixa), DT. Validade, Qtde. Volume, Nro. Lote
3. **Visualizar Relatório** → imprimir (tamanho: 90×50mm)

**Regra de etiquetagem:**
- **Caixa a caixa:** GTM (Bem Fresco, Q-pescado) e Cód. 372 Pesquali
- **Palete a palete:** demais produtos de terceiros

---

## 31. Processo de Entrada de NF pela Brenda — Detalhado

> Fonte: conversa gravada com Brenda sobre processo fiscal.

### Fluxo via Portal de Importação XML

1. **Brenda** acessa tela **"Portal de Importação XML"**
2. Filtra por TOP e Período de Importação → **Aplicar** → informa TOP no pop-up
3. Localiza a NF da estância → duplo clique para abrir
4. Na aba Produtos: verifica se produto está puxando corretamente
5. Na aba Pedidos: verifica se existe pedido vinculado e se as quantidades batem
   - Se quantidade divergente → pede ao Lucas (Tales) para criar ou alterar o pedido
   - Se valor unitário divergente → pede ao Lucas para ajustar
6. Vincula o pedido de compra à nota
7. Abre o documento → vai para **Central de Compras**
8. Preenche apenas o campo de gelo (NF da estância vem acompanhada de nota de gelo)
9. Verifica data de emissão e vencimento → **NÃO confirma** aqui
10. Fecha Central de Compras → volta ao **Portal de Importação XML**
11. Clica **Aplicar** novamente (sistema reprocessa e busca a nota novamente)
12. Clica **"Enviar para o WMS (Recebimento)"** → informa Data + Doca → **Confirmar**
13. Davidson faz conferência no WMS
14. Após confirmação do Davidson, a nota se torna definitiva no sistema

> ⚠️ **Ponto crítico:** Brenda NÃO pode confirmar a nota no Portal de Compras diretamente — precisa voltar ao Portal XML e aplicar novamente para que o botão de envio ao WMS fique disponível.

### TOPs usadas por Brenda na entrada de NF

| Produto/Situação | TOP |
|---|---|
| Compra para revenda | 205 |
| Industrialização própria | 214 |
| Bonificação/brinde | 215 |
| Bonificação/brinde para revenda | 227 |
| Industrialização para terceiros | 230 |
| Armazenagem | 231 |

### Processo fiscal (Giovanni — Processo 7)
- Usado para produtos que fazem apenas o processo fiscal (OP fictícia)
- Produto não passa fisicamente pela linha de produção
- OP criada apenas para gerar a nota fiscal de retorno

---

## 32. Processo de Inventário (WMS)

> Fonte: POP 10.01.001 — Matheus Felipe.

### Quando fazer
- Preferencialmente em data com pouca/nenhuma movimentação
- Com notas de compra já no estoque e notas de venda já baixadas

### Tipos de inventário
- **Geral:** todo o estoque da empresa
- **Parcial:** parte do estoque (por local, grupo, etc.)
- **Cíclico:** por período definido (diário, semanal, etc.) — recomendado para controle contínuo

### Fluxo no Sankhya (WMS)

1. **Tela "Inventários"** → Novo → preencher Dt. Inicial, Tipo (Global), Empresa → Salvar
2. **Tela "Geração de Tarefas de Contagem"** → filtrar pelo código do inventário → Aplicar → **Gerar Tarefas**
3. **No coletor (SuperWaba)** → Contagem de Estoque → Tarefa
4. Por endereço: bipar código do endereço → bipar produto + quantidade → Enviar
5. **Tela "Ajuste de Estoque por Inventário"** → filtrar inventário → **Gerar Ajuste**
6. Produtos divergentes aparecem em vermelho (sobra/falta) → ajuste aplicado

### Justificativas obrigatórias
Campos da planilha de divergências: Código, Produto, Empresa, Poder, Parceiro, Local, Peso Líquido, Estoque Sistema, Estoque Físico, Diferença, Status (Sobra/Falta/Perda), Justificativa.

> Relatório de divergências deve ser apresentado à Diretoria.

> ⚠️ **Ajuste imediato:** realizar logo após o inventário; durante o ajuste, não é possível fazer movimentações de entrada e saída.

---

## 33. Processo de Faturamento — Detalhado (POP 9.01.001)

### Passo 1 — PCP envia para WMS (Tales)
1. Portal de Vendas → localizar pedido → Outras Opções → **"Enviar para o WMS (Expedição)"**
2. Informar data de separação e doca → OK
3. Entregar **Mapa de Produção** para Faturamento com data prevista

### Passo 2 — Separação e Conferência WMS (Davidson)
- Separação Balcão → bipar origem + etiqueta lateral → levar para doca → bipar doca destino
- Conferência → bipar doca + etiquetas horizontais → Enviar
- Em caso de divergência: Recontagem; segunda divergência: acionar Gerente de Produção

### Passo 3 — Faturamento (Brenda)
> O sistema só permite faturar quando a situação é **"Conferência Validada"**

1. Portal de Vendas → localizar pedido → **Faturar**
2. Pop-up: informar data de faturamento → Próximo
3. Selecionar TOP, Série, Data e Hora da Saída → Concluir (abre Central de Vendas)
4. Aba Cabeçalho: inserir observações que sairão na nota
5. Aba Itens: ajustar valor unitário (conforme Mapa de Produção) → Salvar
6. Aba Rodapé → sub-aba Financeiro → Novo → preencher:
   - Dt. Vencimento, Vlr. do Desdobramento, Tipo de Título, Banco, Conta Bancária → Salvar
7. **Confirmar** a nota
8. Tela **"Expedição de Mercadorias"** → selecionar linha → Outras Opções → **"Liberar Doca"**

> Nota: o valor unitário NÃO é ajustado nas TOPs 1100 e 1107. Nas demais, ajustar conforme mapa.

---

## 34. Rastreabilidade — Visão e Gaps (Fonte: conversas gravadas)

### O que existe hoje (estado atual)
- Rastreabilidade principal: **planilha Google Planilhas** com lote MKT (Isabela/Natália)
- Não existe rastreabilidade digital integrada do campo (estância) até o cliente final
- Os dados da NF de entrada, lote de produção e produto acabado não estão conectados no Sankhya

### O que Natália (qualidade) precisa
- Histórico completo: data de saída da NF da estância → chegada → produção → lote PA → cliente final
- Capacidade de rastrear por lote: dado um lote, saber de qual NF de MP veio e para qual cliente foi

### Visão técnica levantada (conversa com Thiago)
- O sistema WMS é orientado a **etiquetas de palete** (não caixa individual, exceto no picking)
- Todo movimento WMS acontece por unidade de palete
- A etiqueta WMS é a "chave" de rastreabilidade dentro do armazém
- O ato de imprimir a etiqueta de produto acabado já alimenta o estoque WMS
- O ponto crítico de rastreabilidade é vincular o lote MKT (que vem da MP) ao lote de PA (que vai para a etiqueta WMS)
- Automação futura: na hora de tirar do estoque WMS → já deve haver pedido de venda pronto; o ato de separar/conferir = alimentar o pedido

### Proposta de solução discutida
- Usar o **lote MKT** como elo de rastreabilidade entre a NF de entrada e a OP
- O número do lote entra no `NROLOTE` da `TPRIPROC` e `TPRIPA`
- Com isso, é possível navegar: NF entrada (TGFCAB) → lote MKT → OP (TPRIPROC/TPRIPA) → apontamento → etiqueta WMS → NF de saída (TGFCAB)

---

*Documento consolidado em 21/03/2026 — Projeto Sankhya ERP Soluções × GTM Alimentos / MKT*
